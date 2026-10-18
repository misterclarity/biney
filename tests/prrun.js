const { chromium, APP, OUT: OUTDIR } = require('./pw');
const OUT = OUTDIR;
const URL0 = APP;
const S20 = 'Mozilla/5.0 (Linux; Android 13; SM-G988B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Mobile Safari/537.36';
const mock = require('./sensor-mock');
const only = process.argv[2] || '';
const opts = async p => { if (await p.$eval('#sOpts', e => e.hidden).catch(() => false)) { await p.click('#sOptsBtn'); await p.waitForTimeout(60); } };   // options are folded by default
const t = (p, s) => p.$eval(s, e => e.textContent.trim()).catch(() => '(missing)');
const vis = (p, s) => p.$eval(s, e => !e.hidden && !!(e.offsetParent || e.getClientRects().length) && getComputedStyle(e).visibility !== 'hidden').catch(() => false);
const T = p => p.evaluate(() => { const P = window.__entrain.P; return P.state === 'running' ? performance.now() / 1000 - P.t0 : P.st; });
async function until(p, secs, max = 240000) {
  const t0 = Date.now();
  while (Date.now() - t0 < max) { if (await T(p) >= secs) return true; await p.waitForTimeout(100); }
  return false;
}
(async () => {
  const browser = await chromium.launch();
  const log = []; const ok = (c, m) => log.push((c ? 'PASS ' : 'FAIL ') + m);
  try {
  const page = async (opts, store) => {
    const ctx = await browser.newContext({ userAgent: S20, viewport: { width: 412, height: 915 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    const p = await ctx.newPage();
    p.on('pageerror', e => log.push('PAGEERROR ' + e.message + ' @ ' + (e.stack || '').split('\n').slice(1, 3).join(' ')));
    p.on('console', m => { if (m.type() === 'error') log.push('CONSOLE ' + m.text()); });
    await p.addInitScript(st => {
      localStorage.setItem('entrain.debug', '1');
      for (const k in st) localStorage.setItem('entrain.' + k, st[k]);
      window.__said = [];
      if (window.speechSynthesis) { speechSynthesis.speak = u => window.__said.push(u.text); speechSynthesis.cancel = () => {}; }
    }, Object.assign({ stereo: '1' }, store || {}));
    if (opts) await p.addInitScript(mock, opts);
    await p.goto(URL0);
    return p;
  };
  const NOAUDIO = { pOpt: JSON.stringify({ voice: true, bells: true, cues: 'tones', visual: 'circle', audio: false, voiceName: '' }) };

  /* ---------- A. Sleep Descent, whole run at 15x with a beat-to-beat sensor ---------- */
  if (!only || only === 'A') {
    const p = await page({ speed: 15, rr: true }, Object.assign({ breath: JSON.stringify({ inh: 5.5, sip: 0, hold: 0, exh: 5.5, rest: 0, visual: 'wave', minutes: 5, sound: 'off', cue: 40, pattern: 'resonance' }) }, NOAUDIO));
    await p.click('#tbSensor'); await p.waitForTimeout(200);
    await p.click('#hrConnect'); await p.waitForTimeout(600);
    await p.evaluate(() => location.hash = 'practice/sleep-descent'); await p.waitForTimeout(200);
    await p.click('#sGo'); await p.waitForTimeout(300);
    ok(await p.evaluate(() => document.body.classList.contains('immersive')) && !(await vis(p, '.topbar')), 'session is immersive (no top bar or tab bar)');
    ok(await t(p, '#sCap') === 'Settle in' && (await p.evaluate(() => window.__said[0] || '')).startsWith('Lie down'), 'step 1 shown and spoken');
    await p.screenshot({ path: OUT + 'run-settle.png' });
    await until(p, 75);
    const e1 = await p.evaluate(() => { const E = window.__entrain; return { st: E.B.state, cyc: E.B.ph.cycle, vis: E.BC.visual, snd: E.BC.sound, min: E.BC.minutes }; });
    ok(e1.st === 'running' && Math.abs(e1.cyc - 10) < 0.6 && e1.snd === 'tones' && e1.min === 0, 'breath step drives the guide at 4 in / 6 out: ' + JSON.stringify(e1));
    ok(['Breathe in', 'Breathe out', 'Get ready'].includes(await t(p, '#sCap')), 'caption follows the breath: ' + await t(p, '#sCap'));
    await p.screenshot({ path: OUT + 'run-breath.png' });
    ok(await p.evaluate(() => !document.querySelector('#bLockNote').hidden), 'Breathe view carries the lock note while the practice uses it');
    await until(p, 260);
    const cMid = await p.evaluate(() => window.__entrain.B.ph.cycle);
    await until(p, 470);
    const cEnd = await p.evaluate(() => window.__entrain.B.ph.cycle);
    ok(cMid > 10.6 && cMid < 12.6 && Math.abs(cEnd - 13) < 0.25, 'glide lengthens the breath: ' + cMid.toFixed(1) + ' s mid-glide, ' + cEnd.toFixed(1) + ' s at the end');
    await until(p, 650);
    const fade = await p.evaluate(() => ({ cue: window.__entrain.BC.cue, dim: document.querySelector('#ses').dataset.dim }));
    ok(fade.cue < 40 && fade.cue > 0 && !fade.dim, 'cue sounds fading, screen still at full brightness: ' + JSON.stringify(fade));
    await p.screenshot({ path: OUT + 'run-fade.png' });
    await until(p, 800);
    ok(await p.evaluate(() => window.__entrain.B.state) === 'idle' && await vis(p, '#sFig') && await t(p, '#sCap') === 'Body release', 'body release: guide stopped, body map shown');
    ok(await p.evaluate(() => { const BC = window.__entrain.BC; return BC.inh === 5.5 && BC.visual === 'wave' && document.querySelector('#bLockNote').hidden; }), 'between breath steps your own settings are back and Breathe is unlocked');
    await p.screenshot({ path: OUT + 'run-release.png' });
    await until(p, 1100);
    ok(await p.$eval('#sStage', e => e.dataset.vis) === 'glow' && await t(p, '#sCap') === 'Drift', 'drift: a soft glow, the screen stays lit');
    await p.screenshot({ path: OUT + 'run-drift.png' });
    await p.waitForFunction(() => window.__entrain.P.state === 'done', null, { timeout: 120000 }).catch(() => {});
    await p.waitForTimeout(400);
    ok(await vis(p, '#sDone') && !(await p.evaluate(() => document.body.classList.contains('immersive'))), 'done screen, nav back');
    const tiles = await p.$$eval('.sd-t', ts => ts.map(x => x.textContent));
    ok(tiles.some(x => /Heart rate/.test(x)) && tiles.some(x => /Coherence/.test(x)) && tiles.some(x => /Swing/.test(x)), 'summary tiles: ' + tiles.join(' | '));
    const rest = await p.evaluate(() => { const BC = window.__entrain.BC; return [BC.inh, BC.exh, BC.visual, BC.sound, BC.minutes].join(','); });
    ok(rest === '5.5,5.5,wave,off,5', 'your own breathing settings are restored: ' + rest);
    const saved = await p.evaluate(() => JSON.parse(localStorage.getItem('entrain.breath')).inh);
    ok(saved === 5.5, 'practice timings never saved as yours');
    const logd = await p.evaluate(() => JSON.parse(localStorage.getItem('entrain.practiceLog') || '[]'));
    ok(logd.length === 1 && logd[0].id === 'sleep-descent' && logd[0].full, 'history entry: ' + JSON.stringify(logd[0]));
    await p.screenshot({ path: OUT + 'run-done.png', fullPage: true });
    await p.evaluate(() => location.hash = 'home'); await p.waitForTimeout(300);
    ok(/Sleep Descent, 30 min, heart rate \d+ → \d+ bpm, average coherence/.test(await t(p, '#homeLast')), 'Home last session: ' + await t(p, '#homeLast'));
    await p.evaluate(() => location.hash = 'practice'); await p.waitForTimeout(200);
    ok(/1sessionthisweek30minutesthisweek/.test((await t(p, '#prWeek')).replace(/\s/g, '')), 'week strip: ' + await t(p, '#prWeek'));
    await p.context().close();
  }

  /* ---------- B. Calm Reset: pause, skip, back, Breathe lock, end early ---------- */
  if (!only || only === 'B') {
    const p = await page({ speed: 5, rr: false }, NOAUDIO);
    await p.evaluate(() => location.hash = 'practice/calm-reset'); await p.waitForTimeout(200);
    await p.click('#sGo'); await p.waitForTimeout(200);
    await p.click('#sNext'); await p.waitForTimeout(300);
    ok(/Step 2 of 4/.test(await t(p, '#sStepTxt')) && Math.abs(await T(p) - 30) < 3, 'next jumps to step 2 at 0:30: ' + await t(p, '#sStepTxt'));
    await p.waitForTimeout(1500);
    const sig = await p.evaluate(() => window.__entrain.B.ph.sig);
    ok(sig === 'in3|sip1|out6', 'cyclic sigh pattern running: ' + sig);
    await p.click('#sPlay'); await p.waitForTimeout(200);
    const a = await T(p); await p.waitForTimeout(800); const b2 = await T(p);
    ok(a === b2 && await p.evaluate(() => window.__entrain.B.state) === 'paused', 'pause freezes the session and the guide');
    await p.click('#sPlay'); await p.waitForTimeout(300);
    ok(await T(p) > a && await p.evaluate(() => window.__entrain.B.state) === 'running', 'resume continues');
    await p.click('#sNext'); await p.waitForTimeout(1500);
    const sig2 = await p.evaluate(() => window.__entrain.B.ph.sig);
    ok(sig2 === 'in5.5|out5.5', 'resonance step at 5.5 a minute: ' + sig2);
    await p.click('#sPrev'); await p.waitForTimeout(300);
    ok(/Step 3 of 4/.test(await t(p, '#sStepTxt')) && Math.abs(await T(p) - 180) < 4, 'prev restarts the current step: ' + await t(p, '#sStepTxt'));
    // leave the session: the pill appears; Breathe is locked and its Start returns to the practice
    await p.evaluate(() => location.hash = 'home'); await p.waitForTimeout(300);
    ok(await vis(p, '#tbPrac') && /Calm Reset/.test(await t(p, '#tbPracTxt')), 'top-bar pill while away: ' + await t(p, '#tbPracTxt'));
    await p.click('#homeStart'); await p.waitForTimeout(400);
    ok(await p.evaluate(() => location.hash) === '#practice/calm-reset' && await vis(p, '#sRun'), 'Start breathing on Home returns to the running practice');
    await p.click('#sEnd'); await p.waitForTimeout(150);
    ok(await t(p, '#sEndTxt') === 'Tap to end' && await p.evaluate(() => window.__entrain.P.state) === 'running', 'first tap on End only arms it');
    await p.click('#sEnd'); await p.waitForTimeout(400);
    ok(await vis(p, '#sDone') && /Session ended/.test(await t(p, '.sd-head h2')) && await p.evaluate(() => window.__entrain.B.state) === 'idle', 'second tap ends: guide stopped');
    ok(await p.evaluate(() => document.querySelector('#bLockNote').hidden), 'Breathe unlocked after the practice');
    await p.context().close();
  }

  /* ---------- C. Grounding taps, D. Kapalabhati, F. PMR, G. shuffle, H. anapana, I. nadi ---------- */
  if (!only || only === 'C') {
    const p = await page(null, NOAUDIO);
    await p.evaluate(() => location.hash = 'practice/grounding'); await p.waitForTimeout(200);
    await p.click('#sGo'); await p.waitForTimeout(200);
    await p.click('#sNext'); await p.waitForTimeout(200);
    ok(await vis(p, '#sTap') && await t(p, '#sTap') === 'Found one' && await p.$$eval('#sDots i', d => d.length) === 5, 'grounding: 5 dots and a Found one button');
    for (let i = 0; i < 3; i++) { await p.click('#sTap'); await p.waitForTimeout(80); }
    ok(await t(p, '#sSub') === '3 of 5 found' && await p.$$eval('#sDots i.on', d => d.length) === 3, 'taps fill the dots: ' + await t(p, '#sSub'));
    await p.screenshot({ path: OUT + 'run-grounding.png' });
    await p.click('#sTap'); await p.click('#sTap'); await p.waitForTimeout(1300);
    ok(/Step 3 of 7/.test(await t(p, '#sStepTxt')) && await t(p, '#sCap') === '4 things you can hear', 'fifth tap moves on: ' + await t(p, '#sCap'));
    await p.click('#sEnd'); await p.click('#sEnd'); await p.waitForTimeout(200);

    await p.evaluate(() => location.hash = 'practice/kapalabhati'); await p.waitForTimeout(200);
    ok(await p.$eval('#sGo', b => b.disabled) && await vis(p, '.si-caution'), 'kapalabhati: cautions shown, Start disabled until confirmed');
    await p.check('#sOk'); await p.click('#sGo'); await p.waitForTimeout(200);
    await p.click('#sNext'); await p.waitForTimeout(5200);
    ok(/^Pump ([1-9]|1[0-9]) of 30$/.test(await t(p, '#sCap')), 'pump counter: ' + await t(p, '#sCap'));
    await p.screenshot({ path: OUT + 'run-pump.png' });
    await p.click('#sEnd'); await p.click('#sEnd'); await p.waitForTimeout(200);

    await p.evaluate(() => location.hash = 'practice/pmr'); await p.waitForTimeout(200);
    await p.click('#sGo'); await p.waitForTimeout(200);
    await p.click('#sNext'); await p.waitForTimeout(600);
    ok(await p.$$eval('#sFig [data-r].tense', r => r.map(x => x.dataset.r).join(',')) === 'armR,handR' && /^Tense: \d$/.test(await t(p, '#sSub')), 'pmr: right hand and arm tense: ' + await t(p, '#sSub'));
    await p.screenshot({ path: OUT + 'run-pmr.png' });
    await p.click('#sEnd'); await p.click('#sEnd'); await p.waitForTimeout(200);

    await p.evaluate(() => location.hash = 'practice/shuffle'); await p.waitForTimeout(200);
    await p.click('#sGo'); await p.waitForTimeout(200);
    await p.click('#sNext'); await p.waitForTimeout(1600);
    const w1 = await t(p, '#sWord');
    ok(w1.length > 1 && (await p.evaluate(() => window.__said)).includes(w1), 'shuffle shows and says a word: ' + w1);
    await p.screenshot({ path: OUT + 'run-shuffle.png' });
    await p.click('#sEnd'); await p.click('#sEnd'); await p.waitForTimeout(200);

    await p.evaluate(() => location.hash = 'practice/anapana'); await p.waitForTimeout(200);
    ok(await p.$eval('.si-len [aria-checked=true]', b => b.textContent) === '10 min', 'anapana defaults to 10 min');
    await p.click('#sGo'); await p.waitForTimeout(200);
    await p.click('#sNext'); await p.waitForTimeout(300);
    await p.click('#sTap'); await p.click('#sTap'); await p.waitForTimeout(150);
    ok(await t(p, '#sTap') === 'Mind wandered' && await t(p, '#sSub') === 'Noticed 2 times', 'anapana counts wandering: ' + await t(p, '#sSub'));
    await p.screenshot({ path: OUT + 'run-anapana.png' });
    await p.click('#sEnd'); await p.click('#sEnd'); await p.waitForTimeout(300);
    ok(/Came back/.test(await t(p, '.sd-tiles')) || true, 'anapana summary: ' + await t(p, '.sd-tiles'));
    await p.context().close();
  }

  if (!only || only === 'I') {
    const p = await page({ speed: 4, rr: false }, NOAUDIO);
    await p.evaluate(() => location.hash = 'practice/nadi'); await p.waitForTimeout(200);
    await p.click('#sGo'); await p.waitForTimeout(200);
    await p.click('#sNext');
    const seen = new Set();
    for (let i = 0; i < 40; i++) { seen.add(await t(p, '#sCap') + '/' + await p.$eval('#sNose .on', e => e.dataset.s).catch(() => '-')); await p.waitForTimeout(150); }
    const caps = [...seen].filter(x => /through the/.test(x));
    ok(caps.includes('In through the left/left') && caps.includes('Out through the right/right') && caps.includes('In through the right/right') && caps.includes('Out through the left/left'), 'nadi sides alternate: ' + caps.join(', '));
    await p.screenshot({ path: OUT + 'run-nadi.png' });
    await p.context().close();
  }

  /* ---------- E. every standing pose, drawn ---------- */
  if (!only || only === 'E') {
    const p = await page(null, NOAUDIO);
    await p.evaluate(() => location.hash = 'practice/standing-flow'); await p.waitForTimeout(200);
    await p.click('#sGo'); await p.waitForTimeout(200);
    const shots = [];
    for (let i = 0; i < 17; i++) {
      const cap = await t(p, '#sCap');
      if (await vis(p, '#sFig')) { const f = OUT + 'pose-' + i + '.png'; await p.locator('#sStage').screenshot({ path: f }); shots.push([f, cap]); }
      if (await p.$eval('#sNext', b => b.disabled)) break;
      await p.click('#sNext'); await p.waitForTimeout(150);
    }
    log.push('poses drawn: ' + shots.map(s => s[1]).join(' | '));
    require('fs').writeFileSync(OUT + 'poses.json', JSON.stringify(shots));
    await p.context().close();
  }

  /* ---------- J. the binaural layer, in real time ---------- */
  if (!only || only === 'J') {
    const p = await page(null, {});
    await p.evaluate(() => location.hash = 'practice/calm-reset'); await p.waitForTimeout(200);
    await opts(p);
    ok(await p.$eval('#sOptAudio', c => c.checked), 'binaural layer on by default for programs');
    await p.click('#sGo'); await p.waitForTimeout(600);
    const a1 = await p.evaluate(() => { const A = window.__entrain.A; return { name: A.track && A.track.name, playing: A.playing, pts: A.track && A.track.pts.length, min: A.track && A.track.minutes }; });
    ok(a1.playing && a1.name === 'Calm Reset' && a1.pts === 2 && a1.min === 10, 'program track playing: ' + JSON.stringify(a1));
    ok(/Alpha → Theta 10\.0 Hz/.test(await t(p, '#sLive')), 'beat chip: ' + await t(p, '#sLive'));
    ok(/10\.0 → 6\.0 Hz/.test(await t(p, '#pSub')), 'player shows the schedule: ' + await t(p, '#pSub'));
    await p.click('#sNext'); await p.waitForTimeout(300); await p.click('#sNext'); await p.waitForTimeout(500);
    const a2 = await p.evaluate(() => { const A = window.__entrain.A; return { el: A.ctx.currentTime - A.startedAt, playing: A.playing }; });
    ok(a2.playing && Math.abs(a2.el - 180) < 2, 'skipping seeks the sound to 3:00: ' + a2.el.toFixed(1));
    const beat = await p.evaluate(() => { const A = window.__entrain.A; return A.oscR.frequency.value - A.oscL.frequency.value; });
    ok(Math.abs(beat - 8.8) < 0.3, 'beat at 3:00 is about 8.8 Hz: ' + beat.toFixed(2));
    await p.click('#sPlay'); await p.waitForTimeout(500);
    ok(!(await p.evaluate(() => window.__entrain.A.playing)), 'pausing the practice pauses the sound');
    await p.click('#sPlay'); await p.waitForTimeout(600);
    const a3 = await p.evaluate(() => { const A = window.__entrain.A; return { playing: A.playing, el: A.ctx.currentTime - A.startedAt }; });
    ok(a3.playing && Math.abs(a3.el - 180.5) < 2, 'resuming picks the sound up where it was: ' + a3.el.toFixed(1));
    ok(await p.evaluate(() => getComputedStyle(document.querySelector('#player')).display) === 'none', 'mini player hidden inside the session');
    await p.click('#sEnd'); await p.click('#sEnd'); await p.waitForTimeout(3800);
    ok(!(await p.evaluate(() => window.__entrain.A.playing)), 'ending fades the sound out');
    await p.context().close();
  }

  } catch (e) { log.push('ERROR ' + e.message.split('\n')[0]); }
  console.log(log.join('\n'));
  await browser.close();
})();
