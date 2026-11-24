  /* ------------------------------ light pulse at 40 Hz ------------------------------
     The brain-wave guide's rhythmic light flicker: light that flickers 40 times a second draws a matching
     40 Hz response from the brain's visual areas (MIT's research, early, in mice and in people with Alzheimer's
     disease). The guide rates it promising but early, with a seizure risk for people with photosensitive
     epilepsy, and asks for clear warnings, opt-in and safe frequencies. So on the 40 Hz tracks (Gamma Focus 40
     and Working Memory Gamma), with their beat:

     - It opens only once the health check is answered with epilepsy and seizures from flashing light unticked,
       and asks again each time, in a dialog with a box to tick, before it starts. Reduced motion keeps it off.
     - It needs a screen that draws at least 120 pictures a second, measured from the browser's frames each
       time (and with Check this screen, free). At 60, a 40 Hz pulse can't be drawn: it comes out as a 20 Hz
       flicker, the range most likely to set off a seizure, so it stays off there and the page says why.
     - It's a soft glow on part of the screen, smooth (a sine wave, not on and off), and dim: the light at its
       centre moves between 10% and 17% of the screen's full brightness, a change of 7%, where WCAG counts a
       change of 10% or more as a flash. The glow's opacity is worked out for each picture so that the light,
       not the pixel value, follows the sine (the sRGB curve undone), on a dark grey stage, with no red.
     - Each picture's time comes from the browser's frame clock. A picture that comes late is drawn at the
       middle level rather than at a phase the screen can't keep up with, and more than 12 late in a second
       end it: an uneven pulse has slower flicker in it.
     - It ends after ten minutes, with one tap anywhere (or Escape, Space or Enter), when Entrain goes out of
       sight or another page opens, when the sound stops, with I need to stop, and when reduced motion is
       turned on. The sound plays on, unless it was I need to stop.
     A new technique: Start opens with a donation while this device is locked; the card, its cautions and
     Check this screen are free. Its minutes go into the track's history entry (lpTake, history.js).
  ---------------------------------------------------------------------------------- */
  var LP_NAME = "Light pulse at 40 Hz";
  var LP_HZ = 40;                  // pulses a second, with the 40 Hz tracks' beat
  var LP_MIN = 118;                // pictures a second the screen must draw: 120, with room for a 119.9 Hz screen measured a hair slow
  var LP_MAX_MS = 6e5;             // ten minutes at most
  var LP_MID = 0.135, LP_AMP = 0.035;    // light at the glow's centre (relative luminance, 1 = the screen's white): 0.10 to 0.17
  var LP_BG = 6;                   // the stage's grey, of 255 (styles.css .lp-stage)
  var LP_RAMP = 2000;              // ms: the pulse grows from nothing over the first two seconds
  var LP_LATE = 1.5;               // a picture more than one and a half frames after the last is late
  var LP_LATE_MAX = 12;            // late pictures in any second that end it
  var LP_WHAT = "A soft glow in the middle of the screen brightens and dims 40 times a second, with the beat, for up to ten minutes. " +
    "In MIT's research, light flickering at 40 Hz drew a matching rhythm from the brain; that research is early, in mice and in people with " +
    "Alzheimer's disease, with lights far stronger than this. This glow is gentle on purpose: low in contrast, smooth, and on part of the screen.";
  var SAFE_FLICKER = "Flashing light can set off a seizure in people with photosensitive epilepsy, sometimes their first: the light pulse isn't for anyone with epilepsy, or for children. " +
    "Use it sitting down in a well-lit room, the phone at arm's length, and end it with a tap if you feel unwell, get a headache or see odd colours or patterns.";
  // what a pulse ended by says, in the toast and on the card
  var LP_END = {
    tap: "The light pulse has ended. The sound plays on: pause it in the player whenever you like.",
    time: "Ten minutes: the light pulse has ended, and the sound plays on.",
    hidden: "The light pulse ended when Entrain went out of sight.",
    nav: "The light pulse ended as you left the page.",
    track: "The light pulse ended with the sound.",
    slow: "The screen fell behind, so the light pulse ended: drawn unevenly, a pulse has slower flicker in it. Battery saver off and other apps closed may help.",
    motion: "Your device now asks for reduced motion, so the light pulse ended.",
    settle: ""
  };
  /* on: the stage is up. id: its track. hz: the screen's pictures a second as last measured this visit (null not yet,
     0 couldn't tell). t0, last: the frame clock at its first and latest picture; cnt: ms of it already in the history;
     late: the late pictures' times in the last second; secs: pulse seconds per track not yet in the history;
     trace: each picture's time and light, while the debug hook is on (for the tests) */
  var LP = { on: false, id: "", ask: "", hz: null, measuring: false, mgen: 0, raf: 0, t0: null, last: 0, wall0: 0, cnt: 0, frameMs: 0, late: [], left: -1,
    secs: {}, why: "", trace: null, mq: null, glow: null, hideT: 0 };

  // the 40 Hz tracks: a steady 40 Hz beat
  function lpFits(t) { return !!t && t.beat === LP_HZ && !t.notch && typeof t.rampFrom !== "number" && !t.pts && !t.practice; }
  function lpRM() { return LP.mq ? !!LP.mq.matches : RM; }
  // why it can't start now: reduced motion, the health check unanswered, epilepsy ticked, a screen too slow or one it couldn't measure; "" when it can
  function lpBlock() {
    if (lpRM()) return "motion";
    if (!hcAnswered()) return "health";
    if (hcFlags().epilepsy) return "epilepsy";
    if (LP.hz === 0) return "unknown";
    if (LP.hz !== null && LP.hz < LP_MIN) return "slow";
    return "";
  }

  /* ----- the light: sRGB's curve, both ways, and the glow's opacity for a light ----- */
  function lpEnc(L) { return L <= 0.0031308 ? 12.92 * L : 1.055 * Math.pow(L, 1 / 2.4) - 0.055; }
  function lpLin(v) { return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }
  // the browser blends the white glow over the grey stage on the encoded values: this opacity gives light L at its centre
  function lpAlpha(L) { var b = LP_BG / 255; return (lpEnc(L) - b) / (1 - b); }
  // the light at time t (ms from the first picture), held at the middle on a late picture, growing over the first two seconds
  function lpLum(t, late) {
    if (late) return LP_MID;
    return LP_MID + LP_AMP * Math.min(1, t / LP_RAMP) * Math.sin(2 * Math.PI * LP_HZ * t / 1000);
  }

  /* ----- the screen: how many pictures a second it draws ----- */
  // the browser's frame times → pictures a second (from the middle interval, once most intervals agree), or 0
  function lpHzOf(ts) {
    var d = [], i;
    for (i = 4; i < ts.length; i++) d.push(ts[i] - ts[i - 1]);     // the first few frames after a tap can stumble
    if (d.length < 20) return 0;
    var s = d.slice().sort(function (a, b) { return a - b; }), m = s[s.length >> 1];
    if (!(m > 0)) return 0;
    var near = d.filter(function (x) { return Math.abs(x - m) <= m * 0.15; }).length;
    return near >= d.length * 0.75 ? 1000 / m : 0;
  }
  function lpMeasure(cb) {
    if (LP.measuring || LP.on) return;
    LP.measuring = true;
    lpUI();
    var ts = [], gen = ++LP.mgen, guard = 0;
    var fin = function (hz) {
      if (gen !== LP.mgen) return;
      LP.mgen++;
      clearTimeout(guard);
      LP.measuring = false;
      LP.hz = hz;
      lpUI();
      if (cb) cb(hz);
    };
    guard = setTimeout(function () { fin(0); }, 3000);     // a browser that gives no frames (out of sight): it couldn't tell
    var step = function (now) {
      if (gen !== LP.mgen) return;
      if (document.hidden) { fin(0); return; }
      ts.push(now);
      if (ts.length < 68 && now - ts[0] < 1300) requestAnimationFrame(step);
      else fin(lpHzOf(ts));
    };
    requestAnimationFrame(step);
  }
  function lpSlowTxt(hz) {
    var n = Math.round(hz);
    return "This screen draws about " + n + " pictures a second. A pulse 40 times a second needs at least 120 to come out even: " +
      (n >= 50 && n <= 70 ? "at " + n + " it would come out as a flicker about 20 times a second, in the range most likely to set off a seizure, "
        : "here it would come out uneven, with slower flicker in it, ") +
      "so the light pulse stays off on this screen. If yours has a 120 Hz or smooth display setting, turn it on, and battery saver off, then check again. " +
      "Some browsers draw pages at 60 a second even on a faster screen.";
  }

  /* ----- the card on a 40 Hz track's page ----- */
  function lpSlot(t) {
    if (!lpFits(t)) return "";
    return '<section class="lp-card" id="lpCard" aria-labelledby="lpH">' +
      '<h3 id="lpH"><svg class="i" aria-hidden="true"><use href="#i-sun"/></svg>' + esc(LP_NAME) + ' <span class="lt-exp">Experimental</span></h3>' +
      "<p>" + esc(LP_WHAT) + ' <a href="#l-flicker">Why, and the research</a></p>' +
      '<p class="lp-st" id="lpSt" aria-live="polite"></p>' +
      '<div class="lp-acts"><button class="btn primary" id="lpGo"></button><button class="btn" id="lpCheck">Check this screen</button></div>' +
      '<p class="lp-note">It plays the track too, if it isn\'t playing yet.</p>' +
      safeBox([SAFE_FLICKER]) + '<div id="lpHc"></div>' +
      "</section>";
  }
  // what the card says now, and whether Start can be pressed
  function lpSays() {
    var why = lpBlock();
    if (LP.measuring) return esc("Checking this screen…");
    if (why === "motion") return esc("Your device asks for reduced motion, so the light pulse stays off.");
    if (why === "health") return esc("It opens once your health check is answered, with epilepsy and seizures from flashing light left unticked.") +
      ' <a href="#st-health">Answer the health check</a>';
    if (why === "epilepsy") return esc("Your health check lists epilepsy or seizures from flashing light, so the light pulse stays off for you. The 40 Hz sound is still yours to play.");
    if (why === "unknown") return esc("Entrain couldn't tell how fast this screen draws, so the light pulse stays off. Check again with the screen on and Entrain in front.");
    if (why === "slow") return esc(lpSlowTxt(LP.hz));
    if (LP.hz) return esc("This screen draws about " + Math.round(LP.hz) + " pictures a second: enough for an even pulse 40 times a second.");
    return esc("It needs a screen that draws at least 120 pictures a second: Entrain checks yours each time you start, or now.");
  }
  function lpUI() {
    var c = $("#lpCard");
    if (!c) return;
    var why = lpBlock(), go = $("#lpGo"), st = $("#lpSt"), h = lpSays();
    if (st.innerHTML !== h) st.innerHTML = h;
    var gh = '<svg class="i" aria-hidden="true"><use href="#i-sun"/></svg>Start the light pulse' + supTag();
    if (go.innerHTML !== gh) go.innerHTML = gh;
    go.disabled = !!why || LP.measuring || LP.on;
    $("#lpCheck").disabled = LP.measuring || LP.on;
    var hc = hcBox(["flicker"]);
    if ($("#lpHc").innerHTML !== hc) $("#lpHc").innerHTML = hc;
  }

  /* ----- starting: the gate, the screen, the dialog, then the sound and the stage ----- */
  function lpGo() {
    var t = trackById(TR.id);
    if (!lpFits(t) || LP.on || LP.measuring || lpBlock()) { lpUI(); return; }
    supGate(LP_NAME, function () {
      lpMeasure(function () {
        if (lpBlock() || !LP.hz) return;          // the card says why
        lpAsk(t);
      });
    });
  }
  // asked fresh each time: nothing ticked, Start waiting for the tick
  function lpAsk(t) {
    LP.ask = t.id;
    $("#lpOk").checked = false;
    $("#lpYes").disabled = true;
    var g = $("#lpGo");                      // waiting while the screen was measured, it lost focus: it gets it back when this closes
    if (g && !g.disabled) try { g.focus({ preventScroll: true }); } catch (e) {}
    openDialog("#lpModal");
    $("#lpModal .modal-card").scrollTop = 0;
    setTimeout(function () { try { $("#lpOk").focus(); } catch (e) {} }, 30);
  }
  function lpAskClose() { if (!$("#lpModal").hidden) closeDialog("#lpModal"); LP.ask = ""; }
  function lpBegin() {
    var t = trackById(LP.ask);
    lpAskClose();
    if (!t || trackById(TR.id) !== t || curView !== "track" || lpBlock() || !LP.hz) return;
    var mine = A.track && A.track.id === t.id;
    if (!(mine && A.playing)) {
      if (mine && A.elapsed > 0) play();
      else gate(function () { load(t); }, bmTrackMode(t));        // the headphone check first, for a binaural beat that hasn't had one
    }
    if (A.track && A.track.id === t.id && A.playing) lpShow(t);
    else toast("The light pulse starts with the sound: once the track is playing, start the light pulse again.", { ms: 6000 });
  }

  /* ----- the stage ----- */
  function lpShow(t) {
    LP.on = true; LP.id = t.id; LP.t0 = null; LP.last = 0; LP.cnt = 0; LP.late = []; LP.left = -1; LP.why = "";
    LP.wall0 = Date.now();
    LP.frameMs = 1000 / LP.hz;
    LP.trace = store.get("debug") ? [] : null;
    LP.glow.style.opacity = lpAlpha(LP_MID).toFixed(4);
    bSetT("#lpLeft", fmt(LP_MAX_MS / 1000) + " left");
    clearTimeout(LP.hideT);
    $("#lpStage").hidden = false;
    document.body.classList.add("lp-on");
    lpUI();
    LP.raf = requestAnimationFrame(lpFrame);
    setTimeout(function () { if (LP.on) try { $("#lpEnd").focus({ preventScroll: true }); } catch (e) {} }, 30);
  }
  function lpFrame(ts) {
    if (!LP.on) return;
    LP.raf = requestAnimationFrame(lpFrame);
    if (LP.t0 === null) { LP.t0 = ts; LP.last = ts; }
    var dt = ts - LP.last, t = ts - LP.t0, late = dt > LP.frameMs * LP_LATE;
    LP.last = ts;
    if (late) LP.late.push(ts);
    while (LP.late.length && ts - LP.late[0] > 1000) LP.late.shift();
    if (LP.late.length > LP_LATE_MAX) { lpEnd("slow"); return; }
    if (t >= LP_MAX_MS || Date.now() - LP.wall0 >= LP_MAX_MS + 2000) { lpEnd("time"); return; }
    var L = lpLum(t, late);
    LP.glow.style.opacity = lpAlpha(L).toFixed(4);
    if (LP.trace) { LP.trace.push([Math.round(t * 100) / 100, +L.toFixed(5), late ? 1 : 0]); if (LP.trace.length > 2400) LP.trace.splice(0, 1200); }
    var left = Math.ceil((LP_MAX_MS - t) / 1000);
    if (left !== LP.left) { LP.left = left; bSetT("#lpLeft", fmt(left) + " left"); }
  }
  function lpEnd(why) {
    if (!LP.on) return;
    LP.on = false;
    cancelAnimationFrame(LP.raf); LP.raf = 0;
    if (LP.t0 !== null) LP.secs[LP.id] = (LP.secs[LP.id] || 0) + Math.max(0, LP.last - LP.t0 - LP.cnt) / 1000;
    LP.glow.style.opacity = "0";
    // a tap's own click comes after it: the dark stage stays a moment to catch it, so it can't press what's underneath
    // (Start on the page, or Settle's buttons)
    clearTimeout(LP.hideT);
    if (why === "tap" || why === "settle") LP.hideT = setTimeout(lpHide, 350); else lpHide();
    LP.why = why;
    lpUI();
    if (LP_END[why]) toast(LP_END[why], { ms: why === "slow" ? 9000 : 6000 });
    var g = $("#lpGo");
    if (g && why !== "settle" && why !== "nav" && why !== "hidden") try { (g.disabled ? $("#lpCheck") : g).focus({ preventScroll: true }); } catch (e) {}
  }
  function lpHide() { if (LP.on) return; $("#lpStage").hidden = true; document.body.classList.remove("lp-on"); }
  // the sound stopped, paused or changed (playSync): the pulse goes with it
  function lpSync() {
    if (LP.on && !(A.playing && A.track && A.track.id === LP.id)) lpEnd("track");
  }
  // seconds of light pulse with this track since it was last written down, the running pulse's too (history.js)
  function lpTake(id) {
    var s = LP.secs[id] || 0;
    LP.secs = {};
    if (LP.on && LP.id === id && LP.t0 !== null) { s += Math.max(0, LP.last - LP.t0 - LP.cnt) / 1000; LP.cnt = LP.last - LP.t0; }
    return s;
  }

  function lpInit() {
    LP.glow = $("#lpGlow");
    LP.mq = window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)") : null;
    var mqGo = function () { if (lpRM() && LP.on) lpEnd("motion"); lpUI(); };
    if (LP.mq) { if (LP.mq.addEventListener) LP.mq.addEventListener("change", mqGo); else if (LP.mq.addListener) LP.mq.addListener(mqGo); }
    document.addEventListener("click", function (e) {
      if (e.target.closest("#lpGo")) lpGo();
      else if (e.target.closest("#lpCheck")) lpMeasure(null);
    });
    // the dialog before each pulse
    $("#lpOk").addEventListener("change", function () { $("#lpYes").disabled = !this.checked; });
    $("#lpYes").addEventListener("click", function () { if ($("#lpOk").checked) lpBegin(); });
    $("#lpNo").addEventListener("click", lpAskClose);
    $("#lpModal").addEventListener("click", function (e) { if (e.target === this) lpAskClose(); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !$("#lpModal").hidden) lpAskClose(); });
    // the stage: one tap anywhere ends it; I need to stop ends it and settles
    var stage = $("#lpStage");
    stage.addEventListener("pointerdown", function (e) {
      if (!LP.on) return;
      e.preventDefault();
      if (e.target.closest("#lpOut")) { lpEnd("settle"); settleNow(); }
      else lpEnd("tap");
    });
    stage.addEventListener("click", function (e) {           // a button pressed from the keyboard
      if (!LP.on) return;
      if (e.target.closest("#lpOut")) { lpEnd("settle"); settleNow(); }
      else lpEnd("tap");
    });
    // while it's up, keys go to it first and no further (the page's own shortcuts wait underneath):
    // Escape, Space or Enter ends it, Tab stays on its two buttons
    window.addEventListener("keydown", function (e) {
      if (!LP.on) return;
      e.stopPropagation();
      if (e.key === "Tab") {
        e.preventDefault();
        ($("#lpEnd") === document.activeElement ? $("#lpOut") : $("#lpEnd")).focus();
        return;
      }
      if (e.key === "Escape" || e.key === " " || e.key === "Enter" || e.code === "Space") {
        e.preventDefault();
        if (document.activeElement === $("#lpOut") && e.key !== "Escape") { lpEnd("settle"); settleNow(); }
        else lpEnd("tap");
      }
    }, true);
    document.addEventListener("visibilitychange", function () {
      if (!document.hidden) return;
      if (LP.on) lpEnd("hidden");
      if (LP.measuring) { LP.mgen++; LP.measuring = false; lpUI(); }       // a measure cut short tells nothing
    });
    window.addEventListener("pagehide", function () { if (LP.on) lpEnd("hidden"); });
    window.addEventListener("hashchange", function () { if (LP.on) lpEnd("nav"); });
    SETTLE_HUSH.push(function () { if (LP.on) lpEnd("settle"); });              // I need to stop, from anywhere
    SUP_EXTRA.push({ name: LP_NAME, href: "#track/gamma-40" });              // Settings' list of what the donation unlocks
    if (window.__entrain) {
      var X = window.__entrain;
      X.LP = LP; X.lpAlpha = lpAlpha; X.lpEnc = lpEnc; X.lpLin = lpLin; X.lpLum = lpLum; X.lpHzOf = lpHzOf; X.lpBlock = lpBlock; X.lpEnd = lpEnd; X.lpFits = lpFits;
      X.LP_MID = LP_MID; X.LP_AMP = LP_AMP; X.LP_BG = LP_BG; X.LP_MIN = LP_MIN; X.LP_MAX_MS = LP_MAX_MS;
    }
  }
