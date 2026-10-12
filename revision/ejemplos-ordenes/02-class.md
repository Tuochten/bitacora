Orden 2 — corrección. Relee la sección "Traducir de React (JSX) a Astro" de AGENTS.md, que se agregó por este error.

La revisión de la orden 1 encontró que los textos quedaron perfectos, pero el sitio sale SIN ESTILOS: los tres componentes usan `className`, que en Astro no funciona. Corrige solo esto:

1. En `src/components/Titlebar.astro`, `src/components/NavBar.astro` y `src/components/Footer.astro`: cambia TODOS los atributos `className=` por `class=`. Son 26 en total. Si NavBar arma la clase del ítem activo con una expresión, conserva la lógica, solo cambia el nombre del atributo.
2. En `src/components/Titlebar.astro`: borra la línea `import { useState, useEffect, useRef } from 'react';`. Si el frontmatter (`---` ... `---`) queda vacío, bórralo entero.
3. En el mismo archivo: cambia `<script define:vars={{}}>` por `<script>` a secas. El contenido del script no se toca.

No cambies ningún texto, ninguna clase, ni ningún otro archivo.

Criterios con que reviso:
- `grep -rn className src/` no devuelve nada;
- `grep -rn "from 'react'" src/` no devuelve nada;
- en la captura del sitio, el titlebar, el nav y el footer se ven con el estilo del prototipo (barras oscuras con gradiente, marca "W" con borde dorado, links en fila, footer en una línea);
- `pnpm build` pasa;
- exactamente 1 commit con mensaje "cambia className por class en los componentes".

Cuando termines, detente.
