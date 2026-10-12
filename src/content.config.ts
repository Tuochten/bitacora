import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

// Cuerpo de las entradas en Markdown. Los metadatos de listado (tipo, tiempo de lectura, título corto,
// datos de proyecto) viven en src/data/site.json; el archivo se llama como el slug del post.
const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.coerce.date(),
    category: z.string(),
    tags: z.array(z.string()).default([]),
    featured: z.boolean().default(false),
    cover: z.string().optional(),
  }),
});

export const collections = { blog };
