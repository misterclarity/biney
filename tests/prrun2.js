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
async function until(p, secs, max = 240000) { const t0 = Date.now(); while (Date.now() - t0 < max) { if (await T(p) >= secs) return true; await p.waitForTimeout(80); } return false; }
async function untilStep(p, re, max = 120000) { const t0 = Date.now(); while (Date.now() - t0 < max) { if (re.test(await step(p))) return true; await p.waitForTimeout(80); } return false; }
(async () => {
  const browser = await chromium.launch();
  const log = []; const ok = (c, m) => log.push((c ? 'PASS ' : 'FAIL ') + m);
  const page = async (opts, st, vp) => {
    const ctx = await browser.newContext({ userAgent: S20, viewport: vp || { width: 412, height: 915 }, deviceScaleFactor: 2, isMobile: !vp, hasTouch: !vp });
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
  const NOAUDIO = (ana) => ({ pOpt: JSON.stringify({ voice: true, bells: true, cues: 'tones', visual: 'circle', audio: false, voiceName: '', ana: ana === undefined ? 180 : ana }) });
  try {
  /* ---------- K. Wim Hof ---------- */
  if (!only || only === 'K') {
    const p = await page({ speed: 6, rr: true }, NOAUDIO());
    await p.click('#tbSensor'); await p.waitForTimeout(200); await p.click('#hrConnect'); await p.waitForTimeout(400);
    await p.evaluate(() => location.hash = 'practice/wim-hof'); await p.waitForTimeout(200);
    ok(await p.$eval('#sGo', b => b.disabled) && /drowned/.test(await t(p, '.si-caution')) && await t(p, '.si-kind') === 'Energy · Breathing · up to 16 min', 'Wim Hof: water warning, Start locked, "up to" time: ' + await t(p, '.si-kind'));
    await opts(p);
    ok((await p.$$eval('.si-len button', b => b.map(x => x.textContent))).join('/') === '3 rounds/4 rounds' && (await p.$$eval('#sOptVar button', b => b.map(x => x.textContent))).join('/') === '30/40', 'rounds and breaths options');
    await p.click('#sOptVar button[data-v="40"]'); await p.waitForTimeout(150);
    const r40 = await p.evaluate(() => { const E = window.__entrain; return E.pPlan(E.pDef('wim-hof'), 3).steps[1].secs; });
    ok(r40 === 103, '40 breaths make a 103 s round (3 s lead + 40 × 2.5): ' + r40);
    await p.click('#sOptVar button[data-v="30"]'); await p.waitForTimeout(150);
    await p.check('#sOk'); await p.click('#sGo'); await p.waitForTimeout(300);
    await untilStep(p, /Round 1: power/); await until(p, 70 + 20);
    const b1 = await p.evaluate(() => window.__entrain.B.ph.sig);
    ok(b1 === 'in1.5|out1' && /^(Breathe in fully|Let go)$/.test(await t(p, '#sCap')) && /^Breath \d+ of 30$/.test(await t(p, '#sSub')), 'power breaths at 1.5 in / 1 out: ' + b1 + ', "' + await t(p, '#sCap') + '", "' + await t(p, '#sSub') + '"');
    await p.screenshot({ path: OUT + 'whm-breaths.png' });
    await untilStep(p, /Round 1: hold/);
    await p.waitForTimeout(300);
    ok(await vis(p, '#sTap') && await t(p, '#sTap') === 'Breathe in' && await t(p, '#sCap') === 'Hold, lungs empty' && await p.evaluate(() => window.__entrain.B.state) === 'idle', 'hold: guide stopped, Breathe in button shown');
    await p.waitForTimeout(6500);               // about 40 s of hold at 6x
    await p.screenshot({ path: OUT + 'whm-hold.png' });
    await p.click('#sTap'); await p.waitForTimeout(300);
    ok(await step(p) === 'Recovery breath' && await t(p, '#sCap') === 'Hold, lungs full' && /^\d+ s$/.test(await t(p, '#sSub')), 'Breathe in moves to the 15 s recovery hold: ' + await t(p, '#sSub'));
    await p.screenshot({ path: OUT + 'whm-recover.png' });
    await untilStep(p, /Round 2: hold/, 200000);
    await untilStep(p, /Recovery breath/, 200000);      // let round 2 run to the 3-minute cap
    await untilStep(p, /Round 3: hold/, 200000);
    await p.waitForTimeout(3000); await p.click('#sNext'); await p.waitForTimeout(300);
    const holds = await p.evaluate(() => window.__entrain.P.holds);
    ok(holds.length === 3 && holds[0] > 25 && holds[0] < 60 && holds[1] === 180 && holds[2] > 5 && holds[2] < 40, 'hold times recorded (tap, cap, skip): ' + holds.join(', '));
    await p.click('#sEnd'); await p.click('#sEnd'); await p.waitForTimeout(400);
    ok(/Longesthold03:00/.test((await t(p, '.sd-tiles')).replace(/\s/g, '')), 'summary shows the holds: ' + await t(p, '.sd-tiles'));
    await p.context().close();
  }

  /* ---------- L. anapana reminders in programs ---------- */
  if (!only || only === 'L') {
    const p = await page(null, NOAUDIO(120));
    const plan = await p.evaluate(() => {
      const E = window.__entrain, out = {};
      ['sleep-descent', 'calm-reset', 'coherence', 'focus-primer', 'nsdr', 'recovery', 'anapana', 'body-scan'].forEach(id => {
        const pl = E.pPlan(E.pDef(id), 10), r = [];
        pl.steps.forEach(s => s.lines.forEach(l => { if (l[2] === 'ana') r.push(s.title + ' @' + Math.round(s.at + l[0]) + ': ' + l[1]); }));
        out[id] = r;
      });
      return out;
    });
    ok(plan['sleep-descent'].length >= 3 && plan['sleep-descent'].every(x => !/Drift|Body release/.test(x)), 'Sleep Descent: reminders in the breathing steps only: ' + plan['sleep-descent'].map(x => x.split(':')[0]).join(' | '));
    ok(plan['calm-reset'].length >= 3 && plan['coherence'].every(x => /heart/.test(x)), 'Calm Reset ' + plan['calm-reset'].length + ' reminders; Heart Coherence worded for the heart: ' + plan['coherence'][0]);
    ok(plan['focus-primer'].length >= 3 && plan['nsdr'].length > 0 && plan['nsdr'].every(x => /Settling|breath|Belly|Whole body|Closing/.test(x)), 'Focus Primer ' + plan['focus-primer'].length + '; Body Scan + Theta only at breath/whole-body stops: ' + plan['nsdr'].map(x => x.split(' @')[0]).join(', '));
    ok(plan['anapana'].length === 0 && plan['body-scan'].length === 0, 'single practices are left as they are');
    // the option itself
    await p.evaluate(() => location.hash = 'practice/calm-reset'); await p.waitForTimeout(200);
    await opts(p);
    ok(await p.$eval('#sOptAna button[aria-pressed=true]', b => b.textContent) === '2 min', 'intro shows the reminder setting');
    await p.click('#sOptAna button[data-v="0"]'); await p.waitForTimeout(100);
    const off = await p.evaluate(() => { const E = window.__entrain; return E.pPlan(E.pDef('calm-reset'), 0).steps.reduce((a, s) => a + s.lines.filter(l => l[2] === 'ana').length, 0); });
    ok(off === 0, 'Off removes them');
    await p.click('#sOptAna button[data-v="120"]'); await p.waitForTimeout(100);
    await p.context().close();
    // live: spoken softly, captioned with the Anapana tag
    const q = await page({ speed: 20, rr: false }, NOAUDIO(120));
    await q.evaluate(() => location.hash = 'practice/calm-reset'); await q.waitForTimeout(200);
    await q.click('#sGo');
    let seen = false;
    for (let i = 0; i < 200 && !seen; i++) { seen = await q.$eval('#sLine', e => e.classList.contains('ana')); if (!seen) await q.waitForTimeout(60); }
    await q.waitForTimeout(100);
    const said = await q.evaluate(() => window.__said.filter(x => /nostrils/.test(x.t)));
    ok(seen && said.length >= 1 && said[0].v < 1, 'reminder shows with the Anapana tag and is spoken softly: "' + (said[0] && said[0].t) + '"');
    await q.screenshot({ path: OUT + 'ana-line.png' });
    await q.context().close();
  }

  /* ---------- M. the yoga builder ---------- */
  if (!only || only === 'M') {
    const p = await page({ speed: 10, rr: false }, NOAUDIO());
    await p.evaluate(() => location.hash = 'practice'); await p.waitForTimeout(200);
    ok(await vis(p, '.pc-build') && /Routine builder/.test(await t(p, '.pc-build')), 'Practice shows the Routine builder');
    await p.click('.pc-build a'); await p.waitForTimeout(300);
    ok(await p.evaluate(() => location.hash) === '#yoga' && await p.$$eval('#ybLib li', l => l.length) === 56 && await t(p, '#ybLibN') === '56 in all' && await vis(p, '#ybEmpty'), 'builder opens with the 56-item movement library');
    await p.click('#ybPos [data-pos=seat]'); await p.waitForTimeout(100);
    ok(await p.$$eval('#ybLib li', l => l.length) === 7 && await t(p, '#ybLibN') === '7 poses and moves', 'position filter: 7 seated poses and stretches');
    await p.click('#ybCats [data-cat=yoga]'); await p.waitForTimeout(100);
    ok(await p.$$eval('#ybLib li', l => l.length) === 5 && await t(p, '#ybLibN') === '5 poses', 'with yoga poses only: 5');
    await p.click('#ybCats [data-cat=all]'); await p.click('#ybPos [data-pos=all]'); await p.waitForTimeout(100);
    for (const id of ['mountain', 'warrior2', 'child', 'cat', 'corpse']) { await p.click('[data-add=' + id + ']'); await p.waitForTimeout(80); }
    ok(await p.$$eval('#ybList .yb-row', r => r.length) === 5, 'five poses added');
    await p.screenshot({ path: OUT + 'yb-added.png' });
    await p.click('#ybList .yb-row:nth-child(2) [data-a=plus]'); await p.click('#ybList .yb-row:nth-child(2) [data-a=plus]');
    ok(await t(p, '#ybList .yb-row:nth-child(2) .yb-hold b') === '45 s', 'hold +5 s twice: 35 → 45 s');
    await p.click('#ybList .yb-row:nth-child(2) [data-v=right]');
    ok(/right side/.test(await t(p, '#ybList .yb-row:nth-child(2) small')), 'warrior II set to the right side only');
    await p.click('#ybList .yb-row:nth-child(4) [data-a=up]');
    ok(/Cat/.test(await t(p, '#ybList .yb-row:nth-child(3) b')), 'move up: cat before child');
    await p.click('#ybList .yb-row:nth-child(5) [data-a=del]');
    ok(await p.$$eval('#ybList .yb-row', r => r.length) === 4, 'remove the last pose');
    await p.fill('#ybName', 'Test flow');
    await p.click('#ybSave'); await p.waitForTimeout(200);
    const saved = await p.evaluate(() => JSON.parse(localStorage.getItem('entrain.yogaSeqs')));
    ok(saved.length === 1 && saved[0].name === 'Test flow' && saved[0].items.map(i => i.id + (i.side ? ':' + i.side : '') + '@' + i.hold).join(',') === 'mountain@30,warrior2:right@45,cat@20,child@45', 'saved on the device: ' + JSON.stringify(saved[0].items));
    const uid = saved[0].uid;
    ok(await p.evaluate(() => location.hash) === '#yoga/' + uid && await vis(p, '#ybDel'), 'URL now points at the saved sequence; Delete shown');
    // it appears under Movement and runs. Headless Chromium sometimes loses a file:// page's storage across a
    // reload, so the stored values are copied over if the reload dropped them (as regress.js does).
    const snap = await p.evaluate(() => { const o = {}; for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); o[k] = localStorage.getItem(k); } return o; });
    await p.addInitScript(o => {
      if (localStorage.getItem('entrain.yogaSeqs')) return;
      for (const k in o) localStorage.setItem(k, o[k]);
      window.__restored = true;
    }, snap);
    await p.reload(); await p.waitForTimeout(300);
    if (await p.evaluate(() => window.__restored)) log.push('NOTE headless Chromium dropped the stored values on reload; copied them over');
    await p.evaluate(() => location.hash = 'practice'); await p.waitForTimeout(200);
    ok(/Yours/.test(await t(p, '.pr-grp[data-g=mine]')) && /Test flow/.test(await t(p, '.pr-grp[data-g=mine]')), 'your sequence is listed under Your routines after a reload');
    await p.evaluate(u => location.hash = 'practice/my-' + u, uid); await p.waitForTimeout(250);
    const rows = await p.$$eval('.si-steps li span', l => l.map(x => x.textContent));
    ok(rows.join(' | ') === 'Get ready | Mountain | Warrior II, right | Next: Cat | Cat | Child\'s Pose | Closing', 'steps with a transition: ' + rows.join(' | '));
    ok(await vis(p, '.si-edit') && await t(p, '.si-edit') === 'Edit routine', 'intro has Edit routine');
    await p.click('#sGo'); await p.waitForTimeout(200);
    await untilStep(p, /Warrior II/);
    await p.waitForTimeout(400);
    const said = await p.evaluate(() => window.__said.map(x => x.t).join(' / '));
    ok(/Warrior two, right side\. Feet wide, right toes forward, right knee bent/.test(said) && await vis(p, '#sFig svg.pose'), 'cues spoken with the side filled in, figure drawn');
    await p.screenshot({ path: OUT + 'yb-run-w2.png' });
    await untilStep(p, /Next: Cat/);
    await p.waitForTimeout(300);
    ok(await p.$eval('#sFig', f => f.classList.contains('next')) && (await p.evaluate(() => window.__said.map(x => x.t))).includes('Come down to your hands and knees.'), 'transition: next pose previewed, "Come down to your hands and knees."');
    await p.screenshot({ path: OUT + 'yb-run-next.png' });
    await p.waitForFunction(() => window.__entrain.P.state === 'done', null, { timeout: 60000 }).catch(() => {});
    ok(await vis(p, '#sDone'), 'your sequence runs to the end');
    // edit, then delete
    await p.evaluate(u => location.hash = 'yoga/' + u, uid); await p.waitForTimeout(250);
    ok(await p.$eval('#ybName', i => i.value) === 'Test flow' && await p.$$eval('#ybList .yb-row', r => r.length) === 4, 'Edit reopens it');
    await p.click('#ybDel'); await p.waitForTimeout(100);
    ok(await t(p, '#ybDel') === 'Tap again to delete', 'first tap on Delete only arms it');
    await p.click('#ybDel'); await p.waitForTimeout(300);
    ok(await p.evaluate(() => JSON.parse(localStorage.getItem('entrain.yogaSeqs')).length) === 0 && await p.evaluate(() => location.hash) === '#practice', 'second tap deletes and returns to Practice');
    // a copy of a built-in sequence
    await p.evaluate(() => location.hash = 'practice/morning-yoga'); await p.waitForTimeout(250);
    await p.click('.si-edit'); await p.waitForTimeout(250);
    ok(await p.$eval('#ybName', i => i.value) === 'Morning Wake-Up (mine)' && await p.$$eval('#ybList .yb-row', r => r.length) === 12, 'Customise a copy loads the built-in sequence');
    await p.click('[data-tpl=evening-floor]'); await p.waitForTimeout(150);
    ok(await p.$$eval('#ybList .yb-row', r => r.length) === 12 && /Legs Up the Wall/.test(await t(p, '#ybList')), 'templates load into the builder');
    await p.screenshot({ path: OUT + 'yb-template.png', fullPage: true });
    await p.context().close();
  }

  /* ---------- N. a built-in floor sequence end to end ---------- */
  if (!only || only === 'N') {
    const p = await page(null, NOAUDIO());
    await p.evaluate(() => location.hash = 'practice/evening-floor'); await p.waitForTimeout(200);
    await p.click('#sGo'); await p.waitForTimeout(200);
    const seen = [];
    for (let i = 0; i < 30; i++) {
      const cap = await t(p, '#sCap'), fig = await p.$eval('#sFig', f => !f.hidden && !!f.querySelector('svg'));
      seen.push(cap + (fig ? '' : ' (no figure)'));
      if (await p.$eval('#sNext', b => b.disabled)) break;
      await p.click('#sNext'); await p.waitForTimeout(120);
    }
    ok(seen.filter(x => /no figure/.test(x)).every(x => /Get ready|Closing/.test(x)), 'every pose and transition has a drawing: ' + seen.join(' | '));
    await p.context().close();
  }
  } catch (e) { log.push('ERROR ' + e.message.split('\n')[0]); }
  console.log(log.join('\n'));
  await browser.close();
})();
