  /* -------------------------------- your data --------------------------------
     Everything Entrain keeps lives in this browser's storage, on this device. A backup is one
     file of all of it, to keep somewhere safe or to move to another phone, and restoring one
     replaces what's here. The browser is also asked to keep the data rather than clear it when
     space runs low; Settings says what it answered.
  ---------------------------------------------------------------------------- */

  // about this device rather than about you: the headphone check, the install and offline notes,
  // whether a heart sensor has ever connected here, and when this device last saved a backup
  var BK_SKIP = ["debug", "stereo", "installLater", "offlineNoted", "hrEver", "lastBackup"];
  // the stored values that are lists or records: a backup whose copy of one doesn't read as that is damaged
  var BK_LISTS = ["history", "favs", "yogaSeqs", "myBreaths", "nvcLog"];
  var BK_RECORDS = /^(breath|settings|pOpt|pOpt\..+|pCh\..+|resonance|nvcDraft\..+)$/;
  var BK_MAX = 5e6;                       // bytes: more than a browser's whole storage for one site
  var BK = { pending: null, persisted: null, asked: false };

  // the names of everything worth keeping, without the "entrain." in front
  function bkKeys() {
    var out = [];
    try {
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        if (k && k.indexOf("entrain.") === 0 && BK_SKIP.indexOf(k.slice(8)) < 0) out.push(k.slice(8));
      }
    } catch (e) {}
    return out.sort();
  }
  function bkCount(data, k) {
    try { var a = JSON.parse(data[k] || "[]"); return Array.isArray(a) ? a.length : 0; } catch (e) { return 0; }
  }
  function bkN(n, one, many) { return n + " " + (n === 1 ? one : many); }
  function bkAnd(a) { return a.length > 1 ? a.slice(0, -1).join(", ") + " and " + a[a.length - 1] : a[0] || ""; }
  function bkWhen(t) {
    return new Date(t).toLocaleString(undefined, { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  }

  /* ----- saving ----- */
  function bkFileName(d) {
    var p = function (n) { return (n < 10 ? "0" : "") + n; };
    return "entrain-backup-" + d.getFullYear() + "-" + p(d.getMonth() + 1) + "-" + p(d.getDate()) + ".json";
  }
  function bkSave() {
    var data = {}, now = new Date();
    bkKeys().forEach(function (k) { var v = store.get(k); if (v !== null) data[k] = v; });
    var text = JSON.stringify({ app: "Entrain", kind: "backup", version: 1, savedAt: now.toISOString(), data: data }, null, 1);
    var name = bkFileName(now), viewer = window.claude && typeof window.claude.use === "function" ? window.claude : null;
    var saved = function () {
      store.set("lastBackup", String(now.getTime()));
      toast("Backup saved: " + name);
      if (curView === "settings") bkStatus();
    };
    var cant = function () { toast("This preview can't save files. Open Entrain itself to save a backup."); };
    if (viewer) {
      // in Claude's preview of the app, a page can't download a file itself: the viewer offers it, and asks you first
      viewer.use("downloads").then(function (dl) {
        if (!dl) { cant(); return; }
        dl.save({ filename: name, data: text }).then(saved, function (e) {
          var code = e && e.code;
          if (code === "declined") return;                 // you said no
          if (code === "rate_limited") toast("A save is already waiting for your answer.");
          else cant();
        });
      }, cant);
      return;
    }
    var a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([text], { type: "application/json" }));
    a.download = name;
    a.hidden = true;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 60000);
    saved();
  }

  /* ----- restoring ----- */
  // what a file holds: { data, n, at } for a backup, { newer: true } for one this version can't read, or null
  function bkParse(text) {
    var o;
    try { o = JSON.parse(text); } catch (e) { return null; }
    if (!o || typeof o !== "object" || o.app !== "Entrain" || o.kind !== "backup" || typeof o.version !== "number") return null;
    if (o.version > 1) return { newer: true };
    if (!o.data || typeof o.data !== "object" || Array.isArray(o.data)) return null;
    var data = {}, n = 0;
    for (var k in o.data) {
      if (!Object.prototype.hasOwnProperty.call(o.data, k)) continue;
      var v = o.data[k];
      if (!/^[A-Za-z][\w.-]{0,79}$/.test(k)) continue;           // not a name Entrain uses
      if (typeof v !== "string") return null;
      if (BK_SKIP.indexOf(k) >= 0) continue;
      if (BK_LISTS.indexOf(k) >= 0 || BK_RECORDS.test(k)) {
        var j;
        try { j = JSON.parse(v); } catch (e) { return null; }
        if (BK_LISTS.indexOf(k) >= 0 ? !Array.isArray(j) : !j || typeof j !== "object") return null;
      }
      data[k] = v; n++;
    }
    return { data: data, n: n, at: Date.parse(o.savedAt) || 0 };
  }
  function bkPick() {
    var f = $("#stLoad");
    if (!f) return;
    f.value = "";
    f.click();
  }
  function bkRead(file) {
    if (!file) return;
    if (file.size > BK_MAX) { bkMsg("That file is too big to be an Entrain backup.", true); return; }
    var r = new FileReader();
    r.onload = function () {
      var b = bkParse(String(r.result || ""));
      if (!b) { bkMsg("That isn't an Entrain backup, or it's damaged, so nothing has changed.", true); return; }
      if (b.newer) { bkMsg("That backup comes from a newer version of Entrain. Open the app online once so it can update, then try again.", true); return; }
      if (!b.n) { bkMsg("That backup is empty, so there's nothing to restore.", true); return; }
      BK.pending = b;
      bkStatus();
      bkShow();
    };
    r.onerror = function () { bkMsg("That file couldn't be read.", true); };
    r.readAsText(file);
  }
  // what's in the backup, what it replaces, and the choice
  function bkOffer() {
    var b = BK.pending, d = b.data;
    var has = [bkN(bkCount(d, "history"), "session", "sessions"), bkN(bkCount(d, "favs"), "favourite", "favourites"),
               bkN(bkCount(d, "yogaSeqs"), "routine", "routines"), bkN(bkCount(d, "myBreaths"), "breathing pattern", "breathing patterns"),
               bkN(bkCount(d, "nvcLog"), "kept reflection", "kept reflections")]
      .filter(function (s) { return s.charAt(0) !== "0"; });
    var here = hLoad().length;
    return "<b>" + (b.at ? "A backup from " + esc(bkWhen(b.at)) : "A backup") + "</b>" +
      "<p>" + (has.length ? esc(bkAnd(has)) + ", with your settings." : "Your settings, with no sessions yet.") + "</p>" +
      "<p>Restoring replaces everything Entrain has on this device" + (here ? ", including " + bkN(here, "session", "sessions") + " in its history" : "") +
      ", then reloads the app.</p>" +
      '<div class="st-data-act"><button class="btn primary small" id="stRestoreGo">Restore</button><button class="btn small" id="stRestoreNo">Cancel</button></div>';
  }
  function bkApply() {
    var b = BK.pending;
    if (!b) return;
    var keep = {}, k;
    bkKeys().forEach(function (x) { keep[x] = store.get(x); });
    try {
      for (k in keep) localStorage.removeItem("entrain." + k);
      for (k in b.data) localStorage.setItem("entrain." + k, b.data[k]);
    } catch (e) {
      // out of room part of the way through: put back what was here
      try {
        for (k in b.data) localStorage.removeItem("entrain." + k);
        for (k in keep) if (keep[k] !== null) localStorage.setItem("entrain." + k, keep[k]);
      } catch (e2) {}
      BK.pending = null;
      bkMsg("There wasn't room to restore that backup, so nothing has changed.", true);
      return;
    }
    store.frozen = true;                  // nothing still in memory may write over it before the reload
    BK.pending = null;
    try { sessionStorage.setItem("entrain.restored", "1"); } catch (e) {}
    location.reload();
  }

  /* ----- keeping it ----- */
  // Ask the browser to keep the data when space runs low, once there is some worth keeping, and at
  // most once each time the app opens: Chrome and Edge decide quietly, but Firefox asks you.
  function bkPersist() {
    var s = navigator.storage;
    if (!s || !s.persisted) return;
    s.persisted().then(function (yes) {
      if (yes || BK.asked || !s.persist || !hLoad().length) return yes;
      BK.asked = true;
      return s.persist();
    }).then(function (yes) {
      BK.persisted = !!yes;
      if (curView === "settings") bkStatus();
    }, function () {});
  }

  /* ----- the card in Settings ----- */
  function bkCard() {
    return '<section class="st-card" id="st-data" aria-labelledby="stD"><h2 id="stD">Your data</h2>' +
      '<p class="st-note">Your history, favourites, routines, breathing patterns, settings and any reflections you keep are stored in this browser, on this device, and never sent anywhere. A backup is one file of all of it, to keep safe or to move to another phone.</p>' +
      '<p class="st-note" id="stKeepTxt" hidden></p>' +
      '<div class="st-data-act"><button class="btn primary small" id="stSave">Save a backup</button><button class="btn small" id="stLoadBtn">Restore from a backup</button></div>' +
      '<input type="file" id="stLoad" accept=".json,application/json" hidden>' +
      '<p class="st-note" id="stLast"></p>' +
      '<div class="st-restore" id="stRestore" aria-live="polite" hidden></div>' +
      "</section>";
  }
  function bkMsg(text, bad) {
    var el = $("#stRestore");
    if (!el) { toast(text); return; }
    el.innerHTML = "<p>" + esc(text) + "</p>";
    el.classList.toggle("bad", !!bad);
    el.hidden = false;
    bkShow();
  }
  function bkShow() { var el = $("#stRestore"); if (el && el.scrollIntoView) el.scrollIntoView({ block: "nearest", behavior: RM ? "auto" : "smooth" }); }
  function bkStatus() {
    var keep = $("#stKeepTxt"), last = $("#stLast"), r = $("#stRestore");
    if (!keep) return;
    keep.hidden = BK.persisted === null;
    keep.textContent = BK.persisted ? "Your browser has agreed to keep it until you clear it yourself."
      : "Your browser may clear it if your phone runs short of space. Installing Entrain as an app makes that less likely, and a backup keeps it safe either way.";
    var at = +store.get("lastBackup") || 0, kept = nvcLog().length;
    last.textContent = (at ? "Last backup from this device: " + bkWhen(at) + "." : "No backup saved from this device yet.") +
      (kept ? " A backup includes your " + bkN(kept, "kept reflection", "kept reflections") + ", so keep the file somewhere private." : "");
    if (BK.pending) { r.innerHTML = bkOffer(); r.classList.remove("bad"); r.hidden = false; }
    else if (!r.classList.contains("bad")) r.hidden = true;
  }
  function bkWire() {
    $("#stSave").addEventListener("click", bkSave);
    $("#stLoadBtn").addEventListener("click", bkPick);
    $("#stLoad").addEventListener("change", function () { bkRead(this.files && this.files[0]); });
    $("#stRestore").addEventListener("click", function (e) {
      if (e.target.closest("#stRestoreGo")) bkApply();
      else if (e.target.closest("#stRestoreNo")) { BK.pending = null; bkStatus(); }
    });
    bkStatus();
    bkPersist();
  }
  function bkInit() {
    var done = false;
    try { done = sessionStorage.getItem("entrain.restored") === "1"; sessionStorage.removeItem("entrain.restored"); } catch (e) {}
    if (done) toast("Backup restored.");
    bkPersist();
  }
