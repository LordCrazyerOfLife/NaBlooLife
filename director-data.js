/* [mod] Movie Director data (director.js). Plain data, no logic.
 * Real actors and studios appear BY NAME ONLY as template data. Their birth years drive how they age in the game.
 * Nothing here (or in the events) invents scandals about a real person: problems are always phrased about "your lead"
 * or "your cast", and declines are neutral (schedule, fee, role size).
 */
(() => {
  "use strict";
  // genre ids: a action, c comedy, d drama, h horror, s sci-fi, r romance, t thriller, f fantasy, n animation, m musical
  const GENRES = [
    // id, name, emoji icon, appeal (mass), critic bias, audience bias, cost need (vfx/scale), legs bonus
    ["a", "Action", "emoji/1f4a5.png", 1.25, -4, 6, 1.3, 0],
    ["c", "Comedy", "emoji/1f602.png", 1.1, -2, 5, 0.6, 0.2],
    ["d", "Drama", "emoji/1f3ad.png", 0.8, 8, -3, 0.5, 0.5],
    ["h", "Horror", "emoji/1f47b.png", 1.15, -1, 4, 0.4, -0.2],
    ["s", "Sci-Fi", "emoji/1f680.png", 1.2, 1, 3, 1.5, 0.1],
    ["r", "Romance", "emoji/2764-fe0f.png", 0.95, -1, 3, 0.45, 0.2],
    ["t", "Thriller", "emoji/1f52a.png", 1.0, 3, 2, 0.7, 0.1],
    ["f", "Fantasy", "emoji/1f525.png", 1.15, 0, 4, 1.6, 0.3],
    ["n", "Animation", "emoji/1f9f8.png", 1.2, 4, 5, 1.1, 0.6],
    ["m", "Musical", "emoji/1f3b6.png", 0.9, 4, 1, 1.0, 0.3],
  ];
  const THEMES = [
    ["redemption", "Redemption"], ["revenge", "Revenge"], ["love", "Love against the odds"], ["survival", "Survival"],
    ["identity", "Identity"], ["corruption", "Corruption"], ["family", "Family"], ["betrayal", "Betrayal"],
    ["coming", "Coming of age"], ["machine", "Man vs. machine"], ["grief", "Grief"], ["power", "The price of power"],
  ];
  // [id, name, quality delta, viral delta, plot-hole risk]
  const TWISTS = [
    ["none", "No twist (play it straight)", 0, 0, 0],
    ["mentor", "The mentor is the villain", 3, 4, 0.1],
    ["dead", "The hero was dead all along", 5, 8, 0.2],
    ["sim", "It was a simulation", 3, 6, 0.2],
    ["twin", "A secret twin", -1, 4, 0.25],
    ["narr", "The narrator lied", 6, 6, 0.15],
    ["loop", "A time loop", 4, 7, 0.3],
    ["villain", "The hero was the villain", 6, 7, 0.2],
    ["fake", "A fake ending, then the real one", 3, 8, 0.15],
    ["dream", "It was all a dream", -9, -4, 0.4],
  ];
  // good / bad genre x theme pairs and genre x twist pairs (a, b => bonus)
  const GT_GOOD = new Set("h:grief d:grief d:family d:redemption a:revenge a:redemption t:corruption t:betrayal s:machine s:identity r:love r:betrayal f:coming n:family n:coming c:identity c:family m:coming m:love h:survival a:survival d:power t:power f:power".split(" "));
  const GT_BAD = new Set("r:revenge n:corruption h:love c:grief m:corruption n:revenge".split(" "));
  const GW_GOOD = new Set("h:dead t:narr t:villain s:sim s:loop d:narr d:villain a:mentor f:mentor h:twin t:fake c:loop r:loop n:mentor".split(" "));
  // premises per genre; {t} = theme word
  const PREMISES = {
    a: ["A retired courier gets one last job that goes wrong in a city that never sleeps.", "Two rival agents are forced to protect the same witness over one brutal weekend.", "A rescue pilot flies straight into a storm to save a stranded crew."],
    c: ["A wedding planner accidentally books two weddings on the same day, in the same hall.", "Three roommates swap lives for a week and refuse to admit it is a disaster.", "A failing local news team stumbles into the biggest story of the decade."],
    d: ["A family reunites for the last time at a lake house that is about to be sold.", "A teacher who gave up on everything meets one student who will not give up on her.", "Two brothers inherit a failing diner and a long list of old secrets."],
    h: ["A family moves into a house where the walls remember everything.", "A night-shift nurse hears a voice on an empty ward.", "Four friends livestream a trip to an abandoned town and something starts answering the chat."],
    s: ["A lone engineer wakes up on a ship that has been drifting for 70 years.", "An AI built to forecast the weather starts predicting people's last days.", "A signal from deep space repeats the name of someone on Earth."],
    r: ["Two strangers keep missing each other in the same city for ten years.", "A chef and a food critic fall for each other before they ever meet.", "A long-distance couple has exactly one weekend a year."],
    t: ["A detective realizes the case file has her own handwriting in it.", "A banker finds an account that was opened in his name, years ago, by someone else.", "A courtroom sketch artist draws the one face the jury must never see."],
    f: ["A baker's apprentice finds a door that only opens at sunrise.", "An exiled princess has to learn the language of the dragons she was sent to hunt.", "A village is cursed to forget one person every night."],
    n: ["A lonely robot builds a garden on a planet where nothing grows.", "A fox and a rabbit run a bakery on the edge of a haunted forest.", "A little cloud leaves its storm to find the sun."],
    m: ["A small-town diner waitress finds out she can change the town with one song.", "Two rival street crews settle every fight with a dance battle.", "A retired stage star returns to the theatre that made her."],
  };
  const TITLE_A = ["Midnight", "Last", "Silent", "Broken", "Golden", "Neon", "Crimson", "Hollow", "Lost", "Final", "Paper", "Electric", "Burning", "Wild", "Distant", "Velvet", "Iron", "Glass", "Hidden", "Second"];
  const TITLE_B = ["Harbor", "Signal", "Kingdom", "Orbit", "Summer", "Tide", "Promise", "Frontier", "Echo", "Garden", "Verdict", "Highway", "Horizon", "Machine", "Letters", "Season", "Mirror", "Fever", "Run", "Light"];
  // newcomer / filler actors are generated by director.js
  const FIRST = ["Alex", "Mia", "Noah", "Zoe", "Liam", "Nora", "Eli", "Ivy", "Max", "Luna", "Theo", "Ruby", "Jonas", "Cleo", "Dante", "Sasha", "Kai", "Elena", "Marco", "Tessa", "Omar", "Priya", "Leo", "Yara"];
  const LAST = ["Hart", "Voss", "Mercer", "Quinn", "Sato", "Navarro", "Frost", "Okafor", "Lindqvist", "Reyes", "Bishop", "Moreau", "Park", "Ashford", "Delgado", "Novak", "Whitaker", "Haddad", "Rowe", "Castellan"];

  // [name, birth year, talent, peak star power, tags (genres they sell in)]
  const ACTORS = [
    ["Tom Hanks", 1956, 94, 90, "dcfn"], ["Meryl Streep", 1949, 98, 80, "dcm"], ["Leonardo DiCaprio", 1974, 96, 95, "dta"], ["Brad Pitt", 1963, 90, 92, "atdc"],
    ["Denzel Washington", 1954, 95, 88, "dta"], ["Scarlett Johansson", 1984, 88, 93, "asd"], ["Margot Robbie", 1990, 89, 92, "cdma"], ["Ryan Gosling", 1980, 91, 90, "drma"],
    ["Timothée Chalamet", 1995, 90, 90, "drsf"], ["Zendaya", 1996, 85, 91, "dsrm"], ["Robert De Niro", 1943, 96, 80, "dtc"], ["Al Pacino", 1940, 96, 76, "dt"],
    ["Jennifer Lawrence", 1990, 90, 90, "dacs"], ["Emma Stone", 1988, 90, 88, "cdm"], ["Dwayne Johnson", 1972, 68, 95, "acfn"], ["Tom Cruise", 1962, 85, 94, "ast"],
    ["Keanu Reeves", 1964, 80, 90, "ast"], ["Cate Blanchett", 1969, 97, 82, "dfs"], ["Morgan Freeman", 1937, 94, 82, "dsn"], ["Samuel L. Jackson", 1948, 88, 88, "atcs"],
    ["Robert Downey Jr.", 1965, 90, 94, "asc"], ["Chris Hemsworth", 1983, 76, 90, "afc"], ["Chris Evans", 1981, 82, 90, "adc"], ["Will Smith", 1968, 85, 91, "acsd"],
    ["Natalie Portman", 1981, 92, 82, "dts"], ["Anne Hathaway", 1982, 88, 84, "rcdm"], ["Joaquin Phoenix", 1974, 98, 82, "dth"], ["Christian Bale", 1974, 96, 86, "dta"],
    ["Matt Damon", 1970, 90, 88, "atd"], ["Ben Affleck", 1972, 82, 80, "dta"], ["Jake Gyllenhaal", 1980, 92, 78, "tdh"], ["Florence Pugh", 1996, 91, 82, "dht"],
    ["Anya Taylor-Joy", 1996, 88, 82, "htf"], ["Pedro Pascal", 1975, 86, 88, "adsf"], ["Oscar Isaac", 1979, 90, 80, "sdt"], ["Viola Davis", 1965, 97, 80, "dt"],
    ["Octavia Spencer", 1970, 90, 72, "dcf"], ["Charlize Theron", 1975, 92, 84, "atd"], ["Nicole Kidman", 1967, 94, 82, "dth"], ["Julia Roberts", 1967, 88, 86, "rcd"],
    ["Sandra Bullock", 1964, 85, 85, "crt"], ["Angelina Jolie", 1975, 88, 88, "atf"], ["Harrison Ford", 1942, 88, 90, "asa"], ["Clint Eastwood", 1930, 90, 82, "dta"],
    ["Anthony Hopkins", 1937, 98, 78, "htd"], ["Judi Dench", 1934, 96, 70, "dc"], ["Ian McKellen", 1939, 95, 74, "fdh"], ["Jack Nicholson", 1937, 97, 82, "dht"],
    ["Jodie Foster", 1962, 93, 76, "tds"], ["Michelle Yeoh", 1962, 90, 78, "afs"], ["Jackie Chan", 1954, 80, 84, "acn"], ["Ken Watanabe", 1959, 88, 66, "dah"],
    ["Song Kang-ho", 1967, 94, 68, "dth"], ["Gael García Bernal", 1978, 88, 68, "dcr"], ["Penélope Cruz", 1974, 91, 76, "drc"], ["Javier Bardem", 1969, 93, 74, "dta"],
    ["Salma Hayek", 1966, 82, 76, "acn"], ["Jason Momoa", 1979, 72, 84, "afs"], ["Idris Elba", 1972, 88, 84, "ats"], ["Michael B. Jordan", 1987, 90, 86, "ads"],
    ["Lupita Nyong'o", 1983, 92, 78, "hdn"], ["Zoe Saldaña", 1978, 84, 90, "sfa"], ["Sydney Sweeney", 1997, 80, 84, "rch"], ["Jenna Ortega", 2002, 84, 84, "hfc"],
    ["Millie Bobby Brown", 2004, 78, 80, "fsh"], ["Tom Holland", 1996, 82, 90, "afc"], ["Austin Butler", 1991, 86, 80, "dmr"], ["Paul Mescal", 1996, 90, 76, "dr"],
    ["Cillian Murphy", 1976, 94, 80, "dth"], ["Emily Blunt", 1983, 91, 82, "dhsr"], ["John Krasinski", 1979, 78, 74, "chs"], ["Adam Driver", 1983, 93, 80, "dsm"],
    ["Daisy Ridley", 1992, 78, 74, "sfa"], ["Hugh Jackman", 1968, 86, 88, "amd"], ["Ryan Reynolds", 1976, 80, 90, "ac"], ["Gal Gadot", 1985, 72, 82, "af"],
    ["Henry Cavill", 1983, 76, 84, "af"], ["Mahershala Ali", 1974, 94, 76, "dtn"], ["Willem Dafoe", 1955, 95, 72, "hdf"], ["Tilda Swinton", 1960, 94, 66, "dsf"],
    ["Bill Murray", 1950, 90, 78, "cd"], ["Eddie Murphy", 1961, 86, 82, "cn"], ["Kevin Hart", 1979, 70, 82, "cnm"], ["Jim Carrey", 1962, 88, 84, "cdn"],
    ["Adam Sandler", 1966, 82, 82, "cd"], ["Steve Carell", 1962, 88, 80, "cdn"], ["Melissa McCarthy", 1970, 84, 76, "cd"], ["Awkwafina", 1988, 80, 70, "cn"],
    ["Ana de Armas", 1988, 84, 80, "atr"], ["Jessica Chastain", 1977, 94, 78, "dts"], ["Amy Adams", 1974, 93, 78, "dmr"], ["Saoirse Ronan", 1994, 94, 74, "dr"],
  ];
  // [id, name, kind, likes (genre ids), prestige 0-100, marketing power 1-10, studio cut of gross, min director rank, blurb]
  const STUDIOS = [
    ["sony", "Sony Pictures", "Major studio", "acsr", 74, 8, 0.5, 3, "Big summer releases and crowd-pleasers."],
    ["wb", "Warner Bros.", "Major studio", "astf", 80, 9, 0.5, 4, "Tentpoles, franchises and awards players."],
    ["uni", "Universal Pictures", "Major studio", "chas", 78, 9, 0.5, 4, "Horror hits, comedies and big events."],
    ["par", "Paramount Pictures", "Major studio", "atsd", 76, 8, 0.5, 3, "Action, thrillers and legacy franchises."],
    ["dis", "Walt Disney Studios", "Major studio", "nfmsa", 88, 10, 0.55, 5, "Family, animation, fantasy. Very strict on content."],
    ["lg", "Lionsgate", "Mid-size studio", "ahtc", 62, 6, 0.45, 2, "Mid-budget genre movies and a strong action slate."],
    ["a24", "A24", "Indie label", "dhtr", 90, 5, 0.35, 1, "Artful, risky and loved by critics. Tiny marketing budgets."],
    ["neon", "Neon", "Indie label", "dht", 82, 4, 0.35, 1, "Festival darlings and bold international films."],
    ["nfx", "Netflix Films", "Streamer", "actsr", 66, 8, 0.0, 2, "Pays a flat fee, no box office. Huge reach, little prestige."],
    ["amz", "Amazon MGM", "Streamer / studio", "dtas", 72, 7, 0.45, 3, "Mid and big budgets with a streaming window."],
  ];
  const RANKS = [
    // name, legacy points needed, max budget tier index
    ["Film Student", 0, 0], ["Indie Rookie", 12, 1], ["Festival Darling", 35, 2], ["Studio Director", 80, 3],
    ["A-List Director", 160, 4], ["Auteur", 280, 5], ["Hollywood Legend", 450, 5],
  ];
  // [name, min cost, max cost, base production value, scale]
  const BUDGETS = [
    ["Micro", 5000, 400000, 25], ["Indie", 1500000, 9000000, 42], ["Mid-range", 15000000, 45000000, 58],
    ["Studio", 60000000, 130000000, 72], ["Blockbuster", 150000000, 260000000, 86], ["Tentpole", 280000000, 400000000, 96],
  ];
  const WRITERS = [
    ["Write it yourself", 0, 0.9, "Uses your Smarts. Free, slower, and the cliches are yours."],
    ["Junior screenwriter", 0.012, 0.95, "Cheap, hungry and a bit rough."],
    ["Seasoned screenwriter", 0.035, 1.08, "Solid structure and clean dialogue."],
    ["Award-winning writer", 0.07, 1.22, "Elegant, quotable and expensive."],
  ];
  const SLOTS = [
    // id, label, [genre mults], comp (competition level 0-1), note
    ["spring", "Spring", {}, 0.4, "Quiet slot. Less competition, less attention."],
    ["summer", "Summer blockbuster season", { a: 1.3, s: 1.3, f: 1.2, n: 1.25, c: 1.1, d: 0.8 }, 0.9, "Huge crowds, huge competition."],
    ["halloween", "Halloween weekend", { h: 1.6, t: 1.15, a: 0.9, r: 0.8, n: 0.8 }, 0.5, "Horror sells itself here."],
    ["awards", "Awards season", { d: 1.25, t: 1.1, m: 1.1, a: 0.85, c: 0.85 }, 0.6, "Prestige slot: critics and voters pay attention."],
    ["holiday", "Holiday weekend", { n: 1.45, f: 1.25, m: 1.3, c: 1.1, r: 1.1, h: 0.7 }, 0.85, "Families fill theaters."],
    ["festival", "Festival premiere", { d: 1.1, h: 1.05, t: 1.05 }, 0.2, "Buzz first, wide release later. Smaller gross, bigger legacy."],
    ["stream", "Straight to streaming", {}, 0.1, "Quick, safe and forgettable. Reach, not box office."],
  ];
  // [id, label, cost fraction of production budget, buzz, viral, note]
  const MARKETING = [
    ["trailer", "Teaser trailer drop", 0.05, 4, 3, "A trailer people can't stop replaying."],
    ["influ", "Influencer and meme campaign", 0.04, 3, 7, "Cheap, fast and unpredictable."],
    ["tv", "TV and big-game ad", 0.12, 8, 2, "Reach, reach, reach."],
    ["bill", "Billboards and posters", 0.06, 4, 1, "The classic."],
    ["junket", "Press junket with the cast", 0.05, 5, 2, "Needs star power to land."],
    ["stunt", "Controversial stunt", 0.03, 6, 9, "Could go viral. Could blow up on you."],
    ["fest", "Festival premiere and screenings", 0.04, 4, 3, "Builds critical respect."],
    ["premiere", "Red-carpet premiere event", 0.05, 5, 3, "Photos, stars and headlines. Better with a famous cast."],
  ];
  // rating sites: id, name, icon, kind (c critics / a audience / m mixed), format
  const SITES = [
    ["rt", "Rotten Tomatoes (Critics)", "director/rt.png", "c", "pct"],
    ["aud", "Audience Score", "director/aud.png", "a", "pct"],
    ["imdb", "IMDb", "director/imdb.png", "m", "ten"],
    ["mc", "Metacritic", "director/mc.png", "c", "num"],
    ["lb", "Letterboxd", "director/lb.png", "m", "five"],
    ["cs", "CinemaScore", "director/cs.png", "a", "grade"],
  ];
  // viral combos: [id, label, delta, test(p)] ; p = {genre, theme, twist, budgetTier, slot, cast:[{star,age}], ads:[], q:{...}, stars}
  const COMBOS = [
    ["lowhorror", "Low-budget horror with a twist", 14, (p) => p.genre === "h" && p.budgetTier <= 1 && p.twist !== "none"],
    ["dancing", "A scene people will dance to", 10, (p) => (p.genre === "m" || p.genre === "c") && p.ads.includes("influ")],
    ["halloween", "Horror released on Halloween weekend", 9, (p) => p.genre === "h" && p.slot === "halloween"],
    ["deadtwist", "A twist everyone will spoil", 9, (p) => ["dead", "narr", "villain", "fake"].includes(p.twist)],
    ["meme", "A meme-ready villain", 8, (p) => ["a", "t", "h", "s"].includes(p.genre) && p.theme === "power"],
    ["stunt", "Controversial stunt that landed", 8, (p) => p.ads.includes("stunt") && p.stuntOk],
    ["chem", "Rare onscreen chemistry", 8, (p) => p.chemGood],
    ["pairing", "A genre and theme that click", 6, (p) => p.gtGood],
    ["cameo", "A surprise cameo by a legend", 7, (p) => p.cast.some((c) => c.star >= 85 && c.role === "Cameo")],
    ["streetfest", "Festival buzz that spilled online", 7, (p) => p.slot === "festival" && p.q.script >= 70],
    ["twostars", "Two massive stars together", 7, (p) => p.cast.filter((c) => c.star >= 80 && c.role !== "Cameo").length >= 2],
    ["summerfit", "The right movie at the right time", 5, (p) => (p.slot === "summer" && ["a", "s", "f", "n"].includes(p.genre)) || (p.slot === "holiday" && ["n", "f", "m"].includes(p.genre))],
    ["badtrailer", "A trailer people mocked", -10, (p) => p.badTrailer],
    ["cliche", "Cliche twist, cliche plot", -8, (p) => p.twist === "dream" || (p.q.script < 40 && p.twist !== "none")],
    ["crowded", "Opening against a giant", -9, (p) => p.crowded],
    ["longrun", "A runtime that tests patience", -6, (p) => p.cutLong],
    ["sequelfat", "Sequel fatigue", -7, (p) => p.sequel && p.q.script < 60],
    ["miscast", "A role nobody believes", -6, (p) => p.miscast],
    ["cheapvfx", "Visual effects that look unfinished", -8, (p) => ["s", "f", "a", "n"].includes(p.genre) && p.q.prod < 45],
    ["noads", "Nobody knew it was coming out", -9, (p) => p.ads.length === 0 && p.budgetTier >= 2],
  ];
  // production events: id, title, text, choices:[label, fx {q:{script,acting,direction,prod,edit}, bud (% overrun), buzz, issue:[kind,sev,text], skill, hp}, chance?, ok?]
  const EVENTS = [
    { id: "weather", t: "A storm hits the set", d: "Two shooting days are gone and the schedule is on fire.", c: [
      ["Shoot through it", { win: 0.5, w: { prod: 4, direction: 3, buzz: 2 }, l: { prod: -6, bud: 8, issue: ["weather", 1, "Rain damage shows in the footage"] } }],
      ["Rebuild the schedule", { w: { bud: 5 } }],
      ["Rewrite the scene indoors", { win: 0.6, w: { script: 2, bud: -2 }, l: { script: -5, issue: ["script", 1, "A rushed rewrite leaves a plot hole"] } }],
    ] },
    { id: "lead", t: "Your lead wants rewrites", d: "Your lead thinks the character is flat and wants to change big scenes.", c: [
      ["Hear them out", { win: 0.65, w: { acting: 6, script: 2 }, l: { script: -4, direction: -3, issue: ["direction", 1, "Too many hands on the script"] } }],
      ["Hold the line", { win: 0.5, w: { direction: 5, skill: 1 }, l: { acting: -8, buzz: -3, issue: ["cast", 1, "Visible tension between the lead and the director"] } }],
      ["Offer a bigger fee for peace", { w: { acting: 2, bud: 4 } }],
    ] },
    { id: "chem", t: "No chemistry in the big scene", d: "The two leads read the scene perfectly and feel nothing.", c: [
      ["Do a rehearsal week", { win: 0.6, w: { acting: 7, chem: 1, bud: 3 }, l: { acting: -3, bud: 3 } }],
      ["Cut the scene", { w: { script: -3, edit: 2 } }],
      ["Shoot it anyway", { win: 0.35, w: { acting: 3 }, l: { acting: -9, chem: -1, issue: ["chem", 2, "The leads have no spark"] } }],
    ] },
    { id: "vfx", t: "The effects house is behind", d: "The visual effects company is a month late and wants more money.", c: [
      ["Pay for a rush", { w: { prod: 4, bud: 8 } }],
      ["Simplify the effects", { w: { prod: -3, bud: -3, edit: 1 } }],
      ["Switch to a cheaper studio", { win: 0.5, w: { bud: -5, prod: 2 }, l: { prod: -9, issue: ["vfx", 2, "The visual effects look unfinished"] } }],
    ] },
    { id: "pressure", t: "The studio wants it shorter and louder", d: "Executives call after the dailies. They want more action and fewer quiet scenes.", c: [
      ["Give them what they want", { w: { buzz: 4, direction: -4, script: -3, issue: ["pace", 1, "Studio notes flattened the tone"] } }],
      ["Defend your vision", { win: 0.55, w: { direction: 6, skill: 2 }, l: { buzz: -4, bud: 4, issue: ["studio", 1, "A fight with the studio slowed production"] } }],
      ["Find a compromise", { w: { direction: 1, buzz: 1 } }],
    ] },
    { id: "cut", t: "A sensational idea on set", d: "Your cinematographer pitches one impossible long take that could define the film.", c: [
      ["Go for it", { win: 0.5, w: { direction: 8, buzz: 5, viral: 4, bud: 4 }, l: { direction: -4, bud: 6, issue: ["direction", 1, "An overambitious long take eats the schedule"] } }],
      ["Play it safe", { w: { direction: 1 } }],
    ] },
    { id: "cash", t: "Money runs short", d: "The budget is almost gone and there are still eight shooting days left.", c: [
      ["Ask the financiers for more", { win: 0.6, w: { bud: 10 }, l: { bud: 18, direction: -4, issue: ["budget", 2, "The production ran out of money"] } }],
      ["Cut shooting days", { w: { prod: -5, edit: -2, bud: -4 } }],
      ["Put in your own cash", { cash: 0.05, w: { prod: 3 } }],
    ] },
    { id: "cutbudget", t: "The money comes with strings", d: "The financiers will release the next payment only if you cut another 15% from the budget.", c: [
      ["Shoot leaner", { w: { prod: -3, bud: -5 } }],
      ["Fight the cut", { win: 0.5, w: { bud: -2, direction: 2 }, l: { bud: 8, prod: -5, issue: ["budget", 2, "The financiers are watching every receipt"] } }],
      ["Find a co-financier", { win: 0.6, w: { bud: -7 }, l: { bud: 3, issue: ["studio", 1, "A new partner wants a say in the cut"] } }],
    ] },
    { id: "taxcredit", t: "A tax incentive lands", d: "The region approves a production rebate, but the paperwork has to be filed this week.", c: [
      ["File for the rebate", { w: { bud: -7, prod: 1 } }],
      ["Leave it to the producers", { win: 0.5, w: { bud: -4 }, l: { bud: 2, issue: ["budget", 1, "A paperwork error cost the rebate"] } }],
    ] },
    { id: "cameocash", t: "An investor wants a cameo", d: "A wealthy investor offers to cover a chunk of the budget if he gets a scene with the lead.", c: [
      ["Take the money", { w: { bud: -6, acting: -4, issue: ["cast", 1, "A paid cameo feels out of place"] } }],
      ["Protect the film", { w: { direction: 2 } }],
      ["Give him a tiny background part", { win: 0.6, w: { bud: -4, acting: -2 }, l: { acting: -3, issue: ["cast", 1, "The investor cannot act"] } }],
    ] },
    { id: "supplier", t: "The set builder raises his price", d: "The workshop says lumber and labor went up. The main set is half built.", c: [
      ["Pay the new price", { w: { bud: 6 } }],
      ["Find a cheaper supplier", { win: 0.55, w: { bud: -3 }, l: { prod: -5, issue: ["budget", 1, "The cheap set looks cheap on camera"] } }],
      ["Redesign the set", { w: { prod: -2, bud: -2, direction: 1 } }],
    ] },
    { id: "placement", t: "A brand waves a check", d: "A soft drink company will pay for the budget if the lead drinks their product on screen.", c: [
      ["Take the deal", { w: { bud: -5, buzz: 2, issue: ["studio", 1, "The product placement is painfully obvious"] } }],
      ["Say no", { w: { direction: 1, prod: 1 } }],
    ] },
    { id: "improv", t: "An actor starts improvising", d: "An actor improvises a line that is not in the script. The room goes quiet.", c: [
      ["Keep rolling", { win: 0.6, w: { acting: 6, viral: 5, buzz: 3 }, l: { acting: -2, script: -2 } }],
      ["Cut and reset", { w: { direction: 1 } }],
    ] },
    { id: "accident", t: "A stunt goes sideways", d: "A stunt takes a bad turn. Nobody is badly hurt, but the crew is shaken.", c: [
      ["Stop and review safety", { w: { bud: 5, direction: 2, hp: 0 } }],
      ["Keep to the schedule", { win: 0.45, w: { prod: 3 }, l: { buzz: -4, bud: 6, issue: ["crew", 2, "Safety trouble delayed production"] } }],
    ] },
    { id: "leak", t: "A key scene leaks online", d: "A chunk of the plot is all over social media a month before the premiere.", c: [
      ["Lean into it", { win: 0.5, w: { buzz: 6, viral: 5 }, l: { buzz: -3, viral: -3 } }],
      ["Hire legal and clamp down", { w: { bud: 2, buzz: -1 } }],
      ["Reshoot the scene", { w: { script: 2, bud: 6, edit: 1 } }],
    ] },
    { id: "score", t: "The composer comes back with something strange", d: "The score is nothing like the temp track. It is either brilliant or a mistake.", c: [
      ["Use it", { win: 0.55, w: { edit: 7, buzz: 3 }, l: { edit: -6, issue: ["score", 1, "The score clashes with the picture"] } }],
      ["Ask for the safe version", { w: { edit: 2 } }],
    ] },
    { id: "testing", t: "A test screening goes badly", d: "A third of the room walks out in the second half. The cards say the ending is confusing.", c: [
      ["Reshoot the ending", { w: { script: 4, edit: 3, bud: 6 } }],
      ["Re-edit what you have", { win: 0.55, w: { edit: 5 }, l: { edit: -3, issue: ["edit", 1, "The ending still feels confusing"] } }],
      ["Trust your instincts", { win: 0.4, w: { direction: 5, skill: 2 }, l: { buzz: -4, issue: ["edit", 2, "The ending leaves audiences confused"] } }],
    ] },
    { id: "extra", t: "An unknown extra steals a scene", d: "A day player makes the whole crew laugh in a tiny role. You could write them in.", c: [
      ["Expand the part", { win: 0.6, w: { acting: 4, viral: 4, script: 1 }, l: { script: -2 } }],
      ["Keep the schedule", { w: { direction: 1 } }],
    ] },
  ];
  // post-release events: [id, title, text, [[label, fx, result], ...]]
  // fx: money = fraction of the film's budget you personally receive, rep, legacy, skill
  const POST_EVENTS = [
    ["streaming", "A streamer wants the film", "A streaming service offers a pile of cash for the exclusive rights to \"{title}\".", [
      ["Sell the streaming rights", { money: 0.18, rep: 1 }, "The streamer paid up front. The film found a second life on every screen in the country."],
      ["Keep it theatrical", { legacy: 3, rep: 1 }, "You turned it down. The film stayed a big-screen event, and the theaters remembered."],
    ]],
    ["merch", "The toys sell themselves", "A toy company wants to license the characters from \"{title}\" for a line of action figures.", [
      ["License the characters", { money: 0.1, rep: 2 }, "The figures sold out before the holiday. Your name was on every box."],
      ["Protect the film", { legacy: 2, rep: 1 }, "You passed. Some films are better without a cheap plastic version of themselves."],
    ]],
    ["feud", "A critic picks a fight", "A loud critic calls \"{title}\" the worst thing you have ever made, and keeps posting about it.", [
      ["Fire back", { rep: 3, legacy: 1 }, "You answered with one perfect line. The internet sided with you for a week."],
      ["Take the high road", { rep: 1, legacy: 2 }, "You said nothing. The silence made the critic look smaller than the film."],
    ]],
    ["convention", "A convention invites you", "A film convention wants you on a panel about \"{title}\". Fans are already lining up.", [
      ["Go and sign autographs", { money: 0.03, rep: 4 }, "You stayed three hours longer than planned. The line still wrapped around the hall."],
      ["Skip it", { rep: -2 }, "You stayed home. A few fans noticed, and said so online."],
    ]],
    ["piracy", "The film is online for free", "A clean copy of \"{title}\" shows up on pirate sites a month after release.", [
      ["Ignore it", { legacy: 1 }, "You let it go. More people saw the film, though not one of them paid."],
      ["Send takedowns", { money: -0.01, rep: 1 }, "The lawyers sent letters. Some links died. Others grew back overnight."],
    ]],
    ["awards", "Awards season is calling", "\"{title}\" is getting awards buzz. A publicist offers to run a full campaign for it.", [
      ["Fund the campaign", { money: -0.08, legacy: 7, rep: 3 }, "You paid for the screenings and the ads. When the nominations came out, the film was on the list."],
      ["Let the work speak", { legacy: 2 }, "You spent nothing. The film was remembered, if not rewarded."],
    ]],
    ["remake", "A studio wants the remake rights", "A big studio offers good money to remake \"{title}\" with a new director and a bigger budget.", [
      ["Sell the remake rights", { money: 0.4, rep: -2 }, "The check cleared. Somewhere, a stranger is already rewriting your ending."],
      ["Keep it", { legacy: 3 }, "You said no. Some stories should stay yours."],
    ]],
    ["mentor", "A young filmmaker writes to you", "A film student says \"{title}\" is the reason they picked up a camera. They ask for advice.", [
      ["Take them under your wing", { rep: 5, legacy: 2 }, "You read their script and sent notes. Years later, their first film opened with your name in the thanks."],
      ["You are too busy", { rep: -3 }, "You never wrote back. The email sat in your inbox for years."],
    ]],
    ["leadstar", "Your lead becomes a star", "The lead from \"{title}\" just got cast in a huge franchise. Every interview asks about your film.", [
      ["Celebrate them publicly", { rep: 3, legacy: 1 }, "You praised them in every interview. They never forgot who gave them their first real role."],
      ["Keep the credit", { rep: -1 }, "You mentioned the film was your discovery. It sounded smaller than you meant it to."],
    ]],
    ["midnight", "A midnight screening sells out", "A repertory theater programs \"{title}\" at midnight. The show sells out in an hour.", [
      ["Show up and introduce it", { rep: 4, legacy: 2 }, "You stood in front of a packed room and told the story behind the film. They applauded before it started."],
      ["Stay home", { legacy: 1 }, "You heard about it the next day. A full house, and you missed it."],
    ]],
  ];
  // review one-liners by issue kind / strength (used by rating sites)
  const CRIT_ISSUE = {
    script: "the script is full of plot holes", pace: "the pacing drags in the middle", cast: "the performances never click", chem: "the leads share no spark",
    vfx: "the effects look unfinished", budget: "the budget shows on screen", edit: "the ending is a mess", score: "the score fights the picture",
    direction: "the direction feels overworked", weather: "continuity slips are visible", studio: "studio notes flatten the film", crew: "the production feels troubled",
  };
  const CRIT_GOOD = ["a confident, assured piece of filmmaking", "a script with real bite", "a cast firing on all cylinders", "striking visuals", "a surprise that earns its payoff", "a haunting, memorable score"];
  const AUD_GOOD = ["people cheered in the theater", "everyone wanted to see it again", "the best time at the movies in years", "a crowd-pleaser from start to end"];
  const AUD_BAD = ["people left halfway", "not worth the ticket", "the trailer promised more", "it just never grabs you"];

  // visual / tonal style: [id, name, desc, quality effects, viral, critic bias, audience bias]
  const STYLES = [
    ["grounded", "Grounded and realistic", "Natural light, real people. Critics nod, crowds shrug.", { acting: 3, script: 1 }, 0, 3, -1],
    ["stylized", "Bold and stylized", "A look people screenshot. Divisive, shareable.", { direction: 3, prod: 2 }, 4, 1, 1],
    ["handheld", "Handheld and raw", "Cheap, tense and intimate. Hard on mainstream audiences.", { acting: 2, prod: -3 }, 1, 3, -2],
    ["epic", "Epic and sweeping", "Big skies, big sets, big overruns.", { prod: 5, direction: 2 }, 0, 0, 2],
    ["crowd", "Crowd-pleaser", "Clear, fast and fun. Critics roll their eyes.", { edit: 3 }, 1, -2, 3],
  ];
  // crew tiers: key => [label, what it does, [[name, cost as % of budget], x3]]
  const CREW = {
    dp: ["Cinematographer", "Better images and calmer shoots (helps with weather and big shots).", [["A friend from film school", 0], ["A working cinematographer", 0.02], ["A legendary cinematographer", 0.06]]],
    stunt: ["Stunt team", "Fewer accidents and safer action.", [["Do it yourself", 0], ["A stunt coordinator", 0.015], ["A top stunt team", 0.04]]],
    vfx: ["Visual effects", "Matters for sci-fi, fantasy, action and animation.", [["Freelance artists", 0], ["A VFX studio", 0.04], ["A top VFX house", 0.1]]],
    editor: ["Editor", "Sets the floor for the edit.", [["Cut it yourself", 0], ["A pro editor", 0.012], ["An award-winning editor", 0.03]]],
  };
  // research and prep: [id, name, desc, cost % of budget, effect text]
  const RESEARCH = [
    ["classics", "Study the classics of the genre", "Weeks of watching and notes. Free.", 0, "Sharper direction"],
    ["scout", "Scout locations", "Real places beat sets.", 0.01, "Better production value"],
    ["consult", "Hire a story consultant", "A fresh pair of eyes on the script.", 0.015, "A tighter script"],
  ];
  // shooting plans: [id, name, desc]
  const PLANS = [
    ["fast", "Fast and loose", "Fewer shooting days. Cheaper and riskier, and the film feels rushed."],
    ["std", "Standard schedule", "A normal shoot."],
    ["perf", "Perfectionist", "More takes, more days, more surprises. Better pictures, bigger bills."],
  ];
  const BRANDS = ["Coca-Cola", "Nike", "Apple", "Samsung", "BMW", "Pepsi", "Adidas", "Rolex"];

  window.FL_DIR_DATA = { GENRES, THEMES, TWISTS, GT_GOOD, GT_BAD, GW_GOOD, PREMISES, TITLE_A, TITLE_B, FIRST, LAST, ACTORS, STUDIOS, RANKS, BUDGETS, WRITERS, SLOTS, MARKETING, SITES, COMBOS, EVENTS, POST_EVENTS, STYLES, CREW, RESEARCH, PLANS, BRANDS, CRIT_ISSUE, CRIT_GOOD, AUD_GOOD, AUD_BAD };
})();
