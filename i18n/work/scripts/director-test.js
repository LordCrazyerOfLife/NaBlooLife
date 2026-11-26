// Node harness for the Movie Director mod: runs N full lives with a bot that plays every screen.
//   node director-test.js [lives=100] [firstSeed=1]
// Fake DOM (sList/sTitle/jCard/notice stubs), seeded Math.random, invariants checked after every action.
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const ROOT = path.resolve(__dirname, "..", "..", "..");
const LIVES = +process.argv[2] || 100;
const SEED0 = +process.argv[3] || 1;

const warns = [];
const realWarn = console.warn;
console.warn = (...a) => warns.push(a.map(String).join(" ").slice(0, 200));
const log = console.log;
console.log = () => {};

function mulberry(a) {
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---------------------------------------------------------------- fake game globals
const g = globalThis;
g.window = g;
const un = (s) => s.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'");
const mkEl = (n, dis, label) => ({ dataset: { n }, dis, label, onclick: null, classList: { contains: (c) => !!dis && c === "dis" } });
g.sList = {
  _h: "", _els: null, scrollTop: 0,
  set innerHTML(h) { this._h = h; this._els = null; },
  get innerHTML() { return this._h; },
  querySelectorAll(sel) {
    if (sel !== "[data-n]") return [];
    if (!this._els) {
      this._els = [];
      const re = /<div class="row( dis)?" data-n="([^"]*)">([\s\S]*?)<\/div>(?=<div class="row|<div class="sec|$)/g;
      let m;
      while ((m = re.exec(this._h))) this._els.push(mkEl(un(m[2]), !!m[1], (m[3].match(/<b>([\s\S]*?)<\/b>/) || [, ""])[1]));
    }
    return this._els;
  },
  insertAdjacentHTML() {},
};
g.sTitle = { textContent: "" };
g.sSub = { style: {} };
g.sBack = { innerHTML: "", onclick: null };
g.screen = { classList: { add() {}, remove() {} } };
g.CHEV = "";
g.BACK_ICON = "";
g.cur = () => "$";
g.usd = (n) => "$" + Math.round(n).toLocaleString("en-US");
g.say = () => {};
g.renderStats = () => {};
g.play = () => {};
g.isOldEra = () => false;
g.openActivities = () => {};
g.PRICE_LVL = { us: 1, cz: 0.6, ch: 1.6, in: 0.15, br: 0.3, jp: 1.1 };
g.prompt = () => null;
const ageBtn = { addEventListener() {} };
g.document = { getElementById: (id) => (id === "ageBtn" ? ageBtn : null), createElement: () => ({}) };
let pending = null;
g.jCard = (o) => { pending = { kind: "card", o }; };
g.notice = (t, b, cb) => { pending = { kind: "note", t, b, cb }; };

vm.runInThisContext(fs.readFileSync(path.join(ROOT, "director-data.js"), "utf8"), { filename: "director-data.js" });
vm.runInThisContext(fs.readFileSync(path.join(ROOT, "director.js"), "utf8"), { filename: "director.js" });

// ---------------------------------------------------------------- bot
let rnd = Math.random;
const pick = (a) => a[Math.floor(rnd() * a.length)];
const problems = [];
let ctxLife = 0, steps = 0, stuckFund = 0;
const fail = (m) => problems.push(`life ${ctxLife}: ${m}`);
function settle() {
  let guard = 0;
  while (pending && guard++ < 300) {
    const p = pending;
    pending = null;
    if (p.kind === "note") { if (p.cb) p.cb(); }
    else {
      const ch = p.o.choices || [];
      if (!ch.length) continue;
      // prefer progress choices sometimes, else random
      const c = rnd() < 0.15 ? ch[ch.length - 1] : pick(ch);
      c[1]();
    }
  }
  if (guard >= 300) fail("popup loop did not settle at " + sTitle.textContent);
}
const rowsNow = () => sList.querySelectorAll("[data-n]");
const ids = () => rowsNow().filter((e) => !e.dis).map((e) => e.dataset.n);
const tap = (re) => {
  const e = rowsNow().find((x) => !x.dis && re.test(x.dataset.n));
  if (!e || !e.onclick) return false;
  e.onclick();
  settle();
  return true;
};
const hist = []; let dumped = 0;
function botStep(d) {
  const all = ids();
  hist.push(sTitle.textContent + ' :: ' + all.slice(0, 8).join(',')); if (hist.length > 12) hist.shift();
  if (process.env.DBG && steps < +process.env.DBG) process.stderr.write(sTitle.textContent + ' :: ' + all.join(',') + "\n");
  const has = (re) => all.some((x) => re.test(x));
  const p = d.proj;
  steps++;
  if (!p && !has(/^(new|proj)$/)) { FL_DIR.open(); settle(); return true; }
  // wizard pickers
  if (has(/^[acdhstrfnm]$/) && all.length >= 8 && !has(/^s_/)) return tap(new RegExp("^" + pick(all.filter((x) => /^[acdhstrfnm]$/.test(x))) + "$"));
  if (has(/^(redemption|revenge|love)$/)) return tap(new RegExp("^" + pick(all) + "$"));
  if (has(/^(none|mentor|dead)$/)) return tap(new RegExp("^" + pick(all) + "$"));
  if (has(/^p[0-2]$/)) return tap(/^p0$/) || tap(new RegExp("^" + pick(all) + "$"));
  if (has(/^(t0|own)$/)) return tap(/^t[0-2]$/);
  // script
  if (has(/^w[0-3]$/)) return tap(new RegExp("^" + pick(all.filter((x) => /^w/.test(x))) + "$"));
  if (all.includes("lock") && all.length <= 4 && p && !p.done.script && p.writer) { if (rnd() < 0.5 && tap(/^(doc|rew)$/)) return true; return tap(/^lock$/); }
  // budget tiers
  if (has(/^[0-5]$/) && all.every((x) => /^[0-5]$/.test(x))) return tap(new RegExp("^" + pick(all) + "$"));
  // financing
  if (has(/^rebudget$/) && !has(/^(self|grant|st_)/)) { stuckFund++; if (stuckFund > 6) { stuckFund = 0; d.proj = null; stats.unstuckFund = (stats.unstuckFund||0) + 1; sBack.onclick && FL_DIR.open(); return true; } } else if (!has(/^[0-5]$/)) stuckFund = 0;
  if (has(/^(self|grant|st_)/) || (all.includes("rebudget") && p && !p.done.fund)) {
    const opts = all.filter((x) => x === "self" || x === "grant" || /^st_/.test(x));
    if (opts.length) return tap(new RegExp("^" + pick(opts) + "$"));
    return tap(/^rebudget$/);
  }
  // casting
  if (has(/^r_/)) {
    const roles = all.filter((x) => /^r_/.test(x));
    const empty = roles.filter((r) => !p.cast[r.slice(2)]);
    if (p.cast.Lead && (empty.length === 0 || rnd() < 0.4) && tap(/^lock$/)) return true;
    if (!p.cast.Lead) return tap(/^r_Lead$/);
    if (empty.length) return tap(new RegExp("^" + pick(empty) + "$"));
    return tap(/^lock$/);
  }
  if (has(/^(a_|more$|unk$)/)) {
    const as = all.filter((x) => /^a_/.test(x)).slice(0, 12).concat(all.includes('unk') ? ['unk', 'unk'] : []);
    if (!as.length) { sBack.onclick(); settle(); return true; }
    return tap(new RegExp("^" + pick(as).replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "$"));
  }
  // departments: dev / money / crew / shoot (each submenu)
  const back = () => { sBack.onclick(); settle(); return true; };
  const RX = (x) => new RegExp("^" + x.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "$");
  if (has(/^style$/) && has(/^(story|script)$/)) {
    if (!p.done.story) return tap(/^story$/);
    if (!p.done.script) return tap(/^script$/);
    const opt = all.filter((x) => /^(rs_|style)/.test(x));
    if (opt.length && rnd() < 0.55) return tap(RX(pick(opt)));
    return back();
  }
  if (has(/^budget$/)) {
    if (p.tier == null) return tap(/^budget$/);
    if (!p.done.fund && all.includes("fund")) return tap(/^fund$/);
    const opt = all.filter((x) => /^(producer|presale|place)$/.test(x));
    if (opt.length && rnd() < 0.5) return tap(RX(pick(opt)));
    if (!p.done.fund && rnd() < 0.3) return tap(/^budget$/);
    return back();
  }
  if (has(/^cast$/) || has(/^castdir$/)) {
    if (!p.done.cast && all.includes("cast")) return tap(/^cast$/);
    const opt = all.filter((x) => /^(castdir|crew_)/.test(x));
    if (opt.length && rnd() < 0.5) return tap(RX(pick(opt)));
    return back();
  }
  if (has(/^(plan|rehearse|start)$/)) {
    if (all.includes("rehearse") && rnd() < 0.4) return tap(/^rehearse$/);
    if (all.includes("plan") && rnd() < 0.4) return tap(/^plan$/);
    if (all.includes("start")) return tap(/^start$/);
    return back();
  }
  // post
  if (has(/^(cut|score|polish|screen|lock)$/) && !has(/^(w[0-3]|r_)/)) {
    if (!p.cutKind && all.includes("cut")) return tap(/^cut$/);
    const opt = all.filter((x) => /^(score|polish|screen)$/.test(x));
    if (opt.length && rnd() < 0.5) return tap(RX(pick(opt)));
    return tap(/^lock$/) || back();
  }
  // marketing screen
  if (has(/^sl_/)) {
    if (!p.slot) return tap(RX(pick(all.filter((x) => /^sl_/.test(x)))));
    if (all.includes("release")) { if (rnd() < 0.35 && all.some((x) => /^ad_/.test(x))) return tap(RX(pick(all.filter((x) => /^ad_/.test(x))))); return tap(/^release$/); }
    if (rnd() < 0.6) return tap(RX(pick(all.filter((x) => /^ad_/.test(x)))));
    return back();
  }
  // project hub
  if (has(/^d_/) || has(/^release$/)) {
    if (has(/^release$/)) return tap(/^release$/);
    let k;
    if (!p.done.story || !p.done.script) k = "dev";
    else if (p.tier == null || !p.done.fund) k = "money";
    else if (!p.done.cast) k = "crew";
    else if (!p.done.shoot) k = "shoot";
    else if (!p.done.post) k = "post";
    else k = "mkt";
    if (rnd() < 0.2) k = pick(["dev", "money", "crew"]);
    return tap(new RegExp("^d_" + k + "$"));
  }
  // hub
  if (has(/^(new|proj)$/)) return tap(/^proj$/) || tap(/^new$/);
  return false;
}

function checkState(d, where) {
  const s = state;
  if (!Number.isFinite(s.money) || s.money < 0) fail(`${where}: bad money ${s.money}`);
  try { JSON.stringify(d); } catch (e) { fail(`${where}: state.dir not serializable`); }
  if (JSON.stringify(d).includes("NaN") || JSON.stringify(d).includes("null,null")) { /* JSON turns NaN into null */ }
  const bad = (o, p) => { for (const k in o) { const v = o[k]; if (typeof v === "number" && !Number.isFinite(v)) fail(`${where}: ${p}.${k} = ${v}`); else if (v && typeof v === "object" && p.split(".").length < 3) bad(v, p + "." + k); } };
  bad(d, "dir");
  const f = d.films[0];
  if (f && f.id === checkState.last) return;
  if (f) {
    checkState.last = f.id;
    const r = f.ratings;
    if (!(r.rt >= 0 && r.rt <= 100 && r.aud >= 0 && r.aud <= 100 && r.imdb >= 1 && r.imdb <= 10 && r.mc >= 0 && r.mc <= 100 && r.lb >= 0 && r.lb <= 5 && /^[ABCDF][+-]?$/.test(r.cs))) fail(`bad ratings ${JSON.stringify(r)}`);
    if (!(f.gross >= 0) || !Number.isFinite(f.take) || !Number.isFinite(f.profit)) fail(`bad money in film ${f.title}`);
    if (!f.stream && f.gross / f.B > 400) fail(`absurd gross multiple ${f.gross / f.B} on ${f.title}`);
    f.cast.forEach((c) => { if (!(c.age >= 16 && c.age <= 84)) fail(`cast age out of range: ${c.n} ${c.age}`); });
    ["script", "acting", "direction", "prod", "edit"].forEach((k) => { if (!(f.q[k] >= 0 && f.q[k] <= 100)) fail(`quality ${k}=${f.q[k]}`); });
    if (!f.title) fail("film without title");
  }
}

// ---------------------------------------------------------------- lives
const stats = { films: 0, lives: 0, hits: 0, flops: 0, maxRank: {}, stream: 0, awards: 0, pend: 0, offers: 0, unstuck: 0, rt: 0, cast: 0 };
for (let L = 0; L < LIVES; L++) {
  ctxLife = SEED0 + L;
  rnd = mulberry(ctxLife);
  Math.random = rnd;
  const countries = Object.keys(PRICE_LVL);
  g.state = {
    age: 18, birthYear: 1925 + Math.floor(rnd() * 90), money: Math.floor(rnd() * 3e6), country: pick(countries),
    stats: { Happiness: 60, Health: 60, Smarts: 20 + Math.floor(rnd() * 80), Looks: 50 }, first: "Test",
  };
  const years = 12 + Math.floor(rnd() * 28);
  const d = FL_DIR.state();
  try {
    FL_DIR.open(); settle(); // intro card -> "Become a director" is choice 0 or random
    if (!d.active) { d.active = true; }
    for (let y = 0; y < years; y++) {
      FL_DIR.open(); settle();
      let n = 0, idle = 0;
      while (n++ < 400) {
        if (!botStep(d)) { if (++idle > 2) break; FL_DIR.open(); settle(); continue; }
        idle = 0;
        checkState(d, `y${y}`);
        // stuck project with no way forward: shelve it
        if (d.proj && d.proj.done.fund && !d.proj.done.cast && n > 80) { stats.unstuckCast = (stats.unstuckCast||0) + 1; stats.castWhy = stats.castWhy || {}; if (dumped++ < 2) process.stderr.write("STUCK " + JSON.stringify({tier:d.proj.tier,B:d.proj.B,fund:d.proj.fund,cast:Object.keys(d.proj.cast),money:state.money,lv:PRICE_LVL[state.country]}) + "\n" + hist.join("\n") + "\n"); { const pp = d.proj; const why = pp.cast.Lead ? 'lead-ok-but-stuck' : 'no-lead'; stats.castWhy[why] = (stats.castWhy[why]||0)+1; stats.castTier = stats.castTier || {}; const k = 'tier'+pp.tier+(pp.fund==='grant'?'g':pp.fund==='self'?'s':'st'); stats.castTier[k]=(stats.castTier[k]||0)+1; } d.proj = null; }
        if (d.films[0] && d.films[0].year === state.birthYear + state.age && rnd() < 0.7) break; // released this year: age up
        if (rnd() < 0.015) break;
      }
      state.age++;
      state.money += Math.floor(rnd() * 800000);
      const before = d.pending.length;
      FL_DIR.tick(); settle();
      checkState(d, `tick y${y}`);
      if (before) stats.pend += before - d.pending.length;
    }
  } catch (e) {
    fail("EXCEPTION " + (e.stack || e).toString().split("\n").slice(0, 4).join(" | "));
  }
  stats.lives++;
  stats.films += d.films.length;
  stats.awards += d.awards.length;
  d.films.forEach((f) => { if (f.stream) stats.stream++; else if (f.gross >= f.B * 1.5) stats.hits++; else if (f.gross < f.B * 0.9) stats.flops++; stats.rt += f.ratings.rt; stats.cast += f.cast.length; });
  const rk = FL_DIR.rankName();
  stats.maxRank[rk] = (stats.maxRank[rk] || 0) + 1;
}
console.log = log;
console.warn = realWarn;
log(JSON.stringify({ lives: stats.lives, films: stats.films, perLife: +(stats.films / stats.lives).toFixed(1), hits: stats.hits, flops: stats.flops, stream: stats.stream, awardsTotal: stats.awards, avgRT: Math.round(stats.rt / Math.max(1, stats.films)), castPerFilm: +(stats.cast / Math.max(1, stats.films)).toFixed(1), pendingPaid: stats.pend, unstuckFund: stats.unstuckFund, unstuckCast: stats.unstuckCast, castWhy: stats.castWhy, castTier: stats.castTier, endRank: stats.maxRank, botSteps: steps }));
log("director warnings:", warns.length, [...new Set(warns)].slice(0, 6));
log("problems:", problems.length);
problems.slice(0, 15).forEach((p) => log("  " + p));
process.exit(problems.length || warns.length ? 1 : 0);
