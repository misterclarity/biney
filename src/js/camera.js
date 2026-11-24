  /* ------------------------- heart rate from the phone's camera -------------------------
     No sensor? A fingertip over the phone's rear camera, lit by its light, shows each heartbeat:
     as blood fills the fingertip it lets a little less light through, so the picture darkens a
     shade about once a second (photoplethysmography, as in a pulse oximeter). Each picture is
     shrunk to a few dozen pixels and becomes three colour averages; nothing else is kept.

     From the red average (green when red is clipped at full brightness), resampled to 30 a second:
     a zero-phase band-pass of 0.7 to 3.5 Hz (42 to 210 beats a minute) over the last 10 seconds,
     the pulse rate from the strongest peak of its spectrum (checked against the wave's own repeats,
     so a slow heart isn't read at a harmonic), then each beat's darkest moment, refined between
     samples with a parabola. The signal's quality is the lowest of three: the share of the power at
     that rate and its harmonics, how alike the beats look, and how steady the gaps between them are.
     The time from one beat to the next goes into the same pipeline a Bluetooth sensor's beat-to-beat
     intervals do (H.beats, H.series, hrRecord), so heart rate, the swing in each breath, RMSSD,
     coherence, the resonance test and the Stress Check all work with it. A beat is counted only once
     the quality has held for a second and a half, when it looks like the others and its interval lies
     within 35% of the spectrum's rate and 30% of the one before; a gap or a doubtful beat starts the
     chain again rather than making one long interval. At rest only: movement swamps the pulse, and
     the meter says so.

     Frames come with the camera's own time stamps where the browser gives them
     (MediaStreamTrackProcessor, then requestVideoFrameCallback), and from a 60-a-second timer
     otherwise, which also carries on while the Heart page is out of sight. A new technique: the
     button opens with a donation while this device is locked.
  -------------------------------------------------------------------------------------- */
  var CAM_NAME = "Heart rate from the camera";
  var CAM_FS = 30, CAM_WIN = 10, CAM_KEEP = 20, CAM_Q = 0.5, CAM_GOOD = 0.75, CAM_IDLE = 120, CAM_W = 32, CAM_H = 24;
  var CAM = {
    on: false, busy: false, gen: 0, stream: null, track: null, reader: null, cx: null,
    torch: null, raw: [], last: null, anaAt: 0, lastPeak: 0, rr: [], beatT: [], res: null, err: "",
    t0: 0, frames: 0, off: null, vfcAt: 0, timer: 0, coverAt: 0, said: "", drawAt: 0
  };

  /* ----- signal helpers, shared with the motion sensor (motion.js) ----- */
  // one second-order section (the audio cookbook's): "lp" or "hp" at f0 Hz, sampled at fs, Butterworth Q
  function sigBiquad(type, f0, fs) {
    var w = 2 * Math.PI * f0 / fs, cw = Math.cos(w), al = Math.sin(w) / (2 * Math.SQRT1_2), a0 = 1 + al;
    var b1 = type === "lp" ? 1 - cw : -(1 + cw), b0 = type === "lp" ? b1 / 2 : (1 + cw) / 2;
    return { b0: b0 / a0, b1: b1 / a0, b2: b0 / a0, a1: -2 * cw / a0, a2: (1 - al) / a0 };
  }
  function sigFilt(x, c) {
    var y = new Float64Array(x.length), z1 = 0, z2 = 0;
    for (var i = 0; i < x.length; i++) {
      var v = x[i], o = c.b0 * v + z1;
      z1 = c.b1 * v - c.a1 * o + z2; z2 = c.b2 * v - c.a2 * o;
      y[i] = o;
    }
    return y;
  }
  // forward and back through every section: no delay, so a beat stays where it happened. Each end is first
  // continued by `pad` samples turned over about it, so the filter starts settled rather than ringing at the edges.
  function sigZero(x, cs, pad) {
    var n = x.length, p = Math.max(0, Math.min(pad || 0, n - 1)), z = new Float64Array(n + 2 * p), y, i;
    for (i = 0; i < p; i++) z[i] = 2 * x[0] - x[p - i];
    for (i = 0; i < n; i++) z[p + i] = x[i];
    for (i = 0; i < p; i++) z[p + n + i] = 2 * x[n - 1] - x[n - 2 - i];
    y = z;
    for (i = 0; i < cs.length; i++) y = sigFilt(y, cs[i]);
    y = Array.prototype.slice.call(y).reverse();
    for (i = 0; i < cs.length; i++) y = sigFilt(y, cs[i]);
    return Array.prototype.slice.call(y).reverse().slice(p, p + n);
  }
  // take away the straight line through it, so a slow drift doesn't ring through the filter
  function sigDetrend(x) {
    var n = x.length, mx = (n - 1) / 2, my = avg(x), sxy = 0, sxx = 0, i;
    for (i = 0; i < n; i++) { sxy += (i - mx) * (x[i] - my); sxx += (i - mx) * (i - mx); }
    var b = sxx ? sxy / sxx : 0, y = new Float64Array(n);
    for (i = 0; i < n; i++) y[i] = x[i] - my - b * (i - mx);
    return y;
  }
  // the power at each frequency from f0 to f1 (Hz) in steps of df, through a Hann window
  function sigSpec(y, fs, f0, f1, df) {
    var n = y.length, w = new Float64Array(n), out = [], i;
    for (i = 0; i < n; i++) w[i] = y[i] * (0.5 - 0.5 * Math.cos(2 * Math.PI * i / Math.max(1, n - 1)));
    for (var f = f0; f <= f1 + 1e-9; f += df) {
      var re = 0, im = 0, k = 2 * Math.PI * f / fs;
      for (i = 0; i < n; i++) { re += w[i] * Math.cos(k * i); im -= w[i] * Math.sin(k * i); }
      out.push({ f: f, p: re * re + im * im });
    }
    return out;
  }
  // the strongest local peak, refined with a parabola through its neighbours
  function sigPeak(sp, lo, hi) {
    var best = -1;
    for (var i = 0; i < sp.length; i++) {
      if (sp[i].f < lo - 1e-9 || sp[i].f > hi + 1e-9) continue;
      var l = i > 0 ? sp[i - 1].p : -1, r = i < sp.length - 1 ? sp[i + 1].p : -1;
      if (sp[i].p >= l && sp[i].p >= r && (best < 0 || sp[i].p > sp[best].p)) best = i;
    }
    if (best < 0) return null;
    var f = sp[best].f;
    if (best > 0 && best < sp.length - 1) {
      var a = sp[best - 1].p, b = sp[best].p, c = sp[best + 1].p, d = a - 2 * b + c;
      if (d < 0) f += 0.5 * (a - c) / d * (sp[1].f - sp[0].f);
    }
    return { i: best, f: f, p: sp[best].p };
  }
  // the share of the power within ±bw of f and its harmonics (up to k of them)
  function sigShare(sp, f, bw, k) {
    var tot = 0, at = 0;
    sp.forEach(function (s) {
      tot += s.p;
      for (var h = 1; h <= k; h++) if (Math.abs(s.f - h * f) <= bw) { at += s.p; break; }
    });
    return tot > 0 ? at / tot : 0;
  }

  /* ----- from pictures to beats ----- */
  // one picture: the average of each colour, the share of pixels that are a lit fingertip's red, and the share clipped at full red
  function camGrab(src, t, dedupe) {
    var cx = CAM.cx;
    if (!cx || !CAM.on) return;
    var d;
    try { cx.drawImage(src, 0, 0, CAM_W, CAM_H); d = cx.getImageData(0, 0, CAM_W, CAM_H).data; } catch (e) { return; }
    var n = CAM_W * CAM_H, r = 0, g = 0, b = 0, red = 0, clip = 0;
    for (var i = 0; i < d.length; i += 4) {
      var R = d[i], G = d[i + 1], B = d[i + 2];
      r += R; g += G; b += B;
      if (R > 20 && R > 1.4 * G && R > 1.4 * B) red++;
      if (R >= 250) clip++;
    }
    var s = { t: t, r: r / n, g: g / n, b: b / n, red: red / n, clip: clip / n }, L = CAM.last;
    if (dedupe && L && s.r === L.r && s.g === L.g && s.b === L.b) return;      // the timer saw the same picture twice
    if (L && t <= L.t) return;
    CAM.last = s;
    CAM.raw.push(s);
    CAM.frames++;
    while (CAM.raw.length && CAM.raw[0].t < t - CAM_KEEP) CAM.raw.shift();
    if (t - CAM.anaAt >= 0.25) { CAM.anaAt = t; camAnalyse(t); }
  }
  // a frame's own time stamp (microseconds from the camera) on the page's clock, set again if the two drift apart
  function camStamp(us) {
    var now = bNow(), t = us / 1e6;
    if (CAM.off === null || Math.abs(t + CAM.off - now) > 0.5) CAM.off = now - t;
    return t + CAM.off;
  }
  // the pictures of one colour from `from`, on an even 30-a-second grid
  function camResample(win, from, n, key) {
    var x = new Float64Array(n), j = 0;
    for (var k = 0; k < n; k++) {
      var t = from + k / CAM_FS;
      while (j < win.length - 2 && win[j + 1].t < t) j++;
      var a = win[j], b = win[Math.min(j + 1, win.length - 1)], u = b.t > a.t ? (t - a.t) / (b.t - a.t) : 0;
      x[k] = a[key] + (b[key] - a[key]) * Math.max(0, Math.min(1, u));
    }
    return x;
  }
  var CAM_BAND = null;
  function camBand(x) {
    if (!CAM_BAND) CAM_BAND = [sigBiquad("hp", 0.7, CAM_FS), sigBiquad("lp", 3.5, CAM_FS)];
    return sigZero(sigDetrend(x), CAM_BAND, CAM_FS);
  }
  /* The pulse rate and how clean the pulse is: the strongest peak between 0.7 and 3.5 Hz, and the share of the power at
     it and its harmonics. That peak can be one of the pulse's harmonics rather than its own rate, when the heart is slow
     and the filter's edge weakens the first: the wave then repeats best over two or three of those periods. So of the
     strongest peak's period and two, three and four of them (down to 36 a minute), the one the wave repeats over best is
     the beat, the shortest of any that come within 0.1 of the best. */
  function camSpec(y) {
    var sp = sigSpec(y, CAM_FS, 0.5, 3.5, 0.02), pk = sigPeak(sp, 0.7, 3.5);
    if (!pk) return { f0: 1, conc: 0 };
    var f0 = pk.f, ac = [], k, best = 1;
    for (k = 1; k <= 4 && (k === 1 || f0 / k >= 0.6); k++) ac[k] = sigAc(y, CAM_FS * k / f0);
    for (k = 2; k < ac.length; k++) if (ac[k] > ac[best]) best = k;
    for (k = 1; k < best; k++) if (ac[k] >= ac[best] - 0.1) { best = k; break; }
    if (best > 1) {
      var sub = sigPeak(sp, f0 / best - 0.1, f0 / best + 0.1);
      f0 = sub ? sub.f : f0 / best;
    }
    return { f0: f0, conc: sigShare(sp, f0, 0.15, 3) };
  }
  // how alike a signal is to itself `lag` samples later (a fraction of a sample by interpolation), from -1 to 1
  function sigAc(y, lag) {
    var n = y.length, L = Math.floor(lag), u = lag - L, a = 0, b = 0, c = 0;
    for (var i = 0; i + L + 1 < n; i++) {
      var x = y[i], z = y[i + L] * (1 - u) + y[i + L + 1] * u;
      a += x * z; b += x * x; c += z * z;
    }
    return b > 0 && c > 0 ? a / Math.sqrt(b * c) : 0;
  }
  // each beat: the highest point of the (inverted) pulse, at least 60% of a beat after the one before, refined between
  // samples: [{ t, i (the sample, with its fraction) }]
  function camPeaks(y, f0, t0) {
    var n = y.length, minD = Math.max(5, Math.round(0.6 * CAM_FS / f0)), srt = Array.prototype.slice.call(y).sort(function (a, b) { return a - b; });
    var thr = 0.3 * srt[Math.floor(0.9 * (n - 1))], cand = [], keep = [], i;
    for (i = 1; i < n - 1; i++) if (y[i] > thr && y[i] > y[i - 1] && y[i] >= y[i + 1]) cand.push(i);
    cand.sort(function (a, b) { return y[b] - y[a]; });
    cand.forEach(function (c) { if (keep.every(function (k) { return Math.abs(k - c) >= minD; })) keep.push(c); });
    keep.sort(function (a, b) { return a - b; });
    return keep.map(function (c) {
      var a = y[c - 1], b = y[c], d = y[c + 1], den = a - 2 * b + d, off = den < 0 ? Math.max(-0.5, Math.min(0.5, 0.5 * (a - d) / den)) : 0;
      return { t: t0 + (c + off) / CAM_FS, i: c };
    });
  }
  // how much each beat looks like the window's average beat (from a third of a beat before its peak to half a beat after):
  // a clean pulse repeats its shape, a jolt of the finger doesn't. A beat too near the window's edge for its whole shape gets null.
  function camShape(y, pks, f0) {
    var per = CAM_FS / f0, a = Math.round(0.33 * per), b = Math.round(0.5 * per), len = a + b + 1, tpl = new Float64Array(len), n = 0;
    var segs = pks.map(function (p) {
      if (p.i - a < 0 || p.i + b >= y.length) return null;
      var s = Array.prototype.slice.call(y, p.i - a, p.i + b + 1);
      for (var j = 0; j < len; j++) tpl[j] += s[j];
      n++;
      return s;
    });
    if (n < 2) return segs.map(function () { return null; });
    var corr = function (s) {
      var ma = 0, mb = 0, j, sab = 0, saa = 0, sbb = 0;
      for (j = 0; j < len; j++) { ma += s[j]; mb += tpl[j]; }
      ma /= len; mb /= len;
      for (j = 0; j < len; j++) { var u = s[j] - ma, v = tpl[j] - mb; sab += u * v; saa += u * u; sbb += v * v; }
      return saa > 0 && sbb > 0 ? sab / Math.sqrt(saa * sbb) : 0;
    };
    return segs.map(function (s) { return s ? corr(s) : null; });
  }
  /* One look at the last ten seconds, every quarter of a second: is a fingertip over the lens, how clean is the pulse,
     and which new beats can be trusted. `st` carries the last beat counted (lastPeak); it works on any list of pictures,
     so the tests can feed it a made-up pulse. Returns { beats: [{t, rr}], q (0 to 1), cover, dark, f0, ch, y, t0, peaks, span }. */
  function camStep(st, raw, tEnd) {
    var out = { beats: [], q: 0, cover: false, dark: false, clip: false, f0: 0, ch: "r", y: null, t0: 0, peaks: [], span: 0 };
    var i = raw.length - 1, sec = [];
    while (i >= 0 && raw[i].t > tEnd) i--;
    var end = i;
    while (i >= 0 && raw[i].t > tEnd - 1) { sec.push(raw[i]); i--; }
    if (!sec.length) { st.lastPeak = 0; st.good = 0; return out; }
    out.cover = avg(sec.map(function (s) { return s.red; })) > 0.8;
    out.dark = avg(sec.map(function (s) { return (s.r + s.g + s.b) / 3; })) < 6;
    out.clip = avg(sec.map(function (s) { return s.clip; })) > 0.5;
    // back from now while the fingertip stays down and the pictures keep coming: what can be read
    var from = raw[end].t;
    for (i = end; i > 0 && raw[i].t > tEnd - CAM_WIN; i--) {
      if (raw[i - 1].red < 0.6 || raw[i].t - raw[i - 1].t > 0.3) break;
      from = raw[i - 1].t;
    }
    out.span = tEnd - from;
    if (!out.cover || out.span < 4) { st.lastPeak = 0; st.good = 0; return out; }
    var win = raw.slice(Math.max(0, i - 1), end + 1), n = Math.floor(out.span * CAM_FS);
    var yr = camBand(camResample(win, from, n, "r")), yg = camBand(camResample(win, from, n, "g"));
    var sr = camSpec(yr), sg = camSpec(yg), useG = out.clip ? sg.conc >= sr.conc - 0.1 : sg.conc > sr.conc + 0.05;
    var sp = useG ? sg : sr, y = useG ? yg : yr;
    for (var k = 0; k < y.length; k++) y[k] = -y[k];          // each beat darkens the picture: turned over, a beat is a peak
    out.ch = useG ? "g" : "r"; out.f0 = sp.f0; out.y = y; out.t0 = from;
    var pks = camPeaks(y, sp.f0, from), shape = camShape(y, pks, sp.f0), cs = shape.filter(function (c) { return c !== null; });
    out.peaks = pks.map(function (p) { return p.t; });
    // the quality, the lowest of three: the rhythm's share of the power, how alike the beats are, and how steady the gaps
    // between them (a resting heart's vary by a tenth or so, breathing included; a finger's jolts come at random)
    var gaps = pks.slice(1).map(function (p, j) { return p.t - pks[j].t; }), gm = avg(gaps);
    var cv = gaps.length >= 2 ? Math.sqrt(avg(gaps.map(function (g) { return (g - gm) * (g - gm); }))) / gm : 1;
    var clamp = function (v) { return Math.max(0, Math.min(1, v)); };
    out.q = Math.min(clamp((sp.conc - 0.3) / 0.4), cs.length ? clamp((avg(cs) - 0.5) / 0.4) : 0, clamp((0.3 - cv) / 0.15));
    // beats count once the signal has stayed good for a second and a half: a moment of luck in the middle of a jolt doesn't
    st.good = out.q >= CAM_Q ? (st.good || 0) + 1 : 0;
    if (st.good < 6 || out.span < 5) { st.lastPeak = 0; st.lastRr = 0; return out; }
    var per = 1 / sp.f0, edge = tEnd - 1.5, start = from + 1;   // a beat is counted once it's well clear of the window's edges
    pks.forEach(function (p, j) {
      var tp = p.t;
      if (tp <= st.lastPeak + 0.3 * per || tp > edge || tp < start) return;
      if (shape[j] !== null && shape[j] < 0.8) { st.lastPeak = 0; return; }      // a beat that doesn't look like the others: the chain starts again
      if (!st.lastPeak) st.lastRr = 0;                  // a new chain: no beat before to compare with
      else {
        var rr = (tp - st.lastPeak) * 1000;
        // within the range of a heartbeat, near the window's rate, and near the beat before (a resting heart changes by a few percent a beat)
        if (rr >= 300 && rr <= 2000 && Math.abs(rr - 1000 * per) <= 350 * per && (!st.lastRr || Math.abs(rr - st.lastRr) <= 0.3 * st.lastRr)) {
          out.beats.push({ t: tp, rr: rr });
          st.lastRr = rr;
        } else st.lastRr = 0;
      }
      st.lastPeak = tp;
    });
    return out;
  }
  function camAnalyse(tEnd) {
    var res = camStep(CAM, CAM.raw, tEnd);
    CAM.res = res;
    if (res.cover) CAM.coverAt = tEnd;
    res.beats.forEach(function (b) { camBeat(b.t, b.rr); });
    if (tEnd - Math.max(CAM.coverAt, CAM.t0) > CAM_IDLE) { CAM.said = "idle"; camStop(); return; }   // two minutes without a fingertip
    camUI();
  }
  // a beat into the heart pipeline, as a sensor's beat-to-beat interval would go (heart.js hrOnValue)
  function camBeat(t, rr) {
    if (H.src !== "cam") return;
    var now = bNow(), pt = { t: t, hr: 60000 / rr };
    H.hasRR = true;
    H.beats.push({ t: t, rr: rr });
    while (H.beats.length && H.beats[0].t < now - 300) H.beats.shift();
    H.series.push(pt);
    while (H.series.length && H.series[0].t < now - 300) H.series.shift();
    hrRecord(pt);
    CAM.rr.push(rr); if (CAM.rr.length > 5) CAM.rr.shift();
    CAM.beatT.push(t); while (CAM.beatT.length && CAM.beatT[0] < now - 12) CAM.beatT.shift();
    H.hr = 60000 / median(CAM.rr);
    if (!H.since || now - H.lastAt > 5) H.since = now;       // continuous data restarts after a gap
    H.lastAt = now;
    hrTiles();
  }

  /* ----- the camera on and off ----- */
  function camSupported() { return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia); }
  function camGo() {
    if (CAM.on || CAM.busy) { camStop(); return; }
    if (H.state !== "off" && H.src !== "cam") return;          // a sensor is connected: the camera isn't needed
    supGate(CAM_NAME, camOpen, function (ok) { if (ok && !CAM.on && !CAM.busy) camOpen(); else camUI(); });    // unlocked in the dialog: on it goes
  }
  function camOpen() {
    CAM.err = ""; CAM.said = "";
    if (!camSupported()) { CAM.err = window.isSecureContext === false ? "insecure" : "unsupported"; camUI(); return; }
    if (H.state !== "off" && H.src !== "cam") return;
    var gen = ++CAM.gen, p;
    CAM.busy = true;
    camUI();
    // the camera on the back, small and steady: a few dozen pixels are all the colour averages need
    var v = { facingMode: { ideal: "environment" }, width: { ideal: 320 }, height: { ideal: 240 }, frameRate: { ideal: 30 } };
    try { p = navigator.mediaDevices.getUserMedia({ audio: false, video: v }); } catch (e) { camFail(e, gen); return; }
    p.then(function (stream) {
      if (gen !== CAM.gen || !CAM.busy) { stream.getTracks().forEach(function (t) { try { t.stop(); } catch (e) {} }); return; }
      camRun(stream);
    }).catch(function (e) { camFail(e, gen); });
  }
  function camFail(e, gen) {
    if (gen !== CAM.gen) return;
    var n = (e && e.name) || "", embedded = false;
    try { embedded = window.self !== window.top; } catch (x) { embedded = true; }
    CAM.busy = false; CAM.on = false;
    CAM.err = n === "NotAllowedError" || n === "SecurityError" ? (embedded ? "embedded" : "denied")
      : n === "NotFoundError" || n === "OverconstrainedError" || n === "DevicesNotFoundError" ? "none"
      : n === "NotReadableError" || n === "TrackStartError" || n === "AbortError" ? "busy" : "other:" + (n || "Error");
    camUI();
  }
  function camRun(stream) {
    var tr = stream.getVideoTracks()[0];
    if (H.state !== "off") { stream.getTracks().forEach(function (t) { try { t.stop(); } catch (e) {} }); CAM.busy = false; camUI(); return; }   // a sensor came first
    if (!tr) { stream.getTracks().forEach(function (t) { try { t.stop(); } catch (e) {} }); camFail({ name: "NotFoundError" }, CAM.gen); return; }
    CAM.stream = stream; CAM.track = tr;
    CAM.busy = false; CAM.on = true;
    CAM.raw = []; CAM.last = null; CAM.lastPeak = 0; CAM.rr = []; CAM.beatT = []; CAM.res = null; CAM.anaAt = 0;
    CAM.t0 = bNow(); CAM.coverAt = 0; CAM.frames = 0; CAM.off = null; CAM.vfcAt = 0; CAM.torch = null;
    if (!CAM.cx) {
      var cv = document.createElement("canvas");
      cv.width = CAM_W; cv.height = CAM_H;
      CAM.cx = cv.getContext("2d", { willReadFrequently: true });
    }
    tr.addEventListener("ended", function () { if (CAM.track === tr && CAM.on) { CAM.said = "ended"; camStop(); } });
    var vid = $("#camVid");
    vid.srcObject = stream;
    var pl = vid.play();
    if (pl && pl.catch) pl.catch(function () {});
    camTorch(true);
    setTimeout(function () { if (CAM.track === tr && !CAM.torch) camTorch(true); }, 700);     // some phones list the light only once the camera runs
    // the camera becomes this page's heart sensor
    H.src = "cam"; H.name = "Phone camera";
    H.beats = []; H.series = []; H.coh = null; H.hasRR = true; H.hr = 0; H.lastAt = 0; H.contact = null; H.since = 0;
    H.connAt = bNow();
    bSetT("#hrTitle", "Your pulse from the camera");
    hrMsg(""); hrLogShow(null);
    hrSetState("on", "Camera");
    clearInterval(H.tickT); H.tickT = setInterval(hrTiles, 1000);
    clearInterval(H.cohT); H.cohT = setInterval(cohTick, 5000);
    hrPulse();
    camFrames();
    camUI();
  }
  // the light beside the lens, where the browser lets a page switch it on
  function camTorch(on) {
    var tr = CAM.track, caps = {};
    if (!tr) return;
    try { caps = tr.getCapabilities ? tr.getCapabilities() : {}; } catch (e) {}
    if (!caps || !caps.torch) { if (on) CAM.torch = false; camUI(); return; }
    try {
      tr.applyConstraints({ advanced: [{ torch: !!on }] }).then(function () { if (CAM.track === tr) { CAM.torch = !!on; camUI(); } },
        function () { if (CAM.track === tr) { CAM.torch = false; camUI(); } });
    } catch (e) { CAM.torch = false; }
  }
  function camFrames() {
    var gen = CAM.gen, vid = $("#camVid");
    CAM.reader = null;
    if (window.MediaStreamTrackProcessor) {
      try { CAM.reader = new MediaStreamTrackProcessor({ track: CAM.track }).readable.getReader(); } catch (e) { CAM.reader = null; }
    }
    if (CAM.reader) {
      var rd = CAM.reader;
      var pump = function () {
        rd.read().then(function (res) {
          if (res.done) return;
          var f = res.value;
          if (gen === CAM.gen) { try { camGrab(f, camStamp(f.timestamp)); } catch (e) {} }
          try { f.close(); } catch (e) {}
          if (gen === CAM.gen) pump();
        }, function () {});
      };
      pump();
      return;
    }
    if (vid.requestVideoFrameCallback) {
      var cb = function (now, md) {
        if (gen !== CAM.gen) return;
        CAM.vfcAt = bNow();
        var t = md && md.captureTime && Math.abs(md.captureTime / 1000 - CAM.vfcAt) < 1 ? md.captureTime / 1000 : CAM.vfcAt;
        camGrab(vid, t);
        vid.requestVideoFrameCallback(cb);
      };
      vid.requestVideoFrameCallback(cb);
    }
    // while the page shows no video (another tab of Entrain), or without either: look 60 times a second, skipping repeats
    CAM.timer = setInterval(function () {
      if (gen !== CAM.gen || bNow() - CAM.vfcAt < 0.3 || vid.readyState < 2) return;
      camGrab(vid, bNow(), true);
    }, 16);
  }
  function camStop() {
    CAM.gen++;
    var was = CAM.on || CAM.busy;
    CAM.busy = false; CAM.on = false;
    if (CAM.reader) { try { CAM.reader.cancel(); } catch (e) {} CAM.reader = null; }
    clearInterval(CAM.timer);
    if (CAM.stream) CAM.stream.getTracks().forEach(function (t) { try { t.stop(); } catch (e) {} });     // the light goes off with it
    CAM.stream = null; CAM.track = null; CAM.torch = null;
    var vid = $("#camVid");
    if (vid) { try { vid.pause(); } catch (e) {} vid.srcObject = null; }
    if (H.src === "cam") {
      clearInterval(H.tickT); clearInterval(H.cohT); clearTimeout(H.pulseT);
      H.coh = null; H.hr = 0; H.src = ""; H.name = "";
      drawSpectrum();
      bSetT("#hrTitle", "Pair a heart-rate sensor");
      hrSetState("off", "Not connected");
    }
    if (was || CAM.said) camUI();
  }

  /* ----- what the Heart page shows ----- */
  var CAM_ERR = {
    unsupported: "This browser can't use the camera from a web page. Chrome, Edge, Firefox and Safari can.",
    insecure: "The camera needs Entrain opened from its web address (https) or as a file on this device.",
    denied: "The camera wasn't allowed. To use it, allow the camera for this page (in the browser's site settings, by the address bar), then press the button again.",
    embedded: "This copy sits inside another page, such as a preview, which blocks the camera. Open the page at its own web address to use it.",
    none: "No camera was found on this device.",
    busy: "The camera is busy: another app or tab is using it. Close that, then try again."
  };
  function camSay() {
    var r = CAM.res, s;
    if (CAM.busy) return "Opening the camera…";
    if (!r || CAM.frames < 10) return "Waiting for the camera…";
    if (!r.cover) return r.dark ? "Too dark to see your fingertip. Turn on a lamp, or face a window: daylight through the finger works too."
      : "Cover the camera on the back, and the light beside it, with the pad of one finger, resting it lightly.";
    if (r.span < 5) return "Fingertip found. Keep still while the page finds your pulse…";
    if (r.q < CAM_Q) return "The pulse is faint or moving. Keep your hand still and resting, and press more lightly.";
    s = hrLive() ? "Your pulse: " + Math.round(H.hr) + " beats a minute." : "Finding each beat…";
    return s + (r.q >= CAM_GOOD ? " A clean signal: keep still." : " Keep still for a cleaner signal.");
  }
  function camUI() {
    var box = $("#cam");
    if (!box) return;
    var on = CAM.on || CAM.busy, sensor = H.state !== "off" && H.src !== "cam";
    box.hidden = sensor;                                       // a Bluetooth sensor is connected or connecting
    box.dataset.on = on ? "1" : "0";
    $("#camOff").hidden = on;
    $("#camOn").hidden = !on;
    var go = $("#camGo"), tag = go.querySelector(".sup-tag");
    if (tag && supOn()) tag.parentNode.removeChild(tag);
    else if (!tag && !supOn()) go.insertAdjacentHTML("beforeend", supTag());
    var err = CAM.err ? (CAM_ERR[CAM.err] || "The camera didn't start (the browser said " + CAM.err.slice(6) + "). Try again, or close other apps that use it.")
      : CAM.said === "idle" ? "The camera turned itself off after two minutes without a fingertip on it."
      : CAM.said === "ended" ? "The camera stopped: another app may have taken it. Press the button to start it again." : "";
    bSetT("#camErr", err);
    $("#camErr").hidden = !err || on;
    if (!on) return;
    var r = CAM.res, q = r && r.cover ? Math.round(r.q * 100) : 0;
    bSetT("#camRead", camSay());
    var bar = $("#camQ");
    bar.setAttribute("aria-valuenow", String(q));
    var qt = !r || !r.cover ? "No fingertip" : r.span < 5 ? "Settling" : r.q < CAM_Q ? "Poor" : r.q < CAM_GOOD ? "Fair" : "Good";
    bar.setAttribute("aria-valuetext", qt);
    $("#camQBar").style.width = q + "%";
    bar.dataset.q = !r || !r.cover || r.q < CAM_Q ? "low" : r.q < CAM_GOOD ? "mid" : "high";
    bSetT("#camQTxt", qt);
    bSetT("#camLight", CAM.torch === true ? "Light on" : CAM.torch === false ? "Light unavailable: use a lamp or daylight" : "");
    var now = bNow();
    if (!$("#v-heart").hidden && now - CAM.drawAt >= (RM ? 1 : 0.2)) { CAM.drawAt = now; camDraw(); }
  }
  // the last six seconds of the pulse, turned over so each beat rises, with a dot on each beat counted
  function camDraw() {
    var f = fitCanvas($("#camTrace")), r = CAM.res, em = $("#camEmpty");
    em.hidden = !!(r && r.y && r.cover);
    if (!f || !r || !r.y || !r.cover) return;
    var c = f.c, W = f.w, Hh = f.h, y = r.y, n = y.length, span = 6, t1 = r.t0 + (n - 1) / CAM_FS, t0 = t1 - span;
    var k0 = Math.max(0, Math.floor((t0 - r.t0) * CAM_FS)), lo = Infinity, hi = -Infinity, k;
    for (k = k0; k < n; k++) { if (y[k] < lo) lo = y[k]; if (y[k] > hi) hi = y[k]; }
    if (!(hi > lo)) return;
    var X = function (t) { return 6 + (t - t0) / span * (W - 12); }, Y = function (v) { return Hh - 10 - (v - lo) / (hi - lo) * (Hh - 20); };
    var col = BCOL.hr || "#f472b6";
    c.lineWidth = 2; c.lineJoin = "round"; c.strokeStyle = rgba(col, r.q >= CAM_Q ? 0.95 : 0.4);
    c.beginPath();
    for (k = k0; k < n; k++) { var t = r.t0 + k / CAM_FS; if (k === k0) c.moveTo(X(t), Y(y[k])); else c.lineTo(X(t), Y(y[k])); }
    c.stroke();
    c.fillStyle = col;
    CAM.beatT.forEach(function (tb) {
      if (tb < t0 || tb > t1) return;
      var kk = Math.round((tb - r.t0) * CAM_FS);
      if (kk < 0 || kk >= n) return;
      c.beginPath(); c.arc(X(tb), Y(y[kk]), 3.5, 0, 2 * Math.PI); c.fill();
    });
  }

  function camInit() {
    $("#camGo").addEventListener("click", camGo);
    $("#camStop").addEventListener("click", camStop);
    SUP_EXTRA.push({ name: CAM_NAME, href: "#cam" });           // Settings' list of what the donation unlocks
    window.addEventListener("pagehide", function () { if (CAM.on || CAM.busy) camStop(); });
    if (window.ResizeObserver) new ResizeObserver(function () { if (CAM.on) camDraw(); }).observe($("#camTrace"));
    camUI();
    if (window.__entrain) {
      var X = window.__entrain;
      X.CAM = CAM; X.camStep = camStep; X.camBand = camBand; X.camSpec = camSpec; X.camStop = camStop; X.rmssd = rmssd; X.cohCompute = cohCompute; X.hrLive = hrLive;
    }
  }
