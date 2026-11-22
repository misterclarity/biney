
  /* ------------------------- background sound and rhythm -------------------------
     Everything here is synthesised on the device the first time it's needed, then
     looped: no recordings and nothing downloaded. Rain is filtered noise with a patter
     of tiny impacts and the odd bright drop; crickets are pulsed tones at the pitch and
     chirp rate of field crickets on a warm night; the berimbau is a struck-string model
     with a gourd resonance, the coin's buzz and the caxixi's rattle. Loops have
     different lengths, so the layers drift against each other and don't audibly repeat.
     The nature sounds from the brain-wave guide (birdsong, a stream, wind in the leaves
     and a crackling fire) are layers to add to rain or crickets, or to have on their own,
     each on or off as you like, since people differ in which natural sounds they find
     pleasant. They open with a donation (supporter.js); until this device is unlocked,
     any kept from before stay silent. Sleep sounds (sleepsounds.js) plays the same
     loops, and pink noise, with a long fade.
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
  // to a target loudness (root mean square); cap: the highest peak allowed, for sparse sounds whose few loud moments carry it
  function amNorm(ch, len, rms, cap) {
    var s = 0, n = 0, pk = 0;
    ch.forEach(function (d) { for (var i = 0; i < len; i++) { s += d[i] * d[i]; n++; if (Math.abs(d[i]) > pk) pk = Math.abs(d[i]); } });
    var k = rms / Math.sqrt(s / n || 1e-12);
    if (cap && pk * k > cap) k = cap / pk;
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

  /* A biquad's coefficients (Robert Bristow-Johnson's cookbook): "lp" low-pass, "hp" high-pass, "bp" band-pass
     with a peak of 1, for amFilt to run over a channel. */
  function amBiq(type, f, q, sr) {
    var w = 2 * Math.PI * Math.min(f, sr * 0.45) / sr, cs = Math.cos(w), al = Math.sin(w) / (2 * q), a0 = 1 + al, b0, b1, b2;
    if (type === "lp") { b0 = (1 - cs) / 2; b1 = 1 - cs; b2 = b0; }
    else if (type === "hp") { b0 = (1 + cs) / 2; b1 = -(1 + cs); b2 = b0; }
    else { b0 = al; b1 = 0; b2 = -al; }
    return [b0 / a0, b1 / a0, b2 / a0, -2 * cs / a0, (1 - al) / a0];
  }
  // run a biquad over d, in place (or into out)
  function amFilt(d, c, out) {
    var o = out || d, x1 = 0, x2 = 0, y1 = 0, y2 = 0;
    for (var i = 0; i < d.length; i++) {
      var x = d[i], y = c[0] * x + c[1] * x1 + c[2] * x2 - c[3] * y1 - c[4] * y2;
      x2 = x1; x1 = x; y2 = y1; y1 = y; o[i] = y;
    }
    return o;
  }
  // a slow wobble that repeats exactly once a loop: whole numbers of cycles, so a bed can swell across the seam
  function amSlow(t, secs, parts) {
    var v = 0;
    for (var i = 0; i < parts.length; i++) v += parts[i][1] * Math.sin(2 * Math.PI * parts[i][0] * t / secs + parts[i][2]);
    return v;
  }

  /* ----- pink noise for sleep: plain and even, a long loop so it never sounds like a pattern ----- */
  function amPinkBed(sr) {
    var secs = 12.7, len = Math.round(secs * sr), X = Math.round(0.8 * sr), rnd = amRand(43);
    var ch = [amPink(len + X, rnd), amPink(len + X, rnd)];
    ch.forEach(function (d) { amFilt(d, amBiq("hp", 25, 0.7, sr)); });      // no rumble below hearing
    amXfade(ch, len, X);
    return amNorm(ch, len, 0.1);
  }

  /* ----- a stream: the rush of moving water, its babble, and the small bubbles that make it a brook ----- */
  function amStream(sr) {
    var secs = 14.3, len = Math.round(secs * sr), X = Math.round(0.6 * sr), rnd = amRand(47);
    var bed = [new Float32Array(len + X), new Float32Array(len + X)], ev = [new Float32Array(len + sr), new Float32Array(len + sr)];
    bed.forEach(function (d, c) {
      var n = amPink(d.length, rnd), lo = amFilt(n, amBiq("bp", 380, 0.6, sr), new Float32Array(d.length)), mid = amFilt(n, amBiq("bp", 1500, 0.9, sr), new Float32Array(d.length));
      var hi = amFilt(n, amBiq("hp", 3800, 0.7, sr), new Float32Array(d.length));
      var la = amA(5, sr), g = 0, sw = 1;
      for (var i = 0; i < d.length; i++) {
        if (!(i & 63)) sw = 0.82 + amSlow(i / sr, secs, [[2, 0.1, c], [5, 0.06, 1.3 + c], [9, 0.03, 2.1]]);
        g += la * (Math.abs(n[(i * 7 + 1013) % d.length]) * 2.2 - g);        // the babble's quick, uneven swell
        d[i] = (lo[i] * 0.9 + mid[i] * (0.25 + g * 0.6) + hi[i] * 0.12) * sw;
      }
    });
    amXfade(bed, len, X);
    // bubbles: a ring whose pitch rises as it closes (smaller bubbles ring higher and shorter)
    function bubble(t, f0, amp, pan, tau, rise) {
      var ph = 0;
      amAdd(ev, sr, t, Math.round(tau * 6 * sr), pan, function (k) {
        var tt = k / sr; ph += 2 * Math.PI * f0 * (1 + rise * tt / tau) / sr;
        return Math.sin(ph) * Math.exp(-tt / tau) * amp * Math.min(1, k / 8);
      });
    }
    for (var t = 0; t < secs; t += -Math.log(1 - rnd()) / 90) {
      var f0 = 450 * Math.pow(5, rnd());                                     // 450 to 2,250 Hz
      bubble(t, f0, Math.pow(rnd(), 2.4) * 0.16 * Math.sqrt(900 / f0), 0.15 + rnd() * 0.7, (0.004 + rnd() * 0.01) * Math.sqrt(900 / f0), 0.25 + rnd() * 0.6);
    }
    for (t = rnd() * 0.5; t < secs; t += 0.25 + rnd() * 1.1) {            // now and then a deeper gloop
      bubble(t, 170 + rnd() * 260, 0.08 + rnd() * 0.1, 0.25 + rnd() * 0.5, 0.018 + rnd() * 0.02, 0.4 + rnd() * 0.5);
    }
    amFold(ev, len);
    for (var c = 0; c < 2; c++) for (var i = 0; i < len; i++) bed[c][i] += ev[c][i];
    return amNorm(bed, len, 0.08);
  }

  /* ----- wind in the leaves: gusts that come and go, and the rustle of leaves that rises with them ----- */
  function amWind(sr) {
    var secs = 19.3, len = Math.round(secs * sr), X = Math.round(0.8 * sr), rnd = amRand(53);
    var bed = [new Float32Array(len + X), new Float32Array(len + X)], ev = [new Float32Array(len + sr), new Float32Array(len + sr)];
    // how hard it blows, from 0.1 to 1: the same at the end of the loop as at the start
    var gust = function (t) { return Math.max(0.1, Math.min(1, 0.48 + amSlow(t, secs, [[2, 0.27, 0.4], [5, 0.15, 2.2], [9, 0.07, 4.1]]))); };
    bed.forEach(function (d, c) {
      var n = amPink(d.length, rnd), y1 = 0, y2 = 0, a = 0, g = 0.5, ws = [0, 0, 0, 0], wc = null;
      for (var i = 0; i < d.length; i++) {
        if (!(i & 63)) { g = gust((i / sr + c * 0.35) % secs); a = amA(220 + 1100 * g, sr); if (!(i & 1023)) wc = amBiq("bp", 380 + 520 * g, 7, sr); }
        y1 += a * (n[i] - y1); y2 += a * (y1 - y2);                          // the body of the wind, brighter in a gust
        var x = n[i], w = wc[0] * x + wc[2] * ws[1] - wc[3] * ws[2] - wc[4] * ws[3];      // and a faint whistle through the branches
        ws[1] = ws[0]; ws[0] = x; ws[3] = ws[2]; ws[2] = w;
        d[i] = y2 * (0.25 + 0.9 * g * g) * 1.8 + w * 0.05 * g;
      }
    });
    amXfade(bed, len, X);
    // the leaves: thousands of tiny, bright ticks, more of them and louder as the gust builds
    for (var t = 0; t < secs; ) {
      var g = gust(t), rate = 30 + 900 * g * g * g;
      t += -Math.log(1 - rnd()) / rate;
      if (t >= secs) break;
      (function (m, amp, pan) {
        var prev = 0, lp = 0, la = amA(6500, sr);
        amAdd(ev, sr, t, m * 4, pan, function (k) {
          var w = rnd() * 2 - 1, x = w - prev; prev = w; lp += la * (x - lp);
          return lp * Math.exp(-k / m) * amp;
        });
      })(Math.round((0.0015 + rnd() * 0.005) * sr), Math.pow(rnd(), 2) * (0.08 + 0.22 * gust(t)), rnd());
    }
    amFold(ev, len);
    for (var c = 0; c < 2; c++) for (var i = 0; i < len; i++) bed[c][i] += ev[c][i];
    return amNorm(bed, len, 0.07);
  }

  /* ----- a fire in the hearth: the low roar of the flames, a soft hiss, and crackles in clusters ----- */
  function amFire(sr) {
    var secs = 15.7, len = Math.round(secs * sr), X = Math.round(0.6 * sr), rnd = amRand(59);
    var bed = [new Float32Array(len + X), new Float32Array(len + X)], ev = [new Float32Array(len + sr), new Float32Array(len + sr)];
    var flick = new Float32Array(len + X), fl = 0, fa = amA(1.6, sr);          // how lively the flames are, shared by both sides
    for (var i = 0; i < flick.length; i++) { fl += fa * ((rnd() * 2 - 1) - fl); flick[i] = fl; }
    var fmax = 0;
    for (i = 0; i < flick.length; i++) fmax = Math.max(fmax, Math.abs(flick[i]));
    for (i = 0; i < flick.length; i++) flick[i] = 0.55 + 0.45 * flick[i] / (fmax || 1);
    bed.forEach(function (d, c) {
      var n = amPink(d.length, rnd), roar = amFilt(n, amBiq("lp", 160, 0.7, sr), new Float32Array(d.length)), body = amFilt(n, amBiq("bp", 420, 0.8, sr), new Float32Array(d.length));
      var hiss = amFilt(n, amBiq("hp", 2600, 0.7, sr), new Float32Array(d.length)), hs = 0, ha = amA(0.9, sr), hr = amRand(61 + c);
      for (var i = 0; i < d.length; i++) {
        hs += ha * ((hr() * 2 - 1) - hs);                                   // gas hissing out of the wood, in slow swells
        var f = flick[i];
        d[i] = roar[i] * 1.4 * f + body[i] * 0.35 * f * f + hiss[i] * 0.05 * (0.3 + 30 * hs * hs);
      }
    });
    amXfade(bed, len, X);
    // a crackle: a click shorter than a millisecond or two, brightened, at a random place in the spectrum
    function click(t, amp, pan) {
      var m = Math.max(3, Math.round((0.0002 + rnd() * 0.0018) * sr)), c = amBiq("bp", 1500 * Math.pow(6, rnd()), 1.2 + rnd() * 2, sr), s = [0, 0, 0, 0];
      amAdd(ev, sr, t, m * 6, pan, function (k) {
        var x = (rnd() * 2 - 1) * Math.exp(-k / m), y = c[0] * x + c[2] * s[1] - c[3] * s[2] - c[4] * s[3];
        s[1] = s[0]; s[0] = x; s[3] = s[2]; s[2] = y;
        return (y * 2.5 + x * 0.35) * amp;
      });
    }
    for (var t = 0; t < secs; ) {
      t += -Math.log(1 - rnd()) / (4 + 9 * flick[Math.min(flick.length - 1, Math.round(t * sr))]);
      if (t >= secs) break;
      var n = 1 + Math.floor(Math.pow(rnd(), 1.6) * 7), pan = 0.25 + rnd() * 0.5, loud = Math.pow(rnd(), 2.2);
      for (var k = 0, tc = t; k < n; k++, tc += 0.004 + Math.pow(rnd(), 2) * 0.06) click(tc, (0.08 + 0.9 * loud) * (0.4 + 0.6 * rnd()), pan + (rnd() - 0.5) * 0.08);
    }
    amFold(ev, len);
    for (var c = 0; c < 2; c++) for (i = 0; i < len; i++) bed[c][i] += ev[c][i];
    return amNorm(bed, len, 0.085, 0.65);
  }
  /* ...and, on a loop of another length, the pops of sap and the sparks that follow, and wood settling */
  function amFireP(sr) {
    var secs = 11.9, len = Math.round(secs * sr), rnd = amRand(67);
    var ch = [new Float32Array(len + sr), new Float32Array(len + sr)];
    function spark(t, amp, pan) {
      var m = Math.max(3, Math.round((0.0002 + rnd() * 0.0008) * sr)), prev = 0;
      amAdd(ch, sr, t, m * 6, pan, function (k) { var w = rnd() * 2 - 1, x = w - prev; prev = w; return x * Math.exp(-k / m) * amp; });
    }
    for (var t = 0.3 + rnd(); t < secs; t += 0.9 + rnd() * 2.6) {
      var pan = 0.3 + rnd() * 0.4, f0 = 90 + rnd() * 140, ph = 0, dec = 0.012 + rnd() * 0.025, amp = 0.35 + rnd() * 0.5;
      amAdd(ch, sr, t, Math.round(dec * 6 * sr), pan, function (k) {         // the pop: a thump in the log...
        var tt = k / sr; ph += 2 * Math.PI * f0 * (1 - 0.3 * Math.min(1, tt / 0.05)) / sr;
        return Math.sin(ph) * Math.exp(-tt / dec) * amp * Math.min(1, k / 4);
      });
      spark(t, amp * 0.9, pan);                                              // ...with a sharp edge
      for (var s = 0, n = 2 + Math.floor(rnd() * 7); s < n; s++) spark(t + 0.02 + Math.pow(rnd(), 1.5) * 0.45, amp * 0.25 * rnd(), pan + (rnd() - 0.5) * 0.3);
    }
    for (t = rnd() * 3; t < secs; t += 2.5 + rnd() * 4) {                    // wood settling: a soft, hollow knock
      (function (f, a, pan) {
        var ph = 0;
        amAdd(ch, sr, t, Math.round(0.06 * sr), pan, function (k) { var tt = k / sr; ph += 2 * Math.PI * f / sr; return Math.sin(ph) * Math.exp(-tt / 0.012) * a; });
      })(500 + rnd() * 900, 0.06 + rnd() * 0.08, 0.3 + rnd() * 0.4);
    }
    amFold(ch, len);
    return amNorm(ch, len, 0.035, 0.55);
  }

  /* ----- birdsong at dawn: songbirds near and far, each phrase a run of notes that glide, warble and trill ----- */
  // one note: a pure whistle gliding from f0 to f1, with a vibrato (a quick one makes a buzz or a trill),
  // its second harmonic, and further birds duller (lp: how much of the brightness is left, 0 to 1)
  function amChirp(ch, sr, t, d, f0, f1, amp, pan, o) {
    var m = Math.round(d * sr), ph = 0, vb = o.vib || 0, vr = o.rate || 0, h2 = o.h2 || 0.12, lp = 0, la = amA(o.lp ? 1500 + 6000 * o.lp : 9000, sr), cv = o.curve || 1;
    amAdd(ch, sr, t, m, pan, function (k) {
      var u = k / m, f = f0 + (f1 - f0) * Math.pow(u, cv) + f0 * vb * Math.sin(2 * Math.PI * vr * k / sr);
      ph += 2 * Math.PI * f / sr;
      var e = Math.pow(Math.sin(Math.PI * Math.min(1, u * (o.att || 1.6))), 0.7) * Math.pow(1 - u, 0.3);
      lp += la * ((Math.sin(ph) + h2 * Math.sin(2 * ph)) - lp);
      return lp * e * amp;
    });
  }
  function amBirds(sr, seed, secs, voices, air) {
    var len = Math.round(secs * sr), X = Math.round(0.6 * sr), rnd = amRand(seed);
    var bed = [new Float32Array(len + X), new Float32Array(len + X)], ev = [new Float32Array(len + 2 * sr), new Float32Array(len + 2 * sr)];
    bed.forEach(function (d) {                                                // morning air, just there, so the gaps aren't digital silence
      var n = amPink(d.length, rnd);
      amFilt(n, amBiq("bp", 600, 0.5, sr), d);
      for (var i = 0; i < d.length; i++) d[i] *= air;
    });
    amXfade(bed, len, X);
    voices.forEach(function (v) {
      var t = rnd() * v.rest[1];
      while (t < secs) {
        t = v.sing(ev, sr, rnd, t, v.amp, v.pan, v.lp || 0) + v.rest[0] + rnd() * (v.rest[1] - v.rest[0]);
      }
    });
    amFold(ev, len);
    for (var c = 0; c < 2; c++) for (var i = 0; i < len; i++) bed[c][i] += ev[c][i];
    return amNorm(bed, len, 0.045, 0.6);
  }
  // each sings a phrase from time t and says when it ends: a robin's thin, tumbling warble...
  function amRobin(ch, sr, rnd, t, amp, pan, lp) {
    for (var i = 0, n = 7 + Math.floor(rnd() * 8); i < n; i++) {
      var d = 0.04 + rnd() * 0.13, f0 = 2600 + rnd() * 4200, buzz = rnd() < 0.35;
      amChirp(ch, sr, t, d, f0, f0 * (0.65 + rnd() * 0.7), amp * (0.5 + rnd() * 0.5), pan, { vib: buzz ? 0.05 : 0.01, rate: buzz ? 35 + rnd() * 45 : 8, curve: 0.5 + rnd(), lp: lp });
      t += d + 0.012 + rnd() * 0.05;
    }
    return t;
  }
  // ...a blackbird's low, fluting notes and the twitter at the end...
  function amBlackbird(ch, sr, rnd, t, amp, pan, lp) {
    for (var i = 0, n = 3 + Math.floor(rnd() * 4); i < n; i++) {
      var d = 0.14 + rnd() * 0.24, f0 = 1300 + rnd() * 1500;
      amChirp(ch, sr, t, d, f0, f0 * (0.82 + rnd() * 0.42), amp * (0.6 + rnd() * 0.4), pan, { vib: 0.012, rate: 5 + rnd() * 4, h2: 0.2, curve: 0.7 + rnd() * 0.8, att: 2.4, lp: lp });
      t += d + 0.03 + rnd() * 0.1;
    }
    for (i = 0, n = 2 + Math.floor(rnd() * 5); i < n; i++) {
      var f = 3500 + rnd() * 3000;
      amChirp(ch, sr, t, 0.025 + rnd() * 0.03, f, f * (0.7 + rnd() * 0.5), amp * 0.4, pan, { lp: lp });
      t += 0.05 + rnd() * 0.03;
    }
    return t;
  }
  // ...a great tit's two notes, again and again...
  function amTit(ch, sr, rnd, t, amp, pan, lp) {
    var hi = 4700 + rnd() * 900, lo = hi * (0.68 + rnd() * 0.08), per = 0.28 + rnd() * 0.08;
    for (var i = 0, n = 3 + Math.floor(rnd() * 5); i < n; i++, t += per) {
      amChirp(ch, sr, t, 0.085, hi, hi * 0.94, amp, pan, { lp: lp });
      amChirp(ch, sr, t + per * 0.45, 0.1, lo, lo * 0.97, amp * 0.85, pan, { lp: lp });
    }
    return t;
  }
  // ...a chiffchaff saying its name...
  function amChiff(ch, sr, rnd, t, amp, pan, lp) {
    var a = 4100 + rnd() * 400, b = a * (1.18 + rnd() * 0.08);
    for (var i = 0, n = 6 + Math.floor(rnd() * 8); i < n; i++, t += 0.36 + rnd() * 0.1) {
      var f = (i + Math.floor(rnd() * 1.4)) % 2 ? a : b;
      amChirp(ch, sr, t, 0.07, f, f * 0.78, amp * (0.75 + rnd() * 0.25), pan, { curve: 0.6, lp: lp });
    }
    return t;
  }
  // ...a wren's loud, rattling trill...
  function amWren(ch, sr, rnd, t, amp, pan, lp) {
    for (var i = 0, n = 3 + Math.floor(rnd() * 4); i < n; i++) { var f = 4000 + rnd() * 3000; amChirp(ch, sr, t, 0.05, f, f * (0.8 + rnd() * 0.4), amp * 0.8, pan, { lp: lp }); t += 0.07; }
    var rate = 13 + rnd() * 5, top = 6200 + rnd() * 1200;
    for (i = 0, n = Math.round(rate * (0.9 + rnd() * 0.9)); i < n; i++, t += 1 / rate) amChirp(ch, sr, t, 0.6 / rate, top, top * 0.62, amp, pan, { curve: 0.8, lp: lp });
    return t;
  }
  // ...a wood pigeon cooing in the distance...
  function amDove(ch, sr, rnd, t, amp, pan, lp) {
    var f = 430 + rnd() * 90, beats = [[0.28, 0.6], [0.55, 1], [0.3, 0.7], [0.28, 0.65], [0.32, 0.7]];
    for (var i = 0; i < beats.length; i++) {
      amChirp(ch, sr, t, beats[i][0], f * (i === 1 ? 1.06 : 1), f * 0.93, amp * beats[i][1], pan, { h2: 0.25, att: 3, lp: lp });
      t += beats[i][0] + (i === 1 ? 0.12 : 0.06);
    }
    return t;
  }
  // ...and short calls from all around
  function amCalls(ch, sr, rnd, t, amp, pan, lp) {
    for (var i = 0, n = 1 + Math.floor(rnd() * 3); i < n; i++, t += 0.15 + rnd() * 0.4) {
      var f = 5800 + rnd() * 2200;
      amChirp(ch, sr, t, 0.02 + rnd() * 0.025, f, f * (0.75 + rnd() * 0.15), amp * (0.4 + rnd() * 0.6), rnd(), { lp: lp });
    }
    return t;
  }
  // the birds close by, and a loop of another length with the ones further off
  function amBirdsA(sr) {
    return amBirds(sr, 71, 16.9, [
      { sing: amRobin, amp: 0.3, pan: 0.32, rest: [2.2, 5.5] },
      { sing: amBlackbird, amp: 0.34, pan: 0.7, rest: [3, 6.5] },
      { sing: amTit, amp: 0.16, pan: 0.85, rest: [4, 9], lp: 0.6 },
      { sing: amCalls, amp: 0.1, pan: 0.5, rest: [0.6, 2.4], lp: 0.7 }], 0.012);
  }
  function amBirdsB(sr) {
    return amBirds(sr, 73, 21.1, [
      { sing: amChiff, amp: 0.12, pan: 0.15, rest: [3, 8], lp: 0.4 },
      { sing: amWren, amp: 0.13, pan: 0.6, rest: [5, 10], lp: 0.35 },
      { sing: amDove, amp: 0.1, pan: 0.9, rest: [4, 9], lp: 0.2 },
      { sing: amRobin, amp: 0.08, pan: 0.05, rest: [3, 7], lp: 0.3 },
      { sing: amCalls, amp: 0.05, pan: 0.5, rest: [0.5, 2], lp: 0.4 }], 0.008);
  }

  /* ----- rendering off the main thread -----
     The same functions run in a small worker made from their own source, so a phone
     doesn't stall for the second it takes. Without workers they run here instead. */
  var AM = { data: {}, bufs: {}, wait: {}, w: null };
  var AM_FNS = [amRand, amPink, amA, amXfade, amFold, amNorm, amAdd, amRain, amCrickets, amCricketsA, amCricketsB, amBerimbau,
    amBiq, amFilt, amSlow, amPinkBed, amStream, amWind, amFire, amFireP, amChirp, amBirds, amRobin, amBlackbird, amTit, amChiff, amWren, amDove, amCalls,
    amBirdsA, amBirdsB, amRender];
  // every loop by its name, here and in the worker alike (the berimbau's bar and bars come in, since the worker has no RHY)
  function amRender(name, sr, bar, bars) {
    var f = { rain: amRain, crkA: amCricketsA, crkB: amCricketsB, pink: amPinkBed, stream: amStream, wind: amWind, fire: amFire, fireP: amFireP, birdA: amBirdsA, birdB: amBirdsB }[name];
    return f ? f(sr) : amBerimbau(sr, bar, bars);
  }
  function amMake(name) { return amRender(name, AMB_SR, RHY.bar, RHY.bars); }
  function amWorker() {
    if (AM.w !== null) return AM.w;
    AM.w = false;
    try {
      if (!window.Worker || !window.Blob || !window.URL) return false;
      var src = '"use strict";var AMB_SR=' + AMB_SR + ";\n" + AM_FNS.map(String).join("\n") +
        "\nonmessage=function(e){var n=e.data,ch=amRender(n,AMB_SR," + RHY.bar + "," + RHY.bars + ");" +
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

  /* ----- playback -----
     The background is rain, crickets or both (or neither), with any of the nature sounds added on top. */
  var AMB = { kind: "off", add: [], vol: 40, out: null, srcs: [], playing: null, until: 0, tick: 0 };
  var AMB_KINDS = [["off", "Off"], ["rain", "Summer rain"], ["crickets", "Crickets"], ["night", "Rain and crickets"]];
  var AMB_SHORT = { off: "Off", rain: "Rain", crickets: "Crickets", night: "Rain + crickets" };
  // the nature sounds: [id, its button, its name (also in the player's list and the unlock dialog), its loops and their levels]
  var AMB_ADD = [["birds", "Birdsong", "Birdsong", [["birdA", 1], ["birdB", 0.9]]], ["stream", "Stream", "A stream", [["stream", 1]]],
    ["wind", "Wind", "Wind in the leaves", [["wind", 1]]], ["fire", "Fire", "A crackling fire", [["fire", 1], ["fireP", 0.8]]]];
  function ambGain() { var v = AMB.vol / 100; return v * v * 0.9; }
  function ambAddOf(id) { for (var i = 0; i < AMB_ADD.length; i++) if (AMB_ADD[i][0] === id) return AMB_ADD[i]; return null; }
  // the nature sounds that play: the ones chosen, once this device is unlocked
  function ambAddNow() { return supOn() ? AMB.add.slice() : []; }
  // what plays, as one name ("rain", "night+fire", "birds"), or "" for nothing
  function ambSig() { return (AMB.kind !== "off" ? [AMB.kind] : []).concat(ambAddNow()).join("+"); }
  function ambLayers(sig) {
    var out = [];
    String(sig || "").split("+").forEach(function (k) {
      if (k === "rain") out.push(["rain", 1]);
      else if (k === "crickets") out.push(["crkA", 1], ["crkB", 1]);
      else if (k === "night") out.push(["rain", 0.8], ["crkA", 0.55], ["crkB", 0.55]);
      else if (ambAddOf(k)) ambAddOf(k)[3].forEach(function (l) { out.push(l); });
    });
    return out;
  }
  function ambStart(sig) {
    var layers = ambLayers(sig);
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
    AMB.playing = sig;
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
     practice (a short preview too). It follows them in and out, so there's nothing to manage.
     Sleep sounds is a sound of its own, so the background stays out of it. */
  function ambActive() {
    return !!((A.playing && !(A.track && A.track.sleep)) || B.state === "running" || (typeof P !== "undefined" && P.state === "running") || bNow() < AMB.until);
  }
  function ambSync() {
    var sig = ambSig(), want = sig && ambActive() ? sig : null;
    if (want === AMB.playing) return;
    if (AMB.playing) ambStop(want ? 0.8 : 1.5);
    if (want) ambStart(want);
  }
  function ambVolNow() {
    if (AMB.out && AMB.playing && A.ctx) AMB.out.gain.setTargetAtTime(ambGain(), A.ctx.currentTime, 0.08);
  }
  // a five-second taste of a new choice when nothing runs
  function ambTaste(quiet) { if (ambSig() && !ambActive() && !quiet) AMB.until = bNow() + 5; }
  // rain, crickets, both or off; off is all of it, the nature sounds too
  function ambSet(kind, quiet) {
    AMB.kind = kind;
    store.set("amb", kind);
    if (kind === "off") ambAddSet([]);
    ambTaste(quiet); ambSync(); ambUI();
  }
  function ambAddSet(list) {
    AMB.add = AMB_ADD.map(function (a) { return a[0]; }).filter(function (id) { return list.indexOf(id) >= 0; });
    store.set("ambAdd", AMB.add.join(","));
  }
  /* A nature sound on or off. Turning one on is using a new technique: at once once this device is unlocked,
     otherwise the unlock dialog, and on it goes if the dialog unlocks the device. */
  function ambToggle(id, quiet) {
    var a = ambAddOf(id);
    if (!a) return;
    if (ambAddNow().indexOf(id) >= 0) { ambAddSet(AMB.add.filter(function (x) { return x !== id; })); ambSync(); ambUI(); return; }
    var go = function () { ensureCtx(); ambAddSet(AMB.add.concat([id])); ambTaste(quiet); ambSync(); ambUI(); };    // the sound started in the tap, as Safari wants
    if (supOn()) go(); else supGate(a[2], go, function (ok) { if (ok) go(); });
  }
  // one sound on its own, from the player's list or the session's quick button: rain, crickets, both, off or a nature sound
  function ambPreset(v, quiet) {
    var a = ambAddOf(v);
    if (!a && !AMB_KINDS.some(function (k) { return k[0] === v; })) { ambUI(); return; }
    var go = function () {
      AMB.kind = a ? "off" : v;
      store.set("amb", AMB.kind);
      ambAddSet(a ? [v] : []);
      ambTaste(quiet); ambSync(); ambUI();
    };
    if (!a || supOn()) go();
    else { supGate(a[2], go, function (ok) { if (ok) go(); }); ambUI(); }   // the list shows what still plays meanwhile
  }
  // what's chosen, as one of the sounds on their own, or "mix"
  function ambCur() {
    var add = ambAddNow();
    if (!add.length) return AMB.kind;
    return AMB.kind === "off" && add.length === 1 ? add[0] : "mix";
  }
  // the session's quick button: the next sound on its own (a mix of your own goes back to off)
  function ambCycle() {
    var ks = AMB_KINDS.concat(supOn() ? AMB_ADD : []).map(function (k) { return k[0]; });
    ambPreset(ks[(ks.indexOf(ambCur()) + 1) % ks.length], true);
  }
  // in words: "Rain and crickets", "Rain, birdsong and fire"
  function ambName() {
    var n = AMB.kind === "off" ? [] : [AMB.kind === "night" ? "Rain and crickets" : AMB.kind === "rain" ? "Rain" : "Crickets"];
    ambAddNow().forEach(function (id) { var w = ambAddOf(id)[1]; n.push(n.length ? w.toLowerCase() : w); });
    return n.length > 1 ? n.slice(0, -1).join(", ") + " and " + n[n.length - 1] : n[0] || "Off";
  }
  function ambShort() { var c = ambCur(); return c === "mix" ? "Mix" : ambAddOf(c) ? ambAddOf(c)[1] : AMB_SHORT[c]; }
  function ambSetVol(v) { AMB.vol = Math.max(0, Math.min(100, v)); store.set("ambVol", String(AMB.vol)); ambVolNow(); ambUI(); }
  /* All the background-sound controls share these classes and stay in step. */
  function ambPressed(k) { return k === AMB.kind && (k !== "off" || !ambAddNow().length); }
  function ambChips(id) {
    return '<div class="mini-seg amb-seg"' + (id ? ' id="' + id + '"' : "") + ' role="group" aria-label="Background sound">' + AMB_KINDS.map(function (k) {
      return '<button data-amb="' + k[0] + '" aria-pressed="' + ambPressed(k[0]) + '">' + (k[0] === "night" ? "Both" : k[0] === "rain" ? "Rain" : k[1]) + "</button>";
    }).join("") + "</div>";
  }
  // the nature sounds, each on or off, with the cup while this device is locked
  function ambAddChips() {
    var now = ambAddNow();
    return '<div class="mini-seg amb-seg amb-add" role="group" aria-label="Nature sounds, each on or off">' + AMB_ADD.map(function (a) {
      return '<button type="button" data-amb-add="' + a[0] + '" aria-pressed="' + (now.indexOf(a[0]) >= 0) + '">' + a[1] + supTag(true) + "</button>";
    }).join("") + "</div>";
  }
  function ambVolInput(label) {
    return '<input type="range" class="amb-vol" min="0" max="100" value="' + AMB.vol + '" aria-label="' + (label || "Background volume") + '">';
  }
  function ambCtl() {
    return ambChips() + ambAddChips() + '<label class="amb-volrow b-vol"' + (ambSig() ? "" : " hidden") + "><span>Volume</span>" + ambVolInput() + "</label>";
  }
  // the player's list: each sound on its own, and a mix of your own when that's what plays
  function ambSelFill(sel) {
    var cur = ambCur(), key = cur + "|" + supOn() + "|" + (cur === "mix" ? ambName() : "");
    if (sel.getAttribute("data-k") !== key) {
      sel.innerHTML = AMB_KINDS.map(function (k) { return '<option value="' + k[0] + '">' + (k[0] === "off" ? "None" : k[1]) + "</option>"; }).join("") +
        AMB_ADD.map(function (a) { return '<option value="' + a[0] + '">' + a[2] + (supOn() ? "" : " · with a donation") + "</option>"; }).join("") +
        (cur === "mix" ? '<option value="mix">' + esc(ambName()) + "</option>" : "");
      sel.setAttribute("data-k", key);
    }
    sel.value = cur;
  }
  function ambUI() {
    var i, now = ambAddNow(), sig = ambSig(), lock = !supOn();
    var bs = document.querySelectorAll("[data-amb]");
    for (i = 0; i < bs.length; i++) bs[i].setAttribute("aria-pressed", ambPressed(bs[i].dataset.amb) ? "true" : "false");
    var ad = document.querySelectorAll("[data-amb-add]");
    for (i = 0; i < ad.length; i++) {
      var tag = ad[i].querySelector(".sup-tag");
      ad[i].setAttribute("aria-pressed", now.indexOf(ad[i].getAttribute("data-amb-add")) >= 0 ? "true" : "false");
      if (tag && !lock) tag.parentNode.removeChild(tag);
      else if (!tag && lock) ad[i].insertAdjacentHTML("beforeend", supTag(true));
    }
    var vs = document.querySelectorAll(".amb-vol");
    for (i = 0; i < vs.length; i++) if (document.activeElement !== vs[i]) vs[i].value = AMB.vol;
    var rows = document.querySelectorAll(".amb-volrow");
    for (i = 0; i < rows.length; i++) rows[i].hidden = !sig;
    var sel = document.querySelectorAll(".amb-sel");
    for (i = 0; i < sel.length; i++) ambSelFill(sel[i]);
    var q = $("#sqAmb");
    if (q) { q.setAttribute("aria-pressed", sig ? "true" : "false"); bSetT("#sqAmbTxt", sig ? ambShort() : "Background"); }
  }
  function ambInit() {
    var k = store.get("amb");
    if (AMB_KINDS.some(function (x) { return x[0] === k; })) AMB.kind = k;
    var ad = String(store.get("ambAdd") || "").split(",");
    AMB.add = AMB_ADD.map(function (a) { return a[0]; }).filter(function (id) { return ad.indexOf(id) >= 0; });
    var v = parseInt(store.get("ambVol"), 10);
    if (!isNaN(v)) AMB.vol = Math.max(0, Math.min(100, v));
    SUP_EXTRA.push({ name: "Nature sounds in the background", href: "#st-amb" });     // Settings' list of what the donation unlocks
    document.addEventListener("click", function (e) {
      var b = e.target.closest && e.target.closest("[data-amb]");
      if (b) { ambSet(b.dataset.amb); return; }
      var a = e.target.closest && e.target.closest("[data-amb-add]");
      if (a) ambToggle(a.getAttribute("data-amb-add"));
    });
    document.addEventListener("input", function (e) {
      if (e.target.classList && e.target.classList.contains("amb-vol")) ambSetVol(parseInt(e.target.value, 10));
    });
    document.addEventListener("change", function (e) {
      if (e.target.classList && e.target.classList.contains("amb-sel")) ambPreset(e.target.value);
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
