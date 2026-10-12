// Uso: node revision/probar-formulario.mjs [url de /contacto/]   (por defecto http://127.0.0.1:8787/contacto/)
// Prueba el formulario de Contacto en Chromium (CDP) contra `npx wrangler dev`, que sirve dist/ y el Worker.
// Para que el captcha pase, wrangler dev tiene que correr con la clave de prueba de Turnstile en .dev.vars
// (TURNSTILE_SECRET=1x0000000000000000000000000000000AA) y el sitio compilado con la site key de prueba,
// que es la de src/data/formulario.json mientras no esté la real. Ver PLAN-FORMULARIO.md.
// Ojo: el Worker deja 3 envíos por minuto por IP; si se corre dos veces seguidas, el segundo envío da "limite".
import { spawn } from 'node:child_process';
import { rmSync } from 'node:fs';

const url = process.argv[2] || 'http://127.0.0.1:8787/contacto/';
const PUERTO = 9335, PERFIL = '/tmp/wladi-cdp-formulario';
rmSync(PERFIL, { recursive: true, force: true });
const chrome = spawn('chromium', ['--headless=new', '--disable-gpu', `--remote-debugging-port=${PUERTO}`, '--remote-allow-origins=*',
  `--user-data-dir=${PERFIL}`, '--window-size=1290,900', 'about:blank'], { stdio: 'ignore' });
const dormir = (ms) => new Promise((r) => setTimeout(r, ms));
try {
  let pag;
  for (let i = 0; i < 50 && !pag; i++) {
    try { pag = (await (await fetch(`http://127.0.0.1:${PUERTO}/json/list`)).json()).find((t) => t.type === 'page'); } catch {}
    if (!pag) await dormir(200);
  }
  const ws = new WebSocket(pag.webSocketDebuggerUrl);
  await new Promise((r) => ws.addEventListener('open', r, { once: true }));
  let n = 0; const p = new Map();
  ws.addEventListener('message', (e) => { const m = JSON.parse(e.data); if (p.has(m.id)) { p.get(m.id)(m); p.delete(m.id); } });
  const cdp = (method, params = {}) => new Promise((r) => { const id = ++n; p.set(id, r); ws.send(JSON.stringify({ id, method, params })); });
  const ev = async (expr) => (await cdp('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true })).result?.result?.value;
  const estado = () => ev(`document.getElementById('status').className + ' | ' + document.getElementById('status').textContent`);
  const esperar = async (cond, ms = 10000) => { for (let t = 0; t < ms; t += 200) { if (await ev(cond)) return true; await dormir(200); } return false; };
  const enviar = () => ev(`document.getElementById('enviar').click()`);

  await cdp('Page.navigate', { url }); await dormir(1500);
  console.log('carga                 ', await estado());
  console.log('gmail en la página    ', await ev(`document.documentElement.outerHTML.includes('gmail') ? 'SÍ (mal)' : 'no'`));
  console.log('captcha resuelto      ', await esperar(`!!new FormData(document.getElementById('form')).get('cf-turnstile-response')`) ? 'sí' : 'NO (¿sin red?)');

  await enviar(); await dormir(300);
  console.log('enviar vacío          ', await estado());

  await ev(`(() => { const f = document.getElementById('form'); f.nombre.value = 'Ana Pérez'; f.email.value = 'ana@'; f.mensaje.value = 'Hola'; })()`);
  await enviar(); await dormir(300);
  console.log('email incompleto      ', await estado());

  await ev(`document.getElementById('form').email.value = 'ana@example.com'`);
  await enviar();
  await esperar(`!document.getElementById('enviar').disabled && document.getElementById('status').textContent !== 'Enviando…'`);
  console.log('envío válido          ', await estado());
  console.log('campos tras enviar    ', await ev(`[...document.querySelectorAll('.fld input,.fld textarea')].map((f) => f.value || '(vacío)').join(' / ')`));

  await cdp('Page.navigate', { url: url + '?error=limite' }); await dormir(800);
  console.log('vuelta sin JS, error  ', await estado());
  ws.close();
} finally {
  chrome.kill();
}
