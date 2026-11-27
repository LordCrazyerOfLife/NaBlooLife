/*! Copyright (c) 2026 Free Life. All rights reserved. Unauthorized copying, re-hosting or redistribution of this code is prohibited. */
(() => {
  Object.assign(CHARGES, {
    "disturbing the peace": [1, 1],
    "reckless driving": [1, 2],
    "public intoxication": [1, 1],
    theft: [1, 3],
    "resisting arrest": [1, 2],
    "unpaid fines": [1, 1],
    // the heavy ones: these are what the police charge you with once they know
    // what you actually do for a living
    "organized crime": CHARGES["organized crime"] || [10, 30],
    "criminal enterprise": CHARGES["criminal enterprise"] || [8, 25],
    racketeering: CHARGES.racketeering || [5, 20],
    conspiracy: CHARGES.conspiracy || [3, 12],
    "drug trafficking": CHARGES["drug trafficking"] || [5, 25],
    "possession with intent to distribute": CHARGES["possession with intent to distribute"] || [3, 12],
    "money laundering": CHARGES["money laundering"] || [2, 10],
    "arms trafficking": CHARGES["arms trafficking"] || [5, 25],
    "witness intimidation": CHARGES["witness intimidation"] || [2, 8],
    "obstruction of justice": CHARGES["obstruction of justice"] || [1, 5],
    "bribery of a public official": CHARGES["bribery of a public official"] || [2, 8],
  });

  const cl = (v, a = 0, b = 100) => Math.max(a, Math.min(b, Math.round(Number(v) || 0)));

  // ------------------------------------------------------------------ what they think you do
  // The charges the police reach for depend on the job you are actually running.
  const WORK = () => {
    const j = state.job || {};
    const out = [];
    const add = (...x) => x.forEach((c) => out.includes(c) || out.push(c));
    if (j.cartel || (state.myCartel && state.myCartel.founded)) add("organized crime", "drug trafficking");
    if (j.mafia) add("racketeering", "extortion");
    if (state.gangLife && state.gangLife.member) add("organized crime", "assault");
    if (state.drugEmpire) add("drug trafficking", "possession with intent to distribute");
    if (state.smuggling) add("arms trafficking");
    const l = state.launder;
    if (l && Number(l.dirty) > 0) add("money laundering");
    return out;
  };
  const works = (k) => {
    const j = state.job || {};
    if (k === "cartel") return !!(j.cartel || (state.myCartel && state.myCartel.founded));
    if (k === "mafia") return !!j.mafia;
    if (k === "gang") return !!(state.gangLife && state.gangLife.member);
    if (k === "drugs") return !!(state.drugEmpire || j.cartel || (state.myCartel && state.myCartel.founded));
    if (k === "launder") return !!(state.launder && Number(state.launder.dirty) > 0);
    if (k === "guns") return !!(state.smuggling || j.mafia || j.cartel);
    if (k === "any") return WORK().length > 0;
    return false;
  };
  const accusation = () => {
    const w = WORK();
    return w.length ? w[Math.floor(Math.random() * w.length)] : "conspiracy";
  };

  // ------------------------------------------------------------------ police heat
  // Heat is how much the police care about you. It comes from the crimes you got
  // away with here, and from whatever your crew, your job or your other businesses
  // are already carrying, so the numbers move together.
  const heatNow = () => {
    let h = cl(state.policeHeat);
    [state.myCartel, state.gangLife, state.richlife, state.cartel, state.smuggling, state.drugEmpire, state.job].forEach((s) => {
      if (s && typeof s === "object") h = Math.max(h, cl(s.heat));
    });
    return h;
  };
  const addHeat = (n) => (state.policeHeat = cl((Number(state.policeHeat) || 0) + n));
  const pressure = () => 1 + heatNow() / 90;

  const spend = (n) => {
    n = Math.max(0, Math.round(n));
    if ((Number(state.money) || 0) < n) return false;
    state.money -= n;
    try {
      renderStats();
    } catch {}
    return true;
  };

  // a choice that can end with the police at your door; the odds grow with heat
  const bust = (p, charge, msg, log, alt) => () => {
    if (chance(Math.min(0.97, p * pressure()))) {
      addHeat(rint(4, 9));
      return say(log), notice("Cops called", `${msg}<br><br>The police are on their way!`, () => arrest(typeof charge === "function" ? charge() : charge), !0);
    }
    say(alt[0]), notice(alt[1], alt[2], null, !0);
  };
  const quiet = (log, title, body, stats, heatDelta) => () => {
    stats && fx(stats, "");
    heatDelta && addHeat(heatDelta);
    say(log), notice(title, body, null, !0);
  };
  const heated = (log, title, body, heatDelta) => () => {
    heatDelta && addHeat(heatDelta);
    say(log), notice(title, body, null, !0);
  };

  const events = [
    {
      min: 16,
      icon: "emoji/1f50a.png",
      title: "Noise Complaint",
      lead: "Your neighbor is banging on your door, screaming that your music is too loud.<br><br>What will you do?",
      choices: [
        [
          "Turn it down",
          quiet(
            "I turned my music down after my neighbor complained.",
            "Peace and quiet",
            "You turned the music down. Your neighbor stormed off.",
          ),
        ],
        [
          "Tell them to get lost",
          bust(
            0.45,
            "disturbing the peace",
            "Your neighbor called the police about the noise.",
            "I told my neighbor to get lost. They called the cops.",
            [
              "I told my neighbor to get lost.",
              "Get lost",
              "You slammed the door in their face. They grumbled and went home.",
            ],
          ),
        ],
        [
          "Crank it up louder",
          bust(
            0.65,
            "disturbing the peace",
            "Your neighbor called the police about the noise.",
            "I cranked my music up louder. My neighbor called the cops.",
            [
              "I cranked my music up even louder.",
              "Party on",
              "You cranked the volume to the max. Your neighbor gave up.",
            ],
          ),
        ],
      ],
    },
    {
      min: 16,
      icon: "emoji/1f697.png",
      title: "Road Rage",
      lead: "Another driver cut you off and flipped you the bird.<br><br>What will you do?",
      choices: [
        [
          "Let it go",
          quiet(
            "Someone cut me off in traffic. I let it go.",
            "Zen master",
            "You took a deep breath and let it go.",
            { Happiness: 1 },
          ),
        ],
        [
          "Tailgate them",
          bust(
            0.35,
            "reckless driving",
            "A witness reported your license plate to the police.",
            "I tailgated a driver who cut me off. Someone reported me.",
            [
              "I tailgated a driver who cut me off.",
              "Back off",
              "You rode their bumper for a mile until they turned off.",
            ],
          ),
        ],
        [
          "Get out and confront them",
          bust(
            0.6,
            "assault",
            "The confrontation got physical and a bystander called 911.",
            "I got out of my car to confront another driver. It got physical.",
            [
              "I got out of my car to confront another driver.",
              "Words were exchanged",
              "You yelled at each other until the light turned green.",
            ],
          ),
        ],
      ],
    },
    {
      min: 10,
      icon: "emoji/1f6cd-fe0f.png",
      title: "Store Security",
      lead: "A store security guard stops you on the way out and accuses you of shoplifting.<br><br>What will you do?",
      choices: [
        [
          "Show them your receipt",
          quiet(
            "A store guard accused me of shoplifting. I showed them my receipt.",
            "All good",
            "You showed your receipt and the guard apologized.",
          ),
        ],
        [
          "Argue with the guard",
          bust(
            0.25,
            "shoplifting",
            "The guard didn't like your attitude and called the police.",
            "I argued with a store guard who accused me of shoplifting.",
            [
              "I argued with a store guard and walked out.",
              "Walked out",
              "You argued until the manager let you go.",
            ],
          ),
        ],
        [
          "Make a run for it",
          bust(
            0.7,
            "shoplifting",
            "Running made you look guilty. The guard called the police.",
            "I ran from a store guard who accused me of shoplifting.",
            [
              "I ran from a store guard and got away.",
              "Got away",
              "You sprinted out of the store and lost them in the parking lot.",
            ],
          ),
        ],
      ],
    },
    {
      min: 18,
      icon: "emoji/1f37a.png",
      title: "Bar Fight",
      lead: "A drunk guy at the bar shoves you and spills your drink.<br><br>What will you do?",
      choices: [
        [
          "Walk away",
          quiet(
            "A drunk guy at a bar shoved me. I walked away.",
            "Bigger person",
            "You walked away and finished your night somewhere else.",
          ),
        ],
        [
          "Shove him back",
          bust(
            0.45,
            "assault",
            "The bartender called the police on both of you.",
            "I got into a shoving match at a bar.",
            [
              "I shoved a drunk guy back at a bar.",
              "Shoved",
              "You shoved him back. His friends dragged him outside.",
            ],
          ),
        ],
        [
          "Throw a punch",
          bust(
            0.75,
            "assault",
            "You knocked him out cold. The bartender called the police.",
            "I punched a guy at a bar.",
            [
              "I punched a guy at a bar and slipped out the back.",
              "Slipped away",
              "You decked him and slipped out the back before anyone noticed.",
            ],
          ),
        ],
      ],
    },
    {
      min: 18,
      icon: "emoji/1f3ab.png",
      title: "Unpaid Tickets",
      lead: "You have a pile of unpaid parking tickets and the city sent a final notice.<br><br>What will you do?",
      fine: !0,
      choices: [
        ["Pay them off", null],
        [
          "Ignore it",
          bust(
            0.4,
            "unpaid fines",
            "A warrant went out for your unpaid fines.",
            "I ignored my unpaid parking tickets and a warrant went out.",
            [
              "I ignored my unpaid parking tickets.",
              "Out of sight",
              "You tossed the notice in the trash. Nothing happened... yet.",
            ],
          ),
        ],
      ],
    },
    {
      min: 16,
      icon: "emoji/1f575-fe0f.png",
      title: "Mistaken Identity",
      lead: "The police stop you on the street. You match the description of a robbery suspect.<br><br>What will you do?",
      choices: [
        [
          "Cooperate",
          bust(
            0.12,
            "theft",
            "The victim pointed at you in the lineup.",
            "The police stopped me because I matched a suspect's description.",
            [
              "The police stopped me, but cleared me after questioning.",
              "Cleared",
              "The officers checked your ID and let you go.",
            ],
          ),
        ],
        [
          "Run",
          bust(
            0.75,
            "resisting arrest",
            "The officers chased you down.",
            "I ran from the police when they stopped me.",
            ["I ran from the police and got away.", "Got away", "You ducked into an alley and lost them."],
          ),
        ],
      ],
    },
    {
      min: 12,
      icon: "emoji/1f3da-fe0f.png",
      title: "Abandoned Building",
      lead: 'You find an abandoned building with a "No Trespassing" sign hanging off the fence.<br><br>What will you do?',
      choices: [
        ["Keep walking", quiet("I walked past an abandoned building.", "Moving on", "You kept walking.")],
        [
          "Explore inside",
          bust(
            0.4,
            "trespassing",
            "A security guard spotted you and called the police.",
            "I snuck into an abandoned building.",
            [
              "I explored an abandoned building.",
              "Urban explorer",
              "You explored the building and found some cool graffiti.",
            ],
          ),
        ],
      ],
    },
    {
      min: 18,
      icon: "emoji/1f943.png",
      title: "Night Out",
      lead: "You had way too much to drink and it's time to go home.<br><br>What will you do?",
      choices: [
        [
          "Call a cab",
          quiet(
            "I took a cab home after a night of drinking.",
            "Safe ride",
            "You took a cab home and passed out on the couch.",
          ),
        ],
        [
          "Walk home singing",
          bust(
            0.35,
            "public intoxication",
            "A neighbor called the police about the drunk person singing on the street.",
            "I walked home drunk, singing at the top of my lungs.",
            ["I walked home drunk, singing.", "Encore", "You serenaded the whole street on your way home."],
          ),
        ],
        [
          "Climb a statue",
          bust(
            0.7,
            "public intoxication",
            "A crowd gathered, and someone called the police.",
            "I climbed a statue while drunk.",
            ["I climbed a statue while drunk.", "King of the hill", "You climbed the statue and took a selfie from the top."],
          ),
        ],
      ],
    },
    {
      min: 16,
      icon: "emoji/1f333.png",
      title: "Neighbor Dispute",
      lead: "Your neighbor's tree keeps dropping branches on your property and they refuse to trim it.<br><br>What will you do?",
      choices: [
        [
          "Talk it out",
          quiet(
            "I talked to my neighbor about their tree.",
            "Diplomacy",
            "You talked it out and they agreed to trim it.",
          ),
        ],
        [
          "Cut it down yourself",
          bust(
            0.5,
            "vandalism",
            "Your neighbor called the police when they saw the stump.",
            "I cut down my neighbor's tree.",
            [
              "I cut down my neighbor's tree.",
              "Timber!",
              "You cut it down. Your neighbor is furious, but did nothing.",
            ],
          ),
        ],
        [
          "Key their car",
          bust(
            0.6,
            "vandalism",
            "Their doorbell camera caught you in the act.",
            "I keyed my neighbor's car.",
            ["I keyed my neighbor's car.", "Petty", "You left a long scratch down the side. Nobody saw."],
          ),
        ],
      ],
    },
    {
      min: 10,
      icon: "emoji/1f45b.png",
      title: "Lost Wallet",
      lead: "You find a wallet stuffed with cash on the sidewalk.<br><br>What will you do?",
      wallet: !0,
      choices: [
        [
          "Return it",
          quiet(
            "I returned a lost wallet to its owner.",
            "Good Samaritan",
            "You returned the wallet. The owner was very grateful.",
            { Happiness: 3 },
          ),
        ],
        ["Keep the cash", null],
      ],
    },

    // ---------------------------------------------------------------- heat events
    // Below this line the police already know who you are. These only show up above
    // a certain heat, and they are the ones that charge you with what you really do.
    {
      min: 16,
      minHeat: 15,
      icon: "emoji/1f6d1.png",
      title: "The computer had a lot to say about you",
      lead: "A cruiser pulls out behind you at a red light and runs your plates. The officer walks up with one hand resting on his belt and asks you to step out of the car.<br><br>What will you do?",
      choices: [
        [
          "Step out, hands where he can see them",
          bust(
            0.35,
            accusation,
            "The warrant check came back with your name on it.",
            "The police pulled me over and the warrant check did not come back clean.",
            [
              "The police pulled me over and let me go with a warning.",
              "Warning",
              "The officer wrote you a ticket and told you to fix your taillight.",
            ],
          ),
        ],
        [
          "Ask what this is about and refuse the search",
          bust(
            0.5,
            "obstruction of justice",
            "You refused the search and the officer called for a supervisor.",
            "I refused a search at a traffic stop and it turned into a circus.",
            ["I refused a search at a traffic stop.", "Know your rights", "You argued until the supervisor told him to let you go."],
          ),
        ],
        [
          "Drive",
          bust(
            0.7,
            "resisting arrest",
            "You ran the light and half the precinct joined the chase.",
            "I ran from a traffic stop.",
            ["I ran from a traffic stop and got away.", "Gone", "You lost them between two exits and slept in your own bed."],
          ),
        ],
      ],
    },
    {
      min: 18,
      minHeat: 25,
      jobs: ["any"],
      icon: "emoji/1f575-fe0f.png",
      title: "Two detectives have been asking about you",
      lead: "The same two men have been in the diner across from your place all week. The waitress says they keep showing your photo and asking the same three questions about your job.<br><br>What will you do?",
      choices: [
        [
          "Pay the crew to keep their mouths shut ($25,000)",
          () => {
            if (!spend(25000))
              return notice(
                "Flat broke",
                "You cannot even afford silence, which is the worst way for a man under investigation to find out he is broke.",
                null,
                !0,
              );
            addHeat(-14);
            say("I paid my people to keep quiet. Nobody in this business charges that much for silence unless they are thinking about selling it.");
            notice("Bought some quiet", "The detectives keep showing your photo around. The answers get shorter and less useful.", null, !0);
          },
        ],
        [
          "Have your lawyer call them",
          bust(
            0.2,
            accusation,
            "The detectives took the phone call as a reason to get a subpoena.",
            "I had my lawyer call the detectives asking about me.",
            ["My lawyer called the detectives.", "Lawyered up", "The detectives move on to somebody with fewer lawyers and worse manners."],
          ),
        ],
        [
          "Ignore them completely",
          heated(
            "I ignored two detectives asking about me. They noticed.",
            "Under surveillance",
            "The questions stop being questions. Now they are just photographs of your car.",
            8,
          ),
        ],
      ],
    },
    {
      min: 18,
      minHeat: 35,
      jobs: ["drugs", "cartel", "guns"],
      icon: "emoji/1f6a8.png",
      title: "They found the stash house",
      lead: "Four cars pull up outside at five in the morning. Nobody knocks like that unless they already know what is inside.<br><br>What will you do?",
      choices: [
        [
          "Open the door and say nothing",
          bust(
            0.55,
            accusation,
            "They found the product, the scale and your fingerprints on the scale.",
            "The police raided the stash house and I said nothing.",
            ["The police searched the house and found nothing they could charge me with.", "Nothing on me", "They tore the place apart and left with a broken door and an apology nobody meant."],
          ),
        ],
        [
          "Pay them on the spot ($60,000)",
          () => {
            if (!spend(60000))
              return notice("Flat broke", "Sixty thousand dollars does not exist in your pocket right now.", null, !0);
            bust(
              0.3,
              "bribery of a public official",
              "The detective took your envelope, wrote down the serial numbers and radioed it in.",
              "I tried to bribe the raid team with sixty thousand dollars.",
              ["I bribed the raid team and they drove away.", "Envelope", "The cars pull out one by one. The last one takes your money and your dignity."],
            )();
          },
        ],
        [
          "Out the back window",
          bust(
            0.6,
            "resisting arrest",
            "You made it to the alley and ran straight into the second car.",
            "I jumped out the back window during a raid.",
            ["I went out the back window and made it three blocks.", "Rooftops", "You go over two fences and through a yard. The dogs are the only ones who see you."],
          ),
        ],
      ],
    },
    {
      min: 18,
      minHeat: 30,
      jobs: ["launder"],
      icon: "emoji/1f9fe.png",
      title: "A bank examiner flagged your accounts",
      lead: "Three deposits in a row came from businesses that do not sell anything and do not seem to want to. The examiner wants to know how a man with your salary owns a house like that.<br><br>What will you do?",
      choices: [
        [
          "Bring in an accountant and real paperwork",
          bust(
            0.25,
            "money laundering",
            "The accountant's paperwork had a signature that did not exist.",
            "I sent an accountant to explain my accounts to a bank examiner.",
            ["My accountant explained the deposits well enough.", "Paper trail", "The examiner closes the file. The accountant sends a bill that almost justifies the deposit."],
          ),
        ],
        [
          "Move everything to cash and close the accounts",
          heated(
            "I closed the accounts and moved everything to cash before the examiner finished reading.",
            "Cash only",
            "The file stays open. So does the curiosity.",
            6,
          ),
        ],
        [
          "Lean on the examiner",
          bust(
            0.5,
            "obstruction of justice",
            "The examiner reported the visit before you finished the sentence.",
            "I paid a visit to the bank examiner who flagged my accounts.",
            ["I paid a visit to the bank examiner.", "Bad idea, good result", "The examiner suddenly finds thirty reasons to close the file."],
          ),
        ],
      ],
    },
    {
      min: 18,
      minHeat: 45,
      jobs: ["any"],
      icon: "emoji/2696-fe0f.png",
      title: "A grand jury is building a case",
      lead: "Subpoenas went out to three people who work for you, and the district attorney has started using the word enterprise in front of cameras.<br><br>What will you do?",
      choices: [
        [
          "Cooperate and give them somebody else",
          () => {
            addHeat(-28);
            say("I sat in a room with a prosecutor and gave them a name. Not a big name, but a real one, and it bought me a year.");
            notice("Deal on the table", "The case loses its shape. So does your reputation with the people who used to trust you.", null, !0);
          },
        ],
        [
          "Fight it with lawyers ($120,000)",
          () => {
            if (!spend(120000))
              return notice("Flat broke", "A defense like this costs $120,000 and you do not have it.", null, !0);
            bust(
              0.3,
              accusation,
              "The judge let the wiretaps in, and the wiretaps were not kind.",
              "I fought a grand jury with a very expensive lawyer.",
              ["My lawyers buried the grand jury in motions.", "Due process", "The case stalls for years. So does your life."],
            )();
          },
        ],
        [
          "Ignore the subpoena",
          bust(
            0.55,
            "organized crime",
            "The judge issued a bench warrant for the man who would not answer a subpoena.",
            "I ignored a grand jury subpoena.",
            ["I ignored a grand jury subpoena and nothing happened.", "Bold", "Weeks pass. Nobody knocks. You start sleeping with one eye open anyway."],
          ),
        ],
      ],
    },
    {
      min: 18,
      minHeat: 55,
      icon: "emoji/1f4de.png",
      title: "Your calls sound different lately",
      lead: "A contact at the phone company says there is a tap on your line and a room full of people listening to your mother complain about her knee.<br><br>What will you do?",
      choices: [
        [
          "New phones, new numbers, new words",
          quiet(
            "I changed every phone in the operation after a tip about a wiretap.",
            "Off the line",
            "Two weeks of silence. The room with the headphones gets very bored.",
            null,
            -12,
          ),
        ],
        [
          "Feed them a fake shipment",
          bust(
            0.3,
            "obstruction of justice",
            "They followed the fake load and found the real one on the way back.",
            "I fed the wiretap a fake shipment.",
            ["I fed the wiretap a fake shipment.", "Nice try", "Six agents spend a night in a warehouse full of wet cardboard."],
          ),
        ],
        [
          "Keep talking like nothing is happening",
          heated(
            "I kept using the tapped line because changing habits looks like guilt.",
            "Business as usual",
            "Every word is written down, dated and filed.",
            10,
          ),
        ],
      ],
    },
    {
      min: 18,
      minHeat: 65,
      jobs: ["any"],
      icon: "emoji/1f441-fe0f.png",
      title: "Somebody is talking to the DA",
      lead: "A witness saw something last year, and the district attorney now has a name, a statement and a photo of your car.<br><br>What will you do?",
      choices: [
        [
          "Pay for silence ($80,000)",
          () => {
            if (!spend(80000))
              return notice("Flat broke", "Silence costs $80,000 today and you are short.", null, !0);
            bust(
              0.35,
              "witness intimidation",
              "The witness took the money, then took it to the police.",
              "I paid a witness to stay quiet.",
              ["I paid a witness to stay quiet.", "Paid", "The statement gets vaguer every time they read it back to him."],
            )();
          },
        ],
        [
          "Have a serious talk with him",
          bust(
            0.65,
            "witness intimidation",
            "He was wearing a wire the whole time.",
            "I had a serious talk with the witness.",
            ["I had a serious talk with the witness.", "Understood", "He decides he remembers less than he thought."],
          ),
        ],
        [
          "Let the lawyers handle the witness",
          bust(
            0.4,
            accusation,
            "The witness testified, and he testified well.",
            "I let my lawyers deal with the witness against me.",
            ["My lawyers dealt with the witness.", "Cross-examination", "The lawyer makes him look like a liar, and the jury half believes it."],
          ),
        ],
      ],
    },
    {
      min: 18,
      minHeat: 75,
      jobs: ["any"],
      icon: "emoji/1f576-fe0f.png",
      title: "The new guy is not who he says he is",
      lead: "He asked the wrong question about the lab twice, his truck has a government plate and he has never once complained about the pay.<br><br>What will you do?",
      choices: [
        [
          "Confront him quietly, alone",
          bust(
            0.55,
            accusation,
            "He showed you a badge and a radio before you finished the question.",
            "I confronted a man I was sure was undercover.",
            ["I confronted a man I was sure was a cop.", "Wrong guy", "He cries, honestly and at length. He is just weird about money."],
          ),
        ],
        [
          "Cut him loose without a word",
          heated(
            "I sent the new guy home and never called him again.",
            "Ghosted",
            "He goes back to a desk and writes a report about the man who never slipped up.",
            4,
          ),
        ],
        [
          "Give him a job far away from the lab",
          bust(
            0.25,
            "obstruction of justice",
            "He kept notes on the drive and filed them the same night.",
            "I moved a man I suspected was undercover to a different job.",
            ["I moved the suspicious new guy to a warehouse job.", "Out of sight", "He spends a year counting boxes and learning nothing."],
          ),
        ],
      ],
    },
    {
      min: 18,
      minHeat: 85,
      jobs: ["any"],
      icon: "emoji/1f3db-fe0f.png",
      title: "The FBI has a file with your name on it",
      lead: "They call it a criminal enterprise. The file is thick, and there are photographs in it you have never seen and alibis in it you cannot explain.<br><br>What will you do?",
      choices: [
        [
          "Turn yourself in and take the deal",
          () => {
            addHeat(-40);
            say("I walked into a federal building with a lawyer on each side and gave them what they wanted.");
            notice("Cooperation", "You lose the business. You keep the rest of your life, which is a trade most men in your position never get.", () => arrest("criminal enterprise"), !0);
          },
        ],
        [
          "Fight it in court ($200,000)",
          () => {
            if (!spend(200000))
              return notice("Flat broke", "The kind of lawyer who wins against the federal government does not work for free.", null, !0);
            bust(
              0.5,
              "criminal enterprise",
              "The jury took four hours and asked for the wiretaps one more time.",
              "I took the federal government to court.",
              ["I beat a federal case in court.", "Not guilty", "The jury acquits you on everything that mattered. The file stays open."],
            )();
          },
        ],
        [
          "Burn it all and disappear",
          bust(
            0.45,
            "criminal enterprise",
            "They were watching the airport, not the road.",
            "I burned the operation and disappeared.",
            ["I burned the operation and disappeared.", "Gone", "You sell everything that fits in a truck and drive until the plates change twice."],
          ),
        ],
      ],
    },
  ];

  function weighted(pool, heat) {
    const w = pool.map((e) => (e.minHeat ? 1 + heat / 30 : 1));
    let roll = Math.random() * w.reduce((a, b) => a + b, 0);
    for (let i = 0; i < pool.length; i++) {
      roll -= w[i];
      if (roll <= 0) return pool[i];
    }
    return pool[pool.length - 1];
  }

  function run() {
    const heat = heatNow();
    const pool = events.filter(
      (e) => state.age >= e.min && (!e.minHeat || heat >= e.minHeat) && (!e.jobs || e.jobs.some(works)),
    );
    if (!pool.length) return;
    const ev = weighted(pool, heat);
    const choices = ev.choices.map(([label, fn]) => [label, fn || null]);
    if (ev.fine) {
      const cost = Math.round(localPrice(rint(150, 900)));
      choices[0] = [
        `Pay them off (${usd(cost)})`,
        () => {
          if (state.money < cost) return notice("Flat broke", "You can't afford to pay your tickets.", null, !0);
          (state.money -= cost),
            renderStats(),
            say(`I paid off ${usd(cost)} in parking tickets.`),
            notice("Paid up", `You paid ${usd(cost)} in parking tickets.`, null, !0);
        },
      ];
    }
    if (ev.wallet) {
      const cash = Math.round(localPrice(rint(40, 600)));
      choices[1] = [
        "Keep the cash",
        () => {
          (state.money += cash),
            renderStats(),
            bust(
              0.25,
              "theft",
              "The owner tracked you down with a security camera and called the police.",
              `I kept ${usd(cash)} from a wallet I found.`,
              [`I kept ${usd(cash)} from a wallet I found.`, "Finders keepers", `You pocketed ${usd(cash)}.`],
            )();
        },
      ];
    }
    jCard({
      tag: heat >= 70 ? "FBI" : heat >= 40 ? "Task force" : "Police",
      iconSrc: ev.icon,
      title: ev.title,
      lead: ev.lead,
      surprise: !0,
      ...(heat ? { bars: [["Police heat", heat]] } : {}),
      choices,
    });
  }

  ageBtnEl.addEventListener("click", () => {
    if (state.dead || state.age < 10) return;
    // one year of distance from whatever you did; doing time means a lot of distance
    addHeat(state.prison ? -25 : -5);
    if (state.prison) return;
    chance(0.07 + heatNow() / 900) && queueRoll(run);
  }),
    (window.POLICE_EVENTS = { run, heat: heatNow, addHeat, EVENTS: events });
})();
