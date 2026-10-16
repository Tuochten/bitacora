---
title: "Respaldar una sola casilla de correo en cPanel (y dónde no dejar el respaldo)"
description: "Un cliente pidió el respaldo de una cuenta de correo. cPanel no tiene un botón para eso, el tar terminó en la carpeta de root y el cliente no encontraba sus correos en el archivo. Así se hace bien."
date: 2026-10-06
category: Dev
tags: [cPanel, Correo, Linux, Respaldos]
featured: false
---

En el trabajo administramos hosting compartido con WHM: cada cliente tiene su propia cuenta de cPanel. Un cliente nos pidió el respaldo de **una sola casilla de correo**, y de paso el de otra casilla de un dominio que ya habían dado de baja con nosotros. Parecía un trámite de cinco minutos.

## cPanel no tiene ese botón

Lo primero fue buscarlo en cPanel. **Email Disk Usage** muestra cuánto ocupa cada casilla y permite borrar correos en masa, pero no descargar nada. En Roundcube, el webmail, al seleccionar todos los correos no aparecía la opción de exportar. Para una casilla con años de correo, ninguna de las dos servía.

Lo que sí hay es acceso al servidor. En cPanel, cada casilla vive en una carpeta, con sus correos como archivos:

```text title="dónde guarda cPanel los correos de una casilla"
/home/USUARIO/mail/DOMINIO/CASILLA/
```

Respaldarla es comprimir esa carpeta.

## El respaldo terminó en /root

Lo comprimí desde la terminal de WHM, que entra como root:

```bash title="bash · lo que corrí (con los nombres cambiados)"
tar -czvf respaldo.tar.gz /home/USUARIO/mail/DOMINIO/CASILLA/
```

Fui a buscarlo en el administrador de archivos del cPanel del cliente y no estaba. **`tar` deja el archivo en la carpeta donde estás parado**, no junto a lo que comprimes. Yo estaba en `/root`, así que el respaldo había quedado ahí: los correos de un cliente, en la carpeta del administrador del servidor, sin que nadie más supiera que existían.

Lo moví a la cuenta del cliente, con dueño y permisos que solo dejan leerlo a esa cuenta:

```bash title="bash · moverlo a la cuenta del cliente"
mv /root/respaldo.tar.gz /home/USUARIO/
chown USUARIO:USUARIO /home/USUARIO/respaldo.tar.gz
chmod 600 /home/USUARIO/respaldo.tar.gz
```

Lo descargué y lo borré del servidor. Un respaldo de correos es información personal, y adentro del servidor no le servía a nadie.

La forma de no tener que moverlo es decirle a `tar` desde el principio dónde dejarlo, y con `-C` que las rutas dentro del archivo partan desde la carpeta de la casilla y no desde `/home`:

```bash title="bash · la forma limpia: el archivo nace en la cuenta del cliente"
tar -C /home/USUARIO/mail/DOMINIO -czf /home/USUARIO/respaldo.tar.gz CASILLA
chown USUARIO:USUARIO /home/USUARIO/respaldo.tar.gz
chmod 600 /home/USUARIO/respaldo.tar.gz
```

## "No veo los correos"

El cliente descomprimió el archivo y no encontró ningún correo. Esperaba archivos `.eml`, porque así se lo habíamos explicado en el correo con las instrucciones, y lo que veía eran carpetas `cur`, `new` y `tmp` llenas de archivos con nombres como este:

```text title="un correo en formato Maildir"
1713456789.M123456P789.servidor,S=1234,W=1250:2,S
```

cPanel guarda el correo en formato **Maildir**: **cada archivo es un correo completo**, con su texto y sus adjuntos, solo que sin extensión. Los de la bandeja de entrada están en `cur` (leídos) y `new` (sin leer), y cada carpeta de la casilla (enviados, papelera, las que haya creado el usuario) es una subcarpeta que parte con un punto, como `.Sent`.

Basta con ponerles la extensión para que el sistema los abra con el programa de correo:

```bash title="bash · copiar los correos de una carpeta como .eml"
mkdir -p eml
n=0; for f in cur/* new/*; do n=$((n+1)); cp "$f" "eml/$n.eml"; done
```

Para revisarlos todos con calma, lo más cómodo es importarlos a Thunderbird, que es gratuito.

## La casilla que ya no existía

La otra casilla era de un dominio que el cliente había dado de baja. No estaba en el servidor ni en el sistema de respaldos, JetBackup 5. Le preguntamos cuándo se había eliminado, más o menos, para saber si algún respaldo de esa época podía tenerla. Un respaldo solo existe si alguien lo hizo antes de borrar.

## Lo que me llevo

- Antes de correr `tar` como root, fíjate dónde estás parado, o dile con la ruta completa dónde dejar el archivo.
- Un respaldo con datos de un cliente no se queda en el servidor: se entrega y se borra.
- En Maildir, cada archivo es un correo. Que no tenga extensión no significa que esté vacío.
- Cuando das de baja un dominio, sus casillas se van con él. Respáldalas antes, no después.
- Las instrucciones para el cliente se prueban con el archivo real antes de enviarlas. Las nuestras prometían `.eml` que no había.
