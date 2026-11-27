// node dev/shooter_test.js — DOM/canvas falso mínimo, simula frames del minijuego de disparos (2.5D + aliados).
"use strict";
const path = require("path");
const assert = require("assert");

const draws = {};
const ctx = new Proxy({}, {
  get: (t, k) => {
    if (k in t) return t[k];
    if (k === "measureText") return () => ({ width: 0 });
    return (...a) => {
      draws[k] = (draws[k] || 0) + 1;
      for (const v of a) if (typeof v === "number" && !isFinite(v)) throw new Error("NaN/Infinity en " + String(k));
    };
  },
  set: (t, k, v) => { t[k] = v; return true; }
});
function el(tag) {
  return {
    tagName: tag, style: {}, children: [], listeners: {}, parentNode: null, width: 0, height: 0,
    addEventListener(t, f) { (this.listeners[t] = this.listeners[t] || []).push(f); },
    removeEventListener(t, f) { const a = this.listeners[t] || []; const i = a.indexOf(f); if (i >= 0) a.splice(i, 1); },
    appendChild(c) { this.children.push(c); c.parentNode = this; return c; },
    removeChild(c) { this.children.splice(this.children.indexOf(c), 1); c.parentNode = null; },
    getContext: () => ctx, setPointerCapture() {},
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 360, height: 640 }),
    fire(t, ev) { (this.listeners[t] || []).slice().forEach((f) => f(Object.assign({ stopPropagation() {}, preventDefault() {} }, ev))); }
  };
}
const body = el("body");
body.style.overflow = "auto";
const winL = {};
let canceled = 0;
Object.assign(global, {
  window: global,
  document: { body, createElement: el },
  innerWidth: 430, innerHeight: 900,
  addEventListener(t, f) { (winL[t] = winL[t] || []).push(f); },
  removeEventListener(t, f) { const a = winL[t] || []; const i = a.indexOf(f); if (i >= 0) a.splice(i, 1); },
  requestAnimationFrame: () => 1,
  cancelAnimationFrame: () => { canceled++; },
  matchMedia: () => ({ matches: false })
});
const listenerCount = () => Object.keys(winL).reduce((n, k) => n + winL[k].length, 0);
const clean = () => S._state() === null && body.children.length === 0 && body.style.overflow === "auto" && listenerCount() === 0;
const total = (st) => st.roster.reduce((n, w) => n + w.length, 0);

require(path.join(__dirname, "..", "minigame-shooter.js"));
const S = global.FL_SHOOTER;
assert(S && typeof S.play === "function" && typeof S.stop === "function");

// 1) defaults: 3-4 enemigos, 1 oleada, sin boss, 2 aliados; mezcla de tipos
for (let i = 0; i < 40; i++) {
  S.play({ power: 0.06 });
  const st = S._state(), all = [].concat(...st.roster);
  assert(all.length === 3 || all.length === 4, "3-4 enemigos: " + all.length);
  assert(st.opts.waves === 1 && all.indexOf("boss") < 0 && st.allies.length === 2);
  assert(all.indexOf("shooter") >= 0 && all.filter((t) => t === "heavy").length <= 1, all.join(","));
  S.stop();
}
S.play({ enemies: 99, waves: 9, boss: true, allies: 9, allyNames: ["Pana", "Yeyo"] });
{
  const st = S._state();
  assert(total(st) === 6 && st.opts.waves === 2 && st.roster[1].indexOf("boss") >= 0 && st.allies.length === 3);
  assert(st.allies[0].name === "Pana" && st.allies[1].name === "Yeyo" && st.allies[2].name === "Mo");
  assert(st.roster[0].length === 3, "mitad por oleada");
  S.stop();
}
S.play({ allies: 0 }); assert(S._state().allies.length === 0); S.stop();
console.log("ok defaults/clamps");

// 2) aliados siguen y disparan
{
  S.play({ enemies: 1, power: 0.06, map: "warehouse", allies: 2 });
  const st = S._state();
  st.enemies.forEach((e) => { e.x = 95; e.y = 200; e.fireCd = 99; e.hp = e.max = 9999; e.spd = 0; e.def = Object.assign({}, e.def, { melee: 0 }); });
  st.p.x = 125; st.p.y = 285; // jugador se mueve: aliados deben seguir
  const before = st.bullets.length;
  let allyShots = 0;
  for (let i = 0; i < 180; i++) { S._step(1 / 60); allyShots += st.bullets.filter((b) => b.ally).length; }
  st.allies.forEach((a) => assert(Math.hypot(a.x - st.p.x, a.y - st.p.y) < 30, "aliado sigue: " + Math.round(Math.hypot(a.x - st.p.x, a.y - st.p.y))));
  assert(allyShots > 0 && st.enemies[0].hp < 9999, "aliados disparan " + before);
  assert(st.shots === 0, "tiros de aliados no cuentan como tuyos");
  S.stop();
  console.log("ok aliados siguen/disparan");
}

// 3) aliados mueren, tú sigues y ganas; resultado trae alliesAlive/alliesTotal
["street", "warehouse", "park"].forEach((map) => {
  const calls = [];
  S.play({ enemies: 4, waves: 2, power: 0.34, gunName: "AK", map, allies: 2, onEnd: (r) => calls.push(r) });
  const st = S._state();
  for (let i = 0; i < 120; i++) S._step(1 / 60);
  st.allies[0].hp = 1;
  st.bullets.push({ x: st.allies[0].x, y: st.allies[0].y, vx: 1, vy: 0, dmg: 50, mine: false, life: 1 });
  S._step(1 / 60);
  assert(st.allies[0].dead, "aliado muere");
  // matar enemigos por la vía normal de balas
  st.enemies.forEach((x) => { x.x = st.p.x; x.y = st.p.y - 20; x.hp = 3; x.fireCd = 99; });
  st.p.ang = -Math.PI / 2; st.w.spread = 0; st.p.dashT = 1; st.keys.f = true;
  for (let i = 0; i < 20; i++) S._step(1 / 60);
  st.keys.f = false;
  assert(st.kills >= 1, "kills por balas");
  let guard = 0;
  while (st.phase === "play" && guard++ < 20000) {
    st.enemies.forEach((x) => st.bullets.push({ x: x.x, y: x.y, vx: 1, vy: 0, dmg: 999, mine: true, life: 1 }));
    st.p.hp = 100; if (!st.allies[1].dead) st.allies[1].hp = 60;
    S._step(1 / 60);
  }
  assert.strictEqual(st.result.win, true, map);
  for (let i = 0; i < 30; i++) S._step(1 / 60); // render de pantalla final
  st.ui.close.fire("pointerdown", {}); st.ui.close.fire("pointerdown", {});
  S.stop();
  assert(calls.length === 1 && calls[0].win && calls[0].alliesTotal === 2 && calls[0].alliesAlive === 1 && calls[0].kills === 4, JSON.stringify(calls));
  assert(clean(), "limpieza");
  console.log("ok win " + map, JSON.stringify(calls[0]));
});

// 4) perder solo si mueres tú
{
  const calls = [];
  S.play({ enemies: 5, power: 0, map: "street", allies: 3, onEnd: (r) => calls.push(r) });
  const st = S._state();
  st.allies.forEach((a) => { a.hp = 1; st.bullets.push({ x: a.x, y: a.y, vx: 1, vy: 0, dmg: 50, mine: false, life: 1 }); });
  S._step(1 / 60);
  assert(st.allies.every((a) => a.dead) && st.phase === "play", "aliados muertos no es derrota");
  let guard = 0;
  while (st.phase === "play" && guard++ < 60 * 300) { st.keys.f = true; if (guard > 600) st.p.hp = Math.min(st.p.hp, 5); S._step(1 / 60); }
  if (st.phase === "play") { st.p.dashT = 0; st.p.hp = 1; hurtBullet(st); S._step(1 / 60); }
  assert.strictEqual(st.result.win, false);
  assert.strictEqual(st.result.hpLeft, 0);
  st.ui.close.fire("pointerdown", {});
  assert(calls.length === 1 && calls[0].alliesAlive === 0 && calls[0].alliesTotal === 3);
  console.log("ok lose", JSON.stringify(calls[0]));
}
function hurtBullet(st) { st.bullets.push({ x: st.p.x, y: st.p.y, vx: 1, vy: 0, dmg: 50, mine: false, life: 1 }); }

// 5) rendirse = win:false; stop() limpia sin callback; touch
{
  const calls = [];
  S.play({ enemies: 3, power: 0.06, onEnd: (r) => calls.push(r) });
  S._step(0.5);
  S._state().ui.exit.fire("pointerdown", {});
  assert(calls.length === 1 && calls[0].win === false && "alliesAlive" in calls[0] && S._state() === null);
  S.play({ enemies: 3, onEnd: (r) => calls.push(r) });
  const ov = S._state().overlay;
  ov.fire("pointerdown", { pointerId: 1, pointerType: "touch", clientX: 50, clientY: 500 });
  ov.fire("pointermove", { pointerId: 1, pointerType: "touch", clientX: 80, clientY: 500 });
  ov.fire("pointerdown", { pointerId: 2, pointerType: "touch", clientX: 300, clientY: 400 });
  ov.fire("pointermove", { pointerId: 3, pointerType: "mouse", clientX: 200, clientY: 200 });
  S._step(1);
  S.stop();
  assert(calls.length === 1 && clean());
  console.log("ok give up + stop() + input");
}

// 6) render 2.5D: corre mucho rato en los 3 mapas con todo activo y registra dibujo
{
  ["street", "warehouse", "park"].forEach((map) => {
    S.play({ enemies: 5, waves: 2, boss: true, power: 0.2, map, allies: 3 });
    const st = S._state();
    st.keys.f = true;
    for (let i = 0; i < 600; i++) { st.p.hp = 100; S._step(1 / 60); }
    assert(st.rows && st.rows.length > 0, "filas cacheadas");
    S.stop();
  });
  assert(draws.fillRect > 10000 && draws.drawImage > 1000 && draws.fillText > 100, JSON.stringify(draws));
  console.log("ok render 2.5D", JSON.stringify({ fillRect: draws.fillRect, drawImage: draws.drawImage, fillText: draws.fillText }));
}

// 7) power desde FL_ARMS
{
  global.FL_ARMS = { power: () => 0.34, carried: () => ({ name: "Draco" }) };
  S.play({}); const hi = S._state().w; S.stop();
  S.play({ power: 0.06 }); const lo = S._state().w; S.stop();
  assert(hi.name === "Draco" && hi.dmg > lo.dmg * 2 && hi.cd < lo.cd / 2 && hi.spread < lo.spread / 3);
  console.log("ok power");
}
assert(canceled >= 5 && clean());
console.log("ALL OK");
