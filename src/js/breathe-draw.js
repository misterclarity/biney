  /* ----- drawing ----- */

  var bcv = $("#bCanvas"), d2 = bcv.getContext ? bcv.getContext("2d") : null, CW = 0, CH = 0;
  var BCOL = {}, BVIS = {};

  function readColors() {
    var cs = getComputedStyle(document.documentElement);
    ["text", "text-dim", "text-faint", "line", "bg", "b-in", "b-sip", "b-hold", "b-out", "hr"].forEach(function (k) {
      BCOL[k] = cs.getPropertyValue("--" + k).trim() || "#888888";
    });
  }
  function rgba(hex, a) {
    var h = hex.replace("#", "");
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    var n = parseInt(h, 16);
    return "rgba(" + ((n >> 16) & 255) + "," + ((n >> 8) & 255) + "," + (n & 255) + "," + a + ")";
  }
  function kc(k) {
    return k === "in" ? BCOL["b-in"] : k === "sip" ? BCOL["b-sip"] :
      (k === "hold" || k === "rest") ? BCOL["b-hold"] : k === "out" ? BCOL["b-out"] : BCOL["text-faint"];
  }
  function sizeCanvas() {
    if (!d2) return;
    var r = bcv.getBoundingClientRect();
    if (!r.width || !r.height) return;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    CW = r.width; CH = r.height;
    bcv.width = Math.round(CW * dpr);
    bcv.height = Math.round(CH * dpr);
    d2.setTransform(dpr, 0, 0, dpr, 0, 0);
    draw();
  }

  function frameState() {
    var live = B.state === "running" || B.state === "paused";
    var bt = live ? breathTime() : 0;
    if (live && bt >= 0) commitPending(bt);
    var S = { live: live, bt: bt, lead: live && bt < 0, L: null, level: 0, k: live ? "lead" : "idle", prog: 0, count: null };
    if (S.lead) {
      S.count = Math.ceil(-bt - 1e-6);
    } else {
      S.L = locate(Math.max(0, bt));
      if (live) {
        S.level = levelOf(S.L);
        S.k = S.L.p.k;
        S.prog = S.L.prog;
        S.count = Math.max(1, Math.ceil(S.L.p.secs * (1 - S.L.prog) - 1e-6));
      }
    }
    S.ph = S.L ? S.L.ph : B.ph;
    S.col = kc(S.k);
    return S;
  }

  function draw() {
    if (!d2 || !CW || !CH || !B.ph) return;
    var S = frameState();
    if ($("#v-breathe").hidden) { syncOrb(S); return; }    // a practice may be running it from elsewhere
    d2.clearRect(0, 0, CW, CH);
    d2.setLineDash([]);
    (BVIS[BC.visual] || BVIS.circle)(S);
    moveMark(S);
    syncOrb(S);
  }
  function moveMark(S) {
    var segs = $("#bSegs").children, on = -1, x = 0;
    if (S.live && !S.lead && S.L.ph === B.ph) {
      on = S.L.p.i;
      var el = segs[on];
      if (el) x = el.offsetLeft + el.offsetWidth * S.prog;
    }
    $("#bMark").style.transform = "translateX(" + x.toFixed(1) + "px)";
    if (on !== B.segOn) {
      for (var i = 0; i < segs.length; i++) segs[i].classList.toggle("on", i === on);
      B.segOn = on;
    }
  }
  /* The player's orb follows the guide while it runs. */
  function syncOrb(S) {
    var pl = $("#player"), core = pl.querySelector(".orb-core");
    if (S.live) {
      pl.classList.add("breath-sync");
      core.style.transform = "scale(" + (0.74 + 0.36 * S.level).toFixed(3) + ")";
      core.style.opacity = (0.3 + 0.5 * S.level).toFixed(3);
    } else if (pl.classList.contains("breath-sync")) {
      pl.classList.remove("breath-sync");
      core.style.transform = "";
      core.style.opacity = "";
    }
  }

  function bFont(w, px, mono) { d2.font = w + " " + px + "px " + (mono ? B_MONO : B_SANS); }
  function ring(x, y, r) { d2.beginPath(); d2.arc(x, y, r, 0, Math.PI * 2); d2.stroke(); }
  function disc(x, y, r) { d2.beginPath(); d2.arc(x, y, r, 0, Math.PI * 2); d2.fill(); }
  function line(x1, y1, x2, y2) { d2.beginPath(); d2.moveTo(x1, y1); d2.lineTo(x2, y2); d2.stroke(); }
  function rrect(x, y, w, h, r) {
    d2.beginPath();
    d2.moveTo(x + r, y);
    d2.arcTo(x + w, y, x + w, y + h, r);
    d2.arcTo(x + w, y + h, x, y + h, r);
    d2.arcTo(x, y + h, x, y, r);
    d2.arcTo(x, y, x + w, y, r);
    d2.closePath();
  }
  function label(txt, x, y, col, align, base, px, weight) {
    bFont(weight || "600", px || 12, false);
    d2.fillStyle = col;
    d2.textAlign = align || "center";
    d2.textBaseline = base || "middle";
    d2.fillText(txt, x, y);
  }
  function glowDot(x, y, r, col) {
    d2.save();
    d2.shadowColor = rgba(col, 0.9);
    d2.shadowBlur = 18;
    d2.fillStyle = col;
    disc(x, y, r);
    d2.restore();
    d2.fillStyle = BCOL.bg;
    disc(x, y, r * 0.38);
  }
  function rateText() { return (60 / B.ph.cycle).toFixed(1); }
  /* Centre readout: the phase countdown while live, the breathing rate at rest. */
  function centre(S, cx, cy, px) {
    d2.textAlign = "center";
    if (S.live) {
      bFont("600", Math.round(px), true);
      d2.fillStyle = BCOL.text;
      d2.textBaseline = "middle";
      d2.fillText(String(S.count), cx, cy + px * 0.04);
    } else {
      bFont("650", Math.round(px * 0.72), true);
      d2.fillStyle = BCOL.text;
      d2.textBaseline = "alphabetic";
      d2.fillText(rateText(), cx, cy + px * 0.1);
      label("breaths / min", cx, cy + px * 0.1 + 17, BCOL["text-dim"], "center", "alphabetic", 11.5, "500");
    }
  }

  /* 1. Circle: an orb between an inner (empty) and outer (full) guide ring. */
  BVIS.circle = function (S) {
    var cx = CW / 2, cy = CH / 2, R = Math.min(CW, CH) * 0.38, r0 = R * 0.36;
    var lv = S.live ? S.level : 0.42, col = S.live ? S.col : BCOL["b-in"];
    d2.lineWidth = 1;
    d2.strokeStyle = BCOL.line;
    ring(cx, cy, R);
    d2.setLineDash([3, 5]);
    d2.strokeStyle = rgba(BCOL["text-faint"], 0.55);
    ring(cx, cy, r0);
    d2.setLineDash([]);

    var r = r0 + (R - r0) * lv;
    var gr = d2.createRadialGradient(cx - r * 0.28, cy - r * 0.32, r * 0.08, cx, cy, r);
    gr.addColorStop(0, rgba(col, 0.6));
    gr.addColorStop(1, rgba(col, 0.1));
    d2.save();
    d2.shadowColor = rgba(col, 0.45);
    d2.shadowBlur = RM ? 0 : 20 + 34 * lv;
    d2.fillStyle = gr;
    disc(cx, cy, r);
    d2.restore();
    d2.lineWidth = 2;
    d2.strokeStyle = rgba(col, 0.9);
    ring(cx, cy, r);

    if (S.live && !S.lead && S.prog > 0) {
      d2.lineWidth = 3;
      d2.lineCap = "round";
      d2.strokeStyle = col;
      d2.beginPath();
      d2.arc(cx, cy, R + 9, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * S.prog);
      d2.stroke();
      d2.lineCap = "butt";
    }
    centre(S, cx, cy, Math.max(24, r0 * 0.95));
  };

  /* 2. Wave: lung level against time, scrolling past a fixed "now" marker. */
  function waveRun(xa, xb, bt, nowX, pps, Y, alpha, lw) {
    var runK = null, x = xa, tt, k, lv, y, L;
    d2.lineWidth = lw;
    d2.lineJoin = "round";
    d2.lineCap = "round";
    for (;;) {
      if (x > xb) x = xb;
      tt = bt + (x - nowX) / pps;
      if (tt < 0) { k = "lead"; lv = 0; } else { L = locate(tt); k = L.p.k; lv = levelOf(L); }
      y = Y(lv);
      if (k !== runK) {
        if (runK !== null) { d2.lineTo(x, y); d2.stroke(); }
        d2.beginPath();
        d2.strokeStyle = rgba(kc(k), alpha);
        d2.moveTo(x, y);
        runK = k;
      } else {
        d2.lineTo(x, y);
      }
      if (x >= xb) break;
      x += 2;
    }
    if (runK !== null) d2.stroke();
    d2.lineCap = "butt";
  }
  BVIS.wave = function (S) {
    var gx = 54, xr = CW - 10, top = 34, bot = CH - 48, bt = S.bt;
    // with a heart sensor, show more of what has happened so its response is visible
    var hrOn = S.live && B.hr.length > 1, win = Math.min(40, Math.max(hrOn ? 22 : 12, S.ph.cycle * (hrOn ? 2.6 : 1.8)));
    var pps = (xr - gx) / win, nowX = Math.round(gx + (xr - gx) * (hrOn ? 0.66 : 0.3));
    var Y = function (l) { return bot - l * (bot - top); };
    var X = function (t) { return nowX + (t - bt) * pps; };
    var x;

    d2.lineWidth = 1;
    d2.setLineDash([2, 6]);
    d2.strokeStyle = BCOL.line;
    line(gx, Y(1), xr, Y(1));
    line(gx, Y(0), xr, Y(0));
    d2.setLineDash([]);
    label("Full", gx - 10, Y(1), BCOL["text-faint"], "right", "middle", 11);
    label("Empty", gx - 10, Y(0), BCOL["text-faint"], "right", "middle", 11);

    // ruler of phases along the bottom
    var t0 = bt - (nowX - gx) / pps, t1 = bt + (xr - nowX) / pps, cur = Math.max(0, t0), guard = 0;
    while (cur < t1 && guard++ < 80) {
      var L = locate(cur + 1e-6), s = L.pStart, e = s + L.p.secs, xs = X(s), xe = X(e);
      if (xs >= gx) {
        d2.lineWidth = 1;
        d2.strokeStyle = rgba(BCOL["text-faint"], 0.5);
        line(xs, bot + 6, xs, bot + 16);
      }
      var a = Math.max(xs, gx), b = Math.min(xe, xr);
      if (b - a > 44) {
        label(B_KIND[L.p.k].short + " " + fmtS(L.p.secs), (a + b) / 2, bot + 29,
          rgba(kc(L.p.k), e > bt ? 0.9 : 0.4), "center", "middle", 11.5);
      }
      cur = e;
    }

    d2.save();
    d2.beginPath();
    d2.rect(gx, 0, xr - gx, CH);
    d2.clip();
    // soft fill under the part already breathed
    var fg = d2.createLinearGradient(0, top, 0, bot);
    fg.addColorStop(0, rgba(BCOL["b-in"], 0.16));
    fg.addColorStop(1, rgba(BCOL["b-in"], 0));
    d2.beginPath();
    d2.moveTo(gx, bot);
    for (x = gx; x < nowX; x += 2) d2.lineTo(x, Y(levelAt(bt + (x - nowX) / pps)));
    d2.lineTo(nowX, Y(levelAt(bt)));
    d2.lineTo(nowX, bot);
    d2.closePath();
    d2.fillStyle = fg;
    d2.fill();
    waveRun(nowX, xr, bt, nowX, pps, Y, 0.35, 2);     // what is coming
    waveRun(gx, nowX, bt, nowX, pps, Y, 1, 3);        // what you have breathed

    // heart rate over the same time axis, on its own scale fitted to the window
    var hrVis = S.live ? B.hr.filter(function (s) { return s.bt >= t0 - 2 && s.bt <= bt; }) : [];
    var hrLo = 0, hrHi = 0;
    if (hrVis.length > 1) {
      var mn = Infinity, mx = -Infinity;
      hrVis.forEach(function (s) { if (s.hr < mn) mn = s.hr; if (s.hr > mx) mx = s.hr; });
      var mid = (mn + mx) / 2, half = Math.max(5, (mx - mn) / 2 + 2);
      hrLo = mid - half; hrHi = mid + half;
      var YH = function (h) { return bot - (h - hrLo) / (hrHi - hrLo) * (bot - top); };
      d2.lineWidth = 2;
      d2.lineJoin = "round";
      d2.strokeStyle = rgba(BCOL.hr, 0.9);
      d2.beginPath();
      var prev = null;
      hrVis.forEach(function (s) {
        var hx = X(s.bt), hy = YH(s.hr);
        if (!prev || s.bt - prev.bt > 4) d2.moveTo(hx, hy); else d2.lineTo(hx, hy);
        prev = s;
      });
      d2.stroke();
    }
    d2.restore();
    if (hrVis.length > 1) {
      label(Math.round(hrHi) + " bpm", gx - 10, Y(1) + 16, rgba(BCOL.hr, 0.9), "right", "middle", 10.5);
      label(Math.round(hrLo) + " bpm", gx - 10, Y(0) - 16, rgba(BCOL.hr, 0.9), "right", "middle", 10.5);
      label("Heart rate", xr, 14, rgba(BCOL.hr, 0.9), "right", "middle", 11);
    }

    d2.lineWidth = 1;
    d2.strokeStyle = rgba(BCOL.text, 0.16);
    line(nowX, top - 18, nowX, bot + 2);
    var dy = Y(S.live ? S.level : 0);
    glowDot(nowX, dy, 7, S.live ? S.col : BCOL["b-in"]);
    if (S.live) {
      bFont("650", 14, true);
      d2.fillStyle = BCOL.text;
      d2.textAlign = "center";
      d2.textBaseline = "bottom";
      d2.fillText(String(S.count), nowX, dy - 13);
    }
  };

  /* 3. Box: a dot traces a square, one side per phase. */
  BVIS.box = function (S) {
    var s = Math.min(CW * 0.5, CH * 0.6), x0 = (CW - s) / 2, y0 = (CH - s) / 2;
    var d = { "in": 0, sip: 0, hold: 0, out: 0, rest: 0 };
    S.ph.list.forEach(function (p) { d[p.k] = p.secs; });
    var BL = [x0, y0 + s], TL = [x0, y0], TR = [x0 + s, y0], BR = [x0 + s, y0 + s];
    var sides = [
      { k: "in",   a: BL, b: TL, secs: d["in"] + d.sip, txt: "In " + fmtS(d["in"]) + (d.sip ? " + " + fmtS(d.sip) : "") },
      { k: "hold", a: TL, b: TR, secs: d.hold, txt: d.hold ? "Hold " + fmtS(d.hold) : "No hold" },
      { k: "out",  a: TR, b: BR, secs: d.out,  txt: "Out " + fmtS(d.out) },
      { k: "rest", a: BR, b: BL, secs: d.rest, txt: d.rest ? "Hold " + fmtS(d.rest) : "No hold" }
    ];
    var sipY = y0 + s - B_SIP * s;

    d2.lineCap = "round";
    d2.lineWidth = 4;
    sides.forEach(function (sd) {
      d2.setLineDash(sd.secs ? [] : [2, 8]);
      d2.strokeStyle = sd.secs ? rgba(kc(sd.k), 0.2) : rgba(BCOL["text-faint"], 0.4);
      line(sd.a[0], sd.a[1], sd.b[0], sd.b[1]);
    });
    d2.setLineDash([]);

    var pos = BL.slice();
    if (S.live && !S.lead) {
      var k = S.k, ci = (k === "in" || k === "sip") ? 0 : k === "hold" ? 1 : k === "out" ? 2 : 3;
      if (ci === 0) pos = [x0, y0 + s - S.level * s];
      else if (ci === 1) pos = [x0 + S.prog * s, y0];
      else if (ci === 2) pos = [x0 + s, y0 + (1 - S.level) * s];
      else pos = [x0 + s - S.prog * s, y0 + s];
      for (var i = 0; i < ci; i++) {
        if (!sides[i].secs) continue;
        if (i === 0 && d.sip) {
          d2.strokeStyle = kc("in"); line(x0, y0 + s, x0, sipY);
          d2.strokeStyle = kc("sip"); line(x0, sipY, x0, y0);
        } else {
          d2.strokeStyle = kc(sides[i].k);
          line(sides[i].a[0], sides[i].a[1], sides[i].b[0], sides[i].b[1]);
        }
      }
      if (k === "sip") {
        d2.strokeStyle = kc("in"); line(x0, y0 + s, x0, sipY);
        d2.strokeStyle = kc("sip"); line(x0, sipY, pos[0], pos[1]);
      } else {
        d2.strokeStyle = S.col;
        line(sides[ci].a[0], sides[ci].a[1], pos[0], pos[1]);
      }
    }
    d2.lineCap = "butt";

    d2.fillStyle = BCOL.line;
    [BL, TL, TR, BR].forEach(function (c) { disc(c[0], c[1], 3.5); });
    sides.forEach(function (sd, i) {
      var col = sd.secs ? rgba(kc(sd.k), 0.9) : BCOL["text-faint"];
      if (i === 0) label(sd.txt, x0 - 16, y0 + s / 2, col, "right", "middle", 12);
      else if (i === 1) label(sd.txt, x0 + s / 2, y0 - 14, col, "center", "bottom", 12);
      else if (i === 2) label(sd.txt, x0 + s + 16, y0 + s / 2, col, "left", "middle", 12);
      else label(sd.txt, x0 + s / 2, y0 + s + 14, col, "center", "top", 12);
    });
    glowDot(pos[0], pos[1], 8, S.live ? S.col : BCOL["b-in"]);
    centre(S, CW / 2, CH / 2, Math.max(24, s * 0.26));
  };

  /* 4. Dial: one lap is one breath, the ring split by phase duration. */
  BVIS.dial = function (S) {
    var cx = CW / 2, cy = CH / 2, P = S.ph, TAU = Math.PI * 2, a0 = -Math.PI / 2;
    // shrink the ring on narrow screens so the side labels stay inside the canvas
    bFont("600", 12, false);
    var labW = 0;
    P.list.forEach(function (p) { labW = Math.max(labW, d2.measureText(B_KIND[p.k].short + " " + fmtS(p.secs)).width); });
    var R = Math.max(48, Math.min(Math.min(CW, CH) * 0.32, CW / 2 - 26 - labW - 8));
    var ct = (S.live && !S.lead) ? S.L.ct : 0;
    var ang = function (t) { return a0 + TAU * t / P.cycle; };
    d2.lineCap = "butt";
    P.list.forEach(function (p) {
      var span = TAU * p.secs / P.cycle, gap = Math.min(0.035, span / 6);
      var s = ang(p.start) + gap, e = ang(p.start + p.secs) - gap;
      d2.lineWidth = 14;
      d2.strokeStyle = rgba(kc(p.k), 0.18);
      d2.beginPath(); d2.arc(cx, cy, R, s, e); d2.stroke();
      if (S.live && !S.lead && ct > p.start) {
        var pe = Math.min(e, ang(ct));
        if (pe > s) {
          d2.strokeStyle = kc(p.k);
          d2.beginPath(); d2.arc(cx, cy, R, s, pe); d2.stroke();
        }
      }
      var mid = ang(p.start + p.secs / 2), lr = R + 26, c = Math.cos(mid);
      label(B_KIND[p.k].short + " " + fmtS(p.secs), cx + c * lr, cy + Math.sin(mid) * lr,
        rgba(kc(p.k), 0.9), Math.abs(c) < 0.35 ? "center" : (c > 0 ? "left" : "right"), "middle", 12);
    });
    var lv = S.live ? S.level : 0.42, col = S.live ? S.col : BCOL["b-in"];
    var r = R * (0.34 + 0.3 * lv);
    d2.fillStyle = rgba(col, 0.14);
    disc(cx, cy, r);
    d2.lineWidth = 1.5;
    d2.strokeStyle = rgba(col, 0.6);
    ring(cx, cy, r);
    var ha = ang(ct);
    glowDot(cx + Math.cos(ha) * R, cy + Math.sin(ha) * R, 9, (S.live && !S.lead) ? S.col : BCOL.text);
    centre(S, cx, cy, Math.max(24, R * 0.4));
  };

  /* 5. Column: a capsule that fills like lungs, the countdown riding the surface. */
  BVIS.column = function (S) {
    var h = CH * 0.74, w = Math.max(64, Math.min(104, CW * 0.17));
    var x0 = CW / 2 - w / 2, y0 = (CH - h) / 2, rr = w / 2;
    var lv = S.live ? S.level : 0, col = S.live ? S.col : BCOL["b-in"];
    var hasSip = S.ph.list.some(function (p) { return p.k === "sip"; });

    d2.lineWidth = 1;
    d2.strokeStyle = rgba(BCOL["text-faint"], 0.6);
    for (var i = 0; i <= 4; i++) { var ty = y0 + h - (i / 4) * h; line(x0 - 16, ty, x0 - 6, ty); }
    label("Full", x0 - 22, y0, BCOL["text-faint"], "right", "middle", 11);
    label("Empty", x0 - 22, y0 + h, BCOL["text-faint"], "right", "middle", 11);

    d2.lineWidth = 2;
    d2.strokeStyle = BCOL.line;
    rrect(x0, y0, w, h, rr);
    d2.stroke();

    var sy = y0 + h - lv * h;
    if (lv > 0.002) {
      d2.save();
      rrect(x0 + 4, y0 + 4, w - 8, h - 8, rr - 4);
      d2.clip();
      var moving = S.k === "in" || S.k === "sip" || S.k === "out";
      var amp = RM ? 0 : (moving ? 2.4 : 0.8), tnow = bNow();
      var fg = d2.createLinearGradient(0, y0, 0, y0 + h);
      fg.addColorStop(0, rgba(col, 0.85));
      fg.addColorStop(1, rgba(col, 0.22));
      d2.fillStyle = fg;
      d2.beginPath();
      d2.moveTo(x0, y0 + h);
      for (var x = x0; x <= x0 + w + 0.1; x += 3) d2.lineTo(x, sy + Math.sin(x * 0.12 + tnow * 2.6) * amp);
      d2.lineTo(x0 + w, y0 + h);
      d2.closePath();
      d2.fill();
      d2.restore();
    }
    if (hasSip) {
      var sipY = y0 + h - B_SIP * h;
      d2.setLineDash([3, 4]);
      d2.lineWidth = 1;
      d2.strokeStyle = rgba(BCOL["b-sip"], 0.6);
      line(x0 + 5, sipY, x0 + w - 5, sipY);
      d2.setLineDash([]);
    }

    var tx = x0 + w + 22;
    if (S.live) {
      bFont("650", 30, true);
      d2.fillStyle = BCOL.text;
      d2.textAlign = "left";
      d2.textBaseline = "middle";
      d2.fillText(String(S.count), tx, Math.min(y0 + h - 14, Math.max(y0 + 14, sy)));
    } else {
      bFont("650", 26, true);
      d2.fillStyle = BCOL.text;
      d2.textAlign = "left";
      d2.textBaseline = "alphabetic";
      d2.fillText(rateText(), tx, CH / 2 + 4);
      label("breaths / min", tx, CH / 2 + 22, BCOL["text-dim"], "left", "alphabetic", 11.5, "500");
    }
  };

