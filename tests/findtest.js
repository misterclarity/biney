// The resonance test end to end on a desktop window, with a beat-to-beat sensor and the clock at 6x (about two minutes).
const { chromium, APP, OUT } = require('./pw');
const mock = require('./sensor-mock');
const t = (p, s) => p.$eval(s, e => e.textContent.trim());
(async () => {
  const b = await chromium.launch(); const log = [];
  const ok = (c, m) => log.push((c ? 'PASS ' : 'FAIL ') + m);
  const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  p.on('pageerror', e => log.push('PAGEERROR ' + e.message));
  await p.addInitScript(mock, { speed: 6, rr: true });
  await p.goto(APP + '#heart');
  await p.click('#hrConnect'); await p.waitForTimeout(500);
  const pill = await t(p, '#tbSensorTxt'), tile = await t(p, '#hrNowS');
  ok(/^\d+ bpm$/.test(pill) && tile === 'Beat to beat', 'connected: pill "' + pill + '", tile "' + tile + '"');
  await p.click('#hrFindStart'); await p.waitForTimeout(1000);
  const msg = await t(p, '#bMsg');
  ok(await p.evaluate(() => location.hash) === '#breathe' && /^Resonance test, pace 1 of 5: 6\.5 a minute/.test(msg), 'test runs on Breathe: ' + msg);
  await p.waitForTimeout(108000);
  const res = await t(p, '#hrFindTxt'), use = await t(p, '#hrFindUse');
  ok(await t(p, '#bPhase') === 'Done' && /^Biggest swing at [\d.]+ breaths a minute/.test(res) && /^Breathe at [\d.]+ \/min$/.test(use), 'finished: ' + res.slice(0, 60) + ' | ' + use);
  const coh = await t(p, '#hrCoh'), rm = await t(p, '#hrRmssd');
  ok(/^\d+\.\d$/.test(coh) && /^\d+$/.test(rm), 'coherence ' + coh + ' (' + await t(p, '#hrCohS') + '), RMSSD ' + rm);
  await p.click('.nav a[data-view=home]'); await p.waitForTimeout(300);
  const q = await t(p, '#qkFind'), last = await t(p, '#tdRecentBody .hi-e');
  const kept = await p.evaluate(() => JSON.parse(localStorage.getItem('entrain.history') || '[]').filter(e => e.k === 'test'));
  ok(/^Last result: [\d.]+ breaths a minute/.test(q) && /^Resonance test.*most swing at [\d.]+ breaths a minute/.test(last) && kept.length === 1 && kept[0].best > 0,
    'Today: ' + q + ' | ' + last.slice(0, 70));
  await p.click('.nav a[data-view=heart]'); await p.waitForTimeout(300);
  await p.screenshot({ path: OUT + 'desk-heart-results.png' });
  await b.close();
  console.log(log.join('\n'));
  console.log(log.filter(l => l.startsWith('PASS')).length + ' passed, ' + log.filter(l => /^(FAIL|PAGEERROR|ERROR)/.test(l)).length + ' problems');
})();
