/* [mod] My Cartel (mycartel.js): fund and run your own cartel.
 *
 * Occupation -> Cartel -> My Cartel (cartel.js calls FL_MYCARTEL.mount()). You pick a name and a crest (a PNG from your device, stored as a small
 * data URL in the save), and from there you:
 *   - invent your own drugs (the lab rolls the potency and the street price) and cook batches in your labs;
 *   - clean a batch up to raise its purity and what the corners pay for it;
 *   - move the product with camellos on the corners and with tunnels into the US;
 *   - recruit people (lookouts, mules, cooks, sicarios, lieutenants) with skill and loyalty;
 *   - buy guns and gear in the armory and hand them out to your crew;
 *   - buy the armored trucks from the cartel fleet (cars/cartel-01..12.png) once you are in a cartel.
 *
 * Everything you sell on the street is dirty money: it goes through FL_LAUNDER when that mod is on.
 * A yearly tick pays the crew, cools the heat down and fires one of 40 cartel events (rival convoys,
 * DEA planes, snitches, corrupt cops, lab fires, betrayals...). Events also fire for players who
 * joined one of the regular cartels (state.job.cartel).
 *
 * State: state.myCartel = { name, logo, founded, respect, heat, drugs, crew, guns, fleet, labs,
 *                          seen, tickAge, events }.
 * API: FL_MYCARTEL.open(), .found(), .state(), .events, .tick().
 */
(() => {
  "use strict";
  if (window.FL_MYCARTEL) return;

  const rnd = Math.random;
  const pick = (a) => a[Math.floor(rnd() * a.length)];
  const ch = (p) => rnd() < p;
  const ri = (a, b) => a + Math.floor(rnd() * (b - a + 1));
  const clamp = (v, a = 0, b = 100) => Math.max(a, Math.min(b, Math.round(Number(v) || 0)));
  const esc = (s) =>
    String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const warn = (w, e) => console.warn("[mycartel] " + w, e);
  const usdf = (n) => {
    try {
      return usd(Math.round(n || 0));
    } catch {
      return "$" + Math.round(n || 0).toLocaleString("en-US");
    }
  };
  const chev = () => (typeof CHEV !== "undefined" ? CHEV : "");
  const dots = () => (typeof DOTS !== "undefined" ? DOTS : "");
  const cash = () => Math.max(0, Math.round(Number(state.money) || 0));
  const logoOf = (c) => (c && c.logo) || "cars/cartel-01.png";
  const note = (t, m, cb) => {
    try {
      notice(t, m, cb || null, true);
    } catch (e) {
      warn("notice", e);
    }
  };
  const say = (s) => {
    try {
      window.say(s);
    } catch {}
  };
  const refresh = () => {
    try {
      renderStats();
    } catch {}
  };
  const save = () => {
    try {
      window.blSaveLife && window.blSaveLife();
    } catch {}
  };
  const snd = (n) => {
    try {
      play(n);
    } catch {}
  };
  // form / info rows: the game's .row is a fixed 76px flex row, so these need their own height
  const mcStyle = () => {
    if (document.getElementById("mcStyle")) return;
    const st = document.createElement("style");
    st.id = "mcStyle";
    st.textContent =
      ".row.mcf{display:block!important;height:auto!important;min-height:0!important;padding:12px 14px!important;cursor:default;font-family:inherit;color:var(--cyan,#08dcd9)}" +
      ".row.mcf b{color:var(--cyan,#08dcd9)!important;font-family:inherit;font-weight:900;display:block;margin-bottom:4px}" +
      ".row.mcf > span{font-family:inherit;color:inherit!important;opacity:.85}" +
      ".row.mcf input,.row.mcf button{font-family:inherit}" +
      ".row.mcf input[type=file]::file-selector-button{font-family:inherit;font-weight:800;background:var(--cyan,#08dcd9);color:#111;border:0;border-radius:6px;padding:6px 10px;margin-right:10px;cursor:pointer}" +
      ".row.mcf table{font-family:inherit;width:100%}" +
      ".row.mcf table b{display:inline;margin:0}" +
      ".row.mcf .fl-bl{color:var(--cyan,#08dcd9)!important}" +
      ".mcartel .sec{color:var(--cyan,#08dcd9)!important;font-family:inherit}" +
      ".mcartel .row .t b{color:var(--cyan,#08dcd9)!important;font-family:inherit}" +
      ".mcartel .row .t span{color:var(--cyan,#08dcd9)!important;opacity:.8;font-family:inherit}";
    document.head.appendChild(st);
  };
  let HOME = null;
  const goHome = () => {
    try {
      if (HOME) return HOME();
      if (window.CARTEL && CARTEL.openCartels) return CARTEL.openCartels();
      if (typeof openOccupation === "function") return openOccupation();
    } catch (e) {
      warn("home", e);
    }
    screen.classList.remove("open");
  };
  const open = (title, back, html) => {
    try {
      mcStyle();
    } catch {}
    sTitle.textContent = title;
    if (typeof sSub !== "undefined" && sSub && sSub.style) sSub.style.display = "none";
    sBack.innerHTML = typeof BACK_ICON !== "undefined" ? BACK_ICON : "&larr;";
    sList.classList.add("mcartel");
    sBack.onclick = () => {
      sList.classList.remove("mcartel");
      back();
    };
    sList.innerHTML = html;
    sList.scrollTop = 0;
    screen.classList.add("open");
  };
  // bars are always the game's stat bars (FL_BARS / statBar), never the mod's old .rel look
  const barCls = (v) => (v < 13 ? "crit" : v < 31 ? "low" : "");
  const statBarHtml = (label, v, cls, hint) => {
    const val = Math.max(0, Math.min(100, Math.round(Number(v) || 0)));
    const c = cls == null ? barCls(val) : cls;
    if (window.FL_BARS && typeof FL_BARS.html === "function") return FL_BARS.html(label, val, c, hint);
    const bar = typeof statBar === "function"
      ? statBar(val, c)
      : `<div class="bar"><div class="bi"><div class="fill ${c}" style="width:${val}%"></div></div><span class="pct">${val}%</span></div>`;
    return `<div class="fl-brow"><div class="fl-bt"><span class="fl-bl">${esc(label)}</span></div>${bar}</div>`;
  };
  const row = (attr, ic, t, s, dis) =>
    `<div class="row${dis ? " dis" : ""}" ${attr}><img src="${ic}" alt="" style="object-fit:contain"><div class="t"><b>${esc(
      t,
    )}</b><span>${s}</span></div>${dis ? "" : chev()}</div>`;
  const inputStyle =
    "width:100%;box-sizing:border-box;padding:8px 10px;border:1px solid #c9d3e0;border-radius:8px;font:inherit;font-size:16px";

  // ------------------------------------------------------------------ catalogs
  const ROLES = [
    { id: "lookout", name: "Lookout", pay: 1200, hire: 4000, min: 0, power: 2 },
    { id: "mule", name: "Mule", pay: 2200, hire: 7000, min: 0, power: 3 },
    { id: "cook", name: "Cook", pay: 5200, hire: 15000, min: 10, power: 1 },
    { id: "sicario", name: "Sicario", pay: 8500, hire: 32000, min: 25, power: 7 },
    { id: "lieutenant", name: "Lieutenant", pay: 15000, hire: 70000, min: 50, power: 9 },
  ];
  const roleOf = (id) => ROLES.find((r) => r.id === id) || ROLES[0];

  const GUNS = [
    { id: "pistol", name: "9mm Pistol", cost: 2500, power: 5, ico: "guns/pistols/m1911.png", d: "Cheap, quiet, easy to hide." },
    { id: "smg", name: "Machine Pistol", cost: 9000, power: 9, ico: "guns/smg/mp5.png", d: "Sprays a lot of lead in a small package." },
    { id: "shotgun", name: "Sawed-off Shotgun", cost: 12000, power: 12, ico: "guns/rifles/pump.png", d: "Loud. Very convincing at close range." },
    { id: "ak", name: "AK-47", cost: 26000, power: 18, ico: "guns/ak/akm.png", d: "The workhorse of every cartel on earth." },
    { id: "sniper", name: "Sniper Rifle", cost: 48000, power: 24, ico: "guns/rifles/awm.png", d: "For the man who likes to work alone." },
    { id: "rpg", name: "RPG-7", cost: 95000, power: 42, ico: "emoji/1f4a5.png", d: "For when a truck is in the way." },
    { id: "armor", name: "Ballistic Vest", cost: 11000, power: 0, def: 8, ico: "emoji/1f6e1-fe0f.png", d: "One more second of life per vest." },
    { id: "nvg", name: "Night Vision", cost: 22000, power: 0, def: 5, ico: "emoji/1f576-fe0f.png", d: "The dark belongs to whoever can see in it." },
  ];
  const gunOf = (id) => GUNS.find((g) => g.id === id) || null;

  const TRUCKS = [
    { id: "cartel-01", sprite: "cartel-01", name: "Rhino APC", make: "Rhino", model: "APC", price: 220000, armor: 62, seats: 5 },
    { id: "cartel-02", sprite: "cartel-02", name: "Warhound", make: "Warhound", model: "Gun Truck", price: 195000, armor: 55, seats: 5 },
    { id: "cartel-03", sprite: "cartel-03", name: "Bastion", make: "Bastion", model: "Gun Truck", price: 260000, armor: 66, seats: 6 },
    { id: "cartel-04", sprite: "cartel-04", name: "Viper", make: "Viper", model: "Armored", price: 180000, armor: 48, seats: 4 },
    { id: "cartel-05", sprite: "cartel-05", name: "Razorback", make: "Razorback", model: "Gun Truck", price: 240000, armor: 60, seats: 5 },
    { id: "cartel-06", sprite: "cartel-06", name: "Ironclad", make: "Ironclad", model: "Gun Truck", price: 300000, armor: 72, seats: 6 },
    { id: "cartel-07", sprite: "cartel-07", name: "Warlord", make: "Warlord", model: "Gun Truck", price: 340000, armor: 76, seats: 6 },
    { id: "cartel-08", sprite: "cartel-08", name: "Reaper", make: "Reaper", model: "Gun Truck", price: 280000, armor: 68, seats: 5 },
    { id: "cartel-09", sprite: "cartel-09", name: "Titan", make: "Titan", model: "APC", price: 420000, armor: 84, seats: 8 },
    { id: "cartel-10", sprite: "cartel-10", name: "Blackout", make: "Blackout", model: "Armored", price: 210000, armor: 58, seats: 4 },
    { id: "cartel-11", sprite: "cartel-11", name: "Havoc", make: "Havoc", model: "Gun Truck", price: 250000, armor: 64, seats: 5 },
    { id: "cartel-12", sprite: "cartel-12", name: "Sicario", make: "Sicario", model: "Gun Truck", price: 380000, armor: 80, seats: 6 },
  ];
  const truckOf = (id) => TRUCKS.find((t) => t.id === id) || TRUCKS[0];

  const FIRST = ["Alejandro", "Ramón", "Nicolás", "Eduardo", "Tomás", "Joaquín", "Mateo", "Diego", "Cristóbal", "Benjamín", "Facundo", "Ignacio", "Rafael", "Santiago", "Emilio", "Héctor", "Mauricio", "Óscar", "Rubén", "Isidro", "Cuauhtémoc", "Yahir", "Bruno", "Ciro"];
  const LAST = ["Mendoza", "Cárdenas", "Fuentes", "Salazar", "Guzmán", "Cortés", "Vargas", "Espinoza", "Ochoa", "Beltrán", "Aguirre", "Carrillo", "Zamora", "Pineda", "Rojas", "Noriega", "Sotelo", "Quintero", "Valdés", "Escobar", "Herrera", "Lozano", "Bermúdez", "Arroyo"];
  const nameOf = () => `${pick(FIRST)} ${pick(LAST)}`;

  // ------------------------------------------------------------------ state
  const C = () => {
    const c = state.myCartel;
    if (!c || typeof c !== "object" || !c.founded) return null;
    c.drugs = Array.isArray(c.drugs) ? c.drugs : [];
    c.crew = Array.isArray(c.crew) ? c.crew : [];
    c.guns = c.guns && typeof c.guns === "object" ? c.guns : {};
    c.fleet = Array.isArray(c.fleet) ? c.fleet : [];
    c.seen = Array.isArray(c.seen) ? c.seen : [];
    c.respect = clamp(c.respect ?? 15);
    c.heat = clamp(c.heat ?? 5);
    c.labs = Math.max(1, Number(c.labs) || 1);
    c.turf = c.turf && typeof c.turf === "object" ? c.turf : {};
    c.safe = Array.isArray(c.safe) ? c.safe : [];
    c.dealers = Array.isArray(c.dealers) ? c.dealers : [];
    c.tunnels = Array.isArray(c.tunnels) ? c.tunnels : [];
    return c;
  };
  const found = () => !!C();
  const inCartel = () => found() || !!(state.job && state.job.cartel);
  const enabled = () => !state.dead && !state.prison && state.era !== "1800s";

  const RANKS = [
    [0, "Recluta"],
    [20, "Jefe de Plaza"],
    [40, "Capo"],
    [60, "Narco"],
    [80, "Patrón"],
  ];
  const rankOf = (r) => {
    let n = RANKS[0][1];
    for (const [min, name] of RANKS) if ((r ?? 0) >= min) n = name;
    return n;
  };

  const addRespect = (n) => {
    const c = C();
    if (c) c.respect = clamp(c.respect + n);
    else if (state.cartel) state.cartel.standing = clamp((Number(state.cartel.standing) || 0) + n);
  };
  const respectOf = () => (C() ? C().respect : state.cartel ? Number(state.cartel.standing) || 0 : 0);
  const addHeat = (n) => {
    const c = C();
    if (c) c.heat = clamp(c.heat + n);
    else if (state.cartel) state.cartel.heat = clamp((Number(state.cartel.heat) || 0) + n);
  };
  const heatOf = () => (C() ? C().heat : state.cartel ? Number(state.cartel.heat) || 0 : 0);

  const pay = (n) => {
    n = Math.max(0, Math.round(n));
    if (cash() < n) return false;
    state.money -= n;
    refresh();
    return true;
  };
  const income = (n, label) => {
    n = Math.max(0, Math.round(n));
    if (!n) return 0;
    try {
      if (window.FL_LAUNDER && FL_LAUNDER.dirty) {
        FL_LAUNDER.dirty(n, label || "cartel business", "cartel");
        return n;
      }
    } catch (e) {
      warn("dirty", e);
    }
    state.money = (Number(state.money) || 0) + n;
    refresh();
    try {
      chaChing();
    } catch {}
    return n;
  };

  // ------------------------------------------------------------------ crew, guns, product
  const loyaltyAvg = (c) => (c && c.crew.length ? Math.round(c.crew.reduce((s, r) => s + (r.loyalty || 0), 0) / c.crew.length) : 0);
  const payroll = (c) => (c ? c.crew.reduce((s, r) => s + roleOf(r.role).pay, 0) : 0);
  const firepower = (c) => {
    if (!c) return 0;
    return (
      c.crew.reduce((s, r) => s + (r.gun ? (gunOf(r.gun)?.power || 0) : 1) + Math.round((r.skill || 0) / 12), 0) +
      c.fleet.reduce((s, id) => s + Math.round(truckOf(id).armor / 12), 0)
    );
  };
  const defense = (c) => {
    if (!c) return 0;
    return (
      c.crew.reduce((s, r) => s + (r.gear === "armor" ? 8 : r.gear === "nvg" ? 5 : 0), 0) +
      c.fleet.reduce((s, id) => s + Math.round(truckOf(id).armor / 6), 0)
    );
  };
  const makeRecruit = (roleId, skill) => ({
    id: "c" + Date.now().toString(36) + Math.floor(rnd() * 1e4).toString(36),
    name: nameOf(),
    role: roleId,
    skill: clamp(skill ?? 40),
    loyalty: 55 + Math.round(rnd() * 20),
    gun: null,
    gear: null,
    since: state.age,
  });
  const addRecruit = (roleId, skill) => {
    const c = C();
    if (!c || c.crew.length >= 25) return null;
    const r = makeRecruit(roleId, skill);
    c.crew.push(r);
    return r;
  };
  const loseRecruit = () => {
    const c = C();
    if (!c || !c.crew.length) return null;
    return c.crew.splice(Math.floor(rnd() * c.crew.length), 1)[0];
  };
  const productUnits = (c) => (c ? c.drugs.reduce((s, d) => s + (Number(d.units) || 0), 0) : 0);
  const addProduct = (n) => {
    const c = C();
    if (!c || !c.drugs.length || !(n > 0)) return 0;
    const d = c.drugs.reduce((a, b) => ((b.units || 0) < (a.units || 0) ? b : a));
    d.units = Math.max(0, Number(d.units) || 0) + Math.round(n);
    return n;
  };

  function newCandidate(roleId) {
    const role = roleOf(roleId);
    const skill = clamp(role.min + 15 + Math.round(rnd() * 60));
    return { role: role.id, skill, name: nameOf(), cost: role.hire + skill * 140 };
  }
  function candidatePool(c) {
    const res = c ? c.respect : respectOf();
    const allowed = ROLES.filter((r) => r.min <= res + 10);
    const out = [];
    for (let i = 0; i < 3; i++) out.push(newCandidate(pick(allowed).id));
    return out;
  }

  // ------------------------------------------------------------------ creation
  function readLogo(file, cb) {
    if (!file) return;
    if (!/^image\//.test(file.type)) return note("Not an image", "Choose a PNG, JPG or WebP file from your device.");
    const fr = new FileReader();
    fr.onload = () => {
      const img = new Image();
      img.onload = () => {
        try {
          const box = 160;
          const s = Math.min(1, box / Math.max(img.width || 1, img.height || 1));
          const w = Math.max(1, Math.round(img.width * s));
          const h = Math.max(1, Math.round(img.height * s));
          const cv = document.createElement("canvas");
          cv.width = cv.height = box;
          const cx = cv.getContext("2d");
          cx.drawImage(img, Math.round((box - w) / 2), Math.round((box - h) / 2), w, h);
          cb(cv.toDataURL("image/png"));
        } catch (e) {
          warn("logo", e);
          note("Could not read", "That image could not be processed.");
        }
      };
      img.onerror = () => note("Could not read", "That file is not a valid image.");
      img.src = String(fr.result || "");
    };
    fr.onerror = () => note("Could not read", "The file could not be opened.");
    fr.readAsDataURL(file);
  }

  function openFound() {
    if (!enabled()) return note("Not now", "You cannot run a cartel right now.", null);
    if (state.job && state.job.cartel) {
      return note(
        "You already answer to someone",
        "You work for an existing cartel. Walk away from it first if you want to run your own.",
        null,
      );
    }
    let crest = "";
    open(
      "FOUND YOUR CARTEL",
      goHome,
      `<div class="row sm mcf"><b>Cartel name</b>
        <input id="mcName" maxlength="28" placeholder="Los Hijos del Desierto" style="${inputStyle}">
      </div>
      <div class="row sm mcf"><b>Crest (PNG from your device)</b>
        <span style="display:block;font-size:13px;color:#66707d;margin-bottom:6px">Any PNG, JPG or WebP. It is resized and saved with this life.</span>
        <input id="mcLogo" type="file" accept="image/png,image/jpeg,image/webp" style="${inputStyle};padding:6px">
        <img id="mcPrev" src="cars/cartel-01.png" alt="" style="width:96px;height:96px;object-fit:contain;display:block;margin:10px auto 0">
      </div>
      <div class="row sm mcf">
        <b>Founding cost</b>
        <span>${usdf(50000)} to buy the first safehouse, a lab and a truck.</span>
      </div>
      <div class="row" id="mcFound"><img src="emoji/1f4b0.png" alt="" style="object-fit:contain"><div class="t"><b>Found the cartel</b><span>You need ${usdf(50000)} and you must be 18 or older</span></div>${chev()}</div>`,
    );
    const nameEl = document.getElementById("mcName");
    const fileEl = document.getElementById("mcLogo");
    const prev = document.getElementById("mcPrev");
    nameEl && nameEl.focus && setTimeout(() => nameEl.focus(), 80);
    fileEl &&
      (fileEl.onchange = () =>
        readLogo(fileEl.files && fileEl.files[0], (data) => {
          crest = data;
          if (prev) prev.src = data;
        }));
    document.getElementById("mcFound").onclick = () => {
      const name = String((nameEl && nameEl.value) || "").trim();
      if (state.age < 18) return note("Too young", "You must be at least 18 years old to run a cartel.");
      if (name.length < 3) return note("Give it a name", "Your cartel needs a name of at least 3 characters.");
      if (cash() < 50000) return note("Not enough money", `Founding the cartel costs ${usdf(50000)}.`);
      state.money -= 50000;
      state.myCartel = {
        name,
        logo: crest || "",
        founded: state.age,
        respect: 15,
        heat: 5,
        labs: 1,
        drugs: [],
        crew: [makeRecruit("sicario", 55), makeRecruit("mule", 35)],
        guns: { pistol: 2 },
        fleet: [],
        turf: {},
        safe: [],
        dealers: [],
        tunnels: [],
        seen: [],
        tickAge: -1,
        events: 0,
      };
      C().crew[0].gun = "pistol";
      C().crew[1].gun = "pistol";
      C().guns.pistol = 0;
      say(
        pick([
          `I founded my own cartel, ${name}. Two rented pistols, one warehouse with a leak in the roof and a name I made up an hour earlier. Every empire starts like this, or it never starts at all.`,
          `I founded my own cartel, ${name}. The plaza is mine now, or at least the part of it where the streetlights do not work.`,
        ]),
      );
      try {
        const a = new Audio("sounds/a16_sndJoiningCartelFeedback.wav");
        a.play().catch(() => {});
      } catch {}
      refresh();
      save();
      openMyCartel();
    };
  }

  function openCrest() {
    const c = C();
    if (!c) return openFound();
    open(
      "CHANGE CREST",
      openMyCartel,
      `<div class="row sm mcf"><b>New crest (PNG, JPG or WebP)</b>
        <input id="mcLogo2" type="file" accept="image/png,image/jpeg,image/webp" style="${inputStyle};padding:6px">
        <img id="mcPrev2" src="${logoOf(c)}" alt="" style="width:110px;height:110px;object-fit:contain;display:block;margin:10px auto 0">
      </div>
      <div class="row" id="mcSaveCrest"><img src="emoji/1f4be.png" alt="" style="object-fit:contain"><div class="t"><b>Save crest</b><span>The crest shows on your cartel screen and in events</span></div>${chev()}</div>`,
    );
    let data = "";
    const f = document.getElementById("mcLogo2");
    const prev = document.getElementById("mcPrev2");
    f &&
      (f.onchange = () =>
        readLogo(f.files && f.files[0], (d) => {
          data = d;
          if (prev) prev.src = d;
        }));
    document.getElementById("mcSaveCrest").onclick = () => {
      if (!data) return note("Pick an image", "Choose an image from your device first.");
      c.logo = data;
      save();
      snd("ding");
      openMyCartel();
    };
  }

  // ------------------------------------------------------------------ hub
  function openMyCartel() {
    if (!enabled()) return note("Not now", "You cannot run a cartel right now.", null);
    const c = C();
    if (!c) return openFound();
    const heat = c.heat;
    const res = c.respect;
    open(
      "MY CARTEL",
      goHome,
      `<div style="text-align:center;padding:8px 0 2px">
        <img src="${logoOf(c)}" alt="" style="width:96px;height:96px;object-fit:contain;border-radius:18px;background:#0f1216">
        <div style="font-family:inherit;font-weight:900;font-size:20px;margin-top:6px;color:var(--cyan,#08dcd9)">${esc(c.name)}</div>
        <div style="font-family:inherit;font-size:13px;color:var(--cyan,#08dcd9);opacity:.72">${rankOf(res)} · founded in ${c.founded} · ${c.crew.length} crew · ${c.fleet.length} armored</div>
      </div>
      <div class="row sm mcf">
        ${statBarHtml("Respect", res)}
        ${statBarHtml("Police heat", heat, heat > 65 ? "crit" : heat > 35 ? "low" : "")}
        <table style="margin-top:8px"><tbody>
          <tr><td><b>Cash:</b> ${usdf(cash())}</td><td><b>Product:</b> ${productUnits(c)} units</td></tr>
          <tr><td><b>Crew loyalty:</b> ${loyaltyAvg(c)}%</td><td><b>Payroll:</b> ${usdf(payroll(c))}/yr</td></tr>
          <tr><td><b>Firepower:</b> ${firepower(c)}</td><td><b>Defense:</b> ${defense(c)}</td></tr>
        </tbody></table>
      </div>
      <div class="sec">Business</div>
      ${row('data-mc="lab"', "emoji/1f9ea.png", "Drug Lab", `${c.drugs.length ? `${c.drugs.length} product${c.drugs.length === 1 ? "" : "s"} · ${productUnits(c)} units ready` : "Invent your own drug and start cooking"}`)}
      ${row('data-mc="crew"', "special/gangbang.png", "Recruits", `${c.crew.length} on the payroll · loyalty ${loyaltyAvg(c)}%`)}
      ${row('data-mc="guns"', "guns/rifle.png", "Armory", `${Object.values(c.guns).reduce((s, n) => s + (Number(n) || 0), 0)} weapons and gear in the crates`)}
      ${row('data-mc="fleet"', "cars/cartel-01.png", "Armored Fleet", `${c.fleet.length ? `${c.fleet.length} armored truck${c.fleet.length === 1 ? "" : "s"} owned` : "Buy armored trucks for your people"}`)}
      ${row('data-mc="distro"', "emoji/1f6b2.png", "Distribution", `${camellos(c).length} camello${camellos(c).length === 1 ? "" : "s"} on the corners · ${tunnels(c).length} tunnel${tunnels(c).length === 1 ? "" : "s"} to the US`)}
      <div class="sec">The street</div>
      ${row('data-mc="roads"', "emoji/1f6a7.png", "Block the roads", "Stop the traffic, charge the toll and make the police come look")}
      ${row('data-mc="chaos"', "emoji/1f525.png", "Cause some chaos", "Burn something, break something, remind the town who runs it")}
      ${row('data-mc="turf"', "emoji/1f5fa-fe0f.png", "Control the territory", `${cornersHeld(c)} corners held · ${usdf(turfTake(c))}/yr at the current control`)}
      ${row('data-mc="safe"', "houses/house3.png", "Safe houses", `${c.safe.length} in your name · hides ${hideRate(c)}% heat a year`)}
      ${row('data-mc="heat"', "emoji/1f46e.png", "Deal with the police", "Bribe them, lay low or throw a party and hope nobody talks")}
      ${row('data-mc="crest"', "emoji/1f5bc-fe0f.png", "Change crest", "Pick a new PNG from your device")}
      ${row('data-mc="walk"', "emoji/1f6aa.png", "Dissolve the cartel", "Sell the corners, pay the crew off and walk away")}`,
    );
    sList.querySelectorAll("[data-mc]").forEach(
      (el) =>
        (el.onclick = () => {
          snd("choice");
          const w = el.dataset.mc;
          if (w === "lab") openLab();
          else if (w === "distro") openDistro();
          else if (w === "crew") openCrew();
          else if (w === "guns") openGuns();
          else if (w === "fleet") openFleet();
          else if (w === "crest") openCrest();
          else if (w === "heat") openHeat();
          else if (w === "roads") openRoads();
          else if (w === "chaos") openChaos();
          else if (w === "turf") openTurf();
          else if (w === "safe") openSafe();
          else if (w === "walk") openWalkAway();
        }),
    );
  }

  // ------------------------------------------------------------------ drug lab
  function openLab() {
    const c = C();
    if (!c) return openFound();
    const drugRows = c.drugs
      .map(
        (d) => `<div class="row sm mcf">
          <b style="font-size:15px">${esc(d.name)}</b>
          <span style="display:block;font-size:13px;color:#66707d">${usdf(d.price)}/unit · ${gradeOf(d.potency)} potency ${d.potency}% · ${d.units || 0} units in the stash</span>
          <div style="display:flex;gap:8px;margin-top:8px;flex-wrap:wrap">
            <button class="jm-apply ev-btn" data-prod="${d.id}" style="flex:1;min-width:110px">Cook a batch</button>
            <button class="jm-apply ev-btn hr-green" data-sell="${d.id}" style="flex:1;min-width:110px">Sell the stash</button>
            <button class="jm-apply ev-btn" data-improve="${d.id}" style="flex:1;min-width:130px">Improve quality (${usdf(upgradeCost(d))})</button>
          </div>
        </div>`,
      )
      .join("");
    open(
      "DRUG LAB",
      openMyCartel,
      `<div class="row sm mcf">
        <b>Labs: ${c.labs}</b>
        <span style="display:block;font-size:13px;color:#66707d">Each lab cooks more units per batch. A batch costs part of the price per unit.</span>
      </div>
      ${row('data-mc="lab2"', "emoji/1f3d7-fe0f.png", "Add a lab", `${usdf(150000)} · exactly what a growing business needs`, c.labs >= 5)}
      ${c.drugs.length ? drugRows : '<div class="row sm mcf">Your lab is empty. Invent a drug below and it will start cooking.</div>'}
      <div class="sec">Invent a drug</div>
      <div class="row sm mcf">
        <b>Name</b>
        <input id="mcDrug" maxlength="24" placeholder="Polvo de la Luna" style="${inputStyle}">
      </div>
      <div class="row sm mcf">
        <b>What comes out of the lab</b>
        <span style="display:block;font-size:13px;color:#66707d">Nobody picks the purity or the price. The cook, the labs and the year decide: the first batch lands somewhere between 18% and 82% potency and the street decides what it pays for it. You can clean it up later, for money and with a risk of ruining the stash.</span>
      </div>
      <div class="row" id="mcNewDrug"><img src="emoji/1f52c.png" alt="" style="object-fit:contain"><div class="t"><b>Develop it</b><span>${usdf(50000)} of lab work · up to 4 products</span></div>${chev()}</div>`,
    );
    sList.querySelectorAll("[data-prod]").forEach(
      (b) => (b.onclick = () => cook(b.dataset.prod)),
    );
    sList.querySelectorAll("[data-sell]").forEach((b) => (b.onclick = () => sellDrug(b.dataset.sell)));
    sList.querySelectorAll("[data-improve]").forEach((b) => (b.onclick = () => improve(b.dataset.improve)));
    const addLab = sList.querySelector('[data-mc="lab2"]');
    addLab &&
      (addLab.onclick = () => {
        if (c.labs >= 5) return;
        if (!pay(150000)) return note("Not enough money", `A new lab costs ${usdf(150000)}.`);
        c.labs++;
        say(
          pick([
            "I set up another lab. The cooks are already fighting over it, and the one who loses will spend the year explaining why the batch tastes like paint.",
            "I opened a second lab. Two chemical fires waiting to happen, except now they can happen in different buildings.",
          ]),
        );
        save();
        openLab();
      });
    document.getElementById("mcNewDrug").onclick = () => {
      const name = String(document.getElementById("mcDrug").value || "").trim();
      if (c.drugs.length >= 4) return note("The lab is full", "You already have four products. Sell one out before inventing another.");
      if (name.length < 2) return note("Give it a name", "Your product needs a name.");
      if (!pay(50000)) return note("Not enough money", `Developing a new product costs ${usdf(50000)}.`);
      // nobody chooses the purity or the price: the cook, the labs and the year do
      const cooks = c.crew.filter((r) => r.role === "cook").length;
      const potency = clamp(ri(18, 82) + c.labs * 2 + cooks * 3);
      const price = Math.round(ri(45, 260) * (0.8 + potency / 150));
      c.drugs.push({ id: "d" + Date.now().toString(36), name, price, potency, units: 0 });
      say(
        `My cooks came up with ${name}. The first batch came out ${gradeOf(potency)} at ${potency}% purity and the street is already offering around ${usdf(price)} a unit. ${
          potency < 40
            ? "Most of that price is packaging."
            : potency > 75
              ? "At this purity the customers stop haggling and start waiting in line."
              : "Good enough to move, not good enough to brag about."
        }`,
      );
      refresh();
      save();
      openLab();
    };
  }

  function batchOf(c, d) {
    return Math.round(25 + d.potency * 0.75 + c.labs * 15 + c.crew.filter((r) => r.role === "cook").length * 12);
  }
  function cook(id) {
    const c = C();
    if (!c) return;
    const d = c.drugs.find((x) => x.id === id);
    if (!d) return;
    const want = batchOf(c, d);
    const unitCost = Math.max(2, Math.round(d.price * 0.2));
    const units = Math.max(1, Math.min(want, Math.floor(cash() / unitCost)));
    const cost = units * unitCost;
    if (!pay(cost)) return note("Not enough money", `A batch of ${d.name} costs ${usdf(want * unitCost)}.`);
    d.units = (Number(d.units) || 0) + units;
    addHeat(1);
    say(`We cooked ${units} units of ${d.name}. The lab smells like a chemical fire, the neighbor's dog has stopped barking and the extractor fan is doing its best.`);
    snd("ding");
    refresh();
    save();
    openLab();
  }
  function improve(id) {
    const c = C();
    if (!c) return;
    const d = c.drugs.find((x) => x.id === id);
    if (!d) return;
    if ((Number(d.potency) || 0) >= 100)
      return note(
        "Nothing left to improve",
        `${d.name} is already as pure as this lab can make it. Push it any further and it stops being a business and starts being a chemistry award.`,
      );
    const cost = upgradeCost(d);
    if (!pay(cost)) return note("Not enough money", `Cleaning up a batch of ${d.name} costs ${usdf(cost)}.`);
    if (ch(0.18)) {
      const lost = Math.round((Number(d.units) || 0) * 0.3);
      d.units = Math.max(0, (Number(d.units) || 0) - lost);
      d.potency = clamp((Number(d.potency) || 0) - ri(4, 10));
      addHeat(2);
      note(
        "Bad batch",
        `The new process went wrong: ${d.name} dropped to ${d.potency}% purity${lost ? ` and ${lost} units had to be dumped in the drain` : ""}. The cook says it was the humidity, which is what they always say.`,
      );
      say(`I paid ${usdf(cost)} to clean up ${d.name} and the batch came out worse. The cook blamed the weather, the weather blamed the cook.`);
    } else {
      const gain = ri(6, 16);
      d.potency = clamp((Number(d.potency) || 0) + gain);
      d.price = Math.round((Number(d.price) || 0) * (1 + ri(2, 6) / 100));
      addHeat(1);
      note(
        "Purer product",
        `${d.name} is now ${gradeOf(d.potency)} at ${d.potency}% purity and the street pays ${usdf(d.price)} a unit. The customers notice without being told.`,
      );
      say(`We cleaned up ${d.name}. Same product, less filler, and now people are willing to pay for the difference.`);
    }
    refresh();
    save();
    openLab();
  }

  function sellDrug(id) {
    const c = C();
    if (!c) return;
    const d = c.drugs.find((x) => x.id === id);
    if (!d) return;
    const stash = Math.max(0, Math.round(Number(d.units) || 0));
    if (!stash) return note("Nothing to sell", `${d.name} has an empty stash. Cook a batch first.`);
    // the corners can only absorb so much: camellos widen the street
    const cap = Math.max(10, streetCapacity(c));
    const units = Math.min(stash, cap);
    const left = stash - units;
    const mult = 0.85 + d.potency / 300 + c.respect / 400;
    const gross = Math.round(units * d.price * mult);
    d.units = left;
    addHeat(clamp(gross / 40000, 1, 25));
    addRespect(Math.min(4, Math.round(units / 80)));
    income(gross, `selling ${d.name}`, "cartel");
    say(
      `I moved ${units} units of ${d.name} for ${usdf(gross)}. ${
        left
          ? `The corners cannot absorb the other ${left} units. I need more camellos working the street, or a tunnel to move that much product.`
          : window.FL_LAUNDER
            ? "It is dirty money now: I have to run it through something with a tax ID and a story that survives an audit."
            : "The money is in my pocket, where it will stay until I do something stupid with it."
      }`,
    );
    refresh();
    save();
    openLab();
  }

  // ------------------------------------------------------------------ distribution
  const camelloUnits = (b) => 15 + Math.round((Number(b.skill) || 40) / 2);

  function openDistro() {
    const c = C();
    if (!c) return openFound();
    const boys = camellos(c);
    const digs = tunnels(c);
    open(
      "DISTRIBUTION",
      openMyCartel,
      `<div class="row sm mcf">
        <b>The corners move ${streetCapacity(c)} units per sale · ${productUnits(c)} in the stash</b>
        <span style="display:block;font-size:13px;color:#66707d">Product sitting in a warehouse makes nothing. Camellos work the corners and take a cut; a tunnel under the border pays two to three times what the local street does.</span>
      </div>
      ${row('data-d="camello"', "emoji/1f6b2.png", "Hire a camello", `${usdf(camelloCost(c))} · works the corners, takes a 20% cut`, boys.length >= CAMELLO.max)}
      ${
        boys.length
          ? boys
              .map(
                (b) => `<div class="row sm mcf"><b>${esc(b.name)}</b>
          <span style="display:block;font-size:13px;color:#66707d">Corner boy · skill ${b.skill} · moves up to ${camelloUnits(b)} units a year · keeps 20%</span></div>`,
              )
              .join("")
          : '<div class="row sm mcf">Nobody is selling for you yet. Without camellos you have to move everything yourself, one stash at a time.</div>'
      }
      <div class="sec">Tunnels to the US</div>
      ${
        digs.length
          ? digs
              .map(
                (t) =>
                  row(
                    `data-tun="${t.id}"`,
                    "emoji/1f6b0.png",
                    t.name,
                    `${t.cap + Math.round(c.respect) + c.fleet.length * 60} units a load · x${t.mult} the local price · ${t.age === state.age ? "already used this year" : "ready"}`,
                  ),
              )
              .join("")
          : '<div class="row sm mcf">No tunnel yet. Everything you sell has to cross the border the slow, expensive, checkpoints-every-ten-miles way.</div>'
      }
      ${TUNNELS.map((t) =>
        row(
          `data-dig="${t.kind}"`,
          t.icon,
          `Dig: ${t.name}`,
          `${usdf(t.price)} · ${t.cap} units a load · x${t.mult} the local price${digs.some((x) => x.kind === t.kind) ? " · already yours" : ""}`,
          digs.length >= 3 || digs.some((x) => x.kind === t.kind),
        ),
      ).join("")}`,
    );
    const hire = sList.querySelector('[data-d="camello"]');
    hire &&
      (hire.onclick = () => {
        snd("choice");
        if (camellos(c).length >= CAMELLO.max) return note("No more corners", "You already have eight camellos. Any more and they start selling each other's product.");
        const cost = camelloCost(c);
        if (!pay(cost)) return note("Not enough money", `A camello wants ${usdf(cost)} up front.`);
        c.dealers.push({
          id: "b" + Date.now().toString(36) + Math.floor(rnd() * 1e3).toString(36),
          name: nameOf(),
          skill: ri(25, 85),
          since: state.age,
        });
        say("I put another kid on a corner with a pocket full of product and a phone that only has my number in it.");
        refresh();
        save();
        openDistro();
      });
    sList.querySelectorAll("[data-tun]").forEach(
      (el) =>
        (el.onclick = () => {
          snd("choice");
          tunnelCard(el.dataset.tun);
        }),
    );
    sList.querySelectorAll("[data-dig]").forEach(
      (el) =>
        (el.onclick = () => {
          snd("choice");
          if (digs.length >= 3) return note("Enough tunnels", "Three tunnels is already more than the border can explain.");
          if (digs.some((x) => x.kind === el.dataset.dig)) return note("Already yours", "You already have that tunnel. Digging a second one next to it just makes the first one easier to find.");
          const cat = TUNNELS.find((x) => x.kind === el.dataset.dig);
          if (!cat) return;
          if (!pay(cat.price)) return note("Not enough money", `That tunnel costs ${usdf(cat.price)}.`);
          c.tunnels.push({ id: "t" + Date.now().toString(36), kind: cat.kind, name: cat.name, cap: cat.cap, mult: cat.mult, risk: cat.risk, age: -1 });
          addHeat(-4);
          say(`The men finished the ${cat.name.toLowerCase()}. Two months, a lot of concrete and three families who think they were building a drainage ditch.`);
          refresh();
          save();
          openDistro();
        }),
    );
  }

  function tunnelCard(id) {
    const c = C();
    if (!c) return openFound();
    const t = tunnels(c).find((x) => x.id === id);
    if (!t) return openDistro();
    const stash = productUnits(c);
    const cap = t.cap + Math.round(c.respect) + c.fleet.length * 60;
    const move = Math.min(stash, cap);
    const price = avgPrice(c);
    const risk = Math.min(0.6, t.risk + heatOf() / 400);
    jCard({
      tag: "Distribution",
      iconSrc: "emoji/1f6b0.png",
      title: t.name,
      lead: `A hole under the border, a driver who does not ask questions and a buyer in the US who pays in dollars and complaints. Trucks in your fleet make a load bigger: ${c.fleet.length} in the garage right now.`,
      rows: [
        ["Product in the stash", `${stash} units`],
        ["This load", `${move} units`],
        ["Price in the US", `${usdf(Math.round(price * t.mult))}/unit`],
        ["Estimated take", usdf(Math.round(move * price * t.mult))],
        ["Risk of losing it", `${Math.round(risk * 100)}%`],
      ],
      choices: [
        [t.age === state.age ? "Already used this year" : "Run the load", () => (t.age === state.age ? openDistro() : runTunnel(id))],
        ["Back", () => openDistro(), "gray"],
      ],
    });
  }

  function runTunnel(id) {
    const c = C();
    if (!c) return;
    const t = tunnels(c).find((x) => x.id === id);
    if (!t) return openDistro();
    if (t.age === state.age) return note("Already used", `${t.name} already moved a load this year. Give the men at both ends time to act like nothing happened.`);
    const stash = productUnits(c);
    if (!stash) return note("Nothing to move", "The stash is empty. Cook a batch first, or the tunnel has nothing to carry.");
    const cap = t.cap + Math.round(c.respect) + c.fleet.length * 60;
    const move = Math.min(stash, cap);
    const price = avgPrice(c);
    const gross = Math.round(move * price * t.mult);
    const risk = Math.min(0.6, t.risk + heatOf() / 400);
    t.age = state.age;
    const moved = takeProduct(c, move);
    if (ch(risk)) {
      addHeat(12);
      addRespect(-3);
      if (ch(0.45)) {
        say(`The load never came out the other side: ${moved} units, a driver and a tunnel that will not be safe to use again for a while.`);
        notice(
          "The tunnel is blown",
          `${moved} units are gone and somebody at the far end is talking to the border patrol.`,
          () => {
            try {
              arrest("drug trafficking");
            } catch (e) {
              warn("arrest", e);
            }
          },
          true,
        );
      } else {
        say(`Border patrol was waiting at the far end. ${moved} units disappeared into an evidence locker.`);
        note("Seized", `${moved} units were seized at the exit of the tunnel. Nobody was arrested, which is the only good news of the day.`);
      }
    } else {
      income(gross, "tunnel shipment", "cartel");
      addHeat(6);
      addRespect(3);
      say(`The load went through the tunnel and came out the other side as money: ${moved} units for ${usdf(gross)}. The man at the far end counted it twice and complained the whole time.`);
    }
    refresh();
    save();
    openDistro();
  }

  // ------------------------------------------------------------------ recruits
  function openCrew() {
    const c = C();
    if (!c) return openFound();
    const list = c.crew.length
      ? c.crew
          .map(
            (r) => `<div class="row" data-crew="${r.id}"><img src="emoji/1f464.png" alt="" style="object-fit:contain">
            <div class="t"><b>${esc(r.name)}</b><span>${roleOf(r.role).name} · skill ${r.skill} · loyalty ${r.loyalty}%${r.gun ? ` · ${gunOf(r.gun)?.name || "armed"}` : " · unarmed"}</span></div>${chev()}</div>`,
          )
          .join("")
      : '<div class="row sm mcf">Nobody works for you yet. Recruit your first people below.</div>';
    open(
      "RECRUITS",
      openMyCartel,
      `<div class="row sm mcf">
        <b>${c.crew.length} people on the payroll</b>
        <span style="display:block;font-size:13px;color:#66707d">Payroll: ${usdf(payroll(c))} every year. Loyalty below 25% is a problem waiting to happen.</span>
      </div>
      ${list}
      <div class="sec">Find people</div>
      ${row('data-mc="hire"', "emoji/1f91d.png", "Recruit someone new", "Look at three candidates and pick one")}`,
    );
    sList.querySelectorAll("[data-crew]").forEach((el) => (el.onclick = () => crewCard(el.dataset.crew)));
    document.querySelector('[data-mc="hire"]').onclick = openHire;
  }

  function crewCard(id) {
    const c = C();
    if (!c) return;
    const r = c.crew.find((x) => x.id === id);
    if (!r) return openCrew();
    const role = roleOf(r.role);
    const next = ROLES[ROLES.indexOf(role) + 1];
    const bonus = 1500 + r.skill * 60;
    const choices = [];
    if (next) choices.push([`Promote to ${next.name} (${usdf(next.hire)})`, () => promote(r.id)]);
    choices.push([`Pay a bonus (${usdf(bonus)})`, () => bonusTo(r.id, bonus)]);
    if (r.gun) choices.push(["Take the weapon back", () => takeGun(r.id), "gray"]);
    choices.push(["Let them go", () => fire(r.id), "gray"]);
    jCard({
      tag: "Crew",
      iconSrc: "emoji/1f464.png",
      title: r.name,
      lead: `${role.name} with ${r.skill} skill and ${r.loyalty}% loyalty. ${r.since === state.age ? "Hired this year." : `Hired in ${r.since}.`}${statBarHtml("Loyalty", clamp(r.loyalty))}`,
      rows: [
        ["Role", role.name],
        ["Skill", `${r.skill}/100`],
        ["Loyalty", `${r.loyalty}%`],
        ["Weapon", r.gun ? gunOf(r.gun)?.name || r.gun : "None"],
        ["Yearly pay", usdf(role.pay)],
      ],
      choices,
    });
  }

  function promote(id) {
    const c = C();
    const r = c && c.crew.find((x) => x.id === id);
    if (!r) return;
    const i = ROLES.indexOf(roleOf(r.role));
    const next = ROLES[i + 1];
    if (!next) return;
    if (!pay(next.hire)) return note("Not enough money", `Promoting them costs ${usdf(next.hire)}.`);
    r.role = next.id;
    r.loyalty = clamp(r.loyalty + 12);
    r.skill = clamp(r.skill + 5);
    say(`${r.name} is my ${next.name} now. He gets a bigger cut, a better chair at the table and more reasons to want mine.`);
    refresh();
    save();
    openCrew();
  }
  function bonusTo(id, amount) {
    const c = C();
    const r = c && c.crew.find((x) => x.id === id);
    if (!r) return;
    if (!pay(amount)) return note("Not enough money", `That bonus is ${usdf(amount)}.`);
    r.loyalty = clamp(r.loyalty + 15);
    say(`I gave ${r.name} a bonus. Not because I like him, but because loyalty is cheaper than a funeral.`);
    refresh();
    save();
    openCrew();
  }
  function takeGun(id) {
    const c = C();
    const r = c && c.crew.find((x) => x.id === id);
    if (!r || !r.gun) return;
    c.guns[r.gun] = (Number(c.guns[r.gun]) || 0) + 1;
    r.gun = null;
    save();
    openCrew();
  }
  function fire(id) {
    const c = C();
    const i = c ? c.crew.findIndex((x) => x.id === id) : -1;
    if (i < 0) return;
    const r = c.crew[i];
    if (r.gun) c.guns[r.gun] = (Number(c.guns[r.gun]) || 0) + 1;
    if (r.gear) c.guns[r.gear] = (Number(c.guns[r.gear]) || 0) + 1;
    c.crew.splice(i, 1);
    c.respect = clamp(c.respect - 2);
    say(`${r.name} is out. Word gets around when you let people go, and the ones who stay start counting the exits.`);
    save();
    openCrew();
  }

  function openHire() {
    const c = C();
    if (!c) return openFound();
    if (c.crew.length >= 25) return note("No more room", "25 people is already too many names to keep straight.");
    const cands = candidatePool(c);
    open(
      "RECRUIT",
      openCrew,
      `<div class="row sm mcf">Three people heard you are hiring. Pay the signing cost and they are yours.</div>
      ${cands
        .map(
          (x, i) => `<div class="row" data-cand="${i}"><img src="emoji/1f464.png" alt="" style="object-fit:contain">
          <div class="t"><b>${esc(x.name)}</b><span>${roleOf(x.role).name} · skill ${x.skill} · ${usdf(x.cost)} up front · ${usdf(
            roleOf(x.role).pay,
          )}/yr</span></div>${chev()}</div>`,
        )
        .join("")}`,
    );
    sList.querySelectorAll("[data-cand]").forEach(
      (el) =>
        (el.onclick = () => {
          const x = cands[+el.dataset.cand];
          if (!pay(x.cost)) return note("Not enough money", `Hiring ${x.name} costs ${usdf(x.cost)}.`);
          const r = addRecruit(x.role, x.skill);
          if (!r) return;
          say(`I hired ${r.name} as a ${roleOf(r.role).name}. He shook my hand, asked nothing about benefits and looked at the cash drawer a little too long.`);
          save();
          openCrew();
        }),
    );
  }

  // ------------------------------------------------------------------ armory
  function openGuns() {
    const c = C();
    if (!c) return openFound();
    open(
      "ARMORY",
      openMyCartel,
      `<div class="row sm mcf">
        <b>What is in the crates</b>
        <span style="display:block;font-size:13px;color:#66707d">Firepower ${firepower(c)} · defense ${defense(c)}. Tap a weapon to buy it, then hand it to someone in Recruits.</span>
      </div>
      ${GUNS.map((g) => {
        const n = Number(c.guns[g.id]) || 0;
        return row(`data-buy="${g.id}"`, g.ico, g.name, `${g.d ? esc(g.d) + " · " : ""}${usdf(g.cost)} · owned: ${n}`, cash() < g.cost);
      }).join("")}
      <div class="sec">Hand out gear</div>
      ${row('data-mc="arm"', "emoji/1f91d.png", "Arm a recruit", "Assign a weapon from the crates to someone on the payroll")}`,
    );
    sList.querySelectorAll("[data-buy]").forEach(
      (el) =>
        (el.onclick = () => {
          const g = gunOf(el.dataset.buy);
          if (!g) return;
          if (!pay(g.cost)) return note("Not enough money", `${g.name} costs ${usdf(g.cost)}.`);
          c.guns[g.id] = (Number(c.guns[g.id]) || 0) + 1;
          say(`I bought a ${g.name}. The man selling it did not want a receipt and I did not want a conversation.`);
          snd("ding");
          save();
          openGuns();
        }),
    );
    document.querySelector('[data-mc="arm"]').onclick = () => openArm("");
  }

  function openArm(wid) {
    const c = C();
    if (!c) return openFound();
    const stock = GUNS.filter((g) => (Number(c.guns[g.id]) || 0) > 0);
    if (!stock.length) return note("Empty crates", "Buy a weapon in the armory first.", openGuns);
    if (!c.crew.length) return note("No crew", "You have nobody to arm.", openCrew);
    const gun = wid ? gunOf(wid) : null;
    if (wid && !gun) return openArm("");
    open(
      "HAND OUT GEAR",
      () => (wid ? openGuns() : openMyCartel()),
      `<div class="row sm mcf">
        <b>${gun ? `Choose who gets the ${gun.name}` : "Pick a weapon"}</b>
        <span style="display:block;font-size:13px;color:#66707d">${gun ? `${Number(c.guns[gun.id]) || 0} in the crates.` : "Then pick the person who carries it."}</span>
      </div>
      ${
        gun
          ? c.crew
              .map(
                (r) => `<div class="row" data-to="${r.id}"><img src="emoji/1f464.png" alt="" style="object-fit:contain">
                <div class="t"><b>${esc(r.name)}</b><span>${roleOf(r.role).name}${r.gun ? ` · currently ${gunOf(r.gun)?.name || r.gun}` : " · unarmed"}</span></div>${chev()}</div>`,
              )
              .join("")
          : stock
              .map(
                (g) => `<div class="row" data-w="${g.id}"><img src="${g.ico}" alt="" style="object-fit:contain">
                <div class="t"><b>${g.name}</b><span>${Number(c.guns[g.id]) || 0} in the crates · power ${g.power}${g.def ? ` · defense +${g.def}` : ""}</span></div>${chev()}</div>`,
              )
              .join("")
      }`,
    );
    sList.querySelectorAll("[data-w]").forEach((el) => (el.onclick = () => openArm(el.dataset.w)));
    sList.querySelectorAll("[data-to]").forEach(
      (el) =>
        (el.onclick = () => {
          const r = c.crew.find((x) => x.id === el.dataset.to);
          if (!r || !gun) return;
          if (!(Number(c.guns[gun.id]) > 0)) return note("None left", "There are none of those left in the crates.", () => openArm(""));
          c.guns[gun.id]--;
          if (gun.def) {
            if (r.gear && r.gear !== gun.id) c.guns[r.gear] = (Number(c.guns[r.gear]) || 0) + 1;
            r.gear = gun.id;
          } else {
            if (r.gun) c.guns[r.gun] = (Number(c.guns[r.gun]) || 0) + 1;
            r.gun = gun.id;
          }
          r.loyalty = clamp(r.loyalty + 2);
          say(`${r.name} is carrying the ${gun.name} now. He holds it like a phone, which is either confidence or a problem I will find out about later.`);
          save();
          openArm(gun.id);
        }),
    );
  }

  // ------------------------------------------------------------------ fleet
  const fleetList = () => {
    const c = C();
    if (c) return c.fleet;
    if (inCartel()) return (state.cartelFleet = Array.isArray(state.cartelFleet) ? state.cartelFleet : []);
    return null;
  };

  function buyTruck(id) {
    const fleet = fleetList();
    if (!fleet) return note("Not your business", "You need to be in a cartel to buy the armored fleet.");
    const t = truckOf(id);
    if (fleet.includes(id)) return note("Already yours", `You already own the ${t.name}.`);
    if (!pay(t.price)) return note("Not enough money", `The ${t.name} costs ${usdf(t.price)}.`);
    let car = null;
    try {
      if (typeof makeCar === "function") {
        car = makeCar([t.make, t.model, "truck", t.price, t.sprite, "black"], false, true);
        car.price = t.price;
        car.base = t.price;
        car.isNew = true;
        car.age = 0;
        car.cond = 100;
        car.expense = Math.round(t.price * 0.012);
        car.cls = "Truck";
      }
    } catch (e) {
      warn("car", e);
    }
    if (car) {
      state.cars = Array.isArray(state.cars) ? state.cars : [];
      state.cars.push(car);
    }
    fleet.push(id);
    addRespect(2);
    addHeat(2);
    say(
      pick([
        `I bought a ${t.name} for the cartel. Armored, ugly and expensive. The dealer asked no questions, which is exactly what I paid for.`,
        `The ${t.name} is ours now. Four tons of metal and bad intentions, parked where the neighbors can see it.`,
      ]),
    );
    snd("ding");
    refresh();
    save();
    openFleet();
  }

  function openFleet() {
    const c = C();
    const fleet = fleetList();
    if (!fleet) return note("Not your business", "You need to be in a cartel to buy the armored fleet.");
    const own = fleet;
    open(
      "ARMORED FLEET",
      () => (c ? openMyCartel() : goHome()),
      `<div class="row sm mcf">
        <b>${own.length ? `You own ${own.length} armored truck${own.length === 1 ? "" : "s"}` : "Cartel trucks"}</b>
        <span style="display:block;font-size:13px;color:#66707d">${own.length ? `${usdf(own.reduce((s, id) => s + truckOf(id).price, 0))} in iron · total armor ${own.reduce((s, id) => s + truckOf(id).armor, 0)} · defense +${own.reduce((s, id) => s + Math.round(truckOf(id).armor / 6), 0)}. Tap one of yours to inspect it.` : "Armored pickups with gun boxes and ram bars. Buying one adds it to your garage and to your cartel's defense. Cartel members only."}</span>
      </div>
      ${TRUCKS.map((t) => {
        const owned = own.includes(t.id);
        return row(
          `data-truck="${t.id}"`,
          `cars/${t.sprite}.png`,
          t.name,
          owned ? `In your fleet · armor ${t.armor} · ${t.seats} seats · tap to inspect` : `${usdf(t.price)} · armor ${t.armor} · ${t.seats} seats`,
          false,
        );
      }).join("")}`,
    );
    sList.querySelectorAll("[data-truck]").forEach(
      (el) =>
        (el.onclick = () => {
          const id = el.dataset.truck;
          const list = fleetList() || [];
          snd("choice");
          if (list.includes(id)) openTruck(id);
          else truckBuyCard(id);
        }),
    );
  }

  // ------------------------------------------------------------------ the street: roads, chaos, turf, safe houses
  const TURF = [
    { id: "centro", name: "El Centro", icon: "emoji/1f3d8-fe0f.png", income: 18000, cops: 3 },
    { id: "mercado", name: "El Mercado", icon: "emoji/1f6d2.png", income: 14000, cops: 2 },
    { id: "flores", name: "Las Flores", icon: "emoji/1f3e1.png", income: 10000, cops: 1 },
    { id: "colonia", name: "La Colonia", icon: "emoji/1f3e2.png", income: 9000, cops: 1 },
    { id: "presa", name: "La Presa", icon: "emoji/1f30a.png", income: 13000, cops: 2 },
    { id: "cerro", name: "Cerro Alto", icon: "emoji/1f3d4-fe0f.png", income: 7000, cops: 0 },
  ];
  const SAFE = [
    { id: "flat", name: "Corner apartment", sprite: "house3.png", price: 45000, hide: 3 },
    { id: "suburb", name: "House in the suburbs", sprite: "house7.png", price: 95000, hide: 6 },
    { id: "ranch", name: "Ranch outside town", sprite: "home-05.png", price: 210000, hide: 10 },
    { id: "mansion", name: "Mansion on the hill", sprite: "mansion-04.png", price: 420000, hide: 16 },
  ];
  // distribution: the corners need boys to work them and the good money is across the border
  const CAMELLO = { max: 8, base: 4500, step: 2500 };
  const TUNNELS = [
    { kind: "sewer", name: "Sewer tunnel", icon: "emoji/1f6b0.png", price: 260000, cap: 120, mult: 2, risk: 0.16, d: "Twelve hundred yards of wet pipe under the river. Slow, dark and very hard to find." },
    { kind: "border", name: "Border tunnel", icon: "emoji/1f6a7.png", price: 460000, cap: 240, mult: 2.3, risk: 0.2, d: "Lights, rails and a man at each end who owes you a favor he will never finish paying." },
    { kind: "freight", name: "Freight tunnel", icon: "emoji/1f30a.png", price: 780000, cap: 420, mult: 2.6, risk: 0.24, d: "Wide enough for a pallet jack and a truck axle. The kind of thing ground radar is built to find." },
  ];
  const ROADS = [
    { id: "toll", name: "The highway toll", icon: "emoji/1f6a7.png", take: [120000, 220000], heat: 10, people: 6, guard: 0.3 },
    { id: "bridge", name: "The bridge into town", icon: "emoji/1f6a8.png", take: [60000, 110000], heat: 7, people: 4, guard: 0.2 },
    { id: "dirt", name: "The dirt road to the lab", icon: "emoji/1f6b2.png", take: [30000, 55000], heat: 4, people: 3, guard: 0.1 },
  ];
  const CHAOS = [
    { id: "cars", name: "Burn a couple of cars", icon: "emoji/1f525.png", heat: 5, respect: 3, risk: 0.08, crew: 2, log: "We burned two cars on a quiet street and left before the fire trucks. It was never about the cars. It was about everybody watching them burn." },
    { id: "bar", name: "Shoot up a rival's bar", icon: "emoji/1f52b.png", heat: 10, respect: 6, risk: 0.18, crew: 3, log: "We walked into a rival's bar, put two rounds in the ceiling and left a bottle on the counter. Cheaper than a billboard and twice as clear." },
    { id: "riot", name: "Full-blown desmadre", icon: "emoji/1f4a5.png", heat: 20, respect: 12, risk: 0.35, crew: 5, log: "Two blocks burned, the radio talked about a war and nobody was hurt on purpose. Around here that counts as a good night." },
  ];
  const safeOf = (id) => SAFE.find((s) => s.id === id) || SAFE[0];
  const turfCtl = (c, id) => clamp((c && c.turf && c.turf[id]) || 0);
  const turfTake = (c) => (c ? TURF.reduce((s, t) => s + Math.round((t.income * turfCtl(c, t.id)) / 100), 0) : 0);
  const cornersHeld = (c) => TURF.filter((t) => turfCtl(c, t.id) >= 50).length;
  const hideRate = (c) => (c ? c.safe.reduce((s, id) => s + (Number(safeOf(id).hide) || 0), 0) : 0);

  // ------------------------------------------------------------------ distribution
  const camellos = (c) => (c && Array.isArray(c.dealers) ? c.dealers : []);
  const camelloCost = (c) => CAMELLO.base + camellos(c).length * CAMELLO.step;
  const tunnels = (c) => (c && Array.isArray(c.tunnels) ? c.tunnels : []);
  const streetCapacity = (c) =>
    c ? 25 + camellos(c).length * 30 + Math.round((Number(c.respect) || 0) / 2) : 0;
  const avgPrice = (c) => {
    const units = productUnits(c);
    if (!c || !units) return 0;
    return c.drugs.reduce((s, d) => s + (Number(d.price) || 0) * (Number(d.units) || 0), 0) / units;
  };
  const takeProduct = (c, n) => {
    if (!c || !(n > 0)) return 0;
    let left = Math.round(n),
      taken = 0;
    const order = [...c.drugs].sort((a, b) => (Number(b.units) || 0) - (Number(a.units) || 0));
    for (const d of order) {
      if (left <= 0) break;
      const have = Math.max(0, Number(d.units) || 0);
      const q = Math.min(have, left);
      d.units = have - q;
      left -= q;
      taken += q;
    }
    return taken;
  };
  const gradeOf = (p) => {
    const v = Number(p) || 0;
    return v >= 85 ? "premium" : v >= 65 ? "good" : v >= 40 ? "street" : "cut";
  };
  const upgradeCost = (d) => Math.round(35000 + (Number(d.potency) || 0) * 1600);

  // every action answers with the game's event card (jCard) and the game's stat bars
  function outcome(title, lead, rows, back) {
    const c = C();
    jCard({
      tag: "The street",
      iconSrc: logoOf(c),
      title,
      lead,
      rows: [
        ["Respect", `${respectOf()}% · ${rankOf(respectOf())}`],
        ["Heat", `${heatOf()}%`],
        ...(c ? [["Crew", `${c.crew.length} · loyalty ${loyaltyAvg(c)}%`]] : []),
        ...(rows || []),
      ],
      choices: [["Continue", () => (typeof back === "function" ? back() : openMyCartel())]],
    });
    refresh();
    save();
  }

  // ------------------------------------------------------------------ block the roads
  function openRoads() {
    const c = C();
    if (!c) return openFound();
    const done = c.roadAge === state.age;
    open(
      "BLOCK THE ROADS",
      openMyCartel,
      `<div class="row sm mcf">
        <b>${done ? "The roads are clear for now" : "Take a road and charge the toll"}</b>
        <span style="display:block;font-size:13px;color:#66707d">${done ? "The army doubled the checkpoints after the last blockade. Give it a year." : "Your people stop the traffic, the trucks pay in cash and the police take notice. One road a year before the checkpoints double."}</span>
      </div>
      ${ROADS.map((r) => row(`data-road="${r.id}"`, r.icon, r.name, `${usdf(r.take[0])}–${usdf(r.take[1])} · ${r.people} crew · heat +${r.heat}`, done || c.crew.length < r.people)).join("")}`,
    );
    sList.querySelectorAll("[data-road]").forEach(
      (el) =>
        (el.onclick = () => {
          const r = ROADS.find((x) => x.id === el.dataset.road);
          if (!r) return;
          if (c.roadAge === state.age) return note("Not this year", "The checkpoints are still out from the last blockade.");
          if (c.crew.length < r.people) return note("Not enough people", `Taking that road needs ${r.people} people on the payroll.`);
          roadCard(r);
        }),
    );
  }

  function roadCard(r) {
    const c = C();
    if (!c) return openFound();
    jCard({
      tag: "The street",
      iconSrc: r.icon,
      title: r.name,
      lead: `Trucks stopped in the middle of the road, men with rifles on both sides and the toll collected in cash. By Monday the whole town knows it was you.${statBarHtml("Police response", Math.round(r.guard * 100), "low")}`,
      rows: [
        ["Crew to take the road", `${r.people}`],
        ["Expected cut", `${usdf(r.take[0])}–${usdf(r.take[1])}`],
        ["Heat", `+${r.heat}`],
        ["Crew on the payroll", `${c.crew.length}`],
      ],
      choices: [
        ["Take the road", () => doRoad(r)],
        ["Not today", () => openRoads(), "gray"],
      ],
    });
  }

  function doRoad(r) {
    const c = C();
    if (!c) return openFound();
    if (c.roadAge === state.age) return note("Not this year", "The checkpoints are still out.");
    c.roadAge = state.age;
    const caught = ch(Math.min(0.85, r.guard + c.heat / 300));
    addHeat(r.heat);
    if (caught) {
      const cut = Math.round(ri(r.take[0], r.take[1]) * 0.3);
      income(cut, "roadblock");
      addHeat(8);
      addRespect(-4);
      const gone = ch(0.5) ? loseRecruit() : null;
      if (state.stats) state.stats.Health = clamp((Number(state.stats.Health) || 0) - ri(2, 8));
      say(`The army broke up the blockade at ${r.name.toLowerCase()}. We kept a third of the money and left a truck full of excuses on the shoulder of the road.`);
      outcome(
        "The army showed up",
        "Halfway through the afternoon a convoy came over the hill with the lights off. Your people scattered, a few trucks got away without paying and one of yours did not.",
        [["Collected", usdf(cut)], ...(gone ? [["Lost", `${gone.name} was taken`]] : [])],
        openRoads,
      );
    } else {
      const cut = ri(r.take[0], r.take[1]);
      income(cut, "roadblock");
      addRespect(ri(2, 4));
      c.crew.forEach((x) => (x.loyalty = clamp(x.loyalty + 1)));
      say(
        pick([
          `We blocked ${r.name.toLowerCase()} and charged every truck that came through. By nightfall the whole town was paying to use a road it already owns, and nobody called the police until morning.`,
          `We closed ${r.name.toLowerCase()} for a day. Truckers paid, complained, then paid again on the way back. Business is business.`,
        ]),
      );
      outcome(
        "The road is closed",
        `For a whole day nothing moves on ${r.name.toLowerCase()} unless it pays. Truckers hand over the money without arguing, and by nightfall your people are counting it on the hood of a pickup.`,
        [["Collected", usdf(cut)]],
        openRoads,
      );
    }
  }

  // ------------------------------------------------------------------ desmadre
  function openChaos() {
    const c = C();
    if (!c) return openFound();
    const done = c.chaosAge === state.age;
    open(
      "CAUSE SOME CHAOS",
      openMyCartel,
      `<div class="row sm mcf">
        <b>${done ? "The town is quiet again" : "Make a mess and let people talk"}</b>
        <span style="display:block;font-size:13px;color:#66707d">${done ? "The police are still driving around looking at the damage. Wait a year." : "Nobody respects a boss who never shows his face. Burn something, break something, and the plaza remembers your name. So do the police."}</span>
      </div>
      ${CHAOS.map((r) => row(`data-chaos="${r.id}"`, r.icon, r.name, `${r.crew} crew · respect +${r.respect} · heat +${r.heat}`, done || c.crew.length < r.crew)).join("")}`,
    );
    sList.querySelectorAll("[data-chaos]").forEach(
      (el) =>
        (el.onclick = () => {
          const r = CHAOS.find((x) => x.id === el.dataset.chaos);
          if (!r) return;
          if (c.chaosAge === state.age) return note("Not again this year", "The police are still working the last mess.");
          if (c.crew.length < r.crew) return note("Not enough people", `That needs ${r.crew} people on the payroll.`);
          chaosCard(r);
        }),
    );
  }

  function chaosCard(r) {
    const c = C();
    if (!c) return openFound();
    jCard({
      tag: "The street",
      iconSrc: r.icon,
      title: r.name,
      lead: `Your name has been quiet for too long. A little mess in the right place reminds everyone who runs this town.${statBarHtml("Heat", heatOf(), heatOf() > 60 ? "crit" : heatOf() > 35 ? "low" : "")}`,
      rows: [
        ["Crew needed", `${r.crew}`],
        ["Respect", `+${r.respect}`],
        ["Heat", `+${r.heat}`],
        ["Crew on the payroll", `${c.crew.length}`],
      ],
      choices: [
        ["Do it", () => doChaos(r)],
        ["Not today", () => openChaos(), "gray"],
      ],
    });
  }

  function doChaos(r) {
    const c = C();
    if (!c) return openFound();
    if (c.chaosAge === state.age) return note("Not again this year", "The police are still working the last mess.");
    c.chaosAge = state.age;
    const caught = ch(Math.min(0.8, r.risk + c.heat / 400));
    addHeat(r.heat);
    addRespect(r.respect);
    if (r.id === "riot") c.crew.forEach((x) => (x.loyalty = clamp(x.loyalty + 3)));
    say(r.log);
    if (caught) {
      addHeat(6);
      addRespect(-2);
      if (state.stats) state.stats.Health = clamp((Number(state.stats.Health) || 0) - ri(r.id === "riot" ? 6 : 2, r.id === "riot" ? 14 : 7));
      const gone = r.id !== "cars" && ch(0.3) ? loseRecruit() : null;
      outcome(
        "Somebody talked",
        `It was going fine until a patrol car turned the corner. Your people ran, and the police spent the night picking up the ones who did not run fast enough.`,
        [...(gone ? [["Lost", `${gone.name} was arrested`]] : []), ["Damage", "Not the good kind"]],
        openChaos,
      );
    } else {
      outcome(
        r.id === "riot" ? "The whole town saw it" : "They got the message",
        r.id === "riot"
          ? "Two blocks on fire, the radio talking about a war and your name in every mouth by morning. Nobody is going to question who runs the plaza this year."
          : "It was loud, it was quick and nobody saw the faces. By the next day every dealer in town is telling the story.",
        [["Respect", `+${r.respect}`]],
        openChaos,
      );
    }
  }

  // ------------------------------------------------------------------ territory
  function openTurf() {
    const c = C();
    if (!c) return openFound();
    open(
      "THE TERRITORY",
      openMyCartel,
      `<div class="row sm mcf">
        <b>${cornersHeld(c)} of ${TURF.length} corners under control</b>
        <span style="display:block;font-size:13px;color:#66707d">Territory pays every year if you can hold it. ${usdf(turfTake(c))} a year at the current control.</span>
      </div>
      ${TURF.map((t) => {
        const v = turfCtl(c, t.id);
        return row(`data-turf="${t.id}"`, t.icon, t.name, `${v}% control · ${usdf(Math.round((t.income * v) / 100))}/yr · cops ${t.cops}`);
      }).join("")}`,
    );
    sList.querySelectorAll("[data-turf]").forEach(
      (el) =>
        (el.onclick = () => {
          snd("choice");
          const t = TURF.find((x) => x.id === el.dataset.turf);
          if (t) turfCard(t);
        }),
    );
  }

  function turfCard(t) {
    const c = C();
    if (!c) return openFound();
    const v = turfCtl(c, t.id);
    const buyCost = 8000 + v * 400;
    jCard({
      tag: "The territory",
      iconSrc: t.icon,
      title: t.name,
      lead: `Corner by corner. The shops pay, the dealers work and the police drive by with their windows up.${statBarHtml("Control", v, v < 25 ? "crit" : v < 50 ? "low" : "")}${statBarHtml("Police presence", t.cops * 25, t.cops >= 3 ? "crit" : t.cops >= 2 ? "low" : "")}`,
      rows: [
        ["Your control", `${v}%`],
        ["Yearly take", usdf(Math.round((t.income * v) / 100))],
        ["Cops on the corner", `${t.cops}`],
        ["Crew on the payroll", `${c.crew.length}`],
      ],
      choices: [
        ["Send the crew to take the corner", () => turfPush(t)],
        [`Pay the locals to look the other way (${usdf(buyCost)})`, () => turfPay(t), "gray"],
        ["Extort the shops", () => turfShake(t)],
        ...(v > 0 ? [["Pull everybody out of the corner", () => turfDrop(t), "gray"]] : []),
        ["Back", () => openTurf(), "gray"],
      ],
    });
  }

  function turfPush(t) {
    const c = C();
    if (!c) return openFound();
    if (!c.crew.length) return note("Nobody to send", "You need at least one person on the payroll to take a corner.");
    const before = turfCtl(c, t.id);
    const gain = ri(10, 20) + Math.min(10, Math.round(firepower(c) / 8));
    const fight = ch(0.12 + t.cops * 0.05);
    const gone = fight && ch(0.4) ? loseRecruit() : null;
    if (fight && state.stats) state.stats.Health = clamp((Number(state.stats.Health) || 0) - ri(2, 8));
    c.turf[t.id] = clamp(before + (fight ? Math.round(gain / 2) : gain));
    addHeat(3 + t.cops * 2);
    addRespect(fight ? 1 : ri(1, 3));
    say(`We moved on ${t.name}. Control is at ${c.turf[t.id]}%. The locals watched from their windows and did the math on which side usually wins.`);
    outcome(
      fight ? "They pushed back" : "The corner is ours",
      fight
        ? `The dealers on ${t.name} were not alone. There was a fight on the corner, the police showed up late and your people got most of the way in anyway.`
        : `Your people walked onto ${t.name} in the afternoon and by nightfall the corner was selling your product. The locals keep their eyes on the street.`,
      [["Control", `${before}% → ${c.turf[t.id]}%`], ...(gone ? [["Lost", `${gone.name} walked away`]] : [])],
      openTurf,
    );
  }

  function turfPay(t) {
    const c = C();
    if (!c) return openFound();
    const v = turfCtl(c, t.id);
    const cost = 8000 + v * 400;
    if (!pay(cost)) return note("Not enough money", `The locals want ${usdf(cost)} up front.`);
    c.turf[t.id] = clamp(v + ri(6, 14));
    addHeat(-3);
    addRespect(1);
    say(`I paid the locals on ${t.name} to mind their own business. The priest got a new roof and I got a new alibi, which is roughly the same transaction.`);
    outcome("Money talks", `A community hall gets a new roof, the priest gets a new bell and nobody on ${t.name} remembers seeing anything.`, [["Control", `${v}% → ${c.turf[t.id]}%`]], openTurf);
  }

  function turfShake(t) {
    const c = C();
    if (!c) return openFound();
    const v = turfCtl(c, t.id);
    const take = 4000 + Math.round(v * 90) + ri(0, 4000);
    income(take, "protection money");
    addHeat(4);
    addRespect(1);
    c.crew.forEach((r) => (r.loyalty = clamp(r.loyalty + 1)));
    c.turf[t.id] = clamp(v - ri(1, 3));
    say(`The shops on ${t.name} paid their protection this month. They did not look happy about it, but they also did not look robbed, which is the point.`);
    outcome("Protection money", `Every shop on the street pays a little so nothing happens to it. Some of them even mean it as a thank you.`, [["Collected", usdf(take)], ["Control", `${v}% → ${c.turf[t.id]}%`]], openTurf);
  }

  function turfDrop(t) {
    const c = C();
    if (!c) return openFound();
    const v = turfCtl(c, t.id);
    c.turf[t.id] = 0;
    addHeat(-4);
    addRespect(-3);
    say(`I pulled my people out of ${t.name}. The corner was empty by morning, and the rivals were already measuring the sidewalk.`);
    outcome("We are out", `The corner is empty by morning. Somebody else will be selling there by the weekend, and everyone will remember who left.`, [["Control", `${v}% → 0%`]], openTurf);
  }

  // ------------------------------------------------------------------ safe houses
  function openSafe() {
    const c = C();
    if (!c) return openFound();
    open(
      "SAFE HOUSES",
      openMyCartel,
      `<div class="row sm mcf">
        <b>${c.safe.length} safe house${c.safe.length === 1 ? "" : "s"} · hides ${hideRate(c)}% heat a year</b>
        <span style="display:block;font-size:13px;color:#66707d">A house in somebody else's name is where you sleep when the police are looking. Every one you own quietly takes the heat off each year.</span>
      </div>
      ${SAFE.map((s) => {
        const own = c.safe.includes(s.id);
        return row(
          `data-safe="${s.id}"`,
          `houses/${s.sprite}`,
          s.name,
          own ? `In your name · heat -${s.hide}/yr · no neighbors asking questions` : `${usdf(s.price)} · heat -${s.hide}/yr`,
        );
      }).join("")}`,
    );
    sList.querySelectorAll("[data-safe]").forEach(
      (el) =>
        (el.onclick = () => {
          snd("choice");
          const s = SAFE.find((x) => x.id === el.dataset.safe);
          if (s) safeCard(s);
        }),
    );
  }

  function safeCard(s) {
    const c = C();
    if (!c) return openFound();
    const own = c.safe.includes(s.id);
    jCard({
      tag: "Safe houses",
      iconSrc: `houses/${s.sprite}`,
      title: s.name,
      lead: own
        ? `Paid for, in a name that is not yours, with a garage nobody can see into from the street. The kind of place where the police knock and nobody is home.`
        : `A quiet street, a garage with a back door and neighbors who work all day. The paperwork takes a week and a little money under the table.`,
      rows: [
        ["Heat hidden per year", `-${s.hide}%`],
        ["Your safe houses", `${c.safe.length}`],
        ...(own ? [["Status", "In your name"]] : [["Price", usdf(s.price)]]),
      ],
      choices: own
        ? [
            [`Sell it (${usdf(Math.round(s.price * 0.55))})`, () => sellSafe(s), "gray"],
            ["Back", () => openSafe(), "gray"],
          ]
        : [
            [`Buy it (${usdf(s.price)})`, () => buySafe(s)],
            ["Back", () => openSafe(), "gray"],
          ],
    });
  }

  function buySafe(s) {
    const c = C();
    if (!c) return openFound();
    if (c.safe.includes(s.id)) return note("Already yours", `You already own the ${s.name.toLowerCase()}.`);
    if (!pay(s.price)) return note("Not enough money", `The ${s.name.toLowerCase()} costs ${usdf(s.price)}.`);
    c.safe.push(s.id);
    addHeat(-2);
    addRespect(1);
    say(`I bought a safe house: ${s.name.toLowerCase()}. The paperwork is in somebody else's name, which is the only kind of paperwork I read.`);
    refresh();
    save();
    openSafe();
  }

  function sellSafe(s) {
    const c = C();
    if (!c) return openFound();
    const i = c.safe.indexOf(s.id);
    if (i < 0) return;
    c.safe.splice(i, 1);
    income(Math.round(s.price * 0.55), "safe house");
    addHeat(3);
    addRespect(-2);
    say(`I sold the ${s.name.toLowerCase()}. Too many people knew the address, and a safe house with a waiting list is just a target with curtains.`);
    refresh();
    save();
    openSafe();
  }

  // ------------------------------------------------------------------ the trucks you own
  const truckBlurb = (t) =>
    t.model === "APC"
      ? "A rolling bunker. Plates thick enough to stop a rifle and a back door that drops like a ramp."
      : t.model === "Gun Truck"
        ? "An armored pickup with a gun box in the bed and ram bars on the nose."
        : "Low profile on the outside, armor underneath and a trunk nobody gets to open.";

  function truckBuyCard(id) {
    const t = truckOf(id);
    const fleet = fleetList();
    if (!fleet) return note("Not your business", "You need to be in a cartel to buy the armored fleet.");
    if (fleet.includes(id)) return openTruck(id);
    jCard({
      tag: "Armored fleet",
      iconSrc: `cars/${t.sprite}.png`,
      title: t.name,
      lead: `${t.make} ${t.model} — ${truckBlurb(t)}${statBarHtml("Armor", t.armor)}<br><br>Do you want to buy it?`,
      rows: [
        ["Price", usdf(t.price)],
        ["Bank balance", usdf(cash())],
        ["Armor", `${t.armor}/100`],
        ["Seats", `${t.seats}`],
        ["Defense", `+${Math.round(t.armor / 6)}`],
      ],
      choices: [
        ["Buy it", () => buyTruck(id)],
        ["Never mind", () => openFleet(), "gray"],
      ],
    });
  }

  function openTruck(id) {
    const t = truckOf(id);
    const fleet = fleetList();
    if (!fleet || !fleet.includes(id)) return buyTruck(id);
    jCard({
      tag: "Armored fleet",
      iconSrc: `cars/${t.sprite}.png`,
      title: t.name,
      lead: `Yours, armored to ${t.armor} and sitting in the garage with a full tank. It is not a car, it is an argument.${statBarHtml("Armor", t.armor)}`,
      rows: [
        ["Armor", `${t.armor}/100`],
        ["Seats", `${t.seats}`],
        ["Defense", `+${Math.round(t.armor / 6)}`],
        ["Resale value", usdf(Math.round(t.price * 0.55))],
      ],
      choices: [
        ["Run a load through the checkpoint", () => truckRun(t)],
        ["Sell it", () => sellTruck(t), "gray"],
        ["Back", () => openFleet(), "gray"],
      ],
    });
  }

  function truckRun(t) {
    const fleet = fleetList();
    if (!fleet || !fleet.includes(t.id)) return openFleet();
    const caught = ch(Math.min(0.75, 0.08 + heatOf() / 400));
    addHeat(3);
    if (caught) {
      const take = Math.round(ri(20000, 45000) + t.armor * 150);
      income(take, "a load");
      addHeat(6);
      addRespect(-1);
      say(`The army stopped the ${t.name}, opened the back and found a very boring load of construction supplies. They kept the story and let it go.`);
      outcome("Searched at the checkpoint", `They opened the back, looked at the crates, took a little cash and waved the truck through. The load was already in another car two miles behind.`, [["Collected", usdf(take)]], openFleet);
    } else {
      const take = ri(40000, 90000) + t.armor * 300;
      income(take, "a load");
      addRespect(ri(1, 2));
      say(`The ${t.name} came back with the money and no bullet holes. For once the armor did the job of a good lawyer.`);
      outcome("Clean run", `Nobody stopped the ${t.name.toLowerCase()} on the way out or on the way back. The armor was not even needed, which is the best way to use it.`, [["Collected", usdf(take)]], openFleet);
    }
  }

  function sellTruck(t) {
    const fleet = fleetList();
    if (!fleet) return openFleet();
    const i = fleet.indexOf(t.id);
    if (i < 0) return openFleet();
    fleet.splice(i, 1);
    if (Array.isArray(state.cars)) {
      const j = state.cars.findIndex((x) => x && x.cls === "Truck" && x.sprite === t.sprite);
      if (j >= 0) state.cars.splice(j, 1);
    }
    income(Math.round(t.price * 0.55), "armored truck");
    addRespect(-2);
    say(`I sold the ${t.name}. It was getting too easy to spot, and a truck everybody recognizes is just a very heavy witness.`);
    openFleet();
  }

  // ------------------------------------------------------------------ police / walk away
  function openHeat() {
    const c = C();
    if (!c) return openFound();
    open(
      "THE POLICE",
      openMyCartel,
      `<div class="row sm mcf">
        <b>Heat: ${c.heat}%</b>
        <span style="display:block;font-size:13px;color:#66707d">Bribes are expensive but they work. Laying low costs respect. A party buys loyalty and attracts attention.</span>
      </div>
      ${row('data-h="bribe"', "emoji/1f4b8.png", "Bribe the commander", `${usdf(40000)} · heat -25, small chance it backfires`)}
      ${row('data-h="low"', "emoji/1f319.png", "Lay low for a year", "heat -15 · respect -4")}
      ${row('data-h="party"', "emoji/1f37e.png", "Throw a party for the crew", `${usdf(18000)} · loyalty +15, heat +10, respect +2`)}`,
    );
    sList.querySelectorAll("[data-h]").forEach(
      (el) =>
        (el.onclick = () => {
          const w = el.dataset.h;
          if (w === "bribe") {
            if (!pay(40000)) return note("Not enough money", "The commander wants $40,000 up front.");
            if (ch(0.18)) {
              addHeat(15);
              addRespect(-5);
              note("He took the money and the file", "The commander kept your envelope and put your name on a different list.", null);
            } else {
              addHeat(-25);
              note("Paid", "The commander's cousin got a new truck. Your file got lost.", null);
            }
            say("I paid the police commander. He kept the envelope, lost my file and told me to have a nice rest of the day.");
          } else if (w === "low") {
            addHeat(-15);
            addRespect(-4);
            say("I kept the operation quiet for a year. Nobody saw anything, nobody earned anything, and my people got bored in the safest possible way.");
          } else {
            if (!pay(18000)) return note("Not enough money", "The party costs $18,000.");
            c.crew.forEach((r) => (r.loyalty = clamp(r.loyalty + 15)));
            addHeat(10);
            addRespect(2);
            say("We threw a party for the crew. Half the town was invited and the other half complained about the noise for a week.");
          }
          refresh();
          save();
          openHeat();
        }),
    );
  }

  function openWalkAway() {
    const c = C();
    if (!c) return openFound();
    jCard({
      tag: "My Cartel",
      iconSrc: logoOf(c),
      title: "Dissolve the cartel?",
      lead: `Walking away means selling the corners, paying off the crew and closing the labs. You keep whatever cash you have, but ${c.name} is finished.`,
      rows: [
        ["Crew to pay off", `${c.crew.length} people`],
        ["Product on hand", `${productUnits(c)} units`],
        ["Trucks", `${c.fleet.length}`],
      ],
      choices: [
        [
          "Dissolve it",
          () => {
            const severance = Math.min(cash(), c.crew.reduce((s, r) => s + roleOf(r.role).pay, 0));
            if (severance) state.money -= severance;
            state.myCartel = null;
            say("I sold the corners and paid everyone off. The cartel is finished, but the story about who used to run this town is just getting started.");
            refresh();
            save();
            goHome();
          },
        ],
        ["Keep it", () => openMyCartel(), "gray"],
      ],
    });
  }

  // ------------------------------------------------------------------ effects + events
  const EVENTS = [
    {
      id: "rival_convoy",
      icon: "emoji/1f6a8.png",
      title: "A rival convoy crossed your plaza",
      lead: "Three trucks with another cartel's plates just drove through the middle of your territory like they own it. Your people are waiting for an order.",
      choices: [
        ["Ambush them", { heat: 8, respect: 6 }, "You hit the convoy at the bridge. Two trucks burned, one got away, and the plaza knows your name.", { p: 0.35, fx: { health: -12, loss: 1, respect: -3 }, msg: "The ambush went wrong. They were waiting for you, and you left a sicario on the road." }],
        ["Let them pass and remember the plates", { respect: -3 }, "You let them drive through. Your crew says nothing, but they noticed."],
        ["Charge them a toll", { money: 12000, respect: 3, heat: 2 }, "You stop the convoy and explain the tax. They pay in cash and leave with their dignity mostly intact."],
      ],
    },
    {
      id: "dea_plane",
      icon: "emoji/26a1.png",
      title: "A DEA plane is circling the valley",
      lead: "A small white plane has passed over the lab twice. It is either a tourist or the beginning of a very bad year.",
      choices: [
        ["Burn the lab and move everything", { product: -25, heat: -12 }, "You torch the lab before the plane comes back. The smell follows you for a week."],
        ["Bribe the pilot through a contact", { money: -35000, heat: -10 }, "A man in a hotel bar takes your envelope. The plane does not come back."],
        ["Ignore it and keep cooking", { heat: 12 }, "You keep working. The plane circles once more and leaves.", { p: 0.3, fx: { heat: 15, loss: 1, money: -20000 }, msg: "The plane was not a tourist. A raid takes the lab and one of your people." }],
      ],
    },
    {
      id: "lab_fire",
      icon: "emoji/1f4a5.png",
      title: "The lab caught fire",
      lead: "A cook dropped a jug and the whole back room went up. Everyone got out, but the batch did not.",
      choices: [
        ["Pay for the burns and rebuild", { money: -18000, loyalty: 8 }, "You pay the clinic and replace the equipment. The crew notices that you showed up."],
        ["Blame the cook and dock his pay", { loyalty: -10, respect: 2 }, "The cook takes the blame. Nobody argues, but nobody forgets either."],
      ],
    },
    {
      id: "mule_arrest",
      icon: "emoji/1f46e.png",
      title: "A mule got stopped at a checkpoint",
      lead: "He swallowed two balloons and got pulled over anyway. He is sitting in a cell with your product in his stomach.",
      choices: [
        ["Send a lawyer", { money: -12000, loyalty: 6 }, "The lawyer gets him out on a technicality. He comes back thinner and quieter."],
        ["Let him sit", { loyalty: -8, heat: -2 }, "You do not spend a dollar on him. The rest of the crew starts asking what happens if it is them."],
        ["Break him out", { heat: 14, respect: 6 }, "Two men and a stolen truck. He is out before dawn, and the police are furious.", { p: 0.4, fx: { loss: 1, heat: 10, respect: -4 }, msg: "The breakout fails. One of your men is shot at the station door." }],
      ],
    },
    {
      id: "cop_cut",
      icon: "emoji/1f4b8.png",
      title: "A local cop wants his cut",
      lead: "He is not asking for much. He says he only wants to be able to buy his kids something at Christmas.",
      choices: [
        ["Pay him every month", { money: -9000, heat: -12 }, "He becomes the most useful employee you have."],
        ["Refuse and humiliate him", { heat: 10, respect: 3 }, "You tell him to get lost in front of his partner. He will remember that."],
        ["Record him taking the money", { respect: 5, heat: 5 }, "You get him on video. Now he works for you for free, and he hates every minute of it.", { p: 0.25, fx: { heat: 12 }, msg: "He sees the phone. The recording disappears, but his report does not." }],
      ],
    },
    {
      id: "journalist",
      icon: "emoji/1f4f0.png",
      title: "A journalist is asking about you",
      lead: "She has a notebook, a photographer and a list of questions about the new trucks in town.",
      choices: [
        ["Buy her a nice dinner and a better story", { money: -15000, heat: -8 }, "She writes about corruption at the port instead. You are not in the article, which is the best review you can get."],
        ["Threaten her", { heat: 12, respect: 4 }, "She leaves town. Her editor does not.", { p: 0.4, fx: { heat: 18, respect: -6 }, msg: "She publishes the threats. Now the whole country is reading about your cartel." }],
        ["Give her an interview, no names", { respect: 4, heat: 6 }, "You talk about growing up poor and wanting a better life. Half the town believes you."],
      ],
    },
    {
      id: "lab_explosion",
      icon: "emoji/26a1.png",
      title: "A chemical drum exploded",
      lead: "It took out a wall, two tables and most of a batch. The neighbors heard it three streets away.",
      choices: [
        ["Pay the neighbors for their windows", { money: -22000, respect: 8, heat: -5 }, "You pay for every broken window and a new roof. People say the cartel is not all bad."],
        ["Replace the drum and keep working", { money: -8000, heat: 8 }, "The lab is running again by morning. So is the gossip."],
      ],
    },
    {
      id: "new_route",
      icon: "emoji/1f30a.png",
      title: "A new route through the port",
      lead: "A dockworker says he can move a container a week through a gate nobody watches. It costs money to open that gate.",
      choices: [
        ["Invest in the route", { money: -40000, product: 30, heat: 4 }, "The first container comes through clean. The route is yours."],
        ["Pass on it", {}, "You let the offer go. Somebody else will take it."],
      ],
    },
    {
      id: "cartel_summit",
      icon: "emoji/1f91d.png",
      title: "The bosses are meeting",
      lead: "Four cartels are meeting in a ranch outside town to divide the plazas. You are invited, which is either an honor or a trap.",
      choices: [
        ["Go in person", { respect: 10, heat: 3 }, "You walk in with two men and walk out with a bigger plaza. Nobody claps, but everybody nods.", { p: 0.2, fx: { health: -20, respect: -4 }, msg: "The meeting was a setup. You get out with a bullet in the shoulder and no new territory." }],
        ["Send your lieutenant", { respect: 3, loyalty: 5 }, "Your lieutenant speaks for you and comes back with a smaller share and a bigger ego."],
        ["Skip it", { respect: -8 }, "You stay home. The bosses divide your plaza without asking."],
      ],
    },
    {
      id: "skimming",
      icon: "emoji/1f4bc.png",
      title: "Someone is skimming the money",
      lead: "The numbers do not add up. Somebody on your payroll is taking a little off the top every week.",
      choices: [
        ["Find them and make an example", { respect: 6, loyalty: -8 }, "You find the accountant. The crew stops stealing, and they stop talking to you too."],
        ["Quietly replace the accountant", { money: -5000, loyalty: 3 }, "The stealing stops. Nobody has to die over a few thousand dollars."],
        ["Let it go", { money: -15000, loyalty: -4 }, "You decide not to look too closely. It gets worse."],
      ],
    },
    {
      id: "stolen_load",
      icon: "emoji/1f4e6.png",
      title: "A shipment disappeared",
      lead: "The truck left the lab full and arrived empty. The driver says he was carjacked at a red light.",
      choices: [
        ["Go after the load", { heat: 8, respect: 6 }, "You find the load in a garage across town and get most of it back.", { p: 0.3, fx: { loss: 1, product: -15, heat: 5 }, msg: "The lead was a trap. You lose the load and a man." }],
        ["Write it off", { product: -10, respect: -3 }, "You eat the loss. The driver keeps his job, which surprises everyone."],
      ],
    },
    {
      id: "brother_wants_in",
      icon: "emoji/1f474.png",
      title: "Your little brother wants a job",
      lead: "He is nineteen, broke and tired of watching you carry cash in grocery bags. He says he can be trusted.",
      choices: [
        ["Give him a job", { member: 1, happiness: -3, heat: 3 }, "He starts at the bottom. Your mother calls you a bad influence, and she is not wrong."],
        ["Say no and pay for his school", { money: -20000, happiness: 4, respect: 2 }, "He is angry for a year. Then he graduates and stops asking."],
        ["Say no and leave it at that", { happiness: -4 }, "He stops coming around. You tell yourself it is for the best."],
      ],
    },
    {
      id: "priest",
      icon: "emoji/1f3ad.png",
      title: "The priest wants money for the church roof",
      lead: "Father Ignacio knows exactly what you do for a living. He also knows the roof leaks on the children's choir.",
      choices: [
        ["Pay for the roof", { money: -25000, respect: 10, heat: -5 }, "The church gets a new roof and a plaque with no name on it. The priest says a mass for your soul anyway."],
        ["Refuse", { respect: -5 }, "The roof keeps leaking. So does the gossip."],
      ],
    },
    {
      id: "track_money",
      icon: "emoji/1f3b0.png",
      title: "Your lieutenant wants to clean money at the track",
      lead: "He has a system: buy losing tickets with dirty cash, cash the winners, and explain the rest as a lucky year.",
      choices: [
        ["Give him the money", { money: -30000, loyalty: 5 }, "He comes back with a receipt, a story and a little less cash than you gave him.", { p: 0.35, fx: { money: -30000, respect: -4 }, msg: "The system does not work. The money disappears into the track's pockets." }],
        ["Tell him to find a real accountant", { respect: 2 }, "He sulks, but he finds an accountant who charges too much and asks no questions."],
      ],
    },
    {
      id: "arms_dealer",
      icon: "emoji/1f52b.png",
      title: "An arms dealer has a crate for you",
      lead: "He opens the trunk of his car. Inside are enough rifles to start a small war, still in the grease.",
      choices: [
        ["Buy the crate", { money: -60000, gun: "ak", respect: 4 }, "You take the crate and a business card with no name on it."],
        ["Haggle hard", { money: -40000, gun: "ak" }, "He accepts, mostly because you brought three men.", { p: 0.3, fx: { heat: 8, respect: -3 }, msg: "He does not like your offer. He leaves, and somebody tells the police about the meeting." }],
        ["Decline", {}, "You tell him you are fine for now. He nods and drives away."],
      ],
    },
    {
      id: "armored_cash",
      icon: "emoji/1f4b0.png",
      title: "An armored truck flipped on the highway",
      lead: "The driver is alive, the back door is open, and there are bags on the asphalt. So is a police radio.",
      choices: [
        ["Grab what you can", { money: 80000, heat: 15 }, "You take three bags and leave before the first patrol arrives."],
        ["Help the driver and call it in", { respect: 5, heat: -5 }, "You pull him out and wait for the ambulance. A witness describes you as a good Samaritan, which is funny to everyone who knows you."],
        ["Drive past", {}, "Not your money, not your problem."],
      ],
    },
    {
      id: "snitch",
      icon: "emoji/1f464.png",
      title: "There is a snitch in the crew",
      lead: "The police knew about the last two moves before you made them. Somebody is talking.",
      choices: [
        ["Root them out", { respect: 6, loyalty: -10 }, "You find the snitch. The crew is safer, and quieter."],
        ["Feed the snitch false information", { heat: -10, respect: 3 }, "The police raid an empty warehouse. Somebody in your crew looks very nervous."],
        ["Ignore it", { heat: 10 }, "You keep working and hope for the best. The police keep knowing things."],
      ],
    },
    {
      id: "police_raid",
      icon: "emoji/1f6a8.png",
      title: "The police are at the gate",
      lead: "Six cars, no sirens, and a battering ram. Somebody inside left the gate unlocked.",
      minHeat: 40,
      choices: [
        ["Bribe the captain", { money: -50000, heat: -20 }, "The captain takes the envelope and suddenly remembers a different address."],
        ["Fight them off", { respect: 8, heat: 15, health: -8 }, "Your people hold the gate long enough to burn the files.", { p: 0.35, fx: { health: -25, loss: 2, heat: 20 }, msg: "You lose the gate and two people. The rest scatter into the hills." }],
        ["Hide and let them search", { product: -20, heat: 6 }, "They find a little and leave with a lot of questions."],
      ],
    },
    {
      id: "mayor",
      icon: "emoji/1f4bc.png",
      title: "The mayor wants a donation",
      lead: "He is up for reelection and needs a new plaza downtown. He says the donation would be good for the whole community.",
      choices: [
        ["Pay him", { money: -45000, heat: -12, respect: 6 }, "The plaza gets a fountain with his name on it. The police get a new chief who is never around."],
        ["Refuse", { heat: 8 }, "He gives a speech about law and order the next week, and your name is not in it."],
      ],
    },
    {
      id: "synthetic",
      icon: "emoji/1f9ea.png",
      title: "Your cook has a new formula",
      lead: "It is cheaper, stronger and terrifying. He says one batch would pay for the whole lab twice.",
      choices: [
        ["Let him cook it", { product: 40, heat: 8, respect: 4 }, "The first batch sells in a week. The second one brings the health inspectors.", { p: 0.25, fx: { health: -15, heat: 15, respect: -4 }, msg: "The formula is too strong. Three of your own people end up in the hospital." }],
        ["Stick to the old product", { respect: 2 }, "You tell him no. He complains for a month and then gets over it."],
      ],
    },
    {
      id: "festival",
      icon: "emoji/1f37e.png",
      title: "The town festival needs a sponsor",
      lead: "The organizers need money for the band, the fireworks and the food stalls. Everyone in town will be there.",
      choices: [
        ["Sponsor the whole thing", { money: -30000, respect: 10, loyalty: 6, heat: -4 }, "Your cartel's name is on the banner, spelled correctly. People cheer when the fireworks go up."],
        ["Give a little", { money: -5000, respect: 3 }, "You pay for the band. It is enough."],
        ["Skip it", { respect: -4 }, "You watch the fireworks from the ranch."],
      ],
    },
    {
      id: "buyout",
      icon: "emoji/1f4b8.png",
      title: "A rival wants to buy you out",
      lead: "They offer enough money to retire twice, plus a house on the coast. All you have to do is sign and disappear.",
      choices: [
        ["Take the money", { money: 250000, respect: -15, loyalty: -20 }, "You sign. Your crew finds out from someone else, and the plaza changes hands by the weekend."],
        ["Refuse and make a show of it", { respect: 8, heat: 6 }, "You tear up the offer in front of the whole crew. Nobody questions whether you are serious after that."],
      ],
    },
    {
      id: "cousin_favor",
      icon: "emoji/1f91d.png",
      title: "Your cousin needs a favor",
      lead: "He owes money to people who are not as patient as you. He is asking for a loan and promising to pay it back.",
      choices: [
        ["Give him the money", { money: -20000, happiness: 3 }, "He pays his debt and stays alive. You do not expect to see the money again."],
        ["Give him a job instead", { member: 1, loyalty: 3 }, "He starts working the corner. At least now you can keep an eye on him."],
        ["Say no", { happiness: -3 }, "He stops answering your calls."],
      ],
    },
    {
      id: "checkpoint",
      icon: "emoji/1f6a8.png",
      title: "There is a new checkpoint on the highway",
      lead: "The army set up a checkpoint between the lab and the city. Every truck is being searched.",
      choices: [
        ["Bribe the soldiers", { money: -25000, heat: -5 }, "The sergeant takes the money and waves the next truck through without looking."],
        ["Send the load through the back roads", { money: -8000, product: -5, heat: 5 }, "The roads are terrible and the truck loses a little product, but it arrives.", { p: 0.3, fx: { product: -20, respect: -4 }, msg: "The back road is a dead end. You lose the whole load." }],
        ["Wait them out", { product: -10 }, "Weeks pass. The product sits in the warehouse and the checkpoint stays."],
      ],
    },
    {
      id: "submarine",
      icon: "emoji/1f30a.png",
      title: "Somebody is selling a semi-submersible",
      lead: "A man from the coast says it can carry two tons without ever showing a light on the surface.",
      choices: [
        ["Buy it", { money: -90000, product: 60, heat: 5 }, "The first run comes in at night. You stand on the beach and watch it arrive."],
        ["Decline", {}, "Too much money and too many things that can sink."],
      ],
    },
    {
      id: "doctor",
      icon: "emoji/1f489.png",
      title: "Your doctor gives you a look",
      lead: "Your blood pressure is bad and your heart is worse. He wants tests, treatment and no more late nights.",
      choices: [
        ["Pay for the treatment", { money: -15000, health: 8 }, "You get the tests and the pills. For a few years you actually take them."],
        ["Ignore it", { health: -8 }, "You leave the office and go straight back to work."],
      ],
    },
    {
      id: "mansion_party",
      icon: "emoji/1f37e.png",
      title: "The crew wants a party at the ranch",
      lead: "They have been working hard and want a night with music, food and too much tequila.",
      choices: [
        ["Throw the party", { money: -12000, loyalty: 15, heat: 10, respect: 3 }, "The music is loud, the meat is good and half the town drives past just to look."],
        ["Keep it quiet", { loyalty: -5 }, "You tell them there will be time later. There never is."],
      ],
    },
    {
      id: "hacker",
      icon: "emoji/1f4be.png",
      title: "A hacker has police files",
      lead: "He says he has a folder with every report, every informant and every name in your file. It costs more than a car.",
      choices: [
        ["Buy the files", { money: -35000, heat: -15 }, "You read the folder twice and burn it. Some of the names surprise you."],
        ["Pass", {}, "You tell him you already know what the police know."],
      ],
    },
    {
      id: "funeral",
      icon: "emoji/1f3ad.png",
      title: "A rival boss died",
      lead: "He died of a heart attack, which is unusual for a man with so many enemies. The whole business will be at the funeral.",
      choices: [
        ["Go to the funeral", { respect: 6, heat: 3 }, "You stand in the back and pay your respects. Three bosses shake your hand."],
        ["Send flowers and stay home", { money: -2000, respect: 2 }, "The flowers are enormous. People talk about them for a week."],
        ["Skip it", { respect: -4 }, "You are the only boss not there. Everyone notices."],
      ],
    },
    {
      id: "podcast",
      icon: "emoji/1f4de.png",
      title: "A podcast is doing an episode about you",
      lead: "Two guys with a microphone are calling you the most interesting criminal in the state. They cannot spell your name.",
      choices: [
        ["Sponsor the episode", { money: -12000, respect: 5, heat: 5 }, "They read your sponsor message with real enthusiasm. The episode gets half a million listens."],
        ["Turn their studio into a cautionary tale", { heat: 10, respect: 4 }, "The episode never comes out. Neither does the next one.", { p: 0.35, fx: { heat: 15, respect: -5 }, msg: "They record the threats too. It becomes their most popular episode." }],
      ],
    },
    {
      id: "ex_soldier",
      icon: "emoji/1f3c1.png",
      title: "An ex-soldier wants to join",
      lead: "He did two tours, knows how to shoot and has no family left. He wants work and he does not care what kind.",
      choices: [
        ["Hire him", { money: -8000, member: 1, respect: 4 }, "He shows up the next morning, early, and stands by the gate until somebody gives him something to do."],
        ["Test him on a job first", { respect: 3 }, "He passes. You hire him and he never once asks about the money.", { p: 0.25, fx: { loss: 1, heat: 6 }, msg: "The test job goes wrong and he does not come back. Neither does the man he was supposed to watch." }],
        ["Send him away", {}, "You tell him you are not hiring. He nods and leaves."],
      ],
    },
    {
      id: "chemical_shortage",
      icon: "emoji/1f4e6.png",
      title: "The chemical supplier is short",
      lead: "The port is closed and the price of precursors has tripled. Without them the lab is just a room with fans.",
      choices: [
        ["Pay the new price", { money: -60000, product: 20 }, "You pay and the drums arrive on a truck with no logo."],
        ["Wait for the price to drop", { product: -20 }, "You wait. The shelves get emptier and the crew gets nervous."],
      ],
    },
    {
      id: "casino_partner",
      icon: "emoji/1f3b2.png",
      title: "A casino owner wants a partner",
      lead: "He has a license, a building and a lot of cash that needs a story. He needs somebody who can handle the story.",
      choices: [
        ["Buy in", { money: -120000, respect: 8, heat: -8 }, "You own a third of a casino now. The paperwork says otherwise, which is the point."],
        ["Decline", { respect: -2 }, "You let the opportunity go. Somebody with a cleaner reputation takes it."],
      ],
    },
    {
      id: "mother",
      icon: "emoji/1f469.png",
      title: "Your mother asks where the money comes from",
      lead: "She is sitting at the kitchen table with a cup of coffee and the newspaper. She already knows.",
      choices: [
        ["Tell her the truth", { happiness: -6, respect: 3 }, "She listens, nods, and tells you she will pray for you. She does not ask again."],
        ["Lie to her", { happiness: 2 }, "You tell her it is construction. She looks at your hands and says nothing."],
        ["Leave the room", { happiness: -3 }, "You walk out. The coffee goes cold on the table."],
      ],
    },
    {
      id: "governor_son",
      icon: "emoji/1f4b3.png",
      title: "The governor's son owes you",
      lead: "He lost a hundred thousand at a private game and signed a piece of paper. His father does not know.",
      choices: [
        ["Collect the money", { money: 100000, heat: 5, respect: 3 }, "He pays in cash and a little bit of dignity. You keep the paper."],
        ["Forgive the debt and keep the paper", { respect: 6, heat: -8 }, "You tear up the paper in front of him. Now he owes you something worse than money."],
        ["Call his father", { heat: -5, respect: 2 }, "The governor calls you personally. The conversation is short and very polite."],
      ],
    },
    {
      id: "earthquake",
      icon: "emoji/1f30a.png",
      title: "An earthquake hits the plaza",
      lead: "Two blocks are in ruins. The church lost its bell tower and half the town is sleeping in the street.",
      choices: [
        ["Open the warehouse as a shelter", { money: -20000, respect: 12, heat: -8 }, "Your people hand out water and blankets. For a week you are the most popular man in town."],
        ["Protect the stash and wait", { money: 0, respect: -6 }, "Your product survives. The town does not forget who helped and who did not."],
      ],
    },
    {
      id: "viral_video",
      icon: "emoji/1f4f8.png",
      title: "A video of your crew went viral",
      lead: "Somebody filmed your sicarios shooting at a range in full tactical gear. It has two million views and a comment from a news anchor.",
      choices: [
        ["Pay to get it taken down", { money: -18000, heat: -8 }, "The video disappears. Copies of it do not."],
        ["Lean into it", { respect: 8, heat: 12 }, "Your crew starts a channel. The recruitment line gets very busy."],
      ],
    },
    {
      id: "old_friend",
      icon: "emoji/1f91d.png",
      title: "An old friend needs money",
      lead: "You went to school together. He has a sick kid and a job that does not cover the bills.",
      choices: [
        ["Give him the money", { money: -15000, happiness: 5, respect: 2 }, "He cries in the parking lot. You tell him to tell everyone it came from a lottery ticket."],
        ["Give him a job", { member: 1, loyalty: 2 }, "He starts driving for you. He is terrible at it and grateful."],
        ["Say no", { happiness: -5 }, "You tell him you cannot help. He nods and leaves, and you think about it for years."],
      ],
    },
    {
      id: "weapons_cache",
      icon: "emoji/1f52b.png",
      title: "A cache in the new safehouse",
      lead: "The previous owner left a false wall in the basement. Behind it are rifles wrapped in oiled cloth.",
      choices: [
        ["Keep them", { gun: "ak", respect: 3 }, "You clean them, oil them and hand them out. Free guns are the best guns."],
        ["Sell them", { money: 25000, heat: 4 }, "A buyer from out of town takes the whole lot in one afternoon."],
      ],
    },
    {
      id: "succession",
      icon: "emoji/1f911.png",
      title: "Your second-in-command is getting ambitious",
      lead: "He has been taking meetings without you and the crew has started looking at him before they look at you.",
      minRespect: 30,
      choices: [
        ["Confront him in front of everyone", { respect: 10, loyalty: -12 }, "You remind him who built this. He backs down, and he does not forget.", { p: 0.3, fx: { health: -20, loss: 1, respect: -5 }, msg: "He came ready. You win the fight, but you lose a man and some of the room's respect." }],
        ["Buy him off with a bigger cut", { money: -60000, loyalty: 8, respect: -3 }, "He takes the money and the title. He is still ambitious, but now he is expensive."],
        ["Promote him and keep him close", { loyalty: 12, respect: 4 }, "You give him a plaza of his own. He is too busy running it to plot against you."],
      ],
    },
    {
      id: "recognized",
      icon: "emoji/1f9d1.png",
      title: "Somebody recognized you on the street",
      lead: "You stop for cigarettes at a gas station and the kid behind the counter freezes, points at you and says your cartel's name out loud. Two people in the line turn around.<br><br>What will you do?",
      minRespect: 15,
      choices: [
        [
          "Sign an autograph and walk out",
          { respect: 4, heat: 4 },
          "You sign a receipt for him. By the time you are back in the car there are three phones out and your face is on the internet.",
          {
            p: 0.3,
            fx: { heat: 8 },
            msg: "The kid posted the photo. A detective saved it next to the file he already had on you.",
          },
        ],
        [
          "Tell him he has the wrong guy",
          { heat: -4, respect: -3 },
          "You deny it flatly. He nods, unconvinced, and the rumor grows taller without you.",
        ],
        [
          "Pay him to forget your face",
          { money: -4000, heat: -8 },
          "Two hundred dollars and a very serious face. He swears he never saw you, and he means it.",
        ],
        [
          "Take him aside and explain who you are",
          { respect: 2, heat: 10 },
          "You tell him exactly what he just did and who else is allowed to hear it. He goes pale and stops talking altogether.",
          {
            p: 0.35,
            fx: { heat: 8, respect: -2 },
            msg: "The woman behind him already had 911 dialed. Now she has a statement to go with it.",
          },
        ],
      ],
    },
  ];

  function applyFx(fx) {
    if (!fx) return [];
    const c = C();
    const out = [];
    if (fx.money) {
      if (fx.money > 0) {
        income(fx.money, "cartel business");
        out.push(`+${usdf(fx.money)} dirty`);
      } else {
        const want = -fx.money;
        const paid = Math.min(want, cash());
        state.money -= paid;
        if (paid < want) addRespect(-2);
        out.push(`-${usdf(paid)}`);
      }
    }
    if (fx.heat) {
      addHeat(fx.heat);
      out.push(`${fx.heat > 0 ? "+" : ""}${fx.heat} heat`);
    }
    if (fx.respect) {
      addRespect(fx.respect);
      out.push(`${fx.respect > 0 ? "+" : ""}${fx.respect} respect`);
    }
    if (fx.loyalty && c) {
      c.crew.forEach((r) => (r.loyalty = clamp(r.loyalty + fx.loyalty)));
      out.push(`${fx.loyalty > 0 ? "+" : ""}${fx.loyalty} loyalty`);
    }
    if (fx.product && c) {
      const n = addProduct(fx.product);
      if (n) out.push(`+${n} units`);
    }
    if (fx.gun && c) {
      c.guns[fx.gun] = (Number(c.guns[fx.gun]) || 0) + 1;
      out.push(`+1 ${gunOf(fx.gun)?.name || fx.gun}`);
    }
    if (fx.member && c) {
      for (let i = 0; i < fx.member; i++) addRecruit(pick(ROLES.slice(0, 2)).id, 30 + Math.round(rnd() * 30));
      out.push(`+${fx.member} recruit${fx.member === 1 ? "" : "s"}`);
    }
    if (fx.loss && c) {
      for (let i = 0; i < fx.loss; i++) loseRecruit();
      out.push(`-${fx.loss} crew`);
    }
    if (fx.health && state.stats) state.stats.Health = clamp((Number(state.stats.Health) || 0) + fx.health);
    if (fx.happiness && state.stats) state.stats.Happiness = clamp((Number(state.stats.Happiness) || 0) + fx.happiness);
    refresh();
    return out;
  }

  function resolveEvent(ev, choice) {
    const [label, fx, msg, risk] = choice;
    const parts = applyFx(fx);
    let text = msg || "";
    if (risk && ch(risk.p)) {
      const rparts = applyFx(risk.fx);
      text = risk.msg;
      parts.push(...rparts);
    }
    const c = C();
    if (c) {
      c.events = (c.events || 0) + 1;
      c.seen = [...new Set([...c.seen, ev.id])];
      if (c.seen.length >= EVENTS.length) c.seen = [ev.id];
    }
    say(`Cartel: ${text}`);
    save();
    jCard({
      tag: "My Cartel",
      iconSrc: ev.icon || "cars/cartel-01.png",
      title: ev.title,
      lead: text,
      rows: [
        ["Your choice", esc(label)],
        ["Respect", `${respectOf()}% · ${rankOf(respectOf())}`],
        ["Heat", `${heatOf()}%`],
        ...(c ? [["Crew", `${c.crew.length} · loyalty ${loyaltyAvg(c)}%`], ["Product", `${productUnits(c)} units`]] : []),
      ],
      choices: [["Continue", () => {}]],
    });
  }

  function eventCard(ev) {
    const c = C();
    jCard({
      tag: "My Cartel",
      iconSrc: ev.icon || logoOf(c),
      title: ev.title,
      lead: ev.lead,
      rows: [
        ["Respect", `${respectOf()}% · ${rankOf(respectOf())}`],
        ["Heat", `${heatOf()}%`],
        ...(c ? [["Crew", `${c.crew.length}`], ["Product", `${productUnits(c)} units`]] : []),
      ],
      choices: ev.choices.map((ch2) => [ch2[0], () => resolveEvent(ev, ch2)]),
    });
  }

  function eligibleEvents() {
    const c = C();
    const seen = c ? c.seen : [];
    const heat = heatOf();
    const res = respectOf();
    let pool = EVENTS.filter((e) => !seen.includes(e.id));
    if (!pool.length) pool = EVENTS.slice();
    const gated = pool.filter((e) => (!e.minHeat || heat >= e.minHeat) && (!e.minRespect || res >= e.minRespect));
    return gated.length ? gated : pool;
  }

  function fireEvent(force, id) {
    if (!inCartel() || state.dead || state.prison) return false;
    const ev = (id && EVENTS.find((e) => e.id === id)) || pick(eligibleEvents());
    if (!ev) return false;
    const show = () => eventCard(ev);
    try {
      if (typeof whenClear === "function") whenClear(show);
      else setTimeout(show, 900);
    } catch {
      setTimeout(show, 900);
    }
    return true;
  }

  // ------------------------------------------------------------------ yearly tick
  function tick() {
    if (state.dead || state.prison || !inCartel()) return;
    const c = C();
    if (c) {
      if (c.tickAge === state.age) return;
      c.tickAge = state.age;

      const pay0 = payroll(c);
      if (pay0 > 0) {
        if (cash() >= pay0) {
          state.money -= pay0;
          say(`I paid the crew ${usdf(pay0)} for the year. Nobody said thank you, but nobody looked at me like a boss who was late either.`);
        } else {
          c.crew.forEach((r) => (r.loyalty = clamp(r.loyalty - 9)));
          c.respect = clamp(c.respect - 4);
          say("I could not make payroll. Two of the crew stopped answering my calls and the rest started asking about the future, which is a polite way of asking about my health.");
        }
      }
      c.heat = clamp(c.heat - 3);
      const hide = hideRate(c);
      if (hide) c.heat = clamp(c.heat - hide);
      const take = turfTake(c);
      if (take > 0) {
        income(take, "territory");
        say(`My corners brought in ${usdf(take)} this year. The money arrives in bags, not statements, and it never quite matches what I expected.`);
      }
      TURF.forEach((t) => {
        const v = Number(c.turf[t.id]) || 0;
        if (v > 0 && ch(0.5)) c.turf[t.id] = clamp(v - (c.heat >= 60 ? 2 : 1));
      });
      const boys = camellos(c);
      if (boys.length) {
        const unitPrice = avgPrice(c);
        let moved = 0,
          gross = 0;
        boys.forEach((b) => {
          if (!ch(0.85)) return; // a slow year on that corner
          const q = takeProduct(c, camelloUnits(b));
          if (!q) return;
          moved += q;
          gross += q * unitPrice * 0.8;
        });
        if (moved) {
          income(Math.round(gross), "camellos", "cartel");
          addHeat(ri(1, 3));
          say(`The camellos moved ${moved} units off the corners for ${usdf(Math.round(gross))}. Half of them rounded down what they owe me and all of them swore the street is slow.`);
        }
        if (ch(0.06 + c.heat / 500)) {
          const gone = boys[Math.floor(rnd() * boys.length)];
          c.dealers = boys.filter((x) => x !== gone);
          addHeat(4);
          say(`${gone.name} got picked up on his corner with product in his sock. The rest of the boys are suddenly very polite about their percentages.`);
        }
      }
      c.crew.forEach((r) => {
        if (ch(0.15)) r.loyalty = clamp(r.loyalty - 3);
        if (ch(0.1)) r.skill = clamp(r.skill + 2);
      });
      if (c.crew.length && loyaltyAvg(c) < 25 && ch(0.25)) {
        const gone = loseRecruit();
        if (gone)
          say(`${gone.name} walked out with a few of our people. Loyalty is cheap until it is not, and now I know exactly what a cheap speech costs.`);
      }
    } else {
      if (state.myCartelFired === state.age) return;
      state.myCartelFired = state.age;
    }
    refresh();
    save();
    if (c && c.heat >= 70 && ch(0.5)) fireEvent(false, "police_raid");
    else if (ch(0.65)) fireEvent();
  }

  // ------------------------------------------------------------------ career menu hook + boot
  // cartel.js calls FL_MYCARTEL.mount(home, beforeSection) after it draws a Cartel career screen.
  function mount(home, before) {
    if (typeof sList === "undefined" || !sList) return;
    HOME = typeof home === "function" ? home : null;
    const old = document.getElementById("flMcRow");
    if (old) old.remove();
    const oldF = document.getElementById("flFleetRow");
    if (oldF) oldF.remove();
    const c = C();
    let html;
    if (c) {
      html = `<div class="sec">My Cartel</div><div class="row" id="flMcRow"><img src="${logoOf(c)}" alt="" style="object-fit:contain"><div class="t"><b>${esc(c.name)}</b><span>${rankOf(c.respect)} · ${c.crew.length} crew · heat ${c.heat}%</span></div>${chev()}</div>`;
    } else if (state.job && state.job.cartel) {
      html = `<div class="row" id="flFleetRow"><img src="cars/cartel-06.png" alt="" style="object-fit:contain"><div class="t"><b>Cartel Fleet</b><span>Buy armored trucks for the cartel</span></div>${chev()}</div>`;
    } else {
      html = `<div class="sec">My Cartel</div><div class="row" id="flMcRow"><img src="cars/cartel-01.png" alt="" style="object-fit:contain"><div class="t"><b>Found your own cartel</b><span>Name, crest, drugs, crew and guns</span></div>${chev()}</div>`;
    }
    const secs = [...sList.querySelectorAll(".sec")];
    const anchor = before && secs.find((e) => e.textContent.trim() === before);
    if (anchor) anchor.insertAdjacentHTML("beforebegin", html);
    else sList.insertAdjacentHTML("afterbegin", html);
    const mc = document.getElementById("flMcRow");
    if (mc)
      mc.onclick = () => {
        snd("choice");
        openMyCartel();
      };
    const fl = document.getElementById("flFleetRow");
    if (fl)
      fl.onclick = () => {
        snd("choice");
        openFleet();
      };
  }

  function hook() {
    const ageBtn = document.getElementById("ageBtn");
    ageBtn &&
      ageBtn.addEventListener("click", () =>
        setTimeout(() => {
          try {
            tick();
          } catch (e) {
            warn("tick", e);
          }
        }, 1400),
      );
  }

  function boot() {
    if (
      typeof state === "undefined" ||
      typeof jCard !== "function" ||
      typeof sList === "undefined" ||
      !document.getElementById("ageBtn")
    )
      return setTimeout(boot, 150);
    if (!window.myCartelHooked) {
      window.myCartelHooked = true;
      hook();
    }
    console.log("[mycartel] loaded");
  }

  window.FL_MYCARTEL = {
    open: openMyCartel,
    found: openFound,
    state: C,
    events: EVENTS,
    fire: () => fireEvent(true),
    tick,
    fleet: openFleet,
    distro: openDistro,
    truck: openTruck,
    buyTruckCard: truckBuyCard,
    roads: openRoads,
    chaos: openChaos,
    turf: openTurf,
    safe: openSafe,
    turfList: TURF,
    safeList: SAFE,
    roadList: ROADS,
    chaosList: CHAOS,
    card: { road: roadCard, chaos: chaosCard, turf: turfCard, safe: safeCard },
    trucks: TRUCKS,
    guns: GUNS,
    fx: applyFx,
    mount,
  };
  boot();
})();
