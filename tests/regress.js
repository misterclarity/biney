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
  const page = async (opts, st, desk) => {
    const ctx = await browser.newContext(desk ? { viewport: { width: 1280, height: 900 } } : { userAgent: S20, viewport: { width: 412, height: 915 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    const p = await ctx.newPage();
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
  } catch (e) { log.push('ERROR ' + e.message); }
  console.log(log.join('\n'));
  console.log(log.filter(l => l.startsWith('PASS')).length + ' passed, ' + log.filter(l => /^(FAIL|PAGEERROR|ERROR|CONSOLE)/.test(l)).length + ' problems');
  await browser.close();
})();
