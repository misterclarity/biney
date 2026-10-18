// Regression checks for the October 2026 code review: each group reproduces a bug that was fixed.
// Run: node tests/regress.js [group letter]
const { chromium, APP, ROOT } = require('./pw');
const fs = require('fs'), path = require('path'), os = require('os'), { spawnSync } = require('child_process');
const S20 = 'Mozilla/5.0 (Linux; Android 13; SM-G988B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Mobile Safari/537.36';
const mock = require('./sensor-mock');
const only = process.argv[2] || '';
const t = (p, s) => p.$eval(s, e => e.textContent.trim()).catch(() => '(missing)');
const T = p => p.evaluate(() => { const P = window.__entrain.P; return P.state === 'running' ? performance.now() / 1000 - P.t0 : P.st; });
const step = p => p.evaluate(() => { const P = window.__entrain.P; const s = P.steps[P.idx]; return s ? s.title : ''; });
const E = (p, f, a) => p.evaluate(f, a);
const NP = p => E(p, () => window.__entrain.NP());
async function until(p, secs, max = 240000) { const t0 = Date.now(); while (Date.now() - t0 < max) { if (await T(p) >= secs) return true; await p.waitForTimeout(80); } return false; }
async function untilStep(p, re, max = 120000) { const t0 = Date.now(); while (Date.now() - t0 < max) { if (re.test(await step(p))) return true; await p.waitForTimeout(80); } return false; }
async function jumpTo(p, re) { for (let i = 0; i < 60; i++) { if (re.test(await step(p))) return true; if (await p.$eval('#sNext', b => b.disabled)) return false; await p.click('#sNext'); await p.waitForTimeout(60); } return false; }
const endNow = p => p.evaluate(() => { const b = document.querySelector('#sEnd'); b.click(); b.click(); });   // the two-tap End, faster than a sped-up clock
(async () => {
  const browser = await chromium.launch();
  const log = []; const ok = (c, m) => log.push((c ? 'PASS ' : 'FAIL ') + m);
  const page = async (opts, st, desk, from) => {
    const ctx = from ? from.ctx : await browser.newContext(desk ? { viewport: { width: 1280, height: 900 } } : { userAgent: S20, viewport: { width: 412, height: 915 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    const p = await ctx.newPage();
    if (from) await p.addInitScript(o => { for (const k in o) localStorage.setItem(k, o[k]); }, from.snap);
    p.on('pageerror', e => log.push('PAGEERROR ' + e.message));
    p.on('console', m => { if (m.type() === 'error') log.push('CONSOLE ' + m.text()); });
    await p.addInitScript(s => {
      localStorage.setItem('entrain.debug', '1'); localStorage.setItem('entrain.stereo', 'ok');
      for (const k in s) localStorage.setItem('entrain.' + k, s[k]);
      if (window.speechSynthesis) { speechSynthesis.speak = () => {}; speechSynthesis.cancel = () => {}; }
    }, st || {});
    if (opts) await p.addInitScript(mock, opts);
    await p.goto(APP);
    return p;
  };
  const OPT = (o) => ({ pOpt: JSON.stringify(Object.assign({ voice: false, bells: true, cues: 'tones', visual: 'circle', audio: false, voiceName: '', ana: 180, rhythm: true }, o || {})) });
  /* Close the app and open it again with what it had stored. Headless Chromium sometimes loses a
     file:// page's storage across a reload (everything, not only the latest writes), so this copies
     the stored values over instead of trusting the reload. */
  const reopen = async (p, st) => {
    const snap = await p.evaluate(() => { const o = {}; for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); o[k] = localStorage.getItem(k); } return o; });
    const ctx = p.context();
    await p.close();
    return page(null, st, false, { ctx, snap });
  };
  const playTrack = async (p, id) => {
    await p.evaluate(() => location.hash = 'sounds'); await p.waitForTimeout(200);
    await p.click('.card[data-id="' + id + '"] .play-btn'); await p.waitForTimeout(600);
  };
  try {
    /* A. the mini player's progress ring fills (a second CIRC used to replace its length) */
    if (!only || only === 'A') {
      const p = await page(null, OPT());
      await playTrack(p, 'theta-meditation'); await p.waitForTimeout(1200);
      const off = await p.$eval('#ring', e => parseFloat(e.style.strokeDashoffset));
      ok(off > 170 && off < 175.85, 'progress ring moves while a track plays: dash offset ' + off);
      await p.close();
    }

    /* B. keyboard shortcuts leave focused controls alone */
    if (!only || only === 'B') {
      const p = await page(null, OPT());
      await playTrack(p, 'theta-meditation'); await p.click('#stop'); await p.waitForTimeout(400);
      await p.evaluate(() => location.hash = 'practice/nvc-self'); await p.waitForTimeout(250);
      await p.click('#sGo'); await p.waitForTimeout(300);
      await jumpTo(p, /^Feelings$/); await p.waitForTimeout(300);
      await p.focus('.nv-wheel .wf[data-fam="6"]'); await p.keyboard.press('Space'); await p.waitForTimeout(400);
      const b1 = await E(p, () => ({ state: window.__entrain.P.state, zoom: window.__entrain.P.wheel.feel, a: window.__entrain.A.playing }));
      ok(b1.state === 'running' && b1.zoom === 6 && !b1.a, 'Space on a wheel family opens it and nothing else: practice ' + b1.state + ', family ' + b1.zoom + ', old track playing=' + b1.a);
      const i0 = await E(p, () => window.__entrain.P.idx);
      await p.focus('.sw-view button[data-view="list"]'); await p.keyboard.press('ArrowRight'); await p.waitForTimeout(300);
      ok(await E(p, () => window.__entrain.P.idx) === i0, 'ArrowRight on a focused button stays on the step: ' + await step(p));
      await p.evaluate(() => document.activeElement.blur());
      const ta = await T(p);
      await p.keyboard.press('ArrowRight'); await p.waitForTimeout(300);
      const tb = await T(p);
      ok(/^Needs$/.test(await step(p)) && tb - ta < 2, 'ArrowRight with nothing focused moves on, without jumping the clock: ' + await step(p) + ', ' + ta.toFixed(1) + ' → ' + tb.toFixed(1) + ' s');
      await p.close();

      const q = await page(null, OPT({ audio: true }));
      await q.evaluate(() => location.hash = 'practice/calm-reset'); await q.waitForTimeout(250);
      await q.click('#sGo'); await q.waitForTimeout(2500);
      await q.evaluate(() => document.activeElement && document.activeElement.blur());
      await q.keyboard.press('Space'); await q.waitForTimeout(400);
      const m = await E(q, () => ({ P: window.__entrain.P.state, A: window.__entrain.A.playing }));
      await q.click('#sPlay'); await q.waitForTimeout(2500);
      const n = await E(q, () => ({ P: window.__entrain.P.state, A: window.__entrain.A.playing }));
      ok(m.P === 'paused' && !m.A && n.P === 'running' && n.A, 'Space pauses a program and its sound; the Resume button brings both back (sound ' + m.A + ' → ' + n.A + ')');
      await q.evaluate(() => location.hash = 'learn'); await q.waitForTimeout(300);
      await q.evaluate(() => document.activeElement && document.activeElement.blur());
      await q.keyboard.press('Space'); await q.waitForTimeout(400);
      const o = await E(q, () => ({ P: window.__entrain.P.state, A: window.__entrain.A.playing }));
      await q.keyboard.press('Space'); await q.waitForTimeout(2500);
      const r = await E(q, () => ({ P: window.__entrain.P.state, A: window.__entrain.A.playing }));
      ok(o.P === 'paused' && !o.A && r.P === 'running' && r.A, 'on another view, Space pauses and resumes the whole program, not just its sound');
      await q.close();
    }

    /* C. a rating you come back to can be changed or cleared */
    if (!only || only === 'C') {
      const p = await page(null, OPT());
      await p.evaluate(() => location.hash = 'practice/tapping'); await p.waitForTimeout(250);
      await p.click('#sGo'); await p.waitForTimeout(300);
      await jumpTo(p, /^How strong is it\?$/); await p.waitForTimeout(200);
      await p.click('#sRateG button[data-v="6"]'); await p.waitForTimeout(800);
      const s1 = await step(p);
      await p.click('#sPrev'); await p.waitForTimeout(300);
      const pressed = await p.$eval('#sRateG button[aria-pressed="true"]', b => b.dataset.v).catch(() => 'none');
      await p.click('#sRateG button[data-v="3"]'); await p.waitForTimeout(800);
      const s2 = await step(p), suds = await E(p, () => window.__entrain.P.suds);
      ok(s1 === 'Set-up' && pressed === '6' && s2 === 'Set-up' && JSON.stringify(suds) === '[3]', 'back on a rating: it shows ' + pressed + ', a new tap replaces it and moves on: ' + s2 + ', ratings ' + JSON.stringify(suds));
      await p.click('#sPrev'); await p.waitForTimeout(300);
      await p.click('#sRateSkip'); await p.waitForTimeout(400);
      ok(await step(p) === 'Set-up' && JSON.stringify(await E(p, () => window.__entrain.P.suds)) === '[]', 'Skip on a revisited rating clears it and moves on');
      await p.close();
    }

    /* D. Next on an open step ends it now instead of jumping the clock to its limit */
    if (!only || only === 'D') {
      const p = await page(null, OPT());
      for (const [id, re, conf] of [['power-nap', /^Nap$/], ['nvc-self', /^What happened\?$/], ['wim-hof', /hold$/, true]]) {
        await p.evaluate(id => location.hash = 'practice/' + id, id); await p.waitForTimeout(250);
        if (conf) await p.check('#sOk');
        await p.click('#sGo'); await p.waitForTimeout(300);
        await jumpTo(p, re); await p.waitForTimeout(1500);
        const a = await T(p), s0 = await step(p);
        await p.click('#sNext'); await p.waitForTimeout(300);
        const b = await T(p), s1 = await step(p);
        await endNow(p); await p.waitForTimeout(400);
        const tile = await p.$$eval('.sd-t', x => x.map(e => e.textContent)[0]);
        const secs = tile ? tile.match(/(\d\d):(\d\d)/).slice(1).reduce((m, s) => m * 60 + +s) : 1e9;
        ok(b - a < 2 && s1 !== s0 && Math.abs(secs - b) < 3, id + ': Next on "' + s0 + '" moved to "' + s1 + '" at ' + a.toFixed(0) + ' → ' + b.toFixed(0) + ' s; summary ' + tile);
      }
      await p.close();
    }

    /* E. a nap ended early counts only the sleep before you ended it */
    if (!only || only === 'E') {
      const p = await page({ speed: 30, rr: true }, OPT());
      await p.click('#tbSensor'); await p.waitForTimeout(200); await p.click('#hrConnect'); await p.waitForTimeout(600);
      await p.evaluate(() => location.hash = 'practice/power-nap'); await p.waitForTimeout(250);
      await p.click('.si-len button[data-len="20"]'); await p.waitForTimeout(200);
      await p.click('#sGo'); await p.waitForTimeout(300);
      await untilStep(p, /^Nap$/);
      await until(p, 45 + 175);
      await p.evaluate(() => window.__hrBase = 57);
      let asleep = false; for (let i = 0; i < 120 && !asleep; i++) { await p.waitForTimeout(250); asleep = !!(await NP(p)).onset; }
      const on = (await NP(p)).onset;
      await p.waitForTimeout(3000);
      const tEnd = await T(p);
      await endNow(p); await p.waitForTimeout(600);
      const tiles = await p.$$eval('.sd-t', x => x.map(e => e.textContent));
      const nap = tiles.filter(x => /^Nap\d+ min/.test(x))[0] || '', mins = parseInt(nap.slice(3), 10), real = (tEnd - on) / 60;
      ok(asleep && Math.abs(mins - real) <= 1, 'ended ' + real.toFixed(1) + ' min after dozing off; summary: ' + nap);
      const home = await E(p, () => JSON.parse(localStorage.getItem('entrain.lastSummary')).text);
      ok(new RegExp('about ' + mins + ' min of sleep').test(home), 'the Home summary agrees: ' + home.slice(0, 120));
      await p.close();
    }

    /* F. the 20-minute no-sleep cut-off waits while a drop in heart rate is being confirmed */
    if (!only || only === 'F') {
      const p = await page({ speed: 30, rr: true }, OPT());
      await p.click('#tbSensor'); await p.waitForTimeout(200); await p.click('#hrConnect'); await p.waitForTimeout(600);
      await p.evaluate(() => location.hash = 'practice/power-nap'); await p.waitForTimeout(250);
      await p.click('.si-len button[data-len="10"]'); await p.waitForTimeout(200);
      await p.click('#sGo'); await p.waitForTimeout(300);
      await untilStep(p, /^Nap$/);
      await until(p, 45 + 1080);                                   // 18 minutes in, still awake
      await p.evaluate(() => window.__hrBase = 57);                 // now dozing off
      await until(p, 45 + 1230);                                    // past the 20-minute mark
      const mid = await E(p, () => { const N = window.__entrain.NP(), P = window.__entrain.P; return { since: N.since ? Math.round(N.since - P.steps[1].at) : 0, step: P.steps[P.idx].title }; });
      ok(mid.step === 'Nap' && mid.since > 1000, 'not woken at 20 min while a drop from ' + mid.since + ' s is being confirmed: still "' + mid.step + '"');
      let asleep = false; for (let i = 0; i < 160 && !asleep; i++) { await p.waitForTimeout(250); asleep = !!(await NP(p)).onset; }
      ok(asleep, 'the drop is confirmed as dozing off');
      await untilStep(p, /^Waking up$/, 120000);
      const w = await E(p, () => { const N = window.__entrain.NP(), P = window.__entrain.P; return Math.round(P.steps[2].at - N.onset); });
      ok(Math.abs(w - 600) <= 3, 'woken a 10-minute nap after the estimated onset (' + w + ' s)');
      await p.close();
    }

    /* G. the build refuses a name declared twice in the shared scope */
    if (!only || only === 'G') {
      const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'entrain-build-'));
      fs.mkdirSync(path.join(tmp, 'src')); fs.mkdirSync(path.join(tmp, 'icons'));
      for (const f of fs.readdirSync(path.join(ROOT, 'src'))) fs.copyFileSync(path.join(ROOT, 'src', f), path.join(tmp, 'src', f));
      for (const f of fs.readdirSync(path.join(ROOT, 'icons'))) fs.copyFileSync(path.join(ROOT, 'icons', f), path.join(tmp, 'icons', f));
      fs.appendFileSync(path.join(tmp, 'src', 'yoga.js'), '\n  var CIRC = 1;\n');
      const r = spawnSync('python3', [path.join(tmp, 'src', 'build.py')], { encoding: 'utf8' });
      ok(r.status !== 0 && /CIRC: legacy\.html; yoga\.js/.test(r.stderr), 'build stops on a name declared twice: ' + r.stderr.trim().split('\n').join(' / '));
      fs.rmSync(tmp, { recursive: true, force: true });
    }

    /* H. an unfinished reflection survives the page going away, and only when you've written something */
    if (!only || only === 'H') {
      const KEY = 'entrain.nvcDraft.nvc-self', draft = p => p.evaluate(k => JSON.parse(localStorage.getItem(k) || 'null'), KEY);
      let p = await page(null, OPT());
      await p.evaluate(() => location.hash = 'practice/nvc-self'); await p.waitForTimeout(250);
      await p.click('#sGo'); await p.waitForTimeout(300);
      await jumpTo(p, /^What happened\?$/); await p.waitForTimeout(600);
      ok(await draft(p) === null, 'nothing is kept before you write');
      await p.fill('.sw-ta', 'At dinner she looked at her phone while I talked.'); await p.waitForTimeout(100);
      await p.click('[data-sw="next"]'); await p.waitForTimeout(300);
      await p.fill('.sw-ta', 'She never listens.'); await p.waitForTimeout(700);
      const d1 = await draft(p);
      ok(d1 && d1.idx === 2 && /phone/.test(d1.nvc.obs) && d1.nvc.judg === 'She never listens.', 'the draft follows your writing and your step: ' + (d1 && d1.titles[d1.idx]));
      const t1 = await T(p);
      p = await reopen(p, OPT()); await p.waitForTimeout(1700);
      ok(/unfinished reflection/.test(await t(p, '#toastTxt')) && await t(p, '#toastAct') === 'Open', 'opening the app again, it says so: "' + await t(p, '#toastTxt') + '"');
      await p.click('#toastAct'); await p.waitForTimeout(400);
      ok(/unfinished reflection/.test(await t(p, '.si-draft')) && /The judgments/.test(await t(p, '.si-draft')), 'the practice page offers it: ' + await t(p, '.si-draft p'));
      await p.click('#sDraftGo'); await p.waitForTimeout(500);
      const ta = await p.$eval('.sw-ta', e => e.value).catch(() => '');
      const t2 = await T(p);
      ok(await step(p) === 'The judgments' && ta === 'She never listens.' && Math.abs(t2 - t1) < 5, 'Continue it opens "' + await step(p) + '" with your words, at ' + t2.toFixed(0) + ' s (left at ' + t1.toFixed(0) + ' s)');
      await p.evaluate(() => { const P = window.__entrain.P; P.t0 -= P.total; }); await p.waitForTimeout(800);
      const sent = await t(p, '.sd-nvc .nv-s');
      ok(/When at dinner she looked at her phone while I talked/.test(sent) && await draft(p) === null, 'the finished reflection keeps the earlier writing and the draft is gone: ' + sent.slice(0, 70));
      // Discard: two taps
      await p.click('#sdAgain'); await p.waitForTimeout(250);
      await p.click('#sGo'); await p.waitForTimeout(300);
      await jumpTo(p, /^What happened\?$/); await p.fill('.sw-ta', 'Something else.'); await p.waitForTimeout(700);
      p = await reopen(p, OPT()); await p.waitForTimeout(400);
      await p.evaluate(() => location.hash = 'practice/nvc-self'); await p.waitForTimeout(300);
      await p.click('#sDraftDel'); await p.waitForTimeout(200);
      const armed = await t(p, '#sDraftDel');
      await p.click('#sDraftDel'); await p.waitForTimeout(300);
      ok(armed === 'Tap again to discard' && await draft(p) === null && !(await p.$('.si-draft')), 'Discard takes a second tap, then the draft is gone');
      // From Should to Choose: the cards' answers come back too
      await p.evaluate(() => location.hash = 'practice/nvc-choose'); await p.waitForTimeout(250);
      await p.click('#sGo'); await p.waitForTimeout(300);
      await jumpTo(p, /^I have to/); await p.fill('.sw-ta', 'Answer every email the same day\nGo to the gym'); await p.waitForTimeout(100);
      await p.click('[data-sw="next"]'); await p.waitForTimeout(300);
      await p.click('.sw-card[data-i="1"] button[data-ch="0"]'); await p.fill('.sw-card[data-i="0"] .sw-in', 'calm mornings'); await p.waitForTimeout(700);
      p = await reopen(p, OPT()); await p.waitForTimeout(400);
      await p.evaluate(() => location.hash = 'practice/nvc-choose'); await p.waitForTimeout(300);
      await p.click('#sDraftGo'); await p.waitForTimeout(500);
      const no = await p.$eval('.sw-card[data-i="1"] button[data-ch="0"]', e => e.getAttribute('aria-pressed')).catch(() => '?'), why = await p.$eval('.sw-card[data-i="0"] .sw-in', e => e.value).catch(() => '?');
      ok(await step(p) === 'I choose to…' && no === 'true' && why === 'calm mornings', 'a From Should to Choose draft keeps each card\'s answer');
      await p.close();
      // keeping nothing means no draft either
      const q = await page(null, OPT({ nvcSave: false }));
      await q.evaluate(() => location.hash = 'practice/nvc-self'); await q.waitForTimeout(250);
      await q.click('#sGo'); await q.waitForTimeout(300);
      await jumpTo(q, /^What happened\?$/); await q.fill('.sw-ta', 'Not kept.'); await q.waitForTimeout(700);
      ok(await draft(q) === null, 'with Keep a copy off, no draft is kept');
      await q.close();
    }

    /* I. a step's own buttons carry on from a pause */
    if (!only || only === 'I') {
      const p = await page(null, OPT());
      await p.evaluate(() => location.hash = 'practice/nvc-self'); await p.waitForTimeout(250);
      await p.click('#sGo'); await p.waitForTimeout(300);
      await jumpTo(p, /^What happened\?$/);
      await p.click('#sPlay'); await p.waitForTimeout(200);
      const paused = await E(p, () => window.__entrain.P.state);
      await p.click('[data-sw="next"]'); await p.waitForTimeout(300);
      ok(paused === 'paused' && await E(p, () => window.__entrain.P.state) === 'running' && await step(p) === 'The judgments', 'Continue while paused carries on: ' + await step(p));
      await p.evaluate(() => location.hash = 'practice/tapping'); await p.waitForTimeout(250);
      await p.click('#sGo'); await p.waitForTimeout(300);
      await jumpTo(p, /^How strong is it\?$/);
      await p.click('#sPlay'); await p.waitForTimeout(200);
      await p.click('#sRateG button[data-v="5"]'); await p.waitForTimeout(800);
      ok(await step(p) === 'Set-up' && JSON.stringify(await E(p, () => window.__entrain.P.suds)) === '[5]', 'a rating while paused counts and carries on');
      await p.close();
    }

    /* J. while a practice uses the breathing guide, its controls are out of reach of the keyboard too */
    if (!only || only === 'J') {
      const p = await page(null, OPT(), true);
      await p.evaluate(() => location.hash = 'practice/calm-reset'); await p.waitForTimeout(250);
      await p.click('#sGo'); await p.waitForTimeout(300);
      await jumpTo(p, /^Cyclic sighs$/); await p.waitForTimeout(400);
      await p.evaluate(() => location.hash = 'breathe'); await p.waitForTimeout(400);
      const inh = await E(p, () => window.__entrain.BC.inh);
      await p.focus('#bInh').catch(() => {});
      const foc = await p.evaluate(() => document.activeElement && document.activeElement.id);
      await p.keyboard.press('ArrowRight'); await p.keyboard.press('ArrowRight'); await p.waitForTimeout(200);
      ok(foc !== 'bInh' && await E(p, () => window.__entrain.BC.inh) === inh, 'the inhale slider takes no focus or keys while locked (inhale stays ' + inh + ' s)');
      await p.click('#bLockBtn'); await p.waitForTimeout(300);
      await endNow(p); await p.waitForTimeout(400);
      await p.evaluate(() => location.hash = 'breathe'); await p.waitForTimeout(300);
      await p.focus('#bInh');
      ok(await p.evaluate(() => document.activeElement.id) === 'bInh', 'after the practice the guide is yours again');
      await p.close();
    }

    /* K. waking up: the chimes are on the audio clock from the start, the vibration comes once per cue */
    if (!only || only === 'K') {
      const p = await page(null, OPT());
      await p.addInitScript(() => {
        window.__vib = []; navigator.vibrate = () => { window.__vib.push(1); return true; };
        window.__starts = []; const st = OscillatorNode.prototype.start;
        OscillatorNode.prototype.start = function (w) { window.__starts.push(w || 0); return st.apply(this, arguments); };
      });
      await p.reload(); await p.waitForTimeout(300);
      await p.evaluate(() => location.hash = 'practice/power-nap'); await p.waitForTimeout(250);
      await p.click('.si-len button[data-len="10"]'); await p.waitForTimeout(200);
      await p.click('#sGo'); await p.waitForTimeout(300);
      await jumpTo(p, /^Nap$/); await p.waitForTimeout(300);
      await p.evaluate(() => { window.__starts = []; window.__vib = []; });
      await p.click('#sNext'); await p.waitForTimeout(600);
      const sched = await p.evaluate(() => { const ctx = window.__entrain.A.ctx, w = [...new Set(window.__starts.map(x => Math.round(x * 10) / 10))].sort((a, b) => a - b); return { w, now: ctx.currentTime }; });
      const gaps = sched.w.slice(1).map((x, i) => Math.round(x - sched.w[i]));
      ok(await step(p) === 'Waking up' && sched.w.length === 6 && gaps.every(g => g === 8), 'all six chimes scheduled as the step starts, 8 s apart: ' + gaps.join(', '));
      const n0 = await E(p, () => window.__vib.length);
      const seg = async (st) => {
        await p.evaluate((st) => { const P = window.__entrain.P, s = P.steps[P.idx]; window.__vib = []; P.t0 = performance.now() / 1000 - (s.at + st); }, st);
        await p.waitForTimeout(900);
        return E(p, () => window.__vib.length);
      };
      const n30 = await seg(29.6), n60 = await seg(59.6);
      ok(n0 === 1 && n30 === 1 && n60 === 1, 'one vibration at the start, 30 s and 60 s: ' + n0 + ', ' + n30 + ', ' + n60);
      await p.evaluate(() => { const P = window.__entrain.P, s = P.steps[P.idx]; P.t0 = performance.now() / 1000 - (s.at + 10); });
      await p.click('#sPlay'); await p.waitForTimeout(200);
      const rung = await E(p, () => window.__entrain.NP().rung);
      ok(await E(p, () => window.__entrain.NP().wg === null) && rung >= 1 && rung < 6, 'pausing silences the chimes still to come (' + rung + ' had rung)');
      await p.evaluate(() => { window.__starts = []; });
      await p.click('#sPlay'); await p.waitForTimeout(400);
      const again = await p.evaluate(() => new Set(window.__starts.map(x => Math.round(x * 10) / 10)).size);
      ok(again === 6 - rung, 'resuming brings back only the ones that hadn\'t rung: ' + again);
      await p.close();
    }

    /* L. tapping after a program: no "Sound paused" once the program's sound has ended as planned */
    if (!only || only === 'L') {
      const p = await page(null, Object.assign(OPT({ audio: true }), { 'pTap.calm-reset': '1' }));
      await p.evaluate(() => location.hash = 'practice/calm-reset'); await p.waitForTimeout(250);
      await p.click('#sGo'); await p.waitForTimeout(500);
      await jumpTo(p, /^Tapping$/); await p.waitForTimeout(9000);
      const chip = await t(p, '#sLive');
      ok(!/Sound paused/.test(chip), 'during the tapping round the live chips read: "' + chip + '"');
      await p.close();
    }

    /* M. Copy says what happened when the clipboard is refused */
    if (!only || only === 'M') {
      const p = await page(null, OPT());
      await p.evaluate(() => location.hash = 'practice/nvc-self'); await p.waitForTimeout(250);
      await p.click('#sGo'); await p.waitForTimeout(300);
      await jumpTo(p, /^What happened\?$/); await p.fill('.sw-ta', 'She looked at her phone while I talked.'); await p.waitForTimeout(100);
      await p.evaluate(() => { const P = window.__entrain.P; P.t0 -= P.total; }); await p.waitForTimeout(800);
      await p.click('#nvCopy'); await p.waitForTimeout(500);
      const lab = await t(p, '#nvCopy');
      ok(lab === 'Copied' || (lab === "Couldn't copy" && /didn't allow copying/.test(await t(p, '#toastTxt'))), 'without clipboard permission the button reads "' + lab + '"');
      await p.close();
    }

    /* N. no work for nothing: the canvas rests on still steps, the play button isn't rebuilt every tick */
    if (!only || only === 'N') {
      const p = await page(null, OPT());
      await p.evaluate(() => location.hash = 'practice/nvc-self'); await p.waitForTimeout(250);
      await p.click('#sGo'); await p.waitForTimeout(300);
      await jumpTo(p, /^What happened\?$/); await p.waitForTimeout(500);
      const writing = await E(p, () => window.__entrain.P.raf);
      const muts = await p.evaluate(() => new Promise(r => { let n = 0; const o = new MutationObserver(m => { n += m.length; }); o.observe(document.querySelector('#sPlay'), { childList: true, subtree: true, attributes: true }); setTimeout(() => { o.disconnect(); r(n); }, 1500); }));
      await p.evaluate(() => location.hash = 'practice/calm-reset'); await p.waitForTimeout(250);
      await p.click('#sGo'); await p.waitForTimeout(300);
      await jumpTo(p, /^Cyclic sighs$/); await p.waitForTimeout(500);
      const breathing = await E(p, () => window.__entrain.P.raf);
      ok(writing === 0 && breathing !== 0, 'canvas loop off while writing, on while breathing (' + writing + ', ' + breathing + ')');
      ok(muts === 0, 'the play button is left alone while nothing changes (' + muts + ' changes in 1.5 s)');
      await p.close();
    }
  } catch (e) { log.push('ERROR ' + e.message); }
  console.log(log.join('\n'));
  console.log(log.filter(l => l.startsWith('PASS')).length + ' passed, ' + log.filter(l => /^(FAIL|PAGEERROR|ERROR|CONSOLE)/.test(l)).length + ' problems');
  await browser.close();
})();
