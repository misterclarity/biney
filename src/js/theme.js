  /* --------------------------------- theme ---------------------------------
     Light, dark, or automatic (Settings, Screen): automatic is dark when the phone is, and for the
     late-night service, from 9 pm to 5 am by your body clock (light.js), since that's when Sleep Descent
     and the other practices for sleep get used, often in bed. Those practices, the sleep tracks and Sleep
     sounds go further, to the bedtime colours, whatever the theme: their page, the session and the end
     screen turn dim, warm and low. A screen light chosen for a session (light.js) comes before both.
     The colours themselves are in styles.css (:root[data-theme="dark"], :root[data-mood="bed"]); a
     script at the top of the page sets the theme before anything is drawn, so nothing flashes white.
  ---------------------------------------------------------------------------- */

  var THEME = { dark: null, bed: null, mq: null };

  function themeDark() {
    if (ST.theme === "dark") return true;
    if (ST.theme === "light") return false;
    var h = ltClock(ltHour());                                   // the hour by your body clock
    return !!(THEME.mq && THEME.mq.matches) || h >= 21 || h < 5;
  }
  // the practice or track on the screen is for sleep: Sleep Descent and the others for sleep or good for
  // it, the power nap, and the sleep tracks
  function themeBed() {
    if (curView === "session") {
      var d = $("#sIntro").hidden ? P.def : P.view;            // running or just ended, else the page shown
      return !!d && (pSleepy(d) || d.id === "power-nap");
    }
    if (curView === "track") { var t = trackById(TR.id); return !!t && t.goal === "sleep"; }
    return curView === "sleep-sounds";                          // played as you fall asleep
  }
  function themeSync() {
    var dark = themeDark(), bed = themeBed(), root = document.documentElement;
    if (dark === THEME.dark && bed === THEME.bed) return;
    THEME.dark = dark; THEME.bed = bed;
    root.dataset.theme = dark ? "dark" : "light";
    if (bed) root.dataset.mood = "bed"; else delete root.dataset.mood;
    themeBar();
    themeRepaint();
  }
  // the browser's own bar: a screen light's colour while one is on, else the fascia's
  function themeBar() {
    var m = document.querySelector('meta[name="theme-color"]');
    if (m) m.setAttribute("content", LT.look ? LT_BAR[LT.look] : THEME.bed ? "#121b17" : THEME.dark ? "#1a2e26" : "#1d6a50");
  }
  // the drawings read their colours when they start; they take the new ones, and what's showing redraws
  function themeRepaint() {
    var tries = [
      readColors,
      function () { var nc = nightStyle(); ["relax", "stim", "ther", "accent", "food", "hr"].forEach(function (k) { if (nc[k]) P.col[k] = nc[k]; }); },
      function () { if (curView === "home") drawHomeWave(); },
      function () { if (curView === "breathe") sizeCanvas(); },
      function () { if (curView === "heart") { drawSwings(); drawFind(); drawSpectrum(); } },
      function () { if (curView === "session" && !$("#sDone").hidden && SD.r) sdDraw(); }
    ];
    tries.forEach(function (f) { try { f(); } catch (e) {} });
  }
  function themeSet(v) {
    ST.theme = v === "light" || v === "dark" ? v : "auto";
    stSave();
    themeSync();
  }
  function themeInit() {
    THEME.mq = window.matchMedia ? window.matchMedia("(prefers-color-scheme: dark)") : null;
    if (THEME.mq) {
      if (THEME.mq.addEventListener) THEME.mq.addEventListener("change", themeSync);
      else if (THEME.mq.addListener) THEME.mq.addListener(themeSync);
    }
    setInterval(themeSync, 60000);                       // the late-night service starts at 9 pm, and ends at 5
    document.addEventListener("visibilitychange", function () { if (!document.hidden) themeSync(); });
    themeSync();
  }
