/* [mod] Money Laundering for NaBlooLife (local mod).
 *
 * Dirty money is not spendable money. Proceeds from SIM swapping, fences, stolen art and cartel
 * business land in a dirty pool instead of the bank account; you have to launder them in
 * Activities -> Money Laundering.
 *
 * Fronts: car wash, laundromat, bar, construction firm, casino, offshore shell company and a
 * crypto mixer. Each has its own cut, yearly capacity and chance of an audit. If you have a legit
 * special career (Movie Director, Musician, pro athlete) you can also run money through it: bigger
 * capacity and a friendlier cut, because the income looks plausible.
 *
 * Past crimes: every dirty payment leaves a paper trail. Investigators reopen old cases years
 * later. You can pay a lawyer, bribe the detective or say nothing; if you lose the case, you get
 * charged for the old crime.
 *
 * State: state.launder = { dirty, cleaned, fees, seen, fronts:{id:{age,used}}, cases:[...] }.
 * API: FL_LAUNDER.dirty(amount, source, tag), FL_LAUNDER.take(amount, source, tag),
 *      FL_LAUNDER.open(), FL_LAUNDER.state(), FL_LAUNDER.tick().
 */
(() => {
  "use strict";
  if (window.FL_LAUNDER) return;

  const rnd = Math.random;
  const esc = (s) =>
    String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const warn = (w, e) => console.warn("[launder] " + w, e);
  const usdf = (n) => {
    try {
      return usd(n);
    } catch {
      return "$" + Math.round(n || 0).toLocaleString("en-US");
    }
  };
  const pct = (v) => `${Math.round((Number(v) || 0) * 100)}%`;
  const clamp = (v, a = 0, b = 100) => Math.max(a, Math.min(b, v));
  const chev = () => (typeof CHEV !== "undefined" ? CHEV : "");
  const row = (data, ic, t, s) =>
    `<div class="row" ${data}><img src="${ic}" alt="" style="object-fit:contain"><div class="t"><b>${esc(t)}</b><span>${s}</span></div>${chev()}</div>`;
  const openScreen = (title, back, html) => {
    sTitle.textContent = title;
    if (typeof sSub !== "undefined" && sSub && sSub.style) sSub.style.display = "none";
    sBack.innerHTML = typeof BACK_ICON !== "undefined" ? BACK_ICON : "&larr;";
    sBack.onclick = back;
    sList.innerHTML = html;
    sList.scrollTop = 0;
    screen.classList.add("open");
  };
  const card = (o) => {
    try {
      jCard({ tag: "Money Laundering", ...o });
    } catch (e) {
      warn("card", e);
    }
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
  const log = (s) => {
    try {
      say(s);
    } catch {}
  };
  const note = (t, m, cb) => {
    try {
      notice(t, m, cb || null, true);
    } catch {}
  };

  // ------------------------------------------------------------------ state
  const S = () => {
    if (!state.launder || typeof state.launder !== "object") state.launder = {};
    const l = state.launder;
    l.dirty = Math.max(0, Number(l.dirty) || 0);
    l.fronts ||= {};
    l.cases ||= [];
    l.tickAge ??= -1;
    return l;
  };
  const enabled = () => !state.dead && !state.prison && state.era !== "1800s" && state.age >= 16;

  const heatNow = () => {
    try {
      return window.FL_RICH ? Number(FL_RICH.state().heat) || 0 : 0;
    } catch {
      return 0;
    }
  };
  const heat = (d) => {
    try {
      if (window.FL_RICH) {
        const r = FL_RICH.state();
        r.heat = clamp((Number(r.heat) || 0) + d);
      }
    } catch {}
  };

  // ------------------------------------------------------------------ crimes that leave a trail
  const SOURCES = {
    simswap: { label: "SIM swapping", crime: "money laundering", years: [2, 6], det: "fraud" },
    blackmarket: { label: "selling stolen goods", crime: "possession of stolen property", years: [1, 4], det: "property" },
    art: { label: "selling stolen art", crime: "possession of stolen property", years: [1, 4], det: "property" },
    cartel: { label: "cartel business", crime: "drug trafficking", years: [4, 15], det: "narcotics" },
    other: { label: "unexplained cash", crime: "money laundering", years: [1, 4], det: "fraud" },
  };
  const srcOf = (tag) => SOURCES[tag] || SOURCES.other;

  const addCase = (amount, label, tag) => {
    const l = S();
    const last = l.cases[l.cases.length - 1];
    if (last && !last.closed && last.age === state.age && last.tag === tag) {
      last.amount += amount;
      return last;
    }
    const c = {
      id: (l.caseSeq = (l.caseSeq || 0) + 1),
      age: state.age,
      amount,
      tag,
      label: label || srcOf(tag).label,
      probed: 0,
      closed: false,
    };
    l.cases.push(c);
    if (l.cases.length > 40) l.cases.splice(0, l.cases.length - 40);
    return c;
  };

  // ------------------------------------------------------------------ dirty money in, dirty money out
  function dirty(amount, source, tag) {
    amount = Math.round(Number(amount) || 0);
    if (!(amount > 0)) return 0;
    if (state.dead || state.prison) return 0;
    const l = S();
    l.dirty += amount;
    l.earned = (l.earned || 0) + amount;
    l.seen = true;
    addCase(amount, source, tag || "other");
    log(
      `I put ${usdf(amount)} of dirty money from ${source || "the street"} aside. It has to be laundered (Activities, Money Laundering) before I can spend it.`,
    );
    refresh();
    save();
    return amount;
  }

  function take(amount, source, tag) {
    amount = Math.round(Number(amount) || 0);
    if (!(amount > 0)) return 0;
    const avail = Math.max(0, Math.round(Number(state.money) || 0));
    const n = Math.min(amount, avail);
    if (!(n > 0)) return 0;
    state.money -= n;
    return dirty(n, source, tag);
  }

  const spend = (n) => {
    n = Math.round(n);
    if (!(n > 0)) return true;
    if ((Number(state.money) || 0) < n) return false;
    state.money -= n;
    refresh();
    save();
    return true;
  };

  // ------------------------------------------------------------------ fronts
  const FRONTS = [
    {
      id: "wash",
      name: "Car Wash",
      icon: "emoji/1f697.png",
      fee: 0.18,
      risk: 0.03,
      cap: 30000,
      why: "Cash business, lots of soap, very few actual customers.",
    },
    {
      id: "laundro",
      name: "Laundromat",
      icon: "emoji/1f9fa.png",
      fee: 0.15,
      risk: 0.04,
      cap: 120000,
      why: "Coin machines and no receipts. The classic for a reason.",
    },
    {
      id: "bar",
      name: "Neighborhood Bar",
      icon: "emoji/1f37a.png",
      fee: 0.22,
      risk: 0.05,
      cap: 600000,
      why: "Nobody can prove how many drinks you actually sold.",
    },
    {
      id: "build",
      name: "Construction Firm",
      icon: "emoji/1f3e2.png",
      fee: 0.27,
      risk: 0.06,
      cap: 5000000,
      why: "Subcontractors, materials and invoices that never quite match.",
    },
    {
      id: "casino",
      name: "Casino Chips",
      icon: "emoji/1f3b0.png",
      fee: 0.35,
      risk: 0.08,
      cap: 40000000,
      why: "Walk in with cash, walk out with a winning ticket.",
    },
    {
      id: "offshore",
      name: "Offshore Shell Company",
      icon: "emoji/1f3e6.png",
      fee: 0.45,
      risk: 0.02,
      cap: 0,
      why: "Slow, expensive, and the paper trail ends on an island.",
    },
    {
      id: "mixer",
      name: "Crypto Mixer",
      icon: "crime/laptop.png",
      fee: 0.12,
      risk: 0.18,
      cap: 0,
      why: "Fast and cheap, but one bad exit wallet and the coins are gone.",
    },
  ];

  const CAREERS = [
    {
      id: "film",
      name: "Your Film Studio",
      icon: "director/clap.png",
      fee: 0.12,
      risk: 0.02,
      cap: () =>
        state.dir && state.dir.active ? Math.round(Math.pow(Math.max(20, Number(state.dir.rep) || 30), 2.3) * 400) : 0,
      have: () => !!(state.dir && state.dir.active),
      why: "Film budgets are enormous and nobody can prove what a shoot really cost.",
    },
    {
      id: "music",
      name: "Your Record Label",
      icon: "emoji/1f3b5.png",
      fee: 0.15,
      risk: 0.03,
      cap: () => {
        const n = ((state.music && state.music.releases) || []).length;
        return n ? n * 400000 + 150000 : 0;
      },
      have: () => !!((state.music && state.music.releases) || []).length,
      why: "Advance payments, royalties and tour cash are impossible to audit line by line.",
    },
    {
      id: "sport",
      name: "Your Pro Contract",
      icon: "bball/ball.png",
      fee: 0.18,
      risk: 0.03,
      cap: () => {
        const s = Number(state.job && state.job.salary) || 0;
        return s > 0 ? Math.round(s * 4) : 0;
      },
      have: () => (Number(state.job && state.job.salary) || 0) > 0 && !!(state.nba || state.futbol),
      why: "Signing bonuses and endorsements, all paid in a currency nobody questions.",
    },
  ];

  const capOf = (f) => {
    const c = typeof f.cap === "function" ? f.cap() : f.cap;
    return Math.max(0, Math.round(Number(c) || 0));
  };

  function used(f) {
    const l = S();
    const st = l.fronts[f.id] || (l.fronts[f.id] = { age: state.age, used: 0 });
    if (st.age !== state.age) {
      st.age = state.age;
      st.used = 0;
    }
    return st;
  }

  const openCases = () => S().cases.filter((c) => !c.closed).length;

  const riskOf = (f, amount) => {
    const cap = capOf(f) || 1000000;
    const share = Math.min(1, (Number(amount) || 0) / Math.max(1, cap));
    return Math.min(0.85, f.risk * (0.35 + 0.65 * share) + heatNow() / 700 + Math.min(0.12, openCases() * 0.004));
  };

  // ------------------------------------------------------------------ screens
  function openLaunder() {
    if (!enabled()) return note("Not right now", "You cannot launder money right now.", null);
    const l = S();
    l.seen = true;
    let h =
      `<div class="sec">Dirty Money</div>` +
      `<div class="row dis"><img src="emoji/1f4b8.png" alt=""><div class="t"><b>${usdf(l.dirty)} waiting to be washed</b><span>Dirty money cannot be spent, banked or invested until you launder it.</span></div></div>`;
    if (l.cleaned) {
      h += `<div class="row dis"><img src="emoji/1f4b5.png" alt=""><div class="t"><b>${usdf(l.cleaned)} laundered so far</b><span>${usdf(l.fees || 0)} paid in cuts${l.audits ? ` · ${l.audits} audit${l.audits === 1 ? "" : "s"}` : ""}</span></div></div>`;
    }
    h += `<div class="sec">Business fronts</div>`;
    for (const f of FRONTS) {
      const cap = capOf(f);
      const left = cap ? Math.max(0, cap - used(f).used) : 0;
      h += row(
        `data-fl="b:${f.id}"`,
        f.icon,
        f.name,
        `${pct(f.fee)} cut · ${cap ? `${usdf(left)} left this year` : "no yearly limit"} · ${pct(riskOf(f, Math.min(l.dirty, left || l.dirty)))} audit risk`,
      );
    }
    const careers = CAREERS.filter((c) => c.have());
    h += `<div class="sec">Your careers as covers</div>`;
    h += careers.length
      ? careers
          .map((f) => {
            const cap = capOf(f);
            const left = Math.max(0, cap - used(f).used);
            return row(
              `data-fl="c:${f.id}"`,
              f.icon,
              f.name,
              `${pct(f.fee)} cut · up to ${usdf(cap)} a year · only ${pct(f.risk)} base risk`,
            );
          })
          .join("")
      : `<div class="row dis"><div class="t"><b>No cover yet</b><span>Run a film studio, a music career or a pro contract and you can wash money through it, with a smaller cut and far more capacity.</span></div></div>`;
    const open = l.cases.filter((c) => !c.closed);
    h += `<div class="sec">Past Crimes</div>`;
    h += open.length
      ? open
          .slice(-4)
          .reverse()
          .map((c) => {
            const a = state.age - c.age;
            return `<div class="row dis"><img src="emoji/1f575-fe0f.png" alt=""><div class="t"><b>${esc(srcOf(c.tag).label)}</b><span>${usdf(c.amount)} · ${a <= 0 ? "this year" : a === 1 ? "1 year ago" : `${a} years ago`} · still unexplained</span></div></div>`;
          })
          .join("")
      : `<div class="row dis"><div class="t"><b>Nothing open</b><span>Every dollar you took has an explanation. For now.</span></div></div>`;
    openScreen("MONEY LAUNDERING", () => (typeof openActivities === "function" ? openActivities() : screen.classList.remove("open")), h);
    sList.querySelectorAll("[data-fl]").forEach((el) => {
      el.onclick = () => {
        const [kind, id] = String(el.dataset.fl).split(":");
        const f = (kind === "c" ? CAREERS : FRONTS).find((x) => x.id === id);
        if (f) frontCard(f);
      };
    });
  }

  function frontCard(f) {
    const l = S();
    const cap = capOf(f);
    const left = cap ? Math.max(0, cap - used(f).used) : l.dirty;
    const max = Math.min(Math.floor(l.dirty), Math.floor(left));
    const rows = [
      ["Dirty cash", usdf(l.dirty)],
      ["Cut", pct(f.fee)],
      ["Capacity this year", cap ? usdf(cap) : "No limit"],
      ["Left this year", cap ? usdf(left) : "No limit"],
      ["Chance of an audit", pct(riskOf(f, Math.max(1, max)))],
    ];
    const choices = [];
    if (max >= 1) {
      choices.push([`Launder ${usdf(max)}`, () => run(f, max)]);
      const half = Math.floor(max / 2);
      if (half >= 1 && half < max) choices.push([`Launder ${usdf(half)}`, () => run(f, half)]);
    }
    choices.push(["Back", openLaunder]);
    card({ iconSrc: f.icon, title: f.name, lead: f.why, rows, choices });
  }

  function run(f, amount) {
    const l = S();
    const cap = capOf(f);
    const st = used(f);
    const left = cap ? Math.max(0, cap - st.used) : l.dirty;
    amount = Math.round(Math.min(amount, l.dirty, left));
    if (!(amount >= 1)) {
      return note("Nothing to declare", `${f.name} cannot take any more money right now.`, openLaunder);
    }
    l.dirty -= amount;
    st.used += amount;
    const fee = Math.round(amount * f.fee);
    const clean = amount - fee;
    const risk = riskOf(f, amount);
    heat(Math.round(2 + 5 * Math.log10(1 + amount / 100000)));
    if (rnd() < risk) return audited(f, amount);
    state.money += clean;
    l.cleaned = (l.cleaned || 0) + clean;
    l.fees = (l.fees || 0) + fee;
    refresh();
    save();
    log(`I laundered ${usdf(amount)} through ${f.name} and banked ${usdf(clean)} in clean money.`);
    card({
      iconSrc: f.icon,
      title: "Clean money",
      lead: `${f.name} books the money as ordinary income. It comes out the other side looking like a very good year.`,
      rows: [
        ["Laundered", usdf(amount)],
        ["Cut", usdf(fee)],
        ["Banked", usdf(clean)],
      ],
      choices: [["Continue", openLaunder]],
    });
  }

  function audited(f, amount) {
    const l = S();
    l.seized = (l.seized || 0) + amount;
    l.audits = (l.audits || 0) + 1;
    heat(12);
    refresh();
    save();
    log(`The books at ${f.name} did not add up. Auditors seized ${usdf(amount)} and opened an investigation.`);
    const busted = rnd() < 0.35;
    card({
      iconSrc: "emoji/1f6a8.png",
      title: "The books don't add up",
      lead: `Auditors went through ${f.name}'s books and found ${usdf(amount)} they could not explain.<br><br>The money is gone, ${
        busted ? "and they passed the file to the police." : "and the front is now on their radar."
      }`,
      rows: [
        ["Seized", usdf(amount)],
        ["Clean money", usdf(0)],
      ],
      choices: busted
        ? [["Face the music", () => setTimeout(() => typeof arrest === "function" && arrest("money laundering", [1, 4]), 30)]]
        : [["Lay low", openLaunder]],
    });
  }

  // ------------------------------------------------------------------ past crimes
  function closeCase(c, why) {
    c.closed = true;
    c.outcome = "closed";
    refresh();
    save();
    card({
      iconSrc: "emoji/1f4bc.png",
      title: "Case closed",
      lead: why,
      rows: [["Charge", "None"], ["Case", `${srcOf(c.tag).label} · ${usdf(c.amount)}`]],
      choices: [["Back", openLaunder]],
    });
  }

  function incriminate(c, why) {
    const what = srcOf(c.tag);
    c.closed = true;
    c.outcome = "busted";
    S().convictions = (S().convictions || 0) + 1;
    refresh();
    save();
    log(`Investigators tied me to ${what.crime} from ${state.age - c.age} years ago.`);
    card({
      iconSrc: "emoji/1f6a8.png",
      title: "Incriminated",
      lead: `${why}<br><br>They have enough to charge you with ${what.crime}.`,
      rows: [
        ["Charge", what.crime],
        ["Case", `${what.label} · ${usdf(c.amount)}`],
        ["From", `${state.age - c.age <= 0 ? "this year" : `${state.age - c.age} year${state.age - c.age === 1 ? "" : "s"} ago`}`],
      ],
      choices: [
        [
          "Continue",
          () => setTimeout(() => typeof arrest === "function" && arrest(what.crime, what.years), 30),
        ],
      ],
    });
  }

  function caseCard(c) {
    if (c.closed || state.dead || state.prison) return;
    const what = srcOf(c.tag);
    const years = state.age - c.age;
    const ev = Math.min(92, Math.round(28 + 14 * Math.log10(1 + c.amount / 1000) + Math.min(10, c.probed) * 3));
    const lawyer = Math.max(2500, Math.round(c.amount * 0.06));
    const bribe = Math.max(5000, Math.round(c.amount * 0.12));
    c.probed++;
    card({
      iconSrc: "emoji/1f575-fe0f.png",
      title: "Cold case reopened",
      lead: `A ${what.det} detective pulled an old file: ${usdf(c.amount)} from ${what.label} ${
        years <= 0 ? "this year" : years === 1 ? "last year" : `${years} years ago`
      } that was never explained.<br><br>They want to talk to you.`,
      rows: [
        ["Case", `${what.label} · ${usdf(c.amount)}`],
        ["Age of the case", years <= 0 ? "Brand new" : `${years} year${years === 1 ? "" : "s"}`],
        ["Charge they are building", what.crime],
        ["Lawyer's fee", usdf(lawyer)],
      ],
      bars: [["Evidence", ev]],
      choices: [
        ["Hire a lawyer", () => defend(c, lawyer, ev)],
        ["Bribe the detective", () => bribeIt(c, bribe, ev)],
        ["Say nothing and wait", () => lieLow(c, ev), "gray"],
      ],
    });
  }

  function defend(c, cost, ev) {
    if (!spend(cost)) return note("No clean money", "The lawyer wants to be paid up front.", () => caseCard(c));
    log(`I paid ${usdf(cost)} to a lawyer to deal with a case from ${state.age - c.age} years ago.`);
    const ok = rnd() < clamp(0.9 - ev / 160, 0.15, 0.85);
    if (ok) return closeCase(c, "Your lawyer finds a hole in the file and gets the case thrown out. The money paid for silence, not justice.");
    incriminate(c, `Your lawyer tried to explain the money, but the ${srcOf(c.tag).det} records say otherwise.`);
  }

  function bribeIt(c, cost, ev) {
    if (!spend(cost)) return note("No clean money", "You cannot cover that bribe right now.", () => caseCard(c));
    log(`I paid ${usdf(cost)} to a detective to make an old case go away.`);
    const ok = rnd() < clamp(0.6 - ev / 250, 0.1, 0.7);
    if (ok) {
      heat(6);
      return closeCase(c, "The detective takes the envelope, files the case in a drawer and forgets it exists.");
    }
    heat(15);
    incriminate(c, "The detective took your money, wrote it down, and handed the whole thing to the prosecutor.");
  }

  function lieLow(c, ev) {
    const ok = rnd() < clamp(0.55 - ev / 200, 0.05, 0.5);
    if (ok) return closeCase(c, "You keep your mouth shut. Without a witness, the case runs out of steam.");
    incriminate(c, "You refused to answer questions, so they built the case without you.");
  }

  function tick() {
    if (!enabled()) return;
    const l = S();
    if (l.tickAge === state.age) return;
    l.tickAge = state.age;
    const open = l.cases.filter((c) => !c.closed);
    if (!open.length) return;
    const c = open[0];
    const age = state.age - c.age;
    if (age < 1) return;
    const chance = Math.min(0.6, 0.07 + 0.06 * Math.log10(1 + c.amount / 5000) + heatNow() / 500 + Math.min(10, c.probed) * 0.03);
    if (rnd() >= chance) {
      c.probed++;
      save();
      return;
    }
    const show = () => caseCard(c);
    try {
      if (typeof queuePopup === "function") queuePopup(show);
      else setTimeout(show, 900);
    } catch {
      setTimeout(show, 900);
    }
  }

  // ------------------------------------------------------------------ boot
  function hookSimSwap() {
    const api = window.SIMSWAP;
    if (!api || typeof api.cashed !== "function" || api.__flLaunder) return !!api;
    const orig = api.cashed;
    api.cashed = function (id, units, value) {
      try {
        const d = state.simSwap && state.simSwap.dirty;
        const before = (d && d[id]) || 0;
        const r = orig.apply(this, arguments);
        const after = (d && d[id]) || 0;
        const sold = Math.max(0, before - after);
        if (sold > 0 && units > 0 && value > 0) {
          const moved = Math.round(value * Math.min(1, sold / units));
          if (moved > 0) {
            // the game banks the proceeds a few lines later in the same tick
            Promise.resolve().then(() => take(moved, "SIM swapping", "simswap"));
          }
        }
        return r;
      } catch (e) {
        warn("simswap", e);
      }
    };
    api.__flLaunder = true;
    return true;
  }

  function boot() {
    if (
      typeof state === "undefined" ||
      typeof openActivities !== "function" ||
      typeof jCard !== "function" ||
      typeof sList === "undefined" ||
      !document.getElementById("ageBtn")
    )
      return setTimeout(boot, 150);
    try {
      Object.assign(CHARGES, {
        "money laundering": CHARGES["money laundering"] || [2, 6],
        "possession of stolen property": CHARGES["possession of stolen property"] || [1, 4],
        "drug trafficking": CHARGES["drug trafficking"] || [5, 25],
      });
    } catch (e) {
      warn("charges", e);
    }
    if (!hookSimSwap()) {
      let tries = 0;
      const wait = setInterval(() => {
        if (hookSimSwap() || ++tries > 40) clearInterval(wait);
      }, 500);
    }
    const origAct = window.openActivities;
    window.openActivities = function () {
      const r = origAct.apply(this, arguments);
      try {
        const l = S();
        if (enabled() && sTitle.textContent === "ACTIVITIES" && !document.getElementById("flLndRow") && (l.dirty > 0 || l.seen || l.cleaned)) {
          const html = `<div class="row" id="flLndRow"><img src="emoji/1f9fa.png" alt="" style="object-fit:contain"><div class="t"><b>Money Laundering</b><span>${
            l.dirty > 0 ? `${usdf(l.dirty)} in dirty cash · ` : ""
          }Clean the money from SIM swaps, stolen goods and the cartel</span></div>${chev()}</div>`;
          const sur = document.getElementById("actSurrender");
          if (sur) sur.insertAdjacentHTML("beforebegin", html);
          else sList.insertAdjacentHTML("beforeend", html);
          document.getElementById("flLndRow").onclick = openLaunder;
        }
      } catch (e) {
        warn("activities", e);
      }
      return r;
    };
    document.getElementById("ageBtn").addEventListener("click", () =>
      setTimeout(() => {
        try {
          tick();
        } catch (e) {
          warn("tick", e);
        }
      }, 1100),
    );
    console.log("[launder] loaded");
  }

  window.FL_LAUNDER = { open: openLaunder, state: S, dirty, take, tick, FRONTS, CAREERS, cases: () => S().cases.slice() };
  boot();
})();
