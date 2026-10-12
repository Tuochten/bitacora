// @ts-check
import { defineConfig } from 'astro/config';
import remarkBitacora from './src/lib/remark-bitacora.js';

// https://astro.build/config
export default defineConfig({
  markdown: {
    // El markup de la prosa lo arma el plugin (ver src/lib/remark-bitacora.js); sin Shiki,
    // porque el diseño colorea el código a su manera (comentarios en .c).
    remarkPlugins: [remarkBitacora],
    syntaxHighlight: false,
    // El diseño usa comillas rectas; Astro las cambia por tipográficas si no se desactiva.
    smartypants: false,
  },
});
