Eres el desarrollador de este repo. Lee AGENTS.md completo antes de empezar.

Orden NN — tarea(s) X de TAREAS.md: <qué se construye>. Van N commits, uno por bloque.

## Bloque A (commit: "<mensaje exacto>")

1. <Qué archivo crear o editar, traduciendo qué líneas exactas de qué archivo de handoff/.>
   Trampas de esta tarea:
   - <la trampa concreta, con el error que produciría y la forma correcta>
   - <si hay una sola forma correcta de escribir algo, el fragmento literal>

## Bloque B (commit: "<mensaje exacto>")

2. <...>
3. Relee `TAREAS.md` desde el disco y marca SOLO la(s) tarea(s) X.

Antes de terminar, verifícate con estos comandos después de `pnpm build`:
```bash
<comando probado por el revisor>   # tiene que imprimir: <salida exacta>
```

Criterios con que reviso:
- en la captura, <cómo se tiene que ver comparado con el prototipo>;
- <chequeo concreto>;
- `pnpm build` pasa y hay exactamente N commits.

Para cerrar, corre `git status --short` y `git log --oneline -N` y pega su salida en tu respuesta. `git status` tiene que salir vacío. Después detente.
