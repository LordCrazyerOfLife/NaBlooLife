/* [mod] Wear your jewelry for YourLife (local mod).
 *
 * Slots on the avatar: NECK (chains, necklaces, pendants), WRIST (watches, bracelets),
 * MOUTH (grillz) and EARS (earrings). Open a piece in Assets -> Jewelry -> pick it -> "Wear".
 * Each slot holds one piece; wearing another one replaces it.
 *
 * The avatar is only a head (250x250), so when something is worn on the neck or wrist the face is shrunk a bit
 * and a neck, shoulders and a raised forearm are drawn so the pieces fit. Ears and mouth are drawn on the face
 * itself, placed from the face's own shape (ears from the skin silhouette, mouth from the eye line and the chin).
 *
 * Hook: game.html's composeFace calls window.FL_DRESS_JEWELRY(canvas, info) for the player's own face.
 * State: state.jewelEq = { neck, wrist, mouth, ears } -> jewelry item ids (JSON only).
 */
(() => {
  "use strict";
  if (window.FL_JEWEL_WEAR) return;

  // ------------------------------------------------------------------ slots
  const SLOT_NAME = { neck: "neck", wrist: "wrist", mouth: "mouth", ears: "ears" };
  const slotOf = (it) => {
    if (!it) return null;
    const noun = String(it.noun || "").toLowerCase();
    const name = String(it.name || "").toLowerCase();
    const img = String(it.img || "").toLowerCase();
    if (/grillz/.test(noun) || /grillz/.test(img) || /grillz/.test(name)) return "mouth";
    if (/earring/.test(noun) || /earring/.test(img)) return "ears";
    if (/watch/.test(noun) || /^watch/.test(img) || /bracelet/.test(noun) || /^bracelet/.test(img)) return "wrist";
    if (/necklace|chain|pendant|choker/.test(noun) || /^(pendant|choker|chains|cuban|encrusted)/.test(img)) return "neck";
    return null;
  };
  const eq = () => (state.jewelEq && typeof state.jewelEq === "object" ? state.jewelEq : (state.jewelEq = {}));
  const byId = (id) => (state.jewelry || []).find((x) => x && x.id === id);
  const equipped = () => {
    const out = {};
    for (const s of Object.keys(SLOT_NAME)) {
      const id = eq()[s];
      const it = id ? byId(id) : null;
      if (it) out[s] = it;
      else if (id) delete eq()[s]; // sold, gifted or thrown away
    }
    return out;
  };
  const worn = (it) => !!it && Object.values(equipped()).some((x) => x === it);
  const key = () => {
    const e = equipped();
    const parts = Object.entries(e).map(([s, it]) => `${s}:${it.id}`);
    return parts.length ? `|jw${parts.join(",")}` : "";
  };
  const refresh = () => {
    try {
      if (typeof renderAvatar === "function") renderAvatar();
    } catch {}
  };
  function toggle(it) {
    const slot = slotOf(it);
    if (!slot) return;
    if (!it.id) it.id = Math.random().toString(36).slice(2);
    const nm = String(it.name || "jewelry").toLowerCase();
    if (worn(it)) {
      delete eq()[slot];
      if (typeof say === "function") say(`I took off my ${nm}.`);
    } else {
      eq()[slot] = it.id;
      if (typeof say === "function") say(`I put on my ${nm}.`);
    }
    refresh();
  }

  // ------------------------------------------------------------------ small helpers
  const shade = (hex, f) => {
    const m = /^#([0-9a-f]{6})$/i.exec(hex || "");
    if (!m) return hex;
    const n = parseInt(m[1], 16);
    const r = Math.max(0, Math.min(255, Math.round(((n >> 16) & 255) * f)));
    const g = Math.max(0, Math.min(255, Math.round(((n >> 8) & 255) * f)));
    const b = Math.max(0, Math.min(255, Math.round((n & 255) * f)));
    return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
  };
  const imgCache = {};
  const loadImg = (src) =>
    (imgCache[src] ||= new Promise((res) => {
      const i = new Image();
      i.onload = () => res(i);
      i.onerror = () => res(null);
      i.src = src;
    }));
  const METAL = { gold: "#e8b84a", rose: "#e7a08d", white: "#dfe3e8", silver: "#d4d9df", platinum: "#e3e6ea", titanium: "#a9b0b8", steel: "#c4cad1" };
  const metalCol = (m) => {
    const s = String(m || "").toLowerCase();
    if (/rose/.test(s)) return METAL.rose;
    if (/white gold|platinum/.test(s)) return METAL.platinum;
    if (/gold/.test(s)) return METAL.gold;
    if (/titanium/.test(s)) return METAL.titanium;
    if (/steel/.test(s)) return METAL.steel;
    return METAL.silver;
  };
  const GEM = { Diamond: "#f4fbff", Emerald: "#2ecc71", Ruby: "#d4141c", Sapphire: "#2d5fd6", Aquamarine: "#58c8d8", Pearl: "#fff7ea", Amethyst: "#8e44ad", Topaz: "#f5b041" };
  const rr = (c, x, y, w, h, r) => {
    c.beginPath();
    c.moveTo(x + r, y);
    c.arcTo(x + w, y, x + w, y + h, r);
    c.arcTo(x + w, y + h, x, y + h, r);
    c.arcTo(x, y + h, x, y, r);
    c.arcTo(x, y, x + w, y, r);
    c.closePath();
  };

  // ------------------------------------------------------------------ anchors from the face's own skin silhouette
  const anchorCache = new WeakMap();
  function anchors(base, eyeY) {
    if (base && anchorCache.has(base)) return anchorCache.get(base);
    const ey = Number.isFinite(eyeY) ? eyeY : 138;
    const cv = document.createElement("canvas");
    cv.width = cv.height = 250;
    const c = cv.getContext("2d");
    let d = null;
    try {
      c.drawImage(base, 0, 0, 250, 250);
      d = c.getImageData(0, 0, 250, 250).data;
    } catch {}
    const solid = (x, y) => (d ? d[(Math.max(0, Math.min(249, y)) * 250 + Math.max(0, Math.min(249, x))) * 4 + 3] > 40 : x > 20 && x < 230);
    const extent = (y) => {
      let l = 0;
      let r = 249;
      while (l < 249 && !solid(l, y)) l++;
      while (r > 0 && !solid(r, y)) r--;
      return [l, r];
    };
    let chin = 245;
    for (let y = 249; y > 120; y--) {
      let hit = false;
      for (let x = 100; x < 150; x += 2) if (solid(x, y)) hit = true;
      if (hit) {
        chin = y;
        break;
      }
    }
    const [L, R] = extent(Math.round(ey + 20));
    const [EL, ER] = extent(Math.round(ey + 32));
    const a = { eyeY: ey, chin, L, R, EL, ER, cx: (L + R) / 2, width: R - L, mouthY: ey + 0.59 * (chin - ey) };
    if (base) anchorCache.set(base, a);
    return a;
  }

  // ------------------------------------------------------------------ drawing
  function drawBody(c, A, tf, skin) {
    const sc = tf.sc;
    const cx = tf.ox + A.cx * sc;
    const chinS = tf.oy + A.chin * sc;
    const neckW = Math.max(30, 0.27 * A.width * sc);
    const tee = "#2f3b52";
    // neck
    const sk = skin || "#e0ac82";
    const g = c.createLinearGradient(0, chinS - 10, 0, 250);
    g.addColorStop(0, shade(sk, 0.78));
    g.addColorStop(1, shade(sk, 0.94));
    c.fillStyle = g;
    rr(c, cx - neckW / 2, chinS - 16, neckW, 250 - chinS + 16, neckW * 0.18);
    c.fill();
    // shoulders / tee with a V neck
    const top = chinS + 10;
    c.fillStyle = tee;
    c.beginPath();
    c.moveTo(0, 250);
    c.lineTo(0, top + 20);
    c.quadraticCurveTo(cx - 70, top + 6, cx - neckW * 0.62, top - 2);
    c.lineTo(cx, top + 24);
    c.lineTo(cx + neckW * 0.62, top - 2);
    c.quadraticCurveTo(cx + 70, top + 6, 250, top + 20);
    c.lineTo(250, 250);
    c.closePath();
    c.fill();
    c.strokeStyle = shade(tee, 0.7);
    c.lineWidth = 2;
    c.stroke();
  }

  function drawEars(c, it, A, P, sc) {
    const metal = metalCol(it.metal);
    const gem = GEM[it.gem] || null;
    const name = `${it.name || ""} ${it.img || ""}`.toLowerCase();
    const hoop = /hoop/.test(name);
    const drop = /chandelier|drop|dangle|pearl/.test(name) && !hoop;
    const sides = [
      [A.EL + 6, -1],
      [A.ER - 6, 1],
    ];
    for (const [x0, dir] of sides) {
      const [x, y] = P(x0, A.eyeY + 34);
      c.save();
      if (hoop) {
        c.strokeStyle = metal;
        c.lineWidth = Math.max(2, 3 * sc);
        c.beginPath();
        c.arc(x + dir * 1, y + 8 * sc, 8 * sc, 0, Math.PI * 2);
        c.stroke();
        c.strokeStyle = shade(metal, 1.25);
        c.lineWidth = 1;
        c.stroke();
      } else {
        // stud
        c.fillStyle = metal;
        c.beginPath();
        c.arc(x, y, 5.2 * sc, 0, Math.PI * 2);
        c.fill();
        c.fillStyle = gem || shade(metal, 1.25);
        c.beginPath();
        c.arc(x, y, 3.4 * sc, 0, Math.PI * 2);
        c.fill();
        c.fillStyle = "rgba(255,255,255,.8)";
        c.beginPath();
        c.arc(x - 1.1 * sc, y - 1.1 * sc, 1.1 * sc, 0, Math.PI * 2);
        c.fill();
        if (drop) {
          c.strokeStyle = metal;
          c.lineWidth = Math.max(1, 1.4 * sc);
          c.beginPath();
          c.moveTo(x, y + 4 * sc);
          c.lineTo(x, y + 12 * sc);
          c.stroke();
          c.fillStyle = gem || "#fff7ea";
          c.beginPath();
          c.ellipse(x, y + 17 * sc, 3.6 * sc, 5 * sc, 0, 0, Math.PI * 2);
          c.fill();
          c.strokeStyle = shade(metal, 0.9);
          c.lineWidth = 1;
          c.stroke();
        }
      }
      c.restore();
    }
  }

  function drawGrillz(c, it, A, P, sc) {
    const name = `${it.name || ""} ${it.img || ""} ${it.metal || ""}`.toLowerCase();
    const diamond = /diamond/.test(name);
    const base = diamond ? "#e8f4ff" : /silver|steel|white|platinum/.test(name) ? "#d9dde3" : "#f0be3c";
    const edge = diamond ? "#7f9cc0" : shade(base, 0.62);
    const n = 6;
    const w = A.width * 0.33 * sc;
    const [cx, cy] = P(A.cx, A.mouthY - 1);
    const cap = w / n;
    for (let i = 0; i < n; i++) {
      const t = (i / (n - 1)) * 2 - 1;
      const x = cx + t * (w / 2 - cap / 2);
      const y = cy + t * t * 2.2 * sc;
      c.fillStyle = base;
      rr(c, x - cap / 2 + 0.4, y - 4.2 * sc, cap - 0.8, 8.4 * sc, 1.8 * sc);
      c.fill();
      c.strokeStyle = edge;
      c.lineWidth = 0.9;
      c.stroke();
      c.fillStyle = "rgba(255,255,255,.75)";
      rr(c, x - cap / 2 + 1.6, y - 3.4 * sc, cap - 3.2, 2.2 * sc, 1);
      c.fill();
    }
    if (diamond) {
      c.fillStyle = "#fff";
      for (const [dx, dy] of [[-0.3, -0.4], [0.05, 0.1], [0.32, -0.25]]) {
        const x = cx + dx * w;
        const y = cy + dy * 6 * sc;
        c.beginPath();
        c.moveTo(x, y - 2.2 * sc);
        c.lineTo(x + 0.8 * sc, y);
        c.lineTo(x, y + 2.2 * sc);
        c.lineTo(x - 0.8 * sc, y);
        c.closePath();
        c.fill();
      }
    }
  }

  async function drawChain(c, it, A, tf) {
    const img = await loadImg(`jewelry/${it.img}.png`);
    if (!img) return;
    const sc = tf.sc;
    const cx = tf.ox + A.cx * sc;
    const chinS = tf.oy + A.chin * sc;
    const neckW = Math.max(30, 0.27 * A.width * sc);
    const top = chinS - 3;
    const maxH = Math.max(24, 250 - top - 2);
    let w = neckW * 1.55;
    let h = (img.height / img.width) * w;
    if (h > maxH) {
      h = maxH;
      w = (img.width / img.height) * h;
    }
    c.save();
    c.shadowColor = "rgba(0,0,0,.35)";
    c.shadowBlur = 3;
    c.drawImage(img, cx - w / 2, top, w, h);
    c.restore();
  }

  async function drawWrist(c, it, tf, skin) {
    const img = await loadImg(`jewelry/${it.img}.png`);
    const sk = skin || "#e0ac82";
    const tee = "#2f3b52";
    const px = 212;
    const py = 236;
    const ang = -0.62;
    c.save();
    c.translate(px, py);
    c.rotate(ang);
    // sleeve, forearm, hand
    c.fillStyle = tee;
    rr(c, -17, -2, 34, 40, 8);
    c.fill();
    const g = c.createLinearGradient(-13, 0, 13, 0);
    g.addColorStop(0, shade(sk, 0.82));
    g.addColorStop(0.5, sk);
    g.addColorStop(1, shade(sk, 0.86));
    c.fillStyle = g;
    rr(c, -12, -46, 24, 50, 9);
    c.fill();
    c.beginPath();
    c.ellipse(0, -52, 12, 14, 0, 0, Math.PI * 2);
    c.fill();
    c.restore();
    if (img) {
      const sz = 46;
      c.save();
      c.translate(px + 30 * Math.sin(ang), py - 30 * Math.cos(ang));
      c.rotate(ang);
      c.shadowColor = "rgba(0,0,0,.35)";
      c.shadowBlur = 3;
      c.drawImage(img, -sz / 2, -sz / 2, sz, sz);
      c.restore();
    }
  }

  async function dress(face, info) {
    const items = equipped();
    if (!items.neck && !items.wrist && !items.ears && !items.mouth) return face;
    const A = anchors(info.base, info.eyeY);
    const big = !!(items.neck || items.wrist);
    const sc = big ? 0.82 : 1;
    const tf = { sc, ox: (250 - 250 * sc) / 2, oy: big ? 4 : 0 };
    const P = (x, y) => [tf.ox + x * sc, tf.oy + y * sc];
    const out = document.createElement("canvas");
    out.width = out.height = 250;
    const c = out.getContext("2d");
    if (big) drawBody(c, A, tf, info.skin);
    c.drawImage(face, tf.ox, tf.oy, 250 * sc, 250 * sc);
    if (items.ears) drawEars(c, items.ears, A, P, sc);
    if (items.mouth && (!info.mood || info.mood === "happy")) drawGrillz(c, items.mouth, A, P, sc);
    if (items.neck) await drawChain(c, items.neck, A, tf);
    if (items.wrist) await drawWrist(c, items.wrist, tf, info.skin);
    return out;
  }

  window.FL_DRESS_JEWELRY = (face, info) => dress(face, info || {}).catch((e) => (console.warn("[jewelry-wear]", e), face));
  window.FL_JEWEL_KEY = key;
  window.FL_JEWEL_WEAR = { slot: slotOf, worn, toggle, equipped, slots: SLOT_NAME };
})();
