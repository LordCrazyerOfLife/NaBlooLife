/* Minijuego narrativo "hacer LIVE" (burlándote de una pandilla rival) con UI de live encima del juego. Sin assets ni logos: todo por código.
 * window.FL_LIVE.start({ platform, target:{name,short,icon}, you:{name,handle,followers,rank,heat,rep}, gun:{name,illegal}|null, hasRapper, duration (nº de eventos, def 5), onEnd(result) }) / stop().
 * onEnd(result) UNA vez, al cerrar el resumen ("Done"): { peak, avgViewers, newFollowers, gifts($), hype 0-100, rep -10..14, heat 0..40, rel -40..-5,
 *   retaliation, banned, flashedGun, locationSlip, replies }. stop() limpia sin llamar a onEnd. El motor NO toca el state del juego.
 * Números:
 *  - Viewers base = clamp(30 + followers*0.02 + rank*40, 20, 4000) * viewerMult. Viewers vivos = base * (1 + hype/100*1.5 + boost) con ruido +-5%, suavizado.
 *    boost = suma de la "v" de cada respuesta (rango -0.5..1.5). Peak = máximo visto.
 *  - Regalos por evento = viewers * lerp(0.4, 1.2, hype/100) * g(opción) * rand(.85,1.15) $, repartido en 2-4 regalos en el chat. Ambiente: viewers*(0.02..0.06) cada 5-9 s.
 *  - Seguidores nuevos = peak * lerp(0.05, 0.25, hype/100) * rand(.85,1.15).
 *  - rep = suma de r (cada respuesta, jitter +-25%, ignorar = -2) acotada a -10..+14 (baneo -3 extra). heat = suma de t + peak/800*4 acotada a 0..40.
 *  - rel = -(clamp(-suma de l, 5, 40)). Leer nombres / mostrar su cuadra pesan mucho más (l -20..-22).
 *  - Cada respuesta tiene riesgo de "backfire" (prob. k del tono): hype/viewers bajan, rep baja, calor sube.
 *  - retaliation = rand < clamp(0.04 + suma rt + (-rel)/150 + (slip?.15:0) + (flash?.1:0), 0, .9).
 *  - banned: por cada respuesta, rand < bn * (0.5 + toxicity) corta la live en ese momento.
 *  - Eventos: el 1º a los ~4 s, luego uno 5-8 s tras resolver el anterior (el panel dura 9 s; si se acaba = "ignoraste"). */
(function () {
  "use strict";
  if (window.FL_LIVE) return; // si el archivo se carga dos veces, la 2.ª instancia no puede cerrar el overlay de la 1.ª
  const T = (en) => en;
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const rnd = (a, b) => a + Math.random() * (b - a);
  const lerp = (a, b, k) => a + (b - a) * k;
  const num = (v, d) => (typeof v === "number" && isFinite(v) ? v : d);
  const pick = (a) => a[(Math.random() * a.length) | 0];
  const SUB = 0.1;
  let S = null;

  // Solo TikTok e Instagram: cada una tiene sus propios comentarios (PX), nombres de usuario (uname) y decisiones (eventos con plat:[...])
  const PLATFORMS = [
    { id: "tiktok", name: "TikTok", accent: "#fe2c55", bg: "linear-gradient(160deg,#0b1f2a 0%,#3a0f2a 55%,#050507 100%)", giftName: "Rose", giftIcon: "🌹", viewerMult: 1.25, toxicity: 0.65, likeLabel: "Likes" },
    { id: "instagram", name: "Instagram", accent: "#e1306c", bg: "linear-gradient(160deg,#3b1a57 0%,#7a2a4a 50%,#1a0d0a 100%)", giftName: "Badge", giftIcon: "⭐", viewerMult: 0.9, toxicity: 0.4, likeLabel: "Likes" },
  ];

  // ---------- tonos de respuesta (efectos base) ----------
  // h hype, v viewers (fracción), g regalos (mult), r rep, t heat, l relación, rt prob. retaliación, bn prob. baneo, k prob. backfire
  // fl = enseñas el arma, sl = se te escapa dónde estás, c = reacciones del chat
  const TONES = {
    clap: { h: 9, v: 0.08, g: 0.9, r: 3, t: 5, l: -8, rt: 0.08, bn: 0.06, k: 0.12, c: ["hype", "hype", "rival"], res: T("Chat went wild. They felt that.", "El chat se volvió loco. Eso les dolió.", "O chat pirou. Isso doeu neles.") },
    mock: { h: 12, v: 0.1, g: 1, r: 3, t: 6, l: -13, rt: 0.12, bn: 0.1, k: 0.15, c: ["hype", "hype", "troll"], res: T("Chat is crying laughing. They won't forget this.", "El chat se muere de risa. No se van a olvidar de esto.", "O chat tá morrendo de rir. Eles não vão esquecer isso.") },
    name: { h: 14, v: 0.14, g: 1.1, r: 4, t: 9, l: -22, rt: 0.25, bn: 0.14, k: 0.25, c: ["hype", "rival", "rival"], res: T("You said the name out loud. Chat lost it.", "Dijiste el nombre en voz alta. El chat explotó.", "Você falou o nome em voz alta. O chat enlouqueceu.") },
    laugh: { h: 3, v: 0.02, g: 0.4, r: 1, t: 1, l: -3, rt: 0.01, bn: 0, k: 0.05, c: ["hype", "troll"], res: T("You played it cool. Chat moves on.", "Te lo tomaste con calma. El chat sigue.", "Você levou na boa. O chat segue em frente.") },
    flash: { h: 16, v: 0.18, g: 1.2, r: 4, t: 16, l: -15, rt: 0.3, bn: 0.2, k: 0.2, fl: 1, c: ["hype", "hype", "rival"], res: T("The strap hit the camera. Chat exploded.", "El fierro salió en cámara. El chat explotó.", "A arma apareceu na câmera. O chat explodiu.") },
    shout: { h: 6, v: 0.05, g: 1.5, r: 2, t: 0, l: 0, rt: 0, bn: 0, k: 0.04, c: ["fan", "fan", "hype"], res: T("The fan went crazy. Gifts incoming.", "El fan se volvió loco. Vienen regalos.", "O fã ficou louco. Vêm presentes.") },
    calm: { h: -4, v: -0.03, g: 0.3, r: -1, t: -3, l: 3, rt: -0.03, bn: -0.03, k: 0, c: ["og", "troll"], res: T("You cooled it down. Some of chat is bored.", "Bajaste la temperatura. Parte del chat se aburre.", "Você esfriou a coisa. Parte do chat se entediou.") },
    ignore: { h: -6, v: -0.04, g: 0, r: -2, t: 0, l: 0, rt: 0, bn: 0, k: 0, c: ["hater", "troll"], res: T("You left it on read. Chat noticed.", "Lo dejaste en visto. El chat lo notó.", "Você deixou no vácuo. O chat notou.") },
    slip: { h: 10, v: 0.1, g: 1, r: 3, t: 10, l: -10, rt: 0.2, bn: 0.05, k: 0.1, sl: 1, c: ["hype", "rival", "rival"], res: T("You gave away more than you meant to.", "Soltaste más de lo que querías.", "Você falou mais do que devia.") },
    block: { h: 15, v: 0.15, g: 1.2, r: 4, t: 12, l: -20, rt: 0.2, bn: 0.08, k: 0.2, c: ["hype", "rival", "hype"], res: T("You put their block on blast.", "Pusiste su cuadra en evidencia.", "Você expôs a quebrada deles.") },
    diss: { h: 18, v: 0.16, g: 1.3, r: 5, t: 7, l: -18, rt: 0.15, bn: 0.1, k: 0.22, c: ["hype", "hype", "fan"], res: T("You dropped bars. Chat is screaming.", "Soltaste rimas. El chat grita.", "Você soltou as rimas. O chat tá gritando.") },
    dissr: { h: 24, v: 0.22, g: 1.6, r: 7, t: 6, l: -20, rt: 0.14, bn: 0.08, k: 0.08, c: ["hype", "hype", "fan"], res: T("Your rapper took the mic. Chat is going crazy.", "Tu rapero agarró el mic. El chat está loco.", "Seu rapper pegou o mic. O chat tá enlouquecendo.") },
    deal: { h: 2, v: 0, g: 2.2, r: -1, t: 4, l: 0, rt: 0, bn: 0.04, k: 0.1, c: ["hater", "hype"], res: T("You took the bag. Chat has questions.", "Agarraste la bolsa. El chat tiene preguntas.", "Você pegou a grana. O chat tem perguntas.") },
    ride: { h: 14, v: 0.2, g: 1.2, r: 3, t: 8, l: -10, rt: 0.1, bn: 0.1, k: 0.15, c: ["hype", "hype", "fan"], res: T("You rode the wave. Everybody is watching.", "Surfeaste la ola. Todos te están viendo.", "Você pegou a onda. Todo mundo tá vendo.") },
    backfire: { h: -8, v: -0.05, g: 0.2, r: -4, t: 3, l: 0, rt: 0.08, bn: 0.05, c: ["hater", "troll", "rival"], res: T("That backfired. Chat is clowning you.", "Te salió mal. El chat se burla de ti.", "Deu ruim. O chat tá zoando você.") }
  };

  const O = (tone, label, x, need) => ({ tone, label, x: x || null, need: need || null });
  const FLASH = (label) => O("flash", label || T("Flash the strap", "Enseñar el fierro", "Mostrar a arma"), null, "gun");

  // ---------- eventos ----------
  // user "@" fijo; user "rival" = usuario con la tag de la pandilla rival. when(S) opcional, w = peso, troll = se pondera con la toxicidad
  const EVENTS = [
    { id: "dead_block", user: "@cold_ty99", w: 1.2, troll: 1,
      msg: T("Your block is DEAD bro, nobody even pulls up there 😭", "Tu cuadra está MUERTA, nadie sale por ahí 😭", "Sua quebrada tá MORTA, ninguém aparece lá 😭"),
      opts: [O("clap", T("Clap back", "Responder fuerte", "Responder na lata")), O("mock", T("Mock their block", "Burlarte de su cuadra", "Zoar a quebrada deles")), O("laugh", T("Laugh it off", "Reírte", "Rir e deixar pra lá"))] },
    { id: "name_someone", user: "@sweetjazz_", w: 1,
      msg: T("Name somebody from {t}!! Say a name 👀", "Nombra a alguien de {t}!! Di un nombre 👀", "Fala o nome de alguém do {t}!! Diz um nome 👀"),
      opts: [O("name", T("Read their name out loud", "Leer su nombre en voz alta", "Ler o nome deles em voz alta")), O("shout", T("Shout out a fan", "Saludar a un fan", "Dar salve pra um fã")), O("laugh", T("Laugh it off", "Reírte", "Rir e deixar pra lá")), O("calm", T("Take it down a notch", "Bajarle dos rayitas", "Baixar a bola"))] },
    { id: "rival_enters", user: "rival", w: 1.4,
      msg: T("You talk a lot for somebody behind a phone. We see you.", "Hablas mucho pa estar detrás de un cel. Te vemos.", "Você fala muito pra quem tá atrás de um celular. A gente tá te vendo."),
      opts: [O("clap", T("Clap back", "Responder fuerte", "Responder na lata")), O("mock", T("Mock their block", "Burlarte de su cuadra", "Zoar a quebrada deles")), FLASH(), O("calm", T("Take it down a notch", "Bajarle dos rayitas", "Baixar a bola"))] },
    { id: "rival_freestyle", user: "rival", w: 1,
      msg: T("(drops a freestyle in chat) live on the phone, hiding at home...", "(suelta un freestyle en el chat) en vivo por el cel, escondido en casa...", "(solta um freestyle no chat) ao vivo no celular, escondido em casa..."),
      opts: [O("diss", T("Freestyle back", "Responder con freestyle", "Responder no freestyle")), O("dissr", T("Hand the mic to your rapper", "Pasarle el mic a tu rapero", "Passar o mic pro seu rapper"), null, "rapper"), O("laugh", T("Laugh it off", "Reírte", "Rir e deixar pra lá")), O("calm", T("Mute him", "Mutearlo", "Mutar ele"))] },
    { id: "mom_troll", user: "@mamas_fav", w: 1, troll: 1,
      msg: T("Does your mom know you're live? 😂", "Tu mamá sabe que estás en vivo? 😂", "Sua mãe sabe que você tá ao vivo? 😂"),
      opts: [O("laugh", T("Laugh it off", "Reírte", "Rir e deixar pra lá")), O("clap", T("Clap back", "Responder fuerte", "Responder na lata")), O("calm", T("Take it down a notch", "Bajarle dos rayitas", "Baixar a bola"))] },
    { id: "snitch", user: "@real_watcher", w: 0.9, troll: 1,
      msg: T("Ain't you the one who was talking to the cops? 👀 snitch", "No eres el que hablaba con la policía? 👀 soplón", "Não é você que tava falando com a polícia? 👀 X-9"),
      opts: [O("clap", T("Deny it loud", "Negarlo a gritos", "Negar na hora")), O("calm", T("Explain calmly", "Explicarlo con calma", "Explicar com calma")), O("name", T("Call out who started it", "Decir quién empezó el rumor", "Falar quem começou o boato")), O("laugh", T("Laugh it off", "Reírte", "Rir e deixar pra lá"))] },
    { id: "where_at", user: "@city_help_1", w: 1,
      msg: T("yo where you at rn? that street looks familiar, which block?", "yo dónde estás ahorita? esa calle me suena, qué cuadra?", "ei onde você tá agora? essa rua me parece conhecida, qual quebrada?"),
      opts: [O("slip", T("Tell them", "Decírselo", "Contar pra eles")), O("laugh", T("Keep it vague", "Responder vago", "Ficar vago")), O("calm", T("Don't say a thing", "No decir nada", "Não dizer nada")), O("clap", T("Ask who is asking", "Preguntar quién pregunta", "Perguntar quem tá perguntando"))] },
    { id: "sponsor_dm", user: "@promo_desk", w: 0.8,
      msg: T("DM: we got a deal for you. Cash for a shoutout. Wanna talk?", "DM: tenemos un trato pa ti. Plata por un saludo. Hablamos?", "DM: temos uma proposta pra você. Grana por um salve. Bora conversar?"),
      opts: [O("deal", T("Take the deal", "Aceptar el trato", "Aceitar a proposta")), O("deal", T("Ask for more cash", "Pedir más plata", "Pedir mais grana"), { g: 3, k: 0.35, r: -2 }), O("calm", T("Decline politely", "Decir que no con respeto", "Recusar com educação"))] },
    { id: "big_gift", user: "@whale_king", w: 0.9,
      msg: T("sent {gift} ×50 — shoutout me bro 🙏", "mandó {gift} ×50 — salúdame bro 🙏", "mandou {gift} ×50 — me dá um salve mano 🙏"),
      opts: [O("shout", T("Shout out a fan", "Saludar a un fan", "Dar salve pra um fã"), { g: 2.2 }), O("calm", T("Thank him quick", "Agradecerle rápido", "Agradecer rápido")), O("block", T("Make it a shoutout for your block", "Saludar a tu cuadra", "Mandar salve pra sua quebrada"), { l: -6, t: 6 })] },
    { id: "mod_warn", user: "@live_mod", w: 0.8,
      msg: T("Mod notice: keep it clean or this live gets cut.", "Aviso del mod: ponte limpio o se corta la live.", "Aviso do mod: pega leve ou a live é cortada."),
      opts: [O("calm", T("Take it down a notch", "Bajarle dos rayitas", "Baixar a bola"), { bn: -0.08, h: -2 }), O("clap", T("Ignore the warning", "Ignorar el aviso", "Ignorar o aviso"), { bn: 0.28, h: 10, t: 4 }), O("laugh", T("Joke about the mods", "Bromear con los mods", "Zoar os mods"), { bn: 0.12 })] },
    { id: "toy_gun", user: "@airsoft_andy", w: 1, troll: 1, when: (s) => !!s.gun,
      msg: T("that {g} is a toy lol 😂 BB gun!", "ese {g} es de juguete jaja 😂 de balines!", "essa {g} é de brinquedo kkk 😂 airsoft!"),
      opts: [FLASH(), O("mock", T("Mock his take", "Burlarte de su opinión", "Zoar a opinião dele")), O("laugh", T("Laugh it off", "Reírte", "Rir e deixar pra lá")), O("calm", T("Take it down a notch", "Bajarle dos rayitas", "Baixar a bola"))] },
    { id: "diss_challenge", user: "@bars_or_bust", w: 1,
      msg: T("Drop a diss on {t} right now. Freestyle. Chat is waiting 🎤", "Suelta un diss a {t} ahora. Freestyle. El chat espera 🎤", "Solta um diss no {t} agora. Freestyle. O chat tá esperando 🎤"),
      opts: [O("diss", T("Freestyle a diss", "Tirar un diss de freestyle", "Soltar um diss de freestyle")), O("dissr", T("Put your rapper on it", "Ponerle a tu rapero", "Colocar seu rapper nessa"), null, "rapper"), O("laugh", T("Pass on it", "Pasar", "Passar"))] },
    { id: "block_photo", user: "@pic_drop", w: 1,
      msg: T("(posts a photo of a block) is this yours? 👀", "(sube una foto de una cuadra) esta es la tuya? 👀", "(posta uma foto de uma quebrada) essa é a sua? 👀"),
      opts: [O("slip", T("Confirm it's your block", "Confirmar que es tu cuadra", "Confirmar que é sua quebrada")), O("laugh", T("Say it's not you", "Decir que no eres tú", "Dizer que não é você")), O("block", T("Counter with their block", "Contestar con su cuadra", "Rebater com a quebrada deles")), O("calm", T("Take it down a notch", "Bajarle dos rayitas", "Baixar a bola"))] },
    { id: "pull_up", user: "rival", w: 1.2,
      msg: T("Pull up then. Send the address. We'll be waiting 🚗", "Pues cae. Manda la dirección. Te esperamos 🚗", "Então aparece. Manda o endereço. A gente espera 🚗"),
      opts: [O("clap", T("Dare them to pull up", "Retarlos a que caigan", "Desafiar eles a aparecer"), { rt: 0.3 }), O("slip", T("Drop a hint where you are", "Soltar una pista de dónde estás", "Soltar uma pista de onde você tá")), FLASH(), O("calm", T("Take it down a notch", "Bajarle dos rayitas", "Baixar a bola"))] },
    { id: "og_calm", user: "@og_big_will", w: 0.7,
      msg: T("Lil bro, you're saying too much on a live. Calm it.", "Hermanito, estás hablando de más en una live. Cálmate.", "Mano, você tá falando demais numa live. Se acalma."),
      opts: [O("calm", T("Take it down a notch", "Bajarle dos rayitas", "Baixar a bola"), { r: 2 }), O("clap", T("Respect the OG, keep going", "Respetar al OG y seguir", "Respeitar o OG e continuar"), { r: 1, l: -4 }), O("mock", T("Tell him to stay out of it", "Decirle que no se meta", "Mandar ele não se meter"), { r: -3, h: 8 })] },
    { id: "rival_live", user: "@live_alert", w: 1,
      msg: T("{t} just went live and they're talking about you 👀", "{t} acaba de salir en vivo y hablan de ti 👀", "O {t} acabou de entrar ao vivo e tão falando de você 👀"),
      opts: [O("mock", T("Mock their live", "Burlarte de su live", "Zoar a live deles")), O("name", T("Read their name out loud", "Leer su nombre en voz alta", "Ler o nome deles em voz alta")), O("shout", T("Tell chat to leave it", "Decirle al chat que lo deje", "Mandar o chat deixar quieto"), { l: 0, r: 1 })] },
    { id: "viral_surge", user: "@clipfarm", w: 1.5, when: (s) => s.peakV >= 300,
      msg: T("Chat is going crazy!! You're trending rn 🔥🔥", "El chat está loco!! Estás en tendencia 🔥🔥", "O chat tá louco!! Você tá nos assuntos do momento 🔥🔥"),
      opts: [O("ride", T("Ride the wave", "Surfear la ola", "Aproveitar a onda")), O("shout", T("Shout out a fan", "Saludar a un fan", "Dar salve pra um fã")), O("calm", T("Stay on topic", "Seguir en lo tuyo", "Manter o assunto"))] },
    { id: "rapper_cameo", user: "@real_ones", w: 1.6, when: (s) => s.hasRapper,
      msg: T("yo where's your rapper? run it up 🎤", "yo dónde está tu rapero? que suelte algo 🎤", "ei cadê seu rapper? manda ver 🎤"),
      opts: [O("dissr", T("Bring your rapper on", "Traer a tu rapero", "Chamar seu rapper")), O("shout", T("Plug his next song", "Promocionar su próxima canción", "Divulgar a próxima música dele"), { g: 1.8 }), O("calm", T("Say he's busy", "Decir que está ocupado", "Dizer que ele tá ocupado"))] },
    { id: "clip_it", user: "@clipper_mo", w: 1,
      msg: T("I'm clipping this. Say something crazy 😈", "Estoy clipeando esto. Di algo loco 😈", "Tô clipando isso. Fala algo maluco 😈"),
      opts: [O("name", T("Read their name out loud", "Leer su nombre en voz alta", "Ler o nome deles em voz alta")), O("clap", T("Clap back", "Responder fuerte", "Responder na lata")), O("laugh", T("Laugh it off", "Reírte", "Rir e deixar pra lá")), O("calm", T("Take it down a notch", "Bajarle dos rayitas", "Baixar a bola"))] },
    { id: "ex_homie", user: "@used_to_ride", w: 0.9,
      msg: T("You used to chill with {t} before. Switched up huh?", "Antes andabas con {t}. Cambiaste, no?", "Você andava com o {t} antes. Mudou, hein?"),
      opts: [O("clap", T("Clap back", "Responder fuerte", "Responder na lata")), O("name", T("Read their name out loud", "Leer su nombre en voz alta", "Ler o nome deles em voz alta")), O("calm", T("Take it down a notch", "Bajarle dos rayitas", "Baixar a bola")), O("laugh", T("Laugh it off", "Reírte", "Rir e deixar pra lá"))] },

    // ----- solo TikTok -----
    { id: "tt_stitch", plat: ["tiktok"], user: "@stitch_king", w: 1.3,
      msg: T("Stitch their last video and roast it live 😈 chat wants a stitch", "Hazle stitch a su último video y quémalo en vivo 😈 el chat quiere un stitch", "Dá stitch no último vídeo deles e queima ao vivo 😈 o chat quer um stitch"),
      opts: [O("mock", T("Stitch it and roast it", "Hacer stitch y quemarlos", "Dar stitch e queimar")), O("name", T("Stitch and read their name", "Stitch y leer su nombre", "Stitch e ler o nome deles")), O("laugh", T("Skip it", "Saltarlo", "Pular"))] },
    { id: "tt_fyp", plat: ["tiktok"], user: "@fyp_alert", w: 1.4, when: (s) => s.peakV >= 200,
      msg: T("You're on the FYP right now!! Everybody's piling in 🔥", "Estás en el FYP ahorita!! Todo el mundo está entrando 🔥", "Você tá na FYP agora!! Todo mundo tá entrando 🔥"),
      opts: [O("ride", T("Ride the FYP wave", "Surfear la ola del FYP", "Aproveitar a onda da FYP")), O("shout", T("Shout out the new followers", "Saludar a los seguidores nuevos", "Dar salve pros novos seguidores")), O("calm", T("Stay on topic", "Seguir en lo tuyo", "Continuar no assunto"))] },
    { id: "tt_battle", plat: ["tiktok"], user: "rival", w: 1.3,
      msg: T("{t} invited you to a LIVE Battle. Gifts decide who wins ⚔️", "{t} te invitó a un LIVE Battle. Los regalos deciden quién gana ⚔️", "O {t} te convidou pra uma Battle AO VIVO. Os presentes decidem quem ganha ⚔️"),
      opts: [O("ride", T("Accept the battle", "Aceptar la batalla", "Aceitar a battle"), { g: 2, k: 0.3, rt: 0.12 }), O("deal", T("Beg chat for gifts", "Pedirle regalos al chat", "Pedir presentes pro chat"), { g: 2.4, k: 0.25 }), O("calm", T("Decline the battle", "Rechazar la batalla", "Recusar a battle"))] },
    { id: "tt_universe", plat: ["tiktok"], user: "@gift_gang", w: 1, troll: 1,
      msg: T("send a Universe if you say a name from {t} 👀🌌", "mando un Universo si dices un nombre de {t} 👀🌌", "mando um Universo se você falar um nome do {t} 👀🌌"),
      opts: [O("name", T("Say a name for the gift", "Decir un nombre por el regalo", "Falar um nome pelo presente"), { g: 2.5 }), O("deal", T("Ask for the gift first", "Pedir el regalo primero", "Pedir o presente antes")), O("laugh", T("Laugh it off", "Reírte", "Rir e deixar pra lá"))] },
    { id: "tt_report", plat: ["tiktok"], user: "@report_squad", w: 0.9, troll: 1,
      msg: T("mass reporting this live 🚩 TikTok is gonna cut you", "reportando masivamente este live 🚩 TikTok te va a cortar", "denunciando essa live em massa 🚩 o TikTok vai te cortar"),
      opts: [O("calm", T("Tell chat to ignore them", "Decirle al chat que los ignore", "Pedir pro chat ignorar eles"), { bn: -0.08 }), O("clap", T("Say it louder", "Decirlo más fuerte", "Falar mais alto"), { bn: 0.3, h: 12 }), O("laugh", T("Laugh it off", "Reírte", "Rir e deixar pra lá"))] },
    { id: "tt_duet", plat: ["tiktok"], user: "@duet_me", w: 1.6, when: (s) => s.hasRapper,
      msg: T("Duet your rapper on this live!! Run the beat back 🎤🔥", "Hazle dueto a tu rapero en este live!! Pon el beat otra vez 🎤🔥", "Faz dueto com seu rapper nessa live!! Volta o beat 🎤🔥"),
      opts: [O("dissr", T("Duet your rapper", "Dueto con tu rapero", "Dueto com seu rapper"), null, "rapper"), O("shout", T("Plug his page", "Promocionar su página", "Divulgar a página dele"), { g: 1.8 }), O("laugh", T("Not now", "Ahora no", "Agora não"))] },
    { id: "tt_guest", plat: ["tiktok"], user: "rival", w: 1,
      msg: T("{t} requested to join your live as a guest. Let them in? 👀", "{t} pidió unirse a tu live como invitado. Los dejas entrar? 👀", "O {t} pediu pra entrar na sua live como convidado. Deixa entrar? 👀"),
      opts: [O("mock", T("Let them in and roast them", "Dejarlos entrar y quemarlos", "Deixar entrar e queimar"), { k: 0.3, rt: 0.15, h: 16 }), O("calm", T("Decline the request", "Rechazar la solicitud", "Recusar o pedido")), FLASH(T("Flash the strap on cam", "Enseñar el fierro en cámara", "Mostrar a arma na câmera"))] },
    // ----- solo Instagram -----
    { id: "ig_story", plat: ["instagram"], user: "@story_tags", w: 1.3,
      msg: T("Reshare this to your story and tag {t} 😈", "Compártelo a tu story y etiqueta a {t} 😈", "Compartilha no seu story e marca o {t} 😈"),
      opts: [O("block", T("Post it and tag them", "Publicarlo y etiquetarlos", "Postar e marcar eles"), { l: -16 }), O("mock", T("Make a story just for them", "Hacer un story solo pa ellos", "Fazer um story só pra eles")), O("laugh", T("Keep it on the live", "Dejarlo en el live", "Deixar só na live"))] },
    { id: "ig_collab", plat: ["instagram"], user: "rival", w: 1.2,
      msg: T("{t} sent you a collab request on this live. Accept? 😏", "{t} te mandó una solicitud de colaboración en este live. Aceptas? 😏", "O {t} mandou um pedido de colab nessa live. Aceita? 😏"),
      opts: [O("mock", T("Accept it and roast them", "Aceptar y quemarlos", "Aceitar e queimar"), { k: 0.3, rt: 0.15 }), O("clap", T("Decline it publicly", "Rechazarla en público", "Recusar em público")), O("laugh", T("Ignore it", "Ignorarla", "Ignorar"))] },
    { id: "ig_dm", plat: ["instagram"], user: "rival", w: 1.2,
      msg: T("(slid in your DMs) we know which block you're on. say hi to the camera 🙂", "(se metió a tus DMs) sabemos en qué cuadra estás. saluda a la cámara 🙂", "(entrou no seu DM) a gente sabe em que quebrada você tá. dá tchau pra câmera 🙂"),
      opts: [O("block", T("Show the DM on live", "Mostrar el DM en vivo", "Mostrar o DM ao vivo"), { l: -18 }), O("calm", T("Block them", "Bloquearlos", "Bloquear")), O("slip", T("Reply: pull up", "Responder: caigan", "Responder: aparece"))] },
    { id: "ig_close", plat: ["instagram"], user: "@close_friend", w: 0.9,
      msg: T("Somebody screenshotted your close friends story and it's going around 📸", "Alguien capturó tu story de mejores amigos y está circulando 📸", "Alguém printou seu story de melhores amigos e tá circulando 📸"),
      opts: [O("clap", T("Own it", "Aceptarlo", "Assumir")), O("laugh", T("Say it's old", "Decir que es viejo", "Dizer que é antigo")), O("calm", T("Delete it", "Borrarlo", "Apagar"))] },
    { id: "ig_channel", plat: ["instagram"], user: "@broadcast_ch", w: 1,
      msg: T("Start a broadcast channel!! drop alerts every time you go live 🔔", "Abre un canal de difusión!! avisa cada vez que salgas en vivo 🔔", "Abre um canal de transmissão!! avisa toda vez que entrar ao vivo 🔔"),
      opts: [O("shout", T("Start the channel", "Abrir el canal", "Abrir o canal"), { g: 1.8 }), O("shout", T("Plug your music", "Promocionar tu música", "Divulgar sua música"), { g: 1.4 }), O("laugh", T("Not yet", "Todavía no", "Ainda não"))] },
    { id: "ig_guidelines", plat: ["instagram"], user: "@meta_notice", w: 0.9,
      msg: T("Notice: this live may go against community guidelines.", "Aviso: este live puede ir contra las normas de la comunidad.", "Aviso: essa live pode ir contra as diretrizes da comunidade."),
      opts: [O("calm", T("Tone it down", "Bajarle el tono", "Baixar o tom"), { bn: -0.1, h: -2 }), O("clap", T("Keep going", "Seguir igual", "Continuar igual"), { bn: 0.3, h: 10, t: 4 }), O("laugh", T("Switch to talking about the fits", "Cambiar a hablar de la ropa", "Mudar pra falar das roupas"))] },
    { id: "ig_reel", plat: ["instagram"], user: "@reel_hunt", w: 1.1,
      msg: T("Say something crazy, I'm cutting this for a reel 🎬", "Di algo loco, lo estoy cortando pa un reel 🎬", "Fala algo maluco, tô cortando pra um reel 🎬"),
      opts: [O("name", T("Read their name out loud", "Leer su nombre en voz alta", "Ler o nome deles em voz alta")), O("clap", T("Clap back", "Responder fuerte", "Responder na lata")), O("laugh", T("Laugh it off", "Reírte", "Rir e deixar pra lá"))] },
  ];

  // ---------- chat ----------
  const POOL = {
    hype: [T("🔥🔥 burn them", "🔥🔥 quémalos", "🔥🔥 queima eles"), T("NO WAY he said that", "NO MAMES dijo eso", "NÃO ACREDITO que ele falou isso"), T("this is crazy 😭", "esto está loco 😭", "isso tá loucura 😭"), T("W live", "W live", "W live"), T("go off 🔥", "dale con todo 🔥", "vai com tudo 🔥"), T("say it louder", "dilo más fuerte", "fala mais alto"), T("clip it clip it", "clipéalo clipéalo", "clipa clipa"), T("who's {t} lol 💀", "quién es {t} jaja 💀", "quem é o {t} kkk 💀"), T("bro cooked them", "los cocinó", "ele fritou eles"), T("ratio'd 💀", "los dejó en ridículo 💀", "humilhou 💀")],
    troll: [T("first 🥇", "primero 🥇", "primeiro 🥇"), T("is this live or memorex", "esto es live o grabado", "isso é ao vivo ou gravado"), T("your camera quality is wild", "tu cámara está horrible", "sua câmera tá horrível"), T("chat is this real?", "chat esto es real?", "chat isso é real?"), T("mic sounds like a fridge", "el mic suena a nevera", "o mic parece uma geladeira"), T("L stream", "L stream", "L stream"), T("who let him cook", "quién lo dejó cocinar", "quem deixou ele cozinhar")],
    hater: [T("this you? 🤡", "este eres tú? 🤡", "esse é você? 🤡"), T("nobody knows you", "nadie te conoce", "ninguém te conhece"), T("all talk 🧢", "puro cuento 🧢", "só papo 🧢"), T("your block is dead and you know it", "tu cuadra está muerta y lo sabes", "sua quebrada tá morta e você sabe"), T("cap 🧢", "mentira 🧢", "mentira 🧢"), T("touch grass bro", "sal a la calle bro", "vai tocar na grama mano")],
    fan: [T("shoutout to my block pls 🙏", "saluda a mi cuadra porfa 🙏", "dá um salve na minha quebrada 🙏"), T("say my name!!", "di mi nombre!!", "fala meu nome!!"), T("been here since day one", "aquí desde el día uno", "tô aqui desde o primeiro dia"), T("give me a shoutout bro", "dame un saludo bro", "me dá um salve mano"), T("love from the other side of town ❤️", "saludos desde el otro lado de la ciudad ❤️", "salve do outro lado da cidade ❤️")],
    rival: [T("Y'all {t} ain't playing", "Los {t} no estamos jugando", "O {t} não tá de brincadeira"), T("talking big on a phone 😂", "hablando duro desde un cel 😂", "falando grosso no celular 😂"), T("we see you.", "te vemos.", "a gente tá te vendo."), T("keep talking.", "sigue hablando.", "continua falando."), T("remember this stream.", "acuérdate de esta live.", "lembra dessa live."), T("pull up then.", "pues cae.", "então aparece.")],
    og: [T("Chill out young one", "Tranquilo joven", "Calma jovem"), T("Don't say too much on here.", "No hables de más aquí.", "Não fala demais aqui."), T("Smart move. Keep it low.", "Buena jugada. Bajo perfil.", "Boa jogada. Fica na sua.")]
  };

  // ---------- comentarios propios de cada plataforma ----------
  const PX = {
    tiktok: {
      hype: [T("this is the FYP 🔥🔥", "esto es el FYP 🔥🔥", "isso é a FYP 🔥🔥"), T("stitch this NOW", "haz stitch YA", "faz stitch AGORA"), T("sound on 🔊🔥", "sonido arriba 🔊🔥", "som ligado 🔊🔥"), T("who's here from the FYP 🙋", "quién viene del FYP 🙋", "quem veio da FYP 🙋"), T("send a rose 🌹 he's cooking", "manda una rosa 🌹 está cocinando", "manda uma rosa 🌹 ele tá cozinhando")],
      troll: [T("tiktok about to ban this 💀", "tiktok va a banear esto 💀", "o tiktok vai banir isso 💀"), T("pls follow back 🥺", "sígueme de vuelta 🥺", "me segue de volta 🥺"), T("ratio + you fell off", "ratio + te caíste", "ratio + você caiu"), T("how many gifts for a shoutout?", "cuántos regalos pa un saludo?", "quantos presentes pra um salve?"), T("🤡🤡🤡", "🤡🤡🤡", "🤡🤡🤡")],
      hater: [T("this ain't going viral 🥱", "esto no se va a hacer viral 🥱", "isso não vai viralizar 🥱"), T("cap 🧢 report this live", "mentira 🧢 reporten este live", "mentira 🧢 denunciem essa live"), T("go back to the comment section", "vuelve a la sección de comentarios", "volta pros comentários")],
      fan: [T("duet me after this 🙏", "hazme dueto después 🙏", "faz dueto comigo depois 🙏"), T("follow for a follow? 💯", "sígueme y te sigo? 💯", "me segue que eu te sigo? 💯"), T("say hi to my city!!", "saluda a mi ciudad!!", "dá oi pra minha cidade!!")],
      rival: [T("we saw this on the FYP 😂", "vimos esto en el FYP 😂", "a gente viu isso na FYP 😂"), T("{t} ain't hiding. stitching you next.", "{t} no se esconde. te hago stitch ahorita.", "{t} não se esconde. vou te dar stitch.")],
    },
    instagram: {
      hype: [T("this is going on my story 📲", "esto va a mi story 📲", "isso vai pro meu story 📲"), T("clip it for the reel 🎬", "clipéalo pa un reel 🎬", "clipa pro reel 🎬"), T("🔥🔥🔥 love this", "🔥🔥🔥 me encanta", "🔥🔥🔥 amei"), T("sharing this to close friends", "esto va a mejores amigos", "mandando pros melhores amigos"), T("double tap if you're from the block 💯", "doble toque si eres de la cuadra 💯", "dois toques se você é da quebrada 💯")],
      troll: [T("the lighting tho 😭", "la luz tho 😭", "a iluminação tho 😭"), T("link in bio?", "link en la bio?", "link na bio?"), T("is this a broadcast channel thing", "esto es de canal de difusión?", "isso é coisa de canal de transmissão"), T("meta gonna cut this 😬", "meta lo va a cortar 😬", "o meta vai cortar isso 😬")],
      hater: [T("all filter no substance", "puro filtro y nada de fondo", "só filtro e nenhuma substância"), T("this you? sad 🤡", "este eres tú? qué triste 🤡", "esse é você? triste 🤡"), T("unfollowed", "dejé de seguirte", "deixei de seguir")],
      fan: [T("shoutout to my page pls 🙏", "saluda a mi página porfa 🙏", "dá um salve na minha página 🙏"), T("pin my comment!!", "fija mi comentario!!", "fixa meu comentário!!"), T("follow back? dm me", "sígueme de vuelta? escríbeme", "me segue de volta? me chama no dm")],
      rival: [T("we got screenshots 📸", "tenemos capturas 📸", "a gente tem print 📸"), T("{t} is watching this live. all of us.", "{t} está viendo esta live. todos.", "o {t} tá vendo essa live. todos nós.")],
    },
  };
  const PRE = ["lil", "big", "yung", "dre", "ty", "mo", "k", "juice", "slim", "tre", "baby", "trap", "ghost", "nova", "fly", "doe"];
  const SUF = ["_02", "xx", "1k", "_off", "99", "tv", "_ent", "808", "_x", "07"];
  const COLS = ["#ff9aa2", "#ffd479", "#9be3a0", "#8fd3ff", "#c3a6ff", "#ffb4e6", "#b8e986", "#ffc48c"];
  // nombres de usuario con el estilo de cada app: TikTok = "lilyy_fyp", "user4827163"; Instagram = "dre.shotz", "the.coach_"
  const TT_A = ["lil", "dre", "tre", "yung", "its", "real", "thatguy", "fyp", "vibes", "slim", "nova", "juice", "kiki", "moe", "baby", "ghost"];
  const TT_B = ["_fyp", "edits", "_clips", "xo", "_tv", "2k", "_official", "vibez", "_01", "wtf", "x7", "_live"];
  const IG_A = ["dre", "tre", "slim", "its", "mo", "kay", "jay", "coach", "studio", "the", "lil", "big", "no"];
  const IG_B = ["shotz", "visuals", "fits", "kicks", "wave", "daily", "gram", "creative", "lens", "bts", "talk", "vault"];
  function uname() {
    const id = S && S.plat && S.plat.id;
    if (id === "tiktok") return Math.random() < 0.2 ? "@user" + (1000000 + ((Math.random() * 8999999) | 0)) : "@" + pick(TT_A) + pick(TT_B);
    if (id === "instagram") return "@" + pick(IG_A) + (Math.random() < 0.7 ? "." : "_") + pick(IG_B) + (Math.random() < 0.25 ? "_" : "");
    return "@" + pick(PRE) + pick(SUF);
  }

  const CSS = "@keyframes flblink{0%,100%{opacity:1}50%{opacity:.25}}" +
    "@keyframes flheart{0%{transform:translate(0,0) scale(.6);opacity:1}100%{transform:translate(var(--dx),-230px) scale(1.15);opacity:0}}" +
    "@keyframes flgift{0%{box-shadow:0 0 0 rgba(255,255,255,0)}30%{box-shadow:0 0 18px var(--ac)}100%{box-shadow:0 0 0 rgba(255,255,255,0)}}" +
    "@keyframes flup{0%{transform:translateY(14px);opacity:0}100%{transform:none;opacity:1}}" +
    "@media (prefers-reduced-motion:reduce){.flblink,.flpanel,.flgift{animation:none!important}}";

  function h(tag, css, txt) {
    const e = document.createElement(tag);
    if (css) e.style.cssText = css;
    if (txt != null) e.textContent = txt;
    return e;
  }
  function add(p) { for (let i = 1; i < arguments.length; i++) p.appendChild(arguments[i]); return p; }
  function kill(e) { if (e && e.parentNode) e.parentNode.removeChild(e); }
  function sfx(n) { try { if (typeof window.play === "function") window.play(n); } catch (e) { /* sin sonido */ } }
  function compact(n) { n = Math.round(n); return n >= 10000 ? (n / 1000).toFixed(0) + "K" : n >= 1000 ? (n / 1000).toFixed(1) + "K" : String(n); }
  function F(s) { return String(s).replace(/\{t\}/g, S.tName).replace(/\{s\}/g, S.tShort).replace(/\{g\}/g, S.gun ? S.gun.name || "strap" : "strap").replace(/\{gift\}/g, S.plat.giftName); }

  // ---------- UI ----------
  function btn(label, css, fn) {
    const b = h("button", "font:700 12px system-ui,sans-serif;border:0;border-radius:10px;cursor:pointer;color:#fff;" + css, label);
    b.addEventListener("click", fn);
    return b;
  }

  function drawCam() {
    const cv = S.ui.cam;
    let c = null;
    try { c = cv.getContext("2d"); } catch (e) { c = null; }
    if (!c) return;
    let av = null;
    try { av = typeof document.querySelector === "function" ? document.querySelector(".phone > .profile canvas.avatar") : null; } catch (e) { av = null; }
    S.avatar = av && av.width > 0 && av.height > 0 ? av : null;
    try {
      if (S.avatar) {
        const aw = S.avatar.width, ah = S.avatar.height, sc = 170 / Math.max(aw, ah);
        try { c.filter = "blur(2px)"; } catch (e) { /* sin filtro */ }
        c.globalAlpha = 0.92;
        c.drawImage(S.avatar, 90 - (aw * sc) / 2, 40, aw * sc, ah * sc);
        c.globalAlpha = 1;
      } else {
        c.fillStyle = "#1b1b24"; c.beginPath(); c.arc(90, 120, 34, 0, Math.PI * 2); c.fill();
        c.beginPath(); c.arc(90, 230, 70, Math.PI, 0); c.fill();
        c.fillStyle = "#262633"; c.fillRect(66, 92, 48, 8);
      }
    } catch (e) { /* canvas falso o roto */ }
  }

  function buildUI() {
    const P = S.plat, ac = P.accent;
    const ov = h("div", "position:fixed;left:0;top:0;right:0;bottom:0;z-index:2147483200;background:#000;touch-action:manipulation;user-select:none;-webkit-user-select:none;overflow:hidden;");
    const css = h("style", null, CSS);
    const wrap = h("div", "position:relative;width:100%;max-width:430px;height:100%;margin:0 auto;overflow:hidden;background:" + P.bg + ";font-family:system-ui,-apple-system,sans-serif;color:#fff;");
    const cam = h("canvas", "position:absolute;left:0;top:0;width:100%;height:100%;filter:blur(1.5px);transform-origin:50% 40%;");
    cam.width = 180; cam.height = 320;
    const vig = h("div", "position:absolute;left:0;top:0;right:0;bottom:0;pointer-events:none;background:radial-gradient(ellipse at 50% 45%,rgba(0,0,0,0) 40%,rgba(0,0,0,.75) 100%),linear-gradient(to top,rgba(0,0,0,.75) 0%,rgba(0,0,0,0) 45%);");
    const rec = h("div", "position:absolute;left:12px;top:78px;font:700 11px monospace;color:#ff4d4d;text-shadow:0 1px 3px #000;", "● REC 00:00");
    rec.className = "flblink";
    if (!S.reduced) rec.style.animation = "flblink 1.2s infinite";

    // arriba
    const top = h("div", "position:absolute;left:0;right:0;top:0;padding:10px 10px 6px;display:flex;align-items:center;gap:8px;");
    const avs = h("canvas", "width:34px;height:34px;border-radius:50%;border:2px solid " + ac + ";background:#222;flex:none;");
    avs.width = 34; avs.height = 34;
    try { const c = avs.getContext("2d"); if (c && S.avatar) c.drawImage(S.avatar, 0, 0, S.avatar.width, S.avatar.height, 0, 0, 34, 34); } catch (e) { /* nada */ }
    const who = h("div", "flex:1;min-width:0;");
    const hd = h("div", "font:700 12px system-ui;text-shadow:0 1px 3px #000;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;", S.handle);
    const sub = h("div", "font:11px system-ui;opacity:.9;text-shadow:0 1px 3px #000;");
    const live = h("span", "background:#e02020;color:#fff;font:800 10px system-ui;padding:1px 6px;border-radius:4px;margin-right:6px;", "LIVE");
    live.className = "flblink";
    if (!S.reduced) live.style.animation = "flblink 1.6s infinite";
    const eye = h("span", null, "👁 0");
    const likes = h("span", "margin-left:8px;", "❤ 0");
    add(sub, live, eye, likes);
    add(who, hd, sub);
    const end = btn("✕", "width:30px;height:30px;background:rgba(0,0,0,.55);font-size:14px;", () => endLive("manual"));
    end.title = T("End live", "Terminar live", "Encerrar live");
    const endBox = h("div", "flex:none;"); add(endBox, end);
    add(top, avs, who, endBox);
    const bar = h("div", "position:absolute;left:10px;right:10px;top:50px;height:3px;border-radius:2px;background:rgba(255,255,255,.25);");
    const barIn = h("div", "height:100%;width:0%;border-radius:2px;background:" + ac + ";");
    add(bar, barIn);

    const hearts = h("div", "position:absolute;right:10px;bottom:70px;width:60px;height:260px;pointer-events:none;");
    const gwrap = h("div", "position:absolute;left:0;right:0;bottom:0;padding:0 10px 8px;display:flex;flex-direction:column;");
    const slot = h("div", "margin-bottom:6px;");
    const chat = h("div", "display:flex;flex-direction:column;justify-content:flex-end;gap:3px;margin-right:46px;min-height:60px;overflow:hidden;");
    const kb = h("div", "margin-top:6px;display:flex;align-items:center;gap:8px;");
    const inp = h("div", "flex:1;background:rgba(255,255,255,.14);border-radius:18px;padding:9px 14px;font:13px system-ui;color:rgba(255,255,255,.65);", T("Add a comment...", "Añade un comentario...", "Adicione um comentário..."));
    const gb = h("div", "width:34px;height:34px;border-radius:50%;background:" + ac + ";display:flex;align-items:center;justify-content:center;font-size:16px;", P.giftIcon);
    add(kb, inp, gb);
    add(gwrap, slot, chat, kb);

    add(wrap, cam, vig, rec, top, bar, hearts, gwrap);
    add(ov, css, wrap);
    S.ui = { ov, wrap, cam, rec, eye, likes, barIn, hearts, chat, slot, end, hd };
    drawCam();
    document.body.appendChild(ov);
  }

  function chatRow(kind, user, text, tag) {
    const P = S.plat;
    let css = "font:12.5px/1.25 system-ui,sans-serif;text-shadow:0 1px 2px #000;padding:3px 8px;border-radius:12px;background:rgba(0,0,0,.32);align-self:flex-start;max-width:100%;word-break:break-word;transition:opacity .4s;";
    const r = h("div", css);
    if (kind === "join") { r.style.color = "rgba(255,255,255,.55)"; r.textContent = user + " " + T("joined", "se unió", "entrou"); return r; }
    if (kind === "gift") {
      r.style.background = "linear-gradient(90deg," + P.accent + "cc,rgba(0,0,0,.4))";
      r.style.cssText += "--ac:" + P.accent + ";" + (S.reduced ? "" : "animation:flgift 1.2s ease-out;");
      r.className = "flgift";
      r.textContent = P.giftIcon + " " + user + " " + text;
      return r;
    }
    if (tag) { const tg = h("span", "background:#c0392b;color:#fff;font:800 9px system-ui;padding:1px 5px;border-radius:4px;margin-right:5px;", tag); r.appendChild(tg); }
    const nm = h("span", "font-weight:700;margin-right:5px;color:" + (kind === "rival" ? "#ff8a8a" : kind === "og" ? "#ffd479" : pick(COLS)) + ";", user);
    add(r, nm, h("span", null, text));
    return r;
  }
  function pushChat(kind, user, text, tag, flash) {
    if (!S || !S.ui) return;
    const row = chatRow(kind, user, text, tag);
    if (flash) row.style.outline = "1px solid " + flash;
    S.ui.chat.appendChild(row);
    S.rows.push(row);
    while (S.rows.length > 7) kill(S.rows.shift());
    const n = S.rows.length;
    S.rows.forEach((r, i) => { r.style.opacity = i < n - 5 ? String(0.3 + 0.2 * i / Math.max(1, n - 5)) : "1"; });
  }
  function ambient() {
    const tox = S.plat.toxicity, rivalW = 5 + S.rivalHeat * 0.4;
    const w = [["hype", 34 + S.hype * 0.3], ["troll", 14 * (0.5 + tox)], ["hater", 14 * (0.5 + tox)], ["fan", 10], ["join", 14], ["rival", rivalW]];
    let tot = 0; w.forEach((x) => { tot += x[1]; });
    let r = Math.random() * tot, k = "hype";
    for (let i = 0; i < w.length; i++) { r -= w[i][1]; if (r <= 0) { k = w[i][0]; break; } }
    react(k);
  }
  function react(k) {
    if (k === "join") return pushChat("join", uname());
    const px = PX[S.plat.id] && PX[S.plat.id][k];
    const txt = F(pick(px && px.length && Math.random() < 0.65 ? px : POOL[k] || POOL.hype));
    if (k === "rival") return pushChat("rival", rivalName(), txt, S.tShort);
    if (k === "og") return pushChat("og", "@og_" + pick(["will", "ray", "tone"]), txt);
    pushChat(k, uname(), txt);
  }
  function rivalName() { return "@" + S.tShort.toLowerCase().replace(/[^a-z0-9]/g, "") + "_" + pick(["lil", "ent", "k", "mob", "dre"]); }

  function heart(n) {
    for (let i = 0; i < n; i++) {
      if (S.hs.length > 28) kill(S.hs.shift().el);
      const e = h("div", "position:absolute;right:" + ((Math.random() * 40) | 0) + "px;bottom:0;font-size:" + (14 + ((Math.random() * 12) | 0)) + "px;--dx:" + ((Math.random() * 50 - 25) | 0) + "px;animation:flheart " + rnd(1.8, 2.8).toFixed(2) + "s ease-out forwards;", pick(["❤", "💖", "🔥", "💜", "❤"]));
      S.ui.hearts.appendChild(e);
      S.hs.push({ el: e, ttl: 3 });
    }
  }

  // ---------- eventos ----------
  function eligible(def) { return (!def.plat || def.plat.indexOf(S.plat.id) >= 0) && (!def.when || def.when(S)); }
  function pickEvent() {
    let pool = EVENTS.filter((e) => !S.used[e.id] && eligible(e));
    if (!pool.length) { S.used = {}; pool = EVENTS.filter(eligible); }
    const ws = pool.map((e) => (e.w || 1) * (e.troll ? 0.6 + S.plat.toxicity : 1) * (e.id === "mod_warn" ? (S.plat.toxicity > 0.6 ? 1.4 : 0.7) : 1));
    let tot = 0; ws.forEach((x) => { tot += x; });
    let r = Math.random() * tot;
    for (let i = 0; i < pool.length; i++) { r -= ws[i]; if (r <= 0) return pool[i]; }
    return pool[pool.length - 1];
  }
  function visibleOpts(def) {
    return def.opts.filter((o) => !o.need || (o.need === "gun" && S.gun) || (o.need === "rapper" && S.hasRapper));
  }
  function openEvent(def) {
    if (S.ev) { kill(S.ev.node); S.ev = null; }
    if (S.res) { kill(S.res.node); S.res = null; }
    S.used[def.id] = 1;
    const P = S.plat, ac = P.accent;
    const opts = visibleOpts(def);
    const user = def.user === "rival" ? rivalName() : def.user;
    const tag = def.user === "rival" ? S.tShort : null;
    const node = h("div", "background:rgba(10,10,14,.82);border:2px solid " + ac + ";border-radius:14px;padding:8px;" + (S.reduced ? "" : "animation:flup .25s ease-out;"));
    node.className = "flpanel";
    const head = h("div", "font:13px/1.3 system-ui;margin-bottom:6px;");
    if (tag) head.appendChild(h("span", "background:#c0392b;font:800 9px system-ui;padding:1px 5px;border-radius:4px;margin-right:5px;", tag));
    add(head, h("b", "color:" + ac + ";margin-right:5px;", user), h("span", null, F(def.msg)));
    const grid = h("div", "display:grid;grid-template-columns:1fr 1fr;gap:6px;");
    const tb = h("div", "height:3px;background:rgba(255,255,255,.2);border-radius:2px;margin-top:6px;");
    const tbi = h("div", "height:100%;width:100%;background:" + ac + ";border-radius:2px;");
    add(tb, tbi);
    const ev = { def, opts, node, tbi, left: 9, total: 9, user };
    opts.forEach((o, i) => {
      const b = btn(F(o.label), "padding:8px 6px;background:" + (TONES[o.tone].fl ? "#7a1f1f" : "rgba(255,255,255,.16)") + ";" + (opts.length % 2 && i === opts.length - 1 ? "grid-column:1/3;" : ""), () => choose(i));
      grid.appendChild(b);
    });
    add(node, head, grid, tb);
    S.ui.slot.appendChild(node);
    S.ev = ev;
    pushChat("rival", user, F(def.msg), tag, ac);
    sfx("choice");
    return ev;
  }
  function choose(i) {
    const ev = S && S.ev;
    if (!ev || S.phase !== "live") return;
    S.ev = null;
    kill(ev.node);
    const o = i >= 0 && i < ev.opts.length ? ev.opts[i] : null;
    let fx = Object.assign({}, TONES[o ? o.tone : "ignore"], o && o.x ? o.x : null);
    if (o) {
      S.replies++;
      if (fx.k && Math.random() < fx.k * (S.hasRapper && o.tone === "diss" ? 0.6 : 1)) fx = Object.assign({}, TONES.backfire, { t: fx.t * 0.7 + 3, l: fx.l * 0.6, rt: fx.rt + 0.08, bn: fx.bn + 0.05, fl: fx.fl, sl: fx.sl });
      if (fx.fl && S.gun && S.gun.illegal) fx.t += 6;
    } else S.ignores++;
    const j = () => rnd(0.75, 1.25);
    S.hype = clamp(S.hype + fx.h * j(), 0, 100);
    S.hypeMax = Math.max(S.hypeMax, S.hype);
    S.boost = clamp(S.boost + fx.v * j(), -0.5, 1.5);
    S.rep += fx.r * (o ? j() : 1);
    S.heat += fx.t * j();
    S.rel += fx.l * j();
    S.rt += fx.rt;
    if (fx.fl) S.flashed = true;
    if (fx.sl) S.slip = true;
    if (o && (o.tone === "name" || o.tone === "block" || o.tone === "mock")) S.rivalHeat += 6;
    if (fx.g > 0) {
      const tot = S.viewers * lerp(0.4, 1.2, S.hype / 100) * fx.g * rnd(0.85, 1.15), n = 2 + ((Math.random() * 3) | 0);
      for (let k = 0; k < n; k++) S.gifts.push({ at: S.time + rnd(0.5, 3), amt: tot / n });
    }
    heart(Math.max(0, Math.round(fx.h / 3)));
    (fx.c || []).forEach((k) => S.reacts.push({ at: S.time + rnd(0.6, 2.8), k }));
    const res = h("div", "background:rgba(10,10,14,.75);border-left:3px solid " + S.plat.accent + ";border-radius:8px;padding:7px 9px;font:600 12px system-ui;", F(fx.res));
    S.ui.slot.appendChild(res);
    S.res = { node: res, left: 3 };
    S.evDone++;
    S.nextEv = rnd(5, 8);
    if (S.evDone >= S.n) S.endT = 5;
    if (o) sfx("choice");
    const p = Math.max(0, fx.bn || 0) * (0.5 + S.plat.toxicity);
    if (o && Math.random() < p) { S.banned = true; endLive("ban"); }
  }

  // ---------- fin ----------
  function makeResult() {
    const P = S.plat;
    S.gifts.forEach((g) => { S.money += g.amt; }); S.gifts = [];
    const peak = Math.max(1, Math.round(S.peakV));
    const avg = S.sumT > 0 ? Math.round(S.sumV / S.sumT) : Math.round(S.base);
    const hype = Math.round(clamp(S.hypeMax * 0.5 + S.hype * 0.5, 0, 100));
    const newF = Math.max(0, Math.floor(peak * lerp(0.05, 0.25, hype / 100) * rnd(0.85, 1.15)));
    const rep = clamp(Math.round(S.rep - (S.banned ? 3 : 0)), -10, 14);
    const heat = clamp(Math.round(S.heat + (peak / 800) * 4), 0, 40);
    const rel = -clamp(Math.round(-S.rel), 5, 40);
    const pRet = clamp(0.04 + S.rt + -rel / 150 + (S.slip ? 0.15 : 0) + (S.flashed ? 0.1 : 0), 0, 0.9);
    return { peak, avgViewers: clamp(avg, 0, peak), newFollowers: newF, gifts: Math.max(0, Math.round(S.money)), hype, rep, heat, rel, retaliation: Math.random() < pRet, banned: !!S.banned, flashedGun: !!S.flashed, locationSlip: !!S.slip, replies: S.replies };
  }
  function endLive(why) {
    if (!S || S.phase !== "live") return;
    S.phase = "summary";
    if (S.ev) { kill(S.ev.node); S.ev = null; }
    if (S.res) { kill(S.res.node); S.res = null; }
    const r = makeResult();
    S.result = r;
    const P = S.plat;
    const ov = h("div", "position:absolute;left:0;top:0;right:0;bottom:0;background:rgba(5,5,8,.94);display:flex;flex-direction:column;padding:18px 16px;box-sizing:border-box;overflow:auto;");
    add(ov, h("div", "font:800 20px system-ui;color:" + P.accent + ";margin-bottom:2px;", T("Live ended", "Live terminada", "Live encerrada")));
    if (r.banned) add(ov, h("div", "font:700 12px system-ui;color:#ff6b6b;margin-bottom:8px;", T("The platform cut your live.", "La plataforma te cortó la live.", "A plataforma cortou sua live.")));
    else add(ov, h("div", "font:12px system-ui;opacity:.7;margin-bottom:8px;", S.handle));
    const row = (a, b) => add(h("div", "display:flex;justify-content:space-between;padding:7px 0;border-bottom:1px solid rgba(255,255,255,.1);font:14px system-ui;"), h("span", "opacity:.75;", a), h("b", null, b));
    add(ov,
      row(T("Peak viewers", "Pico de espectadores", "Pico de espectadores"), compact(r.peak)),
      row(T("New followers", "Seguidores nuevos", "Novos seguidores"), "+" + compact(r.newFollowers)),
      row(T("Gifts", "Regalos", "Presentes"), "$" + r.gifts),
      row(T("Hype", "Hype", "Hype"), r.hype + "/100"));
    const lines = [];
    if (r.banned) lines.push(T("The platform pulled the plug.", "La plataforma te desconectó.", "A plataforma te desligou."));
    if (r.retaliation) lines.push(T("Their crew saw it.", "Su banda lo vio.", "A turma deles viu."));
    if (r.locationSlip) lines.push(T("Someone recognized your block.", "Alguien reconoció tu cuadra.", "Alguém reconheceu sua quebrada."));
    if (r.flashedGun) lines.push(T("That strap is in a hundred clips now.", "Ese fierro ya está en cien clips.", "Essa arma já tá em cem clipes."));
    if (r.rel <= -25) lines.push(F(T("{t} put you on the list.", "{t} te puso en la lista.", "O {t} te colocou na lista.")));
    if (r.hype >= 70) lines.push(T("Your clip is on every page.", "Tu clip está en todas partes.", "Seu clipe tá em todo lugar."));
    if (r.hype < 30) lines.push(T("Quiet live. Nobody really cared.", "Live tranquila. A nadie le importó.", "Live parada. Ninguém ligou."));
    lines.push(T("Chat will talk about this for days.", "El chat hablará de esto por días.", "O chat vai falar disso por dias."));
    lines.push(T("The block is watching.", "La cuadra está mirando.", "A quebrada tá olhando."));
    lines.push(T("Your name moved around town.", "Tu nombre corrió por el barrio.", "Seu nome rodou pela quebrada."));
    const box = h("div", "margin:12px 0;font:13px/1.4 system-ui;");
    lines.slice(0, 3).forEach((l) => box.appendChild(h("div", "padding:3px 0;", "• " + l)));
    const done = btn(T("Done", "Listo", "Pronto"), "background:" + P.accent + ";padding:12px;font-size:15px;margin-top:auto;", finish);
    add(ov, box, done);
    S.ui.wrap.appendChild(ov);
    S.ui.sum = ov; S.ui.done = done;
    sfx("choice");
  }
  function cleanup() {
    if (!S) return;
    const s = S; S = null;
    if (s.raf && typeof window.cancelAnimationFrame === "function") window.cancelAnimationFrame(s.raf);
    kill(s.ui && s.ui.ov);
    try { document.body.style.overflow = s.prevOverflow; } catch (e) { /* nada */ }
  }
  function finish() {
    if (!S || S.phase !== "summary" || S.closed) return;
    S.closed = true;
    const cb = S.opts.onEnd, r = S.result;
    cleanup();
    if (typeof cb === "function") { try { cb(r); } catch (e) { if (window.console) console.error(e); } }
  }

  // ---------- bucle ----------
  function tick(dt) {
    if (!S || S.phase !== "live") return;
    S.time += dt;
    S.hype = clamp(S.hype + (28 - S.hype) * dt * 0.04, 0, 100);
    S.noiseT -= dt;
    if (S.noiseT <= 0) { S.noise = rnd(-0.05, 0.05); S.noiseT = rnd(0.5, 1.2); }
    const target = S.base * (1 + (S.hype / 100) * 1.5 + S.boost) * (1 + S.noise);
    S.vcur += (target - S.vcur) * Math.min(1, dt * 1.5);
    S.viewers = Math.max(1, Math.round(S.vcur));
    S.peakV = Math.max(S.peakV, S.viewers);
    S.sumV += S.viewers * dt; S.sumT += dt;
    S.likes += S.viewers * 0.01 * dt * (0.5 + S.hype / 50);
    S.chatT -= dt;
    let g = 0;
    while (S.chatT <= 0 && g++ < 5) { ambient(); S.chatT += rnd(0.6, 1.4) / clamp(0.5 + S.viewers / 1500 + S.hype / 80, 0.5, 1.8); }
    S.ambT -= dt;
    if (S.ambT <= 0) { S.gifts.push({ at: S.time, amt: S.viewers * rnd(0.02, 0.06) }); S.ambT = rnd(5, 9); }
    for (let i = S.reacts.length - 1; i >= 0; i--) if (S.reacts[i].at <= S.time) { const k = S.reacts[i].k; S.reacts.splice(i, 1); react(k); }
    for (let i = S.gifts.length - 1; i >= 0; i--) {
      if (S.gifts[i].at > S.time) continue;
      const a = S.gifts[i].amt; S.gifts.splice(i, 1);
      S.money += a;
      pushChat("gift", uname(), T("sent a", "mandó un", "mandou um") + " " + S.plat.giftName + " ×" + Math.max(1, Math.round(a / 5)), null, S.plat.accent);
      heart(2);
    }
    S.heartT -= dt;
    if (S.heartT <= 0) { heart(1); S.heartT = rnd(0.25, 0.9) * (1.2 - S.hype / 130); }
    for (let i = S.hs.length - 1; i >= 0; i--) { S.hs[i].ttl -= dt; if (S.hs[i].ttl <= 0) { kill(S.hs[i].el); S.hs.splice(i, 1); } }
    if (S.ev) {
      S.ev.left -= dt;
      S.ev.tbi.style.width = clamp((S.ev.left / S.ev.total) * 100, 0, 100) + "%";
      if (S.ev.left <= 0) choose(-1);
    } else if (S.res) {
      S.res.left -= dt;
      if (S.res.left <= 0) { kill(S.res.node); S.res = null; }
    }
    if (S.phase !== "live") return;
    if (!S.ev) {
      if (S.evDone >= S.n) { S.endT -= dt; if (S.endT <= 0) endLive("done"); }
      else { S.nextEv -= dt; if (S.nextEv <= 0 && !S.res) openEvent(pickEvent()); }
    }
    hud();
  }
  function hud() {
    const u = S.ui, m = Math.floor(S.time / 60), s = Math.floor(S.time % 60);
    u.eye.textContent = "👁 " + compact(S.viewers);
    u.likes.textContent = "❤ " + compact(S.likes);
    u.rec.textContent = "● REC " + (m < 10 ? "0" : "") + m + ":" + (s < 10 ? "0" : "") + s;
    const frac = clamp((S.evDone + (S.ev ? 0.5 : 0)) / S.n, 0, 1);
    S.bar += (frac - S.bar) * 0.1;
    u.barIn.style.width = (S.bar * 100).toFixed(1) + "%";
    if (!S.reduced) {
      const x = Math.sin(S.time * 1.1) * 3, y = Math.cos(S.time * 0.9) * 3;
      u.cam.style.transform = "translate(" + x.toFixed(1) + "px," + y.toFixed(1) + "px) scale(" + (1.08 + 0.015 * Math.sin(S.time * 0.5)).toFixed(3) + ")";
    }
  }
  function loop(ts) {
    if (!S) return;
    const dt = clamp(((ts || 0) - (S.last || ts || 0)) / 1000, 0, 0.1);
    S.last = ts;
    tick(dt);
    if (S) S.raf = window.requestAnimationFrame(loop);
  }

  function start(opts) {
    if (S) cleanup();
    opts = opts || {};
    const P = PLATFORMS.filter((p) => p.id === opts.platform)[0] || PLATFORMS[0];
    const you = opts.you || {}, tg = opts.target || {};
    let reduced = false;
    try { reduced = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches); } catch (e) { reduced = false; }
    const handle = String(you.handle || you.name || "player");
    const base = clamp(30 + num(you.followers, 0) * 0.02 + num(you.rank, 0) * 40, 20, 4000) * P.viewerMult;
    S = {
      opts, plat: P, n: clamp(Math.round(num(opts.duration, 5)), 1, 12), hasRapper: !!opts.hasRapper, gun: opts.gun || null,
      tName: String(tg.name || "the opps"), tShort: String(tg.short || "OPP"), handle: handle.charAt(0) === "@" ? handle : "@" + handle,
      reduced, prevOverflow: document.body.style.overflow, phase: "live", closed: false,
      time: 0, base, vcur: base * 0.6, viewers: Math.max(1, Math.round(base * 0.6)), peakV: 1, sumV: 0, sumT: 0, hype: 20, hypeMax: 20, boost: 0, noise: 0, noiseT: 0, likes: 0, bar: 0,
      money: 0, rep: 0, heat: 0, rel: 0, rt: 0, flashed: false, slip: false, banned: false, replies: 0, ignores: 0, rivalHeat: 0,
      chatT: 0.3, ambT: 6, heartT: 0.5, nextEv: 4, endT: 5, evDone: 0, ev: null, res: null, used: {}, rows: [], hs: [], reacts: [], gifts: [], result: null, last: 0, raf: 0
    };
    buildUI();
    document.body.style.overflow = "hidden";
    pushChat("join", uname());
    S.raf = window.requestAnimationFrame(loop);
  }

  window.FL_LIVE = {
    start, stop: cleanup, platforms: PLATFORMS,
    _step(dt) { let n = Math.max(1, Math.round(dt / SUB)); while (n-- > 0 && S && S.phase === "live") tick(SUB); },
    _state() { return S; },
    _events() { return EVENTS.map((e) => e.id); },
    _forceEvent(id, idx) {
      if (!S || S.phase !== "live") return -1;
      const def = EVENTS.filter((e) => e.id === id)[0];
      if (!def) return -1;
      const ev = openEvent(def);
      const n = ev.opts.length;
      if (idx === -1 || (idx >= 0 && idx < n)) choose(idx);
      return n;
    }
  };
})();
