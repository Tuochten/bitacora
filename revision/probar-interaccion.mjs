// Uso: node revision/probar-interaccion.mjs <url>   (o revision/probar-interaccion.sh, que construye y compara)
// Maneja Chromium headless por el protocolo de depuración (CDP) con el WebSocket que trae Node,
// y prueba lo que no se ve en una captura: buscador (Ctrl K, "/", texto, flechas, Esc),
// filtro por tema (clic) y menú móvil (a 390 px). Imprime el estado después de cada paso,
// para compararlo línea a línea contra el mismo recorrido en el prototipo.
import { spawn } from 'node:child_process';
import { rmSync } from 'node:fs';

const url = process.argv[2];
if (!url) { console.log('uso: node probar-interaccion.mjs <url>'); process.exit(2); }
const PUERTO = 9333, PERFIL = '/tmp/wladi-cdp-perfil';
rmSync(PERFIL, { recursive: true, force: true });
const chrome = spawn('chromium', ['--headless=new', '--disable-gpu', `--remote-debugging-port=${PUERTO}`,
  '--remote-allow-origins=*', `--user-data-dir=${PERFIL}`, '--window-size=1440,900', 'about:blank'], { stdio: 'ignore' });
const dormir = (ms) => new Promise((r) => setTimeout(r, ms));

try {
  let pagina;
  for (let i = 0; i < 50 && !pagina; i++) {
    try { pagina = (await (await fetch(`http://127.0.0.1:${PUERTO}/json/list`)).json()).find((t) => t.type === 'page'); } catch {}
    if (!pagina) await dormir(200);
  }
  const ws = new WebSocket(pagina.webSocketDebuggerUrl);
  await new Promise((r) => ws.addEventListener('open', r, { once: true }));
  let n = 0; const pendientes = new Map();
  ws.addEventListener('message', (e) => { const m = JSON.parse(e.data); if (m.id && pendientes.has(m.id)) { pendientes.get(m.id)(m); pendientes.delete(m.id); } });
  const cdp = (method, params = {}) => new Promise((r) => { const id = ++n; pendientes.set(id, r); ws.send(JSON.stringify({ id, method, params })); });
  const evaluar = async (expr) => (await cdp('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true })).result?.result?.value;
  const ir = async (u) => { await cdp('Page.navigate', { url: u }); await dormir(1800); };
  const tecla = async (key, code, vk, ctrl = false) => {
    for (const type of ['keyDown', 'keyUp']) await cdp('Input.dispatchKeyEvent', { type, key, code, windowsVirtualKeyCode: vk, modifiers: ctrl ? 2 : 0 });
    await dormir(200);
  };
  const buscador = () => evaluar(`(() => {
    const caja = document.getElementById('cmdk'); if (!caja) return 'NO EXISTE #cmdk';
    const items = [...document.querySelectorAll('#cmdk-list li')];
    return (caja.hidden ? 'cerrado' : 'abierto') + ' | ' + document.getElementById('cmdk-n').textContent + ' | ' + items.length + ' ítems'
      + ' | seleccionado: ' + items.findIndex((li) => li.getAttribute('aria-selected') === 'true')
      + ' | primero: ' + (items[0] ? items[0].textContent.trim().replace(/\\s+/g, ' ') : '-');
  })()`);
  const filtro = () => evaluar(`(() => {
    const vis = (el) => el && !el.closest('[hidden]');
    const filas = [...document.querySelectorAll('#log article.row')].filter(vis).map((r) => r.querySelector('.cat').textContent);
    return 'destacado ' + (vis(document.querySelector('#pin article.pin')) ? 'visible' : 'oculto') + ' | título: ' + document.getElementById('seclabel').textContent
      + ' | url: ' + (location.search || '(sin ?tema)') + ' | filas: ' + filas.join(', ');
  })()`);

  await cdp('Page.enable');
  await ir(url);
  console.log('carga              ', await buscador());
  await tecla('k', 'KeyK', 75, true);
  console.log('Ctrl K             ', await buscador());
  await cdp('Input.insertText', { text: 'pihole' }); await dormir(200);
  console.log('escribe "pihole"   ', await buscador());
  await evaluar(`(() => { const q = document.getElementById('cmdk-q'); q.value = ''; q.dispatchEvent(new Event('input')); })()`); await dormir(150);
  await cdp('Input.insertText', { text: 'docker' }); await dormir(200);
  console.log('escribe "docker"   ', await buscador());
  await tecla('ArrowDown', 'ArrowDown', 40);
  console.log('flecha abajo       ', await buscador());
  await tecla('Escape', 'Escape', 27);
  console.log('Esc                ', await buscador());
  await evaluar('document.body.focus()');
  await tecla('/', 'Slash', 191);
  console.log('tecla "/"          ', await buscador());
  await tecla('Escape', 'Escape', 27);

  await evaluar(`document.querySelector('#filters [data-t="Homelab"]').click()`); await dormir(200);
  console.log('clic Homelab       ', await filtro());
  await evaluar(`document.querySelector('#filters [data-t="Todos"]').click()`); await dormir(200);
  console.log('clic Todos         ', await filtro());

  await cdp('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await ir(url);
  const menu = () => evaluar(`(() => { const b = document.querySelector('.menu-btn'), m = document.getElementById('menu');
    return 'botón ' + (getComputedStyle(b).display === 'none' ? 'oculto' : 'visible') + ' | aria-expanded=' + b.getAttribute('aria-expanded')
      + ' | menú ' + (m.classList.contains('open') ? 'abierto' : 'cerrado') + ' (' + getComputedStyle(m).display + ')'; })()`);
  console.log('390 px, carga      ', await menu());
  await evaluar(`document.querySelector('.menu-btn').click()`); await dormir(200);
  console.log('390 px, clic Menú  ', await menu());
  ws.close();
} finally {
  chrome.kill();
}
