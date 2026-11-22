
(() => {
  "use strict";

  function boot() {
    if (
      typeof window.COUNTRIES === "undefined" ||
      typeof state === "undefined" ||
      typeof renderStats !== "function" ||
      typeof usd !== "function" ||
      typeof say !== "function"
    )
      return setTimeout(boot, 60);
    try {
      init();
    } catch (e) {
      console.warn("[cheat]", e);
    }
  }

  function init() {
    if (document.getElementById("cheatFab")) return; // already injected

    const STATS = ["Happiness", "Health", "Smarts", "Looks"];

    const fab = document.createElement("button");
    fab.id = "cheatFab";
    fab.type = "button";
    fab.textContent = "\u{1F4B0}";
    fab.setAttribute("aria-label", "Cheat menu");
    Object.assign(fab.style, {
      position: "fixed",
      zIndex: 2147483000,
      right: "14px",
      bottom: "90px",
      width: "48px",
      height: "48px",
      borderRadius: "50%",
      border: "none",
      background: "#222",
      color: "#fff",
      fontSize: "22px",
      lineHeight: "48px",
      textAlign: "center",
      padding: "0",
      cursor: "grab",
      boxShadow: "0 2px 10px rgba(0,0,0,.45)",
      touchAction: "none",
      userSelect: "none",
    });

    const panel = document.createElement("div");
    panel.id = "cheatPanel";
    Object.assign(panel.style, {
      position: "fixed",
      zIndex: 2147483000,
      right: "14px",
      bottom: "148px",
      width: "220px",
      maxHeight: "70vh",
      overflowY: "auto",
      background: "#1b1b1fee",
      backdropFilter: "blur(2px)",
      color: "#fff",
      borderRadius: "12px",
      boxShadow: "0 4px 20px rgba(0,0,0,.55)",
      padding: "10px",
      fontFamily: "system-ui, sans-serif",
      fontSize: "13px",
      display: "none",
    });

    function heading(label) {
      const h = document.createElement("div");
      h.textContent = label;
      Object.assign(h.style, {
        fontWeight: "bold",
        margin: "10px 0 4px",
        opacity: ".7",
        fontSize: "11px",
        textTransform: "uppercase",
        letterSpacing: ".03em",
      });
      panel.appendChild(h);
    }

    function btn(label, fn) {
      const b = document.createElement("button");
      b.type = "button";
      b.textContent = label;
      Object.assign(b.style, {
        display: "block",
        width: "100%",
        margin: "3px 0",
        padding: "7px 9px",
        borderRadius: "7px",
        border: "none",
        background: "#333a",
        color: "#fff",
        cursor: "pointer",
        fontSize: "12px",
        textAlign: "left",
      });
      b.addEventListener("pointerenter", () => (b.style.background = "#4448"));
      b.addEventListener("pointerleave", () => (b.style.background = "#333a"));
      b.addEventListener("click", (e) => {
        e.stopPropagation();
        fn();
      });
      panel.appendChild(b);
      return b;
    }

    const title = document.createElement("div");
    title.textContent = "Cheats";
    Object.assign(title.style, { fontWeight: "bold", fontSize: "14px" });
    panel.appendChild(title);

    heading("Money");
    [
      [1000, "+$1,000"],
      [10000, "+$10,000"],
      [100000, "+$100,000"],
      [1000000, "+$1,000,000"],
    ].forEach(([amt, label]) => {
      btn(label, () => {
        state.money = (state.money || 0) + amt;
        renderStats();
        say(`I found ${usd(amt)}... from somewhere.`);
      });
    });
    btn("Custom amount\u2026", () => {
      const raw = prompt("Add how much money? (use a minus sign to remove money)", "0");
      if (raw === null) return;
      const amt = Math.round(parseFloat(raw));
      if (!Number.isFinite(amt) || !amt) return;
      state.money = Math.max(0, (state.money || 0) + amt);
      renderStats();
      say(amt > 0 ? `I found ${usd(amt)}... from somewhere.` : `I lost ${usd(-amt)} somehow.`);
    });
    btn("Set cash to\u2026", () => {
      const raw = prompt("Set cash to:", String(state.money || 0));
      if (raw === null) return;
      const amt = Math.round(parseFloat(raw));
      if (!Number.isFinite(amt) || amt < 0) return;
      (state.money = amt), renderStats();
    });
    btn("Set cash to $0", () => {
      state.money = 0;
      renderStats();
    });

    heading("Stats");
    btn("Max all stats (100%)", () => {
      STATS.forEach((k) => (state.stats[k] = 100));
      renderStats();
    });
    btn("Min all stats (0%)", () => {
      STATS.forEach((k) => (state.stats[k] = 0));
      renderStats();
    });
    STATS.forEach((k) => {
      btn(`Max ${k}`, () => {
        state.stats[k] = 100;
        renderStats();
      });
    });

    heading("Relationships");
    btn("Max relationship: Spouse/Partner", () => {
      const p =
        (state.spouse && !state.spouse.dead && state.spouse) ||
        (state.lovers || []).find((e) => e && !e.dead);
      if (p && "number" == typeof p.rel) (p.rel = 100), renderStats();
    });
    btn("Max all relationships", () => {
      const all = [
        state.spouse,
        ...(state.lovers || []),
        ...(state.exes || []),
        ...(state.family || []),
        ...(state.friends || []),
      ];
      all.forEach((e) => e && "number" == typeof e.rel && (e.rel = 100));
      renderStats();
    });

    heading("Misc");
    if (typeof mindOf === "function")
      btn("Max Mental Health", () => {
        const m = mindOf();
        (m.mh = 100), (m.ins = 0);
        renderStats();
      });
    btn("Get out of prison", () => {
      if (!state.prison) return;
      (state.prison = null), renderStats(), say("Somehow, I'm out of prison.");
    });
    btn("Set age\u2026", () => {
      const raw = prompt("Set age to:", String(state.age));
      if (raw === null) return;
      const age = Math.round(parseFloat(raw));
      if (!Number.isFinite(age) || age < 0) return;
      (state.age = age), renderStats();
    });
    if (typeof ageBtnEl !== "undefined")
      btn("Age up (+1 year)", () => ageBtnEl.click());

    document.body.appendChild(panel);
    document.body.appendChild(fab);

    fab.addEventListener("click", () => {
      if (fab.dataset.dragged === "1") {
        fab.dataset.dragged = "0";
        return;
      }
      panel.style.display = panel.style.display === "none" ? "block" : "none";
    });

    // ------------------------------------------------------------ drag the button around
    let dragging = false,
      offX = 0,
      offY = 0;
    fab.addEventListener("pointerdown", (e) => {
      dragging = true;
      fab.dataset.dragged = "0";
      fab.style.cursor = "grabbing";
      const r = fab.getBoundingClientRect();
      (offX = e.clientX - r.left), (offY = e.clientY - r.top);
      fab.setPointerCapture(e.pointerId);
    });
    fab.addEventListener("pointermove", (e) => {
      if (!dragging) return;
      fab.dataset.dragged = "1";
      const x = e.clientX - offX,
        y = e.clientY - offY,
        left = Math.max(4, Math.min(innerWidth - 52, x)),
        top = Math.max(4, Math.min(innerHeight - 52, y));
      (fab.style.left = `${left}px`), (fab.style.top = `${top}px`);
      (fab.style.right = "auto"), (fab.style.bottom = "auto");
      (panel.style.left = `${Math.max(4, Math.min(innerWidth - 224, left))}px`),
        (panel.style.top = `${Math.max(4, top - panel.offsetHeight - 10)}px`);
      (panel.style.right = "auto"), (panel.style.bottom = "auto");
    });
    fab.addEventListener("pointerup", () => {
      dragging = false;
      fab.style.cursor = "grab";
    });
    fab.addEventListener("pointercancel", () => {
      dragging = false;
      fab.style.cursor = "grab";
    });

    console.log("[cheat] loaded");
  }

  boot();
})();
