// site.js — cabecera, pie, buscador, renderizadores y utilidades compartidas. Sin dependencias.
// Los datos se leen de data/site.json (servir la carpeta por HTTP).
(function(){
const esc = s => String(s).replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const MES = ["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"];
const fmtDate = iso => { const [y,m,d] = iso.split("-").map(Number); return `${d} ${MES[m-1]} ${y}`; };
const param = k => new URLSearchParams(location.search).get(k);
const byDate = list => list.slice().sort((a,b) => b.date.localeCompare(a.date));
const postHref = p => `post.html?slug=${p.slug}`;
const isProj = p => p.type === "proyecto";
let D = null;

// Título corto para miga de pan y portada sin imagen.
// 1) shortTitle si existe. 2) Si no: título hasta el primer ": ", " (" o " — ".
// 3) Si aún supera shortTitleMax (42), se corta en el último espacio y se agrega "…".
function shortTitle(p, max){
  max = max || (D && D.settings.shortTitleMax) || 42;
  if (p.shortTitle) return p.shortTitle;
  let t = p.title.split(/: | \(| — /)[0].trim();
  if (t.length <= max) return t;
  t = t.slice(0, max);
  return t.slice(0, t.lastIndexOf(" ")).replace(/[,;.\s]+$/, "") + "…";
}

async function load(){
  if (D) return D;
  const r = await fetch("data/site.json");
  if (!r.ok) throw new Error("No se pudo leer data/site.json");
  D = await r.json();
  D.postsByDate = byDate(D.posts);
  return D;
}
const fail = e => document.body.insertAdjacentHTML("afterbegin", '<p style="padding:20px;color:#ecce70">' + esc(e.message) + " — sirve la carpeta con un servidor local (ver README).</p>");

function header(active){
  const kbd = /Mac/.test(navigator.platform) ? "⌘K" : "Ctrl K";
  return `<a class="skip" href="#contenido">Saltar al contenido</a>
<header class="top"><a class="brand" href="index.html" aria-label="wlaque.cl, inicio"><img class="avatar" src="assets/avatar-face.png" alt="" width="44" height="44"><span><b>wlaque.cl</b><span class="sub">${esc(D.profile.handle)}</span></span></a>
<button class="menu-btn" type="button" aria-expanded="false" aria-controls="menu">Menú</button>
<nav id="menu" class="menu" aria-label="Principal">${D.nav.map(n => `<a href="${n.href}" data-nav="${n.id}"${n.id===active ? ' class="on" aria-current="page"' : ""}>${n.label}</a>`).join("")}</nav>
<button class="hslot search" type="button" data-open-search aria-label="Buscar en el sitio"><svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true"><circle cx="7" cy="7" r="5" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M11 11l3.5 3.5" stroke="currentColor" stroke-width="1.6"/></svg><span class="ph">Buscar…</span><kbd>${kbd}</kbd></button></header>`;
}
const footer = () => `<footer class="foot"><nav aria-label="Redes">${D.social.map(s => `<a href="${s.href}"${s.label!=="RSS" ? ' rel="me"' : ""}>${s.label}</a>`).join("")}</nav><div>© ${new Date().getFullYear()} wlaque.cl — hecho con Astro</div></footer>`;

function mount(active){
  document.getElementById("site-top").outerHTML = header(active);
  document.getElementById("site-foot").outerHTML = footer();
  const btn = document.querySelector(".menu-btn"), menu = document.getElementById("menu");
  btn.addEventListener("click", () => { const o = menu.classList.toggle("open"); btn.setAttribute("aria-expanded", o); });
  mountSearch();
}
function setActive(id){
  document.querySelectorAll(".menu a").forEach(a => { const on = a.dataset.nav === id; a.classList.toggle("on", on); on ? a.setAttribute("aria-current","page") : a.removeAttribute("aria-current"); });
}

// Buscador tipo paleta de comandos (⌘K / Ctrl K / "/")
function mountSearch(){
  const idx = D.nav.map(n => ({t:n.label, s:"Página", h:n.href}))
    .concat(D.postsByDate.map(p => ({t:p.title, s:(isProj(p) ? "Proyecto · " + p.project.stack : "Entrada · " + p.category), h:postHref(p), k:p.description})));
  document.body.insertAdjacentHTML("beforeend", `<div class="cmdk" id="cmdk" hidden><div class="cmdk-bg" data-close></div>
<div class="cmdk-box" role="dialog" aria-modal="true" aria-label="Buscar"><div class="cmdk-in"><span aria-hidden="true">›</span><input id="cmdk-q" type="search" placeholder="Buscar entradas, proyectos, páginas…" autocomplete="off" aria-controls="cmdk-list"><kbd data-close>Esc</kbd></div>
<ul class="cmdk-list" id="cmdk-list" role="listbox"></ul><div class="cmdk-foot"><span>↑↓ moverse</span><span>↵ abrir</span><span id="cmdk-n"></span></div></div></div>`);
  const box = document.getElementById("cmdk"), q = document.getElementById("cmdk-q"), list = document.getElementById("cmdk-list"), n = document.getElementById("cmdk-n");
  let res = [], sel = 0;
  const norm = s => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  function render(){
    const v = norm(q.value.trim());
    res = v ? idx.filter(i => norm(i.t + " " + i.s + " " + (i.k||"")).includes(v)) : idx.filter(i => i.s !== "Página").slice(0, 6);
    sel = Math.min(sel, Math.max(0, res.length - 1));
    list.innerHTML = res.length ? res.map((r,i) => `<li role="option" aria-selected="${i===sel}"><a href="${r.h}"><b>${esc(r.t)}</b><span>${esc(r.s)}</span></a></li>`).join("")
      : `<li class="none">Sin resultados para «${esc(q.value)}»</li>`;
    n.textContent = v ? res.length + " resultados" : "Recientes";
  }
  const open = () => { box.hidden = false; q.value = ""; sel = 0; render(); q.focus(); document.documentElement.style.overflow = "hidden"; };
  const close = () => { box.hidden = true; document.documentElement.style.overflow = ""; };
  q.addEventListener("input", () => { sel = 0; render(); });
  q.addEventListener("keydown", e => {
    if (e.key === "ArrowDown"){ e.preventDefault(); sel = Math.min(sel + 1, res.length - 1); render(); }
    else if (e.key === "ArrowUp"){ e.preventDefault(); sel = Math.max(sel - 1, 0); render(); }
    else if (e.key === "Enter" && res[sel]){ location.href = res[sel].h; }
  });
  box.addEventListener("click", e => { if (e.target.closest("[data-close]")) close(); });
  document.addEventListener("keydown", e => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k"){ e.preventDefault(); box.hidden ? open() : close(); }
    else if (e.key === "/" && box.hidden && !/input|textarea|select/i.test(document.activeElement.tagName)){ e.preventDefault(); open(); }
    else if (e.key === "Escape" && !box.hidden) close();
  });
  document.querySelectorAll("[data-open-search]").forEach(b => b.addEventListener("click", open));
  window.openSearch = open;
}

const row = p => `<article class="row"><div class="th" role="img" aria-label="Miniatura: ${esc(p.title)}"></div>
<div><div class="meta"><time class="ts" datetime="${p.date}">${p.date}</time>${isProj(p) ? `<span class="kind ${p.project.state==="activo" ? "" : "w"}"><i aria-hidden="true"></i>Proyecto · ${p.project.state}</span>` : ""}<span class="cat ${p.category}">${p.category}</span><span class="rd">${p.readingTime}</span></div>
<h3><a class="ti" href="${postHref(p)}">${esc(p.title)}</a></h3><p class="de">${esc(p.description)}</p></div></article>`;

const pin = p => `<article class="pin"><div><div class="l">${p.category} · <time datetime="${p.date}">${fmtDate(p.date)}</time></div>
<h2><a href="${postHref(p)}">${esc(p.title)}</a></h2><p>${esc(p.description)}</p><div class="m"><span>${p.readingTime} de lectura</span><a href="${postHref(p)}">Leer →</a></div></div>
<div class="pin-th" role="img" aria-label="Portada: ${esc(p.title)}"></div></article>`;

// Tarjeta de proyecto: recibe una entrada con type "proyecto".
const unit = p => `<a href="${postHref(p)}" class="unit"><div class="unit-top"><span class="unit-state ${p.project.state==="activo" ? "" : "w"}"><i aria-hidden="true"></i>${p.project.state}</span><span class="unit-year">${p.project.since}</span></div>
<h3>${esc(p.title)}</h3><p>${esc(p.description)}</p><div class="st">${esc(p.project.stack)}</div></a>`;

const skills = () => D.skills.map(g => `<h2 class="side-h">${g.group}</h2><ul>${g.items.map(i => `<li class="${i.primary ? "pri" : ""}">${i.name}</li>`).join("")}</ul>`).join("");

// Paginación numerada: 1 … (actual−1) actual (actual+1) … N
function pages(n, cur, href){
  if (n <= 1) return "";
  const show = [...new Set([1, n, cur-1, cur, cur+1])].filter(i => i >= 1 && i <= n).sort((a,b) => a-b);
  let last = 0, nums = "";
  show.forEach(i => { if (i - last > 1) nums += '<span class="gap" aria-hidden="true">…</span>'; nums += i===cur ? `<span aria-current="page">${i}</span>` : `<a href="${href(i)}">${i}</a>`; last = i; });
  const prev = cur > 1 ? `<a href="${href(cur-1)}" rel="prev">← Anterior</a>` : '<span class="dis" aria-disabled="true">← Anterior</span>';
  const next = cur < n ? `<a href="${href(cur+1)}" rel="next">Siguiente →</a>` : '<span class="dis" aria-disabled="true">Siguiente →</span>';
  return `<nav class="pages" aria-label="Paginación">${prev}${nums}${next}</nav>`;
}

// Filtro por tema en cliente (home). En /blog/ el filtro son enlaces con URL propia.
function postFilter(o){
  let active = param("tema") || "Todos";
  if (!D.tags.includes(active)) active = "Todos";
  function render(){
    o.filters.innerHTML = D.tags.map(t => `<button type="button" data-t="${t}" aria-pressed="${t===active}">${t==="Todos" ? "Todos" : "› " + t}</button>`).join("");
    let items = D.postsByDate.filter(p => (!o.type || p.type===o.type) && (active==="Todos" || p.category===active));
    if (o.skipFeatured && active==="Todos") items = items.filter(p => !p.featured);
    if (o.limit) items = items.slice(0, o.limit);
    if (o.pin) o.pin.innerHTML = active==="Todos" && o.skipFeatured ? pin(D.posts.find(p => p.featured)) : "";
    if (o.label) o.label.textContent = active==="Todos" ? o.defaultLabel : "Tema: " + active;
    o.list.innerHTML = items.length ? items.map(row).join("")
      : `<div class="empty">${ongoroSVG(56)}<p>Aún no hay entradas de «${active}».</p></div>`;
  }
  o.filters.addEventListener("click", e => {
    const b = e.target.closest("button"); if (!b) return;
    active = b.dataset.t; render();
    const u = new URL(location); active==="Todos" ? u.searchParams.delete("tema") : u.searchParams.set("tema", active); history.replaceState(null, "", u);
  });
  render();
}

window.Site = { load, fail, mount, setActive, row, pin, unit, skills, pages, postFilter, shortTitle, fmtDate, param, postHref, isProj, esc };
})();
