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
const step = p => p.evaluate(() => { const P = window.__entrain.P; const s = P.steps[P.idx]; return s ? s.title : ''; });
const E = (p, f, a) => p.evaluate(f, a);
async function until(p, secs, max = 240000) { const t0 = Date.now(); while (Date.now() - t0 < max) { if (await T(p) >= secs) return true; await p.waitForTimeout(80); } return false; }
async function untilStep(p, re, max = 120000) { const t0 = Date.now(); while (Date.now() - t0 < max) { if (re.test(await step(p))) return true; await p.waitForTimeout(80); } return false; }
async function waitFor(p, fn, max = 8000, arg) { const t0 = Date.now(); while (Date.now() - t0 < max) { if (await p.evaluate(fn, arg)) return true; await p.waitForTimeout(100); } return false; }
async function jumpTo(p, re) { for (let i = 0; i < 60; i++) { if (re.test(await step(p))) return true; if (await p.$eval('#sNext', b => b.disabled)) return false; await p.click('#sNext'); await p.waitForTimeout(60); } return false; }
(async () => {
  const browser = await chromium.launch();
  const log = []; const ok = (c, m) => log.push((c ? 'PASS ' : 'FAIL ') + m);
  const page = async (opts, st, vp, extra) => {
    const ctx = await browser.newContext(Object.assign({ userAgent: S20, viewport: vp || { width: 412, height: 915 }, deviceScaleFactor: 2, isMobile: !vp, hasTouch: !vp }, extra || {}));
    const p = await ctx.newPage();
    p.on('pageerror', e => log.push('PAGEERROR ' + e.message + ' @ ' + (e.stack || '').split('\n').slice(1, 3).join(' ')));
    p.on('console', m => { if (m.type() === 'error') log.push('CONSOLE ' + m.text()); });
    await p.addInitScript(s => {
      localStorage.setItem('entrain.debug', '1'); localStorage.setItem('entrain.stereo', '1');
      for (const k in s) localStorage.setItem('entrain.' + k, s[k]);
      window.__said = [];
      if (window.speechSynthesis) { speechSynthesis.speak = u => window.__said.push({ t: u.text, v: u.volume }); speechSynthesis.cancel = () => {}; }
    }, st || {});
    if (opts) await p.addInitScript(mock, opts);
    await p.goto(URL0);
    return p;
  };
  const OPT = (o) => ({ pOpt: JSON.stringify(Object.assign({ voice: true, bells: true, cues: 'tones', visual: 'circle', audio: false, voiceName: '', ana: 180, rhythm: true }, o || {})) });
  try {
  /* ---------- O. moving figures, capoeira and the berimbau ---------- */
  if (!only || only === 'O') {
    const p = await page({ speed: 1, rr: false }, OPT());
    await p.evaluate(() => location.hash = 'practice'); await p.waitForTimeout(250);
    const cards = await p.$$eval('#prLib .pc-a', a => a.map(x => x.getAttribute('href')));
    const sec = await p.evaluate(() => ['morning-stretch', 'evening-stretch', 'solo-capoeira'].map(id => document.querySelector('a[href="#practice/' + id + '"]').closest('.pr-grp').dataset.g).join(','));
    ok(['#practice/morning-stretch', '#practice/evening-stretch', '#practice/solo-capoeira', '#yoga'].every(h => cards.includes(h)) && sec === 'energy,sleep,energy', 'the library lists the three routines under their goals, and the builder: ' + sec);
    ok(/Routine builder/.test(await t(p, '.pc-build')) && /capoeira moves/.test(await t(p, '.pc-build')), 'builder card: ' + (await t(p, '.pc-build .pc-blurb')).slice(0, 70));
    const meta = await t(p, 'a[href="#practice/solo-capoeira"] .pc-meta');
    ok(/Berimbau/.test(meta) && /18 min/.test(meta) && /Cautions/.test(meta), 'capoeira card meta: ' + meta);
    await p.evaluate(() => location.hash = 'practice/solo-capoeira'); await p.waitForTimeout(250);
    const need = await t(p, '.si-need');
    ok(/Room to move/.test(need) && await p.$('#sOptRhy') && await p.$eval('#sOptRhy', e => e.checked), 'intro: room to move, berimbau toggle on: ' + need.slice(0, 60));
    ok(/animated/.test(await t(p, '.si-main > p')) && /berimbau/.test(await t(p, '.si-main > p')), 'how text mentions animated drawings and berimbau');
    ok((await p.$$eval('.so-amb [data-amb]', b => b.map(x => x.textContent))).join('/') === 'Off/Rain/Crickets/Both', 'intro has the background sound row');
    await p.screenshot({ path: OUT + 'cap-intro.png', fullPage: true });
    await p.click('#sGo'); await p.waitForTimeout(400);
    ok(await vis(p, '#sqRhy') && await vis(p, '#sqAmb'), 'quick row shows Berimbau and Background');
    await jumpTo(p, /^Neck Rolls$/); await p.waitForTimeout(300);
    const f1 = await p.$eval('#sFig', e => e.innerHTML); await p.waitForTimeout(700); const f2 = await p.$eval('#sFig', e => e.innerHTML);
    ok(f1 !== f2 && /<svg class="pose/.test(f2), 'neck rolls figure animates');
    ok(await E(p, () => !window.__entrain.RHY.on) && /keep it flowing/.test(await t(p, '#sSub')), 'no berimbau during the warm-up; sub: ' + await t(p, '#sSub'));
    await jumpTo(p, /^Ginga$/); await p.waitForTimeout(400);
    ok(await waitFor(p, () => window.__entrain.RHY.on, 4000), 'berimbau starts on the ginga');
    ok(/with the berimbau/.test(await t(p, '#sSub')), 'ginga sub: ' + await t(p, '#sSub'));
    const frames = [];
    for (let i = 0; i < 6; i++) { frames.push(await p.$eval('#sFig', e => e.innerHTML.length + ':' + e.innerHTML.slice(200, 260))); await p.waitForTimeout(450); }
    ok(new Set(frames).size >= 4, 'ginga figure moves: ' + new Set(frames).size + ' distinct frames of 6');
    await p.screenshot({ path: OUT + 'cap-ginga.png' });
    // the beat: phase is locked to the bar grid
    const ph = await E(p, () => { const X = window.__entrain, s = X.P.steps[X.P.idx]; return X.pMovePhase(X.ASANA.ginga, s, s.at + 0.01); });
    ok(ph === 0 || ph < 0.01, 'a move starts on a bar line (phase at step start ' + ph + ')');
    await p.click('#sqRhy'); await p.waitForTimeout(300);
    ok(await E(p, () => !window.__entrain.RHY.on && !window.__entrain.P.opt.rhythm) && /own rhythm/.test(await t(p, '#sSub')), 'Berimbau quick toggle stops it: ' + await t(p, '#sSub'));
    await p.click('#sqRhy'); await p.waitForTimeout(400);
    ok(await E(p, () => window.__entrain.RHY.on), 'and starts it again');
    await p.click('#sPlay'); await p.waitForTimeout(300);
    ok(await E(p, () => !window.__entrain.RHY.on), 'pause stops the berimbau');
    await p.click('#sPlay'); await p.waitForTimeout(500);
    ok(await E(p, () => window.__entrain.RHY.on), 'resume restarts it');
    const sync = await E(p, () => { const R = window.__entrain.RHY, X = window.__entrain, T = performance.now() / 1000 - X.P.t0; return Math.abs((X.A.ctx.currentTime - R.ct0) - (T - R.T0)); });
    ok(sync < 0.08, 'berimbau locked to the practice clock (offset ' + sync.toFixed(3) + ' s)');
    await jumpTo(p, /^Meia-Lua/); await p.waitForTimeout(500);
    await p.screenshot({ path: OUT + 'cap-meialua.png' });
    ok(await E(p, () => window.__entrain.RHY.on), 'still playing through the kicks');
    await jumpTo(p, /^Standing Quad Stretch, right$/); await p.waitForTimeout(400);
    ok(await waitFor(p, () => !window.__entrain.RHY.on, 3000), 'berimbau stops for the cool-down');
    const st1 = await p.$eval('#sFig', e => e.innerHTML); await p.waitForTimeout(500);
    ok(st1 === await p.$eval('#sFig', e => e.innerHTML) && /about \d+ slow breaths/.test(await t(p, '#sSub')), 'stretch figure is still: ' + await t(p, '#sSub'));
    await p.screenshot({ path: OUT + 'cap-quad.png' });
    // the builder
    await p.evaluate(() => location.hash = 'yoga'); await p.waitForTimeout(300);
    ok(/Movement library/.test(await t(p, '.yb-lib .yb-sh')) && (await p.$$eval('#ybCats button', b => b.map(x => x.textContent))).includes('Capoeira'), 'builder: Movement library with a Capoeira filter');
    await p.click('#ybCats button[data-cat="capoeira"]'); await p.waitForTimeout(150);
    ok(await t(p, '#ybLibN') === '7 moves' && /moving/.test(await t(p, '#ybLib li')), 'capoeira filter: ' + await t(p, '#ybLibN') + ', ' + await t(p, '#ybLib li .yb-tm'));
    await p.screenshot({ path: OUT + 'yb-capoeira.png', fullPage: true });
    await p.click('#ybCats button[data-cat="mobility"]'); await p.waitForTimeout(150);
    ok(await t(p, '#ybLibN') === '6 moves', 'mobility filter: ' + await t(p, '#ybLibN'));
    await p.click('#ybCats button[data-cat="stretch"]'); await p.waitForTimeout(150);
    ok(await t(p, '#ybLibN') === '7 stretches', 'stretches filter: ' + await t(p, '#ybLibN'));
    await p.close();
    // reduced motion steps from key to key
    const q = await page({ speed: 1, rr: false }, OPT(), null, { reducedMotion: 'reduce' });
    await q.evaluate(() => location.hash = 'practice/solo-capoeira'); await q.waitForTimeout(200); await q.click('#sGo'); await q.waitForTimeout(300);
    await jumpTo(q, /^Arm Circles$/); await q.waitForTimeout(200);
    const seen = new Set(); for (let i = 0; i < 12; i++) { seen.add(await q.$eval('#sFig', e => e.innerHTML)); await q.waitForTimeout(250); }
    ok(seen.size >= 2 && seen.size <= 5, 'reduced motion: arm circles shows a few key poses (' + seen.size + ' distinct in 3 s)');
    await q.close();
  }

  /* ---------- P. background sound ---------- */
  if (!only || only === 'P') {
    const p = await page({ speed: 1, rr: false }, OPT());
    await p.evaluate(() => location.hash = 'breathe'); await p.waitForTimeout(250);
    await p.click('#bAdjust'); await p.waitForTimeout(300);
    ok((await p.$$eval('#bPanel [data-amb]', b => b.map(x => x.textContent))).join('/') === 'Off/Rain/Crickets/Both', 'breathing settings have a background row');
    await p.click('#bPanel [data-amb="rain"]');
    ok(await waitFor(p, () => window.__entrain.AMB.playing === 'rain', 5000), 'picking Rain previews it');
    ok(await E(p, () => localStorage.getItem('entrain.amb') === 'rain' && window.__entrain.AM.w instanceof Worker), 'choice stored; rendered in a worker');
    ok(await vis(p, '#bPanel .amb-volrow'), 'volume row appears');
    ok(await waitFor(p, () => window.__entrain.AMB.playing === null, 8000), 'preview ends after about five seconds');
    await p.click('#bPanelDone'); await p.waitForTimeout(300);
    await p.click('#bStart'); await p.waitForTimeout(300);
    ok(await waitFor(p, () => window.__entrain.AMB.playing === 'rain', 3000), 'rain plays with a breathing session');
    await p.click('#bStart'); await p.waitForTimeout(900);
    ok(await E(p, () => window.__entrain.AMB.playing === null), 'and stops when it pauses');
    ok(await p.$eval('.amb-sel', s => s.value) === 'rain', 'mini player picker in step: rain');
    await p.$eval('.amb-sel', s => { s.value = 'night'; s.dispatchEvent(new Event('change', { bubbles: true })); });
    await p.waitForTimeout(200);
    ok(await E(p, () => window.__entrain.AMB.kind === 'night') && await p.$eval('#bPanel [data-amb="night"]', b => b.getAttribute('aria-pressed')) === 'true', 'player picker updates the chips');
    ok(await waitFor(p, () => window.__entrain.AMB.playing === 'night', 6000), 'rain and crickets preview (three loops)');
    const lv = await E(p, () => window.__entrain.AMB.srcs.length);
    ok(lv === 3, 'three looping layers: ' + lv);
    await p.evaluate(() => location.hash = 'practice/calm-reset'); await p.waitForTimeout(250);
    await p.click('#sGo'); await p.waitForTimeout(400);
    await p.click('#sqAmb'); await p.waitForTimeout(150);
    ok(await E(p, () => window.__entrain.AMB.kind === 'off') && await t(p, '#sqAmbTxt') === 'Background', 'quick button cycles night → off');
    await p.click('#sqAmb'); await p.waitForTimeout(200);
    ok(await E(p, () => window.__entrain.AMB.kind === 'rain') && await t(p, '#sqAmbTxt') === 'Rain' && await vis(p, '#sqAmbVolRow'), 'then rain, with a volume slider in the quick row');
    ok(await waitFor(p, () => window.__entrain.AMB.playing === 'rain', 3000), 'plays during the practice');
    await p.$eval('#sqAmbVolRow input', i => { i.value = 80; i.dispatchEvent(new Event('input', { bubbles: true })); });
    ok(await E(p, () => window.__entrain.AMB.vol === 80 && localStorage.getItem('entrain.ambVol') === '80'), 'volume stored');
    await p.screenshot({ path: OUT + 'amb-session.png' });
    await p.close();
  }
  /* ---------- Q. quotes ---------- */
  if (!only || only === 'Q') {
    let p = await page({ speed: 1, rr: false }, OPT());
    await p.waitForTimeout(300);
    ok(await t(p, '#qTxt') === 'A balanced mind perceives the most subtle sensations.' && await t(p, '#qBy') === 'Vipassana teaching', 'first visit opens on the balanced-mind line');
    await p.screenshot({ path: OUT + 'home-quote.png' });
    await p.click('#qNext'); await p.waitForTimeout(100);
    const q2 = await t(p, '#qTxt');
    ok(/fountain of good/.test(q2) && await t(p, '#qBy') === 'Marcus Aurelius, Meditations', 'Another shows the next: ' + q2.slice(0, 40));
    await p.close();
    const p2 = await page({ speed: 1, rr: false }, Object.assign(OPT(), { qSeen: '1' }));
    await p2.waitForTimeout(300);
    const exp = await p2.evaluate(() => { const X = window.__entrain; return X.QUOTES[X.qDay() % X.QUOTES.length][0]; });
    ok(await t(p2, '#qTxt') === exp, 'later visits show the quote of the day: ' + exp.slice(0, 40));
    // the end screen
    p = p2;
    await p.evaluate(() => location.hash = 'practice/grounding'); await p.waitForTimeout(200);
    await p.click('#sGo'); await p.waitForTimeout(300);
    await p.evaluate(() => { const P = window.__entrain.P; P.t0 -= P.total + 5; }); await p.waitForTimeout(600);
    ok(await vis(p, '#sDone .sd-quote') && /Read aloud/.test(await t(p, '#sDone .q-say')), 'end screen closes with a quote and a Read aloud button');
    const said0 = await p.evaluate(() => window.__said.length);
    await p.click('#sDone .q-say'); await p.waitForTimeout(200);
    const said = await p.evaluate(() => window.__said.slice(-1)[0]);
    ok(said && said.t === await p.$eval('#sDone .q-say', b => b.dataset.say), 'Read aloud speaks it: ' + (said ? said.t.slice(0, 50) : 'nothing'));
    await p.screenshot({ path: OUT + 'done-quote.png', fullPage: true });
    await p.close();
  }
  /* ---------- R. tapping ---------- */
  if (!only || only === 'R') {
    const p = await page({ speed: 6, rr: false }, OPT());
    await p.evaluate(() => location.hash = 'practice'); await p.waitForTimeout(250);
    ok(await p.$('.pr-grp[data-g="calm"] a[href="#practice/tapping"]') !== null, 'Tapping is listed under Calm');
    await p.evaluate(() => location.hash = 'practice/tapping'); await p.waitForTimeout(250);
    await opts(p);
    ok((await p.$$eval('#sOptVar button', b => b.map(x => x.textContent))).join('/') === '2/3' && await vis(p, '#sTapPhrase') && await vis(p, '#sOptTick'), 'intro: rounds, phrase and tick');
    await p.fill('#sTapPhrase', 'this tight chest'); await p.waitForTimeout(100);
    ok(await p.evaluate(() => localStorage.getItem('entrain.tapPhrase')) === 'this tight chest', 'phrase stored');
    await p.screenshot({ path: OUT + 'tap-intro.png', fullPage: true });
    await p.click('#sGo'); await p.waitForTimeout(400);
    ok(await vis(p, '#sFig .tapfig') && await p.$('#sFig .tp.on') === null, 'Get set shows the figure with no point lit');
    await untilStep(p, /^How strong is it\?$/);
    await p.waitForTimeout(200);
    ok(await vis(p, '#sRate') && (await p.$$('#sRateG button')).length === 11 && !(await vis(p, '#sFig')), 'rating: eleven buttons, figure hidden');
    await p.screenshot({ path: OUT + 'tap-rate.png' });
    await p.click('#sRateG button[data-v="7"]'); await p.waitForTimeout(900);
    ok(await step(p) === 'Set-up' && await t(p, '#sCap') === 'Side of the hand', 'tapping 7 moves on to the set-up');
    await p.waitForTimeout(1200);
    const said = (await p.evaluate(() => window.__said.map(x => x.t))).join(' | ');
    ok(/Even though I have this tight chest, I deeply and completely accept myself\./.test(said), 'set-up statement uses the phrase');
    ok(await p.$eval('#sFig g[data-p="hand"] .tp', c => c.classList.contains('on')), 'side of the hand lit');
    await untilStep(p, /^Round 1$/);
    await until(p, await p.evaluate(() => { const P = window.__entrain.P; return P.steps[P.idx].at + P.steps[P.idx].lead + 7 + 1; }));
    for (let i = 0; i < 30 && !/Point 2 of 8/.test(await t(p, '#sSub')); i++) await p.waitForTimeout(100);   // the words move on with the practice's tick, five times a second
    ok(await t(p, '#sCap') === 'Eyebrow' && /Point 2 of 8/.test(await t(p, '#sSub')) && await p.$eval('#sFig g[data-p="brow"] .tp', c => c.classList.contains('on')) && await p.$eval('#sFig g[data-p="head"] .tp', c => c.classList.contains('done')), 'round 1 moves to the eyebrow, head marked done: ' + await t(p, '#sSub'));
    await p.screenshot({ path: OUT + 'tap-round.png' });
    const said2 = (await p.evaluate(() => window.__said.map(x => x.t))).join(' | ');
    ok(/Eyebrow\. This tight chest\./.test(said2), 'point name and phrase spoken');
    await untilStep(p, /^How strong now\?$/); await p.waitForTimeout(200);
    await p.click('#sRateG button[data-v="4"]'); await p.waitForTimeout(900);
    await untilStep(p, /^Round 2$/); await p.waitForTimeout(3000);
    const said3 = (await p.evaluate(() => window.__said.map(x => x.t))).join(' | ');
    ok(/Even though I still have some of this tight chest/.test(said3) && /This remaining tight chest\./.test(said3), 'round 2 wording: still have some of / remaining');
    await untilStep(p, /^And now\?$/, 200000); await p.waitForTimeout(200);
    await p.click('#sRateG button[data-v="2"]'); await p.waitForTimeout(800);
    ok(await step(p) === 'Closing', 'final rating goes to the close');
    await p.evaluate(() => { const P = window.__entrain.P; P.t0 -= P.total; }); await p.waitForTimeout(600);
    const tiles = await p.$$eval('.sd-t', x => x.map(e => e.textContent));
    ok(tiles.some(x => /Intensity7 → 4 → 2out of 10, first to last/.test(x)), 'summary shows intensity 7 → 4 → 2: ' + tiles.join(' | '));
    await p.screenshot({ path: OUT + 'tap-done.png', fullPage: true });
    // finishing another practice with tapping
    await p.evaluate(() => location.hash = 'practice/sleep-descent'); await p.waitForTimeout(250);
    ok(await p.$('#sOptTap') === null, 'not offered for Sleep Descent');
    await p.evaluate(() => location.hash = 'practice/calm-reset'); await p.waitForTimeout(250);
    ok(await p.$('#sOptTap') !== null && !(await p.$eval('#sOptTap', e => e.checked)) && !(await vis(p, '#sTapPhrase')), 'Calm Reset offers Finish with tapping, off');
    const n0 = (await p.$$('.si-steps li')).length;
    await opts(p);
    await p.click('label:has(#sOptTap)'); await p.waitForTimeout(300);
    const rows = await p.$$eval('.si-steps li span', x => x.map(e => e.textContent));
    ok(await p.$eval('#sOptTap', e => e.checked) && await vis(p, '#sTapPhrase') && rows.includes('Tapping round') && rows.length === n0 + 6, 'on: phrase shows, six tapping steps appended (' + n0 + ' → ' + rows.length + ')');
    const pl = await p.evaluate(() => { const X = window.__entrain, pl = X.pPlan(X.pDef('calm-reset'), 0); return [pl.base, pl.total]; });
    ok(pl[0] === 600 && pl[1] > 600, 'plan: base 600 s, total ' + pl[1]);
    await p.close();
  }
  /* ---------- S. heart-led beats ---------- */
  if (!only || only === 'S') {
    const p = await page({ speed: 6, rr: true }, OPT({ audio: true, ana: 0 }));
    await p.click('#tbSensor'); await p.waitForTimeout(200); await p.click('#hrConnect'); await p.waitForTimeout(600);
    await p.evaluate(() => location.hash = 'practice'); await p.waitForTimeout(250);
    ok(/Experimental/.test(await t(p, 'a[href="#practice/heart-led"] .pc-meta')), 'card is marked Experimental');
    await p.evaluate(() => location.hash = 'practice/heart-led'); await p.waitForTimeout(250);
    ok(/Calm · Programme · Experimental · 20 min/.test(await t(p, '.si-kind')) && (await p.$$eval('.si-len button', b => b.map(x => x.textContent))).join('/') === '15 min/20 min/30 min', 'intro: ' + await t(p, '.si-kind'));
    ok(/the beat follows it/.test(await t(p, '.si-need')) && await p.$('#sOptAudio') !== null, 'needs: sensor drives the beat; binaural toggle');
    await p.click('.si-len button[data-len="15"]'); await p.waitForTimeout(200);
    await p.click('#sGo'); await p.waitForTimeout(800);
    ok(await E(p, () => { const A = window.__entrain.A; return A.track && A.track.dyn && A.track.cur === 10; }), 'live track loaded at 10 Hz');
    await untilStep(p, /Listening to your heart/); await p.waitForTimeout(1500);
    ok(/Measuring your resting heart rate/.test(await t(p, '#sSub')) && await E(p, () => window.__entrain.A.track.cur === 10), 'baseline: beat holds at 10 Hz: ' + await t(p, '#sSub'));
    await untilStep(p, /Heart-led beat/);
    await p.evaluate(() => window.__hrBase = 56);
    await p.waitForTimeout(9000);
    const ad = await E(p, () => { const X = window.__entrain; return { cur: X.A.track.cur, src: X.AD.src, base: X.AD.base && Math.round(X.AD.base.hr), calm: X.AD.calm, osc: X.A.oscR ? X.A.oscR.frequency.value - X.A.track.carrier : null }; });
    ok(ad.src === 'heart' && ad.base >= 62 && ad.base <= 66 && ad.cur < 9.2, 'heart rate 8 bpm under baseline pulls the beat down: ' + JSON.stringify(ad));
    ok(ad.osc !== null && Math.abs(ad.osc - ad.cur) < 0.6, 'the right ear follows (' + (ad.osc && ad.osc.toFixed(2)) + ' Hz)');
    ok(/Following your heart · baseline \d+ bpm/.test(await t(p, '#sSub')) && /Hz/.test(await t(p, '#sLive')), 'caption and beat chip: ' + await t(p, '#sSub') + ' | ' + await t(p, '#sLive'));
    await p.screenshot({ path: OUT + 'hl-run.png' });
    const steps = await E(p, () => window.__entrain.AD.log.slice(-6).map(x => x.hz));
    ok(steps.every((v, i) => !i || Math.abs(v - steps[i - 1]) <= 0.151), 'slew limit 0.15 Hz per update: ' + steps.join(', '));
    await p.evaluate(() => { const P = window.__entrain.P; P.t0 -= P.total; }); await p.waitForTimeout(800);
    const tiles = await p.$$eval('.sd-t', x => x.map(e => e.textContent));
    ok(tiles.some(x => /^Beat10\.0 → \d\.\dHz, led by your heart$/.test(x)), 'summary: ' + tiles.join(' | '));
    ok(/with the beat in violet/.test(await t(p, '.sd-chart span')), 'chart shows the beat');
    ok(tiles.some(x => /^Heart rate\d+ → \d+bpm, start to end$/.test(x)) && !tiles.some(x => /→ 0bpm/.test(x)), 'heart rate tile uses the last readings, never 0');
    ok(await waitFor(p, () => !document.querySelector('#player').classList.contains('open'), 6000), 'mini player is put away after the practice sound fades');
    await p.screenshot({ path: OUT + 'hl-done.png', fullPage: true });
    await p.close();
    // no sensor: a scripted descent
    const q = await page({ speed: 6, rr: false }, OPT({ audio: false, ana: 0 }));
    await q.evaluate(() => location.hash = 'practice/heart-led'); await q.waitForTimeout(250);
    await q.click('.si-len button[data-len="15"]'); await q.waitForTimeout(200);
    await q.click('#sGo'); await q.waitForTimeout(300);
    await untilStep(q, /Heart-led beat/); await q.waitForTimeout(12000);
    const a2 = await E(q, () => ({ cur: window.__entrain.AD.cur, src: window.__entrain.AD.src }));
    ok(a2.src === 'script' && a2.cur < 10 && a2.cur > 8, 'no sensor: scripted descent (' + a2.cur + ' Hz)');
    ok(/scripted descent/.test(await t(q, '#sSub')), 'caption says so: ' + await t(q, '#sSub'));
    await q.close();
  }

  /* ---------- T. the power nap ---------- */
  if (!only || only === 'T') {
    const p = await page({ speed: 30, rr: true }, OPT({ audio: true }));
    await p.click('#tbSensor'); await p.waitForTimeout(200); await p.click('#hrConnect'); await p.waitForTimeout(600);
    await p.evaluate(() => location.hash = 'practice/power-nap'); await p.waitForTimeout(250);
    ok((await p.$$eval('.si-len button', b => b.map(x => x.textContent))).join('/') === '10 min nap/20 min nap/30 min nap' && /up to 48 min/.test(await t(p, '.si-kind')), 'intro: nap lengths, ' + await t(p, '.si-kind'));
    ok(/times the nap from when your heart rate/.test(await t(p, '.si-need')) && !(await p.$('#sOptTap')), 'sensor need explained; no tapping offered');
    await p.click('.si-len button[data-len="10"]'); await p.waitForTimeout(200);
    await p.click('#sGo'); await p.waitForTimeout(400);
    await untilStep(p, /^Nap$/);
    await p.waitForTimeout(500);
    ok(await t(p, '#sCap') === 'Resting' && /Measuring your resting heart rate/.test(await t(p, '#sSub')) && !(await p.$eval('#ses', e => e.dataset.dim)), 'nap: measuring, screen at full brightness');
    await until(p, 45 + 175);
    ok(/Baseline 6\d bpm · listening for sleep/.test(await t(p, '#sSub')), 'baseline set: ' + await t(p, '#sSub'));
    ok(await E(p, () => window.__entrain.NP().wake - window.__entrain.P.steps[1].at) === 1200, 'with a sensor and no sign of sleep, wake at 20 min');
    const b1 = await E(p, () => window.__entrain.A.track.cur);
    ok(b1 < 6 && b1 > 3, 'beat slides from 6 Hz toward 3: ' + b1);
    await p.evaluate(() => window.__hrBase = 57);
    let asleep = false; for (let i = 0; i < 80 && !asleep; i++) { await p.waitForTimeout(250); asleep = await E(p, () => !!window.__entrain.NP().onset); }
    const np = await E(p, () => { const N = window.__entrain.NP(), s = window.__entrain.P.steps[1]; return { on: Math.round((N.onset - s.at) / 60 * 10) / 10, wake: Math.round(N.wake - N.onset) }; });
    ok(asleep && np.wake === 600 && await t(p, '#sCap') === 'Asleep (estimated)', 'heart rate 7 below baseline for 3 min: asleep at ' + np.on + ' min, wake 10 min later');
    await p.screenshot({ path: OUT + 'nap-asleep.png' });
    const tot0 = await E(p, () => window.__entrain.P.total);
    await untilStep(p, /^Waking up$/, 120000); await p.waitForTimeout(400);
    const tot1 = await E(p, () => window.__entrain.P.total);
    ok(tot1 < tot0 - 60, 'the nap step gave back its unused time (' + Math.round(tot0) + ' → ' + Math.round(tot1) + ' s)');
    await p.waitForTimeout(1500);
    ok(await E(p, () => window.__entrain.A.track.cur) > 6 && !(await p.$eval('#ses', e => e.dataset.dim)), 'waking: screen bright, beat rising (' + await E(p, () => window.__entrain.A.track.cur) + ' Hz)');
    await p.screenshot({ path: OUT + 'nap-wake.png' });
    await untilStep(p, /^Up slowly$/, 60000);
    await p.evaluate(() => { const P = window.__entrain.P; P.t0 -= 60; }); await p.waitForTimeout(800);
    const tiles = await p.$$eval('.sd-t', x => x.map(e => e.textContent));
    ok(tiles.some(x => /^Fell asleepafter \d+ minestimated from heart rate$/.test(x)) && tiles.some(x => /^Nap1[01] minof sleep, estimated$/.test(x)) && tiles.some(x => /^Heart rate6\d → 5\dbpm, baseline to lowest$/.test(x)) && tiles.filter(x => /^Heart rate/.test(x)).length === 1 && !tiles.some(x => /^Coherence/.test(x)), 'summary: ' + tiles.join(' | '));
    ok(await waitFor(p, () => !window.__entrain.A.playing, 5000), 'sound stops with the practice');
    await p.screenshot({ path: OUT + 'nap-done.png', fullPage: true });
    await p.close();
    const q = await page({ speed: 30, rr: false }, OPT({ audio: false }));
    await q.evaluate(() => location.hash = 'practice/power-nap'); await q.waitForTimeout(250);
    await q.click('.si-len button[data-len="10"]'); await q.waitForTimeout(200);
    await q.click('#sGo'); await q.waitForTimeout(300);
    await until(q, 45 + 180);
    ok(await E(q, () => window.__entrain.NP().wake - window.__entrain.P.steps[1].at) === 900 && /No heart data · waking at 15:00/.test(await t(q, '#sSub')), 'no sensor: wake after the nap plus five minutes: ' + await t(q, '#sSub'));
    await q.close();
  }
  /* ---------- U. nonviolent communication, self-practice ---------- */
  if (!only || only === 'U') {
    const p = await page({ speed: 6, rr: false }, OPT());
    const note = () => t(p, '#swNote');
    const next = async () => { await p.click('#sWrite [data-sw="next"]'); await p.waitForTimeout(350); };
    await p.evaluate(() => location.hash = 'practice'); await p.waitForTimeout(250);
    await p.click('#prFilt button[data-f="reflect"]'); await p.waitForTimeout(200);
    const cards = await p.$$eval('.pc-a', a => a.map(x => x.getAttribute('href')));
    ok(cards.join(',') === '#practice/nvc-self,#practice/nvc-prep,#practice/nvc-choose,#practice/self-compassion,#practice/metta,#practice/gratitude,#practice/after-talk' && /Self-paced/.test(await t(p, 'a[href="#practice/nvc-self"] .pc-meta')), 'Reflect shows the three NVC practices, then self-compassion, loving-kindness and gratitude, and After the Conversation as also good for it: ' + cards.join(','));
    await p.evaluate(() => location.hash = 'practice/nvc-self'); await p.waitForTimeout(250);
    ok(await t(p, '.si-kind') === 'Reflect · Writing · self-paced, about 15 min' && /A quiet place to write/.test(await t(p, '.si-need')) && await p.$eval('#sOptKeep', e => e.checked) && !(await p.$('#sOptTap')), 'intro: ' + await t(p, '.si-kind'));
    ok((await p.$$eval('.si-steps li time', x => x.map(e => e.textContent))).filter(x => x === 'your pace').length === 7 && await t(p, '#sGo') === 'Start', 'writing steps run at your pace');
    await p.screenshot({ path: OUT + 'nvc-intro.png', fullPage: true });
    await p.click('#sGo'); await p.waitForTimeout(300);
    ok(await t(p, '#sLeft') === 'Your pace', 'no countdown: ' + await t(p, '#sLeft'));
    await untilStep(p, /^What happened\?$/); await p.waitForTimeout(300);
    ok(await vis(p, '#sWrite textarea') && !(await vis(p, '#sCap')) && await p.$eval('#ses', e => e.dataset.write) === '1', 'writing panel replaces the caption');
    await p.fill('#sWrite textarea', 'She never listens and ignored me at dinner'); await p.waitForTimeout(150);
    ok(/never.*ignored/.test(await note()), 'judgment check flags never and ignored: ' + await note());
    await p.fill('#sWrite textarea', 'At dinner, she looked at her phone while I was telling her about my day'); await p.waitForTimeout(150);
    ok(await note() === 'Reads like an observation.', 'a clean observation passes');
    await p.screenshot({ path: OUT + 'nvc-obs.png' });
    await next();
    await p.fill('#sWrite textarea', 'She should care about my day. She always does this. I am boring.'); await p.waitForTimeout(150);
    ok(/should.*always.*boring|always.*should.*boring/.test(await note()), 'shoulds, absolutes and labels named: ' + await note());
    await next();
    ok(await step(p) === 'Question one rule' && (await p.$$eval('.sw-found button', b => b.map(x => x.textContent))).includes('should'), 'the rule step offers your own shoulds');
    await p.click('.sw-found button[data-pick="should"]'); await p.waitForTimeout(100);
    await p.type('#sWrite textarea', 'I learned it from my parents, who never asked.');
    ok(/^\u201Cshould\u201D: I learned it/.test(await p.$eval('#sWrite textarea', e => e.value)), 'picking one starts the questioning');
    await next();
    ok(await step(p) === 'Into the body', 'a pause in the body');
    await untilStep(p, /^Feelings$/); await p.waitForTimeout(300);
    ok((await p.$$('#sWrite .wf')).length === 11 && (await p.$$('#sWrite .wf .ww-r')).length === 88 && /Tap a\s*family/.test(await t(p, '#sWrite .nv-wheel')) && await p.$eval('#sWrite [data-view="wheel"]', b => b.getAttribute('aria-pressed')) === 'true',
      'feelings open on the wheel: 11 families, 88 words');
    await p.click('#sWrite [data-fam="6"] > path'); await p.waitForTimeout(300);
    ok((await p.$$('#sWrite .ww')).length === 8 && /Sad/.test(await t(p, '#sWrite .wc')), 'tapping Sad opens its eight words');
    await p.click('#sWrite [data-wword="hurt"] > path'); await p.click('#sWrite [data-wword="lonely"] > path'); await p.waitForTimeout(150);
    ok((await p.$$('#sWrite .ww.on')).length === 2 && (await p.$$eval('#sWrite .sw-un', b => b.map(x => x.dataset.unpick))).join(',') === 'hurt,lonely', 'hurt and lonely chosen, shown as chips');
    await p.click('#sWrite [data-wback] > circle'); await p.waitForTimeout(300);
    ok(/2\s*chosen/.test(await t(p, '#sWrite .nv-wheel')) && /2 \u2713/.test(await t(p, '#sWrite [data-fam="6"]')), 'back on the wheel: 2 chosen, marked on Sad');
    await p.screenshot({ path: OUT + 'nvc-wheel.png' });
    await p.fill('#sWrite .sw-other', 'ignored'); await p.press('#sWrite .sw-other', 'Enter'); await p.waitForTimeout(150);
    ok(/describes what someone did/.test(await note()) && await p.$('#swNote .sw-add[data-add="sad"]') !== null, 'typing "ignored" offers the feelings underneath: ' + await note());
    await p.click('#swNote .sw-add[data-add="sad"]'); await p.waitForTimeout(100);
    ok((await p.evaluate(() => window.__entrain.P.nvc.feel)).join(',') === 'hurt,lonely,sad' && (await p.$$('#sWrite .sw-un')).length === 3, 'the feeling under "ignored" replaces it: ' + (await p.evaluate(() => window.__entrain.P.nvc.feel)).join(','));
    await p.click('#sWrite [data-view="list"]'); await p.waitForTimeout(150);
    ok((await p.$$('#sWrite .sw-sets[data-f="feel"] .sw-grp')).length === 11 && await p.$eval('#sWrite button[data-f="feel"][data-v="hurt"]', b => b.getAttribute('aria-pressed')) === 'true', 'List shows the same words, with your picks');
    await p.click('#sWrite button[data-f="feel"][data-v="anxious"]'); await p.waitForTimeout(100);
    await p.screenshot({ path: OUT + 'nvc-feel.png' });
    await p.click('#sWrite [data-view="wheel"]'); await p.waitForTimeout(150);
    ok((await p.$$eval('#sWrite .sw-un', b => b.map(x => x.dataset.unpick))).join(',') === 'hurt,lonely,sad,anxious', 'back to the wheel, picks from the list included');
    await p.click('#sWrite .sw-un[data-unpick="anxious"]'); await p.waitForTimeout(100);
    ok((await p.evaluate(() => window.__entrain.P.nvc.feel)).join(',') === 'hurt,lonely,sad' && await p.evaluate(() => localStorage.getItem('entrain.nvcView')) === 'wheel', 'a chip removes its feeling; the view choice is remembered');
    await p.focus('#sWrite [data-fam="9"]'); await p.keyboard.press('Enter'); await p.waitForTimeout(300);
    const kb1 = await p.evaluate(() => document.activeElement && document.activeElement.dataset.wback);
    await p.keyboard.press('Enter'); await p.waitForTimeout(300);
    const kb2 = await p.evaluate(() => document.activeElement && document.activeElement.dataset.fam);
    ok(kb1 === '1' && kb2 === '9', 'the wheel works from the keyboard: Enter opens Afraid, Enter on the centre goes back');
    await next();
    await p.click('#sWrite button[data-f="need"][data-v="to be heard"]'); await p.click('#sWrite button[data-f="need"][data-v="closeness"]');
    await next();
    ok(await step(p) === 'Let it land', 'let it land');
    await p.waitForTimeout(1500);
    const said = (await p.evaluate(() => window.__said.map(x => x.t))).join(' | ');
    ok(/When I think of this, I feel hurt, lonely and sad, because I need closeness and to be heard\./.test(said), 'your feelings and needs read back to you');
    await untilStep(p, /^The other side$/); await p.waitForTimeout(300);
    ok(await p.$('#sWrite .sw-feel[data-f="oFeel"] .nv-wheel') !== null, 'the other side gets the wheel too');
    await p.click('#sWrite .sw-feel[data-f="oFeel"] [data-fam="4"] > path'); await p.waitForTimeout(300);
    await p.click('#sWrite .sw-feel[data-f="oFeel"] [data-wword="tired"] > path'); await p.waitForTimeout(150);
    await p.click('#sWrite button[data-f="oNeed"][data-v="rest"]');
    await next();
    await p.fill('#sWrite textarea', "Don't use your phone at dinner"); await p.waitForTimeout(150);
    ok(/what you do want/.test(await note()), 'a "don\'t" request gets a nudge');
    await p.fill('#sWrite textarea', 'Tonight I will ask her if we can keep dinner phone-free, and hear what she thinks'); await p.waitForTimeout(150);
    ok(/ready/.test(await note()), 'a doable request passes');
    // back and forth keeps what you wrote
    await p.click('#sPrev'); await p.waitForTimeout(300);
    ok(await step(p) === 'The other side' && await p.$eval('#sWrite .sw-feel[data-f="oFeel"] .sw-un', b => b.dataset.unpick) === 'tired' && await p.$eval('#sWrite button[data-f="oNeed"][data-v="rest"]', b => b.getAttribute('aria-pressed')) === 'true', 'going back keeps your picks');
    await next();
    ok(/phone-free/.test(await p.$eval('#sWrite textarea', e => e.value)), 'and your writing');
    await next();
    await untilStep(p, /^Closing$/);
    await p.evaluate(() => { const P = window.__entrain.P; P.t0 -= 60; }); await p.waitForTimeout(800);
    const card = await t(p, '.sd-nvc');
    ok(/When at dinner, she looked at her phone while I was telling her about my day, I feel hurt, lonely and sad because I need closeness and to be heard\./.test(card), 'summary sentence: ' + card.slice(0, 160));
    ok(/RequestTonight I will ask her/.test(card) && /A rule you questioned/.test(card) && /They might have felt tired and needed rest/.test(card) && /Saved on this device only/.test(card), 'request, rule and the other side');
    ok(await t(p, '.sd-quote figcaption span') === 'Carl Rogers, paraphrased' && /change starts when you accept yourself as you are/.test(await t(p, '.sd-quote blockquote')), 'closes with the Rogers line');
    await p.screenshot({ path: OUT + 'nvc-done.png', fullPage: true });
    const logd = await p.evaluate(() => JSON.parse(localStorage.getItem('entrain.nvcLog') || '[]'));
    const last = await p.evaluate(() => localStorage.getItem('entrain.history') || '');
    ok(logd.length === 1 && /phone-free/.test(logd[0].text) && /"id":"nvc-/.test(last) && !/phone|hurt|dinner/.test(last), 'kept on the device; the history leaves it out: ' + last.slice(0, 120));
    await p.click('#sdAgain'); await p.waitForTimeout(250);
    ok(/Your past reflections \(1\)/.test(await t(p, '.si-journal summary')), 'Do it again: the intro lists past reflections');
    await p.click('.si-journal summary'); await p.waitForTimeout(100);
    await p.click('.si-journal .nv-del'); await p.waitForTimeout(250);
    ok(!(await p.$('.si-journal')) && (await p.evaluate(() => JSON.parse(localStorage.getItem('entrain.nvcLog') || '[]'))).length === 0, 'and deletes them');
    // keeping nothing
    await opts(p);
    await p.click('label:has(#sOptKeep)'); await p.waitForTimeout(100);
    await p.click('#sGo'); await p.waitForTimeout(300);
    await untilStep(p, /^What happened\?$/); await p.waitForTimeout(200);
    await p.fill('#sWrite textarea', 'The meeting ran an hour late'); await p.waitForTimeout(100);
    await p.evaluate(() => { const P = window.__entrain.P; P.t0 -= P.total; }); await p.waitForTimeout(800);
    ok(/Not saved/.test(await t(p, '.sd-nvc')) && (await p.evaluate(() => JSON.parse(localStorage.getItem('entrain.nvcLog') || '[]'))).length === 0, 'with keeping off, nothing is stored');
    await p.close();
    // from should to choose
    const q = await page({ speed: 6, rr: false }, OPT());
    await q.evaluate(() => location.hash = 'practice/nvc-choose'); await q.waitForTimeout(250);
    await q.click('#sGo'); await q.waitForTimeout(300);
    await untilStep(q, /^I have to/); await q.waitForTimeout(250);
    await q.fill('#sWrite textarea', 'Answer every email the same day\nCall my mother every Sunday\nGo to the gym');
    await q.click('#sWrite [data-sw="next"]'); await q.waitForTimeout(350);
    ok((await q.$$('.sw-card')).length === 3 && /I have to answer every email the same day/.test(await t(q, '.sw-card')), 'one card per item');
    await q.click('.sw-card[data-i="0"] button[data-ch="1"]'); await q.click('.sw-card[data-i="0"] button[data-why="health"]');
    await q.fill('.sw-card[data-i="0"] .sw-in', 'calm mornings without a backlog');
    await q.click('.sw-card[data-i="1"] button[data-ch="1"]'); await q.click('.sw-card[data-i="1"] button[data-why="to avoid guilt"]'); await q.waitForTimeout(150);
    ok(/1 thing is driven at least partly by pressure/.test(await t(q, '#swNote')), 'pressure motives noticed: ' + await t(q, '#swNote'));
    await q.click('.sw-card[data-i="2"] button[data-ch="0"]'); await q.waitForTimeout(100);
    await q.screenshot({ path: OUT + 'nvc-choose.png' });
    await q.click('#sWrite [data-sw="next"]'); await q.waitForTimeout(1500);
    let said2 = '';                                   // speech is queued behind the step's own lines: give it a little longer when the machine is busy
    for (let i = 0; i < 30 && !/You chose/.test(said2); i++) { said2 = (await q.evaluate(() => window.__said.map(x => x.t))).join(' | '); if (!/You chose/.test(said2)) await q.waitForTimeout(100); }
    ok(/You chose 2 things, and you'd like to change 1 other\./.test(said2), 'the count is read back');
    await q.evaluate(() => { const P = window.__entrain.P; P.t0 -= P.total; }); await q.waitForTimeout(800);
    const items = await q.$$eval('.sd-nvc li', l => l.map(x => x.textContent));
    ok(items[0] === 'I choose to answer every email the same day because I want calm mornings without a backlog.' && items[1] === 'I choose to call my mother every Sunday because I want to avoid guilt.' && items[2] === "I'd rather not go to the gym.", 'your choices: ' + items.join(' | '));
    await q.screenshot({ path: OUT + 'nvc-choose-done.png', fullPage: true });
    await q.close();
  }
  } catch (e) { log.push('ERROR ' + e.message); }
  console.log(log.join('\n'));
  console.log(log.filter(l => l.startsWith('PASS')).length + ' passed, ' + log.filter(l => /^(FAIL|PAGEERROR|ERROR|CONSOLE)/.test(l)).length + ' problems');
  await browser.close();
})();
