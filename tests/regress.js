// Regression checks for the October 2026 code review: each group reproduces a bug that was fixed.
// O to R cover the requests that followed: Anapana's narrowing focus, wording, the screen lock and search.
// S to V cover the second review: goals for everything, the library, the small fixes, the practice page and Settings.
// Run: node tests/regress.js [group letter]
const { chromium, APP, ROOT } = require('./pw');
const fs = require('fs'), path = require('path'), os = require('os'), { spawnSync } = require('child_process');
const S20 = 'Mozilla/5.0 (Linux; Android 13; SM-G988B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Mobile Safari/537.36';
const mock = require('./sensor-mock');
const only = process.argv[2] || '';
const opts = async p => { if (await p.$eval('#sOpts', e => e.hidden).catch(() => false)) { await p.click('#sOptsBtn'); await p.waitForTimeout(60); } };   // options are folded by default
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
      ok(Math.abs(w - 600) <= 7, 'woken a 10-minute nap after the estimated onset (' + w + ' s)');   // one 200 ms tick is 6 s at this speed
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

    /* O. Anapana narrows from the whole triangle to the small dimple, and sits for an hour */
    if (!only || only === 'O') {
      const p = await page(null, OPT());
      const plans = await E(p, () => {
        const X = window.__entrain, d = X.pDef('anapana'), out = {};
        d.lengths.forEach(L => {
          const pl = X.pPlan(d, L), obs = pl.steps.filter(s => s.wander);
          out[L] = { total: pl.total, titles: obs.map(s => s.title), zones: obs.map(s => s.zone), secs: obs.map(s => s.secs),
            gaps: obs.map(s => s.lines.slice(1).map((l, i) => l[0] - s.lines[i][0])), first: obs[0].lines[0][1], last: obs[obs.length - 1].lines[0][1] };
        });
        return { lengths: d.lengths, out };
      });
      const P5 = plans.out[5], P10 = plans.out[10], P60 = plans.out[60];
      ok(plans.lengths.join() === '5,10,20,30,60' && P60.total === 3600, 'Anapana offers 5 to 60 minutes; the hour is ' + P60.total + ' s');
      ok(P5.zones.join() === '0,3,4' && P10.zones.join() === '0,1,3,4' && plans.out[20].zones.join() === '0,1,2,3,4' && P60.zones.join() === '0,1,2,3,4',
        'the area narrows in order: ' + P60.titles.join(' → '));
      ok(/triangle from the top of your nose down to the two corners of your upper lip/.test(P60.first) && /small dimple just beneath the ridge between the nostrils/.test(P60.last),
        'starts on the whole triangle, ends on the dimple: "' + P60.last.slice(0, 60) + '…"');
      ok(P60.secs[4] > P60.secs[0] * 1.3, 'the last, smallest area gets the most time (' + P60.secs.join(', ') + ' s)');
      const g60 = [].concat(...P60.gaps), g10 = [].concat(...P10.gaps);
      ok(g60.length && g60.every(g => g === 300) && g10.every(g => g === 90), 'reminders every 5 min in the hour, every 90 s in 10 min');
      // live: the drawing follows the area, and Mind wandered names it
      await p.evaluate(() => location.hash = 'practice/anapana'); await p.waitForTimeout(250);
      await p.click('#sGo'); await p.waitForTimeout(250);
      await jumpTo(p, /^The whole triangle$/);
      const z0 = await E(p, () => ({ fig: !document.querySelector('#sFig').hidden, vis: document.querySelector('#sStage').dataset.vis, pt: !!document.querySelector('#sFig .zn.pt'), zn: !!document.querySelector('#sFig .zn') }));
      await p.click('#sTap'); await p.waitForTimeout(120);
      const fb = await t(p, '#sLine');
      await jumpTo(p, /^The small dimple$/);
      const z4 = await E(p, () => ({ pt: !!document.querySelector('#sFig .zn.pt'), ring: !!document.querySelector('#sFig .zn-ring') }));
      ok(z0.fig && z0.vis === 'face' && z0.zn && !z0.pt && z4.pt && z4.ring, 'the face drawing shades the triangle, then marks the dimple');
      ok(/Back to the triangle/.test(fb), 'Mind wandered brings you back to the area you are on: "' + fb + '"');
      await endNow(p); await p.close();
    }

    /* P. guidance says what to do: no "don't", "nothing", "never" or "feel the breath" in what's spoken or shown */
    if (!only || only === 'P') {
      const p = await page(null, OPT());
      const bad = await E(p, () => {
        const X = window.__entrain, seen = [], add = (src, x) => { if (typeof x === 'string' && x.trim()) seen.push([src, x]); };
        const RE = /n't\b|\b(do not|never|nothing|without|stop|avoid|none)\b|feel the breath/i;
        const ids = [...document.querySelectorAll('.pc-a')].map(a => a.getAttribute('href').replace('#practice/', '')).filter(x => x && x[0] !== '#');
        ids.forEach(id => {
          const d = X.pDef(id); if (!d) return;
          (d.lengths || [0]).forEach(L => (d.variant ? d.variant.opts.map(o => o[0]) : [undefined]).forEach(v => {
            if (v !== undefined) localStorage.setItem('entrain.pVar.' + id, String(v));
            X.pPlan(d, L).steps.forEach(s => {
              (s.mkLines ? s.mkLines() : s.lines).forEach(l => add(id + ' / ' + s.title, l[1]));
              add(id + ' / title', s.title); add(id + ' / prompt', s.prompt); add(id + ' / hint', s.hint);
              if (s.hints) Object.values(s.hints).forEach(h => add(id + ' / hint', h));
            });
          }));
          add(id + ' / blurb', d.blurb); add(id + ' / end', d.end);
        });
        Object.values(X.ASANA).forEach(a => a.cues.forEach(c => add('pose ' + a.id, c)));
        X.QUOTES.forEach(q => { if (!q[1]) add('quote', q[0]); });     // Entrain's own lines; quoted authors stay as written
        return { n: seen.length, bad: seen.filter(x => RE.test(x[1])).map(x => x[0] + ': ' + x[1]) };
      });
      ok(bad.n > 800 && bad.bad.length === 0, bad.n + ' spoken and shown lines checked; worded as what to do' + (bad.bad.length ? ': ' + bad.bad.slice(0, 4).join(' | ') : ''));
      await p.close();
    }

    /* Q. the screen stays on and at full brightness through every kind of session */
    if (!only || only === 'Q') {
      const p = await page(null, OPT());
      const W = () => E(p, () => window.__wl.held);
      await p.evaluate(() => location.hash = 'practice/body-scan'); await p.waitForTimeout(250);
      await p.click('#sGo'); await p.waitForTimeout(300);
      const run = await W();
      await p.click('#sPlay'); await p.waitForTimeout(200);
      const paused = await W();
      await E(p, () => { window.__entrain.WL.stop = Date.now() - 601000; window.__entrain.wlSync(); }); await p.waitForTimeout(100);
      const later = await W();
      await p.click('#sPlay'); await p.waitForTimeout(200);
      const back = await W();
      await endNow(p); await p.waitForTimeout(300);
      ok(run === 1 && paused === 1 && later === 0 && back === 1 && await W() === 0, 'practice: on while running, kept 10 min into a pause, off once it ends (' + [run, paused, later, back].join(' ') + ')');
      await p.evaluate(() => location.hash = 'breathe'); await p.waitForTimeout(250);
      await p.click('#bStart'); await p.waitForTimeout(300);
      const br = await W();
      await p.click('#bStart'); await p.waitForTimeout(150); await p.click('#bReset'); await p.waitForTimeout(250);
      ok(br === 1 && await W() === 0, 'breathing guide: on while it runs, off after Reset');
      await playTrack(p, 'theta-meditation');
      const tr = await W(), req0 = await E(p, () => window.__wl.req);
      await E(p, () => window.__wl.last.release()); await p.waitForTimeout(1400);   // the system takes it back, as when the page is hidden
      const again = await E(p, () => [window.__wl.held, window.__wl.req]);
      await p.click('#stop'); await p.waitForTimeout(400);
      ok(tr === 1 && again[0] === 1 && again[1] === req0 + 1 && await W() === 0, 'Sounds track: on while playing, asked for again after the system drops it, off when stopped');
      // no dimming in the sleep steps
      await p.evaluate(() => location.hash = 'practice/sleep-descent'); await p.waitForTimeout(250);
      await p.click('#sGo'); await p.waitForTimeout(250);
      await jumpTo(p, /^Drift$/); await p.waitForTimeout(200);
      const drift = await E(p, () => ({ dim: document.querySelector('#ses').dataset.dim || '', vis: document.querySelector('#sStage').dataset.vis, op: getComputedStyle(document.querySelector('#sStage')).opacity, held: window.__wl.held }));
      ok(!drift.dim && drift.vis === 'glow' && drift.op === '1' && drift.held === 1, 'Sleep Descent drift: a soft glow at full brightness, screen kept on ' + JSON.stringify(drift));
      await endNow(p); await p.close();
      // turned down, or not there at all: say so once, over the session
      for (const [mode, re] of [['deny', /declined to keep the screen on/], ['none', /can't keep the screen on by itself/]]) {
        const q = await page(null, OPT());
        await E(q, m => localStorage.setItem('test.wl', m), mode);
        await q.evaluate(() => location.hash = 'practice/anapana'); await q.waitForTimeout(250);
        await q.click('#sGo'); await q.waitForTimeout(400);
        const msg = await t(q, '#toastTxt'), shown = await q.$eval('#toast', e => getComputedStyle(e).display !== 'none' && !e.hidden);
        await q.click('#sPlay'); await q.waitForTimeout(100); await q.click('#sPlay'); await q.waitForTimeout(200);
        await E(q, () => { window.__entrain.WL.failAt = 0; window.__entrain.wlSync(); }); await q.waitForTimeout(200);
        const once = await E(q, () => document.querySelector('#toast').classList.contains('show') ? document.querySelector('#toastTxt').textContent : '');
        ok(re.test(msg) && shown, mode + ': the notice shows over the session: "' + msg + '"');
        ok(!once || once === msg, mode + ': and only once');
        await endNow(q); await q.close();
      }
    }

    /* R. search finds practices, poses, patterns, tracks and Learn, and lands on them */
    if (!only || only === 'R') {
      const p = await page(null, OPT());
      const find = async (q) => {
        if (await p.$eval('#fd', e => e.hidden)) { await p.click('#tbFind'); await p.waitForTimeout(150); }
        await p.fill('#fdIn', q); await p.waitForTimeout(200);
        return E(p, () => [...document.querySelectorAll('.fd-grp')].map(g => ({ k: g.querySelector('h3').firstChild.textContent.trim(), items: [...g.querySelectorAll('.fd-it')].map(a => ({ t: a.querySelector('b').textContent, h: a.getAttribute('href') })) })));
      };
      await p.evaluate(() => location.hash = 'learn'); await p.waitForTimeout(200);
      let r = await find('anap');
      ok(r[0] && r[0].k === 'Practices' && r[0].items[0].t === 'Anapana', 'a few letters find Anapana first');
      await p.press('#fdIn', 'Enter'); await p.waitForTimeout(300);
      const went = await E(p, () => [location.hash, document.querySelector('#fd').hidden]);
      await p.goBack(); await p.waitForTimeout(300);
      ok(went[0] === '#practice/anapana' && went[1] && await E(p, () => location.hash) === '#learn', 'Enter opens it; Back returns to where you searched from');
      r = await find('bencao');
      ok(r[0] && r[0].items[0].t === 'Bênção', 'accents are optional: "bencao" finds Bênção');
      r = await find('box breathing');
      ok(r[0] && r[0].k === 'Breathing' && r[0].items[0].h === '#breathe/box', 'several words narrow it down: ' + (r[0] && r[0].items[0].t));
      await p.click('.fd-it[href="#breathe/box"]'); await p.waitForTimeout(300);
      ok(await E(p, () => window.__entrain.BC.pattern) === 'box' && await E(p, () => location.hash) === '#breathe/box', 'a pattern result selects it in the breathing guide');
      // a pose lands in the builder without touching the routine you're making
      await p.evaluate(() => location.hash = 'yoga'); await p.waitForTimeout(250);
      await p.click('#ybLib [data-add="mountain"]'); await p.waitForTimeout(150);
      r = await find('tree');
      await p.click('.fd-it[href="#yoga/find/tree"]'); await p.waitForTimeout(500);
      const pose = await E(p, () => ({ f: document.activeElement && document.activeElement.dataset.add, hit: document.activeElement && document.activeElement.classList.contains('fd-hit'), n: document.querySelectorAll('#ybList .yb-row').length }));
      ok(pose.f === 'tree' && pose.hit && pose.n === 1, 'a pose result shows it in the builder, and your routine stays as it was (' + JSON.stringify(pose) + ')');
      // a track lands on its card even when the list is filtered
      await p.evaluate(() => location.hash = 'sounds'); await p.waitForTimeout(200);
      await p.click('.tab[data-filter="focus"]'); await p.waitForTimeout(150);
      r = await find('tinnitus');
      ok(r[0] && r[0].k === 'Sounds' && r[0].items[0].h === '#track/tinnitus-notch', 'the tinnitus track leads its group: ' + JSON.stringify(r.map(g => g.k)));
      await p.click('.fd-it[href="#track/tinnitus-notch"]'); await p.waitForTimeout(500);
      ok(await E(p, () => !!document.querySelector('#grid .card[data-id="tinnitus-notch"].fd-hit')), 'a track result shows its card, highlighted');
      // Learn paragraphs and references
      r = await find('baroreflex');
      const lh = (r.find(g => g.k === 'Learn') || { items: [] }).items.map(i => i.h);
      ok(lh.length >= 2, 'Learn paragraphs are searchable: ' + lh.length + ' for "baroreflex"');
      await p.click('.fd-it[href="' + lh[0] + '"]'); await p.waitForTimeout(700);
      ok(await E(p, (h) => location.hash === h && document.getElementById(h.slice(1)).classList.contains('fd-hit') && !document.querySelector('#v-learn').hidden, lh[0]), 'and a Learn result scrolls to it and highlights it');
      // your own routines
      await p.evaluate(() => { localStorage.setItem('entrain.yogaSeqs', JSON.stringify([{ uid: 'r1', name: 'Morning Mix', items: [{ id: 'tree', hold: 30 }], at: 1 }])); });
      r = await find('morning mix');
      ok(r[0] && r[0].items[0].h === '#practice/my-r1', 'saved routines are found too');
      // nothing found, and what you type stays text
      r = await find('<img src=x onerror=window.__x=1>');
      ok(r.length === 0 && await E(p, () => !document.querySelector('#fdRes img') && !window.__x && /Nothing found/.test(document.querySelector('#fdRes').textContent)), 'no results: says so, and the query is shown as text');
      // keys: Escape closes and gives focus back; "/" opens; Back closes
      await p.keyboard.press('Escape'); await p.waitForTimeout(150);
      const closed = await E(p, () => [document.querySelector('#fd').hidden, document.activeElement && document.activeElement.id]);
      await p.keyboard.press('/'); await p.waitForTimeout(150);
      const opened = await E(p, () => !document.querySelector('#fd').hidden && document.activeElement.id === 'fdIn');
      const h0 = await E(p, () => location.hash);
      await p.goBack(); await p.waitForTimeout(250);
      ok(closed[0] && closed[1] === 'tbFind' && opened && await E(p, () => document.querySelector('#fd').hidden && location.hash) === h0, 'Escape closes (focus back on the button), "/" opens, the Back button closes it');
      // a running session keeps the keys
      await p.evaluate(() => location.hash = 'practice/body-scan'); await p.waitForTimeout(250);
      await p.click('#sGo'); await p.waitForTimeout(250);
      await p.keyboard.press('/'); await p.waitForTimeout(150);
      ok(await E(p, () => document.querySelector('#fd').hidden), '"/" stays with the session while one is on screen');
      await endNow(p); await p.close();
      // desktop, phone width: the panel fits
      const d = await page(null, OPT(), true);
      await d.keyboard.press('Control+k'); await d.waitForTimeout(150);
      await d.fill('#fdIn', 'sleep'); await d.waitForTimeout(200);
      const box = await d.$eval('#fd', e => { const r = e.getBoundingClientRect(); return [r.left, r.right, r.width]; });
      ok(box[2] <= 640 && box[0] > 220, 'desktop: Ctrl+K opens it, centred beside the rail (' + box.map(Math.round).join(', ') + ')');
      await d.screenshot({ path: path.join(ROOT, 'tests', 'out', 'search-desk.png') });
      await d.close();
      const m = await page(null, OPT());
      await m.click('#tbFind'); await m.waitForTimeout(150); await m.fill('#fdIn', 'breath'); await m.waitForTimeout(200);
      const fit = await m.evaluate(() => ({ over: document.documentElement.scrollWidth - innerWidth, w: document.querySelector('#fd').getBoundingClientRect().width }));
      ok(fit.over === 0 && fit.w === 412, 'phone: full screen, nothing wider than the screen');
      await m.screenshot({ path: path.join(ROOT, 'tests', 'out', 'search-phone.png') });
      await m.close();
    }

    /* S. one goal for every item, and a library built on them */
    if (!only || only === 'S') {
      const p = await page(null, OPT());
      const tax = await E(p, () => {
        const X = window.__entrain, G = ['sleep', 'calm', 'focus', 'energy', 'recover', 'reflect'];
        const M = ['breath', 'meditate', 'move', 'relax', 'sound', 'write', 'program'], Po = ['sit', 'lie', 'stand', 'walk'], bad = [];
        X.PRACTICES.forEach(d => {
          if (!G.includes(d.goal) || !M.includes(d.method) || !d.posture.length || !d.posture.every(x => Po.includes(x)) || !(d.also || []).every(a => G.includes(a) && a !== d.goal)) bad.push(d.id);
        });
        X.BREATHS.forEach(b => { if (!G.includes(b.goal)) bad.push('b:' + b.id); });
        X.TRACKS.forEach(t => { if (!G.includes(t.goal) && t.goal !== 'tinnitus') bad.push('t:' + t.id); });
        return { n: X.PRACTICES.length + X.BREATHS.length + X.TRACKS.length, bad, tagsLeft: X.PRACTICES.filter(d => d.tags || d.group).map(d => d.id) };
      });
      ok(tax.n === 51 && !tax.bad.length && !tax.tagsLeft.length, tax.n + ' items, each with one known goal, a method and a posture; the old groups and tags are gone' + (tax.bad.length ? ': ' + tax.bad.join(', ') : ''));
      await p.evaluate(() => location.hash = 'practice'); await p.waitForTimeout(300);
      const lib = await E(p, () => {
        const secs = [...document.querySelectorAll('#prLib .pr-grp')].map(g => ({ g: g.dataset.g, hrefs: [...g.querySelectorAll('.pc-a')].map(a => a.getAttribute('href')), shown: g.querySelectorAll('li:not([hidden])').length }));
        const all = [].concat(...secs.filter(s => s.g !== 'make').map(s => s.hrefs));
        return { order: secs.map(s => s.g).join(','), dup: all.filter((h, i) => all.indexOf(h) !== i), flow: secs.filter(s => s.hrefs.includes('#practice/standing-flow')).map(s => s.g), calm: secs.find(s => s.g === 'calm') };
      });
      ok(lib.order === 'sleep,calm,focus,energy,recover,reflect,make' && !lib.dup.length, 'goal sections in order, each item listed once: ' + lib.order);
      ok(lib.flow.join() === 'energy', 'Standing Yoga Flow is under Energy only');
      ok(lib.calm.hrefs.length === 18 && lib.calm.shown === 4 && lib.calm.hrefs.includes('#breathe/sigh') && lib.calm.hrefs.includes('#track/alpha-stress'),
        'Calm holds practices, breathing patterns and tracks: 18, the first 4 shown');
      await p.click('.pr-grp[data-g=calm] .pr-more'); await p.waitForTimeout(150);
      ok(await p.$$eval('.pr-grp[data-g=calm] li:not([hidden])', l => l.length) === 18 && !(await p.$('.pr-grp[data-g=calm] .pr-more')), 'Show all opens the rest');
      await p.click('#prFilt [data-f=sleep]'); await p.waitForTimeout(200);
      const sleep = await E(p, () => [...document.querySelectorAll('#prLib .pr-grp')].map(g => g.dataset.g + ': ' + [...g.querySelectorAll('.pc-top b')].map(b => b.textContent).join('|')));
      ok(sleep[0] === 'sleep: Sleep Descent|4-7-8|Cognitive Shuffle|Evening Stretch|Evening Floor Flow|Delta Sleep' && /^also: .*Body Scan\|.*Progressive Muscle Relaxation\|Bhramari\|Long exhale/.test(sleep[1]),
        'the Sleep chip: its own six, then "also good for sleep": ' + sleep[1]);
      await p.click('#prFilt [data-f=focus]'); await p.waitForTimeout(200);
      ok(!(await p.$('#prLib a[href="#practice/standing-flow"]')) && await p.$('#prLib .pr-grp[data-g=also] a[href="#practice/standing-reset"]'), 'Focus: Standing Yoga Flow is not there; Standing Reset is, as also good for focus');
      await p.click('#prFilt [data-f=all]'); await p.click('#prFbtn'); await p.waitForTimeout(150);
      await p.click('#prPanel [data-k=len][data-v="5"]'); await p.waitForTimeout(150);
      const five = await E(p, () => ({ hrefs: [...document.querySelectorAll('#prLib .pc-a')].map(a => a.getAttribute('href')), btn: document.querySelector('#prFbtnTxt').textContent }));
      ok(five.hrefs.includes('#breathe/478') && five.hrefs.includes('#practice/grounding') && !five.hrefs.includes('#practice/kapalabhati') && !five.hrefs.includes('#practice/sleep-descent') && five.btn === 'Filters · 1',
        'up to 5 minutes: ' + five.hrefs.length + ' items, the button counts the filter');
      await p.click('#prPanel [data-clear]'); await p.waitForTimeout(100);
      await p.click('#prPanel [data-k=posture][data-v=lie]'); await p.waitForTimeout(150);
      const lying = await p.$$eval('#prLib .pr-grp:not([data-g=make]) .pc-sub', x => x.map(e => e.textContent));
      ok(lying.length > 8 && lying.every(x => /Lying|lying/.test(x)), 'lying down: ' + lying.length + ' items, all lying');
      await p.click('#prPanel [data-k=posture][data-v=lie]'); await p.click('#prPanel [data-k=needs][data-v=none]'); await p.waitForTimeout(150);
      const plain = await p.$$eval('#prLib .pc-a', a => a.map(x => x.getAttribute('href')));
      ok(plain.length > 15 && !plain.some(h => /track|sleep-descent|calm-reset|coherence|morning-yoga|walking/.test(h)), 'just the phone: no headphones, sensor or room needed (' + plain.length + ')');
      await p.click('#prPanel [data-k=needs][data-v=none]'); await p.click('#prPanel [data-k=method][data-v=write]'); await p.click('#prPanel [data-k=posture][data-v=walk]'); await p.waitForTimeout(150);
      ok(/Nothing matches/.test(await t(p, '#prLib')), 'no matches: says so');
      await p.click('#prLib [data-clear]'); await p.waitForTimeout(150);
      ok(await t(p, '#prFbtnTxt') === 'Filters' && (await p.$$('#prLib .pr-grp')).length === 7, 'Clear filters brings everything back');
      // Sounds and the renames
      await p.evaluate(() => location.hash = 'sounds'); await p.waitForTimeout(250);
      const tr = {};
      for (const g of ['sleep', 'calm', 'focus', 'recover', 'tinnitus']) { await p.click('.tab[data-filter="' + g + '"]'); await p.waitForTimeout(80); tr[g] = await p.$$eval('#grid .card h3', x => x.map(e => e.textContent)); }
      ok(tr.sleep.join() === 'Delta Sleep' && tr.calm.length === 3 && tr.focus.length === 6 && tr.recover.join() === 'Parasympathetic Recovery' && tr.tinnitus.join() === 'Notched Relief' &&
        await p.$eval('.tab[data-filter="tinnitus"]', b => b.getAttribute('aria-pressed')) === 'true', 'Sounds filters tracks by the same goals: ' + Object.keys(tr).map(k => k + ' ' + tr[k].length).join(', '));
      await p.click('.tab[data-filter="all"]');
      ok(await t(p, '#sg-prime') === 'Custom primer' && await t(p, '#sg-build') === 'Beat builder' && /Custom primer/.test(await t(p, '#v-home')) && !/Deep Sleep Descent/.test(await t(p, '#grid')),
        'renamed: Custom primer, Beat builder, Delta Sleep');
      // the movement library by position and type, and a routine with a goal
      await p.evaluate(() => location.hash = 'yoga'); await p.waitForTimeout(250);
      ok(await t(p, '#viewTitle') === 'Routine builder', 'the builder is the Routine builder');
      const counts = {};
      for (const [k, v] of [['cat', 'yoga'], ['cat', 'stretch'], ['cat', 'mobility'], ['cat', 'capoeira']]) { await p.click('#ybCats [data-cat=' + v + ']'); await p.waitForTimeout(60); counts[v] = await p.$$eval('#ybLib li', l => l.length); }
      await p.click('#ybCats [data-cat=all]'); await p.click('#ybPos [data-pos=lie]'); await p.waitForTimeout(60); counts.lying = await p.$$eval('#ybLib li', l => l.length);
      await p.click('#ybPos [data-pos=all]');
      ok(counts.yoga === 36 && counts.stretch === 7 && counts.mobility === 6 && counts.capoeira === 7 && counts.lying === 10, 'pose library by type and position: ' + JSON.stringify(counts));
      await p.click('#ybLib [data-add="corpse"]'); await p.selectOption('#ybGoal', 'sleep'); await p.fill('#ybName', 'Night floor');
      await p.click('#ybSave'); await p.waitForTimeout(200);
      await p.evaluate(() => location.hash = 'practice'); await p.waitForTimeout(250);
      const mine = await p.$$eval('.pr-grp[data-g=mine] .pc-top b', x => x.map(e => e.textContent));
      await p.click('#prFilt [data-f=sleep]'); await p.waitForTimeout(150);
      ok(mine.join() === 'Night floor' && /Night floor/.test(await t(p, '.pr-grp[data-g=sleep]')), 'your routine is under Your routines, and under Sleep when you pick it');
      await p.close();
    }

    /* T. the small fixes: the closed player, the player after End, faint text, the legend, edge fades */
    if (!only || only === 'T') {
      const p = await page(null, OPT({ audio: true }));
      const closed = await p.$eval('#player', e => [getComputedStyle(e).visibility, e.classList.contains('open')]);
      ok(closed[0] === 'hidden' && !closed[1], 'the closed player is hidden, out of the tab order too');
      await p.evaluate(() => location.hash = 'practice/calm-reset'); await p.waitForTimeout(250);
      await p.click('#sGo'); await p.waitForTimeout(800);
      await endNow(p); await p.waitForTimeout(150);
      ok(!(await p.$eval('#player', e => e.classList.contains('open'))), 'after ending a program early, the player stays away');
      const cr = await E(p, () => {
        const v = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
        const lum = h => { const c = [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16) / 255).map(x => x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4)); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; };
        const a = lum(v('--text-faint')), b = lum(v('--panel-2'));
        return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
      });
      ok(cr >= 4.5, 'faint text has 4.5:1 contrast even on the lightest panel: ' + cr.toFixed(2));
      await p.evaluate(() => location.hash = 'practice'); await p.waitForTimeout(300);
      ok((await p.$$('.pr-legend .strength')).length === 3 && /strong[\s\S]*moderate[\s\S]*limited/.test(await t(p, '.pr-legend')), 'the evidence dots have a legend');
      const f0 = await p.$eval('#prFilt', e => [e.classList.contains('fade-r'), e.classList.contains('fade-l')]);
      await p.$eval('#prFilt', e => { e.scrollLeft = 9999; }); await p.waitForTimeout(100);
      const f1 = await p.$eval('#prFilt', e => [e.classList.contains('fade-r'), e.classList.contains('fade-l')]);
      ok(f0[0] && !f0[1] && !f1[0] && f1[1], 'a chip row that scrolls fades at the edge with more beyond it');
      await p.close();
      // nothing wider than a small phone, on any view or practice page (a long title once pushed the top bar out)
      const q = await page(null, OPT());
      await q.setViewportSize({ width: 360, height: 740 });
      const wide = await E(q, async () => {
        const out = [], hs = window.__entrain.PRACTICES.map(d => 'practice/' + d.id).concat(['home', 'practice', 'breathe', 'sounds', 'heart', 'learn', 'yoga', 'settings']);
        for (const h of hs) {
          location.hash = h; await new Promise(r => setTimeout(r, 120));
          if (document.documentElement.scrollWidth > document.documentElement.clientWidth) out.push(h);
        }
        return out;
      });
      ok(!wide.length, 'nothing is wider than a 360 px screen on any view or practice page' + (wide.length ? ': ' + wide.join(', ') : ''));
      await q.close();
    }

    /* U. the practice page: Start in reach, options folded, and remembered per practice */
    if (!only || only === 'U') {
      for (const vp of [{ width: 412, height: 915 }, { width: 360, height: 740 }]) {
        const p = await page(null, OPT(), false);
        await p.setViewportSize(vp);
        const out = [];
        for (const id of ['calm-reset', 'sleep-descent', 'wim-hof', 'nvc-self']) {
          await p.evaluate(x => location.hash = 'practice/' + x, id); await p.waitForTimeout(250);
          out.push(await p.$eval('#sGo', b => { const r = b.getBoundingClientRect(); return r.top >= 0 && r.bottom <= innerHeight - 62; }));
        }
        ok(out.every(Boolean), vp.width + '×' + vp.height + ': Start is on screen above the tab bar on arrival: ' + out.join(','));
        await p.close();
      }
      const p = await page(null, OPT());
      await p.evaluate(() => location.hash = 'practice/anapana'); await p.waitForTimeout(250);
      ok(await p.$eval('#sOpts', e => e.hidden) && await t(p, '#sOptsSum') === 'No voice · Bells' && await p.$eval('#sOptsBtn', b => b.getAttribute('aria-expanded')) === 'false', 'options folded into one line: ' + await t(p, '#sOptsSum'));
      await p.click('#sOptsBtn'); await p.waitForTimeout(100);
      await p.click('label:has(#sOptVoice)'); await p.waitForTimeout(100);
      ok(await t(p, '#sOptsSum') === 'Voice · Bells' && await E(p, () => localStorage.getItem('entrain.pOpt.anapana')) === '{"voice":true}' &&
        !(await p.$eval('#sOptsActs', e => e.hidden)) && /You've changed these/.test(await t(p, '#sOptsScope')), 'a change is kept for this practice, and says so at once: ' + await E(p, () => localStorage.getItem('entrain.pOpt.anapana')));
      await p.evaluate(() => location.hash = 'practice/body-scan'); await p.waitForTimeout(250);
      ok(!(await p.$eval('#sOptVoice', e => e.checked)) && !(await p.$eval('#sOpts', e => e.hidden)), 'another practice keeps the defaults; the panel stays open once opened');
      await p.evaluate(() => location.hash = 'practice/anapana'); await p.waitForTimeout(250);
      ok(await p.$eval('#sOptVoice', e => e.checked) && /You've changed these for Anapana/.test(await t(p, '.so-scope')) && !(await p.$eval('#sOptsActs', e => e.hidden)), 'back on Anapana: its own options, and a way to share or drop them');
      await p.click('#sGo'); await p.waitForTimeout(300);
      ok(await E(p, () => window.__entrain.P.opt.voice) === true, 'the session runs with them');
      await p.click('#sqVoice'); await p.waitForTimeout(100);
      ok(await E(p, () => localStorage.getItem('entrain.pOpt.anapana')) === null, 'the quick Voice toggle in a session saves for that practice too (back to the default)');
      await endNow(p); await p.waitForTimeout(200);
      await p.click('#sdAgain'); await p.waitForTimeout(250);                 // the same address: back to its page
      await p.click('label:has(#sOptVoice)'); await p.click('#sOptCues button[data-v="chimes"]').catch(() => {}); await p.waitForTimeout(100);
      await p.click('#sOptsAll'); await p.waitForTimeout(150);
      const g = await E(p, () => JSON.parse(localStorage.getItem('entrain.pOpt')));
      ok(g.voice === true && await E(p, () => localStorage.getItem('entrain.pOpt.anapana')) === null, 'Use these for every practice: they become the defaults');
      await p.evaluate(() => location.hash = 'practice/body-scan'); await p.waitForTimeout(250);
      ok(await p.$eval('#sOptVoice', e => e.checked), 'and Body Scan now starts with them');
      await p.click('label:has(#sOptVoice)'); await p.waitForTimeout(100);
      await p.evaluate(() => location.hash = 'practice/anapana'); await p.waitForTimeout(150);
      await p.evaluate(() => location.hash = 'practice/body-scan'); await p.waitForTimeout(250);
      await p.click('#sOptsReset'); await p.waitForTimeout(150);
      ok(await p.$eval('#sOptVoice', e => e.checked) && await E(p, () => localStorage.getItem('entrain.pOpt.body-scan')) === null, 'Back to the defaults drops what a practice set for itself');
      await p.close();
    }

    /* V. Settings: defaults for every practice, and the screen */
    if (!only || only === 'V') {
      const p = await page(null, OPT({ audio: true }));
      await p.click('#tbSet'); await p.waitForTimeout(250);
      ok(await t(p, '#viewTitle') === 'Settings' && await E(p, () => location.hash) === '#settings', 'the gear in the top bar opens Settings');
      await E(p, () => localStorage.setItem('entrain.pOpt.anapana', JSON.stringify({ bells: true })));
      await p.evaluate(() => location.hash = 'home'); await p.evaluate(() => location.hash = 'settings'); await p.waitForTimeout(250);
      await p.click('label:has(#stBells)'); await p.waitForTimeout(100);
      await p.evaluate(() => location.hash = 'practice/body-scan'); await p.waitForTimeout(250);
      const bs = await p.$eval('#sOptBells', e => e.checked);
      await p.evaluate(() => location.hash = 'practice/anapana'); await p.waitForTimeout(250);
      const an = await p.$eval('#sOptBells', e => e.checked);
      ok(!bs && an, 'a default reaches practices without their own options, and only them');
      await p.evaluate(() => location.hash = 'settings'); await p.waitForTimeout(250);
      ok(/Anapana has options of its own/.test(await t(p, '.st-own')), 'Settings lists the practices with options of their own');
      await p.click('#stOwnReset'); await p.waitForTimeout(150);
      ok(!(await p.$('.st-own')) && await E(p, () => localStorage.getItem('entrain.pOpt.anapana')) === null, 'and can hand them all back to the defaults');
      await p.click('#stAna button[data-v="300"]'); await p.waitForTimeout(80);
      ok(await E(p, () => JSON.parse(localStorage.getItem('entrain.pOpt')).ana) === 300, 'Anapana reminders default: 5 min');
      // the screen
      await p.click('label:has(#stScrTrk)'); await p.waitForTimeout(80);
      await playTrack(p, 'theta-meditation');
      const trk = await E(p, () => window.__wl.held);
      await p.click('#stop'); await p.waitForTimeout(300);
      await p.evaluate(() => location.hash = 'settings'); await p.waitForTimeout(200);
      await p.click('label:has(#stScrSes)'); await p.waitForTimeout(80);
      await p.evaluate(() => location.hash = 'practice/body-scan'); await p.waitForTimeout(250);
      await p.click('#sGo'); await p.waitForTimeout(300);
      const ses = await E(p, () => window.__wl.held);
      await endNow(p); await p.waitForTimeout(200);
      ok(trk === 0 && ses === 0, 'with the screen options off, a track and a practice let the screen turn off');
      await p.evaluate(() => location.hash = 'settings'); await p.waitForTimeout(200);
      await p.click('label:has(#stScrSes)'); await p.click('label:has(#stScrTrk)'); await p.click('label:has(#stDim)'); await p.waitForTimeout(80);
      ok(await E(p, () => JSON.stringify(window.__entrain.ST)) === '{"screenSessions":true,"screenTracks":true,"sleepDim":true}', 'the screen settings are kept');
      await p.evaluate(() => location.hash = 'practice/sleep-descent'); await p.waitForTimeout(250);
      await p.click('#sGo'); await p.waitForTimeout(250);
      await jumpTo(p, /^Drift$/); await p.waitForTimeout(150);
      const dim = await E(p, () => [document.querySelector('#ses').dataset.dim, document.querySelector('#sStage').dataset.vis, window.__wl.held]);
      ok(dim[0] === '1' && dim[1] === 'dark' && dim[2] === 1, 'Dim the screen in sleep steps: the drift goes almost dark, the screen stays on');
      await endNow(p); await p.waitForTimeout(200);
      ok(!(await E(p, () => document.querySelector('#ses').dataset.dim)), 'and the summary is lit again');
      const found = await E(p, () => { document.querySelector('#tbFind').click(); const i = document.querySelector('#fdIn'); i.value = 'screen'; i.dispatchEvent(new Event('input', { bubbles: true })); return new Promise(r => setTimeout(() => r([...document.querySelectorAll('.fd-it')].map(a => a.getAttribute('href'))), 200)); });
      ok(found.includes('#settings'), 'search finds Settings');
      await p.close();
    }
  } catch (e) { log.push('ERROR ' + e.message); }
  console.log(log.join('\n'));
  console.log(log.filter(l => l.startsWith('PASS')).length + ' passed, ' + log.filter(l => /^(FAIL|PAGEERROR|ERROR|CONSOLE)/.test(l)).length + ' problems');
  await browser.close();
})();
