/* NaBlooLife Mod Loader — adaptado para los mods de Free Life.
 *
 * Instalación: copiar este archivo a la raíz del juego (junto a game.html). NaBlooLife
 * lo inyecta solo desde game.html cuando el Mod Loader está activo; en builds viejos
 * también se puede agregar <script src="modloader.js?v=17"></script> después de mods.js.
 * No hace falta ningún código de 8 dígitos: los mods se cargan solos y se pueden apagar
 * desde Settings → Mod Loader.
 *
 * Cada entrada de MODS es { id, name, icon, src, desc, deps? }. `deps` se inyecta
 * antes que `src` (el ajedrez necesita motor, puzzles y eventos). Para sumar un mod
 * nuevo basta con agregar otra entrada: no hay que tocar game.html.
 *
 * Compatible con el mods.js de NaBlooLife: si ese loader ya cargó este archivo, la
 * segunda ejecución sale por el guard de window.MOD_LOADER y no duplica nada.
 */
(() => {
  "use strict";

  if (window.MOD_LOADER) return;

  const MODS = [
    {
      id: "chess-career",
      name: "Chess Career",
      icon: "emoji/265f-fe0f.png",
      src: "chess.js?v=6",
      deps: ["chess-engine.js?v=2", "chess-puzzles.js?v=2", "chess-events.js?v=2"],
      desc: "Play chess from childhood to the World Championship: FIDE rating, titles from CM to GM, norms, tournaments, coaches, lessons, puzzles and the Pawnder site. Find it in Occupation, Special Careers.",
    },
    {
      id: "gang-bang",
      name: "Gang Bang",
      icon: "special/gangbang.png",
      src: "gang.js?v=11",
      desc: "Join a street gang, rise from Prospect to Boss, hustle, fight for turf and keep the police heat down. Find it in Occupation, Special Careers.",
    },
    {
      id: "femboy",
      name: "Femboy Journey",
      icon: "emoji/1f485.png",
      src: "femboy.js?v=2",
      desc: "Help an adult male friend explore his feminine side: clothes, a new name, coming out, transition, and a few very direct attempts to seduce you. Find it on an adult male friend in Relationships.",
    },
    {
      id: "special-life",
      name: "Special Life: Racer, Judge & Artist",
      icon: "emoji/1f3ce-fe0f.png",
      src: "special-life.js?v=1",
      desc: "Three special careers: illegal street racer with nationwide police heat and an underground exotic-car auction, judge with evidence, sentences, bribes and revenge, and artist with a real drawing canvas whose pieces persist in localStorage.",
    },
    {
      id: "political-career",
      name: "Political Career",
      icon: "special/politician.png",
      src: "politician.js?v=4",
      desc: "Run for office from School Board to President: ranks, powers, campaigns, elections and scandals. Find it in Occupation, Special Careers.",
    },
    {
      id: "cheat",
      name: "Cheat Menu",
      icon: "emoji/1f4b0.png",
      src: "cheat.js?v=1",
      desc: "Adds a small draggable button floating on screen. Tap it to open a panel of cheats: add money, set cash to $0, max or min all four stats, full heal, and age up on demand.",
    },
    {
      id: "displayfix",
      name: "Display Fix (Scale + Safe Area)",
      icon: "emoji/1f4cf.png",
      src: "displayfix.js?v=1",
      desc: "Shrinks the whole phone screen down (default 85%, edit SCALE at the top of displayfix.js to adjust) and adds a thin black bar at the very top matching only your device's status bar / notch height (safe-area-inset-top).",
    },
    {
      id: "nk",
      name: "North Korea Events",
      icon: "emoji/1f575-fe0f.png",
      src: "nk.js?v=1",
      desc: "Country-specific life events for characters born in North Korea: a songbun social class at birth, food rationing, mandatory ideology sessions, the risk of being reported by an informant, and a rare, high-risk chance to attempt leaving the country. Only activates when your country is North Korea.",
    },
    {
      id: "custom-sources",
      name: "Custom Mod Sources",
      icon: "ui/gear.png",
      src: "modsources.js?v=1",
      desc: "Adds a screen to Settings where you can add your own mods — paste a direct https://.../file.js URL, or (in the Android app) pick a .js file straight from your phone. Find it in Settings, below Mod Loader.",
    },
  ];

  // ---------------------------------------------------------------- on/off por mod
  const STORE_KEY = "modloader-enabled";
  const readState = () => {
    try {
      const s = JSON.parse(localStorage.getItem(STORE_KEY) || "{}");
      return s && typeof s === "object" ? s : {};
    } catch {
      return {};
    }
  };
  const writeState = (s) => {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(s));
    } catch {}
  };
  const isOn = (m) => {
    const s = readState();
    if (typeof s[m.id] === "boolean") return s[m.id];
    if (typeof s[m.src] === "boolean") return s[m.src]; // formato viejo, por src
    return true; // por defecto: encendido
  };
  const setOn = (m, on) => {
    const s = readState();
    (s[m.id] = on), writeState(s);
  };

  // ---------------------------------------------------------------- carga de scripts
  const loaded = new Set();
  const order = [];
  function inject(src) {
    if (!src || loaded.has(src)) return;
    loaded.add(src);
    order.push(src);
    try {
      const s = document.createElement("script");
      (s.src = src), (s.async = !1), document.head.append(s);
      console.log(`[modloader] loaded "${src}"`);
    } catch (e) {
      console.warn("[modloader] failed to load", src, e);
    }
  }
  function loadOne(m) {
    if (!m || !m.src || !isOn(m)) return false;
    (m.deps || []).forEach(inject);
    inject(m.src);
    return true;
  }
  const loadAll = () => MODS.forEach(loadOne);

  // ---------------------------------------------------------------- filas con alto flexible
  (() => {
    const css = document.createElement("style");
    css.textContent =
      "[data-ml]{height:auto;min-height:76px;padding:10px 14px;align-items:flex-start}" +
      "[data-ml] img{margin-top:2px}" +
      "[data-ml] .ck{margin-top:2px}";
    document.head.append(css);
  })();

  // ---------------------------------------------------------------- pantalla del loader
  function openModLoader() {
    typeof play === "function" && play("choice");
    (sTitle.textContent = "MOD LOADER"), (sSub.style.display = "none");
    (sBack.innerHTML = typeof BACK_ICON !== "undefined" ? BACK_ICON : "&larr;"),
      (sBack.onclick = () => (typeof openMainMenu === "function" ? openMainMenu() : screen.classList.remove("open")));

    if (!MODS.length) {
      sList.innerHTML =
        '<div class="sec">Mod Loader</div><div class="row"><div class="t"><b>No mods listed</b>' +
        "<span>Add entries to MODS in modloader.js</span></div></div>";
      return;
    }

    const row = (m) =>
      `<div class="row" data-ml="${m.id}"><img src="${m.icon || "ui/gear.png"}"><div class="t"><b>${m.name || m.src}</b>` +
      `<span>${isOn(m) ? "Enabled" : "Disabled"}${m.desc ? ` · ${m.desc}` : ""}</span></div>` +
      `<img class="ck" src="${modBox(isOn(m))}"></div>`;

    sList.innerHTML =
      '<div class="mm-foot" style="padding:8px 14px; text-align:left">Toggle mods on or off. Changes apply the next time Free Life loads.</div>' +
      '<div class="sec">Mod Loader</div>' +
      MODS.map(row).join("");

    sList.querySelectorAll("[data-ml]").forEach((el) => {
      el.onclick = () => {
        typeof play === "function" && play("choice");
        const m = MODS.find((x) => x.id === el.dataset.ml),
          nowOn = !isOn(m);
        setOn(m, nowOn);
        el.querySelector(".ck").src = modBox(nowOn);
        const sub = el.querySelector(".t span");
        if (sub) sub.textContent = `${nowOn ? "Enabled" : "Disabled"}${m.desc ? ` · ${m.desc}` : ""}`;
        typeof notice === "function" &&
          notice(
            nowOn ? "Mod Enabled" : "Mod Disabled",
            `${m.name || m.src} will be ${nowOn ? "loaded" : "skipped"} the next time Free Life loads.`,
            null,
            !0,
          );
      };
    });
  }

  // ---------------------------------------------------------------- menú principal + arranque
  let hooked = false;
  function hookMenu() {
    if (hooked) return;
    hooked = true;
    const orig = openMainMenu;
    openMainMenu = function () {
      const r = orig.apply(this, arguments);
      try {
        if (document.getElementById("mlRow")) return r;
        sList.insertAdjacentHTML(
          "afterbegin",
          '<div class="sec">Mods</div><div class="row" id="mlRow"><img src="ui/gear.png">' +
            '<div class="t"><b>Mod Loader</b><span>Enable or disable installed mods</span></div>' +
            (typeof CHEV !== "undefined" ? CHEV : "") +
            "</div>",
        );
        document.getElementById("mlRow").onclick = openModLoader;
      } catch (e) {
        console.warn("[modloader] menu", e);
      }
      return r;
    };
  }

  function ready() {
    return (
      typeof openMainMenu === "function" &&
      typeof sList !== "undefined" &&
      !!sList &&
      typeof modBox === "function" &&
      !!document.querySelector(".phone")
    );
  }
  function boot() {
    if (!ready()) return setTimeout(boot, 60);
    // si el jugador apagó el Mod Loader en Settings, no se agrega la fila ni se carga nada
    const allowed = typeof mods === "undefined" || !mods || mods.modLoader !== false;
    if (allowed) hookMenu();
    loadAll();
  }

  window.MOD_LOADER = {
    MODS,
    load: loadOne,
    reload: loadAll,
    open: openModLoader,
    loaded: () => order.slice(),
    isOn,
    setOn,
  };
  boot();
})();
