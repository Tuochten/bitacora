---
title: "Un plugin abandonado con una vulnerabilidad pública: se lo avisé a su autor y nadie contestó"
description: "Un plugin de WooCommerce pensado para tiendas chilenas tiene un CSRF publicado desde 2023 y ningún parche. Cómo funciona la falla, qué pasó cuando lo reporté y qué hacer si tu tienda lo usa."
date: 2026-10-11
category: Ciberseguridad
tags: [WordPress, CSRF, CVE, WooCommerce]
featured: false
---

Revisando alertas de seguridad de plugins de WordPress, me topé con uno que conocía bien: **MkRapel Regiones y Ciudades de Chile para WC**, que agrega las regiones y comunas de Chile al checkout de WooCommerce. Es de esos plugins que se instalan una vez y nadie vuelve a mirar. Tenía una vulnerabilidad publicada, la **CVE-2023-48781**, y ningún parche.

## Qué dice el CVE

Según el registro oficial (NVD), es un **CSRF** (CWE-352) que afecta a todas las versiones hasta la 4.3.0, publicado en diciembre de 2023. Tiene dos puntajes: el NVD le da 4,3 (medio) y Patchstack, que lo reportó, 8,8 (alto). La diferencia está en cuánto daño le asume cada uno a la falla.

Un CSRF (*cross-site request forgery*) funciona así: un administrador del sitio tiene su sesión abierta y visita una página preparada por el atacante. Esa página le hace a su navegador enviar, sin que se dé cuenta, una petición al sitio de la tienda, por ejemplo para cambiar una configuración. Como el navegador manda la cookie de sesión, para WordPress esa petición viene del administrador.

WordPress trae la defensa de fábrica: los **nonces**, un código de un solo uso que va escondido en cada formulario del panel y que el servidor revisa antes de guardar. Una página ajena no puede conocerlo. Los reportes públicos no dicen qué función falla, pero en un CSRF de WordPress lo típico es eso: una función que guarda datos sin revisar el nonce.

## Cómo se corrige

El arreglo es el patrón de siempre en WordPress: poner el nonce en el formulario, revisarlo antes de guardar y confirmar además que quien guarda tiene permiso para hacerlo.

```php title="php · el patrón que evita un CSRF en un formulario de ajustes de WordPress"
// En el formulario:
wp_nonce_field( 'guardar_ajustes_regiones', 'nonce_regiones' );

// En la función que guarda:
if ( ! isset( $_POST['nonce_regiones'] ) || ! wp_verify_nonce( $_POST['nonce_regiones'], 'guardar_ajustes_regiones' ) ) {
    wp_die( 'Acción no permitida.' );
}
if ( ! current_user_can( 'manage_woocommerce' ) ) {
    wp_die( 'Permisos insuficientes.' );
}
update_option( 'ajuste_regiones', sanitize_text_field( wp_unslash( $_POST['ajuste_regiones'] ?? '' ) ) );
```

Para las peticiones AJAX el equivalente es `check_ajax_referer()`, y para las rutas de la API REST, un `permission_callback` que revise permisos. Cuando el plugin no es tuyo, una alternativa es un *must-use plugin* que desenganche las funciones vulnerables y registre en su lugar unas que sí validen. Intentamos armar un parche así, pero un parche propio tiene un costo: desde ese momento el mantenimiento es tuyo.

## Avisarle al autor

El plugin tiene un repositorio en GitHub, así que en julio de 2025 le [abrí un issue](https://github.com/mkrapel/wc-ciudades-y-regiones-de-chile/issues/3) con el enlace a la vulnerabilidad, contándole que todavía lo usan muchas tiendas en Chile. Más de un año después, el issue sigue abierto y sin respuesta. El último commit del repositorio es de agosto de 2020, y el código que hay ahí es el de la versión 3.1: la 4.3.0, la vulnerable, solo se distribuía por WordPress.org. Desde entonces, alguien mandó en 2023 un *pull request* con comunas que faltaban, y nunca se aceptó.

## WordPress.org lo cerró

Al revisarlo para este post encontré lo que el issue no sabía: **WordPress.org cerró el plugin el 7 de marzo de 2024, por un problema de seguridad**. Un plugin cerrado ya no se puede descargar ni recibe actualizaciones.

```bash title="bash · ¿el plugin sigue en WordPress.org? (si está cerrado, dice cuándo y por qué)"
curl -s "https://api.wordpress.org/plugins/info/1.2/?action=plugin_information&request%5Bslug%5D=wc-ciudades-y-regiones-de-chile"
```

Lo más peligroso es lo que eso significa para quien ya lo tenía instalado: **el panel de WordPress no avisa nada**. No hay actualización pendiente ni advertencia. El plugin sigue funcionando como siempre, con su vulnerabilidad adentro.

## Si tu tienda lo usa

- **Reemplázalo** por un plugin mantenido que haga lo mismo. Es la única salida que no te deja a cargo de código ajeno.
- Si no puedes reemplazarlo hoy, aplica un parche con el patrón de arriba y trátalo como temporal.
- Mientras tanto, reduce el riesgo: menos cuentas de administrador, doble factor de autenticación y no navegar por otros sitios con la sesión del panel abierta.

## Lo que me llevo

- Que un plugin funcione no significa que esté bien. Revisa cuándo fue su última actualización.
- Un plugin cerrado en WordPress.org deja de avisarte. Para enterarte necesitas una fuente externa: Patchstack, Wordfence o WPScan.
- Reportar es parte del trabajo, aunque nadie conteste. Queda registrado, y el siguiente que lo busque lo encuentra.
- Un mismo CVE puede tener puntajes muy distintos según quién lo evalúe. Lee el vector, no solo el número.
