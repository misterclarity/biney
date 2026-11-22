  /* ------------------------------- nature -------------------------------
     Fireside, Restoration Break and walking in a park, from the brain-wave guide's "Vision: what you look
     at" and its Attention Restoration Theory. New techniques: the two practices carry sup: true (their
     entries are in practice-data.js), and Walking Meditation's "In a park" is a choice that opens with a
     donation (c.sup in practice.js); every page, caution and Learn section stays free to read.
       Fireside            the fire scene with its crackle all the way through (a fire on mute showed no
                           effect in the study), slow breaths to begin if you like, then just the fire,
                           20 to 45 minutes, best in the evening (the effect grew the longer people watched)
       Restoration Break   3, 5 or 10 minutes between blocks of work: one of your restful scenes with the
                           nature sound that suits it, one opening line, then no voice, captions or tasks
                           (a "bare" stage: words that need effort to read work against soft fascination);
                           no quote at its end, which suggests taking the next one outside
       In a park           Walking Meditation's guidance turned to the path and to soft fascination:
                           clouds, leaves, birds and water (Berman and colleagues' park walk)
     The break is offered at the end of the Focus Primer (its next), when the Deep Work Block ends and when
     you end the custom primer's working phase (a notice with a way there), and on those two pages. Fresh
     flowers on the desk are a tip in Healthy living's day routine (living-data.js).
  ------------------------------------------------------------------------------ */

  var NT_BARE = 10;                          // seconds the break's opening line stays, before the stage keeps the scene alone
  var NT_OPEN = "Let your eyes rest on the scene and wander wherever they like, for the rest of the break.";
  var NT_PARK = "Walking Meditation in a park";      // the choice's name in the unlock dialog and Settings' list
  var NT_FIRE = ["If your mind wanders, let it come back to the flames and the sound of the fire.",
    "Notice the colours: deep red at the heart of the fire, gold and orange at the tips.",
    "Let your shoulders soften, and your hands rest.",
    "Listen to the crackle, and the quiet between the pops.",
    "Watch the embers rise and fade.",
    "Let your breathing stay slow and easy."];

  /* ----- Fireside ----- */
  // a quiet word now and then, about every six minutes, after the first
  function ntFireLines(secs, breathed) {
    var n = Math.max(1, Math.floor(secs / 360)), out = [[0, breathed ? "Now let the breath go at its own pace, and simply watch the fire."
      : "Let your breathing settle at its own pace, and simply watch the fire."]];
    for (var i = 0; i < n; i++) out.push([Math.round(secs * (i + 1) / (n + 1)), NT_FIRE[i % NT_FIRE.length]]);
    return out;
  }
  function ntFireSteps(d, min) {
    var T = min * 60, F = { vis: "scene", scene: "fire" }, br = pChoice(d, "start") === "breath";
    var steps = [G(45, "By the fire", [[0, "Sit back or lie down, somewhere you can stay a while, with the sound up enough to hear the crackle."],
      [18, "Let your eyes rest on the flames."]], F)];
    if (br) steps.push(Br(180, "Slow breaths", { inh: 4, sip: 0, hold: 0, exh: 6, rest: 0 }, { scene: "fire",
      lines: [[0, "Breathe in for four as the flames rise, and out for six as they settle."], [70, "Let each breath out be soft and slow."],
        [140, "A few more like this, slow and easy."]] }));
    var rest = T - 45 - (br ? 180 : 0) - 60;
    steps.push(G(rest, "Just the fire", ntFireLines(rest, br), ext({ quiet: true }, F)));
    steps.push(G(60, "Back to the room", [[0, "Let the fire burn on as you come back: your hands, your feet, the room around you."],
      [25, "Take a slow breath, and stretch if you like."]], F));
    return steps;
  }

  /* ----- Restoration Break ----- */
  // the scene: the one chosen, or Yours, one of the scenes you find restful, a different one each day (scenes.js)
  function ntScene(d) { var k = pChoice(d, "scene"); return scnGet(k) ? k : scnPick(); }
  // the nature sound that suits it: wind for the clouds and leaves, a stream for the water, birdsong for the forest and the
  // flowers, the fire's crackle; the fractal's ridgelines, which have none of their own, get the wind
  function ntSndOf(id) { return scnSoundOf(id) || "wind"; }
  function ntSndName(id) { var a = ambAddOf(ntSndOf(id)); return a ? a[2].charAt(0).toLowerCase() + a[2].slice(1) : ""; }
  function ntBreakSteps(d, min) {
    var sc = ntScene(d), x = scnGet(sc);
    return [G(min * 60, x ? x.long : "A restful scene", [[0, NT_OPEN]], { vis: "scene", scene: sc, bare: NT_BARE, nobell: true,
      amb: pChoice(d, "snd") === "scene" ? ntSndOf(sc) : "" })];
  }
  function ntSceneNote(d) {
    var k = pChoice(d, "scene"), x = scnGet(ntScene(d));
    return k === "mine" ? "One of the scenes you find restful, picked in Settings, and a different one each day: today, " + x.long.toLowerCase() +
      ". A setting rests your attention best when it suits you." : x.long + ", every time.";
  }
  function ntSndNote(d) {
    var sc = ntScene(d);
    return pChoice(d, "snd") === "scene"
      ? "The nature sound that suits the scene: today, " + ntSndName(sc) + ". Some people find a sound unpleasant, so choose your background instead if you like."
      : "Your own background sound, if you've chosen one, or quiet." + (sc === "fire" ? " The fire always comes with its crackle." : "");
  }

  /* ----- while a step runs ----- */
  // the nature sound the running step asks for, played with the background (ambience.js ambSync adds it)
  function ntSound() {
    if (!supOn() || P.state !== "running") return "";
    var s = P.steps && P.steps[P.idx];
    return s && s.amb && ambAddOf(s.amb) ? s.amb : "";
  }
  // at the start: the sound rendered ahead, so it begins with the scene
  function ntStart(steps) {
    var amb = [];
    steps.forEach(function (s) { if (s.amb && amb.indexOf(s.amb) < 0) amb.push(s.amb); });
    if (amb.length) amNeed(ambLayers(amb.join("+")).map(function (l) { return l[0]; }));
  }
  // a bare step: once its opening line has been read, the stage keeps the scene alone, with no step name, caption or words
  function ntBare(s, st) {
    var on = !!(s && s.bare && pBusy() && st >= s.bare) ? "1" : "", ses = $("#ses");
    if (ses && ses.dataset.bare !== on) ses.dataset.bare = on;
  }

  /* ----- after a block of work: a Restoration Break ----- */
  function ntAfterWork() {
    toast("Block done. A few minutes with a restful scene and its sound lets tired focus recover.", { action: "Restoration Break", ms: 20000,
      onAct: function () { location.hash = "practice/restoration"; } });
  }
  // the Deep Work Block's and the custom primer's pages: the break, with its cup while this device is locked (inside a p.si-tip)
  function ntAfterHtml(lead) {
    return "<b>" + esc(lead) + "</b> A few minutes with one of your restful scenes and its sound, with nothing to read or do, " +
      'lets tired focus recover: <a href="#practice/restoration" data-nt-cup>Restoration Break</a>' + (supLocked(pDef("restoration")) ? supTag(true) : "") + ".";
  }
  // after an unlock: the cups go from those links, and Walking Meditation's In a park (supRefresh)
  function ntUI() {
    document.querySelectorAll("a[data-nt-cup]").forEach(function (a) {
      var tag = a.nextElementSibling, has = !!tag && tag.classList.contains("sup-tag"), lk = supLocked(lnItem(a.getAttribute("href")));
      if (lk && !has) a.insertAdjacentHTML("afterend", supTag(true));
      else if (!lk && has) tag.parentNode.removeChild(tag);
    });
  }

  function ntInit() {
    SUP_EXTRA.push({ name: NT_PARK, href: "#practice/walking" });     // Settings' list of what the donation unlocks
    var pr = $("#primeAfter");
    if (pr) pr.innerHTML = ntAfterHtml("After the work.");
    if (window.__entrain) {
      var X = window.__entrain;
      X.ntSound = ntSound; X.ntScene = ntScene; X.ntSndOf = ntSndOf; X.ntFireLines = ntFireLines; X.ntAfterWork = ntAfterWork; X.NT_BARE = NT_BARE;
    }
  }
