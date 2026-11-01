  /* ------------------------- breath from the microphone -------------------------
     An option on the Heart page. Breathing is a soft rushing sound, so the page listens to the
     microphone, keeps the band where breath noise lies (0.5 to 5 kHz, above the beat's tones and a
     room's hum), measures its loudness ten times a second, and finds the rhythm in that loudness,
     the method Nam, Reyes & Chon (2016) tested with a headset microphone under the nose. From it
     come your breathing pace (the dashed line on the spectrum), the moment of each breath (for the
     swing of every breath without a breathing session), and a live trace with your heart rate.

     The coherence score doesn't use it. It stays HeartMath's, from the heartbeat alone, so it stays
     comparable with their published figures; the microphone adds what the heartbeat can't say,
     your actual breathing pace, so you can see whether the rhythm the score finds is your breathing.

     Nothing is recorded or sent: the sound becomes one loudness number every tenth of a second on
     this device, and only the last two minutes of those are kept, for the chart.
  ------------------------------------------------------------------------------ */
  var MIC = {
    on: false, busy: false, stream: null, ctx: null, node: null, timer: 0,
    env: [],                  // {t, db}: the breath band's loudness ten times a second, the last two minutes
    est: null,                // the latest reading: { q, rate, period, conf, snr } (q: listening, silent, quiet, unsteady, ok, clear)
    marks: [],                // when each breath was loudest (s, on the page's clock), the last five minutes
    sw: [],                   // { t, amp, cyc }: how far heart rate rose and fell across each breath heard
    swAt: 0,                  // the mark the swings have been worked out up to
    label: "", devId: "", cur: "", err: "", n: 0, t0: 0, prior: "", wasOk: false
  };
  var MIC_FS = 10, MIC_WIN = 60, MIC_MIN = 25, MIC_KEEP = 120;
  // the audio thread's part: the mean square of each tenth of a second, sent to the page
  var MIC_WORKLET = "registerProcessor('breath-level', class extends AudioWorkletProcessor {" +
    "constructor() { super(); this.n = 0; this.s = 0; this.N = Math.round(sampleRate / 10); }" +
    "process(inp) { var c = inp[0] && inp[0][0]; if (c) for (var i = 0; i < c.length; i++) { this.s += c[i] * c[i];" +
    " if (++this.n >= this.N) { this.port.postMessage(this.s / this.n); this.n = 0; this.s = 0; } } return true; } });";

  function micPct(a, q) {
    var s = a.slice().sort(function (x, y) { return x - y; });
    return s[Math.min(s.length - 1, Math.max(0, Math.round(q * (s.length - 1))))];
  }
  function micOk() { return !!(MIC.on && MIC.est && (MIC.est.q === "ok" || MIC.est.q === "clear")); }

  /* The breathing pace in a stretch of loudness (dB, fs a second, oldest first). The level above the
     room's floor (its 10th percentile), smoothed over half a second, is weighed for every pace from 2
     to 42 a minute, and the strongest from 3 to 40 is the rhythm in the sound. Each breath can make
     two sounds, in and out, so the pace is half that rhythm when a peak at half the rate is at least a
     quarter as strong (in and out sound different), or when the rhythm is faster than 24 a minute,
     unusual for breathing at rest. A pace being followed settles such a pair when the sound alone
     leaves a choice, never further than 20% from it: the guide's (guided), which decides outright, or
     the heart's own peak, which needs some sign of the other pace in the sound. conf is the share of
     the rhythm in the sound that is this pace and its overtones; snr how far the loudest moments rise
     above the floor. */
  function micRate(db, fs, prior, guided) {
    var n = db.length, i, j, k;
    if (n < 8) return { q: "listening", conf: 0, snr: 0 };
    var fl = micPct(db, 0.1), hi = micPct(db, 0.95), snr = hi - fl;
    if (hi < -100) return { q: "silent", conf: 0, snr: 0 };
    var a = new Array(n), m = 0;
    for (i = 0; i < n; i++) {
      var s = 0, c = 0;
      for (j = Math.max(0, i - 2); j <= Math.min(n - 1, i + 2); j++) { s += Math.max(0, db[j] - fl); c++; }
      a[i] = s / c; m += a[i];
    }
    m /= n;
    var w = new Array(n);
    for (i = 0; i < n; i++) w[i] = (a[i] - m) * (0.5 - 0.5 * Math.cos(2 * Math.PI * i / (n - 1)));
    var R0 = 2, STEP = 0.1, K = Math.round((42 - R0) / STEP), P = new Array(K + 1);
    for (k = 0; k <= K; k++) {
      var om = 2 * Math.PI * (R0 + k * STEP) / 60 / fs, cr = Math.cos(om), si = Math.sin(om), re = 0, im = 0, pc = 1, ps = 0, t2;
      for (i = 0; i < n; i++) { re += w[i] * pc; im -= w[i] * ps; t2 = pc * cr - ps * si; ps = ps * cr + pc * si; pc = t2; }
      P[k] = re * re + im * im;
    }
    var rateOf = function (x) { return R0 + x * STEP; }, kOf = function (r) { return Math.round((r - R0) / STEP); };
    var near = function (r) {
      var c0 = kOf(r), b = -1;
      for (var x = Math.max(1, c0 - 3); x <= Math.min(K - 1, c0 + 3); x++) if (b < 0 || P[x] > P[b]) b = x;
      return b;
    };
    var best = -1;
    for (k = kOf(3); k <= kOf(40); k++) if (P[k] >= P[k - 1] && P[k] >= P[k + 1] && (best < 0 || P[k] > P[best])) best = k;
    if (best < 0 || !(P[best] > 0)) return { q: snr < 3.5 ? "quiet" : "unsteady", conf: 0, snr: snr, a: a };
    var top = best, half = near(rateOf(best) / 2), used = "";
    if (rateOf(best) / 2 >= 3 && half > 0 && (P[half] >= 0.25 * P[top] || rateOf(top) > 24)) best = half;
    if (prior) {
      [rateOf(best) / 2, rateOf(best) * 2].forEach(function (r) {
        if (r < 3 || r > 24) return;
        var x = near(r);
        if (x > 0 && (guided || P[x] >= 0.1 * P[top]) && Math.abs(rateOf(x) / prior - 1) <= 0.2 &&
          Math.abs(Math.log(rateOf(x) / prior)) < Math.abs(Math.log(rateOf(best) / prior))) { best = x; used = "prior"; }
      });
    }
    var y0 = P[best - 1], y1 = P[best], y2 = P[best + 1], d = y0 - 2 * y1 + y2;
    var rate = rateOf(best + (d < 0 ? Math.max(-0.5, Math.min(0.5, 0.5 * (y0 - y2) / d)) : 0));
    var pk = 0, all = 0;
    for (k = 0; k <= K; k++) {
      all += P[k];
      for (var hm = 1; hm <= 3; hm++) if (Math.abs(rateOf(k) / (rate * hm) - 1) <= 0.1) { pk += P[k]; break; }
    }
    var conf = all > 0 ? pk / all : 0;
    return { rate: rate, period: 60 / rate, conf: conf, snr: snr, a: a, used: used,
      q: snr < 3.5 ? "quiet" : conf < 0.4 ? "unsteady" : conf < 0.6 ? "ok" : "clear" };
  }

  /* The loudest moment of each breath in a smoothed loudness a: peaks that rise well above the
     quiet between breaths, the strongest first, at least 0.6 of a breath apart. */
  function micPeaks(a, fs, period) {
    var n = a.length, gap = 0.6 * period * fs, lo = micPct(a, 0.1), need = 0.3 * (micPct(a, 0.9) - lo), cand = [], keep = [], i;
    for (i = 1; i < n - 1; i++) if (a[i] > a[i - 1] && a[i] >= a[i + 1] && a[i] - lo >= need) cand.push(i);
    cand.sort(function (x, y) { return a[y] - a[x]; });
    cand.forEach(function (c) { if (keep.every(function (x) { return Math.abs(x - c) >= gap; })) keep.push(c); });
    return keep.sort(function (x, y) { return x - y; });
  }

  // a pace being followed: the guide's while a session runs, or else the heart's own clear peak
  function micPrior() {
    if ((B.state === "running" || B.state === "paused") && B.ph) { MIC.prior = "guide"; return 60 / B.ph.cycle; }
    if (H.coh && hrLive() && H.coh.cs >= 1.5) { MIC.prior = "heart"; return H.coh.f * 60; }
    MIC.prior = "";
    return 0;
  }

  // once a second: the pace, each breath's moment, and the swing across each breath heard
  function micAnalyse() {
    var now = bNow(), e = MIC.env.filter(function (x) { return x.t >= now - MIC_WIN; });
    if (now - MIC.t0 < MIC_MIN || e.length < MIC_MIN * MIC_FS * 0.8) {
      var sil = e.length > 20 && micPct(e.map(function (x) { return x.db; }), 0.95) < -100;
      MIC.est = { q: sil ? "silent" : "listening", left: Math.max(1, Math.ceil(MIC_MIN - (now - MIC.t0))), conf: 0, snr: 0 };
      micUI(); specRead();
      return;
    }
    var r = micRate(e.map(function (x) { return x.db; }), MIC_FS, micPrior(), MIC.prior === "guide");
    MIC.est = r;
    if (r.period && (r.q === "ok" || r.q === "clear")) {
      var P0 = r.period;
      micPeaks(r.a, MIC_FS, P0).forEach(function (i) {
        var t = e[i].t;
        if (t > now - 0.35 * P0) return;                                   // still rising, perhaps
        if (MIC.marks.some(function (x) { return Math.abs(x - t) < 0.35 * P0; })) return;
        MIC.marks.push(t);
      });
      MIC.marks.sort(function (x, y) { return x - y; });
      while (MIC.marks.length && MIC.marks[0] < now - 300) MIC.marks.shift();
      micSwings(P0);
    }
    delete r.a;
    micUI(); specRead();
    if (micOk() !== MIC.wasOk) { MIC.wasOk = micOk(); drawSpectrum(); }   // the dashed line comes or goes at once
  }
  function micSwings(P0) {
    var mk = MIC.marks, added = false;
    for (var i = 1; i < mk.length; i++) {
      var a = mk[i - 1], b = mk[i], g = b - a;
      if (b <= MIC.swAt) continue;
      MIC.swAt = b;
      if (H.state !== "on" || g < 0.6 * P0 || g > 1.5 * P0) continue;     // a breath missed, or one heard twice
      var pts = H.series.filter(function (s) { return s.t >= a && s.t <= b; });
      if (pts.length < 3 || pts[pts.length - 1].t - pts[0].t < 0.6 * g) continue;
      var hi = -Infinity, lo = Infinity;
      pts.forEach(function (s) { if (s.hr > hi) hi = s.hr; if (s.hr < lo) lo = s.hr; });
      MIC.sw.push({ t: b, amp: hi - lo, cyc: g });
      added = true;
    }
    if (MIC.sw.length > 300) MIC.sw.splice(0, MIC.sw.length - 300);
    if (added) { drawSwings(); hrTiles(); }
  }
  // the breaths whose swings the page shows: a breathing session's while one runs or has just ended, else those heard
  function swingList() {
    return B.swings.length || B.state === "running" || B.state === "paused" ? B.swings : MIC.sw;
  }
  function swingsHeard() { return swingList() === MIC.sw && MIC.sw.length > 0; }

  function micLevel(ms) {
    if (!MIC.on) return;
    var t = bNow();
    MIC.env.push({ t: t, db: 10 * Math.log10(ms + 1e-12) });
    while (MIC.env.length && MIC.env[0].t < t - MIC_KEEP) MIC.env.shift();
    if (++MIC.n % MIC_FS === 0) micAnalyse();
    if (!document.hidden && $("#mcTrace").offsetParent !== null) micDraw();
  }

  /* Start listening. The audio context is made at once, in the tap, so the browser lets it run;
     the microphone comes with its own processing off (echo cancelling, noise suppression and
     automatic gain would take the breath sounds out or flatten them). */
  function micStart() {
    if (MIC.on || MIC.busy) return;
    var md = navigator.mediaDevices, AC = window.AudioContext || window.webkitAudioContext;
    MIC.err = "";
    if (!md || !md.getUserMedia || !AC) { micFail({ name: "NotSupportedError" }); return; }
    var ctx;
    try { ctx = new AC(); if (ctx.resume) ctx.resume().catch(function () {}); } catch (e) { micFail(e); return; }
    MIC.busy = true; MIC.ctx = ctx;
    micUI();
    var audio = { echoCancellation: false, noiseSuppression: false, autoGainControl: false, channelCount: 1 };
    if (MIC.devId) audio.deviceId = { exact: MIC.devId };
    md.getUserMedia({ audio: audio }).catch(function (e) {
      if (!MIC.devId || !e || !/^(OverconstrainedError|NotFoundError)$/.test(e.name)) throw e;
      MIC.devId = ""; store.set("micDev", "");                                // the one picked before is gone: the usual one
      delete audio.deviceId;
      return md.getUserMedia({ audio: audio });
    }).then(function (stream) {
      if (!MIC.busy || MIC.ctx !== ctx) { stream.getTracks().forEach(function (t) { t.stop(); }); return; }   // turned off meanwhile
      return micGraph(ctx, stream);
    }).catch(micFail);
  }
  function micGraph(ctx, stream) {
    MIC.stream = stream;
    var tr = stream.getAudioTracks()[0];
    MIC.label = tr && tr.label || "";
    try { MIC.cur = tr && tr.getSettings ? tr.getSettings().deviceId || "" : ""; } catch (e) { MIC.cur = ""; }
    if (tr) tr.addEventListener("ended", function () { if (MIC.on && MIC.stream === stream) { micStop(); MIC.err = "ended"; micUI(); } });
    var src = ctx.createMediaStreamSource(stream), f1 = ctx.createBiquadFilter(), f2 = ctx.createBiquadFilter(), f3 = ctx.createBiquadFilter();
    f1.type = f2.type = "highpass"; f1.frequency.value = f2.frequency.value = 500;
    f3.type = "lowpass"; f3.frequency.value = 5000;
    src.connect(f1); f1.connect(f2); f2.connect(f3);
    var go = function () {
      MIC.busy = false; MIC.on = true; MIC.t0 = bNow(); MIC.env = []; MIC.est = { q: "listening", left: MIC_MIN, conf: 0, snr: 0 }; MIC.n = 0;
      micUI(); micDraw(); micDevices(); specRead();
    };
    var analyser = function () {                     // where the audio thread can't run a worklet: read the level on a timer
      var an = ctx.createAnalyser(), buf;
      an.fftSize = 4096;
      buf = new Float32Array(an.fftSize);
      f3.connect(an);
      MIC.node = an;
      MIC.timer = setInterval(function () {
        an.getFloatTimeDomainData(buf);
        var s = 0;
        for (var i = 0; i < buf.length; i++) s += buf[i] * buf[i];
        micLevel(s / buf.length);
      }, 100);
    };
    if (ctx.audioWorklet && window.AudioWorkletNode && window.Blob && window.URL && URL.createObjectURL) {
      var url = URL.createObjectURL(new Blob([MIC_WORKLET], { type: "application/javascript" }));
      return ctx.audioWorklet.addModule(url).then(function () {
        URL.revokeObjectURL(url);
        if (MIC.ctx !== ctx) return;
        var node = new window.AudioWorkletNode(ctx, "breath-level", { numberOfInputs: 1, numberOfOutputs: 1, outputChannelCount: [1] }), mute = ctx.createGain();
        mute.gain.value = 0;                         // pulled by the speakers, so it runs, but silent
        node.port.onmessage = function (e) { micLevel(e.data); };
        f3.connect(node); node.connect(mute); mute.connect(ctx.destination);
        MIC.node = node;
        go();
      }, function () { URL.revokeObjectURL(url); if (MIC.ctx !== ctx) return; analyser(); go(); });
    }
    analyser(); go();
  }
  function micStop() {
    clearInterval(MIC.timer);
    MIC.timer = 0;
    if (MIC.stream) MIC.stream.getTracks().forEach(function (t) { try { t.stop(); } catch (e) {} });
    if (MIC.node && MIC.node.port) MIC.node.port.onmessage = null;
    if (MIC.ctx && MIC.ctx.close) MIC.ctx.close().catch(function () {});
    MIC.stream = null; MIC.ctx = null; MIC.node = null;
    MIC.on = false; MIC.busy = false; MIC.est = null; MIC.wasOk = false;
    micUI(); micDraw(); specRead(); drawSpectrum();
  }
  function micFail(e) {
    var n = (e && e.name) || "Error", embedded = false;
    try { embedded = window.self !== window.top; } catch (x) { embedded = true; }
    if (MIC.ctx && MIC.ctx.close) MIC.ctx.close().catch(function () {});
    MIC.ctx = null; MIC.busy = false; MIC.on = false;
    MIC.err = n === "NotAllowedError" || n === "SecurityError" ? (embedded ? "embedded" : "denied")
      : n === "NotFoundError" || n === "OverconstrainedError" ? "none"
      : n === "NotReadableError" || n === "AbortError" ? "busy"
      : n === "NotSupportedError" ? "unsupported" : "other:" + n;
    micUI();
  }

  // the microphones to choose from, with their names, once the page may use one
  function micDevices() {
    var md = navigator.mediaDevices, sel = $("#mcPick");
    if (!md || !md.enumerateDevices) return;
    md.enumerateDevices().then(function (ds) {
      var ins = ds.filter(function (d) { return d.kind === "audioinput" && d.label; });
      $("#mcPickL").hidden = ins.length < 2;
      sel.innerHTML = "";
      ins.forEach(function (d) {
        var o = document.createElement("option");
        o.value = d.deviceId; o.textContent = d.label;
        if (d.deviceId === (MIC.devId || MIC.cur) || (!MIC.devId && d.label === MIC.label)) o.selected = true;
        sel.appendChild(o);
      });
    }).catch(function () {});
  }

  /* Bluetooth earbuds and headsets switch to their call mode while their microphone is in use: sound
     comes back in mono and at call quality, and a binaural beat needs a different tone in each ear. */
  function micBluetooth() { return /bluetooth|hands-?free|airpods|buds|\bbt\b|headset/i.test(MIC.label); }
  function micFmt(r) { var x = Math.round(r * 10) / 10; return String(x % 1 ? x.toFixed(1) : x); }

  function micUI() {
    var e = MIC.est, s = "", hint = "Off";
    bSetT("#mcStart", MIC.busy ? "Starting…" : MIC.on ? "Stop listening" : "Listen for my breathing");
    $("#mcStart").setAttribute("aria-pressed", MIC.on ? "true" : "false");
    $("#breath-mic").dataset.on = MIC.on ? "1" : "";
    if (MIC.busy) { s = "Asking for the microphone…"; hint = "Starting"; }
    else if (!MIC.on) {
      s = MIC.err === "denied" ? "The microphone wasn't allowed. To use it, allow it for this page in the browser's site settings (tap the icon left of the address), then try again."
        : MIC.err === "embedded" ? "This copy sits inside another page, such as a preview, which blocks the microphone. Open the page at its own web address to use it."
        : MIC.err === "none" ? "No microphone was found. Plug one in, or check that the browser may use one."
        : MIC.err === "busy" ? "The microphone is busy or couldn't start: close any app that's using it, such as a call, and try again."
        : MIC.err === "unsupported" ? "This browser can't use the microphone here."
        : MIC.err === "ended" ? "The microphone stopped, perhaps because it was unplugged. Press Listen for my breathing to start again."
        : MIC.err ? "The microphone didn't start (" + MIC.err.slice(6) + "). Try again, or choose another browser." : "";
    } else if (!e || e.q === "listening") {
      s = "Listening… your breathing pace appears in about " + ((e && e.left) || MIC_MIN) + " s.";
      hint = "Listening";
    } else if (e.q === "silent") {
      s = "The microphone is sending silence. Is it muted, or is another app using it?";
      hint = "Silent";
    } else if (e.q === "quiet") {
      s = "Can't hear your breathing yet. Bring the microphone closer to your nose or mouth, or breathe out a little more audibly.";
      hint = "Too quiet";
    } else if (e.q === "unsteady") {
      s = "Hearing sound, but no steady breathing rhythm in it yet. Talking, music or noise in the room can cover your breathing.";
      hint = "No steady rhythm";
    } else {
      s = "Breathing about " + micFmt(e.rate) + " a minute" + (e.q === "ok" ? ", fairly sure" : "") +
        (e.used === "prior" ? (MIC.prior === "guide" ? ", taking the guide's pace into account" : ", taking your heart's rhythm into account") : "") + ".";
      hint = micFmt(e.rate) + " a minute";
      if (swingsHeard()) s += " Each breath it hears adds a bar to Breath by breath.";
    }
    bSetT("#mcRead", s);
    bSetT("#mcHint", hint);
    var warn = MIC.on && micBluetooth()
      ? "This looks like a Bluetooth microphone (" + MIC.label + "). While it's in use, Bluetooth earbuds switch to their call mode, which plays sound in mono: a binaural beat stops working. To keep the beat, choose the phone's or computer's own microphone, or use wired earphones." : "";
    bSetT("#mcWarn", warn);
    $("#mcWarn").hidden = !warn;
    if (!MIC.on) $("#mcPickL").hidden = true;
    var ok = micOk();
    $("#bMicStat").hidden = !ok;
    if (ok) bSetT("#bMic", micFmt(e.rate));
  }

  /* The last minute: the breath band's loudness above the room's floor on top, each breath it found
     marked, and heart rate below on its own scale, on one time line. */
  function micDraw() {
    var cv = $("#mcTrace"), f = fitCanvas(cv), now = bNow(), SPAN = 60;
    $("#mcEmpty").hidden = MIC.on && MIC.env.length > 3;
    if (!f || !MIC.on || MIC.env.length < 2) return;
    var c = f.c, W = f.w, Hh = f.h, padL = 36, padR = 8, padT = 16, padB = 18, gapY = 12;
    var hs = hrLive() ? H.series.filter(function (s) { return s.t >= now - SPAN; }) : [];
    var hasHr = hs.length > 3, ph = Hh - padT - padB, bh = hasHr ? Math.round((ph - gapY) * 0.56) : ph, hh = ph - gapY - bh;
    var X = function (t) { return padL + (1 - (now - t) / SPAN) * (W - padL - padR); };
    var e = MIC.env.filter(function (x) { return x.t >= now - SPAN; }), dbs = e.map(function (x) { return x.db; });
    var fl = micPct(dbs, 0.1), span = Math.max(6, micPct(dbs, 0.98) - fl), base = padT + bh;
    c.font = "600 10.5px " + B_SANS; c.fillStyle = BCOL["text-faint"]; c.textBaseline = "bottom"; c.textAlign = "left";
    c.fillText("Breath sound", padL, padT - 3);
    c.strokeStyle = BCOL.line; c.lineWidth = 1;
    c.beginPath(); c.moveTo(padL, base + 0.5); c.lineTo(W - padR, base + 0.5); c.stroke();
    c.beginPath(); c.moveTo(X(e[0].t), base);
    e.forEach(function (x) { c.lineTo(X(x.t), base - Math.min(1, Math.max(0, x.db - fl) / span) * bh); });
    c.lineTo(X(e[e.length - 1].t), base); c.closePath();
    c.fillStyle = rgba(BCOL["b-in"], 0.22); c.fill();
    c.beginPath();
    e.forEach(function (x, i) { var y = base - Math.min(1, Math.max(0, x.db - fl) / span) * bh; if (i) c.lineTo(X(x.t), y); else c.moveTo(X(x.t), y); });
    c.strokeStyle = rgba(BCOL["b-in"], 0.95); c.lineWidth = 1.5; c.stroke();
    c.fillStyle = BCOL.text;                                                 // each breath found
    MIC.marks.forEach(function (t) {
      if (t < now - SPAN) return;
      c.beginPath(); c.arc(X(t), padT + 3, 3, 0, 2 * Math.PI); c.fill();
    });
    if (hasHr) {
      var top = base + gapY, lo = Infinity, hi = -Infinity;
      hs.forEach(function (s) { if (s.hr < lo) lo = s.hr; if (s.hr > hi) hi = s.hr; });
      lo = Math.floor(lo - 1); hi = Math.ceil(hi + 1);
      var Y = function (v) { return top + (1 - (v - lo) / (hi - lo)) * hh; };
      c.strokeStyle = BCOL.line; c.lineWidth = 1;
      c.beginPath(); c.moveTo(padL, top + hh + 0.5); c.lineTo(W - padR, top + hh + 0.5); c.stroke();
      c.textAlign = "right"; c.textBaseline = "middle"; c.fillStyle = BCOL["text-faint"];
      c.fillText(String(hi), padL - 6, top + 4); c.fillText(String(lo), padL - 6, top + hh - 4);
      c.textAlign = "left"; c.textBaseline = "bottom";
      c.fillText("Heart rate, bpm", padL, top + 1);
      c.beginPath();
      hs.forEach(function (s, i) { if (i) c.lineTo(X(s.t), Y(s.hr)); else c.moveTo(X(s.t), Y(s.hr)); });
      c.strokeStyle = rgba(BCOL.hr, 0.95); c.lineWidth = 2; c.lineJoin = "round"; c.stroke();
    }
    c.fillStyle = BCOL["text-faint"]; c.textBaseline = "top";
    c.textAlign = "left"; c.fillText("1 min ago", padL, Hh - padB + 4);
    c.textAlign = "right"; c.fillText("now", W - padR, Hh - padB + 4);
  }

  function micInit() {
    MIC.devId = store.get("micDev") || "";
    $("#mcStart").addEventListener("click", function () { if (MIC.on || MIC.busy) { micStop(); MIC.err = ""; micUI(); } else micStart(); });
    $("#mcPick").addEventListener("change", function () {
      MIC.devId = this.value;
      store.set("micDev", MIC.devId);
      if (MIC.on) { micStop(); micStart(); }
    });
    if (window.ResizeObserver) new ResizeObserver(function () { micDraw(); }).observe($("#mcTrace"));
    window.addEventListener("pagehide", function () { if (MIC.on || MIC.busy) micStop(); });
    micUI();
  }
