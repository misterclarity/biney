// Lock-screen controls and vibration cues; the end screen against your own sessions, and trends in History.
// Run: node tests/cuetrend.js [group letter]
//   L  a track on the lock screen      V  vibration cues while breathing
//   C  the end screen compared         T  trends in History
const { chromium, APP, OUT } = require('./pw');
const S20 = 'Mozilla/5.0 (Linux; Android 13; SM-G988B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Mobile Safari/537.36';
const mock = require('./sensor-mock');
const only = process.argv[2] || '';
const t = (p, s) => p.$eval(s, e => e.textContent.replace(/\s+/g, ' ').trim()).catch(() => '(missing)');
const E = (p, f, a) => p.evaluate(f, a);
const OPT = o => ({ pOpt: JSON.stringify(Object.assign({ voice: false, bells: false, cues: 'tones', visual: 'circle', audio: false, voiceName: '', ana: 0, rhythm: false }, o || {})) });
(async () => {
  const browser = await chromium.launch();
  const log = []; const ok = (c, m) => log.push((c ? 'PASS ' : 'FAIL ') + m);
  const page = async (st, init, sensor, desk) => {
    const ctx = await browser.newContext(desk ? { viewport: { width: 1280, height: 900 } } : { userAgent: S20, viewport: { width: 412, height: 915 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    const p = await ctx.newPage();
    p.on('pageerror', e => log.push('PAGEERROR ' + e.message));
    p.on('console', m => { if (m.type() === 'error') log.push('CONSOLE ' + m.text()); });
    await p.addInitScript(s => {
      localStorage.setItem('entrain.debug', '1'); localStorage.setItem('entrain.stereo', 'ok');
      for (const k in s) localStorage.setItem('entrain.' + k, s[k]);
      if (window.speechSynthesis) { speechSynthesis.speak = () => {}; speechSynthesis.cancel = () => {}; }
    }, st || {});
    if (sensor) await p.addInitScript(mock, sensor);
    if (init) await p.addInitScript(init);
    await p.goto(APP);
    return p;
  };
  try {
    /* L. a track on the lock screen: its name and progress, play, pause and stop, carried by a silent
       element; the phone pausing it (a call) pauses the track; open-ended has no end; Settings turns it
       off; practices keep to their own screen */
    if (!only || only === 'L') {
      const hooks = () => {
        const ms = navigator.mediaSession; window.__ms = { handlers: {}, pos: [] };
        const sah = ms.setActionHandler.bind(ms); ms.setActionHandler = (a, f) => { window.__ms.handlers[a] = f; return sah(a, f); };
        const sps = ms.setPositionState.bind(ms); ms.setPositionState = s => { window.__ms.pos.push(s ? { d: s.duration === Infinity ? 'open' : s.duration, p: s.position } : null); return sps(s); };
      };
      const state = p => E(p, () => {
        const ms = navigator.mediaSession, X = window.__entrain, el = X.MS.el, m = ms.metadata;
        return { title: m && m.title, artist: m && m.artist, album: m && m.album, art: m ? m.artwork.length : 0, state: ms.playbackState,
          elPlaying: !!el && !!el.getAttribute('src') && !el.paused, elSrc: !!el && !!el.getAttribute('src'), loop: !!el && el.loop,
          pos: window.__ms.pos[window.__ms.pos.length - 1], handlers: Object.keys(window.__ms.handlers).sort().join(' '),
          playing: X.A.playing, elapsed: X.A.elapsed, name: X.A.track && X.A.track.name, minutes: X.A.track && X.A.track.minutes, sys: X.MS.sys };
      });
      const p = await page(OPT(), hooks);
      await E(p, () => location.hash = 'track/theta-meditation'); await p.waitForTimeout(250);
      await p.click('#trGo'); await p.waitForTimeout(800);
      let s = await state(p);
      ok(s.title === s.name && s.artist === 'Entrain' && /Hz/.test(s.album) && s.art === 2 && s.state === 'playing', 'a playing track shows on the lock screen: ' + s.title + ' · ' + s.album);
      ok(s.elPlaying && s.loop, 'a silent element plays alongside it, looping, to carry the controls');
      ok(s.pos && s.pos.d === s.minutes * 60 && s.pos.p < 5, 'with how far it has got: ' + JSON.stringify(s.pos));
      ok(s.handlers === 'pause play stop', 'it offers play, pause and stop: ' + s.handlers);
      const sil = await E(p, async () => {
        const b = new Uint8Array(await (await fetch(window.__entrain.MS.url)).arrayBuffer()), v = new DataView(b.buffer);
        let quiet = true; for (let i = 44; i < b.length; i++) if (b[i] !== 128) { quiet = false; break; }
        return { quiet, secs: (b.length - 44) / v.getUint32(28, true), kb: Math.round(b.length / 1024) };
      });
      ok(sil.quiet && sil.secs >= 5, 'the element plays nothing but silence, ' + sil.secs + ' s at a time (Android wants five), ' + sil.kb + ' KB');

      await E(p, () => window.__ms.handlers.pause()); await p.waitForTimeout(300);
      s = await state(p);
      ok(!s.playing && s.state === 'paused' && !s.elPlaying && s.elSrc && s.title === s.name && await p.$eval('#toggle', b => b.getAttribute('aria-label')) === 'Play',
        'Pause on the lock screen pauses the track, and it stays there, paused');
      await E(p, () => window.__ms.handlers.play()); await p.waitForTimeout(400);
      s = await state(p);
      ok(s.playing && s.state === 'playing' && s.elPlaying, 'Play there carries on');

      await E(p, () => window.__entrain.MS.el.pause()); await p.waitForTimeout(300);
      s = await state(p);
      ok(!s.playing && s.sys && s.state === 'paused', 'when the phone pauses it (a call, another app), the track pauses too');
      await E(p, () => window.__entrain.MS.el.play()); await p.waitForTimeout(400);
      s = await state(p);
      ok(s.playing && s.state === 'playing' && !s.sys, 'and comes back when the phone hands the sound back');
      await p.click('#toggle'); await p.waitForTimeout(300);
      await E(p, () => window.__entrain.MS.el.play()); await p.waitForTimeout(300);
      ok(!(await state(p)).playing, 'a track you paused yourself stays paused');
      await p.click('#toggle'); await p.waitForTimeout(400);

      await E(p, () => { const c = document.querySelector('#openEnded'); c.checked = true; c.dispatchEvent(new Event('change', { bubbles: true })); }); await p.waitForTimeout(150);
      ok((await state(p)).pos.d === 'open', 'open-ended listening has no end to count down to');
      await E(p, () => { const c = document.querySelector('#openEnded'); c.checked = false; c.dispatchEvent(new Event('change', { bubbles: true })); }); await p.waitForTimeout(150);
      ok((await state(p)).pos.d > 0, 'and the countdown comes back with the timer');

      await E(p, () => location.hash = 'settings'); await p.waitForTimeout(300);
      ok(await p.$('#stLock') !== null && await p.$eval('#stLock', c => c.checked), 'Settings has it, on');
      await p.click('label:has(#stLock)'); await p.waitForTimeout(250);
      s = await state(p);
      ok(s.playing && !s.title && s.state === 'none' && !s.elSrc && JSON.parse(await E(p, () => localStorage.getItem('entrain.settings'))).lockControls === false,
        'turned off, the lock screen lets go while the track plays on');
      await p.click('label:has(#stLock)'); await p.waitForTimeout(400);
      s = await state(p);
      ok(s.playing && s.title === s.name && s.elPlaying, 'turned on again, it comes back at once');

      await E(p, () => window.__ms.handlers.stop()); await p.waitForTimeout(300);
      s = await state(p);
      ok(!s.playing && s.elapsed === 0 && !s.title && s.state === 'none' && !s.elSrc, 'Stop there stops the track, and the controls go away');
      await p.close();

      const q = await page(OPT({ audio: true }), hooks);
      await E(q, () => location.hash = 'practice/calm-reset'); await q.waitForTimeout(300);
      await q.click('#sGo'); await q.waitForTimeout(1200);
      s = await state(q);
      ok(s.playing && !s.title && !s.elSrc, 'a practice\'s binaural layer keeps off the lock screen: the practice has its own controls');
      await q.close();
    }

    /* V. vibration cues: a buzz for each kind of change, on time, with or without sound; none while
       paused; the end has its own; a practice brings its own setting and hands yours back */
    if (!only || only === 'V') {
      const vib = () => { window.__vib = []; navigator.vibrate = p => { window.__vib.push({ t: performance.now(), p: JSON.stringify(p) }); return true; }; };
      const vibs = p => E(p, () => window.__vib.map(x => x.p));
      const BOX = (o) => ({ breath: JSON.stringify(Object.assign({ pattern: 'box', inh: 4, sip: 0, hold: 4, exh: 4, rest: 4, visual: 'circle', minutes: 0, sound: 'off', cue: 40, buzz: true }, o || {})) });
      const IN = '[60]', HOLD = '[30,90,30]', EX = '[170]', SIP = '[30]', END = '[60,110,60,110,220]';

      const d = await page(OPT(), vib, null, true);
      await E(d, () => location.hash = 'breathe'); await d.waitForTimeout(300);
      ok(await d.$eval('#bBuzzRow', e => e.hidden), 'a computer, with nothing to vibrate, isn\'t offered it');
      await E(d, () => location.hash = 'settings'); await d.waitForTimeout(300);
      ok(await d.$('#stBuzz') === null, 'nor in Settings');
      await d.close();

      let p = await page(OPT(), vib);
      await E(p, () => location.hash = 'breathe'); await p.waitForTimeout(300);
      ok(!(await p.$eval('#bBuzzRow', e => e.hidden)) && !(await p.$eval('#bBuzz', c => c.checked)), 'a phone is offered vibration on the Breathe page, off to begin with');
      await p.click('#bAdjust'); await p.waitForTimeout(400);
      await p.click('label:has(#bBuzz)'); await p.waitForTimeout(150);
      await p.screenshot({ path: OUT + 'buzz-sheet.png' });
      await p.click('#bPanelDone'); await p.waitForTimeout(300);
      ok((await vibs(p)).join(' ') === IN && JSON.parse(await E(p, () => localStorage.getItem('entrain.breath'))).buzz === true, 'turning it on buzzes once to show how it feels, and is kept');
      await E(p, () => { window.__vib.length = 0; });
      await p.click('#bStart');
      await p.waitForFunction(() => window.__vib.length > 0, null, { timeout: 6000 }).catch(() => {});
      const first = await E(p, () => { const B = window.__entrain.B, v = window.__vib[0]; return v ? { p: v.p, late: v.t / 1000 - (B.t0 + 3) } : null; });
      ok(first && first.p === IN && first.late > -0.03 && first.late < 0.08, 'the first breath in buzzes on time: ' + (first ? Math.round(first.late * 1000) + ' ms after the change' : 'no buzz'));
      await p.close();

      p = await page(Object.assign(OPT(), BOX()), vib, { speed: 4, rr: false });
      await E(p, () => location.hash = 'breathe'); await p.waitForTimeout(300);
      await p.click('#bStart');
      await p.waitForFunction(() => window.__vib.length >= 6, null, { timeout: 15000 }).catch(() => {});
      let v = await vibs(p);
      ok(v.slice(0, 6).join(' ') === [IN, HOLD, EX, HOLD, IN, HOLD].join(' '), 'box breathing, sound off: in, hold, out, hold, then round again: ' + v.slice(0, 6).join(' '));
      const gaps = await E(p, () => window.__vib.slice(1, 6).map((x, i) => (x.t - window.__vib[i].t) / 1000));
      ok(gaps.every(g => g > 3.5 && g < 4.6), 'four seconds apart, as the pattern says: ' + gaps.map(g => g.toFixed(2)).join(' '));
      await p.click('#bStart'); await p.waitForTimeout(150);
      const n0 = (await vibs(p)).length; await p.waitForTimeout(2500);
      ok(await E(p, () => window.__entrain.B.state) === 'paused' && (await vibs(p)).length === n0, 'nothing while paused');
      // a pause in the moment before a change: its buzz is still owed, so it comes after the pause
      await p.click('#bStart'); await p.waitForTimeout(300);
      const kept = await E(p, () => { const B = window.__entrain.B; B.buzzWas = 5; B.buzzAt = 9; B.buzzT = setTimeout(() => {}, 60000); document.querySelector('#bStart').click(); return { at: B.buzzAt, t: B.buzzT, st: B.state }; });
      ok(kept.st === 'paused' && kept.at === 5 && kept.t === 0, 'a buzz due just as you pause isn\'t lost: ' + JSON.stringify(kept));
      await p.close();

      p = await page(Object.assign(OPT(), BOX({ pattern: 'sigh', inh: 3, sip: 1, hold: 0, exh: 6, rest: 0, sound: 'chimes' })), vib, { speed: 4, rr: false });
      await E(p, () => location.hash = 'breathe'); await p.waitForTimeout(300);
      await p.click('#bStart');
      await p.waitForFunction(() => window.__vib.length >= 4, null, { timeout: 15000 }).catch(() => {});
      v = await vibs(p);
      ok(v.slice(0, 4).join(' ') === [IN, SIP, EX, IN].join(' '), 'with chimes as well, and the sigh\'s top-up has a tap of its own: ' + v.slice(0, 4).join(' '));
      await p.close();
      p = await page(Object.assign(OPT(), BOX({ minutes: 2 })), vib, { speed: 30, rr: false });
      await E(p, () => location.hash = 'breathe'); await p.waitForTimeout(300);
      await p.click('#bStart');
      await p.waitForFunction(() => window.__entrain.B.state === 'done', null, { timeout: 20000 }).catch(() => {});
      v = await vibs(p);
      ok(v[v.length - 1] === END && v.filter(x => x === END).length === 1, 'a timed session ends with three buzzes, once: ' + v.slice(-2).join(' '));
      await p.close();

      // a practice: its own setting for its breath steps, and yours back afterwards
      p = await page(OPT(), vib, { speed: 4, rr: false });
      const id = await E(p, () => { const X = window.__entrain; const d = X.PRACTICES.find(x => !x.audio && !x.selfPaced && X.pPlan(x, 0).steps.some(s => s.k === 'breath')); return d && d.id; });
      await E(p, x => location.hash = 'practice/' + x, id); await p.waitForTimeout(300);
      if (await p.$eval('#sOpts', e => e.hidden).catch(() => false)) { await p.click('#sOptsBtn'); await p.waitForTimeout(80); }
      ok(await p.$('#sOptBuzz') !== null && !(await p.$eval('#sOptBuzz', c => c.checked)), id + ' offers vibration with its breath, off by default');
      await p.click('label:has(#sOptBuzz)'); await p.waitForTimeout(100);
      ok(/Vibration/.test(await t(p, '#sOptsSum')), 'and its summary says so once it\'s on: ' + await t(p, '#sOptsSum'));
      await E(p, () => { window.__vib.length = 0; });
      await p.click('#sGo'); await p.waitForTimeout(300);
      for (let i = 0; i < 40 && await E(p, () => { const P = window.__entrain.P, s = P.steps[P.idx]; return !s || s.k !== 'breath'; }); i++) { await p.click('#sNext'); await p.waitForTimeout(80); }
      await p.waitForFunction(() => window.__vib.length >= 2, null, { timeout: 15000 }).catch(() => {});
      ok((await vibs(p)).length >= 2 && await E(p, () => window.__entrain.BC.buzz) === true, 'its breath steps buzz: ' + (await vibs(p)).slice(0, 3).join(' '));
      await E(p, () => { const b = document.querySelector('#sEnd'); b.click(); b.click(); }); await p.waitForTimeout(500);
      ok(await E(p, () => window.__entrain.BC.buzz) === false && !JSON.parse(await E(p, () => localStorage.getItem('entrain.breath') || '{}')).buzz, 'afterwards the guide has your own setting back, off');
      await p.close();
    }

    /* C. the end screen against your own sessions: your usual for the practice, last time, your best
       yet, how many; estimated coherence only against estimates; and the whole way from a real session */
    if (!only || only === 'C') {
      const now = Date.now(), DAY = 864e5;
      const past = (id, list) => list.map((x, i) => Object.assign({ k: 'practice', id, n: id, at: now - (list.length - i) * 2 * DAY, secs: 600, full: true }, x));
      const H = past('anapana', [
        { hr0: 70, hr1: 67, coh: 2.1, swing: 4.0 }, { hr0: 72, hr1: 67, coh: 2.5, swing: 5.2 }, { hr0: 69, hr1: 65, coh: 1.8, swing: 4.8 },
        { hr0: 71, hr1: 65, coh: 3.0, swing: 6.1 }, { hr0: 68, hr1: 66, coh: 2.2, swing: 5.0 }, { hr0: 70, hr1: 65, coh: 2.6, swing: 4.4 }])
        .concat(past('calm-reset', [{ hr0: 75, hr1: 70, coh: 4.0, est: true }]));
      const p = await page(Object.assign(OPT(), { history: JSON.stringify(H) }));
      const end = async (id, r) => {
        await E(p, x => location.hash = 'practice/' + x, id); await p.waitForTimeout(250);
        await E(p, ([id, r]) => { const X = window.__entrain; X.P.def = X.pDef(id); X.P.steps = X.pPlan(X.P.def, 0).steps; X.pDone(r, r.early); }, [id, r]);
        await p.waitForTimeout(150);
      };
      const cmp = () => p.$$eval('#sDone .sd-t', b => Object.fromEntries(b.map(x => [x.dataset.ex, (x.querySelector('.sd-cmp') || {}).textContent || ''])));
      const ex = async key => { await p.click('#sDone .sd-t[data-ex="' + key + '"]'); await p.waitForTimeout(80); return t(p, '#sdEx'); };

      await end('anapana', { secs: 600, early: false, hr0: 70, hr1: 62, coh: 3.4, cohMax: 5.0, cohEst: false, swing: 5.5, wander: 4, hrPts: [], at: now + 1 });
      let c = await cmp();
      ok(c.time === 'Your 7th time' && /and how it compares with your usual/.test(await t(p, '.sd-tap')) && c.hr === 'Usually −4' && c.coh === 'Your best yet' && c.swing === 'Usually 4.9' && c.wander === '', 'each number is set against your usual for Anapana: ' + JSON.stringify(c));
      await p.screenshot({ path: OUT + 'done-compare.png', fullPage: true });
      let e = await ex('hr');
      ok(/In your last 6 sessions of Anapana with a heart sensor, it usually came down 4 beats a minute \(the middle value\)\. This time it fell further than usual\./.test(e), 'heart rate, in words: ' + e.slice(-150));
      e = await ex('coh');
      ok(/Your usual coherence in Anapana is 2\.[34], the middle of your last 6 sessions with a beat-to-beat sensor\. This was your best yet, above all 6 of them\./.test(e), 'coherence: ' + e.slice(-150));
      e = await ex('swing');
      ok(/Your usual swing in Anapana is 4\.9, the middle of your last 6 sessions with a heart sensor\. This one was higher\./.test(e), 'swing: ' + e.slice(-120));
      e = await ex('time');
      ok(/This was your 7th session of Anapana, and your 4th in the last seven days\./.test(e), 'how many, and how many this week: ' + e.slice(-90));

      await end('anapana', { secs: 600, early: false, hr0: 70, hr1: 66, coh: 2.4, cohMax: 4.0, cohEst: false, swing: 4.95, hrPts: [], at: now + 2 });
      e = await ex('hr');
      ok(/This time was close to your usual\./.test(e) && /This one was about the same\./.test(await ex('swing')), 'close to the usual says so');

      await end('calm-reset', { secs: 600, early: false, hr0: 75, hr1: 73, coh: 2.0, cohMax: 3.0, cohEst: false, hrPts: [], at: now + 3 });
      c = await cmp();
      ok(c.hr === 'Last time −5' && c.coh === '' && c.time === 'Your 2nd time', 'with one earlier session it\'s last time, and a beat-to-beat score isn\'t set against an estimate: ' + JSON.stringify(c));
      e = await ex('hr');
      ok(/Last time you did Calm Reset with a heart sensor, your heart rate came down 5 beats a minute\. This time it fell less than last time\./.test(e), 'last time, in words: ' + e.slice(-130));
      await end('calm-reset', { secs: 600, early: false, hr0: 75, hr1: 78, coh: 4.4, cohMax: 6.0, cohEst: true, hrPts: [], at: now + 4 });
      c = await cmp();
      ok(c.coh === 'Last time 4.0' && /This time it rose instead\./.test(await ex('hr')), 'an estimate against an estimate, and a rise where it usually falls');

      await end('grounding', { secs: 300, early: false, hrPts: [], at: now + 5 });
      ok((await cmp()).time === 'Your first time' && /This was your first session of/.test(await ex('time')), 'a first session says so');
      await end('grounding', { secs: 40, early: true, hrPts: [] });
      ok((await cmp()).time === '' && !/session of/.test(await ex('time')), 'a session too short for the history claims no place in it');
      await p.close();

      // the whole way: a real session goes into the history, and the next one is set against it
      const q = await page(OPT(), null, { speed: 30, rr: true });
      await q.click('#tbSensor'); await q.waitForTimeout(200); await q.click('#hrConnect'); await q.waitForTimeout(600);
      const once = async again => {
        if (again) await q.click('#sdAgain');                       // the end screen's own way back to the start
        else await E(q, () => location.hash = 'practice/anapana');
        await q.waitForTimeout(300);
        await q.click('#sGo'); await q.waitForTimeout(300);
        await q.waitForFunction(() => { const P = window.__entrain.P; return P.state === 'running' && performance.now() / 1000 - P.t0 > 200; }, null, { timeout: 30000 });
        await E(q, () => { const b = document.querySelector('#sEnd'); b.click(); b.click(); }); await q.waitForTimeout(500);
        return q.$$eval('#sDone .sd-t', b => Object.fromEntries(b.map(x => [x.dataset.ex, (x.querySelector('.sd-cmp') || {}).textContent || ''])));
      };
      const c1 = await once(false), c2 = await once(true);
      const n = await E(q, () => JSON.parse(localStorage.getItem('entrain.history')).filter(e => e.id === 'anapana').length);
      ok(c1.time === 'Your first time' && !c1.hr && c2.time === 'Your 2nd time' && /^Last time ([−+]\d+|steady)$/.test(c2.hr) && n === 2, 'a real session: first, then second against the first: ' + JSON.stringify(c2));
      await q.close();
    }

    /* T. trends in History: twelve weeks or months of minutes, heart-rate change and coherence, each on
       its own scale; read by keyboard, tap or table; beat-to-beat coherence over estimates; shown only
       when there is something to compare */
    if (!only || only === 'T') {
      const now = Date.now(), W = 7 * 864e5;
      const s = (k, o) => Object.assign({ k: 'practice', id: 'anapana', n: 'Anapana', at: now - k * W - 60e3, secs: 600, full: true }, o);   // k whole weeks ago lands in period 11 - k
      const H = [s(0, { hr0: 72, hr1: 66, coh: 3.2 }), s(0, { k: 'track', id: 'theta-meditation', secs: 300 }), s(1, { secs: 900, hr0: 70, hr1: 66, coh: 2.8 }),
        s(3, { secs: 1200, hr0: 71, hr1: 73, coh: 2.0 }), s(3, { k: 'breath', id: 'resonance', coh: 5.0, est: true }), s(5, { hr0: 70, hr1: 70 }),
        s(20, {}), Object.assign(s(0, {}), { at: now + 3 * 864e5 })];
      const p = await page(Object.assign(OPT(), { history: JSON.stringify(H) }));
      await E(p, () => location.hash = 'history'); await p.waitForTimeout(400);
      const read = () => t(p, '#tnRead');
      ok(await p.$('.hi-tr') !== null && await p.$$eval('#tnUnit button', b => b.map(x => x.textContent + ':' + x.getAttribute('aria-pressed')).join(' ')) === 'Weeks:true Months:false', 'History has trends, by week to begin with');
      const marks = await p.evaluate(() => ({ min: document.querySelectorAll('#tnMin .tn-min').length, down: document.querySelectorAll('#tnHr .tn-down').length, up: document.querySelectorAll('#tnHr .tn-up').length,
        zero: document.querySelectorAll('#tnHr .tn-zero').length, dots: document.querySelectorAll('#tnCoh .tn-dot').length, h3: [...document.querySelectorAll('.hi-tr-plots h3')].map(h => h.firstChild.textContent).join(' | ') }));
      ok(marks.min === 4 && marks.down === 2 && marks.up === 1 && marks.zero === 1 && marks.dots === 3, 'a column for each week with sessions, down where the heart rate came down, up where it rose, a tick where it held; a dot for each week with coherence: ' + JSON.stringify(marks));
      ok(marks.h3 === 'Minutes | Heart rate, start to end | Coherence', 'three charts, each on its own scale: ' + marks.h3);
      ok(await read() === 'This week 15 min in 2 sessions, heart rate −6, coherence 3.2', 'it opens on this week, and leaves out a session dated in the future: ' + await read());
      ok(!/estimated/.test(marks.h3) && /coherence 2\.0/.test(await (async () => { await p.focus('#tnPlots'); for (let i = 0; i < 3; i++) await p.keyboard.press('ArrowLeft'); return read(); })()),
        'with a beat-to-beat sensor in the mix, estimated coherence stays out: ' + await read());
      ok(/^Week of .+ 30 min in 2 sessions, heart rate \+2, coherence 2\.0$/.test(await read()) && await p.$eval('#tnPlots', b => b.getAttribute('aria-valuenow')) === '8' &&
        /^Week of .+: 30 min in 2 sessions/.test(await p.$eval('#tnPlots', b => b.getAttribute('aria-valuetext'))), 'the arrow keys walk back through the weeks, and say each one');
      await p.keyboard.press('ArrowRight'); await p.keyboard.press('ArrowRight');
      ok(await read() === 'Last week 15 min in 1 session, heart rate −4, coherence 2.8', 'last week: ' + await read());
      await p.keyboard.press('Home');
      ok(/^Week of .+ no sessions$/.test(await read()), 'Home goes to the first of the twelve: ' + await read());
      await p.keyboard.press('End');
      ok(/^This week /.test(await read()), 'End comes back to this week');
      const g = await E(p, () => { const b = document.querySelector('#tnPlots').getBoundingClientRect(), T = window.__entrain.TN; return { x: b.left + 36 + T.geo.slot * 6.5, y: b.top + 60 }; });
      await p.mouse.click(g.x, g.y); await p.waitForTimeout(80);
      ok(/heart rate steady/.test(await read()) && await p.$eval('#tnPlots', b => b.getAttribute('aria-valuenow')) === '6', 'tapping a week reads it, and a heart rate that held reads as steady: ' + await read());
      await p.click('.hi-tr-tab summary'); await p.waitForTimeout(80);
      const rows = await p.$$eval('.hi-tr-tw tbody tr', r => r.map(x => [...x.children].map(c => c.textContent).join(' / ')));
      ok(rows.length === 12 && /^.+ \/ 15 min \/ 2 \/ −6 \/ 3\.2$/.test(rows[0]) && /^.+ \/ 30 min \/ 2 \/ \+2 \/ 2\.0$/.test(rows[3]) && /\/ — \/ — \/ — \/ —$/.test(rows[11]), 'the table holds the same, newest first: ' + rows.slice(0, 2).join(' | '));
      const cols = await E(p, () => ['.tn-min', '.tn-down', '.tn-up', '.tn-min.on'].map(q => getComputedStyle(document.querySelector(q === '.tn-min.on' ? q : q + ':not(.on)')).fill).join(' '));
      ok(cols === 'rgb(126, 135, 233) rgb(13, 169, 151) rgb(201, 128, 1) rgb(142, 152, 252)', 'in the validated chart colours, the selected week in the full accent: ' + cols);
      await p.click('#tnUnit button[data-v="month"]'); await p.waitForTimeout(200);
      ok(/^This month /.test(await read()) && await E(p, () => localStorage.getItem('entrain.trendUnit')) === 'month' && await t(p, '.hi-tr-tw thead th') === 'Month' &&
        await p.$eval('#tnUnit button[data-v="month"]', b => b.getAttribute('aria-pressed')) === 'true', 'Months: the same by calendar month, and kept');
      await p.screenshot({ path: OUT + 'trends-months.png', fullPage: true });
      await p.setViewportSize({ width: 360, height: 800 }); await p.waitForTimeout(300);
      ok(await E(p, () => document.documentElement.scrollWidth <= 360 && [...document.querySelectorAll('.hi-tr-svg')].every(v => v.getBoundingClientRect().right <= 360)), 'nothing runs past a 360 px screen');
      await p.close();

      // estimates only; heart data in one week only; sessions in one week only
      let q = await page(Object.assign(OPT(), { history: JSON.stringify([s(0, { coh: 4.1, est: true, hr0: 70, hr1: 68 }), s(2, { coh: 4.6, est: true })]) }));
      await E(q, () => location.hash = 'history'); await q.waitForTimeout(400);
      ok(/^Coherence \(estimated\)/.test(await t(q, '.hi-tr-plots h3:last-of-type')) && /Heart rate and coherence chart here once two weeks have sessions with a heart sensor/.test(await t(q, '.hi-tr')) && await q.$('#tnHr') === null,
        'with estimates only it says so; one week of heart data waits for a second');
      await q.close();
      q = await page(Object.assign(OPT(), { history: JSON.stringify([s(0, {}), s(0, { secs: 900 })]) }));
      await E(q, () => location.hash = 'history'); await q.waitForTimeout(400);
      ok(await q.$('#tnPlots') === null && /Trends show here once you have sessions in two different weeks\./.test(await t(q, '.hi-tr')), 'one week of sessions waits for a second before charting anything');
      await q.close();
    }
  } catch (e) { log.push('ERROR ' + e.message); }
  console.log(log.join('\n'));
  console.log(log.filter(l => l.startsWith('PASS')).length + ' passed, ' + log.filter(l => /^(FAIL|PAGEERROR|ERROR|CONSOLE)/.test(l)).length + ' problems');
  await browser.close();
})();
