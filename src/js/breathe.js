  /* ------------------------- breathing guide -------------------------
     A breath is modelled as a lung "level" from 0 (empty) to 1 (full)
     moving through up to five phases: in, an optional second sip (the
     cyclic sigh), a hold at the top, out, and a hold at the bottom. In and
     out use a cosine ease, so equal in/out with no holds traces an exact
     sine wave at the breathing frequency.

     The clock is performance.now(). Drawing runs on requestAnimationFrame;
     phase changes, the session end and audio-cue scheduling run on a
     100 ms interval, so they carry on (more coarsely) in a background tab.
     Timing edits made mid-session take effect from the next breath, so the
     shape never jumps under you.
  -------------------------------------------------------------------- */

  var BREATHS = [
    {
      id: "resonance", strength: 3,
      t: { inh: 5.5, sip: 0, hold: 0, exh: 5.5, rest: 0 },
      desc: "Equal, unhurried breaths in and out at about 5.5 a minute, with no holds. This is the pace used in heart-rate-variability biofeedback.",
      ev: "Near 5.5 to 6 breaths a minute, the rise and fall in heart rate that each breath causes falls into step with the baroreflex, the loop that steadies blood pressure, and the two reinforce each other, so heart-rate variability peaks. A meta-analysis of 223 studies found slow breathing raised vagally mediated HRV during a session, straight after one, and after multi-session training.",
      cite: "Lehrer & Gevirtz 2014, Front. Psychol. · Laborde et al. 2022, Neurosci. Biobehav. Rev."
    },
    {
      id: "sigh", strength: 2,
      t: { inh: 3, sip: 1, hold: 0, exh: 6, rest: 0 },
      desc: "A slow inhale through the nose, a short second sip to fill the lungs completely, then a long exhale through the mouth.",
      ev: "In a month-long randomised trial, five minutes a day of cyclic sighing raised positive mood more than mindfulness meditation did, and lowered resting breathing rate more as well. It was the most effective of the four practices tested. Participants set their own pace, so treat these timings as a starting point.",
      cite: "Balban et al. 2023, Cell Rep. Med."
    },
    {
      id: "exhale", strength: 2,
      t: { inh: 3, sip: 0, hold: 0, exh: 7, rest: 0 },
      desc: "Six breaths a minute with the out-breath more than twice as long as the in-breath, close to the ratio used in the trial.",
      ev: "At six breaths a minute, a short inhale with a long exhale (an inhale-to-exhale ratio of 0.42) was rated more relaxing than the reverse ratio and produced more high-frequency heart-rate variability, the component linked to vagal activity.",
      cite: "Van Diest et al. 2014, Appl. Psychophysiol. Biofeedback"
    },
    {
      id: "box", strength: 2,
      t: { inh: 4, sip: 0, hold: 4, exh: 4, rest: 4 },
      desc: "Four equal sides: in, hold, out, hold. Steady and easy to count.",
      ev: "Box breathing was one of the four practices in the cyclic-sighing trial. Mood improved over the month, but less than with cyclic sighing, and the difference from meditation was not significant. The trial set each side at 3 to 10 seconds depending on how long a person could comfortably exhale, so shorten the sides if the holds strain.",
      cite: "Balban et al. 2023, Cell Rep. Med."
    },
    {
      id: "478", strength: 1,
      t: { inh: 4, sip: 0, hold: 7, exh: 8, rest: 0 },
      desc: "A popular wind-down before sleep: in for 4, hold for 7, out for 8.",
      ev: "In a small study of 44 young adults, a session of 4-7-8 breathing lowered heart rate and blood pressure immediately afterwards and shifted heart-rate variability toward parasympathetic activity, whether or not they had slept the night before. Beyond that the evidence is thin. The long hold is demanding, so scale all three numbers down together if it strains.",
      cite: "Vierra et al. 2022, Physiol. Rep."
    }
  ];

  var B_KIND = {
    "in":   { name: "Breathe in",  short: "In" },
    "sip":  { name: "Top up",      short: "Sip" },
    "hold": { name: "Hold",        short: "Hold" },
    "out":  { name: "Breathe out", short: "Out" },
    "rest": { name: "Hold",        short: "Hold" }
  };

  var B_VIS_HINT = {
    circle: "The circle grows as you breathe in and shrinks as you breathe out. The outer arc fills as each phase runs.",
    wave: "Your breath as a wave scrolling past the marker. Equal in and out with no holds is a pure sine; holds are the flat stretches. What comes next is labelled along the bottom. With a heart sensor connected, your heart rate is drawn over it in pink.",
    box: "Trace the square: up on the in-breath, across the top on the hold, down on the out-breath, back along the bottom.",
    dial: "One lap of the dial is one breath, divided by phase. The centre swells with each in-breath.",
    column: "The column fills like your lungs and drains as you breathe out."
  };

  var B_FIELDS = [
    { k: "inh",  id: "#bInh",  min: 1, max: 10, opt: false },
    { k: "sip",  id: "#bSip",  min: 0, max: 2,  opt: true },
    { k: "hold", id: "#bHold", min: 0, max: 10, opt: true },
    { k: "exh",  id: "#bExh",  min: 1, max: 12, opt: false },
    { k: "rest", id: "#bRest", min: 0, max: 10, opt: true }
  ];

  var B_LEAD = 3;           // seconds of "get ready" before the first inhale
  var B_SIP = 0.8;          // lung level the first inhale reaches when a second sip follows
  var B_TONE = 698.46;      // F5: the rising tone runs F5 to C6, above every carrier on the page
  var B_CHIME = { "in": 1046.5, "sip": 1318.5, "hold": 783.99, "out": 659.25, "rest": 523.25 };
  var TONE_LEVEL = { "in": 1, "sip": 1, "hold": 0.5, "out": 0.22, "rest": 0.03 };
  var B_SANS = 'system-ui,-apple-system,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif';
  var B_MONO = '"Entrain Display",system-ui,-apple-system,"Segoe UI",Roboto,sans-serif';   // the big countdown digits

  var BC = {
    pattern: "resonance", inh: 5.5, sip: 0, hold: 0, exh: 5.5, rest: 0,
    visual: "circle", minutes: 5, sound: "off", cue: 40, buzz: false
  };

  var B = {
    state: "idle",            // idle | running | paused | done
    t0: 0, st: 0,             // clock origin while running; frozen session time otherwise
    ph: null, pending: null,  // phases in use, and an edit waiting for the next breath
    epoch: 0, done: 0, total: 0,
    raf: 0, tick: 0, key: "", segOn: -1, schedTo: 0,
    buzzAt: -Infinity, buzzT: 0, buzzWas: -Infinity,   // the last change that buzzed, the buzz waiting for the next, and the one before it
    voice: null, bus: null, doneMsg: "", doneCount: 0, doneSecs: 0,
    hr: [],                   // heart samples this session: {bt, hr, n (breath index), cyc}
    swings: [], hrDone: 0,    // per-breath heart-rate swing, and the next breath to score
    coh: [],                  // coherence scores taken during this session
    finder: null              // the resonance test, while it runs
  };

  function sessTime() { return B.state === "running" ? bNow() - B.t0 : B.st; }
  function breathTime() { return sessTime() - B_LEAD; }
  function fmtS(s) { return (s % 1 ? s.toFixed(1) : String(s)) + "s"; }
  function preset(id) {
    for (var i = 0; i < BREATHS.length; i++) if (BREATHS[i].id === id) return BREATHS[i];
    return null;
  }
  /* During the resonance test BC holds the test's timings; save the viewer's own. */
  function saveBreath() {
    if (P.usesB) return;                 // a practice's timings are never saved as the viewer's own
    var c = BC;
    if (B.finder) {
      c = B.finder.saved;
      c.visual = BC.visual; c.sound = BC.sound; c.cue = BC.cue; c.buzz = BC.buzz;
    }
    store.set("breath", JSON.stringify(c));
  }

  function buildPhases(c) {
    var list = [];
    if (c.sip > 0) {
      list.push({ k: "in", secs: c.inh, from: 0, to: B_SIP });
      list.push({ k: "sip", secs: c.sip, from: B_SIP, to: 1 });
    } else {
      list.push({ k: "in", secs: c.inh, from: 0, to: 1 });
    }
    if (c.hold > 0) list.push({ k: "hold", secs: c.hold, from: 1, to: 1 });
    list.push({ k: "out", secs: c.exh, from: 1, to: 0 });
    if (c.rest > 0) list.push({ k: "rest", secs: c.rest, from: 0, to: 0 });
    var t = 0;
    for (var i = 0; i < list.length; i++) { list[i].i = i; list[i].start = t; t += list[i].secs; }
    return { list: list, cycle: t, sig: list.map(function (p) { return p.k + p.secs; }).join("|") };
  }

  /* Where in the session a breath-time falls. Pure: a pending timing edit is
     applied virtually from the end of the breath that was in progress. */
  function locate(bt) {
    var ph = B.ph, epoch = B.epoch, done = B.done;
    if (B.pending && bt >= epoch + ph.cycle) { epoch += ph.cycle; done += 1; ph = B.pending; }
    var rel = Math.max(0, bt - epoch);
    var idx = Math.floor(rel / ph.cycle + 1e-9);
    var ct = Math.max(0, rel - idx * ph.cycle);
    var p = ph.list[ph.list.length - 1];
    for (var i = 0; i < ph.list.length; i++) {
      if (ct < ph.list[i].start + ph.list[i].secs) { p = ph.list[i]; break; }
    }
    return {
      ph: ph, count: done + idx, ct: ct, p: p,
      prog: Math.min(1, Math.max(0, (ct - p.start) / p.secs)),
      pStart: epoch + idx * ph.cycle + p.start
    };
  }
  function bEase(x) { return (1 - Math.cos(Math.PI * x)) / 2; }
  function levelOf(L) { return L.p.from + (L.p.to - L.p.from) * bEase(L.prog); }
  function levelAt(bt) { return bt < 0 ? 0 : levelOf(locate(bt)); }

  function endBt() { return B.epoch + (B.total - B.done) * B.ph.cycle; }
  function planTotal() {
    if (!BC.minutes) { B.total = 0; return; }
    B.total = B.done + Math.max(1, Math.round((BC.minutes * 60 - B.epoch) / B.ph.cycle));
  }
  function commitPending(bt) {
    if (!B.pending || bt < B.epoch + B.ph.cycle) return;
    if (B.total && B.epoch + B.ph.cycle >= endBt() - 1e-6) return;  // the session ends at that boundary anyway
    B.epoch += B.ph.cycle;
    B.done += 1;
    B.ph = B.pending;
    B.pending = null;
    planTotal();
    renderLine();
    bSetT("#bMsg", "");
  }
  /* Move the epoch up to the start of the breath in progress. */
  function normalize(bt) {
    if (bt < 0) return;
    commitPending(bt);
    var idx = Math.floor((bt - B.epoch) / B.ph.cycle + 1e-9);
    if (idx > 0) { B.epoch += idx * B.ph.cycle; B.done += idx; }
  }

  function applyTimings() {
    var ph = buildPhases(BC);
    if (B.state === "idle" || B.state === "done") {
      if (B.state === "done") B.state = "idle";
      B.ph = ph; B.pending = null; B.epoch = 0; B.done = 0;
      planTotal();
      syncTransport();
    } else {
      var bt = breathTime();
      if (bt < 0) {
        B.ph = ph; B.pending = null; planTotal();
      } else {
        normalize(bt);
        if (ph.sig === B.ph.sig) { B.pending = null; bSetT("#bMsg", ""); }
        else { B.pending = ph; bSetT("#bMsg", "New timings start with the next breath."); }
      }
    }
    renderLine();
    syncRate();
    updateHead();
    draw();
  }

  /* ----- controls ----- */

  function cycleOf(c) { return c.inh + c.sip + c.hold + c.exh + c.rest; }
  function syncRate() {
    var cyc = cycleOf(BC);
    bSetT("#bRateV", (60 / cyc).toFixed(1) + " breaths/min");
    bSetT("#bRateS", (1 / cyc).toFixed(3) + " Hz · " + cyc.toFixed(1) + " s a breath");
  }
  function renderLine() {
    $("#bSegs").innerHTML = B.ph.list.map(function (p) {
      return '<div class="b-seg" data-k="' + p.k + '" style="flex:' + p.secs + ' 1 0">' +
        B_KIND[p.k].short + " " + fmtS(p.secs) + "</div>";
    }).join("");
    B.segOn = -1;
  }
  function syncFields() {
    B_FIELDS.forEach(function (f) {
      $(f.id).value = BC[f.k];
      bSetT(f.id + "V", (f.opt && !BC[f.k]) ? "Off" : BC[f.k].toFixed(1) + " s");
    });
  }
  function matchPreset() {
    for (var i = 0; i < BREATHS.length; i++) {
      var t = BREATHS[i].t;
      if (t.inh === BC.inh && t.sip === BC.sip && t.hold === BC.hold && t.exh === BC.exh && t.rest === BC.rest) {
        return BREATHS[i].id;
      }
    }
    return "custom";
  }
  function renderNote() {
    bFavSync();
    var p = preset(BC.pattern);
    if (p) {
      bSetT("#bDesc", p.desc);
      $("#bEvSum").innerHTML = "Evidence " + dots(p.strength);
      bSetT("#bEvTxt", p.ev);
      bSetT("#bCite", p.cite);
      $("#bEv").hidden = false;
      return;
    }
    var rate = 60 / cycleOf(BC);
    var s = "Your own timings: " + rate.toFixed(1) + " breaths a minute. " + (rate <= 10
      ? "That is inside the under-10-a-minute range most slow-breathing studies used."
      : "That is faster than the under-10-a-minute range most slow-breathing studies used.");
    if (BC.exh > BC.inh + BC.sip) s += " The exhale is longer than the inhale, the ratio rated more relaxing at slow rates.";
    bSetT("#bDesc", s);
    $("#bEv").hidden = true;
  }
  function syncChips(sel) {
    var chips = $(sel).querySelectorAll(".chip");
    for (var i = 0; i < chips.length; i++) chips[i].classList.toggle("on", chips[i].querySelector("input").checked);
  }
  function checkRadio(name, val) {
    var el = document.querySelector('input[name="' + name + '"][value="' + val + '"]');
    if (el) el.checked = true;
  }
  function syncVisHint() {
    var s = B_VIS_HINT[BC.visual] || "";
    if (BC.visual === "box" && !BC.hold && !BC.rest) s += " This pattern has no holds, so the top and bottom sides are skipped.";
    bSetT("#bVisHint", s);
  }
  function syncTransport() {
    var st = B.state;
    bSetT("#bStart", st === "running" ? "Pause" : st === "paused" ? "Resume" : st === "done" ? "Start again" : "Start breathing");
    $("#bReset").disabled = st === "idle";
  }
  function kindHint(k) {
    if (k === "in") return BC.sip > 0 ? "Slowly, through your nose." : "Slow and smooth, through your nose.";
    if (k === "sip") return "A short second sip to fill your lungs.";
    if (k === "hold") return "Lungs full. Keep your shoulders soft.";
    if (k === "out") return BC.sip > 0 ? "Long and slow, through your mouth." : "Long and slow. Let it go.";
    return "Lungs empty. Wait for the next breath.";
  }

  function updateHead() {
    var st = B.state, bt = breathTime(), k, name, hint, L = null;
    if (st === "idle") { k = "ready"; name = "Ready"; hint = "Press start, then follow the shape."; }
    else if (st === "done") { k = "done"; name = "Done"; hint = B.doneMsg; }
    else if (bt < 0) { k = "lead"; name = "Get ready"; hint = "Let your breath settle. First inhale in " + Math.ceil(-bt - 1e-6) + "…"; }
    else {
      L = locate(bt); k = L.p.k; name = B_KIND[k].name;
      hint = st === "paused" ? "Paused. Press resume to carry on from here." : kindHint(k);
    }
    var stage = $("#bStage");
    if (stage.dataset.phase !== k) stage.dataset.phase = k;
    bSetT("#bPhase", name);
    bSetT("#bHint", hint);

    var tot = B.total, cur;
    if (st === "idle") cur = 0;
    else if (st === "done") cur = B.doneCount;
    else cur = L ? L.count + 1 : 0;
    if (tot && cur > tot) cur = tot;
    bSetT("#bCount", String(cur));
    bSetT("#bOf", (tot && st !== "done") ? " / " + tot : "");

    var clock, lab;
    if (st === "done") { clock = B.doneSecs; lab = "total"; }
    else if (!BC.minutes || B.finder) { clock = st === "idle" ? 0 : Math.max(0, bt); lab = "elapsed"; }
    else { clock = endBt() - (st === "idle" ? 0 : Math.max(0, bt)); lab = "left"; }
    bSetT("#bClock", fmt(Math.max(0, clock)));
    bSetT("#bClockL", lab);

    var key = st + ":" + (L ? L.count + ":" + L.p.i : k);
    if (key !== B.key) { B.key = key; if (st === "running") bSetT("#bLive", name); }
  }

  /* ----- transport ----- */

  function bFresh() {
    B.ph = buildPhases(BC); B.pending = null; B.epoch = 0; B.done = 0; planTotal();
    B.st = 0; B.key = ""; B.schedTo = -B_LEAD;
    B.buzzAt = -Infinity; clearTimeout(B.buzzT);
    B.hr = []; B.swings = []; B.hrDone = 0; B.coh = [];
    renderLine();
    bSetT("#bMsg", "");
    drawSwings(); hrTiles();
  }
  function bToggle() {
    if (P.usesB && pBusy()) { pOpen(); return; }
    if (B.state === "running") bPause();
    else if (B.state === "paused") bResume();
    else { bFresh(); bResume(); }
  }
  function bResume() {
    B.t0 = bNow() - B.st;
    B.state = "running";
    if (BC.sound !== "off") cueOn();
    acquireLock();
    clearInterval(B.tick);
    B.tick = setInterval(bTick, 100);
    syncTransport();
    bTick();
    cancelAnimationFrame(B.raf);
    bLoop();
  }
  function bPause() {
    if (B.state !== "running") return;
    B.st = sessTime();
    B.state = "paused";
    clearInterval(B.tick);
    cancelAnimationFrame(B.raf);
    cueOff();
    bBuzzOff();
    releaseLock();
    syncTransport(); updateHead(); draw();
  }
  function bStop() {
    clearInterval(B.tick);
    cancelAnimationFrame(B.raf);
    cueOff();
    clearTimeout(B.buzzT);
    releaseLock();
    if (B.state !== "idle" && B.state !== "done") {
      var bt = breathTime();
      if (bt >= 0) hrFinalize(locate(bt).count);
      if (!P.usesB) hrSummary();
      hBreath(Math.max(0, bt), false);
    }
    if (B.finder) finderCancel();
    B.state = "idle";
    bFresh();
    syncTransport(); updateHead(); draw(); finderUI();
  }
  /* Shared ending for a timed session and the resonance test. */
  function bEnd(count, secs, msg) {
    clearInterval(B.tick);
    cancelAnimationFrame(B.raf);
    cueOff();
    clearTimeout(B.buzzT);
    buzz("end");
    if (BC.sound !== "off" && B.bus && A.ctx) {
      var t = A.ctx.currentTime + 0.05;
      chime(B_CHIME.out, t, 0.2);
      chime(B_CHIME.sip, t + 0.42, 0.16);
    }
    hrFinalize(count);
    hrSummary();
    B.state = "done";
    B.doneCount = count;
    B.doneSecs = secs;
    B.doneMsg = msg;
    releaseLock();
  }
  function bFinish() {
    var secs = endBt(), n = B.total;
    bEnd(n, secs, n + " breaths in " + fmt(secs) + ". Breathe normally for a minute before you get up.");
    hBreath(secs, true);
    syncTransport(); updateHead(); draw();
    bSetT("#bLive", "Session complete.");
  }
  function bTick() {
    if (B.state !== "running") return;
    var bt = breathTime();
    if (bt >= 0 && B.total && bt >= endBt()) { bFinish(); return; }
    if (bt >= 0) {
      commitPending(bt);
      hrFinalize(locate(bt).count);
    }
    bSchedule(bt);
    bBuzz(bt);
    updateHead();
    if (B.finder) finderTick(bt);
  }
  function bLoop(ts) {
    if (B.state !== "running") return;
    if (frameDue(B, ts)) draw();
    B.raf = requestAnimationFrame(bLoop);
  }

  /* ----- sound cues: their own bus straight to the output, both ears ----- */

  function cueGain() { var v = BC.cue / 100; return v * v * 0.9; }
  function toneHz(lv) { return B_TONE * Math.pow(1.5, lv); }
  function ensureBus() {
    if (!ensureCtx()) return false;
    if (!B.bus) { B.bus = A.ctx.createGain(); B.bus.gain.value = 0; B.bus.connect(A.ctx.destination); }
    var now = A.ctx.currentTime;
    B.bus.gain.cancelScheduledValues(now);
    B.bus.gain.setTargetAtTime(cueGain(), now, 0.04);
    return true;
  }
  function cueOn() {
    if (!ensureBus()) return;
    var ctx = A.ctx, now = ctx.currentTime, bt = breathTime();
    B.schedTo = bt;
    if (BC.sound !== "tones") return;
    if (!B.voice) {
      var o = ctx.createOscillator(), vg = ctx.createGain();
      o.type = "sine"; o.frequency.value = B_TONE; vg.gain.value = 0;
      o.connect(vg); vg.connect(B.bus); o.start();
      B.voice = { o: o, g: vg };
    }
    var f = B.voice.o.frequency, gg = B.voice.g.gain;
    f.cancelScheduledValues(now); gg.cancelScheduledValues(now);
    gg.setValueAtTime(0, now);
    if (bt >= 0) {
      var L = locate(bt);
      f.setValueAtTime(toneHz(levelOf(L)), now);
      toneTo(L.p, now, L.p.secs * (1 - L.prog));
    } else {
      f.setValueAtTime(B_TONE, now);
    }
  }
  function cueOff() {
    if (!B.voice || !A.ctx) { B.voice = null; return; }
    var v = B.voice, t = A.ctx.currentTime;
    v.o.frequency.cancelScheduledValues(t);
    v.g.gain.cancelScheduledValues(t);
    v.g.gain.setTargetAtTime(0, t, 0.08);
    setTimeout(function () { try { v.o.stop(); v.o.disconnect(); v.g.disconnect(); } catch (e) {} }, 700);
    B.voice = null;
  }
  /* Glide the tone toward this phase's target. setTargetAtTime starts from
     wherever the previous phase left the value, so no anchors are needed. */
  function toneTo(p, when, dur) {
    if (!B.voice) return;
    var tc = Math.max(0.04, dur / 3.2);
    B.voice.o.frequency.setTargetAtTime(toneHz(p.to), when, tc);
    B.voice.g.gain.setTargetAtTime(0.22 * TONE_LEVEL[p.k], when, (p.k === "hold" || p.k === "rest") ? 0.3 : tc);
  }
  function chime(hz, when, peak) {
    if (!A.ctx || !B.bus) return;
    var ctx = A.ctx;
    var o1 = ctx.createOscillator(), o2 = ctx.createOscillator();
    var g1 = ctx.createGain(), g2 = ctx.createGain();
    o1.type = "sine"; o1.frequency.value = hz;
    o2.type = "sine"; o2.frequency.value = hz * 2.76;      // the inharmonic partial that makes it ring like a bell
    g1.gain.setValueAtTime(0, when);
    g1.gain.linearRampToValueAtTime(peak, when + 0.012);
    g1.gain.exponentialRampToValueAtTime(0.0001, when + 1.9);
    g2.gain.setValueAtTime(0, when);
    g2.gain.linearRampToValueAtTime(peak * 0.25, when + 0.008);
    g2.gain.exponentialRampToValueAtTime(0.0001, when + 0.55);
    o1.connect(g1); o2.connect(g2); g1.connect(B.bus); g2.connect(B.bus);
    o1.start(when); o2.start(when);
    o1.stop(when + 2); o2.stop(when + 0.6);
    o1.onended = function () { try { o1.disconnect(); o2.disconnect(); g1.disconnect(); g2.disconnect(); } catch (e) {} };
  }
  /* Queue a cue for every phase boundary inside a short horizon, on the audio
     clock. The horizon widens in a background tab, where timers fire ~1/s. */
  function bSchedule(bt) {
    if (BC.sound === "off" || !A.ctx || !B.bus) return;
    var horizon = bt + (document.hidden ? 1.6 : 0.4);
    var cur = Math.max(B.schedTo, bt), guard = 0;
    while (guard++ < 12) {
      var nb;
      if (cur < 0) nb = 0;
      else { var Lc = locate(cur + 1e-6); nb = Lc.pStart + Lc.p.secs; }
      if (nb > horizon) break;
      if (B.total && nb >= endBt() - 1e-6) break;          // the closing chime belongs to bFinish
      var L = locate(nb + 1e-6), when = A.ctx.currentTime + (nb - bt);
      if (BC.sound === "chimes") chime(B_CHIME[L.p.k], when, (L.p.k === "hold" || L.p.k === "rest") ? 0.13 : 0.2);
      else toneTo(L.p, when, L.p.secs);
      cur = nb;
    }
    B.schedTo = cur;
  }
  /* ----- vibration: a buzz at each change, to breathe along with your eyes closed or without
     sound. In is one short buzz, out one long, a hold two light taps, and the end three. A phone
     only vibrates for a page on screen, which the guide keeps on by default. ----- */
  var BUZZ = { "in": [60], "sip": [30], "hold": [30, 90, 30], "out": [170], "rest": [30, 90, 30], end: [60, 110, 60, 110, 220] };
  function bzOk() { return !!navigator.vibrate && !!(window.matchMedia && window.matchMedia("(pointer: coarse)").matches); }
  function buzz(k) {
    if (!BC.buzz || !bzOk() || document.hidden) return;
    try { navigator.vibrate(BUZZ[k]); } catch (e) {}
  }
  // Vibration can't be queued on the audio clock like the sound cues, so each tick buzzes for a
  // change due before the next tick, on time, or for one that slipped between two ticks, a little late.
  function bBuzz(bt) {
    if (!BC.buzz || !bzOk()) return;
    var L = bt >= 0 ? locate(bt + 1e-6) : null, start = L ? L.pStart : 0, next = L ? L.pStart + L.p.secs : 0;
    if (L && start > B.buzzAt + 1e-6 && bt - start < 0.4) { B.buzzAt = start; buzz(L.p.k); return; }
    if (next > B.buzzAt + 1e-6 && next - bt <= 0.12 && !(B.total && next >= endBt() - 1e-6)) {
      B.buzzWas = B.buzzAt; B.buzzAt = next;
      var k = locate(next + 1e-6).p.k;
      clearTimeout(B.buzzT);
      B.buzzT = setTimeout(function () { B.buzzT = 0; if (B.state === "running") buzz(k); }, Math.max(0, (next - bt) * 1000));
    }
  }
  // a pause just before a change: that change hasn't buzzed yet, so it still will after the pause
  function bBuzzOff() {
    if (B.buzzT) { clearTimeout(B.buzzT); B.buzzT = 0; B.buzzAt = B.buzzWas; }
  }
  function bBuzzSync() {
    $("#bBuzzRow").hidden = !bzOk();
    $("#bBuzz").checked = !!BC.buzz;
  }

  /* Let people hear a cue when they pick it, before they start. */
  function preview() {
    if (BC.sound === "off" || B.state === "running" || !ensureBus()) return;
    var ctx = A.ctx, t = ctx.currentTime + 0.03;
    if (BC.sound === "chimes") { chime(B_CHIME["in"], t, 0.2); return; }
    var o = ctx.createOscillator(), vg = ctx.createGain();
    o.type = "sine";
    o.frequency.setValueAtTime(B_TONE, t);
    o.frequency.setTargetAtTime(toneHz(1), t, 0.45);
    vg.gain.setValueAtTime(0, t);
    vg.gain.setTargetAtTime(0.22, t, 0.3);
    vg.gain.setTargetAtTime(0, t + 1.4, 0.2);
    o.connect(vg); vg.connect(B.bus);
    o.start(t); o.stop(t + 2.6);
    o.onended = function () { try { o.disconnect(); vg.disconnect(); } catch (e) {} };
  }

  /* The screen stays on while a session runs: one lock, shared with practices and tracks. */
  function acquireLock() { wlKick(); }
  function releaseLock() { wlKick(); }

  function setFocus(on) {
    var st = $("#bStage");
    st.classList.toggle("focus", on);
    document.body.classList.toggle("b-lock", on);
    bSetT("#bFocus", on ? "Exit focus" : "Focus view");
    try {
      if (on && st.requestFullscreen && !document.fullscreenElement) {
        var p = st.requestFullscreen();
        if (p && p.catch) p.catch(function () {});
      } else if (!on && document.fullscreenElement) {
        var q = document.exitFullscreen();
        if (q && q.catch) q.catch(function () {});
      }
    } catch (e) {}
    if (on) $("#bStart").focus();
    sizeCanvas();
  }

  function initBreath() {
    try {
      var saved = JSON.parse(store.get("breath") || "null");
      if (saved && typeof saved === "object") {
        B_FIELDS.forEach(function (f) {
          var v = parseFloat(saved[f.k]);
          if (isFinite(v) && v >= f.min && v <= f.max) BC[f.k] = Math.round(v * 2) / 2;
        });
        if (BVIS[saved.visual]) BC.visual = saved.visual;
        if (["off", "tones", "chimes"].indexOf(saved.sound) >= 0) BC.sound = saved.sound;
        if ([0, 2, 5, 10, 15].indexOf(saved.minutes) >= 0) BC.minutes = saved.minutes;
        var cue = parseInt(saved.cue, 10);
        if (cue >= 0 && cue <= 100) BC.cue = cue;
        if (typeof saved.buzz === "boolean") BC.buzz = saved.buzz;
        BC.pattern = (saved.pattern === "custom") ? "custom" : matchPreset();
      }
    } catch (e) {}

    readColors();
    checkRadio("bpat", BC.pattern);
    checkRadio("bvis", BC.visual);
    checkRadio("blen", String(BC.minutes));
    checkRadio("bsnd", BC.sound);
    ["#bPats", "#bVis", "#bLen", "#bSnd"].forEach(syncChips);
    $("#bCue").value = BC.cue;
    $("#bVolRow").hidden = BC.sound === "off";
    bBuzzSync();

    B.ph = buildPhases(BC);
    planTotal();
    syncFields(); syncRate(); renderNote(); syncVisHint(); renderLine(); syncTransport(); updateHead();

    $("#bPats").addEventListener("change", function (e) {
      if (B.finder) finderCancel();
      checkRadio("bpat", e.target.value);
      syncChips("#bPats");
      BC.pattern = e.target.value;
      var p = preset(BC.pattern);
      if (p) {
        BC.inh = p.t.inh; BC.sip = p.t.sip; BC.hold = p.t.hold; BC.exh = p.t.exh; BC.rest = p.t.rest;
        syncFields();
      }
      renderNote(); syncVisHint(); applyTimings(); saveBreath();
    });
    B_FIELDS.forEach(function (f) {
      $(f.id).addEventListener("input", function () {
        var v = parseFloat(this.value);
        if (B.finder) finderCancel();
        BC[f.k] = v;
        var id = matchPreset();
        if (id !== BC.pattern) { BC.pattern = id; checkRadio("bpat", id); syncChips("#bPats"); }
        syncFields(); renderNote(); syncVisHint(); applyTimings(); saveBreath();
      });
    });
    $("#bVis").addEventListener("change", function (e) {
      BC.visual = e.target.value;
      syncChips("#bVis"); syncVisHint(); draw(); saveBreath();
    });
    $("#bLen").addEventListener("change", function (e) {
      if (B.finder) finderCancel();
      checkRadio("blen", e.target.value);
      BC.minutes = parseInt(e.target.value, 10);
      syncChips("#bLen");
      if (B.state === "running" || B.state === "paused") normalize(breathTime());
      if (B.state === "done") { B.state = "idle"; bFresh(); syncTransport(); }
      planTotal(); updateHead(); saveBreath();
    });
    $("#bSnd").addEventListener("change", function (e) {
      BC.sound = e.target.value;
      syncChips("#bSnd");
      $("#bVolRow").hidden = BC.sound === "off";
      if (B.state === "running") { cueOff(); if (BC.sound !== "off") cueOn(); }
      else preview();
      saveBreath();
    });
    $("#bBuzz").addEventListener("change", function () {
      BC.buzz = this.checked;
      saveBreath();
      if (this.checked) buzz("in");          // feel it once
    });
    $("#bCue").addEventListener("input", function () {
      BC.cue = parseInt(this.value, 10);
      if (B.bus && A.ctx) B.bus.gain.setTargetAtTime(cueGain(), A.ctx.currentTime, 0.05);
      saveBreath();
    });
    $("#bCue").addEventListener("change", preview);

    $("#bStart").addEventListener("click", bToggle);
    $("#bReset").addEventListener("click", bStop);
    $("#bFocus").addEventListener("click", function () { setFocus(!$("#bStage").classList.contains("focus")); });

    document.addEventListener("fullscreenchange", function () {
      if (!document.fullscreenElement && $("#bStage").classList.contains("focus")) setFocus(false);
    });
    document.addEventListener("keydown", function (e) {
      if (!$("#bStage").classList.contains("focus")) return;
      if (e.key === "Escape") { setFocus(false); return; }
      if (e.code !== "Space") return;
      var tag = (e.target.tagName || "").toLowerCase();
      if (tag === "button" || tag === "input") return;   // the focused control handles its own Space
      e.preventDefault();
      bToggle();
    });
    document.addEventListener("visibilitychange", function () {
      if (!document.hidden && B.state === "running") { acquireLock(); bTick(); }
    });

    if (window.ResizeObserver) new ResizeObserver(function () { sizeCanvas(); }).observe($("#bView"));
    else window.addEventListener("resize", sizeCanvas);
    sizeCanvas();
  }

