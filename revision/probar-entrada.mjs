// Uso: node revision/probar-entrada.mjs <url de una entrada con índice>
// Prueba el JS de la entrada en Chromium (CDP): el ítem activo del índice y la barra de lectura
// siguen al scroll, el botón "Copiar enlace" cambia su texto y los bloques de código no traen botón Copiar
// (lo sacó el dueño el 2026-09-30).
// El scroll va con behavior: 'instant' porque el sitio usa scroll suave: con el normal, la prueba mide a mitad de la animación.
import { spawn } from 'node:child_process';
import { rmSync } from 'node:fs';

const url = process.argv[2];
const PUERTO = 9334, PERFIL = '/tmp/wladi-cdp-entrada';
rmSync(PERFIL, { recursive: true, force: true });
const chrome = spawn('chromium', ['--headless=new', '--disable-gpu', `--remote-debugging-port=${PUERTO}`, '--remote-allow-origins=*',
  `--user-data-dir=${PERFIL}`, '--window-size=1440,900', 'about:blank'], { stdio: 'ignore' });
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
  const ev = async (expr) => (await cdp('Runtime.evaluate', { expression: expr, returnByValue: true })).result?.result?.value;
  const estado = () => ev(`(document.querySelector('#toc a.on')?.textContent ?? '(ninguno)') + ' | barra ' + Math.round(parseFloat(document.getElementById('readfill').style.width)) + '%'`);

  await cdp('Page.navigate', { url }); await dormir(2500);
  console.log('carga                 ', await estado());
  const ids = await ev(`[...document.querySelectorAll('#prose h2')].map((h) => h.id)`);
  for (const id of ids.slice(1)) {
    await ev(`document.getElementById('${id}').scrollIntoView({ behavior: 'instant' }); scrollBy({ top: -20, behavior: 'instant' })`); await dormir(300);
    console.log(`scroll a #${id}`.slice(0, 22).padEnd(22), await estado());
  }
  await ev(`scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' })`); await dormir(300);
  console.log('fondo de la página    ', await estado());
  console.log('código                ', await ev(`document.querySelectorAll('#prose .code').length + ' bloques, ' + document.querySelectorAll('#prose .code button').length + ' botones'`));
  await ev(`document.getElementById('copylink').click()`); await dormir(200);
  console.log('clic en copiar enlace ', await ev(`document.getElementById('copylink').textContent`));
  await dormir(1500);
  console.log('1,5 s después         ', await ev(`document.getElementById('copylink').textContent`));
  ws.close();
} finally {
  chrome.kill();
}
