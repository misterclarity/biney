  /* ------------------------------- sleep sounds -------------------------------
     A sound to fall asleep to: pink noise, rain, crickets, a stream or a fire, made on the device (ambience.js),
     that fades out over the time you choose, 15, 30, 45 or 60 minutes, and then ends by itself. Noise played all
     night is a different thing from the short bursts that sleep research times to deep sleep, and one study suggests it
     may cost some of the insight sleep brings, so nothing here plays all night: the whole fade goes onto the
     audio clock the moment it starts (it carries on with the screen off and the page asleep), each sound is told
     to stop at the end, and the player's Open-ended leaves it alone.
     It plays like a track: audio.js treats a track with sleep: true as one of these, so it has the mini player,
     the lock screen, the history and pause on a call, and "I need to stop" fades it. Its page is #sleep-sounds,
     reached from the library under Sleep, Today in the evening and the sleep routines. It's a new technique, so
     Play opens with a donation (supporter.js); the page and its cautions are free to read.
     The player's note about Open-ended with noise late at night is a caution, so it's free too (slpNight).
  ---------------------------------------------------------------------------- */

  // [id, its button, in a sentence, its loops and their levels]
  var SLP_SOUNDS = [["pink", "Pink noise", "pink noise", [["pink", 1]]], ["rain", "Rain", "rain", [["rain", 1]]],
    ["crickets", "Crickets", "crickets", [["crkA", 1], ["crkB", 1]]], ["stream", "Stream", "a stream", [["stream", 1]]],
    ["fire", "Fire", "a crackling fire", [["fire", 1], ["fireP", 0.8]]]];
  var SLP_MINS = [15, 30, 45, 60];
  // the sound and the time chosen (kept on the device); gain: its level against the player's volume, like the background's
  var SLP = { snd: "pink", min: 30, gain: 2.2 };
  var SLP_SAFE = "Keep it quiet: as low as is comfortable, and lower still through earbuds or headphones in bed. If you've slept badly for weeks, " +
    "talk to your doctor: the treatment that works best for insomnia is cognitive behavioural therapy (CBT-I).";

  function slpSound(id) { for (var i = 0; i < SLP_SOUNDS.length; i++) if (SLP_SOUNDS[i][0] === id) return SLP_SOUNDS[i]; return SLP_SOUNDS[0]; }
  function slpMine() { return !!(A.track && A.track.sleep); }
  // how loud, from 1 at the start to 0 at the end: slowly at first, then faster (a raised cosine)
  function slpLevel(u) { return u <= 0 ? 1 : u >= 1 ? 0 : 0.5 + 0.5 * Math.cos(Math.PI * u); }
  /* The whole fade on the audio clock, from `at` seconds into a `total`: a straight line between points no
     more than 15 seconds apart, down to silence at the end. Any AudioParam: the page's, or a test's offline one. */
  function slpFade(param, now, at, total) {
    var step = Math.max(5, Math.min(15, total / 240));
    param.cancelScheduledValues(now);
    param.setValueAtTime(slpLevel(at / total), now);
    for (var s = (Math.floor(at / step) + 1) * step; s < total; s += step) param.linearRampToValueAtTime(slpLevel(s / total), now + s - at);
    param.linearRampToValueAtTime(0, now + Math.max(0, total - at));
  }
  // the track the player plays: no beat, a sound and its time
  function slpTrack() {
    var s = slpSound(SLP.snd);
    return { id: "sleep", sleep: true, sup: true, cat: "relax", name: "Sleep sounds", snd: s[0], band: s[1], minutes: SLP.min, gain: SLP.gain, fade: 2, carrier: 0, beat: 0 };
  }
  /* The sound itself, from `offset` seconds in (audio.js's play() calls this for a sleep track). Its loops are
     made the first time (the page asks for them as it opens, so they're usually ready); if they aren't yet,
     it comes in as soon as they are. fadeIn: seconds to come in over, when the rest is already playing. */
  function slpVoices(offset, fadeIn) {
    var t = A.track, ctx = A.ctx, lay = slpSound(t.snd)[3], gen = A.gen;
    var ready = amNeed(lay.map(function (l) { return l[0]; }), function () {
      if (A.gen === gen && A.playing && A.track === t && !A.vx) slpVoices(A.ctx.currentTime - A.startedAt, 1.5);
    });
    if (!ready) return;
    var now = ctx.currentTime, total = t.minutes * 60, left = Math.max(0, total - offset);
    var out = ctx.createGain(), fb = ctx.createGain(), nodes = [out, fb];
    out.connect(A.master); fb.connect(out);
    if (fadeIn) { out.gain.setValueAtTime(0, now); out.gain.linearRampToValueAtTime(1, now + fadeIn); }
    slpFade(fb.gain, now, offset, total);
    lay.forEach(function (l, i) {
      var src = ctx.createBufferSource(), g = ctx.createGain();
      src.buffer = amBuf(l[0]); src.loop = true; g.gain.value = l[1];
      src.connect(g); g.connect(fb);
      src.start(now, (offset + i * 3.7) % src.buffer.duration);
      src.stop(now + left + 0.5);                     // and it ends, whatever the page is doing by then
      nodes.push(src, g);
    });
    A.vbus = out; A.vx = nodes; A.bp = null;
    SLP.fb = fb;
  }
  // another sound while it plays: the new one takes over in a second, from where the fade has got to
  function slpSwap() {
    paintCache = {};
    $("#pSub").textContent = trackSub(A.track);
    if (A.playing && A.vx) {
      var t = A.ctx.currentTime, g = A.vbus.gain;
      g.cancelScheduledValues(t);
      g.setValueAtTime(g.value, t);
      g.linearRampToValueAtTime(0, t + 1);
      aVoicesEnd(A.vx, 1.3);
      aVoicesForget();
      slpVoices(t - A.startedAt, 1);
    }
    paint();
    msSync();
  }

  /* ----- the page ----- */
  function slpHowTxt(min) {
    return "It starts at your volume, fades slowly at first and then faster, and is silent at " + min + " minutes, when it ends by itself. " +
      "The whole fade is set going as it starts, so it carries on with the screen off, and the player's Open-ended doesn't apply. " +
      "Change the sound while it plays and the new one carries on where the fade has got to; pick another time and it starts again. " +
      "Each sound is synthesised on your device and loops seamlessly: nothing is downloaded or recorded.";
  }
  function slpSeg(id, attr, opts, label) {
    return '<div class="mini-seg slp-seg" id="' + id + '" role="group" aria-label="' + label + '">' + opts.map(function (o) {
      return '<button type="button" ' + attr + '="' + o[0] + '" aria-pressed="false">' + o[1] + "</button>";
    }).join("") + "</div>";
  }
  function slpOpen() {
    var x = TOOLS.sleep;
    if (!supLocked(x)) amNeed(slpSound(SLP.snd)[3].map(function (l) { return l[0]; }));     // ready before Play
    var need = [["volume", "Low volume", "just loud enough to hear; it gets quieter as it goes"],
      ["sounds", "The phone's speaker", "or a speaker by the bed; headphones aren't needed"], ["moon", "In bed", "lights out, ready to sleep"]];
    var h = backLink() +
      '<div class="si-head">' +
        '<div class="si-top"><span class="si-kind">Sleep · Sound · 15–60 min</span>' + favBtn("x:sleep", x.name) + "</div>" +
        "<h2>" + esc(x.name) + "</h2>" +
        '<p class="si-blurb">' + esc(x.blurb) + "</p>" +
      "</div>" +
      '<div class="si-grid"><div class="si-main">' +
        '<ul class="si-need">' + need.map(function (n) { return '<li><svg class="i" aria-hidden="true"><use href="#i-' + n[0] + '"/></svg><span><b>' + n[1] + "</b> " + n[2] + "</span></li>"; }).join("") + "</ul>" +
        '<div class="so-row so-seg slp-row"><span class="so-l">Sound<small>Pick the one you find pleasant: people differ, and a sound one person loves can grate on another.</small></span>' +
          slpSeg("slpSnd", "data-slp-snd", SLP_SOUNDS, "Sound") + "</div>" +
        '<div class="so-row so-seg slp-row"><span class="so-l">Fades out over</span>' +
          slpSeg("slpMin", "data-slp-min", SLP_MINS.map(function (m) { return [m, m + " min"]; }), "Fades out over") + "</div>" +
        '<h3>How it runs</h3><p id="slpHow"></p>' +
        '<details class="ev si-ev"><summary>Evidence ' + dots(x.strength) + '</summary><div class="ev-body">' +
          "Nobody has tested a sound that fades out like this one, so treat it as something to try. Natural sounds such as birdsong, wind and water " +
          "are often, though not always, found pleasant and restful, and people differ in which ones they like. Short bursts of pink noise timed to " +
          "the slow waves of deep sleep strengthened them, and with them memory, in sleep studies, but that needs a headband that reads brain waves all " +
          "night, and later studies found it harder to repeat. Pink noise played all night is a different thing: in a study of 72 students, those who slept with it " +
          "did no better at spotting a hidden rule than those who stayed awake, and the authors suggest it may cost some of the insight sleep brings. So Sleep sounds keeps to the time it takes you to fall asleep, and then ends. " +
          '<a href="#l-sleepsnd">More in Learn</a><cite>Ratcliffe 2021 · Papalambros et al. 2017 · Harlow et al. 2023 · Vickrey &amp; Lerner 2023</cite></div></details>' +
        safeBox([SLP_SAFE]) +
      "</div>" +
      '<div class="si-side"><div class="si-bar">' +
        '<button class="btn primary si-go" id="slpGo"></button>' +
        '<p class="si-bar-note" id="slpSupNote" hidden>' + SUP_NOTE + "</p>" +
        '<p class="si-bar-note">Plays in the player at the bottom: you can lock the phone and let it fade.</p>' +
      "</div></div></div>";
    var el = $("#slpBody");
    el.innerHTML = h;
    el.style.setProperty("--pcol", GOAL_COL.sleep);
    slpSync();
  }
  // the page follows the player: Play, Pause or Resume, and the sound and time that are playing
  function slpSync() {
    var b = $("#slpGo");
    if (!b) return;
    var mine = slpMine(), lk = !mine && supLocked(TOOLS.sleep), ic, txt;
    var snd = mine ? A.track.snd : SLP.snd, min = mine ? A.track.minutes : SLP.min;
    if (mine && A.playing) { ic = "pause"; txt = "Pause"; }
    else if (mine && A.elapsed > 0) { ic = "play"; txt = "Resume at " + fmt(A.elapsed); }
    else if (lk) { ic = "cup"; txt = "Unlock to play"; }                    // a new technique, not yet unlocked on this device
    else { ic = "play"; txt = "Play " + SLP.min + " min"; min = SLP.min; snd = SLP.snd; }
    b.innerHTML = '<svg class="i' + (ic === "play" ? "" : " ic-stroke") + '" aria-hidden="true"><use href="#i-' + ic + '"/></svg>' + esc(txt);
    $("#slpSupNote").hidden = !lk;
    document.querySelectorAll("#slpSnd [data-slp-snd]").forEach(function (x) { x.setAttribute("aria-pressed", x.getAttribute("data-slp-snd") === snd ? "true" : "false"); });
    document.querySelectorAll("#slpMin [data-slp-min]").forEach(function (x) { x.setAttribute("aria-pressed", +x.getAttribute("data-slp-min") === min ? "true" : "false"); });
    bSetT("#slpHow", slpHowTxt(min));
  }
  function slpPlay() {
    if (slpMine() && A.playing) { pause(); return; }
    if (slpMine() && A.elapsed > 0) { play(); return; }
    if (supLocked(TOOLS.sleep)) { supGate(TOOLS.sleep.name, slpPlay); return; }     // a new technique: unlocked first
    ensureCtx();                                     // in the tap itself, which Safari needs
    load(slpTrack());
  }
  function slpPickSnd(id) {
    SLP.snd = slpSound(id)[0];
    store.set("slpSnd", SLP.snd);
    if (slpMine() && A.track.snd !== SLP.snd) { A.track.snd = SLP.snd; A.track.band = slpSound(SLP.snd)[1]; slpSwap(); }
    if (!supLocked(TOOLS.sleep)) amNeed(slpSound(SLP.snd)[3].map(function (l) { return l[0]; }));
    slpSync();
  }
  // another time: playing, it starts again with it; paused, it waits at the start
  function slpPickMin(m) {
    if (SLP_MINS.indexOf(m) < 0) return;
    SLP.min = m;
    store.set("slpMin", String(m));
    if (slpMine() && A.track.minutes !== m) {
      if (A.playing) load(slpTrack());
      else if (A.elapsed > 0) hardStop(true);
    }
    slpSync();
  }

  /* ----- elsewhere ----- */
  // late at night: 9 pm to 5 am (the tests can set the hour)
  function slpLate() { var h = window.__slpHour !== undefined ? window.__slpHour : new Date().getHours(); return h >= 21 || h < 5; }
  /* The player's note, free like every caution: a track left open-ended, with noise or a background sound
     under it, late at night. */
  function slpNight() {
    var el = $("#pNight");
    if (!el) return;
    var t = A.track, on = !!t && !t.sleep && !t.practice && $("#openEnded").checked && (($("#noise").checked && !t.notch) || !!ambSig()) && slpLate();
    if (el.hidden === on) el.hidden = !on;
  }
  // Today's suggestion, in the evening and at night: Sleep sounds beside the evening routine
  function slpLink(hr) {
    var a = $("#sgSnd");
    if (!a) return;
    if (typeof hr === "number") a.hidden = !(hr >= 17 || hr < 5);
    a.innerHTML = "Sleep sounds, fading out" + supTag(true);
  }
  function slpInit() {
    var s = store.get("slpSnd"), m = parseInt(store.get("slpMin"), 10);
    if (SLP_SOUNDS.some(function (x) { return x[0] === s; })) SLP.snd = s;
    if (SLP_MINS.indexOf(m) >= 0) SLP.min = m;
    SUP_EXTRA.push({ name: "Sleep sounds", href: "#sleep-sounds" });     // Settings' list of what the donation unlocks
    $("#slpBody").addEventListener("click", function (e) {
      if (e.target.closest("#slpGo")) { slpPlay(); return; }
      var b = e.target.closest("[data-slp-snd]");
      if (b) { slpPickSnd(b.getAttribute("data-slp-snd")); return; }
      b = e.target.closest("[data-slp-min]");
      if (b) slpPickMin(parseInt(b.getAttribute("data-slp-min"), 10));
    });
    $("#noise").addEventListener("change", slpNight);
    $("#openEnded").addEventListener("change", slpNight);
  }
