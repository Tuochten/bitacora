#!/usr/bin/env bash
# Uso: revision/probar-interaccion.sh
# Construye el sitio, recorre buscador, filtro y menú móvil con Chromium (CDP) y compara
# contra revision/referencia/interaccion-esperada.txt (el mismo recorrido hecho en el prototipo).
set -u
REPO=$(git -C "$(dirname "$0")" rev-parse --show-toplevel); PUERTO=4396
cd "$REPO"
if ss -ltnH "sport = :$PUERTO" | grep -q .; then echo "ERROR: el puerto $PUERTO está ocupado"; exit 1; fi
pnpm build > /tmp/wladi-build.log 2>&1 || { echo "BUILD FALLÓ"; tail -20 /tmp/wladi-build.log; exit 1; }
python3 -m http.server $PUERTO --bind 127.0.0.1 --directory "$REPO/dist" > /dev/null 2>&1 & SRV=$!
for i in $(seq 1 20); do curl -s -o /dev/null http://127.0.0.1:$PUERTO/ && break; sleep 0.3; done
timeout 90 node revision/probar-interaccion.mjs "http://127.0.0.1:$PUERTO/" > /tmp/wladi-interaccion.txt 2>&1
kill $SRV 2>/dev/null
if diff revision/referencia/interaccion-esperada.txt /tmp/wladi-interaccion.txt; then echo "IDÉNTICO: la interacción calza con el prototipo"; else echo "DISTINTO (< prototipo, > sitio)"; exit 1; fi
