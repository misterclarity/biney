  /* ------------------------- guided practices: content -------------------------
     Every practice is a list of timed steps. Step kinds:
       guide    spoken and captioned lines, optionally lighting regions of a body map
       breath   paced breathing through the breathing guide's own engine, so heart-rate
                swing, coherence and the five visuals all work; `to` glides the timings
       pose     a standing yoga pose with a drawing, held for a number of breaths
       pump     rounds of fast exhales (kapalabhati), counted and ticked
       observe  natural breath, nothing paced (anapana), with a "mind wandered" counter
       count    the 5-4-3-2-1 senses, tapped off one at a time
       shuffle  a new easy-to-picture word every few seconds (the cognitive shuffle)
       pmr      tense one muscle group, then release it
       drift    a soft glow while the sound carries on (sleep)
       hold     a breath hold: open (tap Breathe in, capped) or a fixed count
     Lengths are in seconds. `lines` are [offset, text] pairs, or plain strings spread
     evenly across the step. Programs add `audio`: a binaural layer whose beat follows
     piecewise-linear points [[second, Hz], ...] across the whole program.
  ------------------------------------------------------------------------------ */

  function pLines(lines, secs) {
    if (!lines) return [];
    if (typeof lines === "string") lines = [lines];
    var plain = lines.filter(function (l) { return typeof l === "string"; }).length === lines.length;
    if (!plain) return lines;
    var n = lines.length, gap = n > 1 ? Math.min(secs / n, 40) : 0;
    return lines.map(function (l, i) { return [Math.round(i * gap * 10) / 10, l]; });
  }
  function ext(a, b) { if (b) for (var k in b) a[k] = b[k]; return a; }
  function G(secs, title, lines, o) { return ext({ k: "guide", secs: secs, title: title, lines: pLines(lines, secs) }, o); }
  function Br(secs, title, t, o) { return ext({ k: "breath", secs: secs, title: title, t: t, lines: pLines(o && o.lines, secs) }, o && (delete o.lines, o)); }
  function Pu(n, rate, title, lines) { return { k: "pump", secs: 3 + n / rate + 1, n: n, rate: rate, title: title, lines: pLines(lines, 3) }; }
  function Ob(secs, title, lines, o) { return ext({ k: "observe", secs: secs, title: title, lines: pLines(lines, secs) }, o); }
  function Ct(secs, n, title, lines, o) { return ext({ k: "count", secs: secs, n: n, title: title, lines: pLines(lines, secs) }, o); }
  function Sh(secs, title, lines) { return { k: "shuffle", secs: secs, title: title, every: 12, lines: pLines(lines, 30) }; }
  function Pm(body, title, tense, after) {
    return { k: "pmr", secs: 37, tense: 7, title: title, body: body,
      lines: [[0, tense], [7, "And release. Let it all go."], [19, after || "Notice the difference between tension and letting go."]] };
  }
  function Hd(secs, title, o) { var l = o && o.lines; return ext({ k: "hold", secs: secs, title: title, lines: pLines(l, secs) }, o && (delete o.lines, o)); }
  function Dr(secs, title, lines) { return { k: "drift", secs: secs, title: title, lines: pLines(lines, secs) }; }

  var TENSION = "If you notice tension, let it soften on the out-breath.";
  var WANDER = "If your mind has wandered, that's fine. Gently come back.";

  /* Body scan regions: [body-map regions, title, lines]. */
  var SCAN = [
    [["all"], "Settling in", ["Lie on your back or sit comfortably, and let your eyes close if that feels okay.",
      "Feel where your body touches the floor, the bed or the chair. Let it take your weight.",
      "Observe whatever you find, just as it is."]],
    [["belly"], "The breath", ["Let the breath flow at its own pace, and observe the belly rising and falling.",
      "Each out-breath is a small chance to let go.", WANDER]],
    [["footL"], "Left foot", ["Bring your attention down to your left foot: the toes, the sole, the heel.",
      "Observe whatever is there: warmth, coolness, tingling, pressure, or the subtlest sensation.",
      "Breathe as if the breath could travel all the way down to the foot."]],
    [["shinL", "kneeL", "thighL"], "Left leg", ["Move up into the left ankle, the shin and the calf.",
      "Now the knee, and the long muscles of the thigh.", "Let the whole left leg feel heavy and supported."]],
    [["footR"], "Right foot", ["Now shift to your right foot: the toes, the sole, the heel.",
      "Observe any sensation here, as it is.", "If the mind has drifted, bring it back to the right foot."]],
    [["shinR", "kneeR", "thighR"], "Right leg", ["Move up through the right ankle, shin and calf.",
      "The knee, and the thigh.", "Let both legs rest, heavy and still."]],
    [["hips"], "Hips and pelvis", ["Bring your attention to your hips and pelvis, and where they meet the surface below you.",
      "Let the muscles around the hips soften.", TENSION]],
    [["back"], "Back", ["Now your lower back. Notice its curve and any tightness.",
      "Move up along the spine to the middle and upper back, and the shoulder blades.",
      "On each out-breath, let the back widen and settle."]],
    [["belly"], "Belly", ["Return to the belly. Observe it rising as you breathe in and falling as you breathe out.",
      "Let it be soft and loose.", WANDER]],
    [["chest"], "Chest", ["Move up to the chest. Notice the ribs widening and the breath moving.",
      "You might feel your heartbeat here. If you do, observe its rhythm.", "Observe the sensations of the chest, just as they are."]],
    [["handL", "armL"], "Left hand and arm", ["Bring your attention to your left hand: fingertips, palm, the back of the hand.",
      "Up through the wrist, the forearm, the elbow and the upper arm.", "Let the arm be heavy."]],
    [["handR", "armR"], "Right hand and arm", ["Now the right hand: fingertips, palm, the back of the hand.",
      "Up through the wrist, the forearm, the elbow and the upper arm.", "Both arms resting, heavy and warm."]],
    [["shoulders", "neck"], "Shoulders and neck", ["Notice your shoulders. Many of us hold tension here.",
      "Let them drop away from the ears, and feel the neck lengthen.", TENSION]],
    [["face"], "Face", ["Bring your attention to your face. Unclench the jaw and let the teeth part a little.",
      "Soften the muscles around the eyes, and smooth the forehead.",
      "Observe the air at the nostrils: cool on the way in, warmer on the way out."]],
    [["head"], "Head", ["Move to the top of the head, and the back of the head where it rests.",
      "Let the scalp soften.", "If thoughts are passing through, let them pass."]],
    [["all"], "Whole body", ["Now widen your attention to take in the whole body at once, breathing.",
      "Observe the whole body as one field of sensation, resting here.", "Stay with this for a few breaths."]]
  ];
  var SCAN_END = {
    wake: [[["all"], "Closing", ["Let your breath deepen a little. Wiggle your fingers and toes.",
      "When you're ready, open your eyes and take this calm with you."]]],
    sleep: [[["all"], "Rest", ["There's nothing else to do now. Let your body stay heavy and still.",
      "If you're going to sleep, simply let yourself drift."]]]
  };
  function bodyScan(min, end, regions) {
    var list = (regions || SCAN).concat(SCAN_END[end || "wake"]), total = min * 60;
    var w = list.map(function (r, i) { return i === 0 ? 1.2 : i === list.length - 1 ? 0.8 : 1; });
    var sum = w.reduce(function (a, b) { return a + b; }, 0), used = 0;
    return list.map(function (r, i) {
      var secs = i === list.length - 1 ? total - used : Math.round(total * w[i] / sum);
      used += secs;
      var lines = secs < 45 ? r[2].slice(0, 2) : r[2];
      return G(secs, r[1], lines, { body: r[0] });
    });
  }

  /* Anapana: the area of attention narrows in steps, from the triangle between the top of the nose and
     the two corners of the upper lip down to the small dimple just beneath the ridge between the
     nostrils, observing every sensation in each area. Short sittings take fewer steps; the reminders
     thin out as the sitting gets longer, so an hour is mostly quiet. zone: the area drawn (pFaceSVG). */
  var ANA_ZONES = [
    { title: "The whole triangle", back: "the triangle",
      start: "Bring your attention to the triangle from the top of your nose down to the two corners of your upper lip. Observe every sensation within it: the touch of the breath, warmth, coolness, tingling, itching, pressure.",
      more: ["Stay with the whole triangle, from the top of the nose to the corners of the lip. Observe each sensation as it arises.",
        "Let the breath come and go at its own pace, and observe its touch anywhere in the triangle."] },
    { title: "Nostrils and upper lip", back: "the nostrils and the upper lip",
      start: "Now narrow the area to the lower part of the nose, the nostrils and the whole upper lip. Observe all the sensations here.",
      more: ["Observe the breath touching the inside of the nostrils as it comes in and as it goes out.",
        "Each time the mind wanders, bring it back to the nostrils and the upper lip."] },
    { title: "Around the nostrils", back: "the rims of the nostrils",
      start: "Narrow it further, to the rims of the nostrils and the skin just around them. Observe the touch of each breath here, warmer or cooler, stronger or lighter.",
      more: ["Observe which nostril the breath is flowing through: the left, the right, or both.",
        "Stay with the rims of the nostrils. Observe each sensation, and then the next."] },
    { title: "Below the nostrils", back: "the area below the nostrils",
      start: "Now only the small area below the nostrils, above the upper lip. Observe whatever sensation is there: the touch of the breath, a tingle, warmth, a pulse.",
      more: ["Keep your attention in this small area below the nostrils. Observe each sensation as it arises and as it passes.",
        "Each time the mind wanders, return to the small area below the nostrils."] },
    { title: "The small dimple", back: "the small dimple",
      start: "Now narrow to the small dimple just beneath the ridge between the nostrils. Rest all your attention on this one small point, and observe every sensation there.",
      more: ["Stay at the small dimple. Observe even the subtlest sensation, just as it is.",
        "Each time the mind wanders, return to the small dimple beneath the ridge between the nostrils.",
        "Observe the touch of the breath at this one small point, as it comes in and as it goes out."] }
  ];
  function anapana(min) {
    var total = min * 60, intro = min <= 5 ? 60 : 90, close = min >= 60 ? 60 : 45, obs = total - intro - close;
    var zones = min <= 5 ? [0, 3, 4] : min <= 10 ? [0, 1, 3, 4] : [0, 1, 2, 3, 4];
    var w = zones.map(function (z, i) { return i === zones.length - 1 ? 1.4 : 1; }), sum = w.reduce(function (a, b) { return a + b; }, 0);
    var gap = min >= 60 ? 300 : min >= 30 ? 210 : min >= 20 ? 150 : 90, used = 0;   // seconds between reminders
    var steps = [G(intro, "Settle", ["Sit upright and relaxed, and close your eyes.",
      "Let the breath flow at its own natural pace.",
      "You'll observe the sensations around the nose, in an area that narrows step by step to one small point below the nostrils.",
      "Each time you notice the mind has wandered, tap Mind wandered, then return to the area."], { vis: "face", zone: 0 })];
    zones.forEach(function (z, i) {
      var Z = ANA_ZONES[z], secs = i === zones.length - 1 ? obs - used : Math.round(obs * w[i] / sum), lines = [[0, Z.start]];
      used += secs;
      for (var t = gap, k = 0; t < secs - 60; t += gap, k++) lines.push([t, Z.more[k % Z.more.length]]);
      steps.push(Ob(secs, Z.title, lines, { wander: true, vis: "face", zone: z, back: Z.back, nobell: i > 0 }));
    });
    steps.push(G(close, "Closing", ["Now widen your attention to the whole body, sitting here.",
      "Take a fuller breath, and open your eyes when you're ready."], { vis: "glow" }));
    return steps;
  }

  function lovingKindness(min) {
    var total = min * 60, settle = 60, close = 45, mid = total - settle - close;
    var stages = [
      ["Yourself", "Start with yourself. Picture yourself as you are now, or as a child.", "I"],
      ["Someone kind", "Bring to mind someone who has been kind to you. See their face.", "you"],
      ["A friend", "Now a good friend, or someone you care about.", "you"],
      ["Someone neutral", "Now someone you see but barely know: a neighbour, a shop assistant.", "you"],
      ["Someone difficult", "If it feels okay, someone you find mildly difficult: a small, everyday friction. Go gently.", "you"],
      ["Everyone", "Now let it widen to everyone: this town, this country, all living beings.", "all"]
    ];
    var each = Math.floor(mid / stages.length);
    var steps = [G(settle, "Settle in", ["Sit comfortably and let your eyes close.",
      "Rest a hand on your chest if you like, and breathe a little slower.",
      "You'll repeat a few simple wishes silently. Offer each one sincerely: the intention itself is the practice."], { vis: "glow" })];
    stages.forEach(function (s, i) {
      var who = s[2], ph = who === "I"
        ? ["May I be safe.", "May I be healthy.", "May I be happy.", "May I live with ease."]
        : who === "all"
          ? ["May all beings be safe.", "May all beings be healthy.", "May all beings be happy.", "May all beings live with ease."]
          : ["May you be safe.", "May you be healthy.", "May you be happy.", "May you live with ease."];
      var secs = i === stages.length - 1 ? mid - each * (stages.length - 1) : each, lines = [[0, s[1]]], gap = (secs - 12) / (ph.length * (secs > 100 ? 2 : 1));
      for (var r = 0, t = 12; t < secs - 4 && r < ph.length * 2; r++, t += gap) lines.push([Math.round(t), ph[r % ph.length]]);
      steps.push(G(secs, s[0], lines, { vis: "glow" }));
    });
    steps.push(G(close, "Closing", ["Let the words go, and notice how you feel now.", "Take that warmth with you as you open your eyes."], { vis: "glow" }));
    return steps;
  }

  function nadi(min) {
    var total = min * 60, intro = 75, close = 40;
    return [
      G(intro, "Set up your hand", ["Sit tall. Rest your left hand in your lap.",
        "With your right hand, fold the index and middle fingers in. The thumb closes the right nostril, the ring finger closes the left.",
        "You'll breathe in through one side, then out through the other, switching after each in-breath. The guide shows which side.",
        "If a nostril feels blocked, imagine the breath moving through it."]),
      Br(total - intro - close, "Alternate nostril breathing", { inh: 4, sip: 0, hold: 0, exh: 6, rest: 0 },
        { mode: "nadi", lines: [[0, "Close the right nostril. Breathe in through the left."]] }),
      G(close, "Closing", ["Release the hand and breathe naturally through both nostrils.", "Notice the quiet after the practice."])
    ];
  }

  function shuffle(min) {
    return [
      G(45, "How it works", ["Get comfortable in bed and close your eyes.",
        "You'll hear or see a simple word every few seconds. Picture that thing in detail: its colour, its size, where it is.",
        "When the next word comes, let the last one go, and picture each word on its own."], { vis: "glow", sleepy: true }),
      Sh(min * 60 - 45, "Picture each word")
    ];
  }

  var PMR_GROUPS = [
    [["handR", "armR"], "Right hand and forearm", "Make a fist with your right hand and tighten the forearm. Squeeze, and hold."],
    [["armR"], "Right upper arm", "Bend your right elbow and tense the upper arm, like showing a muscle. Hold."],
    [["handL", "armL"], "Left hand and forearm", "Make a fist with your left hand and tighten the forearm. Squeeze, and hold."],
    [["armL"], "Left upper arm", "Bend your left elbow and tense the upper arm. Hold."],
    [["head"], "Forehead", "Raise your eyebrows as high as they go, wrinkling the forehead. Hold."],
    [["face"], "Eyes and cheeks", "Squeeze your eyes shut and scrunch up your cheeks. Hold."],
    [["face"], "Jaw", "Clench your jaw gently and press the lips together. Hold."],
    [["neck", "shoulders"], "Neck and shoulders", "Lift your shoulders up towards your ears. Hold them there."],
    [["chest", "back"], "Chest and upper back", "Take a breath in and pull the shoulder blades together. Hold."],
    [["belly"], "Belly", "Tighten your stomach muscles, as if bracing for a gentle push. Hold."],
    [["thighR", "hips"], "Right thigh", "Straighten the right leg and tighten the thigh. Hold."],
    [["shinR", "footR"], "Right calf and foot", "Point the right toes away from you to tense the calf. Hold."],
    [["thighL", "hips"], "Left thigh", "Straighten the left leg and tighten the thigh. Hold."],
    [["shinL", "footL"], "Left calf and foot", "Point the left toes away from you to tense the calf. Hold."]
  ];

  function wimHof(rounds, breaths) {
    rounds = rounds || 3; breaths = breaths || 30;
    var cyc = 2.5, num = ["one", "two", "three", "four"];
    var st = [G(70, "Before you start", ["Sit or lie down somewhere safe, away from water. Loosen anything tight around your waist.",
      "Each round is a set of deep breaths: fully in through the belly and chest, then let each one fall out by itself.",
      "After the last breath, let it out and hold with empty lungs until you feel the urge to breathe. Then tap Breathe in.",
      "Tingling and light-headedness are common. If you feel unwell, return to normal breathing and rest."], { vis: "glow" })];
    for (var r = 1; r <= rounds; r++) {
      var secs = 3 + breaths * cyc;
      st.push(Br(secs, "Round " + r + ": power breaths", { inh: 1.5, sip: 0, hold: 0, exh: 1, rest: 0 }, {
        count: breaths, labels: { "in": "Breathe in fully", out: "Let go" },
        hints: { "in": "Belly, then chest.", out: "Let it fall out by itself." },
        lines: [[0, "Round " + num[r - 1] + ". " + breaths + " deep breaths. Fully in, and let go."],
          [Math.round(secs / 2), "Keep going. Fully in, let it go."], [Math.round(secs - 9), "Last few breaths."]] }));
      st.push(Hd(180, "Round " + r + ": hold", { open: true, lungs: "empty",
        lines: [[0, "Let the breath out, and hold with empty lungs. Relax. Tap Breathe in when you feel the urge."],
          [30, "Stay relaxed."], [60, "One minute."], [90, "Relax the shoulders and the face."], [120, "Two minutes."],
          [150, "Whenever you need to, breathe in."]] }));
      st.push(Hd(15, "Recovery breath", { lungs: "full", lines: [[0, "Breathe in fully, and hold for fifteen seconds."], [12, "And let it go."]] }));
    }
    st.push(G(60, "Rest", ["Breathe normally now.", "Notice the tingling, the warmth, the alertness.", "Take your time before you stand up."], { vis: "glow" }));
    return st;
  }

  var STRETCH_EV = "In a randomised trial with 134 logistics workers, ten minutes of stretching after work for three months lowered anxiety compared with no programme, a moderate effect, and eased bodily pain and exhaustion. This routine itself hasn't been tested.";
  var CAPO_EV = "A 2025 systematic review of 19 studies found clearer benefits of capoeira for mental and social outcomes, such as attention, self-confidence, resilience and less aggression, than for physical health, where results were inconclusive. Robust trials are still lacking, and none tested solo practice like this.";
  var YOGA_EV = "Across 42 randomised trials, practices that included yoga postures lowered evening and waking cortisol, ambulatory blood pressure and resting heart rate, and raised high-frequency heart-rate variability compared with active controls. Particular sequences like this one haven't been tested on their own.";
  function yogaSet(id) { for (var i = 0; i < YOGA_SETS.length; i++) if (YOGA_SETS[i].id === id) return YOGA_SETS[i]; return null; }
  function yogaPractice(id, o) {
    var set = yogaSet(id);
    return ext({ id: id, yoga: id, strength: 2, tone: "relax", voice: true, name: set.name,
      build: function () { return yogaSteps(set.items, set); }, ev: YOGA_EV, cite: "Pascoe et al. 2017" }, o);
  }

  /* --------------------------- the library --------------------------- */
  var PRACTICES = [
    /* ===== combined programs ===== */
    {
      id: "sleep-descent", name: "Sleep Descent", min: 30, strength: 2,
      tone: "ther", lie: true, sensor: "optional",
      blurb: "The Delta Sleep beat with a slowing, long-exhale breath that fades out, then a short body release while the beat settles into delta.",
      parts: "Slow breathing 6 → 4.6 a minute · body release · drift · 6 → 3 Hz binaural",
      audio: { name: "Delta Sleep", band: "Theta → Delta", carrier: 200, pts: [[0, 6], [1200, 3], [1800, 3]], fade: 120, cat: "relax" },
      build: function () {
        return [
          G(60, "Settle in", ["Lie down with the lights off and your headphones comfortable. Set the volume low, just above hearing.",
            "First you'll breathe slowly with the sound. Then the guide fades, your body lets go, and the beat carries on into delta.",
            "Let your arms rest by your sides."], { vis: "glow" }),
          Br(480, "Slow, long exhale", { inh: 4, sip: 0, hold: 0, exh: 6, rest: 0 },
            { to: { inh: 5, sip: 0, hold: 0, exh: 8, rest: 0 }, glide: 360,
              lines: [[2, "Breathe in through the nose as the tone rises, and out slowly as it falls."],
                [180, "The breaths are getting longer. If it ever feels like effort, breathe a little faster. Ease matters more than the count."]] }),
          Br(180, "The guide fades", { inh: 5, sip: 0, hold: 0, exh: 8, rest: 0 },
            { cueFade: [1, 0], sleepy: true, lines: [[0, "The guide will slowly fade. Keep this slow rhythm on your own."]] }),
          G(300, "Body release", [[0, "Let your feet and legs grow heavy."], [40, "Your hips and lower back sink into the bed."],
            [80, "Your belly is soft, rising and falling by itself."], [120, "Your hands and arms are heavy and warm."],
            [160, "Shoulders drop. The neck is long."], [200, "Your jaw loosens, your eyes rest, your forehead is smooth."],
            [250, "The whole body heavy, warm and still."]], { body: ["all"], quiet: true, sleepy: true }),
          Dr(780, "Drift", [[0, "Rest now, and let the sound carry you. It fades out by itself."]])
        ];
      },
      how: "The first eight minutes pace your breath from 6 down to about 4.6 breaths a minute, with the out-breath always the longer half: 4 s in and 6 s out, gliding to 5 s in and 8 s out. The fuller inhale keeps the slow pace easy rather than air-hungry as you get drowsy. Then the cue sounds fade over three minutes, a short body release follows, and a soft glow stays on the screen while the binaural beat slides from 6 Hz theta to 3 Hz delta, holds there and fades out.",
      ev: "Each part has its own evidence; the combination hasn't been tested as a package. Twenty minutes of slow breathing at six a minute before bed shortened sleep onset and reduced night waking in people with self-reported insomnia. At that pace a longer exhale was rated more relaxing than the reverse. Relaxation training is a recommended (conditional) treatment for chronic insomnia. A 3 Hz binaural beat lengthened deep sleep in a sleep-lab study.",
      cite: "Tsai et al. 2015 · Van Diest et al. 2014 · Edinger et al. 2021 (AASM) · Jirakittayakorn & Wongsawat 2018"
    },
    {
      id: "calm-reset", name: "Calm Reset", min: 10, strength: 2,
      tone: "relax", sensor: "optional", pace: true,
      blurb: "For a stressful moment: cyclic sighs to bring arousal down fast, then even breathing at your resonance pace, under an alpha-to-theta beat.",
      parts: "Cyclic sighs · resonance breathing · binaural beat",
      audio: { name: "Calm Reset", band: "Alpha → Theta", carrier: 250, pts: [[0, 10], [600, 6]], fade: 6, cat: "relax" },
      beats: [                                   // the first is the usual one
        { id: "down", label: "Alpha to theta", band: "Alpha → Theta", pts: [[0, 10], [600, 6]], note: "Slides from 10 Hz down to 6 Hz across the session, from relaxed alertness to deeper calm." },
        { id: "theta", label: "Theta 6 Hz", band: "Theta", pts: [[0, 6], [600, 6]], note: "A steady 6 Hz beat, in the theta band studied for deep relaxation." },
        { id: "alpha", label: "Alpha 10 Hz", band: "Alpha", pts: [[0, 10], [600, 10]], note: "A steady 10 Hz beat: relaxed but awake, for when the day goes on straight after." }
      ],
      build: function () {
        var p = pPace(this);
        return [
          G(30, "Arrive", ["Sit or stand comfortably. Let your shoulders drop.", "We'll start with a few sighs to take the edge off."], { vis: "glow" }),
          Br(150, "Cyclic sighs", { inh: 3, sip: 1, hold: 0, exh: 6, rest: 0 },
            { lines: [[0, "Breathe in through the nose, take a short second sip to fill up, then a long, slow breath out through the mouth."]] }),
          Br(390, "Resonance breathing", { inh: p.inh, sip: 0, hold: 0, exh: p.exh, rest: 0 },
            { lines: [[0, p.own ? "Now breathe in for " + pSecs(p.inh).replace(" s", " seconds") + " and out for " + pSecs(p.exh).replace(" s", " seconds") + ", through the nose."
                : "Now even breaths in and out, " + p.rate + " a minute, through the nose."],
              [150, "With a sensor connected, watch your heart rate rise and fall with each breath."]] }),
          G(30, "Return", ["Let the breath go back to its own rhythm.", "Notice how you feel compared with ten minutes ago."], { vis: "glow" })
        ];
      },
      how: "Two and a half minutes of cyclic sighing (a double inhale through the nose, then a long exhale through the mouth), then six and a half minutes of even breathing at your own resonance rate (the result of the resonance test if you've taken it, otherwise 5.5 a minute) or at an in and out of your own. The beat slides from 10 Hz alpha to 6 Hz theta across the session, or stays at a steady theta or alpha beat, as you choose; both choices are kept for it.",
      ev: "Five minutes a day of cyclic sighing improved mood more than mindfulness meditation in a month-long trial. Resonance-pace breathing reliably raises heart-rate variability during and after a session. Binaural beats show a pooled anxiety-reducing effect, largest with theta and delta beats. A large 2023 trial found four weeks of coherent breathing didn't beat a placebo breathing pace on self-reported stress, so treat this as an in-the-moment tool rather than a cure.",
      cite: "Balban et al. 2023 · Laborde et al. 2022 · Garcia-Argibay et al. 2019 · Fincham et al. 2023 (RCT)"
    },
    {
      id: "coherence", name: "Heart Coherence", min: 15, lengths: [10, 15, 20], strength: 2,
      tone: "relax", sensor: "best", anaStyle: "heart", pace: true,
      blurb: "Heart-focused breathing at your resonance pace until your heart rhythm settles, then a gentle feeling of gratitude, with live coherence over a binaural beat. Sitting or lying down.",
      parts: "Heart-focused resonance breathing · gratitude · coherence feedback · binaural beat",
      audio: { name: "Heart Coherence", band: "Theta", carrier: 200, pts: [[0, 6], [1200, 6]], fade: 8, cat: "relax" },
      beats: [                                   // the first is the usual one
        { id: "theta", label: "Theta 6 Hz", band: "Theta", pts: [[0, 6], [1200, 6]], note: "A steady 6 Hz beat, in the theta band studied for deep relaxation." },
        { id: "alpha", label: "Alpha 10 Hz", band: "Alpha", pts: [[0, 10], [1200, 10]], note: "A steady 10 Hz beat: relaxed but awake, if theta makes you drowsy." },
        { id: "down", label: "Alpha to theta", band: "Alpha → Theta", pts: [[0, 10], [300, 6], [1200, 6]], note: "Starts at 10 Hz and slides down to 6 Hz over the first five minutes." }
      ],
      choices: [{ key: "pos", label: "Position", opts: [["sit", "Sitting"], ["lie", "Lying down"]], def: "sit" }],
      build: function (min) {
        var p = pPace(this), lie = pChoice(this, "pos") === "lie", t = { inh: p.inh, sip: 0, hold: 0, exh: p.exh, rest: 0 };
        var breath = (min || 15) * 60 - 120, first = 180, rest = breath - first;
        var pace = p.own ? "in for " + pSecs(p.inh).replace(" s", " seconds") + " and out for " + pSecs(p.exh).replace(" s", " seconds") : "evenly, " + p.rate + " a minute";
        return [
          G(45, "Arrive", [lie ? "Lie on your back, a pillow under your head and, if it helps, under your knees. Let your arms rest by your sides." : "Sit comfortably, feet flat on the floor, your back upright but not stiff.",
            "Rest your attention on the centre of your chest, around the heart.",
            "Connect a heart sensor if you have one; coherence appears after about a minute."], { vis: "glow" }),
          Br(first, "Heart-focused breathing", t,
            { lines: [[0, "Breathe " + pace + ", imagining the breath flowing in and out through the heart area."],
              [90, "Keep the breath soft and even. Your heart rhythm is falling into step with it."]] }),
          Br(rest, "Breathing with gratitude", t,
            { lines: [[0, "Keeping the same breath, call up a feeling of gratitude: a person, a place or a pet you love, or something that went well today. Feel it rather than think it, and let it be gentle."],
              [Math.round(rest * 0.3), "If the feeling fades, picture that person or moment again and breathe the warmth in through your chest."],
              [Math.round(rest * 0.55), "Whatever the score does, come back to the even breath and the feeling."],
              [Math.max(Math.round(rest * 0.55) + 30, rest - 120), "Keep the rhythm and the feeling going for these last minutes."]] }),
          G(75, "Return", lie ? ["Let the breath go back to its own pace.", "Observe the sensations in your chest now, and the weight of your body on the floor.", "When you're ready, roll onto your side before you sit up."]
            : ["Let the breath go back to its own pace.", "Observe the sensations in your chest now, and the pace of your breath.", "Bring that steadiness into whatever comes next."], { vis: "glow" })
        ];
      },
      how: "Three minutes of even breathing at your resonance rate (from the resonance test, or 5.5 a minute) or a pace of your own, with your attention on the chest. Then, on the same breath, a gentle feeling of gratitude to the end: the two steps of HeartMath's Quick Coherence technique. Gratitude comes second because it's easiest to feel, rather than just think, once slow breathing has calmed you and your heart rhythm has settled into a steady wave; for the same reason it fits well after a meditation such as Anapana or the Body Scan. Sit or lie down. With a sensor, the coherence score and your heart rate show live.",
      ev: "Breathing near 6 a minute brings heart rate and blood pressure rhythms into step, the state the coherence score measures. Holding a feeling of appreciation shifted heart-rate variability toward its mid- and high-frequency bands in a 1995 HeartMath laboratory study, and across 1.8 million sessions of HeartMath's app, positive emotions went with higher coherence scores. Theta binaural beats (7 Hz, swept between 5.5 and 8.5 Hz) shifted heart-rate variability toward parasympathetic activity in 21 young adults resting after exercise. The combination itself hasn't been trialled.",
      cite: "Lehrer & Gevirtz 2014 · McCraty et al. 1995 · Balaji et al. 2025 · McConnell et al. 2014"
    },
    {
      id: "gratitude", name: "Gratitude", lengths: [10, 15], min: 10, strength: 2,
      tone: "stim", sensor: "optional", pace: true,
      blurb: "Settle with slow, even breathing first, then let gratitude grow: for something small from today, for a person who helped you, for your own body, and for the feeling itself. Sitting or lying down.",
      parts: "Resonance breathing · something small · someone who helped · your body · savouring · three good things",
      choices: [{ key: "pos", label: "Position", opts: [["sit", "Sitting"], ["lie", "Lying down"]], def: "sit" }],
      build: function (min) {
        var p = pPace(this), lie = pChoice(this, "pos") === "lie", t = { inh: p.inh, sip: 0, hold: 0, exh: p.exh, rest: 0 };
        // seconds for each step at 10 and 15 minutes: arrive, breathing, something small, someone, the body, savouring, three good things
        var s = (min || 10) >= 15 ? [40, 240, 120, 165, 120, 135, 80] : [40, 180, 75, 105, 75, 75, 50];
        var pace = p.own ? "in for " + pSecs(p.inh).replace(" s", " seconds") + " and out for " + pSecs(p.exh).replace(" s", " seconds") : "evenly, " + p.rate + " a minute";
        var at = function (i, f) { return Math.round(s[i] * f); };
        return [
          G(s[0], "Arrive", [lie ? "Lie on your back, a pillow under your head and, if it helps, under your knees. Let your arms rest by your sides." : "Sit comfortably, feet on the floor, your back upright and at ease. Let your hands rest.",
            "First you'll breathe slowly for a few minutes. Gratitude comes after, once you're calm, when it's easiest to feel."], { vis: "glow" }),
          Br(s[1], "Settling breath", t,
            { lines: [[0, "Breathe " + pace + ", softly, through the nose."],
              [at(1, 0.45), "Rest your attention in the centre of your chest, and let the breath flow there."]] }),
          G(s[2], "Something small", [[0, "Let the breath find its own pace again."],
            [8, "Bring to mind one small thing from today that you're glad of: a taste, a kind word, a moment of light, a task that went well."],
            [at(2, 0.45), "See it again in detail: where you were, what you noticed. Enjoy it a second time."],
            [at(2, 0.8), "Notice where in your body you feel it."]], { vis: "glow" }),
          G(s[3], "Someone who helped", [[0, "Now think of a person who has helped you, recently or long ago."],
            [at(3, 0.25), "Picture their face. Remember what they did, and what it made possible for you."],
            [at(3, 0.55), "Silently thank them, in your own words."],
            [at(3, 0.8), "Let the warmth of it rest in your chest."]], { vis: "glow" }),
          G(s[4], "Your body", [[0, "Turn the same appreciation toward your body."],
            [at(4, 0.3), "Your breath, coming and going by itself. Your heart, beating all day long. Your feet, carrying you where you needed to go."],
            [at(4, 0.7), "Thank your body for one thing it did for you today."]], { vis: "glow" }),
          G(s[5], "Savour it", [[0, "Now rest in the feeling itself, whatever form it takes: warmth, ease, a quiet gladness."],
            [at(5, 0.35), "Breathe it in through the centre of your chest, and let it spread a little with each breath out."],
            [at(5, 0.7), "If it fades, return to the person or the moment, and let it come back."]], { vis: "glow" }),
          G(s[6], "Three good things", [[0, "Let the breath and the body settle."],
            [at(6, 0.25), "Later today, if you like, write down three good things that happened, and why each one went well."],
            [Math.max(at(6, 0.25) + 15, s[6] - 15), lie ? "When you're ready, roll onto your side before you sit up." : "Bring this gladness into whatever comes next."]], { vis: "glow" })
        ];
      },
      how: "Three or four minutes of slow, even breathing at your resonance rate (from the resonance test, or 5.5 a minute) or a pace of your own, with your attention in the chest. Gratitude comes after the breathing because it's easiest to feel, rather than just think, once you're calm; for the same reason it fits well after a meditation. Then four steps: something small from today, a person who helped you, your own body, and resting in the feeling. It ends with an invitation to write down three good things later. Sit or lie down; with a sensor, coherence shows live.",
      ev: "Across 27 trials with 3,675 people, gratitude exercises eased symptoms of depression and anxiety a little, and a 2016 meta-analysis found small gains in well-being. Writing down three good things each day for a week raised happiness and lowered depressive symptoms for six months in an online trial. Holding a feeling of appreciation shifted heart-rate variability toward its mid- and high-frequency bands in a 1995 HeartMath laboratory study. This guided sequence itself hasn't been trialled.",
      cite: "Cregg & Cheavens 2021 · Davis et al. 2016 · Seligman et al. 2005 · McCraty et al. 1995"
    },
    {
      id: "focus-primer", name: "Focus Primer", min: 13, strength: 2,
      tone: "stim", sensor: "optional",
      blurb: "Three minutes of resonance breathing to steady you, then ten of 16 Hz beta while you set your intention. Start work when the bell rings.",
      parts: "Resonance breathing · intention · 10 → 16 Hz binaural · start cue",
      audio: { name: "Focus Primer", band: "Alpha → Beta", carrier: 400, pts: [[0, 10], [180, 10], [210, 16], [780, 16]], fade: 4, cat: "stim" },
      build: function () {
        return [
          G(20, "Arrive", ["Sit at your desk with the task open and ready to begin. Headphones on."], { vis: "glow" }),
          Br(160, "Steady breathing", { inh: 5.5, sip: 0, hold: 0, exh: 5.5, rest: 0 },
            { lines: [[0, "Even breaths in and out through the nose, about five and a half a minute."]] }),
          Ob(600, "Prime", [[0, "Let your breath go back to normal and open your eyes."],
            [20, "Decide what the first small step of your task will be. Picture yourself doing it."],
            [240, "If you notice your attention drifting, note it and come back to the plan."],
            [480, "Two minutes left. Get what you need within reach."]], { vis: "still", eyesOpen: true })
        ];
      },
      end: "Prime complete. Start your task now.",
      how: "Under three minutes of resonance breathing, then ten minutes of a 16 Hz beta beat (one of the two beta frequencies that improved watch-keeping in Lane and colleagues' 1998 vigilance trial) while you plan the first step. At the bell the audio fades out and you start. Listening before a task, rather than only during it, is where the binaural evidence for attention is clearest.",
      ev: "In Garcia-Argibay and colleagues' 2019 meta-analysis of binaural beats, listening before a task gave clearer effects on thinking than listening only during it. Beta beats at 16 and 24 Hz improved vigilance in Lane and colleagues' trial. In a small trial, 10 minutes of heart-rate-variability biofeedback improved reaction times and accuracy on a Stroop task under stress.",
      cite: "Garcia-Argibay et al. 2019 · Lane et al. 1998 · Prinsloo et al. 2011"
    },
    {
      id: "nsdr", name: "Body Scan + Theta", min: 20, strength: 2,
      tone: "relax", lie: true, sensor: "optional",
      blurb: "A 20-minute guided body scan over a 6 Hz theta beat: a deep rest in the daytime (sometimes called NSDR), or a way into sleep.",
      parts: "Guided body scan · 6 Hz binaural",
      audio: { name: "Body Scan + Theta", band: "Theta", carrier: 250, pts: [[0, 6], [1200, 6]], fade: 20, cat: "relax" },
      build: function () { return bodyScan(20, "wake"); },
      how: "The full body scan, from the feet to the top of the head, over a steady 6 Hz beat on a 250 Hz carrier. Lie down if you can.",
      ev: "Body scan practice alone gave a small rise in mindfulness in a meta-analysis of about 15 trials, without a clear effect on stress by itself. A body-scan-based yoga nidra practice reduced stress slightly, and the 30-minute version reduced sleep disturbance, over two months of daily use. A 6 Hz binaural beat raised frontal midline theta, the signature of internally focused attention.",
      cite: "Gan et al. 2022 · Moszeik et al. 2025 · Jirakittayakorn & Wongsawat 2017"
    },
    {
      id: "recovery", name: "Exercise Recovery", min: 10, strength: 2,
      tone: "relax", sensor: "best",
      blurb: "After training: slow breathing at six a minute with a long exhale, over a 6 Hz theta beat. Watch your heart rate come down.",
      parts: "Slow long-exhale breathing · 6 Hz binaural · heart-rate drop",
      audio: { name: "Exercise Recovery", band: "Theta", carrier: 200, pts: [[0, 6], [600, 6]], fade: 8, cat: "relax" },
      build: function () {
        return [
          G(30, "Arrive", ["Sit or lie down somewhere comfortable after your session.", "Let your breathing settle for a moment."], { vis: "glow" }),
          Br(510, "Slow breathing", { inh: 4, sip: 0, hold: 0, exh: 6, rest: 0 },
            { lines: [[0, "In for four through the nose, out for six. Six breaths a minute."],
              [240, "Let each exhale be soft and complete."]] }),
          G(60, "Return", ["Breathe naturally now.", "Notice your heart rate and how your body feels."], { vis: "glow" })
        ];
      },
      how: "Eight and a half minutes at 6 breaths a minute (4 s in, 6 s out) over a 6 Hz theta beat. With a sensor connected the summary shows how far your heart rate fell.",
      ev: "Slow breathing at six a minute after moderate cycling sped the return of cardiac parasympathetic activity in young men (Sugimoto et al. 2025). In a separate study of 21 young adults resting after exercise, theta binaural beats (7 Hz, swept between 5.5 and 8.5 Hz) shifted heart-rate variability toward parasympathetic activity over the first ten minutes, compared with the same sound without a beat (McConnell et al. 2014).",
      cite: "Sugimoto et al. 2025 · McConnell et al. 2014"
    },

    {
      id: "heart-led", name: "Heart-Led Beats", exp: true, lengths: [15, 20, 30], min: 20, strength: 1,
      sensor: "best", sensorWhy: "the beat follows it; without one, it runs a scripted descent",
      audio: { dyn: true, start: 10, cat: "relax", band: "Alpha to theta, led by your heart", name: "Heart-led beat", carrier: 200, fade: 20 },
      blurb: "An experiment in biofeedback through sound: the binaural beat follows your heart, gliding from alpha toward theta as your heart rate settles and its rhythm loosens.",
      build: function (min) { return heartLed(min || 20); },
      how: "After a minute to settle, a minute and a half measures your resting heart rate and beat-to-beat variability. From then on, every five seconds, the beat moves toward a target set by how calm your heart looks: heart rate below your baseline counts for half, a rise in RMSSD for 30%, and coherence for 20%. The target runs from 10 Hz down to 4 Hz, and the beat never moves faster than 0.15 Hz per update. After ten minutes it leads up to 1 Hz lower. With no heart data, it follows a scripted 10 to 6 Hz descent.",
      ev: "This is an experiment. Alpha and theta binaural beats have small, inconsistent effects on anxiety and relaxation in meta-analyses, and heart-rate variability biofeedback has better evidence for stress. But no study has tested binaural beats that follow the heart, and the rule here is Entrain's own. Treat the summary at the end, your heart rate with the beat drawn over it, as the real test.",
      cite: "Experimental · Entrain's own rule"
    },

    /* ===== meditation and mindfulness ===== */
    {
      id: "body-scan", name: "Body Scan", lengths: [10, 20, 30], min: 10, strength: 1,
      tone: "relax", lie: true, voice: true,
      blurb: "Move your attention slowly through the body, from the feet to the head, observing each sensation as it is.",
      build: function (min) { return bodyScan(min, "wake"); },
      how: "Sixteen stops, from the feet up, each with a few spoken cues. The body map shows where you are. Choose 10, 20 or 30 minutes.",
      ev: "The body scan is a core practice of mindfulness-based stress reduction. On its own, a meta-analysis of about 15 trials found a small rise in mindfulness and no clear effect on stress or anxiety. Mindfulness programs that include it have moderate evidence for reducing anxiety, depression and pain.",
      cite: "Gan et al. 2022 · Goyal et al. 2014"
    },
    {
      id: "anapana", name: "Anapana", lengths: [5, 10, 20, 30, 60], min: 10, strength: 2,
      tone: "relax",
      blurb: "Breath observation in the Vipassana tradition: the area of attention narrows step by step, from the triangle around the nose and upper lip to one small point beneath the nostrils.",
      build: function (min) { return anapana(min); },
      how: "The breath flows at its own natural pace while the area you observe narrows: the whole triangle from the top of the nose to the corners of the upper lip, then the nostrils and upper lip, the rims of the nostrils, the small area below them, and finally only the small dimple just beneath the ridge between the nostrils (three steps in 5 minutes, four in 10). In each area you observe every sensation, and a drawing shows where. Reminders come every few minutes, more sparsely in longer sittings: about every five minutes in the hour. Tap Mind wandered each time you notice you've drifted. Noticing is the skill being trained, so every tap is part of the practice.",
      ev: "Anapana is the first stage of the residential Vipassana course, which was followed by lower stress and higher well-being and mindfulness, partly lasting six months. Plain breath awareness slowed breathing in a controlled study. Mindfulness meditation programs have moderate evidence for anxiety (effect size 0.38), depression and pain.",
      cite: "Szekeres & Wertheim 2015 · Telles et al. 2014 · Goyal et al. 2014"
    },
    {
      id: "metta", name: "Loving-Kindness", lengths: [10, 15], min: 10, strength: 2,
      tone: "stim",
      blurb: "Silently offer simple wishes of safety, health and ease to yourself, then to others, widening the circle step by step.",
      build: function (min) { return lovingKindness(min); },
      how: "Six stages: yourself, someone kind to you, a friend, someone neutral, someone mildly difficult, then everyone. The phrases are spoken slowly; repeat them silently.",
      ev: "A meta-analysis of 24 studies found medium effects of loving-kindness meditation on daily positive emotions, and stronger effects when the focus was loving-kindness rather than compassion.",
      cite: "Zeng et al. 2015"
    },
    {
      id: "self-compassion", name: "Self-Compassion Break", min: 5, strength: 2,
      tone: "stim",
      blurb: "Three short steps for a hard moment: name it, remember that others feel it too, and offer yourself some kindness.",
      build: function () {
        return [
          G(40, "Bring it to mind", ["Think of something that's troubling you right now, something of moderate weight.",
            "Notice where you feel it in your body."], { vis: "glow" }),
          G(70, "This is hard", ["Say to yourself: this is a moment of difficulty.", "Or: this hurts. This is stress.",
            "Acknowledge it, just as it is."], { vis: "glow" }),
          G(70, "Part of being human", ["Difficulty is part of being human. Other people feel this way too.",
            "Everyone struggles sometimes. You share this with many others."], { vis: "glow" }),
          G(80, "Kindness", ["Place your hands over your heart, or anywhere that feels soothing. Feel their warmth.",
            "Say to yourself: may I be kind to myself.", "Or whatever you need to hear: may I accept myself as I am. May I be patient."], { vis: "glow" }),
          G(40, "Closing", ["Take a slow breath and let the words settle.", "Come back to the room when you're ready."], { vis: "glow" })
        ];
      },
      how: "Kristin Neff's self-compassion break: mindfulness, common humanity and self-kindness, about a minute each, with a hand on the heart.",
      ev: "Across 27 randomised trials, self-compassion interventions reduced rumination, stress, depression, anxiety and self-criticism (moderate to large effects). Those were multi-week programs; this 5-minute break is their most-used single exercise, not tested on its own.",
      cite: "Ferrari et al. 2019"
    },
    {
      id: "grounding", name: "5-4-3-2-1 Grounding", min: 5, strength: 1,
      tone: "relax",
      blurb: "When anxiety spirals: find 5 things you can see, 4 you can hear, 3 you can feel, 2 you can smell and 1 you can taste. Tap each one.",
      build: function () {
        return [
          G(20, "Look around", ["Keep your eyes open. You'll name things around you, one sense at a time. Tap the button for each one you find."]),
          Ct(70, 5, "5 things you can see", ["Look around and find five things you can see. Name each one to yourself, with a detail: its colour, its shape."], { sense: "see" }),
          Ct(60, 4, "4 things you can hear", ["Now listen. Find four things you can hear, near or far."], { sense: "hear" }),
          Ct(55, 3, "3 things you can feel", ["Find three things you can feel: your feet on the floor, the fabric on your skin, the air."], { sense: "feel" }),
          Ct(45, 2, "2 things you can smell", ["Two things you can smell, or two smells you remember and like."], { sense: "smell" }),
          Ct(35, 1, "1 thing you can taste", ["One thing you can taste, or one taste you enjoy."], { sense: "taste" }),
          G(30, "Breathe", ["Take two slow breaths, with a long exhale.", "Notice that you're here, now."])
        ];
      },
      how: "Five senses, counted down. Each tap marks one thing found; a step moves on when you've found them all or its time runs out.",
      ev: "A widely taught clinical grounding skill for panic and dissociation. We found no trials testing it on its own; it's included because it is simple, safe and shifts attention outward to the senses.",
      cite: "Clinical practice; no direct trials"
    },
    {
      id: "walking", name: "Walking Meditation", min: 10, strength: 1,
      tone: "relax", voice: true,
      blurb: "Walk slowly and attend to each step: lifting, moving, placing. Phone in your pocket, voice guidance on.",
      build: function () {
        return [
          G(60, "Stand still", ["Find a quiet path of ten to twenty steps, indoors or out.", "Stand at one end and feel your weight in your feet.",
            "Keep your eyes open, gaze soft and a few steps ahead."]),
          G(180, "Slow steps", [[0, "Begin to walk, much slower than usual."], [30, "Notice the lifting of the foot, the moving forward, the placing down."],
            [80, "At the end of your path, pause, turn slowly, and continue."], [130, WANDER]]),
          G(180, "Whole body", [[0, "Widen your attention to the whole body walking: the arms, the balance, the breath."],
            [70, "Let your pace be natural but unhurried."], [130, "If thoughts pull you away, come back to the sensations of the next step: lifting, moving, placing."]]),
          G(120, "Surroundings", [[0, "Now open to the surroundings: sounds, light, the air on your skin."], [60, "Keep a little attention in your feet as you take it all in."]]),
          G(60, "Closing", ["Let your steps come to rest, and stand for a few breaths.", "Observe the sensations in your feet and legs before you move on."])
        ];
      },
      how: "Ten minutes in four stages: standing, slow steps, the whole body, then the surroundings. Works indoors on a short path.",
      ev: "Walking itself reduced depressive symptoms in a meta-analysis of 75 randomised trials (standardised mean difference −0.59). Walking meditation adds a mindfulness focus; trials of it are smaller and mostly in older adults.",
      cite: "Xu et al. 2024 · Goyal et al. 2014"
    },

    /* ===== reflection ===== */
    {
      id: "nvc-self", name: "Self-Empathy (NVC)", reflect: true, selfPaced: true, est: 15, strength: 1, tone: "ther",
      blurb: "Nonviolent communication turned inward: write what happened, hear out your judgments and question the rules behind them, then find the feelings and needs underneath, and a request you can act on.",
      build: function () { return nvcSelfSteps(); },
      how: "Self-paced, with short pauses between the parts: what happened, written the way a camera would record it; your judgments, uncensored; one of the rules behind them, questioned; where you feel it in your body; your feelings, picked from a feelings wheel of 88 words in 11 families (or a plain list, or your own words), and your needs; a guess at the other person's; and a request. Gentle checks point out words that carry a judgment, and feelings that are really interpretations of what someone did. You end with your own NVC sentence.",
      ev: "In a randomised study with 312 medical students, two and a half days of NVC training raised self-rated empathy three months later, though not other measures of empathy, and reviews call the evidence promising but methodologically weak. The parts this practice leans on are better supported: putting feelings into words dampens their intensity, telling emotions apart precisely goes with healthier coping under stress, and writing about difficult experiences has a small, reliable benefit across many trials.",
      cite: "Epinat-Duclos et al. 2021 · Torre & Lieberman 2018 · Kashdan et al. 2015 · Frattaroli 2006"
    },
    {
      id: "nvc-choose", name: "Have-Tos into Choices (NVC)", reflect: true, selfPaced: true, est: 10, strength: 1, tone: "ther",
      blurb: "List what you do because you feel you have to, should or must, then check each one: would you still choose it, and for what? Marshall Rosenberg's exercise from Nonviolent Communication, ending with each rewritten as “I choose to… because I want…”.",
      build: function () { return nvcChooseSteps(); },
      how: "List the things you feel you have to, should or must do. Then for each, decide whether you'd still choose it, and why, picking from common reasons or writing your own. Reasons that are really pressure, like money, approval, or avoiding guilt, shame or punishment, are marked. You end with your list rewritten as \u201CI choose to\u2026 because I want\u2026\u201D, and the ones you'd like to change.",
      ev: "This exercise comes from Marshall Rosenberg's book and hasn't been tested on its own. Motivation research points the same way: in self-determination theory, acting from your own values goes with more well-being and persistence than acting from pressure, guilt or the need for approval.",
      cite: "Ryan & Deci 2000"
    },

    /* ===== relaxation and sleep ===== */
    {
      id: "pmr", name: "Progressive Muscle Relaxation", min: 12, strength: 2,
      tone: "relax", lie: true, voice: true,
      blurb: "Tense each muscle group for a few seconds, then let go and feel the difference. Fourteen groups, hands to feet.",
      build: function () {
        var s = [G(50, "Get comfortable", ["Lie down or sit with your back supported.",
          "You'll tense each muscle group firmly, at about half your strength, for about seven seconds, then release it for half a minute.",
          "Skip any area that's injured or cramps easily."], { body: ["all"] })];
        PMR_GROUPS.forEach(function (g) { s.push(Pm(g[0], g[1], g[2])); });
        s.push(G(80, "Whole body", ["Now scan through the whole body. If any area is still tight, let it soften.",
          "Feel the whole body heavy, loose and warm.", "Breathe slowly and enjoy it."], { body: ["all"] }));
        return s;
      },
      how: "Jacobson's technique in a shortened form: 14 muscle groups, 7 seconds of tension and 30 of release each, with the group lit on the body map.",
      ev: "In a randomised comparison, 20 minutes of progressive muscle relaxation increased felt relaxation and produced a steady physiological relaxation trend (skin conductance and heart rate), where deep breathing briefly raised arousal first. Relaxation training is a conditionally recommended treatment for chronic insomnia.",
      cite: "Toussaint et al. 2021 · Edinger et al. 2021 (AASM)"
    },
    {
      id: "shuffle", name: "Cognitive Shuffle", lengths: [10, 20], min: 10, strength: 1,
      tone: "ther", lie: true,
      blurb: "For a racing mind at bedtime: picture a series of random, unrelated things, one every few seconds, until sleep takes over.",
      build: function (min) { return shuffle(min); },
      how: "A simple word appears (and is said softly, with voice on) every 12 seconds. Picture each one, then let it go. Whenever sleep comes, let yourself drift off.",
      ev: "The idea is that scrambled, imagery-like thinking resembles the mind's own drift into sleep and crowds out worry. Its only test so far is a conference study of 154 students, where it matched structured problem-solving for reducing pre-sleep arousal. Promising but preliminary.",
      cite: "Beaudoin et al. 2016 (SLEEP abstract)"
    },

    /* ===== breathwork (pranayama) ===== */
    {
      id: "nadi", name: "Nadi Shodhana", lengths: [5, 10], min: 5, strength: 2,
      tone: "relax", sensor: "optional",
      blurb: "Alternate nostril breathing: in through one side, out through the other, switching each breath. The guide shows which nostril.",
      build: function (min) { return nadi(min); },
      how: "4 seconds in, 6 out, switching sides after each inhale: in left, out right, in right, out left. The nostril on screen lights up for each phase.",
      ev: "In 26 healthy men, 25 minutes of alternate nostril breathing lowered systolic blood pressure and raised RMSSD, a vagal heart-rate-variability measure; plain breath awareness slowed breathing too. An earlier small study found no clear change in heart-rate variability.",
      cite: "Telles et al. 2014 · Raghuraj et al. 1998"
    },
    {
      id: "bhramari", name: "Bhramari", min: 5, strength: 2,
      tone: "relax", sensor: "optional",
      blurb: "Humming bee breath: a quiet breath in, then a long, low hum on the way out. Simple, soothing, and easy to do with eyes closed.",
      build: function () {
        return [
          G(60, "How to hum", ["Sit comfortably and close your eyes.",
            "Breathe in through the nose. On the out-breath, keep the lips closed and teeth apart, and hum a soft, low mmm.",
            "If you like, close your ears gently with your thumbs to feel the hum inside your head."]),
          Br(210, "Humming breath", { inh: 4, sip: 0, hold: 0, exh: 8, rest: 0 },
            { labels: { "in": "Breathe in", out: "Hum" },
              hints: { "in": "Quietly, through the nose.", out: "Lips closed, a soft steady mmm. Feel the buzz in your face." } }),
          G(30, "Silence", ["Let the humming fade, and sit for a moment in the quiet.", "Notice any lingering vibration, and the stillness after it."])
        ];
      },
      how: "4 seconds in, 8 seconds of humming out: a long exhale with sound, which naturally slows the breath.",
      ev: "Humming raised nasal nitric oxide about 15-fold compared with quiet exhaling, by ventilating the sinuses. In a small pilot, humming breath raised heart-rate variability as much as slow-paced breathing did.",
      cite: "Weitzberg & Lundberg 2002 · Woo & Kim 2025"
    },
    {
      id: "ujjayi", name: "Ujjayi", min: 6, strength: 2,
      tone: "relax", sensor: "optional",
      blurb: "Ocean breath at six a minute, with the soft throat sound on the out-breath only: in a study of yoga beginners that kept the blood-pressure benefit of slow breathing, which the sound on both breaths took away.",
      build: function () {
        return [
          G(60, "Find the sound", ["Breathe out through an open mouth as if fogging a mirror: haaa. Feel the slight narrowing at the back of the throat.",
            "Now close the mouth and keep that narrowing on the out-breath. It makes a soft ocean sound.",
            "Breathe in quietly through the nose."]),
          Br(270, "Ocean breath", { inh: 5, sip: 0, hold: 0, exh: 5, rest: 0 },
            { labels: { "in": "Breathe in", out: "Ocean breath out" },
              hints: { "in": "Quietly through the nose.", out: "Throat slightly narrowed: a soft, steady ocean sound." } }),
          G(30, "Release", ["Let the throat relax and breathe normally.", "Observe the calm, and the breath settling at its own pace."])
        ];
      },
      how: "Even 5-second breaths in and out, six a minute, with the ujjayi sound on the exhale only.",
      ev: "In yoga beginners, slow breathing at six a minute raised baroreflex sensitivity and lowered blood pressure most with equal in and out breaths. Ujjayi on both phases removed the baroreflex gain, while ujjayi on the out-breath only kept it.",
      cite: "Mason et al. 2013"
    },
    {
      id: "dirga", name: "Three-Part Breath", min: 5, strength: 1,
      tone: "relax", sensor: "optional",
      blurb: "Dirga pranayama: fill the belly, then the ribs, then the chest, and empty in reverse. A slow, full breath that teaches diaphragmatic breathing.",
      build: function () {
        return [
          G(50, "Hands on", ["Sit or lie down. Rest one hand on your belly and one on your chest.",
            "On each in-breath, fill the belly first, then the ribs widen, then the chest rises.", "Breathe out from the top down."]),
          Br(220, "Three-part breath", { inh: 5, sip: 0, hold: 0, exh: 7, rest: 0 }, { mode: "dirga" }),
          G(30, "Natural breath", ["Let the breath return to its own rhythm.", "Notice where it moves now."])
        ];
      },
      how: "5 seconds in, 7 out, five a minute. The caption follows the breath through belly, ribs and chest.",
      ev: "No trials test the three-part sequence itself. It's a slow breath with a long exhale, and slow breathing reliably raises vagal heart-rate variability during and after practice.",
      cite: "Laborde et al. 2022 · Van Diest et al. 2014"
    },
    {
      id: "kapalabhati", name: "Kapalabhati", min: 6, strength: 1,
      tone: "stim", confirm: true,
      blurb: "Skull-shining breath: short, sharp exhales from the belly with passive inhales, in three rounds. An energising breath, for a lift in alertness.",
      caution: "Skip this one if you are pregnant, or have high blood pressure, heart disease, epilepsy, a hernia, recent abdominal surgery, glaucoma or a history of panic attacks. Do it seated, on an empty stomach, and stop if you feel dizzy or tingly.",
      build: function () {
        var rec = function (n) {
          return G(40, "Recover " + n, ["Breathe slowly and naturally.", "Notice the tingling and the energy. Let the breath settle."], { vis: "glow" });
        };
        return [
          G(80, "Technique", ["Sit tall with your hands on your knees.",
            "Each pump is a short, sharp exhale through the nose, made by pulling the belly in quickly.",
            "The inhale happens by itself as the belly relaxes. Keep the shoulders and face still.",
            "Follow the ticks: one pump each second. If you feel lightheaded, return to easy breathing."]),
          Pu(30, 1, "Round 1"), rec(1),
          Pu(30, 1, "Round 2"), rec(2),
          Pu(30, 1, "Round 3"), rec(3),
          G(45, "Sit quietly", ["Sit quietly with your eyes closed.", "Notice how alert you feel now."])
        ];
      },
      how: "Three rounds of 30 pumps at one a second, each followed by 40 seconds of easy breathing. Beginners' pace; trained practitioners go faster.",
      ev: "Kapalabhati raised the sympathetic share of heart-rate variability and lowered the vagal share, the opposite of slow breathing, so it suits waking up rather than winding down. Fast breathwork is the least-studied part of the breathwork evidence, and its safety profile needs more work.",
      cite: "Raghuraj et al. 1998 · Fincham et al. 2023"
    },
    {
      id: "wim-hof", name: "Wim Hof Breathing", lengths: [3, 4], lenUnit: "round", min: 3, strength: 1,
      tone: "stim", confirm: true, sensor: "optional", open: true,
      variant: { key: "breaths", label: "Breaths per round", opts: [[30, "30"], [40, "40"]], def: 30 },
      blurb: "Rounds of deep, full breaths, then a relaxed hold on empty lungs for as long as is comfortable, then one recovery breath held for 15 seconds.",
      caution: "Never do this in or near water, in a bath, while driving or standing: the breathing can make you faint without warning, and people have drowned combining it with water. Sit or lie down. Skip it if you are pregnant, or have epilepsy, heart disease, high blood pressure, or a history of fainting or panic attacks. Tingling and light-headedness are common; stop if you feel unwell.",
      build: function (rounds, breaths) { return wimHof(rounds, breaths); },
      how: "Each round is 30 (or 40) deep breaths, fully in through the belly and chest and let go, about 2.5 seconds each. Then breathe out and hold with empty lungs, and tap Breathe in when you feel the urge; the hold ends by itself at 3 minutes. A full recovery breath held for 15 seconds closes the round. Your hold times are shown at the end.",
      ev: "Men trained in the method (breathing, cold exposure and meditation) released more adrenaline and had a weaker inflammatory response and fewer flu-like symptoms after an endotoxin injection than untrained controls. A follow-up found the breathing alone produced the anti-inflammatory effect. A 2024 systematic review of eight small trials judged the risk of bias high and the evidence not yet strong enough to recommend the method. It is activating, raising adrenaline, rather than calming.",
      cite: "Kox et al. 2014 · Zwaag et al. 2022 · Almahayni & Hammond 2024"
    },

    {
      id: "tapping", name: "Tapping", tapping: true, open: true, min: 7, strength: 1, tone: "ther",
      variant: { key: "rounds", label: "Rounds", opts: [[2, "2"], [3, "3"]], def: 2 },
      blurb: "Rate what's bothering you, then tap nine acupressure points with your fingertips while saying a short phrase. Two or three rounds, then rate it again.",
      caution: "Tapping isn't a treatment for trauma or a mental-health condition. If strong feelings or memories come up, stop, breathe slowly and look around the room, and talk to a professional if it keeps happening. Tap gently.",
      build: function (len, rounds) { return tapSteps(rounds || 2); },
      how: "You rate the feeling from 0 to 10, then tap the side of the hand while saying a set-up statement, then tap down through eight points from the top of the head to under the arm, about seven times each, saying your phrase. Two rounds (or three, the last with calmer phrases), each followed by a breath and a new rating. Your ratings are shown at the end. You can also finish other practices with a short round.",
      ev: "Emotional Freedom Techniques pair tapping on acupressure points with focusing on the problem and a self-acceptance statement. Reviews, many written by the method's own proponents, report less anxiety, stress and depression than waiting lists. Whether the tapping itself matters is less clear: across the few studies that compared real points with sham or no tapping, the advantage for real points was moderate and only borderline significant.",
      cite: "Church et al. 2018 · Church et al. 2022 · Choi et al. 2025"
    },

    {
      id: "power-nap", name: "Power Nap", nap: true, open: true, lengths: [10, 20, 30], min: 20, strength: 2,
      lenFmt: function (m) { return m + " min nap"; },
      sensor: "best", sensorWhy: "times the nap from when your heart rate says you've dozed off", lie: true, voice: true,
      audio: { dyn: true, start: 6, cat: "relax", band: "Theta to delta, then up to alpha to wake", name: "Nap beat", carrier: 180, fade: 6 },
      blurb: "A short nap that wakes you gently. With your heart sensor it estimates when you dozed off from your heart rate, and times the nap from there.",
      caution: "The sleep estimate comes from heart rate alone, so treat it as a guide. Don't nap this way when you need to be somewhere on time: keep a normal alarm as a backup.",
      build: function (len) { return powerNap(len || 20); },
      how: "Lie down and rest. Over the first two and a half minutes your resting heart rate is measured. When the one-minute average then stays at least 3 bpm (or 4%) lower for three minutes, you've probably drifted into light sleep, and you'll be woken that many minutes later. With no sign of sleep after 20 minutes you're woken anyway; with no sensor, after the nap length plus five minutes. You wake to rising chimes, a vibration and a beat that climbs back to alpha. The beat during the nap slides from 6 Hz to 3 Hz.",
      ev: "After a short night, a 10-minute afternoon nap improved alertness and performance straight away, with some gains lasting about two and a half hours; 20 minutes helped from about half an hour after waking, and 30 minutes brought grogginess first. Heart rate drops at each transition from waking into light sleep, which is what the estimate relies on, though that was measured in only six sleepers.",
      cite: "Brooks & Lack 2006 · Burgess et al. 1999"
    },

    /* ===== movement ===== */
    yogaPractice("standing-flow", { stand: true,
      blurb: "Nine standing poses, held for a few breaths each: mountain, reach, side bends, forward fold, chair, the warriors, triangle and tree." }),
    yogaPractice("standing-reset", { stand: true,
      blurb: "A five-minute break from the desk: mountain, reach, side bends, a forward fold and chair." }),
    yogaPractice("morning-yoga", { stand: true,
      blurb: "A brisk sequence to wake the body: reach and fold, plank, downward dog, low lunges, warrior II and goddess." }),
    yogaPractice("back-hips", { lie: true,
      blurb: "Gentle floor work for a stiff back and tight hips: cat and cow, child's pose, lunges, sphinx, bridge and a twist, ending in rest." }),
    yogaPractice("evening-floor", { lie: true,
      blurb: "A slow seated and lying sequence for the evening, ending with legs up the wall and a long rest." }),
    yogaPractice("balance-yoga", { stand: true,
      blurb: "Tree, warrior III and dancer, with mountain and chair to steady you. Keep a wall within reach." }),
    yogaPractice("morning-stretch", { stand: true, strength: 1,
      blurb: "Ten minutes to loosen up after sleep: neck rolls, arm circles, twists, hip circles, squats, then calf, quad and chest stretches.",
      ev: STRETCH_EV, cite: "Montero-Marín et al. 2013" }),
    yogaPractice("evening-stretch", { lie: true, strength: 1,
      blurb: "Slow floor stretches to let the day go: neck and side stretches, cat-cow, hips and hamstrings, a twist and a long rest.",
      ev: STRETCH_EV, cite: "Montero-Marín et al. 2013" }),
    yogaPractice("solo-capoeira", { stand: true, room: true, rhythm: true, strength: 1, tone: "stim",
      blurb: "A warm-up, then the ginga, dodges, the negativa and two kicks to a berimbau, a free ginga to play with, and a cool-down stretch.",
      caution: "Capoeira asks a lot of the knees, hips and ankles. Squat and kick only as deep and as high as is comfortable, keep clear space around you, and skip the moves that hurt.",
      ev: CAPO_EV, cite: "Köhler et al. 2025" })
  ];

  /* Words for the cognitive shuffle: concrete, neutral, easy to picture. */
  var SHUFFLE_WORDS = ("apple,anchor,acorn,balloon,basket,beach,bell,bicycle,blanket,boat,book,bottle,bread,bridge,broom,bucket,butterfly,cabin," +
    "cake,candle,canoe,carrot,castle,cat,cherry,chair,chess,cloud,clock,coconut,compass,cookie,cottage,cow,crayon,cup,daisy,desk,dolphin," +
    "door,duck,eagle,easel,egg,elephant,envelope,feather,fence,fern,field,fig,fireplace,flag,flower,flute,fork,fountain,fox,garden,gate," +
    "giraffe,glove,goat,grape,guitar,hammock,harbour,hat,hay,hedgehog,hill,honey,horse,island,jar,jellyfish,kettle,key,kite,kitten,ladder," +
    "lake,lamp,lantern,leaf,lemon,lighthouse,lily,map,maple,marble,meadow,melon,mitten,moon,moss,mountain,mug,nest,notebook,oak,oar," +
    "orange,otter,owl,paintbrush,palm,panda,paper,parrot,peach,pear,pebble,pen,pencil,penguin,piano,pillow,pine,pineapple,plum,pond," +
    "pumpkin,quilt,rabbit,rainbow,raft,river,road,robin,rope,rose,sailboat,sandcastle,scarf,seashell,sheep,shell,slipper,snail,snowflake," +
    "sock,spoon,squirrel,star,strawberry,stream,sunflower,swan,swing,table,teapot,tent,tomato,towel,tractor,train,tree,tulip,turtle," +
    "umbrella,valley,vase,violin,wagon,waterfall,whale,wheat,window,windmill,wool,yacht,zebra").split(",");

