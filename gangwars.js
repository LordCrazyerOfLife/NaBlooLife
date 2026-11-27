/* [mod] Gang Wars para Gang Bang (gangwars.js). Lo carga gang.js (código 13131313) y se cuelga de window.FL_GANG_API.
 * Inspirado en cómo funcionan las gangs de Chicago:
 *  - Dos alianzas grandes (Folks azul/negro vs People rojo/negro) y cliques independientes. Dentro de una misma alianza también
 *    hay beefs (GD vs BD). Cada pandilla tiene una relación contigo (aliado / amigable / neutral / tensión / opp) que se mueve
 *    con tus acciones y se propaga por la red ("el enemigo de mi amigo..."), y una matriz entre ellas que cambia sola cada año.
 *  - El territorio son cuadras con dueño. Dar un "spin" (pasar por la cuadra de un opp con tu arma) sube el contador de cuerpos,
 *    la reputación y el calor, y casi siempre trae retaliación (esos ciclos de revancha son el motor de la violencia).
 *  - Redes sociales y drill: diss tracks que escalan el beef. Treguas por mediación. Injunctions y casos federales contra los jefes.
 * Estado: state.gangLife.war (JSON puro). Textos: T("english", "español", "português") (add_chess_i18n.py los extrae).
 * REGLA: los textos de T() van entre comillas dobles, sin template literals.
 */
(() => {
  "use strict";
  if (window.FL_GANGWARS) return;
  const T = (en) => en;

  function boot() {
    if (!window.FL_GANG_API || typeof jCard !== "function" || typeof sList === "undefined") return setTimeout(boot, 80);
    try {
      init(window.FL_GANG_API);
    } catch (e) {
      console.warn("[gangwars] init", e);
    }
  }
  boot();

  function init(X) {
    const { G, fx, card, busted, GANGS, ACTIONS, EVENTS, E, rnd, ri, pick, clampN, money, price, row, openGang, CAREER, ICON, MAX_ACTS } = X;
    const chev = () => (typeof CHEV !== "undefined" ? CHEV : "");
    const piece = (p) => `<em style="font-style:normal">${p}</em>`;
    const tapSound = () => typeof play === "function" && play("choice");

    // ------------------------------------------------------------------ naciones, cuadras, estados
    const NATIONS = {
      folk: { t: T("Folks", "Folks", "Folks"), d: T("Blue and black, the right side of the body. Rivals of the People.", "Azul y negro, el lado derecho del cuerpo. Rivales de los People.", "Azul e preto, o lado direito do corpo. Rivais dos People.") },
      people: { t: T("People", "People", "People"), d: T("Red and black, the left side of the body. Rivals of the Folks.", "Rojo y negro, el lado izquierdo del cuerpo. Rivales de los Folks.", "Vermelho e preto, o lado esquerdo do corpo. Rivais dos Folks.") },
      indie: { t: T("Independent", "Independiente", "Independente"), d: T("A clique with no nation. Friends and enemies change block by block.", "Un clique sin nación. Amigos y enemigos cambian cuadra por cuadra.", "Um clique sem nação. Amigos e inimigos mudam quarteirão por quarteirão.") },
    };
    const BLOCK_NAMES = ["47th & Calumet", "Cottage Row", "Cedar Courts", "Maple Heights", "Ridge Park", "The Low End", "Dro Court", "Pine & 63rd", "Lakeview Row", "Harbor Flats", "Elm Street Homes", "Garfield Strip", "Union Yards", "Westside Bend", "Kenwood Alley", "Sunset Terrace"];
    const STATUS = {
      ally: T("Ally", "Aliado", "Aliado"), friendly: T("Friendly", "Amigable", "Amigável"), neutral: T("Neutral", "Neutral", "Neutro"),
      tension: T("Tension", "Tensión", "Tensão"), opp: T("Opp", "Opp", "Opp"),
    };
    const status = (r) => (r >= 45 ? "ally" : r <= -45 ? "opp" : r <= -20 ? "tension" : r >= 20 ? "friendly" : "neutral");
    const sign = (n) => (n > 0 ? "+" : "") + n;

    // ------------------------------------------------------------------ estado
    function makeMat() {
      const n = GANGS.length;
      const m = Array.from({ length: n }, () => Array(n).fill(0));
      for (let a = 0; a < n; a++) {
        m[a][a] = 100;
        for (let b = a + 1; b < n; b++) {
          const na = GANGS[a].nation, nb = GANGS[b].nation;
          let v;
          if (na !== "indie" && na === nb) v = 28;
          else if (na !== "indie" && nb !== "indie") v = -40;
          else v = ri(-22, 18);
          v += ri(-6, 6);
          if (a === 0 && b === 1) v = ri(-54, -47); // GD vs BD: misma nación, beef de toda la vida
          m[a][b] = m[b][a] = v;
        }
      }
      return m;
    }
    function makeBlocks() {
      const order = GANGS.map((_, i) => i).sort(() => rnd() - 0.5);
      return BLOCK_NAMES.map((name, i) => ({ name, owner: order[i % order.length] }));
    }
    const W = (g) => {
      const w = (g.war ||= {});
      if (!w.v) Object.assign(w, { v: 1, kills: 0, spins: 0, crewLost: 0, rel: {}, retal: {}, news: [], evDone: {}, yr: { age: -1, dip: 0 }, mat: makeMat(), blocks: makeBlocks(), gang: null });
      if (g.gang != null && w.gang !== g.gang) sync(g, w);
      if (!w.yr || w.yr.age !== state.age) w.yr = { age: state.age, dip: 0 };
      return w;
    };
    function sync(g, w) {
      w.gang = g.gang;
      w.retal = {};
      for (let x = 0; x < GANGS.length; x++) w.rel[x] = x === g.gang ? 100 : w.mat[g.gang][x];
      // tu pandilla siempre controla al menos 2 cuadras
      while (blocksOf(w, g.gang).length < 2) {
        const o = w.blocks.filter((b) => b.owner !== g.gang);
        pick(o).owner = g.gang;
      }
    }
    const blocksOf = (w, x) => w.blocks.filter((b) => b.owner === x);
    const others = (g) => GANGS.map((_, i) => i).filter((i) => i !== g.gang);
    const listBy = (g, w, fn) => others(g).filter((x) => fn(w.rel[x]));
    const allies = (g, w) => listBy(g, w, (r) => r >= 45);
    const opps = (g, w) => listBy(g, w, (r) => r <= -45);
    const avgBond = (g) => (g.crew && g.crew.length ? g.crew.reduce((s, m) => s + m.bond, 0) / g.crew.length : 40);
    const hasRapper = (g) => (g.crew || []).some((m) => m.role === "rapper");
    const news = (w, t) => {
      w.news.unshift({ t, a: state.age });
      w.news.length = Math.min(w.news.length, 8);
    };

    // mueve tu relación con X y la propaga por la red de la ciudad: el amigo de mi amigo, el enemigo de mi enemigo
    function shift(g, w, x, d, noProp) {
      if (x === g.gang) return;
      w.rel[x] = clampN(Math.round(w.rel[x] + d), -100, 100);
      if (noProp) return;
      for (const z of others(g)) {
        if (z === x) continue;
        const m = w.mat[x][z];
        if (m >= 40) w.rel[z] = clampN(Math.round(w.rel[z] + d * 0.3), -100, 100);
        else if (m <= -40) w.rel[z] = clampN(Math.round(w.rel[z] - d * 0.2), -100, 100);
      }
    }

    const sel = (o) => (typeof socSelCard === "function" ? socSelCard(o) : null);
    const info = (t, cb) => (typeof notice === "function" ? notice(CAREER, t, cb || null, !0) : null);
    const gunName = () => {
      const c = window.FL_ARMS && window.FL_ARMS.carried();
      return c ? c.name : "";
    };
    const hurtOrDie = (g, lo, hi) => {
      const rows = fx(g, { He: -ri(lo, hi) });
      if (state.stats && state.stats.Health < 15 && rnd() < 0.12 && typeof die === "function") setTimeout(() => die("a gunshot wound"), 300);
      return rows;
    };
    const murderRisk = (g, kills) => {
      if (!kills || rnd() > 0.16 + g.heat / 450 + 0.05 * kills) return false;
      const ar = window.FL_ARMS ? window.FL_ARMS.busted("murder") : null;
      setTimeout(() => typeof arrest === "function" && (ar ? arrest(ar.charge, ar.years) : arrest("murder")), 700);
      return true;
    };
    const bodyRow = (w) => [T("Opp body count", "Cuerpos de opps", "Corpos de opps"), String(w.kills)];

    // opciones del minijuego de disparos: 3-4 enemigos y tus homies como aliados (los de más confianza, 1 a 3 según tu rango y su bond)
    function shooterOpts(g, extra) {
      const crew = (g.crew || []).filter((m) => m.role !== "lil" || m.age >= 16).slice().sort((a, b) => b.bond - a.bond);
      const n = clampN(1 + (g.rank >= 2 ? 1 : 0) + (avgBond(g) >= 55 ? 1 : 0), 1, Math.min(3, crew.length || 1));
      return { enemies: ri(3, 4), waves: 1, allies: crew.length ? n : 0, allyNames: crew.slice(0, n).map((m) => m.nick), ...(extra || {}) };
    }

    // ------------------------------------------------------------------ noticias de la calle: lo que pasa entre las otras pandillas
    // cada plantilla: (a, b) -> [texto, cambio en la relación a-b (o null), tipo]. "s" = solo habla de una pandilla
    const NEWS = [
      { f: (a, b) => [`${A(a)} ${T("and", "y", "e")} ${A(b)} ${T("traded shots near", "se tirotearon cerca de", "trocaram tiros perto de")} ${pick(BLOCK_NAMES)}. ${T("Two people ended up in the hospital.", "Dos personas terminaron en el hospital.", "Duas pessoas foram parar no hospital.")}`, -10] },
      { f: (a, b) => [`${A(a)} ${T("and", "y", "e")} ${A(b)} ${T("are trading diss tracks. Both videos passed a million views.", "se están tirando diss tracks. Los dos videos pasaron el millón de vistas.", "estão trocando diss tracks. Os dois vídeos passaram de um milhão de views.")}`, -8] },
      { f: (a, b) => [`${A(a)} ${T("and", "y", "e")} ${A(b)} ${T("sat down with a mediator and stopped the shooting for now.", "se sentaron con un mediador y pararon los tiros por ahora.", "sentaram com um mediador e pararam os tiros por enquanto.")}`, 22] },
      { f: (a, b) => [`${A(a)} ${T("showed up to a funeral for", "fue al funeral de alguien de", "foi ao velório de alguém do")} ${A(b)}. ${T("Nobody said a word. Everybody noticed.", "Nadie dijo nada. Todos lo notaron.", "Ninguém disse nada. Todo mundo reparou.")}`, 12] },
      { f: (a, b) => [`${A(a)}${T("'s rapper dropped a track naming", " sacó una canción nombrando a", " lançou uma música citando o")} ${A(b)}. ${T("The block is talking.", "La cuadra no para de hablar.", "A quebrada não para de falar.")}`, -7] },
      { f: (a, b) => [`${A(a)} ${T("and", "y", "e")} ${A(b)} ${T("shared a barbecue in the park. Cops were confused.", "hicieron una parrillada juntos en el parque. La policía no entendía nada.", "fizeram um churrasco juntos no parque. A polícia ficou sem entender.")}`, 14] },
      { f: (a, b) => [`${T("A drive-by on", "Un tiroteo desde un carro en", "Um tiroteio de carro em")} ${pick(BLOCK_NAMES)} ${T("was blamed on", "se le culpa a", "foi atribuído ao")} ${A(a)}. ${A(b)} ${T("says it won't go unanswered.", "dice que no se va a quedar así.", "diz que não vai ficar assim.")}`, -14] },
      { f: (a) => [`${T("Police raided a spot linked to", "La policía hizo una redada en un punto de", "A polícia fez uma batida num ponto do")} ${A(a)}. ${T("Six arrests.", "Seis arrestos.", "Seis prisões.")}`, null, "s"] },
      { f: (a) => [`${T("A leader of", "Un líder de", "Um líder do")} ${A(a)} ${T("was arrested on conspiracy charges. The block is nervous.", "fue arrestado por conspiración. La cuadra está nerviosa.", "foi preso por conspiração. A quebrada está nervosa.")}`, null, "s"] },
      { f: (a) => [`${T("A rapper from", "Un rapero de", "Um rapper do")} ${A(a)} ${T("signed a record deal. The whole city is playing it.", "firmó un contrato discográfico. Toda la ciudad lo está poniendo.", "assinou um contrato de gravadora. A cidade toda tá tocando.")}`, null, "s"] },
      { f: (a) => [`${A(a)} ${T("held a back-to-school giveaway. Even the cops showed up to take pictures.", "hizo una entrega de útiles escolares. Hasta la policía vino a tomar fotos.", "fez uma doação de material escolar. Até a polícia veio tirar foto.")}`, null, "s"] },
      { f: (a) => [`${T("A judge issued a gang injunction covering", "Un juez emitió una orden contra pandillas que cubre a", "Um juiz emitiu uma ordem contra gangues que cobre o")} ${A(a)}. ${T("No more hanging out in groups on the corner.", "Se acabó juntarse en grupo en la esquina.", "Acabou ficar em grupo na esquina.")}`, null, "s"] },
      { f: (a) => [`${T("An OG from", "Un OG de", "Um OG do")} ${A(a)} ${T("passed away. Hundreds came to the funeral.", "falleció. Cientos fueron al funeral.", "faleceu. Centenas foram ao velório.")}`, null, "s"] },
      { f: (a) => [`${A(a)} ${T("is selling out of a new spot. The old heads don't like it.", "está vendiendo desde un punto nuevo. A los viejos no les gusta.", "está vendendo num ponto novo. Os mais velhos não gostam.")}`, null, "s"] },
      { f: (a, b) => [`${A(a)}${T("'s clique posted a video on the block of", " publicó un video en la cuadra de", " postou um vídeo na quebrada do")} ${A(b)}. ${T("That's an invitation.", "Eso es una invitación.", "Isso é um convite.")}`, -11] },
      { f: (a, b) => [`${A(a)} ${T("and", "y", "e")} ${A(b)} ${T("went to the same youth center and played ball together. Weird week.", "fueron al mismo centro juvenil y jugaron baloncesto juntos. Semana rara.", "foram ao mesmo centro de juventude e jogaram bola juntos. Semana estranha.")}`, 10] },
      { f: (a) => [`${T("A federal indictment named a dozen members of", "Una acusación federal nombró a una docena de miembros de", "Uma acusação federal citou uma dúzia de membros do")} ${A(a)}. ${T("The feds say it's racketeering.", "Los federales dicen que es crimen organizado.", "Os federais dizem que é crime organizado.")}`, null, "s"] },
      { f: (a, b) => [`${A(a)} ${T("snitch rumors are flying about", "rumores de soplón vuelan sobre", "boatos de X-9 rolam sobre")} ${A(b)}. ${T("Phones are off.", "Los teléfonos están apagados.", "Os celulares estão desligados.")}`, -9] },
      { f: (a) => [`${A(a)} ${T("went live and showed way too much of their block. Somebody screenshotted everything.", "salió en vivo y enseñó demasiado de su cuadra. Alguien capturó todo.", "entrou ao vivo e mostrou demais da quebrada. Alguém printou tudo.")}`, null, "s"] },
      { f: (a, b) => [`${A(a)} ${T("and", "y", "e")} ${A(b)} ${T("both showed up to the same peace march. Nobody looked at each other.", "fueron a la misma marcha por la paz. Nadie se miró.", "foram à mesma marcha pela paz. Ninguém se olhou.")}`, 9] },
      { f: (a) => [`${T("The corner store on", "La tienda de la esquina en", "A lojinha da esquina em")} ${pick(BLOCK_NAMES)} ${T("closed after the third shooting this year. It was neutral ground.", "cerró después del tercer tiroteo del año. Era territorio neutral.", "fechou depois do terceiro tiroteio do ano. Era território neutro.")}`, null, "s"] },
      { f: (a, b) => [`${T("Somebody tagged over the mural for a fallen homie on", "Alguien rayó el mural de un homie caído en", "Alguém pichou o mural de um parça que se foi em")} ${pick(BLOCK_NAMES)}. ${A(a)} ${T("blames", "le echa la culpa a", "culpa o")} ${A(b)}.`, -12] },
      { f: (a, b) => [`${A(a)} ${T("gave", "le dio a", "deu pro")} ${A(b)} ${T("a ride after their car broke down. Respect.", "un aventón después de que se les dañó el carro. Respeto.", "uma carona depois que o carro quebrou. Respeito.")}`, 11] },
    ];
    const A = (i) => GANGS[i].name;

    // ------------------------------------------------------------------ SPIN: pasar por la cuadra de un opp
    function spinTargets(g, w) {
      return w.blocks
        .map((b, i) => ({ b, i }))
        .filter(({ b }) => b.owner !== g.gang && status(w.rel[b.owner]) !== "ally")
        .sort((a, c) => w.rel[a.b.owner] - w.rel[c.b.owner])
        .slice(0, 8);
    }
    function spinPre(g) {
      if (state.age < 16) return info(T("You're too young to be rolling through other people's blocks.", "Eres muy joven para andar pasando por las cuadras de otros.", "Você é novo demais para ficar passando pelos quarteirões dos outros.")), false;
      if (!(window.FL_ARMS && window.FL_ARMS.carried())) {
        jCard({
          tag: CAREER, iconSrc: ICON,
          title: T("Spin the Block", "Dar un spin", "Dar um rolê armado"),
          lead: T("Nobody rolls through enemy territory empty-handed. Get a strap and carry it first.", "Nadie pasa por territorio enemigo con las manos vacías. Consigue un arma y llévala encima primero.", "Ninguém passa por território inimigo de mãos vazias. Arrume uma arma e leve com você primeiro."),
          choices: [[T("Gun Dealers", "Vendedores de armas", "Vendedores de armas"), () => window.FL_ARMS && window.FL_ARMS.open(openGang)], [T("Never mind", "Mejor no", "Deixa pra lá"), () => {}]],
        });
        return false;
      }
      const w = W(g);
      const t = spinTargets(g, w);
      if (!t.length) return info(T("There's nobody left to spin on. Everybody's an ally or a friend.", "No queda nadie a quien darle un spin. Todos son aliados o amigos.", "Não sobrou ninguém para dar um rolê. Todo mundo é aliado ou amigo.")), false;
      sel({
        tag: CAREER, icon: ICON,
        title: T("Spin the Block", "Dar un spin", "Dar um rolê armado"),
        lead: T("Pick whose block you're rolling through. Allies are off the list. This can get somebody killed.", "Elige la cuadra de quién vas a pasar. Los aliados no salen en la lista. Esto puede dejar a alguien muerto.", "Escolha o quarteirão de quem você vai passar. Aliados não aparecem na lista. Isso pode acabar com alguém morto."),
        label: T("Target:", "Objetivo:", "Alvo:"),
        opts: t.map(({ b }) => `${b.name} · ${GANGS[b.owner].name} (${STATUS[status(w.rel[b.owner])]})`),
        btn: T("Go spin", "Ir a dar el spin", "Ir dar o rolê"),
        onGo: (i) => {
          if (g.yr.acts >= MAX_ACTS) return info(T("You're done for this year.", "Ya no más este año.", "Chega por este ano."));
          g.yr.acts++;
          const ah = window.FL_ARMS ? window.FL_ARMS.heat() : 0;
          if (ah) g.heat = clampN(g.heat + ah, 0, 100);
          spinRun(g, w, t[i].b);
        },
      });
      return false; // la acción ya la maneja el selector
    }
    function spinRun(g, w, blk, opt) {
      const partner = opt && opt.partner != null ? opt.partner : null;
      const x = blk.owner;
      const name = GANGS[x].name;
      const power = window.FL_ARMS ? window.FL_ARMS.power() : 0;
      w.spins++;
      shift(g, w, x, -6);
      X.fxGun && X.fxGun();
      const title = T("Spin the Block", "Dar un spin", "Dar um rolê armado");
      const roll = rnd();
      if (roll < 0.1) {
        say(T("The police stopped me with a gun while I was spinning a rival block.", "La policía me paró con un arma mientras daba un spin por una cuadra rival.", "A polícia me parou com uma arma enquanto eu dava um rolê num quarteirão rival."));
        return void (busted(g, 1, "reckless endangerment") || card(title, T("A patrol car pulled you over.", "Una patrulla te paró.", "Uma viatura te parou."), fx(g, { heat: 10 }), openGang));
      }
      if (roll < 0.3) {
        const rows = fx(g, { rep: 2, heat: 5 });
        shift(g, w, x, -4);
        say(T("I rolled through a rival block, but nobody was out.", "Pasé por una cuadra rival, pero no había nadie afuera.", "Passei por um quarteirão rival, mas não tinha ninguém na rua."));
        return card(title, `${blk.name}: ${T("Nobody was outside. They'll hear you came through, though.", "No había nadie afuera. Pero se van a enterar de que pasaste.", "Não tinha ninguém na rua. Mas vão saber que você passou.")}`, [...rows, bodyRow(w)], openGang);
      }
      const s = clampN(0.42 + power * 1.1 + g.rank * 0.035 + (avgBond(g) / 100) * 0.1 + (partner != null ? 0.14 : 0), 0.25, 0.92);
      if (partner != null) shift(g, w, partner, ri(5, 10), true); // salir juntos los acerca pase lo que pase
      const fight = (won, fk) => {
      if (won) {
        const kills = fk != null ? fk : rnd() < 0.6 ? 1 : power >= 0.12 && rnd() < 0.4 ? 2 : 0;
        if (kills) {
          w.kills += kills;
          w.retal[x] = (w.retal[x] || 0) + kills;
          shift(g, w, x, -12 * kills);
          const rows = fx(g, { rep: 9 * kills, heat: 18 * kills, H: -4 });
          const caught = murderRisk(g, kills);
          say(T("I took out an opp while spinning a rival block.", "Me cargué a un opp dando un spin por una cuadra rival.", "Derrubei um opp dando um rolê num quarteirão rival."));
          return card(title, `${blk.name}: ${kills > 1 ? T("Shots rang out. Two of them went down before you pulled off.", "Sonaron los tiros. Dos de ellos cayeron antes de que te fueras.", "Os tiros estouraram. Dois deles caíram antes de você sair.") : T("Shots rang out. One of them went down. You were gone before anybody could follow.", "Sonaron los tiros. Uno de ellos cayó. Te fuiste antes de que alguien te siguiera.", "Os tiros estouraram. Um deles caiu. Você sumiu antes de alguém te seguir.")} ${name} ${T("will want it back.", "te lo va a querer devolver.", "vai querer revidar.")}`, [...rows, bodyRow(w), ...(caught ? [[T("Police", "Policía", "Polícia"), T("They have your plate", "Tienen tu placa", "Têm sua placa")]] : [])], openGang);
        }
        shift(g, w, x, -6);
        w.retal[x] = (w.retal[x] || 0) + 0.5;
        const rows = fx(g, { rep: 4, heat: 10 });
        say(T("I scared a rival gang off their own block.", "Espanté a una pandilla rival de su propia cuadra.", "Espantei uma gangue rival do próprio quarteirão."));
        return card(title, `${blk.name}: ${T("You let off a few rounds and they scattered. Nobody got hit, but the message was sent.", "Soltaste unos tiros y se dispersaron. Nadie salió herido, pero el mensaje llegó.", "Você soltou uns tiros e eles se espalharam. Ninguém foi atingido, mas o recado foi dado.")}`, [...rows, bodyRow(w)], openGang);
      }
      shift(g, w, x, -8);
      w.retal[x] = (w.retal[x] || 0) + 0.5;
      const rows = [...fx(g, { rep: -4, heat: 8 }), ...hurtOrDie(g, 18, 35)];
      say(T("A spin on a rival block went wrong and I got shot.", "Un spin por una cuadra rival salió mal y me dispararon.", "Um rolê num quarteirão rival deu errado e eu levei tiro."));
      card(title, `${blk.name}: ${T("They were waiting for you. You took one and barely made it out.", "Te estaban esperando. Te dieron y saliste de milagro.", "Eles estavam te esperando. Você levou um tiro e escapou por pouco.")}`, [...rows, bodyRow(w)], openGang);
      };
      // con el minijuego: peleas tú mismo la balacera (si ganas y te quedó vida suben los cuerpos); si no, se resuelve por suerte
      if (window.FL_SHOOTER)
        return jCard({
          tag: CAREER, iconSrc: ICON, title,
          lead: `${blk.name}: ${partner != null ? GANGS[partner].short + " " + T("is rolling with you. Shots are flying.", "va contigo. Están volando los tiros.", "está com você. Os tiros estão voando.") + " " : ""}${T("Shots are flying. Fight it out yourself, or leave it to luck?", "Están volando los tiros. ¿Peleas tú mismo o lo dejas a la suerte?", "Os tiros estão voando. Você luta por conta própria ou deixa na sorte?")}`,
          choices: [
            [T("Fight it out", "Pelear", "Lutar"), () => FL_SHOOTER.play({ ...shooterOpts(g, { map: pick(["street", "warehouse", "park"]), ...(partner != null ? { allies: 3, allyNames: partnerNames(partner, 3) } : {}) }), onEnd: (r) => fight(!!r.win, r.win ? (r.hpLeft >= 50 && power >= 0.12 ? 2 : 1) : null) })],
            [partner != null ? T("Simulate it", "Simularlo", "Simular") : T("Leave it to luck", "Dejarlo a la suerte", "Deixar na sorte"), () => fight(rnd() < s)],
          ],
        });
      fight(rnd() < s);
    }
    ACTIONS.splice(Math.max(0, ACTIONS.findIndex((a) => a.id === "recruit")), 0, {
      id: "spin", icon: E("1f697"), min: 1, pre: spinPre,
      t: T("Spin the Block", "Dar un spin", "Dar um rolê armado"),
      s: T("Roll through enemy territory with your strap", "Pasar por territorio enemigo con tu arma", "Passar por território inimigo com sua arma"),
      run: () => {},
    });

    // ------------------------------------------------------------------ LIVE: burlarte de los opps en vivo (golive.js)
    const LV = (w) => (w.live ||= { count: 0, followers: 0, peak: 0, ban: {} });
    function liveBase(g, w) {
      const l = LV(w);
      if (!l.followers) l.followers = 150 + g.rep * 12 + g.rank * 150;
      return l;
    }
    function livePre(g) {
      if (!window.FL_LIVE) return info(T("Live streaming isn't available right now.", "Las lives no están disponibles ahora mismo.", "As lives não estão disponíveis agora.")), void 0;
      if (state.age < 13) return info(T("You're too young for the apps.", "Eres muy joven para las apps.", "Você é novo demais para os apps.")), void 0;
      const w = W(g);
      if ((w.yr.lives || 0) >= 2) return info(T("You already went live twice this year. Give people time to miss you.", "Ya hiciste dos lives este año. Dale tiempo a la gente para extrañarte.", "Você já fez duas lives este ano. Dê tempo para sentirem sua falta.")), void 0;
      const plats = window.FL_LIVE.platforms.filter((p) => !(LV(w).ban[p.id] > state.age - 1));
      if (!plats.length) return info(T("Every app has you banned for now.", "Todas las apps te tienen baneado por ahora.", "Todos os apps estão com você banido por enquanto.")), void 0;
      sel({
        tag: CAREER, icon: E("1f4f1"), title: T("Go Live", "Hacer un live", "Fazer uma live"),
        lead: T("Pick the app. Every one has a different crowd, and different rules about what you can say.", "Elige la app. Cada una tiene un público distinto y reglas distintas sobre lo que puedes decir.", "Escolha o app. Cada um tem um público diferente e regras diferentes sobre o que dá pra falar."),
        label: T("App:", "App:", "App:"), opts: plats.map((p) => p.name), btn: T("Next", "Siguiente", "Próximo"),
        onGo: (i) => liveTarget(g, w, plats[i]),
      });
    }
    function liveTarget(g, w, plat) {
      const t = others(g).filter((x) => status(w.rel[x]) !== "ally").sort((a, b) => w.rel[a] - w.rel[b]).slice(0, 8);
      if (!t.length) return info(T("Everybody's an ally. Nobody to talk about.", "Todos son aliados. No hay de quién hablar.", "Todo mundo é aliado. Ninguém pra falar mal."));
      sel({
        tag: CAREER, icon: E("1f4f1"), title: T("Who are you talking about?", "¿De quién vas a hablar?", "De quem você vai falar?"),
        lead: T("The people watching will pick a side. So will they.", "La gente que te mira va a escoger un bando. Ellos también.", "Quem assiste vai escolher um lado. Eles também."),
        label: T("Target:", "Objetivo:", "Alvo:"), opts: t.map((x) => `${GANGS[x].name} (${STATUS[status(w.rel[x])]})`), btn: T("Go live", "Salir en vivo", "Entrar ao vivo"),
        onGo: (i) => liveGo(g, w, plat, t[i]),
      });
    }
    function liveGo(g, w, plat, x) {
      const l = liveBase(g, w);
      const gun = window.FL_ARMS ? window.FL_ARMS.carried() : null;
      w.yr.lives = (w.yr.lives || 0) + 1;
      l.count++;
      window.FL_LIVE.start({
        platform: plat.id,
        target: { name: GANGS[x].name, short: GANGS[x].short, icon: GANGS[x].icon },
        you: { name: state.first || "", handle: ((state.first || "me") + "_" + (state.last || "")).toLowerCase().replace(/[^a-z0-9_]/g, "").slice(0, 16) || "me", followers: l.followers, rank: g.rank, heat: g.heat, rep: g.rep },
        gun: gun ? { name: gun.name, illegal: !!gun.illegal } : null,
        hasRapper: hasRapper(g),
        duration: 5,
        onEnd: (r) => liveEnd(g, w, plat, x, r, gun),
      });
    }
    function liveEnd(g, w, plat, x, r, gun) {
      const l = liveBase(g, w);
      l.followers += r.newFollowers || 0;
      l.peak = Math.max(l.peak, r.peak || 0);
      if (r.banned) l.ban[plat.id] = state.age;
      const rows = fx(g, { money: Math.round(r.gifts || 0), rep: r.rep || 0, heat: r.heat || 0 });
      const before = w.rel[x];
      shift(g, w, x, r.rel || 0);
      if (r.retaliation || r.locationSlip) w.retal[x] = (w.retal[x] || 0) + (r.locationSlip ? 1 : 0.5);
      say(T("I went live and talked trash about a rival gang.", "Hice un live y hablé mal de una pandilla rival.", "Fiz uma live e falei mal de uma gangue rival."));
      const extra = [];
      if (r.flashedGun && gun && gun.illegal && rnd() < 0.3 + g.heat / 300) {
        const ar = window.FL_ARMS ? window.FL_ARMS.busted("illegal firearm possession") : null;
        setTimeout(() => typeof arrest === "function" && (ar ? arrest(ar.charge, ar.years) : arrest("illegal firearm possession")), 800);
        extra.push([T("Police", "Policía", "Polícia"), T("They saw the gun on stream", "Vieron el arma en el live", "Viram a arma na live")]);
      }
      card(T("Live ended", "Live terminado", "Live encerrada"), `${plat.name} · ${GANGS[x].name}. ${r.banned ? T("The app cut your stream.", "La app te cortó la transmisión.", "O app derrubou sua transmissão.") : r.retaliation ? T("They saw it, and they're not laughing.", "Lo vieron, y no se están riendo.", "Eles viram, e não estão rindo.") : T("The clip is going around.", "El clip anda circulando.", "O clipe está rodando.")}`, [
        [T("Peak viewers", "Pico de espectadores", "Pico de espectadores"), String(r.peak || 0)],
        [T("New followers", "Seguidores nuevos", "Novos seguidores"), `+${r.newFollowers || 0}`],
        ...rows,
        [T("Relation", "Relación", "Relação"), `${sign(w.rel[x] - before)} (${GANGS[x].short})`],
        ...extra,
      ], openGang);
    }



    // ------------------------------------------------------------------ RESPETO: pagar, juntarse, hacer canciones y salir a dar spin juntos
    const PNICKS = ["Tre", "Dre", "Big Moe", "Lil Ced", "Peanut", "Ghost", "Juju", "Bam", "Stacks", "Tank", "Kilo", "Duke"];
    const partnerNames = (x, n) => Array.from({ length: n }, (_, i) => `${GANGS[x].short} ${PNICKS[(x * 3 + i * 5) % PNICKS.length]}`);
    function respectMenu(g, w, x, c) {
      const r = w.rel[x];
      const cost = c.cost;
      const ch = [];
      ch.push([`${T("Pay respects", "Pagar respeto", "Pagar respeito")} · ${money(cost(1200))}`, c.payRespects]);
      if (r >= -15) ch.push([T("Link up", "Juntarse", "Se encontrar"), c.use(() => linkUp(g, w, x))]);
      if (r >= -10) ch.push([`${T("Make a song together", "Hacer una canción juntos", "Fazer uma música juntos")} · ${money(cost(1500))}`, c.use(() => songTogether(g, w, x))]);
      if (r >= 20) ch.push([T("Go spin together", "Ir a dar spin juntos", "Ir dar rolê juntos"), () => spinTogether(g, w, x)]);
      ch.push([T("Back", "Volver", "Voltar"), () => gangCard(x)]);
      jCard({
        tag: CAREER, iconSrc: GANGS[x].icon, title: `${T("Show respect to", "Mostrar respeto a", "Mostrar respeito ao")} ${GANGS[x].name}`,
        lead: r >= 20 ? T("You're on good terms. Hanging out, recording and rolling together is how that turns into an alliance.", "Se llevan bien. Juntarse, grabar y salir juntos es como eso se vuelve una alianza.", "Vocês estão bem. Se encontrar, gravar e sair juntos é como isso vira uma aliança.") : T("Start small. Some things only work once they trust you.", "Empieza chico. Algunas cosas solo funcionan cuando ya confían en ti.", "Comece pequeno. Algumas coisas só funcionam quando já confiam em você."),
        rows: [[T("Relation", "Relación", "Relação"), sign(r)]],
        choices: ch,
      });
    }
    function linkUp(g, w, x) {
      const scenes = [
        T("You pulled up to a cookout with their crew. Plates, dominoes and a lot of old stories.", "Llegaste a una parrillada con su gente. Platos, dominó y muchas historias viejas.", "Você chegou num churrasco com a turma deles. Pratos, dominó e muita história antiga."),
        T("You rode around the city with their boys with the music loud, no plans.", "Diste vueltas por la ciudad con su gente con la música alta, sin planes.", "Você rodou a cidade com a turma deles com o som alto, sem plano."),
        T("You played ball at the park, your block against theirs. Somebody got a bloody nose and everybody laughed.", "Jugaron baloncesto en el parque, tu cuadra contra la suya. A alguien le salió sangre de la nariz y todos se rieron.", "Vocês jogaram bola no parque, sua quebrada contra a deles. Alguém ficou com o nariz sangrando e todo mundo riu."),
        T("You sat on a stoop until 3 a.m. talking about who's not here anymore.", "Se sentaron en un portal hasta las 3 de la mañana hablando de los que ya no están.", "Vocês ficaram na calçada até as 3 da manhã falando de quem não tá mais aqui."),
      ];
      const bad = r_(w, x) < 15 && rnd() < 0.2;
      if (bad) {
        shift(g, w, x, -3);
        return card(T("Link up", "Juntarse", "Se encontrar"), T("Somebody said the wrong thing and it got tense. You left early, nobody got hurt.", "Alguien dijo algo que no debía y se puso tenso. Te fuiste temprano, nadie salió herido.", "Alguém falou o que não devia e ficou tenso. Você saiu cedo, ninguém se machucou."), fx(g, { rep: -1 }), openRelations);
      }
      shift(g, w, x, ri(7, 13));
      const rows = fx(g, { H: 5, rep: 1 });
      say(T("I hung out with another gang.", "Me junté con otra pandilla.", "Saí com outra gangue."));
      card(T("Link up", "Juntarse", "Se encontrar"), pick(scenes), [...rows, [T("Relation", "Relación", "Relação"), sign(w.rel[x]) + ` (${GANGS[x].short})`]], openRelations);
    }
    const r_ = (w, x) => w.rel[x];
    function songTogether(g, w, x) {
      const price1 = price(1500 * (1 + g.rank));
      const rap = hasRapper(g);
      if (state.money < price1) return info(T("You don't have enough money for the studio.", "No te alcanza para el estudio.", "Você não tem dinheiro pro estúdio."), openRelations);
      const chance = 0.3 + (rap ? 0.25 : 0) + w.rel[x] / 400 + g.rank * 0.02;
      const rows = fx(g, { money: -price1 });
      if (rnd() < chance) {
        shift(g, w, x, ri(12, 20));
        LV(w).followers += ri(300, 2500);
        const pay = ri(4000, 20000) * (1 + g.rank * 0.3);
        rows.push(...fx(g, { money: pay, rep: ri(6, 12), H: 8 }));
        news(w, `${GANGS[g.gang].short} ${T("and", "y", "e")} ${GANGS[x].short} ${T("dropped a song together. The streets are playing it everywhere.", "sacaron una canción juntos. Las calles la ponen en todos lados.", "lançaram uma música juntos. As ruas estão tocando em todo lugar.")}`);
        say(T("I made a song with another gang and it went crazy.", "Hice una canción con otra pandilla y se volvió loca.", "Fiz uma música com outra gangue e ela bombou."));
        return card(T("Song together", "Canción juntos", "Música juntos"), T("Two crews, one booth, one night. The song is a hit and neither of you has to explain why you're in the same video.", "Dos pandillas, un estudio, una noche. La canción es un hit y ninguno tiene que explicar por qué salen en el mismo video.", "Duas gangues, um estúdio, uma noite. A música é um hit e nenhum de vocês precisa explicar por que estão no mesmo clipe."), [...rows, [T("Relation", "Relación", "Relação"), sign(w.rel[x]) + ` (${GANGS[x].short})`]], openRelations);
      }
      shift(g, w, x, ri(5, 9));
      rows.push(...fx(g, { rep: 1, H: 3 }));
      say(T("I recorded a song with another gang.", "Grabé una canción con otra pandilla.", "Gravei uma música com outra gangue."));
      card(T("Song together", "Canción juntos", "Música juntos"), T("It was a good night in the studio, but the song didn't land. The respect did.", "Fue una buena noche en el estudio, pero la canción no pegó. El respeto sí.", "Foi uma boa noite no estúdio, mas a música não pegou. O respeito sim."), [...rows, [T("Relation", "Relación", "Relação"), sign(w.rel[x]) + ` (${GANGS[x].short})`]], openRelations);
    }
    function spinTogether(g, w, x) {
      if (state.age < 16) return info(T("You're too young for this.", "Eres muy joven para esto.", "Você é novo demais para isso."));
      if (!(window.FL_ARMS && window.FL_ARMS.carried())) return info(T("Nobody rolls with you empty-handed. Carry a gun first.", "Nadie sale contigo con las manos vacías. Lleva un arma primero.", "Ninguém sai com você de mãos vazias. Leve uma arma primeiro."), openRelations);
      if (g.yr.acts >= MAX_ACTS) return info(T("You're done for this year.", "Ya no más este año.", "Chega por este ano."), openRelations);
      const t = w.blocks
        .map((b) => ({ b }))
        .filter(({ b }) => b.owner !== g.gang && b.owner !== x && status(w.rel[b.owner]) !== "ally" && w.mat[x][b.owner] <= -15)
        .sort((a, c) => w.mat[x][a.b.owner] - w.mat[x][c.b.owner])
        .slice(0, 8);
      if (!t.length) return info(`${GANGS[x].name} ${T("doesn't have an enemy worth rolling on right now.", "no tiene ahorita un enemigo que valga la pena.", "não tem um inimigo que valha a pena agora.")}`, openRelations);
      sel({
        tag: CAREER, icon: GANGS[x].icon, title: `${T("Spin with", "Spin con", "Rolê com o")} ${GANGS[x].name}`,
        lead: T("Pick the block you're rolling through together. Their enemies, your target.", "Elige la cuadra por la que van a pasar juntos. Sus enemigos, tu objetivo.", "Escolha o quarteirão que vocês vão passar juntos. Inimigos deles, seu alvo."),
        label: T("Target:", "Objetivo:", "Alvo:"), opts: t.map(({ b }) => `${b.name} · ${GANGS[b.owner].name} (${STATUS[status(w.rel[b.owner])]})`), btn: T("Go", "Ir", "Ir"),
        onGo: (i) => {
          if (g.yr.acts >= MAX_ACTS) return info(T("You're done for this year.", "Ya no más este año.", "Chega por este ano."));
          g.yr.acts++;
          const ah = window.FL_ARMS ? window.FL_ARMS.heat() : 0;
          if (ah) g.heat = clampN(g.heat + ah, 0, 100);
          spinRun(g, w, t[i].b, { partner: x });
        },
      });
    }

    // ------------------------------------------------------------------ DISS: publicar, rimar, sacar una canción o rayar su pared
    const DISS_MAX = 3;
    const rng = (a, b) => ri(Math.min(a, b), Math.max(a, b));
    function openDiss(g, w, xPre) {
      if (state.age < 13) return info(T("You're too young for this.", "Eres muy joven para esto.", "Você é novo demais para isso."));
      if ((w.yr.diss || 0) >= DISS_MAX) return info(T("You've talked enough trash this year. Let it breathe.", "Ya soltaste suficientes diss este año. Déjalo respirar.", "Você já soltou diss demais este ano. Deixa respirar."));
      if (xPre != null) return dissFormat(g, w, xPre);
      const t = others(g).filter((x) => status(w.rel[x]) !== "ally").sort((a, b) => w.rel[a] - w.rel[b]).slice(0, 8);
      if (!t.length) return info(T("Everybody's an ally. Nobody to diss.", "Todos son aliados. No hay a quién dissear.", "Todo mundo é aliado. Ninguém pra dar diss."));
      sel({
        tag: CAREER, icon: E("1f3a4"), title: T("Diss", "Dissear", "Dar diss"),
        lead: T("Pick who you're coming for.", "Elige a quién le vas encima.", "Escolha em quem você vai."),
        label: T("Target:", "Objetivo:", "Alvo:"), opts: t.map((x) => `${GANGS[x].name} (${STATUS[status(w.rel[x])]})`), btn: T("Next", "Siguiente", "Próximo"),
        onGo: (i) => dissFormat(g, w, t[i]),
      });
    }
    function dissFormat(g, w, x) {
      if (state.age < 13) return;
      if ((w.yr.diss || 0) >= DISS_MAX) return info(T("You've talked enough trash this year. Let it breathe.", "Ya soltaste suficientes diss este año. Déjalo respirar.", "Você já soltou diss demais este ano. Deixa respirar."));
      const rap = hasRapper(g);
      jCard({
        tag: CAREER, iconSrc: GANGS[x].icon, title: `${T("Diss", "Dissear a", "Dar diss no")} ${GANGS[x].name}`,
        lead: `${T("How do you want to say it?", "¿Cómo quieres decirlo?", "Como você quer falar?")} ${T("Moves left this year:", "Movidas que te quedan este año:", "Movimentos restantes este ano:")} ${DISS_MAX - (w.yr.diss || 0)}`,
        rows: [[T("Relation", "Relación", "Relação"), sign(w.rel[x])], [T("Their blocks", "Sus cuadras", "Quarteirões deles"), String(blocksOf(w, x).length)]],
        choices: [
          [T("Post a diss", "Publicar un diss", "Postar um diss"), () => dissDo(g, w, x, "post")],
          [T("Spit a verse", "Soltar un verso", "Soltar um verso"), () => dissDo(g, w, x, "verse")],
          [rap ? T("Drop a diss track", "Sacar un diss track", "Lançar uma diss track") : `${T("Record a diss track", "Grabar un diss track", "Gravar uma diss track")} · ${money(price(2500))}`, () => dissDo(g, w, x, "track")],
          [T("Tag over their wall", "Rayar su pared", "Pichar o muro deles"), () => dissDo(g, w, x, "wall")],
          [T("Go live on them", "Hacer un live sobre ellos", "Fazer uma live sobre eles"), () => livePre(g)],
          [T("Back", "Volver", "Voltar"), () => {}],
        ],
      });
    }
    function dissDo(g, w, x, kind) {
      const rap = hasRapper(g);
      const bond = avgBond(g);
      const title = T("Diss", "Dissear", "Dar diss");
      const name = GANGS[x].name;
      if (kind === "track" && !rap && state.money < price(2500)) return info(T("You don't have enough money for a studio.", "No te alcanza para un estudio.", "Você não tem dinheiro pro estúdio."));
      if (kind === "wall" && busted(g, 0.1, "vandalism")) return;
      w.yr.diss = (w.yr.diss || 0) + 1;
      const C = {
        post: { rel: [-10, -18], rep: [3, 6], heat: 3, retal: 0.3, win: 0.78, hit: T("The post got views. They saw it, and so did their whole page.", "El post tuvo vistas. Lo vieron ellos y toda su página.", "O post teve views. Eles viram, e a página inteira deles também."), flop: T("It got ratioed in the comments. Their side is laughing.", "Le hicieron ratio en los comentarios. Su lado se está riendo.", "Tomou ratio nos comentários. O lado deles está rindo.") },
        verse: { rel: [-12, -20], rep: [5, 10], heat: 2, retal: 0.35, win: clampN(0.4 + bond / 250 + g.rank * 0.04, 0.3, 0.85), hit: T("You went bar for bar in front of the whole block. Even their people nodded.", "Rimaste barra por barra frente a toda la cuadra. Hasta su gente asintió.", "Você mandou rima por rima na frente da quebrada toda. Até o povo deles acenou."), flop: T("You lost the flow halfway. The block remembers.", "Perdiste el flow a la mitad. La cuadra se acuerda.", "Você perdeu o flow no meio. A quebrada lembra.") },
        track: { rel: [-18, -30], rep: [8, 14], heat: 5, retal: 0.5, win: rap ? 0.68 : 0.42, money: [3000, 15000], hit: T("The track blew up. Everybody has it in the car now.", "La canción explotó. Todo el mundo la tiene en el carro.", "A música estourou. Todo mundo tá com ela no carro."), flop: T("The beat was weak and the bars were weaker. Nobody shared it.", "El beat estaba flojo y las rimas más. Nadie lo compartió.", "O beat tava fraco e as rimas mais ainda. Ninguém compartilhou.") },
        wall: { rel: [-12, -18], rep: [4, 7], heat: 10, retal: 0.4, win: 0.8, hit: T("You tagged over their wall at night. They woke up to your colors.", "Rayaste su pared de noche. Despertaron con tus colores.", "Você pichou o muro deles de noite. Acordaram com suas cores."), flop: T("Somebody spotted you halfway through. You ran with half a tag.", "Alguien te vio a la mitad. Corriste con medio rayón.", "Alguém te viu no meio. Você correu com metade da pichação.") },
      }[kind];
      const cost = kind === "track" && !rap ? price(2500) : 0;
      const win = rnd() < C.win;
      let rows;
      if (win) {
        shift(g, w, x, rng(C.rel[0], C.rel[1]));
        rows = fx(g, { rep: rng(C.rep[0], C.rep[1]), heat: C.heat, money: (C.money ? rng(C.money[0], C.money[1]) : 0) - cost, H: 3 });
        if (kind === "track") LV(w).followers += ri(200, 1500);
      } else {
        shift(g, w, x, Math.round(rng(C.rel[0], C.rel[1]) / 2));
        rows = fx(g, { rep: -rng(3, 6), heat: Math.round(C.heat / 2), money: -cost, H: -4 });
      }
      let tail = "";
      if (rnd() < C.retal + (win ? 0.1 : 0)) {
        w.retal[x] = (w.retal[x] || 0) + 0.5;
        tail = ` ${name} ${T("answered back on the internet.", "respondió en internet.", "respondeu na internet.")}`;
        news(w, `${GANGS[g.gang].short} ${T("and", "y", "e")} ${GANGS[x].short} ${T("are going back and forth online.", "se están tirando de ida y vuelta en internet.", "estão trocando farpas na internet.")}`);
      }
      say(T("I dissed a rival gang.", "Le solté un diss a una pandilla rival.", "Soltei um diss numa gangue rival."));
      card(title, `${win ? C.hit : C.flop}${tail}`, [...rows, [T("Relation", "Relación", "Relação"), sign(w.rel[x]) + ` (${GANGS[x].short})`]], openGang);
    }

    // ------------------------------------------------------------------ pantalla de relaciones
    function frame(title, back) {
      screen.classList.add("open");
      sTitle.textContent = String(title).toUpperCase();
      sSub.style.display = "none";
      sBack.innerHTML = typeof BACK_ICON !== "undefined" ? BACK_ICON : "‹";
      sBack.onclick = back;
    }
    const names = (list) => (list.length ? list.map((x) => GANGS[x].short).join(", ") : T("none", "ninguno", "nenhum"));
    function theirFriends(w, x, g) {
      const a = [], o = [];
      for (let z = 0; z < GANGS.length; z++) {
        if (z === x) continue;
        const m = w.mat[x][z];
        if (m >= 40) a.push(z);
        else if (m <= -40) o.push(z);
      }
      return { a, o };
    }

    function openRelations() {
      const g = G();
      const w = W(g);
      frame(T("Gang Relations", "Relaciones", "Relações"), openGang);
      let html = `<div class="sec">${T("My Nation", "Mi nación", "Minha nação")}</div>`;
      const nat = NATIONS[GANGS[g.gang].nation];
      html += row("gwNation", GANGS[g.gang].icon, nat.t, piece(`${allies(g, w).length} ${T("allies", "aliados", "aliados")}`) + " · " + piece(`${opps(g, w).length} ${T("opps", "opps", "opps")}`), false, chev());
      if (w.news.length) html += `<div class="sec">${T("On the Streets", "En la calle", "Na rua")}</div>` + w.news.map((n, i) => row(`gwN_${i}`, E("1f4e3"), typeof n === "string" ? n : n.t, typeof n === "string" ? "" : `${T("Age", "Edad", "Idade")} ${n.a}`, true)).join("");
      html += `<div class="sec">${T("The Gangs", "Las pandillas", "As gangues")}</div>`;
      for (const x of others(g).sort((a, b) => w.rel[b] - w.rel[a])) {
        const st = status(w.rel[x]);
        html += row(`gwG_${x}`, GANGS[x].icon, GANGS[x].name, [piece(STATUS[st]), piece(`${sign(w.rel[x])}`), piece(NATIONS[GANGS[x].nation].t), piece(`${blocksOf(w, x).length} ${T("blocks", "cuadras", "quarteirões")}`)].join(" · "), false, chev());
      }
      html += `<div class="sec">${T("Territory", "Territorio", "Território")}</div>`;
      for (const b of w.blocks.slice().sort((a, c) => (a.owner === g.gang ? -1 : c.owner === g.gang ? 1 : a.owner - c.owner)))
        html += row(`gwB_${b.name}`, GANGS[b.owner].icon, b.name, b.owner === g.gang ? piece(T("Yours", "Tuya", "Sua")) : `${piece(GANGS[b.owner].name)} · ${piece(STATUS[status(w.rel[b.owner])])}`, true);
      sList.innerHTML = html;
      sList.scrollTop = 0;
      for (const x of others(g)) {
        const el = document.getElementById(`gwG_${x}`);
        if (el) el.onclick = () => (tapSound(), gangCard(x));
      }
      const nel = document.getElementById("gwNation");
      if (nel) nel.onclick = () => (tapSound(), nationCard());
    }
    function nationCard() {
      const g = G();
      const w = W(g);
      const nat = NATIONS[GANGS[g.gang].nation];
      jCard({
        tag: CAREER, iconSrc: GANGS[g.gang].icon, title: nat.t, lead: nat.d,
        rows: [[T("Allies", "Aliados", "Aliados"), names(allies(g, w))], [T("Opps", "Opps", "Opps"), names(opps(g, w))]],
        choices: [["OK", openRelations]],
      });
    }

    function diplomacyLeft(w) {
      return 2 - w.yr.dip;
    }
    function gangCard(x) {
      const g = G();
      const w = W(g);
      const r = w.rel[x];
      const st = status(r);
      const { a, o } = theirFriends(w, x, g);
      const cost = (n) => price(n * (1 + g.rank));
      const use = (fn) => () => {
        if (diplomacyLeft(w) <= 0) return info(T("You already made two moves with the other gangs this year.", "Ya hiciste dos movidas con las otras pandillas este año.", "Você já fez dois movimentos com as outras gangues este ano."), openRelations);
        w.yr.dip++;
        fn();
      };
      const done = (title, lead, rows) => card(title, lead, rows, openRelations);
      const choices = [];
      const payRespects = use(() => {
        if (state.money < cost(1200)) return info(T("You don't have enough money for that.", "No te alcanza para eso.", "Você não tem dinheiro para isso."), openRelations);
        if (st === "opp" && rnd() < 0.65) return done(GANGS[x].name, T("They didn't want your money. You're an opp to them, and they said so.", "No quisieron tu plata. Para ellos eres un opp, y te lo dijeron.", "Eles não quiseram seu dinheiro. Para eles você é um opp, e disseram isso."), fx(g, { rep: -2 }));
        const rows = fx(g, { money: -cost(1200) });
        shift(g, w, x, ri(7, 13));
        say(T("I paid my respects to another gang.", "Le mostré respeto a otra pandilla.", "Mostrei respeito a outra gangue."));
        done(GANGS[x].name, T("You sat down, kept it humble and left an envelope. They noticed.", "Te sentaste, fuiste humilde y dejaste un sobre. Lo notaron.", "Você sentou, foi humilde e deixou um envelope. Eles notaram."), [...rows, [T("Relation", "Relación", "Relação"), sign(w.rel[x])]]);
      });
      choices.push([T("Show respect", "Mostrar respeto", "Mostrar respeito"), () => respectMenu(g, w, x, { use, cost, done, payRespects, st })]);
      if (r >= 20 && g.rank >= 2 && st !== "ally")
        choices.push([`${T("Propose an alliance", "Proponer una alianza", "Propor uma aliança")} · ${money(cost(4000))}`, use(() => {
          if (state.money < cost(4000)) return info(T("You don't have enough money for that.", "No te alcanza para eso.", "Você não tem dinheiro para isso."), openRelations);
          const rows = fx(g, { money: -cost(4000) });
          if (rnd() < 0.35 + r / 250 + g.rank * 0.03) {
            shift(g, w, x, 55 - r);
            news(w, `${GANGS[g.gang].short} ${T("and", "y", "e")} ${GANGS[x].short} ${T("are running together now.", "andan juntos ahora.", "andam juntos agora.")}`);
            say(T("I made an alliance with another gang.", "Hice una alianza con otra pandilla.", "Fiz uma aliança com outra gangue."));
            return done(GANGS[x].name, T("You shook hands. Their blocks are safe for you and yours are safe for them. Their enemies are not happy about it.", "Se dieron la mano. Sus cuadras están a salvo para ti y las tuyas para ellos. A sus enemigos no les gustó nada.", "Vocês apertaram as mãos. Os quarteirões deles estão seguros para você e os seus para eles. Os inimigos deles não gostaram nada."), [...rows, [T("Status", "Estado", "Status"), STATUS.ally]]);
          }
          shift(g, w, x, -3);
          done(GANGS[x].name, T("They said they need more time. Don't push it.", "Dijeron que necesitan más tiempo. No los presiones.", "Disseram que precisam de mais tempo. Não force."), rows);
        })]);
      choices.push([T("Diss them", "Dissearlos", "Dar diss neles"), () => openDiss(g, w, x)]);
      if (r <= -20 && g.rank >= 3)
        choices.push([`${T("Offer a truce", "Ofrecer una tregua", "Oferecer uma trégua")} · ${money(cost(3000))}`, use(() => {
          if (state.money < cost(3000)) return info(T("You don't have enough money for that.", "No te alcanza para eso.", "Você não tem dinheiro para isso."), openRelations);
          const rows = fx(g, { money: -cost(3000) });
          if (rnd() < 0.3 + avgBond(g) / 300 + g.rank * 0.04) {
            w.retal[x] = 0;
            shift(g, w, x, Math.min(60, -10 - r), true);
            news(w, `${GANGS[g.gang].short} ${T("and", "y", "e")} ${GANGS[x].short} ${T("called a truce.", "firmaron una tregua.", "fizeram uma trégua.")}`);
            say(T("I helped broker a truce with a rival gang.", "Ayudé a pactar una tregua con una pandilla rival.", "Ajudei a fechar uma trégua com uma gangue rival."));
            return done(GANGS[x].name, T("A violence interrupter got everybody in the same room. The shooting stops, for now. Nobody posts anything.", "Un mediador juntó a todos en el mismo cuarto. Los tiros paran, por ahora. Nadie publica nada.", "Um mediador juntou todo mundo na mesma sala. Os tiros param, por enquanto. Ninguém posta nada."), [...rows, [T("Relation", "Relación", "Relação"), sign(w.rel[x])], ...fx(g, { heat: -10 })]);
          }
          shift(g, w, x, -6);
          done(GANGS[x].name, T("They laughed in your face. Too much blood between you two.", "Se rieron en tu cara. Hay demasiada sangre entre ustedes.", "Eles riram na sua cara. Tem sangue demais entre vocês."), rows);
        })]);
      if (r > -80 && g.rank >= 2)
        choices.push([T("Declare war", "Declarar la guerra", "Declarar guerra"), use(() => {
          shift(g, w, x, -90 - r + (r > -90 ? 0 : 0));
          w.rel[x] = Math.min(w.rel[x], -90);
          w.retal[x] = (w.retal[x] || 0) + 1;
          news(w, `${GANGS[g.gang].short} ${T("declared war on", "le declaró la guerra a", "declarou guerra contra")} ${GANGS[x].short}.`);
          const rows = fx(g, { rep: 6, heat: 8 });
          say(T("My gang declared war on another gang.", "Mi pandilla le declaró la guerra a otra pandilla.", "Minha gangue declarou guerra a outra gangue."));
          done(GANGS[x].name, T("There's no going back now. Watch your back and your car.", "Ya no hay vuelta atrás. Cuídate la espalda y el carro.", "Agora não tem volta. Cuide das costas e do carro."), rows);
        })]);
      choices.push([T("Back", "Volver", "Voltar"), openRelations]);
      jCard({
        tag: CAREER, iconSrc: GANGS[x].icon, title: GANGS[x].name,
        lead: `${NATIONS[GANGS[x].nation].t} · ${STATUS[st]}. ${T("Moves left this year:", "Movidas que te quedan este año:", "Movimentos restantes este ano:")} ${diplomacyLeft(w)}`,
        rows: [
          [T("Relation", "Relación", "Relação"), `${sign(r)}`],
          [T("Blocks", "Cuadras", "Quarteirões"), String(blocksOf(w, x).length)],
          [T("Their allies", "Sus aliados", "Aliados deles"), names(a)],
          [T("Their opps", "Sus opps", "Opps deles"), names(o)],
        ],
        choices,
      });
    }

    // ------------------------------------------------------------------ registro de guerra
    function warRecord() {
      const g = G();
      const w = W(g);
      jCard({
        tag: CAREER, iconSrc: E("2620-fe0f"), title: T("War Record", "Récord de guerra", "Ficha de guerra"),
        lead: w.kills ? T("Every name on that list has somebody who wants it settled.", "Cada nombre de esa lista tiene a alguien que quiere cobrarlo.", "Cada nome dessa lista tem alguém que quer cobrar.") : T("Nobody on your list. Yet.", "Nadie en tu lista. Todavía.", "Ninguém na sua lista. Ainda."),
        rows: [
          bodyRow(w),
          [T("Spins", "Spins", "Rolês armados"), String(w.spins)],
          [T("Homies lost", "Homies perdidos", "Parças perdidos"), String(w.crewLost)],
          [T("Blocks held", "Cuadras tuyas", "Quarteirões seus"), String(blocksOf(w, g.gang).length)],
          [T("Allies / Opps", "Aliados / Opps", "Aliados / Opps"), `${allies(g, w).length} / ${opps(g, w).length}`],
        ],
        choices: [["OK", openGang]],
      });
    }

    // ------------------------------------------------------------------ menú de Gang Bang (lo pinta gang.js)
    function menu(g) {
      const w = W(g);
      const html =
        `<div class="sec">${T("Gang War", "Guerra de pandillas", "Guerra de gangues")}</div>` +
        row("gwBody", E("2620-fe0f"), T("Opp Body Count", "Cuerpos de opps", "Corpos de opps"), [piece(`${w.kills}`), piece(`${w.spins} ${T("spins", "spins", "rolês")}`), piece(`${w.crewLost} ${T("homies lost", "homies perdidos", "parças perdidos")}`)].join(" · "), false, chev()) +
        row("gwDiss", E("1f3a4"), T("Diss", "Dissear", "Dar diss"), `${piece(`${DISS_MAX - (w.yr.diss || 0)} ${T("left this year", "te quedan este año", "restantes este ano")}`)} · ${piece(T("Posts, verses, tracks and tags", "Posts, versos, canciones y rayones", "Posts, versos, músicas e pichações"))}`, false, chev()) +
        row("gwLive", E("1f4f1"), T("Go Live", "Hacer un live", "Fazer uma live"), `${piece(`${Math.round(liveBase(g, w).followers)} ${T("followers", "seguidores", "seguidores")}`)} · ${piece(T("Talk trash about your opps", "Habla mal de tus opps", "Fale mal dos seus opps"))}`, false, chev()) +
        (w.news.length ? row("gwNews", E("1f4e3"), T("On the Streets", "En la calle", "Na rua"), typeof w.news[0] === "string" ? w.news[0] : w.news[0].t, false, chev()) : "") +
        row("gwRel", E("1f91d"), T("Gang Relations", "Relaciones", "Relações"), [piece(`${allies(g, w).length} ${T("allies", "aliados", "aliados")}`), piece(`${opps(g, w).length} ${T("opps", "opps", "opps")}`), piece(`${blocksOf(w, g.gang).length} ${T("blocks", "cuadras", "quarteirões")}`)].join(" · "), false, chev());
      return {
        html,
        bind: () => {
          const a = document.getElementById("gwBody");
          if (a) a.onclick = () => (tapSound(), warRecord());
          const b = document.getElementById("gwRel");
          if (b) b.onclick = () => (tapSound(), openRelations());
          const dd = document.getElementById("gwDiss");
          if (dd) dd.onclick = () => (tapSound(), openDiss(g, w));
          const nn = document.getElementById("gwNews");
          if (nn) nn.onclick = () => (tapSound(), openRelations());
          const c = document.getElementById("gwLive");
          if (c) c.onclick = () => (tapSound(), livePre(g));
        },
      };
    }

    // ------------------------------------------------------------------ territorio (lo llama la acción Turf War de gang.js)
    function turfWon(g) {
      const w = W(g);
      const t = w.blocks.filter((b) => b.owner !== g.gang && status(w.rel[b.owner]) !== "ally").sort((a, c) => w.rel[a.owner] - w.rel[c.owner]);
      if (!t.length) return null;
      const b = t[0];
      const was = b.owner;
      b.owner = g.gang;
      shift(g, w, was, -10);
      return b.name;
    }
    function turfLost(g) {
      const w = W(g);
      const mine = blocksOf(w, g.gang);
      if (mine.length <= 2 || rnd() > 0.6) return null;
      const b = pick(mine);
      const to = pick(others(g).filter((x) => status(w.rel[x]) !== "ally"));
      if (to == null) return null;
      b.owner = to;
      return b.name;
    }

    // ------------------------------------------------------------------ eventos de la guerra (uno por año, según la tensión)
    // cada uno: when(g,w) -> objetivo (o null) y make(g,w,x) -> {title, lead, icon?, choices}
    const gunOn = () => !!(window.FL_ARMS && window.FL_ARMS.carried());
    const WAR_EVENTS = [
      {
        id: "retal", weight: (g, w) => 1 + Object.values(w.retal).reduce((s, v) => s + v, 0) * 2,
        target: (g, w) => {
          const c = others(g).filter((x) => (w.retal[x] || 0) > 0 || w.rel[x] <= -45);
          return c.length ? c.sort((a, b) => (w.retal[b] || 0) - (w.retal[a] || 0) || w.rel[a] - w.rel[b])[0] : null;
        },
        make: (g, w, x) => {
          const n = GANGS[x].name;
          const T0 = T("They Spun Your Block", "Te dieron un spin en tu cuadra", "Deram um rolê na sua quebrada");
          return {
            title: T0, icon: GANGS[x].icon,
            lead: `${n} ${T("rolled through your block at night. A car slowed down, windows down.", "pasó por tu cuadra de noche. Un carro bajó la velocidad, con las ventanas abajo.", "passou pela sua quebrada de noite. Um carro diminuiu a velocidade, de vidros abertos.")}`,
            choices: [
              [T("Shoot back", "Responder los tiros", "Revidar os tiros"), () => {
                X.fxGun && X.fxGun();
                const power = window.FL_ARMS ? window.FL_ARMS.power() : 0;
                if (!gunOn()) return card(T0, T("You didn't have your strap on you. You hit the ground and prayed.", "No tenías el arma encima. Te tiraste al piso y rezaste.", "Você estava sem a arma. Se jogou no chão e rezou."), [...fx(g, { rep: -5, H: -6 }), ...hurtOrDie(g, 10, 25)], openGang);
                if (rnd() < clampN(0.45 + power * 1.1 + g.rank * 0.03, 0.2, 0.9)) {
                  const k = rnd() < 0.5 ? 1 : 0;
                  w.kills += k;
                  w.retal[x] = k ? (w.retal[x] || 0) + 1 : Math.max(0, (w.retal[x] || 0) - 1);
                  shift(g, w, x, k ? -10 : -3);
                  const rows = fx(g, { rep: 8, heat: k ? 14 : 8 });
                  const caught = k && rnd() < 0.08 + g.heat / 600 && (setTimeout(() => typeof arrest === "function" && arrest("manslaughter"), 700), true);
                  say(T("I shot back at a rival gang that came through my block.", "Les devolví los tiros a una pandilla rival que pasó por mi cuadra.", "Revidei os tiros de uma gangue rival que passou pela minha quebrada."));
                  return card(T0, k ? T("You emptied half a clip and one of them didn't get back up. Word travels fast.", "Soltaste medio cargador y uno de ellos no se levantó. La noticia vuela.", "Você descarregou meio pente e um deles não levantou mais. A notícia voa.") : T("You drove them off. They won't forget it, but neither will your block.", "Los espantaste. No lo van a olvidar, pero tu cuadra tampoco.", "Você os espantou. Eles não vão esquecer, mas sua quebrada também não."), [...rows, bodyRow(w), ...(caught ? [[T("Police", "Policía", "Polícia"), T("Under investigation", "Bajo investigación", "Sob investigação")]] : [])], openGang);
                }
                w.retal[x] = (w.retal[x] || 0) + 0.5;
                const rows = [...fx(g, { rep: -3 }), ...hurtOrDie(g, 18, 35)];
                card(T0, T("They were better prepared than you thought. You got hit.", "Estaban mejor preparados de lo que pensabas. Te dieron.", "Eles estavam mais preparados do que você pensava. Você levou um tiro."), rows, openGang);
              }],
              [T("Take cover and call 911", "Cubrirte y llamar al 911", "Se abrigar e ligar para o 190"), () => {
                const rows = fx(g, { H: -6, heat: -4, rep: -3 });
                w.retal[x] = Math.max(0, (w.retal[x] || 0) - 0.5);
                card(T0, T("The police came and found shell casings. Nobody got hurt. Some say you froze up.", "La policía vino y encontró casquillos. Nadie salió herido. Algunos dicen que te congelaste.", "A polícia veio e achou cápsulas. Ninguém se machucou. Tem gente dizendo que você congelou."), rows, openGang);
              }],
              [T("Call your boys", "Llamar a tus muchachos", "Chamar seus parceiros"), () => {
                if (rnd() < 0.55 + avgBond(g) / 400) {
                  w.retal[x] = Math.max(0, (w.retal[x] || 0) - 1);
                  return card(T0, T("Your crew rolled up in minutes. The other car was already gone, but everybody saw who showed up.", "Tu gente llegó en minutos. El otro carro ya se había ido, pero todos vieron quién apareció.", "Sua gangue chegou em minutos. O outro carro já tinha sumido, mas todo mundo viu quem apareceu."), fx(g, { rep: 6, heat: 6 }), openGang);
                }
                const m = pick(g.crew);
                w.crewLost++;
                w.pendingFuneral = m.nick;
                g.crew = g.crew.filter((c) => c !== m);
                g.crew.push({ role: "lil", nick: "Lil " + pick(["Man", "Zay", "Bo", "Tre", "Rob"]), first: "Jaylen", last: "Cole", age: 15, bond: 30 });
                card(T0, `${m.nick} ${T("got there first and caught one meant for you. He didn't make it.", "llegó primero y se llevó una bala que era para ti. No sobrevivió.", "chegou primeiro e levou um tiro que era seu. Ele não sobreviveu.")}`, fx(g, { H: -14, rep: -4 }), openGang);
              }],
            ],
          };
        },
      },
      {
        id: "funeral", weight: () => 5, cooldown: 1,
        target: (g, w) => (w.pendingFuneral ? (others(g).sort((a, b) => w.rel[a] - w.rel[b])[0] ?? null) : null),
        make: (g, w, x) => {
          const nick = w.pendingFuneral;
          w.pendingFuneral = null;
          const T0 = T("Funeral", "Funeral", "Velório");
          return {
            title: T0, icon: E("26b0-fe0f"),
            lead: `${T("The whole block shows up to bury", "Toda la cuadra viene a enterrar a", "O quarteirão inteiro vem enterrar")} ${nick}. ${T("Nobody says it out loud, but everybody is thinking about payback.", "Nadie lo dice en voz alta, pero todos piensan en vengarse.", "Ninguém fala em voz alta, mas todo mundo pensa em vingança.")}`,
            choices: [
              [`${T("Pay for the funeral", "Pagar el funeral", "Pagar o velório")} · ${money(price(6000))}`, () => card(T0, T("His mother held your hand. The crew saw it. You'll never be forgotten for that.", "Su mamá te tomó de la mano. La pandilla lo vio. Nunca te lo van a olvidar.", "A mãe dele segurou sua mão. A gangue viu. Nunca vão esquecer disso."), fx(g, { money: -6000, rep: 8, H: -4 }), openGang)],
              [T("Promise payback", "Prometer venganza", "Prometer vingança"), () => {
                w.retal[x] = (w.retal[x] || 0) + 2;
                shift(g, w, x, -15);
                card(T0, `${GANGS[x].name} ${T("will hear about it. The next spin is going to be yours.", "se va a enterar. El próximo spin va a ser tuyo.", "vai ficar sabendo. O próximo rolê vai ser seu.")}`, fx(g, { rep: 10, heat: 10 }), openGang);
              }],
              [T("Call for peace", "Pedir paz", "Pedir paz"), () => {
                shift(g, w, x, 12);
                w.retal[x] = 0;
                card(T0, T("You told the block that one more funeral is one too many. Some respected it, some called you soft.", "Le dijiste a la cuadra que un funeral más es uno de más. Unos lo respetaron, otros dijeron que te ablandaste.", "Você disse ao quarteirão que mais um velório é demais. Uns respeitaram, outros disseram que você amoleceu."), fx(g, { rep: -2, H: 6 }), openGang);
              }],
            ],
          };
        },
      },
      {
        id: "allycall", weight: () => 2, cooldown: 2,
        target: (g, w) => (allies(g, w).length ? pick(allies(g, w)) : null),
        make: (g, w, x) => {
          const T0 = T("An Ally Needs You", "Un aliado te necesita", "Um aliado precisa de você");
          return {
            title: T0, icon: GANGS[x].icon,
            lead: `${GANGS[x].name} ${T("is in a beef and their boys need backup tonight. They're calling the favor.", "está en un beef y su gente necesita refuerzos esta noche. Te están cobrando el favor.", "está num beef e a turma precisa de reforço hoje. Estão cobrando o favor.")}`,
            choices: [
              [T("Pull up", "Presentarte", "Aparecer"), () => {
                shift(g, w, x, 8);
                const e = (others(g).filter((z) => w.mat[x][z] <= -40 && z !== g.gang) || [])[0];
                if (e != null) shift(g, w, e, -8, true);
                if (rnd() < 0.4) return card(T0, T("It got loud. You came out with a bruise and a lot of respect.", "Se puso feo. Saliste con un moretón y mucho respeto.", "Ficou feio. Você saiu com um hematoma e muito respeito."), fx(g, { rep: 10, He: -10, heat: 12 }), openGang);
                card(T0, T("Nothing popped off. Just a long night in the car with your friends.", "No pasó nada. Solo una noche larga en el carro con tus panas.", "Não rolou nada. Só uma noite longa no carro com os amigos."), fx(g, { rep: 4, heat: 4 }), openGang);
              }],
              [`${T("Send money", "Mandar plata", "Mandar dinheiro")} · ${money(price(2500))}`, () => {
                shift(g, w, x, 5);
                card(T0, T("They took the cash. It's not the same as showing up, but it counts.", "Aceptaron la plata. No es lo mismo que aparecer, pero cuenta.", "Eles aceitaram o dinheiro. Não é o mesmo que aparecer, mas conta."), fx(g, { money: -2500, rep: 2 }), openGang);
              }],
              [T("Ignore the call", "Ignorar la llamada", "Ignorar a ligação"), () => {
                shift(g, w, x, -16);
                card(T0, T("They won't forget who didn't pick up.", "No van a olvidar quién no contestó.", "Eles não vão esquecer quem não atendeu."), fx(g, { rep: -4 }), openGang);
              }],
            ],
          };
        },
      },
      {
        id: "diss", weight: (g, w) => 2 + opps(g, w).length, cooldown: 2,
        target: (g, w) => { const c = others(g).filter((x) => w.rel[x] <= -20); return c.length ? pick(c) : null; },
        make: (g, w, x) => {
          const T0 = T("A Diss Track Drops", "Sale un diss track", "Sai uma faixa de diss");
          return {
            title: T0, icon: E("1f3a4"),
            lead: `${T("A rapper from", "Un rapero de", "Um rapper da")} ${GANGS[x].name} ${T("just dropped a video naming your block and laughing about it. It already has a million views.", "acaba de sacar un video nombrando tu cuadra y burlándose. Ya tiene un millón de vistas.", "acabou de lançar um clipe citando sua quebrada e rindo disso. Já tem um milhão de views.")}`,
            choices: [
              [T("Answer on a beat", "Responder en un beat", "Responder num beat"), () => {
                shift(g, w, x, -10);
                const hit = hasRapper(g) && rnd() < 0.45;
                if (rnd() < 0.3) w.retal[x] = (w.retal[x] || 0) + 1;
                card(T0, hit ? T("Your rapper homie went off. The answer is bigger than the original.", "Tu rapero se desató. La respuesta es más grande que el original.", "Seu parceiro rapper mandou bem. A resposta ficou maior que o original.") : T("You answered. It got views, and a lot of hate.", "Respondiste. Tuvo vistas y mucho odio.", "Você respondeu. Teve views e muito ódio."), fx(g, hit ? { rep: 8, money: ri(2000, 9000), heat: 4 } : { rep: 3, heat: 3 }), openGang);
              }],
              [T("Ignore it", "Ignorarlo", "Ignorar"), () => card(T0, T("You stayed off the internet. Some respected it. Others said you were scared.", "Te mantuviste fuera del internet. Unos lo respetaron. Otros dijeron que tenías miedo.", "Você ficou fora da internet. Uns respeitaram. Outros disseram que você estava com medo."), fx(g, { rep: -2, H: 2 }), openGang)],
              [T("Go spin them", "Ir a darles un spin", "Ir dar um rolê neles"), () => {
                shift(g, w, x, -14);
                w.retal[x] = (w.retal[x] || 0) + 1;
                card(T0, T("You answered with something louder than a song. The street will talk for a month.", "Respondiste con algo más fuerte que una canción. La calle va a hablar un mes.", "Você respondeu com algo mais alto que uma música. A rua vai falar por um mês."), fx(g, { rep: 7, heat: 16 }), openGang);
              }],
            ],
          };
        },
      },
      {
        id: "peace", weight: (g, w) => 1 + opps(g, w).length, cooldown: 3,
        target: (g, w) => { const c = others(g).filter((x) => w.rel[x] <= -30); return g.rank >= 2 && c.length ? pick(c) : null; },
        make: (g, w, x) => {
          const T0 = T("Peace Talks", "Mesa de paz", "Conversa de paz");
          return {
            title: T0, icon: E("1f91d"),
            lead: `${T("A community mediator wants you and", "Un mediador de la comunidad quiere reunirte con", "Um mediador da comunidade quer reunir você e")} ${GANGS[x].name} ${T("in a room before the next funeral. Phones off, no posting.", "en un cuarto antes del próximo funeral. Teléfonos apagados, nadie publica.", "numa sala antes do próximo velório. Celulares desligados, ninguém posta.")}`,
            choices: [
              [T("Go to the meeting", "Ir a la reunión", "Ir à reunião"), () => {
                if (rnd() < 0.5 + avgBond(g) / 300) {
                  w.retal[x] = 0;
                  shift(g, w, x, 30);
                  news(w, `${GANGS[g.gang].short} ${T("and", "y", "e")} ${GANGS[x].short} ${T("sat down and stopped the shooting.", "se sentaron y pararon los tiros.", "sentaram e pararam os tiros.")}`);
                  return card(T0, T("Everybody said their piece. Nobody walked out. The block breathed for the first time in months.", "Todos dijeron lo suyo. Nadie se paró. La cuadra respiró por primera vez en meses.", "Todo mundo falou o que tinha pra falar. Ninguém saiu. O quarteirão respirou pela primeira vez em meses."), fx(g, { heat: -15, H: 8, rep: 2 }), openGang);
                }
                shift(g, w, x, 8);
                card(T0, T("It got tense. Nobody left angry, but nothing was settled.", "Se puso tenso. Nadie salió enojado, pero no se arregló nada.", "Ficou tenso. Ninguém saiu bravo, mas nada foi resolvido."), fx(g, { H: -2 }), openGang);
              }],
              [T("Don't show up", "No aparecer", "Não aparecer"), () => card(T0, T("They took it as a no. The mediator said he'll try again, but he's tired of burying kids.", "Lo tomaron como un no. El mediador dijo que lo intentará otra vez, pero está cansado de enterrar muchachos.", "Eles entenderam como um não. O mediador disse que tenta de novo, mas está cansado de enterrar moleques."), fx(g, { rep: 3 }), openGang)],
              [T("It's a setup", "Es una trampa", "É uma armadilha"), () => {
                shift(g, w, x, -5);
                card(T0, T("You sent a lookout instead. Nothing happened. Maybe you were right, maybe not.", "Mandaste a un vigía. No pasó nada. Tal vez tenías razón, tal vez no.", "Você mandou um olheiro. Não rolou nada. Talvez estivesse certo, talvez não."), fx(g, { rep: 1 }), openGang);
              }],
            ],
          };
        },
      },
      {
        id: "betray", weight: () => 1, cooldown: 4,
        target: (g, w) => { const a = allies(g, w); return g.rank >= 1 && a.length ? pick(a) : null; },
        make: (g, w, x) => {
          const T0 = T("Backstab", "Traición", "Traição");
          return {
            title: T0, icon: GANGS[x].icon,
            lead: `${T("You hear", "Te llega el rumor de que", "Você fica sabendo que")} ${GANGS[x].name} ${T("has been sharing your moves with your opps for money.", "le ha estado pasando tus movimientos a tus opps por plata.", "anda passando seus passos para seus opps por dinheiro.")}`,
            choices: [
              [T("Confront them", "Confrontarlos", "Confrontar"), () => {
                if (rnd() < 0.5) { shift(g, w, x, -35); return card(T0, T("It was true. Your alliance is over.", "Era verdad. Se acabó su alianza.", "Era verdade. A aliança acabou."), fx(g, { rep: 4 }), openGang); }
                shift(g, w, x, -10);
                card(T0, T("It was a lie somebody planted. They're offended you believed it.", "Era mentira que alguien sembró. Se ofendieron de que lo creyeras.", "Era mentira que alguém plantou. Eles se ofenderam por você ter acreditado."), fx(g, { rep: -4 }), openGang);
              }],
              [T("Keep it quiet", "Callártelo", "Ficar quieto"), () => {
                if (rnd() < 0.4) { w.retal[pick(opps(g, w).length ? opps(g, w) : others(g))] = 1; return card(T0, T("A week later, somebody knew exactly where you'd be.", "Una semana después, alguien sabía exactamente dónde ibas a estar.", "Uma semana depois, alguém sabia exatamente onde você estaria."), [...fx(g, { heat: 8 }), ...hurtOrDie(g, 10, 24)], openGang); }
                card(T0, T("Nothing came of it. But you watch every move they make now.", "No pasó nada. Pero ahora vigilas cada movida que hacen.", "Nada aconteceu. Mas agora você vigia cada movimento deles."), fx(g, { H: -3 }), openGang);
              }],
            ],
          };
        },
      },
      {
        id: "nation", weight: () => 1, cooldown: 4,
        target: (g) => (g.rank >= 2 ? g.gang : null),
        make: (g, w) => {
          const T0 = T("Nation Meeting", "Reunión de la nación", "Reunião da nação");
          const nat = GANGS[g.gang].nation;
          const same = others(g).filter((x) => GANGS[x].nation === nat && nat !== "indie");
          return {
            title: T0, icon: GANGS[g.gang].icon,
            lead: nat === "indie"
              ? T("A few cliques with no nation want to link up and share intel against bigger crews. They want your name on it.", "Unos cuantos cliques sin nación quieren juntarse y compartir información contra pandillas más grandes. Quieren tu nombre en eso.", "Alguns cliques sem nação querem se juntar e compartilhar informação contra gangues maiores. Querem seu nome nisso.")
              : `${T("The", "Los", "Os")} ${NATIONS[nat].t} ${T("are calling a meeting. Everybody pays dues so the nation has your back, and everyone else's.", "convocan una reunión. Todos pagan una cuota para que la nación te cubra la espalda, y la de los demás.", "estão convocando uma reunião. Todo mundo paga uma cota para a nação cobrir você, e os outros.")}`,
            choices: [
              [`${T("Pay dues", "Pagar la cuota", "Pagar a cota")} · ${money(price(3000))}`, () => {
                for (const x of nat === "indie" ? others(g).filter((z) => GANGS[z].nation === "indie") : same) shift(g, w, x, 8, true);
                card(T0, T("You're in the room. Their guys say hi when they see you now.", "Estás en el cuarto. Ahora sus muchachos te saludan cuando te ven.", "Você está na sala. Agora a turma deles te cumprimenta quando te vê."), fx(g, { money: -3000, rep: 5 }), openGang);
              }],
              [T("Skip it", "Faltar", "Faltar"), () => {
                for (const x of nat === "indie" ? others(g).filter((z) => GANGS[z].nation === "indie") : same) shift(g, w, x, -5, true);
                card(T0, T("Nobody said anything, but they counted who wasn't there.", "Nadie dijo nada, pero contaron quién no estaba.", "Ninguém disse nada, mas contaram quem não estava."), fx(g, { rep: -2 }), openGang);
              }],
            ],
          };
        },
      },
      {
        id: "injunction", weight: (g) => (g.heat >= 35 ? 3 : 0), cooldown: 3,
        target: (g) => (g.heat >= 35 ? g.gang : null),
        make: (g, w) => {
          const T0 = T("Gang Injunction", "Orden contra pandillas", "Ordem contra gangues");
          return {
            title: T0, icon: E("1f6a8"),
            lead: T("A judge just banned known gang members from hanging out in groups in your area. A cop is already reading the names on the list. Yours is on it.", "Un juez acaba de prohibir que los miembros de pandillas conocidos se junten en grupo en tu zona. Un policía ya está leyendo los nombres de la lista. El tuyo está.", "Um juiz acabou de proibir membros de gangues conhecidos de se reunir em grupo na sua área. Um policial já está lendo os nomes da lista. O seu está nela."),
            choices: [
              [T("Comply and lay low", "Obedecer y bajarle", "Obedecer e ficar na moita"), () => card(T0, T("You stayed away from the block. The cops lost interest, and the crew lost some respect.", "Te alejaste de la cuadra. A la policía se le pasó el interés, y a la pandilla se le bajó el respeto.", "Você ficou longe do quarteirão. A polícia perdeu o interesse e a gangue perdeu um pouco de respeito."), fx(g, { heat: -18, rep: -5 }), openGang)],
              [T("Defy it", "Desafiarla", "Desafiar"), () => {
                if (rnd() < 0.3 + g.heat / 300) return void (busted(g, 1, "violating a gang injunction") || 0);
                card(T0, T("You kept hanging out in the open. Nobody touched you this time.", "Seguiste juntándote a la vista de todos. Esta vez nadie te tocó.", "Você continuou se juntando às claras. Dessa vez ninguém te tocou."), fx(g, { rep: 6, heat: 8 }), openGang);
              }],
            ],
          };
        },
      },
      {
        id: "rico", weight: (g) => (g.rank >= 3 && g.heat >= 50 ? 3 : 0), cooldown: 4,
        target: (g) => (g.rank >= 3 && g.heat >= 50 ? g.gang : null),
        make: (g, w) => {
          const T0 = T("Federal Task Force", "Fuerza federal", "Força-tarefa federal");
          return {
            title: T0, icon: E("1f6a8"),
            lead: T("Agents have been recording calls for months. A conspiracy case against the crew's leaders is coming down. They want shot callers, not kids.", "Los agentes llevan meses grabando llamadas. Viene un caso de conspiración contra los líderes de la pandilla. Quieren a los que mandan, no a los chamacos.", "Os agentes gravam ligações há meses. Vem aí um caso de conspiração contra os líderes da gangue. Querem quem manda, não os moleques."),
            choices: [
              [`${T("Hire a top lawyer", "Contratar a un abogado top", "Contratar um advogado top")} · ${money(price(20000))}`, () => {
                if (state.money < price(20000)) return card(T0, T("You couldn't pay. The lawyer you could afford was not the lawyer you needed.", "No pudiste pagar. El abogado que te alcanzaba no era el que necesitabas.", "Você não conseguiu pagar. O advogado que você podia pagar não era o que você precisava."), fx(g, { heat: 10 }), openGang);
                const rows = fx(g, { money: -20000, heat: -35 });
                card(T0, T("He found a hole in the wiretaps. The case fell apart.", "Encontró un hueco en las escuchas. El caso se cayó.", "Ele achou um furo nas escutas. O caso caiu."), rows, openGang);
              }],
              [T("Cooperate", "Cooperar", "Cooperar"), () => {
                g.member = false;
                window.FL_GANGWARS.onLeave(g);
                card(T0, T("You gave them what they wanted. The charges disappeared, and so did your life in the crew.", "Les diste lo que querían. Los cargos desaparecieron, y tu vida en la pandilla también.", "Você deu o que eles queriam. As acusações sumiram, e sua vida na gangue também."), fx(g, { heat: -80, rep: -60, H: -12 }), () => (typeof openOccupation === "function" ? openOccupation() : null));
              }],
              [T("Stay quiet", "Quedarte callado", "Ficar quieto"), () => void (busted(g, 1, "racketeering") || 0)],
            ],
          };
        },
      },
      {
        id: "clique", weight: () => 1, cooldown: 3,
        target: (g, w) => { const c = others(g).filter((x) => w.rel[x] < 20); return c.length ? pick(c) : null; },
        make: (g, w, x) => {
          const T0 = T("Rival Clique on Your Block", "Un clique rival en tu cuadra", "Um clique rival na sua quebrada");
          return {
            title: T0, icon: GANGS[x].icon,
            lead: `${T("A few kids from", "Unos muchachos de", "Uns moleques da")} ${GANGS[x].name} ${T("moved into the building next to your spot. They grew up with half your crew. Nobody started this, but it's about to.", "se mudaron al edificio al lado de tu punto. Crecieron con la mitad de tu gente. Nadie empezó esto, pero está por empezar.", "se mudaram para o prédio ao lado do seu ponto. Cresceram com metade da sua gangue. Ninguém começou isso, mas vai começar.")}`,
            choices: [
              [T("Run them off", "Sacarlos de ahí", "Expulsar"), () => { shift(g, w, x, -14); w.retal[x] = (w.retal[x] || 0) + 1; card(T0, T("They left by the weekend. Their people didn't take it well.", "Se fueron para el fin de semana. Su gente no lo tomó bien.", "Eles se foram até o fim de semana. A turma deles não levou bem."), fx(g, { rep: 7, heat: 8 }), openGang); }],
              [T("Live and let live", "Vive y deja vivir", "Viva e deixe viver"), () => { shift(g, w, x, 12); card(T0, T("Same corner, different colors. It works until it doesn't.", "La misma esquina, colores distintos. Funciona hasta que deja de funcionar.", "Mesma esquina, cores diferentes. Funciona até deixar de funcionar."), fx(g, { rep: -3, H: 3 }), openGang); }],
            ],
          };
        },
      },
      {
        id: "inside", weight: () => 1, cooldown: 3,
        target: (g) => g.gang,
        make: (g) => {
          const T0 = T("Word From Inside", "Mensaje desde adentro", "Recado de dentro");
          return {
            title: T0, icon: E("1f4f1"),
            lead: T("One of your homies, locked up, sent word through a cousin: he needs commissary money, and he says he's got information about who's coming for you.", "Uno de tus homies, preso, mandó un mensaje con un primo: necesita plata para la tienda de la cárcel y dice que tiene información de quién viene por ti.", "Um dos seus parças, preso, mandou recado por um primo: precisa de dinheiro pra cantina e diz que tem informação de quem está vindo atrás de você."),
            choices: [
              [`${T("Send money", "Mandar plata", "Mandar dinheiro")} · ${money(price(1500))}`, () => card(T0, T("He put you on game. You know exactly who's been watching your block.", "Te puso al tanto. Ahora sabes exactamente quién ha estado vigilando tu cuadra.", "Ele te passou o papo. Agora você sabe exatamente quem anda vigiando sua quebrada."), fx(g, { money: -1500, rep: 4, heat: -6 }), openGang)],
              [T("Ignore it", "Ignorarlo", "Ignorar"), () => card(T0, T("He'll remember. Prison has a long memory.", "Se va a acordar. La cárcel tiene memoria larga.", "Ele vai lembrar. A prisão tem memória longa."), fx(g, { rep: -3 }), openGang)],
            ],
          };
        },
      },
    ];

    // ------------------------------------------------------------------ cada año
    function yearTick(g, q) {
      const w = W(g);
      // las relaciones vuelven despacio a lo de siempre; las cuentas de la calle tardan en olvidarse
      for (const x of others(g)) w.rel[x] = clampN(Math.round(w.rel[x] + (w.mat[g.gang][x] - w.rel[x]) * 0.05), -100, 100);
      for (const x of Object.keys(w.retal)) if (w.retal[x] > 0 && rnd() < 0.35) w.retal[x] = Math.max(0, w.retal[x] - 1);
      // el mundo se mueve solo: 2 a 4 noticias por año entre las otras pandillas (beefs, treguas, redadas, raperos, funerales...)
      const nNews = ri(2, 4);
      for (let k = 0; k < nNews; k++) {
        const a = ri(0, GANGS.length - 1);
        let b = ri(0, GANGS.length - 1);
        if (b === a) b = (a + 1) % GANGS.length;
        const t = pick(NEWS);
        const solo = t.f(a, b)[2] === "s";
        if (!solo && (a === g.gang || b === g.gang)) continue; // lo tuyo lo cuentan tus acciones
        if (solo && a === g.gang) continue;
        const [txt, d] = t.f(a, b);
        if (d != null) {
          const old = w.mat[a][b];
          w.mat[a][b] = w.mat[b][a] = clampN(old + d + ri(-3, 3), -100, 100);
        }
        news(w, txt);
      }
      if (rnd() < 0.3) {
        const bl = pick(w.blocks);
        const to = pick(GANGS.map((_, i) => i).filter((i) => i !== bl.owner && i !== g.gang));
        if (bl.owner !== g.gang && to != null && rnd() < 0.5) {
          news(w, `${GANGS[to].name} ${T("took", "se quedó con", "tomou")} ${bl.name} ${T("from", "de", "de")} ${GANGS[bl.owner].name}.`);
          bl.owner = to;
        }
      }
      // plata: impuesto de tus cuadras y negocios con aliados
      const mine = blocksOf(w, g.gang).length;
      const ally = allies(g, w).length;
      const tax = mine * price(700 * (1 + g.rank)) + (g.rank >= 2 ? ally * price(1500 + 500 * g.rank) : 0);
      if (tax) {
        state.money += tax;
        g.earned += tax;
        if (ally) g.heat = clampN(g.heat - 2 * ally, 0, 100);
        typeof renderStats === "function" && renderStats();
      }
      // un evento de guerra al año, según la tensión
      const tension = Object.values(w.retal).reduce((s, v) => s + v, 0) + opps(g, w).length * 0.7;
      const funeral = !!w.pendingFuneral;
      if (!funeral && rnd() > Math.min(0.75, 0.22 + tension * 0.12)) return;
      const cand = [];
      for (const e of WAR_EVENTS) {
        const last = w.evDone[e.id];
        if (last != null && state.age - last < (e.cooldown ?? 2) && !(e.id === "retal" || e.id === "funeral")) continue;
        const x = e.target(g, w);
        if (x == null) continue;
        const wt = typeof e.weight === "function" ? e.weight(g, w) : 1;
        if (wt > 0) cand.push({ e, x, wt: funeral && e.id === "funeral" ? 100 : wt });
      }
      if (!cand.length) return;
      let r = rnd() * cand.reduce((s, c) => s + c.wt, 0);
      const c = cand.find((c) => (r -= c.wt) <= 0) || cand[0];
      w.evDone[c.e.id] = state.age;
      const spec = c.e.make(g, w, c.x);
      q(() => jCard({ tag: CAREER, iconSrc: spec.icon || ICON, title: spec.title, lead: spec.lead, choices: spec.choices }));
    }

    // ------------------------------------------------------------------ enganches
    function onJoin(g) {
      const w = W(g);
      sync(g, w);
    }
    function onLeave(g) {
      const w = g.war;
      if (w) w.retal = {};
    }
    window.FL_GANGWARS = { shooterOpts, blocksHeld: (g) => blocksOf(W(g), g.gang).length, menu, onJoin, onLeave, yearTick, turfWon, turfLost, openRelations, warRecord, state: () => (state.gangLife && state.gangLife.war) || null, status, WAR_EVENTS, shift, W };
  }
})();
