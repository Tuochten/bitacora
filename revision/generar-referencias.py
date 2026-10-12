#!/usr/bin/env python3
"""Genera revision/referencia/ a partir del DOM renderizado del prototipo, para todas las vistas.

Uso: python3 revision/generar-referencias.py
  (captura cada vista con revision/capturar-prototipo.sh y después arma las referencias)

Para cada vista deja:
  referencia/proto-<vista>.dom.html   el DOM completo, con rutas de producción (lo usa comparar.py)
  referencia/<vista>-main.html        solo <main>, legible, como plantilla para las órdenes
Y para el home, además, una pieza por bloque (home-top.html, home-head.html…).

Las rutas del prototipo (post.html?slug=…, blog.html?tema=…&pagina=…) se traducen a las de
producción del README del handoff, con los slugs descriptivos de revision/preparar-datos.py.
"""
import json, re, subprocess, sys
import unicodedata
from pathlib import Path
from urllib.parse import urlparse, parse_qs
from bs4 import BeautifulSoup

RAIZ = Path(__file__).resolve().parent.parent
REF = RAIZ / "revision/referencia"
sys.path.insert(0, str(RAIZ / "revision"))
from importlib import import_module
PREP = import_module("preparar-datos")

DATOS = json.loads((RAIZ / "handoff/data/site.json").read_text(encoding="utf8"))
DESTACADO = next(p["slug"] for p in DATOS["posts"] if p.get("featured"))
TIPOS = {"entrada": "entradas", "proyecto": "proyectos"}

# vista → (archivo del prototipo con su query, ruta del sitio construido en dist/)
VISTAS = {
    "home":             ("index.html", "index.html"),
    "blog":             ("blog.html", "blog/index.html"),
    "blog-p2":          ("blog.html?pagina=2", "blog/2/index.html"),
    "blog-tema":        ("blog.html?tema=Homelab", "blog/tema/homelab/index.html"),
    "blog-proyectos":   ("blog.html?tipo=proyecto", "blog/proyectos/index.html"),
    "post":             ("post.html", "blog/migrar-ordenes-woocommerce/index.html"),
    "post-sin-portada": ("post.html?slug=dns-fail", "blog/dns-hosting-fallas-silenciosas/index.html"),
    "post-proyecto":    ("post.html?slug=homelab-proxmox", "blog/homelab-linux/index.html"),
    "desarrollo-web":   ("desarrollo-web.html", "desarrollo-web/index.html"),
    "sobre-mi":         ("sobre-mi.html", "sobre-mi/index.html"),
    "contacto":         ("contacto.html", "contacto/index.html"),
}


def url_tema(t):
    return unicodedata.normalize("NFD", t.lower()).encode("ascii", "ignore").decode().replace(" ", "-")


def ruta(h):
    """Traduce un href del prototipo a su ruta de producción. Lo que no es del prototipo queda igual."""
    if not h or h.startswith(("http", "#", "mailto:", "/", "tel:")):
        return h
    u = urlparse(h)
    q = {k: v[0] for k, v in parse_qs(u.query).items()}
    frag = f"#{u.fragment}" if u.fragment else ""
    if u.path == "post.html":
        s = q.get("slug", DESTACADO)
        return f"/blog/{PREP.SLUGS.get(s, s)}/{frag}"
    if u.path == "blog.html":
        partes = ["/blog"]
        if q.get("tipo") in TIPOS:
            partes.append(TIPOS[q["tipo"]])
        if q.get("tema") and q["tema"] != "Todos":
            partes += ["tema", url_tema(q["tema"])]
        if q.get("pagina") and q["pagina"] != "1":
            partes.append(q["pagina"])
        return "/".join(partes) + "/" + frag
    if u.path + frag in PREP.RUTAS:
        return PREP.RUTAS[u.path + frag]
    return PREP.RUTAS.get(u.path, h) + frag if u.path in PREP.RUTAS else h


def slug_titulo(t):
    """Igual que slug() de src/lib/remark-bitacora.js: los ids de los títulos de la prosa salen del texto."""
    return re.sub(r"^-|-$", "", re.sub(r"[^a-z0-9]+", "-", unicodedata.normalize("NFD", t.lower()).encode("ascii", "ignore").decode()))


def ids_de_prosa(sopa):
    """El prototipo escribe los ids a mano (contexto, tablas…); el plugin de Markdown los genera del texto."""
    nuevos = {}
    for h in sopa.select("#prose h2, #prose h3"):
        n = h.select_one(".n")
        texto = h.get_text()[len(n.get_text()):] if n else h.get_text()
        if h.get("id"):
            nuevos[h["id"]] = slug_titulo(texto)
        h["id"] = slug_titulo(texto)
    for a in sopa.select('a[href^="#"]'):
        if a["href"][1:] in nuevos:
            a["href"] = "#" + nuevos[a["href"][1:]]


def produccion(sopa):
    ids_de_prosa(sopa)
    for a in sopa.select("[href]"):
        a["href"] = ruta(a["href"])
        # los links de compartir llevan la URL de la entrada codificada adentro, con el slug del prototipo
        for viejo, nuevo in PREP.SLUGS.items():
            a["href"] = a["href"].replace(f"%2Fblog%2F{viejo}%2F", f"%2Fblog%2F{nuevo}%2F")
    for img in sopa.select("img[src]"):
        if img["src"].startswith("assets/"):
            img["src"] = "/" + img["src"]
    return sopa


def html(el):
    return str(el).replace("viewbox=", "viewBox=").replace("preserveaspectratio=", "preserveAspectRatio=")


def pieza(el):
    h = html(el)
    h = re.sub(r'<svg[^>]*class="mas"[^>]*>.*?</svg>', '{/* SVG: set:html={mascotSVG({ cls: "mas" })} */}', h, flags=re.S)
    h = re.sub(r'<svg[^>]*class="ongoro-svg"[^>]*>.*?</svg>', '{/* SVG: set:html={ongoroSVG(N)} */}', h, flags=re.S)
    h = re.sub(r'(?<!^)<(header|nav|a class="brand"|button|section|div|article|h1|h2|h3|p|ul|ol|li|aside|footer|dl|dt|dd|form|label|fieldset)([ >])', r"\n<\1\2", h)
    return h + "\n"


def main():
    captura = RAIZ / "revision/capturar-prototipo.sh"
    for vista, (archivo, _) in VISTAS.items():
        r = subprocess.run([str(captura), archivo, f"proto-{vista}", "2600"], capture_output=True, text=True)
        if r.returncode:
            sys.exit(f"falló la captura de {vista}: {r.stdout}{r.stderr}")
        sopa = produccion(BeautifulSoup((RAIZ / f"revision/capturas/proto-{vista}.dom.html").read_text(encoding="utf8"), "lxml"))
        (REF / f"proto-{vista}.dom.html").write_text(html(sopa), encoding="utf8")
        main_el = sopa.select_one("main")
        (REF / f"{vista}-main.html").write_text(pieza(main_el) if main_el else "(sin <main>)\n", encoding="utf8")
        if vista == "home":
            piezas = {
                "home-top.html": str(sopa.select_one("a.skip")) + "\n" + pieza(sopa.select_one("header.top")),
                "home-head.html": pieza(sopa.select_one("section.head")),
                "home-status.html": pieza(sopa.select_one("section.status")),
                "home-pin.html": pieza(sopa.select_one("article.pin")),
                "home-row.html": pieza(sopa.select("article.row")[0]),
                "home-units.html": pieza(sopa.select_one(".units")),
                "home-aside.html": pieza(sopa.select_one("aside")),
                "home-foot.html": pieza(sopa.select_one("footer.foot")),
                "home-cmdk.html": pieza(sopa.select_one("#cmdk")),
            }
            for nombre, h in piezas.items():
                (REF / nombre).write_text(h, encoding="utf8")
        quedan = sorted({a["href"] for a in sopa.select("[href]") if ".html" in a["href"]})
        print(f"{vista:17} {len(str(main_el or '')):6} car. en <main>" + (f" · links sin traducir: {quedan}" if quedan else ""))


if __name__ == "__main__":
    main()
