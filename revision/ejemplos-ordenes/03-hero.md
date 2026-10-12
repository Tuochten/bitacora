Orden 3 — tarea 8 de TAREAS.md, el Hero. La orden 2 quedó perfecta: el chrome ya se ve idéntico al prototipo. Sigue igual.

## Bloque A (1 commit: "copia home.css del prototipo")

1. Copia el archivo `Handoff Claude Design/design_handoff_wladi_blog/home.css` a `src/styles/home.css` con `cp`. NO lo reescribas ni lo edites: tiene que quedar idéntico byte a byte. Es CSS puro que ya usa los mismos nombres de clase.
2. En `src/pages/index.astro`, importa `../styles/home.css` en el frontmatter.

## Bloque B (1 commit: "agrega Hero")

3. Crea `src/components/Hero.astro` traduciendo la función `Hero` de `home.jsx`, líneas 151 a 207. Recuerda: `class`, no `className`.
   - Props: `heroVariant` (por defecto `"cinema"`) y `textureIntensity` (por defecto `0.5`).
   - El div raíz lleva `data-variant={heroVariant}` y `style={`--tex-i: ${textureIntensity}`}` (string, no objeto).
   - En el HTML, el widget `hero-now` se renderiza con la PRIMERA actividad (Estudiando).
   - Los textos van textuales: `@` en su span y `vladimirperez` pegado sin espacio; el nombre, la bio completa (en una sola línea de texto), las 3 actividades de las líneas 158 a 162, y los stats 13 / 12 / 03 con sus etiquetas.
4. Agrega un `<script>` en Hero.astro que rote las 3 actividades cada 4500 ms:
   - Actualiza el ícono y la etiqueta dentro de `.hero-now-label`, y el texto de `.hero-now-value`.
   - OJO, la trampa: la animación CSS `typeIn` de `.hero-now-value` solo corre cuando el elemento se crea. En el prototipo eso lo hace el `key={now}` de React. Para que la animación se repita en cada cambio, NO basta con cambiar `textContent`: reemplaza el span por uno nuevo, por ejemplo con `const nuevo = viejo.cloneNode(false); nuevo.textContent = valor; viejo.replaceWith(nuevo);`.
5. En `src/pages/index.astro`, renderiza `<Hero />` dentro de `<Shell>`.
6. Marca la tarea 8 como hecha en `TAREAS.md`. Las tres variantes ya funcionan solas con `data-variant`, porque su CSS está en home.css (líneas 180 a 188).

Criterios con que reviso:
- `cmp` entre `src/styles/home.css` y el original no reporta diferencias;
- en la captura, el hero se ve como el prototipo: avatar "W" con borde dorado y badge `LV.13`, `@vladimirperez`, nombre grande, bio, el widget "now playing" y los 3 stats a la derecha;
- el script usa `replaceWith` o equivalente para recrear el span;
- no hay `className` ni imports de react;
- `pnpm build` pasa y hay exactamente 2 commits.

Cuando termines, detente.
