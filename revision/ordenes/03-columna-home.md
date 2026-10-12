Eres el desarrollador de este repo. Lee AGENTS.md y TAREAS.md completos antes de empezar.

Orden 3 — tarea 5 de TAREAS.md: la columna principal del home (destacado, entradas recientes y proyectos). Van 2 commits.

El HTML exacto está en `revision/referencia/home-pin.html`, `home-row.html` (una fila de ejemplo) y `home-units.html`. Los datos salen de `site.posts` y `site.projects` de `src/data/site.json`, que ya está importado en index.astro.

## Bloque A (commit: "agrega los componentes Pin, Row y Unit")

1. `src/components/Pin.astro`, con prop `post` (un elemento de `site.posts`). Markup de `home-pin.html`. El enlace es `/blog/${post.slug}/` (los dos `<a>` apuntan ahí). Ojo con los textos que se arman: `{post.category} · <time datetime={post.date}>{post.dateLabel}</time>` y `{post.readingTime} de lectura`.
2. `src/components/Row.astro`, con prop `post`. Markup de `home-row.html`. El `<time>` muestra `post.date` (no `dateLabel`), y el `span.cat` lleva DOS clases: `class={`cat ${post.category}`}`.
3. `src/components/Unit.astro`, con prop `project` (un elemento de `site.projects`). Markup de una tarjeta de `home-units.html`. Todas apuntan a `/proyectos/`. El estado: `class={project.state === 'activo' ? 'unit-state' : 'unit-state w'}`.

## Bloque B (commit: "arma la columna principal del home")

4. En `src/pages/index.astro`, DESPUÉS de `section.status` y dentro de `<main>`, agrega esta estructura (es la del prototipo; los `id` los va a usar el filtro de la tarea 9, no los cambies):
   ```astro
   <div class="grid">
     <div class="col">
       <div id="pin"><Pin post={destacado} /></div>
       <section aria-labelledby="seclabel">
         <div class="sec"><h2 id="seclabel">Entradas recientes</h2><span class="r"></span><a href="/blog/">Ver todas →</a></div>
         <div class="log" id="log">{recientes.map((p) => <Row post={p} />)}</div>
       </section>
       <section aria-labelledby="h-proy" style="margin-top:40px">
         <div class="sec"><h2 id="h-proy">Proyectos</h2><span class="r"></span><a href="/proyectos/">Ver todos →</a></div>
         <div class="units" id="units">{site.projects.slice(0, 4).map((p) => <Unit project={p} />)}</div>
       </section>
     </div>
   </div>
   ```
   Y en el frontmatter, además de importar los tres componentes:
   ```ts
   const destacado = site.posts.find((p) => p.featured);
   const recientes = site.posts.filter((p) => !p.featured).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);
   ```
   La barra lateral (`aside`) NO va en esta orden: queda para la siguiente.
5. Relee `TAREAS.md` desde el disco y marca SOLO la tarea 5.

Antes de terminar, verifícate con `pnpm build` y estos comandos. Los tres primeros TIENEN que imprimir `IDÉNTICO`; si imprimen `DISTINTO`, corrige la línea que te muestran y vuelve a correrlos:
```bash
python3 revision/comparar.py article.pin
python3 revision/comparar.py article.row
python3 revision/comparar.py .units
python3 revision/comparar.py section.head
python3 revision/comparar.py header.top
```
Los dos últimos son de órdenes anteriores y tienen que seguir dando `IDÉNTICO`.

Para cerrar, pega la salida de los cinco comandos, de `git status --short` (vacío) y de `git log --oneline -3`. Después detente.
