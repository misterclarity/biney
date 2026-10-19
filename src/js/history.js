  /* -------------------------------- history --------------------------------
     One log on the device for everything you do: practices, breathing sessions, tracks, the
     custom primer and the beat builder, and resonance tests. Sessions under a minute aren't
     kept, and nothing you write in a reflection goes in. Today shows the last week of it;
     History shows all of it, a day at a time.
  ---------------------------------------------------------------------------- */

  var HIST = null;                  // oldest first; read once, then kept in step with storage
  var HIST_MAX = 500;
  var H_ARM = 0;                    // Clear history waits for a second tap
  var DAY = 864e5;

  function hLoad() {
    if (HIST) return HIST;
    var l = null;
    try { l = JSON.parse(store.get("history") || "null"); } catch (e) {}
    if (!Array.isArray(l)) {
      // the first run with one history: until now only practices were logged, on their own
      l = [];
      try {
        var old = JSON.parse(store.get("practiceLog") || "[]");
        if (Array.isArray(old)) old.forEach(function (e) {
          if (e && e.id && e.at) l.push(hClean({ k: "practice", id: e.id, at: e.at, secs: e.secs, full: e.full, hr0: e.hr0, hr1: e.hr1, coh: e.coh }));
        });
      } catch (e) {}
      HIST = l;
      if (hSave() && l.length) storeDel("practiceLog");
      storeDel("lastSummary"); storeDel("soundsSeg");   // Home's last-session card and the Sounds tab are gone too
      return HIST;
    }
    HIST = l.filter(function (e) { return e && e.k && e.at && typeof e.secs === "number"; });
    return HIST;
  }
  // true when it was written: a full or refused storage keeps the old log instead
  function hSave() {
    var s = JSON.stringify(HIST);
    store.set("history", s);
    return store.get("history") === s;
  }
  function hClean(e) {
    for (var k in e) if (e[k] === undefined || e[k] === null || (typeof e[k] === "number" && !isFinite(e[k]))) delete e[k];
    return e;
  }
  function hAdd(e) {
    if (!e || !(e.secs >= 60)) return;
    hLoad();
    e.at = e.at || Date.now();
    e.secs = Math.round(e.secs);
    HIST.push(hClean(e));
    while (HIST.length > HIST_MAX) HIST.shift();
    hSave();
    setTimeout(function () {                     // once the caller has finished ending the session
      if (curView === "home") todayRender();
      if (curView === "history") hRender();
    }, 0);
  }
  function hClear() { HIST = []; storeDel("history"); storeDel("practiceLog"); }

  /* ----- what each kind of session logs ----- */
  // a breathing session on the guide (not one a practice is running, and not the resonance test)
  function hBreath(secs, full) {
    if (P.usesB || B.finder || secs < 60) return;
    var e = { k: "breath", id: BC.pattern, secs: secs, full: full, rate: +(60 / cycleOf(BC)).toFixed(1) };
    var s = B.hr;
    if (s.length >= 10) {
      var end = s[s.length - 1].bt;
      if (end >= 150) {
        e.hr0 = Math.round(avg(s.filter(function (x) { return x.bt < 60; }).map(function (x) { return x.hr; })));
        e.hr1 = Math.round(avg(s.filter(function (x) { return x.bt > end - 60; }).map(function (x) { return x.hr; })));
      } else e.hrAvg = Math.round(avg(s.map(function (x) { return x.hr; })));
    }
    if (B.swings.length) e.swing = +avg(B.swings.map(function (x) { return x.amp; })).toFixed(1);
    if (B.coh.length) { e.coh = +avg(B.coh).toFixed(2); if (!H.hasRR) e.est = true; }
    hAdd(e);
  }
  // a track, the primer or a built beat: the time actually listened, once it stops for good
  function hTrack() {
    var t = A.track;
    if (!t || t.practice) return;
    var el = A.playing && A.ctx ? A.ctx.currentTime - A.startedAt : A.elapsed;
    var secs = el - (A.hAt || 0);
    if (secs < 60) return;
    A.hAt = el;                                  // a paused track logged as the page goes away isn't logged twice
    var e = { k: "track", id: t.id, secs: secs, full: !t.then && el >= t.minutes * 60 - 10 };
    if (t.id === "prime" || t.id === "custom") { e.beat = +t.beat.toFixed(1); e.band = t.band; }
    hAdd(e);
  }
  function hTest(secs, best) { hAdd({ k: "test", id: "resonance", secs: secs, full: true, best: best }); }

  /* ----- reading it back ----- */
  // the library key of what a session was: the same keys favourites use
  function hKey(e) {
    if (e.k === "practice") return e.id;
    if (e.k === "breath") return "b:" + e.id;
    if (e.k === "track") return e.id === "prime" ? "x:prime" : e.id === "custom" ? "x:beats" : "t:" + e.id;
    return "";
  }
  // what to show for a session: its name, where it leads, its icon and colour
  function hItem(e) {
    var it = hKey(e) ? libItem(hKey(e)) : null;
    if (e.k === "test") return { name: "Resonance test", href: "#resonance-test", icon: "target", col: "var(--hr)", goal: "" };
    if (e.k === "breath" && e.id === "custom") return { name: "Your own breathing pattern", href: "#breathe", icon: "breathe", col: "var(--b-in)", goal: "" };
    if (it) return { name: it.name, href: it.href, icon: it.icon, col: it.col, goal: it.goal };
    // a routine you've since deleted, or something renamed
    return { name: e.n || "A session", href: e.k === "practice" ? "#practice" : "#home", icon: e.k === "breath" ? "breathe" : e.k === "track" ? "sounds" : "practice", col: "var(--accent)", goal: "" };
  }
  function hMins(secs) { return secs < 3600 ? Math.max(1, Math.round(secs / 60)) + " min" : Math.floor(secs / 3600) + " h " + Math.round(secs % 3600 / 60) + " min"; }
  function hDetail(e) {
    var p = [];
    if (e.k === "test") p.push(e.best ? "most swing at " + e.best + " breaths a minute" : "not enough heart data to compare");
    else p.push(hMins(e.secs) + (e.full === false && e.k !== "track" ? ", ended early" : ""));
    if (e.k === "breath" && e.rate) p.push(e.rate + " a minute");
    if (e.beat) p.push(e.beat + " Hz " + (e.band || "").toLowerCase());
    if (e.hr0 && e.hr1) p.push("heart rate " + e.hr0 + " → " + e.hr1);
    else if (e.hrAvg) p.push("heart rate " + e.hrAvg);
    if (e.coh) p.push("coherence " + e.coh.toFixed(1) + (e.est ? " (est.)" : ""));
    if (e.swing) p.push("swing " + e.swing.toFixed(1));
    if (e.note) p.push(e.note);
    return p.join(" · ");
  }

  // local midnight, so a day is a calendar day where you are
  function hDayStart(t) { var d = new Date(t); d.setHours(0, 0, 0, 0); return d.getTime(); }
  function hDayName(t) {
    var d0 = hDayStart(Date.now()), d = hDayStart(t);
    if (d === d0) return "Today";
    if (d0 - d < DAY * 1.5) return "Yesterday";
    var o = { weekday: "long", day: "numeric", month: "long" };
    if (new Date(t).getFullYear() !== new Date().getFullYear()) o.year = "numeric";
    return new Date(t).toLocaleDateString(undefined, o);
  }
  function hTime(t) { return new Date(t).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" }); }
  // the last seven days, today last: sessions and minutes each day, and in all
  function hWeek() {
    var today = hDayStart(Date.now()), days = [], i;
    for (i = 6; i >= 0; i--) {
      var s = new Date(today); s.setDate(s.getDate() - i);
      days.push({ at: s.getTime(), n: 0, secs: 0 });
    }
    var from = days[0].at, goals = {};
    hLoad().forEach(function (e) {
      if (e.at < from) return;
      var d = days[days.length - 1];
      for (i = 0; i < days.length; i++) if (e.at >= days[i].at) d = days[i];
      d.n++; d.secs += e.secs;
      var g = hItem(e).goal;
      if (g) goals[g] = (goals[g] || 0) + e.secs;
    });
    return {
      days: days, goals: goals,
      n: days.reduce(function (a, d) { return a + d.n; }, 0),
      secs: days.reduce(function (a, d) { return a + d.secs; }, 0),
      active: days.filter(function (d) { return d.n; }).length
    };
  }
  // the newest session of each of the last few different things you did
  function hLatest(n) {
    var out = [], seen = {}, l = hLoad();
    for (var i = l.length - 1; i >= 0 && out.length < n; i--) {
      var k = hKey(l[i]) || l[i].k + ":" + l[i].id;
      if (seen[k]) continue;
      seen[k] = true;
      out.push(l[i]);
    }
    return out;
  }
  // when it was, short: "14:05" today, then "Yesterday", "Sat", "3 Oct"
  function hWhen(t) {
    var d0 = hDayStart(Date.now()), d = hDayStart(t);
    if (d === d0) return hTime(t);
    if (d0 - d < DAY * 1.5) return "Yesterday";
    if (d0 - d < DAY * 6.5) return new Date(t).toLocaleDateString(undefined, { weekday: "short" });
    return new Date(t).toLocaleDateString(undefined, { day: "numeric", month: "short" });
  }

  /* ----- drawing it ----- */
  // one session; "when" gives the day as well as the time, for a list that isn't grouped by day
  function hRow(e, when) {
    var it = hItem(e);
    return '<li class="hi-e" style="--pcol:' + it.col + '"><a href="' + esc(it.href) + '">' +
      '<span class="pc-ic"><svg class="i" aria-hidden="true"><use href="#i-' + it.icon + '"/></svg></span>' +
      '<span class="hi-b"><b>' + esc(it.name) + '</b><span>' + esc(hDetail(e)) + "</span></span>" +
      '<time datetime="' + new Date(e.at).toISOString() + '">' + (when ? hWhen(e.at) : hTime(e.at)) + "</time></a></li>";
  }
  function hDays(w) {
    var L = ["S", "M", "T", "W", "T", "F", "S"], max = Math.max.apply(null, w.days.map(function (d) { return d.secs; }).concat([1]));
    return '<div class="hi-days" role="img" aria-label="' + w.active + (w.active === 1 ? " day" : " days") + ' with a session in the last 7 days">' +
      w.days.map(function (d, i) {
        var h = d.secs ? Math.max(18, Math.round(d.secs / max * 100)) : 0;
        return '<span class="hi-day' + (i === 6 ? " now" : "") + '" title="' + esc(new Date(d.at).toLocaleDateString(undefined, { weekday: "long" }) + ": " + (d.n ? d.n + (d.n === 1 ? " session, " : " sessions, ") + hMins(d.secs) : "nothing")) + '">' +
          '<i style="--h:' + h + '%"></i><small>' + L[new Date(d.at).getDay()] + "</small></span>";
      }).join("") + "</div>";
  }
  function hTotals(w) {
    return '<p class="hi-tot"><b>' + w.n + "</b> " + (w.n === 1 ? "session" : "sessions") + " · <b>" + Math.round(w.secs / 60) + "</b> min · <b>" + w.active + "</b> of 7 days</p>";
  }

  function hRender() {
    var l = hLoad(), w = hWeek(), h = '<a class="si-back" href="#home"><svg class="i" aria-hidden="true"><use href="#i-back"/></svg>Today</a>';
    if (!l.length) {
      h += '<div class="hi-empty"><p>Nothing here yet. Practices, breathing sessions and tracks of a minute or more show up here once they end, with your heart-rate change and coherence when a sensor is connected.</p>' +
        '<a class="btn small" href="#practice">Open the library</a></div>';
      $("#hiBody").innerHTML = h;
      return;
    }
    var goals = GOALS.filter(function (g) { return w.goals[g.id]; }), gmax = Math.max.apply(null, goals.map(function (g) { return w.goals[g.id]; }).concat([1]));
    h += '<section class="hi-sum" aria-labelledby="hiWk"><h2 id="hiWk">Last 7 days</h2>' + hTotals(w) + hDays(w) +
      (goals.length ? '<ul class="hi-goals" aria-label="Minutes by goal">' + goals.map(function (g) {
        return '<li style="--gcol:' + GOAL_COL[g.id] + '"><span>' + esc(g.name) + "</span><i style=\"--w:" + Math.max(4, Math.round(w.goals[g.id] / gmax * 100)) + '%"></i><b>' + Math.round(w.goals[g.id] / 60) + " min</b></li>";
      }).join("") + "</ul>" : "") + "</section>";
    var day = -1, open = false;
    for (var i = l.length - 1; i >= 0; i--) {
      var d = hDayStart(l[i].at);
      if (d !== day) {
        if (open) h += "</ul></section>";
        h += '<section class="hi-dsec"><h3>' + esc(hDayName(l[i].at)) + '</h3><ul class="hi-list">';
        day = d; open = true;
      }
      h += hRow(l[i], false);
    }
    if (open) h += "</ul></section>";
    h += '<div class="hi-foot"><p>Your history stays on this device, the last ' + HIST_MAX + ' sessions. Anything under a minute isn\'t kept, and nothing you write in a reflection is.</p>' +
      '<button class="btn small" id="hiClear">Clear history</button></div>';
    $("#hiBody").innerHTML = h;
  }

  function hInit() {
    hLoad();
    $("#hiBody").addEventListener("click", function (e) {
      var b = e.target.closest("#hiClear");
      if (!b) return;
      if (H_ARM && Date.now() - H_ARM < 3000) {
        H_ARM = 0; hClear(); hRender(); toast("History cleared.");
        return;
      }
      H_ARM = Date.now();
      b.textContent = "Tap again to clear everything";
      b.classList.add("armed");
      setTimeout(function () { if (b.isConnected) { b.textContent = "Clear history"; b.classList.remove("armed"); } }, 3000);
    });
  }
