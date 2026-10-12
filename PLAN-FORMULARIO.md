# Formulario de contacto: guía para activarlo

Estado (2026-10-12): **activo y probado en el preview.** El aviso llega a Gmail y responder le contesta al visitante. Esta guía queda para rehacerlo (por ejemplo, si cambian las claves) y para diagnosticar fallas: ver las trampas del panel al final del paso 4 y la tabla del paso 7.

## Qué hace

```
visitante → formulario (con Turnstile) → POST /api/contacto
          → Worker: valida campos, campo trampa, límite por IP y el captcha
          → manda el aviso a tu Gmail por Email Routing
          → responde "enviado" en la barra de estado de la ventana
```

- El aviso llega desde `formulario@wlaque.cl`, con el asunto `Contacto desde wlaque.cl: <nombre>` y con *Reply-To* del visitante: respondes desde Gmail y le contestas a él directo.
- **Tu Gmail no está en el sitio ni en el repo**: es un *secret* del Worker (`DESTINO`). La clave secreta del captcha también (`TURNSTILE_SECRET`).
- **Nada pasa por el hosting anterior del dominio**: Email Routing reemplaza los MX del dominio. La casilla vieja `contacto@wlaque.cl` deja de recibir; si quieres, esa dirección pasa a ser un reenvío a tu Gmail (paso 2).
- Captcha: **Turnstile de Cloudflare** (decidido por el dueño el 2026-09-30). Gratis, casi siempre invisible, sin mandarle datos de los visitantes a Google.
- Protecciones extra: un campo trampa invisible (los bots lo llenan y se descarta), largos máximos, validación del email en el Worker y **3 envíos por minuto por IP**.
- Sin JavaScript también funciona: el POST normal vuelve a `/contacto/?enviado=1` o `?error=<código>`.

## Pasos del dueño, en <https://dash.cloudflare.com> (unos 15 minutos)

**1. La casilla vieja.** Si `contacto@wlaque.cl` tiene algo que quieras guardar, descárgalo antes: después del paso 2 deja de recibir.

**2. Email Routing.**
1. Entra al dominio `wlaque.cl` → **Email** → **Email Routing** → **Get started** (o **Enable**).
2. Cloudflare va a avisar que ya hay registros MX y SPF (los del hosting anterior) y ofrece borrarlos y poner los suyos: **acepta**. Esto solo toca el correo; el sitio no cambia.
3. **Destination addresses** → **Add destination address** → tu Gmail. Te llega un correo de verificación: ábrelo y confirma. Sin esto, el Worker no puede mandarte nada.
4. (Opcional) **Routing rules** → **Create address** → `contacto` → acción **Send to an email** → tu Gmail. Así, quien escriba a `contacto@wlaque.cl` (por ejemplo desde el `mailto:` de hoy) te llega a ti.

**3. Turnstile.**
1. En la cuenta (no en el dominio) → **Turnstile** → **Add widget**.
2. Nombre: `wlaque.cl`. Hostnames: `wlaque.cl` y `wlaque.w-aqueveque.workers.dev`. Modo: **Managed**. Pre-clearance: no.
3. Te muestra dos claves. La **Site key** es pública: pásamela, o déjala tú en `src/data/formulario.json` (paso 6). La **Secret key** es privada: va solo al paso 4.

**4. Los secrets del Worker.** **Workers & Pages** → `wlaque` → **Settings** → **Runtime variables and secrets** (la sección de arriba de todo; **no** la caja *Variables and secrets* dentro de *Build*, que el Worker no ve) → **Add variable**, dos veces, siempre con **Type: Secret** (no *Text*: las de texto las borra el próximo despliegue):

| Variable name | Value |
|---|---|
| `TURNSTILE_SECRET` | la Secret key del paso 3 |
| `DESTINO` | tu Gmail, el mismo que verificaste en el paso 2 |

Trampas del panel (2026-10-12):
- Si la sección dice *"Variables cannot be added to a Worker that only has static assets"*, el Worker publicado todavía no tiene el código del formulario: primero se publica `main` con `wrangler.jsonc` y después se recarga la pestaña.
- Comprobación de que estás en la sección correcta: ahí aparece `REMITENTE` (la pone `wrangler.jsonc`) y, en *Bindings*, `CORREO` y `LIMITE`.
- Copiar las claves de Turnstile **con el botón de copiar**, no seleccionando el texto: una sola letra cambiada da el error 400020.

**5. Revisar los comandos del build.** **Workers & Pages** → `wlaque` → **Settings** → **Build**: *Build command* `pnpm build` y *Deploy command* `npx wrangler deploy`. Si dicen otra cosa, cámbialos a esos. Desde la rama `formulario` el repo trae su propio `wrangler.jsonc` (nombre `wlaque`, assets en `dist/`), y `wrangler` va como dependencia del proyecto.

## Paso 6: unir la rama (Claude, o tú desde GitHub)

- **Con Claude:** pásale la Site key y dile que una la rama `formulario`. Pone la clave en `src/data/formulario.json`, une a `main` y sube; Cloudflare despliega solo.
- **Tú, desde el navegador:** en GitHub, en la rama `formulario`, edita `src/data/formulario.json` y reemplaza `turnstileSitekey` (hoy dice la de prueba, `1x00000000000000000000AA`) por tu Site key. Después abre un *pull request* de `formulario` a `main` y únelo.

**Importante:** no unas la rama antes de terminar el paso 2. El `wrangler.jsonc` pide el permiso para mandar correos (`send_email`), y sin Email Routing activo el despliegue puede fallar. Si falla, el sitio no se cae (queda la versión anterior), pero el formulario no se activa. Por lo mismo, si en el panel aparece un build fallido de la rama `formulario` antes del paso 2, ignóralo: no toca el sitio.

## Paso 7: probarlo en el preview

1. Abre `https://wlaque.w-aqueveque.workers.dev/contacto/`. El widget de Cloudflare tiene que verse sin el aviso rojo "Solo para pruebas".
2. Envía un mensaje con un email tuyo distinto del Gmail. Tiene que aparecer "Mensaje enviado" y llegarte a Gmail en segundos.
3. Responde ese correo desde Gmail: la respuesta tiene que ir a la dirección que pusiste en el formulario (eso confirma el *Reply-To*, que en local no se pudo ver).
4. Si algo falla, el mensaje de la ventana dice qué:

| Mensaje en la ventana | Qué revisar |
|---|---|
| "El formulario todavía no está activo" | Faltan los secrets del paso 4 |
| "No se pudo verificar que no eres un bot" | La Site key del paso 6 no corresponde a la Secret key del paso 4, o falta el hostname en el widget (paso 3) |
| "No se pudo enviar" | `DESTINO` no está verificado en Email Routing (paso 2.3). El detalle queda en **Workers** → `wlaque` → **Logs** |
| El widget no aparece, solo un link "Troubleshoot" | La Site key de `src/data/formulario.json` no existe (error 400020, mal copiada). Si el error fuera 110200, falta el hostname en el widget |
| `curl` a `/api/contacto` responde `{"codigo":"no-configurado"}` | Los secrets quedaron en la caja de *Build* o como *Text*: van en **Runtime variables and secrets** como *Secret* |

## Lo que ya está hecho y probado (Claude, 2026-09-30)

- `wrangler.jsonc` y `worker/index.js` en la rama `formulario`; `npx wrangler deploy --dry-run` valida la config.
- Probado en local con `npx wrangler dev` y las claves de prueba de Turnstile: los archivos estáticos se sirven igual (y `/no-existe/` sigue dando 404), `GET /api/contacto` da 405, campos vacíos, email malo, campo trampa, envío válido (el correo simulado sale con remitente, destino y asunto correctos), POST sin JavaScript (303 a `?enviado=1`), el límite de 3 por minuto y el captcha rechazado.
- `revision/probar-formulario.mjs`: prueba el formulario en Chromium contra `wrangler dev` (widget real de Turnstile en modo de prueba). Para correrlo: un `.dev.vars` con `TURNSTILE_SECRET=1x0000000000000000000000000000000AA` y `DESTINO=prueba@example.com` (está en `.gitignore`), `pnpm build`, `npx wrangler dev --port 8787 --ip 127.0.0.1` y `node revision/probar-formulario.mjs`.
- `pnpm-workspace.yaml` aprueba el script de instalación de `workerd` (lo necesita `wrangler`). Sin esa línea, pnpm 12 corta la instalación, también en el build de Cloudflare.
