Eres el desarrollador de este repo. Lee AGENTS.md completo antes de empezar.

Orden 5b — corrección corta. Las tarjetas quedaron bien hechas, pero al reescribir `src/pages/index.astro` se borró una línea que ya estaba, y el sitio perdió los estilos del Hero y de las tarjetas. Esto es justo lo que prohíbe la regla de AGENTS.md: "Relee cada archivo desde el disco justo antes de editarlo... edita solo las líneas que cambian".

Haz SOLO esto, editando líneas puntuales (no reescribas archivos completos):

1. En `src/pages/index.astro`, agrega de vuelta en el frontmatter la línea `import '../styles/home.css';`.
2. En el mismo archivo, el contador del header quedó mal. Hoy dice:
   `<span class="stitle"><span class="stitle-tick"></span> Todas las entradas</span>` seguido de `<span class="smore">{nonFeaturedPosts.length} POSTS</span>`.
   Tiene que quedar como en el prototipo (home.jsx, líneas 485 a 489), con el contador DENTRO del título y con la clase `stitle-count`, y sin espacio entre el tick y el texto:
   `<span class="stitle"><span class="stitle-tick"></span>Todas las entradas<span class="stitle-count">{nonFeaturedPosts.length} POSTS</span></span>`
3. Borra la línea `import type { CollectionEntry } from 'astro:content';` de index.astro: no se usa.
4. En `TAREAS.md`, la tarea 14 quedó marcada como hecha, pero NO lo está (falta el sidebar y el carrusel). Desmárcala: cambia solo `- [x] 14.` por `- [ ] 14.`.

Verifícate después de `pnpm build`:
```bash
grep -c "styles/home.css" src/pages/index.astro     # tiene que imprimir 1
grep -o 'class="stitle-count">[^<]*' dist/index.html   # tiene que imprimir: class="stitle-count">6 POSTS
grep -c 'smore' src/pages/index.astro                 # tiene que imprimir 0
```

Un solo commit: "restaura el import de home.css y corrige el contador". Para cerrar, corre `git status --short` y `git log --oneline -2` y pega su salida. Después detente.
