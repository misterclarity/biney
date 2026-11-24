  /* ------------------------------------ music ------------------------------------
     Music made on the device as it plays, with no words: soft pad chords, a low note under them and sparse
     plucked notes on a five-note scale, at a tempo chosen by what the session is for. Slow, about 60 beats a
     minute, for sleep and calm; steady, 96, for focus; lively, 124, for energy, with a soft pulse on each beat.
     The brain-wave guide rates slow-tempo music for relaxation as moderate to strong evidence, fast-tempo
     music for energy and focus as moderate, and music for stress relief as strong, though music you like
     does more than music chosen for you (Learn, #l-music).
     It never loops: each chord follows the last by chance among those that sit well after it, and
     the plucked notes wander up and down the scale in two-bar phrases with rests between, all from a seeded
     generator, so one seed always gives the same music (the tests rely on it). Whole bars are worked out a
     little ahead, and their notes go onto the audio clock up to a second ahead (three with the screen off),
     through a gain of their own that fades and goes when the music stops. A note near a playing beat's
     carrier moves an octave away from it, so the music never beats against the binaural beat.
     It's background sound: a choice in Settings, on Breathe and in the player that plays under practices,
     breathing sessions and tracks, and a practice can keep a choice of its own under Options. Music Break
     plays it throughout, at the tempo you pick. It's a new technique, so it opens with a donation
     (supporter.js); until this device is unlocked, a choice kept from before stays silent.
     For other features: musStart(opts), musStop(fade), musTempo(bpm, glide) and musSwell(level, secs).
     Yours, the songs you've added in Settings, is one more choice once a song is on this device: musWant
     names it, and yourmusic.js plays them in place of the music made here.
  ------------------------------------------------------------------------------ */

  var MUS_BPM = { slow: 60, steady: 96, lively: 124 };
  var MUS_KINDS = [["off", "Off"], ["aim", "Matched"], ["slow", "Slow"], ["steady", "Steady"], ["lively", "Lively"]];
  var MUS_SHORT = { aim: "Matched music", slow: "Slow music", steady: "Steady music", lively: "Lively music", own: "Your own music" };
  var MUS_NAME = "Music made on your device";          // the unlock dialog: "… is one of the new techniques."
  var MUS_NOTE = "Made on your device, with no words. Matched follows what the session is for: slow for sleep and calm, steady for focus, lively for energy.";
  var MUS_MAJ = [0, 2, 4, 5, 7, 9, 11];                 // the major scale, in semitones above its keynote
  var MUS_PENTA = [0, 2, 4, 7, 9];                      // its five-note (pentatonic) scale, for the plucked notes
  // the chords, by the scale step of their root (0 the keynote's, I; 1 ii; 3 IV; 4 V; 5 vi), and what may follow each, with its weight
  var MUS_NEXT = { 0: [[3, 4], [5, 3], [1, 2], [4, 1]], 1: [[4, 3], [3, 3], [5, 2]], 3: [[0, 4], [5, 2], [1, 2], [4, 2]],
    4: [[0, 3], [5, 3], [3, 2]], 5: [[3, 4], [1, 2], [0, 2], [4, 2]] };
  var MUS_TONICS = [50, 52, 53, 55, 57];                // keynotes D, E, F, G and A (MIDI): a seed picks one
  /* How each tempo feels: bars a chord lasts; the pad's swell and fade (seconds), its brightness (Hz) and the level
     of each of its notes; the low note's level, when it plays in the bar (beats), how long (beats) and how soft its
     start; the grid of plucked notes (beats), the chance of one on and off the beat, how long it rings and its
     level; the chance of a rest after a phrase; and the soft pulse, a low thump and a light shaker, with their levels. */
  var MUS_FEEL = {
    slow: { bars: 2, att: 2.6, rel: 3.2, lp: 950, pad: 0.05, bass: 0.17, bassAt: [0], bassLen: 7.5, bAtt: 1.2,
      grid: 1, on: 0.42, off: 0, ring: 1.8, pluck: 0.13, rest: 0.3, thump: [], thAmp: 0, shake: [], shAmp: 0 },
    steady: { bars: 2, att: 1.2, rel: 2, lp: 1300, pad: 0.042, bass: 0.15, bassAt: [0, 2], bassLen: 1.6, bAtt: 0.06,
      grid: 0.5, on: 0.4, off: 0.15, ring: 1, pluck: 0.12, rest: 0.25, thump: [0, 2], thAmp: 0.22, shake: [], shAmp: 0 },
    lively: { bars: 1, att: 0.3, rel: 0.7, lp: 2000, pad: 0.036, bass: 0.15, bassAt: [0, 1.5, 2, 3.5], bassLen: 0.45, bAtt: 0.02,
      grid: 0.5, on: 0.5, off: 0.3, ring: 0.55, pluck: 0.11, rest: 0.15, thump: [0, 1, 2, 3], thAmp: 0.3, shake: [0.5, 1.5, 2.5, 3.5], shAmp: 0.05 }
  };
  /* The music as it plays. on: playing; own: who started it, when a feature plays it its own way ("" when it
     follows the background sound's choice); bpm now, to (where a glide is heading) and rate (beats a minute, per
     second); b0 and t0: one beat and its time on the audio clock, from which every other beat's time follows;
     plan: the first beat not yet worked out; q: notes worked out, not yet on the clock; st: the generator; fix:
     a feel kept whatever the tempo; the gains (bus: volume, lvl: a session's level, run: this run's fade in and
     out, pad: the chords' swell); swell and lv: their levels; log: the last notes put on the clock (for tests);
     nz: the shaker's noise, for one audio context; going: runs still fading out, [run, when it's silent]. */
  var MUS = { on: false, own: "", bpm: 60, to: 60, rate: 0, b0: 0, t0: 0, at: 0, plan: 0, q: [], st: null, fix: "", timer: 0,
    bus: null, lvl: null, run: null, pad: null, swell: 1, lv: 1, log: [], nz: null, going: [] };

  function musOk(k) { return k === "off" || k === "aim" || k === "slow" || k === "steady" || k === "lively" || k === "own"; }
  // this device's choice, as kept, and as it plays: off until this device is unlocked
  function musStored() { var k = store.get("music"); return musOk(k) ? k : "off"; }
  function musDev() { return supOn() ? musStored() : "off"; }
  function musShown(k) { return supOn() && musOk(k) ? k : "off"; }
  function musClamp(b) { return Math.max(40, Math.min(160, +b || 60)); }
  function musFeel(bpm) { return bpm < 78 ? "slow" : bpm < 110 ? "steady" : "lively"; }
  // the tempo that fits what a session is for
  function musAim(goal) { return goal === "focus" ? "steady" : goal === "energy" ? "lively" : "slow"; }

  /* ----- the generator: pure, and the same in a test as on the page ----- */
  function musHz(m) { return 440 * Math.pow(2, (m - 69) / 12); }
  function musDraw(rnd, opts) {             // a weighted choice: opts [[value, weight], ...]
    var s = 0, i, x;
    for (i = 0; i < opts.length; i++) s += opts[i][1];
    x = rnd() * s;
    for (i = 0; i < opts.length; i++) { x -= opts[i][1]; if (x < 0) return opts[i][0]; }
    return opts[opts.length - 1][0];
  }
  // scale step k of the major key on `tonic` (0 the keynote, 7 an octave up), as a MIDI note
  function musStep(tonic, k) { return tonic + MUS_MAJ[((k % 7) + 7) % 7] + 12 * Math.floor(k / 7); }
  // the plucked notes' scale: index 0 is the keynote an octave up, and it climbs from there
  function musPent(tonic, i) { return tonic + 12 + MUS_PENTA[((i % 5) + 5) % 5] + 12 * Math.floor(i / 5); }
  /* A chord on scale step `deg`: its pad (third, fifth, root an octave up and the ninth, kept within a tenth or
     so above the keynote), its low note (folded into the octave from C2, under every carrier in use) and its notes'
     pitch classes, for the plucked notes to lean on. */
  function musChord(tonic, deg) {
    var pad = [2, 4, 7, 8].map(function (k) { var m = musStep(tonic, deg + k); while (m > tonic + 21) m -= 12; return m; });
    var root = musStep(tonic, deg), bass = 36 + ((root - 36) % 12 + 12) % 12;
    return { pad: pad, bass: bass, fifth: bass + 7 > 47 ? bass - 5 : bass + 7, pcs: [0, 2, 4].map(function (k) { return musStep(tonic, deg + k) % 12; }) };
  }
  // a new generator: a key from the seed (or the one given), the keynote's chord first
  function musState(seed, tonic) {
    var rnd = amRand(seed >>> 0);
    return { rnd: rnd, tonic: tonic || MUS_TONICS[Math.floor(rnd() * MUS_TONICS.length)], deg: 0, first: true, left: 0, chord: null, mel: 5, phr: 0, rest: 0, bar: 0 };
  }
  // the next plucked note: a step or two up or down the scale, within an octave and a half, often onto a note of the chord
  function musWalk(st) {
    var r = st.rnd, m = st.mel + musDraw(r, [[-2, 1], [-1, 3], [0, 1], [1, 3], [2, 1]]);
    if (m < 0) m = 1;
    if (m > 9) m = 8;
    if (st.chord && r() < 0.5 && st.chord.pcs.indexOf(musPent(st.tonic, m) % 12) < 0) {
      var up = Math.min(9, m + 1), dn = Math.max(0, m - 1);
      if (st.chord.pcs.indexOf(musPent(st.tonic, up) % 12) >= 0) m = up;
      else if (st.chord.pcs.indexOf(musPent(st.tonic, dn) % 12) >= 0) m = dn;
    }
    st.mel = m;
    return musPent(st.tonic, m);
  }
  /* One bar (four beats) from beat b0, in a feel: its events, each { b: its beat, v: what plays, and its notes }.
     A new chord when the last one's bars are up (every eighth bar, often back to the keynote's); the low note;
     the plucked notes, unless the phrase rests; and the pulse. */
  function musBar(st, k, b0) {
    var F = MUS_FEEL[k] || MUS_FEEL.slow, r = st.rnd, ev = [], x, p;
    if (st.left <= 0) {
      if (st.first) { st.deg = 0; st.first = false; }
      else {
        var nx = st.bar % 8 === 0 && st.deg !== 0 && r() < 0.5 ? 0 : musDraw(r, MUS_NEXT[st.deg] || MUS_NEXT[0]);
        st.deg = nx === st.deg ? musDraw(r, MUS_NEXT[st.deg] || MUS_NEXT[0]) : nx;
      }
      st.left = F.bars;
      st.chord = musChord(st.tonic, st.deg);
      ev.push({ b: b0, v: "pad", n: st.chord.pad, d: F.bars * 4, k: k });
      if (F.bassAt.length === 1) ev.push({ b: b0, v: "bass", m: st.chord.bass, d: Math.min(F.bassLen, F.bars * 4 - 0.5), a: 1, k: k });
    }
    if (F.bassAt.length > 1) F.bassAt.forEach(function (at, i) {
      var m = k === "lively" ? [st.chord.bass, st.chord.bass, st.chord.fifth, st.chord.bass][i % 4] : at === 2 && r() < 0.4 ? st.chord.fifth : st.chord.bass;
      ev.push({ b: b0 + at, v: "bass", m: m, d: F.bassLen, a: at === 0 ? 1 : 0.8, k: k });
    });
    if (st.rest > 0) st.rest--;
    else for (x = 0; x < 4; x += F.grid) {
      var onBeat = x % 1 === 0;
      p = onBeat ? F.on + (x === 0 ? 0.15 : 0) : F.off;
      if (r() < p) ev.push({ b: b0 + x, v: "pluck", m: musWalk(st), a: (onBeat ? 1 : 0.75) * (0.75 + 0.25 * r()), pan: (r() - 0.5) * 0.7, k: k });
    }
    F.thump.forEach(function (at) { ev.push({ b: b0 + at, v: "thump", a: at === 0 ? 1 : 0.8, k: k }); });
    F.shake.forEach(function (at) { ev.push({ b: b0 + at, v: "shake", a: 0.8 + 0.2 * r(), k: k }); });
    st.left--; st.bar++;
    if (++st.phr >= 2) { st.phr = 0; if (r() < F.rest) st.rest = r() < 0.4 ? 2 : 1; }
    ev.sort(function (a, b) { return a.b - b.b; });
    return ev;
  }

  /* ----- the sound: any audio context, the page's or a test's offline one ----- */
  // where a playing beat sits: its carrier, and the carrier plus the widest beat it plays, with room either side
  function musZone() {
    var t = A.track;
    if (!t || !A.playing || t.sleep || !t.carrier) return null;
    var b = Math.max(t.beat || 0, t.cur || 0, t.rampFrom || 0);
    (t.pts || []).forEach(function (q) { b = Math.max(b, q[1]); });
    return [t.carrier - 25, t.carrier + b + 25];
  }
  // a note's pitch, an octave away from a playing beat if it falls near one (up, or down for a low note)
  function musFree(f, low) {
    var z = musZone();
    for (var i = 0; z && i < 3 && f > z[0] && f < z[1]; i++) f = low && f / 2 >= 30 ? f / 2 : f * 2;
    return f;
  }
  function musEnd(nodes) { return function () { nodes.forEach(function (n) { try { n.disconnect(); } catch (e) {} }); }; }
  // a chord: two softly detuned voices on each note, through a low-pass that opens as the chord swells
  function musPad(ctx, out, fs, when, dur, F) {
    var g = ctx.createGain(), lp = ctx.createBiquadFilter(), hold = Math.max(F.att, dur), end = when + hold + F.rel, nodes = [g, lp], first = null;
    lp.type = "lowpass"; lp.Q.value = 0.5;
    lp.frequency.setValueAtTime(F.lp * 0.55, when);
    lp.frequency.linearRampToValueAtTime(F.lp, when + F.att + 0.4 * hold);
    lp.frequency.linearRampToValueAtTime(F.lp * 0.7, end);
    g.gain.setValueAtTime(0, when);
    g.gain.linearRampToValueAtTime(1, when + F.att);
    g.gain.setValueAtTime(1, when + hold);
    g.gain.linearRampToValueAtTime(0, end);
    lp.connect(g); g.connect(out);
    fs.forEach(function (f, i) {
      [["triangle", -6], ["sine", 7]].forEach(function (w) {
        var o = ctx.createOscillator(), og = ctx.createGain();
        o.type = w[0]; o.frequency.value = f; o.detune.value = w[1];
        og.gain.value = F.pad * (i === 3 ? 0.6 : 1);      // the ninth a little softer
        o.connect(og); og.connect(lp);
        o.start(when); o.stop(end + 0.05);
        nodes.push(o, og);
        if (!first) first = o;
      });
    });
    first.onended = musEnd(nodes);
  }
  // the low note, with its octave above so a phone's small speaker carries it
  function musBass(ctx, out, f, when, dur, F, a) {
    var o = ctx.createOscillator(), o2 = ctx.createOscillator(), g2 = ctx.createGain(), g = ctx.createGain();
    var at = Math.min(F.bAtt, dur * 0.4), rel = Math.min(1.2, Math.max(0.1, dur * 0.3)), end = when + dur + rel, pk = F.bass * (a || 1);
    o.type = "sine"; o.frequency.value = f; o2.type = "sine"; o2.frequency.value = f * 2; g2.gain.value = 0.35;
    o.connect(g); o2.connect(g2); g2.connect(g); g.connect(out);
    g.gain.setValueAtTime(0, when);
    g.gain.linearRampToValueAtTime(pk, when + at);
    g.gain.setValueAtTime(pk, when + Math.max(at, dur));
    g.gain.linearRampToValueAtTime(0, end);
    o.start(when); o2.start(when); o.stop(end + 0.05); o2.stop(end + 0.05);
    o.onended = musEnd([o, o2, g2, g]);
  }
  // a plucked note: a sine whose brightness (a second sine bending its pitch) dies away fast, and its ring more slowly
  function musPluck(ctx, out, f, when, ring, amp, pan) {
    var c = ctx.createOscillator(), m = ctx.createOscillator(), mg = ctx.createGain(), g = ctx.createGain(), end = when + ring * 1.2 + 0.05, nodes = [c, m, mg, g], to = out;
    if (pan && ctx.createStereoPanner) { var sp = ctx.createStereoPanner(); sp.pan.value = pan; sp.connect(out); to = sp; nodes.push(sp); }
    c.type = "sine"; c.frequency.value = f; m.type = "sine"; m.frequency.value = f * 2;
    mg.gain.setValueAtTime(f * 2.5, when);
    mg.gain.exponentialRampToValueAtTime(f * 0.01, when + Math.min(0.5, ring * 0.4));
    m.connect(mg); mg.connect(c.frequency); c.connect(g); g.connect(to);
    g.gain.setValueAtTime(0, when);
    g.gain.linearRampToValueAtTime(amp, when + 0.006);
    g.gain.setTargetAtTime(0, when + 0.006, ring / 5);
    c.start(when); m.start(when); c.stop(end); m.stop(end);
    c.onended = musEnd(nodes);
  }
  // the pulse: a soft low thump, its pitch falling, like a muffled drum
  function musThump(ctx, out, when, amp) {
    var o = ctx.createOscillator(), g = ctx.createGain();
    o.type = "sine";
    o.frequency.setValueAtTime(110, when);
    o.frequency.exponentialRampToValueAtTime(46, when + 0.14);
    g.gain.setValueAtTime(0, when);
    g.gain.linearRampToValueAtTime(amp, when + 0.004);
    g.gain.setTargetAtTime(0, when + 0.004, 0.07);
    o.connect(g); g.connect(out);
    o.start(when); o.stop(when + 0.45);
    o.onended = musEnd([o, g]);
  }
  // a short burst of noise that dies away, made once for each audio context
  function musNoise(ctx) {
    if (MUS.nz && MUS.nz.ctx === ctx) return MUS.nz.buf;
    var n = Math.round(ctx.sampleRate * 0.12), b = ctx.createBuffer(1, n, ctx.sampleRate), d = b.getChannelData(0), r = amRand(97);
    for (var i = 0; i < n; i++) d[i] = (r() * 2 - 1) * Math.pow(1 - i / n, 3);
    MUS.nz = { ctx: ctx, buf: b };
    return b;
  }
  // a light shaker between the beats
  function musShake(ctx, out, when, amp) {
    var s = ctx.createBufferSource(), hp = ctx.createBiquadFilter(), g = ctx.createGain();
    s.buffer = musNoise(ctx); hp.type = "highpass"; hp.frequency.value = 6500; g.gain.value = amp;
    s.connect(hp); hp.connect(g); g.connect(out);
    s.start(when);
    s.onended = musEnd([s, hp, g]);
  }
  // one event of a bar onto the clock at `when`, a beat lasting spb seconds: chords to `pad`, the rest to `out`;
  // the pitches it played (Hz), once kept clear of a beat
  function musPlay(ctx, out, pad, e, when, spb) {
    var F = MUS_FEEL[e.k] || MUS_FEEL.slow, fs = [];
    if (e.v === "pad") musPad(ctx, pad || out, fs = e.n.map(function (m) { return musFree(musHz(m)); }), when, e.d * spb, F);
    else if (e.v === "bass") musBass(ctx, out, (fs = [musFree(musHz(e.m), true)])[0], when, e.d * spb, F, e.a);
    else if (e.v === "pluck") musPluck(ctx, out, (fs = [musFree(musHz(e.m))])[0], when, F.ring, F.pluck * e.a, e.pan);
    else if (e.v === "thump") musThump(ctx, out, when, F.thAmp * e.a);
    else if (e.v === "shake") musShake(ctx, out, when, F.shAmp * e.a);
    return fs;
  }

  /* ----- playing it: a beat grid on the audio clock, whose tempo can change or glide ----- */
  function musBeatAt(t) { return MUS.b0 + (t - MUS.t0) * MUS.bpm / 60; }
  function musTimeOf(b) { return MUS.t0 + (b - MUS.b0) * 60 / MUS.bpm; }
  function musRetempo(bpm, t) { MUS.b0 = musBeatAt(t); MUS.t0 = t; MUS.bpm = bpm; }
  // as loud as the background sound, which has the one volume for both
  function musGain() { return ambGain() * 0.9; }
  function musVolNow() { if (MUS.bus && A.ctx) MUS.bus.gain.setTargetAtTime(musGain(), A.ctx.currentTime, 0.08); ymVolNow(); }
  function musTick() {
    if (!MUS.on || !A.ctx) return;
    var ctx = A.ctx, now = ctx.currentTime;
    if (MUS.bpm !== MUS.to) {                       // gliding to a new tempo, a little each time
      var step = MUS.rate * Math.max(0, now - MUS.at), dl = MUS.to - MUS.bpm;
      musRetempo(!MUS.rate || Math.abs(dl) <= step ? MUS.to : MUS.bpm + (dl > 0 ? step : -step), now);
    }
    MUS.at = now;
    if (musTimeOf(MUS.plan) < now) {                // the page slept (a locked phone): on from the next bar, with a new chord
      MUS.q = []; MUS.b0 = MUS.plan; MUS.t0 = now + 0.05; MUS.st.left = 0;
    }
    var horizon = now + (document.hidden ? 3 : 0.9), spb = 60 / MUS.bpm;
    while (musTimeOf(MUS.plan) <= horizon) { MUS.q = MUS.q.concat(musBar(MUS.st, MUS.fix || musFeel(MUS.bpm), MUS.plan)); MUS.plan += 4; }
    while (MUS.q.length && musTimeOf(MUS.q[0].b) < horizon) {
      var e = MUS.q.shift(), when = musTimeOf(e.b);
      if (when < now - 0.03) {                       // late: a chord still sounds for what's left of it; the rest is skipped
        if (e.v !== "pad" || e.d - (now - when) / spb < 1) continue;
        e = { b: e.b, v: e.v, n: e.n, d: e.d - (now - when) / spb, k: e.k };
        when = now;
      }
      var hz = musPlay(ctx, MUS.run, MUS.pad, e, when, spb);
      MUS.log.push({ t: when, v: e.v, b: e.b, bpm: MUS.bpm, k: e.k, hz: hz });
      if (MUS.log.length > 400) MUS.log.splice(0, 100);
    }
  }
  /* Start the music: opts.bpm (or a feel's tempo, opts.feel), opts.feel to keep one feel at any tempo, opts.seed
     for the same music each time, opts.fade (seconds to come in), opts.own: a name when a feature plays it its own
     way, so the background sound's choice leaves it alone until that feature stops it. Already playing: it takes
     the new tempo, gliding over opts.glide seconds. False when the browser has no Web Audio. */
  function musStart(o) {
    o = o || {};
    if (!ensureCtx()) return false;
    var ctx = A.ctx, now = ctx.currentTime, bpm = musClamp(o.bpm || MUS_BPM[o.feel] || 60);
    MUS.own = o.own || "";
    MUS.fix = o.feel === "slow" || o.feel === "steady" || o.feel === "lively" ? o.feel : "";
    if (MUS.on) { musTempo(bpm, o.glide); return true; }
    MUS.swell = 1;                                   // the chords start full; a feature can swell them from here
    if (o.own) MUS.lv = 1;                           // a feature's own music starts at full level, whatever a practice left it at
    if (!MUS.bus) {
      MUS.bus = ctx.createGain(); MUS.bus.gain.value = musGain(); MUS.bus.connect(ctx.destination);
      MUS.lvl = ctx.createGain(); MUS.lvl.connect(MUS.bus);
    }
    MUS.lvl.gain.cancelScheduledValues(now); MUS.lvl.gain.setValueAtTime(MUS.lv, now);
    MUS.run = ctx.createGain(); MUS.pad = ctx.createGain();
    MUS.pad.gain.value = MUS.swell;
    MUS.pad.connect(MUS.run); MUS.run.connect(MUS.lvl);
    var fade = o.fade === undefined ? 2 : o.fade;
    MUS.run.gain.setValueAtTime(0, now);
    MUS.run.gain.linearRampToValueAtTime(1, now + Math.max(0.02, fade));
    if (!MUS.st || o.seed !== undefined) MUS.st = musState(o.seed !== undefined ? o.seed : Math.floor(Math.random() * 4294967295));
    MUS.st.left = 0;                                 // each start opens on a chord
    MUS.bpm = MUS.to = bpm; MUS.rate = 0; MUS.b0 = 0; MUS.t0 = now + 0.1; MUS.plan = 0; MUS.q = []; MUS.at = now;
    MUS.on = true;
    clearInterval(MUS.timer);
    MUS.timer = setInterval(musTick, 150);
    musTick();
    musAfter();
    return true;
  }
  // stop: everything already on the clock fades out over `fade` seconds (2 unless given), then it's let go
  function musStop(fade) {
    if (!MUS.on) { MUS.own = ""; return; }
    var f = fade === undefined ? 2 : Math.max(0.02, fade), run = MUS.run, ctx = A.ctx;
    MUS.on = false; MUS.own = ""; MUS.q = [];
    clearInterval(MUS.timer); MUS.timer = 0;
    MUS.run = null; MUS.pad = null;
    if (ctx && run) {
      var now = ctx.currentTime;
      run.gain.cancelScheduledValues(now);
      run.gain.setValueAtTime(run.gain.value, now);
      run.gain.linearRampToValueAtTime(0, now + f);
      MUS.going = MUS.going.filter(function (x) { return x[1] > now; }).concat([[run, now + f]]);
      setTimeout(function () { try { run.disconnect(); } catch (e) {} }, (f + 0.3) * 1000);
    }
    musAfter();
  }
  // I need to stop: gone within `secs`, a slower fade already under way too (a session's end begins one just before)
  function musHush(secs) {
    var f = Math.max(0.02, secs), ctx = A.ctx;
    musStop(f);
    if (!ctx) return;
    var now = ctx.currentTime;
    MUS.going.forEach(function (x) {
      if (x[1] <= now + f) return;
      try { var g = x[0].gain; g.cancelScheduledValues(now); g.setValueAtTime(g.value, now); g.linearRampToValueAtTime(0, now + f); x[1] = now + f; } catch (e) {}
    });
  }
  // a new tempo (40 to 160 beats a minute), at once or gliding there over `glide` seconds
  function musTempo(bpm, glide) {
    bpm = musClamp(bpm);
    if (!MUS.on || !A.ctx) { MUS.bpm = MUS.to = bpm; return; }
    MUS.to = bpm;
    MUS.rate = glide > 0 ? Math.abs(bpm - MUS.bpm) / glide : 0;
    MUS.at = A.ctx.currentTime;
    if (!MUS.rate) musRetempo(bpm, A.ctx.currentTime);
  }
  // the chords' level, 0 to 1, reached over about `secs` seconds: for a sound that swells with each breath in
  function musSwell(x, secs) {
    MUS.swell = Math.max(0, Math.min(1, x));
    if (MUS.pad && A.ctx) MUS.pad.gain.setTargetAtTime(MUS.swell, A.ctx.currentTime, Math.max(0.02, (secs || 0.5) / 3));
  }
  // all of it a little softer for a while (a practice's closing words over it), over about `secs` seconds
  function musLevel(x, secs) {
    if (x === MUS.lv) return;
    MUS.lv = x;
    if (MUS.lvl && A.ctx) MUS.lvl.gain.setTargetAtTime(x, A.ctx.currentTime, Math.max(0.02, (secs || 1) / 3));
  }
  // once it starts or stops, the controls that show its volume follow
  function musAfter() { try { ambUI(); } catch (e) {} }

  /* ----- following the background sound's choice ----- */
  // what a session is for, when it isn't a practice: a track's goal, the breathing pattern's, or calm for a taste
  function musGoal() {
    var t = A.playing && A.track;
    if (t && !t.sleep && !t.practice) { var c = CAT["t:" + t.id]; return c ? c.goal : t.id === "prime" || t.cat === "stim" ? "focus" : "calm"; }
    if (B.state === "running") { var b = preset(BC.pattern); return b && b.goal || "calm"; }
    return "calm";
  }
  // a practice step with a tune or a rhythm of its own (a song, a drone, a cadence tick, the berimbau) keeps the music out of its way
  function musBusyStep(s) { return !!s && (s.k === "sing" || !!s.drone || !!s.metro || (s.k === "pose" && !!(ASANA[s.pose] && ASANA[s.pose].rhythm))); }
  // what should play now: { bpm, lvl }, or null for nothing
  function musWant() {
    if (!supOn()) return null;
    var k, goal, s = null;
    if (typeof P !== "undefined" && P.state === "running" && P.def) {
      var d = P.def;
      s = P.steps[P.idx] || null;
      if (d.noMus || musBusyStep(s)) return null;
      k = d.music ? pFn(d.music, d) : P.opt.music;
      goal = d.goal;
    } else if (ambActive()) { k = musStored(); goal = musGoal(); }
    else return null;
    if (!musOk(k) || k === "off") return null;
    if (k === "own") {                               // your own songs (yourmusic.js); with none on this device, music matched to the session
      if (ymCan()) return { own: true, lvl: s && typeof s.musLvl === "number" ? s.musLvl : 1 };
      k = "aim";
    }
    return { bpm: s && s.bpm ? s.bpm : MUS_BPM[k === "aim" ? musAim(goal) : k], lvl: s && typeof s.musLvl === "number" ? s.musLvl : 1 };
  }
  // called with the background sound (ambSync): starts, stops or changes the tempo, unless a feature plays it its own way
  function musSync() {
    if (MUS.own) { ymSync(null); return; }          // a feature playing the music its own way keeps your songs out too
    var w = musWant();
    ymSync(w && w.own ? w : null);                   // your own songs, when Yours is chosen (yourmusic.js)
    if (w && w.own) w = null;
    if (!w) { if (MUS.on) musStop(1.5); return; }
    if (MUS.on) {
      musLevel(w.lvl, 4);
      if (MUS.to !== w.bpm) musTempo(w.bpm, 4);
      return;
    }
    MUS.lv = w.lvl;                                  // a new start comes in at its level at once
    musStart({ bpm: w.bpm });
  }

  /* ----- what it looks like ----- */
  // the buttons: off, matched and the three tempos, and Yours once a song of your own is on this device (or it's the
  // choice), the cup on all but Off while this device is locked.
  // scope: "dev" for this device's choice (handled here), "prac" for a practice's own (practice.js)
  function musKinds(cur) { return MUS_KINDS.concat(ymHereN() > 0 || cur === "own" ? [["own", "Yours"]] : []); }
  function musSeg(id, cur, scope) {
    return '<div class="mini-seg mus-seg"' + (id ? ' id="' + id + '"' : "") + ' data-mus-for="' + scope + '" role="group" aria-label="Music">' +
      musKinds(cur).map(function (k) {
        return '<button type="button" data-mus="' + k[0] + '" aria-pressed="' + (k[0] === cur) + '">' + k[1] + (k[0] !== "off" ? supTag(true) : "") + "</button>";
      }).join("") + "</div>";
  }
  // in the background sound's controls (Settings, Breathe): a row of its own
  function musCtl() {
    return '<div class="mus-ctl"><span class="so-l">Music<small>' + MUS_NOTE + "</small></span>" + musSeg("", musDev(), "dev") + "</div>";
  }
  // the player's list
  function musSelFill(sel) {
    var key = supOn() + "|" + musKinds(musDev()).length;
    if (sel.getAttribute("data-k") !== key) {
      sel.innerHTML = musKinds(musDev()).map(function (k) {
        return '<option value="' + k[0] + '">' + (k[0] === "off" ? "None" : k[0] === "aim" ? "Matched to the session" : k[0] === "own" ? "Your own music" : k[1] + ", " + MUS_BPM[k[0]] + " a minute") +
          (k[0] !== "off" && !supOn() ? " · with a donation" : "") + "</option>";
      }).join("");
      sel.setAttribute("data-k", key);
    }
    sel.value = musDev();
  }
  // every control follows the choice: the buttons and their cups (a practice's own, or this device's), and the player's list
  function musUI() {
    var dev = musDev(), lock = !supOn();
    document.querySelectorAll(".mus-seg").forEach(function (g) {
      var cur = g.getAttribute("data-mus-for") === "prac" && P.view ? musShown(pOptsOf(P.view.id).music) : dev;
      var yb = g.querySelector('button[data-mus="own"]'), yw = musKinds(cur).length > MUS_KINDS.length;
      if (yw && !yb) g.insertAdjacentHTML("beforeend", '<button type="button" data-mus="own" aria-pressed="false">Yours</button>');   // a song of your own added, or the last one removed
      else if (!yw && yb) yb.parentNode.removeChild(yb);
      g.querySelectorAll("button[data-mus]").forEach(function (b) {
        var k = b.getAttribute("data-mus"), tag = b.querySelector(".sup-tag");
        b.setAttribute("aria-pressed", k === cur ? "true" : "false");
        if (tag && !lock) tag.parentNode.removeChild(tag);
        else if (!tag && lock && k !== "off") b.insertAdjacentHTML("beforeend", supTag(true));
      });
    });
    document.querySelectorAll(".mus-sel").forEach(musSelFill);
  }
  /* Picking one, at the moment of use: Off at once; music once this device is unlocked, otherwise the unlock
     dialog first, and the pick goes ahead if the dialog unlocks it. The sound starts in the tap, as Safari wants. */
  function musPick(k, then) {
    if (!musOk(k)) return;
    if (k === "off" || supOn()) { if (k !== "off") ensureCtx(); then(k); return; }
    supGate(k === "own" ? YM_NAME : MUS_NAME, function () { ensureCtx(); then(k); }, function (ok) { if (ok) then(k); else musUI(); });
    musUI();                                         // meanwhile the buttons and the player's list show what still plays
  }
  // this device's choice: kept, a six-second taste of it when nothing plays, and an open practice page with no choice of its own follows it
  function musSet(k, quiet) {
    store.set("music", k);
    if (!pBusy() && P.optFor) P.opt = pOptsOf(P.optFor);
    if (k !== "off" && !quiet && !ambActive()) AMB.until = bNow() + 6;
    ambSync(); ambUI();
  }

  /* ----- Music Break: eyes closed, the music, and your heart before and after ----- */
  // own: to your own songs (yourmusic.js), so the words leave out the chords and plucked notes made here
  function mbSteps(min, own) {
    var T = (min || 10) * 60, a = 45, z = 50, L = T - a - z;
    return [
      G(a, "Settle in", [[0, "Sit or lie back comfortably, and let the music begin."], [14, "Rest the phone somewhere you can leave it, and let your hands rest."],
        [28, "Let your eyes close. The music will carry you from here."]], { vis: "glow", quiet: true }),
      Ob(L, "Listen", [[0, own ? "Let your attention rest on the music: its sounds, its rhythm, the way it moves." : "Let your attention rest on the music: the low notes, the chords, the soft plucked notes."],
        [frac(L, 0.2), "Let your breath find its own easy pace."], [frac(L, 0.45), "When your mind wanders, come back to one sound and follow it."],
        [frac(L, 0.75), "Let your face, shoulders and hands soften. Just listen."]], { vis: "glow", dim: true, quiet: true, nobell: true }),
      G(z, "Come back", [[0, "The music is coming to an end. Take a slightly deeper breath."], [16, "Move your fingers and toes, and stretch if you like."],
        [34, "When you're ready, open your eyes."]], { vis: "orb", musLvl: 0.45 })
    ];
  }

  function musInit() {
    SUP_EXTRA.push({ name: "Music in the background", href: "#st-amb" });     // Settings' list of what the donation unlocks
    SETTLE_HUSH.push(musHush);                                                 // I need to stop: the music fades with everything else
    document.addEventListener("click", function (e) {
      var b = e.target.closest ? e.target.closest('.mus-seg[data-mus-for="dev"] button[data-mus]') : null;
      if (b) musPick(b.getAttribute("data-mus"), function (k) { musSet(k); });
    });
    document.addEventListener("change", function (e) {
      if (e.target.classList && e.target.classList.contains("mus-sel")) musPick(e.target.value, function (k) { musSet(k, true); });
    });
    musUI();
    if (window.__entrain) {                                                     // for automated tests only
      var X = window.__entrain;
      X.MUS = MUS; X.MUS_FEEL = MUS_FEEL; X.MUS_BPM = MUS_BPM; X.musState = musState; X.musBar = musBar; X.musPlay = musPlay; X.musChord = musChord;
      X.musStart = musStart; X.musStop = musStop; X.musTempo = musTempo; X.musSwell = musSwell; X.musWant = musWant; X.musZone = musZone; X.musFree = musFree;
      X.musHz = musHz; X.musDev = musDev; X.musAim = musAim; X.mbSteps = mbSteps;
    }
  }
