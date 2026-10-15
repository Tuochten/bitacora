# Bitácora de wlaque.cl

Registro de todo lo hecho en este repo, para retomar desde cualquier sesión o máquina sin depender de la memoria de nadie. Leer en este orden: esta bitácora → `TAREAS.md` (qué falta) → `DUDAS.md` (decisiones abiertas y tomadas) → `revision/README.md` (cómo se dirige al modelo y las herramientas). Para publicar: `DESPLIEGUE.md`.

## Qué es

Sitio personal y blog de Wladimir Aqueveque H. en **Astro 7**, reconstruido con fidelidad exacta desde un handoff de **Claude Design** (`handoff/`, hoy v2.1.0). Estética de terminal en oliva y oro.

Se construye con un flujo de dos agentes: **Claude Code dirige y revisa** (escribe órdenes precisas, prepara los materiales, verifica con herramientas) y **OpenCode con un modelo local (Qwen3-Coder-Next 80B-A3B vía llama-swap) escribe los componentes**. El flujo es opcional: el sitio es Astro normal y se puede seguir con cualquier herramienta.

## Estado actual

| Parte | Estado |
|---|---|
| Home (v1.0) | ✅ Idéntica al prototipo v1: 9/9 piezas, 11/11 pasos de interacción, 0 píxeles distintos a 1440 y 390 px (2026-09-26) |
| Buscador tolerante y slugs descriptivos | ✅ (2026-09-26) |
| Home adaptada a v2.1 | ✅ 9/9 piezas IDÉNTICAS, filtro igual al prototipo, 0 píxeles distintos (2026-09-29) |
| Desarrollo web, Sobre mí, Contacto | ✅ 0 píxeles distintos a 1440 px; en Contacto solo difiere el reloj (muestra la hora actual). Formulario activo y probado en el preview (2026-10-12) |
| Blog: listado, entradas (3 variantes), RSS y sitemap | ✅ IDÉNTICOS al prototipo, 0 píxeles distintos a 1440 y 390 px (2026-09-29, tarde) |
| Contenido | ✅ 5 entradas reales y 4 proyectos; sin maqueta (2026-10-15) |
| Publicación | ✅ En `wlaque.cl` desde el 2026-10-12 (rutas, una subcarpeta del hosting anterior excluida, `www` redirigido) |

## Cronología

### 2026-09-23 · primer intento (repo `wladi-blog`, abandonado)
Se dirigió al modelo con el handoff v1 y se llegó a ~40%. Se descubrió que ese handoff era de una versión anterior del diseño. Lecciones: ninguna tarea nueva salió bien al primer intento, todas las correcciones sí; el modelo traduce mal de JSX a Astro y escribe código que falla en silencio; con sesiones largas de OpenCode reescribe archivos de memoria. De ahí salen las reglas de `AGENTS.md`.

### 2026-09-26 · este repo, home completa
Handoff v1.0.0. Método nuevo: kit preparado por el revisor, referencias de HTML ya renderizado, comparador exacto y probador de interacción. Resultado: 5 de 6 tareas nuevas bien al primer intento; el home quedó idéntico al prototipo. Después, a pedido del dueño: slugs descriptivos en todos los posts y buscador tolerante (guiones, tipeo, sinónimos).

### 2026-09-29 · handoff v2.1.0
El dueño entregó las páginas interiores (v2.1.0: blog con paginación, entrada con datos reales, desarrollo web, sobre mí y contacto; los proyectos pasan a ser entradas con `type: "proyecto"`).
- El revisor preparó el kit: `handoff/` reemplazado (la v1.0.0 queda en `7e428ae`), `revision/preparar-datos.py` (rutas de producción y slugs descriptivos; **correrlo con cada handoff nuevo**), `interior.css`, referencias de las 11 vistas y `src/lib/sitio.js` verificado contra el prototipo.
- **El modelo rindió mucho peor que el 26.** Orden 07 (adaptar el home): 3,6 horas, ningún commit, y por su cuenta empezó una página de blog con colecciones. Orden 08 (Desarrollo web): la página salió idéntica al primer intento, pero **modificó `src/lib/sitio.js`** para su blog no pedido y rompió el home. Orden 09 (Sobre mí y Contacto): armó 8 secciones como texto HTML (Astro lo escapa) y puso expresiones entre comillas en 3 `href`.
- El revisor corrigió directo (era más barato que otra ronda): terminó el home, restauró `sitio.js` y amplió su prueba, pasó Sobre mí a JSX y arregló los `href`. La diferencia visual que quedaba era que las páginas no importaban `prosa.css`; con eso, 0 píxeles distintos.
- El trabajo no pedido quedó en la rama `wip/blog-orden-07`, fuera de `main`.
- Reglas nuevas en `AGENTS.md` por estos errores. Herramienta nueva: medir posiciones de elementos con el navegador para ubicar diferencias de píxeles que el comparador de markup no ve (el script quedó en la sesión; rehacerlo con CDP como `probar-interaccion.mjs` si hace falta).
- Repo subido a GitHub, privado. Desde el 2026-10-12 tiene este espejo público, `Tuochten/bitacora`, con el historial empezado de cero.

**Lección:** el método funciona cuando la orden es chica y acotada. Órdenes grandes o encadenadas sin revisión entre medio (07→08→09 corrieron solas para ahorrar cuota) dejaron que un desvío de la 07 contaminara la 08. Mañana: una orden, una revisión.

### 2026-09-29 (tarde) · el blog completo
- Auditoría: lo construido estaba idéntico al diseño a 1440 y 390 px, pero faltaba el blog: 27 links internos rotos.
- `wlaque.cl` ya está en Cloudflare y responde una página vacía: se publica con Cloudflare Pages conectado a GitHub (`DESPLIEGUE.md`, y la nota "Publicar wlaque.cl" de la bóveda del dueño).
- El revisor escribió el plugin de Markdown (`src/lib/remark-bitacora.js`). Astro 7 usa otro procesador por defecto (Sätteri); para remark hace falta `@astrojs/markdown-remark`, paquete oficial.
- **Orden 10 (entrada), mal otra vez:** 2,8 h sin commits, y el modelo **modificó `comparar.py` y los archivos de referencia** para que sus pruebas pasaran. Se revirtió todo `revision/` y el revisor corrigió los 4 errores reales. Desde ahí, `revision/` es de solo lectura para el desarrollador (`AGENTS.md`).
- **Decisión:** el JS de la entrada y el listado del blog los escribió el revisor directo; salió idéntico al primer intento y mucho más rápido que dirigir. OpenCode queda para trabajo de volumen del mismo molde (importar posts), no para páginas con lógica.
- Listado con rutas estáticas generado desde `src/lib/blog.js` (`getStaticPaths` de Astro corre aislado y solo ve lo importado). Paginación portada a `sitio.js` y verificada.
- RSS, sitemap y robots.txt sin dependencias, sin las entradas de maqueta.

### 2026-09-30 · las primeras entradas reales
- Claude Desktop sacó tres borradores de la bóveda (btrfs, Pi-hole, ffmpeg). El revisor los contrastó contra el sistema, el servidor (por SSH, solo lectura) y los registros, y los reescribió como historia que va al grano.
- Errores de hechos corregidos: en btrfs los dos balances fueron en discos distintos (NVMe con 1 GiB sin asignar, y respaldos); en Pi-hole la causa fue un compose sin puertos publicados, no "Docker dejando puertos a medias" (si el bind falla, Docker no levanta el contenedor). Redacción corregida en ffmpeg (base del porcentaje de nlmeans, comparación de BM3D).
- Verificado y conservado: el script del 53 sí se revierte solo, el DNS global tiene Cloudflare de respaldo, y la forma `$d` dentro de un `ExecStart` funciona (se probó con una unidad de usuario).
- Datos: `src/data/posts-propios.json` (no viene del handoff); `preparar-datos.py` en modo producción saca toda entrada sin Markdown. **Para comparar contra el prototipo: `python3 revision/preparar-datos.py --prototipo && pnpm build`, y al terminar volver a correrlo sin la opción.**
- El plugin arma figuras con pie y medidas (`![alt](/ruta.webp "pie")`, sola en su párrafo); `prosa-extra.css` da estilo a tablas y figuras.
- Segunda vuelta, a pedido del dueño: la entrada usa todo el ancho de su columna (el diseño traía `68ch`) y el título no se corta en tres líneas; **los bloques de código ya no llevan botón Copiar**; el post de Pi-hole parte con el contexto (qué es el servidor y qué hace Pi-hole) y bajó de 6 a 3 min. Lleva una imagen: una **reconstrucción** de `docker ps` (healthy, sin puertos publicados) y `dig` sin respuesta, hecha en HTML y capturada con Chromium. Si una imagen tiene versión angosta (`foto.movil.webp`), el plugin arma un `<picture>` que la usa hasta 600 px: en una captura con texto, la versión ancha no se lee en el celular.
- **Favicon:** el ongoro original en color (morado, collar naranjo), sacado de `mascot-svg.js` del primer handoff (`pagina-personal/Handoff Claude Design/`) con sus colores; reemplaza los de Astro que traía el andamio. `favicon.svg` + `favicon.ico` (16/32/48) + `apple-touch-icon.png` (con fondo).
- **Portada sin imagen de la entrada (`.cover-term`):** más baja (el texto empieza ~130 px antes), título en una línea y el ongoro de contorno asomándose de fondo, entre la textura y el texto.
- **Portadas en las miniaturas** (`.th` del listado y `.pin-th` del destacado): `portada.webp` de 960×600 en `public/blog/<slug>/`, puesta en `cover` de `posts-propios.json`. ffmpeg: recorte del cuadro original con el timestamp de la cámara (sin caras); Pi-hole y btrfs: portadas tipográficas con el dato de la historia, hechas en HTML y capturadas. `preparar-datos.py` deja en `null` las portadas cuyo archivo no está en `public/` (la de WooCommerce del handoff no existe); **no se verifica en el build con `fs`, porque en el build de Cloudflare `public/` no se encontró así y todas las miniaturas salieron con el ongoro** (arreglado el 2026-10-04); si no hay, va el ongoro asomándose (`miniaturas.css`, global). La entrada sigue con `.cover-term` aunque tenga portada: la foto 16:7 del diseño empujaría el texto hacia abajo.
- **Desplegado como preview** en `https://wlaque.w-aqueveque.workers.dev` (el dueño, pasos 1 y 2 de `DESPLIEGUE.md`): Cloudflare lo creó como **Worker con assets estáticos**, no como Pages, y sin `wrangler.jsonc` en el repo (lo arma solo al detectar Astro). Cada push a `main` lo vuelve a desplegar.
- **Contacto sin Gmail ni llamada**: el formulario escribe a `contacto@wlaque.cl` (forzado en `preparar-datos.py`). Esa casilla vivía en el hosting anterior del dominio, y el dueño prefirió que el correo del sitio no dependiera de él: el plan para que el formulario envíe solo y avise al Gmail está en `PLAN-FORMULARIO.md`.
- **Formulario con Worker y Turnstile** (rama `formulario`): `wrangler.jsonc` (assets de `dist/`, Worker solo en `/api/*`, `send_email`, límite de 3 por minuto por IP) y `worker/index.js`; el Gmail y la clave de Turnstile son secrets del Worker. Probado en local con `wrangler dev` y las claves de prueba (curl y `revision/probar-formulario.mjs`). No se une a `main` hasta que el dueño active Email Routing: ver `PLAN-FORMULARIO.md`. Sin tarjeta PGP desde el mismo día.

### 2026-10-12 · el formulario de contacto, activo
- El dueño hizo los pasos del panel: Email Routing (los MX y el SPF de `wlaque.cl` pasaron del hosting anterior a Cloudflare, verificado con `dig`), widget de Turnstile y los secrets `TURNSTILE_SECRET` y `DESTINO`. La rama `formulario` se unió a `main` (`76a4a64`) con la Site key real.
- **Probado en el preview por el dueño:** el aviso llega a Gmail y la respuesta va al email del visitante (*Reply-To*).
- Tres trampas del panel, ya anotadas en `PLAN-FORMULARIO.md`: (1) en **Settings** hay dos secciones de variables; la de la caja de *Build* solo existe al compilar y el Worker no la ve (síntoma: `{"codigo":"no-configurado"}`). La buena es **Runtime variables and secrets**, arriba. (2) Mientras el Worker publicado sea solo archivos, esa sección dice *"Variables cannot be added to a Worker that only has static assets"*: hay que publicar el código primero y recargar la pestaña. (3) Una Site key mal copiada hace que el widget muestre solo un link "Troubleshoot"; Turnstile da el error **400020**. Se diagnostica abriendo la página con CDP y `turnstile.render(..., {"error-callback"})`; el captcha en sí no se puede resolver en un Chromium headless (modo Managed), eso lo prueba una persona.

### 2026-10-12 (tarde) · wlaque.cl en línea
- **Dominio conectado con rutas, no con "Custom domain":** `wlaque.cl/*` → Worker `wlaque` y una ruta sin Worker para una subcarpeta que sigue en el hosting anterior. El DNS no se tocó. `www` → `wlaque.cl` con una Redirect Rule (301, conserva la query). Verificado con `curl`: home, blog, contacto, RSS, 404, la subcarpeta excluida y el formulario en el dominio. Detalle en `DESPLIEGUE.md` paso 3.
- **Link de GitHub** (`github.com/Tuochten`) como regla de `preparar-datos.py`: `src/data/site.json` se regenera desde el handoff, editarlo a mano no dura.
- **`og.png`:** el dueño eligió entre tres propuestas una mezcla: la ventana con barra de título y × (estilo Steam de los 2000), el ongoro a color grande y su foto chica en la barra.
- **Textos reales de los proyectos.** `preparar-datos.py` ahora deja que un post de `posts-propios.json` reemplace al del handoff con el mismo slug. wlaque.cl pasó a ser un post en Markdown (`src/content/blog/wlaque-cl.md`, aprobado por el dueño) que cuenta este proyecto y lo que él puso; el Laboratorio de pentesting dice lo que hay de verdad (Kali y Metasploitable 2; las apps web vulnerables todavía no están instaladas).
- **Diseño de la entrada, pedido del dueño y aplicado a todas:** el título va una sola vez, en la portada (ahora es el `h1`; con títulos de más de 34 caracteres usa letra más chica y el título completo, ya no el corto), la cabecera queda más baja, los `h2` del cuerpo van sin número (el índice lateral sí numera), la bajada va en un recuadro con línea dorada y el cuerpo subió de contraste (`#d6dcc4` en vez de `--mid`). Todo en `prosa-extra.css`, que solo carga la entrada.

### 2026-10-12 (noche) · contraste, RSS y limpieza
- **Más contraste en todo el sitio** (pedido del dueño): `--mid` `#d6dcc4`, `--low` `#b0ba98`, `--faint` `#97a37c` y el cuerpo de las entradas `#e2e6d2`; `--hi` no cambia. Ya cumplían 4,5:1, pero la letra mono delgada sobre el oliva cansaba. Van en `src/styles/ajustes.css`, cargado al final por `Base.astro`, para que un handoff nuevo no los pise.
- **Sin links a RSS** (pie y barra del blog); el feed `/rss.xml` y su `<link rel="alternate">` siguen.
- Sobre mí: el rol ya no deja "Ingeniería." sola en la segunda línea (`.intro .lede` sin el `62ch`).
- Ramas `wip/blog-orden-07` y `formulario` borradas. El handoff del primer diseño (el de los intentos abandonados) quedó archivado fuera del repo.

### 2026-10-12 (noche) · espejo público
- **El trabajo sigue en este repo privado** (decisión del dueño: aquí está todo el contexto). Desde el 2026-10-12 hay un **espejo público, `Tuochten/bitacora`** (carpeta hermana `../bitacora`), con historial empezado de cero, commits firmados con el correo anónimo de GitHub, README y licencia propios (MIT el código; textos, fotos, ongoro y diseño reservados).
- Para actualizarlo: `python3 revision/espejo-publico.py` (simula) y `--escribir` (copia). Limpia sola el Gmail del handoff, las capturas del handoff y los pasajes privados de la bitácora y las guías, y **se niega a copiar** si encuentra algo de su lista de prohibidos. Ese script no se copia al espejo. El commit del espejo se revisa y se hace a mano, en `../bitacora`.
- Cloudflare sigue desplegando desde este repo privado; el espejo no despliega nada.
- Miniatura del post de wlaque.cl: el home en pequeño (captura del dueño, recortada a 960×600).

### 2026-10-15 · post de Virtual Machine Manager
- Primer post sacado del export de ChatGPT del dueño: `virt-manager-se-comio-el-dns`, con 4 capturas suyas de esos chats. Los hechos se contrastaron con el historial de `apt` del servidor y con el desktop; donde el export no muestra el desenlace, el texto no lo afirma.
- En las capturas se tapó el nombre del servidor (queda `homelab-1`), el del tailnet y la IP de Pi-hole en Tailscale. Las de terminal tienen versión `.movil` reconstruida en HTML.
- **Fecha de publicación elegida: 2026-10-02**, a pedido del dueño de no fecharlo hoy: queda después del post de Pi-hole (26-sep), que enlaza y cuyo estado final describe.
- `espejo-publico.py` ahora permite `192.168.122.x`: es la red por defecto de libvirt, igual en cualquier máquina.

## Decisiones tomadas

| Decisión | Por qué |
|---|---|
| Slugs descriptivos en los posts | SEO, aprobado por el dueño. "Primer año…" usa `estudiar-seguridad-lo-que-nadie-te-dice`: la ñ se pierde y "ano" no sirve |
| Proyecto "Homelab Linux" con slug `homelab-linux`, no `homelab-proxmox` | Proxmox se descartó y el stack del proyecto no lo usa |
| El HTML se genera en el build, no en el navegador | El prototipo arma todo con JS desde `site.json`; en Astro eso es malo para SEO y para cargar sin JS |
| El filtro del home muestra y oculta filas | Igual comportamiento que el prototipo, sin duplicar el markup de la fila en JS |
| Buscador tolerante, distinto al prototipo | Pedido del dueño: "pihole" no encontraba "Pi-hole" |
| Donde el README v2.1 se contradice, manda "Qué cambió respecto a v2.0.0" | Lo dice el propio README: la parte de abajo viene de la v2.0.0 |

## Pendiente

Ver `TAREAS.md`.

## Entorno y trampas conocidas

- **Repo:** `git clone https://github.com/Tuochten/bitacora.git` (espejo público; el trabajo diario va en un repo privado). Desde otra máquina: `pnpm install && pnpm dev` y leer esta bitácora.
- **Máquina de trabajo:** desktop CachyOS (RTX 5080 16 GB + RTX 2060 8 GB). El modelo local y llama-swap (`127.0.0.1:9292`) solo existen ahí. Desde otra máquina el sitio se trabaja igual (`pnpm install && pnpm dev`), pero sin el agente local.
- **El agente de OpenCode corre en un panel de herdr** llamado `constructor`. Cómo montarlo: `revision/README.md`.
- **La herramienta Write de Claude Code convierte los escapes `̀` en caracteres literales.** Después de escribir un archivo con escapes Unicode, revisar con `grep -c u0300` y corregir con un script de Python.
- **El agente se lleva en su commit los archivos que el revisor deje sin commitear.** Commitear antes de mandar cada orden.
- **No correr `pnpm build` mientras el agente trabaja**: los dos escriben en `dist/`.
- `pkill -f <patrón>` desde Claude Code mata a su propio shell: matar por PID.
- `astro preview` en Astro 7 es un demonio que escucha solo en IPv6: los scripts sirven `dist/` con Python.
- **Astro guarda el Markdown ya procesado en `.astro/data-store.json`** (y `node_modules/.astro/`): si cambias `src/lib/remark-bitacora.js`, solo se reprocesan los `.md` que cambiaron. Borrar esos dos archivos antes del build; `pnpm dev` hay que reiniciarlo. Cloudflare compila desde cero, así que allá no pasa.
- **pnpm 12 corta la instalación si una dependencia trae script de instalación sin aprobar** (`ERR_PNPM_IGNORED_BUILDS`), también en el build de Cloudflare. Se aprueban en `allowBuilds` de `pnpm-workspace.yaml` (ahí están `esbuild`, `sharp` y `workerd`).
- Los scripts abortan si su puerto está ocupado: un servidor viejo hizo capturar un prototipo equivocado.
