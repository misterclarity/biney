  /* ------------------------------ screen light ------------------------------
     The light from the screen while a practice runs or Breathe is open, from the guide's advice on light colour and
     brain states: Bright (cool and near-white, for focus and energy in the morning), Warm (amber and dimmer, for
     winding down in the evening) and Night (very dim and red, with no blue, before sleep), or Automatic, which picks
     one from what the session is for and the time of day. Bright is a light set of the page's colours (styles.css,
     :root[data-light]); Warm and Night lay a colour over the whole screen that multiplies with it (.lt-veil,
     mix-blend-mode), so every pixel, a scene's and a chart's too, keeps only the warm part of its light, or for Night
     only the red. A morning or evening person moves Automatic's times, and Today's suggestion, an hour earlier or
     later; an evening person can have Bright in green (one study). Bright, Warm and Night are new techniques: while
     this device is locked nothing changes, and a choice kept from before shows the usual screen.
  ------------------------------------------------------------------------------ */

  var LT_NAME = "Screen light";                                   // the unlock dialog: "… is one of the new techniques."
  var LT_KINDS = [["off", "Usual"], ["auto", "Automatic"], ["bright", "Bright"], ["warm", "Warm"], ["night", "Night"]];
  var LT_WHAT = {
    off: "The screen as it usually is.",
    bright: "Cool and near-white, for focus and energy in the morning.",
    green: "Bright, in green: in one small study, green light was the most alerting for evening types.",
    warm: "Amber and dimmer, with less blue, for winding down in the evening.",
    night: "Very dim and red, with no blue, for the time before sleep."
  };
  var LT_LOOK = { "": "the usual screen", bright: "Bright", green: "Bright in green", warm: "Warm", night: "Night" };
  var LT_NOTE = "Bright for focus and energy in the morning, Warm in the evening, Night before sleep. Automatic picks one from what the session is for and the time of day.";
  var LT_CHRONO = [["morning", "Morning person"], ["mid", "In between"], ["evening", "Evening person"]];
  // hours added to the clock before reading the time of day: a morning person's evening comes an hour sooner
  var LT_SHIFT = { morning: 1, mid: 0, evening: -1 };
  // the browser's own bar, in each look's background (with no light on, the theme's: theme.js)
  var LT_BAR = { bright: "#f3f7fa", green: "#e2f4dc", warm: "#120c07", night: "#000000" };
  // look: the light on screen now ("" for the usual one)
  var LT = { look: "" };

  function ltOk(k) { return k === "off" || k === "auto" || k === "bright" || k === "warm" || k === "night"; }
  // this device's choice, for Breathe and every practice that keeps none of its own
  function ltStored() { var k = store.get("light"); return ltOk(k) ? k : "off"; }
  function ltDev() { return supOn() ? ltStored() : "off"; }
  // what a row shows: the usual screen while this device is locked, whatever was kept
  function ltShown(k) { return supOn() && ltOk(k) ? k : "off"; }
  // morning person, evening person or in between (counted once this device is unlocked)
  function ltChrono() { var c = store.get("chrono"); return supOn() && (c === "morning" || c === "evening") ? c : "mid"; }
  function ltGreen() { return ltChrono() === "evening" && store.get("ltGreen") === "1"; }
  // a practice where the light could nudge a reading: the Stress Check keeps the usual screen
  function ltFits(d) { return !!d && !d.stress; }

  /* ----- Automatic: the time of day and what the session is for ----- */
  // the hour now, with minutes (the tests can set it)
  function ltHour() {
    if (window.__ltHour !== undefined) return +window.__ltHour;
    var n = new Date();
    return n.getHours() + n.getMinutes() / 60;
  }
  // the hour as your body clock reads it
  function ltClock(h) { return (((h + LT_SHIFT[ltChrono()]) % 24) + 24) % 24; }
  // morning 5 to 12, afternoon 12 to 6, evening 6 to 10, night 10 to 5, by your body clock
  function ltPart(h) { var c = ltClock(h); return c >= 5 && c < 12 ? "morning" : c >= 12 && c < 18 ? "afternoon" : c >= 18 && c < 22 ? "evening" : "night"; }
  /* The guide's table: bright, cool light for morning focus and alertness, dim and warm in the evening, very dim and
     red before sleep. Focus and energy: Bright by day (a morning person's afternoon keeps the usual screen: in morning
     types, blue light in the afternoon may lower alertness), Warm from the evening on. Sleep: Night from the evening
     on, Warm before it, and Night on any practice's sleep steps. Calm, recovery and reflection: the usual screen by
     day, Warm in the evening and Night at night. "" is the usual screen. */
  function ltAuto(goal, h, sleepy) {
    var w = ltPart(h);
    if (sleepy) return "night";
    if (goal === "sleep") return w === "evening" || w === "night" ? "night" : "warm";
    if (goal === "focus" || goal === "energy") return w === "morning" ? "bright" : w === "afternoon" ? (ltChrono() === "morning" ? "" : "bright") : "warm";
    return w === "evening" ? "warm" : w === "night" ? "night" : "";
  }
  // a choice as a look: Automatic worked out, and Bright in green for an evening person who asked for it
  function ltResolve(k, goal, sleepy) {
    var look = k === "auto" ? ltAuto(goal, ltHour(), sleepy) : k === "bright" || k === "warm" || k === "night" ? k : "";
    return look === "bright" && ltGreen() ? "green" : look;
  }
  // the light the screen should have now: a running practice's on its screen, Breathe's on Breathe, else the usual
  function ltNow() {
    if (!supOn()) return "";
    var run = pBusy() && P.def, s;
    if (curView === "session" && run) {
      if (!ltFits(P.def)) return "";
      s = P.steps && P.steps[P.idx];
      return ltResolve(P.opt.light, P.def.goal, !!s && pSleepyStep(s));
    }
    if (curView === "breathe") {
      if (run && P.usesB) return ltFits(P.def) ? ltResolve(P.opt.light, P.def.goal, false) : "";
      var b = preset(BC.pattern);
      return ltResolve(ltDev(), b && b.goal || "", false);
    }
    return "";
  }
  // the page's colours for a look; the canvases read theirs again and draw
  function ltApply(look) {
    if (look === LT.look) return;
    LT.look = look;
    var root = document.documentElement;
    if (look) root.setAttribute("data-light", look); else root.removeAttribute("data-light");
    themeBar();
    themeRepaint();                                     // the drawings read their colours again (theme.js)
    if (B.ph) draw();
  }
  function ltSync() { ltApply(ltNow()); }

  /* ----- the buttons: Settings, a practice's Options, Breathe ----- */
  function ltSeg(id, cur, scope) {
    return '<div class="mini-seg lt-seg"' + (id ? ' id="' + id + '"' : "") + ' data-lt-for="' + scope + '" role="group" aria-label="Screen light">' +
      LT_KINDS.map(function (k) {
        return '<button type="button" data-lt="' + k[0] + '" aria-pressed="' + (k[0] === cur) + '">' + k[1] + (k[0] !== "off" ? supTag(true) : "") + "</button>";
      }).join("") + "</div>";
  }
  // a practice's Options: its own choice, or this device's
  function ltRow(O) {
    return '<div class="so-row so-seg so-lt"><span class="so-l">Screen light<small id="sLtNote">' + esc(ltSays(ltShown(O.light), P.view && P.view.goal, "practice")) + "</small></span>" +
      ltSeg("sOptLt", ltShown(O.light), "prac") + "</div>";
  }
  // what a choice does, in words; for Automatic, what it picks now and why
  function ltSays(k, goal, what) {
    if (k !== "auto") return k === "bright" && ltGreen() ? LT_WHAT.green : LT_WHAT[k] || LT_WHAT.off;
    var look = ltResolve("auto", goal || "", false), part = ltPart(ltHour());
    return "Automatic picks from the time of day and what " + (what === "pattern" ? "the pattern" : "the practice") + " is for: " + LT_LOOK[look] + " now, " +
      (part === "night" ? "at night" : "in the " + part) + (what === "practice" ? ", and Night on its sleep steps." : ".");
  }
  // Automatic, as it stands now, for each kind of session (Settings)
  function ltAutoTxt() {
    var h = ltHour(), part = ltPart(h), f = ltResolve("auto", "focus"), c = ltResolve("auto", "calm"), s = ltResolve("auto", "sleep");
    return "Automatic now (" + part + (ltChrono() !== "mid" ? ", by your body clock" : "") + "): " + LT_LOOK[f] + " for focus and energy, " + LT_LOOK[c] + " for calm, recovery and reflection, " + LT_LOOK[s] + " for sleep.";
  }
  /* Picking one, at the moment of use: Usual at once; a light once this device is unlocked, otherwise the unlock
     dialog first, and the pick goes ahead if the dialog unlocks it. */
  function ltPick(k, then) {
    if (!ltOk(k)) return;
    if (k === "off" || supOn()) { then(k); return; }
    supGate(LT_NAME, function () { then(k); }, function (ok) { if (ok) then(k); else ltUI(); });
    ltUI();
  }
  // this device's choice: kept, and an open practice page with no choice of its own follows it
  function ltSet(k) {
    store.set("light", k);
    if (!pBusy() && P.optFor) P.opt = pOptsOf(P.optFor);
    ltUI();
  }
  // morning person, evening person or in between: either end is part of the new technique
  function ltChronoPick(c) {
    if (c !== "morning" && c !== "mid" && c !== "evening") return;
    var go = function () { if (c === "mid") storeDel("chrono"); else store.set("chrono", c); ltUI(); };
    if (c === "mid" || supOn()) go(); else { supGate(LT_NAME, go, function (ok) { if (ok) go(); else ltUI(); }); ltUI(); }
  }

  /* ----- Settings: Screen light ----- */
  function ltCard() {
    var ch = ltChrono();
    return '<section class="st-card" id="st-light" aria-labelledby="stLt"><h2 id="stLt">Screen light</h2>' +
      '<p class="st-note">The light from your screen during a practice and on Breathe. Bright is cool and near-white, for focus and energy in the morning; ' +
        'Warm is amber and dimmer, for winding down in the evening; Night is very dim and red, with no blue, for the time before sleep. ' +
        'Automatic picks one from what the session is for and the time of day. <a href="#l-light">What the research says</a></p>' +
      '<div class="so-row so-seg"><span class="so-l">During sessions<small>On Breathe and in every practice, unless a practice keeps its own under Options.</small></span>' +
        ltSeg("stLtSeg", ltDev(), "dev") + "</div>" +
      '<p class="st-note" id="ltAutoTxt">' + esc(ltAutoTxt()) + "</p>" +
      '<h3 class="sup-h" id="ltChH">Your body clock</h3>' +
      '<div class="so-row so-seg"><span class="so-l">Morning person, evening person or in between?<small>A morning person\'s times come an hour earlier, an evening person\'s an hour later: ' +
        "Automatic's, and Today's suggestion.</small></span>" +
        '<div class="mini-seg lt-seg lt-ch" id="stLtCh" role="group" aria-labelledby="ltChH">' + LT_CHRONO.map(function (o) {
          return '<button type="button" data-chrono="' + o[0] + '" aria-pressed="' + (o[0] === ch) + '">' + o[1] + (o[0] !== "mid" ? supTag(true) : "") + "</button>";
        }).join("") + "</div></div>" +
      '<div id="ltGreenRow"' + (ch === "evening" ? "" : " hidden") + ">" + pToggle("ltGreenOn", "Bright in green", ltGreen(),
        "In one small study, green light was the most alerting for evening types. It's one study, and untested on a screen.") + "</div>" +
      '<p class="st-note lt-ev">Light at the eye: strong evidence, from body-clock research ' + dots(3) + "</p>" +
      '<p class="st-note lt-ev">Your body clock\'s times and green for an evening person: single studies <span class="lt-exp">Experimental</span></p>' +
      '<p class="st-note">A phone screen gives a small fraction of the light of daylight or a light box, so for alertness daylight comes first: outdoors in the morning, ' +
        'or <a href="#living/light-box">a light box</a> on dark winter mornings. A web page can\'t set your phone\'s brightness: turn it up for Bright and down for Night.</p>' +
      "</section>";
  }
  function ltStWire() {
    var g = $("#stLtCh");
    if (!g) return;
    g.addEventListener("click", function (e) {
      var b = e.target.closest("button[data-chrono]");
      if (b) ltChronoPick(b.getAttribute("data-chrono"));
    });
    $("#ltGreenOn").addEventListener("change", function () {
      var on = this.checked, go = function () { if (on) store.set("ltGreen", "1"); else storeDel("ltGreen"); ltUI(); };
      if (!on || supOn()) go(); else supGate(LT_NAME, go, function (ok) { if (ok) go(); else ltUI(); });
    });
  }

  // every Screen light button in step: pressed, and the cup while locked (after an unlock too: supRefresh calls this)
  function ltUI() {
    var lock = !supOn(), dev = ltDev(), ch = ltChrono(), i;
    document.querySelectorAll(".lt-seg").forEach(function (g) {
      var prac = g.getAttribute("data-lt-for") === "prac";
      var cur = prac && P.view ? ltShown(pBusy() && P.def !== P.view ? pOptsOf(P.view.id).light : P.opt.light) : dev;
      g.querySelectorAll("button[data-lt], button[data-chrono]").forEach(function (b) {
        var k = b.getAttribute("data-lt"), c = b.getAttribute("data-chrono"), tag = b.querySelector(".sup-tag");
        b.setAttribute("aria-pressed", String(k ? k === cur : c === ch));
        if ((k || c) === "off" || c === "mid") return;
        if (tag && !lock) tag.parentNode.removeChild(tag);
        else if (!tag && lock) b.insertAdjacentHTML("beforeend", supTag(true));
      });
      if (prac && P.view) bSetT("#sLtNote", ltSays(cur, P.view.goal, "practice"));
    });
    var gr = $("#ltGreenRow");
    if (gr) { gr.hidden = ch !== "evening"; $("#ltGreenOn").checked = ltGreen(); }
    if ($("#ltAutoTxt")) bSetT("#ltAutoTxt", ltAutoTxt());
    // Breathe's chips: the device's choice, the cups while locked, and what it does
    var bl = $("#bLight");
    if (bl) {
      checkRadio("blight", dev); syncChips("#bLight");
      var labs = bl.querySelectorAll(".chip");
      for (i = 0; i < labs.length; i++) {
        var v = labs[i].querySelector("input").value, t = labs[i].querySelector(".sup-tag");
        if (v === "off") continue;
        if (t && !lock) t.parentNode.removeChild(t);
        else if (!t && lock) labs[i].insertAdjacentHTML("beforeend", supTag(true));
      }
      var bp = preset(BC.pattern);
      bSetT("#bLightHint", ltSays(dev, bp && bp.goal || "", "pattern") + (dev === "off" ? "" : " A web page can't set your phone's brightness: turn it up for Bright and down for Night."));
    }
    if (curView === "home") pSuggest();                // Today's suggestion follows your body clock
    ltSync();
  }

  function ltInit() {
    var veil = document.createElement("div");                     // Warm's and Night's colour over the whole screen
    veil.className = "lt-veil"; veil.setAttribute("aria-hidden", "true");
    document.body.appendChild(veil);
    SUP_EXTRA.push({ name: LT_NAME, href: "#st-light" });         // Settings' list of what the donation unlocks
    document.addEventListener("click", function (e) {
      var b = e.target.closest ? e.target.closest('.lt-seg[data-lt-for="dev"] button[data-lt]') : null;
      if (b) ltPick(b.getAttribute("data-lt"), function (k) { ltSet(k); });
    });
    $("#bLight").addEventListener("change", function (e) {
      var k = e.target.value;
      if (!ltOk(k)) return;
      ltPick(k, function (x) { ltSet(x); });
    });
    $("#bPats").addEventListener("change", function () { ltUI(); });     // Automatic goes by the pattern's goal (after Breathe's own handler)
    ltUI();
    if (window.__entrain) {                                       // for automated tests only
      var X = window.__entrain;
      X.LT = LT; X.ltAuto = ltAuto; X.ltResolve = ltResolve; X.ltNow = ltNow; X.ltPart = ltPart; X.ltChrono = ltChrono; X.ltHour = ltHour; X.ltSync = ltSync; X.readColors = readColors; X.BCOL = BCOL;
    }
  }
