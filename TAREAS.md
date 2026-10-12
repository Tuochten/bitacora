# Tareas

Orden de trabajo para el handoff v2.1.0. Marca con `[x]` solo lo que la orden te pida marcar, en el mismo commit.

Decisión de arquitectura: el prototipo arma el HTML en el navegador desde `data/site.json`. **En Astro ese HTML se genera en el build** leyendo `src/data/site.json` con un `import`. Solo quedan como JS de cliente las cosas interactivas. El HTML exacto de cada vista está en `revision/referencia/<vista>-main.html` y `proto-<vista>.dom.html`; se verifica con `python3 revision/comparar.py <selector> <vista>`.

## Hecho

- [x] Kit v1: CSS, assets, datos, SVG del personaje y del guardián (revisor).
- [x] Home completa: layout, cabecera, pie, hero, "Ahora mismo", destacado, filas, proyectos, barra lateral, menú móvil, buscador tolerante y filtro por tema.
- [x] Kit v2.1 (revisor): datos con `revision/preparar-datos.py`, `interior.css`, referencias de las 11 vistas, `src/lib/sitio.js` verificado.
- [x] Home adaptada al modelo v2.1: solo entradas en recientes, proyectos como entradas, límite también con tema activo.
- [x] Desarrollo web (`/desarrollo-web/`).
- [x] Sobre mí (`/sobre-mi/`).
- [x] Contacto (`/contacto/`), con reloj de Santiago y formulario por `mailto:`. Desde el 2026-09-30 sin la tarjeta de Email, sin la de llamada (Cal.com) y con el formulario a `contacto@wlaque.cl`: el Gmail no se publica.

- [x] Markdown de las entradas con el markup del diseño (`src/lib/remark-bitacora.js`) — 2026-09-29.
- [x] Entrada `/blog/[slug]/` en sus tres variantes (con Markdown, sin cuerpo, proyecto) y su JS — 2026-09-29.
- [x] Listado del blog con todas sus rutas estáticas (tipo × tema × página) — 2026-09-29.
- [x] RSS, sitemap y robots.txt, sin las entradas de maqueta — 2026-09-29.

## Pendiente (antes de publicar en wlaque.cl)

- [x] 1. Contenido real: 4 entradas (WooCommerce, btrfs, Pi-hole, ffmpeg) — 2026-09-30. Más posts: el `.md` a `src/content/blog/` y sus datos a `src/data/posts-propios.json`.
- [x] 2. Maqueta fuera: `preparar-datos.py` en modo producción saca toda entrada sin cuerpo en Markdown — 2026-09-30.
- [x] 2b. Textos reales de los proyectos wlaque.cl (post en Markdown) y Laboratorio de pentesting — 2026-10-12, en `posts-propios.json` (reemplazan por slug a los del handoff). Homelab (desde 2024, IA local corregida: vive en el desktop) y WooCommerce (desde 2013) corregidos el mismo día.
- [x] 3. Link de GitHub (`github.com/Tuochten`, regla en `preparar-datos.py`) — 2026-10-12. Pendiente aparte: revisar qué repos dejar públicos.
- [x] 4. `og.png` (ventana de terminal con el ongoro y la foto chica) — 2026-10-12.
- [x] 5. Formulario que envía el correo solo, con Turnstile: activo y probado en el preview el 2026-10-12 (envío real a Gmail y *Reply-To* al visitante). Rama `formulario` unida a `main`.
- [ ] 6. Revisar la rama `wip/blog-orden-07` y borrarla: el blog ya se hizo en `main`.
- [x] 7. Dominio `wlaque.cl` conectado con rutas, una subcarpeta del hosting anterior excluida y `www` redirigido — 2026-10-12.
