Eres el desarrollador de este repo. Lee AGENTS.md y BITACORA.md antes de empezar.

Orden 07 — adaptar el home al handoff v2.1. Hoy el build FALLA: `src/data/site.json` cambió de forma (los proyectos ahora son entradas con `type: "proyecto"` y ya no existe `site.projects`). El HTML esperado del home nuevo está en `revision/referencia/home-*.html` y `revision/referencia/proto-home.dom.html`. Van 2 commits. Edita solo las líneas que cambian; no reescribas archivos completos.

Las utilidades compartidas ya están hechas y verificadas en `src/lib/sitio.js`: `byDate`, `isProj`, `postHref`, `fmtDate`, `shortTitle`, `temaUrl`. Impórtalas desde ahí; no las reescribas.

## Bloque A (commit: "adapta los componentes del home al modelo de datos v2.1")

1. `src/components/Top.astro`: cada enlace del menú lleva además `data-nav={n.id}` (ver `revision/referencia/home-top.html`).
2. `src/components/Pin.astro`: la fecha visible ya no es `post.dateLabel` (no existe): es `fmtDate(post.date)`. Los dos enlaces van a `postHref(post)`.
3. `src/components/Row.astro`: los enlaces van a `postHref(post)`. Si el post es un proyecto (`isProj(post)`), entre el `<time>` y el `span.cat` va la etiqueta de tipo, igual que en `handoff/js/site.js` línea 93:
   ```astro
   {isProj(post) && <span class={post.project.state === 'activo' ? 'kind' : 'kind w'}><i aria-hidden="true"></i>Proyecto · {post.project.state}</span>}
   ```
4. `src/components/Unit.astro`: ahora recibe un **post** de tipo proyecto, no un proyecto. Cambia la prop a `post` y los campos así: `href` ← `postHref(post)`, estado ← `post.project.state`, años ← `post.project.since`, `h3` ← `post.title`, `p` ← `post.description`, `.st` ← `post.project.stack`. Ver `revision/referencia/home-units.html`.

## Bloque B (commit: "arma el home con entradas y proyectos del modelo v2.1")

5. `src/pages/index.astro`, en el frontmatter (importa lo que falte de `../lib/sitio.js`):
   ```ts
   const porFecha = byDate(site.posts);
   const entradas = porFecha.filter((p) => !isProj(p));
   const destacado = site.posts.find((p) => p.featured);
   const limite = site.settings.homeRecent;
   const enTodos = new Set(entradas.filter((p) => !p.featured).slice(0, limite).map((p) => p.slug));
   const proyectos = porFecha.filter(isProj).slice(0, 4);
   ```
   Borra las variables viejas que quedaron sin uso (`todas`, etc.).
6. En el markup de index.astro:
   - `#log` genera una fila por cada post de `entradas` (NO de todos los posts), con `oculta={!enTodos.has(p.slug)}`, y el `div.empty` al final como antes. Agrega al `div#log` el atributo `data-x-limite={limite}`.
   - `#units`: `{proyectos.map((p) => <Unit post={p} />)}`.
   - El "Ver todos →" de la sección Proyectos va a `/blog/proyectos/`.
7. En el `<script>` del filtro de index.astro, el límite ahora aplica también con un tema activo (así lo hace el prototipo v2.1). Reemplaza el `forEach` de las filas por:
   ```js
   const limite = Number(document.getElementById('log').dataset.xLimite);
   let visibles = 0;
   document.querySelectorAll('#log article.row').forEach((fila) => {
     const candidata = todos ? fila.dataset.xDestacado !== 'si' : fila.dataset.xCat === activo;
     const ver = candidata && visibles < limite;
     fila.hidden = !ver;
     if (ver) visibles++;
   });
   ```
   y borra la variable `recientes`, que queda sin uso. El resto del script no cambia.
8. `src/components/Search.astro`: el índice ya no usa `site.projects`. Reemplaza la parte de posts y proyectos por una sola, igual que `handoff/js/site.js` líneas 71-72:
   ```ts
   ...byDate(site.posts).map((p) => ({ t: p.title, s: isProj(p) ? 'Proyecto · ' + p.project.stack : 'Entrada · ' + p.category, h: postHref(p), k: p.description })),
   ```

Antes de terminar, verifícate. `pnpm build` tiene que pasar. Después estos comandos TIENEN que imprimir `IDÉNTICO`; si alguno dice `DISTINTO`, te muestra la línea exacta (`-` prototipo, `+` tu sitio): corrígela y vuelve a correrlo.
```bash
for s in header.top section.head section.status article.pin '#log article.row:not([hidden])' .units aside footer.foot '#cmdk'; do python3 revision/comparar.py "$s"; done
revision/probar-filtro.sh | tail -1
```

Para cerrar, pega la salida de esos comandos, de `git status --short` (vacío) y de `git log --oneline -3`. Después detente.
