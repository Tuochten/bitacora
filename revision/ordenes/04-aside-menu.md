Eres el desarrollador de este repo. Lee AGENTS.md y TAREAS.md completos antes de empezar.

Orden 4 — tareas 6 y 7 de TAREAS.md: la barra lateral del home y el menú móvil. Van 2 commits.

## Bloque A (commit: "agrega la barra lateral del home")

El HTML exacto está en `revision/referencia/home-aside.html`.

1. En `src/pages/index.astro`, dentro de `<div class="grid">` y DESPUÉS de `<div class="col">…</div>`, agrega el `<aside aria-label="Complementario">` con:
   - `<h2 class="side-h">Filtrar por tema</h2>` y el `div.filters` (con `id="filters"`, `role="group"`, `aria-label="Temas"`). Un `<button type="button">` por cada elemento de `site.tags`, con `data-t={t}` y `aria-pressed={t === 'Todos' ? 'true' : 'false'}`. El texto es `Todos` para "Todos" y `› {t}` para los demás (el `›` es el carácter U+203A, cópialo de la referencia).
   - `<div id="skills">`: por cada grupo de `site.skills`, un `<h2 class="side-h">{g.group}</h2>` y un `<ul>` con un `<li class={i.primary ? 'pri' : ''}>{i.name}</li>` por ítem.
   - El guardián. En la referencia hay un comentario `{/* SVG: ... */}`: NO copies trazados, usa la función. Agrega `import { ongoroSVG } from '../lib/ongoro.js';` en el frontmatter y escribe:
     ```astro
     <div class="guard" id="guard"><Fragment set:html={ongoroSVG(52)} /><div class="cap">guardián · en vigilia</div></div>
     ```
   Por ahora los botones de filtro no hacen nada: el filtro es la tarea 9.

## Bloque B (commit: "agrega el menú móvil")

2. En `src/components/Top.astro`, agrega al final un `<script>` que haga lo mismo que las líneas 30 y 31 de `handoff/js/site.js`: al hacer clic en `.menu-btn`, alterna la clase `open` en `#menu` y actualiza `aria-expanded` del botón con `"true"` o `"false"`. No toques el markup del componente.
3. Relee `TAREAS.md` desde el disco y marca SOLO las tareas 6 y 7.

Antes de terminar, verifícate con `pnpm build` y estos comandos. TODOS tienen que imprimir `IDÉNTICO`; si alguno imprime `DISTINTO`, corrige la línea que te muestra y vuelve a correrlo:
```bash
python3 revision/comparar.py aside
python3 revision/comparar.py header.top
python3 revision/comparar.py section.head
python3 revision/comparar.py article.row
```

Para cerrar, pega la salida de esos comandos, de `git status --short` (vacío) y de `git log --oneline -3`. Después detente.
