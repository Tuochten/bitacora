---
title: "Así nació mi homelab: un notebook desocupado y un mes de tropiezos"
description: "Instalé Ubuntu Server en un notebook que no usaba y el primer mes fue una seguidilla de errores chicos: la red, el escritorio, Docker, Pi-hole y un disco de 1 TB que solo usaba 100 GB."
date: 2026-09-30
category: Homelab
tags: [Ubuntu Server, netplan, Docker, Pi-hole]
featured: false
---

Mi homelab partió en 2025, en una torre vieja (un i5-4460 con una RX 580) con Ubuntu, que guardaba lo de Jellyfin y compartía un disco de 2 TB por la red. El 26 de febrero de 2026 le di el relevo a un notebook que tenía desocupado: un Dell Latitude 7420 con 32 GB de RAM y un SSD de 1 TB. La idea era tener dónde practicar ciberseguridad y, de paso, un servidor encendido 24/7 en la casa. El primer mes fue una seguidilla de errores chicos, y de cada uno aprendí algo.

## Sin red y con netplan vacío

Instalé Ubuntu Server con el notebook conectado por un hub USB-C con puerto de red. Al primer arranque, `ip a` no mostraba ninguna IP. Intenté pedirla a mano con `dhclient` y el comando no existía: en Ubuntu Server moderno la red la maneja **netplan**, con `systemd-networkd` debajo.

La carpeta `/etc/netplan/` estaba vacía. El instalador no había configurado la red. Pero el sistema sí veía el adaptador: `lsusb` mostraba el chip ASIX del hub y la interfaz existía, con un nombre que parte en `enx` y sigue con la MAC del adaptador. Bastaba con decirle que pidiera IP:

```yaml title="/etc/netplan/01-netcfg.yaml · lo mínimo para tener red"
network:
  version: 2
  renderer: networkd
  ethernets:
    enx0123456789ab:   # el nombre lleva la MAC del adaptador
      dhcp4: true
```

```bash title="bash · netplan no aplica archivos que otros usuarios puedan leer"
sudo chmod 600 /etc/netplan/*.yaml
sudo netplan apply
```

El primer intento falló por eso último: netplan se niega a usar un archivo con permisos demasiado abiertos. Con el `chmod`, apareció la IP. Después la dejé fija, porque un servidor al que le cambia la dirección rompe en silencio todo lo que apunta a él.

## Un escritorio que no quería partir

El notebook tiene pantalla táctil, así que le puse XFCE, un escritorio liviano. Reinicié, y la pantalla de inicio de sesión respondía **failed to start session**, aunque por SSH entraba sin problema. En los registros aparecía `gkr-pam: unable to locate daemon control file`. Hubo que reinstalar varios paquetes de la sesión gráfica (el primer intento, sin `sudo`, tampoco ayudó), y a los pocos días el escritorio andaba.

Lo segundo fue que el servidor se dormía y me cortaba SSH a los pocos minutos. Un notebook sin actividad ahorra batería, y en un servidor eso detiene todo. Esto es lo que quedó configurado:

```ini title="/etc/systemd/logind.conf · que cerrar la tapa no lo duerma"
HandleLidSwitch=ignore
HandleLidSwitchExternalPower=ignore
HandleLidSwitchDocked=ignore
```

## Un panel que Chrome no veía

Instalé Docker desde el repositorio oficial y ordené todo en `/srv/docker`, con redes separadas para el proxy, lo interno y lo que algún día pasaría por una VPN. El primer servicio fue Nginx Proxy Manager, que tiene su panel en el puerto 81.

En el servidor, `curl http://localhost:81` devolvía la página. Desde el Mac, Vivaldi y Chrome decían esto:

![Vivaldi mostrando "This site can't be reached" con el error ERR_ADDRESS_UNREACHABLE al intentar abrir el panel en el puerto 81](/blog/nacimiento-del-homelab/vivaldi-unreachable.webp "Vivaldi desde el Mac. La dirección del servidor está tapada.")

Firefox, en cambio, llegó al panel después de mostrarme un aviso que acepté.

En ese momento lo atribuí a que los navegadores basados en Chromium se ponen exigentes con las direcciones sin HTTPS. Revisando el error de nuevo, `ERR_ADDRESS_UNREACHABLE` apunta a otra cosa: desde macOS Sequoia, cada app necesita permiso de **Red local** para hablarle a los equipos de tu red, y un navegador sin ese permiso falla justo así. El aviso que acepté en Firefox bien pudo ser ese permiso. Es mi sospecha más fuerte, pero no la he comprobado. Si te pasa, mira en **Ajustes del Sistema → Privacidad y seguridad → Red local** antes de culpar al servidor.

## Los contenedores no volvían solos

Un día apagué el servidor y, al prenderlo, los contenedores seguían detenidos. Docker no los vuelve a levantar si no tienen una **política de reinicio**. La solución era `restart: unless-stopped`, y yo la escribí tal cual en la terminal:

![Terminal: "restart: unless-stopped" escrito como comando da "Command 'restart:' not found", y "docker restart: unless-stopped" da "unknown command"](/blog/nacimiento-del-homelab/restart-en-bash.webp "Dos intentos de escribir una configuración como si fuera un comando. El nombre del servidor está tapado.")

`restart: unless-stopped` es una línea del `docker-compose.yml`, no un comando. Para un contenedor que ya existe, el comando es `docker update --restart unless-stopped <contenedor>`.

Una semana después, Docker me rechazó un `docker-compose.yml` nuevo:

```text title="docker compose up -d · una letra de más"
Error response from daemon: invalid restart policy: unknown policy 'unless-stoppedç'; use one of 'no', 'always', 'on-failure', or 'unless-stopped'
```

Una `ç` colada al final de la palabra.

## Pi-hole, tres problemas en fila

Pi-hole iba a ser el DNS de la casa: bloquear publicidad y darle nombres a los servicios. El contenedor partía, pero el panel no cargaba y los registros repetían que no existía `gravity.db`, la base de datos con las listas de bloqueo. Al pedirle que la descargara con `pihole -g`, respondió que no tenía DNS. Le hice `ping 8.8.8.8` desde adentro: `Network unreachable`. El contenedor no tenía salida a internet.

Arreglada la `ç`, Pi-hole no pudo publicar el puerto 53, porque lo tenía `systemd-resolved`, el DNS local de Ubuntu. Lo saqué del medio y el `ping` seguía fallando. La pista estaba en la lista de redes de Docker:

![Terminal con docker network ls: además de las redes propias aparece pihole_default, creada por docker compose](/blog/nacimiento-del-homelab/pihole-default.webp "pihole_default, la red que docker compose crea sola para el proyecto. Había quedado a medio armar.")

`pihole_default` era la red que `docker compose` crea sola para cada proyecto, y había quedado mal armada de los intentos anteriores. La borré, levanté de nuevo, el `ping` respondió y Pi-hole quedó funcionando.

Lo del puerto 53 no quedó para siempre: meses después volvió a estar tomado, y ahí aprendí a liberarlo sin dejar al servidor sin DNS. Eso lo conté en [otro post](/blog/pihole-no-le-servia-dns-a-nadie/).

## El hub se fue y se llevó la IP

A mediados de marzo cambié el hub por un adaptador de red simple. El servidor partió con otra IP, sacada del DHCP del router. La razón: **el nombre de la interfaz sale de la MAC del adaptador**. Adaptador nuevo, nombre nuevo, y mi `01-netcfg.yaml` seguía configurando una interfaz que ya no existía.

En `/etc/netplan/` además apareció un `90-NM-….yaml`, escrito por NetworkManager, que probablemente llegó con el escritorio. netplan lee los archivos en orden y el último puede pisar al primero. Rehice mi archivo para la interfaz nueva y la IP fija volvió.

## 100 GB de 953

Una semana después, `lsblk` mostró algo raro: un disco de 953,9 GB y el sistema montado en un volumen de **100 GB**. El instalador de Ubuntu Server, cuando usa LVM, no le asigna todo el disco al volumen principal; el resto queda libre dentro del grupo, esperando. No faltaba montar nada, sobraba espacio sin asignar.

```bash title="bash · darle todo el espacio libre al volumen (-r agranda también el sistema de archivos)"
sudo lvextend -r -l +100%FREE /dev/ubuntu-vg/ubuntu-lv
```

Hoy el volumen usa el disco entero.

## Cómo está hoy

Siete meses después, en el notebook corren ocho contenedores, todos con `unless-stopped`: Pi-hole, Nginx Proxy Manager, Nextcloud con su base de datos y su caché, Jellyfin, la sincronización de mis notas y una herramienta de estudio. Pi-hole es el DNS de todos mis equipos por Tailscale, y los datos de los contenedores se respaldan con restic hacia un disco del desktop. La idea de montar ahí un servidor de MU Online terminó [dejando a mis equipos sin internet](/blog/virt-manager-se-comio-el-dns/), pero esa es otra historia.

## Lo que me llevo

- Revisa lo que el instalador dejó hecho: la red, el disco y la suspensión. Ninguna de las tres venía pensada para un servidor.
- La configuración va en el archivo y los comandos en la terminal. Y los errores se leen letra por letra.
- Si un servicio responde en el servidor y no desde otro equipo, prueba con `curl` en el mismo servidor y después culpa a la red, al permiso o al navegador, en ese orden.
- En Linux, cambiar el adaptador de red es cambiar de interfaz. Lo que configuraste para la anterior no se traspasa.
