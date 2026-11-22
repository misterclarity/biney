  /* ------------------- air, scent, chewing gum and blood oxygen -------------------
     From the brain-wave guide's "Smell and air quality", "Taste and chewing" and its table of what to measure.

     Fresh air, with less CO2, goes with clearer thinking, and the guide rates that evidence strong: in a controlled
     office study, ventilation of 20 cubic feet a minute per person and CO2 above about 900 ppm went with lower test
     scores (Allen et al. 2016, as Cedeño Laurent et al. 2021 sum it up). So the pages of the focus practices, the
     focus tracks and the custom primer remind you to air the room (a Settings choice, on once the device is
     unlocked), and show your room's CO2 when there's a reading from the last two hours: from an Aranet4 monitor over
     Bluetooth (its current readings, as the open-source Aranet4-Python reads them), or typed in from any monitor
     (the Heart page's Room air, #air), with "Open a window" above about 900 ppm.

     Scent and chewing gum have early evidence only, so they're optional tips, free to read, each with its safety line:
     rosemary on focus pages, lavender on sleep pages (Diego et al. 1998), and gum before focused work (Allen & Smith
     2015). Settings can turn the tips off.

     Blood oxygen, as the guide puts it, is a rough safety signal during breath holds: a fingertip oximeter that speaks
     Bluetooth's standard pulse oximeter service (PLX, 0x1822). While a hold runs, a practice's hold step (Wim Hof's) or
     a hold in Breathe's pattern (Swim & dive's), a fresh reading below 90% ends it with "Breathe now": a practice
     pauses, Breathe ends the session. It only ever ends a hold sooner; nothing here lengthens a hold or says one
     could be longer. Entrain's own rule, from general knowledge rather than a trial.

     The CO2 monitor, the typed reading, the oximeter and the reminder open with a donation while this device is
     locked; the tips, the safety lines and Learn are free.
  ------------------------------------------------------------------------------- */
  var AQ_NAME = "Room air from a CO₂ monitor";
  var AQ_PROMPT = "Air the room before focus sessions";
  var OX_NAME = "Blood oxygen from an oximeter";
  var AQ_HIGH = 900;                                         // ppm: above about this, open a window
  var AQ_FOR = 2 * 3600e3;                                   // a reading counts for two hours
  var AQ_AIRED = 3600e3;                                     // "It's aired" holds for an hour
  var AQ_MIN = 300, AQ_MAX = 10000;                          // what a room's air can read, in ppm
  var AQ_SVC = 0xfce0, AQ_SVC_OLD = "f0cd1400-95da-4f4b-9ac8-aa55d312af0c";     // the Aranet4's service: firmware 1.2 on, and before
  var AQ_DET = "f0cd3001-95da-4f4b-9ac8-aa55d312af0c", AQ_CUR = "f0cd1503-95da-4f4b-9ac8-aa55d312af0c";   // current readings, with and without timing
  var AQ_STEPS = { link: ["linking up", 15000], service: ["finding its readings", 15000], read: ["reading the CO₂", 40000] };
  var OX_SVC = 0x1822, OX_CONT = 0x2a5f, OX_SPOT = 0x2a5e;  // Pulse Oximeter Service: continuous and spot-check measurements
  var OX_FLOOR = 90, OX_STALE = 6;                           // %: below it a hold ends; seconds a reading counts for
  var OX_STEPS = { link: ["linking up", 15000], service: ["finding its oxygen readings", 15000], read: ["starting its readings", 30000] };
  var OX_TRIES = 3;
  var SAFE_SCENT = "Essential oils are strong: a drop or two in a diffuser or on a tissue is plenty, in an aired room. Dilute them before they touch your skin, never swallow them, " +
    "and keep them away from small children and pets, cats above all, since some oils are harmful to them. With asthma, or in pregnancy, ask your doctor or midwife first, " +
    "and stop if your chest tightens or your skin reacts.";
  var AQ_TIPS = {
    rosemary: ["Optional: rosemary.", "In a small, older study, three minutes of rosemary scent left people feeling more alert. It's early evidence, so take it as an extra you might enjoy, not something you need.", "#l-scent"],
    lavender: ["Optional: lavender.", "In the same small, older study, three minutes of lavender scent left people more relaxed and in a better mood. Early to moderate evidence: a gentle extra for the evening and bedtime.", "#l-scent"],
    gum: ["Optional: chewing gum.", "Chewing gum is mildly alerting: in a study of a working day, people who chewed it got more done and reported fewer cognitive problems. A small effect; sugar-free gum spares your teeth, and skip it if your jaw aches.", "#l-gum"]
  };
  /* The CO2 monitor: off | busy (connecting) | on. last: the latest reading { ppm, at (Date.now() of the
     measurement), src "monitor" | "typed", name, temp, rh, batt }, kept (store "co2", left out of backups). */
  var AQ = { state: "off", dev: null, name: "", gen: 0, wantOn: false, err: "", chr: null, timer: 0, hintT: 0, fails: 0, msgTxt: "", wait: false, batt: null, last: null };
  /* The oximeter: off | busy | on | lost. v: the last SpO2 (%), pr: pulse rate, pi: perfusion index, at: bNow() of
     the last usable reading, q: what the last reading was worth (good, weak, off, demo, none), cont: continuous or spot-check. */
  var OX = { state: "off", dev: null, name: "", gen: 0, wantOn: false, tries: 0, err: "", chr: null, cont: true, msgTxt: "", step: "", v: null, pr: null, pi: null, at: 0, q: "", n: 0, firstWait: null, drop: false };

  /* ----- what's chosen ----- */
  function aqPromptOn() { return supOn() && store.get("airPrompt") !== "0"; }
  function aqTipsOn() { return store.get("airTips") !== "0"; }
  function aqBt() { return !!(navigator.bluetooth && navigator.bluetooth.requestDevice); }
  function aqScale() { return window.__aqScale || 1; }       // the tests run the deadlines faster
  function aqErr(name, step, msg) { var e = new Error(msg || name); e.name = name; e.step = step; return e; }
  // a step with its deadline; whatever it does after the deadline is ignored
  function aqLimit(p, ms, k) {
    return new Promise(function (ok, no) {
      var over = false, t = setTimeout(function () { over = true; no(aqErr("TimeoutError", k)); }, ms * aqScale());
      p.then(function (v) { clearTimeout(t); if (!over) ok(v); }, function (e) { clearTimeout(t); if (!over) no(aqErr((e && e.name) || "Error", k, e && e.message)); });
    });
  }
  function aqEmbedded() { try { return window.self !== window.top; } catch (x) { return true; } }
  // why the browser's list of devices didn't give one: the same for both devices
  function aqChooseMsg(e, what, btn) {
    var n = e.name;
    return n === "NotFoundError" && /adapter|not available/i.test(e.message || "") ? "Bluetooth is off or unavailable on this device: switch it on, then press " + btn + " again."
      : n === "NotFoundError" ? "No " + what + " was chosen. Switch it on, keep it close, and press " + btn + " again."
      : n === "SecurityError" ? (aqEmbedded() ? "This copy sits inside another page, such as a preview, which blocks Bluetooth. Open Entrain at its own web address to connect."
        : "The browser wants a fresh tap before it shows its list: press " + btn + " again.")
      : "Bluetooth isn't available: check that it's switched on, and that the browser is allowed to use it (the browser said " + n + ").";
  }
  function aqNum(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ","); }
  function aqAgo(at) {
    var m = Math.max(0, Math.round((Date.now() - at) / 60000));
    return m < 1 ? "just now" : m < 60 ? m + " min ago" : Math.floor(m / 60) + " h " + (m % 60) + " min ago";
  }

  /* ----- the CO2 reading ----- */
  /* The Aranet4's current readings, little-endian: CO2 (ppm), temperature (a twentieth of a degree), pressure
     (a tenth of a hectopascal), humidity (%), battery (%), its colour (1 green, 2 amber, 3 red), and in the
     detailed form the interval between measurements and the seconds since the last one. No CO2 yet: ppm null. */
  function aqParse(dv) {
    if (!dv || dv.byteLength < 9) return null;
    var co2 = dv.getUint16(0, true);
    var r = { ppm: co2 >= AQ_MIN && co2 <= AQ_MAX ? co2 : null, temp: Math.round(dv.getUint16(2, true) * 0.5) / 10, hpa: Math.round(dv.getUint16(4, true)) / 10,
      rh: dv.getUint8(6), batt: dv.getUint8(7), status: dv.getUint8(8) };
    if (dv.byteLength >= 13) { r.interval = dv.getUint16(9, true); r.ago = dv.getUint16(11, true); }
    return r;
  }
  function aqLoad() {
    try {
      var r = JSON.parse(store.get("co2") || "null");
      if (r && r.ppm >= AQ_MIN && r.ppm <= AQ_MAX && r.at > 0) AQ.last = r;
    } catch (e) {}
  }
  function aqKeep(r) { AQ.last = r; store.set("co2", JSON.stringify(r)); aqUI(); }
  // the reading from the last two hours, if there is one (only while this device is unlocked: it's the monitor's)
  function aqNow() {
    var r = AQ.last;
    if (!r || !supOn()) return null;
    var age = Date.now() - r.at;
    return age < AQ_FOR && age > -60000 ? r : null;
  }
  function aqHigh(r) { return !!r && r.ppm >= AQ_HIGH; }
  // aired within the hour, and no reading since says otherwise
  function aqAired(r) {
    var a = +store.get("airAt") || 0;
    return Date.now() - a < AQ_AIRED && (!r || r.at <= a);
  }
  function aqFrom(r) { return r.src === "typed" ? "typed in" : (r.name || "Aranet4"); }

  /* ----- typing a reading in ----- */
  function aqType() {
    var raw = ($("#aqIn").value || "").replace(/[\s,.]/g, ""), v = /^\d+$/.test(raw) ? parseInt(raw, 10) : NaN;
    if (!(v >= AQ_MIN && v <= AQ_MAX)) { aqTypeSay("Type the number your monitor shows, in ppm: between 300 and 10,000."); return; }
    var go = function () {
      aqKeep({ ppm: v, at: Date.now(), src: "typed" });
      $("#aqIn").value = "";
      aqTypeSay("Kept: " + aqNum(v) + " ppm, for the next two hours.");
    };
    supGate(AQ_NAME, go, function (ok) { if (ok) go(); else aqUI(); });
  }
  function aqTypeSay(s) { bSetT("#aqTypeMsg", s); }

  /* ----- connecting an Aranet4 ----- */
  function aqGo() {
    if (AQ.state === "busy") { aqCancel(); return; }
    if (AQ.state === "on") { aqDisconnect(); return; }
    if (!aqBt()) { aqUI(); return; }
    // the chooser needs this tap: unlocked, it opens now; unlocked in the dialog, its button's tap opens it
    supGate(AQ_NAME, aqConnect, function (ok) { if (ok && AQ.state === "off") aqConnect(); else aqUI(); });
  }
  function aqConnect() {
    if (!aqBt() || AQ.state !== "off") return;
    var gen = ++AQ.gen, req;
    AQ.err = "";
    aqSet("busy");
    aqMsg("Choose your Aranet4…");
    try {
      req = navigator.bluetooth.requestDevice({ filters: [{ namePrefix: "Aranet4" }, { services: [AQ_SVC] }, { services: [AQ_SVC_OLD] }],
        optionalServices: [AQ_SVC, AQ_SVC_OLD, "battery_service", "device_information"] });
    } catch (e) { aqFail(aqErr(e.name || "Error", "choose", e.message), gen); return; }
    req.then(function (dev) {
      if (gen !== AQ.gen) return;
      if (AQ.dev && AQ.dev !== dev) AQ.dev.removeEventListener("gattserverdisconnected", aqDrop);
      AQ.dev = dev; AQ.name = dev.name || "Aranet4"; AQ.wantOn = true; AQ.fails = 0; AQ.chr = null;
      dev.removeEventListener("gattserverdisconnected", aqDrop);
      dev.addEventListener("gattserverdisconnected", aqDrop);
      aqRead(true);
    }, function (e) { aqFail(aqErr((e && e.name) || "Error", "choose", e && e.message), gen); });
  }
  /* One reading: link up again if the link has dropped (the Aranet4 lets an idle link go), find the readings,
     read them. The first time, the phone or computer may ask for the six-digit code on the monitor's screen,
     so reading has longer to answer, with a word about it after four seconds. Then the next reading when the
     monitor has a new one (its interval less the seconds since its last, a few seconds over), or in a minute. */
  function aqRead(first) {
    var gen = AQ.gen, dev = AQ.dev, k = "link";
    var chk = function (v) { if (gen !== AQ.gen || !AQ.wantOn) throw aqErr("AbortError", k); return v; };
    var say = function (key) { k = key; if (first) aqMsg("Connecting to " + AQ.name + ": " + AQ_STEPS[key][0] + "…"); };
    var chr;
    if (dev.gatt.connected && AQ.chr) chr = Promise.resolve(AQ.chr);
    else {
      say("link");
      chr = aqLimit(dev.gatt.connect(), AQ_STEPS.link[1], "link").then(chk)
        .then(function (srv) {
          say("service");
          var svc = srv.getPrimaryService(AQ_SVC).catch(function () { return srv.getPrimaryService(AQ_SVC_OLD); });
          return aqLimit(svc.then(function (s) { return s.getCharacteristic(AQ_DET).catch(function () { return s.getCharacteristic(AQ_CUR); }); }), AQ_STEPS.service[1], "service");
        }).then(chk)
        .then(function (c) { AQ.chr = c; return c; });
    }
    chr.then(function (c) {
      say("read");
      if (first) { clearTimeout(AQ.hintT); AQ.hintT = setTimeout(function () { if (gen === AQ.gen && AQ.state === "busy") aqMsg("Connecting to " + AQ.name + ": reading the CO₂… If your phone or computer asks for a code, type the six digits shown on the monitor's screen."); }, 4000 * aqScale()); }
      return aqLimit(c.readValue(), first ? AQ_STEPS.read[1] : 15000, "read");
    }).then(chk)
      .then(function (dv) {
        clearTimeout(AQ.hintT);
        var r = aqParse(dv);
        AQ.fails = 0; AQ.err = "";
        if (AQ.state !== "on") aqSet("on");
        aqMsg("");
        AQ.wait = !r || !r.ppm;
        if (r) AQ.batt = r.batt;
        if (r && r.ppm) aqKeep({ ppm: r.ppm, at: Date.now() - Math.min(r.ago || 0, 3600) * 1000, src: "monitor", name: AQ.name, temp: r.temp, rh: r.rh, batt: r.batt });
        else aqUI();
        aqNext(r && r.interval ? Math.max(20, Math.min(600, r.interval - (r.ago || 0) + 5)) : 60);
      })
      .catch(function (e) {
        clearTimeout(AQ.hintT);
        if (gen !== AQ.gen || e.name === "AbortError") return;
        AQ.chr = null;
        if (first) { aqFail(e, gen); return; }
        AQ.fails++;                                          // a missed reading: try again in half a minute, three times
        if (AQ.fails >= 3) aqFail(aqErr(e.name, "lost"), gen);
        else { aqUI(); aqNext(30); }
      });
  }
  function aqNext(secs) {
    clearTimeout(AQ.timer);
    var gen = AQ.gen;
    AQ.timer = setTimeout(function () { if (gen === AQ.gen && AQ.wantOn && AQ.state === "on") aqRead(false); }, secs * 1000 * aqScale());
  }
  function aqDrop() { AQ.chr = null; }                       // the next reading links up again
  function aqStopAll() {
    AQ.wantOn = false; AQ.gen++;
    clearTimeout(AQ.timer); clearTimeout(AQ.hintT);
    try { if (AQ.dev && AQ.dev.gatt.connected) AQ.dev.gatt.disconnect(); } catch (e) {}
    AQ.chr = null; AQ.wait = false;
  }
  function aqCancel() { aqStopAll(); aqMsg(""); aqSet("off"); }
  function aqDisconnect() { aqStopAll(); aqMsg(""); aqSet("off"); }
  function aqFail(e, gen) {
    if (gen !== undefined && gen !== AQ.gen) return;
    var n = e.name, k = e.step;
    aqStopAll();
    AQ.err = k === "choose" ? aqChooseMsg(e, "monitor", "Connect an Aranet4")
      : k === "service" && n === "NotFoundError" ? "This device has no Aranet4 readings that Entrain can find. It reads the Aranet4; for any other CO₂ monitor, type its reading below."
      : k === "read" && (n === "SecurityError" || n === "NotAllowedError") ? "The Aranet4 asked to pair and it didn't go through. When your phone or computer asks, type the six-digit code shown on the monitor's screen, then press Connect an Aranet4 again."
      : k === "lost" ? "The monitor stopped answering, so its last reading stays until it's two hours old. Keep it within a few metres, and press Connect an Aranet4 again."
      : n === "TimeoutError" && AQ_STEPS[k] ? "The Aranet4 didn't answer while " + AQ_STEPS[k][0] + ". If your phone or computer asked for a code, type the six digits shown on the monitor's screen; close the Aranet app on any phone nearby, since it can hold on to the monitor; then press Connect an Aranet4 again."
      : "The connection didn't work (the browser said " + n + " while " + (AQ_STEPS[k] ? AQ_STEPS[k][0] : "connecting") + "). Switch Bluetooth off and on, and try again.";
    aqMsg("");
    aqSet("off");
  }
  function aqSet(st) { AQ.state = st; aqUI(); }
  function aqMsg(s) { AQ.msgTxt = s; bSetT("#aqMsg", s); }

  /* ----- the oximeter ----- */
  // an IEEE-11073 16-bit float: a 4-bit exponent and a 12-bit mantissa; not a number, not at this resolution and the infinities: null
  function oxSf(v) {
    if (v === 0x07ff || v === 0x0800 || v === 0x07fe || v === 0x0802 || v === 0x0801) return null;
    var m = v & 0x0fff, e = v >> 12;
    if (m >= 0x0800) m -= 0x1000;
    if (e >= 8) e -= 16;
    return m * Math.pow(10, e);
  }
  /* A PLX measurement: flags, then SpO2 and pulse rate; then, as the flags say, (continuous) the fast and slow
     averages, or (spot-check) a time stamp; then the measurement status (16 bits), the device and sensor status
     (24 bits) and the pulse amplitude index. */
  function oxParse(dv, cont) {
    if (!dv || dv.byteLength < 5) return null;
    var f = dv.getUint8(0), i = 5, n = dv.byteLength, r = { spo2: oxSf(dv.getUint16(1, true)), pr: oxSf(dv.getUint16(3, true)), ms: 0, dss: 0, pi: null };
    if (cont) { if (f & 1) i += 4; if (f & 2) i += 4; }
    else if (f & 1) i += 7;
    var bit = cont ? 4 : 2;                                  // the status fields' flags sit two places higher in a continuous measurement
    if (f & bit && i + 2 <= n) { r.ms = dv.getUint16(i, true); i += 2; }
    if (f & (bit << 1) && i + 3 <= n) { r.dss = dv.getUint16(i, true) | (dv.getUint8(i + 2) << 16); i += 3; }
    if (f & (bit << 2) && i + 2 <= n) { r.pi = oxSf(dv.getUint16(i, true)); i += 2; }
    return r;
  }
  /* What a reading is worth: off (the sensor isn't on a finger), demo (demonstration or test data), none (no
     measurement, or a number that can't be SpO2), weak (the oximeter flags it questionable: a poor or erratic
     signal, low perfusion, a displaced sensor) or good. A weak reading still ends a hold when it's low: ending a
     hold sooner is always safe. */
  function oxQ(r) {
    if (!r) return "none";
    if (r.dss & ((1 << 11) | (1 << 15))) return "off";
    if (r.ms & ((1 << 10) | (1 << 11))) return "demo";
    if (r.ms & (1 << 13) || r.spo2 === null || !(r.spo2 > 0 && r.spo2 <= 100)) return "none";
    if (r.ms & ((1 << 14) | (1 << 15)) || r.dss & 0x75fe) return "weak";
    return "good";
  }
  function oxFresh() { return OX.state === "on" && OX.v !== null && bNow() - OX.at < OX_STALE; }
  function oxLow() { return oxFresh() && OX.v < OX_FLOOR; }
  function oxGo() {
    if (OX.state === "busy") { oxCancel(); return; }
    if (OX.state === "on" || OX.state === "lost") { oxDisconnect(); return; }
    if (!aqBt()) { oxUI(); return; }
    supGate(OX_NAME, oxConnect, function (ok) { if (ok && OX.state === "off") oxConnect(); else oxUI(); });
  }
  function oxConnect() {
    if (!aqBt() || OX.state !== "off") return;
    var gen = ++OX.gen, req;
    OX.err = ""; OX.drop = false;
    oxSet("busy");
    oxMsg("Choose your oximeter…");
    try {
      req = navigator.bluetooth.requestDevice({ filters: [{ services: [OX_SVC] }], optionalServices: ["battery_service", "device_information"] });
    } catch (e) { oxFail(aqErr(e.name || "Error", "choose", e.message), gen); return; }
    req.then(function (dev) {
      if (gen !== OX.gen) return;
      if (OX.dev && OX.dev !== dev) OX.dev.removeEventListener("gattserverdisconnected", oxLost);
      OX.dev = dev; OX.name = dev.name || "Oximeter"; OX.wantOn = true; OX.tries = 0; OX.v = null; OX.q = ""; OX.n = 0;
      dev.removeEventListener("gattserverdisconnected", oxLost);
      dev.addEventListener("gattserverdisconnected", oxLost);
      oxAttach();
    }, function (e) { oxFail(aqErr((e && e.name) || "Error", "choose", e && e.message), gen); });
  }
  // link up, find the service and its continuous measurement (or, failing that, its spot-checks), and ask for them
  function oxAttach() {
    var gen = ++OX.gen, dev = OX.dev;
    var chk = function (v) { if (gen !== OX.gen || !OX.wantOn) throw aqErr("AbortError", OX.step); return v; };
    var say = function (k) { OX.step = k; oxMsg("Connecting to " + OX.name + ": " + OX_STEPS[k][0] + (OX.tries > 0 ? ", try " + (OX.tries + 1) + " of " + OX_TRIES : "") + "…"); };
    if (OX.state !== "lost") oxSet("busy");
    say("link");
    aqLimit(dev.gatt.connect(), OX_STEPS.link[1], "link").then(chk)
      .then(function (srv) {
        say("service");
        return aqLimit(srv.getPrimaryService(OX_SVC).then(function (s) {
          return s.getCharacteristic(OX_CONT).then(function (c) { return { c: c, cont: true }; }, function () {
            return s.getCharacteristic(OX_SPOT).then(function (c) { return { c: c, cont: false }; });
          });
        }), OX_STEPS.service[1], "service");
      }).then(chk)
      .then(function (x) {
        oxUnhook();
        OX.chr = x.c; OX.cont = x.cont;
        OX.chr.addEventListener("characteristicvaluechanged", oxOnValue);
        say("read");
        return aqLimit(OX.chr.startNotifications(), OX_STEPS.read[1], "read");
      }).then(chk)
      .then(function () {
        OX.tries = 0; OX.err = "";
        oxMsg("");
        oxSet("on");
      })
      .catch(function (e) {
        if (gen !== OX.gen || e.name === "AbortError") return;
        if (OX.state === "lost" && OX.tries < OX_TRIES && e.name !== "NotFoundError") { oxRetry(); return; }
        oxFail(e, gen);
      });
  }
  function oxRetry() {
    OX.tries++;
    try { OX.dev.gatt.disconnect(); } catch (x) {}
    var gen = OX.gen;
    setTimeout(function () { if (gen === OX.gen && OX.wantOn) oxAttach(); }, 1500 * OX.tries * aqScale());
  }
  function oxLost() {
    if (!OX.wantOn || OX.state !== "on") return;            // still connecting: that try fails by itself
    oxSet("lost");
    oxMsg("The oximeter dropped out. Reconnecting…");
    oxRetry();
  }
  function oxUnhook() {
    if (OX.chr) { try { OX.chr.removeEventListener("characteristicvaluechanged", oxOnValue); } catch (e) {} }
    OX.chr = null;
  }
  function oxCancel() {
    OX.wantOn = false; OX.gen++; OX.drop = false;
    try { if (OX.dev) OX.dev.gatt.disconnect(); } catch (e) {}
    oxUnhook();
    oxMsg("");
    oxSet("off");
  }
  function oxDisconnect() {
    OX.wantOn = false; OX.gen++; OX.drop = false;
    try { if (OX.chr) OX.chr.stopNotifications().catch(function () {}); } catch (e) {}
    try { if (OX.dev) OX.dev.gatt.disconnect(); } catch (e) {}
    oxUnhook();
    OX.v = null; OX.q = "";
    oxMsg("");
    oxSet("off");
  }
  function oxFail(e, gen) {
    if (gen !== undefined && gen !== OX.gen) return;
    var n = e.name, k = e.step, was = OX.state;
    OX.wantOn = false; OX.drop = was === "lost";       // it dropped out and didn't come back (oxChips)
    try { if (OX.dev && k !== "choose") OX.dev.gatt.disconnect(); } catch (x) {}
    oxUnhook();
    OX.v = null;
    OX.err = k === "choose" ? aqChooseMsg(e, "oximeter", "Connect an oximeter")
      : k === "service" && n === "NotFoundError" ? "This oximeter doesn't use Bluetooth's standard pulse oximeter service, so Entrain can't read it. Many low-cost fingertip oximeters use their own instead; one that lists Bluetooth's pulse oximeter profile (PLX) will work."
      : k === "read" && (n === "SecurityError" || n === "NotAllowedError") ? "The oximeter asked to pair and it didn't go through: accept the request when your phone or computer shows it, then press Connect an oximeter again."
      : was === "lost" ? "The oximeter dropped out and didn't come back. Switch it off and on, and press Connect an oximeter again."
      : n === "TimeoutError" && OX_STEPS[k] ? "The oximeter didn't answer while " + OX_STEPS[k][0] + ". Switch it off and on with your finger in it, close its own app on any phone nearby, since it can hold on to it, and press Connect an oximeter again."
      : "The connection didn't work (the browser said " + n + " while " + (OX_STEPS[k] ? OX_STEPS[k][0] : "connecting") + "). Switch the oximeter off and on, and try again.";
    oxMsg("");
    oxSet("off");
  }
  function oxOnValue(e) {
    var r = oxParse(e.target.value, OX.cont), q = oxQ(r);
    OX.q = q; OX.n++;
    if (q === "good" || q === "weak") {
      OX.v = Math.round(r.spo2); OX.at = bNow();
      OX.pr = r.pr > 20 && r.pr < 300 ? Math.round(r.pr) : null;
      OX.pi = r.pi !== null && r.pi >= 0 && r.pi < 100 ? r.pi : null;
    }
    oxCheck();
    oxUI();
  }
  function oxSet(st) { OX.state = st; if (st === "on") P.oxHad = true; oxUI(); }
  function oxMsg(s) { OX.msgTxt = s; bSetT("#oxMsg", s); }
  function oxSay(text) {
    if (!window.speechSynthesis || !window.SpeechSynthesisUtterance) return;
    try {
      var u = new SpeechSynthesisUtterance(text), v = pVoice();
      if (v) { u.voice = v; u.lang = v.lang; } else u.lang = "en-GB";
      speechSynthesis.cancel(); speechSynthesis.speak(u);
    } catch (e) {}
  }

  /* ----- a breath hold, ended by a low reading ----- */
  // each reading: a practice's hold, or Breathe's pattern with holds in it
  function oxCheck() {
    if (!oxLow()) return;
    if (P.state === "running") { oxTick(P.steps[P.idx]); return; }
    if (B.state === "running" && !P.usesB && !B.finder && (BC.hold > 0 || BC.rest > 0)) oxBreatheEnd();
  }
  // every tick of a practice (practice.js): a hold that starts while the reading is still low ends at once too
  function oxTick(s) {
    if (!s || s.k !== "hold" || P.state !== "running" || !oxLow()) return;
    var v = OX.v;
    (P.oxAt = P.oxAt || []).push(v);
    if (P.idx >= P.steps.length - 1) { pFinish(true); oxSay("Breathe now."); return; }      // a hold at the very end: the practice ends
    // the hold ends, and so does a hold straight after it (Wim Hof's recovery breath): breathing comes first
    pAdvance();
    while (P.state === "running" && P.steps[P.idx] && P.steps[P.idx].k === "hold" && P.idx < P.steps.length - 1) pAdvance();
    pPause();
    bSetT("#sLine", "Breathe now. Your oxygen read " + v + "%, below " + OX_FLOOR + "%: breathe normally, and carry on when you're ready.");
    $("#sLine").classList.remove("ana");
    P.lineAt = bNow();
    pBell(0.5, 0, 523.25, 0, true);
    oxSay("Breathe now.");
  }
  // Breathe: the session ends there, with what to do
  function oxBreatheEnd() {
    var v = OX.v, bt = Math.max(0, breathTime());
    bEnd(bt > 0 ? locate(bt).count : 0, bt, "Breathe now: your oxygen read " + v + "%, below " + OX_FLOOR + "%. Breathe normally for a couple of minutes before anything else.");
    hBreath(bt, false);
    syncTransport(); updateHead(); draw();
    bSetT("#bLive", "Breathe now.");
    oxSay("Breathe now.");
  }
  function oxReset() { P.oxAt = []; P.oxHad = OX.state === "on" || OX.state === "lost"; }      // from pStart (practice.js); oxHad: it was connected in this practice
  function oxSummary(r) { if (P.oxAt && P.oxAt.length) r.ox = P.oxAt.slice(); }
  function oxNote(r) { return r.ox ? (r.ox.length === 1 ? "a hold ended at " + r.ox[0] + "% oxygen" : r.ox.length + " holds ended, at " + r.ox.join("%, ") + "% oxygen") : ""; }
  function oxTiles(r) {
    if (!r.ox) return [];
    return [["Oxygen", Math.min.apply(null, r.ox) + "%", r.ox.length === 1 ? "below " + OX_FLOOR + "%: a hold ended" : "below " + OX_FLOOR + "%: " + r.ox.length + " holds ended", "ox"]];
  }
  function oxExplain(k) {
    if (k !== "ox" || !SD.r || !SD.r.ox) return null;
    var o = SD.r.ox, p = [];
    p.push("Your oximeter read below " + OX_FLOOR + "% during a hold " + (o.length === 1 ? "once, at " + o[0] + "%" : o.length + " times, at " + o.join("%, ") + "%") +
      ", so the hold ended there and the practice paused for you to breathe.");
    p.push("A fingertip reading trails the blood by several seconds, so your oxygen may have gone a little lower than it showed. A low reading means the hold went far enough: next time, keep the holds shorter and easier, and breathe at the first strong urge.");
    p.push("It's a rough safety signal, not a score: a longer hold or a lower reading is never progress here.");
    return ["Oxygen", p];
  }
  // a practice's live chip, while an oximeter is connected, and when it drops out during the practice: holds then go unchecked
  function oxChips() {
    var gone = OX.state === "lost" ? "reconnecting" : OX.state === "off" && OX.drop && P.oxHad ? "dropped out" : "";
    if (gone) return ['<span class="lc off">Oximeter ' + gone + ((P.steps || []).some(function (s) { return s.k === "hold"; }) ? ": holds aren't checked" : "") + "</span>"];
    if (OX.state !== "on" || !OX.n) return [];
    if (!oxFresh()) return ['<span class="lc off">Oximeter: ' + (OX.q === "off" ? "no finger" : "no reading") + "</span>"];
    return ['<span class="lc ox' + (OX.v < OX_FLOOR ? " low" : "") + '">SpO₂ <b>' + OX.v + "</b>%</span>"];
  }

  /* ----- the pages: focus and sleep pages, a practice with holds ----- */
  // what a practice's page gets: work or focus (meditation), sleep, and holds
  function aqPracKinds(d, plan) {
    var k = [];
    if (d.goal === "focus") k.push(d.method === "meditate" ? "focus" : "work");
    else if (pSleepy(d)) k.push("sleep");
    if (plan && plan.steps.some(function (s) { return s.k === "hold"; })) k.push("hold");
    return k;
  }
  function aqTrackKinds(t) {
    return t.goal === "focus" ? ["work"] : t.goal === "sleep" || (t.also || []).indexOf("sleep") >= 0 ? ["sleep"] : [];
  }
  function aqSlot(kinds) { return kinds.length ? '<div class="aq-slot" data-aq="' + kinds.join(" ") + '">' + aqSlotIn(kinds) + "</div>" : ""; }
  function aqSlotIn(kinds) {
    var has = function (k) { return kinds.indexOf(k) >= 0; }, focus = has("work") || has("focus"), out = [];
    if (focus) out.push(aqAirHtml());
    if (aqTipsOn()) {
      if (focus) out.push(aqTipHtml("rosemary"));
      if (has("work")) out.push(aqTipHtml("gum"));
      if (has("sleep")) out.push(aqTipHtml("lavender"));
    }
    if (has("hold")) out.push(oxNoteHtml());
    return out.join("");
  }
  /* Air the room first; with a reading, what it says. It holds back for an hour once you say the room is aired,
     unless a newer reading is still high. */
  function aqAirHtml() {
    var r = aqNow(), on = aqPromptOn(), hi = aqHigh(r);
    if (aqAired(r) || (!r && !on)) return "";
    var ic = '<svg class="i" aria-hidden="true"><use href="#i-wind"/></svg>', btn = '<button type="button" class="btn aq-done" data-aq-aired="1">It\'s aired</button>';
    if (r && !hi) return '<div class="aq-air" data-hi="0">' + ic + '<p><b>Room air: ' + aqNum(r.ppm) + " ppm</b> of CO₂, " + aqAgo(r.at) + " (" + esc(aqFrom(r)) + "): below about 900 ppm, fresh enough for focus.</p></div>";
    if (r) return '<div class="aq-air" data-hi="1">' + ic + "<p><b>Open a window.</b> Your room air read <b>" + aqNum(r.ppm) + " ppm</b> of CO₂ " + aqAgo(r.at) + " (" + esc(aqFrom(r)) + "), " +
      'above about 900 ppm, where test scores were lower in office studies. A few minutes with a window open lets fresh air in. <a href="#l-air">Why</a></p>' + btn + "</div>";
    return '<div class="aq-air" data-hi="">' + ic + "<p><b>Air the room first.</b> Open a window for a few minutes before you start: fresh air, with less CO₂, goes with clearer thinking. " +
      '<a href="#l-air">Why</a> · <a href="#air">Add a CO₂ reading</a></p>' + btn + "</div>";
  }
  function aqTipHtml(k) {
    var t = AQ_TIPS[k], scent = k !== "gum";
    return '<p class="aq-tip"><b>' + t[0] + "</b> " + t[1] + ' <a href="' + t[2] + '">More in Learn</a>' +
      (scent ? '<span class="aq-safe">' + SAFE_SCENT + ' <button type="button" class="sf-link" data-safety="1">Safety notes</button></span>' : "") + "</p>";
  }
  function oxNoteHtml() {
    var on = OX.state === "on";
    return '<p class="aq-tip ox-tip"><b>Blood oxygen.</b> ' + (on ? "Your oximeter is connected: a reading below " + OX_FLOOR + "% during a hold ends it, with “Breathe now”."
      : 'With a fingertip oximeter connected on <a href="#ox">the Heart page</a>' + supTag(true) + ", a reading below " + OX_FLOOR + "% during a hold ends it, with “Breathe now”.") +
      " A rough safety signal: it only ever ends a hold sooner, and a good reading is no reason to hold on.</p>";
  }
  // every slot on the pages that are open, with what's true now (a new reading, a choice, an unlock)
  function aqSlots() {
    document.querySelectorAll(".aq-slot").forEach(function (el) {
      var h = aqSlotIn((el.getAttribute("data-aq") || "").split(" ").filter(Boolean));
      if (el.aqHtml !== h) { el.aqHtml = h; el.innerHTML = h; }       // only when it changes (the browser writes markup back its own way)
    });
  }

  /* ----- Settings: Air and scent ----- */
  function aqCard() {
    return '<section class="st-card" id="st-air" aria-labelledby="stAq"><h2 id="stAq">Air and scent</h2>' +
      '<p class="st-note">Fresh air goes with clearer thinking, and the evidence for it is strong; scents and chewing gum have early evidence only, so they come as optional tips. <a href="#l-air">What the research says</a></p>' +
      pToggle("aqPromptOn", AQ_PROMPT + '<span class="aq-cup">' + supTag(true) + "</span>", aqPromptOn(),
        "A reminder to open a window on the page of each focus practice, focus track and the custom primer, with your room's CO₂ when there's a reading from the last two hours.") +
      pToggle("aqTipsOn", "Scent and chewing-gum tips", aqTipsOn(),
        "Rosemary on focus pages, lavender on sleep pages and chewing gum before focused work, each with its safety line.") +
      hcBox(["scent"]) +
      '<p class="st-note">A CO₂ monitor and a fingertip oximeter connect on the Heart page: <a href="#air">Room air</a> and <a href="#ox">Blood oxygen</a>.</p>' +
      "</section>";
  }
  function aqStWire() {
    var p = $("#aqPromptOn"), t = $("#aqTipsOn");
    if (!p) return;
    p.addEventListener("change", function () {
      var on = this.checked, go = function () { store.set("airPrompt", on ? "1" : "0"); aqUI(); };
      if (!on || supOn()) go();
      else { this.checked = false; supGate(AQ_PROMPT, go, function (ok) { if (ok) go(); else aqUI(); }); }
    });
    t.addEventListener("change", function () { store.set("airTips", this.checked ? "1" : "0"); aqUI(); });
  }

  /* ----- the Heart page's boxes, and everything else that shows them ----- */
  function aqUI() {
    aqSlots();
    var p = $("#aqPromptOn");
    if (p) {
      p.checked = aqPromptOn();
      var cup = $("#st-air .aq-cup");
      if (cup && cup.innerHTML !== supTag(true)) cup.innerHTML = supTag(true);      // the cup while locked, gone after an unlock
    }
    if ($("#aqTipsOn")) $("#aqTipsOn").checked = aqTipsOn();
    var box = $("#air");
    if (!box) return;
    var st = AQ.state, sup = aqBt(), r = aqNow();
    box.dataset.state = st;
    bSetT("#aqPillTxt", st === "on" ? "Connected" : st === "busy" ? "Connecting…" : "Not connected");
    bSetT("#aqGoTxt", st === "on" ? "Disconnect" : st === "busy" ? "Cancel" : "Connect an Aranet4");
    var go = $("#aqGo");
    go.disabled = !sup;
    aqCup(go, st === "off");
    aqCup($("#aqSave"), true, true);
    $("#aqNo").hidden = sup;
    var err = st === "off" ? AQ.err : "";
    bSetT("#aqErr", err); $("#aqErr").hidden = !err;
    bSetT("#aqHint", st === "on" ? AQ.name + (AQ.batt !== null && AQ.batt !== undefined ? " · battery " + AQ.batt + "%" : "") : "For focus sessions");
    var now = $("#aqNow");
    now.hidden = !r;
    if (r) {
      var hi = aqHigh(r);
      if (now.dataset.hi !== (hi ? "1" : "0")) now.dataset.hi = hi ? "1" : "0";
      bSetT("#aqPpm", aqNum(r.ppm));
      bSetT("#aqVerdict", hi ? "Above about 900 ppm: open a window for a few minutes." : "Below about 900 ppm: fresh enough for focus.");
      bSetT("#aqAge", aqAgo(r.at) + ", " + aqFrom(r) + (r.src === "monitor" && r.temp ? " · " + r.temp.toFixed(1) + " °C, " + r.rh + "% humidity" : ""));
    }
    bSetT("#aqWait", st === "on" && AQ.wait ? "The monitor has no CO₂ reading yet: it measures every few minutes after it's switched on." : "");
  }
  // the cup on a button while this device is locked
  function aqCup(b, show, icon) {
    if (!b) return;
    var tag = b.querySelector(".sup-tag"), lk = !supOn() && show;
    if (tag && !lk) tag.parentNode.removeChild(tag);
    else if (!tag && lk) b.insertAdjacentHTML("beforeend", supTag(icon));
  }
  function oxUI() {
    aqSlots();
    var fresh = oxFresh(), bs = $("#bOxStat");
    if (bs) {
      var show = OX.state === "on" && fresh;
      if (bs.hidden !== !show) bs.hidden = !show;
      bSetT("#bOx", show ? String(OX.v) : "—");
      bs.classList.toggle("low", show && OX.v < OX_FLOOR);
    }
    var box = $("#ox");
    if (!box) return;
    var st = OX.state, on = st === "on", sup = aqBt();
    box.dataset.state = st;
    bSetT("#oxPillTxt", on ? "Connected" : st === "busy" ? "Connecting…" : st === "lost" ? "Reconnecting…" : "Not connected");
    bSetT("#oxGoTxt", on || st === "lost" ? "Disconnect" : st === "busy" ? "Cancel" : "Connect an oximeter");
    var go = $("#oxGo");
    go.disabled = !sup;
    aqCup(go, st === "off");
    $("#oxNo").hidden = sup;
    var err = st === "off" ? OX.err : "";
    bSetT("#oxErr", err); $("#oxErr").hidden = !err;
    bSetT("#oxHint", on ? OX.name : "A safety signal for breath holds");
    $("#oxOn").hidden = !on;
    if (!on) return;
    var low = fresh && OX.v < OX_FLOOR;
    bSetT("#oxV", fresh ? String(OX.v) : "—");
    bSetT("#oxVS", fresh ? (low ? "Below " + OX_FLOOR + "%" : "SpO₂") : OX.q === "off" ? "No finger in the oximeter" : OX.n ? "No reading just now" : "Waiting for a reading");
    $("#oxV").closest(".hr-tile").dataset.low = low ? "1" : "";
    bSetT("#oxPr", fresh && OX.pr ? String(OX.pr) : "—");
    bSetT("#oxQ", !OX.n ? "…" : OX.q === "good" ? "Good" : OX.q === "weak" ? "Weak" : OX.q === "off" ? "No finger" : OX.q === "demo" ? "Demonstration data" : "No reading");
    bSetT("#oxRead", !OX.n ? "Rest your hand and keep the finger still while it finds your pulse."
      : OX.q === "demo" ? "The oximeter says it's sending demonstration or test data, so Entrain leaves it out: switch that mode off on the oximeter."
      : OX.q === "off" || !fresh ? "No usable reading: put a fingertip all the way in, rest your hand, and keep still."
      : low ? "Below " + OX_FLOOR + "%. During a breath hold this ends the hold. At rest, check the oximeter sits well, warm your hands and keep still; if low readings keep coming at rest, talk to a doctor."
      : OX.q === "weak" ? "The oximeter has doubts about this reading (a weak or unsteady signal): keep your hand still and warm."
      : "Breath holds, in Wim Hof Breathing or on Breathe, now end at once if a reading falls below " + OX_FLOOR + "%.");
  }

  function aqInit() {
    aqLoad();
    $("#aqGo").addEventListener("click", aqGo);
    $("#aqForm").addEventListener("submit", function (e) { e.preventDefault(); aqType(); });
    $("#oxGo").addEventListener("click", oxGo);
    document.addEventListener("click", function (e) {
      var b = e.target.closest ? e.target.closest("[data-aq-aired]") : null;
      if (!b) return;
      store.set("airAt", String(Date.now()));
      aqSlots();
      toast("Aired. The reminder rests for an hour.", { ms: 3500 });
    });
    SUP_EXTRA.push({ name: AQ_PROMPT, href: "#st-air" }, { name: AQ_NAME, href: "#air" }, { name: OX_NAME, href: "#ox" });     // Settings' list of what the donation unlocks
    window.addEventListener("pagehide", function () { if (AQ.state !== "off") aqDisconnect(); if (OX.state !== "off") oxDisconnect(); });
    setInterval(function () { if (document.querySelector(".aq-slot")) aqSlots(); if (AQ.last && !$("#v-heart").hidden) aqUI(); }, 30000);    // ages, and a reading that has gone stale
    aqUI(); oxUI();
    if (window.__entrain) {
      var X = window.__entrain;
      X.AQ = AQ; X.OX = OX; X.aqParse = aqParse; X.oxParse = oxParse; X.oxSf = oxSf; X.oxQ = oxQ; X.aqNow = aqNow; X.aqSlotIn = aqSlotIn; X.aqPracKinds = aqPracKinds;
      X.aqPromptOn = aqPromptOn; X.oxLow = oxLow; X.AQ_TIPS = AQ_TIPS; X.SAFE_SCENT = SAFE_SCENT;
    }
  }
