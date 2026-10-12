Eres el desarrollador de este repo. Lee AGENTS.md completo antes de empezar.

Orden 5 — tareas 11 y 12 de TAREAS.md: las tarjetas de posts. La colección `posts` ya carga los 7 posts y `src/lib/posts.ts` ya tiene `formatearFecha` y `colorAcento`: úsalos, no los reescribas. Van 3 commits, uno por bloque.

## Bloque A (commit: "agrega PlaceholderArt")

1. Crea `src/components/PlaceholderArt.astro` traduciendo la función `PlaceholderArt` de `home.jsx` (líneas 262 a 289). Props: `seed` (string), `accent` (color hex) y `glyph` (string).
   - El cálculo del hash y el loop de las 14 líneas se copian LITERALES en el frontmatter, incluidos `>>> 0`, `h * 31` y `(h >>> (i * 3)) & 0xff`. No los "simplifiques": cualquier cambio altera el dibujo de cada post.
   - TRAMPA DEL SVG: en JSX los atributos de SVG van en camelCase, pero en Astro tienen que ir con su nombre real de SVG. Convierte exactamente estos 8:
     `className` → `class`, `stopColor` → `stop-color`, `textAnchor` → `text-anchor`, `dominantBaseline` → `dominant-baseline`, `fontSize` → `font-size`, `fontFamily` → `font-family`, `fontWeight` → `font-weight`, `letterSpacing` → `letter-spacing`.
     NO conviertas `viewBox` ni `preserveAspectRatio`: esos SÍ se escriben en camelCase en SVG. Si los cambias, el SVG se rompe.
   - El texto inferior es textual: `━━━ COVER PLACEHOLDER · {seed.toUpperCase()} ━━━`.

## Bloque B (commit: "agrega Capsule y PostRow")

2. Crea `src/components/Capsule.astro` traduciendo `Capsule` (líneas 291 a 315). Recibe una prop `post`, que es una entrada de la colección `posts` (usa el tipo `CollectionEntry<'posts'>` de `astro:content`). Mapeo de campos:
   - `post.id` del prototipo → `post.id` de la entrada; el `href` es `/blog/${post.id}/`;
   - `post.tag` → `post.data.tags[0]`;
   - `post.accent` → `colorAcento(post.data.accent)` de `src/lib/posts.ts`;
   - `post.date` → `formatearFecha(post.data.date)`;
   - `post.read` → `post.data.readTime`; `post.title` → `post.data.title`; `post.desc` → `post.data.description`; `post.glyph` → `post.data.glyph`.
   - El `style={{ borderColor: ..., color: ... }}` del tag pasa a string: `style={`border-color: ${hex}; color: ${hex}`}`.
3. Crea `src/components/PostRow.astro` traduciendo `PostRow` (líneas 317 a 341), con el mismo mapeo. Los tags son `post.data.tags.slice(0, 3)`.

## Bloque C (commit: "arma la grilla de posts en el home")

4. En `src/pages/index.astro`, debajo del `<Hero />`, arma esta estructura (es la del `App` de home.jsx, líneas 480 a 511, sin el carrusel y sin el sidebar, que vienen después):
   ```
   <div class="body-grid">
     <main class="main">
       <div class="shdr" style="margin-top: 24px"> ...stitle + view-toggle... </div>
       <div class="capsules"> una <Capsule> por post </div>
       <div class="rows" hidden> una <PostRow> por post </div>
     </main>
   </div>
   ```
   - Los posts son los de `getCollection('posts')` SIN el destacado (`featured`), ordenados por fecha de más nuevo a más viejo.
   - El header `.shdr` va textual: tick, `Todas las entradas`, y el contador `{n} POSTS`. El view-toggle tiene `▦ GRID` (con clase `on`) y `▤ LIST`. Por ahora sin JS: el toggle se programa en otra tarea, por eso las filas quedan con `hidden`.
5. Marca las tareas 11 y 12 como hechas en TAREAS.md.

Antes de terminar, verifícate tú mismo con estos dos comandos (después de `pnpm build`):
```bash
grep -rnE 'stopColor|textAnchor|dominantBaseline|fontSize|fontFamily|fontWeight|letterSpacing|className' src/ ; echo "fin (arriba no debe haber nada)"
grep -o 'class="capsule" href="[^"]*"\|href="[^"]*" class="capsule"' dist/index.html
```
El segundo tiene que listar 6 enlaces en este orden: homelab, ciberseg-1, dns-fail, wp-import, astro, cto-life. Cuéntame en tu respuesta qué imprimieron.

Criterios con que reviso:
- en la captura, las 6 tarjetas se ven como en el prototipo: 2 columnas, arte con degradado oscuro (no negro plano), líneas horizontales, glyph grande translúcido, tag de color arriba a la izquierda, y el contador dice `6 POSTS`;
- el orden de las tarjetas es: homelab, ciberseg-1, dns-fail, wp-import, astro, cto-life;
- `grep` no encuentra `stopColor`, `textAnchor`, `fontSize` ni `className` en `src/`, y SÍ encuentra `viewBox` y `preserveAspectRatio`;
- las fechas dicen `12 Marzo 2025`, `28 Febrero 2025`, etc. (ningún día corrido);
- `pnpm build` pasa y hay exactamente 3 commits.

Para cerrar, corre `git status --short` y `git log --oneline -4` y pega su salida en tu respuesta. `git status` tiene que salir vacío y el log tiene que mostrar tus 3 commits. En las dos órdenes anteriores se te olvidó commitear: no digas que terminaste sin haber visto esa salida. Después detente.
