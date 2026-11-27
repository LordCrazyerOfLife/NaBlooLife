/* [base] Career Dock (career-dock.js): una sola carrera especial a la vez + las carreras especiales activas salen debajo de tu personaje.
 *  1) window.FL_CAREERS (canStart / list): la regla "One career at a time". Antes vivía solo en special-life.js (un mod que se puede
 *     apagar), así que Gang Bang / Movie Director podían convivir con otras. Ahora es base, mira el estado (no el código de cada mod),
 *     y cubre: Street Racer, Judge, Artist, Footballer, Gang member, Drift Boy, Movie Director, Actor, Fighter, Politician, Pro Athlete.
 *  2) Ocupación: debajo de tu personaje (arriba de "Your Job") sale la sección "Special Career" con la carrera especial activa que no
 *     es un trabajo normal (Gang Bang, Movie Director): ícono, rango y un toque para abrir su menú. Director tiene "Quit".
 * Textos: T("english", "español", "português") (add_chess_i18n.py los extrae). REGLA: sin template literals dentro de T().
 */
(() => {
  "use strict";
  if (window.FL_CAREER_DOCK) return;
  const T = (en) => en;
  const chev = () => (typeof CHEV !== "undefined" ? CHEV : "");
  const piece = (p) => `<em style="font-style:normal">${p}</em>`;

  // ------------------------------------------------------------------ una sola carrera
  function names(except) {
    const out = [];
    const s = typeof state !== "undefined" ? state : {};
    if (s.racing && s.racing.active) out.push("Illegal Street Racer");
    if (s.judge && s.judge.active) out.push("Judge");
    if (s.art && s.art.active) out.push("Artist");
    if (s.futbol && s.futbol.active && !s.futbol.retired) out.push("Footballer");
    if (s.gangLife && s.gangLife.member) out.push("Gang member");
    if (s.drift && s.drift.active) out.push("Drift Boy");
    if (s.dir && s.dir.active) out.push("Movie Director");
    if (s.job && s.job.acting) out.push("Actor");
    if (s.job && s.job.fighter) out.push("Fighter");
    if (s.job && s.job.politician) out.push("Politician");
    if (s.job && s.job.athlete) out.push("Pro Athlete");
    return out.filter((n) => n !== except);
  }
  window.FL_CAREERS = {
    base: true,
    list: () => names(),
    canStart(name) {
      const busy = names(name);
      if (!busy.length) return true;
      if (typeof notice === "function")
        notice(
          T("One career at a time", "Una carrera a la vez", "Uma carreira por vez"),
          `${T("You are already a", "Ya eres", "Você já é")} ${busy[0]}. ${T("Quit that career before starting a new one.", "Deja esa carrera antes de empezar una nueva.", "Saia dessa carreira antes de começar uma nova.")}`,
          null,
          true,
        );
      return false;
    },
  };

  // ------------------------------------------------------------------ dock en Ocupación
  const DOCK = [
    {
      id: "gang", icon: "special/gangbang.png",
      name: () => T("Gang Bang", "Gang Bang", "Gang Bang"),
      on: () => !!(state.gangLife && state.gangLife.member) && !!window.FL_GANG,
      sub: () => {
        const g = state.gangLife, X = window.FL_GANG_API;
        return X && X.GANGS[g.gang] && X.RANKS[g.rank] ? `${X.GANGS[g.gang].name} · ${X.RANKS[g.rank].t}` : T("Street gang", "Pandilla callejera", "Gangue de rua");
      },
      open: () => window.FL_GANG.open(),
    },
    {
      id: "dir", icon: "director/clap.png",
      name: () => T("Movie Director", "Director de cine", "Diretor de cinema"),
      on: () => !!(state.dir && state.dir.active) && !!window.FL_DIR,
      sub: () => {
        try {
          return window.FL_DIR.rankName();
        } catch (e) {
          return T("Behind the camera", "Detrás de la cámara", "Atrás das câmeras");
        }
      },
      open: () => window.FL_DIR.open(),
      quit: () => {
        state.dir.active = false;
        typeof say === "function" && say(T("I retired from directing films.", "Me retiré de dirigir películas.", "Me aposentei de dirigir filmes."));
      },
    },
  ];

  function dockHtml() {
    const list = DOCK.filter((d) => {
      try {
        return d.on();
      } catch (e) {
        return false;
      }
    });
    if (!list.length) return "";
    return (
      `<div class="sec">${T("Special Career", "Carrera especial", "Carreira especial")}</div>` +
      list.map((d) => `<div class="row" id="fldock_${d.id}"><img src="${d.icon}" alt=""><div class="t"><b>${d.name()}</b><span>${piece(d.sub())}</span></div>${chev()}</div>`).join("")
    );
  }
  function bind() {
    for (const d of DOCK) {
      const el = document.getElementById(`fldock_${d.id}`);
      if (!el) continue;
      el.onclick = () => {
        typeof play === "function" && play("choice");
        if (!d.quit) return d.open();
        jCard({
          tag: T("Special Career", "Carrera especial", "Carreira especial"), iconSrc: d.icon, title: d.name(), lead: d.sub(),
          choices: [
            [T("Open", "Abrir", "Abrir"), () => d.open()],
            [T("Quit this career", "Dejar esta carrera", "Largar esta carreira"), () => {
              iosConfirm(T("Quit", "Dejar", "Largar"), T("Are you sure you want to quit this career?", "¿Seguro que quieres dejar esta carrera?", "Tem certeza que quer largar esta carreira?"), () => {
                d.quit();
                typeof openOccupation === "function" && openOccupation();
              });
            }],
            [T("Back", "Volver", "Voltar"), () => {}],
          ],
        });
      };
    }
  }

  function boot() {
    if (typeof state === "undefined" || typeof openOccupation !== "function" || typeof sList === "undefined") return setTimeout(boot, 80);
    if (openOccupation.__flDock) return;
    const orig = openOccupation;
    const wrapped = function () {
      const r = orig.apply(this, arguments);
      try {
        const h = dockHtml();
        if (h && !document.getElementById("fldock_gang") && !document.getElementById("fldock_dir")) {
          sList.insertAdjacentHTML("afterbegin", h);
          bind();
        }
      } catch (e) {
        console.warn("[career-dock]", e);
      }
      return r;
    };
    wrapped.__flDock = true;
    openOccupation = wrapped;
    window.FL_CAREER_DOCK = { names, dockHtml };
  }
  boot();
})();
