// sitemap.xml sin dependencias: páginas fijas, portada de cada tipo y tema del blog, y cada entrada.
// Deja fuera las entradas de maqueta (sample: true).
import site from '../data/site.json';
import { postHref } from '../lib/sitio.js';
import { hrefBlog, listaBlog } from '../lib/blog.js';

const SITIO = 'https://wlaque.cl';

export function GET() {
  const rutas = new Set(['/', '/desarrollo-web/', '/sobre-mi/', '/contacto/']);
  for (const tipo of ['todo', 'entrada', 'proyecto'])
    for (const tema of site.tags) if (listaBlog(tipo, tema).some((p) => !p.sample)) rutas.add(hrefBlog(tipo, tema, 1));
  for (const p of site.posts) if (!p.sample) rutas.add(postHref(p));
  const urls = [...rutas].map((r) => `  <url><loc>${SITIO}${r}</loc></url>`).join('\n');
  return new Response(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`,
    { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
}
