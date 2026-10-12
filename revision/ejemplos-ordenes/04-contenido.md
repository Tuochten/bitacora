Orden 4 — el contenido. Reordené TAREAS.md: el contenido va ANTES que las tarjetas, porque Capsule y PostRow se alimentan de los posts. Hoy haces las tareas 9 y 10 del TAREAS.md nuevo (esquema y posts). Relee TAREAS.md primero.

## Bloque A (1 commit: "agrega la colección de posts")

1. Crea `src/content.config.ts`. OJO: el snippet del README del handoff usa una API VIEJA de Astro. Este proyecto usa Astro 7.3.4, donde se escribe así:
   - `import { defineCollection } from 'astro:content';`
   - `import { glob } from 'astro/loaders';`
   - `import { z } from 'astro/zod';`  (NO desde 'astro:content', está deprecado)
   - colección `posts` con `loader: glob({ pattern: '**/*.md', base: './src/content/posts' })`.
   Schema: `title` string, `description` string, `date` con `z.coerce.date()`, `tags` array de strings con al menos 1, `glyph` string, `accent` enum `['gold', 'green']`, `featured` boolean con default false, `readTime` string. NO agregues un campo `tag`: la etiqueta principal siempre es `tags[0]`.
2. Crea los 7 posts en `src/content/posts/`, uno por cada objeto del arreglo `POSTS` de `Handoff Claude Design/design_handoff_wladi_blog/home.jsx` (líneas 4 a 84). El nombre de archivo es el `id` + `.md`: `woo-migrate.md`, `homelab.md`, `ciberseg-1.md`, `dns-fail.md`, `wp-import.md`, `astro.md`, `cto-life.md`. En el frontmatter:
   - `title` y `description` (viene de `desc`): textuales, carácter por carácter;
   - `date`: la fecha en formato `AAAA-MM-DD` (ejemplo: "20 Abril 2025" es `2025-04-20`);
   - `tags`: textuales y en el mismo orden;
   - `glyph`: textual, entre comillas;
   - `accent`: `#c6a84b` es `gold` y `#8cb87a` es `green`;
   - `featured: true` solo en woo-migrate;
   - `readTime`: textual, tal cual viene en `read`. Ojo que no todos dicen "lectura": woo-migrate dice "8 min lectura" y los demás solo "N min". Respétalo.
   - El cuerpo del post queda vacío por ahora.

## Bloque B (1 commit: "agrega helpers de fecha y acento")

3. Crea `src/lib/posts.ts` con dos funciones exportadas:
   - `formatearFecha(fecha: Date): string` que devuelve el formato del prototipo: día con 2 dígitos, mes en español con mayúscula inicial, año. Ejemplo: `08 Enero 2025`.
     TRAMPA IMPORTANTE: `z.coerce.date()` crea la fecha a medianoche UTC, y Chile está 3 o 4 horas atrás. Si usas `getDate()` / `getMonth()` / `getFullYear()`, el 2025-04-20 sale como 19 de abril. Usa SIEMPRE `getUTCDate()`, `getUTCMonth()` y `getUTCFullYear()`, con un arreglo propio de los 12 meses. No uses `toLocaleDateString` ni `Intl`.
   - `colorAcento(accent: 'gold' | 'green'): string` que devuelve `#c6a84b` o `#8cb87a`.
4. Marca las tareas 9 y 10 como hechas en TAREAS.md.

Criterios con que reviso:
- comparo con un script los 7 frontmatter contra el arreglo POSTS original, campo por campo;
- ejecuto `formatearFecha` con las 7 fechas y tienen que salir idénticas a las del prototipo;
- no hay imports de `z` desde `astro:content`;
- `pnpm build` pasa sin advertencias de la colección, y hay exactamente 2 commits.

No toques componentes ni páginas en esta orden. Cuando termines, detente.
