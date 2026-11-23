
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

    // ---------------------------------------------------------------- styles
    const style = document.createElement("style");
    style.textContent = `
      #cheatFab {
        position: fixed; z-index: 2147483000; right: 14px; bottom: 90px;
        width: 50px; height: 50px; border-radius: 50%; border: none;
        background: linear-gradient(145deg,#2b2f3a,#1a1d24); color: #fff;
        font-size: 22px; line-height: 50px; text-align: center; padding: 0;
        cursor: grab; box-shadow: 0 3px 14px rgba(0,0,0,.5), inset 0 1px 0 rgba(255,255,255,.08);
        touch-action: none; user-select: none; transition: transform .12s ease;
      }
      #cheatFab:active { transform: scale(.92); }
      #cheatBackdrop {
        position: fixed; inset: 0; z-index: 2147483001; background: rgba(0,0,0,.5);
        display: none; backdrop-filter: blur(1px);
      }
      #cheatPanel {
        position: fixed; z-index: 2147483002; left: 50%; top: 50%;
        transform: translate(-50%,-50%); width: min(340px, 92vw);
        max-height: 80vh; display: none; flex-direction: column;
        background: #1b1e26; color: #fff; border-radius: 16px;
        box-shadow: 0 10px 40px rgba(0,0,0,.6); overflow: hidden;
        font-family: system-ui, sans-serif;
      }
      #cheatPanel .cp-head {
        display: flex; align-items: center; justify-content: space-between;
        padding: 14px 16px 10px; background: #20242e;
        border-bottom: 1px solid #2d323d;
      }
      #cheatPanel .cp-title { font-weight: 800; font-size: 16px; letter-spacing: .02em; }
      #cheatAskBackdrop {
        position: fixed; inset: 0; z-index: 2147483002; background: rgba(0,0,0,.5);
        display: none; backdrop-filter: blur(1px);
      }
      #cheatPanel .cp-close {
        width: 28px; height: 28px; border-radius: 50%; border: none;
        background: #2d323d; color: #fff; font-size: 15px; cursor: pointer;
        display: flex; align-items: center; justify-content: center;
      }
      #cheatPanel .cp-tabs {
        display: flex; gap: 4px; padding: 8px 10px; background: #1b1e26;
        border-bottom: 1px solid #2d323d; overflow-x: auto;
      }
      #cheatPanel .cp-tab {
        flex: 1 0 auto; border: none; cursor: pointer; padding: 7px 10px;
        border-radius: 9px; background: transparent; color: #9aa0ab;
        font-size: 12px; font-weight: 700; text-transform: uppercase;
        letter-spacing: .03em; white-space: nowrap;
      }
      #cheatPanel .cp-tab.active { background: #323849; color: #fff; }
      #cheatPanel .cp-body { padding: 10px 14px 14px; overflow-y: auto; }
      #cheatPanel .cp-section { display: none; }
      #cheatPanel .cp-section.active { display: block; }
      #cheatPanel .cp-grid {
        display: grid; grid-template-columns: 1fr 1fr; gap: 7px; margin-bottom: 10px;
      }
      #cheatPanel .cp-btn {
        display: block; width: 100%; padding: 10px 9px; border-radius: 9px;
        border: none; background: #2a2f3b; color: #fff; cursor: pointer;
        font-size: 12.5px; text-align: center; font-weight: 600;
        transition: background .12s ease;
      }
      #cheatPanel .cp-btn:hover, #cheatPanel .cp-btn:active { background: #3a4257; }
      #cheatPanel .cp-btn.wide { grid-column: 1 / -1; text-align: left; }
      #cheatPanel .cp-note {
        font-size: 11px; color: #8b919c; margin: 2px 0 10px; line-height: 1.4;
      }
      #cheatAsk {
        position: fixed; z-index: 2147483003; left: 50%; top: 50%;
        transform: translate(-50%,-50%); width: min(280px, 85vw);
        background: #20242e; color: #fff; border-radius: 14px; padding: 16px;
        box-shadow: 0 10px 40px rgba(0,0,0,.6); font-family: system-ui, sans-serif;
        display: none;
      }
      #cheatAsk .ca-label { font-size: 13px; font-weight: 700; margin-bottom: 8px; }
      #cheatAsk input {
        width: 100%; box-sizing: border-box; padding: 9px 10px; border-radius: 9px;
        border: 1px solid #3a4257; background: #151821; color: #fff; font-size: 14px;
        margin-bottom: 10px;
      }
      #cheatAsk .ca-row { display: flex; gap: 8px; }
      #cheatAsk .ca-row button {
        flex: 1; padding: 9px; border-radius: 9px; border: none; cursor: pointer;
        font-size: 13px; font-weight: 700;
      }
      #cheatAsk .ca-cancel { background: #2a2f3b; color: #fff; }
      #cheatAsk .ca-ok { background: #4c7cf0; color: #fff; }
    `;
    document.head.appendChild(style);

    // ---------------------------------------------------------------- tiny styled prompt (replaces window.prompt)
    const askBackdrop = document.createElement("div");
    askBackdrop.id = "cheatAskBackdrop";
    const askBox = document.createElement("div");
    askBox.id = "cheatAsk";
    askBox.innerHTML = `
      <div class="ca-label"></div>
      <input type="text" inputmode="decimal" />
      <div class="ca-row">
        <button class="ca-cancel" type="button">Cancel</button>
        <button class="ca-ok" type="button">OK</button>
      </div>
    `;
    document.body.appendChild(askBackdrop);
    document.body.appendChild(askBox);
    const askLabel = askBox.querySelector(".ca-label");
    const askInput = askBox.querySelector("input");
    let askResolve = null;
    function closeAsk(value) {
      askBox.style.display = "none";
      askBackdrop.style.display = "none";
      if (askResolve) {
        const r = askResolve;
        askResolve = null;
        r(value);
      }
    }
    askBox.querySelector(".ca-cancel").addEventListener("click", () => closeAsk(null));
    askBox.querySelector(".ca-ok").addEventListener("click", () => closeAsk(askInput.value));
    askInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") closeAsk(askInput.value);
      if (e.key === "Escape") closeAsk(null);
    });
    askBackdrop.addEventListener("click", () => closeAsk(null));
    function ask(label, defVal) {
      askLabel.textContent = label;
      askInput.value = defVal == null ? "" : String(defVal);
      askBackdrop.style.display = "block";
      askBox.style.display = "block";
      setTimeout(() => {
        askInput.focus();
        askInput.select();
      }, 10);
      return new Promise((res) => (askResolve = res));
    }

    // ---------------------------------------------------------------- fab trigger
    const fab = document.createElement("button");
    fab.id = "cheatFab";
    fab.type = "button";
    fab.textContent = "\u{1F4B0}";
    fab.setAttribute("aria-label", "Cheat menu");

    // ---------------------------------------------------------------- panel
    const backdrop = document.createElement("div");
    backdrop.id = "cheatBackdrop";

    const panel = document.createElement("div");
    panel.id = "cheatPanel";
    panel.innerHTML = `
      <div class="cp-head">
        <div class="cp-title">\u{1F4B0} Cheats</div>
        <button class="cp-close" type="button" aria-label="Close">✕</button>
      </div>
      <div class="cp-tabs"></div>
      <div class="cp-body"></div>
    `;
    const tabsEl = panel.querySelector(".cp-tabs");
    const bodyEl = panel.querySelector(".cp-body");

    function openPanel() {
      backdrop.style.display = "block";
      panel.style.display = "flex";
    }
    function closePanel() {
      backdrop.style.display = "none";
      panel.style.display = "none";
    }
    panel.querySelector(".cp-close").addEventListener("click", closePanel);
    backdrop.addEventListener("click", closePanel);
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && panel.style.display !== "none") closePanel();
    });

    let sectionCount = 0;
    function section(label) {
      sectionCount++;
      const tab = document.createElement("button");
      tab.type = "button";
      tab.className = "cp-tab" + (sectionCount === 1 ? " active" : "");
      tab.textContent = label;
      tabsEl.appendChild(tab);

      const sec = document.createElement("div");
      sec.className = "cp-section" + (sectionCount === 1 ? " active" : "");
      bodyEl.appendChild(sec);

      tab.addEventListener("click", () => {
        tabsEl.querySelectorAll(".cp-tab").forEach((t) => t.classList.remove("active"));
        bodyEl.querySelectorAll(".cp-section").forEach((s) => s.classList.remove("active"));
        tab.classList.add("active");
        sec.classList.add("active");
      });

      return sec;
    }

    function btn(parent, label, fn, wide) {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "cp-btn" + (wide ? " wide" : "");
      b.textContent = label;
      b.addEventListener("click", (e) => {
        e.stopPropagation();
        fn();
      });
      parent.appendChild(b);
      return b;
    }

    function grid(parent) {
      const g = document.createElement("div");
      g.className = "cp-grid";
      parent.appendChild(g);
      return g;
    }

    function note(parent, text) {
      const n = document.createElement("div");
      n.className = "cp-note";
      n.textContent = text;
      parent.appendChild(n);
    }

    // ------------------------------------------------------------------ Money tab
    const moneySec = section("Money");
    const moneyGrid = grid(moneySec);
    [
      [1000, "+$1,000"],
      [10000, "+$10,000"],
      [100000, "+$100,000"],
      [1000000, "+$1,000,000"],
    ].forEach(([amt, label]) => {
      btn(moneyGrid, label, () => {
        state.money = (state.money || 0) + amt;
        renderStats();
        say(`I found ${usd(amt)}... from somewhere.`);
      });
    });
    btn(moneySec, "Custom amount…", async () => {
      const raw = await ask("Add how much money? (negative to remove)", "0");
      if (raw === null) return;
      const amt = Math.round(parseFloat(raw));
      if (!Number.isFinite(amt) || !amt) return;
      state.money = Math.max(0, (state.money || 0) + amt);
      renderStats();
      say(amt > 0 ? `I found ${usd(amt)}... from somewhere.` : `I lost ${usd(-amt)} somehow.`);
    }, true);
    btn(moneySec, "Set cash to…", async () => {
      const raw = await ask("Set cash to:", state.money || 0);
      if (raw === null) return;
      const amt = Math.round(parseFloat(raw));
      if (!Number.isFinite(amt) || amt < 0) return;
      state.money = amt;
      renderStats();
    }, true);
    btn(moneySec, "Set cash to $0", () => {
      state.money = 0;
      renderStats();
    }, true);

    // ------------------------------------------------------------------ Stats tab
    const statsSec = section("Stats");
    const statsGrid = grid(statsSec);
    btn(statsGrid, "Max all (100%)", () => {
      STATS.forEach((k) => (state.stats[k] = 100));
      renderStats();
    });
    btn(statsGrid, "Min all (0%)", () => {
      STATS.forEach((k) => (state.stats[k] = 0));
      renderStats();
    });
    STATS.forEach((k) => {
      btn(statsGrid, `Max ${k}`, () => {
        state.stats[k] = 100;
        renderStats();
      });
    });

    // ------------------------------------------------------------------ Relationships tab
    const relSec = section("Relations");
    btn(relSec, "Max relationship: Spouse/Partner", () => {
      const p =
        (state.spouse && !state.spouse.dead && state.spouse) ||
        (state.lovers || []).find((e) => e && !e.dead);
      if (p && "number" == typeof p.rel) (p.rel = 100), renderStats();
    }, true);
    btn(relSec, "Max all relationships", () => {
      const all = [
        state.spouse,
        ...(state.lovers || []),
        ...(state.exes || []),
        ...(state.family || []),
        ...(state.friends || []),
      ];
      all.forEach((e) => e && "number" == typeof e.rel && (e.rel = 100));
      renderStats();
    }, true);

    // ------------------------------------------------------------------ Misc tab
    const miscSec = section("Misc");
    if (typeof mindOf === "function")
      btn(miscSec, "Max Mental Health", () => {
        const m = mindOf();
        (m.mh = 100), (m.ins = 0);
        renderStats();
      }, true);
    btn(miscSec, "Get out of prison", () => {
      if (!state.prison) return;
      (state.prison = null), renderStats(), say("Somehow, I'm out of prison.");
    }, true);
    btn(miscSec, "Set age…", async () => {
      const raw = await ask("Set age to:", state.age);
      if (raw === null) return;
      const age = Math.round(parseFloat(raw));
      if (!Number.isFinite(age) || age < 0) return;
      (state.age = age), renderStats();
    }, true);
    if (typeof ageBtnEl !== "undefined")
      btn(miscSec, "Age up (+1 year)", () => ageBtnEl.click(), true);
    note(miscSec, "Drag the \u{1F4B0} button to move it. Tap it to open/close this menu.");

    document.body.appendChild(backdrop);
    document.body.appendChild(panel);
    document.body.appendChild(fab);

    fab.addEventListener("click", () => {
      if (fab.dataset.dragged === "1") {
        fab.dataset.dragged = "0";
        return;
      }
      if (panel.style.display === "none" || !panel.style.display) openPanel();
      else closePanel();
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
        left = Math.max(4, Math.min(innerWidth - 54, x)),
        top = Math.max(4, Math.min(innerHeight - 54, y));
      (fab.style.left = `${left}px`), (fab.style.top = `${top}px`);
      (fab.style.right = "auto"), (fab.style.bottom = "auto");
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
