Eres el desarrollador de este repo. Lee AGENTS.md y BITACORA.md antes de empezar.

Orden 08 — la página Desarrollo web (`/desarrollo-web/`). Va 1 commit: "agrega la página Desarrollo web".

El HTML exacto del `<main>` está en `revision/referencia/desarrollo-web-main.html` (es el DOM del prototipo con las rutas de producción). Conviértelo en Astro leyendo los datos de `src/data/site.json`. Las utilidades están en `src/lib/sitio.js` (`byDate`, `isProj`): impórtalas, no las reescribas. El componente `Row` ya existe y ya genera la fila exacta: úsalo.

1. Crea `src/pages/desarrollo-web.astro`:
   - Importa `../layouts/Base.astro`, `../components/Row.astro`, `../data/site.json` y lo que uses de `../lib/sitio.js`.
   - `<Base active="web" title="…" description="…" canonical="https://wlaque.cl/desarrollo-web/">` con el `<title>` y la `description` TEXTUALES de `handoff/desarrollo-web.html` (líneas del `<head>`). Sin `ogTitle` ni `ogDescription`: toman el valor de title y description.
   - El JSON-LD va en el slot `head`, igual que en `src/pages/index.astro`, con el objeto de `handoff/desarrollo-web.html` (busca `ProfessionalService`).
   - Dentro de Base, el `<main id="contenido">` de la referencia. De dónde sale cada dato:
     - `.lede` ← `site.webdev.lede`.
     - `#services`: un `div.unit` por cada elemento de `site.webdev.services`. `unit-state` lleva la clase `w` cuando `tier` NO es `"principal"`: `class={s.tier === 'principal' ? 'unit-state' : 'unit-state w'}`. Plataforma ← `platform`, `unit-year` ← `tier`, `h3` ← `title`, `p` ← `description`, `.st` ← `includes`.
     - `#steps`: un `li` por paso de `site.webdev.steps`, con el número de 2 dígitos: `String(i + 1).padStart(2, '0')`, `b` ← `title`, `span` ← `text`.
     - `#incl`: un `li` por texto de `site.webdev.included`.
     - `#log`: las 3 entradas más recientes de Webflow o Dev, como la línea 72 de `handoff/desarrollo-web.html`:
       `byDate(site.posts).filter((p) => p.type === 'entrada' && (p.category === 'Webflow' || p.category === 'Dev')).slice(0, 3)`, cada una con `<Row post={p} />`.
     - `#cta-p`: `Cuéntame qué necesitas y te respondo en {site.webdev.response}.` (con el punto final).
     - `#stat` ← `site.profile.freelance.projects`; `#stat-l` ← `site.profile.freelance.projectsLabel`.
     - En el `dl#facts`, "Respuesta" ← `site.webdev.response`.
     - La lista de Plataformas de la barra lateral va textual, tal como en la referencia: los dos primeros `li` con `class="pri"` y el tercero SIN atributo `class`.
   - El enlace "Contáctame →" y el de "Formulario" van a `/contacto/`, como en la referencia.

Antes de terminar, verifícate: `pnpm build` y después este comando, que TIENE que imprimir `IDÉNTICO`. Si dice `DISTINTO`, te muestra la línea exacta (`-` prototipo, `+` tu sitio): corrígela y vuelve a correrlo.
```bash
python3 revision/comparar.py main desarrollo-web
python3 revision/comparar.py header.top desarrollo-web
```
El segundo compara la cabecera de esa página: el enlace activo tiene que ser "Desarrollo web".

Para cerrar, pega la salida de esos comandos, de `git status --short` (vacío) y de `git log --oneline -2`. Después detente.
