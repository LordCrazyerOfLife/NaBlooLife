/* [mod] Zoo Trip (zoo-trip.js): un viaje al zoo como actividad de Activities, una vez por año.
 * Entrada con costo, luego un evento al azar (a veces dos) con decisiones y efectos en felicidad, salud,
 * inteligencia, belleza, dinero y relaciones. Estado: state.zooTrip = { year, visits, seen:[ids] }.
 * Es un viaje de visita, no la carrera de cuidador (esa es zoo.js). */
(() => {
  "use strict";
  if (window.FL_ZOO_TRIP) return;

  const money = (n) => (typeof usd === "function" ? usd(Math.round(n)) : "$" + Math.round(n).toLocaleString("en-US"));
  const price = (n) => Math.max(5, Math.round(typeof localPrice === "function" ? localPrice(n) : n));
  const cl = (v, a = 0, b = 100) => Math.max(a, Math.min(b, v));
  const pick = (a) => a[Math.floor(Math.random() * a.length)];
  const ch = (p) => Math.random() < p;

  // fx: { Happiness, Health, Smarts, Looks, money } (money es delta en dólares)
  const EVENTS = [
    {
      id: "escape",
      icon: "emoji/1f981.png",
      title: "A lion cub got out of the fence",
      lead: "The keepers are running around shouting. The cub is heading straight for the snack bar.",
      choices: [
        ["Help chase it", { Happiness: 4, Health: -4 }, "You run in the dust for ten minutes. The cub is returned, and you are covered in mud."],
        ["Step back and let the keepers handle it", { Happiness: -1 }, "You film it from a safe distance. Somebody tells you to stop filming."],
      ],
    },
    {
      id: "monkey_bite",
      icon: "emoji/1f412.png",
      title: "A monkey bit you through the railing",
      lead: "You were holding a peanut bag a little too close. It bit your finger and ran off with the bag.",
      choices: [
        ["Go to the first aid tent", { money: -60, Health: -2 }, "The nurse cleans it and gives you a tetanus shot. The bill comes in the mail later."],
        ["Walk it off", { Health: -5, Happiness: -2 }, "It swells all afternoon. You tell everyone it was a sloth."],
      ],
    },
    {
      id: "baby_born",
      icon: "emoji/1f43c.png",
      title: "A baby panda was born this morning",
      lead: "A sign says the cub is six hours old. The line to see it through the glass goes around the corner.",
      choices: [
        ["Wait in line for the glass", { Happiness: 6 }, "It is the size of a stick of butter and it is absolutely perfect."],
        ["Name it in the suggestion box", { Happiness: 3, Smarts: 1 }, "Your suggestion is read out loud at the next show. It does not get picked."],
      ],
    },
    {
      id: "giraffe_lettuce",
      icon: "emoji/1f9d1.png",
      title: "Feed the giraffe",
      lead: "For two dollars you get a bunch of leaves. The giraffe leans down, very slowly, and takes them from your hand.",
      choices: [
        ["Feed it with both hands", { Happiness: 5, Health: -1 }, "Its tongue is 20 inches long and wet. You will never forget it."],
        ["Keep your distance", { Happiness: 1 }, "It takes the leaves anyway, from the next person in line."],
      ],
    },
    {
      id: "lost_reptile",
      icon: "emoji/1f40d.png",
      title: "You got lost in the reptile house",
      lead: "All the glass looks the same in the dark. Every corridor has a sign that points back to the entrance, except one.",
      choices: [
        ["Ask a staff member", { Smarts: 1, Happiness: -1 }, "They point you to the exit and ask if you need a map. You say no to the map."],
        ["Wander until you find it", { Health: -2, Happiness: -4 }, "It takes forty minutes. Your feet are dead when you finally see the sunlight."],
      ],
    },
    {
      id: "keeper_friend",
      icon: "emoji/1f9d1-200d-1f33e.png",
      title: "A keeper offers a back-of-house tour",
      lead: "Staff only. He says you can see the kitchen where they prep the fish, and the room where they keep the baby birds warm.",
      choices: [
        ["Take the tour", { Smarts: 3, Happiness: 5 }, "He gives you his number. He says to come back on a Tuesday, when it is quiet.", "friend"],
        ["Politely decline", {}, "You say thanks and go back to the public path. The fish smell follows you."],
      ],
    },
    {
      id: "plush_shop",
      icon: "emoji/1f9f8.png",
      title: "The gift shop has a plush you want",
      lead: "It is a stuffed sloth with a sad face. It costs more than it should, and it looks very soft.",
      choices: [
        ["Buy the sloth", { money: -40, Happiness: 4 }, "It sits on your passenger seat the whole way home."],
        ["Buy a keychain instead", { money: -8, Happiness: 1 }, "It is a little tiger with a broken tail. You like it anyway."],
        ["Keep your money", {}, "You promise yourself you will buy one at the next zoo."],
      ],
    },
    {
      id: "ticket_scalper",
      icon: "emoji/1f3ab.png",
      title: "A man wants to buy your tickets",
      lead: "He says he has a group coming in an hour and will pay double. He is very friendly and very pushy.",
      choices: [
        ["Sell them to him", { money: 150, Happiness: -2 }, "The group never shows up. You feel a little bad about it."],
        ["Say no and keep walking", { Happiness: 1 }, "He tries to sell a balloon to the next family instead."],
      ],
    },
    {
      id: "heat_wave",
      icon: "emoji/1f9ca.png",
      title: "Heat wave at the zoo",
      lead: "It is 98 degrees, the penguins are standing in the freezer room, and the cold drinks cost $6.",
      choices: [
        ["Buy a cold drink", { money: -12, Health: 2 }, "The drink is worth it. You are back on your feet within the hour."],
        ["Tough it out in the sun", { Health: -6, Happiness: -3 }, "You get a headache that lasts until the next morning."],
      ],
    },
    {
      id: "snake_show",
      icon: "emoji/1f40d.png",
      title: "The snake show needs a volunteer",
      lead: "The presenter asks for someone brave. Everyone looks at their shoes, including you.",
      choices: [
        ["Raise your hand", { Happiness: 5, Smarts: 1 }, "You hold the python for three minutes while the crowd cheers. It risk-assesses you, and it is fine.", null, { p: 0.3, fx: { Health: -8 }, msg: "The snake gets bored halfway through and tightens up. The keeper apologizes." }],
        ["Stay in your seat", {}, "You enjoy the show from the back row, with a slushie."],
      ],
    },
    {
      id: "viral_sloth",
      icon: "emoji/1f4f8.png",
      title: "Your photo with the sloth is everywhere",
      lead: "Someone posted you hugging a sloth. It has 40,000 likes by lunch.",
      choices: [
        ["Post it on your own page", { money: 900, Happiness: 2 }, "The likes come in. So do some strangers who have opinions about the sloth.", null, { p: 0.25, fx: { Happiness: -6 }, msg: "Half of the comments are about your outfit. You delete the post." }],
        ["Keep it private", { Happiness: 2 }, "It is your photo, and the sloth looks happy."],
      ],
    },
    {
      id: "penguin_tour",
      icon: "emoji/1f9ca.png",
      title: "Behind-the-scenes penguin feeding",
      lead: "A small group gets to watch the penguins being fed. The keeper explains their diet in fascinating detail.",
      choices: [
        ["Join the group", { Smarts: 3, Happiness: 3, money: -20 }, "You learn more about fish than you ever wanted to know, and you still enjoyed it."],
        ["Stay with the crowd", { Happiness: 1 }, "You watch from the rail. It is fine."],
      ],
    },
    {
      id: "lost_kid",
      icon: "emoji/1f9d1.png",
      title: "A kid is crying by the monkey bridge",
      lead: "She says she lost her parents. She is holding a balloon that is starting to deflate.",
      choices: [
        ["Help her find them", { Happiness: 4 }, "Her parents are at the bathroom. They thank you three times and give you a candy bar.", "friend"],
        ["Tell a staff member", { Happiness: 1 }, "A staff member takes her to the desk. You never find out how it ends."],
        ["Keep walking", { Happiness: -3 }, "You try not to hear her crying behind you."],
      ],
    },
    {
      id: "ticket_price",
      icon: "emoji/1f4b8.png",
      title: "Surprise: the upgrade fee",
      lead: "The 'VIP Walk-Through' upgrade costs extra at the desk. The line is long and the sun is out.",
      choices: [
        ["Pay for the upgrade", { money: -90, Happiness: 6 }, "The walk-through includes a close look at the otters. It was worth it."],
        ["Skip it", { Happiness: -2 }, "You see the otters through a window from far away."],
      ],
    },
    {
      id: "lion_moat",
      icon: "emoji/1f981.png",
      title: "Your phone fell into the lion moat",
      lead: "It is not in the water. It is on a ledge, right above a sleeping lion.",
      choices: [
        ["Climb down and grab it", { Health: -4, Happiness: 2 }, "The staff say they have never seen someone do that and live. The phone works fine."],
        ["Pay the staff to retrieve it", { money: -120, Happiness: -1 }, "The staff use a grabber. It takes twenty minutes and a clipboard."],
      ],
    },
    {
      id: "volunteer",
      icon: "emoji/1f9d1-200d-2695-fe0f.png",
      title: "The keepers need an extra hand today",
      lead: "They ask if you want to help clean the aviary for a few hours. It is paid, in cash, at the end.",
      choices: [
        ["Clean the aviary", { money: 150, Smarts: 2, Health: -2 }, "You are covered in feathers and bird seed. The cash envelope is a nice surprise."],
        ["Pass, you are on vacation", {}, "You head to the gift shop instead."],
      ],
    },
    {
      id: "sloth_nap",
      icon: "emoji/1f9f8.png",
      title: "The sloth exhibit is the best nap spot",
      lead: "You sit on the bench for ten minutes. Nobody is in a hurry. The sloth is not in a hurry either.",
      choices: [
        ["Take the nap", { Health: 3, Happiness: 2 }, "You wake up with a sunburn on one shoulder and a smile."],
        ["Keep moving", { Smarts: 1 }, "You read the placards. The sloth is 80% of the sign."],
      ],
    },
    {
      id: "rain_cafe",
      icon: "emoji/1f370.png",
      title: "Sudden downpour",
      lead: "The sky goes gray in four seconds. Everyone runs for the cafe. The line is out the door.",
      choices: [
        ["Wait it out with a slice of cake", { money: -15, Happiness: 3 }, "The cake is dense and perfect. The storm passes by the time you finish."],
        ["Run for the parking lot", { Health: -2, Happiness: -2 }, "You are soaked before you reach the car, and your shoes squish all the way home."],
      ],
    },
  ];

  const S = () => {
    if (!state.zooTrip || typeof state.zooTrip !== "object") state.zooTrip = { year: -1, visits: 0, seen: [] };
    state.zooTrip.seen = Array.isArray(state.zooTrip.seen) ? state.zooTrip.seen : [];
    return state.zooTrip;
  };
  const doneThisYear = () => S().year === state.age;

  function applyFx(fx) {
    if (!fx) return;
    if (fx.money) state.money = (Number(state.money) || 0) + fx.money;
    if (state.stats) {
      for (const k of ["Happiness", "Health", "Smarts", "Looks"]) {
        if (fx[k]) state.stats[k] = cl((Number(state.stats[k]) || 0) + fx[k]);
      }
    }
  }
  function nudgeRel(kind) {
    const pool = kind === "friend" ? state.friends || [] : [...(state.friends || []), ...(state.family || []).filter((f) => !f.dead)];
    if (!pool.length) return null;
    const who = pick(pool);
    who.rel = cl((Number(who.rel) || 50) + 5);
    return who;
  }

  let queued = null;

  function resolve(ev, choice) {
    const [label, fx, msg, relKind, risk] = choice;
    const money0 = Number(state.money) || 0;
    applyFx(fx);
    let text = msg;
    if (risk && ch(risk.p)) {
      applyFx(risk.fx);
      text = risk.msg;
    }
    if (relKind) {
      const who = nudgeRel(relKind);
      if (who) text += ` ${who.first} is glad you came by.`;
    }
    if (typeof say === "function") say(`Zoo trip: ${text}`);
    if (typeof renderStats === "function") renderStats();
    if (state.money > money0 && typeof chaChing === "function") chaChing();
    S().seen = [...new Set([...S().seen, ev.id])];
    checkTrophies();
    if (queued) {
      const next = queued;
      queued = null;
      setTimeout(() => {
        if (!state.dead) eventCard(next);
      }, 500);
    }
  }

  function checkTrophies() {
    try {
      window.FL_TROPHIES && FL_TROPHIES.check && FL_TROPHIES.check();
    } catch {}
  }

  function eventCard(ev) {
    jCard({
      tag: "Zoo Trip",
      iconSrc: ev.icon,
      title: ev.title,
      lead: ev.lead,
      choices: ev.choices.map((c) => [
        c[0] + (c[1].money ? ` (${c[1].money > 0 ? "+" : "-"}${money(Math.abs(c[1].money))})` : ""),
        () => resolve(ev, c),
      ]),
    });
  }

  function startTrip() {
    if (doneThisYear()) return notice("Already visited", "You went to the zoo this year. Come back next age.", null, true);
    const cost = price(35);
    if ((Number(state.money) || 0) < cost) return notice("Not enough cash", `A zoo ticket costs ${money(cost)}.`, null, true);
    state.money -= cost;
    const z = S();
    z.year = state.age;
    z.visits = (z.visits || 0) + 1;
    const first = pick(EVENTS);
    const pool = EVENTS.filter((e) => e.id !== first.id);
    eventCard(first);
    if (ch(0.35)) queued = pick(pool);
    if (typeof renderStats === "function") renderStats();
    checkTrophies();
  }

  function hook() {
    const orig = window.openActivities;
    window.openActivities = function () {
      const r = orig.apply(this, arguments);
      try {
        // the base game already lists a greyed-out "Zoo Trip" row: switch that one on instead of adding a second row
        const base = sTitle.textContent === "ACTIVITIES" ? sList.querySelector('[data-act="zoo"]') : null;
        if (base) {
          const done = doneThisYear();
          base.classList.toggle("dis", !!done || state.age < 5);
          const sp = base.querySelector(".t span");
          if (sp) sp.textContent = done ? "Already went this year" : "Animals, surprises and a $35 ticket";
          base.onclick = () => {
            if (state.dead || base.classList.contains("dis")) return;
            if (typeof play === "function") play("choice");
            startTrip();
          };
          const extra = document.getElementById("flZooTrip");
          if (extra) extra.remove();
        } else if (sTitle.textContent === "ACTIVITIES" && !document.getElementById("flZooTrip")) {
          const done = doneThisYear();
          const html = `<div class="row${done ? " dis" : ""}" id="flZooTrip"><img src="emoji/1f981.png" alt="" style="object-fit:contain"><div class="t"><b>Zoo Trip</b><span>${done ? "Already went this year" : "Animals, surprises and a $35 ticket"}</span></div></div>`;
          const sur = document.getElementById("actSurrender");
          if (sur) sur.insertAdjacentHTML("beforebegin", html);
          else sList.insertAdjacentHTML("beforeend", html);
          document.getElementById("flZooTrip").onclick = () => {
            if (state.dead) return;
            startTrip();
          };
        }
      } catch (e) {
        console.warn("[zoo-trip] activities", e);
      }
      return r;
    };
  }

  function boot() {
    if (typeof state === "undefined" || typeof openActivities !== "function" || typeof jCard !== "function" || !document.getElementById("ageBtn") || typeof sList === "undefined") return setTimeout(boot, 150);
    hook();
    console.log("[zoo-trip] loaded");
  }

  window.FL_ZOO_TRIP = { events: EVENTS, start: startTrip, state: S };
  boot();
})();
