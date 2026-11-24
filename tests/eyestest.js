// Your eyes and the resonance course, from the brain-wave guide's vision techniques and its advice on how often: the
// eyes-closed cue in relaxation practices, Eyes closed on Breathe, the gaze point on Breathe and in focus practices,
// Breathe's 20 minutes and the eight-week resonance course. Locked on the real build (each asks for the donation, and a
// choice kept from a backup does nothing), then on an unlocked copy: the cue's bell, words, dim screen and the eyes opening
// again, never while walking; the dark stage and a cue to follow; the gaze point's words, frame rate and stillness with
// reduced motion; the course's sessions, Today's ticks, History's weeks, trends and honest notes; Learn, search and 360 px.
//   A  locked: the chips, switches and Options rows with the cup, each opening the dialog by name; kept choices doing nothing
//   B  the eyes-closed cue: which practices offer it, the bell and the words at the first slow breaths, the dim screen, the
//      tone where the cues were silent, the eyes opening for the tapping, walking leaves it off, the plans unchanged
//   C  eyes closed on Breathe: the rising tone comes on, the dark stage with what to follow, kept, and left alone by a practice
//   D  the gaze point: on Breathe (its words, 30 frames a second, no blurred shadows, still with reduced motion) and in Focus Primer
//   E  20 minutes on Breathe, and a session of it in the history
//   F  the resonance course at a pinned time: what counts, starting it, Today's ticks, History's weeks and trends, once a
//      day, ending it, done, a week after
//   G  Learn, the route to the course, search, Settings' list, and a 360 px phone
// Run: node tests/eyestest.js [group letter]
const { chromium, APP, OUT } = require('./pw');
const { testApp, unlockInit, unlocked } = require('./unlock-helper');
const S20 = 'Mozilla/5.0 (Linux; Android 13; SM-G988B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Mobile Safari/537.36';
const only = process.argv[2] || '';
const t = (p, s) => p.$eval(s, e => e.textContent.replace(/\s+/g, ' ').trim()).catch(() => '(missing)');
const E = (p, f, a) => p.evaluate(f, a);
const go = async (p, h, ms) => { await p.evaluate(x => location.hash = x, h); await p.waitForTimeout(ms || 350); };
const until = async (p, f, ms, a) => { try { await p.waitForFunction(f, a, { timeout: ms || 5000 }); return true; } catch (e) { return false; } };
const OPT = o => JSON.stringify(Object.assign({ voice: false, bells: false, cues: 'off', visual: 'circle', audio: false, voiceName: '', ana: 0, rhythm: false }, o || {}));
const BAN = /n't\b|\b(do not|never|nothing|without|stop|avoid|none)\b|feel the breath/i;
const SPELL = /\b(programs?|toward|synthesiz\w*|color\w*|favor\w*|behavior\w*|center(?:s|ed)?|organiz\w*|realiz\w*|recogniz\w*|minimiz\w*|optimiz\w*|personaliz\w*|prioritiz\w*|visualiz\w*|analyz\w*|gray|fiber|aging)\b/i;
const NAMES = [['Eyes-closed cue', '#l-eyes'], ['Eyes closed on Breathe', '#breathe'], ['Gaze point', '#breathe'], ['20 minutes on Breathe', '#breathe'], ['Resonance course', '#rcourse']];
const FITS = 'sleep-descent calm-reset coherence gratitude conversation after-talk autogenic reframe nadi bhramari ujjayi dirga om';

(async () => {
  const browser = await chromium.launch();
  const log = []; const ok = (c, m) => log.push((c ? 'PASS ' : 'FAIL ') + m);
  const UNLOCKED = testApp();
  // a phone, debug on, the headphone check done; st: stored values; o.unlock: the unlocked test copy; o.at: [hour, minute] the
  // page's clock is moved to, today; o.rm: reduced motion; o.vp: the window. What's said, the tones started and the words drawn
  // on each canvas are recorded.
  const page = async (st, o) => {
    o = o || {};
    const ctx = await browser.newContext({ userAgent: S20, viewport: o.vp || { width: 412, height: 915 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, reducedMotion: o.rm ? 'reduce' : 'no-preference' });
    const p = await ctx.newPage();
    p.on('pageerror', e => log.push('PAGEERROR ' + e.message));
    p.on('console', m => { if (m.type() === 'error') log.push('CONSOLE ' + m.text()); });
    p.on('request', r => { if (!/^(file|data|blob):/.test(r.url())) log.push('FAIL a network request: ' + r.url()); });
    if (o.at) await p.addInitScript(([h, m]) => {         // the time of day, pinned: the clock runs on from there
      const R = Date, tt = new R(); tt.setHours(h, m, 0, 0);
      const off = tt.getTime() - R.now();
      function D(...a) { if (!new.target) return new R(R.now() + off).toString(); return a.length ? new R(...a) : new R(R.now() + off); }
      D.now = () => R.now() + off; D.UTC = R.UTC; D.parse = R.parse; D.prototype = R.prototype;
      window.Date = D;
    }, o.at);
    await p.addInitScript(s => {
      if (!sessionStorage.getItem('z.seeded')) {
        sessionStorage.setItem('z.seeded', '1');
        localStorage.setItem('entrain.debug', '1'); localStorage.setItem('entrain.stereo', 'ok'); localStorage.setItem('entrain.optsOpen', '1');
        for (const k in s) localStorage.setItem('entrain.' + k, s[k]);
      }
      window.__said = []; window.__osc = []; window.__txt = {}; window.__cl = {}; window.__blur = []; window.__grad = [];
      if (window.speechSynthesis) { speechSynthesis.speak = u => window.__said.push(u.text); speechSynthesis.cancel = () => {}; }
      const st0 = OscillatorNode.prototype.start;
      OscillatorNode.prototype.start = function () { window.__osc.push(Math.round(this.frequency.value * 100) / 100); return st0.apply(this, arguments); };
      const C = CanvasRenderingContext2D.prototype, ft = C.fillText, cr = C.clearRect, rg = C.createRadialGradient;
      C.fillText = function (s) { const k = this.canvas.id || '?', a = window.__txt[k] = window.__txt[k] || []; if (a.length > 400) a.splice(0, 200); a.push(String(s)); return ft.apply(this, arguments); };
      C.clearRect = function () { const k = this.canvas.id || '?'; window.__cl[k] = (window.__cl[k] || 0) + 1; return cr.apply(this, arguments); };
      C.createRadialGradient = function (x0, y0, r0, x1, y1, r1) { if (this.canvas.id === 'bCanvas' && window.__grad.length < 500) window.__grad.push(Math.round(r1 * 100) / 100); return rg.apply(this, arguments); };
      const d = Object.getOwnPropertyDescriptor(C, 'shadowBlur');
      Object.defineProperty(C, 'shadowBlur', { configurable: true, get: d.get, set(v) { if (v) window.__blur.push(v); d.set.call(this, v); } });
    }, Object.assign({ pOpt: OPT(), amb: 'off' }, st || {}));
    if (o.unlock) await unlockInit(p);
    await p.goto(o.unlock ? UNLOCKED : APP);
    await p.waitForTimeout(350);
    if (o.unlock) await unlocked(p);
    return p;
  };
  const sup = p => E(p, () => ({ open: !document.querySelector('#supModal').hidden, said: document.querySelector('#supFor').hidden ? '' : document.querySelector('#supFor').textContent }));
  const supClose = async p => { await E(p, () => document.querySelector('#supClose').click()); await p.waitForTimeout(200); };
  const open = async (p, id) => { await go(p, 'home', 250); await go(p, 'practice/' + id, 450); };
  const step = p => E(p, () => { const X = window.__entrain; return { i: X.P.idx, k: X.P.steps[X.P.idx].k, title: X.P.steps[X.P.idx].title, dim: document.querySelector('#ses').dataset.dim || '', vis: document.querySelector('#sStage').dataset.vis }; });
  // Next until the step's kind matches, at most n times
  const nextTo = async (p, f, n) => { for (let i = 0; i < (n || 12); i++) { const s = await step(p); if (f(s)) return s; await p.click('#sNext'); await p.waitForTimeout(250); } return step(p); };
  const endNow = async p => { await p.click('#sEnd'); await p.click('#sEnd'); await p.waitForTimeout(400); };
  const said = p => E(p, () => window.__said.slice());
  const words = (p, id) => E(p, k => (window.__txt[k] || []).slice(-60), id);
  const rate = async (p, id, ms) => { const a = await E(p, k => window.__cl[k] || 0, id); await p.waitForTimeout(ms); return ((await E(p, k => window.__cl[k] || 0, id)) - a) / ms * 1000; };
  // the history, replaced: each { day (0 today, -1 yesterday), h, m (when it began), secs, k, id, ... }
  const seed = (p, list) => E(p, list => {
    const X = window.__entrain, l = X.hLoad();
    l.length = 0;
    list.forEach(s => {
      const d = new Date(); d.setDate(d.getDate() + (s.day || 0)); d.setHours(s.h, s.m || 0, 0, 0);
      const e = Object.assign({ k: 'breath', id: 'resonance', secs: 1200, full: true, rate: 5.5 }, s);
      delete e.day; delete e.h; delete e.m;
      e.at = d.getTime() + e.secs * 1000;
      l.push(e);
    });
    l.sort((a, b) => a.at - b.at);
    localStorage.setItem('entrain.history', JSON.stringify(l));
  }, list);
  // a course that began n days ago (per: sessions a day; end: ended that many days ago)
  const course = (p, n, per, end) => E(p, ([n, per, end]) => {
    const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - n);
    const c = { at: d.getTime(), per: per || 2 };
    if (end !== undefined) c.end = Date.now() - end * 864e5;
    localStorage.setItem('entrain.rcourse', JSON.stringify(c));
  }, [n, per, end]);

  try {
    /* A. locked on the real build: every way in asks for the donation, and choices kept from a backup do nothing */
    if (!only || only === 'A') {
      const p = await page({});
      await go(p, 'breathe', 450);
      const ch = await E(p, () => ({ vis: [...document.querySelectorAll('#bVis label')].map(l => l.textContent.trim() + (l.querySelector('.sup-tag') ? '+cup' : '')).join('|'),
        len: [...document.querySelectorAll('#bLen label')].map(l => l.textContent.trim() + (l.querySelector('.sup-tag') ? '+cup' : '')).join('|'), eyes: !!document.querySelector('#bEyesL .sup-tag') }));
      ok(ch.vis === 'Circle|Wave|Box|Dial|Column|Scene+cup|Gaze point+cup' && ch.len === '2 min|5 min|10 min|15 min|20 min+cup|Open-ended' && ch.eyes,
        'Breathe: Gaze point under Visual and 20 min under Length carry the cup, and so does Eyes closed: ' + ch.vis + ' / ' + ch.len);
      await E(p, () => document.querySelector('#bVis input[value="gaze"]').click()); await p.waitForTimeout(300);
      let s = await sup(p);
      let b = await E(p, () => ({ v: window.__entrain.BC.visual, r: document.querySelector('#bVis input:checked').value }));
      ok(s.open && /^Gaze point is one of the new techniques/.test(s.said) && b.v === 'circle' && b.r === 'circle', 'picking Gaze point opens the dialog naming it, and the circle stays: ' + s.said + ' ' + JSON.stringify(b));
      await supClose(p);
      await E(p, () => document.querySelector('#bLen input[value="20"]').click()); await p.waitForTimeout(300);
      s = await sup(p);
      b = await E(p, () => ({ m: window.__entrain.BC.minutes, r: document.querySelector('#bLen input:checked').value }));
      ok(s.open && /^20 minutes on Breathe is one/.test(s.said) && b.m === 5 && b.r === '5', 'picking 20 min opens the dialog naming it, and the length stays at 5: ' + s.said + ' ' + JSON.stringify(b));
      await supClose(p);
      await E(p, () => document.querySelector('#bEyesOn').click()); await p.waitForTimeout(300);
      s = await sup(p);
      b = await E(p, () => ({ on: document.querySelector('#bEyesOn').checked, e: window.__entrain.BC.eyes, st: document.querySelector('#bStage').dataset.eyes || '' }));
      ok(s.open && /^Eyes closed on Breathe is one/.test(s.said) && !b.on && !b.e && !b.st, 'and Eyes closed the same, staying off: ' + s.said + ' ' + JSON.stringify(b));
      await supClose(p);
      // a relaxation practice's Options and a focus practice's
      await open(p, 'calm-reset');
      ok(await E(p, () => !!document.querySelector('#sOptEyesL .sup-tag') && !document.querySelector('#sOptEyes').checked && !document.querySelector('#sOptGaze')),
        'Calm Reset\'s Options offer the eyes-closed cue, with the cup, and no gaze point');
      await p.click('#sOptEyes'); await p.waitForTimeout(300);
      s = await sup(p);
      ok(s.open && /^Eyes-closed cue is one/.test(s.said) && !(await E(p, () => document.querySelector('#sOptEyes').checked)) && !(await E(p, () => localStorage.getItem('entrain.pOpt.calm-reset'))),
        'turning it on opens the dialog naming it, and keeps nothing: ' + s.said);
      await supClose(p);
      await open(p, 'focus-primer');
      ok(await E(p, () => !!document.querySelector('#sOptGazeL .sup-tag') && !document.querySelector('#sOptEyes')), 'Focus Primer\'s Options offer the gaze point, with the cup, and no eyes-closed cue');
      await p.click('#sOptGaze'); await p.waitForTimeout(300);
      s = await sup(p);
      ok(s.open && /^Gaze point is one/.test(s.said) && !(await E(p, () => document.querySelector('#sOptGaze').checked)), 'and the gaze point asks the same: ' + s.said);
      await supClose(p);
      // History: the course described, its Start the way to unlock
      await go(p, 'history', 450);
      const hi = await E(p, () => ({ txt: document.querySelector('#rcourse') ? document.querySelector('#rcourse').textContent.replace(/\s+/g, ' ') : '', cup: !!document.querySelector('#rcOpen .sup-tag'), go: !!document.querySelector('#rcGo') }));
      ok(/^Resonance courseDonationLehrer and colleagues' protocol/.test(hi.txt) && /400 adults/.test(hi.txt) && /minority, precautionary view/.test(hi.txt) && hi.cup && !hi.go,
        'History describes the course, with its honest notes, and Start the course carries the cup: ' + hi.txt.slice(0, 90));
      await p.click('#rcOpen'); await p.waitForTimeout(300);
      s = await sup(p);
      ok(s.open && /^Resonance course is one/.test(s.said) && !(await E(p, () => localStorage.getItem('entrain.rcourse'))), 'which asks for the donation, and starts nothing: ' + s.said);
      await supClose(p);
      await p.context().close();

      // kept from a backup on a locked device: a gaze point, eyes closed, 20 minutes, the cue and a course
      const q = await page({ breath: JSON.stringify({ pattern: 'resonance', inh: 5.5, sip: 0, hold: 0, exh: 5.5, rest: 0, visual: 'gaze', eyes: true, minutes: 20, sound: 'off', cue: 40, buzz: false }),
        'pOpt.calm-reset': JSON.stringify({ eyes: true }), rcourse: JSON.stringify({ at: Date.now() - 3 * 864e5, per: 2 }) });
      await go(q, 'home', 450);
      const td = await E(q, () => ({ card: !document.querySelector('#tdCourse').hidden, txt: document.querySelector('#tdCourseBody').textContent.replace(/\s+/g, ' ') }));
      ok(td.card && /Your resonance course is one of the new techniques. Unlock it/.test(td.txt), 'Today: a kept course shows only the way to unlock it: ' + td.txt);
      await q.click('#tdRcUnlock'); await q.waitForTimeout(300);
      s = await sup(q);
      ok(s.open && /^Resonance course is one/.test(s.said), 'which opens the dialog naming it');
      await supClose(q);
      await go(q, 'history', 450);
      const hk = await E(q, () => ({ what: document.querySelector('#rcourse .xp-what').textContent, next: document.querySelector('#rcourse .xp-next').textContent.replace(/\s+/g, ' ').trim(),
        cup: !!document.querySelector('#rcourse #rcOpen .sup-tag'), go: !!document.querySelector('#rcBreathe'), per: !!document.querySelector('#rcPer'), kept: localStorage.getItem('entrain.rcourse') }));
      ok(/^Twice a day, from/.test(hk.what) && /^Your resonance course is one of the new techniques\.\s*Unlock it/.test(hk.next) && hk.cup && !hk.go && !hk.per,
        'History keeps its weeks to read, with the way to unlock it as on Today, and no Breathe 20 min or sessions a day: ' + hk.next);
      await q.click('#rcourse #rcOpen'); await q.waitForTimeout(300);
      s = await sup(q);
      ok(s.open && /^Resonance course is one/.test(s.said) && await E(q, k => localStorage.getItem('entrain.rcourse') === k, hk.kept), 'which opens the dialog too, the course left as it was');
      await supClose(q);
      await go(q, 'breathe', 500);
      b = await E(q, () => ({ v: window.__entrain.bVisNow(), r: document.querySelector('#bVis input:checked').value, eyes: document.querySelector('#bStage').dataset.eyes || '', cb: document.querySelector('#bEyesOn').checked,
        m: window.__entrain.BC.minutes, len: document.querySelector('#bLen input:checked').value }));
      ok(b.v === 'circle' && b.r === 'circle' && !b.eyes && !b.cb && b.m === 20 && b.len === '20', 'Breathe shows the circle and the visual, and keeps 20 min chosen: ' + JSON.stringify(b));
      await q.click('#bStart'); await q.waitForTimeout(350);
      s = await sup(q);
      ok(s.open && /^20 minutes on Breathe/.test(s.said) && await E(q, () => window.__entrain.B.state) === 'idle', 'Start asks for the donation for the 20 minutes first, and nothing starts: ' + s.said);
      await supClose(q);
      b = await E(q, () => ({ m: window.__entrain.BC.minutes, len: document.querySelector('#bLen input:checked').value, kept: JSON.parse(localStorage.getItem('entrain.breath')).minutes }));
      ok(b.m === 15 && b.len === '15' && b.kept === 15, 'closed still locked, the length goes back to 15 minutes: ' + JSON.stringify(b));
      await q.click('#bStart'); await q.waitForTimeout(400);
      ok(await E(q, () => window.__entrain.B.state === 'running' && document.querySelector('#supModal').hidden), 'then Start starts it');
      await q.click('#bReset'); await q.waitForTimeout(200);
      await open(q, 'calm-reset');
      await q.click('#sGo'); await q.waitForTimeout(400);
      const st = await nextTo(q, s => s.k === 'breath');
      await q.waitForTimeout(2200);
      ok(st.k === 'breath' && !st.dim && !(await E(q, () => window.__entrain.EY.on)) && !(await E(q, () => window.__entrain.P.steps[window.__entrain.P.idx].lines.some(l => l[2] === 'eyes'))),
        'Calm Reset with the cue kept on: no cue and no dimming while locked: ' + JSON.stringify(st));
      await endNow(q);
      await q.context().close();
    }

    /* B. the eyes-closed cue in a practice */
    if (!only || only === 'B') {
      const p = await page({ pOpt: OPT({ voice: true, cues: 'off' }), 'pTap.calm-reset': '1' }, { unlock: true });
      const fit = await E(p, () => window.__entrain.PRACTICES.filter(d => window.__entrain.eyFits(d)).map(d => d.id).join(' '));
      ok(fit === FITS, 'the relaxation practices with paced breathing offer it, sitting or lying, leaving out those whose eyes have work to do: ' + fit);
      const skip = await E(p, () => ['call', 'meal', 'mindful-sex', 'touch', 'imagery', 'fireside', 'focus-primer', 'wim-hof', 'qigong', 'laughter', 'let-it-out', 'body-scan', 'walking', 'stress-check'].filter(id => window.__entrain.eyFits(window.__entrain.pDef(id))));
      ok(!skip.length, 'and not the call, the meal, Mindful Sex, Soothing Touch, Guided Imagery, Fireside, a focus or energy practice, a moving one, one with no paced breathing or the Stress Check: ' + skip.join(' '));
      await open(p, 'calm-reset');
      const row = await E(p, () => { const r = document.querySelector('#sOptEyes').closest('.so-row'); return { cup: !!r.querySelector('.sup-tag'), note: r.querySelector('small').textContent }; });
      ok(!row.cup && /Close your eyes now; the sound will guide you/.test(row.note) && /walking, your eyes stay open/.test(row.note) && !SPELL.test(row.note), 'unlocked, the row has no cup, and says what it does: ' + row.note);
      await p.click('#sOptEyes'); await p.waitForTimeout(250);
      const kept = await E(p, () => ({ on: document.querySelector('#sOptEyes').checked, own: JSON.parse(localStorage.getItem('entrain.pOpt.calm-reset') || '{}'), sum: document.querySelector('#sOptsSum').textContent }));
      ok(kept.on && kept.own.eyes === true && /Eyes closed/.test(kept.sum), 'turned on, it\'s kept for Calm Reset and named in the summary: ' + kept.sum);
      // the plan is the same with it on: the cue goes in as the session runs
      const plans = await E(p, () => { const X = window.__entrain, d = X.pDef('calm-reset'), a = JSON.stringify(X.pPlan(d, 10).steps.map(s => s.lines)); return a.indexOf('Close your eyes now') < 0; });
      ok(plans, 'Calm Reset\'s plan is unchanged by it');
      const room = await E(p, () => { const f = window.__entrain.eyRoom, j = x => x.map(l => l[0] + ':' + l[1]).join(' ');
        return [j(f([[0, 'a'], [3, 'b'], [4, 'c']], 0, 60)), j(f([[0, 'a'], [10, 'b'], [30, 'c']], 20, 60)), j(f([[0, 'a'], [55, 'b']], 0, 58))]; });
      ok(room[0] === '1.5:Close your eyes now; the sound will guide you. 7.5:a 8.5:b 9.5:c' && room[1] === '0:a 10:b 21.5:Close your eyes now; the sound will guide you. 30:c' &&
        room[2] === '1.5:Close your eyes now; the sound will guide you. 7.5:a 55:b', 'the cue comes a moment after the step begins (or is jumped into), its own words after, in order and inside the step: ' + room.join(' | '));
      await p.click('#sGo'); await p.waitForTimeout(400);
      const first = await step(p);
      ok(first.k === 'guide' && !first.dim && await E(p, () => window.__entrain.EY.on), 'it starts with the cue on, and the opening step undimmed: ' + JSON.stringify(first));
      const o0 = await E(p, () => window.__osc.length);
      await p.click('#sNext'); await p.waitForTimeout(250);
      const br = await step(p);
      const L = await E(p, () => { const X = window.__entrain, s = X.P.steps[X.P.idx]; return s.lines.map(l => [Math.round(l[0] * 10) / 10, l[1], l[2] || '']); });
      const cue = L.findIndex(l => l[2] === 'eyes');
      ok(br.k === 'breath' && br.dim === '1' && cue === 0 && L[0][0] >= 1.4 && L[0][0] < 2.5 && L[0][1] === 'Close your eyes now; the sound will guide you.' && L.length > 1 && L[1][0] >= L[0][0] + 6 && /^Breathe in through the nose/.test(L[1][1]) &&
        L.every((l, i) => !i || l[0] > L[i - 1][0]), 'at the first slow breaths the screen dims, and the cue comes a moment in, the step\'s own words six seconds after it: ' + JSON.stringify(L.slice(0, 3)));
      const heard = await until(p, () => window.__said.includes('Close your eyes now; the sound will guide you.'), 4000);
      const bell = await E(p, n => window.__osc.slice(n), o0);
      const cap = await t(p, '#sLine');
      ok(heard && bell.includes(523.25) && /Close your eyes now/.test(cap), 'then a soft bell that sounds with the bells off, and the words, said and shown: ' + cap + ' (tones ' + bell.slice(0, 8).join(', ') + ')');
      ok(await E(p, () => window.__entrain.BC.sound === 'tones' && window.__entrain.P.opt.cues === 'off'), 'and the breath cues, silent in its options, play the rising tone so the sound can guide you');
      ok(!BAN.test('Close your eyes now; the sound will guide you.') && !BAN.test('Open your eyes now.'), 'the words say what to do');
      await p.screenshot({ path: OUT + 'eyestest-b-dim.png' });
      // back to the opening: lit; forward again: dim, and the cue said again
      await E(p, () => { window.__entrain.P.t0 = performance.now() / 1000 - 1; });
      await p.waitForTimeout(500);
      const back = await step(p);
      const s9 = (await said(p)).length;
      await p.click('#sNext'); await p.waitForTimeout(250);
      const fwd = await step(p);
      const again = await until(p, n => window.__said.slice(n).includes('Close your eyes now; the sound will guide you.'), 4000, s9);
      ok(back.i === 0 && !back.dim && fwd.k === 'breath' && fwd.dim === '1' && again, 'back on the opening step the screen is lit; on to the breathing again, it dims and the cue comes again: ' + JSON.stringify([back, fwd]));
      // through the breathing, still dim; the tapping round has points to look at: a bell and "Open your eyes now"
      await p.click('#sNext'); await p.waitForTimeout(250);
      const b2 = await step(p);
      ok(b2.dim === '1', 'the next breathing step stays dim: ' + JSON.stringify(b2));
      const s0 = (await said(p)).length, o1 = await E(p, () => window.__osc.length);
      const mid = await nextTo(p, s => s.k !== 'breath');
      ok(mid.k === 'guide' && mid.dim === '1', 'and so does the closing step after it: ' + JSON.stringify(mid));
      const tap = await nextTo(p, s => s.title === 'Tapping');
      await p.waitForTimeout(900);
      const after = (await said(p)).slice(s0), ob = await E(p, n => window.__osc.slice(n), o1);
      ok(tap.title === 'Tapping' && !tap.dim && after.includes('Open your eyes now.') && ob.includes(783.99), 'the tapping round, with its points to look at, opens the eyes again: a bell, "Open your eyes now", the screen lit: ' + JSON.stringify(tap) + ' ' + after.slice(0, 3).join(' | '));
      await p.click('#sNext'); await p.waitForTimeout(250);
      ok(!(await step(p)).dim, 'and the screen stays lit after');
      await endNow(p);
      ok(await E(p, () => !document.querySelector('#ses').dataset.dim), 'the end screen is lit');
      // walking: off, whatever is kept
      await E(p, () => localStorage.setItem('entrain.pCh.calm-reset', JSON.stringify({ pos: 'walk' })));
      await open(p, 'calm-reset');
      await p.click('#sGo'); await p.waitForTimeout(400);
      const w = await nextTo(p, s => s.k === 'breath');
      await p.waitForTimeout(400);
      ok(w.k === 'breath' && !w.dim && !(await E(p, () => window.__entrain.EY.on)) && await E(p, () => window.__entrain.BC.sound === 'off'), 'walking, there\'s no cue and no dimming, and the cues stay as chosen');
      await endNow(p);
      await p.context().close();
    }

    /* C. eyes closed on Breathe */
    if (!only || only === 'C') {
      const p = await page({}, { unlock: true });
      await go(p, 'breathe', 450);
      ok(await E(p, () => !document.querySelector('#bEyesL .sup-tag') && !document.querySelector('#bEyesOn').checked), 'unlocked, Eyes closed has no cup, and starts off');
      await E(p, () => document.querySelector('#bEyesOn').click()); await p.waitForTimeout(300);
      let b = await E(p, () => ({ on: document.querySelector('#bEyesOn').checked, e: window.__entrain.BC.eyes, snd: window.__entrain.BC.sound, chip: document.querySelector('#bSnd input:checked').value,
        st: document.querySelector('#bStage').dataset.eyes, hint: document.querySelector('#bEyesHint').textContent, kept: JSON.parse(localStorage.getItem('entrain.breath')) }));
      ok(b.on && b.e && b.snd === 'tones' && b.chip === 'tones' && b.st === '1' && b.hint === 'The rising tone is on, to guide each breath.' && b.kept.eyes === true && b.kept.sound === 'tones',
        'turned on with sound and vibration off, the rising tone comes on, the stage goes dark, and both are kept: ' + JSON.stringify({ snd: b.snd, st: b.st, hint: b.hint }));
      await E(p, () => window.__txt.bCanvas = []);
      await p.click('#bStart'); await p.waitForTimeout(900);
      let wd = await words(p, 'bCanvas');
      ok(wd.includes('Eyes closed') && wd.includes('Follow the rising tone') && !wd.some(x => /^\d+$/.test(x)), 'running, the stage shows only "Eyes closed" and what to follow, no countdown or visual: ' + [...new Set(wd)].join(' | '));
      await p.screenshot({ path: OUT + 'eyestest-c-dark.png' });
      // chimes and vibration are named as they're chosen
      await E(p, () => document.querySelector('#bSnd input[value="chimes"]').click()); await p.waitForTimeout(500);
      wd = await words(p, 'bCanvas');
      ok(wd.slice(-4).includes('Follow the chimes'), 'with chimes, it says to follow the chimes');
      await p.click('#bReset'); await p.waitForTimeout(200);
      // a practice using the guide draws its own visual on Breathe, not the dark stage
      await open(p, 'calm-reset');
      await p.click('#sGo'); await p.waitForTimeout(300);
      await nextTo(p, s => s.k === 'breath');
      await go(p, 'breathe', 600);
      ok(await E(p, () => !window.__entrain.eyClosedNow() && !document.querySelector('#bStage').dataset.eyes), 'while a practice uses the guide, Breathe shows its breathing, not the dark stage');
      await E(p, () => location.hash = 'practice/calm-reset'); await p.waitForTimeout(300);
      await endNow(p);
      // kept after a reload, and off again
      await p.reload(); await p.waitForTimeout(500); await unlocked(p);
      await go(p, 'breathe', 400);
      b = await E(p, () => ({ on: document.querySelector('#bEyesOn').checked, st: document.querySelector('#bStage').dataset.eyes }));
      ok(b.on && b.st === '1', 'it\'s still on after a reload: ' + JSON.stringify(b));
      await E(p, () => document.querySelector('#bEyesOn').click()); await p.waitForTimeout(250);
      ok(await E(p, () => !window.__entrain.BC.eyes && !document.querySelector('#bStage').dataset.eyes && JSON.parse(localStorage.getItem('entrain.breath')).eyes === false), 'and turns off again');
      await p.context().close();
    }

    /* D. the gaze point */
    if (!only || only === 'D') {
      for (const rm of [false, true]) {
        const p = await page({}, { unlock: true, rm });
        await go(p, 'breathe', 450);
        await E(p, () => document.querySelector('#bVis input[value="gaze"]').click()); await p.waitForTimeout(300);
        const b = await E(p, () => ({ v: window.__entrain.BC.visual, hint: document.querySelector('#bVisHint').textContent, cup: !!document.querySelector('#bVis input[value="gaze"]').parentNode.querySelector('.sup-tag'), kept: JSON.parse(localStorage.getItem('entrain.breath')).visual }));
        if (!rm) ok(b.v === 'gaze' && b.kept === 'gaze' && !b.cup && /Rest your eyes softly on the point; blink when you need to\. General practice, not researched\./.test(b.hint) && !SPELL.test(b.hint),
          'unlocked, Gaze point is picked at once, kept, and its hint says what to do and that it isn\'t researched: ' + b.hint);
        await E(p, () => { window.__txt.bCanvas = []; window.__grad = []; window.__blur = []; });
        await p.click('#bStart'); await p.waitForTimeout(600);
        const fr = await rate(p, 'bCanvas', 2500);
        await E(p, () => { window.__grad = []; });            // past the three seconds' get ready, into the breathing
        await p.waitForTimeout(1500);
        const wd = await words(p, 'bCanvas'), g = await E(p, () => window.__grad.slice()), blur = await E(p, () => window.__blur.length);
        const sizes = new Set(g);
        if (!rm) {
          ok(fr >= 20 && fr <= 32 && !blur, 'it draws about 30 frames a second, with no blurred shadows: ' + fr.toFixed(1));
          ok(wd.join(' ').includes('Rest your eyes softly on the point;') && wd.join(' ').includes('blink when you need to.') && !wd.some(x => /^\d+$/.test(x)), 'its words are drawn under the point, with no countdown: ' + [...new Set(wd)].slice(0, 4).join(' | '));
          ok(sizes.size > 5, 'its glow swells and shrinks with the breath: ' + sizes.size + ' sizes');
          await p.screenshot({ path: OUT + 'eyestest-d-gaze.png' });
        } else ok(sizes.size === 1 && g.length > 10, 'with reduced motion the glow keeps its size (only its light follows the breath): ' + [...sizes].join(', '));
        await p.click('#bReset'); await p.waitForTimeout(200);
        if (!rm) {
          // Focus Primer with the gaze point: in place of the orb and the still point, and as its breath visual
          await open(p, 'focus-primer');
          await p.click('#sOptGaze'); await p.waitForTimeout(250);
          ok(await E(p, () => document.querySelector('#sOptGaze').checked && JSON.parse(localStorage.getItem('entrain.pOpt.focus-primer')).gaze === true && /Gaze point/.test(document.querySelector('#sOptsSum').textContent)), 'Focus Primer keeps the gaze point, named in the summary');
          await p.click('#sGo'); await p.waitForTimeout(500);
          const s0 = await step(p);
          await E(p, () => window.__txt.sCanvas = []);
          const sr = await rate(p, 'sCanvas', 2000);
          const w0 = await words(p, 'sCanvas');
          ok(s0.vis === 'gaze' && sr >= 20 && sr <= 32 && w0.join(' ').includes('blink when you need to.'), 'its opening step shows the gaze point in place of the orb, at about 30 frames a second: ' + JSON.stringify(s0) + ' ' + sr.toFixed(1));
          const s1 = await nextTo(p, s => s.k === 'breath');
          await p.waitForTimeout(300);
          ok(s1.vis === 'breath' && await E(p, () => window.__entrain.BC.visual === 'gaze'), 'its slow breathing follows the breath with the gaze point: ' + await E(p, () => window.__entrain.BC.visual));
          await p.click('#sNext'); await p.waitForTimeout(300);
          ok((await step(p)).vis === 'gaze', 'and its still point is the gaze point too');
          await endNow(p);
          ok(await E(p, () => window.__entrain.BC.visual === 'gaze'), 'afterwards Breathe has its own visual back');
          // a calm practice has no gaze point row
          await open(p, 'calm-reset');
          ok(await E(p, () => !document.querySelector('#sOptGaze')), 'Calm Reset offers no gaze point');
        }
        await p.context().close();
      }
    }

    /* E. 20 minutes on Breathe */
    if (!only || only === 'E') {
      const p = await page({}, { unlock: true });
      await go(p, 'breathe', 400);
      await E(p, () => document.querySelector('#bLen input[value="20"]').click()); await p.waitForTimeout(300);
      const b = await E(p, () => ({ m: window.__entrain.BC.minutes, tot: window.__entrain.B.total, clock: document.querySelector('#bClock').textContent, cup: !!document.querySelector('#bLen input[value="20"]').parentNode.querySelector('.sup-tag'), kept: JSON.parse(localStorage.getItem('entrain.breath')).minutes }));
      ok(b.m === 20 && b.tot === 109 && b.clock === '19:59' && !b.cup && b.kept === 20, 'unlocked, 20 min is picked at once: 109 whole breaths of 11 seconds, 19:59 on the clock, kept: ' + JSON.stringify(b));
      await go(p, 'home', 300);
      ok(/A 20-minute session\./.test(await t(p, '#homePatTxt')), 'Today says so: ' + await t(p, '#homePatTxt'));
      await go(p, 'breathe', 300);
      await p.click('#bStart'); await p.waitForTimeout(300);
      await E(p, () => { window.__entrain.B.t0 -= 1203; });
      await p.waitForTimeout(500);
      const e = await E(p, () => { const l = window.__entrain.hLoad(); return l[l.length - 1] || null; });
      ok(e && e.k === 'breath' && e.id === 'resonance' && e.secs >= 1170 && e.secs <= 1200 && e.full === true && await E(p, e => window.__entrain.rcCounts(e), e), 'a whole session goes into the history as its 19 minutes 59 seconds, and counts for the course: ' + JSON.stringify(e));
      await p.context().close();
    }

    /* F. the resonance course, at ten in the morning */
    if (!only || only === 'F') {
      const p = await page({}, { unlock: true, at: [10, 0] });
      // what counts
      const c = await E(p, () => {
        const f = window.__entrain.rcCounts, e = o => Object.assign({ k: 'breath', id: 'resonance', secs: 1200, rate: 5.5 }, o);
        return [f(e({})), f(e({ secs: 1170 })), f(e({ secs: 1169 })), f(e({ id: 'custom', rate: 6 })), f(e({ id: 'my-x', rate: 4.6 })), f(e({ id: 'exhale', rate: 6 })), f(e({ id: 'custom', rate: 8 })), f(e({ id: 'box', rate: 3.75 })),
          f(e({ id: 'sigh', rate: 6 })), f(e({ id: 'custom', rate: 5.5, ib: true })), f({ k: 'practice', id: 'coherence', secs: 1200 }), f({ k: 'practice', id: 'coherence', secs: 900 }), f({ k: 'practice', id: 'calm-reset', secs: 1500 }), f({ k: 'track', id: 'x', secs: 1500 })].map(Number).join('');
      });
      ok(c === '11011100001000', 'a session counts with 20 minutes (19.5 or more) at 4.5 to 7 breaths a minute on Breathe, or Heart Coherence at 20; not shorter, with a block of intense breathing, faster, the box, the sigh, Swim & dive or another practice: ' + c);
      await go(p, 'home', 300);
      ok(await E(p, () => document.querySelector('#tdCourse').hidden), 'Today has no course card before one starts');
      await go(p, 'history', 450);
      let sec = await E(p, () => document.querySelector('#rcourse').textContent.replace(/\s+/g, ' '));
      ok(/Lehrer and colleagues' protocol/.test(sec) && /400 adults who breathed at about 5\.5 a minute for ten minutes a day over four weeks improved on stress, anxiety, depression and wellbeing no more than those breathing at a placebo pace of 12 a minute/.test(sec) &&
        /One practice guide suggests keeping home practice to 20 minutes a day, for a risk that's only theoretical\. That's a minority, precautionary view/.test(sec) && /warns against overbreathing/.test(sec) && !SPELL.test(sec),
        'History sets out the protocol, the placebo trial and the precautionary cap as the guide gives them');
      ok(await E(p, () => document.querySelector('#rcPer button[aria-pressed="true"]').textContent === 'Twice a day'), 'twice a day to start with');
      await p.click('#rcGo'); await p.waitForTimeout(400);
      const kept = await E(p, () => JSON.parse(localStorage.getItem('entrain.rcourse')));
      const midnight = await E(p, () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d.getTime(); });
      ok(kept && kept.at === midnight && kept.per === 2 && /The course starts today/.test(await t(p, '#toastTxt')), 'Start the course keeps today as its first day: ' + JSON.stringify(kept));
      sec = await E(p, () => document.querySelector('#rcourse').textContent.replace(/\s+/g, ' '));
      ok(/Twice a day, from .+\. Week 1 of 8, day 1 of 56: 0 of 112 sessions\./.test(sec) && /No sessions yet/.test(sec), 'History: week 1 of 8, day 1, none yet: ' + sec.slice(0, 120));
      await go(p, 'home', 400);
      let td = await E(p, () => ({ card: !document.querySelector('#tdCourse').hidden, txt: document.querySelector('#tdCourseBody').textContent.replace(/\s+/g, ' '), go: !!document.querySelector('#tdRcGo') }));
      ok(td.card && /^Week 1 of 8 · day 1 of 56First 20 minutes/.test(td.txt) && /Second 20 minutes/.test(td.txt) && /0 of 2 today · 0 of 14 this week/.test(td.txt) && td.go, 'Today shows the course: week and day, two sessions to do, and Breathe 20 min: ' + td.txt);
      // Breathe 20 min: your resonance pace from the test, 20 minutes
      await E(p, () => { window.__entrain.H.find = { at: Date.now(), best: 6, res: [] }; });
      await p.click('#tdRcGo'); await p.waitForTimeout(400);
      let b = await E(p, () => { const X = window.__entrain; return { v: location.hash, m: X.BC.minutes, inh: X.BC.inh, exh: X.BC.exh, pat: X.BC.pattern, len: document.querySelector('#bLen input:checked').value }; });
      ok(b.v === '#breathe' && b.m === 20 && b.inh === 5 && b.exh === 5 && b.pat === 'custom' && b.len === '20', 'Breathe 20 min opens Breathe at 6 a minute, the test\'s answer, for 20 minutes: ' + JSON.stringify(b));
      await E(p, () => { window.__entrain.H.find = null; });
      await go(p, 'home', 300);
      await p.click('#tdRcGo'); await p.waitForTimeout(400);
      b = await E(p, () => ({ pat: window.__entrain.BC.pattern, m: window.__entrain.BC.minutes }));
      ok(b.pat === 'resonance' && b.m === 20, 'and without a test, Resonance 5.5: ' + JSON.stringify(b));
      // sixteen days in: weeks with sensor readings, today one session done
      await course(p, 15, 2);
      const list = [];
      for (let d = 0; d < 7; d++) { list.push({ day: d - 15, h: 7, coh: 1.5, swing: 6 }); if (d < 6) list.push({ day: d - 15, h: 19, coh: 1.5, swing: 6 }); }
      for (let d = 7; d < 14; d++) list.push({ day: d - 15, h: 8, coh: 2, swing: 7.5, id: 'custom', rate: 6 });
      list.push({ day: -1, h: 7, k: 'practice', id: 'coherence', coh: 2.5, swing: 9, rate: undefined });
      list.push({ day: -1, h: 18, secs: 900, coh: 3, swing: 10 });              // 15 minutes: doesn't count
      list.push({ day: -16, h: 9 });                                              // before the course: doesn't count
      list.push({ day: 0, h: 7, coh: 2.5, swing: 9 });
      await seed(p, list);
      const st = await E(p, () => { const X = window.__entrain, s = X.rcStats(X.rcGet()); return { day: s.day, week: s.week, n: s.n, target: s.target, today: s.today.length, wk: s.weeks.slice(0, 3).map(w => [w.n, w.coh, w.sw]), full: s.full }; });
      ok(st.day === 15 && st.week === 3 && st.n === 22 && st.target === 112 && st.today === 1 && JSON.stringify(st.wk) === '[[13,1.5,6],[7,2,7.5],[2,2.5,9]]' && st.full === 6,
        'sixteen days in: week 3, 22 sessions counted, each week\'s sessions, coherence and swing, six days done in full: ' + JSON.stringify(st));
      await go(p, 'history', 300); await go(p, 'home', 400);
      td = await E(p, () => ({ txt: document.querySelector('#tdCourseBody').textContent.replace(/\s+/g, ' '), done: document.querySelectorAll('#tdCourseBody .rh-slot.done').length, now: document.querySelectorAll('#tdCourseBody .rh-slot.now').length }));
      ok(/^Week 3 of 8 · day 16 of 56/.test(td.txt) && /First 20 minutesDone at 07:00( AM)?: Resonance 5\.5 · coherence 2\.5 · swing 9\.0/.test(td.txt) && td.done === 1 && td.now === 1 && /1 of 2 today · 2 of 14 this week/.test(td.txt),
        'Today ticks off the morning\'s session, with its time, coherence and swing, and the second is next: ' + td.txt);
      await go(p, 'history', 500);
      const H = await E(p, () => {
        const s = document.querySelector('#rcourse');
        return { what: s.querySelector('.xp-what').textContent.replace(/\s+/g, ' '), charts: [...s.querySelectorAll('.rc-ch')].map(c => c.querySelector('.rc-cn').firstChild.textContent.trim() + ': ' + [...c.querySelectorAll('.rc-bar')].map(b => b.getAttribute('aria-label').replace(/^Week \d+: /, '')).join(', ')),
          rows: [...s.querySelectorAll('.rc-tbl tbody tr')].map(r => [...r.children].map(c => c.textContent.replace(/\s+/g, ' ').trim()).join(' / ')), lv: [...s.querySelectorAll('.rc-lv')].map(x => x.textContent), say: [...s.querySelectorAll('.xp-say li')].map(l => l.textContent), miss: s.querySelector('.xp-miss') ? s.querySelector('.xp-miss').textContent : '' };
      });
      ok(/Week 3 of 8, day 16 of 56: 22 of 112 sessions, 6 days in full\./.test(H.what), 'History: where the course stands: ' + H.what);
      ok(H.charts.length === 3 && H.charts[0] === 'Sessions each week, of 14: 13 of 14 sessions, 7 of 14 sessions, 2 of 14 sessions, to come, to come, to come, to come, to come' &&
        /^Coherence: coherence 1\.5, coherence 2\.0, coherence 2\.5, to come/.test(H.charts[1]) && /^Swing, beats a minute: swing 6\.0 beats a minute, swing 7\.5 beats a minute, swing 9\.0 beats a minute, to come/.test(H.charts[2]),
        'three small charts, each on its own scale, every bar named for screen readers: ' + H.charts.map(c => c.slice(0, 70)).join(' | '));
      ok(JSON.stringify(H.lv) === JSON.stringify(['· 2 in week 3', '· 2.5 in week 3', '· 9.0 in week 3']), 'each chart labels its latest week: ' + H.lv.join(' '));
      ok(H.rows.length === 3 && H.rows[0] === '1 / 13 / 1.5 13× / 6.0 bpm' && H.rows[2] === '3 / 2 / 2.5 2× / 9.0 bpm', 'and a table of the same numbers: ' + H.rows.join(' | '));
      ok(H.say.join(' | ') === 'Coherence 1.5 in week 1, 2.5 in week 3: rising. | Swing 6.0 beats a minute in week 1, 9.0 beats a minute in week 3: rising.' && /fit, the time of day, coffee and sleep/.test(H.miss),
        'it says how each has moved since the first week, and what else moves them: ' + H.say.join(' | '));
      await p.screenshot({ path: OUT + 'eyestest-f-weeks.png', fullPage: true });
      // once a day
      await p.click('#rcPer button[data-v="1"]'); await p.waitForTimeout(300);
      ok(await E(p, () => JSON.parse(localStorage.getItem('entrain.rcourse')).per === 1 && /22 of 56 sessions/.test(document.querySelector('#rcourse .xp-what').textContent)), 'Once a day sets 56 sessions in all');
      await go(p, 'home', 400);
      td = await E(p, () => ({ txt: document.querySelector('#tdCourseBody').textContent.replace(/\s+/g, ' '), go: !!document.querySelector('#tdRcGo') }));
      ok(/Today's 20 minutesDone at 07:00/.test(td.txt) && /1 of 1 today · 2 of 7 this week/.test(td.txt) && !td.go, 'and Today has one session a day, done: ' + td.txt);
      // ending it: two taps
      await go(p, 'history', 400);
      await p.click('#rcEnd'); await p.waitForTimeout(150);
      ok(await t(p, '#rcEnd') === 'Tap again to end it' && !JSON.parse(await E(p, () => localStorage.getItem('entrain.rcourse'))).end, 'End the course asks for a second tap');
      await p.click('#rcEnd'); await p.waitForTimeout(350);
      sec = await E(p, () => document.querySelector('#rcourse').textContent.replace(/\s+/g, ' '));
      ok(/Ended in week 3: 22 of 56 sessions/.test(sec) && await E(p, () => !!document.querySelector('#rcNew') && JSON.parse(localStorage.getItem('entrain.rcourse')).end > 0), 'then it ends, its weeks kept, with Start a new course: ' + sec.slice(0, 100));
      await go(p, 'home', 400);
      ok(/^Ended: 22 of 56 sessions\./.test(await t(p, '#tdCourseBody')), 'Today says it ended: ' + await t(p, '#tdCourseBody'));
      // eight weeks done; a week after, Today lets it go
      await course(p, 60, 2);
      await go(p, 'history', 300); await go(p, 'home', 400);
      ok(/^Done: 18 of 112 sessions, over eight weeks\./.test(await t(p, '#tdCourseBody')) && await E(p, () => !document.querySelector('#tdCourse').hidden), 'eight weeks on, Today says it\'s done: ' + await t(p, '#tdCourseBody'));
      await course(p, 70, 2);
      await go(p, 'history', 300);
      ok(/Done: 3 of 112 sessions/.test(await t(p, '#rcourse .xp-what')), 'History keeps it, with the three sessions that fall in its eight weeks now: ' + await t(p, '#rcourse .xp-what'));
      await go(p, 'home', 400);
      ok(await E(p, () => document.querySelector('#tdCourse').hidden), 'and a week after it ended, Today\'s card has gone');
      await go(p, 'history', 300);
      await p.click('#rcNew'); await p.waitForTimeout(300);
      ok(await E(p, () => !localStorage.getItem('entrain.rcourse') && !!document.querySelector('#rcGo')), 'Start a new course clears it for a new start');
      await p.context().close();
    }

    /* G. Learn, the route, search, Settings' list and a 360 px phone */
    if (!only || only === 'G') {
      const p = await page({}, { unlock: true, at: [10, 0] });
      await go(p, 'learn', 400);
      const L = await E(p, () => {
        const txt = id => { const e = document.getElementById(id); return e ? e.textContent.replace(/\s+/g, ' ') : ''; }, h = document.getElementById('l-eyes');
        let n = h && h.nextElementSibling, ps = [];
        while (n && n.tagName === 'P') { ps.push(n.textContent.replace(/\s+/g, ' ')); n = n.nextElementSibling; }
        const row = name => { const r = [...document.querySelectorAll('#lnGlance tr.ln-row')].find(r => r.querySelector('th b').textContent === name); return r ? [...r.children[2].querySelectorAll('a')].map(a => a.getAttribute('href')) : []; };
        return { h: h ? h.textContent : '', ps, gaze: txt('l-gaze'), course: txt('l-course'), toc: [...document.querySelectorAll('.toc a')].map(a => a.getAttribute('href')), eyes: row('Eyes closed'), res: row('Resonance breathing'),
          ref: [...document.querySelectorAll('#references li')].filter(li => /^Barry, R\. J\./.test(li.textContent)).map(li => li.textContent + ' ' + (li.querySelector('a') || {}).href),
          left: [...document.querySelectorAll('#l-leftout + ul li')].map(li => li.textContent.replace(/\s+/g, ' ')).join(' ') };
      });
      ok(L.h === 'Your eyes: closed, or resting on a point' && L.ps.length === 3 && /alpha rises within seconds/.test(L.ps[0]) && /\(Barry et al\., 2007\)/.test(L.ps[0]) && /hasn't been tested/.test(L.ps[1]) && L.toc.includes('#l-eyes'),
        'Learn: Your eyes, in the contents, with the eyes-closed effect cited and the cue\'s own limits: ' + L.ps[0].slice(0, 80));
      ok(/general practice rather than research/.test(L.gaze) && /not\s+researched/.test(L.gaze) && /blink when you need to/.test(L.gaze) && /gaze point/.test(L.left), 'a soft gaze, as general practice, not researched, and Left out says the same');
      ok(/no added\s+benefit over placebo breathing \(Fincham, Strauss & Cavanagh, 2023\)/.test(L.course) && /\(Lehrer et al\., 2000\)/.test(L.course) && /precautionary 20\s+minutes/.test(L.course), 'the course in How often, with the placebo trial and the cap: ' + L.course.slice(0, 80));
      ok(JSON.stringify(L.eyes) === JSON.stringify(['#l-eyes', '#practice/calm-reset', '#breathe', '#practice/anapana']) && L.res.includes('#rcourse'), 'the glance table links the eyes-closed cue and the course: ' + L.eyes.join(' ') + ' / ' + L.res.join(' '));
      ok(L.ref.length === 1 && /\(2007\)\. EEG differences between eyes-closed and eyes-open resting conditions\. Clinical Neurophysiology, 118\(12\), 2765–2773\. DOI https:\/\/doi\.org\/10\.1016\/j\.clinph\.2007\.07\.028$/.test(L.ref[0]),
        'Barry and colleagues\' 2007 study is in the references, with its DOI: ' + L.ref.join(''));
      // the route to the course lands on it in History
      await go(p, 'rcourse', 700);
      const land = await E(p, () => ({ v: !document.querySelector('#v-history').hidden, top: document.querySelector('#rcourse').getBoundingClientRect().top }));
      ok(land.v && land.top >= 60 && land.top < 300, '#rcourse opens History at the course, below the top bar: ' + JSON.stringify(land));
      // search
      await p.click('#tbFind'); await p.waitForTimeout(200);
      const found = [];
      for (const [w, h, n] of [['eyes closed', '#breathe', 'Eyes closed on Breathe'], ['gaze', '#breathe', 'Gaze point'], ['resonance course', '#rcourse', 'Resonance course'], ['close your eyes cue', '#l-eyes', 'Eyes-closed cue']]) {
        await p.fill('#fdIn', w); await p.waitForTimeout(300);
        found.push(await E(p, ([h, n]) => [...document.querySelectorAll('.fd-it')].some(a => a.getAttribute('href') === h && a.querySelector('b').textContent === n) ? n : '(none for ' + n + ')', [h, n]));
      }
      ok(found.every(f => !/^\(none/.test(f)), 'search finds them: ' + found.join(', '));
      await p.keyboard.press('Escape'); await p.waitForTimeout(200);
      // Settings lists what the donation opens
      await go(p, 'settings', 500);
      const list = await E(p, () => [...document.querySelectorAll('#supList a')].map(a => a.textContent + ' ' + a.getAttribute('href')));
      ok(NAMES.every(([n, h]) => list.includes(n + ' ' + h)), 'Settings\' New techniques lists all five, each with where it is: ' + list.filter(x => NAMES.some(([n]) => x.startsWith(n))).join(' | '));
      // a 360 px phone: the course on Today and in History, Breathe's settings, a practice's Options
      await course(p, 9, 2);
      await seed(p, [{ day: -9, h: 7, coh: 1.2, swing: 5 }, { day: -2, h: 7, coh: 2.2, swing: 8 }, { day: 0, h: 7 }]);
      await p.setViewportSize({ width: 360, height: 740 });
      const wide = [];
      for (const h of ['home', 'history', 'breathe', 'practice/calm-reset', 'practice/focus-primer', 'learn']) {
        await go(p, h, 450);
        if (h === 'breathe') await E(p, () => { const b = document.querySelector('#bAdjust'); if (b && b.offsetParent) b.click(); });
        await p.waitForTimeout(200);
        const w = await E(p, () => document.documentElement.scrollWidth - document.documentElement.clientWidth);
        if (w > 0) wide.push(h + ' ' + w);
        if (h === 'home') await p.screenshot({ path: OUT + 'eyestest-g-today.png', fullPage: true });
        if (h === 'breathe') await p.screenshot({ path: OUT + 'eyestest-g-breathe.png', fullPage: true });
      }
      ok(!wide.length, 'at 360 px nothing is wider than the screen: ' + (wide.join(', ') || 'Today, History, Breathe, two practices and Learn'));
      await go(p, 'home', 400);
      const tg = await E(p, () => [...document.querySelectorAll('#tdCourse a, #tdCourse button')].map(a => Math.round(a.getBoundingClientRect().height)));
      ok(tg.length >= 3 && tg.every(h => h >= 24) && await E(p, () => document.querySelector('#tdRcGo').getBoundingClientRect().height >= 44), 'its links are 24 px tall or more, and Breathe 20 min 44: ' + tg.join(', '));
      await p.context().close();
    }
  } catch (e) { log.push('ERROR ' + (e && e.stack || e)); }
  await browser.close();
  console.log(log.join('\n'));
  console.log(log.filter(l => l.startsWith('PASS')).length + ' passed, ' + log.filter(l => /^(FAIL|PAGEERROR|ERROR|CONSOLE)/.test(l)).length + ' problems');
  process.exitCode = log.some(l => /^(FAIL|PAGEERROR|ERROR|CONSOLE)/.test(l)) ? 1 : 0;
})();
