  /* ----------------------------------- movement -----------------------------------
     Dance Break and the Eight Brocades, from the brain-wave guide's "Movement and exercise": in a 2024 network
     meta-analysis of exercise for depression, dance brought the largest reduction, and tai chi or qigong a
     moderate one (Learn, #l-dance). New techniques: both practices carry sup: true (their entries are in
     practice-data.js), and so do the qigong moves in the movement library, which open with a donation in the
     routine builder too (yoga.js); their pages, drawings, cautions and evidence stay free to read.
       Dance Break      free dance to the music made on the device (music.js, through the practice's `music`
                        and each step's `bpm`): shake out, sway, bigger moves and freestyle, the tempo rising
                        from 100 to 124 beats a minute, then a cool down at 100; standing or seated, to your own
                        music if you like, with your mood before and after; a ring on the stage pulses with the
                        music's beat, the four beats of the bar round it (dncDraw)
       Eight Brocades   Baduanjin: a standing post, then the eight movements, each set up in a short step and
                        then a breath step on the breathing guide's engine (its tones, chimes or vibration, and
                        "Breath 3 of 8"), with a drawing that moves with each breath in and out (qgFrame), and
                        gathering at the end; as many breaths each as fit the length at your pace
     The movements are moves of their own (cat "qigong"): each key of a move's loop carries `b: "in"` or
     `b: "out"` where that breath begins, so a breath step sets the figure where the breath is. `ready` is
     the stance before the first breath, when the loop starts mid-way (a punch, a sway, a fold). In a
     routine of your own they loop at ten seconds a breath, as the other moves do, and say which breath.
  ------------------------------------------------------------------------------ */

  /* ----- the qigong moves ----- */
  var QG_FEET = { legR: [186, 180], legL: [174, 180] };        // feet a little wider than the hips
  var QG_TOG = { legR: [181, 180], legL: [179, 180] };         // feet together
  var QG_WIDE = { legR: [195, 195], legL: [165, 165] };        // a wide stance, legs straight
  var QG_HORSE = { legR: [-140, 172], legL: [140, -172] };     // the horse stance: feet wide, knees bent
  var QG_BELLY = { armR: [175, 156], armL: [185, -156] };      // hands in front of the belly, palms up
  var QG_CHEST = { armR: [200, 60], armL: [160, -60] };        // hands in front of the chest
  var QG_DOWN = { armR: [186, 184], armL: [174, 176] };        // arms by the sides
  // a key: the view, the arms and legs, and the rest (torso, head, b: the breath that begins here, d, w)
  function QK(view, arms, legs, x) { var f = F(view, arms, legs); for (var k in x || {}) f[k] = x[k]; return f; }
  function QG(o) {
    o.cat = "qigong"; o.pos = "stand"; o.sup = true;
    if (!o.keys) return o;
    o.cycle = 10 * o.keys.filter(function (k) { return k.b === "in"; }).length;     // ten seconds a breath in a routine
    return M(o);
  }
  var QG_BOW = QK("front", { armR: [-90, 62], armL: [90, 88] }, QG_HORSE, { torso: 0, b: "out", d: 6, w: 0.15 });      // the bow drawn to the left
  var QG_SEP = QK("front", { armR: [3, -3], armL: [172, 160] }, QG_FEET, { torso: 0, b: "out", d: 6, w: 0.12 });         // the right hand up
  var QG_OWL = QK("front", { armR: [204, 208], armL: [156, 152] }, QG_FEET, { torso: 0, head: -8, b: "out", d: 6, w: 0.2 });
  var QG_SWAY = QK("front", { armR: [201, 120], armL: [148, 148] }, QG_HORSE, { torso: -25, head: -12, pelvis: 5, b: "in", d: 4 });   // down to the right
  var QG_MID = QK("front", { armR: [200, 176], armL: [160, -176] }, QG_HORSE, { torso: 0, b: "out", d: 6, w: 0.1 });   // hands on the thighs
  var QG_FIST = [147, 235], QG_PUNCH = [-95, -92];
  var QG_SIDE = { leg: [-150, 157] };                          // the horse stance from the side
  var QG_MOVES = [
    QG({ id: "qg-sky", en: "Holding Up the Sky", sa: "Liang shou tuo tian", hold: 60, level: 1, qin: "press up", qout: "float down", still: 2,
      keys: [QK("front", QG_BELLY, QG_FEET, { torso: 0, b: "in", d: 2 }), QK("front", QG_CHEST, QG_FEET, { torso: 0, d: 2 }),
        QK("front", { armR: [-4, 6], armL: [4, -6] }, QG_FEET, { torso: 0, b: "out", d: 3, w: 0.15 }),
        QK("front", { armR: [-100, -100], armL: [100, 100] }, QG_FEET, { torso: 0, d: 3 })],
      cues: ["Holding up the sky. Stand with your feet a little apart, and interlace your fingers in front of your belly, palms up.",
        "Breathe in as your hands rise up the front of your body, turning the palms up to the sky above your head. Breathe out as your arms float down at your sides.",
        "Press up through the heels of your hands, and let the whole body lengthen.", "Let your shoulders soften as your arms come down."] }),
    QG({ id: "qg-bow", en: "Drawing the Bow", sa: "Zuo you kai gong", hold: 60, level: 2, qin: "draw the bow", qout: "come back", still: 1,
      keys: [QK("front", QG_CHEST, QG_WIDE, { torso: 0, b: "in", d: 4 }), QG_BOW, QK("front", QG_CHEST, QG_WIDE, { torso: 0, b: "in", d: 4 }),
        figWith(figMirror(QG_BOW), { b: "out" })],
      cues: ["Drawing the bow. Step your feet wide, and cross your wrists in front of your chest.",
        "Breathe in as you sink into a horse stance and draw the bow: one arm pushes out to the side, index finger up, and the other pulls back like a bowstring. Breathe out as you rise and bring your hands back. Then the other side.",
        "Follow the outstretched hand with your eyes.", "Open your chest wide as you draw."],
      caution: "Sink into the horse stance only as low as your knees like." }),
    QG({ id: "qg-raise", en: "Separating Heaven and Earth", sa: "Tiao li pi wei", hold: 60, level: 1, qin: "press up and down", qout: "hands together", still: 1,
      keys: [QK("front", QG_BELLY, QG_FEET, { torso: 0, b: "in", d: 4 }), QG_SEP, QK("front", QG_BELLY, QG_FEET, { torso: 0, b: "in", d: 4 }),
        figWith(figMirror(QG_SEP), { b: "out" })],
      cues: ["Separating heaven and earth. Stand with your feet a little apart, hands in front of your belly, palms up.",
        "Breathe in as one hand presses up above your head and the other presses down beside your hip. Breathe out as they come back together in front of you. Then change hands.",
        "Reach up and press down at the same time: a long stretch through each side of your body.", "Keep the top elbow soft."] }),
    QG({ id: "qg-owl", en: "The Wise Owl Looks Back", sa: "Wu lao qi shang", hold: 60, level: 1, qin: "look back", qout: "face the front", still: 1,
      keys: [QK("front", QG_DOWN, QG_FEET, { torso: 0, b: "in", d: 4 }), QG_OWL, QK("front", QG_DOWN, QG_FEET, { torso: 0, b: "in", d: 4 }),
        figWith(figMirror(QG_OWL), { b: "out" })],
      cues: ["The wise owl looks back. Stand tall, arms by your sides.",
        "Breathe in as you turn your head slowly to look over one shoulder, your palms turning out. Breathe out as you come back to the front. Then the other way.",
        "Turn only as far as is easy, and keep your shoulders level.", "Let your chest open as the palms turn."] }),
    QG({ id: "qg-sway", en: "Swaying Head and Tail", sa: "Yao tou bai wei", hold: 60, level: 2, qin: "back to the middle", qout: "sway", still: 2, ready: QG_MID,
      keys: [figWith(figMirror(QG_SWAY), { b: "in" }), QG_MID, QG_SWAY, figWith(QG_MID, {})],
      cues: ["Swaying head and tail. Feet wide, knees bent in a horse stance, hands resting on your thighs.",
        "On each breath out, sway your upper body down towards one knee while your hips swing the other way. On each breath in, come back up to the middle. A side at a time.",
        "Keep it small and smooth, with your neck soft.", "Let the sway come from your waist and hips."],
      caution: "Keep the sway small with a stiff neck or back, sink only as low as your knees like, and come up slowly if you feel dizzy." }),
    QG({ id: "qg-feet", en: "Hands to the Feet", sa: "Liang shou pan zu", hold: 60, level: 2, qin: "reach up", qout: "fold down", still: 0, headDown: true,
      ready: F("side", { torso: 0, head: 0, arm: [180, 180], leg: [180, 180] }),
      keys: [F("side", { torso: -150, head: 0, arm: [121, 188], leg: [-176, 176], b: "in", d: 2 }),
        F("side", { torso: -55, head: 0, arm: [-62, -62], leg: [-178, 178], d: 2 }),
        F("side", { torso: 0, head: -6, arm: [-8, -6], leg: [180, 180], b: "out", d: 1.4, w: 0.12 }),
        F("side", { torso: 0, head: 0, arm: [156, -64], leg: [180, 180], d: 1.2 }),
        F("side", { torso: -15, head: 0, arm: [114, 194], leg: [180, 180], d: 1.6 }),
        F("side", { torso: -100, head: 0, arm: [128, 126], leg: [-178, 178], d: 1.8 })],
      cues: ["Hands to the feet. Stand with your feet hip-width apart, knees soft.",
        "Breathe in as you reach your arms forward and up above your head. Breathe out as your hands come down to your chest, round to your lower back, and slide down the backs of your legs as you fold forward.",
        "Bend your knees as much as you like, and let your head hang.", "Come up slowly, arms reaching forward."],
      caution: "Bend your knees as much as you need. Keep the fold small, or skip it, with back pain, glaucoma or high blood pressure that isn't under control, and come up slowly." }),
    QG({ id: "qg-punch", en: "Punching with Fierce Eyes", sa: "Zan quan nu mu", hold: 60, level: 2, qin: "draw back", qout: "punch", still: 2,
      ready: F("side", { torso: 0, head: 0, arm: QG_FIST, arm2: QG_FIST, leg: QG_SIDE.leg }),
      keys: [F("side", { torso: 0, head: 0, arm: QG_FIST, arm2: QG_PUNCH, leg: QG_SIDE.leg, b: "in", d: 4 }),
        F("side", { torso: 0, head: 0, arm: QG_FIST, arm2: QG_FIST, leg: QG_SIDE.leg, b: "out", d: 6, w: 0.1 }),
        F("side", { torso: 0, head: 0, arm: QG_PUNCH, arm2: QG_FIST, leg: QG_SIDE.leg, b: "in", d: 4 }),
        F("side", { torso: 0, head: 0, arm: QG_FIST, arm2: QG_FIST, leg: QG_SIDE.leg, b: "out", d: 6, w: 0.1 })],
      cues: ["Punching with fierce eyes. Sink into a horse stance, fists at your waist.",
        "On each breath out, punch slowly forward, turning the fist over, eyes wide and fierce. On each breath in, open the hand, grasp, and draw the fist back to your waist. Left and right in turn.",
        "Punch from the legs up, slowly, with the whole body.", "Keep your shoulders low and your eyes on the fist."],
      caution: "Sink into the horse stance only as low as your knees like." }),
    QG({ id: "qg-bounce", en: "Bouncing on the Toes", sa: "Bei hou qi dian", hold: 70, level: 1, qin: "rise", qout: "drop gently", still: 0,
      keys: [QK("front", QG_DOWN, QG_TOG, { torso: 0, b: "in", d: 4 }), QK("front", QG_DOWN, QG_TOG, { torso: 0, lift: 7, b: "out", d: 6, w: 0.75 })],
      cues: ["Bouncing on the toes. Feet together, arms by your sides.",
        "Breathe in as you rise onto your toes, lifting through the crown of your head. Breathe out as you drop gently back onto your heels, and let your body shake.",
        "Land softly, and let a little shake travel up through your body.", "Keep your knees soft as you land."],
      caution: "Keep the drop small and soft with sore knees, ankles or back, or lower your heels slowly instead. Hold a chair if your balance is unsteady." }),
    QG({ id: "qg-post", en: "Standing Post", sa: "Zhan zhuang", hold: 60, level: 1,
      fig: F("front", { torso: 0, armR: [205, 65], armL: [155, -65] }, QG_FEET),
      cues: ["Standing post. Feet a little apart, knees soft, arms rounded in front of you as if holding a large ball.",
        "Let your weight sink into your feet, and your shoulders drop.", "Breathe slowly and softly, as still as a tree."] })
  ];
  QG_MOVES.forEach(function (a) { ASANAS.push(a); ASANA[a.id] = a; });
  var QG_SET = ["qg-sky", "qg-bow", "qg-raise", "qg-owl", "qg-sway", "qg-feet", "qg-punch", "qg-bounce"];   // the Eight Brocades, in order
  var QG_NAME = "Qigong moves in the Routine builder";        // Settings' list of what the donation unlocks

  /* ----- a move with the breath ----- */
  // where each breath begins in a move's loop, as key indexes [{ i: in, o: out }], worked out once
  function qgMarks(a) {
    if (a._qg) return a._qg;
    var m = [];
    (a.keys || []).forEach(function (k, i) {
      if (k.b === "in") m.push({ i: i, o: i });
      else if (k.b === "out" && m.length) m[m.length - 1].o = i;
    });
    return (a._qg = m);
  }
  // the loop's phase for breath b (from 0), "in" or "out", u of the way through it
  function qgPhase(a, b, k, u) {
    var mv = movePrep(a), m = qgMarks(a), x = m[b % m.length], nx = m[(b + 1) % m.length];
    var p0 = k === "in" ? mv.at[x.i] : mv.at[x.o], p1 = k === "in" ? mv.at[x.o] : mv.at[nx.i];
    if (p1 <= p0) p1 += 1;
    return (p0 + (p1 - p0) * Math.max(0, Math.min(1, u))) % 1;
  }
  /* The figure where the breath is, in a breath step: the ready stance while you get ready; the first breath
     in from there to where the move begins; then each breath in and out through the loop. With reduced
     motion, the pose each breath is moving towards, without the glide. */
  function qgFrame(a, S) {
    var m = qgMarks(a), mv = movePrep(a);
    if (!S || !S.live || S.lead || !S.L) return a.ready ? { f: a.ready, dx: 0 } : figFrame(a, mv.at[m[0].i]);
    var b = S.L.count, k = S.L.p.k === "in" ? "in" : "out", u = S.L.prog;
    if (b === 0 && k === "in" && a.ready) {
      var first = figFrame(a, mv.at[m[0].o]);
      if (RM) return first;
      var e = (1 - Math.cos(Math.PI * u)) / 2;
      return { f: figLerp(a.ready, first.f, e), dx: first.dx * e };
    }
    if (RM) return figFrame(a, qgPhase(a, b, k, 1));
    return figFrame(a, qgPhase(a, b, k, u));
  }
  function qgSVG(m) { var fr = qgFrame(m.a, frameState()); return figSVG(fr.f, m.side, "", m.box, fr.dx); }
  // a breath step's figure, redrawn when it changes (practice.js pMoveFig)
  function qgDraw(m) {
    var h = qgSVG(m);
    if (h !== m.svg) { m.svg = h; $("#sFig").innerHTML = h; }
  }
  // the ring round the figure grows with each breath in and settles with each breath out; still with reduced motion
  function qgRing(c, W, Hh, col) {
    var S = frameState(), lv = RM || !S.live || S.lead ? 0.5 : S.level, cx = W / 2, cy = Hh / 2, R = Math.min(W, Hh) * 0.47, r = R * (0.84 + 0.16 * lv);
    c.strokeStyle = rgba(col, 0.16 + 0.3 * lv); c.lineWidth = 2.5;
    c.beginPath(); c.arc(cx, cy, r, 0, Math.PI * 2); c.stroke();
  }
  // in a routine of your own, where a move loops by the clock: which breath it is now
  function qgBreathAt(a, ph) {
    var mv = movePrep(a), k = "out";
    qgMarks(a).forEach(function (x) { if (ph >= mv.at[x.i] - 1e-9 && ph < mv.at[x.o]) k = "in"; });
    return k;
  }
  function qgPoseSub(a, s, T) { return a.sa + " · breathe " + qgBreathAt(a, pMovePhase(a, s, T)); }

  /* ----- the Eight Brocades ----- */
  var QG_HOW = 12, QG_LEAD = 3;          // seconds to set up each movement; the breathing guide's "get ready" before its first breath
  // breaths for each movement: the most of eight, six or four (or two) that fit the length at your pace with a minute
  // or more left to stand, and seven bounces on the toes (three at a very slow pace)
  function qgFit(T, cyc) {
    var left = function (r, bo) {
      return QG_SET.reduce(function (t, id, i) { return t - QG_HOW - Math.round(QG_LEAD + (i === 7 ? bo : r) * cyc); }, T);
    };
    var reps = [8, 6, 4, 2];
    for (var i = 0; i < reps.length; i++) if (left(reps[i], 7) >= 60) return { r: reps[i], bo: 7, left: left(reps[i], 7) };
    return { r: 2, bo: 3, left: left(2, 3) };
  }
  // a reminder on the first breath in after `after` seconds, if it falls well inside the step
  function qgAt(cyc, after, secs) { var t = QG_LEAD + Math.ceil(Math.max(0, after - QG_LEAD) / cyc) * cyc; return t < secs - 4 ? Math.round(t) : -1; }
  function qgSteps(d, min) {
    var T = (min || 15) * 60, pc = pPace(d), t = { inh: pc.inh, sip: 0, hold: 0, exh: pc.exh, rest: 0 }, cyc = pc.inh + pc.exh, fit = qgFit(T, cyc);
    var open = Math.max(30, Math.round(fit.left / 2 / 5) * 5), close = fit.left - open, st = [];
    st.push(G(open, "Standing post", [[0, "Stand with your feet a little apart, knees soft, arms rounded in front of you as if holding a large ball."],
      [frac(open, 0.33), "Let your weight sink into your feet, your shoulders drop, and your breath slow down."],
      [frac(open, 0.66), "Each movement follows your breath: in as you open, rise or reach, out as you close, lower or sink. The drawing moves with you."]],
      { pose: "qg-post", sub: "Zhan zhuang" }));
    QG_SET.forEach(function (id, i) {
      var a = ASANA[id], n = i === 7 ? fit.bo : fit.r, secs = Math.round(QG_LEAD + n * cyc), lines = [[0, a.cues[1]]];
      var t2 = n >= 4 ? qgAt(cyc, 22, secs) : -1, t3 = t2 > 0 && n >= 6 ? qgAt(cyc, t2 + 16, secs) : -1;
      if (t2 > 0) lines.push([t2, a.cues[2]]);
      if (t3 > t2) lines.push([t3, a.cues[3]]);
      st.push(G(QG_HOW, a.en, [[0, a.cues[0]]], { pose: id, sub: a.sa }));
      st.push(Br(secs, a.en, t, { count: n, pose: id, labels: { "in": "Breathe in, " + a.qin, out: "Breathe out, " + a.qout }, lines: lines }));
    });
    st.push(G(close, "Gathering", [[0, "Bring your hands to rest on your lower belly, one over the other."],
      [frac(close, 0.3), "Stand still and breathe softly. Notice how your body feels now."],
      [frac(close, 0.7), "Take one more slow breath, and let your hands float down to your sides."]], { pose: "qg-post", sub: "Shou shi" }));
    return st;
  }

  /* ----- Dance Break ----- */
  // each part: its name, beats a minute, its share of the time, and the prompts standing and seated
  var DNC_PARTS = [
    ["Shake out", 100, 2,
      ["Shake out your hands, loose at the wrists.", "Now your arms and shoulders, then one leg and the other.", "Bounce gently through your knees with the beat.", "Let your whole body jiggle loose."],
      ["Sit near the front of your chair, feet flat, and shake out your hands.", "Shrug your shoulders up, and let them drop on the beat.", "Tap your feet, one and then the other.", "Let your arms and shoulders jiggle loose."]],
    ["Sway", 106, 3,
      ["Step from side to side with the beat: step, touch, step, touch.", "Let your arms swing loosely with you.", "Add a sway in your hips, and roll your shoulders.", "Find the beat and ride it, easy and loose."],
      ["Sway your upper body from side to side with the beat.", "Let your arms swing, and roll your shoulders.", "Nod your head gently in time.", "Find the beat and ride it, easy and loose."]],
    ["Bigger moves", 114, 3,
      ["Bigger now: reach your arms up and out as you step.", "March on the spot, knees higher, arms pumping.", "Clap on the beat, then reach high to one side and the other.", "Step forward and back, and turn a little each time.", "Punch the air, up and out, left and right."],
      ["Bigger now: reach up, one arm and then the other, as if climbing a ladder.", "March your feet as you sit, arms pumping.", "Clap above your head, then down by your knees.", "Punch forward, left and right, on the beat.", "Twist from side to side, arms swinging round."]],
    ["Freestyle", 124, 4,
      ["Freestyle: move any way you like. Nobody's watching.", "Copy a robot, a bird, a pop star.", "Make it big, then tiny, then big again.", "Let a different part of you lead: your hips, your shoulders, your elbows.",
        "Draw shapes in the air with your hands, and follow them.", "Last stretch of freestyle: enjoy every beat."],
      ["Freestyle in your seat: arms, shoulders, head and feet, any way you like.", "Copy a robot, a bird, a pop star.", "Make it big, then tiny, then big again.", "Let a different part of you lead: your shoulders, your elbows, your hands.",
        "Draw shapes in the air, and follow them with your eyes.", "Last stretch of freestyle: enjoy every beat."]],
    ["Cool down", 100, 2,
      ["Slow it down: an easy sway from side to side.", "Arms rise as you breathe in, and float down as you breathe out.", "Let your breathing settle, with a long breath out.", "Shake out your hands one last time."],
      ["Slow it down: a gentle sway in your seat.", "Arms rise as you breathe in, and float down as you breathe out.", "Let your breathing settle, with a long breath out.", "Shake out your hands one last time."]]
  ];
  // the prompts spread evenly through a part
  function dncLines(lines, secs) { return lines.map(function (l, i) { return [Math.round(secs * i / lines.length * 10) / 10, l]; }); }
  function dncSteps(d, min) {
    var T = (min || 10) * 60, seat = pChoice(d, "how") === "seat", own = pChoice(d, "music") === "own", mood = pChoice(d, "mood") === "on", rate = 25;
    var sh = shares(T - (mood ? 2 * rate + 15 : 0), DNC_PARTS.map(function (p) { return [p[0], p[2]]; })), st = [];
    var mr = function (title, line) {               // the same 0 to 10 scale before and after, set side by side at the end
      return TRate(title, line, { cap: rate, ends: ["Very low", "As good as it gets"], sub: "0 is very low, 10 is as good as it gets", bpm: 100, musLvl: 0.4 });
    };
    if (mood) st.push(mr("How's your mood?", "Before you dance: how is your mood right now, from zero to ten? Tap a number."));
    DNC_PARTS.forEach(function (p, i) {
      var secs = sh[p[0]], lines = (seat ? p[4] : p[3]).slice();
      if (!i) lines.unshift(own ? "Start your own music now, something you love to move to." : seat ? "Here's the music. Sit tall, with room for your arms." : "Here's the music. Find some room around you.");
      st.push(G(secs, p[0], dncLines(lines, secs), { vis: own ? "orb" : "dance", bpm: p[1], musLvl: i === DNC_PARTS.length - 1 ? 0.6 : 1,
        sub: own ? "To your own music" : p[1] + " beats a minute" }));
    });
    if (mood) {                                     // and a moment after it, so a tap moves on rather than waiting out the rating's time
      st.push(mr("And now?", "And now: how is your mood, from zero to ten?"));
      st.push(G(15, "Notice", [[0, "Notice how you feel now: your breath, your heartbeat, your face."]], { vis: "glow", bpm: 100, musLvl: 0.4 }));
    }
    return st;
  }
  // where the music's beat is: from the music's own clock while it plays (music.js), else from the step's tempo
  function dncBeat(s, st) { return MUS.on && A.ctx ? musBeatAt(A.ctx.currentTime) : st * (s.bpm || 110) / 60; }
  /* The stage: a ring that pulses on each beat, strongest on the first of the bar, with the bar's four beats
     round it and the one now lit; still with reduced motion. */
  function dncDraw(c, W, Hh, s, st, col) {
    var cx = W / 2, cy = Hh / 2, R = Math.min(W, Hh) * 0.3, b = dncBeat(s, st), n = Math.floor(b), bar = ((n % 4) + 4) % 4, live = !RM && b >= 0;
    var k = live ? Math.exp(-(b - n) * 5) * (bar === 0 ? 1 : 0.6) : 0, r = R * (0.9 + 0.12 * k);
    var g = c.createRadialGradient(cx, cy, r * 0.1, cx, cy, r * 1.5);
    g.addColorStop(0, rgba(col, 0.12 + 0.3 * k)); g.addColorStop(1, rgba(col, 0));
    c.fillStyle = g; c.beginPath(); c.arc(cx, cy, r * 1.5, 0, Math.PI * 2); c.fill();
    c.strokeStyle = rgba(col, 0.3 + 0.55 * k); c.lineWidth = 2 + 3 * k;
    c.beginPath(); c.arc(cx, cy, r, 0, Math.PI * 2); c.stroke();
    for (var i = 0; i < 4; i++) {
      var an = -Math.PI / 2 + i * Math.PI / 2, on = live && i === bar;
      c.fillStyle = rgba(col, on ? 0.95 : 0.3);
      c.beginPath(); c.arc(cx + Math.cos(an) * R * 1.25, cy + Math.sin(an) * R * 1.25, on ? 6 : 4, 0, Math.PI * 2); c.fill();
    }
  }

  // whatever shows the qigong moves' cups: the routine builder, if it's open (supporter.js supRefresh)
  function mvtUI() { if (curView === "yoga") { yRenderLib(); yRenderSeq(); } }
  function mvtInit() {
    SUP_EXTRA.push({ name: QG_NAME, href: "#yoga" });          // Settings' list of what the donation unlocks
    if (window.__entrain) {                                   // for automated tests only
      var X = window.__entrain;
      X.QG_SET = QG_SET; X.DNC_PARTS = DNC_PARTS; X.qgMarks = qgMarks; X.qgPhase = qgPhase; X.qgFrame = qgFrame; X.qgFit = qgFit; X.dncBeat = dncBeat;
      X.figMove = figMove; X.figSVG = figSVG; X.figFrame = figFrame; X.figBox = figBox; X.movePrep = movePrep; X.frameState = frameState; X.MUS = MUS;
    }
  }
