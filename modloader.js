
(() => {
  "use strict";

  // Add your in-development mods here. Just name + src (+ optional desc) — no code needed.
  const AUTO_MODS = [
    { name: "Test Mod", icon: "emoji/1f9ea.png", desc: "Diagnostic mod confirming the loader can see base-game globals.", src: "test-mod.js?v=1" },
    { name: "Chess Career", icon: "emoji/265f-fe0f.png", desc: "Play chess from childhood to the World Championship: FIDE rating, titles, tournaments, coaches and the Pawnder site. Find it in Activities.", src: "chess.js?v=3" },
    // { name: "My Mod", icon: "ui/gear.png", desc: "What it does", src: "my-mod.js?v=1" },
  ];

  // ---------------------------------------------------------------- per-mod on/off state
  const STORE_KEY = "modloader-enabled";
  const readState = () => {
    try {
      return JSON.parse(localStorage.getItem(STORE_KEY) || "{}");
    } catch {
      return {};
    }
  };
  const writeState = (s) => {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(s));
    } catch {}
  };
  const isOn = (src) => readState()[src] !== false; // default: on
  const setOn = (src, on) => {
    const s = readState();
    (s[src] = on), writeState(s);
  };

  // ---------------------------------------------------------------- actually loading scripts
  const loadedNow = new Set();
  function loadOne(m) {
    if (!m || !m.src || loadedNow.has(m.src) || !isOn(m.src)) return;
    loadedNow.add(m.src);
    try {
      const s = document.createElement("script");
      (s.src = m.src), (s.async = !1), document.head.append(s);
      console.log(`[modloader] loaded "${m.name || m.src}"`);
    } catch (e) {
      console.warn("[modloader] failed to load", m, e);
    }
  }
  function bootLoad() {
    AUTO_MODS.forEach(loadOne);
  }

  // ---------------------------------------------------------------- let our rows grow to fit
  // longer descriptions instead of overflowing the native 76px fixed row height
  (() => {
    const css = document.createElement("style");
    css.textContent =
      "[data-ml]{height:auto;min-height:76px;padding:10px 14px;align-items:flex-start}" +
      "[data-ml] img{margin-top:2px}" +
      "[data-ml] .ck{margin-top:2px}";
    document.head.append(css);
  })();

  // ---------------------------------------------------------------- the Mod Loader screen
  function openModLoader() {
    typeof play === "function" && play("choice");
    (sTitle.textContent = "MOD LOADER"), (sSub.style.display = "none");
    (sBack.innerHTML = typeof BACK_ICON !== "undefined" ? BACK_ICON : "&larr;"),
      (sBack.onclick = () => (typeof openMainMenu === "function" ? openMainMenu() : screen.classList.remove("open")));

    if (!AUTO_MODS.length) {
      sList.innerHTML =
        '<div class="sec">Mod Loader</div><div class="row"><div class="t"><b>No mods listed</b>' +
        '<span>Add entries to AUTO_MODS in modloader.js</span></div></div>';
      return;
    }

    const row = (m) =>
      `<div class="row" data-ml="${m.src}"><img src="${m.icon || "ui/gear.png"}"><div class="t"><b>${m.name || m.src}</b>` +
      `<span>${m.desc ? m.desc : isOn(m.src) ? "Enabled" : "Disabled"}</span></div>` +
      `<img class="ck" src="${modBox(isOn(m.src))}"></div>`;

    sList.innerHTML =
      '<div class="mm-foot" style="padding:8px 14px; text-align:left">Toggle mods on or off. Changes apply the next time Free Life loads. Made by Nan089111</div>' +
      '<div class="sec">Mod Loader</div>' +
      AUTO_MODS.map(row).join("");

    sList.querySelectorAll("[data-ml]").forEach((el) => {
      el.onclick = () => {
        typeof play === "function" && play("choice");
        const src = el.dataset.ml,
          nowOn = !isOn(src);
        setOn(src, nowOn);
        el.querySelector(".ck").src = modBox(nowOn);
        const m = AUTO_MODS.find((x) => x.src === src), 
          sub = el.querySelector(".t span");
        if (sub) sub.textContent = m && m.desc ? m.desc : nowOn ? "Enabled" : "Disabled";
        typeof notice === "function" &&
          notice(
            nowOn ? "Mod Enabled" : "Mod Disabled",
            `${(m && m.name) || src} will be ${nowOn ? "loaded" : "skipped"} the next time Free Life loads.`,
            null,
            !0,
          );
      };
    });
  }

  // ---------------------------------------------------------------- hook into Main Menu + boot
  function boot() {
    if (
      typeof openMainMenu !== "function" ||
      typeof sList === "undefined" ||
      typeof modBox !== "function" ||
      typeof mods === "undefined" ||
      !document.querySelector(".phone")
    )
      return setTimeout(boot, 60);

    // native toggle: Settings -> Mod Workshop -> Mods -> Mod Loader. On by default.
    if (!mods.modLoader) return;

    const orig = openMainMenu;
    openMainMenu = function () {
      const r = orig.apply(this, arguments);
      try {
        const html =
          '<div class="sec">Mods</div><div class="row" id="mlRow"><img src="ui/gear.png">' +
          '<div class="t"><b>Mod Loader</b><span>Enable or disable installed mods</span></div>' +
          (typeof CHEV !== "undefined" ? CHEV : "") +
          "</div>";
        sList.insertAdjacentHTML("afterbegin", html);
        document.getElementById("mlRow").onclick = openModLoader;
      } catch (e) {
        console.warn("[modloader] menu", e);
      }
      return r;
    };

    bootLoad();
  }

  window.MOD_LOADER = { AUTO_MODS, load: loadOne, reload: bootLoad, open: openModLoader };
  boot();
})();
