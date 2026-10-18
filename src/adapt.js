
  /* ------------------------ heart-led beats and the power nap ------------------------
     Both use a program track whose beat is set live (track.dyn) instead of following a
     fixed schedule, and both read your heart through the sensor. Everything they infer
     is an estimate and is labelled that way on screen.
  ------------------------------------------------------------------------------ */
  function aBeat(hz, tau) {
    var tr = pTrack();
    if (!tr || !tr.dyn) return;
    tr.cur = hz;
    if (A.oscR && A.ctx) A.oscR.frequency.setTargetAtTime(tr.carrier + hz, A.ctx.currentTime, tau || 1.5);
  }
  function adClamp(x) { return Math.max(0, Math.min(1, x)); }
  function adHR(T, win) { return P.hr.filter(function (x) { return x.t > T - win && x.t <= T; }).map(function (x) { return x.hr; }); }
  function adBand(hz) { return hz >= 8 ? "alpha" : hz >= 4 ? "theta" : "delta"; }

  /* ----- heart-led beats -----
     A sound picture of your heart's calm, the way biofeedback works: as heart rate falls
     below your baseline and beat-to-beat variability and coherence rise, the beat glides
     from 10 Hz (alpha) toward 4 Hz (theta), never more than 0.15 Hz every five seconds.
     After ten minutes it leads up to 1 Hz further down. With no heart data it follows a
     gentle scripted descent. The rule is Entrain's own and hasn't been tested. */
  var AD = { base: null, last: -99, calm: 0, cur: 10, log: [], src: "" };
  function heartLed(min) {
    var total = min * 60, settle = 60, base = 90, close = 60;
    return [
      G(settle, "Settle", ["Sit back or lie down with headphones on. Breathe naturally; there's no pace to follow in this one.",
        "The beat will follow your heart. As your heart rate settles and its rhythm loosens, the beat slows from alpha toward theta.",
        "Let your attention rest on the sound, or on the breath at the nostrils."], { vis: "orb" }),
      { k: "adapt", phase: "base", secs: base, title: "Listening to your heart", lines: [[0, "First, a minute and a half to measure your resting baseline. Just rest."]] },
      { k: "adapt", phase: "lead", secs: total - settle - base - close, title: "Heart-led beat",
        lines: [[0, "Now the beat is following your heart. Nothing to do but rest."], [240, "Let the sound carry you."], [600, "Notice how quiet the body has become."]] },
      G(close, "Closing", ["Let the sound fade. Take a fuller breath.", "Notice how you feel, and look at what your heart did on the next screen."], { vis: "orb" })
    ];
  }
  function pAdaptReset() { AD.base = null; AD.last = -99; AD.calm = 0; AD.cur = 10; AD.log = []; AD.src = ""; }
  function adBaseline(T) {
    var hs = adHR(T, 75);
    if (hs.length < 20) return null;
    var rm = rmssd(bNow() - 75, bNow());
    return { hr: median(hs), rm: rm ? rm.v : 0 };
  }
  function pAdaptTick(s, st, T) {
    if (s.phase === "base") {
      if (st >= s.secs - 3 && !AD.base) AD.base = adBaseline(T);
      if (T - AD.last >= 5) { AD.last = T; AD.log.push({ t: T, hz: AD.cur, src: "base" }); }
      return;
    }
    if (T - AD.last < 5) return;
    AD.last = T;
    var hrs = adHR(T, 30), live = hrLive() && hrs.length >= 8, target;
    if (live && !AD.base && st >= 60) AD.base = adBaseline(T);      // skipped the baseline: take it now
    if (live && AD.base) {
      var sc = 0.5 * adClamp((AD.base.hr - median(hrs)) / 8), w = 0.5;   // heart rate below baseline: 8 bpm is the full share
      var rm = H.hasRR ? rmssd(bNow() - 60, bNow()) : null;
      if (rm && AD.base.rm) { sc += 0.3 * adClamp((rm.v / AD.base.rm - 1) / 0.5); w += 0.3; }   // RMSSD up by half: full share
      var co = P.coh.length ? P.coh[P.coh.length - 1] : null;
      if (co && T - co.t < 15 && H.hasRR) { sc += 0.2 * adClamp((co.cs - 0.8) / 2.2); w += 0.2; }
      AD.calm += (sc / w - AD.calm) * 0.35;
      target = 10 - 6 * AD.calm;
      AD.src = "heart";
    } else {
      target = 10 - 4 * Math.min(1, st / (s.secs * 0.7));
      AD.src = "script";
    }
    target -= Math.min(1, Math.max(0, (st - 600) / 300));
    target = Math.max(3.5, Math.min(10, target));
    AD.cur = Math.round((AD.cur + Math.max(-0.15, Math.min(0.15, target - AD.cur))) * 100) / 100;
    aBeat(AD.cur, 1.5);
    AD.log.push({ t: T, hz: AD.cur, calm: AD.calm, src: AD.src });
  }
  /* The live picture: the beat now, big, over your heart rate and the beat so far. */
  function pAdaptDraw(c, W, Hh, s, T, col) {
    var cx = W / 2, top = Hh * 0.08, hz = AD.cur;
    c.textAlign = "center"; c.textBaseline = "alphabetic";
    c.font = "700 " + Math.round(Math.min(W, Hh) * 0.2) + "px " + B_MONO; c.fillStyle = BCOL.text;
    c.fillText(hz.toFixed(1), cx, top + Math.min(W, Hh) * 0.2);
    c.font = "650 13px " + B_SANS; c.fillStyle = rgba(col, 0.95);
    c.fillText("Hz · " + adBand(hz), cx, top + Math.min(W, Hh) * 0.2 + 22);
    var x0 = 12, x1 = W - 12, y0 = Hh * 0.52, y1 = Hh - 22, t0 = P.steps[1] ? P.steps[1].at : 0, span = Math.max(120, T - t0);
    var X = function (t) { return x0 + (t - t0) / span * (x1 - x0); };
    c.strokeStyle = BCOL.line; c.lineWidth = 1; c.beginPath(); c.moveTo(x0, y1 + 0.5); c.lineTo(x1, y1 + 0.5); c.stroke();
    var hr = P.hr.filter(function (p) { return p.t >= t0; });
    if (hr.length > 4) {
      var lo = Infinity, hi = -Infinity;
      hr.forEach(function (p) { lo = Math.min(lo, p.hr); hi = Math.max(hi, p.hr); });
      lo -= 2; hi += 2;
      c.strokeStyle = rgba(BCOL.hr, 0.85); c.lineWidth = 1.6; c.beginPath();
      hr.forEach(function (p, i) { var y = y1 - (p.hr - lo) / (hi - lo) * (y1 - y0); if (i) c.lineTo(X(p.t), y); else c.moveTo(X(p.t), y); });
      c.stroke();
      c.font = "600 11px " + B_SANS; c.textAlign = "left"; c.fillStyle = BCOL.hr;
      c.fillText(Math.round(hr[hr.length - 1].hr) + " bpm" + (AD.base ? " (baseline " + Math.round(AD.base.hr) + ")" : ""), x0, y0 - 8);
    }
    if (AD.log.length > 1) {
      c.strokeStyle = col; c.lineWidth = 2.4; c.beginPath();
      AD.log.forEach(function (p, i) { var y = y1 - (p.hz - 3) / 8 * (y1 - y0); if (i) c.lineTo(X(p.t), y); else c.moveTo(X(p.t), y); });
      c.stroke();
    }
    c.font = "600 11px " + B_SANS; c.textAlign = "right"; c.fillStyle = col;
    c.fillText("beat", x1, y0 - 8);
  }

  /* ----- the power nap -----
     Baseline: your median heart rate over the first two and a half minutes lying down.
     Dozing off: the one-minute median stays at least 3 bpm (or 4%) below it for three
     minutes; heart rate falls as you cross into light sleep. You're woken a nap's length
     after that; with no sign of sleep after 20 minutes you're woken anyway; with no
     sensor, after the nap length plus five minutes to drift off. */
  var NP = {};
  function napReset() { napWakeStop(); NP = { base: 0, chk: -99, since: 0, onset: 0, low: 0, wake: 0, hasHR: false, beatAt: -99, wg: null, wt: [], rung: 0, vibs: 0 }; }
  napReset();
  function powerNap(len) {
    len = len || 20;
    return [
      G(45, "Lie down", ["Lie down somewhere you can rest, with headphones on, and the phone where you'll hear it.",
        "Close your eyes and let the breath slow down. You don't have to fall asleep: resting counts too.",
        "You'll be woken gently. With a heart sensor, the nap is timed from when your heart rate says you've dozed off."], { vis: "dark", dim: true }),
      { k: "nap", nap: len, secs: (len + 25) * 60, title: "Nap", open: true, dim: true, quiet: true, lines: [[0, "Rest now."]] },
      { k: "wake", secs: 120, title: "Waking up", nobell: true, lines: [[0, "Time to wake up. Take a slow, deep breath."], [25, "Wiggle your fingers and toes."],
        [50, "Let some light in. Open your eyes when you're ready."], [80, "Stretch, and take your time."]] },
      G(30, "Up slowly", ["Sit up slowly before you stand. A glass of water helps.", "Notice how you feel."], { vis: "orb" })
    ];
  }
  function pNapTick(s, st, T) {
    if (T - NP.beatAt >= 5) { NP.beatAt = T; aBeat(6 - 3 * Math.min(1, st / 600), 2); }     // 6 Hz theta to 3 Hz delta over ten minutes
    if (!NP.base && st >= 170) {
      var hs = P.hr.filter(function (x) { return x.t >= s.at + 20 && x.t <= s.at + 170; }).map(function (x) { return x.hr; });
      NP.hasHR = hs.length >= 30;
      NP.base = NP.hasHR ? median(hs) : -1;
    }
    if (NP.base > 0 && T - NP.chk >= 10) {
      NP.chk = T;
      var m1 = adHR(T, 60);
      if (m1.length >= 20) {
        var med = median(m1);
        if (!NP.low || med < NP.low) NP.low = med;
        if (!NP.onset) {
          if (med <= NP.base - Math.max(3, 0.04 * NP.base)) { if (!NP.since) NP.since = T - 30; if (T - NP.since >= 210) NP.onset = NP.since; }
          else NP.since = 0;
        }
      }
    }
    var len = s.nap * 60, lost = NP.base > 0 && !adHR(T, 120).length;
    var giveUp = NP.since ? Math.max(s.at + 1200, NP.since + 220) : s.at + 1200;   // a drop being confirmed may be you dozing off: wait for the answer
    NP.wake = NP.onset ? NP.onset + len : (NP.base > 0 && !lost) ? giveUp : s.at + len + 300;
    if (T >= NP.wake) pAdvance();
  }
  /* Waking up: six chimes 8 s apart, louder each time, and a vibration at the start, 30 s and 60 s.
     The chimes are put on the audio clock as soon as the step starts, so they ring on time even when
     the browser slows its timers (screen off); they go through a gain of their own, which pausing or
     leaving the step silences. They play even with bells off. */
  function napChimes(st) {
    if (!pBusOn()) return;
    var ctx = A.ctx, g = ctx.createGain(), t0 = ctx.currentTime - st;
    g.connect(P.bus);
    NP.wg = g; NP.wt = [];
    for (var k = NP.rung; k < 6; k++) {                            // the ones that haven't rung yet
      var t = Math.max(ctx.currentTime + 0.03, t0 + 8 * k);
      pBell(0.14 + 0.07 * k, t, 523.25 * (k % 2 ? 1.25 : 1), g, true);
      NP.wt.push(t);
    }
  }
  function napWakeStop() {
    var g = NP.wg;
    NP.wg = null;
    if (!g || !A.ctx) return;
    var now = A.ctx.currentTime;
    NP.rung += NP.wt.filter(function (t) { return t <= now; }).length;   // those have rung; the rest go quiet
    g.gain.setTargetAtTime(0, now, 0.05);
    setTimeout(function () { try { g.disconnect(); } catch (e) {} }, 400);
  }
  function pWakeTick(s, st) {
    aBeat(3 + 7 * Math.min(1, st / 60), 1.2);                     // back up to 10 Hz over a minute
    if (!NP.wg && NP.rung < 6) napChimes(st);                      // on entering, and what's left after a pause
    var due = [0, 30, 60].filter(function (c) { return st >= c; }).length;
    if (due > NP.vibs) {                                           // once per cue, even if a slowed timer skipped one
      NP.vibs = due;
      if (navigator.vibrate) { try { navigator.vibrate([300, 150, 300]); } catch (e) {} }
    }
  }
  /* T is when the session ended: sleep runs from the estimated onset to the wake-up, or to
     the moment you ended the session, if that came first. */
  function napSummary(r, T) {
    var s = P.steps.filter(function (x) { return x.k === "nap"; })[0];
    if (!s) return;
    var woke = P.steps.filter(function (x) { return x.k === "wake"; })[0], end = woke && woke.at <= T ? woke.at : T;
    r.nap = { sensor: NP.base > 0, base: NP.base > 0 ? Math.round(NP.base) : 0, low: NP.low ? Math.round(NP.low) : 0,
      onset: NP.onset ? Math.round((NP.onset - s.at) / 60) : null, slept: NP.onset ? Math.max(0, Math.round((end - NP.onset) / 60)) : null,
      onsetT: NP.onset || 0, len: s.nap };
  }
