  /* ------------------------------ new techniques ------------------------------
     The techniques from the brain-wave guide open with a donation of €1 or more on Ko-fi, once on
     each device. Entrain has no server and sends nothing anywhere, so the check happens here: this
     device gets a random code; the developer signs it with a private key (src/unlock.js) and sends
     the activation code back by email; the page checks the signature against the public keys below
     with the browser's own cryptography (ECDSA P-256 with SHA-256). A code opens only the device it
     was made for, and backups never carry it (both keys are in backup.js's BK_SKIP).

     For every new feature: give the practice, breathing pattern or track `sup: true`, and call
     supGate(name, go) at the moment of use (Start, Play, picking it); its page stays free to read.
     supTag() is the badge for its row, card or chip while it's locked, and supOn() says whether
     this device is unlocked.
  ------------------------------------------------------------------------------ */

  // the public keys that sign activation codes: several, so a key can be replaced without breaking codes already sent
  var SUP_KEYS = [{"kty":"EC","crv":"P-256","x":"x7VHEChKqEpO9I-LcD_e_nSFgbTr33QoZV1CsGGYQD0","y":"9wadtgrOJmDJAiAz4IQqZzR6gIa1_fbRnHOL5jDb4rc"}];
  var SUP_ABC = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";      // Crockford's base 32: no I, L, O or U to misread
  var SUP_MSG = "entrain-unlock-v1:";                    // what's signed: this, then the device's ten characters
  var SUP_RE = /([0-9A-Z]{5}-?[0-9A-Z]{5})\.([A-Za-z0-9_-]{86})/i;
  var SUP_NOTE = "One of the new techniques: it opens with a donation of €1 or more, once on each device.";
  var SUP_EACH = "It unlocks this device and this browser only. On another device, or once this browser's data is cleared, a new donation unlocks it there. Backups don't carry it.";
  /* state: none (no code kept), checking (a kept code being checked), ok, wrong-device, bad (not signed by
     a key here), no-crypto (a page the browser gives no cryptography, such as plain http).
     waits: gates waiting for a check to finish. mem: the device code for this visit only, when the browser
     keeps nothing (an unlock then lasts as long as ok does, until the page closes). keys: the imported
     public keys. Then the open dialog: the item it names and what to tell when it closes; and the last
     activation's result, with where it shows (the dialog, Settings, or a link, shown in Settings). */
  var SUP = { ok: false, state: "none", waits: [], mem: "", keys: null, name: "", done: [], res: null };

  function supOn() { return SUP.ok; }
  // an item that needs the gate before it's used: flagged, and this device not unlocked (yet)
  function supLocked(x) { return !!(x && x.sup) && !SUP.ok; }
  // the badge for a locked item's row, card or chip ("" once unlocked); icon: the cup alone, for a chip
  function supTag(icon) {
    if (SUP.ok) return "";
    var cup = '<svg class="i" aria-hidden="true"><use href="#i-cup"/></svg>';
    return icon ? '<span class="sup-tag sup-ic" role="img" aria-label="Opens with a donation" title="Opens with a donation">' + cup + "</span>"
      : '<span class="sup-tag">' + cup + "Donation</span>";
  }
  // whether this page can check a code: the browser keeps its cryptography for https and files on the device
  function supCan() { return !!(window.crypto && crypto.subtle && crypto.subtle.verify && window.TextEncoder); }

  /* ----- the device code ----- */
  // what was typed or pasted: capitals, no spaces or dashes, and O, I and L read as the digits they look like
  function supNorm(s) { return String(s || "").toUpperCase().replace(/[\s-]+/g, "").replace(/O/g, "0").replace(/[IL]/g, "1"); }
  function supValid(d) { return d.length === 10 && d.split("").every(function (c) { return SUP_ABC.indexOf(c) >= 0; }); }
  function supFmt(d) { return d.slice(0, 5) + "-" + d.slice(5); }
  // this device's code, made the first time it's needed and kept; a browser that keeps nothing gets one for this visit
  function supDevice() {
    var d = supNorm(store.get("device"));
    if (supValid(d)) return d;
    if (SUP.mem) return SUP.mem;
    var a = new Uint8Array(10);
    try { crypto.getRandomValues(a); } catch (e) { for (var j = 0; j < 10; j++) a[j] = Math.floor(Math.random() * 256); }
    d = "";
    for (var i = 0; i < 10; i++) d += SUP_ABC.charAt(a[i] & 31);    // 256 is a multiple of 32: every character as likely
    store.set("device", d);
    if (store.get("device") !== d) SUP.mem = d;
    return d;
  }

  /* ----- activation codes ----- */
  // { device, sig, code } from a code or a link, wherever it is in the text (an email may have wrapped it), or null
  function supParse(text) {
    var m = String(text || "").replace(/\s+/g, "").match(SUP_RE);
    if (!m) return null;
    var dev = supNorm(m[1]);
    return supValid(dev) ? { device: dev, sig: m[2], code: dev + "." + m[2] } : null;
  }
  function supBytes(b64) {
    var s = b64.replace(/-/g, "+").replace(/_/g, "/");
    while (s.length % 4) s += "=";
    var bin = atob(s), out = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  }
  // a promise: did one of SUP_KEYS sign this device's code?
  function supSigned(a) {
    var sub = crypto.subtle, sig, data;
    try { sig = supBytes(a.sig); data = new TextEncoder().encode(SUP_MSG + a.device); } catch (e) { return Promise.resolve(false); }
    if (sig.length !== 64) return Promise.resolve(false);
    if (!SUP.keys) SUP.keys = SUP_KEYS.map(function (k) {
      return sub.importKey("jwk", { kty: "EC", crv: "P-256", x: k.x, y: k.y, ext: true }, { name: "ECDSA", namedCurve: "P-256" }, false, ["verify"])
        .catch(function () { return null; });
    });
    return Promise.all(SUP.keys.map(function (kp) {
      return kp.then(function (key) { return key ? sub.verify({ name: "ECDSA", hash: "SHA-256" }, key, sig, data) : false; }).catch(function () { return false; });
    })).then(function (r) { return r.indexOf(true) >= 0; });
  }
  // a promise of what a code is: ok (for this device), wrong-device (signed, for another), bad, or no-crypto
  function supCheck(a) {
    if (!supCan()) return Promise.resolve("no-crypto");
    return supSigned(a).then(function (y) { return !y ? "bad" : a.device === supDevice() ? "ok" : "wrong-device"; }, function () { return "bad"; });
  }
  // what a result means, in a sentence
  function supSay(r, a) {
    if (r === "ok") return "Unlocked on this device. Thank you for your donation.";
    if (r === "wrong-device") return "That code is for another device, " + supFmt(a.device) + ". This device's code is " + supFmt(supDevice()) +
      ": a donation with it unlocks this one.";
    if (r === "no-crypto") return "This page can't check codes. Open Entrain from its web address (https) or as a file on this device, then try again.";
    if (r === "empty") return "Paste the activation code or link from the email first.";
    if (r === "busy") return "Checking…";
    return "That isn't a valid activation code. Check that you copied all of it.";
  }
  function supSettle() {
    var w = SUP.waits;
    SUP.waits = [];
    w.forEach(function (x) { try { x.fn(); } catch (e) {} });
  }
  // a code from the paste field (where: "dlg" or "st") or a link ("link"); then(result) once it's decided
  function supActivate(text, where, then) {
    var a = supParse(text), show = function (r) {
      SUP.res = { r: r, txt: supSay(r, a), where: where };
      supResult();
      if (then) then(r);
    };
    if (!a) { show(String(text || "").trim() ? "bad" : "empty"); return; }
    show("busy");
    supCheck(a).then(function (r) {
      if (r === "ok") {
        store.set("unlock", a.code);                  // kept; a browser that keeps nothing still has it for this visit
        SUP.ok = true; SUP.state = "ok";
        supSettle();
      }
      show(r);
      if (r === "ok") supRefresh();
    });
  }

  /* ----- the gate ----- */
  /* Called at the moment of use. Unlocked: go() runs, and it returns true. While a kept code is being
     checked (a moment after the app opens), it waits for the answer, then decides. Otherwise the dialog
     opens, naming what was tapped, and go isn't called; done(unlocked), if given, runs when it closes. */
  function supGate(name, go, done) {
    if (SUP.ok) { go(); return true; }
    if (SUP.state === "checking") {
      SUP.waits = SUP.waits.filter(function (x) { return x.name !== name; });     // tapped twice while waiting: once
      SUP.waits.push({ name: name, fn: function () { if (SUP.ok) go(); else supOpen(name, done); } });
      return false;
    }
    supOpen(name, done);
    return false;
  }

  /* ----- the dialog ----- */
  function supOpen(name, done) {
    if ($("#bStage").classList.contains("focus")) setFocus(false);    // Breathe's full-screen stage would hide it
    if ($("#supModal").hidden) SUP.done = [];
    SUP.name = name || "";
    if (done) SUP.done.push(done);                   // asked for again while open (a link and Breathe opening, say): each hears when it closes
    if (SUP.res && SUP.res.where === "dlg") SUP.res = null;
    $("#supIn").value = "";
    $("#supSaid").hidden = true;
    supDlgSync();
    if ($("#supModal").hidden) { openDialog("#supModal"); $("#supModal .modal-card").scrollTop = 0; }
    setTimeout(function () { try { $(SUP.ok ? "#supClose" : "#supCopy").focus({ preventScroll: true }); } catch (e) {} }, 30);
  }
  function supClose() {
    if ($("#supModal").hidden) return;
    var done = SUP.done;
    SUP.done = [];
    closeDialog("#supModal");
    done.forEach(function (f) { try { f(SUP.ok); } catch (e) {} });
  }
  // the warning a browser may need: one that can't check codes, or keeps nothing
  function supWarn() {
    supDevice();
    if (!supCan()) return "Unlocking needs Entrain opened from its web address (https) or as a file on this device: this page can't check a code.";
    if (SUP.mem) return "This browser isn't keeping Entrain's data, so an unlock would last only until this page closes.";
    return "";
  }
  function supDlgSync() {
    var w = supWarn();
    $("#supFor").hidden = !SUP.name;
    if (SUP.name) bSetT("#supFor", SUP.name + " is one of the new techniques.");
    bSetT("#supDev", supFmt(supDevice()));
    $("#supWarn").hidden = !w;
    bSetT("#supWarn", w);
    $("#supSteps").hidden = SUP.ok;
    bSetT("#supClose", SUP.ok ? "Close" : "Not now");
    supResult();
  }
  // the result line, in the dialog or in Settings
  function supResult() {
    var r = SUP.res;
    [["dlg", "#supRes"], ["st", "#supStRes"]].forEach(function (x) {
      var el = $(x[1]), on = !!r && (r.where === x[0] || (x[0] === "st" && r.where === "link"));
      if (!el) return;
      el.textContent = on ? r.txt : "";
      el.hidden = !on;
      el.className = "sup-res" + (on ? " " + (r.r === "ok" ? "ok" : r.r === "busy" ? "" : "bad") : "");
    });
  }
  // Copy: to the clipboard, or, where the browser won't, the code selected to copy by hand
  function supCopy(codeSel, saidSel) {
    var txt = supFmt(supDevice());
    copyText(txt, function (ok) {
      if (!ok) {
        try { var r = document.createRange(), s = window.getSelection(); r.selectNodeContents($(codeSel)); s.removeAllRanges(); s.addRange(r); } catch (e) {}
      }
      bSetT(saidSel, ok ? "Copied: " + txt : "It's selected: copy it from your browser's menu.");
      $(saidSel).hidden = false;
    });
  }

  /* ----- Settings: New techniques ----- */
  // what the donation unlocks, from the items flagged sup, so it stays current
  function supItems() {
    var out = [];
    PRACTICES.forEach(function (d) { if (d.sup) out.push({ name: d.name, href: "#practice/" + d.id }); });
    BREATHS.forEach(function (b) { if (b.sup) out.push({ name: patName(b), href: "#breathe/" + b.id }); });
    TRACKS.forEach(function (t) { if (t.sup) out.push({ name: t.name, href: "#track/" + t.id }); });
    return out;
  }
  function supCard() {
    return '<section class="st-card" id="st-supporter" aria-labelledby="stU"><h2 id="stU">New techniques</h2>' +
      '<p class="st-note">The techniques from the brain-wave guide open with a donation of €1 or more on Ko-fi, once on each device.</p>' +
      '<p class="sup-st" id="supSt"></p>' +
      '<div class="sup-dev"><span class="sup-dl">Your device code</span><code class="mono" id="supStDev"></code><button class="btn" id="supStCopy">Copy</button></div>' +
      '<p class="sup-said" id="supStSaid" aria-live="polite" hidden></p>' +
      '<div class="sup-how" id="supStHow"><p>Donate €1 or more on Ko-fi and put your device code in the message. You\'ll get an activation link by email: open it on this device, or paste the code here.</p>' +
        '<a class="btn donate" href="' + DONATE + '" target="_blank" rel="noopener"><svg class="i" aria-hidden="true"><use href="#i-cup"/></svg>Donate on Ko-fi</a>' +
        '<div class="sup-paste"><input id="supStIn" type="text" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="Activation code or link" aria-label="Activation code or link">' +
        '<button class="btn primary" id="supStGo">Activate</button></div></div>' +
      '<p class="sup-res" id="supStRes" aria-live="polite" hidden></p>' +
      '<p class="sup-warn" id="supStWarn" hidden></p>' +
      '<p class="st-note">' + SUP_EACH + "</p>" +
      '<h3 class="sup-h">What it unlocks</h3><ul class="sup-list" id="supList"></ul>' +
      "</section>";
  }
  function supStSync() {
    var st = $("#supSt");
    if (!st) return;
    var w = supWarn(), items = supItems();
    st.innerHTML = SUP.ok ? "<b>Unlocked on this device.</b> Thank you for your donation." : SUP.state === "checking" ? "Checking this device's code…" : "<b>Locked</b> on this device.";
    st.classList.toggle("on", SUP.ok);
    bSetT("#supStDev", supFmt(supDevice()));
    $("#supStHow").hidden = SUP.ok;
    $("#supStWarn").hidden = !w;
    bSetT("#supStWarn", w);
    $("#supList").innerHTML = items.length ? items.map(function (x) { return '<li><a href="' + esc(x.href) + '">' + esc(x.name) + "</a></li>"; }).join("")
      : "<li>None yet: they come in an update, and open here once this device is unlocked.</li>";
    supResult();
  }
  function supStWire() {
    var go = $("#supStGo");
    if (!go) return;
    $("#supStCopy").addEventListener("click", function () { supCopy("#supStDev", "#supStSaid"); });
    go.addEventListener("click", function () { supActivate($("#supStIn").value, "st"); });
    $("#supStIn").addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); supActivate(this.value, "st"); } });
    $("#supStIn").addEventListener("input", function () { if (SUP.res && SUP.res.where !== "dlg") { SUP.res = null; supResult(); } });
    supStSync();
  }

  /* ----- links: #unlock opens the dialog; #unlock/<code> unlocks from the email ----- */
  function supRoute(code, from) {
    if (code) {
      location.replace("#st-supporter");                       // the code doesn't stay in the history
      supActivate(code, "link", function (r) {
        if (r === "ok") toast("Unlocked on this device. Thank you for your donation.");
        if (r !== "busy" && curView === "settings") { var sec = $("#st-supporter"); if (sec) setTimeout(function () { jumpTo(sec); }, 30); }
      });
      return;
    }
    if (SUP.ok) { location.replace("#st-supporter"); return; }
    var back = from && from.indexOf("#") >= 0 ? from.slice(from.indexOf("#")) : "";
    if (curView && !/^#unlock/.test(back)) {                   // over the page you were on, which keeps its address
      try { history.replaceState(null, "", back || location.pathname + location.search); } catch (e) {}
    } else location.replace("#st-supporter");                  // opened at #unlock: over Settings' section
    supOpen("");
  }

  /* ----- whatever shows a lock: redrawn once the answer is known ----- */
  function supRefresh() {
    FD.base = null;                                           // search builds its index again, with or without the badges
    if (FD.open) fdRender();
    bSupChips();
    if (curView === "home") todayRender();
    else if (curView === "practice") pRenderLib();
    else if (curView === "session" && P.view && !$("#sIntro").hidden) pIntroReplan(P.view);
    else if (curView === "track") trSync();
    supStSync();
    if (!$("#supModal").hidden) supDlgSync();
  }

  // the kept code, checked as Entrain opens
  function supKept() {
    var kept = store.get("unlock"), a = kept ? supParse(kept) : null;
    SUP.ok = false;
    SUP.state = !kept ? "none" : !a ? "bad" : "checking";
    if (a) supCheck(a).then(function (r) {
      if (SUP.state === "checking") { SUP.state = r; SUP.ok = r === "ok"; }    // unless a code pasted meanwhile has decided it
      supSettle();
      supRefresh();
    });
  }
  function supInit() {
    supKept();
    $("#supKofi").href = DONATE;
    $("#supCopy").addEventListener("click", function () { supCopy("#supDev", "#supSaid"); });
    $("#supGo").addEventListener("click", function () { supActivate($("#supIn").value, "dlg"); });
    $("#supIn").addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); supActivate(this.value, "dlg"); } });
    $("#supIn").addEventListener("input", function () { if (SUP.res && SUP.res.where === "dlg") { SUP.res = null; supResult(); } });
    $("#supClose").addEventListener("click", supClose);
    $("#supModal").addEventListener("click", function (e) { if (e.target === this) supClose(); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !$("#supModal").hidden) { e.preventDefault(); supClose(); } });
  }
