# wladi-blog — instrucciones de trabajo

Blog personal en español, en Astro 7. El diseño ya está hecho y entregado en `handoff/`. Tu pega es **reconstruirlo en Astro con fidelidad alta**, no rediseñarlo.

Trabajas bajo supervisión: un revisor te da órdenes numeradas, revisa cada una con capturas del sitio contra el prototipo, y te devuelve correcciones. Cada orden es la fuente de verdad para esa tarea.

## Fuentes de verdad, en orden

1. **La orden que estás ejecutando.** Si trae un fragmento de código, úsalo tal cual.
2. **El README dentro de `handoff/`**: tokens, tipografías, comportamiento de cada componente.
3. **Los archivos del prototipo en `handoff/`**: el markup, los textos y el CSS reales.

Si el README del handoff trae ejemplos de código de Astro, **pueden ser de una versión vieja**: ante la duda, gana lo que diga la orden.

## Reglas que no se negocian

1. **La carpeta `handoff/` es de solo lectura.** Nunca la edites, muevas ni borres.
2. **No inventes colores, tamaños, tipografías ni textos.** Todo sale del handoff. Los textos visibles (títulos, etiquetas, links, placeholders) se copian carácter por carácter: ojo con caracteres especiales como `−` (menos tipográfico) o `—` (raya), que no son `-`.
3. **Si el CSS del prototipo ya usa los mismos nombres de clase, se copia tal cual con `cp`**, no se reescribe.
4. **No agregues dependencias** fuera de las que la orden autorice. Nada de Tailwind ni librerías de componentes.
5. **El contenido va en español.**

## Traducir de React (JSX) a Astro — errores que ya pasaron

- **En Astro es `class`, nunca `className`.** `className` compila sin error, pero el CSS no se aplica.
- **No importes nada de `react`** en un `.astro`. El estado se reemplaza por HTML estático o un `<script>` vanilla.
- `style={{ marginTop: 24 }}` se escribe `style="margin-top: 24px"`, y con variables: `` style={`width: ${v}%`} ``.
- **SVG:** los atributos de JSX en camelCase van con su nombre real: `stopColor` → `stop-color`, `textAnchor` → `text-anchor`, `dominantBaseline` → `dominant-baseline`, `fontSize` → `font-size`, `fontFamily` → `font-family`, `fontWeight` → `font-weight`, `letterSpacing` → `letter-spacing`. **Excepción:** `viewBox` y `preserveAspectRatio` SÍ son camelCase en SVG y no se tocan.
- **El `key={...}` de React que recrea un elemento** (para repetir una animación CSS) se traduce reemplazando el nodo: `viejo.replaceWith(nuevo)`.
- **En un `<script>` que corre periódicamente, busca los elementos del DOM en cada vuelta**, no los guardes en una variable al cargar: si el nodo se reemplaza, la variable queda apuntando a uno que ya no existe.
- **No escribas `if (elemento) {...}` para esquivar un elemento que no aparece.** Si no existe, que falle visible: el `if` esconde el bug.
- Un `<script>` normal (sin `define:vars` ni `is:inline`) es lo correcto para JS de cliente.
- El atributo `hidden` pierde contra cualquier CSS con `display:`. Este proyecto tiene `[hidden] { display: none !important; }` en `src/styles/reset.css`, que el layout base importa primero; no lo borres.

## Astro 7 — la API correcta

- Colecciones: `import { defineCollection } from 'astro:content'`, `import { glob } from 'astro/loaders'`, `import { z } from 'astro/zod'`. **`z` desde `astro:content` está deprecado**, y `type: 'content'` sin `loader` no carga nada.
- Los datos de las colecciones quedan en `node_modules/.astro/data-store.json` (no en `.astro/`).
- Las fechas de `z.coerce.date()` son medianoche UTC: para mostrarlas usa `getUTCDate()`, `getUTCMonth()` y `getUTCFullYear()`, o en Chile se corren un día.

## Cómo trabajar

- **Un bloque a la vez**, en el orden de la orden.
- Antes de escribir un componente, lee **solo** el pedazo de CSS y de markup que le toca, con `grep -n`. No leas archivos enteros del prototipo.
- **Relee cada archivo desde el disco justo antes de editarlo.** El revisor también edita este repo (`TAREAS.md`, este `AGENTS.md`). **Edita solo las líneas que cambian: nunca reescribas un archivo completo de memoria.** Ya pasó dos veces que un archivo reescrito borró líneas ajenas, entre ellas un import que dejó el sitio sin estilos.
- Corre `pnpm build` después de cada bloque. Si falla, arréglalo antes de seguir.
- **Un commit por bloque, con el mensaje que diga la orden.** El mensaje describe lo que el commit trae de verdad: si un bloque no se hizo, no hagas un commit con su nombre, dilo en tu respuesta.
- En `TAREAS.md` marca **solo** las tareas que la orden te pida marcar.
- Si la orden trae comandos de verificación, córrelos y **pega su salida real en tu respuesta**. No afirmes que algo funciona si no lo verificaste.
- Para cerrar, corre `git status --short` (tiene que salir vacío) y `git log --oneline -N`, y pega la salida.
- Si algo es ambiguo, anótalo en `DUDAS.md` y sigue. No adivines.

## Lo que NO tienes que hacer

- No configures deploy, dominios ni Cloudflare.
- No escribas tests: la verificación es visual y la hace el revisor.
- No refactorices lo que ya funciona.
- No hagas nada fuera de la orden. Cuando termines, detente.

## Errores de la sesión del 2026-09-29 — no repetir

- **Nunca armes HTML como texto** (`` `<p>${t}</p>` `` o `.join("")`) dentro de una expresión de Astro: Astro lo escapa y se ve el código en la página. Se usa JSX: `{lista.map((t) => <p>{t}</p>)}`.
- **Nunca pongas comillas alrededor de una expresión en un atributo**: `href="{site.x}"` deja el texto literal `{site.x}` como enlace. Se escribe `href={site.x}`.
- **No modifiques nada en `src/lib/`**: son módulos verificados por el revisor contra el prototipo (`revision/probar-sitio-js.mjs`). Si crees que falta algo, anótalo en `DUDAS.md`.
- **No crees páginas, rutas ni colecciones que la orden no pida.** Una orden de 07 derivó en una página de blog no pedida, y para soportarla se rompió el home.
- **Cada página importa las mismas hojas de estilo que su prototipo** (mira los `<link rel="stylesheet">` del HTML en `handoff/`). `Base.astro` ya trae `bitacora.css` e `interior.css`; `prosa.css` y `home.css` se importan en la página que los use.
- **La carpeta `revision/` es de solo lectura para ti**: herramientas, referencias y órdenes son del revisor. Si una verificación da `DISTINTO`, se corrige el sitio, nunca la referencia ni el comparador. El 2026-09-29 se modificaron `comparar.py` y los archivos de referencia para que las pruebas pasaran: eso invalida toda la verificación.
- Commitea al terminar cada bloque, no al final: una orden que no llega a commitear deja todo su trabajo en el aire.
