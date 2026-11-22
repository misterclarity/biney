  /* ------------------------------ breath-led sound ------------------------------
     On Breathe, an experimental way to slow down with music. The brain-wave guide rates
     breath-adaptive music, music that follows the user's breathing and gently slows it, as early but
     promising; the study behind it played ambient music whose loudness rose and fell with each
     person's breathing, and the version that swelled a little slower than their own pace slowed
     their breathing most (Learn, #l-mymusic). Here:
     - Listening: the phone on your belly (motion.js) or the microphone (breath-mic.js) finds your
       own breathing pace. Start breathing with it on, and if neither has your pace yet, Breathe waits
       ("Breathe as usual") while the music begins, for up to 75 seconds, then starts the guide. Leaving Breathe meanwhile
       ends the wait, as I need to stop does: the music fades in half a second and the guide stays put (a screen lock
       leaves the wait as it is, and a session already under way carries on, as any on Breathe does).
     - The pace: the guide starts at the pace it found (40% in, 60% out, the resonance test's split),
       stays there for a minute, then slows by a quarter of a breath a minute every 15 seconds, so
       a breath a minute each minute, towards your resonance pace (the test's answer, or 5.5). While
       the sensor reads you as faster than the guide, it holds where it is until you're with it. It
       never speeds up, and a pace or pattern changed by hand mid-session is yours from then on.
     - The sound: the music made on the device (music.js), slow, whose chords swell as you breathe in
       and ebb as you breathe out, by about 6 dB, as in the study. With the phone on your belly they
       follow the belly itself: the tilt's main direction, smoothed, set between its lowest and highest
       over the last breath and a half. Which way is in is learnt from the guide: once you've followed
       it for a while, the tilt goes up or down with its breaths in, and from then on the chords follow
       you, in step or not. Until then, and with the microphone (which hears each breath but not which
       way it goes), they swell with the guide, which started at your own pace.
     It's a new technique, so turning it on opens with a donation (supporter.js). Nothing is recorded or kept
     beyond the session's start and end pace, which go into the history, and a sensor it opened itself closes again
     when the session ends, when it's switched off or when the other sensor is chosen (blsQuiet), even one whose
     access is still being asked for then.
  ------------------------------------------------------------------------------ */

  var BLS_NAME = "Breath-led sound";
  var BLS_WAIT = 75;                       // seconds Breathe waits for your pace before starting at the pattern's
  var BLS_HOLD = 60, BLS_EVERY = 15, BLS_STEP = 0.25;    // a minute at your pace, then a quarter of a breath a minute slower every 15 s
  var BLS_WIN = 30;                        // seconds of the belly's tilt read at a time
  var BLS_LP = null;
  /* on: the switch (this device's; it works once unlocked); src: what listens, "belly" or "mic"; phase: off, find
     (waiting for your pace) or run; t0: when it began waiting; from: what the guide started at ("sensor" or "pattern");
     rate0, rate, target: breaths a minute where the guide started, where it is now, where it's heading; next: when it
     may slow next; hold: holding while you're faster; hand: the pace was changed by hand; ph, pend: the guide's
     phases it set, now and waiting for the next breath; v: the belly's main direction; sign: which way it goes as
     you breathe in (0 until learnt); pairs: the belly's level beside the guide's, to learn it; lvl, how: the chords'
     level and what leads it ("belly", "guide" or ""); last: the session before; mic, belly: it opened that sensor
     itself (not you, on Heart or with Breathe's own switch), so it closes it again. */
  var BLS = { on: false, src: "belly", phase: "off", t0: 0, from: "", rate0: 0, rate: 0, target: 0, next: 0, hold: false, hand: false,
    ph: null, pend: null, v: null, sign: 0, pairs: [], corr: 0, corrAt: 0, lvl: 0.7, how: "", last: null, timer: 0, mic: false, belly: false };

  function blsOn() { return BLS.on && supOn(); }
  function blsHasBelly() { return !!window.DeviceMotionEvent; }
  function blsHasMic() { return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia); }
  // the guide's breath at a pace: 40% in, 60% out, as the resonance test breathes (heart-charts.js)
  function blsT(rate) { return findTimings(rate); }
  function blsNum(r) { return motNum(r); }
  // your pace, once the chosen sensor (or the other, if it's listening) is sure of it
  function blsRateNow() {
    var b = motBellyOk() ? MOT.est.rate : 0, m = micOk() ? MIC.est.rate : 0;
    return BLS.src === "mic" ? m || b : b || m;
  }
  // a rougher reading, when waiting has run out
  function blsRateRough() {
    var b = MOT.belly && MOT.est && MOT.est.rate || 0, m = MIC.on && MIC.est && MIC.est.rate || 0;
    return BLS.src === "mic" ? m || b : b || m;
  }
  function blsListening() { return BLS.src === "belly" ? MOT.belly : MIC.on || MIC.busy; }
  // the chosen sensor can't read anything here: no motion access or readings, or no microphone
  function blsSensorBad() {
    if (BLS.src === "belly") return !blsHasBelly() || MOT.state === "denied" || MOT.state === "none";
    return !blsHasMic() || (!MIC.on && !MIC.busy && !!MIC.err);
  }
  // start the chosen sensor, in the tap (Safari asks for motion access there; browsers ask for the microphone)
  function blsListen() {
    if (BLS.src === "belly") { if (!MOT.belly && blsHasBelly()) { BLS.belly = true; motBellySet(true); } }
    else if (!MIC.on && !MIC.busy && blsHasMic()) { BLS.mic = true; micStart(); }
  }
  // close what it opened itself, but for `keep` ("belly" or "mic"): the microphone (its recording light, Heart's
  // listening) or the phone on your belly, so neither carries on after the session or the switch; one still being
  // asked for (the browser's dialog up) stays closed when the answer comes (micStart, motBellySet)
  function blsQuiet(keep) {
    if (BLS.mic && keep !== "mic") { BLS.mic = false; if (MIC.on || MIC.busy) micStop(); }
    if (BLS.belly && keep !== "belly") { BLS.belly = false; motBellySet(false); }
  }
  function blsMusic(fade) { if (!MUS.on || MUS.own !== "breath") musStart({ feel: "slow", own: "breath", fade: fade }); }

  /* ----- a session ----- */
  // Start breathing (bToggle), with it on: true when it takes over the start
  function blsStart() {
    if (!blsOn() || P.usesB || B.finder || BC.long) return false;
    if (BLS.phase === "find") { blsBegin(true); return true; }      // Begin now
    if (B.state === "done") { B.state = "idle"; bFresh(); }
    ensureCtx();
    blsListen();
    blsMusic(3); musSwell(0.7, 0.5);
    if (blsRateNow()) { blsBegin(false); return true; }
    BLS.phase = "find"; BLS.t0 = bNow();
    blsTimer();
    syncTransport(); updateHead(); blsUI();
    return true;
  }
  // the guide begins: at your pace, or (with no reading, or Begin now before one) the pattern's
  function blsBegin(now) {
    var r = blsRateNow() || (now ? blsRateRough() : 0), start = r ? Math.max(3, Math.min(18, r)) : 60 / cycleOf(BC);
    start = Math.round(start * 10) / 10;
    BLS.from = r ? "sensor" : "pattern";
    BLS.rate0 = BLS.rate = start;
    BLS.target = Math.min(start, pResRate());
    BLS.phase = "run"; BLS.hand = false; BLS.hold = false; BLS.pairs = []; BLS.corr = 0;
    BLS.next = bNow() + B_LEAD + BLS_HOLD;
    bFresh();
    B.ph = BLS.ph = buildPhases(blsT(start)); BLS.pend = null;
    planTotal(); renderLine();
    bResume();
    blsMusic(2);
    blsTimer(); blsUI();
  }
  // a quarter of a breath a minute slower, from the next breath, unless you're still faster than the guide
  function blsSlow(now) {
    var g = 60 / B.ph.cycle, r = blsRateNow();
    if (r && motVerdict(r, g) === "faster") { BLS.hold = true; BLS.next = now + 10; return; }
    BLS.hold = false;
    var nr = Math.max(BLS.target, Math.round((BLS.rate - BLS_STEP) * 100) / 100);
    normalize(breathTime());
    var ph = buildPhases(blsT(nr));
    B.pending = BLS.pend = ph;
    BLS.rate = nr; BLS.next = now + BLS_EVERY;
  }
  // the session ended (or the wait was cancelled): the music fades (over `fade` seconds, 2 unless given), and what it
  // did is kept for the row
  function blsEnd(cancel, fade) {
    if (BLS.phase === "run" && !cancel) BLS.last = { rate0: BLS.rate0, rate1: BLS.rate, from: BLS.from, hand: BLS.hand };
    BLS.phase = "off"; BLS.pend = null;
    clearInterval(BLS.timer); BLS.timer = 0;
    if (MUS.own === "breath") musStop(fade === undefined ? 2 : fade);
    blsQuiet();
    syncTransport(); updateHead(); blsUI();
  }
  // leaving Breathe (showView) while it waits for your pace: the wait ends, the music going in half a second
  function blsLeave() { if (BLS.phase === "find") blsEnd(true, 0.5); }
  function blsTimer() { clearInterval(BLS.timer); BLS.timer = setInterval(blsTick, 100); }
  function blsTick() {
    var now = bNow();
    if (BLS.phase === "find") {
      if (!blsOn() || P.usesB || B.state !== "idle") { blsEnd(true); return; }
      if (curView !== "breathe") { blsLeave(); return; }
      if (blsRateNow()) { blsBegin(false); return; }
      if (blsSensorBad() || now - BLS.t0 > BLS_WAIT) { blsBegin(true); return; }
      blsPad(blsBelly());
      updateHead(); blsUI();
      return;
    }
    if (BLS.phase !== "run") { clearInterval(BLS.timer); BLS.timer = 0; return; }
    if ((B.state !== "running" && B.state !== "paused") || P.usesB || B.finder) { blsEnd(false); return; }
    if (!blsOn()) {                                                // turned off mid-session: the music goes, and the guide keeps the pace it's at
      if (MUS.own === "breath") musStop(1.5);
      BLS.hand = true;
      return;
    }
    if (B.state === "paused") { if (MUS.on && MUS.own === "breath") musStop(1); }
    else blsMusic(2);
    // a pace or pattern changed by hand: the pace is yours from now on
    if (B.ph === BLS.pend) { BLS.ph = BLS.pend; BLS.pend = null; }
    if (!BLS.hand && (B.ph !== BLS.ph || (B.pending && B.pending !== BLS.pend))) BLS.hand = true;
    var b = blsBelly(), bt = breathTime();
    if (b && b.raw !== null && B.state === "running" && bt >= 0) blsLearn(b.raw, levelAt(bt), now);
    blsPad(b);
    if (B.state === "running" && !BLS.hand && now >= BLS.next && BLS.rate > BLS.target + 0.001) blsSlow(now);
    blsUI();
  }

  /* ----- the belly's tilt, as the breath ----- */
  /* The level of the belly's breath now, 0 to 1 (pure, for the tests): the last BLS_WIN seconds of the motion sensor's
     readings (ten a second, { t, x, y, z }) on an even grid, each axis with its straight-line drift taken away and
     smoothed (to 0.7 Hz, both ways, so nothing lags), reduced to the direction they move in most (kept pointing the
     way it did last time, vPrev), and set between the lowest and highest of the last breath and a half at `rate` a
     minute. raw: that level (null when the phone barely moves); v: the direction; amp: the swing, in m/s². */
  function blsTilt(bins, vPrev, rate) {
    var nb = bins.length;
    if (nb < 100) return null;
    var t1 = bins[nb - 1].t, t0 = Math.max(bins[0].t, t1 - BLS_WIN), n = Math.round((t1 - t0) * MOT_FS) + 1, j = 0, k;
    if (n < 100) return null;
    while (j < nb - 1 && bins[j + 1].t <= t0 + 1e-6) j++;
    var xs = new Float64Array(n), ys = new Float64Array(n), zs = new Float64Array(n);
    for (k = 0; k < n; k++) {
      var t = t0 + k / MOT_FS;
      while (j < nb - 1 && bins[j + 1].t <= t + 1e-6) j++;
      xs[k] = bins[j].x; ys[k] = bins[j].y; zs[k] = bins[j].z;
    }
    if (!BLS_LP) BLS_LP = [sigBiquad("lp", 0.7, MOT_FS)];
    var ax = [xs, ys, zs].map(function (a) { return sigZero(sigDetrend(a), BLS_LP, 20); }), C = [[0, 0, 0], [0, 0, 0], [0, 0, 0]], r, c;
    for (r = 0; r < 3; r++) for (c = 0; c < 3; c++) { var sum = 0; for (k = 0; k < n; k++) sum += ax[r][k] * ax[c][k]; C[r][c] = sum / n; }
    var v = vPrev ? vPrev.slice() : [C[0][0] + 1e-9, C[1][1] + 1e-9, C[2][2] + 1e-9];
    for (var it = 0; it < 30; it++) {
      var w = [0, 1, 2].map(function (q) { return C[q][0] * v[0] + C[q][1] * v[1] + C[q][2] * v[2]; }), nv = Math.sqrt(w[0] * w[0] + w[1] * w[1] + w[2] * w[2]);
      if (!(nv > 0)) break;
      v = w.map(function (x) { return x / nv; });
    }
    if (vPrev && v[0] * vPrev[0] + v[1] * vPrev[1] + v[2] * vPrev[2] < 0) v = v.map(function (x) { return -x; });
    var per = rate > 0 ? 60 / rate : 8, m = Math.round(Math.max(6, Math.min(20, 1.5 * per)) * MOT_FS), lo = Infinity, hi = -Infinity, s = 0;
    for (k = Math.max(0, n - m); k < n; k++) {
      s = v[0] * ax[0][k] + v[1] * ax[1][k] + v[2] * ax[2][k];
      if (s < lo) lo = s;
      if (s > hi) hi = s;
    }
    var amp = hi - lo;
    return { v: v, amp: amp, raw: amp > 0.05 ? Math.max(0, Math.min(1, (s - lo) / amp)) : null };    // under about a third of a degree, too faint to follow
  }
  // the belly's breath now, while the phone is on it
  function blsBelly() {
    if (BLS.src !== "belly" || !MOT.belly || MOT.state !== "ok" || (MOT.est && MOT.est.q === "moving")) return null;
    var b = blsTilt(MOT.bins, BLS.v, MOT.est && MOT.est.rate);
    if (b) BLS.v = b.v;
    return b;
  }
  // how closely two lists move together, -1 to 1
  function blsCorr(a, b) {
    var n = a.length, ma = avg(a), mb = avg(b), sab = 0, saa = 0, sbb = 0;
    for (var i = 0; i < n; i++) { var x = a[i] - ma, y = b[i] - mb; sab += x * y; saa += x * x; sbb += y * y; }
    return saa > 0 && sbb > 0 ? sab / Math.sqrt(saa * sbb) : 0;
  }
  /* Which way is in: the belly's level beside the guide's over the last 30 seconds, once a second, from the guide's
     second breath on. Following the guide, they rise and fall together one way or the other; once there are 20 seconds
     of it, clearly one way (0.5 or more) sets the direction, and only clearly the other way (0.6 or more) for as long,
     as when the phone is turned over, changes it. Breathing out of step with the guide shows no such link, and
     teaches nothing. */
  function blsLearn(raw, guide, now) {
    if (breathTime() < B.ph.cycle) return;
    BLS.pairs.push([raw, guide, now]);
    while (BLS.pairs.length && BLS.pairs[0][2] < now - 30) BLS.pairs.shift();
    if (now - BLS.corrAt < 1 || BLS.pairs.length < 40 || now - BLS.pairs[0][2] < 20) return;
    BLS.corrAt = now;
    var r = BLS.corr = blsCorr(BLS.pairs.map(function (p) { return p[0]; }), BLS.pairs.map(function (p) { return p[1]; })), sg = r > 0 ? 1 : -1;
    if (!BLS.sign && Math.abs(r) >= 0.5) BLS.sign = sg;
    else if (BLS.sign && sg !== BLS.sign && Math.abs(r) >= 0.6) BLS.sign = sg;
  }
  // the chords' level: the belly's breath once its direction is known, else the guide's, else steady
  function blsPad(b) {
    var lv = 0.7, how = "";
    if (b && b.raw !== null && BLS.sign) { lv = BLS.sign > 0 ? b.raw : 1 - b.raw; how = "belly"; }
    else if (BLS.phase === "run" && B.state === "running" && breathTime() >= 0) { lv = levelAt(breathTime()); how = "guide"; }
    BLS.lvl = lv; BLS.how = how;
    if (MUS.on && MUS.own === "breath") musSwell(0.5 + 0.5 * lv, 0.3);    // full on a breath in, half (6 dB down) at the end of a breath out
  }

  /* ----- Breathe's words for it ----- */
  // the head of the guide while it waits for your pace (updateHead): [name, hint]
  function blsHead() {
    if (BLS.phase !== "find") return null;
    var e = BLS.src === "mic" ? MIC.est : MOT.est, left = e && e.q === "listening" && e.left ? e.left : 0;
    return ["Breathe as usual", left ? "Finding your pace: about " + left + (left === 1 ? " second" : " seconds") + " to go. The guide then begins at it."
      : "Finding your pace. The guide begins at it as soon as it's clear, or press Begin now."];
  }
  // the session's history entry (history.js): breathing at its own pace, with where it began
  function blsHist(e) {
    if (BLS.phase !== "run") return;
    e.id = "custom"; delete e.n;
    e.rate = +BLS.rate.toFixed(1);
    e.note = "breath-led from " + blsNum(BLS.rate0) + " a minute";
  }
  function blsSensorTxt() {
    if (BLS.src === "belly") {
      if (!blsHasBelly()) return "This device has no motion sensor a page can use: choose the microphone instead.";
      if (MOT.state === "denied") return "Motion access wasn't given, so the phone can't feel your breathing. Turn Phone on your belly off and on again to be asked once more.";
      if (MOT.state === "none") return "No motion readings are coming in, so the phone can't feel your breathing here. Most computers have no motion sensor: choose the microphone instead.";
      return MOT.belly ? "Lie back and rest the phone flat on your belly, screen up, just below the ribs." : "The phone on your belly listens once you start.";
    }
    if (!blsHasMic()) return "This browser can't use a microphone here: choose the phone on your belly instead.";
    if (!MIC.on && !MIC.busy && MIC.err) return "The microphone didn't start: Heart's Breath from the microphone says why.";
    return MIC.on ? "Prop the phone 10 to 20 cm from your face, and breathe so it can hear you." : "The microphone listens once you start.";
  }
  function blsTxt() {
    var src = BLS.src === "mic" ? "the microphone" : "the phone";
    if (BLS.phase === "find") return "Breathe as you usually do. The music has begun, and the guide begins at your own pace once " + src + " has it. " + blsSensorTxt();
    if (BLS.phase === "run") {
      var s;
      if (BLS.hand) s = "You've set the pace yourself, so the guide keeps it.";
      else {
        s = BLS.from === "sensor" ? "The guide began at your own pace, " + blsNum(BLS.rate0) + " breaths a minute" : "With no steady reading of your breathing, the guide began at the pattern's pace, " + blsNum(BLS.rate0) + " a minute";
        if (BLS.rate > BLS.target + 0.001) s += BLS.hold ? ", and holds at " + blsNum(BLS.rate) + " until you're with it: let each breath out run a little longer."
          : BLS.rate === BLS.rate0 && bNow() < BLS.next ? ", keeps it for a minute, then slows gently towards your resonance pace, " + blsNum(BLS.target) + "."
          : ", and slows gently towards your resonance pace, " + blsNum(BLS.target) + ": now " + blsNum(BLS.rate) + ".";
        else s += BLS.rate0 <= BLS.target + 0.001 ? ", at or below your resonance pace already, so it stays there." : ", and is now at your resonance pace, " + blsNum(BLS.target) + ".";
      }
      return s + (BLS.how === "belly" ? " The chords swell and ebb with your belly." :
        BLS.src === "belly" && MOT.belly && MOT.state === "ok" ? " The chords swell with the guide until the phone has learnt which way your belly moves as you breathe in." :
        BLS.src === "mic" && MIC.on ? " The chords swell with the guide: a microphone hears each breath, but not which way it goes." : " The chords swell with the guide.");
    }
    if (BLS.last && B.state !== "running" && B.state !== "paused") {
      var L = BLS.last;
      return "Last session, breath-led: the guide went from " + blsNum(L.rate0) + " to " + blsNum(L.rate1) + " breaths a minute" + (L.hand ? ", then kept the pace you set." : ".");
    }
    if (BC.long) return "Breath-led sound keeps to breathing with no long holds, so Swim & dive's range plays as set.";
    return "Start breathing: the music begins, and the guide starts at your own pace, then slows gently while you keep up. " + blsSensorTxt();
  }
  function blsUI() {
    var on = blsOn(), cb = $("#bLedOn");
    if (!cb) return;
    if (cb.checked !== on) cb.checked = on;
    var l = $("#bLedL"), tag = l && l.querySelector(".sup-tag");
    if (tag && supOn()) tag.parentNode.removeChild(tag);
    else if (l && !tag && !supOn()) l.insertAdjacentHTML("beforeend", supTag(true));
    $("#bLedSrcRow").hidden = !on;
    document.querySelectorAll("#bLedSrc button[data-v]").forEach(function (b) { b.setAttribute("aria-pressed", b.getAttribute("data-v") === BLS.src ? "true" : "false"); });
    bSetT("#bLedHint", on ? blsSensorTxt() : "Experimental: early research, and Entrain's own way of doing it hasn't been tested.");
    var row = $("#bLedRow");
    row.hidden = !on;
    if (on) bSetT("#bLedTxt", blsTxt());
    // the settings' pace shows the guide's while it leads, and the pattern's again after
    var lead = BLS.phase === "run" && !BLS.hand && B.ph;
    if (lead) bSetT("#bRateV", (60 / B.ph.cycle).toFixed(1) + " breaths/min, breath-led");
    else if (BLS.ratePut) syncRate();
    BLS.ratePut = !!lead;
  }
  // the switch: on with a donation while locked, then the sensor in the same tap
  function blsSet(on) {
    if (!on) {
      BLS.on = false; store.set("breathLed", "0");
      if (BLS.phase === "find") blsEnd(true);
      blsQuiet();
      blsUI(); return;
    }
    var yes = function () {
      BLS.on = true; store.set("breathLed", "1");
      blsListen();
      blsUI();
    };
    $("#bLedOn").checked = false;
    supGate(BLS_NAME, yes, function (ok) { if (ok) yes(); else blsUI(); });
  }
  function blsSrc(v) {
    if (v !== "belly" && v !== "mic") return;
    BLS.src = v; store.set("breathLedSrc", v);
    blsQuiet(v);
    if (blsOn()) blsListen();
    blsUI();
  }

  function blsInit() {
    BLS.on = store.get("breathLed") === "1";
    var s = store.get("breathLedSrc");
    BLS.src = s === "mic" || s === "belly" ? s : blsHasBelly() ? "belly" : "mic";
    SUP_EXTRA.push({ name: BLS_NAME, href: "#breathe" });              // Settings' list of what the donation unlocks
    SETTLE_HUSH.push(function () { if (BLS.phase !== "off") blsEnd(BLS.phase === "find"); });   // I need to stop: it ends with the session
    $("#bLedOn").addEventListener("change", function () { blsSet(this.checked); });
    $("#bLedSrc").addEventListener("click", function (e) { var b = e.target.closest("button[data-v]"); if (b) blsSrc(b.getAttribute("data-v")); });
    // a sensor you start or stop yourself is yours from then on: Heart's microphone button, Breathe's Phone on your belly
    $("#mcStart").addEventListener("click", function () { BLS.mic = false; });
    $("#bBellyOn").addEventListener("change", function () { BLS.belly = false; });
    blsUI();
    if (window.__entrain) {                                             // for automated tests only
      var X = window.__entrain;
      X.BLS = BLS; X.blsTilt = blsTilt; X.blsCorr = blsCorr; X.blsGuideLv = function () { return B.state === "running" && breathTime() >= 0 ? levelAt(breathTime()) : -1; };
    }
  }
