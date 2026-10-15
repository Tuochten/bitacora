---
title: "Instalé Virtual Machine Manager en el homelab y mis equipos se quedaron sin internet"
description: "Quería un Windows liviano para jugar con un servidor de MU Online. Terminé con el puerto 53 tomado por libvirt, Pi-hole caído y, por Tailscale, todos mis equipos sin resolver nombres."
date: 2026-10-02
category: Homelab
tags: [libvirt, DNS, Pi-hole, Tailscale]
featured: false
---

En abril quise darle un juguete nuevo al homelab: una máquina virtual con Windows para levantar un servidor de MU Online, y de paso tener dónde montar sistemas vulnerables para practicar. Instalé Virtual Machine Manager en el servidor, el mismo donde vive Pi-hole, el DNS de todos mis equipos. Tres días después, Pi-hole no quiso arrancar, y a los pocos días mi PC perdía internet cada vez que prendía Tailscale.

## El plan

El servidor es un notebook con Ubuntu Server y 32 GB de RAM, que corre en Docker Pi-hole, Nginx Proxy Manager, Nextcloud y Jellyfin. Pensé que le sobraba espacio para una VM con Windows 10 LTSC, la versión más liviana, y que desde mi PC o el Mac podría atacar por la red las máquinas vulnerables que montara ahí.

![Menú de aplicaciones de XFCE en el servidor, con Virtual Machine Manager en la sección Sistema](/blog/virt-manager-se-comio-el-dns/menu-xfce.webp "Virtual Machine Manager en el menú de XFCE del servidor. Se veía inofensivo.")

El 30 de abril, en una línea:

```bash title="bash · lo que instalé"
sudo apt install qemu-kvm libvirt-daemon-system libvirt-clients virt-manager bridge-utils -y
```

## Tres días después, Pi-hole no arrancó

Tuve que mover el notebook. Lo desenchufé del cable de red, usé un rato el WiFi y lo dejé de vuelta en su lugar. Al volver a levantar Pi-hole, Docker se negó:

![Terminal: docker compose up falla con "failed to bind host port 0.0.0.0:53/tcp: address already in use", y netstat muestra a dnsmasq escuchando en 192.168.122.1:53](/blog/virt-manager-se-comio-el-dns/puerto-53-tomado.webp "Arriba, Pi-hole sin poder publicar el 53. Abajo, quién lo tenía. El nombre del servidor está tapado.")

El que tenía el puerto era **dnsmasq, escuchando en `192.168.122.1:53`**. Esa dirección es la firma de libvirt: al instalarlo crea una red virtual llamada `default`, con su puente `virbr0` en `192.168.122.0/24`, y le pone un dnsmasq propio para entregarle DHCP y DNS a las VMs.

¿Por qué choca, si dnsmasq solo escucha en una dirección interna? Porque Pi-hole publica el puerto en `0.0.0.0:53`, que significa *todas* las direcciones del servidor, `192.168.122.1` incluida. Y el sistema no deja reservar "todas" si una ya está tomada.

El `ps` dio la otra pista: el dnsmasq de libvirt había partido el 3 de mayo, con el reinicio de ese día. Todo indica que, mientras Pi-hole tuvo el puerto, libvirt no pudo levantar su red. Al reiniciar, el que llegó primero se quedó con el 53, y esa vez ganó libvirt.

```bash title="bash · quién tiene el puerto 53"
sudo ss -lntup 'sport = :53'
```

## Apagar libvirt no soltó el puerto

El primer intento fue apagar el servicio. systemd avisó que sus *sockets* seguían activos, y con eso cualquier conexión lo vuelve a despertar. Detuve y deshabilité el servicio y los sockets… y dnsmasq seguía ahí, ahora con otro número de proceso.

![Terminal: se detienen y deshabilitan libvirtd y sus sockets, pero netstat sigue mostrando dnsmasq en 192.168.122.1:53; abajo, virsh net-list --all aparece vacío](/blog/virt-manager-se-comio-el-dns/dnsmasq-sigue-ahi.webp "Todo deshabilitado y el 53 sigue tomado. Abajo, la lista vacía que me llevó a un diagnóstico equivocado.")

Lo que no sabía: **libvirt deja corriendo sus redes aunque el demonio se detenga**, y la red `default` viene marcada para partir sola. Apagar el servicio no la apaga.

Ahí cometí el error más instructivo de la historia. Corrí `virsh net-list --all` para ver las redes, salió vacío, y ChatGPT, con el que iba revisando, concluyó que dnsmasq había quedado "huérfano" y que bastaba con matarlo a mano. Pero la lista estaba vacía por otra razón: **`virsh` sin `sudo` se conecta a tu sesión de usuario (`qemu:///session`), no a la del sistema (`qemu:///system`)**, que es donde vive la red `default`. Estaba mirando otro cajón.

```bash title="bash · la forma correcta de ver y apagar la red de libvirt"
sudo virsh net-list --all
sudo virsh net-autostart default --disable
sudo virsh net-destroy default
```

## Y entonces Tailscale me dejó sin internet

Unos días después, mi PC con Windows perdía internet apenas conectaba Tailscale. `ping 1.1.1.1` respondía y `ping google.com` no: había red, pero ningún nombre se resolvía.

La causa estaba en el panel de Tailscale. En marzo había dejado a Pi-hole como **DNS global** de toda mi red de Tailscale, con *Override DNS servers* activado y sin ningún respaldo.

![Panel de DNS de Tailscale: en Global nameservers, una sola entrada (la IP de Pi-hole en Tailscale) y Override DNS servers activado](/blog/virt-manager-se-comio-el-dns/tailscale-dns-global.webp "Un solo DNS para todos los equipos, sin respaldo. Las direcciones de mi red están tapadas.")

Con Pi-hole caído por el choque del 53, cada equipo conectado a Tailscale le preguntaba a un DNS que no contestaba. Un problema del servidor se había convertido en un problema de todos mis equipos.

La salida rápida fue sacar a Pi-hole como DNS global. Volvió internet y murieron los nombres `.lab` con que entraba a cada servicio. Desde ese día, ningún equipo volvió a usar Pi-hole. Lo que pasó con él en los meses siguientes está en [otro post](/blog/pihole-no-le-servia-dns-a-nadie/).

## La decisión

El 14 de mayo lo tenía claro: lo de las VMs había sido un error de diseño, no de configuración. El homelab hace de **infraestructura** para el resto de mis equipos (DNS, nube, respaldos), y ahí no se experimenta. El MU Online lo dejé para otro momento, y las máquinas vulnerables tenían que vivir en el desktop, lejos de todo lo que me importa.

Me demoré hasta el 25 de julio en hacer la limpieza completa: un `apt purge` de 29 paquetes, entre libvirt, QEMU, virt-manager y el `dnsmasq-base` que venía con ellos. Hoy en el servidor no queda ni `virbr0`.

El [laboratorio de pentesting](/blog/laboratorio-pentesting/) terminó en el desktop, con KVM y una red aislada. Ahí corre exactamente el mismo dnsmasq, en el mismo `192.168.122.1:53`, y no molesta a nadie, porque en esa máquina nadie más quiere el puerto 53. Esa vez revisé los puertos antes de instalar.

Pi-hole volvió a ser el DNS de mi red de Tailscale, pero ahora con Cloudflare de respaldo y los `.lab` en una ruta aparte. Si el servidor se cae, pierdo el bloqueo de publicidad y los nombres del homelab, pero no internet.

Si hoy quisiera tener las dos cosas en la misma máquina, haría que Pi-hole publicara el 53 en una dirección específica en vez de `0.0.0.0`, o apagaría la red `default` de libvirt, que mis VMs no necesitaban.

## Lo que me llevo

- Antes de instalar algo que trae su propia red, mira qué puertos toma: `ss -lntup` antes y después.
- Un servicio del que dependen otros equipos no comparte casa con experimentos.
- Un DNS global sin respaldo convierte la caída de un servidor en la caída de toda la red.
- Una lista vacía no siempre significa que no hay nada. A veces estás mirando otro cajón, y vale lo mismo para la respuesta de una IA.
