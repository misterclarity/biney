  /* ------------------------------- touch -------------------------------
     Two practices for touch, from the brain-wave guide (practice-data.js holds their entries; each is
     a new technique, sup: true):
       Soothing Touch  slow strokes along your own forearm at about 3 cm a second, the speed the skin's
                       C-tactile nerves like best, one stroke on each long breath out, following a dot
                       that glides from the wrist to the elbow; or a self-hug, stroking up the upper
                       arms and then holding; or a hand on the heart (and one on the belly), as in the
                       self-soothing touch trial
       Self-Massage    the hands and forearms, jaw and temples, scalp, neck and shoulders and the feet,
                       each lit on the body map with its pressure and stroke under the step's name; or
                       with a partner: hands, shoulders and neck and scalp, swapping giver and receiver
                       halfway
     A "stroke" step draws the arm and the gliding dot on the session canvas, and under it a strip of
     centimetre marks at real size that moves at the real speed while you stroke. Real size comes from
     this screen: a computer's CSS centimetre, or on a touch screen the usual phone density (a phone
     shows a CSS centimetre at about six tenths of a real one); matching a bank card in the practice's
     Options makes it exact, kept on this device only (the key is in backup.js BK_SKIP). A soft
     sweeping tone, a rising whoosh with a tone a fifth below it, plays with each stroke: scheduled
     ahead on the audio clock through a gain of its own that a pause, a skip, the end and I need to
     stop silence at once.
  ------------------------------------------------------------------------------ */

  var TC_SPEED = 3;                        // cm a second: the CT-optimal pace the guide names
  var TC_CARD = 5.398;                     // cm: the short side of a bank card (ID-1), the size matched on the screen
  var TC_RANGE = [25, 95];                 // CSS pixels a centimetre the calibration allows
  // the limb drawn for each part: its length in cm, the hand drawn beyond its start, the half widths at each end, and the ends' names
  var TC_LIMB = {
    arm: { len: 26, lead: 13, w0: 2.8, w1: 4.2, from: "wrist", to: "elbow", at: 1 },
    hug: { len: 28, lead: 4, w0: 3.8, w1: 5, from: "elbow", to: "shoulder", at: 2 }
  };
  /* The sound and the calibration: the bus and the gain the sweeps go through (made fresh after each hush),
     the next stroke in the step to schedule, the noise the whoosh is cut from, and the size in the dialog. */
  var TC = { bus: null, g: null, next: -1, noise: null, noiseCtx: null, cal: 0 };

  /* ----- real size ----- */
  function tcGuess() { return (window.matchMedia && matchMedia("(pointer: coarse)").matches ? 160 : 96) / 2.54; }
  function tcKept() { var v = parseFloat(store.get("touchPx")); return v >= TC_RANGE[0] && v <= TC_RANGE[1] ? v : 0; }
  function tcPx() { return tcKept() || tcGuess(); }          // CSS pixels in a real centimetre on this screen

  /* ----- Soothing Touch ----- */
  function tcPace(d) { return pChoice(d, "pace") === "gentle" ? { inh: 3, exh: 6 } : { inh: 4, exh: 8 }; }
  // n strokes, each a breath in (the hand back to the start) and a breath out (the stroke); part: "arm" or "hug"
  function tcStroke(n, p, title, part, lines, o) {
    var secs = n * (p.inh + p.exh);
    return ext({ k: "stroke", secs: secs, title: title, part: part, inh: p.inh, exh: p.exh,
      lines: lines.filter(function (l) { return l[0] < secs - 1; }) }, o);
  }
  function tcSteps(d, min) {
    min = min || 5;
    var T = min * 60, touch = pChoice(d, "touch"), p = tcPace(d), cyc = p.inh + p.exh;
    var soft = touch === "arm" && pChoice(d, "with") === "soft", o = { sweep: touch !== "heart" && pChoice(d, "sound") !== "off" };
    var t = { inh: p.inh, sip: 0, hold: 0, exh: p.exh, rest: 0 }, settle0 = min <= 5 ? 30 : 40;
    var br = function (n, title, lines, hints, more) {
      var secs = n * cyc;
      return Br(secs, title, t, ext({ hints: hints, lines: lines.filter(function (l) { return l[0] < secs - 1; }) }, more));
    };
    var heart = function (n) {
      return br(n, "Hand on heart", [[0, "Now rest one hand on your heart and the other on your belly."],
        [cyc, "Notice the warmth of your hands, and their gentle weight."], [2 * cyc, "Breathe slowly, and let the calm settle."]],
        { "in": "Hands resting on heart and belly.", out: "A long, slow breath out." });
    };
    var st = [], n, settle;
    if (touch === "heart") {
      n = Math.floor((T - settle0) / cyc);
      var n1 = Math.round(n * 0.35), n2 = Math.round(n * 0.3), n3 = Math.round(n * 0.2), n4 = n - n1 - n2 - n3;
      settle = T - n * cyc;
      st.push(G(settle, "Settle", ["Sit or lie comfortably, and close your eyes if you like.",
        "Rest one hand flat on the middle of your chest, over your heart.", "Breathe slowly, with a longer breath out."], { vis: "glow" }));
      st.push(br(n1, "Hand on heart", [[0, "Notice the warmth of your hand, and its gentle pressure on your chest."],
        [2 * cyc, "Let your chest rise into your hand as you breathe in, and soften under it as you breathe out."],
        [4 * cyc, "Let your hand be kind, as it would be for a friend."]],
        { "in": "Your chest rises into your hand.", out: "Soften under your hand." }));
      st.push(br(n2, "Heart and belly", [[0, "Now rest your other hand on your belly."],
        [2 * cyc, "Two warm hands holding you: the belly soft under one, the chest under the other."]],
        { "in": "Your belly and chest fill under your hands.", out: "Both soften as you breathe out." }));
      st.push(br(n3, "Slow circles", [[0, "Let the hand on your heart make small, slow circles, one on each breath out."],
        [3 * cyc, "Slow and warm, as you would soothe someone you care for."]],
        { "in": "Your hand rests still.", out: "One small, slow circle." }));
      st.push(br(n4, "Rest", [[0, "Let your hands rest where they are, still and warm."], [2 * cyc, "Take this warmth with you."]],
        { "in": "Hands resting.", out: "A long, slow breath out." }));
      return st;
    }
    if (touch === "hug") {
      n = Math.floor((T - settle0) / cyc) - 9;            // the strokes, after learning the pace, the held hug and the hand on heart
      settle = T - (n + 9) * cyc;
      st.push(G(settle, "Settle", ["Sit or stand comfortably, and let your shoulders drop.",
        "Cross your arms over your chest, and rest each hand on the opposite upper arm, just above the elbow.",
        "Breathe slowly, with a longer breath out."], { vis: "glow" }));
      st.push(tcStroke(3, p, "Find the pace", "hug", [[0, "Watch the dot: on each breath out it glides from the elbow up towards the shoulder, about three centimetres a second."],
        [cyc, "Now follow it: both hands stroke slowly up your upper arms as you breathe out."],
        [2 * cyc, "As you breathe in, let your hands glide back down to the elbows."]], o));
      st.push(tcStroke(n, p, "Self-hug", "hug", [[0, "Keep going: one slow stroke up both arms on each breath out."],
        [3 * cyc, "Hold yourself as you would someone you love: warm, soft and unhurried."],
        [7 * cyc, "Notice the warmth that follows each stroke."]], ext({ nobell: true }, o)));
      st.push(br(3, "Hold the hug", [[0, "Now let your hands rest on your upper arms, and give yourself a gentle squeeze."],
        [cyc, "Hold it, warm and steady, and breathe slowly."], [2 * cyc, "Notice your own arms around you."]],
        { "in": "Hold the hug.", out: "A long, slow breath out." }));
      st.push(heart(3));
      return st;
    }
    // the forearm: learn the pace on the left, then strokes on each arm in turn (twice each in ten minutes), then a hand on the heart
    n = Math.floor((T - settle0) / cyc) - 6;
    settle = T - (n + 6) * cyc;
    var k = min <= 5 ? 2 : 4, base = Math.floor(n / k), extra = n % k;
    st.push(G(settle, "Settle", ["Sit or lie comfortably, and roll up your sleeves: bare skin on the forearm responds best.",
      "Rest your left forearm across your lap or on a cushion, palm up.",
      soft ? "Hold the soft brush or the velvet in your right hand." : "Your right hand does the stroking: fingertips together, light and soft.",
      "Breathe slowly, with a longer breath out."], { vis: "glow" }));
    st.push(tcStroke(3, p, "Find the pace", "arm", [[0, "Watch the dot: it glides from the wrist to the elbow at about three centimetres a second, slower than you might think."],
      [cyc, soft ? "Now follow it with the brush or velvet, lightly, as you breathe out." : "Now follow it with your fingertips, lightly, skin on skin, as you breathe out."],
      [2 * cyc, "As you breathe in, lift your hand and bring it back to the wrist."]], o));
    var say = [
      ["Left forearm", [[0, "Keep going: one slow stroke on each breath out."], [2 * cyc, "Light as a feather: just enough to sense the skin under your touch."],
        [5 * cyc, "Let the touch be warm and kind, as you would stroke someone you care for."]]],
      ["Right forearm", [[0, soft ? "Now switch: the brush or velvet in your left hand, stroking your right forearm." : "Now switch: your left hand strokes your right forearm, from the wrist to the elbow."],
        [3 * cyc, "Notice the warmth and the tingle that follow each stroke."], [6 * cyc, "Let your breath and the stroke move together, slow and even."]]],
      ["Left forearm", [[0, "Back to your left forearm."], [3 * cyc, "Soft and even, at the dot's pace."]]],
      ["Right forearm", [[0, "And your right forearm once more."], [3 * cyc, "Let each stroke be soft and unhurried."]]]
    ];
    for (var i = 0; i < k; i++) st.push(tcStroke(base + (i < extra ? 1 : 0), p, say[i][0], "arm", say[i][1], ext(i ? {} : { nobell: true }, o)));
    st.push(heart(3));
    return st;
  }

  /* ----- Self-Massage ----- */
  /* Each area: its title, the regions lit on the body map, its share of the time, its lines and its cues
     (pressure and stroke, under the step's name), both as fractions of the area's time. */
  var SM_SOLO = [
    ["Right hand and forearm", ["handR", "armR"], 2, [[0, "With your left thumb, press slow circles into the palm of your right hand."],
      [0.25, "Work along each finger from base to tip, with a gentle squeeze and pull."], [0.5, "Now long, slow strokes from the wrist up to the elbow, with your whole hand."],
      [0.75, "Then squeeze the forearm gently, wrist to elbow, and release."]],
      [[0, "Moderate pressure · thumb circles"], [0.25, "Gentle squeeze · each finger"], [0.5, "Light pressure · long strokes"], [0.75, "Moderate pressure · squeeze and release"]]],
    ["Left hand and forearm", ["handL", "armL"], 2, [[0, "Now the left hand: your right thumb presses slow circles into the palm."],
      [0.25, "Each finger from base to tip, with a gentle squeeze and pull."], [0.5, "Long, slow strokes from the wrist up to the elbow."],
      [0.75, "Then squeeze the forearm gently, wrist to elbow, and release."]],
      [[0, "Moderate pressure · thumb circles"], [0.25, "Gentle squeeze · each finger"], [0.5, "Light pressure · long strokes"], [0.75, "Moderate pressure · squeeze and release"]]],
    ["Jaw and temples", ["face"], 2, [[0, "Let your teeth part a little. With your fingertips, find the muscles just in front of your ears: they bulge when you clench."],
      [0.3, "Press them in slow circles, firm and comfortable, and let your jaw hang loose."], [0.6, "Now slide up to your temples, and make small, slow circles there, a little lighter."],
      [0.82, "Finish with long strokes from the middle of your forehead out to the temples."]],
      [[0, "Find the spot"], [0.3, "Moderate pressure · slow circles"], [0.6, "Light pressure · small circles"], [0.82, "Light pressure · long strokes"]]],
    ["Scalp", ["head"], 1.5, [[0, "Spread your fingers through your hair, fingertips on your scalp, as if washing your hair slowly."],
      [0.3, "Move the skin over the skull in small circles, rather than rubbing the hair."], [0.6, "Work from your hairline over the top of your head to the back."],
      [0.85, "Then comb your fingers slowly through, front to back."]],
      [[0, "Fingertips on the scalp"], [0.3, "Moderate pressure · small circles"], [0.6, "Moderate pressure · front to back"], [0.85, "Light · combing"]]],
    ["Neck and shoulders", ["neck", "shoulders"], 2.5, [[0, "Reach your right hand to your left shoulder. Squeeze the muscle between neck and shoulder, hold for a breath, and release."],
      [0.25, "Knead slowly along the top of the shoulder, out towards the arm."], [0.45, "Now switch: your left hand on your right shoulder. Squeeze, hold, and release."],
      [0.64, "And knead along the top of that shoulder."], [0.82, "Both hands behind your neck: slow circles with your fingertips either side of the spine, up to the base of the skull."]],
      [[0, "Moderate pressure · squeeze, hold, release"], [0.25, "Moderate pressure · kneading"], [0.45, "Moderate pressure · squeeze, hold, release"], [0.64, "Moderate pressure · kneading"],
        [0.82, "Gentle pressure · slow circles"]]],
    ["Right foot", ["footR"], 1.5, [[0, "Rest your right foot across your left knee, or on the seat beside you."],
      [0.2, "Press your thumbs in slow circles across the sole, from the heel to the ball of the foot."], [0.55, "Squeeze and gently pull each toe."],
      [0.8, "Finish with long strokes along the top of the foot, up to the ankle."]],
      [[0, "Get comfortable"], [0.2, "Firm pressure · thumb circles"], [0.55, "Gentle · each toe"], [0.8, "Light pressure · long strokes"]]],
    ["Left foot", ["footL"], 1.5, [[0, "Now the left foot, across your right knee or on the seat."],
      [0.2, "Thumbs in slow circles across the sole, heel to ball."], [0.55, "Squeeze and gently pull each toe."],
      [0.8, "Long strokes along the top of the foot, up to the ankle."]],
      [[0, "Get comfortable"], [0.2, "Firm pressure · thumb circles"], [0.55, "Gentle · each toe"], [0.8, "Light pressure · long strokes"]]]
  ];
  // with a partner: the giver's hands on the receiver, and a word from each side
  var SM_PAIR = [
    ["Hands and forearms", ["handR", "handL", "armR", "armL"], 3, [[0, "Giver: hold your partner's hand palm up in both of yours, and press slow circles into the palm with your thumbs."],
      [0.12, "Receiver: let your arm be heavy, and say “more” or “less” whenever you like."], [0.25, "Giver: work along each finger, base to tip, with a gentle squeeze."],
      [0.4, "Then long, slow strokes up the forearm to the elbow."], [0.6, "Now the other hand: the palm, each finger, then the forearm."]],
      [[0, "Moderate pressure · thumb circles"], [0.25, "Gentle squeeze · each finger"], [0.4, "Light pressure · long strokes"], [0.6, "The other hand · thumb circles"],
        [0.8, "Light pressure · long strokes"]]],
    ["Shoulders and neck", ["shoulders", "neck"], 3.5, [[0, "Receiver: sit tall on a chair, and let your shoulders drop. Giver: stand behind."],
      [0.15, "Giver: rest your hands on the shoulders for a breath. Then squeeze the muscle between neck and shoulder, slowly, and release."],
      [0.4, "Knead along the tops of the shoulders, out towards the arms, and back."],
      [0.65, "Now slow thumb circles either side of the spine, up the back of the neck to the base of the skull, gently there."],
      [0.86, "Finish with long strokes from the neck out across the shoulders."]],
      [[0, "Get comfortable"], [0.15, "Moderate pressure · squeeze and release"], [0.4, "Moderate pressure · kneading"], [0.65, "Gentle pressure · thumb circles"],
        [0.86, "Light pressure · long strokes"]]],
    ["Scalp", ["head"], 2, [[0, "Giver: spread your fingers through your partner's hair, fingertips on the scalp."],
      [0.3, "Move the skin in slow circles, front to back, like a slow shampoo."], [0.7, "Then comb your fingers slowly through the hair, from the forehead back."]],
      [[0, "Fingertips on the scalp"], [0.3, "Moderate pressure · slow circles"], [0.7, "Light · combing"]]]
  ];
  function smArea(a, secs, first) {
    var at = function (f) { return Math.round(f * secs); };
    return { k: "massage", secs: secs, title: a[0], body: a[1], nobell: !first,
      lines: a[3].map(function (l) { return [at(l[0]), l[1]]; }), cues: a[4].map(function (c) { return [at(c[0]), c[1]]; }) };
  }
  function smSteps(d, min) {
    min = min || 8;
    var T = min * 60, pair = pChoice(d, "who") === "partner", st = [];
    var part = function (areas, total) {
      var sh = shares(total, areas.map(function (a) { return [a[0], a[2]]; }));
      return areas.map(function (a, i) { return smArea(a, sh[a[0]], i === 0); });
    };
    if (pair) {
      var agree = min <= 8 ? 40 : 45, swap = 20, close = min <= 8 ? 30 : 35, half = (T - agree - swap - close) / 2;
      st.push(G(agree, "Agree", ["Decide who gives first. The receiver sits on a chair; the giver stands or sits behind or beside them.",
        "Agree how you'll say “more”, “less” and “just right”, and say it any time.",
        "Giver: warm your hands first. Moderate pressure: firm, comfortable and slow."], { vis: "glow" }));
      st = st.concat(part(SM_PAIR, half));
      st.push(G(swap, "Swap", ["Thank you. Now swap places: the receiver gives, and the giver sits down to receive."], { vis: "glow" }));
      st = st.concat(part(SM_PAIR, half));
      st.push(G(close, "Together", ["Sit side by side for a moment.", "Notice how your hands, shoulders and head feel now.", "Thank each other."], { vis: "glow" }));
      return st;
    }
    var settle = min <= 8 ? 30 : 35, end = min <= 8 ? 30 : 35;
    st.push(G(settle, "Settle", ["Sit comfortably, with your feet bare if you can. A little oil or lotion helps your hands glide.",
      "Use moderate pressure: firm enough to move the skin over the muscle, and comfortable throughout. Ease off wherever it's tender.",
      "Breathe slowly as you go."], { vis: "glow" }));
    st = st.concat(part(SM_SOLO, T - settle - end));
    st.push(G(end, "Rest", ["Rest your hands in your lap.", "Notice how each part feels now: hands, face, scalp, shoulders and feet.",
      "Take a slow breath, and carry the ease with you."], { vis: "glow" }));
    return st;
  }
  // under the area's name: the pressure and stroke now, and the time left on this area
  function smSub(s, st) {
    var c = s.cues[0][1];
    for (var i = 0; i < s.cues.length; i++) if (s.cues[i][0] <= st + 0.05) c = s.cues[i][1];
    return c + " · " + Math.max(1, Math.ceil(s.secs - st)) + " s";
  }

  /* ----- a stroke step on the screen ----- */
  // where the breath is: out (stroking) or in (back to the start), the stroke's progress p and the in-breath's q, seconds left
  function tcPhase(s, st) {
    var cyc = s.inh + s.exh, ph = ((st % cyc) + cyc) % cyc;
    return ph < s.inh ? { out: false, left: s.inh - ph, p: 0, q: ph / s.inh } : { out: true, left: cyc - ph, p: (ph - s.inh) / s.exh, q: 1 };
  }
  function tcWords(s, st) {
    var f = tcPhase(s, st), hug = s.part === "hug", n = Math.max(1, Math.ceil(f.left - 0.05));
    return f.out ? { cap: "Breathe out and stroke", sub: (hug ? "Up towards your shoulders" : "Slowly towards the elbow") + " · " + n }
      : { cap: "Breathe in", sub: (hug ? "Hands glide back to the elbows" : "Lift your hand back to the wrist") + " · " + n };
  }
  // the limb, the stroke's path, the dot and its trail; below, centimetre marks at real size moving at the real speed
  function tcDraw(c, W, Hh, s, st, col) {
    var L = TC_LIMB[s.part] || TC_LIMB.arm, f = tcPhase(s, st), px = tcPx(), faint = BCOL["text-faint"] || "#808cad";
    var band = 46, top = 6, bot = Hh - band - 20, cy = (top + bot) / 2, span = L.lead + L.len + L.w1;
    var k = Math.max(2, Math.min(px, (W - 32) / span, (bot - top) / (2 * L.w1 + 1)));     // screen pixels a centimetre of limb: real size when it fits
    var x0 = (W - span * k) / 2 + L.lead * k, x1 = x0 + L.len * k, w0 = L.w0 * k, w1 = L.w1 * k;
    // the limb in one outline: tapering, a little fuller near its far end; for the forearm, a hand beyond the wrist
    // (palm up, the fingers together), otherwise a rounded elbow
    var hand = s.part !== "hug", pw = w0 * 1.2, fw = w0 * 0.92, fb = x0 - 7.4 * k, ft = x0 - 13 * k;
    c.fillStyle = rgba(col, 0.09); c.strokeStyle = rgba(col, 0.34); c.lineWidth = 1.5;
    if (hand) {                                      // the thumb, under the palm's outline
      c.beginPath(); c.ellipse(x0 - 5.2 * k, cy - pw - 0.5 * k, 2.6 * k, 1.05 * k, -0.42, 0, Math.PI * 2); c.fill(); c.stroke();
    }
    c.beginPath();
    c.moveTo(x0, cy - w0);
    c.quadraticCurveTo(x0 + (x1 - x0) * 0.62, cy - w1 * 1.12, x1, cy - w1);
    c.arc(x1, cy, w1, -Math.PI / 2, Math.PI / 2);
    c.quadraticCurveTo(x0 + (x1 - x0) * 0.62, cy + w1 * 1.12, x0, cy + w0);
    if (hand) {
      c.bezierCurveTo(x0 - 1.4 * k, cy + w0, x0 - 2.8 * k, cy + pw, x0 - 4.4 * k, cy + pw);
      c.quadraticCurveTo(fb + 1.1 * k, cy + pw, fb, cy + fw);
      c.lineTo(ft + fw, cy + fw);
      c.arc(ft + fw, cy, fw, Math.PI / 2, Math.PI * 1.5);
      c.lineTo(fb, cy - fw);
      c.quadraticCurveTo(fb + 1.1 * k, cy - pw, x0 - 4.4 * k, cy - pw);
      c.bezierCurveTo(x0 - 2.8 * k, cy - pw, x0 - 1.4 * k, cy - w0, x0, cy - w0);
    } else c.arc(x0, cy, w0, Math.PI / 2, Math.PI * 1.5);
    c.closePath(); c.fill(); c.stroke();
    if (hand) {                                      // where the fingers part
      c.strokeStyle = rgba(col, 0.2); c.lineWidth = 1;
      c.beginPath();
      [-0.5, 0, 0.5].forEach(function (y) { c.moveTo(fb - 0.4 * k, cy + y * fw); c.lineTo(ft + fw * 0.7, cy + y * fw); });
      c.stroke();
    }
    // the path of each stroke, from just past the start, as long as a breath out at the CT pace
    var xs = x0 + L.at * k, xe = Math.min(x1, x0 + (L.at + TC_SPEED * s.exh) * k), x = xs + (xe - xs) * f.p;
    c.strokeStyle = rgba(col, 0.28); c.lineWidth = 2;
    c.beginPath(); c.moveTo(xs, cy); c.lineTo(xe, cy); c.stroke();
    c.beginPath(); c.moveTo(xe, cy - 7); c.lineTo(xe, cy + 7); c.stroke();
    if (f.out) {                                     // the stroke: a soft trail behind the dot
      var tg = c.createLinearGradient(xs, 0, Math.max(xs + 1, x), 0);
      tg.addColorStop(0, rgba(col, 0)); tg.addColorStop(1, rgba(col, 0.42));
      c.strokeStyle = tg; c.lineWidth = Math.max(6, w0 * 0.9); c.lineCap = "round";
      c.beginPath(); c.moveTo(xs, cy); c.lineTo(x, cy); c.stroke(); c.lineCap = "butt";
    } else if (!RM) {                                // the breath in: the hand lifts and comes back over the arm
      var lx = xe + (xs - xe) * f.q, ly = cy - w1 - 10 - Math.sin(Math.PI * f.q) * Math.min(26, w1);
      c.strokeStyle = rgba(col, 0.16); c.lineWidth = 1.5; c.setLineDash([3, 5]);
      c.beginPath(); c.moveTo(xe, cy - w1 - 10); c.quadraticCurveTo((xs + xe) / 2, cy - w1 - 10 - 2 * Math.min(26, w1), xs, cy - w0 - 10); c.stroke(); c.setLineDash([]);
      c.fillStyle = rgba(col, 0.35); c.beginPath(); c.arc(lx, ly, 4, 0, Math.PI * 2); c.fill();
    }
    var r = Math.max(14, w0 * 1.1), g = c.createRadialGradient(x, cy, 0, x, cy, r);
    g.addColorStop(0, rgba(col, f.out ? 0.55 : 0.2 + 0.3 * f.q)); g.addColorStop(1, rgba(col, 0));
    c.fillStyle = g; c.beginPath(); c.arc(x, cy, r, 0, Math.PI * 2); c.fill();
    c.fillStyle = rgba(col, f.out ? 1 : 0.35 + 0.5 * f.q); c.beginPath(); c.arc(x, cy, 7, 0, Math.PI * 2); c.fill();
    if (!f.out) { c.strokeStyle = rgba(col, 0.4 + 0.5 * f.q); c.lineWidth = 2; c.beginPath(); c.arc(x, cy, 11, 0, Math.PI * 2); c.stroke(); }
    c.font = "600 12px " + B_SANS; c.fillStyle = faint; c.textAlign = "center"; c.textBaseline = "top";
    c.fillText(L.from, x0, Math.min(bot + 4, cy + w1 + 8)); c.fillText(L.to, x1, Math.min(bot + 4, cy + w1 + 8));
    // real size: a mark every centimetre, moving at the stroke's speed while you stroke
    var by = Hh - 14, lft = 16, rgt = W - 16, off = RM || !f.out ? 0 : (f.p * s.exh * TC_SPEED * px) % px;
    c.strokeStyle = rgba(faint, 0.55); c.lineWidth = 1;
    c.beginPath(); c.moveTo(lft, by); c.lineTo(rgt, by);
    for (var tx = lft + off; tx <= rgt; tx += px) { c.moveTo(tx, by); c.lineTo(tx, by - 9); }
    c.stroke();
    c.textAlign = "left"; c.textBaseline = "bottom"; c.font = "600 11px " + B_SANS; c.fillStyle = faint;
    c.fillText((tcKept() ? "Real size" : "About real size") + " · 1 cm marks" + (RM ? "" : " · " + TC_SPEED + " cm a second"), lft, by - 13);
  }

  /* ----- the sweeping tone ----- */
  function tcOut() {
    if (!ensureCtx()) return false;
    if (!TC.bus) { TC.bus = A.ctx.createGain(); TC.bus.gain.value = 0.9; TC.bus.connect(A.ctx.destination); }
    if (!TC.g) { TC.g = A.ctx.createGain(); TC.g.gain.value = 1; TC.g.connect(TC.bus); }
    return true;
  }
  // two seconds of noise, the same every time, for the whoosh
  function tcNoise() {
    if (TC.noise && TC.noiseCtx === A.ctx) return TC.noise;
    var n = Math.round(A.ctx.sampleRate * 2), b = A.ctx.createBuffer(1, n, A.ctx.sampleRate), x = b.getChannelData(0), v = 12345;
    for (var i = 0; i < n; i++) { v = (v * 1103515245 + 12345) % 2147483648; x[i] = v / 1073741824 - 1; }
    TC.noise = b; TC.noiseCtx = A.ctx;
    return b;
  }
  // one stroke's sound, dur seconds from when: a soft whoosh rising from 380 to 1500 Hz over a sine gliding a fifth, from G3 to D4
  function tcSweep(when, dur) {
    if (!tcOut()) return;
    var ctx = A.ctx, end = when + dur, src = ctx.createBufferSource(), bp = ctx.createBiquadFilter(), g = ctx.createGain(), o = ctx.createOscillator(), og = ctx.createGain();
    var env = function (gp, peak, a, rl) {
      gp.setValueAtTime(0, when); gp.linearRampToValueAtTime(peak, when + a); gp.setValueAtTime(peak, Math.max(when + a, end - rl)); gp.linearRampToValueAtTime(0, end);
    };
    src.buffer = tcNoise(); src.loop = true;
    bp.type = "bandpass"; bp.Q.value = 1.3;
    bp.frequency.setValueAtTime(380, when); bp.frequency.exponentialRampToValueAtTime(1500, end);
    env(g.gain, 0.42, Math.min(0.9, dur / 3), Math.min(1.4, dur / 3));
    o.type = "sine";
    o.frequency.setValueAtTime(196, when); o.frequency.exponentialRampToValueAtTime(293.66, end);
    env(og.gain, 0.04, Math.min(1, dur / 3), Math.min(1.5, dur / 3));
    src.connect(bp); bp.connect(g); g.connect(TC.g); o.connect(og); og.connect(TC.g);
    src.start(when); src.stop(end + 0.05); o.start(when); o.stop(end + 0.05);
    o.onended = function () { try { src.disconnect(); bp.disconnect(); g.disconnect(); o.disconnect(); og.disconnect(); } catch (e) {} };
  }
  // what's queued, silenced at once (a pause, a skip, the end, I need to stop)
  function tcHush(fade) {
    var g = TC.g;
    TC.g = null;
    if (!g || !A.ctx) return;
    var t = A.ctx.currentTime, f = fade || 0.06;
    try { g.gain.cancelScheduledValues(t); g.gain.setValueAtTime(g.gain.value, t); g.gain.linearRampToValueAtTime(0, t + f); } catch (e) {}
    setTimeout(function () { try { g.disconnect(); } catch (e) {} }, (f + 0.3) * 1000);
  }
  // a new step: its strokes from the first still ahead
  function tcEnter(s) { TC.next = -1; tcHush(); }
  // every tick of a running practice: a stroke step's sweeps, up to just ahead, each starting as a breath out does
  function tcTick(s, st) {
    if (s.k !== "stroke" || !s.sweep || !A.ctx || P.state !== "running") return;
    var cyc = s.inh + s.exh, horizon = st + (document.hidden ? 2 : 0.6);
    if (TC.next < 0) TC.next = Math.max(0, Math.ceil((st - 0.05 - s.inh) / cyc));
    for (var t = s.inh + TC.next * cyc; t < horizon && t < s.secs - 1; t = s.inh + (++TC.next) * cyc) {
      if (t >= st - 0.05) tcSweep(A.ctx.currentTime + (t - st), s.exh);
    }
  }

  /* ----- real size, against a bank card: a row in Soothing Touch's Options and its dialog ----- */
  function tcCalNote() {
    return tcKept() ? "Matched to a bank card on this device: the marks under the arm are real centimetres."
      : "Set from this screen's usual size, so the marks under the arm are about a centimetre apart. Match a bank card to make them exact.";
  }
  function tcOptHtml(d) {
    if (pChoice(d, "touch") === "heart") return "";
    return '<div class="so-row so-seg tc-cal"><span class="so-l">Real size<small id="tcCalNote">' + esc(tcCalNote()) + "</small></span>" +
      '<button class="btn" id="tcCalBtn">Match a bank card' + supTag(true) + "</button></div>";
  }
  // after an unlock or a new size: the note, and the cup on the button
  function tcOptSync() {
    var b = $("#tcCalBtn");
    if (!b) return;
    bSetT("#tcCalNote", tcCalNote());
    var h = "Match a bank card" + supTag(true);
    if (b.innerHTML !== h) b.innerHTML = h;
  }
  function tcCalShow(v) {
    v = Math.max(TC_RANGE[0], Math.min(TC_RANGE[1], Math.round(v * 10) / 10));
    TC.cal = v;
    $("#tcBox").style.height = (TC_CARD * v + 2).toFixed(1) + "px";      // the middles of its two 2-pixel lines a card's height apart
    $("#tcRange").value = String(v);
    $("#tcRange").setAttribute("aria-valuetext", (TC_CARD * v).toFixed(0) + " screen points tall");
  }
  function tcCalOpen() {
    tcCalShow(tcPx());
    bSetT("#tcSaid", tcKept() ? "Matched before on this device. Check it again, or use the usual size." : "Starting from this screen's usual size.");
    openDialog("#tcModal");
    $("#tcModal .modal-card").scrollTop = 0;
    setTimeout(function () { try { $("#tcRange").focus({ preventScroll: true }); } catch (e) {} }, 30);
  }
  // how: "save" keeps the size shown, "usual" goes back to the screen's usual size, anything else leaves it as it was
  function tcCalClose(how) {
    if ($("#tcModal").hidden) return;
    if (how === "save") store.set("touchPx", TC.cal.toFixed(1));
    else if (how === "usual") storeDel("touchPx");
    closeDialog("#tcModal");
    tcOptSync();
  }

  function tcInit() {
    SETTLE_HUSH.push(function (secs) { tcHush(secs); });     // I need to stop: the sweeps fade with everything else
    document.addEventListener("click", function (e) {
      var b = e.target.closest && e.target.closest("#tcCalBtn");
      if (b) supGate("Soothing Touch", tcCalOpen);            // part of a new technique: it opens with the donation
    });
    $("#tcRange").addEventListener("input", function () { tcCalShow(parseFloat(this.value) || tcPx()); });
    $("#tcLess").addEventListener("click", function () { tcCalShow(TC.cal - 0.3); });
    $("#tcMore").addEventListener("click", function () { tcCalShow(TC.cal + 0.3); });
    $("#tcSave").addEventListener("click", function () { tcCalClose("save"); });
    $("#tcUsual").addEventListener("click", function () { tcCalClose("usual"); });
    $("#tcCancel").addEventListener("click", function () { tcCalClose(); });
    $("#tcModal").addEventListener("click", function (e) { if (e.target === this) tcCalClose(); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !$("#tcModal").hidden) tcCalClose(); });
    if (window.__entrain) {
      var X = window.__entrain;
      X.TC = TC; X.tcPx = tcPx; X.tcGuess = tcGuess; X.tcPhase = tcPhase; X.tcWords = tcWords; X.smSub = smSub; X.tcSweep = tcSweep;
    }
  }
