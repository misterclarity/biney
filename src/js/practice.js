
  /* ------------------------- guided practices: engine -------------------------
     One clock (performance.now) drives a list of steps. Breath steps borrow the
     breathing guide's engine (B): timings go into BC, glides become "pending"
     edits that land on the next breath, and the guide's own visuals are drawn
     onto the session canvas by swapping its drawing context. So heart-rate
     swing, coherence and cue sounds behave exactly as they do in Breathe.
     A program's binaural layer is an ordinary track (load/play/pause) whose
     beat follows piecewise points; skipping a step seeks it to the new time.
  ------------------------------------------------------------------------------ */

  var P = {
    def: null, view: null, len: 0, steps: [], total: 0, state: "idle",   // idle | intro | running | paused | done
    t0: 0, st: 0, idx: -1, li: 0, tick: 0, raf: 0,
    hr: [], coh: [], sw: [], wander: 0, taps: 0, usesB: false, saved: null,
    audioOn: false, audioHeld: false, bus: null, pumpNext: 0, wordAt: -1, used: {}, pmr: "",
    internal: false, endArm: 0, lineAt: 0, cv: null, ctx: null, cw: 0, ch: 0, col: {}, holds: [], holdRec: -1,
    mv: null, hasRhy: false, suds: [], sudsBy: {}, rated: -1, tapAt: "", tickNext: 0, nvc: null, resume: null, draftLive: false, draftT: 0, drawAt: 0,
    opt: { voice: true, bells: true, cues: "tones", buzz: false, visual: "circle", audio: true, voiceName: "", ana: 180, rhythm: true, tapTick: false, nvcSave: true },
    paceK: 1, beatAdj: 0, beatOff: false, runLen: 0, base: 0, rsArm: 0     // changes made while it runs, and what a restart needs
  };
  var B_KEYS = ["inh", "sip", "hold", "exh", "rest"];

  function pBusy() { return P.state === "running" || P.state === "paused"; }
  function pT() { return P.state === "running" ? bNow() - P.t0 : P.st; }
  function pDef(id) {
    for (var i = 0; i < PRACTICES.length; i++) if (PRACTICES[i].id === id) return PRACTICES[i];
    if (id && id.indexOf("my-") === 0) { var q = yGet(id.slice(3)); if (q) return yDef(q); }
    return null;
  }
  function pVar(d) {
    if (!d.variant) return undefined;
    var v = parseInt(store.get("pVar." + d.id), 10);
    return d.variant.opts.some(function (o) { return o[0] === v; }) ? v : d.variant.def;
  }
  function pLenTxt(d, m) { return d.lenFmt ? d.lenFmt(m) : d.lenUnit ? m + " " + d.lenUnit + (m === 1 ? "" : "s") : m + " min"; }
  function pResRate() { return (H.find && H.find.best) ? H.find.best : 5.5; }

  /* ----- a practice's own choices, kept for it: a position (d.choices), which binaural beat
     (d.beats) and the pace of its even breathing (d.pace) ----- */
  function pChoices(id) {
    try { var v = JSON.parse(store.get("pCh." + id) || "null"); return v && typeof v === "object" ? v : {}; } catch (e) { return {}; }
  }
  function pChoiceSet(d, k, v) { var o = pChoices(d.id); o[k] = v; store.set("pCh." + d.id, JSON.stringify(o)); }
  function pChoice(d, key) {
    var c = (d.choices || []).filter(function (x) { return x.key === key; })[0];
    if (!c) return undefined;
    var v = pChoices(d.id)[key];
    return c.opts.some(function (o) { return o[0] === v; }) ? v : c.def;
  }
  function pBeat(d) {
    var v = pChoices(d.id).beat;
    return d.beats.filter(function (b) { return b.id === v; })[0] || d.beats[0];
  }
  // the binaural layer as it will play: the practice's own, or the beat chosen for it
  function pAudio(d) {
    if (!d.audio || !d.beats) return d.audio;
    var b = pBeat(d);
    return ext(ext({}, d.audio), { band: b.band, pts: b.pts });
  }
  var P_PACE = { inh: [2, 10], exh: [2, 12] };     // seconds, in half-second steps
  // even breathing at your resonance rate (from the test, or 5.5 a minute), or an in and out of your own
  function pPace(d) {
    var r = pResRate(), half = Math.round(30 / r * 10) / 10, c = pChoices(d.id);
    if (!d.pace || c.pace !== "own") return { own: false, inh: half, exh: half, rate: r };
    var get = function (k) {
      var v = Math.round(parseFloat(c[k]) * 2) / 2, lim = P_PACE[k];
      return isFinite(v) ? Math.max(lim[0], Math.min(lim[1], v)) : Math.max(lim[0], Math.min(lim[1], Math.round(half * 2) / 2));
    };
    var inh = get("inh"), exh = get("exh");
    return { own: true, inh: inh, exh: exh, rate: Math.round(600 / (inh + exh)) / 10 };
  }
  function pSecs(v) { return (v % 1 ? v.toFixed(1) : String(v)) + " s"; }
  function pLenOf(d, len) {
    if (!d.lengths) return 0;
    return d.lengths.indexOf(len) >= 0 ? len : d.lengths.indexOf(d.min) >= 0 ? d.min : d.lengths[0];
  }
  function pPlan(d, len) {
    var steps = d.build(len, pVar(d)), at = 0;
    steps.forEach(function (s) { s.at = at; at += s.secs; });
    if (d.method === "program" && P.opt.ana) pAna(d, steps, at, P.opt.ana);
    var base = at;                                   // a program's sound covers the practice, not the tapping after it
    if (tapOn(d)) tapShort().forEach(function (s) { s.at = at; at += s.secs; s.extra = true; steps.push(s); });
    return { steps: steps, total: at, base: base };
  }

  /* Anapana reminders for the programs: every few minutes, a quiet prompt to observe the breath
     at the nostrils, worded for paced, natural or heart-focused breathing. They skip steps that
     guide attention elsewhere (body regions, the sleep drift) and never crowd another line. */
  var ANA = {
    paced: ["Keep a little attention at the nostrils: cool air coming in, warmer air going out.",
      "Observe the touch of the breath just below the nostrils as you follow the pace.",
      "If the mind has wandered, come back to the breath at the nostrils, and the next breath in.",
      "Observe exactly where the air touches as it enters. Stay with this one breath."],
    natural: ["Bring your attention to the small area below the nostrils, and observe the touch of the breath there.",
      "If the mind has wandered, notice where it went, and come back to the breath at the nostrils.",
      "Breathe naturally, and observe the touch of the breath at the nostrils, in and out.",
      "Observe this breath: long or short, through the left nostril, the right, or both."],
    sigh: ["Observe the cool touch of the air at the nostrils on each in-breath.",
      "If the mind has wandered, come back to the in-breath at the nostrils."],
    heart: ["Observe the touch of one breath at the nostrils, then let your attention settle back at the heart.",
      "If the mind has wandered, observe one breath at the nostrils, then return to the heart area."]
  };
  function pAna(d, steps, total, every) {
    var n = 0, shifts = [0, 10, -10, 20, -20, 30, -30, 45, -45, 60, -60];
    var ok = function (s, st) {
      if (!s || s.k === "drift" || s.k === "shuffle" || s.quiet) return false;
      if (["breath", "observe", "guide"].indexOf(s.k) < 0) return false;
      if (s.k === "guide" && s.body && s.body.indexOf("all") < 0 && s.body.indexOf("belly") < 0) return false;
      if (st < 12 || s.secs - st < 8) return false;
      return !s.lines.some(function (l) { return Math.abs(l[0] - st) < 12; });
    };
    for (var t = every; t < total - 20; t += every) {
      for (var k = 0; k < shifts.length; k++) {      // slide to the nearest quiet moment, up to a minute away
        var tt = t + shifts[k], s = null;
        for (var i = steps.length - 1; i >= 0; i--) if (tt >= steps[i].at) { s = steps[i]; break; }
        if (!s || !ok(s, tt - s.at)) continue;
        var pool = d.anaStyle === "heart" ? ANA.heart : s.k === "breath" ? (s.t.sip ? ANA.sigh : ANA.paced) : ANA.natural;
        s.lines.push([tt - s.at, pool[n++ % pool.length], "ana"]);
        s.lines.sort(function (a, b) { return a[0] - b[0]; });
        break;
      }
    }
  }

  function pMinutes(d, len) { return Math.max(1, Math.round(pPlan(d, pLenOf(d, len)).total / 60)); }
  /* ----- options: defaults for every practice (in Settings), and each practice's own changes on top.
     Voice choice and keeping reflections are the same everywhere; the rest a practice can set for itself. ----- */
  var P_OPT0 = JSON.parse(JSON.stringify(P.opt));
  var P_OWN = ["voice", "bells", "audio", "rhythm", "tapTick", "ana", "cues", "buzz", "visual"];
  function pOptDefaults() {
    var o = JSON.parse(JSON.stringify(P_OPT0));
    try {
      var g = JSON.parse(store.get("pOpt") || "null");
      if (g && typeof g === "object") for (var k in o) if (typeof g[k] === typeof o[k]) o[k] = g[k];
    } catch (e) {}
    return o;
  }
  function pOptOwn(id) {
    try { var v = JSON.parse(store.get("pOpt." + id) || "null"); return v && typeof v === "object" ? v : {}; } catch (e) { return {}; }
  }
  function pOptsOf(id) {
    var o = pOptDefaults(), own = pOptOwn(id);
    P_OWN.forEach(function (k) { if (k in own && typeof own[k] === typeof o[k]) o[k] = own[k]; });
    return o;
  }
  // what differs from the defaults is kept for this practice; voice choice and keeping reflections go to the defaults
  function pOptSave(id, o) {
    var g = pOptDefaults(), own = {}, n = 0;
    P_OWN.forEach(function (k) { if (o[k] !== g[k]) { own[k] = o[k]; n++; } });
    for (var k in g) if (P_OWN.indexOf(k) < 0) g[k] = o[k];
    store.set("pOpt", JSON.stringify(g));
    if (n) store.set("pOpt." + id, JSON.stringify(own)); else storeDel("pOpt." + id);
  }
  function pOptMakeDefault(id, o) {
    var g = pOptDefaults();
    P_OWN.forEach(function (k) { g[k] = o[k]; });
    store.set("pOpt", JSON.stringify(g));
    storeDel("pOpt." + id);
  }
  function pSaveOpt() { if (P.optFor) pOptSave(P.optFor, P.opt); else store.set("pOpt", JSON.stringify(P.opt)); }
  // the options an intro shows and edits: the running practice's own stay as they are
  function pIntroOpts(d) {
    if (pBusy() && P.def !== d) return pOptsOf(d.id);
    P.opt = pOptsOf(d.id); P.optFor = d.id;
    return P.opt;
  }
  function pColor(d) { return "var(--" + (d.tone || "relax") + ")"; }

  /* ----- sound: a bell bus of its own, and the pump tick ----- */
  function pBusOn() {
    if (!ensureCtx()) return false;
    if (!P.bus) { P.bus = A.ctx.createGain(); P.bus.gain.value = 0.55; P.bus.connect(A.ctx.destination); }
    return true;
  }
  function pBell(peak, when, hz, out, always) {        // out: a node of its own instead of the bell bus; always: even with bells off
    if ((!P.opt.bells && !always) || !pBusOn()) return;
    var ctx = A.ctx, t = when || ctx.currentTime + 0.04, f = hz || 392;
    [[1, 1, 6.5], [2.76, 0.32, 2.4], [5.4, 0.1, 1.1], [0.5, 0.22, 5]].forEach(function (p) {
      var o = ctx.createOscillator(), g = ctx.createGain();
      o.type = "sine"; o.frequency.value = f * p[0];
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(peak * p[1] * 0.3, t + 0.015);
      g.gain.exponentialRampToValueAtTime(0.0001, t + p[2]);
      o.connect(g); g.connect(out || P.bus);
      o.start(t); o.stop(t + p[2] + 0.1);
      o.onended = function () { try { o.disconnect(); g.disconnect(); } catch (e) {} };
    });
  }
  function pClick(when, peak) {
    if (!pBusOn()) return;
    var ctx = A.ctx, o = ctx.createOscillator(), g = ctx.createGain();
    o.type = "triangle"; o.frequency.setValueAtTime(1250, when); o.frequency.exponentialRampToValueAtTime(600, when + 0.06);
    g.gain.setValueAtTime(0, when); g.gain.linearRampToValueAtTime(peak || 0.16, when + 0.004);
    g.gain.exponentialRampToValueAtTime(0.0001, when + 0.09);
    o.connect(g); g.connect(P.bus); o.start(when); o.stop(when + 0.12);
    o.onended = function () { try { o.disconnect(); g.disconnect(); } catch (e) {} };
  }

  /* ----- voice: the device's own text-to-speech, captions always shown ----- */
  function pVoices() {
    if (!window.speechSynthesis) return [];
    var all = [];
    try { all = speechSynthesis.getVoices() || []; } catch (e) {}
    return all.filter(function (v) { return /^en/i.test(v.lang); })
      .sort(function (a, b) { return (b.localService ? 1 : 0) - (a.localService ? 1 : 0); });
  }
  function pVoice() {
    var vs = pVoices();
    for (var i = 0; i < vs.length; i++) if (vs[i].name === P.opt.voiceName) return vs[i];
    return vs[0] || null;
  }
  function pSay(text, soft) {
    if (!P.opt.voice || !window.speechSynthesis || !window.SpeechSynthesisUtterance) return;
    try {
      var u = new SpeechSynthesisUtterance(text), v = pVoice();
      if (v) { u.voice = v; u.lang = v.lang; } else u.lang = "en-US";
      u.rate = soft ? 0.82 : 0.9; u.pitch = 1; u.volume = soft ? 0.7 : 1;
      speechSynthesis.speak(u);
    } catch (e) {}
  }
  function pHush() { try { if (window.speechSynthesis) speechSynthesis.cancel(); } catch (e) {} }

  /* ----- the screen stays on, at full brightness, through every session ----- */
  // One lock for practices, the breathing guide and tracks. It's held while any of them runs, and
  // for ten minutes after a pause, so the screen is still lit when you come back to it. The browser drops
  // the lock whenever the page is hidden, so it's asked for again on return; a check every 15 seconds
  // also catches a lock the system took back, and the end of a pause's ten minutes.
  var WL = { lock: null, asking: false, stop: 0, told: false, failAt: 0 };
  var WL_GRACE = 600000;
  function wlNeed() {
    var ses = ST.screenSessions, trk = ST.screenTracks;
    if ((ses && (P.state === "running" || B.state === "running")) || (trk && A.playing)) { WL.stop = 0; return true; }
    if (!WL.stop) WL.stop = Date.now();               // the moment the last session paused or ended
    var paused = (ses && (P.state === "paused" || B.state === "paused")) || (trk && !!A.track && A.elapsed > 0);
    return paused && Date.now() - WL.stop < WL_GRACE;
  }
  function wlSync() {
    if (!wlNeed()) { wlDrop(); return; }
    if (WL.lock || WL.asking || document.hidden) return;
    if (!navigator.wakeLock || !navigator.wakeLock.request) { wlTell(false); return; }
    if (WL.failAt && Date.now() - WL.failAt < 60000) return;   // turned down a moment ago: ask again in a minute
    WL.asking = true;
    var q;
    try { q = navigator.wakeLock.request("screen"); } catch (e) { q = Promise.reject(e); }
    q.then(function (l) {
      WL.asking = false; WL.failAt = 0;
      if (!wlNeed()) { wlFree(l); return; }
      WL.lock = l;
      l.addEventListener("release", function () {     // taken back by the system: ask again while it's still needed
        if (WL.lock === l) { WL.lock = null; setTimeout(wlSync, 1000); }
      });
    }, function () {
      WL.asking = false; WL.failAt = Date.now();
      if (!document.hidden) wlTell(true);
    });
  }
  function wlFree(l) { try { var q = l.release(); if (q && q.catch) q.catch(function () {}); } catch (e) {} }
  function wlDrop() { var l = WL.lock; WL.lock = null; if (l) wlFree(l); }
  function wlTell(refused) {
    if (WL.told) return;
    WL.told = true;
    toast(refused ? "The browser declined to keep the screen on, so for this session set a longer screen timeout in your device's display settings."
      : "This browser can't keep the screen on by itself, so for long sessions set a longer screen timeout in your device's display settings.", { ms: 10000, over: true });
  }
  function wlKick() { setTimeout(wlSync, 0); }       // once the caller has finished changing state
  function pLock() { wlKick(); }
  function pUnlock() { wlKick(); }

  /* ----- breath steps run on the breathing guide's engine ----- */
  // a breath step's timings at a moment in it, slowed or sped up by any change made while it runs (P.paceK)
  function pCfgAt(s, st) {
    var c = {}, f = s.to ? Math.min(1, Math.max(0, st / (s.glide || s.secs))) : 0, K = pBusy() ? P.paceK || 1 : 1;
    B_KEYS.forEach(function (k) {
      var a = s.t[k] || 0, b = s.to ? (s.to[k] || 0) : a;
      c[k] = Math.round((a + (b - a) * f) * K * 10) / 10;
    });
    return c;
  }
  function pBreathOn(s, st) {
    if (!P.saved) {
      P.saved = {};
      ["inh", "sip", "hold", "exh", "rest", "minutes", "sound", "cue", "buzz", "visual"].forEach(function (k) { P.saved[k] = BC[k]; });
    }
    var c = pCfgAt(s, st || 0);
    B_KEYS.forEach(function (k) { BC[k] = c[k]; });
    BC.minutes = 0;
    BC.visual = P.opt.visual;
    var snd = P.opt.cues;
    if (BC.sound !== snd && B.state === "running") { BC.sound = snd; cueOff(); if (snd !== "off") cueOn(); }
    BC.sound = snd;
    BC.cue = s.cueFade ? Math.round(40 * s.cueFade[0]) : 40;
    BC.buzz = !!P.opt.buzz;
    P.usesB = true;
    var ph = buildPhases(BC);
    if (B.state === "running" || B.state === "paused") {
      var bt = breathTime();
      if (bt < 0) { B.ph = ph; B.pending = null; }
      else { normalize(bt); B.pending = ph.sig === B.ph.sig ? null : ph; }
      planTotal();
    } else {
      if (B.finder) finderCancel();
      B.state = "idle";
      bFresh();
      if (P.state === "running") bResume();
      else { B.state = "paused"; B.st = 0; syncTransport(); }
    }
    if (B.bus && A.ctx) B.bus.gain.setTargetAtTime(cueGain(), A.ctx.currentTime, 0.1);
    pLockBreathe();
  }
  function pBreathOff() {
    if (B.state === "idle") return;
    var bt = breathTime();
    if (bt >= 0) hrFinalize(locate(bt).count);
    P.sw = P.sw.concat(B.swings);
    P.internal = true;
    bStop();
    P.internal = false;
    pRestore();                          // hand the guide back with your own settings
  }
  function pRestore() {
    var s = P.saved;
    P.usesB = false;
    if (!s) return;
    P.saved = null;
    for (var k in s) BC[k] = s[k];
    B.state = "idle";
    applyTimings();
    syncFields(); syncRate(); renderNote(); syncVisHint();
    checkRadio("bvis", BC.visual); syncChips("#bVis");
    $("#bCue").value = BC.cue;
    bBuzzSync();
    pLockBreathe();
  }
  function pBreathTick(s, st) {
    if (B.state === "idle" && P.state === "running") { pBreathOn(s, st); return; }   // something stopped it: pick up again
    if (B.state !== "running") return;
    var bt = breathTime();
    if (s.to && bt >= 0) {
      var c = pCfgAt(s, st), ph = buildPhases(c);
      if (ph.sig !== (B.pending || B.ph).sig) {
        B_KEYS.forEach(function (k) { BC[k] = c[k]; });
        normalize(bt);
        B.pending = ph.sig === B.ph.sig ? null : ph;
      }
    }
    if (s.cueFade && B.bus && A.ctx) {
      var f = Math.min(1, st / s.secs), v = s.cueFade[0] + (s.cueFade[1] - s.cueFade[0]) * f;
      var cue = Math.round(40 * v);
      if (cue !== BC.cue) { BC.cue = cue; B.bus.gain.setTargetAtTime(cueGain(), A.ctx.currentTime, 0.6); }
    }
  }
  /* Phase words for the caption, including the two guided variants. */
  function pBreathWords(s) {
    var S = frameState();
    if (!S.live) return { cap: "Get ready", sub: "" };
    if (S.lead) return { cap: "Get ready", sub: "First breath in " + S.count + "…" };
    var k = S.k, L = S.L, cap = (s.labels && s.labels[k]) || B_KIND[k].name, sub = (s.hints && s.hints[k]) || kindHint(k);
    if (s.mode === "nadi" && (k === "in" || k === "out")) {
      var odd = L.count % 2 === 1, side = k === "in" ? (odd ? "right" : "left") : (odd ? "left" : "right");
      cap = (k === "in" ? "In through the " : "Out through the ") + side;
      sub = k === "in" ? "The other nostril closed." : "Switch: close the other side.";
      P.nose = side;
    } else P.nose = null;
    if (s.mode === "dirga") {
      var parts = ["belly", "ribs", "chest"], i = Math.min(2, Math.floor(S.prog * 3));
      if (k === "in") { cap = "Fill the " + parts[i]; sub = "Belly, then ribs, then chest."; }
      if (k === "out") { cap = "Empty the " + parts[2 - i]; sub = "Chest, then ribs, then belly."; }
    }
    if (s.count) sub = "Breath " + Math.min(s.count, L.count + 1) + " of " + s.count;
    return { cap: cap, sub: sub, n: S.count };
  }

  /* ----- the program's binaural layer ----- */
  function pTrack() { return A.track && A.track.practice && A.track.pid === (P.def && P.def.id) ? A.track : null; }
  function aSeek(sec) {
    if (!A.track) return;
    var was = A.playing;
    if (was) { A.gen++; teardownVoices(0.25); stopNoise(); A.playing = false; clearTimeout(A.endTimer); cancelAnimationFrame(A.raf); }
    A.elapsed = Math.max(0, Math.min(sec, A.track.minutes * 60 - 1));
    if (was) play(); else paint();
  }
  function pAudioSync(T) {
    var tr = pTrack();
    if (!tr || !A.playing || !A.ctx) return;
    if (Math.abs((A.ctx.currentTime - A.startedAt) - T) > 4) aSeek(T);
  }

  /* ----- changes while it runs: the breathing pace, from the next breath, and the beat, which glides there ----- */
  // the practice's beat as a track, moved up or down by any change made while it runs (P.beatAdj)
  function pBeatTrack(d) {
    var a = pAudio(d), adj = P.beatAdj || 0, pts = a.dyn ? null : a.pts.map(function (p) { return [p[0], p[1] + adj]; });
    return { id: "prac-" + d.id, pid: d.id, practice: true, cat: a.cat, band: adj && pts ? pBandTxt(pts) : a.band, name: a.name, carrier: a.carrier,
      beat: a.dyn ? a.start : pts[pts.length - 1][1], pts: pts, dyn: !!a.dyn, cur: a.start || 0,
      minutes: P.base / 60, fade: a.fade, strength: 0, desc: "", ev: "", cite: "" };
  }
  function pBandTxt(pts) {
    var a = bandFor(pts[0][1]).name, b = bandFor(pts[pts.length - 1][1]).name;
    return a === b ? a : a + " → " + b;
  }
  function pTrackT() { return A.playing && A.ctx ? A.ctx.currentTime - A.startedAt : A.elapsed; }
  function pBeatable() { var d = P.def; return !!(d && d.audio && !d.audio.dyn); }
  // the breath step on now, or failing that the next one
  function pBrNow() {
    var s = P.steps[P.idx];
    if (s && s.k === "breath") return { s: s, st: pT() - s.at };
    for (var i = P.idx + 1; i < P.steps.length; i++) if (P.steps[i].k === "breath") return { s: P.steps[i], st: 0 };
    return null;
  }
  function pBrRate(b) { return 60 / cycleOf(pCfgAt(b.s, b.st)); }
  // as fast as twice the practice's own pace, except fast breathing (over 12 a minute, like Wim Hof's
  // power breaths), which goes no faster than it was made to
  function pPaceMin(b) { return pBrRate(b) * P.paceK > 12 ? 1 : 0.5; }
  function pAttr(el, k, v) { if (el && el.getAttribute(k) !== v) el.setAttribute(k, v); }    // every tick: only what changed
  function pPaceStep(dir) {
    var b = pBrNow();
    if (!b || !pBusy()) return;
    var r = pBrRate(b), step = r < 12 ? 0.5 : 2, to = Math.round((r + dir * step) / step) * step;
    var K = Math.max(pPaceMin(b), Math.min(2, P.paceK * r / Math.max(step, to)));
    if (Math.abs(K - P.paceK) < 1e-6) return;
    P.paceK = K;
    var s = P.steps[P.idx];
    if (s && s.k === "breath" && P.usesB && (B.state === "running" || B.state === "paused")) {    // from the next breath, as a change on Breathe does
      var c = pCfgAt(s, pT() - s.at), ph = buildPhases(c), bt = breathTime();
      B_KEYS.forEach(function (k) { BC[k] = c[k]; });
      if (bt < 0) { B.ph = ph; B.pending = null; }
      else { normalize(bt); B.pending = ph.sig === B.ph.sig ? null : ph; }
    }
    // said on screen, since the guidance may name the pace it started with
    bSetT("#sLine", (dir < 0 ? "Slower: " : "Faster: ") + pBrRate(b).toFixed(1) + " breaths a minute" + (s && s.k === "breath" ? ", from the next breath." : ", from the next breathing step."));
    pAdjUI();
  }
  function pBeatStep(dir) {
    var tr = pTrack();
    if (!tr || !P.audioOn || !pBeatable()) return;
    var cur = beatAt(tr, pTrackT()), step = cur < 4 || (cur < 4.01 && dir < 0) ? 0.5 : 1;
    var base = pAudio(P.def).pts, lo = Math.min.apply(null, base.map(function (p) { return p[1]; })), hi = Math.max.apply(null, base.map(function (p) { return p[1]; }));
    var adj = Math.max(0.5 - lo, Math.min(40 - hi, P.beatAdj + dir * step));       // the whole schedule stays between 0.5 and 40 Hz
    if (Math.abs(adj - P.beatAdj) < 1e-6) return;
    P.beatAdj = Math.round(adj * 10) / 10;
    var nt = pBeatTrack(P.def);
    tr.pts = nt.pts; tr.beat = nt.beat; tr.band = nt.band;
    if (A.playing && A.oscR && A.ctx) {             // glide to the new schedule over a second and a half
      var now = A.ctx.currentTime, T = now - A.startedAt, f = A.oscR.frequency;
      if (f.cancelAndHoldAtTime) f.cancelAndHoldAtTime(now); else { f.cancelScheduledValues(now); f.setValueAtTime(f.value, now); }
      f.linearRampToValueAtTime(tr.carrier + beatAt(tr, T + 1.5), now + 1.5);
      tr.pts.forEach(function (p) { if (p[0] > T + 1.5) f.linearRampToValueAtTime(tr.carrier + p[1], now + (p[0] - T)); });
    }
    $("#pSub").textContent = trackSub(tr);
    bSetT("#sLine", "The beat moves to " + beatAt(tr, pTrackT() + 1.5).toFixed(1) + " Hz, " + bandFor(beatAt(tr, pTrackT() + 1.5)).name.toLowerCase() + ".");
    P.chipsHtml = null;
    pAdjUI();
  }
  // the beat off for the rest of the session (it fades), or on again from where the practice is
  function pBeatToggle() {
    var d = P.def;
    if (!pBusy() || !pBeatable()) return;
    if (P.audioOn) {
      P.audioOn = false; P.audioHeld = false; P.beatOff = true;
      var tr = pTrack();
      if (tr && A.playing) {
        fadeOutAndStop("", 1);
        setTimeout(function () { if (A.track === tr && !A.playing) $("#player").classList.remove("open", "expanded"); }, 1400);
      } else if (tr) { hardStop(true); $("#player").classList.remove("open", "expanded"); }      // paused: nothing to fade
    } else {
      gate(function () {
        if (!pBusy() || P.def !== d) return;
        P.audioOn = true; P.beatOff = false;
        load(pBeatTrack(d));
        aSeek(pT());
        if (P.state === "paused") { pause(); P.audioHeld = true; }
        pQuickSync(); P.chipsHtml = null; pUI();
      });
    }
    pQuickSync(); P.chipsHtml = null; pUI();
  }
  function pAdjUI() {
    var row = $("#sAdj");
    if (!row || !P.def) return;
    var b = pBusy() ? pBrNow() : null, beatable = pBeatable(), tr = pTrack(), on = beatable && P.audioOn && !!tr;
    if ($("#sAdjBr").hidden !== !b) $("#sAdjBr").hidden = !b;
    if (b) {
      var r = pBrRate(b);
      bSetT("#sAdjBrV", r.toFixed(1) + " /min");
      pAttr($("#sAdjBr [data-d='-1']"), "aria-disabled", P.paceK >= 2 - 1e-6 ? "true" : "false");
      pAttr($("#sAdjBr [data-d='1']"), "aria-disabled", P.paceK <= pPaceMin(b) + 1e-6 ? "true" : "false");
    }
    if ($("#sAdjBt").hidden !== !beatable) $("#sAdjBt").hidden = !beatable;
    if (beatable) {
      bSetT("#sAdjBtV", on ? beatAt(tr, pTrackT()).toFixed(1) + " Hz" : "Off");
      pAttr($("#sAdjBt [data-d='-1']"), "aria-disabled", on ? "false" : "true");
      pAttr($("#sAdjBt [data-d='1']"), "aria-disabled", on ? "false" : "true");
      pAttr($("#sAdjBtOn"), "aria-pressed", on ? "true" : "false");
      bSetT("#sAdjBtOnTxt", on ? "On" : "Off");
    }
    if (row.hidden !== (!b && !beatable)) row.hidden = !b && !beatable;
  }
  // start this practice again from the top, at the length it was started with
  function pRestart() {
    if (!pBusy() || !P.def) return;
    P.view = P.def; P.len = P.runLen;
    pStart(true);
    toast("Started again from the top.", { over: true, ms: 2500 });
  }

  /* ----- steps ----- */
  function pStepAt(T) {
    for (var i = P.steps.length - 1; i >= 0; i--) if (T >= P.steps[i].at - 1e-6) return i;
    return 0;
  }
  function pVis(s) {
    if (s.k === "breath") return "breath";
    if (s.k === "pose") return "pose";
    if (s.k === "pump") return "pump";
    if (s.k === "shuffle") return "word";
    if (s.k === "count") return "count";
    if (ST.sleepDim && pSleepyStep(s)) return s.k === "shuffle" ? "word" : "dark";   // dimmed for sleep (Settings)
    if (s.k === "drift") return "glow";
    if (s.k === "hold") return "hold";
    if (s.k === "guide" && s.pose) return "pose";
    if (s.k === "tap" || s.tapfig) return "tap";
    if (s.k === "rate") return "rate";
    if (s.k === "adapt") return "adapt";
    if (s.k === "write") return "write";
    if (s.k === "nap") return "glow";
    if (s.k === "wake") return "orb";
    if (s.k === "pmr" || s.body) return "body";
    if (s.k === "observe") return s.vis || "still";
    return s.vis || "orb";
  }
  function pEnter(i) {
    var prev = P.steps[P.idx], s = P.steps[i];
    P.idx = i; P.li = 0; P.taps = 0; P.countDone = false; P.pmr = ""; P.pumpNext = 0; P.wordAt = -1; P.nose = null; P.rated = -1;
    napWakeStop();                                   // wake-up chimes belong to their own step
    if (s.k === "wake") { NP.rung = 0; NP.vibs = 0; }
    if (s.mkLines) s.lines = s.mkLines();          // lines built from what you've written so far
    if (s.open && s.secs0 && s.secs < s.secs0) {     // back on an open step that ended early: it gets its full time again
      var add = s.secs0 - s.secs;
      s.secs = s.secs0;
      for (var j = i + 1; j < P.steps.length; j++) P.steps[j].at += add;
      P.total += add;
    }
    if (s.k === "breath") pBreathOn(s, pT() - s.at);
    else if (P.usesB && B.state !== "idle") pBreathOff();
    var flowing = s.k === "breath" && prev && prev.k === "breath";
    if (prev && !flowing && !s.quiet && !s.nobell && s.k !== "drift" && P.state === "running") pBell(0.45);
    $("#ses").dataset.dim = ST.sleepDim && pSleepyStep(s) ? "1" : "";
    pStage(s);
    pRenderSegs();
    pUI();
    if (P.def && P.def.reflect) nvcDraftSave(true);   // the step you're on is part of the draft
    pLoop();                                         // the canvas loop rests on static steps; wake it for this one
  }
  function pStage(s) {
    var vis = pVis(s), fig = $("#sFig");
    $("#sStage").dataset.vis = vis;
    fig.hidden = !(vis === "pose" || vis === "body" || vis === "tap" || vis === "face");
    P.tapAt = "";
    var a = vis === "pose" && ASANA[s.pose];
    P.mv = a && a.keys && s.k === "pose" ? { a: a, side: s.side, box: figBox(a, s.side), drawn: 0, ph: -1 } : null;
    if (vis === "pose") fig.innerHTML = !a ? "" : P.mv ? figMove(a, pMovePhase(a, s, pT()), s.side, "", P.mv.box) : figSVG(a.fig, s.side);
    else if (vis === "body") fig.innerHTML = pBodySVG(s.body || ["all"]);
    else if (vis === "face") fig.innerHTML = pFaceSVG(s.zone || 0);
    else if (vis === "tap") { fig.innerHTML = tapSVG(null, []); pTapPoint(s, pT() - s.at); }
    $("#sRate").hidden = vis !== "rate";
    var wr = $("#sWrite");
    wr.hidden = vis !== "write";
    $("#ses").dataset.write = vis === "write" ? "1" : "";
    if (vis === "write") { wr.innerHTML = nvcRender(s); wr.scrollTop = 0; nvcCheck(s); }
    if (vis === "rate") {                             // back on a rating you gave: it shows, and a new tap replaces it
      var rb = document.querySelectorAll("#sRateG button");
      for (var ri = 0; ri < rb.length; ri++) rb[ri].setAttribute("aria-pressed", String(P.sudsBy[P.idx] === +rb[ri].dataset.v));
    }
    fig.classList.toggle("next", !!s.trans);
    $("#sWord").hidden = vis !== "word";
    if (vis === "word") $("#sWord").textContent = "";
    $("#sNose").hidden = !(s.k === "breath" && s.mode === "nadi");
    $("#sDots").hidden = vis !== "count";
    if (vis === "count") pDots(s);
    var tap = $("#sTap");
    tap.hidden = !(s.k === "count" || (s.k === "observe" && s.wander) || (s.k === "hold" && s.open));
    P.tickNext = 0;
    if (s.k === "count") tap.textContent = "Found one";
    else if (s.k === "hold") tap.textContent = "Breathe in";
    else if (s.wander) tap.textContent = "Mind wandered";
    bSetT("#sLine", "");
    $("#sLine").classList.remove("ana");
    pSizeCanvas();
  }
  function pDots(s) {
    var h = "";
    for (var i = 0; i < s.n; i++) h += '<i class="' + (i < P.taps ? "on" : "") + '"></i>';
    $("#sDots").innerHTML = h;
  }

  function pTick() {
    if (P.state !== "running") return;
    var T = pT();
    if (T >= P.total) { pFinish(false); return; }
    var i = pStepAt(T);
    if (i !== P.idx) { pHoldLeave(T); pEnter(i); }
    var s = P.steps[P.idx], st = T - s.at;
    while (P.li < s.lines.length && s.lines[P.li][0] <= st + 0.05) {
      var ln = s.lines[P.li++];
      if (st - ln[0] < 8) { pSay(ln[1], s.quiet || ln[2] === "ana"); P.lineAt = bNow(); }
      bSetT("#sLine", ln[1]);
      $("#sLine").classList.toggle("ana", ln[2] === "ana");
    }
    pRhythm(s, T);
    if (s.k === "tap") { pTapPoint(s, st); pTapTick(s, st); }
    else if (s.k === "adapt") pAdaptTick(s, st, T);
    else if (s.k === "nap") pNapTick(s, st, T);
    else if (s.k === "wake") pWakeTick(s, st);
    if (s.k === "breath") pBreathTick(s, st);
    else if (s.k === "pump") pPumpTick(s, st);
    else if (s.k === "shuffle") pShuffleTick(s, st);
    else if (s.k === "pmr") pPmrTick(s, st);
    pAudioSync(T);
    pUI();
  }
  /* ----- moving figures and the berimbau -----
     A capoeira move's loop is counted in beats and starts on a bar line, so the figure
     keeps time with the berimbau (which is itself locked to the practice clock). */
  function pMovePhase(a, s, T) {
    if (a.beats) {
      var b = T / RHY.beat, b0 = Math.ceil(s.at / RHY.bar - 1e-6) * 2;
      return b < b0 ? 0 : ((b - b0) / a.beats) % 1;
    }
    return ((T - s.at) / (a.cycle || 4)) % 1;
  }
  function pMoveFig(s, T) {
    var m = P.mv;
    if (!m || bNow() - m.drawn < 0.04) return;
    m.drawn = bNow();
    var ph = pMovePhase(m.a, s, T);
    if (RM) {                                       // reduced motion: step from key to key instead of gliding
      var mv = movePrep(m.a), i = 0;
      while (i < mv.at.length - 2 && ph >= mv.at[i + 1]) i++;
      ph = mv.at[i];
    }
    if (Math.abs(ph - m.ph) < 1e-4) return;
    m.ph = ph;
    $("#sFig").innerHTML = figMove(m.a, ph, m.side, "", m.box);
  }
  function pRhythm(s, T) {
    var a = s && s.k === "pose" && ASANA[s.pose];
    if (a && a.rhythm && P.opt.rhythm && P.state === "running") rhyPlay(T);
    else if (RHY.on) rhyStop();
  }
  /* ----- tapping: which point is up, and an optional soft tick to tap along with ----- */
  function pTapIdx(s, st) { return s.pts.length === 1 ? 0 : Math.max(0, Math.min(s.pts.length - 1, Math.floor((st - (s.lead || 0)) / s.per))); }
  function pTapPoint(s, st) {
    if (s.k !== "tap") return;
    var i = pTapIdx(s, st), id = s.pts[i];
    if (id === P.tapAt) return;
    P.tapAt = id;
    $("#sFig").innerHTML = tapSVG(id, s.pts.length > 1 ? s.pts.slice(0, i) : []);
  }
  function pTapTick(s, st) {
    if (!P.opt.tapTick || !A.ctx || !pBusOn() || st < (s.lead || 2)) return;
    var horizon = st + (document.hidden ? 2 : 0.6), gap = 0.5;
    if (!P.tickNext) P.tickNext = Math.max(s.lead || 2, Math.ceil(st / gap) * gap);
    while (P.tickNext < Math.min(horizon, s.secs - 1)) {
      var inPt = s.pts.length === 1 || ((P.tickNext - (s.lead || 0)) % s.per) < s.per - 1.2;   // a pause while you move to the next point
      if (inPt && P.tickNext >= st - 0.05) pClick(A.ctx.currentTime + (P.tickNext - st), 0.06);
      P.tickNext += gap;
    }
  }
  function pRate(v) {
    var s = P.steps[P.idx];
    if (s && s.k === "rate" && P.state === "paused") pResume();   // answering carries on
    if (!s || s.k !== "rate" || P.state !== "running" || P.rated === P.idx) return;
    P.rated = P.idx;
    P.sudsBy[P.idx] = v;                             // one rating per step: a later tap replaces it, Skip clears it
    P.suds = Object.keys(P.sudsBy).map(Number).sort(function (a, b) { return a - b; })
      .map(function (k) { return P.sudsBy[k]; }).filter(function (x) { return x !== null; });
    var bs = document.querySelectorAll("#sRateG button");
    for (var i = 0; i < bs.length; i++) bs[i].setAttribute("aria-pressed", String(+bs[i].dataset.v === v));
    var idx = P.idx;
    setTimeout(function () { if (P.idx === idx && P.state === "running") pAdvance(); }, v === null ? 0 : 450);
  }
  function pPlanHasRhy(steps) { return steps.some(function (s) { return s.k === "pose" && ASANA[s.pose] && ASANA[s.pose].rhythm; }); }

  /* An open step (a breath hold, a rating, the nap) that ends early gives its unused time
     back to the plan, so the clock, the time left and the heart chart stay true. */
  function pAdvance() {
    var T = pT(), i = P.idx, s = P.steps[i];
    if (!s || i >= P.steps.length - 1) { pJump(1); return; }
    var cut = s.at + s.secs - T;
    pHoldLeave(T);
    if (cut > 0.05) {
      if (!s.secs0) s.secs0 = s.secs;
      s.secs -= cut;
      for (var j = i + 1; j < P.steps.length; j++) P.steps[j].at -= cut;
      P.total -= cut;
    }
    pHush();
    pEnter(i + 1);
    pUI();
  }
  /* An open hold that ends by time (the cap) or by skipping still counts. */
  function pHoldLeave(T) {
    var s = P.steps[P.idx];
    if (!s || s.k !== "hold" || !s.open || P.holdRec === P.idx) return;
    P.holdRec = P.idx;
    P.holds.push(Math.round(Math.min(s.secs, Math.max(0, T - s.at))));
  }
  function pPumpTick(s, st) {
    if (!A.ctx || !pBusOn()) return;
    var horizon = st + (document.hidden ? 2 : 0.6);
    while (P.pumpNext < s.n) {
      var tp = 3 + P.pumpNext / s.rate;
      if (tp > horizon) break;
      if (tp >= st - 0.05) pClick(A.ctx.currentTime + (tp - st));
      P.pumpNext++;
    }
  }
  function pShuffleTick(s, st) {
    var k = Math.floor((st - 1) / s.every);
    if (st < 1 || k === P.wordAt) return;
    P.wordAt = k;
    var pool = SHUFFLE_WORDS.filter(function (w) { return !P.used[w]; });
    if (!pool.length) { P.used = {}; pool = SHUFFLE_WORDS; }
    var w = pool[Math.floor(Math.random() * pool.length)];
    P.used[w] = 1;
    $("#sWord").textContent = w;
    pSay(w, true);
  }
  function pPmrTick(s, st) {
    var ph = st < s.tense ? "tense" : "release";
    if (ph === P.pmr) return;
    P.pmr = ph;
    var regs = document.querySelectorAll("#sFig [data-r]");
    for (var i = 0; i < regs.length; i++) regs[i].classList.toggle("tense", ph === "tense" && regs[i].classList.contains("on"));
    if (ph === "release" && P.state === "running") pBell(0.25, 0, 523.25);
  }

  /* ----- what's on screen ----- */
  function pUI() {
    if (!P.def || !P.steps.length) return;
    var T = Math.min(pT(), P.total), s = P.steps[P.idx] || P.steps[0], st = T - s.at, cap = s.title, sub = "";
    if (s.k === "breath") {
      var w = pBreathWords(s); cap = w.cap; sub = w.sub;
    } else if (s.k === "pose") {
      var asa = ASANA[s.pose];
      sub = asa && asa.move ? asa.sa + " · " + (asa.rhythm ? (P.opt.rhythm ? "with the berimbau" : "in your own rhythm") : "keep it flowing")
        : (asa ? asa.sa + " · " : "") + "about " + Math.max(1, Math.round((s.secs - 4) / 11)) + " slow breaths";
    } else if (s.k === "guide" && s.trans) {
      sub = "";
    } else if (s.k === "hold") {
      cap = s.lungs === "full" ? "Hold, lungs full" : "Hold, lungs empty";
      sub = s.open ? fmt(st) + " · tap Breathe in when you need to" : Math.max(0, Math.ceil(s.secs - st)) + " s";
    } else if (s.k === "pump") {
      var n = Math.floor((st - 3) * s.rate) + 1;
      if (st < 3) { cap = s.title; sub = "Get ready: " + Math.ceil(3 - st) + "…"; }
      else if (n <= s.n) { cap = "Pump " + n + " of " + s.n; sub = "Short, sharp exhales from the belly."; }
      else { cap = "Breathe in fully"; sub = "Then let it all go."; }
    } else if (s.k === "count") {
      sub = Math.min(P.taps, s.n) + " of " + s.n + " found";
    } else if (s.k === "pmr") {
      sub = st < s.tense ? "Tense: " + Math.ceil(s.tense - st) : "Release";
    } else if (s.k === "observe" && s.wander) {
      sub = P.wander ? "Noticed " + P.wander + (P.wander === 1 ? " time" : " times") : "";
    } else if (s.k === "shuffle") {
      cap = ""; sub = "";
    } else if (s.k === "tap") {
      var ti = pTapIdx(s, st), tp = TAP_PT[s.pts[ti]];
      pTapPoint(s, st);                       // the figure follows the same moment as the words under it
      cap = tp.name;
      sub = s.pts.length === 1 ? "Tap gently while you say the set-up" : (st < (s.lead || 0) ? "Get ready: " + Math.ceil(s.lead - st) + "…" : "Point " + (ti + 1) + " of " + s.pts.length + " · " + tp.where);
    } else if (s.k === "rate") {
      sub = "0 is not at all, 10 is as strong as it gets";
    } else if (s.k === "adapt") {
      sub = s.phase === "base" ? "Measuring your resting heart rate · " + Math.max(0, Math.ceil(s.secs - st)) + " s"
        : AD.src === "heart" ? "Following your heart" + (AD.base ? " · baseline " + Math.round(AD.base.hr) + " bpm" : "")
        : AD.src === "script" ? "No heart data: a gentle scripted descent" : "";
    } else if (s.k === "nap") {
      cap = NP.onset ? "Asleep (estimated)" : "Resting";
      sub = NP.onset ? "Dozed off at " + fmt(NP.onset - s.at) + " · waking at " + fmt(NP.wake - s.at)
        : NP.base > 0 ? "Baseline " + Math.round(NP.base) + " bpm · listening for sleep"
        : NP.base < 0 ? "No heart data · waking at " + fmt(NP.wake - s.at) : "Measuring your resting heart rate";
    }
    bSetT("#sCap", cap);
    bSetT("#sSub", sub);
    var nose = $("#sNose");
    if (!nose.hidden) {
      var ns = nose.children;
      for (var i = 0; i < ns.length; i++) ns[i].classList.toggle("on", ns[i].dataset.s === P.nose);
    }
    var sp = P.def.selfPaced;
    bSetT("#sLeft", sp ? "Your pace" : fmt(P.total - T) + " left");
    bSetT("#sStepTxt", "Step " + (P.idx + 1) + " of " + P.steps.length + " · " + s.title);
    var fw = (sp ? (P.idx + Math.min(1, st / s.secs)) / P.steps.length * 100 : T / P.total * 100).toFixed(1) + "%";
    if (fw !== P.fillW) { P.fillW = fw; $("#sFill").style.width = fw; }     // in steps of a thousandth: no redraw for changes too small to see
    // live chips
    var live = hrLive(), tr = pTrack(), chips = [];
    if (live) chips.push('<span class="lc hr"><i class="dot hr-dot"></i><b>' + Math.round(H.hr) + '</b> bpm</span>');
    if (live && H.coh) chips.push('<span class="lc coh">Coherence <b>' + H.coh.cs.toFixed(1) + "</b></span>");
    if (tr && A.playing) chips.push('<span class="lc beat">' + esc(tr.band) + " <b>" + beatAt(tr, A.elapsed).toFixed(1) + "</b> Hz</span>");
    else if (tr && P.audioOn && !A.playing && P.state === "running" && T < tr.minutes * 60 - (tr.fade || FADE_OUT)) chips.push('<span class="lc off">Sound paused</span>');   // not once the sound has ended as planned
    var h = chips.join("");
    if (P.chipsHtml !== h) { P.chipsHtml = h; $("#sLive").innerHTML = h; }
    var play = $("#sPlay"), icon = P.state === "running" ? "pause" : "play";
    if (play.dataset.icon !== icon) {               // only when it changes, not on every tick
      play.dataset.icon = icon;
      play.innerHTML = '<svg class="i" aria-hidden="true"><use href="#i-' + icon + '"/></svg>';
      play.setAttribute("aria-label", icon === "pause" ? "Pause" : "Resume");
    }
    $("#sPrev").disabled = P.idx <= 0 && T < 3;
    pAdjUI();
    $("#sNext").disabled = P.idx >= P.steps.length - 1;
    pPill();
  }
  function pRenderSegs() {
    var sp = P.def && P.def.selfPaced;
    var h = P.steps.map(function (s, i) {
      return '<i class="' + (i < P.idx ? "past" : i === P.idx ? "now" : "") + '" data-k="' + s.k + '" style="flex:' + (sp ? 1 : s.secs) + ' 1 0"></i>';
    }).join("");
    $("#sSegs").innerHTML = h;
  }

  /* ----- drawing ----- */
  function pSizeCanvas() {
    var cv = P.cv;
    if (!cv) return;
    var r = cv.getBoundingClientRect();
    if (!r.width || !r.height) return;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    P.cw = r.width; P.ch = r.height;
    cv.width = Math.round(r.width * dpr); cv.height = Math.round(r.height * dpr);
    P.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  var P_ANIM = { breath: 1, orb: 1, glow: 1, still: 1, pose: 1, pump: 1, hold: 1, adapt: 1 };   // the visuals drawn on the canvas
  function pDraw(ts) {
    P.raf = 0;
    if (!pBusy() || $("#v-session").hidden || !P.ctx) return;
    if (!frameDue(P, ts)) { P.raf = requestAnimationFrame(pDraw); return; }
    if (!P.cw) pSizeCanvas();
    var c = P.ctx, W = P.cw, Hh = P.ch, s = P.steps[P.idx];
    if (W && s) {
      var vis = pVis(s), now = bNow();
      if (!P_ANIM[vis]) { c.clearRect(0, 0, W, Hh); return; }   // nothing moves on the canvas (writing, a rating, the nap): rest until the next step
      if (vis !== "adapt" || now - P.drawAt >= 0.25) {          // the heart-led chart changes every few seconds: four frames a second will do
        P.drawAt = now;
        c.clearRect(0, 0, W, Hh);
        var T = pT(), st = T - s.at, col = P.col[P.def.tone || "relax"] || BCOL["b-in"];
        if (vis === "breath") pDrawBreath();
        else if (vis === "orb" || vis === "glow") pOrb(c, W, Hh, T, vis === "glow" ? P.col.warm : col, 1);
        else if (vis === "still") pStill(c, W, Hh, T, col);
        else if (vis === "pose") { pPoseRing(c, W, Hh, T, col, s); if (P.mv) pMoveFig(s, T); }
        else if (vis === "pump") pPump(c, W, Hh, s, st, col);
        else if (vis === "hold") pHold(c, W, Hh, s, st, col);
        else if (vis === "adapt") pAdaptDraw(c, W, Hh, s, T, col);
      }
    }
    P.raf = requestAnimationFrame(pDraw);
  }
  function pLoop() { if (!P.raf) P.raf = requestAnimationFrame(pDraw); }
  /* The breathing guide's visuals, drawn into the session canvas. */
  function pDrawBreath() {
    var sd = d2, sw = CW, sh = CH;
    d2 = P.ctx; CW = P.cw; CH = P.ch;
    try {
      var S = frameState();
      d2.setLineDash([]);
      (BVIS[BC.visual] || BVIS.circle)(S);
    } finally { d2 = sd; CW = sw; CH = sh; }
  }
  function pOrb(c, W, Hh, T, col, k) {
    var cx = W / 2, cy = Hh / 2, R = Math.min(W, Hh) * 0.3 * k, p = RM ? 0.5 : (1 - Math.cos(T * Math.PI * 2 / 10)) / 2;
    var r = R * (0.86 + 0.14 * p), g = c.createRadialGradient(cx, cy, r * 0.1, cx, cy, r * 1.5);
    g.addColorStop(0, rgba(col, 0.42)); g.addColorStop(0.55, rgba(col, 0.12)); g.addColorStop(1, rgba(col, 0));
    c.fillStyle = g; c.beginPath(); c.arc(cx, cy, r * 1.5, 0, Math.PI * 2); c.fill();
    c.strokeStyle = rgba(col, 0.55); c.lineWidth = 1.5; c.beginPath(); c.arc(cx, cy, r, 0, Math.PI * 2); c.stroke();
  }
  function pStill(c, W, Hh, T, col) {
    var cx = W / 2, cy = Hh / 2, sh = RM ? 0 : Math.sin(T * 0.7) * 0.06, r = Math.min(W, Hh) * 0.05;
    var g = c.createRadialGradient(cx, cy, 0, cx, cy, r * 6);
    g.addColorStop(0, rgba(col, 0.5 + sh)); g.addColorStop(0.2, rgba(col, 0.16)); g.addColorStop(1, rgba(col, 0));
    c.fillStyle = g; c.beginPath(); c.arc(cx, cy, r * 6, 0, Math.PI * 2); c.fill();
    c.fillStyle = rgba(col, 0.95); c.beginPath(); c.arc(cx, cy, r * 0.5, 0, Math.PI * 2); c.fill();
  }
  function pPoseRing(c, W, Hh, T, col, s) {
    var a = s && s.k === "pose" && ASANA[s.pose];
    if (a && a.move) {                              // moving: a soft pulse on the beat (stronger on the bar) or a quiet ring
      var cx0 = W / 2, cy0 = Hh / 2, R0 = Math.min(W, Hh) * 0.47, k = 0;
      if (a.beats && !RM) { var b = T / RHY.beat, fr = b - Math.floor(b); k = Math.exp(-fr * 6) * (Math.floor(b) % 2 === 0 ? 1 : 0.55); }
      c.strokeStyle = rgba(col, 0.14 + 0.3 * k); c.lineWidth = 2 + 2 * k;
      c.beginPath(); c.arc(cx0, cy0, R0 * (0.95 + 0.03 * k), 0, Math.PI * 2); c.stroke();
      return;
    }
    // breathe with the ring: about 5.5 breaths a minute
    var cyc = 60 / 5.5, ph = (T % cyc) / cyc, lv = (1 - Math.cos(ph * Math.PI * 2)) / 2;
    var cx = W / 2, cy = Hh / 2, R = Math.min(W, Hh) * 0.47, r = R * (0.84 + 0.16 * lv);
    c.strokeStyle = rgba(col, 0.18 + 0.3 * lv); c.lineWidth = 2.5;
    c.beginPath(); c.arc(cx, cy, r, 0, Math.PI * 2); c.stroke();
    c.font = "600 12px " + B_SANS; c.fillStyle = rgba(BCOL["text-faint"], 0.9); c.textAlign = "center"; c.textBaseline = "bottom";
    c.fillText(ph < 0.5 ? "breathe in" : "breathe out", cx, Hh - 4);
  }
  function pPump(c, W, Hh, s, st, col) {
    var cx = W / 2, cy = Hh / 2, R = Math.min(W, Hh) * 0.28, x = (st - 3) * s.rate, k = 1;
    if (st >= 3 && x < s.n) { var fr = x - Math.floor(x); k = 1 - 0.3 * Math.exp(-fr * 7); }
    c.fillStyle = rgba(col, 0.2); c.beginPath(); c.arc(cx, cy, R * k, 0, Math.PI * 2); c.fill();
    c.strokeStyle = rgba(col, 0.85); c.lineWidth = 2.5; c.beginPath(); c.arc(cx, cy, R * k, 0, Math.PI * 2); c.stroke();
    var done = Math.max(0, Math.min(s.n, Math.floor(x) + 1));
    if (st >= 3) {
      c.lineWidth = 4; c.lineCap = "round"; c.strokeStyle = col;
      c.beginPath(); c.arc(cx, cy, R + 14, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * done / s.n); c.stroke(); c.lineCap = "butt";
    }
    c.font = "700 " + Math.round(R * 0.62) + "px " + B_MONO; c.fillStyle = BCOL.text; c.textAlign = "center"; c.textBaseline = "middle";
    c.fillText(st < 3 ? String(Math.ceil(3 - st)) : String(Math.min(done, s.n)), cx, cy + 2);
  }

  function pHold(c, W, Hh, s, st, col) {
    var cx = W / 2, cy = Hh / 2, R = Math.min(W, Hh) * 0.36, f = Math.min(1, st / s.secs);
    c.lineWidth = 6; c.strokeStyle = rgba(BCOL.line, 0.9);
    c.beginPath(); c.arc(cx, cy, R, 0, Math.PI * 2); c.stroke();
    c.strokeStyle = s.lungs === "full" ? BCOL["b-hold"] : col; c.lineCap = "round";
    c.beginPath(); c.arc(cx, cy, R, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (s.open ? f : 1 - f)); c.stroke(); c.lineCap = "butt";
    var g = c.createRadialGradient(cx, cy, 0, cx, cy, R * 0.9);
    g.addColorStop(0, rgba(s.lungs === "full" ? BCOL["b-hold"] : col, s.lungs === "full" ? 0.28 : 0.1)); g.addColorStop(1, rgba(col, 0));
    c.fillStyle = g; c.beginPath(); c.arc(cx, cy, R * 0.9, 0, Math.PI * 2); c.fill();
    c.font = "700 " + Math.round(R * (s.open ? 0.42 : 0.6)) + "px " + B_MONO; c.fillStyle = BCOL.text; c.textAlign = "center"; c.textBaseline = "middle";
    c.fillText(s.open ? fmt(st) : String(Math.max(0, Math.ceil(s.secs - st))), cx, cy + 2);
    c.font = "600 12.5px " + B_SANS; c.fillStyle = BCOL["text-faint"];
    c.fillText(s.lungs === "full" ? "lungs full" : "lungs empty", cx, cy + R * 0.42);
  }

  /* ----- figures: an original body map and stick-figure poses ----- */
  var BODY = [
    ["back", '<rect x="33" y="52" width="54" height="104" rx="16"/>'],
    ["armR", '<rect x="18" y="54" width="12" height="50" rx="6"/><rect x="15" y="104" width="11" height="44" rx="5.5"/>'],
    ["armL", '<rect x="90" y="54" width="12" height="50" rx="6"/><rect x="94" y="104" width="11" height="44" rx="5.5"/>'],
    ["handR", '<ellipse cx="20" cy="157" rx="6.5" ry="9"/>'], ["handL", '<ellipse cx="100" cy="157" rx="6.5" ry="9"/>'],
    ["shoulders", '<rect x="28" y="48" width="64" height="13" rx="6.5"/>'],
    ["chest", '<rect x="35" y="62" width="50" height="34" rx="10"/>'],
    ["belly", '<rect x="37" y="97" width="46" height="28" rx="10"/>'],
    ["hips", '<rect x="35" y="126" width="50" height="26" rx="11"/>'],
    ["thighR", '<rect x="38" y="153" width="20" height="60" rx="9"/>'], ["thighL", '<rect x="62" y="153" width="20" height="60" rx="9"/>'],
    ["kneeR", '<ellipse cx="48" cy="217" rx="9.5" ry="8"/>'], ["kneeL", '<ellipse cx="72" cy="217" rx="9.5" ry="8"/>'],
    ["shinR", '<rect x="40" y="224" width="16" height="50" rx="7"/>'], ["shinL", '<rect x="64" y="224" width="16" height="50" rx="7"/>'],
    ["footR", '<ellipse cx="45" cy="282" rx="10" ry="6.5"/>'], ["footL", '<ellipse cx="75" cy="282" rx="10" ry="6.5"/>'],
    ["neck", '<rect x="54" y="38" width="12" height="11" rx="3"/>'],
    ["head", '<ellipse cx="60" cy="22" rx="15" ry="18"/>'],
    ["face", '<ellipse cx="60" cy="26" rx="9.5" ry="10.5"/>']
  ];
  /* Anapana's areas on a drawing of the nose and upper lip, each narrower than the one before:
     the whole triangle, the nostrils and upper lip, the rims of the nostrils, the area below them,
     and the small dimple just beneath the ridge between the nostrils. */
  var FACE_ZONES = [
    '<path class="zn" d="M100 16 L148 170 L52 170 Z"/>',
    '<path class="zn" d="M78 98 Q100 90 122 98 L148 170 L52 170 Z"/>',
    '<ellipse class="zn" cx="100" cy="129" rx="33" ry="17"/>',
    '<ellipse class="zn" cx="100" cy="147" rx="13" ry="9"/>',
    '<circle class="zn-ring" cx="100" cy="142" r="10"/><circle class="zn pt" cx="100" cy="142" r="4.5"/>'
  ];
  function pFaceSVG(z) {
    return '<svg class="anafig" viewBox="0 0 200 212" aria-hidden="true">' + FACE_ZONES[Math.max(0, Math.min(4, z))] +
      '<path class="ln thin" d="M38 46 Q54 55 70 46 M130 46 Q146 55 162 46"/>' +                                    // closed eyes
      '<path class="ln" d="M91 28 Q89 80 79 111 M109 28 Q111 80 121 111"/>' +                                      // the bridge of the nose
      '<path class="ln" d="M79 111 Q64 128 82 135 Q90 138 95 134 M121 111 Q136 128 118 135 Q110 138 105 134"/>' + // the wings
      '<path class="ln thin" d="M95 134 Q100 139 105 134"/>' +                                                      // the ridge between the nostrils
      '<ellipse class="ln thin" cx="88" cy="130" rx="6" ry="3" transform="rotate(14 88 130)"/><ellipse class="ln thin" cx="112" cy="130" rx="6" ry="3" transform="rotate(-14 112 130)"/>' +
      '<path class="ln faint" d="M95.5 141 Q94 151 93 159 M104.5 141 Q106 151 107 159"/>' +                        // the groove below
      '<path class="ln" d="M52 170 Q78 160 92 161 Q100 166 108 161 Q122 160 148 170 Q100 198 52 170 Z"/>' +       // the lips
      "</svg>";
  }
  function pBodySVG(on) {
    var all = on.indexOf("all") >= 0;
    return '<svg class="bm' + (all ? " all" : "") + '" viewBox="0 0 120 300" aria-hidden="true">' +
      BODY.map(function (r) {
        return '<g data-r="' + r[0] + '" class="' + (all || on.indexOf(r[0]) >= 0 ? "on" : "") + '">' + r[1] + "</g>";
      }).join("") +
      '<text x="45" y="298">R</text><text x="75" y="298">L</text></svg>';
  }

  /* ----- transport ----- */
  // again: a restart, which keeps the pace and beat you set while it ran and skips the cautions you've already confirmed
  function pStart(again) {
    var d = P.view, resume = P.resume;                 // resume: a reflection's draft to carry on from (nvcDraftResume)
    P.resume = null;
    if (!d) return;
    if (d.confirm && again !== true && !$("#sOk").checked) { $("#sOk").focus(); return; }
    var go = function () {
      if (pBusy()) pFinish(true, true);
      if (again !== true) { P.paceK = 1; P.beatAdj = 0; P.beatOff = false; }
      P.def = d;
      P.opt = pOptsOf(d.id); P.optFor = d.id;          // this practice's options, with its own changes
      if (B.finder) finderCancel();
      if (B.state === "running" || B.state === "paused") bStop();    // the viewer's own breathing session
      var plan = pPlan(d, P.len);
      P.steps = plan.steps; P.total = plan.total; P.base = plan.base; P.runLen = P.len;
      P.hasRhy = pPlanHasRhy(plan.steps);
      if (P.hasRhy) amNeed(["rhy"]);                 // render the berimbau ahead of the first capoeira step
      P.hr = []; P.coh = []; P.sw = []; P.wander = 0; P.used = {}; P.idx = -1; P.chipsHtml = null; P.holds = []; P.holdRec = -1; P.suds = []; P.sudsBy = {}; P.rated = -1;
      pAdaptReset(); napReset(); P.nvc = nvcNew(); P.draftLive = false;
      P.state = "running"; P.st = 0; P.t0 = bNow(); P.startedAt = Date.now();
      ensureCtx(); pBusOn();
      if (d.audio && P.opt.audio && !P.beatOff) {
        load(pBeatTrack(d));
        P.audioOn = true;
      } else P.audioOn = false;
      P.audioHeld = false;
      $("#ses").dataset.state = "run";
      $("#sIntro").hidden = true; $("#sDone").hidden = true; $("#sRun").hidden = false;
      P.endArm = 0; $("#sEnd").classList.remove("armed"); bSetT("#sEndTxt", "End");
      bSetT("#sTitle", d.name);
      $("#ses").style.setProperty("--pcol", pColor(d));
      pQuickSync();
      pImmersive();
      pLockBreathe();
      pBell(0.5);
      pLock();
      if (resume && d.reflect && resume.id === d.id) nvcDraftResume(resume);
      clearInterval(P.tick);
      P.tick = setInterval(pTick, 200);
      pTick();
      pSizeCanvas();
      pLoop();
      ambSync();
    };
    if (d.audio && P.opt.audio) gate(go); else go();
  }
  function pPause() {
    if (P.state !== "running") return;
    P.st = pT();
    P.state = "paused";
    clearInterval(P.tick);
    if (B.state === "running" && P.usesB) bPause();
    if (pTrack() && A.playing) { pause(); P.audioHeld = true; }
    rhyStop(0.3);
    napWakeStop();
    pHush();
    pUnlock();
    pUI();
    ambSync();
  }
  function pResume() {
    if (P.state !== "paused") return;
    P.t0 = bNow() - P.st;
    P.state = "running";
    var s = P.steps[P.idx];
    if (s && s.k === "breath" && P.usesB && B.state === "paused") bResume();
    if (P.audioHeld && pTrack() && !A.playing && P.st < A.track.minutes * 60 - 2) { A.elapsed = P.st; play(); }
    P.audioHeld = false;
    pLock();
    clearInterval(P.tick);
    P.tick = setInterval(pTick, 200);
    pTick(); pLoop();
    ambSync();
  }
  function pJump(dir) {
    if (!pBusy()) return;
    var T = pT(), i = P.idx, target;
    if (dir > 0) {
      if (i >= P.steps.length - 1) return;
      if (P.steps[i].open) { pAdvance(); return; }       // an open step ends now and gives back its unused time
      target = P.steps[i + 1].at;
    }
    else target = ((T - P.steps[i].at > 3 && P.steps[i].k !== "write") || i === 0) ? P.steps[i].at : P.steps[i - 1].at;   // writing: back means the step before
    pHoldLeave(T);
    if (P.state === "running") P.t0 = bNow() - target; else P.st = target;
    pHush();
    // a jump into a different breath pattern restarts the guide so it doesn't wait for the breath to end
    if (P.usesB && B.state !== "idle") pBreathOff();
    P.idx = -1;
    pEnter(pStepAt(target + 0.01));
    if (RHY.on) rhyStop(0.15);
    var tr = pTrack();
    if (tr) { if (A.playing) aSeek(target); else A.elapsed = target; }
    pUI();
  }
  function pFinish(early, quiet) {
    var T = Math.min(pT(), P.total), d = P.def;
    clearInterval(P.tick);
    if (P.raf) { cancelAnimationFrame(P.raf); P.raf = 0; }
    if (P.usesB && B.state !== "idle") pBreathOff();
    pRestore();
    pHush();
    rhyStop();
    napWakeStop();
    P.mv = null;
    if (pTrack()) {
      var trk = A.track;
      if (early) { if (A.playing) fadeOutAndStop("Practice ended.", 3); else hardStop(true); }
      else if (A.playing) fadeOutAndStop("Practice complete.", 3);      // an open step finished early: the sound ends with the practice
      $("#player").classList.remove("open", "expanded");               // the practice's own sound isn't a track to replay: the player stays away
      setTimeout(function () {                                         // while it fades out
        if (A.track === trk && !A.playing) $("#player").classList.remove("open", "expanded");
      }, 3700);
    }
    P.audioOn = false;
    pUnlock();
    P.state = "done";
    $("#ses").dataset.dim = "";
    if (!early && !quiet) {
      pBell(0.5);
      if (A.ctx) pBell(0.4, A.ctx.currentTime + 1.4, 523.25);
      if (d.end) pSay(d.end);
    }
    var sum = pSummary(T, early);
    if (d.reflect && P.draftLive) nvcDraftClear(d.id);   // finished, or ended: the draft has done its job
    if (!quiet) pDone(sum, early);
    pImmersive();
    pPill();
    ambSync();
  }

  /* ----- summary and history ----- */
  function pSummary(T, early) {
    var d = P.def, r = { secs: Math.round(T), early: early }, hr = P.hr.filter(function (x) { return x.t >= 0 && x.t <= T; });
    if (hr.length >= 20 && T >= 150) {           // first and last two minutes of readings (a sensor may join late or drop out early)
      var span = Math.min(120, T / 3), ta = hr[0].t, tb = hr[hr.length - 1].t;
      r.hr0 = Math.round(avg(hr.filter(function (x) { return x.t < ta + span; }).map(function (x) { return x.hr; })));
      r.hr1 = Math.round(avg(hr.filter(function (x) { return x.t > tb - span; }).map(function (x) { return x.hr; })));
    } else if (hr.length >= 5) r.hrAvg = Math.round(avg(hr.map(function (x) { return x.hr; })));
    if (P.coh.length) {
      r.coh = avg(P.coh.map(function (c) { return c.cs; }));
      r.cohMax = Math.max.apply(null, P.coh.map(function (c) { return c.cs; }));
      r.cohEst = !H.hasRR;
    }
    if (P.sw.length) r.swing = avg(P.sw.map(function (s) { return s.amp; }));
    if (d.id === "anapana") r.wander = P.wander;
    if (P.holds.length) r.holds = P.holds.slice();
    if (P.suds.length) r.suds = P.suds.slice();
    var bl = AD.log.filter(function (x) { return x.src !== "base"; });
    if (bl.length > 2) { r.beat0 = AD.log[0].hz; r.beat1 = bl[bl.length - 1].hz; r.beatHeart = bl.some(function (x) { return x.src === "heart"; }); r.beatLog = AD.log.slice(); }
    napSummary(r, T);
    if (d.reflect) {                                   // what you wrote stays out of the shared summary text
      r.nvc = nvcSummary(d.id === "nvc-choose" ? "choose" : "self");
      if (r.nvc && P.opt.nvcSave) nvcKeep(r.nvc);
    }
    r.hrPts = hr;
    // into the history: the time, the heart and what else this one measured, never what you wrote
    var notes = [];
    if (r.wander !== undefined) notes.push("came back " + r.wander + (r.wander === 1 ? " time" : " times"));
    if (r.holds) notes.push("holds " + r.holds.map(fmt).join(", "));
    if (r.suds) notes.push("intensity " + r.suds.join(" → ") + " of 10");
    if (r.beat0) notes.push("beat " + r.beat0.toFixed(1) + " → " + r.beat1.toFixed(1) + " Hz" + (r.beatHeart ? "" : " (scripted)"));
    if (r.nap) notes.push(r.nap.onset !== null ? "asleep after about " + r.nap.onset + " min, about " + r.nap.slept + " min of sleep (est.)" : r.nap.sensor ? "no sleep detected" : "no heart data");
    if (T >= 60) r.at = Date.now();                    // the end screen tells this one from the earlier ones by it
    if (T >= 60) hAdd({ k: "practice", id: d.id, n: d.name, at: r.at, secs: r.secs, full: !early, hr0: r.hr0, hr1: r.hr1, hrAvg: r.hrAvg,
      coh: r.coh ? +r.coh.toFixed(2) : undefined, est: r.coh && r.cohEst ? true : undefined, swing: r.swing ? +r.swing.toFixed(1) : undefined,
      note: notes.join(", ") || undefined });
    return r;
  }
  /* ----- the session screen: intro ----- */
  function pNeeds(d) {
    var n = [];
    if (d.audio) n.push(["sounds", "Headphones", "for the binaural layer"]);
    if (d.sensor === "best") n.push(["pulse", "Heart sensor", d.sensorWhy || "recommended: live heart rate and coherence"]);
    else if (d.sensor === "optional" || pHasBreath(d)) n.push(["pulse", "Heart sensor", "optional: adds heart rate and coherence"]);
    if (d.lie) n.push(["moon", "Lying down", "or sitting back, somewhere you can rest"]);
    if (d.room) n.push(["move", "Room to move", "about two metres clear around you, on a floor with good grip"]);
    else if (d.stand) n.push(["move", "Space to stand", "an arm's length all around"]);
    if (d.voice) n.push(["voice", "Voice on", "the steps are spoken; eyes can stay closed"]);
    if (d.reflect) n.push(["nvc", "A quiet place to write", "nothing you type leaves this device"]);
    return n;
  }
  function pHasBreath(d) { return pPlan(d, pLenOf(d, P.len)).steps.some(function (s) { return s.k === "breath"; }); }
  function pIntro(id) {
    var d = pDef(id);
    if (!d) { location.hash = "practice"; return; }
    if (pBusy() && P.def === d) { pShowRun(); return; }
    var len = pLenOf(d, P.view === d && P.len ? P.len : parseInt(store.get("pLen." + id), 10) || 0);
    P.view = d; P.len = len;
    if (!pBusy()) P.state = "intro";
    var plan = pPlan(d, len), hasB = plan.steps.some(function (s) { return s.k === "breath"; });
    var mins = Math.max(1, Math.round(plan.total / 60)), minsTxt = d.selfPaced ? "self-paced, about " + d.est + " min" : (d.open ? "up to " : "") + mins + " min";
    var segs = plan.steps.map(function (s) { return '<i data-k="' + s.k + '" style="flex:' + (d.selfPaced ? 1 : s.secs) + ' 1 0" title="' + esc(s.title) + '"></i>'; }).join("");
    // consecutive steps with the same title read as one row
    var rows = [];
    plan.steps.forEach(function (s) {
      var last = rows[rows.length - 1];
      if (last && last.title === s.title) last.secs += s.secs; else rows.push({ title: s.title, secs: s.secs, k: s.k });
    });
    var O = pIntroOpts(d), own = Object.keys(pOptOwn(d.id)).length > 0, hasRhy = pPlanHasRhy(plan.steps);
    var opts = [], every = [];
    // this practice's own choices come first: how you'll be, which beat, what pace
    (d.choices || []).forEach(function (c) {
      var v = pChoice(d, c.key);
      opts.push('<div class="so-row so-seg"><span class="so-l">' + esc(c.label) + (c.note ? "<small>" + esc(c.note) + "</small>" : "") + '</span><div class="mini-seg" data-choice="' + c.key + '">' +
        c.opts.map(function (o) { return '<button data-v="' + o[0] + '" aria-pressed="' + (v === o[0]) + '">' + esc(o[1]) + "</button>"; }).join("") + "</div></div>");
    });
    if (d.audio && d.beats) {
      var bt = pBeat(d);
      opts.push('<div class="so-row so-seg so-beat"><span class="so-l">Binaural beat<small id="sBeatNote">' + esc(pBeatNote(d, O)) + '</small></span><div class="mini-seg" id="sOptBeat">' +
        [["off", "Off"]].concat(d.beats.map(function (b) { return [b.id, b.label]; })).map(function (o) {
          return '<button data-v="' + o[0] + '" aria-pressed="' + (o[0] === "off" ? !O.audio : O.audio && bt.id === o[0]) + '">' + esc(o[1]) + "</button>";
        }).join("") + "</div></div>");
    }
    if (d.pace) {
      var pc = pPace(d), step = function (k, label, what) {
        return '<span class="so-step" data-k="' + k + '"><span class="so-step-l">' + label + '</span><button data-d="-1" aria-label="' + what + ' half a second shorter" aria-disabled="' + (pc[k] <= P_PACE[k][0]) + '">−</button>' +
          '<b id="sPace-' + k + '" aria-live="polite">' + pSecs(pc[k]) + '</b><button data-d="1" aria-label="' + what + ' half a second longer" aria-disabled="' + (pc[k] >= P_PACE[k][1]) + '">+</button></span>';
      };
      opts.push('<div class="so-row so-seg so-pace"><span class="so-l">Breathing pace<small id="sPaceNote">' + esc(pPaceNote(pc)) + '</small></span><div class="mini-seg" id="sOptPace">' +
        [["auto", "Optimal defaults"], ["own", "Your own"]].map(function (o) { return '<button data-v="' + o[0] + '" aria-pressed="' + ((o[0] === "own") === pc.own) + '">' + o[1] + "</button>"; }).join("") +
        '</div><div class="so-steps" id="sPaceSteps"' + (pc.own ? "" : " hidden") + ">" + step("inh", "In", "Each in-breath") + step("exh", "Out", "Each out-breath") + "</div></div>");
    }
    opts.push(pToggle("sOptVoice", "Spoken guidance", O.voice, window.speechSynthesis ? "Uses your device's own voice; captions always show." : "This browser has no speech; captions only.", !window.speechSynthesis));
    opts.push(pToggle("sOptBells", "Bells between steps", O.bells, ""));
    if (d.audio && !d.beats) opts.push(pToggle("sOptAudio", "Binaural layer", O.audio, esc(d.audio.band) + ", " + d.audio.carrier + " Hz carrier. Headphones needed."));
    if (hasRhy) opts.push(pToggle("sOptRhy", "Berimbau", O.rhythm, "A synthesized berimbau keeps time for the capoeira moves."));
    var hasTap = d.tapping || tapOffered(d);
    if (!d.tapping && tapOffered(d)) opts.push(pToggle("sOptTap", "Finish with tapping", tapOn(d), "A short round of tapping on the nine points at the end, about three minutes."));
    if (hasTap) {
      opts.push('<div class="so-row so-phrase" id="sPhraseRow"' + (d.tapping || tapOn(d) ? "" : " hidden") + '><label class="so-l" for="sTapPhrase">Your phrase<small>A few words for what\'s bothering you, like “this stress” or “this tight chest”.</small></label>' +
        '<input id="sTapPhrase" maxlength="48" autocomplete="off" placeholder="this stress" value="' + esc(store.get("tapPhrase") || "") + '"></div>');
      opts.push('<div id="sTickRow"' + (d.tapping || tapOn(d) ? "" : " hidden") + ">" + pToggle("sOptTick", "Tapping tick", O.tapTick, "A soft tick to tap along with.") + "</div>");
    }
    if (d.variant) opts.push('<div class="so-row so-seg"><span class="so-l">' + d.variant.label + '</span><div class="mini-seg" id="sOptVar">' +
      d.variant.opts.map(function (o) { return '<button data-v="' + o[0] + '" aria-pressed="' + (pVar(d) === o[0]) + '">' + o[1] + "</button>"; }).join("") + "</div></div>");
    if (d.method === "program") opts.push('<div class="so-row so-seg so-ana"><span class="so-l">Anapana reminders<small>Now and then, a quiet prompt to observe the touch of the breath at the nostrils.</small></span><div class="mini-seg" id="sOptAna">' +
      [[0, "Off"], [120, "2 min"], [180, "3 min"], [300, "5 min"]].map(function (o) {
        return '<button data-v="' + o[0] + '" aria-pressed="' + (O.ana === o[0]) + '">' + o[1] + "</button>";
      }).join("") + "</div></div>");
    if (hasB) {
      opts.push('<div class="so-row so-seg"><span class="so-l">Breath cues</span><div class="mini-seg" id="sOptCues">' +
        [["tones", "Tone"], ["chimes", "Chimes"], ["off", "Silent"]].map(function (o) {
          return '<button data-v="' + o[0] + '" aria-pressed="' + (O.cues === o[0]) + '">' + o[1] + "</button>";
        }).join("") + "</div></div>");
      if (bzOk()) opts.push(pToggle("sOptBuzz", "Vibrate with the breath", O.buzz, "A short buzz to breathe in, a long one to breathe out, two taps for a hold."));
      opts.push('<div class="so-row so-seg"><span class="so-l">Breath visual</span><div class="mini-seg" id="sOptVis">' +
        [["circle", "Circle"], ["wave", "Wave"], ["column", "Column"], ["dial", "Dial"]].map(function (o) {
          return '<button data-v="' + o[0] + '" aria-pressed="' + (O.visual === o[0]) + '">' + o[1] + "</button>";
        }).join("") + "</div></div>");
    }
    // the same in every session: which voice, the sound underneath, and what's kept of a reflection
    if (window.speechSynthesis) every.push('<div class="so-row so-voice" id="sVoiceRow"' + (O.voice ? "" : " hidden") + '><span class="so-l">Voice</span><select id="sVoiceSel" aria-label="Voice"></select><button class="btn small" id="sVoiceTest">Test</button></div>');
    every.push('<div class="so-row so-amb"><span class="so-l">Background sound<small>Rain or crickets under the session, made on your device.</small></span>' + ambCtl() + "</div>");
    if (d.reflect) every.push(pToggle("sOptKeep", "Keep a copy on this device", O.nvcSave, "Your writing is never sent anywhere. While this is on, an unfinished reflection is kept too, so closing the app doesn't lose it. Turn it off to keep nothing."));
    var openOpts = store.get("optsOpen") === "1";
    var other = pBusy() && P.def !== d;
    var h = backLink() +
      '<div class="si-head">' +
        '<div class="si-top"><span class="si-kind">' + [d.custom ? "Your routine" : goalOf(d.goal) ? goalOf(d.goal).name : "", methodName(d.method)].filter(Boolean).join(" · ") + (d.exp ? " · Experimental" : "") + " · " + minsTxt + "</span>" +
          favBtn(d.id, d.name) + "</div>" +
        "<h2>" + esc(d.name) + "</h2>" +
        '<p class="si-blurb">' + esc(d.blurb) + "</p>" +
        (d.parts ? '<p class="si-parts">' + esc(d.parts) + "</p>" : "") +
        (d.lengths ? '<div class="si-len" role="radiogroup" aria-label="Length">' + d.lengths.map(function (m) {
          return '<button role="radio" data-len="' + m + '" aria-checked="' + (m === len) + '">' + pLenTxt(d, m) + "</button>";
        }).join("") + "</div>" : "") +
        '<div class="si-tl" aria-hidden="true">' + segs + "</div>" +
        (d.custom ? '<a class="btn small si-edit" href="#yoga/' + d.custom + '">Edit routine</a>'
          : d.yoga ? '<a class="btn small si-edit" href="#yoga/copy/' + d.yoga + '">Customise a copy</a>' : "") +
      "</div>" +
      '<div class="si-grid"><div class="si-main">' +
        (pNeeds(d).length ? '<ul class="si-need">' + pNeeds(d).map(function (n) {
          return '<li><svg class="i" aria-hidden="true"><use href="#i-' + n[0] + '"/></svg><span><b>' + n[1] + "</b> " + n[2] + "</span></li>";
        }).join("") + "</ul>" : "") +
        "<h3>How it runs</h3><p>" + esc(d.how || pYogaHow(plan)) + "</p>" +
        '<ol class="si-steps">' + rows.map(function (r) {
          return '<li data-k="' + r.k + '"><span>' + esc(r.title) + "</span><time>" + (d.selfPaced && r.k === "write" ? "your pace" : fmt(r.secs)) + "</time></li>";
        }).join("") + "</ol>" +
        (d.reflect ? nvcJournal(d) : "") +
        '<details class="ev si-ev"><summary>Evidence ' + dots(d.strength) + '</summary><div class="ev-body">' + esc(d.ev) + "<cite>" + esc(d.cite) + "</cite></div></details>" +
        (d.caution || d.audio ? safeBox([d.caution, d.audio ? "About its binaural beat: " + SAFE_BEATS.charAt(0).toLowerCase() + SAFE_BEATS.slice(1) : ""]) : "") +
      "</div>" +
      '<div class="si-side">' +                     // Start first: above the options on a computer, last on a phone (order)
      '<div class="si-bar">' +
        (d.confirm ? '<label class="so-ok"><input type="checkbox" id="sOk"> None of the cautions apply to me</label>' : "") +
        (other ? '<p class="si-other">' + esc(P.def.name) + " is running. Starting this ends it.</p>" : "") +
        '<button class="btn primary si-go" id="sGo"' + (d.confirm ? " disabled" : "") + '><svg class="i" aria-hidden="true"><use href="#i-play"/></svg>Start' + (d.open || d.selfPaced ? "" : " " + mins + " min") + "</button>" +
      "</div>" +
      '<aside class="si-opts">' + (d.reflect ? nvcDraftStrip(d) : "") +     // first thing on a phone, beside the steps on a computer
        '<button class="so-sum" id="sOptsBtn" aria-expanded="' + openOpts + '" aria-controls="sOpts"><span class="so-sum-t"><b>Options</b>' +
          '<span id="sOptsSum">' + esc(pOptSumTxt(d, O, hasRhy)) + "</span></span>" + '<svg class="i" aria-hidden="true"><use href="#i-up"/></svg></button>' +
        '<div class="so-list" id="sOpts"' + (openOpts ? "" : " hidden") + ">" +
          '<p class="so-scope" id="sOptsScope">' + pOptScope(d, own) + "</p>" +
          opts.join("") +
          '<div class="so-acts" id="sOptsActs"' + (own ? "" : " hidden") + '><button class="btn small" id="sOptsAll">Use these for every practice</button><button class="btn small" id="sOptsReset">Back to the defaults</button></div>' +
          '<div class="so-every"><h4>In every session</h4>' + every.join("") + "</div>" +
        "</div>" +
      "</aside>" +
      "</div></div>";
    var el = $("#sIntro");
    el.innerHTML = h;
    el.style.setProperty("--pcol", pColor(d));
    $("#ses").style.setProperty("--pcol", pColor(d));
    el.hidden = false; $("#sRun").hidden = true; $("#sDone").hidden = true;
    $("#ses").dataset.state = "intro";
    bSetT("#viewTitle", d.name);
    document.title = d.name + " | Entrain";
    pIntroWire(d, O, hasRhy);
    pImmersive();
    edgeFade(el.querySelector(".si-len"));
  }
  function pOptScope(d, own) {
    return (own ? "You've changed these for " + esc(d.name) + ". " : "For " + esc(d.name) + " only. ") +
      'The defaults for every practice are in <a href="#settings">Settings</a>.';
  }
  // what the chosen beat is, or that there's none
  function pBeatNote(d, O) {
    return O.audio ? pBeat(d).note + " " + d.audio.carrier + " Hz carrier. Headphones needed." : "No beat: the guidance and breath cues only.";
  }
  // the optimal default is your own resonance rate: the test's answer, or 5.5 a minute, the usual one, until you take it
  function pPaceNote(pc) {
    if (pc.own) return pc.rate + " breaths a minute, at your own in and out.";
    return "Your resonance rate, even in and out: " + pc.rate + " breaths a minute, " + (H.find && H.find.best ? "from your resonance test." : "the usual one, until you take the resonance test on the Heart tab.");
  }
  function pOptSumTxt(d, O, hasRhy) {
    var s = [];
    (d.choices || []).forEach(function (c) {                 // a choice of its own, when it isn't the usual one
      var v = pChoice(d, c.key);
      if (v !== c.def) s.push(c.opts.filter(function (o) { return o[0] === v; })[0][1]);
    });
    if (d.pace && pPace(d).own) s.push("In " + pSecs(pPace(d).inh) + ", out " + pSecs(pPace(d).exh));
    s.push(O.voice && window.speechSynthesis ? "Voice" : "No voice");
    if (O.bells) s.push("Bells");
    if (d.audio) s.push(O.audio ? (d.beats ? pBeat(d).label : "Binaural") : "No beats");
    if (hasRhy && O.rhythm) s.push("Berimbau");
    if (!d.tapping && tapOffered(d) && tapOn(d)) s.push("Tapping");
    if (d.method === "program" && O.ana) s.push("Anapana every " + O.ana / 60 + " min");
    if (O.buzz && bzOk() && pPlan(d, pLenOf(d, P.len)).steps.some(function (x) { return x.k === "breath"; })) s.push("Vibration");
    if (AMB.kind !== "off") s.push(AMB.kind === "night" ? "Rain and crickets" : AMB.kind === "rain" ? "Rain" : "Crickets");
    return s.join(" · ");
  }
  function pYogaHow(plan) {
    var poses = plan.steps.filter(function (s) { return s.k === "pose"; }), names = [], moving = 0, rhy = false;
    poses.forEach(function (s) {
      var a = ASANA[s.pose];
      if (!a) return;
      if (names.indexOf(a.en) < 0) names.push(a.en);
      if (a.move) moving++;
      if (a.rhythm) rhy = true;
    });
    return poses.length + (moving ? " steps, each with a drawing (moving ones are animated) and spoken cues" : " poses with a drawing and spoken cues each, a ring to breathe with,") +
      (rhy ? ", a berimbau to keep time for the capoeira," : "") + " and short spoken transitions whenever you change position: " + names.join(", ") + ".";
  }
  function pToggle(id, label, on, note, disabled) {
    return '<label class="so-row so-tg"><span class="so-l">' + label + (note ? "<small>" + note + "</small>" : "") + '</span>' +
      '<input type="checkbox" class="sw" id="' + id + '"' + (on && !disabled ? " checked" : "") + (disabled ? " disabled" : "") + "></label>";
  }
  function pIntroWire(d, O, hasRhy) {
    var on = function (id, fn) { var el = $(id); if (el) el.addEventListener("change", fn); };
    var sum = function () { var el = $("#sOptsSum"); if (el) el.textContent = pOptSumTxt(d, O, hasRhy); };
    var save = function () {                          // kept for this practice; the scope line and its two buttons follow
      pOptSave(d.id, O); sum();
      var own = Object.keys(pOptOwn(d.id)).length > 0;
      $("#sOptsScope").innerHTML = pOptScope(d, own);
      $("#sOptsActs").hidden = !own;
    };
    on("#sOptVoice", function () { O.voice = this.checked; var r = $("#sVoiceRow"); if (r) r.hidden = !this.checked; save(); });
    on("#sOptBells", function () { O.bells = this.checked; save(); if (this.checked) pBell(0.4, 0, 0, 0, true); });
    on("#sOptAudio", function () { O.audio = this.checked; save(); });
    // a practice's own choices change in place, so the button you pressed keeps the focus
    var press = function (g, b) { g.querySelectorAll("button").forEach(function (x) { x.setAttribute("aria-pressed", x === b ? "true" : "false"); }); };
    document.querySelectorAll("#sOpts [data-choice]").forEach(function (g) {
      g.addEventListener("click", function (e) {
        var b = e.target.closest("button"); if (!b) return;
        pChoiceSet(d, g.dataset.choice, b.dataset.v); press(g, b); sum();
      });
    });
    var bg = $("#sOptBeat");
    if (bg) bg.addEventListener("click", function (e) {
      var b = e.target.closest("button"); if (!b) return;
      O.audio = b.dataset.v !== "off";
      if (O.audio) pChoiceSet(d, "beat", b.dataset.v);
      save(); press(bg, b);
      bSetT("#sBeatNote", pBeatNote(d, O));
    });
    var pg = $("#sOptPace");
    if (pg) {
      var paceUI = function () {
        var pc = pPace(d);
        $("#sPaceSteps").hidden = !pc.own;
        ["inh", "exh"].forEach(function (k) {
          bSetT("#sPace-" + k, pSecs(pc[k]));
          var bs = document.querySelectorAll('#sPaceSteps [data-k="' + k + '"] button');      // aria-disabled, so a held key keeps its place at the end
          bs[0].setAttribute("aria-disabled", pc[k] <= P_PACE[k][0] ? "true" : "false"); bs[1].setAttribute("aria-disabled", pc[k] >= P_PACE[k][1] ? "true" : "false");
        });
        bSetT("#sPaceNote", pPaceNote(pc));
        sum();
      };
      pg.addEventListener("click", function (e) {
        var b = e.target.closest("button"); if (!b) return;
        if (b.dataset.v === "own" && !("inh" in pChoices(d.id))) {    // the first time: start from the resonance pace
          var pc0 = pPace(d);
          pChoiceSet(d, "inh", Math.round(pc0.inh * 2) / 2); pChoiceSet(d, "exh", Math.round(pc0.exh * 2) / 2);
        }
        pChoiceSet(d, "pace", b.dataset.v); press(pg, b); paceUI();
      });
      $("#sPaceSteps").addEventListener("click", function (e) {
        var b = e.target.closest("button[data-d]"); if (!b || b.getAttribute("aria-disabled") === "true") return;
        var k = b.closest("[data-k]").dataset.k, lim = P_PACE[k];
        pChoiceSet(d, k, Math.max(lim[0], Math.min(lim[1], pPace(d)[k] + 0.5 * parseInt(b.dataset.d, 10))));
        paceUI();
      });
    }
    on("#sOptRhy", function () { O.rhythm = this.checked; save(); });
    on("#sOptTick", function () { O.tapTick = this.checked; save(); });
    on("#sOptBuzz", function () {
      O.buzz = this.checked; save();
      if (pBusy() && P.def === d && P.usesB) BC.buzz = O.buzz;      // a breath step running now follows at once
      if (this.checked && bzOk()) { try { navigator.vibrate(BUZZ["in"]); } catch (e) {} }
    });
    on("#sOptKeep", function () { O.nvcSave = this.checked; save(); });
    on("#sOptTap", function () {
      store.set("pTap." + d.id, this.checked ? "1" : "0");
      pIntro(d.id);
      var r = $("#sTapPhrase"); if (this.checked && r) r.focus();
    });
    var ph = $("#sTapPhrase");
    if (ph) ph.addEventListener("input", function () { store.set("tapPhrase", this.value.trim()); });
    on("#sOk", function () { $("#sGo").disabled = !this.checked; });
    var dg = $("#sDraftGo"), dd = $("#sDraftDel");
    if (dg) dg.addEventListener("click", function () { P.resume = nvcDraftGet(d.id); pStart(); });
    if (dd) dd.addEventListener("click", function () {     // two taps, like End: a discarded draft is gone
      if (!(dd.armed && bNow() - dd.armed < 3)) {
        dd.armed = bNow(); dd.textContent = "Tap again to discard";
        setTimeout(function () { dd.armed = 0; dd.textContent = "Discard"; }, 3000);
        return;
      }
      nvcDraftClear(d.id); pIntro(d.id);
    });
    on("#sVoiceSel", function () { O.voiceName = this.value; save(); });
    var t = $("#sVoiceTest");
    if (t) t.addEventListener("click", function () {
      pHush();
      var v = P.opt.voice, n = P.opt.voiceName;
      P.opt.voice = true; P.opt.voiceName = O.voiceName;
      pSay("Breathe in slowly, and let it go.");
      P.opt.voice = v; P.opt.voiceName = n;
    });
    pFillVoices(O.voiceName);
    $("#sOptsBtn").addEventListener("click", function () {
      var open = this.getAttribute("aria-expanded") !== "true";
      this.setAttribute("aria-expanded", open ? "true" : "false");
      $("#sOpts").hidden = !open;
      store.set("optsOpen", open ? "1" : "0");
      if (open) edgeFadeAll();
    });
    var all = $("#sOptsAll"), reset = $("#sOptsReset");
    all.addEventListener("click", function () {
      pOptMakeDefault(d.id, O);
      pIntro(d.id);
      toast("These are now the options for every practice that hasn't set its own.");
    });
    reset.addEventListener("click", function () { storeDel("pOpt." + d.id); pIntro(d.id); });
    $("#sOpts").addEventListener("click", function (e) { if (e.target.closest("[data-amb]")) setTimeout(sum, 0); });
    [["#sOptCues", "cues"], ["#sOptVis", "visual"], ["#sOptAna", "ana"], ["#sOptVar", "var"]].forEach(function (p) {
      var g = $(p[0]);
      if (!g) return;
      g.addEventListener("click", function (e) {
        var b = e.target.closest("button");
        if (!b) return;
        if (p[1] === "var") { store.set("pVar." + d.id, b.dataset.v); pIntro(d.id); return; }
        O[p[1]] = p[1] === "ana" ? parseInt(b.dataset.v, 10) : b.dataset.v; save();
        var bs = g.querySelectorAll("button");
        for (var i = 0; i < bs.length; i++) bs[i].setAttribute("aria-pressed", bs[i] === b ? "true" : "false");
        if (p[1] === "cues" && b.dataset.v !== "off" && pBusOn() && ensureBus()) {
          var tt = A.ctx.currentTime + 0.03;
          if (b.dataset.v === "chimes") chime(B_CHIME["in"], tt, 0.2); else { var sv = BC.sound; BC.sound = "tones"; preview(); BC.sound = sv; }
        }
      });
    });
    var lens = document.querySelectorAll(".si-len button");
    for (var i = 0; i < lens.length; i++) lens[i].addEventListener("click", function () {
      P.len = parseInt(this.dataset.len, 10);
      store.set("pLen." + d.id, String(P.len));
      pIntro(d.id);
    });
    $("#sGo").addEventListener("click", pStart);
  }
  function pFillVoices(name, id) {
    var sel = $(id || "#sVoiceSel");
    if (!sel) return;
    var vs = pVoices(), pick = typeof name === "string" && name ? vs.filter(function (v) { return v.name === name; })[0] : null, cur = pick || pVoice();
    if (!vs.length) { sel.innerHTML = "<option>Default voice</option>"; sel.disabled = true; return; }
    sel.disabled = false;
    sel.innerHTML = vs.map(function (v) {
      return '<option value="' + esc(v.name) + '"' + (cur && cur.name === v.name ? " selected" : "") + ">" +
        esc(v.name.replace(/^(Microsoft|Google)\s+/, "")) + (v.localService ? "" : " (online)") + "</option>";
    }).join("");
  }

  /* ----- the session screen: running ----- */
  function pShowRun() {
    $("#sIntro").hidden = true; $("#sDone").hidden = true; $("#sRun").hidden = false;
    $("#ses").dataset.state = "run";
    $("#ses").style.setProperty("--pcol", pColor(P.def));
    bSetT("#viewTitle", P.def.name);
    document.title = P.def.name + " | Entrain";
    var s = P.steps[P.idx];
    if (s) pStage(s);
    pRenderSegs(); pQuickSync(); pUI(); pImmersive();
    setTimeout(function () { pSizeCanvas(); pLoop(); }, 0);
  }
  function pQuickSync() {
    $("#sqVoice").setAttribute("aria-pressed", P.opt.voice ? "true" : "false");
    $("#sqBells").setAttribute("aria-pressed", P.opt.bells ? "true" : "false");
    $("#sqRhy").hidden = !P.hasRhy;
    $("#sqRhy").setAttribute("aria-pressed", P.opt.rhythm ? "true" : "false");
    ambUI();
    $("#sqVolRow").hidden = !P.audioOn;
    $("#sqVol").value = $("#vol").value;
    $("#sqRestart").hidden = !!(P.def && P.def.reflect);       // a reflection would lose what you've written
    pAdjUI();
  }
  function pImmersive() {
    var on = curView === "session" && pBusy();
    document.body.classList.toggle("immersive", on);
  }
  function pPill() {
    var pill = $("#tbPrac");
    if (!pill) return;
    var show = pBusy() && curView !== "session";
    pill.hidden = !show;
    if (show) {
      pill.href = "#practice/" + P.def.id;
      bSetT("#tbPracTxt", P.def.name + " · " + (P.state === "paused" ? "paused" : P.def.selfPaced ? "step " + (P.idx + 1) + " of " + P.steps.length : fmt(P.total - pT())));
    }
  }
  function pLockBreathe() {
    var on = pBusy() && P.usesB;
    var br = document.querySelector(".breath");
    if (br) br.classList.toggle("locked", on);
    ["#bPats", ".b-transport", "#bSensorRow", "#bPanel"].forEach(function (q) {   // out of reach of the keyboard too, not just the pointer
      var el = document.querySelector(q);
      if (el) el.inert = on;
    });
    $("#bLockNote").hidden = !on;
    if (on) bSetT("#bLockTxt", P.def.name + " is using the breathing guide.");
  }
  function pOpen() { if (P.def) location.hash = "practice/" + P.def.id; }

  /* ----- Today: a suggestion for the time of day ----- */
  function pSuggest() {
    var hr = new Date().getHours(), pick;
    if (hr >= 5 && hr < 9) pick = ["standing-flow", "This morning", "Wake the body up with a few minutes of standing yoga."];
    else if (hr >= 9 && hr < 12) pick = ["focus-primer", "Before you work", "Steady your breath, then prime with beta before you start."];
    else if (hr >= 12 && hr < 17) pick = ["calm-reset", "This afternoon", "Ten minutes to bring stress down: cyclic sighs, then resonance breathing."];
    else if (hr >= 17 && hr < 21) pick = ["coherence", "This evening", "Heart-focused breathing at your resonance pace, with live coherence."];
    else pick = ["sleep-descent", "Tonight", "Slow breathing that fades into a delta beat as you fall asleep."];
    var d = pDef(pick[0]);
    bSetT("#sgWhen", pick[1]);
    bSetT("#sgName", d.name + " · " + pMinutes(d) + " min");
    bSetT("#sgTxt", pick[2]);
    $("#sgGo").href = "#practice/" + d.id;
    $("#homeSuggest").style.setProperty("--pcol", pColor(d));
  }

  function pSleepyStep(s) { return !!s.sleepy || s.k === "drift" || s.k === "nap" || s.k === "shuffle"; }
  function pInit() {
    stLoad();
    P.opt = pOptDefaults();
    var cs = getComputedStyle(document.documentElement);
    ["relax", "stim", "ther", "accent"].forEach(function (k) { P.col[k] = cs.getPropertyValue("--" + k).trim() || "#5eead4"; });
    P.col.warm = "#f5b97a";
    P.cv = $("#sCanvas");
    P.ctx = P.cv && P.cv.getContext ? P.cv.getContext("2d") : null;
    if (window.ResizeObserver && P.cv) new ResizeObserver(function () { pSizeCanvas(); }).observe($("#sStage"));
    window.addEventListener("resize", pSizeCanvas);

    $("#sPlay").addEventListener("click", function () { if (P.state === "running") pPause(); else pResume(); });
    $("#sPrev").addEventListener("click", function () { pJump(-1); });
    $("#sNext").addEventListener("click", function () { pJump(1); });
    $("#sEnd").addEventListener("click", function () {
      if (!pBusy()) return;
      if (P.endArm && bNow() - P.endArm < 3) { P.endArm = 0; pFinish(true); return; }
      P.endArm = bNow();
      bSetT("#sEndTxt", "Tap to end");
      this.classList.add("armed");
      var b = this;
      setTimeout(function () { b.classList.remove("armed"); bSetT("#sEndTxt", "End"); }, 3000);
    });
    $("#sqRestart").addEventListener("click", function () {      // two taps, like End
      if (!pBusy()) return;
      var b = this;
      if (P.rsArm && bNow() - P.rsArm < 3) { P.rsArm = 0; b.classList.remove("armed"); bSetT("#sqRestartTxt", "Restart"); pRestart(); return; }
      P.rsArm = bNow();
      b.classList.add("armed");
      bSetT("#sqRestartTxt", "Tap again to restart");
      setTimeout(function () { if (P.rsArm && bNow() - P.rsArm >= 2.9) { P.rsArm = 0; b.classList.remove("armed"); bSetT("#sqRestartTxt", "Restart"); } }, 3000);
    });
    $("#sAdj").addEventListener("click", function (e) {
      var b = e.target.closest("button");
      if (!b || b.getAttribute("aria-disabled") === "true") return;
      if (b.id === "sAdjBtOn") { pBeatToggle(); return; }
      var d = parseInt(b.dataset.d, 10);
      if (b.closest("#sAdjBr")) pPaceStep(d); else pBeatStep(d);
    });
    $("#sTap").addEventListener("click", function () {
      var s = P.steps[P.idx];
      if (!s || !pBusy()) return;
      if (P.state === "paused") pResume();            // tapping the step's own button carries on
      if (s.k === "count") {
        if (P.taps >= s.n) return;
        P.taps++;
        pDots(s);
        if (P.taps >= s.n && !P.countDone) {
          P.countDone = true;
          var idx = P.idx;
          setTimeout(function () { if (P.idx === idx && P.state === "running") pJump(1); }, 900);
        }
      } else if (s.k === "hold" && s.open) {
        pAdvance();
        return;
      } else if (s.wander) {
        P.wander++;
        bSetT("#sLine", "Noticed. Back to " + (s.back || "the breath at the nostrils") + ".");
      }
      pUI();
    });
    var rg = "";
    for (var v = 0; v <= 10; v++) rg += '<button data-v="' + v + '" aria-pressed="false" style="--tint:' + v * 3 + '%">' + v + "</button>";
    $("#sRateG").innerHTML = rg;
    $("#sRateG").addEventListener("click", function (e) { var b = e.target.closest("button"); if (b) pRate(+b.dataset.v); });
    $("#sRateSkip").addEventListener("click", function () { pRate(null); });
    $("#sqVoice").addEventListener("click", function () {
      P.opt.voice = !P.opt.voice; pSaveOpt(); if (!P.opt.voice) pHush(); pQuickSync();
    });
    $("#sqBells").addEventListener("click", function () { P.opt.bells = !P.opt.bells; pSaveOpt(); pQuickSync(); });
    $("#sqRhy").addEventListener("click", function () {
      P.opt.rhythm = !P.opt.rhythm; pSaveOpt(); pQuickSync();
      if (P.state === "running") pRhythm(P.steps[P.idx], pT());
    });
    $("#sqAmb").addEventListener("click", function () {      // cycles: off, rain, crickets, both
      var ks = AMB_KINDS.map(function (k) { return k[0]; });
      ambSet(ks[(ks.indexOf(AMB.kind) + 1) % ks.length], true);
    });
    $("#sqVol").addEventListener("input", function () {
      var v = $("#vol");
      v.value = this.value;
      v.dispatchEvent(new Event("input"));
    });
    $("#bLockBtn").addEventListener("click", pOpen);
    /* Space pauses and resumes the practice on its screen, and anywhere while the practice's own
       sound is playing (the old Space shortcut leaves those to this one); the arrows move between steps. */
    document.addEventListener("keydown", function (e) {
      if (!pBusy() || kbSkip(e)) return;
      var here = curView === "session" && !$("#sRun").hidden;
      if (e.code === "Space" && (here || pTrack())) { e.preventDefault(); if (P.state === "running") pPause(); else pResume(); }
      else if (here && e.key === "ArrowRight") { e.preventDefault(); pJump(1); }
      else if (here && e.key === "ArrowLeft") { e.preventDefault(); pJump(-1); }
    });
    document.addEventListener("visibilitychange", function () {
      if (!document.hidden) wlSync();
      if (!document.hidden && P.state === "running") { pTick(); pLoop(); }
    });
    setInterval(wlSync, 15000);
    if (window.speechSynthesis && speechSynthesis.addEventListener) speechSynthesis.addEventListener("voiceschanged", pFillVoices);
    window.addEventListener("pagehide", function () { if (pBusy()) pHush(); });
    setInterval(function () { if (pBusy()) pPill(); }, 1000);
    if (store.get("debug")) window.__entrain = { P: P, A: A, B: B, BC: BC, H: H, pPlan: pPlan, pDef: pDef, RHY: RHY, AMB: AMB, AM: AM, ASANA: ASANA, pMovePhase: pMovePhase, QUOTES: QUOTES, qDay: qDay, AD: AD, NP: function () { return NP; }, WL: WL, wlSync: wlSync, PRACTICES: PRACTICES, BREATHS: BREATHS, TRACKS: TRACKS, ST: ST, pOptsOf: pOptsOf, pDone: pDone, MS: MS, TN: TN, libAll: libAll, libNames: libNames, LIB: LIB, MP: MP };   // for automated tests only
  }
