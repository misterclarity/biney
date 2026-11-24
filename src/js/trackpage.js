  /* ------------------------------- track pages -------------------------------
     Each track has a page of its own, like a practice: what it's for, how it runs, the
     evidence and the cautions, with Play in reach. It plays in the mini player, so the rest
     of the app stays open while you listen.
  ---------------------------------------------------------------------------- */

  var TR = { id: "" };              // the track on the page

  function trackById(id) { for (var i = 0; i < TRACKS.length; i++) if (TRACKS[i].id === id) return TRACKS[i]; return null; }
  function trCol(t) { return "var(--" + (t.cat === "relax" ? "relax" : t.cat === "ther" ? "ther" : "stim") + ")"; }
  function trBeatTxt(t) {
    var a = t.pts ? t.pts[0][1] : typeof t.rampFrom === "number" ? t.rampFrom : t.beat;
    return a === t.beat ? t.beat + " Hz" : a + " → " + t.beat + " Hz";
  }
  // how it runs, from the track's own numbers and the way its beat plays (beatmode.js)
  function trHow(t) {
    var a = t.pts ? t.pts[0][1] : typeof t.rampFrom === "number" ? t.rampFrom : t.beat, m = bmTrackMode(t);
    var s = Math.round(t.minutes) + " minutes" + (a === t.beat
      ? " of a steady " + t.beat + " Hz " + bandFor(t.beat).name.toLowerCase() + " beat"
      : ", the beat sliding from " + a + " Hz " + bandFor(a).name.toLowerCase() + " down to " + t.beat + " Hz " + bandFor(t.beat).name.toLowerCase()) +
      (m === "monaural" ? ", two tones, " + t.carrier + " Hz and one a little higher, both in each ear, so the sound itself swells and fades at the beat."
        : m === "isochronic" ? ", one tone of " + t.carrier + " Hz in both ears, switched on and off at the beat, with soft edges."
        : ", one tone of " + t.carrier + " Hz in your left ear and one a little higher in your right.") + " It fades out at the end.";
    if (t.notch) s += " Underneath, pink noise with a one-octave gap centred on your own tinnitus pitch.";
    else s += " The player can add a pink-noise bed, rain, crickets or nature sounds underneath.";
    return s;
  }
  function trNeeds(t) {
    var n = [bmNeed(bmTrackMode(t)), ["volume", "Low volume", "a quiet, comfortable level is enough"]];
    if ((t.posture || []).indexOf("lie") >= 0) n.push(["moon", "Lying down", "or sitting back, somewhere you can rest"]);
    return n;
  }

  function trOpen(id) {
    var t = trackById(id);
    if (!t) { location.replace("#practice"); return; }
    TR.id = id;
    var g = goalOf(t.goal), key = "t:" + t.id;
    var kind = [g ? g.name : t.goal === "tinnitus" ? "Tinnitus" : "", "Sound", Math.round(t.minutes) + " min"].filter(Boolean).join(" · ");
    var h = '<a class="si-back" href="#practice"><svg class="i" aria-hidden="true"><use href="#i-back"/></svg>Menu</a>' +
      '<div class="si-head">' +
        '<div class="si-top"><span class="si-kind">' + esc(kind) + "</span>" + favBtn(key, t.name) + "</div>" +
        "<h2>" + esc(t.name) + "</h2>" +
        '<p class="si-blurb">' + esc(t.desc) + "</p>" +
        '<p class="si-parts">' + esc(t.band + " · beat " + trBeatTxt(t) + " · carrier " + t.carrier + " Hz") + "</p>" +
      "</div>" +
      '<div class="si-grid"><div class="si-main">' +
        '<ul class="si-need" id="trNeeds">' + trNeedsHtml(t) + "</ul>" +
        (t.notch ? '<div class="tr-notch" id="trNotch"></div>' : bmRow()) +      // the notched track is binaural only
        '<h3>How it runs</h3><p id="trHow">' + esc(trHow(t)) + "</p>" +
        aqSlot(aqTrackKinds(t)) +                                          // air the room and the tips, on focus and sleep tracks (air.js)
        (t.brk ? '<p class="si-tip nt-after">' + ntAfterHtml("After the block.") + "</p>" : "") +     // a break when the work is done (nature.js)
        lpSlot(t) +                                                        // the light pulse, on the 40 Hz tracks (pulse.js)
        '<details class="ev si-ev"><summary>Evidence ' + dots(t.strength) + '</summary><div class="ev-body">' + esc(t.ev) + "<cite>" + esc(t.cite) + "</cite></div></details>" +
        safeBox([SAFE_BEATS]) +
      "</div>" +
      '<div class="si-side"><div class="si-bar">' +
        '<button class="btn primary si-go" id="trGo"></button>' +
        '<p class="si-bar-note" id="trSupNote" hidden>' + SUP_NOTE + "</p>" +
        '<p class="si-bar-note">Plays in the player at the bottom, so you can keep using the app while you listen.</p>' +
      "</div></div></div>";
    var el = $("#trBody");
    el.innerHTML = h;
    el.style.setProperty("--pcol", trCol(t));
    bSetT("#viewTitle", t.name);
    document.title = t.name + " | Entrain";
    trSync();
    themeSync();                                       // a sleep track turns the bedtime colours on
  }
  function trNeedsHtml(t) {
    return trNeeds(t).map(function (n) {
      return '<li><svg class="i" aria-hidden="true"><use href="#i-' + n[0] + '"/></svg><span><b>' + n[1] + "</b> " + n[2] +
        (n[3] ? ' <button class="btn link si-check" data-check="1">Check yours</button>' : "") + "</span></li>";
    }).join("");
  }
  // a new choice of how beats play: the page says what it needs and how it runs now
  function trBmSync() {
    var t = trackById(TR.id), n = $("#trNeeds");
    if (!t || !n || t.notch) return;
    n.innerHTML = trNeedsHtml(t);
    bSetT("#trHow", trHow(t));
  }
  // the page follows the player: Play, Pause or Resume, and the notch
  function trSync() {
    var t = trackById(TR.id), b = $("#trGo");
    if (!t || !b) return;
    var mine = A.track && A.track.id === t.id, ic, txt, lk = !mine && supLocked(t);
    if (mine && A.playing) { ic = "pause"; txt = "Pause"; }
    else if (mine && A.elapsed > 0) { ic = "play"; txt = "Resume at " + fmt(A.elapsed); }
    else if (lk) { ic = "cup"; txt = "Unlock to play"; }               // a new technique, not yet unlocked on this device
    else { ic = "play"; txt = "Play " + Math.round(t.minutes) + " min"; }
    b.innerHTML = '<svg class="i' + (ic === "play" ? "" : " ic-stroke") + '" aria-hidden="true"><use href="#i-' + ic + '"/></svg>' + esc(txt);
    $("#trSupNote").hidden = !lk;
    var n = $("#trNotch");
    if (n) n.innerHTML = tinnitusHz()
      ? "<span>Notch centred on <b>" + Math.round(tinnitusHz()) + " Hz</b>, your tinnitus pitch.</span>" + '<button class="btn small" data-rematch="1">Match again</button>'
      : "<span>The notch needs your tinnitus pitch first: a minute with a tone you tune to match it.</span>" + '<button class="btn small" data-rematch="1">Match your pitch</button>';
    lpUI();                                    // the light pulse's card, on a 40 Hz track (pulse.js)
  }
  function trPlay() {
    var t = trackById(TR.id);
    if (!t) return;
    if (A.track && A.track.id === t.id && A.playing) { pause(); return; }
    if (A.track && A.track.id === t.id && !A.playing && A.elapsed > 0) { play(); return; }
    if (supLocked(t)) { supGate(t.name, trPlay); return; }              // a new technique: unlocked first
    gate(function () {
      if (t.notch && !tinnitusHz()) {          // the notch is useless until it is aimed
        pendingPitch = function () { load(t); };
        openMatcher();
        return;
      }
      load(t);
    }, bmTrackMode(t));                        // on speakers (monaural, isochronic) there's no headphone check
  }
  function trInit() {
    $("#trBody").addEventListener("click", function (e) {
      if (e.target.closest("#trGo")) { trPlay(); return; }
      if (e.target.closest("[data-rematch]")) { pendingPitch = null; openMatcher(); }
    });
    // any page's "Check yours": the headphone check on its own
    document.addEventListener("click", function (e) {
      if (!e.target.closest("[data-check]")) return;
      pendingPlay = null;
      openCheck();
    });
  }
