---
title: "Cambié la RTX 3080 por una 5080 y el PC no quiso dar imagen"
description: "Una tarjeta nueva, una fuente nueva y una BIOS vieja. Terminé con la CPU pegada al disipador, tres códigos de error y una RAM que nunca llegó a 3600."
date: 2026-10-07
category: Hardware
tags: [RTX 5080, BIOS, RAM, Ryzen]
featured: false
---

En enero cambié la RTX 3080 de mi PC por una RTX 5080, una ASUS Prime. El resto del equipo se quedaba igual: Ryzen 9 5900X, placa ASUS ROG Strix X570-E, disipador Noctua NH-D15 y 48 GB de RAM DDR4. El día anterior había instalado una fuente nueva, una GameMax de 1050 W con el conector 12V-2x6 que piden las tarjetas nuevas, comprada justo para esto. Lo que debía ser un cambio de media hora se convirtió en tres días de códigos de error.

## El disipador se llevó la CPU

El NH-D15 es enorme, y en mi gabinete tapa el seguro del slot de la tarjeta de video. Para sacar la 3080 hay que sacar el disipador entero. Lo hice una vez, puse la 5080, y me di cuenta de que le había dejado un plástico protector puesto. Segunda vuelta: saqué el disipador con cuidado… y la CPU salió con él.

![Un Ryzen 9 5900X pegado de cabeza a la base del disipador, con los pines dorados hacia arriba y la pasta térmica asomando por los bordes](/blog/rtx-5080-sin-imagen/cpu-pegada.webp "La CPU, fuera del socket y pegada al disipador.")

La culpable era la pasta térmica, una Arctic MX-6 muy espesa. Fría, hace de ventosa entre la CPU y el disipador, y en AM4 la palanca del socket no alcanza a retener el procesador si tiras hacia arriba. Revisé los pines fila por fila y no había ninguno doblado. Tuve suerte.

Lo que se recomienda, y que yo no hice: usar el PC unos minutos antes para que la pasta se ablande, y girar el disipador de lado a lado antes de levantarlo.

## Código 02, y después 9E

Primer encendido con la 5080: ventiladores andando, pantalla negra y el visor de la placa clavado en **02**, un código del arranque muy temprano.

Saqué la pila de la placa para resetear la BIOS (el disipador ya estaba afuera, así que daba lo mismo) y no cambió nada. La sospecha siguiente era la BIOS: la X570 es de 2019 y la 5080 de 2025. La actualicé a la 5031, la última estable, con el botón **BIOS Flashback**, que flashea desde un pendrive sin necesitar CPU ni video. Con la 3080 de vuelta el PC arrancó, pero con la 5080 el código pasó a ser otro:

![El visor de códigos de la placa madre marcando 9E en rojo, bajo la RTX 5080 recién instalada](/blog/rtx-5080-sin-imagen/codigo-9e.webp "Con la BIOS nueva, el código avanzó del 02 al 9E. Seguía sin imagen.")

Los códigos 9E y 93 aparecen cuando la placa inicializa los dispositivos PCIe, o sea, la tarjeta de video. Avanzamos, pero no lo suficiente. Lo siguiente fue forzar el slot a **PCIe Gen3**, por si la placa y la tarjeta no se ponían de acuerdo en la velocidad del bus. Guardé, cambié a la 5080 de nuevo y apareció otra vez el 93.

## Era el cable

Me quedaba una sola prueba. La 5080 trae en la caja un adaptador de tres conectores PCIe de 8 pines a uno 12V-2x6, para fuentes antiguas. Dejé de lado el cable nativo de la fuente nueva, usé el adaptador… y llegó a la BIOS. Después, a Windows.

Para entonces había cambiado la tarjeta, la fuente, la BIOS, el modo del PCIe y la pasta térmica. Funcionó con el adaptador, así que el sospechoso era el cable 12V-2x6 de la fuente: estos conectores tienen unos pines de detección (*sense*) que le dicen a la tarjeta cuánta potencia tiene disponible, y si no hacen contacto, la tarjeta no arranca. Empecé a ver cómo devolver la fuente.

Antes de reclamar la garantía quise probar una vez más. Reconecté todos los cables, prendí el PC con un solo monitor y arrancó. Conecté todo lo demás y volvió el 93. Al rato, otra vez arrancó. Eso es lo más difícil de diagnosticar: un problema que aparece a veces. ChatGPT, con el que iba revisando, le dio un 70-80 % de probabilidad a que la culpable fuera la fuente.

## +25 %

Con el PC por fin en Windows, corrí el benchmark de Cyberpunk 2077 con los mismos ajustes que había usado con la 3080: 1440p, ray tracing Ultra y DLSS automático.

![Resultados del benchmark de Cyberpunk 2077 lado a lado: la RTX 3080 promedia 66,26 FPS y la RTX 5080 82,88 FPS, con los mismos ajustes y el mismo procesador](/blog/rtx-5080-sin-imagen/cyberpunk-3080-vs-5080.webp "Mismo juego, mismos ajustes, mismo procesador. De 66 a 83 FPS de promedio.")

De 66 a 83 FPS: un 25 % más. Esperaba bastante más: en las pruebas publicadas, la 5080 le saca a la 3080 mucho más que eso. La explicación más probable es el procesador: con DLSS el juego dibuja a una resolución menor y escala la imagen, así que la GPU se desocupa antes y el que pone el límite pasa a ser la CPU, y el ray tracing de Cyberpunk también le carga trabajo a la CPU. No medí el uso de la GPU durante la prueba, así que es una sospecha razonable, no una certeza.

## La RAM que nunca llegó a 3600

Si el procesador era el límite, la RAM podía ayudar. Tenía 48 GB: dos módulos de 16 GB vendidos para 3600 MHz y dos de 8 GB para 3200, todos funcionando a 3000. Con la 3080 los dejaba así porque me rendían mejor que a 3600, pero con la tarjeta nueva quise probar de nuevo: perfil DOCP a 3600 y el Infinity Fabric (FCLK) a 1800, para que quedaran sincronizados 1:1.

![Pantalla de arranque de la placa: "The system has POSTed in safe mode", con 49152 MB de memoria a DDR4-2400](/blog/rtx-5080-sin-imagen/modo-seguro.webp "La placa no aguantó los 3600 y arrancó en modo seguro, con toda la RAM a 2400.")

No arrancó: la placa cayó a modo seguro, con la RAM a 2400. Saqué los dos módulos de 8 GB, pensando que cuatro módulos le exigían demasiado al controlador de memoria del procesador, y tampoco. Probé 3200 con el FCLK a 1600: mismo resultado. Volví al perfil de 3000, que siempre había funcionado, y CPU-Z marcó 1200 MHz. CPU-Z muestra el reloj real, que en DDR es la mitad de la velocidad efectiva: estaba a 2400. El perfil ni siquiera se estaba aplicando.

Al final lo dejé a mano en 2933 con el FCLK a 1500, y por fin:

![CPU-Z mostrando 32 GB de DDR4 con la frecuencia de la DRAM en 1466 MHz y el controlador de memoria en 1501 MHz](/blog/rtx-5080-sin-imagen/cpu-z-2933.webp "1466 MHz de reloj, o sea DDR4-2933, con el controlador a 1501 MHz. Sincronizados.")

Para cerrar, le activé el Precision Boost Overdrive con un Curve Optimizer de -10 en todos los núcleos, que en la práctica es bajarle un poco el voltaje a la CPU para que sostenga mejor sus frecuencias.

## Cómo está hoy

Nueve meses después:

- **La fuente es la misma GameMax, con su cable 12V-2x6 nativo.** No la devolví y funciona. No sé exactamente qué cambió. El cable llegaba a la tarjeta con una curva cerrada justo en el conector, y con este estándar eso basta para que los pines de detección no hagan buen contacto, pero no tengo cómo comprobar que fuera eso.
- **La tarjeta anda en PCIe Gen4.** Lo medí hoy bajo carga. Forzar Gen3 no era el arreglo, y ya no lo uso. Va a x8, porque comparte el bus con una segunda tarjeta que uso para modelos de IA locales.
- **La RAM sigue en 32 GB, a 3000 MT/s.** En septiembre volví a probar los cuatro módulos y la placa ni siquiera hizo el POST. Por qué el kit no llega a 3600 en esta placa sigue siendo una pregunta abierta.

Hoy el PC corre Linux, y esto es lo que uso para revisarlo:

```bash title="bash · en qué generación de PCIe anda la tarjeta (mídelo con carga)"
nvidia-smi --query-gpu=name,pcie.link.gen.current,pcie.link.gen.max,pcie.link.width.current --format=csv
```

```bash title="bash · a qué velocidad anda la RAM, sin sudo"
udevadm info -q property /sys/devices/virtual/dmi/id | grep CONFIGURED_SPEED
```

## Lo que me llevo

- Cambia una cosa a la vez. Ese día cambié la tarjeta, la fuente, la BIOS, el modo del PCIe y la pasta, y cuando algo funcionó no supe por qué.
- Antes de levantar un disipador, calienta la pasta y gíralo. La palanca del socket AM4 no te salva.
- Los 3600 MHz de la caja son lo que el módulo promete, no lo que tu procesador y tu placa garantizan. Verifica con CPU-Z, y recuerda que muestra la mitad.
- Un 70-80 % dicho con seguridad no es un diagnóstico. La fuente que iba a devolver sigue en el PC y anda bien.
