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
    if (url.pathname.endsWith('.mp4')) return porPartes(request, env);
    return env.ASSETS.fetch(request);
  },
};

// Videos con soporte de Range (2026-10-15, post del GameCube). Los assets estáticos de Workers devuelven
// siempre el archivo entero (200), y Safari en iPhone y Mac no reproduce un <video> si el servidor no
// responde 206 a "Range: bytes=0-1". Los videos del blog pesan pocos MB, así que se cortan en memoria.
async function porPartes(request, env) {
  const asset = await env.ASSETS.fetch(new Request(request, { method: 'GET' }));
  if (asset.status !== 200) return asset;
  const headers = new Headers(asset.headers);
  headers.set('Accept-Ranges', 'bytes');
  const sinCuerpo = request.method === 'HEAD';
  const m = /^bytes=(\d*)-(\d*)$/.exec((request.headers.get('Range') || '').trim());
  if (!m || (m[1] === '' && m[2] === '')) return new Response(sinCuerpo ? null : asset.body, { status: 200, headers });

  const cuerpo = await asset.arrayBuffer();
  const total = cuerpo.byteLength;
  // "bytes=-500" son los últimos 500; "bytes=500-" va del 500 al final
  const inicio = m[1] === '' ? Math.max(0, total - Number(m[2])) : Number(m[1]);
  const fin = m[1] === '' || m[2] === '' ? total - 1 : Math.min(Number(m[2]), total - 1);
  if (inicio > fin || inicio >= total) {
    headers.delete('Content-Length');
    headers.set('Content-Range', `bytes */${total}`);
    return new Response(null, { status: 416, headers });
  }
  headers.set('Content-Range', `bytes ${inicio}-${fin}/${total}`);
  headers.set('Content-Length', String(fin - inicio + 1));
  return new Response(sinCuerpo ? null : cuerpo.slice(inicio, fin + 1), { status: 206, headers });
}

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
