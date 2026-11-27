// Node harness for gang.js + gangwars.js + arms.js: fake game globals, join a gang, open the menu, spin the block with and without
// a gun, walk the relations screen, play 60 years of events answering every popup, check bounds and migrations.
//   node dev/gangwars_test.js C:/Users/Mxzzy/Downloads/FreeLife
const path = require("path");
const root = process.argv[2];
const noop = () => {};
global.window = global;
let html = "";
const els = {};
const cards = [];
const errors = [];
global.sList = { set innerHTML(v) { html = v; }, get innerHTML() { return html; }, scrollTop: 0, insertAdjacentHTML: noop, querySelector: () => null };
global.sTitle = { textContent: "" }; global.sBack = {}; global.sSub = { style: {} };
global.screen = { classList: { add: noop, remove: noop, contains: () => true } };
global.DOTS = ""; global.CHEV = ""; global.BACK_ICON = "<"; global.usd = (n) => "$" + Math.round(n); global.localPrice = (n) => n; global.play = noop;
global.state = { age: 22, money: 5e6, stats: { Health: 80, Happiness: 50 } };
const sayLog = [];
global.say = (t) => sayLog.push(t); global.renderStats = noop; global.chaChing = noop; global.syncProfile = noop;
global.notice = (t, b, cb) => cards.push({ notice: b, cb });
global.iosConfirm = (t, b, cb) => cb();
global.jCard = (o) => cards.push(o);
global.socSelCard = (o) => cards.push({ sel: o });
global.openActivities = noop; global.openSpecialCareers = noop; global.openOccupation = noop;
global.queuePopup = (f) => f();
global.setTimeout = (f) => (typeof f === "function" ? f() : 0);
let arrests = 0, deaths = 0;
global.arrest = (c) => { arrests++; state.prison = false; };
global.die = () => { deaths++; };
global.Audio = class { play() { return Promise.resolve(); } };
global.document = {
  getElementById: (id) => (id === "ageBtn" ? { addEventListener: noop } : (els[id] ||= { classList: { contains: () => false } })),
  createElement: () => ({ append: noop, style: {}, remove: noop, getContext: () => ({ drawImage: noop }), toDataURL: () => "data:image/png;base64,X" }),
  head: { append: noop, appendChild: noop, removeChild: noop },
  body: { appendChild: noop },
};
const origRandom = Math.random;
require(path.join(root, "arms.js"));
require(path.join(root, "gang.js"));
require(path.join(root, "gangwars.js"));
require(path.join(root, "arms-events.js"));
const API = window.FL_GANG_API, GW = window.FL_GANGWARS;
const ok = (c, m) => console.log((c ? "OK   " : "FAIL ") + m) || (c || errors.push(m));
ok(!!API && !!GW && !!window.FL_ARMS, "FL_GANG_API / FL_GANGWARS / FL_ARMS loaded");

// ---- join gang #0 (GD): set the state like join() does and let gangwars sync
state.gangLife = {};
const g = API.G();
Object.assign(g, { member: true, gang: 0, rank: 2, rep: 40, heat: 10, years: 0, left: false });
GW.onJoin(g);
const w = GW.W(g);
ok(w.blocks.filter((b) => b.owner === 0).length >= 2, "your gang holds at least 2 blocks (" + w.blocks.filter((b) => b.owner === 0).length + ")");
ok(w.rel[1] <= -45 && w.rel[6] <= -30, "GD: BD is an opp (" + w.rel[1] + "), People (Vice Lords) are hostile (" + w.rel[6] + ")");
FL_GANG.open();
ok(html.includes("Opp Body Count") && html.includes("Gang Relations") && html.includes("Spin the Block") && html.includes("Gun Dealers"), "menu has Body Count, Relations, Spin the Block and Gun Dealers");
ok(!/gW_/.test(html), "the old Strap weapon rows are gone");

// ---- spin without a gun
els["gA_spin"].onclick();
let c = cards.pop();
ok(c && /empty-handed/.test(c.lead || ""), "spin without a gun asks for a strap and does not spend the action (acts " + g.yr.acts + ")");
// ---- spin with a gun
const uid = FL_ARMS.give("glock07"); FL_ARMS.carry(uid);
els["gA_spin"].onclick();
c = cards.pop();
ok(c && c.sel && c.sel.opts.length > 0 && !/Ally\)/.test(c.sel.opts.join()), "target list: " + c.sel.opts.length + " blocks, no allies");
let kills0 = w.kills;
const rolls = [0.05, 0.2, 0.5, 0.95];
let sawKill = 0;
for (let i = 0; i < 400; i++) {
  g.yr.acts = 0; g.heat = 0; state.stats.Health = 90; state.prison = false;
  Math.random = () => origRandom();
  els["gA_spin"].onclick();
  const sc = cards.pop();
  if (!sc.sel) continue;
  try { sc.sel.onGo(i % sc.sel.opts.length); } catch (e) { errors.push("spin threw: " + e.stack); }
  while (cards.length) cards.pop();
  if (!FL_ARMS.carriedRaw()) { const u = FL_ARMS.give("glock07"); FL_ARMS.carry(u); }
}
Math.random = origRandom;
ok(w.kills > kills0 && w.spins >= 380, "400 spins: kills " + (w.kills - kills0) + ", spins " + w.spins + ", arrests " + arrests + ", deaths " + deaths);
ok(Object.values(w.rel).every((v) => v >= -100 && v <= 100), "relations stay within -100..100");

// ---- relations screen + every diplomacy choice
GW.openRelations();
ok(html.includes("Gangs") || html.includes("The Gangs"), "relations screen renders");
const xs = Object.keys(els).filter((k) => k.startsWith("gwG_"));
ok(xs.length === 9, "gwG_ rows for the 9 other gangs (" + xs.length + ")");
g.rank = 4; g.heat = 20;
let spent = 0;
for (const id of xs) {
  for (let ch = 0; ch < 6; ch++) {
    GW.W(g).yr.dip = 0;
    els[id].onclick();
    const card = cards.pop();
    if (!card || !card.choices) continue;
    const pickCh = card.choices[ch % card.choices.length];
    try { pickCh[1](); spent++; } catch (e) { errors.push("diplomacy threw: " + e.stack); }
    while (cards.length) { const k = cards.pop(); if (k.choices) try { k.choices[0][1](); } catch (e) { errors.push("diplomacy follow-up: " + e.stack); } }
  }
}
ok(spent > 40, "ran " + spent + " diplomacy choices without errors");
ok(Object.values(w.rel).every((v) => v >= -100 && v <= 100), "relations in bounds after diplomacy");
// ---- war record, nation card
GW.warRecord(); c = cards.pop(); ok(c && c.rows && c.rows[0][1] === String(w.kills), "war record shows the body count (" + w.kills + ")");

// ---- 60 years of events, answering every popup
let seen = {};
for (let yr = 0; yr < 60; yr++) {
  state.age++; state.prison = false; state.stats.Health = 80;
  g.yr = { age: state.age, acts: 0 };
  w.yr = { age: state.age, dip: 0 };
  if (!FL_ARMS.carriedRaw()) { const u = FL_ARMS.give("glock07"); FL_ARMS.carry(u); }
  if (yr % 7 === 0) g.heat = 80;
  try { API.G(); FL_GANG.tick(); } catch (e) { errors.push("yearTick threw: " + e.stack); }
  let guard = 0;
  while (cards.length && guard++ < 30) {
    const k = cards.shift();
    if (k.title) seen[k.title] = (seen[k.title] || 0) + 1;
    if (k.choices) {
      const i = Math.floor(origRandom() * k.choices.length);
      try { k.choices[i][1](); } catch (e) { errors.push("event choice threw (" + k.title + "): " + e.stack); }
    } else if (k.sel) { try { k.sel.onGo(0); } catch (e) { errors.push("sel threw: " + e.stack); } }
    else if (k.cb) k.cb();
  }
  if (!g.member) { g.member = true; g.gang = 0; GW.onJoin(g); }
}
const warEvents = Object.keys(seen).filter((t) => /Spun|Funeral|Ally Needs|Diss Track|Peace Talks|Backstab|Nation Meeting|Injunction|Federal Task|Rival Clique|Word From Inside/.test(t));
ok(warEvents.length >= 4, "war events seen over 60 years: " + warEvents.join(" | "));
ok(Object.values(w.rel).every((v) => v >= -100 && v <= 100) && w.blocks.every((b) => b.owner >= 0 && b.owner < 10), "relations and block owners valid after 60 years");
ok(w.news.length >= 5 && w.news.every((n) => n && typeof n.t === "string" && typeof n.a === "number"), "street news generated (" + w.news.length + "): " + w.news[0].t);
console.log("final: kills", w.kills, "spins", w.spins, "crewLost", w.crewLost, "arrests", arrests, "deaths", deaths, "blocks held", w.blocks.filter((b) => b.owner === g.gang).length);


// ---- every war event, every choice, with low / mid / high rolls
{
  let n = 0;
  for (const e of GW.WAR_EVENTS) {
    for (const roll of [0.03, 0.5, 0.97]) {
      for (let ch = 0; ch < 4; ch++) {
        g.member = true; g.gang = 0; g.rank = 3; g.heat = 60; state.prison = false; state.stats.Health = 70; state.money = 5e6;
        if (!FL_ARMS.carriedRaw()) { const u = FL_ARMS.give("glock07"); FL_ARMS.carry(u); }
        Math.random = () => roll;
        const x = e.target(g, w) ?? 1;
        if (e.id === "funeral") w.pendingFuneral = "Tooky";
        let spec;
        try { spec = e.make(g, w, x); } catch (er) { errors.push("make threw " + e.id + ": " + er.stack); continue; }
        const choice = spec.choices[ch % spec.choices.length];
        try { choice[1](); n++; } catch (er) { errors.push("event " + e.id + " choice " + ch + " threw: " + er.stack); }
        while (cards.length) cards.pop();
      }
    }
  }
  Math.random = origRandom;
  ok(n >= GW.WAR_EVENTS.length * 6, "ran " + n + " war event choices across " + GW.WAR_EVENTS.length + " events");
  ok(Object.values(w.rel).every((v) => v >= -100 && v <= 100), "relations in bounds after the event sweep");
}


// ---- minigame hookup: FL_SHOOTER stub that wins / loses; spin and Turf War both offer "fight it yourself"
{
  let played = 0, wins = 0;
  window.FL_SHOOTER = { play(o) { played++; const win = origRandom() < 0.5; wins += win ? 1 : 0; o.onEnd({ win, kills: win ? 6 : 2, hpLeft: win ? 70 : 0, time: 30, shots: 40 }); } };
  const k0 = w.kills;
  for (let i = 0; i < 200; i++) {
    g.member = true; g.gang = 0; g.rank = 3; g.yr.acts = 0; g.heat = 0; state.prison = false; state.stats.Health = 90;
    if (!FL_ARMS.carriedRaw()) { const u = FL_ARMS.give("glock07"); FL_ARMS.carry(u); }
    els["gA_spin"].onclick();
    const sc = cards.pop();
    if (!sc || !sc.sel) { while (cards.length) cards.pop(); continue; }
    try {
      sc.sel.onGo(0);
      const q = cards.pop();
      if (q && q.choices && /Fight it out/.test(q.choices[0][0])) q.choices[i % 2][1]();
    } catch (e) { errors.push("spin+minigame threw: " + e.stack); }
    while (cards.length) cards.pop();
  }
  ok(played > 20 && w.kills > k0, "spin + minigame: " + played + " games played, kills +" + (w.kills - k0));
  let turfPlayed = played;
  for (let i = 0; i < 60; i++) {
    g.yr.acts = 0; g.rank = 3; state.prison = false; state.stats.Health = 90;
    els["gA_rumble"].onclick();
    const q = cards.pop();
    ok(i > 0 || (q && q.choices && /Fight it yourself/.test(q.choices[0][0]) && g.yr.acts === 0), "Turf War asks before spending the action");
    try { q.choices[i % 2][1](); } catch (e) { errors.push("turf+minigame threw: " + e.stack); }
    while (cards.length) cards.pop();
  }
  ok(played > turfPlayed, "Turf War played the minigame " + (played - turfPlayed) + " times; acts spent " + g.yr.acts);
  delete window.FL_SHOOTER;
}


// ---- Go Live hookup (FL_LIVE stub: the real UI is golive.js)
{
  const starts = [];
  window.FL_LIVE = { platforms: [{ id: "tiktok", name: "TikTok" }, { id: "instagram", name: "Instagram" }], start(o) { starts.push(o); o.onEnd({ peak: 320, avgViewers: 200, newFollowers: 55, gifts: 420, hype: 70, rep: 8, heat: 12, rel: -22, retaliation: true, banned: o.platform === "instagram", flashedGun: !!o.gun, locationSlip: false, replies: 4 }); } };
  g.member = true; g.gang = 0; g.rank = 3; g.heat = 10; w.yr = { age: state.age, dip: 0 }; w.mat = w.mat; state.stats.Health = 80; state.prison = false;
  FL_GANG.open(); ok(html.includes("Go Live"), "menu has Go Live");
  const run = () => { els["gwLive"].onclick(); let k = cards.pop(); if (k && k.sel) k.sel.onGo(0); k = cards.pop(); if (k && k.sel) k.sel.onGo(0); const r = cards.pop(); while (cards.length) cards.pop(); return r; };
  const money0 = state.money, f0 = w.live ? w.live.followers : 0;
  const res = run();
  ok(starts.length === 1 && starts[0].platform === "tiktok" && starts[0].target.name && starts[0].you.handle && starts[0].duration === 5, "live started with platform, target and handle (" + starts[0].you.handle + ")");
  ok(res && /Live ended/.test(res.title) && w.live.followers >= f0 + 55 && state.money > money0, "result applied: followers " + Math.round(w.live.followers) + ", money +" + Math.round(state.money - money0));
  FL_GANG.open(); run(); // second live this year
  FL_GANG.open(); els["gwLive"].onclick(); const lim = cards.pop(); ok(starts.length === 2 && lim && /twice this year/.test(lim.notice || ""), "limit of 2 lives per year");
  w.yr = { age: state.age, dip: 0 }; w.live.ban = {};
  FL_GANG.open(); els["gwLive"].onclick(); const ps = cards.pop(); ps.sel.onGo(1); const ts = cards.pop(); ts.sel.onGo(0); while (cards.length) cards.pop();
  ok(w.live.ban.instagram === state.age, "ban from the app is recorded");
  delete window.FL_LIVE;
}


// ---- Diss flow (post / verse / track / wall) + limit of 3 per year
{
  g.member = true; g.gang = 0; g.rank = 3; g.heat = 10; g.yr = { age: state.age, acts: 0 }; w.yr = { age: state.age, dip: 0 }; state.prison = false; state.stats.Health = 80; state.money = 5e6;
  FL_GANG.open(); ok(html.includes("Diss") && html.includes("On the Streets"), "menu has Diss and On the Streets rows");
  const kinds = [0, 1, 2, 3]; let dissed = 0;
  for (const k of kinds) {
    w.yr.diss = 0;
    for (const roll of [0.05, 0.95]) {
      Math.random = () => roll;
      FL_GANG.open(); els["gwDiss"].onclick();
      let c = cards.pop(); if (c && c.sel) c.sel.onGo(0); c = cards.pop();
      ok(k > 0 || roll > 0.5 || (c && c.choices && c.choices.length === 6), "diss format card has 6 options");
      try { c.choices[k][1](); dissed++; } catch (e) { errors.push("diss kind " + k + " threw: " + e.stack); }
      while (cards.length) cards.pop();
      w.yr.diss = 0;
    }
  }
  Math.random = origRandom;
  ok(dissed === 8 && Object.values(w.rel).every((v) => v >= -100 && v <= 100), "ran all 4 diss kinds with low/high rolls");
  w.yr.diss = 3; FL_GANG.open(); els["gwDiss"].onclick(); const lim = cards.pop(); ok(lim && /enough trash/.test(lim.notice || ""), "limit of 3 disses per year");
  w.yr.diss = 0;
}

// ---- Show respect: pay, link up, song together, spin together (simulate / play)
{
  const x = 7; // Latin Kings (People)
  w.mat[x][1] = w.mat[1][x] = -60; w.rel[1] = -60; w.blocks[3].owner = 1; w.blocks[4].owner = 1; // BD is their enemy and holds blocks
  Object.assign(w.rel, { [x]: 45 }); w.yr = { age: state.age, dip: 0 }; g.yr = { age: state.age, acts: 0 }; g.rank = 3; state.money = 5e6;
  if (!FL_ARMS.carriedRaw()) { const u = FL_ARMS.give("glock07"); FL_ARMS.carry(u); }
  const openMenu = () => { GW.openRelations(); els["gwG_" + x].onclick(); const card = cards.pop(); const sr = card.choices.find((c) => /Show respect/.test(c[0])); sr[1](); return cards.pop(); };
  let menu = openMenu();
  const labels = menu.choices.map((c) => c[0]).join(" | ");
  ok(/Pay respects/.test(labels) && /Link up/.test(labels) && /Make a song together/.test(labels) && /Go spin together/.test(labels), "respect menu offers: " + labels.replace(/\$[\d,]+/g, "$"));
  const run = (re) => { menu = openMenu(); const ch = menu.choices.find((c) => re.test(c[0])); ch[1](); const k = cards.pop(); while (cards.length) cards.pop(); return k; };
  for (const roll of [0.05, 0.5, 0.95]) { Math.random = () => roll; w.yr.dip = 0; w.rel[x] = 45; run(/Link up/); w.yr.dip = 0; run(/Make a song together/); w.yr.dip = 0; run(/Pay respects/); }
  Math.random = origRandom;
  ok(w.rel[x] > 20, "link up / song / pay respects raised the relation (now " + w.rel[x] + ")");
  // spin together without the minigame (simulate) and with it (play)
  const simulate = () => {
    if (!FL_ARMS.carriedRaw()) { const u = FL_ARMS.give("glock07"); FL_ARMS.carry(u); }
    g.yr.acts = 0; w.rel[x] = 45; menu = openMenu(); menu.choices.find((c) => /Go spin together/.test(c[0]))[1]();
    const sc = cards.pop(); if (!(sc && sc.sel)) { console.log("DEBUG no sel:", JSON.stringify(sc && (sc.notice || sc.title)), "gun", !!FL_ARMS.carried(), "acts", g.yr.acts, "age", state.age); return []; } ok(sc && sc.sel && /Spin with/.test(sc.sel.title) && sc.sel.opts.length > 0, "spin together lists enemy blocks of the partner (" + (sc && sc.sel ? sc.sel.opts.length : 0) + ")");
    sc.sel.onGo(0); const out = []; while (cards.length) out.push(cards.pop()); return out;
  };
  const kills0 = w.kills; let outs;
  for (let i = 0; i < 40; i++) { Math.random = () => origRandom(); g.heat = 0; state.prison = false; state.stats.Health = 90; simulate(); }
  ok(g.yr.acts >= 1, "spin together spends a yearly action");
  window.FL_SHOOTER = { play(o) { ok(o.allies === 3 && o.allyNames.length === 3 && /^[A-Za-z0-9]+ /.test(o.allyNames[0]), "minigame gets the partner's crew as allies: " + o.allyNames.join(", ")); o.onEnd({ win: origRandom() < 0.5, kills: 4, hpLeft: 70, time: 20, shots: 30 }); } };
  let played = 0;
  for (let i = 0; i < 30; i++) {
    if (!FL_ARMS.carriedRaw()) { const u = FL_ARMS.give("glock07"); FL_ARMS.carry(u); }
    g.yr.acts = 0; w.rel[x] = 45; g.heat = 0; state.prison = false; state.stats.Health = 90; Math.random = () => 0.5;
    menu = openMenu(); menu.choices.find((c) => /Go spin together/.test(c[0]))[1](); const sc = cards.pop(); if (!(sc && sc.sel)) continue; sc.sel.onGo(0);
    const q = cards.pop();
    if (q && q.choices && /Fight it out/.test(q.choices[0][0])) { ok(/Simulate it/.test(q.choices[1][0]), "contact card offers Fight it out / Simulate it"); q.choices[played % 2][1](); played++; }
    while (cards.length) cards.pop();
  }
  Math.random = origRandom; delete window.FL_SHOOTER;
  ok(played > 0 && Object.values(w.rel).every((v) => v >= -100 && v <= 100), "spin together played/simulated (" + played + " minigames)");
}

// ---- street news: 2-4 items per year, with ages
{
  const n0 = w.news.length; w.news.length = 0;
  for (let i = 0; i < 6; i++) { state.age++; w.yr = { age: state.age, dip: 0 }; g.yr = { age: state.age, acts: 0 }; g.member = true; state.prison = false; GW.yearTick(g, (f) => f(), g.yr); while (cards.length) cards.pop(); }
  ok(w.news.length === 8 && w.news.every((n) => n.t.length > 15), "news feed keeps the latest 8 headlines: " + w.news[0].t);
}

// ---- turf hooks
const t1 = GW.turfWon(g); ok(typeof t1 === "string" || t1 === null, "turfWon -> " + t1);
const t2 = GW.turfLost(g); ok(typeof t2 === "string" || t2 === null, "turfLost -> " + t2);

// ---- old save: v2 gangLife with the old Strap guns migrates into the arsenal
state.arms = undefined; state.gangLife = { v: 2, member: true, gang: 1, rank: 1, rep: 10, heat: 0, earned: 0, years: 3, evDone: {}, guns: [{ id: "glock", att: { trigger: { id: "switch", color: "blue" } } }, { id: "draco" }], carry: 1 };
const g2 = API.G();
ok(g2.v === 3 && (!g2.guns || g2.guns.length === 0) && state.arms && state.arms.guns.length === 2 && state.arms.guns[0].id === "glock07" && state.arms.guns[1].id === "draco" && state.arms.carry === 2, "old Strap guns moved to arms.js (" + JSON.stringify(state.arms && state.arms.guns.map((x) => x.id)) + ", carry " + (state.arms && state.arms.carry) + ")");
console.log(errors.length ? "\nERRORS:\n" + errors.join("\n") : "\nNO ERRORS");
process.exit(errors.length ? 1 : 0);
