  /* ------------------------------- the voice -------------------------------
     Four practices for your own voice, from the brain-wave guide (practice-data.js holds their entries;
     each is a new technique, sup: true):
       Om Chanting     A-U-M on a long breath out, the M a closed-mouth hum; aloud, then softer, then
                       in your mind, then silence; an optional low drone to chant with
       Laughter Break  laughter on purpose: a clapping warm-up to a ho-ho-ha-ha-ha tick, short bouts of
                       playful laughter with slow breaths between, your mood before and after
       Let It Out      rounds of "ow", a shout, a word of your own or the made-up words from a swearing
                       study, said on a tick every three seconds in a steady, clear voice, each round
                       followed by long breaths out; or Roar it out, animal sounds just for fun
       Sing Together   a humming warm-up and vowels, then two traditional rounds (Frère Jacques and Row,
                       Row, Row Your Boat): listened to, sung together, then sung as a round, with the
                       words on the screen and a soft synthesised tune and drone at a steady tempo
     This file holds their steps, the songs, and the sound and screen of a "sing" step: the tune and its
     count-in are scheduled ahead on the audio clock (like the cadence tick), through a gain of their
     own that a pause, a skip or I need to stop silences at once; the drone is a low D with its fifth,
     made on the device. The tune leads the first part of a round, and when that part has sung its last,
     the part still singing, so the last group is never left on its own.
  ------------------------------------------------------------------------------ */

  /* Songs: phrases of notes [MIDI note (69 = A4, 440 Hz; 0 a rest), length in beats, the syllable sung].
     A round's parts come in one phrase (two bars) apart. Both rounds are in D major, over the same
     drone. Frère Jacques is in 4/4, a beat a crotchet; Row, Row, Row Your Boat in 6/8, a beat a quaver,
     with the count-in on each dotted crotchet. Both are traditional, and free for anyone to sing. */
  var VX_SONGS = {
    frere: { name: "Frère Jacques", short: "Frère Jacques", bpm: 88, cb: 1, count: 4, ph: [
      [[62, 1, "Are"], [64, 1, "you"], [66, 1, "sleep-"], [62, 1, "ing,"], [62, 1, "are"], [64, 1, "you"], [66, 1, "sleep-"], [62, 1, "ing,"]],
      [[66, 1, "Bro-"], [67, 1, "ther"], [69, 2, "John?"], [66, 1, "Bro-"], [67, 1, "ther"], [69, 2, "John?"]],
      [[69, 0.5, "Mor-"], [71, 0.5, "ning"], [69, 0.5, "bells"], [67, 0.5, "are"], [66, 1, "ring-"], [62, 1, "ing,"],
        [69, 0.5, "mor-"], [71, 0.5, "ning"], [69, 0.5, "bells"], [67, 0.5, "are"], [66, 1, "ring-"], [62, 1, "ing:"]],
      [[62, 1, "ding,"], [57, 1, "dang,"], [62, 2, "dong."], [62, 1, "Ding,"], [57, 1, "dang,"], [62, 2, "dong."]]
    ] },
    row: { name: "Row, Row, Row Your Boat", short: "Row Your Boat", bpm: 160, cb: 3, count: 4, ph: [
      [[62, 3, "Row,"], [62, 3, "row,"], [62, 2, "row"], [64, 1, "your"], [66, 3, "boat,"]],
      [[66, 2, "gent-"], [64, 1, "ly"], [66, 2, "down"], [67, 1, "the"], [69, 6, "stream."]],
      [[74, 1, "Mer-"], [74, 1, "ri-"], [74, 1, "ly,"], [69, 1, "mer-"], [69, 1, "ri-"], [69, 1, "ly,"],
        [66, 1, "mer-"], [66, 1, "ri-"], [66, 1, "ly,"], [62, 1, "mer-"], [62, 1, "ri-"], [62, 1, "ly,"]],
      [[69, 2, "life"], [67, 1, "is"], [66, 2, "but"], [64, 1, "a"], [62, 6, "dream."]]
    ] },
    // the warm-up: five notes up and down on each vowel, then a breath
    scale: { name: "Vowels", short: "Vowels", bpm: 88, cb: 1, count: 4, ph: ["Mah", "May", "Mee", "Moh", "Moo"].map(function (v) {
      return [62, 64, 66, 67, 69, 67, 66, 64].map(function (m) { return [m, 1, v]; }).concat([[62, 2, v], [0, 2, ""]]);
    }) }
  };
  var VX_TEMPO = { slow: 0.82, usual: 1 };       // Slower, for learning a song
  var VX_DRONE = [[73.42, 0.05], [146.83, 0.07], [220, 0.045]];   // D2, D3 and A3, triangle waves under a soft low-pass

  /* The sound and the screen of the voice practices: the bus, the gain the tune's notes go through (made
     fresh after each hush), the drone while it plays, the next event to schedule in the step, and what the
     words on the screen last showed. */
  var VX = { bus: null, g: null, dr: null, next: 0, ev: null, evFor: null, shown: "" };

  /* ----- the songs, worked out once ----- */
  function vxHz(m) { return 440 * Math.pow(2, (m - 69) / 12); }
  // the song's notes in one list, each with its phrase, its place in the phrase and its first beat
  function vxSong(id) {
    var S = VX_SONGS[id];
    if (!S.notes) {
      var b = 0;
      S.notes = [];
      S.ph.forEach(function (ph, p) { ph.forEach(function (n, i) { S.notes.push({ p: p, i: i, b0: b, b: n[1], m: n[0] }); b += n[1]; }); });
      S.len = b;
      S.entry = S.ph[0].reduce(function (a, n) { return a + n[1]; }, 0);      // a round's parts come in a phrase apart
    }
    return S;
  }
  function vxBl(s) { return 60 / s.bpm; }                                       // seconds a beat
  function vxT0(s) { return s.lead + s.count * VX_SONGS[s.song].cb * vxBl(s); }   // when the song starts, after the words and the count-in
  function vxPartAt(s, p) { return vxT0(s) + p * vxSong(s.song).entry * vxBl(s); }
  function vxEnd(s) { var S = vxSong(s.song); return vxT0(s) + ((s.parts - 1) * S.entry + s.reps * S.len) * vxBl(s); }
  // where part p is at st seconds into the step: waiting (b beats to go), singing (phrase, note, time through) or done
  function vxPos(s, st, p) {
    var S = vxSong(s.song), x = (st - vxPartAt(s, p)) / vxBl(s);
    if (x < 0) return { st: "wait", b: -x };
    if (x >= s.reps * S.len) return { st: "done" };
    var r = Math.floor(x / S.len), y = x - r * S.len, n = S.notes[0];
    for (var i = S.notes.length - 1; i >= 0; i--) if (y >= S.notes[i].b0 - 1e-9) { n = S.notes[i]; break; }
    return { st: "on", r: r, p: n.p, i: n.i };
  }

  /* A step that sings: the words said first (lead), a count-in, then the song reps times through, in
     unison, or as a round of `parts` parts. o: reps, parts, tempo, guide ("both" tune and drone, "tune",
     "words" only), who ("group", or "solo": the phone sings the first part and you the second). */
  function vxSing(song, mode, title, line, o) {
    var S = vxSong(song);
    var s = { k: "sing", song: song, mode: mode, title: title, reps: o.reps || 1, parts: o.parts || 1, lead: o.lead || 6, count: S.count,
      bpm: Math.round(S.bpm * (VX_TEMPO[o.tempo] || 1)), tune: o.guide !== "words", drone: o.guide === "both", who: o.who || "group", lines: [[0, line]] };
    s.secs = Math.ceil(vxEnd(s) + 1.5);
    return s;
  }

  /* ----- Om Chanting ----- */
  // the breath out (E seconds) after four seconds in; whole breaths, so each part begins on a breath in
  function omSteps(d, min) {
    min = min || 10;
    var E = +pChoice(d, "breath") || 10, cyc = 4 + E, T = min * 60, drone = pChoice(d, "drone") === "on";
    var intro = min <= 5 ? 45 : 60, quiet0 = min <= 5 ? 35 : min <= 10 ? 50 : 70;
    var n = Math.floor((T - intro - quiet0 - 3) / cyc), w = min <= 5 ? [0.65, 0] : [0.5, 0.25];
    var n1 = Math.max(2, Math.round(n * w[0])), n2 = w[1] ? Math.max(2, Math.round(n * w[1])) : 0, n3 = n - n1 - n2;
    var quiet = T - intro - 3 - n * cyc, t = { inh: 4, sip: 0, hold: 0, exh: E, rest: 0 }, a1 = 3 + n1 * cyc;
    var within = function (secs, lines) { return lines.filter(function (l) { return l[0] < secs - 1; }); };
    var st = [G(intro, "How to chant", ["Sit tall and comfortable, and close your eyes if you like.",
      "Om is three sounds on one breath out: an open Aaa, a rounded Uuu, then Mmm, a hum with the lips closed.",
      "Give the Mmm about half the breath. Chant low and easy, at a pitch that feels natural.",
      drone ? "A soft drone plays: chant on its note, or any note that sits easily with it." : "Any comfortable note will do."], { drone: drone, vis: "glow" })];
    st.push(Br(a1, "Om, aloud", t, { drone: drone, labels: { "in": "Breathe in", out: "Aaa-uuu-mmm" },
      hints: { "in": "Quietly, through the nose.", out: "Open Aaa, round Uuu, then a long Mmm with the lips closed." },
      lines: within(a1, [[0, "Breathe in through the nose, then chant on the long breath out: Aaa, uuu, mmm."],
        [3 + 2 * cyc, "Give the Mmm the longest part, and feel it buzz in your lips, nose and head."],
        [3 + 5 * cyc, "Let each chant fill the whole breath out, and the next breath in come by itself."]]) }));
    if (n2) st.push(Br(n2 * cyc, "Om, softer", t, { drone: drone, labels: { "in": "Breathe in", out: "Aum, softly" },
      hints: { "in": "Quietly, through the nose.", out: "Half as loud, the hum still buzzing." },
      lines: [[0, "Now softer, about half as loud, the hum still buzzing."]] }));
    st.push(Br(n3 * cyc, "Om in your mind", t, { labels: { "in": "Breathe in", out: "Om, silently" },
      hints: { "in": "Quietly, through the nose.", out: "Hear it inside you, on the long breath out." },
      lines: within(n3 * cyc, [[0, "Now silently: hear Om in your mind on each long breath out."],
        [2 * cyc, "If your mind wanders, come back to the sound you hear inside."]]) }));
    st.push(G(quiet, "Silence", [[0, "Let the sound go, and sit in the silence after it."],
      [frac(quiet, 0.35), "Notice the stillness, and any buzz that lingers in your face and head."], [quiet - 10, "When you're ready, open your eyes."]], { vis: "still" }));
    return st;
  }

  /* ----- Laughter Break ----- */
  // the bouts: a title, and its lines on your own and with others
  var LGH_BOUTS = [
    ["Greeting laughter", ["Greet the room, or yourself in a mirror, with a laugh instead of a hello: wave, and laugh.", "Let the laugh grow a little with each wave."],
      ["Greet each other with a laugh instead of a hello: shake hands, wave, and laugh.", "Look each other in the eye, and let the laughter spread."]],
    ["Smile to a giggle", ["Start with a big smile. Let it grow into a giggle, then a chuckle.", "Let your shoulders bounce with it.", "Very good, very good, yay!"]],
    ["Milkshake laughter", ["Hold two imaginary glasses. Pour from one into the other with a long eee…", "…then drink it down in one go, and burst out laughing.", "Once more: pour, eee, drink, and laugh."]],
    ["Silent laughter", ["Laugh with your mouth wide open and no sound at all.", "Shake with it: shoulders, belly, the whole body.", "Then let the sound come back in, as loud as you like."]],
    ["Phone laughter", ["Hold an imaginary phone to your ear: someone has told you the funniest thing.", "Laugh at it, walk about, and nod along.", "Tell the room what they said, and laugh again."],
      ["Hold an imaginary phone to your ear: someone has told you the funniest thing.", "Laugh at it, walk about, and nod along.", "Show each other what they said, and laugh together."]],
    ["Hearty laughter", ["Arms up to the sky, head back a little, and laugh from the heart.", "Let it come from deep in the belly: ha ha ha.", "Very good, very good, yay!"]]
  ];
  function lghSteps(d, min) {
    min = min || 10;
    var T = min * 60, mood = pChoice(d, "mood") === "on", grp = pChoice(d, "who") === "group", short = min <= 5;
    var arrive = short ? 15 : 20, rate = short ? 25 : 30, clap = short ? 30 : 45, brk = 20, slow = short ? 40 : 70;
    var bouts = short ? [LGH_BOUTS[0], LGH_BOUTS[2], LGH_BOUTS[5]] : LGH_BOUTS, nb = bouts.length;
    var fixed = arrive + clap + (nb - 1) * brk + slow + (mood ? 2 * rate : 0);
    var bout = Math.floor((T - fixed - 30) / nb / 5) * 5, close = T - fixed - nb * bout;
    var t46 = { inh: 4, sip: 0, hold: 0, exh: 6, rest: 0 };
    var mr = function (title, line) {               // the same 0 to 10 scale before and after, set side by side at the end
      return TRate(title, line, { cap: rate, ends: ["Very low", "As good as it gets"], sub: "0 is very low, 10 is as good as it gets" });
    };
    var st = [G(arrive, "Arrive", ["Stand or sit tall, with a little room around you.",
      grp ? "Face each other, so you can see each other laugh." : "If there's a mirror nearby, face it: laughing at yourself works too.",
      "Laughter here is an exercise: fake it, and it often turns real."], { vis: "glow" })];
    if (mood) st.push(mr("How's your mood?", "Before you start: how is your mood right now, from zero to ten? Tap a number."));
    st.push(G(clap, "Clap and chant", [[0, "Clap with the tick: one, two, one, two, three. Ho, ho, ha ha ha."],
      [frac(clap, 0.4), "Keep clapping, and chant it with the claps: ho, ho, ha ha ha."], [frac(clap, 0.75), "Bigger now, and smile as you clap."]],
      { metro: 200, metroPat: "x.x.xxx.", metroAt: 6, vis: "beat", sub: "Ho, ho, ha ha ha" }));
    bouts.forEach(function (b, i) {
      st.push(G(bout, b[0], grp && b[2] ? b[2] : b[1], { vis: "glow" }));
      if (i < nb - 1) st.push(Br(brk, "Breathe", t46, { lines: [[0, "Breathe in through the nose, and out slowly through the mouth."]] }));
    });
    st.push(Br(slow, "Slow breaths", t46, { lines: [[0, "Now let the laughter settle. Slow breaths: in through the nose, and a long breath out."],
      [frac(slow, 0.55), "Notice your face, your chest and your belly."]] }));
    if (mood) st.push(mr("And now?", "And now: how is your mood, from zero to ten?"));
    st.push(G(close, "Closing", [[0, "Notice how you feel now: your face, your chest, your breath."], [frac(close, 0.5), "Take that lightness with you."]], { vis: "glow" }));
    return st;
  }

  /* ----- Let It Out ----- */
  // what's said on each tick: the first round, then the others
  var LIO_SAY = {
    ow: ["Ow", "On each tick, say “ow”: steady and clear, from the belly.", "Again: “ow” on each tick, and let a little more go each time."],
    shout: ["Shout", "On each tick, one short, strong shout from the belly: “Ha!”", "Again: “Ha!” on each tick, from the belly."],
    word: ["Your word", "Choose a word that lets it out, a swear word if you like, and say it on each tick: steady and clear.", "Again: your word on each tick, steady and clear."]
  };
  // Roar it out: animal sounds on long, forceful breaths out (title, the timings, what to do, the breath out's word and hint)
  var LIO_ROAR = [
    ["Lion's breath", { inh: 4, sip: 0, hold: 0, exh: 5, rest: 1 }, "Lion's breath: breathe in through the nose, then open your mouth wide, stick out your tongue, and breathe out a long, forceful haaa.",
      "Haaa", "Mouth wide, tongue out, eyes wide: a long, forceful haaa."],
    ["Wolf howl", { inh: 4, sip: 0, hold: 0, exh: 6, rest: 2 }, "Wolf howl: tip your head back and howl on the breath out, a long aaa-ooo that rises and falls.",
      "Aaa-ooo", "Head back: a long howl that rises and falls."],
    ["Owl hoots", { inh: 3, sip: 0, hold: 0, exh: 5, rest: 2 }, "Owl hoots: soft and round, hoo, hoo-hoo, one after another on the breath out.",
      "Hoo, hoo-hoo", "Soft and round, one after another."]
  ];
  function lioSteps(d, min) {
    min = min || 5;
    var snd = pChoice(d, "sound"), after = pChoice(d, "when") === "after", short = min <= 3, T = min * 60;
    var n = short ? 3 : 4, set = short ? 15 : 25, rnd = short ? 20 : 25, out = short ? 30 : 35, close = T - set - n * (rnd + out);
    var st = [G(set, "Get set", [after ? "Stand or sit tall, somewhere your voice is welcome." : "Stand tall, feet planted, somewhere your voice is welcome.",
      snd === "roar" ? "This one is play: animal sounds on long, forceful breaths out, just for fun." : "A few short rounds of your voice, each followed by long breaths out. Steady and clear; loud is optional.",
      after ? "Let the stress of the moment move out through your voice." : "This is about letting go of holding back, ready for your workout."].slice(0, short ? 2 : 3), { vis: "glow" })];
    for (var i = 0; i < n; i++) {
      if (snd === "roar") {
        var R = LIO_ROAR[i % LIO_ROAR.length];
        st.push(Br(rnd, R[0], R[1], { labels: { "in": "Breathe in", out: R[3], rest: "Rest" }, hints: { "in": "Through the nose.", out: R[4] }, lines: [[0, R[2]]] }));
      } else if (snd === "made") {
        var tw = i % 2 === 1;
        st.push(G(rnd, tw ? "Twizpipe" : "Fouch", [[0, i === 0 ? "On each tick, say the made-up word “fouch!”: steady and clear." : tw ? "Now the other made-up word, “twizpipe!”, on each tick." : "“Fouch!” again on each tick."]],
          { metro: 20, metroAt: 5, vis: "beat", sub: "On each tick" }));
      } else {
        var W = LIO_SAY[snd] || LIO_SAY.shout;
        st.push(G(rnd, W[0], [[0, i === 0 ? W[1] : W[2]]], { metro: 20, metroAt: 5, vis: "beat", sub: "On each tick" }));
      }
      st.push(Br(out, "Long breaths out", { inh: 4, sip: 0, hold: 0, exh: 8, rest: 0 }, { labels: { out: "Long breath out" },
        lines: [[0, i ? "Long breaths out again." : after ? "Now long, slow breaths out. Let a little more go with each one." : "Now long breaths out. Let your shoulders drop, and stay switched on."]] }));
    }
    st.push(G(close, after ? "Settle" : "Ready", after ? ["Notice how you feel now.", "Let your breath settle at its own pace."]
      : ["Shake out your arms and legs.", "Take that energy into your warm-up."], { vis: "glow" }));
    return st;
  }

  /* ----- Sing Together ----- */
  function sngSteps(d, min) {
    min = min || 10;
    var T = min * 60, grp = pChoice(d, "who") !== "solo", parts = grp ? +pChoice(d, "parts") || 2 : 2, guide = pChoice(d, "guide");
    var o = { tempo: pChoice(d, "tempo"), guide: guide, who: grp ? "group" : "solo" }, songs = pChoice(d, "song") === "both" ? ["frere", "row"] : [pChoice(d, "song")];
    var x = function (more) { var r = {}; ext(r, o); return ext(r, more); };
    var groups = ["", "", "two", "three", "four"][parts], words = guide === "words";
    var roundLine = grp ? "Split into " + groups + " groups. Group one starts with the phone; each group comes in as the one before reaches its second line."
      : "The phone sings first. Come in when it reaches the second line, and keep going to the end.";
    var round = function (id, reps, again) {
      // on your own, the phone sings its part of the round even with the words alone: it's your partner
      return vxSing(id, "round", VX_SONGS[id].short + (again ? ": once more" : ", a round"), again ? "Once more as a round: the same groups, the same order." : roundLine,
        x({ reps: reps, parts: parts, guide: !grp && words ? "tune" : guide }));
    };
    var st = [G(25, "Gather", [grp ? "Gather round, close enough to hear each other, with the phone in the middle and its volume up." : "Stand or sit tall, with the phone in front of you and its volume up.",
      grp ? "You'll warm up with a hum, then learn each round and sing it together." : "You'll warm up with a hum, then learn each round and sing it with the phone as your partner."], { vis: "glow" })];
    st.push(Br(60, "Humming warm-up", { inh: 3, sip: 0, hold: 0, exh: 7, rest: 0 }, { drone: guide === "both", labels: { "in": "Breathe in", out: "Hum" },
      hints: { "in": "Through the nose.", out: "Lips closed, a soft, steady hum." },
      lines: [[0, "First, a hum to warm up: breathe in, then hum on the long breath out, lips closed."],
        [23, guide === "both" ? "Find a note that sits easily with the drone, and let the hum buzz in your face." : "Find a comfortable note, and let the hum buzz in your face."],
        [43, "Let each hum use the whole breath out."]] }));
    st.push(vxSing("scale", "scale", "Vowels", words ? "Now sing five notes up and down after the count-in, on each vowel: mah, may, mee, moh, moo."
      : "Now five notes up and down with the tune, on each vowel: mah, may, mee, moh, moo.", x({})));
    var rounds = [];
    songs.forEach(function (id) {
      var nm = VX_SONGS[id].short;
      if (!words) st.push(vxSing(id, "listen", nm + ": listen", grp ? "Listen to the tune once. Join in quietly if you know it." : "Listen to the tune once. Hum along if you know it.", x({})));
      st.push(vxSing(id, "unison", nm + ", together", grp ? "Now everyone together, twice through." : words ? "Now sing it, twice through." : "Now sing it with the phone, twice through.", x({ reps: 2 })));
      rounds.push(st.length);
      st.push(round(id, 2));
    });
    // the time left: each round sung three times, then four; a quiet hum of the first song; more rounds; the rest to close
    var left = function () { return T - secsOf(st) - 30; };
    [3, 4].forEach(function (reps) {
      rounds.forEach(function (k) {
        var s = st[k], bigger = round(s.song, reps);
        if (bigger.secs - s.secs <= left()) st[k] = bigger;
      });
    });
    var hum = vxSing(songs[0], "hum", "Hum it softly", "Now hum the tune together, softly, lips closed.", x({ lead: 5 }));
    if (hum.secs <= left()) st.push(hum);
    for (var k = 0; k < 6; k++) {
      var more = round(songs[k % songs.length], 2, true);
      if (more.secs > left()) break;
      st.push(more);
    }
    var close = T - secsOf(st), lines = [[0, "Take a breath, and notice how you feel: your breath, your face, your chest."],
      [15, grp ? "Look around at each other. Well sung, everyone." : "Well sung."]];
    if (close >= 55) lines.push([40, "Sit quietly for a moment before you carry on."]);
    st.push(G(close, "Afterwards", lines, { vis: "glow" }));
    return st;
  }

  /* ----- sound: the tune, the count-in and the drone ----- */
  function vxOut() {
    if (!ensureCtx()) return false;
    if (!VX.bus) { VX.bus = A.ctx.createGain(); VX.bus.gain.value = 0.9; VX.bus.connect(A.ctx.destination); }
    if (!VX.g) { VX.g = A.ctx.createGain(); VX.g.gain.value = 1; VX.g.connect(VX.bus); }
    return true;
  }
  // one note of the tune: a soft triangle with a touch of its octave, a gentle start, a short gap before the next
  function vxNote(m, when, dur) {
    if (!vxOut()) return;
    var ctx = A.ctx, f = vxHz(m), end = when + Math.max(0.12, dur * 0.92), r = Math.min(0.14, dur * 0.3);
    [["triangle", 1, 0.16], ["sine", 2, 0.04]].forEach(function (h) {
      var o = ctx.createOscillator(), g = ctx.createGain();
      o.type = h[0]; o.frequency.value = f * h[1];
      g.gain.setValueAtTime(0, when);
      g.gain.linearRampToValueAtTime(h[2], when + 0.03);
      g.gain.linearRampToValueAtTime(h[2] * 0.8, end - r);
      g.gain.linearRampToValueAtTime(0, end);
      o.connect(g); g.connect(VX.g);
      o.start(when); o.stop(end + 0.05);
      o.onended = function () { try { o.disconnect(); g.disconnect(); } catch (e) {} };
    });
  }
  // the drone, in over two seconds and out over fade
  function vxDrone(on, fade) {
    if (!!VX.dr === on) return;
    if (on) {
      if (!vxOut()) return;
      var ctx = A.ctx, now = ctx.currentTime, g = ctx.createGain(), lp = ctx.createBiquadFilter();
      lp.type = "lowpass"; lp.frequency.value = 900;
      g.gain.setValueAtTime(0, now); g.gain.linearRampToValueAtTime(1, now + 2);
      lp.connect(g); g.connect(VX.bus);
      VX.dr = { g: g, lp: lp, os: VX_DRONE.map(function (x) {
        var o = ctx.createOscillator(), og = ctx.createGain();
        o.type = "triangle"; o.frequency.value = x[0]; og.gain.value = x[1];
        o.connect(og); og.connect(lp); o.start(now);
        o.onended = function () { try { o.disconnect(); og.disconnect(); } catch (e) {} };
        return o;
      }) };
    } else {
      var dr = VX.dr, t = A.ctx.currentTime, f = fade === undefined ? 1 : fade;
      VX.dr = null;
      try {
        dr.g.gain.cancelScheduledValues(t); dr.g.gain.setValueAtTime(dr.g.gain.value, t); dr.g.gain.linearRampToValueAtTime(0, t + f);
        dr.os.forEach(function (o) { o.stop(t + f + 0.1); });
      } catch (e) {}
      setTimeout(function () { try { dr.lp.disconnect(); dr.g.disconnect(); } catch (e) {} }, (f + 0.4) * 1000);
    }
  }
  // the notes already queued, silenced at once (a pause, a skip, the end)
  function vxCut(fade) {
    var g = VX.g;
    VX.g = null;
    if (!g || !A.ctx) return;
    var t = A.ctx.currentTime, f = fade || 0.06;
    try { g.gain.cancelScheduledValues(t); g.gain.setValueAtTime(g.gain.value, t); g.gain.linearRampToValueAtTime(0, t + f); } catch (e) {}
    setTimeout(function () { try { g.disconnect(); } catch (e) {} }, (f + 0.3) * 1000);
  }
  function vxHush(fade) { vxCut(fade); vxDrone(false, fade === undefined ? 0.4 : fade); }

  // a sing step's events, in time order: the count-in's clicks and the tune's notes
  function vxEvents(s) {
    if (VX.evFor === s) return VX.ev;
    var S = vxSong(s.song), bl = vxBl(s), ev = [];
    for (var k = 0; k < s.count; k++) ev.push({ t: s.lead + k * S.cb * bl, c: true, acc: k === 0 });
    if (s.tune) for (var p = 0; p < s.parts; p++) {
      var ps = vxPartAt(s, p), from = p ? vxPartAt(s, p - 1) + s.reps * S.len * bl - 1e-6 : -1;   // each part from where the one before ended
      for (var r = 0; r < s.reps; r++) S.notes.forEach(function (n) {
        var t = ps + (r * S.len + n.b0) * bl;
        if (n.m && t >= from) ev.push({ t: t, m: n.m, d: n.b * bl });
      });
    }
    ev.sort(function (a, b) { return a.t - b.t; });
    VX.ev = ev; VX.evFor = s;
    return ev;
  }
  // a new step: its events from the start
  function vxEnter(s) {
    VX.next = 0; VX.shown = "";
    vxCut();
  }
  // every tick of a running practice: the drone where a step asks for it, and a sing step's notes up to just ahead
  function vxTick(s, st) {
    vxDrone(P.state === "running" && !!s.drone);
    if (s.k !== "sing" || !A.ctx || P.state !== "running") return;
    var ev = vxEvents(s), horizon = st + (document.hidden ? 2 : 0.6);
    while (VX.next < ev.length && ev[VX.next].t < horizon) {
      var e = ev[VX.next++];
      if (e.t < st - 0.05) continue;
      var when = A.ctx.currentTime + (e.t - st);
      if (e.c) pClick(when, e.acc ? 0.14 : 0.09); else vxNote(e.m, when, e.d);
    }
  }

  /* ----- the screen: the words, where each part is, and the warm-up's vowel ----- */
  function vxModeTxt(s) {
    if (s.mode === "listen") return "Listen first";
    if (s.mode === "unison") return s.who === "solo" ? "Sing along" : "Everyone together";
    if (s.mode === "hum") return "Hum along";
    if (s.mode === "scale") return "Five notes up and down";
    return s.who === "solo" ? "A round: the phone, then you" : "A round in " + ["", "", "two", "three", "four"][s.parts] + " parts";
  }
  // a phrase's syllables, those sung so far and the one now marked (cur: the note's place, or -1)
  function vxPhrase(ph, cur, on) {
    return '<p class="vx-l' + (on ? " on" : "") + '">' + ph.filter(function (n) { return n[0]; }).map(function (n, i) {
      var t = n[2], join = /-$/.test(t);
      return '<span class="' + (i === cur ? "now" : on && i < cur ? "past" : "") + '">' + esc(join ? t.slice(0, -1) : t) + "</span>" + (join ? "" : " ");
    }).join("") + "</p>";
  }
  function vxHtml(s, st) {
    var S = vxSong(s.song), h = '<p class="vx-h">' + esc(S.name) + " · " + esc(vxModeTxt(s)) + "</p>";
    if (s.mode === "scale") {
      var q = vxPos(s, st, 0), ph = q.st === "on" ? S.ph[q.p] : q.st === "done" ? S.ph[S.ph.length - 1] : S.ph[0];
      return h + '<p class="vx-vow">' + esc(ph[0][2]) + '</p><div class="vx-dots" aria-hidden="true">' + ph.filter(function (n) { return n[0]; }).map(function (n, i) {
        return '<i class="' + (q.st === "on" && i === q.i ? "now" : "") + '" style="--y:' + (n[0] - 62) * 6 + 'px"></i>';
      }).join("") + "</div>";
    }
    if (s.parts < 2) {
      var u = vxPos(s, st, 0);
      return h + S.ph.map(function (ph, i) { return vxPhrase(ph, u.st === "on" && u.p === i ? u.i : -1, u.st === "on" && u.p === i); }).join("");
    }
    var who = function (p) { return s.who === "solo" ? (p ? "You" : "Phone") : "Group " + (p + 1); };
    for (var p = 0; p < s.parts; p++) {
      var x = vxPos(s, st, p), beats = x.st === "wait" ? Math.ceil(x.b) : 0;
      h += '<div class="vx-p ' + x.st + '"><b>' + who(p) + (x.st === "done" ? " · done" : x.st === "wait" ? (beats <= 4 ? " · in " + beats + (beats === 1 ? " beat" : " beats") : " · waiting") : "") + "</b>" +
        vxPhrase(S.ph[x.st === "on" ? x.p : x.st === "done" ? S.ph.length - 1 : 0], x.st === "on" ? x.i : -1, x.st === "on") + "</div>";
    }
    return h;
  }
  // redrawn only when something on it changes: a new syllable, a part coming in, a beat of the countdown
  function vxShow(s, st) {
    var el = $("#sSing");
    if (!el || el.hidden) return;
    var key = s.at + ":";
    for (var p = 0; p < s.parts; p++) { var x = vxPos(s, st, p); key += x.st + (x.st === "on" ? x.p + "." + x.i : x.st === "wait" ? Math.min(5, Math.ceil(x.b)) : "") + ","; }
    if (key === VX.shown) return;
    VX.shown = key;
    el.dataset.n = s.parts;                         // three or four parts: each row's name beside its words, to fit a phone
    el.innerHTML = vxHtml(s, st);
  }
  // the line under the step's name: getting ready, the count-in, then what to do
  function vxSub(s, st) {
    if (st < s.lead) return "Get ready";
    var t0 = vxT0(s);
    if (st < t0) return "Count-in: " + Math.min(s.count, Math.floor((st - s.lead) / (vxBl(s) * VX_SONGS[s.song].cb)) + 1) + " of " + s.count;
    if (st >= vxEnd(s)) return "";
    var u = vxPos(s, st, 0), of = s.reps > 1 && s.parts < 2 && u.st === "on" ? ", " + (u.r + 1) + " of " + s.reps : "";
    return (s.mode === "listen" ? "Listen" : s.mode === "hum" ? "Hum, lips closed" : s.mode === "round" ? "Sing your part" : "Sing") + of;
  }

  /* ----- a tick to keep time with: a ring that pulses on each one (Laughter Break's claps, Let It Out's words) ----- */
  function vxBeat(c, W, Hh, s, st, col) {
    var cx = W / 2, cy = Hh / 2, R = Math.min(W, Hh) * 0.3, k = 0, at = s.metroAt || 3, gap = 60 / (s.metro || 60);
    if (!RM && st >= at) {                          // the time since the last tick that sounded
      var j = Math.floor((st - at) / gap), pat = s.metroPat;
      if (pat) while (j > 0 && pat.charAt(j % pat.length) !== "x") j--;
      k = Math.exp(-((st - at) - j * gap) * 7);
    }
    var r = R * (0.9 + 0.1 * k), g = c.createRadialGradient(cx, cy, r * 0.2, cx, cy, r * 1.4);
    g.addColorStop(0, rgba(col, 0.1 + 0.3 * k)); g.addColorStop(1, rgba(col, 0));
    c.fillStyle = g; c.beginPath(); c.arc(cx, cy, r * 1.4, 0, Math.PI * 2); c.fill();
    c.strokeStyle = rgba(col, 0.3 + 0.55 * k); c.lineWidth = 2 + 3 * k;
    c.beginPath(); c.arc(cx, cy, r, 0, Math.PI * 2); c.stroke();
  }

  function vxInit() {
    SETTLE_HUSH.push(function (secs) { vxHush(secs); });     // I need to stop: the tune and the drone fade with everything else
    if (window.__entrain) { window.__entrain.VX = VX; window.__entrain.VX_SONGS = VX_SONGS; window.__entrain.vxEvents = vxEvents; window.__entrain.vxPos = vxPos; }
  }
