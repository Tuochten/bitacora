# bitacora

Código fuente de **[wlaque.cl](https://wlaque.cl)**, el sitio personal y blog de Wladimir Aqueveque H.: ciberseguridad, homelab y desarrollo web, contado desde la terminal.

El diseño lo hice en Claude Design, inspirado en el Steam de los 2000. El código lo escribieron **Claude Code** como jefe de obra y **OpenCode con Qwen3-Coder-Next**, un modelo que corre en mi propia GPU, como desarrollador, bajo reglas y pruebas que puse yo. La historia completa, con lo que salió mal, está en el post **[wlaque.cl](https://wlaque.cl/blog/wlaque-cl/)**.

## Stack

- **Astro 7**, con el HTML generado en el build y JavaScript solo donde hay interacción (buscador, filtros, índice de lectura).
- **Cloudflare Workers** con archivos estáticos: cada push a `main` se despliega solo.
- **Formulario de contacto** en un Worker chico (`worker/index.js`): Email Routing, Turnstile, límite de envíos por IP y campo trampa para bots.
- Markdown con un plugin propio de remark (`src/lib/remark-bitacora.js`) que arma figuras, avisos y bloques de código con el markup del diseño.

## Cómo está organizado

| Carpeta | Qué hay |
|---|---|
| `src/` | El sitio: páginas, componentes, estilos y las entradas del blog (`src/content/blog/`) |
| `worker/` | El Worker del formulario de contacto |
| `handoff/` | El prototipo exportado de Claude Design, la fuente de verdad del diseño |
| `revision/` | Las herramientas del revisor: comparador contra el prototipo, probadores de interacción en Chromium por CDP y las órdenes que se le dieron al modelo |
| `AGENTS.md` | Las reglas para el agente desarrollador |

Los archivos en mayúsculas (`BITACORA.md`, `TAREAS.md`, `DUDAS.md`, `DESPLIEGUE.md`, `PLAN-FORMULARIO.md`) son el registro de trabajo del proyecto, tal como se fue escribiendo.

## Correrlo

```bash
corepack enable
pnpm install
pnpm dev          # http://localhost:4321
```

Requiere Node 22.12 o más nuevo. Para agregar una entrada: el `.md` en `src/content/blog/`, sus datos en `src/data/posts-propios.json` y `python3 revision/preparar-datos.py`.

## Licencia

El **código** es MIT (ver `LICENSE`): úsalo, cópialo y aprende de él. Los **contenidos** no: los textos de las entradas, las fotos, mi foto, el ongoro, el logo y el diseño (`src/content/`, `public/blog/`, `public/assets/`, `public/og.png`, los favicon y `handoff/`) son © Wladimir Aqueveque H., todos los derechos reservados.
