  /* -------------------------------- dialogs --------------------------------
     Two blocking dialogs: the headphone check before the first beat, and the tinnitus pitch
     match before the notched track. Focus goes back where it was when one closes, and Tab
     stays inside while one is open.
  ---------------------------------------------------------------------------- */

  var lastFocus = null;
  function openDialog(sel) {
    lastFocus = document.activeElement;
    $(sel).hidden = false;
  }
  function closeDialog(sel) {
    $(sel).hidden = true;
    if (lastFocus && lastFocus.focus) { try { lastFocus.focus(); } catch (e) {} }
    lastFocus = null;
  }

  /* ------------------------ headphone check -------------------------
     The commonest way this page fails is silently: on speakers, one earbud
     or a mono Bluetooth device the two tones mix before they reach the
     listener and there is no binaural beat at all. A five-second channel
     test catches that before anyone sits through a 30-minute session.
  -------------------------------------------------------------------- */

  var pendingPlay = null;

  function gate(fn) {
    if (store.get("stereo") || A.checkSkipped) { fn(); return; }
    pendingPlay = fn;
    openCheck();
  }

  function playTestTone(side) {
    if (!ensureCtx()) { setStatus("Web Audio is not available in this browser."); return; }
    var ctx = A.ctx, now = ctx.currentTime, dur = 2.2;
    var merger = ctx.createChannelMerger(2);
    var osc = ctx.createOscillator();
    var g = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = 440;
    g.gain.setValueAtTime(0, now);
    g.gain.linearRampToValueAtTime(0.25, now + 0.15);
    g.gain.setValueAtTime(0.25, now + dur - 0.3);
    g.gain.linearRampToValueAtTime(0, now + dur);
    osc.connect(g);
    g.connect(merger, 0, side === "right" ? 1 : 0);
    merger.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + dur + 0.05);
    setTimeout(function () { try { g.disconnect(); merger.disconnect(); } catch (e) {} }, (dur + 0.4) * 1000);
  }

  function openCheck() {
    $("#scStep1").hidden = false;
    $("#scStep2").hidden = true;
    $("#scResult").hidden = true;
    $("#scAgain").hidden = true;
    openDialog("#scModal");
    setTimeout(function () { $("#scPlay").focus(); }, 30);
  }

  function closeCheck(runPending) {
    closeDialog("#scModal");
    var fn = pendingPlay;
    pendingPlay = null;
    if (runPending && fn) fn();
  }

  function showResult(cls, title, body, continueLabel) {
    var res = $("#scResult");
    $("#scStep1").hidden = true;
    $("#scStep2").hidden = true;
    res.className = "sc-result " + cls;
    res.innerHTML = "";
    var b = document.createElement("b");
    b.textContent = title;
    res.appendChild(b);
    res.appendChild(document.createTextNode(body));
    res.hidden = false;
    if (continueLabel) {
      $("#scAnyway").textContent = continueLabel;
      $("#scAgain").hidden = false;
      $("#scRetry").focus();
    }
  }

  function answerCheck(a) {
    if (a === "left") {
      store.set("stereo", "ok");
      showResult("ok", "Stereo separation confirmed.",
        " Each ear is receiving its own signal, which is the one thing the beat depends on.", null);
      setTimeout(function () { closeCheck(true); }, 1600);
      return;
    }
    if (a === "right") {
      store.set("stereo", "swapped");
      showResult("ok", "Stereo works \u2014 channels reversed.",
        " Something in your setup has swapped left and right. A binaural beat is the difference " +
        "between the two tones, so it still works exactly as intended; only the L and R labels " +
        "in the player are the wrong way round.", "Continue");
      return;
    }
    if (a === "both") {
      showResult("bad", "No channel separation.",
        " You are on speakers, a mono device, or a Bluetooth connection that has collapsed to one " +
        "channel. The two tones are mixing before they reach you, so there is no binaural beat \u2014 " +
        "just a hum. Wired stereo headphones are the reliable fix.", "Continue anyway");
      return;
    }
    showResult("bad", "Nothing came through.",
      " Check that the right output device is selected and that system and browser volume are up, " +
      "then test again.", "Continue anyway");
  }

  /* ------------------------ tinnitus pitch match ---------------------
     Notched sound therapy works by removing a one-octave band centred on the
     listener's own tinnitus frequency, so the pitch has to be matched before
     the track means anything. Octave errors are the classic failure here, so
     the halve/double buttons are first-class controls rather than a nicety.
  -------------------------------------------------------------------- */

  var pendingPitch = null;
  var pm = { osc: null, gain: null, on: false };

  var PM_MIN = 500, PM_MAX = 10000;
  function pmHz() {
    var v = parseInt($("#pmSlider").value, 10) / 1000;
    return PM_MIN * Math.pow(PM_MAX / PM_MIN, v);
  }
  function pmSetHz(hz) {
    hz = Math.min(PM_MAX, Math.max(PM_MIN, hz));
    var v = Math.log(hz / PM_MIN) / Math.log(PM_MAX / PM_MIN);
    $("#pmSlider").value = Math.round(v * 1000);
    pmSync();
  }
  function pmSync() {
    var hz = pmHz();
    $("#pmHz").textContent = Math.round(hz);
    $("#pmWarn").hidden = hz <= 8000;
    if (pm.on) pm.osc.frequency.setTargetAtTime(hz, A.ctx.currentTime, 0.02);
  }

  function pmStart() {
    if (pm.on || !ensureCtx()) return;
    var ctx = A.ctx, now = ctx.currentTime;
    pm.gain = ctx.createGain();
    pm.gain.gain.setValueAtTime(0, now);
    pm.gain.gain.linearRampToValueAtTime(0.08, now + 0.3);
    pm.osc = ctx.createOscillator();
    pm.osc.type = "sine";
    pm.osc.frequency.setValueAtTime(pmHz(), now);
    pm.osc.connect(pm.gain);
    pm.gain.connect(ctx.destination);
    pm.osc.start(now);
    pm.on = true;
    $("#pmTone").textContent = "Stop tone";
  }
  function pmStop() {
    if (!pm.on) return;
    var t = A.ctx.currentTime, o = pm.osc, g = pm.gain;
    g.gain.cancelScheduledValues(t);
    g.gain.setValueAtTime(g.gain.value, t);
    g.gain.linearRampToValueAtTime(0, t + 0.2);
    setTimeout(function () { try { o.stop(); o.disconnect(); g.disconnect(); } catch (e) {} }, 420);
    pm.osc = null; pm.gain = null; pm.on = false;
    $("#pmTone").textContent = "Play tone";
  }

  function openMatcher() {
    if (A.playing) hardStop(true);
    pmSetHz(tinnitusHz() || 4000);
    openDialog("#pmModal");
    setTimeout(function () { $("#pmTone").focus(); }, 30);
  }
  function closeMatcher(save) {
    pmStop();
    var hz = pmHz();
    closeDialog("#pmModal");
    var fn = pendingPitch;
    pendingPitch = null;
    if (save) {
      store.set("tinnitusHz", String(Math.round(hz)));
      trSync();
      setStatus("Notch centred on " + Math.round(hz) + " Hz.");
      if (fn) fn();
    }
  }

  function dialogsInit() {
    // the headphone check
    $("#scPlay").addEventListener("click", function () {
      playTestTone("left");
      $("#scStep1").hidden = true;
      $("#scStep2").hidden = false;
      $("#scStep2").querySelector("[data-ans]").focus();
    });
    $("#scReplay").addEventListener("click", function () { playTestTone("left"); });
    $("#scStep2").addEventListener("click", function (e) {
      var b = e.target.closest("[data-ans]");
      if (b) answerCheck(b.dataset.ans);
    });
    $("#scRetry").addEventListener("click", openCheck);
    $("#scAnyway").addEventListener("click", function () {
      if (!store.get("stereo")) store.set("stereo", "override");
      closeCheck(true);
    });
    $("#scSkip").addEventListener("click", function () {
      A.checkSkipped = true;          // this visit only; ask again next time
      closeCheck(true);
    });
    $("#scOpen").addEventListener("click", function () { pendingPlay = null; openCheck(); });
    $("#scModal").addEventListener("click", function (e) {
      if (e.target === this) closeCheck(false);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !$("#scModal").hidden) closeCheck(false);
    });

    // the pitch match
    $("#pmSlider").addEventListener("input", pmSync);
    $("#pmTone").addEventListener("click", function () { pm.on ? pmStop() : pmStart(); });
    $("#pmUp").addEventListener("click", function () { pmSetHz(pmHz() * 2); });
    $("#pmDown").addEventListener("click", function () { pmSetHz(pmHz() / 2); });
    $("#pmUse").addEventListener("click", function () { closeMatcher(true); });
    $("#pmCancel").addEventListener("click", function () { closeMatcher(false); });
    $("#pmModal").addEventListener("click", function (e) { if (e.target === this) closeMatcher(false); });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !$("#pmModal").hidden) closeMatcher(false);
    });

    // they're all blocking, so Tab has to stay inside them
    document.addEventListener("keydown", function (e) {
      if (e.key !== "Tab") return;
      var box = ["#sfModal", "#scModal", "#pmModal"].map(function (q) { return $(q); }).filter(function (m) { return !m.hidden; })[0] || null;
      if (!box) return;
      var all = box.querySelectorAll("button, input, a[href], select, textarea");
      var list = [], i;
      for (i = 0; i < all.length; i++) {
        if (!all[i].disabled && all[i].offsetParent !== null) list.push(all[i]);
      }
      if (!list.length) return;
      var first = list[0], last = list[list.length - 1];
      if (!box.contains(document.activeElement)) { e.preventDefault(); first.focus(); return; }
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });
  }
