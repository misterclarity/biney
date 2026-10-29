
  /* ------------------------- background sound and rhythm -------------------------
     Everything here is synthesised on the device the first time it's needed, then
     looped: no recordings and nothing downloaded. Rain is filtered noise with a patter
     of tiny impacts and the odd bright drop; crickets are pulsed tones at the pitch and
     chirp rate of field crickets on a warm night; the berimbau is a struck-string model
     with a gourd resonance, the coin's buzz and the caxixi's rattle. Loops have
     different lengths, so the layers drift against each other and don't audibly repeat.
  ------------------------------------------------------------------------------ */
  var AMB_SR = 22050;
  function amRand(seed) {                       // a small seeded generator (mulberry32)
    var a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      var t = Math.imul(a ^ (a >>> 15), a | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function amPink(n, rnd) {                     // Paul Kellet's pink-noise filter
    var out = new Float32Array(n), b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (var i = 0; i < n; i++) {
      var w = rnd() * 2 - 1;
      b0 = 0.99886 * b0 + w * 0.0555179; b1 = 0.99332 * b1 + w * 0.0750759; b2 = 0.969 * b2 + w * 0.153852;
      b3 = 0.8665 * b3 + w * 0.3104856; b4 = 0.55 * b4 + w * 0.5329522; b5 = -0.7616 * b5 - w * 0.016898;
      out[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11; b6 = w * 0.115926;
    }
    return out;
  }
  function amA(fc, sr) { return 1 - Math.exp(-2 * Math.PI * fc / sr); }   // one-pole coefficient
  /* A seamless loop: the overhang past `len` is crossfaded into the start (for noise beds)... */
  function amXfade(ch, len, x) {
    ch.forEach(function (d) {
      for (var i = 0; i < x; i++) { var u = i / x; d[i] = d[i] * Math.sin(u * Math.PI / 2) + d[len + i] * Math.cos(u * Math.PI / 2); }
    });
  }
  /* ...or added back onto it (for events whose tails cross the end). */
  function amFold(ch, len) {
    ch.forEach(function (d) { for (var i = len; i < d.length; i++) d[i - len] += d[i]; });
  }
  function amNorm(ch, len, rms) {
    var s = 0, n = 0;
    ch.forEach(function (d) { for (var i = 0; i < len; i++) { s += d[i] * d[i]; n++; } });
    var k = rms / Math.sqrt(s / n || 1e-12);
    ch.forEach(function (d) { for (var i = 0; i < len; i++) d[i] *= k; });
    return ch.map(function (d) { return d.subarray(0, len); });
  }
  /* A burst added at time t: fn(k) gives sample k, panned 0 (left) to 1 (right). */
  function amAdd(ch, sr, t, m, pan, fn) {
    var i0 = Math.round(t * sr), gl = Math.cos(pan * Math.PI / 2), gr = Math.sin(pan * Math.PI / 2), L = ch[0], R = ch[1];
    for (var k = 0; k < m && i0 + k < L.length; k++) { var v = fn(k); L[i0 + k] += v * gl; R[i0 + k] += v * gr; }
  }

  /* ----- summer rain: a soft wash, a dense patter, drops on leaves, the odd eave drip ----- */
  function amRain(sr) {
    var secs = 11.3, len = Math.round(secs * sr), X = Math.round(0.6 * sr), rnd = amRand(11);
    var bed = [new Float32Array(len + X), new Float32Array(len + X)], ev = [new Float32Array(len + sr), new Float32Array(len + sr)];
    var lp = amA(3800, sr), hp = amA(300, sr), lr = amA(160, sr);
    bed.forEach(function (d, c) {
      var p = amPink(d.length, rnd), a = 0, b = 0, br = 0, sw = 1;
      for (var i = 0; i < d.length; i++) {
        if (!(i & 127)) { var t = i / sr; sw = 0.82 + 0.11 * Math.sin(2 * Math.PI * t / secs + c) + 0.07 * Math.sin(4 * Math.PI * t / secs + 1.3); }
        a += lp * (p[i] - a); b += hp * (a - b);              // band-limited hiss
        br += lr * (p[(i + 7919) % d.length] - br);           // low rumble on the ground
        d[i] = ((a - b) * 0.55 + br * 1.6) * sw;
      }
    });
    amXfade(bed, len, X);
    // the patter: hundreds of tiny impacts a second, most of them faint, softened like rain on leaves
    var pa = amA(5200, sr), EL = ev[0], ER = ev[1];
    for (var t = 0; t < secs; t += -Math.log(1 - rnd()) / 300) {
      var amp = Math.pow(rnd(), 3.4) * 0.22, m = (0.0015 + rnd() * 0.004) * sr, dec = Math.exp(-1 / m), pan = rnd();
      var gl = Math.cos(pan * Math.PI / 2) * amp, gr = Math.sin(pan * Math.PI / 2) * amp, e = 1, y = 0, i0 = Math.round(t * sr), n = Math.round(m * 5);
      for (var k = 0; k < n; k++) { y += pa * ((rnd() * 2 - 1) * e - y); e *= dec; EL[i0 + k] += y * gl; ER[i0 + k] += y * gr; }
    }
    // drops: little bubble resonances whose pitch rises as they ring
    for (t = 0; t < secs; t += -Math.log(1 - rnd()) / 7) {
      (function (f0, d, amp) {
        var ph = 0;
        amAdd(ev, sr, t, Math.round(d * 5 * sr), rnd(), function (k) {
          var tt = k / sr; ph += 2 * Math.PI * f0 * (1 + 0.5 * tt / d) / sr;
          return Math.sin(ph) * Math.exp(-tt / d) * amp;
        });
      })(1400 + rnd() * 3200, 0.004 + rnd() * 0.01, 0.04 + Math.pow(rnd(), 2) * 0.16);
    }
    // a slow drip from somewhere close: lower, rounder
    for (t = rnd(); t < secs; t += 0.9 + rnd() * 1.6) {
      (function (f0, amp) {
        var ph = 0;
        amAdd(ev, sr, t, Math.round(0.16 * sr), 0.3 + rnd() * 0.4, function (k) {
          var tt = k / sr; ph += 2 * Math.PI * f0 * (1 + 2.2 * tt) / sr;
          return Math.sin(ph) * Math.exp(-tt / 0.03) * amp;
        });
      })(520 + rnd() * 380, 0.06 + rnd() * 0.06);
    }
    amFold(ev, len);
    for (var c = 0; c < 2; c++) for (var i = 0; i < len; i++) bed[c][i] += ev[c][i];
    return amNorm(bed, len, 0.11);
  }

  /* ----- crickets: field crickets chirping (3 to 5 pulses at 4 to 5 kHz), a distant trill ----- */
  function amCrickets(sr, seed, secs, voices, trill) {
    var len = Math.round(secs * sr), X = Math.round(0.5 * sr), rnd = amRand(seed);
    var bed = [new Float32Array(len + X), new Float32Array(len + X)], ev = [new Float32Array(len + sr), new Float32Array(len + sr)];
    var la = amA(700, sr);
    bed.forEach(function (d, c) {           // the night air: barely there, so the gaps aren't digital silence
      var a = 0, f = 2850 + c * 90, fp = 44 + c * 3;
      var cs = Math.cos(2 * Math.PI * f / sr), sn = Math.sin(2 * Math.PI * f / sr), x = 1, y = 0;          // a running sine
      var cp = Math.cos(2 * Math.PI * fp / sr), sp = Math.sin(2 * Math.PI * fp / sr), px = 1, py = 0, swell = 1;
      for (var i = 0; i < d.length; i++) {
        a += la * (rnd() * 2 - 1 - a);
        d[i] = a * 0.05;
        if (trill) {
          var nx = x * cs - y * sn; y = x * sn + y * cs; x = nx;
          var qx = px * cp - py * sp; py = px * sp + py * cp; px = qx;
          if (!(i & 255)) { swell = 0.55 + 0.45 * Math.sin(2 * Math.PI * i / sr / 6.1 + c * 2); var r = 1 / Math.sqrt(x * x + y * y); x *= r; y *= r; r = 1 / Math.sqrt(px * px + py * py); px *= r; py *= r; }
          var pulse = 0.5 - 0.5 * px;
          d[i] += y * pulse * pulse * swell * 0.018;
        }
      }
    });
    amXfade(bed, len, X);
    voices.forEach(function (v) {
      var t = rnd() * v.per, rest = 3 + rnd() * 8;
      while (t < secs) {
        if (t > rest) { t += 0.8 + rnd() * 2.6; rest = t + 4 + rnd() * 9; continue; }   // crickets pause now and then
        for (var s = 0; s < v.n; s++) {
          (function (t0, f, amp) {
            var m = Math.round(v.on * sr), ph = rnd() * 6.28;
            amAdd(ev, sr, t0, m, v.pan, function (k) {
              var u = k / m, e = Math.sin(Math.PI * u);
              ph += 2 * Math.PI * f * (1 - 0.012 * u) / sr;
              return (Math.sin(ph) + 0.14 * Math.sin(2 * ph)) * e * e * amp;
            });
          })(t + s * v.gap * (0.97 + rnd() * 0.06), v.f * (1 + (rnd() - 0.5) * 0.004), v.amp * (s === 0 ? 0.75 : 1) * (0.88 + rnd() * 0.12));
        }
        t += v.per * (0.92 + rnd() * 0.16);
      }
    });
    amFold(ev, len);
    for (var c = 0; c < 2; c++) for (var i = 0; i < len; i++) bed[c][i] += ev[c][i];
    return amNorm(bed, len, 0.05);
  }
  function amCricketsA(sr) {
    return amCrickets(sr, 23, 13.1, [
      { f: 4650, per: 0.52, n: 4, on: 0.016, gap: 0.034, amp: 0.30, pan: 0.32 },
      { f: 4380, per: 0.71, n: 3, on: 0.018, gap: 0.036, amp: 0.14, pan: 0.78 },
      { f: 4920, per: 0.44, n: 4, on: 0.014, gap: 0.03, amp: 0.07, pan: 0.12 }], true);
  }
  function amCricketsB(sr) {
    return amCrickets(sr, 37, 17.9, [
      { f: 4520, per: 0.63, n: 5, on: 0.015, gap: 0.032, amp: 0.2, pan: 0.6 },
      { f: 4210, per: 0.86, n: 3, on: 0.019, gap: 0.038, amp: 0.09, pan: 0.92 },
      { f: 4790, per: 0.57, n: 4, on: 0.015, gap: 0.031, amp: 0.05, pan: 0.05 }], false);
  }

  /* ----- the berimbau: chi chi DONG . ding (toque de Angola) ----- */
  var RHY = { bar: 1.8, bars: 4, src: null, gain: null, on: false };
  RHY.beat = RHY.bar / 2;
  function amBerimbau(sr, bar, bars) {
    var len = Math.round(bars * bar * sr), ext = Math.round(2 * sr), rnd = amRand(5), slot = bar / 8;
    var ch = [new Float32Array(len + ext), new Float32Array(len + ext)];
    /* The wire: a Karplus-Strong string struck with a stick, through the gourd's resonance. */
    function wire(t, f, amp, decay, o) {
      var N = Math.max(2, Math.round(sr / f)), buf = new Float32Array(N), prev = 0, i;
      for (i = 0; i < N; i++) { var w = rnd() * 2 - 1; prev += (o.mute ? 0.35 : 0.7) * (w - prev); buf[i] = prev; }
      var rho = Math.pow(0.001, 1 / (sr * decay)), idx = 0, m = Math.round(Math.min(decay * 1.6, 1.9) * sr);
      var x1 = 0, x2 = 0, y1 = 0, y2 = 0, lo = 0, la = amA(o.mute ? 1400 : 5200, sr);
      amAdd(ch, sr, t, m, 0.46, function (k) {
        var y = buf[idx], nx = buf[(idx + 1) % N];
        buf[idx] = rho * 0.5 * (y + nx); idx = (idx + 1) % N;
        var s = Math.tanh((o.mute ? 4 : 1.7) * y);             // the wire buzzing on the coin
        if (o.mute) s += (rnd() * 2 - 1) * 0.35 * Math.exp(-k / (0.012 * sr));
        // the gourd: a band-pass that sweeps open ("wah") as it leaves the belly
        var tt = k / sr, f0 = o.mute ? 380 : 330 + 320 * (1 - Math.exp(-tt / 0.18)), w0 = 2 * Math.PI * f0 / sr, al = Math.sin(w0) / (2 * 2.2);
        var b0 = al, a0 = 1 + al, a1 = -2 * Math.cos(w0), a2 = 1 - al;
        var r = (b0 * s - b0 * x2 - a1 * y1 - a2 * y2) / a0;
        x2 = x1; x1 = s; y2 = y1; y1 = r;
        lo += la * (0.5 * s + 1.4 * r - lo);
        return lo * amp * Math.min(1, k / 12, (m - k) / 220);
      });
    }
    /* The caxixi: a basket of seeds, a short cloud of grains. */
    function caxixi(t, amp) {
      var n = 18 + Math.floor(rnd() * 14);
      for (var g = 0; g < n; g++) {
        (function (dt, a) {
          var m = Math.round(0.006 * sr), prev = 0;
          amAdd(ch, sr, t + dt, m * 3, 0.56, function (k) { var w = rnd() * 2 - 1, x = w - prev; prev = w; return x * Math.exp(-k / m) * a; });
        })(Math.pow(rnd(), 1.6) * 0.055, amp * (0.3 + rnd() * 0.7) * 0.25);
      }
    }
    for (var b = 0; b < bars; b++) {
      var t0 = b * bar, j = function () { return (rnd() - 0.5) * 0.012; }, v = function () { return 0.9 + rnd() * 0.2; };
      wire(t0 + j(), 196, 0.32 * v(), 0.07, { mute: true }); caxixi(t0, 0.7);                  // chi
      wire(t0 + slot + j(), 196, 0.28 * v(), 0.07, { mute: true }); caxixi(t0 + slot, 0.6);    // chi
      wire(t0 + 2 * slot + j(), 98, 1.0 * v(), 0.85, {}); caxixi(t0 + 2 * slot, 0.8);           // DONG, the open wire
      wire(t0 + 4 * slot + j(), 110, 0.8 * v(), 0.5, {}); caxixi(t0 + 4 * slot, 0.6);           // ding, a tone higher with the coin pressed
    }
    amFold(ch, len);
    return amNorm(ch, len, 0.1);
  }

  /* ----- rendering off the main thread -----
     The same functions run in a small worker made from their own source, so a phone
     doesn't stall for the second it takes. Without workers they run here instead. */
  var AM = { data: {}, bufs: {}, wait: {}, w: null };
  var AM_FNS = [amRand, amPink, amA, amXfade, amFold, amNorm, amAdd, amRain, amCrickets, amCricketsA, amCricketsB, amBerimbau];
  function amMake(name) {
    return name === "rain" ? amRain(AMB_SR) : name === "crkA" ? amCricketsA(AMB_SR) : name === "crkB" ? amCricketsB(AMB_SR) : amBerimbau(AMB_SR, RHY.bar, RHY.bars);
  }
  function amWorker() {
    if (AM.w !== null) return AM.w;
    AM.w = false;
    try {
      if (!window.Worker || !window.Blob || !window.URL) return false;
      var src = '"use strict";var AMB_SR=' + AMB_SR + ";\n" + AM_FNS.map(String).join("\n") +
        "\nonmessage=function(e){var n=e.data,ch=n==='rain'?amRain(AMB_SR):n==='crkA'?amCricketsA(AMB_SR):n==='crkB'?amCricketsB(AMB_SR):amBerimbau(AMB_SR," + RHY.bar + "," + RHY.bars + ");" +
        "postMessage({name:n,L:ch[0],R:ch[1]},[ch[0].buffer,ch[1].buffer]);};";
      var w = new Worker(URL.createObjectURL(new Blob([src], { type: "text/javascript" })));
      w.onmessage = function (e) { amGot(e.data.name, [e.data.L, e.data.R]); };
      w.onerror = function () {                    // a blocked or broken worker: finish the work here
        AM.w = false;
        Object.keys(AM.wait).forEach(function (n) { amGot(n, amMake(n)); });
      };
      AM.w = w;
    } catch (e) { AM.w = false; }
    return AM.w;
  }
  function amGot(name, ch) {
    AM.data[name] = ch;
    var cbs = AM.wait[name] || [];
    delete AM.wait[name];
    cbs.forEach(function (cb) { try { cb(); } catch (e) {} });
  }
  /* True if every named loop is rendered; otherwise starts rendering what's missing and
     calls back when it's all there (never synchronously, so callers can't loop). */
  function amNeed(names, cb) {
    var miss = names.filter(function (n) { return !AM.data[n]; });
    if (!miss.length) return true;
    var left = miss.length, done = function () { if (--left === 0 && cb) cb(); };
    miss.forEach(function (n) {
      if (AM.wait[n]) { AM.wait[n].push(done); return; }
      AM.wait[n] = [done];
      var w = amWorker();
      if (w) w.postMessage(n);
      else setTimeout(function () { amGot(n, amMake(n)); }, 0);
    });
    return false;
  }
  function amBuf(name) {
    if (!AM.bufs[name]) {
      var ch = AM.data[name], b = A.ctx.createBuffer(2, ch[0].length, AMB_SR);
      b.getChannelData(0).set(ch[0]); b.getChannelData(1).set(ch[1]);
      AM.bufs[name] = b;
    }
    return AM.bufs[name];
  }

  /* ----- playback ----- */
  var AMB = { kind: "off", vol: 40, out: null, srcs: [], playing: null, until: 0, tick: 0 };
  var AMB_KINDS = [["off", "Off"], ["rain", "Summer rain"], ["crickets", "Crickets"], ["night", "Rain and crickets"]];
  var AMB_SHORT = { off: "Off", rain: "Rain", crickets: "Crickets", night: "Rain + crickets" };
  function ambGain() { var v = AMB.vol / 100; return v * v * 0.9; }
  function ambLayers(kind) {
    return kind === "rain" ? [["rain", 1]] : kind === "crickets" ? [["crkA", 1], ["crkB", 1]] : kind === "night" ? [["rain", 0.8], ["crkA", 0.55], ["crkB", 0.55]] : [];
  }
  function ambStart(kind) {
    var layers = ambLayers(kind);
    if (!amNeed(layers.map(function (l) { return l[0]; }), ambSync)) return;     // starts when rendered
    if (!ensureCtx()) return;
    var ctx = A.ctx, now = ctx.currentTime;
    if (!AMB.out) { AMB.out = ctx.createGain(); AMB.out.gain.value = 0; AMB.out.connect(ctx.destination); }
    layers.forEach(function (l) {
      var src = ctx.createBufferSource(), g = ctx.createGain();
      src.buffer = amBuf(l[0]); src.loop = true; g.gain.value = l[1];
      src.connect(g); g.connect(AMB.out);
      src.start(now, Math.random() * src.buffer.duration);
      AMB.srcs.push([src, g]);
    });
    AMB.out.gain.cancelScheduledValues(now);
    AMB.out.gain.setValueAtTime(AMB.out.gain.value, now);
    AMB.out.gain.linearRampToValueAtTime(ambGain(), now + 2);
    AMB.playing = kind;
  }
  function ambStop(fade) {
    if (!AMB.playing || !A.ctx) { AMB.playing = null; return; }
    var ctx = A.ctx, now = ctx.currentTime, f = fade === undefined ? 1.5 : fade, old = AMB.srcs;
    AMB.srcs = []; AMB.playing = null;
    AMB.out.gain.cancelScheduledValues(now);
    AMB.out.gain.setValueAtTime(AMB.out.gain.value, now);
    AMB.out.gain.linearRampToValueAtTime(0, now + f);
    old.forEach(function (p) { try { p[0].stop(now + f + 0.05); } catch (e) {} p[0].onended = function () { try { p[0].disconnect(); p[1].disconnect(); } catch (e) {} }; });
  }
  /* Background sound plays whenever something is running: a track, the breathing guide or a
     practice (a short preview too). It follows them in and out, so there's nothing to manage. */
  function ambActive() {
    return !!(A.playing || B.state === "running" || (typeof P !== "undefined" && P.state === "running") || bNow() < AMB.until);
  }
  function ambSync() {
    var want = AMB.kind !== "off" && ambActive() ? AMB.kind : null;
    if (want === AMB.playing) return;
    if (AMB.playing) ambStop(want ? 0.8 : 1.5);
    if (want) ambStart(want);
  }
  function ambVolNow() {
    if (AMB.out && AMB.playing && A.ctx) AMB.out.gain.setTargetAtTime(ambGain(), A.ctx.currentTime, 0.08);
  }
  function ambSet(kind, quiet) {
    AMB.kind = kind;
    store.set("amb", kind);
    if (kind !== "off" && !ambActive() && !quiet) AMB.until = bNow() + 5;     // a five-second taste
    ambSync(); ambUI();
  }
  function ambSetVol(v) { AMB.vol = Math.max(0, Math.min(100, v)); store.set("ambVol", String(AMB.vol)); ambVolNow(); ambUI(); }
  /* All the background-sound controls share these classes and stay in step. */
  function ambChips(id) {
    return '<div class="mini-seg amb-seg"' + (id ? ' id="' + id + '"' : "") + ' role="group" aria-label="Background sound">' + AMB_KINDS.map(function (k) {
      return '<button data-amb="' + k[0] + '" aria-pressed="' + (AMB.kind === k[0]) + '">' + (k[0] === "night" ? "Both" : k[0] === "rain" ? "Rain" : k[1]) + "</button>";
    }).join("") + "</div>";
  }
  function ambVolInput(label) {
    return '<input type="range" class="amb-vol" min="0" max="100" value="' + AMB.vol + '" aria-label="' + (label || "Background volume") + '">';
  }
  function ambCtl() {
    return ambChips() + '<label class="amb-volrow b-vol"' + (AMB.kind === "off" ? " hidden" : "") + "><span>Volume</span>" + ambVolInput() + "</label>";
  }
  function ambUI() {
    var i, bs = document.querySelectorAll("[data-amb]");
    for (i = 0; i < bs.length; i++) bs[i].setAttribute("aria-pressed", bs[i].dataset.amb === AMB.kind ? "true" : "false");
    var vs = document.querySelectorAll(".amb-vol");
    for (i = 0; i < vs.length; i++) if (document.activeElement !== vs[i]) vs[i].value = AMB.vol;
    var rows = document.querySelectorAll(".amb-volrow");
    for (i = 0; i < rows.length; i++) rows[i].hidden = AMB.kind === "off";
    var sel = document.querySelectorAll(".amb-sel");
    for (i = 0; i < sel.length; i++) sel[i].value = AMB.kind;
    var q = $("#sqAmb");
    if (q) { q.setAttribute("aria-pressed", AMB.kind !== "off" ? "true" : "false"); bSetT("#sqAmbTxt", AMB.kind === "off" ? "Background" : AMB_SHORT[AMB.kind]); }
  }
  function ambInit() {
    var k = store.get("amb");
    if (AMB_KINDS.some(function (x) { return x[0] === k; })) AMB.kind = k;
    var v = parseInt(store.get("ambVol"), 10);
    if (!isNaN(v)) AMB.vol = Math.max(0, Math.min(100, v));
    document.addEventListener("click", function (e) {
      var b = e.target.closest && e.target.closest("[data-amb]");
      if (b) ambSet(b.dataset.amb);
    });
    document.addEventListener("input", function (e) {
      if (e.target.classList && e.target.classList.contains("amb-vol")) ambSetVol(parseInt(e.target.value, 10));
    });
    document.addEventListener("change", function (e) {
      if (e.target.classList && e.target.classList.contains("amb-sel")) ambSet(e.target.value);
    });
    var hosts = document.querySelectorAll("[data-amb-ctl]");
    for (var i = 0; i < hosts.length; i++) hosts[i].innerHTML = ambCtl();
    AMB.tick = setInterval(ambSync, 500);
    ambUI();
  }

  /* ----- the berimbau loop, locked to the practice clock ----- */
  function rhyPlay(T) {
    if (!ensureCtx()) return;
    var ctx = A.ctx, loop = RHY.bar * RHY.bars, now = ctx.currentTime;
    if (RHY.on) {                                  // already playing: just check it hasn't drifted
      var want = RHY.ct0 + (T - RHY.T0), drift = ((now - want) % loop + loop) % loop;
      if (Math.min(drift, loop - drift) < 0.06) return;
      rhyStop(0.05);
    }
    if (!amNeed(["rhy"])) return;                // rendering; the next tick starts it
    if (!RHY.gain) { RHY.gain = ctx.createGain(); RHY.gain.gain.value = 0; RHY.gain.connect(ctx.destination); }
    var src = ctx.createBufferSource(), off = ((T % loop) + loop) % loop;
    src.buffer = amBuf("rhy"); src.loop = true; src.connect(RHY.gain);
    src.start(now, off);
    RHY.src = src; RHY.on = true; RHY.T0 = T; RHY.ct0 = now;
    RHY.gain.gain.cancelScheduledValues(now);
    RHY.gain.gain.setValueAtTime(RHY.gain.gain.value, now);
    RHY.gain.gain.linearRampToValueAtTime(0.85, now + 0.5);
  }
  function rhyStop(fade) {
    if (!RHY.on || !A.ctx) { RHY.on = false; return; }
    var now = A.ctx.currentTime, f = fade === undefined ? 1.2 : fade, src = RHY.src;
    RHY.on = false; RHY.src = null;
    RHY.gain.gain.cancelScheduledValues(now);
    RHY.gain.gain.setValueAtTime(RHY.gain.gain.value, now);
    RHY.gain.gain.linearRampToValueAtTime(0, now + f);
    try { src.stop(now + f + 0.05); } catch (e) {}
    src.onended = function () { try { src.disconnect(); } catch (e) {} };
  }
