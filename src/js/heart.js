  /* ------------------------- live heart data -------------------------
     Any sensor that speaks the standard Bluetooth Heart Rate Service
     (0x180D) works: a Garmin watch set to Broadcast Heart Rate, an ear-clip
     sensor or a chest strap. Each notification carries a heart rate and,
     from beat-to-beat sensors, zero or more RR intervals in 1/1024 s.
     Watches send heart rate only, so RMSSD lights up only when RR arrives.

     The biofeedback measure is the heart-rate swing within each breath
     (peak minus trough), one of the standard criteria for finding a
     person's resonance breathing rate (Shaffer & Meehan 2020). Taking the
     max-min over a whole breath makes it insensitive to the few seconds of
     smoothing lag in a watch's optical heart rate.
  -------------------------------------------------------------------- */

  var H = {
    dev: null, chr: null, state: "off", name: "", wantOn: false, tries: 0,
    hr: 0, lastAt: 0, hasRR: false, contact: null,
    beats: [],                 // {t, rr}: beat-to-beat intervals from the last 5 minutes
    series: [],                // {t, hr}: every heart-rate point (per beat, or per notification), last 5 minutes
    since: 0, coh: null,       // when continuous data began; the latest coherence result
    pulseT: 0, tickT: 0, cohT: 0, find: null,
    gen: 0, attaching: false, attempt: 0, step: "",  // connecting: which try, and which step it's on
    log: [], offered: null     // what went wrong on each try; the services a sensor offers when the heart-rate one is missing
  };
  var FIND_RATES = [6.5, 6, 5.5, 5, 4.5], FIND_STEP = 120;

  function hrSupported() { return !!(navigator.bluetooth && navigator.bluetooth.requestDevice); }
  function hrLive() { return H.state === "on" && H.hr > 0 && bNow() - H.lastAt < 5; }

  function hrSetState(st, pill) {
    H.state = st;
    $("#hr").dataset.state = st;
    bSetT("#hrPillTxt", pill);
    ["#hrConnect", "#gConnect"].forEach(function (sel) {
      bSetT(sel, (st === "on" || st === "lost") ? "Disconnect" : st === "busy" ? (H.attaching ? "Cancel" : "Connecting…") : "Connect sensor");
      $(sel).disabled = !hrSupported();
      $(sel).setAttribute("aria-disabled", st === "busy" && !H.attaching ? "true" : "false");   // busy, not disabled, so the button you pressed keeps the focus
    });
    $("#hrAny").hidden = st === "on" || st === "lost" || !hrSupported();
    finderUI();
    hrTiles();
    hrLayout();
  }
  function hrMsg(s) { bSetT("#hrMsg", s || ""); }

  /* What you need first. Before a sensor is on: connecting, the guide, and the resonance test,
     which keeps your last result and its pace; on a phone the empty numbers and charts follow.
     Once one is on: your live numbers, the breath-by-breath chart, the test and the spectrum,
     with the guide at the bottom for when something goes wrong. A wide screen keeps the charts
     and the test side by side. The boxes move in the page itself, so the keyboard follows the
     same order as the eye. */
  var HR_NARROW = window.matchMedia ? window.matchMedia("(max-width: 880px)") : { matches: true };
  function hrPlace(el, parent, before) {
    if (!el || (el.parentNode === parent && el.nextElementSibling === before)) return;
    var had = document.activeElement && el.contains(document.activeElement) ? document.activeElement : null;
    parent.insertBefore(el, before);
    if (had) try { had.focus({ preventScroll: true }); } catch (e) { had.focus(); }
  }
  function hrLayout() {
    var hr = $("#hr"), on = H.state === "on" || H.state === "lost", tiles = hr.querySelector(".hr-tiles"), body = hr.querySelector(".hr-body");
    if (!tiles || !body) return;
    var g = $("#connect"), fromGuide = on && g.nextElementSibling !== null && g.contains(document.activeElement);
    hrPlace(g, hr, on ? null : tiles);
    if (fromGuide) $("#hrConnect").focus();     // connected from the guide: it folds away at the bottom, and its twin at the top takes the focus
    if (on || !HR_NARROW.matches) hrPlace($("#resonance-test"), body, body.querySelector(".hr-spec"));
    else hrPlace($("#resonance-test"), hr, tiles);
  }

  /* `any` opens the browser's chooser on every nearby device, for sensors
     that offer the heart-rate service but don't advertise it. */
  function hrConnect(any) {
    if (H.state === "busy") { if (H.attaching) hrCancel(); return; }   // the chooser is open, or Cancel was pressed
    if (H.state === "on" || H.state === "lost") { hrDisconnect(); return; }
    if (!hrSupported()) return;
    hrMsg("");
    hrSetState("busy", "Choose your sensor…");
    // battery and device information too, so that a sensor without the heart-rate service can say what it does offer
    var opts = any === true
      ? { acceptAllDevices: true, optionalServices: ["heart_rate", "battery_service", "device_information"] }
      : { filters: [{ services: ["heart_rate"] }], optionalServices: ["battery_service", "device_information"] };
    var req;
    try { req = navigator.bluetooth.requestDevice(opts); } catch (e) { hrFail(e); return; }
    req.then(function (dev) {
      if (H.dev && H.dev !== dev) H.dev.removeEventListener("gattserverdisconnected", hrLost);
      H.dev = dev;
      H.name = dev.name || "Heart-rate sensor";
      H.wantOn = true;
      H.tries = 0;
      H.hasRR = false;
      H.beats = [];
      H.series = [];
      H.coh = null;
      dev.removeEventListener("gattserverdisconnected", hrLost);
      dev.addEventListener("gattserverdisconnected", hrLost);
      return hrAttach();
    }).catch(hrFail);
  }
  /* Connecting takes three steps, each with a deadline, so a sensor that stops answering can't leave
     the page on Connecting…: link up, find the heart-rate service, start the readings. A step that
     fails or runs out of time starts again from the top, up to three tries in all, the later ones
     with a pause after linking up, since on Android a second try often goes through. The last two
     steps allow half a minute, long enough to confirm a pairing request on the watch or the phone,
     and after a few seconds the message says to. While it runs the button reads Cancel, and the
     message under it says which step it's on. */
  var HR_STEPS = { link: ["linking up", 15000], service: ["finding its heart-rate service", 30000], read: ["starting its heart-rate readings", 30000] };   // ms each try
  var HR_TRIES = 3, HR_HINT = 4000;
  var HR_SVC = { "180d": "heart rate", "180f": "battery", "180a": "device information" };
  function hrPairHint() {
    return hrGarmin() ? "If your watch shows your phone's name or a code, confirm it on the watch, and accept the pairing request on the phone if one appears."
      : "If your phone asks to pair, accept it.";
  }
  function hrErr(name, step, msg) { var e = new Error(msg || name); e.name = name; e.step = step; return e; }
  function hrWait(ms) { return new Promise(function (r) { setTimeout(r, ms * (window.__hrScale || 1)); }); }
  function hrStep(p, k) {
    var sc = window.__hrScale || 1, line = "Connecting to " + H.name + ": " + HR_STEPS[k][0] + (H.attempt > 1 ? ", try " + H.attempt + " of " + HR_TRIES : "") + "…";   // the scale is for the tests
    H.step = k;
    hrMsg(line);
    guideCheck();
    return new Promise(function (ok, no) {
      var hint = k === "link" ? 0 : setTimeout(function () { if (H.step === k && H.attaching) hrMsg(line + " " + hrPairHint()); }, HR_HINT * sc);
      var t = setTimeout(function () { clearTimeout(hint); no(hrErr("TimeoutError", k)); }, HR_STEPS[k][1] * sc);
      p.then(function (v) { clearTimeout(t); clearTimeout(hint); ok(v); },
        function (e) { clearTimeout(t); clearTimeout(hint); no(hrErr((e && e.name) || "Error", k, e && e.message)); });
    });
  }
  // the heart-rate service, or, if there's none, which of the services the page may ask about it does offer
  function hrService(srv) {
    H.offered = null;
    return srv.getPrimaryService("heart_rate").catch(function (e) {
      if (!e || e.name !== "NotFoundError" || !srv.getPrimaryServices) throw e;
      return srv.getPrimaryServices().then(function (l) {
        H.offered = l.map(function (s) { var u = String(s.uuid || "").toLowerCase(); return HR_SVC[u.slice(4, 8)] || u; });
        throw e;
      }, function () { H.offered = []; throw e; });
    });
  }
  /* What the phone reported on each try, word for word, for the message when every try fails,
     so that it can be passed on when asking for help: "each of the 3 tries, no answer within
     30 seconds while finding its heart-rate service", or one line a try when they differ. */
  function hrDetail() {
    var one = function (x) {
      var st = HR_STEPS[x.s] ? HR_STEPS[x.s][0] : "connecting";
      var t = x.n === "TimeoutError" && HR_STEPS[x.s] ? "no answer within " + Math.round(HR_STEPS[x.s][1] / 1000) + " seconds while " + st
        : x.n + " while " + st + (x.m && x.m !== x.n ? ": " + String(x.m).replace(/\.\s*$/, "") : "");
      if (x.o) t += x.o.length ? ", and it showed only " + x.o.slice(0, -1).join(", ") + (x.o.length > 1 ? " and " : "") + x.o[x.o.length - 1]
        : ", and it showed none of the heart rate, battery or device information services";
      return t;
    };
    var l = H.log.map(one);
    if (!l.length) return "";
    var same = l.every(function (t) { return t === l[0]; });
    return " (What happened: " + (same ? (l.length > 1 ? "each of the " + l.length + " tries, " : "") + l[0]
      : l.map(function (t, i) { return "try " + (i + 1) + ", " + t; }).join("; ")) + ".)";
  }
  /* Worth another try: a step that ran out of time or broke off, a service missing from a list the
     phone kept from before, or readings refused because a pairing request wasn't accepted in time. */
  function hrRetryable(e) {
    return /^(TimeoutError|NetworkError|NotSupportedError|InvalidStateError|UnknownError|OperationError)$/.test(e.name)
      || (e.name === "NotFoundError" && e.step === "service")
      || (/^(SecurityError|NotAllowedError)$/.test(e.name) && e.step === "read");
  }
  function hrAttach() {
    var gen = ++H.gen, dev = H.dev, stale = function () { return gen !== H.gen || !H.wantOn; };
    H.attaching = true;
    H.attempt = 0;
    H.log = [];
    var go = function () {
      H.attempt++;
      hrSetState("busy", "Connecting to " + H.name + "…");
      return hrStep(dev.gatt.connect(), "link")
        .then(function (srv) {
          return (H.attempt > 1 ? hrWait(800) : Promise.resolve()).then(function () {
            return hrStep(hrService(srv).then(function (svc) { return svc.getCharacteristic("heart_rate_measurement"); }), "service");
          });
        })
        .then(function (chr) {
          if (stale()) throw hrErr("AbortError", "read");
          if (H.chr) H.chr.removeEventListener("characteristicvaluechanged", hrOnValue);
          H.chr = chr;
          chr.addEventListener("characteristicvaluechanged", hrOnValue);
          return hrStep(chr.startNotifications(), "read");
        })
        .catch(function (e) {
          if (stale()) throw hrErr("AbortError", e.step);
          H.log.push({ s: e.step, n: e.name, m: e.message, o: e.name === "NotFoundError" && e.step === "service" ? H.offered : null });
          if (H.attempt < HR_TRIES && hrRetryable(e)) {
            try { if (dev.gatt.connected) dev.gatt.disconnect(); } catch (x) {}
            return hrWait(1000).then(function () { if (stale()) throw hrErr("AbortError", e.step); return go(); });
          }
          throw e;
        });
    };
    return go().then(function () {
        if (gen !== H.gen) { try { dev.gatt.disconnect(); } catch (x) {} return; }   // cancelled while the last step finished
        H.attaching = false; H.step = "";
        H.tries = 0;
        H.connAt = bNow();
        store.set("hrEver", "1");
        if (H.guideAuto) { $("#connect").open = false; H.guideAuto = false; }
        hrMsg("");
        bSetT("#hrTitle", H.name);
        hrSetState("on", "Connected");
        clearInterval(H.tickT);
        H.tickT = setInterval(hrTiles, 1000);
        H.since = 0;                     // a reconnect leaves a gap, so coherence starts its 64 s again
        clearInterval(H.cohT);
        H.cohT = setInterval(cohTick, 5000);
        hrPulse();
      }, function (e) {
        if (gen === H.gen) { H.attaching = false; H.step = ""; }
        throw e;
      });
  }
  function hrCancel() {
    H.gen++;
    H.wantOn = false;
    H.attaching = false; H.step = "";
    try { if (H.dev && H.dev.gatt.connected) H.dev.gatt.disconnect(); } catch (e) {}
    hrSetState("off", "Not connected");
    hrMsg("Stopped connecting. Press Connect sensor to try again.");
  }
  function hrGarmin() { return /venu|forerunner|f[eē]nix|epix|vivoactive|vívoactive|instinct|enduro|garmin|approach|descent|marq|quatix|tactix|lily|bounce/i.test(H.name); }
  function hrFail(e) {
    var n = e && e.name, s = e && e.step;
    if (n === "AbortError") return;                     // Cancel was pressed: it has said so already
    H.wantOn = false;
    H.attaching = false; H.step = "";
    try { if (H.dev && H.dev.gatt.connected) H.dev.gatt.disconnect(); } catch (x) {}
    hrSetState("off", "Not connected");
    // Garmin Connect, running on the same phone, can keep hold of the watch so another app's connection never finishes
    var g = hrGarmin() ? " If it keeps happening, Garmin Connect on this phone may be holding on to the watch: in your phone's Settings, open Apps, then Garmin Connect, and tap Force stop, then connect here again. Open Garmin Connect afterwards to sync as usual." : "";
    var said = s ? hrDetail() : "";
    var pair = hrGarmin() ? " If your watch showed your phone's name or a code, confirm it on the watch next time (there's half a minute), and accept the pairing request on the phone if one appears; on some phones it waits in the notifications."
      : " If your phone asked to pair with it (the request can also sit in the notifications), accept it next time.";
    if (s === "link") {
      hrMsg("Couldn't link up with " + H.name + " after " + HR_TRIES + " tries. Keep it close, check that it's still broadcasting, and try again." + g + said);
    } else if (s === "service" && n === "NotFoundError") {
      hrMsg(H.name + " linked up but doesn't offer the standard heart-rate service." + (hrGarmin()
        ? " A Garmin watch offers it only while Broadcast Heart Rate is on, so check that it is. If it is, the watch may be answering this phone as the one it syncs with in Garmin Connect rather than as a heart-rate receiver; a tablet or computer that isn't paired with the watch can usually connect to its broadcast." : " This page can't read it.") + said);
    } else if (s === "service") {
      hrMsg(H.name + " linked up but didn't share its heart-rate service." + pair + " Otherwise turn your phone's Bluetooth off and on, restart the broadcast, and try again." + g + said);
    } else if (s === "read") {
      hrMsg(H.name + " linked up but didn't start sending its heart rate." + pair + " Otherwise turn your phone's Bluetooth off and on, restart the broadcast, and try again." + g + said);
    } else if (n === "NotFoundError" && H.dev && /service/i.test((e && e.message) || "")) {
      hrMsg(H.name + " doesn't offer the standard heart-rate service, so this page can't read it.");
    } else if (n === "NotFoundError") {
      hrMsg("No sensor was picked. A Garmin watch only shows up while Broadcast Heart Rate is on; other sensors need to be awake and not connected to another app.");
    } else if (n === "SecurityError" || n === "NotAllowedError") {
      hrMsg("This copy of the page isn't allowed to use Bluetooth. Open the page at its own web address in Chrome or Edge and connect from there.");
    } else {
      hrMsg("The sensor didn't answer. Check that it is on, broadcasting and close by, then try again." + (n ? " (The phone reported: " + n + (e.message && e.message !== n ? ": " + String(e.message).replace(/\.\s*$/, "") : "") + ".)" : ""));
    }
  }
  function hrLost() {
    if (!H.wantOn || H.attaching) return;             // a connection that drops while connecting is that attempt's to retry
    if (H.tries >= 5) {
      H.wantOn = false;
      hrSetState("off", "Not connected");
      hrMsg("Lost the connection to " + H.name + ". Press Connect sensor to try again.");
      return;
    }
    H.tries++;
    hrSetState("lost", "Reconnecting…");
    setTimeout(function () {
      if (!H.wantOn || !H.dev) return;
      hrAttach().catch(function () { hrLost(); });
    }, 1500 * H.tries);
  }
  function hrDisconnect() {
    H.wantOn = false;
    clearInterval(H.tickT);
    clearInterval(H.cohT);
    clearTimeout(H.pulseT);
    H.coh = null;
    drawSpectrum();
    try { if (H.chr) H.chr.removeEventListener("characteristicvaluechanged", hrOnValue); } catch (e) {}
    try { if (H.dev && H.dev.gatt.connected) H.dev.gatt.disconnect(); } catch (e) {}
    H.chr = null;
    H.hr = 0;
    bSetT("#hrTitle", "Pair a heart-rate sensor");
    hrSetState("off", "Not connected");
  }

  /* Heart Rate Measurement characteristic (0x2A37): flags, then 8- or 16-bit
     heart rate, optional energy expended, optional RR intervals. */
  function hrParse(dv) {
    var flags = dv.getUint8(0), i = 1, hr, rr = [];
    if (flags & 1) { hr = dv.getUint16(i, true); i += 2; } else { hr = dv.getUint8(i); i += 1; }
    if (flags & 8) i += 2;
    if (flags & 16) for (; i + 1 < dv.byteLength; i += 2) rr.push(dv.getUint16(i, true) * 1000 / 1024);
    return { hr: hr, rr: rr, contact: (flags & 4) ? !!(flags & 2) : null };
  }
  function hrOnValue(e) {
    var p, now = bNow();
    try { p = hrParse(e.target.value); } catch (err) { return; }
    H.contact = p.contact;
    if (p.contact === false || !(p.hr > 25 && p.hr < 240)) { hrTiles(); return; }
    H.hr = p.hr;
    if (!H.since || now - H.lastAt > 5) H.since = now;   // continuous data restarts after a gap
    H.lastAt = now;
    var series = [];
    if (p.rr.length) {
      // the last interval in a notification ends at about "now"; walk back from there
      H.hasRR = true;
      var t = now, beats = [];
      for (var j = p.rr.length - 1; j >= 0; j--) { beats.unshift({ t: t, rr: p.rr[j] }); t -= p.rr[j] / 1000; }
      beats.forEach(function (b) {
        if (b.rr < 300 || b.rr > 2000) return;          // outside 30-200 bpm: a dropout, not a beat
        H.beats.push(b);
        series.push({ t: b.t, hr: 60000 / b.rr });
      });
      while (H.beats.length && H.beats[0].t < now - 300) H.beats.shift();
    } else {
      series.push({ t: now, hr: p.hr });
    }
    series.forEach(function (pt) { H.series.push(pt); hrRecord(pt); });
    while (H.series.length && H.series[0].t < now - 300) H.series.shift();
    hrTiles();
  }
  function hrRecord(pt) {
    var now = bNow();
    if (P.state === "running") P.hr.push({ t: pT() - (now - pt.t), hr: pt.hr });
    if (B.state === "running") {
      var bt = breathTime() - (now - pt.t);
      if (bt >= 0) {
        var L = locate(bt);
        B.hr.push({ bt: bt, hr: pt.hr, n: L.count, cyc: L.ph.cycle });
      }
    }
    // a light log for binaural tracks: change since the first minute
    if (A.playing && A.ctx) {
      var el = A.ctx.currentTime - A.startedAt - (now - pt.t);
      if (!A.hrLog || A.hrLogTrack !== A.track || el < (A.hrLogLast || 0) - 3) { A.hrLog = []; A.hrLogTrack = A.track; }
      A.hrLog.push({ t: el, hr: pt.hr });
      A.hrLogLast = el;
    }
  }

  /* RMSSD over a window, skipping pairs that jump more than 25% (artefacts
     or ectopic beats). Needs at least 20 clean pairs. */
  function rmssd(t0, t1) {
    var b = H.beats.filter(function (x) { return x.t >= t0 && x.t <= t1; }), sq = [];
    for (var i = 1; i < b.length; i++) {
      var a = b[i - 1].rr, c = b[i].rr;
      if (Math.abs(c - a) / a > 0.25) continue;
      sq.push((c - a) * (c - a));
    }
    if (sq.length < 20) return null;
    return { v: Math.sqrt(avg(sq)), n: b.length };
  }

  function hrPlayerText() {
    var s = String(Math.round(H.hr)), log = A.hrLog, el = A.elapsed;
    if (A.playing && log && log.length && el > 120) {
      var first = log.filter(function (x) { return x.t < 60; }).map(function (x) { return x.hr; });
      var last = log.filter(function (x) { return x.t > el - 30; }).map(function (x) { return x.hr; });
      if (first.length > 5 && last.length > 3) {
        var d = Math.round(avg(last) - avg(first));
        s += " (" + (d > 0 ? "+" + d : d < 0 ? "−" + (-d) : "±0") + ")";
      }
    }
    return s;
  }

  function hrTiles() {
    var live = hrLive();
    bSetT("#hrNow", live ? String(Math.round(H.hr)) : "—");
    var sub;
    if (H.state === "busy") sub = "Connecting…";
    else if (H.state === "lost") sub = "Reconnecting…";
    else if (H.state !== "on") sub = "Waiting for a sensor";
    else if (H.contact === false) sub = "No skin contact";
    else if (!live) sub = (H.connAt && bNow() - H.connAt < 6) ? "Waiting for the first reading\u2026" : "No readings. Is the sensor broadcasting?";
    else sub = H.hasRR ? "Beat to beat" : "Smoothed rate from the sensor";
    bSetT("#hrNowS", sub);

    var sw = B.swings, last = sw[sw.length - 1];
    bSetT("#hrSwLast", last ? last.amp.toFixed(1) : "—");
    bSetT("#hrSwAvg", sw.length ? avg(sw.map(function (s) { return s.amp; })).toFixed(1) : "—");
    bSetT("#hrSwAvgS", sw.length ? "Average of " + sw.length + (sw.length === 1 ? " breath" : " breaths") : "Average across breaths");

    var now = bNow(), r = H.state === "on" ? rmssd(now - 60, now) : null;
    bSetT("#hrRmssd", r ? String(Math.round(r.v)) : "—");
    bSetT("#hrRmssdS", r ? "From " + r.n + " beats" : (H.hasRR && H.state === "on") ? "Collecting beats…" : "Needs beat-to-beat data");

    $("#bHrStat").hidden = !live;
    bSetT("#bHr", live ? String(Math.round(H.hr)) : "—");
    $("#pHrChip").hidden = !live;
    if (live) bSetT("#pHr", hrPlayerText());
    cohShow();
    guideCheck();
    shellSensor();
  }

  /* ----- connection guide ----- */

  /* What this browser can do, in the visitor's terms. Feature detection
     decides; the user agent only picks which advice to show. */
  function guideEnv() {
    var ua = navigator.userAgent || "", bt = hrSupported(), embedded = false;
    try { embedded = window.self !== window.top; } catch (e) { embedded = true; }
    var ios = /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
    var os = /Android/.test(ua) ? "android" : ios ? "ios" : /CrOS/.test(ua) ? "chromeos" :
      /Mac OS X/.test(ua) ? "mac" : /Windows/.test(ua) ? "windows" : /Linux/.test(ua) ? "linux" : "other";
    var br = /SamsungBrowser/.test(ua) ? "Samsung Internet" : /EdgA?\//.test(ua) ? "Edge" : /OPR\//.test(ua) ? "Opera" :
      /Firefox|FxiOS/.test(ua) ? "Firefox" : /CriOS/.test(ua) ? "Chrome" : /Chrome\//.test(ua) ? "Chrome" :
      /Safari\//.test(ua) ? "Safari" : "This browser";
    var osName = { android: "Android", ios: ios && /iPad/.test(ua) ? "iPad" : "iPhone", chromeos: "ChromeOS", mac: "macOS", windows: "Windows", linux: "Linux", other: "this device" }[os];
    var title = br + " on " + osName, tips = [];

    if (embedded) {
      title += ", embedded in another page";
      tips.push("This copy sits inside another page, such as a preview, which blocks Bluetooth. Open the page at its own web address to connect.");
    }
    if (os === "ios" && bt) {
      tips.push("This browser offers Web Bluetooth, so you can connect here.");
    } else if (os === "ios") {
      tips.push("Safari and Chrome on iPhone and iPad can't reach Bluetooth sensors.");
      tips.push("Bluefy, a browser built for Web Bluetooth, can: install it from the App Store and open this page in it.");
    } else if (!bt) {
      tips.push(os === "android"
        ? "Open this page in Chrome instead; install it from the Play Store if you need to. Copy the address from the address bar and paste it into Chrome."
        : "Open this page in Chrome or Edge. Safari and Firefox don't support Bluetooth sensors.");
      if (os === "linux") tips.push("Chrome on Linux may also need about://flags/#enable-experimental-web-platform-features switched on.");
    } else if (os === "android") {
      tips.push("Turn Bluetooth on: swipe down from the top of the screen and tap Bluetooth.");
      tips.push("When Chrome asks to find and connect to nearby devices, tap Allow. If you said no before, go to Settings > Apps > " + br + " > Permissions > Nearby devices.");
      tips.push("Don't pair the sensor in Android's Bluetooth settings; the page connects to it directly.");
      tips.push("During a session keep the screen on and the browser in front. The guide keeps the screen awake while it runs.");
    } else if (os === "mac") {
      tips.push("The first time, macOS asks whether " + br + " may use Bluetooth; allow it. If you missed it: System Settings > Privacy & Security > Bluetooth.");
      tips.push("Don't pair the sensor in the Bluetooth settings; the page connects to it directly.");
    } else if (os === "windows") {
      tips.push("Turn Bluetooth on in Settings > Bluetooth & devices.");
      tips.push("Don't pair the sensor in Windows settings; the page connects to it directly.");
    } else if (os === "linux") {
      tips.push("If Connect finds nothing, switch on about://flags/#enable-experimental-web-platform-features and restart " + br + ".");
    } else {
      tips.push("Turn Bluetooth on, then press Connect sensor.");
    }
    return { title: title, tips: tips, ok: bt && !embedded };
  }

  function guideRenderEnv() {
    var env = guideEnv(), ul = $("#gEnvTips");
    bSetT("#gEnvTitle", env.title);
    ul.innerHTML = "";
    env.tips.forEach(function (t) { var li = document.createElement("li"); li.textContent = t; ul.appendChild(li); });
  }

  function guideItem(k, cls, sub) {
    var li = document.querySelector('#gCheck li[data-k="' + k + '"]');
    if (!li) return;
    if (li.className !== cls) li.className = cls;
    var s = li.querySelector(".s");
    if (s.textContent !== sub) s.textContent = sub;
  }

  /* The live check beside the steps: each line ticks as that step works. */
  function guideCheck() {
    var st = H.state, live = hrLive(), now = bNow();
    guideItem("bt", hrSupported() ? "ok" : "no", hrSupported() ? "Ready" : "Not available here. See Your browser.");
    if (st === "on") guideItem("conn", "ok", H.name);
    else if (st === "busy") guideItem("conn", "wait", H.step ? HR_STEPS[H.step][0].charAt(0).toUpperCase() + HR_STEPS[H.step][0].slice(1) + (H.attempt > 1 ? ", try " + H.attempt : "") + "…" : "Connecting…");
    else if (st === "lost") guideItem("conn", "wait", "Reconnecting…");
    else guideItem("conn", "", hrSupported() ? "Press Connect sensor" : "");
    if (live) guideItem("hr", "ok", Math.round(H.hr) + " bpm");
    else if (st === "on") guideItem("hr", "wait", H.contact === false ? "No skin contact" : "No readings yet. Is it broadcasting and on your skin?");
    else guideItem("hr", "", "");
    var recentBeat = H.beats.length && now - H.beats[H.beats.length - 1].t < 5;
    if (live && recentBeat) guideItem("rr", "ok", "RMSSD and coherence use every beat");
    else if (live && H.connAt && now - H.connAt > 10) guideItem("rr", "info", "This sensor sends heart rate only. Swing works; coherence is an estimate.");
    else if (live) guideItem("rr", "wait", "Checking…");
    else guideItem("rr", "", "Needed for RMSSD and full coherence");
  }

  function guideInit() {
    var g = $("#connect");
    if (!store.get("hrEver") || location.hash === "#connect") g.open = true;    // open until the first connection
    H.guideAuto = g.open;
    var tabs = Array.prototype.slice.call(document.querySelectorAll(".g-tab"));
    var pick = function (dev, focus) {
      tabs.forEach(function (t) {
        var on = t.dataset.dev === dev;
        t.setAttribute("aria-selected", on ? "true" : "false");
        t.tabIndex = on ? 0 : -1;
        $("#gp-" + t.dataset.dev).hidden = !on;
        if (on && focus) t.focus();
      });
      store.set("guideDev", dev);
    };
    tabs.forEach(function (t, i) {
      t.addEventListener("click", function () { pick(t.dataset.dev); });
      t.addEventListener("keydown", function (e) {
        var d = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
        if (!d) return;
        e.preventDefault();
        pick(tabs[(i + d + tabs.length) % tabs.length].dataset.dev, true);
      });
    });
    var saved = store.get("guideDev");
    if (saved && $("#gp-" + saved)) pick(saved);
    $("#gConnect").addEventListener("click", function () { hrConnect(false); });
    guideRenderEnv();
    guideCheck();
  }

  /* A dot that blinks at the current heart rate. */
  function hrPulse() {
    clearTimeout(H.pulseT);
    if (H.state !== "on" && H.state !== "lost") return;
    var live = hrLive();
    if (live && !RM) {
      var dots = document.querySelectorAll(".hr-dot");
      for (var i = 0; i < dots.length; i++) {
        if (dots[i].animate && dots[i].offsetParent !== null) {
          dots[i].animate([{ opacity: 1, transform: "scale(1.45)" }, { opacity: 0.35, transform: "scale(1)" }],
            { duration: 320, easing: "ease-out" });
        }
      }
    }
    H.pulseT = setTimeout(hrPulse, live ? 60000 / H.hr : 1000);
  }

  /* Score every finished breath below index `upTo`: max minus min heart rate
     inside it, if the samples cover most of the breath. */
  function hrFinalize(upTo) {
    var changed = false;
    while (B.hrDone < upTo) {
      var n = B.hrDone, pts = B.hr.filter(function (s) { return s.n === n; });
      B.hrDone++;
      if (pts.length < 3 || pts[pts.length - 1].bt - pts[0].bt < pts[0].cyc * 0.6) continue;
      var hi = -Infinity, lo = Infinity;
      pts.forEach(function (s) { if (s.hr > hi) hi = s.hr; if (s.hr < lo) lo = s.hr; });
      B.swings.push({ n: n, amp: hi - lo, cyc: pts[0].cyc });
      changed = true;
    }
    if (changed) { drawSwings(); hrTiles(); if (B.finder) drawFind(); }
  }

  function hrSummary() {
    var s = B.hr;
    if (s.length < 10) return;
    var end = s[s.length - 1].bt, parts = [];
    var all = s.map(function (x) { return x.hr; });
    if (end >= 150) {
      var a = avg(s.filter(function (x) { return x.bt < 60; }).map(function (x) { return x.hr; }));
      var b = avg(s.filter(function (x) { return x.bt > end - 60; }).map(function (x) { return x.hr; }));
      parts.push("heart rate " + Math.round(a) + " bpm in the first minute and " + Math.round(b) + " in the last");
    } else {
      parts.push("heart rate averaged " + Math.round(avg(all)) + " bpm");
    }
    if (B.swings.length) {
      parts.push("an average swing of " + avg(B.swings.map(function (x) { return x.amp; })).toFixed(1) +
        " bpm over " + B.swings.length + " breaths");
    }
    if (B.coh.length) {
      parts.push("average coherence " + avg(B.coh).toFixed(1) + (H.hasRR ? "" : " (estimated)"));
    }
    var now = bNow(), r = H.hasRR ? rmssd(now - 60, now) : null;
    if (r) parts.push("RMSSD " + Math.round(r.v) + " ms in the last minute");
    var el = $("#hrSummary");
    el.textContent = "Last session: " + parts.join(", ") + ".";
    el.hidden = false;
  }

  function hrInit() {
    guideInit();
    try {
      var f = JSON.parse(store.get("resonance") || "null");
      if (f && f.res && f.res.length === FIND_RATES.length && f.at) H.find = f;
    } catch (e) {}
    if (!hrSupported()) {
      hrSetState("off", "Bluetooth unavailable");
      hrMsg("This browser can't reach Bluetooth sensors. Use Chrome or Edge on a computer or an Android phone; Safari, iPhone browsers and Firefox don't support it.");
    } else {
      hrSetState("off", "Not connected");
      try {
        if (navigator.bluetooth.getAvailability) {
          navigator.bluetooth.getAvailability().then(function (ok) {
            if (!ok) hrMsg("Bluetooth looks switched off or missing on this device.");
          }).catch(function () {});
        }
      } catch (e) {}
    }
    $("#hrConnect").addEventListener("click", function () { hrConnect(false); });
    $("#hrAny").addEventListener("click", function () { hrConnect(true); });
    $("#hrFindStart").addEventListener("click", function () { if (B.finder) bStop(); else finderStart(); });
    $("#hrFindUse").addEventListener("click", useBest);
    var redraw = function () { drawSwings(); drawFind(); drawSpectrum(); };
    if (window.ResizeObserver) {
      var ro = new ResizeObserver(redraw);
      ro.observe($("#hrBars")); ro.observe($("#hrFind")); ro.observe($("#hrSpec"));
    } else window.addEventListener("resize", redraw);
    finderUI(); redraw(); hrTiles();
    if (HR_NARROW.addEventListener) HR_NARROW.addEventListener("change", hrLayout);
    window.addEventListener("pagehide", function () { if (H.state === "on") hrDisconnect(); });
  }

