
  /* ------------------------------- asana library -------------------------------
     Each pose is drawn from joint angles, so every figure has the same proportions.
     Angles are degrees with 0 pointing up, 90 right, 180 down and -90 left. Front
     views face you (your right side is on the left of the picture); side views face
     left. A two-sided pose is described for the right side and mirrored for the left.
     Cues are spoken; {S} is the working side and {O} the other side.
  ------------------------------------------------------------------------------ */

  var FIG = { torso: 68, neck: 19, upper: 32, fore: 30, thigh: 52, shin: 52, hipW: 9, shW: 17, head: 12.5 };
  function fDir(a) { var r = a * Math.PI / 180; return [Math.sin(r), -Math.cos(r)]; }
  function fAdd(p, a, len) { var d = fDir(a); return [p[0] + d[0] * len, p[1] + d[1] * len]; }

  /* Joint positions for a pose, with the hip at the origin. */
  function figPts(f) {
    var o = { hip: [0, 0] }, t = f.torso || 0;
    o.neck = fAdd(o.hip, t, FIG.torso);
    o.head = fAdd(o.neck, t + (f.head || 0), FIG.neck);
    var sb = fAdd(o.neck, t + 180, 6);
    if (f.view === "front") {
      var pa = t + 90, pp = f.pelvis !== undefined ? f.pelvis + 90 : pa;
      o.shR = fAdd(sb, pa, -FIG.shW); o.shL = fAdd(sb, pa, FIG.shW);
      o.hipR = fAdd(o.hip, pp, -FIG.hipW); o.hipL = fAdd(o.hip, pp, FIG.hipW);
      o.elR = fAdd(o.shR, f.armR[0], FIG.upper); o.haR = fAdd(o.elR, f.armR[1], FIG.fore);
      o.elL = fAdd(o.shL, f.armL[0], FIG.upper); o.haL = fAdd(o.elL, f.armL[1], FIG.fore);
      o.knR = fAdd(o.hipR, f.legR[0], FIG.thigh); o.ftR = fAdd(o.knR, f.legR[1], FIG.shin);
      o.knL = fAdd(o.hipL, f.legL[0], FIG.thigh); o.ftL = fAdd(o.knL, f.legL[1], FIG.shin);
    } else {
      o.sh = sb;
      o.el = fAdd(sb, f.arm[0], FIG.upper); o.ha = fAdd(o.el, f.arm[1], FIG.fore);
      var a2 = f.arm2 || f.arm, l2 = f.leg2 || f.leg;
      o.el2 = fAdd(sb, a2[0], FIG.upper); o.ha2 = fAdd(o.el2, a2[1], FIG.fore);
      o.kn = fAdd(o.hip, f.leg[0], FIG.thigh); o.ft = fAdd(o.kn, f.leg[1], FIG.shin);
      o.kn2 = fAdd(o.hip, l2[0], FIG.thigh); o.ft2 = fAdd(o.kn2, l2[1], FIG.shin);
    }
    return o;
  }

  function figBounds(o) {
    var b = { minX: 1e9, maxX: -1e9, minY: 1e9, maxY: -1e9 };
    for (var k in o) {
      var r = k === "head" ? FIG.head + 3 : 4;
      b.minX = Math.min(b.minX, o[k][0] - r); b.maxX = Math.max(b.maxX, o[k][0] + r);
      b.minY = Math.min(b.minY, o[k][1] - r); b.maxY = Math.max(b.maxY, o[k][1] + r);
    }
    return b;
  }
  function figFlip(o, side) { if (side === "left") for (var k in o) o[k] = [-o[k][0], o[k][1]]; return o; }

  /* An SVG of the pose, framed so it sits on its ground line. A moving figure passes a
     fixed frame (box), so it doesn't change size, and each frame is set down on that floor. */
  function figSVG(f, side, cls, box, dx) {
    var o = figPts(f), k, flip = side === "left";
    if (dx) for (k in o) o[k] = [o[k][0] + dx, o[k][1]];
    figFlip(o, side);
    var b = figBounds(o), over = f.over || [], front = "";
    if (box && !f.top) {
      var dy = box.ground - 3 - b.maxY;
      for (k in o) o[k] = [o[k][0], o[k][1] + dy];
      b = figBounds(o);
    }
    var ground, w, h, x0, y0;
    if (box) { ground = box.ground; w = box.w; h = box.h; x0 = box.x0; y0 = box.y0; }
    else {
      ground = b.maxY + 3; w = Math.max(b.maxX - b.minX + 30, 200); h = Math.max(ground - b.minY + 26, 150);
      x0 = (b.minX + b.maxX) / 2 - w / 2; y0 = ground + 12 - h;
    }
    var P = function (p) { return p[0].toFixed(1) + " " + p[1].toFixed(1); };
    var seg = function (a, c, cl) { return '<path class="' + (cl || "") + '" d="M' + P(a) + "L" + P(c) + '"/>'; };
    var limb = function (a, m, c, cl) { return seg(a, m, cl) + seg(m, c, cl); };
    var h2 = "", far = function (p) { return [p[0] + (flip ? -4 : 4), p[1] - 2]; };
    var torso = f.bend
      ? (function () {
          var m = [(o.hip[0] + o.neck[0]) / 2, (o.hip[1] + o.neck[1]) / 2], n = fAdd([0, 0], (f.torso || 0) + 90, f.bend);
          if (flip) n[0] = -n[0];
          return '<path d="M' + P(o.hip) + "Q" + P([m[0] + n[0] * 2, m[1] + n[1] * 2]) + " " + P(o.neck) + '"/>';
        })()
      : seg(o.hip, o.neck);
    /* limbs listed in f.over pass in front of the face, so they're drawn after the head */
    var L = function (key, a, m, c, cl) { var t = limb(a, m, c, cl); if (over.indexOf(key) >= 0) front += t; else h2 += t; };
    if (f.view === "front") {
      h2 += torso + seg(o.shR, o.shL) + seg(o.hipR, o.hipL);
      L("armR", o.shR, o.elR, o.haR); L("armL", o.shL, o.elL, o.haL); L("legR", o.hipR, o.knR, o.ftR); L("legL", o.hipL, o.knL, o.ftL);
    } else {
      L("arm2", far(o.sh), far(o.el2), far(o.ha2), "far"); L("leg2", far(o.hip), far(o.kn2), far(o.ft2), "far");
      h2 += torso + seg(o.neck, o.sh);
      L("leg", o.hip, o.kn, o.ft); L("arm", o.sh, o.el, o.ha);
    }
    if (f.strap && f.view !== "front") h2 += '<path class="strap" d="M' + P(o.ha) + "L" + P(o.ft) + '"/>';
    if (f.wall) {
      var wx = o.hip[0] + (flip ? -1 : 1) * (f.wall === true ? 10 : f.wall);
      h2 += '<path class="gr" d="M' + wx.toFixed(1) + " " + ground.toFixed(1) + "V" + (b.minY - 4).toFixed(1) + '"/>';
    }
    h2 += seg(o.neck, o.head);   // the circle covers most of it; what shows is the neck, so a tilt reads
    h2 += '<circle class="hd" cx="' + o.head[0].toFixed(1) + '" cy="' + o.head[1].toFixed(1) + '" r="' + FIG.head + '"/>' + front;
    var base = f.top
      ? '<rect class="mat" x="' + (b.minX - 10).toFixed(1) + '" y="' + (b.minY - 8).toFixed(1) + '" width="' + (b.maxX - b.minX + 20).toFixed(1) + '" height="' + (b.maxY - b.minY + 16).toFixed(1) + '" rx="10"/>'
      : '<path class="gr" d="M' + (box ? box.x0 + 12 : b.minX - 10).toFixed(1) + " " + ground.toFixed(1) + "H" + (box ? box.x0 + w - 12 : b.maxX + 10).toFixed(1) + '"/>';
    return '<svg class="pose' + (cls ? " " + cls : "") + '" viewBox="' + x0.toFixed(1) + " " + y0.toFixed(1) + " " + w.toFixed(1) + " " + h.toFixed(1) + '" aria-hidden="true">' +
      base + h2 + "</svg>";
  }

  /* ----- moving figures -----
     A move is a loop of keyframes (a.keys) that the figure eases through, pausing
     briefly on each (dwell, or w on a key). A key's d sets how long the move to the
     next key takes, relative to the others; circles (lin) move at an even speed.
     Whatever stays on the floor from one key to the next (a planted foot, a hand)
     is held still, so feet don't skate while the body moves over them. */
  var FIG_NUM = ["torso", "head", "pelvis", "bend"], FIG_ARR = ["armR", "armL", "legR", "legL", "arm", "arm2", "leg", "leg2"];
  function fAng(x, y, u) { var d = ((y - x) % 360 + 540) % 360 - 180; return x + d * u; }   // the short way round
  function figLerp(a, c, u) {
    var f = { view: a.view, top: a.top, wall: a.wall, over: u < 0.5 ? a.over : c.over };
    FIG_NUM.forEach(function (k) {
      if (a[k] === undefined && c[k] === undefined) return;
      var x = a[k] !== undefined ? a[k] : k === "pelvis" ? (a.torso || 0) : 0, y = c[k] !== undefined ? c[k] : k === "pelvis" ? (c.torso || 0) : 0;
      f[k] = k === "bend" ? x + (y - x) * u : fAng(x, y, u);
    });
    FIG_ARR.forEach(function (k) {
      var x = a[k] || (k === "arm2" ? a.arm : k === "leg2" ? a.leg : null), y = c[k] || (k === "arm2" ? c.arm : k === "leg2" ? c.leg : null);
      if (x && y) f[k] = [fAng(x[0], y[0], u), fAng(x[1], y[1], u)];
    });
    return f;
  }
  function fNeg(a) { return a ? [-a[0], -a[1]] : a; }
  /* The same pose for the other side of the body (a mirror image). */
  function figMirror(f) {
    var m = { view: f.view, top: f.top, wall: f.wall }, sw = { armR: "armL", armL: "armR", legR: "legL", legL: "legR" };
    ["torso", "head", "pelvis"].forEach(function (k) { if (f[k] !== undefined) m[k] = -f[k]; });
    if (f.bend) m.bend = -f.bend;
    if (f.view === "front") { m.armR = fNeg(f.armL); m.armL = fNeg(f.armR); m.legR = fNeg(f.legL); m.legL = fNeg(f.legR); }
    else ["arm", "arm2", "leg", "leg2"].forEach(function (k) { if (f[k]) m[k] = fNeg(f[k]); });
    if (f.over) m.over = f.over.map(function (k) { return f.view === "front" ? sw[k] : k; });
    if (f.d) m.d = f.d;
    if (f.w !== undefined) m.w = f.w;
    return m;
  }
  function figWith(f, o) { var g = {}, k; for (k in f) g[k] = f[k]; for (k in o) g[k] = o[k]; return g; }
  function figLow(o) { var m = -1e9; for (var k in o) m = Math.max(m, o[k][1] + (k === "head" ? FIG.head + 3 : 4)); return m; }

  /* Timing and planted points for a move, worked out once. */
  function movePrep(a) {
    if (a._mv) return a._mv;
    var K = a.keys, n = K.length, P = K.map(figPts), tot = 0, i, at = [0], anc = [], off = [0];
    K.forEach(function (k) { tot += k.d || 1; });
    for (i = 0; i < n; i++) at.push(at[i] + (K[i].d || 1) / tot);
    for (i = 0; i < n; i++) {
      var p = P[i], q = P[(i + 1) % n], lp = figLow(p), lq = figLow(q), best = null, bd = 1e9;
      for (var j in p) {
        if (j === "head" || j === "neck" || !q[j]) continue;
        if (p[j][1] + 4 < lp - 5 || q[j][1] + 4 < lq - 5) continue;     // not on the floor at both ends
        var d = Math.abs(p[j][0] - q[j][0]);
        if (d < bd) { bd = d; best = j; }
      }
      anc.push(best);
      off.push(off[i] + (best ? p[best][0] - q[best][0] : 0));
    }
    return (a._mv = { at: at, anc: anc, off: off, P: P });
  }
  /* The pose at phase ph (0 to 1 through the loop), and how far to shift it sideways. */
  function figFrame(a, ph) {
    var mv = movePrep(a), K = a.keys, n = K.length, x = ((ph % 1) + 1) % 1, i = 0;
    while (i < n - 1 && x >= mv.at[i + 1]) i++;
    var u = (x - mv.at[i]) / (mv.at[i + 1] - mv.at[i]), dw = K[i].w !== undefined ? K[i].w : a.dwell !== undefined ? a.dwell : 0.2;
    u = u < dw ? 0 : (u - dw) / (1 - dw);
    if (!a.lin) u = (1 - Math.cos(Math.PI * u)) / 2;
    var f = figLerp(K[i], K[(i + 1) % n], u), j = mv.anc[i], dx = mv.off[i] - mv.off[n] * x;
    if (j) dx += mv.P[i][j][0] - figPts(f)[j][0];
    return { f: f, dx: dx };
  }
  /* One frame big enough for every position of a move, so the drawing doesn't jump in size. */
  function figBox(a, side) {
    var minX = 1e9, maxX = -1e9, minY = 1e9, n = Math.max(32, a.keys.length * 10);
    for (var i = 0; i < n; i++) {
      var fr = figFrame(a, i / n), o = figPts(fr.f), k;
      for (k in o) o[k] = [o[k][0] + fr.dx, o[k][1]];
      var b = figBounds(figFlip(o, side));
      minX = Math.min(minX, b.minX); maxX = Math.max(maxX, b.maxX); minY = Math.min(minY, b.minY - b.maxY);
    }
    var ground = 3, w = Math.max(maxX - minX + 30, 200), h = Math.max(ground - minY + 26, 150);
    return { x0: (minX + maxX) / 2 - w / 2, y0: ground + 12 - h, w: w, h: h, ground: ground };
  }
  function figMove(a, ph, side, cls, box) { var fr = figFrame(a, ph); return figSVG(fr.f, side, cls, box || figBox(a, side), fr.dx); }

  var STAND_LEGS = { legR: [181, 180], legL: [179, 180] };
  var W2_LEGS = { legR: [-118, 180], legL: [137, 137] };
  function F(view, o, legs) { var f = { view: view }; for (var k in legs || {}) f[k] = legs[k]; for (k in o) f[k] = o[k]; return f; }

  /* pos: where the body is (stand, fours, prone, seat, supine), used for transitions. */
  var ASANAS = [
    /* ----- standing ----- */
    { id: "mountain", en: "Mountain", sa: "Tadasana", cat: "standing", pos: "stand", hold: 30, level: 1,
      fig: F("front", { torso: 0, armR: [188, 182], armL: [172, 178] }, STAND_LEGS),
      cues: ["Mountain. Stand with your feet hip-width apart, weight spread through the whole foot.",
        "Knees soft, tailbone heavy. Lengthen up through the crown of your head.", "Let the shoulders drop. Breathe slowly."] },
    { id: "salute", en: "Upward Salute", sa: "Urdhva Hastasana", cat: "standing", pos: "stand", hold: 25, level: 1,
      fig: F("front", { torso: 0, armR: [-14, -4], armL: [14, 4] }, STAND_LEGS),
      cues: ["Upward salute. Breathe in and sweep your arms up overhead.", "Reach up through the fingertips, shoulders relaxed away from the ears."] },
    { id: "sidebend", en: "Standing Side Bend", sa: "Indudalasana", cat: "standing", pos: "stand", sides: true, hold: 25, level: 1,
      fig: F("front", { torso: -17, head: -4, armR: [-34, -20], armL: [-4, -26] }, STAND_LEGS),
      cues: ["Side bend to the {S}. Arms overhead, lean gently to your {S}.", "Feel the stretch along your {O} side. Breathe into the ribs.", "Keep both feet grounded."] },
    { id: "fold", en: "Standing Forward Fold", sa: "Uttanasana", cat: "standing", pos: "stand", hold: 40, level: 1, headDown: true,
      fig: F("side", { torso: -150, head: 0, arm: [200, 120], leg: [-176, 176] }),
      cues: ["Forward fold. Bend your knees and fold forward from the hips.", "Let the head and arms hang heavy. Bend the knees as much as you need.", "Sway a little if it feels good."],
      caution: "Keep the knees bent if your back or hamstrings are tight. Head-down poses aren't advised with glaucoma or uncontrolled high blood pressure." },
    { id: "halflift", en: "Halfway Lift", sa: "Ardha Uttanasana", cat: "standing", pos: "stand", hold: 20, level: 1,
      fig: F("side", { torso: -96, head: -8, arm: [140, 150], leg: [180, 180] }),
      cues: ["Halfway lift. Hands on your shins, lengthen the spine forward until your back is flat.", "Look at the floor a little ahead of you. Breathe."] },
    { id: "chair", en: "Chair", sa: "Utkatasana", cat: "standing", pos: "stand", hold: 30, level: 2,
      fig: F("side", { torso: -32, head: 0, arm: [-28, -24], leg: [-108, 158] }),
      cues: ["Chair. Bend your knees as if sitting back into a chair, and reach your arms up.", "Weight in the heels, knees over the ankles.", "Steady breath. Come up when you need to."],
      caution: "Sit back less deeply if your knees complain." },
    { id: "warrior1", en: "Warrior I", sa: "Virabhadrasana I", cat: "standing", pos: "stand", sides: true, hold: 35, level: 2,
      fig: F("side", { torso: 0, head: 0, arm: [-4, -2], leg: [-118, 180], leg2: [138, 138] }),
      cues: ["Warrior one, {S} side. Step your {O} foot back a long stride and bend the {S} knee over the ankle.",
        "Hips face forward. Reach your arms up.", "Strong legs, soft breath."] },
    { id: "warrior2", en: "Warrior II", sa: "Virabhadrasana II", cat: "standing", pos: "stand", sides: true, hold: 35, level: 2,
      fig: F("front", { torso: 0, armR: [-90, -90], armL: [90, 90] }, W2_LEGS),
      cues: ["Warrior two, {S} side. Feet wide, {S} toes forward, {S} knee bent over the ankle.",
        "Arms long at shoulder height. Gaze over your {S} hand.", "Sink into the legs and breathe."] },
    { id: "reverse", en: "Reverse Warrior", sa: "Viparita Virabhadrasana", cat: "standing", pos: "stand", sides: true, hold: 25, level: 2,
      fig: F("front", { torso: 18, head: 6, armR: [-8, 6], armL: [168, 172] }, W2_LEGS),
      cues: ["Reverse warrior. From warrior two, slide your {O} hand down the back leg and reach the {S} arm up and back.",
        "Keep the {S} knee bent. Breathe into the open side."] },
    { id: "sideangle", en: "Extended Side Angle", sa: "Utthita Parsvakonasana", cat: "standing", pos: "stand", sides: true, hold: 30, level: 2,
      fig: F("front", { torso: -58, head: -58, armR: [172, 168], armL: [-56, -56] }, W2_LEGS),
      cues: ["Extended side angle. From warrior two, rest your {S} forearm on your {S} thigh.",
        "Reach the {O} arm over your ear, one long line from the back foot to the fingertips.", "Breathe."] },
    { id: "triangle", en: "Triangle", sa: "Utthita Trikonasana", cat: "standing", pos: "stand", sides: true, hold: 35, level: 2,
      fig: F("front", { torso: -64, head: -64, armR: [180, 180], armL: [0, 0], legR: [-145, -145], legL: [145, 145] }),
      cues: ["Triangle, {S} side. Feet wide, both legs straight. Reach forward over the {S} leg.",
        "Lower your {S} hand to the shin and reach the {O} arm up.", "Open the chest to the side and breathe."] },
    { id: "pyramid", en: "Pyramid", sa: "Parsvottanasana", cat: "standing", pos: "stand", sides: true, hold: 30, level: 2, headDown: true,
      fig: F("side", { torso: -128, head: -10, arm: [-178, -176], leg: [-160, -160], leg2: [150, 150] }),
      cues: ["Pyramid. A shorter stance with the {S} foot forward, both legs straight.",
        "Hinge forward over the {S} leg, hands on the shin or on blocks.", "Lengthen the spine as you breathe in, fold a little as you breathe out."],
      caution: "Keep a micro-bend in the front knee if the hamstring pulls." },
    { id: "goddess", en: "Goddess", sa: "Utkata Konasana", cat: "standing", pos: "stand", hold: 30, level: 2,
      fig: F("front", { torso: 0, armR: [-90, 0], armL: [90, 0], legR: [-120, 175], legL: [120, -175] }),
      cues: ["Goddess. Step wide, toes turned out, and bend the knees over the toes.", "Arms in a cactus shape, palms forward.", "Sink a little lower and breathe."] },

    /* ----- balance ----- */
    { id: "tree", en: "Tree", sa: "Vrksasana", cat: "balance", pos: "stand", sides: true, hold: 35, level: 1,
      fig: F("front", { torso: 0, armR: [-14, 30], armL: [14, -30], legR: [-130, 100], legL: [179, 180] }),
      cues: ["Tree, {S} foot up. Shift your weight to the {O} foot and place the {S} sole on the calf or the inner thigh, above or below the knee.",
        "Hands at the chest or overhead. Find a still point to look at.", "Wobbling is part of it."],
      caution: "Keep a wall or chair within reach if balance is tricky." },
    { id: "warrior3", en: "Warrior III", sa: "Virabhadrasana III", cat: "balance", pos: "stand", sides: true, hold: 25, level: 3,
      fig: F("side", { torso: -86, head: 0, arm: [-88, -88], leg: [180, 180], leg2: [88, 88] }),
      cues: ["Warrior three. Stand on your {S} leg and tip forward, lifting the {O} leg behind you.",
        "Body and back leg in one long line. Arms forward or by your sides.", "Breathe, and come up slowly."],
      caution: "Keep fingertips on a chair back if you need support." },
    { id: "dancer", en: "Dancer", sa: "Natarajasana", cat: "balance", pos: "stand", sides: true, hold: 25, level: 3,
      fig: F("side", { torso: -25, head: -6, arm: [-55, -50], arm2: [117, 117], leg: [180, 180], leg2: [120, -10] }),
      cues: ["Dancer. Stand on your {S} leg, bend the {O} knee and hold the {O} foot behind you.",
        "Reach the {S} arm forward and press the foot into the hand as you tip forward.", "Breathe and find your still point."],
      caution: "Hold a wall with the free hand if you need to." },

    /* ----- all fours ----- */
    { id: "table", en: "Tabletop", sa: "Bharmanasana", cat: "fours", pos: "fours", hold: 20, level: 1,
      fig: F("side", { torso: -82, head: 0, arm: [180, 180], leg: [180, 90] }),
      cues: ["Tabletop. Hands under the shoulders, knees under the hips.", "Spine long and neutral. Breathe."] },
    { id: "cat", en: "Cat", sa: "Marjaryasana", cat: "fours", pos: "fours", hold: 20, level: 1, bend: 1,
      fig: F("side", { torso: -82, head: 50, bend: 13, arm: [180, 180], leg: [180, 90] }),
      cues: ["Cat. As you breathe out, round your back up toward the ceiling.", "Tuck the chin and the tailbone. Press the floor away."] },
    { id: "cow", en: "Cow", sa: "Bitilasana", cat: "fours", pos: "fours", hold: 20, level: 1,
      fig: F("side", { torso: -82, head: -40, bend: -9, arm: [180, 180], leg: [180, 90] }),
      cues: ["Cow. As you breathe in, let the belly drop and lift the chest and gaze.", "Broaden across the collarbones."] },
    { id: "child", en: "Child's Pose", sa: "Balasana", cat: "rest", pos: "fours", hold: 45, level: 1,
      fig: F("side", { torso: -99, head: 0, arm: [-120, -90], leg: [-120, 90] }),
      cues: ["Child's pose. Knees wide or together, sit back toward your heels and lay the chest down.",
        "Arms forward or alongside you. Forehead resting.", "Breathe into the back of the body."],
      caution: "Put a cushion under the hips or between the calves and thighs if the knees complain." },
    { id: "lowlunge", en: "Low Lunge", sa: "Anjaneyasana", cat: "fours", pos: "fours", sides: true, hold: 30, level: 1,
      fig: F("side", { torso: 4, head: 0, arm: [-6, -2], leg: [-95, -172], leg2: [162, 92] }),
      cues: ["Low lunge, {S} foot forward. Lower the {O} knee to the floor, cushioned if you like.",
        "Sink the hips forward and lift the arms.", "Feel the stretch at the front of the {O} hip."] },
    { id: "downdog", en: "Downward-Facing Dog", sa: "Adho Mukha Svanasana", cat: "fours", pos: "fours", hold: 35, level: 2, headDown: true,
      fig: F("side", { torso: -138, head: 0, arm: [-138, -138], leg: [150, 150] }),
      cues: ["Downward dog. From hands and knees, tuck the toes and lift the hips up and back.",
        "Bend the knees generously and lengthen the spine. Heels can stay lifted.", "Let the head hang. Breathe."],
      caution: "Ease off with sore wrists, glaucoma or uncontrolled high blood pressure; child's pose is a good alternative." },
    { id: "plank", en: "Plank", sa: "Phalakasana", cat: "fours", pos: "fours", hold: 20, level: 2,
      fig: F("side", { torso: -76, head: 0, arm: [180, 180], leg: [104, 104] }),
      cues: ["Plank. Hands under the shoulders, step back to a long line from head to heels.", "Belly gently drawn in. Lower the knees if you need to.", "Breathe."] },

    /* ----- lying on the front ----- */
    { id: "sphinx", en: "Sphinx", sa: "Salamba Bhujangasana", cat: "lying", pos: "prone", hold: 40, level: 1,
      fig: F("side", { torso: -72, head: -16, arm: [178, -90], leg: [92, 90] }),
      cues: ["Sphinx. Lie on your front and prop yourself on your forearms, elbows under the shoulders.",
        "Let the belly soften to the floor. A gentle curve in the low back.", "Breathe."] },
    { id: "cobra", en: "Cobra", sa: "Bhujangasana", cat: "lying", pos: "prone", hold: 20, level: 2,
      fig: F("side", { torso: -58, head: -20, arm: [190, 160], leg: [92, 90] }),
      cues: ["Cobra. Hands under the shoulders, press lightly and lift the chest.", "Elbows soft and close to your sides. Only go as high as feels easy."],
      caution: "Keep it low and gentle with back pain." },

    /* ----- seated ----- */
    { id: "easy", en: "Easy Seat", sa: "Sukhasana", cat: "seated", pos: "seat", hold: 45, level: 1,
      fig: F("front", { torso: 0, armR: [204, 204], armL: [156, 156], legR: [-118, 88], legL: [118, -88] }),
      cues: ["Easy seat. Sit cross-legged, on a cushion if your knees are higher than your hips.",
        "Hands on the knees. Sit tall and let the shoulders soften.", "Breathe slowly."] },
    { id: "staff", en: "Staff", sa: "Dandasana", cat: "seated", pos: "seat", hold: 25, level: 1,
      fig: F("side", { torso: 0, head: 0, arm: [176, 176], leg: [-90, -90] }),
      cues: ["Staff. Sit with the legs straight out in front, feet flexed.", "Hands beside the hips. Sit up tall."] },
    { id: "seatfold", en: "Seated Forward Fold", sa: "Paschimottanasana", cat: "seated", pos: "seat", hold: 45, level: 1,
      fig: F("side", { torso: -62, head: -10, arm: [-104, -96], leg: [-90, -90] }),
      cues: ["Seated forward fold. From staff, breathe in and lengthen, breathe out and fold forward from the hips.",
        "Bend the knees as much as you like. Hands rest on the legs.", "Let each out-breath soften you a little more."] },
    { id: "butterfly", en: "Bound Angle", sa: "Baddha Konasana", cat: "seated", pos: "seat", hold: 45, level: 1,
      fig: F("front", { torso: 0, armR: [176, 150], armL: [184, 210], legR: [-112, 60], legL: [112, -60] }),
      cues: ["Bound angle. Bring the soles of the feet together and let the knees fall open.",
        "Hold the feet and sit tall.", "Let gravity do the work. Breathe."] },
    { id: "seattwist", en: "Seated Twist", sa: "Ardha Matsyendrasana", cat: "seated", pos: "seat", sides: true, hold: 30, level: 1,
      fig: F("side", { torso: 0, head: 34, arm: [-128, -50], arm2: [160, 178], leg: [-28, 176], leg2: [-90, -90] }),
      cues: ["Seated twist to the {S}. Bend the {S} knee and place the foot outside the {O} knee.",
        "Hug the knee with your {O} arm and turn toward the {S}. {S} hand on the floor behind you.", "Lengthen as you breathe in, turn a little as you breathe out."] },

    /* ----- lying on the back ----- */
    { id: "kneeschest", en: "Knees to Chest", sa: "Apanasana", cat: "lying", pos: "supine", hold: 40, level: 1,
      fig: F("side", { torso: -90, head: 0, arm: [-6, 40], leg: [-40, 52] }),
      cues: ["Knees to chest. Lie on your back and hug both knees in.", "Rock gently side to side if it feels good.", "Breathe into the low back."] },
    { id: "bridge", en: "Bridge", sa: "Setu Bandha Sarvangasana", cat: "lying", pos: "supine", hold: 30, level: 2,
      fig: F("side", { torso: -108, head: -70, arm: [98, 92], leg: [68, 178] }),
      cues: ["Bridge. Lie on your back with knees bent, feet hip-width apart.", "Press into the feet and lift the hips. Arms along the floor.", "Breathe, then roll down slowly, one bone at a time."],
      caution: "Keep the head still and facing the ceiling while the hips are lifted." },
    { id: "supinetwist", en: "Supine Twist", sa: "Supta Matsyendrasana", cat: "lying", pos: "supine", sides: true, hold: 45, level: 1,
      fig: F("front", { top: true, torso: 0, armR: [-90, -90], armL: [90, 90], legR: [130, 210], legL: [136, 216] }),
      cues: ["Supine twist. Lying down, hug the knees in and let them fall to the {S}.",
        "Arms out wide, and turn your head to the {O} if the neck likes it.", "Breathe and let the twist settle."] },
    { id: "happybaby", en: "Happy Baby", sa: "Ananda Balasana", cat: "lying", pos: "supine", hold: 40, level: 1,
      fig: F("side", { torso: -90, head: 0, arm: [16, 4], leg: [-24, 6] }),
      cues: ["Happy baby. Lying down, bring the knees toward the armpits and hold the outsides of the feet.",
        "Soles face the ceiling. Let the low back be heavy.", "Rock a little if you like."] },
    { id: "legswall", en: "Legs Up the Wall", sa: "Viparita Karani", cat: "rest", pos: "supine", hold: 120, level: 1,
      fig: F("side", { torso: -90, head: 0, arm: [100, 96], leg: [0, 0], wall: true }),
      cues: ["Legs up the wall. Sit sideways to a wall, then swing the legs up as you lie back.",
        "Hips close to the wall or a little away. Arms resting.", "Let the legs be heavy and the breath slow."],
      caution: "A mild inversion: skip it with glaucoma, or if your feet start to tingle." },
    { id: "corpse", en: "Corpse", sa: "Savasana", cat: "rest", pos: "supine", hold: 180, level: 1,
      fig: F("side", { torso: -90, head: 0, arm: [96, 92], leg: [90, 90] }),
      cues: ["Rest. Lie on your back, legs long, arms a little away from the body, palms up.",
        "Let the whole body be heavy and still.", "Let the breath move by itself."] }
  ];
  var ASANA = {};
  ASANAS.forEach(function (a) { ASANA[a.id] = a; });
  var ACATS = [["all", "All"], ["standing", "Standing"], ["balance", "Balance"], ["fours", "All fours"], ["seated", "Seated"], ["lying", "Lying"], ["rest", "Rest"],
    ["mobility", "Mobility"], ["capoeira", "Capoeira"]];

  /* Moving between positions gets a short spoken transition. */
  var TRANS = {
    stand: { fours: "Come down to your hands and knees.", prone: "Come down to the floor and lie on your front.",
      seat: "Come down to sit on your mat.", supine: "Come down to the floor and lie on your back." },
    fours: { stand: "Walk your hands back to your feet and roll up to standing, head last.", prone: "Lower down to lie on your front.",
      seat: "Swing your legs around and come to sitting.", supine: "Come to sitting, then roll down onto your back." },
    prone: { stand: "Press back to hands and knees, then come up to standing.", fours: "Press back onto your hands and knees.",
      seat: "Press up and come round to sitting.", supine: "Roll over onto your back." },
    seat: { stand: "Come up to standing, taking your time.", fours: "Come onto your hands and knees.",
      prone: "Turn over and lie on your front.", supine: "Roll down slowly onto your back." },
    supine: { stand: "Roll to your side, press up to sitting, then come up to standing slowly.", fours: "Roll to your side and come onto your hands and knees.",
      prone: "Roll over onto your front.", seat: "Roll to your side and press up to sitting." }
  };
  var HOLD_EXTRA = ["Breathe slowly and evenly.", "Let the face, jaw and shoulders soften.", "Stay with the breath.", "Observe the sensations, and breathe into them."];
  var MOVE_EXTRA = ["Keep breathing with the movement.", "Smaller is fine. Keep it comfortable.", "Relax the shoulders and the jaw.", "Smooth and steady."];
  var CAP_EXTRA = ["Eyes forward, on your imaginary partner.", "Stay low and light, knees soft.", "Let the berimbau set the pace.", "Breathe out on each effort."];

  function aCue(t, side) {
    if (!side) return t.replace(/\{S\}|\{O\}/g, "");
    var o = side === "right" ? "left" : "right";
    return t.replace(/\{S\}/g, side).replace(/\{O\}/g, o).replace(/(^|\. )([a-z])/g, function (m, a, b) { return a + b.toUpperCase(); });
  }
  function aTitle(a, side) { return a.en + (side ? ", " + side : ""); }

  /* A list of {id, hold, side} into timed steps, with transitions and a close. An item can
     carry its own title and cues (a free ginga); a set can bring its own opening and close. */
  function yogaSteps(items, o) {
    var flat = [];
    o = o || {};
    (items || []).forEach(function (it) {
      var a = ASANA[it.id];
      if (!a) return;
      var hold = Math.max(10, Math.min(600, it.hold || a.hold));
      var sides = !a.sides ? [null] : it.side === "right" ? ["right"] : it.side === "left" ? ["left"] : ["right", "left"];
      sides.forEach(function (sd) { flat.push({ a: a, side: sd, hold: hold, title: it.title, cues: it.cues }); });
    });
    if (!flat.length) return [G(30, "Empty sequence", ["Add some poses to this sequence first."])];
    var first = flat[0].a.pos, steps = [];
    steps.push(G(25, "Get ready", o.intro || [first === "stand" ? "Stand at the top of your mat, with some space around you." : first === "supine" ? "Lie down on your mat." : first === "seat" ? "Come to sit on your mat." : "Come onto your mat.",
      "Move slowly, within a comfortable range, and choose what suits your body today."]));
    var prev = null;
    flat.forEach(function (x, i) {
      var a = x.a, lines = [];
      if (prev) {
        var t = prev.a.pos !== a.pos ? TRANS[prev.a.pos][a.pos]
          : (prev.a.headDown && !a.headDown && a.pos === "stand") ? "Slowly roll up to standing, head coming up last." : null;
        if (t) steps.push({ k: "guide", secs: 10, title: "Next: " + aTitle(a, x.side), lines: [[0, t]], pose: a.id, side: x.side, trans: true });
      }
      var sameAgain = prev && prev.a === a && prev.side && x.side && prev.side !== x.side;
      var cues = (x.cues || a.cues).map(function (c) { return aCue(c, x.side); }), extra = a.rhythm ? CAP_EXTRA : a.move ? MOVE_EXTRA : HOLD_EXTRA;
      if (sameAgain) cues[0] = "Now the other side. " + cues[0];
      var n = cues.length, h = x.hold;
      lines.push([0, cues[0]]);
      for (var c = 1; c < n; c++) lines.push([Math.round(Math.min(h - 4, 6 + (h - 10) * c / n)), cues[c]]);
      for (var e = 0, tt = lines[lines.length - 1][0] + 30; tt < h - 8; tt += 30, e++) lines.push([tt, extra[(i + e) % extra.length]]);
      steps.push({ k: "pose", secs: h, pose: a.id, side: x.side, title: x.title || aTitle(a, x.side), lines: lines });
      prev = x;
    });
    var last = flat[flat.length - 1].a;
    if (o.outro) steps.push(G(30, "Closing", o.outro));
    else if (last.id !== "corpse") {
      steps.push(G(30, "Closing", [last.pos === "stand" ? "Come back to standing, feet hip-width apart, hands together at your chest." :
        last.pos === "supine" ? "Rest on your back for a few breaths." : "Come to a comfortable seat.",
        "Take three slow breaths and notice how your body feels now."]));
    }
    return steps;
  }
  function yogaSecs(items, o) { return yogaSteps(items, o).reduce(function (a, s) { return a + s.secs; }, 0); }

  /* Built-in sequences: practices in their own right, and starting points in the builder. */
  var YOGA_SETS = [
    { id: "standing-flow", name: "Standing Yoga Flow", items: [
      { id: "mountain", hold: 45 }, { id: "salute", hold: 30 }, { id: "sidebend", hold: 30 }, { id: "fold", hold: 45 }, { id: "chair", hold: 30 },
      { id: "warrior1", side: "right", hold: 40 }, { id: "warrior2", side: "right", hold: 40 }, { id: "triangle", side: "right", hold: 40 },
      { id: "warrior1", side: "left", hold: 40 }, { id: "warrior2", side: "left", hold: 40 }, { id: "triangle", side: "left", hold: 40 },
      { id: "tree", hold: 40 }, { id: "mountain", hold: 40 }] },
    { id: "standing-reset", name: "Standing Reset", items: [
      { id: "mountain", hold: 30 }, { id: "salute", hold: 25 }, { id: "sidebend", hold: 25 }, { id: "fold", hold: 40 }, { id: "chair", hold: 25 }, { id: "mountain", hold: 30 }] },
    { id: "morning-yoga", name: "Morning Wake-Up", items: [
      { id: "mountain", hold: 30 }, { id: "salute", hold: 25 }, { id: "sidebend", hold: 25 }, { id: "fold", hold: 35 }, { id: "halflift", hold: 20 },
      { id: "plank", hold: 20 }, { id: "downdog", hold: 35 }, { id: "lowlunge", hold: 30 }, { id: "downdog", hold: 25 },
      { id: "warrior2", hold: 30 }, { id: "goddess", hold: 30 }, { id: "mountain", hold: 30 }] },
    { id: "back-hips", name: "Back and Hips", items: [
      { id: "table", hold: 20 }, { id: "cat", hold: 20 }, { id: "cow", hold: 20 }, { id: "cat", hold: 20 }, { id: "cow", hold: 20 },
      { id: "child", hold: 45 }, { id: "lowlunge", hold: 35 }, { id: "downdog", hold: 30 }, { id: "sphinx", hold: 40 }, { id: "child", hold: 30 },
      { id: "bridge", hold: 30 }, { id: "kneeschest", hold: 40 }, { id: "supinetwist", hold: 45 }, { id: "corpse", hold: 150 }] },
    { id: "evening-floor", name: "Evening Floor Flow", items: [
      { id: "easy", hold: 60 }, { id: "cat", hold: 20 }, { id: "cow", hold: 20 }, { id: "child", hold: 45 }, { id: "butterfly", hold: 50 },
      { id: "seatfold", hold: 50 }, { id: "seattwist", hold: 30 }, { id: "kneeschest", hold: 40 }, { id: "happybaby", hold: 40 },
      { id: "supinetwist", hold: 45 }, { id: "legswall", hold: 150 }, { id: "corpse", hold: 180 }] },
    { id: "balance-yoga", name: "Balance", items: [
      { id: "mountain", hold: 30 }, { id: "tree", hold: 40 }, { id: "warrior3", hold: 25 }, { id: "dancer", hold: 25 }, { id: "chair", hold: 30 }, { id: "mountain", hold: 40 }] }
  ];
