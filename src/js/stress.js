  /* --------------------------------- the stress check ---------------------------------
     How stressed you say you feel, and a few minutes of your heart at rest, read against your
     own earlier checks; then advice on which practice to do now, with its beat and its
     breathing. Stress lowers heart-rate variability, above all the vagal, beat-to-beat part
     that RMSSD measures (Kim et al. 2018), and two minutes are enough for RMSSD (Muñoz et al.
     2015). RMSSD differs so much between people, and with age, that a reading means most set
     against your own (Shaffer & Ginsberg 2017): the first checks set a baseline, and nobody
     else's numbers come into it. How the two readings become a level is Entrain's own rule,
     and the end screen says so.
  ---------------------------------------------------------------------------------- */
  var SC = { beats: [], lastPT: -1 };
  var SC_LEVELS = ["Low", "Moderate", "High", "Very high"];
  var SC_BASE_N = 3;                         // earlier checks before the heart gives a level of its own
  var SC_RECHECK = 30 * 60 * 1000;           // a check this soon after another session shows what it changed, and stays out of the baseline
  var SC_SINCE = 3 * 3600 * 1000;            // how far back "since your last check" looks
  function scReset() { SC = { beats: [], lastPT: -1 }; }

  function stressCheck(min) {
    var meas = min >= 6 ? 300 : 120;
    return [
      { k: "rate", secs: 30, open: true, title: "How stressed do you feel?", sub: "0 is not at all, 10 is as stressed as you get", ends: ["Not at all", "As stressed as you get"],
        lines: [[0, "How stressed do you feel right now? Tap a number from 0 to 10, or skip it."]] },
      G(45, "Settle", ["Sit back with your back supported, or lie down, and keep still. If your sensor still needs connecting, connect it now from the heart at the top.",
        "Breathe at your own pace, just as it comes: the check reads your heart as it is."], { vis: "still" }),
      { k: "measure", secs: meas, title: "Measuring", vis: "still",
        lines: [[0, "Now rest, keep still and let the breath come and go on its own while your heart is read."],
          [Math.round(meas / 2), "Keep still and quiet. Talking or moving changes the reading."]] }
    ];
  }

  /* The beats of the measuring step, kept by practice time. A pause moves the practice clock on,
     so beats that arrived while paused land behind those already kept and are left out. */
  function scTick(s) {
    var from = Math.max(SC.lastPT, s.at), to = s.at + s.secs;
    for (var i = 0; i < H.beats.length; i++) {
      var b = H.beats[i], pt = b.t - P.t0;
      if (pt > from && pt <= to) { SC.beats.push({ pt: pt, t: b.t, rr: b.rr }); from = pt; }
    }
    SC.lastPT = from;
  }
  // successive pairs as RMSSD on the Heart page takes them: a jump of more than 25% is an artefact
  // or an extra beat, and a gap of more than three seconds (a pause, a dropout) isn't a pair at all
  function scPairs(beats) {
    var sq = [], jumps = 0;
    for (var i = 1; i < beats.length; i++) {
      var a = beats[i - 1], c = beats[i];
      if (c.t - a.t > 3) continue;
      if (Math.abs(c.rr - a.rr) / a.rr > 0.25) { jumps++; continue; }
      sq.push((c.rr - a.rr) * (c.rr - a.rr));
    }
    return { sq: sq, jumps: jumps, bad: sq.length + jumps ? jumps / (sq.length + jumps) : 0 };
  }
  function scCaption() {
    var n = SC.beats.length;
    if (H.state === "lost" || H.state === "busy") return "Sensor connecting\u2026";
    if (H.state !== "on") return "No sensor: connect one from the heart at the top";
    if (hrOnly()) return "Heart rate only from this sensor: no beat-to-beat reading";
    if (!hrLive()) return "Waiting for readings…";
    if (n < 10) return "Reading your heart…";
    return n + " beats · " + (scPairs(SC.beats.slice(-40)).bad > 0.2 ? "unsteady: keep still" : "steady");
  }

  /* ----- your own baseline, from the history ----- */
  function scChecks() { return hLoad().filter(function (e) { return e.k === "practice" && e.id === "stress-check"; }); }
  // the session (other than a check) that ended within half an hour before `start`, if any
  function scAfterSession(start) {
    var all = hLoad();
    for (var i = all.length - 1; i >= 0; i--) {
      var e = all[i];
      if (e.at > start) continue;
      if (e.at < start - SC_RECHECK) break;
      if (!(e.k === "practice" && e.id === "stress-check")) return e;
    }
    return null;
  }
  // the middle of your last ten full checks taken at rest, apart from re-checks after a session
  function scBaseline() {
    var base = scChecks().filter(function (e) { return e.full !== false && !scAfterSession(e.at - e.secs * 1000); });
    var rms = base.filter(function (e) { return e.rm > 0; }).slice(-10).map(function (e) { return e.rm; });
    var hrs = base.filter(function (e) { return e.hrAvg > 0; }).slice(-10).map(function (e) { return e.hrAvg; });
    return { rm: rms.length ? median(rms) : 0, nRm: rms.length, hr: hrs.length ? median(hrs) : 0, nHr: hrs.length };
  }
  function scSince() {
    var l = scChecks(), e = l[l.length - 1];
    if (!e || Date.now() - e.at > SC_SINCE) return null;
    var between = [];
    hLoad().forEach(function (x) {
      if (x.at <= e.at || x.k === "test" || (x.k === "practice" && x.id === "stress-check")) return;
      var n = hItem(x).name;
      if (between.indexOf(n) < 0) between.push(n);
    });
    return { at: e.at, rm: e.rm || 0, hr: e.hrAvg || 0, felt: typeof e.felt === "number" ? e.felt : null, between: between };
  }

  /* ----- the level: Entrain's own rule -----
     Your rating: 0 to 2 low, 3 to 5 moderate, 6 or 7 high, 8 to 10 very high. Your heart, once there
     are three earlier checks: RMSSD at 90% of your usual or more is low, 75% moderate, 55% high, below
     that very high; a resting heart rate over 5 bpm above your usual moves it to at least moderate,
     over 10 to at least high. The level is the higher of the two: calming down costs little. */
  function scSelfTier(v) { return v === null ? null : v <= 2 ? 0 : v <= 5 ? 1 : v <= 7 ? 2 : 3; }
  function scHeartTier(S, B) {
    var t = null;
    if (S.ok && B.nRm >= SC_BASE_N) { var q = S.rm / B.rm; t = q >= 0.9 ? 0 : q >= 0.75 ? 1 : q >= 0.55 ? 2 : 3; }
    if (S.hr && B.nHr >= SC_BASE_N) { var dh = S.hr - B.hr, th = dh <= 5 ? 0 : dh <= 10 ? 1 : 2; t = t === null ? th : Math.max(t, th); }
    return t;
  }

  /* Worked out as the session ends (pSummary), before it goes into the history: the resting heart
     rate replaces the start-to-end change, and coherence covers the measuring step only. */
  function stressSummary(r, T) {
    var d = P.def, s = P.steps.filter(function (x) { return x.k === "measure"; })[0];
    if (!d || !d.stress || !s) return;
    var a = s.at, b = Math.min(T, s.at + s.secs);
    var hr = P.hr.filter(function (x) { return x.t >= a && x.t <= b; }).map(function (x) { return x.hr; });
    var beats = SC.beats.filter(function (x) { return x.pt <= b; }), q = scPairs(beats);
    var span = beats.length > 1 ? beats[beats.length - 1].pt - beats[0].pt : 0;
    var rm = q.sq.length >= 40 && span >= 60 ? Math.sqrt(avg(q.sq)) : null;
    var co = P.coh.filter(function (x) { return x.t >= a && x.t <= b; }).map(function (x) { return x.cs; });
    var S = { secs: Math.max(0, Math.round(b - a)), full: !r.early, hr: hr.length >= 30 ? Math.round(avg(hr)) : null,
      rm: rm, ok: rm !== null && q.bad <= 0.2, bad: q.bad, n: beats.length, self: P.suds.length ? P.suds[0] : null };
    S.hrOnly = !!S.hr && beats.length < 40;
    var prev = scAfterSession(Date.now() - T * 1000);
    S.after = prev ? hItem(prev).name : "";
    S.base = scBaseline();
    S.heart = scHeartTier(S, S.base);
    S.selfT = scSelfTier(S.self);
    S.tier = S.heart === null ? S.selfT : S.selfT === null ? S.heart : Math.max(S.heart, S.selfT);
    S.since = scSince();
    S.night = scNight();
    r.stress = S;
    delete r.hr0; delete r.hr1;
    if (S.hr) r.hrAvg = S.hr; else delete r.hrAvg;
    if (co.length) { r.coh = avg(co); r.cohMax = Math.max.apply(null, co); } else { delete r.coh; delete r.cohMax; }
  }
  function scNight() { var h = window.__scHour !== undefined ? window.__scHour : new Date().getHours(); return h >= 21 || h < 5; }   // the tests can set the hour
  function scNote(S) {
    var n = [];
    if (S.ok) n.push("RMSSD " + Math.round(S.rm) + " ms");
    if (S.tier !== null) n.push("level " + SC_LEVELS[S.tier].toLowerCase());
    return n.join(", ");
  }

  /* ----- the end screen: tiles, what they mean, and the advice ----- */
  function scBaseTxt(S, n) {
    if (S.after) return "not part of your baseline";
    if (!S.full) return "ended early: not part of your baseline";
    return "baseline " + Math.min(SC_BASE_N, n + 1) + " of " + SC_BASE_N;
  }
  function scVsTxt(S, v, base, n, kind) {
    if (n < SC_BASE_N) return scBaseTxt(S, n);
    if (kind === "rm") return Math.round(v / base * 100) + "% of your usual";
    var dl = Math.round(v - base);
    return dl ? sdSigned(dl) + " on your usual" : "your usual";
  }
  function stressTiles(r, tiles) {
    var S = r.stress, B = S.base;
    var src = S.heart !== null && S.selfT !== null ? "your heart and your rating" : S.heart !== null ? "your heart"
      : S.selfT !== null ? "your rating" : "no rating or heart level";
    tiles.push(["Stress level", S.tier === null ? "—" : SC_LEVELS[S.tier], "from " + src, "stress"]);
    tiles.push(["RMSSD", S.ok ? String(Math.round(S.rm)) : "—",
      S.ok ? "ms, beat to beat" : S.hrOnly ? "needs beat-to-beat data" : S.rm !== null ? "signal too unsteady" : "no beat-to-beat data",
      "rmssd", S.ok ? scVsTxt(S, S.rm, B.rm, B.nRm, "rm") : ""]);
    if (S.hr) tiles.push(["Resting heart rate", String(S.hr), "bpm while measuring", "rhr", scVsTxt(S, S.hr, B.hr, B.nHr, "hr")]);
  }

  function scExplain(k) {
    var r = SD.r, d = SD.d, S = r && r.stress, p = [];
    if (!S || !d || !d.stress) return null;
    var B = S.base, lvl = S.tier === null ? "" : SC_LEVELS[S.tier].toLowerCase();
    if (k === "stress") {
      p.push(S.tier === null ? "There was neither a rating nor enough heart data for a level, so the advice below is a general one."
        : "Your stress reads " + lvl + ", from " + (S.heart !== null && S.selfT !== null ? "your heart and your rating together." : S.heart !== null ? "your heart." : "your rating."));
      p.push("Your rating counts like this: 0 to 2 is low, 3 to 5 moderate, 6 or 7 high and 8 to 10 very high. Your heart counts once you have three earlier checks: RMSSD at 90% of your usual or more is low, from 75% moderate, from 55% high and below that very high, and a resting heart rate more than 5 bpm above your usual makes it at least moderate, more than 10 at least high. When the two disagree, the level is the higher one, since calming down costs little.");
      if (S.after) p.push("This check came within half an hour of " + S.after + ", so it shows what that changed and isn't added to your baseline, which is kept for readings at rest.");
      else if (S.heart === null && (S.ok || S.hr)) p.push("Your heart doesn't give a level yet: your first three full checks set your baseline" + (S.full ? ", and this was check " + Math.min(SC_BASE_N, (S.ok ? B.nRm : B.nHr) + 1) + " of " + SC_BASE_N : ", and one that ends early isn't counted") + ". Check the same way each time, in the same position at a similar time of day, and not straight after coffee or exercise.");
      if (S.heart !== null && S.selfT !== null && Math.abs(S.heart - S.selfT) >= 2) {
        p.push(S.heart > S.selfT ? "Your heart reads more stressed than you feel. That happens: tiredness, illness, alcohol, caffeine or a long day can all lower heart-rate variability."
          : "You feel more stressed than your heart shows. Both count, and how you feel is reason enough to take a few minutes.");
      }
      p.push("The rule is Entrain's own, not a validated stress scale, and it can't diagnose anything. An irregular heartbeat, a pacemaker or medicines such as beta-blockers change these numbers, so with any of those, read them with care.");
      return ["Stress level", p];
    }
    if (k === "rmssd") {
      p.push("How much each gap between heartbeats differs from the one before (the root mean square of successive differences): the main short-term measure of the variability your vagus nerve, the brake of your rest-and-digest system, puts into your heartbeat. In Kim and colleagues' 2018 meta-analysis, stress went with lower heart-rate variability.");
      if (S.ok) {
        p.push("Here it was " + Math.round(S.rm) + " ms, from " + S.n + " beats over " + fmt(S.secs) + ". " + (S.bad > 0.004 ? Math.round(S.bad * 100) + "% of the pairs of beats jumped more than 25% and were left out, as artefacts or extra beats." : "No pair of beats jumped enough to be left out."));
        if (B.nRm >= SC_BASE_N) p.push("Your usual is " + Math.round(B.rm) + " ms, the middle of your last " + B.nRm + " checks at rest, so this is " + Math.round(S.rm / B.rm * 100) + "% of it.");
        else p.push(S.after ? "It came soon after another session, so it isn't added to your baseline." : "This is " + scBaseTxt(S, B.nRm) + ": once there are three, each check is set against them.");
      } else if (S.rm !== null) {
        p.push("The signal was too unsteady for a fair reading: more than a fifth of the pairs of beats jumped more than 25%. Keep still, warm the ear lobe or wet a chest strap's contacts, and check again. It isn't added to your baseline.");
      } else {
        p.push(S.hrOnly ? "Your sensor sends heart rate only, as watches do, so there's no RMSSD. The HeartMath ear-clip sensor or a chest strap sends the time between beats."
          : "There wasn't a minute of beat-to-beat data to go on. Connect the sensor before the measuring starts, and keep still.");
      }
      p.push("It differs a lot between people and falls with age, so it's never set against anyone else's. Two minutes are enough: in Muñoz and colleagues' 2015 study of 3,387 adults, two-minute readings of RMSSD agreed closely with five-minute ones.");
      return ["RMSSD", p];
    }
    if (k === "rhr") {
      p.push("Your average heart rate while measuring, at rest: " + S.hr + " beats a minute.");
      if (B.nHr >= SC_BASE_N) p.push("Your usual is " + Math.round(B.hr) + ", the middle of your last " + B.nHr + " checks at rest" + (Math.abs(S.hr - B.hr) < 1 ? ", and this is it." : ", so this is " + Math.abs(Math.round(S.hr - B.hr)) + (S.hr > B.hr ? " above it." : " below it.")));
      else p.push(S.after ? "It came soon after another session, so it isn't added to your baseline." : "This is " + scBaseTxt(S, B.nHr) + ".");
      p.push("Caffeine, a meal, moving about, illness or a warm room all raise it, which is why the check asks you to rest first and is worth taking the same way each time.");
      return ["Resting heart rate", p];
    }
    if (k === "suds") {
      p.push("How stressed you said you felt, from 0 (not at all) to 10 (as stressed as you get): " + S.self + ".");
      p.push("It counts as much as your heart: the advice follows whichever of the two reads more stressed.");
      return ["Felt stress", p];
    }
    return null;
  }

  /* What to do now, for each level: a practice, its beat and its length; with the track and the
     breathing pattern for doing it without a programme. The breathing is read from the practice's own
     plan, so the advice says what will play, at your resonance pace or the pace you set for it. */
  var SC_ADV = [
    { id: "coherence", len: 10, beat: "alpha", track: "alpha-stress", pat: "resonance",
      lead: "Nothing needs doing. To keep it there, a short session at your resonance pace, under an alpha beat that keeps you awake." },
    { id: "coherence", len: 15, beat: "theta", track: "theta-meditation", pat: "resonance",
      lead: "Slow, even breathing at your resonance pace suits a moderate level: it raises heart-rate variability while you do it, with a theta beat for calm." },
    { id: "calm-reset", beat: "down", track: "theta-meditation", pat: "sigh",
      lead: "Cyclic sighs bring arousal down fast, then even breathing at your resonance pace holds it there, while the beat slides from alpha to theta." },
    { id: "calm-reset", beat: "theta", track: "theta-meditation", pat: "sigh",
      lead: "Cyclic sighs first, to bring arousal down fast, then even breathing at your resonance pace, under a steady theta beat throughout." }
  ];
  var SC_ALT = [
    null,
    { id: "calm-reset", beat: "down", txt: "Tense rather than tired, or short of time? Calm Reset takes ten minutes, with cyclic sighs first." },
    { id: "coherence", len: 15, beat: "theta", txt: "With more time, Heart Coherence: fifteen minutes of resonance breathing, then gratitude." },
    { id: "coherence", len: 20, beat: "theta", txt: "If it's still high afterwards, Heart Coherence for twenty minutes." }
  ];
  var SC_NIGHT = { id: "sleep-descent", txt: "Going to bed soon? Sleep Descent instead: slow breathing with a longer out-breath, lying down, while the beat slides from theta to delta." };
  var SC_WHY = {
    coherence: "Breathing slowly at your resonance pace raised heart-rate variability during and after a session in Laborde and colleagues' 2022 meta-analysis, and heart-rate-variability biofeedback lowered self-reported stress and anxiety in Goessl and colleagues' 2017 meta-analysis. In Fincham and colleagues' 2023 trial, four weeks of coherent breathing didn't beat a placebo pace on stress, so treat it as help now rather than a cure.",
    "calm-reset": "In Balban and colleagues' 2023 trial, five minutes a day of cyclic sighing lifted mood the most and slowed breathing at rest. Binaural beats eased anxiety in Garcia-Argibay and colleagues' 2019 meta-analysis, most with theta and delta beats."
  };
  function scAdvice(S) { return SC_ADV[S.tier === null ? 2 : S.tier]; }
  function scMinTxt(secs) {
    var h = Math.round(secs / 30) / 2;
    return h < 1 ? Math.round(secs) + " s" : Math.floor(h) + (h % 1 ? "½" : "") + " min";
  }
  function scBeatTxt(d, id) {
    var b = d.beats && d.beats.filter(function (x) { return x.id === id; })[0];
    return b ? b.label + ": " + b.note.charAt(0).toLowerCase() + b.note.slice(1) : "";
  }
  // the breathing steps of a practice's plan, steps of the same timing taken together
  function scBreathTxt(d, len) {
    var groups = [];
    pPlan(d, len || 0).steps.forEach(function (s) {
      if (s.k !== "breath") return;
      var g = groups[groups.length - 1];
      if (g && B_KEYS.every(function (k) { return g.t[k] === s.t[k]; })) g.secs += s.secs;
      else groups.push({ t: s.t, secs: s.secs });
    });
    var txt = groups.map(function (g) {
      var t = g.t, cyc = B_KEYS.reduce(function (n, k) { return n + (t[k] || 0); }, 0), parts = [pSecs(t.inh) + " in"];
      if (t.sip) parts.push("a " + pSecs(t.sip) + " sip");
      if (t.hold) parts.push("hold " + pSecs(t.hold));
      parts.push(pSecs(t.exh) + " out");
      if (t.rest) parts.push("rest " + pSecs(t.rest));
      var rate = Math.round(600 / cyc) / 10;
      return scMinTxt(g.secs) + (t.sip ? " of cyclic sighs: " : " at " + rate + " a minute: ") + parts.join(", ");
    }).join(". Then ");
    if (!txt) return "";
    var pc = d.pace ? pPace(d) : null;
    return txt + "." + (!pc ? "" : pc.own ? " That's the pace of your own you set for it." : H.find && H.find.best ? " That's your resonance pace, from the test." : " That's 5.5 a minute until you take the resonance test on the Heart tab.");
  }
  function scApply(a) {
    var d = pDef(a.id);
    if (!d) return;
    if (a.beat && d.beats) {
      pChoiceSet(d, "beat", a.beat);
      var o = pOptsOf(d.id);
      if (!o.audio) { o.audio = true; pOptSave(d.id, o); }
    }
    if (a.len && d.lengths && d.lengths.indexOf(a.len) >= 0) store.set("pLen." + d.id, String(a.len));
    location.hash = "practice/" + d.id;
  }
  function scList(a) { return a.length < 2 ? a.join("") : a.slice(0, -1).join(", ") + " and " + a[a.length - 1]; }
  function scSinceTxt(S) {
    var s = S.since, parts = [];
    if (!s) return "";
    if (s.rm && S.ok) parts.push("RMSSD " + Math.round(s.rm) + " → " + Math.round(S.rm) + " ms");
    if (s.hr && S.hr) parts.push("resting heart rate " + s.hr + " → " + S.hr + " bpm");
    if (s.felt !== null && S.self !== null) parts.push("felt stress " + s.felt + " → " + S.self);
    if (!parts.length) return "";
    var calmer = (s.rm && S.ok ? (S.rm / s.rm >= 1.1 ? 1 : S.rm / s.rm <= 0.9 ? -1 : 0) : 0) + (s.hr && S.hr ? (S.hr - s.hr <= -3 ? 1 : S.hr - s.hr >= 3 ? -1 : 0) : 0);
    var when = new Date(s.at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    return '<div class="note-card sc-since"><p><b>Since your check at ' + esc(when) + (s.between.length ? ", after " + esc(scList(s.between)) : "") + ":</b> " + esc(parts.join(", ")) + ".</p>" +
      (s.rm && S.ok || s.hr && S.hr ? "<p>" + (calmer > 0 ? "Your heart reads calmer than it did." : calmer < 0 ? "Your heart reads more stressed than it did. Another round, or a different practice, may suit you better." : "Your heart reads about the same as it did.") + "</p>" : "") + "</div>";
  }
  function stressCard(r) {
    var S = r.stress, a = scAdvice(S), d = pDef(a.id);
    if (!d) return "";
    var alt = S.night && S.tier ? SC_NIGHT : SC_ALT[S.tier === null ? 2 : S.tier], ad = alt && pDef(alt.id);
    var tr = TRACKS.filter(function (t) { return t.id === a.track; })[0], br = BREATHS.filter(function (b) { return b.id === a.pat; })[0];
    var len = a.len || d.min, lead = S.tier === null ? "There was nothing to go on this time, so here is a good general choice for a stressful moment. Rate how you feel next time for advice that fits." : a.lead;
    return scSinceTxt(S) +
      '<div class="note-card sc-card" id="scCard"><h3>What would help now</h3>' +
      "<p>" + (S.tier === null ? "" : "<b>Stress level: " + SC_LEVELS[S.tier].toLowerCase() + ".</b> ") + esc(lead) + "</p>" +
      '<dl class="sc-set"><div><dt>Practice</dt><dd><a href="#practice/' + d.id + '">' + esc(d.name) + "</a>, " + esc(pLenTxt(d, len)) + "</dd></div>" +
      '<div><dt>Binaural beat</dt><dd id="scBeat">' + esc(scBeatTxt(d, a.beat)) + "</dd></div>" +
      '<div><dt>Breathing</dt><dd id="scBreath">' + esc(scBreathTxt(d, a.len)) + "</dd></div></dl>" +
      '<p class="sc-why">' + esc(SC_WHY[d.id] || "") + "</p>" +
      '<button class="btn primary" id="scGo">Open ' + esc(d.name) + " with these settings</button>" +
      (ad ? '<div class="sd-next sc-alt"><p>' + esc(alt.txt) + '</p><a class="btn" href="#practice/' + ad.id + '" id="scAlt">' + esc(ad.name) + "</a></div>" : "") +
      (tr && br ? '<p class="sc-just">Just the sound and the breath: the <a href="#track/' + tr.id + '">' + esc(tr.name) + "</a> track and " +
        '<a href="#breathe/' + br.id + '">' + esc(PATTERN_NAMES[br.id] || br.id) + "</a> on Breathe.</p>" : "") +
      (S.tier === 3 ? '<p class="sc-just">If you feel this stressed on most days, a doctor or therapist can help. This check can\'t tell why, or whether it\'s more than everyday stress.</p>' : "") +
      '<p class="sc-just">Afterwards, take another Stress Check to see what changed.</p></div>';
  }
  function stressWire(r) {
    var S = r.stress, a = scAdvice(S), go = $("#scGo"), alt = $("#scAlt");
    if (go) go.addEventListener("click", function () { scApply(a); });
    if (alt) alt.addEventListener("click", function (e) {
      var x = S.night && S.tier ? SC_NIGHT : SC_ALT[S.tier === null ? 2 : S.tier];
      if (x && (x.beat || x.len)) { e.preventDefault(); scApply(x); }
    });
  }
