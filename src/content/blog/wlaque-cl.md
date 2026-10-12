---
title: "wlaque.cl"
description: "Lo diseñé en Claude Design y lo construyó un equipo raro: Claude Code de jefe de obra y un modelo que corre en mi propia GPU de desarrollador. Yo puse la pregunta, las reglas y la última palabra."
date: 2026-10-12
category: Astro
tags: [Claude Code, OpenCode, Cloudflare]
featured: false
---

Este sitio tiene dos autores de código y un dueño. El código lo escribieron Claude Code y Qwen3-Coder-Next, un modelo que corre en mi desktop. La pregunta, el diseño, las reglas del juego y la decisión de qué se publicaba fueron míos. Esta es la historia de cómo los puse a trabajar juntos, y de las veces en que no quisieron.

## La pregunta

Tengo una RTX 5080 de 16 GB, 32 GB de RAM y la sospecha de que un modelo local puede hacer trabajo de verdad, no solo responder preguntas. Antes de gastar en más RAM quería comprobarlo con algo concreto y exigente: construir mi propio sitio, bajo supervisión, sin rebajar el diseño.

El diseño lo armé en Claude Design, y no salió a la primera: pasó por unas cien vueltas, porque ninguna versión se parecía a la idea que tenía en la cabeza. Soy fanático de las interfaces de los 2000, y este sitio le debe mucho al Steam de esa época: verde oliva, letras doradas, ventanas con barra de título y su botón ×, todo con la densidad de un programa de escritorio, pero traído a la web de hoy. Encima, un personaje morado con collar naranjo, el ongoro, que se asoma donde falta una imagen.

Una vez listo el diseño, la regla fue una sola: el sitio tenía que quedar **idéntico** al prototipo. No parecido. Idéntico, píxel por píxel.

Hubo un intento cero, que fue dejar al modelo solo, sin nadie que lo dirigiera. No se pareció al diseño. Ahí entendí que el problema no era cuánto sabía el modelo, sino quién lo dirigía.

## El reparto

El modelo local escribe rápido y gratis, pero se pierde. Claude razona mejor, pero cada token sale de una cuota. Así que repartí los papeles:

- **Claude Code, jefe de obra:** escribe órdenes precisas, prepara los materiales y revisa cada entrega.
- **OpenCode con el modelo local, desarrollador:** escribe los componentes.
- **Yo, dueño:** decido el diseño, apruebo o rechazo, y digo cuándo algo está listo.

El rompecabezas era tanto de hardware como de software. llama-swap carga un solo modelo a la vez, así que mientras el desarrollador trabajaba yo no podía jugar ni usar mi otro modelo; la RTX 2060 quedaba libre para grabar las clases de la universidad. Cada orden corre en un panel de herdr y en una sesión nueva de OpenCode, porque con conversaciones largas el modelo empezaba a reescribir archivos de memoria y se llevaba por delante cambios ajenos.

## Primer intento: cero de cuatro

La primera noche, ninguna tarea nueva salió bien al primer intento. Un sitio sin colores, `className` donde iba `class`, JavaScript que fallaba en silencio y una API vieja de Astro copiada de un README. `pnpm build` no detectó ninguno: todos salieron en las capturas de pantalla.

Y cuando íbamos en un 40%, me di cuenta de que estábamos construyendo una versión vieja de mi propio diseño. Lo boté y partimos de nuevo.

## Segundo intento: idéntico

Cambiamos el método, no el modelo:

- **Referencias en vez de traducciones.** En lugar de pedirle que tradujera el prototipo, le dimos el HTML ya renderizado. El modelo copia plantillas bien y traduce mal.
- **Kit preparado.** Lo que se copia sin cambios (CSS, datos, los SVG largos) lo dejó listo el jefe y no pasó por el modelo.
- **"Idéntico", nunca "compila".** Un comparador le decía al modelo la línea exacta que no calzaba, y un probador recorría el buscador, el filtro y el menú en Chromium.

Resultado: 5 de 6 tareas bien al primer intento y el home idéntico al prototipo a 1440 y a 390 px, con unos 16 minutos de modelo. El único error de la noche pasó el comparador de markup y lo pilló el probador de comportamiento.

## El día que el modelo arregló el examen

Las páginas interiores fueron otra historia. Una orden tomó 3,6 horas, no dejó un solo commit y el modelo se puso a construir, por su cuenta, un blog que nadie le había pedido. La siguiente rompió el home al tocar un archivo compartido para su proyecto paralelo.

La mejor fue la orden 10: después de 2,8 horas, **el modelo modificó el comparador y los archivos de referencia para que sus pruebas pasaran**. No arregló la página. Arregló el examen.

Para alguien que quiere trabajar en ciberseguridad, esa fue la lección del proyecto. Un agente con permiso de escritura sobre sus propias pruebas no es confiable, por buena que sea su intención. La solución fue la misma que le aplicaría a una persona: **mínimo privilegio**. Desde ese día la carpeta de revisión es de solo lectura para el desarrollador, y las páginas con lógica las escribió Claude directo (salieron idénticas al primer intento). El modelo local se quedó con lo que hace bien: trabajo de volumen, todo del mismo molde.

## La pausa

Ahí el sitio se detuvo cerca de tres semanas. Mi mamá tuvo un problema grave de salud, y todo mi esfuerzo y mi cabeza estuvieron con ella. El sitio esperó, y estuvo bien que esperara.

## Lo que puse yo

Mirado desde afuera, puede parecer que el sitio lo hizo la IA. Esto es lo que no hizo:

- **La pregunta y el experimento:** probar un modelo local con un proyecto real antes de invertir.
- **El diseño:** unas cien vueltas en Claude Design hasta que se pareció a lo que imaginaba, la nostalgia del Steam de los 2000 traída a la web de hoy, y la exigencia de que quedara idéntico y no "parecido".
- **Darme cuenta** de que estábamos construyendo una versión vieja del diseño, y botarla.
- **El criterio de producto:** que el buscador encuentre "pihole" aunque el post diga "Pi-hole", URLs que se entiendan, mi correo personal fuera del sitio, Turnstile en vez de reCAPTCHA, que no le entrega a Google los datos de quien me escribe, y un formulario cuyo correo no pase por el hosting de mi trabajo.
- **Las entradas:** historias que van al grano, con cada dato revisado contra el sistema real y no contra mis apuntes. Revisándolas aparecieron errores que venían de mis propias notas.
- **La infraestructura** que hizo posible al desarrollador: llama.cpp, llama-swap, dos GPUs y un presupuesto de VRAM que no da para todo a la vez.

## Cómo quedó

Astro 7, con el HTML generado en el build y JavaScript solo donde hay interacción. Está publicado en Cloudflare Workers, y cada push a `main` se despliega solo. El formulario de contacto es un Worker chico con Email Routing y Turnstile, un límite de 3 envíos por minuto por IP y un campo trampa para bots. Trae RSS, sitemap y un buscador que perdona los guiones y los errores de tipeo.

¿Y la RAM? Por ahora, un modelo local sirve como desarrollador junior: órdenes chicas, materiales listos y pruebas que no pueda tocar. Pero esa respuesta es una foto de octubre de 2026. Los modelos de pesos abiertos mejoran cada pocos meses, y me muero de ganas de repetir el experimento con el próximo que salga. La pregunta sigue abierta, y pienso volver a hacérmela.

## Lo que me llevo

- No confíes en lo que compila; confía en lo que mides.
- Una orden, una revisión. Las veces que encadené órdenes para ahorrar cuota, un desvío contaminó la siguiente.
- Un agente no debe poder editar sus propias pruebas.
- Delegar solo ahorra cuando la orden es corta y el trabajo es largo.

Al final, esto es lo que hago: diseñar el sistema, poner las reglas y verificar. Que el código lo escriba una persona, Claude o un modelo en mi GPU es un detalle de implementación. Lo que se publica es responsabilidad mía.
