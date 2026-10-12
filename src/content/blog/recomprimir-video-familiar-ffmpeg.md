---
title: "Recomprimir 27 horas de video familiar con ffmpeg (y todo lo que la receta popular hace mal)"
description: "55 GiB de cintas digitalizadas quedaron en 32 GiB sin pérdida visible. Por el camino, cuatro de cinco decisiones salieron al revés de lo que recomienda todo el mundo."
date: 2026-09-18
category: Homelab
tags: [ffmpeg, Video, GPU]
featured: true
---

Tenía 18 videos familiares digitalizados desde cinta, 27 horas en total, ocupando 55 GiB. La idea era simple: achicarlos para tener una copia fuera de la casa. Terminé midiendo todo, y la mitad de lo que "todo el mundo recomienda" no servía para este caso. Los videos mentían sobre su propia resolución, el denoise clásico casi no hacía nada y limitar los hilos del procesador no le bajó ni un grado a la temperatura.

## El problema real no era el espacio

Los videos estaban en un disco de 2 TB. Ocho de ellos existían en un solo lugar: si ese disco moría, se perdían para siempre. Los otros diez estaban repetidos cinco veces. O sea, tenía harta redundancia, pero toda del lado equivocado.

El objetivo quedó en dos cosas: tener una copia de todos fuera de la casa, y que pesaran lo suficientemente poco como para caber en los ~50 GiB que me quedaban libres en Google Drive.

> [!WARNING] Paso cero: respaldar antes de tocar nada
> Antes de experimentar copié los ocho videos huérfanos a otro equipo y comparé el hash SHA-256 de los dos lados, no el tamaño. Un proceso de recompresión que se come el original es una forma bien cara de aprender.

## Mira los archivos antes de suponer

Un `ffprobe` sobre los 19 archivos (uno venía partido en dos) me dejó dos sorpresas.

**Los videos "1080p" y "720p" eran imagen 4:3 con franjas negras pegadas a los lados.** El digitalizador metió cinta 4:3 dentro de un marco 16:9. Codificar esas franjas es gastar bits en negro y, peor, mantener una resolución inventada.

![Cuadro de uno de los videos: la imagen 4:3 ocupa el centro y a los lados hay franjas negras](/blog/recomprimir-video-familiar-ffmpeg/franjas-negras.webp "Un «1080p»: la imagen real es 4:3, de 1440×1080, y el resto son franjas negras.")

**Los de 480p decían ir a 60 y hasta 120 cuadros por segundo, pero en realidad iban a 30.** Era video de cuadros variables con marcas de tiempo irregulares. Sin normalizarlo, el codificador trabaja de más.

Detectar las dos cosas cuesta un par de comandos:

```bash title="bash · detectar franjas y fps reales"
# franjas negras: muestrear algunos segundos a mitad del video
ffmpeg -ss 1200 -i entrada.mp4 -t 8 -vf cropdetect=limit=24:round=2 -f null -

# cuadros por segundo reales (avg_frame_rate), no los declarados
ffprobe -v error -select_streams v:0 -show_entries stream=avg_frame_rate -of csv=p=0 entrada.mp4
```

De ahí salió la regla que gobernó todo el trabajo: **nunca escalar hacia arriba**. Una cinta VHS no tiene detalle de 1080p, así que ese 1080p es una ampliación de algo que nunca existió. Los de 1440×1080 bajaron a 960×720 y los de 640×480 se quedaron igual.

## El denoise clásico casi no servía

El grano de la cinta es lo que hace pesados estos archivos: el codificador gasta sus bits en reproducir ruido. Por eso se aplica denoise antes de codificar. La receta de siempre es `hqdn3d`, así que la medí contra las alternativas, todas con el mismo CRF:

| Denoise | Video a 720p | Video a 480p |
|---|---|---|
| Sin denoise | 5352 kbps | 2766 kbps |
| `hqdn3d=4:3:6:4.5` | 4958 kbps | 2599 kbps |
| `nlmeans_vulkan`, fuerza 3 | 4638 kbps | 2330 kbps |
| **`nlmeans_vulkan`, fuerza 5** | **4226 kbps** | **2017 kbps** |

`hqdn3d` ahorraba apenas un 7%. El `nlmeans` en GPU (`nlmeans_vulkan`, que ya viene en ffmpeg y no hay que instalar nada) ahorró entre 15 y 22% más que `hqdn3d`, o sea, entre 21 y 27% frente a no filtrar. Ampliando las caras no se nota pérdida de detalle: lo que se va es grano, no información. Además, como es un filtro espacial, no deja estelas en el movimiento como puede pasar con el temporal de `hqdn3d`.

![El mismo cuadro tres veces: sin denoise, con hqdn3d y con nlmeans_vulkan fuerza 5](/blog/recomprimir-video-familiar-ffmpeg/denoise-comparado.webp "El mismo cuadro a 480p: sin denoise (2766 kbps), hqdn3d (2599) y nlmeans fuerza 5 (2017). Se va el grano, no el detalle.")

## Elegir el CRF con VMAF, no a ojo

El CRF es la perilla de calidad de x264: más alto, más chico y más feo. En vez de adivinar, medí con VMAF cuánta calidad se pierde en cada nivel **contra la fuente ya filtrada**, que es lo que separa la pérdida de la compresión de la del denoise.

Sobre VMAF 98 la diferencia no se ve. CRF 22 se mantuvo por encima de esa línea en los tres videos de prueba y pesaba un 25% menos que CRF 20, que solo aportaba décimas invisibles. Elegido.

![Gráfico de VMAF contra bitrate para cada CRF en tres videos de prueba](/blog/recomprimir-video-familiar-ffmpeg/vmaf-por-crf.webp "Cada punto es un CRF. El círculo marca el 22: sobre VMAF 98 en los tres videos, con mucho menos bitrate que el 20.")

> [!WARNING] La trampa que casi me hace elegir mal
> Al comparar un .mp4 contra un .mkv, VMAF me dio mínimos de 0 y un promedio de 1,5 sobre 100. No era el video: las marcas de tiempo estaban desalineadas y estaba comparando el cuadro 1 contra el 40. La solución es forzar la alineación por número de cuadro en las dos entradas, con `setpts=N/(30*TB)` en cada una antes de pasarlas a `libvmaf`.

```bash title="bash · VMAF con cuadros alineados"
ffmpeg -i codificado.mp4 -i referencia.mkv -lavfi \
  "[0]setpts=N/(30*TB)[a];[1]setpts=N/(30*TB)[b];[a][b]libvmaf" -f null -
```

## ¿Y codificar en la GPU?

Parece obvio que sí: tengo una RTX 5080 ahí mismo. Medí NVENC contra x264 con el mismo material:

| Codificador | Bitrate | VMAF | Velocidad |
|---|---|---|---|
| x264 `slower`, CRF 22 | 4958 kbps | 98,37 | 89 cuadros/s |
| x264 `slow`, CRF 22 | 4915 kbps | 98,21 | 161 cuadros/s |
| NVENC `p7`, cq 22 | 5544 kbps | 98,21 | 454 cuadros/s |

**A igual calidad, NVENC pesa 13% más.** Es rapidísimo, pero acá el archivo tenía que caber en Drive, no salir rápido. Y de paso salió un regalo: `slow` da la misma calidad que `slower` al doble de velocidad. El preset "mejor" costaba tiempo a cambio de nada.

Conclusión: la GPU sirvió para el denoise, no para codificar.

## Lo mejor no siempre gana

También probé BM3DCUDA, el denoiser serio del mundo de la restauración de video. Hay que compilarlo a mano y pasa por VapourSynth. En movimiento se ve mejor que todo lo demás. Pero frente a `hqdn3d` ahorraba solo un 2-4% en los videos de 720p (10-16% en los de 480p) y **duplicaba el tiempo estimado, a 12-13 horas**. `nlmeans` en GPU le ganaba en espacio y en tiempo, y para videos de familia guardados en Drive no valía el doble de noche.

## La cadena final

El flujo quedó así: recortar las franjas, bajar a 960×720 (o normalizar los fps a 29,97 en los de 480p), denoise `nlmeans_vulkan` en la GPU, codificar con x264 `slow` CRF 22, y copiar el audio tal cual. Recodificar el audio solo agrega pérdida y no ahorra nada que se note.

```bash title="bash · un video 1080p con franjas"
ffmpeg -init_hw_device vulkan=vk:0 -filter_hw_device vk -i entrada.mp4 \
  -map 0:v:0 -map 0:a:0 \
  -vf "crop=1440:1080:240:0,scale=960:720:flags=lanczos,format=yuv420p,hwupload,nlmeans_vulkan=s=5:p=7:r=15,hwdownload,format=yuv420p" \
  -c:v libx264 -preset slow -crf 22 -pix_fmt yuv420p \
  -c:a copy -map_metadata 0 -movflags +faststart salida.mp4
```

Dos detalles que sirven para cualquier tarea larga, no solo para video:

- **Córrela como servicio de systemd de usuario** (`systemd-run --user --unit=...`) y no en una terminal. Así sobrevive a que cierres la sesión.
- **Haz el script reanudable.** Que escriba a un `archivo.part.mp4`, compare la duración contra el original y recién ahí renombre. Si se corta, al relanzarlo salta lo que ya está hecho.

## El hallazgo que no esperaba: la temperatura

Con todo corriendo, el procesador quedó a 87 °C. Lo primero que probé fue limitarle los hilos con la cuota de CPU de systemd. Medido:

| Hilos disponibles | Temperatura |
|---|---|
| 24 | 87 °C |
| 18 | 84 °C |
| 14 | 84 °C |
| 10 | 85 °C |

**Limitar los hilos no baja la temperatura.** Con menos núcleos ocupados, el procesador sube la frecuencia de los que quedan y el calor se mantiene. Lo único que pierdes es rendimiento.

Lo que sí funciona es bajar el techo de frecuencia, porque con la frecuencia baja el voltaje, y eso es lo que calienta:

```bash title="bash · techo de 3,8 GHz (no sobrevive a un reinicio)"
sudo sh -c 'for f in /sys/devices/system/cpu/cpufreq/policy*/scaling_max_freq; do echo 3800000 > "$f"; done'
```

**De 85 °C a 50 °C.** Y lo mejor: **la conversión siguió exactamente a la misma velocidad.** El cuello de botella era el denoise en la GPU, así que el procesador pasaba esperándolo con hilos de sobra. Bajar la frecuencia no le quitó nada al trabajo, solo le quitó calor.

Estuve a punto de "arreglar" la parte que no era el problema.

## El resultado

- **Originales:** 55,4 GiB
- **Convertidos:** 32,2 GiB (42% menos)
- **Tiempo total:** 4 h 38 min
- **Errores:** ninguno; las 19 duraciones calzan con el original

![El mismo cuadro antes y después: original en 1080p con franjas a 8 Mbps y convertido a 960×720 a 4,4 Mbps](/blog/recomprimir-video-familiar-ffmpeg/antes-despues.webp "Antes y después: el original de 8 Mbps y el convertido de 4,4 Mbps.")

Los que menos bajaron ya venían con bitrate bajo: no había grasa que sacar. Uno quedó prácticamente igual, y eso también es información útil: **no todo archivo viejo está mal comprimido**.

![Gráfico de barras con el tamaño original y convertido de cada uno de los 19 archivos](/blog/recomprimir-video-familiar-ffmpeg/tamanos-por-video.webp "Cuánto bajó cada archivo. Los que menos bajaron ya venían con bitrate bajo.")

## Lo que me llevo

- **Mide antes de decidir.** Cuatro de las cinco decisiones importantes salieron al revés de la receta popular: `hqdn3d`, NVENC, el preset `slower` y limitar hilos.
- **Averigua quién manda en el tiempo total**, o vas a optimizar con mucho esfuerzo la parte equivocada.
- **VMAF sirve, pero alinea los cuadros**, o te va a mentir con muchísima autoridad.
- **Respalda y verifica con hash** antes de tocar los originales.
- **Lo técnicamente mejor no siempre gana.** BM3D se ve mejor y no lo usé, porque el doble de tiempo no compraba nada que yo fuera a notar.
