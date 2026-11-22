  /* ---------------------------- the resonance course ----------------------------
     From the guide's advice on how often: the classic protocol for heart-rate-variability biofeedback,
     20 minutes of breathing at your resonance rate twice a day for two months (Lehrer and colleagues,
     2000). Two new techniques (supporter.js):
     - A 20-minute length on Breathe.
     - The resonance course: eight weeks, two sessions a day (or one, for those who keep to the precautionary
       20 minutes a day), each a session of 20 minutes or more at a resonance pace, ticked off from the history
       on Today, with each week's sessions, coherence and swing in History. It says plainly what the guide
       says: the standard protocol, but no added benefit over placebo breathing in a large trial, and the
       20-minute daily cap as a minority, precautionary view.
     Nothing new goes into the history: the course reads the sessions already there.
  ------------------------------------------------------------------------------ */

  var RC_NAME = "Resonance course", RC_LEN = "20 minutes on Breathe";
  var RC_DAYS = 56, RC_WEEKS = 8;
  var RC_MIN = 1170;                    // a session of 19.5 minutes or more counts as 20 (a timed session ends on a whole breath)
  var RC_PACE = [4.5, 7];              // a resonance pace, in breaths a minute: the test's range, with a little to spare
  var RC = { per: 2, arm: 0 };         // per: the setup's sessions a day; arm: End the course waits for a second tap

  /* ----- the course as kept: the day it began (local midnight), sessions a day, and when it was ended early ----- */
  function rcGet() {
    var o = null;
    try { o = JSON.parse(store.get("rcourse") || "null"); } catch (e) {}
    if (!o || typeof o !== "object" || typeof o.at !== "number" || !(o.at > 0) || o.at > 8.64e15) return null;
    return { at: hDayStart(o.at), per: o.per === 1 ? 1 : 2, end: typeof o.end === "number" && o.end > 0 ? o.end : 0 };
  }
  function rcSave(c) { store.set("rcourse", JSON.stringify({ at: c.at, per: c.per, end: c.end || undefined })); }
  // days since the course began, by the calendar (a day with a clock change is still one day)
  function rcDayOf(c, t) { return Math.round((hDayStart(t) - c.at) / DAY); }
  // a session that counts: 20 minutes or more of resonance breathing, on Breathe at a resonance pace, or Heart Coherence
  function rcCounts(e) {
    if (!e || !(e.secs >= RC_MIN)) return false;
    if (e.k === "practice") return e.id === "coherence";
    return e.k === "breath" && !e.ib && ["sigh", "box", "478", "dive"].indexOf(e.id) < 0 && e.rate >= RC_PACE[0] && e.rate <= RC_PACE[1];
  }
  // the course's sessions, each with its day: by when it began, up to the end of the eighth week or an early end
  function rcSess(c) {
    var out = [];
    hLoad().forEach(function (e) {
      if (!rcCounts(e)) return;
      var st = e.at - e.secs * 1000, d = rcDayOf(c, st);
      if (d < 0 || d >= RC_DAYS || (c.end && st > c.end)) return;
      out.push({ e: e, day: d, at: st });
    });
    return out;
  }
  /* Where it stands: today's day and week, today's sessions, and each week's sessions, coherence and swing (the averages
     of the sessions with a reading: coherence from a sensor that sends the time between beats, not the old estimates) */
  function rcStats(c, now) {
    var s = rcSess(c), day = rcDayOf(c, now || Date.now()), wk = [], i, met = {};
    for (i = 0; i < RC_WEEKS; i++) wk.push({ n: 0, coh: [], sw: [] });
    s.forEach(function (x) {
      var w = wk[Math.floor(x.day / 7)];
      w.n++;
      if (x.e.coh && !x.e.est) w.coh.push(x.e.coh);
      if (x.e.swing) w.sw.push(x.e.swing);
      met[x.day] = (met[x.day] || 0) + 1;
    });
    var full = 0;
    for (var k in met) if (met[k] >= c.per) full++;
    return {
      day: day, week: Math.max(1, Math.min(RC_WEEKS, Math.floor(Math.max(0, day) / 7) + 1)),
      over: !!c.end || day >= RC_DAYS, ended: !!c.end && day < RC_DAYS,
      n: s.length, target: c.per * RC_DAYS, full: full,
      today: s.filter(function (x) { return x.day === day; }),
      weeks: wk.map(function (w) { return { n: w.n, coh: w.coh.length ? avg(w.coh) : null, cn: w.coh.length, sw: w.sw.length ? avg(w.sw) : null, sn: w.sw.length }; })
    };
  }
  function rcOn() { return supOn() && !!rcGet(); }
  function rcNum(v, dp) { return v.toFixed(dp); }
  // a measure from its first week with readings to its latest: rising, falling or steady (within 10%)
  function rcTrend(ws, k, name, unit, dp) {
    var have = [];
    ws.forEach(function (w, i) { if (w[k] !== null) have.push({ i: i, v: w[k] }); });
    if (have.length < 2) return "";
    var a = have[0], b = have[have.length - 1], rel = a.v ? (b.v - a.v) / a.v : 0;
    return name + " " + rcNum(a.v, dp) + unit + " in week " + (a.i + 1) + ", " + rcNum(b.v, dp) + unit + " in week " + (b.i + 1) + ": " +
      (rel > 0.1 ? "rising." : rel < -0.1 ? "falling." : "about the same.");
  }

  /* ----- a 20-minute session on Breathe at your resonance pace (the test's answer, or 5.5 a minute) ----- */
  function rcBreathe() {
    if (P.usesB && pBusy()) { pOpen(); return; }    // a practice is using the guide
    if (B.state === "running" || B.state === "paused") { goView("breathe"); return; }
    if (B.finder) finderCancel();
    var half = Math.round(30 / pResRate() * 2) / 2;
    BC.long = false; BC.inh = half; BC.sip = 0; BC.hold = 0; BC.exh = half; BC.rest = 0;
    BC.pattern = matchPreset(); MP.from = "";
    BC.minutes = 20;
    if (B.state === "done") { B.state = "idle"; bFresh(); }
    checkRadio("bpat", BC.pattern); syncChips("#bPats");
    checkRadio("blen", "20"); syncChips("#bLen");
    syncFields(); renderNote(); syncVisHint(); applyTimings(); saveBreath();
    goView("breathe");
  }

  /* ----- the 20-minute length on Breathe: with a donation while this device is locked ----- */
  // picked: at once once unlocked; otherwise the length stays as it was and the dialog opens, and an unlock picks it
  function rcLenPick(v, go) {
    if (v !== 20 || supOn()) { go(); return; }
    checkRadio("blen", String(BC.minutes)); syncChips("#bLen");
    supGate(RC_LEN, go, function (ok) { if (ok) go(); });
  }
  // Start with 20 minutes kept from before, on a device that's locked: the dialog first; closed still locked, 15 minutes
  function rcLenGate(then) {
    if (BC.minutes !== 20 || supOn()) return false;
    supGate(RC_LEN, function () { if (then) bToggle(); }, function (ok) {
      if (ok) { if (then) bToggle(); return; }
      BC.minutes = 15; checkRadio("blen", "15"); syncChips("#bLen");
      if (B.state === "idle") planTotal();
      updateHead(); saveBreath();
    });
    return true;
  }
  function rcChips() {
    var inp = document.querySelector('#bLen input[value="20"]'), lab = inp && inp.parentNode, t = lab && lab.querySelector(".sup-tag");
    if (!lab) return;
    if (t && supOn()) t.parentNode.removeChild(t);
    else if (!t && !supOn()) lab.insertAdjacentHTML("beforeend", supTag(true));
  }

  /* ----- Today: today's sessions ticked off, and the week ----- */
  function rcSlotName(c, i) { return c.per === 1 ? "Today's 20 minutes" : i ? "Second 20 minutes" : "First 20 minutes"; }
  function rcWhat(e) {
    var p = [hItem(e).name];
    if (e.coh && !e.est) p.push("coherence " + e.coh.toFixed(1));
    if (e.swing) p.push("swing " + e.swing.toFixed(1));
    return p.join(" · ");
  }
  function rcTodaySync() {
    var sec = $("#tdCourse"), body = $("#tdCourseBody");
    if (!sec || !body) return;
    var c = rcGet(), now = Date.now();
    if (!c) { sec.hidden = true; return; }
    var st = rcStats(c, now);
    sec.hidden = st.over && rcDayOf(c, now) >= RC_DAYS + 7 || (st.ended && now - c.end > 7 * DAY);   // a week after it ends, History keeps it
    if (sec.hidden) return;
    if (!supOn()) {                                     // kept on from a backup on a locked device: the way to unlock it
      body.innerHTML = '<p class="td-empty">Your resonance course is one of the new techniques. <button type="button" class="btn small rc-unlock" id="tdRcUnlock">Unlock it' + supTag(true) + "</button></p>";
      return;
    }
    if (st.over) {
      body.innerHTML = '<p class="rc-l"><b>' + (st.ended ? "Ended" : "Done") + ":</b> " + st.n + " of " + st.target + " sessions" + (st.ended ? "." : ", over eight weeks.") +
        ' <a href="#rcourse">Your weeks, with coherence and swing</a></p>';
      return;
    }
    var done = st.today.slice(0, c.per), slots = [], i, first = -1;
    for (i = 0; i < c.per; i++) {
      var x = done[i];
      if (!x && first < 0) first = i;
      slots.push('<li class="rh-slot' + (x ? " done" : "") + (i === first ? " now" : "") + '">' +
        '<span class="rh-tick" aria-hidden="true">' + (x ? '<svg class="i"><use href="#i-check"/></svg>' : "") + "</span>" +
        '<span class="rh-b"><b>' + rcSlotName(c, i) + "</b><span>" + esc(x ? "Done at " + hTime(x.at) + ": " + rcWhat(x.e) : i === first ? "At your resonance pace, gently" : "Later today, a few hours apart") + "</span></span>" +
        (i === first ? '<button type="button" class="btn small rh-go rc-go" id="tdRcGo">Breathe 20 min</button>' : "") + "</li>");
    }
    var w = st.weeks[st.week - 1], wt = c.per * 7, more = st.today.length > c.per ? " (and " + (st.today.length - c.per) + " more)" : "";
    body.innerHTML = '<p class="rc-l">Week <b>' + st.week + "</b> of 8 · day " + (st.day + 1) + " of 56</p>" +
      '<ol class="rh-list">' + slots.join("") + "</ol>" +
      '<div class="rh-foot"><span id="tdRcN">' + Math.min(st.today.length, c.per) + " of " + c.per + " today" + more + " · " + w.n + " of " + wt + " this week</span>" +
      '<a class="td-more rc-hc" href="#practice/coherence">Heart Coherence counts too, at 20 minutes</a></div>';
  }

  /* ----- History: the course, its weeks and an honest word ----- */
  /* One small chart for a measure across the eight weeks, on a scale of its own, every value in its bar's label (and the
     table under them): a number, null for a week with no reading, undefined for a week still to come */
  function rcBars(vals, name, fmtV, max, lab) {
    var top = max || Math.max.apply(null, vals.filter(function (v) { return typeof v === "number"; }).concat([0.001])), last = -1;
    vals.forEach(function (v, i) { if (typeof v === "number") last = i; });
    return '<div class="rc-ch"><p class="rc-cn">' + name + (last >= 0 ? ' <span class="rc-lv">· ' + lab(vals[last]) + " in week " + (last + 1) + "</span>" : "") +   // the latest, labelled
      '</p><div class="rc-bars">' + vals.map(function (v, i) {
      var h = !v ? 0 : Math.max(6, Math.round(Math.min(1, v / top) * 100)), t = "Week " + (i + 1) + ": " + (v === undefined ? "to come" : v === null ? "no reading" : fmtV(v));
      return '<span class="rc-bar" role="img" title="' + esc(t) + '" aria-label="' + esc(t) + '"><i style="--h:' + h + '%"></i><small>' + (i + 1) + "</small></span>";
    }).join("") + "</div></div>";
  }
  function rcLede() {
    return '<p class="xp-lede">Lehrer and colleagues\' protocol for heart-rate-variability biofeedback: 20 minutes of breathing at your resonance rate, twice a day, ' +
      "for eight weeks. Each session of 20 minutes or more at a resonance pace ticks off on Today: on Breathe at 4.5 to 7 breaths a minute, such as Resonance 5.5 or " +
      "your own rate from the resonance test, or Heart Coherence. Here, each week's coherence and swing show how closely your heart follows your breath.</p>";
  }
  function rcHonest() {
    return '<p class="xp-honest"><b>What to expect.</b> It\'s the standard protocol, but in the largest placebo-controlled trial, 400 adults who breathed at about 5.5 a minute ' +
      "for ten minutes a day over four weeks improved on stress, anxiety, depression and wellbeing no more than those breathing at a placebo pace of 12 a minute " +
      '(Fincham and colleagues, 2023): much of the benefit seems to come from the daily practice itself (see <a href="#l-expect">expectation and placebo</a>). ' +
      "Breathe gently, no deeper than feels natural, and breathe normally again if you feel light-headed: the original protocol warns against overbreathing.</p>" +
      '<p class="xp-honest"><b>How much.</b> One practice guide suggests keeping home practice to 20 minutes a day, for a risk that\'s only theoretical. ' +
      'That\'s a minority, precautionary view: Once a day follows it. <a href="#l-dose">How often and how long</a></p>';
  }
  function rcPerSeg(cur) {
    return '<div class="so-row so-seg rc-per"><span class="so-l">Sessions a day<small>Twice is the classic protocol; once keeps to 20 minutes a day.</small></span>' +
      '<div class="mini-seg" id="rcPer" role="group" aria-label="Sessions a day">' + [[2, "Twice a day"], [1, "Once a day"]].map(function (o) {
        return '<button type="button" data-v="' + o[0] + '" aria-pressed="' + (o[0] === cur) + '">' + o[1] + "</button>";
      }).join("") + "</div></div>";
  }
  function rcSec() {
    var lk = !supOn(), c = rcGet();
    var h = '<section class="hi-xp hi-rc" id="rcourse" aria-labelledby="rcH"><h2 id="rcH">' + RC_NAME + (lk ? supTag() : "") + "</h2>";
    if (lk && !c) return h + rcLede() + rcHonest() + '<button type="button" class="btn primary" id="rcOpen">Start the course' + supTag(true) + "</button></section>";
    if (!c) return h + rcLede() + rcPerSeg(RC.per) + rcHonest() + '<div class="xp-act"><button type="button" class="btn primary" id="rcGo">Start the course</button></div></section>';
    var st = rcStats(c), wk = st.weeks.slice(0, st.over ? RC_WEEKS : st.week);
    h += '<p class="xp-what"><b>' + (c.per === 1 ? "Once a day" : "Twice a day") + ", from " + esc(new Date(c.at).toLocaleDateString(undefined, { day: "numeric", month: "long" })) + ".</b> " +
      (st.over ? (st.ended ? "Ended in week " + st.week + ": " : "Done: ") : "Week " + st.week + " of 8, day " + (st.day + 1) + " of 56: ") +
      st.n + " of " + st.target + " sessions" + (st.full ? ", " + st.full + (st.full === 1 ? " day" : " days") + " in full." : ".") + "</p>";
    if (!st.over) h += '<p class="xp-next"><span>Next: 20 minutes at your resonance pace, ' + (H.find && H.find.best ? H.find.best + " a minute, from your test." : "5.5 a minute until you take the resonance test.") +
      '</span><button type="button" class="btn small" id="rcBreathe">Breathe 20 min</button></p>';
    var upTo = function (k) { return st.weeks.map(function (w, i) { return i < wk.length ? w[k] : undefined; }); };     // the weeks to come stay empty
    h += '<div class="rc-chs">' +
      rcBars(upTo("n"), "Sessions each week, of " + c.per * 7, function (v) { return v + " of " + c.per * 7 + " sessions"; }, c.per * 7, String) +
      rcBars(upTo("coh"), "Coherence", function (v) { return "coherence " + v.toFixed(1); }, 0, function (v) { return v.toFixed(1); }) +
      rcBars(upTo("sw"), "Swing, beats a minute", function (v) { return "swing " + v.toFixed(1) + " beats a minute"; }, 0, function (v) { return v.toFixed(1); }) + "</div>";
    if (st.n) {
      h += '<div class="xp-tw"><table class="xp-tbl rc-tbl"><caption>Each week of the course</caption><thead><tr><th scope="col">Week</th><th scope="col">Sessions</th><th scope="col">Coherence</th><th scope="col">Swing</th></tr></thead><tbody>' +
        wk.map(function (w, i) {
          return '<tr><th scope="row">' + (i + 1) + "</th><td>" + w.n + "</td><td>" + (w.coh === null ? "—" : w.coh.toFixed(1) + "<small> " + w.cn + "×</small>") + "</td><td>" + (w.sw === null ? "—" : w.sw.toFixed(1) + "<small> bpm</small>") + "</td></tr>";
        }).join("") + "</tbody></table></div>";
      var said = [rcTrend(wk, "coh", "Coherence", "", 1), rcTrend(wk, "sw", "Swing", " beats a minute", 1)].filter(Boolean);
      if (said.length) h += '<ul class="xp-say">' + said.map(function (s) { return "<li>" + esc(s) + "</li>"; }).join("") + "</ul>";
      if (!wk.some(function (w) { return w.coh !== null || w.sw !== null; })) h += '<p class="xp-miss">No heart readings in these sessions yet: with a heart sensor, or the phone\'s camera, on <a href="#heart">Heart</a>, each week\'s coherence and swing show here.</p>';
      else h += '<p class="xp-miss">Coherence and the swing rise as your heart follows your breath more closely. They also move with the sensor\'s fit, the time of day, coffee and sleep, so read the weeks together rather than one session.</p>';
    } else h += '<p class="xp-miss">No sessions yet. A session of 20 minutes or more at a resonance pace counts, on Breathe or as Heart Coherence.</p>';
    if (!st.over) h += rcPerSeg(c.per);
    h += rcHonest();
    h += '<div class="xp-act">' + (st.over ? '<button type="button" class="btn primary" id="rcNew">Start a new course</button>' : '<button type="button" class="btn small" id="rcEnd">End the course</button>') + "</div>";
    return h + "</section>";
  }
  function rcStart() {
    supGate(RC_NAME, function () {
      rcSave({ at: hDayStart(Date.now()), per: RC.per === 1 ? 1 : 2, end: 0 });
      rcRedraw();
      toast("The course starts today: " + (RC.per === 1 ? "one session" : "two sessions") + " of 20 minutes a day, ticked off on Today.", { ms: 4500 });
    }, function (ok) { if (ok) rcRedraw(); });
  }
  function rcRedraw() {
    if (curView === "history") {
      var sec = $("#rcourse");
      if (sec) sec.outerHTML = rcSec(); else hRender();
    }
    if (curView === "home") rcTodaySync();
  }
  function rcClick(ev) {
    var t = ev.target;
    if (t.closest("#rcOpen")) { supGate(RC_NAME, rcRedraw); return; }
    if (t.closest("#rcGo")) { rcStart(); return; }
    if (t.closest("#rcBreathe, #tdRcGo")) { rcBreathe(); return; }
    if (t.closest("#tdRcUnlock")) { supGate(RC_NAME, rcTodaySync); return; }
    if (t.closest("#rcNew")) { storeDel("rcourse"); rcRedraw(); var g = $("#rcGo"); if (g) g.focus(); return; }
    var pb = t.closest("#rcPer button");
    if (pb) {
      var v = +pb.getAttribute("data-v"), c = rcGet();
      if (c) { c.per = v; rcSave(c); } else RC.per = v;
      rcRedraw();
      var nb = document.querySelector('#rcPer button[data-v="' + v + '"]');
      if (nb) nb.focus();
      return;
    }
    var b = t.closest("#rcEnd");
    if (!b) return;
    if (RC.arm && Date.now() - RC.arm < 3000) {
      RC.arm = 0;
      var x = rcGet();
      if (x) { x.end = Date.now(); rcSave(x); }
      rcRedraw();
      toast("Course ended. Its weeks stay in History.");
      return;
    }
    RC.arm = Date.now();
    b.textContent = "Tap again to end it";
    b.classList.add("armed");
    setTimeout(function () { if (b.isConnected) { b.textContent = "End the course"; b.classList.remove("armed"); } }, 3000);
  }

  /* ----- after an unlock, and starting up ----- */
  function rcUI() {
    rcChips();
    rcTodaySync();
    if (curView === "history") rcRedraw();
  }
  function rcInit() {
    SUP_EXTRA.push({ name: RC_LEN, href: "#breathe" }, { name: RC_NAME, href: "#rcourse" });     // Settings' list of what the donation unlocks
    $("#hiBody").addEventListener("click", rcClick);
    $("#tdCourseBody").addEventListener("click", rcClick);
    rcUI();
    if (window.__entrain) {
      var X = window.__entrain;
      X.rcGet = rcGet; X.rcStats = rcStats; X.rcCounts = rcCounts; X.rcSess = rcSess; X.rcTrend = rcTrend; X.rcBreathe = rcBreathe; X.RC = RC;
    }
  }
