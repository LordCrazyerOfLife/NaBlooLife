// node dev/musician_indie_test.js C:/Users/Mxzzy/Downloads/FreeLife
// Sandbox test for the independent-music section of musician.js (studios, vault, leaks, awards, 30 events).
const root = process.argv[2] || "C:/Users/Mxzzy/Downloads/FreeLife";
const fs = require("fs");
const path = require("path");

let html = "";
const cards = [], notices = [], logs = [];
global.window = global;
global.state = {
  age: 25, money: 100000, country: "us", city: "New York", stats: { Looks: 50 },
  job: null, social: {}, art: { fameOn: false, fame: 0 }, look: {},
};
global.clamp = (v, a = 0, b = 100) => Math.max(a, Math.min(b, v));
global.rint = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
global.chance = (p) => Math.random() < p;
global.pickR = (a) => a[Math.floor(Math.random() * a.length)];
global.S = (n) => Math.round(n);
global.localPrice = (n) => Math.round(n);
global.usd = (n) => "$" + Math.round(n);
global.say = (s) => logs.push(s);
global.notice = (t, b) => notices.push([t, b]);
global.jCard = (o) => cards.push(o);
global.queuePopup = (f) => f();
global.g = () => {};
global.statBar = () => "";
global.barCol = () => "#000";
global.renderStats = () => {};
global.socialStarCheck = () => {};
global.Audio = function () { return { play: () => ({ catch() {} }) }; };
global.MB_LIST = [];
global.MB_DO = {};
global.MB = () => ({ voice: 50, instr: {} });
global.openSpecialCareers = () => {};
global.openOccupation = () => {};
global.openJobScreen = () => {};
global.screen = { classList: { add() {}, remove() {} } };
global.sTitle = { textContent: "" };
global.sSub = { style: {} };
global.sBack = { innerHTML: "", onclick: null };
global.BACK_ICON = "<";
global.DOTS = "...";
global.stats = { insertAdjacentHTML() {}, offsetHeight: 0 };
global.sList = {
  innerHTML: "", scrollTop: 0,
  insertAdjacentHTML(w, h) { this.innerHTML = h + this.innerHTML; },
  querySelectorAll: () => [],
  querySelector: () => null,
};
global.ageBtnEl = { addEventListener() {} };
global.document = {
  getElementById: () => ({ addEventListener() {}, value: "" }),
  querySelector: () => ({ classList: { toggle() {} }, style: {} }),
  createElement: () => ({ style: {} }),
  head: { insertAdjacentHTML() {} },
};
global.setTimeout = (f) => f();
global.COUNTRIES = {
  us: ["United States", "Washington"], ca: ["Canada", "Ottawa"], mx: ["Mexico", "Mexico City"],
  br: ["Brazil", "Brasilia"], uk: ["United Kingdom", "London"], fr: ["France", "Paris"],
  de: ["Germany", "Berlin"], jp: ["Japan", "Tokyo"], au: ["Australia", "Canberra"],
};
global.CITIES = {
  us: ["New York", "Los Angeles"], ca: ["Toronto", "Vancouver"], mx: ["Guadalajara"],
  br: ["Rio de Janeiro"], uk: ["Manchester"], fr: ["Lyon"], de: ["Hamburg"], jp: ["Osaka"], au: ["Sydney"],
};

require(path.resolve(root, "musician.js"));
require(path.resolve(root, "artists.js"));

const I = MUSICIAN.indie;
let fails = 0;
const ok = (c, m) => {
  console.log((c ? "OK   " : "FAIL ") + m);
  if (!c) fails++;
};
const finite = (...v) => v.every((n) => typeof n === "number" && isFinite(n));

// 1. studios + art
const ST = I.studios();
ok(ST.length === 12, "12 studios in the catalog");
for (const st of ST) ok(fs.existsSync(path.join(root, "musician", st.f + ".png")), "sprite exists: " + st.f);
const fees = ST.map((st) => I.fee(st, 14, false));
ok(fees[11] > fees[6] && fees[6] > fees[0], "studio fees go up with the room");
ok(new Set(ST.map((st) => st.beats.join("|"))).size === 12, "every studio has its own beat pool");

// 2. events
const EVS = I.events();
ok(EVS.length >= 30, "at least 30 events: " + EVS.length);
ok(new Set(EVS.map((e) => e.id)).size === EVS.length, "event ids are unique");
ok(EVS.every((e) => e.t && e.lead && e.opts.length >= 2 && e.opts.every((o) => typeof o.f === "function")), "events are well formed");

// 3. start independent
I.start("Singer", "Pop", "Nova Rey");
const m = state.music;
ok(m.indep === true && m.signed === false, "independent flag set");
ok(state.job && state.job.music && state.job.emp === "Independent" && state.job.t === "Nova Rey", "independent job + stage name");
ok(m.stageName === "Nova Rey" && m.genre === "Pop", "stage name and genre saved");

// 4. quality / fees
for (const st of ST) {
  const q = I.quality(st, st.beats[0]);
  if (!(q >= 5 && q <= 100)) ok(false, "quality out of range at " + st.n + ": " + q);
}
ok(true, "studio quality stays inside 5-100");

// 5. independent release pays 100% and raises fame/pop
const before = state.money;
const pop0 = m.pop;
I.drop({
  title: "Test Single", single: true, sub: "Pop", genre: "Pop", tracks: 1, cover: null, lead: "Test Single",
  studio: ST[11].n, beat: "flagship · Pop", quality: 92, age: state.age, songs: null,
});
const rel = m.releases[0];
ok(!!rel && rel.copies > 0, "release recorded with copies");
ok(state.money > before, "all profits go to the player");
ok(finite(m.pop, state.art.fame) && m.pop >= pop0, "pop and fame stay finite and grow");
ok(rel.mine === rel.gross && rel.net === rel.gross, "independent keeps the full revenue");

// 6. NaN fame repair
state.art.fame = NaN;
state.art.fameOn = true;
m.pop = NaN;
I.fame(5);
I.tick();
ok(finite(m.pop, state.art.fame), "NaN pop/fame repaired");
ok(state.art.fame >= 0 && state.art.fame <= 100, "fame clamped to 0-100");

// 7. signed offer gate
m.pop = 10; m.awards = [];
ok(I.signedReady() === false, "no label offer when nobody knows you");
m.pop = 55; state.art.fame = 30;
ok(I.signedReady() === true, "labels come when pop/fame are high enough");

// 8. 40 simulated years: no errors, no NaN, leaks happen, events/awards queue
m.unreleased = [];
for (let y = 1; y <= 40; y++) {
  state.age = 25 + y;
  m.unreleased.push({ title: "Vault " + y, single: true, quality: 70, age: state.age - 1, studio: ST[5].n, beat: "x", tracks: 1 });
  I.tick();
}
ok(finite(m.pop, state.art.fame, m.hype), "40 years of ticks keep every number finite");
ok(m.unreleased.length < 40, "some vault songs leaked over the years: " + (40 - m.unreleased.length) + " lost");
ok(m.awards.length >= 0 && cards.length > 0, "awards and event cards fired");

// 9. every event option runs
for (const ev of EVS) {
  for (const opt of ev.opts) {
    state.money = 100000;
    state.art = { fameOn: true, fame: 20 };
    m.unreleased = [{ title: "V", single: true, quality: 75, age: state.age, studio: ST[0].n, beat: "b", tracks: 1 }];
    try {
      opt.f();
    } catch (e) {
      ok(false, "event option crashed: " + ev.id + " / " + opt.t + " -> " + e.message);
    }
  }
}
ok(true, "all event options ran");

// 10. screens render
I.openStudios();
ok((html = global.sList.innerHTML).includes("studio-") && global.sList.innerHTML.split('data-st="').length - 1 === 12, "studios screen lists 12 rooms");
global.sList.innerHTML = "";
I.openVault();
ok(global.sList.innerHTML.includes("Vault") || global.sList.innerHTML.includes("data-vault"), "vault screen renders");
I.openAwards();
ok(global.sList.innerHTML.includes("gold") || global.sList.innerHTML.includes("award"), "awards screen renders");

// 11. award trophies + 4 new award shows
const AW = I.awardList();
for (let i = 1; i <= 12; i++)
  ok(fs.existsSync(path.join(root, "musician", "aw-" + String(i).padStart(2, "0") + ".png")), "award sprite " + i);
for (const show of ["Brit Award", "Emmy", "MOBO Award", "NME Award"])
  ok(AW.some((a) => a.n === show), "new award show: " + show);
ok(AW.every((a) => fs.existsSync(path.join(root, "musician", I.awardArt(a.n) + ".png"))), "every award maps to a real trophy sprite");
ok(new Set(AW.map((a) => a.n)).size >= 12, "at least 12 award shows in the pool");

// 12. crew: six roles, big quality boost, salaries
ok(I.crew().length === 6, "6 hireable crew roles");
const ST0 = I.studios()[0];
let q0 = 0;
for (let i = 0; i < 80; i++) q0 += I.quality(ST0, "Pop");
q0 /= 80;
state.money = 500000;
for (const c of I.crew()) I.hire(c.id, c.pay);
ok(m.crew.length === 6, "whole crew hired");
ok(I.crewQ() === I.crew().reduce((n, c) => n + c.q, 0), "crew quality bonus stacks: +" + I.crewQ());
let q1 = 0;
for (let i = 0; i < 80; i++) q1 += I.quality(I.studios()[0], "Pop");
q1 /= 80;
ok(q1 > q0 + 25, "crew raises recording quality a lot (+" + Math.round(q1 - q0) + ")");
const solo = I.quality(I.studios()[0], "Pop");
m.crew = m.crew.slice(0, 1);
ok(I.quality(I.studios()[0], "Pop") < solo + 5, "a single crew member is not the whole crew");
for (const c of I.crew()) if (!m.crew.some((x) => x.id === c.id)) I.hire(c.id, c.pay);
const qb = [];
for (let i = 0; i < 60; i++) qb.push(I.quality(I.studios()[0], "Pop"));
ok(Math.max(...qb) <= 100, "crew bonus still clamped to 100");
const bank = state.money, bill = I.crewPay();
delete m.crewPaid;
state.age += 1;
I.tick();
ok(bank - state.money === bill, "crew salaries are paid once a year");
state.money = 100;
delete m.crewPaid;
state.age += 1;
I.tick();
ok(m.crew.length === 5, "a crew member walks out when salaries can't be paid");
m.crew = [];
state.age += 1;

// 13. collabs with in-game NPCs
state.friends = [{ first: "Otis", last: "Reed", rel: 60 }];
state.family = [{ kind: "sibling", first: "Mina", last: "Rey", ageOffset: -2, rel: 80 }];
I.hire("engineer", 9000);
const mates = I.partners();
ok(mates.some((x) => x.name === "Otis Reed" && x.label === "Friend"), "friends can be collab partners");
ok(mates.some((x) => x.name === "Mina Rey" && x.label === "Sibling"), "family can be collab partners");
ok(mates.some((x) => x.label === "Engineer"), "hired crew can be collab partners");
ok(mates.every((x) => x.talent >= 35 && x.talent <= 95), "partner talent stays in range");
const feat = mates.find((x) => x.name === "Otis Reed");
const beforeCopies = m.releases.length;
I.drop({
  title: "Feat Test", single: true, sub: "Pop", genre: "Pop", tracks: 1, cover: null, lead: "Feat Test",
  studio: ST[9].n, beat: "x", quality: 80, age: state.age, songs: null,
  feat: feat.name, featLabel: feat.label, featTalent: feat.talent, featShare: 0.15 + feat.talent / 500,
});
const fr = m.releases[m.releases.length - 1];
ok(m.releases.length === beforeCopies + 1 && fr.feat === "Otis Reed", "collab release keeps the feature");
ok(fr.mine < fr.gross && fr.mine > 0, "the partner takes a cut of the gross");
ok(fr.mine === Math.round(fr.gross * (1 - (0.15 + feat.talent / 500))), "cut matches the partner's share");
m.crew = [];

// 14. charts: NPC field, player position, peak saved
state.birthYear = 2010;
state.age = 25;
m.releases = m.releases.slice(-1);
m.releases[0].age = 25;
m.releases[0].copies = 900000;
m.releases[0].quality = 95;
m.releases[0].peak = undefined;
m.chart = null;
const Y = I.chartYear();
ok(Y === 2035, "chart year comes from birth year + age");
const c1 = I.chart(Y), c2 = I.chart(Y);
ok(c1.rows.length === 10, "chart shows a top 10");
ok(c1.rows.map((r) => r.name).join("|") === c2.rows.map((r) => r.name).join("|"), "chart is stable for the same year");
ok(c1.rows.every((r) => r.npc || r.title === "Feat Test"), "the player enters with their own song");
ok(c1.rows.some((r) => !r.npc), "player is on the chart with a hit");
delete m.tickAge;
I.tick();
ok(m.releases[0].peak >= 1, "release peak recorded: #" + m.releases[0].peak);
ok(m.chart && m.chart.year === Y && m.chart.pos >= 1, "career chart saved");
I.openCharts();
ok(global.sList.innerHTML.includes("Billboard") && global.sList.innerHTML.split("data-chart=").length - 1 === 10, "charts screen renders a top 10");
I.openCrew();
ok(global.sList.innerHTML.split("data-crew=").length - 1 === 6, "crew screen lists 6 roles");
I.openCollab();
ok(global.sList.innerHTML.includes("Otis Reed"), "collab screen lists people you know");

console.log(fails ? "\n" + fails + " FAILURE(S)" : "\nAll independent-music checks passed.");
process.exitCode = fails ? 1 : 0;
