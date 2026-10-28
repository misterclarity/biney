  /* -------------------------------- settings --------------------------------
     What every practice starts with (a practice can change its own under Options on its page),
     the background sound, what's kept of reflections, how the screen behaves, and your data
     (backup.js).
  ------------------------------------------------------------------------------ */

  var ST = { screenSessions: true, screenTracks: true, sleepDim: false, lockControls: true };

  function stLoad() {
    try {
      var o = JSON.parse(store.get("settings") || "null");
      if (o && typeof o === "object") for (var k in ST) if (typeof o[k] === typeof ST[k]) ST[k] = o[k];
    } catch (e) {}
  }
  function stSave() { store.set("settings", JSON.stringify(ST)); }
  // the practices that have options of their own
  function stOwn() {
    return PRACTICES.concat(yLoad().map(yDef)).filter(function (d) { return Object.keys(pOptOwn(d.id)).length > 0; });
  }
  // a default for every practice; an open practice page that has no options of its own follows it
  function stDefault(k, v) {
    var g = pOptDefaults();
    g[k] = v;
    store.set("pOpt", JSON.stringify(g));
    if (P_OWN.indexOf(k) < 0) P.opt[k] = v;                   // voice choice and keeping reflections: everywhere, now
    else if (!pBusy() && P.optFor) P.opt = pOptsOf(P.optFor);
  }
  function stSeg(id, opts, cur) {
    return '<div class="mini-seg" id="' + id + '">' + opts.map(function (o) {
      return '<button data-v="' + o[0] + '" aria-pressed="' + (String(o[0]) === String(cur)) + '">' + o[1] + "</button>";
    }).join("") + "</div>";
  }
  function stRender() {
    var g = pOptDefaults(), own = stOwn(), speech = !!window.speechSynthesis;
    var names = own.map(function (d) { return d.name; });
    var list = names.length > 1 ? names.slice(0, -1).join(", ") + " and " + names[names.length - 1] : names[0];
    $("#stBody").innerHTML =
      '<section class="st-card" aria-labelledby="stP"><h2 id="stP">Practices</h2>' +
        '<p class="st-note">What every practice starts with. A practice can change these for itself under Options on its own page.</p>' +
        pToggle("stVoice", "Spoken guidance", g.voice, speech ? "Uses your device's own voice; captions always show." : "This browser has no speech; captions only.", !speech) +
        (speech ? '<div class="so-row so-voice"><span class="so-l">Voice</span><select id="stVoiceSel" aria-label="Voice"></select><button class="btn small" id="stVoiceTest">Test</button></div>' : "") +
        pToggle("stBells", "Bells between steps", g.bells, "") +
        pToggle("stAudio", "Binaural layer in programs", g.audio, "Headphones needed.") +
        pToggle("stRhy", "Berimbau for the capoeira moves", g.rhythm, "") +
        pToggle("stTick", "Tapping tick", g.tapTick, "A soft tick to tap along with.") +
        '<div class="so-row so-seg"><span class="so-l">Breath cues</span>' + stSeg("stCues", [["tones", "Tone"], ["chimes", "Chimes"], ["off", "Silent"]], g.cues) + "</div>" +
        (bzOk() ? pToggle("stBuzz", "Vibrate with the breath", g.buzz, "A short buzz to breathe in, a long one to breathe out, two taps for a hold.") : "") +
        '<div class="so-row so-seg"><span class="so-l">Breath visual</span>' + stSeg("stVis", [["circle", "Circle"], ["wave", "Wave"], ["column", "Column"], ["dial", "Dial"]], g.visual) + "</div>" +
        '<div class="so-row so-seg"><span class="so-l">Anapana reminders in programs<small>Now and then, a quiet prompt to observe the touch of the breath at the nostrils.</small></span>' +
          stSeg("stAna", [[0, "Off"], [120, "2 min"], [180, "3 min"], [300, "5 min"]], g.ana) + "</div>" +
        (own.length ? '<div class="st-own"><span>' + esc(list) + (own.length === 1 ? " has" : " have") + " options of " + (own.length === 1 ? "its" : "their") + ' own.</span>' +
          '<button class="btn small" id="stOwnReset">Use the defaults for ' + (own.length === 1 ? "it" : "all of them") + "</button></div>" : "") +
      "</section>" +
      '<section class="st-card" aria-labelledby="stA"><h2 id="stA">Background sound</h2>' +
        '<p class="st-note">Rain or crickets under practices, breathing sessions and tracks, made on your device.</p>' + ambCtl() +
      "</section>" +
      '<section class="st-card" aria-labelledby="stR"><h2 id="stR">Reflections</h2>' +
        pToggle("stKeep", "Keep a copy on this device", g.nvcSave, "Your writing is never sent anywhere. While this is on, an unfinished reflection is kept too, so closing the app doesn't lose it. Turn it off to keep nothing.") +
      "</section>" +
      '<section class="st-card" id="st-screen" aria-labelledby="stS"><h2 id="stS">Screen</h2>' +
        pToggle("stScrSes", "Keep the screen on during practices and breathing", ST.screenSessions, "Also for ten minutes into a pause.") +
        pToggle("stScrTrk", "Keep the screen on while a track plays", ST.screenTracks, "Turn this off to let the screen turn off as usual while you listen.") +
        (msOk() ? pToggle("stLock", "Tracks on the lock screen", ST.lockControls, "Play, pause and stop a track from the lock screen and the notifications. As with any media app, a playing track pauses music in other apps, and a call pauses the track.") : "") +
        pToggle("stDim", "Dim the screen in sleep steps", ST.sleepDim, "Sleep Descent's drift, the power nap, Cognitive Shuffle and Autogenic Training's bedtime ending go almost dark. The screen still stays on.") +
      "</section>" + bkCard() +
      '<section class="st-card st-fb" id="st-feedback" aria-labelledby="stF"><h2 id="stF">Feedback</h2>' + fbForm() + "</section>" +
      '<section class="st-card st-about" aria-labelledby="stI"><h2 id="stI">About</h2>' +
        '<p class="st-note">&copy; 2026 misterclarity. A personal, non-commercial project, and free software under the GNU AGPL, version 3. <a href="#l-impressum">Impressum, licence and credits</a></p>' +
        '<p class="st-note">Build <span class="mono" id="stBuild">' + BUILD + '</span></p>' +
        '<p class="st-note">Entrain is free and has no ads. If it helps you, a donation keeps it going.</p>' +
        '<a class="btn donate" href="' + DONATE + '" target="_blank" rel="noopener"><svg class="i" aria-hidden="true"><use href="#i-cup"/></svg>Support Entrain on Ko-fi</a>' +
      "</section>";
    stWire();
    fbWire();
    bkWire();
    pFillVoices(g.voiceName, "#stVoiceSel");
  }
  var DONATE = "https://ko-fi.com/misterclarity";   // the donations page, opened in the browser

  /* ----- feedback: written here, sent as an issue on Entrain's GitHub page. The app itself sends nothing:
     the button opens GitHub's new-issue page in the browser with the message filled in, for you to send
     there. The draft is kept on this device until you clear it. ----- */
  var FB_NEW = "https://github.com/misterclarity/biney/issues/new";
  var FB_KINDS = [["idea", "Idea"], ["problem", "Problem"], ["praise", "Praise"], ["question", "Question"]];
  function fbDraft() {
    try { var o = JSON.parse(store.get("fbDraft") || "null"); return o && typeof o === "object" ? o : {}; } catch (e) { return {}; }
  }
  // what the button adds when asked to: the build, the browser, installed or not, and the window's size
  function fbDevice() {
    var inst = !!(window.matchMedia && matchMedia("(display-mode: standalone)").matches);
    return "Entrain build " + BUILD + " · " + (hrBrowser() || "an unknown browser") + (inst ? " · installed" : " · in the browser") + " · " + innerWidth + "×" + innerHeight;
  }
  function fbForm() {
    var d = fbDraft();
    return '<p class="st-note">An idea, a problem, or something you liked? Write it here, and it opens on Entrain\'s GitHub page as an issue, ready to send. ' +
        "Sending it needs a free GitHub account, and issues there are public, so leave out anything personal.</p>" +
      '<div class="so-row so-seg"><span class="so-l">It\'s</span>' + stSeg("fbKind", FB_KINDS, d.kind || "idea") + "</div>" +
      '<label class="fb-l" for="fbTitle">Title</label><input class="fb-in" id="fbTitle" maxlength="100" autocomplete="off" placeholder="In a few words" value="' + esc(d.title || "") + '">' +
      '<label class="fb-l" for="fbTxt">Your message</label><textarea class="fb-ta" id="fbTxt" rows="6" maxlength="3000" placeholder="What happened, or what would help?">' + esc(d.txt || "") + "</textarea>" +
      pToggle("fbDev", "Add the build and your browser", d.dev !== false, '<span id="fbDevTxt">' + esc(fbDevice()) + "</span>") +
      '<div class="fb-act"><button class="btn primary" id="fbGo"><svg class="i" aria-hidden="true"><use href="#i-send"/></svg>Open on GitHub</button>' +
        '<button class="btn small" id="fbClear">Clear</button><span class="fb-n" id="fbN" aria-live="polite"></span></div>';
  }
  // the issue as GitHub will get it
  function fbIssue() {
    var d = fbDraft(), k = FB_KINDS.filter(function (x) { return x[0] === (d.kind || "idea"); })[0] || FB_KINDS[0];
    var txt = (d.txt || "").trim(), one = txt.replace(/\s+/g, " "), cut = one.slice(0, 61);
    if (one.length > 60) cut = cut.slice(0, cut.lastIndexOf(" ") > 20 ? cut.lastIndexOf(" ") : 60).replace(/[,;:.\s]+$/, "") + "…";      // no title: the message's first words, cut at a word
    var title = (d.title || "").trim().replace(/\s+/g, " ") || cut;
    var body = txt + (d.dev !== false ? "\n\n---\n" + fbDevice() : "");
    return { title: k[1] + ": " + title, body: body, url: FB_NEW + "?title=" + encodeURIComponent(k[1] + ": " + title) + "&body=" + encodeURIComponent(body) };
  }
  function fbWire() {
    var go = $("#fbGo"), title = $("#fbTitle"), txt = $("#fbTxt");
    if (!go) return;
    var save = function () {
      var kb = $("#fbKind [aria-pressed=true]"), d = { kind: kb ? kb.dataset.v : "idea", title: title.value, txt: txt.value, dev: $("#fbDev").checked };
      if (d.title.trim() || d.txt.trim()) store.set("fbDraft", JSON.stringify(d)); else storeDel("fbDraft");
      var ok = d.txt.trim().length >= 3;
      go.disabled = !ok; $("#fbClear").hidden = !d.title.trim() && !d.txt.trim();
      bSetT("#fbN", ok ? "" : "Write a few words first.");
    };
    $("#fbKind").addEventListener("click", function (e) {
      var b = e.target.closest("button"); if (!b) return;
      this.querySelectorAll("button").forEach(function (x) { x.setAttribute("aria-pressed", x === b ? "true" : "false"); });
      save();
    });
    title.addEventListener("input", save); txt.addEventListener("input", save);
    $("#fbDev").addEventListener("change", save);
    go.addEventListener("click", function () {
      save();
      if (go.disabled) return;
      window.open(fbIssue().url, "_blank", "noopener");
      bSetT("#fbN", "Opened on GitHub. Your draft stays here until you clear it.");
    });
    $("#fbClear").addEventListener("click", function () {
      title.value = ""; txt.value = ""; save(); txt.focus();
    });
    save();
  }
  function stWire() {
    var on = function (id, fn) { var el = $(id); if (el) el.addEventListener("change", fn); };
    on("#stVoice", function () { stDefault("voice", this.checked); });
    on("#stBells", function () { stDefault("bells", this.checked); if (this.checked) pBell(0.4, 0, 0, 0, true); });
    on("#stAudio", function () { stDefault("audio", this.checked); });
    on("#stRhy", function () { stDefault("rhythm", this.checked); });
    on("#stTick", function () { stDefault("tapTick", this.checked); });
    on("#stBuzz", function () { stDefault("buzz", this.checked); if (this.checked) { try { navigator.vibrate(BUZZ["in"]); } catch (e) {} } });
    on("#stKeep", function () { stDefault("nvcSave", this.checked); });
    on("#stVoiceSel", function () { stDefault("voiceName", this.value); });
    var t = $("#stVoiceTest");
    if (t) t.addEventListener("click", function () {
      pHush();
      var v = P.opt.voice, n = P.opt.voiceName;
      P.opt.voice = true; P.opt.voiceName = pOptDefaults().voiceName;
      pSay("Breathe in slowly, and let it go.");
      P.opt.voice = v; P.opt.voiceName = n;
    });
    [["#stCues", "cues"], ["#stVis", "visual"], ["#stAna", "ana"]].forEach(function (p) {
      var g = $(p[0]);
      g.addEventListener("click", function (e) {
        var b = e.target.closest("button");
        if (!b) return;
        stDefault(p[1], p[1] === "ana" ? parseInt(b.dataset.v, 10) : b.dataset.v);
        g.querySelectorAll("button").forEach(function (x) { x.setAttribute("aria-pressed", x === b ? "true" : "false"); });
        if (p[1] === "cues" && b.dataset.v !== "off" && pBusOn() && ensureBus()) {
          var tt = A.ctx.currentTime + 0.03;
          if (b.dataset.v === "chimes") chime(B_CHIME["in"], tt, 0.2); else { var sv = BC.sound; BC.sound = "tones"; preview(); BC.sound = sv; }
        }
      });
    });
    var r = $("#stOwnReset");
    if (r) r.addEventListener("click", function () {
      stOwn().forEach(function (d) { storeDel("pOpt." + d.id); });
      if (!pBusy() && P.optFor) P.opt = pOptsOf(P.optFor);
      stRender();
      toast("Every practice now uses the defaults.");
    });
    on("#stScrSes", function () { ST.screenSessions = this.checked; stSave(); wlSync(); });
    on("#stScrTrk", function () { ST.screenTracks = this.checked; stSave(); wlSync(); });
    on("#stLock", function () { ST.lockControls = this.checked; stSave(); msSync(); });
    on("#stDim", function () {
      ST.sleepDim = this.checked; stSave();
      var s = pBusy() && P.steps[P.idx];
      if (s) { $("#ses").dataset.dim = ST.sleepDim && s.sleepy ? "1" : ""; pStage(s); }
    });
  }
