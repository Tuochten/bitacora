Eres el desarrollador de este repo. Lee AGENTS.md y TAREAS.md completos antes de empezar.

Orden 5 — tarea 8 de TAREAS.md: el buscador tipo paleta de comandos (⌘K / Ctrl K / "/"). Va 1 commit: "agrega el buscador".

1. Crea `src/components/Search.astro`:
   - El markup es el de `revision/referencia/home-cmdk.html`, tal cual: el `div.cmdk` empieza con el atributo `hidden`.
   - En el frontmatter, arma el índice de búsqueda a partir de `src/data/site.json`, igual que las líneas 37 a 39 de `handoff/js/site.js`, pero con las rutas reales:
     ```ts
     import site from '../data/site.json';
     const indice = [
       ...site.nav.map((n) => ({ t: n.label, s: 'Página', h: n.href })),
       ...site.posts.map((p) => ({ t: p.title, s: 'Entrada · ' + p.category, h: `/blog/${p.slug}/`, k: p.description })),
       ...site.projects.map((p) => ({ t: p.name, s: 'Proyecto · ' + p.stack, h: '/proyectos/', k: p.description })),
     ];
     ```
   - Pásalo al navegador con un script de datos, después del `div.cmdk`:
     `<script type="application/json" id="cmdk-data" set:html={JSON.stringify(indice)} />`
   - Agrega un `<script>` (normal, sin `is:inline`) con la lógica de las líneas 44 a 68 de `handoff/js/site.js`: `render`, `open`, `close`, el teclado (↑ ↓ Enter en el campo; ⌘K / Ctrl K, "/" y Esc en el documento), el clic en `[data-close]` y los botones `[data-open-search]`. Cambios respecto del prototipo:
     - el índice se lee con `JSON.parse(document.getElementById('cmdk-data').textContent)`;
     - `esc` (línea 4 de site.js) se copia dentro del script, porque `render` la usa;
     - los elementos (`#cmdk`, `#cmdk-q`, `#cmdk-list`, `#cmdk-n`) se buscan una vez al cargar: esta vez sí se puede, porque nunca se reemplazan.
   - En el mismo script, cambia el texto del `kbd` de la cabecera a `⌘K` en Mac, como la línea 14 de site.js: `if (/Mac/.test(navigator.platform)) document.querySelector('.top .search kbd').textContent = '⌘K';`
2. En `src/layouts/Base.astro`, importa `Search` y ponlo DESPUÉS de `</div>` del `.shell`, como último hijo del `<body>` (así está en el prototipo).
3. Relee `TAREAS.md` desde el disco y marca SOLO la tarea 8.

Antes de terminar, verifícate con `pnpm build` y estos comandos:
```bash
python3 revision/comparar.py '#cmdk'            # tiene que imprimir IDÉNTICO
python3 revision/comparar.py header.top         # tiene que seguir en IDÉNTICO
python3 -c "import json,re; h=open('dist/index.html').read(); d=json.loads(re.search(r'id=\"cmdk-data\"[^>]*>(.*?)</script>',h,re.S).group(1)); print(len(d),'entradas en el índice')"   # tiene que imprimir: 15 entradas en el índice
```

Para cerrar, pega la salida de los tres comandos, de `git status --short` (vacío) y de `git log --oneline -2`. Después detente.
