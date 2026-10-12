#!/usr/bin/env bash
# Uso: revision/mandar.sh <archivo-de-orden.md> [agente]
# Abre una sesión NUEVA de OpenCode en el agente de herdr y le manda la orden. Espera a que termine.
# Requiere estar dentro de herdr (HERDR_ENV=1) y el agente ya iniciado (ver revision/README.md).
set -u
ORDEN=$1; AGENTE=${2:-constructor}
REPO=$(git -C "$(dirname "$0")" rev-parse --show-toplevel)
[ "${HERDR_ENV:-}" = 1 ] || { echo "no estoy dentro de herdr"; exit 1; }
ANTES=$(git -C "$REPO" rev-parse HEAD); T0=$(date +%s)
herdr agent prompt "$AGENTE" "/new" > /dev/null 2>&1; sleep 3   # sesión limpia: con contexto viejo el modelo reescribe archivos de memoria
herdr agent prompt "$AGENTE" "$(cat "$ORDEN")" --wait > /dev/null 2>&1
echo "duración: $(( $(date +%s) - T0 ))s"
echo "=== commits nuevos ==="; git -C "$REPO" log --oneline "$ANTES"..HEAD
echo "=== sin commitear ==="; git -C "$REPO" status --short
