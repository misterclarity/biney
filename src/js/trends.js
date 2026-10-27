  /* ---------------------------------- trends ----------------------------------
     History over the last twelve weeks or months: the minutes you practised, how your heart rate
     moved from the start of a session to its end, and coherence. One small chart each, on a scale
     of its own (two measures never share an axis). Tap or drag across them, or use the arrow
     keys, to read any week; the table under them holds every number too. The colours are the
     app's own hues, stepped to one lightness for charts on the dark panel (see styles.css).
  ---------------------------------------------------------------------------- */

  var TN = { unit: "week", per: null, est: false, sel: -1, geo: null, drag: false, ro: null };
  var TN_N = 12;                     // weeks or months shown
  var TN_LG = 36, TN_RG = 4;         // room on the left for the scale, and a little air on the right

  // the first day of the week where you are: Monday unless your language's calendar says otherwise
  function tnWeekStart() {
    try {
      var L = new Intl.Locale(navigator.language), w = L.getWeekInfo ? L.getWeekInfo() : L.weekInfo;
      if (w && w.firstDay) return w.firstDay % 7;
    } catch (e) {}
    return 1;
  }
  // the last twelve weeks or calendar months, oldest first, this one last
  function tnPeriods(unit) {
    var out = [], d = new Date(hDayStart(Date.now())), i;
    if (unit === "week") {
      d.setDate(d.getDate() - (d.getDay() - tnWeekStart() + 7) % 7);
      for (i = TN_N - 1; i >= 0; i--) {
        var s = new Date(d), e = new Date(d);
        s.setDate(s.getDate() - 7 * i); e.setDate(e.getDate() - 7 * i + 7);
        out.push({ at: s.getTime(), end: e.getTime() });
      }
    } else {
      for (i = TN_N - 1; i >= 0; i--) out.push({ at: new Date(d.getFullYear(), d.getMonth() - i, 1).getTime(), end: new Date(d.getFullYear(), d.getMonth() - i + 1, 1).getTime() });
    }
    return out;
  }
  function tnMid(a) { var s = a.slice().sort(function (x, y) { return x - y; }), m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; }
  // each period's minutes and sessions, its middle heart-rate change, and its average coherence:
  // from a beat-to-beat sensor when you have any, else the estimates made from heart rate alone before
  // October 2026 (est), which aren't comparable
  function tnData(unit) {
    var per = tnPeriods(unit), soon = Date.now() + 6e4;
    per.forEach(function (p) { p.n = 0; p.secs = 0; p.dl = []; p.cr = []; p.ce = []; });
    hLoad().forEach(function (e) {
      if (e.at > soon) return;                           // dated in the future: a clock that was wrong
      for (var i = per.length - 1; i >= 0; i--) {
        if (e.at < per[i].at) continue;
        var p = per[i];
        p.n++; p.secs += e.secs;
        if (e.hr0 && e.hr1) p.dl.push(e.hr1 - e.hr0);
        if (e.coh) (e.est ? p.ce : p.cr).push(e.coh);
        break;
      }
    });
    var real = per.some(function (p) { return p.cr.length; });
    per.forEach(function (p) {
      var c = real ? p.cr : p.ce;
      p.hr = p.dl.length ? tnMid(p.dl) : null;
      p.coh = c.length ? avg(c) : null;
      p.cn = c.length;
    });
    return { per: per, est: !real };
  }
  function tnCount(k) { return TN.per.filter(function (p) { return k === "n" ? p.n > 0 : p[k] !== null; }).length; }
  function tnSigned(v) { v = Math.round(v); return v > 0 ? "+" + v : v < 0 ? "−" + -v : "steady"; }
  function tnName(i, short) {
    var d = new Date(TN.per[i].at), last = TN.per.length - 1;
    if (TN.unit === "week") {
      var day = d.toLocaleDateString(undefined, { day: "numeric", month: "short" });
      return short ? day : i === last ? "This week" : i === last - 1 ? "Last week" : "Week of " + day;
    }
    var other = d.getFullYear() !== new Date().getFullYear();
    if (short) return d.toLocaleDateString(undefined, other ? { month: "short", year: "numeric" } : { month: "long" });
    return i === last ? "This month" : d.toLocaleDateString(undefined, other ? { month: "long", year: "numeric" } : { month: "long" });
  }
  function tnRead(i) {
    var p = TN.per[i], parts = [p.n ? hMins(p.secs) + " in " + p.n + (p.n === 1 ? " session" : " sessions") : "no sessions"];
    if (p.hr !== null) parts.push("heart rate " + tnSigned(p.hr) + (p.dl.length > 1 ? " (the middle of " + p.dl.length + ")" : ""));
    if (p.coh !== null) parts.push("coherence " + p.coh.toFixed(1) + (TN.est ? " (est.)" : ""));
    return [tnName(i), parts.join(", ")];
  }

  /* ----- the section ----- */
  function tnSec() {
    TN.unit = store.get("trendUnit") === "month" ? "month" : "week";
    var D = tnData(TN.unit), wk = TN.unit === "week";
    TN.per = D.per; TN.est = D.est; TN.sel = TN.per.length - 1;
    var h = '<section class="hi-tr" aria-labelledby="hiTrH"><div class="hi-tr-h"><h2 id="hiTrH">Trends</h2>' +
      '<div class="mini-seg" id="tnUnit" aria-label="Show by">' + [["week", "Weeks"], ["month", "Months"]].map(function (o) {
        return '<button data-v="' + o[0] + '" aria-pressed="' + (o[0] === TN.unit) + '">' + o[1] + "</button>";
      }).join("") + "</div></div>";
    if (tnCount("n") < 2) return h + '<p class="hi-tr-note">Trends show here once you have sessions in two different ' + (wk ? "weeks" : "months") + ".</p></section>";
    var nHr = tnCount("hr"), nCoh = tnCount("coh");
    h += '<p class="hi-tr-read" id="tnRead"></p>' +
      '<div class="hi-tr-plots" id="tnPlots" tabindex="0" role="slider" aria-label="Trends by ' + TN.unit + '" aria-valuemin="0" aria-valuemax="' + (TN.per.length - 1) + '">' +
        '<h3>Minutes</h3><svg class="hi-tr-svg" id="tnMin" aria-hidden="true"></svg>' +
        (nHr >= 2 ? "<h3>Heart rate, start to end<small>middle value, bpm</small></h3>" + '<svg class="hi-tr-svg" id="tnHr" aria-hidden="true"></svg>' : "") +
        (nCoh >= 2 ? "<h3>Coherence" + (TN.est ? " (estimated)" : "") + "<small>average</small></h3>" + '<svg class="hi-tr-svg" id="tnCoh" aria-hidden="true"></svg>' : "") +
      "</div>" +
      (nHr === 1 || nCoh === 1 ? '<p class="hi-tr-note">Heart rate and coherence chart here once two ' + (wk ? "weeks" : "months") + " have sessions with a heart sensor.</p>" : "") +
      '<details class="hi-tr-tab"><summary>Show as a table</summary>' + tnTable() + "</details></section>";
    return h;
  }
  function tnTable() {
    var rows = TN.per.map(function (p, i) {
      return "<tr><th scope=\"row\">" + esc(tnName(i, true)) + "</th><td>" + (p.n ? hMins(p.secs) : "—") + "</td><td>" + (p.n || "—") + "</td><td>" +
        (p.hr !== null ? tnSigned(p.hr) : "—") + "</td><td>" + (p.coh !== null ? p.coh.toFixed(1) : "—") + "</td></tr>";
    }).reverse().join("");
    return '<div class="hi-tr-tw"><table><thead><tr><th scope="col">' + (TN.unit === "week" ? "Week of" : "Month") + '</th><th scope="col">Time</th><th scope="col">Sessions</th>' +
      '<th scope="col">Heart rate</th><th scope="col">Coherence' + (TN.est ? " (est.)" : "") + "</th></tr></thead><tbody>" + rows + "</tbody></table></div>";
  }

  /* ----- drawing: SVG at the width it has, so text is never stretched ----- */
  function tnNice(v, steps) {
    for (var i = 0; i < steps.length; i++) if (v <= steps[i]) return steps[i];
    var top = steps[steps.length - 1];
    return Math.ceil(v / top) * top;
  }
  function tnF(v) { return Math.round(v * 10) / 10; }
  // a column from the baseline, its data end rounded, its foot square
  function tnBar(x, w, yb, yt, r) {
    var d = yt < yb ? 1 : -1;
    return "M" + tnF(x) + "," + tnF(yb) + "V" + tnF(yt + d * r) + "Q" + tnF(x) + "," + tnF(yt) + " " + tnF(x + r) + "," + tnF(yt) +
      "H" + tnF(x + w - r) + "Q" + tnF(x + w) + "," + tnF(yt) + " " + tnF(x + w) + "," + tnF(yt + d * r) + "V" + tnF(yb) + "Z";
  }
  function tnFrame(lo, hi, top, ph, ticks, fmtTick) {
    var g = TN.geo, Y = function (v) { return top + (hi - v) / (hi - lo) * ph; }, s = "";
    s += '<rect class="tn-band" x="' + tnF(g.X(TN.sel) - g.slot / 2) + '" y="' + top + '" width="' + tnF(g.slot) + '" height="' + ph + '" rx="5"/>';
    ticks.forEach(function (v) {
      var y = tnF(Y(v));
      s += '<line class="' + (v === 0 ? "tn-base" : "tn-grid") + '" x1="' + TN_LG + '" x2="' + (g.W - TN_RG) + '" y1="' + y + '" y2="' + y + '"/>' +
        '<text class="tn-tick" x="' + (TN_LG - 6) + '" y="' + y + '" text-anchor="end" dominant-baseline="middle">' + esc(fmtTick(v)) + "</text>";
    });
    return { s: s, Y: Y };
  }
  function tnAxis(top) {
    var g = TN.geo, n = TN.per.length, s = "", y = top + 13;
    var at = TN.unit === "week" ? [n - 9, n - 5, n - 1] : TN.per.map(function (p, i) { return i; });
    at.forEach(function (i) {
      if (i < 0) return;
      var txt = TN.unit === "week" ? tnName(i, true) : new Date(TN.per[i].at).toLocaleDateString(undefined, { month: "narrow" });
      var x = g.X(i), anchor = "middle";
      if (TN.unit === "week" && i === n - 1) { x = g.W - TN_RG; anchor = "end"; }          // the last label stays inside the edge
      s += '<text class="tn-tick' + (i === TN.sel ? " on" : "") + '" x="' + tnF(x) + '" y="' + y + '" text-anchor="' + anchor + '">' + esc(txt) + "</text>";
    });
    return s;
  }
  function tnPut(id, s, H) {
    var svg = $(id);
    if (!svg) return;
    svg.setAttribute("viewBox", "0 0 " + TN.geo.W + " " + H);
    svg.setAttribute("width", TN.geo.W);
    svg.setAttribute("height", H);
    svg.innerHTML = s;
  }
  function tnDraw() {
    var box = $("#tnPlots");
    if (!box || !TN.per) return;
    var W = Math.floor(box.clientWidth);
    if (W < 120) return;                                 // hidden, or in the middle of a layout
    var n = TN.per.length, slot = (W - TN_LG - TN_RG) / n, bw = Math.min(24, Math.max(4, slot * 0.56));
    TN.geo = { W: W, slot: slot, X: function (i) { return TN_LG + slot * (i + 0.5); } };
    var top = 8, sel = TN.sel, f, s;

    // minutes: columns from zero
    var mins = TN.per.map(function (p) { return p.secs / 60; });
    var mMax = tnNice(Math.max.apply(null, mins.concat([1])), [10, 20, 30, 45, 60, 90, 120, 180, 240, 300, 360, 480, 600, 720, 900, 1200]);
    f = tnFrame(0, mMax, top, 84, [0, mMax], function (v) { return v ? (v < 120 ? v + " min" : v / 60 + " h") : "0"; });
    s = f.s;
    mins.forEach(function (v, i) {
      if (!v) return;
      var yt = f.Y(v), yb = f.Y(0), r = Math.min(4, yb - yt, bw / 2);
      s += '<path class="tn-min' + (i === sel ? " on" : "") + '" d="' + tnBar(TN.geo.X(i) - bw / 2, bw, yb, yt, r) + '"/>';
    });
    tnPut("#tnMin", s + tnAxis(top + 84), top + 84 + 18);

    // heart rate: columns down from zero where it came down, up where it rose
    if ($("#tnHr")) {
      var hv = TN.per.map(function (p) { return p.hr; }), got = hv.filter(function (v) { return v !== null; });
      var steps = [2, 4, 6, 8, 10, 12, 15, 20, 25, 30];
      var lo = Math.min.apply(null, got.concat([0])), hi = Math.max.apply(null, got.concat([0]));
      lo = lo < 0 ? -tnNice(-lo, steps) : 0; hi = hi > 0 ? tnNice(hi, steps) : 0;
      if (lo === 0 && hi === 0) hi = 2;
      var ticks = [lo, 0, hi].filter(function (v, k, a) { return a.indexOf(v) === k; });
      f = tnFrame(lo, hi, top, 70, ticks, function (v) { return v > 0 ? "+" + v : v < 0 ? "−" + -v : "0"; });
      s = f.s;
      hv.forEach(function (v, i) {
        if (v === null) return;
        var x = TN.geo.X(i) - bw / 2, y0 = f.Y(0);
        if (Math.round(v) === 0) { s += '<rect class="tn-zero" x="' + tnF(x) + '" y="' + tnF(y0 - 1.5) + '" width="' + tnF(bw) + '" height="3" rx="1.5"/>'; return; }
        var yt = f.Y(v), r = Math.min(4, Math.abs(y0 - yt), bw / 2);
        s += '<path class="' + (v < 0 ? "tn-down" : "tn-up") + (i === sel ? " on" : "") + '" d="' + tnBar(x, bw, y0, yt, r) + '"/>';
      });
      tnPut("#tnHr", s + tnAxis(top + 70), top + 70 + 18);
    }

    // coherence: a line through the periods that have it, a dot on each
    if ($("#tnCoh")) {
      var cv = TN.per.map(function (p) { return p.coh; });
      var cMax = tnNice(Math.max.apply(null, cv.filter(function (v) { return v !== null; }).concat([1])), [1, 2, 3, 4, 5, 6, 8, 10, 12, 16]);
      f = tnFrame(0, cMax, top, 64, [0, cMax], function (v) { return String(v); });
      s = f.s;
      var d = "", pen = false;
      cv.forEach(function (v, i) {
        if (v === null) { pen = false; return; }
        d += (pen ? "L" : "M") + tnF(TN.geo.X(i)) + "," + tnF(f.Y(v));
        pen = true;
      });
      if (d) s += '<path class="tn-line" d="' + d + '"/>';
      cv.forEach(function (v, i) {
        if (v !== null) s += '<circle class="tn-dot' + (i === sel ? " on" : "") + '" cx="' + tnF(TN.geo.X(i)) + '" cy="' + tnF(f.Y(v)) + '" r="' + (i === sel ? 5 : 4) + '"/>';
      });
      tnPut("#tnCoh", s + tnAxis(top + 64), top + 64 + 18);
    }
    var rd = tnRead(sel), el = $("#tnRead");
    el.innerHTML = "<b>" + esc(rd[0]) + "</b> " + esc(rd[1]);
    box.setAttribute("aria-valuenow", sel);
    box.setAttribute("aria-valuetext", rd[0] + ": " + rd[1]);
  }
  function tnPick(i) {
    i = Math.max(0, Math.min(TN.per.length - 1, i));
    if (i === TN.sel) return;
    TN.sel = i;
    tnDraw();
  }
  function tnAtX(clientX) {
    var box = $("#tnPlots"), r = box.getBoundingClientRect();
    return Math.floor((clientX - r.left - TN_LG) / TN.geo.slot);
  }
  // after History has drawn: the switch, the charts, and reading them by pointer and keyboard
  function tnStart() {
    var seg = $("#tnUnit");
    if (seg) seg.addEventListener("click", function (e) {
      var b = e.target.closest("button");
      if (!b || b.dataset.v === TN.unit) return;
      store.set("trendUnit", b.dataset.v);
      var sec = document.querySelector(".hi-tr");
      sec.outerHTML = tnSec();
      tnStart();
      var nb = document.querySelector('#tnUnit button[data-v="' + b.dataset.v + '"]');
      if (nb) nb.focus();
    });
    if (TN.ro) { TN.ro.disconnect(); TN.ro = null; }
    var box = $("#tnPlots");
    if (!box) return;
    box.addEventListener("pointerdown", function (e) {
      TN.drag = true;
      try { box.setPointerCapture(e.pointerId); } catch (x) {}
      if (TN.geo) tnPick(tnAtX(e.clientX));
    });
    box.addEventListener("pointermove", function (e) { if (TN.drag && TN.geo) tnPick(tnAtX(e.clientX)); });
    var stop = function () { TN.drag = false; };
    box.addEventListener("pointerup", stop);
    box.addEventListener("pointercancel", stop);
    box.addEventListener("keydown", function (e) {
      var k = e.key, i = TN.sel;
      if (k === "ArrowLeft" || k === "ArrowDown") i--;
      else if (k === "ArrowRight" || k === "ArrowUp") i++;
      else if (k === "Home") i = 0;
      else if (k === "End") i = TN.per.length - 1;
      else return;
      e.preventDefault();
      tnPick(i);
    });
    if (window.ResizeObserver) { TN.ro = new ResizeObserver(function () { tnDraw(); }); TN.ro.observe(box); }
    tnDraw();
  }
