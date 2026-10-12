// RSS del blog (/rss.xml), sin dependencias. Deja fuera las entradas de maqueta (sample: true).
import site from '../data/site.json';
import { byDate, postHref } from '../lib/sitio.js';

const SITIO = 'https://wlaque.cl';
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function GET() {
  const items = byDate(site.posts).filter((p) => !p.sample).map((p) => `
    <item>
      <title>${esc(p.title)}</title>
      <link>${SITIO}${postHref(p)}</link>
      <guid>${SITIO}${postHref(p)}</guid>
      <pubDate>${new Date(`${p.date}T12:00:00Z`).toUTCString()}</pubDate>
      <category>${esc(p.category)}</category>
      <description>${esc(p.description)}</description>
    </item>`).join('');
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>wlaque.cl</title>
    <link>${SITIO}/</link>
    <description>Notas de trabajo y proyectos: infraestructura, e-commerce y ciberseguridad.</description>
    <language>es-CL</language>${items}
  </channel>
</rss>
`;
  return new Response(xml, { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' } });
}
