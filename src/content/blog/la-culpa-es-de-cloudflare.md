---
title: "\"Desde que pusieron Cloudflare, el sitio está lento\": cómo lo descarté con dos curl"
description: "Un cliente de hosting culpaba a Cloudflare de que su WordPress casi no cargara. Dos mediciones de TTFB, una contra el sitio y otra contra un PHP vacío, separaron al servidor de la aplicación."
date: 2026-10-14
category: Dev
tags: [WordPress, TTFB, Cloudflare, Hosting]
featured: false
---

En el trabajo nos escribió un cliente de hosting: desde que su sitio pasó a usar Cloudflare, el WordPress estaba "cada vez más lento", casi no se podía navegar, y ya lo habían revisado con su proveedor web sin resultados. Si no se arreglaba, se cambiaban de hosting. Adjuntaban un informe de PageSpeed como prueba.

El cliente tenía contratado solo el hosting. Optimizar su WordPress no era parte del servicio, así que lo primero era saber de qué lado estaba el problema: el servidor o el sitio.

## Lo que decía PageSpeed

El informe de escritorio daba **47 de 100 en rendimiento**, y el resto (accesibilidad, buenas prácticas, SEO) estaba bien. Traía dos tipos de números:

- **La prueba de laboratorio**, una carga simulada en ese momento: LCP de 3,2 s (lo que tarda en aparecer el elemento más grande, normalmente un banner), 620 ms de JavaScript bloqueando la página e imágenes sin comprimir.
- **Los usuarios reales de los últimos 28 días**, medidos por Chrome: LCP de 9,6 s y un TTFB de **más de 8 segundos**.

El TTFB (*time to first byte*) es lo que tarda en llegar el primer byte de la respuesta, y es el único de esos números donde el hosting tiene algo que decir. Pero no es solo del servidor: incluye la red, PHP, WordPress, el tema, los plugins y la base de datos. Un TTFB alto no dice quién tiene la culpa. Había que separarlo.

## Dos curl, misma ruta

La idea es medir dos cosas que pasan por exactamente el mismo camino (la misma red, el mismo Cloudflare si está en el medio, el mismo servidor y el mismo PHP) y que solo se diferencian en WordPress:

1. La portada del sitio, que carga todo WordPress.
2. Un archivo PHP casi vacío en el mismo dominio, que no carga nada.

```php title="test.php · lo más chico que pasa por PHP"
<?php echo 'ok';
```

```bash title="bash · TTFB de cada uno (el dominio es de ejemplo)"
curl -o /dev/null -s -w 'TTFB %{time_starttransfer}s\n' https://ejemplo.cl/
curl -o /dev/null -s -w 'TTFB %{time_starttransfer}s\n' https://ejemplo.cl/test.php
```

El resultado:

| Qué se pidió | TTFB |
|---|---|
| `test.php` | 0,61 s |
| La portada (WordPress) | 4,85 s |

Si Cloudflare o el servidor fueran el problema, `test.php` también sería lento: pasa por los mismos dos. Respondía en 0,61 s, normal para un hosting compartido. **Los 4,2 segundos de diferencia eran WordPress.**

Si quieres ver en qué parte se va el tiempo, curl lo desglosa:

```bash title="bash · DNS, conexión, TLS, primer byte y total"
curl -o /dev/null -s -w 'dns %{time_namelookup}  conexión %{time_connect}  tls %{time_appconnect}  ttfb %{time_starttransfer}  total %{time_total}\n' https://ejemplo.cl/
```

> [!WARNING] Borra el test.php al terminar
> Un PHP de prueba olvidado en un servidor es un archivo que nadie revisa. Este no hace nada, pero los que se copian de internet a veces llaman a phpinfo(), que muestra la configuración completa del servidor.

## Lo que había en el sitio

Revisando lo que sí estaba en nuestro alcance, encontramos en `wp-config.php` rastros de un plugin de caché, pero no las líneas que lo activan. Todo indicaba que el sitio no estaba usando caché de página, y eso solo puede explicar buena parte de un TTFB así: sin caché, WordPress arma la portada completa en cada visita.

Desde el hosting subimos el límite de memoria de WordPress, que sí era parte de nuestro trabajo:

```php title="wp-config.php · más memoria para WordPress"
define('WP_MEMORY_LIMIT', '256M');
define('WP_MAX_MEMORY_LIMIT', '512M');
```

Para ser honesto, eso no acelera un sitio que no se está quedando sin memoria. Lo que movía la aguja estaba del lado del sitio: activar la caché de verdad, revisar los plugins, comprimir las imágenes y aliviar el primer bloque de la portada.

## La respuesta

Le respondimos con los dos números, explicando en simple qué mide cada uno, y con la lista de lo que le tocaba al sitio. Lo más difícil fue el tono: decirle a un cliente molesto "el problema no es nuestro" sin que suene a lavarse las manos. Lo que funcionó fue dejar que los números hablaran y ofrecer el camino para arreglarlo.

## Lo que me llevo

- "Desde que cambiamos X, todo anda lento" es una pista, no un diagnóstico. A veces X solo hizo visible algo que ya estaba.
- Para culpar a una capa, mide con y sin ella. Dos mediciones por el mismo camino, que solo se diferencian en una pieza, dicen más que cualquier informe.
- El TTFB no es del hosting: es de todo lo que pasa antes del primer byte.
- Los archivos de prueba se borran el mismo día.
- Lee tú los números de una captura. Al revisarla para este post, un TTFB de 1,9 s que ChatGPT había leído del informe no aparece en ninguna parte.
