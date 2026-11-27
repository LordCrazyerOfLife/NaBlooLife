/* [mod] Vendedores de armas para NaBlooLife (mod local). Lo carga gang.js (código 13131313).
 * Tienda legal (Glocks, pistolas, revólveres, escopeta, rifles de caza) + dealers de la calle (Lil Ray: Glocks custom, Ortiz: AK/Draco,
 * Viper: subfusiles y rifles de asalto, Ghost: piezas y cargadores). Sprites y catálogo salen de _art-src/armas/build_guns.py. Estado: state.arms (JSON puro, por vida).
 * Usar un arma en algo ilegal suma un cargo extra al arresto (busted()). Se conecta a la pandilla con window.FL_ARMS.
 * Textos: T("english", "español", "português"); add_chess_i18n.py los pasa al ui.tsv.
 * REGLA: los textos de T() van entre comillas dobles, sin template literals.
 */
(() => {
  "use strict";
  const T = (en) => en;
  const E = (code) => `emoji/${code}.png`;
  const rnd = Math.random;
  const ri = (a, b) => a + Math.floor(rnd() * (b - a + 1));
  const clampN = (v, a, b) => Math.max(a, Math.min(b, v));
  const money = (n) => (typeof usd === "function" ? usd(n) : "$" + Math.round(n).toLocaleString("en-US"));
  const price = (n) => (!n ? 0 : typeof localPrice === "function" ? localPrice(n) : n);
  const TITLE = T("Gun Dealers", "Vendedores de armas", "Vendedores de armas");
  const PIECE = (p) => `<em style="font-style:normal">${p}</em>`;
  // iconos PNG: cargador generico y hueco vacio (pixel transparente, sin dibujo vectorial)
  const BLANK = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

  // ---------------------------------------------------------------- catálogo
  // grp = familia de cargadores/accesorios: glock | ak | ar | smg (las armas sin grp no llevan cargador ni accesorios)
  // <<GUNS-GENERATED (_art-src/armas/build_guns.py: no editar a mano, edita el script y corre --splice)
  // grp = familia de cargadores/accesorios: glock | ak | ar | smg. sec = título de sección en el dealer. glk = capas del Glock modular.
  const GUNS = {
    // ---- Glocks modulares (cargadores intercambiables que se ven en el arma)
    glock01: { n: T("Glock 17", "Glock 17", "Glock 17"), cat: "glock", price: 580, power: 0.06, grp: "glock", glk: "glock01", icon: "guns/glock/glock01-icon.png?v=1", age: 21 },
    glock02: { n: T("Glock 19 Gen 4", "Glock 19 Gen 4", "Glock 19 Gen 4"), cat: "glock", price: 550, power: 0.06, grp: "glock", glk: "glock02", icon: "guns/glock/glock02-icon.png?v=1", age: 21 },
    glock03: { n: T("Glock 26", "Glock 26", "Glock 26"), cat: "glock", price: 500, power: 0.06, grp: "glock", glk: "glock03", icon: "guns/glock/glock03-icon.png?v=1", age: 21 },
    glock04: { n: T("Glock 43", "Glock 43", "Glock 43"), cat: "glock", price: 450, power: 0.06, grp: "glock", glk: "glock04", icon: "guns/glock/glock04-icon.png?v=1", age: 21 },
    glock05: { n: T("Glock 34 · Ported", "Glock 34 · Con puertos", "Glock 34 · Com portas"), cat: "glock", price: 1100, power: 0.08, heat: 4, illegal: 1, grp: "glock", glk: "glock05", icon: "guns/glock/glock05-icon.png?v=1", dealer: "ray" },
    glock06: { n: T("Glock 19X · Coyote", "Glock 19X · Coyote", "Glock 19X · Coyote"), cat: "glock", price: 900, power: 0.08, heat: 4, illegal: 1, grp: "glock", glk: "glock06", icon: "guns/glock/glock06-icon.png?v=1", dealer: "ray" },
    glock07: { n: T("Glock 19", "Glock 19", "Glock 19"), cat: "glock", price: 550, power: 0.06, grp: "glock", glk: "glock07", icon: "guns/glock/glock07-icon.png?v=1", age: 21 },
    glock08: { n: T("Glock 17 Gen 5", "Glock 17 Gen 5", "Glock 17 Gen 5"), cat: "glock", price: 620, power: 0.06, grp: "glock", glk: "glock08", icon: "guns/glock/glock08-icon.png?v=1", age: 21 },
    glock09: { n: T("Glock 19 · Red Trigger", "Glock 19 · Gatillo rojo", "Glock 19 · Gatilho vermelho"), cat: "glock", price: 950, power: 0.08, heat: 4, illegal: 1, grp: "glock", glk: "glock09", icon: "guns/glock/glock09-icon.png?v=1", dealer: "ray" },
    glock10: { n: T("Glock 17 · Optic", "Glock 17 · Con mira", "Glock 17 · Com mira"), cat: "glock", price: 1200, power: 0.08, heat: 4, illegal: 1, grp: "glock", glk: "glock10", icon: "guns/glock/glock10-icon.png?v=1", dealer: "ray" },
    glock11: { n: T("Glock 19 · Silver Slide", "Glock 19 · Corredera plateada", "Glock 19 · Ferrolho prateado"), cat: "glock", price: 1000, power: 0.08, heat: 4, illegal: 1, grp: "glock", glk: "glock11", icon: "guns/glock/glock11-icon.png?v=1", dealer: "ray" },
    glock12: { n: T("Glock 42", "Glock 42", "Glock 42"), cat: "glock", price: 400, power: 0.06, grp: "glock", glk: "glock12", icon: "guns/glock/glock12-icon.png?v=1", age: 21 },
    // ---- armas sueltas (legales: tienda; ilegales: dealers de la calle)
    m1911: { n: T("M1911", "M1911", "M1911"), cat: "pistol", price: 700, power: 0.07, age: 21, icon: "guns/pistols/m1911.png?v=1" },
    m1911w: { n: T("M1911 · Wood Grips", "M1911 · Cachas de madera", "M1911 · Cabos de madeira"), cat: "pistol", price: 750, power: 0.07, age: 21, icon: "guns/pistols/m1911w.png?v=1" },
    m1911c: { n: T("M1911 · Custom", "M1911 · Custom", "M1911 · Custom"), cat: "pistol", price: 900, power: 0.075, age: 21, icon: "guns/pistols/m1911c.png?v=1" },
    b92: { n: T("Beretta 92FS", "Beretta 92FS", "Beretta 92FS"), cat: "pistol", price: 650, power: 0.065, age: 21, icon: "guns/pistols/b92.png?v=1" },
    b92b: { n: T("Beretta 92", "Beretta 92", "Beretta 92"), cat: "pistol", price: 600, power: 0.065, age: 21, icon: "guns/pistols/b92b.png?v=1" },
    b92c: { n: T("Beretta 92 · Black", "Beretta 92 · Negra", "Beretta 92 · Preta"), cat: "pistol", price: 620, power: 0.065, age: 21, icon: "guns/pistols/b92c.png?v=1" },
    deagle: { n: T("Desert Eagle", "Desert Eagle", "Desert Eagle"), cat: "pistol", price: 1500, power: 0.11, age: 21, icon: "guns/pistols/deagle.png?v=1" },
    p08: { n: T("Luger P08", "Luger P08", "Luger P08"), cat: "pistol", price: 800, power: 0.06, age: 21, icon: "guns/pistols/p08.png?v=1" },
    c96: { n: T("Mauser C96", "Mauser C96", "Mauser C96"), cat: "pistol", price: 850, power: 0.06, age: 21, icon: "guns/pistols/c96.png?v=1" },
    ppk: { n: T("Walther PPK", "Walther PPK", "Walther PPK"), cat: "pistol", price: 450, power: 0.045, age: 21, icon: "guns/pistols/ppk.png?v=1" },
    cz75: { n: T("CZ 75", "CZ 75", "CZ 75"), cat: "pistol", price: 600, power: 0.065, age: 21, icon: "guns/pistols/cz75.png?v=1" },
    p226: { n: T("SIG P226", "SIG P226", "SIG P226"), cat: "pistol", price: 750, power: 0.07, age: 21, icon: "guns/pistols/p226.png?v=1" },
    usp: { n: T("HK USP", "HK USP", "HK USP"), cat: "pistol", price: 700, power: 0.07, age: 21, icon: "guns/pistols/usp.png?v=1" },
    mak: { n: T("Makarov", "Makarov", "Makarov"), cat: "pistol", price: 400, power: 0.05, age: 21, icon: "guns/pistols/mak.png?v=1" },
    python: { n: T("Colt Python .357", "Colt Python .357", "Colt Python .357"), cat: "revolver", price: 800, power: 0.085, age: 21, icon: "guns/pistols/python.png?v=1" },
    magnum: { n: T("Magnum Revolver .357", "Revólver Magnum .357", "Revólver Magnum .357"), cat: "revolver", price: 850, power: 0.09, age: 21, icon: "guns/pistols/magnum.png?v=1" },
    snub: { n: T("Snub-Nose .38", "Revólver corto .38", "Revólver curto .38"), cat: "revolver", price: 400, power: 0.05, age: 21, icon: "guns/pistols/snub.png?v=1" },
    pump: { n: T("Pump Shotgun", "Escopeta de bombeo", "Escopeta pump"), cat: "shotgun", price: 450, power: 0.12, age: 18, hunt: 1, icon: "guns/rifles/pump.png?v=1" },
    m14: { n: T("M14 Rifle", "Rifle M14", "Rifle M14"), cat: "hunting", price: 900, power: 0.11, age: 18, hunt: 2, icon: "guns/rifles/m14.png?v=1" },
    awm: { n: T("AWM Sniper .308", "Francotirador AWM .308", "Sniper AWM .308"), cat: "hunting", price: 1800, power: 0.14, age: 18, hunt: 2, icon: "guns/rifles/awm.png?v=1" },
    svd: { n: T("SVD Dragunov", "SVD Dragunov", "SVD Dragunov"), cat: "hunting", price: 1500, power: 0.13, age: 18, hunt: 2, icon: "guns/rifles/svd.png?v=1" },
    draco: { n: T("Draco", "Draco", "Draco"), cat: "ak", price: 4000, power: 0.2, heat: 9, illegal: 1, grp: "ak", dealer: "ortiz", icon: "guns/ak/draco.png?v=1" },
    mdraco: { n: T("Mini Draco", "Mini Draco", "Mini Draco"), cat: "ak", price: 3200, power: 0.17, heat: 8, illegal: 1, grp: "ak", mini: 1, dealer: "ortiz", icon: "guns/ak/mdraco.png?v=1" },
    akm: { n: T("AKM", "AKM", "AKM"), cat: "ak", price: 3000, power: 0.18, heat: 8, illegal: 1, grp: "ak", dealer: "ortiz", icon: "guns/ak/akm.png?v=1" },
    akml: { n: T("AKM · Laminate", "AKM · Laminado", "AKM · Laminado"), cat: "ak", price: 3200, power: 0.18, heat: 8, illegal: 1, grp: "ak", dealer: "ortiz", icon: "guns/ak/akml.png?v=1" },
    akmd: { n: T("AKM · Dark Wood", "AKM · Madera oscura", "AKM · Madeira escura"), cat: "ak", price: 3100, power: 0.18, heat: 8, illegal: 1, grp: "ak", dealer: "ortiz", icon: "guns/ak/akmd.png?v=1" },
    akms: { n: T("AKMS · Under-Folder", "AKMS · Plegable abajo", "AKMS · Dobrável embaixo"), cat: "ak", price: 3500, power: 0.18, heat: 8, illegal: 1, grp: "ak", dealer: "ortiz", icon: "guns/ak/akms.png?v=1" },
    akmsw: { n: T("AKMS · Wood Folder", "AKMS · Plegable de madera", "AKMS · Dobrável de madeira"), cat: "ak", price: 3500, power: 0.18, heat: 8, illegal: 1, grp: "ak", dealer: "ortiz", icon: "guns/ak/akmsw.png?v=1" },
    ak74p: { n: T("AK-74 · Plum", "AK-74 · Ciruela", "AK-74 · Ameixa"), cat: "ak", price: 3300, power: 0.19, heat: 8, illegal: 1, grp: "ak", dealer: "ortiz", icon: "guns/ak/ak74p.png?v=1" },
    ak74p2: { n: T("AK-74 · Plum Mag", "AK-74 · Cargador ciruela", "AK-74 · Pente ameixa"), cat: "ak", price: 3300, power: 0.19, heat: 8, illegal: 1, grp: "ak", dealer: "ortiz", icon: "guns/ak/ak74p2.png?v=1" },
    ak74: { n: T("AK-74 · Black", "AK-74 · Negro", "AK-74 · Preto"), cat: "ak", price: 3400, power: 0.19, heat: 8, illegal: 1, grp: "ak", dealer: "ortiz", icon: "guns/ak/ak74.png?v=1" },
    ak74f: { n: T("AK-74 · Folding", "AK-74 · Plegable", "AK-74 · Dobrável"), cat: "ak", price: 3600, power: 0.19, heat: 8, illegal: 1, grp: "ak", dealer: "ortiz", icon: "guns/ak/ak74f.png?v=1" },
    ak74m: { n: T("AK-74M", "AK-74M", "AK-74M"), cat: "ak", price: 3800, power: 0.2, heat: 9, illegal: 1, grp: "ak", dealer: "ortiz", icon: "guns/ak/ak74m.png?v=1" },
    aks74u: { n: T("AKS-74U", "AKS-74U", "AKS-74U"), cat: "ak", price: 3600, power: 0.18, heat: 9, illegal: 1, grp: "ak", dealer: "ortiz", icon: "guns/ak/aks74u.png?v=1" },
    aks74uw: { n: T("AKS-74U · Wood", "AKS-74U · Madera", "AKS-74U · Madeira"), cat: "ak", price: 3600, power: 0.18, heat: 9, illegal: 1, grp: "ak", dealer: "ortiz", icon: "guns/ak/aks74uw.png?v=1" },
    akth: { n: T("AK · Thumbhole", "AK · Culata agujero", "AK · Coronha vazada"), cat: "ak", price: 3700, power: 0.19, heat: 8, illegal: 1, grp: "ak", dealer: "ortiz", icon: "guns/ak/akth.png?v=1" },
    ak12: { n: T("AK-12", "AK-12", "AK-12"), cat: "ak", price: 4600, power: 0.22, heat: 10, illegal: 1, grp: "ak", dealer: "ortiz", icon: "guns/ak/ak12.png?v=1" },
    ak103: { n: T("AK-103 · Folding", "AK-103 · Plegable", "AK-103 · Dobrável"), cat: "ak", price: 4200, power: 0.2, heat: 9, illegal: 1, grp: "ak", dealer: "ortiz", icon: "guns/ak/ak103.png?v=1" },
    akt: { n: T("AK · Tactical", "AK · Táctico", "AK · Tático"), cat: "ak", price: 4400, power: 0.21, heat: 10, illegal: 1, grp: "ak", dealer: "ortiz", icon: "guns/ak/akt.png?v=1" },
    akmod: { n: T("AK · Modern", "AK · Moderno", "AK · Moderno"), cat: "ak", price: 4500, power: 0.21, heat: 10, illegal: 1, grp: "ak", dealer: "ortiz", icon: "guns/ak/akmod.png?v=1" },
    akr: { n: T("AK · Rail", "AK · Con riel", "AK · Com trilho"), cat: "ak", price: 4400, power: 0.21, heat: 10, illegal: 1, grp: "ak", dealer: "ortiz", icon: "guns/ak/akr.png?v=1" },
    akrec: { n: T("AK · Suppressed Recon", "AK · Reconocimiento silenciado", "AK · Reconhecimento silenciado"), cat: "ak", price: 5200, power: 0.22, heat: 7, illegal: 1, grp: "ak", dealer: "ortiz", icon: "guns/ak/akrec.png?v=1" },
    rpk: { n: T("RPK", "RPK", "RPK"), cat: "ak", price: 5200, power: 0.24, heat: 10, illegal: 1, grp: "ak", dealer: "ortiz", icon: "guns/ak/rpk.png?v=1" },
    rpkb: { n: T("RPK · Bipod", "RPK · Con bípode", "RPK · Com bipé"), cat: "ak", price: 5400, power: 0.24, heat: 10, illegal: 1, grp: "ak", dealer: "ortiz", icon: "guns/ak/rpkb.png?v=1" },
    mp40: { n: T("MP40", "MP40", "MP40"), cat: "smg", price: 2600, power: 0.15, heat: 8, illegal: 1, grp: "smg", dealer: "viper", icon: "guns/smg/mp40.png?v=1" },
    mp38: { n: T("MP38", "MP38", "MP38"), cat: "smg", price: 2500, power: 0.15, heat: 8, illegal: 1, grp: "smg", dealer: "viper", icon: "guns/smg/mp38.png?v=1" },
    tommy: { n: T("Thompson M1928", "Thompson M1928", "Thompson M1928"), cat: "smg", price: 3000, power: 0.16, heat: 8, illegal: 1, grp: "smg", dealer: "viper", icon: "guns/smg/tommy.png?v=1" },
    ppsh: { n: T("PPSh-41", "PPSh-41", "PPSh-41"), cat: "smg", price: 2800, power: 0.16, heat: 8, illegal: 1, grp: "smg", dealer: "viper", icon: "guns/smg/ppsh.png?v=1" },
    uzi: { n: T("Uzi", "Uzi", "Uzi"), cat: "smg", price: 2700, power: 0.15, heat: 8, illegal: 1, grp: "smg", dealer: "viper", icon: "guns/smg/uzi.png?v=1" },
    mac10: { n: T("MAC-10 · Suppressed", "MAC-10 · Silenciada", "MAC-10 · Silenciada"), cat: "smg", price: 2300, power: 0.14, heat: 6, illegal: 1, grp: "smg", dealer: "viper", icon: "guns/smg/mac10.png?v=1" },
    mp5: { n: T("MP5", "MP5", "MP5"), cat: "smg", price: 3400, power: 0.17, heat: 9, illegal: 1, grp: "smg", dealer: "viper", icon: "guns/smg/mp5.png?v=1" },
    mp5k: { n: T("MP5K", "MP5K", "MP5K"), cat: "smg", price: 3200, power: 0.16, heat: 9, illegal: 1, grp: "smg", dealer: "viper", icon: "guns/smg/mp5k.png?v=1" },
    mp7: { n: T("MP7", "MP7", "MP7"), cat: "smg", price: 3800, power: 0.17, heat: 9, illegal: 1, grp: "smg", dealer: "viper", icon: "guns/smg/mp7.png?v=1" },
    p90: { n: T("P90", "P90", "P90"), cat: "smg", price: 4200, power: 0.18, heat: 9, illegal: 1, grp: "smg", dealer: "viper", icon: "guns/smg/p90.png?v=1" },
    vector: { n: T("Kriss Vector", "Kriss Vector", "Kriss Vector"), cat: "smg", price: 4300, power: 0.18, heat: 9, illegal: 1, grp: "smg", dealer: "viper", icon: "guns/smg/vector.png?v=1" },
    ump: { n: T("UMP45", "UMP45", "UMP45"), cat: "smg", price: 3600, power: 0.17, heat: 9, illegal: 1, grp: "smg", dealer: "viper", icon: "guns/smg/ump.png?v=1" },
    scorpion: { n: T("Scorpion EVO", "Scorpion EVO", "Scorpion EVO"), cat: "smg", price: 3500, power: 0.17, heat: 9, illegal: 1, grp: "smg", dealer: "viper", icon: "guns/smg/scorpion.png?v=1" },
    mpx: { n: T("MPX", "MPX", "MPX"), cat: "smg", price: 4000, power: 0.18, heat: 9, illegal: 1, grp: "smg", dealer: "viper", icon: "guns/smg/mpx.png?v=1" },
    vityaz: { n: T("Vityaz SMG", "Vityaz SMG", "Vityaz SMG"), cat: "smg", price: 3300, power: 0.17, heat: 9, illegal: 1, grp: "smg", dealer: "viper", icon: "guns/smg/vityaz.png?v=1" },
    b93: { n: T("Beretta 93R · Stock", "Beretta 93R · Con culata", "Beretta 93R · Com coronha"), cat: "smg", price: 2400, power: 0.12, heat: 7, illegal: 1, grp: "smg", dealer: "viper", icon: "guns/smg/b93.png?v=1" },
    m4: { n: T("M4A1", "M4A1", "M4A1"), cat: "ar", price: 5200, power: 0.24, heat: 11, illegal: 1, grp: "ar", dealer: "viper", icon: "guns/ar/m4.png?v=1" },
    m16: { n: T("M16A1", "M16A1", "M16A1"), cat: "ar", price: 4800, power: 0.23, heat: 11, illegal: 1, grp: "ar", dealer: "viper", icon: "guns/ar/m16.png?v=1" },
    hk416: { n: T("HK416", "HK416", "HK416"), cat: "ar", price: 6000, power: 0.26, heat: 12, illegal: 1, grp: "ar", dealer: "viper", icon: "guns/ar/hk416.png?v=1" },
    famas: { n: T("FAMAS", "FAMAS", "FAMAS"), cat: "ar", price: 5600, power: 0.25, heat: 11, illegal: 1, grp: "ar", dealer: "viper", icon: "guns/ar/famas.png?v=1" },
    tavor: { n: T("Tavor · Suppressed", "Tavor · Silenciado", "Tavor · Silenciado"), cat: "ar", price: 5800, power: 0.25, heat: 9, illegal: 1, grp: "ar", dealer: "viper", icon: "guns/ar/tavor.png?v=1" },
    saw: { n: T("M249 SAW", "M249 SAW", "M249 SAW"), cat: "ar", price: 9500, power: 0.34, heat: 15, illegal: 1, grp: "ar", dealer: "viper", icon: "guns/ar/saw.png?v=1" },
  };
  const GLOCK_LAYERS = {"glock01":{"base":[45,4,262,174],"mags":{"std":[60,174,56,12],"m01":[43,167,81,21],"m02":[41,167,82,45],"m03":[39,167,83,59],"m04":[39,167,82,125],"m05":[39,167,82,81],"m06":[39,167,81,124],"m07":[38,167,82,149],"m08":[20,167,136,151],"m09":[38,167,82,148],"m10":[44,167,76,87],"m11":[39,167,82,129],"m12":[18,167,138,128]}},"glock02":{"base":[45,4,251,167],"mags":{"std":[59,163,57,17],"m01":[42,155,81,26],"m02":[38,155,83,50],"m03":[35,155,84,65],"m04":[30,155,90,131],"m05":[33,155,86,87],"m06":[30,155,89,130],"m07":[27,155,93,155],"m08":[12,155,138,155],"m09":[26,155,93,154],"m10":[41,155,78,91],"m11":[29,155,91,134],"m12":[12,155,140,133]}},"glock03":{"base":[45,4,229,143],"mags":{"std":[47,137,77,38],"m01":[42,136,85,20],"m02":[38,136,87,46],"m03":[35,136,88,60],"m04":[30,136,93,130],"m05":[34,136,88,84],"m06":[31,136,91,129],"m07":[28,136,94,155],"m08":[5,136,144,156],"m09":[27,136,96,154],"m10":[42,136,80,88],"m11":[29,136,94,134],"m12":[5,136,147,133]}},"glock04":{"base":[45,4,228,154],"mags":{"std":[46,148,68,18],"m01":[42,146,77,21],"m02":[38,147,79,44],"m03":[35,146,80,58],"m04":[30,146,85,123],"m05":[33,146,82,80],"m06":[30,147,85,121],"m07":[28,147,87,145],"m08":[5,147,133,144],"m09":[27,147,88,144],"m10":[41,147,74,83],"m11":[29,147,86,125],"m12":[4,147,137,123]}},"glock05":{"base":[45,4,277,163],"mags":{"std":[58,164,55,11],"m01":[42,155,78,22],"m02":[40,155,80,46],"m03":[39,155,80,59],"m04":[39,155,78,122],"m05":[39,155,78,80],"m06":[39,155,77,121],"m07":[38,155,79,145],"m08":[21,155,130,146],"m09":[38,155,79,144],"m10":[43,155,74,86],"m11":[38,155,79,126],"m12":[20,155,132,124]}},"glock06":{"base":[45,4,252,175],"mags":{"std":[60,172,63,12],"m01":[42,164,84,22],"m02":[41,164,84,47],"m03":[40,164,85,61],"m04":[40,164,83,128],"m05":[40,164,83,84],"m06":[40,164,83,127],"m07":[39,164,83,152],"m08":[19,164,138,153],"m09":[39,164,83,151],"m10":[44,164,78,89],"m11":[39,164,84,132],"m12":[18,164,140,130]}},"glock07":{"base":[45,4,252,173],"mags":{"std":[59,175,58,11],"m01":[43,166,81,21],"m02":[41,166,83,46],"m03":[40,166,83,60],"m04":[40,166,82,127],"m05":[40,166,82,83],"m06":[40,166,82,126],"m07":[40,166,81,151],"m08":[22,166,136,152],"m09":[40,166,81,150],"m10":[44,166,77,88],"m11":[40,166,82,131],"m12":[20,166,139,129]}},"glock08":{"base":[45,4,269,176],"mags":{"std":[59,177,59,13],"m01":[42,170,84,21],"m02":[41,170,85,47],"m03":[40,170,85,62],"m04":[40,170,83,131],"m05":[40,170,83,85],"m06":[40,170,83,130],"m07":[39,170,83,156],"m08":[18,170,142,157],"m09":[39,170,83,155],"m10":[44,170,78,91],"m11":[39,170,84,135],"m12":[16,170,145,133]}},"glock09":{"base":[45,4,261,170],"mags":{"std":[59,166,57,16],"m01":[42,158,84,26],"m02":[38,158,86,51],"m03":[35,158,87,65],"m04":[29,158,93,132],"m05":[33,158,89,87],"m06":[30,158,92,131],"m07":[26,158,96,155],"m08":[10,158,138,155],"m09":[25,158,97,154],"m10":[41,158,81,91],"m11":[28,158,94,135],"m12":[9,158,141,133]}},"glock10":{"base":[45,4,261,200],"mags":{"std":[60,200,59,10],"m01":[46,199,86,12],"m02":[43,199,90,39],"m03":[42,199,91,54],"m04":[43,199,91,126],"m05":[43,199,90,78],"m06":[43,199,91,125],"m07":[43,199,91,152],"m08":[16,199,149,158],"m09":[43,199,92,151],"m10":[46,199,84,84],"m11":[43,199,90,130],"m12":[14,199,151,133]}},"glock11":{"base":[45,3,253,170],"mags":{"std":[56,164,61,16],"m01":[41,156,81,26],"m02":[37,156,83,50],"m03":[35,156,84,64],"m04":[29,156,90,129],"m05":[33,156,85,86],"m06":[30,156,88,128],"m07":[27,156,92,152],"m08":[13,156,134,152],"m09":[26,156,92,151],"m10":[41,156,77,89],"m11":[28,156,91,132],"m12":[12,156,137,130]}},"glock12":{"base":[44,4,221,151],"mags":{"std":[45,145,66,18],"m01":[42,144,74,21],"m02":[38,144,76,43],"m03":[36,144,76,56],"m04":[30,144,82,119],"m05":[34,144,78,78],"m06":[31,144,81,118],"m07":[28,144,84,141],"m08":[6,144,130,141],"m09":[27,144,85,141],"m10":[41,144,71,81],"m11":[29,144,83,122],"m12":[6,144,132,120]}}};
  const GMAGS = [
    ["glock:m01", T("Glock Mag (15 rounds)", "Cargador de Glock (15 balas)", "Pente de Glock (15 balas)"), 40, 0.0, 0, 0],
    ["glock:m02", T("Glock Pinky Mag (17 rounds)", "Cargador de Glock con meñique (17 balas)", "Pente de Glock com mindinho (17 balas)"), 60, 0.005, 0, 0],
    ["glock:m03", T("Glock Extended Mag +3 (19 rounds)", "Cargador extendido +3 de Glock (19 balas)", "Pente estendido +3 de Glock (19 balas)"), 80, 0.01, 0, 0],
    ["glock:m04", T("Glock Extended Mag +5 (22 rounds)", "Cargador extendido +5 de Glock (22 balas)", "Pente estendido +5 de Glock (22 balas)"), 100, 0.015, 1, 0],
    ["glock:m05", T("Glock Short Extended Mag (20 rounds)", "Cargador extendido corto de Glock (20 balas)", "Pente estendido curto de Glock (20 balas)"), 90, 0.012, 0, 0],
    ["glock:m06", T("Glock Extended Mag +7 (24 rounds)", "Cargador extendido +7 de Glock (24 balas)", "Pente estendido +7 de Glock (24 balas)"), 120, 0.02, 1, 0],
    ["glock:m07", T("Glock Stick Mag (33 rounds)", "Cargador largo de Glock (33 balas)", "Pente longo de Glock (33 balas)"), 140, 0.025, 1, 0],
    ["glock:m08", T("Glock Drum Mag (50 rounds)", "Cargador de tambor de Glock (50 balas)", "Pente tambor de Glock (50 balas)"), 350, 0.05, 3, 1],
    ["glock:m09", T("Glock Clear Mag (22 rounds)", "Cargador transparente de Glock (22 balas)", "Pente transparente de Glock (22 balas)"), 110, 0.015, 1, 0],
    ["glock:m10", T("Glock Grip-Sleeve Mag (21 rounds)", "Cargador con funda de Glock (21 balas)", "Pente com capa de Glock (21 balas)"), 100, 0.012, 0, 0],
    ["glock:m11", T("Glock Red Plate Mag (22 rounds)", "Cargador placa roja de Glock (22 balas)", "Pente placa vermelha de Glock (22 balas)"), 110, 0.015, 1, 0],
    ["glock:m12", T("Glock Dual Drum Mag (100 rounds)", "Cargador doble tambor de Glock (100 balas)", "Pente tambor duplo de Glock (100 balas)"), 700, 0.08, 4, 1],
  ];
  // GUNS-GENERATED>>
  const CATS = [
    ["glock", T("Glocks", "Glocks", "Glocks")],
    ["pistol", T("Pistols", "Pistolas", "Pistolas")],
    ["revolver", T("Revolvers", "Revólveres", "Revólveres")],
    ["shotgun", T("Shotguns", "Escopetas", "Escopetas")],
    ["hunting", T("Hunting", "Caza", "Caça")],
  ];
  // secciones de los dealers de la calle
  const SECS = {
    glock: T("Glocks", "Glocks", "Glocks"),
    ak: T("AK Rifles", "Rifles AK", "Rifles AK"),
    smg: T("Submachine Guns", "Subfusiles", "Submetralhadoras"),
    ar: T("Assault Rifles & Machine Gun", "Rifles de asalto y ametralladora", "Fuzis de assalto e metralhadora"),
  };
  const legalKeys = () => Object.keys(GUNS).filter((k) => !GUNS[k].illegal && !GUNS[k].dealer);
  const byDealer = (id) => Object.keys(GUNS).filter((k) => GUNS[k].dealer === id);
  // íconos de los cargadores sueltos (sprites del sheet de cargadores de Glock)
  const MAG_ICON = "guns/glock/mags/m07.png?v=1";
  const DRUM_ICON = "guns/glock/mags/m08.png?v=1";

  // cargadores sueltos: se compran aparte y se le cargan a un arma compatible
  const MAGS = {};
  for (const [k, n, price, power, heat, ill] of GMAGS) MAGS[k] = { n, grp: "glock", price, power, heat, icon: `guns/glock/mags/${k.split(":")[1]}.png?v=1`, ...(ill ? { illegal: 1 } : {}) };
  Object.assign(MAGS, {
    "ak:ext": { n: T("AK Extended Mag (40 rounds)", "Cargador extendido de AK (40 balas)", "Pente estendido de AK (40 balas)"), grp: "ak", price: 150, power: 0.02, heat: 1, icon: MAG_ICON },
    "ak:drum": { n: T("AK Drum Mag (75 rounds)", "Cargador de tambor de AK (75 balas)", "Pente tambor de AK (75 balas)"), grp: "ak", price: 400, power: 0.06, heat: 3, illegal: 1, icon: DRUM_ICON },
    "ar:ext": { n: T("AR Extended Mag (40 rounds)", "Cargador extendido de AR (40 balas)", "Pente estendido de AR (40 balas)"), grp: "ar", price: 170, power: 0.02, heat: 1, icon: MAG_ICON },
    "ar:drum": { n: T("AR Drum Mag (100 rounds)", "Cargador de tambor de AR (100 balas)", "Pente tambor de AR (100 balas)"), grp: "ar", price: 500, power: 0.07, heat: 4, illegal: 1, icon: DRUM_ICON },
    "smg:ext": { n: T("SMG Extended Mag (50 rounds)", "Cargador extendido de subfusil (50 balas)", "Pente estendido de submetralhadora (50 balas)"), grp: "smg", price: 140, power: 0.02, heat: 1, icon: MAG_ICON },
    "smg:drum": { n: T("SMG Drum Mag (100 rounds)", "Cargador de tambor de subfusil (100 balas)", "Pente tambor de submetralhadora (100 balas)"), grp: "smg", price: 450, power: 0.06, heat: 3, illegal: 1, icon: DRUM_ICON },
  });
  const STD = {
    glock: T("Standard mag (17 rounds)", "Cargador estándar (17 balas)", "Pente padrão (17 balas)"),
    ak: T("Standard mag (30 rounds)", "Cargador estándar (30 balas)", "Pente padrão (30 balas)"),
    ar: T("Standard mag (30 rounds)", "Cargador estándar (30 balas)", "Pente padrão (30 balas)"),
    smg: T("Standard mag (30 rounds)", "Cargador estándar (30 balas)", "Pente padrão (30 balas)"),
  };

  const SLOTS = {
    optic: T("Optic", "Mira", "Mira"),
    muzzle: T("Muzzle", "Boca del cañón", "Boca do cano"),
    grip: T("Grip", "Empuñadura", "Empunhadura"),
    rail: T("Rail", "Riel", "Trilho"),
    stock: T("Stock", "Culata", "Coronha"),
    trigger: T("Trigger", "Gatillo", "Gatilho"),
  };
  const SLOTS_BY = {
    glock: ["optic", "muzzle", "trigger"],
    ak: ["optic", "muzzle", "trigger"],
    ar: ["optic", "muzzle", "trigger"],
    smg: ["optic", "muzzle", "trigger"],
  };
  const slotsOf = (def) => (def.grp ? SLOTS_BY[def.grp].filter((s) => !(def.mini && s === "stock")) : []);

  const ATTACH_ON = false; // attachments (optics, suppressors, switches, sears) y kits: apagados
  const ALL = ["glock", "ak", "ar", "smg"];
  const PARTS = {
    reddot: { n: T("Red Dot Sight", "Mira de punto rojo", "Mira de ponto vermelho"), slot: "optic", grps: ALL, price: 150, power: 0.02, heat: 0, icon: "guns/attachments/red-dot.png?v=2" },
    supp: { n: T("Suppressor", "Silenciador", "Silenciador"), slot: "muzzle", grps: ALL, price: 900, power: 0, heat: -4, illegal: 1, icon: "guns/attachments/suppressor.png?v=2" },
    switch: { n: T("Switch", "Switch", "Switch"), slot: "trigger", grps: ["glock"], price: 600, power: 0.12, heat: 6, illegal: 1, auto: 1, color: 1, icon: "guns/switch/switch-red.png?v=1" },
    sear: { n: T("Auto Sear", "Auto sear", "Auto sear"), slot: "trigger", grps: ["ak"], price: 1100, power: 0.12, heat: 7, illegal: 1, auto: 1, icon: "guns/attachments/auto-sear.png?v=1" },
  };
  const COLORS = [
    ["red", T("Red", "Rojo", "Vermelho")], ["blue", T("Blue", "Azul", "Azul")], ["green", T("Green", "Verde", "Verde")],
    ["gold", T("Gold", "Dorado", "Dourado")], ["pink", T("Pink", "Rosado", "Rosa")], ["purple", T("Purple", "Morado", "Roxo")],
    ["orange", T("Orange", "Naranja", "Laranja")], ["white", T("White", "Blanco", "Branco")],
  ];
  const colorName = (id) => (COLORS.find((c) => c[0] === id) || COLORS[0])[1];
  const partIcon = (p) => (p.id === "switch" ? `guns/switch/switch-${p.color || "red"}.png?v=1` : PARTS[p.id].icon);

  // ---------------------------------------------------------------- ícono del arma
  // Las Glocks son modulares: la pistola (sin placa) + la capa del cargador que lleve puesto, en el mismo plano (el cargador va
  // ENCIMA, con las capas recortadas de guns/glock y sus offsets en GLOCK_LAYERS). Se pega en un canvas y se usa como data URL.
  // Mientras las capas cargan (o si el canvas falla) se usa guns/glock/glockNN-icon.png (con su placa original).
  const IMGS = {};
  const PICS = {};
  let curView = null, curTitle = "", refreshT = 0;
  function refreshSoon() {
    clearTimeout(refreshT);
    refreshT = setTimeout(() => {
      try {
        if (curView && typeof screen !== "undefined" && screen.classList.contains("open") && sTitle.textContent === curTitle) curView();
      } catch (e) {}
    }, 80);
  }
  const loadImg = (u) => {
    let i = IMGS[u];
    if (!i) {
      i = IMGS[u] = new Image();
      i.onload = refreshSoon;
      i.src = u;
    }
    return i;
  };
  function glockPic(id, mag, fallback) {
    const key = id + ":" + mag;
    if (PICS[key]) return PICS[key];
    const L = GLOCK_LAYERS[id];
    const mk = L.mags[mag] ? mag : "std";
    const bb = L.base, mb = L.mags[mk];
    const ib = loadImg(`guns/glock/${id}.png?v=1`), im = loadImg(`guns/glock/${id}-${mk}.png?v=1`);
    if (!(ib.complete && ib.naturalWidth && im.complete && im.naturalWidth)) return fallback;
    try {
      const x0 = Math.min(bb[0], mb[0]), y0 = Math.min(bb[1], mb[1]);
      const c = document.createElement("canvas");
      c.width = Math.max(bb[0] + bb[2], mb[0] + mb[2]) - x0;
      c.height = Math.max(bb[1] + bb[3], mb[1] + mb[3]) - y0;
      const g = c.getContext("2d");
      g.drawImage(ib, bb[0] - x0, bb[1] - y0);
      g.drawImage(im, mb[0] - x0, mb[1] - y0);
      return (PICS[key] = c.toDataURL("image/png"));
    } catch (e) {
      return fallback;
    }
  }
  function pic(gun) {
    const d = GUNS[gun.id];
    if (d.glk) return glockPic(d.glk, gun.mag ? String(gun.mag).split(":")[1] : "std", d.icon);
    return d.icon;
  }

  // armas ya armadas con accesorios (vienen instalados; cuestan un 10% menos que comprarlo todo por separado)
  const KITS = {
    kg19: { n: T("Glock 19 · Tactical", "Glock 19 · Táctica", "Glock 19 · Tática"), base: "glock07", att: { optic: { id: "reddot" } } },
    kglock: { n: T("Glock · Switched", "Glock · Con switch", "Glock · Com switch"), base: "glock05", att: { trigger: { id: "switch", color: "red" } }, mag: "glock:m07" },
    kglock2: { n: T("Glock · Full Kit", "Glock · Kit completo", "Glock · Kit completo"), base: "glock10", att: { trigger: { id: "switch", color: "purple" }, muzzle: { id: "supp" }, optic: { id: "reddot" } }, mag: "glock:m08" },
    kdraco1: { n: T("Draco · Optic Pack", "Draco · Paquete con mira", "Draco · Pacote com mira"), base: "draco", att: { optic: { id: "reddot" } }, mag: "ak:ext" },
    kdraco2: { n: T("Draco · Full Auto", "Draco · Automático", "Draco · Automático"), base: "draco", att: { trigger: { id: "sear" }, muzzle: { id: "supp" } }, mag: "ak:drum" },
    kmdraco: { n: T("Mini Draco · Compact Kit", "Mini Draco · Kit compacto", "Mini Draco · Kit compacto"), base: "mdraco", att: { optic: { id: "reddot" } }, mag: "ak:ext" },
  };
  const kitPrice = (k) => Math.round((GUNS[k.base].price + Object.values(k.att).reduce((s, a) => s + PARTS[a.id].price, 0) + (k.mag ? MAGS[k.mag].price : 0)) * 0.9);
  const kitGun = (k) => ({ id: k.base, att: JSON.parse(JSON.stringify(k.att)), mag: k.mag || null });
  // el nombre del kit solo se ve mientras el arma siga igual que como la compraste
  const sameLoadout = (gun, k) => JSON.stringify(gun.att || {}) === JSON.stringify(k.att) && (gun.mag || null) === (k.mag || null);
  const gunName = (gun) => (gun.kit && KITS[gun.kit] && sameLoadout(gun, KITS[gun.kit]) ? KITS[gun.kit].n : GUNS[gun.id].n);

  // dealers (las armas de cada dealer de la calle salen del campo dealer de GUNS)
  const glockMags = () => Object.keys(MAGS).filter((k) => MAGS[k].grp === "glock");
  const DEALERS = {
    store: { n: T("Gun Store", "Tienda de armas", "Loja de armas"), icon: E("1f3ea"), legal: 1, kits: ["kg19"], sub: T("Glocks, pistols, revolvers, shotguns and hunting rifles. Everything legal.", "Glocks, pistolas, revólveres, escopetas y rifles de caza. Todo legal.", "Glocks, pistolas, revólveres, escopetas e rifles de caça. Tudo legal.") },
    ray: { n: T("Lil Ray", "Lil Ray", "Lil Ray"), icon: E("1f9e2"), guns: byDealer("ray"), kits: ["kglock", "kglock2"], mags: glockMags(), parts: ["switch"], sub: T("Corner guy. Custom Glocks, switches and Glock mags.", "El de la esquina. Glocks custom, switches y cargadores de Glock.", "O cara da esquina. Glocks custom, switches e pentes de Glock.") },
    ortiz: { n: T("Mr. Ortiz", "Don Ortiz", "Seu Ortiz"), icon: E("1f3a9"), guns: byDealer("ortiz"), kits: ["kdraco1", "kdraco2", "kmdraco"], mags: ["ak:ext", "ak:drum"], parts: ["sear"], sub: T("Gun runner. Dracos and every AK you can think of.", "Traficante de armas. Dracos y todos los AK que se te ocurran.", "Traficante de armas. Dracos e todos os AK que você imaginar."), minRank: 1 },
    viper: { n: T("Viper", "Viper", "Viper"), icon: E("1f40d"), guns: byDealer("viper"), mags: ["smg:ext", "smg:drum", "ar:ext", "ar:drum"], sub: T("Imports. SMGs, assault rifles and a machine gun.", "Importaciones. Subfusiles, rifles de asalto y una ametralladora.", "Importações. Submetralhadoras, fuzis de assalto e uma metralhadora."), minRank: 1 },
    ghost: { n: T("Ghost", "Ghost", "Ghost"), icon: E("1f9d4"), mags: Object.keys(MAGS), parts: ["reddot", "supp"], sub: T("Parts guy. Attachments and magazines for everything.", "El de las piezas. Accesorios y cargadores para todo.", "O cara das peças. Acessórios e pentes para tudo.") },
  };

  // ---------------------------------------------------------------- estado
  const A = () => {
    const a = (state.arms ||= { v: 1, guns: [], carry: null, mags: {}, parts: [], uid: 1, license: false, yr: { age: -1, hunts: 0 } });
    if (!a.v || a.v < 4) {
      // v4: catálogo nuevo (sprites nuevos). Lo viejo se cambia por su equivalente; lo que no tiene equivalente se quita
      const OLD_GUN = { g19: "glock07", sg19: "glock05", rev: "snub", p45: "m1911", pump: "pump", dbl: "pump", tact: "pump", r22: "m14", deer: "awm" };
      const OLD_MAG = { "glock:ext": "glock:m07", "glock:drum": "glock:m08" };
      for (const g of a.guns || []) if (g && OLD_GUN[g.id]) g.id = OLD_GUN[g.id];
      for (const g of a.guns || []) if (g && OLD_MAG[g.mag]) g.mag = OLD_MAG[g.mag];
      for (const k of Object.keys(a.mags || {})) if (OLD_MAG[k]) ((a.mags[OLD_MAG[k]] = (a.mags[OLD_MAG[k]] || 0) + a.mags[k]), delete a.mags[k]);
      // limpieza: fuera armas, piezas y cargadores que ya no existen en el catalogo
      a.guns = (a.guns || []).filter((g) => g && GUNS[g.id]);
      for (const g of a.guns) {
        const att = g.att || (g.att = {});
        for (const k of Object.keys(att)) if (!att[k] || !PARTS[att[k].id]) delete att[k];
        if (g.mag && !MAGS[g.mag]) g.mag = null;
      }
      a.parts = (a.parts || []).filter((x) => x && PARTS[x.id]);
      a.mags = a.mags || {};
      for (const k of Object.keys(a.mags)) if (!MAGS[k] || !(a.mags[k] > 0)) delete a.mags[k];
      if (a.carry != null && !a.guns.some((g) => g.uid === a.carry)) a.carry = null;
      a.uid = Math.max(1, a.uid || 1);
      a.v = 4;
    }
    return a;
  };

  const yr = () => {
    const a = A();
    if (a.yr.age !== state.age) a.yr = { age: state.age, hunts: 0 };
    return a.yr;
  };
  const findGun = (uid) => A().guns.find((x) => x.uid === uid);
  const gunDef = (gun) => GUNS[gun.id];
  const attList = (gun) => Object.values(gun.att || {});
  function stats(gun) {
    const d = gunDef(gun);
    let power = d.power, heat = d.heat || 0, illegal = !!d.illegal, auto = false;
    for (const a of attList(gun)) {
      const p = PARTS[a.id];
      power += p.power;
      heat += p.heat;
      illegal = illegal || !!p.illegal;
      auto = auto || !!p.auto;
    }
    const m = gun.mag && MAGS[gun.mag];
    if (m) (power += m.power), (heat += m.heat), (illegal = illegal || !!m.illegal);
    return { power: clampN(power, 0, 0.5), heat: illegal ? clampN(Math.round(heat), 0, 30) : 0, illegal, auto };
  }
  const carriedGun = () => {
    const a = A();
    return a.carry != null ? findGun(a.carry) || null : null;
  };
  const pct = (x) => `${Math.round(x * 100)}%`;
  const statusTxt = (s) => (s.auto ? T("Automatic", "Automática", "Automática") : s.illegal ? T("Illegal", "Ilegal", "Ilegal") : T("Legal", "Legal", "Legal"));

  // ---------------------------------------------------------------- pantallas
  // las armas son anchas: en las filas el cuadro de 36x36 de .row img las aplastaba. Ahora llevan class="gunpic" (cuadro ancho, contain),
  // igual que los autos (object-fit: contain), y en el título de los popups también.
  try {
    const st = document.createElement("style");
    st.textContent =
      '.row img.gunpic{width:76px;height:46px;object-fit:contain;margin-right:12px}' +
      '.jcw h4 img[src^="guns/"],.jcw h4 img[src^="data:image/png"]{width:64px;height:38px;object-fit:contain}';
    document.head.appendChild(st);
  } catch (e) {}
  const GUNPIC = /^guns\/(pistols|rifles|ak|smg|ar)\/|^guns\/glock\/glock|^data:image\/png/;
  const row = (id, icon, title, sub, dis, tail) =>
    `<div class="row${dis ? " dis" : ""}" id="${id}"><img${GUNPIC.test(icon) ? ' class="gunpic"' : ""} src="${icon}"><div class="t"><b>${title}</b><span>${sub}</span></div>${dis ? "" : tail || (typeof DOTS !== "undefined" ? DOTS : "")}</div>`;
  const chev = () => (typeof CHEV !== "undefined" ? CHEV : "");
  const tap = (id, fn) => {
    const el = document.getElementById(id);
    if (el && !el.classList.contains("dis")) el.onclick = () => (typeof play === "function" && play("choice"), fn());
  };
  const plain = (t, cb) => notice(TITLE, t, cb || null, !0);
  let origin = null; // a dónde vuelve el botón atrás de la pantalla principal

  function frame(title, back) {
    if (state.prison) return false;
    screen.classList.add("open");
    sTitle.textContent = String(title).toUpperCase();
    curTitle = sTitle.textContent;
    curView = null;
    sSub.style.display = "none";
    sBack.innerHTML = typeof BACK_ICON !== "undefined" ? BACK_ICON : "‹";
    sBack.onclick = back;
    return true;
  }

  function openArms(from) {
    origin = from || null;
    if (state.prison) return plain(T("You can't do that from prison.", "No puedes hacer eso desde la cárcel.", "Você não pode fazer isso da prisão."));
    const a = A();
    const g = state.gangLife && state.gangLife.member ? state.gangLife : null;
    frame(TITLE, () => (origin ? origin() : typeof openActivities === "function" ? openActivities() : screen.classList.remove("open")));
    curView = () => openArms(origin);
    const young = state.age < 16;
    let html = `<div class="sec">${T("Legal", "Legal", "Legal")}</div>`;
    html += row("aD_store", DEALERS.store.icon, DEALERS.store.n, state.age < 16 ? `${T("Age", "Edad", "Idade")} 16+` : DEALERS.store.sub, state.age < 16, chev());
    html += `<div class="sec">${T("Street Dealers", "Dealers de la calle", "Dealers da rua")}</div>`;
    for (const id of ["ray", "ortiz", "viper", "ghost"]) {
      const d = DEALERS[id];
      const lock = young ? `${T("Age", "Edad", "Idade")} 16+` : d.sub;
      html += row(`aD_${id}`, d.icon, d.n, lock, young, chev());
    }
    html += `<div class="sec">${T("My Arsenal", "Mi arsenal", "Meu arsenal")}</div>`;
    if (!a.guns.length) html += row("aNone", E("1f4e6"), T("No guns yet", "Todavía sin armas", "Ainda sem armas"), T("Buy one from a dealer", "Compra una con un vendedor", "Compre uma com um vendedor"), true);
    for (const gun of a.guns) {
      const s = stats(gun);
      const sub = [a.carry === gun.uid ? PIECE(T("Carrying it", "La llevas encima", "Está com você")) : "", PIECE(statusTxt(s)), PIECE(`${T("Power", "Poder", "Poder")} ${pct(s.power)}`)].filter(Boolean).join(" · ");
      html += row(`aG_${gun.uid}`, pic(gun), gunName(gun), sub, false, chev());
    }
    const nm = Object.values(a.mags).reduce((x, y) => x + y, 0);
    html += row("aMags", MAG_ICON, T("Magazines & Parts", "Cargadores y piezas", "Pentes e peças"), `${PIECE(`${T("Magazines", "Cargadores", "Pentes")} ${nm}`)} · ${PIECE(`${T("Parts", "Piezas", "Peças")} ${a.parts.length}`)}`, false, chev());
    const hunter = a.guns.some((x) => gunDef(x).hunt);
    html += row("aHunt", E("1f333"), T("Go Hunting", "Ir de cacería", "Ir caçar"), hunter ? (a.license ? T("Hunting license: yes", "Licencia de caza: sí", "Licença de caça: sim") : T("You'll need a license", "Vas a necesitar licencia", "Você vai precisar de licença")) : T("You need a hunting weapon", "Necesitas un arma de caza", "Você precisa de uma arma de caça"), !hunter);
    if (carriedGun()) html += row("aHol", E("1f45c"), T("Put It Away", "Guardarla", "Guardar"), T("Stop carrying a gun", "Dejar de andar armado", "Parar de andar armado"));
    sList.innerHTML = html;
    sList.scrollTop = 0;
    for (const id of Object.keys(DEALERS)) tap(`aD_${id}`, () => openShop(id));
    for (const gun of a.guns) tap(`aG_${gun.uid}`, () => openGun(gun.uid));
    tap("aMags", openStock);
    tap("aHunt", goHunting);
    tap("aHol", () => ((a.carry = null), openArms()));
  }

  // ---- tienda / dealer
  const premium = (d) => {
    const g = state.gangLife && state.gangLife.member ? state.gangLife : null;
    return d.minRank && (!g || g.rank < d.minRank) ? 1.4 : 1;
  };
  function openShop(id) {
    const d = DEALERS[id];
    const a = A();
    frame(d.n, () => openArms(origin));
    curView = () => openShop(id);
    const pr = premium(d);
    let html = "";
    if (pr > 1) html += `<div class="sec">${T("He doesn't know you. Prices are 40% higher.", "No te conoce. Los precios están 40% más altos.", "Ele não te conhece. Os preços estão 40% mais altos.")}</div>`;
    const item = (kind, key, def, icon, extra) => {
      const cost = Math.round(price(def.price) * pr);
      return row(`aB_${kind}_${key}`, icon, def.n, `${PIECE(money(cost))}${extra ? " · " + extra : ""}`, false, "");
    };
    if (d.legal) {
      for (const [cat, label] of CATS) {
        const ks = legalKeys().filter((x) => GUNS[x].cat === cat);
        if (!ks.length) continue;
        html += `<div class="sec">${label}</div>`;
        for (const k of ks) {
          const def = GUNS[k];
          html += item("g", k, def, def.icon, PIECE(`${T("Power", "Poder", "Poder")} ${pct(def.power)}`) + (state.age < def.age ? ` · ${PIECE(`${T("Age", "Edad", "Idade")} ${def.age}+`)}` : ""));
        }
      }
    } else {
      if (d.guns) {
        let last = "";
        for (const k of d.guns) {
          if (GUNS[k].cat !== last) ((last = GUNS[k].cat), (html += `<div class="sec">${SECS[last] || T("Guns", "Armas", "Armas")}</div>`));
          html += item("g", k, GUNS[k], GUNS[k].icon, `${PIECE(`${T("Power", "Poder", "Poder")} ${pct(GUNS[k].power)}`)} · ${PIECE(T("Illegal", "Ilegal", "Ilegal"))}`);
        }
      }
      if (d.mags) {
        html += `<div class="sec">${T("Magazines", "Cargadores", "Pentes")}</div>`;
        for (const k of d.mags) html += item("m", k, MAGS[k], MAGS[k].icon, MAGS[k].illegal ? PIECE(T("Illegal", "Ilegal", "Ilegal")) : "");
      }
      if (ATTACH_ON && d.parts) {
        html += `<div class="sec">${T("Attachments", "Accesorios", "Acessórios")}</div>`;
        for (const k of d.parts) {
          const p = PARTS[k];
          const fits = p.grps.length === ALL.length ? T("Fits everything", "Sirve para todas", "Serve em todas") : p.grps[0] === "glock" ? T("Glocks", "Glocks", "Glocks") : T("AK rifles", "Rifles AK", "Rifles AK");
          html += item("p", k, p, p.icon, `${PIECE(SLOTS[p.slot])} · ${PIECE(fits)}`);
        }
      }
    }
    if (ATTACH_ON && d.kits) {
      html += `<div class="sec">${T("Ready-Made (with attachments)", "Ya armadas (con accesorios)", "Já montadas (com acessórios)")}</div>`;
      for (const k of d.kits) {
        const kit = KITS[k];
        const st = stats(kitGun(kit));
        html += item("k", k, { n: kit.n, price: kitPrice(kit) }, pic(kitGun(kit)), `${PIECE(`${T("Power", "Poder", "Poder")} ${pct(st.power)}`)} · ${PIECE(statusTxt(st))}`);
      }
    }
    sList.innerHTML = html;
    sList.scrollTop = 0;
    for (const k of d.kits || []) tap(`aB_k_${k}`, () => buy(id, "k", k));
    for (const k of d.guns || (d.legal ? legalKeys() : [])) tap(`aB_g_${k}`, () => buy(id, "g", k));
    for (const k of d.mags || []) tap(`aB_m_${k}`, () => buy(id, "m", k));
    for (const k of d.parts || []) tap(`aB_p_${k}`, () => buy(id, "p", k));
  }

  function buy(id, kind, key) {
    const d = DEALERS[id];
    const a = A();
    const kit = kind === "k" ? KITS[key] : null;
    const def = kit ? { n: kit.n, price: kitPrice(kit), icon: pic(kitGun(kit)), age: GUNS[kit.base].age, illegal: stats(kitGun(kit)).illegal } : kind === "g" ? GUNS[key] : kind === "m" ? MAGS[key] : PARTS[key];
    const cost = Math.round(price(def.price) * premium(d));
    if ((kind === "g" || kind === "k") && state.age < (def.age || 16)) return plain(`${T("You have to be at least", "Tienes que tener al menos", "Você precisa ter pelo menos")} ${def.age} ${T("years old to buy that.", "años para comprar eso.", "anos para comprar isso.")}`);
    if (d.legal && (kind === "g" || kind === "k") && window.FL_LICENSES && !FL_LICENSES.has("firearm")) return FL_LICENSES.need("firearm");
    if (state.money < cost) return plain(T("You don't have enough money for that.", "No te alcanza para eso.", "Você não tem dinheiro para isso."));
    const done = (extra) => {
      state.money -= cost;
      if (kind === "g") a.guns.push({ uid: a.uid++, id: key, mag: null, att: {} });
      else if (kind === "k") a.guns.push({ uid: a.uid++, ...kitGun(kit), kit: key });
      else if (kind === "m") a.mags[key] = (a.mags[key] || 0) + 1;
      else a.parts.push(extra ? { id: key, color: extra } : { id: key });
      typeof renderStats === "function" && renderStats();
      typeof chaChing === "function" && chaChing();
      say(d.legal ? T("I bought a gun legally.", "Compré un arma legalmente.", "Comprei uma arma legalmente.") : T("I bought some gear from a street dealer.", "Compré equipo con un dealer de la calle.", "Comprei equipamento com um dealer da rua."));
      jCard({
        tag: TITLE,
        iconSrc: kind === "p" ? partIcon({ id: key, color: extra }) : def.icon,
        title: def.n,
        lead: d.legal
          ? T("Background check cleared. It's all yours.", "Pasó la verificación de antecedentes. Es toda tuya.", "Passou na verificação de antecedentes. É toda sua.")
          : T("You got it from a guy who knows a guy. No receipt, no questions.", "Te lo consiguió un pana de un pana. Sin factura y sin preguntas.", "Você conseguiu com um conhecido de um conhecido. Sem nota e sem perguntas."),
        rows: [["Money", `-${money(cost)}`]],
        choices: [["OK", () => openShop(id)]],
      });
    };
    const go = (extra) => {
      // riesgos de comprar en la calle
      if (!d.legal && (kind === "g" || kind === "k" || def.illegal)) {
        const x = rnd();
        if (x < 0.05) {
          state.money -= cost;
          typeof renderStats === "function" && renderStats();
          say(T("A dealer took my money and disappeared.", "Un dealer se llevó mi plata y desapareció.", "Um dealer pegou meu dinheiro e sumiu."));
          return jCard({ tag: TITLE, iconSrc: d.icon, title: T("Scammed", "Te estafaron", "Você foi enganado"), lead: T("He took your cash and never showed up. Lesson learned.", "Se llevó tu plata y nunca apareció. Aprendiste la lección.", "Ele pegou seu dinheiro e nunca apareceu. Lição aprendida."), rows: [["Money", `-${money(cost)}`]], choices: [["OK", () => openShop(id)]] });
        }
        if (x < 0.08) {
          say(T("It was a police sting.", "Era una trampa de la policía.", "Era uma armadilha da polícia."));
          return setTimeout(() => typeof arrest === "function" && arrest("attempted purchase of an illegal firearm", [2, 6]), 50);
        }
      }
      done(extra);
    };
    const confirm = (extra) =>
      jCard({
        tag: TITLE,
        iconSrc: kind === "p" ? partIcon({ id: key, color: extra }) : def.icon,
        title: def.n,
        lead: `${T("Price", "Precio", "Preço")}: ${money(cost)}`,
        rows: [["Money", money(state.money)]],
        choices: [[T("Buy it", "Comprarlo", "Comprar"), () => go(extra)], [T("Never mind", "Mejor no", "Deixa pra lá"), () => {}]],
      });
    if (kind === "p" && def.color)
      return socSelCard({
        tag: TITLE,
        icon: partIcon({ id: key }),
        title: def.n,
        lead: T("Pick the color of the switch.", "Elige el color del switch.", "Escolha a cor do switch."),
        label: T("Color:", "Color:", "Cor:"),
        opts: COLORS.map((c) => c[1]),
        btn: `${T("Buy", "Comprar", "Comprar")} · ${money(cost)}`,
        onGo: (i) => go(COLORS[i][0]),
      });
    confirm(null);
  }

  // ---- un arma: llevarla, cargador, accesorios, vender
  function openGun(uid) {
    const a = A();
    const gun = findGun(uid);
    if (!gun) return openArms();
    const d = gunDef(gun);
    const s = stats(gun);
    frame(gunName(gun), () => openArms(origin));
    curView = () => openGun(uid);
    const on = a.carry === uid;
    let html = `<div class="sec">${gunName(gun)}</div>`;
    html += `<div style="text-align:center;padding:6px 0 2px"><img src="${pic(gun)}" alt="" style="width:200px;height:180px;object-fit:contain;margin:0"></div>`;
    html += row("gInfo", pic(gun), statusTxt(s), `${PIECE(`${T("Power", "Poder", "Poder")} ${pct(s.power)}`)} · ${PIECE(`${T("Police heat", "Calor policial", "Atenção da polícia")} +${s.heat}`)}`, true);
    html += row("gCarry", E("1f45c"), on ? T("Put It Away", "Guardarla", "Guardar") : T("Carry It", "Llevarla encima", "Levar com você"), on ? T("You're armed", "Andas armado", "Você está armado") : T("Only one gun at a time", "Solo una arma a la vez", "Só uma arma por vez"));
    if (d.grp) {
      html += `<div class="sec">${T("Magazine", "Cargador", "Pente")}</div>`;
      const m = gun.mag && MAGS[gun.mag];
      html += row("gMag", m ? m.icon : MAG_ICON, m ? m.n : STD[d.grp], T("Tap to change", "Toca para cambiarlo", "Toque para trocar"));
      if (ATTACH_ON) html += `<div class="sec">${T("Attachments", "Accesorios", "Acessórios")}</div>`;
      if (ATTACH_ON) for (const sl of slotsOf(d)) {
        const at = gun.att[sl];
        html += row(`gS_${sl}`, at ? partIcon(at) : BLANK, at ? PARTS[at.id].n : SLOTS[sl], at ? `${PIECE(SLOTS[sl])}${at.color ? " · " + PIECE(colorName(at.color)) : ""}` : T("Empty. Tap to install", "Vacío. Toca para instalar", "Vazio. Toque para instalar"));
      }
    }
    html += `<div class="sec">${T("Get Rid of It", "Deshacerte de ella", "Se livrar dela")}</div>`;
    html += row("gSell", E("1f4b0"), T("Sell It", "Venderla", "Vender"), `${PIECE(money(Math.round(price(d.price) * 0.5)))}`);
    sList.innerHTML = html;
    sList.scrollTop = 0;
    tap("gCarry", () => {
      if (on) a.carry = null;
      else {
        a.carry = uid;
        window.FL_GANG_STOW && window.FL_GANG_STOW();
        say(T("I started carrying a gun.", "Empecé a andar armado.", "Comecei a andar armado."));
      }
      openGun(uid);
    });
    tap("gMag", () => pickMag(gun));
    for (const sl of d.grp ? slotsOf(d) : []) tap(`gS_${sl}`, () => pickPart(gun, sl));
    tap("gSell", () => {
      const cash = Math.round(price(d.price) * 0.5);
      jCard({
        tag: TITLE,
        iconSrc: pic(gun),
        title: gunName(gun),
        lead: T("Sell it for half of what it's worth? Attachments and the magazine go back to your stock.", "¿Venderla por la mitad de lo que vale? Los accesorios y el cargador vuelven a tu inventario.", "Vender pela metade do valor? Os acessórios e o pente voltam para o seu estoque."),
        rows: [["Money", `+${money(cash)}`]],
        choices: [
          [T("Sell it", "Venderla", "Vender"), () => {
            returnParts(gun);
            a.guns.splice(a.guns.indexOf(gun), 1);
            if (a.carry === uid) a.carry = null;
            state.money += cash;
            typeof renderStats === "function" && renderStats();
            typeof chaChing === "function" && chaChing();
            say(T("I sold a gun.", "Vendí un arma.", "Vendi uma arma."));
            openArms();
          }],
          [T("Keep it", "Quedármela", "Ficar com ela"), () => {}],
        ],
      });
    });
  }
  function returnParts(gun) {
    const a = A();
    for (const at of attList(gun)) a.parts.push(at);
    if (gun.mag) a.mags[gun.mag] = (a.mags[gun.mag] || 0) + 1;
    gun.att = {};
    gun.mag = null;
  }

  function pickMag(gun) {
    const a = A();
    const d = gunDef(gun);
    const have = Object.keys(a.mags).filter((k) => a.mags[k] > 0 && MAGS[k].grp === d.grp);
    const keys = ["", ...have.filter((k) => k !== gun.mag)];
    if (keys.length === 1 && !gun.mag) return plain(T("You don't have any other magazines for this gun. Buy some from a dealer.", "No tienes otros cargadores para esta arma. Cómpralos con un dealer.", "Você não tem outros pentes para esta arma. Compre com um dealer."));
    socSelCard({
      tag: TITLE,
      icon: MAG_ICON,
      title: T("Load a Magazine", "Cargar un cargador", "Carregar um pente"),
      lead: T("The magazine you're using goes back to your stock.", "El cargador que traes puesto vuelve a tu inventario.", "O pente que está em uso volta para o seu estoque."),
      label: T("Magazine:", "Cargador:", "Pente:"),
      opts: keys.map((k) => (k ? `${MAGS[k].n} ×${a.mags[k]}` : STD[d.grp])),
      btn: T("Load it", "Cargarlo", "Carregar"),
      onGo: (i) => {
        const k = keys[i];
        if (gun.mag) a.mags[gun.mag] = (a.mags[gun.mag] || 0) + 1;
        if (k) a.mags[k]--;
        gun.mag = k || null;
        say(T("I changed the magazine.", "Cambié el cargador.", "Troquei o pente."));
        openGun(gun.uid);
      },
    });
  }

  function pickPart(gun, slot) {
    const a = A();
    const d = gunDef(gun);
    const at = gun.att[slot];
    if (at)
      return jCard({
        tag: TITLE,
        iconSrc: partIcon(at),
        title: PARTS[at.id].n,
        lead: T("Take it off? It goes back to your parts stock.", "¿Quitarla? Vuelve a tu inventario de piezas.", "Tirar? Ela volta para o seu estoque de peças."),
        choices: [
          [T("Remove it", "Quitarla", "Tirar"), () => ((a.parts.push(at), delete gun.att[slot]), openGun(gun.uid))],
          [T("Keep it", "Dejarla", "Deixar"), () => {}],
        ],
      });
    const opts = a.parts.map((p, i) => [p, i]).filter(([p]) => PARTS[p.id].slot === slot && PARTS[p.id].grps.includes(d.grp));
    if (!opts.length) return plain(T("You don't have any parts for this slot. Ghost and the other dealers sell them.", "No tienes piezas para este lugar. Ghost y los otros dealers las venden.", "Você não tem peças para este lugar. O Ghost e os outros dealers vendem."));
    socSelCard({
      tag: TITLE,
      icon: partIcon(opts[0][0]),
      title: SLOTS[slot],
      lead: T("Pick what to install.", "Elige qué instalar.", "Escolha o que instalar."),
      label: T("Part:", "Pieza:", "Peça:"),
      opts: opts.map(([p]) => PARTS[p.id].n + (p.color ? ` (${colorName(p.color)})` : "")),
      btn: T("Install it", "Instalarla", "Instalar"),
      onGo: (i) => {
        const [p, idx] = opts[i];
        a.parts.splice(idx, 1);
        gun.att[slot] = p;
        say(T("I put an attachment on my gun.", "Le puse un accesorio a mi arma.", "Coloquei um acessório na minha arma."));
        openGun(gun.uid);
      },
    });
  }

  function openStock() {
    const a = A();
    frame(T("Magazines & Parts", "Cargadores y piezas", "Pentes e peças"), () => openArms(origin));
    let html = `<div class="sec">${T("Magazines", "Cargadores", "Pentes")}</div>`;
    const mk = Object.keys(a.mags).filter((k) => a.mags[k] > 0);
    html += mk.length ? mk.map((k) => row(`sM_${k}`, MAGS[k].icon, MAGS[k].n, `${PIECE(`×${a.mags[k]}`)}`, true)).join("") : row("sM0", E("1f4e6"), T("No magazines", "Sin cargadores", "Sem pentes"), T("Buy some from a dealer", "Cómpralos con un dealer", "Compre com um dealer"), true);
    html += `<div class="sec">${T("Parts", "Piezas", "Peças")}</div>`;
    html += a.parts.length ? a.parts.map((p, i) => row(`sP_${i}`, partIcon(p), PARTS[p.id].n, `${PIECE(SLOTS[PARTS[p.id].slot])}${p.color ? " · " + PIECE(colorName(p.color)) : ""}`, true)).join("") : row("sP0", E("1f4e6"), T("No parts", "Sin piezas", "Sem peças"), T("Buy some from a dealer", "Cómpralas con un dealer", "Compre com um dealer"), true);
    sList.innerHTML = html;
    sList.scrollTop = 0;
  }

  // ---- cacería (legal)
  function goHunting() {
    const a = A();
    const hunters = a.guns.filter((x) => gunDef(x).hunt);
    if (!hunters.length) return plain(T("You need a hunting weapon.", "Necesitas un arma de caza.", "Você precisa de uma arma de caça."));
    if (yr().hunts >= 2) return plain(T("You've already been hunting twice this year. The season's over.", "Ya fuiste de cacería dos veces este año. Se acabó la temporada.", "Você já foi caçar duas vezes este ano. A temporada acabou."));
    const go = () => {
      const best = hunters.reduce((m, x) => (stats(x).power + gunDef(x).hunt * 0.05 > stats(m).power + gunDef(m).hunt * 0.05 ? x : m), hunters[0]);
      yr().hunts++;
      const luck = 0.45 + stats(best).power * 1.5 + (state.stats ? (state.stats.Health || 50) / 400 : 0);
      const rows = [];
      if (rnd() < 0.03) {
        if (state.stats) state.stats.Health = clampN((state.stats.Health || 50) - ri(15, 35), 0, 100);
        typeof renderStats === "function" && renderStats();
        say(T("I got hurt in a hunting accident.", "Me lastimé en un accidente de cacería.", "Me machuquei num acidente de caça."));
        return jCard({ tag: TITLE, iconSrc: gunDef(best).icon, title: T("Hunting Accident", "Accidente de cacería", "Acidente de caça"), lead: T("You slipped in the woods and got hurt badly.", "Te resbalaste en el monte y te lastimaste feo.", "Você escorregou no mato e se machucou feio."), rows: [["Health", "-"]], choices: [["OK", openArms]] });
      }
      if (rnd() < luck) {
        const cash = ri(60, 320);
        state.money += cash;
        if (state.stats) state.stats.Happiness = clampN((state.stats.Happiness || 50) + ri(2, 6), 0, 100);
        typeof renderStats === "function" && renderStats();
        say(T("I went hunting and caught something big.", "Fui de cacería y cacé algo grande.", "Fui caçar e peguei algo grande."));
        rows.push(["Money", `+${money(cash)}`]);
        jCard({ tag: TITLE, iconSrc: gunDef(best).icon, title: T("Good Hunt", "Buena cacería", "Boa caçada"), lead: T("You came back with a trophy and a freezer full of meat.", "Volviste con un trofeo y un congelador lleno de carne.", "Você voltou com um troféu e um freezer cheio de carne."), rows, choices: [["OK", openArms]] });
      } else {
        if (state.stats) state.stats.Happiness = clampN((state.stats.Happiness || 50) + 1, 0, 100);
        typeof renderStats === "function" && renderStats();
        say(T("I went hunting but came back empty-handed.", "Fui de cacería pero volví con las manos vacías.", "Fui caçar mas voltei de mãos vazias."));
        jCard({ tag: TITLE, iconSrc: gunDef(best).icon, title: T("Empty-Handed", "Con las manos vacías", "De mãos vazias"), lead: T("You sat in the cold all day and saw nothing. Still, it was peaceful.", "Pasaste el día en el frío sin ver nada. Aun así, fue tranquilo.", "Você passou o dia no frio sem ver nada. Mesmo assim, foi tranquilo."), choices: [["OK", openArms]] });
      }
    };
    if (a.license) return go();
    const fee = price(60);
    jCard({
      tag: TITLE,
      iconSrc: E("1f333"),
      title: T("Hunting License", "Licencia de caza", "Licença de caça"),
      lead: T("You need a license to hunt legally.", "Necesitas una licencia para cazar legalmente.", "Você precisa de uma licença para caçar legalmente."),
      rows: [["Price", money(fee)]],
      choices: [
        [T("Buy the license", "Comprar la licencia", "Comprar a licença"), () => {
          if (state.money < fee) return plain(T("You don't have enough money for that.", "No te alcanza para eso.", "Você não tem dinheiro para isso."));
          state.money -= fee;
          a.license = true;
          typeof renderStats === "function" && renderStats();
          go();
        }],
        [T("Not now", "Ahora no", "Agora não"), () => {}],
      ],
    });
  }

  // ---------------------------------------------------------------- conexión con la pandilla y la policía
  // Se llama cuando te arrestan en algo ilegal. Si llevas un arma suma el cargo extra y te la quitan.
  function busted(crime) {
    const gun = carriedGun();
    if (!gun) return null;
    const a = A();
    const s = stats(gun);
    const base = (typeof CHARGES !== "undefined" && CHARGES[crime]) || [1, 4];
    const lo = base[0], hi = base[1];
    let charge, years;
    if (s.auto) (charge = `${crime} and possession of an automatic weapon`), (years = [lo + 6, hi + 10]);
    else if (s.illegal) (charge = `${crime} and illegal firearm possession`), (years = [lo + 3, hi + 6]);
    else (charge = `${crime} with a firearm`), (years = [lo + 2, hi + 4]); // arma legal usada en algo ilegal
    years[1] = Math.min(years[1], 40);
    a.guns.splice(a.guns.indexOf(gun), 1);
    a.carry = null;
    say(T("The police confiscated my gun.", "La policía me quitó el arma.", "A polícia apreendeu minha arma."));
    return { charge, years };
  }

  window.FL_ARMS = {
    open: openArms,
    state: () => state.arms,
    carried: () => {
      const g = carriedGun();
      return g ? { name: gunDef(g).n, ...stats(g) } : null;
    },
    power: () => {
      const g = carriedGun();
      return g ? stats(g).power : 0;
    },
    heat: () => {
      const g = carriedGun();
      return g ? stats(g).heat : 0;
    },
    stow: () => {
      A().carry = null;
    },
    busted,
    // ---- API para otros mods (gangwars.js, arms-events.js)
    catalog: () => GUNS,
    def: (id) => GUNS[id] || null,
    owned: () => A().guns.slice(),
    carriedRaw: carriedGun,
    stats,
    name: gunName,
    pic,
    legalGuns: legalKeys,
    // regalar / quitar cosas (devuelven el uid o true)
    give: (id) => (GUNS[id] ? (A().guns.push({ uid: A().uid++, id, mag: null, att: {} }), A().uid - 1) : null),
    giveMag: (k) => (MAGS[k] ? ((A().mags[k] = (A().mags[k] || 0) + 1), true) : false),
    givePart: (id, color) => (PARTS[id] ? (A().parts.push(color ? { id, color } : { id }), true) : false),
    take: (uid) => {
      const a = A(), g = a.guns.find((x) => x.uid === uid);
      if (!g) return false;
      a.guns.splice(a.guns.indexOf(g), 1);
      if (a.carry === uid) a.carry = null;
      return true;
    },
    carry: (uid) => {
      const a = A();
      if (a.guns.some((x) => x.uid === uid)) a.carry = uid;
    },
  };

  // ---------------------------------------------------------------- arranque
  function boot() {
    if (typeof openActivities !== "function" || !document.getElementById("ageBtn") || typeof sList === "undefined") return setTimeout(boot, 60);
    const orig = openActivities;
    openActivities = function () {
      const r = orig.apply(this, arguments);
      try {
        const html = '<div class="sec">' + T("Guns", "Armas", "Armas") + "</div>" + row("actArms", DEALERS.ray.icon, TITLE, state.age < 16 ? `${T("Age", "Edad", "Idade")} 16+` : T("Legal store, street dealers and your arsenal", "Tienda legal, dealers de la calle y tu arsenal", "Loja legal, dealers da rua e seu arsenal"), state.age < 16, chev());
        const all = [...sList.querySelectorAll(".sec")].find((e) => "All" === e.textContent.trim());
        all ? all.insertAdjacentHTML("beforebegin", html) : sList.insertAdjacentHTML("afterbegin", html);
        const el = document.getElementById("actArms");
        if (el && state.age >= 16) el.onclick = () => (typeof play === "function" && play("choice"), openArms(null));
      } catch (e) {
        console.warn("[arms] menu", e);
      }
      return r;
    };
  }
  boot();
})();
