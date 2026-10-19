// The page must never reach the network: open every view and a few practices and watch the requests.
const { chromium, APP } = require('./pw');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage(); const reqs = [], errs = [];
  p.on('request', r => { if (!r.url().startsWith('file:') && !r.url().startsWith('data:') && !r.url().startsWith('blob:')) reqs.push(r.url()); });
  p.on('pageerror', e => errs.push(e.message));
  await p.goto(APP);
  const views = ['practice', 'breathe', 'heart', 'learn', 'history', 'track/sleep-descent', 'prime', 'builder', 'yoga', 'settings', 'practice/wim-hof', 'practice/evening-floor', 'practice/solo-capoeira', 'practice/nvc-self', 'practice/power-nap', 'home'];
  for (const h of views) { await p.evaluate(x => location.hash = x, h); await p.waitForTimeout(250); }
  console.log(reqs.length ? 'FAIL network requests: ' + reqs.join(' ') : 'PASS no network requests across ' + views.length + ' views');
  for (const e of errs) console.log('PAGEERROR ' + e);
  await b.close();
})();
