// node dev/golive_test.js — DOM/canvas falso mínimo; prueba el minijuego "Go Live" (golive.js).
"use strict";
const path = require("path");
const assert = require("assert");

const ctx = new Proxy({}, {
  get: (t, k) => (k in t ? t[k] : (...a) => { for (const v of a) if (typeof v === "number" && !isFinite(v)) throw new Error("NaN/Infinity en canvas " + String(k)); }),
  set: (t, k, v) => { t[k] = v; return true; }
});
function el(tag) {
  const e = {
    tagName: tag, style: { setProperty() {} }, children: [], listeners: {}, parentNode: null, width: 0, height: 0, textContent: "", className: "",
    addEventListener(t, f) { (this.listeners[t] = this.listeners[t] || []).push(f); },
    removeEventListener() {},
    appendChild(c) { this.children.push(c); c.parentNode = this; return c; },
    removeChild(c) { const i = this.children.indexOf(c); if (i < 0) throw new Error("removeChild: no es hijo"); this.children.splice(i, 1); c.parentNode = null; },
    getContext: () => ctx,
    fire(t) { (this.listeners[t] || []).slice().forEach((f) => f({ stopPropagation() {}, preventDefault() {} })); }
  };
  return e;
}
const body = el("body");
body.style.overflow = "auto";
let canceled = 0, rafs = 0;
Object.assign(global, {
  window: global, document: { body, createElement: el }, innerWidth: 430, innerHeight: 900,
  requestAnimationFrame: () => ++rafs, cancelAnimationFrame: () => { canceled++; },
  matchMedia: () => ({ matches: false })
});
require(path.join(__dirname, "..", "golive.js"));
const L = global.FL_LIVE;
assert(L && typeof L.start === "function" && typeof L.stop === "function" && Array.isArray(L.platforms) && L.platforms.length === 2);
L.platforms.forEach((p) => ["id", "name", "accent", "bg", "giftName", "giftIcon", "viewerMult", "toxicity", "likeLabel"].forEach((k) => assert(k in p, "plataforma sin " + k)));

const FIELDS = ["peak", "avgViewers", "newFollowers", "gifts", "hype", "rep", "heat", "rel"];
function valid(r, tag) {
  assert(r && typeof r === "object", tag + ": sin resultado");
  FIELDS.concat(["replies"]).forEach((k) => assert(typeof r[k] === "number" && isFinite(r[k]), tag + ": " + k + " no finito: " + r[k]));
  ["retaliation", "banned", "flashedGun", "locationSlip"].forEach((k) => assert(typeof r[k] === "boolean", tag + ": " + k + " no bool"));
  assert(r.peak >= 1 && r.avgViewers >= 0 && r.avgViewers <= r.peak, tag + ": viewers " + JSON.stringify(r));
  assert(r.newFollowers >= 0 && r.gifts >= 0 && r.replies >= 0, tag + ": negativos");
  assert(r.hype >= 0 && r.hype <= 100, tag + ": hype " + r.hype);
  assert(r.rep >= -10 && r.rep <= 14 && Number.isInteger(r.rep), tag + ": rep " + r.rep);
  assert(r.heat >= 0 && r.heat <= 40 && Number.isInteger(r.heat), tag + ": heat " + r.heat);
  assert(r.rel <= -5 && r.rel >= -40 && Number.isInteger(r.rel), tag + ": rel " + r.rel);
}
const clean = () => L._state() === null && body.children.length === 0 && body.style.overflow === "auto";
const GUN = { name: "Glock 19", illegal: true };
function opts(o) {
  const calls = [];
  const base = { platform: "tiktok", target: { name: "Rival Boys", short: "RVB", icon: "x" }, you: { name: "Zeke", handle: "zeke", followers: 5000, rank: 2, heat: 10, rep: 30 }, gun: GUN, hasRapper: true, duration: 5, onEnd: (r) => calls.push(r) };
  return { o: Object.assign(base, o || {}), calls };
}
function finishLive(calls, tag) {
  for (let i = 0; i < 400 && L._state() && L._state().phase === "live"; i++) L._step(1);
  const S = L._state();
  assert(S && S.phase === "summary", tag + ": no llegó al resumen");
  assert(calls.length === 0, tag + ": onEnd antes de Done");
  S.ui.done.fire("click"); S.ui.done.fire("click");
  assert(calls.length === 1, tag + ": onEnd " + calls.length + " veces");
  valid(calls[0], tag);
  assert(clean(), tag + ": no limpió");
  return calls[0];
}

// 1) 2 plataformas (TikTok, Instagram), partida normal ignorando todo
let n = 0;
L.platforms.forEach((p) => {
  const t = opts({ platform: p.id }); L.start(t.o);
  assert(body.children.length === 1 && body.style.overflow === "hidden");
  const S = L._state();
  assert(S.plat.id === p.id);
  const r = finishLive(t.calls, "ignorar " + p.id);
  assert(S.ignores === 5 && r.replies === 0 || S.banned, "ignorar todo: ignores=" + S.ignores);
  n++;
});

// 2) todos los eventos y TODAS sus opciones, con las 4 combinaciones gun/rapper, rotando plataforma
const ids = L._events();
assert(ids.length >= 16 && ids.length <= 60, "eventos: " + ids.length);
let combos = 0, labelsNoGun = [], seen = {};
[[GUN, true], [GUN, false], [null, true], [null, false]].forEach(([gun, rap], ci) => {
  ids.forEach((id, ei) => {
    const plat = L.platforms[(ci + ei) % L.platforms.length].id;
    let t = opts({ platform: plat, gun, hasRapper: rap }); L.start(t.o);
    L._step(3);
    const cnt = L._forceEvent(id, 99);
    assert(cnt >= 1 && cnt <= 4, id + ": opciones " + cnt);
    const ev = L._state().ev;
    assert(ev && ev.opts.length === cnt, id + ": sin panel");
    ev.opts.forEach((o) => {
      assert(!(o.tone === "flash" && !gun), "flash sin arma en " + id);
      assert(!(o.need === "rapper" && !rap), "opción de rapero sin rapero en " + id);
      if (!gun) labelsNoGun.push(o.label);
      seen[id + ":" + o.tone + ":" + rap] = 1;
    });
    L.stop();
    for (let k = -1; k < cnt; k++) {
      t = opts({ platform: plat, gun, hasRapper: rap }); L.start(t.o);
      L._step(2);
      L._forceEvent(id, 99);
      L._forceEvent(id, k);
      L._step(5);
      finishLive(t.calls, id + "#" + k);
      combos++;
    }
  });
});
assert(!labelsNoGun.some((l) => /strap|fierro|arma/i.test(l)), "Flash the strap sin arma");
assert(seen["rival_freestyle:dissr:true"] && !seen["rival_freestyle:dissr:false"], "opción de rapero en freestyle");
assert(seen["diss_challenge:dissr:true"] && !seen["diss_challenge:dissr:false"]);
{ // con arma sí aparece
  const t = opts({}); L.start(t.o); L._step(3); L._forceEvent("rival_enters", 99);
  assert(L._state().ev.opts.some((o) => o.tone === "flash"), "con arma debe salir Flash the strap");
  L.stop();
}

// 3) End live a mitad: resultado parcial, onEnd una vez
{
  const t = opts({ duration: 8 }); L.start(t.o);
  L._step(25);
  const S = L._state();
  assert(S.phase === "live");
  S.ui.end.fire("click");
  assert(S.phase === "summary" && t.calls.length === 0);
  S.ui.done.fire("click");
  assert(t.calls.length === 1); valid(t.calls[0], "end a mitad");
  assert(clean());
}


// 4b) los eventos y comentarios de cada plataforma no se mezclan: ig_* solo en instagram, tt_* solo en tiktok
{
  const seenEv = { tiktok: new Set(), instagram: new Set() };
  for (const p of L.platforms) {
    for (let n = 0; n < 60; n++) {
      const t = opts({ platform: p.id, gun: GUN, hasRapper: true, duration: 12, you: { followers: 5000, rank: 3 } });
      L.start(t.o);
      for (let i = 0; i < 400 && L._state() && L._state().phase === "live"; i++) {
        L._step(1);
        const st = L._state();
        if (st && st.ev && st.ev.def) { seenEv[p.id].add(st.ev.def.id); L._forceEvent(st.ev.def.id, -1); }
      }
      L.stop();
    }
  }
  const bad = [...seenEv.tiktok].filter((x) => x.indexOf("ig_") === 0).concat([...seenEv.instagram].filter((x) => x.indexOf("tt_") === 0));
  assert(!bad.length, "eventos en la plataforma equivocada: " + bad);
  assert([...seenEv.tiktok].some((x) => x.indexOf("tt_") === 0) && [...seenEv.instagram].some((x) => x.indexOf("ig_") === 0), "no salieron eventos propios de cada plataforma");
}

// 4) stop() limpia todo y no llama a onEnd
{
  const t = opts({}); const before = canceled;
  L.start(t.o); L._step(20);
  L.stop();
  assert(clean() && canceled > before && t.calls.length === 0, "stop() no limpió");
  L.stop();
  L.start(t.o); L.start(t.o);
  assert(body.children.length === 1, "doble start dejó overlays");
  L.stop(); assert(clean());
}

// 5) fuzz: muchas partidas con respuestas al azar (incluye bans) siempre dan resultado válido
let bans = 0, rets = 0, N = 300;
for (let g = 0; g < N; g++) {
  const t = opts({ platform: L.platforms[g % L.platforms.length].id, gun: g % 3 ? GUN : null, hasRapper: g % 2 === 0, duration: 1 + (g % 8), you: { followers: g * 300, rank: g % 6 } });
  L.start(t.o);
  for (let i = 0; i < 4000 && L._state() && L._state().phase === "live"; i++) {
    L._step(0.5);
    const S = L._state();
    if (S && S.ev && Math.random() < 0.3) { const k = (Math.random() * S.ev.opts.length) | 0; S.ui.slot.children[0] && S.ev.node.children[1].children[k].fire("click"); }
  }
  const r = finishLive(t.calls, "fuzz " + g);
  if (r.banned) bans++;
  if (r.retaliation) rets++;
}
console.log("OK: plataformas=5 eventos=" + ids.length + " combinaciones evento/opcion=" + combos + " fuzz=" + N + " (bans=" + bans + ", retaliation=" + rets + ")");
