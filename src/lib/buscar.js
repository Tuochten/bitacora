// Búsqueda tolerante para el buscador ⌘K.
// - Ignora acentos, mayúsculas, guiones y espacios: "pihole" = "Pi-hole" = "pi hole".
// - Acepta prefijos ("woo" → WooCommerce) y palabras contenidas ("seguridad" → Ciberseguridad).
// - Perdona errores de tipeo: 1 letra en palabras de 4 a 7 letras, 2 desde 8 ("wordpres", "dokcer").
// - Ordena primero lo que calza en el título.

// Sinónimos cortos → término que sí aparece en el contenido. Agregar aquí los que falten.
const ALIAS = { wp: 'wordpress', ciber: 'ciberseguridad', cyber: 'ciberseguridad', hacking: 'pentesting' };

const norm = (s) => String(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
const compacto = (s) => norm(s).replace(/[^a-z0-9]/g, '');
const palabras = (s) => norm(s).split(/[^a-z0-9]+/).filter(Boolean);
const tolerancia = (n) => (n >= 8 ? 2 : n >= 4 ? 1 : 0);

// Uniones de 1 a 4 palabras seguidas, sin separadores: "pi hole" y "Pi-hole" dan "pihole".
// La consulta tiene que empezar al inicio de una palabra; si no, "webflow porque" contendría "wp".
function uniones(p) {
  const u = [];
  for (let i = 0; i < p.length; i++) {
    let s = '';
    for (let j = i; j < Math.min(i + 4, p.length); j++) u.push((s += p[j]));
  }
  return u;
}

// Distancia de Damerau-Levenshtein: cuenta una transposición como un solo error ("dokcer" → "docker").
function distancia(a, b) {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const costo = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + costo);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
    }
  }
  return d[a.length][b.length];
}

// Qué tan bien calza una palabra buscada con las palabras de un texto (0 = no calza).
function calzaPalabra(q, textoPalabras) {
  let mejor = 0;
  const tol = tolerancia(q.length);
  for (const w of textoPalabras) {
    if (w === q) return 3;
    if (w.startsWith(q)) mejor = Math.max(mejor, 2.5);
    else if (q.length >= 3 && w.includes(q)) mejor = Math.max(mejor, 2);
    else if (tol && Math.abs(w.length - q.length) <= tol && distancia(q, w) <= tol) mejor = Math.max(mejor, 1.5);
    else if (tol && q.length >= 5 && w.length > q.length && distancia(q, w.slice(0, q.length)) <= tol) mejor = Math.max(mejor, 1);
  }
  return mejor;
}

// indice: [{ t: título, s: subtítulo, k?: descripción, h: enlace }]. Devuelve los ítems ordenados por relevancia.
export function buscar(indice, consulta) {
  const qc = compacto(consulta);
  if (!qc) return [];
  const qs = palabras(consulta).map((p) => ALIAS[p] || p);
  const resultados = [];
  indice.forEach((item, orden) => {
    const titulo = item.t, resto = `${item.s} ${item.k || ''}`;
    const pT = palabras(titulo), pR = palabras(resto);
    // 1) la consulta completa, sin separadores, al inicio de una palabra
    const empieza = (p) => uniones(p).some((u) => u.startsWith(qc));
    let puntaje = empieza(pT) ? 10 : empieza(pR) ? 6 : 0;
    // 2) palabra por palabra: todas tienen que calzar en algún lado
    let total = 0, enTitulo = 0;
    for (const q of qs) {
      const t = calzaPalabra(q, pT), r = calzaPalabra(q, pR);
      if (!t && !r) { total = 0; break; }
      total += Math.max(t, r);
      if (t && t >= r) enTitulo++;
    }
    if (total) puntaje = Math.max(puntaje, total / qs.length + (enTitulo === qs.length ? 2 : 0));
    if (puntaje) resultados.push({ item, puntaje, orden });
  });
  return resultados.sort((a, b) => b.puntaje - a.puntaje || a.orden - b.orden).map((r) => r.item);
}
