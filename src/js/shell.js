  /* ---------------------------- app shell ----------------------------
     Views behind a hash router. The five tabs are #home (Today), #practice (the library),
     #breathe, #heart and #learn. Pages open from them: #history from Today; #practice/<id> for a
     practice, #track/<id> for a track, #prime and #builder for the custom primer and the beat
     builder, #yoga for the routine builder; and #settings from the gear. Links and search also
     use #goal/<goal> (the library at one goal), #breathe/<pattern> and #yoga/find/<pose>. Older
     addresses still work: #sounds and #tracks open the library at its sounds, and in-page anchors
     (#connect, #science, #references and the rest) open the view that holds them.
     Everything inside the views keeps its own ids and logic.
  -------------------------------------------------------------------- */

  var VIEWS = ["home", "practice", "breathe", "heart", "learn", "history", "session", "track", "prime", "builder", "yoga", "settings"];
  var V_TITLE = { home: "Today", practice: "Library", breathe: "Breathe", heart: "Heart", learn: "Learn", history: "History", session: "Practice",
    track: "Track", prime: "Custom primer", builder: "Beat builder", yoga: "Routine builder", settings: "Settings" };
  var V_TAB = { history: "home", session: "practice", track: "practice", prime: "practice", builder: "practice", yoga: "practice" };   // the tab each page belongs to
  var ALIAS = { today: "home", library: "practice" };
  var BACK = "practice";                 // the list a page was opened from: Today, the library or History
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
    var links = document.querySelectorAll(".nav a"), navV = V_TAB[v] || v;
    for (var i = 0; i < links.length; i++) {
      if (links[i].dataset.view === navV) links[i].setAttribute("aria-current", "page");
      else links[i].removeAttribute("aria-current");
    }
    if (v === "home" || v === "practice" || v === "history") BACK = v;
    else if (!V_TAB[v]) BACK = "practice";           // from Breathe, Heart, Learn or Settings, a page leads back to the library
    bSetT("#viewTitle", V_TITLE[v]);
    document.title = v === "home" ? BASE_TITLE : V_TITLE[v] + " | Entrain";
    if (v !== curView) window.scrollTo(0, 0);
    curView = v;
    if (v === "home") homeRefresh();
    if (v === "practice") pRenderLib();               // your routines may have changed
    if (v === "history") hRender();
    if (v === "settings") stRender();
    backSync();
    var gear = $("#tbSet");
    if (gear) { if (v === "settings") gear.setAttribute("aria-current", "page"); else gear.removeAttribute("aria-current"); }
    if (v === "breathe") setTimeout(sizeCanvas, 0);
    if (v !== "session" && P.state === "done") P.state = "idle";
    pImmersive();
    pPill();
    setTimeout(edgeFadeAll, 0);                         // widths are known once the view shows
  }

  function goView(v) {
    if (location.hash.slice(1) !== v) location.hash = v;
    else if (VIEWS.indexOf(v) >= 0) showView(v);
    else route();                                       // a place on a page, such as the resonance test
  }

  // the way back from a page: to the list it was opened from
  function backTo() { return { href: "#" + BACK, label: BACK === "home" ? "Today" : BACK === "history" ? "History" : "Library" }; }
  function backLink() {
    var b = backTo();
    return '<a class="si-back" href="' + b.href + '"><svg class="i" aria-hidden="true"><use href="#i-back"/></svg>' + b.label + "</a>";
  }
  function backSync() {                              // the pages written in the markup rather than drawn
    var b = backTo();
    document.querySelectorAll("#v-prime .si-back, #v-builder .si-back, #v-yoga .si-back").forEach(function (a) {
      a.setAttribute("href", b.href);
      a.lastChild.textContent = b.label;
    });
  }

  function route() {
    var h = "";
    try { h = decodeURIComponent(location.hash.slice(1)); } catch (e) {}
    if (!h) { showView("home"); return; }
    if (ALIAS[h]) h = ALIAS[h];
    if (h === "session") { location.replace("#practice"); return; }
    if (h.indexOf("practice/") === 0) { showView("session"); pIntro(h.slice(9)); return; }
    if (h.indexOf("track/") === 0) { showView("track"); trOpen(h.slice(6)); return; }
    if (h.indexOf("goal/") === 0) { libShow(h.slice(5), ""); return; }
    if (h === "sounds" || h === "tracks") { libShow("", "sound"); return; }   // Sounds was a tab of its own
    if (h === "yoga" || h.indexOf("yoga/") === 0) { showView("yoga"); yOpen(h.slice(5)); return; }
    if (h.indexOf("breathe/") === 0) { showView("breathe"); fdPattern(h.slice(8)); return; }
    if (VIEWS.indexOf(h) >= 0) { showView(h); return; }
    var el = document.getElementById(h), v = el && viewOf(el);
    if (!v) { showView("home"); return; }
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
    return !!t.closest('input, select, textarea, button, a[href], summary, [role="button"], [role="radio"], [role="tab"], [role="slider"], [contenteditable]');
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
  var EDGE_ROWS = ["#prFilt", "#bPats", ".toc", "#ybCats", "#ybPos", ".si-len"];
  function edgeFadeAll() { EDGE_ROWS.forEach(function (q) { document.querySelectorAll(q).forEach(edgeFade); }); }

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

  /* ----- heart sensor status, mirrored in the top bar, Today and Breathe ----- */
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
      e.preventDefault();                                   // offer it on Today instead of a browser bar
      APP.prompt = e;
      installShow(false);
    });
    window.addEventListener("appinstalled", function () {
      APP.prompt = null;
      installHide();
      BK.asked = false; bkPersist();                 // an installed app is usually allowed to keep its data
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
      goView(go.dataset.go);
    });

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
    if (document.fonts && document.fonts.load) {
      document.fonts.load('700 24px "Entrain Display"').then(function () {
        draw(); drawSwings(); drawFind(); drawSpectrum(); drawHomeWave();
      }).catch(function () {});
    }

    var fadeT = 0;
    window.addEventListener("resize", function () { clearTimeout(fadeT); fadeT = setTimeout(edgeFadeAll, 150); });
  }
