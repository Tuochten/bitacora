Eres el desarrollador de este repo. Lee AGENTS.md y TAREAS.md completos antes de empezar.

Orden 2 — tarea 4 de TAREAS.md: la cabecera del home (`section.head`) y la franja "Ahora mismo" (`section.status`). Va 1 commit: "agrega la cabecera del home y la franja Ahora mismo".

El HTML exacto que tienes que producir está en `revision/referencia/home-head.html` y `revision/referencia/home-status.html`. Conviértelo en Astro leyendo los datos de `src/data/site.json`. Todo va en `src/pages/index.astro`, dentro del `<main id="contenido">` que ya existe, en este orden: primero `section.head`, después `section.status`. Edita solo esas líneas del archivo: no reescribas index.astro completo.

1. En el frontmatter de `src/pages/index.astro` agrega:
   ```ts
   import site from '../data/site.json';
   import { mascotSVG } from '../lib/mascot-svg.js';
   ```
2. `section.head`, con los datos así:
   - h1: `{site.profile.nameSplit[0]} <em>{site.profile.nameSplit[1]}</em>` (un espacio entre el nombre y el `<em>`, ninguno más).
   - `.role` ← `site.profile.role`; `<p id="bio">` ← `site.profile.bio`.
   - La ficha `a.free`: `href` ← `site.profile.freelance.href`; el `aria-label="Desarrollo web freelance"` es textual. Etiquetas ← `.label`, `.projects`, `.projectsLabel`, `.extra`, `.cta`. Las dos filas `.free-s` salen de `site.profile.freelance.stack` con `.map()`: cada elemento es un par `[nombre, texto]` y se escribe `<span class="free-s"><b>{nombre}</b> {texto}</span>` (un espacio después del `</b>`).
   - El personaje: en la referencia hay un comentario `{/* SVG: ... */}` donde va el dibujo. NO copies ningún trazado SVG a mano: se genera con la función. El div queda así:
     ```astro
     <div class="head-art" id="headart" aria-hidden="true"><Fragment set:html={mascotSVG({ cls: 'mas' })} /><div class="scan"></div></div>
     ```
3. `section.status`: un `div` por cada elemento de `site.now`, con `class={a.tone}` y adentro `.k` ← `label`, `.v` ← `value`, `.n` ← `note`.
4. Relee `TAREAS.md` desde el disco y marca SOLO la tarea 4.

Antes de terminar, verifícate: `pnpm build` y después estos dos comandos, que TIENEN que imprimir `IDÉNTICO`. Si imprimen `DISTINTO`, te muestran la línea exacta (`-` prototipo, `+` tu sitio): corrígela y vuelve a correrlos.
```bash
python3 revision/comparar.py section.head
python3 revision/comparar.py section.status
```
Corre también estos dos, que tienen que seguir dando `IDÉNTICO` (no rompas lo de la orden anterior):
```bash
python3 revision/comparar.py header.top
python3 revision/comparar.py footer.foot
```

Para cerrar, pega la salida de los cuatro comandos, de `git status --short` (tiene que salir vacío) y de `git log --oneline -2`. Después detente.
