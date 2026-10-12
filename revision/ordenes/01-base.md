Eres el desarrollador de este repo. Lee AGENTS.md y TAREAS.md completos antes de empezar.

Orden 1 — tareas 2 y 3 de TAREAS.md: el layout base, la cabecera y el pie. Van 2 commits.

Contexto clave: el HTML exacto que tienes que producir ya está escrito en `revision/referencia/home-top.html` (enlace "Saltar" + cabecera) y `revision/referencia/home-foot.html` (pie). Es el DOM renderizado del prototipo con las rutas de producción. Tu trabajo es convertirlo en componentes de Astro que lean los datos de `src/data/site.json`. NO traduzcas desde `handoff/js/site.js`: usa las referencias.

## Bloque A (commit: "agrega Top y Foot")

1. Crea `src/components/Top.astro`:
   - frontmatter: `import site from '../data/site.json';` y una prop `active` (string).
   - El markup es el de `revision/referencia/home-top.html`: primero el `<a class="skip">` y después el `<header class="top">`.
   - El `.sub` sale de `site.profile.handle`.
   - Los enlaces del menú salen de `site.nav` con `.map()`. El activo lleva `class="on"` y `aria-current="page"`; los demás no llevan ninguno de los dos. En Astro, un atributo con valor `undefined` no se escribe:
     `<a href={n.href} class={n.id === active ? 'on' : undefined} aria-current={n.id === active ? 'page' : undefined}>{n.label}</a>`
   - El `<kbd>` dice `Ctrl K` (el cambio a ⌘K en Mac es otra tarea).
   - El SVG de la lupa se copia tal cual. `viewBox` va en camelCase.
2. Crea `src/components/Foot.astro`:
   - frontmatter: `import site from '../data/site.json';` y `const year = new Date().getFullYear();`
   - Markup de `revision/referencia/home-foot.html`. Los enlaces salen de `site.social`: todos llevan `rel="me"` MENOS el de RSS: `rel={s.label !== 'RSS' ? 'me' : undefined}`.

## Bloque B (commit: "agrega el layout Base y arma el esqueleto del home")

3. Crea `src/layouts/Base.astro`:
   - frontmatter, en este orden exacto:
     ```ts
     import '../styles/reset.css';
     import '../styles/bitacora.css';
     import Top from '../components/Top.astro';
     import Foot from '../components/Foot.astro';
     const { title, description, canonical = 'https://wlaque.cl/', ogTitle = title, ogDescription = description, active = '' } = Astro.props;
     ```
   - El `<head>` es el de `handoff/index.html` (líneas 4 a 21), con estos cambios: `title`, `description`, `canonical`, `og:title`, `og:description` y `og:url` salen de las props; el favicon es `/assets/avatar-face.png`; SACA los dos `<link rel="stylesheet">` (el CSS entra por los import); SACA el `<script type="application/ld+json">` y en su lugar pon `<slot name="head" />`. El enlace de las fuentes de Google se copia tal cual.
   - `<html lang="es">` y el body: `<div class="shell"><Top active={active} /><slot /><Foot /></div>`.
4. Reemplaza `src/pages/index.astro` completo por una página que:
   - importe `../layouts/Base.astro` y `../styles/home.css`;
   - use `<Base title="…" description="…" ogTitle="…" ogDescription="…" active="inicio">` con los textos TEXTUALES de `handoff/index.html` (líneas 6, 7, 10 y 11);
   - ponga el JSON-LD de la línea 15 de `handoff/index.html` así, dentro de Base:
     ```astro
     <Fragment slot="head"><script type="application/ld+json" is:inline set:html={JSON.stringify({ /* el objeto de la línea 15 */ })} /></Fragment>
     ```
   - y por ahora solo un `<main id="contenido"></main>` vacío.
5. Relee `TAREAS.md` desde el disco y marca SOLO las tareas 2 y 3.

Antes de terminar, verifícate: corre `pnpm build` y después estos tres comandos. Los tres TIENEN que imprimir `IDÉNTICO`. Si alguno imprime `DISTINTO`, te muestra la línea exacta que no calza (`-` prototipo, `+` tu sitio): arréglala y vuelve a correrlo.
```bash
python3 revision/comparar.py a.skip
python3 revision/comparar.py header.top
python3 revision/comparar.py footer.foot
```

Para cerrar, pega en tu respuesta la salida de esos tres comandos, de `git status --short` (tiene que salir vacío) y de `git log --oneline -3`. Después detente.
