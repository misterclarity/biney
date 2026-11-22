  /* ------------------------------- scenes -------------------------------
     Scenes to watch, from the brain-wave guide's "Vision: what you look at": drifting clouds, rippling water
     with glints of light, leaves swaying on a branch, a misty forest ridge, fractal ridgelines, flowers and
     a fire. Each is drawn on the device as it goes, with nothing downloaded: gradients and paths on a canvas,
     30 frames a second through the same loops as the other visuals, with no blurred shadows. Each moves
     slowly by itself (soft fascination: slow, gentle movement, nothing busy), and on Breathe one part of it
     follows the breath: the sun rises, the moon's path on the water lengthens, the branch lifts, the mist
     rises, the light behind the ridges grows, the flowers open, the flames rise, all as you breathe in.
     With reduced motion a scene is still; on Breathe only its light follows the breath.
     The fire always comes with its crackle (one of the nature sounds, ambience.js), since the study that
     found a fire relaxing played it with its sound, and the same fire on mute had no consistent effect.

     Where they show: Breathe's visual Scene (BVIS.scene, with the scene in BC.scene); a practice's Options,
     Scene (P_OWN "scene": off, "mine" for one of the scenes you find restful, or one of them), which puts the
     scene in place of the orb, the still point and the glow, and paces its breath steps; and any step that
     asks for one: { vis: "scene" } shows the session's scene, { vis: "scene", scene: "fire" } that one. In
     Settings (#st-scenes) you pick the scenes you find restful (the compatibility principle: a setting
     restores best when it fits what you want), for "Yours" and for later features: scnMine(), scnPick(),
     scnSoundOf(id) (the nature sound that goes with a scene). They are new techniques: picking one opens
     the donation dialog until this device is unlocked, and a scene kept from before shows the usual visual.
  ------------------------------------------------------------------------------ */

  // id, chip name, its longer name (lists, the unlock dialog), evidence dots, the nature sound that suits it,
  // what moves with the breath on Breathe, and what the guide says of its evidence
  var SCN_LIST = [
    { id: "clouds", name: "Clouds", long: "Drifting clouds", dots: 2, sound: "wind",
      hint: "Clouds drift across a dusk sky. The sun rises as you breathe in and sinks as you breathe out." },
    { id: "water", name: "Water", long: "Rippling water", dots: 2, sound: "stream",
      hint: "Ripples cross the water with glints of moonlight. The moon lifts and its path on the water grows as you breathe in, and settles as you breathe out." },
    { id: "leaves", name: "Leaves", long: "Swaying leaves", dots: 2, sound: "wind",
      hint: "Leaves sway on a branch in a breeze. The branch lifts as you breathe in and sinks as you breathe out, and the light behind it brightens." },
    { id: "forest", name: "Forest", long: "A misty forest", dots: 2, sound: "birds",
      hint: "Ridges of pines with mist drifting between them. The mist rises as you breathe in and settles as you breathe out." },
    { id: "fractal", name: "Fractal", long: "Fractal ridgelines", dots: 1, sound: "",
      hint: "Ridgelines as rough as natural skylines, a fractal of mid complexity, drifting slowly. The light behind them rises as you breathe in and fades as you breathe out." },
    { id: "flowers", name: "Flowers", long: "Flowers", dots: 1, sound: "birds",
      hint: "Flowers nodding in a breeze. They open as you breathe in and close a little as you breathe out. The studies used real flowers; flowers on a screen haven't been tested." },
    { id: "fire", name: "Fire", long: "A fire to watch", dots: 2, sound: "fire",
      hint: "A fire with embers rising, and its crackle while you breathe. The flames rise as you breathe in and settle as you breathe out." }
  ];
  var SCN_NAME = "Scenes to watch";                 // Settings' list, search, the dialog from a choice that isn't one scene
  var SCN_NOTE = "A scene in place of the orb, moving slowly; on breath steps it moves with your breath. Yours is one of the scenes you find restful, in Settings.";
  var SCN_H = 0.6;                                  // the fractal's roughness (Hurst exponent): a dimension of 2 − 0.6 = 1.4 by construction
  var SCN_LAM = 1.9;                                // each octave of the ridgeline this much finer than the last
  // mine: the scenes you find restful (none picked: all of them); spr: drawings made once and reused
  var SCN = { mine: [], spr: {}, nspr: 0 };

  function scnGet(id) { for (var i = 0; i < SCN_LIST.length; i++) if (SCN_LIST[i].id === id) return SCN_LIST[i]; return null; }
  // the scenes you find restful, in the list's order; all of them until you pick
  function scnMine() {
    var m = SCN_LIST.map(function (x) { return x.id; }).filter(function (id) { return SCN.mine.indexOf(id) >= 0; });
    return m.length ? m : SCN_LIST.map(function (x) { return x.id; });
  }
  // one of them, for a session: a different one each day, in turn (n: a number of your own instead of the day)
  function scnPick(n) {
    var m = scnMine(), k = typeof n === "number" ? n : Math.floor((Date.now() - new Date().getTimezoneOffset() * 6e4) / 864e5);
    return m[((k % m.length) + m.length) % m.length];
  }
  // the nature sound that suits a scene ("" for none): the fire's crackle always plays with the fire
  function scnSoundOf(id) { var x = scnGet(id); return x ? x.sound : ""; }
  function scnMineSet(list) {
    SCN.mine = SCN_LIST.map(function (x) { return x.id; }).filter(function (id) { return list.indexOf(id) >= 0; });
    if (SCN.mine.length) store.set("scenes", SCN.mine.join(",")); else storeDel("scenes");
  }

  /* ----- drawing helpers ----- */
  // a smooth wander between -1 and 1: three slow sines that never line up
  function scnWob(t, a) { return (Math.sin(t + a) + 0.6 * Math.sin(t * 1.618 + a * 2.3) + 0.35 * Math.sin(t * 2.718 + a * 0.7)) / 1.95; }
  function scnMix(h1, h2, f) {
    var a = parseInt(h1.slice(1), 16), b = parseInt(h2.slice(1), 16), out = "#";
    [16, 8, 0].forEach(function (s) {
      var v = Math.round(((a >> s) & 255) * (1 - f) + ((b >> s) & 255) * f);
      out += (v < 16 ? "0" : "") + v.toString(16);
    });
    return out;
  }
  function scnSky(c, W, H, stops) {
    var g = c.createLinearGradient(0, 0, 0, H);
    stops.forEach(function (s) { g.addColorStop(s[0], s[1]); });
    c.fillStyle = g; c.fillRect(0, 0, W, H);
  }
  // a soft light: a radial gradient fading out from its centre
  function scnGlow(c, x, y, r, col, a) {
    if (r <= 0 || a <= 0) return;
    var g = c.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, rgba(col, a)); g.addColorStop(0.35, rgba(col, a * 0.45)); g.addColorStop(1, rgba(col, 0));
    c.fillStyle = g; c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill();
  }
  // a drawing made once (a cloud, a band of mist) and reused every frame
  function scnSprite(key, w, h, fn) {
    if (SCN.spr[key]) return SCN.spr[key];
    if (SCN.nspr > 24) { SCN.spr = {}; SCN.nspr = 0; }
    var cv = document.createElement("canvas");
    cv.width = w; cv.height = h;
    var x = cv.getContext && cv.getContext("2d");
    if (!x) return null;
    fn(x, w, h);
    SCN.nspr++;
    return (SCN.spr[key] = cv);
  }
  function scnRound(c, W, H, r) {
    c.beginPath();
    c.moveTo(r, 0); c.arcTo(W, 0, W, H, r); c.arcTo(W, H, 0, H, r); c.arcTo(0, H, 0, 0, r); c.arcTo(0, 0, W, 0, r);
    c.closePath();
  }

  /* ----- the scenes. Each is drawn from (W, H, T, L, G): T the time in seconds, L the breath's level for the
     light (0 empty to 1 full) and G the same for what moves with it. With reduced motion T and G stay put. ----- */
  function scnCloudSprite(v) {
    return scnSprite("cloud" + v, 512, 240, function (x, w, h) {
      var r = amRand(41 + v * 7);
      for (var i = 0; i < 11; i++) {
        var px = w * (0.16 + 0.68 * r()), dome = Math.sin(Math.PI * px / w), py = h * (0.66 - 0.28 * dome + 0.08 * r()), pr = h * (0.16 + 0.2 * dome + 0.08 * r());
        var g = x.createRadialGradient(px, py, 0, px, py, pr);
        g.addColorStop(0, "rgba(255,255,255,0.95)"); g.addColorStop(0.62, "rgba(255,255,255,0.8)"); g.addColorStop(0.85, "rgba(255,255,255,0.3)"); g.addColorStop(1, "rgba(255,255,255,0)");
        x.fillStyle = g; x.beginPath(); x.arc(px, py, pr, 0, Math.PI * 2); x.fill();
      }
      x.globalCompositeOperation = "source-atop";              // lit from above, shadowed beneath
      var s = x.createLinearGradient(0, 0, 0, h);
      s.addColorStop(0, "#f4e9e4"); s.addColorStop(0.5, "#c9c8de"); s.addColorStop(1, "#7f7fa6");
      x.fillStyle = s; x.fillRect(0, 0, w, h);
    });
  }
  function scnClouds(c, W, H, T, L, G) {
    var u = Math.min(W, H);
    scnSky(c, W, H, [[0, "#16223f"], [0.5, "#2e3d68"], [0.82, "#6a5f86"], [1, "#a07a86"]]);
    // the sun, low in a dusk sky: it rises as you breathe in and sinks as you breathe out
    var sx = W * 0.5, sy = H * (0.84 - 0.32 * G), sr = u * (0.07 + 0.02 * L);
    scnGlow(c, sx, sy, sr * 5, "#f6c48c", 0.12 + 0.2 * L);
    scnGlow(c, sx, sy, sr * 1.25, "#fff0cf", 0.55 + 0.35 * L);
    for (var layer = 0; layer < 3; layer++) {
      var r = amRand(70 + layer), n = 3 + (layer === 1 ? 1 : 0);
      for (var i = 0; i < n; i++) {
        var w = W * (0.3 + 0.14 * layer) * (0.75 + 0.5 * r()), h = w * 0.47, span = W + w * 1.2;
        var x = (r() * span + (3 + 4.5 * layer) * (W / 400) * T) % span - w * 1.1, y = H * (0.03 + 0.12 * layer + 0.09 * r()) - h * 0.25;
        var spr = scnCloudSprite(Math.floor(r() * 3));
        c.globalAlpha = 0.34 + 0.2 * layer + 0.1 * L;
        if (spr) c.drawImage(spr, x, y, w, h);
      }
    }
    c.globalAlpha = 1;
    // a dark line of hills to stand on
    c.fillStyle = "#121a2e";
    c.beginPath(); c.moveTo(0, H);
    for (var hx = 0; hx <= W + 8; hx += 8) c.lineTo(hx, H * (0.9 - 0.035 * Math.sin(hx / W * 5.3 + 1) - 0.02 * Math.sin(hx / W * 13 + 2)));
    c.lineTo(W, H); c.closePath(); c.fill();
  }
  function scnWater(c, W, H, T, L, G) {
    var hy = H * 0.42, u = Math.min(W, H), j, k;
    scnSky(c, W, H, [[0, "#141d3a"], [0.3, "#2b3763"], [0.42, "#6a6189"], [0.43, "#26315a"], [1, "#0c1328"]]);
    // the moon lifts a little as you breathe in, and its path on the water lengthens and brightens
    var mx = W * 0.62, my = hy - H * (0.08 + 0.14 * G), mr = u * 0.045;
    scnGlow(c, mx, my, mr * 6, "#f3e2c0", 0.1 + 0.16 * L);
    scnGlow(c, mx, my, mr * 1.3, "#fff5dc", 0.7 + 0.25 * L);
    // a far shore
    c.fillStyle = "#151b33";
    c.beginPath(); c.moveTo(0, hy + 1);
    for (var sx = 0; sx <= W + 6; sx += 6) c.lineTo(sx, hy - H * (0.012 + 0.03 * Math.max(0, Math.sin(sx / W * 4.1 + 0.6)) + 0.008 * Math.sin(sx / W * 17)));
    c.lineTo(W, hy + 1); c.closePath(); c.fill();
    // ripples, closer and wider towards you, drifting slowly
    var rows = 28;
    c.lineWidth = 1;
    for (j = 1; j <= rows; j++) {
      var f = j / rows, y = hy + (H - hy) * Math.pow(f, 1.6), amp = 0.6 + 3.2 * f, kx = 0.05 / (0.4 + f);
      c.strokeStyle = rgba("#9db3e0", 0.05 + 0.07 * f);
      c.beginPath();
      for (var x = 0; x <= W; x += 10) {
        var yy = y + amp * Math.sin(x * kx + T * (0.5 + 0.4 * f) + j * 1.7);
        if (x === 0) c.moveTo(x, yy); else c.lineTo(x, yy);
      }
      c.stroke();
    }
    // the glints on the moon's path: short dashes that come and go
    var reach = 0.45 + 0.55 * L, rr = amRand(91);
    for (j = 0; j < 34; j++) {
      var d = j / 34, gy = hy + 3 + (H - hy - 3) * Math.pow(d, 1.5);
      for (k = 0; k < 3; k++) {
        var a1 = rr(), a2 = rr(), a3 = rr();
        if (d > reach) continue;
        var spread = W * (0.03 + 0.16 * d), gx = mx + (a1 - 0.5) * 2 * spread + Math.sin(T * 0.8 + j * 0.9 + k) * 4 * d;
        var tw = 0.5 + 0.5 * Math.sin(T * (1.1 + a2 * 1.4) + a3 * 12), gw = (3 + 16 * d) * (0.5 + a2);
        c.fillStyle = rgba("#ffeec8", (0.12 + 0.55 * tw) * (1 - d / reach * 0.7) * (0.55 + 0.45 * L));
        c.fillRect(gx - gw / 2, gy, gw, 1 + d * 1.5);
      }
    }
  }
  function scnLeaf(c, len, wid, col, tip) {
    var g = c.createLinearGradient(0, 0, len, 0);
    g.addColorStop(0, col); g.addColorStop(1, tip);
    c.fillStyle = g;
    c.beginPath(); c.moveTo(0, 0);
    c.bezierCurveTo(len * 0.3, -wid, len * 0.72, -wid * 0.8, len, 0);
    c.bezierCurveTo(len * 0.72, wid * 0.8, len * 0.3, wid, 0, 0);
    c.fill();
    c.strokeStyle = "rgba(200,232,190,0.22)"; c.lineWidth = 0.8;
    c.beginPath(); c.moveTo(len * 0.04, 0); c.lineTo(len * 0.9, 0); c.stroke();
  }
  // a branch from (bx, by) towards angle a0, its leaves in pairs, swaying by sw and lifted by up
  function scnBranch(c, bx, by, len, a0, sw, up, n, seed, T, m, dark) {
    var r = amRand(seed), lw = len / n;
    c.save();
    c.translate(bx, by); c.rotate(a0 + sw - up);
    c.strokeStyle = dark ? "#1c2a20" : "#3a3326"; c.lineCap = "round";
    c.lineWidth = Math.max(2, len * 0.014);
    c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(len * 0.5, len * 0.05, len, len * 0.02); c.stroke();
    for (var i = 1; i <= n; i++) {
      var p = i / (n + 0.4), x = len * p, y = len * 0.05 * Math.sin(Math.PI * p) * 0.9;
      for (var s = -1; s <= 1; s += 2) {
        var a1 = r(), a2 = r(), fl = m * 0.16 * Math.sin(T * (0.9 + 0.5 * a1) + a2 * 6.3);
        c.save();
        c.translate(x, y); c.rotate(s * (0.75 + 0.25 * a1) + fl + 0.15);
        scnLeaf(c, lw * (1.5 + 0.5 * a2) * (1.1 - 0.4 * p), lw * 0.34, dark ? "#1f3d2b" : "#2e6b40", dark ? "#2e5a3a" : "#7cbf72");
        c.restore();
      }
    }
    c.restore();
  }
  function scnLeaves(c, W, H, T, L, G, m) {
    var u = Math.min(W, H);
    scnSky(c, W, H, [[0, "#132622"], [0.6, "#1b3a2e"], [1, "#0f1d18"]]);
    // light through the leaves, brightening as you breathe in
    scnGlow(c, W * 0.32, H * 0.3, u * 0.95, "#e7efb2", 0.08 + 0.17 * L);
    var r = amRand(55), i;
    for (i = 0; i < 8; i++) {
      var bx = W * r() + Math.sin(T * 0.08 + i) * W * 0.03, by = H * r(), br = u * (0.05 + 0.08 * r());
      scnGlow(c, bx, by, br, i % 2 ? "#a9d89f" : "#f0e6a8", (0.05 + 0.06 * r()) * (0.7 + 0.6 * L));
    }
    var sway = m * (0.045 * Math.sin(T * 0.35) + 0.02 * Math.sin(T * 0.83 + 1)), up = (G - 0.5) * 0.16;
    scnBranch(c, -W * 0.05, H * 0.16, W * 0.75, 0.34, -sway * 0.6, up * 0.5, 7, 12, T, m, true);   // a darker branch further back
    scnBranch(c, W * 1.04, -H * 0.02, Math.max(W, H) * 0.95, Math.PI - 0.62, sway, -up, 9, 31, T + 3, m, false);
  }
  function scnForest(c, W, H, T, L, G) {
    scnSky(c, W, H, [[0, "#1a2442"], [0.45, "#3d4f72"], [0.62, "#8b93a9"], [1, "#2a3a3a"]]);
    scnGlow(c, W * 0.7, H * 0.4, Math.min(W, H) * 0.6, "#f1e3c4", 0.08 + 0.12 * L);
    var lift = (G - 0.5) * H * 0.08;
    for (var i = 0; i < 4; i++) {
      var r = amRand(200 + i), p1 = r() * 6.3, p2 = r() * 6.3, base = H * (0.47 + 0.135 * i);
      var col = scnMix("#8790a8", "#0f1c17", i / 3), step = 6 + 5 * i, th = 9 + 9 * i;
      var ridge = function (x) { return base - H * (0.045 + 0.01 * i) * (Math.sin(x / W * 2.2 + p1) + 0.45 * Math.sin(x / W * 5.1 + p2)); };
      c.fillStyle = col;
      c.beginPath(); c.moveTo(0, H);
      for (var x = 0; x <= W + 6; x += 6) c.lineTo(x, ridge(x));
      c.lineTo(W, H); c.closePath(); c.fill();
      c.beginPath();                                       // pines along the ridge
      for (var tx = -step * r(); tx < W + step; tx += step * (0.45 + 1.2 * r())) {
        var ty = ridge(tx) + 2, h = th * (0.5 + 0.9 * r()), w = h * (0.17 + 0.12 * r());
        c.moveTo(tx - w, ty); c.lineTo(tx, ty - h); c.lineTo(tx + w, ty); c.closePath();
      }
      c.fill();
      // mist in front of this ridge: it drifts, and rises and thickens as you breathe in
      var mist = scnSprite("mist", 512, 64, function (x, w, h) {
        var q = amRand(17);
        for (var k = 0; k < 9; k++) {
          var mx = w * q(), mr = w * (0.12 + 0.1 * q());
          for (var wrap = -1; wrap <= 1; wrap++) {           // drawn again a width either side, so the band joins up as it repeats
            x.save(); x.translate(mx + wrap * w, h / 2); x.scale(1, h / (2 * mr));
            var g = x.createRadialGradient(0, 0, 0, 0, 0, mr);
            g.addColorStop(0, "rgba(214,222,236,0.85)"); g.addColorStop(1, "rgba(214,222,236,0)");
            x.fillStyle = g; x.beginPath(); x.arc(0, 0, mr, 0, Math.PI * 2); x.fill(); x.restore();
          }
        }
      });
      if (mist && i < 3) {
        var mw = W * 1.6, mh = H * (0.08 + 0.03 * i), off = (T * (3 + 2 * i) * (W / 400) + r() * mw) % mw, my = base + H * 0.03 - mh / 2 - lift;
        c.globalAlpha = 0.16 + 0.1 * i + 0.16 * L;
        c.drawImage(mist, off - mw, my, mw, mh); c.drawImage(mist, off, my, mw, mh);
        c.globalAlpha = 1;
      }
    }
  }
  /* The fractal: Weierstrass-Mandelbrot ridgelines, sums of sines each SCN_LAM times finer and SCN_LAM^-H as
     tall, down to a pixel. Such a curve has a fractal dimension of 2 − H: 1.4 here, the middle of the 1.3 to 1.5
     found in natural scenery (box counting over the few octaves a screen shows gives a little less). */
  function scnRidge(i, W) {
    var r = amRand(300 + i), oct = [];
    for (var n = 0, w = 1.3 * W; w >= 1 && n < 14; n++, w /= SCN_LAM) oct.push([2 * Math.PI / w, Math.pow(SCN_LAM, -n * SCN_H), r() * 6.2832]);
    return function (x) {
      var s = 0;
      for (var j = 0; j < oct.length; j++) s += oct[j][1] * Math.sin(oct[j][0] * x + oct[j][2]);
      return s;
    };
  }
  function scnFractal(c, W, H, T, L, G) {
    scnSky(c, W, H, [[0, "#120f2b"], [0.45, "#2b2452"], [0.7, "#5d4a7a"], [1, "#2a2140"]]);
    // a dawn light behind the ridges: it rises and grows as you breathe in
    scnGlow(c, W * 0.38, H * (0.62 - 0.14 * G), Math.min(W, H) * (0.5 + 0.2 * L), "#f2b79c", 0.14 + 0.24 * L);
    var amp = [0.05, 0.065, 0.085, 0.11], cols = ["#7064a0", "#4d437c", "#312a5a", "#1a1636"], v = [1.5, 2.5, 4, 6];
    if (!SCN.ridge || SCN.ridge.W !== Math.round(W)) SCN.ridge = { W: Math.round(W), f: [0, 1, 2, 3].map(function (i) { return scnRidge(i, Math.round(W)); }) };
    for (var i = 0; i < 4; i++) {
      var f = SCN.ridge.f[i], base = H * (0.42 + 0.15 * i), A = Math.min(W, H * 1.3) * amp[i], sh = v[i] * T;
      c.fillStyle = cols[i];
      c.beginPath(); c.moveTo(0, H);
      for (var x = 0; x <= W + 1; x += 1) c.lineTo(x, base - A * f(x + sh));
      c.lineTo(W, H); c.closePath(); c.fill();
    }
  }
  function scnFlower(c, x, y, R, open, col, tip, tilt, spin) {
    c.save();
    c.translate(x, y); c.scale(1, tilt); c.rotate(spin);
    var n = 8, len = R * (0.62 + 0.38 * open), wid = R * (0.2 + 0.1 * open);
    for (var i = 0; i < n; i++) {
      c.save(); c.rotate(i * Math.PI * 2 / n);
      var g = c.createLinearGradient(0, 0, len, 0);
      g.addColorStop(0, col); g.addColorStop(1, tip);
      c.fillStyle = g;
      c.beginPath(); c.moveTo(R * 0.12, 0);
      c.bezierCurveTo(len * 0.4, -wid, len * 0.95, -wid * 0.8, len, 0);
      c.bezierCurveTo(len * 0.95, wid * 0.8, len * 0.4, wid, R * 0.12, 0);
      c.fill(); c.restore();
    }
    var cg = c.createRadialGradient(0, 0, 0, 0, 0, R * 0.22);
    cg.addColorStop(0, "#ffd86b"); cg.addColorStop(0.7, "#e0a83a"); cg.addColorStop(1, "#8a5a1e");
    c.fillStyle = cg; c.beginPath(); c.arc(0, 0, R * 0.22, 0, Math.PI * 2); c.fill();
    c.restore();
  }
  function scnFlowers(c, W, H, T, L, G, m) {
    var u = Math.min(W, H), r = amRand(77), i;
    scnSky(c, W, H, [[0, "#14231f"], [0.55, "#1e3526"], [1, "#0e1813"]]);
    scnGlow(c, W * 0.5, H * 0.42, u * 0.8, "#f6e7c8", 0.07 + 0.16 * L);
    for (i = 0; i < 6; i++) scnGlow(c, W * r(), H * r() * 0.7, u * (0.04 + 0.06 * r()), "#b7dca5", 0.05 + 0.04 * r());
    // long leaves from the ground
    c.fillStyle = "#1f4a2c";
    for (i = 0; i < 9; i++) {
      var lx = W * (i + 0.5) / 9 + (r() - 0.5) * 20, lh = H * (0.18 + 0.2 * r()), lean = (r() - 0.5) * 0.6 + m * 0.04 * Math.sin(T * 0.5 + i);
      c.beginPath(); c.moveTo(lx - 5, H + 2);
      c.quadraticCurveTo(lx + lh * lean * 0.5, H - lh * 0.6, lx + lh * lean, H - lh);
      c.quadraticCurveTo(lx + lh * lean * 0.3, H - lh * 0.5, lx + 5, H + 2); c.fill();
    }
    var cols = [["#d77fa1", "#f6c3d6"], ["#e9e1ef", "#ffffff"], ["#e99a6c", "#f8d0b0"], ["#a985d6", "#dcc8f4"], ["#d77fa1", "#f8d6e3"], ["#e9e1ef", "#fbf3dc"]];
    var open = 0.25 + 0.75 * G;
    for (i = 0; i < 6; i++) {
      var bx = W * (0.1 + 0.8 * (i + 0.5) / 6) + (r() - 0.5) * W * 0.06, hy = H * (0.28 + 0.34 * r()), R = u * (0.07 + 0.035 * r());
      var sw = m * W * 0.018 * Math.sin(T * (0.45 + 0.15 * r()) + i * 1.3), hx = bx + sw + (r() - 0.5) * W * 0.06;
      c.strokeStyle = "#2f5e35"; c.lineWidth = Math.max(1.5, u * 0.008);
      c.beginPath(); c.moveTo(bx, H + 2); c.quadraticCurveTo(bx + sw * 0.2, (H + hy) / 2, hx, hy); c.stroke();
      scnFlower(c, hx, hy, R, open, cols[i][0], cols[i][1], 0.6 + 0.35 * r(), r() * 3 + m * 0.05 * Math.sin(T * 0.3 + i));
    }
  }
  function scnFire(c, W, H, T, L, G) {
    var u = Math.min(W, H), cx = W / 2, by = H * 0.8, fw = u * 0.46, hmax = u * 0.55, i, r;
    scnSky(c, W, H, [[0, "#06070d"], [0.7, "#0e0c12"], [1, "#16100c"]]);
    var fl = 0.5 + 0.5 * scnWob(T * 2.1, 0.3);
    scnGlow(c, cx, by - hmax * 0.2, u * 1.0, "#ff8a3d", 0.1 + 0.05 * fl + 0.12 * L);   // the room lit by the fire
    // the hearth and two logs, their edges glowing
    c.fillStyle = "#18110d";
    c.beginPath(); c.ellipse(cx, by + u * 0.06, fw * 0.9, u * 0.07, 0, 0, Math.PI * 2); c.fill();
    [[-1, 0.18], [1, -0.18]].forEach(function (lg) {
      c.save(); c.translate(cx, by + u * 0.02); c.rotate(lg[1]);
      c.fillStyle = "#3a2618"; c.fillRect(-fw * 0.55, -u * 0.035, fw * 1.1, u * 0.07);
      var eg = c.createLinearGradient(0, -u * 0.035, 0, u * 0.01);
      eg.addColorStop(0, rgba("#ff7a2a", 0.5 + 0.3 * fl)); eg.addColorStop(1, "rgba(255,122,42,0)");
      c.fillStyle = eg; c.fillRect(-fw * 0.5, -u * 0.035, fw, u * 0.045);
      c.restore();
    });
    // the flames, added to each other's light: they rise as you breathe in and settle as you breathe out
    c.globalCompositeOperation = "lighter";
    c.save(); c.translate(cx, by); c.scale(1, 0.28);                  // the bed of embers the flames rise from
    scnGlow(c, 0, 0, fw * 0.62, "#ff9a3c", 0.45 + 0.15 * fl);
    c.restore();
    var rise = 0.72 + 0.4 * G;
    for (var pass = 0; pass < 2; pass++) {
      r = amRand(500 + pass);
      var n = pass ? 4 : 7;
      for (i = 0; i < n; i++) {
        var a1 = r(), a2 = r(), a3 = r();
        var x0 = cx + (i - (n - 1) / 2) * fw * (pass ? 0.18 : 0.15) + (a1 - 0.5) * fw * 0.06;
        var h = hmax * (pass ? 0.45 : 0.6 + 0.4 * a2) * (1 - Math.abs(i - (n - 1) / 2) / n * 0.9) * rise * (1 + 0.13 * scnWob(T * (1.9 + a3), i * 2.1 + pass));
        var w = fw * (pass ? 0.14 : 0.2 + 0.08 * a3), dx = w * 0.7 * scnWob(T * (1.4 + a1), i * 3.3 + pass * 5);
        var g = c.createLinearGradient(0, by, 0, by - h);
        if (pass) { g.addColorStop(0, "rgba(255,250,225,0.85)"); g.addColorStop(0.5, "rgba(255,214,140,0.5)"); g.addColorStop(1, "rgba(255,180,80,0)"); }
        else { g.addColorStop(0, "rgba(255,200,110,0.75)"); g.addColorStop(0.35, "rgba(255,135,45,0.55)"); g.addColorStop(0.75, "rgba(220,70,25,0.25)"); g.addColorStop(1, "rgba(180,40,20,0)"); }
        c.fillStyle = g;
        c.beginPath(); c.moveTo(x0 - w / 2, by);
        c.bezierCurveTo(x0 - w * 0.6, by - h * 0.45, x0 + dx * 0.4 - w * 0.15, by - h * 0.75, x0 + dx, by - h);
        c.bezierCurveTo(x0 + dx * 0.4 + w * 0.15, by - h * 0.75, x0 + w * 0.6, by - h * 0.45, x0 + w / 2, by);
        c.closePath(); c.fill();
      }
    }
    // embers rising and fading
    r = amRand(611);
    for (i = 0; i < 22; i++) {
      var life = 2.2 + 1.8 * r(), ph = ((T / life + r()) % 1 + 1) % 1, ex = cx + (r() - 0.5) * fw * 0.8, sway = Math.sin(T * 1.3 + r() * 6.3) * 10 * ph;
      var ey = by - hmax * 0.3 - ph * H * 0.55, tw = 0.6 + 0.4 * Math.sin(T * 9 + i * 7.7);
      c.fillStyle = rgba("#ffb867", Math.pow(1 - ph, 1.5) * tw * 0.9);
      c.beginPath(); c.arc(ex + sway, ey, 0.9 + 1.1 * r(), 0, Math.PI * 2); c.fill();
    }
    c.globalCompositeOperation = "source-over";
  }
  var SCN_PAINT = { clouds: scnClouds, water: scnWater, leaves: scnLeaves, forest: scnForest, fractal: scnFractal, flowers: scnFlowers, fire: scnFire };

  /* Draw a scene over the whole of (0, 0, W, H). t: seconds, for what moves by itself; lv: the breath's level
     (0 to 1) when it follows a breath, or null. With reduced motion nothing moves: time stands still, and only
     the light follows the breath. */
  function scnPaint(c, W, H, id, t, lv) {
    if (!c || !W || !H) return;
    var f = SCN_PAINT[id] || scnClouds, L = lv === null || lv === undefined ? 0.5 : Math.max(0, Math.min(1, lv));
    c.save();
    try {
      scnRound(c, W, H, 16); c.clip();
      f(c, W, H, RM ? 0 : t, L, RM ? 0.5 : L, RM ? 0 : 1);
    } finally { c.restore(); }
  }

  /* ----- Breathe: the visual Scene, which follows the breath ----- */
  // the visual Breathe draws: a scene, or the gaze point (eyes.js), kept from before shows the circle while this device is locked
  function bVisNow() { return (BC.visual === "scene" || BC.visual === "gaze") && !supOn() ? "circle" : BC.visual; }
  BVIS.scene = function (S) {
    if (!supOn()) { BVIS.circle(S); return; }
    scnPaint(d2, CW, CH, scnGet(BC.scene) ? BC.scene : "clouds", bNow(), S.live ? (S.lead ? 0 : S.level) : 0.45);
  };
  function scnHint() { var x = scnGet(BC.scene) || SCN_LIST[0]; return x.hint; }
  // the visual chips, the Scene chip's cup while locked, and the row of scenes while Scene is chosen
  function scnBreatheSync() {
    var v = bVisNow(), lab = document.querySelector('#bVis input[value="scene"]'), tag;
    checkRadio("bvis", v); syncChips("#bVis");
    if (lab) {
      lab = lab.parentNode; tag = lab.querySelector(".sup-tag");
      if (tag && supOn()) tag.parentNode.removeChild(tag);
      else if (!tag && !supOn()) lab.insertAdjacentHTML("beforeend", supTag(true));
    }
    var row = $("#bScn");
    if (!row) return;
    row.hidden = v !== "scene";
    checkRadio("bscn", scnGet(BC.scene) ? BC.scene : "clouds"); syncChips("#bScn");
  }
  // Scene picked under Visual: at once once this device is unlocked; otherwise the visual stays as it was and
  // the dialog opens, and if it unlocks the device the scene comes on
  function scnBreathePick(go) {
    if (supOn()) { go(); return; }
    scnBreatheSync();
    supGate(SCN_NAME, go, function (ok) { if (ok) go(); else scnBreatheSync(); });
  }

  /* ----- practices: Options, Scene ----- */
  var SCN_OPTS = [["off", "Off"], ["mine", "Yours"]].concat(SCN_LIST.map(function (x) { return [x.id, x.name]; }));
  function scnOptOk(k) { return k === "off" || k === "mine" || !!scnGet(k); }
  // what a practice's Options shows: off while this device is locked, whatever was kept
  function scnShown(k) { return supOn() && scnOptOk(k) ? k : "off"; }
  // a practice that shows no scene: a measurement or a call, where the fire's crackle would get in the way
  function scnFits(d) { return !!d && !d.noScene && !d.stress; }
  function scnSeg(id, cur) {
    return '<div class="mini-seg scn-seg" id="' + id + '" role="group" aria-label="Scene">' + SCN_OPTS.map(function (o) {
      return '<button type="button" data-scn="' + o[0] + '" aria-pressed="' + (o[0] === cur) + '">' + o[1] + (o[0] !== "off" ? supTag(true) : "") + "</button>";
    }).join("") + "</div>";
  }
  function scnRow(O) {
    return '<div class="so-row so-seg so-scn"><span class="so-l">Scene<small>' + SCN_NOTE + "</small></span>" + scnSeg("sOptScn", scnShown(O.scene)) + "</div>";
  }
  // a pick from a Scene row: off at once; a scene at once once unlocked, otherwise the dialog naming it
  function scnPickOpt(k, then) {
    if (!scnOptOk(k)) return;
    if (k === "off" || supOn()) { then(k); return; }
    var x = scnGet(k);
    supGate(x ? x.long : SCN_NAME, function () { then(k); }, function (ok) { if (ok) then(k); else scnUI(); });
  }
  function scnOptName(k) { return k === "mine" ? "Your scenes" : scnGet(k) ? scnGet(k).name : ""; }
  // at a practice's start: whether it shows a scene, and which (Yours: one of your restful scenes)
  function scnStart(d) {
    var k = P.opt.scene;
    P.scnOn = scnFits(d) && supOn() && scnOptOk(k) && k !== "off";
    P.scene = scnGet(k) ? k : scnPick();
    if (P.scnOn && P.scene === "fire") amNeed(["fire", "fireP"]);     // its crackle ready to play with it
  }
  // the scene the running practice shows in place of the orb, or ""
  function scnSes() { return P.scnOn && supOn() && pBusy() ? P.scene : ""; }
  function scnVis(s, v) { return scnSes() && (v === "orb" || v === "still" || v === "glow") ? "scene" : v; }
  function scnOf(s) { return s && scnGet(s.scene) ? s.scene : scnGet(P.scene) ? P.scene : scnMine()[0]; }
  function scnStep(c, W, Hh, s, T) {
    if (!supOn()) { pOrb(c, W, Hh, T, BCOL["b-in"], 1); return; }
    scnPaint(c, W, Hh, scnOf(s), T, null);
  }
  // the scene on screen while something runs, if it's the fire: its crackle plays with it (ambience.js)
  function scnSound() {
    if (!supOn()) return "";
    var id = "";
    if (P.state === "running") {
      var s = P.steps && P.steps[P.idx];
      if (s && s.k === "breath") id = P.usesB && BC.visual === "scene" ? BC.scene : "";
      else if (s && pVis(s) === "scene") id = scnOf(s);
    } else if (B.state === "running" && !P.usesB && BC.visual === "scene") id = BC.scene;
    return id === "fire" ? "fire" : "";
  }

  /* ----- Settings: the scenes you find restful ----- */
  function scnCard() {
    var mine = SCN.mine;
    return '<section class="st-card" id="st-scenes" aria-labelledby="stScn"><h2 id="stScn">Scenes</h2>' +
      '<p class="st-note">Scenes to watch while you breathe or practise, drawn on your device and moving slowly: clouds, water, leaves, a misty forest, ' +
        'fractal ridgelines, flowers and a fire. On Breathe, choose Scene under Visual, and the scene moves with your breath; in a practice, under Options. ' +
        '<a href="#l-scenes">What the research says</a></p>' +
      '<h3 class="sup-h" id="scnMineH">Scenes you find restful</h3>' +
      '<p class="st-note">A setting restores you best when it suits you, so pick the ones you like. Yours, in a practice, shows one of them, a different one each day.</p>' +
      '<div class="scn-grid" role="group" aria-labelledby="scnMineH">' + SCN_LIST.map(function (x) {
        return '<button type="button" class="scn-pick" data-scn-mine="' + x.id + '" aria-pressed="' + (mine.indexOf(x.id) >= 0) + '">' +
          '<canvas class="scn-thumb" data-scn-thumb="' + x.id + '" aria-hidden="true"></canvas><span class="scn-pn">' + x.name + supTag(true) + "</span>" + dots(x.dots) + "</button>";
      }).join("") + "</div>" +
      '<p class="st-note" id="scnMineTxt"></p>' +
      '<div class="so-row so-seg"><span class="so-l">In every practice<small>Your scenes in place of the orb, unless a practice keeps its own choice under Options.</small></span>' +
        '<div class="mini-seg scn-seg" id="stScnDef" role="group" aria-label="Scene in every practice">' + [["off", "Off"], ["mine", "Your scenes"]].map(function (o) {
          return '<button type="button" data-v="' + o[0] + '" aria-pressed="' + (scnShown(pOptDefaults().scene) === o[0]) + '">' + o[1] + (o[0] !== "off" ? supTag(true) : "") + "</button>";
        }).join("") + "</div></div>" +
      '<p class="st-note">Nature scenes, even on video, have raised alpha waves in studies; the fractal is promising, mostly from one lab; the flower studies used real flowers, ' +
        'so flowers on a screen haven\'t been tested; and the fire comes with its crackle, as in its study.</p>' +
      "</section>";
  }
  function scnMineTxt() {
    return SCN.mine.length ? "Yours: " + SCN.mine.map(function (id) { return scnGet(id).name.toLowerCase(); }).join(", ") + "."
      : "None picked yet, so Yours takes turns through all seven.";   // (a list after a colon stays in lower case)
  }
  // the little pictures on the Settings buttons: each scene, still, drawn once
  function scnThumbs() {
    var cs = document.querySelectorAll("[data-scn-thumb]"), dpr = Math.min(window.devicePixelRatio || 1, 2);
    for (var i = 0; i < cs.length; i++) {
      var cv = cs[i], r = cv.getBoundingClientRect(), w = r.width || 120, h = r.height || 72, x = cv.getContext && cv.getContext("2d");
      if (!x) continue;
      cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
      x.setTransform(dpr, 0, 0, dpr, 0, 0);
      scnPaint(x, w, h, cv.getAttribute("data-scn-thumb"), 40, 0.6);
    }
  }
  function scnStWire() {
    if (!$("#st-scenes")) return;
    bSetT("#scnMineTxt", scnMineTxt());
    scnThumbs();
    var g = $("#stScnDef");
    g.addEventListener("click", function (e) {
      var b = e.target.closest("button[data-v]"); if (!b) return;
      scnPickOpt(b.getAttribute("data-v"), function (k) { stDefault("scene", k); scnUI(); });
    });
  }
  // a restful scene on or off: picking one is using a new technique, so the dialog first while locked
  function scnMineToggle(id) {
    var x = scnGet(id);
    if (!x) return;
    var go = function () {
      scnMineSet(SCN.mine.indexOf(id) >= 0 ? SCN.mine.filter(function (k) { return k !== id; }) : SCN.mine.concat([id]));
      scnUI();
    };
    if (supOn()) go(); else supGate(x.long, go, function (ok) { if (ok) go(); });
  }
  // every Scene button in step: pressed, and the cup while locked (after an unlock too: supRefresh calls this)
  function scnUI() {
    var i, lock = !supOn(), bs = document.querySelectorAll("[data-scn], [data-scn-mine], #stScnDef button");
    for (i = 0; i < bs.length; i++) {
      var b = bs[i], k = b.getAttribute("data-scn") || b.getAttribute("data-v"), mineB = b.hasAttribute("data-scn-mine"), host = mineB ? b.querySelector(".scn-pn") : b, tag = host.querySelector(".sup-tag");
      if (mineB) b.setAttribute("aria-pressed", String(!lock && SCN.mine.indexOf(b.getAttribute("data-scn-mine")) >= 0));
      else if (b.closest("#stScnDef")) b.setAttribute("aria-pressed", String(scnShown(pOptDefaults().scene) === k));
      if (k === "off") continue;
      if (tag && !lock) tag.parentNode.removeChild(tag);
      else if (!tag && lock) host.insertAdjacentHTML("beforeend", supTag(true));
    }
    var opt = $("#sOptScn");
    if (opt && P.view) {
      var cur = scnShown(pBusy() && P.def !== P.view ? pOptsOf(P.view.id).scene : P.opt.scene), ob = opt.querySelectorAll("button");
      for (i = 0; i < ob.length; i++) ob[i].setAttribute("aria-pressed", String(ob[i].getAttribute("data-scn") === cur));
    }
    if ($("#scnMineTxt")) bSetT("#scnMineTxt", scnMineTxt());
    scnBreatheSync(); syncVisHint(); draw();
  }

  function scnInit() {
    SCN.mine = [];
    scnMineSet(String(store.get("scenes") || "").split(","));
    SUP_EXTRA.push({ name: SCN_NAME, href: "#st-scenes" });     // Settings' list of what the donation unlocks
    document.addEventListener("click", function (e) {
      var b = e.target.closest && e.target.closest("[data-scn-mine]");
      if (b) scnMineToggle(b.getAttribute("data-scn-mine"));
    });
    $("#bScn").addEventListener("change", function (e) {
      var id = e.target.value;
      scnBreathePick(function () {
        if (scnGet(id)) BC.scene = id;
        if (BC.visual !== "scene") BC.visual = "scene";
        scnBreatheSync(); syncVisHint(); draw(); saveBreath();
        if (id === "fire") amNeed(["fire", "fireP"]);
      });
    });
    scnUI();
    if (window.__entrain) {
      var X = window.__entrain;
      X.SCN = SCN; X.SCN_LIST = SCN_LIST; X.SCN_H = SCN_H; X.SCN_LAM = SCN_LAM; X.scnPaint = scnPaint; X.scnRidge = scnRidge; X.scnMine = scnMine; X.scnPick = scnPick;
      X.scnSoundOf = scnSoundOf; X.scnSound = scnSound; X.scnSes = scnSes; X.scnOf = scnOf; X.pVis = pVis; X.bVisNow = bVisNow; X.scnFits = scnFits;
    }
  }
