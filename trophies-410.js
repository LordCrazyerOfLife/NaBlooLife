/* [mod] 410 trofeos nuevos (trophies-410.js). Se generan por familias con plantillas (ver FAMILIES).
 * Cada uno tiene id, nombre, descripción y una condición sobre datos que el juego ya guarda (state.*) o
 * sobre contadores acumulados en localStorage["freelife-trophies-track"] (años con trabajo, ganancias
 * de por vida, vidas, etc.). Se revisan al cumplir edad y al terminar un Zoo Trip. Se desbloquean con
 * showAchievement(), así que quedan en la misma lista de logros del juego (achAll).
 * Pantalla: Main Menu > Achievements (la fila que antes decía "Coming soon"). */
(() => {
  "use strict";
  if (window.FL_TROPHIES) return;

  const TRACK_KEY = "freelife-trophies-track";
  const STATS = ["Happiness", "Health", "Smarts", "Looks"];

  const fmt = (v) => {
    if (v >= 1e12) return "$" + +(v / 1e12).toFixed(1) + "T";
    if (v >= 1e9) return "$" + +(v / 1e9).toFixed(1) + "B";
    if (v >= 1e6) return "$" + +(v / 1e6).toFixed(1) + "M";
    if (v >= 1e3) return "$" + +(v / 1e3).toFixed(1) + "K";
    return "$" + v;
  };
  const yrs = (n) => `${n} year${n === 1 ? "" : "s"}`;
  const range = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i);
  const len = (x) => (Array.isArray(x) ? x.length : x && typeof x === "object" ? Object.keys(x).length : Number(x) || 0);

  // ------------------------------------------------------------ tracker (contadores de por vida)
  const track = () => {
    try {
      const t = JSON.parse(localStorage.getItem(TRACK_KEY) || "null");
      if (t && typeof t === "object") return t;
    } catch {}
    return { lives: 0, lastAge: -1, lastMoney: 0, maxMoney: 0, earned: 0, yearsLived: 0, yearsJob: 0, yearsPrison: 0, yearsRich: 0, yearsHappy: 0 };
  };
  const saveTrack = (t) => {
    try {
      localStorage.setItem(TRACK_KEY, JSON.stringify(t));
    } catch {}
  };

  function updateTrack() {
    if (typeof state === "undefined" || !state || state.dead) return;
    const t = track();
    const age = Number(state.age) || 0;
    const money = Number(state.money) || 0;
    if (t.lastAge < 0 || age < t.lastAge) t.lives += 1;
    else t.yearsLived += age - t.lastAge;
    if (age !== t.lastAge) {
      if (money > t.lastMoney) t.earned += money - t.lastMoney;
      if (money >= 1e6) t.yearsRich += 1;
      if (state.job) t.yearsJob += 1;
      if (state.prison) t.yearsPrison += 1;
      if (age >= 18 && (state.stats?.Happiness || 0) >= 90) t.yearsHappy += 1;
    }
    t.lastAge = age;
    t.lastMoney = money;
    t.maxMoney = Math.max(t.maxMoney || 0, money);
    saveTrack(t);
  }

  function snapshot() {
    const st = typeof state !== "undefined" ? state : {};
    const t = track();
    const cars = Array.isArray(st.cars) ? st.cars : [];
    const elite = Array.isArray(st.eliteVehicles) ? st.eliteVehicles : [];
    const fam = (st.family || []).filter((f) => f && !f.dead);
    const friends = st.friends || [];
    const zt = st.zooTrip || {};
    const stats = st.stats || {};
    return {
      age: Number(st.age) || 0,
      money: Number(st.money) || 0,
      maxMoney: t.maxMoney || 0,
      earned: t.earned || 0,
      yearsLived: t.yearsLived || 0,
      yearsJob: t.yearsJob || 0,
      yearsPrison: t.yearsPrison || 0,
      yearsRich: t.yearsRich || 0,
      yearsHappy: t.yearsHappy || 0,
      lives: t.lives || 0,
      stats,
      minStat: Math.min(...STATS.map((k) => Number(stats[k]) || 0)),
      cars: cars.length,
      driftCars: cars.filter((c) => c && c.cls === "Drift").length,
      carClasses: new Set(cars.map((c) => c && c.cls).filter(Boolean)).size,
      maxParts: Math.max(0, ...cars.map((c) => len(c && c.parts))),
      elite: elite.length,
      islands: elite.filter((e) => e && e.kind === "islands").length,
      friends: friends.length,
      family: fam.length,
      maxFriendRel: Math.max(0, ...friends.map((f) => Number(f.rel) || 0)),
      maxFamRel: Math.max(0, ...fam.map((f) => Number(f.rel) || 0)),
      pets: len(st.pets),
      biz: len(st.biz),
      props: len(st.props),
      babies: len(st.babies),
      lovers: len(st.lovers),
      medals: len(st.medals),
      kills: len(st.kills),
      careers: {
        drift: !!st.drift,
        chess: !!st.chess,
        gang: !!st.gangLife,
        nba: !!st.nba,
        zoo: !!st.zoo,
      },
      zooVisits: zt.visits || 0,
      zooSeen: len(zt.seen),
    };
  }

  // ------------------------------------------------------------ familias (plantillas)
  const AGES = [...range(11, 20),25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100, 105, 110, 115, 120];
  const MONEY = [1, 2.5, 5].flatMap((m) => range(2, 9).map((k) => m * 10 ** k)).concat([1e10, 2e10, 5e10, 1e11, 2e11, 5e11, 1e12, 2e12, 5e12, 1e13, 2e13, 5e13, 1e14, 2e14, 5e14, 1e15]).filter((v) => v !== 100 && v !== 1000 && v !== 10000);
  const EARN = [1e5, 2.5e5, 5e5, 1e6, 2.5e6, 5e6, 1e7, 5e7, 1e8, 1e9];
  const LIVED = range(1, 10).map((i) => i * 100);
  const CAREER = [
    ["drift", "Started Drift Boy", "Start a Drift Boy career in Occupation, Special Careers."],
    ["chess", "Started Chess Career", "Start a Chess Career."],
    ["gang", "Started Gang Bang", "Join a street gang in Gang Bang."],
    ["nba", "Started NBA Career", "Start an NBA career."],
    ["zoo", "Started Zookeeper", "Volunteer as a zookeeper."],
  ];

  const FAMILIES = [
    {
      n: 30,
      make: () =>
        AGES.map((a) => ({
          name: `Turn ${a}`,
          desc: `Reach age ${a}.`,
          test: (s) => s.age >= a,
        })),
    },
    {
      n: 37,
      make: () =>
        MONEY.map((v) => ({
          name: `Hit ${fmt(v)}`,
          desc: `Have ${fmt(v)} in cash at once.`,
          test: (s) => s.maxMoney >= v,
        })),
    },
    {
      n: 24,
      make: () =>
        STATS.flatMap((k) =>
          [50, 60, 70, 80, 90, 100].map((v) => ({
            name: `${k} ${v}`,
            desc: `Get ${k} to ${v} or higher.`,
            test: (s) => s.age >= 18 && (s.stats[k] || 0) >= v,
          })),
        ),
    },
    {
      n: 20,
      make: () =>
        range(1, 20).map((n) => ({
          name: n === 1 ? "Owned 1 Car" : `Owned ${n} Cars`,
          desc: `Own ${n} car${n === 1 ? "" : "s"} at the same time.`,
          test: (s) => s.cars >= n,
        })),
    },
    {
      n: 10,
      make: () =>
        range(1, 10).map((n) => ({
          name: `Drift Stable ${n}`,
          desc: `Own ${n} drift car${n === 1 ? "" : "s"} (JDM Mods shop or Drift Boy).`,
          test: (s) => s.driftCars >= n,
        })),
    },
    {
      n: 15,
      make: () =>
        range(1, 15).map((n) => ({
          name: `Bolt-On ${n}`,
          desc: `Install ${n} JDM part${n === 1 ? "" : "s"} on one car.`,
          test: (s) => s.maxParts >= n,
        })),
    },
    {
      n: 6,
      make: () =>
        range(1, 6).map((n) => ({
          name: `Mixed Garage ${n}`,
          desc: `Own cars from ${n} different classes.`,
          test: (s) => s.carClasses >= n,
        })),
    },
    {
      n: 15,
      make: () =>
        range(1, 15).map((n) => ({
          name: `Luxury Stock ${n}`,
          desc: `Own ${n} boat${n === 1 ? "" : "s"}, plane${n === 1 ? "" : "s"}, helicopter${n === 1 ? "" : "s"} or bikes from the showrooms.`,
          test: (s) => s.elite >= n,
        })),
    },
    {
      n: 8,
      make: () =>
        range(1, 8).map((n) => ({
          name: `Island Owner ${n}`,
          desc: `Own ${n} island${n === 1 ? "" : "s"} from Archipelago Estates.`,
          test: (s) => s.islands >= n,
        })),
    },
    {
      n: 15,
      make: () =>
        range(1, 15).map((n) => ({
          name: `Squad ${n}`,
          desc: `Have ${n} friend${n === 1 ? "" : "s"} at once.`,
          test: (s) => s.friends >= n,
        })),
    },
    {
      n: 12,
      make: () =>
        range(1, 12).map((n) => ({
          name: `Family Tree ${n}`,
          desc: `Have ${n} living family member${n === 1 ? "" : "s"}.`,
          test: (s) => s.family >= n,
        })),
    },
    {
      n: 4,
      make: () =>
        [80, 90, 95, 100].map((v) => ({
          name: `Bonded Friend ${v}`,
          desc: `Get a friend's relationship to ${v} or higher.`,
          test: (s) => s.maxFriendRel >= v,
        })),
    },
    {
      n: 3,
      make: () =>
        [80, 90, 100].map((v) => ({
          name: `Family Bond ${v}`,
          desc: `Get a family member's relationship to ${v} or higher.`,
          test: (s) => s.maxFamRel >= v,
        })),
    },
    {
      n: 8,
      make: () =>
        range(1, 8).map((n) => ({
          name: `Pet Parent ${n}`,
          desc: `Have ${n} pet${n === 1 ? "" : "s"}.`,
          test: (s) => s.pets >= n,
        })),
    },
    {
      n: 10,
      make: () =>
        range(1, 10).map((n) => ({
          name: `Entrepreneur ${n}`,
          desc: `Run ${n} business${n === 1 ? "" : "es"} at once.`,
          test: (s) => s.biz >= n,
        })),
    },
    {
      n: 10,
      make: () =>
        range(1, 10).map((n) => ({
          name: `Property Owner ${n}`,
          desc: `Own ${n} propert${n === 1 ? "y" : "ies"}.`,
          test: (s) => s.props >= n,
        })),
    },
    {
      n: 8,
      make: () =>
        range(1, 8).map((n) => ({
          name: `Parent ${n}`,
          desc: `Have ${n} child${n === 1 ? "" : "ren"}.`,
          test: (s) => s.babies >= n,
        })),
    },
    {
      n: 8,
      make: () =>
        range(1, 8).map((n) => ({
          name: `Heartbreaker ${n}`,
          desc: `Have ${n} lover${n === 1 ? "" : "s"} at once.`,
          test: (s) => s.lovers >= n,
        })),
    },
    {
      n: 10,
      make: () =>
        range(1, 10).map((n) => ({
          name: `Decorated ${n}`,
          desc: `Collect ${n} medal${n === 1 ? "" : "s"}.`,
          test: (s) => s.medals >= n,
        })),
    },
    {
      n: 10,
      make: () =>
        range(1, 10).map((n) => ({
          name: `Tally ${n}`,
          desc: `Reach a kill count of ${n}.`,
          test: (s) => s.kills >= n,
        })),
    },
    {
      n: 5,
      make: () =>
        CAREER.map(([k, name, desc]) => ({ name, desc, test: (s) => !!s.careers[k] })),
    },
    {
      n: 12,
      make: () =>
        range(1, 12).map((n) => ({
          name: `Zoo Regular ${n}`,
          desc: `Go on ${n} Zoo Trip${n === 1 ? "" : "s"} in one life.`,
          test: (s) => s.zooVisits >= n,
        })),
    },
    {
      n: 15,
      make: () =>
        range(1, 15).map((n) => ({
          name: `Zoo Stories ${n}`,
          desc: `See ${n} different Zoo Trip events.`,
          test: (s) => s.zooSeen >= n,
        })),
    },
    {
      n: 20,
      make: () =>
        range(1, 20).map((n) => ({
          name: `Clocked In ${n}`,
          desc: `Have a job for ${yrs(n)} in total.`,
          test: (s) => s.yearsJob >= n,
        })),
    },
    {
      n: 5,
      make: () =>
        range(1, 5).map((n) => ({
          name: `Time Served ${n}`,
          desc: `Spend ${yrs(n)} in prison in total.`,
          test: (s) => s.yearsPrison >= n,
        })),
    },
    {
      n: 20,
      make: () =>
        range(1, 20).map((n) => ({
          name: `Millionaire for ${yrs(n)}`,
          desc: `Hold at least $1M for ${yrs(n)} in total.`,
          test: (s) => s.yearsRich >= n,
        })),
    },
    {
      n: 15,
      make: () =>
        range(1, 15).map((n) => ({
          name: `Peak Joy ${n}`,
          desc: `Spend ${yrs(n)} with Happiness at 90 or higher.`,
          test: (s) => s.yearsHappy >= n,
        })),
    },
    {
      n: 10,
      make: () =>
        EARN.map((v) => ({
          name: `Earned ${fmt(v)}`,
          desc: `Earn ${fmt(v)} across all your lives.`,
          test: (s) => s.earned >= v,
        })),
    },
    {
      n: 28,
      make: () =>
        range(1, 28).map((n) => ({
          name: `Lives Lived ${n}`,
          desc: `Start ${n} lives.`,
          test: (s) => s.lives >= n,
        })),
    },
    {
      n: 10,
      make: () =>
        LIVED.map((v) => ({
          name: `Lived ${v} Years`,
          desc: `Live ${v} years across all your lives.`,
          test: (s) => s.yearsLived >= v,
        })),
    },
    {
      n: 7,
      make: () =>
        [30, 40, 50, 60, 70, 80, 90].map((v) => ({
          name: `Balanced ${v}`,
          desc: `Have all four stats at ${v} or higher.`,
          test: (s) => s.age >= 18 && s.minStat >= v,
        })),
    },
  ];

  const TOTAL = 410;
  const TROPHIES = [];
  const seen = new Set();
  for (const f of FAMILIES) {
    const items = f.make();
    if (items.length !== f.n) throw new Error(`[trophies-410] family size ${items.length} != ${f.n}`);
    for (const it of items) {
      const id = "t410-" + it.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      if (seen.has(it.name)) throw new Error("[trophies-410] duplicate " + it.name);
      seen.add(it.name);
      TROPHIES.push({ id, name: it.name, desc: it.desc, test: it.test });
    }
  }
  if (TROPHIES.length !== TOTAL) throw new Error(`[trophies-410] total ${TROPHIES.length} != ${TOTAL}`);

  // ------------------------------------------------------------ revisión y desbloqueo
  function check() {
    if (typeof state === "undefined" || !state || typeof showAchievement !== "function") return 0;
    updateTrack();
    if (state.dead) return 0;
    const s = snapshot();
    let n = 0;
    for (const t of TROPHIES) {
      if (typeof achAll !== "undefined" && achAll.has(t.name)) continue;
      let ok = false;
      try {
        ok = t.test(s);
      } catch {}
      if (ok) {
        showAchievement(t.name, t.desc);
        n++;
      }
    }
    return n;
  }

  function unlockedCount() {
    return typeof achAll !== "undefined" ? TROPHIES.filter((t) => achAll.has(t.name)).length : 0;
  }

  // ------------------------------------------------------------ pantalla
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

  function open() {
    const done = unlockedCount();
    const rowOf = (t) => {
      const got = typeof achAll !== "undefined" && achAll.has(t.name);
      return `<div class="row sm${got ? "" : " dis"}"><img src="emoji/${got ? "1f3c6" : "1f512"}.png" alt="" loading="lazy" decoding="async" style="object-fit:contain"><div class="t"><b>${esc(t.name)}</b><span>${esc(t.desc)}</span></div></div>`;
    };
    const PAGE = 80;
    let shown = 0;
    const showMore = () => {
      const next = Math.min(TROPHIES.length, shown + PAGE);
      const old = sList.querySelector(".fl-more");
      if (old) old.remove();
      sList.insertAdjacentHTML("beforeend", TROPHIES.slice(shown, next).map(rowOf).join(""));
      shown = next;
      if (shown < TROPHIES.length) {
        sList.insertAdjacentHTML("beforeend", '<button type="button" class="fl-more" style="display:block;margin:12px auto;padding:10px 18px;border:none;border-radius:10px;background:var(--blue);color:#fff;font-weight:800">Load more (' + (TROPHIES.length - shown) + " left)</button>");
        sList.querySelector(".fl-more").onclick = showMore;
      }
    };
    sTitle.textContent = "ACHIEVEMENTS";
    if (typeof sSub !== "undefined" && sSub && sSub.style) sSub.style.display = "none";
    sBack.innerHTML = typeof BACK_ICON !== "undefined" ? BACK_ICON : "&larr;";
    sBack.onclick = () => (typeof openMainMenu === "function" ? openMainMenu() : screen.classList.remove("open"));
    sList.innerHTML = `<div class="sec">${done} / ${TOTAL} unlocked</div>`;
    showMore();
    sList.scrollTop = 0;
    screen.classList.add("open");
  }

  function hookMenu() {
    const orig = openMainMenu;
    openMainMenu = function () {
      const r = orig.apply(this, arguments);
      try {
        const row = sList.querySelector('[data-mm="ach"]');
        if (row) row.onclick = () => open();
      } catch (e) {
        console.warn("[trophies-410] menu", e);
      }
      return r;
    };
  }

  function boot() {
    if (typeof state === "undefined" || typeof openMainMenu !== "function" || typeof sList === "undefined" || !document.getElementById("ageBtn") || typeof achAll === "undefined") return setTimeout(boot, 150);
    hookMenu();
    document.getElementById("ageBtn").addEventListener("click", () => setTimeout(check, 1000));
    setTimeout(check, 1200);
    console.log("[trophies-410] loaded:", TROPHIES.length);
  }

  window.FL_TROPHIES = { list: TROPHIES, check, open, unlockedCount, snapshot };
  boot();
})();
