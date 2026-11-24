  /* ------------------------------- your own data -------------------------------
     From the guide's advice on measuring what helps you. Four things, each one of the new techniques
     (supporter.js), and none of them sends anything anywhere:
     - Check in before and after (Settings): your mood and your stress from 0 to 10 as any practice,
       breathing session or track starts, and again as it ends, kept in the history (mood0, mood1, str0,
       str1) and set against your usual change with the same thing.
     - Today's minutes and the days in a row you've practised, on Today and History, put gently: the days
       of the last month sit beside them, since how often you practise over the weeks is what counts.
     - A daily rhythm on Today: three spaced sessions (morning energy, a midday reset, an evening
       wind-down), each with a practice you choose, ticked off from the history, with reminders as a
       calendar file (a web page can't remind you once it's closed) and a nudge while the app is open.
     - A personal experiment in History: one practice done two ways (with its beat or without, with music
       or without, with a scene or the usual visual) or against another practice, alternated in shuffled
       pairs over ten sessions, with the heart-rate change, coherence and check-ins set side by side and an
       honest word on noise and expectation.
     What's already in your history stays readable either way.
  ------------------------------------------------------------------------------ */

  var CI_NAME = "Check in before and after";
  var OW_NAME = "Today's minutes and streak";
  var RHM_NAME = "Daily rhythm";
  var XP_NAME = "Personal experiments";

  // a number from 0 to 10, as a check-in keeps it
  function ciNum(v) { return typeof v === "number" && isFinite(v); }
  function ciN(v) { v = Math.round(v * 10) / 10; return v % 1 ? v.toFixed(1) : String(v); }
  function ciSigned(v) { v = Math.round(v * 10) / 10; return v > 0 ? "+" + ciN(v) : v < 0 ? "−" + ciN(-v) : "0"; }
  // the middle of a list of numbers (all of them, not only the last ten)
  function owMed(vals) {
    if (!vals.length) return null;
    var s = vals.slice().sort(function (a, b) { return a - b; }), m = s.length >> 1;
    return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
  }
  // the same thing in the history, as favourites and the end screen's usual see it
  function owKey(e) { return hKey(e) || e.k + ":" + e.id; }

  /* ----- check in before and after ----- */
  /* mode: "before" (go starts the session once you've rated or skipped), "after" (a breathing session or track has
     just gone into the history: e is its entry) or "said" (the change, shown). m, s: the mood and stress picked.
     pend: for each kind of session (practice, breath, track), a before waiting for its session to be logged,
     { kind, m, s, at, track }: one of each, since a practice starting ends a breathing session that has its own.
     pass: go() is running, so the way in lets it through. carry: the after you gave on an end screen, for the
     practice it leads on to. */
  var CI = { mode: "", kind: "", name: "", go: null, e: null, m: null, s: null, pend: { practice: null, breath: null, track: null }, pass: false, carry: null };
  var CI_Q = [["m", "Mood", "0 very low, 10 as good as it gets"], ["s", "Stress", "0 not at all, 10 as stressed as you get"]];

  function ciOn() { return supOn() && store.get("checkIn") === "1"; }
  // the change from before to after, or null: k "mood" or "str"
  function ciDiff(e, k) { return e && ciNum(e[k + "0"]) && ciNum(e[k + "1"]) ? e[k + "1"] - e[k + "0"] : null; }
  // the two rows of 0 to 10
  function ciGrid(pre, m, s) {
    return CI_Q.map(function (q) {
      var v = q[0] === "m" ? m : s, b = [];
      for (var i = 0; i <= 10; i++) b.push('<button type="button" data-v="' + i + '" aria-pressed="' + (v === i) + '">' + i + "</button>");
      return '<div class="ci-q"><span class="ci-l" id="' + pre + q[0] + 'L">' + q[1] + "<small>" + q[2] + "</small></span>" +
        '<div class="ci-g" role="group" aria-labelledby="' + pre + q[0] + 'L" data-ci="' + q[0] + '">' + b.join("") + "</div></div>";
    }).join("");
  }
  // a tap in a row: that value, or none if it was already chosen
  function ciPick(btn) {
    var g = btn.closest(".ci-g"), v = +btn.getAttribute("data-v"), on = btn.getAttribute("aria-pressed") !== "true";
    g.querySelectorAll("button").forEach(function (b) { b.setAttribute("aria-pressed", String(on && b === btn)); });
    return { k: g.getAttribute("data-ci"), v: on ? v : null };
  }
  function ciWas(p) {
    return [ciNum(p.m) ? "mood " + p.m : "", ciNum(p.s) ? "stress " + p.s : ""].filter(Boolean).join(", ");
  }
  // what a breathing session is called, for the dialog
  function ciBreathName() {
    var p = preset(BC.pattern) || mpGet(BC.pattern);
    return p ? patName(p) : "your breathing session";
  }

  /* Before a session starts: the dialog, and go() once you've rated or skipped. False when there's no check-in to
     do (they're off, this device is locked, or go is already running), and the caller starts at once. */
  function ciBefore(kind, name, go) {
    if (CI.pass || !ciOn()) return false;
    CI.mode = "before"; CI.kind = kind; CI.name = name; CI.go = go; CI.e = null; CI.m = null; CI.s = null;
    ciOpen();
    return true;
  }
  // a before, taken by the session it was for (a track's, by that track)
  function ciTake(kind, track) {
    var p = CI.pend[kind];
    if (kind === "practice" && p && Date.now() - p.at > 300000) p = CI.pend.practice = null;   // a practice's is taken as it starts: one left over is from a start that didn't happen
    if (!p || (kind === "track" && p.track !== track)) return null;
    CI.pend[kind] = null;
    return p;
  }
  // a track that starts after its check-in owns it
  function ciBind(track) { var p = CI.pend.track; if (p && !p.track && !track.practice) p.track = track; }
  // the practice an end screen leads on to starts from the after you've just given there
  function ciCarry() {
    var c = CI.carry;
    CI.carry = null;
    return ciOn() && c && Date.now() - c.at < 20 * 60000 && (ciNum(c.m) || ciNum(c.s)) ? { m: c.m, s: c.s, at: Date.now() } : null;
  }
  // a session's entry, with the before it carries
  function ciTag(e, p) {
    if (p) { if (ciNum(p.m)) e.mood0 = p.m; if (ciNum(p.s)) e.str0 = p.s; }
    return e;
  }
  // an after, written into the session's entry in the history
  function ciPatch(at, m, s) {
    var l = hLoad(), e = null;
    for (var i = l.length - 1; i >= 0; i--) if (l[i].at === at) { e = l[i]; break; }
    if (!e) return null;
    if (ciNum(m)) e.mood1 = m; else delete e.mood1;
    if (ciNum(s)) e.str1 = s; else delete e.str1;
    hSave();
    return e;
  }

  function ciOpen() {
    if ($("#bStage").classList.contains("focus")) setFocus(false);     // a full-screen stage would hide the dialog
    var before = CI.mode === "before";
    bSetT("#ciTitle", before ? "Check in" : "How do you feel now?");
    bSetT("#ciWhat", before ? "Before " + CI.name + ": how are you right now? Tap a number for each, or skip."
      : CI.name + " has ended. The same two again, to see the change.");
    $("#ciQs").innerHTML = ciGrid("ciD", CI.m, CI.s);
    $("#ciQs").hidden = false;
    $("#ciRes").hidden = true;
    bSetT("#ciGo", before ? "Start" : "Save");
    $("#ciSkip").hidden = false;
    if ($("#ciModal").hidden) openDialog("#ciModal");
    $("#ciModal .modal-card").scrollTop = 0;
    setTimeout(function () { try { $("#ciGo").focus({ preventScroll: true }); } catch (e) {} }, 30);
  }
  function ciClose() {
    CI.mode = ""; CI.go = null; CI.e = null;
    if (!$("#ciModal").hidden) closeDialog("#ciModal");
  }
  // Start (with what you rated) or Skip: the session begins
  function ciBegin(skip) {
    var go = CI.go, rated = !skip && (ciNum(CI.m) || ciNum(CI.s));
    CI.pend[CI.kind] = rated ? { kind: CI.kind, m: CI.m, s: CI.s, at: Date.now(), track: null } : null;
    ciClose();
    CI.pass = true;
    try { if (go) go(); } finally { CI.pass = false; }
  }
  /* A breathing session or a track has gone into the history with a before: the same two again, a moment later,
     unless something else has started or another dialog is open (I need to stop's, say). */
  function ciAfterSoon(e, name) {
    setTimeout(function () {
      if (pBusy() || B.state === "running" || B.state === "paused" || A.playing || document.querySelector(".modal:not([hidden])")) return;
      CI.mode = "after"; CI.kind = e.k; CI.name = name; CI.e = e; CI.go = null; CI.m = null; CI.s = null;
      ciOpen();
    }, 400);
  }
  function ciSaveAfter() {
    var e = CI.e;
    if (!e || (!ciNum(CI.m) && !ciNum(CI.s))) { ciClose(); return; }
    e = ciPatch(e.at, CI.m, CI.s) || e;
    CI.mode = "said";
    $("#ciQs").hidden = true;
    $("#ciRes").innerHTML = ciResHtml(e) || "<p>Kept in your history.</p>";
    $("#ciRes").hidden = false;
    bSetT("#ciGo", "Close");
    $("#ciSkip").hidden = true;
    if (curView === "home") todayRender(); else if (curView === "history") hRender();
  }

  // the change, then your usual change with the same thing, then a word on what one rating can show
  function ciResHtml(e) {
    var dm = ciDiff(e, "mood"), ds = ciDiff(e, "str"), ch = [], key = owKey(e), name = hItem(e).name;
    if (dm !== null) ch.push("mood " + e.mood0 + " → " + e.mood1 + " (" + ciSigned(dm) + ")");
    if (ds !== null) ch.push("stress " + e.str0 + " → " + e.str1 + " (" + ciSigned(ds) + ")");
    if (!ch.length) return "";
    var p = ["Your " + ch.join(", ") + "."];
    var prev = hLoad().filter(function (x) { return x.at !== e.at && owKey(x) === key; });
    var um = sdUsual(prev.map(function (x) { return ciDiff(x, "mood"); }).filter(ciNum));
    var us = sdUsual(prev.map(function (x) { return ciDiff(x, "str"); }).filter(ciNum));
    if (um || us) {
      var n = Math.max(um ? um.n : 0, us ? us.n : 0), cmp = [];
      if (um && dm !== null) cmp.push(Math.abs(dm - um.v) < 1 ? "your mood moved about as usual" : dm > um.v ? "your mood lifted more than usual" : "your mood lifted less than usual");
      if (us && ds !== null) cmp.push(Math.abs(ds - us.v) < 1 ? "your stress moved about as usual" : ds < us.v ? "your stress eased more than usual" : "your stress eased less than usual");
      p.push((n === 1 ? "Last time with " : "Usually with ") + name + ": " + [um ? "mood " + ciSigned(um.v) : "", us ? "stress " + ciSigned(us.v) : ""].filter(Boolean).join(", ") +
        (n === 1 ? "." : ", the middle of your last " + n + " check-ins.") + (cmp.length ? " This time " + cmp.join(", and ") + "." : ""));
    } else p.push("Your first check-in with " + name + ". After a few more, this shows your usual change.");
    p.push("A rating straight afterwards is partly what you expected to feel, so your usual over many sessions says more than this one.");
    return p.map(function (x) { return "<p>" + esc(x) + "</p>"; }).join("");
  }
  // History's line for a session: its check-in
  function ciDetail(e) {
    var p = [];
    if (ciDiff(e, "mood") !== null) p.push("mood " + e.mood0 + " → " + e.mood1); else if (ciNum(e.mood0)) p.push("mood " + e.mood0 + " before");
    if (ciDiff(e, "str") !== null) p.push("stress " + e.str0 + " → " + e.str1); else if (ciNum(e.str0)) p.push("stress " + e.str0 + " before");
    return p.join(" · ");
  }

  /* ----- the end screen of a practice: the after, right there ----- */
  function ciCard(r) {
    if (!r.ci || !r.at || !ciOn() || (!ciNum(r.ci.m) && !ciNum(r.ci.s))) return "";
    return '<div class="note-card ci-card" id="sdCi"><h3>How do you feel now?</h3>' +
      '<p class="ci-was">Before: ' + esc(ciWas(r.ci)) + ". The same two again, to see the change.</p>" + ciGrid("sdCi", null, null) +
      '<div class="ci-res" id="sdCiRes" aria-live="polite" hidden></div></div>';
  }
  function ciCardWire(r) {
    var card = $("#sdCi");
    if (!card) return;
    var now = { m: null, s: null };
    card.addEventListener("click", function (ev) {
      var b = ev.target.closest(".ci-g button");
      if (!b) return;
      var x = ciPick(b);
      now[x.k] = x.v;
      var e = ciPatch(r.at, now.m, now.s), res = $("#sdCiRes"), h = e ? ciResHtml(e) : "";
      CI.carry = { m: now.m, s: now.s, at: Date.now() };
      res.innerHTML = h;
      res.hidden = !h;
    });
  }

  /* ----- History: what your check-ins say, as trends rather than verdicts ----- */
  function ciSec() {
    var l = hLoad().filter(function (e) { return ciDiff(e, "mood") !== null || ciDiff(e, "str") !== null; });
    if (!l.length) return "";
    var by = {}, keys = [];
    l.forEach(function (e) { var k = owKey(e); if (!by[k]) { by[k] = []; keys.push(k); } by[k].push(e); });
    var md = function (es, k) { return owMed(es.map(function (e) { return ciDiff(e, k); }).filter(ciNum)); };
    var rows = keys.map(function (k) {
      var es = by[k], it = hItem(es[es.length - 1]);
      return { name: it.name, href: it.href, n: es.length, m: md(es, "mood"), s: md(es, "str") };
    }).filter(function (x) { return x.n >= 2; });
    rows.sort(function (a, b) { return (b.m === null ? -99 : b.m) - (a.m === null ? -99 : a.m) || (a.s === null ? 99 : a.s) - (b.s === null ? 99 : b.s) || b.n - a.n; });
    var am = md(l, "mood"), as = md(l, "str");
    return '<section class="hi-ci" id="checkins" aria-labelledby="hiCiH"><h2 id="hiCiH">Your check-ins</h2>' +
      '<p class="hi-tot"><b>' + l.length + "</b> " + (l.length === 1 ? "check-in" : "check-ins") +
        (am !== null ? " · mood usually <b>" + ciSigned(am) + "</b>" : "") + (as !== null ? " · stress usually <b>" + ciSigned(as) + "</b>" : "") + "</p>" +
      (rows.length ? '<ul class="ci-list" aria-label="The usual change with each">' + rows.slice(0, 6).map(function (x) {
        return '<li><a href="' + esc(x.href) + '">' + esc(x.name) + "</a><span>" + [x.m !== null ? "mood " + ciSigned(x.m) : "", x.s !== null ? "stress " + ciSigned(x.s) : "", x.n + " times"].filter(Boolean).join(" · ") + "</span></li>";
      }).join("") + "</ul>" : '<p class="ci-note">Check in with a practice twice or more, and it shows here with its usual change.</p>') +
      '<p class="ci-note">The middle change in your own ratings, from before to after, most lift first. A rating straight afterwards includes what you expected to feel, and a point or two either way is often chance: a trend to notice, not a verdict.</p></section>';
  }

  /* ----- today's minutes and the days in a row ----- */
  // minutes today, the run of days with a session (today counts once it has one), and the days of the last 30
  function owDays() {
    var days = {}, i, k;
    hLoad().forEach(function (e) { var ds = hDayStart(e.at); days[ds] = (days[ds] || 0) + e.secs; });
    var t0 = hDayStart(Date.now()), today = days[t0] || 0, run = 0, d30 = 0;
    for (k = today ? t0 : owPrev(t0); days[k]; k = owPrev(k)) run++;
    for (i = 0, k = t0; i < 30; i++, k = owPrev(k)) if (days[k]) d30++;
    return { today: today, run: run, live: !!today, d30: d30 };
  }
  // the start of the day before, as hDayStart keys it: midday before it, so a day of 23 or 25 hours, or a clock
  // change at midnight (where that day starts at 1 a.m.), keeps each day's key
  function owPrev(k) { return hDayStart(k - DAY / 2); }
  // the line for Today and History; while locked, the way to unlock it
  function owHtml(id) {
    if (!supOn()) return '<button type="button" class="ow-lk" id="' + id + '"><svg class="i" aria-hidden="true"><use href="#i-today"/></svg>Today\'s minutes and your days in a row' + supTag() + "</button>";
    var o = owDays(), note = o.live ? "" : o.run ? "Today is still open: a session of a minute or more adds to the run."
      : "A missed day isn't a setback: what counts is how often you practise over the weeks.";
    return '<div class="ow-day" id="' + id + '"><p class="ow-l"><b>' + Math.round(o.today / 60) + "</b> min today" +
      (o.run >= 2 ? " · <b>" + o.run + "</b> days in a row" + (o.live ? "" : " up to yesterday") : "") +
      " · <b>" + o.d30 + "</b> of the last 30 days</p>" + (note ? '<p class="ow-n">' + note + "</p>" : "") + "</div>";
  }

  /* ----- a daily rhythm ----- */
  var RHM_SLOTS = [
    { id: "morning", name: "Morning energy", time: "07:30", key: "morning-tonic" },
    { id: "midday", name: "Midday reset", time: "13:00", key: "calm-reset" },
    { id: "evening", name: "Evening wind-down", time: "20:30", key: "body-scan" }
  ];
  var RHM_DAY = 240;                    // a rhythm's day runs from 4 in the morning to 4 the next, in minutes
  function rhmTimeOk(t) { return typeof t === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(t); }
  function rhmKeyOk(k) {
    if (typeof k !== "string" || !k) return false;
    if (k.indexOf("b:") === 0) { var b = preset(k.slice(2)); return !!(b && b.goal); }
    var d = pDef(k);
    return !!d && !d.stress && !d.custom;
  }
  // as kept: on or off, and each slot's time and practice (a practice id, or b: and a breathing pattern)
  function rhmGet() {
    var o = null;
    try { o = JSON.parse(store.get("rhythm") || "null"); } catch (e) {}
    if (!o || typeof o !== "object") o = {};
    var sl = o.slots && typeof o.slots === "object" ? o.slots : {};
    return { on: o.on === true, slots: RHM_SLOTS.map(function (s) {
      var k = sl[s.id] && typeof sl[s.id] === "object" ? sl[s.id] : {};
      return { id: s.id, name: s.name, time: rhmTimeOk(k.time) ? k.time : s.time, key: rhmKeyOk(k.key) ? k.key : s.key };
    }) };
  }
  function rhmSave(r) {
    var sl = {};
    r.slots.forEach(function (s) { sl[s.id] = { time: s.time, key: s.key }; });
    store.set("rhythm", JSON.stringify({ on: !!r.on, slots: sl }));
  }
  function rhmOn() { return supOn() && rhmGet().on; }
  function rhmMins(t) { var p = t.split(":"); return +p[0] * 60 + +p[1]; }
  // where today's rhythm began: 4 this morning, or yesterday's 4 a.m. in the small hours
  function rhmDay0(now) {
    var d = new Date(now);
    d.setHours(4, 0, 0, 0);
    if (d.getTime() > now) d.setDate(d.getDate() - 1);
    return d.getTime();
  }
  // each slot's part of the day, in minutes after 4 a.m.: from halfway after the slot before it to halfway to the next
  function rhmWins(r) {
    var at = r.slots.map(function (s) { var m = rhmMins(s.time) - RHM_DAY; return m < 0 ? m + 1440 : m; });
    var ord = [0, 1, 2].sort(function (a, b) { return at[a] - at[b]; }), w = [];
    ord.forEach(function (i, j) {
      w[i] = { at: at[i], from: j ? (at[ord[j - 1]] + at[i]) / 2 : 0, to: j < ord.length - 1 ? (at[i] + at[ord[j + 1]]) / 2 : 1440 };
    });
    return w;
  }
  // today's sessions, slot by slot: the first one that began in each slot's part of the day, or null
  function rhmDone(r, now) {
    var d0 = rhmDay0(now), w = rhmWins(r), out = r.slots.map(function () { return null; });
    hLoad().forEach(function (e) {
      var st = e.at - e.secs * 1000, m = (st - d0) / 6e4;
      if (m < 0 || m >= 1440) return;
      for (var i = 0; i < w.length; i++) if (m >= w[i].from && m < w[i].to && !out[i]) out[i] = e;
    });
    return out;
  }
  // the slot whose part of the day it is now
  function rhmNow(r, now) {
    var m = (now - rhmDay0(now)) / 6e4, w = rhmWins(r);
    for (var i = 0; i < w.length; i++) if (m >= w[i].from && m < w[i].to) return i;
    return -1;
  }
  // a slot's practice as the library shows it
  function rhmItem(s) { return libItem(s.key) || { name: s.key, href: "#practice", type: "" }; }
  // Today: the offer (after a few sessions, until it's set up or put off), or the rhythm itself
  function rhmSync() {
    var sec = $("#tdRhythm"), off = $("#tdRhOffer");
    if (!sec || !off) return;
    var r = rhmGet(), on = r.on && supOn();
    off.hidden = on || r.on || store.get("rhmLater") === "1" || hLoad().length < 3;
    if (!off.hidden) {
      var go = $("#tdRhGo"), tag = go.querySelector(".sup-tag");
      if (tag && supOn()) tag.parentNode.removeChild(tag);
      else if (!tag && !supOn()) go.insertAdjacentHTML("beforeend", supTag(true));
    }
    sec.hidden = !r.on;                               // kept on from a backup on a locked device: the way to unlock it
    if (!r.on) return;
    if (!on) {
      $("#tdRhythmBody").innerHTML = '<p class="td-empty">Your daily rhythm is one of the new techniques. <button type="button" class="btn small rh-unlock" id="tdRhUnlock">Unlock it' + supTag(true) + "</button></p>";
      return;
    }
    var now = Date.now(), done = rhmDone(r, now), cur = rhmNow(r, now), n = done.filter(Boolean).length;
    $("#tdRhythmBody").innerHTML = '<ol class="rh-list">' + r.slots.map(function (s, i) {
      var it = rhmItem(s), e = done[i];
      return '<li class="rh-slot' + (e ? " done" : "") + (i === cur && !e ? " now" : "") + '">' +
        '<span class="rh-tick" aria-hidden="true">' + (e ? '<svg class="i"><use href="#i-check"/></svg>' : "") + "</span>" +
        '<span class="rh-b"><b>' + esc(s.name) + (i === cur && !e ? ' <em class="rh-now">Now</em>' : "") + "</b><span>" +
        esc(e ? "Done at " + hTime(e.at - e.secs * 1000) + ": " + hItem(e).name : s.time + " · " + it.name) + "</span></span>" +
        (e ? "" : '<a class="btn small rh-go" href="' + esc(it.href) + '" aria-label="Open ' + esc(it.name) + '">Open</a>') + "</li>";
    }).join("") + "</ol>" +
      '<div class="rh-foot"><span id="tdRhN">' + n + " of 3 today" + (n === 3 ? ". Nicely spread." : ".") + '</span><button type="button" class="btn small" id="tdRhIcs"><svg class="i" aria-hidden="true"><use href="#i-bell"/></svg>Calendar reminders</button></div>';
  }
  // set it up: with a donation first while locked
  function rhmStart(then) {
    supGate(RHM_NAME, function () {
      var r = rhmGet();
      r.on = true;
      rhmSave(r);
      if (then) then();
    });
  }

  /* The reminders, as a calendar file: three events that repeat every day, each with an alert at its time and a
     link back to its practice. A web page can't remind you once it's closed; your calendar can. Floating local
     times (no time zone), so each stays at the time you chose wherever you are. */
  function rhmEsc(t) { return String(t).replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n"); }
  // lines longer than 75 bytes are folded: the rest goes on the next line, after a space
  function rhmFold(line) {
    var out = [], cur = "", n = 0;
    for (var i = 0; i < line.length; i++) {
      var c = line.charCodeAt(i), ch = line.charAt(i), b = c < 0x80 ? 1 : c < 0x800 ? 2 : 3;
      if (c >= 0xD800 && c <= 0xDBFF && i + 1 < line.length) { ch += line.charAt(++i); b = 4; }
      if (n + b > 75) { out.push(cur); cur = " "; n = 1; }
      cur += ch; n += b;
    }
    out.push(cur);
    return out.join("\r\n");
  }
  function rhmIcs(r, now) {
    now = new Date(now || Date.now());
    var p2 = function (x) { return (x < 10 ? "0" : "") + x; };
    var day = now.getFullYear() + p2(now.getMonth() + 1) + p2(now.getDate());
    var stamp = now.toISOString().replace(/[-:]/g, "").replace(/\.\d+Z$/, "Z");
    var base = String(location.href).split("#")[0], host = location.host || "entrain.local";
    var L = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Entrain//Daily rhythm//EN", "CALSCALE:GREGORIAN", "METHOD:PUBLISH", "X-WR-CALNAME:Entrain daily rhythm"];
    r.slots.forEach(function (s) {
      var it = rhmItem(s), url = base + it.href, what = s.name + ": " + it.name;
      var mins = it.type === "practice" || it.type === "track" ? Math.max(3, Math.min(60, it.mins[0])) : 5;
      L.push("BEGIN:VEVENT", "UID:entrain-rhythm-" + s.id + "@" + host, "DTSTAMP:" + stamp,
        "DTSTART:" + day + "T" + s.time.replace(":", "") + "00", "DURATION:PT" + mins + "M", "RRULE:FREQ=DAILY",
        "SUMMARY:" + rhmEsc(what), "DESCRIPTION:" + rhmEsc("Your daily rhythm in Entrain: " + it.name + ", about " + mins + " minutes. Open it here: " + url),
        "URL:" + url, "TRANSP:TRANSPARENT",
        "BEGIN:VALARM", "ACTION:DISPLAY", "DESCRIPTION:" + rhmEsc(what), "TRIGGER:PT0M", "END:VALARM", "END:VEVENT");
    });
    L.push("END:VCALENDAR");
    return L.map(rhmFold).join("\r\n") + "\r\n";
  }
  // a file to keep: downloaded, or in Claude's preview offered by the viewer (as a backup is)
  function owSaveFile(name, text, type, saved) {
    var viewer = window.claude && typeof window.claude.use === "function" ? window.claude : null;
    var cant = function () { toast("This preview can't save files. Open Entrain itself to save the reminders."); };
    if (viewer) {
      viewer.use("downloads").then(function (dl) {
        if (!dl) { cant(); return; }
        dl.save({ filename: name, data: text }).then(saved, function (e) {
          var code = e && e.code;
          if (code === "declined") return;
          if (code === "rate_limited") toast("A save is already waiting for your answer.");
          else cant();
        });
      }, cant);
      return;
    }
    var a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([text], { type: type }));
    a.download = name;
    a.hidden = true;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 60000);
    saved();
  }
  function rhmDownload() {
    supGate(RHM_NAME, function () {
      var name = "entrain-daily-rhythm.ics";
      owSaveFile(name, rhmIcs(rhmGet()), "text/calendar", function () {
        toast("Saved " + name + ". Open it to add the three daily reminders to your calendar.", { ms: 9000 });
      });
    });
  }
  /* While the app is open: once a slot's time has come, and nothing is done in its part of the day yet, a nudge,
     once a day for each slot, and never over a session, a track or a dialog. */
  function rhmNudge(now) {
    now = now || Date.now();
    if (!rhmOn() || document.hidden || pBusy() || B.state === "running" || B.state === "paused" || A.playing || FD.open || APP.sticky ||
      document.querySelector(".modal:not([hidden])")) return "";
    var r = rhmGet(), i = rhmNow(r, now), w = rhmWins(r), m = (now - rhmDay0(now)) / 6e4;
    if (i < 0 || m < w[i].at || m > w[i].at + 120 || rhmDone(r, now)[i]) return "";
    var tag = rhmDay0(now) + ":" + r.slots[i].id, seen = store.get("rhmNudged") || "";
    if (seen.split(",").indexOf(tag) >= 0) return "";
    store.set("rhmNudged", seen.split(",").filter(function (x) { return x.split(":")[0] === String(rhmDay0(now)); }).concat([tag]).join(","));
    var s = r.slots[i], it = rhmItem(s);
    toast("Time for your " + s.name.toLowerCase() + ": " + it.name + ".", { action: "Open", ms: 15000, onAct: function () { location.hash = it.href.slice(1); } });
    return s.id;
  }

  /* ----- Settings: check-ins and the daily rhythm ----- */
  // the practices to pick from, by goal, then the breathing patterns
  function owPracOpts(cur) {
    var h = GOALS.map(function (g) {
      var ds = PRACTICES.filter(function (d) { return d.goal === g.id && !d.stress; }).sort(function (a, b) { return (a.rank || 0) - (b.rank || 0); });
      return ds.length ? '<optgroup label="' + esc(g.name) + '">' + ds.map(function (d) {
        return '<option value="' + d.id + '"' + (d.id === cur ? " selected" : "") + ">" + esc(d.name) + "</option>";
      }).join("") + "</optgroup>" : "";
    }).join("");
    return h + '<optgroup label="Breathing patterns">' + BREATHS.filter(function (b) { return b.goal; }).map(function (b) {
      var k = "b:" + b.id;
      return '<option value="' + k + '"' + (k === cur ? " selected" : "") + ">" + esc(patName(b)) + "</option>";
    }).join("") + "</optgroup>";
  }
  function ciStCard() {
    var r = rhmGet(), rOn = r.on && supOn();
    return '<section class="st-card" id="st-checkin" aria-labelledby="stCi"><h2 id="stCi">Check-ins and daily rhythm</h2>' +
      '<p class="st-note">Your own data, kept on this device: how you feel before and after, and short sessions spread through the day. ' +
        '<a href="#l-checkin">Why check in</a></p>' +
      pToggle("stCiOn", '<span id="stCiL">' + CI_NAME + supTag(true) + "</span>", ciOn(),
        "Your mood and your stress from 0 to 10 as any practice, breathing session or track starts, and again as it ends, kept in your history and set against your usual change.") +
      '<h3 class="sup-h" id="st-rhythm">Daily rhythm</h3>' +
      '<p class="st-note">Morning energy, a midday reset and an evening wind-down on Today, each with a practice you choose, ticked off from your history. ' +
        '<a href="#l-rhythm">Why spread it out</a></p>' +
      pToggle("stRhOn", '<span id="stRhL">On Today' + supTag(true) + "</span>", rOn, "") +
      (rOn ? '<div class="rh-set">' + r.slots.map(function (s) {
        return '<div class="rh-row"><span class="rh-n" id="rhN-' + s.id + '">' + esc(s.name) + "</span>" +
          '<input type="time" class="rh-t" id="rhT-' + s.id + '" value="' + s.time + '" aria-labelledby="rhN-' + s.id + '">' +
          '<select class="rh-k" id="rhK-' + s.id + '" aria-label="The practice for ' + esc(s.name.toLowerCase()) + '">' + owPracOpts(s.key) + "</select></div>";
      }).join("") + "</div>" +
        '<div class="st-data-act"><button class="btn" id="stRhIcs"><svg class="i" aria-hidden="true"><use href="#i-bell"/></svg>Add reminders to your calendar</button></div>' +
        '<p class="st-note">A web page can\'t remind you once it\'s closed, so the reminders are a calendar file: three daily events, each with an alert at its time and a link back to its practice. ' +
          "While Entrain is open, it also nudges you once at each time.</p>" : "") +
      "</section>";
  }
  function ciStWire() {
    var ci = $("#stCiOn"), rh = $("#stRhOn");
    if (!ci) return;
    ci.addEventListener("change", function () {
      if (!this.checked) { store.set("checkIn", "0"); return; }
      this.checked = false;
      supGate(CI_NAME, function () {
        store.set("checkIn", "1");
        var c = $("#stCiOn"); if (c) c.checked = true;
      }, function (ok) { if (ok) { store.set("checkIn", "1"); var c = $("#stCiOn"); if (c) c.checked = true; } });
    });
    rh.addEventListener("change", function () {
      var redraw = function () { ciStRedraw(); var b = $("#stRhOn"); if (b) b.focus({ preventScroll: true }); };
      if (!this.checked) { var r = rhmGet(); r.on = false; rhmSave(r); store.set("rhmLater", "1"); redraw(); return; }   // turned off here: Today doesn't offer it again
      this.checked = false;
      rhmStart(redraw);
    });
    RHM_SLOTS.forEach(function (s) {
      var t = $("#rhT-" + s.id), k = $("#rhK-" + s.id);
      if (!t) return;
      t.addEventListener("change", function () {
        if (!rhmTimeOk(this.value)) return;
        var r = rhmGet();
        r.slots.forEach(function (x) { if (x.id === s.id) x.time = t.value; });
        rhmSave(r);
      });
      k.addEventListener("change", function () {
        var r = rhmGet();
        r.slots.forEach(function (x) { if (x.id === s.id && rhmKeyOk(k.value)) x.key = k.value; });
        rhmSave(r);
      });
    });
    var ics = $("#stRhIcs");
    if (ics) ics.addEventListener("click", rhmDownload);
  }
  // the card again, in place: after it's turned on or off, and once this device is unlocked
  function ciStRedraw() {
    var c = $("#st-checkin");
    if (!c) return;
    c.outerHTML = ciStCard();
    ciStWire();
  }

  /* ----- a personal experiment ----- */
  /* As kept (store "xp"): { id: when it began, p: the practice, f: what differs ("beat", "music", "scene" or
     "other"), q: the other practice, seq: ten letters, five shuffled pairs of A and B, end: when you ended it }.
     A session counts once it's in the history whole (not ended early), tagged with xid and xv. */
  var XP_N = 10;
  var XP_F = ["beat", "music", "scene", "other"];
  var XP = { form: null, arm: 0 };
  // what can differ for a practice: its beat, music, a scene, or another practice altogether
  function xpFactors(d) {
    var f = [];
    if (d.audio) f.push(["beat", "With its beat, or without"]);
    if (!d.music && !d.noMus) f.push(["music", "With music, or without"]);
    if (scnFits(d) && pPlan(d, pLenOf(d, 0)).steps.some(function (s) { var v = pVisOf(s); return v === "orb" || v === "still" || v === "glow"; }))
      f.push(["scene", "With a scene, or the usual visual"]);
    f.push(["other", "Against another practice"]);
    return f;
  }
  function xpOkFor(d) { return !!d && !d.stress && !d.custom; }
  function xpGet() {
    var x = null;
    try { x = JSON.parse(store.get("xp") || "null"); } catch (e) {}
    if (!x || typeof x !== "object" || typeof x.id !== "number" || XP_F.indexOf(x.f) < 0 || !/^[AB]{10}$/.test(x.seq || "") || !xpOkFor(pDef(x.p))) return null;
    if (x.f === "other" && (!xpOkFor(pDef(x.q)) || x.q === x.p)) return null;
    return x;
  }
  // its two ways, in words
  function xpVars(x) {
    return x.f === "beat" ? ["with its beat", "without its beat"] : x.f === "music" ? ["with music", "without music"]
      : x.f === "scene" ? ["with a scene", "with the usual visual"] : [pDef(x.p).name, pDef(x.q).name];
  }
  function xpTitle(x) { return x.f === "other" ? pDef(x.p).name + " or " + pDef(x.q).name : pDef(x.p).name + ": " + xpVars(x).join(", or "); }
  // its sessions so far, oldest first: whole ones only
  function xpSess(x) { return hLoad().filter(function (e) { return e.xid === x.id && (e.xv === "A" || e.xv === "B") && e.full !== false; }); }
  function xpDoneN(x, s) {
    s = s || xpSess(x);
    var a = s.filter(function (e) { return e.xv === "A"; }).length;
    return { a: a, b: s.length - a, n: s.length, done: a >= XP_N / 2 && s.length - a >= XP_N / 2 };
  }
  // which way the next session goes: the shuffled order, or for two practices whichever has fewer so far
  function xpNext(x) {
    var c = xpDoneN(x);
    if (c.done) return "";
    if (c.a >= XP_N / 2) return "B";
    if (c.b >= XP_N / 2) return "A";
    return x.seq.charAt(Math.min(c.n, XP_N - 1));
  }
  // a practice starting: the experiment it's part of, and which way, or null
  function xpFor(d) {
    var x = xpGet();
    if (!x || x.end || !d || !supOn()) return null;
    if (x.f === "other") return d.id === x.p ? { id: x.id, v: "A" } : d.id === x.q ? { id: x.id, v: "B" } : null;
    var v = d.id === x.p ? xpNext(x) : "";
    return v ? { id: x.id, v: v, f: x.f } : null;
  }
  // the options as this session's way of doing it sets them (P.xpOrig keeps yours, so nothing of it is saved)
  function xpApply() {
    P.xpOrig = null;
    var e = P.xp;
    if (!e || !e.f) return;
    var on = e.v === "A", k = e.f === "beat" ? "audio" : e.f;
    P.xpOrig = {}; P.xpOrig[k] = P.opt[k];
    if (k === "audio") P.opt.audio = on;
    else if (k === "music") P.opt.music = on ? (P.opt.music !== "off" ? P.opt.music : "aim") : "off";
    else P.opt.scene = on ? (P.opt.scene !== "off" ? P.opt.scene : "mine") : "off";
  }
  // whether a practice about to start will play its beat, as the experiment sets it
  function xpAudio(d, on) { var e = xpFor(d); return e && e.f === "beat" ? e.v === "A" : on; }
  // the options to keep when one is changed during the session: yours, not the experiment's
  function xpReal(o) {
    if (!P.xpOrig || o !== P.opt || !pBusy() || P.optFor !== (P.def && P.def.id)) return o;     // only the running session's, never a page's options after it
    var c = JSON.parse(JSON.stringify(o));
    for (var k in P.xpOrig) c[k] = P.xpOrig[k];
    return c;
  }
  // above Start on its page
  function xpNote(d) {
    var x = xpGet();
    if (!x || x.end || !supOn() || (d.id !== x.p && !(x.f === "other" && d.id === x.q))) return "";
    var c = xpDoneN(x), v = xpVars(x);
    if (c.done) return "";
    if (x.f === "other") {
      var mine = d.id === x.p ? c.a : c.b;
      return "Your personal experiment, against " + (d.id === x.p ? v[1] : v[0]) + ": this one counts as " + d.name + "'s session " + Math.min(XP_N / 2, mine + 1) + " of " + XP_N / 2 + ".";
    }
    var nx = xpNext(x);
    return "Your personal experiment, session " + (c.n + 1) + " of " + XP_N + ": this time " + v[nx === "A" ? 0 : 1] + ". Entrain sets it as you start; end it early and it counts next time instead.";
  }
  function xpBar(d) { var t = xpNote(d); return '<p class="si-xp" id="sXpNote"' + (t ? "" : " hidden") + ">" + esc(t) + "</p>"; }
  function xpBarSync(d) { var el = $("#sXpNote"), t = xpNote(d); if (el) { el.hidden = !t; bSetT("#sXpNote", t); } }

  /* The comparison: each measure for each way (the middle of its sessions), then pair by pair: the first session one
     way against the first the other way, and so on, so a change over the weeks falls on both. A difference counts as
     more than noise only with three pairs or more, at least the smallest step worth noticing, and more than twice
     its standard error. */
  var XP_M = [
    ["hr", "Heart rate, start to end", function (e) { return e.hr0 && e.hr1 ? e.hr1 - e.hr0 : null; }, "bpm", 1],
    ["coh", "Coherence", function (e) { return e.coh && !e.est ? e.coh : null; }, "", 0.2],
    ["mood", "Mood, before to after", function (e) { return ciDiff(e, "mood"); }, "points", 1],
    ["str", "Stress, before to after", function (e) { return ciDiff(e, "str"); }, "points", 1]
  ];
  function xpStats(x) {
    var s = xpSess(x), A = s.filter(function (e) { return e.xv === "A"; }), B = s.filter(function (e) { return e.xv === "B"; });
    var rows = XP_M.map(function (m) {
      var a = A.map(m[2]), b = B.map(m[2]), d = [], i;
      for (i = 0; i < Math.min(a.length, b.length); i++) if (ciNum(a[i]) && ciNum(b[i])) d.push(a[i] - b[i]);
      var av = a.filter(ciNum), bv = b.filter(ciNum), mean = d.length ? avg(d) : null, sd = null;
      if (d.length > 1) sd = Math.sqrt(d.reduce(function (t, x) { return t + (x - mean) * (x - mean); }, 0) / (d.length - 1));
      var se = sd === null ? null : sd / Math.sqrt(d.length);
      return { k: m[0], name: m[1], unit: m[3], a: owMed(av), b: owMed(bv), na: av.length, nb: bv.length, pairs: d.length, mean: mean,
        same: d.filter(function (x) { return mean > 0 ? x > 0 : mean < 0 ? x < 0 : false; }).length,
        clear: d.length >= 3 && se !== null && Math.abs(mean) >= m[4] && Math.abs(mean) > 2 * se };
    });
    var c = xpDoneN(x, s);
    return { n: c.n, nA: c.a, nB: c.b, done: c.done, rows: rows };
  }
  function xpUnit(r, v) {
    v = Math.abs(v);
    return r.unit === "bpm" ? ciN(v) + (v === 1 ? " beat a minute" : " beats a minute") : r.unit === "points" ? ciN(v) + (v === 1 ? " point" : " points") : ciN(v);
  }
  // one measure, pair by pair, in words
  function xpSay(x, r) {
    if (!r.pairs) return "";
    var v = xpVars(x), what = r.k === "hr" ? "its heart-rate change" : r.k === "coh" ? "its coherence" : r.k === "mood" ? "its mood change" : "its stress change";
    var cap = v[0].charAt(0).toUpperCase() + v[0].slice(1);
    var s = Math.abs(r.mean) < 0.05 ? "Pair by pair, " + (r.pairs === 1 ? "one pair" : r.pairs + " pairs") + ", no difference in " + what.replace(/^its /, "the ") + " on average."
      : cap + ", " + what + " came out " + xpUnit(r, r.mean) + (r.mean > 0 ? " higher" : " lower") + " on average, pair by pair, the same way in " + r.same + " of " + r.pairs + (r.pairs === 1 ? " pair." : " pairs.");
    return s + " " + (r.clear ? "That's bigger than the usual difference from one session to the next." : r.pairs < 3 ? "Too few pairs yet to tell it from chance." : "That's within the noise between sessions.");
  }
  function xpTable(x, st) {
    var v = xpVars(x), f = function (r, val, n) { return val === null ? "—" : (r.k === "coh" ? ciN(val) : ciSigned(val)) + '<small> ' + n + "×</small>"; };
    return '<div class="xp-tw"><table class="xp-tbl"><caption>The middle of each way\'s sessions</caption><thead><tr><th scope="col"></th><th scope="col">A: ' + esc(v[0]) + '</th><th scope="col">B: ' + esc(v[1]) + "</th></tr></thead><tbody>" +
      st.rows.map(function (r) { return '<tr><th scope="row">' + r.name + "</th><td>" + f(r, r.a, r.na) + "</td><td>" + f(r, r.b, r.nb) + "</td></tr>"; }).join("") + "</tbody></table></div>";
  }
  function xpSec() {
    var lk = !supOn(), x = xpGet();
    var h = '<section class="hi-xp" id="experiment" aria-labelledby="xpH"><h2 id="xpH">Personal experiment' + (lk ? supTag() : "") + "</h2>";
    if (lk && !x) return h + '<p class="xp-lede">Does a practice suit you better one way or another? Pick a practice and two ways to do it, such as with its beat or without. ' +
      "Entrain alternates them in shuffled pairs over ten sessions, then sets your heart rate, coherence and check-ins side by side, with an honest word on what ten sessions can show.</p>" +
      '<button type="button" class="btn primary" id="xpOpen">Set up an experiment' + supTag(true) + "</button></section>";
    if (!x) return h + xpForm() + "</section>";
    var st = xpStats(x), v = xpVars(x), nx = xpNext(x), over = st.done || !!x.end;
    h += '<p class="xp-what"><b>' + esc(xpTitle(x)) + "</b> " + (st.done ? "Done: " + st.n + " sessions." : x.end ? "Ended after " + st.n + (st.n === 1 ? " session." : " sessions.") : st.n + " of " + XP_N + " sessions.") + "</p>";
    h += '<p class="hi-tot"><b>' + st.nA + "</b> " + esc(v[0]) + " · <b>" + st.nB + "</b> " + esc(v[1]) + "</p>";
    if (!over) {
      var d = pDef(nx === "B" && x.f === "other" ? x.q : x.p);
      if (lk) h += '<p class="xp-next"><span>Next: <b>' + esc(v[nx === "A" ? 0 : 1]) + "</b>. Your experiment is one of the new techniques: it carries on once it's unlocked.</span>" +   // kept from a backup on a locked device (xpFor sets nothing)
        '<button type="button" class="btn small" id="xpOpen">Unlock it' + supTag(true) + "</button></p>";
      else h += '<p class="xp-next">Next: <b>' + esc(v[nx === "A" ? 0 : 1]) + "</b>." + (x.f === "other" ? "" : " Entrain sets it as you start " + esc(d.name) + ".") +
        ' <a class="btn small" href="#practice/' + d.id + '">Open ' + esc(d.name) + "</a></p>";
    }
    var said = st.rows.map(function (r) { return xpSay(x, r); }).filter(Boolean);
    if (st.n) h += xpTable(x, st) + (said.length ? '<ul class="xp-say">' + said.map(function (s) { return "<li>" + esc(s) + "</li>"; }).join("") + "</ul>" : "");
    var miss = [];
    if (st.n && !st.rows[0].na && !st.rows[0].nb) miss.push('No heart readings in these sessions yet: with a heart sensor, or the phone\'s camera, on <a href="#heart">Heart</a>, the heart-rate change and coherence show here.');
    if (st.n && !st.rows[2].na && !st.rows[2].nb && !st.rows[3].na && !st.rows[3].nb) miss.push('No check-ins in these sessions yet: with <a href="#st-checkin">Check in before and after</a> on, your mood and stress show here too.');
    if (miss.length) h += miss.map(function (m) { return '<p class="xp-miss">' + m + "</p>"; }).join("");
    h += '<p class="xp-honest"><b>Read it as a hint for you, not a verdict.</b> Ten sessions is a small test. Sleep, coffee, the time of day and the day you\'ve had move a session ' +
      "more than most changes do, and you know which way you're doing it, so what you expect plays a part, most of all in your ratings " +
      '(see <a href="#l-expect">expectation and placebo</a>). Pairs keep the comparison fair as the weeks go by; a difference that holds in most pairs and stands out from the noise is worth trying for longer.</p>';
    h += '<div class="xp-act">' + (over ? '<button type="button" class="btn primary" id="xpNew">Start another</button>' : '<button type="button" class="btn small" id="xpEnd">End the experiment</button>') + "</div>";
    return h + "</section>";
  }
  // the setup: a practice, what to compare, and the other practice if it's two
  function xpForm() {
    var f = XP.form || {}, last = hLoad().filter(function (e) { return e.k === "practice" && xpOkFor(pDef(e.id)); }).pop();
    var p = xpOkFor(pDef(f.p)) ? f.p : last ? last.id : "calm-reset", d = pDef(p), fs = xpFactors(d);
    var k = fs.some(function (x) { return x[0] === f.f; }) ? f.f : fs[0][0];
    var q = xpOkFor(pDef(f.q)) && f.q !== p ? f.q : p === "coherence" ? "calm-reset" : "coherence";
    XP.form = { p: p, f: k, q: q };
    var sel = function (id, cur, skip) {
      return owPracOpts(cur).replace(/<optgroup label="Breathing patterns">[\s\S]*?<\/optgroup>/, "").replace(new RegExp('<option value="' + skip + '"[^>]*>[^<]*</option>'), "");
    };
    return '<p class="xp-lede">Does a practice suit you better one way or another? Pick a practice and two ways to do it. Entrain alternates them in shuffled pairs over ten sessions, ' +
      "setting each one as you start, then sets your heart-rate change, coherence and check-ins side by side.</p>" +
      '<div class="xp-form"><label class="xp-l" for="xpP">Practice</label><select id="xpP">' + sel("xpP", p, "") + "</select>" +
      '<label class="xp-l" for="xpF">Compare</label><select id="xpF">' + fs.map(function (x) { return '<option value="' + x[0] + '"' + (x[0] === k ? " selected" : "") + ">" + x[1] + "</option>"; }).join("") + "</select>" +
      (k === "other" ? '<label class="xp-l" for="xpQ">Against</label><select id="xpQ">' + sel("xpQ", q, p) + "</select>" : "") + "</div>" +
      '<p class="xp-tip">For heart rate and coherence, connect a heart sensor or use the phone\'s camera on Heart; for mood and stress, turn on <a href="#st-checkin">Check in before and after</a>.</p>' +
      '<button type="button" class="btn primary" id="xpGo">Start the experiment</button>';
  }
  function xpBegin() {
    supGate(XP_NAME, function () {
      var f = XP.form || {}, seq = "";
      if (!xpOkFor(pDef(f.p)) || (f.f === "other" && (!xpOkFor(pDef(f.q)) || f.q === f.p))) return;
      for (var i = 0; i < XP_N / 2; i++) seq += Math.random() < 0.5 ? "AB" : "BA";
      store.set("xp", JSON.stringify({ id: Date.now(), p: f.p, f: f.f, q: f.f === "other" ? f.q : "", seq: seq }));
      XP.form = null;
      if (curView === "history") { hRender(); var s = $("#experiment"); if (s) jumpTo(s); }
    }, function (ok) { if (ok && curView === "history") hRender(); });
  }
  function xpClick(ev) {
    var t = ev.target;
    if (t.closest("#xpOpen")) { supGate(XP_NAME, function () { hRender(); var s = $("#experiment"); if (s) jumpTo(s); }); return; }
    if (t.closest("#xpGo")) { xpBegin(); return; }
    if (t.closest("#xpNew")) { storeDel("xp"); hRender(); var s2 = $("#xpP"); if (s2) s2.focus(); return; }
    var b = t.closest("#xpEnd");
    if (!b) return;
    if (XP.arm && Date.now() - XP.arm < 3000) {
      XP.arm = 0;
      var x = xpGet();
      if (x) { x.end = Date.now(); store.set("xp", JSON.stringify(x)); }
      hRender();
      toast("Experiment ended. Its results so far stay in History.");
      return;
    }
    XP.arm = Date.now();
    b.textContent = "Tap again to end it";
    b.classList.add("armed");
    setTimeout(function () { if (b.isConnected) { b.textContent = "End the experiment"; b.classList.remove("armed"); } }, 3000);
  }
  function xpChange(ev) {
    var t = ev.target;
    if (!t.closest || !t.closest(".xp-form")) return;
    XP.form = { p: $("#xpP").value, f: $("#xpF").value, q: $("#xpQ") ? $("#xpQ").value : (XP.form && XP.form.q) };
    if (t.id === "xpP" && !xpFactors(pDef(XP.form.p)).some(function (x) { return x[0] === XP.form.f; })) XP.form.f = "";
    var sec = $("#experiment"), id = t.id;
    if (!sec) return;
    sec.outerHTML = xpSec();
    var again = $("#" + id);
    if (again) again.focus();
  }

  /* ----- after an unlock, and starting up ----- */
  function owUI() {
    rhmSync();
    ciStRedraw();
    if (curView === "history") hRender();
  }
  function owInit() {
    SUP_EXTRA.push({ name: CI_NAME, href: "#st-checkin" }, { name: OW_NAME, href: "#history" }, { name: RHM_NAME, href: "#st-rhythm" }, { name: XP_NAME, href: "#experiment" });   // Settings' list of what the donation unlocks
    $("#ciGo").addEventListener("click", function () {
      if (CI.mode === "before") ciBegin(false);
      else if (CI.mode === "after") ciSaveAfter();
      else ciClose();
    });
    $("#ciSkip").addEventListener("click", function () { if (CI.mode === "before") ciBegin(true); else ciClose(); });
    $("#ciQs").addEventListener("click", function (e) {
      var b = e.target.closest(".ci-g button");
      if (!b) return;
      var x = ciPick(b);
      CI[x.k] = x.v;
    });
    $("#ciModal").addEventListener("click", function (e) { if (e.target === this) ciClose(); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !$("#ciModal").hidden) { e.preventDefault(); ciClose(); } });
    // the line that opens with a donation, on Today and History
    document.addEventListener("click", function (e) {
      if (e.target.closest(".ow-lk")) supGate(OW_NAME, function () { if (curView === "home") todayRender(); else if (curView === "history") hRender(); });
    });
    $("#tdRhGo").addEventListener("click", function () { rhmStart(function () { rhmSync(); var s = $("#tdRhythm"); if (s) jumpTo(s); }); });
    $("#tdRhLater").addEventListener("click", function () {
      store.set("rhmLater", "1");
      rhmSync();
      toast("The daily rhythm is in Settings whenever you'd like it.", { ms: 4000 });
    });
    $("#tdRhythmBody").addEventListener("click", function (e) {
      if (e.target.closest("#tdRhIcs")) rhmDownload();
      else if (e.target.closest("#tdRhUnlock")) supGate(RHM_NAME, rhmSync);
    });
    $("#hiBody").addEventListener("click", xpClick);
    $("#hiBody").addEventListener("change", xpChange);
    setInterval(function () { rhmNudge(); }, 60000);
    document.addEventListener("visibilitychange", function () { if (!document.hidden) setTimeout(function () { rhmNudge(); }, 2000); });
    setTimeout(function () { rhmNudge(); }, 4000);
    if (store.get("debug") && window.__entrain) {          // for automated tests only
      var X = window.__entrain;
      X.CI = CI; X.ciOn = ciOn; X.ciBefore = ciBefore; X.ciResHtml = ciResHtml; X.owDays = owDays; X.owHtml = owHtml;
      X.rhmGet = rhmGet; X.rhmDone = rhmDone; X.rhmNow = rhmNow; X.rhmIcs = rhmIcs; X.rhmNudge = rhmNudge; X.rhmWins = rhmWins;
      X.xpGet = xpGet; X.xpStats = xpStats; X.xpFor = xpFor; X.xpNext = xpNext; X.xpSay = xpSay; X.xpFactors = xpFactors; X.XP = XP;
    }
  }
