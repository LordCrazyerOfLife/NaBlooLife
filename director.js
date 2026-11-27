/* [mod] Movie Director for NaBlooLife (local mod).
 *
 * Activities -> Movie Director (18+). Build a directing career film by film:
 *   1 Story (genre, theme, plot twist, premise, title) -> 2 Script (writer, doctor, rewrites) -> 3 Financing (budget tier,
 *   self-funded or a studio) -> 4 Casting (real actors by name, who AGE with the years; fees, declines, chemistry)
 *   -> 5 Shooting (production events: casting, direction, budget and effects problems) -> 6 Post (cut, score, reshoots)
 *   -> 7 Marketing and release (slot, campaigns, viral combos) -> ratings on 6 sites, box office, awards, legacy.
 * Hierarchy: Film Student -> Indie Rookie -> Festival Darling -> Studio Director -> A-List Director -> Auteur -> Legend.
 *
 * Real actors and studios appear by name only as template data (see director-data.js). No scandals are invented about a
 * real person: problems are phrased about "your lead" / "your cast".
 * State: state.dir (JSON only). API: FL_DIR.open(), .state(), .tick(), .sim(n), .evaluate(p).
 */
(() => {
  "use strict";
  if (window.FL_DIR) return;

  // ------------------------------------------------------------------ helpers
  const rnd = Math.random;
  const ri = (a, b) => a + Math.floor(rnd() * (b - a + 1));
  const pick = (a) => a[Math.floor(rnd() * a.length)];
  const cl = (v, a = 0, b = 100) => Math.max(a, Math.min(b, v));
  const ch = (p) => rnd() < p;
  const gauss = () => (rnd() + rnd() + rnd() + rnd() - 2) / 0.58;
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const money = (n) => {
    n = Math.round(n);
    const neg = n < 0;
    const a = Math.abs(n);
    const c = typeof cur === "function" ? cur() : "$";
    const f = a >= 1e9 ? (a / 1e9).toFixed(2).replace(/\.?0+$/, "") + "B" : a >= 1e6 ? (a / 1e6).toFixed(1).replace(/\.0$/, "") + "M" : a >= 1e4 ? Math.round(a / 1e3) + "K" : typeof usd === "function" ? usd(a).replace(/^-/, "") : a.toLocaleString("en-US");
    return (neg ? "-" : "") + (/^[0-9]/.test(f) && !/[$€£]/.test(f) ? c : "") + f;
  };
  const chev = () => (typeof CHEV !== "undefined" ? CHEV : "");
  const snd = (n) => {
    try {
      typeof play === "function" && play(n);
    } catch {}
  };
  const warn = (w, e) => console.warn("[director] " + w, e);
  const sayIt = (s) => {
    try {
      typeof say === "function" && say(s);
    } catch {}
  };
  const render = () => {
    try {
      renderStats();
    } catch {}
  };
  const stat = (k, d) => {
    if (state.stats) state.stats[k] = cl((Number(state.stats[k]) || 0) + d);
  };
  const addMoney = (n) => {
    state.money = Math.max(0, (Number(state.money) || 0) + n);
    render();
  };
  // Production budget (any film with a budget set, except self-funded; it counts before financing is locked too): if you are broke, the film pays for its own costs out of what is left of the budget.
  const budgetLeft = () => {
    const p = state.dir && state.dir.proj;
    if (!p || p.tier == null || p.fund === "self") return 0;
    return Math.max(0, (Number(p.B) || 0) - castCost(p) - (Number(p.bUsed) || 0));
  };
  const canPay = (n) => (Number(state.money) || 0) >= n || budgetLeft() >= n;
  const spend = (n) => {
    const pj = state.dir && state.dir.proj;
    const financed = !!(pj && pj.done && pj.done.fund && pj.fund !== "self");
    if (financed ? budgetLeft() >= n : (Number(state.money) || 0) < n) {
      if (budgetLeft() < n) return false;
      state.dir.proj.bUsed = (Number(state.dir.proj.bUsed) || 0) + n;
      render();
      return true;
    }
    if ((Number(state.money) || 0) < n) return false;
    state.money -= n;
    render();
    return true;
  };
  const LV = () => (typeof PRICE_LVL !== "undefined" && PRICE_LVL[state.country]) || 1;
  const loc = (n) => Math.round(n * LV());
  const yr = () => (Number(state.birthYear) || 2000) + (Number(state.age) || 0);
  const note = (title, text, cb) => notice(title, text, cb || null, true);
  const ICON = "director/clap.png";
  const DD = () => window.FL_DIR_DATA;
  const card = (o) => {
    try {
      jCard({ tag: "Director", iconSrc: ICON, ...o });
    } catch (e) {
      warn("card", e);
    }
  };
  const gOf = (id) => DD().GENRES.find((g) => g[0] === id) || DD().GENRES[0];
  const tOf = (id) => DD().THEMES.find((t) => t[0] === id) || DD().THEMES[0];
  const wOf = (id) => DD().TWISTS.find((t) => t[0] === id) || DD().TWISTS[0];
  const stOf = (id) => DD().STUDIOS.find((s) => s[0] === id);
  const slOf = (id) => DD().SLOTS.find((s) => s[0] === id);
  const stars = (v) => "★".repeat(Math.max(1, Math.min(5, Math.round((v - 0.6) * 5))));

  // ------------------------------------------------------------------ state
  const R = () => {
    if (!state.dir || typeof state.dir !== "object") state.dir = {};
    const d = state.dir;
    d.active ??= false;
    d.skill ??= 18;
    d.rep ??= 8;
    d.legacy ??= 0;
    d.films ??= [];
    d.proj ??= null;
    d.adj ??= {};
    d.hired ??= {};
    d.fict ??= [];
    d.pending ??= [];
    d.awards ??= [];
    d.studioRel ??= {};
    d.lastRelease ??= 0;
    d.firm ??= null;
    return d;
  };
  const rankIdx = (d) => {
    let r = 0;
    DD().RANKS.forEach((x, i) => {
      if (d.legacy >= x[1]) r = i;
    });
    return r;
  };
  const rankName = (d) => DD().RANKS[rankIdx(d)][0];
  const maxTier = (d) => DD().RANKS[rankIdx(d)][2];

  // ------------------------------------------------------------------ actors (they age with the game year)
  const curve = (age) => (age < 16 ? 0 : age < 18 ? 0.5 : age < 25 ? 0.6 + (age - 18) * 0.055 : age <= 45 ? 1 : age <= 60 ? 1 - (age - 45) * 0.008 : age <= 75 ? 0.88 - (age - 60) * 0.015 : Math.max(0.3, 0.655 - (age - 75) * 0.045));
  let _real;
  const reals = () => _real || (_real = DD().ACTORS.map((a) => ({ id: "r:" + a[0], name: a[0], b: a[1], tal: a[2], star0: a[3], tags: a[4], real: true })));
  const aAge = (a, y) => y - a.b;
  const power = (a, y) => cl(Math.round(a.star0 * curve(aAge(a, y)) + (R().adj[a.id] || 0)), 3, 100);
  const talentOf = (a, y) => cl(Math.round(a.tal * (0.82 + 0.18 * Math.min(1, aAge(a, y) / 42))), 20, 99);
  const avail = (a, y) => aAge(a, y) >= 16 && aAge(a, y) <= 84;
  const feeOf = (a, y) => Math.max(loc(5000), Math.round((15000 * Math.exp(0.0922 * (power(a, y) - 10)) * LV()) / 1000) * 1000);
  const phase = (a, y) => {
    const g = aAge(a, y);
    return g < 26 ? "Rising" : g < 46 ? "Prime" : g < 62 ? "Veteran" : "Legend";
  };
  const GN = "acdhsrtfnm";
  function ensureFict(y) {
    const d = R();
    d.fict = d.fict.filter((a) => aAge(a, y) <= 84 && aAge(a, y) >= 14);
    const need = (lo, hi, cnt, s0, s1) => {
      let guard = 0;
      while (d.fict.filter((a) => aAge(a, y) >= lo && aAge(a, y) <= hi).length < cnt && guard++ < 60) {
        const g = ri(lo, hi);
        const nm = pick(DD().FIRST) + " " + pick(DD().LAST);
        if (d.fict.some((a) => a.name === nm) || reals().some((a) => a.name === nm)) continue;
        d.fict.push({ id: "f:" + nm, name: nm, b: y - g, tal: ri(38, 82), star0: ri(s0, s1), tags: pick(GN) + pick(GN) + pick(GN), real: false });
      }
    };
    need(18, 30, 7, 10, 45);
    need(31, 50, 4, 18, 58);
    need(55, 76, 3, 15, 50);
  }
  const pool = (y) => {
    ensureFict(y);
    return reals().concat(R().fict).filter((a) => avail(a, y));
  };

  // ------------------------------------------------------------------ project
  const ROLES = (tier) => (tier <= 0 ? ["Lead", "Supporting"] : tier === 1 ? ["Lead", "Co-lead", "Villain"] : tier === 2 ? ["Lead", "Co-lead", "Villain", "Supporting"] : ["Lead", "Co-lead", "Villain", "Supporting", "Cameo"]);
  const RW = { Lead: 1, "Co-lead": 0.7, Villain: 0.55, Supporting: 0.35, Cameo: 0.2 };
  const newProj = () => ({ id: Date.now(), start: yr(), stage: "story", genre: null, theme: null, twist: null, premise: "", title: "", sq: 0, flaws: [], writer: null, rewrites: 0, tier: null, B: 0, fund: null, cast: {}, declined: {}, issues: [], q: { script: 0, acting: 0, direction: 0, prod: 0, edit: 0 }, buzz: 0, viral: 0, chem: 0, overrun: 0, cutKind: null, score: null, polish: false, slot: null, ads: [], done: {}, rej: {}, sequel: false, miscast: false, cutLong: false, style: null, crew: {}, did: {}, place: [], presale: false, producer: false, castDir: false, plan: "std", trailer: null, rehearsed: false, screened: false, trimmed: false, cb: 0, ab: 0 });
  const castCost = (p) => Object.values(p.cast).reduce((s, c) => s + (c ? c.fee : 0), 0);
  const scriptBase = (p) => {
    let s = 44 + Math.round((Number(state.stats && state.stats.Smarts) || 50) * 0.12);
    const k = p.genre + ":" + p.theme;
    if (DD().GT_GOOD.has(k)) s += 8;
    else if (DD().GT_BAD.has(k)) s -= 8;
    s += wOf(p.twist)[2];
    if (DD().GW_GOOD.has(p.genre + ":" + p.twist)) s += 5;
    return s;
  };
  const gtGood = (p) => DD().GT_GOOD.has(p.genre + ":" + p.theme);
  const WRITER_BONUS = [0, 2, 10, 20];
  const WRITER_COST = [0, 20000, 120000, 600000].map((n) => n);
  const wCost = (i) => loc(WRITER_COST[i]);
  const FLAW_TXT = ["a plot hole in the second act", "a weak third act", "clunky dialogue", "a slow middle", "a twist that does not add up", "a flat villain"];
  function rollFlaws(p) {
    let n = (p.sq < 45 ? 2 : p.sq < 62 ? 1 : 0) + (ch(wOf(p.twist)[4]) ? 1 : 0);
    n = Math.min(3, n);
    p.flaws = [];
    for (let i = 0; i < n; i++) p.flaws.push({ k: "script", sev: 1, text: pick(FLAW_TXT) });
  }
  const mkTitle = (p) => {
    const a = pick(DD().TITLE_A), b = pick(DD().TITLE_B);
    return pick([`${a} ${b}`, `The ${a} ${b}`, `${b} of ${a}`, `${a} ${b}`]);
  };

  // ------------------------------------------------------------------ evaluation (pure: used by release and by sim)
  const GRADES = [[86, "A+"], [78, "A"], [72, "A-"], [66, "B+"], [60, "B"], [54, "B-"], [48, "C+"], [42, "C"], [36, "C-"], [28, "D"], [0, "F"]];
  const gradeOf = (a) => (GRADES.find((g) => a >= g[0]) || GRADES[10])[1];
  const mcLabel = (v) => (v >= 81 ? "Universal acclaim" : v >= 61 ? "Generally favorable" : v >= 40 ? "Mixed or average" : v >= 20 ? "Generally unfavorable" : "Overwhelming dislike");
  function evaluate(p, ctx) {
    const D = DD();
    const g = gOf(p.genre);
    const slot = slOf(p.slot) || D.SLOTS[0];
    const stu = stOf(p.fund);
    const rank = ctx.rank;
    const issuePen = p.issues.reduce((s, i) => s + i.sev, 0) + p.flaws.length * 0;
    // viral combos
    const cast = Object.entries(p.cast).filter((e) => e[1]).map(([role, c]) => ({ role, star: c.star, age: c.age }));
    const flags = {
      genre: p.genre, theme: p.theme, twist: p.twist, budgetTier: p.tier, slot: p.slot, cast, ads: p.ads, q: p.q,
      gtGood: gtGood(p), chemGood: p.chem > 0 && !!(p.cast.Lead && p.cast["Co-lead"]), stuntOk: p.ads.includes("stunt") && ch(0.45 + ctx.rep / 250),
      badTrailer: p.ads.includes("trailer") && p.q.direction < 48 && ch(0.35 * (p.trailer === "mystery" ? 1.4 : 1)), cutLong: p.cutLong, sequel: p.sequel, miscast: p.miscast,
      crowded: p.crowded,
    };
    let viral = 12 + p.viral - 2 * (p.place || []).length + (p.buzz > 8 ? 4 : 0);
    if (p.ads.includes("trailer")) viral += p.trailer === "mystery" ? 4 : p.trailer === "full" ? -3 : 1;
    const combos = [];
    D.COMBOS.forEach((c) => {
      try {
        if (c[3](flags)) {
          combos.push({ l: c[1], d: c[2] });
          viral += c[2];
        }
      } catch {}
    });
    viral = cl(Math.round(viral + gauss() * 4), 0, 100);
    // quality -> scores
    const q = p.q;
    const entertain = cl(50 + g[5] * 3 + viral * 0.25);
    const critic = cl(0.34 * q.script + 0.24 * q.direction + 0.2 * q.acting + 0.1 * q.prod + 0.12 * q.edit + g[4] + (p.cb || 0) - issuePen * 2 + gauss() * 6, 5, 99);
    const aud = cl(0.22 * q.script + 0.2 * q.acting + 0.18 * q.prod + 0.12 * q.edit + 0.1 * q.direction + 0.18 * entertain + g[5] * 1.2 + (p.ab || 0) - 1.5 * (p.place || []).length - issuePen * 1.5 + gauss() * 6, 5, 99);
    const R_ = {
      rt: Math.round(cl(((critic - 35) / 50) * 100 + gauss() * 4, 0, 100)),
      aud: Math.round(cl(((aud - 30) / 55) * 100 + gauss() * 3, 0, 100)),
      imdb: Math.round(cl(2.2 + aud * 0.05 + critic * 0.025 + gauss() * 0.25, 1.5, 9.4) * 10) / 10,
      mc: Math.round(cl(critic + gauss() * 3, 8, 96)),
      lb: Math.round(cl(0.8 + ((0.5 * critic + 0.5 * aud) / 100) * 4 + gauss() * 0.15, 0.6, 4.9) * 10) / 10,
      cs: gradeOf(aud + gauss() * 2),
    };
    // box office
    const w = Object.entries(p.cast).reduce((a, [role, c]) => [a[0] + (c ? RW[role] * c.star : 0), a[1] + RW[role]], [0, 0]);
    const castDraw = w[1] ? w[0] / w[1] : 20;
    const mkt = stu ? stu[5] : p.ads.length ? 2 : 0;
    const buzzTot = p.buzz + p.ads.reduce((s, a) => s + (D.MARKETING.find((m) => m[0] === a) || [0, 0, 0, 3])[3], 0) + (stu ? stu[5] * 1.2 : 0);
    const H = 20 + castDraw * 0.5 + buzzTot * 2.2 + mkt * 3 + rank * 3 + ctx.rep * 0.2;
    const reach = p.slot === "festival" ? 0.08 : stu ? (stu[2].startsWith("Indie") ? 0.3 : stu[0] === "nfx" ? 1 : 0.6 + stu[5] / 25) : 0.12;
    const gMult = slot[2][p.genre] || 1;
    const slotBase = { spring: 0.85, summer: 1.1, halloween: 0.95, awards: 0.95, holiday: 1.2, festival: 0.3, stream: 1 }[p.slot] || 1;
    const comp = p.crowded ? 0.75 : slot[3] * 0.4;
    const boost = 1 + Math.pow(viral / 60, 2);
    let opening = p.B * 2.4 * reach * Math.pow(Math.min(1.8, Math.max(0.2, H / 70)), 1.8) * gMult * slotBase * g[3] * boost / (1 + 0.5 * comp);
    const legs = cl(1.8 + (aud - 55) / 18 + viral / 60 + g[7] + (p.slot === "festival" ? 1.2 : 0), 1.3, 8);
    let gross = opening * legs;
    {
      // soft cap on the multiple so A-list casts and giant marketing cannot print money forever
      const th = p.tier >= 2 ? 7 : 40;
      let m = gross / Math.max(1, p.B);
      if (m > th) m = th + (m - th) * 0.25;
      if (m > th * 2.5) m = th * 2.5 + (m - th * 2.5) * 0.1;
      gross = m * p.B;
      opening = gross / legs;
    }
    const streamer = stu && stu[0] === "nfx";
    const isStream = p.slot === "stream" || streamer;
    let views = 0;
    if (isStream) {
      views = Math.round(cl(0.4 + (H / 70) * 6 + viral / 8 + (aud - 50) / 10, 0.1, 80) * 10) / 10;
      gross = 0;
      opening = 0;
    }
    const mktCost = p.mktCost || 0;
    const rev = isStream ? 0 : gross * (0.5 + (aud > 65 ? 0.25 : 0.18)) * (p.presale && !stu ? 0.88 : 1);
    const cost = p.B + mktCost;
    const profit = rev - cost;
    let take = 0, studioNet = 0;
    if (streamer) take = p.B * 0.08 + (aud >= 70 ? p.B * 0.03 : 0);
    else if (stu) {
      studioNet = profit;
      const back = 0.06 + rank * 0.01;
      take = p.B * (0.04 + rank * 0.005) * 0 + (profit > 0 ? profit * back : 0);
    } else if (p.fund === "grant") take = rev * 0.5;
    else {
      take = rev * 0.85;
    }
    // quotes
    const top = p.issues.slice().sort((a, b) => b.sev - a.sev).concat(p.flaws);
    const crit = critic >= 75 ? "Critics call it " + pick(D.CRIT_GOOD) : top.length ? "Critics note that " + (D.CRIT_ISSUE[top[0].k] || top[0].text) + (top[1] ? " and that " + (D.CRIT_ISSUE[top[1].k] || top[1].text) : "") : critic >= 55 ? "Critics are split but respectful" : "Critics find little to love";
    const audq = aud >= 70 ? "Audiences say " + pick(D.AUD_GOOD) : "Audiences say " + pick(D.AUD_BAD);
    return { critic: Math.round(critic), aud: Math.round(aud), viral, combos, ratings: R_, opening: Math.round(opening), gross: Math.round(gross), legs: Math.round(legs * 10) / 10, rev: Math.round(rev), cost, profit: Math.round(profit), take: Math.round(take), views, stream: isStream, crit, audq, H: Math.round(H) };
  }

  // ------------------------------------------------------------------ shooting
  function applyCreative(p) {
    const g = gOf(p.genre);
    const D = DD();
    const st = D.STYLES.find((x) => x[0] === p.style);
    if (st) {
      for (const k in st[3]) p.q[k] = cl(p.q[k] + st[3][k]);
      p.viral += st[4];
      p.cb = (p.cb || 0) + st[5];
      p.ab = (p.ab || 0) + st[6];
      if (p.style === "epic") p.overrun += 6;
    }
    const lv = (k) => p.crew[k] || 0;
    p.q.prod = cl(p.q.prod + [0, 3, 7][lv("dp")] + (g[6] > 1 ? [0, 3, 7][lv("vfx")] : 0));
    p.q.direction = cl(p.q.direction + [0, 2, 4][lv("dp")]);
    p.q.edit = cl(p.q.edit + [0, 4, 8][lv("editor")]);
    if (p.did.classics) p.q.direction = cl(p.q.direction + 2);
    if (p.did.scout) p.q.prod = cl(p.q.prod + 3);
    if (p.did.consult) p.q.script = cl(p.q.script + 3);
    if (p.plan === "fast") { p.q.direction = cl(p.q.direction - 3); p.q.prod = cl(p.q.prod - 2); }
    if (p.plan === "perf") { p.q.direction = cl(p.q.direction + 2); p.q.prod = cl(p.q.prod + 3); }
  }
  function initQuality(p) {
    const y = yr();
    const d = R();
    const g = gOf(p.genre);
    const base = DD().BUDGETS[p.tier];
    const spendRatio = cl((p.B - castCost(p)) / (p.B * 0.7), 0.3, 1.2);
    let prod = base[3] * (0.7 + 0.3 * Math.min(1, spendRatio));
    if (g[6] >= 1.2 && p.tier <= 2) prod -= 12;
    if (g[6] <= 0.6 && p.tier >= 3) prod += 4;
    let s = 0, t = 0;
    ROLES(p.tier).forEach((role) => {
      const c = p.cast[role];
      s += RW[role] * (c ? c.tal * (0.75 + 0.25 * c.fit) : 42);
      t += RW[role];
    });
    p.q = {
      script: cl(p.sq),
      acting: cl(s / t + p.chem * 5),
      direction: cl(30 + d.skill * 0.6 + gauss() * 4),
      prod: cl(prod + gauss() * 3),
      edit: 50,
    };
    p.issues = p.issues.concat(p.flaws);
    applyCreative(p);
  }
  const FXQ = ["script", "acting", "direction", "prod", "edit"];
  function applyFx(p, fx) {
    if (!fx) return;
    const d = R();
    for (const k in fx) {
      const v = fx[k];
      if (FXQ.includes(k)) p.q[k] = cl(p.q[k] + v);
      else if (k === "bud") p.overrun += v;
      else if (k === "buzz") p.buzz += v;
      else if (k === "viral") p.viral += v;
      else if (k === "chem") p.chem += v;
      else if (k === "skill") d.skill = cl(d.skill + v);
      else if (k === "issue") p.issues.push({ k: v[0], sev: v[1], text: v[2] });
    }
  }
  function pickEvents(p) {
    const g = gOf(p.genre);
    const n = Math.max(2, 3 + (p.tier >= 3 ? 1 : 0) + (p.tier >= 4 ? 1 : 0) + (p.plan === "perf" ? 1 : 0) - (p.plan === "fast" ? 1 : 0));
    let bag = DD().EVENTS.filter((e) => (e.id !== "chem" || (p.cast.Lead && p.cast["Co-lead"])) && (e.id !== "vfx" || g[6] > 1) && (e.id !== "pressure" || stOf(p.fund)));
    const out = [];
    if (p.chem < 0) {
      const e = bag.find((x) => x.id === "chem");
      if (e) out.push(e);
    }
    while (out.length < n && bag.length) {
      const e = pick(bag);
      bag = bag.filter((x) => x !== e);
      if (!out.includes(e)) out.push(e);
    }
    return out;
  }
  function runEvent(p, e, next) {
    const d = R();
    card({
      title: e.t,
      lead: e.d,
      surprise: true,
      choices: e.c.map((c) => [c[0], () => {
        const f = c[1];
        let win = true;
        if (f.win != null) win = ch(cl(f.win + (d.skill - 30) / 300 + 0.08 * ((p.crew || {})[({ weather: "dp", cut: "dp", accident: "stunt", vfx: "vfx" })[e.id]] || 0), 0.1, 0.95));
        if (window.FL_SND) FL_SND.result(win);
        if (f.cash) {
          if (!spend(Math.round(p.B * f.cash))) {
            note(e.t, "You do not have the cash for that.", () => runEvent(p, e, next));
            return;
          }
        }
        applyFx(p, win ? f.w : f.l || f.w);
        const msg = win ? "That worked out." : "It did not go your way.";
        note(e.t, msg, next);
      }]),
    });
  }
  function runSteps(steps, done) {
    const f = (i) => (i >= steps.length ? done() : steps[i](() => f(i + 1)));
    f(0);
  }

  // ------------------------------------------------------------------ finishing: save film, legacy, rewards
  function mkRelease(p) {
    const d = R();
    const y = yr();
    p.crowded = ch(slOf(p.slot)[3] * 0.35);
    const res = evaluate(p, { rank: rankIdx(d), rep: d.rep });
    const stu = stOf(p.fund);
    const f = {
      id: p.id, title: p.title, year: y, genre: p.genre, theme: p.theme, twist: p.twist, premise: p.premise, tier: p.tier, B: p.B, fund: p.fund, slot: p.slot,
      studio: stu ? stu[1] : p.fund === "grant" ? "Film school grant" : "Self-funded", sequel: p.sequel,
      cast: ROLES(p.tier).filter((r) => p.cast[r]).map((r) => ({ role: r, n: p.cast[r].name, age: p.cast[r].age, real: p.cast[r].real })),
      issues: p.issues.map((i) => ({ k: i.k, text: i.text, sev: i.sev })), q: p.q, crowded: p.crowded,
      ...res,
    };
    d.films.unshift(f);
    d.films = d.films.slice(0, 40);
    d.lastRelease = y;
    d.proj = null;
    // legacy + rep + skill
    const mult = f.stream ? 0 : f.gross / Math.max(1, p.B);
    let lg = (f.critic - 50) / 6 + (f.aud - 50) / 10 + (mult >= 2 ? 3 : 0) + (mult >= 4 ? 4 : 0) + p.tier * 1.2 + (p.slot === "festival" && f.critic >= 70 ? 3 : 0);
    lg = Math.round(cl(lg, -4, 25));
    const before = rankIdx(d);
    d.legacy = Math.max(0, d.legacy + lg);
    d.rep = cl(d.rep + Math.round(((f.critic + f.aud) / 2 - 55) / 4) + (mult >= 3 ? 4 : 0));
    d.skill = cl(d.skill + (f.critic >= 70 ? 3 : f.critic >= 50 ? 2 : 1));
    f.legacyGain = lg;
    f.rankUp = rankIdx(d) > before ? DD().RANKS[rankIdx(d)][0] : null;
    // stars rise or fall with your films
    const dl = cl(Math.round(((f.critic + f.aud) / 2 - 55) / 8), -4, 6);
    Object.values(p.cast).forEach((c) => {
      if (!c) return;
      d.adj[c.id] = cl((d.adj[c.id] || 0) + dl, -15, 15);
      d.hired[c.id] = (d.hired[c.id] || 0) + 1;
    });
    if (p.fund && d.studioRel) d.studioRel[p.fund] = cl((d.studioRel[p.fund] || 0) + (f.critic + f.aud >= 110 ? 8 : f.critic + f.aud >= 80 ? 2 : -6), -30, 60);
    // money arrives at the next birthday
    if (f.take) d.pending.push({ due: y + 1, amt: f.take, t: f.title });
    sayIt(`My film "${f.title}" was released. ${f.stream ? "It streamed to " + f.views + "M viewers." : "It grossed " + money(f.gross) + "."}`);
    return f;
  }

  // ------------------------------------------------------------------ screens
  const barOld = (label, v, color) => `<div style="margin:3px 0"><span style="font-size:12px;opacity:.8">${esc(label)} ${Math.round(v)}%</span><i style="display:block;height:7px;border-radius:4px;background:#0002;overflow:hidden;margin-top:2px"><u style="display:block;height:100%;width:${Math.max(3, v)}%;background:${color}"></u></i></div>`;
  const bar = (label, v, color, hint) => (window.FL_BARS ? FL_BARS.html(label, v, color, hint) : barOld(label, v, color));
  const col = (v) => (v >= 70 ? "#2fa03b" : v >= 45 ? "#f5841f" : "#b3261e");
  const openScreen = (title, back) => {
    if (typeof screen === "undefined" || typeof sList === "undefined") return false;
    sTitle.textContent = title;
    if (typeof sSub !== "undefined" && sSub && sSub.style) sSub.style.display = "none";
    sBack.innerHTML = typeof BACK_ICON !== "undefined" ? BACK_ICON : "&larr;";
    sBack.onclick = back;
    screen.classList.add("open");
    sList.scrollTop = 0;
    return true;
  };
  const row = (id, ic, t, s, dis) => `<div class="row${dis ? " dis" : ""}" data-n="${esc(id)}"><img src="${ic}" alt="" style="object-fit:contain"><div class="t"><b>${esc(t)}</b><span>${esc(s)}</span></div>${dis ? "" : chev()}</div>`;
  const wire = (map) =>
    sList.querySelectorAll("[data-n]").forEach((el) => {
      if (el.classList.contains("dis")) return;
      el.onclick = () => {
        snd("choice");
        const f = typeof map === "function" ? map(el.dataset.n) : map[el.dataset.n];
        if (f) f(el.dataset.n);
      };
    });
  const sec = (t) => `<div class="sec">${esc(t)}</div>`;
  const foot = (t) => `<div class="mm-foot" style="padding:8px 14px">${esc(t)}</div>`;
  const back2hub = () => openHub();
  const back2dash = () => openDash();
  const listScreen = (title, back, rows, onPick, head) => {
    if (!openScreen(title, back)) return;
    sList.innerHTML = (head || "") + rows.map((r) => row(r[0], r[1], r[2], r[3], r[4])).join("");
    wire((id) => () => onPick(id));
  };

  // ---- hub
  function openHub() {
    const d = R();
    if (typeof isOldEra === "function" && isOldEra()) return note("Not yet", "Cinema has not been invented in this era.");
    if (state.age < 18) return note("Too young", "You must be at least 18 to direct films.");
    if (!d.active) {
      snd("choice");
      card({
        title: "Movie Director",
        lead: "Start a career behind the camera. You will write, finance, cast and shoot your own films, and the world will rate them on every site that matters. Your first short is on a student budget.",
        choices: [["Become a director", () => { if (window.FL_CAREERS && !window.FL_CAREERS.canStart("Movie Director")) return; d.active = true; d.firm = d.firm || "Indie Pictures"; sayIt("I decided to become a film director."); openHub(); }], ["Not now", () => {}]],
      });
      return;
    }
    snd("choice");
    if (!openScreen("MOVIE DIRECTOR", () => (typeof openSpecialCareers === "function" ? openSpecialCareers() : screen.classList.remove("open")))) return;
    const ri_ = rankIdx(d);
    const next = DD().RANKS[ri_ + 1];
    const pct = next ? Math.round(((d.legacy - DD().RANKS[ri_][1]) / (next[1] - DD().RANKS[ri_][1])) * 100) : 100;
    let h = sec(d.firm || "Indie Pictures");
    h += `<div class="row" style="flex-direction:column;align-items:stretch;height:auto;padding:10px 14px"><div style="display:flex;align-items:center;gap:10px"><img src="${ICON}" alt="" style="width:44px;height:44px;object-fit:contain"><div><b style="color:#fff">${esc(rankName(d))}</b><div style="font-size:12px;opacity:.75">${d.films.length} film${d.films.length === 1 ? "" : "s"} · ${d.legacy} legacy${next ? ` · next: ${esc(next[0])} at ${next[1]}` : ""}</div></div></div>` + bar("Rank progress", pct, "#6b2f8f") + bar("Reputation", d.rep, col(d.rep)) + bar("Directing skill", d.skill, col(d.skill)) + `</div>`;
    h += sec("Work");
    const p = d.proj;
    if (p) h += row("proj", p.stage === "story" && !p.genre ? ICON : gOf(p.genre)[2], p.title || "New film", ready(p) ? "Ready to release" : "In production");
    else h += row("new", ICON, "Start a new film", d.films[0] && !d.films[0].stream && d.films[0].gross >= d.films[0].B * 2 ? "Your last film was a hit: a sequel is on the table" : "Story, script, money, cast, shoot, post and release");
    h += row("films", "emoji/1f39e-fe0f.png", "Filmography", d.films.length ? `${d.films.length} film${d.films.length === 1 ? "" : "s"} · best: ${bestFilm(d)}` : "Nothing released yet");
    h += row("talent", "emoji/1f31f.png", "Talent agency", "Every actor, their age this year and their star power");
    h += row("studios", "emoji/1f3e2.png", "Studios", "Who wants your genre, and how they treat you");
    h += row("awards", "director/award.png", "Awards", `${d.awards.filter((a) => a.won).length} won · ${d.awards.length} nominations`);
    sList.innerHTML = h;
    wire({ proj: () => (d.proj && !d.proj.genre && !d.proj.done.story ? storyGenre() : openProject()), new: () => startNew(), films: () => openFilms(), talent: () => openTalent(null), studios: () => openStudios(), awards: () => openAwards() });
  }
  const bestFilm = (d) => {
    const b = d.films.slice().sort((a, c) => c.critic + c.aud - (a.critic + a.aud))[0];
    return b ? b.title : "-";
  };
  // ---- start new / sequel
  function startNew() {
    const d = R();
    if (d.proj) return openProject();
    const last = d.films[0];
    const mk = (sequel) => {
      const p = newProj();
      if (sequel && last) {
        p.genre = last.genre;
        p.theme = last.theme;
        p.twist = "none";
        p.sequel = true;
        p.premise = "The story continues. Everything is bigger, and the stakes are personal.";
        const nm = last.title.replace(/ \d+$/, "");
        p.title = `${nm} ${(last.title.match(/ (\d+)$/) ? +last.title.match(/ (\d+)$/)[1] : 1) + 1}`;
        p.done.story = true;
        p.viral = 3;
        p.buzz = 4;
      }
      d.proj = p;
      sayIt("I started working on a new film.");
      curDept = "dev";
      sequel ? openProject() : storyGenre();
    };
    if (last && !last.stream && last.gross >= last.B * 2 && last.genre) {
      card({ title: "A sequel?", lead: `"${esc(last.title)}" made money. The studios are already asking about a follow-up. Sequels start with built-in buzz, but audiences punish lazy ones.`, choices: [["Make a sequel", () => mk(true)], ["Something new", () => mk(false)], ["Not now", () => {}]] });
    } else mk(false);
  }

  // ---- project hub and departments (work in any order, most things are optional)
  let curDept = null;
  const DEPTS = [
    ["dev", "Development", "Concept, script, prep and style", "emoji/1f4dd.png"],
    ["money", "Money", "Budget, financing, producers and deals", "emoji/1f4b0.png"],
    ["crew", "Cast and crew", "Actors and the team behind the camera", "emoji/1f3ad.png"],
    ["shoot", "The shoot", "Your plan, rehearsals and the cameras", "emoji/1f3ac.png"],
    ["post", "Post-production", "Cut, score, screenings and reshoots", "emoji/2702-fe0f.png"],
    ["mkt", "Marketing and release", "Date, campaigns and the premiere", "emoji/1f4e2.png"],
  ];
  const ready = (p) => !!(p.done.story && p.done.script && p.done.fund && p.done.cast && p.done.shoot && p.done.post && p.slot);
  const pc = (p, pct) => Math.max(loc(500), Math.round((p.B || loc(100000)) * pct));
  const missing = (p) => {
    const m = [];
    if (!p.done.story) m.push("a concept");
    if (!p.done.script) m.push("a locked script");
    if (!p.done.fund) m.push("financing");
    if (!p.done.cast) m.push("a locked cast");
    if (!p.done.shoot) m.push("the shoot");
    if (!p.done.post) m.push("a locked cut");
    if (!p.slot) m.push("a release date");
    return m;
  };
  const fundLabel = (p) => (stOf(p.fund) ? stOf(p.fund)[1] : p.fund === "grant" ? "film school grant" : p.fund === "self" ? "self-funded" : "no financing yet");
  const castN = (p) => Object.values(p.cast).filter(Boolean).length;
  const deptLine = (p, id) => {
    if (id === "dev") return p.done.script ? `Script locked at ${p.sq}%${p.style ? " · style set" : ""}` : p.writer ? `Script draft at ${p.sq}%` : p.done.story ? `"${p.title}" · script not started` : "Concept not started";
    if (id === "money") return `${p.tier != null ? money(p.B) : "No budget"} · ${fundLabel(p)}`;
    if (id === "crew") return `${castN(p)}/${ROLES(p.tier == null ? 2 : p.tier).length} cast${p.done.cast ? " (locked)" : ""} · ${Object.keys(p.crew).length} crew hired`;
    if (id === "shoot") return p.done.shoot ? "Wrapped" : p.done.script && p.done.fund && p.done.cast ? "Ready to shoot" : "Not ready yet";
    if (id === "post") return !p.done.shoot ? "After the shoot" : p.done.post ? "Locked" : p.cutKind ? "In progress" : "Not started";
    return !p.done.shoot ? "After the shoot" : p.slot ? `${slOf(p.slot)[1]} · ${p.ads.length} campaign${p.ads.length === 1 ? "" : "s"}` : "No date set yet";
  };
  function filmCard(p) {
    const g = p.genre ? gOf(p.genre) : null;
    const cs = Object.values(p.cast).filter(Boolean);
    const avg = cs.length ? Math.round(cs.reduce((s, c) => s + c.star, 0) / cs.length) : 0;
    const open = p.issues.filter((i) => i.sev > 0 && !i.fixed).length + p.flaws.length;
    return (
      `<div class="row" style="flex-direction:column;align-items:stretch;height:auto;padding:10px 14px"><div style="display:flex;align-items:center;gap:10px"><img src="${g ? g[2] : ICON}" alt="" style="width:40px;height:40px;object-fit:contain"><div><b style="color:#fff">${esc(p.title || "A new film")}</b><div style="font-size:12px;opacity:.75">${g ? esc(g[1]) + " · " + esc(tOf(p.theme)[1]) + (p.twist && p.twist !== "none" ? " · " + esc(wOf(p.twist)[1]) : "") : "No concept yet"}</div></div></div>` +
      (p.writer ? bar("Script", p.sq, col(p.sq)) : "") +
      (cs.length ? bar("Cast star power", avg, col(avg)) : "") +
      (p.tier != null ? `<div style="font-size:12px;opacity:.8;margin-top:4px">Budget ${money(p.B)} · ${esc(fundLabel(p))}${open ? ` · ${open} open problem${open === 1 ? "" : "s"}` : ""}</div>` : "") +
      `</div>`
    );
  }
  function openProject() {
    curDept = null;
    const d = R();
    const p = d.proj;
    if (!p) return openHub();
    if (!p.genre && !p.done.story && p.stage === "story") return storyGenre(); // proyecto nuevo sin género: abre el flujo de "new film", no el dashboard vacío
    if (!openScreen((p.title || "NEW FILM").toUpperCase(), back2hub)) return;
    let h = filmCard(p) + sec("Departments");
    h += DEPTS.map(([id, name, , ic]) => row("d_" + id, ic, name, deptLine(p, id))).join("");
    if (ready(p)) h += sec("Ready") + row("release", "emoji/1f3ac.png", "Release the film", "Premiere day");
    else h += foot("Still needed to release: " + missing(p).join(", ") + ". Do it in any order.");
    h += row("shelve", "emoji/1f5d1-fe0f.png", "Shelve the project", "Walk away from it");
    sList.innerHTML = h;
    wire((id) => () => {
      if (id.startsWith("d_")) return openDept(id.slice(2));
      if (id === "release") return releaseFilm();
      if (id === "shelve") card({ title: "Shelve it?", lead: "You will lose what you put into it.", choices: [["Shelve the project", () => { d.proj = null; openHub(); }], ["Keep going", () => openProject()]] });
    });
  }
  function openDash() {
    const p = R().proj;
    if (!p) return openHub();
    return curDept ? openDept(curDept) : openProject();
  }
  function openDept(id) {
    const d = R();
    const p = d.proj;
    if (!p) return openHub();
    curDept = id;
    if (id === "post") return openPost();
    if (id === "mkt") return openMkt();
    const meta = DEPTS.find((x) => x[0] === id);
    if (!openScreen(meta[1].toUpperCase(), openProject)) return;
    const A = deptActions(p, id);
    sList.innerHTML = filmCard(p) + A.map((x) => (x.sec ? sec(x.sec) : row(x.id, x.ic, x.t, x.s, x.dis))).join("");
    const map = {};
    A.forEach((x) => {
      if (x.id) map[x.id] = x.fn;
    });
    wire(map);
  }
  function pickStyle(p) {
    card({ title: "Visual style", lead: "How should the film look and feel?", choices: DD().STYLES.map((s) => [`${s[1]}: ${s[2]}`, () => { p.style = s[0]; note("Style", `${s[1]} it is.`, openDash); }]).concat([["Not now", () => openDash()]]) });
  }
  function pickPlan(p) {
    card({ title: "Shooting plan", lead: "How hard will you push the schedule?", choices: DD().PLANS.map((s) => [`${s[1]}: ${s[2]}`, () => { p.plan = s[0]; note("Plan", `${s[1]}.`, openDash); }]).concat([["Not now", () => openDash()]]) });
  }
  function pickCrew(p, k) {
    const c = DD().CREW[k];
    card({
      title: c[0],
      lead: c[1],
      choices: c[2].map((o, i) => [`${o[0]}${o[1] ? " · " + money(pc(p, o[1])) : " · free"}`, () => {
        const cost = o[1] ? pc(p, o[1]) : 0;
        if (cost && !spend(cost)) return note("Not enough money", "You cannot afford that.", () => pickCrew(p, k));
        p.crew[k] = i;
        p.did["crew_" + k] = true;
        note(c[0], `${o[0]} is on board.`, openDash);
      }]).concat([["Not now", () => openDash()]]),
    });
  }
  function payDo(p, pct, fn, label) {
    const c = pc(p, pct);
    if (c && !spend(c)) return note("Not enough money", `That costs ${money(c)}.`, openDash);
    fn();
    note(label[0], label[1], openDash);
  }
  function deptActions(p, id) {
    const A = [];
    const a = (aid, ic, t, s, dis, fn) => A.push({ id: aid, ic, t, s, dis, fn });
    const S = (t) => A.push({ sec: t });
    const needB = p.tier == null;
    const roles = ROLES(p.tier == null ? 2 : p.tier);
    if (id === "dev") {
      S("Concept");
      a("story", "emoji/1f4dd.png", p.done.story ? `Concept: ${p.title}` : "Develop the concept", p.done.story ? `${gOf(p.genre)[1]} · ${tOf(p.theme)[1]} · ${wOf(p.twist)[1]}${p.done.script ? "" : " · tap to rework (you lose the draft)"}` : "Genre, theme, plot twist, premise and title", !!p.done.script, () => {
        if (p.done.story) { p.done.story = false; p.writer = null; p.sq = 0; p.flaws = []; p.rewrites = 0; }
        storyGenre();
      });
      a("script", "emoji/270d-fe0f.png", "Script", !p.done.story ? "Needs a concept first" : p.done.script ? `Locked at ${p.sq}%` : p.writer ? `Draft at ${p.sq}%. Fix it up and lock it` : "Hire a writer or write it yourself", !p.done.story, openScript);
      S("Prep (optional, pick two)");
      const nDone = DD().RESEARCH.filter((r) => p.did[r[0]]).length;
      DD().RESEARCH.forEach((r) => {
        const used = !!p.did[r[0]];
        const cost = r[3] ? pc(p, r[3]) : 0;
        a("rs_" + r[0], "emoji/1f4da.png", r[1], used ? "Done" : nDone >= 2 ? "You already did two prep jobs" : needB && r[3] ? "Needs a budget first" : `${cost ? money(cost) : "Free"} · ${r[4]}`, used || nDone >= 2 || (needB && !!r[3]), () => payDo(p, r[3], () => { p.did[r[0]] = true; }, [r[1], r[4] + "."]));
      });
      S("Look");
      const stl = p.style && DD().STYLES.find((s) => s[0] === p.style);
      a("style", "emoji/1f3a8.png", "Visual style", stl ? `Chosen: ${stl[1]}` : "Pick a look. It changes how critics and crowds react", !p.done.story, () => pickStyle(p));
    } else if (id === "money") {
      S("Budget and financing");
      a("budget", "emoji/1f4b0.png", p.tier != null ? `Budget: ${money(p.B)}` : "Set the budget", p.tier != null ? `${tierRange(p.tier)[0]} tier · tap to change (resets the cast and the financing)` : "Pick a tier and an amount", !p.done.story, pickBudget);
      a("fund", "emoji/1f3e6.png", p.done.fund ? `Financing: ${fundLabel(p)}` : "Find the money", needB ? "Set a budget first" : !p.writer ? "Write a draft first, studios want to read it" : "Self-fund, a grant, a studio or a streamer", needB || !p.writer, openFund);
      S("Deals (optional)");
      a("producer", "emoji/1f4bc.png", "Attach an executive producer", p.producer ? "On board" : needB ? "Needs a budget first" : `${money(pc(p, 0.02))} · studios say yes more often and the shoot stays on budget`, needB || p.producer, () => payDo(p, 0.02, () => { p.producer = true; }, ["Executive producer", "A veteran producer is attached."]));
      a("presale", "emoji/1f30e.png", "Pre-sell foreign rights", p.presale ? "Sold" : needB ? "Needs a budget first" : stOf(p.fund) ? "A studio already owns the rights" : `Cash now: ${money(pc(p, 0.12))} · you give up 12% of the earnings`, needB || p.presale || !!stOf(p.fund), () => { addMoney(pc(p, 0.12)); p.presale = true; note("Pre-sale", `Foreign buyers paid ${money(pc(p, 0.12))} up front.`, openDash); });
      a("place", "emoji/1f6cd-fe0f.png", "Product placement", needB ? "Needs a budget first" : `${p.place.length}/3 deals · each pays ${money(pc(p, 0.04))}, audiences notice`, needB || p.place.length >= 3, () => {
        const opts = DD().BRANDS.filter((b) => !p.place.includes(b)).sort(() => rnd() - 0.5).slice(0, 3);
        card({ title: "Product placement", lead: "Brands are offering money to be in your film.", choices: opts.map((b) => [`${b} · ${money(pc(p, 0.04))}`, () => { addMoney(pc(p, 0.04)); p.place.push(b); note("Placement", `${b} is in the film, and everybody will notice.`, openDash); }]).concat([["No thanks", () => openDash()]]) });
      });
    } else if (id === "crew") {
      S("Cast");
      a("cast", "emoji/1f3ad.png", "Cast the roles", needB ? "Set a budget first" : `${castN(p)}/${roles.length} cast${p.done.cast ? " (locked)" : ""}`, needB, openCast);
      a("castdir", "emoji/1f4cb.png", "Hire a casting director", p.castDir ? "On board. You can now see the odds on every actor" : needB ? "Needs a budget first" : `${money(pc(p, 0.01))} · actors say yes more often and you see the odds`, needB || p.castDir, () => payDo(p, 0.01, () => { p.castDir = true; }, ["Casting director", "Now every actor shows you their odds."]));
      S("Crew (optional)");
      Object.keys(DD().CREW).forEach((k) => {
        const c = DD().CREW[k];
        const hired = !!p.did["crew_" + k];
        a("crew_" + k, "emoji/1f465.png", c[0], hired ? `Hired: ${c[2][p.crew[k] || 0][0]}` : needB ? "Needs a budget first" : c[1], needB || hired, () => pickCrew(p, k));
      });
    } else if (id === "shoot") {
      S("Plan");
      const pl = DD().PLANS.find((x) => x[0] === (p.plan || "std"));
      a("plan", "emoji/1f4c5.png", "Shooting plan", `${pl[1]}. ${pl[2]}`, !!p.done.shoot, () => pickPlan(p));
      a("rehearse", "emoji/1f3a4.png", "Chemistry workshop", p.rehearsed ? "Done" : !p.done.cast ? "Lock the cast first" : !(p.cast.Lead && p.cast["Co-lead"]) ? "Needs a lead and a co-lead" : `${money(pc(p, 0.015))} · a week of rehearsals for your leads`, p.rehearsed || !p.done.cast || !(p.cast.Lead && p.cast["Co-lead"]), () => payDo(p, 0.015, () => {
        p.rehearsed = true;
        if (p.chem < 0 && ch(0.6)) p.chem = 0;
        else if (p.chem === 0 && ch(0.3)) p.chem = 1;
      }, ["Rehearsals", "The leads spent a week working together."]));
      S("Cameras");
      const why = !p.done.script ? "Lock the script first" : !p.done.fund ? "You need financing first" : !p.done.cast ? "Lock the cast first" : p.done.shoot ? "Wrapped" : "Cameras are ready";
      a("start", "emoji/1f3ac.png", p.done.shoot ? "The shoot is done" : "Start shooting", why, p.done.shoot || !(p.done.script && p.done.fund && p.done.cast), startShoot);
    }
    return A;
  }

  // ---- 1 story
  const gSub = (g) => `Appeal ${stars(g[3])} · ${g[4] >= 4 ? "critics love it" : g[4] <= -2 ? "critics are cold" : "critics are neutral"} · ${g[6] >= 1.2 ? "expensive" : g[6] <= 0.6 ? "cheap to make" : "mid cost"}`;
  function storyGenre() {
    const p = R().proj;
    if (!p) return openHub();
    // sin concepto todavía no hay nada más que hacer: atrás vuelve al hub (si no, atrás -> dashboard -> género en bucle)
    listScreen("GENRE", p.title ? back2dash : back2hub, DD().GENRES.map((g) => [g[0], g[2], g[1], gSub(g)]), (id) => { p.genre = id; storyTheme(); });
  }
  function storyTheme() {
    const p = R().proj;
    if (!p) return openHub();
    const g = gOf(p.genre);
    listScreen("THEME", storyGenre, DD().THEMES.map((t) => [t[0], ICON, t[1], DD().GT_GOOD.has(p.genre + ":" + t[0]) ? "Works great with " + g[1].toLowerCase() : DD().GT_BAD.has(p.genre + ":" + t[0]) ? "A risky match for " + g[1].toLowerCase() : "A solid choice"]), (id) => { p.theme = id; storyTwist(); });
  }
  function storyTwist() {
    const p = R().proj;
    if (!p) return openHub();
    listScreen("PLOT TWIST", storyTheme, DD().TWISTS.map((t) => [t[0], ICON, t[1], (DD().GW_GOOD.has(p.genre + ":" + t[0]) ? "Fits this genre · " : "") + (t[2] >= 5 ? "Powerful" : t[2] < 0 ? "Often backfires" : "Safe") + (t[3] >= 6 ? " · people will talk about it" : "")]), (id) => { p.twist = id; storyPremise(); });
  }
  function storyPremise() {
    const p = R().proj;
    if (!p) return openHub();
    const opts = DD().PREMISES[p.genre].slice();
    listScreen("THE STORY", storyTwist, opts.map((t, i) => ["p" + i, gOf(p.genre)[2], `Premise ${i + 1}`, t]), (id) => { p.premise = opts[+id.slice(1)]; storyTitle(); });
  }
  function storyTitle() {
    const p = R().proj;
    if (!p) return openHub();
    const ts = [mkTitle(p), mkTitle(p), mkTitle(p)];
    listScreen("TITLE", storyPremise, ts.map((t, i) => ["t" + i, ICON, t, "Use this title"]).concat([["own", "emoji/270f-fe0f.png", "Write your own title", "Type it in"]]), (id) => {
      const fin = (t) => { p.title = String(t || ts[0]).slice(0, 40).trim() || ts[0]; finishStory(); };
      if (id === "own") {
        let v = null;
        try { v = prompt("Title of your film", ts[0]); } catch {}
        return fin(v);
      }
      fin(ts[+id.slice(1)]);
    });
  }
  function finishStory() {
    const p = R().proj;
    if (!p) return openHub();
    p.done.story = true;
    const bits = [];
    if (gtGood(p)) bits.push("The genre and the theme click.");
    else if (DD().GT_BAD.has(p.genre + ":" + p.theme)) bits.push("The genre and the theme pull in different directions.");
    if (DD().GW_GOOD.has(p.genre + ":" + p.twist)) bits.push("The twist is a natural fit.");
    if (p.twist === "dream") bits.push("Everyone has seen \"it was all a dream\" before.");
    card({ title: p.title, lead: esc(p.premise) + " " + esc(bits.join(" ")), rows: [["Genre", gOf(p.genre)[1]], ["Theme", tOf(p.theme)[1]], ["Twist", wOf(p.twist)[1]]], choices: [["Write the script", () => openScript()], ["Back to the dashboard", () => openDash()]] });
  }

  // ---- 2 script
  function openScript() {
    const d = R();
    const p = d.proj;
    if (!p) return openHub();
    if (!p.done.story) return storyGenre();
    if (!openScreen("SCRIPT", back2dash)) return;
    let h = "";
    if (!p.writer) {
      h += sec("Who writes it?");
      h += DD().WRITERS.map((w, i) => row("w" + i, ICON, w[0], `${w[3]} ${WRITER_COST[i] ? money(wCost(i)) : "Free"}`, !canPay(wCost(i)))).join("");
      sList.innerHTML = h;
      wire((id) => () => {
        const i = +id.slice(1);
        if (!spend(wCost(i))) return note("Not enough money", "You cannot afford that writer.");
        p.writer = DD().WRITERS[i][0];
        p.sq = Math.round(cl(scriptBase(p) + WRITER_BONUS[i] + (i === 0 ? ((Number(state.stats && state.stats.Smarts) || 50) - 50) * 0.15 : 0) + gauss() * 5, 18, 96));
        rollFlaws(p);
        note("The first draft is in", `Draft quality ${p.sq}%. ${p.flaws.length ? "Notes: " + p.flaws.map((f) => f.text).join(", ") + "." : "The read-through is clean."}`, openScript);
      });
      return;
    }
    h += `<div class="row" style="flex-direction:column;align-items:stretch;height:auto;padding:10px 14px">${bar("Script quality", p.sq, col(p.sq))}<div style="font-size:12px;opacity:.8;margin-top:4px">Writer: ${esc(p.writer)}${p.flaws.length ? " · open problems: " + esc(p.flaws.map((f) => f.text).join(", ")) : " · no open problems"}</div></div>`;
    h += sec("Notes");
    h += row("doc", "emoji/1f9d1-200d-1f4bb.png", "Hire a script doctor", `Fixes up to 2 problems. ${money(loc(50000))}`, !p.flaws.length || !canPay(loc(50000)));
    h += row("rew", "emoji/270d-fe0f.png", "Rewrite it yourself", `A Smarts check. ${2 - p.rewrites} rewrites left`, !p.flaws.length || p.rewrites >= 2);
    h += row("lock", "emoji/1f512.png", "Lock the script", "Move on to financing");
    sList.innerHTML = h;
    wire({
      doc: () => { if (!spend(loc(50000))) return; p.flaws.splice(0, 2); p.sq = cl(p.sq + 4); note("Script doctor", "The big problems are gone.", openScript); },
      rew: () => {
        p.rewrites++;
        const ok = ch(0.35 + (Number(state.stats && state.stats.Smarts) || 50) / 200);
        if (ok) { p.flaws.shift(); p.sq = cl(p.sq + 2); }
        note("Rewrite", ok ? "You found the fix. One problem less." : "Weeks of work and the same problem is still there.", openScript);
      },
      lock: () => { p.done.script = true; curDept = "money"; openFund(); }, // "Move on to financing": va a financiar (antes volvía a Development, la misma pantalla)
    });
  }

  // ---- 3 financing
  const tierRange = (t) => {
    const b = DD().BUDGETS[t];
    return [b[0], loc(b[1]), loc(b[2]), b[3]];
  };
  function openFund() {
    const d = R();
    const p = d.proj;
    if (!p) return openHub();
    if (!p.writer) return openScript();
    if (p.tier == null) return pickBudget();
    if (!openScreen("FINANCING", back2dash)) return;
    const rk = rankIdx(d);
    let h = `<div class="row" style="height:auto"><div class="t"><b>Budget ${money(p.B)}</b><span>${esc(tierRange(p.tier)[0])} tier · ${p.fund ? "funded by " + (stOf(p.fund) ? stOf(p.fund)[1] : p.fund === "grant" ? "the film school fund" : "you") : "no funding yet"}</span></div></div>`;
    h += row("rebudget", "emoji/1f4b0.png", "Change the budget", state.money < p.B ? "You cannot self-fund this one. Pick a leaner budget or win a studio over" : "Pick another tier or amount");
    h += sec("Who pays for it?");
    if (p.tier === 0 && rk <= 1 && p.B <= Math.round((tierRange(0)[1] + tierRange(0)[2]) / 2) + 1) h += row("grant", "emoji/1f393.png", "Film school grant", `Covers the whole budget. The fund keeps half of the earnings`);
    h += row("self", "emoji/1f4b5.png", "Fund it yourself", `You keep everything. Needs ${money(p.B)} in cash (you have ${money(state.money)})`, state.money < p.B);
    DD().STUDIOS.forEach((s) => {
      const locked = rk < s[7];
      const cap = s[0] === "a24" || s[0] === "neon" ? 2 : s[0] === "lg" ? 3 : 9;
      const tooBig = p.tier > cap;
      const likes = s[3].includes(p.genre);
      const chance = studioChance(p, s, d);
      const rej = p.rej[s[0]];
      h += row("st_" + s[0], "director/st_" + s[0] + ".png", s[1], locked ? `Needs rank: ${DD().RANKS[s[7]][0]}` : tooBig ? "Too big for this label" : rej ? "Passed on your pitch" : `${likes ? "Loves " + gOf(p.genre)[1].toLowerCase() + " · " : ""}pitch chance ${Math.round(chance * 100)}% · ${s[8]}`, locked || tooBig || rej);
    });
    sList.innerHTML = h;
    wire((id) => () => {
      if (id === "rebudget") return pickBudget();
      if (id === "self") { p.fund = "self"; p.done.fund = true; return note("Financing", "It is your money on the line.", () => openDept("crew")); }
      if (id === "grant") { p.fund = "grant"; p.done.fund = true; return note("Financing", "The film school fund covers the shoot. You keep half of whatever it earns.", () => openDept("crew")); }
      const s = stOf(id.slice(3));
      pitch(p, s, d);
    });
  }
  function studioChance(p, s, d) {
    return cl(0.35 + (p.sq - 55) / 120 + d.rep / 200 + (s[3].includes(p.genre) ? 0.15 : -0.1) + rankIdx(d) * 0.04 + (d.studioRel[s[0]] || 0) / 200 + (p.producer ? 0.1 : 0), 0.05, 0.92);
  }
  function pitch(p, s, d) {
    const ok = ch(studioChance(p, s, d));
    if (!ok) {
      p.rej[s[0]] = true;
      return note(s[1], pick(["They passed on your pitch. Maybe next time.", "The executives did not buy it. They will not look at this one again.", "They like you, not the movie."]), openFund);
    }
    p.fund = s[0];
    p.done.fund = true;
    d.studioRel[s[0]] = (d.studioRel[s[0]] || 0) + 3;
    const fee = Math.round(p.B * (0.04 + rankIdx(d) * 0.005));
    card({ iconSrc: "director/st_" + s[0] + ".png", title: s[1] + " is in", lead: `${esc(s[1])} will finance "${esc(p.title)}" and release it. They take the revenue, you earn a director's fee and a share of the profit. ${s[0] === "nfx" ? "It is a flat deal: no box office, a fee and a bonus if it plays well." : ""}`, rows: [["Director's fee", money(fee)], ["Marketing power", s[5] + "/10"]], choices: [["Sign the deal", () => { addMoney(fee); sayIt(`${s[1]} agreed to finance my film.`); openDept("crew"); }]] });
  }
  function pickBudget() {
    const d = R();
    const p = d.proj;
    if (!p) return openHub();
    const mt = maxTier(d);
    listScreen("BUDGET", () => (p.fund ? openFund() : openDash()), DD().BUDGETS.map((_, i) => { const b = tierRange(i); return [String(i), "emoji/1f4b0.png", b[0], i > mt ? `Needs a higher rank` : `${money(b[1])} - ${money(b[2])}`, i > mt]; }), (id) => {
      const t = +id;
      const b = tierRange(t);
      card({ title: b[0] + " budget", lead: `How much do you want to spend? ${gOf(p.genre)[6] >= 1.2 && t <= 2 ? "This genre needs scale. A small budget will show on screen." : ""}`, choices: [["Lean: " + money(b[1]), () => setBudget(p, t, b[1])], ["Standard: " + money(Math.round((b[1] + b[2]) / 2)), () => setBudget(p, t, Math.round((b[1] + b[2]) / 2))], ["Lavish: " + money(b[2]), () => setBudget(p, t, b[2])]] });
    });
  }
  function setBudget(p, t, B) {
    p.tier = t;
    p.B = B;
    p.fund = null;
    p.done.fund = false;
    p.cast = {};
    p.rej = {};
    p.done.cast = false;
    p.writer ? openFund() : openDash();
  }

  // ---- 4 casting
  const fitOf = (role, age, a, p) => {
    let f = 1;
    if (role === "Lead" || role === "Co-lead") f = age >= 19 && age <= 52 ? 1 : age < 19 ? (p.theme === "coming" && age >= 16 ? 1 : 0.7) : age <= 62 ? 0.8 : 0.55;
    else if (role === "Villain") f = age >= 28 && age <= 70 ? 1 : 0.8;
    if (!a.tags.includes(p.genre)) f *= 0.92;
    return Math.round(f * 100) / 100;
  };
  function openCast() {
    const d = R();
    const p = d.proj;
    if (!p) return openHub();
    if (p.tier == null) return pickBudget();
    if (!openScreen("CASTING", back2dash)) return;
    const y = yr();
    const roles = ROLES(p.tier);
    let h = `<div class="row" style="height:auto"><div class="t"><b>Cast cost ${money(castCost(p))} of ${money(Math.round(p.B * 0.8))}</b><span>Fees come out of the budget. A lead is required.</span></div></div>`;
    h += roles.map((r) => {
      const c = p.cast[r];
      return row("r_" + r, c ? "emoji/1f3ad.png" : "emoji/1f3ad.png", r, c ? `${c.name} · age ${c.age} · ${money(c.fee)}` : "Empty. Tap to cast");
    }).join("");
    h += row("lock", "emoji/1f512.png", "Lock the cast", p.cast.Lead ? "Start shooting next" : "You need a lead first", !p.cast.Lead);
    sList.innerHTML = h;
    wire((id) => () => (id === "lock" ? lockCast() : openTalent(id.slice(2))));
  }
  function lockCast() {
    const d = R();
    const p = d.proj;
    const y = yr();
    // chemistry between the leads
    p.chem = 0;
    if (p.cast.Lead && p.cast["Co-lead"]) {
      const together = d.hired[p.cast.Lead.id] && d.hired[p.cast["Co-lead"].id] ? 0.1 : 0;
      p.chem = ch(0.16) ? -1 : ch(0.17 + together + (["r", "c"].includes(p.genre) ? 0.08 : 0)) ? 1 : 0;
    }
    const steps = [];
    const stars_ = Object.entries(p.cast).filter((e) => e[1] && e[1].star >= 70);
    if (stars_.length && ch(0.25)) {
      const [role, c] = pick(stars_);
      steps.push((next) => card({ title: "Wants more billing", lead: `Your ${role.toLowerCase()} wants their name bigger on the poster and a bump in pay before the first day on set.`, choices: [["Give them the bump (" + money(Math.round(c.fee * 0.1)) + ")", () => { c.fee += Math.round(c.fee * 0.1); note("Casting", "Done. Everyone is happy.", next); }], ["Say no", () => { p.q.acting = p.q.acting - 4; p.issues.push({ k: "cast", sev: 1, text: "Tension with the cast" }); note("Casting", "They stay, but the mood is cold.", next); }]] }));
    }
    if (ch(0.18) && Object.keys(p.cast).length > 1) {
      steps.push((next) => card({ title: "A schedule conflict", lead: "Your supporting actor has a clash with another shoot and asks to cut their days in half.", choices: [["Rework the schedule", () => { p.overrun += 4; note("Casting", "It costs some money but it works.", next); }], ["Replace the role with a newcomer", () => { delete p.cast[ROLES(p.tier).slice(-1)[0]]; note("Casting", "That role is open again. Cast it before you shoot.", () => openCast()); }]] }));
    }
    runSteps(steps, () => {
      p.miscast = Object.values(p.cast).some((c) => c && c.fit < 0.65);
      if (p.miscast) p.issues.push({ k: "cast", sev: 1, text: "A role nobody believes" });
      p.done.cast = true;
      note("Cast locked", `${Object.values(p.cast).filter(Boolean).length} actors signed${p.chem > 0 ? ". The leads clicked at the table read." : p.chem < 0 ? ". The leads did not click at the table read." : "."}`, () => openDept("shoot"));
    });
  }
  function openTalent(role, page) {
    const d = R();
    const p = d.proj;
    const y = yr();
    page = page || 1;
    const back = role ? openCast : openHub;
    if (!openScreen(role ? "CAST: " + role.toUpperCase() : "TALENT AGENCY", back)) return;
    const taken = new Set(Object.values(p ? p.cast : {}).filter(Boolean).map((c) => c.id));
    const room = p && role ? Math.round(p.B * 0.8) - castCost(p) + (p.cast[role] ? p.cast[role].fee : 0) : Infinity;
    const canPay = (a) => feeOf(a, y) <= room;
    const list = pool(y).sort((a, b) => (canPay(b) - canPay(a)) || power(b, y) - power(a, y));
    const shown = list.slice(0, page * 28);
    const unkFee = Math.max(loc(300), Math.round((p ? p.B : 0) * 0.02));
    let h = sec(role ? `Casting a ${role.toLowerCase()} · ${y}` : `Working actors in ${y}`);
    if (role) h += row("unk", "emoji/1f464.png", "Local unknown actor", `Always available · fee ${money(unkFee)} · talent around 45-55`, unkFee > room);
    h += shown.map((a) => {
      const age = aAge(a, y);
      const hc = (d.hired[a.id] ? ` · worked together ${d.hired[a.id]}x` : "") + (p && role && p.castDir ? (() => { const q_ = acceptChance(p, a, 1, false); return q_ > 0.6 ? " · likely to say yes" : q_ > 0.35 ? " · might say yes" : " · unlikely"; })() : "");
      const dis = role && (taken.has(a.id) || (p && p.declined[a.id]) || !canPay(a));
      return row("a_" + a.id, a.real ? "emoji/1f31f.png" : "emoji/1f3ad.png", a.name, `age ${age} (b. ${a.b}) · ${phase(a, y)} · star ${power(a, y)} · talent ${talentOf(a, y)} · ${money(feeOf(a, y))}${(p && a.tags.includes(p.genre)) ? " · fits your genre" : ""}${hc}${dis ? (taken.has(a.id) ? " · cast" : p && p.declined[a.id] ? " · passed" : " · out of your budget") : ""}`, dis);
    }).join("");
    if (shown.length < list.length) h += row("more", "emoji/1f3ad.png", "Show more", `${list.length - shown.length} more actors`);
    sList.innerHTML = h;
    wire((id) => () => {
      if (id === "more") return openTalent(role, page + 1);
      if (!role) return;
      if (id === "unk") {
        const nm = pick(DD().FIRST) + " " + pick(DD().LAST);
        p.cast[role] = { id: "u:" + nm + ":" + Date.now(), name: nm, real: false, fee: unkFee, star: 3, tal: ri(40, 58), age: ri(20, 45), fit: 1, backend: false };
        return note("Signed", `${nm}, a local unknown, takes the ${role.toLowerCase()}.`, openCast);
      }
      const a = list.find((x) => "a_" + x.id === id);
      if (a) offer(a, role);
    });
  }
  function acceptChance(p, a, mult, backend) {
    const d = R();
    const y = yr();
    let pr = 0.35 + (p.sq / 100) * 0.25 + (d.rep / 100) * 0.25;
    pr += mult >= 1.25 ? 0.2 : mult < 0.8 ? -0.2 : backend ? (p.sq > 65 ? 0.05 : -0.05) : 0;
    const pw = power(a, y);
    pr -= pw >= 80 ? 0.18 : pw >= 60 ? 0.08 : 0;
    pr += p.tier >= 3 ? 0.08 : 0;
    pr += Math.min(0.24, (d.hired[a.id] || 0) * 0.12);
    pr += a.tags.includes(p.genre) ? 0.06 : 0;
    pr += stOf(p.fund) ? 0.1 : 0;
    pr += p.castDir ? 0.08 : 0;
    return cl(pr, 0.05, 0.95);
  }
  function offer(a, role) {
    const d = R();
    const p = d.proj;
    if (!p) return openHub();
    const y = yr();
    const fee = feeOf(a, y);
    const age = aAge(a, y);
    const room = Math.round(p.B * 0.8) - castCost(p) + (p.cast[role] ? p.cast[role].fee : 0);
    const mk = (mult, backend) => {
      const pay = Math.round(fee * mult);
      if (pay > room) return note("Over budget", "That fee would eat too much of the budget.", () => offer(a, role));
      const pr = acceptChance(p, a, mult, backend);
      if (ch(pr)) {
        p.cast[role] = { id: a.id, name: a.name, real: a.real, fee: pay, star: power(a, y), tal: talentOf(a, y), age, fit: fitOf(role, age, a, p), backend: !!backend };
        note("Signed", `${a.name} is in as your ${role.toLowerCase()}${fitOf(role, age, a, p) < 0.65 ? ". Some people will say they are wrong for the part" : ""}.`, openCast);
      } else {
        p.declined[a.id] = true;
        note("They passed", `${a.name} ${pick(["has a schedule conflict", "wants a bigger part", "wants a higher fee", "is not into this kind of story right now"])}.`, () => openTalent(role));
      }
    };
    card({
      title: a.name,
      lead: `Age ${age} (born ${a.b}). ${phase(a, y)}. Star power ${power(a, y)}, talent ${talentOf(a, y)}. Asking ${money(fee)} for the ${role.toLowerCase()}.`,
      choices: [["Offer the standard fee", () => mk(1, false)], ["Offer 130% to seal it (" + money(Math.round(fee * 1.3)) + ")", () => mk(1.3, false)], ["Lowball at 70% (" + money(Math.round(fee * 0.7)) + ")", () => mk(0.7, false)], ["Half fee plus profit points", () => mk(0.5, true)], ["Look at someone else", () => openTalent(role)]],
    });
  }

  // ---- 5 shooting
  function startShoot() {
    const d = R();
    const p = d.proj;
    if (!p) return openHub();
    if (!p.done.script) return note("Not yet", "Lock the script first.", openDash);
    if (!p.done.fund) return note("Not yet", "You need financing first.", openDash);
    if (!p.done.cast) return note("Not yet", "Lock the cast first.", openDash);
    if (p.done.shoot) return note("Done", "The shoot is already over.", openDash);
    if (p.fund === "self" && !p.paid) {
      if (!spend(p.B)) return note("Not enough cash", `You need ${money(p.B)} to start shooting.`);
      p.paid = true;
    }
    initQuality(p);
    p.overrun = p.overrun || 0;
    const evs = pickEvents(p);
    card({ title: "Principal photography", lead: `Cameras roll on "${esc(p.title)}". Expect surprises.`, choices: [["Action!", () => runSteps(evs.map((e) => (next) => runEvent(p, e, next)), () => finishShoot(p))]] });
  }
  function finishShoot(p) {
    const d = R();
    if (p.plan === "fast") p.overrun -= 8;
    if (p.plan === "perf") p.overrun += 10;
    if (p.producer && p.overrun > 0) p.overrun *= 0.75;
    const over = Math.round(p.overrun);
    if (over > 15) {
      const extra = Math.round(p.B * (over / 100));
      p.issues.push({ k: "budget", sev: over > 30 ? 2 : 1, text: "The production went over budget" });
      if (p.fund === "self" || p.fund === "grant") {
        const paid = Math.min(extra, state.money);
        spend(paid);
        if (paid < extra) { p.q.prod = cl(p.q.prod - 8); p.issues.push({ k: "budget", sev: 1, text: "Ran out of money before the last scenes" }); }
        p.B += paid;
      } else d.rep = cl(d.rep - 3);
    }
    p.done.shoot = true;
    note("That's a wrap", `The shoot is over${over > 15 ? " and it ran " + over + "% over budget" : ""}. Time for the edit.`, () => openDept("post"));
  }

  // ---- 6 post
  function openPost() {
    const d = R();
    const p = d.proj;
    if (!p) return openHub();
    if (!p.done.shoot) return note("Not yet", "Shoot the film first.", openProject);
    curDept = "post";
    if (!openScreen("POST-PRODUCTION", openProject)) return;
    const cutL = { dir: "Director's cut", studio: "Studio cut", test: "Test-screening re-edit" };
    const lockedMsg = p.done.post;
    let h = filmCard(p) + sec("The cut");
    h += row("cut", "emoji/2702-fe0f.png", "Final cut", lockedMsg ? "Locked" : p.cutKind ? "Chosen: " + cutL[p.cutKind] + " (tap to change)" : "Director's cut, studio cut or a re-edit", lockedMsg);
    h += sec("Optional");
    h += row("score", "emoji/1f3b5.png", "Score and sound", p.score ? (p.score === "top" ? "Top composer hired" : "Library music") : "Hire a composer or save the money", lockedMsg || !!p.score);
    const fixable = p.issues.filter((i) => i.k !== "script" && i.sev > 0 && !i.fixed);
    h += row("polish", "emoji/1f527.png", "Reshoots and polish", p.polish ? "Done" : fixable.length ? `Fix "${fixable[0].text}" · ${money(pc(p, 0.03))}` : "Nothing to fix", lockedMsg || p.polish || !fixable.length || !canPay(pc(p, 0.03)));
    h += row("screen", "emoji/1f39e-fe0f.png", "Test screening", p.screened ? "Done" : `${money(pc(p, 0.01))} · find out what a real audience thinks, then fix it`, lockedMsg || p.screened || !canPay(pc(p, 0.01)));
    h += row("lock", "emoji/1f512.png", lockedMsg ? "The film is locked" : "Lock the film", lockedMsg ? "On to marketing" : p.cutKind ? "No more changes after this" : "Choose a final cut first", lockedMsg || !p.cutKind);
    sList.innerHTML = h;
    wire({
      cut: () => card({ title: "Final cut", lead: "Three ways to finish the film.", choices: [["Director's cut: ambitious, long", () => { p.cutKind = "dir"; openPost(); }], ["Studio cut: tight, commercial", () => { p.cutKind = "studio"; openPost(); }], ["Test-screening re-edit (" + money(pc(p, 0.02)) + ")", () => { if (p.cutKind !== "test" && !spend(pc(p, 0.02))) return note("Not enough money", "", openPost); p.cutKind = "test"; openPost(); }], ["Back", () => openPost()]] }),
      score: () => card({ title: "Score and sound", lead: "Music can make or break a film.", choices: [["Hire a top composer (" + money(pc(p, 0.01)) + ")", () => { if (!spend(pc(p, 0.01))) return note("Not enough money", "", openPost); p.score = "top"; openPost(); }], ["Use library music", () => { p.score = "safe"; openPost(); }]] }),
      polish: () => { const i = fixable[0]; if (!i || !spend(pc(p, 0.03))) return; i.fixed = true; i.sev = 0; p.q.direction = cl(p.q.direction + 3); p.polish = true; note("Polish", "The worst of it is fixed.", openPost); },
      screen: () => {
        if (!spend(pc(p, 0.01))) return note("Not enough money", "", openPost);
        p.screened = true;
        const g = gOf(p.genre);
        const open = p.issues.filter((i) => i.sev > 0 && !i.fixed);
        const est = Math.round(cl(0.34 * p.q.script + 0.24 * p.q.direction + 0.2 * p.q.acting + 0.1 * p.q.prod + 0.12 * p.q.edit + g[4] - open.reduce((s_, i) => s_ + i.sev, 0) * 2 + gauss() * 5, 5, 99));
        const worst = open.slice().sort((x, y) => y.sev - x.sev)[0];
        card({
          title: "Test screening",
          lead: `A recruited audience watched the film. Preview score: about ${gradeOf(est)}. ${worst ? "The cards complain that " + (DD().CRIT_ISSUE[worst.k] || worst.text) + "." : "The cards are mostly warm."}`,
          choices: [
            [`Reshoot the ending (${money(pc(p, 0.04))})`, () => { if (!spend(pc(p, 0.04))) return note("Not enough money", "", openPost); p.q.script = cl(p.q.script + 4); p.q.edit = cl(p.q.edit + 2); const w = open[0]; if (w) { w.fixed = true; w.sev = 0; } note("Reshoots", "The new ending lands better.", openPost); }],
            ["Trim twelve minutes", () => { p.q.edit = cl(p.q.edit + 3); p.q.direction = cl(p.q.direction - 2); p.trimmed = true; note("Trimmed", "Tighter, a little less ambitious.", openPost); }],
            ["Leave it alone", () => openPost()],
          ],
        });
      },
      lock: () => {
        if (p.cutKind === "dir") { p.q.direction = cl(p.q.direction + 6); p.q.edit = cl(p.q.edit - 2); p.cutLong = p.trimmed ? false : ch(0.5); if (stOf(p.fund)) { d.studioRel[p.fund] = (d.studioRel[p.fund] || 0) - 4; } }
        else if (p.cutKind === "studio") { p.q.edit = cl(p.q.edit + 4); p.q.direction = cl(p.q.direction - 3); p.buzz += 2; }
        else { p.q.edit = cl(p.q.edit + 6); p.q.script = cl(p.q.script + 2); }
        p.score = p.score || "safe";
        if (p.score === "top") { p.q.edit = cl(p.q.edit + 5); p.buzz += 2; }
        p.q.edit = cl(p.q.edit + gauss() * 3);
        p.done.post = true;
        note("Locked", p.cutLong ? "Your cut runs close to three hours. Some people will love it." : "The picture is locked.", () => openDept("mkt"));
      },
    });
  }

  // ---- 7 marketing
  const adCost = (p, ads) => ads.reduce((s, a) => s + Math.round(p.B * DD().MARKETING.find((m) => m[0] === a)[2]), 0);
  function openMkt() {
    const d = R();
    const p = d.proj;
    if (!p) return openHub();
    if (!p.done.shoot) return note("Not yet", "Shoot the film before you plan the release.", openProject);
    curDept = "mkt";
    if (!openScreen("MARKETING", openProject)) return;
    const g = p.genre;
    const stu = stOf(p.fund) || null;
    const cost = (m) => Math.round(p.B * m[2]);
    let h = stu ? `<div class="row"><img src="director/st_${stu[0]}.png" alt="" style="object-fit:contain"><div class="t"><b>${esc(stu[1])} is your partner</b><span>Marketing power ${stu[5]}/10</span></div></div>` : "";
    h += sec("Release date");
    h += DD().SLOTS.map((s) => row("sl_" + s[0], "emoji/1f4c5.png", (p.slot === s[0] ? "✔ " : "") + s[1], `${(s[2][g] || 1) > 1.1 ? "Good for " + gOf(g)[1].toLowerCase() + " · " : (s[2][g] || 1) < 0.95 ? "Weak for " + gOf(g)[1].toLowerCase() + " · " : ""}${s[4]}`)).join("");
    h += sec(stu ? `Campaigns (${stu[1]} covers the bill)` : "Campaigns (optional)");
    h += DD().MARKETING.map((m) => row("ad_" + m[0], "emoji/1f4e2.png", (p.ads.includes(m[0]) ? "✔ " : "") + m[1] + (m[0] === "trailer" && p.trailer ? ` (${p.trailer})` : ""), `${stu ? "Covered by the studio" : money(cost(m))} · ${m[5]}`)).join("");
    const total = stu ? 0 : adCost(p, p.ads);
    h += sec("Premiere");
    h += row("release", "emoji/1f3ac.png", "Release the film", ready(p) ? (stu ? "Premiere day" : `Premiere day · the campaigns cost ${money(total)}`) : "Still needed: " + missing(p).join(", "), !ready(p));
    sList.innerHTML = h;
    wire((id) => () => {
      if (id.startsWith("sl_")) { p.slot = id.slice(3); return openMkt(); }
      if (id === "release") return releaseFilm();
      if (id.startsWith("ad_")) {
        const k = id.slice(3);
        const i = p.ads.indexOf(k);
        if (i >= 0) { p.ads.splice(i, 1); return openMkt(); }
        if (stu && p.ads.length >= 3) return note("Studio limit", "The studio will fund three campaigns, not more.");
        if (k === "trailer") {
          return card({ title: "The trailer", lead: "What do you show people?", choices: [["A teaser: mood and no plot", () => { p.trailer = "teaser"; p.ads.push(k); openMkt(); }], ["A full trailer: the whole story", () => { p.trailer = "full"; p.ads.push(k); openMkt(); }], ["A mystery cut: questions and nothing else", () => { p.trailer = "mystery"; p.ads.push(k); openMkt(); }], ["Cancel", () => openMkt()]] });
        }
        p.ads.push(k);
        return openMkt();
      }
    });
  }

  // ---- release
  function releaseFilm() {
    const d = R();
    const p = d.proj;
    if (!p || !ready(p)) return;
    const stu = stOf(p.fund);
    const total = stu ? 0 : adCost(p, p.ads);
    if (!stu && !spend(total)) return note("Not enough money", `Your campaigns cost ${money(total)}. Drop some or raise the cash.`, () => openMkt());
    p.mktCost = stu ? Math.round(p.B * 0.3) : total;
    const f = mkRelease(p);
    const lead = f.stream
      ? `${f.studio === "Self-funded" || f.studio === "Film school grant" ? "Your film" : "On " + f.studio}: ${f.views}M viewers in the first week.`
      : `It opened to ${money(f.opening)}${f.crowded ? ", up against a giant release" : ""} and will end near ${money(f.gross)}.`;
    card({
      title: "Premiere: " + f.title,
      lead,
      rows: [["Viral meter", f.viral + "/100"], ...f.combos.map((c) => [c.d > 0 ? "Boost" : "Drag", c.l + " (" + (c.d > 0 ? "+" : "") + c.d + ")"])],
      choices: [["See the ratings", () => { if (f.rankUp) note("Promotion", `You are now a ${f.rankUp}.`, () => openFilm(f.id)); else openFilm(f.id); }]],
    });
  }

  // ---- filmography / film / ratings
  function openFilms() {
    const d = R();
    if (!openScreen("FILMOGRAPHY", back2hub)) return;
    sList.innerHTML = d.films.length ? sec("Newest first") + d.films.map((f) => row("f_" + f.id, gOf(f.genre)[2], `${f.title} (${f.year})`, `${f.stream ? f.views + "M views" : money(f.gross)} · RT ${f.ratings.rt}% · IMDb ${f.ratings.imdb}${f.awards && f.awards.some((a) => a.won) ? " · 🏆" : ""}`)).join("") : foot("No films yet.");
    wire((id) => () => openFilm(+id.slice(2)));
  }
  const fmtSite = (s, v) => (s[4] === "pct" ? v + "%" : s[4] === "ten" ? v.toFixed(1) + "/10" : s[4] === "num" ? v + "/100" : s[4] === "five" ? v.toFixed(1) + "★" : v);
  function openFilm(id) {
    const d = R();
    const f = d.films.find((x) => x.id === id);
    if (!f) return openFilms();
    if (!openScreen(f.title.toUpperCase(), openFilms)) return;
    const g = gOf(f.genre);
    let h = `<div class="row" style="flex-direction:column;align-items:stretch;height:auto;padding:10px 14px"><div style="display:flex;align-items:center;gap:10px"><img src="${g[2]}" alt="" style="width:40px;height:40px;object-fit:contain"><div><b style="color:#fff">${esc(f.title)} (${f.year})</b><div style="font-size:12px;opacity:.75">${esc(g[1])} · ${esc(tOf(f.theme)[1])} · ${esc(f.studio)}</div></div></div></div>`;
    const fs_ = f.fund && stOf(f.fund);
    if (fs_) h += `<div class="row"><img src="director/st_${fs_[0]}.png" alt="" style="object-fit:contain"><div class="t"><b>Released by ${esc(fs_[1])}</b><span>${esc(fs_[2])}</span></div></div>`;
    h += sec("Ratings");
    DD().SITES.forEach((s) => {
      const v = f.ratings[s[0]];
      const line = s[0] === "mc" ? mcLabel(v) : s[0] === "cs" ? "Polled audiences" : s[3] === "c" ? f.crit : s[3] === "a" ? f.audq : "Critics and audiences combined";
      h += `<div class="row"><img src="${s[2]}" alt="" style="object-fit:contain"><div class="t"><b>${esc(s[1])}: ${esc(fmtSite(s, v))}</b><span>${esc(line)}</span></div></div>`;
    });
    h += sec("Box office");
    h += f.stream ? `<div class="row"><img src="director/bo.png" alt=""><div class="t"><b>${f.views}M viewers</b><span>First week on streaming</span></div></div>` : `<div class="row"><img src="director/bo.png" alt="" style="object-fit:contain"><div class="t"><b>${money(f.gross)} worldwide</b><span>Opening ${money(f.opening)} · legs x${f.legs} · budget ${money(f.B)}</span></div></div><div class="row"><div class="t"><b>${f.profit >= 0 ? "Profit" : "Loss"} ${money(Math.abs(f.profit))}</b><span>Your take ${money(f.take)}${f.take ? " (paid at your next birthday)" : ""}</span></div></div>`;
    h += sec(`Viral meter: ${f.viral}/100`);
    h += f.combos.length ? f.combos.map((c) => `<div class="row"><div class="t"><b>${c.d > 0 ? "+" : ""}${c.d} ${esc(c.l)}</b></div></div>`).join("") : foot("No special combination. It played on its own merits.");
    h += sec("What went wrong");
    h += f.issues.filter((i) => i.sev > 0).length ? f.issues.filter((i) => i.sev > 0).map((i) => `<div class="row"><div class="t"><b>${esc(i.text)}</b><span>${esc(({ script: "Script", cast: "Casting", chem: "Casting", direction: "Direction", budget: "Budget", vfx: "Effects", pace: "Pacing", edit: "Edit", score: "Score", studio: "Studio", weather: "Production", crew: "Production" })[i.k] || "Production")}</span></div></div>`).join("") : foot("A clean production.");
    h += sec("Cast");
    h += f.cast.map((c) => `<div class="row"><div class="t"><b>${esc(c.n)}</b><span>${esc(c.role)} · age ${c.age} at the time</span></div></div>`).join("");
    if (f.awards && f.awards.length) {
      h += sec("Awards");
      h += f.awards.map((a) => `<div class="row"><img src="director/award.png" alt="" style="object-fit:contain"><div class="t"><b>${esc(a.cat)}</b><span>${a.won ? "Winner" : "Nominee"}</span></div></div>`).join("");
    }
    sList.innerHTML = h;
  }

  // ---- studios / awards
  function openStudios() {
    const d = R();
    if (!openScreen("STUDIOS", back2hub)) return;
    const rk = rankIdx(d);
    sList.innerHTML = sec("Who wants what") + DD().STUDIOS.map((s) => row("x_" + s[0], "director/st_" + s[0] + ".png", s[1], `${s[2]} · loves ${s[3].split("").map((c) => gOf(c)[1]).join(", ")} · ${rk < s[7] ? "needs " + DD().RANKS[s[7]][0] : "trust " + (d.studioRel[s[0]] || 0)}`, true)).join("");
  }
  function openAwards() {
    const d = R();
    if (!openScreen("AWARDS", back2hub)) return;
    sList.innerHTML = d.awards.length ? d.awards.map((a) => `<div class="row"><img src="director/award.png" alt="" style="object-fit:contain"><div class="t"><b>${esc(a.cat)}${a.won ? "" : " (nominee)"}</b><span>${esc(a.film)} · ${a.y}</span></div></div>`).join("") : foot("No nominations yet. Awards go to well-reviewed films released in prestige slots.");
  }

  // ------------------------------------------------------------------ yearly tick
  const CATS = [["Best Picture", (f) => f.critic - 58 + 6], ["Best Director", (f) => f.q.direction - 55], ["Best Screenplay", (f) => f.q.script - 56], ["Best Lead Performance", (f) => f.q.acting - 55], ["Best Original Score", (f) => f.q.edit - 54], ["Best Visual Effects", (f) => (gOf(f.genre)[6] >= 1.1 ? f.q.prod - 52 : -99)]];
  function awardsFor(f) {
    f.awarded = true;
    const out = [];
    const slotB = f.slot === "awards" ? 6 : f.slot === "festival" ? 4 : 0;
    const gB = ["d", "m"].includes(f.genre) ? 4 : 0;
    CATS.forEach(([cat, fn]) => {
      const s = fn(f) + slotB + gB + gauss() * 5;
      if (s >= 14) out.push({ cat, won: s >= 24 && ch(0.6) });
    });
    return out;
  }
  function tick() {
    const d = R();
    if (!d.active) return;
    const y = yr();
    d.pending = d.pending.filter((x) => {
      if (x.due <= y) {
        addMoney(x.amt);
        sayIt(`"${x.t}" earned me ${money(x.amt)}.`);
        return false;
      }
      return true;
    });
    const steps = [];
    d.films.forEach((f) => {
      if (!f.awarded && y - f.year >= 1) {
        const a = awardsFor(f);
        f.awards = a;
        if (a.length) {
          a.forEach((x) => d.awards.push({ cat: x.cat, won: x.won, film: f.title, y }));
          const wins = a.filter((x) => x.won).length;
          d.legacy += a.length * 2 + wins * 5 + (a.some((x) => x.won && x.cat === "Best Picture") ? 8 : 0);
          d.rep = cl(d.rep + a.length + wins * 2);
          steps.push((next) => card({ title: "Awards night", lead: `"${esc(f.title)}" was in the race.`, rows: a.map((x) => [x.cat, x.won ? "Winner" : "Nominee"]), choices: [["Continue", next]] }));
        }
      }
    });
    if (d.films[0] && y - d.lastRelease >= 2) d.rep = cl(d.rep - 2);
    if (d.proj && y - d.proj.start >= 3) {
      d.proj = null;
      steps.push((next) => note("Shelved", "Your unfinished film sat on the shelf too long. The studio moved on.", next));
    }
    if (!d.proj && rankIdx(d) >= 2 && ch(0.3)) {
      const fits = DD().STUDIOS.filter((s) => rankIdx(d) >= s[7]);
      const s = pick(fits);
      steps.push((next) => studioOffer(d, s, next));
    }
    runSteps(steps, () => {});
  }
  function studioOffer(d, s, next) {
    const p = newProj();
    p.genre = pick(s[3].split(""));
    p.theme = pick(DD().THEMES)[0];
    p.twist = pick(DD().TWISTS)[0];
    p.premise = pick(DD().PREMISES[p.genre]);
    p.title = mkTitle(p);
    p.writer = "Studio writers";
    p.sq = Math.round(cl(scriptBase(p) + 8 + gauss() * 5, 25, 90));
    rollFlaws(p);
    const cap = s[0] === "a24" || s[0] === "neon" ? 2 : s[0] === "lg" ? 3 : 9;
    p.tier = Math.max(0, Math.min(maxTier(d), cap, rankIdx(d)));
    p.B = Math.round((tierRange(p.tier)[1] + tierRange(p.tier)[2]) / 2);
    p.fund = s[0];
    p.done = { story: true, script: true, fund: true };
    card({ iconSrc: "director/st_" + s[0] + ".png", title: `${s[1]} calls`, lead: `${esc(s[1])} has a ${gOf(p.genre)[1].toLowerCase()} called "${esc(p.title)}" and wants you to direct it. Budget ${money(p.B)}.`, rows: [["Premise", p.premise]], choices: [["Take the job", () => { d.proj = p; sayIt(`${s[1]} offered me a movie.`); next(); }], ["Pass", next]] });
  }

  // ------------------------------------------------------------------ simulation (balance tool)
  function autoProject(rank) {
    const d = R();
    const p = newProj();
    p.genre = pick("acdhstrfnm".split(""));
    p.theme = pick(DD().THEMES)[0];
    p.twist = pick(DD().TWISTS)[0];
    p.writer = "auto";
    p.sq = Math.round(cl(scriptBase(p) + pick(WRITER_BONUS) + gauss() * 5, 18, 96));
    rollFlaws(p);
    p.tier = ri(0, Math.min(5, DD().RANKS[rank][2]));
    const b = tierRange(p.tier);
    p.B = ri(b[1], b[2]);
    p.fund = ch(0.5) ? "self" : pick(DD().STUDIOS)[0];
    const y = yr();
    const pl = pool(y).sort(() => rnd() - 0.5);
    ROLES(p.tier).forEach((r) => {
      const a = pl.find((x) => feeOf(x, y) < p.B * 0.25 && !Object.values(p.cast).some((c) => c && c.id === x.id));
      if (a) p.cast[r] = { id: a.id, name: a.name, real: a.real, fee: feeOf(a, y), star: power(a, y), tal: talentOf(a, y), age: aAge(a, y), fit: fitOf(r, aAge(a, y), a, p) };
    });
    p.chem = pick([-1, 0, 0, 1]);
    initQuality(p);
    pickEvents(p).forEach((e) => {
      const c = pick(e.c)[1];
      applyFx(p, ch(c.win == null ? 1 : c.win) ? c.w : c.l || c.w);
    });
    p.q.edit = cl(p.q.edit + pick([-2, 4, 6, 11]));
    p.slot = pick(DD().SLOTS)[0];
    p.ads = DD().MARKETING.filter(() => ch(0.35)).map((m) => m[0]);
    p.mktCost = p.fund === "self" ? p.ads.reduce((s, a) => s + p.B * DD().MARKETING.find((m) => m[0] === a)[2], 0) : Math.round(p.B * 0.3);
    p.crowded = ch(slOf(p.slot)[3] * 0.35);
    return p;
  }
  function sim(n, rank) {
    n = n || 400;
    rank = rank == null ? 2 : rank;
    const save = state.dir;
    state.dir = { active: true, legacy: 0, rep: 30, skill: 40 };
    const out = { n, hit: 0, flop: 0, mid: 0, rt: 0, aud: 0, imdb: 0, mult: [], viral: 0 };
    for (let i = 0; i < n; i++) {
      const p = autoProject(rank);
      const r = evaluate(p, { rank, rep: 30 });
      const m = r.stream ? 1 : r.rev / Math.max(1, r.cost);
      out.mult.push(m);
      if (m >= 1.4) out.hit++; else if (m < 0.9) out.flop++; else out.mid++;
      out.rt += r.ratings.rt; out.aud += r.ratings.aud; out.imdb += r.ratings.imdb; out.viral += r.viral;
    }
    state.dir = save;
    out.mult.sort((a, b) => a - b);
    return { hit: out.hit / n, flop: out.flop / n, mid: out.mid / n, rt: Math.round(out.rt / n), aud: Math.round(out.aud / n), imdb: Math.round((out.imdb / n) * 10) / 10, viral: Math.round(out.viral / n), p10: out.mult[Math.floor(n * 0.1)].toFixed(2), p50: out.mult[Math.floor(n * 0.5)].toFixed(2), p90: out.mult[Math.floor(n * 0.9)].toFixed(2) };
  }

  // ------------------------------------------------------------------ hooks
  function boot() {
    if (typeof state === "undefined" || typeof jCard !== "function" || typeof notice !== "function" || typeof sList === "undefined" || typeof openSpecialCareers !== "function" || !document.getElementById("ageBtn") || !window.FL_DIR_DATA) return setTimeout(boot, 80);
    // Movie Director lives in Occupation > Special Careers now (a row like Boxer, Cartel...), not in Activities
    const orig = window.openSpecialCareers;
    window.openSpecialCareers = function () {
      const out = orig.apply(this, arguments);
      try {
        if (!sList.querySelector('[data-pack="director"]')) {
          const d = R();
          const sub = d.active ? "Your film career" : "Write, finance, cast and shoot your own films";
          const html = `<div class="row sp-pack" data-pack="director"><img src="director/clap.png" alt=""><div class="t"><b>Movie Director</b><span>${sub}</span></div>${typeof CHEV !== "undefined" ? CHEV : ""}</div>`;
          // alphabetical spot in the main pack list (before Fighter), never down in the crime section
          const anchor = sList.querySelector('[data-pack="fighter"]') || sList.querySelector('[data-pack="mafia"]') || sList.querySelector(".sp-pack");
          anchor ? anchor.insertAdjacentHTML("beforebegin", html) : sList.insertAdjacentHTML("beforeend", html);
        }
        sList.querySelector('[data-pack="director"]').onclick = () => (snd("choice"), openHub());
      } catch (e) {
        warn("menu", e);
      }
      return out;
    };
    document.getElementById("ageBtn").addEventListener("click", () =>
      setTimeout(() => {
        try {
          tick();
        } catch (e) {
          warn("tick", e);
        }
      }, 700),
    );
    console.log("[director] loaded");
  }
  window.FL_DIR = { open: () => openHub(), state: () => R(), tick, sim, evaluate, autoProject, pool, power, rankName: () => rankName(R()) };
  boot();
})();
