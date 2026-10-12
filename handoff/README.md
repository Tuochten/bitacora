# Handoff: wlaque.cl — sitio completo (versión B "Bitácora")

**Versión:** 2.1.0 · **Fecha:** 2026-09-29 · **Reemplaza a:** v2.0.0
**Alcance:** solo la versión final. Siete vistas: Home, Blog (entradas y proyectos), Entrada, Entrada de proyecto, Desarrollo web, Sobre mí y Contacto.

## Qué cambió respecto a v2.0.0
1. **Los proyectos ahora son entradas del blog.**
   - Cada entrada tiene `type: "entrada" | "proyecto"` y conserva su tema (`category`).
   - Los proyectos llevan además `project: { state, since, stack, kind }` y `body[]` (párrafos del resumen).
   - Se eliminaron `2. **Blog: filtro por tipo** (`.types`): Todo · Entradas · Proyectos, con contador.
   - Se combina con el filtro por tema y con la paginación.
   - Rutas en producción:
     - `/blog/proyectos/` y `/blog/entradas/`
     - Con tema: `/blog/proyectos/tema/homelab/`
     - Con página: `/blog/proyectos/tema/homelab/2/`
   - En la fila, los proyectos muestran la etiqueta `.kind` "Proyecto · estado".
3. **Entrada de proyecto** (`post.html?slug=homelab-proxmox`):
   - Miga: Inicio › Blog › Proyectos › título.
   - Línea de categorías: "Proyecto · Tema".
   - Barra lateral con la ficha extra "Proyecto" (Estado, Desde, Tipo, Stack), antes de Detalles.
   - En Detalles, la fecha se llama "Actualizado".
   - La portada sin imagen muestra `~/proyectos/`.
   - El cuerpo es el `description` como lead, más h2 "01 Resumen" y los párrafos de `body[]`.
   - **Fecha de un proyecto:** es la de su última actualización, y así se ordena junto con las entradas.
4. **Home:**
   - "Entradas recientes" muestra solo `type: "entrada"`.
   - "Proyectos" muestra las 4 entradas de tipo proyecto más recientes (tarjeta `.unit`, que enlaza a la entrada).
   - "Ver todos" lleva a `/blog/proyectos/`.
5. **Menú de 5 ítems:** Inicio · Blog · Desarrollo web · Sobre mí · Contacto.
6. **Sobre mí**, rehecha a todo el ancho con datos del CV:
   - Texto del CV literal.
   - "Ahora mismo" y "Idiomas".
   - "En curso": Ingeniería USS y Security+.
   - Formación y capacitaciones en línea de tiempo.
   - Herramientas en 5 grupos, más Atributos y Homelab.
   - Llamado a Contacto.
7. **Contacto**, ahora en su propia página (`contacto.html` → `/contacto/`):
   - Formulario ancho.
   - Barra lateral con LinkedIn, email con botón Copiar, agenda para una llamada de 20 min, hora local de Santiago con estado de horario, y clave PGP.
8. **Datos corregidos desde el CV:** email, LinkedIn, "Ahora mismo", habilidades de la home, y los textos de los proyectos Homelab y Laboratorio de pentesting.

**Marcadores a completar:**
- `contact.calendar` (URL de Cal.com)
- `contact.pgp.fingerprint` y `contact.pgp.href`
- GitHub (`href:"#"`)

## Sobre los archivos
Son **referencias de diseño en HTML**: prototipos que muestran aspecto y comportamiento, no código de producción. La tarea es recrearlos en Astro con sus patrones.

- HTML + CSS + JS puro, **sin React ni dependencias**.
- **Nombres de clase idénticos entre HTML, JS y CSS.** Los CSS se copian tal cual.
- `bitacora.css` sigue siendo el sistema compartido y **no cambió respecto a v1**. `prosa.css` y `home.css` tampoco cambiaron.
- Todo lo nuevo está en **`interior.css`**, que no redefine ninguna clase existente: solo agrega clases nuevas y un par de selectores nuevos sobre elementos que antes no existían (por ejemplo, `.filters a`, además del `.filters button` de v1).
- Todos los datos están en `data/site.json`.
- **Para verlo**, sirve la carpeta por HTTP: `python3 -m http.server` y abre `http://localhost:8000`. Con `file://`, el `fetch` del JSON falla.

**Fidelidad:** alta. Las imágenes (miniaturas, portadas) son marcadores con trama diagonal.

## Archivos
```
index.html            Home
blog.html             Listado del blog  (?tema=…&pagina=…)
post.html             Entrada           (?slug=…)
proyectos.html        Listado de proyectos
desarrollo-web.html   Servicios freelance
sobre-mi.html         Sobre mí
contacto.html         Contacto
bitacora.css          Sistema compartido (sin cambios desde v1)
prosa.css             Lectura larga (sin cambios desde v1)
home.css              Solo home (sin cambios desde v1)
interior.css          NUEVO: paginación, filtro con enlaces, portada sin imagen, ventana de formulario, sobre mí, desarrollo web
js/site.js            Cabecera, pie, buscador, renderizadores y utilidades (shortTitle, pages, fmtDate…)
data/site.json        Todos los datos
content/blog/migrar-ordenes-woocommerce.md   Post completo en Markdown
```

## Rutas: prototipo → producción
- `index.html` → `/`
- `blog.html` → `/blog/`
- `blog.html?pagina=2` → `/blog/2/`
- `blog.html?tema=Homelab` → `/blog/tema/homelab/`
- `blog.html?tema=Homelab&pagina=2` → `/blog/tema/homelab/2/`
- `post.html?slug=X` → `/blog/X/`
- `proyectos.html` → `/proyectos/`
- `proyecto.html?slug=X` → `/proyectos/X/`
- `desarrollo-web.html` → `/desarrollo-web/`
- `sobre-mi.html` → `/sobre-mi/`
- `sobre-mi.html#contacto` → `/sobre-mi/#contacto`

La página 1 nunca lleva número (`/blog/`, no `/blog/1/`). Los temas van en minúscula y sin acentos en la URL.

---

## Cambios en `data/site.json` respecto a v1
- **`settings`** (nuevo): `postsPerPage: 8`, `homeRecent: 5`, `shortTitleMax: 42`.
- **`nav`**:
  - Tiene 6 ítems; se agregó **Desarrollo web**.
  - Los `href` ahora apuntan a archivos reales.
  - "Contacto" apunta a `sobre-mi.html#contacto`.
- **`posts[]`**:
  - Campos nuevos: `shortTitle` (opcional), `cover` (ruta o `null`), `tags[]` y `sample`.
  - Se quitó `dateLabel`: la fecha legible ahora se calcula.
  - El slug del destacado pasó a `migrar-ordenes-woocommerce`.
  - Hay 19 entradas: 6 reales y **13 de maqueta con `sample: true`**, solo para mostrar la paginación. Hay que borrarlas en producción.
- **`projects[]`**: campos nuevos `kind` y `summary[]` (párrafos del resumen). El slug `wladi-v2` pasó a `wlaque-v2`. El texto de los proyectos es provisional.
- **`profile.email`** (nuevo): `hola@wlaque.cl`. **Es un marcador: hay que confirmar la dirección real.**
- **`profile.freelance.href`**: `desarrollo-web.html`.
- **`webdev`** (nuevo): `lede`, `services[]`, `steps[]`, `included[]` y `response`.

---

## Vistas nuevas

### Listado del blog (`blog.html`)
- **Cabecera:** `.phead` con miga de pan, h1 `.cursor` "Blog" y `.lede`. Cuando hay un tema activo, la miga pasa a Inicio › Blog › Tema.
- **Columna principal:**
  - `.sec`, con el título "Todas las entradas" o "Tema: X" y el contador "N entradas · página P de T".
  - `.log`, con las `.row` de la página actual ordenadas por fecha descendente, incluida la destacada.
  - **`.pages`** (paginación numerada), definida en interior.css.
- **Barra lateral:**
  - "Filtrar por tema": `.filters` como **`<nav>` de enlaces**, no botones, porque cada tema tiene su propia URL indexable. Cada enlace muestra el total de su categoría en `.n`. El activo lleva `aria-current="page"`.
  - Enlace a RSS.
  - `.guard` (el guardián).
- **Paginación (`Site.pages`):**
  - Muestra ← Anterior, 1 … (P−1) P (P+1) … T, Siguiente →.
  - Los extremos sin destino se muestran como `.dis` con `aria-disabled`.
  - La página actual es un `<span aria-current="page">` sobre fondo oro.
  - Los enlaces llevan `rel="prev"` y `rel="next"`.
  - Con una sola página no se muestra nada.
  - En pantallas de 480px o menos, Anterior y Siguiente ocupan una fila propia arriba.
- **Filtro + paginación:** el filtro reinicia a la página 1. La paginación conserva el tema.
- **Estado vacío:** `.empty` con el Ongoro.

### Entrada (`post.html`), con datos reales
- **Datos:** se toman del post cuyo `slug` coincide. Sin slug, se usa el destacado.
- **Miga de pan:** Inicio › Blog › **título corto**.
  - Si existe `shortTitle`, se usa tal cual.
  - Si no, el título se corta en el primer `": "`, `" ("` o `" — "`.
  - Si todavía pasa de `shortTitleMax` (42), se corta en el último espacio antes del carácter 42, se quita la puntuación final y se agrega "…".
  - Ejemplos: `dns-fail` queda "DNS, Hosting y todo lo que falla en…"; `astro` queda "Por qué reconstruí este blog en Astro".
  - Recomendación: definir `shortTitle` en el frontmatter cuando el título pase de ~40 caracteres.
- **Portada:**
  - Con `cover`, se muestra `.cover` (16:7, ancho completo).
  - **Sin `cover`, se muestra `.cover-term`**: bloque de terminal con scanlines, la categoría arriba a la derecha (`.cat` con su color), la ruta `~/blog/<categoría>/` en `.p` y el título corto grande en `.t` con cursor parpadeante. Mide al menos 230px de alto (170px en móvil).
  - Ejemplo: `post.html?slug=dns-fail`.
- **Paginador (`.pager`):** se calcula **por fecha** sobre todas las entradas ordenadas de más nueva a más antigua.
  - "← Anterior" es la entrada inmediatamente **más antigua**.
  - "Siguiente →" es la inmediatamente **más nueva**.
  - Si falta una de las dos, su celda queda como `.pager-x`: vacía y con el mismo fondo.
- **Relacionadas:** hasta 2 entradas de la misma categoría, por fecha. Si no alcanzan, se completan con las más recientes.
- **Detalles:** fecha legible calculada con `fmtDate` ("14 ene 2025"). El tema enlaza a `/blog/tema/<tema>/`.
- **Compartir:** URLs reales de LinkedIn y X construidas con el canonical.
- **Índice:** se genera desde los h2. Si no hay h2, se oculta el bloque.
- **Cuerpo:** en el prototipo solo el destacado tiene cuerpo, dentro de un `<template id="body-<slug>">`. Los demás muestran la descripción y una nota "Prototipo". En producción, el cuerpo sale del Markdown.

### Proyectos (`proyectos.html`)
- **Cabecera:** `.phead` con h1 "Proyectos" y el lede "Cosas que mantengo, no cosas que terminé."
- **Lista:** `.units` en 2 columnas (1 columna en 620px o menos) con todas las tarjetas `.unit`.
- **Filtro por estado:** en la barra lateral, con botones (`.filters button`, igual que en la home) y el conteo entre paréntesis. Funciona en el cliente y no tiene URL, porque son pocos proyectos.

### Detalle de proyecto (`proyecto.html`)
- **Cabecera:** miga de pan (Inicio › Proyectos › nombre), `.unit-state` (estado · años) y h1. El lede es la `description`.
- **Cuerpo:** solo la sección **Resumen**: los párrafos de `summary[]` dentro de `.prose`.
- **Barra lateral fija:**
  - Ficha (`dl.facts`): Estado, Desde y Tipo.
  - Stack: la cadena `stack` separada por " · "; los 2 primeros se marcan como `pri`.
  - Otros proyectos.

### Desarrollo web (`desarrollo-web.html`), nueva
- **Cabecera:** `.phead` con el h1 "Desarrollo web" y `webdev.lede`.
- **Qué hago:** `.units.three` con 3 tarjetas `div.unit` (no son enlaces, así que no tienen hover).
  - Webflow y Shopify van marcadas como "principal".
  - WordPress va como "secundario", con el punto en oro (`.unit-state.w`).
  - Pasan a 1 columna en 900px o menos.
- **Cómo trabajo:** `.steps`, 4 pasos numerados 01–04. Van en 4 columnas; 2 en 900px o menos y 1 en 520px o menos.
- **Incluido en todos los proyectos:** `.incl`, lista con ✓ en 2 columnas.
- **Lo he escrito:** las 3 entradas más recientes de Webflow o Dev.
- **`.cta`:** "¿Tienes un proyecto?" y el botón `.btn` "Contáctame →", que lleva a `/sobre-mi/#contacto`.
- **Barra lateral fija:**
  - `.stat` "+150" y `.stat-l`.
  - Plataformas (WordPress al final y sin marcar).
  - Detalles: tiempo de respuesta y contacto.
- **Datos estructurados:** JSON-LD `ProfessionalService`.
- **Home:** la ficha freelance ahora enlaza a esta página. Su texto sigue siendo "Contáctame →".

### Sobre mí + contacto (`sobre-mi.html`)
- **Cabecera:** `.intro` con avatar de 132px (96px en móvil), h1 y el rol.
- **Cuerpo:** bio (`.lead`), la línea freelance, "Ahora mismo" (`.now`), "Habilidades" (`.skills`) y la sección `#contacto`.
- **Formulario (`.win`)**, una ventana de escritorio de los 2000:
  - Barra de título `.win-bar` con "×" decorativo.
  - Bordes biselados de 1px: claros arriba e izquierda, oscuros abajo y derecha.
  - **Campos:** Nombre, Email y Mensaje. Solo esos tres, todos obligatorios.
    - Etiquetas `.fld` en mayúsculas.
    - Inputs hundidos, de 16px para evitar el zoom en iOS.
  - Pie `.win-foot` con `.win-status` (`role="status"`) y los botones `.btn3d` "Limpiar" y "Enviar" (`.pri`). Al presionarlos, el bisel se invierte.
  - **Envío por `mailto:`:** valida los campos y abre el cliente de correo con:
    - asunto `Contacto desde wlaque.cl — {nombre}`
    - cuerpo `{mensaje}\n\n— {nombre} <{email}>`
  - **Estados de `.win-status`:**
    - Normal: "Se abrirá tu programa de correo."
    - Error (`.bad`, en óxido): "Completa los tres campos." o "Revisa el email."; los campos inválidos llevan `aria-invalid` con outline óxido.
    - Enviado (`.ok`, en verde): "Se abrió tu correo…"
  - "Limpiar" vacía los campos y restablece los estados.
  - En 560px o menos, los botones ocupan la mitad del ancho cada uno.
- **"O escríbeme directo":** botones `.share` con el email (mailto), GitHub y LinkedIn.
- **Barra lateral:** redes, RSS y estado freelance.
- **Menú:** marca "Contacto" como activo cuando la URL tiene `#contacto` y "Sobre mí" en el resto de los casos, y se actualiza al cambiar el hash.

## Cabecera (cambio)
El menú tiene 6 ítems. A 1101–1180px se compacta con la regla de v1. En 1100px o menos colapsa a "Menú", como antes.

---

## Números: fijos vs. calculados
**Fijos** (escritos en el JSON o en el contenido):
- "+150 proyectos web"
- "13 años" (dentro de la bio)
- `readingTime` (se recomienda calcularlo a ~200 palabras/min)
- Estado, años y tipo de cada proyecto
- `postsPerPage` = 8, `homeRecent` = 5, `shortTitleMax` = 42
- "1–2 días hábiles"
- "340 órdenes" y "10 minutos" (dentro del post)

**Calculados:**
- **Blog:**
  - Total de entradas del listado y de cada tema.
  - Número de páginas: `ceil(total / 8)`.
  - Página actual y ventana de números de la paginación.
  - Etiqueta "Tema: X" y título del documento.
- **Entradas:**
  - Orden por fecha en todo el sitio (home, blog, relacionadas, buscador).
  - Entrada anterior y siguiente del paginador.
  - Relacionadas.
  - Título corto (cuando falta `shortTitle`).
  - Fecha legible ("14 ene 2025").
  - URLs de compartir.
  - Índice y sección activa.
  - Barra de lectura.
- **Proyectos:** conteo por estado; lista de "Otros proyectos".
- **Desarrollo web:** numeración 01–04 de los pasos; entradas de "Lo he escrito".
- **General:**
  - Destacado: primer post con `featured: true`.
  - Año del pie.
  - Atajo ⌘K / Ctrl K según la plataforma.

## Contenido
- El post completo está en `content/blog/migrar-ordenes-woocommerce.md`, con bloques de código y callouts `> [!WARNING]` / `> [!TIP]`. En el HTML equivalen a `.note.warn` y `.note`.
- Los textos de bio y rol son del autor y van **literales**.
- Los textos de los servicios, los pasos, los resúmenes de proyecto y las 13 entradas de maqueta son provisionales.

## Pendiente fuera de este handoff
- `og.png`, `sitemap.xml` y `rss.xml`.
- Email de contacto real.
- Imágenes de miniaturas y portadas, que van en `.th`, `.pin-th` y `.cover` con `object-fit: cover`.
- Casos o capturas de clientes para Desarrollo web.

## Capturas (`screenshots/`)
El layout se calculó a 1440px y a 390px. Las de 1440 están reducidas a ~909px en la imagen. Cada vista se divide en tramos numerados de arriba abajo.
- **`1440/` y `390/`:** home, blog, post, post-sin-portada, post-proyecto, desarrollo-web, sobre-mi y contacto.
- **`estados/`:**
  1. Filtro de tipo: Proyectos
  2. Filtro de tema: Homelab
  3. Página 2 con hover de fila
  4. Hover de tarjeta de proyecto en la home
  5. Índice activo
  6. Formulario con error
  7. Menú móvil

En las capturas no se ve el texto escrito dentro de los campos, por una limitación de la herramienta de captura.

---
> Nota: desde "Sobre los archivos" en adelante, el texto viene de v2.0.0. Donde algo contradiga la sección "Qué cambió respecto a v2.0.0", manda esa sección. Por ejemplo: ya no existen Proyectos ni Detalle de proyecto, y el formulario de contacto pasó de `sobre-mi.html#contacto` a `contacto.html`.
