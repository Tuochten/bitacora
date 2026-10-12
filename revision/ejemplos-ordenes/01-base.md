Eres el desarrollador de este repo. Lee AGENTS.md antes de empezar. Esta orden reemplaza a REVISION.md.

La revisión encontró que la fase 1 tiene un error grave y varios textos inventados. Hazlo en este orden exacto, con `pnpm build` después de cada bloque.

REGLA PRINCIPAL DE ESTA ORDEN: todos los textos visibles (títulos, etiquetas, links) se copian TEXTUALES de `Handoff Claude Design/design_handoff_wladi_blog/home.jsx`. No inventes ni cambies ninguno. Si un texto no está en las líneas que te indico, no lo pongas.

## Bloque A — el error grave (1 commit: "carga los tokens y agrega la textura noise")

1. `src/styles/tokens.css` no se importa en ningún lado, por eso el sitio sale sin colores. En `src/layouts/Shell.astro` importa `../styles/tokens.css` ANTES de `../styles/base.css`.
2. Faltan dos reglas en `src/styles/base.css`: `.noise` y `.noise::after`. Cópialas textuales de las líneas 63 a 74 de `Handoff Claude Design/design_handoff_wladi_blog/styles.css`, justo antes del comentario `/* shell exterior`.

## Bloque B — componentes del chrome (1 commit: "separa Titlebar, NavBar y Footer fieles al prototipo")

3. Crea `src/components/Titlebar.astro` traduciendo la función `Titlebar` de home.jsx (líneas 90 a 117). Ojo con estos detalles:
   - El punto con clase `amber` es el SEGUNDO de los tres, no el primero.
   - Todos son `<div>`, incluido el título. No uses `<h1>`.
   - El título es exactamente `wladi.dev — personal launcher v2.4`.
   - A la derecha va `SESSION <b>00:00:00</b>`, y un `<script>` que actualice ese `<b>` cada segundo con la hora local en formato HH:MM:SS. Es el único JS de este componente.
4. Crea `src/components/NavBar.astro` traduciendo la función `NavBar` (líneas 119 a 149):
   - Prop `active` con valor por defecto `"Blog"`.
   - Los 4 ítems son exactamente: Blog, Proyectos, Sobre mí, Contacto. Hazlos `<a class="nl">` (con ` on` en el activo). Blog apunta a `/`; los otros tres a `#` por ahora.
   - Marca: `wladi.dev` y debajo `CTO · Dev · Estudiante`.
   - En `nav-right` va PRIMERO el buscador (placeholder `Buscar en el blog...`) y DESPUÉS el status `EN LÍNEA`.
5. Crea `src/components/Footer.astro` traduciendo la función `Footer` (líneas 449 a 465), con los 4 links y el texto de build tal cual están.

## Bloque C — el layout (1 commit: "arma Shell con los componentes y title como prop")

6. En `src/layouts/Shell.astro`:
   - Props: `title` (por defecto `"wladi.dev — Blog"`) y `active` (por defecto `"Blog"`). Usa `title` en el `<title>`.
   - El `<body>` contiene `<div class="shell">` y adentro, en orden: `<Titlebar />`, `<NavBar active={active} />`, `<slot />`, `<Footer />`. Borra el header, nav y footer escritos a mano que tiene ahora.
7. En `src/pages/index.astro` borra el `<h1>Astro</h1>`; deja `<Shell title="wladi.dev — Blog">` vacío por ahora.
8. Borra `REVISION.md` y marca como hechas las tareas 6 y 7 en `TAREAS.md`.

## Cómo sé que terminaste bien

Voy a revisar con una captura del sitio contra el prototipo, además de estos puntos:
- el fondo de la página es oscuro (tokens cargando);
- el segundo punto del titlebar es el ámbar;
- los textos de titlebar, nav y footer son idénticos a home.jsx;
- el buscador va antes del status;
- no quedan `<h1>` en el titlebar ni texto "Astro" en la página;
- `pnpm build` pasa y hay 3 commits.

No hagas nada más allá de esta orden. Cuando termines, detente.
