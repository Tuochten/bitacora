#!/usr/bin/env bash
# Uso: revision/probar-filtro.sh
# Carga el home con ?tema=<X> en Chromium headless y muestra qué quedó visible, para cada tema.
# Lo esperado está en revision/referencia/filtro-esperado.txt (salida del prototipo). Resumen:
#   Todos          → destacado visible · título "Entradas recientes" · 5 filas sin el destacado
#   <Categoría>    → destacado oculto · título "Tema: <Categoría>" · solo filas de esa categoría (incluido el destacado)
set -u
REPO=$(git -C "$(dirname "$0")" rev-parse --show-toplevel); PUERTO=4398
cd "$REPO"
if ss -ltnH "sport = :$PUERTO" | grep -q .; then echo "ERROR: el puerto $PUERTO está ocupado"; exit 1; fi
pnpm build > /tmp/wladi-build.log 2>&1 || { echo "BUILD FALLÓ"; tail -20 /tmp/wladi-build.log; exit 1; }
python3 -m http.server $PUERTO --bind 127.0.0.1 --directory "$REPO/dist" > /dev/null 2>&1 & SRV=$!
for i in $(seq 1 20); do curl -s -o /dev/null http://127.0.0.1:$PUERTO/ && break; sleep 0.3; done
for tema in Todos Dev Homelab Astro Inventado; do  # la salida se compara al final contra referencia/filtro-esperado.txt
  chromium --headless=new --disable-gpu --virtual-time-budget=3000 --dump-dom "http://127.0.0.1:$PUERTO/?tema=$tema" 2>/dev/null | python3 -c "
import sys
from bs4 import BeautifulSoup
s = BeautifulSoup(sys.stdin.read(), 'lxml')
def visible(el):
    return el is not None and not any(p.has_attr('hidden') for p in [el, *el.parents] if hasattr(p, 'has_attr'))
pin = s.select_one('#pin')
filas = [r for r in s.select('#log article.row') if visible(r)]
cats = [r.select_one('.cat').get_text() for r in filas]
activo = [b['data-t'] for b in s.select('#filters button') if b.get('aria-pressed') == 'true']
vacio = s.select_one('#log .empty')
print(f'$tema'.ljust(10), '| destacado', 'visible' if visible(pin) and pin.select_one('article.pin') else 'oculto ',
      '| título:', repr(s.select_one('#seclabel').get_text()), '| botón activo:', activo,
      '| filas:', len(filas), cats, '| vacío visible' if visible(vacio) else '')
"
done > /tmp/wladi-filtro.txt
kill $SRV 2>/dev/null
cat /tmp/wladi-filtro.txt
if diff <(sed 's/ *$//' "$REPO/revision/referencia/filtro-esperado.txt") <(sed 's/ *$//' /tmp/wladi-filtro.txt) > /dev/null; then echo "IDÉNTICO: el filtro se comporta como el prototipo"; else echo "DISTINTO:"; diff <(sed 's/ *$//' "$REPO/revision/referencia/filtro-esperado.txt") <(sed 's/ *$//' /tmp/wladi-filtro.txt); exit 1; fi
