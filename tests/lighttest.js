// The screen light (light.js): Bright, Warm and Night for a practice on screen and for Breathe, Automatic's pick from what
// a session is for and the time of day, your body clock (morning person, evening person or in between) and Bright in
// green, with the research in Learn.
//   A  Automatic: the guide's table at each time of day for focus and energy, calm, and sleep, Night on a sleep step,
//      a morning person's times an hour earlier (and no Bright in their afternoon), an evening person's an hour later
//      (and Bright in green when asked); Today's suggestion moving with your body clock, and not while locked
//   B  locked on the real build: Settings' Screen light, Breathe's chips and a practice's row with the cup, each
//      opening the dialog that names it and keeping nothing; the body clock's two ends the same; a choice kept from
//      before showing the usual screen on Breathe and in a running practice; no row on the Stress Check; Settings'
//      list, search, and Learn's section, glance rows and references, all free to read
//   C  unlocked (the test copy), Breathe: each look on the page, measured on a picture of the screen (Bright light
//      and cool, Warm with blue at under half of red, Night with no blue in any pixel, Green mostly green), the canvas
//      reading its colours again, the browser's bar, 30 frames a second, I need to stop reaching through the light,
//      Automatic by the pattern's goal, the usual screen again on other pages; picked while locked and unlocked in the
//      dialog, the light comes on
//   D  unlocked, practices: a practice's own light kept, summarised and on while it runs, gone at the end; the device's
//      choice for the rest; Automatic by goal and time, Night on a sleep step; Settings' body clock, green, the
//      words for Automatic now
//   E  360 px and 44 px targets, British spelling in the new words
// Run: node tests/lighttest.js [group letter]
const zlib = require('zlib');
const { chromium, APP, OUT } = require('./pw');
const { testApp, unlockInit, unlocked, sign } = require('./unlock-helper');
const S20 = 'Mozilla/5.0 (Linux; Android 13; SM-G988B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Mobile Safari/537.36';
const only = process.argv[2] || '';
const t = (p, s) => p.$eval(s, e => e.textContent.replace(/\s+/g, ' ').trim()).catch(() => '(missing)');
const E = (p, f, a) => p.evaluate(f, a);
const go = async (p, h, ms) => { await p.evaluate(x => location.hash = x, h); await p.waitForTimeout(ms || 400); };
const until = async (p, f, ms, a) => { try { await p.waitForFunction(f, a, { timeout: ms || 5000 }); return true; } catch (e) { return false; } };
const OPT = o => JSON.stringify(Object.assign({ voice: false, bells: false, cues: 'off', visual: 'circle', audio: false, voiceName: '', ana: 0, rhythm: false }, o || {}));
const SPELL = /\b(programs?|toward|synthesiz\w*|color\w*|favor\w*|behavior\w*|center(?:s|ed)?|organiz\w*|realiz\w*|recogniz\w*|minimiz\w*|optimiz\w*|personaliz\w*|prioritiz\w*|visualiz\w*|analyz\w*|gray|fiber|aging)\b/i;
const WORDING = /n't\b|\b(do not|never|nothing|without|stop|avoid|none)\b|feel the breath/i;
// the buttons in a group: each one's words, * when chosen, + with the cup
const seg = (p, s) => E(p, s => [...document.querySelectorAll(s)].map(b => b.textContent.trim() + (b.getAttribute('aria-pressed') === 'true' || b.classList.contains('on') ? '*' : '') + (b.querySelector('.sup-tag') ? '+' : '')).join(' | '), s);
// a radio chip picked as a tap does it: checked, then its change
const pick = (p, sel) => E(p, s => { const r = document.querySelector(s); r.checked = true; r.dispatchEvent(new Event('change', { bubbles: true })); }, sel);
const look = p => E(p, () => ({ attr: document.documentElement.getAttribute('data-light') || '', veil: getComputedStyle(document.querySelector('.lt-veil')).display,
  bg: getComputedStyle(document.documentElement).getPropertyValue('--bg').trim(), bar: document.querySelector('meta[name="theme-color"]').getAttribute('content') }));
// every canvas's clearRect calls counted by its id, and any blurred shadow kept
const HOOKS = () => {
  window.__cl = {}; window.__blur = [];
  const cr = CanvasRenderingContext2D.prototype.clearRect;
  CanvasRenderingContext2D.prototype.clearRect = function () { const k = this.canvas.id || '?'; window.__cl[k] = (window.__cl[k] || 0) + 1; return cr.apply(this, arguments); };
  const d = Object.getOwnPropertyDescriptor(CanvasRenderingContext2D.prototype, 'shadowBlur');
  Object.defineProperty(CanvasRenderingContext2D.prototype, 'shadowBlur', { configurable: true, get: d.get, set(v) { if (v) window.__blur.push(v); d.set.call(this, v); } });
};
const rate = async (p, id, ms) => { const a = await E(p, k => window.__cl[k] || 0, id); await p.waitForTimeout(ms); return ((await E(p, k => window.__cl[k] || 0, id)) - a) / ms * 1000; };

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
// the light of a picture of the screen: each channel's mean and largest value, and the mean brightness
async function light(p) {
  const im = png(await p.screenshot());
  let r = 0, g = 0, b = 0, mr = 0, mg = 0, mb = 0, n = 0;
  for (let i = 0; i < im.px.length; i += im.ch) {
    const R = im.px[i], G = im.px[i + 1], B = im.px[i + 2];
    r += R; g += G; b += B; n++;
    if (R > mr) mr = R; if (G > mg) mg = G; if (B > mb) mb = B;
  }
  return { r: r / n, g: g / n, b: b / n, mr, mg, mb, lum: (0.2126 * r + 0.7152 * g + 0.0722 * b) / n };
}
const f1 = x => Math.round(x * 10) / 10;
const said = l => 'mean R ' + f1(l.r) + ' G ' + f1(l.g) + ' B ' + f1(l.b) + ', largest B ' + l.mb + ', R ' + l.mr;

(async () => {
  const browser = await chromium.launch();
  const log = []; const ok = (c, m) => log.push((c ? 'PASS ' : 'FAIL ') + m);
  const URL = testApp();
  // a phone with debug on; o.url: the test copy; o.unlock: this device unlocked; o.vp: the viewport; o.hour: the time of day
  const page = async (st, o) => {
    o = o || {};
    const ctx = await browser.newContext({ userAgent: S20, viewport: o.vp || { width: 412, height: 915 }, deviceScaleFactor: o.dpr || 2, isMobile: true, hasTouch: true });
    const p = await ctx.newPage();
    p.on('pageerror', e => log.push('PAGEERROR ' + e.message));
    p.on('console', m => { if (m.type() === 'error') log.push('CONSOLE ' + m.text()); });
    if (o.unlock) await unlockInit(p);
    await p.addInitScript(([s, hour]) => {
      if (!sessionStorage.getItem('z.seeded')) {
        sessionStorage.setItem('z.seeded', '1');
        localStorage.setItem('entrain.debug', '1'); localStorage.setItem('entrain.stereo', 'ok'); localStorage.setItem('entrain.optsOpen', '1');
        for (const k in s) localStorage.setItem('entrain.' + k, s[k]);
      }
      if (hour !== undefined) window.__ltHour = hour;
      if (window.speechSynthesis) { speechSynthesis.speak = () => {}; speechSynthesis.cancel = () => {}; }
    }, [Object.assign({ pOpt: OPT(), amb: 'off' }, st || {}), o.hour]);
    await p.addInitScript(HOOKS);
    await p.goto(o.url || APP);
    await unlocked(p);
    await p.waitForTimeout(250);
    return p;
  };
  const ends = async p => { await p.click('#sEnd'); await p.click('#sEnd'); await p.waitForTimeout(500); };

  try {
    /* A. Automatic and your body clock */
    if (!only || only === 'A') {
      const p = await page(null, { url: URL, unlock: true });
      // [goal, hour, sleepy] → look, for in between, a morning person and an evening person
      const table = (ch, green) => E(p, ([ch, green]) => {
        const X = window.__entrain;
        if (ch === 'mid') localStorage.removeItem('entrain.chrono'); else localStorage.setItem('entrain.chrono', ch);
        if (green) localStorage.setItem('entrain.ltGreen', '1'); else localStorage.removeItem('entrain.ltGreen');
        const out = {};
        for (const goal of ['focus', 'energy', 'calm', 'recover', 'reflect', 'sleep', '']) {
          out[goal || 'none'] = [4.5, 7, 11.5, 14, 17.5, 18.5, 21.5, 22.5, 2].map(h => { window.__ltHour = h; return X.ltResolve('auto', goal, false) || '-'; }).join(' ');
        }
        window.__ltHour = 14; out.sleepy = ['focus', 'calm', 'sleep'].map(g => X.ltResolve('auto', g, true)).join(' ');
        window.__ltHour = 9; out.fixed = ['bright', 'warm', 'night', 'off'].map(k => X.ltResolve(k, 'sleep', true) || '-').join(' ');
        out.part = [4.5, 7, 11.5, 14, 17.5, 18.5, 21.5, 22.5, 2].map(h => X.ltPart(h)).join(' ');
        out.chrono = X.ltChrono();
        return out;
      }, [ch, green]);
      //                      at  4:30   7:00   11:30  14:00  17:30  18:30  21:30  22:30  2:00
      const mid = await table('mid');
      ok(mid.part === 'night morning morning afternoon afternoon evening evening night night', 'in between, the day runs morning 5 to 12, afternoon 12 to 6, evening 6 to 10, night 10 to 5: ' + mid.part);
      ok(mid.focus === 'warm bright bright bright bright warm warm warm warm' && mid.energy === mid.focus,
        'Automatic, for focus and energy: Bright by day (cool light for morning focus and alertness), Warm from the evening on: ' + mid.focus);
      ok(mid.calm === 'night - - - - warm warm night night' && mid.recover === mid.calm && mid.reflect === mid.calm && mid.none === mid.calm,
        'for calm, recovery, reflection and a pattern of your own: the usual screen by day, Warm in the evening (dim and warm for evening relaxation), Night late: ' + mid.calm);
      ok(mid.sleep === 'night warm warm warm warm night night night night', 'for sleep: Night (very dim and red, no blue) from the evening on, Warm before it: ' + mid.sleep);
      ok(mid.sleepy === 'night night night', 'on a practice\'s sleep step Automatic is Night, whatever the goal or the time: ' + mid.sleepy);
      ok(mid.fixed === 'bright warm night -', 'a look you pick stays as picked, sleep step or not: ' + mid.fixed);
      const am = await table('morning');
      ok(am.chrono === 'morning' && am.part === 'morning morning afternoon afternoon evening evening night night night',
        'a morning person\'s times come an hour earlier: evening from 5, night from 9 in the evening, morning from 4: ' + am.part);
      ok(am.focus === 'bright bright - - warm warm warm warm warm', 'and for focus their afternoon keeps the usual screen, as blue light then may lower alertness in morning types: ' + am.focus);
      ok(am.calm === '- - - - warm warm night night night', 'their calm turns Warm at 5 and Night at 9: ' + am.calm);
      const pm = await table('evening');
      ok(pm.chrono === 'evening' && pm.part === 'night morning morning afternoon afternoon afternoon evening evening night',
        'an evening person\'s come an hour later: evening from 7, night from 11, morning from 6: ' + pm.part);
      ok(pm.focus === 'warm bright bright bright bright bright warm warm warm' && pm.sleep === 'night warm warm warm warm warm night night night', 'their focus and sleep follow: ' + pm.focus + ' / ' + pm.sleep);
      const pg = await table('evening', true);
      ok(pg.focus === 'warm green green green green green warm warm warm' && (await E(p, () => window.__entrain.ltResolve('bright', 'calm', false))) === 'green',
        'with Bright in green, an evening person gets green wherever they\'d get Bright: ' + pg.focus);
      const ag = await table('morning', true);
      ok(ag.focus === am.focus, 'green is for an evening person only: a morning person keeps Bright');
      await E(p, () => { localStorage.removeItem('entrain.chrono'); localStorage.removeItem('entrain.ltGreen'); });
      // Today's suggestion by your body clock
      const sug = async (ch, h) => {
        await E(p, ([ch, h]) => { window.__ltHour = h; if (ch === 'mid') localStorage.removeItem('entrain.chrono'); else localStorage.setItem('entrain.chrono', ch); location.hash = 'history'; }, [ch, h]);
        await p.waitForTimeout(250); await go(p, 'home', 400);
        return E(p, () => document.querySelector('#sgGo').getAttribute('href') + ' ' + document.querySelector('#sgWhen').textContent);
      };
      const s1 = await sug('mid', 8.5), s2 = await sug('morning', 8.5), s3 = await sug('evening', 9.5), s4 = await sug('evening', 21.5), s5 = await sug('morning', 20.5);
      ok(/morning-tonic/.test(s1) && /focus-primer/.test(s2) && /morning-tonic/.test(s3) && /coherence/.test(s4) && /sleep-descent/.test(s5),
        'Today\'s suggestion follows your body clock: at 8:30 the morning tonic, for a morning person already the focus primer; at 9:30 an evening person still gets the morning tonic, at 9:30 at night still the evening\'s coherence, and a morning person at 8:30 at night Sleep Descent: ' + [s1, s2, s3, s4, s5].join(' | '));
      await p.context().close();
      // locked, a body clock kept from before changes nothing
      const q = await page({ chrono: 'morning' }, { hour: 8.5 });
      await go(q, 'home', 400);
      ok(/morning-tonic/.test(await E(q, () => document.querySelector('#sgGo').getAttribute('href'))) && await E(q, () => window.__entrain.ltChrono()) === 'mid',
        'while locked, a morning person kept from before still gets the usual times');
      await q.context().close();
    }

    /* B. locked on the real build */
    if (!only || only === 'B') {
      const s = await page();
      await go(s, 'settings', 500);
      const S = await E(s, () => {
        const sec = document.querySelector('#st-light');
        return { h: sec.querySelector('h2').textContent, txt: sec.textContent.replace(/\s+/g, ' '), res: !!sec.querySelector('a[href="#l-light"]'), box: !!sec.querySelector('a[href="#living/light-box"]'),
          green: document.querySelector('#ltGreenRow').hidden, dots: sec.querySelectorAll('.strength i.on').length, exp: !!sec.querySelector('.lt-exp'), after: sec.previousElementSibling.id, next: sec.nextElementSibling.id };
      });
      ok(S.h === 'Screen light' && S.after === 'st-screen' && S.next === 'st-supporter' && S.res && S.box, 'Settings has Screen light after Screen, with links to the research and the light box card');
      ok(/Bright is cool and near-white, for focus and energy in the morning/.test(S.txt) && /Warm is amber and dimmer/.test(S.txt) && /Night is very dim and red, with no blue/.test(S.txt) && /Automatic picks one/.test(S.txt),
        'it says what each look is for');
      ok(/small fraction of the light of daylight or a light box/.test(S.txt) && /daylight comes first/.test(S.txt) && /can't set your phone's brightness/.test(S.txt),
        'and that a phone screen gives a small fraction of the light of daylight or a light box, so daylight comes first for alertness');
      ok(S.dots === 3 && S.exp && /strong evidence, from body-clock research/.test(S.txt) && /single studies/.test(S.txt), 'with the evidence as the guide gives it: strong for light at the eye, and Experimental for the body clock\'s times and green');
      ok(await seg(s, '#stLtSeg button') === 'Usual* | Automatic+ | Bright+ | Warm+ | Night+', 'Usual chosen, and each light with the cup: ' + await seg(s, '#stLtSeg button'));
      ok(await seg(s, '#stLtCh button') === 'Morning person+ | In between* | Evening person+' && S.green, 'the body clock\'s question, In between chosen, the two ends with the cup, and no green yet: ' + await seg(s, '#stLtCh button'));
      await s.click('#stLtSeg button[data-lt="bright"]'); await s.waitForTimeout(300);
      const S2 = await E(s, () => ({ dlg: !document.querySelector('#supModal').hidden, name: document.querySelector('#supFor').textContent, kept: localStorage.getItem('entrain.light') }));
      ok(S2.dlg && S2.name === 'Screen light is one of the new techniques.' && S2.kept === null && await seg(s, '#stLtSeg button') === 'Usual* | Automatic+ | Bright+ | Warm+ | Night+',
        'picking Bright opens the dialog that names it, keeping nothing: ' + JSON.stringify(S2));
      await s.click('#supClose'); await s.waitForTimeout(200);
      await s.click('#stLtCh button[data-chrono="evening"]'); await s.waitForTimeout(300);
      const S3 = await E(s, () => ({ dlg: !document.querySelector('#supModal').hidden, kept: localStorage.getItem('entrain.chrono'), green: document.querySelector('#ltGreenRow').hidden }));
      ok(S3.dlg && S3.kept === null && S3.green, 'so does Evening person, keeping nothing: ' + JSON.stringify(S3));
      await s.click('#supClose'); await s.waitForTimeout(200);
      const list = await E(s, () => [...document.querySelectorAll('#supList a')].map(a => a.textContent + '>' + a.getAttribute('href')));
      ok(list.includes('Screen light>#st-light'), 'New techniques lists it: ' + list.slice(-3).join(', '));
      await s.click('#tbFind'); await s.waitForTimeout(250);
      const hits = async q => { await s.fill('#fdIn', q); await s.waitForTimeout(500); return E(s, () => [...document.querySelectorAll('.fd-it')].map(a => a.querySelector('b').textContent + '>' + a.getAttribute('href') + (a.querySelector('.sup-tag') ? ' +sup' : ''))); };
      const h1 = await hits('screen light'), h2 = await hits('chronotype'), h3 = await hits('red light night'), h4 = await hits('light colour');
      ok(h1[0] === 'Screen light>#st-light +sup' && h4.includes('Light colour: bright, warm and red>#l-light'), 'search finds it first, with the badge, and Learn\'s section on light colour: ' + h1.slice(0, 2).join(', ') + ' / ' + h4.slice(0, 3).join(', '));
      ok(h2.includes('Screen light>#st-light +sup') && h3.includes('Screen light>#st-light +sup'), 'and for a chronotype or a red night light: ' + h2.slice(0, 2).join(', '));
      await s.keyboard.press('Escape');
      await go(s, 'l-light', 600);
      const L = await E(s, () => {
        const h = document.getElementById('l-light'), ps = []; let e = h.nextElementSibling;
        while (e && e.tagName === 'P') { ps.push(e.textContent.replace(/\s+/g, ' ')); e = e.nextElementSibling; }
        const row = n => { const r = [...document.querySelectorAll('#lnGlance tr.ln-row')].find(x => x.querySelector('th b').textContent === n); return { lo: r.children[2].classList.contains('ln-lo'), a: [...r.children[2].querySelectorAll('a')].map(a => a.getAttribute('href')).join(' '), ev: r.children[1].textContent }; };
        return { title: h.textContent, toc: !!document.querySelector('.toc a[href="#l-light"]'), ps, view: !document.querySelector('#v-learn').hidden, dlg: document.querySelector('#supModal').hidden,
          refs: ['Sletten, T. L.', 'Kayaba, M.', 'Chellappa, S. L., Steiner, R., Blattner', 'Siemiginowska, P.', 'Vani, V.', 'Sharifpour, R.', 'Chellappa, S. L., Steiner, R., Oelhafen', 'Brown, T. M.']
            .map(k => { const r = [...document.querySelectorAll('#references li')].find(l => l.textContent.startsWith(k)); return r ? (r.querySelector('a[href^="https://"]') ? 1 : 0) : -1; }).join(''),
          rows: ['Bright, cool light in the morning', 'Dim, warm light in the evening'].map(row),
          bulbs: [...document.querySelectorAll('#l-leftout + ul li')].some(li => /^Smart bulbs/.test(li.textContent) && li.querySelector('a[href="#st-light"]')) };
      });
      const all = L.ps.join(' ');
      ok(L.view && L.dlg && L.title === 'Light colour: bright, warm and red' && L.toc && L.ps.length === 4, 'Learn has a section on light colour, in the contents, free to read: ' + L.title);
      ok(/melanopsin/.test(all) && /480 nm/.test(all) && /\(5–9 Hz\)/.test(all) && /Laboratory studies, summed up by Sletten and colleagues/.test(all) && /28 night-shift workers/.test(all) && /\(Sletten et al\., 2021\)/.test(all) && /nine young men \(Kayaba et al\., 2014\)/.test(all) && /6500 K held back melatonin more/.test(all) &&
        /\(Chellappa et al\., 2011\)/.test(all) && /2025 preprint, not yet peer reviewed/.test(all) && /strong evidence, from body-clock research/.test(all),
        'how it works: melanopsin near 480 nm, brighter light lowering theta and low alpha (laboratory studies Sletten sums up, apart from its own night-shift study), blue LED light and alpha, 6500 K, a preprint named as one, strong evidence');
      ok(/In morning types, blue light in the afternoon/.test(all) && /preliminary finding \(Siemiginowska & Iskra-Golec, 2020\)/.test(all) && /24 men/.test(all) && /\(Vani et al\., 2025\)/.test(all) &&
        /left alpha and theta power unchanged \(Sharifpour et al\., 2025\)/.test(all) && /first cycle of sleep \(Chellappa et al\., 2013\)/.test(all),
        'the catches: timing in morning types, green for evening types in one small study, a study that found no change, the cost to deep sleep');
      ok(/Bright is cool and near-white/.test(all) && /Night is very dim and red, with no blue at all/.test(all) && /Night on any practice's sleep steps/.test(all) && /an hour earlier/.test(all) && /Bright in green/.test(all) && /Today's suggestion/.test(all),
        'what Entrain does with it, Automatic\'s choices and your body clock');
      ok(/far less light than daylight or a light box/.test(all) && /250 lux/.test(all) && /\(Brown et al\., 2022\)/.test(all) && /daylight comes first/.test(all) && /haven't been tested on a phone screen/.test(all) && /can't set your phone's brightness/.test(all),
        'a phone screen against daylight and a light box, the looks untested on a screen, and the phone\'s brightness');
      ok(L.refs === '11111111', 'every study cited has its reference, each with a link: ' + L.refs);
      ok(L.rows.every(r => !r.lo && /#st-light/.test(r.a)) && L.rows[0].a.includes('#living/light-box') && L.rows.every(r => r.ev === 'Strong'),
        'the glance table\'s light rows lead to the screen light too, the light box still there, their evidence unchanged: ' + JSON.stringify(L.rows));
      ok(L.bulbs, 'and "Left out" says the screen light does for the screen what smart bulbs would do for a room');
      await s.context().close();
      // Breathe's chips and a practice's row
      const p = await page();
      await go(p, 'breathe', 500);
      ok(await seg(p, '#bLight .chip') === 'Usual* | Automatic+ | Bright+ | Warm+ | Night+' && await t(p, '#bLightHint') === 'The screen as it usually is.', 'Breathe\'s settings have Screen light, Usual chosen and the rest with the cup: ' + await seg(p, '#bLight .chip'));
      await pick(p, '#bLight input[value="night"]'); await p.waitForTimeout(300);
      const B1 = await E(p, () => ({ dlg: !document.querySelector('#supModal').hidden, name: document.querySelector('#supFor').textContent, kept: localStorage.getItem('entrain.light'), attr: document.documentElement.getAttribute('data-light') }));
      ok(B1.dlg && B1.name === 'Screen light is one of the new techniques.' && B1.kept === null && B1.attr === null, 'picking Night opens the dialog, keeping nothing and leaving the screen as it is: ' + JSON.stringify(B1));
      await p.click('#supClose'); await p.waitForTimeout(200);
      ok(await seg(p, '#bLight .chip') === 'Usual* | Automatic+ | Bright+ | Warm+ | Night+', 'Not now puts Usual back');
      await go(p, 'practice/calm-reset', 500);
      ok(await seg(p, '#sOptLt button') === 'Usual* | Automatic+ | Bright+ | Warm+ | Night+', 'a practice\'s Options have a Screen light row, Usual chosen and the rest with the cup: ' + await seg(p, '#sOptLt button'));
      await p.click('#sOptLt button[data-lt="warm"]'); await p.waitForTimeout(300);
      const Q = await E(p, () => ({ dlg: !document.querySelector('#supModal').hidden, own: localStorage.getItem('entrain.pOpt.calm-reset'), on: document.querySelector('#sOptLt [aria-pressed="true"]').dataset.lt }));
      ok(Q.dlg && !Q.own && Q.on === 'off', 'picking Warm there opens the dialog, keeping nothing: ' + JSON.stringify(Q));
      await p.click('#supClose'); await p.waitForTimeout(200);
      await go(p, 'practice/stress-check', 400);
      ok(await E(p, () => !document.querySelector('#sOptLt')), 'the Stress Check has no Screen light row: nothing to nudge a reading');
      await p.context().close();
      // kept from before (a backup, say): the usual screen
      const k = await page({ light: 'night', chrono: 'evening', ltGreen: '1', 'pOpt.calm-reset': JSON.stringify({ light: 'bright' }) }, { hour: 23 });
      await go(k, 'breathe', 500);
      await k.click('#bStart'); await k.waitForTimeout(1500);
      const K1 = await look(k);
      ok(K1.attr === '' && K1.veil === 'none' && K1.bg === '#0b1120' && K1.bar === '#0b1120' && await seg(k, '#bLight .chip') === 'Usual* | Automatic+ | Bright+ | Warm+ | Night+',
        'a light kept from before shows the usual screen on Breathe while locked, breathing and all: ' + JSON.stringify(K1));
      await k.click('#bStart');
      await go(k, 'practice/calm-reset', 500);
      ok(await E(k, () => document.querySelector('#sOptLt [aria-pressed="true"]').dataset.lt) === 'off', 'and a practice\'s own shows Usual');
      await k.click('#sGo'); await k.waitForTimeout(1200);
      const K2 = await look(k);
      ok(await E(k, () => window.__entrain.P.state === 'running') && K2.attr === '' && K2.veil === 'none', 'and it runs on the usual screen: ' + JSON.stringify(K2));
      await ends(k); await k.context().close();
    }

    /* C. unlocked: Breathe, and each look measured */
    if (!only || only === 'C') {
      const p = await page(null, { url: URL, unlock: true, hour: 14 });
      const base = await light(p);
      await go(p, 'breathe', 500);
      ok(await seg(p, '#bLight .chip') === 'Usual* | Automatic | Bright | Warm | Night', 'unlocked, Breathe\'s Screen light has no cups');
      const usual = await light(p);
      await pick(p, '#bLight input[value="bright"]'); await p.waitForTimeout(400);
      const L1 = await look(p), C1 = await E(p, () => ({ kept: localStorage.getItem('entrain.light'), text: window.__entrain.BCOL.text, bin: window.__entrain.BCOL['b-in'], hint: document.querySelector('#bLightHint').textContent, scheme: getComputedStyle(document.documentElement).colorScheme }));
      ok(C1.kept === 'bright' && L1.attr === 'bright' && L1.bg === '#f3f7ff' && L1.bar === '#f3f7ff' && L1.veil === 'none' && C1.scheme === 'light',
        'Bright comes on at once and is kept: a light page, the browser\'s bar to match: ' + JSON.stringify(L1));
      ok(C1.text === '#0c1730' && C1.bin === '#0b7d70', 'the breathing visual reads its colours again, dark on light: text ' + C1.text + ', breathing in ' + C1.bin);
      ok(/^Cool and near-white, for focus and energy in the morning\. A web page can't set your phone's brightness/.test(C1.hint), 'with words on what it is: ' + C1.hint);
      await p.click('#bStart'); await p.waitForTimeout(3500);
      const bright = await light(p);
      ok(bright.lum > 200 && usual.lum < 60 && bright.b >= bright.r, 'a picture of the screen: Bright gives far more light than the usual screen, and cool (blue at least as strong as red): brightness ' + f1(usual.lum) + ' → ' + f1(bright.lum) + ', ' + said(bright));
      await p.screenshot({ path: OUT + 'lighttest-c-bright.png' });
      await pick(p, '#bLight input[value="warm"]'); await p.waitForTimeout(500);
      const L2 = await look(p), warm = await light(p);
      ok(L2.attr === 'warm' && L2.veil === 'block' && warm.b < warm.r * 0.5 && warm.g < warm.r && warm.lum < usual.lum && usual.b > usual.r,
        'Warm: an amber veil over everything, blue at under half of red (the usual screen has more blue than red), and dimmer than usual: ' + said(warm) + ', brightness ' + f1(warm.lum));
      await p.screenshot({ path: OUT + 'lighttest-c-warm.png' });
      await pick(p, '#bLight input[value="night"]'); await p.waitForTimeout(500);
      const L3 = await look(p), night = await light(p), fps = await rate(p, 'bCanvas', 2000);
      ok(L3.attr === 'night' && L3.veil === 'block' && L3.bar === '#000000' && night.mb === 0 && night.mg < 60 && night.mr > 100 && night.lum < warm.lum && night.lum < usual.lum,
        'Night: no blue in any pixel of the screen, little green, red still readable, and the dimmest: ' + said(night) + ', largest G ' + night.mg + ', brightness ' + f1(night.lum));
      ok(fps >= 20 && fps <= 32 && await E(p, () => window.__blur.length === 0), 'breathing under it, the visual still draws about 30 frames a second, with no blurred shadows: ' + f1(fps));
      await p.screenshot({ path: OUT + 'lighttest-c-night.png' });
      // I need to stop reaches through the veil
      await p.click('#bOut'); await p.waitForTimeout(600);
      ok(await E(p, () => !document.querySelector('#stlModal').hidden && window.__entrain.B.state === 'idle'), 'I need to stop works through the light: the session ends and Settle opens');
      await p.click('#stlDone').catch(() => {}); await p.waitForTimeout(300);
      // Automatic by the pattern
      await pick(p, '#bLight input[value="auto"]'); await p.waitForTimeout(300);
      const auto = [];
      for (const [pat, h] of [['box', 9], ['box', 19], ['478', 14], ['478', 23], ['resonance', 14], ['resonance', 23]]) {
        await E(p, h => { window.__ltHour = h; }, h);
        await pick(p, '#bPats input[value="' + pat + '"]'); await p.waitForTimeout(150);
        auto.push(pat + '@' + h + ' ' + ((await look(p)).attr || 'usual'));
      }
      ok(auto.join(', ') === 'box@9 bright, box@19 warm, 478@14 warm, 478@23 night, resonance@14 usual, resonance@23 night',
        'Automatic on Breathe goes by the pattern\'s goal and the time: ' + auto.join(', '));
      ok(/^Automatic picks from the time of day and what the pattern is for: Night now, at night\./.test(await t(p, '#bLightHint')), 'and says what it picks now: ' + await t(p, '#bLightHint'));
      await go(p, 'home', 500);
      const L4 = await look(p), back = await light(p);
      ok(L4.attr === '' && L4.veil === 'none' && L4.bar === '#0b1120' && Math.abs(back.lum - base.lum) < 3, 'Today keeps the usual screen: the light is for sessions only: ' + JSON.stringify(L4));
      await go(p, 'breathe', 500);
      ok((await look(p)).attr === 'night', 'and back on Breathe it comes on again');
      await p.context().close();
      // Green, for an evening person who asks
      const g = await page({ light: 'bright', chrono: 'evening', ltGreen: '1' }, { url: URL, unlock: true, hour: 10 });
      await go(g, 'breathe', 600);
      const gl = await light(g), Lg = await look(g);
      ok(Lg.attr === 'green' && Lg.veil === 'block' && gl.g > gl.r + 10 && gl.g > gl.b + 10 && gl.lum > 180, 'Bright in green: a light page under a pale green veil, its light mostly green: ' + said(gl));
      ok(/^Bright, in green: in one small study, green light was the most alerting for evening types\./.test(await t(g, '#bLightHint')), 'and says so: ' + await t(g, '#bLightHint'));
      await g.screenshot({ path: OUT + 'lighttest-c-green.png' });
      await g.context().close();
      // locked, then unlocked from the dialog: the light comes on
      const q = await page(null, { url: URL });
      await go(q, 'breathe', 500);
      await pick(q, '#bLight input[value="warm"]'); await q.waitForTimeout(300);
      const dev = await E(q, () => window.__entrain.supDevice());
      await q.fill('#supIn', sign(dev)); await q.click('#supGo');
      await until(q, () => window.__entrain.SUP.ok, 5000);
      await q.click('#supClose'); await q.waitForTimeout(300);
      const U = await E(q, () => ({ kept: localStorage.getItem('entrain.light'), attr: document.documentElement.getAttribute('data-light'), cups: document.querySelectorAll('#bLight .sup-tag').length }));
      ok(U.kept === 'warm' && U.attr === 'warm' && U.cups === 0, 'picked while locked and unlocked in the dialog, Warm comes on and the cups go: ' + JSON.stringify(U));
      await q.context().close();
    }

    /* D. unlocked: practices, and Settings */
    if (!only || only === 'D') {
      const p = await page(null, { url: URL, unlock: true, hour: 14 });
      await go(p, 'practice/calm-reset', 500);
      ok(await seg(p, '#sOptLt button') === 'Usual* | Automatic | Bright | Warm | Night', 'a practice\'s Screen light row, unlocked: Usual and the rest without cups');
      await p.click('#sOptLt button[data-lt="warm"]'); await p.waitForTimeout(250);
      const D1 = await E(p, () => ({ own: JSON.parse(localStorage.getItem('entrain.pOpt.calm-reset') || '{}').light, sum: document.querySelector('#sOptsSum').textContent, note: document.querySelector('#sLtNote').textContent, dev: localStorage.getItem('entrain.light'), attr: document.documentElement.getAttribute('data-light') }));
      ok(D1.own === 'warm' && / · Warm light/.test(D1.sum) && /^Amber and dimmer/.test(D1.note) && D1.dev === null && D1.attr === null,
        'picking Warm keeps it for this practice, in its summary, with its words, the device\'s choice left alone and the page as it is until it starts: ' + JSON.stringify(D1));
      await p.click('#sGo'); await p.waitForTimeout(1200);
      const D2 = await look(p);
      ok(await E(p, () => window.__entrain.P.state === 'running' && document.body.classList.contains('immersive')) && D2.attr === 'warm' && D2.veil === 'block', 'started, the session runs in Warm: ' + JSON.stringify(D2));
      await p.click('#sPlay'); await p.waitForTimeout(300);
      ok((await look(p)).attr === 'warm', 'paused, it stays');
      await go(p, 'home', 400);
      ok((await look(p)).attr === '', 'Today, while it waits, is the usual screen');
      await go(p, 'practice/calm-reset', 500);
      ok((await look(p)).attr === 'warm', 'and back on the session it is Warm again');
      await p.click('#sPlay'); await p.waitForTimeout(200);
      await ends(p);
      const D3 = await look(p);
      ok(await E(p, () => !document.querySelector('#sDone').hidden) && D3.attr === '' && D3.veil === 'none' && D3.bar === '#0b1120', 'the end screen is the usual screen: ' + JSON.stringify(D3));
      // the device's choice for practices with none of their own
      await go(p, 'settings', 500);
      await p.click('#stLtSeg button[data-lt="night"]'); await p.waitForTimeout(250);
      ok(await E(p, () => localStorage.getItem('entrain.light')) === 'night' && await seg(p, '#stLtSeg button') === 'Usual | Automatic | Bright | Warm | Night*', 'Settings sets the device\'s choice: Night');
      await go(p, 'practice/focus-primer', 500);
      ok(await E(p, () => document.querySelector('#sOptLt [aria-pressed="true"]').dataset.lt) === 'night', 'a practice with no choice of its own shows it');
      await p.click('#sGo'); await p.waitForTimeout(1000);
      ok((await look(p)).attr === 'night', 'and runs in it');
      await ends(p);
      await go(p, 'practice/calm-reset', 500);
      ok(await E(p, () => document.querySelector('#sOptLt [aria-pressed="true"]').dataset.lt) === 'warm', 'Calm Reset keeps its own Warm');
      // Automatic in a practice: by goal and time, and Night on a sleep step
      await go(p, 'settings', 500);
      await p.click('#stLtSeg button[data-lt="auto"]'); await p.waitForTimeout(250);
      const atxt = await t(p, '#ltAutoTxt');
      ok(atxt === 'Automatic now (afternoon): Bright for focus and energy, the usual screen for calm, recovery and reflection, Warm for sleep.', 'Settings says what Automatic picks now: ' + atxt);
      await go(p, 'practice/focus-primer', 500);
      ok(/^Automatic picks from the time of day and what the practice is for: Bright now, in the afternoon, and Night on its sleep steps\./.test(await t(p, '#sLtNote')), 'a practice\'s row says it too: ' + await t(p, '#sLtNote'));
      await p.click('#sGo'); await p.waitForTimeout(1000);
      const fa = (await look(p)).attr;
      await ends(p);
      await E(p, () => { window.__ltHour = 20; });
      await go(p, 'home', 300); await go(p, 'practice/focus-primer', 400);
      await p.click('#sGo'); await p.waitForTimeout(1000);
      const fe = (await look(p)).attr;
      await ends(p);
      ok(fa === 'bright' && fe === 'warm', 'Automatic: the focus primer in Bright at 2 in the afternoon, Warm at 8 in the evening: ' + fa + ', ' + fe);
      await E(p, () => { window.__ltHour = 14; });
      await go(p, 'practice/sleep-descent', 500);
      await p.click('#sGo'); await p.waitForTimeout(1000);
      const sd1 = (await look(p)).attr;
      let k = 0;
      while (k++ < 12 && await E(p, () => { const X = window.__entrain; return X.P.steps[X.P.idx].k !== 'drift'; })) { await p.click('#sNext'); await p.waitForTimeout(250); }
      const sd2 = (await look(p)).attr, step = await E(p, () => window.__entrain.P.steps[window.__entrain.P.idx].k);
      ok(sd1 === 'warm' && step === 'drift' && sd2 === 'night', 'Sleep Descent in the afternoon starts Warm and turns Night on its drift into sleep: ' + sd1 + ' → ' + step + ' ' + sd2);
      await p.screenshot({ path: OUT + 'lighttest-d-drift.png' });
      await ends(p);
      // the body clock and green in Settings
      await go(p, 'settings', 500);
      await p.click('#stLtCh button[data-chrono="evening"]'); await p.waitForTimeout(250);
      const G1 = await E(p, () => ({ kept: localStorage.getItem('entrain.chrono'), row: document.querySelector('#ltGreenRow').hidden, on: document.querySelector('#ltGreenOn').checked, txt: document.querySelector('#ltAutoTxt').textContent }));
      ok(G1.kept === 'evening' && !G1.row && !G1.on && await seg(p, '#stLtCh button') === 'Morning person | In between | Evening person*' && /\(afternoon, by your body clock\)/.test(G1.txt),
        'Evening person is kept, with Bright in green offered (off), and Automatic\'s words go by your body clock: ' + JSON.stringify(G1));
      await p.click('#ltGreenOn'); await p.waitForTimeout(200);
      ok(await E(p, () => localStorage.getItem('entrain.ltGreen')) === '1' && /Bright in green for focus and energy/.test(await t(p, '#ltAutoTxt')), 'ticking it keeps it, and Automatic now gives green: ' + await t(p, '#ltAutoTxt'));
      await p.click('#stLtCh button[data-chrono="mid"]'); await p.waitForTimeout(200);
      ok(await E(p, () => localStorage.getItem('entrain.chrono') === null && document.querySelector('#ltGreenRow').hidden && window.__entrain.ltResolve('bright', '', false) === 'bright'),
        'In between: the times as usual, no green offered and Bright plain again');
      await p.context().close();
    }

    /* E. 360 px, 44 px targets, the new words */
    if (!only || only === 'E') {
      const p = await page({ light: 'auto', chrono: 'evening' }, { url: URL, unlock: true, vp: { width: 360, height: 740 }, hour: 21 });
      const wide = [], small = [], seen = [];
      for (const h of ['breathe', 'settings', 'practice/calm-reset', 'l-light']) {
        await go(p, h, 600);
        if (h === 'breathe') { await p.click('#bAdjust').catch(() => {}); await p.waitForTimeout(500); }
        const m = await E(p, () => {
          const bs = [...document.querySelectorAll('#bLight .chip, .lt-seg button')].filter(b => b.offsetParent);
          return { w: document.documentElement.scrollWidth - document.documentElement.clientWidth, n: bs.length,
            s: bs.filter(b => b.getBoundingClientRect().height < 44).map(b => b.textContent.trim() + ' ' + Math.round(b.getBoundingClientRect().height)) };
        });
        if (m.w > 0) wide.push(h + ' by ' + m.w);
        small.push(...m.s);
        seen.push(h + ' ' + m.n);
        if (h === 'settings') { await E(p, () => document.getElementById('st-light').scrollIntoView()); await p.screenshot({ path: OUT + 'lighttest-e-settings.png' }); }
        if (h === 'breathe') { await p.screenshot({ path: OUT + 'lighttest-e-breathe.png' }); await p.click('#bPanelDone').catch(() => {}); }
      }
      ok(!wide.length && !small.length, 'at 360 px nothing is wider than the screen, and every new button is at least 44 px tall (' + seen.join(', ') + ')' + (wide.length ? ': too wide ' + wide.join(', ') : '') + (small.length ? ': small ' + small.join(', ') : ''));
      await go(p, 'settings', 500);
      const words = await E(p, () => document.getElementById('st-light').textContent + ' ' + document.querySelector('#bLightHint').textContent + ' ' +
        [...document.querySelectorAll('#l-light ~ p')].slice(0, 4).map(e => e.textContent).join(' '));
      const bad = words.match(SPELL);
      ok(!bad, 'British spelling in Settings, Breathe\'s words and Learn' + (bad ? ': ' + bad[0] : ''));
      // Breathe's words for each choice: what it does, said as what it is
      await go(p, 'breathe', 500);
      const hints = [];
      for (const k of ['off', 'auto', 'bright', 'warm', 'night']) { await pick(p, '#bLight input[value="' + k + '"]'); await p.waitForTimeout(120); hints.push(await t(p, '#bLightHint')); }
      const plain = hints.map(h => h.replace(/ A web page can't set your phone's brightness: turn it up for Bright and down for Night\.$/, ''));
      ok(new Set(hints).size === 5 && !plain.some(h => WORDING.test(h)) && !hints.join(' ').match(SPELL) && /^Automatic picks from the time of day and what the pattern is for: Warm now, in the evening\./.test(hints[1]),
        'Breathe says what each choice does, in its own words, Automatic what it picks now (an evening person at 9 in the evening: Warm): ' + plain.join(' | '));
      await p.context().close();
    }
  } catch (e) { log.push('ERROR ' + (e && e.stack || e)); }
  await browser.close();
  console.log(log.join('\n'));
  console.log(log.filter(l => l.startsWith('PASS')).length + ' passed, ' + log.filter(l => /^(FAIL|PAGEERROR|ERROR|CONSOLE)/.test(l)).length + ' problems');
  process.exit(log.some(l => /^(FAIL|PAGEERROR|ERROR|CONSOLE)/.test(l)) ? 1 : 0);
})();
