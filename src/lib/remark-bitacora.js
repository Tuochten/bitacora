// Plugin de remark: convierte el Markdown de las entradas al markup del diseño (handoff/prosa.css).
//   - primer párrafo            → <p class="lead">
//   - ## Título                 → <h2 id="titulo">Título</h2> (sin número desde el 2026-10-12; el índice lateral sí numera)
//   - `código`                  → <span class="ic">código</span>
//   - ```lang title="Etiqueta"  → <div class="code"><div class="code-h">…</div><pre><code>…</code></pre></div>
//                                 (las líneas que empiezan con --, // o # van en <span class="c">)
//   - > [!WARNING] Título        → <div class="note warn" role="note"><span class="k">Título</span>…</div>
//   - > [!TIP] / > [!NOTE] Título → <div class="note" role="note">…</div>
//   - ![alt](/ruta.webp "Pie")  → <figure><img … width height loading="lazy"><figcaption>Pie</figcaption></figure>
//                                 (solo cuando la imagen va sola en su párrafo; las medidas se leen del
//                                 archivo en public/ para que la página no salte al cargar).
//                                 Si junto a la imagen hay una versión angosta (foto.movil.webp), va en un
//                                 <picture> para pantallas de hasta 600 px: sirve para capturas con texto.
// Sin dependencias: recorre el árbol de mdast a mano.

import { readFileSync } from 'node:fs';

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// Mismo criterio que la URL de los temas: minúscula, sin acentos, guiones.
const slug = (s) =>
  s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const texto = (nodo) => (nodo.value ?? '') + (nodo.children || []).map(texto).join('');

const TITULOS = { WARNING: 'Atención', TIP: 'Tip', NOTE: 'Nota' };

// Ancho y alto de un PNG o WebP de public/. Si no se puede leer, la imagen va sin medidas.
function medidas(src) {
  try {
    const b = readFileSync(new URL('../../public' + src, import.meta.url));
    if (b.toString('ascii', 1, 4) === 'PNG') return [b.readUInt32BE(16), b.readUInt32BE(20)];
    if (b.toString('ascii', 0, 4) === 'RIFF' && b.toString('ascii', 8, 12) === 'WEBP') {
      const tipo = b.toString('ascii', 12, 16);
      if (tipo === 'VP8X') return [1 + b.readUIntLE(24, 3), 1 + b.readUIntLE(27, 3)];
      if (tipo === 'VP8 ') return [b.readUInt16LE(26) & 0x3fff, b.readUInt16LE(28) & 0x3fff];
      if (tipo === 'VP8L') { const v = b.readUInt32LE(21); return [1 + (v & 0x3fff), 1 + ((v >> 14) & 0x3fff)]; }
    }
  } catch {}
  return null;
}

const attr = (s) => esc(s).replace(/"/g, '&quot;');

// Un párrafo que solo contiene una imagen pasa a ser una figura con pie (el título de la imagen).
function figura(nodo) {
  const hijos = nodo.children.filter((h) => !(h.type === 'text' && !h.value.trim()));
  if (hijos.length !== 1 || hijos[0].type !== 'image') return null;
  const { url, alt = '', title } = hijos[0];
  const m = url.startsWith('/') ? medidas(url) : null;
  const tam = m ? ` width="${m[0]}" height="${m[1]}"` : '';
  const pie = title ? `<figcaption>${esc(title)}</figcaption>` : '';
  const img = `<img src="${attr(url)}" alt="${attr(alt)}"${tam} loading="lazy" decoding="async">`;
  const movil = url.replace(/(\.\w+)$/, '.movil$1');
  const mm = url.startsWith('/') && movil !== url ? medidas(movil) : null;
  const imagen = mm
    ? `<picture><source media="(max-width:600px)" srcset="${attr(movil)}" width="${mm[0]}" height="${mm[1]}">${img}</picture>`
    : img;
  return { type: 'html', value: `<figure>${imagen}${pie}</figure>` };
}

function bloqueDeCodigo(nodo) {
  const titulo = (nodo.meta || '').match(/title="([^"]*)"/)?.[1] || (nodo.lang || 'Código').toUpperCase();
  const lineas = nodo.value.split('\n').map((l) => (/^\s*(--|\/\/|#)/.test(l) ? `<span class="c">${esc(l)}</span>` : esc(l)));
  return {
    type: 'html',
    value: `<div class="code"><div class="code-h"><span>${esc(titulo)}</span></div>\n<pre><code>${lineas.join('\n')}</code></pre></div>`,
  };
}

function callout(nodo) {
  const parrafo = nodo.children[0];
  const primero = parrafo?.type === 'paragraph' ? parrafo.children[0] : null;
  const m = primero?.type === 'text' && primero.value.match(/^\[!(WARNING|TIP|NOTE)\][ \t]*([^\n]*)\n?/);
  if (!m) return nodo;
  primero.value = primero.value.slice(m[0].length);
  const titulo = m[2].trim() || TITULOS[m[1]];
  return {
    type: 'blockquote',
    data: { hName: 'div', hProperties: { className: m[1] === 'WARNING' ? ['note', 'warn'] : ['note'], role: 'note' } },
    // el texto va suelto dentro del div, sin <p>, igual que en el prototipo
    children: [{ type: 'html', value: `<span class="k">${esc(titulo)}</span>` }, ...parrafo.children, ...nodo.children.slice(1)],
  };
}

function codigoEnLinea(nodo) {
  if (nodo.type === 'inlineCode') {
    nodo.data = { hName: 'span', hProperties: { className: ['ic'] } };
  }
  (nodo.children || []).forEach(codigoEnLinea);
}

export default function remarkBitacora() {
  return (arbol) => {
    let lead = false;
    arbol.children = arbol.children.map((nodo) => {
      if (nodo.type === 'code') return bloqueDeCodigo(nodo);
      if (nodo.type === 'blockquote') nodo = callout(nodo);
      if (nodo.type === 'paragraph') {
        const fig = figura(nodo);
        if (fig) return fig;
      }
      if (nodo.type === 'paragraph' && !lead) {
        lead = true;
        nodo.data = { hProperties: { className: ['lead'] } };
      }
      if (nodo.type === 'heading') {
        nodo.data = { hProperties: { id: slug(texto(nodo)) } };
      }
      codigoEnLinea(nodo);
      return nodo;
    });
  };
}
