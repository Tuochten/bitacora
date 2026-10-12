// Uso: node revision/probar-sitio-js.mjs
// Compara src/lib/sitio.js contra las funciones originales de handoff/js/site.js, con todos los posts reales.
import fs from 'node:fs';
import vm from 'node:vm';
import * as nuevo from '../src/lib/sitio.js';

const raiz = new URL('..', import.meta.url);
const js = fs.readFileSync(new URL('handoff/js/site.js', raiz), 'utf8');
// Las funciones del prototipo viven dentro de un IIFE: se sacan con su texto exacto y se evalúan aparte.
const saca = (re) => js.match(re)[0];
const ctx = { D: { settings: { shortTitleMax: 42 } } };
vm.createContext(ctx);
vm.runInContext([saca(/const MES = .*;/), saca(/const fmtDate = .*;/), saca(/const byDate = .*;/),
  saca(/function shortTitle\(p, max\)\{[\s\S]*?\n\}/), saca(/function pages\(n, cur, href\)\{[\s\S]*?\n\}/), 'globalThis.orig = { fmtDate, byDate, shortTitle, pages };'].join('\n'), ctx);
const { orig } = ctx;

const datos = JSON.parse(fs.readFileSync(new URL('handoff/data/site.json', raiz), 'utf8'));
let fallas = 0;
const chequeo = (nombre, a, b) => { const ok = JSON.stringify(a) === JSON.stringify(b); if (!ok) { fallas++; console.log(`FALLA ${nombre}: ${JSON.stringify(a)} ≠ ${JSON.stringify(b)}`); } };
for (const p of datos.posts) {
  chequeo(`fmtDate(${p.date})`, nuevo.fmtDate(p.date), orig.fmtDate(p.date));
  chequeo(`shortTitle(${p.slug})`, nuevo.shortTitle(p), orig.shortTitle(p));
}
chequeo('byDate', nuevo.byDate(datos.posts).map((p) => p.slug), orig.byDate(datos.posts).map((p) => p.slug));
// Ejemplos del README del handoff
const por = (s) => datos.posts.find((p) => p.slug === s);
chequeo('README dns-fail', nuevo.shortTitle(por('dns-fail')), 'DNS, Hosting y todo lo que falla en…');
chequeo('README astro', nuevo.shortTitle(por('astro')), 'Por qué reconstruí este blog en Astro');
chequeo('isProj', datos.posts.filter(nuevo.isProj).length, datos.posts.filter((p) => p.type === 'proyecto').length);
chequeo('isProj > 0', datos.posts.filter(nuevo.isProj).length > 0, true);
chequeo('postHref', nuevo.postHref({ slug: 'x-y' }), '/blog/x-y/');
for (let n = 0; n <= 12; n++) for (let c = 1; c <= Math.max(1, n); c++) chequeo(`paginas(${n},${c})`, nuevo.paginas(n, c, (i) => `/p/${i}/`), orig.pages(n, c, (i) => `/p/${i}/`));
chequeo('temaUrl', ['Ciberseguridad', 'Homelab', 'Dev'].map(nuevo.temaUrl), ['ciberseguridad', 'homelab', 'dev']);
console.log(fallas ? `${fallas} falla(s)` : `sitio.js calza con el prototipo en los ${datos.posts.length} posts y los ejemplos del README`);
process.exit(fallas ? 1 : 0);
