
  /* ------------------------------ moving practices ------------------------------
     Mobility drills, stretches and basic capoeira, drawn with the same figure as the
     asanas. A move loops through its keys (see figFrame): `cycle` is one loop in
     seconds, or `beats` counts it in beats of the berimbau. `fig` is the still drawing
     used in lists. Capoeira moves alternate sides inside the loop, the way they're drilled.
  ------------------------------------------------------------------------------ */

  var ARMS_DOWN = { armR: [188, 182], armL: [172, 178] };
  function FX(view, o, a, b) { var f = F(view, o, a); for (var k in b || {}) f[k] = b[k]; return f; }

  /* ----- mobility keys ----- */
  var NECK = function (h) { return FX("front", { torso: 0, head: h }, STAND_LEGS, ARMS_DOWN); };
  var ARM_CIRC = function (a) { return F("side", { torso: 0, head: 0, arm: [a, a], leg: [180, 180] }); };
  var WIDE = { legR: [186, 180], legL: [174, 180] };
  var TWIST = FX("front", { torso: 0, head: -10, armR: [-112, -150], armL: [-138, -96] }, WIDE);
  var TW_MID = FX("front", { torso: 0 }, WIDE, ARMS_DOWN);
  var HIPS = F("front", { torso: 5, pelvis: -4, armR: [205, 140], armL: [155, 220], legR: [183, 179], legL: [163, 167] });
  var SQ_UP = F("side", { torso: 0, head: 0, arm: [180, 180], leg: [180, 180] });
  var SQ_DN = F("side", { torso: -40, head: 28, arm: [-86, -86], leg: [-100, 152] });

  /* ----- capoeira keys: side view (ginga, kicks forward) ----- */
  var PAR_S = F("side", { torso: -15, head: 10, arm: [-150, -25], leg: [-152, 160] });                       // paralela
  var BASE_N = F("side", { torso: -25, head: 15, arm: [-62, 8], arm2: [172, -150], leg: [151, 151], leg2: [-140, 172], over: ["arm"] });
  var BASE_F = F("side", { torso: -25, head: 15, arm: [172, -150], arm2: [-62, 8], leg: [-140, 172], leg2: [151, 151] });
  var COC_N = F("side", { torso: -38, head: 25, arm: [-66, -5], arm2: [176, 176], leg: [-72, 150], over: ["arm"] });
  var COC_F = F("side", { torso: -38, head: 25, arm: [176, 176], arm2: [-66, -5], leg: [-72, 150] });
  var NEG_N = F("side", { torso: -50, head: 30, arm: [172, 160], arm2: [-60, 5], leg: [-100, -102], leg2: [-60, 145] });
  var NEG_F = F("side", { torso: -50, head: 30, arm: [-60, 5], arm2: [172, 160], leg: [-60, 145], leg2: [-100, -102], over: ["arm"] });
  var BEN_K = F("side", { torso: 10, head: -12, arm: [-40, 0], arm2: [160, -150], leg: [-60, 175], leg2: [178, 180], over: ["arm"] });
  var BEN_P = F("side", { torso: 22, head: -22, arm: [-30, 0], arm2: [160, -150], leg: [-86, -88], leg2: [175, 180], over: ["arm"] });
  function farSide(f) {   // the same side-view pose with near and far limbs swapped
    var g = figWith(f, { arm: f.arm2 || f.arm, arm2: f.arm, leg: f.leg2 || f.leg, leg2: f.leg });
    g.over = f.over ? [] : ["arm"];
    return g;
  }
  /* front view (sideways moves, the crescent kick, the cartwheel) */
  var PAR_F = F("front", { torso: 0, head: 0, armR: [205, 20], armL: [155, -20], legR: [208, 168], legL: [152, 192] });
  var ESQ = F("front", { torso: -56, head: 26, armR: [212, 196], armL: [-100, -20], legR: [-115, 165], legL: [134, 134], over: ["armL"] });
  var MLF1 = F("front", { torso: 8, head: -8, armR: [-150, -30], armL: [150, 60], legR: [-125, -125], legL: [178, 182] });
  var MLF2 = F("front", { torso: 12, head: -10, armR: [-150, -30], armL: [120, 80], legR: [-12, -12], legL: [178, 182], over: ["legR"] });
  var MLF3 = F("front", { torso: 8, head: -6, armR: [-130, -60], armL: [140, 60], legR: [70, 70], legL: [178, 182], over: ["legR"] });
  var AU0 = F("front", { torso: 0, armR: [-30, -30], armL: [30, 30], legR: [200, 196], legL: [160, 164] });
  var AU1 = F("front", { torso: -100, head: 0, armR: [200, 200], armL: [-40, -40], legR: [240, 150], legL: [30, 30] });
  var AU2 = F("front", { torso: 180, head: 0, armR: [180, 180], armL: [180, 180], legR: [35, 35], legL: [-35, -35] });
  var AU3 = F("front", { torso: 100, head: 0, armR: [-20, -20], armL: [160, 160], legR: [10, 10], legL: [-150, 200] });

  function M(o) { if (!o.fig) o.fig = o.keys[o.still || 0]; o.move = true; return o; }
  var MOVES = [
    /* ----- mobility: moving ----- */
    M({ id: "neckrolls", en: "Neck Rolls", sa: "Slow half circles", cat: "mobility", pos: "stand", hold: 40, level: 1,
      keys: [NECK(-40), NECK(0), NECK(40), NECK(0)], cycle: 10, dwell: 0.3,
      cues: ["Neck rolls. Let your right ear drop toward your right shoulder.",
        "Roll the chin slowly down across the chest and up to the left. Then back the other way.", "Small and slow. Keep the shoulders soft."],
      caution: "Keep to half circles and skip the head-back part, which can pinch the neck." }),
    M({ id: "armcircles", en: "Arm Circles", sa: "Big circles, backwards", cat: "mobility", pos: "stand", hold: 40, level: 1,
      keys: [ARM_CIRC(180), ARM_CIRC(270), ARM_CIRC(0), ARM_CIRC(90)], cycle: 4, lin: true, dwell: 0, still: 1,
      cues: ["Arm circles. Swing both arms forward and up, over the top and down behind you.",
        "Big, slow circles. Let the shoulder blades move.", "Breathe in as the arms rise, out as they fall."] }),
    M({ id: "twists", en: "Standing Twists", sa: "Loose arms swinging", cat: "mobility", pos: "stand", hold: 40, level: 1,
      keys: [TWIST, TW_MID, figMirror(TWIST), TW_MID], cycle: 3.2, dwell: 0.08,
      cues: ["Standing twists. Feet hip-width apart, knees soft. Turn from side to side and let the arms swing loosely.",
        "Let the arms wrap around you. Look over each shoulder as you turn.", "Easy and rhythmic. Let the back heel turn with you."] }),
    M({ id: "hipcircles", en: "Hip Circles", sa: "Hands on hips", cat: "mobility", pos: "stand", hold: 40, level: 1,
      keys: [HIPS, figMirror(HIPS)], cycle: 4, dwell: 0,
      cues: ["Hip circles. Hands on your hips, feet a little wider than the hips, knees soft.",
        "Draw slow circles with your hips, as if stirring a big pot.", "After a few circles, change direction."] }),
    M({ id: "squats", en: "Slow Squats", sa: "Sit back, stand tall", cat: "mobility", pos: "stand", hold: 45, level: 2,
      keys: [SQ_UP, SQ_DN], cycle: 4, dwell: 0.15, still: 1,
      cues: ["Slow squats. Feet hip-width apart. Sit back as if onto a chair, arms reaching forward.",
        "Down for two counts, up for two. Knees follow the toes.", "Only go as low as feels easy. Breathe out as you stand."],
      caution: "Keep the squat shallow if your knees complain." }),
    M({ id: "catcowflow", en: "Cat-Cow Flow", sa: "Marjaryasana-Bitilasana", cat: "mobility", pos: "fours", hold: 60, level: 1,
      keys: [ASANA.cow.fig, ASANA.cat.fig], cycle: 7, dwell: 0.2,
      cues: ["Cat-cow. On your hands and knees, breathe in and let the belly drop as you lift the chest.",
        "Breathe out and round the back up, tucking the chin.", "Move with the breath, slowly, one vertebra at a time."] }),

    /* ----- mobility: still stretches ----- */
    { id: "chestopener", en: "Chest Opener", sa: "Hands clasped behind", cat: "mobility", pos: "stand", hold: 30, level: 1,
      fig: F("side", { torso: 5, head: 12, bend: -4, arm: [128, 124], leg: [180, 180] }),
      cues: ["Chest opener. Interlace your fingers behind your back, or hold a towel between your hands.",
        "Draw the shoulder blades together and lift the chest. Keep the chin level.", "Breathe into the front of the chest."] },
    { id: "quadstretch", en: "Standing Quad Stretch", sa: "Heel toward the seat", cat: "mobility", pos: "stand", sides: true, hold: 30, level: 1,
      fig: F("side", { torso: -8, head: 6, arm: [158, 158], arm2: [-62, -42], leg: [168, 20], leg2: [180, 180] }),
      cues: ["Quad stretch, {S} leg. Stand on your {O} foot, bend the {S} knee and hold the {S} foot behind you.",
        "Knees side by side, tailbone heavy. Feel the stretch along the front of the thigh.", "Hold a wall if you wobble."] },
    { id: "calfstretch", en: "Wall Calf Stretch", sa: "Back heel down", cat: "mobility", pos: "stand", sides: true, hold: 30, level: 1,
      fig: F("side", { torso: -25, head: 15, arm: [-78, -78], leg: [150, 150], leg2: [-140, 165], wall: -84 }),
      cues: ["Calf stretch, {S} leg. Hands on a wall, step the {S} foot back and press the heel down.",
        "Bend the front knee and lean in until you feel the {S} calf.", "Keep the back leg straight, toes pointing forward."] },
    { id: "hamstring", en: "Lying Hamstring Stretch", sa: "Supta Padangusthasana", cat: "mobility", pos: "supine", sides: true, hold: 40, level: 1,
      fig: F("side", { torso: -90, head: 0, arm: [20, 20], leg: [-5, -5], leg2: [90, 90], strap: true }),
      cues: ["Hamstring stretch, {S} leg. Lie on your back and loop a towel or belt around the {S} foot.",
        "Raise the {S} leg toward the ceiling, keeping a soft knee. The {O} leg rests long, or bent with the foot down.", "Breathe, and let the leg come a little closer as you breathe out."] },
    { id: "reclinedbutterfly", en: "Reclined Butterfly", sa: "Supta Baddha Konasana", cat: "mobility", pos: "supine", hold: 60, level: 1,
      fig: F("front", { top: true, torso: 0, armR: [222, 222], armL: [138, 138], legR: [220, 132], legL: [140, 228] }),
      cues: ["Reclined butterfly. Lying on your back, bring the soles of the feet together and let the knees fall open.",
        "Cushions under the knees if the hips are tight. Arms resting.", "Let gravity open the hips. Breathe slowly."] },
    { id: "seatedside", en: "Seated Side Stretch", sa: "Parsva Sukhasana", cat: "mobility", pos: "seat", sides: true, hold: 30, level: 1,
      fig: F("front", { torso: -18, head: -6, armR: [197, 197], armL: [-25, -50], legR: [-118, 88], legL: [118, -88] }),
      cues: ["Seated side stretch to the {S}. Sit cross-legged, {S} hand on the floor beside you.",
        "Sweep the {O} arm up and over, leaning to the {S}.", "Breathe into the long {O} side of the ribs."] },
    { id: "neckside", en: "Seated Neck Stretch", sa: "Ear toward shoulder", cat: "mobility", pos: "seat", sides: true, hold: 30, level: 1,
      fig: F("front", { torso: 0, head: -32, armR: [-40, 80], armL: [160, 160], legR: [-118, 88], legL: [118, -88], over: ["armR"] }),
      cues: ["Neck stretch to the {S}. Sit tall and let your {S} ear drop toward your {S} shoulder.",
        "Rest the {S} hand lightly on your head, letting its weight do the work. Let the {O} shoulder sink.", "Breathe into the side of the neck."] },

    /* ----- capoeira ----- */
    M({ id: "ginga", en: "Ginga", sa: "The rocking base step", cat: "capoeira", pos: "stand", hold: 60, level: 1, rhythm: true,
      keys: [PAR_S, BASE_N, PAR_S, BASE_F], beats: 4, dwell: 0.2, still: 1,
      cues: ["Ginga. Feet wide and knees bent. Step one foot back and bring that forearm up in front of your face.",
        "Step back to the middle, then the other foot back, other arm up.", "Lean forward a little and keep the knees soft. Move with the berimbau."] }),
    M({ id: "esquiva", en: "Esquiva Lateral", sa: "Side dodge", cat: "capoeira", pos: "stand", hold: 45, level: 1, rhythm: true,
      keys: [PAR_F, ESQ, PAR_F, figMirror(ESQ)], beats: 8, dwell: 0.3, still: 1,
      cues: ["Esquiva lateral. From the wide stance, squat low and lean your chest toward one knee.",
        "Cover your head with the opposite forearm. Come back up, and go to the other side.", "Keep the eyes forward, on your imaginary partner."] }),
    M({ id: "cocorinha", en: "Cocorinha", sa: "Squat dodge", cat: "capoeira", pos: "stand", hold: 45, level: 1, rhythm: true,
      keys: [PAR_S, COC_N, PAR_S, COC_F], beats: 8, dwell: 0.3, still: 1,
      cues: ["Cocorinha. Drop into a deep squat with the feet flat, one forearm guarding your head.",
        "The other hand can touch the floor beside you. Come up, and guard with the other arm next time.", "Keep the hips higher if your ankles or knees are stiff."],
      caution: "Squat only as deep as your knees allow." }),
    M({ id: "negativa", en: "Negativa", sa: "Low escape", cat: "capoeira", pos: "stand", hold: 60, level: 2, rhythm: true,
      keys: [COC_N, NEG_N, COC_F, NEG_F], beats: 8, dwell: 0.3, still: 1,
      cues: ["Negativa. From the squat, put one hand on the floor beside the hip and slide that leg out along the floor.",
        "Sit on the other foot, keep your weight forward, and guard your face with the free forearm.", "Back to the squat, then the other side."],
      caution: "A deep knee bend: keep the supporting foot flat and the hips higher if your knees complain." }),
    M({ id: "meialua", en: "Meia-Lua de Frente", sa: "Half-moon kick", cat: "capoeira", pos: "stand", hold: 60, level: 2, rhythm: true,
      keys: [figWith(PAR_F, { d: 1.4 }), figWith(MLF1, { d: 0.5 }), figWith(MLF2, { d: 0.5 }), figWith(MLF3, { d: 0.8 }),
        figWith(PAR_F, { d: 1.4 }), figWith(figMirror(MLF1), { d: 0.5 }), figWith(figMirror(MLF2), { d: 0.5 }), figWith(figMirror(MLF3), { d: 0.8 })],
      beats: 8, dwell: 0.1, still: 2,
      cues: ["Meia-lua de frente. From the wide stance, swing one straight leg up from the outside, across in front of you, and down.",
        "Turn the standing foot out a little. Arms swing the other way for balance.", "Land back in the wide stance, then kick with the other leg."],
      caution: "Keep the kick low until your hips are warm." }),
    M({ id: "bencao", en: "Bênção", sa: "Push kick", cat: "capoeira", pos: "stand", hold: 60, level: 2, rhythm: true,
      keys: [BASE_N, figWith(BEN_K, { d: 0.5 }), figWith(BEN_P, { d: 0.7 }), BASE_N, PAR_S,
        BASE_F, figWith(farSide(BEN_K), { d: 0.5 }), figWith(farSide(BEN_P), { d: 0.7 }), BASE_F, PAR_S],
      beats: 10, dwell: 0.15, still: 2,
      cues: ["Bênção. From the ginga, bring the back knee up in front of you.",
        "Push the sole of the foot forward at belly height, leaning back a little. Then step back into the ginga.", "A pushing kick with the flat of the foot. Change legs each time."] }),
    M({ id: "au", en: "Aú", sa: "Capoeira cartwheel", cat: "capoeira", pos: "stand", hold: 45, level: 3, rhythm: true,
      keys: [figWith(AU0, { d: 2 }), figWith(AU1, { d: 0.6 }), figWith(AU2, { d: 0.6 }), figWith(AU3, { d: 0.6 }),
        figWith(AU0, { d: 2 }), figWith(figMirror(AU1), { d: 0.6 }), figWith(figMirror(AU2), { d: 0.6 }), figWith(figMirror(AU3), { d: 0.6 })],
      beats: 12, dwell: 0.1, still: 2,
      cues: ["Aú. From a wide stance, turn one foot out, reach down to the side and place one hand, then the other.",
        "Kick the legs over and land one foot at a time, facing the same way. Keep your eyes forward.", "Go back the other way. Bent knees and a low aú are fine."],
      caution: "Only if you can already take your weight on your hands. Skip it with wrist or shoulder problems, glaucoma or high blood pressure, and give yourself plenty of clear space." })
  ];
  MOVES.forEach(function (a) { ASANAS.push(a); ASANA[a.id] = a; });

  /* Built-in routines that use the moves (they're also starting points in the builder). */
  var CAP_FREE = ["Free ginga. Keep the ginga going and mix in what you've practised: an esquiva, a cocorinha, a negativa, a kick.",
    "Play with the rhythm, as if someone were in front of you.", "Last few bars. Keep breathing."];
  YOGA_SETS.push(
    { id: "morning-stretch", name: "Morning Stretch", items: [
      { id: "mountain", hold: 25 }, { id: "neckrolls", hold: 40 }, { id: "armcircles", hold: 40 }, { id: "twists", hold: 40 },
      { id: "sidebend", hold: 25 }, { id: "hipcircles", hold: 40 }, { id: "squats", hold: 45 }, { id: "fold", hold: 40 },
      { id: "halflift", hold: 20 }, { id: "calfstretch", hold: 30 }, { id: "quadstretch", hold: 30 }, { id: "chestopener", hold: 30 },
      { id: "salute", hold: 25 }, { id: "mountain", hold: 25 }] },
    { id: "evening-stretch", name: "Evening Stretch", items: [
      { id: "easy", hold: 45 }, { id: "neckside", hold: 30 }, { id: "seatedside", hold: 30 }, { id: "catcowflow", hold: 60 },
      { id: "child", hold: 45 }, { id: "lowlunge", hold: 30 }, { id: "hamstring", hold: 40 }, { id: "reclinedbutterfly", hold: 60 },
      { id: "supinetwist", hold: 45 }, { id: "kneeschest", hold: 40 }, { id: "corpse", hold: 120 }] },
    { id: "solo-capoeira", name: "Solo Capoeira", items: [
      { id: "neckrolls", hold: 40 }, { id: "armcircles", hold: 40 }, { id: "hipcircles", hold: 40 }, { id: "squats", hold: 45 }, { id: "twists", hold: 35 },
      { id: "ginga", hold: 120 }, { id: "esquiva", hold: 60 }, { id: "ginga", hold: 40 }, { id: "cocorinha", hold: 45 }, { id: "negativa", hold: 60 },
      { id: "ginga", hold: 40 }, { id: "meialua", hold: 75 }, { id: "bencao", hold: 75 },
      { id: "ginga", hold: 90, title: "Free ginga", cues: CAP_FREE },
      { id: "quadstretch", hold: 30 }, { id: "calfstretch", hold: 30 }, { id: "chestopener", hold: 30 }, { id: "fold", hold: 40 }, { id: "mountain", hold: 30 }],
      intro: ["Find a clear space with room to step and kick, on a floor with good grip. Barefoot or trainers.",
        "A gentle warm-up comes first, then the ginga and a few basic moves to the berimbau. Go as low and as big as feels good today."],
      outro: ["Stand tall and let the breath slow down.", "Notice the warmth in your legs. Muito bem."] }
  );
