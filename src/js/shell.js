  /* ---------------------------- app shell ----------------------------
     Views behind a hash router: #home, #practice, #breathe, #sounds, #heart
     and #learn, plus #practice/<id> for a guided session, and from search #track/<id>,
     #breathe/<pattern> and #yoga/find/<pose>. Older in-page anchors (#prime, #tracks, #builder, #connect,
     #science, #references) still work: they open the view that holds them.
     Everything inside the views keeps its own ids and logic.
  -------------------------------------------------------------------- */

  var VIEWS = ["home", "practice", "breathe", "sounds", "heart", "learn", "session", "yoga", "settings"];
  var V_TITLE = { home: "Home", practice: "Practice", breathe: "Breathe", sounds: "Sounds", heart: "Heart", learn: "Learn", session: "Practice", yoga: "Routine builder", settings: "Settings" };
  var ALIAS = { prime: ["sounds", "prime"], tracks: ["sounds", "tracks"], builder: ["sounds", "build"] };
  var BASE_TITLE = document.title;
  var curView = "";
  var MOBILE = window.matchMedia ? window.matchMedia("(max-width: 1023px)") : { matches: false };

  function viewOf(el) {
    while (el && !(el.classList && el.classList.contains("view"))) el = el.parentNode;
    return el ? el.id.slice(2) : null;
  }

  function showView(v) {
    if (VIEWS.indexOf(v) < 0) v = "home";
    if (v !== "breathe") sheet(false);
    VIEWS.forEach(function (n) { $("#v-" + n).hidden = n !== v; });
    var links = document.querySelectorAll(".nav a"), navV = (v === "session" || v === "yoga") ? "practice" : v;
    for (var i = 0; i < links.length; i++) {
      if (links[i].dataset.view === navV) links[i].setAttribute("aria-current", "page");
      else links[i].removeAttribute("aria-current");
    }
    bSetT("#viewTitle", V_TITLE[v]);
    document.title = v === "home" ? BASE_TITLE : V_TITLE[v] + " | Entrain";
    if (v !== curView) window.scrollTo(0, 0);
    curView = v;
    if (v === "home") homeRefresh();
    if (v === "practice") pRenderLib();               // your routines may have changed
    if (v === "settings") stRender();
    var gear = $("#tbSet");
    if (gear) { if (v === "settings") gear.setAttribute("aria-current", "page"); else gear.removeAttribute("aria-current"); }
    if (v === "breathe") setTimeout(sizeCanvas, 0);
    if (v !== "session" && P.state === "done") P.state = "idle";
    pImmersive();
    pPill();
    setTimeout(edgeFadeAll, 0);                         // widths are known once the view shows
  }

  function goView(v, seg) {
    if (seg) segPick(seg);
    if (location.hash.slice(1) !== v) location.hash = v;
    else showView(v);
  }

  function route() {
    var h = "";
    try { h = decodeURIComponent(location.hash.slice(1)); } catch (e) {}
    if (!h) { showView("home"); return; }
    if (h === "session") { location.replace("#practice"); return; }
    if (h.indexOf("practice/") === 0) { showView("session"); pIntro(h.slice(9)); return; }
    if (h === "yoga" || h.indexOf("yoga/") === 0) { showView("yoga"); yOpen(h.slice(5)); return; }
    if (h.indexOf("track/") === 0) { segPick("tracks"); showView("sounds"); fdTrack(h.slice(6)); return; }      // from search
    if (h.indexOf("breathe/") === 0) { showView("breathe"); fdPattern(h.slice(8)); return; }
    if (VIEWS.indexOf(h) >= 0) { showView(h); return; }
    if (ALIAS[h]) { segPick(ALIAS[h][1]); showView(ALIAS[h][0]); return; }
    var el = document.getElementById(h), v = el && viewOf(el);
    if (!v) { showView("home"); return; }
    if (el.classList.contains("seg-panel")) segPick(el.id.slice(3));
    showView(v);
    if (el.tagName === "DETAILS") el.open = true;
    setTimeout(function () {
      try { el.scrollIntoView({ block: "start", behavior: RM ? "auto" : "smooth" }); } catch (e) { el.scrollIntoView(); }
    }, 30);
  }

  /* ----- keyboard shortcuts -----
     Space and the arrow keys leave alone a key meant for a focused control (a field, a button,
     the feelings wheel) and a key another handler has already used. On the session's own
     transport buttons only Space belongs to the button, so the arrows still move between steps. */
  function kbSkip(e) {
    if (e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey) return true;
    var t = e.target;
    if (!t || !t.closest) return false;
    if (t.closest("#sPrev, #sPlay, #sNext")) return e.code === "Space";
    return !!t.closest('input, select, textarea, button, a[href], summary, [role="button"], [role="radio"], [role="tab"], [contenteditable]');
  }

  /* ----- rows of chips that scroll sideways fade out at an edge with more beyond it ----- */
  function edgeFade(el) {
    if (!el) return;
    el.classList.add("efade");
    var upd = function () {
      var max = el.scrollWidth - el.clientWidth;
      el.classList.toggle("fade-l", el.scrollLeft > 2);
      el.classList.toggle("fade-r", max - el.scrollLeft > 2);
    };
    if (!el.efade) { el.efade = upd; el.addEventListener("scroll", upd, { passive: true }); }
    upd();
  }
  var EDGE_ROWS = ["#prFilt", "#bPats", ".toc", "#tracks .tabs", "#ybCats", "#ybPos", ".si-len"];
  function edgeFadeAll() { EDGE_ROWS.forEach(function (q) { document.querySelectorAll(q).forEach(edgeFade); }); }

  /* ----- Sounds: Tracks / Prime / Build ----- */
  function segPick(seg, focus) {
    var bs = document.querySelectorAll(".seg-b");
    for (var i = 0; i < bs.length; i++) {
      var on = bs[i].dataset.seg === seg;
      bs[i].setAttribute("aria-selected", on ? "true" : "false");
      bs[i].tabIndex = on ? 0 : -1;
      $("#sp-" + bs[i].dataset.seg).hidden = !on;
      if (on && focus) bs[i].focus();
    }
    store.set("soundsSeg", seg);
  }

  /* ----- breathing settings: a side panel on desktop, a sheet on a phone ----- */
  function sheet(open) {
    var p = $("#bPanel"), b = $("#bAdjust"), was = p.classList.contains("open");
    if (!MOBILE.matches) open = false;
    p.classList.toggle("open", !!open);
    $("#sheetBack").hidden = !open;
    b.setAttribute("aria-expanded", open ? "true" : "false");
    document.body.classList.toggle("sheet-lock", !!open);
    if (open && !was) setTimeout(function () { $("#bPanelDone").focus(); }, 60);
    if (!open && was) b.focus();
  }

  /* ----- heart sensor status, mirrored in the top bar, Home and Breathe ----- */
  function shellSensor() {
    var pill = $("#tbSensor");
    if (!pill) return;
    var st = H.state, live = hrLive(), txt;
    var fresh = H.connAt && bNow() - H.connAt < 6;
    pill.dataset.state = (st === "on" && !live) ? "busy" : st;
    if (st === "on") txt = live ? Math.round(H.hr) + " bpm" : fresh ? "Waiting…" : "No readings";
    else if (st === "busy") txt = "Connecting…";
    else if (st === "lost") txt = "Reconnecting…";
    else txt = hrSupported() ? "Connect sensor" : "Heart sensor";
    bSetT("#tbSensorTxt", txt);
    pill.title = st === "on" ? H.name : "Heart sensor";

    bSetT("#qkSensorT", st === "on" ? H.name : "Heart sensor");
    var sub;
    if (st === "on") sub = live ? Math.round(H.hr) + " bpm" + (H.coh ? ", coherence " + H.coh.cs.toFixed(1) : "") : "Connected, waiting for readings";
    else if (st === "busy") sub = "Connecting…";
    else if (st === "lost") sub = "Reconnecting…";
    else sub = hrSupported() ? "Not connected. Open to connect." : "Needs Chrome or Edge on Android or a computer";
    bSetT("#qkSensor", sub);

    var btn = $("#bSensorBtn");
    if (st === "on" || st === "lost") {
      bSetT("#bSensorTxt", (st === "lost" ? "Reconnecting to " : "Connected to ") + H.name + ". Heart rate and coherence show above the guide.");
      bSetT("#bSensorBtn", "Heart details"); btn.dataset.act = "details";
    } else if (st === "busy") {
      bSetT("#bSensorTxt", "Connecting to your sensor…");
      bSetT("#bSensorBtn", "Heart details"); btn.dataset.act = "details";
    } else if (hrSupported()) {
      bSetT("#bSensorTxt", "Connect a heart sensor to watch your heart rate follow your breath.");
      bSetT("#bSensorBtn", "Connect sensor"); btn.dataset.act = "connect";
    } else {
      bSetT("#bSensorTxt", "Live heart data needs Chrome or Edge on an Android phone or a computer.");
      bSetT("#bSensorBtn", "How to connect"); btn.dataset.act = "guide";
    }
  }

  /* ----- Home ----- */
  function fmtSec(s) { return (s % 1 ? s.toFixed(1) : String(s)) + " s"; }
  function patLabel() {
    var r = document.querySelector('input[name="bpat"]:checked');
    return r ? r.parentNode.textContent.trim() : "Custom";
  }

  function homeRefresh() {
    var rate = 60 / cycleOf(BC), parts = ["in for " + fmtSec(BC.inh)];
    if (BC.sip) parts.push("a " + fmtSec(BC.sip) + " top-up");
    if (BC.hold) parts.push("hold " + fmtSec(BC.hold));
    parts.push("out for " + fmtSec(BC.exh));
    if (BC.rest) parts.push("hold " + fmtSec(BC.rest));
    bSetT("#homePat", patLabel());
    bSetT("#homePatTxt", rate.toFixed(1) + " breaths a minute: " + parts.join(", ") + ". " +
      (BC.minutes ? "A " + BC.minutes + "-minute session." : "Open-ended, until you stop."));
    bSetT("#homeStart", pBusy() ? "Back to " + P.def.name : B.state === "running" ? "Back to your session" : B.state === "paused" ? "Resume session" : "Start breathing");

    if (H.find && H.find.best) {
      var d = new Date(H.find.at).toLocaleDateString(undefined, { day: "numeric", month: "short" });
      bSetT("#qkFind", "Last result: " + H.find.best + " breaths a minute, " + d);
    } else bSetT("#qkFind", "A 10-minute test with a heart sensor");
    var c = primeCfg();
    bSetT("#qkPrime", c.minutes + " min of " + c.beat + " Hz " + bandFor(c.beat).name.toLowerCase() + ", then start work");
    bSetT("#qkTracks", TRACKS.length + " tracks for sleep, calm, focus, recovery and tinnitus");

    var last = null;
    try { last = JSON.parse(store.get("lastSummary") || "null"); } catch (e) {}
    if (last && last.text) {
      var t = last.text.replace(/^Last session: /, "");
      bSetT("#homeLast", t.charAt(0).toUpperCase() + t.slice(1));
      bSetT("#homeLastWhen", new Date(last.at).toLocaleString(undefined,
        { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }));
    }
    shellSensor();
    pSuggest();
    drawHomeWave();
  }

  /* The current pattern drawn as two and a half breaths, coloured by phase. */
  function drawHomeWave() {
    var cv = $("#homeWave");
    if (!cv || $("#v-home").hidden || !BCOL.text) return;
    var f = fitCanvas(cv);
    if (!f) return;
    var c = f.c, W = f.w, Hh = f.h, ph = buildPhases(BC), T = ph.cycle * 2.5, top = 12, bot = Hh - 12;
    var at = function (t) {
      var ct = t % ph.cycle, p = ph.list[ph.list.length - 1];
      for (var i = 0; i < ph.list.length; i++) if (ct < ph.list[i].start + ph.list[i].secs) { p = ph.list[i]; break; }
      var prog = Math.min(1, Math.max(0, (ct - p.start) / p.secs));
      return { k: p.k, y: bot - (p.from + (p.to - p.from) * bEase(prog)) * (bot - top) };
    };
    var x, pt, g = c.createLinearGradient(0, top, 0, bot);
    g.addColorStop(0, rgba(BCOL["b-in"], 0.18));
    g.addColorStop(1, rgba(BCOL["b-in"], 0));
    c.beginPath(); c.moveTo(0, bot);
    for (x = 0; x <= W; x += 2) c.lineTo(x, at(x / W * T).y);
    c.lineTo(W, bot); c.closePath(); c.fillStyle = g; c.fill();
    c.lineWidth = 3; c.lineCap = "round"; c.lineJoin = "round";
    var runK = null;
    for (x = 0; x <= W + 1; x += 2) {
      pt = at(Math.min(W, x) / W * T);
      if (pt.k !== runK) {
        if (runK !== null) { c.lineTo(x, pt.y); c.stroke(); }
        c.beginPath(); c.strokeStyle = kc(pt.k); c.moveTo(x, pt.y); runK = pt.k;
      } else c.lineTo(x, pt.y);
    }
    c.stroke();
  }

  /* --------------------------- app: install and offline --------------------------- */
  /* The page is complete on its own. When it's served from the site, a small worker (sw.js)
     keeps a copy on the device so it opens offline, and Chrome can install it as an app.
     Opened as a saved file, or inside a preview frame, none of this runs. */
  var APP = { reg: null, prompt: null, hadCtl: false, reloading: false, checked: 0, tt: 0 };

  function standalone() {
    return (window.matchMedia && matchMedia("(display-mode: standalone)").matches) || navigator.standalone === true;
  }

  // the gap between the bottom of the window and whatever is docked there (tab bar, player)
  function toastPlace() {
    var t = $("#toast");
    if (!t || t.hidden) return;
    var top = window.innerHeight;
    var bar = $("#v-yoga") && !$("#v-yoga").hidden ? document.querySelector(".yb-bar") : null;
    [document.querySelector(".rail"), $("#player"), bar].forEach(function (el) {
      if (!el || (el.id === "player" && !el.classList.contains("open"))) return;
      var r = el.getBoundingClientRect();
      if (r.height && r.top > window.innerHeight * 0.5 && r.top < top) top = r.top;
    });
    t.style.bottom = (window.innerHeight - top + 12) + "px";
  }

  function toast(msg, opt) {
    opt = opt || {};
    var t = $("#toast"), a = $("#toastAct");
    if (!t) return;
    if (APP.sticky && !opt.sticky) return;                  // a passing notice never hides an update offer
    APP.sticky = !!opt.sticky;
    clearTimeout(APP.tt);
    $("#toastTxt").textContent = msg;
    t.classList.toggle("over", !!opt.over);                // one that matters during a session shows over it
    a.hidden = !opt.action;
    a.textContent = opt.action || "";
    a.onclick = opt.action ? function () { if (opt.onAct) opt.onAct(); if (!opt.keep) toastHide(); } : null;
    t.hidden = false;
    toastPlace();
    requestAnimationFrame(function () { t.classList.add("show"); });
    if (!opt.sticky) APP.tt = setTimeout(toastHide, opt.ms || 7000);
  }
  function toastHide() {
    var t = $("#toast");
    clearTimeout(APP.tt);
    APP.sticky = false;
    t.classList.remove("show");
    APP.tt = setTimeout(function () { t.hidden = true; }, RM ? 0 : 250);
  }

  function updateReady(w) {
    toast("A new version of Entrain is ready.", {
      action: "Update", sticky: true, keep: true,
      onAct: function () {
        APP.reloading = true;
        $("#toastAct").disabled = true;
        $("#toastTxt").textContent = "Updating…";
        w.postMessage("skipWaiting");
      }
    });
  }

  function installShow(ios) {
    var c = $("#installCard");
    if (!c || standalone()) return;
    var later = +store.get("installLater") || 0;
    if (Date.now() - later < 14 * 864e5) return;           // "Not now" holds for two weeks
    $("#installTxt").textContent = ios
      ? "In Safari, tap Share, then Add to Home Screen. It opens in its own window and works offline."
      : /Android|Mobile/.test(navigator.userAgent)
        ? "It opens from your home screen in its own window and works without a connection."
        : "It opens in its own window from your apps or taskbar and works without a connection.";
    $("#installBtn").hidden = !!ios;
    $("#installLater").textContent = ios ? "Got it" : "Not now";
    c.hidden = false;
  }
  function installHide() { var c = $("#installCard"); if (c) c.hidden = true; }

  function appInit() {
    $("#toastX").addEventListener("click", toastHide);
    window.addEventListener("resize", toastPlace);
    $("#installBtn").addEventListener("click", function () {
      var p = APP.prompt;
      if (!p) return;
      APP.prompt = null;
      installHide();
      p.prompt();
      if (p.userChoice) p.userChoice.then(function (r) {
        if (r && r.outcome !== "accepted") store.set("installLater", String(Date.now()));
      }).catch(function () {});
    });
    $("#installLater").addEventListener("click", function () {
      store.set("installLater", String(Date.now()));
      installHide();
    });

    // install needs the site, its app description and the worker; a saved copy or a preview has none
    var site = document.querySelector('link[rel="manifest"]') && window.isSecureContext &&
               /^https?:$/.test(location.protocol) && window.top === window.self;
    if (!site) return;

    window.addEventListener("beforeinstallprompt", function (e) {
      e.preventDefault();                                   // offer it on Home instead of a browser bar
      APP.prompt = e;
      installShow(false);
    });
    window.addEventListener("appinstalled", function () {
      APP.prompt = null;
      installHide();
      toast("Entrain is installed. Open it from your home screen or app list.");
    });
    var ua = navigator.userAgent;
    if ((/iPad|iPhone|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)) &&
        /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS/.test(ua)) installShow(true);

    if (!("serviceWorker" in navigator)) return;
    var sw = navigator.serviceWorker;
    APP.hadCtl = !!sw.controller;
    sw.addEventListener("controllerchange", function () {
      if (APP.reloading) location.reload();
    });
    var go = function () {
      sw.register("sw.js").then(function (reg) {
        APP.reg = reg;
        APP.checked = Date.now();
        if (reg.waiting && sw.controller) updateReady(reg.waiting);
        reg.addEventListener("updatefound", function () {
          var w = reg.installing;
          if (w) w.addEventListener("statechange", function () {
            if (w.state === "installed" && sw.controller) updateReady(w);
          });
        });
      }).catch(function () {});
      sw.ready.then(function () {
        if (APP.hadCtl || store.get("offlineNoted")) return;
        store.set("offlineNoted", "1");
        toast("Saved on this device: Entrain now opens even without a connection.");
      });
    };
    if (document.readyState === "complete") go(); else window.addEventListener("load", go);

    // an installed app can stay open for days; look for a new version when it comes back to the front
    document.addEventListener("visibilitychange", function () {
      if (document.visibilityState !== "visible" || !APP.reg || Date.now() - APP.checked < 36e5) return;
      APP.checked = Date.now();
      APP.reg.update().catch(function () {});
    });
  }

  function shellInit() {
    // navigation
    window.addEventListener("hashchange", route);
    document.addEventListener("click", function (e) {
      var go = e.target.closest("[data-go]");
      if (!go) return;
      e.preventDefault();
      goView(go.dataset.go, go.dataset.seg);
    });
    $("#homeStart").addEventListener("click", function () {
      if (pBusy()) { pOpen(); return; }
      goView("breathe");
      if (B.state !== "running") bToggle();
    });

    // Sounds segments
    var segs = Array.prototype.slice.call(document.querySelectorAll(".seg-b"));
    segs.forEach(function (b, i) {
      b.addEventListener("click", function () { segPick(b.dataset.seg); });
      b.addEventListener("keydown", function (e) {
        var d = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
        if (!d) return;
        e.preventDefault();
        segPick(segs[(i + d + segs.length) % segs.length].dataset.seg, true);
      });
    });
    var seg = store.get("soundsSeg");
    segPick(seg && $("#sp-" + seg) ? seg : "tracks");
    $("#scOpen2").addEventListener("click", function () { pendingPlay = null; openCheck(); });

    // breathing settings sheet
    $("#bAdjust").addEventListener("click", function () { sheet(!$("#bPanel").classList.contains("open")); });
    $("#bPanelDone").addEventListener("click", function () { sheet(false); });
    $("#sheetBack").addEventListener("click", function () { sheet(false); });
    if (MOBILE.addEventListener) MOBILE.addEventListener("change", function () { sheet(false); });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && $("#bPanel").classList.contains("open")) sheet(false);
    });
    $("#bSensorBtn").addEventListener("click", function () {
      var a = this.dataset.act;
      if (a === "connect") hrConnect(false);
      else if (a === "details") goView("heart");
      else if (a === "guide") location.hash = "connect";
    });

    // mini player: compact on a phone, expandable for volume and options
    $("#pMore").addEventListener("click", function () {
      var p = $("#player"), on = !p.classList.contains("expanded");
      p.classList.toggle("expanded", on);
      this.setAttribute("aria-expanded", on ? "true" : "false");
      toastPlace();
    });
    var pl = $("#player"), syncDock = function () {
      document.body.classList.toggle("has-player", pl.classList.contains("open"));
      setTimeout(toastPlace, 320);                          // after the player slides in or out
    };
    if (window.MutationObserver) new MutationObserver(syncDock).observe(pl, { attributes: true, attributeFilter: ["class"] });
    syncDock();

    // canvases drawn before the display font arrived get redrawn once it has
    if (window.ResizeObserver) new ResizeObserver(drawHomeWave).observe($("#homeWave"));
    if (document.fonts && document.fonts.load) {
      document.fonts.load('700 24px "Entrain Display"').then(function () {
        draw(); drawSwings(); drawFind(); drawSpectrum(); drawHomeWave();
      }).catch(function () {});
    }

    var fadeT = 0;
    window.addEventListener("resize", function () { clearTimeout(fadeT); fadeT = setTimeout(edgeFadeAll, 150); });
    appInit();
    ambInit();
    qInit();
    pInit();
    route();
  }
