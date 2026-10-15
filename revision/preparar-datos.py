#!/usr/bin/env python3
"""Copia handoff/data/site.json a src/data/site.json aplicando las decisiones de producción.

Uso: python3 revision/preparar-datos.py               → datos de producción (lo que se publica)
     python3 revision/preparar-datos.py --prototipo   → datos del handoff completos, con la maqueta,
                                                        para comparar contra el prototipo (comparar.py y los probadores)

Se corre de nuevo con cada handoff nuevo, porque Claude Design devuelve los datos con los
links del prototipo y los slugs cortos. Decisiones (ver BITACORA.md y DUDAS.md):
- href del prototipo (index.html, blog.html…) → rutas de producción (/, /blog/…).
- slugs descriptivos, por SEO (aprobado por el dueño el 2026-09-26). Ojo con la ñ: "año" no puede quedar "ano".
- el proyecto "Homelab Linux" no se llama homelab-proxmox: Proxmox se descartó y su stack no lo usa.
- en producción (decidido por el dueño el 2026-09-30): una entrada sin cuerpo en Markdown no se publica, así
  que caen las 13 de maqueta (sample: true) y las del diseño sin texto; se suman los posts propios de
  src/data/posts-propios.json, que no vienen del handoff y no se pierden con el próximo. Si uno de ellos
  trae featured: true, ese es el destacado del home y se apaga el del handoff (2026-09-30: el de ffmpeg).
El formato del JSON se conserva (indent 2, sin escapar acentos).
"""
import json, sys
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
ORIGEN, DESTINO = RAIZ / "handoff/data/site.json", RAIZ / "src/data/site.json"
PROPIOS, MARKDOWN = RAIZ / "src/data/posts-propios.json", RAIZ / "src/content/blog"

RUTAS = {"index.html": "/", "blog.html": "/blog/", "desarrollo-web.html": "/desarrollo-web/",
         "sobre-mi.html": "/sobre-mi/", "contacto.html": "/contacto/", "sobre-mi.html#contacto": "/contacto/"}
SLUGS = {
    "homelab": "pihole-nextcloud-vpn-docker",
    "ciberseg-1": "estudiar-seguridad-lo-que-nadie-te-dice",
    "dns-fail": "dns-hosting-fallas-silenciosas",
    "wp-import": "importar-productos-woocommerce-wp-all-import",
    "astro": "por-que-reconstrui-el-blog-en-astro",
    "homelab-proxmox": "homelab-linux",
}


def rutas(nodo):
    """Reemplaza, en todo el árbol, los valores de href que sean páginas del prototipo."""
    if isinstance(nodo, dict):
        return {k: (RUTAS.get(v, v) if k == "href" and isinstance(v, str) else rutas(v)) for k, v in nodo.items()}
    if isinstance(nodo, list):
        return [rutas(x) for x in nodo]
    return nodo


def main():
    d = rutas(json.loads(ORIGEN.read_text(encoding="utf8")))
    for p in d["posts"]:
        p["slug"] = SLUGS.get(p["slug"], p["slug"])
    if "--prototipo" not in sys.argv:
        tiene_cuerpo = lambda p: p.get("type") == "proyecto" or (MARKDOWN / f"{p['slug']}.md").exists()
        fuera = [p["slug"] for p in d["posts"] if p.get("sample") or not tiene_cuerpo(p)]
        d["posts"] = [p for p in d["posts"] if p["slug"] not in fuera]
        propios = json.loads(PROPIOS.read_text(encoding="utf8"))
        if any(p.get("featured") for p in propios):  # el destacado lo elige el dueño, no el handoff
            for p in d["posts"]:
                p["featured"] = False
        # un post propio con el slug de uno del handoff lo reemplaza (los textos de los proyectos, 2026-10-12)
        propios_slugs = {p["slug"] for p in propios}
        d["posts"] = [p for p in d["posts"] if p["slug"] not in propios_slugs] + propios
        # un tema que solo usan los posts propios (Hardware, 2026-10-15) entra al final de los filtros
        for p in propios:
            if p.get("category") and p["category"] not in d["tags"]:
                d["tags"].append(p["category"])
        # una portada que no existe en public/ (la de WooCommerce del handoff es de maqueta) cae al ongoro.
        # Se resuelve aquí y no en el build: en el build de Cloudflare no se puede contar con encontrar public/.
        for p in d["posts"]:
            if p.get("cover") and not (RAIZ / "public" / p["cover"].lstrip("./")).exists():
                p["cover"] = None
        # el Gmail no se publica (pedido del dueño el 2026-09-30): el formulario escribe a una casilla del dominio
        d["profile"]["email"] = "contacto@wlaque.cl"
        # el handoff trae "#" en GitHub; el perfil personal del dueño (2026-10-12)
        # sin el link a RSS en el sitio (pedido del dueño el 2026-10-12); el feed /rss.xml sigue existiendo
        d["social"] = [red for red in d["social"] if red["label"] != "RSS"]
        for red in d["social"]:
            if red["label"] == "GitHub":
                red["href"] = "https://github.com/Tuochten"
        print(f"producción: fuera {len(fuera)} entradas sin cuerpo o de maqueta; +{len(json.loads(PROPIOS.read_text(encoding='utf8')))} posts propios")
    else:
        print("prototipo: datos del handoff completos, con la maqueta")
    slugs = [p["slug"] for p in d["posts"]]
    assert len(slugs) == len(set(slugs)), "slugs repetidos"
    DESTINO.write_text(json.dumps(d, indent=2, ensure_ascii=False) + "\n", encoding="utf8")
    quedan = sorted({v for v in json.dumps(d).split('"') if v.endswith(".html") or ".html#" in v or ".html?" in v})
    print(f"{len(d['posts'])} posts, {sum(not p.get('sample') for p in d['posts'])} reales · slugs cambiados: {sum(s in SLUGS.values() for s in slugs)}")
    print("links de prototipo que quedan en los datos:", quedan or "ninguno")


if __name__ == "__main__":
    main()
