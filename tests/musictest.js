// Music made on the device (music.js) and Music Break: pad chords, a low note and sparse plucked notes at a tempo
// matched to a session's aim, as background sound and as a practice's option; a track's heart rate in the history.
//   A  the generator and its sound: one seed, the same music; chords that move, plucked notes on the scale and the
//      grid, a pulse only when lively; rendered offline it is audible, never clipping, the same twice, at its tempo;
//      a note near a playing beat's carrier moves an octave away
//   B  locked on the real build: the Music rows and the player's list carry the cup and open the donation dialog,
//      nothing kept or played; a choice kept from before stays silent; Music Break's page free to read, Start the
//      way to unlock it; search, the library and Settings' list
//   C  unlocked (the test copy), the background: a taste, matched to Breathe at 60 a minute on the beat grid, gliding
//      to lively, a track at 96 with its carrier kept clear, the player's list, the volume, pause and I need to stop
//   D  unlocked, a practice's own: its Music row kept for it, playing at that tempo; the rest follow the background's
//      choice; the singing and chanting practices keep the music out; a tick step pauses it
//   E  Music Break with a heart sensor: its page and every plan, the music all through at the tempo chosen, pause and
//      resume, quieter for the closing words, then the end screen's heart rate against your usual, and the history
//   F  a track's heart rate in the history: start and end once there are two and a half minutes, else the average
//   G  the API for other features: a start of their own (seed, tempo), the background leaving it alone, a glide, the
//      chords' swell, stop
//   H  Learn, the glance table, references, search, 360 px and 44 px targets
// Run: node tests/musictest.js [group letter]
const { chromium, APP, OUT } = require('./pw');
const mock = require('./sensor-mock');
const { testApp, unlockInit, unlocked } = require('./unlock-helper');
const S20 = 'Mozilla/5.0 (Linux; Android 13; SM-G988B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Mobile Safari/537.36';
const only = process.argv[2] || '';
const t = (p, s) => p.$eval(s, e => e.textContent.replace(/\s+/g, ' ').trim()).catch(() => '(missing)');
const E = (p, f, a) => p.evaluate(f, a);
const go = async (p, h, ms) => { await p.evaluate(x => location.hash = x, h); await p.waitForTimeout(ms || 400); };
const until = async (p, f, ms, a) => { try { await p.waitForFunction(f, a, { timeout: ms || 5000 }); return true; } catch (e) { return false; } };
const OPT = o => JSON.stringify(Object.assign({ voice: false, bells: false, cues: 'off', visual: 'circle', audio: false, voiceName: '', ana: 0, rhythm: false }, o || {}));
const RE = /n't\b|\b(do not|never|nothing|without|stop|avoid|none)\b|feel the breath/i;
const SPELL = /\b(programs?|toward|synthesiz\w*|color\w*|favor\w*|behavior\w*|center(?:s|ed)?|organiz\w*|realiz\w*|recogniz\w*|minimiz\w*|optimiz\w*|personaliz\w*|prioritiz\w*|visualiz\w*|analyz\w*|gray|fiber|aging)\b/i;
// the buttons in a group: each one's words, * when chosen, + with the cup
const seg = (p, s) => E(p, s => [...document.querySelectorAll(s)].map(b => b.textContent.trim() + (b.getAttribute('aria-pressed') === 'true' ? '*' : '') + (b.querySelector('.sup-tag') ? '+' : '')).join(' | '), s);
const M = p => E(p, () => { const m = window.__entrain.MUS; return { on: m.on, bpm: Math.round(m.bpm * 10) / 10, to: m.to, own: m.own, lv: m.lv, n: m.log.length }; });

(async () => {
  const browser = await chromium.launch();
  const log = []; const ok = (c, m) => log.push((c ? 'PASS ' : 'FAIL ') + m);
  const URL = testApp();
  // a phone with debug on; o.url: the test copy; o.unlock: this device unlocked; o.sensor: the stand-in heart sensor,
  // connected; o.vp: the viewport; st: stored values (the defaults for every practice unless given)
  const page = async (st, o) => {
    o = o || {};
    const ctx = await browser.newContext({ userAgent: S20, viewport: o.vp || { width: 412, height: 915 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    const p = await ctx.newPage();
    p.on('pageerror', e => log.push('PAGEERROR ' + e.message));
    p.on('console', m => { if (m.type() === 'error') log.push('CONSOLE ' + m.text()); });
    if (o.unlock) await unlockInit(p);
    await p.addInitScript(s => {
      if (!sessionStorage.getItem('z.seeded')) {
        sessionStorage.setItem('z.seeded', '1');
        localStorage.setItem('entrain.debug', '1'); localStorage.setItem('entrain.stereo', 'ok'); localStorage.setItem('entrain.optsOpen', '1');
        for (const k in s) localStorage.setItem('entrain.' + k, s[k]);
      }
      if (window.speechSynthesis) { speechSynthesis.speak = () => {}; speechSynthesis.cancel = () => {}; }
    }, Object.assign({ pOpt: OPT() }, st || {}));
    if (o.sensor) await p.addInitScript(mock, o.sensor);
    await p.goto(o.url || APP);
    await unlocked(p);
    if (o.sensor) { await p.click('#tbSensor'); await p.waitForTimeout(200); await p.click('#hrConnect'); await p.waitForTimeout(700); }
    await p.waitForTimeout(250);
    return p;
  };

  try {
    /* A. the generator and its sound */
    if (!only || only === 'A') {
      const p = await page();
      const G = await E(p, () => {
        const X = window.__entrain, out = {};
        const run = (seed, k, bars) => { const st = X.musState(seed), ev = []; for (let i = 0; i < bars; i++) ev.push(...X.musBar(st, k, i * 4)); return { st, ev }; };
        const sig = ev => JSON.stringify(ev);
        out.same = ['slow', 'steady', 'lively'].every(k => sig(run(7, k, 48).ev) === sig(run(7, k, 48).ev));
        out.differ = sig(run(7, 'slow', 48).ev) !== sig(run(8, 'slow', 48).ev);
        ['slow', 'steady', 'lively'].forEach(k => {
          const F = X.MUS_FEEL[k], r = run(11, k, 64), ev = r.ev, tonic = r.st.tonic, pads = ev.filter(e => e.v === 'pad'), pl = ev.filter(e => e.v === 'pluck');
          const scale = [0, 2, 4, 7, 9].map(x => (tonic + x) % 12), major = [0, 2, 4, 5, 7, 9, 11].map(x => (tonic + x) % 12);
          const degs = []; let moved = 0;
          for (let i = 1; i < pads.length; i++) if (pads[i].n.join() !== pads[i - 1].n.join()) moved++;
          out[k] = {
            pads: pads.length, padEvery: pads.every((e, i) => e.b === i * F.bars * 4 && e.d === F.bars * 4), moved: moved / Math.max(1, pads.length - 1),
            padIn: pads.every(e => e.n.every(m => major.includes(m % 12) && m > tonic && m <= tonic + 21)),
            plucks: pl.length / 64, onScale: pl.every(e => scale.includes(e.m % 12)), onGrid: pl.every(e => Math.abs(e.b / F.grid - Math.round(e.b / F.grid)) < 1e-9),
            range: [Math.min(...pl.map(e => e.m)), Math.max(...pl.map(e => e.m))], tonic,
            bass: ev.filter(e => e.v === 'bass').every(e => X.musHz(e.m) < 125 && X.musHz(e.m) >= 65),
            thump: ev.filter(e => e.v === 'thump').length / 64, shake: ev.filter(e => e.v === 'shake').length / 64,
            sorted: ev.every((e, i) => !i || ev[i - 1].b <= e.b)
          };
          // the chords' roots: only the five chords, and the first the keynote's
          out[k].roots = [...new Set(pads.map(e => ((e.n[2] - tonic) % 12 + 12) % 12))].sort((a, b) => a - b).join(',');
          out[k].first = pads[0].n[2] % 12 === tonic % 12;
        });
        return out;
      });
      ok(G.same && G.differ, 'one seed always gives the same music, another seed other music');
      ok(['slow', 'steady', 'lively'].every(k => G[k].padEvery && G[k].moved > 0.95 && G[k].padIn && G[k].first && G[k].sorted),
        'a chord every two bars (every bar when lively), each new chord different from the last, first the keynote\'s, its notes in the key: ' + ['slow', 'steady', 'lively'].map(k => k + ' ' + G[k].pads + ' chords on roots ' + G[k].roots).join('; '));
      ok(['slow', 'steady', 'lively'].every(k => /^0(,2)?(,5)?(,7)?(,9)?$/.test(G[k].roots) && G[k].roots.split(',').length >= 4), 'the chords are I, ii, IV, V and vi of the key, at least four of them in 64 bars: ' + ['slow', 'steady', 'lively'].map(k => G[k].roots).join(' / '));
      ok(['slow', 'steady', 'lively'].every(k => G[k].onScale && G[k].onGrid && G[k].range[0] >= G[k].tonic + 12 && G[k].range[1] <= G[k].tonic + 33),
        'the plucked notes are on the five-note scale, on the beat (or the half beat when steady or lively), within an octave and a half above the keynote: ' + ['slow', 'steady', 'lively'].map(k => G[k].range.join('–')).join(', '));
      ok(G.slow.plucks > 0.6 && G.slow.plucks < 2.2 && G.steady.plucks > G.slow.plucks && G.lively.plucks > G.steady.plucks && G.lively.plucks < 5,
        'sparse plucked notes, more as the tempo rises (a bar): slow ' + G.slow.plucks.toFixed(2) + ', steady ' + G.steady.plucks.toFixed(2) + ', lively ' + G.lively.plucks.toFixed(2));
      ok(G.slow.thump === 0 && G.slow.shake === 0 && G.steady.thump === 2 && G.steady.shake === 0 && G.lively.thump === 4 && G.lively.shake === 4 && ['slow', 'steady', 'lively'].every(k => G[k].bass),
        'the pulse: none when slow, a soft thump on beats one and three when steady, on every beat with a shaker between when lively; the low note under 125 Hz');
      // rendered offline: audible, unclipped, the same twice, and lively's thumps on the beat
      const R = await E(p, async () => {
        const X = window.__entrain, out = {};
        const render = async (k, bpm, seed) => {
          const sr = 22050, secs = 24, ctx = new OfflineAudioContext(2, sr * secs, sr), st = X.musState(seed), spb = 60 / bpm;
          for (let b = 0; b * spb < secs - 4; b += 4) X.musBar(st, k, b).forEach(e => X.musPlay(ctx, ctx.destination, ctx.destination, e, 0.05 + e.b * spb, spb));
          return (await ctx.startRendering()).getChannelData(0);
        };
        for (const [k, bpm] of [['slow', 60], ['steady', 96], ['lively', 124]]) {
          const a = await render(k, bpm, 3), b = await render(k, bpm, 3);
          let s = 0, pk = 0, same = true, quiet = 1;
          // the same to within a millionth (the browser's own filters round the last digits differently from run to run)
          for (let i = 0; i < a.length; i++) { s += a[i] * a[i]; pk = Math.max(pk, Math.abs(a[i])); if (Math.abs(a[i] - b[i]) > 1e-6) same = false; }
          for (let i = 22050 * 3; i + 11025 <= 22050 * 20; i += 11025) { let e = 0; for (let j = i; j < i + 11025; j++) e += a[j] * a[j]; quiet = Math.min(quiet, Math.sqrt(e / 11025)); }
          out[k] = { rms: +Math.sqrt(s / a.length).toFixed(4), peak: +pk.toFixed(3), same, quiet: +quiet.toFixed(4) };
          if (k === 'lively') {
            // the low thump on each beat: energy below 150 Hz rises at every beat's start
            const lp = new Float32Array(a.length); let y = 0; const c = 1 - Math.exp(-2 * Math.PI * 150 / 22050);
            for (let i = 0; i < a.length; i++) { y += c * (a[i] - y); lp[i] = y; }
            const spb = 60 / bpm, at = [];
            for (let n = 8; n < 16; n++) {
              const i0 = Math.round((0.05 + n * spb) * 22050); let best = 0, bi = 0;
              for (let j = i0 - 400; j < i0 + 1500; j++) if (Math.abs(lp[j]) > best) { best = Math.abs(lp[j]); bi = j; }
              at.push((bi - i0) / 22050);
            }
            out.beatPeaks = at.map(x => +x.toFixed(3));
          }
        }
        return out;
      });
      ok(['slow', 'steady', 'lively'].every(k => R[k].same && R[k].rms > 0.04 && R[k].rms < 0.25 && R[k].peak < 0.9 && R[k].quiet > 0.01),
        'rendered offline, each tempo is audible all the way through, never clipping, and the same twice: ' + ['slow', 'steady', 'lively'].map(k => k + ' rms ' + R[k].rms + ' peak ' + R[k].peak + ' quietest half second ' + R[k].quiet).join('; '));
      ok(R.beatPeaks.every(x => x >= 0 && x < 0.07), 'lively\'s low pulse peaks just after each beat at 124 a minute (s after the beat): ' + R.beatPeaks.join(' '));
      // a beat's carrier kept clear
      const C = await E(p, () => {
        const X = window.__entrain, A = X.A, keep = { track: A.track, playing: A.playing };
        A.track = { id: 'test', carrier: 300, beat: 15, pts: [[0, 10], [60, 15]] }; A.playing = true;
        const z = X.musZone(), r = { zone: z, mid: X.musFree(310), low: X.musFree(300, true), far: X.musFree(440), under: X.musFree(270), bassLow: X.musFree(110, true) };
        A.track.sleep = true; r.sleep = X.musZone();
        A.track = keep.track; A.playing = keep.playing; r.none = X.musZone();
        return r;
      });
      ok(C.zone.join() === '275,340' && C.mid === 620 && C.low === 150 && C.far === 440 && C.under === 270 && C.bassLow === 110 && C.sleep === null && C.none === null,
        'near a playing beat (carrier 300 Hz, beats up to 15 Hz: 275–340 Hz) a note moves up an octave, a low note down; others stay; nothing to avoid with Sleep sounds or nothing playing: ' + JSON.stringify(C));
      await p.context().close();
    }

    /* B. locked on the real build */
    if (!only || only === 'B') {
      const p = await page({ music: 'slow' });
      await go(p, 'st-amb', 500);
      ok(await seg(p, '#st-amb .mus-seg button') === 'Off* | Matched+ | Slow+ | Steady+ | Lively+' && /Music made on your device can play under them too/.test(await t(p, '#st-amb')),
        'Settings\' Background sound has a Music row, each choice but Off with the cup, and a kept choice shows as Off while locked: ' + await seg(p, '#st-amb .mus-seg button'));
      await p.click('#st-amb .mus-seg button[data-mus=steady]'); await p.waitForTimeout(350);
      ok(await E(p, () => !document.querySelector('#supModal').hidden && localStorage.getItem('entrain.music') === 'slow' && !window.__entrain.MUS.on) && /^Music made on your device is one of the new techniques/.test(await t(p, '#supFor')),
        'picking music opens the donation dialog, naming it; nothing is kept or played');
      await p.keyboard.press('Escape'); await p.waitForTimeout(200);
      const sel = await E(p, () => [...document.querySelector('.mus-sel').options].map(o => o.value + ':' + o.textContent).join(' | ') + ' = ' + document.querySelector('.mus-sel').value);
      ok(sel === 'off:None | aim:Matched to the session · with a donation | slow:Slow, 60 a minute · with a donation | steady:Steady, 96 a minute · with a donation | lively:Lively, 124 a minute · with a donation = off',
        'the player\'s Music list marks each with a donation: ' + sel);
      await p.$eval('.mus-sel', s => { s.value = 'lively'; s.dispatchEvent(new Event('change', { bubbles: true })); }); await p.waitForTimeout(300);
      ok(await E(p, () => !document.querySelector('#supModal').hidden && document.querySelector('.mus-sel').value === 'off' && localStorage.getItem('entrain.music') === 'slow'), 'picking there opens the dialog too, and the list goes back to None');
      await p.keyboard.press('Escape'); await p.waitForTimeout(200);
      // the kept choice stays silent under a breathing session
      await go(p, 'breathe'); await p.click('#bStart'); await p.waitForTimeout(1500);
      ok(await E(p, () => window.__entrain.B.state === 'running' && !window.__entrain.MUS.on && window.__entrain.musWant() === null), 'a choice kept from before (a backup from an unlocked phone) stays silent under a breathing session until this device is unlocked');
      await p.click('#bStart'); await p.waitForTimeout(300);
      // a practice's Music row
      await go(p, 'practice/calm-reset', 500);
      ok(await seg(p, '#sOptMus button') === 'Off* | Matched+ | Slow+ | Steady+ | Lively+' && !(await p.$('#sOpts .so-amb .mus-seg')), 'a practice\'s Options have a Music row of their own with the cups, and the background row there leaves music out');
      await p.click('#sOptMus button[data-mus=slow]'); await p.waitForTimeout(300);
      ok(await E(p, () => !document.querySelector('#supModal').hidden && !localStorage.getItem('entrain.pOpt.calm-reset')) && await seg(p, '#sOptMus button') === 'Off* | Matched+ | Slow+ | Steady+ | Lively+',
        'picking one opens the dialog; nothing is kept for the practice');
      await p.keyboard.press('Escape'); await p.waitForTimeout(200);
      // Music Break: free to read, Start the way to unlock it
      await go(p, 'practice/music-break', 500);
      const pg = await E(p, () => ({ title: document.querySelector('#viewTitle').textContent, kind: document.querySelector('.si-kind').textContent, go: document.querySelector('#sGo').textContent.trim(),
        note: !document.querySelector('#sSupNote').hidden, blurb: document.querySelector('.si-blurb').textContent, ev: document.querySelector('.si-ev .ev-body').textContent,
        dots: document.querySelectorAll('.si-ev .dot.on, .si-ev .dots .on').length, needs: document.querySelector('.si-need').textContent.replace(/\s+/g, ' '), mus: !!document.querySelector('#sOptMus') }));
      ok(pg.title === 'Music Break' && /^Calm · Sound · 10 min$/.test(pg.kind) && pg.go === 'Unlock to start' && pg.note && /eyes closed/.test(pg.blurb) && /104 randomised trials/.test(pg.ev) && /hasn't been tested itself/.test(pg.ev),
        'Music Break\'s page is free to read, its evidence honest about the music itself, and Start reads Unlock to start: ' + pg.kind + ' · ' + pg.go);
      ok(/Speakers or headphones/.test(pg.needs) && /Heart sensor optional/.test(pg.needs) && !pg.mus && await seg(p, '#sOpts [data-choice=tempo] button') === 'Slow* | Steady | Lively',
        'it needs speakers or headphones and, optionally, a heart sensor; its own tempo choice (slow first) stands in for the Music row: ' + pg.needs);
      await p.click('#sGo'); await p.waitForTimeout(350);
      ok(await E(p, () => !document.querySelector('#supModal').hidden && window.__entrain.P.state !== 'running' && !window.__entrain.MUS.on) && /^Music Break is one of the new techniques/.test(await t(p, '#supFor')), 'Start opens the donation dialog instead');
      await p.keyboard.press('Escape'); await p.waitForTimeout(200);
      // the library, search and Settings' list
      const lib = await E(p, () => { const it = window.__entrain.libAll().find(x => x.key === 'music-break'); return { goal: it.goal, method: it.method, needs: it.needs.join(), sup: it.sup, mins: it.minsTxt, posture: it.posture.join() }; });
      ok(lib.goal === 'calm' && lib.method === 'sound' && lib.needs === '' && lib.sup && lib.mins === '10–20 min' && lib.posture === 'sit,lie', 'in the library under Calm, a sound technique needing no headphones, 10–20 minutes, with the cup: ' + JSON.stringify(lib));
      await go(p, 'goal/calm', 500);
      ok(await E(p, () => { const a = document.querySelector('.pr-grp[data-g=calm] a[href="#practice/music-break"]'); return !!a && !!a.querySelector('.sup-tag'); }), 'its row under Calm carries the Donation badge');
      await p.click('#tbFind'); await p.fill('#fdIn', 'music'); await p.waitForTimeout(350);
      const f = await E(p, () => [...document.querySelectorAll('#fdRes .fd-it')].slice(0, 6).map(a => a.getAttribute('href') + (a.querySelector('.sup-tag') ? '+' : '')));
      await p.keyboard.press('Escape');
      ok(f.includes('#practice/music-break+') && f.includes('#st-amb+'), 'search finds Music Break and music in the background, each with the cup: ' + f.join(' '));
      await go(p, 'st-supporter', 450);
      const list = await E(p, () => [...document.querySelectorAll('#supList a')].map(a => a.textContent + '>' + a.getAttribute('href')));
      ok(list.includes('Music in the background>#st-amb') && list.includes('Music Break>#practice/music-break'), 'Settings\' New techniques lists both');
      await p.context().close();
    }

    /* C. unlocked: the background */
    if (!only || only === 'C') {
      const p = await page({}, { url: URL, unlock: true });
      await go(p, 'st-amb', 500);
      ok(await seg(p, '#st-amb .mus-seg button') === 'Off* | Matched | Slow | Steady | Lively' && await E(p, () => window.__entrain.SUP.ok), 'unlocked: the Music row has no cups');
      await p.click('#st-amb .mus-seg button[data-mus=slow]');
      ok(await until(p, () => window.__entrain.MUS.on && window.__entrain.MUS.bpm === 60, 3000) && await E(p, () => localStorage.getItem('entrain.music') === 'slow'), 'Slow is kept, and a taste of it plays at 60 a minute');
      ok(await E(p, () => !document.querySelector('#st-amb .amb-volrow').hidden), 'the background\'s volume shows with music chosen, even with rain and crickets off');
      ok(await until(p, () => !window.__entrain.MUS.on, 9000), 'the taste ends by itself after a few seconds');
      await p.click('#st-amb .mus-seg button[data-mus=aim]'); await p.waitForTimeout(200);
      ok(await seg(p, '#st-amb .mus-seg button') === 'Off | Matched* | Slow | Steady | Lively' && await E(p, () => document.querySelector('.mus-sel').value === 'aim'), 'Matched, and the player\'s list follows');
      await until(p, () => !window.__entrain.MUS.on, 9000);
      // a breathing session: matched to calm, slow, notes on the beat grid
      await go(p, 'breathe'); await E(p, () => { window.__entrain.MUS.log.length = 0; }); await p.click('#bStart');
      ok(await until(p, () => window.__entrain.MUS.on && window.__entrain.MUS.bpm === 60, 4000), 'matched under a breathing session (Resonance, for calm): slow, 60 a minute');
      // a bar is four seconds at 60, and a sparse bar can be only its chord and low note: wait for a second bar
      await until(p, () => window.__entrain.MUS.log.filter(e => e.bpm === 60).length >= 4, 12000);
      const g = await E(p, () => {
        const L = window.__entrain.MUS.log.filter(e => e.bpm === 60), r = { n: L.length, kinds: [...new Set(L.map(e => e.v))].sort().join(','), worst: 0 };
        for (let i = 1; i < L.length; i++) r.worst = Math.max(r.worst, Math.abs((L[i].t - L[0].t) - (L[i].b - L[0].b)));
        r.sorted = L.every((e, i) => !i || L[i - 1].t <= e.t);
        return r;
      });
      ok(g.n >= 4 && /pad/.test(g.kinds) && /bass/.test(g.kinds) && g.worst < 0.002 && g.sorted, 'its notes go onto the audio clock on the beat grid, a second a beat: ' + g.n + ' notes (' + g.kinds + '), off the grid by at most ' + g.worst.toFixed(4) + ' s');
      // lively from Breathe's own settings: it glides there
      await p.click('#bAdjust'); await p.waitForTimeout(300);
      ok(await seg(p, '#bPanel .mus-seg button') === 'Off | Matched* | Slow | Steady | Lively', 'Breathe\'s settings have the Music row');
      await p.click('#bPanel .mus-seg button[data-mus=lively]');
      await p.waitForTimeout(1600);
      const mid = await M(p);
      ok(await until(p, () => window.__entrain.MUS.bpm === 124, 6000) && mid.to === 124 && mid.bpm > 60 && mid.bpm < 124, 'Lively glides there over a few seconds rather than jumping: ' + mid.bpm + ' on the way to 124');
      await p.waitForTimeout(2500);
      const lv = await E(p, () => { const L = window.__entrain.MUS.log.filter(e => e.bpm === 124); return { thump: L.filter(e => e.v === 'thump').length, shake: L.filter(e => e.v === 'shake').length }; });
      ok(lv.thump >= 3 && lv.shake >= 3, 'lively brings the soft pulse in: ' + JSON.stringify(lv));
      await p.click('#bPanelDone'); await p.waitForTimeout(250); await p.click('#bStart'); await p.waitForTimeout(300);
      ok(await until(p, () => !window.__entrain.MUS.on, 3000), 'pausing the breathing session stops the music (after a short fade)');
      // a track: matched to focus (steady), its carrier kept clear
      await E(p, () => { localStorage.setItem('entrain.music', 'aim'); window.__entrain.MUS.st = window.__entrain.musState(1, 50); });
      await go(p, 'track/deep-work', 500); await p.click('#trGo');
      ok(await until(p, () => window.__entrain.MUS.on && window.__entrain.MUS.bpm === 96, 5000), 'under a focus track (Deep Work Block), matched music is steady, 96 a minute');
      await p.waitForTimeout(1500);
      const tr = await E(p, () => { const X = window.__entrain, L = X.MUS.log.filter(e => e.bpm === 96), z = X.musZone(), pad = L.find(e => e.v === 'pad'); return { zone: z, pad: pad && pad.hz.map(Math.round), clear: L.every(e => e.hz.every(f => f <= z[0] || f >= z[1])) }; });
      ok(tr.zone.join() === '275,340' && tr.clear && tr.pad && tr.pad.join() === '185,220,587,659', 'every note keeps clear of the 300 Hz carrier and its 15 Hz beat: the keynote\'s chord in D plays D and E an octave up (' + (tr.pad || []).join(', ') + ' Hz)');
      await E(p, () => { const v = document.querySelector('#st-amb .amb-vol') || document.querySelector('.amb-vol'); v.value = 80; v.dispatchEvent(new Event('input', { bubbles: true })); });
      ok(await until(p, () => Math.abs(window.__entrain.MUS.bus.gain.value - 0.8 * 0.8 * 0.9 * 0.9) < 0.01, 3000), 'the background\'s volume sets the music\'s too');
      await p.$eval('.mus-sel', s => { s.value = 'lively'; s.dispatchEvent(new Event('change', { bubbles: true })); });
      ok(await until(p, () => window.__entrain.MUS.to === 124, 2000) && await E(p, () => localStorage.getItem('entrain.music') === 'lively'), 'the player\'s list changes it while the track plays');
      await p.click('#toggle'); await p.waitForTimeout(400);
      ok(await E(p, () => !window.__entrain.A.playing && !window.__entrain.MUS.on), 'pausing the track pauses the music');
      await p.click('#toggle');
      ok(await until(p, () => window.__entrain.MUS.on, 3000), 'and playing it again brings it back');
      await p.click('#stop'); await p.waitForTimeout(400);
      // I need to stop
      await go(p, 'breathe'); await p.click('#bStart');
      await until(p, () => window.__entrain.MUS.on, 4000);
      const gn = await E(p, () => window.__entrain.MUS.lvl.gain.value);
      await p.click('#bOut'); await p.waitForTimeout(150);
      ok(await E(p, () => !window.__entrain.MUS.on && window.__entrain.B.state === 'idle' && !document.querySelector('#stlModal').hidden) && gn > 0.9, 'I need to stop silences the music with everything else');
      await p.screenshot({ path: OUT + 'musictest-c-settle.png' });
      await p.context().close();
    }

    /* D. unlocked: a practice's own */
    if (!only || only === 'D') {
      const p = await page({}, { url: URL, unlock: true });
      await go(p, 'practice/calm-reset', 500);
      ok(await seg(p, '#sOptMus button') === 'Off* | Matched | Slow | Steady | Lively', 'a practice\'s Music row follows the background\'s choice (off)');
      await p.click('#sOptMus button[data-mus=lively]'); await p.waitForTimeout(250);
      const own = await E(p, () => ({ own: JSON.parse(localStorage.getItem('entrain.pOpt.calm-reset') || '{}').music, dev: localStorage.getItem('entrain.music'), sum: document.querySelector('#sOptsSum').textContent, scope: document.querySelector('#sOptsScope').textContent }));
      ok(own.own === 'lively' && own.dev === null && /Lively music/.test(own.sum) && /You've changed these for Calm Reset/.test(own.scope) && await seg(p, '#sOptMus button') === 'Off | Matched | Slow | Steady | Lively*',
        'Lively is kept for Calm Reset alone, and its options say so: ' + own.sum);
      await p.click('#sGo');
      ok(await until(p, () => window.__entrain.P.state === 'running' && window.__entrain.MUS.on && window.__entrain.MUS.bpm === 124, 5000), 'it plays under Calm Reset at 124 a minute');
      ok(await E(p, () => !document.querySelector('#sqAmbVolRow').hidden), 'the session\'s quick controls show the background volume for it');
      await p.click('#sEnd'); await p.click('#sEnd'); await p.waitForTimeout(400);
      ok(await E(p, () => !window.__entrain.MUS.on), 'ending the practice ends the music');
      // the background's choice for everything else
      await go(p, 'st-amb', 400); await p.click('#st-amb .mus-seg button[data-mus=aim]'); await p.waitForTimeout(200);
      await go(p, 'practice/morning-tonic', 500);
      ok(await seg(p, '#sOptMus button') === 'Off | Matched* | Slow | Steady | Lively', 'another practice follows the background\'s new choice, Matched');
      await p.click('#sGo');
      ok(await until(p, () => window.__entrain.P.state === 'running' && window.__entrain.MUS.bpm === 124, 5000), 'Morning Wake-Up, for energy: matched is lively');
      await p.click('#sEnd'); await p.click('#sEnd'); await p.waitForTimeout(300);
      await go(p, 'practice/calm-reset', 400);
      ok(await seg(p, '#sOptMus button') === 'Off | Matched | Slow | Steady | Lively*', 'Calm Reset keeps its own');
      await go(p, 'practice/body-scan', 400); await p.click('#sGo');
      ok(await until(p, () => window.__entrain.MUS.on && window.__entrain.MUS.bpm === 60, 5000), 'Body Scan, for calm: matched is slow');
      await p.click('#sEnd'); await p.click('#sEnd'); await p.waitForTimeout(300);
      // the singing and chanting practices keep it out; a step with a tick of its own pauses it
      await go(p, 'practice/sing', 400);
      const sing = !(await p.$('#sOptMus'));
      await go(p, 'practice/om', 400);
      const om = !(await p.$('#sOptMus'));
      await p.click('#sGo'); await p.waitForTimeout(1500);
      ok(sing && om && await E(p, () => window.__entrain.P.state === 'running' && !window.__entrain.MUS.on), 'Sing Together and Om Chanting have no Music row, and none plays under them');
      await p.click('#sEnd'); await p.click('#sEnd'); await p.waitForTimeout(300);
      const tick = await E(p, () => {
        const X = window.__entrain, P = X.P, keep = { def: P.def, state: P.state, steps: P.steps, idx: P.idx };
        P.def = X.pDef('laughter'); P.state = 'running'; P.opt = X.pOptsOf('laughter');
        P.steps = X.pPlan(P.def, 5).steps; const iTick = P.steps.findIndex(s => s.metro), iCalm = P.steps.findIndex(s => !s.metro && s.k !== 'sing');
        P.idx = iTick; const a = X.musWant(); P.idx = iCalm; const b = X.musWant();
        Object.assign(P, keep);
        return { tick: a, calm: b && b.bpm };
      });
      ok(tick.tick === null && tick.calm === 124, 'in Laughter Break, a step with its clapping tick keeps the music out; its other steps have it (lively, for energy)');
      await p.context().close();
    }

    /* E. Music Break with a heart sensor */
    if (!only || only === 'E') {
      // two earlier sessions with a heart sensor: the usual change is the middle of them
      const day = 864e5, now = Date.now();
      const hist = [{ k: 'practice', id: 'music-break', at: now - 3 * day, secs: 600, full: true, hr0: 70, hr1: 66 }, { k: 'practice', id: 'music-break', at: now - 2 * day, secs: 600, full: true, hr0: 72, hr1: 66 }];
      const p = await page({ history: JSON.stringify(hist) }, { url: URL, unlock: true, sensor: { speed: 10, rr: true } });
      await go(p, 'practice/music-break', 500);
      const plans = await E(p, ([RE, SP]) => {
        const X = window.__entrain, d = X.pDef('music-break'), re = new RegExp(RE, 'i'), sp = new RegExp(SP, 'i'), bad = [], out = [];
        for (const tempo of ['slow', 'steady', 'lively']) {
          localStorage.setItem('entrain.pCh.music-break', JSON.stringify({ tempo }));
          for (const L of [10, 15, 20]) {
            const pl = X.pPlan(d, L);
            if (pl.total !== L * 60) bad.push(tempo + L + ' total ' + pl.total);
            pl.steps.forEach(s => {
              [s.title].concat(s.lines.map(l => l[1])).forEach(x => { if (re.test(x) || sp.test(x)) bad.push(x); });
              s.lines.forEach((l, i) => { if (!(l[0] >= 0 && l[0] < s.secs && (!i || l[0] > s.lines[i - 1][0]))) bad.push(s.title + ' line at ' + l[0]); });
            });
            if (tempo === 'slow') out.push(L + ': ' + pl.steps.map(s => s.title + ' ' + s.secs).join(', '));
          }
        }
        [d.blurb, d.end].forEach(x => { if (re.test(x)) bad.push(x); });
        [d.how, d.ev, d.parts, d.choices[0].note(d)].forEach(x => { if (sp.test(x)) bad.push(x); });
        localStorage.removeItem('entrain.pCh.music-break');
        return { bad, out };
      }, [RE.source, SPELL.source]);
      ok(!plans.bad.length, 'every plan, at 10, 15 and 20 minutes and every tempo, runs its full length, its words say what to do, British spelling, lines in order inside their steps: ' + plans.out.join(' / ') + (plans.bad.length ? ' — wrong: ' + plans.bad.join('; ') : ''));
      ok(await t(p, '#sGo') === 'Start 10 min' && /Slow, about 60 beats a minute/.test(await t(p, '#sOpts')), 'unlocked: Start 10 min, and the tempo\'s note');
      await p.click('#sOpts [data-choice=tempo] button[data-v=steady]'); await p.waitForTimeout(200);
      ok(/Steady/.test(await t(p, '#sOptsSum')), 'a tempo of its own shows in the options\' summary');
      await p.click('#sOpts [data-choice=tempo] button[data-v=slow]'); await p.waitForTimeout(200);
      await p.click('#sGo');
      ok(await until(p, () => window.__entrain.P.state === 'running' && window.__entrain.MUS.on && window.__entrain.MUS.bpm === 60, 5000), 'Music Break plays its music, slow, from the start, though the background\'s choice is Off');
      ok(await E(p, () => window.__entrain.P.steps[0].title === 'Settle in' && document.querySelector('#sStage').dataset.vis === 'glow'), 'it opens with settling in, over a soft glow');
      await p.waitForTimeout(2500);
      await p.click('#sPlay'); await p.waitForTimeout(300);
      ok(await E(p, () => window.__entrain.P.state === 'paused' && !window.__entrain.MUS.on), 'a pause pauses the music');
      await p.click('#sPlay');
      ok(await until(p, () => window.__entrain.P.state === 'running' && window.__entrain.MUS.on, 3000), 'and it comes back on resuming');
      // 20 seconds at ten times speed: three and a half minutes of heart rate, then on to the closing words
      await p.waitForTimeout(20000);
      await E(p, () => { const P = window.__entrain.P, s = P.steps[P.steps.length - 1]; P.t0 -= (s.at + 2) - (performance.now() / 1000 - P.t0); });
      ok(await until(p, () => { const X = window.__entrain; return X.P.steps[X.P.idx].title === 'Come back' && X.MUS.lv === 0.45; }, 4000) && await E(p, () => window.__entrain.MUS.on),
        'for the closing words the music turns down, and plays on');
      ok(await until(p, () => window.__entrain.P.state === 'done', 15000), 'it ends by itself');
      ok(await until(p, () => !window.__entrain.MUS.on, 3000), 'and the music with it');
      const tiles = await p.$$eval('.sd-t', x => x.map(e => [...e.children].map(c => c.textContent.trim()).filter(Boolean).join(' ')));
      const hrT = tiles.find(x => x.startsWith('Heart rate')) || '';
      ok(/^Heart rate \d+ → \d+ bpm, start to end Usually −5$/.test(hrT), 'the end screen shows your heart rate at the start and the end, against your usual change (−5, the middle of your last two): ' + hrT);
      await p.click('.sd-t[data-ex="hr"]'); await p.waitForTimeout(150);
      const ex = await t(p, '#sdEx');
      ok(/Across trials of music for stress, heart rate came down more clearly than blood pressure or stress hormones/.test(ex) && /In your last 2 sessions of Music Break with a heart sensor, it usually came down 5 beats a minute/.test(ex), 'tapped, it says what music does to heart rate in the trials, and how this compares with your usual');
      const h = await E(p, () => JSON.parse(localStorage.getItem('entrain.history')).filter(e => e.id === 'music-break').pop());
      ok(h && h.hr0 > 50 && h.hr1 > 50 && h.k === 'practice', 'the history keeps it with its heart rate: ' + JSON.stringify(h && { hr0: h.hr0, hr1: h.hr1, secs: h.secs }));
      await p.screenshot({ path: OUT + 'musictest-e-end.png', fullPage: true });
      await p.context().close();
    }

    /* F. a track's heart rate in the history */
    if (!only || only === 'F') {
      const p = await page({}, { sensor: { speed: 1, rr: false } });
      await go(p, 'track/alpha-stress', 500); await p.click('#trGo');
      await until(p, () => window.__entrain.A.playing, 4000);
      ok(await until(p, () => (window.__entrain.A.hrLog || []).length >= 3, 8000), 'while a track plays, the heart sensor\'s readings are kept with the time into the track');
      // three and a half minutes, as if listened to: the first minute around 70, the last around 64
      const h1 = await E(p, () => {
        const X = window.__entrain, A = X.A;
        A.hrLog = []; A.hrLogTrack = A.track;
        for (let s = 0; s <= 210; s += 2) A.hrLog.push({ t: s, hr: s < 60 ? 70 : s > 150 ? 64 : 67 });
        A.startedAt = A.ctx.currentTime - 212; A.hAt = 0;
        document.querySelector('#stop').click();
        return JSON.parse(localStorage.getItem('entrain.history')).pop();
      });
      ok(h1.k === 'track' && h1.id === 'alpha-stress' && h1.hr0 === 70 && h1.hr1 === 64 && !h1.hrAvg, 'stopped after three and a half minutes, it goes into the history with the first minute\'s heart rate and the last: ' + JSON.stringify(h1));
      await p.click('#trGo'); await until(p, () => window.__entrain.A.playing, 4000);
      const h2 = await E(p, () => {
        const X = window.__entrain, A = X.A;
        A.hrLog = []; A.hrLogTrack = A.track;
        for (let s = 0; s <= 100; s += 2) A.hrLog.push({ t: s, hr: 68 });
        A.startedAt = A.ctx.currentTime - 100; A.hAt = 0;
        document.querySelector('#stop').click();
        return JSON.parse(localStorage.getItem('entrain.history')).pop();
      });
      ok(h2.hrAvg === 68 && !h2.hr0, 'a shorter listen keeps the average instead: ' + JSON.stringify(h2));
      await go(p, 'history', 600);
      ok(/heart rate 70 → 64/.test(await t(p, '#v-history')), 'History shows the track\'s heart rate, start to end');
      await p.context().close();
    }

    /* G. the API for other features */
    if (!only || only === 'G') {
      const p = await page({ music: 'slow' }, { url: URL, unlock: true });
      const a = await E(p, async () => {
        const X = window.__entrain, w = ms => new Promise(r => setTimeout(r, ms));
        X.musStart({ bpm: 100, seed: 42, own: 'dance', fade: 0.2 });
        await w(1200);
        const first = X.MUS.log.slice(0, 6).map(e => e.v + ':' + (e.hz[0] || 0).toFixed(1)).join(' ');
        X.musStop(0.1);
        await w(300);
        X.musStart({ bpm: 100, seed: 42, own: 'dance', fade: 0.2 });
        await w(1200);
        const again = X.MUS.log.slice(-X.MUS.log.length).filter(e => e.t > X.A.ctx.currentTime - 1.3).slice(0, 6).map(e => e.v + ':' + (e.hz[0] || 0).toFixed(1)).join(' ');
        // the background's choice leaves it alone: Breathe isn't running, yet it plays on
        X.supRefresh();
        const kept = X.MUS.on && X.MUS.own === 'dance';
        X.musTempo(120, 2);
        await w(900);
        const mid = X.MUS.bpm;
        await w(1600);
        const end = X.MUS.bpm;
        X.musSwell(0.2, 0.3);
        await w(700);
        const sw = X.MUS.pad.gain.value;
        X.musStop(0.5);
        return { first, again, kept, mid, end, sw, on: X.MUS.on, own: X.MUS.own };
      });
      ok(a.first && a.first === a.again, 'a feature can start it with a seed of its own, and the same seed plays the same notes: ' + a.first);
      ok(a.kept, 'while a feature plays it its own way, the background sound\'s choice leaves it alone');
      ok(a.mid > 100 && a.mid < 120 && a.end === 120, 'musTempo glides: ' + a.mid.toFixed(1) + ' on the way, then 120');
      ok(a.sw < 0.3, 'musSwell lowers the chords: ' + a.sw.toFixed(2));
      ok(!a.on && a.own === '', 'musStop stops it and hands it back to the background\'s choice');
      await p.context().close();
    }

    /* H. Learn, the glance table, references, search, 360 px and 44 px targets */
    if (!only || only === 'H') {
      const p = await page();
      await go(p, 'l-music', 600);
      const L = await E(p, () => {
        const h = document.querySelector('#l-music'), ps = []; let n = h.nextElementSibling;
        while (n && n.tagName === 'P') { ps.push(n.textContent.replace(/\s+/g, ' ')); n = n.nextElementSibling; }
        const refs = [...document.querySelectorAll('#references li')].map(li => li.textContent);
        const row = name => { const r = [...document.querySelectorAll('#l-glance ~ * tr.ln-row, tr.ln-row')].find(x => x.querySelector('th b') && x.querySelector('th b').textContent === name); return r ? [...r.children[2].querySelectorAll('a')].map(a => a.getAttribute('href')).join(' ') + ' | ' + r.children[1].textContent : ''; };
        return { title: h.textContent, ps, toc: !!document.querySelector('.toc a[href="#l-music"]'), visible: !document.querySelector('#v-learn').hidden,
          refs: ['de Witte, M., Spruit', 'de Witte, M., da Silva Pinho', 'Yang, Z., Su, Q.', 'Kučikienė, D.'].map(s => refs.some(r => r.startsWith(s))),
          slow: row('Slow-tempo music'), fast: row('Fast-tempo music'), own: row('Music you choose yourself') };
      });
      ok(L.visible && L.title === 'Music: stress, tempo and taste' && L.toc && L.ps.length === 4, 'Learn has a section on music, in the contents: ' + L.title + ', ' + L.ps.length + ' paragraphs');
      ok(/\(.*de Witte et al\., 2020\)/.test(L.ps[0]) && /de Witte et al\., 2022/.test(L.ps[0]) && /Yang et al\., 2025/.test(L.ps[1]) && /Kučikienė & Praninskienė, 2018/.test(L.ps[2]) && L.refs.every(Boolean),
        'music and stress, tempo and brain waves, and taste, each with its sources in the references');
      ok(/small-to-medium/.test(L.ps[0]) && /moderate to strong/.test(L.ps[1]) && /strongest of the three/.test(L.ps[2]) && /hasn't been tested itself/.test(L.ps[3]) && /moves an octave away/.test(L.ps[3]),
        'the evidence as the guide gives it, and honest about Entrain\'s own music');
      ok(L.slow === '#practice/music-break #st-amb | Moderate to strong' && L.fast === '#st-amb | Moderate' && L.own === ' | Strong', 'the glance table links slow and fast music to where Entrain has them; music you choose yourself stays in Learn for now: ' + [L.slow, L.fast, L.own].join(' / '));
      const sp = await E(p, s => { const re = new RegExp(s, 'i'), x = [...document.querySelectorAll('#l-music, #l-music ~ p')].slice(0, 5).map(e => e.textContent).join(' '); return (x.match(re) || [''])[0]; }, SPELL.source);
      ok(!sp, 'British spelling in it' + (sp ? ': ' + sp : ''));
      // 360 px: Music Break's page and Settings' Background sound; targets
      await p.setViewportSize({ width: 360, height: 740 });
      const wide = [];
      for (const h of ['practice/music-break', 'st-amb', 'breathe', 'practice/calm-reset']) {
        await go(p, h, 450);
        if (h === 'breathe') { await p.click('#bAdjust'); await p.waitForTimeout(250); }
        if (await E(p, () => document.documentElement.scrollWidth > document.documentElement.clientWidth)) wide.push(h);
      }
      ok(!wide.length, 'nothing wider than a 360-pixel phone: Music Break, Settings, Breathe\'s settings, a practice\'s Options' + (wide.length ? ': too wide ' + wide.join(', ') : ''));
      const small = await E(p, () => [...document.querySelectorAll('.mus-seg button')].filter(b => b.offsetParent).map(b => b.getBoundingClientRect().height).filter(h => h < 44));
      ok(!small.length, 'every Music button is at least 44 pixels tall' + (small.length ? ': ' + small.join(', ') : ''));
      await go(p, 'practice/music-break', 400);
      ok(await E(p, () => { const r = document.querySelector('#sGo').getBoundingClientRect(); return r.bottom <= innerHeight && r.height >= 44; }), 'Start is on screen at 360 px');
      await p.screenshot({ path: OUT + 'musictest-h-page.png', fullPage: true });
      await go(p, 'st-amb', 400);
      await p.screenshot({ path: OUT + 'musictest-h-settings.png' });
      await p.context().close();
    }
  } catch (e) { log.push('ERROR ' + (e && e.stack || e)); }
  await browser.close();
  console.log(log.join('\n'));
  console.log(log.filter(l => l.startsWith('PASS')).length + ' passed, ' + log.filter(l => /^(FAIL|PAGEERROR|ERROR|CONSOLE)/.test(l)).length + ' problems');
  process.exit(log.some(l => /^(FAIL|PAGEERROR|ERROR|CONSOLE)/.test(l)) ? 1 : 0);
})();
