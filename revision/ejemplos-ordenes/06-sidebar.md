Eres el desarrollador de este repo. Lee AGENTS.md completo antes de empezar.

Orden 6 — tarea 13 de TAREAS.md: el sidebar del home. Van 2 commits.

## Bloque A (commit: "agrega Sidebar")

1. Crea `src/components/Sidebar.astro` traduciendo la función `Sidebar` de `Handoff Claude Design/design_handoff_wladi_blog/home.jsx`, líneas 343 a 447. Son 5 widgets: Estado, Stats, Stack, Filtrar por tema y Suscríbete. Todos los textos textuales.
   Trampas de esta traducción:
   - En `UTC−4 · CL`, el signo es un MENOS TIPOGRÁFICO (carácter U+2212, `−`), NO un guion `-`. Cópialo del archivo original, no lo tipees.
   - `● OPEN TO TALK` lleva el círculo al principio. `hace 2 min` va con la clase `status-val mono`.
   - Las barras: `style={{ width: v + "%" }}` pasa a string `style={`width: ${v}%`}`. Los 5 skills con sus porcentajes van en un arreglo en el frontmatter y se recorren con `.map()`.
   - Los 20 ticks de cada barra: `{Array.from({ length: 20 }, () => <span></span>)}`.
   - Los tags del filtro salen del arreglo `ALL_TAGS` de la línea 86 (7 tags, empezando por `Todos`). Cada uno es `<span class="tag" data-tag={t}>`, y `Todos` además lleva la clase `on`. Sin JS por ahora: el filtro se programa en la tarea 16, y usará ese `data-tag`.
   - El `<aside class="side">` es la raíz.

## Bloque B (commit: "agrega el sidebar al home")

2. En `src/pages/index.astro`, pon `<Sidebar />` dentro de `<div class="body-grid">`, DESPUÉS de `</main>`, como segundo hijo.
3. Relee `TAREAS.md` desde el disco y marca SOLO la tarea 13.

Antes de terminar, verifícate con estos comandos después de `pnpm build`:
```bash
grep -c 'UTC−4' src/components/Sidebar.astro          # tiene que imprimir 1 (con el menos tipográfico)
grep -o 'class="tag[^"]*" data-tag="[^"]*"' dist/index.html | head -3
grep -o 'class="bar-fill" style="width: *[0-9]*%"' dist/index.html
```
El segundo tiene que mostrar el tag `Todos` con `on`, y el tercero las 5 barras: 90%, 80%, 75%, 60% y 35%.

Criterios con que reviso:
- en la captura, el sidebar está a la derecha de la grilla, con los 5 widgets como en el prototipo;
- el menos de `UTC−4` es el carácter U+2212;
- 20 ticks por barra y los anchos correctos;
- `pnpm build` pasa y hay exactamente 2 commits.

Para cerrar, corre `git status --short` y `git log --oneline -3` y pega su salida en tu respuesta. `git status` tiene que salir vacío. Después detente.
