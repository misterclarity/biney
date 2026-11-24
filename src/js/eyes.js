  /* ------------------------------- your eyes -------------------------------
     From the guide's vision techniques, three new techniques (supporter.js):
     - Eyes-closed cue, an option for relaxation practices (calm or sleep, sitting or lying, with paced
       breathing): closing the eyes raises alpha within seconds, one of the most reliable effects in EEG
       research, so at the first slow breaths a soft bell and "Close your eyes now; the sound will guide
       you", then the screen dims. The breath cues sound throughout (a tone where they'd be silent), and a
       later step with something to look at or tap brings a bell and "Open your eyes now". Never while
       walking: a practice done walking leaves it off.
     - Eyes closed, on Breathe: the visual goes dark, and the sound cues or vibration guide each breath
       (the rising tone comes on if both are off).
     - Gaze point: a still point whose soft glow swells with the breath, to rest the eyes on with them
       open. A visual on Breathe, and an option for focus practices in place of the orb, the still point
       and the breath visual. The guide calls it general practice, not researched, and so does the page.
  ------------------------------------------------------------------------------ */

  var EY_CUE = "Eyes-closed cue", EY_BREATHE = "Eyes closed on Breathe", EY_GAZE = "Gaze point";
  var EY_LINE = "Close your eyes now; the sound will guide you.";
  var EY_OPEN = "Open your eyes now.";
  var EY_GAZE_TXT = "Rest your eyes softly on the point; blink when you need to.";
  // relaxation practices that keep the eyes open for a reason of their own: the call beside a video, the meal in front
  // of you, a partner's eyes, the arm you stroke along with, Guided Imagery's own way in, and the fire you watch
  var EY_SKIP = ["call", "meal", "mindful-sex", "touch", "imagery", "fireside"];
  // steps with something to look at or tap: the eyes open again for them
  var EY_LOOK = ["rate", "write", "count", "tap", "pose", "sing", "stroke", "massage", "cold", "measure", "dance"];
  /* the running practice's cue: on, the step it came at (idx), whether the screen is dimmed for it (dim) */
  var EY = { on: false, idx: -1, cued: false, dim: false, gaze: false };

  /* ----- the eyes-closed cue, in a practice ----- */
  function eyBreathStep(s) { return !!s && s.k === "breath" && !s.pose; }
  function eyLooks(s) { return !!s && (EY_LOOK.indexOf(s.k) >= 0 || !!s.pose || !!s.tapfig || !!s.endTap || (s.k === "hold" && !!s.open) || s.vis === "scene"); }
  // a relaxation practice done sitting or lying: calm or sleep is what it's for, or good for, and it isn't for energy or focus
  function eyRelax(d) {
    if (!d || d.noEyes || d.stress || d.custom || EY_SKIP.indexOf(d.id) >= 0) return false;
    if (["move", "write", "measure"].indexOf(d.method) >= 0 || !d.posture) return false;
    if (d.posture.indexOf("sit") < 0 && d.posture.indexOf("lie") < 0) return false;
    if (d.goal === "energy" || d.goal === "focus") return false;
    return d.goal === "calm" || d.goal === "sleep" || (d.also || []).some(function (g) { return g === "calm" || g === "sleep"; });
  }
  var EY_FIT = {};                                   // practice id: whether its plan has paced breathing (worked out once)
  function eyFits(d) {
    if (!eyRelax(d)) return false;
    if (!(d.id in EY_FIT)) {
      var ok = false;
      try { ok = pPlan(d, pLenOf(d, 0)).steps.some(eyBreathStep); } catch (e) {}
      EY_FIT[d.id] = ok;
    }
    return EY_FIT[d.id];
  }
  function eyWalking(d) { return (d.choices || []).some(function (c) { return c.key === "pos"; }) && pChoice(d, "pos") === "walk"; }
  // at the start (pStart): the cue comes in this session when it's chosen, unlocked, sitting or lying, with breaths to cue
  function eyStart(d, steps) {
    EY.on = eyFits(d) && !!P.opt.eyes && supOn() && !eyWalking(d) && steps.some(eyBreathStep);
    EY.idx = -1; EY.cued = false; EY.dim = false;
    EY.gaze = eyGazeFits(d) && !!P.opt.gaze && supOn();
  }
  /* Each step as it begins (pEnter): at the first slow breaths, the cue goes in as a line of the step (a bell and the
     words), the step's own first words moving a few seconds later to make room, and the screen dims; after it the
     screen stays dim, until a step with something to look at or tap opens the eyes again. */
  function eyEnter(s) {
    if (!EY.on || P.state === "done") return;
    var ses = $("#ses");
    if (!EY.cued && eyBreathStep(s)) {
      EY.cued = true; EY.idx = P.idx; EY.dim = true;
      s.lines = eyRoom(s.lines || [], Math.max(0, pT() - s.at), s.secs);
      ses.dataset.dim = "1";
      return;
    }
    if (!EY.dim || P.idx < EY.idx) return;
    if (P.idx > EY.idx && eyLooks(s)) {
      EY.dim = false;
      if (P.state === "running") {
        pBell(0.3, A.ctx ? A.ctx.currentTime + 0.6 : 0, 783.99, 0, true);
        pSay(EY_OPEN, true);
      }
      return;
    }
    ses.dataset.dim = "1";
  }
  /* The step's lines with the cue a moment after st (where the step was entered: 0, unless it was jumped into): the lines
     already due stay as they are, and the step's own words come after the cue, the first of them six seconds after it */
  function eyRoom(lines, st, secs) {
    var c = st + 1.5;
    if (c >= secs - 1) return lines;
    var out = [], prev = c, gap = 6, put = false;
    lines.forEach(function (l) {
      if (l[0] < st - 0.25) { out.push(l); return; }
      if (!put) { out.push([c, EY_LINE, "eyes"]); put = true; }
      var t = Math.max(l[0], prev + gap);
      gap = 1;
      if (t >= secs - 0.5) return;                  // (only on a very short step: one that can't move goes unsaid)
      out.push([t].concat(l.slice(1)));
      prev = t;
    });
    if (!put) out.push([c, EY_LINE, "eyes"]);
    return out;
  }
  // the cue's line, as it's due (pTick): a soft bell that sounds even with the bells off, and the words, softly
  function eyCueSay(s) {
    pBell(0.32, 0, 523.25, 0, true);
    if (!s.mute) pSay(EY_LINE, true);
  }
  // the breath cues while the eyes are closed: a tone where they'd be silent (pBreathOn)
  function eyCues(c) { return EY.on && c === "off" ? "tones" : c; }

  /* ----- Options rows: the cue (relaxation practices), the gaze point (focus practices) ----- */
  function eyCueRow(O) {
    return '<label class="so-row so-tg so-eyes"><span class="so-l"><span id="sOptEyesL">' + EY_CUE + supTag(true) + "</span>" +
      "<small>At the first slow breaths, a soft bell and “" + EY_LINE.replace(/\.$/, "") + "”, then the screen dims. The breath cues sound throughout, a tone if they're set to silent, " +
      "and a bell asks you to open your eyes for anything to look at. Sitting or lying down: walking, your eyes stay open.</small></span>" +
      '<input type="checkbox" class="sw" id="sOptEyes"' + (O.eyes && supOn() ? " checked" : "") + "></label>";
  }
  function eyGazeFits(d) {
    return !!d && !d.noGaze && !d.stress && !d.custom && d.goal === "focus" && d.id !== "anapana" && ["move", "write", "measure"].indexOf(d.method) < 0;
  }
  function eyGazeRow(O) {
    return '<label class="so-row so-tg so-gaze"><span class="so-l"><span id="sOptGazeL">' + EY_GAZE + supTag(true) + "</span>" +
      "<small>A still point in place of the orb and the breath visual, its glow swelling gently with your breath. " + EY_GAZE_TXT + " General practice, not researched.</small></span>" +
      '<input type="checkbox" class="sw" id="sOptGaze"' + (O.gaze && supOn() ? " checked" : "") + "></label>";
  }
  // a switch that opens with a donation while this device is locked (as Stillness does, motion.js)
  function eyOptWire(id, name, key, d, O, save) {
    var cb = $(id);
    if (!cb) return;
    cb.addEventListener("change", function () {
      if (!this.checked) { O[key] = false; save(); return; }
      this.checked = false;
      var yes = function () {
        if (P.view !== d) return;
        O[key] = true; save();
        var c = $(id); if (c) c.checked = true;
      };
      supGate(name, yes, function (ok) { if (ok) yes(); else eyTags(); });
    });
  }
  function eyOptWire2(d, O, save) {
    eyOptWire("#sOptEyes", EY_CUE, "eyes", d, O, save);
    eyOptWire("#sOptGaze", EY_GAZE, "gaze", d, O, save);
  }
  // the Options summary's words for them
  function eyOptSum(d, O, s) {
    if (eyFits(d) && O.eyes && supOn()) s.push("Eyes closed");
    if (eyGazeFits(d) && O.gaze && supOn()) s.push("Gaze point");
  }

  /* ----- the gaze point: on Breathe (BVIS.gaze), and in a focus practice ----- */
  // the session shows the gaze point in place of the orb, the still point and the glow
  function eyGazeSes() { return EY.gaze && supOn() && pBusy(); }
  function eyVis(s, v) { return eyGazeSes() && (v === "orb" || v === "still" || v === "glow") ? "gaze" : v; }
  // the words under the point, in lines that fit
  function eyWrap(c, txt, x, yEnd, maxW, lh) {
    var words = txt.split(" "), lines = [], cur = "";
    words.forEach(function (w) {
      var t = cur ? cur + " " + w : w;
      if (cur && c.measureText(t).width > maxW) { lines.push(cur); cur = w; } else cur = t;
    });
    if (cur) lines.push(cur);
    for (var i = 0; i < lines.length; i++) c.fillText(lines[i], x, yEnd - (lines.length - 1 - i) * lh);
  }
  /* The point itself stays still; its glow swells as you breathe in and shrinks as you breathe out (with reduced
     motion, only its light follows the breath). lv: the lung level, 0 to 1. */
  function eyGazePaint(c, W, H, lv, col) {
    if (!c || !W || !H) return;
    var cx = W / 2, cy = H / 2, m = Math.min(W, H), k = RM ? 0.5 : lv, R = m * (0.1 + 0.07 * k), a = 0.14 + 0.24 * lv;
    var g = c.createRadialGradient(cx, cy, 0, cx, cy, R);
    g.addColorStop(0, rgba(col, a)); g.addColorStop(0.3, rgba(col, a * 0.5)); g.addColorStop(1, rgba(col, 0));
    c.fillStyle = g; c.beginPath(); c.arc(cx, cy, R, 0, Math.PI * 2); c.fill();
    c.fillStyle = rgba(BCOL.text, 0.92); c.beginPath(); c.arc(cx, cy, Math.max(2.5, m * 0.011), 0, Math.PI * 2); c.fill();
    c.font = "500 12.5px " + B_SANS; c.fillStyle = rgba(BCOL["text-faint"], 0.85); c.textAlign = "center"; c.textBaseline = "bottom";
    eyWrap(c, EY_GAZE_TXT, cx, H - 12, Math.max(120, W - 40), 17);
  }
  BVIS.gaze = function (S) {
    if (!supOn()) { BVIS.circle(S); return; }       // kept from before, on a device that's locked: the usual circle
    eyGazePaint(d2, CW, CH, S.live ? (S.lead ? 0 : S.level) : 0.42, S.live && !S.lead ? S.col : BCOL["b-in"]);
  };
  // a step without paced breathing (the practice's canvas): the glow swells slowly, about one breath every ten seconds
  function eyGazeStep(c, W, Hh, T, col) {
    eyGazePaint(c, W, Hh, RM ? 0.5 : 0.3 + 0.4 * (1 - Math.cos(T * Math.PI * 2 / 10)) / 2, col);
  }
  // picked under Visual: at once once this device is unlocked; otherwise the visual stays as it was and the dialog opens
  function eyGazePick(go) {
    if (supOn()) { go(); return; }
    scnBreatheSync();
    supGate(EY_GAZE, go, function (ok) { if (ok) go(); else scnBreatheSync(); });
  }

  /* ----- eyes closed, on Breathe ----- */
  function eyClosedNow() { return !!BC.eyes && supOn() && !P.usesB; }
  // the cues to follow, in words
  function eyCueName() {
    var s = BC.sound === "tones" ? "the rising tone" : BC.sound === "chimes" ? "the chimes" : "", v = BC.buzz && bzOk() ? "the vibration" : "";
    return s && v ? s + " and " + v : s || v;
  }
  // the stage with the visual hidden: dark, and two faint lines in the middle (drawn by draw(), breathe-draw.js)
  function eyClosedDraw(S) {
    var cx = CW / 2, cy = CH / 2, cue = eyCueName();
    label("Eyes closed", cx, cy - 11, rgba(BCOL["text-faint"], 0.7), "center", "middle", 15, "650");
    label(!S.live ? "Start, then close your eyes" : cue ? "Follow " + cue : "Follow your own breath", cx, cy + 13, rgba(BCOL["text-faint"], 0.5), "center", "middle", 12.5, "500");
  }
  function eyStage() {
    var st = $("#bStage"), v = eyClosedNow() ? "1" : "";
    if (st && (st.dataset.eyes || "") !== v) st.dataset.eyes = v;
  }
  // with the eyes closed, something has to guide each breath: the rising tone comes on when sound and vibration are both off
  function eyBreatheCues() {
    if (BC.sound !== "off" || (BC.buzz && bzOk())) return false;
    BC.sound = "tones";
    checkRadio("bsnd", "tones"); syncChips("#bSnd");
    $("#bVolRow").hidden = false;
    if (B.state === "running") cueOn();
    saveBreath();
    return true;
  }
  // the switch in Breathe's settings: on with a donation while locked
  function eyBreatheSet(on) {
    var cb = $("#bEyesOn");
    if (!on) { BC.eyes = false; saveBreath(); eyBreatheSync(); draw(); return; }
    var yes = function () {
      BC.eyes = true;
      var tone = eyBreatheCues();
      saveBreath(); eyBreatheSync(); draw();
      if (tone) bSetT("#bEyesHint", "The rising tone is on, to guide each breath.");
    };
    cb.checked = false;
    supGate(EY_BREATHE, yes, function (ok) { if (ok) yes(); else eyBreatheSync(); });
  }
  function eyBreatheSync() {
    var cb = $("#bEyesOn");
    if (cb) cb.checked = !!BC.eyes && supOn();
    bSetT("#bEyesHint", eyClosedNow() ? "Breathe with your eyes closed and follow " + (eyCueName() || "your own breath") + "." : "");
    eyStage();
  }

  /* ----- after an unlock, and starting up ----- */
  // the cup beside each switch and the Gaze point chip while this device is locked (supRefresh calls this after an unlock)
  function eyTags() {
    ["#sOptEyesL", "#sOptGazeL", "#bEyesL"].forEach(function (sel) {
      var l = $(sel);
      if (!l) return;
      var tag = l.querySelector(".sup-tag");
      if (tag && supOn()) tag.parentNode.removeChild(tag);
      else if (!tag && !supOn()) l.insertAdjacentHTML("beforeend", supTag(true));
    });
    var inp = document.querySelector('#bVis input[value="gaze"]'), lab = inp && inp.parentNode, t = lab && lab.querySelector(".sup-tag");
    if (lab) {
      if (t && supOn()) t.parentNode.removeChild(t);
      else if (!t && !supOn()) lab.insertAdjacentHTML("beforeend", supTag(true));
    }
    ["#sOptEyes", "#sOptGaze"].forEach(function (sel) { var c = $(sel); if (c && !supOn()) c.checked = false; });
  }
  function eyUI() { eyTags(); eyBreatheSync(); draw(); }
  function eyInit() {
    SUP_EXTRA.push({ name: EY_CUE, href: "#l-eyes" }, { name: EY_BREATHE, href: "#breathe" }, { name: EY_GAZE, href: "#breathe" });   // Settings' list of what the donation unlocks
    $("#bEyesOn").addEventListener("change", function () { eyBreatheSet(this.checked); });
    eyUI();
    if (window.__entrain) {
      var X = window.__entrain;
      X.EY = EY; X.eyFits = eyFits; X.eyRelax = eyRelax; X.eyGazeFits = eyGazeFits; X.eyRoom = eyRoom; X.eyLooks = eyLooks; X.eyClosedNow = eyClosedNow; X.EY_LINE = EY_LINE; X.EY_GAZE_TXT = EY_GAZE_TXT;
    }
  }
