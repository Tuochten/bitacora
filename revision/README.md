# Manual del revisor

Cómo se dirige este proyecto: Claude (en Claude Code) hace de jefe, y OpenCode con un modelo local hace de desarrollador. Salió de una primera prueba el 2026-09-26 en el repo `wladi-blog`, con 8 órdenes y el modelo Qwen3-Coder-Next 80B-A3B. Este archivo es para el revisor; el desarrollador lee `AGENTS.md`.

## Segunda prueba (2026-09-26, este repo): el home completo

Con el método de abajo, **el home quedó idéntico al prototipo píxel por píxel, a 1440 y a 390 px**, en 8 órdenes y ~16 minutos de modelo:

| Orden | Tarea | Tiempo | Resultado |
|---|---|---|---|
| 01 | Layout, cabecera y pie | 5:55 (con carga en frío) | ✅ IDÉNTICO al primer intento |
| 02 | Cabecera del home y "Ahora mismo" | 1:19 | ✅ |
| 03 | Destacado, filas y proyectos | 2:41 | ✅ |
| 04 | Barra lateral y menú móvil | 1:30 | ✅ |
| 05 | Buscador | 1:19 | ❌ markup perfecto, pero se saltó una línea y el buscador no funcionaba |
| 05b | Corrección | 0:26 | ✅ |
| 06 | Filtro por tema | 3:01 | ✅ |

**La diferencia con la primera prueba (0 de 4 tareas nuevas bien al primer intento → 5 de 6):**
- **Referencias de HTML renderizado** (`referencia/*.html`) en vez de pedirle traducir JS o JSX: el modelo copia plantillas, no traduce.
- **Kit de materiales preparado por el revisor**: todo lo que se copia sin cambios (CSS, datos, assets) y las conversiones mecánicas (los SVG, con `sed` + verificación con node) no pasan por el modelo.
- **Autoverificación exacta**: `comparar.py` le dice al modelo la línea que no calza. Nunca "compila", siempre "IDÉNTICO".
- **Probar comportamiento, no solo markup**: el único error de la noche (el buscador) pasó el comparador y solo lo pilló `probar-interaccion.sh`.

## Herramientas

| Script | Qué hace |
|---|---|
| `capturar-prototipo.sh` | Captura el prototipo y vuelca su DOM renderizado |
| `generar-referencias.py` | Arma `referencia/` desde ese DOM, con las rutas de producción |
| `comparar.py <selector>` | Compara una pieza del sitio contra el prototipo, normalizada |
| `probar-filtro.sh` | Carga el home con cada `?tema=` y muestra qué quedó visible |
| `probar-interaccion.sh` | Recorre buscador, filtro y menú con Chromium (CDP) y compara contra `referencia/interaccion-esperada.txt`: es el comportamiento del prototipo v2.1, salvo las líneas del buscador ("pihole", "docker"), que son del buscador tolerante y se revisaron a mano el 2026-09-29. El prototipo sin cambios está en `referencia/interaccion-prototipo-v21.txt` |
| `probar-entrada.mjs <url>` | Prueba el JS de la entrada: índice activo y barra de lectura con el scroll, y los botones de copiar |
| `probar-sitio-js.mjs` | Verifica `src/lib/sitio.js` (fechas, orden, título corto, paginación…) contra las funciones del prototipo |
| `preparar-datos.py [--prototipo]` | Copia `handoff/data/site.json` a `src/data/site.json` con rutas de producción y slugs descriptivos. Sin opción: datos de producción (sin maqueta, con `posts-propios.json`). Con `--prototipo`: los datos del handoff, para que `comparar.py`, `probar-filtro.sh` y `probar-interaccion.sh` midan contra el prototipo. Volver a correrlo sin opción al terminar |
| `probar-buscador.mjs` | Prueba `src/lib/buscar.js` con el índice de `Search.astro` y consultas sobre el contenido de producción (guiones, tipeo, sinónimos, etiquetas) |
| `revisar.sh <nombre>` | Build + captura del sitio |
| `mandar.sh <orden>` | Manda una orden al agente de herdr en sesión nueva |

Para comparar capturas píxel a píxel se usó PIL (`ImageChops.difference`); ver el historial de la sesión si hace falta rehacerlo.

## El patrón que mostró el modelo (primera prueba)

- **Ninguna tarea nueva le salió bien al primer intento; todas las correcciones sí.** Con el error exacto y la línea, corrige en 30 segundos a 2 minutos sin romper nada. Hay que presupuestar una ronda de corrección por tarea.
- **Copia textos perfecto si le das las líneas exactas del prototipo.** Sin eso, los inventa.
- **Falla en las traducciones entre tecnologías** (JSX a Astro, estado de React a JS vanilla) y en código que falla en silencio. Casi nunca son errores que `pnpm build` detecte.
- **Con contexto largo trabaja de memoria**: reescribió un archivo con una versión vieja y borró cambios del revisor. Por eso cada orden va en sesión nueva.
- **Se salta commits** o los nombra por lo que se le pidió y no por lo que hizo.

## Montaje con herdr

Desde el panel de Claude (dentro de herdr, `HERDR_ENV=1`):

```bash
herdr pane split --current --direction right --cwd <repo> --no-focus   # anota el pane_id
herdr agent start constructor --kind opencode --pane <pane_id> -- -m local/qwen3-coder-next
```

Si `agent start` responde `agent_pane_busy` con el prompt de fish a la vista, es un **proceso zombi** de fish en primer plano. `herdr pane send-keys <pane_id> enter` hace que fish lo recoja.

El usuario ve la interfaz normal de OpenCode en el panel de la derecha, en vivo.

## El ciclo de una orden

1. **Leer el prototipo antes de escribir la orden**: el markup (`grep -n` en los `.jsx`, o mejor el DOM renderizado de `capturar-prototipo.sh`), el CSS y los datos.
2. **Escribir la orden** con `plantilla-orden.md`. Lo que la hace funcionar:
   - las líneas exactas del prototipo que tiene que traducir;
   - las trampas advertidas de antemano (las que están en `AGENTS.md` y las nuevas de esa tarea);
   - fragmentos de código literales cuando hay una sola forma correcta (configuración, APIs);
   - comandos de autoverificación **probados antes por el revisor**, con la salida exacta esperada;
   - el cierre con `git status` y `git log` pegados en la respuesta.
3. **Mandarla**: `revision/mandar.sh ordenes/NN-nombre.md` (abre sesión nueva sola).
4. **Revisar sin confiar en lo que el modelo dice que hizo**:
   - `git log` / `git status`: ¿los commits pedidos?, ¿algo sin commitear?
   - `git diff` de los archivos que no debía tocar, sobre todo `TAREAS.md` y los imports.
   - chequeos con `grep` de cada criterio.
   - `revision/revisar.sh NN-nombre` y **mirar la captura** contra la del prototipo. Es lo único que pilló los errores graves.
   - si hay JS con tiempos, leer el DOM a distintos tiempos virtuales (`chromium --headless=new --virtual-time-budget=N --dump-dom`).
5. Si algo falla: **orden de corrección puntual** antes de avanzar. Si la regla es general, agregarla a `AGENTS.md`.

## Trampas del entorno

- `pkill -f <patrón>` desde la herramienta Bash de Claude mata a su propio shell, porque el patrón aparece en su línea de comandos. Matar por PID.
- En Astro 7, `astro preview` es un demonio que escucha solo en IPv6: por eso los scripts sirven `dist/` con Python.
- El modelo local ocupa ~13,5 GB de la 5080 y ~16-22 GB de RAM como cache: no se puede jugar ni usar otro LLM de llama-swap mientras trabaja (llama-swap tiene un LLM a la vez y lo descargaría a mitad de una orden). La 2060 sí queda libre para `voxtype-leccion`.
- La primera orden de una sesión de llama-swap carga el modelo en frío (~2 min).
