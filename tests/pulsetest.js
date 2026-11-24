// The light pulse at 40 Hz (pulse.js): a soft glow that brightens and dims 40 times a second on the 40 Hz tracks, with
// the guide's seizure risk taken seriously. The screen's frame clock is a stand-in here (RAF below), so a 60, 90, 120 or
// 144 Hz screen, a late picture and a held picture can be set at will; what reaches the screen is read from pictures of it.
//   A  locked on the real build: the card on the two 40 Hz tracks only, free to read with its caution and the research;
//      Start waiting for the health check, then carrying the cup and opening the dialog that names it, nothing starting;
//      Check this screen free, a 60 Hz screen kept off with the reason (a 20 Hz flicker), a 90 Hz one too, an uneven one;
//      epilepsy ticked keeping it off; Settings' list, search, Learn's section, glance row, references and safety line
//   B  unlocked, the question before it: the screen measured first, the dialog with its cautions and a box to tick,
//      Start waiting for the tick, Tab kept inside, Escape and a tap outside closing it with nothing started; then the
//      track and the stage together, focus on End, Tab between its two buttons
//   C  unlocked, the light itself: each picture's light a sine at 40 Hz (three pictures a cycle at 120 Hz, the spectrum
//      at 144 Hz), growing over two seconds, between 10% and 17% of white; on pictures of the screen, the glow's centre
//      changing by under the 10% WCAG counts as a flash, grey with no colour, on part of the screen only, the light as
//      the sRGB sums say; late pictures held at the middle level, and a screen that keeps falling behind ending it
//   D  unlocked, every way it ends: a tap (which reaches nothing underneath), Escape, Space (the sound plays on), ten
//      minutes, the sound paused, another page, going out of sight, reduced motion turned on, I need to stop (Settle);
//      reduced motion keeping it off; its minutes in the track's history
//   E  360 px, 44 px buttons and 24 px links, British spelling in every new word, no other track touched
// Run: node tests/pulsetest.js [group letter]
const zlib = require('zlib');
const { chromium, APP, OUT } = require('./pw');
const { testApp, unlockInit, unlocked, sign } = require('./unlock-helper');
const S20 = 'Mozilla/5.0 (Linux; Android 13; SM-G988B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Mobile Safari/537.36';
const only = process.argv[2] || '';
const t = (p, s) => p.$eval(s, e => e.textContent.replace(/\s+/g, ' ').trim()).catch(() => '(missing)');
const E = (p, f, a) => p.evaluate(f, a);
const go = async (p, h, ms) => { await p.evaluate(x => location.hash = x, h); await p.waitForTimeout(ms || 400); };
const until = async (p, f, ms, a) => { try { await p.waitForFunction(f, a, { timeout: ms || 5000 }); return true; } catch (e) { return false; } };
const SPELL = /\b(programs?|toward|synthesiz\w*|color\w*|favor\w*|behavior\w*|center(?:s|ed)?|organiz\w*|realiz\w*|recogniz\w*|minimiz\w*|optimiz\w*|personaliz\w*|prioritiz\w*|visualiz\w*|analyz\w*|gray|fiber|aging)\b/i;
const NONE = JSON.stringify({ at: Date.now(), on: [] });
const EPI = JSON.stringify({ at: Date.now(), on: ['epilepsy'] });

// a screen's frame clock at hz pictures a second: one time stamp per picture for every callback asked for before it,
// a step of exactly 1000/hz ms each (window.__rafHz changes it). __rafJank: each picture a whole frame late.
// __rafHold: pictures wait, and __rafStep lets that many through. A picture comes every 4 ms of real time.
const RAF = hz => {
  if (!hz) return;
  window.__rafHz = hz;
  let t = performance.now(), n = 0, cbs = [], ticking = false;
  const dead = new Set();
  const tick = () => {
    if (window.__rafHold) { if (window.__rafStep > 0) window.__rafStep--; else { setTimeout(tick, 10); return; } }
    t += 1000 / window.__rafHz * (window.__rafJank ? 2 : 1);
    const run = cbs; cbs = []; ticking = false;
    run.forEach(([id, cb]) => { if (!dead.has(id)) cb(t); });
  };
  window.requestAnimationFrame = cb => { const id = ++n; cbs.push([id, cb]); if (!ticking) { ticking = true; setTimeout(tick, 4); } return id; };
  window.cancelAnimationFrame = id => dead.add(id);
};

// a PNG screenshot read back into its pixels (8 bits a channel, RGB or RGBA, not interlaced: what the browser gives)
function png(buf) {
  let o = 8, w = 0, h = 0, type = 0;
  const idat = [];
  while (o < buf.length) {
    const len = buf.readUInt32BE(o), kind = buf.toString('latin1', o + 4, o + 8), d = buf.subarray(o + 8, o + 8 + len);
    if (kind === 'IHDR') { w = d.readUInt32BE(0); h = d.readUInt32BE(4); type = d[9]; if (d[8] !== 8 || d[12] !== 0) throw new Error('unexpected PNG'); }
    else if (kind === 'IDAT') idat.push(d);
    o += 12 + len;
  }
  const ch = type === 6 ? 4 : type === 2 ? 3 : 0;
  if (!ch) throw new Error('PNG colour type ' + type);
  const raw = zlib.inflateSync(Buffer.concat(idat)), stride = w * ch, px = Buffer.alloc(h * stride);
  for (let y = 0; y < h; y++) {
    const f = raw[y * (stride + 1)], row = raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1)), at = y * stride;
    for (let x = 0; x < stride; x++) {
      const a = x >= ch ? px[at + x - ch] : 0, b = y ? px[at - stride + x] : 0, c = x >= ch && y ? px[at - stride + x - ch] : 0;
      let v = row[x];
      if (f === 1) v += a; else if (f === 2) v += b; else if (f === 3) v += (a + b) >> 1;
      else if (f === 4) { const q = a + b - c, pa = Math.abs(q - a), pb = Math.abs(q - b), pc = Math.abs(q - c); v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c; }
      px[at + x] = v & 255;
    }
  }
  return { w, h, ch, px };
}
const lin = v => { v /= 255; return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
const relLum = (r, g, b) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
// the glow's centre (a 20 px square, its mean) and how much of the screen is lit above the stage's grey
async function shot(p) {
  const im = png(await p.screenshot());
  const cx = im.w >> 1, cy = im.h >> 1;
  let r = 0, g = 0, b = 0, n = 0, lit = 0, all = 0, spread = 0;
  for (let y = cy - 10; y < cy + 10; y++) for (let x = cx - 10; x < cx + 10; x++) { const i = (y * im.w + x) * im.ch; r += im.px[i]; g += im.px[i + 1]; b += im.px[i + 2]; n++; spread = Math.max(spread, Math.abs(im.px[i] - im.px[i + 1]), Math.abs(im.px[i + 1] - im.px[i + 2])); }
  for (let y = 0; y < im.h; y += 2) for (let x = 0; x < im.w; x += 2) { const i = (y * im.w + x) * im.ch; all++; if (im.px[i + 1] > 20) lit++; }
  r /= n; g /= n; b /= n;
  return { r, g, b, L: relLum(r, g, b), spread, lit: lit / all };
}

(async () => {
  const browser = await chromium.launch();
  const log = []; const ok = (c, m) => log.push((c ? 'PASS ' : 'FAIL ') + m);
  const URL = testApp();
  // a phone with debug on; o.url: the test copy; o.unlock: this device unlocked; o.hz: the screen's pictures a second;
  // o.rm: reduced motion; o.vp: the viewport
  const page = async (st, o) => {
    o = o || {};
    const ctx = await browser.newContext({ userAgent: S20, viewport: o.vp || { width: 412, height: 915 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true,
      reducedMotion: o.rm ? 'reduce' : 'no-preference' });
    const p = await ctx.newPage();
    p.on('pageerror', e => log.push('PAGEERROR ' + e.message));
    p.on('console', m => { if (m.type() === 'error') log.push('CONSOLE ' + m.text()); });
    if (o.unlock) await unlockInit(p);
    await p.addInitScript(s => {
      if (!sessionStorage.getItem('z.seeded')) {
        sessionStorage.setItem('z.seeded', '1');
        localStorage.setItem('entrain.debug', '1'); localStorage.setItem('entrain.stereo', 'ok'); localStorage.setItem('entrain.amb', 'off');
        for (const k in s) localStorage.setItem('entrain.' + k, s[k]);
      }
      if (window.speechSynthesis) { speechSynthesis.speak = () => {}; speechSynthesis.cancel = () => {}; }
    }, st || {});
    await p.addInitScript(RAF, o.hz === undefined ? 120 : o.hz);
    await p.goto(o.url || APP);
    await unlocked(p);
    await p.waitForTimeout(200);
    return p;
  };
  const card = p => E(p, () => {
    const c = document.querySelector('#lpCard'), tx = e => e ? e.textContent.replace(/\s+/g, ' ').trim() : '';
    if (!c) return null;
    const go = document.querySelector('#lpGo');
    return { h: tx(c.querySelector('h3')), exp: !!c.querySelector('h3 .lt-exp'), st: tx(document.querySelector('#lpSt')), go: tx(go), cup: !!go.querySelector('.sup-tag'), dis: go.disabled,
      check: !document.querySelector('#lpCheck').disabled, caution: tx(c.querySelector('.si-caution')), safe: !!c.querySelector('.si-caution [data-safety]'), hc: tx(document.querySelector('#lpHc')),
      links: [...c.querySelectorAll('a')].map(a => a.getAttribute('href')), txt: tx(c) };
  });
  const state = p => E(p, () => { const X = window.__entrain; return { on: X.LP.on, hz: X.LP.hz, meas: X.LP.measuring, why: X.LP.why, stage: !document.querySelector('#lpStage').hidden,
    ask: !document.querySelector('#lpModal').hidden, sup: !document.querySelector('#supModal').hidden, playing: X.A.playing, track: X.A.track ? X.A.track.id : '',
    toast: document.querySelector('#toast') && !document.querySelector('#toast').hidden ? document.querySelector('#toastTxt').textContent : '' }; });
  // from the track page to the stage: Start, the screen measured, the box ticked, Start
  const begin = async p => {
    await p.click('#lpGo');
    await until(p, () => !document.querySelector('#lpModal').hidden, 4000);
    await p.click('#lpOk'); await p.click('#lpYes');
    await until(p, () => window.__entrain.LP.on, 3000);
  };

  try {
    /* A. locked on the real build */
    if (!only || only === 'A') {
      const p = await page(null, { hz: 60 });
      const fits = await E(p, () => window.__entrain.TRACKS.filter(x => window.__entrain.lpFits(x)).map(x => x.id).join(' '));
      ok(fits === 'gamma-40 gamma-memory', 'the light pulse goes with the two tracks of a steady 40 Hz beat: ' + fits);
      const others = [];
      for (const id of ['theta-meditation', 'deep-work', 'tinnitus-notch', 'sleep-descent', 'vigilance-16']) { await go(p, 'track/' + id, 300); if (await E(p, () => !!document.querySelector('#lpCard'))) others.push(id); }
      ok(!others.length, 'and no other track has it' + (others.length ? ': ' + others.join(', ') : ''));
      await go(p, 'track/gamma-memory', 400);
      ok(!!(await card(p)), 'Working Memory Gamma has it');
      await go(p, 'track/gamma-40', 500);
      let c = await card(p);
      ok(c && c.h === 'Light pulse at 40 Hz Experimental' && c.exp && c.links.includes('#l-flicker') && /brightens and dims 40 times a second, with the beat, for up to ten minutes/.test(c.txt) &&
        /early, in mice and in people with Alzheimer's disease, with lights far stronger than this/.test(c.txt) && /low in contrast, smooth, and on part of the screen/.test(c.txt),
        'Gamma Focus 40 has the card, marked Experimental: what it is, the research as early, gentle on purpose, and a link to Learn: ' + (c && c.h));
      ok(c.safe && /photosensitive epilepsy, sometimes their first/.test(c.caution) && /isn't for anyone with epilepsy, or for children/.test(c.caution) && /well-lit room/.test(c.caution),
        'its caution is there to read, with the safety notes link: ' + c.caution.slice(0, 90) + '…');
      ok(c.dis && /once your health check is answered, with epilepsy and seizures from flashing light left unticked/.test(c.st) && c.links.includes('#st-health') && c.check,
        'with no health check yet, Start waits and the card says why, with a link to answer it; Check this screen is free: ' + c.st);
      await p.click('#lpGo', { force: true }); await p.waitForTimeout(300);
      let s = await state(p);
      ok(!s.sup && !s.ask && !s.on && !s.meas, 'a press on the waiting Start does nothing');
      // answered, nothing ticked
      await E(p, n => localStorage.setItem('entrain.health', n), NONE);
      await go(p, 'home', 200); await go(p, 'track/gamma-40', 500);
      c = await card(p);
      ok(!c.dis && c.cup && c.go === 'Start the light pulseDonation' && /at least 120 pictures a second/.test(c.st), 'answered with nothing ticked, Start carries the cup: ' + c.go + ' / ' + c.st);
      await p.click('#lpGo'); await p.waitForTimeout(400);
      s = await state(p);
      ok(s.sup && await t(p, '#supFor') === 'Light pulse at 40 Hz is one of the new techniques.' && !s.ask && !s.on && !s.meas && !s.playing && s.hz === null,
        'Start opens the dialog that names it, measuring nothing and playing nothing: ' + await t(p, '#supFor'));
      await p.click('#supClose'); await p.waitForTimeout(200);
      // Check this screen, free: 60 Hz is too slow, and why
      await p.click('#lpCheck');
      await until(p, () => !window.__entrain.LP.measuring && window.__entrain.LP.hz !== null, 4000);
      c = await card(p); s = await state(p);
      ok(Math.round(s.hz) === 60 && c.dis && /about 60 pictures a second/.test(c.st) && /flicker about 20 times a second, in the range most likely to set off a seizure/.test(c.st) &&
        /stays off on this screen/.test(c.st) && /120 Hz or smooth display setting/.test(c.st) && !s.sup,
        'Check this screen, with no dialog: a 60 Hz screen keeps it off, saying a 40 Hz pulse would come out at 20 a second: ' + c.st.slice(0, 120) + '…');
      await E(p, () => { window.__rafHz = 90; }); await p.click('#lpCheck');
      await until(p, () => !window.__entrain.LP.measuring && Math.round(window.__entrain.LP.hz) === 90, 4000);
      c = await card(p);
      ok(c.dis && /about 90 pictures a second/.test(c.st) && /uneven, with slower flicker in it/.test(c.st), 'a 90 Hz screen too, uneven: ' + c.st.slice(0, 100));
      await E(p, () => { window.__rafHz = 144; }); await p.click('#lpCheck');
      await until(p, () => !window.__entrain.LP.measuring && Math.round(window.__entrain.LP.hz) === 144, 4000);
      c = await card(p);
      ok(!c.dis && c.cup && /about 144 pictures a second: enough for an even pulse/.test(c.st), 'a 144 Hz screen is fast enough: ' + c.st);
      // the frame times read: a steady screen, one that stumbles, too few frames
      const hzs = await E(p, () => { const f = window.__entrain.lpHzOf, ev = (n, d) => Array.from({ length: n }, (_, i) => i * d);
        const rough = ev(70, 8.333).map((x, i) => x + (i % 2 ? 6 : 0)); const odd = []; let t = 0; for (let i = 0; i < 70; i++) { t += [8.3, 16.7, 25][i % 3]; odd.push(t); }
        return [f(ev(70, 1000 / 120)), f(ev(70, 1000 / 60)), f(odd), f(ev(10, 8.3)), f(rough)].map(x => Math.round(x)); });
      ok(hzs[0] === 120 && hzs[1] === 60 && hzs[2] === 0 && hzs[3] === 0 && hzs[4] === 0, 'the frame times read as 120 and 60, and as nothing (0) when they disagree or are too few: ' + hzs.join(' '));
      await E(p, () => { window.__entrain.LP.hz = 0; window.__entrain.supRefresh(); });
      c = await card(p);
      ok(c.dis && /couldn't tell how fast this screen draws/.test(c.st), 'a screen it couldn\'t read keeps it off: ' + c.st);
      // epilepsy ticked
      await E(p, n => localStorage.setItem('entrain.health', n), EPI);
      await go(p, 'home', 200); await go(p, 'track/gamma-40', 500);
      c = await card(p);
      ok(c.dis && /lists epilepsy or seizures from flashing light, so the light pulse stays off for you/.test(c.st) && /The 40 Hz sound is still yours to play/.test(c.st) &&
        /From your health check\. Flashing light can set off a seizure .* With epilepsy, Entrain keeps the light pulse off for you; the 40 Hz sound plays as usual\./.test(c.hc),
        'with epilepsy ticked it stays off, and the health check\'s box says so: ' + c.st);
      await p.screenshot({ path: OUT + 'pulsetest-a-locked.png', fullPage: true });
      // Settings, search, Learn
      await go(p, 'settings', 500);
      const list = await E(p, () => [...document.querySelectorAll('#supList a')].map(a => a.textContent + '>' + a.getAttribute('href')));
      ok(list.includes('Light pulse at 40 Hz>#track/gamma-40'), 'New techniques lists it: ' + list.filter(x => /Light/.test(x)).join(', '));
      ok(/with one exception: the light pulse on the 40 Hz tracks waits for your answers, and stays off with epilepsy ticked/.test(await t(p, '#st-health .st-note')) &&
        /never stops you starting anything/.test(await t(p, '#st-health .st-note')), 'the health check says the light pulse is its one exception');
      await p.click('#tbFind'); await p.waitForTimeout(250);
      const hits = async q => { await p.fill('#fdIn', q); await p.waitForTimeout(450); return E(p, () => [...document.querySelectorAll('.fd-it')].map(a => a.querySelector('b').textContent + '>' + a.getAttribute('href') + (a.querySelector('.sup-tag') ? ' +sup' : ''))); };
      const h1 = await hits('flicker'), h2 = await hits('light pulse'), h3 = await hits('40 hz light');
      ok(h1[0] === 'Light pulse at 40 Hz>#track/gamma-40 +sup' && h2[0] === h1[0] && h3.includes(h1[0]) && h1.some(x => /^Light that pulses at 40 Hz>#l-flicker/.test(x)),
        'search finds it first for flicker and light pulse, with the badge, and Learn\'s section: ' + h1.slice(0, 3).join(', '));
      await p.keyboard.press('Escape');
      await go(p, 'l-flicker', 600);
      const L = await E(p, () => {
        const tx = e => e.textContent.replace(/\s+/g, ' ').trim(), h = document.getElementById('l-flicker'), ps = [];
        for (let e = h.nextElementSibling; e && e.tagName === 'P'; e = e.nextElementSibling) ps.push(e);
        const refs = [...document.querySelectorAll('#references li')].map(li => ({ t: tx(li), a: li.querySelector('a') ? li.querySelector('a').getAttribute('href') : '' }));
        const row = [...document.querySelectorAll('#lnGlance tr.ln-row')].find(r => r.querySelector('th b').textContent === 'Rhythmic light flicker');
        const safe = [...document.querySelectorAll('#sfNote .sf-list li')].map(tx).find(x => /^Flashing light\./.test(x)) || '';
        return { h: tx(h), all: ps.map(tx).join(' '), n: ps.length, links: [].concat(...ps.map(p => [...p.querySelectorAll('a')].map(a => a.getAttribute('href')))),
          toc: [...document.querySelectorAll('.toc a')].map(a => a.textContent + '>' + a.getAttribute('href')), view: !document.querySelector('#v-learn').hidden, dlg: document.querySelector('#supModal').hidden,
          refs: ['Iaccarino, H. F.', 'Martorell, A. J.', 'Chan, D., Suk', 'Soula, M.', 'Fisher, R. S., Harding', 'World Wide Web Consortium'].map(w => { const r = refs.find(x => x.t.startsWith(w)); return r ? /^https:\/\//.test(r.a) : false; }),
          row: row ? { lo: row.children[2].classList.contains('ln-lo'), ev: tx(row.children[1]), a: [...row.children[2].querySelectorAll('a')].map(a => a.getAttribute('href')).join(' ') } : null,
          safe, after: [...document.querySelectorAll('#sfNote .sf-list li b')].map(tx).join(' | '), safeP: tx(document.querySelector('#sfNote > p:last-child')) };
      });
      ok(L.view && L.dlg && L.h === 'Light that pulses at 40 Hz' && L.n === 4 && L.toc.includes('Light pulse>#l-flicker') && L.toc.indexOf('Light pulse>#l-flicker') === L.toc.indexOf('Light colour>#l-light') + 1,
        'Learn has the section, free to read, after light colour in the contents: ' + L.h);
      ok(/\(Iaccarino et al\., 2016\)/.test(L.all) && /\(Martorell et al\., 2019\)/.test(L.all) && /\(Chan et al\., 2022\)/.test(L.all) && /\(Soula et al\., 2023\)/.test(L.all) && /\(Fisher et al\., 2005\)/.test(L.all) && L.refs.every(Boolean),
        'with the MIT studies, the pilot in people, the lab that disputes them and the seizure review, each in the references with a link: ' + L.refs.join(' '));
      ok(/15 people with mild Alzheimer's disease/.test(L.all) && /small, its outcomes exploratory/.test(L.all) && /didn't reliably lower amyloid, and the mice moved away from it/.test(L.all) &&
        /promising but early/.test(L.all) && /None of these studies was of healthy people looking for focus/.test(L.all),
        'the evidence as the guide gives it, promising but early, with the pilot\'s limits and the dispute');
      ok(/one in 4,000 between the ages of 5 and 24/.test(L.all) && /1 to 65 times a second/.test(L.all) && /15 to 25 times a second most of all/.test(L.all),
        'the seizure risk as the review gives it: how common, the range of rates and the most provocative');
      ok(/7% of the screen's white/.test(L.all) && /10% or more as a flash/.test(L.all) && /at least 120 pictures a second/.test(L.all) && /flicker 20 times a second/.test(L.all) &&
        /ends after ten minutes, with one tap anywhere/.test(L.all) && /reduced motion/.test(L.all) && /hasn't been tested, so it's marked experimental/.test(L.all) && /expectation/.test(L.all),
        'and how Entrain keeps it soft and even, its limits and that it\'s untested');
      ok(['#track/gamma-40', '#track/gamma-memory', '#st-health', '#l-expect', '#l-safety'].every(h => L.links.includes(h)), 'it links to both tracks, the health check, placebo and the safety note: ' + L.links.join(' '));
      ok(L.row && !L.lo && L.row.ev === 'Early (a seizure risk)' && L.row.a === '#track/gamma-40 #l-flicker', 'the glance row now links to it, its evidence as before: ' + JSON.stringify(L.row));
      ok(/\| Light\. \| Flashing light\. \| Cold and heat\. \|/.test(L.after) && /photosensitive epilepsy, sometimes their first/.test(L.safe) && /isn't for children/.test(L.safe) &&
        /well-lit room with the phone at arm's length, never while driving/.test(L.safe) && /With migraines, ask your doctor first/.test(L.safe) && /light pulse waits for it and stays off with epilepsy ticked/.test(L.safeP),
        'the safety note has Flashing light after Light, and its last paragraph names the exception: ' + L.safe.slice(0, 80) + '…');
      await p.context().close();
    }

    /* B. unlocked: the question before it, then the track and the stage */
    if (!only || only === 'B') {
      const p = await page({ health: NONE }, { url: URL, unlock: true });
      await go(p, 'track/gamma-40', 500);
      let c = await card(p);
      ok(!c.cup && !c.dis && c.go === 'Start the light pulse', 'unlocked, Start has no cup');
      await p.click('#lpGo');
      const asked = await until(p, () => !document.querySelector('#lpModal').hidden, 4000);
      await p.waitForTimeout(150);
      let s = await state(p);
      const D = await E(p, () => ({ h: document.querySelector('#lpTitle').textContent, li: [...document.querySelectorAll('#lpList li')].map(l => l.textContent.replace(/\s+/g, ' ')),
        tick: document.querySelector('#lpOk').checked, yes: document.querySelector('#lpYes').disabled, focus: document.activeElement.id,
        label: document.querySelector('label.lp-ok').textContent.trim() }));
      ok(asked && Math.round(s.hz) === 120 && !s.on && !s.playing, 'Start measures the screen first (120 a second), then asks, with nothing playing yet: ' + Math.round(s.hz));
      ok(D.h === 'Before the light pulse' && D.li.length === 4 && /photosensitive epilepsy, sometimes their first/.test(D.li[0]) && /keep it away from children/.test(D.li[0]) &&
        /End it at once, with a tap anywhere/.test(D.li[1]) && /migraine/.test(D.li[1]) && /well-lit room, with the phone at arm's length/.test(D.li[2]) && /Never while driving/.test(D.li[2]) &&
        /after ten minutes, when the sound stops, if the screen falls behind, or when Entrain goes out of sight/.test(D.li[3]),
        'the dialog gives its cautions: the seizure risk and children, ending it, where and how, and when it ends by itself');
      ok(!D.tick && D.yes && D.focus === 'lpOk' && D.label === "I don't have epilepsy, and flashing light has never given me a seizure.", 'its box starts unticked, Start waits for it, and focus is on it: ' + JSON.stringify([D.tick, D.yes, D.focus, D.label]));
      for (let i = 0; i < 4; i++) await p.keyboard.press('Tab');
      ok(await E(p, () => !!document.activeElement.closest('#lpModal')), 'Tab stays inside it');
      await p.keyboard.press('Escape'); await p.waitForTimeout(250);
      s = await state(p);
      const back = await E(p, () => document.activeElement.id || document.activeElement.tagName);
      ok(!s.ask && !s.on && !s.playing && back === 'lpGo', 'Escape closes it, nothing starts, and focus goes back to Start: ' + back);
      await p.click('#lpGo'); await until(p, () => !document.querySelector('#lpModal').hidden, 4000);
      ok(await E(p, () => !document.querySelector('#lpOk').checked), 'asked again, the box is unticked again: a fresh yes each time');
      await p.mouse.click(5, 5); await p.waitForTimeout(250);
      s = await state(p);
      ok(!s.ask && !s.on && !s.playing, 'a tap outside closes it too, nothing started');
      await p.click('#lpGo'); await until(p, () => !document.querySelector('#lpModal').hidden, 4000);
      await p.click('#lpNo'); await p.waitForTimeout(200);
      ok(!(await state(p)).ask, 'and so does Not now');
      await begin(p);
      await p.waitForTimeout(150);
      s = await state(p);
      const F = await E(p, () => ({ focus: document.activeElement.id, left: document.querySelector('#lpLeft').textContent, hint: document.querySelector('#lpStHint').textContent,
        body: document.body.classList.contains('lp-on'), z: +getComputedStyle(document.querySelector('#lpStage')).zIndex, veil: +getComputedStyle(document.querySelector('.lt-veil')).zIndex }));
      ok(s.on && s.stage && s.playing && s.track === 'gamma-40' && F.body, 'ticked and started: the track plays and the stage is up: ' + JSON.stringify([s.on, s.stage, s.playing, s.track]));
      ok(F.focus === 'lpEnd' && /^(10:00|09:5\d) left$/.test(F.left) && /Tap anywhere to end it; the sound plays on\./.test(F.hint) && F.z > F.veil,
        'focus on End, ten minutes counting down, and the stage above everything, the screen light\'s veil too: ' + JSON.stringify(F));
      await p.keyboard.press('Tab');
      const f1 = await E(p, () => document.activeElement.id);
      await p.keyboard.press('Tab');
      const f2 = await E(p, () => document.activeElement.id);
      ok(f1 === 'lpOut' && f2 === 'lpEnd' && (await state(p)).on, 'Tab moves between End and I need to stop, and the pulse goes on');
      await p.screenshot({ path: OUT + 'pulsetest-b-stage.png' });
      await p.keyboard.press('Escape'); await p.waitForTimeout(450);
      // started with the track already playing
      s = await state(p);
      ok(!s.on && s.playing, 'Escape ends it, and the sound plays on');
      await begin(p);
      s = await state(p);
      ok(s.on && s.playing && s.track === 'gamma-40', 'with the track already playing, it starts on top of it');
      await p.keyboard.press('Escape'); await p.waitForTimeout(450);
      // paused partway: Start resumes it
      await E(p, () => document.querySelector('#toggle').click()); await p.waitForTimeout(200);
      await begin(p);
      s = await state(p);
      ok(s.on && s.playing, 'with the track paused, Start resumes it under the pulse');
      await p.keyboard.press('Escape'); await p.waitForTimeout(450);
      await p.context().close();
      // the headphone check first: the pulse waits for a second press once the sound plays
      const q = await page({ health: NONE }, { url: URL, unlock: true });
      await E(q, () => localStorage.removeItem('entrain.stereo'));
      await go(q, 'track/gamma-40', 500);
      await begin(q);
      s = await state(q);
      const sc = await E(q, () => !document.querySelector('#scModal').hidden);
      ok(sc && !s.on && !s.playing && /starts with the sound: once the track is playing, start the light pulse again/.test(s.toast),
        'when the headphone check comes first, the pulse waits, saying to start it again once the track plays: ' + s.toast);
      await q.context().close();
    }

    /* C. the light itself */
    if (!only || only === 'C') {
      const p = await page({ health: NONE }, { url: URL, unlock: true });
      await go(p, 'track/gamma-40', 500);
      await begin(p);
      await p.waitForTimeout(1600);              // past the two seconds it grows over, at the stand-in's pace
      let R = await E(p, () => {
        const X = window.__entrain, tr = X.LP.trace;
        return { tr: tr.slice(), mid: X.LP_MID, amp: X.LP_AMP, chk: tr.every(r => Math.abs(r[1] - X.lpLum(r[0], !!r[2])) < 1e-4) };
      });
      const late = R.tr.filter(r => r[2]).length;
      const full = R.tr.filter(r => r[0] >= 2000 && !r[2]), ramp = R.tr.filter(r => r[0] < 2000);
      const lo = Math.min(...R.tr.map(r => r[1])), hi = Math.max(...R.tr.map(r => r[1]));
      ok(R.chk && !late && full.length > 60, 'every picture\'s light is the sine at its own time, none late on a steady screen: ' + R.tr.length + ' pictures');
      // three pictures a cycle at 120 Hz: the light repeats every third picture, at the middle and the middle ± 0.866 of the swing
      const per = full.every((r, i) => i < 3 || Math.abs(r[1] - full[i - 3][1]) < 1e-4);
      const lv = [...new Set(full.map(r => r[1].toFixed(4)))].sort();
      ok(per && lv.length === 3 && Math.abs(+lv[1] - R.mid) < 1e-4 && Math.abs(+lv[2] - R.mid - R.amp * Math.sin(2 * Math.PI / 3)) < 1e-4,
        'at 120 a second it repeats every third picture: 40 times a second, at three levels: ' + lv.join(' '));
      ok(lo >= 0.0999 && hi <= 0.1701 && hi - lo <= 0.0701, 'its light stays between 10% and 17% of white, a swing of at most 7%: ' + lo.toFixed(4) + ' to ' + hi.toFixed(4));
      const rAmp = ramp.length ? Math.max(...ramp.filter(r => r[0] < 500).map(r => Math.abs(r[1] - R.mid))) : 1;
      ok(ramp.length > 100 && rAmp < R.amp * 0.3, 'it grows from nothing over the first two seconds (under a third of the swing in the first half second): ' + rAmp.toFixed(4));
      // the opacity for a light: the browser's blend on encoded values, undone
      const A = await E(p, () => { const X = window.__entrain, b = X.LP_BG / 255; return [0.1, 0.135, 0.17].map(L => { const a = X.lpAlpha(L); return [a, X.lpLin(b + a * (1 - b))]; }); });
      ok(A.every((x, i) => Math.abs(x[1] - [0.1, 0.135, 0.17][i]) < 1e-9) && A.every(x => x[0] > 0 && x[0] < 1), 'the glow\'s opacity, blended over the grey stage, gives exactly the light asked for: ' + A.map(x => x[0].toFixed(3)).join(' '));
      // on pictures of the screen: three pictures, one cycle
      await E(p, () => { window.__rafHold = true; });
      await p.waitForTimeout(100);
      const pics = [];
      for (let i = 0; i < 6; i++) {
        await E(p, () => { window.__rafStep = 1; }); await p.waitForTimeout(80);
        const op = await E(p, () => +document.querySelector('#lpGlow').style.opacity);
        pics.push(Object.assign(await shot(p), { op }));
      }
      const Ls = pics.map(x => x.L), want = pics.map(x => { const b = 6 / 255, v = Math.round(255 * (b + x.op * (1 - b))); return relLum(v, v, v); });
      const sw = Math.max(...Ls) - Math.min(...Ls);
      ok(sw > 0.03 && sw < 0.075 && Math.max(...Ls) < 0.18 && Math.min(...Ls) > 0.09,
        'on the screen, the glow\'s centre changes by ' + (sw * 100).toFixed(1) + '% of white, under the 10% WCAG counts as a flash: ' + Ls.map(x => x.toFixed(3)).join(' '));
      ok(pics.every((x, i) => Math.abs(x.L - want[i]) < 0.006), 'and its light is what the sRGB sums say for each picture\'s opacity: ' + want.map(x => x.toFixed(3)).join(' '));
      ok(pics.every(x => x.spread <= 2), 'grey, with no red or any other colour (channels within ' + Math.max(...pics.map(x => x.spread)) + ' of each other)');
      const lit = Math.max(...pics.map(x => x.lit));
      ok(lit > 0.05 && lit < 0.35, 'on part of the screen: ' + Math.round(lit * 100) + '% of it lit above the stage\'s grey');
      await p.screenshot({ path: OUT + 'pulsetest-c-glow.png' });
      await E(p, () => { window.__rafHold = false; });
      // 144 a second: the sine's one frequency is 40
      await E(p, () => { window.__rafHz = 144; window.__entrain.LP.frameMs = 1000 / 144; window.__entrain.LP.trace.length = 0; });
      await p.waitForTimeout(700);
      R = await E(p, () => window.__entrain.LP.trace.slice());
      const win = R.filter(r => !r[2]).slice(-144);
      const dft = f => { let re = 0, im = 0; win.forEach(r => { const a = 2 * Math.PI * f * r[0] / 1000; re += (r[1] - 0.135) * Math.cos(a); im += (r[1] - 0.135) * Math.sin(a); }); return 2 * Math.hypot(re, im) / win.length; };
      const at40 = dft(40), other = Math.max(...Array.from({ length: 70 }, (_, i) => i + 1).filter(f => f !== 40).map(dft));
      ok(win.length === 144 && Math.abs(at40 - 0.035) < 0.002 && other < 0.002, 'on a 144 Hz screen a second of pictures holds 40 Hz alone: ' + at40.toFixed(4) + ' at 40 Hz, at most ' + other.toFixed(4) + ' at any other rate from 1 to 70');
      // late pictures: held at the middle, and a screen that keeps falling behind ends it
      await E(p, () => { window.__rafHz = 120; window.__entrain.LP.frameMs = 1000 / 120; window.__entrain.LP.trace.length = 0; window.__rafJank = true; });
      await until(p, () => !window.__entrain.LP.on, 3000);
      await E(p, () => { window.__rafJank = false; });
      R = await E(p, () => window.__entrain.LP.trace.slice());
      let s = await state(p);
      const lt = R.filter(r => r[2]);
      ok(lt.length >= 12 && lt.every(r => Math.abs(r[1] - 0.135) < 1e-9), 'each late picture is held at the middle level rather than a phase the screen can\'t keep: ' + lt.length + ' late');
      ok(!s.on && !s.stage && s.why === 'slow' && s.playing && /The screen fell behind, so the light pulse ended/.test(s.toast), 'more than 12 in a second end it, the sound playing on: ' + s.toast);
      ok(await E(p, () => document.querySelector('#lpGlow').style.opacity) === '0', 'and the glow is out');
      await p.context().close();
    }

    /* D. every way it ends, reduced motion and the history */
    if (!only || only === 'D') {
      const p = await page({ health: NONE }, { url: URL, unlock: true });
      await go(p, 'track/gamma-40', 500);
      const goRect = await E(p, () => { const b = document.querySelector('#lpGo'); b.scrollIntoView({ block: 'center' }); const r = b.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; });
      await begin(p);
      await p.touchscreen.tap(goRect.x, goRect.y); await p.waitForTimeout(80);
      let s = await state(p);
      const quick = !s.on;
      await p.waitForTimeout(500);
      s = await state(p);
      ok(quick && !s.stage && s.why === 'tap' && s.playing && !s.ask && !s.meas && /The light pulse has ended\. The sound plays on/.test(s.toast),
        'one tap anywhere ends it at once, the sound playing on, and the tap reaches nothing underneath (Start, right there, isn\'t pressed): ' + s.toast);
      await begin(p);
      await p.keyboard.press(' '); await p.waitForTimeout(450);
      s = await state(p);
      ok(!s.on && s.playing, 'Space ends it too, without pausing the sound');
      await begin(p);
      await p.keyboard.press('Enter'); await p.waitForTimeout(450);
      ok(!(await state(p)).on, 'and Enter');
      await begin(p);
      await p.keyboard.press('/'); await p.waitForTimeout(250);
      const kept = await E(p, () => ({ on: window.__entrain.LP.on, find: !!window.__entrain.FD.open }));
      ok(kept.on && !kept.find, 'other keys stop at the stage: the search shortcut opens nothing underneath, and the pulse goes on: ' + JSON.stringify(kept));
      await p.keyboard.press('Escape'); await p.waitForTimeout(450);
      await begin(p);
      await E(p, () => { window.__entrain.LP.t0 -= window.__entrain.LP_MAX_MS; });
      await until(p, () => !window.__entrain.LP.on, 2000);
      s = await state(p);
      ok(!s.on && s.why === 'time' && s.playing && /^Ten minutes: the light pulse has ended/.test(s.toast), 'after ten minutes it ends by itself: ' + s.toast);
      await begin(p);
      await E(p, () => document.querySelector('#toggle').click()); await p.waitForTimeout(250);
      s = await state(p);
      ok(!s.on && s.why === 'track' && !s.playing && /ended with the sound/.test(s.toast), 'pausing the sound ends it: ' + s.toast);
      await begin(p);
      await go(p, 'home', 300);
      s = await state(p);
      ok(!s.on && !s.stage && s.why === 'nav', 'another page ends it');
      await go(p, 'track/gamma-40', 400);
      await begin(p);
      await E(p, () => { Object.defineProperty(document, 'hidden', { configurable: true, get: () => true }); document.dispatchEvent(new Event('visibilitychange')); });
      s = await state(p);
      await E(p, () => { delete document.hidden; });
      ok(!s.on && !s.stage && s.why === 'hidden', 'going out of sight ends it');
      await begin(p);
      await p.emulateMedia({ reducedMotion: 'reduce' }); await p.waitForTimeout(200);
      s = await state(p);
      const c = await card(p);
      ok(!s.on && s.why === 'motion' && /asks for reduced motion, so the light pulse ended/.test(s.toast) && c.dis && /asks for reduced motion, so the light pulse stays off/.test(c.st),
        'reduced motion turned on ends it, and keeps it off: ' + c.st);
      await p.emulateMedia({ reducedMotion: 'no-preference' }); await p.waitForTimeout(200);
      ok(!(await card(p)).dis, 'and turned off again, Start is back');
      // its minutes in the history: a fresh play of the track (the pulses before were with the one stopped here)
      await E(p, () => document.querySelector('#stop').click()); await p.waitForTimeout(200);
      await begin(p);
      await E(p, () => { const X = window.__entrain; X.LP.t0 -= 40000; X.LP.wall0 -= 40000; X.A.startedAt -= 120; });
      await p.waitForTimeout(150);
      await p.keyboard.press('Escape'); await p.waitForTimeout(450);
      await E(p, () => document.querySelector('#stop').click()); await p.waitForTimeout(300);
      const H = await E(p, () => { const l = window.__entrain.hLoad(), e = l[l.length - 1]; return { k: e.k, id: e.id, lp: e.lp, secs: Math.round(e.secs) }; });
      await go(p, 'history', 500);
      const row = await E(p, () => [...document.querySelectorAll('#v-history *')].map(e => e.textContent).find(x => /light pulse \d+ min/.test(x)) || '');
      ok(H.k === 'track' && H.id === 'gamma-40' && H.lp >= 40 && H.lp < 60 && /light pulse 1 min/.test(row), 'the track\'s history entry keeps the light pulse\'s time, and History shows it: ' + JSON.stringify(H));
      // I need to stop on its stage
      await go(p, 'track/gamma-40', 400);
      await begin(p);
      await p.click('#lpOut'); await p.waitForTimeout(900);
      s = await state(p);
      ok(!s.on && !s.stage && s.why === 'settle' && await E(p, () => !document.querySelector('#stlModal').hidden) && !s.playing,
        'I need to stop on its stage ends it, fades the sound and opens Settle');
      await p.context().close();
      // reduced motion from the start
      const q = await page({ health: NONE }, { url: URL, unlock: true, rm: true });
      await go(q, 'track/gamma-40', 500);
      const rc = await card(q);
      ok(rc.dis && /asks for reduced motion, so the light pulse stays off/.test(rc.st), 'with reduced motion asked for, it stays off: ' + rc.st);
      await q.context().close();
      // unlocked by pasting a code into the dialog it opened: the cup goes at once
      const u = await page({ health: NONE }, { url: URL });
      await go(u, 'track/gamma-40', 500);
      await u.click('#lpGo'); await u.waitForTimeout(300);
      const dev = await E(u, () => window.__entrain.supDevice());
      await u.fill('#supIn', sign(dev)); await u.click('#supGo');
      await until(u, () => window.__entrain.SUP.ok, 4000);
      await u.waitForTimeout(200);
      const uc = await card(u);
      ok(!uc.cup && uc.go === 'Start the light pulse', 'unlocked from the dialog it opened, Start loses its cup at once');
      await u.context().close();
    }

    /* E. 360 px, targets, spelling */
    if (!only || only === 'E') {
      const p = await page({ health: NONE }, { url: URL, unlock: true, vp: { width: 360, height: 740 } });
      await go(p, 'track/gamma-40', 500);
      const W = await E(p, () => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth,
        btn: [...document.querySelectorAll('#lpCard .btn')].map(b => Math.round(b.getBoundingClientRect().height)), a: [...document.querySelectorAll('#lpCard a, #lpCard .sf-link')].map(a => Math.round(a.getBoundingClientRect().height)) }));
      ok(W.sw <= W.cw && W.btn.every(h => h >= 44) && W.a.every(h => h >= 24), 'at 360 px nothing is too wide, its buttons are 44 px tall and its links 24: ' + JSON.stringify(W));
      await begin(p);
      const S = await E(p, () => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth, btn: [...document.querySelectorAll('#lpStage button')].map(b => Math.round(b.getBoundingClientRect().height)),
        inside: [...document.querySelectorAll('#lpStage button, #lpStage h2, #lpStage p')].every(e => { const r = e.getBoundingClientRect(); return r.left >= 0 && r.right <= innerWidth && r.top >= 0 && r.bottom <= innerHeight; }) }));
      ok(S.sw <= S.cw && S.btn.every(h => h >= 44) && S.inside, 'its stage fits too, its buttons 44 px tall: ' + JSON.stringify(S.btn));
      await p.screenshot({ path: OUT + 'pulsetest-e-360.png' });
      await p.keyboard.press('Escape'); await p.waitForTimeout(450);
      await p.click('#lpGo'); await until(p, () => !document.querySelector('#lpModal').hidden, 4000);
      const M = await E(p, () => { const c = document.querySelector('#lpModal .modal-card'), r = c.getBoundingClientRect(); return { fits: r.left >= 0 && r.right <= innerWidth, tick: Math.round(document.querySelector('label.lp-ok').getBoundingClientRect().height), btn: [...document.querySelectorAll('#lpModal .btn')].map(b => Math.round(b.getBoundingClientRect().height)) }; });
      ok(M.fits && M.tick >= 44 && M.btn.every(h => h >= 44), 'the dialog fits at 360, its box to tick and buttons 44 px tall: ' + JSON.stringify(M));
      await p.click('#lpNo');
      const words = await E(p, () => [document.querySelector('#lpCard').textContent, document.querySelector('#lpModal').textContent, document.querySelector('#lpStage').textContent,
        (() => { const out = []; for (let e = document.getElementById('l-flicker'); e && (e.id === 'l-flicker' || e.tagName === 'P'); e = e.nextElementSibling) out.push(e.textContent); return out.join(' '); })(),
        [...document.querySelectorAll('#sfNote li')].map(l => l.textContent).join(' ')].join(' '));
      ok(words.length > 3000 && !SPELL.test(words), 'British spelling in the card, the dialog, the stage, Learn and the safety note' + (SPELL.test(words) ? ': ' + words.match(SPELL)[0] : ''));
      await p.context().close();
    }
  } catch (e) { log.push('ERROR ' + (e && e.stack || e)); }
  await browser.close();
  console.log(log.join('\n'));
  console.log(log.filter(l => l.startsWith('PASS')).length + ' passed, ' + log.filter(l => /^(FAIL|PAGEERROR|ERROR|CONSOLE)/.test(l)).length + ' problems');
  process.exit(log.some(l => /^(FAIL|PAGEERROR|ERROR|CONSOLE)/.test(l)) ? 1 : 0);
})();
