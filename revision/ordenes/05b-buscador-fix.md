Eres el desarrollador de este repo. Lee AGENTS.md antes de empezar.

Orden 5b — corrección corta del buscador. El markup quedó IDÉNTICO al prototipo y el índice tiene sus 15 entradas, bien hecho. Pero el buscador no funciona: al abrirlo la lista queda vacía, porque el `<script>` de `src/components/Search.astro` usa una variable `idx` que nunca se define. `render()` lanza `ReferenceError: idx is not defined` y el error no se ve en pantalla.

Arréglalo así, editando solo esa línea del script (no reescribas el archivo):

1. En el `<script>` de `src/components/Search.astro`, justo después de la línea que define `esc`, agrega:
   ```js
   const idx = JSON.parse(document.getElementById('cmdk-data').textContent);
   ```
2. Nada más.

Antes de terminar, verifícate: `pnpm build` y después
```bash
python3 revision/comparar.py '#cmdk'        # tiene que seguir en IDÉNTICO
grep -c "const idx = JSON.parse" src/components/Search.astro    # tiene que imprimir 1
```

Un solo commit: "define el índice del buscador". Para cerrar, pega la salida de esos comandos, de `git status --short` (vacío) y de `git log --oneline -2`. Después detente.
