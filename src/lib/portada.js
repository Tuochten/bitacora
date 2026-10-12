// La ruta de la portada de un post, o null. Que el archivo exista lo garantiza revision/preparar-datos.py,
// que deja en null las portadas que no están en public/: aquí no se toca el disco, porque en el build de
// Cloudflare la carpeta public/ no se encontró por esa vía (las miniaturas salían todas con el ongoro).
export function portada(p) {
  return p.cover ? '/' + p.cover.replace(/^\.?\//, '') : null;
}
