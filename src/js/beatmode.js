  /* ------------------------------ the beat's sound ------------------------------
     A beat can play three ways, each built by audio.js (aVoices): binaural, a tone in each ear, which needs
     headphones; monaural, both tones mixed into both ears; and isochronic, one tone switched on and off at the
     beat. The last two come through speakers too. They are new techniques from the brain-wave guide, so
     picking one opens with a donation (supporter.js), and until this device is unlocked every beat plays
     binaural, whatever was kept. The choice is this device's own (store "beatMode"): Settings, a track's page,
     the beat builder and the custom primer show it and change it, and a practice follows it unless it keeps one
     of its own under Options (P.opt.beatMode). The notched tinnitus track always plays binaural, as its
     studies did.
  ------------------------------------------------------------------------------ */

  var BM_MODES = [["binaural", "Binaural", "headphones"], ["monaural", "Monaural", "speakers"], ["isochronic", "Isochronic", "speakers"]];
  var BM_NAME = { monaural: "The monaural beat", isochronic: "The isochronic tone" };      // the unlock dialog: "… is one of the new techniques."
  var BM_NOTE = "Binaural needs headphones; monaural and isochronic play on speakers too.";

  function bmOk(m) { return m === "binaural" || m === "monaural" || m === "isochronic"; }
  // this device's choice, as kept
  function bmStored() { var m = store.get("beatMode"); return bmOk(m) ? m : "binaural"; }
  // what will play: a kept choice (a practice's own, or else this device's), binaural until this device is unlocked
  function bmMode(m) {
    m = bmOk(m) ? m : bmStored();
    return m !== "binaural" && !supOn() ? "binaural" : m;
  }
  // a track as it will play: a practice's beat carries its own choice; the notched track is binaural
  function bmTrackMode(t) { return t && t.notch ? "binaural" : bmMode(t && t.beatMode); }

  /* Picking one, at the moment of use: binaural at once, a speaker way once this device is unlocked; if the
     dialog unlocks it, the pick goes ahead as it closes. */
  function bmPick(m, then) {
    if (!bmOk(m)) return;
    if (m === "binaural" || supOn()) { then(m); return; }
    supGate(BM_NAME[m], function () { then(m); }, function (ok) { if (ok) then(m); });
  }
  // this device's choice: kept, shown wherever it is, and taken up by a track that's playing
  function bmSet(m) {
    store.set("beatMode", m);
    if (!pBusy() && P.optFor) P.opt = pOptsOf(P.optFor);      // an open practice page with no choice of its own follows it
    bmSync();
    bmLive();
  }
  // the track in the player follows a new choice at once (not a practice's beat, which keeps its own, nor the notched track)
  function bmLive() {
    if (!A.track || A.track.practice || A.track.notch || A.track.sleep) return;     // Sleep sounds has no beat
    var m = bmMode();
    if (m === A.mode) return;
    A.mode = m;
    paintCache = {};
    if (A.phase !== "task") $("#pSub").textContent = trackSub(A.track);
    aSwapVoices();
    paint();
    msSync();
    micBeatGuard();
  }

  /* ----- what it looks like ----- */
  // three buttons, each with what it plays on; the cup on the two that open with a donation while this device is locked.
  // scope: "dev" for this device's choice (handled here), "prac" for a practice's own (practice.js)
  function bmSeg(id, cur, scope) {
    return '<div class="mini-seg bm-seg"' + (id ? ' id="' + id + '"' : "") + ' data-bm-for="' + scope + '" role="group" aria-label="Sound">' +
      BM_MODES.map(function (o) {
        return '<button type="button" data-bm="' + o[0] + '" aria-pressed="' + (o[0] === cur) + '"><b>' + o[1] + "</b><small>" + o[2] +
          (o[0] !== "binaural" ? supTag(true) : "") + "</small></button>";
      }).join("") + "</div>";
  }
  // the row on a track's page, the beat builder and the primer
  function bmRow() {
    return '<div class="so-row so-seg bm-row"><span class="so-l">Sound<small>' + BM_NOTE + " Your choice for every beat; a practice can keep its own.</small></span>" +
      bmSeg("", bmMode(), "dev") + "</div>";
  }
  // Settings: the default for every beat
  function bmCard() {
    return '<section class="st-card" id="st-beats" aria-labelledby="stB"><h2 id="stB">Beats</h2>' +
      '<p class="st-note">How every beat plays. Binaural puts a tone in each ear and needs headphones. Monaural mixes the two tones in both ears, ' +
      "and isochronic switches one tone on and off at the beat, so both play on speakers too. Tracks, the beat builder and the custom primer play it this way, " +
      'and so does every practice unless it keeps its own under Options. <a href="#l-iso">What the research says</a></p>' +
      '<div class="so-row so-seg"><span class="so-l">Sound</span>' + bmSeg("stBeat", bmMode(), "dev") + "</div>" +
      "</section>";
  }
  // what a beat needs, for the needs list: its icon, its name, why, and whether to offer the headphone check
  function bmNeed(m) {
    if (m === "monaural") return ["sounds", "Speakers or headphones", "both tones play in both ears, so the beat comes through either; a phone's own small speaker plays low tones quietly"];
    if (m === "isochronic") return ["sounds", "Speakers or headphones", "one tone pulses at the beat, so it comes through either; a phone's own small speaker plays low tones quietly"];
    return ["sounds", "Headphones", "each ear gets its own tone; on speakers they mix and the beat disappears", true];
  }
  function bmNeedHtml(m) {
    var n = bmNeed(m);
    return '<svg class="i" aria-hidden="true"><use href="#i-' + n[0] + '"/></svg><span><b>' + n[1] + "</b> " + n[2] +
      (n[3] ? ' <button class="btn link si-check" data-check="1">Check yours</button>' : "") + "</span>";
  }
  // everything that shows the choice follows it: the buttons and their cups, the needs lists, the builder's ears, a track's page
  function bmSync() {
    var dev = bmMode();
    document.querySelectorAll(".bm-seg").forEach(function (g) {
      var cur = g.getAttribute("data-bm-for") === "prac" && P.view ? bmMode(pOptsOf(P.view.id).beatMode) : dev;
      g.querySelectorAll("button[data-bm]").forEach(function (b) {
        var m = b.getAttribute("data-bm"), tag = b.querySelector(".sup-tag"), lock = m !== "binaural" && !supOn();
        b.setAttribute("aria-pressed", m === cur ? "true" : "false");
        if (tag && !lock) tag.parentNode.removeChild(tag);
        else if (!tag && lock) b.querySelector("small").insertAdjacentHTML("beforeend", supTag(true));
      });
    });
    document.querySelectorAll("li.bm-need").forEach(function (li) { li.innerHTML = bmNeedHtml(dev); });
    syncBuilder();
    trBmSync();
  }

  function bmInit() {
    SUP_EXTRA.push({ name: "Monaural beats and isochronic tones", href: "#st-beats" });     // Settings' list of what the donation unlocks
    document.querySelectorAll("[data-bm-ctl]").forEach(function (el) { el.innerHTML = bmRow(); });    // the builder and the primer
    document.addEventListener("click", function (e) {
      var b = e.target.closest ? e.target.closest('.bm-seg[data-bm-for="dev"] button[data-bm]') : null;
      if (b) bmPick(b.getAttribute("data-bm"), bmSet);
    });
    bmSync();
  }
