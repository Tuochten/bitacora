Eres el desarrollador de este repo. Lee AGENTS.md y TAREAS.md completos antes de empezar.

Orden 6 — tarea 9 de TAREAS.md: el filtro por tema del home. Van 2 commits.

Decisión del revisor: el prototipo redibuja las filas con JavaScript en cada cambio de filtro. Aquí NO: Astro genera en el build una fila por CADA post, y el filtro solo les pone o les quita el atributo `hidden`. Así no hay dos copias del markup de la fila (una en Astro y otra en JS).

Convención: los atributos `data-x-*` son ganchos para el JavaScript, no son parte del diseño. El comparador los ignora.

## Bloque A (commit: "genera todas las filas del home y las marca para el filtro")

1. `src/components/Row.astro`: agrega una prop `oculta` (booleana, por defecto `false`) y tres atributos al `<article class="row">`: `data-x-cat={post.category}`, `data-x-destacado={post.featured ? 'si' : 'no'}` y `hidden={oculta}`. En Astro, `hidden={false}` no escribe nada y `hidden={true}` escribe `hidden`. No cambies nada más del markup.
2. `src/pages/index.astro`: en el frontmatter, reemplaza la línea de `recientes` por:
   ```ts
   const todas = [...site.posts].sort((a, b) => b.date.localeCompare(a.date));
   const enTodos = new Set(todas.filter((p) => !p.featured).slice(0, 5).map((p) => p.slug));
   ```
   y en `#log` genera una fila por CADA post, más el estado vacío (oculto) al final:
   ```astro
   <div class="log" id="log">
     {todas.map((p) => <Row post={p} oculta={!enTodos.has(p.slug)} />)}
     <div class="empty" hidden><Fragment set:html={ongoroSVG(56)} /><p></p></div>
   </div>
   ```

## Bloque B (commit: "agrega el filtro por tema")

3. Al final de `src/pages/index.astro`, agrega este `<script>` tal cual (es la lógica de `postFilter` en `handoff/js/site.js`, adaptada a mostrar y ocultar):
   ```html
   <script>
     const botones = [...document.querySelectorAll('#filters button')];
     const temas = botones.map((b) => b.dataset.t);
     let activo = new URLSearchParams(location.search).get('tema') || 'Todos';
     if (!temas.includes(activo)) activo = 'Todos';

     function render() {
       const todos = activo === 'Todos';
       botones.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.t === activo)));
       document.getElementById('pin').hidden = !todos;
       document.getElementById('seclabel').textContent = todos ? 'Entradas recientes' : 'Tema: ' + activo;
       let recientes = 0, visibles = 0;
       document.querySelectorAll('#log article.row').forEach((fila) => {
         const destacada = fila.dataset.xDestacado === 'si';
         let ver;
         if (todos) { ver = !destacada && recientes < 5; if (!destacada) recientes++; }
         else ver = fila.dataset.xCat === activo;
         fila.hidden = !ver;
         if (ver) visibles++;
       });
       const vacio = document.querySelector('#log .empty');
       vacio.hidden = visibles > 0;
       vacio.querySelector('p').textContent = 'Aún no hay entradas de «' + activo + '».';
     }

     document.getElementById('filters').addEventListener('click', (e) => {
       const b = e.target.closest('button');
       if (!b) return;
       activo = b.dataset.t;
       render();
       const u = new URL(location.href);
       if (activo === 'Todos') u.searchParams.delete('tema'); else u.searchParams.set('tema', activo);
       history.replaceState(null, '', u);
     });

     render();
   </script>
   ```
4. Relee `TAREAS.md` desde el disco y marca SOLO la tarea 9.

Antes de terminar, verifícate. Primero:
```bash
revision/probar-filtro.sh
```
Tiene que imprimir EXACTAMENTE esto (es lo que hace el prototipo):
```
Todos      | destacado visible | título: 'Entradas recientes' | botón activo: ['Todos'] | filas: 5 ['Homelab', 'Ciberseguridad', 'Webflow', 'Dev', 'Astro']
Dev        | destacado oculto  | título: 'Tema: Dev' | botón activo: ['Dev'] | filas: 2 ['Dev', 'Dev']
Homelab    | destacado oculto  | título: 'Tema: Homelab' | botón activo: ['Homelab'] | filas: 1 ['Homelab']
Astro      | destacado oculto  | título: 'Tema: Astro' | botón activo: ['Astro'] | filas: 1 ['Astro']
Inventado  | destacado visible | título: 'Entradas recientes' | botón activo: ['Todos'] | filas: 5 ['Homelab', 'Ciberseguridad', 'Webflow', 'Dev', 'Astro']
```
Y después estos, que tienen que dar `IDÉNTICO`:
```bash
python3 revision/comparar.py '#log article.row:not([hidden])'
python3 revision/comparar.py article.pin
python3 revision/comparar.py aside
```

Para cerrar, pega la salida de todo eso, de `git status --short` (vacío) y de `git log --oneline -3`. Después detente.
