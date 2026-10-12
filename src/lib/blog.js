// Rutas y listas del listado del blog (handoff/blog.html). En módulo aparte porque getStaticPaths
// de Astro corre aislado y solo ve lo importado, no las funciones del mismo archivo.
import site from '../data/site.json';
import { byDate, temaUrl } from './sitio.js';

const TIPOS = { entrada: 'entradas', proyecto: 'proyectos' };

// Segmentos después de /blog/: tipo, tema y página (la 1 no lleva número). '' es /blog/.
export const rutaBlog = (tipo, tema, i) =>
  [tipo !== 'todo' ? TIPOS[tipo] : null, tema !== 'Todos' ? `tema/${temaUrl(tema)}` : null, i > 1 ? i : null].filter(Boolean).join('/');

export const hrefBlog = (tipo, tema, i) => {
  const r = rutaBlog(tipo, tema, i);
  return `/blog/${r ? r + '/' : ''}`;
};

// Posts de un tipo ('todo', 'entrada', 'proyecto') y un tema ('Todos' o una categoría), de más nuevo a más viejo.
export const listaBlog = (tipo, tema) =>
  byDate(site.posts).filter((p) => (tipo === 'todo' || p.type === tipo) && (tema === 'Todos' || p.category === tema));
