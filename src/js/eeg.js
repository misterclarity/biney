  /* ------------------------- brain trends from a Muse headband -------------------------
     A Muse EEG headband (the Muse 2, the Muse S, the 2016 Muse) sends its four sensors' readings over
     Bluetooth: TP9 and TP10 behind the ears, AF7 and AF8 on the forehead, 256 samples a second each, in
     packets of twelve (12-bit values, 0.48828125 µV a step), as the open-source muse-js reads them. Only
     Chrome and Edge on Android and computers offer Bluetooth to a web page: no browser on iPhone does.

     Each second, the last two seconds from each sensor are split into their rhythms (a Hann window and
     the power in each half-hertz from 1 to 45 Hz), and alpha's share (8 to 12 Hz) and theta's (4 to 8 Hz)
     of everything from 1 to 30 Hz is taken; the sensors with a clean signal are averaged. A share rather
     than a size, so how well each sensor touches the skin matters less. A stretch is left out when it
     swings more than 150 µV from top to bottom (a blink, a frown, a movement) or carries the fast buzz of a
     tense jaw (more than 10 µV between 30 and 45 Hz); a sensor swinging more than 500 µV, or flat, is off
     the skin. A second counts when at least two sensors are clean.

     What it shows is a trend, never a state (Learn's "Measuring at home": a headband suits "alpha is
     rising", not "you are in theta"): the shares averaged over the last 25 seconds against your first
     minute of clean signal, rising or falling when they differ by more than 15%, steady otherwise. On the
     Heart page, beside a session's other numbers while a practice runs (P.eeg), and on its end screen.
     The eyes-open, eyes-closed check is the calibration: closing the eyes raises alpha within seconds, so
     a clear rise shows the headband is reading you, and how big a rise is yours (store "egCal").
     Brain-Led Beats (practice-data.js) moves a live beat with it, like Heart-Led Beats; its rule is
     Entrain's own. A new technique: connecting opens with a donation while this device is locked.
  ---------------------------------------------------------------------------------------- */
  var EG_NAME = "Brain trends from a headband";
  var EG_SVC = 0xfe8d;                                       // Interaxon's service (muse-js: MUSE_SERVICE)
  var EG_CH = ["03", "04", "05", "06"];                       // the EEG characteristics: TP9, AF7, AF8, TP10
  var EG_SITE = ["Left ear", "Left forehead", "Right forehead", "Right ear"];
  var EG_FS = 256, EG_WIN = 512, EG_KEEP = 2048;              // samples a second; a two-second window; eight seconds kept
  var EG_PP = 150, EG_OFF = 500, EG_EMG = 10, EG_FLAT = 0.5;  // µV: a blink or movement, off the skin, a tense jaw, flat
  var EG_SMOOTH = 25, EG_MIN = 12, EG_REF = 60, EG_REFN = 20, EG_TREND = 0.15;
  var EG_STEPS = {
    link: ["linking up", 15000], service: ["finding its EEG", 15000], chars: ["finding its four sensors", 15000],
    notify: ["asking for its readings", 15000], start: ["starting the EEG stream", 10000], data: ["waiting for the first readings", 8000]
  };
  var EG_TRIES = 3;
  /* state: off | busy | on | lost. Per sensor, the samples of the last eight seconds by their number (ring)
     and which number each slot holds (at); sec: one entry a second {t (bNow), ok, n clean sensors, a, th, st};
     sm: the 25-second averages, for the chart; t0: where the first minute starts (connecting, or Start again);
     q: each sensor's last state; cal: the last eyes check; chk: one running; led: Brain-Led Beats' baseline. */
  var EG = {
    state: "off", dev: null, name: "", gen: 0, wantOn: false, tries: 0, step: "", err: "", said: "", msgTxt: "",
    ctl: null, chars: [], tele: null, hand: null, firstWait: null,
    ring: [], at: [], last: [], seq: [], base: [], next: 0, s0: -1,
    sec: [], sm: [], t0: 0, lastAt: 0, q: ["", "", "", ""], batt: null, drawAt: 0,
    cal: null, chk: null, led: { base: null, calm: 0, pts: [], asked: false }
  };
  var EG_TAB = null;

  /* ----- the signal ----- */
  function egUuid(n) { return "273e00" + n + "-4c4d-454d-96be-f03bac821358"; }
  // a command to the headband, as muse-js writes it: its length, then "X", the command and a new line
  function egCmd(cmd) {
    var s = "X" + cmd + "\n", b = new Uint8Array(s.length);
    for (var i = 0; i < s.length; i++) b[i] = s.charCodeAt(i);
    b[0] = b.length - 1;
    return b;
  }
  // one sensor's packet: its number (two bytes) and twelve 12-bit samples, in µV around zero
  function egDecode(dv) {
    var out = [];
    for (var i = 2; i + 2 < dv.byteLength && out.length < 12; i += 3) {
      var a = dv.getUint8(i), b = dv.getUint8(i + 1), c = dv.getUint8(i + 2);
      out.push(0.48828125 * (((a << 4) | (b >> 4)) - 0x800), 0.48828125 * ((((b & 15) << 8) | c) - 0x800));
    }
    return { idx: dv.getUint16(0), s: out };
  }
  function egTab() {
    if (EG_TAB) return EG_TAB;
    var n = EG_WIN, c = new Float64Array(n), s = new Float64Array(n), w = new Float64Array(n), ww = 0;
    for (var i = 0; i < n; i++) {
      c[i] = Math.cos(2 * Math.PI * i / n); s[i] = Math.sin(2 * Math.PI * i / n);
      w[i] = 0.5 - 0.5 * Math.cos(2 * Math.PI * i / n); ww += w[i] * w[i];
    }
    return (EG_TAB = { c: c, s: s, w: w, ww: ww });
  }
  /* Two seconds of one sensor (512 samples), its straight-line drift taken away: how far it swings, its
     spread, the fast 30-45 Hz buzz of a tense jaw, and alpha's and theta's shares of the power from 1 to 30 Hz. */
  function egBands(x) {
    var T = egTab(), n = EG_WIN, y = sigDetrend(x), lo = Infinity, hi = -Infinity, ss = 0, i, k;
    var yw = new Float64Array(n);
    for (i = 0; i < n; i++) { if (y[i] < lo) lo = y[i]; if (y[i] > hi) hi = y[i]; ss += y[i] * y[i]; yw[i] = y[i] * T.w[i]; }
    var tot = 0, al = 0, th = 0, emg = 0;
    for (k = 2; k <= 90; k++) {                              // bin k is k/2 Hz: 1 to 45 Hz
      var re = 0, im = 0, m = 0;
      for (i = 0; i < n; i++) { re += yw[i] * T.c[m]; im -= yw[i] * T.s[m]; m += k; if (m >= n) m -= n; }
      var p = re * re + im * im, f = k / 2;
      if (f <= 30) tot += p;
      if (f >= 4 && f < 8) th += p;
      else if (f >= 8 && f <= 12) al += p;
      if (f > 30) emg += p;
    }
    return { pp: hi - lo, sd: Math.sqrt(ss / n), emg: Math.sqrt(2 * emg / (n * T.ww)), a: tot ? al / tot : 0, th: tot ? th / tot : 0 };
  }
  // good, noisy (a blink, a movement, a tense jaw) or off (no contact)
  function egState(r) { return r.pp > EG_OFF || r.sd < EG_FLAT ? "off" : r.pp > EG_PP || r.emg > EG_EMG ? "noisy" : "good"; }

  /* ----- trends: the last 25 seconds against your first minute ----- */
  // the clean seconds' mean shares from `from` (exclusive) to `to`
  function egMean(list, from, to) {
    var a = 0, th = 0, n = 0;
    for (var i = list.length - 1; i >= 0; i--) {
      var x = list[i];
      if (x.t <= from) break;
      if (x.t <= to && x.ok) { a += x.a; th += x.th; n++; }
    }
    return n ? { a: a / n, th: th / n, n: n } : null;
  }
  function egNow(list, now) { var m = egMean(list, now - EG_SMOOTH, now); return m && m.n >= EG_MIN ? m : null; }
  /* The first minute of clean signal from t0: the clean seconds in the minute from the first one, once
     that minute is over, or the first twenty clean seconds if the minute had fewer. */
  function egRef(list, t0, now) {
    var c = [];
    for (var i = 0; i < list.length && c.length < 60; i++) if (list[i].ok && list[i].t >= t0) c.push(list[i]);
    if (c.length < EG_REFN) return null;
    var end = c[0].t + EG_REF;
    if (now < end && c.length < 60) return null;
    var m = c.filter(function (x) { return x.t < end; });
    if (m.length < EG_REFN) m = c.slice(0, EG_REFN);
    return { a: avg(m.map(function (x) { return x.a; })), th: avg(m.map(function (x) { return x.th; })), n: m.length };
  }
  function egDelta(ref, cur) { return { a: cur.a / ref.a - 1, th: cur.th / ref.th - 1 }; }
  function egWord(d) { return d >= EG_TREND ? "rising" : d <= -EG_TREND ? "falling" : "steady"; }
  function egPct(d) { var v = Math.round(d * 100); return (v > 0 ? "+" : v < 0 ? "−" : "") + Math.abs(v) + "%"; }
  function egCap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

  /* ----- connecting ----- */
  function egSupported() { return !!(navigator.bluetooth && navigator.bluetooth.requestDevice); }
  function egScale() { return window.__egScale || 1; }        // the tests run the deadlines faster
  function egErr(name, step, msg) { var e = new Error(msg || name); e.name = name; e.step = step; return e; }
  function egGo() {
    if (EG.state === "busy") { egCancel(); return; }
    if (EG.state === "on" || EG.state === "lost") { egDisconnect(); return; }
    if (!egSupported()) { egUI(); return; }
    // the chooser needs this tap: unlocked, it opens now; unlocked in the dialog, its button's tap opens it
    supGate(EG_NAME, egConnect, function (ok) { if (ok && EG.state === "off") egConnect(); else egUI(); });
  }
  function egConnect() {
    if (!egSupported() || EG.state !== "off") return;
    EG.err = ""; EG.said = "";
    var gen = ++EG.gen, req;
    egSet("busy");
    egMsg("Choose your headband…");
    try {
      req = navigator.bluetooth.requestDevice({ filters: [{ services: [EG_SVC] }, { namePrefix: "Muse" }], optionalServices: [EG_SVC] });
    } catch (e) { egFail(egErr(e.name || "Error", "choose", e.message), gen); return; }
    req.then(function (dev) {
      if (gen !== EG.gen) return;
      if (EG.dev && EG.dev !== dev) EG.dev.removeEventListener("gattserverdisconnected", egLost);
      EG.dev = dev; EG.name = dev.name || "Muse headband"; EG.wantOn = true; EG.tries = 0;
      EG.sec = []; EG.sm = []; EG.t0 = 0;
      dev.removeEventListener("gattserverdisconnected", egLost);
      dev.addEventListener("gattserverdisconnected", egLost);
      egAttach();
    }, function (e) { egFail(egErr((e && e.name) || "Error", "choose", e && e.message), gen); });
  }
  // one step with its deadline; whatever it does after the deadline is ignored
  function egStep(p, k) {
    EG.step = k;
    egMsg("Connecting to " + EG.name + ": " + EG_STEPS[k][0] + (EG.tries > 0 ? ", try " + (EG.tries + 1) + " of " + EG_TRIES : "") + "…");
    return new Promise(function (ok, no) {
      var over = false, t = setTimeout(function () { over = true; no(egErr("TimeoutError", k)); }, EG_STEPS[k][1] * egScale());
      p.then(function (v) { clearTimeout(t); if (!over) ok(v); }, function (e) { clearTimeout(t); if (!over) no(egErr((e && e.name) || "Error", k)); });
    });
  }
  /* Link up, find the service, its control and four EEG characteristics, ask for their readings, then
     start the stream as muse-js does (halt, preset p21: EEG without the extra channel, status, go) and wait
     for the first packet. The battery comes along if the headband has its telemetry. */
  function egAttach() {
    var gen = ++EG.gen, dev = EG.dev, svc = null;
    var chk = function (v) { if (gen !== EG.gen || !EG.wantOn) throw egErr("AbortError", EG.step); return v; };
    if (EG.state !== "lost") egSet("busy");
    egBufs();
    egStep(dev.gatt.connect(), "link").then(chk)
      .then(function (srv) { return egStep(srv.getPrimaryService(EG_SVC), "service"); }).then(chk)
      .then(function (s) {
        svc = s;
        var got = [];
        // one request at a time, as muse-js makes them: a browser can turn down a Bluetooth request while another is under way
        return egStep(egSeq([egUuid("01")].concat(EG_CH.map(egUuid)), function (u) { return s.getCharacteristic(u).then(function (c) { got.push(c); }); })
          .then(function () { return got; }), "chars");
      }).then(chk)
      .then(function (cs) {
        egUnhook();
        EG.ctl = cs[0]; EG.chars = cs.slice(1);
        EG.chars.forEach(function (c, i) { c.addEventListener("characteristicvaluechanged", EG.hand[i]); });
        return egStep(egSeq([EG.ctl].concat(EG.chars), function (c) { return c.startNotifications(); }), "notify");
      }).then(chk)
      .then(function () {                                  // the battery, if the headband sends it: three seconds at most, and none is fine
        var tele = svc.getCharacteristic(egUuid("0b")).then(function (c) {
          if (gen !== EG.gen) return;
          EG.tele = c; c.addEventListener("characteristicvaluechanged", egTele);
          return c.startNotifications();
        }).catch(function () {});
        return Promise.race([tele, new Promise(function (r) { setTimeout(r, 3000 * egScale()); })]);
      }).then(chk)
      .then(function () {
        var first = new Promise(function (r) { EG.firstWait = r; });
        return egStep(egSeq(["h", "p21", "s", "d"], function (c) { return EG.ctl.writeValue(egCmd(c)); }), "start")
          .then(chk).then(function () { return egStep(first, "data"); });
      }).then(chk)
      .then(function () {
        EG.tries = 0; EG.err = ""; EG.said = "";
        if (!EG.t0) EG.t0 = bNow();
        egMsg("");
        egSet("on");
      })
      .catch(function (e) {
        if (gen !== EG.gen || e.name === "AbortError") return;
        if (EG.state === "lost" && EG.tries < EG_TRIES && e.name !== "NotFoundError") { egRetry(); return; }
        egFail(e, gen);
      });
  }
  // f on each of a list in turn, each once the last has finished
  function egSeq(list, f) { return list.reduce(function (p, x) { return p.then(function () { return f(x); }); }, Promise.resolve()); }
  function egRetry() {
    EG.tries++;
    try { EG.dev.gatt.disconnect(); } catch (x) {}
    var gen = EG.gen;
    setTimeout(function () { if (gen === EG.gen && EG.wantOn) egAttach(); }, 1500 * EG.tries * egScale());
  }
  function egLost() {
    if (!EG.wantOn || EG.state !== "on") return;            // still connecting: that try fails by itself
    egChkEnd("lost");
    egSet("lost");
    egMsg("The headband dropped out. Reconnecting…");
    egRetry();
  }
  function egUnhook() {
    EG.chars.forEach(function (c, i) { try { c.removeEventListener("characteristicvaluechanged", EG.hand[i]); } catch (e) {} });
    if (EG.tele) { try { EG.tele.removeEventListener("characteristicvaluechanged", egTele); } catch (e) {} }
    EG.chars = []; EG.tele = null;
  }
  function egCancel() {
    EG.wantOn = false; EG.gen++; EG.firstWait = null;
    try { if (EG.dev) EG.dev.gatt.disconnect(); } catch (e) {}
    egUnhook();
    egMsg("");
    egSet("off");
  }
  function egDisconnect() {
    EG.wantOn = false; EG.gen++; EG.firstWait = null;
    egChkEnd("");
    try { if (EG.ctl && EG.dev && EG.dev.gatt.connected) EG.ctl.writeValue(egCmd("h")).catch(function () {}); } catch (e) {}   // halt the stream
    try { if (EG.dev) EG.dev.gatt.disconnect(); } catch (e) {}
    egUnhook();
    EG.ctl = null; EG.batt = null;
    egMsg("");
    egSet("off");
  }
  function egFail(e, gen) {
    if (gen !== undefined && gen !== EG.gen) return;
    var n = e.name, k = e.step, embedded = false;
    try { embedded = window.self !== window.top; } catch (x) { embedded = true; }
    EG.wantOn = false; EG.firstWait = null;
    try { if (EG.dev && k !== "choose") EG.dev.gatt.disconnect(); } catch (x) {}
    egUnhook();
    EG.err = k === "choose" ? (n === "NotFoundError" && /adapter|not available/i.test(e.message || "") ? "Bluetooth is off or unavailable on this device: switch it on, then press Connect a headband again."
        : n === "NotFoundError" ? "No headband was chosen. Switch the Muse on, keep it close, and press Connect a headband again."
        : n === "SecurityError" ? (embedded ? "This copy sits inside another page, such as a preview, which blocks Bluetooth. Open Entrain at its own web address to connect."
          : "The browser wants a fresh tap before it shows its list: press Connect a headband again.")
        : "Bluetooth isn't available: check that it's switched on, and that the browser is allowed to use it (the browser said " + n + ").")
      : k === "service" && n === "NotFoundError" ? "This device has no Muse EEG service, so it isn't a headband Entrain can read. It reads the Muse 2, the Muse S and the 2016 Muse."
      : k === "data" ? "The headband connected but sent no EEG readings. Newer models may send them in a format Entrain can't read yet; the Muse 2, the Muse S and the 2016 Muse are the ones it reads."
      : EG.state === "lost" ? "The headband dropped out and didn't come back. Switch it off and on, and press Connect a headband again."
      : (n === "TimeoutError" || n === "NetworkError") && EG_STEPS[k] ? "The headband didn't answer while " + EG_STEPS[k][0] + ". Switch it off and on again, and close the Muse app on any phone nearby, since it can hold on to the headband; then press Connect a headband."
      : "The connection didn't work (the browser said " + n + " while " + (EG_STEPS[k] ? EG_STEPS[k][0] : "connecting") + "). Switch the headband off and on, and try again.";
    egMsg("");
    egSet("off");
  }
  function egTele(e) {
    try { var v = e.target.value; EG.batt = Math.round(Math.max(0, Math.min(100, v.getUint16(2) / 512))); } catch (x) {}
  }

  /* ----- the readings ----- */
  function egBufs() {
    EG.ring = []; EG.at = []; EG.last = []; EG.seq = []; EG.base = [];
    for (var c = 0; c < 4; c++) {
      EG.ring.push(new Float64Array(EG_KEEP));
      var a = new Float64Array(EG_KEEP); a.fill(-1); EG.at.push(a);
      EG.last.push(-1); EG.seq.push(-1); EG.base.push(0);
    }
    EG.next = 0; EG.s0 = -1;
  }
  function egOnData(ch, dv) {
    if (!dv || dv.byteLength < 20 || !EG.ring.length) return;
    var d = egDecode(dv), last = EG.seq[ch];
    if (last >= 0 && d.idx < last && last - d.idx > 32768) EG.base[ch] += 65536;     // the packet number wrapped round
    EG.seq[ch] = d.idx;
    var abs0 = (EG.base[ch] + d.idx) * 12;
    for (var j = 0; j < d.s.length; j++) { var k = abs0 + j, pos = k % EG_KEEP; EG.ring[ch][pos] = d.s[j]; EG.at[ch][pos] = k; }
    if (abs0 + d.s.length - 1 > EG.last[ch]) EG.last[ch] = abs0 + d.s.length - 1;
    if (EG.s0 < 0) { EG.s0 = abs0; EG.next = abs0 + EG_WIN; }
    EG.lastAt = bNow();
    if (EG.firstWait) { var f = EG.firstWait; EG.firstWait = null; f(); }
    egPump();
  }
  // a window each second of signal, once every sensor has sent it (or a second late, without the one that hasn't)
  function egPump() {
    var hi = Math.max.apply(null, EG.last), lo = Math.min.apply(null, EG.last);
    if (hi - EG.next > EG_KEEP - EG_WIN) EG.next += Math.floor((hi - EG.next) / EG_FS) * EG_FS - EG_FS;   // a long gap: catch up
    while (EG.next - 1 <= hi) {
      if (lo < EG.next - 1 && hi < EG.next - 1 + EG_FS) break;
      egSecond(EG.next);
      EG.next += EG_FS;
    }
  }
  // one sensor's two seconds ending before sample B, a few missing samples held at the last value; too many: null
  function egWin(ch, B) {
    var out = new Float64Array(EG_WIN), miss = 0, ring = EG.ring[ch], at = EG.at[ch], prev = null, i, k;
    for (i = 0; i < EG_WIN; i++) { k = B - EG_WIN + i; if (at[k % EG_KEEP] === k) { prev = ring[k % EG_KEEP]; break; } }
    for (i = 0; i < EG_WIN; i++) {
      k = B - EG_WIN + i;
      var pos = k % EG_KEEP;
      if (at[pos] === k) prev = ring[pos]; else miss++;
      out[i] = prev === null ? 0 : prev;
    }
    return miss > EG_WIN * 0.05 ? null : out;
  }
  function egSecond(B) {
    var st = [], good = [];
    for (var ch = 0; ch < 4; ch++) {
      var w = egWin(ch, B);
      if (!w) { st.push("off"); continue; }
      var r = egBands(w), s = egState(r);
      st.push(s);
      if (s === "good") good.push(r);
    }
    var now = bNow(), x = { t: now, ok: good.length >= 2, n: good.length, st: st };
    if (x.ok) { x.a = avg(good.map(function (r) { return r.a; })); x.th = avg(good.map(function (r) { return r.th; })); }
    EG.q = st;
    EG.sec.push(x);
    if (EG.sec.length > 1200) EG.sec.splice(0, EG.sec.length - 900);
    var sm = egNow(EG.sec, now);
    if (sm) { EG.sm.push({ t: now, a: sm.a, th: sm.th }); if (EG.sm.length > 1200) EG.sm.splice(0, EG.sm.length - 900); }
    if (P.state === "running") P.eeg.push({ t: pT(), ok: x.ok, a: x.a, th: x.th });      // the practice's own record
    egChkSecond(x);
    egUI();
  }
  function egLive() { return EG.state === "on" && bNow() - EG.lastAt < 3; }

  /* ----- the eyes-open, eyes-closed check ----- */
  // half a minute each way; the first five seconds of each are left out while alpha settles
  var EG_CHK = 30, EG_SETTLE = 5;
  function egChkGo() {
    if (EG.chk) { egChkEnd("cancel"); return; }
    if (EG.state !== "on") return;
    pBusOn();                                                // the bells, from this tap
    EG.chk = { t0: bNow(), phase: "open", open: [], closed: [], timer: setInterval(egChkTick, 200) };
    egCalSay("");
    egSay("Keep your eyes open, resting on one point.");
    egUI();
  }
  function egChkTick() {
    var c = EG.chk;
    if (!c) return;
    var el = bNow() - c.t0;
    if (c.phase === "open" && el >= EG_CHK) {
      c.phase = "closed";
      pBell(0.5, 0, 392, null, true);
      egSay("Close your eyes, and keep them closed until the two bells.");
    } else if (c.phase === "closed" && el >= 2 * EG_CHK) {
      if (A.ctx) { pBell(0.5, 0, 523.25, null, true); pBell(0.5, A.ctx.currentTime + 0.6, 523.25, null, true); }
      egSay("Open your eyes.");
      egChkEnd("done");
      return;
    }
    egUI();
  }
  function egChkSecond(x) {
    var c = EG.chk;
    if (!c || !x.ok) return;
    var el = x.t - c.t0;
    if (c.phase === "open" && el >= EG_SETTLE && el < EG_CHK) c.open.push(x.a);
    else if (c.phase === "closed" && el >= EG_CHK + EG_SETTLE) c.closed.push(x.a);
  }
  function egChkEnd(how) {
    var c = EG.chk;
    if (!c) return;
    clearInterval(c.timer);
    EG.chk = null;
    if (how === "done") {
      var r = egCalOf(c.open, c.closed);
      if (r.ok) { EG.cal = { at: Date.now(), open: r.open, closed: r.closed, rise: r.rise, n: [c.open.length, c.closed.length] }; store.set("egCal", JSON.stringify(EG.cal)); }
      egCalSay(egCalTxt(r));
    } else if (how === "lost") egCalSay("The check stopped: the headband dropped out.");
    else egCalSay("");
    egUI();
  }
  // the result of a check: alpha's share with the eyes open and closed, and the rise; ten clean seconds each way at least
  function egCalOf(open, closed) {
    if (open.length < 10 || closed.length < 10) return { ok: false, no: open.length, nc: closed.length };
    var o = avg(open), c = avg(closed);
    return { ok: true, open: o, closed: c, rise: c / o - 1 };
  }
  function egCalTxt(r) {
    var fit = "Push your hair aside so the sensors behind the ears touch skin, sit the forehead sensors flat just above the eyebrows, dampen them a little if your skin is dry, and keep your jaw soft and your head still.";
    if (!r.ok) return "Too few clean seconds to compare (" + r.no + " with your eyes open, " + r.nc + " closed, of the 25 each way that count): blinks, a tense jaw or a loose sensor spoilt the rest. " + fit + " Then try again.";
    if (r.rise >= 0.2) return "Alpha rose by " + Math.round(r.rise * 100) + "% with your eyes closed, as it should: the headband is picking up your alpha. Brain-Led Beats now counts a rise like this as a full one.";
    if (r.rise >= 0.05) return "Alpha rose a little, by " + Math.round(r.rise * 100) + "%, with your eyes closed. That can be your own pattern, or a loose fit. " + fit;
    return "Alpha didn't rise with your eyes closed (" + egPct(r.rise) + "). It usually does, within seconds, so the headband may not be reading you well. " + fit + " Then try again.";
  }
  function egCalSay(s) { EG.said = s; bSetT("#egCalRes", s); $("#egCalRes").hidden = !s; }
  function egSay(text) {
    if (!window.speechSynthesis || !window.SpeechSynthesisUtterance) return;
    try {
      var u = new SpeechSynthesisUtterance(text), v = pVoice();
      if (v) { u.voice = v; u.lang = v.lang; } else u.lang = "en-GB";
      u.rate = 0.9;
      speechSynthesis.cancel(); speechSynthesis.speak(u);
    } catch (e) {}
  }
  // how far a rise counts as a full one for Brain-Led Beats: the check's own rise, if it found one, else 30%
  function egSpan() { var c = EG.cal; return c && c.rise >= 0.1 ? Math.max(0.15, Math.min(0.6, c.rise)) : 0.3; }

  /* ----- a practice: live chips, the record, the end screen ----- */
  function egChips() {
    if (EG.state !== "on" || !P.eeg) return [];
    var T = pT(), ref = egRef(P.eeg, 0, T), cur = egNow(P.eeg, T);
    if (!ref) return ['<span class="lc eg">Headband <b>first minute</b></span>'];
    if (!cur) return ['<span class="lc off">Headband signal noisy</span>'];
    var d = egDelta(ref, cur);
    return ['<span class="lc eg">Alpha <b>' + egWord(d.a) + "</b></span>", '<span class="lc eg">Theta <b>' + egWord(d.th) + "</b></span>"];
  }
  /* What the session's headband data says: the first minute of clean signal against the last two minutes,
     the share of seconds left out, and the 25-second averages every five seconds, for the chart. */
  function egSummary(r, T) {
    var L = (P.eeg || []).filter(function (x) { return x.t <= T; });
    if (L.length < 10) return;
    var span = L[L.length - 1].t - L[0].t, ok = L.filter(function (x) { return x.ok; }).length, clean = Math.round(100 * ok / L.length);
    if (span < 150) { r.eeg = { none: true, short: true, clean: clean }; return; }
    var ref = egRef(L, 0, T), tEnd = L[L.length - 1].t, end = egMean(L, tEnd - 120, tEnd);
    if (!ref || !end || end.n < 30) { r.eeg = { none: true, clean: clean }; return; }
    var pts = [];
    for (var t = L[0].t + EG_SMOOTH; t <= tEnd + 0.01; t += 5) { var m = egNow(L, t); if (m) pts.push({ t: t, a: m.a, th: m.th }); }
    r.eeg = { da: Math.round((end.a / ref.a - 1) * 100), dt: Math.round((end.th / ref.th - 1) * 100), clean: clean, secs: Math.round(span), ref: ref, end: end, pts: pts };
  }
  function egNote(r) { return r.eeg && !r.eeg.none ? "alpha " + egPct(r.eeg.da / 100) + ", theta " + egPct(r.eeg.dt / 100) + " (headband)" : ""; }
  function egTiles(r) {
    var e = r.eeg;
    if (!e) return [];
    if (e.none) return [["Brain trend", "—", e.short ? "too short to read" : "too few clean seconds", "eeg"]];
    return [["Alpha", egCap(egWord(e.da / 100)), egPct(e.da / 100) + ", first minute to last two", "eeg"],
      ["Theta", egCap(egWord(e.dt / 100)), egPct(e.dt / 100) + ", first minute to last two", "eeg"]];
  }
  function egExplain(k) {
    if (k !== "eeg") return null;
    var e = SD.r.eeg, p = [];
    if (e.none) {
      p.push(e.short ? "The headband read less than two and a half minutes of the session, too little to compare a first minute with the end."
        : "Too few seconds had a clean signal (" + e.clean + "%) to compare the first minute with the last two: blinks, a tense jaw, movement or a loose sensor spoilt the rest. The eyes check on the Heart page helps with the fit.");
      return ["Brain trend", p];
    }
    var how = function (v) { return v >= 15 ? "rose by " + v + "%" : v <= -15 ? "fell by " + (-v) + "%" : "held steady (" + egPct(v / 100) + ")"; };
    p.push("From your first minute of clean signal to the last two minutes, alpha's share of the headband's signal " + how(e.da) + ", and theta's " + how(e.dt) +
      ". A change of more than 15% either way counts as rising or falling; a smaller one, as steady.");
    p.push("Each second, the page takes the last two seconds from each of the headband's four sensors, splits them into their rhythms and works out alpha's (8 to 12 Hz) and theta's (4 to 8 Hz) share of everything from 1 to 30 Hz, then averages the sensors with a clean signal. Seconds spoilt by a blink, a tense jaw or a movement are left out: " +
      (100 - e.clean) + "% of this session's.");
    p.push("Alpha usually rises as you relax with your eyes closed, and theta as you drift towards sleep or sink into meditation. But brain waves follow what the brain is doing, a headband reads broad trends rather than states, and one session is one reading, so treat this as a picture of the session rather than a score.");
    return ["Brain trend", p];
  }
  // the end screen's chart: the two shares across the session, the first minute's levels dashed, the beat in violet
  function egCard(r) {
    if (!r.eeg || r.eeg.none || r.eeg.pts.length < 3) return "";
    return '<div class="sd-chart eg-sd"><span>Alpha (teal) and theta (amber) across the session, as shares of the headband\'s signal' + (r.beatLog ? ", with the beat in violet" : "") + "</span>" +
      '<canvas id="sdEeg" role="img" aria-label="' + esc("Alpha " + egWord(r.eeg.da / 100) + " " + egPct(r.eeg.da / 100) + ", theta " + egWord(r.eeg.dt / 100) + " " + egPct(r.eeg.dt / 100) + ", first minute to last two") + '"></canvas></div>';
  }
  function egCardDraw(r) {
    var cv = $("#sdEeg"), f = cv && fitCanvas(cv);
    if (!f || !r.eeg || r.eeg.none) return;
    egPlot(f.c, f.w, f.h, r.eeg.pts, r.eeg.ref, 0, r.secs, r.beatLog, ["0", Math.max(1, Math.round(r.secs / 60)) + " min"]);
  }
  // the shares over time (t0 to t1) on one scale, the reference levels dashed; the beat, if any, on its own (3 to 11 Hz)
  function egPlot(c, W, Hh, pts, ref, t0, t1, beat, lab) {
    var L = 8, R = W - (beat ? 38 : 8), top = 10, bot = Hh - 18, hi = 0;
    pts.forEach(function (p) { hi = Math.max(hi, p.a, p.th); });
    if (ref) hi = Math.max(hi, ref.a, ref.th);
    hi = Math.min(1, Math.ceil(hi * 10 + 0.5) / 10);
    var X = function (t) { return L + (t - t0) / Math.max(1, t1 - t0) * (R - L); }, Y = function (v) { return bot - v / hi * (bot - top); };
    c.strokeStyle = BCOL.line; c.lineWidth = 1;
    c.beginPath(); c.moveTo(L, bot + 0.5); c.lineTo(R, bot + 0.5); c.stroke();
    [["a", BCOL["b-in"]], ["th", BCOL["b-hold"]]].forEach(function (s) {
      if (ref) {
        c.strokeStyle = rgba(s[1], 0.6); c.lineWidth = 1; c.setLineDash([4, 4]);
        c.beginPath(); c.moveTo(L, Y(ref[s[0]]) + 0.5); c.lineTo(R, Y(ref[s[0]]) + 0.5); c.stroke(); c.setLineDash([]);
      }
      c.strokeStyle = s[1]; c.lineWidth = 2; c.lineJoin = "round"; c.beginPath();
      pts.forEach(function (p, i) { if (p.t < t0) return; if (i && pts[i - 1].t >= t0) c.lineTo(X(p.t), Y(p[s[0]])); else c.moveTo(X(p.t), Y(p[s[0]])); });
      c.stroke();
    });
    if (beat && beat.length > 1) {
      var BY = function (hz) { return top + (11 - hz) / 8 * (bot - top); };
      c.strokeStyle = BCOL["b-out"]; c.lineWidth = 2; c.beginPath();
      beat.forEach(function (p, i) { if (i) c.lineTo(X(p.t), BY(p.hz)); else c.moveTo(X(p.t), BY(p.hz)); });
      c.stroke();
      c.font = "600 10.5px " + B_SANS; c.fillStyle = BCOL["b-out"]; c.textAlign = "left"; c.textBaseline = "middle";
      c.fillText("11 Hz", R + 4, top + 4); c.fillText("3 Hz", R + 4, bot - 4);
    }
    if (!lab) return;
    c.font = "600 10.5px " + B_SANS; c.textBaseline = "top"; c.textAlign = "left"; c.fillStyle = BCOL["text-faint"];
    c.fillText(lab[0], L, bot + 4);
    c.textAlign = "right"; c.fillText(lab[1], R, bot + 4);
  }

  /* ----- Brain-Led Beats: the beat follows your alpha and theta -----
     As in Heart-Led Beats (adapt.js): a minute to settle, a minute and a half reading your resting shares with
     your eyes closed, then every five seconds the beat moves towards a target set by how far your alpha (60%)
     and theta (40%), averaged over the last 25 seconds, have risen above that rest; a rise of 30%, or the rise
     your eyes check found, is the full share. From 10 Hz down to 6 Hz, never faster than 0.15 Hz an update,
     and back up if they fall. With no headband data it follows a gentle scripted descent. Entrain's own rule. */
  function brainLed(min) {
    var total = min * 60, settle = 60, base = 90, close = 60;
    return [
      G(settle, "Settle", ["Put the headband on and sit back or lie down, with headphones on. Let your forehead and jaw go soft.",
        "The beat will follow your brain's rhythms. As your alpha and theta rise above their resting level, it glides from 10 Hz towards 6 Hz.",
        "Close your eyes, and let your attention rest on the sound."], { vis: "orb" }),
      { k: "brain", phase: "base", secs: base, title: "Reading your rhythms", lines: [[0, "First, a minute and a half to read your resting rhythms. Keep your eyes closed and rest."]] },
      { k: "brain", phase: "lead", secs: total - settle - base - close, title: "Brain-led beat",
        lines: [[0, "Now the beat is following your brain. Rest, and let the sound carry you."], [240, "Let the jaw and the forehead stay soft."], [600, "Notice how quiet the mind has become."]] },
      G(close, "Closing", ["Let the sound fade. Take a fuller breath, and open your eyes when you're ready.", "Look at what your alpha and theta did on the next screen."], { vis: "orb" })
    ];
  }
  function egLedReset() { EG.led = { base: null, calm: 0, pts: [], asked: false }; }
  // the resting shares: the clean seconds from `from` to `to` in practice time, thirty at least
  function egLedBase(from, to) {
    var m = egMean(P.eeg || [], from, to);
    return m && m.n >= 30 ? m : null;
  }
  function egLedTick(s, st, T) {
    if (s.phase === "base") {
      if (T - AD.last >= 5) { AD.last = T; AD.log.push({ t: T, hz: AD.cur, src: "base" }); }
      return;
    }
    if (!EG.led.asked) {                                     // the rest: the clean seconds of the step that read it, however late the tick
      EG.led.asked = true;
      P.steps.forEach(function (b0) { if (b0.k === "brain" && b0.phase === "base" && b0.at < s.at) EG.led.base = egLedBase(b0.at, b0.at + b0.secs); });
    }
    if (T - AD.last < 5) return;
    AD.last = T;
    var cur = egLive() ? egNow(P.eeg, T) : null, target, b;
    if (cur && !EG.led.base && st >= 60) EG.led.base = egLedBase(T - 90, T);      // connected late: the last minute and a half is the rest
    b = EG.led.base;
    if (cur) EG.led.pts.push({ t: T, a: cur.a, th: cur.th });
    if (cur && b) {
      var span = egSpan(), sc = 0.6 * adClamp((cur.a / b.a - 1) / span) + 0.4 * adClamp((cur.th / b.th - 1) / span);
      EG.led.calm += (sc - EG.led.calm) * 0.35;
      target = 10 - 4 * EG.led.calm;
      AD.src = "brain";
    } else {
      target = 10 - 4 * Math.min(1, st / (s.secs * 0.7));
      AD.src = "script";
    }
    target = Math.max(6, Math.min(10, target));
    AD.cur = Math.round((AD.cur + Math.max(-0.15, Math.min(0.15, target - AD.cur))) * 100) / 100;
    aBeat(AD.cur, 1.5);
    AD.log.push({ t: T, hz: AD.cur, calm: EG.led.calm, src: AD.src });
  }
  function egLedSub(s, st) {
    return s.phase === "base" ? (egLive() ? "Reading your resting alpha and theta · " : "No headband data yet · ") + Math.max(0, Math.ceil(s.secs - st)) + " s"
      : AD.src === "brain" ? "Following your alpha and theta"
      : AD.src === "script" ? (egLive() ? "Waiting for a clean signal: a gentle scripted descent meanwhile" : "No headband data: a gentle scripted descent") : "";
  }
  // the beat now, big, over your alpha and theta (25-second averages) and the beat so far
  function egLedDraw(c, W, Hh, s, T, col) {
    var cx = W / 2, top = Hh * 0.08, hz = AD.cur, big = Math.min(W, Hh) * 0.2;
    c.textAlign = "center"; c.textBaseline = "alphabetic";
    c.font = "700 " + Math.round(big) + "px " + B_MONO; c.fillStyle = BCOL.text;
    c.fillText(hz.toFixed(1), cx, top + big);
    c.font = "650 13px " + B_SANS; c.fillStyle = rgba(col, 0.95);
    c.fillText("Hz · " + adBand(hz), cx, top + big + 22);
    var t0 = P.steps[1] ? P.steps[1].at : 0, t1 = Math.max(t0 + 120, T), y0 = Hh * 0.52;
    c.save(); c.translate(0, y0);
    egPlot(c, W, Hh - y0, EG.led.pts, EG.led.base, t0, t1, AD.log.length > 1 ? AD.log : null, null);
    c.restore();
    c.font = "600 11px " + B_SANS; c.textBaseline = "alphabetic"; c.textAlign = "left";
    c.fillStyle = BCOL["b-in"]; c.fillText("alpha", 8, y0 - 4);
    c.fillStyle = BCOL["b-hold"]; c.fillText("theta", 8 + c.measureText("alpha   ").width, y0 - 4);
    if (AD.log.length > 1) { c.textAlign = "right"; c.fillStyle = BCOL["b-out"]; c.fillText("beat", W - 8, y0 - 4); }
  }

  /* ----- the Heart page ----- */
  function egSet(st) {
    EG.state = st;
    egUI();
  }
  function egMsg(s) { EG.msgTxt = s; bSetT("#egMsg", s); }
  function egUI() {
    var box = $("#eeg");
    if (!box) return;
    var st = EG.state, on = st === "on", sup = egSupported();
    box.dataset.state = st;
    bSetT("#egPillTxt", on ? "Connected" : st === "busy" ? "Connecting…" : st === "lost" ? "Reconnecting…" : "Not connected");
    var go = $("#egGo");
    bSetT("#egGoTxt", on || st === "lost" ? "Disconnect" : st === "busy" ? "Cancel" : "Connect a headband");
    go.disabled = !sup;
    var tag = go.querySelector(".sup-tag"), lock = !supOn() && st === "off";
    if (tag && !lock) tag.parentNode.removeChild(tag);
    else if (!tag && lock) go.insertAdjacentHTML("beforeend", supTag());
    $("#egNo").hidden = sup;
    var err = st === "off" ? EG.err : "";
    bSetT("#egErr", err); $("#egErr").hidden = !err;
    $("#egOn").hidden = !on;
    bSetT("#egHint", on ? EG.name + (EG.batt !== null ? " · battery " + EG.batt + "%" : "") : "Experimental");
    if (!on) return;
    // each sensor: good, noisy or off the skin
    var q = EG.q;
    document.querySelectorAll("#egSens li").forEach(function (li, i) {
      var s = q[i] || "";
      if (li.dataset.q !== s) li.dataset.q = s;
      bSetT("#egS" + i, s === "good" ? "good" : s === "noisy" ? "noisy" : s === "off" ? "off the skin" : "…");
    });
    var now = bNow(), ref = egRef(EG.sec, EG.t0, now), cur = egNow(EG.sec, now), d = ref && cur ? egDelta(ref, cur) : null;
    var any = EG.sec.some(function (x) { return x.ok && x.t >= EG.t0; });
    [["a", "#egA", "#egAS"], ["th", "#egT", "#egTS"]].forEach(function (k) {
      bSetT(k[1], d ? egCap(egWord(d[k[0]])) : ref ? "—" : "…");
      bSetT(k[2], d ? egPct(d[k[0]]) + " since your first minute" : ref ? "Signal too noisy just now"
        : any ? "Reading your first minute" : "Waiting for a clean signal");
      var tile = $(k[1]).closest(".eg-t");
      var w = d ? egWord(d[k[0]]) : "";
      if (tile.dataset.w !== w) tile.dataset.w = w;
    });
    bSetT("#egRead", egReadTxt(ref, cur, d));
    // the check
    var c = EG.chk;
    bSetT("#egCheckTxt", c ? "Cancel the check" : "Eyes open, eyes closed");
    $("#egCheck").setAttribute("aria-pressed", c ? "true" : "false");
    var cr = c ? (c.phase === "open" ? "Eyes open, resting on one point: " + Math.max(0, Math.ceil(EG_CHK - (now - c.t0))) + " s"
      : "Eyes closed until the two bells: " + Math.max(0, Math.ceil(2 * EG_CHK - (now - c.t0))) + " s") : "";
    bSetT("#egCalNow", cr); $("#egCalNow").hidden = !c;
    if (!$("#v-heart").hidden && Date.now() - EG.drawAt >= (RM ? 2000 : 500)) { EG.drawAt = Date.now(); egDraw(ref); }
  }
  function egReadTxt(ref, cur, d) {
    var q = EG.q, off = [], noisy = 0, last = EG.sec.filter(function (x) { return x.t > bNow() - 60; });
    q.forEach(function (s, i) { if (s === "off") off.push(EG_SITE[i]); else if (s === "noisy") noisy++; });
    var left = last.length ? Math.round(100 * last.filter(function (x) { return !x.ok; }).length / last.length) : 0;
    if (off.length >= 2) return "Not touching the skin: " + off.join(", ") + ". Push your hair aside so the sensors behind the ears touch skin, and sit the forehead sensors flat, just above the eyebrows.";
    if (!ref || !cur) {
      if (left >= 50) return "Blinks, a tense jaw or movement are spoiling the signal (" + left + "% of the last minute left out). Rest your eyes, soften your jaw and keep your head still.";
      return off.length ? "One sensor isn't touching the skin: " + off[0] + ". The others carry on." : "Sit still with your jaw and forehead soft while the first minute is read.";
    }
    return "Alpha " + egWord(d.a) + " and theta " + egWord(d.th) + " since your first minute, from the last 25 seconds" +
      (left ? "; " + left + "% of the last minute left out for blinks, a tense jaw or movement." : ".");
  }
  // the last five minutes of 25-second averages, the first minute's levels dashed
  function egDraw(ref) {
    var cv = $("#egChart"), em = $("#egEmpty");
    if (!cv) return;
    var now = bNow(), pts = EG.sm.filter(function (p) { return p.t >= EG.t0 && p.t > now - 300; });
    em.hidden = pts.length >= 2;
    var f = fitCanvas(cv);
    if (!f || pts.length < 2) return;
    var a = Math.max(EG.t0, now - 300);
    egPlot(f.c, f.w, f.h, pts, ref, a, Math.max(now, pts[0].t + 60), null, [now - a > 90 ? "\u2212" + Math.round((now - a) / 60) + " min" : "", "now"]);
  }
  function egRestart() { EG.t0 = bNow(); EG.sm = []; egUI(); }

  function egInit() {
    EG.hand = [0, 1, 2, 3].map(function (ch) { return function (e) { egOnData(ch, e.target.value); }; });
    $("#egGo").addEventListener("click", egGo);
    $("#egCheck").addEventListener("click", egChkGo);
    $("#egAgain").addEventListener("click", egRestart);
    SUP_EXTRA.push({ name: EG_NAME, href: "#eeg" });           // Settings' list of what the donation unlocks
    try { var c = JSON.parse(store.get("egCal") || "null"); if (c && typeof c.rise === "number" && isFinite(c.rise)) EG.cal = c; } catch (e) {}
    if (EG.cal) egCalSay("Your last check: alpha " + egPct(EG.cal.rise) + " with your eyes closed.");
    window.addEventListener("pagehide", function () { if (EG.state !== "off") egDisconnect(); });
    if (window.ResizeObserver) new ResizeObserver(function () { if (EG.state === "on") { EG.drawAt = 0; egUI(); } }).observe($("#egChart"));
    egUI();
    if (window.__entrain) {
      var X = window.__entrain;
      X.EG = EG; X.egDecode = egDecode; X.egBands = egBands; X.egState = egState; X.egRef = egRef; X.egNow = egNow; X.egCalOf = egCalOf; X.egCalTxt = egCalTxt;
      X.egCmd = egCmd; X.egSpan = egSpan; X.egWord = egWord; X.egChips = egChips;
    }
  }
