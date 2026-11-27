/* [mod] Eventos de armas + opción "sacar tu arma" en los atracos. Necesita arms.js (window.FL_ARMS).
 * 1) Cada año (Age up) puede salir un evento con tus armas (28 eventos). Se guarda en state.arms.evDone = {id: edad}.
 * 2) Si traes un arma encima, DANGER_EVENTS (Armed Robbery, Mugging, Home Invasion) y JEWEL_ROBBERY.EVENTS (los de pistola)
 *    ganan la opción "Pull your gun". API: window.FL_ARMS_EVENTS = { tick, EVENTS, patchRobberies }.
 * REGLA: los textos de T() van entre comillas dobles, sin template literals (add_chess_i18n.py los extrae).
 */
(() => {
  "use strict";
  const T = (en) => en;
  const E = (code) => `emoji/${code}.png`;
  const rnd = () => Math.random();
  const ri = (a, b) => a + Math.floor(rnd() * (b - a + 1));
  const clampN = (v, a, b) => Math.max(a, Math.min(b, v));
  const money = (n) => (typeof usd === "function" ? usd(n) : "$" + Math.round(n).toLocaleString("en-US"));
  const price = (n) => (!n ? 0 : typeof localPrice === "function" ? localPrice(n) : n);
  const TAG = T("Guns", "Armas", "Armas");
  const FA = () => window.FL_ARMS;

  // textos de las filas de resultado (para el extractor de i18n)
  T("Gun", "Arma", "Arma");
  T("Money", "Dinero", "Dinheiro");
  T("Health", "Salud", "Saúde");
  T("Happiness", "Felicidad", "Felicidade");
  T("Reputation", "Reputación", "Reputação");
  T("Police heat", "Calor policial", "Atenção da polícia");

  // ---------------------------------------------------------------- helpers
  const S = () => {
    FA().owned(); // crea state.arms si no existe
    return FA().state();
  };
  const owned = () => FA().owned();
  const carried = () => FA().carriedRaw();
  const def = (g) => FA().def(g.id) || {};
  const stt = (g) => FA().stats(g);
  const gname = (g) => FA().name(g);
  const gpic = (g) => FA().pic(g);
  const rpick = (arr) => arr[Math.floor(rnd() * arr.length)];
  const gang = () => (state.gangLife && state.gangLife.member ? state.gangLife : null);
  const say2 = (s) => typeof say === "function" && s && say(s);
  const q = (fn) => (typeof queuePopup === "function" ? queuePopup(fn) : setTimeout(fn, 600));
  const strongest = (list) => list.reduce((m, x) => (stt(x).power > stt(m).power ? x : m), list[0]);
  const trained = () => !!(FA().state() && FA().state().trained);

  // aplica efectos y devuelve las filas del resultado. f: {m (dinero, sin ajustar), He, H, rep, heat}
  function eff(f) {
    const rows = [];
    const sign = (n) => (n > 0 ? "+" : "") + n;
    if (f.m) {
      const m = Math.round(price(Math.abs(f.m))) * Math.sign(f.m);
      state.money = Math.max(0, state.money + m);
      if (m > 0 && typeof chaChing === "function") chaChing();
      rows.push(["Money", (m > 0 ? "+" : "-") + money(Math.abs(m))]);
    }
    if (state.stats) {
      for (const [k, name] of [["He", "Health"], ["H", "Happiness"]]) {
        if (!f[k]) continue;
        const b = state.stats[name] || 0;
        state.stats[name] = clampN(b + f[k], 0, 100);
        rows.push([name, sign(state.stats[name] - b)]);
      }
    }
    const g = gang();
    if (g && (f.rep || f.heat)) {
      if (window.FL_GANG_API && typeof FL_GANG_API.fx === "function") rows.push(...(FL_GANG_API.fx(g, { rep: f.rep || 0, heat: f.heat || 0 }) || []).filter((r) => r[0] === "Reputation" || r[0] === "Police heat"));
      else
        for (const [k, name, key] of [["rep", "Reputation", "rep"], ["heat", "Police heat", "heat"]]) {
          if (!f[k]) continue;
          const b = g[key] || 0;
          g[key] = clampN(b + f[k], 0, 100);
          if (g[key] !== b) rows.push([name, sign(g[key] - b)]);
        }
    }
    typeof renderStats === "function" && renderStats();
    return rows;
  }

  // herida de bala: baja salud, y con salud baja hay un riesgo pequeño de morir. true si murió
  function wound(lo, hi, risk, cause) {
    if (!state.stats) return false;
    const before = state.stats.Health || 50;
    state.stats.Health = clampN(before - ri(lo, hi), 0, 100);
    typeof renderStats === "function" && renderStats();
    if (state.stats.Health <= 0 || (before < 30 && rnd() < risk)) {
      setTimeout(() => typeof die === "function" && die(cause || "a gunshot wound"), 500);
      return true;
    }
    return false;
  }

  const takeGun = (g) => g && FA().take(g.uid);
  // arresto por el arma (si es ilegal, cargo por el arma; si no, el cargo que pases) y te la quitan
  function bust(g, charge, years) {
    let ch = charge || "illegal firearm possession", yrs = years || [2, 6];
    if (g) {
      const s = stt(g);
      if (s.auto) (ch = "possession of an automatic weapon"), (yrs = [6, 12]);
      else if (s.illegal) (ch = "illegal firearm possession"), (yrs = [2, 6]);
      takeGun(g);
      say2(T("The police confiscated my gun.", "La policía me quitó el arma.", "A polícia apreendeu minha arma."));
    }
    setTimeout(() => typeof arrest === "function" && arrest(ch, yrs), 50);
  }

  function out(c, title, lead, rows, sayTxt, icon) {
    say2(sayTxt);
    jCard({ tag: TAG, iconSrc: icon || c.icon, title, lead, rows: rows || [], choices: [["OK", () => {}]] });
  }
  const lab = (txt, cost) => (cost ? `${txt} (${money(price(cost))})` : txt);
  const pay = (c, cost, fn) => () => {
    if (state.money < price(cost)) return out(c, T("Not Enough Cash", "No te alcanza", "Sem grana"), T("You don't have enough money for that.", "No te alcanza para eso.", "Você não tem dinheiro para isso."));
    fn();
  };
  const NOPE = () => {};
  const CANCEL = T("Never mind", "Mejor no", "Deixa pra lá");

  // cargador legal según la familia del arma
  const MAG_BY_GRP = { glock: "glock:m03", ak: "ak:ext", ar: "ar:ext", smg: "smg:ext" };
  const ANTIQUE = ["p08", "c96", "tommy", "mp40", "mp38", "ppsh", "m1911", "m1911w", "m1911c"];
  const hunterGun = () => {
    const l = owned().filter((g) => def(g).hunt);
    return l.length ? strongest(l) : null;
  };
  const grpGun = () => {
    const l = owned().filter((g) => def(g).grp);
    return l.length ? rpick(l) : null;
  };
  const mainGun = () => carried() || (owned().length ? rpick(owned()) : null);
  const illGun = () => {
    const l = owned().filter((g) => stt(g).illegal);
    return l.length ? (carried() && stt(carried()).illegal ? carried() : rpick(l)) : null;
  };
  const legalGun = () => {
    const l = owned().filter((g) => !stt(g).illegal);
    return l.length ? (carried() && !stt(carried()).illegal ? carried() : rpick(l)) : null;
  };

  // ---------------------------------------------------------------- eventos
  // sel(): arma protagonista (null = el evento no aplica). cond(): condición extra. make(c): { lead, choices, rows? }
  const EVENTS = [
    {
      id: "range", t: T("Shooting Range", "Campo de tiro", "Estande de tiro"), sel: mainGun,
      make: (c) => ({
        lead: T("A new range opened a few blocks away. Lanes, paper targets and a guy selling stale coffee.", "Abrieron un campo de tiro a unas cuadras. Carriles, blancos de papel y un tipo vendiendo café viejo.", "Abriram um estande a alguns quarteirões. Raias, alvos de papel e um cara vendendo café velho."),
        choices: [
          [lab(T("Rent a lane", "Alquilar un carril", "Alugar uma raia"), 40), pay(c, 40, () => {
            if (rnd() < 0.25) out(c, T("Bullseye", "En el blanco", "Na mosca"), T("You put every shot in the middle. The guy next to you wants to shake your hand.", "Metiste todos los tiros en el centro. El tipo de al lado quiere darte la mano.", "Você acertou tudo no centro. O cara do lado quer apertar sua mão."), eff({ m: -40, H: ri(5, 9) }), T("I spent the afternoon at the range and hit every target.", "Pasé la tarde en el campo de tiro y le di a todos los blancos.", "Passei a tarde no estande e acertei todos os alvos."));
            else out(c, T("Range Day", "Día de campo", "Dia de estande"), T("You burned through a few boxes of ammo and cleared your head.", "Quemaste unas cajas de balas y despejaste la cabeza.", "Você gastou algumas caixas de munição e esvaziou a cabeça."), eff({ m: -40, H: ri(2, 6) }), T("I went to the shooting range.", "Fui al campo de tiro.", "Fui ao estande de tiro."));
          })],
          [T("Skip it", "Pasar", "Pular"), NOPE],
        ],
      }),
    },
    {
      id: "gunshow", t: T("Gun Show", "Feria de armas", "Feira de armas"), sel: grpGun,
      make: (c) => ({
        lead: T("There's a gun show in town. Booths full of mags, optics and old-timers who love to haggle.", "Hay una feria de armas en la ciudad. Puestos llenos de cargadores, miras y viejos que aman regatear.", "Tem uma feira de armas na cidade. Barracas cheias de pentes, miras e velhos que adoram pechinchar."),
        choices: [
          [T("Browse the booths", "Recorrer los puestos", "Passear pelas barracas"), () => {
            const key = MAG_BY_GRP[def(c.gun).grp];
            if (rnd() < 0.55 && key && FA().giveMag(key)) out(c, T("Free Magazine", "Cargador gratis", "Pente grátis"), T("A vendor gave you a magazine to try. It fits your gun.", "Un vendedor te regaló un cargador para probar. Le queda a tu arma.", "Um vendedor te deu um pente para testar. Serve na sua arma."), eff({ H: 3 }), T("I got a free magazine at a gun show.", "Me regalaron un cargador en una feria de armas.", "Ganhei um pente de graça numa feira de armas."));
            else out(c, T("Just Looking", "Solo mirando", "Só olhando"), T("Nothing worth buying today, but you learned a few things.", "Nada que valga la pena hoy, pero aprendiste algunas cosas.", "Nada que valesse a pena hoje, mas você aprendeu algumas coisas."), eff({ H: 2 }));
          }],
          [lab(T("Haggle for a red dot", "Regatear una mira de punto rojo", "Pechinchar uma mira de ponto vermelho"), 100), pay(c, 100, () => {
            if (rnd() < 0.6 && FA().givePart("reddot")) out(c, T("Good Deal", "Buen negocio", "Bom negócio"), T("You talked the price down. The red dot is in your parts box.", "Bajaste el precio. La mira de punto rojo está en tu caja de piezas.", "Você baixou o preço. A mira de ponto vermelho está na sua caixa de peças."), eff({ m: -100, H: 3 }), T("I haggled for a red dot sight at a gun show.", "Regateé una mira de punto rojo en una feria de armas.", "Pechinchei uma mira de ponto vermelho numa feira de armas."));
            else out(c, T("No Deal", "Sin trato", "Sem acordo"), T("He wouldn't budge and you wasted the afternoon.", "No cedió y perdiste la tarde.", "Ele não cedeu e você perdeu a tarde."), eff({ H: -2 }));
          })],
          [T("Skip it", "Pasar", "Pular"), NOPE],
        ],
      }),
    },
    {
      id: "neighbor", t: T("Angry Neighbor", "Vecino molesto", "Vizinho irritado"), sel: mainGun,
      make: (c) => ({
        lead: T("Your neighbor knocks on your door. He's tired of hearing gunshots from your backyard.", "Tu vecino toca la puerta. Ya está harto de oír disparos desde tu patio.", "Seu vizinho bate na porta. Ele cansou de ouvir tiros do seu quintal."),
        choices: [
          [T("Apologize", "Pedir disculpas", "Pedir desculpas"), () => out(c, T("Peace Made", "Paz hecha", "Paz feita"), T("You promised to keep it down. He nodded and left.", "Prometiste bajar el ruido. Asintió y se fue.", "Você prometeu fazer menos barulho. Ele concordou e foi embora."), eff({ H: 1 }), T("I apologized to my neighbor about the noise.", "Le pedí disculpas a mi vecino por el ruido.", "Pedi desculpas ao meu vizinho pelo barulho."))],
          [T("Tell him to mind his business", "Decirle que no se meta", "Mandar ele cuidar da vida dele"), () => {
            if (rnd() < 0.4) {
              const g = stt(c.gun).illegal ? c.gun : null;
              if (g) { say2(T("My neighbor called the cops on me.", "Mi vecino llamó a la policía.", "Meu vizinho chamou a polícia.")); return bust(g); }
              return out(c, T("Cops Showed Up", "Llegó la policía", "A polícia chegou"), T("He called the police. Your paperwork was fine, but it cost you a fine and an awkward hour.", "Llamó a la policía. Tus papeles estaban bien, pero te costó una multa y una hora incómoda.", "Ele chamou a polícia. Seus papéis estavam em ordem, mas custou uma multa e uma hora constrangedora."), eff({ m: -150, H: -4 }), T("My neighbor called the cops about my shooting.", "Mi vecino llamó a la policía por mis disparos.", "Meu vizinho chamou a polícia por causa dos meus tiros."));
            }
            out(c, T("He Backed Off", "Se echó para atrás", "Ele recuou"), T("He grumbled and went home. For now.", "Refunfuñó y se fue a su casa. Por ahora.", "Ele resmungou e voltou pra casa. Por enquanto."), eff({ H: -2 }));
          }],
          [T("Invite him to the range", "Invitarlo al campo de tiro", "Convidar para o estande"), () => out(c, T("New Shooting Buddy", "Nuevo pana de tiro", "Novo parceiro de tiro"), T("He loved it. Now he borrows your ear protection every weekend.", "Le encantó. Ahora te pide los protectores de oídos todos los fines de semana.", "Ele adorou. Agora pede seus protetores de ouvido todo fim de semana."), eff({ H: 5 }), T("I took my neighbor shooting and we became friends.", "Llevé a mi vecino a disparar y nos hicimos panas.", "Levei meu vizinho para atirar e viramos amigos."))],
        ],
      }),
    },
    {
      id: "kid", t: T("Kid Found Your Gun", "Un niño halló tu arma", "Criança achou sua arma"), sel: mainGun, cond: () => !S().safe && !carried(),
      make: (c) => ({
        lead: T("A kid visiting your place found your gun in a drawer. Luckily an adult caught him in time.", "Un niño que visitaba tu casa encontró tu arma en una gaveta. Por suerte un adulto lo pilló a tiempo.", "Uma criança que visitava sua casa achou sua arma numa gaveta. Por sorte um adulto pegou a tempo."),
        choices: [
          [lab(T("Buy a gun safe", "Comprar una caja fuerte", "Comprar um cofre"), 350), pay(c, 350, () => {
            S().safe = true;
            out(c, T("Locked Up", "Bajo llave", "Trancada"), T("Now your gun is in a safe with a code. Nobody touches it but you.", "Ahora tu arma está en una caja fuerte con clave. Solo la tocas tú.", "Agora sua arma está num cofre com senha. Só você mexe nela."), eff({ m: -350, H: 3 }), T("I bought a gun safe after a scare.", "Compré una caja fuerte para el arma después de un susto.", "Comprei um cofre para a arma depois de um susto."));
          })],
          [T("Hide it better", "Esconderla mejor", "Esconder melhor"), () => {
            if (rnd() < 0.3) out(c, T("Close Call", "Casi pasa algo", "Foi por pouco"), T("The new hiding spot didn't fool him either. Everyone's shaken up.", "El nuevo escondite tampoco lo engañó. Todos quedaron asustados.", "O novo esconderijo também não enganou a criança. Todo mundo ficou assustado."), eff({ H: -8 }), T("A kid found my gun again. That was too close.", "Un niño volvió a encontrar mi arma. Estuvo muy cerca.", "Uma criança achou minha arma de novo. Foi muito perto."));
            else out(c, T("Out of Reach", "Fuera de alcance", "Fora do alcance"), T("Top shelf, locked box, key on you. Good enough for now.", "Estante alta, caja con candado, llave contigo. Suficiente por ahora.", "Prateleira alta, caixa trancada, chave com você. Bom por enquanto."), eff({ H: 1 }));
          }],
          [T("Don't make a big deal", "No hacer gran cosa", "Não fazer alarde"), () => {
            if (rnd() < 0.35) out(c, T("Scary Moment", "Momento aterrador", "Momento assustador"), T("It happened again and you barely stopped it. Your family is furious.", "Volvió a pasar y apenas lo evitaste. Tu familia está furiosa.", "Aconteceu de novo e você mal evitou. Sua família está furiosa."), eff({ H: -12 }), T("A kid almost got hurt with my gun. I felt awful.", "Un niño casi se lastima con mi arma. Me sentí fatal.", "Uma criança quase se machucou com minha arma. Me senti péssimo."));
            else out(c, T("Nothing Happened", "No pasó nada", "Nada aconteceu"), T("You got lucky this time.", "Esta vez tuviste suerte.", "Dessa vez você teve sorte."));
          }],
        ],
      }),
    },
    {
      id: "stolen", t: T("Gun Stolen", "Te robaron el arma", "Roubaram sua arma"), sel: () => { const l = owned().filter((g) => !carried() || g.uid !== carried().uid); return l.length ? rpick(l) : null; }, cond: () => !S().safe,
      make: (c) => ({
        lead: T("Someone broke in while you were out. Your gun is gone.", "Alguien se metió en tu casa mientras no estabas. Tu arma ya no está.", "Alguém invadiu sua casa enquanto você estava fora. Sua arma sumiu."),
        choices: [
          [T("Report it to the police", "Denunciarlo a la policía", "Denunciar à polícia"), () => {
            takeGun(c.gun);
            if (stt(c.gun).illegal && rnd() < 0.5) { say2(T("I reported a stolen gun and they asked where I got it.", "Denuncié el robo de un arma y me preguntaron de dónde la saqué.", "Denunciei o roubo de uma arma e perguntaram onde eu consegui.")); return setTimeout(() => typeof arrest === "function" && arrest("illegal firearm possession", [2, 6]), 50); }
            out(c, T("Report Filed", "Denuncia hecha", "Boletim feito"), T("They took notes and promised nothing.", "Tomaron nota y no prometieron nada.", "Anotaram tudo e não prometeram nada."), eff({ H: -3 }), T("Someone stole my gun.", "Me robaron el arma.", "Roubaram minha arma."));
          }],
          [T("Hunt down the thief", "Buscar al ladrón", "Caçar o ladrão"), () => {
            const r = rnd();
            if (r < 0.3) return out(c, T("Got It Back", "La recuperaste", "Recuperou"), T("You found him and got it back without a fight.", "Lo encontraste y la recuperaste sin pelea.", "Você achou o cara e pegou de volta sem briga."), eff({ H: 5 }), T("I tracked down the thief and got my gun back.", "Encontré al ladrón y recuperé mi arma.", "Achei o ladrão e peguei minha arma de volta."));
            takeGun(c.gun);
            if (r < 0.4) {
              const dead = wound(10, 30, 0.1);
              say2(T("I got hurt chasing a gun thief.", "Me lastimé persiguiendo a un ladrón de armas.", "Me machuquei perseguindo um ladrão de armas."));
              if (!dead) out(c, T("Bad Idea", "Mala idea", "Má ideia"), T("He wasn't alone. You got hurt and the gun is gone for good.", "No estaba solo. Saliste herido y el arma se perdió para siempre.", "Ele não estava sozinho. Você se machucou e a arma sumiu pra sempre."), eff({ H: -6 }));
              return;
            }
            out(c, T("Cold Trail", "Pista fría", "Pista fria"), T("Nobody knew anything. The gun is gone.", "Nadie sabía nada. El arma se perdió.", "Ninguém sabia de nada. A arma sumiu."), eff({ H: -4 }), T("Someone stole my gun.", "Me robaron el arma.", "Roubaram minha arma."));
          }],
          [T("Let it go", "Dejarlo así", "Deixar pra lá"), () => { takeGun(c.gun); out(c, T("Gone", "Se perdió", "Perdida"), T("You shrugged it off. It was only a thing.", "Te encogiste de hombros. Era solo un objeto.", "Você deu de ombros. Era só uma coisa."), eff({ H: -3 }), T("Someone stole my gun.", "Me robaron el arma.", "Roubaram minha arma.")); }],
        ],
      }),
    },
    {
      id: "traffic", t: T("Traffic Stop", "Parada de tráfico", "Abordagem de trânsito"), sel: carried,
      make: (c) => {
        const ill = stt(c.gun).illegal;
        return {
          lead: T("Blue lights in the mirror. The officer walks up to your window. You have a gun on you.", "Luces azules en el retrovisor. El oficial se acerca a tu ventana. Traes un arma encima.", "Luzes azuis no retrovisor. O policial vem até sua janela. Você está com uma arma."),
          choices: [
            [T("Tell him upfront", "Decírselo de una vez", "Contar logo de cara"), () => {
              if (ill) return bust(c.gun);
              out(c, T("Cooperative", "Cooperaste", "Cooperou"), T("He checked your papers, thanked you for the heads-up and let you go.", "Revisó tus papeles, te agradeció el aviso y te dejó ir.", "Ele conferiu seus papéis, agradeceu o aviso e te liberou."), eff({ H: 2 }), T("I got pulled over with a gun and handled it calmly.", "Me pararon con un arma encima y lo manejé con calma.", "Fui parado com uma arma e lidei com calma."));
            }],
            [T("Show your permit", "Mostrar tu licencia", "Mostrar sua licença"), () => {
              if (ill) return bust(c.gun, "carrying a gun with a fake permit", [3, 8]);
              if (window.FL_LICENSES && typeof FL_LICENSES.has === "function" && !FL_LICENSES.has("firearm") && rnd() < 0.5) return out(c, T("Expired Papers", "Papeles vencidos", "Papéis vencidos"), T("Your permit had lapsed. He wrote you a ticket and made you hand the gun over to a friend.", "Tu licencia estaba vencida. Te puso una multa y te hizo entregar el arma a un amigo.", "Sua licença tinha vencido. Ele te multou e te fez entregar a arma a um amigo."), eff({ m: -250, H: -4 }), T("A cop fined me for an expired gun permit.", "Un policía me multó por tener la licencia de armas vencida.", "Um policial me multou por licença de arma vencida."));
              out(c, T("All Good", "Todo bien", "Tudo certo"), T("Your papers checked out. He told you to drive safe.", "Tus papeles estaban en orden. Te dijo que manejaras con cuidado.", "Seus papéis estavam em ordem. Ele mandou você dirigir com cuidado."), eff({ H: 2 }));
            }],
            [T("Say nothing", "No decir nada", "Não falar nada"), () => {
              const found = rnd() < (ill ? 0.5 : 0.25);
              if (found && ill) return bust(c.gun);
              if (found) { takeGun(c.gun); return out(c, T("Gun Found", "Le vio el arma", "Viu a arma"), T("He spotted it on the seat. Legal or not, hiding it cost you a fine and the gun.", "La vio en el asiento. Legal o no, esconderla te costó una multa y el arma.", "Ele viu a arma no banco. Legal ou não, esconder custou uma multa e a arma."), eff({ m: -300, H: -6 }), T("A cop found the gun I tried to hide.", "Un policía encontró el arma que intenté esconder.", "Um policial achou a arma que tentei esconder.")); }
              out(c, T("Close One", "Por poco", "Foi por pouco"), T("He glanced around, handed you a warning and left. Your heart is still pounding.", "Echó un vistazo, te dio una advertencia y se fue. Todavía te late el corazón a mil.", "Ele deu uma olhada, te deu um aviso e foi embora. Seu coração ainda está acelerado."), eff({ H: -1 }));
            }],
          ],
        };
      },
    },
    {
      id: "pawn", t: T("Pawn Shop Offer", "Oferta de casa de empeño", "Oferta da casa de penhores"), sel: () => (owned().length ? rpick(owned()) : null),
      make: (c) => {
        const val = Math.round(def(c.gun).price * (0.5 + rnd() * 0.3));
        return {
          lead: T("A pawn shop owner saw you with your gun and wants to buy it right now.", "El dueño de una casa de empeño te vio con tu arma y quiere comprártela ya.", "O dono de uma casa de penhores viu sua arma e quer comprar agora."),
          rows: [["Money", "+" + money(price(val))]],
          choices: [
            [T("Sell it", "Venderla", "Vender"), () => {
              if (stt(c.gun).illegal && rnd() < 0.12) { say2(T("A pawn shop buyer turned out to be a cop.", "El comprador de una casa de empeño resultó ser policía.", "O comprador de uma casa de penhores era policial.")); return bust(c.gun); }
              takeGun(c.gun);
              out(c, T("Sold", "Vendida", "Vendida"), T("Cash on the counter. The gun is gone.", "Efectivo en el mostrador. El arma ya no es tuya.", "Dinheiro no balcão. A arma não é mais sua."), eff({ m: val }), T("I sold a gun to a pawn shop.", "Vendí un arma en una casa de empeño.", "Vendi uma arma numa casa de penhores."));
            }],
            [T("Haggle", "Regatear", "Pechinchar"), () => {
              if (rnd() < 0.5) { takeGun(c.gun); return out(c, T("Better Price", "Mejor precio", "Preço melhor"), T("He caved and paid more.", "Cedió y pagó más.", "Ele cedeu e pagou mais."), eff({ m: Math.round(val * 1.35), H: 2 }), T("I haggled and sold a gun for a good price.", "Regateé y vendí un arma a buen precio.", "Pechinchei e vendi uma arma por um bom preço.")); }
              out(c, T("He Walked", "Se fue", "Ele foi embora"), T("He refused and left. You still have your gun.", "No aceptó y se fue. Todavía tienes tu arma.", "Ele recusou e foi embora. Você ainda tem sua arma."));
            }],
            [T("Not for sale", "No está en venta", "Não está à venda"), NOPE],
          ],
        };
      },
    },
    {
      id: "jam", t: T("Gun Jams", "Se encasquilla", "Arma trava"), sel: mainGun,
      make: (c) => ({
        lead: T("Your gun jams mid-session. A round is stuck and the guy next to you is looking.", "Tu arma se encasquilla en plena práctica. Hay una bala atascada y el tipo de al lado te está mirando.", "Sua arma trava no meio do treino. Tem uma bala presa e o cara do lado está olhando."),
        choices: [
          [T("Clear it calmly", "Despejarla con calma", "Destravar com calma"), () => {
            if (rnd() < 0.9) out(c, T("Cleared", "Despejada", "Destravada"), T("Tap, rack, ready. You learned something today.", "Golpe, corredera, lista. Aprendiste algo hoy.", "Batida, ferrolho, pronta. Você aprendeu algo hoje."), eff({ H: 2 }), T("My gun jammed but I cleared it like a pro.", "Se me encasquilló el arma pero la despejé como un profesional.", "Minha arma travou mas destravei como um profissional."));
            else out(c, T("Still Stuck", "Sigue atascada", "Continua presa"), T("It won't budge. You'll need a gunsmith.", "No cede. Vas a necesitar un armero.", "Não solta. Você vai precisar de um armeiro."), eff({ H: -2 }));
          }],
          [lab(T("Take it to a gunsmith", "Llevarla a un armero", "Levar a um armeiro"), 80), pay(c, 80, () => out(c, T("Fixed", "Arreglada", "Consertada"), T("He cleaned it and swapped a worn spring. Good as new.", "La limpió y cambió un resorte gastado. Como nueva.", "Ele limpou e trocou uma mola gasta. Nova em folha."), eff({ m: -80, H: 2 }), T("I took my jammed gun to a gunsmith.", "Llevé mi arma encasquillada a un armero.", "Levei minha arma travada a um armeiro.")))],
          [T("Force it", "Forzarla", "Forçar"), () => {
            if (rnd() < 0.2) { const dead = wound(5, 15, 0.03); say2(T("I forced a jammed gun and it hurt me.", "Forcé un arma encasquillada y me lastimé.", "Forcei uma arma travada e me machuquei.")); if (!dead) out(c, T("Ouch", "Ay", "Ai"), T("It went off in the wrong direction. You got hurt.", "Se disparó para donde no era. Te lastimaste.", "Ela disparou para o lado errado. Você se machucou."), eff({ H: -6 })); return; }
            out(c, T("It Popped Free", "Se soltó", "Soltou"), T("Reckless, but it worked.", "Imprudente, pero funcionó.", "Imprudente, mas funcionou."), eff({ H: 1 }));
          }],
        ],
      }),
    },
    {
      id: "safe", t: T("Gun Safe Sale", "Rebaja de cajas fuertes", "Promoção de cofres"), sel: mainGun, cond: () => !S().safe,
      make: (c) => ({
        lead: T("A store is dumping its gun safes at a discount. Fingerprint lock and everything.", "Una tienda está rematando cajas fuertes para armas. Con huella digital y todo.", "Uma loja está queimando cofres para armas. Com biometria e tudo."),
        choices: [
          [lab(T("Buy a safe", "Comprar una caja fuerte", "Comprar um cofre"), 280), pay(c, 280, () => { S().safe = true; out(c, T("Safe Bought", "Caja comprada", "Cofre comprado"), T("Your guns are locked down. Kids and thieves can forget about them.", "Tus armas están bajo llave. Niños y ladrones pueden olvidarse de ellas.", "Suas armas estão trancadas. Crianças e ladrões podem esquecer."), eff({ m: -280, H: 3 }), T("I bought a gun safe.", "Compré una caja fuerte para armas.", "Comprei um cofre para armas.")); })],
          [T("Not now", "Ahora no", "Agora não"), NOPE],
        ],
      }),
    },
    {
      id: "ammo", t: T("Ammo Shortage", "Escasez de balas", "Falta de munição"), sel: mainGun,
      make: (c) => ({
        lead: T("Every store is out of ammo and the few boxes left cost double. People are panic buying.", "Todas las tiendas se quedaron sin balas y las pocas cajas que quedan cuestan el doble. La gente está comprando en pánico.", "Todas as lojas ficaram sem munição e as poucas caixas custam o dobro. O povo está comprando em pânico."),
        choices: [
          [lab(T("Stock up anyway", "Abastecerte igual", "Estocar mesmo assim"), 300), pay(c, 300, () => {
            const key = MAG_BY_GRP[def(c.gun).grp];
            const got = rnd() < 0.7;
            if (got && key) FA().giveMag(key);
            out(c, got ? T("Stocked Up", "Abastecido", "Estocado") : T("Price Gouged", "Te estafaron", "Preço abusivo"), got ? T("You found a seller and left with a full bag and a spare magazine.", "Encontraste un vendedor y saliste con una bolsa llena y un cargador extra.", "Você achou um vendedor e saiu com uma sacola cheia e um pente extra.") : T("The seller doubled the price again. You left with almost nothing.", "El vendedor volvió a duplicar el precio. Saliste con casi nada.", "O vendedor dobrou o preço de novo. Você saiu com quase nada."), eff({ m: -300, H: got ? 2 : -4 }), T("I stocked up on ammo during a shortage.", "Me abastecí de balas durante una escasez.", "Estoquei munição durante uma escassez."));
          })],
          [lab(T("Reload your own", "Recargar tus propias balas", "Recarregar as suas"), 120), pay(c, 120, () => {
            if (rnd() < 0.2) { const dead = wound(8, 20, 0.04); say2(T("A homemade round blew up in my hand.", "Una bala casera me explotó en la mano.", "Uma munição caseira explodiu na minha mão.")); if (!dead) out(c, T("Blew Up", "Explotó", "Explodiu"), T("A bad load went off in your hand. It hurt a lot.", "Una carga mala explotó en tu mano. Dolió mucho.", "Uma carga ruim explodiu na sua mão. Doeu muito."), eff({ m: -120 })); return; }
            out(c, T("DIY Ammo", "Balas caseras", "Munição caseira"), T("It took all weekend, but it saved you money.", "Te tomó todo el fin de semana, pero ahorraste plata.", "Levou o fim de semana todo, mas economizou dinheiro."), eff({ m: -120, H: 3 }));
          })],
          [T("Wait it out", "Esperar", "Esperar passar"), NOPE],
        ],
      }),
    },
    {
      id: "permit", t: T("Permit Renewal", "Renovar permiso", "Renovar licença"), sel: legalGun,
      make: (c) => ({
        lead: T("Your firearm permit is about to expire. The office has a line out the door.", "Tu permiso de armas está por vencer. La oficina tiene una fila hasta la calle.", "Sua licença de arma está para vencer. O escritório tem fila até a rua."),
        choices: [
          [lab(T("Renew it", "Renovarlo", "Renovar"), 100), pay(c, 100, () => out(c, T("Renewed", "Renovado", "Renovada"), T("Another few years of being legal. Boring, but safe.", "Unos años más siendo legal. Aburrido, pero seguro.", "Mais alguns anos na legalidade. Chato, mas seguro."), eff({ m: -100, H: 1 }), T("I renewed my gun permit.", "Renové mi permiso de armas.", "Renovei minha licença de arma.")))],
          [T("Ignore it", "Ignorarlo", "Ignorar"), () => {
            if (rnd() < 0.35) out(c, T("Fined", "Multado", "Multado"), T("They caught the lapse and fined you more than the renewal would've cost.", "Detectaron el vencimiento y te multaron más de lo que costaba renovar.", "Pegaram o vencimento e te multaram mais do que a renovação custaria."), eff({ m: -400, H: -3 }), T("I got fined for letting my gun permit expire.", "Me multaron por dejar vencer mi permiso de armas.", "Fui multado por deixar minha licença de arma vencer."));
            else out(c, T("Nobody Noticed", "Nadie lo notó", "Ninguém notou"), T("Nothing happened. Yet.", "No pasó nada. Todavía.", "Nada aconteceu. Ainda."));
          }],
        ],
      }),
    },
    {
      id: "nightnoise", t: T("Noise at Night", "Ruido de noche", "Barulho à noite"), sel: mainGun,
      make: (c) => ({
        lead: T("You wake up at 3 AM. Something just hit the floor downstairs.", "Despiertas a las 3 de la madrugada. Algo acaba de caer abajo.", "Você acorda às 3 da manhã. Algo acabou de cair lá embaixo."),
        choices: [
          [T("Grab your gun and check", "Agarrar tu arma e ir a ver", "Pegar a arma e ir ver"), () => {
            const r = rnd();
            if (r < 0.5) return out(c, T("Just the Cat", "Solo el gato", "Só o gato"), T("The cat knocked a plant off the shelf. You feel ridiculous.", "El gato tiró una matera del estante. Te sientes ridículo.", "O gato derrubou um vaso da estante. Você se sente ridículo."), eff({ H: 1 }), T("I grabbed my gun to check a noise. It was the cat.", "Agarré mi arma para revisar un ruido. Era el gato.", "Peguei minha arma para ver um barulho. Era o gato."));
            if (r < 0.8) return out(c, T("Burglar Fled", "El ladrón huyó", "O ladrão fugiu"), T("A burglar saw you and the gun and ran out the window.", "Un ladrón te vio con el arma y salió corriendo por la ventana.", "Um ladrão viu você com a arma e fugiu pela janela."), eff({ H: 6 }), T("I scared off a burglar with my gun.", "Espanté a un ladrón con mi arma.", "Assustei um ladrão com minha arma."));
            if (stt(c.gun).illegal && rnd() < 0.3) { say2(T("Police found my illegal gun after a break-in.", "La policía encontró mi arma ilegal después de un robo.", "A polícia achou minha arma ilegal depois de um arrombamento.")); return bust(c.gun); }
            const dead = wound(15, 35, 0.08);
            say2(T("I got shot by a burglar in my own home.", "Un ladrón me disparó en mi propia casa.", "Um ladrão atirou em mim na minha própria casa."));
            if (!dead) out(c, T("Shootout", "Tiroteo", "Tiroteio"), T("He fired first. You hit the floor, got hurt, but he ran.", "Disparó primero. Te tiraste al piso y te hirieron, pero se fue.", "Ele atirou primeiro. Você se jogou no chão e se feriu, mas ele fugiu."), eff({ H: -8 }));
          }],
          [T("Call the police", "Llamar a la policía", "Chamar a polícia"), () => out(c, T("Cops Came", "Llegó la policía", "A polícia veio"), T("They searched the house. Nobody there. They told you you did the right thing.", "Revisaron la casa. No había nadie. Te dijeron que hiciste lo correcto.", "Vasculharam a casa. Não tinha ninguém. Disseram que você fez o certo."), eff({ H: 2 }), T("I called the police over a noise at night.", "Llamé a la policía por un ruido en la noche.", "Chamei a polícia por causa de um barulho à noite."))],
          [T("Hide and stay quiet", "Esconderte y callar", "Se esconder e ficar quieto"), () => {
            if (rnd() < 0.25) out(c, T("They Took Cash", "Se llevaron plata", "Levaram dinheiro"), T("Someone really was in the house. They grabbed cash and left.", "De verdad había alguien en la casa. Agarraron plata y se fueron.", "Tinha mesmo alguém na casa. Pegaram dinheiro e foram embora."), eff({ m: -ri(200, 800), H: -6 }), T("A burglar stole my cash while I hid.", "Un ladrón me robó plata mientras me escondía.", "Um ladrão levou meu dinheiro enquanto eu me escondia."));
            else out(c, T("False Alarm", "Falsa alarma", "Alarme falso"), T("Silence. Nothing else happened. You barely slept.", "Silencio. No pasó nada más. Casi no dormiste.", "Silêncio. Nada mais aconteceu. Você mal dormiu."), eff({ H: -2 }));
          }],
        ],
      }),
    },
    {
      id: "barfight", t: T("Bar Argument", "Discusión en el bar", "Discussão no bar"), sel: carried,
      make: (c) => ({
        lead: T("A guy at the bar is in your face over a spilled drink. You have a gun on you.", "Un tipo en el bar te encara por una bebida derramada. Traes un arma encima.", "Um cara no bar te enfrenta por causa de uma bebida derramada. Você está com uma arma."),
        choices: [
          [T("Walk away", "Irte", "Ir embora"), () => out(c, T("Cool Head", "Cabeza fría", "Cabeça fria"), T("You left your drink and walked out. The night is saved.", "Dejaste tu trago y te fuiste. La noche se salvó.", "Você deixou a bebida e saiu. A noite foi salva."), eff({ H: 2 }), T("I walked away from a bar fight with a gun on me.", "Me fui de una pelea de bar con un arma encima.", "Saí de uma briga de bar com uma arma comigo."))],
          [T("Show him your gun", "Enseñarle tu arma", "Mostrar sua arma"), () => {
            if (rnd() < 0.55) return out(c, T("He Backed Off", "Se echó para atrás", "Ele recuou"), T("He went pale and apologized. But everyone saw it.", "Se puso pálido y pidió perdón. Pero todos lo vieron.", "Ele ficou pálido e pediu desculpas. Mas todo mundo viu."), eff({ H: 2, rep: 4, heat: 3 }), T("I showed my gun in a bar and the guy backed off.", "Enseñé mi arma en un bar y el tipo se echó para atrás.", "Mostrei minha arma num bar e o cara recuou."));
            say2(T("The bartender called the cops when I flashed my gun.", "El cantinero llamó a la policía cuando enseñé mi arma.", "O barman chamou a polícia quando mostrei minha arma."));
            bust(c.gun, "brandishing a firearm", [1, 4]);
          }],
          [T("Throw the first punch", "Tirar el primer golpe", "Dar o primeiro soco"), () => {
            if (rnd() < 0.5) out(c, T("You Won", "Ganaste", "Você ganhou"), T("One clean hit and he's on the floor. The bouncer throws you both out.", "Un golpe limpio y está en el piso. El de seguridad los saca a los dos.", "Um soco limpo e ele está no chão. O segurança joga os dois pra fora."), eff({ H: 3, rep: 2 }));
            else out(c, T("You Lost", "Perdiste", "Você perdeu"), T("He had friends. You left with a black eye.", "Tenía panas. Saliste con un ojo morado.", "Ele tinha amigos. Você saiu com o olho roxo."), eff({ He: -ri(4, 10), H: -4 }));
          }],
        ],
      }),
    },
    {
      id: "hunt", t: T("Hunting Invite", "Invitación de caza", "Convite de caça"), sel: hunterGun,
      make: (c) => ({
        lead: T("A coworker invites you on a weekend hunting trip. Cabin, campfire and early mornings.", "Un compañero te invita a un fin de semana de cacería. Cabaña, fogata y madrugones.", "Um colega te convida para um fim de semana de caça. Cabana, fogueira e madrugadas."),
        choices: [
          [T("Go hunting", "Ir de cacería", "Ir caçar"), () => {
            const lic = S().license ? 0 : 60;
            if (state.money < price(lic)) return out(c, T("Not Enough Cash", "No te alcanza", "Sem grana"), T("You couldn't afford the hunting license.", "No te alcanzó para la licencia de caza.", "Você não tinha dinheiro para a licença de caça."));
            if (lic) S().license = true;
            const r = rnd();
            if (r < 0.04) { const dead = wound(15, 35, 0.06); say2(T("I got hurt in a hunting accident.", "Me lastimé en un accidente de cacería.", "Me machuquei num acidente de caça.")); if (!dead) out(c, T("Hunting Accident", "Accidente de cacería", "Acidente de caça"), T("A bad fall in the woods. You came home on a stretcher.", "Una mala caída en el monte. Volviste en camilla.", "Uma queda feia no mato. Você voltou numa maca."), eff({ m: -lic, H: -4 })); return; }
            if (r < 0.6) { const cash = ri(60, 320); return out(c, T("Big Catch", "Gran presa", "Grande caça"), T("You came home with a trophy and a freezer full of meat.", "Volviste con un trofeo y un congelador lleno de carne.", "Você voltou com um troféu e um freezer cheio de carne."), eff({ m: cash - lic, H: ri(3, 7) }), T("I went hunting with a coworker and caught something big.", "Fui de cacería con un compañero y cacé algo grande.", "Fui caçar com um colega e peguei algo grande.")); }
            out(c, T("Quiet Weekend", "Fin de semana tranquilo", "Fim de semana tranquilo"), T("You saw nothing but trees. Still peaceful.", "No viste nada más que árboles. Igual fue tranquilo.", "Você não viu nada além de árvores. Mesmo assim foi tranquilo."), eff({ m: -lic, H: 3 }));
          }],
          [T("Just watch", "Solo mirar", "Só assistir"), () => out(c, T("Campfire Stories", "Cuentos de fogata", "Histórias de fogueira"), T("You skipped the shooting but drank cocoa and heard some wild stories.", "No disparaste, pero tomaste chocolate caliente y oíste historias locas.", "Você não atirou, mas tomou chocolate quente e ouviu histórias malucas."), eff({ H: 3 }))],
          [T("Say no", "Decir que no", "Dizer não"), NOPE],
        ],
      }),
    },
    {
      id: "collector", t: T("Collector Wants It", "Un coleccionista la quiere", "Colecionador quer a arma"), sel: () => { const l = owned().filter((g) => ANTIQUE.includes(g.id)); return l.length ? rpick(l) : null; },
      make: (c) => {
        const val = Math.round(def(c.gun).price * 2.2);
        return {
          lead: T("A collector spotted your antique and offers way above market price for it.", "Un coleccionista vio tu pieza antigua y ofrece muy por encima del precio de mercado.", "Um colecionador viu sua peça antiga e oferece muito acima do preço de mercado."),
          rows: [["Money", "+" + money(price(val))]],
          choices: [
            [T("Sell it", "Vendérsela", "Vender"), () => {
              if (stt(c.gun).illegal && rnd() < 0.12) { say2(T("The collector was an undercover cop.", "El coleccionista era un policía encubierto.", "O colecionador era um policial disfarçado.")); return bust(c.gun); }
              takeGun(c.gun);
              out(c, T("Sold", "Vendida", "Vendida"), T("He paid in cash and handled it like a baby.", "Pagó en efectivo y la trató como a un bebé.", "Ele pagou em dinheiro e tratou como um bebê."), eff({ m: val, H: 3 }), T("I sold an antique gun to a collector.", "Vendí un arma antigua a un coleccionista.", "Vendi uma arma antiga a um colecionador."));
            }],
            [T("Hold out for more", "Pedir más", "Pedir mais"), () => {
              if (rnd() < 0.45) { takeGun(c.gun); return out(c, T("Jackpot", "Premio gordo", "Premio gordo"), T("He gave in and paid even more.", "Cedió y pagó todavía más.", "Ele cedeu e pagou ainda mais."), eff({ m: Math.round(val * 1.5), H: 5 }), T("I sold an antique gun for a fortune.", "Vendí un arma antigua por una fortuna.", "Vendi uma arma antiga por uma fortuna.")); }
              out(c, T("He Walked", "Se fue", "Ele foi embora"), T("He found another one somewhere else. Greed bites.", "Encontró otra en otro lado. La avaricia muerde.", "Ele achou outra em outro lugar. A ganância morde."), eff({ H: -3 }));
            }],
            [T("Keep it", "Quedártela", "Ficar com ela"), NOPE],
          ],
        };
      },
    },
    {
      id: "borrow", t: T("Friend Wants to Borrow", "Un amigo la quiere prestada", "Amigo quer emprestada"), sel: () => (owned().length ? rpick(owned()) : null), cond: () => !carried() || owned().length > 1,
      make: (c) => ({
        lead: T("A friend asks to borrow your gun for the weekend. He says he's going to the range.", "Un amigo te pide prestada el arma para el fin de semana. Dice que va al campo de tiro.", "Um amigo pede sua arma emprestada para o fim de semana. Diz que vai ao estande."),
        choices: [
          [T("Lend it", "Prestársela", "Emprestar"), () => {
            const r = rnd();
            if (r < 0.1) { say2(T("My friend used my gun in a crime and the cops traced it to me.", "Mi amigo usó mi arma en un crimen y la policía me rastreó.", "Meu amigo usou minha arma num crime e a polícia chegou em mim.")); takeGun(c.gun); return setTimeout(() => typeof arrest === "function" && arrest("accessory to a firearm offense", [2, 6]), 50); }
            if (r < 0.4) { takeGun(c.gun); return out(c, T("Never Returned", "Nunca la devolvió", "Nunca devolveu"), T("He stopped answering your calls. So much for friendship.", "Dejó de contestar tus llamadas. Adiós a la amistad.", "Parou de atender suas ligações. Era essa a amizade."), eff({ H: -8 }), T("A friend never gave my gun back.", "Un amigo nunca me devolvió el arma.", "Um amigo nunca devolveu minha arma."));
            }
            out(c, T("Returned Clean", "La devolvió limpia", "Devolveu limpa"), T("He gave it back cleaned and with a box of ammo as thanks.", "La devolvió limpia y con una caja de balas de agradecimiento.", "Ele devolveu limpa e com uma caixa de munição de agradecimento."), eff({ H: 3 }), T("I lent my gun to a friend and he returned it.", "Le presté mi arma a un amigo y me la devolvió.", "Emprestei minha arma a um amigo e ele devolveu."));
          }],
          [T("Refuse", "Negarte", "Recusar"), () => out(c, T("Awkward", "Incómodo", "Constrangedor"), T("He said he understood. He didn't look like it.", "Dijo que entendía. No lo parecía.", "Ele disse que entendia. Não parecia."), eff({ H: -3 }))],
          [T("Go to the range together", "Ir juntos al campo de tiro", "Ir juntos ao estande"), () => out(c, T("Good Day", "Buen día", "Bom dia"), T("You both shot, laughed and went for burgers after.", "Los dos dispararon, se rieron y luego se fueron por hamburguesas.", "Vocês atiraram, riram e depois foram comer hambúrguer."), eff({ H: 5 }), T("I took a friend to the range instead of lending my gun.", "Llevé a un amigo al campo de tiro en vez de prestarle mi arma.", "Levei um amigo ao estande em vez de emprestar minha arma."))],
        ],
      }),
    },
    {
      id: "class", t: T("Gun Safety Class", "Clase de seguridad", "Aula de segurança"), sel: mainGun, cond: () => !S().trained,
      make: (c) => ({
        lead: T("A local instructor runs a weekend gun safety class. Handling, storage and what to do under stress.", "Un instructor local da una clase de seguridad con armas el fin de semana. Manejo, almacenamiento y qué hacer bajo estrés.", "Um instrutor local dá uma aula de segurança com armas no fim de semana. Manuseio, armazenamento e o que fazer sob estresse."),
        choices: [
          [lab(T("Take the class", "Tomar la clase", "Fazer a aula"), 80), pay(c, 80, () => { S().trained = true; out(c, T("Certified", "Certificado", "Certificado"), T("You walk out calmer and sharper. You'll handle a real emergency better now.", "Sales más tranquilo y más afilado. Ahora manejarás mejor una emergencia real.", "Você sai mais calmo e mais afiado. Agora lida melhor com uma emergência de verdade."), eff({ m: -80, H: 3 }), T("I took a gun safety class.", "Tomé una clase de seguridad con armas.", "Fiz uma aula de segurança com armas.")); })],
          [T("Skip it", "Pasar", "Pular"), NOPE],
        ],
      }),
    },
    {
      id: "photo", t: T("Gun Pic Goes Viral", "Foto del arma en redes", "Foto da arma viraliza"), sel: mainGun,
      make: (c) => ({
        lead: T("You took a great pic of your gun on the table. Your thumb is hovering over 'Post'.", "Sacaste una foto genial de tu arma sobre la mesa. Tu dedo flota sobre 'Publicar'.", "Você tirou uma foto ótima da sua arma na mesa. Seu dedo está pairando sobre 'Postar'."),
        choices: [
          [T("Post it", "Publicarla", "Postar"), () => {
            const s = stt(c.gun);
            if (s.illegal && rnd() < 0.35) { say2(T("Police saw the pic of my gun online.", "La policía vio la foto de mi arma en internet.", "A polícia viu a foto da minha arma na internet.")); return bust(c.gun); }
            out(c, T("Likes Rolling In", "Likes por montones", "Curtidas chegando"), s.illegal ? T("Thousands of likes. Nobody official saw it. Keep your luck.", "Miles de likes. Nadie oficial la vio. Cuida tu suerte.", "Milhares de curtidas. Ninguém oficial viu. Cuide da sua sorte.") : T("Thousands of likes and a few weirdos in the comments.", "Miles de likes y unos cuantos raros en los comentarios.", "Milhares de curtidas e uns esquisitos nos comentários."), eff({ H: 5, rep: 3, heat: s.illegal ? 5 : 0 }), T("I posted a pic of my gun online.", "Subí una foto de mi arma a las redes.", "Postei uma foto da minha arma nas redes."));
          }],
          [T("Blur the details", "Difuminar los detalles", "Borrar os detalhes"), () => out(c, T("Smart Move", "Jugada inteligente", "Jogada esperta"), T("Same flex, no serial numbers, no trouble.", "El mismo flex, sin números de serie, sin problemas.", "O mesmo flex, sem número de série, sem problemas."), eff({ H: 2 }))],
          [T("Delete it", "Borrarla", "Apagar"), NOPE],
        ],
      }),
    },
    {
      id: "streetshots", t: T("Shots on Your Block", "Tiros en tu cuadra", "Tiros no seu quarteirão"), sel: mainGun,
      make: (c) => ({
        lead: T("Gunshots outside your house at midnight. Tires screech and everything goes quiet.", "Tiros frente a tu casa a medianoche. Chirrían llantas y todo se queda en silencio.", "Tiros em frente à sua casa à meia-noite. Pneus cantam e tudo fica em silêncio."),
        choices: [
          [T("Hit the floor", "Tirarte al piso", "Se jogar no chão"), () => out(c, T("Safe", "A salvo", "A salvo"), T("You stayed down until the sirens came. Nobody was hurt.", "Te quedaste en el piso hasta que llegaron las sirenas. Nadie salió herido.", "Você ficou no chão até chegarem as sirenes. Ninguém se feriu."), eff({ H: -3 }), T("I hid on the floor during a shooting on my block.", "Me tiré al piso durante un tiroteo en mi cuadra.", "Me joguei no chão durante um tiroteio no meu quarteirão."))],
          [T("Peek through the window", "Mirar por la ventana", "Espiar pela janela"), () => {
            if (rnd() < 0.1) { const dead = wound(8, 25, 0.1); say2(T("A stray bullet hit me.", "Una bala perdida me alcanzó.", "Uma bala perdida me acertou.")); if (!dead) out(c, T("Stray Bullet", "Bala perdida", "Bala perdida"), T("A bullet came through the window. You got hit.", "Una bala entró por la ventana. Te alcanzó.", "Uma bala entrou pela janela. Te acertou."), eff({ H: -6 })); return; }
            out(c, T("Saw Nothing", "No viste nada", "Não viu nada"), T("A dark car sped away. The police asked if you saw anything.", "Un carro oscuro se fue a toda velocidad. La policía preguntó si viste algo.", "Um carro escuro fugiu em alta velocidade. A polícia perguntou se você viu algo."), eff({ H: -1 }));
          }],
          [T("Go out with your gun", "Salir con tu arma", "Sair com sua arma"), () => {
            if (stt(c.gun).illegal && rnd() < 0.6) { say2(T("Cops arrived and found me outside with an illegal gun.", "La policía llegó y me encontró afuera con un arma ilegal.", "A polícia chegou e me achou lá fora com uma arma ilegal.")); return bust(c.gun); }
            if (rnd() < 0.25) { const dead = wound(10, 30, 0.08); say2(T("I got hit going out during a shooting.", "Me hirieron al salir durante un tiroteo.", "Fui ferido ao sair durante um tiroteio.")); if (!dead) out(c, T("Wrong Move", "Mal movimiento", "Movimento errado"), T("They were still around. You got hit and went back in bleeding.", "Todavía andaban cerca. Te hirieron y volviste a entrar sangrando.", "Eles ainda estavam por perto. Você foi ferido e voltou sangrando.")); return; }
            out(c, T("Empty Street", "Calle vacía", "Rua vazia"), T("Nobody there. Just casings on the asphalt and curtains moving.", "No había nadie. Solo casquillos en el asfalto y cortinas que se movían.", "Não tinha ninguém. Só cápsulas no asfalto e cortinas se mexendo."), eff({ H: -2, rep: 2 }));
          }],
        ],
      }),
    },
    {
      id: "switchoffer", t: T("Switch Offer", "Oferta de switch", "Oferta de switch"), sel: () => { const l = owned().filter((g) => def(g).grp === "glock"); return l.length ? rpick(l) : null; },
      make: (c) => ({
        lead: T("A guy you know says he can put a switch on your Glock for cheap. Illegal as hell, and it turns it full auto.", "Un tipo que conoces dice que le puede poner un switch a tu Glock por poco. Ilegal total, y la vuelve automática.", "Um cara que você conhece diz que pode colocar um switch na sua Glock por pouco. Totalmente ilegal e deixa ela automática."),
        choices: [
          [lab(T("Take the switch", "Aceptar el switch", "Aceitar o switch"), 150), pay(c, 150, () => {
            const r = rnd();
            if (r < 0.1) { say2(T("The switch deal was a police trap.", "El trato del switch era una trampa de la policía.", "O negócio do switch era uma armadilha da polícia.")); return setTimeout(() => typeof arrest === "function" && arrest("attempted purchase of an automatic weapon part", [3, 8]), 50); }
            if (r < 0.2) return out(c, T("Scammed", "Te estafaron", "Você foi enganado"), T("He took your cash and gave you a piece of plastic.", "Se llevó tu plata y te dio un pedazo de plástico.", "Ele pegou sua grana e te deu um pedaço de plástico."), eff({ m: -150, H: -4 }));
            FA().givePart("switch", rpick(["red", "blue", "green", "gold", "pink", "purple", "orange", "white"]));
            out(c, T("Switch in Hand", "Switch en mano", "Switch na mão"), T("It's in your parts box. Install it from your gun's screen. Careful with that.", "Está en tu caja de piezas. Instálalo desde la pantalla de tu arma. Con cuidado.", "Está na sua caixa de peças. Instale na tela da sua arma. Cuidado com isso."), eff({ m: -150, heat: 3, rep: 2 }), T("I bought an illegal switch for my Glock.", "Compré un switch ilegal para mi Glock.", "Comprei um switch ilegal para minha Glock."));
          })],
          [T("Report him", "Denunciarlo", "Denunciar ele"), () => out(c, T("Snitch", "Soplón", "Dedo-duro"), T("The cops thanked you. Everyone on your block now looks at you funny.", "La policía te lo agradeció. Ahora todos en tu cuadra te miran raro.", "A polícia agradeceu. Agora todo mundo no seu quarteirão te olha torto."), eff({ H: -2, rep: -6 }))],
          [T("No thanks", "No, gracias", "Não, obrigado"), NOPE],
        ],
      }),
    },
    {
      id: "cheapguy", t: T("Cheap Gun From a Guy", "Arma barata de un tipo", "Arma barata de um cara"), sel: null, icon: E("1f575"), cond: () => state.age >= 18,
      make: (c) => ({
        lead: T("A guy in a parking lot pops his trunk. 'No papers, no questions, half price.'", "Un tipo en un parqueo abre su baúl. 'Sin papeles, sin preguntas, a mitad de precio.'", "Um cara num estacionamento abre o porta-malas. 'Sem papéis, sem perguntas, metade do preço.'"),
        choices: [
          [lab(T("Buy it", "Comprarla", "Comprar"), 450), pay(c, 450, () => {
            const r = rnd();
            if (r < 0.25) { say2(T("It was a police sting.", "Era una trampa de la policía.", "Era uma armadilha da polícia.")); return setTimeout(() => typeof arrest === "function" && arrest("attempted purchase of an illegal firearm", [2, 6]), 50); }
            if (r < 0.5) return out(c, T("Scammed", "Te estafaron", "Você foi enganado"), T("The trunk was full of toys. He took your cash and left.", "El baúl estaba lleno de juguetes. Se llevó tu plata y se fue.", "O porta-malas estava cheio de brinquedos. Ele pegou a grana e foi embora."), eff({ m: -450, H: -4 }), T("A guy in a parking lot scammed me.", "Un tipo en un parqueo me estafó.", "Um cara num estacionamento me enganou."));
            const id = rpick(["glock05", "glock06", "glock09", "glock11"]);
            FA().give(id);
            out(c, T("Got a Piece", "Conseguiste un fierro", "Conseguiu um ferro"), T("It's real and it works. It's also very illegal.", "Es de verdad y funciona. También es muy ilegal.", "É de verdade e funciona. Também é muito ilegal."), eff({ m: -450, heat: 3 }), T("I bought a gun off a guy in a parking lot.", "Compré un arma a un tipo en un parqueo.", "Comprei uma arma de um cara num estacionamento."), FA().def(id).icon);
          })],
          [T("Walk away", "Irte", "Ir embora"), () => out(c, T("Smart", "Inteligente", "Esperto"), T("You didn't look back. It smelled like a setup anyway.", "No miraste atrás. Olía a trampa de todos modos.", "Você não olhou pra trás. Cheirava a armadilha de qualquer jeito."), eff({ H: 1 }))],
        ],
      }),
    },
    {
      id: "raffle", t: T("Raffle Winner", "Ganaste una rifa", "Ganhou uma rifa"), sel: null, icon: E("1f3ab"), cond: () => state.age >= 21,
      make: (c) => {
        const ids = FA().legalGuns().filter((id) => (FA().def(id).age || 18) <= state.age && FA().def(id).price <= 900);
        const id = ids.length ? rpick(ids) : null;
        return {
          lead: T("You won a raffle at a charity BBQ. First prize is a gun from the local store.", "Ganaste una rifa en una parrillada benéfica. El primer premio es un arma de la tienda local.", "Você ganhou uma rifa num churrasco beneficente. O primeiro prêmio é uma arma da loja local."),
          rows: id ? [["Gun", FA().def(id).n]] : [],
          choices: [
            [T("Take the gun", "Quedarte con el arma", "Ficar com a arma"), () => { if (id) FA().give(id); out(c, T("New Gun", "Arma nueva", "Arma nova"), T("A free gun and a pat on the back. Not bad for a Saturday.", "Un arma gratis y una palmada en la espalda. No está mal para un sábado.", "Uma arma de graça e um tapinha nas costas. Nada mal para um sábado."), eff({ H: 5 }), T("I won a gun in a charity raffle.", "Gané un arma en una rifa benéfica.", "Ganhei uma arma numa rifa beneficente."), id ? FA().def(id).icon : c.icon); }],
            [T("Sell the prize", "Vender el premio", "Vender o prêmio"), () => out(c, T("Quick Cash", "Plata rápida", "Grana rápida"), T("A guy at the BBQ bought the voucher on the spot.", "Un tipo de la parrillada te compró el vale en el momento.", "Um cara do churrasco comprou o vale na hora."), eff({ m: ri(250, 500), H: 2 }), T("I sold the prize from a charity raffle.", "Vendí el premio de una rifa benéfica.", "Vendi o prêmio de uma rifa beneficente."))],
            [T("Donate it", "Donarlo", "Doar"), () => out(c, T("Generous", "Generoso", "Generoso"), T("People clapped. The next raffle is on you.", "La gente aplaudió. La próxima rifa corre por tu cuenta.", "O povo aplaudiu. A próxima rifa é por sua conta."), eff({ H: 6 }), T("I donated a raffle prize to charity.", "Doné el premio de una rifa a la caridad.", "Doei o prêmio de uma rifa para a caridade."))],
          ],
        };
      },
    },
    {
      id: "tournament", t: T("Shooting Tournament", "Torneo de tiro", "Torneio de tiro"), sel: () => legalGun() || mainGun(),
      make: (c) => ({
        lead: T("The local club runs a tournament. Cash for the top three, bragging rights for the rest.", "El club local organiza un torneo. Plata para los tres primeros, presumir para el resto.", "O clube local organiza um torneio. Dinheiro para os três primeiros, moral para o resto."),
        choices: [
          [lab(T("Enter", "Inscribirte", "Entrar"), 100), pay(c, 100, () => {
            const win = rnd() < 0.2 + stt(c.gun).power * 1.2 + (trained() ? 0.1 : 0);
            if (win) { const prize = ri(400, 1800); return out(c, T("Podium", "Podio", "Pódio"), T("You placed top three. They handed you an envelope and a medal.", "Quedaste entre los tres primeros. Te dieron un sobre y una medalla.", "Você ficou entre os três primeiros. Te deram um envelope e uma medalha."), eff({ m: prize - 100, H: 7 }), T("I placed in a shooting tournament.", "Quedé en el podio de un torneo de tiro.", "Fiquei no pódio de um torneio de tiro.")); }
            out(c, T("Mid Table", "A mitad de tabla", "No meio da tabela"), T("You shot okay but not great. At least the burgers were free.", "Disparaste bien pero sin brillar. Al menos las hamburguesas eran gratis.", "Você atirou bem, mas sem brilhar. Pelo menos os hambúrgueres eram de graça."), eff({ m: -100, H: 2 }));
          })],
          [T("Watch from the stands", "Mirar desde la tribuna", "Assistir da arquibancada"), () => out(c, T("Good Show", "Buen espectáculo", "Bom show"), T("Some of those shooters are unreal.", "Algunos de esos tiradores son de otro mundo.", "Alguns desses atiradores são de outro mundo."), eff({ H: 2 }))],
        ],
      }),
    },
    {
      id: "gunsmith", t: T("Gunsmith Offer", "Oferta de armero", "Oferta do armeiro"), sel: grpGun,
      make: (c) => ({
        lead: T("A local gunsmith likes how you take care of your gun. He has an upgrade for you.", "Un armero local ve cómo cuidas tu arma. Tiene una mejora para ti.", "Um armeiro local gosta de como você cuida da sua arma. Ele tem uma melhoria para você."),
        choices: [
          [T("Take the red dot", "Aceptar la mira de punto rojo", "Aceitar a mira de ponto vermelho"), () => { FA().givePart("reddot"); out(c, T("Free Upgrade", "Mejora gratis", "Melhoria grátis"), T("A red dot sight is now in your parts box.", "Una mira de punto rojo ya está en tu caja de piezas.", "Uma mira de ponto vermelho já está na sua caixa de peças."), eff({ H: 3 }), T("A gunsmith gave me a red dot sight.", "Un armero me regaló una mira de punto rojo.", "Um armeiro me deu uma mira de ponto vermelho.")); }],
          [lab(T("Buy the suppressor", "Comprar el silenciador", "Comprar o silenciador"), 700), pay(c, 700, () => { FA().givePart("supp"); out(c, T("Quiet Upgrade", "Mejora silenciosa", "Melhoria silenciosa"), T("A suppressor is in your parts box. Using it can get you in trouble in some places.", "Un silenciador está en tu caja de piezas. Usarlo puede traerte problemas en algunos lugares.", "Um silenciador está na sua caixa de peças. Usar pode te dar problema em alguns lugares."), eff({ m: -700, H: 2, heat: 2 }), T("I bought a suppressor from a gunsmith.", "Compré un silenciador a un armero.", "Comprei um silenciador de um armeiro.")); })],
          [T("No thanks", "No, gracias", "Não, obrigado"), NOPE],
        ],
      }),
    },
    {
      id: "bear", t: T("Bear in the Woods", "Oso en el bosque", "Urso na mata"), sel: hunterGun,
      make: (c) => ({
        lead: T("A bear stands up on its hind legs thirty feet away while you're hunting.", "Un oso se levanta sobre sus patas traseras a diez metros mientras cazas.", "Um urso se levanta nas patas traseiras a dez metros enquanto você caça."),
        choices: [
          [T("Fire a warning shot", "Disparar al aire", "Dar um tiro de aviso"), () => {
            if (rnd() < 0.7 + stt(c.gun).power * 0.5) return out(c, T("It Ran", "Salió corriendo", "Foi embora"), T("The bear dropped and bolted into the trees.", "El oso se dejó caer y se fue corriendo entre los árboles.", "O urso desceu e fugiu para as árvores."), eff({ H: 5 }), T("I scared off a bear with a warning shot.", "Espanté a un oso con un tiro al aire.", "Assustei um urso com um tiro de aviso."));
            const dead = wound(20, 40, 0.12, "a bear attack");
            say2(T("A bear attacked me in the woods.", "Un oso me atacó en el bosque.", "Um urso me atacou na mata."));
            if (!dead) out(c, T("Bear Attack", "Ataque de oso", "Ataque de urso"), T("It charged anyway. You survived, barely.", "Cargó de todos modos. Sobreviviste, por poco.", "Ele atacou mesmo assim. Você sobreviveu, por pouco."), eff({ H: -8 }));
          }],
          [T("Back away slowly", "Retroceder despacio", "Recuar devagar"), () => {
            if (rnd() < 0.75) return out(c, T("Safe", "A salvo", "A salvo"), T("It sniffed the air and went the other way.", "Olfateó el aire y se fue para el otro lado.", "Cheirou o ar e foi para o outro lado."), eff({ H: 2 }));
            const dead = wound(15, 35, 0.1, "a bear attack");
            say2(T("A bear attacked me in the woods.", "Un oso me atacó en el bosque.", "Um urso me atacou na mata."));
            if (!dead) out(c, T("Bear Attack", "Ataque de oso", "Ataque de urso"), T("It charged and clawed you before you got away.", "Cargó y te arañó antes de que escaparas.", "Ele atacou e te arranhou antes de você escapar."), eff({ H: -8 }));
          }],
        ],
      }),
    },
    {
      id: "family", t: T("Family Worried", "Tu familia se preocupa", "Família preocupada"), sel: mainGun,
      make: (c) => ({
        lead: T("Your family sits you down. They're scared of the gun in the house.", "Tu familia te sienta a hablar. Les da miedo el arma en la casa.", "Sua família senta com você para conversar. Eles têm medo da arma em casa."),
        choices: [
          [T("Get rid of it", "Deshacerte de ella", "Se livrar dela"), () => { takeGun(c.gun); out(c, T("Gone", "Fuera de casa", "Fora de casa"), T("You handed it in. The house feels lighter and everyone hugs you.", "La entregaste. La casa se siente más liviana y todos te abrazan.", "Você entregou. A casa parece mais leve e todo mundo te abraça."), eff({ m: Math.round(def(c.gun).price * 0.3), H: 6 }), T("I got rid of my gun for my family.", "Me deshice de mi arma por mi familia.", "Me livrei da minha arma pela minha família.")); }],
          [T("Promise to be careful", "Prometer cuidado", "Prometer cuidado"), () => out(c, T("Deal", "Trato hecho", "Combinado"), T("You promised to lock it up and use it responsibly.", "Prometiste guardarla bajo llave y usarla con responsabilidad.", "Você prometeu trancar e usar com responsabilidade."), eff({ H: -1 }))],
          [T("Tell them to back off", "Decirles que se alejen", "Mandar recuar"), () => out(c, T("Cold Dinner", "Cena fría", "Jantar frio"), T("Nobody talked to you the rest of the night.", "Nadie te habló el resto de la noche.", "Ninguém falou com você o resto da noite."), eff({ H: -6 }), T("I fought with my family about my gun.", "Discutí con mi familia por mi arma.", "Briguei com minha família por causa da minha arma."))],
        ],
      }),
    },
    {
      id: "exmil", t: T("Ex-Military Coach", "Instructor ex militar", "Instrutor ex-militar"), sel: mainGun,
      make: (c) => ({
        lead: T("A retired soldier at the range watches you shoot and offers to show you a few things.", "Un soldado retirado en el campo de tiro te ve disparar y se ofrece a enseñarte algunas cosas.", "Um soldado aposentado no estande te vê atirar e se oferece para te ensinar algumas coisas."),
        choices: [
          [lab(T("Take lessons", "Tomar clases", "Fazer aulas"), 150), pay(c, 150, () => { S().trained = true; out(c, T("Sharper", "Más afilado", "Mais afiado"), T("Stance, breathing, trigger control. You shoot way better now.", "Postura, respiración, control del gatillo. Ahora disparas mucho mejor.", "Postura, respiração, controle do gatilho. Agora você atira muito melhor."), eff({ m: -150, H: 4 }), T("A veteran taught me how to shoot properly.", "Un veterano me enseñó a disparar bien.", "Um veterano me ensinou a atirar direito.")); })],
          [T("Spar a little", "Practicar un poco", "Treinar um pouco"), () => {
            if (rnd() < 0.2) out(c, T("Humbled", "Humillado", "Humilhado"), T("He handed you your pride in a bag and a sore wrist.", "Te devolvió el orgullo en una bolsa y una muñeca adolorida.", "Ele te devolveu o orgulho numa sacola e um pulso dolorido."), eff({ He: -4, H: -2 }));
            else out(c, T("Good Practice", "Buena práctica", "Boa prática"), T("He showed you a couple of tricks and told war stories.", "Te mostró un par de trucos y contó historias de guerra.", "Ele mostrou uns truques e contou histórias de guerra."), eff({ H: 3 }));
          }],
          [T("Decline politely", "Rechazar con cortesía", "Recusar educadamente"), NOPE],
        ],
      }),
    },
    {
      id: "crewstrap", t: T("Crew Wants Your Strap", "La banda quiere tu fierro", "A gangue quer sua arma"), sel: mainGun, cond: () => !!gang(),
      make: (c) => ({
        lead: T("Your crew has a job tonight and one of the OGs needs your gun for it.", "Tu pandilla tiene un trabajo esta noche y uno de los OG necesita tu arma.", "Sua gangue tem um trabalho esta noite e um dos OGs precisa da sua arma."),
        choices: [
          [T("Hand it over", "Entregársela", "Entregar"), () => {
            takeGun(c.gun);
            const r = rnd();
            if (r < 0.25) return out(c, T("It Got Burned", "La quemaron", "Queimaram"), T("The job went bad. The gun is gone and so is the OG's trust in the crew.", "El trabajo salió mal. El arma ya no está y la confianza tampoco.", "O trabalho deu errado. A arma sumiu e a confiança também."), eff({ rep: 5, heat: 4 }), T("My crew used my gun on a job and it got burned.", "Mi pandilla usó mi arma en un trabajo y la quemaron.", "Minha gangue usou minha arma num trabalho e queimaram ela."));
            out(c, T("You're Solid", "Eres de confianza", "Você é de confiança"), T("The OG owes you one. The gun is gone for good, but your name is up.", "El OG te debe una. El arma se fue, pero tu nombre sube.", "O OG te deve uma. A arma sumiu, mas seu nome subiu."), eff({ rep: 8, heat: 3, m: 300 }), T("I handed my gun to my crew and earned respect.", "Le di mi arma a mi pandilla y gané respeto.", "Entreguei minha arma para minha gangue e ganhei respeito."));
          }],
          [T("Refuse", "Negarte", "Recusar"), () => out(c, T("Cold Looks", "Miradas frías", "Olhares frios"), T("They didn't like it. Your word means less now.", "No les gustó. Tu palabra vale menos ahora.", "Eles não gostaram. Sua palavra vale menos agora."), eff({ rep: -4, H: -2 }))],
          [T("Show them what it can do", "Mostrarles lo que hace", "Mostrar o que ela faz"), () => out(c, T("Impressed", "Impresionados", "Impressionados"), T("You put a few rounds downrange. They nodded and asked you to keep it.", "Pusiste unos tiros en el blanco. Asintieron y te pidieron que te la quedaras.", "Você acertou uns tiros no alvo. Eles acenaram e pediram que ficasse com ela."), eff({ rep: Math.max(2, Math.round(stt(c.gun).power * 20)), heat: 1 }), T("I showed my crew what my gun can do.", "Le mostré a mi pandilla lo que hace mi arma.", "Mostrei à minha gangue o que minha arma faz."))],
        ],
      }),
    },
  ];

  // ---------------------------------------------------------------- ejecución
  function evOk(ev) {
    try {
      if (ev.sel && !ev.sel()) return false;
      return ev.cond ? !!ev.cond() : true;
    } catch (e) {
      return false;
    }
  }

  function run(ev) {
    const gun = ev.sel ? ev.sel() : null;
    const c = { gun, icon: gun ? gpic(gun) : ev.icon || E("1f52b") };
    const m = ev.make(c);
    const rows = [...(gun ? [["Gun", gname(gun)]] : []), ...(m.rows || [])];
    jCard({ tag: TAG, iconSrc: c.icon, title: ev.t, lead: m.lead, rows, choices: m.choices });
  }

  function tick() {
    if (!window.FL_ARMS || typeof state === "undefined" || state.age < 16 || state.dead || state.prison) return;
    if (!owned().length) return;
    const a = S();
    const done = (a.evDone ||= {});
    if (rnd() >= (carried() ? 0.45 : 0.3)) return;
    const ok = EVENTS.filter((e) => (done[e.id] == null || state.age - done[e.id] >= 4) && evOk(e));
    if (!ok.length) return;
    const ev = rpick(ok);
    done[ev.id] = state.age;
    q(() => {
      if (state.dead || state.prison) return;
      try {
        run(ev);
      } catch (e) {
        console.warn("[arms-events]", ev.id, e);
      }
    });
  }

  // ---------------------------------------------------------------- "Pull your gun" en los atracos
  const gunFor = (home) => {
    const c = carried();
    if (c) return c;
    return home && owned().length ? strongest(owned()) : null;
  };
  const pullLabel = (g) => `${T("Pull your gun", "Sacar tu arma", "Sacar sua arma")} (${gname(g)})`;

  // dangerEvent: devuelve el texto del resultado (el juego lo muestra)
  function dangerPull(ev, g) {
    const s = stt(g);
    const cause = ev.bad && ev.bad[0] ? ev.bad[0][1] : "a gunshot wound";
    const flee = clampN(0.6 + s.power * 0.6 + (trained() ? 0.07 : 0), 0.6, 0.85);
    const hurtP = 0.1;
    const shootP = clampN(1 - flee - hurtP, 0.05, 0.3);
    const x = rnd();
    if (x < flee) {
      eff({ H: ri(3, 8) });
      return T("I pulled my gun and the robber ran off. I lost nothing.", "Saqué mi arma y el ladrón salió corriendo. No perdí nada.", "Saquei minha arma e o ladrão fugiu. Não perdi nada.");
    }
    if (x < flee + shootP) {
      eff({ H: -5 });
      if (s.illegal) {
        bust(g);
        return T("We exchanged shots, but the police found my illegal gun.", "Nos tiroteamos, pero la policía encontró mi arma ilegal.", "Trocamos tiros, mas a polícia achou minha arma ilegal.");
      }
      return T("We exchanged shots. It was self-defense and I was cleared of any charges.", "Hubo un tiroteo. Fue defensa propia y me libraron de cargos.", "Houve um tiroteio. Foi legítima defesa e fui liberado de qualquer acusação.");
    }
    const dead = wound(15, 35, 0.25, cause);
    eff({ H: -6 });
    return dead
      ? T("I pulled my gun but he was faster. I was shot.", "Saqué mi arma pero él fue más rápido. Me dispararon.", "Saquei minha arma mas ele foi mais rápido. Fui baleado.")
      : T("I pulled my gun but he was faster. I got hurt and he got away.", "Saqué mi arma pero él fue más rápido. Salí herido y se escapó.", "Saquei minha arma mas ele foi mais rápido. Me feri e ele escapou.");
  }

  const DANGER = ["Armed Robbery", "Mugging", "Home Invasion"];
  function patchDanger() {
    const arr = window.DANGER_EVENTS;
    if (!Array.isArray(arr)) return 0;
    let n = 0;
    for (const ev of arr) {
      if (!DANGER.includes(ev.t) || !Array.isArray(ev.bad)) continue;
      n++;
      if (ev.__gunPatched) continue;
      const bad = ev.bad.slice();
      Object.defineProperty(bad, "map", {
        value: function (cb, th) {
          const r = Array.prototype.map.call(this, cb, th);
          const g = gunFor(ev.t === "Home Invasion");
          if (g) r.push([pullLabel(g), () => dangerPull(ev, g)]);
          return r;
        },
        enumerable: false,
        writable: true,
        configurable: true,
      });
      ev.bad = bad;
      ev.__gunPatched = true;
    }
    return n;
  }

  // jewel-robbery: choice extra con getter en `c`
  const JEWEL_AT = ["street", "car", "club", "home", "hostage"];
  function jewelChoice(ev, g) {
    const s = stt(g);
    const host = ev.at === "hostage";
    const p = clampN(0.55 + s.power * 1.1 + (trained() ? 0.05 : 0) - (host ? 0.1 : 0), 0.45, 0.9);
    return {
      l: pullLabel(g),
      p,
      h: 1,
      d: 0.06,
      ...(host ? { k: 0.45 } : {}),
      ok: T("I pulled my gun and they ran. I kept my {item}.", "Saqué mi arma y salieron corriendo. Me quedé con mi {item}.", "Saquei minha arma e eles fugiram. Fiquei com meu {item}."),
      no: T("I pulled my gun but they were faster. They took my {item}.", "Saqué mi arma pero fueron más rápidos. Se llevaron mi {item}.", "Saquei minha arma mas eles foram mais rápidos. Levaram meu {item}."),
    };
  }
  function patchJewel() {
    const J = window.JEWEL_ROBBERY;
    if (!J || !Array.isArray(J.EVENTS)) return 0;
    let n = 0;
    for (const ev of J.EVENTS) {
      if (!ev.gun || !JEWEL_AT.includes(ev.at)) continue;
      if (ev.__gunPatched) { n++; continue; }
      if (!Array.isArray(ev.c) || ev.c.some((x) => /pull|draw your gun/i.test(x.l || ""))) continue;
      n++;
      const orig = ev.c;
      Object.defineProperty(ev, "c", {
        configurable: true,
        enumerable: true,
        get() {
          const g = gunFor(ev.at === "home");
          return g ? [...orig, jewelChoice(ev, g)] : orig.slice();
        },
        set(v) {
          Object.defineProperty(ev, "c", { value: v, writable: true, configurable: true, enumerable: true });
        },
      });
      ev.__gunPatched = true;
    }
    return n;
  }

  function patchRobberies() {
    const r = { danger: 0, jewel: 0 };
    try {
      r.danger = patchDanger();
    } catch (e) {
      console.warn("[arms-events] danger", e);
    }
    try {
      r.jewel = patchJewel();
    } catch (e) {
      console.warn("[arms-events] jewel", e);
    }
    return r;
  }

  // ---------------------------------------------------------------- arranque
  function boot() {
    if (!window.FL_ARMS || !document.getElementById("ageBtn")) return setTimeout(boot, 60);
    document.getElementById("ageBtn").addEventListener("click", () =>
      setTimeout(() => {
        try {
          tick();
        } catch (e) {
          console.warn("[arms-events] tick", e);
        }
      }, 0),
    );
    window.FL_ARMS_EVENTS = { tick, EVENTS, patchRobberies };
    let tries = 0;
    const again = () => {
      const r = patchRobberies();
      if ((!r.danger || !r.jewel) && ++tries < 20) setTimeout(again, 500);
    };
    again();
  }
  boot();
})();
