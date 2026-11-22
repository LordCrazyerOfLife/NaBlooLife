# Mod Loader NaBlooLife

Cargar Chess Career y Gang Bang através del mod loader en lugar de duplicar scripts o parchear a mano.

## Instalación

1. Ejecuta el instalador:
   ```bash
   python nabloolife\instalar.py "C:\ruta\NaBlooLife"
   ```
   El script copiará los 6 archivos JS y enganchará `game.html` agregando la etiqueta del loader.

2. Al recargar el juego, aparecerá una nueva fila en **Special Careers** llamada **"Mod Loader"**.
   - Los toggles activan/desactivan Chess Career y Gang Bang.
   - Los estados se guardan en `localStorage` (key: `modloader-enabled`) para que no se pierdan al recargar.

## Uso

- En el menú de Special Careers verás una fila "Mod Loader" con dos checkboxes:
  - **Chess Career** → carga `chess.js?v=5` con sus dependencias (motor, puzzles, eventos).
  - **Gang Bang** → carga `gang.js?v=5` con fixes de `g.yr` y reputación.
- Los toggles recuerdan su estado entre sesiones.
- Si quieres agregar más mods en el futuro, solo agrega una entrada en `MODS` en `modloader.js` y un toggle en `game.html`.

## Compatibilidad con `mods.js`

- `mods.js` debe contener la entrada `64646464` para que Chess Career sea detectable por el código del juego (`window.MOD_LOADER` y filas `spChess`/`spGang`).
- El loader lee `mods.js` y registra los códigos `11111111` (Mod Workshop) y `64646464` (Chess Career) automáticamente.
- No toques `game.html` directamente para agregar mods: usa el instalador `instalar.py`, él se encarga de enganchar el tag `<script src="modloader.js">` después de `mods.js`.

## Desarrollo

Si quieres agregar un nuevo mod:

1. Agrega su configuración en `modloader.js` en la sección `MODS`:
   ```js
   nuevoMod: {
     path: "nuevo-modulo.js?v=X",
     deps: [] // o lista de dependencias
   }
   ```
2. Ejecuta `python nabloolife\instalador.py "ruta/NaBlooLife"` para copiar archivos y actualizar `game.html`.
3. El loader detectará automáticamente el nuevo mod si su código tiene el patrón de identificación esperado.

---

**Notas:**
- El instalador es **idempotente**: correrlo varias veces no duplica archivos ni tags.
- Los toggles usan `id` (no `src`) para que subir versión no apague el mod.
- Se acepta el formato viejo por `src` como respaldo.