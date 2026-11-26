/* [mod] Drift Boy · "Drive the track": a playable top-down drift minigame.
 * Loaded with the drift-boy mod (deps in modloader.js), opened from the Drift Boy hub (drift.js, row "drive").
 * Everything is drawn on a small canvas (VW px wide, scaled up with image-rendering: pixelated): the track is
 * painted pixel by pixel from a distance field, cars / people / cones are pixel templates rotated by nearest
 * neighbour. Sound is WebAudio synthesis (engine, tyres, crash, combo, crowd, siren) and follows Settings > Sound.
 * Career effects go through window.FL_DRIFT (fx, ask, card...). Text is plain English; i18n/ui.tsv translates it.
 */
(() => {
  "use strict";
  const G = typeof window !== "undefined" ? window : globalThis;
  if (G.FL_DTRACK) return;
  const rnd = Math.random;
  const ri = (a, b) => a + Math.floor(rnd() * (b - a + 1));
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const pick = (a) => a[Math.floor(rnd() * a.length)];
  const TAU = Math.PI * 2;
  const wrapA = (a) => {
    while (a > Math.PI) a -= TAU;
    while (a < -Math.PI) a += TAU;
    return a;
  };
  const E = (c) => `emoji/${c}.png`;
  const ICON = "emoji/1f3ce-fe0f.png";
  const VW = 180; // logical canvas width; the height follows the screen
  const RUN = 120; // seconds per session
  const DUEL_RUN = 22; // seconds of a tie-break duel
  const STEP = 5; // spacing of the centre line points (px)
  const NF = 48; // rotation frames per sprite
  const fmt = (n) => Math.round(n).toLocaleString("en-US");
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const seeded = (s) => () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const hs = (x, y) => {
    let h = (x * 374761393 + y * 668265263) | 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
  };

  // ------------------------------------------------------------------ tracks
  const LAYOUTS = {
    port: {
      id: "port", n: "Abandoned Port Lot", W: 560, H: 800, hw: 25, street: true, fee: 0, seed: 7,
      pts: [[100, 730], [420, 730], [490, 670], [430, 610], [220, 600], [160, 540], [220, 480], [420, 470], [480, 410], [420, 350], [230, 340], [170, 290], [210, 230], [380, 200], [440, 140], [380, 80], [180, 80], [80, 150], [60, 300], [65, 500], [60, 650]],
    },
    circuit: {
      id: "circuit", n: "Local Circuit", W: 560, H: 800, hw: 22, street: false, fee: 150, seed: 11,
      pts: [[120, 700], [300, 720], [440, 690], [500, 600], [470, 500], [380, 460], [330, 390], [380, 310], [470, 260], [490, 160], [420, 90], [300, 90], [220, 150], [240, 250], [190, 330], [110, 380], [80, 480], [70, 600]],
    },
  };
  const TRACKS = {};
  function buildTrack(id) {
    if (TRACKS[id]) return TRACKS[id];
    const L = LAYOUTS[id];
    const p = L.pts;
    const n = p.length;
    const raw = [];
    for (let i = 0; i < n; i++) {
      const p0 = p[(i - 1 + n) % n], p1 = p[i], p2 = p[(i + 1) % n], p3 = p[(i + 2) % n];
      for (let s = 0; s < 16; s++) {
        const t = s / 16, t2 = t * t, t3 = t2 * t;
        const f = (a, b, c, d) => 0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
        raw.push([f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1])]);
      }
    }
    const cum = [0];
    for (let i = 1; i <= raw.length; i++) {
      const a = raw[i - 1], b = raw[i % raw.length];
      cum.push(cum[i - 1] + Math.hypot(b[0] - a[0], b[1] - a[1]));
    }
    const tot = cum[raw.length];
    const N = Math.round(tot / STEP);
    const X = new Float32Array(N), Y = new Float32Array(N);
    let j = 0;
    for (let k = 0; k < N; k++) {
      const s = (k * tot) / N;
      while (cum[j + 1] < s) j++;
      const a = raw[j], b = raw[(j + 1) % raw.length], u = (s - cum[j]) / (cum[j + 1] - cum[j] || 1);
      X[k] = a[0] + (b[0] - a[0]) * u;
      Y[k] = a[1] + (b[1] - a[1]) * u;
    }
    const TX = new Float32Array(N), TY = new Float32Array(N), ANG = new Float32Array(N), CV = new Float32Array(N);
    for (let k = 0; k < N; k++) {
      const a = (k - 1 + N) % N, b = (k + 1) % N;
      const dx = X[b] - X[a], dy = Y[b] - Y[a], l = Math.hypot(dx, dy) || 1;
      TX[k] = dx / l;
      TY[k] = dy / l;
      ANG[k] = Math.atan2(dy, dx);
    }
    for (let k = 0; k < N; k++) CV[k] = wrapA(ANG[(k + 3) % N] - ANG[(k - 3 + N) % N]) / 6;
    const W = L.W, H = L.H, hw = L.hw, R = hw + 14;
    const fd = new Float32Array(W * H).fill(1e9);
    const nr = new Uint16Array(W * H);
    for (let i = 0; i < N; i++) {
      const ax = X[i], ay = Y[i], bx = X[(i + 1) % N], by = Y[(i + 1) % N];
      const dx = bx - ax, dy = by - ay, ll = dx * dx + dy * dy || 1;
      const x0 = Math.max(0, Math.floor(Math.min(ax, bx) - R)), x1 = Math.min(W - 1, Math.ceil(Math.max(ax, bx) + R));
      const y0 = Math.max(0, Math.floor(Math.min(ay, by) - R)), y1 = Math.min(H - 1, Math.ceil(Math.max(ay, by) + R));
      for (let y = y0; y <= y1; y++) {
        const py = y + 0.5 - ay;
        for (let x = x0; x <= x1; x++) {
          const px = x + 0.5 - ax;
          let t = (px * dx + py * dy) / ll;
          t = t < 0 ? 0 : t > 1 ? 1 : t;
          const ex = px - dx * t, ey = py - dy * t;
          const d = Math.sqrt(ex * ex + ey * ey);
          const o = y * W + x;
          if (d < fd[o]) {
            fd[o] = d;
            nr[o] = i;
          }
        }
      }
    }
    return (TRACKS[id] = { id, L, N, X, Y, TX, TY, ANG, CV, fd, nr, W, H, hw });
  }
  const fieldAt = (T, x, y) => {
    const xi = x | 0, yi = y | 0;
    if (x < 0 || y < 0 || xi >= T.W || yi >= T.H) return [1e9, 0];
    const o = yi * T.W + xi;
    return [T.fd[o], T.nr[o]];
  };
  const segDiff = (T, a, b) => {
    const N = T.N;
    return ((((a - b) % N) + N + N / 2) % N) - N / 2;
  };
  const along = (T, p, lat) => {
    const N = T.N;
    const f = ((p % N) + N) % N;
    const i = Math.floor(f), k = (i + 1) % N, u = f - i;
    const x = T.X[i] + (T.X[k] - T.X[i]) * u, y = T.Y[i] + (T.Y[k] - T.Y[i]) * u;
    return [x - T.TY[i] * (lat || 0), y + T.TX[i] * (lat || 0), T.ANG[i], i];
  };

  // ------------------------------------------------------------------ palette (dark, muted; cyan only as the accent)
  const HEX = {
    asphalt: "#2a2c31", asphalt2: "#33363b", asphalt3: "#24262a", line: "#c9ccd1", curbR: "#b3261e", curbW: "#d9dbde",
    gravel: "#3b362f", gravel2: "#4a4339", gravel3: "#2f2b25", tyre: "#111214", tyre2: "#34363c",
    grass: "#1b2a1f", grass2: "#1f3123", grass3: "#16231a", leaf: "#244a2c", leaf2: "#2f5e37", leaf3: "#1a3520",
    lot: "#24262b", lot2: "#2c2f34", lot3: "#1f2125", lotLine: "#7d8085", conc: "#2f3136", conc2: "#36383d", seam: "#1f2124",
    stain: "#1a1b1e", bar: "#7d8086", bar2: "#6d7075", barEdge: "#4f5257", chkA: "#d9dbde", chkB: "#121316", cyan: "#27c3d1",
  };
  const pack = (hex, a) => {
    const n = parseInt(hex.slice(1), 7 > hex.length ? 16 : 16);
    return ((((a == null ? 255 : a) & 255) << 24) | ((n & 255) << 16) | (((n >> 8) & 255) << 8) | (n >> 16)) >>> 0;
  };
  const PK = {};
  for (const k in HEX) PK[k] = pack(HEX[k]);
  const shade = (hex, f) => {
    const n = parseInt(hex.slice(1), 16);
    const ch = (v) => clamp(Math.round(f >= 0 ? v + (255 - v) * f : v * (1 + f)), 0, 255);
    return "#" + [n >> 16, (n >> 8) & 255, n & 255].map((v) => ch(v).toString(16).padStart(2, "0")).join("");
  };

  // ------------------------------------------------------------------ world render (pixel by pixel)
  const TREE = ["..ggg..", ".gLggg.", "gLggggd", "ggggdgg", "gggddgg", ".gddgd.", "..ddd.."];
  const CONT = ["#6b3a2a", "#1f4a4f", "#24304a", "#4a4f2a", "#5a2328", "#3d3f46"];
  function worldData(T, doc) {
    if (T.base) return T.base;
    const { W, H, hw, fd, nr, CV, N, X, Y, TX, TY, L } = T;
    const cv = doc.createElement("canvas");
    cv.width = W;
    cv.height = H;
    const id = cv.getContext("2d").createImageData(W, H);
    const buf = new Uint32Array(id.data.buffer);
    const port = L.id === "port";
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const o = y * W + x, d = fd[o], i = nr[o], r = hs(x, y);
        let c;
        if (d <= hw) {
          if (port) {
            const patch = hs(x >> 3, y >> 3) < 0.16;
            c = r < 0.06 ? PK.lot3 : r > 0.95 ? PK.lot2 : patch ? PK.lot2 : PK.lot;
            if (d > hw - 2.5 && d <= hw - 1.5 && (i >> 2) & 1) c = PK.lotLine;
          } else {
            const curb = Math.abs(CV[i]) > 0.03;
            if (curb && d > hw - 4) c = (i >> 1) & 1 ? PK.curbR : PK.curbW;
            else if (!curb && d > hw - 2 && d <= hw - 1) c = PK.line;
            else c = r < 0.07 ? PK.asphalt3 : r > 0.93 ? PK.asphalt2 : PK.asphalt;
          }
          if (i <= 1 || i >= N - 1) {
            const s = (x + 0.5 - X[0]) * TX[0] + (y + 0.5 - Y[0]) * TY[0];
            const q = (x + 0.5 - X[0]) * -TY[0] + (y + 0.5 - Y[0]) * TX[0];
            if (s >= -3 && s < 3) c = ((Math.floor(s + 3) >> 1) + (Math.floor(q + 40) >> 1)) & 1 ? PK.chkA : PK.chkB;
          }
        } else if (d <= hw + 9) {
          if (port) c = r < 0.08 ? PK.conc2 : PK.conc;
          else c = r < 0.18 ? PK.gravel2 : r > 0.86 ? PK.gravel3 : PK.gravel;
        } else if (d <= hw + 12) {
          if (port) c = d <= hw + 10 ? PK.barEdge : (i >> 2) & 1 ? PK.bar : PK.bar2;
          else c = ((x >> 1) + (y >> 1)) % 3 === 0 ? PK.tyre2 : PK.tyre;
        } else if (port) {
          c = x % 32 === 0 || y % 24 === 0 ? PK.seam : hs(x >> 2, y >> 2) < 0.015 ? PK.stain : r < 0.05 ? PK.conc2 : PK.conc;
        } else {
          c = r < 0.035 ? PK.grass3 : (x + y) & 1 ? PK.grass : PK.grass2;
        }
        buf[o] = c;
      }
    }
    // decor, placed with a fixed seed so the map is always the same
    const R = seeded(L.seed);
    const free = (x0, y0, w, h, m) => {
      for (const [x, y] of [[x0, y0], [x0 + w, y0], [x0, y0 + h], [x0 + w, y0 + h], [x0 + w / 2, y0 + h / 2]]) {
        if (x < 2 || y < 2 || x >= W - 2 || y >= H - 2) return false;
        if (fd[(y | 0) * W + (x | 0)] < hw + m) return false;
      }
      return true;
    };
    const put = (x, y, c) => {
      if (x >= 0 && y >= 0 && x < W && y < H) buf[y * W + x] = c;
    };
    const taken = [];
    const clear = (x, y, w, h) => !taken.some((t) => x < t[0] + t[2] + 3 && x + w + 3 > t[0] && y < t[1] + t[3] + 3 && y + h + 3 > t[1]);
    if (port) {
      for (let k = 0; k < 400 && taken.length < 22; k++) {
        const vert = R() < 0.4, w = vert ? 10 : 24, h = vert ? 24 : 10;
        const x = Math.floor(R() * (W - w)), y = Math.floor(R() * (H - h));
        if (!free(x, y, w, h, 20) || !clear(x, y, w, h)) continue;
        taken.push([x, y, w, h]);
        const base = CONT[Math.floor(R() * CONT.length)], c1 = pack(base), c2 = pack(shade(base, -0.3)), c3 = pack(shade(base, 0.15));
        for (let yy = 0; yy < h; yy++)
          for (let xx = 0; xx < w; xx++) {
            const edge = xx === 0 || yy === 0 || xx === w - 1 || yy === h - 1;
            const rib = vert ? yy % 2 === 0 : xx % 2 === 0;
            put(x + xx, y + yy, edge ? c2 : rib ? c3 : c1);
          }
        for (let k2 = 0; k2 < (vert ? h : w); k2++) put(vert ? x + w : x + k2 + 1, vert ? y + k2 + 1 : y + h, PK.seam);
      }
    } else {
      const lc = { g: PK.leaf, L: PK.leaf2, d: PK.leaf3 };
      for (let k = 0; k < 900 && taken.length < 70; k++) {
        const x = Math.floor(R() * (W - 8)), y = Math.floor(R() * (H - 8));
        if (!free(x, y, 7, 7, 18) || !clear(x, y, 7, 7)) continue;
        taken.push([x, y, 7, 7]);
        for (let yy = 0; yy < 7; yy++)
          for (let xx = 0; xx < 7; xx++) if (TREE[yy][xx] !== ".") put(x + xx + 1, y + yy + 1, PK.grass3);
        for (let yy = 0; yy < 7; yy++)
          for (let xx = 0; xx < 7; xx++) {
            const ch = TREE[yy][xx];
            if (ch !== ".") put(x + xx, y + yy, lc[ch]);
          }
      }
    }
    return (T.base = id);
  }

  // ------------------------------------------------------------------ car sprites (front = row 0)
  const SPR = {
    coupe: [".khbbbhk.", "wkbbbbbkw", "wbbblbbbw", ".bbbbbbb.", ".dGgggGd.", ".dgggggd.", ".dbbbbbd.", ".dbblbbd.", ".dgggggd.", ".bbbbbbb.", "wbbbbbbbw", "wbbbbbbbw", ".dbbbbbd.", ".kttbttk."],
    sedan: [".khbbbhk.", "wkbbbbbkw", "wbbblbbbw", ".bbbbbbb.", ".bbbbbbb.", ".dGgggGd.", ".dgggggd.", ".dbbbbbd.", ".dbblbbd.", ".dbbbbbd.", ".dgggggd.", ".bbbbbbb.", "wbbbbbbbw", "wbbbbbbbw", ".dbbbbbd.", ".kttbttk."],
    hatch: [".khbbbhk.", "wkbbbbbkw", "wbbblbbbw", ".dGgggGd.", ".dgggggd.", ".dbbbbbd.", ".dbblbbd.", ".dbbbbbd.", "wdgggggdw", "wbbbbbbbw", ".bbbbbbb.", ".kttbttk."],
    wagon: [".khbbbhk.", "wkbbbbbkw", "wbbblbbbw", ".bbbbbbb.", ".dGgggGd.", ".dgggggd.", ".dbbbbbd.", ".dbklkbd.", ".dbklkbd.", ".dbklkbd.", ".dbbbbbd.", "wbbbbbbbw", "wdgggggdw", ".bbbbbbb.", ".kttbttk."],
    conv: [".khbbbhk.", "wkbbbbbkw", "wbbblbbbw", ".bbbbbbb.", ".dGgggGd.", ".dsskssd.", ".dsskssd.", ".dbbbbbd.", ".dkkkkkd.", ".bbbbbbb.", "wbbbbbbbw", "wbbbbbbbw", ".dbbbbbd.", ".kttbttk."],
    suv: ["kkhbbbhkk", "wbbbbbbbw", "wbbblbbbw", "wbbbbbbbw", "bdGgggGdb", "bdgggggdb", "bdbkbkbdb", "bdbkbkbdb", "bdbkbkbdb", "bdbbbbbdb", "bdgggggdb", "wbbbbbbbw", "wbbbbbbbw", "wbbbbbbbw", "kkttbttkk"],
    truck: ["kkhbbbhkk", "wbbbbbbbw", "wbbblbbbw", "bbbbbbbbb", "bdGgggGdb", "bdbbbbbdb", "bdbbbbbdb", "bdgggggdb", "kkkkkkkkk", "kdddddddk", "kdddddddk", "wdddddddw", "wdddddddw", "kdddddddk", "kkttkttkk"],
    van: [".khbbbhk.", "wbbbbbbbw", "wdGgggGdw", ".dgggggd.", ".dllllld.", ".dbbbbbd.", ".dbbbbbd.", ".dbbbbbd.", ".dbbbbbd.", ".dbbbbbd.", ".dbbbbbd.", "wdbbbbbdw", "wdbbbbbdw", ".dbbbbbd.", ".kttbttk."],
    police: [".khkkkhk.", "wkkkkkkkw", "wkkkkkkkw", ".bbbbbbb.", ".dGgggGd.", ".dgggggd.", ".rrrkuuu.", ".dbbbbbd.", ".dbbbbbd.", ".dgggggd.", ".bbbbbbb.", "wkkkkkkkw", "wkkkkkkkw", ".kkkkkkk.", ".kttkttk."],
  };
  const TYPE_SPR = { coupe: "coupe", convertible: "conv", sedan: "sedan", hatchback: "hatch", wagon: "wagon", "4x4": "suv", suv: "suv", truck: "truck", van: "van" };
  const JDM_MAKES = /nissan|toyota|mazda|subaru|mitsubishi|honda|lexus|infiniti|acura/i;
  function spriteFor(c) {
    const type = String((c && c.type) || "coupe").toLowerCase();
    let rows = SPR[TYPE_SPR[type] || "coupe"].slice();
    const jdm = /^jdm-/.test(String((c && c.sprite) || "")) || (JDM_MAKES.test(String((c && c.make) || "")) && (type === "coupe" || type === "hatchback"));
    if (jdm) rows[rows.length - 2] = "kkkkkkkkk"; // a drift wing: similar to the garage sprite, never the same
    return rows;
  }
  const COLS = {
    white: "#d9dbde", black: "#1d1f23", silver: "#9aa0a8", gray: "#6c7179", grey: "#6c7179", red: "#b3261e", burgundy: "#6e1f2a",
    blue: "#2f5fb3", navy: "#24345e", green: "#2f7a43", olive: "#5f6b2e", yellow: "#e2b21f", mustard: "#b8902a", gold: "#c7a24a",
    orange: "#d8691f", purple: "#6a3fa0", pink: "#d77aa6", beige: "#c9b48f", cream: "#e6dcc0", tan: "#b08a5e", brown: "#6b4a2e",
    seafoam: "#6fbfa3", turquoise: "#27a7b0", teal: "#1f7f86", maroon: "#5a2328", bronze: "#8c5a2b",
  };
  function carHex(c) {
    let k = String((c && c.color) || "").toLowerCase().trim();
    const m = /^jdm-(\d+)$/.exec(String((c && c.sprite) || ""));
    if (!k && m && Array.isArray(G.JDM_CARS)) {
      const def = G.JDM_CARS.find((x) => x.i === +m[1]);
      if (def) k = String(def.color || "").toLowerCase();
    }
    if (/^#[0-9a-f]{6}$/.test(k)) return k;
    if (COLS[k]) return COLS[k];
    const sm = /-([a-z]+)$/.exec(String((c && c.sprite) || ""));
    if (sm && COLS[sm[1]]) return COLS[sm[1]];
    for (const name in COLS) if (k.includes(name)) return COLS[name];
    const s = String((c && (c.model || c.make)) || "car");
    let h = 0;
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
    const v = Object.values(COLS);
    return v[Math.abs(h) % v.length];
  }
  function palette(hex) {
    const dark = parseInt(hex.slice(1, 3), 16) + parseInt(hex.slice(3, 5), 16) + parseInt(hex.slice(5, 7), 16) < 150;
    return {
      b: pack(hex), d: pack(shade(hex, dark ? 0.12 : -0.28)), l: pack(shade(hex, dark ? 0.28 : 0.3)), k: pack("#121316"), g: pack("#22303b"),
      G: pack("#4b6474"), h: pack("#e9e3b4"), t: pack("#a3231b"), w: pack("#0a0a0b"), s: pack("#3b2b23"), r: pack("#5a1512"), u: pack("#1c2b5a"),
    };
  }
  const SHADOW = pack("#050607", 120);
  function frames(doc, rows, pal) {
    const h = rows.length, w = rows[0].length, S2 = 21, f = [], s = [];
    for (let k = 0; k < NF; k++) {
      const th = (k / NF) * TAU, co = Math.cos(th), si = Math.sin(th);
      const a = doc.createElement("canvas"), b = doc.createElement("canvas");
      a.width = a.height = b.width = b.height = S2;
      const ac = a.getContext("2d"), bc = b.getContext("2d");
      const ai = ac.createImageData(S2, S2), bi = bc.createImageData(S2, S2);
      const ab = new Uint32Array(ai.data.buffer), bb = new Uint32Array(bi.data.buffer);
      for (let y = 0; y < S2; y++)
        for (let x = 0; x < S2; x++) {
          const u = x + 0.5 - S2 / 2, v = y + 0.5 - S2 / 2;
          const col = Math.floor(u * co + v * si + w / 2), row = Math.floor(-u * si + v * co + h / 2);
          if (col < 0 || row < 0 || col >= w || row >= h) continue;
          const ch = rows[row][col];
          if (ch === ".") continue;
          ab[y * S2 + x] = pal[ch];
          bb[y * S2 + x] = SHADOW;
        }
      ac.putImageData(ai, 0, 0);
      bc.putImageData(bi, 0, 0);
      f.push(a);
      s.push(b);
    }
    return { f, s, S: S2 };
  }
  const frameIdx = (h) => ((Math.round(((h + Math.PI / 2) / TAU) * NF) % NF) + NF) % NF;

  // ------------------------------------------------------------------ 3x5 pixel font (numbers, x, +, -, GO)
  const FONT = {
    0: "111101101101111", 1: "010110010010111", 2: "111001111100111", 3: "111001111001111", 4: "101101111001001",
    5: "111100111001111", 6: "111100111101111", 7: "111001010010010", 8: "111101111101111", 9: "111101111001111",
    x: "000101010101000", "+": "000010111010000", "-": "000000111000000", G: "111100101101111", O: "111101101101111", ",": "000000000010100",
  };
  function ptext(ctx, str, x, y, col, sc) {
    sc = sc || 1;
    const w = str.length * 4 * sc - sc;
    let cx = Math.round(x - w / 2);
    y = Math.round(y);
    for (const ch of str) {
      const g = FONT[ch];
      if (g) {
        ctx.fillStyle = "#0b0c0e";
        for (let i = 0; i < 15; i++) if (g[i] === "1") ctx.fillRect(cx + (i % 3) * sc + sc, y + ((i / 3) | 0) * sc + sc, sc, sc);
        ctx.fillStyle = col;
        for (let i = 0; i < 15; i++) if (g[i] === "1") ctx.fillRect(cx + (i % 3) * sc, y + ((i / 3) | 0) * sc, sc, sc);
      }
      cx += 4 * sc;
    }
  }

  // ------------------------------------------------------------------ physics
  function specFor(c, rating, skill, d) {
    const t = (c && c.dt) || {};
    const ctl = clamp(Number(d && d.ctl) || 0, 0, 100) / 100, ref = clamp(Number(d && d.ref) || 0, 0, 100) / 100, phy = clamp(Number(d && d.phy) || 0, 0, 100) / 100;
    const type = String((c && c.type) || "coupe").toLowerCase();
    const heavy = /suv|4x4|truck|van/.test(type) ? 1 : 0;
    const cond = Number.isFinite(Number(c && c.cond)) ? Number(c.cond) : 90;
    const jdm = /^jdm-/.test(String((c && c.sprite) || "")) || JDM_MAKES.test(String((c && c.make) || ""));
    return {
      vmax: 128 + rating * 0.32 + (t.turbo || 0) * 3 - heavy * 14,
      power: (100 + rating * 0.6 + (t.turbo || 0) * 6) * (0.72 + cond / 360) * (heavy ? 0.85 : 1),
      brake: 220,
      grip: 13 + (t.tires || 0) * 0.5 + (t.susp || 0) * 0.3 - heavy * 2,
      turn: 2.1 + (t.susp || 0) * 0.07 + skill / 220 - heavy * 0.35,
      ease: clamp(0.2 + (t.diff || 0) * 0.12 + (jdm ? 0.15 : 0), 0, 1),
      assist: clamp(skill / 100 + ctl * 0.2, 0.1, 1),
      ctl, // control: grip, how fast the tail comes back, countersteer help
      ref, // reflexes: how fast the car answers the wheel
      phy, // fitness: how little you tire over the session
      fat: 0,
    };
  }
  /* c: {x,y,h,vx,vy,w,slide}; inp: {thr,brk,hb,steer}; env: {off,oil,gripMul,powerMul} */
  function stepCar(c, P, inp, env, dt) {
    const ch = Math.cos(c.h), sh = Math.sin(c.h);
    let vf = c.vx * ch + c.vy * sh;
    let vr = -c.vx * sh + c.vy * ch;
    const spd = Math.hypot(vf, vr);
    const slip = spd > 6 ? Math.atan2(vr, Math.abs(vf)) : 0;
    const pm = env.powerMul;
    const vmax = P.vmax * Math.sqrt(pm) * (env.off ? 0.6 : 1);
    let a = 0;
    if (inp.thr) a += P.power * pm * Math.max(0, 1 - vf / vmax);
    if (inp.brk) a -= vf > 4 ? P.brake : vf > -40 ? P.power * 0.5 : 0;
    if (inp.hb && vf > 0) a -= 60;
    vf += a * dt;
    if (!inp.thr && !inp.brk && Math.abs(vf) < 3) vf = 0;
    // the rear lets go: handbrake, power over at speed, oil; throttle keeps a slide alive
    let tgt = 0;
    if (inp.hb && spd > 25) tgt = 1;
    else if (inp.thr && Math.abs(inp.steer) > 0.35 && spd > P.vmax * (0.5 - P.ease * 0.3)) tgt = 0.5 + P.ease * 0.5;
    if (c.slide > 0.25 && inp.thr && Math.abs(slip) > 0.18 && spd > 30) tgt = Math.max(tgt, 0.55 + P.ease * 0.35);
    if (env.oil) tgt = 1;
    c.slide += (tgt - c.slide) * Math.min(1, dt * (tgt > c.slide ? 5 : 3 + 2 * P.ctl)); // tail comes out quick, control brings it back
    const grip = P.grip * (0.92 + 0.2 * P.ctl) * (1 - P.fat) * (1 - 0.78 * c.slide) * env.gripMul;
    const dv = vr * (1 - Math.exp(-grip * dt));
    vr -= dv;
    if (vf < vmax * 1.02 && !env.off) vf += Math.abs(dv) * 0.6 * (vf >= 0 ? 1 : -1); // sideways speed turns into forward speed on exit, no bleed
    const drag = env.off ? 1.4 : (0.22 + (inp.thr ? 0 : 0.3)) * (1 - 0.6 * c.slide);
    const k = Math.exp(-drag * dt);
    vf *= k;
    vr *= k;
    // yaw: steering, plus the tail stepping out when you stay on the power (countersteer to hold it)
    const sf = Math.min(1, spd / 40) * (vf >= 0 ? 1 : -1);
    let tw = inp.steer * P.turn * sf * (1 + 0.35 * c.slide);
    tw += -Math.sin(slip) * c.slide * (inp.thr ? 2.2 : 1) * Math.min(1, spd / 60) * (0.8 + 0.5 * P.ctl);
    if (Math.abs(slip) > 1.1) tw += Math.sign(slip) * P.assist * 1.5;
    tw = clamp(tw, -2.3, 2.3); // no snap-spins
    c.w += (tw - c.w) * Math.min(1, dt * (5.6 + 3 * P.ref) * (1 - P.fat)); // yaw eases in, smooth like the AI drivers
    c.vx = vf * ch - vr * sh;
    c.vy = vf * sh + vr * ch;
    c.h = wrapA(c.h + c.w * dt);
    c.x += c.vx * dt;
    c.y += c.vy * dt;
    c.slip = slip;
    c.spd = spd;
    c.vf = vf;
  }

  // ------------------------------------------------------------------ session
  function newSession(layId, o) {
    const T = buildTrack(layId);
    const L = T.L;
    const si = T.N - 6;
    const c = { x: T.X[si], y: T.Y[si], h: T.ANG[si], vx: 0, vy: 0, w: 0, slide: 0, slip: 0, spd: 0, vf: 0 };
    const S = {
      T, lay: L, car: c, spec: specFor(o.car, o.rating || 50, o.skill || 40, o.d), d: o.d || {}, carObj: o.car, F: o.F,
      inp: { l: false, r: false, u: false, d: false, hb: false }, steer: 0,
      mode: o.mode || "solo", opps: [], skillV: o.skill || 40, phase: "count", cd: 3.2, t: 0, dur: RUN, idx: si, half: false, laps: 0,
      score: 0, chain: 0, mult: 1, lvl: 1, dtime: 0, idle: 0, offT: 0, lastSign: 0, best: 0, maxAng: 0, hits: 0, lastPts: 0,
      drifting: false, off: false, zone: 1, ptsMul: 1, gripMul: 1, powerMul: 1, onOil: false, rain: false, siren: false, crowdNear: false, crowdOn: false,
      acts: [], f: {}, rows: [], evAt: [], evUsed: [], parts: [], pops: [], drops: [], shake: 0, rpm: 0.2, cam: { x: c.x, y: c.y },
      toast: () => {}, au: () => {}, mark: null, busted: false, arrest: false, cond: Number.isFinite(Number(o.car && o.car.cond)) ? Number(o.car.cond) : 90,
    };
    const times = [ri(18, 26), ri(52, 62), ri(88, 100)];
    S.evAt = times;
    return S;
  }
  const addF = (S, f) => {
    for (const k in f) S.f[k] = (S.f[k] || 0) + f[k];
  };
  const lose = (S, why) => {
    if (S.chain > 0) {
      S.toast(why);
      S.au("lose");
    }
    S.chain = 0;
    S.mult = 1;
    S.lvl = 1;
    S.dtime = 0;
    S.idle = 0;
    S.lastSign = 0;
  };
  const bank = (S) => {
    if (S.chain < 1) return;
    const v = Math.round(S.chain);
    S.score += v;
    if (v > S.best) S.best = v;
    S.pops.push({ x: S.car.x, y: S.car.y - 10, txt: "+" + v, col: HEX.cyan, t: 1.2 });
    S.au("bank");
    S.chain = 0;
    S.mult = 1;
    S.lvl = 1;
    S.dtime = 0;
    S.idle = 0;
    S.lastSign = 0;
  };
  function scoreTick(S, dt) {
    const c = S.car;
    const deg = Math.abs(c.slip) * 57.3;
    S.drifting = !S.off && c.slide > 0.25 && deg > 15 && deg < 105 && c.spd > 35;
    S.lastPts = 0;
    if (S.drifting) {
      S.dtime += dt;
      S.idle = 0;
      const sg = Math.sign(c.slip);
      if (S.lastSign && sg !== S.lastSign && S.dtime > 0.4) {
        S.mult = Math.min(8, S.mult + 1);
        S.toast("Transition!");
        S.au("combo");
      }
      S.lastSign = sg;
      const lvl = 1 + Math.floor(S.dtime / 1.6);
      if (lvl > S.lvl) {
        S.lvl = lvl;
        if (S.mult < 8) {
          S.mult++;
          S.pops.push({ x: c.x, y: c.y - 12, txt: "x" + S.mult, col: "#ffffff", t: 0.9 });
          S.au("combo");
        }
      }
      const pts = ((deg - 10) * c.spd) / 14 * dt * S.mult * S.zone * S.ptsMul * (S.d && S.d.co ? 1.1 : 1);
      S.chain += pts;
      S.lastPts = pts;
      if (deg > S.maxAng) S.maxAng = deg;
    } else if (S.chain > 0) {
      S.idle += dt;
      if (S.idle > 0.8) bank(S);
    }
    if (Math.abs(c.slip) > 2 && S.chain > 0) lose(S, "Spin out");
    if (S.off) {
      S.offT += dt;
      if (S.offT > 0.35 && S.chain > 0) lose(S, "Off track");
    } else S.offT = 0;
  }
  function collide(S) {
    const T = S.T, c = S.car, hw = T.hw;
    let [d, i] = fieldAt(T, c.x, c.y);
    S.off = d > hw + 2;
    if (d <= hw + 9) return 0; // wall sits a bit further out
    if (d >= 1e8) {
      // out of the field (should not happen): put the car back on the line
      const p = along(T, S.idx, 0);
      c.x = p[0];
      c.y = p[1];
      c.vx *= 0.3;
      c.vy *= 0.3;
      return 0;
    }
    const ax = T.X[i], ay = T.Y[i], bx = T.X[(i + 1) % T.N], by = T.Y[(i + 1) % T.N];
    const dx = bx - ax, dy = by - ay, ll = dx * dx + dy * dy || 1;
    let t = ((c.x - ax) * dx + (c.y - ay) * dy) / ll;
    t = clamp(t, 0, 1);
    const qx = ax + dx * t, qy = ay + dy * t;
    let nx = c.x - qx, ny = c.y - qy;
    const nl = Math.hypot(nx, ny) || 1;
    nx /= nl;
    ny /= nl;
    c.x = qx + nx * (hw + 9);
    c.y = qy + ny * (hw + 9);
    const vn = c.vx * nx + c.vy * ny;
    if (vn > 0) {
      c.vx -= nx * vn * 1.15; // scrape along the wall instead of bouncing off it
      c.vy -= ny * vn * 1.15;
      c.vx *= 0.93;
      c.vy *= 0.93;
      c.w *= 0.8;
    }
    if (vn > 38 && (S.hitCd || 0) <= 0) {
      S.hitCd = 0.5;
      S.hits++;
      S.hitT = S.t;
      S.shake = Math.min(4, 1 + vn / 25);
      S.au("crash", Math.min(1, vn / 90));
      for (let k = 0; k < 8; k++) S.parts.push({ x: c.x + nx * 4, y: c.y + ny * 4, vx: (rnd() - 0.5) * 60 + nx * 30, vy: (rnd() - 0.5) * 60 + ny * 30, life: 0.3, max: 0.3, spark: true });
      lose(S, "Wall!");
    }
    return vn;
  }
  function envOf(S) {
    const off = S.off;
    return { off, oil: S.onOil, gripMul: S.gripMul * (off ? 0.6 : 1) * (S.rain ? 1 : 1), powerMul: S.powerMul };
  }
  function tick(S, dt) {
    const T = S.T, c = S.car;
    if (S.hitCd > 0) S.hitCd -= dt;
    const ti = (S.inp.r ? 1 : 0) - (S.inp.l ? 1 : 0);
    const rf = 0.85 + 0.5 * S.spec.ref;
    S.spec.fat = (1 - S.spec.phy) * clamp(S.t / S.dur, 0, 1) * 0.3; // tired drivers lose grip and response toward the end
    const sr = rf * (ti !== 0 && Math.sign(ti) === Math.sign(S.steer || ti) ? 5.5 : 7); // turn in slow, recenter a bit faster
    S.steer += clamp(ti - S.steer, -dt * sr, dt * sr);
    S.zone = 1;
    S.onOil = false;
    S.siren = false;
    S.crowdNear = false;
    for (const a of S.acts) if (!a.gone && a.upd) a.upd(S, dt);
    S.acts = S.acts.filter((a) => !a.gone || a.keep);
    stepCar(c, S.spec, { thr: S.inp.u, brk: S.inp.d, hb: S.inp.hb, steer: S.steer }, envOf(S), dt);
    collide(S);
    const [, i] = fieldAt(T, c.x, c.y);
    if (S.idx > T.N * 0.4 && S.idx < T.N * 0.6) S.half = true;
    if (S.half && S.idx > T.N * 0.85 && i < T.N * 0.15) {
      S.laps++;
      S.half = false;
      S.toast("Lap " + S.laps);
    }
    S.idx = i;
    // co-driver calls the next sharp bend before you get to it
    if (S.d && S.d.co && S.phase === "run") {
      S.coCd = (S.coCd || 0) - dt;
      if (S.coCd <= 0 && Math.abs(T.CV[i]) < 0.02) {
        let best = 0;
        for (let k = 22; k <= 40; k += 3) {
          const v = T.CV[(i + k) % T.N];
          if (Math.abs(v) > Math.abs(best)) best = v;
        }
        if (Math.abs(best) > 0.04) {
          S.toast((Math.abs(best) > 0.07 ? "Hard " : "") + (best > 0 ? "right" : "left") + " · " + S.d.co.name.split(" ")[0]);
          S.coCd = 2.2;
        }
      }
    }
    scoreTick(S, dt);
    S.t += dt;
  }

  // ------------------------------------------------------------------ events (decisions with real consequences)
  const FIRST = ["Kenji", "Daichi", "Ryo", "Haruto", "Sota", "Kaito", "Yuma", "Ren", "Shin", "Naoki", "Hiro", "Akira"];
  const LAST = ["Tanaka", "Sato", "Mori", "Kondo", "Ishii", "Fujita", "Okada", "Kimura", "Aoki", "Matsuda", "Endo", "Ota"];
  const NICK = ["Ghost", "Smoke", "Viper", "Midnight", "Tofu", "Raijin", "Oni", "Fox", "Shadow", "Storm"];
  const CLOTH = ["#b3261e", "#27c3d1", "#e2a31f", "#d9dbde", "#4c7a3a", "#7a4aa0", "#2f5fb3", "#c46a2b", "#1d1f23"];
  const SKIN = ["#e0b48c", "#b07a52", "#7a4e2e", "#f0c8a0"];
  const money = (n) => (typeof G.usd === "function" ? G.usd(n) : "$" + Math.round(n).toLocaleString("en-US"));
  const price = (n) => (!n ? 0 : typeof G.localPrice === "function" ? G.localPrice(n) : n);
  const near = (S, x, y, r) => Math.hypot(S.car.x - x, S.car.y - y) < r;
  const free = (S, x, y, m) => {
    const [d] = fieldAt(S.T, x, y);
    return d > S.T.hw + m && d < 1e8;
  };

  function spawnCrowd(S) {
    const T = S.T, ppl = [];
    for (let k = 18; k < 64; k += 2)
      for (const side of [-1, 1]) {
        if (rnd() < 0.35) continue;
        const p = along(T, S.idx + k, side * (T.hw + 15 + rnd() * 6));
        if (!free(S, p[0], p[1], 13)) continue;
        ppl.push({ x: p[0] | 0, y: p[1] | 0, c: pick(CLOTH), s: pick(SKIN), ph: rnd() * TAU });
      }
    if (!ppl.length) return null;
    const a = {
      id: "party", ppl, pts: 0, keep: true,
      upd(S2) {
        S2.crowdOn = true;
        let hot = false;
        for (const q of this.ppl)
          if (near(S2, q.x, q.y, 48)) {
            hot = true;
            break;
          }
        S2.crowdNear = hot;
        if (hot && S2.drifting) {
          S2.zone = Math.max(S2.zone, 2);
          this.pts += S2.lastPts;
        }
      },
      draw(ctx, S2, ox, oy, t) {
        for (const q of this.ppl) {
          const x = q.x - ox, y = q.y - oy;
          if (x < -4 || y < -6 || x > VW + 4 || y > S2.VH + 6) continue;
          const jump = S2.crowdNear && S2.drifting && Math.sin(t * 14 + q.ph) > 0 ? 1 : 0;
          ctx.fillStyle = "#08090b";
          ctx.fillRect(x, y + 3, 3, 1);
          ctx.fillStyle = q.c;
          ctx.fillRect(x, y + 1 - jump, 2, 2);
          ctx.fillStyle = q.s;
          ctx.fillRect(x, y - jump, 1, 1);
          if (jump) ctx.fillRect(x + 2, y - 1, 1, 1);
          if (S2.crowdNear && rnd() < 0.01) {
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(x + 1, y - 1, 1, 1);
          }
        }
      },
      end(S2) {
        const tips = Math.min(2000, Math.round(this.pts / 10));
        const f = { fol: Math.round(this.pts / 18), heat: S2.lay.street ? 8 : 3, rep: this.pts > 4000 ? 3 : this.pts > 1000 ? 2 : 0 };
        if (tips >= 20) {
          f.money = tips;
          S2.rows.push(["Tips from the crowd", money(price(tips))]);
        } else S2.rows.push(["Party crowd", "Not impressed"]);
        addF(S2, f);
      },
    };
    S.acts.push(a);
    return a;
  }
  function spawnPolice(S) {
    const d = S.d;
    const a = {
      id: "police", p: S.idx - 40, t: 0, x: 0, y: 0, h: 0, keep: false,
      upd(S2, dt) {
        this.t += dt;
        const T = S2.T;
        if (segDiff(T, this.p, S2.idx) < -70) this.p = S2.idx - 60;
        const v = 112 + (d.heat || 0) * 0.35 + (d.stage || 0) * 6 + Math.min(30, this.t * 2);
        this.p += (v * dt) / STEP;
        const q = along(T, this.p, 0);
        this.x = q[0];
        this.y = q[1];
        this.h = q[2];
        S2.siren = true;
        if (Math.hypot(S2.car.x - this.x, S2.car.y - this.y) < 12) {
          this.gone = true;
          S2.busted = true;
          const fine = ri(600, 1400), tow = 400;
          addF(S2, { money: -(fine + tow), heat: 15, rep: -2, cond: -5, hap: -4 });
          S2.rows.push(["Fine", "-" + money(price(fine))], ["Tow and impound", "-" + money(price(tow))]);
          if ((d.heat || 0) + 15 >= 70 && rnd() < 0.45) S2.arrest = true;
          S2.au("crash", 0.5);
          S2.end && S2.end("busted");
          return;
        }
        if (this.t >= 15) {
          this.gone = true;
          addF(S2, { rep: 4, heat: 10, fol: 200 });
          S2.rows.push(["Police chase", "Escaped"]);
          S2.toast("You lost them!");
          S2.au("bank");
        }
      },
      draw(ctx, S2, ox, oy, t) {
        const sp = S2.spr && S2.spr.pol[Math.floor(t * 5) & 1];
        if (sp) drawSprite(ctx, sp, this.x - ox, this.y - oy, this.h);
      },
      end(S2) {
        if (!this.gone) {
          addF(S2, { rep: 3, heat: 10, fol: 150 });
          S2.rows.push(["Police chase", "Escaped"]);
        }
      },
    };
    S.acts.push(a);
    return a;
  }
  function spawnRival(S, name, stake) {
    const col = pick(Object.values(COLS));
    const a = {
      id: "rival", name, stake, p: S.idx + 9, t: 0, close: 0, x: 0, y: 0, h: 0, col, keep: true, res: null,
      upd(S2, dt) {
        if (this.res) return;
        this.t += dt;
        const T = S2.T;
        const gap = segDiff(T, this.p, S2.idx);
        const v = clamp(S2.car.spd * 0.95 + (8 - gap) * 6, 70, 150);
        this.p += (v * dt) / STEP;
        const q = along(T, this.p, 0);
        this.x = q[0];
        this.y = q[1];
        const cv = T.CV[q[3]];
        this.h = q[2] + clamp(cv * 45, -0.75, 0.75);
        if (Math.abs(cv) > 0.02 && rnd() < 0.5) puff(S2, this.x - Math.cos(this.h) * 5, this.y - Math.sin(this.h) * 5);
        const dd = Math.hypot(S2.car.x - this.x, S2.car.y - this.y);
        if (S2.drifting && dd < 50 && gap > 0) {
          this.close += dt;
          S2.zone = Math.max(S2.zone, 1.5);
        }
        if (this.t >= 16) this.finish(S2);
      },
      finish(S2) {
        if (this.res) return;
        const win = this.close >= 5;
        this.res = win ? "Won" : "Lost";
        S2.toast(win ? "Tandem won!" : "Tandem lost");
        S2.au(win ? "bank" : "lose");
        const f = win ? { rep: 3, fol: 200 } : { rep: -1 };
        if (this.stake) f.money = win ? this.stake : -this.stake;
        addF(S2, f);
        S2.rows.push(["Tandem vs " + this.name, this.res]);
      },
      draw(ctx, S2, ox, oy) {
        if (this.res || !S2.spr) return;
        if (!this.spr) this.spr = frames(S2.doc, SPR.coupe.map((r, i, arr) => (i === arr.length - 2 ? "kkkkkkkkk" : r)), palette(this.col));
        drawSprite(ctx, this.spr, this.x - ox, this.y - oy, this.h);
      },
      end(S2) {
        this.finish(S2);
      },
    };
    S.acts.push(a);
    return a;
  }

  // ------------------------------------------------------------------ opponents (mode "vs"): 3 drivers sliding the same track
  const OPP_PRIZE = [2, 1, 0, -1];
  function spawnOpponents(S, n) {
    const T = S.T;
    const used = [];
    for (let k = 0; k < n; k++) {
      let col = pick(Object.values(COLS));
      for (let g = 0; g < 6 && used.includes(col); g++) col = pick(Object.values(COLS));
      used.push(col);
      const tgt = (3800 + S.skillV * 170) * (0.75 + rnd() * 0.55); // points they will make over a whole session
      const a = {
        id: "opp", name: pick(NICK) + " " + pick(LAST), col, keep: true, score: 0, tgt,
        p: S.idx + 5 * (k + 1), lat: k % 2 ? -7 : 7, spd: 84 + S.skillV * 0.32 + rnd() * 10, slow: 0, x: 0, y: 0, h: 0,
        upd(S2, dt) {
          if (S2.phase !== "run") return;
          const i = ((Math.round(this.p) % T.N) + T.N) % T.N;
          const cv = T.CV[i], curve = Math.abs(cv);
          if (this.slow > 0) this.slow -= dt;
          else if (rnd() < dt * 0.012) this.slow = 1.6; // a mistake: lifts and loses ground
          const v = this.spd * (1 - clamp(curve * 9, 0, 0.35)) * (this.slow > 0 ? 0.55 : 1);
          this.p += (v * dt) / STEP;
          const q = along(T, this.p, this.lat);
          this.x = q[0];
          this.y = q[1];
          this.h = q[2] + clamp(Math.sign(cv) * Math.min(curve * 45, 0.75), -0.75, 0.75);
          this.score += (this.tgt / RUN) * (curve > 0.02 ? 1.4 : 0.25) * dt;
          if (curve > 0.02 && rnd() < 0.5) puff(S2, this.x - Math.cos(this.h) * 5, this.y - Math.sin(this.h) * 5);
          const c = S2.car, dx = c.x - this.x, dy = c.y - this.y, dd = Math.hypot(dx, dy);
          if (dd < 11 && dd > 0.01) { // door to door contact: both lose a little speed
            c.vx += (dx / dd) * 36;
            c.vy += (dy / dd) * 36;
            S2.shake = Math.max(S2.shake, 2);
            this.slow = Math.max(this.slow, 0.5);
          }
        },
        draw(ctx, S2, ox, oy) {
          if (!S2.spr) return;
          if (!this.spr) this.spr = frames(S2.doc, SPR.coupe.map((r, i, arr) => (i === arr.length - 2 ? "kkkkkkkkk" : r)), palette(this.col));
          drawSprite(ctx, this.spr, this.x - ox, this.y - oy, this.h);
        },
      };
      const q0 = along(T, a.p, a.lat);
      a.x = q0[0]; a.y = q0[1]; a.h = q0[2];
      S.acts.push(a);
      S.opps.push(a);
    }
  }
  const rankOf = (S) => {
    const me = S.score + S.chain;
    return 1 + S.opps.filter((o) => o.score > me).length;
  };
  function spawnPhoto(S, pay) {
    const T = S.T;
    let best = S.idx + 30, bc = 0;
    for (let k = 25; k < 75; k++) {
      const i = (S.idx + k) % T.N;
      if (Math.abs(T.CV[i]) > bc) {
        bc = Math.abs(T.CV[i]);
        best = S.idx + k;
      }
    }
    const z = along(T, best, 0);
    let ph = null;
    for (const side of [1, -1]) {
      const q = along(T, best, side * (T.hw + 15));
      if (free(S, q[0], q[1], 12)) {
        ph = q;
        break;
      }
    }
    if (!ph) ph = along(T, best, T.hw + 15);
    const a = {
      id: "photo", zx: z[0], zy: z[1], px: ph[0] | 0, py: ph[1] | 0, inside: false, was: false, bestAng: 0, fail: false, flash: 0, res: null, pay, keep: true,
      upd(S2, dt) {
        if (this.res) return;
        const inz = near(S2, this.zx, this.zy, 48);
        if (inz) {
          this.was = true;
          if (S2.drifting) {
            this.bestAng = Math.max(this.bestAng, Math.abs(S2.car.slip) * 57.3);
            S2.zone = Math.max(S2.zone, 1.3);
            this.flash -= dt;
            if (this.flash <= 0) {
              this.flash = 0.45;
              this.lit = 0.08;
            }
          }
          if (S2.hitT != null && S2.t - S2.hitT < 0.05) this.fail = true;
        } else if (this.was) this.finish(S2);
        if (this.lit > 0) this.lit -= dt;
      },
      finish(S2) {
        if (this.res) return;
        const f = {};
        if (this.fail) {
          this.res = "Viral crash clip";
          Object.assign(f, { fol: 250, rep: -2 });
        } else if (this.bestAng >= 40) {
          this.res = "Perfect clip";
          Object.assign(f, { fol: 500 + Math.round(this.bestAng * 12), rep: 2 });
        } else if (this.bestAng >= 18) {
          this.res = "Decent clip";
          f.fol = 200;
        } else {
          this.res = "Boring clip";
          f.fol = 20;
        }
        if (this.pay) f.money = this.pay;
        addF(S2, f);
        S2.rows.push(["Streamer", this.res]);
        S2.toast(this.res);
      },
      draw(ctx, S2, ox, oy) {
        const x = this.px - ox, y = this.py - oy;
        ctx.fillStyle = "#08090b";
        ctx.fillRect(x - 1, y + 3, 5, 1);
        ctx.fillStyle = "#3d3f46";
        ctx.fillRect(x + 2, y + 1, 1, 2);
        ctx.fillStyle = "#1d1f23";
        ctx.fillRect(x, y + 1, 2, 2);
        ctx.fillStyle = "#e0b48c";
        ctx.fillRect(x, y, 1, 1);
        ctx.fillStyle = "#121316";
        ctx.fillRect(x + 2, y, 2, 1);
        if (this.lit > 0) {
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(x + 3, y - 1, 2, 2);
        }
        if (!this.res) {
          // corner brackets around the target area
          const zx = Math.round(this.zx - ox), zy = Math.round(this.zy - oy), r = 30;
          ctx.fillStyle = HEX.cyan;
          for (const [sx, sy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
            ctx.fillRect(zx + sx * r - (sx > 0 ? 3 : 0), zy + sy * r, 4, 1);
            ctx.fillRect(zx + sx * r, zy + sy * r - (sy > 0 ? 3 : 0), 1, 4);
          }
        }
      },
      end(S2) {
        if (!this.res && this.was) this.finish(S2);
        else if (!this.res) S2.rows.push(["Streamer", "Missed the corner"]);
      },
    };
    S.acts.push(a);
    return a;
  }
  function spawnOil(S) {
    const T = S.T, blobs = [];
    for (const k of [22, 31, 40]) {
      const q = along(T, S.idx + k, (rnd() - 0.5) * T.hw * 0.7);
      const r = ri(6, 9), px = [];
      for (let y = -r; y <= r; y++)
        for (let x = -r; x <= r; x++) if (x * x + y * y <= r * r * (0.7 + hs(x + k, y) * 0.5)) px.push([x, y]);
      blobs.push({ x: q[0] | 0, y: q[1] | 0, r, px });
    }
    const a = {
      id: "oil", blobs, oilT: 0, keep: true,
      upd(S2, dt) {
        let on = false;
        for (const b of this.blobs) if (near(S2, b.x, b.y, b.r)) on = true;
        if (on) {
          S2.onOil = true;
          this.oilT = 1;
        } else this.oilT -= dt;
        if (this.oilT > 0 && S2.drifting) S2.zone = Math.max(S2.zone, 1.5);
      },
      draw(ctx, S2, ox, oy) {
        for (const b of this.blobs) {
          ctx.fillStyle = "#0d0e10";
          for (const [x, y] of b.px) ctx.fillRect(b.x + x - ox, b.y + y - oy, 1, 1);
          ctx.fillStyle = "#3b2f4a";
          ctx.fillRect(b.x - ox - 2, b.y - oy - 2, 2, 1);
          ctx.fillStyle = "#2a3a3f";
          ctx.fillRect(b.x - ox + 1, b.y - oy + 1, 2, 1);
        }
      },
    };
    S.acts.push(a);
    return a;
  }
  function spawnCones(S) {
    const T = S.T, cones = [];
    for (let k = 0; k < 6; k++) {
      const q = along(T, S.idx + 26 + k * 7, (k % 2 ? 1 : -1) * T.hw * 0.35);
      cones.push({ x: q[0], y: q[1], hit: false, pass: false, vx: 0, vy: 0 });
    }
    const a = {
      id: "cones", cones, passed: 0, hitN: 0, keep: true,
      upd(S2, dt) {
        for (const c of this.cones) {
          if (c.hit) {
            c.x += c.vx * dt;
            c.y += c.vy * dt;
            c.vx *= 0.9;
            c.vy *= 0.9;
            continue;
          }
          const dd = Math.hypot(S2.car.x - c.x, S2.car.y - c.y);
          if (dd < 5) {
            c.hit = true;
            c.vx = S2.car.vx * 0.7;
            c.vy = S2.car.vy * 0.7;
            this.hitN++;
            lose(S2, "Cone hit");
          } else if (!c.pass && dd < 16 && S2.drifting) {
            c.pass = true;
            this.passed++;
            S2.chain += 300 * S2.mult;
            S2.pops.push({ x: c.x, y: c.y - 6, txt: "+" + 300 * S2.mult, col: "#e07a1f", t: 0.8 });
            S2.au("combo");
          }
        }
      },
      draw(ctx, S2, ox, oy) {
        for (const c of this.cones) {
          const x = Math.round(c.x - ox), y = Math.round(c.y - oy);
          ctx.fillStyle = "#08090b";
          ctx.fillRect(x, y + 1, 3, 1);
          ctx.fillStyle = c.hit ? "#8a4a1a" : "#e07a1f";
          ctx.fillRect(x - 1, y - 1, 3, 2);
          ctx.fillStyle = "#d9dbde";
          ctx.fillRect(x, y - 1, 1, 1);
        }
      },
      end(S2) {
        S2.rows.push(["Gymkhana", this.passed + "/6"]);
        addF(S2, this.passed >= 4 ? { ctl: 2, fol: 120 } : this.passed >= 2 ? { ctl: 1 } : {});
      },
    };
    S.acts.push(a);
    return a;
  }
  function puff(S, x, y, dark) {
    if (S.parts.length > 260) return;
    S.parts.push({ x: x + (rnd() - 0.5) * 2, y: y + (rnd() - 0.5) * 2, vx: (rnd() - 0.5) * 14, vy: (rnd() - 0.5) * 14, life: 0.6 + rnd() * 0.5, max: 1.1, dark });
  }

  // [id, weight(S, d), run(S, d, ask, done)]
  const EVENTS = [
    { id: "party", icon: E("1f389"), w: (S) => (S.lay.street ? 3 : 1.4), run(S, d, ask, done) {
      ask("Underground party", "A warehouse door rolls up and half the city walks out. A crowd lines the next corners with their phones up.", [
        ["Put on a show", () => {
          if (!spawnCrowd(S)) S.rows.push(["Party crowd", "Not impressed"]);
          else S.toast("Drift in front of the crowd!");
          done();
        }],
        ["Keep it low-key", () => {
          addF(S, { heat: -3 });
          S.rows.push(["Party", "Skipped"]);
          done();
        }],
      ], [["Bonus", "x2 points near the crowd"]], this.icon);
    } },
    { id: "police", icon: E("1f6a8"), w: (S, d) => (S.lay.street ? 2.5 + (d.heat || 0) / 30 : (d.heat || 0) > 25 ? 1.2 : 0), run(S, d, ask, done) {
      ask("Blue lights", "A patrol car rolls in with its lights off. Then the lights come on.", [
        ["Floor it", () => {
          spawnPolice(S);
          S.toast("Lose them!");
          done();
        }],
        ["Pull over", () => {
          const fine = ri(250, 700);
          addF(S, { money: -fine, heat: -12 });
          S.rows.push(["Ticket", "-" + money(price(fine))]);
          done();
        }],
      ], [["Police heat", Math.round(d.heat || 0) + "%"]], this.icon);
    } },
    { id: "rival", icon: E("1f3c1"), w: () => 2, run(S, d, ask, done) {
      const name = `${pick(FIRST)} ${pick(LAST)}`, nick = pick(NICK), stake = 300 * (1 + (d.stage || 0));
      ask("Tandem challenge", "A rival pulls up next to you and points at the track: he leads, you chase. Stay close and sideways.", [
        [`Chase him · bet ${money(price(stake))}`, () => {
          spawnRival(S, name, stake);
          done();
        }],
        ["Chase him for respect", () => {
          spawnRival(S, name, 0);
          done();
        }],
        ["Ignore him", () => {
          addF(S, { rep: -1 });
          done();
        }],
      ], [["Rival", `${name} "${nick}"`]], this.icon);
    } },
    { id: "photo", icon: E("1f4f7"), w: () => 1.6, run(S, d, ask, done) {
      ask("Streamer on the fence", "A streamer with a huge live audience set up on the outside of the next corner. He wants a clip.", [
        ["Give him a show", () => {
          spawnPhoto(S, 0);
          done();
        }],
        ["Ask him to pay first", () => {
          if (rnd() < 0.5) {
            spawnPhoto(S, 250);
            S.toast("He pays. Now deliver");
          } else {
            S.rows.push(["Streamer", "Walked off"]);
            S.toast("He laughs and walks off");
          }
          done();
        }],
        ["Wave him off", done],
      ], [], this.icon);
    } },
    { id: "oil", icon: E("1f9ef"), w: () => 1.5, run(S, d, ask, done) {
      ask("Oil on the track", "A leaking truck left black puddles across the racing line ahead.", [
        ["Use it for angle", () => {
          spawnOil(S);
          done();
        }],
        ["Throw sand on it", () => {
          S.t = Math.min(S.dur - 3, S.t + 6);
          addF(S, { ctl: 1 });
          S.rows.push(["Oil", "Cleaned up"]);
          S.toast("-6 s");
          done();
        }],
      ], [["Bonus", "x1.5 points while sliding on oil"]], this.icon);
    } },
    { id: "cones", icon: E("1f6a7"), w: (S) => (S.lay.street ? 1.6 : 1.2), run(S, d, ask, done) {
      ask("Gymkhana", "Some kids set up a line of cones and dare you to thread it sideways.", [
        ["Run the gymkhana", () => {
          spawnCones(S);
          done();
        }],
        ["Drive around them", () => {
          S.rows.push(["Gymkhana", "Skipped"]);
          done();
        }],
      ], [], this.icon);
    } },
    { id: "bet", icon: E("1f4b5"), w: () => 1.4, run(S, d, ask, done) {
      const target = 2500 + 1500 * (d.stage || 0) + ri(0, 3) * 500, stake = 200 * (1 + (d.stage || 0));
      ask("A side bet", "A guy with a fat wallet bets you cannot hold one big combo before time runs out.", [
        [`Take the bet · ${money(price(stake))}`, () => {
          S.acts.push({
            id: "bet", won: false, keep: true,
            upd(S2) {
              if (!this.won && S2.chain >= target) {
                this.won = true;
                S2.toast("Bet won!");
                S2.au("bank");
              }
            },
            end(S2) {
              addF(S2, this.won ? { money: stake, rep: 1 } : { money: -stake });
              S2.rows.push(["Side bet", this.won ? "Won" : "Lost"]);
            },
          });
          done();
        }],
        ["No bet", done],
      ], [["Target combo", fmt(target)], ["Stake", money(price(stake))]], this.icon);
    } },
    { id: "mech", icon: E("1f527"), w: (S) => (S.cond < 60 ? 3 : 1), run(S, d, ask, done) {
      ask("Engine trouble", "The temperature needle climbs and something under the hood starts ticking.", [
        ["Push on", () => {
          S.powerMul *= 0.78;
          S.acts.push({
            id: "mech", keep: true, cd: 0,
            upd(S2, dt) {
              this.cd -= dt;
              if (this.cd <= 0) {
                this.cd = 0.12;
                puff(S2, S2.car.x + Math.cos(S2.car.h) * 6, S2.car.y + Math.sin(S2.car.h) * 6, true);
              }
            },
            end(S2) {
              const blown = rnd() < 0.4 + (S2.cond < 50 ? 0.2 : 0);
              addF(S2, blown ? { cond: -12, hap: -2 } : { cond: -4 });
              S2.rows.push(["Engine", blown ? "Overheated" : "Survived"]);
            },
          });
          done();
        }],
        [`Pit and cool it down · ${money(price(120))}`, () => {
          S.t = Math.min(S.dur - 3, S.t + 8);
          addF(S, { money: -120, cond: 3 });
          S.rows.push(["Engine", "Fixed in the pits"]);
          S.toast("-8 s");
          done();
        }],
      ], [["Car condition", Math.round(S.cond) + "%"]], this.icon);
    } },
    { id: "rain", icon: E("1f327-fe0f"), w: () => 1, run(S, d, ask, done) {
      ask("Rain", "Fat drops start hitting the windshield. The track turns to glass.", [
        ["Keep sliding", () => {
          S.rain = true;
          S.gripMul *= 0.72;
          S.ptsMul *= 1.35;
          addF(S, { ctl: 1 });
          S.rows.push(["Rain", "Drove through it"]);
          done();
        }],
        ["Wait under a roof", () => {
          S.t = Math.min(S.dur - 3, S.t + 7);
          S.rows.push(["Rain", "Waited"]);
          S.toast("-7 s");
          done();
        }],
      ], [["Bonus", "x1.35 points, less grip"]], this.icon);
    } },
  ];
  function pickEvent(S) {
    const d = S.d;
    const pool = EVENTS.filter((e) => !S.evUsed.includes(e.id) && !(e.id === "rain" && S.rain)).map((e) => [e, e.w(S, d)]).filter((x) => x[1] > 0);
    if (S.acts.some((a) => a.id === "police" && !a.gone)) return null;
    let tot = pool.reduce((a, x) => a + x[1], 0), r = rnd() * tot;
    for (const [e, w] of pool) if ((r -= w) <= 0) return e;
    return pool.length ? pool[pool.length - 1][0] : null;
  }

  // ------------------------------------------------------------------ results
  function results(S) {
    bank(S);
    for (const a of S.acts.slice()) if (a.end) a.end(S);
    S.acts = [];
    const d = S.d, sc = S.score;
    const base = {
      ctl: sc < 3000 ? 1 : sc < 10000 ? 2 : sc < 25000 ? 3 : sc < 50000 ? 4 : 5,
      ref: S.hits === 0 && sc > 8000 ? 1 : 0,
      rep: clamp(Math.round(sc / (S.lay.street ? 9000 : 12000)), 0, 5) - (S.hits >= 6 ? 1 : 0),
      fol: Math.round(sc / 35),
      cond: -Math.round(Math.min(18, S.hits * 2) * (S.carObj && S.carObj.cage ? 0.7 : 1)),
      hap: S.busted ? 0 : sc > 10000 ? 2 : 0,
      heat: S.lay.street ? 3 : 0,
    };
    const f = { ...base };
    for (const k in S.f) f[k] = (f[k] || 0) + S.f[k];
    if (S.mode === "vs" && S.opps.length) {
      const field = [{ n: "You", s: sc, me: true }].concat(S.opps.map((o) => ({ n: o.name, s: Math.round(o.score) }))).sort((a, b) => b.s - a.s);
      const pos = field.findIndex((x) => x.me) + 1;
      f.rep = (f.rep || 0) + OPP_PRIZE[Math.min(pos, 4) - 1];
      f.fol = (f.fol || 0) + [300, 150, 50, 0][Math.min(pos, 4) - 1];
      if (pos === 1) f.money = (f.money || 0) + price(S.lay.street ? 400 : 1200);
      S.rows.push(["Position", pos + " of " + field.length]);
      field.forEach((x, i) => S.rows.push([(i + 1) + ". " + x.n, fmt(x.s)]));
    }
    for (const k in f) if (!f[k]) delete f[k];
    const prev = d.trackBest || 0;
    const newBest = sc > prev && sc > 0;
    let title, lead;
    if (S.busted) {
      title = "Busted";
      lead = "The patrol boxes you in at the gate. The session ends on the hood of a police car.";
    } else if (sc >= 30000) {
      title = "Legendary session";
      lead = "Smoke hangs over the whole place. People will talk about this one.";
    } else if (sc >= 12000) {
      title = "Strong session";
      lead = "Long slides, clean transitions. The car and your hands are talking.";
    } else if (sc >= 4000) {
      title = "Not bad";
      lead = "Some good slides between the mistakes. More seat time.";
    } else {
      title = "Rough session";
      lead = "The car spent more time straight than sideways. Everybody starts somewhere.";
    }
    const rows = [["Score", fmt(sc)], ["Best combo", fmt(S.best)], ["Max angle", Math.round(S.maxAng) + "°"], ["Laps", String(S.laps)], ["Wall hits", String(S.hits)]];
    if (newBest) rows.push(["Personal best", "New!"]);
    return { f, rows: rows.concat(S.rows), title, lead, newBest };
  }

  // ------------------------------------------------------------------ sound (WebAudio synth)
  const AU = {
    ctx: null, n: null, noise: null,
    muted() {
      const s = G.SETTINGS_UI && G.SETTINGS_UI.settings;
      return !!(s && !s.sound);
    },
    init() {
      try {
        const AC = G.AudioContext || G.webkitAudioContext;
        if (!AC) return;
        if (!this.ctx) this.ctx = new AC();
        if (this.ctx.state === "suspended") this.ctx.resume();
        if (!this.noise) {
          const c = this.ctx, len = c.sampleRate * 2, b = c.createBuffer(1, len, c.sampleRate), ch = b.getChannelData(0);
          for (let i = 0; i < len; i++) ch[i] = Math.random() * 2 - 1;
          this.noise = b;
        }
        this.build();
      } catch (e) {
        this.n = null;
      }
    },
    src(loop) {
      const s = this.ctx.createBufferSource();
      s.buffer = this.noise;
      s.loop = !!loop;
      return s;
    },
    filt(type, f, q) {
      const b = this.ctx.createBiquadFilter();
      b.type = type;
      b.frequency.value = f;
      if (q != null) b.Q.value = q;
      return b;
    },
    gain(v) {
      const g = this.ctx.createGain();
      g.gain.value = v;
      return g;
    },
    build() {
      this.kill();
      const c = this.ctx;
      const master = this.gain(this.muted() ? 0 : 0.7);
      master.connect(c.destination);
      const n = { master, srcs: [] };
      // engine: saw + square an octave down through a lowpass
      n.eg = this.gain(0);
      n.ef = this.filt("lowpass", 700, 3);
      n.o1 = c.createOscillator();
      n.o1.type = "sawtooth";
      n.o2 = c.createOscillator();
      n.o2.type = "square";
      const o2g = this.gain(0.45);
      n.o1.connect(n.ef);
      n.o2.connect(o2g).connect(n.ef);
      n.ef.connect(n.eg).connect(master);
      // tyres: band-passed noise + a wobbling tone
      const ns = this.src(true);
      n.bp = this.filt("bandpass", 2000, 7);
      n.sqg = this.gain(0);
      ns.connect(n.bp).connect(n.sqg).connect(master);
      n.sq = c.createOscillator();
      n.sq.type = "triangle";
      n.sq.frequency.value = 1150;
      const lfo = c.createOscillator();
      lfo.frequency.value = 9;
      const lg = this.gain(35);
      lfo.connect(lg).connect(n.sq.frequency);
      n.sqo = this.gain(0);
      n.sq.connect(n.sqo).connect(master);
      // gravel, ambience, crowd
      const ns2 = this.src(true);
      n.gg = this.gain(0);
      ns2.connect(this.filt("lowpass", 450)).connect(n.gg).connect(master);
      const ns3 = this.src(true);
      n.ag = this.gain(0.035);
      ns3.connect(this.filt("lowpass", 220)).connect(n.ag).connect(master);
      const ns4 = this.src(true);
      n.cg = this.gain(0);
      ns4.connect(this.filt("bandpass", 900, 0.7)).connect(n.cg).connect(master);
      // siren
      n.so = c.createOscillator();
      n.so.type = "square";
      n.so.frequency.value = 660;
      n.sg = this.gain(0);
      n.so.connect(this.filt("lowpass", 1800)).connect(n.sg).connect(master);
      n.srcs = [n.o1, n.o2, ns, n.sq, lfo, ns2, ns3, ns4, n.so];
      n.srcs.forEach((s) => s.start());
      this.n = n;
    },
    kill() {
      if (!this.n) return;
      for (const s of this.n.srcs)
        try {
          s.stop();
        } catch {}
      try {
        this.n.master.disconnect();
      } catch {}
      this.n = null;
    },
    to(p, v, tc) {
      p.setTargetAtTime(v, this.ctx.currentTime, tc || 0.05);
    },
    update(S, blocked) {
      const n = this.n;
      if (!n) return;
      this.to(n.master.gain, this.muted() || S.phase === "end" ? 0 : 0.7, 0.03);
      if (blocked) {
        this.to(n.eg.gain, 0.02);
        for (const g of [n.sqg, n.sqo, n.gg, n.cg, n.sg]) this.to(g.gain, 0);
        return;
      }
      const car = S.car, P = S.spec, spd = car.spd || 0, f = clamp(spd / P.vmax, 0, 1), thr = S.inp.u;
      const GR = [0.3, 0.52, 0.74, 1.01];
      let g = 0;
      while (g < 3 && f > GR[g]) g++;
      const lo = g ? GR[g - 1] : 0;
      let rpm = 0.22 + 0.78 * clamp((f - lo) / (GR[g] - lo), 0, 1);
      if (thr && (car.slide > 0.4 || S.phase === "count")) rpm = Math.min(1, rpm + (S.phase === "count" ? 0.6 : 0.25));
      S.rpm += (rpm - S.rpm) * 0.2;
      const fq = 34 + S.rpm * 110 + (rnd() - 0.5) * 2;
      this.to(n.o1.frequency, fq, 0.02);
      this.to(n.o2.frequency, fq * 0.5, 0.02);
      this.to(n.ef.frequency, 300 + S.rpm * 1500 + (thr ? 400 : 0), 0.03);
      this.to(n.eg.gain, (0.05 + (thr ? 0.06 : 0.02)) * (0.6 + S.rpm * 0.6));
      let sl = 0;
      if (car.slide > 0.3 && Math.abs(car.slip) > 0.2) sl = clamp(Math.abs(car.slip) * 1.4, 0, 1) * clamp(spd / 100, 0, 1);
      if (S.inp.d && spd > 60) sl = Math.max(sl, 0.4);
      if (S.off) sl *= 0.2;
      this.to(n.sqg.gain, sl * 0.16, 0.04);
      this.to(n.sqo.gain, sl * 0.03, 0.04);
      this.to(n.bp.frequency, 1700 + sl * 700, 0.05);
      this.to(n.gg.gain, S.off ? f * 0.3 : 0);
      this.to(n.cg.gain, S.crowdNear ? (S.drifting ? 0.12 : 0.06) : S.crowdOn ? 0.02 : 0, 0.2);
      this.to(n.sg.gain, S.siren ? 0.045 : 0, 0.1);
      if (S.siren) n.so.frequency.setValueAtTime(Math.floor(this.ctx.currentTime * 2.4) & 1 ? 920 : 660, this.ctx.currentTime);
    },
    tone(freqs, type, dur, vol, slideTo) {
      if (!this.n || this.muted()) return;
      const c = this.ctx, t0 = c.currentTime;
      freqs.forEach((fq, i) => {
        const o = c.createOscillator(), g = c.createGain(), t = t0 + i * dur;
        o.type = type;
        o.frequency.setValueAtTime(fq, t);
        if (slideTo) o.frequency.linearRampToValueAtTime(slideTo, t + dur);
        g.gain.setValueAtTime(vol, t);
        g.gain.setValueAtTime(0, t + dur * 0.95);
        o.connect(g).connect(this.n.master);
        o.start(t);
        o.stop(t + dur);
      });
    },
    crash(v) {
      if (!this.n || this.muted()) return;
      const c = this.ctx, t = c.currentTime, s = this.src(false), g = this.gain(0.5 * v + 0.15);
      s.connect(this.filt("lowpass", 900)).connect(g).connect(this.n.master);
      g.gain.setTargetAtTime(0, t + 0.05, 0.08);
      s.start(t);
      s.stop(t + 0.5);
      const o = c.createOscillator(), og = this.gain(0.4 * v + 0.1);
      o.frequency.setValueAtTime(120, t);
      o.frequency.exponentialRampToValueAtTime(38, t + 0.3);
      og.gain.setTargetAtTime(0, t + 0.08, 0.07);
      o.connect(og).connect(this.n.master);
      o.start(t);
      o.stop(t + 0.45);
    },
    play(kind, v) {
      if (kind === "crash") this.crash(v || 0.6);
      else if (kind === "combo") this.tone([560, 840], "square", 0.06, 0.045);
      else if (kind === "bank") this.tone([660, 880, 1320], "triangle", 0.07, 0.08);
      else if (kind === "lose") this.tone([330], "square", 0.25, 0.05, 110);
      else if (kind === "beep") this.tone([440], "square", 0.12, 0.06);
      else if (kind === "go") this.tone([880], "square", 0.3, 0.07);
    },
  };

  // ------------------------------------------------------------------ drawing
  function drawSprite(ctx, sp, x, y, h, shadow) {
    const k = frameIdx(h), o = sp.S / 2;
    ctx.drawImage(sp.s[k], Math.round(x - o) + 1, Math.round(y - o) + 2);
    ctx.drawImage(sp.f[k], Math.round(x - o), Math.round(y - o));
  }
  function draw(S, now) {
    const ctx = S.ctx, T = S.T, c = S.car, VH = S.VH;
    // camera leads the car a little so you see what is coming
    const tx = c.x + c.vx * 0.42 + Math.cos(c.h) * 10, ty = c.y + c.vy * 0.42 + Math.sin(c.h) * 10;
    S.cam.x += (tx - S.cam.x) * 0.12;
    S.cam.y += (ty - S.cam.y) * 0.12;
    let ox = Math.round(clamp(S.cam.x - VW / 2, 0, T.W - VW)), oy = Math.round(clamp(S.cam.y - VH / 2, 0, T.H - VH));
    if (S.shake > 0) {
      ox += Math.round((rnd() - 0.5) * S.shake * 2);
      oy += Math.round((rnd() - 0.5) * S.shake * 2);
      S.shake = Math.max(0, S.shake - 0.25);
    }
    ox = clamp(ox, 0, T.W - VW);
    oy = clamp(oy, 0, T.H - VH);
    ctx.drawImage(S.world, ox, oy, VW, VH, 0, 0, VW, VH);
    for (const a of S.acts) if (a.draw && a.id !== "police" && a.id !== "rival") a.draw(ctx, S, ox, oy, now);
    for (const a of S.acts) if (a.draw && (a.id === "police" || a.id === "rival")) a.draw(ctx, S, ox, oy, now);
    drawSprite(ctx, S.spr.me, c.x - ox, c.y - oy, c.h);
    if (S.inp.d && S.phase === "run") {
      // brake lights
      const bx = c.x - Math.cos(c.h) * 7, by = c.y - Math.sin(c.h) * 7;
      ctx.fillStyle = "#e0352b";
      ctx.fillRect(Math.round(bx - ox - Math.sin(c.h) * 2), Math.round(by - oy + Math.cos(c.h) * 2), 1, 1);
      ctx.fillRect(Math.round(bx - ox + Math.sin(c.h) * 2), Math.round(by - oy - Math.cos(c.h) * 2), 1, 1);
    }
    for (const p of S.parts) {
      const x = Math.round(p.x - ox), y = Math.round(p.y - oy), k = p.life / p.max;
      if (p.spark) {
        ctx.fillStyle = k > 0.5 ? "#f2d36b" : "#d8691f";
        ctx.fillRect(x, y, 1, 1);
        continue;
      }
      const sz = k > 0.66 ? 3 : k > 0.33 ? 2 : 1;
      ctx.fillStyle = p.dark ? (k > 0.5 ? "#3a3c41" : "#2b2d31") : k > 0.66 ? "#b9bcc2" : k > 0.33 ? "#8e9298" : "#63676d";
      ctx.fillRect(x - (sz >> 1), y - (sz >> 1), sz, sz);
    }
    for (const p of S.pops) ptext(ctx, p.txt, p.x - ox, p.y - oy - (1.2 - p.t) * 10, p.col, 1);
    if (S.rain) {
      ctx.fillStyle = "#6f8a99";
      if (!S.drops.length) for (let i = 0; i < 46; i++) S.drops.push([rnd() * VW, rnd() * VH]);
      for (const dp of S.drops) {
        ctx.fillRect(dp[0] | 0, dp[1] | 0, 1, 3);
        dp[0] -= 0.7;
        dp[1] += 4;
        if (dp[1] > VH) {
          dp[1] = -3;
          dp[0] = rnd() * (VW + 20);
        }
      }
    }
    if (S.phase === "count") {
      const n = Math.ceil(S.cd - 0.2);
      ptext(ctx, n > 0 ? String(n) : "GO", VW / 2, VH / 2 - 30, n > 0 ? "#ffffff" : HEX.cyan, 4);
    }
    if (S.phase === "run" && S.dur - S.t < 5.5) {
      const n = Math.ceil(S.dur - S.t);
      if (n > 0) ptext(ctx, String(n), VW / 2, 8, Math.floor(now * 4) & 1 ? "#ffffff" : HEX.cyan, 2);
    }
  }
  function fx2(S, dt) {
    const c = S.car;
    const skid = (Math.abs(c.slip) > 0.22 && c.spd > 25) || (S.inp.d && c.spd > 70) || (S.inp.hb && c.spd > 20);
    const ch = Math.cos(c.h), sh = Math.sin(c.h);
    if (skid && S.mark && !S.off) {
      S.mark.fillStyle = S.lay.street ? "#17181b" : "#151619";
      for (const s of [-1, 1]) S.mark.fillRect(Math.round(c.x - ch * 5 - sh * 3 * s), Math.round(c.y - sh * 5 + ch * 3 * s), 1, 1);
    }
    const smoke = (S.drifting || (c.slide > 0.4 && c.spd > 25)) && !S.off;
    const burn = S.phase === "count" && S.inp.u;
    if (smoke || burn) for (const s of [-1, 1]) if (rnd() < 0.6) puff(S, c.x - ch * 6 - sh * 3 * s, c.y - sh * 6 + ch * 3 * s);
    if (S.off && c.spd > 30 && rnd() < 0.4) S.parts.push({ x: c.x - ch * 6, y: c.y - sh * 6, vx: (rnd() - 0.5) * 20, vy: (rnd() - 0.5) * 20, life: 0.35, max: 1.1, dark: true });
    for (const p of S.parts) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 0.96;
      p.vy *= 0.96;
      p.life -= dt;
    }
    S.parts = S.parts.filter((p) => p.life > 0);
    for (const p of S.pops) p.t -= dt;
    S.pops = S.pops.filter((p) => p.t > 0);
  }

  // ------------------------------------------------------------------ UI
  const CSS = `
.dtk{position:absolute;inset:0;z-index:50;background:#0e0f12;display:flex;flex-direction:column;color:#e8eaed;font-family:"Mulish","Nunito",sans-serif;touch-action:none;user-select:none;-webkit-user-select:none;-webkit-touch-callout:none}
.dtk-top{display:flex;align-items:center;height:46px;background:#000;padding:0 8px;gap:8px;flex:none}
.dtk-top h2{flex:1;text-align:center;font:400 17px "Bungee","Nunito",sans-serif;color:#fff;margin:0;letter-spacing:.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.dtk-b{width:36px;height:32px;border:2px solid #27c3d1;background:#14161a;color:#27c3d1;display:flex;align-items:center;justify-content:center;padding:0;border-radius:0;cursor:pointer}
.dtk-hud{display:flex;background:#1b1d21;border-bottom:2px solid #27c3d1;flex:none}
.dtk-hud>div{flex:1;text-align:center;padding:4px 0 5px;border-right:2px solid #0e0f12}
.dtk-hud>div:last-child{border-right:0}
.dtk-hud small{display:block;font:800 10px "Mulish","Nunito",sans-serif;color:#8b9099;letter-spacing:1px;text-transform:uppercase}
.dtk-hud b{font:400 16px "Bungee","Nunito",sans-serif;color:#fff;white-space:nowrap}
.dtk-hud .c b{color:#27c3d1}
.dtk-view{flex:1;position:relative;display:flex;align-items:center;justify-content:center;overflow:hidden;min-height:0;background:#0e0f12}
.dtk-view canvas{image-rendering:pixelated;image-rendering:crisp-edges;display:block}
.dtk-toast{position:absolute;top:8px;left:50%;transform:translateX(-50%);font:400 14px "Bungee","Nunito",sans-serif;color:#27c3d1;background:#0e0f12;border:2px solid #27c3d1;padding:2px 10px;display:none;white-space:nowrap;pointer-events:none}
.dtk-pad{display:flex;justify-content:space-between;align-items:flex-end;padding:8px 10px calc(10px + env(safe-area-inset-bottom,0px));background:#14161a;border-top:2px solid #000;gap:8px;flex:none}
.dtk-g{display:flex;gap:8px;align-items:flex-end}
.dtk-p{width:64px;height:64px;border:2px solid #000;border-radius:0;background:#2b2e33;color:#e8eaed;font:400 12px "Bungee","Nunito",sans-serif;display:flex;align-items:center;justify-content:center;padding:0;box-shadow:inset -3px -3px 0 #1b1d21,inset 3px 3px 0 #3c4046;touch-action:none}
.dtk-p img{width:80%;height:80%;object-fit:contain;image-rendering:pixelated;pointer-events:none;-webkit-user-drag:none}
.dtk-p.on{box-shadow:inset 3px 3px 0 #1b1d21;transform:translateY(2px)}
.dtk-p.gas{height:78px;box-shadow:inset -3px -3px 0 #1a8d97,inset 3px 3px 0 #27c3d1}
.dtk-p.gas.on{box-shadow:inset 3px 3px 0 #1a8d97}
.dtk-p.hb{box-shadow:inset -3px -3px 0 #7a1914,inset 3px 3px 0 #d4453c}
.dtk-p.hb.on{box-shadow:inset 3px 3px 0 #7a1914}
.dtk-p.brk{width:56px;height:52px}
.dtk-keys{flex:none;text-align:center;font:700 12px "Mulish","Nunito",sans-serif;color:#8b9099;padding:7px 8px 9px;background:#14161a;border-top:2px solid #000}
`;
  const ARROW_L = '<svg viewBox="0 0 7 7" width="28" height="28" shape-rendering="crispEdges"><path d="M4 0h1v7H4zM3 1h1v5H3zM2 2h1v3H2zM1 3h1v1H1z" fill="currentColor"/></svg>';
  const ARROW_R = '<svg viewBox="0 0 7 7" width="28" height="28" shape-rendering="crispEdges"><path d="M2 0h1v7H2zM3 1h1v5H3zM4 2h1v3H4zM5 3h1v1H5z" fill="currentColor"/></svg>';
  const PAUSE = '<svg viewBox="0 0 7 7" width="16" height="16" shape-rendering="crispEdges"><path d="M1 1h2v5H1zM4 1h2v5H4z" fill="currentColor"/></svg>';
  const QUIT = '<svg viewBox="0 0 7 7" width="16" height="16" shape-rendering="crispEdges"><path d="M1 1h1v1H1zM2 2h1v1H2zM3 3h1v1H3zM4 4h1v1H4zM5 5h1v1H5zM5 1h1v1H5zM4 2h1v1H4zM2 4h1v1H2zM1 5h1v1H1z" fill="currentColor"/></svg>';
  const popupOpen = () => !!document.querySelector("#evWrap.open, #jmWrap.open, .notice-wrap");

  let S = null;
  function css() {
    if (document.getElementById("dtkCss")) return;
    const st = document.createElement("style");
    st.id = "dtkCss";
    st.textContent = CSS;
    document.head.appendChild(st);
  }
  function fit() {
    if (!S || !S.view) return;
    const vw = S.view.clientWidth, vh = S.view.clientHeight;
    if (!vw || !vh) return;
    const VH = clamp(Math.round((VW * vh) / vw), 200, 360);
    if (VH !== S.VH) {
      S.VH = VH;
      S.cv.height = VH;
      S.ctx.imageSmoothingEnabled = false;
    }
    let s = Math.min(vw / VW, vh / S.VH);
    const si = Math.floor(s);
    if (si >= 2 && si / s > 0.82) s = si;
    S.cv.style.width = Math.floor(VW * s) + "px";
    S.cv.style.height = Math.floor(S.VH * s) + "px";
  }
  const KEYS = { ArrowLeft: "l", KeyA: "l", ArrowRight: "r", KeyD: "r", ArrowUp: "u", KeyW: "u", ArrowDown: "d", KeyS: "d", Space: "hb" };

  function open() {
    const F = G.FL_DRIFT;
    if (!F || !F.D) return;
    const d = F.D();
    if (!d.active) return F.open();
    if (state.prison) return F.card("Behind bars", "No tracks in here. Only the yard.");
    if (state.age < 16) return F.card("Drive the track", "You are too young for this.");
    const c = F.car();
    if (!c) return F.needCar();
    if (d.yr.acts >= F.MAX_ACTS) return F.tired();
    const fee = price(LAYOUTS.circuit.fee);
    const pickTrack = (mode) =>
      F.ask("Drive the track", mode === "vs" ? "Three other drivers share the track. The best total score at the end of the session wins." : "You drive this one yourself. Slide for points, chain combos and deal with whatever the night throws at you.", [
        [`${LAYOUTS.port.n} · free`, () => start("port", mode)],
        [`${LAYOUTS.circuit.n} · ${money(fee)}`, () => {
          if ((state.money || 0) < fee) return F.card("Not enough money", `A session at the circuit costs ${money(fee)}.`, [], open);
          start("circuit", mode);
        }],
        ["Back", () => open(), "gray"],
      ], [["Car", F.carName(c)], ["Mode", mode === "vs" ? "With opponents" : "Solo"], ["Best score", fmt(d.trackBest || 0)], ["Controls", "Arrows/WASD + Space, or the buttons"]], ICON);
    F.ask("Drive the track", "Practice alone, or put your car against three other drivers.", [
      ["Solo", () => pickTrack("solo")],
      ["With opponents", () => pickTrack("vs")],
      ["Back", () => F.open(), "gray"],
    ], [["Car", F.carName(c)], ["Best score", fmt(d.trackBest || 0)]], ICON);
  }

  function start(layId, mode, duel) {
    const F = G.FL_DRIFT;
    const d = F.D();
    const c = F.car();
    if (!c) return F.needCar();
    if (!duel && d.yr.acts >= F.MAX_ACTS) return F.tired();
    const L = LAYOUTS[layId];
    if (!duel) {
      d.yr.acts++;
      d.yr.trained = (d.yr.trained || 0) + 1;
    }
    if (!duel && L.fee) state.money = (state.money || 0) - price(L.fee);
    if (typeof renderStats === "function") renderStats();
    AU.init();
    css();
    S = newSession(layId, { car: c, rating: F.carRating(c), skill: F.skill(), d, F, mode });
    if (mode === "vs") spawnOpponents(S, 3);
    if (duel) {
      S.duel = duel;
      S.dur = DUEL_RUN;
      S.evAt = [];
    }
    S.doc = document;
    const host = (typeof sList !== "undefined" && sList && sList.closest && sList.closest(".screen")) || document.querySelector(".screen.open") || document.body;
    const touch = (typeof matchMedia === "function" && matchMedia("(pointer: coarse)").matches) || "ontouchstart" in G;
    const el = document.createElement("div");
    el.className = "dtk no-swipe";
    el.innerHTML =
      `<div class="dtk-top"><button class="dtk-b" data-k="pause" aria-label="Pause">${PAUSE}</button><h2>${esc(duel ? duel.opp.name + " · beat " + fmt(duel.target) : L.n)}</h2><button class="dtk-b" data-k="quit" aria-label="Quit">${QUIT}</button></div>` +
      `<div class="dtk-hud"><div><small>Score</small><b data-h="s">0</b></div><div class="c"><small>Combo</small><b data-h="c">0</b></div><div><small>Time</small><b data-h="t">${RUN}</b></div>${S.mode === "vs" ? `<div><small>Position</small><b data-h="p">1/${S.opps.length + 1}</b></div>` : ""}</div>` +
      `<div class="dtk-view"><canvas></canvas><div class="dtk-toast"></div></div>` +
      (touch
        ? `<div class="dtk-pad"><div class="dtk-g"><button class="dtk-p" data-k="l" aria-label="Left">${ARROW_L}</button><button class="dtk-p" data-k="r" aria-label="Right">${ARROW_R}</button></div>` +
          `<div class="dtk-g"><button class="dtk-p brk" data-k="d" aria-label="Brake"><img src="drifttrack/brake.png" alt=""></button><button class="dtk-p hb" data-k="hb" aria-label="E-brake"><img src="drifttrack/ebrake.png" alt=""></button><button class="dtk-p gas" data-k="u" aria-label="Gas"><img src="drifttrack/gas.png" alt=""></button></div></div>`
        : `<div class="dtk-keys">W / ↑ gas · S / ↓ brake · A D / ← → steer · Space e-brake · Esc pause</div>`);
    host.appendChild(el);
    S.el = el;
    S.view = el.querySelector(".dtk-view");
    S.cv = el.querySelector("canvas");
    S.cv.width = VW;
    S.cv.height = S.VH = 300;
    S.ctx = S.cv.getContext("2d");
    S.ctx.imageSmoothingEnabled = false;
    S.hud = { s: el.querySelector('[data-h="s"]'), c: el.querySelector('[data-h="c"]'), t: el.querySelector('[data-h="t"]'), p: el.querySelector('[data-h="p"]'), last: {} };
    const toastEl = el.querySelector(".dtk-toast");
    let tt = 0;
    S.toast = (txt) => {
      toastEl.textContent = txt;
      toastEl.style.display = "block";
      clearTimeout(tt);
      tt = setTimeout(() => (toastEl.style.display = "none"), 1100);
    };
    S.au = (k, v) => AU.play(k, v);
    S.end = (why) => finish(why);
    // world + sprites
    const T = S.T;
    const wc = document.createElement("canvas");
    wc.width = T.W;
    wc.height = T.H;
    const wx = wc.getContext("2d");
    wx.putImageData(worldData(T, document), 0, 0);
    S.world = wc;
    S.mark = wx;
    const pc = palette("#d9dbde");
    const pA = { ...pc, b: pack("#d9dbde"), r: pack("#e0352b"), u: pack("#1c2b5a") };
    const pB = { ...pc, b: pack("#d9dbde"), r: pack("#5a1512"), u: pack("#3b7bff") };
    S.spr = { me: frames(document, spriteFor(c), palette(carHex(c))), pol: [frames(document, SPR.police, pA), frames(document, SPR.police, pB)] };
    // input
    el.querySelectorAll("[data-k]").forEach((b) => {
      const k = b.dataset.k;
      if (k === "pause") return (b.onclick = () => pause());
      if (k === "quit") return (b.onclick = () => pause(true));
      const on = (e) => {
        e.preventDefault();
        S && (S.inp[k] = true);
        b.classList.add("on");
        try {
          b.setPointerCapture(e.pointerId);
        } catch {}
        if (AU.ctx && AU.ctx.state === "suspended") AU.ctx.resume();
      };
      const off = () => {
        S && (S.inp[k] = false);
        b.classList.remove("on");
      };
      b.addEventListener("pointerdown", on);
      b.addEventListener("pointerup", off);
      b.addEventListener("pointercancel", off);
      b.addEventListener("lostpointercapture", off);
      b.addEventListener("contextmenu", (e) => e.preventDefault());
    });
    S.kd = (e) => {
      if (!S || S.phase === "end" || S.paused || popupOpen()) return;
      if (e.code === "Escape" || e.code === "KeyP") {
        e.preventDefault();
        return pause();
      }
      const k = KEYS[e.code];
      if (!k) return;
      e.preventDefault();
      e.stopPropagation();
      S.inp[k] = true;
    };
    S.ku = (e) => {
      const k = KEYS[e.code];
      if (!k || !S) return;
      S.inp[k] = false;
      if (S.phase !== "end" && !S.paused) {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    S.vis = () => document.hidden && S && S.phase !== "end" && !S.paused && pause();
    G.addEventListener("keydown", S.kd, true);
    G.addEventListener("keyup", S.ku, true);
    G.addEventListener("resize", fit);
    document.addEventListener("visibilitychange", S.vis);
    fit();
    setTimeout(fit, 50);
    S.lastT = 0;
    S.beeped = 4;
    S.raf = requestAnimationFrame(loop);
  }

  function release() {
    if (!S) return;
    for (const k in S.inp) S.inp[k] = false;
    S.el && S.el.querySelectorAll(".dtk-p.on").forEach((b) => b.classList.remove("on"));
  }
  function pause(quit) {
    if (!S || S.phase === "end" || S.paused) return;
    S.paused = true;
    release();
    const F = G.FL_DRIFT;
    const resume = () => {
      if (!S) return;
      S.paused = false;
      S.lastT = 0;
    };
    F.ask(quit ? "End the run?" : "Paused", quit ? "The session still counts as one of this year's activities." : "", [
      ["Resume", resume],
      ["End the run", () => finish("quit")],
    ], [["Score", fmt(S.score + S.chain)], ["Time left", Math.max(0, Math.ceil(S.dur - S.t)) + " s"]], ICON);
  }
  function fireEvent() {
    const e = pickEvent(S);
    if (!e) return;
    S.evUsed.push(e.id);
    S.paused = true;
    release();
    bank(S);
    const F = G.FL_DRIFT;
    e.run(S, S.d, F.ask, () => {
      if (!S) return;
      S.paused = false;
      S.lastT = 0;
    });
  }
  function loop(t) {
    if (!S || S.closed) return;
    S.raf = requestAnimationFrame(loop);
    const dt = Math.min(0.05, S.lastT ? (t - S.lastT) / 1000 : 0);
    S.lastT = t;
    const blocked = S.paused || popupOpen();
    if (!blocked && S.phase === "count") {
      S.cd -= dt;
      const n = Math.ceil(S.cd - 0.2);
      if (n < S.beeped) {
        S.beeped = n;
        AU.play(n > 0 ? "beep" : "go");
      }
      if (S.cd <= 0) S.phase = "run";
    } else if (!blocked && S.phase === "run") {
      let acc = dt;
      while (acc > 1e-6 && S.phase === "run") {
        const h = Math.min(1 / 120, acc);
        tick(S, h);
        acc -= h;
        if (S.evAt.length && S.t >= S.evAt[0]) {
          S.evAt.shift();
          fireEvent();
          break;
        }
        if (S.t >= S.dur) {
          finish("time");
          break;
        }
      }
    }
    if (!S) return;
    if (!blocked) fx2(S, dt);
    AU.update(S, blocked);
    draw(S, t / 1000);
    hud();
  }
  function hud() {
    const h = S.hud, l = h.last;
    const s = fmt(S.score), c = S.chain > 0 ? `${fmt(S.chain)} x${S.mult}` : "0", tl = String(Math.max(0, Math.ceil(S.dur - S.t)));
    if (l.s !== s) h.s.textContent = l.s = s;
    if (l.c !== c) h.c.textContent = l.c = c;
    if (l.t !== tl) h.t.textContent = l.t = tl;
    if (h.p) {
      const ps = rankOf(S) + "/" + (S.opps.length + 1);
      if (l.p !== ps) h.p.textContent = l.p = ps;
    }
  }
  function close() {
    if (!S) return;
    S.closed = true;
    cancelAnimationFrame(S.raf);
    G.removeEventListener("keydown", S.kd, true);
    G.removeEventListener("keyup", S.ku, true);
    G.removeEventListener("resize", fit);
    document.removeEventListener("visibilitychange", S.vis);
    AU.kill();
    if (S.el) S.el.remove();
    S = null;
  }
  function finish(why) {
    if (!S || S.phase === "end") return;
    if (why === "busted") S.busted = true;
    S.phase = "end";
    S.paused = true;
    release();
    const F = G.FL_DRIFT;
    const d = S.d;
    if (S.duel) {
      bank(S);
      const du = S.duel, mine = Math.round(S.score), win = why === "time" && mine >= du.target;
      close();
      return du.done({ win, crash: false, margin: win ? 0.5 : -0.5, omt: true, rows: [["Your score", fmt(mine)], [du.opp.name, fmt(du.target)]] });
    }
    const r = results(S);
    d.trackRuns = (d.trackRuns || 0) + 1;
    if (r.newBest) d.trackBest = S.score;
    if (G.FL_SND && G.FL_SND.result) G.FL_SND.result(!S.busted && S.score >= 4000);
    const rows = r.rows.concat(F.fx(d, r.f));
    if (typeof say === "function") say(S.busted ? "The police stopped my drift session." : "I put on a drift session at the track.");
    const jail = S.arrest;
    AU.update(S, true);
    F.card(r.title, r.lead, rows, () => {
      close();
      F.checkStage(d, () => {});
      if (jail && typeof arrest === "function") arrest("reckless driving", [1, 2]);
      else F.open();
    }, ICON);
  }

  G.FL_DTRACK = {
    open,
    // tie-break from a tandem battle: drive 22 s and beat the rival's score. done({win, crash, margin, omt, rows})
    duel(opp, done) {
      const F = G.FL_DRIFT;
      if (!F || !F.car()) return false;
      const target = Math.round(((3800 + opp.skill * 170) / RUN) * DUEL_RUN * 1.5 * (0.8 + rnd() * 0.4));
      start("port", "duel", { opp, target, done });
      return true;
    },
    _t: { LAYOUTS, buildTrack, fieldAt, along, segDiff, stepCar, specFor, newSession, tick, scoreTick, collide, results, EVENTS, pickEvent, carHex, spriteFor, SPR, palette, FONT, worldData, frames, draw, fx2 },
  };
})();
