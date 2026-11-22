  /* ------------------------------ I need to stop ------------------------------
     Always in reach while a practice or the breathing guide runs: one tap fades every sound out in
     half a second, ends the session (into the history, as an ended one, when it was long enough) and
     opens Settle: eyes open, five slow breaths with a long breath out paced on the screen, the
     5-4-3-2-1 grounding a tap away, and a line on talking to someone if it keeps happening. Free, like
     every caution. Search finds it too (#settle).
     A feature that plays through a sound bus of its own adds a quick fade to SETTLE_HUSH.
  -------------------------------------------------------------------------------- */

  var SETTLE = { raf: 0, frameAt: 0, t0: 0, n: 5, inh: 4, exh: 6, c: null, w: 0, h: 0, key: "", from: "" };
  var SETTLE_FADE = 0.5;                  // seconds: every sound gone in half a second
  var SETTLE_HUSH = [];                   // function (secs) for sounds of their own: each fades its own out

  // every sound out at once: speech now, and the rest faded over secs
  function settleHush(secs) {
    pHush();
    if (A.playing) fadeOutAndStop("Stopped.", secs);                // a track, or a practice's beat
    ambHush(secs);                                                  // the background sound, kept from coming back as the rest fades
    var ctx = A.ctx;
    if (ctx) {
      var now = ctx.currentTime;
      [AMB.out, RHY.gain, P.bus, B.bus].forEach(function (g) {       // background sound, the berimbau, bells and ticks, breath cues
        if (!g) return;
        try { g.gain.cancelScheduledValues(now); g.gain.setValueAtTime(g.gain.value, now); g.gain.linearRampToValueAtTime(0, now + secs); } catch (e) {}
      });
      // the bells' bus is let go once quiet, with any bell still ringing on it (one rings for six seconds) and any tick
      // already queued: the next practice makes a fresh one (pBusOn)
      if (P.bus) { var pb = P.bus; P.bus = null; setTimeout(function () { try { pb.disconnect(); } catch (e) {} }, (secs + 0.25) * 1000); }
    }
    SETTLE_HUSH.forEach(function (f) { try { f(secs); } catch (e) {} });
  }
  // end whatever runs, quiet everything, and settle
  function settleNow() {
    var d = pBusy() ? P.def : null;
    if (d) {
      pFinish(true, true);                       // ended: no bells, no end screen
      if (curView === "session") pIntro(d.id);   // its own page waits underneath
    }
    if (B.state === "running" || B.state === "paused") bStop();      // the breathing guide, or the resonance test
    settleHush(SETTLE_FADE);
    settleOpen();
  }
  function settleOpen() {
    if ($("#bStage").classList.contains("focus")) setFocus(false);   // a full-screen stage would hide it
    SETTLE.t0 = bNow() + 1; SETTLE.key = ""; SETTLE.frameAt = 0;
    if ($("#stlModal").hidden) openDialog("#stlModal");
    $("#stlModal .modal-card").scrollTop = 0;
    settleSize();
    cancelAnimationFrame(SETTLE.raf);
    SETTLE.raf = requestAnimationFrame(settleLoop);
    setTimeout(function () { try { $("#stlDone").focus({ preventScroll: true }); } catch (e) {} }, 30);
  }
  function settleClose() {
    cancelAnimationFrame(SETTLE.raf); SETTLE.raf = 0;
    if (!$("#stlModal").hidden) closeDialog("#stlModal");
  }
  // where the breath is: { n: breath 1 to 5 (0 before the first), in, lv: 0 to 1, done }
  function settleAt() {
    var t = bNow() - SETTLE.t0, cyc = SETTLE.inh + SETTLE.exh;
    if (t < 0) return { n: 0, in: false, lv: 0, done: false };
    var n = Math.floor(t / cyc);
    if (n >= SETTLE.n) return { n: SETTLE.n, in: false, lv: 0, done: true };
    var ct = t - n * cyc, inn = ct < SETTLE.inh;
    return { n: n + 1, in: inn, lv: inn ? bEase(ct / SETTLE.inh) : 1 - bEase((ct - SETTLE.inh) / SETTLE.exh), done: false };
  }
  function settleWords(s) {
    var key = s.done ? "done" : s.n + (s.in ? "i" : "o");
    if (key === SETTLE.key) return;
    SETTLE.key = key;
    bSetT("#stlCue", s.done ? "Breathe at your own pace now" : !s.n ? "With the circle: in through your nose…" : s.in ? "Breathe in…" : "And a long, slow breath out…");
    bSetT("#stlN", s.done ? "Five slow breaths. Well done." : s.n ? "Breath " + s.n + " of " + SETTLE.n : "Five slow breaths");
  }
  function settleSize() {
    var cv = $("#stlCanvas");
    if (!cv || !cv.getContext) return;
    var r = cv.getBoundingClientRect(), dpr = Math.min(2, window.devicePixelRatio || 1);
    SETTLE.w = r.width; SETTLE.h = r.height;
    cv.width = Math.round(r.width * dpr); cv.height = Math.round(r.height * dpr);
    SETTLE.c = cv.getContext("2d");
    SETTLE.c.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  // a circle that swells as you breathe in and slowly shrinks as you breathe out; still with reduced motion
  function settleDraw(s) {
    var c = SETTLE.c, W = SETTLE.w, Hh = SETTLE.h;
    if (!c || !W || !Hh) return;
    c.clearRect(0, 0, W, Hh);
    var cx = W / 2, cy = Hh / 2, R = Math.min(W, Hh) / 2 - 6, lv = RM ? 0.5 : s.lv;
    var r = R * (0.42 + 0.5 * lv), col = s.in ? BCOL["b-in"] || "#5eead4" : BCOL["b-out"] || "#a78bfa";
    var g = c.createRadialGradient(cx, cy, r * 0.2, cx, cy, Math.min(R + 4, r * 1.25));
    g.addColorStop(0, rgba(col, 0.34)); g.addColorStop(0.78, rgba(col, 0.16)); g.addColorStop(1, rgba(col, 0));
    c.fillStyle = g;
    c.beginPath(); c.arc(cx, cy, Math.min(R + 4, r * 1.25), 0, Math.PI * 2); c.fill();
    c.strokeStyle = rgba(col, 0.75); c.lineWidth = 2.5;
    c.beginPath(); c.arc(cx, cy, r, 0, Math.PI * 2); c.stroke();
    c.strokeStyle = rgba(BCOL.line || "#28334f", 1); c.lineWidth = 1; c.setLineDash([3, 5]);
    c.beginPath(); c.arc(cx, cy, R * 0.92, 0, Math.PI * 2); c.stroke();
    c.setLineDash([]);
  }
  function settleLoop(ts) {
    SETTLE.raf = 0;
    if ($("#stlModal").hidden) return;
    var s = settleAt();
    settleWords(s);
    if (frameDue(SETTLE, ts)) settleDraw(s);
    if (!s.done) SETTLE.raf = requestAnimationFrame(settleLoop);
    else settleDraw(s);
  }
  // the 5-4-3-2-1 grounding, started straight away
  function settleGround() {
    settleClose();
    var d = pDef("grounding");
    if (!d) return;
    try { history.pushState(null, "", "#practice/grounding"); } catch (e) {}
    showView("session");
    pIntro("grounding");
    if (!pBusy()) pStart();
  }
  // #settle, from search: over the page you were on, which keeps its address (search's result takes the
  // panel's place in the history, so there's no address before it to read: the last one seen is kept)
  function settleRoute(from) {
    var back = from && from.indexOf("#") >= 0 ? from.slice(from.indexOf("#")) : SETTLE.from;
    if (!curView) showView("home");
    try { history.replaceState(null, "", back && back !== "#settle" ? back : location.pathname + location.search); } catch (e) {}
    settleNow();
  }
  // the control on a running practice and on the breathing guide, and while Breath-led sound's music plays as it
  // waits for your pace (breathled.js)
  function settleSync() {
    var b = $("#bOut");
    if (b) b.hidden = !(B.state === "running" || B.state === "paused" || BLS.phase === "find") || (P.usesB && pBusy());
  }
  function settleInit() {
    $("#sOut").addEventListener("click", settleNow);
    $("#bOut").addEventListener("click", settleNow);
    $("#stlDone").addEventListener("click", settleClose);
    $("#stlGround").addEventListener("click", settleGround);
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !$("#stlModal").hidden) settleClose(); });
    window.addEventListener("resize", function () { if (!$("#stlModal").hidden) { settleSize(); settleDraw(settleAt()); } });
    var seen = function () { if (location.hash !== "#settle") SETTLE.from = location.hash; };
    window.addEventListener("hashchange", seen);
    seen();
    settleSync();
  }
