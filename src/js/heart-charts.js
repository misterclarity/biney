  /* ----- charts ----- */

  function fitCanvas(cv) {
    var c = cv.getContext && cv.getContext("2d"), r = cv.getBoundingClientRect();
    if (!c || !r.width || !r.height) return null;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = Math.round(r.width * dpr), h = Math.round(r.height * dpr);
    if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; }
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    c.clearRect(0, 0, r.width, r.height);
    return { c: c, w: r.width, h: r.height };
  }
  function niceMax(v) { return Math.max(4, Math.ceil(v / 4) * 4); }

  function drawSwings() {
    var cv = $("#hrBars"), f = fitCanvas(cv), sw = B.swings;
    $("#hrBarsEmpty").hidden = sw.length > 0;
    if (!f || !sw.length) return;
    var c = f.c, W = f.w, Hh = f.h, padL = 30, padT = 8, padB = 6, ph = Hh - padT - padB;
    var n = Math.max(12, Math.floor((W - padL) / 15)), shown = sw.slice(-n), max = 0;
    shown.forEach(function (s) { if (s.amp > max) max = s.amp; });
    max = niceMax(max);
    c.font = "500 11px " + B_SANS;
    c.textAlign = "right";
    c.textBaseline = "middle";
    c.lineWidth = 1;
    [0, max / 2, max].forEach(function (v) {
      var y = Math.round(padT + ph - v / max * ph) + 0.5;
      c.strokeStyle = BCOL.line;
      c.beginPath(); c.moveTo(padL, y); c.lineTo(W, y); c.stroke();
      c.fillStyle = BCOL["text-faint"];
      c.fillText(String(v), padL - 7, y);
    });
    var slot = (W - padL) / n, bw = Math.max(3, Math.min(14, slot * 0.62));
    shown.forEach(function (s, i) {
      var h = Math.max(1.5, s.amp / max * ph), x = padL + slot * i + (slot - bw) / 2;
      c.fillStyle = rgba(BCOL.hr, i === shown.length - 1 ? 0.95 : 0.5);
      c.fillRect(x, padT + ph - h, bw, h);
    });
  }

  function nearestRate(r) {
    var best = FIND_RATES[0];
    FIND_RATES.forEach(function (x) { if (Math.abs(x - r) < Math.abs(best - r)) best = x; });
    return best;
  }
  /* Mean swing at each test pace. The first breath at each pace is left out:
     heart rate is still settling from the previous one. */
  function findResults() {
    return FIND_RATES.map(function (rate) {
      var amps = B.swings.filter(function (s) { return nearestRate(60 / s.cyc) === rate; })
        .map(function (s) { return s.amp; }).slice(1);
      return { rate: rate, amp: amps.length ? avg(amps) : null, n: amps.length };
    });
  }

  function drawFind() {
    var f = fitCanvas($("#hrFind"));
    if (!f) return;
    var res = B.finder ? findResults() : (H.find ? H.find.res : null);
    var c = f.c, W = f.w, Hh = f.h, padT = 20, padB = 22, ph = Hh - padT - padB, max = 0, best = null;
    (res || []).forEach(function (r) {
      if (r.amp !== null && r.amp > max) max = r.amp;
      if (r.amp !== null && (!best || r.amp > best.amp)) best = r;
    });
    max = niceMax(max);
    var slot = W / FIND_RATES.length, bw = Math.min(46, slot * 0.56);
    c.strokeStyle = BCOL.line;
    c.lineWidth = 1;
    c.beginPath(); c.moveTo(0, padT + ph + 0.5); c.lineTo(W, padT + ph + 0.5); c.stroke();
    FIND_RATES.forEach(function (rate, i) {
      var r = res ? res[i] : null, x = slot * i + (slot - bw) / 2, cx = slot * i + slot / 2;
      var cur = B.finder && B.finder.idx === i;
      if (r && r.amp !== null) {
        var h = Math.max(2, r.amp / max * ph), isBest = !B.finder && best && r.rate === best.rate;
        c.fillStyle = rgba(BCOL.hr, isBest ? 0.95 : 0.42);
        c.fillRect(x, padT + ph - h, bw, h);
        c.font = (isBest ? "700 " : "600 ") + "12px " + B_SANS;
        c.fillStyle = isBest ? BCOL.text : BCOL["text-dim"];
        c.textAlign = "center"; c.textBaseline = "bottom";
        c.fillText(r.amp.toFixed(1), cx, padT + ph - h - 4);
      } else {
        c.setLineDash([3, 4]);
        c.strokeStyle = rgba(BCOL["text-faint"], 0.5);
        c.strokeRect(x + 0.5, padT + ph - 18.5, bw - 1, 18);
        c.setLineDash([]);
      }
      var lab = rate + (i === FIND_RATES.length - 1 ? " /min" : "");
      c.font = (cur ? "700 " : "600 ") + "11.5px " + B_SANS;
      c.fillStyle = cur ? BCOL.text : BCOL["text-faint"];
      c.textAlign = "center"; c.textBaseline = "top";
      c.fillText(lab, cx, padT + ph + 5);
      if (cur) {                                           // the pace being tested now
        c.fillStyle = BCOL.hr;
        c.fillRect(cx - 9, padT + ph + 19, 18, 2);
      }
    });
  }

  /* ----- resonance test ----- */

  function findTimings(rate) {
    var cyc = 60 / rate, inh = Math.round(cyc * 0.4 * 10) / 10;   // 40:60 in:out, as the protocol recommends a longer exhale
    return { inh: inh, sip: 0, hold: 0, exh: Math.round((cyc - inh) * 10) / 10, rest: 0 };
  }
  function setTimings(t) { BC.inh = t.inh; BC.sip = t.sip; BC.hold = t.hold; BC.exh = t.exh; BC.rest = t.rest; }
  function syncBreathControls() {
    checkRadio("bpat", BC.pattern); checkRadio("blen", String(BC.minutes));
    syncChips("#bPats"); syncChips("#bLen");
    syncFields(); syncRate(); renderNote(); syncVisHint();
  }

  function finderStart() {
    if (H.state !== "on" || B.finder) return;
    var saved = {};
    Object.keys(BC).forEach(function (k) { saved[k] = BC[k]; });
    bStop();
    B.finder = { saved: saved, idx: 0, stepAt: 0 };
    setTimings(findTimings(FIND_RATES[0]));
    BC.pattern = "custom";
    BC.minutes = 0;
    syncBreathControls();
    bSetT("#bDesc", "Resonance test running. Follow the guide; the pace slows a little every two minutes. Sit still and breathe gently, not deeply.");
    bFresh();
    bResume();
    finderUI(0);
    drawFind();
    goView("breathe");
  }
  function finderTick(bt) {
    var F = B.finder;
    if (!F || bt < 0) return;
    if (bt - F.stepAt >= FIND_STEP) {
      if (F.idx >= FIND_RATES.length - 1) { finderFinish(); return; }
      F.idx++;
      F.stepAt = bt;
      setTimings(findTimings(FIND_RATES[F.idx]));
      syncFields(); syncRate();
      applyTimings();
      bSetT("#bMsg", "Slowing to " + FIND_RATES[F.idx] + " breaths a minute from the next breath.");
      drawFind();
    }
    finderUI(bt);
  }
  function finderRestore(F) {
    Object.keys(F.saved).forEach(function (k) { BC[k] = F.saved[k]; });
    syncBreathControls();
  }
  /* Stop the test and put the viewer's own settings back. Callers decide
     what happens to the session itself. */
  function finderCancel() {
    var F = B.finder;
    if (!F) return;
    B.finder = null;
    finderRestore(F);
    bSetT("#bMsg", "Resonance test stopped.");
    finderUI();
    drawFind();
  }
  function finderFinish() {
    var F = B.finder, bt = breathTime(), L = locate(bt);
    bEnd(L.count, Math.max(0, bt), "Resonance test complete. Your results are under the guide.");
    var res = findResults(), best = null;
    res.forEach(function (r) { if (r.amp !== null && (!best || r.amp > best.amp)) best = r; });
    H.find = { at: Date.now(), res: res, best: best ? best.rate : null, rr: H.hasRR };
    store.set("resonance", JSON.stringify(H.find));
    hTest(Math.max(0, bt), H.find.best);
    B.finder = null;
    finderRestore(F);
    B.ph = buildPhases(BC); B.pending = null; B.epoch = 0; B.done = 0; planTotal();
    renderLine();
    bSetT("#bMsg", "");
    syncTransport(); updateHead(); draw();
    finderUI(); drawFind();
    bSetT("#bLive", "Resonance test complete.");
  }
  function useBest() {
    if (!H.find || !H.find.best) return;
    if (B.finder) finderCancel();
    setTimings(findTimings(H.find.best));
    BC.pattern = matchPreset();
    syncBreathControls();
    applyTimings();
    saveBreath();
    bSetT("#bMsg", "Set to " + H.find.best + " breaths a minute, your resonance test result.");
    goView("breathe");
  }
  /* A sensor that sends heart rate only usually smooths it over a few seconds, which flattens the
     swing of faster breathing more than that of slower, so with one the test leans towards the
     slower paces. Said while one is on, and under a result that came from one. */
  function finderNote() {
    var t = H.find && H.find.best && H.find.rr === false
      ? "This result came from a sensor that sends heart rate only, so it may lean towards the slower paces. An ear-clip sensor or a chest strap gives a truer result."
      : hrOnly() ? "This sensor sends heart rate only, smoothed over a few seconds, which flattens faster breathing more than slower. With it, the test leans towards the slower paces; an ear-clip sensor or a chest strap gives a truer result."
      : "";
    bSetT("#hrFindNote", t);
    $("#hrFindNote").hidden = !t;
  }
  function finderUI(bt) {
    var F = B.finder, btn = $("#hrFindStart"), use = $("#hrFindUse");
    finderNote();
    if (F) {
      bSetT("#hrFindStart", "Stop test");
      btn.disabled = false;
      use.hidden = true;
      var left = Math.max(0, FIND_STEP - Math.max(0, (typeof bt === "number" ? bt : breathTime()) - F.stepAt));
      bSetT("#hrFindWhen", "Pace " + (F.idx + 1) + " of " + FIND_RATES.length + " · " + FIND_RATES[F.idx] + " /min · " + fmt(left) + " left");
      bSetT("#bMsg", "Resonance test, pace " + (F.idx + 1) + " of " + FIND_RATES.length + ": " + FIND_RATES[F.idx] + " a minute, " + fmt(left) + " left");
      return;
    }
    bSetT("#hrFindStart", H.find ? "Run the test again" : "Start resonance test");
    btn.disabled = H.state !== "on";
    var when = H.state !== "on" ? "Connect a sensor first" : "";
    if (H.find) {
      var d = new Date(H.find.at);
      when = "Last run " + d.toLocaleDateString(undefined, { day: "numeric", month: "short" });
    }
    bSetT("#hrFindWhen", when);
    if (H.find && H.find.best) {
      var lo = null;
      H.find.res.forEach(function (r) { if (r.amp !== null && (lo === null || r.amp < lo)) lo = r.amp; });
      var top = H.find.res.filter(function (r) { return r.rate === H.find.best; })[0];
      bSetT("#hrFindTxt", "Biggest swing at " + H.find.best + " breaths a minute: " + top.amp.toFixed(1) +
        " bpm, against " + lo.toFixed(1) + " at the smallest. Differences under about 1 bpm are within noise, so if two paces are close, pick the one that feels easier.");
      use.hidden = false;
      bSetT("#hrFindUse", "Breathe at " + H.find.best + " /min");
    } else if (H.find) {
      bSetT("#hrFindTxt", "There wasn't enough heart-rate data to compare paces. Check that the sensor stays connected for the whole test and run it again.");
      use.hidden = true;
    } else {
      use.hidden = true;
    }
  }

  /* ----- coherence -----
     HeartMath's published coherence measure (Balaji et al. 2025; McCraty et
     al. 2009). Take the last 64 s of inter-beat intervals, resample evenly,
     remove the linear trend, and find the highest spectral peak between
     0.04 and 0.26 Hz. Integrate a 0.030 Hz window centred on it, and the
     power below and above that window across the spectrum (0.0033-0.4 Hz
     here, the standard HRV range; the papers don't state the limits):
       CR = (peak / below) x (peak / above),   score = ln(CR + 1)
     which usually runs 0 to 8. The window is zero-padded to 256 s for a
     finer frequency grid and left untapered, so the peak's main lobe
     (1/64 Hz either side) fits the 0.030 Hz window. */
  var COH_WIN = 64, COH_FS = 4, COH_DF = 1 / 256;

  function cohCompute(pts, tEnd) {
    // pts: [{t (s), v (inter-beat interval, ms)}], oldest first
    var t0 = tEnd - COH_WIN, n = COH_WIN * COH_FS, x = new Array(n), i, j = 0, k;
    if (pts.length < 8 || pts[0].t > t0 + 3 || tEnd - pts[pts.length - 1].t > 4) return null;
    for (i = 1; i < pts.length; i++) {
      if (pts[i].t > t0 && pts[i].t - pts[i - 1].t > 5) return null;      // a gap: not 64 s of rhythm
    }
    for (i = 0; i < n; i++) {
      var t = t0 + i / COH_FS;
      while (j < pts.length - 2 && pts[j + 1].t <= t) j++;
      var a = pts[j], b = pts[j + 1] || a;
      x[i] = (t <= a.t || b.t <= a.t) ? a.v : t >= b.t ? b.v : a.v + (b.v - a.v) * (t - a.t) / (b.t - a.t);
    }
    var sx = 0, sy = 0, sxx = 0, sxy = 0;
    for (i = 0; i < n; i++) { sx += i; sy += x[i]; sxx += i * i; sxy += i * x[i]; }
    var slope = (n * sxy - sx * sy) / (n * sxx - sx * sx), icpt = (sy - slope * sx) / n;
    for (i = 0; i < n; i++) x[i] -= icpt + slope * i;

    var K = Math.ceil(0.42 / COH_DF), P = new Array(K + 1);
    for (k = 0; k <= K; k++) {
      var w = 2 * Math.PI * k * COH_DF / COH_FS, re = 0, im = 0;
      for (i = 0; i < n; i++) { re += x[i] * Math.cos(w * i); im -= x[i] * Math.sin(w * i); }
      P[k] = re * re + im * im;
    }
    var kLo = Math.ceil(0.04 / COH_DF), kHi = Math.floor(0.26 / COH_DF), kp = kLo;
    for (k = kLo; k <= kHi; k++) if (P[k] > P[kp]) kp = k;
    var half = 0.015 / COH_DF, kMin = Math.ceil(0.0033 / COH_DF), kMax = Math.floor(0.4 / COH_DF);
    var peak = 0, below = 0, above = 0;
    for (k = kMin; k <= kMax; k++) {
      if (Math.abs(k - kp) <= half) peak += P[k];
      else if (k < kp) below += P[k];
      else above += P[k];
    }
    if (!(peak > 0 && below > 0 && above > 0)) return null;
    var cr = (peak / below) * (peak / above);
    return { cs: Math.log(cr + 1), cr: cr, f: kp * COH_DF, P: P };
  }
  // end cohCompute

  function median(a) {
    var s = a.slice().sort(function (p, q) { return p - q; }), m = s.length >> 1;
    return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
  }

  /* Every 5 s, from the beat-to-beat intervals. A sensor that sends heart rate only gets no
     score: a watch averages its heart rate over a few seconds before sending it, which flattens
     the rise and fall within each breath that the score looks for. The estimate this used to make
     from a Garmin watch stayed low however well its wearer breathed, while the HeartMath sensor
     reached the same person's usual scores within minutes. */
  function cohTick() {
    var now = bNow(), pts;
    if (H.state !== "on" || !H.hasRR) { H.coh = null; cohShow(); drawSpectrum(); return; }
    pts = H.beats.filter(function (b) { return b.t >= now - COH_WIN - 3; }).map(function (b) { return { t: b.t, v: b.rr }; });
    if (pts.length) {
      var med = median(pts.map(function (p) { return p.v; }));
      pts = pts.filter(function (p) { return Math.abs(p.v - med) / med <= 0.3; });   // missed or extra beats
    }
    var r = cohCompute(pts, now);
    H.coh = r ? { cs: r.cs, f: r.f, P: r.P } : null;
    if (r && B.state === "running" && breathTime() >= 0) B.coh.push(r.cs);
    if (r && P.state === "running") P.coh.push({ t: pT(), cs: r.cs });
    cohShow();
    drawSpectrum();
  }

  function cohShow() {
    var c = H.coh, live = hrLive(), on = !!(c && live), s;
    bSetT("#hrCoh", on ? c.cs.toFixed(1) : "—");
    $("#hrCohBar").style.width = on ? Math.min(100, c.cs / 8 * 100).toFixed(1) + "%" : "0%";
    if (H.state !== "on") s = "Needs a heart-rate sensor";
    else if (hrOnly()) s = "Needs beat-to-beat data, which an ear-clip sensor or a chest strap sends";
    else if (!on) {
      var left = H.since ? Math.ceil(COH_WIN - (bNow() - H.since)) : COH_WIN;
      s = left > 0 ? "Collecting: " + left + " s to go" : "Waiting for steady data";
    } else {
      s = "Peak at " + c.f.toFixed(3) + " Hz, " + (c.f * 60).toFixed(1) + " a minute";
    }
    bSetT("#hrCohS", s);
    finderNote();
    $("#bCohStat").hidden = !on;
    bSetT("#bCoh", on ? c.cs.toFixed(1) : "—");
  }

  /* The spectrum behind the score: heart-rate power by frequency, the peak
     window filled, the 0.04-0.26 Hz search band shaded, and the breathing
     pace as a dashed line while a session runs. */
  var SPEC_EMPTY = null;     // what the empty chart says, until a sensor that sends heart rate only is on
  function drawSpectrum() {
    var f = fitCanvas($("#hrSpec")), co = H.coh && hrLive() ? H.coh : null, em = $("#hrSpecEmpty");
    if (SPEC_EMPTY === null) SPEC_EMPTY = em.textContent;
    bSetT("#hrSpecEmpty", hrOnly() ? "This sensor sends heart rate only. The spectrum needs the time between heartbeats, which an ear-clip sensor or a chest strap sends." : SPEC_EMPTY);
    em.hidden = !!co;
    if (!f || !co) return;
    var c = f.c, W = f.w, Hh = f.h, padL = 6, padR = 10, padT = 22, padB = 20, FMAX = 0.4;
    var pw = W - padL - padR, ph = Hh - padT - padB, base = padT + ph;
    var X = function (fr) { return padL + fr / FMAX * pw; };
    c.fillStyle = rgba(BCOL.line, 0.35);
    c.fillRect(X(0.04), padT, X(0.26) - X(0.04), ph);
    c.strokeStyle = BCOL.line; c.lineWidth = 1;
    c.beginPath(); c.moveTo(padL, base + 0.5); c.lineTo(W - padR, base + 0.5); c.stroke();
    c.font = "500 10.5px " + B_SANS; c.fillStyle = BCOL["text-faint"]; c.textBaseline = "top";
    [0, 0.1, 0.2, 0.3, 0.4].forEach(function (v, i) {
      c.textAlign = i === 0 ? "left" : i === 4 ? "right" : "center";
      c.fillText(v === 0 ? "0" : v + (i === 4 ? " Hz" : ""), X(v), base + 5);
    });

    var P = co.P, kMax = Math.floor(FMAX / COH_DF), max = 0, k;
    for (k = 1; k <= kMax; k++) if (P[k] > max) max = P[k];
    if (!(max > 0)) return;
    var Y = function (p) { return base - p / max * ph; };
    c.beginPath(); c.moveTo(X(0), base);
    for (k = 0; k <= kMax; k++) c.lineTo(X(k * COH_DF), Y(P[k]));
    c.lineTo(X(FMAX), base); c.closePath();
    c.fillStyle = rgba(BCOL.hr, 0.16); c.fill();
    // the 0.030 Hz peak window, filled solid
    c.save();
    c.beginPath(); c.rect(X(co.f - 0.015), padT - 4, X(co.f + 0.015) - X(co.f - 0.015), ph + 4); c.clip();
    c.beginPath(); c.moveTo(X(0), base);
    for (k = 0; k <= kMax; k++) c.lineTo(X(k * COH_DF), Y(P[k]));
    c.lineTo(X(FMAX), base); c.closePath();
    c.fillStyle = rgba(BCOL.hr, 0.55); c.fill();
    c.restore();
    c.beginPath();
    for (k = 0; k <= kMax; k++) { var px = X(k * COH_DF), py = Y(P[k]); if (k) c.lineTo(px, py); else c.moveTo(px, py); }
    c.strokeStyle = rgba(BCOL.hr, 0.95); c.lineWidth = 1.5; c.stroke();

    if ((B.state === "running" || B.state === "paused") && B.ph) {
      var fb = 1 / B.ph.cycle;
      c.setLineDash([3, 4]); c.strokeStyle = BCOL["b-in"]; c.lineWidth = 1.5;
      c.beginPath(); c.moveTo(X(fb), padT - 6); c.lineTo(X(fb), base); c.stroke();
      c.setLineDash([]);
    }
    c.font = "650 11.5px " + B_SANS; c.fillStyle = BCOL.text; c.textBaseline = "bottom";
    var lx = X(co.f);
    c.textAlign = lx < 40 ? "left" : lx > W - 40 ? "right" : "center";
    c.fillText(co.f.toFixed(3) + " Hz", lx, padT - 8);
  }

