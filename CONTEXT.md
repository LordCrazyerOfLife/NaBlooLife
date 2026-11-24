# YourLife: contexto del proyecto (handoff)

> Última actualización: 2026-11-24 (sesión 5: Mental Health, fútbol, grids). Léelo completo antes de tocar nada.
>
> **Resumen de dónde estamos:** (1) traducción ES/PT del juego **terminada** (45,952 líneas) con una segunda pasada
> de calidad pendiente; (2) **freebuff** conectado (opencode gratis) y probado; (3) tres mods propios hechos desde
> cero: **Chess Career** (`64646464`), **Gang Bang** (`13131313`) y arte nuevo (barba, armas, bandana);
> (4) el usuario está **esperando el permiso del dev** para poder ayudarlo/compartir.
>
> **Reglas que el usuario fue marcando (respétalas):**
> - "Solo traducir, no arreglar nada" mientras dure la traducción (bugs del i18n: solo anotarlos).
> - **Nada de personas reales** en las pandillas del mod (se pidió y se rechazó): gente 100% inventada.
> - Nada de redistribuir el juego, sus assets ni los diccionarios sin permiso del dev (ver sección del dev).
> - Hablarle en Spanglish dominicano y directo (ver el CLAUDE.md global).

## Qué es
- **YourLife** (`penguinrecreations.itch.io/bitlife`) es un fan remake de BitLife en HTML/JS puro: sin engine,
  sin backend y con los saves en `localStorage`.
- **Uso:** el usuario lo bajó **para modearlo y jugarlo en local, nada más**. No se resube, no se postea y no
  se mete al repo ni al canal. El código trae el header *"Unauthorized copying, re-hosting or redistribution is
  prohibited"*.
- **Reglas de trabajo:** analizar y modear localmente está bien. Nada de redistribuir ni de copiar assets o
  textos de BitLife a proyectos propios.
- **Origen del build:** `https://html-classic.itch.zone/html/20222767/` (versión v3.25.1). Los assets venían
  empaquetados en `packs/p0-p29.bin` y su índice en `packs/index.json`, con formato `[pack, offset, len]` y sin
  cifrado.

## Carpeta `C:\Users\Mxzzy\Downloads\FreeLife\`
| Ruta | Qué es |
|---|---|
| `Jugar.bat` | Levanta `python -m http.server 8765` y abre `http://127.0.0.1:8765/game.html`. Hace falta servirlo así porque con `file://` el juego se rompe. |
| `game.html` | El core: ~88k líneas de JS inline, ya prettificado. |
| `*.js` (108) | Sistemas: `settings.js`, `mafia.js`, `serial-killer.js`, `milev-*.js`, `church.js`, etc. |
| `_original\` | **Backup** de los 111 JS/HTML minificados originales, antes de tocar nada. Es la fuente para extraer texto. |
| assets | 9,910 archivos (~240MB): `faces/`, `jobev/`, `sounds/`, `emoji/`… ya desempacados de los `.bin`. |
| `i18n.js`, `i18n\` | El sistema de idiomas (ver abajo). |
| `CONTEXT.md` | Este archivo. |
| `AJEDREZ.md` | La investigación y el diseño del mod de ajedrez (la escribió el usuario; 36KB). |
| `chess.js`, `chess-engine.js`, `chess-events.js`, `chess-puzzles.js` | **Mod Chess Career** (ver su sección). |
| `gang.js` | **Mod Gang Bang** (carrera especial de pandilla). |
| `mods.js` | El registro oficial de mods del juego. **Tiene 2 entradas nuestras** (`64646464` y `13131313`). |
| `guns/` | Íconos 120×120 de las armas del mod de pandilla (glock, switch en 8 colores, arp, draco). |
| `switches/` | Los PNG de la Glock con switch en 8 colores: grandes, de 120 y la hoja `_todos.png`. |
| `special/gangbang.png` | Ícono de la carrera Gang Bang (bandana). |
| `_art-src/` | **Fuentes del arte nuevo** (SVG en HTML + scripts de Python/Node): ver sección de arte. |
| raíz (sueltos) | PNG de muestra: `glock-extended*.png`, `draco*.png`, `arp*.png`, `glock-switch*.png`, `barba-preview.png`, `cara-completa.png`, `piezas-ajedrez-demo.png`, `stage3/4/5-facial-hair14.png` (la barba, **sin instalar**). |
| `i18n\*.bak`, `*.bak-*` | Backups de seguridad de hoy (`ui.tsv.bak`, `rules.tsv.bak`, `events.tsv.bak-pre-merge` y 2 `.bak-mojibake`). Se pueden borrar cuando todo esté estable. |

**Cambios hechos al juego** (todos marcados con `[mod]` donde se pudo):
1. **Redirect quitado:** `game.html` ya no tiene `"serviceWorker"in navigator&&!...controller&&location.replace("index.html")`,
   así que carga directo sin service worker.
2. **Todo prettificado:** se pasó por Prettier 3.3.3 (`--print-width 110`). Las variables siguen siendo `e`, `t`,
   `a`, pero las funciones globales tienen nombre (`openMainMenu`, `jobIcon`, `petSprite`…).
3. **Scripts de idiomas en el `<head>` de `game.html`:** `i18n.js`, `i18n/es.js` y `i18n/pt.js`, más un
   `document.write` que carga `i18n/<lang>.events.js`.
4. **`settings.js`:** la fila "Languages" ya no lleva `err`, y la función `openLanguages()` abre la lista con
   banderas (`flags/us|es|br.png`). La elección se guarda en `localStorage["bitlifepp-settings"].lang`
   (`en|es|pt`) y recarga la página.
5. **Ortografía (30 fixes):**
   - "Two age up's" → "Two age-ups" y "NPC's can" → "NPCs can"
   - "wacking" → "whacking" y "somebodys" → "somebody's"
   - Británico → americano en prosa: colour, favourite, honour, neighbour, humour, flavours, harbour, centre,
     apologise, criticised y behaviour. Los nombres propios no se tocaron (Marsh Harbour, David Harbour, Honour
     Cross).
   - La prosa del dev ya estaba limpia; los "duplicados" que salen son huecos de plantilla (`in ${city} in ${country}`).

## Sistema de idiomas (`i18n.js`)
- **Enfoque: traducción en runtime sobre el DOM.** Un `MutationObserver` cambia cada text node por su
  traducción, así que no se tocan las 223k líneas del juego. También traduce los atributos `placeholder`,
  `title` y `aria-label`, y los mensajes de `alert`, `confirm` y `prompt`.
- **Problema clave resuelto:** el juego **lee texto de la pantalla en su lógica**, por ejemplo
  `"ASSETS" !== sTitle.textContent`, buscar la sección `.sec` con texto `"Misc."`, o
  `jmTable.textContent.match(/Employer:…Salary/)`. Por eso `i18n.js` sobrescribe los getters de
  `Node.prototype.textContent` y `HTMLElement.prototype.innerText` para que **devuelvan el inglés original** de
  los nodos traducidos (guardado en un `WeakMap`). El jugador ve español y el código sigue viendo inglés.
  ⚠️ Para probar qué se ve en pantalla, usa `node.data` o screenshots, **no** `innerText` ni `textContent`.
- **Orden de búsqueda:**
  1. Match exacto, sin importar mayúsculas. Si el original va en MAYÚSCULAS, la salida también.
  2. Reintento sin la puntuación final (`: ! ? . ...`).
  3. Plantillas de eventos.
  4. Reglas regex de `rules.tsv`.
- **Plantillas:** `"I let {full} copy my homework."` se convierte en una regex donde cada `{x}` es `(.+?)`. Los
  valores capturados se traducen si están en el diccionario, respetando la minúscula: "my dog" → "mi perro".
  - **Indexadas** por la primera palabra literal (`start`) o, si la plantilla empieza con `{x}`, por su palabra
    literal más rara (`inner`). Cada regex se compila la primera vez que se usa.
  - **Rendimiento:** unos 15µs por miss (2000 misses en 29ms).
- **Archivos en `i18n\`:**
  - `ui.tsv`: ~630 textos de interfaz traducidos **a mano** (+ ~640 de los mods, en la sección `## --- chess mod ---`),
    en columnas `en<TAB>es<TAB>pt`. Ganan siempre. Hoy `es.js`/`pt.js` traen ~1,270 textos.
  - `rules.tsv`: 27 regex del juego (`Age: N years (YYYY)`, `Died at N`, los bisabuelos…) + ~70 de los mods. Hoy: 96.
  - `events.tsv`: el texto masivo traducido por Haiku (validado).
  - `build_i18n.py`: genera `es.js`/`pt.js` (UI + reglas) y `es.events.js`/`pt.events.js` (eventos, con
    `weak:1`, o sea que nunca pisan la UI). **Después de editar cualquier `.tsv`, corre `python build_i18n.py`.**
- **Lo que ya se vio funcionando en el juego, con screenshots:**
  - La UI en ES y PT: pantalla de carga, selector de dispositivo, género, main screen, stats, Actividades,
    Settings e Idiomas.
  - El cambio de idioma desde Settings.
  - `ACTIVIDADES` abre bien aunque el código compara el título en inglés.
- **Probado el 2026-11-20 en una vida real:** los `events.js` cargan y el log sale en español.
  - Bugs vistos (el usuario pidió **no arreglarlos todavía**):
    - Hay plantillas demasiado genéricas que mezclan idiomas, por ejemplo "A famine struck Somalia **y los** Horn
      of Africa", porque una plantilla tipo `{1} and the {2}` se come la frase.
    - Algunos valores que mete el juego no están en el diccionario ("who is unemployed").

## Traducción masiva de eventos: estado
- **Extracción:** `work\scripts\extract.mjs` (acorn) sacó **45,952 unidades** (~329k palabras) de `_original\`.
  - Cada `${expr}` se vuelve `{1}`, `{2}`…; el HTML se parte en text nodes; las listas de palabras y nombres
    se excluyen.
  - También incluye palabras sueltas en minúscula que existen en el diccionario (`wife`, `librarian`): son los
    valores que el juego mete dentro de las frases.
  - El resultado está en `work\units.jsonl`.
- **Modelo:** Claude **Haiku** vía subagentes, con 800 líneas por lote. Prueba de 500: calidad natural, ~97-100%
  de líneas válidas por lote.
- **Progreso: TERMINADA (2026-11-21).** Hay **45,952 filas en `events.tsv`**, o sea todas las unidades
  (`merge.py` da `ok: 45462` + 490 reusadas). Los archivos se regeneraron: 33,302 frases + 12,645 plantillas por idioma.
  - **Quién tradujo qué:**
    - Haiku: b001-b020 y b022.
    - Freebuff (opencode `big-pickle`, gratis): b021, b023-b057, los `r024/r026/r035/r036`, que son los restos de lotes
      que se cortaron, y `r999`, las 137 líneas que fallaron la validación.
  - **Calidad de big-pickle:** ~98.5% de líneas válidas. Aproximadamente 1 de cada 4-5 líneas suena literal ("Psiquiatra
    Sr.", botones en infinitivo, `¡` mal cerrado), pero se entiende todo. Solo se revisó el español.
  - **Pendiente: una segunda pasada de revisión.** Que solo corrija las líneas de freebuff, con
    `deepseek-v4.1-flash-free` y fallback a `nemotron-3.5-super-vl-free`. El wrapper ya soporta la lista de modelos
    en `freebuff\backends\models.txt`. El usuario dijo "lo haremos después".
  - `merge.py` reporta un "retry" inflado porque cuenta líneas que ya cubren los `r0xx`. Lo que vale es `ok`.
- **Archivos en `i18n\work\`:**
  - `INSTRUCTIONS.md`: las reglas para el traductor (pronombres, `¡` una sola vez, imperativos, nombres propios…).
  - `batches\bNNN.tsv`: los lotes de entrada (`id<TAB>en`). Sus salidas son `bNNN.out.tsv` (`id<TAB>es<TAB>pt`).
  - `reuse.json`: las 490 traducciones de la prueba que se reutilizan.
  - `scripts\validate.py`: `python -I validate.py in.tsv out.tsv --show N`.
  - `scripts\merge.py`: `python -I merge.py <work> <FreeLife\i18n\events.tsv>`. Valida, realinea los ids si Haiku
    los renumeró, escribe `events.tsv` y saca los fallidos a `batches\retry.tsv`.
- **Prompt que se le pasaba a cada agente Haiku**
  (`model: haiku`, `subagent_type: general-purpose`, en background y con unos 10 en paralelo):
  ```
  Translation job. First read the instructions file and follow it exactly:
  C:\Users\Mxzzy\Downloads\FreeLife\i18n\work\INSTRUCTIONS.md
  INPUT: C:\Users\Mxzzy\Downloads\FreeLife\i18n\work\batches\bNNN.tsv
  OUTPUT: C:\Users\Mxzzy\Downloads\FreeLife\i18n\work\batches\bNNN.out.tsv
  ```
- **Flujo (ya se completó una vez; sirve para retomar o repetir, p. ej. la segunda pasada):**
  1. Traducir los lotes que faltan.
  2. Correr `merge.py`.
  3. Re-traducir `retry.tsv`.
  4. Correr `merge.py` otra vez.
  5. Correr `build_i18n.py`.
  6. Probar en el juego.
- **Gotchas conocidos:**
  - **Pronombres:** `{he}`, `{him}`, `{his}`, `{He}`, `{She}`, `{himself}`, `{T_him}` y `{he2}` los llena el juego
    con palabras en inglés, así que **no pueden quedar** en la traducción. El validador los rechaza.
  - **Ids:** a veces Haiku renumera los ids (1, 2, 3…). `merge.py` realinea por posición si el conteo cuadra.
  - **Haiku a veces mete `{first}` donde no había nada:** el validador lo rechaza y la línea va a reintento.
  - **Concordancia de género:** con valores desconocidos sale cosas como "Una {1} llamada" aunque `{1}` sea "man".
    Es una limitación aceptada.
  - **Plurales con `{2}`:** en inglés `{2}` puede ser una "s" de plural, y entonces sale "audicións". Pendiente.
  - **Valores sin traducir:** los que mete el juego y no están en el diccionario (ej. "a Ferrari") se quedan en
    inglés dentro de la frase traducida.
  - ⚠️ **Mojibake (acentos rotos) — pasó el 2026-11-21:** freebuff escribió `b024` y `b057` con el encoding mal
    ("VocÃª estÃ¡", "QuÃ©date") y **719 líneas** salieron rotas en el juego. El `validate.py` NO lo detecta
    (los placeholders estaban bien). Se arregló recodificando (`s.encode('cp1252').decode('utf-8')`); los originales
    quedaron como `*.bak-mojibake`. **Después de cada tanda de freebuff, revisa con el regex
    `Ã[\x80-\xbf¡-ÿ]|Â[\xa0-\xbf]|â€` en `events.tsv`**, y vuelve a correr `merge.py` + `build_i18n.py`.
  - Los lotes `b024`, `b035`, `b036` y `b026` se cortaron a medias: lo que faltaba se sacó a `r024`, `r035`, `r036`
    y `r026` (mismos ids, solo las líneas pendientes) y `merge.py` los toma solos (`r*.tsv`).

## Freebuff (CONECTADO desde 2026-11-20)
- **Idea del usuario:** gastar menos uso de Claude pasándole el trabajo pesado a **otra IA del usuario (no es
  Gemini)** a través de un MCP llamado **freebuff**.
- **Spec:** `C:\Users\Mxzzy\Downloads\Script\freebuff-spec.md`. Tools `freebuff_task`, `status`, `result`,
  `reply`, `cancel` y `list`, en stdio, con reportes de ≤1500 caracteres, solo dentro del workspace permitido y
  con un backend mock.
- **Estado (2026-11-20): CONECTADO y probado.** Está registrado en scope user (`claude mcp add freebuff -s user`).
  - El CLI `freebuff` (Codebuff) **no tiene modo headless**, así que el backend real es
    `freebuff\backends\opencode.mjs`: un wrapper de `opencode run --format json` con modelos free (default
    `opencode/big-pickle`, se cambia con `OPENCODE_MODEL`). Hace falta opencode ≥1.18 (hay 1.19.6). Con 1.17, el
    free tier devuelve 426.
  - **Fixes de Claude:** el `session_id` se valida antes de meterlo en la línea de shell (había inyección), y el
    contrato REPORT ahora va primero y en inglés (al final, el modelo lo tomaba por prompt injection y no lo mandaba).
  - **Prueba real:** task + reply en la misma sesión, REPORT limpio, ~15s por job y `cost: 0`. Los e2e viejos pasan.
  - ⚠️ **opencode auto-aprueba `bash` y `write`** (corre sin `--dangerously-skip-permissions`, pero sus defaults ya
    lo permiten). El `cwd` no es sandbox: el agente puede tocar fuera si quiere. No le pases tareas con datos no
    confiables.
  - `deepseek-v4-flash-free` dio "Unexpected server error" en la prueba; `big-pickle` funciona. Con opencode 1.19.6
    la lista de modelos gratis es: `big-pickle`, `deepseek-v4.1-flash-free`, `mimo-v2.6-flash-free`,
    `nemotron-3.5-super-vl-free`, `nemotron-3.5-lightning-free`, `longcat-2.5-free`, `hy4-flash-free`,
    `flint-40b-free`, `beam-free`, `iceman-free` y `tidepool-alpha-free` (`opencode models` la muestra).
  - **Mejoras al wrapper `backends/opencode.mjs` (hechas después):**
    - **Auto-continue:** los modelos gratis a veces cortan el turno sin escribir nada; si la respuesta no trae el
      bloque `REPORT`, manda "continúa" en la misma sesión (hasta `OPENCODE_MAX_ROUNDS`, default 8). Sin esto
      b021/b024/b025 fallaron al principio.
    - **Fallback de modelos:** si el modelo da error, pasa al siguiente de `backends\models.txt` (uno por línea).
      **Ese archivo se borró después de probarlo**, así que hoy usa solo `big-pickle`. Para la segunda pasada:
      crear `models.txt` con `opencode/deepseek-v4.1-flash-free` y `opencode/nemotron-3.5-super-vl-free`.
      El JSON de salida ahora trae el campo `model`.
  - **Los jobs viven dentro de la sesión de Claude Code:** si se cierra o se reinicia, la cola muere (los `running`
    pasan a `failed`). Hay que re-lanzarlos. Cuatro corren en paralelo y cada lote tarda 4-12 min.
  - Prompt que funcionó para cada lote: el de abajo (Haiku) más `Work in chunks of at most 100 lines per write
    (append)` y pedir el REPORT con "verified: input vs output".
- **`C:\Users\Mxzzy\Downloads\Script\server.mjs` ("cmd-local", lo hizo la otra IA):** en modo `--http`, cualquier
  web puede ejecutarle comandos (POST `text/plain` a `127.0.0.1:7331/order`, sin preflight). La spec pide el
  arreglo: exigir token, rechazar requests con `Origin` o que no sean JSON, y validar `Host`. **No usar el modo
  HTTP hasta que esté arreglado.**

## Cómo probar el juego desde Claude
- **Server:** `python -m http.server 8765 --bind 127.0.0.1 --directory "C:\Users\Mxzzy\Downloads\FreeLife"`,
  corriéndolo en background.
- **Brave con debug, en un perfil aparte:**
  `"C:\Program Files\BraveSoftware\Brave-Browser\Application\brave.exe" --remote-debugging-port=9333 --user-data-dir=<scratchpad>\brave-rea --no-first-run http://127.0.0.1:8765/game.html`
- **Scripts:**
  - `work\scripts\cdp.mjs`: `node cdp.mjs 127.0.0.1:8765 -e "<js async>"` evalúa JS en la página y devuelve JSON.
    No recargues desde el mismo eval: usa `setTimeout(()=>location.reload(),50)` y espera unos 9s.
  - `work\scripts\shot.mjs`: `node shot.mjs 127.0.0.1:8765 out.png "<js previo>"` saca un screenshot a 430x900
    en modo móvil. **Mejor `shot2.mjs`** (misma firma): espera a que cargue y no recarga por error.
  - `work\scripts\hardreload.mjs`: borra caché y recarga la pestaña.
  - **Tests de los mods** (se pasan a `cdp.mjs` como archivo, p. ej. `node cdp.mjs 127.0.0.1:8765 events-test.js`):
    `events-test.js` (los 30 eventos de ajedrez), `board-autoplay.js` (una partida completa en el tablero),
    `puzzle-test.js`, `gang-test.js`, `gang-crew-test.js` y `guns-test.js`.
  - Si el Brave de debug no está abierto, hay que levantarlo otra vez (se cierra al reiniciar la sesión). El perfil
    de prueba guarda el idioma y los mods activados, así que no hay que repetirlo (ver "Cómo activar un mod a mano").
- **Trampas al probar:**
  - **Pestañas:** solo puede haber una abierta (`tab-lock.js`), o sale "Already open".
  - **Emulación móvil:** dispara el selector "How are you playing?". Pásalo con el elemento cuyo
    `textContent === 'Play on Mobile'`.
  - **Vida nueva:** `.pk-btn.pk-m` (male) → `.pk-btn.pk-c0` (la primera cara) → `#ageBtn`. Los popups están en
    `#evWrap`, `#toast` y `.notice`.
  - **Salida de Python en Windows:** con `-I`, lee stdin y escribe stdout en UTF-8 con
    `sys.stdin/stdout.reconfigure(encoding='utf-8')`, o salen cosas como "Ã±".
  - **Caché:** Brave guarda los `.js`. Para ver cambios usa `node hardreload.mjs 127.0.0.1:8765` (borra caché y
    recarga) o Ctrl+F5. Los mods se cargan con `src: "x.js?v=1"`: sube el `v` si cambias algo y quieres forzarlo.
  - **El Age up se bloquea** mientras haya un `.notice-wrap` abierto, el `#evWrap` abierto o algo en
    `popupQueue` (`game.html:66261`). En los tests hay que hacer clic en `.notice-wrap` para cerrar los avisos.
  - **`shot2.mjs`:** el botón "Play on Mobile" **recarga el juego**; solo se le da clic si está visible (ya está
    arreglado en el script). Espera ~6s al cargar.
  - **Chrome/Brave headless** no arranca si ya hay un Brave de debug abierto (`exit 21`); usa CDP sobre ese mismo.
  - **PowerShell:** los nombres de variable no distinguen mayúsculas (`$f` y `$F` son la misma): ya me rompió una ruta.
  - Tras `socSelCard()` la pantalla `screen` se cierra: si vuelves a un menú, hay que hacer
    `screen.classList.add("open")` (lo hace `openGang()`).
  - `localPrice(0)` devuelve 5 (mínimo); por eso los mods usan un `price()` propio que deja el 0 en 0.
- **Herramientas:**
  - REA MCP: `inspect_web_page` y `analyze_web_bundle` sirven para el análisis estático.
  - Node 24.22.3, con `npx prettier@3.3.3`.
  - acorn: `npm i acorn@8.12.1 acorn-walk@8.3.4` en una carpeta de herramientas (hay que reinstalarlo si se usa
    `extract.mjs`).
  - pyspellchecker: `pip install --target <dir> pyspellchecker==0.8.1`.

## Mod de ajedrez (Chess Career) — 2026-11-21
- **Diseño:** está en `AJEDREZ.md`, la investigación que escribió el usuario. Se siguió casi todo.
- **Cómo se activa:** Settings → Mods → Redeem Code → **`64646464`**. Queda registrado en `mods.js` (entrada con `src`).
  Aparece en Actividades → Ajedrez a partir de los 6 años. **No toca `game.html`:** envuelve `openActivities` igual
  que `vampire.js` y se engancha a `#ageBtn` igual que `acting.js`.
- **Archivos:**
  - `chess.js`: la carrera, el menú, el tablero y los puzzles.
  - `chess-engine.js`: el motor, propio. Funciona también como Web Worker y en Node.
  - `chess-puzzles.js`: **362 puzzles originales** generados por autojuego: 27 mates en 1, 129 mates en 2 y 206
    tácticas. Van de 764 a 1935 de rating y todos están validados.
- **Traducción ES/PT de los mods:** sección `## --- chess mod ---` en `ui.tsv` (~610 textos) y en `rules.tsv`
  (~70 reglas). Se regenera (idempotente) con `python -I i18n\work\scripts\add_chess_i18n.py` y después
  `python -I i18n\build_i18n.py`. Cubre ajedrez, eventos, pandilla y armas. Español probado en el juego; el
  portugués se vio en pantalla en los eventos y en el menú de pandilla.
- **Carrera:**
  - Elo FIDE real: K 40/20/10, primer rating tras 5 partidas, piso de 1400.
  - Títulos CM/FM/IM/GM más los femeninos. IM/GM piden 3 normas.
  - 7 torneos, del club al Candidates, más el Mundial a 14 partidas.
  - Coach, estudio, clases, y la plataforma online parodia **Pawnder** (bullet/blitz/rapid, Titled Tuesday,
    streaming, Play Live).
  - Talento oculto que sale de Smarts, con un techo (potencial). Calibrado simulando vidas: el casual queda en ~1500,
    el serio en FM/GM, el prodigio pasa de 2650. Nadie supera 2882.
- **Partida clave:** la última ronda de cada torneo se puede jugar en el tablero o simular. En "Final Rounds" se puede
  elegir simular siempre.
- **Motor:**
  - Perft 20/400/8902/197281 OK, más Kiwipete y las posiciones 3 y 4.
  - Bot alpha-beta con quiescencia. La fuerza va por Elo (profundidad 1-3 más "temperatura") y tarda ~1s por jugada
    al nivel máximo. La profundidad 4 se descartó porque tardaba ~4s.
- **Eventos (`chess-events.js`): 30 eventos con decisiones**, hechos el 2026-11-21.
  - Salen al hacer Age up (~55% de los años en que jugaste ajedrez, ~12% si no). Cada uno tiene condiciones
    (rating, edad, título, seguidores, actividad del año); ninguno se repite antes de 5 años y algunos son únicos
    (`once`: el libro, la apertura con tu nombre, el papá mánager).
  - Temas: oferta de trampa, acusación falsa, rivalidad, apuro de tiempo, tablas pactadas, filtración de preparación,
    patrocinador (llega y se va), liga europea, alumno que te gana, burnout, partida viral, pastillas, retiro,
    prodigio de 9 años, libro, exhibición en escuela, tahúr del parque, apuesta, apertura con tu nombre, trolls,
    comentarista, Olimpiada, club en problemas, romance, error garrafal, cuenta hackeada y campamento de élite.
  - **Mecánicas nuevas:** `c.banUntil` (la FIDE te suspende hasta cierta edad y los torneos se bloquean), `c.sponsor` y
    `c.league` (pagan cada año; la liga te suelta si bajas de 2200), cuenta de Pawnder con rating -X.
  - **Cada texto va como `T("english","español","português")`** y `add_chess_i18n.py` los pasa solos al `ui.tsv`.
    Regla: comillas dobles, sin template literals ni valores dinámicos dentro de `T()`.
  - **Debug:** `FL_CHESS.event()` lista los eventos que aplican ahora; `FL_CHESS.event("cheat_offer")` lo dispara.
- **Textos:** el usuario pidió primero dejarlos en inglés y **después pidió el español y el portugués**; ya están
  (ver "Traducción ES/PT del mod"). Lo que sí sigue en inglés: la notación de las jugadas ("Kxd2").
  - ⚠️ Los textos que arma `chess.js` (menús, tablero, torneos) **no se extraen solos**: están escritos a mano en
    `add_chess_i18n.py` (bloques `UI` y `RULES`). Si agregas texto nuevo en `chess.js`, agrégalo ahí también.
    Los de `chess-events.js` y `gang.js` sí salen solos de los `T()`.
  - Se cambiaron dos palabras para no pisar traducciones del juego: "Resign" → "Resign game" (ya significa
    renunciar al trabajo) y "Draw" → "It's a draw".
- **Herramientas de prueba en `i18n\work\scripts\`:**
  - `hardreload.mjs`: borra el caché y recarga.
  - `shot2.mjs`: screenshot móvil estable.
  - `board-autoplay.js` y `puzzle-test.js`: se pasan a `cdp.mjs` como archivo.
- **Generador de puzzles:** `i18n\work\scripts\gen-puzzles.js`.
  - Uso: `node gen-puzzles.js <salida.js> <minutos>`. Saca ~3 puzzles/min por proceso.
  - Verifica que la solución sea única: mate en 1, mate en 2 con una sola primera jugada, o táctica de +2.5 con la
    segunda mejor jugada 2 peones peor.

## Mundial jugable + i18n genérico — 2026-11-21 (sesión 2)
- **Mundial (`worldMatch` en `chess.js`):** ya NO es simulado de golpe. Es un match a 14 partidas (gana el primero a 7.5):
  cada partida pregunta *Play the game / Simulate this game / Simulate the rest*; se juega en el tablero (reloj 30+30; el
  botón Simulate del tablero también vale), los colores alternan, y a 7-7 hay desempate rápido (15+10) de a 2 partidas,
  máx. 6; si sigue empatado el campeón conserva la corona. "Final Rounds → Always simulate" lo simula todo.
  Debug: `FL_CHESS.world()`. Probado en el juego (jugar, simular desde el tablero, rendirse, marcador). Mod ahora `chess.js?v=3`.
  Textos nuevos agregados a `add_chess_i18n.py` (UI + RULES). Backup: `i18n\work\chess.js.bak-pre-world`.
- **i18n genérico (`i18n.js`):** (a) entre plantillas que encajan gana la de **más texto literal**, no la primera;
  (b) las plantillas muy genéricas (<10 letras literales, ej. `{1} and the {2}`) se rechazan si capturan 3+ palabras
  sin traducción (antes: "A famine struck Somalia **y los** Horn of Africa"; ahora queda entero en inglés, sin mezclar);
  (c) los valores capturados de 2+ palabras también se traducen como oración/regla. Costo ~22µs por miss.
  Backup: `i18n\work\i18n.js.bak-pre-spec`.
- **`i18n\glossary.tsv` (NUEVO):** ~150 valores sueltos que mete el juego (man, boy, kid, nanny, cop, delitos como
  "drug trafficking", lugares, etc.), con es/pt. `build_i18n.py` lo suma a los eventos (weak: la UI gana). Para agregar
  más: editar el tsv y correr `python -I build_i18n.py`.
- **Arreglado después (misma sesión):** artículo + valor ("the cop" → "la policía", con género por terminación, solo es/pt),
  plurales `{2}`="s" ("audición" → "audiciones"), tokens pegados a una letra pueden ir vacíos (singular: "1 year ago"),
  y "a el"/"de el" → "al"/"del" en español. Lo del `�` era un artefacto de la consola: **no hay U+FFFD reales** en `events.tsv`.
- **Sigue pendiente del i18n:** la concordancia de género con valores desconocidos ("Una {1} llamada") y el género de
  sustantivos ambiguos (siempre sale "la policía").

## Vendedores de armas (arms.js) — 2026-11-21 (sesión 2)
- **Archivo:** `arms.js` (lo carga `gang.js` al arrancar, o sea que sale con el código `13131313`; `arms.js?v=3`). Backups: `i18n\work\arms.js.bak-pre-kits`, `gang.js.bak-pre-arms`.
- **Dónde está:** Actividades → "Gun Dealers" (16+) y en el menú de la pandilla (fila "Gun Dealers"). Estado: `state.arms` (`guns`, `carry`, `mags`, `parts`, `license`).
- **Tienda legal** (18/21 años): Glock 19, revólver .38, .45; escopetas (pump, doble cañón, táctica); caza (.22, rifle de venado .308, arco).
  Se pueden llevar y usar; **si te arrestan en algo ilegal llevándola te suma un cargo** (`… with a firearm`, +2/+4 años) y te la quitan.
- **Dealers de la calle** (16+): **Lil Ray** (Street Glock, switches, cargadores Glock), **Mr. Ortiz** (Draco, Mini Draco, ARP, Mini ARP, auto sears; +40% si no eres de la pandilla rango 1+), **Ghost** (accesorios y todos los cargadores).
  Riesgo al comprar ilegal: 5% estafa, 3% trampa de la policía (arresto). Armas ilegales: cargo `… and illegal firearm possession` (+3/+6); con switch/auto sear: `… and possession of an automatic weapon` (+6/+10).
- **Accesorios por arma** (slots optic/muzzle/grip/rail/stock/trigger): mira punto rojo, mira 4x, compensador, silenciador, empuñadura vertical, láser, linterna, brace, **switch** (Glock, 8 colores) y **auto sear** (Draco/ARP). **Cargadores sueltos** (ext y tambor por familia glock/ak/ar) que se compran aparte y se cargan desde el detalle del arma; el que sacas vuelve al inventario.
- **Kits ya armados** (sección "Ready-Made"): 9 armas con accesorios instalados, 10% más baratas que por separado (`KITS` en `arms.js`). El nombre del kit solo se ve mientras la config siga igual.
- **Ícono compuesto:** `pic(gun)` arma un SVG (PNG base de `guns/` en base64 + piezas dibujadas encima, posiciones en `POS`) y se usa en la lista del arsenal, el detalle (preview grande) y los popups. Con switch instalado cambia a `guns/switch-<color>.png`.
  Limitaciones: los Mini usan el mismo PNG que el grande; `glock.png` ya trae cargador extendido dibujado; el brace del ARP queda detrás del tubo.
- **Con la pandilla** (`gang.js`): `FL_ARMS.power()/heat()/busted()` se suman al poder, calor y arrestos; solo una arma a la vez (`FL_GANG_STOW`). La "Strap" vieja de la pandilla sigue funcionando.
- **Caza:** licencia $60 (una vez), 2 salidas por año, 3% de accidente; paga $60-320.
- **i18n:** `arms.js` entra a `add_chess_i18n.py` (T() + reglas de los cargos dinámicos). Los textos de cargos que arma el juego ("I was arrested for …") siguen sin traducción completa.
- **Pendiente:** probar en vivo la integración con el menú de pandilla (la prueba se canceló), íconos propios de escopetas/rifles (hoy son SVG simples), ícono propio de Mini Draco / Mini ARP.

## Carrera especial "Gang Bang" (gang.js) — 2026-11-21
- **Cómo se activa:** Redeem Code **`13131313`**. Aparece de primera en Ocupación → Special Careers (envuelve
  `openSpecialCareers`). El ícono es `special/gangbang.png`: una bandana roja de cachemira hecha en SVG, de 120×120.
- **Contexto:** el menú de "Special Careers" del juego (`game.html:15090`, `SPECIAL_PACKS`) trae paquetes
  (Street Hustler, Músico, Político, Atleta, Papa…) pero el dev dejó `SPECIAL_LOCKED = true`: todos salen grises y dan
  "job pack is not available right now". Nuestro mod **inyecta una fila nueva arriba de la lista**; no desbloquea los
  demás. (Los 5 trabajos de la categoría `"Streets"` sí existen en `jobs.js:1229`, no son de pandillas.)
- **Pandillas (nombres elegidos por el usuario):** Gangster Disciples 💎, Black Disciples 🖤, Slime Gang 🐍,
  Toss Gang 🎲, 95 Mob 💯 y Bloodhounds 🐕. Se elige al unirse (selector).
  - **Bloodhounds confirmado** por el usuario (2026-11-21).
- **La gente es 100% ficticia** (decisión del usuario tras pedir personas reales y que yo lo rechazara):
  - Al unirte se generan 11 personas con nombre, apodo, edad, papel (OG, Big Homie, Homie, Lil Homie, rapero,
    buscavidas) y "confianza". **Sin rangos formales** para ellos. Con los años envejecen, suben de papel y a veces
    alguien cae preso o se sale (entra un Lil Homie nuevo).
  - Interacciones: pasar el rato, pedirle consejo a un OG, meterte en la canción del rapero, o que el buscavidas te
    meta a un negocio.
  - **No meter personas reales ni sus rangos**: son alegatos o gente privada. Está en las reglas de arriba.
- **Tu progreso propio** (Prospect → Soldier → Enforcer → Lieutenant → Shot Caller → Boss) **se dejó**, porque es lo que
  hace avanzar la carrera. Se le ofreció al usuario quitarlo y **todavía no respondió**.
- **Qué trae:** iniciación (golpiza o trabajo), 8 acciones (4 por año; "Lay Low" no cuenta), "calor policial" que sube
  la probabilidad de arresto (usa `arrest(delito, [min,max])` del juego: juicio y cárcel reales), parte de la plata
  según rango y **10 eventos** al hacer Age up.
- **Estado:** `state.gangLife`. El nombre de la carrera es la constante `CAREER` arriba en `gang.js`.
  - ⚠️ "Gang Bang" **también significa sexo grupal en inglés**; se avisó y el usuario lo mantuvo. Cambiarlo es una línea.
- **Armas ("The Strap"):** íconos propios en `guns/`.
  | Arma | Precio EE. UU. | Bono en robos/guerras | Calor extra | Requisito |
  |---|---|---|---|---|
  | Glock con cargador extendido | $1,200 | +8% | +3 | — |
  | Glock con switch (8 colores) | $2,500 | +14% | +6 | — |
  | ARP | $3,500 | +18% | +8 | rango Enforcer |
  | Draco | $4,000 | +22% | +10 | rango Enforcer |
  - Desde los 16 años. Se lleva **una sola** a la vez (cambiar o "Guardarla"). Precios con `price()` (cambian por país).
  - Si te arrestan armado te quitan el arma; la mitad de las veces el cargo es "possession of an illegal firearm"
    (2-6 años; 3-8 si era el switch o la Draco).
  - Colores del switch: rojo, azul, verde, dorado, rosado, morado, naranja y blanco.
- **Textos:** van con `T("en","es","pt")`; `add_chess_i18n.py` los saca de `gang.js` y de `chess-events.js`.
- **Pendiente que se ofreció:** íconos del menú de armas más claros y grandes (hoy son oscuros y el color del switch
  casi no se distingue a 120px).

## Vehículos, grids, concesionarios y fútbol por semanas — 2026-11-23/24 (sesión 3)
- **Grids** (hojas 4x3 sobre negro) en `_art-src/grids/`; `_art-src/split_grids.py` las corta a PNG transparentes (`python _art-src/split_grids.py`).
  Salieron: `cars/honda-*`, `toyota-*`, `koenigsegg-*`; `aircraft/plane-*`; `houses/home-*` y `mansion-*`; `jewelry/watch-NN-*` y `cuban-*`; `dealers/<marca>.png`.
  Los sprites nuevos de carros van a 120px de ancho; motos/boats/aircraft a 300px (originales grandes en `_art-src/vehicle-full-size/`).
- **cars.js:** 190 modelos, solo marcas reales (las inventadas Halden/Ventura/etc. se quitaron; los PNG `lux-*` que quedan los usa `special-life.js`). Cada carro lleva `[make, model, type, precio, sprite, color]`.
  Precios = MSRP aproximado de memoria en `car_prices.json`; `update_car_prices.py --apply` los vuelca a `cars.js` (la búsqueda web no sirve: DDG/Bing bloquean bots).
  `yearPick()` (game.html) hace que cada año salga ~55% de los carros con arte propio (hash de modelo+año).
- **Precios x2.25:** `goodsLvl("car")` en game.html multiplica por `window.VEHICLE_PRICE_MULT || 2.25` (todos los dealers de carros) y `elite-life.js` multiplica su `CATALOG` (barcos, aviones, helis, sportbikes). Casas, joyas e instrumentos NO.
- **Concesionarios por marca** (`BRAND_DEALERS` en game.html, junto a `restockCars`): 12 marcas con su edificio; abren o cierran cada año por hash (Toyota/Ford 90% ... Ferrari 35%, Lambo/Rolls 30%), venden solo su marca, aparecen en Shopping debajo de los 3 dealers normales ("Official dealership"). Se regeneran al hacer Age up; no en la era de 1800.
- **houses.js** +52 casas, **jewelry.js** +32 piezas, **elite-life.js** +12 aviones.
- **Fútbol (`futbol.js?v=5`):** el entrenamiento de un clic al año ahora son **bloques de semanas** (`weekBlockStep`): pro = pre-season / liga / early / copa / mid / continental / run-in; juvenil = 3 bloques. Cada bloque: elegir foco (10 + descanso) e intensidad Light/Normal/Hard (botón que la cicla).
  Estado nuevo: `f.fatigue`, `f.plan`. Hard sube la progresión pero acumula fatiga; fatiga alta baja form/fit y sube el riesgo de lesión; la progresión depende de potencial, edad, coach y juvenil. La fatiga baja 45 al empezar cada temporada.
  `wageFor` tiene prima de superestrella (hasta ~32M para skill/fama máximos; promedio de la liga ~2.3M).
- **Economía (2026-11-24):** todo precio/sueldo está en **dólares de 2026** y se indexa con `inflFx(r)` (game.html, junto a `wageLvl`): `r^(año_en_juego-2026)`, r=1.03 (1.08 coleccionables); no aplica en la era de 1800. `window.inflFx` lo usan los mods.
  - **Carros (dealers legacy = 3 normales + luxury):** `makeCar(e, t, untouched)`: nuevo = `precio*goodsLvl*2.25*inflFx`; usado = `nuevo*0.85^edad` (sin ruido); `window.PRICE_OVERRIDES` (en cars.js, **vacío**) = precio fijo exacto por "Make Model"; `window.COLLECTIBLE_CARS` (Bugatti Chiron, LaFerrari, Enzo y los Koenigsegg) se inflan al 8%. `untouched=true` lo usan los **concesionarios de marca** (precio original, sin x2.25 ni inflación). `carro.collectible` queda en el objeto.
  - **Sueldos:** `wage()`/`wageHr()` multiplican por `inflFx()`; cada Age up los trabajos que tienes suben 3% (`payAnnualIncome`); también `wageFor` y el contrato de fútbol (`f.lastInflYear`), carreras de `special-life.js` (carreras y jueces), actuación, iglesia y ofertas de baloncesto. **No** inflados: sueldos de empleados de `drugs.js`, ingresos de fighter/musician/cartel/mafia.
  - **Impuestos:** `tax-engine.js` ya era progresivo (tramos por país). Ahora `calculate` desinfla el ingreso, aplica los tramos de 2026 e infla el resultado (wrapper `u` sobre `u0`) para que la inflación no empuje a todos al tramo máximo. Tasa efectiva en EE. UU.: ~19% con $50k, ~49% con $3M.
  - **Mantenimiento:** `carUpkeep(precio)` = `5.63*precio^0.637` al año (≈$4k con un carro de $30k, ≈$75k con uno de $3M), mensual en `expense`; los carros ya comprados lo recalculan cada Age up.
  - **Lifestyle creep:** en cada Age up se cobra 0.5% de los activos entre $250k y $1M, 1.2% entre $1M y $5M y 2% por encima (`state.lifestyleCost`, log "Keeping up my lifestyle…"); escala con el país.
- **Subastas v2 (`auctions.js?v=2`, mod `auction-house`):** fila "Auction House" al final de Shopping (18+, envuelve `openShopping`). Estado: `state.auction` (`year, lots, rivals, mkt, bubble, gala, board, estateDone`), `state.art[]` (cuadros, tokens, tablero) y `state.silly[]`.
  - **Comprar:** catálogo anual de 6-10 lotes (hypercar coleccionable, exóticos, carro barato, relojes/cadenas, 2 cuadros de artistas ficticios, 2 tokens digitales si hay burbuja, lote "US Marshals seizure" seguro si eres de pandilla, 25% si no). 10 rivales ficticios (con jeque anónimo y coleccionista suizo) con máximo privado, agresividad y memoria (`heat`). **Bidding war:** si un rival supera a otro, hasta 3 re-pujas seguidas x1.5-3 el incremento. Reserva por lote, comisión de la casa 10/15/20/25% según el valor, **falsificaciones** (6% hypercars, 10% joyas, 14% cuadros, 20% tokens) salvo que pagues autenticación (3% del estimado, antes de pujar).
  - **Pandilla:** con `gangLife.member` y heat>0 aparece "Shell company" (+20% de comisión, baja `gangLife.heat` entre 3 y 20 según el monto).
  - **Vender:** "Your collection": consignas carros (sin préstamo), joyas y cuadros; simula 3-5 postores, reserva 50%, comisión 12%. **Fama** (`fameOf()`: fútbol, actuación, música, pelea, ajedrez campeón, pandilla) multiplica hasta x2.5 ("Owned by ..."); **infamia** (`state.serial.kills/fame`) hasta x4 con textos de coleccionistas de memorabilia macabra. Al morir (`die()` envuelto) la familia subasta todo (x0.85 y 10% de comisión), suma a `state.money` y deja una línea en el log.
  - **Inversión:** cada Age up los carros coleccionables suben 8% (crisis -22%, boom +25%), el índice de arte se mueve (crisis/escándalo), los tokens digitales se inflan x1.6-2.6 por año durante una burbuja y al reventar valen x0.02.
  - **Eventos:** cuadro en el ático (2%/año), hallazgo en venta de garage (3%), juez sobornado con un cuadro (12%/año si `state.job.judge`), gala benéfica (gastas de más: felicidad +3..+12 y a veces cuadro), tablero del Mundial de ajedrez (`state.chess.champion`).
  - **$SILLY (memecoin "Silly Penguin", ícono `freelife/penguin1.png`):** en "Hot tokens"; compras con $1k/$5k/$50k/$250k (x inflación). Al siguiente Age up siempre vale $0 (`sillyRug`): "You invested $X in $SILLY. The developer stopped updating it on <fecha>. Your investment is now worth $0.00." con fila "Change -999%". Es independiente del sistema de cripto de `invest.js` (que ya tiene logos en `freelife/crypto/`).
  - **No conectado todavía:** Politician (subastas benéficas para imagen) y barcos/aviones/casas como lotes. **Sin probar en vivo** (hotfix pendiente junto con lo demás).
- **Casino (`casino-games.js?v=1`, mod `casino-games`):** el juego solo trae **Blackjack** (`blackjackBet`/`blackjackTable` en game.html, ~línea 87600); Craps, High-Low, Keno, Roulette, Slots, Sports Betting y Texas Hold'em son filas de `openCasinoGames` que llaman `comingSoon()`, y con la piel `flui` ni se muestran (la sección "Premium" se oculta). El mod envuelve `openCasinoGames`, agrega la sección si falta y los activa.
  - **Estilo del blackjack que se reutiliza:** mismo modal (`ev`/`evWrap`, `.jcw`), pantalla de apuesta (`gm-range`, "Session Earnings", `state.casinoLife`), cartas `.bj-card` 40x56 que vuelan desde el borde derecho en 70 ms (`.bj-fly`) y se voltean con `squeeze` (135 ms), botones `.bj-pop` (80 ms), `.bj-result`, sonidos `sfx("CardFlip"|"CardFlipFast"|"CasinoWin2"|"CasinoLose2"|"CasinoOpen")`, Golden Neko (+20% de la ganancia, `nekoLuck()`), 2 casinos al azar (`state.casinos`) y crupier con cara (`npcFace`/`randomLook`), notice con frase y vuelta a apostar. Al final de cada mano hay "Again" (misma apuesta) y "Continue".
  - **Juegos:** Roulette (europea, tira horizontal que desacelera, 10 tipos de apuesta incl. número, paga 2.7% de ventaja), Slots (3 carretes con tiras verticales, RTP ~93%, pagos x7/x14/x27/x55/x130/x500 y dos limones devuelven la apuesta), High-Low (la apuesta se multiplica por 0.96/prob con cartas reales del mazo; los empates pierden; cash out), Craps (pass / don't pass, dados que ruedan, punto), Keno (80 números, 1-10 picks, 20 bolas, tabla calibrada a ~92% RTP), Sports Betting (3 partidos de equipos ficticios, cuotas Poisson con 6% de margen, marcador en vivo de 90 min) y Texas Hold'em heads-up contra el crupier (ante + check/bet/fold por calle, evaluador de 7 cartas y equity Monte Carlo para el crupier).
  - Las apuestas se descuentan al empezar y el pago se suma en `settle()`. **Sin probar en vivo** (hotfix pendiente). Textos en inglés (sin i18n).
- **Sesión 4 (2026-11-24), todo sin probar en vivo (hotfix pendiente):**
  - **Renombre a "YourLife":** `Free Life` -> `YourLife` y `FREE LIFE` -> `YOURLIFE` en el texto visible (game.html, settings.js, mods.js, modloader.js, i18n, docs...). **No se tocó:** las líneas de copyright/licencia del dev (`Copyright`, `Unauthorized`, `©`), la carpeta de assets `freelife/`, la clase CSS `.flui`, las claves `bitlifepp-*` ni los PNG (`logo.png`, `logo-wide.png`, `logo-west.png` todavía dicen "Free Life" en la imagen). Después hay que correr `python -I i18n/build_i18n.py` (ya se corrió).
  - **Mod Loader = el nuevo Workshop** (`modloader.js?v=20`): una sola pantalla "MOD LOADER" con (1) los mods propios, (2) los mods por código del viejo Workshop (`BL_MODS.REGISTRY`, sin escribir código; se guardan en `bitlifepp-ported`) y (3) el resto de interruptores del Workshop, que se reutilizan llamando a la función original `openModSettings()` (guardada en `origWorkshop`) para que sigan todos sus casos especiales. `window.openModSettings` ahora apunta al Loader (Settings, menú principal). Se quitaron las 6 entradas "flags" falsas del loader (apuntaban `src` a un PNG) y el interruptor `modLoader` del Workshop; el Loader siempre está activo. La fila de Settings se llama "Mod Loader".
  - **Emojis Apple en el tema normal** (`settings.js?v=83`): `ao()` hace que `img[src^="emoji/"]` pase a `freelife/apple/<hex>.png` cuando el icon pack no es "bitlife" y no es 2018 (todos los `emoji/*.png` tienen versión Apple). Sólo emojis; el arte de la piel Free Life (`c[...]`) sigue exclusivo de `flui`. Los dados del casino dejaron de usar glifos Unicode (pips con CSS).
  - **Precios de carros por clase** (`tierClamp` en game.html): modestos 1k-150k, medios 150k-550k, lujo 550k-20M, según el precio de catálogo, x inflación; la depreciación se detiene en el piso de la clase y los coleccionables no se deprecian. Bases subidas en `car_prices.json`: Rolls-Royce Ghost 600k, SF90 650k, Revuelto 850k, Enzo 2.5M, LaFerrari 3.5M.
  - **Fútbol:** `futbol.js` estaba **subido incompleto** (terminaba en `//__PART4__`): `yearTick()` nunca se llamaba, así que las semanas, eventos y temporada no arrancaban solos. Ahora se engancha a `#ageBtn` (como chess/gang) con un candado en captura mientras hay decisiones en pantalla (`flowActive` en memoria, porque `f.pending` se guarda con la vida). Nuevo: objetivos de temporada (`makeObjectives/objectiveStep/objectiveReview`, 3 metas por año con premio/castigo), **derbi jugable** (`keyMatchStep`, 6 momentos con decisiones según tus atributos), **eventos con memoria** (`f.memLog` + 6 `FOLLOWUPS` que reaparecen por decisiones pasadas), **menú por pestañas** Today/Career/Club (`applyTabs`). `futbol.js?v=9`.
  - **Casino** (`casino-games.js?v=2`): las animaciones de ruleta y slots no se movían porque se disparaban antes de mostrar el popup (display:none = sin layout ni transiciones); `openModal` ahora abre primero y arranca en 2 frames. Botones y selects más grandes para touch, keno en 8 columnas, atajos de teclado en PC (Enter/Esc/1-9/flechas).
  - **Scroll del popup de Adopción:** el CSS original `#ev:has(> .jcw > .jm-x){overflow:visible !important}` impedía hacer scroll en popups altos. Script al final de game.html: si el contenido no cabe, activa `overflow:auto !important` y mueve la X adentro.
  - **Licencias** (`licenses.js?v=1`, mod `licenses`): Activities -> Licenses. Moto, CDL, bote, piloto privado, helicóptero y permiso de armas, cada una con examen escrito (preguntas al azar, nota mínima) y prueba práctica (mini-juego de timing en el mismo popup). Requisitos de edad, previas (moto/CDL piden la de manejar; heli pide piloto), tarifas con inflación, reintento más barato, permiso bloqueado con antecedentes (`state.felony`). Desbloquean sportbikes, barcos, aviones, helicópteros (`elite-life.js?v=6`), compra legal de armas (`arms.js`) y trabajos de chofer (`felonCheck` en game.html). Estado: `state.licenses`, `state.licProg`; la de manejar sigue siendo `state.license`.
- **Peinados nuevos al nacer:** el pack completo (`HAIR_PACK`, 80 estilos con PNG en `hair/`) estaba detrás del flag `hairPack`, que se reseteaba a false con vidas viejas. `hairPackOn = () => true` (game.html), la pestaña de New Life se llama "New Hairstyles" (antes "Barber Expanded") y `randomLook` mete un peinado del pack con 30% desde los 8 años (los 3 candidatos de nacimiento y NPCs). Pendiente de confirmar: la carpeta Downloads/emoji apple (1766 PNG Apple con nombre en vez de código hex, fechada 2026-11-22) NO está importada en el juego.
- **Joyas en el avatar (`jewelry-wear.js?v=1`, mod `jewelry-wear`):** 4 slots (`state.jewelEq = {neck, wrist, mouth, ears}` -> ids de `state.jewelry`): cuello (chain/necklace/pendant/choker), muñeca (watch/bracelet), boca (grillz, 3 piezas nuevas en la joyería con PNG `jewelry/grillz-*.png` hechos con `grillz.py`) y orejas (earrings). Se equipan desde Assets > Jewelry > pieza > "Wear" (fila agregada en `jewelry.js`, `T()`). El avatar es solo la cabeza 250x250, así que con cuello o muñeca la cara se reduce a 0.82 y se dibujan cuello, camiseta y antebrazo; orejas y boca se anclan con la silueta de `stage*-base` (ojos `ACCESSORIES.eyeY`, mentón, ancho de cara). Se engancha en `composeFace` (game.html) con `FL_DRESS_JEWELRY(canvas, info)` solo para `state.look`, y `FL_JEWEL_KEY()` entra en las claves de caché del avatar (`renderAvatar` y `npcFace`).
- **Texto "I was born into a famous family":** salía en CADA carga del juego (el `setTimeout` de 700 ms de Famous Life llamaba `say()` siempre). Ahora solo si `state.age === 0` y una vez (`state.famousBornSaid`).
- **Fútbol, entrenar cuando tú quieras (`futbol.js?v=11`):** los bloques de entrenamiento ya NO son pasos forzados de la temporada. Cada temporada da `f.trainLeft` bloques (4 pro, 3 juvenil) y los usas desde la pestaña Today de tu trabajo (fila "Training" -> `trainNow`, con botón "Not now"); no se puede entrenar lesionado. Fatiga, intensidad y lesiones siguen igual. **Tope de eventos:** máximo `MAX_EVENTS = 6` tarjetas de evento por temporada (`f.evCount`): cuentan los momentos de decisión de liga/copa/juvenil (`counted()`) y los eventos al azar (2 a 5 espacios por año). Excepciones que no cuentan ni se saltan: seguimientos de decisiones pasadas (`fu_*`), eventos especiales (`SPECIAL_EVENTS`: injury, callup, retirement, firstteam, clause, scouts, captain), derbi, copas (`momentStep("cup")`), selección y Mundial/torneos de selecciones, continental (Champions y similares), traspasos/contratos, resultados y objetivos. Solo cuentan los momentos de liga/juvenil y los eventos al azar.
- **Lote 2 de grids (2026-11-24), cortado con `_art-src/split_grids2.py`** (fuentes en `_art-src/grids/`): **trofeos** (`trophies/`: `uefa-*`, `award-*`, `intl-*`, `nba-*`; 48 PNG), **Pagani** (12 en `cars/pagani-*`) y **Ram** (12 en `cars/ram-*`), **joyas** modernas (`jewelry/gem-*`) y ancestrales (`jewelry/anc-*`), **24 peinados** a color (`hair/nh01..nh24-hair-base.png`, 500x500 como el resto del pack).
  - **Trofeos de fútbol:** `trophyArt(nombre)` en futbol.js elige el PNG por competición o premio (Champions, Europa, Conference, Libertadores, Concacaf, Mundial, Euro/Copa América/Gold Cup/Copa Africana según la confederación de tu liga, Balón de Oro, Bota y Guante de Oro, The Best...). La selección ahora juega "European Championship / Copa América / Gold Cup" en vez de "Continental Championship". Nuevos premios: Kopa Trophy (<=21 años) y Yashin Trophy (porteros). Las vidas viejas también ven el arte nuevo (se resuelve al mostrar el cabinet).
  - **NBA:** fila "Trophy Case" en el job de baloncesto (`cabinetScreen` en basketball.js): Larry O'Brien por cada título y un trofeo por premio (MVP, Finals MVP, DPOY, ROY, Sixth Man...).
  - **Carros:** Pagani (12 modelos, coleccionables) en el luxury y en el dealer de Lamborghini; Ram (12 trucks) en la lista normal. **Joyas:** 24 piezas nuevas en la joyería (las ancestrales son raras y caras; collares/pulseras/aretes/relojes se pueden usar con Wear). **Pelo:** entradas `nh01-nh24` en `HAIR_PACK` (color fijo, sin tinte).
- **Limpieza para pushear:** se borraron los `.txt` de extracción de textos de la raíz, `CONTINUAR.txt`, `hello.txt`, todos los `*.bak*`, `__pycache__`, `_art-src/vehicle-full-size`, `desbugeado/` y los backups viejos de i18n. Se agregó `.gitignore`. La carpeta vacía `GRIDS/` (y su gemela `grids/`, es la misma en Windows) no se pudo borrar porque Windows la tiene abierta: cerrarla en el Explorer y borrarla a mano.
- **Backups:** ya no se guardan en el repo (se limpiaron para el push); el historial queda en git.
- **Sin probar en vivo:** todo esto solo pasó `node --check` y la verificación de que existen los PNG. Falta jugarlo (dealers de marca, bloques de semanas, precios).
- **Ideas de fútbol pendientes** (las que se propusieron): partidos clave jugables por momentos, eventos con memoria, objetivos por temporada, menú por pestañas.

## Sesión 5 (2026-11-24): fútbol, Mental Health, herramienta de grids
- **Fútbol (`futbol.js?v=15`):** (1) `applyEffects` ya no pisa `f.skill` con el promedio de atributos (movía 70% -> 54% tras entrenar): ahora suma el cambio del promedio. (2) El flujo de temporada es una cadena de popups; si uno se pierde (`jCard` sale temprano) `flowActive` quedaba en true y Age up se bloqueaba hasta recargar: `flowStalled()` detecta que no hay popup/cola/notice por >2.5s y retoma el flujo (`resumeFlow`). (3) Cabinet: Youth MVP sale en el review juvenil, "National team titles" separado de individuales en Career numbers, tope de trofeos 400.
- **Mental Health (`mentalhealth.js?v=2`, mod `mental-health`):** Activities -> Mental Health. Depresión, ansiedad, ADHD, bipolar (I/II), PTSD sobre el sistema base (`state.mind`, `state.depressed`, ills Anxiety/ADHD/PTSD, que adopta y neutraliza para no duplicar el drenaje). Estado `state.mhx`: `c[id]` con `lvl` (carga de síntomas), `dx` (false = oculto, "wrong" = bipolar mal diagnosticado como depresión), `meds[]`, `tried`, `bad`. Síntomas ocultos hasta una evaluación (que puede fallar); efectos anuales en stats, `state.job.perf` (o `state.school.grades`) y `rel` de la gente cercana; terapia global (`m.th`: semanal/quincenal/mensual/grupo, terapeuta con `eff`), meds por condición (respuesta individual, efectos secundarios, adherencia; dejarlas de golpe recae; antidepresivo solo puede disparar manía en bipolar), autocuidado, hablar con alguien, crisis con líneas de ayuda reales, sin muerte por suicidio. Combate de Military Expanded = trauma (envuelve `runMilEvent`); activos y veteranos no pagan. Costo anual en `payCare` (si no alcanza, se pausa).
  - **Antidepresivos con arte:** 12 cajas en `meds/` (Zoloft, Lexapro, Prozac, Cymbalta, Effexor, Wellbutrin, Remeron, Desyrel, Paxil, Celexa, Elavil, Trintellix) con ficha propia en `MEDS`; `recommend()` hace que el psiquiatra recomiende una según comorbilidades, edad, severidad, lo ya probado (`r.tried`) y los efectos que te hicieron dejar otra (`r.bad`); pantalla `openMedList` con imágenes. Los ids `ssri`/`atyp` quedan ocultos (`hide`) por compatibilidad.
  - **Sadismo = rasgo, no trastorno** (`state.mhx.sad`: `v`, `urge`, `guilt`, `known`): el log de vida (MutationObserver con `VIOLENT`) dispara `onViolence`: felicidad +, reembolsa la culpa base (`mindBump`), `Remorse` bajo, Melon (brutality +, disguise -) y `state.serial.notice` +; urge que se resiste, se redirige (gimnasio), se trata o se actúa. Meter el medidor en la pantalla de Crime debajo de Melon.
  - **Sin probar en vivo del todo:** el flujo evaluación -> terapia -> meds y el sadismo vía log sí se probaron con CDP; los popups de eventos (urge, crisis, manía, pánico) y el tick por Age up NO se vieron en pantalla. Textos en inglés, sin i18n. Debug: `FL_MH.give("ptsd")`, `FL_MH.tick()`, `FL_MH.eventNow("mania")`, `FL_MH.crisis()`.
- **Herramienta de grids:** `python -I _art-src/split_grid.py [--list] [--only texto] [--preview]` lee `_art-src/grids.json` (src, cols/rows, names izq->der y arriba->abajo, out, box, cut, keep_all, mode hair). Para un grid nuevo: PNG en `_art-src/grids/` y una entrada en el json. Reproduce idéntico los grids de trofeos, carros, joyas, pelo y meds. `split_grids2.py` sigue como librería de helpers (`cutout`, `fit`, `cells`, `pad`). `--preview` escribe `_art-src/_preview/` (ignorado en git).

## Cómo está hecho el juego (lo que se averiguó)
- **HTML, CSS y JS puro, escrito a mano.** Sin React/Vue/jQuery y sin bundler (ni webpack, Vite ni imports). Solo un
  **minificador** al final: el script principal es una línea de ~2.09 millones de caracteres con `!0`/`!1` y variables
  de una letra (por eso se prettificó). Los ~108 `.js` son `<script>` clásicos con funciones globales.
- **La UI son strings de HTML:** cada menú es `sList.innerHTML = '<div class="sec">…</div><div class="row">…'`. El
  contenedor es `.phone` (~430px; en modo PC solo lo centran). Variables CSS (`--blue`, `--money`…) en `game.html`.
- **La "piel" de YourLife** (el pingüino azul) la mete `settings.js`: pone la clase `.phone.flui` e inyecta ~21k
  caracteres de CSS (línea 1047), más canvas animados de nieve (`fl-hsnow`, `fl-logsnow`). Se apaga en Settings → UI Pack.
- **Fuentes:** Avenir Next/Mulish/Nunito para el texto, **Molot** para títulos, Courier para recibos. Íconos: emoji de
  Apple en PNG (`emoji/`, `freelife/apple/`) y arte propio en `ui/`, `jobev/`, etc.
- Las claves `bitlifepp-*` del `localStorage` y los nombres de assets (`navbarBitizenSeal.png`, camelCase estilo iOS)
  sugieren que el proyecto nació como clon de BitLife ("BitLife++"). **No mezclar nada de esto con proyectos propios.**
- **Helpers del juego que usan los mods** (números de línea de `game.html`, cambian si se re-prettifica):
  | Qué | Dónde |
  |---|---|
  | `jCard({tag, iconSrc, title, lead, rows, choices:[[texto, fn]]})` popup con decisiones | 48119 |
  | `socSelCard({icon,title,lead,label,opts,btn,onGo})` popup con selector (cierra `screen`) | 24214 |
  | `notice(título, texto, cb, true)` aviso "toca para continuar" · `iosConfirm` · `queuePopup(fn)` | 78022 · 55285 · 78537 |
  | `arrest(delito, [añosMin, añosMax])` flujo completo: cargos, juicio, cárcel · tabla `CHARGES` | 48182 · 47979 |
  | `openActivities` · `openSpecialCareers` · `openOccupation` | 45940 · 15090 |
  | `localPrice(n)` (mínimo 5) · `usd(n)` · `say(texto)` log de vida · `chaChing()` · `renderStats()` | 12102 |
  - `state` = `{age, money, gender, first, stats:{Happiness, Health, Smarts, Looks}, …}`. **Se borra y recarga al
    cambiar de vida** (`Object.keys(state)…delete`, líneas 72554 y 83462), así que cada vida tiene su `state.chess` y
    su `state.gangLife`.

## Receta para hacer un mod nuevo (así se hicieron los dos)
1. Un `.js` en la raíz, todo dentro de un IIFE. **No toca `game.html`.**
2. Registrarlo en `mods.js`, dentro del objeto `e`, con `src` en vez de `flags`:
   `64646464: { name, icon, desc, src: "chess.js?v=1" }`. Con `src`, el juego inyecta el `<script>` solo (`mods.js:80`, la función que hace `createElement("script")`).
3. `boot()` espera (`setTimeout`) a que existan `openActivities`/`sList`/`#ageBtn` antes de engancharse.
4. **Enganche al menú:** guardar la función original, reemplazarla por una que la llame y le inserte una fila con
   `insertAdjacentHTML` (así lo hacen `vampire.js` y nuestros dos mods).
5. **Enganche al Age up:** `document.getElementById("ageBtn").addEventListener("click", () => setTimeout(tick, 0))`.
6. **Estado:** `state.algo`, JSON puro (sin funciones), se crea perezoso para no romper saves viejos.
7. **Textos:** `T("english","español","português")` y correr `add_chess_i18n.py` + `build_i18n.py`.
- **Cómo activar un mod a mano (tests):** `localStorage["bitlifepp-ported"] = JSON.stringify([{code:"64646464",on:true}])`
  y recargar. Para el jugador: Settings → Mods → Redeem Code.
- **Códigos del juego en `mods.js`** (del dev): Military Expanded `06061944`, Extended Hair `24681012`, Tattoos
  `13381313`, Infamous Killers `18880831`, Unlock All Themes `77777777`, Family Pack `01011900`, Infinite Lovers
  `14021402`. **Los nuestros:** Chess Career `64646464`, Gang Bang `13131313`.
  - `window.REDEEM_CODES` se usa en `mods.js:120` pero **no se define en ningún archivo**: un mod podría definirlo
    para que un código ejecute una acción directa.

## Arte propio (`_art-src\`)
- **Estilo:** emoji de Apple (degradado de cilindro, brillo arriba a la izquierda, borde suave y sombra), sin logos ni
  marcas. Todo se dibuja en **SVG dentro de un `.html`** y se renderiza a PNG transparente.
- **Fuentes guardadas:** `bandana-icon.html`, `glock-extended.html`, `glock-switch.html`, `draco.html`, `arp.html`,
  `switch_colors.py`, `make_beard.py`, `full_face.py`, `beard_sheet.py`, `chess-pieces-demo.html`, y los renderizadores
  `snap-transparent.mjs` / `snap.mjs`.
- **Cómo se renderiza:** `node snap-transparent.mjs <archivo.html> <salida.png> <ancho> <alto>` (usa el Brave de debug
  en el puerto 9333 con fondo transparente). Luego se recorta al contenido y se escala a 114px en un lienzo de 120×120
  para que pese igual que los íconos de `special/` y `emoji/` (los scripts de ejemplo están en el historial; son ~10
  líneas de Pillow).
- **Barba (`make_beard.py`):** las caras son **capas blancas de 250×250** que el juego pinta por código
  (`composeFace`, `game.html:13236`: color de pelo para barba/cejas, de piel para la base). Hacen falta 3 PNG
  (`stage3/4/5-facial-hair14.png`, una por edad adulta) recortados con la silueta de cada base.
  - Las mutton chops (patillas) están hechas y en la raíz, **sin instalar**. Para instalarlas: mover los 3 PNG a
    `faces/`, agregar el `14` a `"facial-hair"` de las etapas 3, 4 y 5 en `faces/manifest.js`, cambiar `length: 14` →
    `15` en Shave (`game.html:56153`) y el `13` → `14` en el random de vida nueva (`game.html:14512`).
- **Armas:** Draco = **Micro Draco** (guardamanos de madera clara solo abajo con tope al frente, banana grande, culatín
  marrón); ARP = AR pistol **sin accesorios** (sin mirilla ni brace; tubo de buffer con forro de goma); cargador de las
  Glock con el mismo ángulo en las dos (`skewX(4)`). El usuario pasó fotos de referencia y corrigió dos veces: **no
  agregar attachments que no pidió**.
- **Piezas de ajedrez:** 12 SVG; las del mod están embebidas en `chess.js` (`DEFS`, `pieceSvg`).

## El dev y compartir (situación al 2026-11-21)
- El usuario **espera el permiso del dev** para poder ayudarlo. Publicó la idea en el canal de ideas del Discord del
  juego (el Discord casi no se mueve). El subreddit sí tiene movimiento (último post ~15 días).
- **Plan:** si en ~1 semana no hay respuesta, subir el post al Reddit (borrador en inglés ya hecho: "full Spanish/
  Portuguese translation + Chess career mod, played locally; if you want them officially I'll hand everything over;
  if not I'll keep it to my copy") con un clip de 20-30 s. Cómo presentarlo: "modeé mi copia local" y abrir con el
  valor (traducción + mod), no con "le hice reverse engineering"; no usar el ángulo de BitLife.
- **Qué se puede compartir y qué no:**
  - El código de los mods (motor, puzzles, carrera, eventos, pandilla) es **original**; igual, se comparte solo con el OK
    del dev. Nunca llevar dentro `game.html`, `mods.js` completo, los emojis/assets ni los diccionarios (`events.tsv`
    contiene todo el texto del dev traducido línea por línea).
  - Para empaquetarlo como userscript (Tampermonkey) haría falta: crear el Web Worker desde un `Blob`, elegir el
    contexto del iframe de itch.io (`html-classic.itch.zone`), probar que los nombres de función coincidan con la
    versión online, meter el diccionario si se quiere ES/PT, y no funciona en celular (no hay consola).
- Si alguien pregunta cómo sacar el código del juego: que le pida permiso al dev; no ayudar a sacarlo ni a empaquetarlo
  como APK para repartirlo. El usuario dijo que un conocido lo quería solo para su propio teléfono: uso personal, nada más.

## Próximos pasos
1. **Esperar el permiso del dev** (ver arriba). No publicar nada del juego mientras tanto.
2. **Segunda pasada de la traducción** (el usuario dijo "lo haremos después"): revisar solo las líneas de freebuff con
   `deepseek-v4.1-flash-free` y fallback a `nemotron-3.5-super-vl-free` (crear `freebuff\backends\models.txt`). Que el
   revisor escriba **solo las líneas que cambia** (más rápido y seguro), guardar el original como `.out.v1.tsv`, aceptar
   cada línea solo si pasa `validate.py`, y revisar también el portugués. **Revisar mojibake al terminar.**
3. **Pandilla:** preguntar si se quitan los rangos propios (Prospect → Boss); íconos del menú de
   armas más claros/grandes; decidir si se cambia el nombre "Gang Bang".
4. **Ajedrez (si el usuario lo pide):** el Mundial hoy es simulado (la partida clave solo existe en los torneos);
   puzzles más difíciles (hoy el máximo es 1935: generar con `gen-puzzles.js` buscando mate en 3 y tácticas de +2000);
   pulir el caballo SVG; notación de jugadas en ES/PT.
5. **Barba:** instalarla si el usuario lo pide (pasos en "Arte propio").
6. **i18n del juego:** primera tanda hecha (ver "Mundial jugable + i18n genérico"); falta lo de la lista "Sigue pendiente".
7. **Limpieza:** borrar los `*.bak` / `*.bak-*` de `i18n\` cuando todo esté estable. Quedaron abiertos un `python -m
   http.server 8765` y un Brave de debug (puerto 9333) de la sesión: cerrarlos si no se usan.
