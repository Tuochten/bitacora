---
title: "El dominio sin www daba errores de Cloudflare, y nadie había configurado Cloudflare"
description: "Migré un WordPress de hosting y, mientras cambiaban los DNS, el dominio sin www mostraba errores de Cloudflare. La explicación estaba en a quién pertenecía la IP del hosting nuevo."
date: 2026-10-09
category: Dev
tags: [DNS, SSL, WordPress, Cloudflare]
featured: false
---

Me tocó migrar un WordPress con tienda a un hosting nuevo. El plan era el de siempre: dejar el sitio antiguo en modo mantención, copiar todo al hosting nuevo, cambiar los DNS y esperar que se propagaran. El hosting nuevo lo había recomendado yo. Tiene un panel que deja hacer muy poco, y ahí también quedaron los DNS del dominio.

## ¿Estoy editando el sitio correcto?

Mientras los DNS se propagan, conviven dos sitios: en algunos lugares del mundo el dominio todavía apunta al hosting antiguo y en otros ya apunta al nuevo. Tu computador puede estar viendo cualquiera de los dos. Si vas a sacar el sitio de mantención, necesitas estar seguro de cuál estás tocando.

La forma segura es decirle a tu propio computador a qué IP ir, sin esperar a los DNS, con el archivo `hosts`:

```text title="hosts · en Linux y macOS /etc/hosts; en Windows C:\Windows\System32\drivers\etc\hosts"
203.0.113.10   ejemplo.cl www.ejemplo.cl   # la IP del hosting nuevo
```

Con esa línea, tu navegador va siempre al hosting nuevo. Lo importante es borrarla al terminar.

## Con www sí, sin www no

`https://www.ejemplo.cl` cargaba perfecto. `https://ejemplo.cl`, sin www, respondía esto:

```text title="el navegador, sin www"
ERR_SSL_VERSION_OR_CIPHER_MISMATCH
```

El servidor no tenía un certificado válido para el dominio sin www. El de `www` ya estaba emitido y el otro todavía no.

## Me dejé afuera yo solo

Como podía entrar al administrador de WordPress por `www`, entré a **Ajustes → Generales** y cambié la dirección del sitio a la versión sin www, que era la que corresponde. Ese era justo el dominio sin certificado. WordPress empezó a mandar todo, incluido el administrador, a una dirección que no cargaba. **Quedé afuera de mi propio sitio**, y sin acceso a los archivos para arreglarlo desde `wp-config.php`.

## Cloudflare, sin que nadie lo hubiera puesto

Probando el dominio sin www por `http`, apareció una página de error de **Cloudflare**: el 1001, de resolución de DNS. Más tarde, un 522: Cloudflare no lograba conectarse al servidor. Lo raro es que el dominio no estaba en Cloudflare: los *nameservers* eran los del hosting nuevo.

```bash title="bash · quién responde por el dominio"
nslookup -type=ns ejemplo.cl
```

En ese momento yo tenía Tailscale activo, que usa su propio DNS. Al apagarlo, la consulta mostró lo mismo desde mi red: el dominio, con y sin www, apuntaba a la IP del hosting nuevo. Entonces fui directo a esa IP en el navegador, y otra vez Cloudflare: **error 1003, acceso directo por IP no permitido**.

ChatGPT, con el que iba revisando, concluyó que esa IP era de Cloudflare. Yo pensé que el hosting anterior había dejado algo configurado en Cloudflare. Ninguno de los dos acertó. Al revisarlo para este post, la IP pertenece al hosting nuevo y no está en los rangos públicos de Cloudflare, pero sí responde como Cloudflare:

```bash title="bash · de quién es la IP, y quién responde en ella"
curl -s https://rdap.arin.net/registry/ip/IP-DEL-HOSTING | grep -o '"name":"[^"]*"' | head -1
curl -sI http://IP-DEL-HOSTING/ | grep -i '^server'
```

El registro de la IP decía el nombre del hosting y la cabecera `server` decía `cloudflare`. **El hosting nuevo atiende sus sitios a través de la red de Cloudflare.** Nadie había configurado Cloudflare porque venía incluido. Todo indica que los errores 1001 y 522 eran Cloudflare diciendo que todavía no sabía qué hacer con el dominio sin www, y que el certificado faltante era el mismo problema visto desde el navegador.

## Ocho horas después

Ocho horas más tarde, el dominio sin www cargaba con su certificado. El sitio seguía en mantención, y el administrador seguía redirigiéndome. Finalmente conseguí acceso por SFTP, desactivé los plugins y pude entrar a WordPress.

## Lo que me llevo

- Cuando migres, revisa los dos nombres del dominio, con y sin www. El certificado de uno no cubre al otro si nadie lo pidió.
- No cambies la dirección de WordPress a un dominio que todavía no carga: es la forma más rápida de quedarte afuera.
- Antes de tocar nada, asegúrate de tener acceso a los archivos o a la base de datos. Sin eso, un error de configuración en WordPress no tiene arreglo desde el navegador.
- Para saber quién está detrás de una IP, pregúntale al registro (RDAP) y mira qué servidor responde. No supongas.
- Al revisar DNS, fíjate a qué servidor le estás preguntando. Una VPN o Tailscale pueden estar contestando por ti.
