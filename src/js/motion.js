  /* ------------------------- the phone's motion sensor -------------------------
     Two new techniques from one sensor (DeviceMotion; on an iPhone, after the page has asked
     for motion access in a tap):
     - Phone on your belly, on Breathe. Lying back with the phone flat on the belly, each breath
       tilts it a little, so gravity's pull shifts between its three axes. Averaged into ten
       readings a second, the three are band-passed to 3 to 42 breaths a minute, reduced to the
       one direction they move in most (their principal component), and the strongest rhythm in
       the last 45 seconds is the breathing rate, with how much of the power lies at it as the
       confidence; each peak of that wave is a breath. Beside the guide it says whether you're
       with it, faster or slower, and after the session for how much of it you followed.
     - Stillness, on the end screen of a practice done lying down. Each second counts as moving
       when there's a jolt (a quick change between readings), a turn (the gyroscope over 25
       degrees a second) or a knock; the slow rise and fall of breathing counts as still. The
       end screen shows the share of the session that was still and the longest still stretch.
     Every reading is time-stamped with bNow(), so sessions and tests keep one clock. Nothing is
     kept beyond the last 90 seconds of readings, the moments of the last few minutes' breaths and
     the session's counts.
  ----------------------------------------------------------------------------- */
  var MOT_BELLY = "Phone on your belly", MOT_STILL = "Stillness on the end screen";
  var MOT_FS = 10, MOT_KEEP = 90, MOT_WIN = 45, MOT_MIN = 25;
  var MOT = {
    on: false, perm: "", state: "off",          // state: off | wait | ok | none | denied
    belly: false, still: false,                 // who's listening: Breathe, a practice
    bins: [], cur: null, got: 0, since: 0, sec: -1, mv: [],   // a tenth of a second each; mv: each second, moving or not
    est: null, marks: [], tickT: 0, watchT: 0, tickAt: 0,
    ses: null, last: null,                      // the Breathe session's tally, and the last one's
    sr: null                                    // the running practice's stillness
  };

  // motion access: asked in a tap where the browser asks (Safari on an iPhone or iPad; Chrome answers at once). Anything but a
  // refusal goes ahead: if no readings come, the page says so after three seconds
  function motAsk(then0) {
    var D = window.DeviceMotionEvent, then = function (s) { if (s === "ok" && MOT.state === "denied") MOT.state = "off"; then0(s); };
    if (!D) { then("none"); return; }
    if (typeof D.requestPermission === "function" && MOT.perm !== "granted") {
      try {
        D.requestPermission().then(function (s) { MOT.perm = s; then(s === "denied" ? "denied" : "ok"); }, function () { then("denied"); });
      } catch (e) { then("denied"); }
      return;
    }
    then("ok");
  }
  // listening while Breathe or a practice wants it
  function motListen() {
    var want = MOT.belly || MOT.still;
    if (want && !MOT.on) {
      MOT.on = true; MOT.got = 0; MOT.since = bNow(); MOT.bins = []; MOT.cur = null; MOT.mv = []; MOT.sec = -1; MOT.marks = []; MOT.est = null;
      if (MOT.state !== "denied") MOT.state = "wait";
      window.addEventListener("devicemotion", motOnEvent);
      clearTimeout(MOT.watchT);
      MOT.watchT = setTimeout(function () { if (MOT.on && !MOT.got && MOT.state === "wait") { MOT.state = "none"; motUI(); } }, 3000);
    } else if (!want && MOT.on) {
      MOT.on = false;
      window.removeEventListener("devicemotion", motOnEvent);
      clearTimeout(MOT.watchT);
      if (MOT.state !== "denied") MOT.state = "off";
    }
    clearInterval(MOT.tickT);
    if (MOT.belly) { MOT.tickAt = bNow(); MOT.tickT = setInterval(motTick, 1000); }
  }
  function motOnEvent(e) {
    var a = e.accelerationIncludingGravity, r = e.rotationRate, t = bNow();
    if (!a || typeof a.x !== "number" || typeof a.y !== "number" || typeof a.z !== "number") return;
    if (!MOT.got) { MOT.state = "ok"; motUI(); }
    MOT.got++;
    var k = Math.floor(t * MOT_FS), c = MOT.cur;
    if (!c || c.k !== k) { motClose(); c = MOT.cur = { k: k, sx: 0, sy: 0, sz: 0, n: 0, lo: Infinity, hi: -Infinity, rot: 0, hasRot: false }; }
    c.sx += a.x; c.sy += a.y; c.sz += a.z; c.n++;
    var m = Math.sqrt(a.x * a.x + a.y * a.y + a.z * a.z);
    if (m < c.lo) c.lo = m;
    if (m > c.hi) c.hi = m;
    if (r && typeof r.alpha === "number") { c.hasRot = true; c.rot = Math.max(c.rot, Math.sqrt(r.alpha * r.alpha + (r.beta || 0) * (r.beta || 0) + (r.gamma || 0) * (r.gamma || 0))); }
  }
  // a tenth of a second done: its averages, and each whole second whether you moved
  function motClose() {
    var c = MOT.cur;
    if (!c || !c.n) return;
    MOT.cur = null;
    var b = { t: c.k / MOT_FS, x: c.sx / c.n, y: c.sy / c.n, z: c.sz / c.n, sp: c.hi - c.lo, rot: c.hasRot ? c.rot : -1 };
    MOT.bins.push(b);
    while (MOT.bins.length && MOT.bins[0].t < b.t - MOT_KEEP) MOT.bins.shift();
    var s = Math.floor(b.t);
    if (MOT.sec < 0) MOT.sec = s;
    while (MOT.sec < s) { motSecond(MOT.sec); MOT.sec++; }
  }
  // is the phone being moved, beyond the slow tilt of breathing? (pure, for the tests)
  function motMoving(bins) {
    for (var i = 0; i < bins.length; i++) {
      var b = bins[i];
      if (b.sp > 1.2 || b.rot > 25) return true;                     // a knock, or a turn
      if (i >= 2) {                                                    // a jolt: a sudden change between readings
        var p = bins[i - 1], q = bins[i - 2], dx = b.x - 2 * p.x + q.x, dy = b.y - 2 * p.y + q.y, dz = b.z - 2 * p.z + q.z;
        if (Math.sqrt(dx * dx + dy * dy + dz * dz) > 0.25) return true;
      }
    }
    return false;
  }
  function motSecond(s) {
    var bs = MOT.bins.filter(function (b) { return b.t >= s - 0.2 && b.t < s + 1; });     // the second, with the two readings before it for the jolts
    if (bs.length < 3) return;
    var m = motMoving(bs);
    MOT.mv.push({ t: s, m: m });
    while (MOT.mv.length && MOT.mv[0].t < s - MOT_KEEP) MOT.mv.shift();
    var sr = MOT.sr;
    if (sr && P.state === "running") {
      sr.secs++;
      if (m) { if (s - sr.lastMove > 5) sr.moves++; sr.lastMove = s; sr.run = 0; }
      else { sr.still++; sr.run++; if (sr.run > sr.best) sr.best = sr.run; }
    }
  }

  /* ----- the rate from the belly's tilt ----- */
  var MOT_BAND = null;
  // xs, ys, zs: ten readings a second. Returns { rate (a minute), conf, amp (m/s²), q, s (the breathing wave), peaks (indices) } (pure, for the tests)
  function motRate(xs, ys, zs, fs) {
    if (!MOT_BAND) MOT_BAND = [sigBiquad("hp", 0.05, MOT_FS), sigBiquad("lp", 0.7, MOT_FS)];
    var ax = [xs, ys, zs].map(function (v) { return sigZero(sigDetrend(v), MOT_BAND, 2 * fs); }), n = xs.length, i, j;
    // the direction they move in most: the covariance's main axis, by power iteration
    var C = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
    for (i = 0; i < 3; i++) for (j = 0; j < 3; j++) { var sum = 0; for (var k = 0; k < n; k++) sum += ax[i][k] * ax[j][k]; C[i][j] = sum / n; }
    var v = [C[0][0] + 1e-9, C[1][1] + 1e-9, C[2][2] + 1e-9], it, nv;
    for (it = 0; it < 30; it++) {
      var w = [0, 1, 2].map(function (r) { return C[r][0] * v[0] + C[r][1] * v[1] + C[r][2] * v[2]; });
      nv = Math.sqrt(w[0] * w[0] + w[1] * w[1] + w[2] * w[2]);
      if (!(nv > 0)) break;
      v = w.map(function (x) { return x / nv; });
    }
    var s = new Float64Array(n), ss = 0;
    for (k = 0; k < n; k++) { s[k] = v[0] * ax[0][k] + v[1] * ax[1][k] + v[2] * ax[2][k]; ss += s[k] * s[k]; }
    var amp = Math.sqrt(ss / Math.max(1, n));
    var sp = sigSpec(s, fs, 3 / 60, 40 / 60, 0.1 / 60), pk = sigPeak(sp, 3 / 60, 40 / 60);
    if (!pk || amp < 0.02) return { rate: 0, conf: 0, amp: amp, q: "faint", s: s, peaks: [] };     // under about a tenth of a degree's tilt
    var f = pk.f, conf = sigShare(sp, f, 1 / 60, 2);
    var per = fs / f, peaks = [], last = -Infinity;
    for (k = 1; k < n - 1; k++) {
      if (s[k] > 0 && s[k] > s[k - 1] && s[k] >= s[k + 1] && k - last >= 0.6 * per) { peaks.push(k); last = k; }
    }
    return { rate: f * 60, conf: conf, amp: amp, q: conf < 0.35 ? "unsteady" : conf < 0.55 ? "ok" : "clear", s: s, peaks: peaks };
  }
  function motBellyOk() { return MOT.belly && !!MOT.est && (MOT.est.q === "ok" || MOT.est.q === "clear"); }
  // the guide's pace while a session of your own runs on Breathe
  function motGuide() { return (B.state === "running" || B.state === "paused") && B.ph && !P.usesB ? 60 / B.ph.cycle : 0; }
  function motVerdict(rate, g) { return !g ? "" : Math.abs(rate - g) <= Math.max(0.8, 0.12 * g) ? "with" : rate > g ? "faster" : "slower"; }
  function motBelly() {
    var now = bNow(), from = now - MOT_WIN, bs = MOT.bins.filter(function (b) { return b.t >= from; });
    var have = bs.length ? now - bs[0].t : 0;
    if (MOT.state !== "ok" || now - MOT.since < MOT_MIN || bs.length < MOT_MIN * MOT_FS * 0.5) {
      MOT.est = { q: "listening", left: Math.max(1, Math.ceil(MOT_MIN - Math.min(have, now - MOT.since))) };
      return;
    }
    // an even grid of ten a second, holding the last reading over a gap
    var t0 = bs[0].t, n = Math.round((now - t0) * MOT_FS), xs = new Float64Array(n), ys = new Float64Array(n), zs = new Float64Array(n), j = 0;
    for (var k = 0; k < n; k++) {
      var t = t0 + k / MOT_FS;
      while (j < bs.length - 1 && bs[j + 1].t <= t + 1e-6) j++;
      xs[k] = bs[j].x; ys[k] = bs[j].y; zs[k] = bs[j].z;
    }
    var mv = MOT.mv.filter(function (x) { return x.t >= from; }), moving = mv.length ? mv.filter(function (x) { return x.m; }).length / mv.length : 0;
    var r = motRate(xs, ys, zs, MOT_FS);
    if (moving > 0.25) r.q = "moving";
    MOT.est = { q: r.q, rate: r.rate, conf: r.conf, amp: r.amp };
    // each breath, once it's well past
    if (r.q === "ok" || r.q === "clear") {
      var per = 60 / r.rate;
      r.peaks.forEach(function (i) {
        var tb = t0 + i / MOT_FS, lm = MOT.marks[MOT.marks.length - 1];
        if (tb < now - 0.35 * per && (!lm || tb > lm + 0.6 * per)) MOT.marks.push(tb);
      });
      while (MOT.marks.length && MOT.marks[0] < now - 300) MOT.marks.shift();
    }
  }
  // once a second while the phone is on your belly: the rate, and the session's tally
  function motTick() {
    var now = bNow(), dt = Math.min(5, Math.max(0, now - MOT.tickAt));
    MOT.tickAt = now;
    motBelly();
    var g = motGuide(), run = B.state === "running" && !P.usesB;
    if (run && !MOT.ses) MOT.ses = { secs: 0, read: 0, with: 0, faster: 0, slower: 0, t0: now, g: g };
    if (MOT.ses && run) {
      MOT.ses.secs += dt;
      if (motBellyOk() && g) { MOT.ses.read += dt; MOT.ses[motVerdict(MOT.est.rate, g)] += dt; }
    }
    if (MOT.ses && B.state !== "running" && B.state !== "paused") {        // the session ended: what it counted
      var se = MOT.ses;
      se.breaths = MOT.marks.filter(function (t) { return t >= se.t0; }).length;
      MOT.last = se.secs >= 30 ? se : null;
      MOT.ses = null;
    }
    motUI();
  }
  function motNum(r) { var x = Math.round(r * 10) / 10; return String(x % 1 ? x.toFixed(1) : x); }
  // what Breathe says beside the guide and under it
  function motBellyTxt() {
    var e = MOT.est, g = motGuide();
    if (MOT.state === "denied") return "Motion access wasn't given, so the phone can't count your breaths. Turn this off and on again to be asked once more; if the question doesn't come, close the page and open it again.";
    if (MOT.state === "none") return "No motion readings are coming in, so the phone can't count your breaths here. Phones have a motion sensor, though a browser can keep it from a page; most computers have none.";
    if (MOT.last && B.state !== "running" && B.state !== "paused") {
      var L = MOT.last, pc = L.read ? Math.round(100 * L.with / L.read) : 0;
      return "Last session, on your belly: " + L.breaths + (L.breaths === 1 ? " breath" : " breaths") + " counted" +
        (L.read >= 20 ? ", and with the guide for " + pc + "% of the time it could read you." : ", though too few clear readings to compare with the guide.");
    }
    if (!e || MOT.state === "wait") return "Lie back and rest the phone flat on your belly, screen up, just below the ribs. It counts your breaths after about " + MOT_MIN + " seconds.";
    if (e.q === "listening") return "Counting your breaths: about " + e.left + (e.left === 1 ? " second" : " seconds") + " to go. Let the phone rest on your belly and breathe as the guide shows.";
    if (e.q === "faint") return "The phone isn't moving with your breath. Rest it flat on your belly, just below the ribs, and let your belly rise as you breathe in.";
    if (e.q === "moving") return "Too much movement to count your breaths. Lie still and let the phone rest.";
    if (e.q === "unsteady") return "Your breathing is uneven to count: roughly " + motNum(e.rate) + " a minute so far.";
    var s = "You're breathing about " + motNum(e.rate) + " times a minute";
    if (!g) return s + ". Start the guide to see whether you're following it.";
    var v = motVerdict(e.rate, g);
    return s + ", with the guide at " + motNum(g) + (v === "with" ? ": you're following it." : v === "faster" ? ": faster than the guide. Let each breath out run a little longer." : ": slower than the guide. Follow its pace a little more closely.");
  }
  function motUI() {
    var row = $("#bBellyRow"), on = MOT.belly, cb = $("#bBellyOn");
    if (!row) return;
    if (cb && cb.checked !== (on && supOn())) cb.checked = on && supOn();
    row.hidden = !on;
    if (on) bSetT("#bBellyTxt", motBellyTxt());
    var ok = on && motBellyOk(), g = motGuide();
    $("#bBellyStat").hidden = !ok;
    if (ok) {
      bSetT("#bBelly", motNum(MOT.est.rate));
      var v = motVerdict(MOT.est.rate, g);
      bSetT("#bBellyV", v === "with" ? "with the guide" : v);
      $("#bBellyStat").dataset.v = v;
    }
    motTags();
  }
  // the cup beside each motion option while this device is locked (supRefresh calls this after an unlock)
  function motTags() {
    ["#bBellyL", "#sOptStillL"].forEach(function (sel) {
      var l = $(sel);
      if (!l) return;
      var tag = l.querySelector(".sup-tag");
      if (tag && supOn()) tag.parentNode.removeChild(tag);
      else if (!tag && !supOn()) l.insertAdjacentHTML("beforeend", supTag(true));
    });
    var st = $("#sOptStill");
    if (st && !supOn()) st.checked = false;
  }
  // Breathe's switch: on with a donation while locked, then motion access in the same tap
  function motBellySet(on) {
    if (!on) { MOT.belly = false; MOT.last = null; MOT.ses = null; motListen(); motUI(); return; }
    var go = function () {
      motAsk(function (s) {
        if (s !== "ok") { MOT.state = s; MOT.belly = true; motUI(); return; }
        MOT.belly = true; MOT.last = null; MOT.ses = null; motListen(); motTick();
      });
    };
    var yes = function () { $("#bBellyOn").checked = true; go(); };
    $("#bBellyOn").checked = false;
    supGate(MOT_BELLY, yes, function (ok) { if (ok) yes(); else motUI(); });     // unlocked in the dialog: on it goes, in that tap
  }

  /* ----- stillness in a practice done lying down ----- */
  // a practice lain down for, where the body rests: not a moving one, a measurement or one that strokes or pumps the breath
  function motStillFits(d) {
    if (!d || d.stress || d.noStill || d.method === "move" || d.method === "write" || !d.posture) return false;
    return d.posture.indexOf("lie") >= 0 && d.posture.indexOf("stand") < 0;
  }
  function motStillOn(d) { return motStillFits(d) && !!P.opt.still && supOn() && pChoice(d, "pos") !== "walk"; }
  function motStillRow(O) {
    return '<label class="so-row so-tg so-still"><span class="so-l"><span id="sOptStillL">Stillness' + supTag(true) + "</span>" +
      "<small>Rest the phone on your belly or on the bed beside you: its motion sensor notes how still you stay, for the end screen.</small></span>" +
      '<input type="checkbox" class="sw" id="sOptStill"' + (O.still && supOn() ? " checked" : "") + "></label>";
  }
  function motStillWire(d, O, save) {
    var cb = $("#sOptStill");
    if (!cb) return;
    cb.addEventListener("change", function () {
      if (!this.checked) { O.still = false; save(); return; }
      this.checked = false;
      var yes = function () {
        if (P.view !== d) return;
        O.still = true; save();
        var c = $("#sOptStill"); if (c) c.checked = true;
        motAsk(function () {});                       // motion access now, in the tap, so the start needn't ask
      };
      supGate(MOT_STILL, yes, function (ok) { if (ok) yes(); else motTags(); });
    });
  }
  // at Start, in the tap: motion access on an iPhone (pStart)
  function motStillAsk(d) { if (motStillFits(d) && pOptsOf(d.id).still && supOn()) motAsk(function (s) { if (s !== "ok") MOT.state = s; }); }
  // once it runs (pStart's go): counting from now
  function motStillStart(d) {
    MOT.sr = null;
    if (!motStillOn(d)) { if (MOT.still) { MOT.still = false; motListen(); } return; }
    MOT.sr = { secs: 0, still: 0, run: 0, best: 0, moves: 0, lastMove: -1e9 };
    MOT.still = true;
    motListen();
  }
  // at the end (pSummary): the share of the session that was still, then the sensor rests
  function motStillSummary(r) {
    var sr = MOT.sr;
    MOT.sr = null;
    if (MOT.still) { MOT.still = false; motListen(); }
    if (!sr) return;
    if (sr.secs < 60) { r.still = { none: true, short: sr.secs > 0 }; return; }
    r.still = { pct: Math.round(100 * sr.still / sr.secs), best: sr.best, moves: sr.moves, secs: sr.secs };
  }
  // a stretch of time in words: 45 s, 2 min, 3 min 30 s
  function motDur(secs) {
    secs = Math.round(secs);
    var m = Math.floor(secs / 60), s = secs % 60;
    return !m ? secs + " s" : m + " min" + (s ? " " + s + " s" : "");
  }
  function motStillTile(r) {
    if (!r.still) return null;
    if (r.still.none) return ["Stillness", "—", r.still.short ? "too short to read" : "no motion readings", "still"];
    return ["Stillness", r.still.pct + "%", "still, longest " + motDur(r.still.best), "still"];
  }
  function motStillExplain(k) {
    if (k !== "still") return null;
    var r = SD.r, s = r.still, p = [];
    if (s.none) {
      p.push(s.short ? "The motion sensor read less than a minute of the session, too little to say how still you stayed."
        : "Stillness was on, but the motion sensor sent no readings: this device may not have one (most computers don't), or motion access wasn't allowed.");
      return ["Stillness", p];
    }
    p.push("How much of the session the phone lay still, resting on you or on the bed: " + s.pct + "% of the " + motDur(s.secs) + " it read. Your longest still stretch lasted " +
      motDur(s.best) + (s.moves ? ", and you moved or shifted " + (s.moves === 1 ? "once." : s.moves === 2 ? "twice." : s.moves + " times.") : ", and you didn't shift at all."));
    p.push("Each second counts as moving when the sensor feels a jolt, a turn or a knock; the slow rise and fall of breathing counts as still. Settling into longer still stretches is one sign of relaxing, and restlessness the opposite, but it's a rough measure rather than a tested one. On the bed beside you, the phone notices only bigger movements.");
    return ["Stillness", p];
  }

  function motInit() {
    SUP_EXTRA.push({ name: MOT_BELLY, href: "#breathe" }, { name: MOT_STILL, href: "#l-phone" });    // Settings' list of what the donation unlocks
    var cb = $("#bBellyOn");
    if (!window.DeviceMotionEvent) $("#bBellyOpt").hidden = true;          // no motion sensor to ask for
    cb.addEventListener("change", function () { motBellySet(this.checked); });
    motUI();
    if (window.__entrain) {
      var X = window.__entrain;
      X.MOT = MOT; X.motRate = motRate; X.motMoving = motMoving; X.motStillFits = motStillFits; X.motVerdict = motVerdict;
    }
  }
