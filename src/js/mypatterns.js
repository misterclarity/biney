  /* ---------------------- your own breathing patterns ----------------------
     Timings made on the sliders and saved under a name, on this device: up to twelve. Each one
     is a chip beside the presets (its value "my-<uid>"), a row under Yours in the library, a
     result in search, a star for Today and a name in the history. The save row under the
     sliders follows what's on screen: a preset invites a change; timings of your own can be
     saved, or update the saved pattern they came from; a saved pattern can be renamed, or
     deleted with an undo.
  -------------------------------------------------------------------------- */

  var MP_MAX = 12;
  var MP = { list: null, from: "", shown: null };   // from: the saved pattern your timings were changed from

  function mpName(s) { return typeof s === "string" ? s.replace(/\s+/g, " ").trim().slice(0, 40) : ""; }
  // the five timings, only if every one is inside its slider's range and on its half-second steps
  function mpTimes(t) {
    if (!t || typeof t !== "object") return null;
    var o = {};
    for (var i = 0; i < B_FIELDS.length; i++) {
      var f = B_FIELDS[i], v = +t[f.k];
      if (!isFinite(v) || v < f.min || v > f.max || v * 2 !== Math.round(v * 2)) return null;
      o[f.k] = v;
    }
    return o;
  }
  function mpLoad() {
    if (MP.list) return MP.list;
    var a = null, seen = {};
    try { a = JSON.parse(store.get("myBreaths") || "[]"); } catch (e) {}
    MP.list = (Array.isArray(a) ? a : []).map(function (q) {
      var t = q && mpTimes(q.t), name = q && mpName(q.name);
      if (!t || !name || typeof q.uid !== "string" || !/^[a-z0-9]{1,16}$/.test(q.uid) || seen[q.uid]) return null;
      seen[q.uid] = true;
      return { uid: q.uid, name: name, t: t, at: +q.at || 0 };
    }).filter(Boolean).slice(0, MP_MAX);
    return MP.list;
  }
  function mpStore() { store.set("myBreaths", JSON.stringify(mpLoad())); }
  function mpIdx(id) {
    var l = mpLoad();
    for (var i = 0; i < l.length; i++) if ("my-" + l[i].uid === id) return i;
    return -1;
  }
  function mpQ(id) { var i = mpIdx(id); return i < 0 ? null : MP.list[i]; }
  function mpUid() {
    var u;
    do u = Date.now().toString(36) + Math.floor(Math.random() * 1296).toString(36); while (mpIdx("my-" + u) >= 0);
    return u;
  }
  function mpCopy(c) { return { inh: c.inh, sip: c.sip, hold: c.hold, exh: c.exh, rest: c.rest }; }
  // "In 4 s, hold 7 s, out 8 s"
  function mpSteps(t) {
    var s = function (v) { return (v % 1 ? v.toFixed(1) : String(v)) + " s"; };
    return [["In", t.inh], ["top up", t.sip], ["hold", t.hold], ["out", t.exh], ["hold", t.rest]]
      .filter(function (x) { return x[1] > 0; }).map(function (x) { return x[0] + " " + s(x[1]); }).join(", ");
  }
  // a saved pattern in the shape of a preset, for the guide, the library, search and favourites
  function mpPattern(q) {
    return { id: "my-" + q.uid, mine: true, name: q.name, t: q.t, desc: mpSteps(q.t) + ".", goal: "", also: [], posture: ["sit", "lie"], strength: 0 };
  }
  function mpGet(id) { var q = typeof id === "string" ? mpQ(id) : null; return q ? mpPattern(q) : null; }
  function mpAll() { return mpLoad().map(mpPattern); }
  function patName(p) { return p.name || PATTERN_NAMES[p.id] || p.id; }
  // the pattern that already has a name, saved or preset, whatever its case; "" if none
  function mpTaken(name, uid) {
    var n = name.toLowerCase(), l = mpLoad();
    for (var k in PATTERN_NAMES) if (PATTERN_NAMES[k].toLowerCase() === n) return PATTERN_NAMES[k];
    if (n === "custom") return "Custom";
    for (var i = 0; i < l.length; i++) if (l[i].uid !== uid && l[i].name.toLowerCase() === n) return l[i].name;
    return "";
  }
  function mpFreeName() {
    var n = mpLoad().length;
    for (var i = n + 1; i <= n + MP_MAX + 1; i++) if (!mpTaken("My pattern " + i)) return "My pattern " + i;
    return "My pattern " + Date.now().toString(36);
  }

  /* ----- the chips beside the presets ----- */
  function mpChips() {
    var row = $("#bPats"), cust = row.querySelector('input[value="custom"]').parentNode;
    row.querySelectorAll("label[data-my]").forEach(function (l) { l.remove(); });
    mpLoad().forEach(function (q) {
      var lab = document.createElement("label");
      lab.className = "chip b-mychip";
      lab.dataset.my = q.uid;
      lab.title = q.name;
      lab.innerHTML = '<input type="radio" name="bpat" value="my-' + q.uid + '"><span class="b-myn">' + esc(q.name) + "</span>";
      row.insertBefore(lab, cust);
    });
    checkRadio("bpat", BC.pattern);
    syncChips("#bPats");
    edgeFade(row);
  }

  /* ----- the save row, under the sliders ----- */
  function mpRow() {
    var row = $("#bMine");
    if (!row) return;
    var id = BC.pattern, q = mpQ(id), mode = q ? "mine" : id === "custom" ? "custom" : "preset";
    var dup = mode === "custom" ? matchPreset() : "custom";        // a pattern that already has these timings
    var from = mode === "custom" && dup === "custom" ? mpQ(MP.from) : null;
    var full = mode === "custom" && mpLoad().length >= MP_MAX, open = mode === "mine" || (mode === "custom" && dup === "custom");
    var inp = $("#bMyName"), hint;
    row.hidden = !!B.finder;                                         // the resonance test's timings aren't yours to keep
    if (MP.shown !== id) { MP.shown = id; inp.value = q ? q.name : ""; }
    row.classList.toggle("quiet", !open);
    $("#bMyLab").hidden = $("#bMyRow").hidden = !open;
    bSetT("#bMyLab", q ? "Your pattern" : "Save as your own pattern");
    bSetT("#bMySave", q ? "Rename" : "Save");
    $("#bMyDel").hidden = !q;
    $("#bMyUpd").hidden = !from;
    if (from) bSetT("#bMyUpd", "Update “" + from.name + "” instead");
    inp.disabled = full;
    inp.placeholder = full ? "No room for another" : "A name, like Evening 4-6";
    mpCanSave();
    if (mode === "preset") hint = "Change any timing to make a pattern of your own, then name it and save it here.";
    else if (dup !== "custom") hint = preset(dup).mine ? "These timings are saved as “" + patName(preset(dup)) + "”." : "These are the timings of " + patName(preset(dup)) + ". Change one to make your own.";
    else if (q) hint = "Saved on this device. Change a timing to make a variation of it.";
    else if (full) hint = "You have " + MP_MAX + " saved patterns, as many as there's room for. Delete one to save another.";
    else hint = "It goes beside the presets, and into Practice and search.";
    bSetT("#bMyHint", hint);
  }
  // Rename waits for a new name; Save, for room
  function mpCanSave() {
    var q = mpQ(BC.pattern), n = mpName($("#bMyName").value);
    var no = q ? !n || n === q.name : mpLoad().length >= MP_MAX;
    $("#bMySave").setAttribute("aria-disabled", no ? "true" : "false");
  }
  function mpRefresh() { mpChips(); renderNote(); saveBreath(); }

  function mpSave() {
    if (B.finder || P.usesB) return;
    var q = mpQ(BC.pattern), l = mpLoad(), name = mpName($("#bMyName").value), clash;
    if (q) {                                                         // a new name for the one on screen
      if (!name || name === q.name) return;
      if ((clash = mpTaken(name, q.uid))) { bSetT("#bMyHint", "There's already a pattern called “" + clash + "”. Pick another name."); return; }
      q.name = name;
      mpStore();
      MP.shown = null;
      mpChips(); renderNote();
      toast("Renamed to “" + name + "”.", { ms: 3000 });
      return;
    }
    if (BC.pattern !== "custom" || matchPreset() !== "custom" || l.length >= MP_MAX) return;
    name = name || mpFreeName();
    if ((clash = mpTaken(name))) { bSetT("#bMyHint", "There's already a pattern called “" + clash + "”. Pick another name."); return; }
    q = { uid: mpUid(), name: name, t: mpCopy(BC), at: Date.now() };
    l.push(q);
    mpStore();
    BC.pattern = "my-" + q.uid; MP.from = "";
    mpRefresh();
    toast("Saved “" + name + "”. It's beside the presets, and in Practice under Yours.", { ms: 4500 });
  }
  // the changed timings go back into the saved pattern they came from
  function mpUpdate() {
    var q = mpQ(MP.from);
    if (!q || B.finder || P.usesB || BC.pattern !== "custom" || matchPreset() !== "custom") return;
    q.t = mpCopy(BC); q.at = Date.now();
    mpStore();
    BC.pattern = "my-" + q.uid; MP.from = "";
    mpRefresh();
    toast("Updated “" + q.name + "”: " + mpSteps(q.t).toLowerCase() + ".", { ms: 4000 });
  }
  // gone at once, with an undo; the timings stay on the sliders, so the undo can pick it back up
  function mpDelete() {
    var id = BC.pattern, i = mpIdx(id);
    if (i < 0 || B.finder || P.usesB) return;
    var q = MP.list.splice(i, 1)[0], key = "b:" + id, fi = favList().indexOf(key);
    mpStore();
    if (fi >= 0) favSet(key, false);
    BC.pattern = "custom"; MP.from = "";
    mpRefresh();
    toast("Deleted “" + q.name + "”.", { action: "Undo", ms: 8000, onAct: function () {
      if (mpIdx(id) >= 0 || mpLoad().length >= MP_MAX) return;
      MP.list.splice(Math.min(i, MP.list.length), 0, q);
      mpStore();
      if (fi >= 0) favPut(key, fi);
      if (BC.pattern === "custom" && sameT(q.t, BC)) BC.pattern = id;
      MP.shown = null;
      mpRefresh();
    } });
  }

  function mpInit() {
    mpChips();
    $("#bMySave").addEventListener("click", function () { if (this.getAttribute("aria-disabled") !== "true") mpSave(); });
    $("#bMyUpd").addEventListener("click", mpUpdate);
    $("#bMyDel").addEventListener("click", mpDelete);
    var inp = $("#bMyName");
    inp.addEventListener("input", mpCanSave);
    inp.addEventListener("keydown", function (e) {
      if (e.key !== "Enter") return;
      e.preventDefault();
      $("#bMySave").click();
      if (window.matchMedia && window.matchMedia("(pointer: coarse)").matches) inp.blur();   // and the keyboard goes
    });
  }
