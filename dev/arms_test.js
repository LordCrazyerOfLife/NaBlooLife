// Node harness for arms.js (Gun Dealers): fake game globals, opens every dealer, checks that every icon file exists,
// buys a Glock, swaps its magazine, checks the composite path and the v3 -> v4 save migration.
//   node dev/arms_test.js C:/Users/Mxzzy/Downloads/FreeLife/arms.js
const fs = require("fs");
const path = require("path");
const root = path.resolve(path.dirname(process.argv[2]));
const noop = () => {};
global.window = global;
let html = "";
const handlers = {};
const cards = [];
global.sList = { set innerHTML(v) { html = v; }, get innerHTML() { return html; }, scrollTop: 0, insertAdjacentHTML: (w, h) => { html += h; }, querySelectorAll: () => [] };
global.sTitle = { textContent: "" }; global.sBack = {}; global.sSub = { style: {} };
global.screen = { classList: { add: noop, remove: noop, contains: () => true } };
global.DOTS = ""; global.CHEV = ""; global.BACK_ICON = "<"; global.usd = (n) => "$" + Math.round(n); global.localPrice = (n) => n; global.play = noop;
global.state = { age: 30, money: 5e6, stats: { Health: 80, Happiness: 50 } };
global.say = noop; global.renderStats = noop; global.chaChing = noop; global.notice = (t, b) => cards.push({ notice: b });
global.jCard = (o) => cards.push(o);
global.socSelCard = (o) => cards.push({ sel: o });
global.openActivities = noop;
global.setTimeout = (f) => (typeof f === "function" ? 0 : 0);
global.document = {
  getElementById: (id) => (id === "ageBtn" ? {} : { classList: { contains: () => false }, set onclick(f) { handlers[id] = f; } }),
  createElement: () => ({ getContext: () => ({ drawImage: noop }), toDataURL: () => "data:image/png;base64,COMPOSITE" }),
};
let imagesReady = false;
global.Image = class { constructor() { this.naturalWidth = 1; } set src(v) { this._s = v; } get complete() { return imagesReady; } };
Math.random = () => 0.9;
require(process.argv[2]);
const FL = window.FL_ARMS;
const iconsIn = () => [...html.matchAll(/src="([^"]+)"/g)].map((m) => m[1]).filter((u) => u.startsWith("guns/") || u.startsWith("emoji/"));
const missing = new Set();
const checkIcons = () => { for (const u of iconsIn()) { const f = path.join(root, u.split("?")[0]); if (!fs.existsSync(f)) missing.add(u); } };
const rows = () => (html.match(/class="row/g) || []).length;
const ids = () => [...html.matchAll(/id="(aB_[a-z]_[A-Za-z0-9_:]+)"/g)].map((m) => m[1]);

FL.open(null);
console.log("main: dealers", ["Lil Ray", "Mr. Ortiz", "Viper", "Ghost", "Gun Store"].every((n) => html.includes(n)), "rows", rows());
checkIcons();
for (const d of ["store", "ray", "ortiz", "viper", "ghost"]) {
  handlers["aD_" + d]();
  const g = ids().filter((x) => x.startsWith("aB_g_")).length;
  console.log("dealer", d, "| guns", g, "| mags", ids().filter((x) => x.startsWith("aB_m_")).length, "| parts", ids().filter((x) => x.startsWith("aB_p_")).length, "| kits", ids().filter((x) => x.startsWith("aB_k_")).length, "| sections:", [...html.matchAll(/class="sec">([^<]+)</g)].map((m) => m[1]).join(" / "));
  checkIcons();
}
// buy a legal glock, a street glock, an AK, an SMG, a pistol; load every Glock mag
handlers["aD_store"]();
handlers["aB_g_glock07"](); cards.pop().choices[0][1]();             // confirm card -> Buy it
console.log("bought glock07:", state.arms.guns.length === 1, "money spent", 5e6 - state.money);
handlers["aD_ortiz"](); handlers["aB_g_draco"](); cards.pop().choices[0][1]();
handlers["aD_viper"](); handlers["aB_g_mp5"](); cards.pop().choices[0][1]();
handlers["aD_store"](); handlers["aB_g_deagle"](); cards.pop().choices[0][1]();
console.log("arsenal:", state.arms.guns.map((g) => g.id).join(","));
handlers["aD_ray"](); for (const k of Object.keys(state.arms.mags)) void k;
for (const mk of ["glock:m01", "glock:m07", "glock:m08", "glock:m12"]) { handlers["aB_m_" + mk](); cards.pop().choices[0][1](); }
console.log("mags owned:", JSON.stringify(state.arms.mags));
FL.open(null);
const glock = state.arms.guns.find((g) => g.id === "glock07");
handlers["aG_" + glock.uid]();
console.log("glock detail has Magazine + 3 slots:", html.includes("Magazine") && ["optic", "muzzle", "trigger"].every((s) => html.includes("gS_" + s)));
console.log("fallback icon (images not ready):", iconsIn().find((u) => u.includes("glock07")) );
handlers["gMag"](); let sel = cards.pop().sel;
console.log("mag options:", sel.opts.length, "|", sel.opts.slice(0, 5).join(" | "));
sel.onGo(sel.opts.findIndex((o) => o.includes("33 rounds")));
console.log("loaded:", glock.mag);
imagesReady = true;
FL.open(null); handlers["aG_" + glock.uid]();
console.log("composite icon in detail:", html.includes("COMPOSITE"));
// parts: reddot on the AK, switch on the glock
handlers["aD_ghost"](); handlers["aB_p_reddot"](); cards.pop().choices[0][1]();
handlers["aD_ray"](); handlers["aB_p_switch"](); const sc = cards.pop(); sc.sel.onGo(3);
console.log("parts:", state.arms.parts.map((p) => p.id + (p.color ? ":" + p.color : "")).join(","));
// kits
handlers["aD_ray"](); handlers["aB_k_kglock"](); cards.pop().choices[0][1]();
console.log("kit glock:", JSON.stringify(state.arms.guns[state.arms.guns.length - 1]));
checkIcons();
// carry + busted
handlers["aG_" + glock.uid](); handlers["gCarry"]();
console.log("carried:", JSON.stringify(FL.carried()), "| busted:", JSON.stringify(FL.busted("theft")));
// hunting list
handlers["aD_store"](); handlers["aB_g_pump"](); cards.pop().choices[0][1]();
FL.open(null); console.log("hunt row enabled:", !/class="row dis" id="aHunt"/.test(html));
// migration from a v3 save
state.arms = { v: 3, guns: [{ uid: 1, id: "g19", mag: "glock:ext", att: {} }, { uid: 2, id: "sg19", mag: null, att: { trigger: { id: "switch", color: "red" } } }, { uid: 3, id: "draco", mag: "ak:drum", att: {} }, { uid: 4, id: "bow", att: {} }, { uid: 5, id: "dbl", att: {} }], carry: 1, mags: { "glock:ext": 2, "glock:drum": 1, "ak:ext": 1 }, parts: [], uid: 9, license: false, yr: { age: -1, hunts: 0 } };
FL.open(null);
console.log("migrated:", state.arms.guns.map((g) => g.id + (g.mag ? "[" + g.mag + "]" : "")).join(","), "| mags", JSON.stringify(state.arms.mags), "| carry", state.arms.carry, "| v", state.arms.v);
checkIcons();
console.log("MISSING ICON FILES:", missing.size ? [...missing].join(", ") : "none");
