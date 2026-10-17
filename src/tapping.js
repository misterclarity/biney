
  /* ------------------------------- tapping -------------------------------
     A basic EFT-style round: rate how strong the feeling is, say a set-up statement
     while tapping the side of the hand, then tap down through eight points, from the
     top of the head to under the arm, with a short reminder phrase at each. Then breathe
     and rate again. The drawing is Entrain's own. Paired points can be tapped on either
     side, or both; the drawing marks the right side.
  ---------------------------------------------------------------------- */
  var TAP_PTS = [
    { id: "hand", name: "Side of the hand", where: "The fleshy outer edge of the hand, below the little finger.", x: 12, y: 224 },
    { id: "head", name: "Top of the head", where: "The crown of the head, with flat fingers.", x: 100, y: 26 },
    { id: "brow", name: "Eyebrow", where: "Where the eyebrow begins, just above the nose.", x: 93, y: 55 },
    { id: "eye", name: "Side of the eye", where: "On the bone at the outer corner of the eye.", x: 70, y: 68 },
    { id: "under", name: "Under the eye", where: "On the bone below the eye, in line with the pupil.", x: 86, y: 81 },
    { id: "nose", name: "Under the nose", where: "Between the nose and the upper lip.", x: 100, y: 95 },
    { id: "chin", name: "Chin", where: "In the crease between the lower lip and the chin.", x: 100, y: 111 },
    { id: "collar", name: "Collarbone", where: "Just below the collarbone, beside the breastbone.", x: 89, y: 157 },
    { id: "arm", name: "Under the arm", where: "On your side, about a hand's width below the armpit.", x: 48, y: 197 }
  ];
  var TAP_PT = {};
  TAP_PTS.forEach(function (p) { TAP_PT[p.id] = p; });
  var TAP_SEQ = ["head", "brow", "eye", "under", "nose", "chin", "collar", "arm"];

  function tapSVG(on, done) {
    var pts = TAP_PTS.map(function (p) {
      var cls = p.id === on ? "tp on" : (done && done.indexOf(p.id) >= 0) ? "tp done" : "tp";
      return '<g data-p="' + p.id + '"><circle class="ring' + (p.id === on ? " on" : "") + '" cx="' + p.x + '" cy="' + p.y + '" r="6"/>' +
        '<circle class="' + cls + '" cx="' + p.x + '" cy="' + p.y + '" r="5"/></g>';
    }).join("");
    return '<svg class="tapfig" viewBox="0 0 200 250" aria-hidden="true">' +
      '<path class="skin" d="M87 116 L86 134 Q62 137 50 146 Q46 151 46 160 L46 250 L154 250 L154 160 Q154 151 150 146 Q138 137 114 134 L113 116 Z"/>' +
      '<ellipse class="skin ln" cx="100" cy="71" rx="35" ry="45"/>' +
      '<path class="ln" d="M65 64 Q60 70 64 82 M135 64 Q140 70 136 82"/>' +                             // ears
      '<path class="ln thin" d="M79 58 Q87 53 95 56 M105 56 Q113 53 121 58"/>' +                         // eyebrows
      '<path class="ln thin" d="M80 68 Q86 64 92 68 Q86 71 80 68 Z M108 68 Q114 64 120 68 Q114 71 108 68 Z"/>' +   // eyes
      '<path class="ln thin" d="M100 66 L97 85 Q100 88 104 86"/>' +                                       // nose
      '<path class="ln thin" d="M90 101 Q100 106 110 101"/>' +                                            // mouth
      '<path class="ln" d="M87 116 L86 134 Q62 137 50 146 Q46 151 46 160 L46 250 M113 116 L114 134 Q138 137 150 146 Q154 151 154 160 L154 250"/>' +
      '<path class="ln thin" d="M95 148 Q76 146 60 152 M105 148 Q124 146 140 152"/>' +                   // collarbones
      '<g class="hand"><rect class="skin ln" x="12" y="210" width="26" height="28" rx="9"/>' +
      '<path class="ln fing" d="M17 210 L16 194 M23 209 L23 189 M29 209 L30 190 M35 211 L37 197 M38 226 L44 214"/></g>' +
      pts + "</svg>";
  }

  /* The phrase you choose, fitted into the set-up and reminder lines. */
  function tapPhrase() {
    var p = (store.get("tapPhrase") || "").trim().replace(/[.!?,;:]+$/, "").slice(0, 48);
    return p || "this stress";
  }
  function tapCap(t) { return t.charAt(0).toUpperCase() + t.slice(1); }
  function tapRemaining(p) {
    var m = /^(this|my|the)\s+(.*)$/i.exec(p);
    return m ? m[1].toLowerCase() + " remaining " + m[2] : "the rest of " + p;
  }
  var TAP_POS = ["I'm letting this go.", "I can feel calmer now.", "Breathing a little easier.", "I'm safe right now.",
    "Letting it soften.", "Calm and steady.", "I choose to relax.", "I accept myself, just as I am."];

  /* Steps: rate, set-up on the side of the hand, a round of eight points, a breath. */
  function TRate(title, line, o) {
    return ext({ k: "rate", secs: o && o.cap || 60, title: title, open: true, lines: [[0, line]] }, o);
  }
  function TSetup(secs, title, statement, times) {
    var lines = [[0, "Tap the side of one hand with the fingertips of the other, and say:"]];
    for (var i = 0; i < times; i++) lines.push([4 + i * Math.floor((secs - 6) / times), statement]);
    return { k: "tap", secs: secs, title: title, pts: ["hand"], per: secs, lines: lines };
  }
  function TRound(title, phrases, per, first) {
    var lead = 3, lines = [[0, first ? "Now tap about seven times on each point, saying the phrase. Start at the top of the head." : "Top of the head again."]];
    TAP_SEQ.forEach(function (id, i) {
      var p = TAP_PT[id], ph = phrases[i % phrases.length];
      lines.push([lead + i * per, (first ? p.name + ". " : "") + ph]);
    });
    return { k: "tap", secs: lead + TAP_SEQ.length * per + 1, title: title, pts: TAP_SEQ, per: per, lead: lead, lines: lines };
  }
  function TBreath(secs) {
    return { k: "guide", secs: secs, title: "Breathe", tapfig: true, lines: [[0, "Stop tapping. Take a slow, deep breath in, and let it go."]] };
  }
  function tapSteps(rounds) {
    var p = tapPhrase(), P1 = tapCap(p) + ".", rem = tapCap(tapRemaining(p)) + ".";
    var st = [
      G(40, "Get set", ["Sit comfortably. Bring to mind what's bothering you, and notice where you feel it in your body.",
        "You'll tap gently with two or three fingertips, about seven times on each point, while saying a short phrase out loud or in your head.",
        "If anything feels like too much, stop, breathe slowly, and look around the room."], { tapfig: true }),
      TRate("How strong is it?", "How strong is the feeling right now, from zero to ten? Tap a number."),
      TSetup(30, "Set-up", "Even though I have " + p + ", I deeply and completely accept myself.", 3),
      TRound("Round 1", [P1], 7, true),
      TBreath(12),
      TRate("How strong now?", "Check in again. From zero to ten, how strong is it now?"),
      TSetup(24, "Set-up, round 2", "Even though I still have some of " + p + ", I deeply and completely accept myself.", 2),
      TRound("Round 2", [rem], 7, false),
      TBreath(12)
    ];
    if (rounds >= 3) {
      st.push({ k: "guide", secs: 10, title: "A calmer round", tapfig: true, lines: [[0, "One more round, this time with phrases that point where you want to go."]] });
      st.push(TRound("Round 3", TAP_POS, 7, false));
      st.push(TBreath(12));
    }
    st.push(TRate("And now?", "One last check. From zero to ten, how strong is it now?"));
    st.push(G(30, "Closing", ["Notice how you feel. If the feeling is still strong, another round often helps, or come back to it later.",
      "Take one more slow breath before you carry on."], { tapfig: true }));
    return st;
  }
  /* A short round to finish another practice with. */
  function tapShort() {
    var p = tapPhrase();
    return [
      { k: "guide", secs: 15, title: "Tapping", tapfig: true, lines: [[0, "To finish, a short round of tapping. Bring to mind what's bothering you, in a few words: " + p + "."]] },
      TRate("How strong is it?", "From zero to ten, how strong is it right now? Tap a number."),
      TSetup(24, "Set-up", "Even though I have " + p + ", I deeply and completely accept myself.", 2),
      TRound("Tapping round", [tapCap(p) + "."], 6, true),
      TBreath(10),
      TRate("How strong now?", "And now, from zero to ten?")
    ];
  }
  /* Practices that end in sleep or are tapping already don't offer it. */
  function tapOffered(d) {
    return !d.tapping && !d.nap && !d.selfPaced && d.tags.indexOf("sleep") < 0;
  }
  function tapOn(d) { return tapOffered(d) && store.get("pTap." + d.id) === "1"; }
