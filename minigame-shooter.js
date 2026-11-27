/* Minijuego de disparos 2.5D pixel art (lógica 2D top-down, render oblicuo). Sin assets: todo se dibuja por código.
 * window.FL_SHOOTER.play({ enemies, waves, map: "street"|"warehouse"|"park", power, gunName, allies, allyNames, boss, onEnd(result) }) / stop().
 * Textos: T("english", "español", "português"). */
(function () {
  "use strict";
  const T = (en) => en;
  const W = 180, H = 320, TS = 10, GW = 18, GH = 32, DT = 1 / 60;
  const KY = 0.85, OY = 26;
  const SY = (y) => Math.round(y * KY + OY);
  const BLOCK_H = { 1: 12, 2: 6, 3: 5, 4: 11 };
  let G = null;

  const rnd = (a, b) => a + Math.random() * (b - a);
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const hash = (x, y) => { let h = (x * 374761393 + y * 668265263) | 0; h = (h ^ (h >>> 13)) * 1274126177; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };

  const TYPES = {
    rusher: { hp: 40, spd: 38, r: 3, melee: 10, mcd: 0.8, col: "#d23b3b", dark: "#7a1c1c" },
    shooter: { hp: 34, spd: 24, r: 3, gun: true, col: "#9b4dd6", dark: "#4f2373" },
    heavy: { hp: 120, spd: 15, r: 5, melee: 18, mcd: 1.2, col: "#7a6a3a", dark: "#3d351b" },
    boss: { hp: 300, spd: 19, r: 7, melee: 22, mcd: 1, gun: true, boss: true, col: "#2a2a2a", dark: "#111" }
  };
  const ALLY_COLS = [["#3fbf6a", "#1f5f35"], ["#3ab0c9", "#1b5866"], ["#8fd14a", "#466a22"]];

  // ---------- mapa ----------
  function buildMap(kind) {
    const g = new Array(GW * GH).fill(0), hp = new Array(GW * GH).fill(0);
    const set = (x, y, v) => { if (x >= 0 && y >= 0 && x < GW && y < GH) { g[y * GW + x] = v; hp[y * GW + x] = v === 2 ? 40 : 0; } };
    const rect = (x, y, w, h, v) => { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) set(x + i, y + j, v); };
    if (kind === "warehouse") {
      rect(3, 6, 5, 1, 3); rect(10, 6, 5, 1, 3); rect(3, 12, 1, 5, 3); rect(14, 12, 1, 5, 3);
      rect(7, 16, 4, 1, 3); rect(4, 22, 4, 1, 3); rect(11, 22, 4, 1, 3); set(8, 10, 1); set(9, 10, 1);
    } else if (kind === "park") {
      [[4, 5], [13, 5], [8, 8], [3, 13], [14, 14], [9, 18], [5, 20], [12, 23], [2, 26], [15, 27]].forEach((t) => set(t[0], t[1], 4));
      rect(6, 13, 3, 1, 3); rect(10, 9, 3, 2, 5); rect(11, 11, 2, 1, 5);
    } else {
      rect(0, 0, 3, GH, 1); rect(15, 0, 3, GH, 1);
      rect(1, 10, 2, 2, 0); rect(1, 21, 2, 2, 0); rect(15, 14, 2, 2, 0); rect(15, 25, 2, 2, 0);
      rect(6, 7, 2, 3, 3); rect(10, 15, 2, 3, 3); rect(5, 21, 2, 3, 3); rect(12, 4, 2, 1, 3);
    }
    rect(0, 0, GW, 1, 1); rect(0, GH - 1, GW, 1, 1); rect(0, 0, 1, GH, 1); rect(GW - 1, 0, 1, GH, 1);
    let n = 0, tries = 0;
    while (n < 7 && tries++ < 300) {
      const x = 2 + ((Math.random() * (GW - 4)) | 0), y = 3 + ((Math.random() * (GH - 9)) | 0);
      if (g[y * GW + x] === 0) { set(x, y, 2); n++; }
    }
    rect(7, 25, 4, 5, 0);
    return { g, hp, kind };
  }
  const cellAt = (px, py) => {
    const cx = Math.floor(px / TS), cy = Math.floor(py / TS);
    if (cx < 0 || cy < 0 || cx >= GW || cy >= GH) return 1;
    return G.map.g[cy * GW + cx];
  };
  const blocksMove = (px, py) => cellAt(px, py) !== 0;
  const blocksShot = (px, py) => { const v = cellAt(px, py); return v !== 0 && v !== 5; };
  function los(ax, ay, bx, by) {
    const d = Math.hypot(bx - ax, by - ay), n = Math.ceil(d / 3);
    for (let i = 1; i < n; i++) { const t = i / n; if (blocksShot(ax + (bx - ax) * t, ay + (by - ay) * t)) return false; }
    return true;
  }
  function moveCircle(o, dx, dy) {
    const r = o.r;
    const hit = (x, y) => blocksMove(x - r, y - r) || blocksMove(x + r, y - r) || blocksMove(x - r, y + r) || blocksMove(x + r, y + r);
    if (!hit(o.x + dx, o.y)) o.x += dx;
    if (!hit(o.x, o.y + dy)) o.y += dy;
  }

  // ---------- flow field (BFS desde el jugador) ----------
  function flow() {
    const d = G.flow, g = G.map.g;
    d.fill(9999);
    const sx = clamp(Math.floor(G.p.x / TS), 0, GW - 1), sy = clamp(Math.floor(G.p.y / TS), 0, GH - 1);
    const q = [sy * GW + sx]; d[q[0]] = 0;
    for (let qi = 0; qi < q.length; qi++) {
      const c = q[qi], cx = c % GW, cy = (c / GW) | 0;
      for (let oy = -1; oy <= 1; oy++) for (let ox = -1; ox <= 1; ox++) {
        if (!ox && !oy) continue;
        const nx = cx + ox, ny = cy + oy;
        if (nx < 0 || ny < 0 || nx >= GW || ny >= GH) continue;
        const ni = ny * GW + nx;
        if (g[ni] !== 0 || d[ni] <= d[c] + 1) continue;
        if (ox && oy && (g[cy * GW + nx] !== 0 || g[ny * GW + cx] !== 0)) continue;
        d[ni] = d[c] + 1; q.push(ni);
      }
    }
    G.flowCell = sy * GW + sx;
  }
  function flowDir(e) {
    const cx = Math.floor(e.x / TS), cy = Math.floor(e.y / TS), d = G.flow;
    let best = d[cy * GW + cx] !== undefined ? d[cy * GW + cx] : 9999, bx = 0, by = 0, found = false;
    for (let oy = -1; oy <= 1; oy++) for (let ox = -1; ox <= 1; ox++) {
      const nx = cx + ox, ny = cy + oy;
      if (nx < 0 || ny < 0 || nx >= GW || ny >= GH) continue;
      const v = d[ny * GW + nx];
      if (v < best) { best = v; bx = nx; by = ny; found = true; }
    }
    if (!found) return norm(G.p.x - e.x, G.p.y - e.y);
    return norm(bx * TS + 5 - e.x, by * TS + 5 - e.y);
  }
  function norm(x, y) { const l = Math.hypot(x, y) || 1; return { x: x / l, y: y / l }; }

  // ---------- armas ----------
  function makeWeapon(power, name) {
    if (!(power > 0)) return { fists: true, name: T("Fists", "Puños", "Punhos"), dmg: 5, cd: 0.42, range: 12, mag: 0 };
    const k = clamp(power / 0.34, 0, 1);
    return {
      fists: false, name: name || T("Gun", "Arma", "Arma"),
      dmg: 8 + 22 * k, cd: 0.32 - 0.22 * k, spread: 0.22 - 0.18 * k,
      mag: 12 + Math.round(18 * k), reload: 1.6 - 0.8 * k, speed: 300
    };
  }

  // ---------- sonido ----------
  function beep(f, d, type, vol) {
    const a = G && G.audio; if (!a) return;
    try {
      const o = a.createOscillator(), gn = a.createGain();
      o.type = type || "square"; o.frequency.value = f;
      gn.gain.value = vol || 0.03; gn.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + d);
      o.connect(gn); gn.connect(a.destination); o.start(); o.stop(a.currentTime + d);
    } catch (e) { /* sin audio */ }
  }
  function ensureAudio() {
    if (!G || G.audio) return;
    try { const AC = window.AudioContext || window.webkitAudioContext; if (AC) G.audio = new AC(); } catch (e) { G.audio = null; }
  }
  function sfx(name) { try { if (typeof window.play === "function") window.play(name); } catch (e) { /* opcional */ } }

  // ---------- entidades ----------
  function spawnEnemy(type) {
    const def = TYPES[type], p = G.p, free = G.free;
    let c = null;
    for (let i = 0; i < 40; i++) {
      const cand = free[(Math.random() * free.length) | 0];
      if (Math.hypot(cand.x - p.x, cand.y - p.y) > 100) { c = cand; break; }
    }
    if (!c) c = free[0];
    const m = 1 + 0.15 * (G.wave - 1);
    G.enemies.push({
      type, def, x: c.x, y: c.y, r: def.r, hp: def.hp * m, max: def.hp * m, spd: def.spd * (1 + 0.05 * (G.wave - 1)),
      flash: 0, meleeCd: 0.5, aimT: 0, fireCd: rnd(0.8, 1.8), coverT: 0, cover: null, ang: 0, strafe: Math.random() < 0.5 ? 1 : -1, walk: 0,
      tgt: null, tgtT: 0
    });
  }
  function buildRoster() {
    const n = G.opts.enemies, list = ["shooter"];
    let heavy = false;
    while (list.length < n) {
      if (!heavy && Math.random() < 0.25) { list.push("heavy"); heavy = true; } else list.push(Math.random() < 0.5 ? "rusher" : "shooter");
    }
    for (let i = list.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; const t = list[i]; list[i] = list[j]; list[j] = t; }
    const per = Math.ceil(n / G.opts.waves), waves = [];
    for (let w = 0; w < G.opts.waves; w++) waves.push(list.slice(w * per, (w + 1) * per));
    if (G.opts.boss) waves[waves.length - 1].push("boss");
    return waves;
  }
  function startWave(w) {
    G.wave = w;
    G.queue = (G.roster[w - 1] || []).slice();
    G.maxAlive = 8;
    while (G.queue.length && G.enemies.length < G.maxAlive) spawnEnemy(G.queue.shift());
    G.spawnT = 0.6;
    G.banner = { txt: w === G.opts.waves && w > 1 ? T("FINAL WAVE", "OLEADA FINAL", "ONDA FINAL") : T("WAVE", "OLEADA", "ONDA") + " " + w, t: 1.6 };
  }
  function particles(x, y, n, col, spd, life, ground, size) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, s = rnd(0.3, 1) * spd;
      G.parts.push({ x, y, z: ground ? rnd(2, 6) : 4, vz: ground ? rnd(20, 70) : 0, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: rnd(0.5, 1) * life, col, ground, size: size || 1 });
    }
  }
  function blood(x, y, dx, dy, n) {
    for (let i = 0; i < n; i++) {
      const s = rnd(15, 60);
      G.parts.push({ x, y, z: 5, vz: rnd(10, 50), vx: dx * s + rnd(-20, 20), vy: dy * s + rnd(-20, 20), life: rnd(0.35, 0.7), col: Math.random() < 0.5 ? "#a3121b" : "#6e0b11", ground: true, size: 1 });
    }
  }
  function addText(x, y, txt, col) { G.texts.push({ x, y, z: 10, txt, col, life: 0.7 }); }

  function damageEnemy(e, dmg, dx, dy) {
    if (e.dead) return;
    dmg = Math.round(dmg);
    e.hp -= dmg; e.flash = 0.1;
    moveCircle(e, (dx || 0) * (e.def.boss ? 0.5 : 2), (dy || 0) * (e.def.boss ? 0.5 : 2));
    addText(e.x, e.y - e.r, String(dmg), "#fff");
    blood(e.x, e.y, dx || 0, dy || 0, 4);
    beep(140, 0.05, "square", 0.025);
    if (e.hp <= 0) {
      e.dead = true; G.kills++;
      blood(e.x, e.y, 0, 0, e.def.boss ? 40 : 14);
      G.decals.push({ x: e.x, y: e.y, r: e.r + 1, col: "#5a0a10" });
      if (G.decals.length > 120) G.decals.shift();
      G.streak = G.streakT > 0 ? G.streak + 1 : 1; G.streakT = 2.5;
      if (G.streak >= 2) {
        const names = [T("DOUBLE KILL", "DOBLE KILL", "KILL DUPLO"), T("TRIPLE KILL", "TRIPLE KILL", "KILL TRIPLO"), T("RAMPAGE", "MASACRE", "MASSACRE")];
        G.streakTxt = { txt: names[Math.min(G.streak - 2, 2)] + " x" + G.streak, t: 1.2 };
      }
      if (Math.random() < (e.def.boss ? 1 : 0.15)) G.pickups.push({ x: e.x, y: e.y, t: 0 });
      beep(80, 0.15, "sawtooth", 0.04);
    }
  }
  function hurtPlayer(d, sx, sy) {
    const p = G.p;
    if (p.dashT > 0 || G.phase !== "play") return;
    d = Math.round(d);
    p.hp = Math.max(0, p.hp - d); p.flash = 0.15;
    if (!G.reduced) G.shake = 0.2;
    addText(p.x, p.y - 4, "-" + d, "#ff5050");
    const n = norm(p.x - sx, p.y - sy);
    blood(p.x, p.y, n.x, n.y, 5);
    beep(90, 0.08, "triangle", 0.05);
    if (p.hp <= 0) endGame(false);
  }
  function hurtAlly(a, d, sx, sy) {
    if (a.dead || G.phase !== "play") return;
    d = Math.round(d);
    a.hp = Math.max(0, a.hp - d); a.flash = 0.12;
    addText(a.x, a.y - 4, "-" + d, "#ffb050");
    const n = norm(a.x - sx, a.y - sy);
    blood(a.x, a.y, n.x, n.y, 4);
    if (a.hp <= 0) {
      a.dead = true;
      blood(a.x, a.y, 0, 0, 12);
      G.decals.push({ x: a.x, y: a.y, r: a.r + 1, col: "#5a0a10" });
      G.banner = { txt: a.name + " " + T("DOWN", "CAYÓ", "CAIU"), t: 1.2 };
      beep(70, 0.3, "sawtooth", 0.04);
    }
  }
  function hurtTarget(t, d, sx, sy) { if (t === G.p) hurtPlayer(d, sx, sy); else hurtAlly(t, d, sx, sy); }

  function damageCell(px, py, dmg) {
    const cx = Math.floor(px / TS), cy = Math.floor(py / TS), i = cy * GW + cx, m = G.map;
    if (m.g[i] !== 2) { particles(px, py, 2, "#bbb", 30, 0.2); return; }
    m.hp[i] -= dmg;
    particles(px, py, 3, "#b07a3c", 40, 0.4, true);
    if (m.hp[i] <= 0) {
      m.g[i] = 0;
      particles(cx * TS + 5, cy * TS + 5, 16, "#8a5a28", 50, 0.9, true, 2);
      particles(cx * TS + 5, cy * TS + 5, 8, "#c48c4a", 35, 0.7, true, 1);
      if (Math.random() < 0.5) G.pickups.push({ x: cx * TS + 5, y: cy * TS + 5, t: 0 });
      G.flowT = 0;
    }
  }

  // ---------- jugador ----------
  function playerShoot() {
    const p = G.p, w = G.w;
    G.shots++;
    const ax = Math.cos(p.ang), ay = Math.sin(p.ang);
    if (w.fists) {
      p.cd = w.cd; p.swing = 0.12;
      G.enemies.forEach((e) => {
        const dx = e.x - p.x, dy = e.y - p.y, d = Math.hypot(dx, dy);
        if (d < w.range + e.r && (dx * ax + dy * ay) / (d || 1) > 0.4) damageEnemy(e, w.dmg, ax, ay);
      });
      beep(300, 0.03, "triangle", 0.02);
      return;
    }
    if (p.reload > 0) return;
    if (p.ammo <= 0) { startReload(); return; }
    p.ammo--; p.cd = w.cd; p.flashT = 0.05;
    const a = p.ang + rnd(-w.spread, w.spread);
    G.bullets.push({ x: p.x + ax * 6, y: p.y + ay * 6, vx: Math.cos(a) * w.speed, vy: Math.sin(a) * w.speed, dmg: w.dmg * rnd(0.9, 1.1), mine: true, life: 1 });
    G.parts.push({ x: p.x, y: p.y, z: 5, vz: rnd(40, 60), vx: -ay * rnd(20, 40) + rnd(-8, 8), vy: ax * rnd(20, 40) + rnd(-8, 8), life: 0.8, col: "#e8c34a", shell: true, ground: true, size: 1 });
    beep(520 - G.w.dmg * 6, 0.04, "square", 0.025);
    if (p.ammo <= 0) startReload();
  }
  function startReload() {
    const p = G.p;
    if (G.w.fists || p.reload > 0 || p.ammo >= G.w.mag) return;
    p.reload = G.w.reload; beep(660, 0.05, "square", 0.02);
  }
  function startDash() {
    const p = G.p;
    if (p.dashCd > 0 || G.phase !== "play") return;
    const mv = moveInput();
    const d = mv.x || mv.y ? norm(mv.x, mv.y) : { x: Math.cos(p.ang), y: Math.sin(p.ang) };
    p.dashT = 0.18; p.dashCd = 1.2; p.dashDir = d;
    particles(p.x, p.y, 6, "#9fd8ff", 30, 0.3);
  }
  function moveInput() {
    const k = G.keys;
    let x = 0, y = 0;
    if (k.a || k.arrowleft) x -= 1; if (k.d || k.arrowright) x += 1;
    if (k.w || k.arrowup) y -= 1; if (k.s || k.arrowdown) y += 1;
    Object.keys(G.ptrs).forEach((id) => {
      const q = G.ptrs[id];
      if (q.kind !== "move") return;
      const dx = q.x - q.ox, dy = (q.y - q.oy) / KY, d = Math.hypot(dx, dy);
      if (d > 3) { const m = Math.min(1, d / 18); x += dx / d * m; y += dy / d * m; }
    });
    const l = Math.hypot(x, y);
    return l > 1 ? { x: x / l, y: y / l } : { x, y };
  }
  function nearestVisible(from, range) {
    let best = null, bd = range || 1e9;
    G.enemies.forEach((e) => {
      if (e.dead) return;
      const d = Math.hypot(e.x - from.x, e.y - from.y);
      if (d < bd && los(from.x, from.y, e.x, e.y)) { bd = d; best = e; }
    });
    return best;
  }

  // ---------- aliados ----------
  const SLOTS = [[-13, 9], [13, 9], [0, 16]];
  function updateAlly(a, i, dt) {
    const p = G.p;
    a.flash = Math.max(0, a.flash - dt); a.flashT = Math.max(0, a.flashT - dt);
    a.cd -= dt; a.coverT -= dt;
    const tgt = nearestVisible(a, 150);
    const low = a.hp < a.max * 0.35;
    let mv = { x: 0, y: 0 }, spd = 46;
    if (low && tgt) {
      if (!a.cover || a.coverT <= 0) { a.cover = findCover(a, tgt); a.coverT = 1.5; }
    } else a.cover = null;
    if (a.cover) {
      if (Math.hypot(a.cover.x - a.x, a.cover.y - a.y) > 2) mv = norm(a.cover.x - a.x, a.cover.y - a.y);
    } else {
      const s = SLOTS[i % SLOTS.length], sx = p.x + s[0], sy = p.y + s[1], d = Math.hypot(sx - a.x, sy - a.y);
      if (d > 6) {
        mv = d < 45 && los(a.x, a.y, sx, sy) ? norm(sx - a.x, sy - a.y) : flowDir(a);
        if (d > 40) spd = 62;
      }
    }
    const pd = Math.hypot(a.x - p.x, a.y - p.y);
    if (pd < a.r + p.r + 3) { const n = norm(a.x - p.x, a.y - p.y); mv = { x: mv.x + n.x, y: mv.y + n.y }; }
    const ox = a.x, oy = a.y;
    moveCircle(a, mv.x * spd * dt, mv.y * spd * dt);
    a.walk += Math.hypot(a.x - ox, a.y - oy);
    if (tgt) {
      a.ang = Math.atan2(tgt.y - a.y, tgt.x - a.x);
      if (a.cd <= 0) {
        a.cd = rnd(0.6, 0.9);
        const an = a.ang + rnd(-0.15, 0.15);
        G.bullets.push({ x: a.x + Math.cos(an) * 5, y: a.y + Math.sin(an) * 5, vx: Math.cos(an) * 260, vy: Math.sin(an) * 260, dmg: rnd(4.5, 5.5), mine: true, ally: true, life: 1 });
        a.flashT = 0.05;
        beep(440, 0.03, "square", 0.012);
      }
    } else if (mv.x || mv.y) a.ang = Math.atan2(mv.y, mv.x);
  }

  // ---------- enemigos ----------
  function findCover(e, from) {
    const cx = Math.floor(e.x / TS), cy = Math.floor(e.y / TS);
    let best = null, bd = 1e9;
    for (let oy = -3; oy <= 3; oy++) for (let ox = -3; ox <= 3; ox++) {
      const nx = cx + ox, ny = cy + oy;
      if (nx < 1 || ny < 1 || nx >= GW - 1 || ny >= GH - 1 || G.map.g[ny * GW + nx] !== 0) continue;
      const x = nx * TS + 5, y = ny * TS + 5;
      if (los(x, y, from.x, from.y)) continue;
      const d = ox * ox + oy * oy;
      if (d < bd) { bd = d; best = { x, y }; }
    }
    return best;
  }
  function pickTarget(e) {
    const p = G.p;
    let t = p, bd = Math.hypot(p.x - e.x, p.y - e.y);
    G.allies.forEach((a) => {
      if (a.dead) return;
      const d = Math.hypot(a.x - e.x, a.y - e.y);
      if (d < bd * 0.85 && Math.random() < 0.7) { bd = d; t = a; }
    });
    return t;
  }
  function enemyFire(e, t) {
    const a = Math.atan2(t.y - e.y, t.x - e.x), dmg = 8 * (1 + 0.1 * (G.wave - 1));
    const shoot = (ang, spd) => G.bullets.push({ x: e.x + Math.cos(ang) * (e.r + 2), y: e.y + Math.sin(ang) * (e.r + 2), vx: Math.cos(ang) * spd, vy: Math.sin(ang) * spd, dmg, mine: false, life: 2 });
    if (e.def.boss) {
      for (let i = 0; i < 12; i++) shoot(i / 12 * Math.PI * 2 + rnd(0, 0.3), 70);
      for (let i = -1; i <= 1; i++) shoot(a + i * 0.12, 120);
    } else {
      const n = 1 + ((Math.random() * 3) | 0);
      for (let i = 0; i < n; i++) shoot(a + rnd(-0.18, 0.18), rnd(105, 120));
    }
    e.flashT = 0.06;
    beep(260, 0.04, "square", 0.015);
  }
  function updateEnemy(e, dt) {
    e.tgtT -= dt;
    if (!e.tgt || e.tgt.dead || e.tgtT <= 0) { e.tgt = pickTarget(e); e.tgtT = rnd(1.2, 2.2); }
    const t = e.tgt, dx = t.x - e.x, dy = t.y - e.y, d = Math.hypot(dx, dy);
    e.flash = Math.max(0, e.flash - dt); e.flashT = Math.max(0, (e.flashT || 0) - dt);
    e.meleeCd -= dt; e.fireCd -= dt; e.coverT -= dt;
    e.ang = Math.atan2(dy, dx);
    let mv = { x: 0, y: 0 };
    const see = d < 200 && los(e.x, e.y, t.x, t.y);
    if (e.def.gun) {
      if (e.aimT > 0) {
        e.aimT -= dt;
        if (e.aimT <= 0) {
          if (see) enemyFire(e, t);
          e.fireCd = rnd(1.1, 1.9) * (e.def.boss ? 1.2 : 1) / (1 + 0.1 * (G.wave - 1));
          e.coverT = e.def.boss ? 0 : e.fireCd * 0.8; e.cover = e.def.boss ? null : findCover(e, t);
        }
      } else if (see && e.fireCd <= 0 && d < 150) {
        e.aimT = e.def.boss ? 0.4 : 0.5;
      } else if (e.coverT > 0 && e.cover) {
        mv = norm(e.cover.x - e.x, e.cover.y - e.y);
        if (Math.hypot(e.cover.x - e.x, e.cover.y - e.y) < 2) mv = { x: 0, y: 0 };
      } else if (!see || d > 110 || (e.def.boss && d > 30)) {
        mv = see ? norm(dx, dy) : flowDir(e);
      } else if (d < 50) {
        mv = norm(-dx, -dy);
      } else {
        const n = norm(dx, dy); mv = { x: -n.y * e.strafe * 0.7, y: n.x * e.strafe * 0.7 };
        if (Math.random() < dt * 0.5) e.strafe *= -1;
      }
    } else {
      mv = see && (d < 60 || t !== G.p) ? norm(dx, dy) : flowDir(e);
    }
    if (e.def.melee && d < e.r + t.r + 3 && e.meleeCd <= 0) {
      e.meleeCd = e.def.mcd;
      hurtTarget(t, e.def.melee * (1 + 0.1 * (G.wave - 1)), e.x, e.y);
    }
    if (d < e.r + t.r + 1 && !e.def.gun) mv = { x: 0, y: 0 };
    const ox = e.x, oy = e.y;
    moveCircle(e, mv.x * e.spd * dt, mv.y * e.spd * dt);
    e.walk += Math.hypot(e.x - ox, e.y - oy);
  }

  // ---------- paso fijo ----------
  function step(dt) {
    if (!G) return;
    G.time += G.phase === "play" ? dt : 0;
    G.anim += dt;
    G.shake = Math.max(0, G.shake - dt);
    if (G.banner) { G.banner.t -= dt; if (G.banner.t <= 0) G.banner = null; }
    if (G.streakTxt) { G.streakTxt.t -= dt; if (G.streakTxt.t <= 0) G.streakTxt = null; }
    G.streakT -= dt;
    updateParts(dt);
    if (G.phase !== "play") return;
    const p = G.p;
    p.cd -= dt; p.flash = Math.max(0, p.flash - dt); p.flashT = Math.max(0, p.flashT - dt); p.swing = Math.max(0, p.swing - dt);
    p.dashCd -= dt;
    if (p.reload > 0) { p.reload -= dt; if (p.reload <= 0) { p.reload = 0; p.ammo = G.w.mag; } }
    let firing = false, aimed = false;
    Object.keys(G.ptrs).forEach((id) => {
      const q = G.ptrs[id];
      if (q.kind === "mouse") firing = true;
      if (q.kind === "aim") {
        firing = true;
        const ddx = q.x - q.ox, ddy = (q.y - q.oy) / KY;
        if (Math.hypot(ddx, ddy) > 5) { p.ang = Math.atan2(ddy, ddx); aimed = true; }
      }
    });
    if (G.mouse && !aimed && !G.touch) {
      const wx = G.mouse.x - G.camX, wy = (G.mouse.y - G.camY - OY + 4) / KY;
      p.ang = Math.atan2(wy - p.y, wx - p.x); aimed = true;
    }
    if (!aimed && G.touch) { const e = nearestVisible(p); if (e) p.ang = Math.atan2(e.y - p.y, e.x - p.x); }
    if (G.keys.f) firing = true;
    if (firing && p.cd <= 0) playerShoot();
    const ox = p.x, oy = p.y;
    if (p.dashT > 0) {
      p.dashT -= dt; moveCircle(p, p.dashDir.x * 150 * dt, p.dashDir.y * 150 * dt);
      if (Math.random() < 0.6) G.parts.push({ x: p.x, y: p.y, z: 3, vz: 0, vx: 0, vy: 0, life: 0.2, col: "#4aa3ff", size: 1 });
    } else {
      const mv = moveInput();
      moveCircle(p, mv.x * 52 * dt, mv.y * 52 * dt);
    }
    p.walk += Math.hypot(p.x - ox, p.y - oy);
    G.flowT -= dt;
    const pc = Math.floor(p.y / TS) * GW + Math.floor(p.x / TS);
    if (G.flowT <= 0 || pc !== G.flowCell) { flow(); G.flowT = 0.3; }
    G.allies.forEach((a, i) => { if (!a.dead) updateAlly(a, i, dt); });
    G.enemies.forEach((e) => updateEnemy(e, dt));
    const bodies = G.enemies.concat(G.allies.filter((a) => !a.dead));
    for (let i = 0; i < bodies.length; i++) for (let j = i + 1; j < bodies.length; j++) {
      const a = bodies[i], b = bodies[j], ddx = b.x - a.x, ddy = b.y - a.y, d = Math.hypot(ddx, ddy) || 0.01, m = a.r + b.r + 1;
      if (d < m) { const push = (m - d) / 2; moveCircle(a, -ddx / d * push, -ddy / d * push); moveCircle(b, ddx / d * push, ddy / d * push); }
    }
    for (let i = G.bullets.length - 1; i >= 0; i--) {
      const b = G.bullets[i];
      let dead = false;
      for (let s = 0; s < 2 && !dead; s++) {
        b.x += b.vx * dt / 2; b.y += b.vy * dt / 2;
        if (blocksShot(b.x, b.y)) { damageCell(b.x, b.y, b.dmg); dead = true; break; }
        if (b.mine) {
          for (const e of G.enemies) if (!e.dead && Math.hypot(e.x - b.x, e.y - b.y) < e.r + 1.5) {
            const n = norm(b.vx, b.vy); damageEnemy(e, b.dmg, n.x, n.y); dead = true; break;
          }
        } else {
          if (Math.hypot(p.x - b.x, p.y - b.y) < p.r + 1 && p.dashT <= 0) { hurtPlayer(b.dmg, b.x - b.vx, b.y - b.vy); dead = true; break; }
          for (const a of G.allies) if (!a.dead && Math.hypot(a.x - b.x, a.y - b.y) < a.r + 1) { hurtAlly(a, b.dmg, b.x - b.vx, b.y - b.vy); dead = true; break; }
        }
      }
      b.life -= dt;
      if (dead || b.life <= 0) G.bullets.splice(i, 1);
    }
    G.enemies = G.enemies.filter((e) => !e.dead);
    for (let i = G.pickups.length - 1; i >= 0; i--) {
      const k = G.pickups[i]; k.t += dt;
      if (Math.hypot(k.x - p.x, k.y - p.y) < 7 && p.hp < 100) {
        p.hp = Math.min(100, p.hp + 25); addText(p.x, p.y - 4, "+25", "#5f5"); G.pickups.splice(i, 1); beep(880, 0.08, "triangle", 0.03);
      }
    }
    if (G.phase !== "play") return;
    G.spawnT -= dt;
    if (G.queue.length && G.spawnT <= 0 && G.enemies.length < G.maxAlive) { spawnEnemy(G.queue.shift()); G.spawnT = 0.6; }
    if (!G.queue.length && !G.enemies.length) {
      if (G.wave >= G.opts.waves) endGame(true);
      else { G.interT = (G.interT || 0) + dt; if (G.interT >= 1.5) { G.interT = 0; sfx("choice"); startWave(G.wave + 1); } }
    }
  }
  function updateParts(dt) {
    for (let i = G.parts.length - 1; i >= 0; i--) {
      const q = G.parts[i];
      q.x += q.vx * dt; q.y += q.vy * dt;
      if (q.ground) {
        q.vz -= 220 * dt; q.z += q.vz * dt;
        if (q.z <= 0) {
          q.z = 0;
          if (q.vz < -15) { q.vz = -q.vz * 0.4; q.vx *= 0.6; q.vy *= 0.6; } else q.vz = 0;
        }
        const f = q.z > 0 ? Math.pow(0.5, dt) : Math.pow(0.001, dt); q.vx *= f; q.vy *= f;
      } else { const f = Math.pow(0.3, dt); q.vx *= f; q.vy *= f; }
      q.life -= dt;
      if (q.life <= 0) {
        G.parts.splice(i, 1);
        if (q.ground) { G.decals.push({ x: q.x, y: q.y, r: 0, s: q.size || 1, col: q.shell ? "#9c7f2c" : q.col }); if (G.decals.length > 300) G.decals.shift(); }
      }
    }
    for (let i = G.texts.length - 1; i >= 0; i--) { const t = G.texts[i]; t.z += 14 * dt; t.life -= dt; if (t.life <= 0) G.texts.splice(i, 1); }
  }
  function makeResult(win) {
    return {
      win, kills: G.kills, hpLeft: Math.round(G.p.hp), time: Math.round(G.time * 10) / 10, shots: G.shots,
      alliesAlive: G.allies.filter((a) => !a.dead).length, alliesTotal: G.allies.length
    };
  }
  function endGame(win) {
    if (G.phase !== "play") return;
    G.phase = "end";
    G.result = makeResult(win);
    G.ptrs = {};
    G.ui.close.style.display = "block";
    G.ui.exit.style.display = "none"; G.ui.reload.style.display = "none"; G.ui.dash.style.display = "none";
    sfx("choice");
    if (win) beep(660, 0.25, "triangle", 0.04); else beep(110, 0.4, "sawtooth", 0.04);
  }

  // ---------- render 2.5D ----------
  function newCanvas(w, h) { const c = document.createElement("canvas"); c.width = w; c.height = h; const x = c.getContext("2d"); if (x) x.imageSmoothingEnabled = false; return c; }
  const ROW_PAD = 14;
  function blockColors(v, kind, x, y) {
    if (v === 1) return kind === "warehouse" ? ["#4a4756", "#2c2a33", "#201e26"] : kind === "park" ? ["#6b5a44", "#3d3328", "#2b241c"] : ["#6d5c7a", "#4b3f55", "#352c3d"];
    if (v === 2) return ["#c08a48", "#8a5a28", "#6b4520"];
    if (v === 4) return ["#4a9a35", "#2e6b22", "#1d3d17"];
    if (kind === "street") return hash(x, 1) < 0.5 ? ["#d9504a", "#9c2a26", "#701d1a"] : ["#4a7fd9", "#2e5fb8", "#1f417e"];
    return kind === "park" ? ["#9a6e40", "#7a5530", "#5a3d22"] : ["#9aa0ab", "#6b6f7a", "#4a4d55"];
  }
  // dibuja un bloque de la celda (cx,cy): top = y pantalla del borde superior de la celda (suelo), rowH = alto proyectado
  function drawBlock(c, cx, cy, top, rowH, h, v, kind, hpFrac) {
    const x = cx * TS, col = blockColors(v, kind, cx, cy);
    if (v === 4) {
      c.fillStyle = "#4a3322"; c.fillRect(x + 4, top + rowH - 6, 2, 6);
      c.fillStyle = col[2]; c.fillRect(x - 1, top - h + 1, TS + 2, rowH + 2);
      c.fillStyle = col[1]; c.fillRect(x, top - h, TS, rowH);
      c.fillStyle = col[0]; c.fillRect(x + 2, top - h + 1, 4, 3);
      return;
    }
    c.fillStyle = col[1]; c.fillRect(x, top + rowH - h, TS, h);
    c.fillStyle = col[0]; c.fillRect(x, top - h, TS, rowH);
    c.fillStyle = col[2]; c.fillRect(x, top + rowH - 1, TS, 1);
    const g = G.map.g, left = cx > 0 ? g[cy * GW + cx - 1] : 1, right = cx < GW - 1 ? g[cy * GW + cx + 1] : 1;
    if (left !== v) { c.fillStyle = col[2]; c.fillRect(x, top - h, 1, rowH + h); }
    if (right !== v) { c.fillStyle = col[2]; c.fillRect(x + TS - 1, top - h, 1, rowH + h); }
    if (v === 1 && kind === "street" && hash(cx, cy) < 0.5) { c.fillStyle = hash(cy, cx) < 0.3 ? "#e6d27a" : "#1d1a24"; c.fillRect(x + 3, top + rowH - h + 3, 3, 3); }
    if (v === 1) { c.fillStyle = "rgba(255,255,255,0.12)"; c.fillRect(x, top - h, TS, 1); }
    if (v === 3 && kind === "street") { c.fillStyle = "#9fd0e8"; if (hash(cx, cy) < 0.5) c.fillRect(x + 2, top - h + 2, TS - 4, 3); c.fillStyle = "#111"; c.fillRect(x, top + rowH - 2, 2, 2); c.fillRect(x + TS - 2, top + rowH - 2, 2, 2); }
    if (v === 3 && kind !== "street") { c.fillStyle = col[2]; c.fillRect(x, top + rowH - h + 2, TS, 1); }
    if (v === 2) {
      c.fillStyle = col[2]; c.fillRect(x + 4, top - h, 1, rowH); c.fillRect(x, top + rowH - h + Math.floor(h / 2), TS, 1);
      if (hpFrac < 1) { c.fillStyle = "#3a2410"; c.fillRect(x + 6, top - h + 2, 1, 3); if (hpFrac < 0.5) c.fillRect(x + 2, top + rowH - h + 1, 2, 1); }
    }
  }
  function buildStatic() {
    const m = G.map, k = m.kind, c = G.bgCtx;
    c.fillStyle = "#07070c"; c.fillRect(0, 0, W + 8, H + 8);
    const base = k === "park" ? "#2f5a2a" : k === "warehouse" ? "#4a4540" : "#2b2b31";
    G.water = [];
    for (let y = 0; y < GH; y++) {
      const top = SY(y * TS) + 4, rowH = SY((y + 1) * TS) - SY(y * TS);
      for (let x = 0; x < GW; x++) {
        const px = x * TS + 4, v = m.g[y * GW + x];
        c.fillStyle = base; c.fillRect(px, top, TS, rowH);
        for (let i = 0; i < 3; i++) {
          const h = hash(x * 7 + i, y * 13 + i);
          c.fillStyle = k === "park" ? (h < 0.5 ? "#28501f" : "#3a6a30") : k === "warehouse" ? "#3f3b37" : "#25252a";
          c.fillRect(px + ((h * 97) | 0) % 10, top + ((h * 61) | 0) % rowH, 1, 1);
        }
        if (k === "warehouse") { c.fillStyle = "#423e3a"; c.fillRect(px, top, TS, 1); c.fillRect(px, top, 1, rowH); }
        if (k === "street" && (x === 8 || x === 9) && y % 3 === 0) { c.fillStyle = "#c9a227"; c.fillRect(x === 8 ? px + 9 : px, top + 2, 1, 4); }
        if (k === "street" && (x === 3 || x === 14)) { c.fillStyle = "#55555c"; c.fillRect(px, top, TS, rowH); c.fillStyle = "#4a4a50"; c.fillRect(px, top + rowH - 1, TS, 1); }
        if (k === "park" && x >= 8 && x <= 9 && y > 18) { c.fillStyle = "#a08b5c"; c.fillRect(px, top, TS, rowH); }
        if (v === 5) {
          c.fillStyle = "#2a5f9e"; c.fillRect(px, top, TS, rowH);
          if (m.g[(y - 1) * GW + x] !== 5) { c.fillStyle = "#1c3f6a"; c.fillRect(px, top, TS, 2); }
          G.water.push({ x, y });
        }
      }
      // sombra proyectada de los bloques al suelo (hacia abajo-derecha)
      for (let x = 0; x < GW; x++) {
        const v = m.g[y * GW + x];
        if (BLOCK_H[v] && v !== 2 && y < GH - 1 && m.g[(y + 1) * GW + x] === 0) { c.fillStyle = "rgba(0,0,0,0.25)"; c.fillRect(x * TS + 6, top + rowH, TS, 3); }
      }
    }
    // bloques estáticos por fila (para ordenar por profundidad con lo dinámico)
    G.rows = [];
    for (let y = 0; y < GH; y++) {
      let any = false;
      for (let x = 0; x < GW; x++) { const v = m.g[y * GW + x]; if (v === 1 || v === 3 || v === 4) any = true; }
      if (!any) continue;
      const rowH = SY((y + 1) * TS) - SY(y * TS), rc = newCanvas(W, ROW_PAD + rowH + 2), rx = rc.getContext("2d");
      for (let x = 0; x < GW; x++) { const v = m.g[y * GW + x]; if (v === 1 || v === 3 || v === 4) drawBlock(rx, x, y, ROW_PAD, rowH, BLOCK_H[v], v, k, 1); }
      G.rows.push({ y, canvas: rc, top: SY(y * TS) - ROW_PAD });
    }
    // viñeta
    const vc = G.vignette.getContext("2d");
    for (let i = 0; i < 8; i++) { vc.fillStyle = "rgba(0,0,0," + (0.09 - i * 0.01) + ")"; vc.fillRect(0, i * 2, W, 2); vc.fillRect(0, H - i * 2 - 2, W, 2); vc.fillRect(i * 2, 0, 2, H); vc.fillRect(W - i * 2 - 2, 0, 2, H); }
  }
  function drawGuy(c, x, sy, r, col, dark, ang, flash, walk, gun, flashT) {
    x = Math.round(x);
    const bob = Math.floor(walk / 4) % 2, by = sy - r - 3 - bob;
    c.fillStyle = "rgba(0,0,0,0.4)"; c.fillRect(x - r, sy - 1, r * 2, 2); c.fillRect(x - r + 1, sy - 2, r * 2 - 2, 4);
    c.fillStyle = flash > 0 ? "#fff" : dark;
    c.fillRect(x - r, by - r + 1, r * 2, r * 2 + 1); c.fillRect(x - r + 1, by - r, r * 2 - 2, r * 2 + 3);
    c.fillStyle = flash > 0 ? "#fff" : col;
    c.fillRect(x - r + 1, by - r + 1, r * 2 - 2, r * 2 - 1);
    c.fillStyle = flash > 0 ? "#fff" : "#1a1a1a"; c.fillRect(x - r + 1, sy - 2 + (bob ? 0 : -1), 2, 2); c.fillRect(x + r - 3, sy - 2 + (bob ? -1 : 0), 2, 2);
    c.fillStyle = flash > 0 ? "#fff" : "#e0ac7e"; c.fillRect(x - 1, by - r - 2, 3, 3);
    c.fillStyle = flash > 0 ? "#fff" : "#2a1a10"; c.fillRect(x - 1, by - r - 2, 3, 1);
    const ax = Math.cos(ang), ay = Math.sin(ang) * KY;
    if (gun) {
      c.fillStyle = "#1a1a1a";
      for (let i = 1; i <= r + 3; i++) c.fillRect(Math.round(x + ax * i), Math.round(by + ay * i), 1, 1);
      if (flashT > 0) { c.fillStyle = "#fff4a0"; c.fillRect(Math.round(x + ax * (r + 5)) - 1, Math.round(by + ay * (r + 5)) - 1, 3, 3); }
    } else {
      c.fillStyle = "#e0ac7e";
      c.fillRect(Math.round(x + ax * (r + 1) - ay * 2), Math.round(by + ay * (r + 1) + ax * 2), 2, 2);
      c.fillRect(Math.round(x + ax * (r + 1) + ay * 2), Math.round(by + ay * (r + 1) - ax * 2), 2, 2);
    }
  }
  function occluded(o) {
    const cx = Math.floor(o.x / TS), cy = Math.floor(o.y / TS) + 1;
    if (cy >= GH) return false;
    const v = G.map.g[cy * GW + cx];
    return v === 1 || v === 4;
  }
  function render() {
    const c = G.ctx, p = G.p, kind = G.map.kind;
    if (!G.rows) buildStatic();
    G.camX = clamp(Math.round((90 - p.x) * 0.04), -3, 3);
    G.camY = clamp(Math.round((160 - p.y) * 0.02), -3, 3);
    c.fillStyle = "#07070c"; c.fillRect(0, 0, W, H);
    c.save();
    let sx = G.camX, sy = G.camY;
    if (G.shake > 0 && !G.reduced) { sx += Math.round(rnd(-2, 2)); sy += Math.round(rnd(-2, 2)); }
    c.translate(sx, sy);
    c.drawImage(G.bg, -4, -4);
    G.water.forEach((w, i) => {
      const ph = (G.anim * 6 + hash(w.x, w.y) * 10) | 0;
      c.fillStyle = "rgba(200,230,255," + (0.35 + 0.3 * Math.sin(G.anim * 3 + i)) + ")";
      c.fillRect(w.x * TS + (ph % 8) + 1, SY(w.y * TS) + 2 + (i % 3) * 2, 2, 1);
    });
    G.decals.forEach((d) => {
      c.fillStyle = d.col;
      if (d.r) c.fillRect(Math.round(d.x - d.r), SY(d.y) - 1, d.r * 2, Math.max(2, Math.round(d.r * KY)));
      else c.fillRect(Math.round(d.x), SY(d.y), d.s || 1, 1);
    });
    const items = [];
    G.rows.forEach((r) => items.push({ d: (r.y + 1) * TS - 5, f: () => c.drawImage(r.canvas, 0, r.top) }));
    for (let i = 0; i < GW * GH; i++) if (G.map.g[i] === 2) {
      const cx = i % GW, cy = (i / GW) | 0, frac = clamp(G.map.hp[i] / 40, 0, 1);
      items.push({ d: (cy + 1) * TS - 5, f: () => drawBlock(c, cx, cy, SY(cy * TS), SY((cy + 1) * TS) - SY(cy * TS), Math.max(2, Math.round(BLOCK_H[2] * (0.5 + 0.5 * frac))), 2, kind, frac) });
    }
    G.pickups.forEach((k) => items.push({ d: k.y, f: () => {
      const x = Math.round(k.x), y = SY(k.y) - 5 - Math.round(Math.sin(k.t * 5) * 1.5);
      c.fillStyle = "rgba(0,0,0,0.35)"; c.fillRect(x - 3, SY(k.y) - 1, 6, 2);
      c.fillStyle = "#fff"; c.fillRect(x - 3, y - 3, 6, 6);
      c.fillStyle = "#d22"; c.fillRect(x - 1, y - 2, 2, 4); c.fillRect(x - 2, y - 1, 4, 2);
    } }));
    G.enemies.forEach((e) => items.push({ d: e.y, f: () => {
      const d = e.def;
      if (e.aimT > 0 && e.tgt) {
        c.fillStyle = "rgba(255,40,40,0.7)";
        const dx = e.tgt.x - e.x, dy = e.tgt.y - e.y, l = Math.hypot(dx, dy);
        for (let i = 6; i < l; i += 4) c.fillRect(Math.round(e.x + dx / l * i), SY(e.y + dy / l * i) - 6, 1, 1);
      }
      drawGuy(c, e.x, SY(e.y), e.r, d.col, d.dark, e.ang, e.flash, e.walk, !!d.gun, e.flashT);
      const top = SY(e.y) - e.r * 2 - 6;
      if (e.type === "heavy") { c.fillStyle = e.flash > 0 ? "#fff" : "#8a8a8a"; c.fillRect(Math.round(e.x) - 3, top + 1, 6, 2); }
      if (d.boss) { c.fillStyle = "#f2c230"; const x = Math.round(e.x), y = top - 2; c.fillRect(x - 3, y, 7, 2); c.fillRect(x - 3, y - 2, 1, 2); c.fillRect(x, y - 2, 1, 2); c.fillRect(x + 3, y - 2, 1, 2); }
      if (e.hp < e.max) {
        const bw = e.r * 2 + 2;
        c.fillStyle = "#300"; c.fillRect(Math.round(e.x - bw / 2), top - 3, bw, 1);
        c.fillStyle = "#f33"; c.fillRect(Math.round(e.x - bw / 2), top - 3, Math.max(0, Math.round(bw * e.hp / e.max)), 1);
      }
    } }));
    G.allies.forEach((a, i) => { if (!a.dead) items.push({ d: a.y, f: () => {
      drawGuy(c, a.x, SY(a.y), a.r, a.col, a.dark, a.ang, a.flash, a.walk, true, a.flashT);
      txt(c, a.name.charAt(0).toUpperCase(), Math.round(a.x), SY(a.y) - 17, a.col, "center", 6);
    } }); });
    const showP = G.phase === "play" || p.hp > 0;
    if (showP) items.push({ d: p.y, f: () => {
      if (!(p.dashT > 0 && Math.floor(G.anim * 30) % 2)) drawGuy(c, p.x, SY(p.y), p.r, "#3a7bd5", "#1d3f70", p.ang, p.flash, p.walk, !G.w.fists, p.flashT);
      if (p.swing > 0) { c.fillStyle = "#ffffff"; for (let i = -2; i <= 2; i++) { const a = p.ang + i * 0.3; c.fillRect(Math.round(p.x + Math.cos(a) * 9), SY(p.y + Math.sin(a) * 9) - 6, 1, 1); } }
    } });
    G.bullets.forEach((b) => items.push({ d: b.y, f: () => {
      const n = norm(b.vx, b.vy), y0 = SY(b.y);
      c.fillStyle = "rgba(0,0,0,0.4)"; c.fillRect(Math.round(b.x), y0, 1, 1);
      for (let i = 0; i < (b.mine ? 4 : 3); i++) {
        c.fillStyle = i === 0 ? (b.mine ? (b.ally ? "#c8ffd0" : "#fff6b0") : "#ffb0b0") : b.mine ? "rgba(255,220,100," + (0.6 - i * 0.15) + ")" : "rgba(255,80,80," + (0.6 - i * 0.15) + ")";
        c.fillRect(Math.round(b.x - n.x * i), Math.round(y0 - 6 - n.y * KY * i), 1, 1);
      }
    } }));
    G.parts.forEach((q) => items.push({ d: q.y, f: () => {
      const x = Math.round(q.x), y = SY(q.y);
      if (q.z > 1) { c.fillStyle = "rgba(0,0,0,0.3)"; c.fillRect(x, y, q.size || 1, 1); }
      c.fillStyle = q.col; c.fillRect(x, y - Math.round(q.z), q.shell ? 2 : q.size || 1, q.size || 1);
    } }));
    items.sort((a, b) => a.d - b.d);
    items.forEach((it) => it.f());
    // siluetas de lo que queda detrás de bloques altos
    const ghost = (o, col) => {
      if (!occluded(o)) return;
      c.globalAlpha = 0.5;
      const x = Math.round(o.x), y = SY(o.y);
      c.fillStyle = col; c.fillRect(x - o.r, y - o.r * 2 - 4, o.r * 2, o.r * 2 + 2); c.fillRect(x - 1, y - o.r * 2 - 7, 3, 3);
      c.globalAlpha = 1;
    };
    if (showP) ghost(p, "#7fb6ff");
    G.allies.forEach((a) => { if (!a.dead) ghost(a, a.col); });
    G.enemies.forEach((e) => ghost(e, "#ff6a6a"));
    c.font = "bold 7px monospace"; c.textAlign = "center"; c.textBaseline = "middle";
    G.texts.forEach((t) => { const x = Math.round(t.x), y = SY(t.y) - Math.round(t.z); c.fillStyle = "#000"; c.fillText(t.txt, x + 1, y + 1); c.fillStyle = t.col; c.fillText(t.txt, x, y); });
    c.restore();
    c.drawImage(G.vignette, 0, 0);
    if (p.flash > 0) { c.fillStyle = "rgba(255,0,0," + (p.flash * 2) + ")"; c.fillRect(0, 0, W, H); }
    drawHud(c);
  }
  function txt(c, s, x, y, col, align, size) {
    c.font = "bold " + (size || 8) + "px monospace"; c.textAlign = align || "left"; c.textBaseline = "top";
    c.fillStyle = "#000"; c.fillText(s, x + 1, y + 1); c.fillStyle = col; c.fillText(s, x, y);
  }
  function drawHud(c) {
    const p = G.p, w = G.w;
    c.fillStyle = "rgba(0,0,0,0.6)"; c.fillRect(0, 0, W, 13);
    c.fillStyle = "#300"; c.fillRect(3, 3, 50, 7);
    c.fillStyle = p.hp > 30 ? "#e23" : Math.floor(G.anim * 6) % 2 ? "#f55" : "#a00"; c.fillRect(3, 3, Math.round(50 * p.hp / 100), 7);
    c.fillStyle = "#fff"; c.fillRect(3, 3, Math.round(50 * p.hp / 100), 1);
    txt(c, String(Math.round(p.hp)), 28, 3, "#fff", "center", 7);
    txt(c, T("W", "O", "O") + G.wave + "/" + G.opts.waves, 58, 3, "#ffd84a");
    txt(c, T("K", "K", "K") + G.kills, 98, 3, "#ff7a7a");
    G.allies.forEach((a, i) => {
      const x = 3 + i * 22, y = 15;
      c.fillStyle = "rgba(0,0,0,0.6)"; c.fillRect(x - 1, y - 1, 21, 7);
      c.fillStyle = a.dead ? "#444" : a.col; c.fillRect(x, y, 5, 5);
      c.fillStyle = "#e0ac7e"; if (!a.dead) c.fillRect(x + 2, y + 1, 2, 2);
      c.fillStyle = "#300"; c.fillRect(x + 7, y + 1, 12, 3);
      c.fillStyle = a.dead ? "#555" : "#3c3"; c.fillRect(x + 7, y + 1, Math.round(12 * a.hp / a.max), 3);
      if (a.dead) { c.fillStyle = "#f44"; c.fillRect(x, y + 2, 5, 1); }
    });
    c.fillStyle = "rgba(0,0,0,0.6)"; c.fillRect(0, H - 13, W, 13);
    txt(c, w.name.length > 16 ? w.name.slice(0, 15) + "." : w.name, 3, H - 11, "#cfd8e3", "left", 7);
    if (!w.fists) {
      if (p.reload > 0) {
        txt(c, T("RELOAD", "RECARGA", "RECARGA"), W - 3, H - 11, "#ffd84a", "right", 7);
        c.fillStyle = "#ffd84a"; c.fillRect(W - 40, H - 2, Math.round(37 * (1 - p.reload / w.reload)), 1);
      } else txt(c, p.ammo + "/" + w.mag, W - 3, H - 11, p.ammo <= w.mag / 4 ? "#f66" : "#fff", "right");
    }
    c.fillStyle = p.dashCd > 0 ? "#335" : "#4aa3ff"; c.fillRect(W - 60, H - 9, Math.round(14 * (1 - Math.max(0, p.dashCd) / 1.2)), 4);
    Object.keys(G.ptrs).forEach((id) => {
      const q = G.ptrs[id];
      if (q.kind === "mouse") return;
      c.strokeStyle = "rgba(255,255,255,0.35)"; c.lineWidth = 1;
      c.beginPath(); c.arc(q.ox, q.oy, 18, 0, Math.PI * 2); c.stroke();
      const dx = q.x - q.ox, dy = q.y - q.oy, d = Math.hypot(dx, dy), m = Math.min(d, 18) / (d || 1);
      c.fillStyle = q.kind === "aim" ? "rgba(255,90,90,0.6)" : "rgba(255,255,255,0.5)";
      c.fillRect(Math.round(q.ox + dx * m) - 4, Math.round(q.oy + dy * m) - 4, 8, 8);
    });
    if (G.mouse && G.phase === "play") {
      const x = Math.round(G.mouse.x), y = Math.round(G.mouse.y);
      c.fillStyle = "#fff"; c.fillRect(x - 3, y, 2, 1); c.fillRect(x + 2, y, 2, 1); c.fillRect(x, y - 3, 1, 2); c.fillRect(x, y + 2, 1, 2);
    }
    if (G.banner) txt(c, G.banner.txt, W / 2, 60, "#ffd84a", "center", 14);
    if (G.streakTxt) txt(c, G.streakTxt.txt, W / 2, 80, "#ff7a3a", "center", 9);
    if (G.phase === "end") {
      const r = G.result;
      c.fillStyle = "rgba(0,0,0,0.75)"; c.fillRect(0, 0, W, H);
      c.fillStyle = r.win ? "#1d3a1d" : "#3a1414"; c.fillRect(20, 90, W - 40, 132);
      c.fillStyle = r.win ? "#5f5" : "#f55"; c.fillRect(20, 90, W - 40, 2); c.fillRect(20, 220, W - 40, 2);
      txt(c, r.win ? T("CLEARED!", "¡LIMPIO!", "LIMPO!") : T("WASTED", "MUERTO", "MORTO"), W / 2, 98, r.win ? "#7f7" : "#f66", "center", 16);
      txt(c, T("Kills", "Bajas", "Abates") + ": " + r.kills, 32, 124, "#fff");
      txt(c, T("HP left", "Vida", "Vida") + ": " + r.hpLeft, 32, 136, "#fff");
      txt(c, T("Time", "Tiempo", "Tempo") + ": " + r.time + "s", 32, 148, "#fff");
      txt(c, T("Shots", "Disparos", "Tiros") + ": " + r.shots, 32, 160, "#fff");
      txt(c, T("Wave", "Oleada", "Onda") + ": " + G.wave + "/" + G.opts.waves, 32, 172, "#fff");
      if (r.alliesTotal) txt(c, T("Crew alive", "Panas vivos", "Parceiros vivos") + ": " + r.alliesAlive + "/" + r.alliesTotal, 32, 184, "#fff");
    }
  }

  // ---------- DOM / input ----------
  function mkBtn(label, css, fn) {
    const b = document.createElement("button");
    b.textContent = label;
    b.style.cssText = "position:absolute;font:bold 13px monospace;color:#fff;background:rgba(20,20,30,0.8);border:2px solid #fff;border-radius:0;padding:6px 10px;touch-action:none;user-select:none;cursor:pointer;" + css;
    const h = (e) => { e.stopPropagation(); if (e.preventDefault) e.preventDefault(); ensureAudio(); fn(); };
    b.addEventListener("pointerdown", h);
    return b;
  }
  function layout() {
    if (!G) return;
    const iw = window.innerWidth || W, ih = window.innerHeight || H;
    let s = Math.floor(Math.min(iw / W, ih / H));
    if (s < 1) s = Math.min(iw / W, ih / H);
    G.scale = s;
    const cw = W * s, ch = H * s, l = (iw - cw) / 2, t = (ih - ch) / 2;
    const cs = G.canvas.style;
    cs.width = cw + "px"; cs.height = ch + "px"; cs.left = l + "px"; cs.top = t + "px";
    G.ui.exit.style.left = (l + cw - 4) + "px"; G.ui.exit.style.top = (t + 2) + "px"; G.ui.exit.style.transform = "translateX(-100%)";
    G.ui.reload.style.left = (l + cw * 0.36) + "px"; G.ui.reload.style.top = (t + ch - 13 * s - 44) + "px";
    G.ui.dash.style.left = (l + cw * 0.58) + "px"; G.ui.dash.style.top = (t + ch - 13 * s - 44) + "px";
    G.ui.close.style.left = (l + cw / 2) + "px"; G.ui.close.style.top = (t + 230 * s) + "px"; G.ui.close.style.transform = "translateX(-50%)";
  }
  function toLogical(e) {
    const r = G.canvas.getBoundingClientRect();
    return { x: (e.clientX - r.left) / (r.width || 1) * W, y: (e.clientY - r.top) / (r.height || 1) * H };
  }
  function bindInput() {
    const L = G.listeners = [];
    const on = (tgt, ev, fn, opt) => { tgt.addEventListener(ev, fn, opt); L.push([tgt, ev, fn, opt]); };
    const keyName = (e) => (e.key || "").toLowerCase();
    on(window, "keydown", (e) => {
      if (!G) return;
      ensureAudio();
      const k = keyName(e);
      if (["arrowup", "arrowdown", "arrowleft", "arrowright", " "].indexOf(k) >= 0 && e.preventDefault) e.preventDefault();
      G.keys[k] = true;
      if (k === "r") startReload();
      if (k === " " || k === "shift") startDash();
    });
    on(window, "keyup", (e) => { if (G) G.keys[keyName(e)] = false; });
    on(window, "blur", () => { if (G) { G.keys = {}; G.ptrs = {}; } });
    on(window, "resize", layout);
    const ov = G.overlay;
    on(ov, "pointerdown", (e) => {
      if (!G || G.phase !== "play") return;
      ensureAudio();
      if (e.preventDefault) e.preventDefault();
      const q = toLogical(e);
      let kind = "mouse";
      if (e.pointerType !== "mouse") { kind = q.x < W / 2 ? "move" : "aim"; G.touch = true; G.mouse = null; }
      else { G.mouse = q; G.touch = false; if (e.button !== 0) return; }
      G.ptrs[e.pointerId] = { kind, ox: q.x, oy: q.y, x: q.x, y: q.y };
      try { ov.setPointerCapture(e.pointerId); } catch (err) { /* nada */ }
    });
    on(ov, "pointermove", (e) => {
      if (!G) return;
      const q = toLogical(e), s = G.ptrs[e.pointerId];
      if (e.pointerType === "mouse") { G.mouse = q; G.touch = false; }
      if (s) { s.x = q.x; s.y = q.y; }
    });
    const up = (e) => { if (G) delete G.ptrs[e.pointerId]; };
    on(ov, "pointerup", up); on(ov, "pointercancel", up);
    on(ov, "contextmenu", (e) => { if (e.preventDefault) e.preventDefault(); });
  }
  function loop(t) {
    if (!G) return;
    const last = G.last || t;
    G.last = t;
    G.acc += Math.min(0.1, Math.max(0, (t - last) / 1000));
    while (G.acc >= DT) { step(DT); G.acc -= DT; if (!G) return; }
    render();
    G.raf = window.requestAnimationFrame(loop);
  }
  function cleanup() {
    if (!G) return;
    const g = G;
    G = null;
    if (g.raf) window.cancelAnimationFrame(g.raf);
    (g.listeners || []).forEach((l) => l[0].removeEventListener(l[1], l[2], l[3]));
    if (g.overlay && g.overlay.parentNode) g.overlay.parentNode.removeChild(g.overlay);
    document.body.style.overflow = g.prevOverflow;
    if (g.audio && g.audio.close) { try { g.audio.close(); } catch (e) { /* nada */ } }
  }
  function finish() {
    if (!G || G.ended) return;
    G.ended = true;
    const cb = G.opts.onEnd, res = G.result;
    cleanup();
    if (typeof cb === "function") { try { cb(res); } catch (e) { if (window.console) console.error(e); } }
  }
  function giveUp() {
    if (!G || G.phase !== "play") return;
    G.phase = "end";
    G.result = makeResult(false);
    finish();
  }

  function play(opts) {
    if (G) cleanup();
    opts = opts || {};
    let power = opts.power, gunName = opts.gunName;
    if (typeof power !== "number") {
      power = 0;
      try { if (window.FL_ARMS && FL_ARMS.power) power = +FL_ARMS.power() || 0; } catch (e) { power = 0; }
    }
    if (!gunName) { try { const g = window.FL_ARMS && FL_ARMS.carried && FL_ARMS.carried(); if (g && g.name) gunName = g.name; } catch (e) { /* sin arma */ } }
    const nAllies = typeof opts.allies === "number" ? clamp(Math.round(opts.allies), 0, 3) : 2;
    const names = Array.isArray(opts.allyNames) ? opts.allyNames : [];
    const o = {
      enemies: typeof opts.enemies === "number" ? clamp(Math.round(opts.enemies), 1, 5) : 3 + (Math.random() < 0.5 ? 1 : 0),
      waves: typeof opts.waves === "number" ? clamp(Math.round(opts.waves), 1, 2) : 1,
      map: ["street", "warehouse", "park"].indexOf(opts.map) >= 0 ? opts.map : "street", boss: !!opts.boss, onEnd: opts.onEnd
    };
    if (o.waves > o.enemies) o.waves = 1;
    const overlay = document.createElement("div");
    overlay.style.cssText = "position:fixed;left:0;top:0;right:0;bottom:0;z-index:2147483000;background:#07070c;touch-action:none;user-select:none;-webkit-user-select:none;overflow:hidden;";
    const canvas = document.createElement("canvas");
    canvas.width = W; canvas.height = H;
    canvas.style.cssText = "position:absolute;image-rendering:pixelated;image-rendering:crisp-edges;touch-action:none;";
    let reduced = false;
    try { reduced = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches); } catch (e) { reduced = false; }
    const w = makeWeapon(power, gunName);
    const bg = newCanvas(W + 8, H + 8);
    G = {
      opts: o, overlay, canvas, bg, ctx: canvas.getContext("2d"), bgCtx: bg.getContext("2d"), vignette: newCanvas(W, H), reduced, w,
      map: buildMap(o.map), flow: new Array(GW * GH).fill(9999), flowT: 0, flowCell: -1, rows: null, water: [],
      p: { x: 95, y: 285, r: 3, hp: 100, ang: -Math.PI / 2, cd: 0, ammo: w.mag, reload: 0, dashT: 0, dashCd: 0, dashDir: { x: 0, y: -1 }, flash: 0, flashT: 0, swing: 0, walk: 0 },
      enemies: [], allies: [], bullets: [], parts: [], decals: [], texts: [], pickups: [], queue: [],
      keys: {}, ptrs: {}, mouse: null, touch: false, kills: 0, shots: 0, time: 0, anim: 0, shake: 0, streak: 0, streakT: 0, camX: 0, camY: 0,
      wave: 1, phase: "play", acc: 0, last: 0, prevOverflow: document.body.style.overflow, ended: false
    };
    if (G.ctx) G.ctx.imageSmoothingEnabled = false;
    const defNames = ["Dre", "Kiko", "Mo"], starts = [[83, 291], [107, 291], [95, 276]];
    for (let i = 0; i < nAllies; i++) {
      const pal = ALLY_COLS[i % ALLY_COLS.length];
      G.allies.push({ x: starts[i][0], y: starts[i][1], r: 3, hp: 60, max: 60, ang: -Math.PI / 2, cd: rnd(0.3, 0.8), flash: 0, flashT: 0, walk: 0, coverT: 0, cover: null, dead: false,
        name: String(names[i] || defNames[i]), col: pal[0], dark: pal[1] });
    }
    G.free = [];
    for (let y = 1; y < GH - 6; y++) for (let x = 1; x < GW - 1; x++) if (G.map.g[y * GW + x] === 0) G.free.push({ x: x * TS + 5, y: y * TS + 5 });
    G.roster = buildRoster();
    G.ui = {
      exit: mkBtn(T("Give up", "Rendirse", "Desistir"), "font-size:11px;padding:3px 6px;", giveUp),
      reload: mkBtn("R", "width:44px;height:44px;padding:0;", startReload),
      dash: mkBtn(T("DASH", "ESQUIVAR", "ESQUIVA"), "height:44px;padding:0 8px;", startDash),
      close: mkBtn(T("Close", "Cerrar", "Fechar"), "display:none;font-size:15px;padding:8px 18px;background:#1f6f2f;", finish)
    };
    overlay.appendChild(canvas);
    Object.keys(G.ui).forEach((k) => overlay.appendChild(G.ui[k]));
    document.body.appendChild(overlay);
    document.body.style.overflow = "hidden";
    layout();
    bindInput();
    flow();
    startWave(1);
    G.raf = window.requestAnimationFrame(loop);
  }

  window.FL_SHOOTER = {
    play, stop: cleanup,
    _step(dt) { let n = Math.max(1, Math.round(dt / DT)); while (n-- > 0 && G) step(DT); if (G) render(); },
    _state() { return G; }
  };
})();
