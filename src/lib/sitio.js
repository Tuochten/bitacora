// Utilidades compartidas del sitio, portadas de handoff/js/site.js (v2.1.0).
// Son funciones puras: se usan al construir las páginas (frontmatter de Astro).
// Verificadas contra las originales del prototipo (ver revision/probar-sitio-js.mjs).

const MES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

// "2025-04-20" → "20 abr 2025". Parte el texto ISO en vez de usar Date: así no hay corrimiento por zona horaria.
export const fmtDate = (iso) => {
  const [y, m, d] = iso.split('-').map(Number);
  return `${d} ${MES[m - 1]} ${y}`;
};

// De más nueva a más antigua, sin modificar la lista original.
export const byDate = (lista) => lista.slice().sort((a, b) => b.date.localeCompare(a.date));

export const isProj = (p) => p.type === 'proyecto';

// En el prototipo es post.html?slug=…; en producción, /blog/<slug>/.
export const postHref = (p) => `/blog/${p.slug}/`;

// Tema en la URL: minúscula y sin acentos ("Ciberseguridad" → "ciberseguridad").
export const temaUrl = (t) => t.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '-');

// Título corto para la miga de pan y la portada sin imagen.
// 1) shortTitle si existe. 2) Si no: el título hasta el primer ": ", " (" o " — ".
// 3) Si aún supera max (42), se corta en el último espacio antes de max y se agrega "…".
export function shortTitle(p, max = 42) {
  if (p.shortTitle) return p.shortTitle;
  let t = p.title.split(/: | \(| — /)[0].trim();
  if (t.length <= max) return t;
  t = t.slice(0, max);
  return t.slice(0, t.lastIndexOf(' ')).replace(/[,;.\s]+$/, '') + '…';
}

// Paginación numerada: ← Anterior, 1 … (P−1) P (P+1) … T, Siguiente →. Con una sola página no devuelve nada.
// Devuelve HTML (se inserta con set:html): los números y los href los genera el propio sitio.
export function paginas(n, cur, href) {
  if (n <= 1) return '';
  const show = [...new Set([1, n, cur - 1, cur, cur + 1])].filter((i) => i >= 1 && i <= n).sort((a, b) => a - b);
  let last = 0, nums = '';
  show.forEach((i) => {
    if (i - last > 1) nums += '<span class="gap" aria-hidden="true">…</span>';
    nums += i === cur ? `<span aria-current="page">${i}</span>` : `<a href="${href(i)}">${i}</a>`;
    last = i;
  });
  const prev = cur > 1 ? `<a href="${href(cur - 1)}" rel="prev">← Anterior</a>` : '<span class="dis" aria-disabled="true">← Anterior</span>';
  const next = cur < n ? `<a href="${href(cur + 1)}" rel="next">Siguiente →</a>` : '<span class="dis" aria-disabled="true">Siguiente →</span>';
  return `<nav class="pages" aria-label="Paginación">${prev}${nums}${next}</nav>`;
}
