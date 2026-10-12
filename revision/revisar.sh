#!/usr/bin/env bash
# Uso: revision/revisar.sh <nombre> [ruta] [alto]
# Construye el sitio y saca una captura headless en revision/capturas/<nombre>.png
set -u
REPO=$(git -C "$(dirname "$0")" rev-parse --show-toplevel)
NOMBRE=$1; RUTA=${2:-/}; ALTO=${3:-2200}; PUERTO=4399
mkdir -p "$REPO/revision/capturas"; cd "$REPO"
if ! pnpm build > /tmp/wladi-build.log 2>&1; then echo "BUILD FALLÓ:"; tail -20 /tmp/wladi-build.log; exit 1; fi
echo "build OK ($(grep -oE '[0-9]+ page\(s\) built' /tmp/wladi-build.log))"
# Se sirve dist/ con Python: 'astro preview' en Astro 7 es un demonio que queda corriendo y escucha solo en IPv6
# Si el puerto ya está ocupado, Chromium le hablaría a OTRO servidor (ya pasó: capturó un prototipo viejo)
if ss -ltnH "sport = :$PUERTO" | grep -q .; then echo "ERROR: el puerto $PUERTO ya está ocupado por otro proceso"; exit 1; fi
python3 -m http.server $PUERTO --bind 127.0.0.1 --directory "$REPO/dist" > /dev/null 2>&1 & SRV=$!
for i in $(seq 1 20); do curl -s -o /dev/null http://127.0.0.1:$PUERTO/ && break; sleep 0.3; done
rm -f "revision/capturas/$NOMBRE.png"
chromium --headless=new --disable-gpu --hide-scrollbars --window-size=1440,$ALTO --virtual-time-budget=5000 \
  --screenshot="revision/capturas/$NOMBRE.png" "http://127.0.0.1:$PUERTO$RUTA" >/dev/null 2>&1
[ -f "revision/capturas/$NOMBRE.png" ] && echo "captura: revision/capturas/$NOMBRE.png"
kill $SRV 2>/dev/null; exit 0
