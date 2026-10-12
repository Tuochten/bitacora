Eres el desarrollador de este repo. Lee AGENTS.md completo antes de empezar: tiene reglas nuevas.

Orden 4b — corregir la colección de posts. Contexto: en la orden anterior se crearon los 7 posts en `src/content/posts/` y están PERFECTOS, no los toques. Pero quedaron tres problemas:
- `src/content.config.ts` usa una API vieja de Astro, y por eso la colección no carga ningún post;
- `src/lib/posts.ts` nunca se creó;
- las tareas 9 y 10 de `TAREAS.md` no están marcadas.

## Paso 1 (commit: "corrige content.config.ts a la API de Astro 7")

Reemplaza el contenido COMPLETO de `src/content.config.ts` por exactamente esto:

```ts
import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const posts = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/posts' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.coerce.date(),
    tags: z.array(z.string()).min(1),
    glyph: z.string(),
    accent: z.enum(['gold', 'green']),
    featured: z.boolean().default(false),
    readTime: z.string(),
  }),
});

export const collections = { posts };
```

Verifícalo tú mismo: corre `pnpm build` y después este comando, que tiene que imprimir `7`:
```bash
node -e "const d=require('fs').readFileSync('.astro/data-store.json','utf8'); console.log(['woo-migrate','homelab','ciberseg-1','dns-fail','wp-import','astro','cto-life'].filter(x=>d.includes(x)).length)"
```
Si no imprime 7, no sigas: revisa qué falló.

## Paso 2 (commit: "agrega helpers de fecha y acento")

Crea `src/lib/posts.ts` con dos funciones exportadas:
- `formatearFecha(fecha: Date): string` → día con 2 dígitos, mes en español con mayúscula inicial, año. Ejemplo: `08 Enero 2025`. Usa SIEMPRE `getUTCDate()`, `getUTCMonth()` y `getUTCFullYear()` con un arreglo propio de 12 meses (`Enero` ... `Diciembre`). Nada de `getDate()`, `toLocaleDateString` ni `Intl`: la fecha viene en UTC y con la hora de Chile se correría un día.
- `colorAcento(accent: 'gold' | 'green'): string` → `'#c6a84b'` para gold y `'#8cb87a'` para green.

Verifícalo tú mismo con este comando, que tiene que imprimir `08 Enero 2025 | 20 Abril 2025 | 02 Diciembre 2024 | #8cb87a`:
```bash
node -e "import('./src/lib/posts.ts').then(m=>console.log([m.formatearFecha(new Date('2025-01-08')),m.formatearFecha(new Date('2025-04-20')),m.formatearFecha(new Date('2024-12-02')),m.colorAcento('green')].join(' | ')))"
```

## Paso 3 (en el mismo commit del paso 2)

Relee `TAREAS.md` DESDE EL DISCO (cambió hace poco) y marca con `[x]` SOLO las tareas 9 y 10. Edita solo esas dos líneas; no reescribas el archivo.

Al terminar, cuéntame en tu respuesta qué imprimieron los dos comandos de verificación. Luego detente.
