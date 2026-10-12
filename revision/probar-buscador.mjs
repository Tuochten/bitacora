// Uso: node revision/probar-buscador.mjs
// Prueba src/lib/buscar.js con consultas reales contra el índice del sitio.
// Cada caso dice qué tiene que salir PRIMERO (o que no salga nada, o qué NO tiene que aparecer).
// Nota: aquí el sitio se aparta del prototipo a propósito. El prototipo no encontraba "pihole";
// ver también revision/referencia/interaccion-esperada.txt, línea 3.
import fs from 'node:fs';
import { buscar } from '../src/lib/buscar.js';
import { byDate, isProj, postHref } from '../src/lib/sitio.js';

const site = JSON.parse(fs.readFileSync(new URL('../src/data/site.json', import.meta.url), 'utf8'));
// el mismo índice que arma src/components/Search.astro
const idx = [
  ...site.nav.map((n) => ({ t: n.label, s: 'Página', h: n.href })),
  ...byDate(site.posts).map((p) => ({ t: p.title, s: isProj(p) ? 'Proyecto · ' + p.project.stack : 'Entrada · ' + p.category, h: postHref(p), k: [p.description, p.category, ...(p.tags || [])].join(' ') })),
];
// Casos sobre el contenido de producción (python3 revision/preparar-datos.py, sin --prototipo).
const casos = [
  // [consulta, lo que tiene que salir primero (inicio del título) | null si no debe haber resultados, título que NO debe aparecer]
  ['pihole', 'Mi Pi-hole'], ['pi hole', 'Mi Pi-hole'], ['Pi-hole', 'Mi Pi-hole'], ['PIHOLE', 'Mi Pi-hole'],
  ['btfrs', 'btrfs dice'], ['ffmpg', 'Recomprimir'], ['tailscale', 'Mi Pi-hole'], ['woo', 'Utilidades WooCommerce'],
  ['systemd resolved', 'Mi Pi-hole'], ['video familiar', 'Recomprimir'], ['wp', 'Utilidades WooCommerce', 'btrfs dice'],
  ['ciber', 'Laboratorio de pentesting'], ['xyz', null],
];
let fallas = 0;
for (const [q, primero, prohibido] of casos) {
  const r = buscar(idx, q);
  const ok = (primero === null ? r.length === 0 : r[0]?.t.startsWith(primero)) && !(prohibido && r.some((x) => x.t.startsWith(prohibido)));
  if (!ok) fallas++;
  console.log(`${ok ? 'OK   ' : 'FALLA'} ${q.padEnd(12)} → ${r.length} resultado(s)${r[0] ? ': ' + r[0].t.slice(0, 45) : ''}`);
}
console.log(fallas ? `\n${fallas} caso(s) fallaron` : `\nlos ${casos.length} casos pasan`);
process.exit(fallas ? 1 : 0);
