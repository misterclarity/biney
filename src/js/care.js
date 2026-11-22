  /* ------------------------------- care: who you are -------------------------------
     Two safety pieces that are free for everyone, since safety never waits on a donation.

     Your health check: an optional, one-time list of nine conditions that change what's safe to try,
     offered once on Today and kept in Settings. It's stored on this device, and travels in backups
     like your settings. It never stops you starting anything: what it affects shows a stronger
     caution, written for what you ticked. Features name the kinds of risk they carry, and ask
       hcFlags()          which conditions are ticked: { heart, bpHigh, bpLow, epilepsy, pregnant,
                          panic, trauma, psychosis, asthma }, all false until it's answered
       hcCaution(kinds)   the caution for those kinds ("fast-breath", "hold", "cold", "heat", "flicker",
                          "scent", "imagery", "body", "strain", "touch", "exertion"), or "" when nothing ticked bears on them
       hcBox(kinds)       the same in a box with a link to the answers, for a page
       hcSlot(d)          a practice page's box: its caution, or, for one that asks first (hcFirst), an
                          offer to answer the health check while it's unanswered (Cold Finish)
       hcAnswered()       whether it's been answered, for a feature that offers it first (#st-health)
     A practice names its kinds in `hc` (a list, or a function of the practice for one that depends on
     its choices).

     Limits on intense breathwork: Wim Hof, Kapalabhati, Morning Wake-Up's breath of fire, the power
     breaths before sport and Swim & dive's long holds. Back to back they make fainting more likely,
     so a page notes when one ended within the hour (from the history), Restart and Do it again ask
     before stacking another block, and Wim Hof stops at eight rounds a day.
  -------------------------------------------------------------------------------- */

  // key, what Settings asks, a note under it, and how a caution names it
  var HC_ITEMS = [
    ["heart", "A heart condition", "Heart disease, or a problem with your heart's rhythm.", "a heart condition"],
    ["bpHigh", "High blood pressure", "", "high blood pressure"],
    ["bpLow", "Low blood pressure, or you faint easily", "", "low blood pressure or fainting"],
    ["epilepsy", "Epilepsy, or seizures set off by flashing light", "", "epilepsy"],
    ["pregnant", "Pregnancy", "", "pregnancy"],
    ["panic", "Panic attacks", "", "panic attacks"],
    ["trauma", "Trauma or PTSD", "", "trauma or PTSD"],
    ["psychosis", "Psychosis or dissociation", "Times of losing touch with what's real, or of feeling unreal or detached from yourself.", "psychosis or dissociation"],
    ["asthma", "Asthma", "", "asthma"]
  ];
  var HC_KEYS = HC_ITEMS.map(function (x) { return x[0]; });
  /* Each kind of risk: who it matters most for, what to say ({who} is what you ticked of them), and a
     line of its own for a condition it affects differently. As the guide puts it: fast breathing and
     holds can make you faint (stop if dizzy, never in or near water or while driving); cold water's
     shock is a danger with a heart condition or high blood pressure (start gradually, never alone in
     open water, never with breath holds in water); heat: stay hydrated, and saunas only with a
     doctor's approval with a heart condition, low blood pressure or pregnancy, or after alcohol;
     flashing light can set off a seizure; some people react to essential oils. Laughing hard and shouting
     (Laughter Break, Let It Out) raise the heart rate and blood pressure for a while and press on the belly.
     Touch, your own or a partner's (Soothing Touch, Self-Massage), can bring up strong feelings or memories.
     Brisk movement (Dance Break) raises the heart rate and blood pressure, and can bring on wheezing. */
  var HC_KINDS = {
    "fast-breath": { who: ["heart", "bpHigh", "bpLow", "epilepsy", "pregnant", "asthma"],
      txt: "Fast breathing can make you dizzy or faint. With {who}, leave it out unless your doctor says it's fine for you; if you go ahead, keep it short and gentle, sitting or lying down, never in or near water, in the bath or while driving, and stop as soon as you feel dizzy, tingly or unwell.",
      also: { panic: "Fast breathing can also bring on the feelings of a panic attack: if it starts to, slow down with long breaths out, or tap I need to stop." } },
    hold: { who: ["heart", "bpHigh", "bpLow", "epilepsy", "pregnant", "asthma"],
      txt: "A breath hold can make you black out without warning. With {who}, ask your doctor before you try long holds; if you go ahead, keep them short and easy, on dry land, sitting or lying down, and breathe whenever you need to.",
      also: { panic: "The urge to breathe during a hold can feel like panic rising: breathe as soon as you want to." } },
    cold: { who: ["heart", "bpHigh", "pregnant", "asthma"],
      txt: "Cold water sets off a shock response: a gasp, fast breathing and a sudden rise in heart rate and blood pressure. With {who}, ask your doctor before you try cold exposure; if you go ahead, start gently, with the end of a shower turned cool, never alone in open water, and never with breath holds in water." },
    heat: { who: ["heart", "bpLow", "pregnant"],
      txt: "Heat lowers your blood pressure and can make you faint. With {who}, leave out saunas and very hot baths unless your doctor approves; drink water, and skip them after alcohol." },
    flicker: { who: ["epilepsy"],
      txt: "Flashing light can set off a seizure in people with photosensitive epilepsy. With {who}, leave the light pulse off unless your doctor says it's safe for you." },
    scent: { who: ["asthma", "pregnant"],
      txt: "Some people react to essential oils, and a strong scent can tighten the airways. With {who}, check with your doctor or midwife before you use them; if you go ahead, a drop or two in an aired room, and stop if your chest tightens." },
    imagery: { who: ["psychosis", "trauma"],
      txt: "Guided imagery and deep relaxation can bring up memories, or leave you feeling detached or unreal. With {who}, ask your therapist or care team whether it suits you now; if you go ahead, keep it short, open your eyes whenever you like, and tap I need to stop if it gets too much." },
    strain: { who: ["heart", "bpHigh", "pregnant", "asthma"],
      txt: "Laughing hard and shouting raise your heart rate and blood pressure for a while, press on your belly, and can leave you short of breath. With {who}, keep it gentle: smiles and soft laughter rather than belly laughs, a steady speaking voice rather than big shouts, and rest as soon as you feel breathless, dizzy or unwell." },
    touch: { who: ["trauma", "psychosis", "panic"],
      txt: "Touch, your own or someone else's, can bring up strong feelings or memories. With {who}, go gently: start with your hands, keep your eyes open if you like, move on from any area that feels difficult, and tap I need to stop whenever you want to. With a partner, agree a word that means stop, and use it freely." },
    exertion: { who: ["heart", "bpHigh", "pregnant", "asthma"],
      txt: "Dancing and other brisk movement raise your heart rate and blood pressure, and can bring on wheezing. With {who}, ask your doctor or midwife how hard you can safely work; if you go ahead, keep to a pace at which you can still talk, keep an inhaler near if you use one, and rest as soon as you feel dizzy, faint or very short of breath. Stop at once with any chest pain.",
      also: { pregnant: "In pregnancy, keep to steps and sways rather than jumps and quick turns, stay cool and drink water." } },
    body: { who: ["trauma", "psychosis", "panic"],
      txt: "Close attention to the body and the breath can bring up strong feelings, memories or panic. With {who}, go gently: keep your eyes open if you like, move your attention away from any part that feels difficult, and tap I need to stop whenever you want to. If you're in treatment, ask your therapist whether it suits you now." }
  };

  // what's stored: when you answered, and what you ticked ("health": { at, on: [keys] }); null until then
  function hcLoad() {
    var r = null;
    try { r = JSON.parse(store.get("health") || "null"); } catch (e) {}
    if (!r || typeof r !== "object" || !(r.at > 0)) return null;
    return { at: r.at, on: Array.isArray(r.on) ? r.on.filter(function (k) { return HC_KEYS.indexOf(k) >= 0; }) : [] };
  }
  function hcAnswered() { return !!hcLoad(); }
  function hcFlags() {
    var r = hcLoad(), f = {};
    HC_KEYS.forEach(function (k) { f[k] = !!r && r.on.indexOf(k) >= 0; });
    return f;
  }
  function hcSave(on) { store.set("health", JSON.stringify({ at: Date.now(), on: on })); }
  function hcAnd(l) { return l.length > 1 ? l.slice(0, -1).join(", ") + " or " + l[l.length - 1] : l[0]; }
  function hcName(k) { for (var i = 0; i < HC_ITEMS.length; i++) if (HC_ITEMS[i][0] === k) return HC_ITEMS[i][3]; return k; }
  function hcCaution(kinds) {
    var f = hcFlags(), out = [], seen = {};
    (kinds || []).forEach(function (kind) {
      var K = HC_KINDS[kind];
      if (!K || seen[kind]) return;
      seen[kind] = true;
      var who = K.who.filter(function (k) { return f[k]; }).map(hcName);
      if (who.length) out.push(K.txt.replace("{who}", hcAnd(who)));
      Object.keys(K.also || {}).forEach(function (k) { if (f[k] && out.indexOf(K.also[k]) < 0) out.push(K.also[k]); });
    });
    return out.join(" ");
  }
  // noLink: inside a dialog, where a link away would leave the dialog open over another page
  function hcBox(kinds, noLink) {
    var t = hcCaution(kinds);
    return t ? '<div class="hc-note" role="note"><svg class="i" aria-hidden="true"><use href="#i-heart"/></svg><span><b>From your health check.</b> ' + esc(t) +
      (noLink ? "" : ' <a class="hc-edit" href="#st-health">Your answers</a>') + "</span></div>" : "";
  }
  // a practice's kinds of risk, which can follow its choices (breath of fire, power breaths)
  function hcKindsOf(d) { var k = d && pFn(d.hc, d); return Array.isArray(k) ? k : []; }
  /* What a practice's page shows from the health check: the caution written for you, or, for a practice that
     asks for it first (hcFirst: Cold Finish, before cold water), an offer to answer it while it's unanswered. */
  function hcSlot(d) {
    if (d && d.hcFirst && !hcAnswered()) {
      return '<div class="hc-note hc-ask" role="note"><svg class="i" aria-hidden="true"><use href="#i-heart"/></svg><span><b>' + esc(d.hcFirst) + "</b> " +
        "It takes a minute and stays on this device. If what you tick makes this riskier for you, a caution written for you shows here. " +
        '<a class="hc-edit" href="#st-health">Answer the health check</a></span></div>';
    }
    return hcBox(hcKindsOf(d));
  }

  /* ----- in Settings, and offered once on Today ----- */
  function hcStTxt() {
    var r = hcLoad();
    if (!r) return "Not answered yet.";
    var when = new Date(r.at).toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" });
    return (r.on.length ? "You ticked " + r.on.length + (r.on.length === 1 ? " item" : " items") + ": the practices they affect show a caution written for you." : "Nothing ticked: the usual cautions apply.") + " Last changed " + when + ".";
  }
  function hcCard() {
    var r = hcLoad(), on = r ? r.on : [];
    return '<section class="st-card" id="st-health" aria-labelledby="stH"><h2 id="stH">Health check</h2>' +
      '<p class="st-note">Optional, and kept on this device (and in your backups). Tick anything that applies to you, and the practices it affects show a caution written for you. It never stops you starting anything: the choice stays yours. Most people have no trouble, but across 83 meditation studies, reviewed in 2020, about one person in twelve had an unwanted effect, most often anxiety or depression.</p>' +
      '<div class="hc-list" role="group" aria-label="What applies to you">' +
        HC_ITEMS.map(function (x) { return pToggle("hc-" + x[0], x[1], on.indexOf(x[0]) >= 0, x[2]); }).join("") + "</div>" +
      '<p class="hc-st" id="hcSt" aria-live="polite">' + esc(hcStTxt()) + "</p>" +
      '<div class="st-data-act hc-acts"><button class="btn small" id="hcNone">None of these</button><button class="btn small" id="hcClear"' + (r ? "" : " disabled") + ">Clear my answers</button></div>" +
      '<p class="st-note">Whatever you tick, a caution is a guide, not a diagnosis: if you\'re unsure, ask your doctor. <button type="button" class="sf-link" data-safety="1">Safety notes</button></p>' +
      "</section>";
  }
  function hcStSync() {
    var r = hcLoad(), on = r ? r.on : [];
    HC_KEYS.forEach(function (k) { var b = $("#hc-" + k); if (b) b.checked = on.indexOf(k) >= 0; });
    if ($("#hcSt")) bSetT("#hcSt", hcStTxt());
    if ($("#hcClear")) $("#hcClear").disabled = !r;
    hcOfferSync();
  }
  function hcStWire() {
    var sec = $("#st-health");
    if (!sec) return;
    sec.addEventListener("change", function (e) {
      if (!e.target.id || e.target.id.indexOf("hc-") !== 0) return;
      hcSave(HC_KEYS.filter(function (k) { var b = $("#hc-" + k); return b && b.checked; }));
      hcStSync();
    });
    $("#hcNone").addEventListener("click", function () { hcSave([]); hcStSync(); });
    $("#hcClear").addEventListener("click", function () {
      storeDel("health");
      hcStSync();
      toast("Your health check is cleared.", { ms: 3000 });
    });
  }
  // Today: offered until it's answered, or put off once with Not now
  function hcOfferSync() {
    var el = $("#tdHealth");
    if (el) el.hidden = hcAnswered() || store.get("hcLater") === "1";
  }
  function hcInit() {
    $("#tdHealthLater").addEventListener("click", function () {
      store.set("hcLater", "1");
      hcOfferSync();
      toast("The health check is in Settings whenever you'd like it.", { ms: 4000 });
    });
    hcOfferSync();
    if (store.get("debug") && window.__entrain) {          // for automated tests only
      window.__entrain.hcFlags = hcFlags; window.__entrain.hcCaution = hcCaution; window.__entrain.hcKindsOf = hcKindsOf;
      window.__entrain.IB = IB; window.__entrain.ibRoundsToday = ibRoundsToday; window.__entrain.ibRecent = ibRecent; window.__entrain.SETTLE = SETTLE;
      window.__entrain.hLoad = hLoad; window.__entrain.bkKeys = bkKeys;
    }
  }

  /* ----- intense breathwork: rest between blocks, and no more than eight Wim Hof rounds a day ----- */
  // last: an intense block that ended this visit, logged or not; the rest is the question that's open
  var IB = { last: null, ask: "", d: null, paused: false, pass: false };
  var IB_REST = 36e5;                    // an hour between blocks
  var IB_CAP = 8;                        // Wim Hof rounds a day
  // a step of fast breathing: kapalabhati and breath of fire's pumps, Wim Hof's and the sports power breaths (ib)
  function ibStep(s) { return s.k === "pump" || !!s.ib; }
  function ibPlan(steps) { return steps.some(ibStep); }
  function ibIntense(e) { return (e.k === "practice" || e.k === "breath") && e.ib === true; }
  // the latest intense block that ended within the hour: { at, name }, or null
  function ibRecent() {
    var now = Date.now(), l = hLoad(), got = null;
    for (var i = l.length - 1; i >= 0; i--) {
      if (ibIntense(l[i]) && now - l[i].at < IB_REST) { got = { at: l[i].at, name: ibName(l[i]) }; break; }
    }
    if (IB.last && now - IB.last.at < IB_REST && (!got || IB.last.at > got.at)) got = IB.last;
    return got;
  }
  function ibName(e) {
    var d = e.k === "practice" && pDef(e.id), b = e.k === "breath" && preset(e.id);
    return d ? d.name : b ? patName(b) : e.n || (e.k === "breath" ? "long breath holds" : "a block of fast breathing");
  }
  function ibEnded(name) { IB.last = { at: Date.now(), name: name }; }
  function ibAgo(r) {
    var m = Math.round((Date.now() - r.at) / 6e4);
    return m < 1 ? "just now" : m === 1 ? "a minute ago" : m + " minutes ago";
  }
  function ibRestTxt(r) {
    return "You did " + r.name + " " + ibAgo(r) + ". Rest for an hour between blocks of fast breathing or long breath holds: back to back, they make fainting more likely.";
  }
  function ibDayStart() { var d = new Date(); d.setHours(0, 0, 0, 0); return d.getTime(); }
  function ibRoundsToday() {
    var since = ibDayStart(), n = 0;
    hLoad().forEach(function (e) { if (e.k === "practice" && e.id === "wim-hof" && e.at >= since && e.wh > 0) n += e.wh; });
    return n;
  }
  // the intense steps begun in the running practice (for Wim Hof, its rounds)
  function ibRun() {
    if (!pBusy()) return 0;
    var T = pT();
    return P.steps.filter(function (s) { return ibStep(s) && s.at < T; }).length;
  }
  // Wim Hof's rounds: as many as chosen, while today's eight last (at least one, so its page still reads)
  function ibWimRounds(r) { return Math.max(1, Math.min(r || 3, IB_CAP - ibRoundsToday())); }
  function ibCapTxt() { return "You've done " + IB_CAP + " rounds of Wim Hof breathing today, the most Entrain runs in a day. Rest, and come back tomorrow."; }
  // what a practice's page says above Start: today's rounds, and a block that ended within the hour
  function ibNote(d, plan) {
    if (!d || !ibPlan(plan.steps)) return "";
    var out = [], r = ibRecent();
    if (d.id === "wim-hof") {
      var done = ibRoundsToday(), want = pLenOf(d, P.len) || 3;
      if (done >= IB_CAP) return ibCapTxt();
      if (IB_CAP - done < want) out.push("You've done " + done + " of today's " + IB_CAP + " rounds, so this session runs " + (IB_CAP - done) + ".");
    }
    if (r) out.push(ibRestTxt(r));
    return out.join(" ");
  }
  // a practice's Start refused once today's Wim Hof rounds are done (a restart counts the rounds running now)
  function ibCapStop(d, again) {
    if (!d || d.id !== "wim-hof" || ibRoundsToday() + (again === true ? ibRun() : 0) < IB_CAP) return false;
    ibOpen("cap", d);
    return true;
  }
  /* Ask before another block: what: "restart" (a practice running now), "again" (its end screen's Do it
     again) or "breathe" (Swim & dive's Start again). True when it asked; the answer carries on from there. */
  function ibAsk(what, d) {
    if (IB.pass) { IB.pass = false; return false; }
    if (what === "restart") {
      if (!pBusy() || !ibPlan(P.steps)) return false;
      if (P.def.id === "wim-hof" && ibRoundsToday() + ibRun() >= IB_CAP) { ibOpen("cap", P.def, true); return true; }
      if (!ibRun() && !ibRecent()) return false;
    } else if (what === "again") {
      if (!ibPlan(P.steps) || !ibRecent()) return false;
    } else if (what === "breathe") {
      if (!BC.long || B.finder || !ibRecent()) return false;
    }
    ibOpen(what, d);
    return true;
  }
  function ibOpen(what, d, running) {
    IB.ask = what; IB.d = d || null; IB.paused = false;
    if (what === "restart" || (what === "cap" && running)) {
      if (P.state === "running") { pPause(); IB.paused = true; }
    }
    var r = ibRecent(), name = what === "restart" ? P.def.name : r ? r.name : d ? d.name : "Swim & dive";
    var gap = " Back-to-back blocks of fast breathing or long breath holds make fainting more likely: rest for an hour, breathing normally, before the next one.";
    var T = {
      restart: ["Start again from the top?", (ibRun() ? "You're partway through " + name + "." : "You did " + name + " " + ibAgo(r) + ".") + gap, "Carry on with this one", "Start again anyway"],
      again: ["Rest first?", "You've just done " + name + "." + gap, "Rest first", "Open it anyway"],
      breathe: ["Rest first?", "You did " + name + " " + (r ? ibAgo(r) : "just now") + "." + gap, "Rest first", "Start anyway"],
      cap: ["That's today's rounds", ibCapTxt(), running ? "Carry on with this one" : "OK", ""]
    }[what];
    bSetT("#ibTitle", T[0]);
    bSetT("#ibTxt", T[1]);
    bSetT("#ibRest", T[2]);
    bSetT("#ibGo", T[3]);
    $("#ibGo").hidden = !T[3];
    if ($("#bStage").classList.contains("focus")) setFocus(false);       // a full-screen stage would hide the question
    openDialog("#ibModal");
    setTimeout(function () { try { $("#ibRest").focus({ preventScroll: true }); } catch (e) {} }, 30);
  }
  function ibClose(go) {
    if ($("#ibModal").hidden) return;
    var what = IB.ask, d = IB.d, paused = IB.paused;
    IB.ask = ""; IB.d = null; IB.paused = false;
    closeDialog("#ibModal");
    if (go && what === "restart") { IB.pass = true; pRestart(); return; }
    if (go && what === "again" && d) { pIntro(d.id); return; }
    if (go && what === "breathe") { if (B.state === "idle" || B.state === "done") bBegin(); return; }
    if (paused && P.state === "paused") pResume();                    // the session it interrupted carries on
  }
  // Breathe: Swim & dive's row says when an intense block ended within the hour
  function ibBreatheSync() {
    var row = $("#bIbRow");
    if (!row) return;
    var r = BC.long && !(P.usesB && pBusy()) ? ibRecent() : null;
    row.hidden = !r;
    if (r) bSetT("#bIbTxt", ibRestTxt(r));
    var hc = $("#bDiveHc");
    if (hc) { var h = BC.long ? hcBox(["hold"]) : ""; if (hc.innerHTML !== h) hc.innerHTML = h; }
  }
  function ibInit() {
    $("#ibRest").addEventListener("click", function () { ibClose(false); });
    $("#ibGo").addEventListener("click", function () { ibClose(true); });
    $("#ibModal").addEventListener("click", function (e) { if (e.target === this) ibClose(false); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !$("#ibModal").hidden) ibClose(false); });
  }
