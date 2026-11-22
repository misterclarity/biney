  /* ------------------------------------------------------------------
     Audio engine. A beat plays one of three ways (A.mode, chosen in
     beatmode.js): binaural, two oscillators merged into discrete left and
     right channels so there is genuinely no crossfeed between them;
     monaural, the same two tones mixed into both channels; isochronic,
     the carrier alone, switched on and off at the beat.
  ------------------------------------------------------------------ */
  var A = {
    ctx: null, oscL: null, oscR: null, gL: null, gR: null, lfo: null,
    master: null, noiseSrc: null, noiseGain: null,
    vbus: null,        // the voices' own level, between them and master: a prime's task phase fades it alone
    vx: null,          // every node of the voices, to stop and disconnect together
    bp: null,          // where the beat lives: { p: the frequency it moves, base: what's added to the beat }
    mode: "binaural",  // how the loaded track's beat plays: "binaural" | "monaural" | "isochronic"
    track: null, startedAt: 0, elapsed: 0, playing: false, clock: 0, endTimer: 0,
    phase: "single",   // "single" | "prime" | "task"
    gainMul: 1,        // phase-level attenuation, independent of the volume slider
    voicesOff: false,  // task phase where the carriers were deliberately faded out
    gen: 0             // bumped on every transport change; stale timers check it
  };

  var FADE_IN = 2.0, FADE_OUT = 4.0;

  function ensureCtx() {
    if (!A.ctx) {
      var Ctor = window.AudioContext || window.webkitAudioContext;
      if (!Ctor) return null;
      A.ctx = new Ctor();
      A.master = A.ctx.createGain();
      A.master.gain.value = 0;
      A.master.connect(A.ctx.destination);
    }
    if (A.ctx.state === "suspended") A.ctx.resume();
    return A.ctx;
  }

  function volGain() {
    var v = parseInt($("#vol").value, 10) / 100;
    return v * v * 0.55 * A.gainMul; // perceptual-ish curve, deliberately conservative
  }

  var pinkBuf = null;
  function makePinkNoise(ctx) {
    if (pinkBuf) return pinkBuf;
    var len = Math.floor(ctx.sampleRate * 4);
    var buf = ctx.createBuffer(2, len, ctx.sampleRate);
    for (var ch = 0; ch < 2; ch++) {
      var d = buf.getChannelData(ch);
      var b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (var i = 0; i < len; i++) {
        var w = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + w * 0.0555179;
        b1 = 0.99332 * b1 + w * 0.0750759;
        b2 = 0.96900 * b2 + w * 0.1538520;
        b3 = 0.86650 * b3 + w * 0.3104856;
        b4 = 0.55000 * b4 + w * 0.5329522;
        b5 = -0.7616 * b5 - w * 0.0168980;
        d[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11;
        b6 = w * 0.115926;
      }
    }
    pinkBuf = buf;
    return buf;
  }

  var noiseNodes = [];

  /* With a notch centre, the noise is split into a low band and a high band with
     one octave left empty between them (geometrically centred on the matched
     pitch, so f/\u221a2 to f\u00b7\u221a2). Three cascaded biquads a side give a
     steep skirt; a single "notch" biquad is far too narrow for an octave. */
  function startNoise(notchHz) {
    if (!A.ctx || A.noiseSrc) return;
    var ctx = A.ctx, target = 0.16, i;
    A.noiseGain = ctx.createGain();
    A.noiseGain.gain.value = 0;
    A.noiseGain.connect(A.master);
    A.noiseSrc = ctx.createBufferSource();
    A.noiseSrc.buffer = makePinkNoise(ctx);
    A.noiseSrc.loop = true;

    if (notchHz) {
      var lo = notchHz / Math.SQRT2, hi = notchHz * Math.SQRT2;
      var a = A.noiseSrc, b = A.noiseSrc;
      for (i = 0; i < 3; i++) {
        var lp = ctx.createBiquadFilter();
        lp.type = "lowpass"; lp.frequency.value = lo; lp.Q.value = 0.707;
        a.connect(lp); a = lp; noiseNodes.push(lp);
      }
      for (i = 0; i < 3; i++) {
        var hp = ctx.createBiquadFilter();
        hp.type = "highpass"; hp.frequency.value = hi; hp.Q.value = 0.707;
        b.connect(hp); b = hp; noiseNodes.push(hp);
      }
      a.connect(A.noiseGain);
      b.connect(A.noiseGain);
      target = 0.3;            // the therapeutic signal, not an ambient bed
    } else {
      A.noiseSrc.connect(A.noiseGain);
    }

    A.noiseSrc.start();
    A.noiseGain.gain.linearRampToValueAtTime(target, ctx.currentTime + 1.5);
  }

  function stopNoise() {
    if (!A.noiseSrc) return;
    var src = A.noiseSrc, g = A.noiseGain, nodes = noiseNodes, t = A.ctx.currentTime;
    noiseNodes = [];
    g.gain.cancelScheduledValues(t);
    g.gain.setValueAtTime(g.gain.value, t);
    g.gain.linearRampToValueAtTime(0, t + 1);
    setTimeout(function () {
      try {
        src.stop(); src.disconnect(); g.disconnect();
        for (var i = 0; i < nodes.length; i++) nodes[i].disconnect();
      } catch (e) {}
    }, 1400);
    A.noiseSrc = null; A.noiseGain = null;
  }

  function tinnitusHz() {
    var v = parseFloat(store.get("tinnitusHz"));
    return (v && isFinite(v)) ? v : 0;
  }

  /* Beat frequency at a given elapsed time (handles ramp tracks). */
  function beatAt(track, seconds) {
    if (track.dyn) return track.cur;            // a beat set live (heart-led beats, the nap)
    if (track.pts) {
      var q = track.pts, i = 0;
      if (seconds <= q[0][0]) return q[0][1];
      while (i < q.length - 1 && q[i + 1][0] <= seconds) i++;
      if (i >= q.length - 1) return q[q.length - 1][1];
      return q[i][1] + (q[i + 1][1] - q[i][1]) * (seconds - q[i][0]) / (q[i + 1][0] - q[i][0]);
    }
    if (typeof track.rampFrom !== "number") return track.beat;
    var total = track.minutes * 60;
    var p = total > 0 ? Math.min(1, Math.max(0, seconds / total)) : 1;
    return track.rampFrom + (track.beat - track.rampFrom) * p;
  }

  /* The voices for one beat, built in any audio context (the page's own, or an offline one a test renders) and
     connected to `out`, starting at `now`, `offset` seconds into the track:
     - binaural: the carrier in the left ear only, the carrier plus the beat in the right ear only. Neither ear hears
       the beat; it forms inside the head, so it needs headphones.
     - monaural: the same two tones mixed into both ears, so the sound itself swells and fades at the beat, on
       speakers as well as headphones.
     - isochronic: the carrier alone in both ears, switched on and off at the beat by a square wave with rounded
       edges (a sine through a tanh curve), so it doesn't click.
     The beat lives on one frequency: the right-hand tone's (carrier + beat) or the switching's (the beat itself).
     Every schedule moves that one (a slide, a practice's points, a change while it runs, a beat that follows the
     heart), so each way follows the same beat. */
  var BEAT_PEAK = { binaural: 0.5, monaural: 0.3, isochronic: 0.6 };      // each tone's level: every way peaks at 0.5 to 0.6 an ear
  var A_PULSE = null;
  // the rounded square: tanh(4x), scaled to reach ±1, so each edge takes about a tenth of a cycle (2 ms at 40 Hz)
  function aPulse() {
    if (A_PULSE) return A_PULSE;
    var n = 1025, c = new Float32Array(n), k = Math.tanh(4);
    for (var i = 0; i < n; i++) c[i] = Math.tanh(4 * (2 * i / (n - 1) - 1)) / k;
    return (A_PULSE = c);
  }
  function aVoices(ctx, out, track, offset, mode, now) {
    var v = { mode: mode, nodes: [] }, peak = BEAT_PEAK[mode] || 0.5;
    var add = function (n) { v.nodes.push(n); return n; };
    var tone = function (hz) { var o = add(ctx.createOscillator()); o.type = "sine"; o.frequency.setValueAtTime(hz, now); return o; };
    var level = function (g) { var n = add(ctx.createGain()); n.gain.value = g; return n; };
    var m = add(ctx.createChannelMerger(2));
    m.connect(out);
    v.oscL = tone(track.carrier);
    if (mode === "isochronic") {
      v.lfo = add(ctx.createOscillator());
      v.lfo.type = "sine";
      var shape = add(ctx.createWaveShaper()), depth = level(0.5), lvl = level(peak);
      shape.curve = aPulse();
      v.gL = level(0.5);                   // the switch: its gain is 0.5 plus 0.5 times the rounded square, so 0 to 1
      v.lfo.connect(shape); shape.connect(depth); depth.connect(v.gL.gain);
      v.oscL.connect(v.gL); v.gL.connect(lvl);
      lvl.connect(m, 0, 0); lvl.connect(m, 0, 1);
      v.beat = { p: v.lfo.frequency, base: 0 };
    } else {
      v.oscR = tone(track.carrier);
      v.gL = level(peak); v.gR = level(peak);
      v.oscL.connect(v.gL); v.gL.connect(m, 0, 0);
      v.oscR.connect(v.gR); v.gR.connect(m, 0, 1);
      if (mode === "monaural") { v.gL.connect(m, 0, 1); v.gR.connect(m, 0, 0); }    // each tone in both ears
      v.beat = { p: v.oscR.frequency, base: track.carrier };
    }
    var bt = v.beat;
    bt.p.setValueAtTime(bt.base + beatAt(track, offset), now);
    if (track.pts) {
      track.pts.forEach(function (p) {
        if (p[0] > offset) bt.p.linearRampToValueAtTime(bt.base + p[1], now + (p[0] - offset));
      });
    } else if (typeof track.rampFrom === "number") {
      var remaining = Math.max(0, track.minutes * 60 - offset);
      if (remaining > 0) bt.p.linearRampToValueAtTime(bt.base + track.beat, now + remaining);
    }
    v.oscL.start(now);
    if (v.oscR) v.oscR.start(now);
    if (v.lfo) v.lfo.start(now);
    return v;
  }
  // where the playing beat lives, for whatever moves it while it plays; null with no voices
  function aBeatParam() { return A.vx ? A.bp : null; }

  function buildVoices(track, offsetSeconds) {
    var ctx = A.ctx, now = ctx.currentTime;
    A.vbus = ctx.createGain();
    A.vbus.connect(A.master);
    var v = aVoices(ctx, A.vbus, track, offsetSeconds, A.mode, now);
    v.nodes.push(A.vbus);
    A.vx = v.nodes; A.bp = v.beat;
    A.oscL = v.oscL; A.oscR = v.oscR || null; A.gL = v.gL; A.gR = v.gR || null; A.lfo = v.lfo || null;
  }
  // stop and disconnect a set of voices once they've faded
  function aVoicesEnd(nodes, secs) {
    setTimeout(function () {
      nodes.forEach(function (n) {
        try { if (n.stop) n.stop(); } catch (e) {}
        try { n.disconnect(); } catch (e) {}
      });
    }, secs * 1000);
  }
  function aVoicesForget() { A.oscL = A.oscR = A.gL = A.gR = A.lfo = A.vbus = A.vx = A.bp = null; }

  function teardownVoices(fadeSeconds) {
    if (!A.vx) return;
    var ctx = A.ctx, t = ctx.currentTime, f = fadeSeconds || 0.15;
    A.master.gain.cancelScheduledValues(t);
    A.master.gain.setValueAtTime(A.master.gain.value, t);
    A.master.gain.linearRampToValueAtTime(0, t + f);
    aVoicesEnd(A.vx, f + 0.25);
    aVoicesForget();
  }

  /* Fade out only the voices, leaving master — and therefore the pink
     noise bed — running. Used when a prime hands over to a noise-only task phase. */
  function fadeOutVoicesOnly(seconds) {
    if (!A.vx) return;
    var t = A.ctx.currentTime, g = A.vbus.gain;
    g.cancelScheduledValues(t);
    g.setValueAtTime(g.value, t);
    g.linearRampToValueAtTime(0, t + seconds);
    aVoicesEnd(A.vx, seconds + 0.3);
    aVoicesForget();
  }

  /* The beat's sound changed while it plays (beatmode.js): the new voices take over in a quarter of a
     second, from where the track is, and everything else (the volume, the noise bed, the clock) plays on. */
  function aSwapVoices() {
    if (!A.playing || A.voicesOff || !A.vx || A.track.sleep) return;
    var t = A.ctx.currentTime, old = A.vx, g = A.vbus.gain;
    g.cancelScheduledValues(t);
    g.setValueAtTime(g.value, t);
    g.linearRampToValueAtTime(0, t + 0.25);
    aVoicesEnd(old, 0.5);
    aVoicesForget();
    buildVoices(A.track, t - A.startedAt);
    A.vbus.gain.setValueAtTime(0, t);
    A.vbus.gain.linearRampToValueAtTime(1, t + 0.25);
  }

  /* ---------------------------- transport ---------------------------- */

  function load(track) {
    if (supLocked(track)) { supGate(track.name, function () { load(track); }); return; }   // a new technique's track, by any way in
    // your check-in first, if you keep them (own.js): not for a practice's own beat, or a switch while one plays
    if (!track.practice && !(A.playing && A.track && !A.track.practice) && ciBefore("track", track.name, function () { load(track); })) return;
    if (A.playing || A.oscL) hardStop(true);
    else hTrack();                       // a paused track that's being replaced still counts
    A.hAt = 0;
    A.gen++;
    A.voicesOff = false;
    A.track = track;
    ciBind(track);                       // the check-in just given is this track's (own.js)
    A.elapsed = 0;
    A.phase = track.then ? "prime" : "single";
    A.gainMul = track.gain || 1;                      // a practice's quieter beat (During the Call: half)
    A.mode = track.sleep ? "none" : bmTrackMode(track);   // binaural, monaural or isochronic (beatmode.js); Sleep sounds has no beat
    A.noisePref = $("#noise").checked;
    $("#player").classList.toggle("p-sleep", !!track.sleep);   // Sleep sounds: no beat, no noise bed, no background, always timed
    $("#noise").disabled = !!track.notch;
    $("#noiseLab").classList.toggle("off", !!track.notch);
    $("#noiseTxt").textContent = track.notch ? "Notched noise (built in)" : "Pink-noise bed";
    paintCache = {};
    hideCue();
    $("#player").classList.add("open");
    $("#player").style.setProperty("--pc", "var(--" +
      (track.cat === "relax" ? "relax" : track.cat === "ther" ? "ther" : "stim") + ")");
    $("#pName").textContent = track.name;
    $("#pSub").textContent = trackSub(track);
    paint();
    play();
  }
  // the player's second line: band, beat (or where it goes), how it plays unless binaural, carrier and length
  function trackSub(track) {
    if (track.sleep) return track.band + " · fades out over " + Math.round(track.minutes) + " min";
    var beatTxt = track.pts
      ? (track.pts[0][1] === track.beat ? track.beat.toFixed(1) : track.pts[0][1].toFixed(1) + " → " + track.beat.toFixed(1)) + " Hz"
      : typeof track.rampFrom === "number"
      ? track.rampFrom.toFixed(1) + " → " + track.beat.toFixed(1) + " Hz"
      : track.beat.toFixed(1) + " Hz";
    var m = track === A.track ? A.mode : bmTrackMode(track);
    return (track.then ? "Prime · " : "") + track.band + " · " + beatTxt + (m === "binaural" ? "" : " " + m) + " · " + track.carrier + " Hz carrier · " + Math.round(track.minutes) + " min";
  }

  function play() {
    if (!A.track) return;
    if (!ensureCtx()) {
      setStatus("Web Audio is not available in this browser.");
      return;
    }
    if (A.track.sleep) slpVoices(A.elapsed);          // Sleep sounds: its own sound and fade (sleepsounds.js)
    else if (!A.voicesOff) buildVoices(A.track, A.elapsed);
    var t = A.ctx.currentTime;
    A.master.gain.cancelScheduledValues(t);
    A.master.gain.setValueAtTime(0, t);
    A.master.gain.linearRampToValueAtTime(volGain(), t + FADE_IN);
    if (A.track.notch) startNoise(tinnitusHz());
    else if ($("#noise").checked && !A.track.sleep) startNoise();

    A.startedAt = A.ctx.currentTime - A.elapsed;
    A.playing = true;
    $("#toggle").textContent = "❚❚";
    $("#toggle").setAttribute("aria-label", "Pause");
    $("#player").classList.add("playing");
    playSync();
    scheduleEnd();
    setStatus("Playing — keep the volume low and comfortable.");
    loop();
  }

  function pause() {
    if (!A.playing) return;
    A.gen++;
    A.elapsed = A.ctx.currentTime - A.startedAt;
    teardownVoices(0.4);
    stopNoise();
    A.playing = false;
    clearTimeout(A.endTimer);
    clearTimeout(A.clock);
    $("#toggle").textContent = "▶";
    $("#toggle").setAttribute("aria-label", "Play");
    $("#player").classList.remove("playing");
    playSync();
    setStatus("Paused at " + fmt(A.elapsed) + ".");
  }

  function hardStop(silent) {
    hTrack();                            // what was listened to goes into the history
    A.hAt = 0;
    A.gen++;
    teardownVoices(0.3);
    stopNoise();
    if (A.track && A.track.then) $("#noise").checked = !!A.noisePref;
    A.playing = false;
    A.elapsed = 0;
    /* the session is over: a later press of play restarts it from the top,
       so put the phase back to what this track starts in */
    A.phase = (A.track && A.track.then) ? "prime" : "single";
    A.gainMul = 1;
    A.voicesOff = false;
    clearTimeout(A.endTimer);
    clearTimeout(A.clock);
    $("#toggle").textContent = "▶";
    $("#player").classList.remove("playing");
    playSync();
    paint();
    if (!silent) setStatus("Stopped.");
  }

  function fadeOutAndStop(msg, seconds) {
    var s = typeof seconds === "number" ? seconds : FADE_OUT;
    var t = A.ctx.currentTime;
    clearTimeout(A.endTimer);
    A.master.gain.cancelScheduledValues(t);
    A.master.gain.setValueAtTime(A.master.gain.value, t);
    A.master.gain.linearRampToValueAtTime(0, t + s);
    setStatus("Fading out\u2026");
    var gen = A.gen;
    setTimeout(function () {
      if (gen !== A.gen) return;      // superseded by a new track, a pause or a stop
      hardStop(true);
      setStatus(msg);
    }, s * 1000 + 200);
  }

  function finish() {
    fadeOutAndStop("Session complete: " + Math.round(A.track.minutes) + " min of " + A.track.name + ".", A.track.fade || FADE_OUT);
    if (A.track.brk) ntAfterWork();                 // a block of work done: a Restoration Break to offer (nature.js)
  }

  /* The prime block has elapsed. Cue the user to begin, then do whatever they
     chose for the working phase. The cue is the point of the whole mode. */
  function enterTask() {
    var mode = (A.track.then && A.track.then.mode) || "silence";
    A.phase = "task";
    paintCache = {};

    if (mode === "silence") {
      showCue("Prime complete \u2014 start now.");
      fadeOutAndStop("Prime complete. Audio off \u2014 you carry the priming effect into the task.");
      return;
    }

    showCue("Prime complete \u2014 start now.");
    clearTimeout(A.endTimer);

    if (mode === "noise") {
      startNoise();
      $("#noise").checked = true;
      fadeOutVoicesOnly(4);
      A.voicesOff = true;
      $("#pSub").textContent = "Task phase \u00b7 pink noise only";
      setStatus("Task phase: beats have faded out, pink noise continues. Stop when you finish.");
    } else {
      A.gainMul = 0.45;
      var t = A.ctx.currentTime;
      A.master.gain.cancelScheduledValues(t);
      A.master.gain.setValueAtTime(A.master.gain.value, t);
      A.master.gain.linearRampToValueAtTime(volGain(), t + 6);
      $("#pSub").textContent = "Task phase \u00b7 " + A.track.beat.toFixed(1) +
        " Hz \u00b7 " + A.track.carrier + " Hz carrier \u00b7 reduced volume";
      setStatus("Task phase: beats continue at reduced volume. Stop when you finish.");
    }
    msSync();                                       // the working phase has no end to count down to
  }

  function scheduleEnd() {
    clearTimeout(A.endTimer);
    if (A.phase === "task") return;                 // working phase runs open-ended
    if (A.phase !== "prime" && aOpen(A.track)) return;
    var total = A.track.minutes * 60;
    if (A.phase === "prime") {
      A.endTimer = setTimeout(enterTask, Math.max(0, (total - A.elapsed) * 1000));
      return;
    }
    var left = total - A.elapsed - (A.track.fade || FADE_OUT);
    A.endTimer = setTimeout(finish, Math.max(0, left * 1000));
  }

  function showCue(msg) {
    var c = $("#cue");
    c.textContent = msg;
    c.hidden = false;
    clearTimeout(A.cueTimer);
    A.cueTimer = setTimeout(function () { c.hidden = true; }, 25000);
  }
  function hideCue() { clearTimeout(A.cueTimer); $("#cue").hidden = true; }

  /* The clock ticks once a second and the ramp display moves slower still, so the player
     updates once a second, just after the second turns, and skips the drawing while the page
     is hidden. A track can run for an hour with the screen on; this keeps it nearly free. */
  function loop() {
    clearTimeout(A.clock);
    if (!A.playing) return;
    A.elapsed = A.ctx.currentTime - A.startedAt;
    if (!document.hidden) paint();
    A.clock = setTimeout(loop, 1020 - (A.elapsed * 1000) % 1000);
  }

  /* ----------------------------- display ----------------------------- */

  var CIRC = 2 * Math.PI * 28;

  var paintCache = {};
  function setText(sel, val) {
    if (paintCache[sel] === val) return;
    paintCache[sel] = val;
    $(sel).textContent = val;
  }

  function paint() {
    if (!A.track) return;
    var t = A.track, total = t.minutes * 60;
    var countUp = A.phase === "task" || aOpen(t);
    var beat = beatAt(t, A.elapsed);

    // the ears: binaural, left and right; monaural, the low and the high tone, both in each ear; isochronic, the one tone and its pulse
    var m = A.mode, iso = m === "isochronic";
    if (paintCache.iso !== iso) { paintCache.iso = iso; $("#pEarR").hidden = iso; }
    if (paintCache.bin !== m) { paintCache.bin = m; $("#scOpen").hidden = m !== "binaural"; }    // the headphone check matters only for binaural
    if (t.sleep) {                                   // Sleep sounds: the sound, and how far it has faded
      setText("#pLk", "Sound"); setText("#pL", t.band);
      setText("#pRk", "Level"); setText("#pR", Math.round(100 * slpLevel(A.elapsed / (total || 1))) + "%");
    } else {
      setText("#pLk", m === "binaural" ? "L" : m === "monaural" ? "Low" : "Tone");
      setText("#pRk", m === "binaural" ? "R" : "High");
      setText("#pBk", iso ? "pulse" : "beat");
      setText("#pL", t.carrier.toFixed(0) + " Hz");
      setText("#pR", (t.carrier + beat).toFixed(1) + " Hz");
      setText("#pBeat", beat.toFixed(1) + " Hz");
    }
    slpNight();

    var off;
    if (countUp) {
      setText("#time", fmt(A.elapsed));
      off = CIRC * (1 - (A.elapsed % 60) / 60);
    } else {
      setText("#time", fmt(Math.max(0, total - A.elapsed)));
      off = CIRC * (1 - (total > 0 ? Math.min(1, A.elapsed / total) : 0));
    }
    if (paintCache.ring !== off) { paintCache.ring = off; $("#ring").style.strokeDashoffset = off; }
  }

  function setStatus(msg) { $("#status").textContent = msg; }
  // open-ended: the player's switch, for a track of its own; a practice keeps its clock, and Sleep sounds always ends
  function aOpen(t) { return !!t && $("#openEnded").checked && !t.practice && !t.sleep; }

  // a track started, paused or stopped: the screen lock, its page and the lock screen follow
  function playSync() {
    wlKick();
    trSync();
    slpSync();                           // the Sleep sounds page
    msSync();
    micBeatGuard();                      // a beat while a Bluetooth microphone listens: the phone's own instead
  }

  /* ----- the mini player's own controls ----- */
  function playerInit() {
    var v = store.get("vol");
    if (v !== null) $("#vol").value = v;
    $("#toggle").addEventListener("click", function () {
      if (!A.track) return;
      if (A.playing) pause(); else play();
    });
    $("#stop").addEventListener("click", function () {
      var work = A.phase === "task" && A.track && !A.track.practice;     // the custom primer's working phase, ended by you
      hardStop(false);
      if (work) ntAfterWork();                      // a Restoration Break to offer (nature.js)
    });

    $("#vol").addEventListener("input", function () {
      if (A.ctx && A.playing) {
        var t = A.ctx.currentTime;
        A.master.gain.cancelScheduledValues(t);
        A.master.gain.setValueAtTime(A.master.gain.value, t);
        A.master.gain.linearRampToValueAtTime(volGain(), t + 0.12);
      }
      store.set("vol", $("#vol").value);
    });

    $("#noise").addEventListener("change", function () {
      if (A.track && A.track.notch) return;   // that noise is the therapy, not a bed
      if (!A.playing) return;
      if (this.checked) startNoise(); else stopNoise();
    });

    $("#openEnded").addEventListener("change", function () {
      if (A.playing) scheduleEnd();
      paint();
      msSync();
      setStatus(this.checked && !(A.track && A.track.sleep)
        ? "Open-ended: the session will keep running until you stop it."
        : "Timer active: " + (A.track ? A.track.minutes + " min." : ""));
    });

    document.addEventListener("keydown", function (e) {
      if (e.code !== "Space" || !A.track) return;
      if (!$("#scModal").hidden || !$("#pmModal").hidden) return;
      if ($("#bStage").classList.contains("focus")) return;   // focus view: Space drives the breathing guide
      if (kbSkip(e)) return;
      if (pBusy() && (curView === "session" || pTrack())) return;
      e.preventDefault();
      if (A.playing) pause(); else play();
    });
  }
