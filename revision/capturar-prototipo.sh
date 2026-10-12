#!/usr/bin/env bash
# Uso: revision/capturar-prototipo.sh <archivo.html dentro de handoff/> <nombre> [alto]
# Sirve handoff/ y captura el prototipo. Si es React con Babel en el navegador, necesita red (CDN).
set -u
REPO=$(git -C "$(dirname "$0")" rev-parse --show-toplevel)
ARCHIVO=$1; NOMBRE=$2; ALTO=${3:-2200}; PUERTO=8787
mkdir -p "$REPO/revision/capturas"
# Si el puerto ya está ocupado, Chromium le hablaría a OTRO servidor (ya pasó: capturó un prototipo viejo)
if ss -ltnH "sport = :$PUERTO" | grep -q .; then echo "ERROR: el puerto $PUERTO ya está ocupado por otro proceso"; exit 1; fi
python3 -m http.server $PUERTO --bind 127.0.0.1 --directory "$REPO/handoff" > /dev/null 2>&1 & SRV=$!
for i in $(seq 1 20); do curl -s -o /dev/null http://127.0.0.1:$PUERTO/ && break; sleep 0.3; done
chromium --headless=new --disable-gpu --hide-scrollbars --window-size=1440,$ALTO --virtual-time-budget=8000 \
  --screenshot="$REPO/revision/capturas/$NOMBRE.png" "http://127.0.0.1:$PUERTO/$ARCHIVO" >/dev/null 2>&1
# El DOM ya renderizado sirve como markup estático de referencia (evita traducir JSX a mano)
chromium --headless=new --disable-gpu --virtual-time-budget=8000 --dump-dom "http://127.0.0.1:$PUERTO/$ARCHIVO" \
  > "$REPO/revision/capturas/$NOMBRE.dom.html" 2>/dev/null
echo "captura: revision/capturas/$NOMBRE.png  ·  DOM: revision/capturas/$NOMBRE.dom.html"
kill $SRV 2>/dev/null; exit 0
