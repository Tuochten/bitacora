---
title: "btrfs dice que no hay espacio, pero df dice que sí: qué está pasando"
description: "Mi disco del sistema llegó a tener 1 GiB sin asignar mientras df mostraba cientos libres. Por qué pasa en btrfs, qué número mirar y cómo dejar que el kernel lo resuelva solo."
date: 2026-09-17
category: Homelab
tags: [btrfs, Linux, CachyOS]
featured: false
---

En una misma semana tuve que balancear a mano dos discos btrfs. Primero el NVMe del sistema: `df` mostraba cientos de GiB libres y btrfs tenía **1 GiB** sin asignar, a un paso de responder que no quedaba espacio. Cuatro días después, el disco de respaldos, con 33 GiB. Pensé que me iba a tocar hacerlo seguido. No: había una causa concreta, y el kernel lo puede resolver solo.

## Qué los vació por dentro

Los dos casos partieron igual: un borrado grande. En el NVMe saqué unos 200 GiB que seguían retenidos en snapshots viejos. En el de respaldos, podé unos 190 GiB de respaldos antiguos.

btrfs no reserva espacio archivo por archivo. Toma **bloques grandes** del disco (block groups, normalmente de 1 GiB para datos) y escribe dentro. Al borrar, un bloque se devuelve solo si queda **completamente vacío**. Los que conservan algo de datos siguen reservados, aunque por dentro estén casi vacíos.

De ahí sale el síntoma: `df` suma el espacio libre *dentro* de esos bloques, pero btrfs no tiene bloques *nuevos* que entregar. Cuando necesita uno, por ejemplo para metadatos, falla aunque el disco parezca medio vacío.

## El número que hay que mirar

No es el de `df`. Es el espacio **sin asignar** (unallocated):

```bash title="bash · espacio sin asignar"
sudo btrfs filesystem usage -g /mnt/respaldos | grep -i unallocated
```

Mi regla: sobre unos 50 GiB sin asignar estoy tranquilo; con un dígito hay que actuar.

## Salir del paso: balancear solo lo medio vacío

No hace falta un balance completo, que en un disco grande toma horas. Basta con reacomodar los bloques poco ocupados:

```bash title="bash · balance acotado"
# solo bloques de datos y de metadatos usados bajo el 50%
sudo btrfs balance start -dusage=50 -musage=50 /
```

En el NVMe, eso llevó el espacio sin asignar de 1 GiB a unos 183 GiB. En el de respaldos, de 33 a 323 GiB, en 26 minutos.

Pero es un parche, y dos balances a mano en una semana me hicieron preguntarme por qué el kernel no lo estaba haciendo solo.

## La causa de fondo: la recuperación automática estaba apagada

Los kernels recientes pueden recuperar esos bloques por su cuenta. En mis dos discos, las tres perillas estaban en cero:

- **`periodic_reclaim`**: revisa cada cierto tiempo y recupera bloques medio vacíos.
- **`dynamic_reclaim`**: ajusta solo el umbral según qué tan justo ande el disco.
- **`bg_reclaim_threshold`**: un umbral fijo; recupera los bloques que estén bajo ese porcentaje de uso.

Viven en `/sys/fs/btrfs/<uuid>/allocation/data/` (y en `metadata/`) y **no sobreviven a un reinicio**, así que los dejé en una unidad de systemd que los escribe en cada arranque. No los configuré igual en los dos discos:

- **NVMe: modo dinámico.** Es rápido y el trabajo de fondo no se nota.
- **HDD de respaldos: umbral fijo del 10%, sin modo dinámico.** Tiene decenas de snapshots, y en btrfs mover un bloque obliga a actualizar todo lo que apunta a él. En un disco mecánico no quiero que se ponga a hacerlo cuando al kernel le parezca.

```ini title="systemd · /etc/systemd/system/btrfs-reclaim.service"
[Unit]
Description=Recuperación automática de bloques en btrfs
After=local-fs.target
# espera a que el disco de respaldos esté montado: antes, su carpeta en /sys no existe
RequiresMountsFor=/mnt/respaldos

[Service]
Type=oneshot
RemainAfterExit=yes
# NVMe: el kernel ajusta solo el umbral
ExecStart=/bin/sh -c 'echo 1 > /sys/fs/btrfs/UUID-DEL-NVME/allocation/data/periodic_reclaim'
ExecStart=/bin/sh -c 'echo 1 > /sys/fs/btrfs/UUID-DEL-NVME/allocation/data/dynamic_reclaim'
ExecStart=/bin/sh -c 'echo 1 > /sys/fs/btrfs/UUID-DEL-NVME/allocation/metadata/periodic_reclaim'
# HDD con snapshots: umbral fijo y conservador
ExecStart=/bin/sh -c 'echo 1 > /sys/fs/btrfs/UUID-DEL-HDD/allocation/data/periodic_reclaim'
ExecStart=/bin/sh -c 'echo 10 > /sys/fs/btrfs/UUID-DEL-HDD/allocation/data/bg_reclaim_threshold'

[Install]
WantedBy=multi-user.target
```

El UUID de cada disco sale de `findmnt -no UUID <punto de montaje>`. Después, `sudo systemctl enable --now btrfs-reclaim.service`, y no hay que acordarse de nada más.

> [!NOTE] Revisa tu kernel
> `periodic_reclaim` y `dynamic_reclaim` son relativamente nuevos. Si esos archivos no aparecen en `/sys/fs/btrfs/<uuid>/allocation/data/`, tu kernel todavía no los trae y solo te queda `bg_reclaim_threshold`.

## ¿Y si me cambio de sistema de archivos?

Lo pensé, y no:

- **ext4 o XFS** no tienen este problema, pero tampoco tienen snapshots, `send`/`receive` ni sumas de verificación. Mis respaldos dependen de `btrfs send`, así que ese disco se queda en btrfs. Para un disco de puros datos y sin snapshots, ext4 o XFS sí son más simples.
- **ZFS** no necesita balance, pero quiere un buen margen libre para no degradarse y no deja achicar un pool. Además va fuera del árbol del kernel: CachyOS trae el módulo precompilado, pero en una distro rolling sigue el riesgo de que una actualización del kernel llegue antes que la del módulo.

## Lo que me llevo

- Si btrfs dice que no hay espacio y `df` dice que sí, mira el **unallocated**.
- Para salir del paso, un **balance acotado** con `-dusage=50`, no uno completo.
- Para que no se repita, **activa la recuperación automática del kernel** y déjala en una unidad de systemd, porque no sobrevive a un reinicio.
