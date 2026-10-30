  /* ------------------------------- the end screen -------------------------------
     What a practice measured, as tiles you can tap for what each number means, with your own
     value read back and set against your usual for the same practice, and the heart-rate chart,
     which you can tap or drag to read any moment. The summary itself is worked out in
     practice.js (pSummary).
  -------------------------------------------------------------------------------- */

  var SD = { r: null, d: null, c: null, open: "", sm: null, T: 0, cur: -1, drag: false, ro: null, L: 0, R: 0 };
  function pDone(r, early) {
    var d = P.def, tiles = [], c = SD.c = sdCompare(r, d);
    tiles.push(["Time", fmt(r.secs), early ? "Ended early" : "Complete", "time", r.at ? (c.n === 1 ? "Your first time" : "Your " + sdNth(c.n) + " time") : ""]);
    var napHR = r.nap && r.nap.base && r.nap.low;        // a nap has its own baseline-to-lowest tile
    if (r.hr0 && !napHR) tiles.push(["Heart rate", r.hr0 + " → " + r.hr1, "bpm, start to end", "hr", sdCmpTxt(c.hr, function (v) { v = Math.round(v); return v ? sdSigned(v) : "steady"; })]);
    else if (r.hrAvg && !napHR) tiles.push(["Heart rate", String(r.hrAvg), "bpm average", "hravg"]);
    if (r.coh && !r.nap) tiles.push(["Coherence", r.coh.toFixed(1), "average, peak " + r.cohMax.toFixed(1), "coh", sdCmpTxt(c.coh, sdFix1, r.coh)]);
    if (r.swing) tiles.push(["Swing", r.swing.toFixed(1), "bpm per breath", "swing", sdCmpTxt(c.swing, sdFix1, r.swing)]);
    if (r.wander !== undefined) tiles.push(["Came back", String(r.wander), r.wander === 1 ? "time to the breath" : "times to the breath", "wander"]);
    if (r.holds) tiles.push(["Longest hold", fmt(Math.max.apply(null, r.holds)), r.holds.map(fmt).join(" · "), "holds"]);
    if (r.suds) tiles.push([d.rate ? d.rate.name : "Intensity", r.suds.join(" → "), r.suds.length > 1 ? (d.rate ? "out of 10, before and after" : "out of 10, first to last") : "out of 10", "suds"]);   // a feeling's strength, or what the practice rates
    if (r.beat0) tiles.push(["Beat", r.beat0.toFixed(1) + " → " + r.beat1.toFixed(1), r.beatHeart ? "Hz, led by your heart" : "Hz, scripted (no heart data)", "beat"]);
    if (r.nap) {
      if (r.nap.onset !== null) { tiles.push(["Fell asleep", "after " + r.nap.onset + " min", "estimated from heart rate", "onset"]); tiles.push(["Nap", r.nap.slept + " min", "of sleep, estimated", "nap"]); }
      else tiles.push(["Fell asleep", r.nap.sensor ? "Not detected" : "—", r.nap.sensor ? "resting still helps" : "no heart data", "onset"]);
      if (r.nap.base && r.nap.low) tiles.push(["Heart rate", r.nap.base + " → " + r.nap.low, "bpm, baseline to lowest", "naphr"]);
    }
    var chart = r.hrPts.length >= 20;
    SD.r = r; SD.d = d; SD.open = ""; SD.sm = null; SD.cur = -1;
    var h = '<div class="sd-head"><span class="sd-ic">' + (early ? "" : '<svg class="i" aria-hidden="true"><use href="#i-check"/></svg>') + "</span>" +
      "<div><h2>" + (early ? "Session ended" : d.end ? esc(d.end) : "Nicely done") + "</h2><p>" + esc(d.name) + "</p></div></div>" +
      '<p class="sd-tap">Tap a number to see what it means' + (c.hr || c.coh || c.swing ? " and how it compares with your usual" : "") + (chart ? ", or the chart to read it." : ".") + "</p>" +
      '<div class="sd-tiles">' + tiles.map(function (t) {
        return '<button class="sd-t" data-ex="' + t[3] + '" aria-expanded="false" aria-controls="sdEx"><span>' + t[0] + "</span><b>" + t[1] + "</b><small>" + t[2] + "</small>" +
          (t[4] ? '<em class="sd-cmp">' + esc(t[4]) + "</em>" : "") + "</button>";
      }).join("") + "</div>" +
      '<div class="sd-ex" id="sdEx" role="region" aria-label="What this number means" hidden></div>' +
      (chart ? '<div class="sd-chart"><span>Heart rate across the session, in bpm' + (r.beatLog ? ", with the beat in violet" : "") + "</span>" +
        '<canvas id="sdChart" tabindex="0" role="slider" aria-label="Read the heart-rate chart" aria-valuemin="0" aria-valuemax="' + r.secs + '" aria-valuenow="0" aria-valuetext="Tap or use the arrow keys to read a point"></canvas>' +
        '<p class="sd-read" id="sdRead">Tap or drag on the chart to read any point.</p>' +
        '<button class="btn link sd-how" id="sdHow" aria-expanded="false" aria-controls="sdHowT">How to read this chart</button>' +
        '<div class="sd-how-t" id="sdHowT" hidden>' + sdHowTxt().map(function (x) { return "<p>" + x + "</p>"; }).join("") + "</div></div>" : "") +
      (r.nvc ? nvcCard(r.nvc) : "") +
      sdNext(d) +
      qCard(d.reflect ? ROGERS : qPick()) +
      '<div class="sd-act"><a class="btn primary" href="' + backTo().href + '">Done</a><button class="btn" id="sdAgain">Do it again</button></div>' +
      '<div class="note-card donate-card sd-donate"><p><b>Entrain is free and has no ads.</b> If it helps you, a donation keeps it going.</p>' +
      '<a class="btn donate" href="' + DONATE + '" target="_blank" rel="noopener"><svg class="i" aria-hidden="true"><use href="#i-cup"/></svg>Support Entrain on Ko-fi</a></div>';
    var el = $("#sDone");
    el.innerHTML = h;
    $("#sRun").hidden = true; $("#sIntro").hidden = true; el.hidden = false;
    $("#ses").dataset.state = "done";
    $("#sdAgain").addEventListener("click", function () { pIntro(d.id); });
    var cg = $("#sdChain");
    if (cg) cg.addEventListener("click", function () {     // on to the practice this one began
      var nx = P.chain && pDef(P.chain.then);
      if (!nx) return;
      P.view = nx; P.len = P.chain.len; P.chainGo = true;
      try { history.replaceState(null, "", "#practice/" + nx.id); } catch (e) {}
      pStart();
    });
    el.querySelector(".sd-tiles").addEventListener("click", function (e) {
      var b = e.target.closest(".sd-t");
      if (b) sdShow(SD.open === b.dataset.ex ? "" : b.dataset.ex);
    });
    $("#sdEx").addEventListener("click", function (e) { if (e.target.closest(".sd-ex-x")) sdShow("", true); });
    if (chart) {
      sdChartWire();
      setTimeout(function () { pChart(r.hrPts, r.secs, r); }, 30);
    }
  }

  /* What comes next: the practice this one began (chosen as "Begin with" on its page), carried on with
     a tap, or else a suggestion of what usually follows (d.next), on its own page. */
  function sdNext(d) {
    var ch = P.chain && P.chain.then !== d.id ? pDef(P.chain.then) : null;
    if (ch) return '<div class="note-card sd-next"><p><b>Next: ' + esc(ch.name) + ".</b> " + esc(ch.chainTxt || "") + "</p>" +
      '<button class="btn primary" id="sdChain">Continue to ' + esc(ch.name) + "</button></div>";
    var nx = d.next && pDef(d.next.id);
    return nx ? '<div class="note-card sd-next"><p>' + esc(d.next.txt) + '</p><a class="btn" href="#practice/' + nx.id + '">' + esc(nx.name) + "</a></div>" : "";
  }

  // what each number means, with your own value read back
  function sdExplain(k) {
    var r = SD.r, d = SD.d, n, p = [];
    var plural = function (x, one, many) { return x + " " + (x === 1 ? one : many); };
    if (k === "time") {
      p.push(r.early ? "You ended the session after " + fmt(r.secs) + ", before its planned end. Everything here covers the part you did."
        : d.selfPaced ? "The time you took, at your own pace: " + fmt(r.secs) + "." : "The session ran its full length: " + fmt(r.secs) + ".");
      p.push("Time on pause isn't counted. Sessions of a minute or more go into your history, on Today.");
      if (r.at) p.push(SD.c.n === 1 ? "This was your first session of " + d.name + "." : "This was your " + sdNth(SD.c.n) + " session of " + d.name +
        (SD.c.week > 1 ? ", and your " + sdNth(SD.c.week) + " in the last seven days." : ", and the first in the last seven days."));
      return ["Time", p];
    }
    if (k === "hr") {
      var span = Math.min(120, r.secs / 3), dl = r.hr1 - r.hr0;
      p.push("Your average heart rate " + (span >= 119 ? "in the first two minutes, then in the last two" : "in the first third of the session, then in the last third") +
        ", in beats per minute: " + r.hr0 + ", then " + r.hr1 + ".");
      var lively = d.method === "move" || d.goal === "energy" || d.id === "wim-hof" || d.id === "kapalabhati";
      if (dl <= -3) p.push("It came down " + plural(-dl, "beat", "beats") + " a minute. A fall like this is the usual sign of the body settling: slow breathing and rest shift the nervous system towards its calming side, which slows the heart.");
      else if (dl >= 3) p.push("It rose " + plural(dl, "beat", "beats") + " a minute. " + (lively ? "That's expected after movement or energising breathing." : "Sitting up, moving or a busy mind can raise it. One session is one reading: your history shows the trend."));
      else p.push("It stayed within a few beats. That's common in short or gentle sessions, or when you started out already rested.");
      if (SD.c.hr) p.push(sdHrAgainst(dl, SD.c.hr, d));
      return ["Heart rate, start to end", p];
    }
    if (k === "hravg") {
      p.push("Your average heart rate across the session: " + r.hrAvg + " beats a minute.");
      p.push("When a session has two and a half minutes or more of steady readings, this shows the start against the end instead, so you can see the change.");
      return ["Heart rate", p];
    }
    if (k === "coh") {
      p.push("How much of your heart rhythm's rise and fall settled into one smooth, regular wave, usually the one your breathing sets. It's HeartMath's published measure, worked out every 5 seconds from the last 64 seconds of heartbeats, and it usually runs from 0 to 8.");
      p.push("Here it averaged " + r.coh.toFixed(1) + ", and your best moment reached " + r.cohMax.toFixed(1) + ". Everyday breathing usually scores low; slow, even breathing near your resonance pace raises it. HeartMath's own apps use a different scale, so compare it with your own sessions here.");
      if (SD.c.coh) p.push(sdAgainst(r.coh, SD.c.coh, d, "coherence", 0.3, "with a beat-to-beat sensor"));
      return ["Coherence", p];
    }
    if (k === "swing") {
      p.push("Your heart speeds up a little as you breathe in and slows as you breathe out. The swing is how far it moves within one breath, the highest heart rate minus the lowest, averaged over the breaths here: " + r.swing.toFixed(1) + " beats a minute.");
      p.push("A bigger swing means more heart-rate variability, which is what slow breathing trains. It's usually biggest at your own resonance pace, which the resonance test on the Heart tab finds. Swing differs a lot between people and shrinks with age, so compare it with your own sessions.");
      if (SD.c.swing) p.push(sdAgainst(r.swing, SD.c.swing, d, "swing", 0.5, "with a heart sensor"));
      return ["Swing per breath", p];
    }
    if (k === "wander") {
      p.push("You noticed that your mind had wandered and brought it back to the breath " + plural(r.wander, "time", "times") + ".");
      p.push("Noticing and coming back is the training itself. Each return is one repetition, so a higher number is a sign of practice, not of a worse sitting.");
      return ["Came back", p];
    }
    if (k === "holds") {
      p.push("How long you held your breath after the power breaths, round by round: " + r.holds.map(fmt).join(", ") + ". The longest was " + fmt(Math.max.apply(null, r.holds)) + ".");
      p.push("Holds often lengthen in later rounds: the fast breathing lowers carbon dioxide, so the urge to breathe comes later. That's also why this practice is done only sitting or lying down, with each hold ending as soon as you need to breathe.");
      return ["Breath holds", p];
    }
    if (k === "suds" && d.rate && d.rate.what === "hunger") {
      p.push("How hungry you were each time you rated it, from 0 (not hungry at all) to 10 (as hungry as you get): " + r.suds.join(", then ") + ".");
      if (r.suds.length > 1) {
        n = r.suds[0] - r.suds[r.suds.length - 1];
        p.push(n > 0 ? "Your hunger came down " + plural(n, "point", "points") + " over the meal." : n < 0 ? "Your hunger went up: eating can sharpen the appetite at first." : "Your hunger stayed where it was.");
        p.push("There's no right number. Noticing it is the point, and over a few meals you'll see your own pattern.");
      } else p.push("Rate it before and after a meal to see how it changes.");
      return [d.rate.name, p];
    }
    if (k === "suds") {
      p.push("How strong the feeling was each time you rated it, from 0 (not at all) to 10 (as strong as it gets): " + r.suds.join(", then ") + ".");
      if (r.suds.length > 1) {
        n = r.suds[r.suds.length - 1] - r.suds[0];
        p.push(n < 0 ? "It came down " + plural(-n, "point", "points") + " from your first rating."
          : n > 0 ? "It went up. That can happen as a feeling comes more into focus. A slow-breathing practice may help it settle."
          : "It held steady. A more specific phrase sometimes helps, or another round later.");
      } else p.push("Rate it again after another round to see how it changes.");
      return ["Intensity", p];
    }
    if (k === "beat") {
      p.push("Where the binaural beat started and where it finished: " + r.beat0.toFixed(1) + " Hz, then " + r.beat1.toFixed(1) + " Hz.");
      p.push(r.beatHeart ? "After a minute and a half measuring your resting heart, the beat followed it. As your heart rate fell below that baseline, and its variability and coherence rose, the beat moved from 10 Hz (alpha) towards 4 Hz (theta), by at most 0.15 Hz every five seconds. The violet line on the chart shows its path."
        : "There was no heart data, so the beat followed a fixed, gentle descent instead.");
      p.push("This is an experiment: the rule is Entrain's own, so the chart is the honest test of what it did for you.");
      return ["The beat", p];
    }
    if (k === "onset") {
      var nap = r.nap;
      if (nap.onset !== null) p.push("About " + plural(nap.onset, "minute", "minutes") + ", estimated from your heart. First your resting heart rate was measured, lying down, over two and a half minutes: " + nap.base + " beats a minute. Sleep was counted from when your heart rate, averaged over a minute, fell at least 3 beats (or 4%) below that and stayed there for three minutes, which usually happens as you cross into light sleep.");
      else if (nap.sensor) p.push("Your heart rate didn't stay far enough below your resting rate (" + nap.base + " beats a minute) for three minutes, so no sleep was counted. Lying still with your eyes closed still rests you.");
      else p.push("Without heart data the nap can't estimate sleep, so it woke you after the nap length plus five minutes to drift off.");
      p.push("A heart sensor can't see sleep stages, so treat this as a guide.");
      return ["Falling asleep", p];
    }
    if (k === "nap") {
      p.push("From the moment you fell asleep (estimated) to the wake-up: about " + plural(r.nap.slept, "minute", "minutes") + " of sleep.");
      p.push("After a short night, a 10-minute nap lifted alertness straight away, a 20-minute one helped from about half an hour after waking, and 30 minutes brought a spell of grogginess first (Brooks & Lack, 2006).");
      return ["Nap", p];
    }
    if (k === "naphr") {
      p.push(r.nap.base + " beats a minute is your resting heart rate, measured lying down at the start. " + r.nap.low + " is the lowest it went during the nap, averaged over a minute.");
      p.push("Heart rate drops at each step down into sleep, which is what the estimate of when you fell asleep relies on.");
      return ["Heart rate, resting to lowest", p];
    }
    return ["", []];
  }
  /* ----- against your own sessions: the usual for this practice, from the history ----- */
  function sdCompare(r, d) {
    var prev = hLoad().filter(function (e) { return e.k === "practice" && e.id === d.id && e.at !== r.at; }), c = {}, wk = Date.now() - 7 * DAY;
    if (r.hr0 && r.hr1) c.hr = sdUsual(prev.filter(function (e) { return e.hr0 && e.hr1; }).map(function (e) { return e.hr1 - e.hr0; }));
    if (r.coh) c.coh = sdUsual(prev.filter(function (e) { return e.coh && !e.est; }).map(function (e) { return e.coh; }));   // not the estimates kept from before
    if (r.swing) c.swing = sdUsual(prev.filter(function (e) { return e.swing; }).map(function (e) { return e.swing; }));
    c.n = prev.length + 1;                                   // counted only once this one is in the history (r.at)
    c.week = prev.filter(function (e) { return e.at >= wk; }).length + 1;
    return c;
  }
  // one earlier value is "last time"; with more, the usual is the middle of the last ten
  function sdUsual(vals) {
    if (!vals.length) return null;
    vals = vals.slice(-10);
    var s = vals.slice().sort(function (a, b) { return a - b; }), m = s.length >> 1;
    return { n: vals.length, last: vals.length === 1, v: s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2, max: s[s.length - 1] };
  }
  function sdBest(now, u) { return u && u.n >= 2 && now > u.max; }
  function sdCmpTxt(u, f, now) {
    if (!u) return "";
    if (sdBest(now, u)) return "Your best yet";
    return (u.last ? "Last time " : "Usually ") + f(u.v);
  }
  function sdFix1(v) { return v.toFixed(1); }
  function sdSigned(v) { return v > 0 ? "+" + v : "−" + -v; }
  function sdNth(n) {
    var t = n % 100, e = t > 10 && t < 14 ? "th" : ["th", "st", "nd", "rd"][n % 10] || "th";
    return n + e;
  }
  function sdMoved(v) {
    v = Math.round(v);
    return v <= -1 ? "came down " + -v + (v === -1 ? " beat" : " beats") + " a minute" : v >= 1 ? "rose " + v + (v === 1 ? " beat" : " beats") + " a minute" : "held steady";
  }
  // the heart-rate change against your usual one, in words that hold whether it usually falls or rises
  function sdHrAgainst(dl, u, d) {
    var s = u.last ? "Last time you did " + d.name + " with a heart sensor, your heart rate " + sdMoved(u.v) + "."
      : "In your last " + u.n + " sessions of " + d.name + " with a heart sensor, it usually " + sdMoved(u.v) + " (the middle value).";
    var diff = dl - u.v;
    if (Math.abs(diff) < 2.5) return s + " This time was " + (u.last ? "about the same." : "close to your usual.");
    var falls = u.v <= 0, cmp = u.last ? " than last time." : " than usual.";
    if (falls) return s + (diff < 0 ? " This time it fell further" + cmp : dl <= 0 ? " This time it fell less" + cmp : " This time it rose instead.");
    return s + (diff > 0 ? " This time it rose more" + cmp : dl >= 0 ? " This time it rose less" + cmp : " This time it fell instead.");
  }
  // a score against your usual: the same, higher, lower, or your best yet
  function sdAgainst(now, u, d, what, near, kind) {
    var s = u.last ? "Last time you did " + d.name + " " + kind + ", your " + what + " was " + u.v.toFixed(1) + "."
      : "Your usual " + what + " in " + d.name + " is " + u.v.toFixed(1) + ", the middle of your last " + u.n + " sessions " + kind + ".";
    if (sdBest(now, u)) return s + " This was your best yet, above all " + u.n + " of them.";
    var diff = now - u.v;
    return s + (Math.abs(diff) < near ? " This one was about the same." : diff > 0 ? " This one was higher." : " This one was lower.");
  }
  function sdShow(k, refocus) {
    SD.open = k;
    document.querySelectorAll("#sDone .sd-t").forEach(function (b) { b.setAttribute("aria-expanded", b.dataset.ex === k ? "true" : "false"); });
    var ex = $("#sdEx");
    if (!k) {
      ex.hidden = true;
      if (refocus) { var b = document.querySelector("#sDone .sd-t"); if (b) b.focus(); }
      return;
    }
    var e = sdExplain(k);
    ex.innerHTML = '<div class="sd-ex-h"><b id="sdExT">' + esc(e[0]) + '</b><button class="sd-ex-x" aria-label="Close">' +
      '<svg class="i" aria-hidden="true"><use href="#i-x"/></svg></button></div>' + e[1].map(function (x) { return "<p>" + esc(x) + "</p>"; }).join("");
    ex.hidden = false;
    try { ex.scrollIntoView({ block: "nearest", behavior: RM ? "auto" : "smooth" }); } catch (x) {}
  }

  /* ----- the chart: heart rate across the session, with the steps, the beat and sleep marked ----- */
  function sdHowTxt() {
    var r = SD.r, t = [];
    t.push("Your heart rate from the start (left) to the end (right), averaged over 10 seconds so the line is easy to follow. The numbers on the left are the top and bottom of its scale, in beats a minute, and the times along the bottom are minutes into the session.");
    t.push("The thin vertical lines mark where each step began." +
      (r.beatLog ? " The violet line is the binaural beat, on its own scale from 11 Hz at the top to 3 Hz at the bottom." : "") +
      (r.nap && r.nap.onsetT ? " The dashed line marks when you fell asleep (estimated)." : ""));
    t.push("A line that drifts down means your body settled. The ripples are your breaths: heart rate rises as you breathe in and falls as you breathe out. Tap or drag on the chart to read the time, your heart rate and the step at any point.");
    return t.map(esc);
  }
  function sdHow(open) {
    var b = $("#sdHow"), t = $("#sdHowT");
    if (!b || !t) return;
    t.hidden = !open;
    b.setAttribute("aria-expanded", open ? "true" : "false");
  }
  function pChart(pts, T, r) {
    // a 10-second running mean keeps the line readable
    SD.sm = pts.map(function (p, i) {
      var a = 0, n = 0;
      for (var k = i; k >= 0 && pts[k].t > p.t - 10; k--) { a += pts[k].hr; n++; }
      return { t: p.t, hr: a / n };
    });
    SD.T = T; SD.r = r; SD.cur = -1;
    sdDraw();
  }
  function sdDraw() {
    var cv = $("#sdChart"), f = cv && SD.sm ? fitCanvas(cv) : null;
    if (!f) return;
    var c = f.c, W = f.w, Hh = f.h, r = SD.r, T = SD.T, sm = SD.sm, lo = Infinity, hi = -Infinity;
    sm.forEach(function (p) { lo = Math.min(lo, p.hr); hi = Math.max(hi, p.hr); });
    lo = Math.floor(lo - 2); hi = Math.ceil(hi + 2);
    var L = 30, R = W - (r && r.beatLog ? 38 : 8), top = 8, bot = Hh - 20;
    SD.L = L; SD.R = R;
    var X = function (t) { return L + t / T * (R - L); }, Y = function (v) { return top + (hi - v) / (hi - lo) * (bot - top); };
    var BY = function (hz) { return top + (11 - hz) / 8 * (bot - top); };
    c.strokeStyle = BCOL.line; c.lineWidth = 1;
    c.beginPath(); c.moveTo(L, bot + 0.5); c.lineTo(R, bot + 0.5); c.stroke();
    P.steps.forEach(function (s) { if (s.at > 0 && s.at < T) { c.beginPath(); c.moveTo(X(s.at) + 0.5, top); c.lineTo(X(s.at) + 0.5, bot); c.stroke(); } });
    c.beginPath();
    sm.forEach(function (p, i) { if (i) c.lineTo(X(p.t), Y(p.hr)); else c.moveTo(X(p.t), Y(p.hr)); });
    c.strokeStyle = BCOL.hr; c.lineWidth = 2; c.stroke();
    if (r && r.beatLog) {                       // the beat, on its own scale (3 to 11 Hz)
      c.beginPath();
      r.beatLog.forEach(function (p, i) { if (i) c.lineTo(X(p.t), BY(p.hz)); else c.moveTo(X(p.t), BY(p.hz)); });
      c.strokeStyle = BCOL["b-out"]; c.lineWidth = 2; c.stroke();
    }
    if (r && r.nap && r.nap.onsetT) {           // where sleep began (estimated)
      c.strokeStyle = BCOL["b-hold"]; c.lineWidth = 1.5; c.setLineDash([4, 4]);
      c.beginPath(); c.moveTo(X(r.nap.onsetT) + 0.5, top); c.lineTo(X(r.nap.onsetT) + 0.5, bot); c.stroke(); c.setLineDash([]);
      c.font = "600 10.5px " + B_SANS; c.fillStyle = BCOL["b-hold"]; c.textAlign = "left"; c.textBaseline = "top";
      c.fillText("asleep (est.)", X(r.nap.onsetT) + 4, top);
    }
    // the scales: heart rate on the left, the beat on the right, minutes along the bottom
    c.font = "500 10.5px " + B_SANS; c.fillStyle = BCOL["text-faint"];
    c.textAlign = "right"; c.textBaseline = "top"; c.fillText(String(hi), L - 6, top - 1);
    c.textBaseline = "bottom"; c.fillText(String(lo), L - 6, bot + 1);
    c.textBaseline = "top";
    c.textAlign = "left"; c.fillText("0:00", L, bot + 5);
    c.textAlign = "right"; c.fillText(fmt(T).replace(/^0(?=\d:)/, ""), R, bot + 5);
    if (r && r.beatLog) {
      c.fillStyle = BCOL["b-out"]; c.textAlign = "left";
      c.textBaseline = "top"; c.fillText("11 Hz", R + 6, top - 1);
      c.textBaseline = "bottom"; c.fillText("3 Hz", R + 6, bot + 1);
    }
    if (SD.cur >= 0) {                          // the point you're reading
      var a = sdAt(SD.cur), x = X(SD.cur);
      c.strokeStyle = BCOL.text; c.globalAlpha = 0.55; c.lineWidth = 1;
      c.beginPath(); c.moveTo(x + 0.5, top); c.lineTo(x + 0.5, bot); c.stroke(); c.globalAlpha = 1;
      if (a.hr) { c.fillStyle = BCOL.hr; c.beginPath(); c.arc(x, Y(a.hr), 4.5, 0, Math.PI * 2); c.fill(); }
      if (a.hz) { c.fillStyle = BCOL["b-out"]; c.beginPath(); c.arc(x, BY(a.hz), 4, 0, Math.PI * 2); c.fill(); }
    }
  }
  // what the chart says at a moment: heart rate, the step, the beat
  function sdAt(t) {
    var sm = SD.sm, r = SD.r, best = null, i;
    for (i = 0; i < sm.length; i++) if (!best || Math.abs(sm[i].t - t) < Math.abs(best.t - t)) best = sm[i];
    var step = null;
    P.steps.forEach(function (s) { if (s.at <= t + 0.01) step = s; });
    var hz = null;
    if (r && r.beatLog) { var bl = null; r.beatLog.forEach(function (p) { if (!bl || Math.abs(p.t - t) < Math.abs(bl.t - t)) bl = p; }); hz = bl ? bl.hz : null; }
    return { hr: best && Math.abs(best.t - t) < 30 ? best.hr : null, step: step ? step.title : "", hz: hz };
  }
  function sdCursor(t) {
    SD.cur = Math.max(0, Math.min(SD.T, t));
    sdDraw();
    var a = sdAt(SD.cur), txt = "At " + fmt(SD.cur).replace(/^0(?=\d:)/, "") + (a.hr ? " · " + Math.round(a.hr) + " bpm" : " · no reading") +
      (a.step ? " · " + a.step : "") + (a.hz ? " · beat " + a.hz.toFixed(1) + " Hz" : "");
    bSetT("#sdRead", txt);
    var cv = $("#sdChart");
    cv.setAttribute("aria-valuenow", String(Math.round(SD.cur)));
    cv.setAttribute("aria-valuetext", txt);
  }
  function sdChartWire() {
    var cv = $("#sdChart");
    var at = function (e) { var b = cv.getBoundingClientRect(); return (e.clientX - b.left - SD.L) / Math.max(1, SD.R - SD.L) * SD.T; };
    cv.addEventListener("pointerdown", function (e) {
      SD.drag = true;
      try { cv.setPointerCapture(e.pointerId); } catch (x) {}
      sdCursor(at(e));
      sdHow(true);                              // the first tap also says how to read it
    });
    cv.addEventListener("pointermove", function (e) { if (SD.drag) sdCursor(at(e)); });
    ["pointerup", "pointercancel"].forEach(function (ev) { cv.addEventListener(ev, function () { SD.drag = false; }); });
    cv.addEventListener("keydown", function (e) {
      var step = SD.T / 30, t = SD.cur < 0 ? 0 : SD.cur;
      if (e.key === "ArrowRight" || e.key === "ArrowUp") t += step;
      else if (e.key === "ArrowLeft" || e.key === "ArrowDown") t -= step;
      else if (e.key === "Home") t = 0;
      else if (e.key === "End") t = SD.T;
      else return;
      e.preventDefault();
      sdCursor(t);
    });
    $("#sdHow").addEventListener("click", function () { sdHow(this.getAttribute("aria-expanded") !== "true"); });
    if (SD.ro) SD.ro.disconnect();
    if (window.ResizeObserver) { SD.ro = new ResizeObserver(function () { sdDraw(); }); SD.ro.observe(cv); }
  }
