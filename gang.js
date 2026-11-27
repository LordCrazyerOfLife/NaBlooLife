/* [mod] Carrera especial "Gang Bang" para NaBlooLife (mod local). Se activa con el código 13131313 (mods.js).
 * Aparece en Ocupación → Special Careers. No toca game.html: envuelve openSpecialCareers y se engancha a #ageBtn.
 * Estado: state.gangLife (JSON puro, por vida). Los arrestos usan arrest() del juego (juicio y cárcel normales).
 * Textos: T("english", "español", "português"); add_chess_i18n.py los pasa al ui.tsv.
 * REGLA: los textos de T() van entre comillas dobles, sin template literals.
 */
(() => {
  "use strict";
  const T = (en) => en;
  const CAREER = T("Gang Bang", "Gang Bang", "Gang Bang"); // nombre de la carrera (cambiar acá)
  const ICON = "special/gangbang.png";
  // Screen effect functions for gang shootouts
  let screenShakeActive = false;
  function screenShake() {
    if (screenShakeActive) return;
    screenShakeActive = true;
    const style = document.createElement('style');
    style.innerHTML = `
      @keyframes shake {
        0% { transform: translate(0, 0); }
        10% { transform: translate(-10px, -10px); }
        20% { transform: translate(10px, 10px); }
        30% { transform: translate(-10px, 10px); }
        40% { transform: translate(10px, -10px); }
        50% { transform: translate(0, 0); }
        100% { transform: translate(0, 0); }
      }
      body { animation: shake 0.5s ease-in-out; }
    `;
    document.head.appendChild(style);
    setTimeout(() => { screenShakeActive = false; document.head.removeChild(style); }, 500);
  }
  function setBloodScreen() {
    const bloodDiv = document.createElement('div');
    bloodDiv.style.cssText = `
      position: fixed;
      inset: 0;
      background: radial-gradient(circle at 30% 20%, rgba(255,0,0,0.3) 0%, rgba(255,0,0,0.1) 50%, transparent 70%);
      pointer-events: none;
      z-index: 9999;
    `;
    bloodDiv.id = 'blood-screen';
    document.body.appendChild(bloodDiv);
    setTimeout(() => bloodDiv.remove(), 300);
  }
  function playSound(soundName) {
    const sounds = {
      augh: new Audio('sounds/augh.mp3')
    };
    const sound = sounds[soundName];
    if (sound) {
      sound.play().catch(() => {});
    }
  }
  const E = (code) => `emoji/${code}.png`;
  const rnd = Math.random;
  const ri = (a, b) => a + Math.floor(rnd() * (b - a + 1));
  const clampN = (v, a, b) => Math.max(a, Math.min(b, v));
  const pick = (a) => a[Math.floor(rnd() * a.length)];
  const money = (n) => (typeof usd === "function" ? usd(n) : "$" + Math.round(n).toLocaleString("en-US"));
  const price = (n) => (!n ? 0 : typeof localPrice === "function" ? localPrice(n) : n);

  // Nombres de pandillas que eligió el usuario. Su gente es 100% ficticia (generada al unirte), sin personas reales.
  // nation: folk (azul/negro, lado derecho) | people (rojo/negro, lado izquierdo) | indie (cliques sin alianza). Como en Chicago.
  const GANGS = [
    { name: "Gangster Disciples", short: "GDs", icon: E("1f48e"), nation: "folk" },
    { name: "Black Disciples", short: "BDs", icon: E("1f5a4"), nation: "folk" },
    { name: "Slime Gang", short: "Slime", icon: E("1f40d"), nation: "indie" },
    { name: "Toss Gang", short: "Toss", icon: E("1f3b2"), nation: "indie" },
    { name: "95 Mob", short: "95", icon: E("1f4af"), nation: "indie" },
    { name: "Bloodhounds", short: "Hounds", icon: E("1f415"), nation: "indie" },
    { name: "Vice Lords", short: "VLs", icon: E("1f451"), nation: "people" },
    { name: "Latin Kings", short: "Kings", icon: E("1f981"), nation: "people" },
    { name: "Black P Stones", short: "Stones", icon: E("1f3d4-fe0f"), nation: "people" },
    { name: "Four Corner Hustlers", short: "4CH", icon: E("1f4b5"), nation: "people" },
  ];

  // ---------------------------------------------------------------- la gente de la pandilla (ficticia)
  const ROLES = {
    og: { t: T("OG", "OG", "OG"), icon: E("1f474"), age: [34, 55] },
    big: { t: T("Big Homie", "Big Homie", "Big Homie"), icon: E("1f60e"), age: [24, 34] },
    homie: { t: T("Homie", "Homie", "Parça"), icon: E("1f468"), age: [18, 28] },
    lil: { t: T("Lil Homie", "Lil Homie", "Pivete"), icon: E("1f466"), age: [13, 17] },
    rapper: { t: T("Rapper", "Rapero", "Rapper"), icon: E("1f3a4"), age: [18, 27] },
    hustler: { t: T("Hustler", "Buscavidas", "Corre-certo"), icon: E("1f4b5"), age: [19, 35] },
  };
  const CREW_SHAPE = ["og", "og", "big", "big", "homie", "homie", "homie", "lil", "lil", "rapper", "hustler"];
  const NICKS = [
    "Lil Dre", "Big Moe", "Tooky", "Peanut", "Scrap", "Stacks", "Juju", "Ghost", "Bam", "Lil Ced", "Pooh", "Duke",
    "Man Man", "Ray Ray", "Boo", "Spook", "Lil Mike", "Big Rell", "Tank", "Fresh", "Lil Bit", "June", "T-Bone", "Dooley",
    "Smurf", "Nephew", "Pudge", "Cash", "Lil Twin", "Big Twin", "Quez", "Deuce", "Shorty", "Bandit", "Pharaoh", "Slim",
    "Big Lou", "Rico", "Kilo", "Trey Dog", "Mookie", "Boogie", "Tay", "Zay",
  ];
  const OG_NICKS = ["Unc", "Old Head Earl", "Pops", "Old Man Rob", "Big Unc", "Pop Pop", "Saint", "Smoke", "Deacon", "Chief"];
  const FIRST = ["Andre", "Marcus", "Terrell", "Darnell", "Jamal", "Tyrone", "DeShawn", "Malik", "Kendrick", "Rashad", "Cedric", "Maurice",
    "Javon", "Isaiah", "Xavier", "Derrick", "Lamar", "Reggie", "Curtis", "Quentin", "Jalen", "Trevon", "Dominique", "Corey",
    "Luis", "Carlos", "Miguel", "Hector", "Angel", "Jose", "Victor", "Ramon"];
  const LAST = ["Johnson", "Williams", "Jackson", "Davis", "Brown", "Harris", "Robinson", "Walker", "Thompson", "Carter", "Mitchell",
    "Turner", "Price", "Hayes", "Bell", "Coleman", "Rivera", "Ortiz", "Santos", "Cruz", "Morales", "Banks", "Lewis", "Green"];

  function makeMember(role, used) {
    const pool = role === "og" ? OG_NICKS : NICKS; // los apodos de viejo solo para los OGs
    let nick, tries = 0;
    do nick = pick(pool);
    while (used.has(nick) && ++tries < 50);
    used.add(nick);
    const [a, b] = ROLES[role].age;
    return { role, nick, first: pick(FIRST), last: pick(LAST), age: ri(a, b), bond: ri(25, 55) };
  }
  function makeCrew() {
    const used = new Set();
    return CREW_SHAPE.map((r) => makeMember(r, used));
  }
  const RANKS = [
    { t: T("Prospect", "Aspirante", "Aspirante"), rep: 0, cut: 0 },
    { t: T("Soldier", "Soldado", "Soldado"), rep: 20, cut: 2000 },
    { t: T("Enforcer", "Matón", "Executor"), rep: 40, cut: 6000 },
    { t: T("Lieutenant", "Teniente", "Tenente"), rep: 60, cut: 15000 },
    { t: T("Shot Caller", "El que manda", "Chefe de área"), rep: 80, cut: 35000 },
    { t: T("Boss", "Jefe", "Chefão"), rep: 95, cut: 80000 },
  ];
  const MAX_ACTS = 4;

  // ---------------------------------------------------------------- armas (todas viven en arms.js / Gun Dealers)
  // el arma que llevas encima: la de arms.js (o null)
  const carried = () => (window.FL_ARMS ? window.FL_ARMS.carried() : null);
  const gunPower = () => (window.FL_ARMS ? window.FL_ARMS.power() : 0);
  // saves viejos: la "Strap" de la pandilla (g.guns) pasa al arsenal de arms.js
  function migrateOldGuns(g) {
    if (!(g.guns && g.guns.length)) return;
    try {
      const a = (state.arms ||= { v: 4, guns: [], carry: null, mags: {}, parts: [], uid: 1, license: false, yr: { age: -1, hunts: 0 } });
      for (let i = 0; i < g.guns.length; i++) {
        const x = g.guns[i];
        const uid = a.uid++;
        a.guns.push({ uid, id: x.id === "draco" ? "draco" : "glock07", mag: null, att: x.att || {} });
        if (g.carry === i) a.carry = uid;
      }
    } catch (e) {
      console.warn("[gang] migrate guns", e);
    }
    g.guns = [];
    g.carry = null;
  }

  // textos sueltos que arma el código (para el i18n)
  T("Gang", "Pandilla", "Gangue");
  T("Rank", "Rango", "Patente");
  T("Reputation", "Reputación", "Reputação");
  T("Police heat", "Calor policial", "Atenção da polícia");
  T("Money", "Dinero", "Dinheiro");
  T("Health", "Salud", "Saúde");
  T("Happiness", "Felicidad", "Felicidade");
  T("Your cut this year", "Tu parte este año", "Sua parte este ano");
  T("Role", "Papel", "Papel");
  T("Bond", "Confianza", "Confiança");
  T("Run with a street gang. Rise from Prospect to Boss.", "Únete a una pandilla callejera. Sube de aspirante a jefe.", "Entre para uma gangue de rua. Suba de aspirante a chefão.");

  // ---------------------------------------------------------------- estado
  const G = () => {
    const g = (state.gangLife ||= {});
    if (!g.v) Object.assign(g, { v: 1, member: false, gang: null, rank: 0, rep: 0, heat: 0, earned: 0, years: 0, evDone: {} });
    if (g.v < 2) {
      // saves viejos: "switch" pasa a ser una Glock con switch instalado y se van las armas retiradas (ARP)
      const ok = new Set(["glock", "draco"]);
      g.guns = (g.guns || []).flatMap((x) => (x.id === "switch" ? [{ id: "glock", att: { trigger: { id: "switch", color: "red" } } }] : ok.has(x.id) ? [x] : []));
      if (g.carry != null && !g.guns[g.carry]) g.carry = g.guns.length ? 0 : null;
      g.v = 2;
    }
    if (g.v < 3) {
      migrateOldGuns(g);
      g.v = 3;
    }
    if (!g.yr || g.yr.age !== state.age) g.yr = { age: state.age, acts: 0 };
    return g;
  };
  const gangName = (g) => (g.gang != null ? GANGS[g.gang].name : "");
  const rankName = (g) => RANKS[g.rank].t;

  function fx(g, f) {
    const rows = [];
    const sign = (n) => (n > 0 ? "+" : "") + n;
    if (f.money) {
      const m = price(Math.abs(f.money)) * Math.sign(f.money);
      state.money += m;
      if (m > 0) (g.earned += m), typeof chaChing === "function" && chaChing();
      rows.push(["Money", `${m > 0 ? "+" : "-"}${money(Math.abs(m))}`]);
    }
    if (f.rep) {
      const b = g.rep;
      g.rep = clampN(g.rep + f.rep, 0, 100);
      if (g.rep !== b) rows.push(["Reputation", sign(g.rep - b)]);
    }
    if (f.heat) {
      const b = g.heat;
      g.heat = clampN(g.heat + f.heat, 0, 100);
      if (g.heat !== b) rows.push(["Police heat", sign(g.heat - b)]);
    }
    for (const [k, name] of [["He", "Health"], ["H", "Happiness"]]) {
      if (!f[k] || !state.stats) continue;
      state.stats[name] = clampN((state.stats[name] || 0) + f[k], 0, 100);
      rows.push([name, sign(f[k])]);
    }
    typeof renderStats === "function" && renderStats();
    return rows;
  }

  // gasta una acción del año (lo hace el click de la acción, salvo las que eligen algo antes con pre())
  function spendAct(g) {
    g.yr.acts++;
    const ah = window.FL_ARMS ? window.FL_ARMS.heat() : 0;
    if (ah) g.heat = clampN(g.heat + ah, 0, 100);
  }

  // Riesgo de arresto: base de la acción + el calor acumulado
  function busted(g, base, crime) {
    if (rnd() < base + g.heat / 400) {
      g.heat = 0;
      let charge = crime, years = null;
      // arma de los dealers (arms.js): cargo extra siempre, legal o ilegal; la policía te la quita
      const ar = window.FL_ARMS ? window.FL_ARMS.busted(crime) : null;
      if (ar) (charge = ar.charge), (years = ar.years);
      setTimeout(() => typeof arrest === "function" && (years ? arrest(charge, years) : arrest(charge)), 50);
      return true;
    }
    return false;
  }

  function card(title, lead, rows, after) {
    jCard({ tag: CAREER, iconSrc: ICON, title, lead, rows, choices: [["OK", after || (() => {})]] });
  }

  // ---------------------------------------------------------------- unirse
  function joinMenu() {
    if (state.age < 13) return notice(CAREER, T("You're too young to run with a gang.", "Eres muy chiquito para andar en una pandilla.", "Você é novo demais para andar com uma gangue."), null, !0);
    socSelCard({
      tag: CAREER,
      icon: ICON,
      title: T("Join a Gang", "Unirte a una pandilla", "Entrar para uma gangue"),
      lead: T("Crews run the streets in your city, some under the Folks, some under the People, some on their own. Which one do you want to roll with?", "Las pandillas controlan las calles de tu ciudad, unas con los Folks, otras con los People y otras por su cuenta. ¿Con cuál quieres andar?", "As gangues mandam nas ruas da sua cidade, umas com os Folks, outras com os People e outras por conta própria. Com qual você quer andar?"),
      label: T("Gang:", "Pandilla:", "Gangue:"),
      opts: GANGS.map((x) => x.name),
      btn: T("Approach them", "Acercarte a ellos", "Chegar neles"),
      onGo: (i) => initiation(i),
    });
  }

  function initiation(i) {
    const g = G();
    jCard({
      tag: CAREER,
      iconSrc: GANGS[i].icon,
      title: T("Initiation", "Iniciación", "Iniciação"),
      lead: T("The crew says nobody gets in for free. You have to prove yourself.", "La pandilla dice que nadie entra gratis. Tienes que demostrar lo que vales.", "A gangue diz que ninguém entra de graça. Você tem que provar seu valor."),
      choices: [
        [T("Get jumped in", "Aguantar la golpiza de entrada", "Aguentar a surra de entrada"), () => join(g, i, { He: -18, rep: 12 }, T("They beat you for thirteen seconds. You took it without falling. You're in.", "Te dieron golpes durante trece segundos. Aguantaste sin caerte. Ya estás adentro.", "Te bateram por treze segundos. Você aguentou sem cair. Está dentro."))],
        [T("Do a job for them", "Hacerles un trabajo", "Fazer um serviço para eles"), () => {
          if (busted(g, 0.15, "vandalism")) return;
          join(g, i, { rep: 10, money: 300, heat: 10 }, T("You tagged a rival's wall in broad daylight. They were impressed.", "Pintaste la pared de los rivales a plena luz del día. Quedaron impresionados.", "Você pichou o muro dos rivais em plena luz do dia. Eles ficaram impressionados."));
        }],
        [T("Back out", "Echarte para atrás", "Desistir"), () => notice(CAREER, T("You walked away. Maybe it's for the best.", "Te fuiste. Tal vez es lo mejor.", "Você foi embora. Talvez seja o melhor."), null, !0)],
      ],
    });
  }

  function join(g, i, f, text) {
    if (window.FL_CAREERS && !window.FL_CAREERS.canStart("Gang member")) return;
    Object.assign(g, { member: true, gang: i, rank: 0, rep: 0, heat: 0, years: 0, left: false, crew: makeCrew() });
    window.FL_GANGWARS && window.FL_GANGWARS.onJoin(g);
    const rows = fx(g, f);
    say(T("I joined a street gang.", "Me uní a una pandilla callejera.", "Entrei para uma gangue de rua."));
    card(T("Welcome to the crew", "Bienvenido a la pandilla", "Bem-vindo à gangue"), text, [["Gang", GANGS[i].name], ...rows], openGang);
  }

  // ---------------------------------------------------------------- acciones
  const ACTIONS = [
    {
      id: "hustle", icon: E("1f4b0"), min: 0,
      t: T("Hustle the Block", "Mover en la esquina", "Fazer corre na quebrada"),
      s: T("Make money on the corner", "Hacer plata en la esquina", "Fazer dinheiro na esquina"),
      run: (g) => {
        if (busted(g, 0.1, "drug dealing")) return;
        const rows = fx(g, { money: ri(400, 1200) * (1 + g.rank), rep: 3, heat: 12 });
        say(T("I hustled on the corner for my gang.", "Moví mercancía en la esquina para mi pandilla.", "Fiz corre na esquina para a minha gangue."));
        card(T("Hustle the Block", "Mover en la esquina", "Fazer corre na quebrada"), T("A long night on the corner, but the money was good.", "Una noche larga en la esquina, pero la plata estuvo buena.", "Uma noite longa na esquina, mas o dinheiro foi bom."), rows, openGang);
      },
    },
    {
      id: "tag", icon: E("1f58d-fe0f"), min: 0,
      t: T("Tag Territory", "Marcar territorio", "Marcar território"),
      s: T("Spray your colors on the walls", "Pintar tus colores en las paredes", "Pichar suas cores nos muros"),
      run: (g) => {
        if (busted(g, 0.06, "vandalism")) return;
        // marcar territorio da reputación: más mientras más cuadras controle tu pandilla (gangwars.js)
        const held = window.FL_GANGWARS ? window.FL_GANGWARS.blocksHeld(g) : 2;
        const rows = fx(g, { rep: 8 + clampN(held - 2, 0, 4), heat: 5 });
        say(T("I tagged my gang's territory.", "Marqué el territorio de mi pandilla.", "Marquei o território da minha gangue."));
        card(T("Tag Territory", "Marcar territorio", "Marcar território"), T("Everybody on the block knows whose streets these are now.", "Ahora todo el barrio sabe de quién son estas calles.", "Agora todo o bairro sabe de quem são essas ruas."), rows, openGang);
      },
    },
    {
      id: "protection", icon: E("1f4bc"), min: 2,
      t: T("Collect Protection Money", "Cobrar protección", "Cobrar proteção"),
      s: T("Shake down local businesses", "Sacarle plata a los negocios del barrio", "Cobrar dos comércios do bairro"),
      run: (g) => {
        if (busted(g, 0.12, "extortion")) return;
        const rows = fx(g, { money: ri(2000, 6000) * g.rank, rep: 4, heat: 15, H: -3 });
        say(T("I collected protection money from local businesses.", "Cobré protección a los negocios del barrio.", "Cobrei proteção dos comércios do bairro."));
        card(T("Collect Protection Money", "Cobrar protección", "Cobrar proteção"), T("The shop owners paid. They didn't look happy about it.", "Los dueños de los negocios pagaron. No se veían nada contentos.", "Os donos das lojas pagaram. Não pareciam nada felizes."), rows, openGang);
      },
    },
    {
      id: "rob", icon: E("1f45f"), min: 1,
      t: T("Rob a Rival", "Robarle a un rival", "Roubar um rival"),
      s: T("Hit a rival gang's stash", "Asaltar el escondite de otra pandilla", "Atacar o esconderijo de outra gangue"),
      run: (g) => {
        if (busted(g, 0.08, "burglary")) return;
        if (rnd() < 0.55 + gunPower(g)) {
          const rows = fx(g, { money: ri(1500, 5000) * (1 + g.rank), rep: 8, heat: 10 });
          say(T("I robbed a rival gang's stash.", "Le robé el escondite a una pandilla rival.", "Roubei o esconderijo de uma gangue rival."));
          return card(T("Rob a Rival", "Robarle a un rival", "Roubar um rival"), T("You got in and out clean. The crew is talking about you.", "Entraste y saliste limpio. La pandilla no deja de hablar de ti.", "Você entrou e saiu sem problemas. A gangue só fala de você."), rows, openGang);
        }
        const rows = fx(g, { He: -20, rep: -5 });
        say(T("A robbery against a rival gang went wrong.", "Un robo a una pandilla rival salió mal.", "Um roubo contra uma gangue rival deu errado."));
        card(T("Rob a Rival", "Robarle a un rival", "Roubar um rival"), T("They were waiting for you. You barely made it out.", "Te estaban esperando. Saliste de milagro.", "Eles estavam te esperando. Você escapou por pouco."), rows, openGang);
      },
    },
    {
      id: "rumble", icon: E("270a"), min: 1,
      t: T("Turf War", "Guerra por territorio", "Guerra por território"),
      s: T("Fight a rival crew for a block", "Pelear con otra pandilla por una cuadra", "Brigar com outra gangue por um quarteirão"),
      pre: (g) => {
        if (!window.FL_SHOOTER || state.age < 16) return true;
        const go = (play) => {
          spendAct(g);
          const a = ACTIONS.find((x) => x.id === "rumble");
          if (!play) return a.run(g);
          window.FL_SHOOTER.play({ ...(window.FL_GANGWARS ? window.FL_GANGWARS.shooterOpts(g, { map: "warehouse" }) : { enemies: 4, waves: 1, map: "warehouse" }), onEnd: (r) => a.run(g, !!r.win) });
        };
        jCard({
          tag: CAREER, iconSrc: ICON, title: T("Turf War", "Guerra por territorio", "Guerra por território"),
          lead: T("Your crew is rolling on a rival block tonight. Fight it yourself, or let the crew handle it?", "Tu pandilla va a caerle a una cuadra rival esta noche. ¿Peleas tú mismo o lo deja a la gente?", "Sua gangue vai cair num quarteirão rival hoje. Você luta por conta própria ou deixa a turma resolver?"),
          choices: [[T("Fight it yourself", "Pelear tú mismo", "Lutar você mesmo"), () => go(true)], [T("Let the crew handle it", "Que lo haga la gente", "Deixar a turma resolver"), () => go(false)], [T("Back", "Volver", "Voltar"), () => {}]],
        });
        return false;
      },
      run: (g, forced) => {
        if (busted(g, 0.1, "assault")) return;
        if (forced != null ? forced : rnd() < 0.5 + g.rank * 0.05 + gunPower(g)) {
          const rows = fx(g, { rep: 12, He: -10, heat: 15 });
          const blk = window.FL_GANGWARS ? window.FL_GANGWARS.turfWon(g) : null;
          if (blk) rows.push([T("Block taken", "Cuadra tomada", "Quarteirão tomado"), blk]);
          say(T("My gang won a turf war.", "Mi pandilla ganó una guerra por territorio.", "Minha gangue venceu uma guerra por território."));
          return card(T("Turf War", "Guerra por territorio", "Guerra por território"), T("Your crew took the block. You've got bruises, but it was worth it.", "Tu pandilla se quedó con la cuadra. Quedaste golpeado, pero valió la pena.", "Sua gangue ficou com o quarteirão. Você ficou machucado, mas valeu a pena."), rows, openGang);
        }
        const rows = fx(g, { rep: -8, He: -25, heat: 10 });
        const lost = window.FL_GANGWARS ? window.FL_GANGWARS.turfLost(g) : null;
        if (lost) rows.push([T("Block lost", "Cuadra perdida", "Quarteirão perdido"), lost]);
        say(T("My gang lost a turf war.", "Mi pandilla perdió una guerra por territorio.", "Minha gangue perdeu uma guerra por território."));
        card(T("Turf War", "Guerra por territorio", "Guerra por território"), T("The other crew had more people. You ended up in the hospital.", "La otra pandilla tenía más gente. Terminaste en el hospital.", "A outra gangue tinha mais gente. Você foi parar no hospital."), rows, openGang);
      },
    },
    {
      id: "recruit", icon: E("1f91d"), min: 3,
      t: T("Recruit", "Reclutar", "Recrutar"),
      s: T("Bring new blood into the crew", "Meter gente nueva a la pandilla", "Trazer gente nova para a gangue"),
      run: (g) => {
        const rows = fx(g, { rep: 6, heat: 4 });
        say(T("I recruited new members for my gang.", "Recluté miembros nuevos para mi pandilla.", "Recrutei novos membros para a minha gangue."));
        card(T("Recruit", "Reclutar", "Recrutar"), T("A few kids from the neighborhood are now under your wing.", "Unos chamacos del barrio ahora están bajo tu cuidado.", "Uns moleques do bairro agora estão sob suas ordens."), rows, openGang);
      },
    },
    {
      id: "operation", icon: E("1f3e2"), min: 4,
      t: T("Run the Operation", "Manejar el negocio", "Comandar a operação"),
      s: T("Big money, big risk", "Mucha plata, mucho riesgo", "Muito dinheiro, muito risco"),
      run: (g) => {
        if (busted(g, 0.14, "racketeering")) return;
        const rows = fx(g, { money: ri(20000, 60000) * (g.rank - 2), rep: 5, heat: 20, H: -2 });
        say(T("I ran my gang's whole operation this year.", "Manejé todo el negocio de mi pandilla este año.", "Comandei toda a operação da minha gangue este ano."));
        card(T("Run the Operation", "Manejar el negocio", "Comandar a operação"), T("Everything goes through you now. The money keeps coming.", "Ahora todo pasa por tus manos. La plata no deja de entrar.", "Agora tudo passa por você. O dinheiro não para de entrar."), rows, openGang);
      },
    },
    {
      id: "laylow", icon: E("1f3e0"), min: 0, free: true,
      t: T("Lay Low", "Esconderte un tiempo", "Ficar na moita"),
      s: T("Cool down the police heat", "Bajarle al calor de la policía", "Baixar a atenção da polícia"),
      run: (g) => {
        const rows = fx(g, { heat: -30, rep: -2, H: 3 });
        say(T("I laid low for a while.", "Me escondí por un tiempo.", "Fiquei na moita por um tempo."));
        card(T("Lay Low", "Esconderte un tiempo", "Ficar na moita"), T("You stayed home and kept your head down. The cops moved on.", "Te quedaste en casa sin llamar la atención. La policía se olvidó de ti.", "Você ficou em casa sem chamar atenção. A polícia te esqueceu."), rows, openGang);
      },
    },
  ];

  function leaveGang() {
    const g = G();
    iosConfirm(
      T("Leave the Gang", "Salirte de la pandilla", "Sair da gangue"),
      T("People don't just walk away from the crew. Are you sure?", "De la pandilla no se sale así nomás. ¿Estás seguro?", "Ninguém sai da gangue assim do nada. Tem certeza?"),
      () => {
        const hard = g.rank >= 2 && rnd() < 0.5;
        const rows = fx(g, hard ? { He: -30, H: -10 } : { H: 5 });
        g.member = false;
        g.left = true;
        window.FL_GANGWARS && window.FL_GANGWARS.onLeave(g);
        say(T("I left my gang.", "Me salí de mi pandilla.", "Saí da minha gangue."));
        card(
          T("Out of the Gang", "Fuera de la pandilla", "Fora da gangue"),
          hard
            ? T("They didn't let you go easy. You got beaten badly on your way out.", "No te dejaron ir fácil. Te dieron una golpiza al salir.", "Não te deixaram sair fácil. Você levou uma surra na saída.")
            : T("You told them you're done. Nobody stopped you.", "Les dijiste que ya no más. Nadie te detuvo.", "Você disse que estava fora. Ninguém te impediu."),
          rows,
          () => (typeof openOccupation === "function" ? openOccupation() : null),
        );
      },
    );
  }

  // ---------------------------------------------------------------- menú
  function row(id, icon, title, sub, dis, tail) {
    return `<div class="row${dis ? " dis" : ""}" id="${id}"><img src="${icon}"><div class="t"><b>${title}</b><span>${sub}</span></div>${dis ? "" : tail || (typeof DOTS !== "undefined" ? DOTS : "")}</div>`;
  }

  const gunSub = () => {
    const c = carried();
    const n = window.FL_ARMS && window.FL_ARMS.state() ? (window.FL_ARMS.state().guns || []).length : 0;
    return c ? `${T("Carrying", "Llevas", "Levando")}: ${c.name}` : n ? `${n} ${T("guns in your arsenal", "armas en tu arsenal", "armas no seu arsenal")}` : T("Legal store, street dealers, attachments and mags", "Tienda legal, dealers de la calle, accesorios y cargadores", "Loja legal, dealers da rua, acessórios e pentes");
  };

  function openGang() {
    const g = G();
    if (state.prison) return notice(CAREER, T("You can't do that from prison.", "No puedes hacer eso desde la cárcel.", "Você não pode fazer isso da prisão."), null, !0);
    if (!g.member) return joinMenu();
    if (!Array.isArray(g.crew) || !g.crew.length) g.crew = makeCrew(); // saves de antes de la gente
    if (g.gang >= GANGS.length) g.gang = 0;
    typeof syncProfile === "function" && syncProfile();
    screen.classList.add("open"); // por si venimos de una tarjeta que cerró la pantalla
    sTitle.textContent = CAREER.toUpperCase();
    sSub.style.display = "none";
    sBack.innerHTML = typeof BACK_ICON !== "undefined" ? BACK_ICON : "‹";
    sBack.onclick = () => (typeof openOccupation === "function" ? openOccupation() : screen.classList.remove("open"));
    const left = MAX_ACTS - g.yr.acts;
    const wm = window.FL_GANGWARS ? window.FL_GANGWARS.menu(g) : null; // gangwars.js: relaciones, territorio, cuerpos
    const piece = (p) => `<em style="font-style:normal">${p}</em>`;
    sList.innerHTML =
      `<div class="sec">${T("My Gang", "Mi pandilla", "Minha gangue")}</div>` +
      row("gStat", GANGS[g.gang].icon, gangName(g), [piece(rankName(g)), piece(`Rep ${g.rep}`), piece(`Heat ${g.heat}`)].join(" · "), false, " ") +
      row("gCrew", E("1f91d"), T("The Crew", "La gente", "A rapaziada"), [piece(`${g.crew.length} ${T("members", "miembros", "membros")}`)].join(""), false, typeof CHEV !== "undefined" ? CHEV : "") +
      (wm ? wm.html : "") +
      `<div class="sec">${T("Street Business", "Negocios de la calle", "Negócios da rua")}</div>` +
      ACTIONS.map((a) => {
        const locked = g.rank < a.min;
        const sub = locked ? `${T("Requires rank", "Requiere rango", "Requer patente")}: ${RANKS[a.min].t}` : !a.free && left <= 0 ? T("Done for this year", "Ya no más este año", "Chega por este ano") : a.s;
        return row(`gA_${a.id}`, a.icon, a.t, sub, locked || (!a.free && left <= 0));
      }).join("") +
      `<div class="sec">${T("Guns", "Armas", "Armas")}</div>` +
      row("gDealers", E("1f3ea"), T("Gun Dealers", "Vendedores de armas", "Vendedores de armas"), gunSub(), false, typeof CHEV !== "undefined" ? CHEV : "") +
      (carried() ? row("gHolster", E("1f45c"), T("Put It Away", "Guardarla", "Guardar"), T("Stop carrying a gun", "Dejar de andar armado", "Parar de andar armado")) : "") +
      `<div class="sec">${T("Get Out", "Salirte", "Sair")}</div>` +
      row("gLeave", E("1f6aa"), T("Leave the Gang", "Salirte de la pandilla", "Sair da gangue"), T("Walk away from the life", "Dejar esta vida", "Largar essa vida"));
    for (const a of ACTIONS) {
      const el = document.getElementById(`gA_${a.id}`);
      if (el && !el.classList.contains("dis"))
        el.onclick = () => {
          typeof play === "function" && play("choice");
          if (a.pre && a.pre(g) === false) return; // p. ej. "Spin" sin arma: no gasta la acción
          if (!a.free) g.yr.acts++;
          // andar armado calienta más a la policía
          const ah = window.FL_ARMS ? window.FL_ARMS.heat() : 0;
          if (ah && !a.free) g.heat = clampN(g.heat + ah, 0, 100);
          a.run(g);
        };
    }
    const dl = document.getElementById("gDealers");
    if (dl) dl.onclick = () => (typeof play === "function" && play("choice"), window.FL_ARMS && window.FL_ARMS.open(openGang));
    const hol = document.getElementById("gHolster");
    if (hol) hol.onclick = () => (window.FL_ARMS && window.FL_ARMS.stow(), openGang());
    wm && wm.bind();
    document.getElementById("gLeave").onclick = () => (typeof play === "function" && play("choice"), leaveGang());
    document.getElementById("gCrew").onclick = () => (typeof play === "function" && play("choice"), openCrew());
    sList.scrollTop = 0;
  }

  const ORDER = ["og", "big", "rapper", "hustler", "homie", "lil"];
  const fullName = (m) => `${m.first} "${m.nick}" ${m.last}`;

  function openCrew() {
    const g = G();
    sTitle.textContent = T("THE CREW", "LA GENTE", "A RAPAZIADA");
    sBack.onclick = openGang;
    const crew = g.crew.map((m, i) => ({ m, i })).sort((a, b) => ORDER.indexOf(a.m.role) - ORDER.indexOf(b.m.role) || b.m.age - a.m.age);
    let html = `<div class="sec">${gangName(g)}</div>`;
    for (const { m, i } of crew)
      html += `<div class="row" id="gM_${i}"><img src="${ROLES[m.role].icon}"><div class="t"><b>${m.nick}</b><span><em style="font-style:normal">${ROLES[m.role].t}</em> · <em style="font-style:normal">${`Age ${m.age}`}</em> · <em style="font-style:normal">${`Bond ${m.bond}`}</em></span></div>${typeof DOTS !== "undefined" ? DOTS : ""}</div>`;
    sList.innerHTML = html;
    for (const { i } of crew) document.getElementById(`gM_${i}`).onclick = () => (typeof play === "function" && play("choice"), memberCard(i));
    sList.scrollTop = 0;
  }

  function memberCard(i) {
    const g = G();
    const m = g.crew[i];
    const done = (g.yr.talked ||= []);
    const already = done.includes(i);
    const bond = (n) => (m.bond = clampN(m.bond + n, 0, 100));
    const choices = [
      [T("Hang out", "Pasar el rato", "Dar um rolê"), () => {
        if (already) return notice(m.nick, T("You already chilled with him this year.", "Ya pasaron el rato este año.", "Vocês já deram um rolê este ano."), null, !0);
        done.push(i);
        bond(ri(6, 14));
        const rows = fx(g, { H: 4 });
        say(T("I hung out with one of my homies from the gang.", "Pasé el rato con uno de mis homies de la pandilla.", "Dei um rolê com um dos meus parças da gangue."));
        card(m.nick, T("You chilled on the block, talked about life and laughed for hours.", "Se sentaron en la cuadra, hablaron de la vida y se rieron por horas.", "Vocês ficaram na quebrada, falaram da vida e riram por horas."), rows, openCrew);
      }],
    ];
    if (m.role === "og")
      choices.push([T("Ask for advice", "Pedirle consejo", "Pedir conselho"), () => {
        if (already) return notice(m.nick, T("He already gave you game this year.", "Ya te aconsejó este año.", "Ele já te aconselhou este ano."), null, !0);
        done.push(i);
        bond(4);
        const rows = fx(g, m.bond >= 50 ? { rep: 6, heat: -5 } : { rep: 2 });
        say(T("An OG from my gang gave me advice.", "Un OG de mi pandilla me dio consejos.", "Um OG da minha gangue me deu conselhos."));
        card(m.nick, m.bond >= 50
          ? T("He told you how to move smart and stay out of the cops' radar. Real game.", "Te explicó cómo moverte inteligente y no llamar la atención de la policía. Consejo de verdad.", "Ele te ensinou a agir esperto e ficar longe do radar da polícia. Papo reto.")
          : T("He looked at you and said you've got a lot to learn. Then he walked off.", "Te miró y te dijo que tienes mucho que aprender. Después se fue.", "Ele te olhou e disse que você tem muito a aprender. Depois foi embora."), rows, openCrew);
      }]);
    if (m.role === "rapper")
      choices.push([T("Hop on his track", "Meterte en su canción", "Participar da música dele"), () => {
        if (already) return notice(m.nick, T("You two already recorded this year.", "Ya grabaron juntos este año.", "Vocês já gravaram juntos este ano."), null, !0);
        done.push(i);
        bond(8);
        const hit = rnd() < 0.3;
        const rows = fx(g, hit ? { money: ri(3000, 15000), rep: 8, heat: 6, H: 8 } : { rep: 3, H: 3 });
        say(T("I recorded a verse on a song with a rapper from my gang.", "Grabé un verso en una canción con un rapero de mi pandilla.", "Gravei um verso numa música com um rapper da minha gangue."));
        card(m.nick, hit
          ? T("The song blew up in the city. Everyone knows your verse now.", "La canción pegó en toda la ciudad. Ahora todo el mundo se sabe tu verso.", "A música estourou na cidade. Agora todo mundo sabe o seu verso.")
          : T("The song got some plays around the neighborhood.", "La canción sonó un poco en el barrio.", "A música tocou um pouco no bairro."), rows, openCrew);
      }]);
    if (m.role === "hustler")
      choices.push([T("Ask to get put on", "Pedirle que te meta al negocio", "Pedir para entrar no esquema"), () => {
        if (already) return notice(m.nick, T("He already put you on this year.", "Ya te metió al negocio este año.", "Ele já te colocou no esquema este ano."), null, !0);
        done.push(i);
        if (busted(g, 0.08, "drug dealing")) return;
        bond(3);
        const rows = fx(g, { money: ri(800, 3000) * (1 + g.rank), heat: 8 });
        say(T("A hustler from my gang put me on a money move.", "Un buscavidas de mi pandilla me metió en un negocio.", "Um corre-certo da minha gangue me colocou num esquema."));
        card(m.nick, T("He showed you a quick money move. It paid off.", "Te enseñó un negocio rápido. Salió bien.", "Ele te mostrou um esquema rápido. Deu certo."), rows, openCrew);
      }]);
    choices.push([T("Back", "Volver", "Voltar"), openCrew]);
    jCard({
      tag: CAREER,
      iconSrc: ROLES[m.role].icon,
      title: m.nick,
      lead: fullName(m),
      rows: [
        ["Role", ROLES[m.role].t],
        ["Age", String(m.age)],
        ["Bond", `${m.bond}/100`],
      ],
      choices,
    });
  }

  // cada año la gente envejece; a veces alguien cae preso o se sale, y entra alguien nuevo
  function crewYear(g) {
    if (!Array.isArray(g.crew)) return;
    for (const m of g.crew) m.age++;
    for (const m of g.crew) if (m.role === "lil" && m.age >= 18) m.role = "homie";
    for (const m of g.crew) if (m.role === "homie" && m.age >= 25 && rnd() < 0.3) m.role = "big";
    for (const m of g.crew) if (m.role === "big" && m.age >= 35 && rnd() < 0.3) m.role = "og";
    if (rnd() < 0.35) {
      const i = Math.floor(rnd() * g.crew.length);
      const out = g.crew[i];
      const used = new Set(g.crew.map((m) => m.nick));
      g.crew[i] = makeMember("lil", used);
      say(rnd() < 0.6
        ? T("One of my homies from the gang got locked up.", "Agarraron preso a uno de mis homies de la pandilla.", "Prenderam um dos meus parças da gangue.")
        : T("One of my homies left the gang life.", "Uno de mis homies dejó la vida de pandilla.", "Um dos meus parças largou a vida do crime."));
      return out;
    }
  }

  // ---------------------------------------------------------------- eventos de fin de año
  const EVENTS = [
    {
      id: "raid", when: (g) => g.heat >= 40,
      title: T("Police Raid", "Redada policial", "Batida policial"),
      lead: T("The police raided your crew's hangout at dawn.", "La policía hizo una redada en el punto de tu pandilla al amanecer.", "A polícia fez uma batida no ponto da sua gangue de madrugada."),
      choices: [
        [T("Run", "Correr", "Correr"), (g) => (rnd() < 0.6 ? card(T("Police Raid", "Redada policial", "Batida policial"), T("You jumped a fence and got away.", "Saltaste una cerca y te escapaste.", "Você pulou uma cerca e escapou."), fx(g, { heat: 10 })) : busted(g, 1, "drug dealing"))],
        [T("Hide the stash", "Esconder la mercancía", "Esconder a mercadoria"), (g) => card(T("Police Raid", "Redada policial", "Batida policial"), T("They found nothing. The crew owes you one.", "No encontraron nada. La pandilla te debe una.", "Não acharam nada. A gangue te deve uma."), fx(g, { rep: 8, heat: -10 }))],
      ],
    },
    {
      id: "ambush", when: (g) => g.rank >= 1,
      title: T("Ambush", "Emboscada", "Emboscada"),
      lead: T("A rival crew jumped you on your way home.", "Una pandilla rival te cayó encima de camino a casa.", "Uma gangue rival te pegou no caminho de casa."),
      choices: [
        [T("Fight back", "Defenderte", "Revidar"), (g) => (rnd() < 0.5 ? card(T("Ambush", "Emboscada", "Emboscada"), T("You fought them off. Word spread fast.", "Te los quitaste de encima. La noticia corrió rápido.", "Você deu conta deles. A notícia se espalhou rápido."), fx(g, { rep: 10, He: -10 })) : card(T("Ambush", "Emboscada", "Emboscada"), T("There were too many of them.", "Eran demasiados.", "Eram muitos."), fx(g, { He: -25, rep: -3 })))],
        [T("Run for it", "Salir corriendo", "Sair correndo"), (g) => card(T("Ambush", "Emboscada", "Emboscada"), T("You got away, but the crew heard you ran.", "Te escapaste, pero la pandilla se enteró de que corriste.", "Você escapou, mas a gangue soube que você correu."), fx(g, { rep: -6 }))],
      ],
    },
    {
      id: "snitch", when: (g) => g.rank >= 2,
      title: T("Snitch in the Crew", "Un soplón en la pandilla", "Um X9 na gangue"),
      lead: T("You find out one of your crew has been talking to the cops.", "Te enteras de que alguien de tu pandilla ha estado hablando con la policía.", "Você descobre que alguém da sua gangue anda falando com a polícia."),
      choices: [
        [T("Tell the boss", "Decirle al jefe", "Contar para o chefe"), (g) => card(T("Snitch in the Crew", "Un soplón en la pandilla", "Um X9 na gangue"), T("The boss handled it. He won't forget you warned him.", "El jefe se encargó. No va a olvidar que le avisaste.", "O chefe resolveu. Ele não vai esquecer que você avisou."), fx(g, { rep: 12 }))],
        [T("Keep quiet", "Quedarte callado", "Ficar quieto"), (g) => card(T("Snitch in the Crew", "Un soplón en la pandilla", "Um X9 na gangue"), T("A few weeks later, the police knew everything.", "Unas semanas después, la policía sabía todo.", "Algumas semanas depois, a polícia sabia de tudo."), fx(g, { heat: 30 }))],
      ],
    },
    {
      id: "informant", when: (g) => g.heat >= 30 && state.age >= 16,
      title: T("Cop's Offer", "La oferta del policía", "A proposta do policial"),
      lead: T("A detective offers to make your charges disappear if you become his informant.", "Un detective te ofrece borrar tus cargos si te vuelves su informante.", "Um detetive oferece sumir com suas acusações se você virar informante dele."),
      choices: [
        [T("Become an informant", "Volverte informante", "Virar informante"), (g) => (rnd() < 0.7 ? card(T("Cop's Offer", "La oferta del policía", "A proposta do policial"), T("The heat is off. But you sleep with one eye open now.", "Ya no te persiguen. Pero ahora duermes con un ojo abierto.", "A polícia saiu do seu pé. Mas agora você dorme com um olho aberto."), fx(g, { heat: -60, H: -10 })) : card(T("Cop's Offer", "La oferta del policía", "A proposta do policial"), T("The crew found out you were snitching. They beat you and kicked you out.", "La pandilla descubrió que eras soplón. Te dieron una golpiza y te echaron.", "A gangue descobriu que você era X9. Te bateram e te expulsaram."), (g.member = false, fx(g, { He: -40, rep: -50 }))))],
        [T("Refuse", "Negarte", "Recusar"), (g) => card(T("Cop's Offer", "La oferta del policía", "A proposta do policial"), T("You told him you don't know anything. He promised he'd be watching.", "Le dijiste que no sabes nada. Te prometió que te iba a estar vigilando.", "Você disse que não sabe de nada. Ele prometeu ficar de olho em você."), fx(g, { rep: 5, heat: 10 }))],
      ],
    },
    {
      id: "mom", when: () => state.age <= 21,
      title: T("Mom Found Out", "Tu mamá se enteró", "Sua mãe descobriu"),
      lead: T("Your mom found your gang colors in your room. She's crying.", "Tu mamá encontró tus colores de la pandilla en tu cuarto. Está llorando.", "Sua mãe achou as cores da gangue no seu quarto. Ela está chorando."),
      choices: [
        [T("Promise to quit", "Prometerle que te sales", "Prometer que vai sair"), (g) => card(T("Mom Found Out", "Tu mamá se enteró", "Sua mãe descobriu"), T("She hugged you. Now you have to decide if you meant it.", "Te abrazó. Ahora te toca decidir si lo dijiste en serio.", "Ela te abraçou. Agora você tem que decidir se falou sério."), fx(g, { H: 6 }))],
        [T("Tell her it's your life", "Decirle que es tu vida", "Dizer que a vida é sua"), (g) => card(T("Mom Found Out", "Tu mamá se enteró", "Sua mãe descobriu"), T("She stopped talking to you for weeks.", "Dejó de hablarte por semanas.", "Ela parou de falar com você por semanas."), fx(g, { H: -12, rep: 3 }))],
      ],
    },
    {
      id: "loyalty", when: (g) => g.rank <= 2,
      title: T("Loyalty Test", "Prueba de lealtad", "Teste de lealdade"),
      lead: T("The crew asks you to hold a bag for them, no questions asked.", "La pandilla te pide que les guardes una bolsa, sin hacer preguntas.", "A gangue pede para você guardar uma bolsa, sem fazer perguntas."),
      choices: [
        [T("Hold it", "Guardarla", "Guardar"), (g) => (busted(g, 0.15, "drug dealing") ? null : card(T("Loyalty Test", "Prueba de lealtad", "Teste de lealdade"), T("They came back for it a week later. You passed the test.", "Volvieron por ella una semana después. Pasaste la prueba.", "Voltaram para buscar uma semana depois. Você passou no teste."), fx(g, { rep: 10, heat: 8 })))],
        [T("Say no", "Decir que no", "Dizer não"), (g) => card(T("Loyalty Test", "Prueba de lealtad", "Teste de lealdade"), T("They didn't like that. You're on thin ice now.", "No les gustó. Ahora estás en la cuerda floja.", "Eles não gostaram. Agora você está na corda bamba."), fx(g, { rep: -10 }))],
      ],
    },
    {
      id: "bail", when: (g) => g.rank >= 1 && state.age >= 16,
      title: T("Bail Money", "Dinero para la fianza", "Dinheiro da fiança"),
      lead: T("One of your boys got locked up and needs $2,000 for bail.", "Agarraron a uno de tus muchachos y necesita $2,000 para la fianza.", "Prenderam um dos seus parceiros e ele precisa de $2.000 para a fiança."),
      choices: [
        [T("Pay his bail", "Pagarle la fianza", "Pagar a fiança"), (g) => card(T("Bail Money", "Dinero para la fianza", "Dinheiro da fiança"), T("He's out, and he'll never forget it.", "Ya salió, y nunca lo va a olvidar.", "Ele saiu e nunca vai esquecer."), fx(g, { money: -2000, rep: 8 }))],
        [T("Leave him in there", "Dejarlo adentro", "Deixar ele lá"), (g) => card(T("Bail Money", "Dinero para la fianza", "Dinheiro da fiança"), T("The crew thinks you're cold.", "La pandilla cree que no tienes corazón.", "A gangue acha que você não tem coração."), fx(g, { rep: -6 }))],
      ],
    },
    {
      id: "truce", when: (g) => g.rank >= 3,
      title: T("Truce Offer", "Oferta de tregua", "Proposta de trégua"),
      lead: T("A rival gang leader wants to meet and talk about a truce.", "El líder de una pandilla rival quiere reunirse para hablar de una tregua.", "O líder de uma gangue rival quer se encontrar para falar de uma trégua."),
      choices: [
        [T("Accept the truce", "Aceptar la tregua", "Aceitar a trégua"), (g) => card(T("Truce Offer", "Oferta de tregua", "Proposta de trégua"), T("The streets got quieter. Business is better without the war.", "Las calles se calmaron. El negocio va mejor sin la guerra.", "As ruas ficaram mais calmas. O negócio vai melhor sem a guerra."), fx(g, { heat: -20, money: 5000, H: 5 }))],
        [T("It's a trap", "Es una trampa", "É uma armadilha"), (g) => card(T("Truce Offer", "Oferta de tregua", "Proposta de trégua"), T("You didn't show up. Maybe you were right, maybe not.", "No fuiste. Tal vez tenías razón, tal vez no.", "Você não apareceu. Talvez estivesse certo, talvez não."), fx(g, { rep: 3 }))],
      ],
    },
    {
      id: "car", when: (g) => g.rep >= 30,
      title: T("Message Received", "Mensaje recibido", "Recado dado"),
      lead: T("Somebody smashed every window of your car and left a rival gang sign.", "Alguien te rompió todas las ventanas del carro y dejó la seña de una pandilla rival.", "Alguém quebrou todos os vidros do seu carro e deixou o símbolo de uma gangue rival."),
      choices: [
        [T("Get revenge", "Vengarte", "Se vingar"), (g) => (busted(g, 0.12, "vandalism") ? null : card(T("Message Received", "Mensaje recibido", "Recado dado"), T("You paid them back twice as hard.", "Se la devolviste el doble de fuerte.", "Você devolveu em dobro."), fx(g, { rep: 8, heat: 12 })))],
        [T("Let it go", "Dejarlo pasar", "Deixar para lá"), (g) => card(T("Message Received", "Mensaje recibido", "Recado dado"), T("You fixed your car and moved on. Some say you've gone soft.", "Arreglaste el carro y seguiste. Algunos dicen que te ablandaste.", "Você consertou o carro e seguiu em frente. Tem gente dizendo que você amoleceu."), fx(g, { rep: -5, money: -800 }))],
      ],
    },
    {
      id: "kid", when: (g) => g.rank >= 3 && state.age >= 25,
      title: T("A Kid Wants In", "Un chamaco quiere entrar", "Um moleque quer entrar"),
      lead: T("A 13-year-old from your block begs you to let him join the crew.", "Un chamaco de 13 años de tu cuadra te ruega que lo dejes entrar a la pandilla.", "Um moleque de 13 anos do seu quarteirão implora para entrar na gangue."),
      choices: [
        [T("Let him in", "Dejarlo entrar", "Deixar entrar"), (g) => card(T("A Kid Wants In", "Un chamaco quiere entrar", "Um moleque quer entrar"), T("He's loyal and fast. He reminds you of yourself.", "Es leal y rápido. Te recuerda a ti mismo.", "Ele é leal e esperto. Te lembra você mesmo."), fx(g, { rep: 5, H: -4 }))],
        [T("Send him back to school", "Mandarlo de vuelta a la escuela", "Mandar de volta para a escola"), (g) => card(T("A Kid Wants In", "Un chamaco quiere entrar", "Um moleque quer entrar"), T("You told him this life isn't worth it. He listened.", "Le dijiste que esta vida no vale la pena. Te hizo caso.", "Você disse que essa vida não vale a pena. Ele te ouviu."), fx(g, { H: 10 }))],
      ],
    },
    {
      id: "shootout", when: (g) => g.rank >= 1,
      title: T("Gun Fight", "Tiroteo", "Tiroteio"),
      lead: T("A rival gang opened fire on you! Bullets flying everywhere!", "Una pandilla rival te disparó¡! Balas volando por todas partes!", "Uma gangue rival atirou¡! Balas voando por todos os lados!"),
      choices: [
        [T("Take cover", "Abrirte paso", "Procurar abrigo"), (g) => {
          // Screen shake, blood, and augh sound effects
          if (typeof screenShake !== 'undefined') screenShake();
          if (typeof setBloodScreen !== 'undefined') setBloodScreen();
          if (typeof playSound !== 'undefined') playSound('augh');
          const rows = fx(g, { He: -15, heat: 20 });
          return card(T("Gun Fight", "Tiroteo", "Tiroteio"), T("You found cover behind a wall. You're hurt but alive.", "Te cobaste detrás de una pared. Estás herido pero vivo.", "Você se abrigou atrás de uma parede. Está ferido mas vivo."), rows, openGang);
        }],
        [T("Return fire", "Responder fuego", "Retornar fogo"), (g) => {
          // Screen shake, blood, and augh sound effects
          if (typeof screenShake !== 'undefined') screenShake();
          if (typeof setBloodScreen !== 'undefined') setBloodScreen();
          if (typeof playSound !== 'undefined') playSound('augh');
          if (rnd() < 0.5 + g.rank * 0.1) {
            const rows = fx(g, { rep: 10, money: 500, heat: 20 });
            return card(T("Gun Fight", "Tiroteo", "Tiroteio"), T("You returned fire and drove them off!", "Respondiste el fuego y los asustaste!", "Você retornou o fogo e espantou-os!"), rows, openGang);
          } else {
            const rows = fx(g, { He: -20, heat: 25 });
            return card(T("Gun Fight", "Tiroteo", "Tiroteio"), T("You exchanged fire but got wounded.", "Intercambiaste fuego pero te heriste.", "Você trocou fogo mas ficou ferido."), rows, openGang);
          }
        }],
      ],
    },
  ];

  function yearTick() {
    const g = state.gangLife;
    if (!g || !g.v || !g.member || state.dead || state.prison) return;
    g.years++;
    const last = g.yr || { acts: 0 };
    // tu parte según el rango
    const cut = RANKS[g.rank].cut;
    if (cut) {
      const m = price(cut);
      state.money += m;
      g.earned += m;
    }
    g.heat = clampN(g.heat - 10, 0, 100);
    crewYear(g);
    if (!last.acts) g.rep = clampN(g.rep - 4, 0, 100);
    typeof renderStats === "function" && renderStats();
    const q = (fn) => (typeof queuePopup === "function" ? queuePopup(fn) : setTimeout(fn, 600));
    // ascenso
    const next = RANKS[g.rank + 1];
    if (next && g.rep >= next.rep) {
      g.rank++;
      say(T("I got promoted in my gang.", "Me ascendieron en la pandilla.", "Fui promovido na gangue."));
      q(() => card(T("Promotion", "Ascenso", "Promoção"), T("The crew respects you more than ever.", "La pandilla te respeta más que nunca.", "A gangue te respeita mais do que nunca."), [["Rank", next.t]]));
    }
    // gangwars.js: relaciones, territorio, retaliación, aliados
    try {
      window.FL_GANGWARS && window.FL_GANGWARS.yearTick(g, q, last);
    } catch (e) {
      console.warn("[gang] gangwars", e);
    }
    // evento del año
    if (rnd() < (last.acts ? 0.5 : 0.2)) {
      const ok = EVENTS.filter((e) => {
        const l = g.evDone[e.id];
        return (l == null || state.age - l >= 4) && e.when(g);
      });
      if (ok.length) {
        const e = pick(ok);
        g.evDone[e.id] = state.age;
        q(() =>
          jCard({
            tag: CAREER,
            iconSrc: ICON,
            title: e.title,
            lead: e.lead,
            choices: e.choices.map(([label, fn]) => [label, () => fn(g)]),
          }),
        );
      }
    }
    // yearTick no pasa por G(), que era el único que reiniciaba el contador del año: sin esto
    // `g.yr.acts` quedaba congelado en el último año con movidas, el evento salía con la
    // probabilidad alta para siempre y la reputación nunca bajaba por inactividad.
    g.yr = { age: state.age, acts: 0 };
  }

  // ---------------------------------------------------------------- arranque
  function boot() {
    if (typeof openSpecialCareers !== "function" || !document.getElementById("ageBtn") || typeof sList === "undefined")
      return setTimeout(boot, 60);
    const orig = openSpecialCareers;
    openSpecialCareers = function () {
      const r = orig.apply(this, arguments);
      try {
        const g = state.gangLife && state.gangLife.member ? state.gangLife : null;
        const sub = g ? `${gangName(g)} · ${rankName(g)}` : T("Run with a street gang. Rise from Prospect to Boss.", "Únete a una pandilla callejera. Sube de aspirante a jefe.", "Entre para uma gangue de rua. Suba de aspirante a chefão.");
        const html = `<div class="row sp-pack" id="spGang"><img src="${ICON}" alt=""><div class="t"><b>${CAREER}</b><span>${sub}</span></div>${typeof CHEV !== "undefined" ? CHEV : ""}</div>`;
        const first = sList.querySelector(".sp-pack");
        first ? first.insertAdjacentHTML("beforebegin", html) : sList.insertAdjacentHTML("beforeend", html);
        document.getElementById("spGang").onclick = () => (typeof play === "function" && play("choice"), openGang());
      } catch (e) {
        console.warn("[gang] menu", e);
      }
      return r;
    };
    document.getElementById("ageBtn").addEventListener("click", () =>
      setTimeout(() => {
        try {
          yearTick();
        } catch (e) {
          console.warn("[gang] yearTick", e);
        }
      }, 0),
    );
    window.FL_GANG = { open: openGang, state: () => state.gangLife, tick: yearTick };
    // API para gangwars.js / arms-events.js (comparten el estado, las tarjetas y las acciones de esta carrera)
    window.FL_GANG_API = { G, fx, card, busted, openGang, GANGS, ACTIONS, EVENTS, RANKS, ROLES, E, rnd, ri, pick, clampN, money, price, row, gunPower, carried, fullName, CAREER, ICON, MAX_ACTS, fxGun: () => (screenShake(), setBloodScreen(), playSound("augh")) };
    window.FL_GANG_STOW = () => {
      if (state.gangLife) state.gangLife.carry = null; // arms.js saca el arma vieja de la mano
    };
    const load = (src) => {
      const el = document.createElement("script");
      el.src = src;
      document.head.append(el);
    };
    if (!window.FL_ARMS) load("arms.js?v=15");
    if (!window.FL_GANGWARS) load("gangwars.js?v=5");
    if (!window.FL_ARMS_EVENTS) load("arms-events.js?v=1");
    if (!window.FL_SHOOTER) load("minigame-shooter.js?v=2");
    if (!window.FL_LIVE) load("golive.js?v=3");
  }
  boot();
})();
