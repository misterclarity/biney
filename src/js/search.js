  /* ------------------------------- search -------------------------------
     One box for everything: practices and your own routines, the movement library, breathing
     patterns, tracks, the Heart tools, Healthy living's recipes, supplements, routines and light, History, Settings
     with its feedback form and the new techniques, and every paragraph and reference in Learn.
     Matching ignores case and accents, and each word you type has to match the start of a word
     somewhere in the entry, so "anap" finds Anapana and "bencao" finds Bênção. Results come in
     groups, the group with the best match first. Enter opens the top result; "/" or Ctrl+K opens
     the box from anywhere outside a field.
  ------------------------------------------------------------------------ */

  var FD = { open: false, base: null, items: [], q: "", more: {}, pushed: false, back: null, t: 0 };
  var FD_KINDS = [["practice", "Practices"], ["pose", "Poses and moves"], ["breath", "Breathing"],
    ["sound", "Sounds"], ["heart", "Heart"], ["living", "Healthy living"], ["learn", "Learn"], ["app", "History and Settings"]];
  var FD_CAP = 6;                        // results shown per group until you ask for the rest
  var FD_TRY = ["Sleep", "Anapana", "Tree", "4-7-8", "Coherence", "Tinnitus", "Capoeira", "Needs"];

  /* ----- folding text for matching: lower case, no accents, anything else a space ----- */
  function fdFold(s) {
    s = String(s || "").toLowerCase();
    if (s.normalize) s = s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    return " " + s.replace(/[^a-z0-9]+/g, " ").trim() + " ";      // padded, so " term" marks a word start
  }
  // each word, trimmed back to a stem so plurals and -ing forms find the plain word too:
  // "nostrils" finds nostril, "bodies" body, "tapping" tap
  function fdStem(w) {
    if (w.length > 5 && /ing$/.test(w)) { w = w.slice(0, -3); if (/([bcdfgklmnprstvz])\1$/.test(w)) w = w.slice(0, -1); return w; }
    if (w.length > 4 && /ies$/.test(w)) return w.slice(0, -3);
    if (w.length > 3 && /[^s]s$/.test(w)) return w.slice(0, -1);
    return w;
  }
  function fdTerms(q) { return fdFold(q).trim().split(" ").filter(Boolean).map(fdStem); }
  function fdHas(f, t) { return f.indexOf(" " + t) >= 0; }
  // the same folding, keeping where each folded character came from, to mark matches in the original
  function fdMap(s) {
    var f = " ", at = [-1];
    for (var i = 0; i < s.length; i++) {
      var c = s.charAt(i).toLowerCase();
      if (c.normalize) c = c.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      if (!/^[a-z0-9]+$/.test(c)) c = " ";
      for (var j = 0; j < c.length; j++) { f += c.charAt(j); at.push(i); }
    }
    return { f: f, at: at };
  }
  function fdSpans(s, terms) {           // [start, end) in s of every word a term starts, merged
    var m = fdMap(s), out = [];
    terms.forEach(function (t) {
      var i = m.f.indexOf(" " + t);
      while (i >= 0) {
        var e = i + t.length;
        while (e + 1 < m.f.length && m.f.charAt(e + 1) !== " ") e++;   // mark the whole word, not just its start
        var a = m.at[i + 1], b = m.at[e] + 1;
        if (a >= 0) out.push([a, b]);
        i = m.f.indexOf(" " + t, i + 1);
      }
    });
    out.sort(function (x, y) { return x[0] - y[0]; });
    var merged = [];
    out.forEach(function (r) {
      var l = merged[merged.length - 1];
      if (l && r[0] <= l[1]) l[1] = Math.max(l[1], r[1]); else merged.push([r[0], r[1]]);
    });
    return merged;
  }
  function fdMark(s, terms) {
    var h = "", at = 0;
    fdSpans(s, terms).forEach(function (r) { h += esc(s.slice(at, r[0])) + "<mark>" + esc(s.slice(r[0], r[1])) + "</mark>"; at = r[1]; });
    return h + esc(s.slice(at));
  }
  // a short excerpt around the first match, cut at word boundaries
  function fdSnip(s, terms, len) {
    len = len || 150;
    var sp = fdSpans(s, terms), a = 0, b = s.length;
    if (sp.length && s.length > len) {
      a = Math.max(0, sp[0][0] - Math.round(len * 0.3));
      b = Math.min(s.length, a + len);
      a = Math.max(0, Math.min(a, b - len));
    } else if (s.length > len) b = len;
    if (a > 0) { var sa = s.indexOf(" ", a); if (sa > 0 && sa < (sp.length ? sp[0][0] : b)) a = sa + 1; }
    if (b < s.length) { var sb = s.lastIndexOf(" ", b); if (sb > a + 40) b = sb; }
    return (a > 0 ? "…" : "") + fdMark(s.slice(a, b), terms) + (b < s.length ? "…" : "");
  }

  /* ----- the index ----- */
  function fdTxt(el) { return el ? el.textContent.replace(/\s+/g, " ").trim() : ""; }
  function fdEntry(k, t, s, xs, h, o) {
    o = o || {};
    xs = xs.filter(Boolean);
    var bare = !!o.bare;                 // a paragraph shown under its section's name: only its own words count
    return { k: k, t: t, s: s || "", xs: xs, h: h, ic: o.ic || "spark", col: o.col || "", w: o.w || 1, sup: !!o.sup,   // sup: a new technique (supporter.js)
      tn: bare ? " " : fdFold(t), ti: bare ? " " : fdFold(t + " " + (o.alias || "")), si: bare ? " " : fdFold(s + " " + (o.tags || "")), xi: fdFold(xs.join(" ")) };
  }
  function fdMins(d) {
    if (d.selfPaced) return "self-paced, about " + d.est + " min";
    if (d.lengths) return d.lengths[0] + "–" + d.lengths[d.lengths.length - 1] + " " + (d.lenUnit ? d.lenUnit + "s" : "min");
    return (d.open ? "up to " : "") + pMinutes(d) + " min";
  }
  function fdPractice(d) {
    var g = goalOf(d.goal), steps = [];
    (d.lengths || [0]).forEach(function (L) {   // step names at every length: longer sittings have more of them
      try { pPlan(d, L).steps.forEach(function (s) { if (s.title && steps.indexOf(s.title) < 0) steps.push(s.title); }); } catch (e) {}
    });
    return fdEntry("practice", d.name, [d.custom ? "Your routine" : "", g ? g.name : "", methodName(d.method), fdMins(d)].filter(Boolean).join(" · "),
      [d.blurb, d.parts, steps.join(" · "), d.how], "#practice/" + d.id,
      { ic: pIcon(d), col: pColor(d), w: 1.25, alias: d.alias || "", tags: (d.also || []).join(" ") + " " + d.id.replace(/-/g, " ") + (d.words ? " " + d.words : ""), sup: d.sup });
  }
  function fdBuildBase() {
    var out = [];
    PRACTICES.forEach(function (d) { out.push(fdPractice(d)); });
    var types = { yoga: "Yoga pose", stretch: "Stretch", mobility: "Mobility drill", capoeira: "Capoeira move", qigong: "Qigong move" }, poses = {};
    A_POSES.forEach(function (c) { poses[c[0]] = c[1]; });
    ASANAS.forEach(function (a) {
      out.push(fdEntry("pose", a.en, a.sa + " · " + (types[aType(a)] || "Pose") + " · " + (poses[aPos(a)] || "") + (a.sides ? " · both sides" : ""),
        a.cues.map(function (c) { return aCue(c, a.sides ? "right" : null); }).concat([a.caution]), "#yoga/find/" + a.id,
        { ic: a.cat === "capoeira" ? "drum" : "move", col: "var(--accent)", w: 1, alias: a.sa, sup: a.sup }));
    });
    out.push(fdEntry("pose", "Routine builder", "Movement · " + ASANAS.length + " poses and moves",
      ["Pick yoga poses, stretches, mobility drills, qigong and capoeira moves, set each one's time, and save the routine."], "#yoga",
      { ic: "plus", col: "var(--accent)", w: 1.1, tags: "yoga builder custom sequence qigong" }));
    BREATHS.forEach(function (b) {
      var lab = document.querySelector('#bPats input[value="' + b.id + '"]'), t = b.t, per = t.inh + t.sip + t.hold + t.exh + t.rest;
      var name = lab ? fdTxt(lab.parentNode) : b.id;
      out.push(fdEntry("breath", name, (goalOf(b.goal) ? goalOf(b.goal).name + " · " : "") + "Breathing pattern · " + (Math.round(600 / per) / 10) + " breaths a minute",
        [b.desc, b.ev], "#breathe/" + b.id, { ic: "breathe", col: "var(--b-in)", w: 1.15, tags: "breathe breathing pattern " + b.id, sup: b.sup }));
    });
    out.push(fdEntry("breath", "Breathing guide", "Breathe · paced breathing",
      ["Paced breathing with five visuals, a gaze point and scenes that move with your breath, sessions of 2 to 20 minutes or open-ended, sound cues and live heart data."], "#breathe",
      { ic: "breathe", col: "var(--b-in)", w: 1, tags: "breathe pace" }));
    TRACKS.forEach(function (t) {
      var g = goalOf(t.goal), gn = g ? g.name : "Tinnitus";
      out.push(fdEntry("sound", t.name, gn + " · " + t.band + " track · " + t.minutes + " min", [t.desc, t.ev], "#track/" + t.id,
        { ic: "sounds", col: "var(--relax)", w: 1, alias: t.goal === "tinnitus" ? "tinnitus" : "", tags: "binaural beat track " + (t.also || []).join(" "), sup: t.sup }));
    });
    out.push(fdEntry("sound", "Custom primer", "Focus · Sound · 5 to 20 min before a task",
      ["Listen to a beat before you start a task, get a cue when the block ends, then begin working."], "#prime",
      { ic: "bolt", col: "var(--relax)", w: 1, tags: "binaural focus primer alpha beta gamma" }));
    out.push(fdEntry("sound", "Beat builder", "Make your own · any beat and carrier",
      ["Pick the beat frequency, the carrier tone and the session length, then play it."], "#builder",
      { ic: "sliders", col: "var(--relax)", w: 1, tags: "binaural custom builder carrier frequency" }));
    out.push(fdEntry("sound", "Beat sound", "Settings · binaural, monaural or isochronic",
      ["Binaural beats need headphones; monaural beats and isochronic tones play on speakers too. Choose how every beat plays here, or for one practice under its Options."], "#st-beats",
      { ic: "sounds", col: "var(--relax)", w: 1, tags: "isochronic monaural binaural speaker speakers headphones tone tones pulse pulsing mode sound", sup: true }));
    out.push(fdEntry("sound", LP_NAME, "Gamma Focus 40 and Working Memory Gamma · a soft glow, on a 120 Hz screen",
      ["A soft glow on part of the screen brightens and dims 40 times a second with the 40 Hz beat, for up to ten minutes. It waits for your health check, stays off with epilepsy, asks each time and needs a screen that draws 120 pictures a second. Experimental."], "#track/gamma-40",
      { ic: "sun", col: "var(--stim)", w: 1, alias: "Flicker", tags: "flicker flickering flash flashing light strobe glow gamma 40hz hz mit genus visual stimulation entrainment alzheimer photic 120hz refresh rate experimental", sup: true }));
    out.push(fdEntry("sound", TOOLS.sleep.name, "Sleep · a sound that fades out over 15 to 60 min, then ends", [TOOLS.sleep.blurb, slpHowTxt(30)], TOOLS.sleep.href,
      { ic: "moon", col: "var(--relax)", w: 1.1, tags: "sleep timer noise pink white rain crickets stream water fire fade fading fall asleep night bedtime insomnia", sup: true }));
    out.push(fdEntry("sound", "Nature sounds", "Background sound · birdsong, a stream, wind and fire",
      ["Add birdsong, a stream, wind in the leaves or a crackling fire to rain or crickets, or have one on its own, under practices, breathing sessions and tracks. Each goes on and off by itself."], "#st-amb",
      { ic: "rain", col: "var(--relax)", w: 1, tags: "birdsong birds bird stream brook water river wind leaves fire fireplace crackle crackling campfire nature soundscape ambience background", sup: true }));
    out.push(fdEntry("sound", "Music in the background", "Background sound · slow, steady, lively or matched",
      ["Music made on your device, with no words: soft chords, a low note and plucked notes, slow for sleep and calm, steady for focus, lively for energy. It plays under practices, breathing sessions and tracks, and a practice can keep its own."], "#st-amb",
      { ic: "sounds", col: "var(--relax)", w: 1.05, tags: "music tempo bpm beats song songs tune melody chords ambient generative slow steady lively focus energy calm background", sup: true }));
    out.push(fdEntry("sound", YM_NAME, "Settings · songs from this device, under any session",
      ["Add songs from this device: they stay in this browser, play offline under practices, breathing sessions and tracks, and in Music Break, and a thumbs up or down after each session decides which come up more often."], "#st-mymusic",
      { ic: "sounds", col: "var(--relax)", w: 1.05, tags: "my music own songs song playlist favourite mp3 m4a aac wav audio file files add tracks liked thumbs preference chosen choose", sup: true }));
    out.push(fdEntry("breath", BLS_NAME, "Breathe · music that follows your breathing and slows it",
      ["The music's chords swell as you breathe in and ebb as you breathe out, while the guide starts at your own pace, found by the phone on your belly or the microphone, and slows gently towards your resonance pace. Experimental."], "#breathe",
      { ic: "breathe", col: "var(--b-in)", w: 1, tags: "breath led adaptive biofeedback music follows breathing slow down slower pace resonance swell loudness belly microphone experimental", sup: true }));
    out.push(fdEntry("breath", "Scenes", "Breathe, practices and Settings · clouds, water, leaves, a forest, a fractal, flowers, a fire",
      ["Scenes to watch, drawn on your device and moving slowly: on Breathe the scene moves with your breath, in a practice it takes the place of the orb, and in Settings you pick the ones you find restful."], "#st-scenes",
      { ic: "leaf", col: "var(--b-in)", w: 1.05, alias: SCN_NAME, tags: "scene scenes visual visuals nature clouds sky water lake sea ripples leaves tree branch forest mist misty ridge mountains fractal fractals flowers roses fire fireplace flames embers restful restorative soft fascination video", sup: true }));
    out.push(fdEntry("app", LT_NAME, "Breathe, practices and Settings · bright, warm or night, by the time of day",
      ["The light from your screen during a session: Bright, cool and near-white, for focus and energy in the morning; Warm, amber and dimmer, in the evening; Night, very dim and red, before sleep; or Automatic. Say whether you're a morning or an evening person, and the times move with you."], "#st-light",
      { ic: "sun", col: "var(--stim)", w: 1.05, tags: "light lights colour bright brightness warm amber night red blue tint screen theme mode dark white green body clock circadian chronotype morning evening person lark owl melatonin alert alertness", sup: true }));
    out.push(fdEntry("heart", "Connect a heart sensor", "Heart · Bluetooth heart-rate sensors",
      ["Pair a HeartMath ear-clip sensor, a chest strap or a Garmin watch set to broadcast, and watch your heart rate rise as you breathe in and fall as you breathe out."], "#heart",
      { ic: "heart", col: "var(--hr)", w: 1.1, tags: "hrm pair bluetooth garmin heartmath polar strap" }));
    out.push(fdEntry("heart", "Sensor connection guide", "Heart · step by step",
      ["Step by step for a HeartMath sensor, a chest strap or a Garmin Venu 4, with a live check of each step."], "#connect",
      { ic: "heart", col: "var(--hr)", w: 1, tags: "garmin venu heartmath strap broadcast pair help" }));
    out.push(fdEntry("heart", "Resonance test", "Heart · about 10 minutes",
      ["Breathe at 6.5, 6, 5.5, 5 and 4.5 breaths a minute for two minutes each, and see which pace gives the biggest heart-rate swing."], "#resonance-test",
      { ic: "target", col: "var(--hr)", w: 1.1, tags: "resonance frequency rate pace hrv" }));
    out.push(fdEntry("heart", CAM_NAME, "Heart · a fingertip on the phone's camera, at rest",
      ["No sensor? Rest a fingertip over the phone's camera and its light, and your pulse gives heart rate, the swing in each breath, RMSSD and coherence."], "#cam",
      { ic: "heart", col: "var(--hr)", w: 1.05, tags: "camera phone finger fingertip pulse ppg photoplethysmography torch flash light no sensor iphone hrv rmssd", sup: true }));
    out.push(fdEntry("breath", MOT_BELLY, "Breathe · the motion sensor counts your breaths",
      ["Lie back with the phone on your belly: its motion sensor counts your breaths, and beside the guide you see whether you're following it, faster or slower."], "#breathe",
      { ic: "breathe", col: "var(--b-in)", w: 1, tags: "belly tummy abdomen motion sensor accelerometer breathing rate count breaths following pace lying", sup: true }));
    out.push(fdEntry("heart", "Stillness", "Practices done lying down · from the motion sensor",
      ["With the phone resting on your belly or on the bed, the end screen of a practice done lying down shows how much of it you stayed still, and your longest still stretch."], "#l-phone",
      { ic: "moon", col: "var(--hr)", w: 0.9, tags: "still stillness restless restlessness movement motion fidget settle lying body scan yoga nidra nap", sup: true }));
    out.push(fdEntry("heart", EG_NAME, "Heart · a Muse EEG headband, alpha and theta trends",
      ["Connect a Muse headband and see whether your alpha and theta are rising or falling since your first minute, with an eyes-open, eyes-closed check."], "#eeg",
      { ic: "brain", col: "var(--hr)", w: 1.05, alias: "EEG neurofeedback", tags: "eeg muse headband brain waves brainwaves alpha theta neurofeedback interaxon eyes closed calibration", sup: true }));
    out.push(fdEntry("heart", "Room air (CO₂)", "Heart · an Aranet4 monitor, or a reading you type in",
      ["Connect an Aranet4 CO₂ monitor, or type the reading from any monitor, and the focus pages show your room's CO₂, with a nudge to open a window above about 900 ppm."], "#air",
      { ic: "wind", col: "var(--hr)", w: 1.05, alias: AQ_NAME, tags: "co2 carbon dioxide air fresh stuffy ventilation ventilate window aranet aranet4 monitor sensor room ppm focus", sup: true }));
    out.push(fdEntry("heart", OX_NAME, "Heart · a fingertip oximeter, a safety signal for breath holds",
      ["Connect a fingertip pulse oximeter: during a breath hold, in Wim Hof Breathing or on Breathe, a reading below 90% ends the hold with Breathe now."], "#ox",
      { ic: "drop", col: "var(--hr)", w: 1.05, alias: "SpO2 pulse oximeter", tags: "spo2 oxygen saturation oximeter pulse oximetry blood oxygen fingertip breath hold holds wim hof swim dive freediving safety plx" }));
    out.push(fdEntry("app", AQ_PROMPT, "Settings · a reminder on focus pages to open a window",
      ["On the page of each focus practice, focus track and the custom primer, a reminder to air the room first, with your room's CO₂ when there's a reading."], "#st-air",
      { ic: "wind", col: "var(--accent)", w: 1, tags: "fresh air open window ventilate ventilation stuffy room co2 focus reminder prompt", sup: true }));
    out.push(fdEntry("app", "Scent and chewing-gum tips", "Settings · rosemary, lavender and gum, with their safety line",
      ["Optional tips with early evidence: rosemary on focus pages, lavender on sleep pages, and chewing gum before focused work."], "#st-air",
      { ic: "leaf", col: "var(--accent)", w: 0.95, tags: "scent scents smell aroma aromatherapy essential oil oils rosemary lavender diffuser chewing gum chew taste" }));
    out.push(fdEntry("heart", "Live heart data and coherence", "Heart · rate, swing, RMSSD, coherence",
      ["Heart rate, the swing in each breath, RMSSD and coherence, with a spectrum of the rhythms your heart rate moves in."], "#heart",
      { ic: "pulse", col: "var(--hr)", w: 1, tags: "hrv variability rmssd coherence spectrum heartmath" }));
    out.push(fdEntry("app", "Settings", "Defaults for every practice, sound and screen",
      ["Spoken guidance, voice, bells, breath cues and visual, binaural layer, Anapana reminders, background sound, keeping reflections, and keeping the screen on or dimming it for sleep."], "#settings",
      { ic: "gear", col: "var(--accent)", w: 1, tags: "options preferences defaults voice bells screen dim brightness wake lock background rain" }));
    out.push(fdEntry("app", "Feedback", "Settings · an idea, a problem or something you liked",
      ["Write it in Settings, and it opens as an issue on Entrain's GitHub page, ready to send."], "#feedback",
      { ic: "send", col: "var(--accent)", w: 1, tags: "contact bug report issue github suggestion idea problem praise question" }));
    out.push(fdEntry("app", "New techniques", "Settings · a donation of €1 or more unlocks them on this device",
      ["The techniques from the brain-wave guide open with a donation of €1 or more on Ko-fi, once on each device: your device code, the activation code from the email, and what it unlocks."], "#st-supporter",
      { ic: "cup", col: "var(--stim)", w: 1, tags: "unlock donation donate supporter support kofi ko fi activation code device brain wave guide" }));
    out.push(fdEntry("app", "Health check", "Settings · optional, nine questions, kept on this device",
      ["Tick what applies to you, such as a heart condition, high or low blood pressure, epilepsy, pregnancy, panic attacks, trauma, psychosis or asthma, and the practices it affects show a caution written for you."], "#st-health",
      { ic: "heart", col: "var(--danger)", w: 1.1, tags: "health safety screening screen medical condition heart blood pressure epilepsy seizure pregnant pregnancy panic trauma ptsd psychosis dissociation asthma doctor" }));
    out.push(fdEntry("app", "I need to stop", "Settle · ends what's running and calms you down",
      ["One tap ends a practice or a breathing session, fades the sound in half a second and opens Settle: eyes open, five slow breaths out, and the 5-4-3-2-1 grounding."], "#settle",
      { ic: "leaf", col: "var(--relax)", w: 1.1, tags: "settle stop end panic overwhelmed overwhelm distress distressed upset anxious anxiety dizzy calm down grounding help quit exit" }));
    out.push(fdEntry("app", "History", "Today · everything you've done, a day at a time",
      ["Practices, breathing sessions, tracks and resonance tests, with the time and your heart-rate change and coherence when a sensor was connected."], "#history",
      { ic: "today", col: "var(--accent)", w: 1, tags: "log sessions stats week minutes past done journal progress" }));
    // your own data (own.js)
    out.push(fdEntry("app", CI_NAME, "Settings · your mood and stress, 0 to 10, at the start and end of a session",
      ["A quick rating of your mood and your stress as any practice, breathing session or track starts and ends, kept in your history and set against your usual change."], "#st-checkin",
      { ic: "heart", col: "var(--accent)", w: 1.05, alias: "Check-ins", tags: "check in checkin checkins mood stress rating rate feel feeling feelings how before after self report journal what helps", sup: true }));
    out.push(fdEntry("app", OW_NAME, "Today and History · minutes today and days in a row",
      ["Your minutes today, the days in a row you've practised and the days of the last month: how often counts for more than how long, and a missed day isn't a setback."], "#history",
      { ic: "today", col: "var(--accent)", w: 1, alias: "Daily total", tags: "streak streaks days in a row run total minutes today daily total habit consistency", sup: true }));
    out.push(fdEntry("app", RHM_NAME, "Today · morning energy, a midday reset and an evening wind-down",
      ["Three short sessions spread through the day, each with a practice you choose, ticked off from your history, with reminders for your calendar and a nudge while Entrain is open."], "#st-rhythm",
      { ic: "today", col: "var(--accent)", w: 1.05, tags: "rhythm schedule plan routine reminder reminders calendar ics notification notify alarm morning midday lunchtime evening twice three times a day spaced", sup: true }));
    out.push(fdEntry("app", "Personal experiment", "History · one practice two ways, alternated over ten sessions",
      ["Compare a practice with its beat or without, with music or without, with a scene or the usual visual, or against another practice: your heart-rate change, coherence and check-ins side by side, with an honest word on noise and expectation."], "#experiment",
      { ic: "target", col: "var(--accent)", w: 1.05, tags: "experiment experiments test compare comparison ab a/b trial n of 1 which works best for me stacked combination combine", sup: true }));
    // your eyes and the resonance course (eyes.js, course.js)
    out.push(fdEntry("breath", EY_BREATHE, "Breathe · the visual dark, the cues guiding each breath",
      ["Breathe with your eyes closed: the visual goes dark, and the rising tone, the chimes or vibration guide each breath. Alpha waves rise within seconds of closing the eyes."], "#breathe",
      { ic: "breathe", col: "var(--b-in)", w: 1, alias: "Eyes closed", tags: "eyes closed close shut dark blind alpha relax relaxation cue cues tone vibration", sup: true }));
    out.push(fdEntry("practice", EY_CUE, "Relaxation practices · under Options",
      ["At the first slow breaths, a soft bell and “Close your eyes now; the sound will guide you”, then the screen dims, in Calm Reset, Heart Coherence, Sleep Descent and other relaxation practices with paced breathing."], "#l-eyes",
      { ic: "moon", col: "var(--relax)", w: 1, tags: "eyes closed close shut cue bell dim alpha relax relaxation transition", sup: true }));
    out.push(fdEntry("breath", EY_GAZE, "Breathe and focus practices · a still point to rest your eyes on",
      ["A still point whose soft glow swells and shrinks with your breath: rest your eyes softly on it, and blink when you need to. General practice, not researched."], "#breathe",
      { ic: "target", col: "var(--b-in)", w: 1, alias: "Soft gaze", tags: "gaze soft open eyes point focus focal concentration attention trataka candle visual", sup: true }));
    out.push(fdEntry("app", RC_NAME, "Today and History · 20 minutes twice a day for eight weeks",
      ["Lehrer's protocol for heart-rate-variability biofeedback: 20 minutes of resonance breathing twice a day (or once) for eight weeks, ticked off on Today, with each week's coherence and swing in History."], "#rcourse",
      { ic: "target", col: "var(--hr)", w: 1.05, tags: "resonance course programme protocol lehrer hrv biofeedback twice a day 20 minutes eight weeks two months coherence swing plan schedule progress", sup: true }));
    fdLiving(out);
    fdLearn(out);
    return out;
  }
  // Learn: headings, paragraphs, list items, the rows of its techniques at a glance, and references (fdInit gives each an id to land on)
  var FD_LEARN = "#v-learn h2, #v-learn h3, #v-learn .prose p, #v-learn .prose li, #v-learn tr.ln-row, #v-learn .refs li";
  function fdLearn(out) {
    var head = "Learn";
    document.querySelectorAll(FD_LEARN).forEach(function (el) {
      if (el.closest(".toc") || !el.id) return;
      var tag = el.tagName, txt = fdTxt(el);
      if (!txt) return;
      if (tag === "TR") {                  // a technique: its name, then its aim, evidence and where Entrain has it
        var name = fdTxt(el.querySelector("th b")), sense = fdTxt(el.parentNode.querySelector(".ln-sense")),
          cells = [fdTxt(el.querySelector("th small"))].concat([].slice.call(el.querySelectorAll("td")).map(fdTxt));
        out.push(fdEntry("learn", name, "Learn · " + head + (sense ? " · " + sense : ""), [cells.filter(Boolean).join(" · ")], "#" + el.id,
          { ic: "learn", w: 0.12 }));     // low: a practice that only mentions the word still comes first ("chewing" finds the Mindful Meal)
        return;
      }
      if (tag === "H2" || tag === "H3") {
        if (txt === "References") { head = txt; return; }
        head = txt;
        out.push(fdEntry("learn", txt, "Learn", [fdTxt(el.nextElementSibling)], "#" + el.id, { ic: "learn", w: 0.75 }));
        return;
      }
      if (el.closest(".refs")) {
        var c = el.cloneNode(true);
        c.querySelectorAll("a").forEach(function (a) { a.remove(); });
        var ref = fdTxt(c), m = ref.match(/^(.*?\(\d{4}[a-z]?\))/), who = m ? m[1] : ref.slice(0, 60);
        if (who.length > 64) who = who.split(",")[0] + " et al. " + (who.match(/\(\d{4}[a-z]?\)/) || [""])[0];
        out.push(fdEntry("learn", who, "Learn · Reference", [ref.slice(m ? m[1].length : 0).replace(/^[.\s]+/, "")], "#" + el.id, { ic: "learn", w: 0.45 }));
        return;
      }
      var b = el.firstElementChild, lead = "";
      if (b && (b.tagName === "B" || b.tagName === "STRONG") && txt.indexOf(fdTxt(b)) === 0) lead = fdTxt(b).replace(/[.:]$/, "");
      out.push(fdEntry("learn", lead || head, "Learn · " + head, [lead ? txt.slice(fdTxt(b).length).trim() : txt], "#" + el.id, { ic: "learn", w: lead ? 0.7 : 0.6, bare: !lead }));
    });
  }
  function fdIndex() {
    if (!FD.base) FD.base = fdBuildBase();
    var mine = [];
    try { yLoad().forEach(function (q) { mine.push(fdPractice(yDef(q))); }); } catch (e) {}
    mpAll().forEach(function (b) {
      mine.push(fdEntry("breath", b.name, "Your breathing pattern · " + (Math.round(600 / cycleOf(b.t)) / 10) + " breaths a minute", [b.desc],
        "#breathe/" + b.id, { ic: "breathe", col: "var(--b-in)", w: 1.2, tags: "breathe breathing pattern mine own saved" }));
    });
    return mine.concat(FD.base);         // your routines and patterns can change between searches; the rest can't
  }

  /* ----- matching and ranking ----- */
  function fdScore(e, terms, whole) {
    var sc = 0;
    for (var i = 0; i < terms.length; i++) {
      var t = terms[i];
      if (fdHas(e.ti, t)) sc += 10;
      else if (fdHas(e.si, t)) sc += 5;
      else if (fdHas(e.xi, t)) sc += 2;
      else return 0;                     // every word has to match somewhere
    }
    if (e.tn === " " + whole + " ") sc += 14;                 // the exact name
    else if (e.tn.indexOf(" " + whole) === 0) sc += 7;        // the name starts with what you typed
    return sc * e.w;
  }
  function fdSearch(q) {
    var terms = fdTerms(q), whole = terms.join(" ");
    if (!terms.length) return [];
    var hits = [];
    fdIndex().forEach(function (e, i) {
      var sc = fdScore(e, terms, whole);
      if (sc > 0) hits.push({ e: e, sc: sc, i: i });
    });
    var ord = {};
    FD_KINDS.forEach(function (k, i) { ord[k[0]] = i; });
    hits.sort(function (a, b) { return b.sc - a.sc || ord[a.e.k] - ord[b.e.k] || a.e.t.length - b.e.t.length || a.i - b.i; });
    var groups = {}, list = [];
    hits.forEach(function (h) {
      if (!groups[h.e.k]) { groups[h.e.k] = { k: h.e.k, top: h.sc, items: [] }; list.push(groups[h.e.k]); }
      groups[h.e.k].items.push(h.e);
    });
    return list;                         // groups in order of their best match
  }

  /* ----- the panel ----- */
  function fdLine(e, terms) {
    for (var i = 0; i < e.xs.length; i++) {
      var f = fdFold(e.xs[i]);
      if (terms.some(function (t) { return !fdHas(e.ti, t) && fdHas(f, t); })) return fdSnip(e.xs[i], terms);
    }
    return e.xs.length ? fdSnip(e.xs[0], terms) : "";
  }
  function fdRender() {
    var q = $("#fdIn").value, terms = fdTerms(q), res = $("#fdRes");
    FD.q = q;
    FD.items = [];
    if (!terms.length) {
      res.innerHTML = '<div class="fd-empty"><p>Search the practices, poses and moves, breathing patterns, tracks, recipes and supplements, and everything in Learn.</p>' + fdTryRow() + "</div>";
      bSetT("#fdCount", "");
      return;
    }
    var groups = fdSearch(q), n = 0, h = "";
    groups.forEach(function (g) {
      var name = FD_KINDS.filter(function (k) { return k[0] === g.k; })[0][1], all = FD.more[g.k], show = all ? g.items : g.items.slice(0, FD_CAP);
      n += g.items.length;
      h += '<section class="fd-grp"><h3>' + name + " <span>" + g.items.length + "</span></h3><ul>";
      show.forEach(function (e) {
        var i = FD.items.push(e) - 1;
        h += '<li><a class="fd-it" href="' + esc(e.h) + '" data-i="' + i + '"' + (e.col ? ' style="--pcol:' + e.col + '"' : "") + ">" +
          '<span class="fd-iic"><svg class="i" aria-hidden="true"><use href="#i-' + e.ic + '"/></svg></span>' +
          '<span class="fd-tx"><b>' + fdMark(e.t, terms) + "</b><small>" + (e.sup ? supTag() : "") + fdMark(e.s, terms) + "</small>" +
          '<span class="fd-sn">' + fdLine(e, terms) + "</span></span></a></li>";
      });
      h += "</ul>";
      if (g.items.length > show.length) h += '<button class="fd-more" data-k="' + g.k + '">Show ' + (g.items.length - show.length) + " more</button>";
      h += "</section>";
    });
    if (!n) h = '<div class="fd-empty"><p>Nothing found for “' + esc(q.trim()) + '”. A shorter word, or one of these, may find it:</p>' + fdTryRow() + "</div>";
    res.innerHTML = h;
    bSetT("#fdCount", n ? n + (n === 1 ? " result" : " results") + (n > 1 ? ". Enter opens the first." : ". Enter opens it.") : "No results");
  }
  function fdTryRow() {
    return '<div class="fd-try">' + FD_TRY.map(function (w) { return '<button class="chip-b" data-try="' + esc(w) + '">' + esc(w) + "</button>"; }).join("") + "</div>";
  }
  function fdOpen(q) {
    if (FD.open) { $("#fdIn").focus(); return; }
    FD.open = true; FD.more = {};
    FD.back = document.activeElement;
    $("#fd").hidden = false; $("#fdBack").hidden = false;
    document.body.classList.add("fd-open");
    $("#tbFind").setAttribute("aria-expanded", "true");
    try { history.pushState({ fd: 1 }, ""); FD.pushed = true; } catch (e) { FD.pushed = false; }
    var inp = $("#fdIn");
    if (typeof q === "string") inp.value = q;
    fdRender();
    setTimeout(function () { inp.focus(); inp.select(); }, 30);
  }
  // popped: the back button already took the panel's history entry away
  function fdClose(popped, keepFocus) {
    if (!FD.open) return;
    FD.open = false;
    $("#fd").hidden = true; $("#fdBack").hidden = true;
    document.body.classList.remove("fd-open");
    $("#tbFind").setAttribute("aria-expanded", "false");
    if (FD.pushed && !popped) { FD.pushed = false; try { history.back(); } catch (e) {} }
    FD.pushed = false;
    if (!keepFocus && FD.back && FD.back.focus && document.contains(FD.back)) try { FD.back.focus({ preventScroll: true }); } catch (e) {}
  }
  function fdGo(e) {
    if (!e) return;
    var popped = false;
    if (FD.pushed) { try { history.replaceState(null, "", e.h); popped = true; } catch (x) {} }   // the result takes the panel's place in history
    fdClose(popped, true);
    if (popped) route();
    else if (location.hash === e.h) route();
    else location.hash = e.h;
    var id = e.h.slice(1);
    if (/^(lx-|l-|connect$|resonance-test$|references$)/.test(id)) setTimeout(function () { fdHit(document.getElementById(id)); }, 80);
  }
  function fdHit(el) {
    if (!el) return;
    el.classList.remove("fd-hit");
    void el.offsetWidth;                 // restart the highlight if it's already running
    el.classList.add("fd-hit");
    clearTimeout(el.fdT);
    el.fdT = setTimeout(function () { el.classList.remove("fd-hit"); }, 2600);
  }
  function fdKeys(e) {
    if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); fdClose(); return; }
    var links = Array.prototype.slice.call($("#fdRes").querySelectorAll(".fd-it")), i = links.indexOf(document.activeElement);
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      if (!links.length) return;
      e.preventDefault();
      var d = e.key === "ArrowDown" ? 1 : -1;
      if (e.target === $("#fdIn")) { if (d > 0) links[0].focus(); return; }
      if (i < 0) return;
      if (i + d < 0) $("#fdIn").focus(); else links[Math.min(links.length - 1, i + d)].focus();
      return;
    }
    if (e.key === "Tab") {                // stay inside the panel
      var f = Array.prototype.slice.call($("#fd").querySelectorAll("input, button, a[href]")).filter(function (x) { return !x.disabled && x.offsetParent; });
      if (!f.length) return;
      if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
    }
  }

  /* ----- landing on a breathing pattern ----- */
  function fdPattern(id) {
    var inp = /^[\w-]+$/.test(id) ? document.querySelector('#bPats input[value="' + id + '"]') : null;
    if (!inp) return;
    if (!(pBusy() && P.usesB) && BC.pattern !== id) {    // a practice running the guide keeps it
      inp.checked = true;
      inp.dispatchEvent(new Event("change", { bubbles: true }));
    }
    setTimeout(function () { fdHit(inp.closest("label")); }, 40);
  }

  function fdInit() {
    var tb = $("#tbFind");
    tb.addEventListener("click", function () { fdOpen(); });
    $("#fdX").addEventListener("click", function () { fdClose(); });
    $("#fdBack").addEventListener("click", function () { fdClose(); });
    $("#fdIn").addEventListener("input", function () {
      FD.more = {};
      clearTimeout(FD.t);
      FD.t = setTimeout(fdRender, 60);
    });
    $("#fdIn").addEventListener("keydown", function (e) {
      if (e.key !== "Enter") return;
      e.preventDefault();
      clearTimeout(FD.t); fdRender();
      if (FD.items.length) fdGo(FD.items[0]);
    });
    $("#fd").addEventListener("keydown", fdKeys);
    $("#fdRes").addEventListener("click", function (e) {
      var tr = e.target.closest("[data-try]");
      if (tr) { $("#fdIn").value = tr.dataset.try; FD.more = {}; fdRender(); $("#fdIn").focus(); return; }
      var mo = e.target.closest(".fd-more");
      if (mo) {
        FD.more[mo.dataset.k] = true;
        var at = FD.items.length;
        fdRender();
        var nx = $("#fdRes").querySelector('.fd-it[data-i="' + at + '"]');
        if (nx) nx.focus();
        return;
      }
      var a = e.target.closest(".fd-it");
      if (!a || e.ctrlKey || e.metaKey || e.shiftKey) return;
      e.preventDefault();
      fdGo(FD.items[+a.dataset.i]);
    });
    window.addEventListener("popstate", function () {
      if (FD.open && !(history.state && history.state.fd)) fdClose(true);
    });
    document.addEventListener("keydown", function (e) {
      if (FD.open) return;
      var k = (e.key === "k" || e.key === "K") && (e.ctrlKey || e.metaKey) && !e.altKey && !e.shiftKey;
      var typing = e.target && e.target.closest && e.target.closest('input, textarea, select, [contenteditable]');
      if (!k && (e.key !== "/" || typing || e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey)) return;
      if (document.body.classList.contains("immersive")) return;    // a session on screen keeps the keys
      e.preventDefault();
      fdOpen();
    });
    // places a result can land on that have no id of their own
    var n = 0;
    document.querySelectorAll(FD_LEARN).forEach(function (el) {
      if (!el.closest(".toc") && !el.id) el.id = "lx-" + (n++);
    });
  }
