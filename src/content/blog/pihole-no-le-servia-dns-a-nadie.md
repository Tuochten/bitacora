---
title: "Mi Pi-hole llevaba meses sin servirle DNS a nadie (y decía estar healthy)"
description: "Fui a revisar por qué Nextcloud no sincronizaba y terminé descubriendo un Pi-hole sin puertos, el puerto 53 tomado por systemd-resolved y unos respaldos que casi quedan guardando carpetas vacías."
date: 2026-09-26
category: Homelab
tags: [Pi-hole, DNS, Docker, Tailscale]
featured: false
---

En la casa tengo un servidor chico con Ubuntu donde corren, en Docker, Nextcloud, Jellyfin, Nginx Proxy Manager y Pi-hole. Pi-hole es el DNS: bloquea publicidad y resuelve los nombres `.lab` con que entro a cada servicio. Un día fui a revisar por qué Nextcloud no sincronizaba y terminé descubriendo que Pi-hole llevaba meses sin responderle a nadie, aunque Docker lo mostraba como *healthy*.

## Nextcloud no estaba malo

Había cambiado el servidor de lugar y, sin darme cuenta, le desenchufé el ethernet. Se conectó por WiFi, el DHCP le dio otra IP y todo lo que tenía la IP fija anotada se quedó hablándole al vacío.

La pista estaba en el log de Nextcloud: **ni una sola petición en 4 días**. No respondía mal, simplemente no le llegaba nada. Con el cable de vuelta, el servidor recuperó su IP y todo volvió solo.

Ya que estaba revisando, miré Pi-hole.

## Healthy, pero sin puertos

![Dos terminales: en el servidor, docker ps muestra a Pi-hole healthy y sin puertos publicados; desde otro equipo, dig no recibe respuesta](/blog/pihole-no-le-servia-dns-a-nadie/healthy-sin-puertos.webp "Reconstrucción de lo que mostraba cada lado. Los puertos aparecen, pero sin 0.0.0.0:53->: el contenedor los expone y nadie los publica.")

Había **dos instalaciones de Pi-hole en paralelo**, cada una con su `docker-compose.yml`, y la que estaba corriendo no publicaba ningún puerto. Por dentro funcionaba perfecto, y por eso el healthcheck pasaba. Desde afuera, nadie podía llegarle.

De paso encontré que faltaba justo el registro local de Nextcloud y que la clave del panel era literalmente `admin`. Me quedé con la instalación que tenía los registros buenos, dejé una clave al azar en un `.env` con permisos `600` y archivé la otra sin borrarla.

## El puerto 53 estaba tomado

Al publicar el puerto, Docker se negó: `address already in use`. En Ubuntu, `systemd-resolved` escucha en el 53 de `127.0.0.53`, y eso choca con publicar en `0.0.0.0:53`.

```bash title="bash · quién tiene el puerto 53"
sudo ss -lntup 'sport = :53'
```

La receta de siempre es poner `DNSStubListener=no` y reiniciar `systemd-resolved`. **Si haces solo eso, el servidor se queda sin DNS**: `/etc/resolv.conf` apunta a `127.0.0.53`, justo lo que acabas de apagar. Hay que repuntarlo:

```bash title="bash · liberar el 53 sin quedarse sin DNS"
sudo mkdir -p /etc/systemd/resolved.conf.d
printf '[Resolve]\nDNSStubListener=no\n' | sudo tee /etc/systemd/resolved.conf.d/no-stub.conf
sudo ln -sf /run/systemd/resolve/resolv.conf /etc/resolv.conf
sudo systemctl restart systemd-resolved
getent hosts debian.org   # si responde, el servidor sigue resolviendo
```

Yo lo hice con un script que comprueba que el servidor siga resolviendo y, si no, deshace todo. En mi caso edité `resolved.conf` directo; el drop-in de arriba es más limpio.

## Pi-hole en todos mis equipos, con Tailscale

Con Pi-hole andando, lo dejé como DNS de mi red de Tailscale. Así el desktop, el notebook, el iPad y el celular tienen bloqueo de publicidad y los nombres `.lab`, también fuera de la casa. Partí resolviendo solo los `.lab` y después lo pasé a DNS global, con Cloudflare de respaldo por si el servidor se cae.

> [!WARNING] Los registros .lab tienen que apuntar a la IP de Tailscale
> Si apuntan a la IP de la LAN, funcionan en la casa y fallan afuera.

## Casi respaldo carpetas vacías

Al mover Pi-hole de carpeta, **dos de las rutas que monta mi respaldo con `restic` dejaron de existir**. Docker no reclama por eso: crea la carpeta vacía y sigue. El respaldo habría terminado "OK" todas las noches sin guardar nada. Lo corregí y revisé que los datos de Pi-hole estuvieran de verdad dentro del snapshot.

## Lo que me llevo

- Si un servicio no recibe ni una petición, revisa la dirección antes que el servicio.
- `healthy` solo dice que el healthcheck pasó, no que alguien pueda llegarle.
- Si mueves datos de lugar, revisa todo lo que los monta, sobre todo los respaldos.
