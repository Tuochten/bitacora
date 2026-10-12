# Publicar wlaque.cl

El sitio se publica con **Cloudflare conectado a GitHub**: cada `git push` a `main` construye y publica solo. Al crearlo (2026-09-30), Cloudflare lo armó como **Worker con archivos estáticos**, no como Pages: el preview es `https://wlaque.w-aqueveque.workers.dev`. Para el sitio da lo mismo, y el Worker permite el formulario de contacto (`PLAN-FORMULARIO.md`). El dominio `wlaque.cl` ya está en Cloudflare (sus nameservers son de Cloudflare), así que no hay que tocar NIC Chile. Todo se hace desde el navegador; en el Mac no hay que instalar nada para publicar.

## Antes de apuntar el dominio

**Publicado en `wlaque.cl` desde el 2026-10-12.** El proyecto ya está creado y el preview funciona (pasos 1 y 2, hechos por el dueño el 2026-09-30); el dominio se conecta recién cuando esto esté completo:

- [x] Listado del blog, páginas de entrada, RSS y sitemap (hecho el 2026-09-29).
- [x] Contenido real: 4 entradas (2026-09-30). Los textos de los 4 proyectos siguen siendo provisionales.
- [x] Entradas de maqueta fuera (2026-09-30).
- [x] Contacto sin Gmail, sin llamada (Cal.com) y sin clave PGP (2026-09-30).
- [x] Formulario que envía el correo solo, con Turnstile: activo y probado el 2026-10-12.
- [x] Link de GitHub (2026-10-12).
- [x] Portadas de las entradas (2026-09-30).
- [x] `og.png` (2026-10-12).

## Paso 1 · Crear el proyecto (una sola vez) — hecho el 2026-09-30

Quedó como Worker (`wlaque.w-aqueveque.workers.dev`), no como Pages. Los pasos de abajo son los que se siguieron; si hubiera que rehacerlo, hoy el camino es **Workers & Pages** → **Create** → **Import a repository**, con *Build command* `pnpm build` y *Deploy command* `npx wrangler deploy`.

1. Entra a <https://dash.cloudflare.com> con la cuenta donde está `wlaque.cl`.
2. **Workers & Pages** → **Create** → pestaña **Pages** → **Connect to Git**.
3. Autoriza GitHub con la cuenta **Tuochten**. Cuando pregunte a qué repos dar acceso, elige **solo** `wlaque.cl`.
4. Elige el repo `wlaque.cl` y configura el build:

   | Campo | Valor |
   |---|---|
   | Project name | `wlaque` (define la URL de vista previa: `wlaque.pages.dev`) |
   | Production branch | `main` |
   | Framework preset | `Astro` |
   | Build command | `pnpm build` |
   | Build output directory | `dist` |

5. En **Environment variables** agrega `PNPM_VERSION` = `12.5.1`. Node no hace falta: lo toma del archivo `.node-version` del repo (24).
6. **Save and Deploy**. El primer build toma un par de minutos.

## Paso 2 · Revisar la vista previa

Abre `https://wlaque.w-aqueveque.workers.dev`. Tiene que verse igual que en local: home, blog, entradas, Desarrollo web, Sobre mí y Contacto.

La URL `*.workers.dev` es pública, pero nadie la conoce mientras no la compartas.

## Paso 2b · Activar el formulario de contacto

Hecho el 2026-10-12: Email Routing, Turnstile, los dos secrets y la rama `formulario` unida a `main`. Detalle y solución de problemas en `PLAN-FORMULARIO.md`.

## Paso 3 · Conectar el dominio con rutas — hecho el 2026-10-12

Una subcarpeta de `wlaque.cl` sigue sirviéndose desde el hosting anterior del dominio, detrás del proxy de Cloudflare. Por eso **no se usa "Custom domain"** (se quedaría con todo el dominio) sino **rutas**: una que manda `wlaque.cl/*` al Worker y otra **sin Worker** para `wlaque.cl/<subcarpeta>*`, que la anula y deja pasar esas visitas al hosting (la ruta más específica gana; documentado en "Workers → Routes → Matching behavior").

**No se toca el DNS:** el registro `A` de `wlaque.cl` (nube naranja) se queda como está; sin él la ruta no recibe tráfico y la subcarpeta muere.

1. Dominio `wlaque.cl` → **Workers Routes** → **Add route**: `wlaque.cl/<subcarpeta>*`, Worker **None**. *Primero esta*, para que la subcarpeta nunca quede sin excepción.
2. **Add route** otra vez: `wlaque.cl/*`, Worker **wlaque**.
3. `www`: **Rules** → **Redirect Rules** → plantilla *Redirect from WWW to root* (301, con *Preserve query string*). Si el panel avisa que `www` no pasa por el proxy pero resuelve a IPs de Cloudflare, es falsa alarma: *Ignore and deploy rule anyway*.
4. Revisar: `/`, `/blog/`, `/contacto/` (el widget de Turnstile ya acepta `wlaque.cl`), la subcarpeta y `www`.

Las rutas viven en el panel, no en `wrangler.jsonc`: si algún día se agrega `routes` al archivo, Wrangler reemplaza las del panel en cada despliegue y además apaga `workers.dev` (salvo `workers_dev: true`). La ruta sin Worker es de la zona y Wrangler no la toca.

## Publicar cambios después

Cualquier `git push` a `main` publica, desde el desktop o desde el Mac. Cualquier otra rama genera su propia URL de vista previa, útil para revisar antes de mezclar.

## Trabajar el código desde el Mac

```bash
git clone https://github.com/Tuochten/bitacora.git
cd bitacora
corepack enable            # trae pnpm (viene con Node)
pnpm install
pnpm dev                   # http://localhost:4321
```

Requiere Node 22.12 o más nuevo (`brew install node` si no está). El flujo con el modelo local (OpenCode) solo corre en el desktop; ver `revision/README.md`. El contexto completo del proyecto está en `BITACORA.md`.

## Si algo falla

| Síntoma | Qué revisar |
|---|---|
| El build falla en la instalación | Que `PNPM_VERSION` esté en `12.5.1` (Paso 1.5) |
| El build falla con un error de Astro | Correr `pnpm build` en local: si falla ahí también, es del código, no de Cloudflare |
| El dominio no conecta | Que existan las dos rutas del paso 3 y que el registro `A` de `wlaque.cl` siga con la nube naranja |
| El formulario no envía | La tabla del paso 7 de `PLAN-FORMULARIO.md` |
