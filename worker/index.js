// Worker de wlaque.cl: todo el sitio son archivos estáticos (dist/), salvo POST /api/contacto,
// que recibe el formulario de Contacto, verifica Turnstile y manda el aviso al Gmail del dueño
// por Email Routing. Configuración en wrangler.jsonc; plan y pasos en PLAN-FORMULARIO.md.
//
// Secrets (panel de Cloudflare, nunca en el repo):
//   TURNSTILE_SECRET  clave secreta del widget de Turnstile
//   DESTINO           el Gmail del dueño, verificado como destination address en Email Routing
//
// Responde JSON si el formulario se envió con fetch (Accept: application/json). Sin JavaScript,
// el formulario hace un POST normal y la respuesta es una redirección a /contacto/?enviado=1 o ?error=<código>.

const SITEVERIFY = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
const LARGO = { nombre: 100, email: 200, mensaje: 5000 };
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/api/contacto') {
      if (request.method !== 'POST') return new Response('Método no permitido', { status: 405, headers: { Allow: 'POST' } });
      const quiereJson = (request.headers.get('Accept') || '').includes('application/json');
      const { estado, codigo } = await contacto(request, env);
      if (quiereJson) return Response.json({ ok: codigo === 'ok', codigo }, { status: estado });
      const destino = new URL('/contacto/', url);
      destino.searchParams.set(codigo === 'ok' ? 'enviado' : 'error', codigo === 'ok' ? '1' : codigo);
      return Response.redirect(destino.toString(), 303);
    }
    return env.ASSETS.fetch(request);
  },
};

// Devuelve { estado, codigo }: el estado HTTP y un código corto que el formulario traduce a un mensaje.
async function contacto(request, env) {
  if (!env.TURNSTILE_SECRET || !env.DESTINO || !env.CORREO) return { estado: 503, codigo: 'no-configurado' };

  let datos;
  try {
    datos = await request.formData();
  } catch {
    return { estado: 400, codigo: 'datos' };
  }
  const campo = (k) => String(datos.get(k) ?? '').trim();
  const nombre = campo('nombre').replace(/[\r\n]+/g, ' ');
  const email = campo('email');
  const mensaje = campo('mensaje');

  // Campo trampa: invisible para las personas, los bots lo llenan. Se responde "ok" para no darles pistas.
  if (campo('web')) return { estado: 200, codigo: 'ok' };

  if (!nombre || !email || !mensaje) return { estado: 400, codigo: 'campos' };
  if (!EMAIL.test(email) || /[\r\n]/.test(email)) return { estado: 400, codigo: 'email' };
  if (nombre.length > LARGO.nombre || email.length > LARGO.email || mensaje.length > LARGO.mensaje) return { estado: 400, codigo: 'largo' };

  const ip = request.headers.get('CF-Connecting-IP') || '';
  if (env.LIMITE) {
    const { success } = await env.LIMITE.limit({ key: ip || 'sin-ip' });
    if (!success) return { estado: 429, codigo: 'limite' };
  }

  const verificacion = new FormData();
  verificacion.append('secret', env.TURNSTILE_SECRET);
  verificacion.append('response', campo('cf-turnstile-response'));
  if (ip) verificacion.append('remoteip', ip);
  try {
    const r = await (await fetch(SITEVERIFY, { method: 'POST', body: verificacion })).json();
    if (!r.success) return { estado: 400, codigo: 'captcha' };
  } catch {
    return { estado: 502, codigo: 'captcha' };
  }

  try {
    await env.CORREO.send({
      to: env.DESTINO,
      from: { email: env.REMITENTE, name: 'Formulario wlaque.cl' },
      replyTo: { email, name: nombre },
      subject: `Contacto desde wlaque.cl: ${nombre}`,
      text: `${mensaje}\n\n— ${nombre} <${email}>\n\nEnviado desde el formulario de https://wlaque.cl/contacto/. Responde a este correo para contestarle directo.`,
    });
  } catch (e) {
    console.error('No se pudo enviar el correo:', e.code, e.message);
    return { estado: 502, codigo: 'envio' };
  }
  return { estado: 200, codigo: 'ok' };
}
