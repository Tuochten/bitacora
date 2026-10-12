Orden 3b — corrección del Hero. El Hero se ve casi idéntico al prototipo, bien hecho. Pero la revisión encontró dos bugs en el `<script>` de `src/components/Hero.astro`, confirmados leyendo el DOM a los 5 y a los 10 segundos:

**Bug 1 — la etiqueta nunca cambia.** `heroNowLabel.querySelector('.hero-now-label')` busca `.hero-now-label` DENTRO de sí mismo, devuelve `null`, y el `if (labelSpan)` se traga el error en silencio. A los 5 segundos la página muestra "▲ Estudiando" junto a "wladi.dev v2 con Astro", mezclando dos actividades.

**Bug 2 — el valor se congela desde el segundo cambio.** `heroNowValue` se busca una sola vez al cargar. Después del primer `replaceWith`, la variable sigue apuntando al span viejo, que ya no está en la página, así que los reemplazos siguientes no hacen nada.

Arréglalo así, sin tocar nada fuera del `<script>`:

1. Dentro de la función que corre cada 4500 ms, busca los elementos DE NUEVO en cada vuelta: `document.querySelector('.hero-now-label')` y `document.querySelector('.hero-now-value')`. No los guardes en variables de afuera.
2. Para la etiqueta, reconstruye su contenido completo en vez de buscar hijos:
   ```js
   const icono = document.createElement('span');
   icono.classList.add('hero-now-icon');
   icono.textContent = a.icon;
   etiqueta.replaceChildren(icono, ' ' + a.label);
   ```
3. Para el valor, deja el `cloneNode` + `replaceWith` como está, pero sobre el elemento recién buscado.
4. Borra los `if (...)` que esconden errores: si un elemento no existe, que falle visible.

Criterio con que reviso: leo el DOM a los 5, 10 y 14 segundos, y tiene que mostrar, en orden:
- 5 s: "◈ Construyendo" + "wladi.dev v2 con Astro"
- 10 s: "▣ Trabajando en" + "bigbuda — CTO desde 2022"
- 14 s: "▲ Estudiando" + "Ciberseguridad · Semestre 1°"

Exactamente 1 commit: "corrige la rotación del widget now del Hero".

Una nota de disciplina: en la orden 3 pedí 2 commits y hiciste 1 con todo junto. No lo rehagas, pero en adelante respeta los commits que se piden: sirven para revertir un bloque sin perder el otro.

Cuando termines, detente.
