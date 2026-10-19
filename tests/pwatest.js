// Installable-app checks: offline worker, offline reloads, update flow, install strip, installability.
const { chromium, ROOT, PAGE, OUT: OUTDIR } = require('./pw');
const fs = require('fs');
const path = require('path'), http = require('http'), { spawn } = require('child_process');
const OUT = OUTDIR, SERVE = OUTDIR + 'serve/biney/', URL0 = 'http://127.0.0.1:8123/biney/';

// a fresh copy of the current build, served the way GitHub Pages serves the site
fs.rmSync(OUTDIR + 'serve', { recursive: true, force: true });
fs.mkdirSync(SERVE + 'icons', { recursive: true });
for (const f of ['index.html', 'sw.js', 'manifest.webmanifest']) fs.copyFileSync(path.join(ROOT, f), SERVE + f);
for (const f of fs.readdirSync(path.join(ROOT, 'icons'))) fs.copyFileSync(path.join(ROOT, 'icons', f), SERVE + 'icons/' + f);
let server = null;
const up = () => new Promise(r => http.get(URL0, res => { res.resume(); r(true); }).on('error', () => r(false)));
async function serverUp() {
  if (await up()) throw new Error('port 8123 is already in use: stop the other server first, or this test would check its copy');
  server = spawn('python3', [path.join(__dirname, 'srv.py'), OUTDIR + 'serve'], { stdio: 'ignore' });
  for (let i = 0; i < 50; i++) { if (await up()) return; await new Promise(r => setTimeout(r, 100)); }
  throw new Error('test server did not start on port 8123');
}
process.on('exit', () => { if (server) server.kill(); });
const S20 = 'Mozilla/5.0 (Linux; Android 13; SM-G988B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Mobile Safari/537.36';
const t = (p, s) => p.$eval(s, e => e.textContent.trim()).catch(() => '(missing)');
const vis = (p, s) => p.$eval(s, e => !e.hidden && !!(e.offsetParent || e.getClientRects().length) && getComputedStyle(e).visibility !== 'hidden').catch(() => false);
(async () => {
  await serverUp();
  const browser = await chromium.launch();
  const log = []; const ok = (c, m) => log.push((c ? 'PASS ' : 'FAIL ') + m);
  const ctx = await browser.newContext({ userAgent: S20, viewport: { width: 412, height: 915 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const p = await ctx.newPage();
  p.on('pageerror', e => log.push('PAGEERROR ' + e.message));
  p.on('console', m => { if (m.type() === 'error') log.push('CONSOLE ' + m.text()); });

  // 1. first visit: the worker installs, stores everything, takes over the page and says so once
  await p.goto(URL0);
  await p.evaluate(() => navigator.serviceWorker.ready);
  await p.waitForFunction(() => !!navigator.serviceWorker.controller, null, { timeout: 5000 }).catch(() => {});
  ok(await p.evaluate(() => !!navigator.serviceWorker.controller), 'worker controls the page after the first visit');
  const cached = await p.evaluate(async () => { const k = await caches.keys(); const c = await caches.open(k[0]); return { keys: k, n: (await c.keys()).length, urls: (await c.keys()).map(r => r.url.replace(location.origin, '')) }; });
  ok(cached.keys.length === 1 && cached.n === 11, 'one store with 11 files: ' + cached.keys + ' ' + cached.urls.join(' '));
  await p.waitForTimeout(400);
  ok(await vis(p, '#toast') && /Saved on this device/.test(await t(p, '#toastTxt')), 'first-visit notice: "' + await t(p, '#toastTxt') + '"');
  await p.screenshot({ path: OUT + 'pwa-saved-toast.png' });
  await p.reload(); await p.waitForTimeout(600);
  ok(!(await vis(p, '#toast')), 'notice does not come back on the next visit');

  // 2. installability as Chrome sees it
  const cdp = await ctx.newCDPSession(p);
  const man = await cdp.send('Page.getAppManifest');
  ok(man.errors.length === 0, 'manifest parses without errors ' + JSON.stringify(man.errors));
  const inst = await cdp.send('Page.getInstallabilityErrors');
  ok(inst.installabilityErrors.length === 0, 'Chrome reports no installability errors ' + JSON.stringify(inst.installabilityErrors));
  const mj = JSON.parse(man.data);
  ok(mj.shortcuts.length === 4 && mj.icons.some(i => i.purpose === 'maskable'), 'manifest has maskable icons and 4 shortcuts');

  // 3. offline
  await ctx.setOffline(true);
  await p.reload(); await p.waitForTimeout(500);
  ok(await t(p, '#viewTitle') === 'Today' && await p.title() === 'Entrain — Evidence-Based Binaural Beats', 'offline reload opens the app');
  await p.goto(URL0 + '#heart'); await p.waitForTimeout(400);
  ok(await t(p, '#viewTitle') === 'Heart', 'offline: shortcut URL #heart opens Heart');
  await p.goto(URL0 + 'index.html#breathe'); await p.waitForTimeout(400);
  ok(await t(p, '#viewTitle') === 'Breathe', 'offline: index.html#breathe opens Breathe');
  await p.goto(URL0 + '?source=homescreen'); await p.waitForTimeout(400);
  ok(await t(p, '#viewTitle') === 'Today', 'offline: start URL with a query string still opens');
  const offFetch = await p.evaluate(async () => {
    const r = await Promise.all(['manifest.webmanifest', 'icons/maskable-512.png', 'icons/heart-96.png'].map(u => fetch(u).then(x => x.status).catch(() => 'err')));
    return r.join(',');
  });
  ok(offFetch === '200,200,200', 'offline: manifest and icons come from the store: ' + offFetch);
  await p.click('#homeStart'); await p.waitForTimeout(800);
  ok(await t(p, '#bStart') === 'Pause', 'offline: breathing session runs');
  await p.click('#bStart');
  await ctx.setOffline(false);

  // 4. update: a new deploy changes sw.js; the page offers Update and switches when tapped
  const swSrc = fs.readFileSync(SERVE + 'sw.js', 'utf8');
  const oldVer = swSrc.match(/entrain-([0-9a-f]+)/)[1];
  fs.writeFileSync(SERVE + 'sw.js', swSrc.split(oldVer).join('test0newver'));
  const htmlSrc = fs.readFileSync(SERVE + 'index.html', 'utf8');
  fs.writeFileSync(SERVE + 'index.html', htmlSrc.replace('<h2 id="homePat">', '<h2 id="homePat" data-build="new">'));
  await p.goto(URL0 + '#home'); await p.waitForTimeout(300);
  await p.evaluate(() => navigator.serviceWorker.getRegistration().then(r => r.update()));
  await p.waitForFunction(() => document.querySelector('#toastAct') && !document.querySelector('#toastAct').hidden, null, { timeout: 8000 }).catch(() => {});
  ok(/new version/.test(await t(p, '#toastTxt')) && await vis(p, '#toastAct'), 'update notice with button: "' + await t(p, '#toastTxt') + '"');
  ok(await p.evaluate(() => !document.querySelector('[data-build=new]')), 'old copy keeps running until Update is tapped');
  await p.waitForTimeout(400); await p.screenshot({ path: OUT + 'pwa-update-toast.png' });
  await Promise.all([p.waitForEvent('load', { timeout: 8000 }).catch(() => null), p.click('#toastAct')]);
  await p.waitForTimeout(800);
  ok(await p.evaluate(() => !!document.querySelector('[data-build=new]')), 'after Update the new version is running');
  const keys2 = await p.evaluate(() => caches.keys());
  ok(keys2.length === 1 && keys2[0] === 'entrain-test0newver', 'old store removed: ' + keys2);
  ok(!(await vis(p, '#toast')), 'no notice after the update reload');

  // 5. install strip on Home, driven by a stand-in for Chrome's install event
  await p.evaluate(() => {
    window.__prompted = 0;
    const e = new Event('beforeinstallprompt', { cancelable: true });
    e.prompt = () => { window.__prompted++; return Promise.resolve(); };
    e.userChoice = Promise.resolve({ outcome: 'dismissed' });
    window.dispatchEvent(e);
  });
  await p.waitForTimeout(200);
  ok(await vis(p, '#installCard') && await vis(p, '#installBtn'), 'install strip appears on Home when Chrome offers install');
  await p.screenshot({ path: OUT + 'pwa-install-card.png' });
  await p.click('#installBtn'); await p.waitForTimeout(200);
  ok(await p.evaluate(() => window.__prompted) === 1 && !(await vis(p, '#installCard')), 'Install opens Chrome\'s prompt and hides the strip');
  ok(!!(await p.evaluate(() => localStorage.getItem('entrain.installLater'))), 'declining the prompt holds the strip back for a while');
  await p.evaluate(() => localStorage.removeItem('entrain.installLater'));
  await p.evaluate(() => { const e = new Event('beforeinstallprompt', { cancelable: true }); e.prompt = () => {}; window.dispatchEvent(e); });
  await p.click('#installLater'); await p.waitForTimeout(100);
  ok(!(await vis(p, '#installCard')), 'Not now hides the strip');
  await p.evaluate(() => window.dispatchEvent(new Event('appinstalled')));
  await p.waitForTimeout(300);
  ok(/installed/.test(await t(p, '#toastTxt')), 'installed notice: "' + await t(p, '#toastTxt') + '"');

  // 6. notice sits above the mini player when it is open
  await p.evaluate(() => location.hash = 'track/sleep-descent'); await p.waitForTimeout(300);
  await p.click('#trGo'); await p.waitForTimeout(300);
  if (await vis(p, '#scModal')) await p.click('#scSkip');
  await p.waitForTimeout(700);
  await p.evaluate(() => window.dispatchEvent(new Event('appinstalled')));
  await p.waitForTimeout(500);
  const gap = await p.evaluate(() => document.querySelector('#player').getBoundingClientRect().top - document.querySelector('#toast').getBoundingClientRect().bottom);
  ok(gap >= 8 && gap <= 16, 'notice clears the mini player by ' + Math.round(gap) + 'px');
  await p.screenshot({ path: OUT + 'pwa-toast-player.png' });
  await p.click('#toggle').catch(() => {});

  // 7. standalone (installed) mode never shows the strip
  const ctx2 = await browser.newContext({ userAgent: S20, viewport: { width: 412, height: 915 }, isMobile: true });
  const p2 = await ctx2.newPage();
  await p2.addInitScript(() => { const mm = window.matchMedia; window.matchMedia = q => /display-mode: standalone/.test(q) ? { matches: true, addEventListener() {}, removeEventListener() {} } : mm.call(window, q); });
  await p2.goto(URL0);
  await p2.evaluate(() => { const e = new Event('beforeinstallprompt', { cancelable: true }); e.prompt = () => {}; window.dispatchEvent(e); });
  await p2.waitForTimeout(200);
  ok(!(await vis(p2, '#installCard')), 'installed app does not offer to install itself');

  // 8. the preview page and a saved copy don't try to register anything
  const p3 = await ctx2.newPage(); const errs = [];
  p3.on('pageerror', e => errs.push(e.message)); p3.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await p3.goto(PAGE); await p3.waitForTimeout(500);
  ok(errs.length === 0 && await p3.evaluate(() => navigator.serviceWorker ? navigator.serviceWorker.getRegistrations().then(r => r.length).catch(() => 0) : 0) === 0 && !(await vis(p3, '#installCard')), 'preview page: no worker, no strip, no errors ' + errs.join(' | '));

  // 9. a passing notice doesn't push away a pending update offer
  fs.writeFileSync(SERVE + 'sw.js', swSrc.split(oldVer).join('test1newver'));
  await p.evaluate(() => navigator.serviceWorker.getRegistration().then(r => r.update()));
  await p.waitForFunction(() => /new version/.test(document.querySelector('#toastTxt').textContent), null, { timeout: 8000 }).catch(() => {});
  await p.evaluate(() => window.dispatchEvent(new Event('appinstalled')));
  await p.waitForTimeout(300);
  ok(/new version/.test(await t(p, '#toastTxt')) && await vis(p, '#toastAct'), 'update offer stays put: "' + await t(p, '#toastTxt') + '"');
  await p.click('#toastX'); await p.waitForTimeout(400);
  ok(!(await vis(p, '#toast')), 'the offer can be dismissed');
  fs.writeFileSync(SERVE + 'sw.js', swSrc);
  fs.writeFileSync(SERVE + 'index.html', htmlSrc);

  console.log(log.join('\n'));
  await browser.close();
  server.kill();
})();
