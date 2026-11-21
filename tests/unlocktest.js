// The new techniques open with a donation, once on each device: the gate at every way in, the dialog, the
// device code, activation codes (pasted and as a link), Settings and search, backups, and the developer's tool.
// No item carries sup: true yet, so the checks flag existing ones for the run, through the debug hook.
//   A  locked on the real build: badges, every way to start a practice, a pattern and a track, the dialog, Settings
//   B  unlocking a test copy (tests/unlock-helper.js): pasted, linked, refused, kept through a reload, backups, cleared storage
//   C  src/unlock.js: signing, refusing an untrusted key, codes from a text, verifying, new keys
// Run: node tests/unlocktest.js [group letter]
const { chromium, APP, ROOT, OUT } = require('./pw');
const { testApp, unlockInit, unlocked, sign, DEVICE, JWK, KEY_FILE, FILE } = require('./unlock-helper');
const fs = require('fs'), path = require('path'), os = require('os'), http = require('http'), crypto = require('crypto'), { spawnSync } = require('child_process');
const S20 = 'Mozilla/5.0 (Linux; Android 13; SM-G988B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Mobile Safari/537.36';
const only = process.argv[2] || '';
const t = (p, s) => p.$eval(s, e => e.textContent.replace(/\s+/g, ' ').trim()).catch(() => '(missing)');
const E = (p, f, a) => p.evaluate(f, a);
const go = async (p, h, ms) => { await p.evaluate(x => location.hash = x, h); await p.waitForTimeout(ms || 300); };
const shut = p => p.$eval('#supModal', e => e.hidden);
const LOCKED_GO = 'Unlock to start';
const DLG_LINE = 'The techniques from the brain-wave guide open with a donation of €1 or more on Ko-fi, once on each device.';
const EACH = "It unlocks this device and this browser only. On another device, or once this browser's data is cleared, a new donation unlocks it there. Backups don't carry it.";
const THANKS = 'Unlocked on this device. Thank you for your donation.';
// flag (or unflag) existing items as new techniques, as later features will be: practices, patterns (b:) and tracks (t:)
const flag = (p, keys, on) => E(p, ([keys, on]) => {
  const X = window.__entrain;
  keys.forEach(k => {
    const list = k.startsWith('b:') ? X.BREATHS : k.startsWith('t:') ? X.TRACKS : X.PRACTICES, id = k.replace(/^[bt]:/, ''), d = list.find(x => x.id === id);
    if (on === false) delete d.sup; else d.sup = true;
  });
  X.supRefresh();
}, [keys, on]);
// what the dialog shows
const dlg = p => E(p, () => {
  const m = document.querySelector('#supModal'), q = s => m.querySelector(s), tx = e => e ? e.textContent.replace(/\s+/g, ' ').trim() : '';
  return { open: !m.hidden, title: tx(q('h2')), for: q('#supFor').hidden ? '' : tx(q('#supFor')), text: tx(m), dev: tx(q('#supDev')), res: q('#supRes').hidden ? '' : tx(q('#supRes')),
    warn: q('#supWarn').hidden ? '' : tx(q('#supWarn')), close: tx(q('#supClose')), steps: !q('#supSteps').hidden, focusIn: m.contains(document.activeElement) };
});
const until = async (p, f, ms) => { try { await p.waitForFunction(f, null, { timeout: ms || 5000 }); return true; } catch (e) { return false; } };

(async () => {
  const browser = await chromium.launch();
  const log = []; const ok = (c, m) => log.push((c ? 'PASS ' : 'FAIL ') + m);
  const net = [];
  // a phone (412 wide unless said), debug on, the headphone check done, quiet options; seed: more stored values
  const page = async (url, o) => {
    o = o || {};
    const ctx = await browser.newContext(Object.assign({ userAgent: S20, viewport: o.vp || { width: 412, height: 915 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
      o.http ? { serviceWorkers: 'block', acceptDownloads: true } : {}));
    if (o.clip) await ctx.grantPermissions(['clipboard-read', 'clipboard-write']);
    const p = await ctx.newPage();
    p.on('pageerror', e => log.push('PAGEERROR ' + e.message));
    p.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) log.push('CONSOLE ' + m.text()); });
    p.on('request', r => { const u = r.url(); if (!/^(file|data|blob):/.test(u) && !u.startsWith('http://127.0.0.1:')) net.push(u); });
    await p.addInitScript(s => {
      localStorage.setItem('entrain.debug', '1'); localStorage.setItem('entrain.stereo', 'ok');
      if (!localStorage.getItem('entrain.pOpt')) localStorage.setItem('entrain.pOpt', JSON.stringify({ voice: false, bells: false, cues: 'off', visual: 'circle', audio: false, voiceName: '', ana: 0, rhythm: false }));
      for (const k in s) localStorage.setItem('entrain.' + k, s[k]);
      if (window.speechSynthesis) { speechSynthesis.speak = () => {}; speechSynthesis.cancel = () => {}; }
    }, o.seed || {});
    if (o.init) await p.addInitScript(o.init);
    if (o.unlock) await unlockInit(p, o.unlock === true ? DEVICE : o.unlock);
    await p.goto(url + (o.hash ? '#' + o.hash : ''));
    await p.waitForTimeout(400);
    await unlocked(p);
    return p;
  };
  // the test copy, also served over http: a file:// page can lose its storage across a reload
  const TEST = testApp();
  const srv = http.createServer((q, r) => {
    const u = decodeURIComponent(q.url.split('?')[0]), f = u === '/' ? FILE : path.join(ROOT, u);
    if (!f.startsWith(ROOT + path.sep)) { r.writeHead(403); return r.end(); }
    fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'Content-Type': /\.html$/.test(f) ? 'text/html; charset=utf-8' : /\.json|webmanifest$/.test(f) ? 'application/json' : 'application/octet-stream' }); r.end(d); });
  });
  await new Promise(r => srv.listen(0, '127.0.0.1', r));
  const HOME = 'http://127.0.0.1:' + srv.address().port + '/';
  const DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'entrain-unlock-'));

  try {
    /* A. locked on the real build: every item flagged sup shows the badge, and every way in opens the dialog instead */
    if (!only || only === 'A') {
      const ITEMS = ['anapana', 'b:box', 't:theta-meditation'];
      let p = await page(APP, { seed: { favs: JSON.stringify(ITEMS), history: JSON.stringify([{ k: 'practice', id: 'anapana', n: 'Anapana', at: Date.now() - 36e5, secs: 600, full: true }]) } });
      const s0 = await E(p, () => ({ state: window.__entrain.SUP.state, on: window.__entrain.supOn(), dev: localStorage.getItem('entrain.device'), keys: document.documentElement.outerHTML.match(/^  var SUP_KEYS = .*$/m)[0] }));
      ok(s0.state === 'none' && !s0.on && s0.dev === null, 'locked by default, and no device code until one is needed: ' + s0.state);
      ok(s0.keys.includes('"x7VHEChKqEpO9I-LcD_e_nSFgbTr33QoZV1CsGGYQD0"') && !s0.keys.includes(JWK.x) && !fs.readFileSync(path.join(ROOT, 'src/js/supporter.js'), 'utf8').includes(JWK.x),
        'the real build trusts the production key and never the test key');
      await flag(p, ITEMS);
      const fav = await E(p, () => [...document.querySelectorAll('#tdFavList > li')].map(li => li.querySelector('b').textContent + (li.querySelector('.sup-tag') ? ' [' + li.querySelector('.sup-tag').textContent + ']' : '')));
      ok(fav.length === 3 && fav.every(x => / \[Donation\]$/.test(x)), 'Today\'s favourites show the badge on each new technique: ' + fav.join(', '));
      const rec = await E(p, () => [...document.querySelectorAll('#tdRecentBody .hi-e b')].map(b => b.textContent).join(', '));
      ok(rec === 'AnapanaDonation', 'and so does Recently: ' + rec);
      // from Today's row to the page, where Start opens the dialog
      await p.click('#tdFavList a[href="#practice/anapana"]'); await p.waitForTimeout(300);
      const pg = await E(p, () => ({ hash: location.hash, go: document.querySelector('#sGo').textContent.trim(), note: document.querySelector('#sSupNote').hidden ? '' : document.querySelector('#sSupNote').textContent,
        ev: !!document.querySelector('#sIntro .si-ev'), steps: document.querySelectorAll('#sIntro .si-steps li').length, dis: document.querySelector('#sGo').disabled }));
      ok(pg.hash === '#practice/anapana' && pg.go === LOCKED_GO && /^One of the new techniques: it opens with a donation of €1 or more, once on each device\.$/.test(pg.note) && pg.ev && pg.steps > 2 && !pg.dis,
        'its page is open to read (steps, evidence), and Start becomes the way to unlock it: ' + pg.go + ' / ' + pg.note);
      await p.click('#sGo'); await p.waitForTimeout(250);
      let d = await dlg(p);
      const dev = await E(p, () => localStorage.getItem('entrain.device'));
      ok(d.open && d.title === 'Unlock the new techniques' && d.for === 'Anapana is one of the new techniques.' && d.text.includes(DLG_LINE) && d.text.includes(EACH) && d.close === 'Not now' && d.focusIn,
        'Start opens the dialog, naming what was tapped, with focus inside: ' + d.for);
      ok(await E(p, () => window.__entrain.P.state) !== 'running', 'and the practice doesn\'t start');
      ok(/^[0-9A-HJKMNP-TV-Z]{10}$/.test(dev) && d.dev === dev.slice(0, 5) + '-' + dev.slice(5), 'the device code is made on first need, ten characters of Crockford base 32, shown as ' + d.dev);
      ok(/Donate €1 or more on Ko-fi and put this code in your message\./.test(d.text) && /You'll get an activation link by email\. Open it on this device, or paste the code here\./.test(d.text),
        'it says what to do, step by step');
      const kofi = await E(p, () => { const a = document.querySelector('#supKofi'), r = a.getBoundingClientRect(); return { href: a.getAttribute('href'), target: a.target, rel: a.rel, txt: a.textContent.trim(), h: r.height }; });
      ok(kofi.href === 'https://ko-fi.com/misterclarity' && kofi.target === '_blank' && /noopener/.test(kofi.rel) && kofi.txt === 'Donate on Ko-fi' && kofi.h >= 44, 'Donate on Ko-fi opens Ko-fi in the browser: ' + kofi.txt);
      // Tab stays inside; Escape closes, and focus goes back to Start
      const inside = [];
      for (let i = 0; i < 9; i++) { await p.keyboard.press('Tab'); inside.push(await E(p, () => document.querySelector('#supModal').contains(document.activeElement))); }
      ok(inside.every(Boolean), 'Tab stays inside the dialog');
      await p.keyboard.press('Escape'); await p.waitForTimeout(150);
      ok(await shut(p) && await E(p, () => document.activeElement.id) === 'sGo', 'Escape closes it, and focus goes back to Start');
      await p.click('#sGo'); await p.waitForTimeout(200);
      ok((await dlg(p)).dev === d.dev && await E(p, () => localStorage.getItem('entrain.device')) === dev, 'the same device code the next time: it\'s kept');
      await p.mouse.click(6, 6); await p.waitForTimeout(150);
      ok(await shut(p), 'a tap outside closes it');
      await p.click('#sGo'); await p.waitForTimeout(200);
      // the paste field on the real build: nothing, garbage, and a code from a key the app doesn't trust
      const paste = async v => { await p.fill('#supIn', v); await p.click('#supGo'); await p.waitForTimeout(250); return (await dlg(p)).res; };
      const r0 = await paste(''), r1 = await paste('my code is 12345'), r2 = await paste(sign(dev));
      ok(r0 === 'Paste the activation code or link from the email first.' && /^That isn't a valid activation code\./.test(r1) && /^That isn't a valid activation code\./.test(r2) &&
        await E(p, () => !window.__entrain.supOn() && localStorage.getItem('entrain.unlock') === null),
        'nothing, garbage, and a code signed by a key the app doesn\'t trust are all refused, and nothing is kept: ' + r2);
      // Copy, where the browser refuses the clipboard: the code selected to copy by hand
      await E(p, () => { navigator.clipboard.writeText = () => Promise.reject(new Error('no')); document.execCommand = () => false; });
      await p.click('#supCopy'); await p.waitForTimeout(200);
      const cp = await E(p, () => ({ said: document.querySelector('#supSaid').textContent, sel: String(getSelection()).trim() }));
      ok(/^It's selected: copy it from your browser's menu\.$/.test(cp.said) && cp.sel === d.dev, 'where the clipboard is refused, Copy selects the code instead: ' + cp.sel);
      // nothing wider than a small phone, every button big enough to tap
      await p.setViewportSize({ width: 360, height: 740 }); await p.waitForTimeout(150);
      const fit = await E(p, () => {
        const c = document.querySelector('#supModal .modal-card').getBoundingClientRect(), out = [];
        document.querySelectorAll('#supModal .modal-card *').forEach(e => { const r = e.getBoundingClientRect(); if (e.getClientRects().length && (r.right > c.right + 0.5 || r.left < c.left - 0.5)) out.push(e.id || e.tagName); });
        const small = [...document.querySelectorAll('#supModal button, #supModal a.btn, #supModal input')].filter(e => e.getBoundingClientRect().height < 44).map(e => e.id);
        return { page: document.documentElement.scrollWidth, out, small };
      });
      ok(fit.page <= 360 && !fit.out.length && !fit.small.length, 'at 360 px the dialog fits, and every button and the field are at least 44 px tall' + (fit.out.length + fit.small.length ? ': ' + fit.out.concat(fit.small).join(',') : ''));
      await p.click('#supClose'); await p.waitForTimeout(150);
      const reach = await p.$eval('#sGo', b => { const r = b.getBoundingClientRect(); return r.top >= 0 && r.bottom <= innerHeight - 62; });
      ok(await shut(p) && reach && await E(p, () => document.documentElement.scrollWidth) <= 360, 'Not now closes it; at 360 px the locked Start is in reach above the tab bar');
      await p.setViewportSize({ width: 412, height: 915 });

      // the library and search show the badge, and lead to the same page
      await go(p, 'practice', 450);
      const lib = await E(p, () => ['#practice/anapana', '#breathe/box', '#track/theta-meditation'].map(h => { const a = document.querySelector('#prLib a[href="' + h + '"]'); return a ? !!a.querySelector('.pc-meta .sup-tag') : null; }));
      const plain = await E(p, () => !document.querySelector('#prLib a[href="#practice/body-scan"] .sup-tag'));
      ok(lib.every(x => x === true) && plain, 'the library\'s rows carry the badge, for a practice, a pattern and a track, and only for them: ' + lib.join(','));
      await p.click('#prLib a[href="#practice/anapana"]'); await p.waitForTimeout(300);
      await p.click('#sGo'); await p.waitForTimeout(200);
      ok((await dlg(p)).open && await E(p, () => window.__entrain.P.state) !== 'running', 'from the library, Start opens the dialog too');
      await p.click('#supClose'); await p.waitForTimeout(150);
      await p.click('#tbFind'); await p.waitForTimeout(200);
      await p.fill('#fdIn', 'anapana'); await p.waitForTimeout(250);
      const fd = await E(p, () => { const a = document.querySelector('#fdRes a.fd-it[href="#practice/anapana"]'); return a ? a.querySelector('small').textContent : ''; });
      ok(/^Donation/.test(fd), 'search results carry it: ' + fd);
      await p.click('#fdRes a.fd-it[href="#practice/anapana"]'); await p.waitForTimeout(300);
      await p.click('#sGo'); await p.waitForTimeout(200);
      ok((await dlg(p)).open && await E(p, () => window.__entrain.P.state) !== 'running', 'and from a search result, Start opens it');
      await p.click('#supClose'); await p.waitForTimeout(150);

      // a track: Play becomes the way to unlock it
      await go(p, 'track/theta-meditation');
      const tr = await E(p, () => ({ go: document.querySelector('#trGo').textContent.trim(), note: !document.querySelector('#trSupNote').hidden }));
      await p.click('#trGo'); await p.waitForTimeout(250);
      d = await dlg(p);
      ok(tr.go === 'Unlock to play' && tr.note && d.open && d.for === 'Theta Meditation is one of the new techniques.' && !(await E(p, () => window.__entrain.A.playing)),
        'a track\'s Play opens the dialog, and nothing plays: ' + tr.go);
      await p.keyboard.press('Escape'); await p.waitForTimeout(150);
      ok(await E(p, () => document.activeElement.id) === 'trGo', 'focus goes back to Play');
      await flag(p, ['t:theta-meditation'], false);
      ok(/^Play 20 min$/.test(await t(p, '#trGo')), 'the same track, not flagged: Play as usual');

      // a breathing pattern: its chip, picking it, a link to it, starting it, left chosen, and mid-session
      await go(p, 'breathe', 400);
      const chip = await E(p, () => { const l = document.querySelector('#bPats input[value="box"]').parentNode, g = l.querySelector('.sup-tag'); return { tag: !!g, label: g && g.getAttribute('aria-label'), name: l.textContent.trim() }; });
      ok(chip.tag && chip.label === 'Opens with a donation' && chip.name === 'Box 4-4-4-4', 'Box\'s chip carries the cup, its name unchanged: ' + chip.name);
      await p.click('#bPats label:has(input[value="box"])'); await p.waitForTimeout(250);
      d = await dlg(p);
      ok(d.open && d.for === 'Box 4-4-4-4 is one of the new techniques.', 'picking it opens the dialog');
      await p.click('#supClose'); await p.waitForTimeout(200);
      const back = await E(p, () => ({ pat: window.__entrain.BC.pattern, on: document.querySelector('#bPats input:checked').value, inh: window.__entrain.BC.inh }));
      ok(back.pat === 'resonance' && back.on === 'resonance' && back.inh === 5.5, 'Not now goes back to the pattern before: ' + back.pat);
      await go(p, 'breathe/box', 400);
      ok((await dlg(p)).open, 'a link to it opens the dialog');
      await p.keyboard.press('Escape'); await p.waitForTimeout(200);
      ok(await E(p, () => window.__entrain.BC.pattern) === 'resonance', 'Escape goes back too');
      // the sliders landing on its timings: your own timings, not the locked pattern
      await E(p, () => { const set = (id, v) => { const el = document.querySelector(id); el.value = v; el.dispatchEvent(new Event('input')); }; set('#bInh', 4); set('#bHold', 4); set('#bExh', 4); set('#bRest', 4); });
      await p.waitForTimeout(150);
      ok(await E(p, () => window.__entrain.BC.pattern) === 'custom' && await shut(p), 'the sliders set to its timings make them your own (Custom), without the dialog');
      // left chosen on Breathe, then started: unflagged to pick it, flagged again
      await flag(p, ['b:box'], false);
      await p.click('#bPats label:has(input[value="box"])'); await p.waitForTimeout(200);
      ok(await E(p, () => window.__entrain.BC.pattern) === 'box' && await shut(p), 'not flagged, it\'s picked freely');
      await flag(p, ['b:box']);
      await p.click('#bStart'); await p.waitForTimeout(250);
      ok((await dlg(p)).open && await E(p, () => window.__entrain.B.state) === 'idle', 'Start with it chosen opens the dialog, and nothing starts');
      await p.click('#supClose'); await p.waitForTimeout(200);
      ok(await E(p, () => window.__entrain.BC.pattern) === 'resonance', 'and Not now leaves it for Resonance');
      await flag(p, ['b:box'], false);
      await p.click('#bPats label:has(input[value="box"])'); await p.waitForTimeout(200);
      await go(p, 'home', 300);
      await flag(p, ['b:box']);
      await go(p, 'breathe', 400);
      ok((await dlg(p)).open, 'left chosen on Breathe, it opens the dialog when Breathe opens');
      await p.mouse.click(6, 6); await p.waitForTimeout(200);
      ok(await shut(p) && await E(p, () => window.__entrain.BC.pattern) === 'resonance', 'and a tap outside goes back to Resonance');
      // Today's Start, with it chosen
      await flag(p, ['b:box'], false);
      await p.click('#bPats label:has(input[value="box"])'); await p.waitForTimeout(200);
      await go(p, 'home', 300);
      await flag(p, ['b:box']);
      await p.click('#homeStart'); await p.waitForTimeout(400);
      ok((await dlg(p)).open && await E(p, () => window.__entrain.B.state) === 'idle', 'Today\'s Start breathing with it chosen opens the dialog, and nothing starts');
      await p.click('#supClose'); await p.waitForTimeout(200);
      // picked mid-session: the session waits, then carries on with the pattern before
      await p.click('#bStart'); await p.waitForTimeout(400);
      await p.click('#bPats label:has(input[value="box"])'); await p.waitForTimeout(250);
      const mid = await E(p, () => window.__entrain.B.state);
      await p.click('#supClose'); await p.waitForTimeout(250);
      const aft = await E(p, () => ({ st: window.__entrain.B.state, pat: window.__entrain.BC.pattern }));
      ok(mid === 'paused' && (await dlg(p)).open === false && aft.st === 'running' && aft.pat === 'resonance', 'picked mid-session, the session waits for the dialog, then carries on with the pattern before: ' + mid + ' → ' + aft.st + ', ' + aft.pat);
      await p.click('#bReset'); await p.waitForTimeout(150);

      // Settings: New techniques
      await go(p, 'st-supporter', 450);
      const st = await E(p, () => {
        const s = document.querySelector('#st-supporter'), r = s.getBoundingClientRect(), tx = e => e.textContent.replace(/\s+/g, ' ').trim();
        return { view: !document.querySelector('#v-settings').hidden, top: Math.round(r.top), h2: tx(s.querySelector('h2')), state: tx(s.querySelector('#supSt')), dev: tx(s.querySelector('#supStDev')),
          kofi: s.querySelector('a.btn.donate').getAttribute('href'), kt: tx(s.querySelector('a.btn.donate')), field: !!s.querySelector('#supStIn') && !s.querySelector('#supStHow').hidden,
          note: tx(s), list: [...s.querySelectorAll('#supList a')].map(a => a.textContent + '>' + a.getAttribute('href')).join(', '),
          small: [...s.querySelectorAll('button, a.btn, input')].filter(e => e.getBoundingClientRect().height < 44).map(e => e.id || e.textContent) };
      });
      ok(st.view && st.top < 200 && st.h2 === 'New techniques' && st.state === 'Locked on this device.' && st.dev === d.dev && st.kofi === 'https://ko-fi.com/misterclarity' && st.kt === 'Donate on Ko-fi' && st.field && st.note.includes(EACH) && !st.small.length,
        '#st-supporter opens Settings at New techniques: locked, the device code with Copy, Donate on Ko-fi, the paste field and the note: ' + st.state);
      ok(st.list === 'Anapana>#practice/anapana, Box 4-4-4-4>#breathe/box, Monaural beats and isochronic tones>#st-beats',
        'it lists what the donation unlocks, from the flagged items, then what else opens with it (SUP_EXTRA: the beat\'s speaker ways): ' + st.list);
      await flag(p, ['anapana', 'b:box'], false);
      const extra = await E(p, () => [...document.querySelectorAll('#supList a')].map(a => a.textContent + '>' + a.getAttribute('href')).join(', '));
      await E(p, () => { const X = window.__entrain; window.__extra = X.SUP_EXTRA.splice(0); X.supRefresh(); });
      const none = await t(p, '#supList');
      await E(p, () => { const X = window.__entrain; X.SUP_EXTRA.push(...window.__extra); X.supRefresh(); });
      ok(extra === 'Monaural beats and isochronic tones>#st-beats' && /^None yet/.test(none), 'with none flagged, the others stay; with nothing at all, none yet: ' + extra + ' / ' + none);
      await p.fill('#supStIn', 'not a code'); await p.click('#supStGo'); await p.waitForTimeout(200);
      ok(/^That isn't a valid activation code\./.test(await t(p, '#supStRes')), 'its paste field says so too');
      for (const w of ['unlock', 'donation', 'supporter']) {
        await p.click('#tbFind'); await p.waitForTimeout(150);
        await p.fill('#fdIn', w); await p.waitForTimeout(250);
        const hit = await E(p, () => [...document.querySelectorAll('#fdRes a.fd-it')].map(a => a.querySelector('b').textContent + '>' + a.getAttribute('href')));
        ok(hit.includes('New techniques>#st-supporter'), 'search finds it for "' + w + '": ' + hit.slice(0, 3).join(', '));
        if (w === 'supporter') { await p.click('#fdRes a.fd-it[href="#st-supporter"]'); await p.waitForTimeout(400); }
        else { await p.keyboard.press('Escape'); await p.waitForTimeout(150); }
      }
      ok(await E(p, () => location.hash === '#st-supporter' && !document.querySelector('#v-settings').hidden), 'and the result opens it');
      // #unlock: the dialog over the page you were on, which keeps its address
      await go(p, 'learn', 300);
      await go(p, 'unlock', 300);
      d = await dlg(p);
      ok(d.open && !d.for && await E(p, () => !document.querySelector('#v-learn').hidden && location.hash === '#learn'), '#unlock opens the dialog over the page you were on, which keeps its address');
      await p.click('#supClose'); await p.waitForTimeout(150);
      await p.context().close();
      p = await page(APP, { hash: 'unlock' });
      ok((await dlg(p)).open && await E(p, () => location.hash === '#st-supporter' && !document.querySelector('#v-settings').hidden), 'opened at #unlock, the dialog shows over Settings\' section');
      await p.context().close();

      // Begin with: a locked practice chosen to begin an open one
      p = await page(APP, { seed: { 'pCh.conversation': JSON.stringify({ pre: 'nvc-prep' }) }, hash: 'practice/conversation' });
      await flag(p, ['nvc-prep']);
      ok(await t(p, '#sGo') === LOCKED_GO, 'a practice that begins with a locked one: Start becomes the way to unlock it');
      await p.click('#sGo'); await p.waitForTimeout(250);
      d = await dlg(p);
      const pre = await E(p, () => ({ st: window.__entrain.P.state, chain: window.__entrain.P.chain, hash: location.hash }));
      ok(d.for === 'Prepare a Hard Conversation (NVC) is one of the new techniques.' && pre.st !== 'running' && !pre.chain && pre.hash === '#practice/conversation',
        'Start opens the dialog for the one it begins with, and neither runs: ' + d.for);
      await p.click('#supClose'); await p.waitForTimeout(150);
      await p.click('#sOptsBtn').catch(() => {}); await p.waitForTimeout(100);
      await p.click('[data-choice="pre"] button[data-v=""]'); await p.waitForTimeout(200);
      ok(/^Start \d+ min$/.test(await t(p, '#sGo')), 'beginning with the breathing instead: Start as usual: ' + await t(p, '#sGo'));
      // the end screen's Continue: Self-Empathy first, then Difficult Conversation, flagged meanwhile
      await p.click('[data-choice="pre"] button[data-v="nvc-self"]'); await p.waitForTimeout(200);
      await p.click('#sGo'); await p.waitForTimeout(500);
      const run1 = await E(p, () => ({ st: window.__entrain.P.state, id: window.__entrain.P.def.id }));
      await flag(p, ['conversation']);
      await p.click('#sEnd'); await p.click('#sEnd'); await p.waitForTimeout(400);
      const ch = await E(p, () => { const b = document.querySelector('#sdChain'); return b ? b.textContent.trim() : ''; });
      await p.click('#sdChain'); await p.waitForTimeout(300);
      d = await dlg(p);
      const ch2 = await E(p, () => ({ st: window.__entrain.P.state, view: window.__entrain.P.view.id, done: !document.querySelector('#sDone').hidden }));
      ok(run1.st === 'running' && run1.id === 'nvc-self' && ch === 'Continue to Difficult ConversationDonation' && d.for === 'Difficult Conversation is one of the new techniques.' && ch2.st !== 'running' && ch2.done,
        'the end screen\'s Continue to a locked practice carries the badge and opens the dialog; nothing runs, the end screen stays: ' + ch);
      await p.click('#supClose'); await p.waitForTimeout(150);
      // Do it again, and the end screen's suggestion
      await flag(p, ['nvc-self']);
      await p.click('#sdAgain'); await p.waitForTimeout(300);
      const again = await t(p, '#sGo');
      await p.click('#sGo'); await p.waitForTimeout(200);
      ok(again === LOCKED_GO && (await dlg(p)).open && await E(p, () => window.__entrain.P.state) !== 'running', 'Do it again, now flagged: its page, where Start opens the dialog');
      await p.click('#supClose'); await p.waitForTimeout(150);
      await flag(p, ['after-talk']);
      await E(p, () => { const X = window.__entrain; X.P.view = X.P.def = X.pDef('call'); X.P.chain = null; X.P.steps = X.pPlan(X.P.def, 30).steps; X.pDone({ secs: 600, early: true, hrPts: [] }, true); });
      await p.waitForTimeout(150);
      const nx = await E(p, () => { const a = document.querySelector('#sDone .sd-next a'); return a ? a.textContent + '>' + a.getAttribute('href') : ''; });
      await p.click('#sDone .sd-next a'); await p.waitForTimeout(300);
      await p.click('#sGo'); await p.waitForTimeout(200);
      ok(nx === 'After the ConversationDonation>#practice/after-talk' && (await dlg(p)).open && await E(p, () => window.__entrain.P.state) !== 'running', 'the end screen\'s suggestion carries the badge, and its page\'s Start opens the dialog: ' + nx);
      await p.context().close();

      // the end screens, Today, Settings and the impressum say what's free and what isn't, and still offer Ko-fi
      p = await page(APP, { hash: 'settings' });
      const about = await t(p, '.st-about');
      await go(p, 'l-impressum', 300);
      const imp = await E(p, () => [...document.querySelectorAll('.imprint p')].map(x => x.textContent.replace(/\s+/g, ' ')).join(' '));
      ok(/Entrain has no ads, and most of it is free\. The techniques from the brain-wave guide open with a donation of €1 or more on each device/.test(about) && /Support Entrain on Ko-fi/.test(about) &&
        /Entrain has no ads, and most of it is free\./.test(imp) && /checked on the device, so nothing is sent anywhere/.test(imp), 'Settings\' About and the impressum say most of it is free, and what the donation opens');
      await p.context().close();
    }

    /* B. unlocking: the test copy trusts the test key */
    if (!only || only === 'B') {
      // pasted: wrapped, in lower case, with the letters that look like digits
      let p = await page(HOME, { http: true, clip: true, hash: 'practice/anapana' });
      await flag(p, ['anapana', 'b:box', 't:theta-meditation']);
      await p.click('#sGo'); await p.waitForTimeout(200);
      let d = await dlg(p);
      const dev = await E(p, () => localStorage.getItem('entrain.device'));
      await p.click('#supCopy'); await p.waitForTimeout(250);
      const cp = await E(p, async () => ({ said: document.querySelector('#supSaid').textContent, clip: await navigator.clipboard.readText().catch(() => '') }));
      ok(cp.said === 'Copied: ' + d.dev && cp.clip === d.dev, 'Copy puts the device code on the clipboard: ' + cp.clip);
      const other = crypto.generateKeyPairSync('ec', { namedCurve: 'prime256v1' }).privateKey;
      await p.fill('#supIn', sign(dev, other)); await p.click('#supGo'); await p.waitForTimeout(300);
      ok(/^That isn't a valid activation code\./.test((await dlg(p)).res) && !(await E(p, () => window.__entrain.supOn())), 'a code from a key the app doesn\'t trust is refused');
      await p.fill('#supIn', sign('ZZZZZ00000')); await p.click('#supGo'); await p.waitForTimeout(300);
      const wr = (await dlg(p)).res;
      ok(wr === "That code is for another device, ZZZZZ-00000. This device's code is " + d.dev + ': a donation with it unlocks this one.' && !(await E(p, () => window.__entrain.supOn())),
        'a code for another device is refused, naming both: ' + wr);
      const code = sign(dev), dash = code.slice(0, 5).toLowerCase().replace(/0/g, 'o').replace(/1/g, 'l') + '-' + code.slice(5, 10).toLowerCase() + code.slice(10);
      await p.fill('#supIn', 'Your activation code: ' + dash.slice(0, 40) + ' ' + dash.slice(40, 70) + '  ' + dash.slice(70) + ' (open it on the same device)'); await p.click('#supGo'); await p.waitForTimeout(400);
      d = await dlg(p);
      const s1 = await E(p, () => ({ on: window.__entrain.supOn(), state: window.__entrain.SUP.state, kept: localStorage.getItem('entrain.unlock') }));
      ok(d.res === THANKS && s1.on && s1.state === 'ok' && s1.kept === code && !d.steps && d.close === 'Close',
        'a valid code for this device unlocks it, pasted wrapped, in lower case, with O and L for 0 and 1: ' + d.res);
      await p.click('#supClose'); await p.waitForTimeout(150);
      ok(/^Start \d+ min$/.test(await t(p, '#sGo')) && await p.$eval('#sSupNote', e => e.hidden), 'the page\'s Start is back: ' + await t(p, '#sGo'));
      await p.click('#sGo'); await p.waitForTimeout(300);
      ok(await E(p, () => window.__entrain.P.state) === 'running' && await shut(p), 'and the practice starts');
      await p.click('#sEnd'); await p.click('#sEnd'); await p.waitForTimeout(300);
      await go(p, 'practice', 450);
      ok(await E(p, () => !document.querySelector('#prLib .sup-tag')), 'no badges in the library once unlocked');
      await go(p, 'breathe', 300);
      await p.click('#bPats label:has(input[value="box"])'); await p.waitForTimeout(200);
      ok(await shut(p) && await E(p, () => window.__entrain.BC.pattern) === 'box' && await E(p, () => !document.querySelector('#bPats .sup-tag')), 'the pattern is picked freely, its chip without the cup');
      await go(p, 'track/theta-meditation');
      await p.click('#trGo'); await p.waitForTimeout(400);
      ok(await shut(p) && await E(p, () => window.__entrain.A.playing), 'and the track plays');
      await p.click('#trGo'); await p.waitForTimeout(150);
      await go(p, 'st-supporter', 400);
      ok(await t(p, '#supSt') === 'Unlocked on this device. Thank you for your donation.' && await p.$eval('#supStHow', e => e.hidden) && await t(p, '#supStDev') === d.dev, 'Settings says it\'s unlocked on this device');
      // kept through a reload
      await p.reload(); await p.waitForTimeout(400); await unlocked(p);
      const s2 = await E(p, () => ({ on: window.__entrain.supOn(), dev: localStorage.getItem('entrain.device') }));
      ok(s2.on && s2.dev === dev, 'it stays unlocked through a reload: ' + await E(p, () => window.__entrain.SUP.state));
      // a backup leaves both out; restoring one keeps them
      await go(p, 'settings', 400);
      const [dl] = await Promise.all([p.waitForEvent('download'), p.click('#stSave')]);
      const saved = path.join(DIR, 'backup.json'); await dl.saveAs(saved);
      const bk = JSON.parse(fs.readFileSync(saved, 'utf8'));
      ok(!('device' in bk.data) && !('unlock' in bk.data) && !JSON.stringify(bk).includes(dev), 'a backup carries neither the device code nor the unlock: ' + Object.keys(bk.data).join(' '));
      const crafted = path.join(DIR, 'crafted.json');
      fs.writeFileSync(crafted, JSON.stringify(Object.assign({}, bk, { data: Object.assign({}, bk.data, { device: 'ZZZZZ00000', unlock: sign('ZZZZZ00000'), favs: '["anapana"]' }) })));
      await p.setInputFiles('#stLoad', crafted); await p.waitForTimeout(250);
      await Promise.all([p.waitForNavigation(), p.click('#stRestoreGo')]);
      await p.waitForTimeout(500); await unlocked(p);
      const s3 = await E(p, () => ({ on: window.__entrain.supOn(), dev: localStorage.getItem('entrain.device'), code: localStorage.getItem('entrain.unlock'), favs: localStorage.getItem('entrain.favs') }));
      ok(s3.favs === '["anapana"]' && s3.dev === dev && s3.code === code && s3.on, 'a restore keeps this device\'s code and unlock, even from a backup that holds another device\'s: still unlocked');
      // cleared storage: a new device code, locked again
      await E(p, () => localStorage.clear());
      await p.reload(); await p.waitForTimeout(400); await unlocked(p);
      await flag(p, ['anapana']);
      await go(p, 'practice/anapana');
      await p.click('#sGo'); await p.waitForTimeout(200);
      d = await dlg(p);
      const s4 = await E(p, () => ({ on: window.__entrain.supOn(), state: window.__entrain.SUP.state, dev: localStorage.getItem('entrain.device') }));
      ok(!s4.on && s4.state === 'none' && d.open && s4.dev && s4.dev !== dev && d.dev.replace('-', '') === s4.dev, 'once the browser\'s data is cleared, it\'s locked again, with a new device code: ' + d.dev);
      await p.context().close();

      // the link from the email, in the app already open
      p = await page(HOME, { http: true });
      await go(p, 'practice', 400);
      const dev2 = await E(p, () => window.__entrain.supDevice());
      const len0 = await E(p, () => history.length);
      await go(p, 'unlock/' + sign(dev2), 700);
      const l1 = await E(p, () => ({ hash: location.hash, len: history.length, on: window.__entrain.supOn(), toast: document.querySelector('#toast').hidden ? '' : document.querySelector('#toast').textContent.trim(),
        st: document.querySelector('#supSt') ? document.querySelector('#supSt').textContent : '', view: !document.querySelector('#v-settings').hidden }));
      ok(l1.on && l1.hash === '#st-supporter' && l1.view && /^Unlocked on this device\. Thank you for your donation\./.test(l1.toast) && /^Unlocked on this device/.test(l1.st),
        'the activation link unlocks this device, says thank you, and opens Settings\' section: ' + l1.toast);
      ok(l1.len === len0 + 1 && !(await E(p, () => location.href.includes('unlock/'))), 'and the code doesn\'t stay in the history (one entry, replaced)');
      await p.goBack(); await p.waitForTimeout(300);
      ok(await E(p, () => location.hash) === '#practice', 'Back goes to where you were, not to the link');
      await go(p, 'unlock', 400);
      ok(await E(p, () => location.hash) === '#st-supporter' && await shut(p), 'once unlocked, #unlock opens Settings\' section rather than the dialog');
      await p.context().close();
      // opened from the email straight at the link, on the device it was made for
      p = await page(HOME, { http: true, seed: { device: 'K7Q2M9X4PB' }, hash: 'unlock/' + sign('K7Q2M9X4PB') });
      await until(p, () => window.__entrain.supOn() && location.hash === '#st-supporter');
      ok(await E(p, () => window.__entrain.supOn() && location.hash === '#st-supporter' && /^Unlocked/.test(document.querySelector('#supSt').textContent)), 'opened at the link, it unlocks as it starts');
      await p.context().close();
      // a link for another device, and a broken one: Settings' section says why
      p = await page(HOME, { http: true, seed: { device: 'K7Q2M9X4PB' }, hash: 'unlock/' + sign('ZZZZZ00000') });
      await p.waitForTimeout(300);
      const w1 = await E(p, () => ({ hash: location.hash, res: document.querySelector('#supStRes').textContent, on: window.__entrain.supOn(), kept: localStorage.getItem('entrain.unlock') }));
      ok(w1.hash === '#st-supporter' && w1.res === "That code is for another device, ZZZZZ-00000. This device's code is K7Q2M-9X4PB: a donation with it unlocks this one." && !w1.on && w1.kept === null,
        'a link for another device opens Settings\' section with why, naming both codes: ' + w1.res);
      await go(p, 'unlock/' + encodeURIComponent('K7Q2M9X4PB.not-a-signature'), 500);
      ok(/^That isn't a valid activation code\./.test(await t(p, '#supStRes')) && await E(p, () => location.hash === '#st-supporter' && !window.__entrain.supOn()), 'and a broken link: not a valid code');
      await p.context().close();

      // unlockInit: the helper later suites use
      p = await page(TEST, { unlock: true, hash: 'practice/anapana' });
      ok(await E(p, () => window.__entrain.SUP.state === 'ok' && localStorage.getItem('entrain.device') === 'TEST0TEST0'), 'unlockInit stores device TEST0TEST0 and a test-key code that unlocks the test copy');
      await flag(p, ['anapana']);
      await p.click('#sGo'); await p.waitForTimeout(300);
      ok(await E(p, () => window.__entrain.P.state) === 'running' && await shut(p), 'a flagged practice starts at once');
      await p.click('#sEnd'); await p.click('#sEnd'); await p.waitForTimeout(300);
      // a check still running when Start is tapped: it waits for the answer, then starts
      await go(p, 'practice'); await go(p, 'practice/anapana');
      await E(p, () => { window.__entrain.supKept(); document.querySelector('#sGo').click(); window.__st = [window.__entrain.SUP.state, window.__entrain.P.state, document.querySelector('#supModal').hidden]; });
      await p.waitForTimeout(400);
      const wt = await E(p, () => window.__st.concat([window.__entrain.P.state]));
      ok(wt[0] === 'checking' && wt[1] === 'intro' && wt[2] && wt[3] === 'running' && await shut(p), 'tapped while the kept code is being checked, Start waits for the answer, then starts: ' + wt.join(' → '));
      await p.context().close();
      // a browser that keeps nothing: a device code for this visit, said so, and an unlock that lasts until the page closes
      p = await page(TEST, { hash: 'practice/anapana', init: () => {
        const si = Storage.prototype.setItem;
        Storage.prototype.setItem = function (k, v) { if (/^entrain\.(device|unlock)$/.test(k)) throw new DOMException('full', 'QuotaExceededError'); return si.call(this, k, v); };
      } });
      await flag(p, ['anapana']);
      await p.click('#sGo'); await p.waitForTimeout(200);
      d = await dlg(p);
      const memDev = d.dev.replace('-', '');
      await p.fill('#supIn', sign(memDev)); await p.click('#supGo'); await p.waitForTimeout(300);
      const mem = await E(p, () => ({ on: window.__entrain.supOn(), dev: localStorage.getItem('entrain.device') }));
      ok(d.warn === "This browser isn't keeping Entrain's data, so an unlock would last only until this page closes." && /^[0-9A-Z]{5}-[0-9A-Z]{5}$/.test(d.dev) && mem.on && mem.dev === null,
        'where the browser keeps nothing, the dialog says so, with a device code for this visit, and its code unlocks this visit: ' + d.warn);
      await p.context().close();
      // a page the browser gives no cryptography (plain http): said in the dialog, and a kept code can't be checked
      const noCrypto = () => { Object.defineProperty(Crypto.prototype, 'subtle', { configurable: true, get: () => undefined }); };
      p = await page(TEST, { hash: 'practice/anapana', init: noCrypto, seed: { device: 'K7Q2M9X4PB', unlock: sign('K7Q2M9X4PB') } });
      await flag(p, ['anapana']);
      await p.click('#sGo'); await p.waitForTimeout(200);
      d = await dlg(p);
      await p.fill('#supIn', sign('K7Q2M9X4PB')); await p.click('#supGo'); await p.waitForTimeout(300);
      const nc = await E(p, () => ({ state: window.__entrain.SUP.state, on: window.__entrain.supOn() }));
      ok(nc.state === 'no-crypto' && !nc.on && d.open && /^Unlocking needs Entrain opened from its web address \(https\) or as a file on this device/.test(d.warn) &&
        /^This page can't check codes\. Open Entrain from its web address \(https\) or as a file on this device/.test((await dlg(p)).res), 'without the browser\'s cryptography, the dialog says where unlocking works: ' + d.warn);
      await p.context().close();
      // the real build doesn't take the test key's codes
      p = await page(APP, { unlock: true });
      ok(await E(p, () => window.__entrain.SUP.state === 'bad' && !window.__entrain.supOn()), 'the real build refuses a code from the test key: ' + await E(p, () => window.__entrain.SUP.state));
      await p.context().close();
    }

    /* C. the developer's tool */
    if (!only || only === 'C') {
      const tool = (args, env) => { const r = spawnSync(process.execPath, [path.join(ROOT, 'src/unlock.js')].concat(args), { cwd: ROOT, encoding: 'utf8', env: Object.assign({}, process.env, { ENTRAIN_UNLOCK_KEY: '' }, env || {}) }); return { code: r.status, out: (r.stdout || '') + (r.stderr || '') }; };
      testApp();
      let r = tool(['sign', 'TEST0-TEST0', '--key', KEY_FILE]);
      ok(r.code === 1 && /^Refused: the public half of .* isn't in SUP_KEYS/.test(r.out), 'sign refuses a key whose public half isn\'t in SUP_KEYS: ' + r.out.split('\n')[0].slice(0, 90));
      r = tool(['sign', 'k7q2m-9x4pb', '--key', KEY_FILE, '--keys-from', FILE]);
      const m = r.out.match(/^K7Q2M-9X4PB\n  code  (K7Q2M9X4PB\.[\w-]{86})\n  link  https:\/\/misterclarity\.github\.io\/biney\/#unlock\/(K7Q2M9X4PB\.[\w-]{86})$/m);
      ok(r.code === 0 && m && m[1] === m[2], 'with the test copy\'s keys it signs, printing the code and the link to the site: ' + (m ? m[1].slice(0, 20) + '…' : r.out.slice(0, 120)));
      const p = await page(HOME, { http: true, seed: { device: 'K7Q2M9X4PB' }, hash: m ? 'unlock/' + m[1] : '' });
      await until(p, () => window.__entrain.supOn());
      ok(await E(p, () => window.__entrain.supOn()), 'and the test copy accepts its link');
      await p.context().close();
      r = tool(['sign', 'K7Q2M-9X4PB', '--base', 'https://example.org/entrain/'], { ENTRAIN_UNLOCK_KEY: KEY_FILE });
      ok(r.code === 1 && /Refused/.test(r.out), '$ENTRAIN_UNLOCK_KEY names the key when --key doesn\'t (and the same refusal)');
      r = tool(['sign', 'K7Q2M-9X4PB', '--base', 'https://example.org/entrain/', '--trust', KEY_FILE], { ENTRAIN_UNLOCK_KEY: KEY_FILE });
      ok(r.code === 0 && /\n  link  https:\/\/example\.org\/entrain\/#unlock\/K7Q2M9X4PB\./.test(r.out), '--trust adds a key, and --base sets where the link opens');
      const mail = path.join(DIR, 'kofi.txt');
      fs.writeFileSync(mail, 'From: Ko-fi <hello@ko-fi.com>\nSam bought you a coffee (€3.00)\nMessage: "thanks! my code is ab1cd-ef2gh"\n\nAlex bought you a coffee (€1.00)\nMessage: K7Q2M-9X4PB please, and again K7Q2M-9X4PB\nwell-known heart-rates\n');
      r = tool(['sign', '--from', mail, '--key', KEY_FILE, '--keys-from', FILE]);
      const found = (r.out.match(/^[0-9A-Z]{5}-[0-9A-Z]{5}  \(line \d+:.*$/gm) || []);
      ok(r.code === 0 && found.length === 3 && /^AB1CD-EF2GH  \(line 3: Message: "thanks! my code is ab1cd-ef2gh"\)$/.test(found[0]) && /^K7Q2M-9X4PB  \(line 6: /.test(found[1]) &&
        /^HEART-RATES  \(line 7: well-known heart-rates\)  check: this may be two words, not a code$/.test(found[2]) && /Check that each donation is €1 or more before you send its link\./.test(r.out),
        'sign --from finds each device code in a Ko-fi email once, with its line, flags words that look like one, and reminds you to check the amount: ' + found.length + ' found');
      r = tool(['verify', 'https://misterclarity.github.io/biney/#unlock/' + sign('K7Q2M9X4PB'), '--keys-from', FILE]);
      const r2 = tool(['verify', sign('K7Q2M9X4PB')]), r3 = tool(['verify', 'nonsense']);
      ok(r.code === 0 && /^Device K7Q2M-9X4PB\.\nSigned by trusted key 1 of 1/.test(r.out) && r2.code === 1 && /Not signed by a trusted key/.test(r2.out) && r3.code === 1,
        'verify says which device a link unlocks and whether a trusted key signed it: ' + r.out.split('\n')[1]);
      // keygen: a new key, private, never over another; --add puts its public half after the others
      const k1 = path.join(DIR, 'keys', 'one.pem'), sup = path.join(DIR, 'supporter.js');
      fs.copyFileSync(path.join(ROOT, 'src/js/supporter.js'), sup);
      r = tool(['keygen', '--out', k1]);
      const mode = fs.statSync(k1).mode & 0o777, pub = JSON.parse((r.out.match(/^\{"kty".*\}$/m) || ['{}'])[0]);
      ok(r.code === 0 && mode === 0o600 && pub.kty === 'EC' && pub.crv === 'P-256' && pub.x && !fs.readFileSync(sup, 'utf8').includes(pub.x), 'keygen writes a new private key only you can read (mode ' + mode.toString(8) + ') and prints its public key');
      r = tool(['keygen', '--out', k1]);
      ok(r.code === 1 && /never overwrites/.test(r.out), 'and never writes over a key');
      const k2 = path.join(DIR, 'keys', 'two.pem');
      r = tool(['keygen', '--out', k2, '--add', '--supporter', sup]);
      const line = fs.readFileSync(sup, 'utf8').match(/^  var SUP_KEYS = (\[.*\]);$/m), keys = line ? JSON.parse(line[1]) : [];
      const pub2 = crypto.createPublicKey(fs.readFileSync(k2)).export({ format: 'jwk' });
      ok(r.code === 0 && keys.length === 2 && keys[0].x === 'x7VHEChKqEpO9I-LcD_e_nSFgbTr33QoZV1CsGGYQD0' && keys[1].x === pub2.x, '--add appends its public key to SUP_KEYS, keeping the one before');
      r = tool(['sign', 'K7Q2M-9X4PB', '--key', k2, '--supporter', sup]);
      const c2 = (r.out.match(/  code  (\S+)/) || [])[1];
      r = tool(['verify', c2 || 'x', '--supporter', sup]);
      ok(r.code === 0 && /Signed by trusted key 2 of 2/.test(r.out), 'and what it signs verifies against the new list');
    }
    ok(!net.length, 'nothing reached the network' + (net.length ? ': ' + net.join(' ') : ''));
  } catch (e) { log.push('ERROR ' + e.message + '\n' + e.stack); }
  console.log(log.join('\n'));
  console.log(log.filter(l => l.startsWith('PASS')).length + ' passed, ' + log.filter(l => /^(FAIL|PAGEERROR|ERROR|CONSOLE)/.test(l)).length + ' problems');
  srv.close();
  await browser.close();
})();
