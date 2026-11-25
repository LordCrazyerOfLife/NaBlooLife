/*! Copyright (c) 2026 Free Life. All rights reserved. */
/* Elite Life: marina, hangar y vehículos especiales.
 * Se carga como script normal después de game.html para poder engancharse a
 * Shopping y Assets sin tocar el archivo gigante.
 */
(() => {
  "use strict";
  if (window.FL_ELITE_LIFE) return;
  window.FL_ELITE_LIFE = true;

  const CATS = {
    boats: {
      title: "BOATS & YACHTS",
      short: "Boat",
      dealer: "Northstar Marine",
      icon: "boats/superyacht.png",
      desc: "Speedboats, yachts and superyachts",
    },
    planes: {
      title: "PRIVATE AIRCRAFT",
      short: "Aircraft",
      dealer: "Skyline Aircraft Sales",
      icon: "aircraft/private-jet.png",
      desc: "Seaplanes, turboprops and private jets",
    },
    helicopters: {
      title: "HELICOPTERS",
      short: "Helicopter",
      dealer: "Rotor Executive",
      icon: "aircraft/helicopter.png",
      desc: "Executive and luxury helicopters",
    },
  };

  const CATALOG = {
    boats: [
      {
        id: "speedboat",
        name: "Marlin 22 Speedboat",
        price: 85000,
        upkeep: 420,
        speed: "54 kn",
        cap: 6,
        img: "boats/speedboat.png",
        desc: "A fast weekend boat with an open cockpit and a deep-V hull.",
      },
      {
        id: "sport-yacht",
        name: "Corsair Sport Yacht",
        price: 650000,
        upkeep: 2400,
        speed: "38 kn",
        cap: 10,
        img: "boats/sport-yacht.png",
        desc: "A sleek sport yacht with a sun deck, twin cabins and a wet bar.",
      },
      {
        id: "sailing-yacht",
        name: "Aurora Sailing Yacht",
        price: 1400000,
        upkeep: 3900,
        speed: "14 kn",
        cap: 12,
        img: "boats/sailing-yacht.png",
        desc: "A blue-water sailing yacht built for long, quiet summers at sea.",
      },
      {
        id: "superyacht",
        name: "Sovereign 44 Superyacht",
        price: 8500000,
        upkeep: 22000,
        speed: "26 kn",
        cap: 24,
        img: "boats/superyacht.png",
        desc: "Crew quarters, a helipad and enough decks to lose your guests on.",
      },
    ],
    planes: [
      {
        id: "seaplane",
        name: "Kingfisher Seaplane",
        price: 450000,
        upkeep: 1800,
        speed: "145 kt",
        cap: 6,
        img: "aircraft/seaplane.png",
        desc: "A rugged amphibian that can land on lakes, rivers and private strips.",
      },
      {
        id: "turboprop",
        name: "Meridian T6 Turboprop",
        price: 1800000,
        upkeep: 5200,
        speed: "310 kt",
        cap: 9,
        img: "aircraft/turboprop.png",
        desc: "A dependable executive turboprop with short-field performance.",
      },
      {
        id: "private-jet",
        name: "Aeris Zephyr Jet",
        price: 12000000,
        upkeep: 38000,
        speed: "480 kt",
        cap: 12,
        img: "aircraft/private-jet.png",
        desc: "A long-range private jet with a full galley and lie-flat seats.",
      },
      {
        id: "airliner",
        name: "Skyline 737 BBJ",
        price: 45000000,
        upkeep: 125000,
        speed: "510 kt",
        cap: 42,
        img: "aircraft/airliner.png",
        desc: "A converted airliner for entourages, staff and very loud entrances.",
      },
    ],
    helicopters: [
      {
        id: "helicopter",
        name: "Rotor R44",
        price: 950000,
        upkeep: 4300,
        speed: "110 kt",
        cap: 4,
        img: "aircraft/helicopter.png",
        desc: "A light utility helicopter that gets you over traffic in minutes.",
      },
      {
        id: "luxury-helicopter",
        name: "Nocturne Executive",
        price: 4500000,
        upkeep: 19000,
        speed: "155 kt",
        cap: 8,
        img: "aircraft/luxury-helicopter.png",
        desc: "A black-and-gold executive helicopter with club seating and champagne.",
      },
    ],
  };

  const money = (n) =>
    typeof usd === "function"
      ? usd(n)
      : `$${Math.round(Number(n) || 0).toLocaleString("en-US")}`;
  const dots = () => (typeof DOTS !== "undefined" ? DOTS : "");
  const chev = () => (typeof CHEV !== "undefined" ? CHEV : "");
  const back = () => (typeof BACK_ICON !== "undefined" ? BACK_ICON : "&larr;");
  const esc = (s) =>
    String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  const fleet = () => {
    if (!Array.isArray(state.eliteVehicles)) state.eliteVehicles = [];
    return state.eliteVehicles;
  };
  const ownedBy = (kind) => fleet().filter((v) => v && v.kind === kind);
  const findDef = (kind, id) => (CATALOG[kind] || []).find((v) => v.id === id);
  const value = (v) => Math.max(0, Math.round((Number(v.price) || 0) * (0.55 + (Number(v.cond) || 100) / 300)));

  function openVehicleStore(kind) {
    const cat = CATS[kind];
    if (!cat) return openShopping();
    const owned = new Set(ownedBy(kind).map((v) => v.id));
    const stock = (CATALOG[kind] || []).filter((v) => !owned.has(v.id));
    sTitle.textContent = cat.title;
    sSub.style.display = "none";
    sBack.innerHTML = back();
    sBack.onclick = () => openShopping();
    sList.innerHTML = stock.length
      ? stock
          .map(
            (v, i) =>
              `<div class="row" data-elite-buy="${i}"><img src="${v.img}" alt=""><div class="t"><b>${esc(v.name)}</b><span>${money(v.price)} · ${esc(v.speed)} · ${v.cap} seats</span></div>${dots()}</div>`,
          )
          .join("")
      : `<div class="row dis"><img src="${cat.icon}" alt=""><div class="t"><b>Everything is in your collection</b><span>You already own every ${cat.short.toLowerCase()} in this showroom</span></div></div>`;
    sList.querySelectorAll("[data-elite-buy]").forEach((el) => {
      el.onclick = () => vehicleCard(stock[Number(el.dataset.eliteBuy)], kind);
    });
    sList.scrollTop = 0;
    screen.classList.add("open");
  }

  function vehicleCard(def, kind) {
    if (!def) return openVehicleStore(kind);
    const cat = CATS[kind];
    jCard({
      tag: cat.short,
      iconSrc: def.img,
      title: def.name,
      close: () => openVehicleStore(kind),
      lead: def.desc,
      rows: [
        ["Price", money(def.price)],
        ["Top speed", def.speed],
        ["Capacity", `${def.cap} people`],
        ["Yearly upkeep", money(def.upkeep)],
      ],
      choices: [
        [
          `Buy it — ${money(def.price)}`,
          () => {
            if (state.age < 18)
              return notice("Too young", "You must be at least 18 to buy a boat or aircraft.", null, true);
            if (state.money < def.price)
              return notice(
                "Not enough",
                `You need ${money(def.price)} to buy the ${esc(def.name)}.`,
                null,
                false,
              );
            state.money -= def.price;
            fleet().push({
              ...def,
              kind,
              value: def.price,
              cond: 100,
              bought: state.age,
              used: -1,
            });
            if (typeof chaChing === "function") chaChing();
            if (typeof renderStats === "function") renderStats();
            if (typeof say === "function") say(`I bought a ${def.name} for ${money(def.price)}.`);
            notice(
              "Delivered",
              `The ${esc(def.name)} is yours. It is waiting in your marina and hangar.`,
              () => openVehicleStore(kind),
              true,
            );
          },
        ],
        ["Not today", () => openVehicleStore(kind)],
      ],
    });
  }

  function openOwned() {
    const all = fleet();
    sTitle.textContent = "MARINA & HANGAR";
    sSub.style.display = "none";
    sBack.innerHTML = back();
    sBack.onclick = () => openAssets();
    sList.innerHTML = all.length
      ? all
          .map(
            (v, i) =>
              `<div class="row" data-elite-owned="${i}"><img src="${v.img}" alt=""><div class="t"><b>${esc(v.name)}</b><span>${esc(CATS[v.kind] ? CATS[v.kind].short : "Vehicle")} · ${Math.round(v.cond)}% condition · ${money(value(v))}</span></div>${dots()}</div>`,
          )
          .join("")
      : `<div class="row dis"><img src="boats/superyacht.png" alt=""><div class="t"><b>No boats or aircraft</b><span>Visit Shopping to stock your marina and hangar</span></div></div>`;
    sList.querySelectorAll("[data-elite-owned]").forEach((el) => {
      el.onclick = () => ownedCard(all[Number(el.dataset.eliteOwned)]);
    });
    sList.scrollTop = 0;
    screen.classList.add("open");
  }

  function ownedCard(v) {
    if (!v) return openOwned();
    const label = CATS[v.kind] ? CATS[v.kind].short : "Vehicle";
    jCard({
      tag: label,
      iconSrc: v.img,
      title: v.name,
      close: () => openOwned(),
      lead: `Your ${label.toLowerCase()}, bought at age ${v.bought}.`,
      rows: [
        ["Estimated value", money(value(v))],
        ["Top speed", v.speed],
        ["Capacity", `${v.cap} people`],
        ["Yearly upkeep", money(v.upkeep)],
      ],
      bars: [["Condition", Math.max(1, Math.min(100, Number(v.cond) || 0))]],
      choices: [
        [
          "Take it out",
          () => {
            if (state.age < 18)
              return notice("Too young", "You must be at least 18 to take it out.", null, true);
            if (v.used === state.age)
              return notice("Already out", `You already took the ${v.name} out this year.`, null, true);
            v.used = state.age;
            if (typeof fx === "function") fx({ Happiness: typeof rint === "function" ? rint(3, 9) : 5 }, "");
            if (typeof say === "function") say(`I took my ${v.name} out for the day.`);
            notice(
              "Worth it",
              `You spent the day on your ${esc(v.name)}. The upkeep is expensive, but the view is not.`,
              () => openOwned(),
              true,
            );
          },
        ],
        [
          "Sell it",
          () => {
            const offer = Math.round(value(v) * 0.9);
            const sell = () => {
              const i = fleet().indexOf(v);
              if (i < 0) return;
              fleet().splice(i, 1);
              state.money += offer;
              if (typeof chaChing === "function") chaChing();
              if (typeof renderStats === "function") renderStats();
              if (typeof say === "function") say(`I sold my ${v.name} for ${money(offer)}.`);
              notice("Sold", `You sold the ${esc(v.name)} for ${money(offer)}.`, () => openOwned(), true);
            };
            if (typeof iosConfirm === "function")
              iosConfirm("Sell it", `Sell your ${esc(v.name)} for ${money(offer)}?`, sell);
            else sell();
          },
        ],
      ],
    });
  }

  function addShoppingRows() {
    if (typeof isOldEra === "function" && isOldEra()) return;
    const rows =
      `<div class="sec">Marina & Hangar</div>` +
      Object.entries(CATS)
        .map(
          ([kind, cat]) =>
            `<div class="row" data-elite="${kind}"><img src="${cat.icon}" alt=""><div class="t"><b>${esc(cat.dealer)}</b><span>${esc(cat.desc)}</span></div>${chev()}</div>`,
        )
        .join("");
    // Quita los escaparates genéricos de la versión anterior.
    [...sList.querySelectorAll(".row")].forEach((row) => {
      const name = row.querySelector("b")?.textContent?.trim();
      if (name === "Skyline Aircraft Sales" || name === "Discount Aviation Dealer" || name === "Jones Boat Sales")
        row.remove();
    });
    const oldSec = [...sList.querySelectorAll(".sec")].find(
      (sec) => sec.textContent.trim() === "Specialty Vehicle Dealers",
    );
    if (oldSec) oldSec.remove();
    const brokers = [...sList.querySelectorAll(".sec")].find(
      (sec) => sec.textContent.trim() === "Real Estate Brokers",
    );
    if (brokers) brokers.insertAdjacentHTML("beforebegin", rows);
    else sList.insertAdjacentHTML("beforeend", rows);
    sList.querySelectorAll("[data-elite]").forEach((el) => {
      el.onclick = () => {
        if (typeof play === "function") play("choice");
        openVehicleStore(el.dataset.elite);
      };
    });
  }

  function addAssetsRow() {
    if (document.getElementById("eliteAssetsRow")) return;
    const html =
      `<div class="sec">Marina & Hangar</div>` +
      `<div class="row" id="eliteAssetsRow"><img src="boats/superyacht.png" alt=""><div class="t"><b>Marina & Hangar</b><span>${fleet().length} vehicle${fleet().length === 1 ? "" : "s"} in your collection</span></div>${chev()}</div>`;
    const misc = [...sList.querySelectorAll(".sec")].find((sec) => sec.textContent.trim() === "Misc.");
    if (misc) misc.insertAdjacentHTML("beforebegin", html);
    else sList.insertAdjacentHTML("beforeend", html);
    const row = document.getElementById("eliteAssetsRow");
    if (row) row.onclick = () => openOwned();
  }

  // Envolvemos Shopping y Assets una sola vez. Los otros módulos (joyas,
  // instrumentos) ya han envuelto estas funciones antes que nosotros.
  const shopping = window.openShopping;
  window.openShopping = function () {
    const result = shopping.apply(this, arguments);
    try {
      if (typeof sTitle !== "undefined" && sTitle.textContent === "SHOPPING") addShoppingRows();
    } catch (e) {
      console.warn("[elite-life] shopping", e);
    }
    return result;
  };

  const assets = window.openAssets;
  window.openAssets = function () {
    const result = assets.apply(this, arguments);
    try {
      if (typeof sTitle !== "undefined" && sTitle.textContent === "ASSETS") addAssetsRow();
    } catch (e) {
      console.warn("[elite-life] assets", e);
    }
    return result;
  };

  // Desgaste y mantenimiento anual.
  const ageButton = document.getElementById("ageBtn");
  if (ageButton)
    ageButton.addEventListener("click", () => {
      if (!state || state.dead || !fleet().length) return;
      let upkeep = 0;
      for (const v of fleet()) {
        v.cond = Math.max(0, (Number(v.cond) || 100) - (typeof rint === "function" ? rint(1, 4) : 2));
        upkeep += Number(v.upkeep) || 0;
      }
      if (upkeep) state.money = Math.max(0, state.money - upkeep);
    });

  // Nombres estables para las tiendas.
  state.shops ||= {};
  state.shops.boat ||= CATS.boats.dealer;
  state.shops.aircraft ||= CATS.planes.dealer;
  state.shops.heli ||= CATS.helicopters.dealer;

  window.FL_ELITE_LIFE = {
    CATALOG,
    openVehicleStore,
    openOwned,
    fleet,
  };
})();
