  /* ---------------------------------- today ----------------------------------
     The first screen: your breathing pattern ready to start, your favourites, what you did
     lately and the last seven days from the history, a suggestion for the time of day, and
     the six goals into the library.
  ---------------------------------------------------------------------------- */

  var GOAL_NAMES = 3;                   // how many of its own each goal tile names

  function fmtSec(s) { return (s % 1 ? s.toFixed(1) : String(s)) + " s"; }
  function patLabel() {
    var r = document.querySelector('input[name="bpat"]:checked');
    return r ? r.parentNode.textContent.trim() : "Custom";
  }

  function homeRefresh() {
    var rate = 60 / cycleOf(BC), parts = ["in for " + fmtSec(BC.inh)];
    if (BC.sip) parts.push("a " + fmtSec(BC.sip) + " top-up");
    if (BC.hold) parts.push("hold " + fmtSec(BC.hold));
    parts.push("out for " + fmtSec(BC.exh));
    if (BC.rest) parts.push("hold " + fmtSec(BC.rest));
    bSetT("#homePat", patLabel());
    bSetT("#homePatTxt", rate.toFixed(1) + " breaths a minute: " + parts.join(", ") + ". " +
      (BC.minutes ? "A " + BC.minutes + "-minute session." : "Open-ended, until you stop."));
    bSetT("#homeStart", pBusy() ? "Back to " + P.def.name : B.state === "running" ? "Back to your session" : B.state === "paused" ? "Resume session" : "Start breathing");

    if (H.find && H.find.best) {
      var d = new Date(H.find.at).toLocaleDateString(undefined, { day: "numeric", month: "short" });
      bSetT("#qkFind", "Last result: " + H.find.best + " breaths a minute, " + d);
    } else bSetT("#qkFind", "A 10-minute test with a heart sensor");
    shellSensor();
    pSuggest();
    todayRender();
    drawHomeWave();
  }

  function todayRender() {
    // favourites, in the order you starred them; one you've since deleted just drops out
    var favs = favList().map(libItem).filter(Boolean);
    $("#tdFavList").innerHTML = favs.map(function (it) { return libRow(it, false, { compact: true }); }).join("");
    $("#tdFavList").hidden = !favs.length;
    $("#tdFavEmpty").hidden = !!favs.length;

    // recently: the week at a glance, then the newest session of each of the last few things you did
    var l = hLoad();
    $("#tdRecent").hidden = !l.length;
    if (l.length) {
      var w = hWeek();
      $("#tdRecentBody").innerHTML = '<div class="td-wk"><div class="td-wt"><span>Last 7 days</span>' + hTotals(w) + "</div>" + hDays(w) + "</div>" +
        '<ul class="hi-list">' + hLatest(3).map(function (e) { return hRow(e, true); }).join("") + "</ul>";
    }

    // the six goals, each with the first few of its own
    var all = libAll();
    $("#tdGoals").innerHTML = GOALS.map(function (g) {
      var names = all.filter(function (it) { return it.goal === g.id; }).slice(0, GOAL_NAMES).map(function (it) { return it.name; });
      return '<a class="td-goal" href="#goal/' + g.id + '" style="--gcol:' + GOAL_COL[g.id] + '">' +
        '<span class="td-gi"><svg class="i" aria-hidden="true"><use href="#i-' + g.icon + '"/></svg></span>' +
        '<b>' + esc(g.name) + '</b><span class="td-gn">' + esc(names.join(", ")) + "</span></a>";
    }).join("");
  }

  /* The current pattern drawn as two and a half breaths, coloured by phase. */
  function drawHomeWave() {
    var cv = $("#homeWave");
    if (!cv || $("#v-home").hidden || !BCOL.text) return;
    var f = fitCanvas(cv);
    if (!f) return;
    var c = f.c, W = f.w, Hh = f.h, ph = buildPhases(BC), T = ph.cycle * 2.5, top = 12, bot = Hh - 12;
    var at = function (t) {
      var ct = t % ph.cycle, p = ph.list[ph.list.length - 1];
      for (var i = 0; i < ph.list.length; i++) if (ct < ph.list[i].start + ph.list[i].secs) { p = ph.list[i]; break; }
      var prog = Math.min(1, Math.max(0, (ct - p.start) / p.secs));
      return { k: p.k, y: bot - (p.from + (p.to - p.from) * bEase(prog)) * (bot - top) };
    };
    var x, pt, g = c.createLinearGradient(0, top, 0, bot);
    g.addColorStop(0, rgba(BCOL["b-in"], 0.18));
    g.addColorStop(1, rgba(BCOL["b-in"], 0));
    c.beginPath(); c.moveTo(0, bot);
    for (x = 0; x <= W; x += 2) c.lineTo(x, at(x / W * T).y);
    c.lineTo(W, bot); c.closePath(); c.fillStyle = g; c.fill();
    c.lineWidth = 3; c.lineCap = "round"; c.lineJoin = "round";
    var runK = null;
    for (x = 0; x <= W + 1; x += 2) {
      pt = at(Math.min(W, x) / W * T);
      if (pt.k !== runK) {
        if (runK !== null) { c.lineTo(x, pt.y); c.stroke(); }
        c.beginPath(); c.strokeStyle = kc(pt.k); c.moveTo(x, pt.y); runK = pt.k;
      } else c.lineTo(x, pt.y);
    }
    c.stroke();
  }

  function todayInit() {
    $("#homeStart").addEventListener("click", function () {
      if (pBusy()) { pOpen(); return; }
      goView("breathe");
      if (B.state !== "running") bToggle();
    });
    if (window.ResizeObserver) new ResizeObserver(drawHomeWave).observe($("#homeWave"));
  }
