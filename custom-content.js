/* [mod] Custom People, Custom Cities y Edit Sports Teams (custom-content.js).
 *
 * Main Menu > Custom (abajo de todo). Todo se guarda en localStorage:
 *  - freelife-custom-people: [{ id, first, last, g, age, role }]. Role: sibling, nibling, friend (y las de
 *    familia extendida, que solo se ven con el Family Pack). Cada persona entra sola a la vida al hacer Age
 *    (una vez por vida) o con el botón "Add to my life". Se guarda en state.customIn.
 *  - freelife-custom-cities: [{ name, country }]. Se mezclan en CITIES[country] y salen en el New Life.
 *  - freelife-custom-teams: lo lee custom-teams.js (overlay de FL_FUTBOL_DATA antes de futbol.js).
 */
(() => {
  "use strict";
  if (window.FL_CUSTOM) return;

  const K_PEOPLE = "freelife-custom-people";
  const K_CITIES = "freelife-custom-cities";
  const K_TEAMS = "freelife-custom-teams";

  const read = (k, d) => {
    try {
      const v = JSON.parse(localStorage.getItem(k) || "null");
      return v == null ? d : v;
    } catch {
      return d;
    }
  };
  const write = (k, v) => {
    try {
      localStorage.setItem(k, JSON.stringify(v));
      return true;
    } catch {
      return false;
    }
  };
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const uid = () => "p" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  const val = (id) => (document.getElementById(id)?.value || "").trim();
  const note = (t, m) => {
    if (typeof notice === "function") return notice(t, m, null, true);
    console.warn("[custom-content]", t, m);
    const d = document.createElement("div");
    d.textContent = (t ? t + ": " : "") + m;
    d.style.cssText = "position:fixed;left:50%;bottom:calc(90px + env(safe-area-inset-bottom,0px));transform:translateX(-50%);max-width:86vw;background:rgba(20,22,28,.94);color:#fff;padding:9px 14px;border-radius:12px;font:700 14px/1.3 system-ui,sans-serif;text-align:center;pointer-events:none;z-index:var(--z-safe)";
    document.body.appendChild(d);
    setTimeout(() => d.remove(), 2600);
  };

  const ROLES = [
    ["sibling", "Sibling"],
    ["nibling", "Niece / Nephew"],
    ["friend", "Friend"],
    ["cousin", "Cousin (Family Pack)"],
    ["auntuncle", "Aunt / Uncle (Family Pack)"],
    ["grandparent", "Grandparent (Family Pack)"],
  ];
  const EXT = ["cousin", "auntuncle", "grandparent"];

  // ------------------------------------------------------------ ciudades
  function applyCities() {
    if (!window.CITIES) return;
    for (const c of read(K_CITIES, [])) {
      if (!c || !c.country || !c.name) continue;
      const list = (window.CITIES[c.country] = window.CITIES[c.country] || []);
      if (!list.includes(c.name)) list.push(c.name);
    }
  }

  // ------------------------------------------------------------ personas
  function addToLife(p, quiet) {
    if (typeof state === "undefined" || !state || state.dead) return false;
    state.customIn = Array.isArray(state.customIn) ? state.customIn : [];
    if (state.customIn.includes(p.id)) return false;
    const age = Math.max(0, Math.min(99, Number(p.age) || 0));
    const look = typeof randomLook === "function" ? randomLook(p.g, Math.max(1, age)) : {};
    const off = age - state.age;
    if (p.role === "friend") {
      state.friends = Array.isArray(state.friends) ? state.friends : [];
      if (!state.friends.some((f) => f.first === p.first && f.last === p.last))
        state.friends.push({ first: p.first, last: p.last, g: p.g, look, ageOffset: off, rel: 60 });
    } else {
      state.family = Array.isArray(state.family) ? state.family : [];
      state.family.push({ kind: p.role, g: p.g, first: p.first, last: p.last, ageOffset: off, look, rel: 60 });
    }
    state.customIn.push(p.id);
    if (!quiet && typeof say === "function") say(`${p.first} ${p.last} is part of your life now.`);
    if (!quiet && typeof renderStats === "function") renderStats();
    return true;
  }

  function autoAdd() {
    if (typeof state === "undefined" || !state || state.dead || (typeof lifeLive !== "undefined" && !lifeLive)) return;
    for (const p of read(K_PEOPLE, [])) addToLife(p, false);
  }

  // ------------------------------------------------------------ pantallas
  function showScreen(title, back, html) {
    sTitle.textContent = title;
    if (typeof sSub !== "undefined" && sSub && sSub.style) sSub.style.display = "none";
    sBack.innerHTML = typeof BACK_ICON !== "undefined" ? BACK_ICON : "&larr;";
    sBack.onclick = back;
    sList.innerHTML = html;
    sList.scrollTop = 0;
    sList.querySelectorAll("[data-cu]").forEach((el) => (el.onclick = () => act(el.dataset.cu, el.dataset.id)));
    screen.classList.add("open");
  }
  const field = (id, label, extra = "") =>
    `<div class="row sm" style="display:block;cursor:default"><b style="display:block;margin-bottom:4px">${label}</b><input id="${id}" ${extra} style="width:100%;box-sizing:border-box;padding:8px 10px;border:1px solid #c9d3e0;border-radius:8px;font:inherit;font-size:16px"></div>`;
  const btn = (act, label, id = "") =>
    `<div class="row" data-cu="${act}"${id ? ` data-id="${esc(id)}"` : ""}><div class="t"><b>${label}</b></div></div>`;

  function openPeople() {
    const list = read(K_PEOPLE, []);
    const roles = ROLES.map(([v, l]) => `<option value="${v}">${esc(l)}</option>`).join("");
    const rows = list
      .map(
        (p) =>
          `<div class="row sm"><div class="t"><b>${esc(p.first)} ${esc(p.last)} <em>(${esc(ROLES.find((r) => r[0] === p.role)?.[1] || p.role)}, ${p.age}, ${p.g === "f" ? "F" : "M"})</em></b></div></div>` +
          (typeof state !== "undefined" && state && !state.dead && !(state.customIn || []).includes(p.id)
            ? btn("add-person", "Add to my life", p.id)
            : "") +
          btn("del-person", "Delete", p.id),
      )
      .join("");
    showScreen(
      "CUSTOM PEOPLE",
      () => openMainMenuSafe(),
      '<div class="sec">Your people</div>' +
        (rows || '<div class="row dis"><div class="t"><b>Nobody yet</b><span>Create someone below</span></div></div>') +
        '<div class="sec">New person</div>' +
        field("cu-first", "First name", 'maxlength="24"') +
        field("cu-last", "Last name", 'maxlength="24"') +
        `<div class="row sm" style="display:block;cursor:default"><b style="display:block;margin-bottom:4px">Gender</b><select id="cu-g" style="width:100%;padding:8px;font:inherit;font-size:16px"><option value="f">Female</option><option value="m">Male</option></select></div>` +
        field("cu-age", "Age", 'type="number" min="0" max="99" value="25"') +
        `<div class="row sm" style="display:block;cursor:default"><b style="display:block;margin-bottom:4px">Relation</b><select id="cu-role" style="width:100%;padding:8px;font:inherit;font-size:16px">${roles}</select></div>` +
        btn("save-person", "Save person"),
    );
  }

  function openCities() {
    const list = read(K_CITIES, []);
    const countries = Object.entries(window.COUNTRIES || {})
      .map(([code, v]) => [code, v[0]])
      .sort((a, b) => a[1].localeCompare(b[1]))
      .map(([code, name]) => `<option value="${esc(code)}">${esc(name)}</option>`)
      .join("");
    const rows = list
      .map((c, i) => `<div class="row sm"><div class="t"><b>${esc(c.name)} <em>(${esc((window.COUNTRIES?.[c.country] || [c.country])[0])})</em></b></div></div>` + btn("del-city", "Delete", String(i)))
      .join("");
    showScreen(
      "CUSTOM CITIES",
      () => openMainMenuSafe(),
      '<div class="sec">Your cities</div>' +
        (rows || '<div class="row dis"><div class="t"><b>No custom cities</b><span>Add your hometown below</span></div></div>') +
        '<div class="sec">New city</div>' +
        field("cu-city", "City name", 'maxlength="40"') +
        `<div class="row sm" style="display:block;cursor:default"><b style="display:block;margin-bottom:4px">Country</b><select id="cu-country" style="width:100%;padding:8px;font:inherit;font-size:16px">${countries}</select></div>` +
        btn("save-city", "Save city") +
        '<div class="row dis"><div class="t"><span>Shows up in the New Life city picker for that country.</span></div></div>',
    );
  }

  function openSports() {
    const leagues = (window.FL_FUTBOL_DATA && window.FL_FUTBOL_DATA.leagues) || [];
    const rows = leagues
      .filter((l) => Array.isArray(l.clubs))
      .map((l) => `<div class="row" data-cu="league" data-id="${esc(l.id)}"><div class="t"><b>${esc(l.name)}</b><span>${l.clubs.length} clubs</span></div></div>`)
      .join("");
    showScreen(
      "EDIT SPORTS TEAMS",
      () => openMainMenuSafe(),
      '<div class="sec">Leagues</div>' +
        (rows || '<div class="row dis"><div class="t"><b>No leagues loaded</b></div></div>') +
        '<div class="row dis"><div class="t"><span>Changes apply the next time the page loads (reload the game), before a Football Career starts.</span></div></div>',
    );
  }

  function openLeague(id) {
    const leagues = (window.FL_FUTBOL_DATA && window.FL_FUTBOL_DATA.leagues) || [];
    const l = leagues.find((x) => x.id === id);
    if (!l) return openSports();
    const rows = (l.clubs || [])
      .map((c) => `<div class="row" data-cu="club" data-id="${esc(c.id)}"><div class="t"><b>${esc(c.name)}</b><span>Strength ${c.rep}</span></div></div>`)
      .join("");
    const leagueOpts = leagues.map((x) => `<option value="${esc(x.id)}"${x.id === id ? " selected" : ""}>${esc(x.name)}</option>`).join("");
    showScreen(
      l.name.toUpperCase(),
      () => openSports(),
      '<div class="sec">Clubs</div>' +
        rows +
        '<div class="sec">Add a team</div>' +
        field("cu-tname", "Team name", 'maxlength="40"') +
        field("cu-trep", "Strength (1-100)", 'type="number" min="1" max="100" value="60"') +
        `<div class="row sm" style="display:block;cursor:default"><b style="display:block;margin-bottom:4px">League</b><select id="cu-tleague" style="width:100%;padding:8px;font:inherit;font-size:16px">${leagueOpts}</select></div>` +
        btn("add-team", "Add team") +
        `<input type="hidden" id="cu-curleague" value="${esc(id)}">`,
    );
  }

  function openClub(clubId) {
    const leagues = (window.FL_FUTBOL_DATA && window.FL_FUTBOL_DATA.leagues) || [];
    let league = null,
      club = null;
    for (const l of leagues) {
      const c = (l.clubs || []).find((x) => x.id === clubId);
      if (c) (league = l), (club = c);
    }
    if (!club) return openSports();
    const leagueOpts = leagues.map((x) => `<option value="${esc(x.id)}"${x.id === league.id ? " selected" : ""}>${esc(x.name)}</option>`).join("");
    showScreen(
      club.name.toUpperCase(),
      () => openLeague(league.id),
      '<div class="sec">Edit team</div>' +
        field("cu-cname", "Name", `maxlength="40" value="${esc(club.name)}"`) +
        field("cu-crep", "Strength (1-100)", `type="number" min="1" max="100" value="${club.rep}"`) +
        `<div class="row sm" style="display:block;cursor:default"><b style="display:block;margin-bottom:4px">League / level</b><select id="cu-cleague" style="width:100%;padding:8px;font:inherit;font-size:16px">${leagueOpts}</select></div>` +
        btn("save-club", "Save team", clubId),
    );
  }

  function openMainMenuSafe() {
    if (typeof openMainMenu === "function") openMainMenu();
  }

  // ------------------------------------------------------------ acciones
  function act(a, id) {
    if (a === "save-person") {
      const first = val("cu-first"),
        last = val("cu-last"),
        age = Math.round(Number(val("cu-age")));
      if (!first) return note("Missing name", "Give the person a first name.");
      if (!(age >= 0 && age <= 99)) return note("Bad age", "Age must be between 0 and 99.");
      const list = read(K_PEOPLE, []);
      const p = { id: uid(), first, last, g: val("cu-g") === "m" ? "m" : "f", age, role: val("cu-role") };
      list.push(p);
      write(K_PEOPLE, list);
      if (EXT.includes(p.role) && !(window.mods && mods.extFamily)) note("Saved", "Family Pack roles only show in Relationships if the Family Pack is on.");
      else addToLife(p, false);
      return openPeople();
    }
    if (a === "del-person") {
      write(K_PEOPLE, read(K_PEOPLE, []).filter((p) => p.id !== id));
      return openPeople();
    }
    if (a === "add-person") {
      const p = read(K_PEOPLE, []).find((x) => x.id === id);
      if (p) addToLife(p, false);
      return openPeople();
    }
    if (a === "save-city") {
      const name = val("cu-city").slice(0, 40),
        country = val("cu-country");
      if (!name) return note("Missing name", "Type a city name.");
      if (!window.COUNTRIES || !window.COUNTRIES[country]) return note("Bad country", "Pick a country from the list.");
      const list = read(K_CITIES, []);
      if (list.some((c) => c.name === name && c.country === country)) return note("Already there", "That city is already in the list.");
      list.push({ name, country });
      write(K_CITIES, list);
      applyCities();
      return openCities();
    }
    if (a === "del-city") {
      const list = read(K_CITIES, []);
      list.splice(+id, 1);
      write(K_CITIES, list);
      return openCities();
    }
    if (a === "league") return openLeague(id);
    if (a === "club") return openClub(id);
    if (a === "save-club") {
      const name = val("cu-cname").slice(0, 40),
        rep = Math.max(1, Math.min(100, Math.round(Number(val("cu-crep")) || 1))),
        leagueId = val("cu-cleague");
      if (!name) return note("Missing name", "A team needs a name.");
      const data = read(K_TEAMS, { edits: {}, added: [] });
      data.edits = data.edits || {};
      data.edits[id] = { name, rep, leagueId };
      write(K_TEAMS, data);
      note("Saved", "Reload the game to see the change in football careers.");
      return openClub(id);
    }
    if (a === "add-team") {
      const name = val("cu-tname").slice(0, 40),
        rep = Math.max(1, Math.min(100, Math.round(Number(val("cu-trep")) || 60))),
        leagueId = val("cu-tleague"),
        cur = val("cu-curleague") || leagueId;
      if (!name) return note("Missing name", "A team needs a name.");
      const data = read(K_TEAMS, { edits: {}, added: [] });
      data.added = Array.isArray(data.added) ? data.added : [];
      data.added.push({ id: "custom-" + uid(), name, rep, leagueId });
      write(K_TEAMS, data);
      note("Added", "Reload the game to see the new team in football careers.");
      return openLeague(cur);
    }
  }

  // ------------------------------------------------------------ menú principal
  function addMenuRows() {
    if (document.getElementById("cuSec")) return;
    const rows = [
      ["people", "hand-writing", "Custom People", "Make your friends appear in the game!"],
      ["cities", "cityscape", "Custom Cities", "Add your hometown to the game!"],
      ["sports", "basketball", "Edit Sports Teams", "Change team names & more!"],
    ];
    const html =
      '<div class="sec" id="cuSec">Custom</div>' +
      rows
        .map(
          ([k, ic, t, s]) =>
            `<div class="row mm" data-cu-menu="${k}"><img src="menu/${ic}.png" onerror="this.src='ui/gear.png'"><div class="t"><b>${t}</b><span>${s}</span></div>${typeof CHEV !== "undefined" ? CHEV : ""}</div>`,
        )
        .join("");
    sList.insertAdjacentHTML("beforeend", html);
    sList.querySelectorAll("[data-cu-menu]").forEach((r) => {
      r.onclick = () => {
        const k = r.dataset.cuMenu;
        if (k === "people") openPeople();
        else if (k === "cities") openCities();
        else openSports();
      };
    });
  }

  function hookMenu() {
    const orig = openMainMenu;
    openMainMenu = function () {
      const r = orig.apply(this, arguments);
      try {
        addMenuRows();
      } catch (e) {
        console.warn("[custom-content] menu", e);
      }
      return r;
    };
  }

  function boot() {
    if (typeof state === "undefined" || typeof openMainMenu !== "function" || typeof sList === "undefined" || !document.getElementById("ageBtn") || !window.CITIES) return setTimeout(boot, 150);
    applyCities();
    hookMenu();
    document.getElementById("ageBtn").addEventListener("click", () => setTimeout(autoAdd, 900));
    console.log("[custom-content] loaded");
  }

  window.FL_CUSTOM = { people: openPeople, cities: openCities, sports: openSports, autoAdd, applyCities };
  boot();
})();
