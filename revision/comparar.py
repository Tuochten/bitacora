#!/usr/bin/env python3
"""Compara una pieza del sitio construido contra la misma pieza del prototipo.

Uso: python3 revision/comparar.py <selector CSS> [vista]
  vista: home (por defecto), blog, blog-p2, blog-tema, blog-proyectos, post, post-sin-portada,
         post-proyecto, desarrollo-web, sobre-mi, contacto (ver VISTAS en generar-referencias.py)
  ej.: python3 revision/comparar.py header.top
       python3 revision/comparar.py "section.status"

Lee la página construida de esa vista en dist/ y revision/referencia/proto-<vista>.dom.html.
Normaliza: orden de atributos, espacios en blanco, atributos data-astro-* y data-x-*
(ganchos de implementación que no son del diseño), y los SVG del
personaje y del guardián (se comparan aparte, son largos). Imprime IDÉNTICO o las diferencias.
Requiere haber corrido `pnpm build` antes.
"""
import difflib, re, sys
from pathlib import Path
from bs4 import BeautifulSoup, NavigableString, Comment

RAIZ = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(RAIZ / "revision"))
from importlib import import_module
DIST = {v: RAIZ / "dist" / d for v, (_, d) in import_module("generar-referencias").VISTAS.items()}


def normalizar(el):
    lineas = []

    def visitar(nodo, nivel):
        if isinstance(nodo, Comment):
            return
        if isinstance(nodo, NavigableString):
            t = " ".join(str(nodo).split())
            if t:
                lineas.append("  " * nivel + repr(t))
            return
        if nodo.name == "svg" and any(c in (nodo.get("class") or []) for c in ("mas", "ongoro-svg")):
            lineas.append("  " * nivel + f"<svg {' '.join(nodo.get('class'))}> [{len(str(nodo))} car.]")
            return
        attrs = []
        for k in sorted(nodo.attrs):
            if k.startswith(("data-astro", "data-x-")):  # data-x-*: ganchos de implementación, no son del diseño
                continue
            v = nodo.attrs[k]
            v = " ".join(sorted(v)) if isinstance(v, list) else v
            attrs.append(f'{k.lower()}="{v}"')
        lineas.append("  " * nivel + f"<{nodo.name} {' '.join(attrs)}>".replace(" >", ">"))
        for hijo in nodo.children:
            visitar(hijo, nivel + 1)

    visitar(el, 0)
    return lineas


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(2)
    selector, pagina = sys.argv[1], (sys.argv[2] if len(sys.argv) > 2 else "home")
    if pagina not in DIST:
        print(f"vista desconocida: {pagina}. Opciones: {', '.join(DIST)}")
        sys.exit(2)
    construido = DIST[pagina]
    if not construido.exists():
        print(f"no existe {construido.relative_to(RAIZ)}: corre pnpm build primero")
        sys.exit(1)
    a = BeautifulSoup(construido.read_text(encoding="utf8"), "lxml").select(selector)
    b = BeautifulSoup((RAIZ / f"revision/referencia/proto-{pagina}.dom.html").read_text(encoding="utf8"), "lxml").select(selector)
    if not b:
        print(f"el selector '{selector}' no existe en el prototipo")
        sys.exit(1)
    if len(a) != len(b):
        print(f"DISTINTO: el prototipo tiene {len(b)} elemento(s) '{selector}' y el sitio {len(a)}")
        sys.exit(1)
    fallas = 0
    for i, (x, y) in enumerate(zip(a, b)):
        nx, ny = normalizar(x), normalizar(y)
        if nx != ny:
            fallas += 1
            print(f"DISTINTO en '{selector}' #{i + 1} (- prototipo, + sitio):")
            for l in difflib.unified_diff(ny, nx, lineterm="", n=1):
                if not l.startswith(("---", "+++")):
                    print("  " + l)
    if not fallas:
        print(f"IDÉNTICO: '{selector}' ({len(a)} elemento(s))")
    sys.exit(1 if fallas else 0)


if __name__ == "__main__":
    main()
