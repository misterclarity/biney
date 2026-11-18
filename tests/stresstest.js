// The Stress Check: its page, the reading with a beat-to-beat sensor, the baseline built from your own checks,
// each level's advice and its button, a re-check after a practice, a sensor that sends heart rate only, no
// sensor at all, an unsteady signal, a pause while measuring, and Learn. The clock runs ten times faster.
const { chromium, APP, OUT } = require('./pw');
const mock = require('./sensor-mock');
const S20 = 'Mozilla/5.0 (Linux; Android 13; SM-G988B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Mobile Safari/537.36';
const only = process.argv[2] || '';
const t = (p, s) => p.$eval(s, e => e.textContent.replace(/\s+/g, ' ').trim()).catch(() => '(missing)');
const tb = (p, s) => p.$eval(s, e => e.innerText.replace(/\s+/g, ' ').trim()).catch(() => '(missing)');   // a card of several blocks: innerText keeps the breaks between them
const E = (p, f, a) => p.evaluate(f, a);
async function waitFor(p, fn, max = 8000, arg) { const t0 = Date.now(); while (Date.now() - t0 < max) { if (await p.evaluate(fn, arg)) return true; await p.waitForTimeout(100); } return false; }
const DAY = 864e5, MIN = 6e4;
// an earlier check, as the history keeps it
const past = (ago, rm, hr, o) => Object.assign({ k: 'practice', id: 'stress-check', n: 'Stress Check', at: Date.now() - ago, secs: 200, full: true, hrAvg: hr, rm: rm, felt: 3 }, o || {});
const base3 = (rm, hr) => [past(3 * DAY, rm, hr), past(2 * DAY, rm, hr), past(DAY, rm, hr)];

(async () => {
  const browser = await chromium.launch();
  const log = []; const ok = (c, m) => log.push((c ? 'PASS ' : 'FAIL ') + m);
  const page = async (opts, hist, vp, pre) => {
    const ctx = await browser.newContext({ userAgent: S20, viewport: vp || { width: 412, height: 915 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    const p = await ctx.newPage();
    p.on('pageerror', e => log.push('PAGEERROR ' + e.message + ' @ ' + (e.stack || '').split('\n').slice(1, 3).join(' ')));
    p.on('console', m => { if (m.type() === 'error') log.push('CONSOLE ' + m.text()); });
    await p.addInitScript(([h, pre]) => {
      localStorage.setItem('entrain.debug', '1'); localStorage.setItem('entrain.stereo', '1');
      localStorage.setItem('entrain.pOpt', JSON.stringify({ voice: false, bells: false, cues: 'tones', visual: 'circle', audio: true, voiceName: '', ana: 0, rhythm: true }));
      if (h && !localStorage.getItem('entrain.seeded')) { localStorage.setItem('entrain.history', JSON.stringify(h)); localStorage.setItem('entrain.seeded', '1'); }
      Object.assign(window, pre || {});
    }, [hist || null, pre || {}]);
    if (opts) await p.addInitScript(mock, opts);
    await p.goto(APP);
    if (opts) { await p.click('#tbSensor'); await p.waitForTimeout(200); await p.click('#hrConnect'); await p.waitForTimeout(700); }
    return p;
  };
  // one whole check: the rating (a number, or null to skip it), then wait for the end screen
  const check = async (p, rate, len) => {
    await E(p, () => location.hash = 'practice/stress-check'); await p.waitForTimeout(250);
    if (len) { await p.click('.si-len button[data-len="' + len + '"]'); await p.waitForTimeout(150); }
    await p.click('#sGo'); await p.waitForTimeout(300);
    if (rate === null) await p.click('#sRateSkip'); else await p.click('#sRateG button[data-v="' + rate + '"]');
    return waitFor(p, () => window.__entrain.P.state === 'done', 90000);
  };
  const tiles = p => p.$$eval('.sd-t', x => x.map(e => [...e.children].map(c => c.textContent.trim()).filter(Boolean).join(' ')));   // name, value, unit, comparison
  const tile = (ts, name) => ts.find(x => x.startsWith(name)) || '';
  const card = p => tb(p, '#scCard');
  const hist = p => E(p, () => JSON.parse(localStorage.getItem('entrain.history') || '[]').filter(e => e.id === 'stress-check'));
  const explain = async (p, k) => { await p.click('.sd-t[data-ex="' + k + '"]'); await p.waitForTimeout(150); const x = await t(p, '#sdEx'); await p.click('.sd-t[data-ex="' + k + '"]'); return x; };
  let v = 0;            // RMSSD the stand-in sensor gives at a swing of 8 bpm around 64, measured in B

  try {
  /* ---------- A. its page, the library, search and Learn ---------- */
  if (!only || only === 'A') {
    const p = await page(null);
    await E(p, () => location.hash = 'practice/stress-check'); await p.waitForTimeout(300);
    const kind = await t(p, '.si-kind'), lens = await p.$$eval('.si-len button', b => b.map(x => x.textContent).join('/'));
    ok(/^Calm · Measurement · 3 min$/.test(kind) && lens === '3 min/6 min', 'its page: ' + kind + ', lengths ' + lens);
    ok(/Heart sensor/.test(await t(p, '.si-need')) && /without one, the advice follows your own rating/.test(await t(p, '.si-need')), 'needs a heart sensor, and says what happens without one');
    ok(!(await p.$('#sOptBeat')) && !(await p.$('#sOptAudio')) && !(await p.$('#sOptAna')) && !(await p.$('#sOptTap')), 'no beat, no Anapana reminders and no tapping round: nothing to nudge the reading');
    const plans = await E(p, () => { const X = window.__entrain, d = X.pDef('stress-check'); return [3, 6].map(m => X.pPlan(d, m).steps.map(s => s.k + ':' + s.secs).join(',')); });
    ok(plans[0] === 'rate:30,guide:45,measure:120' && plans[1] === 'rate:30,guide:45,measure:300', 'a rating, 45 s to settle, then two or five minutes measured: ' + plans.join(' | '));
    await E(p, () => location.hash = 'practice'); await p.waitForTimeout(300);
    const first = await E(p, () => { const g = document.querySelector('#prLib .pr-grp[data-g="calm"] .pc-a'); return g && g.getAttribute('href'); });
    ok(first === '#practice/stress-check', 'first under Calm in the library: ' + first);
    const m = await p.$('#prMeth [data-m=measure]');
    ok(!!m && /Measurement/.test(await t(p, '#prMeth [data-m=measure]')), 'a Measurement technique to filter by');
    if (m) {
      await p.click('#prMeth [data-m=measure]'); await p.waitForTimeout(200);
      const shown = await p.$$eval('#prLib .pc-a', a => a.map(x => x.getAttribute('href')));
      ok(shown.length === 1 && shown[0] === '#practice/stress-check', 'which finds the Stress Check alone: ' + shown.join(', '));
    }
    await p.click('#tbFind'); await p.waitForTimeout(150); await p.fill('#fdIn', 'stress level'); await p.waitForTimeout(300);
    ok(!!(await p.$('.fd-it[href="#practice/stress-check"]')), 'search finds it for "stress level"');
    await p.fill('#fdIn', 'hrv measure'); await p.waitForTimeout(300);
    ok(!!(await p.$('.fd-it[href="#practice/stress-check"]')), 'and for "hrv measure"');
    await p.keyboard.press('Escape'); await p.waitForTimeout(150);
    await E(p, () => location.hash = 'learn'); await p.waitForTimeout(300);
    const L = await t(p, '#l-stress'), refs = await p.$$eval('#references li', l => l.map(x => x.textContent));
    ok(/Kim et al\., 2018/.test(L) && /Muñoz et al\., 2015/.test(L) && /doesn't set yours against anyone else's/.test(L) && /Entrain's own and haven't been tested/.test(L),
      'Learn explains the reading, the baseline and the rule, with its sources');
    ok(refs.some(r => /^Kim, H\.-G\., Cheon/.test(r) && /Psychiatry Investigation/.test(r)) && refs.some(r => /^Muñoz, M\. L\./.test(r) && /e0138921/.test(r)), 'its two new references are in the list');
    await p.close();
  }

  /* ---------- B. a first check with a beat-to-beat sensor ---------- */
  if (!only || only === 'B') {
    const p = await page({ speed: 10, rr: true }, null, null, { __hrAmp: 8 });
    await E(p, () => location.hash = 'practice/stress-check'); await p.waitForTimeout(250);
    await p.click('#sGo'); await p.waitForTimeout(300);
    ok(await t(p, '#sCap') === 'How stressed do you feel?' && await t(p, '#sRateHi') === 'As stressed as you get', 'it opens on the rating, with its own ends: ' + await t(p, '#sRateHi'));
    await p.click('#sRateG button[data-v="4"]');
    await waitFor(p, () => { const P = window.__entrain.P; return P.steps[P.idx].k === 'measure'; }, 20000); await p.waitForTimeout(2500);
    const cap = await t(p, '#sSub');
    ok(/^\d+ beats · steady$/.test(cap), 'while measuring, the beats so far: ' + cap);
    ok(await waitFor(p, () => window.__entrain.P.state === 'done', 40000), 'the check ends by itself');
    await p.waitForTimeout(300);
    const ts = await tiles(p);
    ok(/^Stress level Moderate from your rating$/.test(tile(ts, 'Stress level')), 'a first check: the level from your rating alone: ' + tile(ts, 'Stress level'));
    const rmT = tile(ts, 'RMSSD'), hrT = tile(ts, 'Resting heart rate');
    ok(/^RMSSD \d+ ms, beat to beat baseline 1 of 3$/.test(rmT) && /^Resting heart rate 6[2-6] bpm while measuring baseline 1 of 3$/.test(hrT), 'RMSSD and resting heart rate, each the first of three for your baseline: ' + rmT + ' | ' + hrT);
    ok(/^Felt stress 4 out of 10$/.test(tile(ts, 'Felt stress')) && /^Coherence \d\.\d/.test(tile(ts, 'Coherence')) && !ts.some(x => /^Heart rate \d+ → \d+/.test(x)), 'felt stress and coherence; no start-to-end heart rate for a check at rest');
    ok(await E(p, () => { const c = document.querySelector('#scCard'), ch = document.querySelector('.sd-chart'); return !!c && !!ch && !!(c.compareDocumentPosition(ch) & Node.DOCUMENT_POSITION_FOLLOWING); }), 'the advice comes before the chart');
    const C = await card(p);
    ok(/^What would help now Stress level: moderate\./.test(C) && /Practice Heart Coherence, 15 min/.test(C) && /Binaural beat Theta 6 Hz: a steady 6 Hz beat/.test(C),
      'moderate: Heart Coherence for fifteen minutes with its theta beat');
    ok(/Breathing 13 min at 5\.5 a minute: 5\.5 s in, 5\.5 s out\. That's 5\.5 a minute until you take the resonance test/.test(C), 'the breathing as its plan will run it: ' + (C.match(/Breathing [^.]+\./) || [''])[0]);
    ok(/Laborde and colleagues' 2022 meta-analysis/.test(C) && /Goessl and colleagues' 2017/.test(C) && /Fincham and colleagues' 2023 trial/.test(C), 'why, naming its studies, the trial that found no benefit included');
    ok(/Calm Reset/.test(await t(p, '#scCard .sc-alt')) && /Theta Meditation/.test(await t(p, '#scCard .sc-just')), 'a shorter alternative, and the track and pattern on their own');
    const h = (await hist(p))[0] || {};
    v = h.rm || 0;
    ok(v > 20 && v < 80 && h.felt === 4 && h.hrAvg >= 62 && h.hrAvg <= 66 && /felt stress 4 of 10, RMSSD \d+ ms, level moderate/.test(h.note || ''), 'into the history: ' + JSON.stringify(h));
    ok(h.coh === undefined && /^Coherence \d\.\d/.test(tile(ts, 'Coherence')), 'its coherence, at rest and unpaced, shows on the end screen but stays out of the history and its trends');
    const xs = await explain(p, 'stress'), xr = await explain(p, 'rmssd');
    ok(/this was check 1 of 3/.test(xs) && /Entrain's own, not a validated stress scale/.test(xs) && /beta-blockers/.test(xs), 'the level explained: the baseline to come, the rule, its limits');
    ok(/Kim and colleagues' 2018 meta-analysis/.test(xr) && /Muñoz and colleagues' 2015 study of 3,387 adults/.test(xr) && /never set against anyone else's/.test(xr), 'RMSSD explained, with its studies');
    await p.screenshot({ path: OUT + 'stress-first.png', fullPage: true });
    await p.click('#scGo'); await p.waitForTimeout(400);
    const ap = await E(p, () => ({ hash: location.hash, len: localStorage.getItem('entrain.pLen.coherence'), beat: (JSON.parse(localStorage.getItem('entrain.pCh.coherence') || '{}')).beat,
      shown: (document.querySelector('#sOptBeat [aria-pressed=true]') || {}).dataset, on: (document.querySelector('.si-len [aria-checked=true]') || {}).textContent }));
    ok(ap.hash === '#practice/coherence' && ap.len === '15' && ap.beat === 'theta' && ap.shown && ap.shown.v === 'theta' && /15 min/.test(ap.on || ''), 'Open Heart Coherence with these settings: its page, fifteen minutes, theta: ' + JSON.stringify(ap));
    await p.close();
  }

  /* ---------- C. against your own baseline: each level and its advice ---------- */
  if ((!only || only === 'C') && v) {
    // C1. RMSSD above your usual and a low rating: low
    let p = await page({ speed: 10, rr: true }, base3(v / 1.15, 64), null, { __hrAmp: 8 });
    ok(await check(p, 1), 'C1 ran');
    let ts = await tiles(p), C = await card(p);
    ok(/^Stress level Low from your heart and your rating$/.test(tile(ts, 'Stress level')) && /^RMSSD \d+ ms, beat to beat 1[01]\d% of your usual$/.test(tile(ts, 'RMSSD')), 'low: ' + tile(ts, 'Stress level') + ' | ' + tile(ts, 'RMSSD'));
    ok(/Nothing needs doing/.test(C) && /Practice Heart Coherence, 10 min/.test(C) && /Binaural beat Alpha 10 Hz/.test(C) && !(await p.$('#scCard .sc-alt')), 'low: nothing needed, or ten minutes of Heart Coherence under alpha');
    await p.close();
    // C2. RMSSD a little below your usual, no rating: moderate from the heart, and at night, Sleep Descent instead
    p = await page({ speed: 10, rr: true }, base3(v / 0.82, 64), null, { __hrAmp: 8, __scHour: 22 });
    ok(await check(p, null), 'C2 ran');
    ts = await tiles(p); C = await card(p);
    ok(/^Stress level Moderate from your heart$/.test(tile(ts, 'Stress level')) && /^RMSSD \d+ ms, beat to beat [78]\d% of your usual$/.test(tile(ts, 'RMSSD')) && !tile(ts, 'Felt stress'), 'moderate from the heart alone: ' + tile(ts, 'RMSSD'));
    ok(/Practice Heart Coherence, 15 min/.test(C) && /Going to bed soon\? Sleep Descent instead/.test(await t(p, '#scCard .sc-alt')) && !!(await p.$('#scAlt[href="#practice/sleep-descent"]')), 'at night the alternative is Sleep Descent');
    await p.close();
    // C3. RMSSD far below your usual, though you rate it low: very high, and the two disagree
    p = await page({ speed: 10, rr: true }, base3(v / 0.4, 64), null, { __hrAmp: 8 });
    ok(await check(p, 2), 'C3 ran');
    ts = await tiles(p); C = await card(p);
    ok(/^Stress level Very high from your heart and your rating$/.test(tile(ts, 'Stress level')), 'very high: ' + tile(ts, 'RMSSD'));
    ok(/Practice Calm Reset, 10 min/.test(C) && /Binaural beat Theta 6 Hz/.test(C) && /Breathing 2½ min of cyclic sighs: 3 s in, a 1 s sip, 6 s out\. Then 6½ min at 5\.5 a minute/.test(C),
      'very high: Calm Reset under a steady theta beat, its sighs and resonance breathing spelt out: ' + (C.match(/Breathing [^.]+\.[^.]+\./) || [''])[0]);
    ok(/Balban and colleagues' 2023 trial/.test(C) && /doctor or therapist can help/.test(C) && /Heart Coherence/.test(await t(p, '#scCard .sc-alt')), 'its evidence, a word about getting help, and the longer alternative');
    ok(/Your heart reads more stressed than you feel/.test(await explain(p, 'stress')), 'the explanation says the two disagree');
    await p.click('#scGo'); await p.waitForTimeout(400);
    ok(await E(p, () => location.hash === '#practice/calm-reset' && JSON.parse(localStorage.getItem('entrain.pCh.calm-reset') || '{}').beat === 'theta'), 'its button opens Calm Reset with the theta beat chosen');
    await p.close();
    // C4. RMSSD fine, but resting heart rate 12 above your usual: high, from the heart rate
    p = await page({ speed: 10, rr: true }, base3(v * 0.5, 64), null, { __hrAmp: 8, __hrBase: 76 });
    ok(await check(p, 5), 'C4 ran');
    ts = await tiles(p); C = await card(p);
    ok(/^Stress level High from your heart and your rating$/.test(tile(ts, 'Stress level')) && /^Resting heart rate 7[4-8] bpm while measuring \+1[0-4] on your usual$/.test(tile(ts, 'Resting heart rate')),
      'high, from a resting heart rate above your usual: ' + tile(ts, 'Resting heart rate'));
    ok(/Practice Calm Reset, 10 min/.test(C) && /Binaural beat Alpha to theta/.test(C) && /Heart Coherence/.test(await t(p, '#scCard .sc-alt')), 'high: Calm Reset with its alpha-to-theta slide');
    await p.close();
  }

  /* ---------- D. a re-check after a practice: what changed, kept out of the baseline ---------- */
  if ((!only || only === 'D') && v) {
    const h = base3(v, 64).concat([past(25 * MIN, Math.round(v * 0.6), 70, { felt: 7 }), { k: 'practice', id: 'calm-reset', n: 'Calm Reset', at: Date.now() - 10 * MIN, secs: 600, full: true }]);
    const p = await page({ speed: 10, rr: true }, h, null, { __hrAmp: 8 });
    ok(await check(p, 3), 'D ran');
    const since = await tb(p, '.sc-since');
    ok(/^Since your check at .+, after Calm Reset: RMSSD \d+ → \d+ ms, resting heart rate 70 → 6\d bpm, felt stress 7 → 3\. Your heart reads calmer than it did\.$/.test(since), 'what changed since the last check: ' + since);
    ok(/came within half an hour of Calm Reset, so it shows what that changed and isn't added to your baseline/.test(await explain(p, 'stress')), 'the re-check says it stays out of the baseline');
    const b = await E(p, () => window.__entrain.scBaseline());
    ok(b.nRm === 4 && b.nHr === 4 && (await hist(p)).length === 5, 'the baseline keeps the four checks at rest, not the re-check: ' + JSON.stringify(b));
    await p.screenshot({ path: OUT + 'stress-recheck.png', fullPage: true });
    await p.close();
  }

  /* ---------- E. a sensor that sends heart rate only ---------- */
  if (!only || only === 'E') {
    const p = await page({ speed: 10, rr: false });
    await E(p, () => location.hash = 'practice/stress-check'); await p.waitForTimeout(250);
    await p.click('#sGo'); await p.waitForTimeout(300); await p.click('#sRateG button[data-v="6"]');
    await waitFor(p, () => { const P = window.__entrain.P; return P.steps[P.idx].k === 'measure'; }, 20000); await p.waitForTimeout(1500);
    ok(await t(p, '#sSub') === 'Heart rate only from this sensor: no beat-to-beat reading', 'while measuring, it says so: ' + await t(p, '#sSub'));
    await waitFor(p, () => window.__entrain.P.state === 'done', 40000); await p.waitForTimeout(300);
    const ts = await tiles(p);
    ok(/^RMSSD — needs beat-to-beat data$/.test(tile(ts, 'RMSSD')) && /^Resting heart rate \d+ bpm while measuring baseline 1 of 3$/.test(tile(ts, 'Resting heart rate')) && !tile(ts, 'Coherence'),
      'no RMSSD or coherence, but the resting heart rate: ' + tile(ts, 'RMSSD'));
    ok(/^Stress level High from your rating$/.test(tile(ts, 'Stress level')) && /Practice Calm Reset/.test(await card(p)), 'a rating of 6: high, and Calm Reset');
    ok(/sends heart rate only, as watches do/.test(await explain(p, 'rmssd')), 'the RMSSD tile explains why it is empty');
    const e = (await hist(p))[0] || {};
    ok(e.hrAvg > 0 && e.rm === undefined && e.felt === 6, 'the history keeps its heart rate and rating, and no RMSSD');
    await p.close();
  }

  /* ---------- F. no sensor at all ---------- */
  if (!only || only === 'F') {
    let p = await page(null);
    await E(p, () => location.hash = 'practice/stress-check'); await p.waitForTimeout(250);
    await p.click('#sGo'); await p.waitForTimeout(300); await p.click('#sRateG button[data-v="8"]');
    await waitFor(p, () => { const P = window.__entrain.P; return P.steps[P.idx].k === 'measure'; }, 3000).then(async x => { if (!x) await E(p, () => { const P = window.__entrain.P; P.t0 -= 50; }); });
    await waitFor(p, () => { const P = window.__entrain.P; return P.steps[P.idx].k === 'measure'; }, 5000);
    ok(await t(p, '#sSub') === 'No sensor: connect one from the heart at the top', 'while measuring without a sensor: ' + await t(p, '#sSub'));
    await E(p, () => { const P = window.__entrain.P; P.t0 -= P.total; }); await waitFor(p, () => window.__entrain.P.state === 'done', 5000); await p.waitForTimeout(300);
    let ts = await tiles(p);
    ok(/^Stress level Very high from your rating$/.test(tile(ts, 'Stress level')) && /^RMSSD — no beat-to-beat data$/.test(tile(ts, 'RMSSD')) && !tile(ts, 'Resting heart rate'), 'from the rating alone: ' + tile(ts, 'Stress level'));
    ok(/Practice Calm Reset/.test(await card(p)) && /Binaural beat Theta 6 Hz/.test(await card(p)), 'a rating of 8: very high, and Calm Reset under theta');
    await p.close();
    // nothing to go on: no rating and no sensor
    p = await page(null);
    await E(p, () => location.hash = 'practice/stress-check'); await p.waitForTimeout(250);
    await p.click('#sGo'); await p.waitForTimeout(300); await p.click('#sRateSkip'); await p.waitForTimeout(300);
    await E(p, () => { const P = window.__entrain.P; P.t0 -= P.total; }); await waitFor(p, () => window.__entrain.P.state === 'done', 5000); await p.waitForTimeout(300);
    ts = await tiles(p);
    ok(/^Stress level — from no rating or heart level$/.test(tile(ts, 'Stress level')) && /nothing to go on this time/.test(await card(p)) && /Practice Calm Reset/.test(await card(p)), 'with nothing to go on, a general suggestion that says so');
    await p.close();
  }

  /* ---------- G. an unsteady signal, and a pause while measuring ---------- */
  if (!only || only === 'G') {
    let p = await page({ speed: 10, rr: true }, null, null, { __hrAmp: 8, __rrJitter: 0.9 });
    ok(await check(p, 3), 'G1 ran');
    const ts = await tiles(p), e = (await hist(p))[0] || {};
    ok(/^RMSSD — signal too unsteady$/.test(tile(ts, 'RMSSD')) && e.rm === undefined, 'a shaky signal gives no RMSSD and adds none to the baseline: ' + tile(ts, 'RMSSD'));
    ok(/too unsteady for a fair reading/.test(await explain(p, 'rmssd')), 'and says what to do about it');
    await p.close();
    p = await page({ speed: 10, rr: true }, null, null, { __hrAmp: 8 });
    await E(p, () => location.hash = 'practice/stress-check'); await p.waitForTimeout(250);
    await p.click('#sGo'); await p.waitForTimeout(300); await p.click('#sRateG button[data-v="3"]');
    await waitFor(p, () => { const P = window.__entrain.P; return P.steps[P.idx].k === 'measure'; }, 20000); await p.waitForTimeout(3000);
    await p.click('#sPlay'); await p.waitForTimeout(4000); await p.click('#sPlay');          // 40 s of the stand-in's clock on pause
    await waitFor(p, () => window.__entrain.P.state === 'done', 40000); await p.waitForTimeout(300);
    const S = await E(p, () => { const sc = window.__entrain.SC(); return { n: sc.beats.length, mono: sc.beats.every((b, i) => !i || b.pt > sc.beats[i - 1].pt) }; });
    ok(S.mono && S.n >= 100 && S.n <= 128, 'beats that came in while paused are left out (' + S.n + ' kept, about one a second for two minutes)');
    await p.close();
  }

  /* ---------- H. five minutes, and the end screen at 360 px ---------- */
  if ((!only || only === 'H') && v) {
    const p = await page({ speed: 20, rr: true }, base3(v, 64), { width: 360, height: 780 }, { __hrAmp: 8 });
    ok(await check(p, 2, 6), 'H ran');
    const r = await E(p, () => { const S = window.__entrain.P.def && document.querySelector('#scCard'); return { w: document.documentElement.scrollWidth, card: !!S }; });
    const sc = await E(p, () => window.__entrain.SC().beats.length);
    ok(sc >= 270 && sc <= 310 && /% of your usual/.test(tile(await tiles(p), 'RMSSD')), 'five minutes measured: ' + sc + ' beats');
    ok(r.card && r.w <= 360, 'nothing too wide at 360 px: ' + r.w);
    await p.screenshot({ path: OUT + 'stress-360.png', fullPage: true });
    await p.close();
  }
  } catch (e) { log.push('ERROR ' + (e.stack || e.message)); }
  await browser.close();
  console.log(log.join('\n'));
  console.log(log.filter(l => l.startsWith('PASS')).length + ' passed, ' + log.filter(l => /^(FAIL|PAGEERROR|ERROR|CONSOLE)/.test(l)).length + ' problems');
  process.exit(log.some(l => /^(FAIL|PAGEERROR|ERROR|CONSOLE)/.test(l)) ? 1 : 0);
})();
