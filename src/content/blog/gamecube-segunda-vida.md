---
title: "Le di una segunda vida a la GameCube de mi infancia"
description: "La primera vez que abro una consola: la GameCube de la familia, con el lector muerto, ahora carga juegos desde una microSD con un PicoLoader que se instala sin soldar y se puede quitar."
date: 2026-10-04
category: Hardware
tags: [GameCube, PicoLoader, Swiss, Retro]
featured: false
---

Hay objetos que no son solo objetos. Esta GameCube lleva más de 20 años en mi familia, y la usé con mi hermano mayor, igual que la Nintendo 64, que para nosotros es todavía más especial. Hacía muchos años que estaba guardada: empezó a fallar al leer los discos y, con el lector probablemente muerto, quedó en el olvido. Este año decidí darle una segunda vida.

<figure class="video"><video src="/blog/gamecube-segunda-vida/00-resumen-segunda-vida.mp4" poster="/blog/gamecube-segunda-vida/00-resumen-segunda-vida-poster.webp" autoplay muted loop playsinline preload="metadata" aria-label="Resumen del proceso: la GameCube abierta, el lector fuera, el PicoLoader instalado y los juegos corriendo"></video><figcaption>El proceso completo en 37 segundos.</figcaption></figure>

## El plan, y una sorpresa en la etiqueta

Investigando, llegué al **PicoLoader**: un chip basado en el mismo microcontrolador de la Raspberry Pi Pico, que viene en un cable flexible y se conecta entre la placa madre y el lector de discos, **sin soldar**. Al prender la consola, en vez del menú de siempre arranca **Swiss**, un programa que carga los juegos desde una tarjeta de memoria.

Me faltaba un dato: el modelo. La GameCube original, la **DOL-001**, tiene debajo un puerto (el *Serial Port 2*) donde se conecta un adaptador de microSD. La revisión posterior, la **DOL-101**, lo eliminó, igual que la salida de video digital. Yo me acordaba de una tapa con un puerto adentro, así que contaba con la DOL-001.

Cuando por fin pude ver la etiqueta de abajo, decía **DOL-101**. Lo más probable es que el puerto que recordaba fuera el *Serial Port 1*, que la DOL-101 sí tiene y que no sirve para esto. Tocó cambiar de plan: la microSD iría en un **GC2SD**, un adaptador con forma de memory card que se pone en la segunda ranura de tarjetas, al frente. La primera quedó para la memory card de siempre.

## El miedo de abrirla

Nunca había metido mano dentro de un aparato electrónico. Y la primera vez iba a ser con una consola que ya no se fabrica y que tiene un valor sentimental enorme. Uno no quiere echar a perder ese tipo de cosas, así que el resquemor era real.

El primer obstáculo fue el destornillador. Los tornillos de la base son **Gamebit de 4,5 mm**, una cabeza propia de Nintendo. El set de puntas Torx que estuve a punto de comprar no servía.

## Por dentro, impecable

Al abrirla me llevé una sorpresa: estaba extremadamente bien conservada. Sin pelusas, sin tierra, nada. Igual aproveché de hacerle una mantención.

![Dos fotos de la GameCube abierta sobre una mesa de madera: a la izquierda, la vista superior con el lector de discos y la placa frontal; a la derecha, la placa madre con su disipador de aluminio, sin polvo](/blog/gamecube-segunda-vida/abierta.webp "Más de 20 años y ni una pelusa. A la derecha, la placa madre con el lector ya fuera.")

## El PicoLoader, sin soldar

Para instalarlo saqué el lector. La placa del PicoLoader (la mía es la *Rev1.0*, con un puerto USB-C y botones de BOOT y RESET) va unida al cable flexible, y el conector del cable indica de qué lado va: **TOP / DVD DRIVE SIDE**.

![Dos fotos: a la izquierda, la placa del PicoLoader Rev1.0 sostenida con guante; a la derecha, el cable flex conectado en la placa de la GameCube](/blog/gamecube-segunda-vida/picoloader-flex.webp "La placa del PicoLoader y el flex ya conectado del lado del lector.")

Lo mejor es que **todo es reversible**: si algún día arreglo el lector, puedo volver a jugar con mis discos originales como siempre.

## La prueba de fuego

Volví a cerrar todo, prendí la consola y apareció Swiss con la lista de juegos de la microSD.

![Dos fotos de la TV: el menú de Swiss con la lista de juegos, y la ficha de Bionicle Heroes lista para iniciar](/blog/gamecube-segunda-vida/swiss.webp "Swiss, con los juegos de la microSD. Abajo se lee de dónde los carga: SD Card, Slot B.")

El primero fue **Bionicle Heroes**: los avisos de salud, el "Licensed by Nintendo", los logos y la cinemática de siempre.

<figure class="video"><video src="/blog/gamecube-segunda-vida/08-swiss-cargando-bionicle-heroes.mp4" poster="/blog/gamecube-segunda-vida/08-swiss-cargando-bionicle-heroes-poster.webp" controls playsinline preload="metadata"></video><figcaption>Del menú de Swiss a la intro de Bionicle Heroes, sin tocar un disco.</figcaption></figure>

Después, una partida de **Super Mario Strikers**, Yoshi contra Mario.

<figure class="video"><video src="/blog/gamecube-segunda-vida/07-prueba-super-mario-strikers.mp4" poster="/blog/gamecube-segunda-vida/07-prueba-super-mario-strikers-poster.webp" controls muted playsinline preload="metadata"></video><figcaption>Super Mario Strikers en la TV de la casa.</figcaption></figure>

## El control que caminaba solo

Quedaba un detalle: uno de los dos controles se comportaba como si alguien apretara el stick hacia la derecha todo el rato. Lo abrí: el stick funciona con dos potenciómetros, uno por eje, cada uno con una piecita blanca que se mueve con el stick y lee su posición. Los revisé, y el control quedó funcionando.

## Lo que quedó pendiente

El lector sigue sin leer. Reemplazarlo sale caro, y con el PicoLoader la consola ya no lo necesita para jugar. Si algún día lo cambio, los discos vuelven a funcionar igual que antes.

Para ser la primera vez que abro una consola, todo salió bastante bien. La GameCube de la familia volvió a funcionar.

## Lo que me llevo

- Antes de comprar nada, revisa el modelo exacto de la consola. Mi memoria me decía DOL-001 y la etiqueta decía DOL-101.
- Las consolas de Nintendo usan tornillos propios: consigue el destornillador correcto antes de abrir.
- Si puedes elegir, elige lo reversible. Saber que todo se podía deshacer me quitó la mitad del miedo.
- Por dentro, una consola guardada puede estar mejor de lo que crees. Ábrela con cuidado y mírala antes de suponer lo peor.
