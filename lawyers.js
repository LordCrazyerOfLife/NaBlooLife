/* [mod] Lawyers for NaBlooLife (lawyers.js).
 *
 * Activities -> Lawyers: five local firms, ordered from the cheapest/least skilled
 * to the most expensive/best. You can keep ONE lawyer on retainer; the fee is paid
 * every year on Age up. A retained lawyer:
 *   - appears for free in the "Criminal Charges" screen (no hiring fee),
 *   - improves the chance of a not-guilty verdict / dismissal,
 *   - shortens the sentence (guilty, no contest or a conviction),
 *   - improves the odds in civil lawsuits (Activities -> Lawsuit).
 * Criminal integration lives in game.html (charges/verdict/lawsuit), guarded by
 * window.FL_LAWYERS, so the mod can be removed without breaking the game.
 * Debug: FL_LAWYERS.open(), FL_LAWYERS.roster().
 */
(() => {
  "use strict";
  if (window.FL_LAWYERS) return;

  const ri = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const pick = (a) => a[Math.floor(Math.random() * a.length)];
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const usdf = (n) => {
    try {
      return usd(n);
    } catch {
      return "$" + Math.round(n).toLocaleString("en-US");
    }
  };
  const price = (n) => Math.max(1, Math.round(typeof localPrice === "function" ? localPrice(n) : n));
  const chev = () => (typeof CHEV !== "undefined" ? CHEV : "");
  const snd = (n) => {
    try {
      play(n || "choice");
    } catch {}
  };
  const broke = (n) => {
    try {
      return typeof brokeRows === "function" ? brokeRows(n) : "";
    } catch {
      return "";
    }
  };

  const FIRST = ["Harvey", "Marla", "Elliot", "Nora", "Saul", "Alicia", "Dennis", "Rachel", "Omar", "Vivian", "Caleb", "Tess", "Julian", "Priya", "Marcus", "Lena", "Arthur", "Sofia", "Dante", "Greta"];
  const LAST = ["Specter", "Vance", "Hollis", "Reyes", "Goodman", "Florrick", "Crane", "Weiss", "Haddad", "Lockhart", "Boone", "Kessler", "Mercer", "Nair", "Cole", "Petrova", "Bell", "Duarte", "Moretti", "Sloan"];
  const FIRMS = ["Specter & Associates", "Vance Legal Group", "Hollis Law Offices", "Reyes & Partners", "Goodman & McGill", "Florrick Legal", "Crane & Crane", "Weiss & Weiss", "Haddad Law", "Lockhart Gardner", "Boone & Boone", "Kessler Legal", "Mercer & Sons", "Nair Law Group", "Cole & Bailey", "Petrov & Associates", "Bell, Ross & Bell", "Duarte Legal", "Moretti Law Offices", "Sloan & Hart"];
  const SPECS = ["criminal defense", "civil litigation", "white-collar crime", "personal injury", "corporate law", "family law"];
  const BIOS = [
    "Keeps a framed photo of a not-guilty verdict on the wall behind the desk.",
    "Talks fast, bills faster, and has never lost a case he actually wanted.",
    "Started as a public defender and never forgot what a bad deal looks like.",
    "Has a judge on speed dial and a tailor on standby.",
    "Reads the whole file twice before saying a word in court.",
    "Known for finding the one paragraph the prosecution hoped nobody would read.",
    "Charges by the hour, wins by the year.",
    "Once got a confession thrown out because the coffee was cold.",
  ];

  function makeRoster() {
    const used = new Set();
    const out = [];
    for (let i = 0; i < 5; i++) {
      let name;
      do {
        name = `${pick(FIRST)} ${pick(LAST)}`;
      } while (used.has(name));
      used.add(name);
      // skill always rises from the first row to the fifth
      const skill = Math.min(97, 30 + i * 13 + ri(0, 8));
      out.push({
        id: `lw${i}_${ri(1000, 9999)}`,
        name,
        firm: pick(FIRMS),
        skill,
        spec: pick(SPECS),
        bio: pick(BIOS),
        fee: Math.round(price(1800 + skill * skill * 7) / 100) * 100,
        wins: ri(4, 30) + i * 14,
        losses: ri(2, 18) + i * 3,
      });
    }
    return out;
  }

  const D = () => {
    let d = state.lawyers;
    if (!d || !Array.isArray(d.list) || d.list.length !== 5) {
      d = state.lawyers = { list: makeRoster(), retained: null, paidAge: -1, wins: 0, losses: 0 };
    }
    if (typeof d.paidAge !== "number") d.paidAge = -1;
    return d;
  };
  const retained = () => {
    const d = D();
    return d.retained ? d.list.find((l) => l.id === d.retained) || null : null;
  };
  const bonus = () => {
    const l = retained();
    return l ? l.skill / 600 : 0;
  };
  const civilBonus = () => {
    const l = retained();
    return l ? l.skill / 500 : 0;
  };
  const sentenceCut = () => {
    const l = retained();
    return l ? l.skill / 600 : 0;
  };

  function retain(l) {
    const d = D();
    if (state.money < l.fee)
      return notice("Not enough", `You need ${usdf(l.fee)} to put ${esc(l.name)} on retainer.`, () => lawyerCard(l), true, broke(l.fee));
    state.money -= l.fee;
    d.retained = l.id;
    d.paidAge = state.age;
    try {
      renderStats();
    } catch {}
    say(`I retained ${l.name} of ${l.firm} for ${usdf(l.fee)} a year.`);
    notice("On retainer", `${esc(l.name)} will handle your cases for the next year.`, () => openLawyers(), true);
  }

  function release(l) {
    const d = D();
    d.retained = null;
    say(`I let ${l.name} go. The retainer was getting expensive.`);
    notice("Off retainer", `${esc(l.name)} is no longer representing you.`, () => openLawyers(), true);
  }

  function lawyerCard(l) {
    const d = D(),
      cur = retained();
    const onIt = cur && cur.id === l.id;
    jCard({
      tag: "Lawyer",
      iconSrc: "act/lawsuit.png",
      title: l.name,
      close: () => openLawyers(),
      lead: `${esc(l.bio)}<br><br>${esc(l.firm)} · ${esc(l.spec)}`,
      rows: [
        ["Skill", `${l.skill}/100`],
        ["Retainer", `${usdf(l.fee)} a year`],
        ["Record", `${l.wins}W – ${l.losses}L`],
        ["In court", `+${Math.round((l.skill / 6))}% to win · shorter sentences`],
      ],
      choices: [
        onIt
          ? ["Release from retainer", () => release(l)]
          : [`Retain for ${usdf(l.fee)}`, () => retain(l)],
        ["Back", () => openLawyers()],
      ],
    });
  }

  function openLawyers() {
    if (typeof screen === "undefined" || typeof sList === "undefined") return;
    snd();
    const d = D(),
      cur = retained();
    sTitle.textContent = "LAWYERS";
    if (typeof sSub !== "undefined" && sSub && sSub.style) sSub.style.display = "none";
    sBack.innerHTML = typeof BACK_ICON !== "undefined" ? BACK_ICON : "&larr;";
    sBack.onclick = () => (typeof openActivities === "function" ? openActivities() : screen.classList.remove("open"));
    let h = `<div class="sec">Your attorney</div>`;
    h += cur
      ? `<div class="row" data-lw="${cur.id}"><img src="act/lawsuit.png" alt=""><div class="t"><b>${esc(cur.name)} <em>(on retainer)</em></b><span>${esc(cur.firm)} · Skill ${cur.skill}/100 · ${usdf(cur.fee)} a year</span></div>${chev()}</div>`
      : `<div class="row" style="cursor:default"><img src="prison/scale.png" alt=""><div class="t"><b>No lawyer on retainer</b><span>Pick a firm below. The fee is charged every year.</span></div></div>`;
    h += `<div class="sec">Local firms (${d.list.length})</div>`;
    h += d.list
      .map(
        (l) =>
          `<div class="row${cur && cur.id === l.id ? " dis" : ""}" data-lw="${l.id}"><img src="act/lawsuit.png" alt=""><div class="t"><b>${esc(l.name)}</b><span>${esc(l.firm)} · Skill ${l.skill}/100 · ${usdf(l.fee)}/yr</span></div>${cur && cur.id === l.id ? "" : chev()}</div>`,
      )
      .join("");
    h += `<div class="mm-foot" style="padding:10px 14px;text-align:left">A retained lawyer joins your criminal case for free, improves your odds of a dismissal or a not-guilty verdict, and gets you a shorter sentence. They also help in civil lawsuits.</div>`;
    sList.innerHTML = h;
    sList.querySelectorAll("[data-lw]").forEach((el) => {
      if (el.classList.contains("dis")) return;
      el.onclick = () => {
        const l = d.list.find((x) => x.id === el.dataset.lw);
        if (l) lawyerCard(l);
      };
    });
    sList.scrollTop = 0;
    screen.classList.add("open");
  }

  // yearly retainer: charged after the game's own Age up handlers have run
  if (typeof ageBtnEl !== "undefined" && ageBtnEl)
    ageBtnEl.addEventListener("click", () => {
      try {
        if (state.dead) return;
        const d = D(),
          l = retained();
        if (!l || d.paidAge === state.age) return;
        if (state.money < l.fee) {
          d.retained = null;
          say(`I couldn't pay ${l.name}'s ${usdf(l.fee)} retainer, so ${l.firm} dropped me as a client.`);
          return;
        }
        state.money -= l.fee;
        d.paidAge = state.age;
        renderStats();
        say(`I paid ${l.name} ${usdf(l.fee)} to stay on retainer for another year.`);
      } catch (e) {
        console.warn("[lawyers] retainer", e);
      }
    });

  // ------------------------------------------------------------------ Activities entry
  const origAct = window.openActivities;
  if (typeof origAct === "function")
    window.openActivities = function () {
      const r = origAct.apply(this, arguments);
      try {
        if (typeof sTitle !== "undefined" && sTitle.textContent === "ACTIVITIES" && !document.getElementById("flLawRow")) {
          const cur = retained();
          const sub = cur
            ? `${cur.name} on retainer · Skill ${cur.skill}/100 · ${usdf(cur.fee)}/yr`
            : "Five local firms · no lawyer on retainer";
          const html = `<div class="row" id="flLawRow"><img src="act/lawsuit.png" alt=""><div class="t"><b>Lawyers</b><span>${esc(sub)}</span></div>${chev()}</div>`;
          const sur = document.getElementById("actSurrender");
          if (sur) sur.insertAdjacentHTML("beforebegin", html);
          else sList.insertAdjacentHTML("beforeend", html);
          document.getElementById("flLawRow").onclick = openLawyers;
        }
      } catch (e) {
        console.warn("[lawyers] activities", e);
      }
      return r;
    };

  function boot() {
    if (typeof state === "undefined" || typeof openActivities !== "function" || typeof jCard !== "function" || typeof sList === "undefined" || !document.getElementById("ageBtn")) return setTimeout(boot, 150);
    D();
    console.log("[lawyers] loaded");
  }

  window.FL_LAWYERS = { open: openLawyers, retained, bonus, civilBonus, sentenceCut, roster: () => D().list.slice() };
  boot();
})();
