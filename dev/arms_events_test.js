// Node harness for arms-events.js: loads the real arms.js + arms-events.js with fake game globals.
//   node dev/arms_events_test.js C:/Users/Mxzzy/Downloads/FreeLife/arms-events.js
const fs = require("fs");
const path = require("path");
const evFile = path.resolve(process.argv[2]);
const root = path.dirname(evFile);
const noop = () => {};
global.window = global;
const cards = [];
const calls = { die: 0, arrest: 0 };
let clickHandler = null;
global.sList = { innerHTML: "", scrollTop: 0, insertAdjacentHTML: noop, querySelectorAll: () => [] };
global.sTitle = { textContent: "" }; global.sBack = {}; global.sSub = { style: {} };
global.screen = { classList: { add: noop, remove: noop, contains: () => true } };
global.DOTS = ""; global.CHEV = ""; global.BACK_ICON = "<"; global.usd = (n) => "$" + Math.round(n); global.localPrice = (n) => n; global.play = noop;
global.clearTimeout = noop;
global.setTimeout = (f) => { if (typeof f === "function") f(); return 0; };
const fresh = () => ({ age: 30, money: 5e6, stats: { Health: 80, Happiness: 50 }, dead: false, prison: false, gangLife: { v: 1, member: true, gang: 0, rank: 1, rep: 50, heat: 30, evDone: {} } });
global.state = fresh();
global.say = noop; global.renderStats = noop; global.chaChing = noop; global.notice = noop;
global.jCard = (o) => cards.push(o);
global.socSelCard = noop; global.openActivities = noop;
global.queuePopup = (f) => f();
global.arrest = () => { calls.arrest++; };
global.die = () => { calls.die++; };
global.document = {
  getElementById: (id) => (id === "ageBtn" ? { addEventListener: (_, f) => { clickHandler = f; } } : { classList: { contains: () => false } }),
  createElement: () => ({ getContext: () => ({ drawImage: noop }), toDataURL: () => "data:image/png;base64,X" }),
  head: { appendChild: noop },
};
global.Image = class { constructor() { this.naturalWidth = 1; } set src(v) {} get complete() { return false; } };

// real danger-events.js + the jewel-robbery events array (extracted from the source)
const dsrc = fs.readFileSync(path.join(root, "danger-events.js"), "utf8");
(0, eval)(dsrc);
const dangerOrig = JSON.parse(JSON.stringify(window.DANGER_EVENTS.filter((e) => ["Armed Robbery", "Mugging", "Home Invasion"].includes(e.t))));
const jsrc = fs.readFileSync(path.join(root, "jewel-robbery.js"), "utf8");
const a0 = jsrc.indexOf("const e = [") + "const e = ".length;
const a1 = jsrc.indexOf("\n    ],\n    t = ");
window.JEWEL_ROBBERY = { EVENTS: (0, eval)("(" + jsrc.slice(a0, a1 > 0 ? a1 + 6 : a0) + ")") };
const jewelCount = window.JEWEL_ROBBERY.EVENTS.length;
const jewelGun = window.JEWEL_ROBBERY.EVENTS.filter((e) => e.gun).length;

Math.random = () => 0.5;
require(path.join(root, "arms.js"));
require(evFile);
const FA = window.FL_ARMS, FE = window.FL_ARMS_EVENTS;
let fails = 0;
const check = (name, ok, extra) => { if (!ok) { fails++; console.log("FAIL", name, extra || ""); } };
check("api", FE && typeof FE.tick === "function" && Array.isArray(FE.EVENTS) && typeof FE.patchRobberies === "function");
check("click handler registered", typeof clickHandler === "function");

const SNAP = () => JSON.stringify(state);
let noCarry = false;
const stock = () => {
  global.state = fresh();
  for (const id of ["glock07", "draco", "pump", "p08", "tommy", "glock05"]) FA.give(id);
  const uid = FA.owned()[0].uid;
  if (!noCarry) FA.carry(uid);
};

// (a) every event launches and every choice runs with random = 0.05 / 0.5 / 0.95
const RN = [0.05, 0.5, 0.95];
let ran = 0;
for (const ev of FE.EVENTS) {
  for (const r of RN) {
    stock();
    const snap = SNAP();
    Math.random = () => r;
    cards.length = 0;
    try { FE.EVENTS.find((x) => x.id === ev.id); (function () { /* run via internal: use tick-free path */ })(); } catch (e) {}
    // run() is internal: reach it through a forced tick for just this event
    const only = FE.EVENTS.slice();
    FE.EVENTS.length = 0; FE.EVENTS.push(ev);
    state.arms.evDone = {};
    state.age = 40;
    let launched = false;
    try {
      Math.random = () => 0.05; // pass the 30% gate
      FE.tick();
      launched = cards.length > 0;
    } catch (e) { check("launch " + ev.id, false, e.stack); }
    FE.EVENTS.length = 0; FE.EVENTS.push(...only);
    if (!launched && !noCarry) { noCarry = true; stock(); state.arms.evDone = {}; state.age = 40; FE.EVENTS.length = 0; FE.EVENTS.push(ev); Math.random = () => 0.05; FE.tick(); launched = cards.length > 0; FE.EVENTS.length = 0; FE.EVENTS.push(...only); }
    if (!launched) { noCarry = false; continue; }
    const card = cards.pop();
    const keepNo = noCarry;
    check("card " + ev.id, card && card.title && card.lead && Array.isArray(card.choices) && card.choices.length >= 1 && card.choices.length <= 3, card && card.choices && card.choices.length);
    for (let i = 0; i < card.choices.length; i++) {
      for (const rr of RN) {
        stock(); // restore a known state for the choice (same guns/uids)
        state.arms.evDone = {};
        Math.random = () => rr;
        cards.length = 0;
        try { card.choices[i][1](); ran++; } catch (e) { check(`choice ${ev.id}#${i} r=${rr}`, false, e.stack); }
        for (const c of cards) check("result card " + ev.id, c.title && typeof c.lead === "string");
      }
    }
    noCarry = false;
  }
}
Math.random = () => 0.5;
const launchedIds = new Set();
for (const ev of FE.EVENTS) {
  // second pass: which events can launch with a rich inventory
  const only = FE.EVENTS.slice();
  for (const nc of [false, true]) {
    noCarry = nc; stock(); state.age = 40;
    FE.EVENTS.length = 0; FE.EVENTS.push(ev);
    cards.length = 0; Math.random = () => 0.05; FE.tick();
    if (cards.length) launchedIds.add(ev.id);
  }
  noCarry = false;
  FE.EVENTS.length = 0; FE.EVENTS.push(...only);
}
const never = FE.EVENTS.filter((e) => !launchedIds.has(e.id)).map((e) => e.id);
check("all events launchable with rich inventory", never.length === 0, never.join(","));

// (b) 40 years of tick: no repeats before 4 years, no exceptions
let seed = 12345;
Math.random = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
stock();
const last = {};
let shown = 0, minGap = 99;
for (let age = 16; age <= 56; age++) {
  state.age = age;
  if (FA.owned().length < 4) stock2();
  function stock2() { for (const id of ["glock07", "draco", "pump", "p08", "tommy"]) FA.give(id); FA.carry(FA.owned()[0].uid); }
  if (!state.arms.carry && FA.owned().length) FA.carry(FA.owned()[0].uid);
  const before = JSON.stringify(state.arms.evDone || {});
  cards.length = 0;
  try { FE.tick(); } catch (e) { check("tick " + age, false, e.stack); }
  const d = state.arms.evDone || {};
  for (const id of Object.keys(d)) if (d[id] === age && JSON.parse(before)[id] !== age) {
    shown++;
    if (last[id] != null) { minGap = Math.min(minGap, age - last[id]); check("gap " + id, age - last[id] >= 4, age - last[id]); }
    last[id] = age;
  }
  if (cards.length && Math.random() < 0.7) { const c = cards[0]; try { c.choices[Math.floor(Math.random() * c.choices.length)][1](); } catch (e) { check("tick choice " + age, false, e.stack); } }
}
console.log("40 years: events shown", shown, "| min gap", minGap === 99 ? "n/a" : minGap);
// gates: no tick under 16, dead, prison, no guns
Math.random = () => 0.01;
for (const mut of [(s) => (s.age = 15), (s) => (s.dead = true), (s) => (s.prison = true)]) { stock(); mut(state); cards.length = 0; FE.tick(); check("gate", cards.length === 0); }
global.state = fresh(); state.age = 30; cards.length = 0; FE.tick(); check("no guns -> no event", cards.length === 0);

// (c) DANGER_EVENTS patch
Math.random = () => 0.5;
const D = window.DANGER_EVENTS.filter((e) => ["Armed Robbery", "Mugging", "Home Invasion"].includes(e.t));
check("3 danger events patched", D.length === 3 && D.every((e) => e.__gunPatched));
const others = window.DANGER_EVENTS.filter((e) => !["Armed Robbery", "Mugging", "Home Invasion"].includes(e.t));
check("other danger events untouched", others.every((e) => !e.__gunPatched));
const mapper = ([label, cause, msg]) => [label, () => msg];
for (const ev of D) {
  const orig = dangerOrig.find((o) => o.t === ev.t);
  global.state = fresh(); // no guns
  let r = ev.bad.map(mapper);
  check("no gun same count " + ev.t, r.length === orig.bad.length, r.length);
  check("map is non-enumerable " + ev.t, !Object.keys(ev.bad).includes("map"));
  stock();
  r = ev.bad.map(mapper);
  check("with carried gun +1 " + ev.t, r.length === orig.bad.length + 1, r.length);
  const pull = r[r.length - 1];
  check("pull label " + ev.t, /Pull your gun/.test(pull[0]), pull[0]);
  for (const rr of [0.01, 0.3, 0.7, 0.8, 0.9, 0.97]) {
    stock(); Math.random = () => rr;
    try { const m = pull[1](); check("pull returns text " + ev.t, typeof m === "string" && m.length > 5); } catch (e) { check("pull " + ev.t + " " + rr, false, e.stack); }
  }
  Math.random = () => 0.5;
}
// Home Invasion with owned (not carried) gun
{
  const hi = D.find((e) => e.t === "Home Invasion"), ar = D.find((e) => e.t === "Armed Robbery");
  global.state = fresh(); FA.give("glock07");
  check("home invasion counts owned gun", hi.bad.map(mapper).length === 3);
  check("armed robbery needs carried gun", ar.bad.map(mapper).length === 2);
}
// idempotent
const before = D.map((e) => e.bad);
const rr1 = FE.patchRobberies();
check("idempotent danger", D.every((e, i) => e.bad === before[i]));

// (c) JEWEL_ROBBERY patch
const JE = window.JEWEL_ROBBERY.EVENTS;
const patched = JE.filter((e) => e.__gunPatched);
const nonPatchedGun = JE.filter((e) => e.gun && !e.__gunPatched).map((e) => e.t);
global.state = fresh();
for (const ev of patched) {
  const noGun = ev.c;
  check("jewel no gun is array " + ev.t, Array.isArray(noGun) && noGun.length >= 2 && !noGun.some((x) => /Pull your gun/.test(x.l)));
  check("jewel .filter works", Array.isArray(noGun.filter((e) => !e.pet)));
}
stock();
for (const ev of patched) {
  const withGun = ev.c;
  const extra = withGun[withGun.length - 1];
  check("jewel with gun +1 " + ev.t, /Pull your gun/.test(extra.l) && extra.p >= 0.45 && extra.p <= 0.9 && extra.h === 1 && extra.d > 0 && typeof extra.ok === "string" && typeof extra.no === "string", JSON.stringify(extra));
  if (ev.at === "hostage") check("hostage has k " + ev.t, extra.k >= 0.4);
  else check("non-hostage no k " + ev.t, extra.k === undefined);
  check("jewel ok has {item}", /\{item\}/.test(extra.ok));
}
const homeEv = JE.find((e) => e.t === "Room Service");
global.state = fresh(); FA.give("glock07");
check("home jewel counts owned gun", homeEv.c.some((x) => /Pull your gun/.test(x.l)));
const streetEv = JE.find((e) => e.t === "Run That Chain");
check("street jewel needs carried gun", !streetEv.c.some((x) => /Pull your gun/.test(x.l)));
const knife = JE.find((e) => e.t === "Fake Fan");
check("knife event untouched", !knife.__gunPatched);
const r2 = FE.patchRobberies();
check("idempotent jewel", r2.jewel === patched.length && JE.filter((e) => e.__gunPatched).length === patched.length);

console.log("--- resumen ---");
console.log("eventos de arma:", FE.EVENTS.length, "|", FE.EVENTS.map((e) => e.id).join(", "));
console.log("choices ejecutadas OK:", ran);
console.log("danger patched:", D.length, "->", D.map((e) => e.t).join(", "));
console.log("jewel: eventos", jewelCount, "| con arma", jewelGun, "| parchados", patched.length, "| sin parche:", nonPatchedGun.join(", ") || "ninguno");
console.log(fails ? "FALLOS: " + fails : "TODO OK");
process.exit(fails ? 1 : 0);
