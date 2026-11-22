  /* ------------------------------- cold and heat -------------------------------
     Cold Finish, a new technique from the brain-wave guide (practice-data.js holds its entry, sup: true):
     the end of a shower turned cold, 15 to 60 seconds of it, for morning energy. The phone sits outside
     the shower, so everything that matters is loud: a triple bell to turn the water cold and another to
     turn it off, spoken cues to breathe out long and slow through the cold's gasp, a low tone that falls
     with each long breath out, and three pips before the end. Its plan: a warm shower (the length you
     choose, less the rest), slow breaths still in the warm, the cold, then warming up by moving.
       Build up    the cold's length from your history, since the guide says to start gradually: 15
                   seconds to begin with; three at one length, the third at least a week after the
                   first, and the next is 15 seconds longer, up to a minute; a month away, one step back
       "cold"      a step of its own kind: its lines start each long breath out (out 6, in 3), its
                   visual a ring of the seconds left round a pacer that shrinks as you breathe out
     Its page asks for the health check first while it's unanswered, carries the health check's cold
     caution once it is (care.js), and says so when fast breathing or long holds ended within the hour.
     Healthy living's Cold and heat tab (living-data.js TEMPS) is free to read.
  -------------------------------------------------------------------------------- */

  var COLD_SECS = [15, 30, 45, 60];          // the lengths of cold, shortest first
  var COLD_WEEK = 6 * 864e5;                 // a week from the first at a length, give or take a morning
  var COLD_BREAK = 28 * 864e5;               // a month away steps back once
  var COLD_IN = 3, COLD_OUT = 6;             // in the cold: a long breath out of 6 seconds, then 3 in, out first
  var COLD_COL = "#7cc4fa";                  // cold water's blue
  var COLD = { g: null, next: -1, pip: -1, due: 0 };   // the sound's own gain, the next breath-out tone and pip to schedule, and a bell still due (Hz)

  /* ----- how far you've built up, from the history ----- */
  // { i, secs, n: done at this length, t0: the first of them, last: the latest Cold Finish }
  function coldLevel() {
    var i = 0, n = 0, t0 = 0, last = 0;
    hLoad().forEach(function (e) {
      if (e.k !== "practice" || e.id !== "cold-finish" || !(e.cold > 0)) return;
      if (last && e.at - last > COLD_BREAK) { if (i > 0) i--; n = 0; }       // after a month away, one step back, and the count again
      last = e.at;
      if (e.cold < COLD_SECS[i]) return;            // a session cut short in the cold doesn't count
      if (!n) t0 = e.at;
      n++;
      if (n >= 3 && e.at - t0 >= COLD_WEEK && i < COLD_SECS.length - 1) { i++; n = 0; }
    });
    if (last && Date.now() - last > COLD_BREAK) { if (i > 0) i--; n = 0; }
    return { i: i, secs: COLD_SECS[i], n: n, t0: t0, last: last };
  }
  // the seconds of cold a plan has: your build-up, or the length you picked
  function coldSecs(d) {
    var c = pChoice(d, "cold");
    return c === "auto" ? coldLevel().secs : +c || COLD_SECS[0];
  }
  function coldDay(t) { return new Date(t).toLocaleDateString(undefined, { day: "numeric", month: "long" }); }
  // where you are, in a sentence: under Build up on the page, and on the end screen
  function coldNow() {
    var lv = coldLevel();
    if (!lv.last) return "15 seconds to begin with.";
    if (lv.i === COLD_SECS.length - 1) return "The full minute now.";
    var due = lv.t0 + COLD_WEEK;
    return lv.secs + " seconds now, " + lv.n + " of 3 done" + (lv.n >= 3 && due > Date.now() ? ", and " + COLD_SECS[lv.i + 1] + " from " + coldDay(due) : "") + ".";
  }
  function coldRule() {
    return "After three at one length, the third at least a week after the first, the next is 15 seconds longer, up to a minute; after a month away, one step shorter.";
  }

  /* ----- the plan ----- */
  // the cold's words: one at the start of each long breath out, halfway on the longer ones, nearly there at the last
  function coldLines(secs) {
    var cyc = COLD_IN + COLD_OUT, starts = [], out = [], near = -1, half = -1, m = 0, i;
    var mids = ["In through the nose, and a long breath out.", "Shoulders down. Breathe out, slow and long.",
      "Let each breath out last a little longer.", "You're doing well. A long, slow breath out."];
    for (var t = 0; t < secs - 5.5; t += cyc) starts.push(t);
    for (i = starts.length - 1; i > 0; i--) if (secs - starts[i] >= 6) { near = i; break; }
    if (secs >= 45) {
      starts.forEach(function (t, j) { if (half < 0 || Math.abs(t - secs / 2) < Math.abs(starts[half] - secs / 2)) half = j; });
      if (half === near || half === 0) half = -1;
    }
    starts.forEach(function (t, j) {
      out.push([t, j === 0 ? "Cold now. Let the gasp pass, and breathe out, long and slow." : j === near ? "Nearly there. One more long breath out."
        : j === half ? "Halfway. Breathe out, long and slow." : mids[m++ % mids.length]]);
    });
    return out;
  }
  function coldSteps(d, min) {
    var T = (min || 5) * 60, cold = coldSecs(d), ready = 18, after = 32, warm = T - cold - ready - after;
    return [
      G(warm, "Warm shower", [[0, "Phone outside the shower, volume up. Step into a warm shower, and wash as you usually do. I'll tell you when the cold is coming."],
        [frac(warm, 0.45), "Enjoy the warmth. Let your shoulders drop, and your breathing slow down."],
        [warm - 12, "About half a minute to the cold. Finish washing, and rinse off."]], { vis: "glow" }),
      Br(ready, "Slow breaths", { inh: COLD_IN, sip: 0, hold: 0, exh: COLD_OUT, rest: 0 }, {
        lines: [[0, "Still in the warm: breathe in through the nose, and out through the mouth, long and slow."],
          [9, "On the bell, turn the water to cold, or to cool for your first few times."]] }),
      { k: "cold", secs: cold, title: "Cold", lines: coldLines(cold), nobell: true, tone: pChoice(d, "tone") !== "off" },
      G(after, "Warm up", [[0, "That's it. Turn the water off, or back to warm if you like, and step out."],
        [12, "Dry off briskly, then move: swing your arms, and march on the spot while the warmth comes back."],
        [25, "Notice how awake you feel."]], { vis: "glow", nobell: true, coldEnd: true })
    ];
  }

  /* ----- its sounds: loud, on a gain of their own, scheduled ahead on the audio clock ----- */
  function coldOut() {
    if (!pBusOn()) return null;
    if (!COLD.g) { COLD.g = A.ctx.createGain(); COLD.g.gain.value = 0.9; COLD.g.connect(A.ctx.destination); }
    return COLD.g;
  }
  // three strokes of a bell, well above the usual: low to turn the water cold, high to turn it off
  function coldBells(hz) {
    var g = coldOut();
    if (!g) return;
    for (var i = 0; i < 3; i++) pBell(1.2, A.ctx.currentTime + 0.05 + i * 0.6, hz, g, true);
  }
  // a long breath out: a tone falling from C5 to G4 with a soft octave above it, as long as the breath
  function coldSigh(when, dur) {
    var g = coldOut();
    if (!g) return;
    var ctx = A.ctx, end = when + dur;
    [[523.25, 392, 0.22], [1046.5, 784, 0.05]].forEach(function (p) {
      var o = ctx.createOscillator(), v = ctx.createGain();
      o.type = "sine"; o.frequency.value = p[0];
      o.frequency.setValueAtTime(p[0], when); o.frequency.exponentialRampToValueAtTime(p[1], end);
      v.gain.setValueAtTime(0, when); v.gain.linearRampToValueAtTime(p[2], when + 0.35);
      v.gain.setValueAtTime(p[2], Math.max(when + 0.35, end - 1.4)); v.gain.linearRampToValueAtTime(0, end);
      o.connect(v); v.connect(g); o.start(when); o.stop(end + 0.05);
      o.onended = function () { try { o.disconnect(); v.disconnect(); } catch (e) {} };
    });
  }
  // a short pip, for each of the last three seconds
  function coldPip(when) {
    var g = coldOut();
    if (!g) return;
    var ctx = A.ctx, o = ctx.createOscillator(), v = ctx.createGain();
    o.type = "sine"; o.frequency.value = 880;
    v.gain.setValueAtTime(0, when); v.gain.linearRampToValueAtTime(0.32, when + 0.01); v.gain.exponentialRampToValueAtTime(0.0001, when + 0.16);
    o.connect(v); v.connect(g); o.start(when); o.stop(when + 0.2);
    o.onended = function () { try { o.disconnect(); v.disconnect(); } catch (e) {} };
  }
  // what's queued, silenced at once (a pause, a skip, the end, I need to stop)
  function coldHush(fade) {
    var g = COLD.g;
    COLD.g = null; COLD.next = -1; COLD.pip = -1;
    if (!g || !A.ctx) return;
    var t = A.ctx.currentTime, f = fade || 0.06;
    try { g.gain.cancelScheduledValues(t); g.gain.setValueAtTime(g.gain.value, t); g.gain.linearRampToValueAtTime(0, t + f); } catch (e) {}
    setTimeout(function () { try { g.disconnect(); } catch (e) {} }, (f + 0.3) * 1000);
  }
  // a new step: the cold starts with its bells, and the step after it with the bells to turn the water off
  // (a step skipped to while paused rings them when it carries on, if it's still near its start)
  function coldEnter(s) {
    coldHush();
    COLD.due = s.k === "cold" ? 392 : s.coldEnd ? 587.33 : 0;
    if (COLD.due && P.state === "running") { coldBells(COLD.due); COLD.due = 0; }
  }
  // every tick of a running practice: the bells still due, the breath-out tones and the last three pips, up to just ahead
  function coldTick(s, st) {
    if (COLD.due && P.state === "running") { if (st < 2) coldBells(COLD.due); COLD.due = 0; }
    if (s.k !== "cold" || !A.ctx || P.state !== "running") return;
    var cyc = COLD_IN + COLD_OUT, horizon = st + (document.hidden ? 2 : 0.6), t;
    if (s.tone) {
      // a breath out begun up to half a second ago still gets its tone (the step's first comes on the first tick)
      if (COLD.next < 0) COLD.next = Math.max(0, Math.ceil((st - 0.5) / cyc));
      for (t = COLD.next * cyc; t < horizon && t < s.secs - 1; t = (++COLD.next) * cyc) {
        var late = Math.max(0, st - t);
        if (late < 0.5) coldSigh(A.ctx.currentTime + Math.max(0, t - st), Math.min(COLD_OUT, s.secs - t) - 0.2 - late);
      }
    }
    if (COLD.pip < 0) COLD.pip = Math.max(1, Math.ceil(s.secs - st - 0.05));     // seconds before the end: 3, 2, 1
    while (COLD.pip >= 1 && s.secs - COLD.pip < horizon) {
      t = s.secs - COLD.pip;
      if (COLD.pip <= 3 && t >= st - 0.05) coldPip(A.ctx.currentTime + (t - st));
      COLD.pip--;
    }
  }

  /* ----- what you see: the seconds left round a pacer, and the words under it ----- */
  // where the breath is: out for 6 seconds (f 0 to 1), then in for 3
  function coldPhase(st) {
    var cyc = COLD_IN + COLD_OUT, ph = ((st % cyc) + cyc) % cyc;
    return ph < COLD_OUT ? { out: true, f: ph / COLD_OUT } : { out: false, f: (ph - COLD_OUT) / COLD_IN };
  }
  function coldWords(s, st) {
    var ph = coldPhase(st), left = Math.max(0, Math.ceil(s.secs - st));
    return { cap: ph.out ? "Breathe out, long and slow" : "In through the nose", sub: left + " s of cold left" };
  }
  function coldDraw(c, W, Hh, s, st) {
    var cx = W / 2, cy = Hh / 2, R = Math.min(W, Hh) * 0.38, f = Math.min(1, Math.max(0, st / s.secs)), ph = coldPhase(st);
    // the pacer: full as a breath out begins, shrinking through it, filling again on the breath in (still under reduced motion)
    var lv = RM ? 0.75 : ph.out ? 1 - 0.45 * (1 - Math.cos(ph.f * Math.PI)) / 2 : 0.55 + 0.45 * (1 - Math.cos(ph.f * Math.PI)) / 2;
    var r = R * 0.82 * lv, g = c.createRadialGradient(cx, cy, r * 0.1, cx, cy, r);
    g.addColorStop(0, rgba(COLD_COL, 0.34)); g.addColorStop(0.7, rgba(COLD_COL, 0.14)); g.addColorStop(1, rgba(COLD_COL, 0));
    c.fillStyle = g; c.beginPath(); c.arc(cx, cy, r, 0, Math.PI * 2); c.fill();
    c.strokeStyle = rgba(COLD_COL, 0.5); c.lineWidth = 1.5; c.beginPath(); c.arc(cx, cy, r, 0, Math.PI * 2); c.stroke();
    // the seconds left, as a ring that empties
    c.lineWidth = 7; c.strokeStyle = rgba(BCOL.line, 0.9);
    c.beginPath(); c.arc(cx, cy, R, 0, Math.PI * 2); c.stroke();
    c.strokeStyle = COLD_COL; c.lineCap = "round";
    c.beginPath(); c.arc(cx, cy, R, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (1 - f)); c.stroke(); c.lineCap = "butt";
    c.font = "700 " + Math.round(R * 0.62) + "px " + B_MONO; c.fillStyle = BCOL.text; c.textAlign = "center"; c.textBaseline = "middle";
    c.fillText(String(Math.max(0, Math.ceil(s.secs - st))), cx, cy + 2);
    c.font = "600 13px " + B_SANS; c.fillStyle = BCOL["text-faint"];
    c.fillText(ph.out ? "breathe out" : "breathe in", cx, cy + R * 0.45);
  }

  /* ----- its page, its history and its end ----- */
  // above Start: fast breathing or long holds that ended within the hour (care.js)
  function coldCareNote() {
    var r = ibRecent();
    return r ? "You did " + r.name + " " + ibAgo(r) + ". Give your breathing time to settle back to normal before the cold, and keep breathing all the way through it, with no breath holds." : "";
  }
  // into the summary: the seconds of cold you stayed for, and the length planned
  function coldSummary(r, T) {
    var s = P.steps.filter(function (x) { return x.k === "cold"; })[0];
    if (!s || T <= s.at) return;
    r.cold = Math.round(Math.min(s.secs, T - s.at));
    r.coldOf = s.secs;
  }
  // the end screen's tile: how long, and where your build-up stands now that this one is in the history
  function coldTile(r) {
    if (!r.cold) return null;
    return ["Cold", r.cold + " s", r.cold >= r.coldOf ? "the whole of it" : "of " + r.coldOf + " s planned", "cold", r.at ? "Build up: " + coldNow().replace(/\.$/, "") : ""];
  }
  function coldExplain(k) {
    if (k !== "cold" || !SD.r || !SD.r.cold) return null;
    var r = SD.r, p = [];
    p.push(r.cold >= r.coldOf ? "You stayed in the cold for all " + r.cold + " seconds." : "You turned the water back after " + r.cold + " of the " + r.coldOf + " seconds planned, and that's fine: ending early is always the right call when you feel dizzy, numb or unwell.");
    p.push("Build up: " + coldNow() + " " + coldRule());
    p.push("Cold water's first gasp is strongest in the first minute or so; slow breaths out help you through it. A minute of cold is plenty for a lift: the studies of colder, longer baths are in Learn.");
    return ["Cold", p];
  }

  function coldInit() {
    SETTLE_HUSH.push(function (secs) { coldHush(secs); });      // I need to stop: the bells and tones fade with everything else
    if (window.__entrain) {
      var X = window.__entrain;
      X.COLD = COLD; X.coldLevel = coldLevel; X.coldLines = coldLines; X.coldPhase = coldPhase; X.coldNow = coldNow; X.TEMPS = TEMPS;
    }
  }
