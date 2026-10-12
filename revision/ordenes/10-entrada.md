Eres el desarrollador de este repo. Lee AGENTS.md completo antes de empezar, en especial la sección "Errores de la sesión del 2026-09-29".

Orden 10 — la página de entrada `/blog/[slug]/`, completa y sin JavaScript de cliente (el JS es la orden 11). Va 1 commit: "arma la página de entrada".

Hoy `src/pages/blog/[slug].astro` es PROVISORIO: solo muestra la prosa de los posts que tienen Markdown. Reemplázalo completo por la página de verdad. El Markdown ya se procesa bien (lo hace `src/lib/remark-bitacora.js`, no lo toques), y las utilidades están en `src/lib/sitio.js` (`byDate`, `isProj`, `postHref`, `fmtDate`, `shortTitle`): impórtalas, no toques nada de `src/lib/`.

El HTML exacto del `<main>` está en tres referencias, una por variante:
- `revision/referencia/post-main.html` — entrada con Markdown y portada (`migrar-ordenes-woocommerce`)
- `revision/referencia/post-sin-portada-main.html` — entrada sin Markdown y sin portada (`dns-hosting-fallas-silenciosas`)
- `revision/referencia/post-proyecto-main.html` — proyecto (`homelab-linux`)

La lógica del prototipo está en el `<script>` de `handoff/post.html`, líneas 95 a 135. Tradúcela a frontmatter de Astro.

## Qué tiene que hacer la página

1. `getStaticPaths`: una página por CADA post de `site.posts` (los 23), no solo por los que tienen Markdown. Para cada uno busca su Markdown con `getCollection('blog')` por `e.id === p.slug`; puede no existir.
   ```ts
   export async function getStaticPaths() {
     const md = await getCollection('blog');
     return site.posts.map((p) => ({ params: { slug: p.slug }, props: { p, entrada: md.find((e) => e.id === p.slug) } }));
   }
   ```
2. Datos (frontmatter): `const L = byDate(site.posts); const i = L.findIndex((x) => x.slug === p.slug); const P = p.project;` (undefined en las entradas). Paginador: `older = L[i + 1]`, `newer = L[i - 1]`. Relacionadas: exactamente como las líneas 126-127 de post.html (misma categoría; si no alcanzan 2, se completa en orden con las demás), máximo 2.
3. `<Base active="blog" title={shortTitle(p, 60) + ' | wlaque.cl'} description={p.description} canonical={'https://wlaque.cl' + postHref(p)}>`. Importa `../../styles/prosa.css`.
4. Antes del `<main>`, la barra de lectura (la usa la orden 11): `<div class="readbar" aria-hidden="true"><i id="readfill" style="width: 0%;"></i></div>`.
5. El `<main>` según las referencias. Lo que cambia por variante:
   - Miga: el último ítem es `shortTitle(p)`. Si es proyecto, antes de él va `<a href="/blog/proyectos/">Proyectos</a><span aria-hidden="true">›</span>`.
   - `#cats`: `class={'cat ' + p.category}` y texto `[P ? 'Proyecto' : '', p.category, ...p.tags].filter(Boolean).join(' · ')`.
   - `#date` ← `fmtDate(p.date)`; `#read` ← `p.readingTime + ' de lectura'`.
   - Portada (línea 113-115): si `p.cover`, `<div class="cover" role="img" aria-label={'Portada: ' + p.title}></div>`; si no, el `.cover-term` con la ruta `~/proyectos/` en proyectos y `~/blog/<categoría en minúscula>/` en entradas.
   - `#prose` (líneas 116-119): si hay Markdown, `<Content />` (de `render(entrada)`); si es proyecto con `body`, lead + `<h2 id="resumen"><span class="n">01</span>Resumen</h2>` + un `<p>` por párrafo de `body`; si no, lead + la nota "Prototipo" textual (es provisoria, se va cuando se importen los posts reales).
   - `#pager`: `<a … rel="prev">` con `<span>← Anterior</span>` y el título de `older`, y `<a … rel="next">` con `<span>Siguiente →</span>` y el de `newer`. Si falta uno, en su lugar `<span class="pager-x" aria-hidden="true"></span>`.
   - `#rel`: las relacionadas con el componente `Row`.
   - Barra lateral: `#side-toc` lleva `hidden` si no hay h2. El índice sale de `headings` (de `render(entrada)`), solo los de `depth === 2`, con su `slug` como ancla; el primero lleva `class="on"`. OJO: el texto del heading viene con el número pegado ("01El contexto"): quítalo con `.replace(/^\d{2}/, '')` y pon el número en su `<span class="n">`. En proyectos con `body`, el índice tiene un solo ítem, "Resumen" con ancla `#resumen`.
   - `#projbox` lleva `hidden` salvo en proyectos; en proyectos, `#pfacts` según la línea 106 (en "Desde" se quita la flecha: `P.since.replace(/\s*→/, '')`).
   - `#facts`: "Actualizado" en proyectos y "Publicado" en entradas, `fmtDate(p.date)`, `p.readingTime` y el tema como `<a href={'/blog/tema/' + temaUrl(p.category) + '/'}>` (importa `temaUrl`).
   - Compartir (líneas 131-132), con `const u = encodeURIComponent('https://wlaque.cl' + postHref(p));`.
6. Recuerda: nada de HTML armado como texto, y nada de expresiones entre comillas en los atributos (`href={…}`, no `href="{…}"`).

## Verificación

`pnpm build` y después estos comandos. TODOS tienen que imprimir `IDÉNTICO`; si alguno dice `DISTINTO`, te muestra la línea exacta (`-` prototipo, `+` tu sitio): corrígela y vuelve a correrlo.
```bash
python3 revision/comparar.py main post
python3 revision/comparar.py main post-sin-portada
python3 revision/comparar.py main post-proyecto
python3 revision/comparar.py header.top post
python3 revision/comparar.py .readbar post
```

Commitea apenas pasen. Para cerrar, pega la salida de esos comandos, de `git status --short` (vacío) y de `git log --oneline -2`. Después detente.
