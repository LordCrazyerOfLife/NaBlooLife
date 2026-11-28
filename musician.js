/*! Copyright (c) 2026 Free Life. All rights reserved. Unauthorized copying, re-hosting or redistribution of this code is prohibited. */
(() => {
  const e = (e) => `musician/${e}.png`,
    t = {
      Alternative: {
        ico: "genre-alternative",
        subs: [
          "Alternative Metal",
          "Art Punk",
          "Dance-Punk",
          "Emo",
          "Emo Rap",
          "Folk Punk",
          "Garage",
          "Grunge",
          "Indie Folk",
          "Neofolk",
          "New Wave",
          "Punk",
          "Steampunk",
          "Thrasher",
        ],
      },
      Country: {
        ico: "genre-country",
        subs: [
          "Bluegrass",
          "Country Rock",
          "Cowboy",
          "Dirt Road",
          "Hellbilly",
          "Hill Country Blues",
          "Hillbilly",
          "Honky-Tonk",
          "Outlaw",
          "Rockabilly",
          "Southern",
          "Urban Cowboy",
        ],
      },
      Folk: {
        ico: "genre-folk",
        subs: [
          "Fable",
          "Folk Punk",
          "Indie Folk",
          "Legend",
          "Myth",
          "Neofolk",
          "Progressive Folk",
          "Psychedelic",
          "Southern Rock",
        ],
      },
      "Heavy Metal": { ico: "genre-metal", subs: ["Thrash", "Death Metal", "Glam Metal", "Doom"] },
      "K-Pop": {
        ico: "genre-kpop",
        subs: [
          "Anime",
          "Ballad",
          "Bubblegum",
          "Cantopop",
          "Hokkien Pop",
          "J-Pop",
          "Kawaii Metal",
          "Kayokyoku",
          "Space Age",
        ],
        w: 0.4,
      },
      Pop: {
        ico: "genre-pop",
        subs: [
          "Bubblegum",
          "Dance",
          "Dance-Punk",
          "Disco",
          "Electro",
          "Popera",
          "Psychedelic Pop",
          "Rock And Roll",
          "Sing-Along",
          "Ska",
          "Space Age",
          "Synth",
          "Worship Pop",
        ],
      },
      Rap: {
        ico: "genre-rap",
        subs: [
          "Alternative Rap",
          "Bounce",
          "Conscious Rap",
          "Crunk",
          "Dirty South",
          "Emo Rap",
          "Freestyle",
          "Gangsta Rap",
          "Hip-Hop",
          "Mumble Rap",
          "Old School Rap",
          "SoundCloud Rap",
          "Trap",
          "Urban Cowboy",
          "West Coast",
          "Worship Hip Hop",
        ],
      },
      Reggae: {
        ico: "genre-reggae",
        subs: [
          "African Blues",
          "Afro-Beat",
          "Afro-Punk",
          "Caribbean",
          "Dancehall",
          "Dembow",
          "Dub",
          "Rasta",
          "Reggae Fusion",
          "Reggaeton",
        ],
      },
      "Rhythm and Blues": {
        ico: "genre-rb",
        short: "R&B",
        subs: [
          "Alternative Rap",
          "Blues",
          "Boogie",
          "Conscious Rap",
          "Contemporary Blues",
          "Contemporary R&B",
          "Doo Wop",
          "Funk",
          "Fusion Jazz",
          "Groove",
          "Jazz",
          "Motown",
          "Ragtime",
          "Smooth Jazz",
          "Soul",
        ],
      },
      Rock: {
        ico: "genre-rock",
        subs: [
          "Afro-Punk",
          "Classic Rock",
          "Country Rock",
          "Hard Rock",
          "Punk",
          "Rock And Roll",
          "Rockabilly",
          "Screamo",
          "Ska",
          "Southern Rock",
          "Worship Rock",
        ],
      },
      Worship: {
        ico: "genre-worship",
        subs: [
          "Church",
          "Gospel",
          "Hymn",
          "Praise",
          "Spiritual",
          "Worship Hip Hop",
          "Worship Metal",
          "Worship Pop",
          "Worship Rock",
        ],
      },
    },
    a = (e) => t[e].short || e,
    o = {
      Bassist: ["Bass", "a16_sndGuitarChorus"],
      Cellist: ["Cello", "a16_sndCello"],
      Drummer: ["Drums", "a16_sndDrumSet"],
      Guitarist: ["Guitar", "a16_sndGuitarElectric"],
      Pianist: ["Piano", "a16_sndPiano"],
      Rapper: ["voice", null],
      Saxophonist: ["Saxophone", "a16_sndSaxophone"],
      Singer: ["voice", null],
      Violinist: ["Violin", "a16_sndViolin"],
    },
    n = [
      "Mammoth Beats",
      "Meridian Beats",
      "Krypton Records",
      "Liquid Entertainment",
      "Vulva Studios",
      "Ensemble Beats",
      "Rhythm Beats",
      "Aristotle Records",
      "Luxe Studios",
      "Mahogany Beats",
    ],
    r = [
      "A Banana",
      "A Platinum Statue",
      "A Black-and-White Photo of You",
      "A Black and Red Silhouette",
      "A Rose with Thorns",
      "A Heart Being Torn in Half",
      "A Rice Farm",
      "A Faded Image of You",
      "A Graveyard with Demons",
      "You as a Baby in a Pool",
    ],
    s = ["The Band Wearing Straitjackets"],
    i = [
      "Midnight",
      "Neon",
      "Broken",
      "Golden",
      "Velvet",
      "Electric",
      "Lonely",
      "Wild",
      "Paper",
      "Silver",
      "Burning",
      "Sweet",
      "Cold",
      "Dusty",
      "Crimson",
      "Hollow",
    ],
    l = [
      "Weather",
      "Hearts",
      "Highway",
      "Dreams",
      "Summer",
      "Echoes",
      "Boots",
      "Rain",
      "Fire",
      "Roses",
      "Lights",
      "Ghosts",
      "Tears",
      "Thunder",
      "Diamonds",
      "Lies",
    ],
    c = () => `${pickR(i)} ${pickR(l)}`,
    d = [
      "Strokes",
      "Sons",
      "Ghosts",
      "Kings",
      "Daughters",
      "Wolves",
      "Echoes",
      "Saints",
      "Riders",
      "Shadows",
      "Children",
      "Prophets",
    ],
    u = [
      "Cartels",
      "the Desert",
      "the Valley",
      "the Moon",
      "the Highway",
      "the Revolution",
      "Midnight",
      "the Harbor",
      "the Machine",
      "the Storm",
      "Thunder",
      "Tomorrow",
    ],
    m = () =>
      chance(0.5)
        ? `${pickR(d)} of ${pickR(u).replace(/^Cartels$/, "the Cartels")}`
        : `The ${pickR(i)} ${pickR(l)}`,
    num = (e, t = 0) => ("number" == typeof e && isFinite(e) ? e : t),
    p = () => {
      const e = (state.music ||= { releases: [], tried: {}, toured: -1, concert: -1, released: -1 });
      return (
        (e.releases = Array.isArray(e.releases) ? e.releases : []),
        (e.unreleased = Array.isArray(e.unreleased) ? e.unreleased : []),
        (e.awards = Array.isArray(e.awards) ? e.awards : []),
        (e.evSeen = e.evSeen && "object" == typeof e.evSeen ? e.evSeen : {}),
        (e.crew = Array.isArray(e.crew) ? e.crew.filter((c) => c && c.id) : []),
        (e.chart = e.chart && "object" == typeof e.chart ? e.chart : null),
        (e.pop = num(e.pop)),
        (e.hype = Math.max(0, num(e.hype))),
        (e.indep = !!e.indep),
        (e.stageName = "string" == typeof e.stageName ? e.stageName : ""),
        (e.released = num(e.released, -1)),
        (e.concert = num(e.concert, -1)),
        (e.toured = num(e.toured, -1)),
        e
      );
    },
    artFix = () => {
      const e = state.art;
      return e && "object" == typeof e && !Array.isArray(e)
        ? ((e.fame = Math.max(0, Math.min(100, Math.round(num(e.fame))))), e)
        : null;
    },
    b = () => (state.job && state.job.music ? state.job : null),
    h = () => !!b(),
    g = (e) => new Audio(`sounds/${e}.wav`).play().catch(() => {}),
    y = (e) => {
      const [t] = o[e] || ["voice"],
        a = MB();
      return "voice" === t ? a.voice || 0 : a.instr[t] || 0;
    },
    f = () => "music" === state.talent;
  function $() {
    const e = p(),
      t = artFix();
    if (!t || (!e.signed && !e.indep)) return;
    (e.pop = clamp(num(e.pop))), (e.hype = Math.max(0, num(e.hype)));
    const a = Math.round(0.5 * e.pop);
    !t.fameOn && e.pop >= 15
      ? ((t.fameOn = !0),
        (t.fame = Math.min(100, Math.max(num(t.fame), a, 5))),
        say("People are starting to recognize me from my music."),
        setTimeout(
          () =>
            notice(
              "Fame unlocked!",
              "So many people love your music that you are becoming famous!",
              null,
              !0,
            ),
          0,
        ))
      : t.fameOn && (t.fame = Math.min(100, Math.max(num(t.fame), a)));
  }
  const k = (e) => {
    const t = artFix();
    t && t.fameOn && (t.fame = Math.max(1, num(t.fame) - e));
  };
  function v(e) {
    const t = Object.values(state.social || {}).filter((e) => e && !e.banned);
    return !t.length || e < 1
      ? 0
      : (t.forEach((a) => {
          a.subs += Math.round((e / t.length) * (0.7 + 0.6 * Math.random()));
        }),
        "function" == typeof socialStarCheck && socialStarCheck(),
        e);
  }
  const w = (e) => (/^[aeiou]/i.test(e) ? "an" : "a"),
    S = (e) => (e >= 1e6 ? 1e3 * Math.round(e / 1e3) : e >= 1e4 ? 100 * Math.round(e / 100) : e);
  MB_LIST.push(["voice", "Voice", "Take voice lessons", 8]),
    (MB_DO.voice = () => {
      const e = MB(),
        t = state.age < 18,
        a = t ? 0 : localPrice(1e3),
        o = e.voice || 0;
      jCard({
        tag: "Mind &amp; Body",
        iconSrc: "mind/voice.png",
        title: "Voice",
        close: !0,
        lead: "Enroll in a course of voice lessons today!",
        rows: a ? [["Cost", usd(a)]] : [],
        bars: [["Your Skill", o]],
        choices: [
          [
            "Take voice lessons",
            () => {
              if (t && !e.voiceOk) {
                if (chance(0.15))
                  return (
                    snapClose(),
                    say("I asked my parents for singing lessons, but they said no."),
                    notice("Voice Lessons", "Your parents won't pay for singing lessons.", null, !0)
                  );
                (e.voiceOk = !0), say("My parents agreed to pay for singing lessons.");
              }
              const n = () => {
                (e.voiceN = e.voiceAge === state.age ? (e.voiceN || 0) + 1 : 1), (e.voiceAge = state.age);
                let t = e.voiceN <= 3 ? rint(2, 6) : rint(0, 1);
                f() && (t = 2 * t + 1),
                  (e.voice = Math.min(100, o + t)),
                  fx({ Happiness: +rint(0, 2) }, ""),
                  mbRes(
                    pickR(["Hitting the high notes", "Do re mi", "Sing it loud", "Practice makes perfect"]),
                    "You took voice lessons and practiced breathing, pitch, and vocal control.",
                    { bars: [["Skill", e.voice]], log: "I took voice lessons." },
                  );
              };
              a ? mbPay(a, n) : n();
            },
          ],
        ],
      });
    });
  const M = window.openMindBodyAct;
  window.openMindBodyAct = function () {
    const e = M.apply(this, arguments),
      t = sList.querySelector('[data-mb="voice"]');
    return (
      t &&
        !t.classList.contains("dis") &&
        t
          .querySelector(".t span")
          ?.replaceWith(
            Object.assign(document.createElement("div"), { innerHTML: sBar("Skill", MB().voice || 0) })
              .firstChild,
          ),
      e
    );
  };
  const R = window.openSpecialCareers;
  function C() {
    return state.age < 18
      ? notice("Musician", "You must be at least 18 to pursue a career in music.", null, !0)
      : h()
        ? D()
        : ((sTitle.textContent = "MUSICIAN"),
          (sSub.style.display = "none"),
          (sBack.innerHTML = BACK_ICON),
          (sBack.onclick = openSpecialCareers),
          (sList.innerHTML = `<div class="row" data-mu="band"><img src="${e("band")}"><div class="t"><b>Band</b><span>Look for a band</span></div>${DOTS}</div><div class="row" data-mu="solo"><img src="${e("solo")}"><div class="t"><b>Solo Artist</b><span>Audition as a solo artist</span></div>${DOTS}</div><div class="row" data-mu="indep"><img src="${e("studio-01")}"><div class="t"><b>Go Independent</b><span>Start your own career, no label</span></div>${DOTS}</div>`),
          (sList.querySelector('[data-mu="solo"]').onclick = A),
          (sList.querySelector('[data-mu="band"]').onclick = I),
          (sList.querySelector('[data-mu="indep"]').onclick = openIndependent),
          (sList.scrollTop = 0),
          void screen.classList.add("open"));
  }
  window.openSpecialCareers = function () {
    const e = R.apply(this, arguments),
      t = sList.querySelector('[data-pack="musician"]');
    return (
      t &&
        (t.classList.remove("dis"),
        t.querySelector(".chev") || t.insertAdjacentHTML("beforeend", CHEV),
        (t.onclick = C)),
      e
    );
  };
  const T = () => {
      const e = p();
      return (
        (e.labels && e.labels.age === state.age) ||
          (e.labels = { age: state.age, list: [...n].sort(() => Math.random() - 0.5).slice(0, 3) }),
        e.labels.list
      );
    },
    L = (e, t, a, o = 0) =>
      `<label class="hr-lab">${t}</label><div class="hr-sel"><select id="${e}">${a.map((e, t) => `<option value="${t}"${t === o ? " selected" : ""}>${e}</option>`).join("")}</select></div>`;
  function P(e, t, a, o, n) {
    ev.classList.remove("death18"),
      (ev.innerHTML = `<div class="jcw"><div class="jm-x" id="muX" style="left:-14px;top:-14px">${CARD_X}</div><div class="jm-tag" style="margin-top:12px">Music</div>\n      <h4><img src="${e}" alt=""><span>${t}</span></h4>${a}<button class="jm-apply ev-btn" id="muGo">${n}</button></div>`),
      (ev.style.overflow = "visible");
    const r = () => {
      evWrap.classList.remove("open"), (ev.style.overflow = "");
    };
    (document.getElementById("muX").onclick = () => {
      play("dismiss"), r();
    }),
      (document.getElementById("muGo").onclick = () => {
        !1 !== o(r) && r();
      }),
      evWrap.classList.add("open");
  }
  const B = Object.keys(o);
  function A() {
    const t = T(),
      a = p().lastRole ?? B.indexOf("Singer");
    P(
      e("solo"),
      "Solo Artist",
      `<div class="lead">Audition for a record contract as a solo artist today!</div>${L("muRole", "Pick your career type:", B, a)}${L("muLabel", "Pick your record label:", t)}`,
      () => {
        const e = B[+document.getElementById("muRole").value],
          a = t[+document.getElementById("muLabel").value];
        (p().lastRole = B.indexOf(e)), setTimeout(() => E({ role: e, label: a, band: null }), 60);
      },
      "Request an audition",
    );
  }
  function I() {
    const o = p().lastRole ?? B.indexOf("Singer");
    P(
      e("band"),
      "Band",
      `<div class="lead">Look for a band that needs a new member today!</div>${L("muRole", "Pick your career type:", B, o)}`,
      () => {
        const o = B[+document.getElementById("muRole").value];
        p().lastRole = B.indexOf(o);
        const n = x(),
          r = m(),
          s = pickR(T()),
          i = rint(2, 4),
          l = Array.from({ length: i }, () => {
            const e = chance(0.6) ? "m" : "f";
            return { first: uname(e), last: any(LAST), g: e, role: pickR(B.filter((e) => e !== o)) };
          });
        setTimeout(
          () =>
            jCard({
              tag: "Music",
              iconSrc: e(t[n].ico),
              title: r,
              close: !0,
              lead: `${r}, ${w(a(n))} ${a(n).toLowerCase()} band signed with ${s}, is looking for a new ${o.toLowerCase()}.<br><br>What will you do?`,
              rows: [
                ["Genre", n],
                ["Record Label", s],
                ["Members", i],
              ],
              choices: [
                [
                  "Audition for the band",
                  () =>
                    setTimeout(
                      () =>
                        E({ role: o, label: s, band: { name: r, genre: n, members: l, rel: rint(55, 75) } }),
                      60,
                    ),
                ],
                ["Never mind", () => {}],
              ],
            }),
          60,
        );
      },
      "Find a band",
    );
  }
  const x = () => {
    const e = Object.entries(t),
      a = e.reduce((e, [, t]) => e + (t.w || 1), 0);
    let o = Math.random() * a;
    for (const [t, a] of e) if ((o -= a.w || 1) < 0) return t;
    return "Pop";
  };
  function E({ role: e, label: t, band: a }) {
    const o = p(),
      n = `${t}|${a ? a.name : "solo"}`;
    if ((screen.classList.remove("open"), o.tried[n] === state.age))
      return notice(
        "Not yet",
        `${a ? a.name : t} already turned you down this year. Try again next year.`,
        null,
        !0,
      );
    o.tried[n] = state.age;
    const r = y(e),
      s = a ? a.name : t,
      i = Math.max(0.08, Math.min(0.65, 0.5 - 0.0035 * r - 0.001 * (state.stats.Looks - 50)));
    if (chance(i))
      return (
        say(`I asked ${s} for an audition as ${w(e)} ${e.toLowerCase()}, but they declined.`),
        chance(0.5)
          ? notice("No Audition", `${s} has declined your request for an audition.`, null, !0)
          : notice("No Response", `You contacted ${s}, but they never called you back.`, null, !0)
      );
    const l = clamp(Math.round(0.75 * r + rint(-15, 25) + (f() ? 8 : 0) + (state.stats.Looks - 50) / 10)),
      c = a
        ? `to join ${a.name} as ${w(e)} ${e.toLowerCase()}`
        : `for a record contract as ${w(e)} ${e.toLowerCase()} with ${t}`;
    say(`I auditioned ${c}.`);
    const d = l >= 55 && chance(Math.min(0.95, 0.35 + (l - 55) / 60)),
      u =
        l >= 80
          ? pickR(["Nailed it", "Showstopper", "Gave it my all"])
          : l >= 50
            ? pickR(["Gave it my all", "Not bad", "Fingers crossed"])
            : pickR(["Choked", "Off key", "Rough day"]);
    notice(
      u,
      `You auditioned ${c}.`,
      () =>
        setTimeout(
          () =>
            d
              ? j({ role: e, label: t, band: a })
              : (say(`${s} decided against offering me a contract.`),
                notice(
                  "No deal",
                  `${s} decided against offering you ${a ? "a spot in the band" : "a contract"}.<br><br>${pickR(["They don't think you're the artist they're looking for.", "Your performance failed to win them over.", "They were unimpressed with your audition."])}`,
                  null,
                  !0,
                )),
          120,
        ),
      !0,
      `<div class="ev-bars nb"><b>Your Performance</b><i><u style="width:${Math.max(l, 2)}%;background:${barCol(l)}"></u></i></div>`,
    );
  }
  function j({ role: o, label: n, band: r, genre: g0, note: s = "" }) {
    const i = g0 && t[g0] ? g0 : r ? r.genre : "Rapper" === o ? "Rap" : x(),
      l = y(o),
      c = localPrice(S(Math.round(1e3 * rint(4, 25) * (1 + l / 120) * (r ? 0.6 : 1)))),
      d = rint(10, 20),
      u = rint(2, 4),
      m = i.toLowerCase(),
      b = r ? `as ${w(o)} ${o.toLowerCase()} in ${r.name}` : "as a solo artist";
    jCard({
      tag: "Music",
      iconSrc: e(t[i].ico),
      title: "Record Contract",
      surprise: !0,
      lead: `${s}You have been offered an exclusive contract to produce ${m} music ${b} for ${n}.<br><br>What will you do?`,
      rows: [
        ["Role", o],
        ["Genre", i],
        ...(r ? [["Band", r.name]] : []),
        ["Record Label", n],
        ["Advance", usd(c)],
        ["Royalty Rate", `${d}%`],
        ["Term", `${u} Years`],
      ],
      choices: [
        [
          "Sign the contract",
          () =>
            (function ({ role: o, genre: n, label: r, band: s, advance: i, royalty: l, term: c }) {
              if (state.job && !state.job.music) {
                const e = state.job;
                say(`I quit my job as ${e.t} to pursue music.`), (state.job = null);
              }
              const d = p();
              Object.assign(d, {
                role: o,
                genre: n,
                label: r,
                band: s,
                royalty: l,
                term: c,
                start: state.age,
                pop: Math.max(num(d.pop), rint(3, 10)),
                signed: !0,
                indep: !1,
                label: r,
              }),
                (state.job = {
                  t: `${a(n)} ${o}`,
                  c: "Record Label",
                  emp: s ? s.name : r,
                  pay: 0,
                  music: !0,
                  perf: 100,
                  icon: e(t[n].ico),
                  tenure: 0,
                }),
                (state.money += i),
                g("SFX_MusicProducer_LabelSign"),
                renderStats(),
                renderAvatar();
              const u = s ? `as ${w(o)} ${o.toLowerCase()} in ${s.name}` : "as a solo artist";
              say(`I signed a ${c}-year contract with ${r} to produce ${n.toLowerCase()} music ${u}.`),
                notice(
                  pickR(["We getting started ASAP", "Signed, sealed, delivered", "Big break"]),
                  `You signed a ${c}-year contract to produce ${n.toLowerCase()} music ${u} with ${r}.<br><br>You have received a ${usd(i)} advance!`,
                  () => {
                    N() && setTimeout(Y, 120);
                  },
                  !0,
                );
            })({ role: o, genre: i, label: n, band: r, advance: c, royalty: d, term: u }),
        ],
        [
          "Turn it down",
          () => {
            say(`I turned down a record contract with ${n}.`),
              notice("Maybe later", `You turned down the contract with ${n}.`, null, !0);
          },
        ],
      ],
    });
  }
  const N = () => {
    const e = p();
    return !(!e.signed || !b() || ("Rapper" !== e.role && "Rap" !== e.genre));
  };
  function Y() {
    const e = p();
    N() &&
      window.faceTatPicker &&
      faceTatPicker.available() &&
      e.inkAsked !== state.age &&
      ((e.inkAsked = state.age),
      (e.inkAsks = (e.inkAsks || 0) + 1),
      jCard({
        tag: "Music",
        iconSrc: "tattoo/teardrop.png",
        title: "Image Consultant",
        lead: `${e.label} wants you to look the part.<br><br>"${pickR(["Every rapper on the charts has face ink. You need some too.", "The fans want edge. Get something on your face.", "Our image team says a face tattoo would sell a lot of records.", "You look like an accountant. Fix that. Face tattoo, this week."])}"<br><br>What will you do?`,
        choices: [
          [
            "Get a face tattoo",
            () =>
              setTimeout(
                () =>
                  faceTatPicker(() => {
                    (e.pop = clamp((e.pop || 0) + rint(3, 7))), $();
                  }),
                80,
              ),
          ],
          ["No thanks", () => say(`${e.label} pressured me to get a face tattoo. I said no.`)],
        ],
      }));
  }
  document.getElementById("ageBtn").addEventListener("click", () => {
    const e = p();
    state.dead ||
      !N() ||
      (e.inkAsks || 0) >= 2 ||
      ("function" == typeof myTats && myTats(state.look)) ||
      (state.art && state.art.fameOn && chance(0.5) && queueRoll(Y));
  });
  const H = window.openJobScreen;
  window.openJobScreen = function () {
    return h() ? D() : H.apply(this, arguments);
  };
  const O = (e) =>
    `<div class="rel">Popularity <i><u style="width:${Math.max(e, 2)}%;background:#f5b82e"></u></i></div>`;
  function D() {
    const o = b(),
      n = p();
    if (!o) return openOccupation();
    syncProfile(),
      (sTitle.textContent = "JOB"),
      (sSub.style.display = "none"),
      (sBack.innerHTML = BACK_ICON),
      (sBack.onclick = openOccupation);
    const r = (e, t, a, o, n = DOTS, r) =>
        `<div class="row${r ? " dis" : ""}" data-mj="${e}"><img src="${t}"><div class="t"><b>${a}</b>${o}</div>${r ? "" : n}</div>`,
      s = n.band;
    sList.innerHTML =
      r("info", o.icon, o.t, O(n.pop || 0)) +
      (s
        ? r(
            "band",
            e(t[n.genre].ico),
            `${s.name} <em>(Band)</em>`,
            `<span>View your ${a(n.genre).toLowerCase()} band</span>`,
          )
        : "") +
      '<div class="sec">Activities</div>' +
      r(
        "album",
        e("album"),
        "Album",
        `<span>${n.indep ? "Record an album on your own dime" : "Make a new album"}</span>`,
      ) +
      (s
        ? r(
            "bandrel",
            e("band"),
            "Band",
            `<div class="rel">Relationship <i><u style="width:${Math.max(s.rel, 2)}%;background:${barCol(s.rel)}"></u></i></div>`,
          ) + r("bandname", "identity/name.png", "Band Name", "<span>Change your band's name</span>")
        : "") +
      (n.indep
        ? r("studios", e("studio-07"), "Studios", "<span>Book a studio and pick your beats</span>") +
          r(
            "crew",
            e("solo"),
            "Crew",
            `<span>${n.crew.length}/${IN_CREW.length} hired · +${crewQ()}% recording quality</span>`,
          ) +
          r("collab", e("band"), "Collab", "<span>Record with someone in your life</span>") +
          r(
            "charts",
            e("diamond"),
            "Charts",
            `<span>${n.chart ? `Last chart: #${n.chart.pos} (${n.chart.year})` : "See where your music lands"}</span>`,
          ) +
          r("promote", e("diamond"), "Promote", "<span>Advertise your music</span>") +
          r("radio", e("mic-studio"), "Radio", "<span>Send a song to radio</span>") +
          r("vault", e("notes"), "Unreleased", "<span>Your vault and snippets</span>")
        : "") +
      r("concert", e("concert"), "Concert", "<span>Put on a live concert</span>") +
      r("disco", e("disc"), "Discography", "<span>View your discography</span>", CHEV, !n.releases.length) +
      r("practice", e("mic"), "Practice", "<span>Work on your skills</span>") +
      (n.releases.length
        ? r("awards", e("gold"), "Awards", "<span>Your trophies and nominations</span>")
        : "") +
      (n.releases.some((e) => e.songs && e.songs.length)
        ? r("rename", e("disc"), "Rename Songs", "<span>Change the track names on an album</span>")
        : "") +
      r("stage", "identity/name.png", "Stage Name", "<span>Change your artist name</span>") +
      r(
        "quit",
        "cars/ui-hand-waving.png",
        "Quit",
        `<span>${s ? "Quit the band" : n.indep ? "Quit music" : "Walk out on your contract"}</span>`,
      ) +
      r("single", e("disc"), "Single", "<span>Record a single</span>") +
      r(
        "tour",
        e("tour"),
        "Tour",
        `<span>${n.indep ? "Fund your own world tour" : "Go on a world tour"}</span>`,
      ) +
      (n.indep && signedOfferReady()
        ? r("getSigned", e("band"), "Get Signed", "<span>Labels are watching you</span>")
        : "");
    const i = {
      info: G,
      band: W,
      album: () => (n.indep ? indRecord(!1) : J(!1)),
      single: () => (n.indep ? indRecord(!0) : J(!0)),
      bandrel: F,
      bandname: _,
      concert: oe,
      disco: z,
      practice: q,
      quit: se,
      tour: () => (n.indep ? indTour() : re()),
      studios: openStudios,
      crew: openCrew,
      collab: openCollab,
      charts: openCharts,
      promote: openPromo,
      radio: openRadio,
      vault: openVault,
      awards: openAwards,
      rename: openRenamePicker,
      stage: openStageName,
      getSigned: openSignedOffer,
    };
    sList.querySelectorAll("[data-mj]").forEach(
      (e) =>
        (e.onclick = () => {
          e.classList.contains("dis") || i[e.dataset.mj]();
        }),
    ),
      (sList.scrollTop = 0),
      screen.classList.add("open");
  }
  function G() {
    const e = p(),
      t = b();
    jCard({
      tag: "Music",
      iconSrc: t.icon,
      title: t.t,
      close: !0,
      rows: [
        ...(e.indep ? [["Status", "Independent"]] : [["Record Label", e.label]]),
        ...(e.stageName ? [["Stage Name", e.stageName]] : []),
        ["Genre", e.genre],
        ...(e.indep
          ? []
          : [
              ["Royalty Rate", `${e.royalty}%`],
              ["Contract Ends", `Age ${e.start + e.term}`],
            ]),
        ["Releases", e.releases.length],
        ...(e.indep ? [["Unreleased", e.unreleased.length]] : []),
        ...(e.indep
          ? [
              ["Crew", `${e.crew.length}/${IN_CREW.length} (+${crewQ()}% quality)`],
              ["Career Chart Peak", e.chart && e.chart.peak ? `#${e.chart.peak}` : "—"],
            ]
          : []),
        ["Skill", `${y(e.role)}%`],
      ],
      bars: [["Popularity", clamp(Math.round(num(e.pop))), "#f5b82e"]],
    });
  }
  function W() {
    const a = p(),
      o = a.band;
    jCard({
      tag: "Band",
      iconSrc: e(t[a.genre].ico),
      title: o.name,
      close: !0,
      rows: [["Genre", a.genre], ["You", a.role], ...o.members.map((e) => [e.role, `${e.first} ${e.last}`])],
      bars: [["Relationship", o.rel]],
    });
  }
  function F() {
    const e = p().band,
      t = chance(0.8);
    (e.rel = clamp(e.rel + (t ? rint(4, 10) : -rint(3, 8)))),
      snapClose(),
      say(t ? `I hung out with my band, ${e.name}.` : `I got into an argument with my band, ${e.name}.`),
      notice(
        t ? "Band of brothers" : "Creative differences",
        t
          ? `You hung out with your bandmates in ${e.name}.`
          : `You argued with your bandmates in ${e.name} about the direction of the band.`,
        null,
        !0,
        `<div class="ev-bars nb"><b>Relationship</b><i><u style="width:${Math.max(e.rel, 2)}%;background:${barCol(e.rel)}"></u></i></div>`,
      );
  }
  function _() {
    const e = p().band;
    P(
      "identity/name.png",
      "Band Name",
      `<div class="lead">Change your band's name today!</div><label class="hr-lab">New Name:</label><input class="pet-name-in" id="muName" maxlength="28" value="${m()}"><div class="bb-rand" id="muRand">Pick Random</div>`,
      () => {
        const t = (document.getElementById("muName").value || "")
          .replace(/[<>"&]/g, "")
          .trim()
          .slice(0, 28);
        if (!t) return !1;
        const a = e.name;
        (e.name = t),
          (b().emp = t),
          (p().band.rel = clamp(e.rel + (chance(0.5) ? 3 : -3))),
          snapClose(),
          say(`My band changed its name from ${a} to ${t}.`),
          notice("New name", `Your band is now called ${t}.`, null, !0);
      },
      "Change it",
    ),
      (document.getElementById("muRand").onclick = () => {
        document.getElementById("muName").value = m();
      });
  }
  function q() {
    const t = p(),
      [a, n] = o[t.role];
    P(
      e("mic"),
      "Practice",
      `<div class="lead">Work on your ${"Singer" === t.role ? "singing" : a.toLowerCase()} skills today!</div><div class="ev-bars"><b>Your Skill</b><i><u style="width:${Math.max(y(t.role), 2)}%;background:${barCol(y(t.role))}"></u></i></div>`,
      () => {
        const e = t.practiced !== state.age;
        t.practiced = state.age;
        const r = ((e, t) => {
          const [a] = o[e] || ["voice"],
            n = MB();
          return "voice" === a
            ? (n.voice = Math.min(100, (n.voice || 0) + t))
            : ((n.instr[a] = Math.min(100, (n.instr[a] || 0) + t)), n.instr[a]);
        })(t.role, (e ? rint(2, 5) : rint(0, 1)) * (f() ? 2 : 1));
        n && g(n),
          (t.pop = clamp((t.pop || 0) + (e && chance(0.3) ? 1 : 0))),
          snapClose(),
          say(`I practiced my ${"Singer" === t.role ? "singing" : a.toLowerCase()}.`),
          notice(
            pickR(["Practice makes perfect", "In the zone", "Getting better"]),
            `You practiced your ${"Singer" === t.role ? "singing" : a.toLowerCase()}.`,
            null,
            !0,
            `<div class="ev-bars nb"><b>Skill</b><i><u style="width:${Math.max(r, 2)}%;background:${barCol(r)}"></u></i></div>`,
          );
      },
      "Practice",
    );
  }
  const V = [
      [1e7, "Diamond", "diamond"],
      [2e6, "Double Platinum", "double-platinum"],
      [1e6, "Platinum", "platinum"],
      [5e5, "Gold", "gold"],
    ],
    U = (e) => V.find((t) => e >= t[0]) || null;
  function J(a) {
    const o = p(),
      n = t[o.genre].subs;
    if (o.released === state.age)
      return notice(
        "Not so fast",
        `${o.label} won't release more than one album or single a year. Try again next year.`,
        null,
        !0,
      );
    const d = c(),
      u = o.band ? [...s, ...r] : r;
    P(
      e(a ? "disc" : "album"),
      a ? "Single" : "Album",
      `<div class="lead">${a ? "Record a new single today!" : "Make a new album today!"}</div>\n      <label class="hr-lab">Title:</label><input class="pet-name-in" id="muTitle" maxlength="30" value="${d}"><div class="bb-rand" id="muRand">Pick Random</div>\n      ${L("muSub", "Pick your subgenre:", n)}${
        a
          ? ""
          : L(
              "muTracks",
              "Number of tracks:",
              Array.from({ length: 9 }, (e, t) => `${t + 8} Tracks`),
              3,
            ) + L("muCover", "Pick your cover art:", u)
      }`,
      () => {
        const e =
            (document.getElementById("muTitle").value || "")
              .replace(/[<>"&]/g, "")
              .trim()
              .slice(0, 30) || d,
          t = n[+document.getElementById("muSub").value],
          o = a ? 1 : +document.getElementById("muTracks").value + 8,
          r = a ? null : u[+document.getElementById("muCover").value];
        setTimeout(
          () =>
            (function ({ single: e, title: t, sub: a, tracks: o, cover: n }) {
              const r = p(),
                s = (b(), e ? "single" : "album");
              if (
                (screen.classList.remove("open"),
                (r.snubs = 0),
                chance(Math.max(0.05, 0.25 - (r.pop || 0) / 400)))
              )
                return (
                  say(`${r.label} refused to release my ${s}, "${t}".`),
                  notice(
                    (e ? "Single" : "Album") + " Rejected",
                    `${r.label} is unwilling to release "${t}".<br><br>Maybe try something different.`,
                    null,
                    !0,
                  )
                );
              r.released = state.age;
              const d = y(r.role),
                u = r.pop || 0,
                m = clamp(Math.round(0.55 * d + rint(0, 45))),
                h = () => {
                  let e = 0,
                    t = 0;
                  for (; !e; ) e = Math.random();
                  for (; !t; ) t = Math.random();
                  return Math.sqrt(-2 * Math.log(e)) * Math.cos(2 * Math.PI * t);
                },
                f = (e ? 4500 : 15e3) * (1 + u / 10) ** 2.2 * (0.4 + m / 80),
                S = chance(Math.max(0.05, 0.1 + (m < 45 ? 0.1 : 0) - u / 1e3)),
                M = S ? 0.03 + 0.12 * Math.random() : Math.exp(0.85 * h()) * (chance(0.06) ? rint(3, 8) : 1),
                R = Math.max(300, Math.round(f * M)),
                C = e ? 1.3 : 15,
                T = Math.round(R * C),
                L = Math.round(0.2 * T),
                P = r.band ? r.band.members.length + 1 : 1,
                B = localPrice(Math.round((T * r.royalty) / 100 / P)),
                A = U(R),
                I = e ? pickR(i) + " " + pickR(l) : c(),
                x = {
                  title: t,
                  single: e,
                  sub: a,
                  genre: r.genre,
                  tracks: o,
                  cover: n,
                  lead: I,
                  copies: R,
                  gross: localPrice(T),
                  net: localPrice(L),
                  mine: B,
                  cert: A && A[1],
                  age: state.age,
                  band: r.band ? r.band.name : null,
                  flop: S,
                  songs: e ? null : [I, ...Array.from({ length: Math.max(0, o - 1) }, () => c())],
                };
              r.releases.push(x),
                (r.pop = clamp(u + (S ? -rint(4, 9) : Math.round(2.5 * Math.log10(R) - 6 + (A ? 6 : 0))))),
                S ? k(rint(1, 4)) : v(Math.round(R * (0.02 + 0.06 * Math.random())));
              $(),
                (state.money += B),
                renderStats(),
                g(A ? "SFX_MusicProducer_BangerAward" : "SFX_MusicProducer_NewTrack_Collab");
              say(
                `I released ${w(s)} ${s} called "${t}". It sold ${R.toLocaleString("en-US")} copies${A ? ` and went ${A[1].toLowerCase()}` : ""}.`,
              ),
                X(x);
            })({ single: a, title: e, sub: t, tracks: o, cover: r }),
          60,
        );
      },
      a ? "Record it" : "Make the album",
    ),
      (document.getElementById("muRand").onclick = () => {
        document.getElementById("muTitle").value = c();
      });
  }
  function X(t, o) {
    const n = p(),
      r = t.band ? "Your band's" : "Your",
      s = V.find((e) => e[1] === t.cert),
      i = t.copies >= 2e5,
      l = t.flop
        ? `${r} latest release was a flop! ${pickR(["Critics tore it apart.", "Fans hated the new sound.", "Nobody bought it.", "It was mocked all over social media."])}`
        : s
          ? `${r} latest release was a commercial success and went ${s[1].toLowerCase()}!`
          : i
            ? `${r} latest release was a solid success!`
            : `${r} latest release didn't sell very well.`;
    jCard({
      tag: "Music",
      iconSrc: e(s ? s[2] : t.single ? "disc" : "album"),
      title: t.title,
      lead: o ? `Released at age ${t.age}.` : l,
      rows: [
        [t.single ? "Single" : "Album", t.title],
        ["Type", t.single ? "Single" : `Studio Album (${t.tracks} Tracks)`],
        ...(t.band ? [["Band", t.band]] : []),
        ["Genre", `${t.sub} (${a(t.genre)})`],
        ...(t.feat ? [["Feature", `${t.feat}${t.featShare ? ` · ${Math.round(t.featShare * 100)}% cut` : ""}`]] : []),
        ...(t.studio ? [["Studio", t.studio]] : []),
        ...(t.beat ? [["Beat", t.beat]] : []),
        ...(t.peak ? [["Chart Peak", `#${t.peak}`]] : []),
        ...(t.quality ? [["Recording Quality", `${t.quality}%`]] : []),
        ...(t.cover ? [["Cover Art", t.cover]] : []),
        ...(t.single ? [] : [["Lead-Off Track", t.lead]]),
        ...(t.songs && t.songs.length ? [["Tracks", t.songs.length]] : []),
        [
          "Copies Sold",
          `${t.copies.toLocaleString("en-US")}${t.cert ? ` (${t.cert})` : t.flop ? " (Flop)" : ""}`,
        ],
        ["Gross Revenue", usd(t.gross)],
        ["Net Earnings", usd(t.net)],
        ["Your Proceeds", usd(t.mine)],
      ],
      bars: [["Popularity", clamp(Math.round(num(n.pop))), "#f5b82e"]],
      green: !0,
      ok: () => o && z(),
    });
  }
  function z() {
    const t = p();
    (sTitle.textContent = "DISCOGRAPHY"),
      (sSub.style.display = "none"),
      (sBack.innerHTML = BACK_ICON),
      (sBack.onclick = D);
    (sList.innerHTML = t.releases
      .map((t, a) => {
        const o = V.find((e) => e[1] === t.cert);
        return `<div class="row" data-rel="${a}"><img src="${e(o ? o[2] : t.single ? "disc" : "album")}"><div class="t"><b>${t.title} <em>(${t.single ? "Single" : "Album"})</em></b><div class="rel">Popularity <i><u style="width:${Math.max(((e) => clamp(Math.round(22 * (Math.log10(Math.max(1e3, e.copies)) - 3))))(t), 2)}%;background:#2fa03b"></u></i></div></div>${DOTS}</div>`;
      })
      .join("")),
      sList
        .querySelectorAll("[data-rel]")
        .forEach((e) => (e.onclick = () => X(t.releases[+e.dataset.rel], !0))),
      (sList.scrollTop = 0),
      screen.classList.add("open");
  }
  const K = [
      [0, "Bar", [40, 150], ["The Rusty Nail", "Joe's Tavern", "The Tipsy Goat", "The Dive", "Barrel House"]],
      [15, "Nightclub", [150, 800], ["Club Neon", "The Velvet Room", "Pulse", "The Basement", "Echo Lounge"]],
      [
        30,
        "Theater",
        [800, 3e3],
        ["The Orpheum", "Paramount Theater", "The Palace", "Grand Opera House", "The Fillmore"],
      ],
      [50, "Arena", [5e3, 2e4], ["{city} Arena", "{city} Coliseum", "Civic Center", "Union Arena"]],
      [
        75,
        "Stadium",
        [3e4, 8e4],
        ["{city} Stadium", "Memorial Stadium", "National Stadium", "Victory Field"],
      ],
    ],
    Q = (e) => K.reduce((t, a, o) => (e >= a[0] ? o : t), 0),
    Z = () => Object.values(state.social || {}).reduce((e, t) => e + ((t && !t.banned && t.subs) || 0), 0),
    ee = () => {
      const e = artFix();
      return e && e.fameOn ? Math.max(0, Math.min(100, num(e.fame))) : 0;
    },
    te = (e) => {
      const t = p(),
        a = t.band ? 1 / (t.band.members.length + 1) : 1;
      return localPrice(
        S(
          Math.round(
            ((e.crowd[0] + e.crowd[1]) / 2) *
              e.tix *
              0.3 *
              a *
              ((1 + (p().pop || 0) / 30) * (1 + ee() / 40) * (1 + Math.log10(1 + Z() / 1e4) / 2)),
          ),
        ),
      );
    };
  function ae() {
    const e = p();
    if (e.gigs && e.gigs.age === state.age && e.gigs.list[0] && e.gigs.list[0].tix) return e.gigs.list;
    const t = Q(e.pop || 0),
      a = state.city || COUNTRIES[state.country][1],
      o = [...new Set([t, t, Math.max(0, t - 1)])],
      n = [];
    for (const e of [t, ...o].slice(0, 3)) {
      const [, t, [o, r], s] = K[e];
      let i;
      do {
        i = pickR(s).replace("{city}", a);
      } while (n.some((e) => e.name === i) && s.length > n.length);
      n.push({ name: i, type: t, crowd: [o, r], tix: rint(8, 20) });
    }
    return (e.gigs = { age: state.age, list: n }).list;
  }
  function oe() {
    const t = p();
    if (t.concert === state.age)
      return notice("Take a break", "You've already played a concert this year.", null, !0);
    const a = [...ae()].map((e) => ({ ...e, fee: te(e) })).sort((e, t) => t.fee - e.fee),
      o = Z(),
      n = ee();
    P(
      e("concert"),
      "Concert",
      `<div class="lead">Put on a live concert${t.band ? ` with ${t.band.name}` : ""} today!</div>\n      <table class="jc"><tbody><tr><td><b>Popularity:</b> ${t.pop || 0}%</td></tr>${n ? `<tr><td><b>Fame:</b> ${n}%</td></tr>` : ""}<tr><td><b>Followers:</b> ${o.toLocaleString("en-US")}</td></tr></tbody></table>\n      ${L(
        "muVenue",
        "Pick your venue:",
        a.map((e) => `${e.name} (${e.type}): ${usd(e.fee)}`),
      )}`,
      () => {
        const e = a[+document.getElementById("muVenue").value];
        t.concert = state.age;
        const o = chance(0.12),
          n = rint(...e.crowd),
          r = e.fee,
          s = clamp(Math.round(0.6 * y(t.role) + rint(0, 40) - (o ? rint(30, 55) : 0))),
          [i, l] =
            s >= 80
              ? [pickR(["Encore!", "Legendary night"]), "The crowd went wild and begged for an encore!"]
              : s >= 55
                ? [pickR(["Rock on", "Solid show"]), "The show went well and the crowd had a great time."]
                : s >= 35
                  ? [pickR(["Meh", "Tough crowd"]), "The crowd wasn't really feeling it."]
                  : [
                      pickR(["Booed off stage", "Disaster", "Yikes"]),
                      (o
                        ? pickR([
                            "You forgot the lyrics halfway through.",
                            "Your mic cut out and you panicked.",
                            "You were badly off key all night.",
                            "You tripped on stage and never recovered.",
                          ]) + " "
                        : "") + "The crowd booed you and fans are trashing the show online.",
                    ];
        let c = 0;
        s >= 55
          ? ((t.pop = clamp((t.pop || 0) + rint(2, 5))),
            (c = v(Math.round(n * (0.05 + 0.15 * Math.random())))))
          : s >= 35
            ? (t.pop = clamp((t.pop || 0) + rint(0, 1)))
            : ((t.pop = clamp((t.pop || 0) - rint(2, 5))), k(rint(2, 5))),
          $(),
          (state.money += r),
          fx({ Happiness: s >= 55 ? +rint(3, 8) : s >= 35 ? 0 : -rint(3, 8) }, ""),
          g("SFX_MusicProducer_ClubTakeover"),
          snapClose(),
          say(
            `I played a concert at ${e.name} in front of ${n.toLocaleString("en-US")} people and earned ${usd(r)}.${s < 35 ? " It went terribly." : ""}`,
          ),
          notice(
            i,
            `You played a concert at ${e.name}.<br><br>${l}`,
            null,
            !0,
            `<table class="nt"><tr><td><b>Venue:</b> ${e.name} (${e.type})</td></tr><tr><td><b>Audience:</b> ${n.toLocaleString("en-US")}</td></tr><tr><td><b>Your Earnings:</b> ${usd(r)}</td></tr>${c ? `<tr><td><b>New Followers:</b> ${c.toLocaleString("en-US")}</td></tr>` : ""}</table><div class="ev-bars nb"><b>Performance</b><i><u style="width:${Math.max(s, 2)}%;background:${barCol(s)}"></u></i></div>`,
          );
      },
      "Perform",
    );
  }
  const ne = (e) => {
    for (let t = (e = [...e]).length - 1; t > 0; t--) {
      const a = Math.floor(Math.random() * (t + 1));
      [e[t], e[a]] = [e[a], e[t]];
    }
    return e;
  };
  function re() {
    const t = p(),
      a = t.band ? ` and your band, ${t.band.name},` : "";
    P(
      e("tour"),
      "Tour",
      `<div class="lead">Ask your record label to arrange a world tour for you${a} today!</div>`,
      () => {
        if ((snapClose(), t.toured === state.age || (t.pop || 0) < 20 || chance(0.2)))
          return (
            say(`${t.label} couldn't arrange a world tour for me.`),
            notice(
              "No luck",
              `${t.band ? "Your band's" : "Your"} record label was unable to arrange a world tour for you${t.band ? " and the band" : ""}.`,
              null,
              !0,
            )
          );
        const a = (function () {
            const e = ne(Object.keys(COUNTRIES).filter((e) => e !== state.country)).slice(0, rint(4, 10)),
              t = [state.country, ...e].map((e) => {
                const t = (window.CITIES && CITIES[e]) || [COUNTRIES[e][1]];
                return [e, ne(t).slice(0, Math.min(t.length, rint(1, 3)))];
              });
            return {
              stops: t,
              cities: t.reduce((e, [, t]) => e + t.length, 0),
              text: t.map(([e, t]) => `${t.join(", ")} (${COUNTRIES[e][0]})`).join("; "),
            };
          })(),
          o = Math.max(4, Math.round(1.4 * a.cities + rint(-3, 4)));
        setTimeout(
          () =>
            jCard({
              tag: "Music",
              iconSrc: e("tour"),
              title: "Tour",
              surprise: !0,
              lead: `Your record label, ${t.label}, has arranged a world tour for you${t.band ? ` and your band, ${t.band.name}` : ""}.<br><br>What will you do?`,
              rows: [
                ["Cities", a.text],
                ["Tour Length", `${o} Weeks`],
              ],
              choices: [
                [
                  "Agree to do it",
                  () =>
                    (function (e, t) {
                      const a = p(),
                        o = a.band ? 1 / (a.band.members.length + 1) : 1;
                      a.toured = state.age;
                      const n = clamp(Math.round(0.6 * y(a.role) + rint(0, 40))),
                        r = Math.round(e.cities * rint(4e3, 2e4) * (1 + (a.pop || 0) / 30) * (0.6 + n / 250)),
                        s = r * rint(40, 90),
                        i = localPrice(S(s)),
                        l = localPrice(S(Math.round(0.21 * s * o)));
                      (a.pop = clamp(
                        (a.pop || 0) + (n >= 60 ? rint(5, 10) : n >= 35 ? rint(1, 4) : -rint(1, 4)),
                      )),
                        (state.money += l),
                        n >= 35 ? v(Math.round(r * (0.02 + 0.06 * Math.random()))) : k(rint(2, 6));
                      $(),
                        fx({ Health: -rint(2, 6), Happiness: n >= 50 ? +rint(4, 9) : -rint(1, 4) }, ""),
                        g("SFX_MusicProducer_ClubTakeover"),
                        say(
                          `I went on a ${t}-week world tour${a.band ? ` with ${a.band.name}` : ""} and played ${e.cities} cities in front of ${r.toLocaleString("en-US")} people.`,
                        );
                      const c =
                        n >= 80
                          ? pickR(["Beyond grateful", "Legendary"])
                          : n >= 60
                            ? pickR(["What a rush", "Sold out"])
                            : n >= 35
                              ? pickR(["Exhausting", "Road weary"])
                              : pickR(["Rough tour", "Lip-sync scandal"]);
                      notice(
                        c,
                        "You went on a world tour.",
                        null,
                        !0,
                        `<table class="nt"><tr><td><b>Cities:</b> ${e.text}</td></tr><tr><td><b>Tour Length:</b> ${t} Weeks</td></tr><tr><td><b>Total Attendance:</b> ${r.toLocaleString("en-US")}</td></tr><tr><td><b>Gross Revenue:</b> ${usd(i)}</td></tr><tr><td><b>Net Earnings:</b> ${usd(l)}</td></tr></table><div class="ev-bars nb"><b>Performance</b><i><u style="width:${Math.max(n, 2)}%;background:${barCol(n)}"></u></i></div>`,
                      );
                    })(a, o),
                ],
                [
                  "Turn it down",
                  () => {
                    (t.toured = state.age), say(`I turned down a world tour from ${t.label}.`);
                  },
                ],
              ],
            }),
          80,
        );
      },
      "Ask them",
    );
  }
  function se() {
    const e = p();
    iosConfirm(
      "Confirm",
      e.band
        ? `Are you sure you want to quit ${e.band.name}?`
        : e.indep
          ? "Are you sure you want to quit music?"
          : `Are you sure you want to walk out on your contract with ${e.label}?`,
      () =>
        ie(
          e.band
            ? `I quit my band, ${e.band.name}.`
            : e.indep
              ? "I walked away from my music career."
              : `I walked out on my contract with ${e.label}.`,
        ),
    );
  }
  function ie(e, t, a = "Done with music") {
    const o = p();
    (o.signed = !1),
      (o.indep = !1),
      (o.band = null),
      (o.former = !0),
      (o.snubs = 0),
      (state.job = null),
      screen.classList.remove("open"),
      renderAvatar(),
      renderStats(),
      say(e),
      notice(
        a,
        e
          .replace(/^I /, "You ")
          .replace(/ I /g, " you ")
          .replace(/\bmy\b/g, "your")
          .replace(/\bme\b/g, "you"),
        t || null,
        !0,
      );
  }
  function le(e) {
    const t = p();
    if (!chance(Math.min(0.85, 0.3 + (t.pop || 0) / 120))) return;
    const a = pickR(n.filter((t) => t !== e.label));
    setTimeout(
      () =>
        j({
          role: e.role,
          label: a,
          band: e.band,
          note: `Word got out that you're no longer with ${e.label}.<br><br>`,
        }),
      150,
    );
  }
  const ce = window.openOccupation;
  window.openOccupation = function () {
    const e = ce.apply(this, arguments);
    if (h()) {
      const e = sList.querySelector('[data-go="myjob"] .rel');
      e && (e.outerHTML = O(p().pop || 0));
    }
    return e;
  };
  /* ==========================================================================
     [mod] Independent artist: 12 studios, self-releases, vault/leaks, radio,
     promo, self-funded tours, stage names, awards and 30 studio-life events.
     ========================================================================== */
  const IN_STUDIOS = [
      { n: "Bedroom Setup", f: "studio-01", cost: 0, q: -14, sp: ["Rap", "Pop", "Alternative"], prod: ["tapekidd", "lil static"], beats: ["Bedroom Pop", "Emo Rap", "Lo-Fi", "SoundCloud Rap"] },
      { n: "Budget Home Setup", f: "studio-02", cost: 150, q: -8, sp: ["Rap", "Alternative", "Rock"], prod: ["lowkey", "dustyy"], beats: ["Lo-Fi", "SoundCloud Rap", "Bedroom Pop", "Boom Bap"] },
      { n: "Home Studio", f: "studio-03", cost: 600, q: 0, sp: ["Pop", "Rap", "Rhythm and Blues"], prod: ["midnightmike", "j.verso"], beats: ["Hip-Hop", "Pop", "Indie Folk", "Soul"] },
      { n: "Wooden Home Studio", f: "studio-04", cost: 1200, q: 3, sp: ["Country", "Folk", "Rock"], prod: ["cedar", "hollis"], beats: ["Country Rock", "Folk", "Singer-Songwriter", "Americana"] },
      { n: "Vocal Booth", f: "studio-05", cost: 2000, q: 6, sp: ["Rhythm and Blues", "Pop", "Worship"], prod: ["velvet", "anisa"], beats: ["R&B", "Soul", "Pop", "Gospel"] },
      { n: "Purple Home Studio", f: "studio-06", cost: 3000, q: 8, sp: ["Rap", "K-Pop", "Pop"], prod: ["808kai", "nova"], beats: ["Trap", "Hyperpop", "Alternative Rap", "Dance"] },
      { n: "Dark Pro Desk", f: "studio-07", cost: 5000, q: 12, sp: ["Rap", "Heavy Metal", "Alternative"], prod: ["grim", "dvst"], beats: ["Drill", "Trap", "Gangsta Rap", "Emo Rap"] },
      { n: "Neon Pro Room", f: "studio-08", cost: 8000, q: 15, sp: ["Pop", "K-Pop", "Reggae"], prod: ["neonwave", "lux"], beats: ["Synth Pop", "Electro", "Dancehall", "Reggaeton"] },
      { n: "Oak Live Room", f: "studio-09", cost: 14000, q: 18, sp: ["Rock", "Country", "Rhythm and Blues"], prod: ["oakroom", "delgado"], beats: ["Classic Rock", "Blues", "Jazz", "Southern Rock"] },
      { n: "Grand Console Room", f: "studio-10", cost: 22000, q: 22, sp: ["Pop", "Rhythm and Blues", "Worship"], prod: ["grand", "saint lee"], beats: ["Pop", "R&B", "Orchestral Pop", "Soul"] },
      { n: "Black & Gold Lounge", f: "studio-11", cost: 40000, q: 26, sp: ["Rhythm and Blues", "Rap", "Worship"], prod: ["blackgold", "amara"], beats: ["R&B", "Soul", "Gospel", "Conscious Rap"] },
      { n: "Elite Flagship Studio", f: "studio-12", cost: 75000, q: 30, sp: ["Any"], prod: ["flagship", "the architect"], beats: ["Pop", "Rap", "Rock", "R&B"] },
    ],
    IN_RADIO = [
      { n: "Local College Radio", cost: 300, reach: 1 },
      { n: "Regional Station", cost: 1500, reach: 2 },
      { n: "Streaming Playlist Pitch", cost: 2500, reach: 3 },
      { n: "National Top 40", cost: 9000, reach: 4 },
      { n: "Satellite / Global", cost: 20000, reach: 5 },
    ],
    IN_PROMO = [
      { n: "Post it yourself", cost: 0, hype: [2, 5], fans: [400, 3000], pop: [0, 1], fame: [0, 1] },
      { n: "Local ads", cost: 350, hype: [4, 8], fans: [3000, 12000], pop: [1, 2], fame: [0, 1] },
      { n: "Playlist plug", cost: 4000, hype: [8, 14], fans: [20000, 80000], pop: [2, 4], fame: [1, 3] },
      { n: "Regional campaign", cost: 2500, hype: [6, 11], fans: [15000, 60000], pop: [2, 3], fame: [1, 2] },
      { n: "National push", cost: 12000, hype: [14, 24], fans: [80000, 300000], pop: [4, 8], fame: [3, 6] },
    ],
    IN_AWARDS = [
      { n: "BET Award", cat: "Best New Artist" },
      { n: "BET Award", cat: "Best Male R&B/Pop Artist" },
      { n: "GRAMMY", cat: "Best New Artist" },
      { n: "GRAMMY", cat: "Song of the Year" },
      { n: "GRAMMY", cat: "Album of the Year" },
      { n: "GRAMMY", cat: "Best Rap Song" },
      { n: "Billboard Music Award", cat: "Top New Artist" },
      { n: "Billboard Music Award", cat: "Top Rap Artist" },
      { n: "MTV VMA", cat: "Best New Artist" },
      { n: "American Music Award", cat: "New Artist of the Year" },
      { n: "Soul Train Award", cat: "Best New Artist" },
      { n: "iHeartRadio Award", cat: "Best New Artist" },
      { n: "Latin GRAMMY", cat: "Best New Artist" },
      { n: "BET Hip Hop Award", cat: "Best New Artist" },
      { n: "Brit Award", cat: "Best New Artist" },
      { n: "Brit Award", cat: "Best International Artist" },
      { n: "Emmy", cat: "Outstanding Musical Performance" },
      { n: "Emmy", cat: "Outstanding Original Song" },
      { n: "MOBO Award", cat: "Best Newcomer" },
      { n: "MOBO Award", cat: "Best Hip Hop Act" },
      { n: "NME Award", cat: "Best New Artist" },
      { n: "NME Award", cat: "Best Single" },
    ],
    // One trophy sprite per award show, cut from _art-src/grids/AWARDS.png (4x3).
    AWARD_ART = {
      GRAMMY: "aw-01",
      "American Music Award": "aw-02",
      "MTV VMA": "aw-03",
      "Billboard Music Award": "aw-04",
      "BET Award": "aw-05",
      "BET Hip Hop Award": "aw-05",
      "Brit Award": "aw-06",
      "Latin GRAMMY": "aw-07",
      "iHeartRadio Award": "aw-08",
      Emmy: "aw-09",
      "MOBO Award": "aw-10",
      "NME Award": "aw-11",
      "Soul Train Award": "aw-12",
    },
    IN_CREW = [
      { id: "engineer", n: "Engineer", q: 14, pay: 9000, ic: "mic-studio", lead: "A real engineer runs the board instead of you guessing at levels." },
      { id: "producer", n: "Producer", q: 12, pay: 12000, ic: "disc", lead: "A producer who has actual hits will shape your record and your beats." },
      { id: "songwriter", n: "Songwriter", q: 10, pay: 7000, ic: "notes", lead: "A writer who can turn your voice memos into hooks." },
      { id: "vocal", n: "Vocal Coach", q: 7, pay: 5000, ic: "mic", lead: "Your takes stop needing ten punches per line." },
      { id: "manager", n: "Manager", q: 5, pay: 10000, ic: "solo", lead: "Somebody to handle the calls, the leaks and the label talks." },
      { id: "publicist", n: "Publicist", q: 5, pay: 8000, ic: "diamond", lead: "Your promos land cheaper and your hype stops dying overnight." },
    ],
    CREW_NAMES = ["Darius", "Mina", "Otis", "Priya", "Kofi", "Selma", "Nico", "Rae", "Ivo", "Tasha", "Emil", "Juno", "Bram", "Alma", "Kwame", "Lena", "Rafa", "Suri", "Malik", "Esme"],
    STAGE_A = ["Lil", "Yung", "King", "Queen", "DJ", "Baby", "Young", "Big", "Saint", "Juno", "Nova", "Ace", "Rico", "Vera", "Sasha", "Kai", "Milo", "Rae"],
    STAGE_B = ["Echo", "Vex", "Riot", "Luna", "Venom", "Blaze", "Rey", "Dior", "June", "Wave", "Sin", "Gold", "Frost", "Nova", "Rose", "Sky"],
    inMoney = (n) => (n ? localPrice(S(n)) : 0),
    esc = (s) =>
      String(s == null ? "" : s)
        .replace(/[<>"&]/g, "")
        .trim(),
    ensureArt = () => {
      const a = state.art;
      if (Array.isArray(a)) return null; // another mod (auctions) is using state.art for paintings: do not clobber it
      return a && "object" == typeof a ? a : (state.art = { fameOn: !1, fame: 0 });
    },
    addFame = (n) => {
      const a = ensureArt();
      if (!a || !(n > 0)) return;
      (a.fame = Math.max(0, Math.min(100, num(a.fame) + n))),
        !a.fameOn &&
          (a.fame >= 2 || num(p().pop) >= 10) &&
          ((a.fameOn = !0), say("People are starting to recognize me from my music."));
    },
    addHype = (n) => {
      const m = p();
      m.hype = Math.max(0, Math.min(100, num(m.hype) + n));
    },
    addPop = (n) => {
      const m = p();
      m.pop = clamp(Math.round(num(m.pop) + n));
    },
    studioOf = (i) => IN_STUDIOS[clamp(Math.round(num(i)), 0, IN_STUDIOS.length - 1)],
    sessionFee = (st, tracks, single) => inMoney(Math.round(st.cost * (single ? 1 : 1 + tracks / 12))),
    studioBeat = (st) => `${pickR(st.prod)} · ${pickR(st.beats)}`,
    crewOf = (id) => IN_CREW.find((c) => c.id === id),
    crewHas = (id) => p().crew.some((c) => c.id === id),
    crewQ = () => p().crew.reduce((n, c) => n + num(crewOf(c.id) && crewOf(c.id).q), 0),
    crewPay = () => p().crew.reduce((n, c) => n + num(c.pay), 0),
    awardArt = (n) => AWARD_ART[n] || "gold",
    studioQuality = (st, sub) => {
      const m = p(),
        aff = st.sp.indexOf("Any") >= 0 || st.sp.indexOf(m.genre) >= 0 || st.sp.indexOf(sub) >= 0 ? 6 : -3;
      return clamp(
        Math.round(
          0.5 * y(m.role) + 35 + st.q + aff + rint(-8, 10) + Math.min(10, Math.round(num(m.hype) / 10)) + (f() ? 5 : 0) + num(m.boost) + Math.min(40, crewQ()),
        ),
        5,
        100,
      );
    },
    randomStage = () => `${pickR(STAGE_A)} ${pickR(STAGE_B)}`;

  function startIndependent(role, genre, stage) {
    const m = p();
    stage = esc(stage) || randomStage();
    genre = t[genre] ? genre : "Pop";
    role = role || "Singer";
    Object.assign(m, {
      indep: !0,
      signed: !1,
      label: null,
      band: null,
      role,
      genre,
      stageName: stage,
      royalty: 0,
      term: 0,
      start: state.age,
      pop: Math.max(num(m.pop), rint(1, 4)),
    });
    state.job && !state.job.music && (say(`I quit my job as ${state.job.t} to pursue music.`), (state.job = null));
    state.job = {
      t: stage,
      c: "Independent",
      emp: "Independent",
      pay: 0,
      music: !0,
      perf: 100,
      icon: e(t[genre].ico),
      tenure: 0,
    };
    ensureArt(), $(), renderStats(), g("SFX_MusicProducer_LabelSign");
    say(`I started my independent music career as ${stage}.`);
    notice(
      "Independent",
      `You are now an independent ${genre.toLowerCase()} artist. No label, no royalties: every dollar is yours, but the studio, the ads and the tours come out of your pocket.`,
      null,
      !0,
    );
  }

  function openIndependent() {
    screen.classList.remove("open");
    const roles = B,
      genres = Object.keys(t);
    P(
      e("mic-studio"),
      "Go Independent",
      `<div class="lead">Skip the labels and build your own career.<br><br><b>The good:</b> no release schedule, no royalties, creative control and every dollar of profit is yours.<br><b>The bad:</b> you pay for studio time, advertising, radio pitches and your own tours.</div>${L("indRole", "Pick your career type:", roles, Math.max(0, roles.indexOf("Singer")))}${L("indGenre", "Pick your genre:", genres, Math.max(0, genres.indexOf("Pop")))}<label class="hr-lab">Stage Name:</label><input class="pet-name-in" id="indStage" maxlength="24" value="${esc(randomStage())}"><div class="bb-rand" id="indStageRand">Pick Random</div>`,
      () => {
        const role = roles[+document.getElementById("indRole").value],
          genre = genres[+document.getElementById("indGenre").value],
          stage = esc(document.getElementById("indStage").value);
        screen.classList.remove("open");
        setTimeout(() => startIndependent(role, genre, stage), 80);
      },
      "Start your career",
    );
    const rnd = document.getElementById("indStageRand");
    rnd && (rnd.onclick = () => (document.getElementById("indStage").value = randomStage()));
  }

  function indRecord(single, preset, feat) {
    const m = p(),
      subs = (t[m.genre] || t.Pop).subs,
      cover = m.band ? [...s, ...r] : r,
      stIdx = Number.isInteger(preset) ? preset : Math.min(IN_STUDIOS.length - 1, Math.max(0, num(m.studio))),
      title = c();
    screen.classList.remove("open");
    P(
      e("mic-studio"),
      single ? "Independent Single" : "Independent Album",
      `<div class="lead">This one is all yours. You pay the studio and keep 100% of the profits.</div>${feat ? `<div class="lead">Featuring <b>${feat.name}</b> (${feat.label.toLowerCase()}): they bring reach, but they take <b>${Math.round(collabShare(feat.talent) * 100)}%</b> of the gross.</div>` : ""}<label class="hr-lab">Title:</label><input class="pet-name-in" id="indTitle" maxlength="30" value="${esc(title)}"><div class="bb-rand" id="indRand">Pick Random</div>${L("indSub", "Pick your subgenre:", subs)}${single ? "" : L("indTracks", "Number of tracks:", Array.from({ length: 9 }, (x, i) => `${i + 8} Tracks`), 3) + L("indCover", "Pick your cover art:", cover)}${L("indStudio", "Pick a studio (paid upfront):", IN_STUDIOS.map((st) => `${st.n} — ${st.cost ? usd(inMoney(st.cost)) : "free"} · quality ${st.q >= 0 ? "+" : ""}${st.q}`), stIdx)}<div class="lead" id="indFee" style="margin-top:8px"></div>`,
      () => {
        const name = esc(document.getElementById("indTitle").value) || title,
          sub = subs[+document.getElementById("indSub").value],
          tracks = single ? 1 : +document.getElementById("indTracks").value + 8,
          coverArt = single ? null : cover[+document.getElementById("indCover").value],
          st = studioOf(+document.getElementById("indStudio").value),
          fee = sessionFee(st, tracks, single);
        if (state.money < fee) {
          say("I couldn't afford the studio time.");
          return notice("Can't afford it", `This session costs ${usd(fee)} and you only have ${usd(state.money)}.`, null, !0), !1;
        }
        (state.money -= fee),
          (m.studio = IN_STUDIOS.indexOf(st)),
          (m.pop = clamp(num(m.pop) + (chance(0.25) ? 1 : 0)));
        const q = clamp(studioQuality(st, sub) + (feat ? Math.round(num(feat.talent) / 10) : 0), 5, 100),
          beat = studioBeat(st),
          rec = {
            title: name,
            single: !!single,
            sub,
            genre: m.genre,
            tracks,
            cover: coverArt,
            lead: single ? `${pickR(i)} ${pickR(l)}` : `${pickR(i)} ${pickR(l)}`,
            studio: st.n,
            studioId: IN_STUDIOS.indexOf(st),
            beat,
            quality: q,
            age: state.age,
            songs: single ? null : Array.from({ length: tracks }, () => c()),
            sessionFee: fee,
            feat: feat ? feat.name : null,
            featLabel: feat ? feat.label : null,
            featTalent: feat ? num(feat.talent) : 0,
            featShare: feat ? collabShare(feat.talent) : 0,
          };
        (m.boost = Math.max(0, num(m.boost) - 25)), addHype(feat ? 6 : 2), feat && addFame(1), renderStats(), g("SFX_MusicProducer_NewTrack_Collab");
        setTimeout(() => vaultOrDrop(rec), 80);
      },
      single ? "Record it" : "Make the album",
    );
    const rnd = document.getElementById("indRand"),
      sel = document.getElementById("indStudio"),
      feeEl = document.getElementById("indFee"),
      upd = () => {
        const tracks = single ? 1 : +document.getElementById("indTracks").value + 8,
          st = studioOf(+document.getElementById("indStudio").value);
        feeEl.innerHTML = `Session cost: <b>${st.cost ? usd(sessionFee(st, tracks, single)) : "Free"}</b> · Studio Quality <b>${st.q >= 0 ? "+" : ""}${st.q}%</b>${crewQ() ? ` · Crew <b>+${Math.min(40, crewQ())}%</b>` : ""}${feat ? ` · Feature <b>+${Math.round(num(feat.talent) / 10)}%</b>` : ""} · Beats: <b>${st.beats.join(", ")}</b>`;
      };
    rnd && (rnd.onclick = () => (document.getElementById("indTitle").value = c()));
    sel && (sel.onchange = upd);
    if (!single) document.getElementById("indTracks").onchange = upd;
    upd();
  }

  function vaultOrDrop(rec) {
    jCard({
      tag: "Music",
      iconSrc: e(rec.single ? "disc" : "album"),
      title: rec.title,
      close: !0,
      lead: `You finished "${rec.title}" at ${rec.studio}.<br><br>Do you drop it now or keep it in the vault?`,
      rows: [
        ["Type", rec.single ? "Single" : `Album (${rec.tracks} tracks)`],
        ["Studio", rec.studio],
        ["Beat", rec.beat],
        ["Quality", `${rec.quality}%`],
        ["Session Cost", usd(rec.sessionFee)],
      ],
      choices: [
        ["Release it now", () => setTimeout(() => dropRec(rec), 60)],
        [
          "Keep it unreleased",
          () => {
            p().unreleased.unshift(rec);
            say(`I kept "${rec.title}" unreleased for now.`);
            notice("In the vault", `"${rec.title}" is sitting in your vault. You can release it, tease a snippet or lose it to a leak.`, null, !0);
          },
        ],
      ],
    });
  }

  function dropRec(rec) {
    const m = p(),
      q = clamp(Math.round(num(rec.quality))),
      pop = num(m.pop),
      genre = t[rec.genre] ? rec.genre : m.genre || "Pop",
      sub = rec.sub || (t[genre] ? t[genre].subs[0] : "Pop"),
      copies = Math.max(
        250,
        Math.round(
          (rec.single ? 4500 : 15e3) *
            (1 + pop / 10) ** 2.2 *
            (0.35 + q / 90) *
            (1 + num(m.hype) / 70) *
            (0.25 + Math.random() * 1.8) *
            (rec.feat ? 1.18 + num(rec.featTalent) / 300 : 1) *
            (chance(0.06) ? rint(3, 8) : 1),
        ),
      ),
      gross = localPrice(Math.round(copies * (rec.single ? 1.3 : 15))),
      cert = U(copies),
      rel = {
        title: rec.title,
        single: rec.single,
        sub,
        genre,
        tracks: rec.tracks,
        cover: rec.cover,
        lead: rec.lead,
        studio: rec.studio,
        beat: rec.beat,
        quality: q,
        songs: rec.songs || null,
        copies,
        gross,
        net: gross,
        mine: rec.feat ? Math.round(gross * (1 - num(rec.featShare, 0.3))) : gross,
        cert: cert && cert[1],
        age: state.age,
        band: m.band ? m.band.name : null,
        flop: q < 40 && chance(0.5),
        indep: !0,
        feat: rec.feat || null,
        featLabel: rec.featLabel || null,
        featShare: rec.feat ? num(rec.featShare, 0.3) : 0,
        featTalent: rec.feat ? num(rec.featTalent) : 0,
      };
    m.releases.push(rel),
      (m.released = state.age),
      (m.pop = clamp(Math.round(pop + (rel.flop ? -rint(2, 5) : Math.round(2 * Math.log10(copies) - 5 + (cert ? 5 : 0))))));
    (m.hype = Math.max(0, Math.round(num(m.hype) * 0.55))),
      v(Math.round(copies * (0.02 + 0.06 * Math.random()))),
      addFame(Math.round(q / 14) + (cert ? 4 : 0) + (copies >= 2e5 ? 3 : 0) + (rec.feat ? 2 : 0)),
      (state.money += rel.mine),
      $(),
      renderStats(),
      g(cert ? "SFX_MusicProducer_BangerAward" : "SFX_MusicProducer_NewTrack_Collab");
    say(
      `I independently released ${w(rec.single ? "single" : "album")} ${rec.single ? "single" : "album"} called "${rec.title}"${rec.feat ? ` featuring ${rec.feat}` : ""}. It sold ${copies.toLocaleString("en-US")} copies${cert ? ` and went ${cert[1].toLowerCase()}` : ""}.`,
    ),
      X(rel);
  }

  function openStudios() {
    const m = p();
    (sTitle.textContent = "STUDIOS"),
      (sSub.style.display = "none"),
      (sBack.innerHTML = BACK_ICON),
      (sBack.onclick = D),
      (sList.innerHTML = IN_STUDIOS.map(
        (st, i) =>
          `<div class="row" data-st="${i}"><img src="${e(st.f)}" style="object-fit:cover"><div class="t"><b>${st.n}${i === num(m.studio) ? " <em>(your spot)</em>" : ""}</b><span>${st.cost ? usd(inMoney(st.cost)) : "Free"} · Quality ${st.q >= 0 ? "+" : ""}${st.q}%</span><span>${st.beats.slice(0, 2).join(" / ")}</span></div>${DOTS}</div>`,
      ).join("")),
      sList.querySelectorAll("[data-st]").forEach((el) => (el.onclick = () => studioCard(+el.dataset.st))),
      (sList.scrollTop = 0),
      screen.classList.add("open");
  }

  function studioCard(i) {
    const st = studioOf(i);
    jCard({
      tag: "Studio",
      iconSrc: e("mic-studio"),
      title: st.n,
      close: !0,
      rows: [
        ["Session Price", st.cost ? usd(inMoney(st.cost)) : "Free"],
        ["Recording Quality", `${st.q >= 0 ? "+" : ""}${st.q}%`],
        ["Beat Styles", st.beats.join(", ")],
        ["Specialties", st.sp.join(", ")],
      ],
      lead:
        st.q < 0
          ? "Cheap and rough. The fans can hear the room, but it costs almost nothing."
          : st.q < 10
            ? "A decent room with honest gear. Good enough to build a following."
            : st.q < 20
              ? "Warm acoustics and a real engineer. Your records will sound expensive."
              : "The flagship room. Major-label sound without the major label.",
      choices: [
        ["Record a single here", () => setTimeout(() => indRecord(!0, i), 60)],
        ["Record an album here", () => setTimeout(() => indRecord(!1, i), 60)],
        ["Back to studios", () => setTimeout(openStudios, 60)],
      ],
    });
  }

  function openRadio() {
    const m = p(),
      rels = m.releases.slice().reverse();
    if (!rels.length)
      return notice("No music yet", "You need a released song before radio will play it.", null, !0);
    screen.classList.remove("open");
    P(
      e("mic-studio"),
      "Radio",
      `<div class="lead">Pay a station to spin your record. It is not guaranteed airplay, but a hit can blow your fame up.</div>${L("indRel", "Pick a release:", rels.map((r) => `${r.title} (${r.single ? "Single" : "Album"}) · quality ${num(r.quality)}%`))}${L("indStation", "Pick a station:", IN_RADIO.map((s) => `${s.n} — ${usd(inMoney(s.cost))}`))}`,
      () => {
        const rel = rels[+document.getElementById("indRel").value],
          st = IN_RADIO[+document.getElementById("indStation").value],
          fee = inMoney(st.cost);
        if (state.money < fee) {
          notice("Can't afford it", `That pitch costs ${usd(fee)}.`, null, !0);
          return !1;
        }
        (state.money -= fee), renderStats();
        const q = num(rel.quality),
          ok = chance(clamp(0.06 + q / 260 + num(m.pop) / 240 + ee() / 280 + st.reach * 0.035, 0.02, 0.8));
        ok
          ? (addPop(rint(2, 4) + st.reach),
            addFame(rint(1, 3) + Math.ceil(st.reach / 2)),
            addHype(rint(3, 8) * st.reach),
            v(rint(5000, 30000) * st.reach),
            say(`"${rel.title}" got picked up by ${st.n}.`),
            notice(
              "On the air",
              `${st.n} added "${rel.title}" to rotation. Your popularity and fame went up.`,
              null,
              !0,
            ))
          : (addHype(-1), say(`${st.n} passed on "${rel.title}".`), notice("No airplay", `${st.n} took your money and passed on the record.`, null, !0));
      },
      "Send it",
    );
  }

  function openPromo() {
    const m = p();
    screen.classList.remove("open");
    P(
      e("diamond"),
      "Promote",
      `<div class="lead">Nobody finds your music if you don't push it. Your hype (${Math.round(num(m.hype))}%) boosts the next release.${crewHas("publicist") ? " Your publicist gets you 15% off every campaign." : ""}</div>${L("indPromo", "Pick a campaign:", IN_PROMO.map((p) => `${p.n} — ${p.cost ? usd(inMoney(p.cost)) : "free"}`))}`,
      () => {
        const p2 = IN_PROMO[+document.getElementById("indPromo").value],
          fee = inMoney(p2.cost * (crewHas("publicist") ? 0.85 : 1));
        if (state.money < fee) {
          notice("Can't afford it", `That campaign costs ${usd(fee)}.`, null, !0);
          return !1;
        }
        (state.money -= fee),
          addHype(rint(p2.hype[0], p2.hype[1])),
          addPop(rint(p2.pop[0], p2.pop[1])),
          addFame(rint(p2.fame[0], p2.fame[1])),
          v(rint(p2.fans[0], p2.fans[1])),
          renderStats(),
          say(`I ran a promo campaign: ${p2.n}.`),
          notice(
            "Promo run",
            `${p2.n} finished. Hype is at ${Math.round(num(m.hype))}% and your followers grew.`,
            null,
            !0,
          );
      },
      "Launch it",
    );
  }

  function openCrew() {
    const m = p(),
      hired = m.crew.filter((c) => crewOf(c.id));
    (sTitle.textContent = "CREW"),
      (sSub.style.display = "none"),
      (sBack.innerHTML = BACK_ICON),
      (sBack.onclick = D),
      (sList.innerHTML =
        `<div class="row" data-crewinfo="1"><img src="${e("solo")}"><div class="t"><b>${hired.length}/${IN_CREW.length} on your team</b><span>+${crewQ()}% recording quality · ${usd(crewPay())} a year in salaries</span></div></div>` +
        IN_CREW.map((c) => {
          const w2 = m.crew.find((x) => x.id === c.id);
          return `<div class="row" data-crew="${c.id}"><img src="${e(c.ic)}"><div class="t"><b>${w2 ? `${esc(w2.name)} <em>(${c.n})</em>` : c.n}</b><span>${w2 ? `+${c.q}% quality · ${usd(w2.pay)}/year` : `${usd(inMoney(c.pay * 2))} to sign · ${usd(inMoney(c.pay))}/year`}</span><span>${c.lead}</span></div>${DOTS}</div>`;
        }).join("")),
      sList.querySelectorAll("[data-crew]").forEach((el) => (el.onclick = () => crewCard(el.dataset.crew))),
      (sList.scrollTop = 0),
      screen.classList.add("open");
  }

  function crewCard(id) {
    const m = p(),
      c = crewOf(id),
      w2 = m.crew.find((x) => x.id === id);
    if (!c) return openCrew();
    if (w2)
      return jCard({
        tag: "Crew",
        iconSrc: e(c.ic),
        title: `${w2.name} — ${c.n}`,
        close: !0,
        lead: c.lead,
        rows: [
          ["Role", c.n],
          ["Quality Bonus", `+${c.q}%`],
          ["Salary", `${usd(w2.pay)}/year`],
          ["Hired", `Age ${w2.since}`],
        ],
        choices: [
          ["Let them go", () => setTimeout(() => fireCrew(id), 60)],
          ["Back", () => setTimeout(openCrew, 60)],
        ],
      });
    const fee = inMoney(c.pay * 2),
      salary = inMoney(c.pay);
    jCard({
      tag: "Crew",
      iconSrc: e(c.ic),
      title: `Hire a ${c.n}`,
      close: !0,
      lead: c.lead,
      rows: [
        ["Signing Fee", usd(fee)],
        ["Salary", `${usd(salary)}/year`],
        ["Quality Bonus", `+${c.q}%`],
        ["Your Bank", usd(state.money)],
      ],
      choices: [
        [
          "Hire them",
          () => {
            if (state.money < fee) return notice("Can't afford it", `${c.n}s with this resume want ${usd(fee)} up front.`, null, !0), !1;
            (state.money -= fee), hireCrew(id, salary), renderStats(), g("SFX_MusicProducer_LabelSign");
          },
        ],
        ["Back", () => setTimeout(openCrew, 60)],
      ],
    });
  }

  function hireCrew(id, salary) {
    const m = p(),
      c = crewOf(id);
    if (!c || m.crew.some((x) => x.id === id)) return;
    const used = new Set(m.crew.map((x) => x.name)),
      name = pickR(CREW_NAMES.filter((n2) => !used.has(n2)).length ? CREW_NAMES.filter((n2) => !used.has(n2)) : CREW_NAMES);
    m.crew.push({ id, name, pay: num(salary, inMoney(c.pay)), since: state.age });
    say(`I hired ${name} as my ${c.n.toLowerCase()}.`);
    notice(
      "New crew member",
      `${name} is your new ${c.n.toLowerCase()}. Your crew now adds <b>+${crewQ()}%</b> to every recording, but salaries cost ${usd(crewPay())} a year.`,
      null,
      !0,
    );
    setTimeout(openCrew, 60);
  }

  function fireCrew(id) {
    const m = p(),
      w2 = m.crew.find((x) => x.id === id);
    if (!w2) return openCrew();
    m.crew = m.crew.filter((x) => x.id !== id);
    say(`I let ${w2.name} go.`);
    setTimeout(openCrew, 60);
  }

  function collabTalent(name) {
    let h = 7;
    for (const ch of String(name || "x")) h = (h * 31 + ch.charCodeAt(0)) % 9973;
    return 35 + (h % 61);
  }

  function collabShare(talent) {
    return Math.min(0.45, Math.max(0.2, 0.15 + num(talent, 50) / 500));
  }

  function collabPartners() {
    const m = p(),
      out = [],
      seen = new Set(),
      add = (name, label) => {
        const clean = esc(name);
        if (!clean || seen.has(clean.toLowerCase())) return;
        seen.add(clean.toLowerCase());
        out.push({ name: clean, label, talent: collabTalent(clean) });
      };
    m.crew.forEach((c) => add(c.name, crewOf(c.id) ? crewOf(c.id).n : "Crew"));
    (state.friends || []).forEach((p2) => p2 && p2.first && !p2.dead && add(`${p2.first} ${p2.last || ""}`, "Friend"));
    (state.family || []).forEach((p2) => {
      if (!p2 || !p2.first || p2.dead) return;
      const age = typeof relAge === "function" ? relAge(p2) : 30;
      if (age >= 14) add(`${p2.first} ${p2.last || ""}`, String(p2.kind || "Family").replace(/^./, (c) => c.toUpperCase()));
    });
    if (state.spouse && state.spouse.first) add(`${state.spouse.first} ${state.spouse.last || ""}`, "Spouse");
    return out;
  }

  function openCollab() {
    const mates = collabPartners();
    if (!mates.length)
      return notice(
        "Nobody to work with",
        "Collabs are with people in your life: hire a crew, make friends or use your family. You don't have anyone around yet.",
        null,
        !0,
      );
    (sTitle.textContent = "COLLABS"),
      (sSub.style.display = "none"),
      (sBack.innerHTML = BACK_ICON),
      (sBack.onclick = D),
      (sList.innerHTML = mates
        .map(
          (p2, i) =>
            `<div class="row" data-collab="${i}"><img src="${e(i < p().crew.length ? "solo" : "band")}"><div class="t"><b>${p2.name}</b><span>${p2.label} · talent ${p2.talent}% · they take ${Math.round(collabShare(p2.talent) * 100)}%</span></div>${DOTS}</div>`,
        )
        .join("")),
      sList.querySelectorAll("[data-collab]").forEach((el) => (el.onclick = () => collabCard(mates[+el.dataset.collab]))),
      (sList.scrollTop = 0),
      screen.classList.add("open");
  }

  function collabCard(feat) {
    if (!feat) return openCollab();
    jCard({
      tag: "Collab",
      iconSrc: e("band"),
      title: feat.name,
      close: !0,
      lead: `${feat.name} (${feat.label.toLowerCase()}) will jump on your next record. Their name brings reach, but they take a cut of everything it earns and they might get the credit.`,
      rows: [
        ["Partner", feat.name],
        ["Their Talent", `${feat.talent}%`],
        ["Quality Bonus", `+${Math.round(feat.talent / 10)}%`],
        ["Their Cut", `${Math.round(collabShare(feat.talent) * 100)}% of the gross`],
      ],
      choices: [
        ["Record a single together", () => setTimeout(() => indRecord(!0, null, feat), 60)],
        ["Record an album together", () => setTimeout(() => indRecord(!1, null, feat), 60)],
        ["Back", () => setTimeout(openCollab, 60)],
      ],
    });
  }

  function chartYear() {
    const b = num(state.birthYear, 0);
    return b ? Math.round(b + num(state.age)) : 2026;
  }

  function chartRng(seed) {
    let a = 2166136261;
    for (const ch of String(seed)) (a ^= ch.charCodeAt(0)), (a = Math.imul(a, 16777619));
    return () => {
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      return (t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t), ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function chartPlayer() {
    const m = p(),
      age = num(state.age),
      rel = m.releases
        .filter((r) => num(r.age) >= age - 1 && num(r.age) <= age)
        .sort((a, b) => num(b.copies) - num(a.copies))[0];
    if (!rel) return null;
    return {
      name: m.stageName || (state.job && state.job.t) || "You",
      title: rel.title,
      copies: num(rel.copies),
      rel,
      npc: !1,
      score: clamp(
        num(rel.quality, 50) * 0.4 + Math.log10(Math.max(1e3, num(rel.copies))) * 16 - 12 + ee() / 10 + num(m.hype) / 12,
        0,
        130,
      ),
    };
  }

  function chartBoard(year) {
    year = Math.round(num(year, chartYear()));
    const A = window.ARTISTS || {},
      rnd = chartRng("chart:" + year),
      base = { 1: 86, 2: 74, 3: 60, 4: 46 },
      pool = [];
    for (const k in A) {
      const a = A[k];
      if (!a || !a.name) continue;
      const gap = year - num(a.year, year);
      if (gap < 0 || gap > 8) continue;
      pool.push({ name: a.name, npc: !0, score: (base[a.tier] || 50) + rnd() * 14 - gap * 2.2 });
    }
    if (pool.length < 10)
      for (const k in A) {
        const a = A[k];
        if (!a || !a.name || pool.some((x) => x.name === a.name)) continue;
        pool.push({ name: a.name, npc: !0, score: (base[a.tier] || 50) + rnd() * 12 });
        if (pool.length >= 40) break;
      }
    const own = chartPlayer();
    if (own) pool.push(own);
    pool.sort((a, b) => b.score - a.score);
    const rows = pool.slice(0, 10).map((r, i) => Object.assign(r, { pos: i + 1 }));
    const row = rows.find((r) => !r.npc) || null;
    return { year, rows, own: row, ownPos: row ? row.pos : 0 };
  }

  function updateChart() {
    const m = p(),
      b = chartBoard();
    if (!b.own) return null;
    const rel = b.own.rel;
    rel.peak = Math.min(num(rel.peak, 999), b.own.pos);
    const peak = Math.min(num(m.chart && m.chart.peak, 999), b.own.pos);
    m.chart = { year: b.year, pos: b.own.pos, title: rel.title, peak };
    return b.own;
  }

  function chartEntry(row) {
    if (!row) return;
    jCard({
      tag: `Chart · ${chartYear()}`,
      iconSrc: e(row.npc ? "disc" : "solo"),
      title: `#${row.pos} ${row.name}`,
      close: !0,
      rows: row.npc
        ? [["Artist", row.name], ["Position", `#${row.pos}`], ["Streams", Math.round(row.score * row.score * 5e3).toLocaleString("en-US")]]
        : [["Artist", row.name], ["Position", `#${row.pos}`], ["Song", row.title], ["Copies", num(row.copies).toLocaleString("en-US")], ["Peak", `#${num(row.rel && row.rel.peak, row.pos)}`]],
    });
  }

  function openCharts() {
    const b = chartBoard(),
      m = p();
    (sTitle.textContent = "CHARTS"),
      (sSub.style.display = "none"),
      (sBack.innerHTML = BACK_ICON),
      (sBack.onclick = D),
      (sList.innerHTML =
        `<div class="row" data-chinfo="1"><img src="${e("gold")}"><div class="t"><b>Billboard ${b.year}</b><span>${b.ownPos ? `You are #${b.ownPos} this year` : "You are not on the chart this year"}${m.chart && m.chart.peak ? ` · career peak #${m.chart.peak}` : ""}</span></div></div>` +
        b.rows
          .map(
            (r) =>
              `<div class="row" data-chart="${r.pos}"><img src="${e(r.npc ? "disc" : "solo")}"><div class="t"><b>#${r.pos} ${esc(r.name)}${r.npc ? "" : " <em>(you)</em>"}</b><span>${r.npc ? `${Math.round(r.score * r.score * 5e3).toLocaleString("en-US")} streams` : `"${esc(r.title)}" · ${num(r.copies).toLocaleString("en-US")} copies`}</span></div>${DOTS}</div>`,
          )
          .join("")),
      sList.querySelectorAll("[data-chart]").forEach((el) => (el.onclick = () => chartEntry(b.rows[+el.dataset.chart - 1]))),
      (sList.scrollTop = 0),
      screen.classList.add("open");
  }

  function openVault() {
    const m = p();
    if (!m.unreleased.length)
      return notice("Vault empty", "Record something and choose \"Keep it unreleased\" to fill your vault.", null, !0);
    (sTitle.textContent = "UNRELEASED"),
      (sSub.style.display = "none"),
      (sBack.innerHTML = BACK_ICON),
      (sBack.onclick = D),
      (sList.innerHTML = m.unreleased
        .map(
          (r, i) =>
            `<div class="row" data-vault="${i}"><img src="${e("notes")}"><div class="t"><b>${r.title} <em>(${r.single ? "Single" : "Album"})</em></b><span>${r.studio} · quality ${num(r.quality)}% · ${r.beat}</span></div>${DOTS}</div>`,
        )
        .join("")),
      sList.querySelectorAll("[data-vault]").forEach((el) => (el.onclick = () => vaultCard(+el.dataset.vault))),
      (sList.scrollTop = 0),
      screen.classList.add("open");
  }

  function vaultCard(i) {
    const m = p(),
      r = m.unreleased[i];
    if (!r) return openVault();
    jCard({
      tag: "Vault",
      iconSrc: e("notes"),
      title: r.title,
      close: !0,
      lead: `Recorded at ${r.studio} at age ${r.age}. Nobody has heard it yet unless it leaks.`,
      rows: [
        ["Type", r.single ? "Single" : `Album (${r.tracks} tracks)`],
        ["Quality", `${num(r.quality)}%`],
        ["Beat", r.beat],
        ...(r.feat ? [["Feature", `${r.feat} · ${Math.round(num(r.featShare, 0.3) * 100)}% cut`]] : []),
      ],
      choices: [
        ["Drop a snippet", () => setTimeout(() => snippet(i), 60)],
        [
          "Release it",
          () => {
            const fee = inMoney(r.single ? 150 : 900);
            if (state.money < fee) return notice("Can't afford it", `Distribution and artwork cost ${usd(fee)}.`, null, !0);
            (state.money -= fee), m.unreleased.splice(i, 1), renderStats(), setTimeout(() => dropRec(r), 60);
          },
        ],
        ["Delete it", () => (m.unreleased.splice(i, 1), say(`I deleted "${r.title}".`), openVault())],
        ["Back", () => setTimeout(openVault, 60)],
      ],
    });
  }

  function snippet(i) {
    const m = p(),
      r = m.unreleased[i];
    if (!r) return openVault();
    const gain = rint(4, 10) + Math.round(y(m.role) / 30);
    addHype(gain), v(rint(1000, 12000) * Math.max(1, Math.round(num(m.pop) / 8))), addFame(chance(0.3) ? 1 : 0);
    say(`I teased a snippet of "${r.title}" and the internet reacted.`);
    if (chance(0.12)) {
      m.unreleased.splice(i, 1);
      return notice(
        "Snippet leak",
        `A hacker grabbed the full file after your snippet went around. "${r.title}" leaked before you could release it.`,
        null,
        !0,
      );
    }
    notice("Hype rising", `Your snippet of "${r.title}" added ${gain}% hype. Hype makes the next release sell more.`, null, !0);
  }

  function openStageName() {
    const m = p();
    screen.classList.remove("open");
    P(
      "identity/name.png",
      "Stage Name",
      `<div class="lead">Nobody is going to stream an artist named after their government name. Pick a stage name.</div><label class="hr-lab">Stage Name:</label><input class="pet-name-in" id="indStage2" maxlength="24" value="${esc(m.stageName || randomStage())}"><div class="bb-rand" id="indStage2Rand">Pick Random</div>`,
      () => {
        const name = esc(document.getElementById("indStage2").value);
        if (!name) return !1;
        (m.stageName = name), state.job && (state.job.t = name), renderStats();
        say(`I changed my stage name to ${name}.`);
        notice("New stage name", `You are now known as ${name}.`, null, !0);
      },
      "Change it",
    );
    const rnd = document.getElementById("indStage2Rand");
    rnd && (rnd.onclick = () => (document.getElementById("indStage2").value = randomStage()));
  }

  function openRenamePicker() {
    const m = p(),
      albums = m.releases.map((r, i) => [r, i]).filter(([r]) => r.songs && r.songs.length);
    if (!albums.length)
      return notice("No albums", "Only albums have track lists. Record an album first.", null, !0);
    (sTitle.textContent = "RENAME SONGS"),
      (sSub.style.display = "none"),
      (sBack.innerHTML = BACK_ICON),
      (sBack.onclick = D),
      (sList.innerHTML = albums
        .map(
          ([r, i]) =>
            `<div class="row" data-album="${i}"><img src="${e(r.cert ? (V.find((x) => x[1] === r.cert) || [0, "", "album"])[2] : "album")}"><div class="t"><b>${r.title}</b><span>${r.songs.length} tracks · age ${r.age}</span></div>${DOTS}</div>`,
        )
        .join("")),
      sList.querySelectorAll("[data-album]").forEach((el) => (el.onclick = () => renameSongs(m.releases[+el.dataset.album]))),
      (sList.scrollTop = 0),
      screen.classList.add("open");
  }

  function renameSongs(rel) {
    if (!rel || !rel.songs || !rel.songs.length) return openRenamePicker();
    screen.classList.remove("open");
    P(
      e("album"),
      "Rename Songs",
      `<div class="lead">Change the track list of "${rel.title}". The first track is the lead-off.</div>${rel.songs
        .map((s, i) => `<label class="hr-lab">Track ${i + 1}:</label><input class="pet-name-in" id="indTrack${i}" maxlength="34" value="${esc(s)}">`)
        .join("")}`,
      () => {
        rel.songs = rel.songs.map((s, i) => {
          const v2 = esc((document.getElementById("indTrack" + i) || {}).value);
          return v2 || s;
        });
        rel.lead = rel.songs[0];
        say(`I renamed the tracks on "${rel.title}".`);
        notice("Track list updated", `Your album "${rel.title}" has a new track list.`, null, !0);
      },
      "Save names",
    );
  }

  function indTour() {
    const m = p();
    if (m.toured === state.age)
      return notice("Take a break", "You've already toured this year.", null, !0);
    const countries = ne(Object.keys(COUNTRIES).filter((c) => c !== state.country)).slice(0, rint(3, 6)),
      stops = [state.country, ...countries].map((c) => {
        const cities = (window.CITIES && CITIES[c]) || [COUNTRIES[c][1]];
        return [c, ne(cities).slice(0, Math.min(cities.length, rint(1, 2)))];
      }),
      cities = stops.reduce((n, [, cs]) => n + cs.length, 0),
      text = stops.map(([c, cs]) => `${cs.join(", ")} (${COUNTRIES[c][0]})`).join("; "),
      gross = Math.round(
        cities * rint(7000, 20000) * (0.6 + num(m.pop) / 28) * (1 + y(m.role) / 220) * (1 + num(m.hype) / 150),
      ),
      cost = localPrice(Math.round(gross * 0.4));
    screen.classList.remove("open");
    P(
      e("tour"),
      "Self-Funded Tour",
      `<div class="lead">No label is paying for this one. You put the money up and keep what comes back.</div><table class="jc"><tbody><tr><td><b>Cities:</b> ${text}</td></tr><tr><td><b>Upfront Cost:</b> ${usd(cost)}</td></tr><tr><td><b>Projected Gross:</b> ${usd(localPrice(gross))}</td></tr><tr><td><b>Your Bank:</b> ${usd(state.money)}</td></tr></tbody></table>`,
      () => {
        if (state.money < cost) {
          notice("Tour cancelled", `You needed ${usd(cost)} upfront and you didn't have it.`, null, !0);
          return !1;
        }
        (state.money -= cost),
          (m.toured = state.age),
          (m.pop = clamp(num(m.pop) + rint(1, 5))),
          addFame(rint(1, 5)),
          addHype(rint(2, 6)),
          v(Math.round(gross * (0.02 + 0.05 * Math.random())));
        const take = localPrice(Math.round(gross * (0.9 + Math.random() * 0.5)));
        (state.money += take), renderStats(), g("SFX_MusicProducer_ClubTakeover");
        say(`I funded my own ${cities}-city tour and brought home ${usd(take)}.`);
        notice(
          "Tour done",
          `You played ${cities} cities across ${stops.length} countries on your own money.<br><br><table class="nt"><tr><td><b>Upfront:</b> ${usd(cost)}</td></tr><tr><td><b>Box Office:</b> ${usd(take)}</td></tr></table>`,
          null,
          !0,
        );
      },
      "Fund the tour",
    );
  }

  function openAwards() {
    const m = p();
    (sTitle.textContent = "AWARDS"),
      (sSub.style.display = "none"),
      (sBack.innerHTML = BACK_ICON),
      (sBack.onclick = D),
      (sList.innerHTML = m.awards.length
        ? m.awards
            .slice()
            .reverse()
            .map(
              (a) =>
                `<div class="row" data-award="1"><img src="${e(awardArt(a.n))}"><div class="t"><b>${a.n}</b><span>${a.cat} · age ${a.year}${a.release ? ` · "${a.release}"` : ""}</span></div>${DOTS}</div>`,
            )
            .join("")
        : '<div class="row" data-award="0"><img src="' +
          e("gold") +
          '"><div class="t"><b>No awards yet</b><span>Keep releasing music and raising your fame.</span></div></div>'),
      (sList.scrollTop = 0),
      screen.classList.add("open");
  }

  function awardsTick() {
    const m = p(),
      art = ensureArt();
    if (m.awardTick === state.age || !m.releases.length || state.age < 18) return;
    m.awardTick = state.age;
    const recent = m.releases.filter((r) => r.age >= state.age - 2);
    if (!recent.length) return;
    const best = recent.reduce((a, b) =>
      (num(b.quality) + (b.cert ? 10 : 0) > num(a.quality) + (a.cert ? 10 : 0) ? b : a),
    );
    const score =
      num(best.quality) +
      num(m.pop) / 2 +
      num(art.fame) / 3 +
      Math.log10(Math.max(1e3, num(best.copies))) * 6 +
      (best.cert ? 8 : 0) +
      Math.min(10, num(m.hype) / 5);
    if (score < 68) return;
    const pool = IN_AWARDS.filter((a) => !m.awards.some((w) => w.n === a.n && w.cat === a.cat && state.age - w.year < 3));
    if (!pool.length) return;
    const noms = pool.sort(() => Math.random() - 0.5).slice(0, rint(1, 3));
    const wins = [];
    for (const a of noms)
      if (chance(clamp((score - 66) / 150, 0.03, 0.6))) {
        m.awards.push({ n: a.n, cat: a.cat, year: state.age, release: best.title });
        wins.push(a);
      }
    if (wins.length) {
      addFame(wins.length * 4), addPop(wins.length * 2), v(rint(20000, 90000) * wins.length), renderStats();
      say(`I won ${wins.map((w) => `${w.n} for ${w.cat}`).join(" and ")}.`);
      notice(
        wins.length > 1 ? "Award sweep" : "Award winner",
        `Your work on "${best.title}" won:<br><br>${wins.map((w) => `<b>${w.n}</b> — ${w.cat}`).join("<br>")}`,
        null,
        !0,
      );
    }
  }

  function signedOfferReady() {
    const m = p();
    return !!m.indep && state.age >= 18 && num(m.pop) >= 20 && (ee() >= 8 || num(m.pop) >= 40 || m.awards.length >= 1);
  }

  function openSignedOffer() {
    const m = p();
    if (!signedOfferReady())
      return notice(
        "Not yet",
        "Labels only come around once your popularity and fame are worth it. Keep releasing and promoting.",
        null,
        !0,
      );
    j({
      role: m.role,
      label: pickR(n),
      band: null,
      genre: m.genre,
      note: "Your independent run is getting attention. A label wants to talk.<br><br>",
    });
  }

  const EV = (id, t2, lead, opts, cool = 5) => ({ id, t: t2, lead, opts, cool });
  const IN_EVENTS = [
    EV("beat_credit", "The Beat Maker Wants Credit", "The producer behind your last beat says the song is as much his as yours. He wants a writing credit and a cut.", [
      { t: "Give him the credit", f: () => { addHype(3), addFame(1), say("I gave the producer his writing credit."); } },
      { t: "Offer to buy the beat out", f: () => { const c = inMoney(1500); if (state.money < c) return notice("Too broke", `He wants ${usd(c)} and you don't have it.`, null, !0); (state.money -= c), addHype(1), say("I bought the beat outright."); } },
    ]),
    EV("double_booked", "Double Booked", "You show up to the studio and another artist is already in your room. The engineer shrugs.", [
      { t: "Wait him out", f: () => { addHype(-1), say("I waited three hours for the room."); } },
      { t: "Book a pricier room", f: () => { const c = inMoney(1200); if (state.money < c) return addHype(1); (state.money -= c), addHype(2), addFame(1), say("I paid for a better room and kept the session."); } },
    ]),
    EV("mic_broke", "The Mic Died", "The studio mic crackles and dies halfway through your best take.", [
      { t: "Fix it out of pocket", f: () => { const c = inMoney(700); if (state.money < c) return addHype(-1); (state.money -= c), addHype(2), say("I paid to fix the mic and finished the session."); } },
      { t: "Use the backup and push through", f: () => { addHype(1), say("I recorded the rest on a backup mic."); } },
    ]),
    EV("free_session", "A Free Session", "An engineer who likes your stuff offers a free night in a good room.", [
      { t: "Take it", f: () => { const m = p(); m.boost = num(m.boost) + 12, addHype(3), say("I took the free session and cut something special."); } },
      { t: "Pass and work alone", f: () => { addHype(1), say("I turned down the free session to keep my sound."); } },
    ]),
    EV("rough_mix_leak", "Rough Mix Leak", "A rough mix of your unreleased track is floating around Discord.", [
      { t: "Lean into it", f: () => { addHype(7), addFame(1), say("I posted the rough mix myself and called it a demo."); } },
      { t: "Pay to scrub it", f: () => { const c = inMoney(900); if (state.money < c) return addHype(2); (state.money -= c), say("I paid a takedown service to scrub the leak."); } },
    ], 6),
    EV("viral_clip", "Your Clip Went Viral", "A 12-second clip of you in the booth is everywhere overnight.", [
      { t: "Post more content", f: () => { addPop(2), addFame(2), v(rint(20000, 90000)), say("I rode the viral clip and posted more studio content."); } },
      { t: "Stay mysterious", f: () => { addHype(6), addFame(1), say("I stayed quiet and let the clip do the talking."); } },
    ]),
    EV("payola", "The Payola Offer", "A radio plugger offers to get your single into rotation for cash, no questions.", [
      { t: "Pay him", f: () => { const c = inMoney(5000); if (state.money < c) return addHype(1); (state.money -= c), addPop(4), addFame(2), say("I paid to get my single on the radio."); } },
      { t: "Refuse", f: () => { addFame(1), addHype(2), say("I refused to pay for airplay."); } },
    ], 7),
    EV("label_scout", "A Scout in the Lobby", "A label scout is waiting outside the studio and asks what you're working on.", [
      { t: "Play him the record", f: () => { addHype(5), addFame(2), say("I played the scout my record."); } },
      { t: "Tell him to buy a ticket", f: () => { addFame(1), addHype(3), say("I told the scout to buy a ticket like everyone else."); } },
    ], 8),
    EV("feature_request", "A Bigger Artist Wants a Feature", "An artist with a real following wants you on their next single.", [
      { t: "Do it for free", f: () => { addHype(7), addFame(3), v(rint(10000, 60000)), say("I hopped on the feature for free to grow."); } },
      { t: "Charge your rate", f: () => { const c = inMoney(8000); (state.money += c), addHype(4), addFame(2), say(`I charged ${usd(c)} for the feature.`); } },
    ]),
    EV("stolen_laptop", "Laptop Stolen", "Somebody walked off with your laptop at a session. Your sessions folder was on it.", [
      { t: "Panic", f: () => { const m = p(); if (m.unreleased.length) { const lost = m.unreleased.shift(); notice("Lost", `"${lost.title}" is gone.`, null, !0); } addHype(-2), say("I lost a hard drive full of sessions."); } },
      { t: "Thank your backup", f: () => { addHype(1), say("Everything was backed up in the cloud."); } },
    ], 7),
    EV("dead_drive", "Dead Hard Drive", "Your drive clicks twice and dies. Every unreleased file is on it.", [
      { t: "Pay for data recovery", f: () => { const c = inMoney(1800); if (state.money < c) return addHype(-1); (state.money -= c), addHype(1), say("I paid for data recovery and got the sessions back."); } },
      { t: "Let it go", f: () => { const m = p(); if (m.unreleased.length) { const lost = m.unreleased.pop(); notice("Gone", `"${lost.title}" died with the drive.`, null, !0); } say("I let the drive go and started over."); } },
    ], 8),
    EV("fan_tattoo", "A Fan Got Your Lyrics Tattooed", "A fan posts a tattoo of your lyrics and tags you.", [
      { t: "Share it", f: () => { addFame(2), addHype(3), v(rint(8000, 30000)), say("I shared the fan tattoo."); } },
      { t: "Keep it private", f: () => { addHype(1), addFame(1), say("I kept the fan tattoo to myself."); } },
    ]),
    EV("industry_plant", "Industry Plant Accusations", "A blog says your whole come-up is fake and somebody else is funding you.", [
      { t: "Address it with receipts", f: () => { addFame(2), addPop(1), say("I posted receipts and shut the rumor down."); } },
      { t: "Ignore it", f: () => { addHype(4), say("I didn't respond to the blog. The silence became a meme."); } },
    ]),
    EV("studio_flood", "Studio Flood", "A pipe bursts in the room where you record. Your gear is soaked.", [
      { t: "Replace the gear", f: () => { const c = inMoney(2500); if (state.money < c) return addHype(-2); (state.money -= c), addHype(1), say("I replaced the waterlogged gear."); } },
      { t: "Record at home for a while", f: () => { addHype(-1), say("I moved my sessions back to the bedroom."); } },
    ], 8),
    EV("noise_complaint", "Noise Complaint", "Your neighbors call the landlord about the bass coming through the floor at 2 AM.", [
      { t: "Soundproof the room", f: () => { const c = inMoney(1200); if (state.money < c) return addHype(-1); (state.money -= c), addHype(2), say("I spent the night hanging soundproofing foam."); } },
      { t: "Keep it down", f: () => { addHype(-1), say("I turned the monitors down and lost the vibe."); } },
    ]),
    EV("session_player", "Session Player No-Show", "The bassist you booked for tonight's session doesn't show and won't answer.", [
      { t: "Play it yourself", f: () => { addHype(2), say("I played every part myself that night."); } },
      { t: "Reschedule and lose the room", f: () => { addHype(-1), say("I lost the deposit on the room."); } },
    ]),
    EV("ad_viral", "The Ad Went Viral", "The cheap ad you cut in your bedroom is getting shared more than the song.", [
      { t: "Turn it into a series", f: () => { addHype(6), v(rint(10000, 40000)), addFame(1), say("I turned the ad into a whole series."); } },
      { t: "Put the money into another ad", f: () => { const c = inMoney(800); if (state.money < c) return addHype(2); (state.money -= c), addHype(4), addPop(1), say("I reinvested in another ad."); } },
    ]),
    EV("radio_interview", "Live Radio Interview", "A station invites you on air. The host asks about the rumored label deal.", [
      { t: "Hype it up", f: () => { addHype(7), addFame(2), say("I hinted at a deal that doesn't exist yet."); } },
      { t: "Keep it honest", f: () => { addFame(2), addHype(3), say("I told the truth: no label, just the music."); } },
    ], 7),
    EV("awards_snub", "Awards Snub", "You weren't nominated for anything this year and the timeline is laughing about it.", [
      { t: "Drop a surprise track", f: () => { const m = p(); if (!m.unreleased.length) return addHype(4); const r = m.unreleased.shift(); setTimeout(() => dropRec(r), 60), say("I dropped a vault track out of spite."); } },
      { t: "Log off", f: () => { addHype(2), addFame(1), say("I logged off and went back to the studio."); } },
    ], 6),
    EV("collab_crew", "A Crew Wants to Collaborate", "A whole crew of artists wants to jump on your next song.", [
      { t: "Do a posse cut", f: () => { addHype(8), addFame(2), addPop(1), say("I cut a posse track with the whole crew."); } },
      { t: "Keep the song solo", f: () => { addFame(1), addHype(2), say("I kept the song for myself."); } },
    ]),
    EV("venue_cancel", "Venue Cancelled", "The venue for your next show cancels two days before the date.", [
      { t: "Book a smaller spot", f: () => { addHype(3), addFame(1), say("I moved the show to a smaller venue and sold it out."); } },
      { t: "Live stream instead", f: () => { addHype(5), v(rint(6000, 25000)), say("I turned the cancelled show into a live stream."); } },
    ], 6),
    EV("bus_breakdown", "The Van Died on Tour", "Your tour van breaks down three states from the next city.", [
      { t: "Pay for the repair", f: () => { const c = inMoney(2200); if (state.money < c) return addHype(-2); (state.money -= c), addHype(1), say("I paid for the repair and made the show."); } },
      { t: "Cancel the date", f: () => { addHype(-2), addFame(-1), say("I had to cancel the date."); } },
    ]),
    EV("merch_cut", "Merch Money", "A fan tells you someone else is selling bootleg shirts with your logo.", [
      { t: "Send a cease and desist", f: () => { const c = inMoney(400); if (state.money < c) return addFame(1); (state.money -= c), addFame(2), say("I sent a cease and desist to the bootlegger."); } },
      { t: "Drop real merch instead", f: () => { const c = inMoney(900); if (state.money < c) return addHype(1); (state.money -= c), addHype(4), addPop(1), say("I dropped official merch and outsold the bootlegger."); } },
    ], 7),
    EV("hacked_snippet", "Hacker Teased Your Vault", "Somebody got into your drive and posted a snippet of an unreleased song.", [
      { t: "Change every password", f: () => { addHype(3), say("I locked everything down after the hack."); } },
      { t: "Turn it into a rollout", f: () => { addHype(6), addFame(1), say("I turned the hack into a rollout."); } },
    ], 7),
    EV("fan_remix", "A Fan Remix Blew Up", "A fan remix of your song is getting more plays than the original.", [
      { t: "Co-sign it", f: () => { addFame(3), addHype(4), v(rint(8000, 35000)), say("I co-signed the fan remix."); } },
      { t: "Get it taken down", f: () => { addFame(-1), addHype(-2), say("I got the fan remix taken down."); } },
    ], 6),
    EV("studio_residency", "Studio Residency", "A studio owner offers you a monthly residency: cheap hours in exchange for bringing in clients.", [
      { t: "Take the deal", f: () => { const m = p(); (m.boost = num(m.boost) + 10), addHype(2), say("I took the studio residency."); } },
      { t: "Stay independent", f: () => { addFame(1), say("I passed on the residency to keep my schedule."); } },
    ], 8),
    EV("beat_auction", "Beat Auction", "Another artist wants a beat you've been sitting on and offers real money.", [
      { t: "Sell it", f: () => { const c = inMoney(rint(4000, 12000)); (state.money += c), say(`I sold an unused beat for ${usd(c)}.`); } },
      { t: "Keep it for yourself", f: () => { addHype(2), say("I kept the beat for my own project."); } },
    ], 6),
    EV("bootleg_album", "Your Engineer Bootlegged the Album", "Your engineer has been selling copies of your finished album out the back door.", [
      { t: "Lawyer up", f: () => { const c = inMoney(1500); if (state.money < c) return addFame(1); (state.money -= c), addFame(2), say("I got a lawyer on the engineer."); } },
      { t: "Rush the real release", f: () => { const m = p(); if (!m.unreleased.length) return addHype(2); const r = m.unreleased.shift(); setTimeout(() => dropRec(r), 60), addHype(3), say("I rushed the official release before the bootleg could eat it."); } },
    ], 8),
    EV("party_leak", "Your Friend Played the Vault at a Party", "Somebody put your unreleased album on the aux at a packed party. Phones are already up.", [
      { t: "Own it and post the clip", f: () => { const m = p(); addHype(9), addFame(2), v(rint(10000, 40000)), m.unreleased.length && (m.leakFlag = !0), say("I owned the leak and posted the clip myself."); } },
      { t: "Kill the aux", f: () => { addHype(1), say("I unplugged the aux before the whole thing played."); } },
    ], 7),
    EV("editorial", "Editorial Playlist", "A streaming editor wants to put your single on a big playlist, but they want a clean version.", [
      { t: "Cut the clean version", f: () => { addPop(4), addFame(2), addHype(4), v(rint(20000, 80000)), say("I cut a clean version for the playlist."); } },
      { t: "Keep the original", f: () => { addFame(1), addHype(2), say("I kept the original and skipped the playlist."); } },
    ], 6),
    EV("vocal_strain", "Your Voice Is Shot", "You can barely talk after a week of sessions. The next recording is tomorrow.", [
      { t: "Rest the voice", f: () => { addHype(-1), say("I cancelled the session and rested my voice."); } },
      { t: "Push through", f: () => { const m = p(); (m.boost = Math.max(0, num(m.boost) - 10)), addFame(1), say("I sang through the pain and it cost me."); } },
    ]),
  ];

  function indEvent() {
    const m = p(),
      avail = IN_EVENTS.filter((ev) => state.age - (m.evSeen[ev.id] || -99) >= ev.cool);
    if (!avail.length) return;
    const ev = pickR(avail),
      st = studioOf(m.studio);
    m.evSeen[ev.id] = state.age;
    jCard({
      tag: "Music",
      iconSrc: e("mic-studio"),
      title: ev.t,
      lead: ev.lead,
      choices: ev.opts.map((o) => [o.t, () => setTimeout(o.f, 40)]),
    });
  }

  function indTick() {
    const m = p();
    if (!h() || state.dead) return;
    if (m.tickAge === state.age) return;
    m.tickAge = state.age;
    queuePopup(awardsTick);
    if (!m.indep) return;
    if (m.crew.length && m.crewPaid !== state.age) {
      m.crewPaid = state.age;
      const bill = crewPay();
      if (state.money >= bill) (state.money -= bill), renderStats(), say(`I paid ${usd(bill)} in crew salaries.`);
      else {
        const out = m.crew.slice().sort((a, b) => num(b.pay) - num(a.pay))[0];
        (m.crew = m.crew.filter((x) => x !== out)),
          say(`${out.name} walked out: I couldn't pay the crew.`),
          notice("Crew walked out", `You couldn't cover ${usd(bill)} in salaries. ${out.name} left the team.`, null, !0);
      }
    }
    const leaked = [],
      leakChance = crewHas("manager") ? 0.045 : 0.07;
    m.unreleased = m.unreleased.filter((r) => {
      if (r.age < state.age && chance(leakChance)) return leaked.push(r.title), !1;
      return !0;
    });
    if (leaked.length) {
      addHype(2 * leaked.length);
      say(`A hacker leaked ${leaked.length > 1 ? leaked.length + " of my unreleased songs" : `my unreleased song "${leaked[0]}"`}.`);
      notice(
        "Leaked",
        `${leaked.length > 1 ? `${leaked.length} of your unreleased songs` : `"${leaked[0]}"`} leaked online. Hype went up, but the song is out of your hands now.`,
        null,
        !0,
      );
    }
    m.hype = Math.max(0, num(m.hype) - rint(1, crewHas("publicist") ? 2 : 4));
    const ch = updateChart();
    if (ch) {
      addFame(ch.pos <= 3 ? 3 : 1), addPop(1), say(`"${ch.title}" charted at #${ch.pos} this year.`);
      if (ch.pos === 1)
        v(rint(5e4, 2e5)),
          addFame(2),
          g("SFX_MusicProducer_BangerAward"),
          notice("Number one", `"${ch.title}" is the #1 record in the country.`, null, !0);
    }
    chance(0.55) && queuePopup(indEvent);
  }

  document.getElementById("ageBtn").addEventListener("click", () => {
    state.dead ||
      setTimeout(() => {
        try {
          indTick();
        } catch (e2) {
          console.warn("[musician indie]", e2);
        }
      }, 1200);
  });

  const de = window.renderStats;
  (window.renderStats = function () {
    artFix();
    const t = de.apply(this, arguments),
      a = h();
    if ((document.querySelector(".phone").classList.toggle("musician", a), a)) {
      const t = clamp(Math.round(num(p().pop)));
      stats.insertAdjacentHTML(
        "beforeend",
        `<div class="stat-l">Popularity<span class="e"><img src="${e("mic")}" alt="" style="width:24px;height:24px;vertical-align:middle"></span></div>${statBar(t, "fame")}`,
      ),
        (document.querySelector(".home").style.backgroundPosition = `0 -${stats.offsetHeight}px`);
    }
    return t;
  }),
    ageBtnEl.addEventListener("click", () => {
      const t = state.music;
      if (!t || state.dead) return;
      let a = 0;
      for (const e of t.releases || []) {
        const t = state.age - e.age;
        t >= 1 && t <= 6 && (a += Math.round(e.mine * Math.max(0, 0.3 - 0.05 * t)));
      }
      if ((a > 0 && ((state.money += a), say(`I earned ${usd(a)} in royalties from my music.`)), !h()))
        return;
      const o = b();
      (o.tenure = (o.tenure || 0) + 1), (o.perf = 100);
      t.released === state.age - 1 ||
        t.concert === state.age - 1 ||
        t.toured === state.age - 1 ||
        (t.pop = clamp((t.pop || 0) - rint(2, 6))),
        $(),
        t.band && chance(0.2) && (t.band.rel = clamp(t.band.rel - rint(1, 5)));
      const n = { label: t.label, role: t.role, band: t.band },
        r = !t.indep && state.age >= t.start + t.term,
        s = !t.indep && state.age > t.start && t.released !== state.age - 1;
      !r && s && (t.snubs || 0) >= 1 && chance(0.25 * t.snubs)
        ? queuePopup(() =>
            ie(
              `${t.label} terminated my contract because I stopped making music for them.`,
              () => le(n),
              "Dropped",
            ),
          )
        : (!r &&
            s &&
            queuePopup(() =>
              jCard({
                tag: "Music",
                iconSrc: e("album"),
                title: "New Album",
                surprise: !0,
                lead: `Your record label, ${t.label}, is asking you to make a new album${t.band ? ` with ${t.band.name}` : ""}.<br><br>What will you do?`,
                choices: [
                  ["Make a new album", () => setTimeout(() => J(!1), 80)],
                  [
                    "Don't do it",
                    () => {
                      (t.snubs = (t.snubs || 0) + 1), say(`I ignored ${t.label}'s request for a new album.`);
                    },
                  ],
                ],
              }),
            ),
          r &&
            queuePopup(() => {
              if (!((t.pop || 0) >= 15 && (t.snubs || 0) < 2 && chance(0.4 + (t.pop || 0) / 150)))
                return ie(`My contract with ${t.label} expired and they decided not to renew it.`, () =>
                  le(n),
                );
              const e = localPrice(S(Math.round(1e3 * rint(5, 30) * (1 + (t.pop || 0) / 25))));
              jCard({
                tag: "Music",
                iconSrc: b().icon,
                title: "Contract Renewal",
                surprise: !0,
                lead: `Your contract with ${t.label} has expired, and they would like to sign you again.<br><br>What will you do?`,
                rows: [
                  ["Advance", usd(e)],
                  ["Royalty Rate", `${t.royalty}%`],
                  ["Term", `${t.term} Years`],
                ],
                choices: [
                  [
                    "Re-sign",
                    () => {
                      (t.start = state.age),
                        (state.money += e),
                        renderStats(),
                        g("SFX_MusicProducer_LabelSign"),
                        say(`I re-signed with ${t.label} for ${t.term} more years.`),
                        notice(
                          "Re-signed",
                          `You re-signed with ${t.label} and received a ${usd(e)} advance!`,
                          null,
                          !0,
                        );
                    },
                  ],
                  ["Leave the label", () => ie(`I left ${t.label} when my contract expired.`, () => le(n))],
                ],
              });
            }),
          renderStats());
    }),
    document.head.insertAdjacentHTML(
      "beforeend",
      "<style>\n  .phone.musician .profile,.phone.musician .stats,.phone.musician .home{background:#fff8ee url(musician/bar.png) 0 0/120px 120px repeat}\n  .phone.musician.dark .profile,.phone.musician.dark .stats,.phone.musician.dark .home{background:#1d1a17 url(musician/bar-dm.png) 0 0/120px 120px repeat}\n  </style>",
    ),
    (window.MUSICIAN = {
      openMusician: C,
      openMusicJob: D,
      state: p,
      indie: {
        studios: () => IN_STUDIOS,
        events: () => IN_EVENTS,
        start: startIndependent,
        record: indRecord,
        drop: dropRec,
        tick: indTick,
        awards: awardsTick,
        awardList: () => IN_AWARDS,
        awardArt,
        fee: sessionFee,
        quality: studioQuality,
        signedReady: signedOfferReady,
        fame: addFame,
        openStudios,
        openVault,
        openAwards,
        openCrew,
        openCollab,
        openCharts,
        crew: () => IN_CREW,
        crewQ,
        crewPay,
        hire: hireCrew,
        fire: fireCrew,
        partners: collabPartners,
        chart: chartBoard,
        chartYear,
      },
    });
})();
