Eres el desarrollador de este repo. Lee AGENTS.md y BITACORA.md antes de empezar.

Orden 09 — las páginas Sobre mí (`/sobre-mi/`) y Contacto (`/contacto/`). Van 2 commits, uno por página.

Igual que en `src/pages/desarrollo-web.astro` (míralo como ejemplo del patrón): el HTML exacto de cada `<main>` está en `revision/referencia/sobre-mi-main.html` y `revision/referencia/contacto-main.html`. Todo lo que el prototipo arma con JavaScript desde `data/site.json` aquí se genera en el build con `.map()` desde `src/data/site.json`. Para saber de qué dato sale cada cosa, mira el `<script>` de `handoff/sobre-mi.html` y de `handoff/contacto.html`: cada `getElementById(...)` dice qué dato va en qué elemento.

## Bloque A (commit: "agrega la página Sobre mí")

1. Crea `src/pages/sobre-mi.astro` con `<Base active="sobre" title="…" description="…" canonical="https://wlaque.cl/sobre-mi/">`, con el title y la description textuales del `<head>` de `handoff/sobre-mi.html`. Sin JavaScript de cliente: todo sale de los datos.
   - Ojo en la línea de tiempo (educación y capacitaciones): un `li` lleva `class="cur"` cuando `/curso/i.test(x.when + x.note)`, igual que el prototipo; los demás van SIN atributo `class`.
   - La lista de chips del homelab es textual en el prototipo (`Docker`, `Pi-hole`, `restic`, `Tailscale`, `llama.cpp`, `Open WebUI`): cópiala tal cual.
   - El enlace a contacto va a `/contacto/`.

## Bloque B (commit: "agrega la página Contacto")

2. Crea `src/pages/contacto.astro` con `<Base active="contacto" …>` y el title/description textuales de `handoff/contacto.html`, canonical `https://wlaque.cl/contacto/`.
   - Lo que el script del prototipo rellena al cargar (`#li`, `#mail`, `#cal`, `#fp`, `#pgp`, `#resp`) se escribe directo en el HTML desde los datos.
   - Pasa al navegador solo lo que el script necesita, como en `src/components/Search.astro`:
     `<script type="application/json" id="contacto-data" set:html={JSON.stringify({ email: site.profile.email, timezone: site.contact.timezone, hours: site.contact.hours })} />`
   - Agrega un `<script>` normal con el resto de la lógica del prototipo COPIADA de `handoff/contacto.html`: el botón `#copy` (1400 ms de "Copiado"), el reloj de Santiago (`tick` cada 20000 ms) y el envío del formulario por `mailto:` con sus mensajes de estado y el botón Limpiar. Los valores de `P.email`, `C.timezone` y `C.hours` salen de `JSON.parse(document.getElementById('contacto-data').textContent)`. No inventes textos: los mensajes van textuales.

3. Relee `TAREAS.md` desde el disco y NO marques nada: estas páginas no estaban en la lista vieja; el revisor la actualiza.

Antes de terminar, verifícate con `pnpm build` y:
```bash
python3 revision/comparar.py main sobre-mi
python3 revision/comparar.py header.top sobre-mi
python3 revision/comparar.py main contacto
python3 revision/comparar.py header.top contacto
```
Todos tienen que imprimir `IDÉNTICO`, con UNA excepción esperada: en `main contacto`, el texto dentro de `#clock` depende de la hora del día y va a salir distinto. Esa diferencia se acepta; cualquier otra hay que corregirla.

Para cerrar, pega la salida de esos comandos, de `git status --short` (vacío) y de `git log --oneline -3`. Después detente.
