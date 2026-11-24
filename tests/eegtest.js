// A Muse EEG headband's brain trends (eeg.js) and Brain-Led Beats, with a stand-in headband (tests/muse-mock.js)
// sending made-up EEG packets in the Muse's own format.
//   A  the method, through the page's own functions: the commands and the packets decoded as muse-js does them,
//      alpha's and theta's shares of a two-second stretch, blinks, a tense jaw and a sensor off the skin told
//      apart from a clean signal by their size (and why they must be left out), the first minute and the last
//      25 seconds, the eyes check's result; Brain-Led Beats' plans and wording at every length
//   B  locked on the real build: the Heart page's panel readable, its button with the cup, opening the dialog
//      by name with no Bluetooth asked for; Brain-Led Beats' Start the same; the library, search, Settings' list
//      and Learn's links with the cup
//   C  unlocked, connecting end to end: the chooser asked for the Muse service, the stream started as muse-js
//      starts it, every sensor good, the battery, the trend against the first minute (steady, then alpha rising),
//      never a verdict on your state, blinks and movement left out without moving the trend, a tense jaw, two
//      sensors off the skin, starting the trend again, the page held from updating, disconnecting
//   D  connecting when it goes wrong: the chooser closed, Bluetooth off, another device, no readings, no answer, Cancel, a
//      dropped link coming back and one that doesn't, a browser with no Bluetooth (an iPhone)
//   E  the eyes-open, eyes-closed check: the bells and the words, alpha's rise and what it tells, kept; no rise;
//      too noisy; cancelled
//   F  Brain-Led Beats end to end: the beat following alpha and theta down and back up, the live chips, the end
//      screen's tiles, explanation and chart, the history; with no headband, the scripted descent
//   G  the trends in another practice: the live chips, the end screen and the history; 360 px, 44 px targets,
//      British spelling in the new words
// Run: node tests/eegtest.js [group letter]
const { chromium, APP, OUT } = require('./pw');
const { testApp, unlockInit, unlocked } = require('./unlock-helper');
const museMock = require('./muse-mock');
const S20 = 'Mozilla/5.0 (Linux; Android 13; SM-G988B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Mobile Safari/537.36';
const IPH = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1';
const only = process.argv[2] || '';
const t = (p, s) => p.$eval(s, e => e.textContent.replace(/\s+/g, ' ').trim()).catch(() => '(missing)');
const E = (p, f, a) => p.evaluate(f, a);
const go = async (p, h, ms) => { await p.evaluate(x => location.hash = x, h); await p.waitForTimeout(ms || 400); };
const until = async (p, f, ms, a) => { try { await p.waitForFunction(f, a, { timeout: ms || 5000, polling: 100 }); return true; } catch (e) { return false; } };
const vis = (p, s) => p.$eval(s, e => !!(e.offsetWidth || e.offsetHeight) && !e.closest('[hidden]')).catch(() => false);
const OPT = o => JSON.stringify(Object.assign({ voice: false, bells: false, cues: 'off', visual: 'circle', audio: false, voiceName: '', ana: 0, rhythm: false }, o || {}));
const SPELL = /\b(programs?|toward|synthesiz\w*|color\w*|favor\w*|behavior\w*|center(?:s|ed)?|organiz\w*|realiz\w*|recogniz\w*|minimiz\w*|optimiz\w*|personaliz\w*|prioritiz\w*|visualiz\w*|analyz\w*|gray|fiber|aging)\b/i;
const NOT = /n't\b|\b(do not|never|nothing|without|stop|avoid|none)\b|feel the breath/i;
const VERDICT = /you are in|you're in (alpha|theta|delta|beta)|in theta now|in alpha now/i;
const NAME = 'Brain trends from a headband';

(async () => {
  const browser = await chromium.launch();
  const log = []; const ok = (c, m) => log.push((c ? 'PASS ' : 'FAIL ') + m);
  const URL = testApp();
  // a phone with debug on; o.unlock: the test copy, unlocked; o.muse: the headband's stand-in and its options (o.speed runs the clock);
  // o.noBt: no Bluetooth at all, as on an iPhone; o.scale: the connection deadlines shortened; o.said: what's spoken, kept
  const page = async (st, o) => {
    o = o || {};
    const ctx = await browser.newContext(o.desk ? { viewport: { width: 1280, height: 900 } }
      : { userAgent: o.ua || S20, viewport: o.vp || { width: 412, height: 915 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    const p = await ctx.newPage();
    p.on('pageerror', e => log.push('PAGEERROR ' + e.message));
    p.on('console', m => { if (m.type() === 'error') log.push('CONSOLE ' + m.text()); });
    if (o.unlock) await unlockInit(p);
    await p.addInitScript(([s, sc]) => {
      if (!sessionStorage.getItem('z.seeded')) {
        sessionStorage.setItem('z.seeded', '1');
        localStorage.setItem('entrain.debug', '1'); localStorage.setItem('entrain.stereo', 'ok'); localStorage.setItem('entrain.optsOpen', '1');
        for (const k in s) localStorage.setItem('entrain.' + k, s[k]);
      }
      window.__said = [];
      if (window.speechSynthesis) { speechSynthesis.speak = u => window.__said.push(u.text); speechSynthesis.cancel = () => {}; }
      if (sc) window.__egScale = sc;
      // every tone that starts, by its pitch: the check's bells
      window.__tones = [];
      const st0 = OscillatorNode.prototype.start;
      OscillatorNode.prototype.start = function (w) { try { window.__tones.push(Math.round(this.frequency.value * 100) / 100); } catch (e) {} return st0.apply(this, arguments); };
    }, [Object.assign({ pOpt: OPT() }, st || {}), o.scale || 0]);
    if (o.noBt) await p.addInitScript(() => { Object.defineProperty(navigator, 'bluetooth', { configurable: true, value: undefined }); });
    else await p.addInitScript(museMock, Object.assign({ speed: o.speed || 1 }, o.muse || {}));
    await p.goto(o.unlock ? URL : APP);
    if (o.unlock) await unlocked(p);
    await p.waitForTimeout(300);
    return p;
  };
  const connect = async p => {
    await go(p, 'eeg', 400);
    await p.click('#egGo');
    return until(p, () => window.__entrain.EG.state === 'on', 8000);
  };
  // the page's own clock (sped up by the stand-in)
  const now = p => E(p, () => performance.now() / 1000);
  const waitPage = async (p, secs, ms) => { const t0 = await now(p); return until(p, ([a, s]) => performance.now() / 1000 - a >= s, ms || 60000, [t0, secs]); };
  const atT = (p, T, ms) => until(p, T => { const P = window.__entrain.P; return P.state === 'running' && performance.now() / 1000 - P.t0 >= T; }, ms || 90000, T);

  try {
    /* A. the method, through the page's own functions */
    if (!only || only === 'A') {
      const p = await page();
      const R = await E(p, () => {
        const X = window.__entrain, out = {};
        out.p21 = Array.from(X.egCmd('p21')).join(','); out.d = Array.from(X.egCmd('d')).join(',');
        // a packet with known samples, packed two to every three bytes, as the headband sends them
        const n = [0, 4095, 2048, 2049, 100, 3000, 1234, 2047, 4000, 17, 2500, 1600], dv = new DataView(new ArrayBuffer(20));
        dv.setUint16(0, 54321);
        for (let j = 0, b = 2; j < 12; j += 2, b += 3) { dv.setUint8(b, n[j] >> 4); dv.setUint8(b + 1, ((n[j] & 15) << 4) | (n[j + 1] >> 8)); dv.setUint8(b + 2, n[j + 1] & 255); }
        const d = X.egDecode(dv);
        out.idx = d.idx; out.dec = d.s.every((v, j) => Math.abs(v - 0.48828125 * (n[j] - 2048)) < 1e-9) && d.s.length === 12;
        // two seconds at 256 a second of made-up signals, in µV
        let seed = 3; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
        const g = () => Math.sqrt(-2 * Math.log(rnd() + 1e-12)) * Math.cos(2 * Math.PI * rnd());
        const sig = f => Float64Array.from({ length: 512 }, (_, i) => f(i / 256));
        const B = s => { const r = X.egBands(s); return { a: +r.a.toFixed(3), th: +r.th.toFixed(3), pp: Math.round(r.pp), emg: +r.emg.toFixed(1), st: X.egState(r) }; };
        out.alpha = B(sig(t => 20 * Math.sin(2 * Math.PI * 10 * t) + g()));
        out.theta = B(sig(t => 20 * Math.sin(2 * Math.PI * 6 * t) + g()));
        out.both = B(sig(t => 10 * Math.sin(2 * Math.PI * 10 * t) + 10 * Math.sin(2 * Math.PI * 6 * t + 1) + g()));
        out.blink = B(sig(t => 10 * Math.sin(2 * Math.PI * 10 * t) + 250 * Math.exp(-Math.pow((t - 1) / 0.12, 2)) + g()));
        out.clean = B(sig(t => 10 * Math.sin(2 * Math.PI * 10 * t) + g()));
        out.jaw = B(sig(t => 10 * Math.sin(2 * Math.PI * 10 * t) + 10 * (Math.sin(2 * Math.PI * 33 * t) + Math.sin(2 * Math.PI * 38 * t + 1) + Math.sin(2 * Math.PI * 43 * t + 2)) + g()));
        out.off = B(sig(t => 700 * Math.sin(2 * Math.PI * 50 * t) + 300 * g()));
        out.flat = B(sig(() => 0));
        out.mains = B(sig(t => 10 * Math.sin(2 * Math.PI * 10 * t) + 30 * Math.sin(2 * Math.PI * 50 * t) + g()));
        // the first minute and the last 25 seconds: a list of seconds as the page keeps them
        const L = Array.from({ length: 200 }, (_, i) => ({ t: i + 1, ok: true, a: i < 100 ? 0.3 : 0.39, th: 0.2 }));
        const ref = X.egRef(L, 0, 200), cur = X.egNow(L, 200);
        out.ref = ref && +ref.a.toFixed(3); out.refN = ref && ref.n; out.cur = cur && +cur.a.toFixed(3);
        out.words = [X.egWord(cur.a / ref.a - 1), X.egWord(cur.th / ref.th - 1), X.egWord(-0.2), X.egWord(0.14), X.egWord(-0.14)].join(',');
        out.early = X.egRef(L.filter(x => x.t <= 30), 0, 30);
        const N = L.map(x => Object.assign({}, x, { ok: x.t > 100 || x.t % 10 === 0 }));     // a noisy first minute and more
        const r2 = X.egRef(N, 0, 200); out.late = r2 && r2.n;
        const S = L.map(x => Object.assign({}, x, { ok: x.t < 190 || x.t % 2 === 0 }));     // five clean of the last ten
        out.thin = X.egNow(S.filter(x => x.t <= 180 || x.t > 190 || x.t % 3 === 0).filter(x => !(x.t > 175 && x.t <= 190)), 200);
        // the eyes check's result
        const C = (o, c) => { const r = X.egCalOf(o, c); return { rise: r.ok ? +r.rise.toFixed(2) : null, txt: X.egCalTxt(r) }; };
        out.cal = [C(Array(15).fill(0.3), Array(15).fill(0.45)), C(Array(15).fill(0.3), Array(15).fill(0.33)), C(Array(15).fill(0.3), Array(15).fill(0.29)), C(Array(5).fill(0.3), Array(15).fill(0.45))];
        // Brain-Led Beats' plans at every length
        const dl = X.PRACTICES.find(x => x.id === 'brain-led');
        out.def = { sup: dl.sup, exp: dl.exp, strength: dl.strength, lens: dl.lengths.join(','), cite: dl.cite, eeg: dl.eeg, dyn: dl.audio.dyn, start: dl.audio.start };
        out.plans = dl.lengths.map(L => { const pl = X.pPlan(dl, L); return { L, total: pl.total, ks: pl.steps.map(s => s.k + (s.phase ? ':' + s.phase : '')).join(','),
          lines: pl.steps.every(s => s.lines.every((l, i) => l[0] >= 0 && l[0] < s.secs && (!i || l[0] > s.lines[i - 1][0]))) }; });
        const words = [dl.blurb].concat(...dl.lengths.map(L => X.pPlan(dl, L).steps.map(s => [s.title].concat(s.lines.map(l => l[1])))).flat());
        out.not = words.filter(w => /n't\b|\b(do not|never|nothing|without|stop|avoid|none)\b|feel the breath/i.test(w));
        out.spell = [dl.name, dl.blurb, dl.how, dl.ev, dl.tip.join(' ')].concat(words).join(' ');
        out.ref24 = [...document.querySelectorAll('#references li')].some(li => /^Mikhaylov, D\..*\(2024\)/.test(li.textContent.replace(/\s+/g, ' ').trim()));
        return out;
      });
      ok(R.p21 === '4,112,50,49,10' && R.d === '2,100,10', 'commands are written as muse-js writes them, their length first: p21 ' + R.p21 + ', d ' + R.d);
      ok(R.idx === 54321 && R.dec, 'a packet decodes into its number and twelve 12-bit samples in µV (0.48828125 µV a step about 2048): ' + R.idx);
      ok(R.alpha.a > 0.9 && R.alpha.th < 0.05 && R.alpha.st === 'good', 'a 10 Hz wave is almost all alpha: ' + JSON.stringify(R.alpha));
      ok(R.theta.th > 0.9 && R.theta.a < 0.05 && R.theta.st === 'good', 'a 6 Hz wave almost all theta: ' + JSON.stringify(R.theta));
      ok(Math.abs(R.both.a - R.both.th) < 0.1 && R.both.a > 0.4, 'equal alpha and theta share alike: ' + JSON.stringify(R.both));
      ok(R.blink.st === 'noisy' && R.blink.pp > 150 && R.blink.a < R.clean.a / 2 && R.clean.st === 'good',
        'a blink swings past 150 µV and is left out; kept, it would halve alpha\'s share: ' + R.blink.a + ' against ' + R.clean.a);
      ok(R.jaw.st === 'noisy' && R.jaw.pp < 150 && R.jaw.emg > 10, 'a tense jaw is caught by its 30-45 Hz buzz, smaller than a blink: ' + JSON.stringify(R.jaw));
      ok(R.off.st === 'off' && R.flat.st === 'off', 'wild swings and a flat line read as off the skin: ' + R.off.pp + ' µV, flat ' + R.flat.st);
      ok(R.mains.st === 'good' && R.mains.a > 0.8, 'mains hum at 50 Hz is outside the bands and the jaw\'s, so it neither spoils nor shifts a second: ' + JSON.stringify(R.mains));
      ok(R.ref === 0.3 && R.refN === 60 && R.cur === 0.39 && R.words === 'rising,steady,falling,steady,steady',
        'the first minute (60 clean seconds) against the last 25 seconds: +30% reads as rising, ±14% as steady: ' + R.ref + ' → ' + R.cur + ', ' + R.words);
      ok(R.early === null, 'no first minute until the minute is over');
      ok(R.late === 20, 'a first minute with too few clean seconds takes the first twenty clean ones: ' + R.late);
      ok(R.thin === null, 'too few clean seconds in the last 25 give no trend rather than a guess');
      ok(R.cal[0].rise === 0.5 && /^Alpha rose by 50% with your eyes closed, as it should/.test(R.cal[0].txt) && /^Alpha rose a little, by 10%/.test(R.cal[1].txt) &&
        /^Alpha didn't rise with your eyes closed \(−3%\)/.test(R.cal[2].txt) && R.cal[3].rise === null && /^Too few clean seconds to compare \(5 with your eyes open, 15 closed/.test(R.cal[3].txt),
        'the eyes check: a clear rise, a small one, none, and too few clean seconds, each with what it tells');
      ok(R.def.sup && R.def.exp && R.def.strength === 1 && R.def.lens === '15,20,30' && R.def.eeg && R.def.dyn && R.def.start === 10 && /Mikhaylov et al\. 2024/.test(R.def.cite) && /Entrain's own rule/.test(R.def.cite) && R.ref24,
        'Brain-Led Beats: a new technique, experimental, one dot, 15 to 30 minutes, a live beat from 10 Hz, its source in the references: ' + R.def.cite);
      ok(R.plans.every(x => x.total === x.L * 60 && x.ks === 'guide,brain:base,brain:lead,guide' && x.lines), 'its plans: settle, read your rest, the brain-led beat, close, every length exactly: ' + R.plans.map(x => x.L + ' ' + x.total).join(', '));
      ok(!R.not.length && !SPELL.test(R.spell), 'its guidance says what to do, in British spelling' + (R.not.length ? ': ' + R.not.join(' | ') : ''));
      await p.context().close();
    }

    /* B. locked on the real build */
    if (!only || only === 'B') {
      const p = await page();
      await go(p, 'heart', 500);
      const H = await E(p, () => ({ after: document.querySelector('#hr').nextElementSibling.id, cup: !!document.querySelector('#egGo .sup-tag'), btn: document.querySelector('#egGo').textContent.trim(),
        intro: document.querySelector('#eeg .eg-intro').textContent, what: document.querySelector('#eeg .eg-what .ev-body').textContent.replace(/\s+/g, ' '), on: !document.querySelector('#egOn').hidden }));
      ok(H.after === 'eeg' && H.cup && /^Connect a headband/.test(H.btn) && !H.on, 'the Heart page has Brain trends after the heart\'s boxes, its button with the cup: ' + H.btn);
      ok(/rising or falling since your first minute/.test(H.intro) && /never a verdict/.test(H.intro) && /150 µV/.test(H.what) && /Eyes open, eyes closed/.test(H.what) && /Nothing is recorded or sent/.test(H.what),
        'what it does, how and what helps are free to read');
      await p.click('#egGo'); await p.waitForTimeout(400);
      ok(await vis(p, '#supModal') && await t(p, '#supFor') === NAME + ' is one of the new techniques.' && await E(p, () => window.__muse.opts === null && window.__entrain.EG.state === 'off'),
        'connecting opens the donation dialog by name, and no Bluetooth chooser: ' + await t(p, '#supFor'));
      await p.click('#supClose'); await p.waitForTimeout(300);
      await go(p, 'practice/brain-led', 500);
      ok(await t(p, '#viewTitle') === 'Brain-Led Beats' && /Unlock to start/.test(await t(p, '#sGo')) && /Calm · Programme · Experimental · 20 min/.test(await t(p, '.si-kind')),
        'Brain-Led Beats\' page reads, with Unlock to start: ' + await t(p, '.si-kind'));
      const I = await E(p, () => ({ need: [...document.querySelectorAll('#sIntro .si-need li')].map(l => l.textContent.trim()).join(' | '), tip: (document.querySelector('#sIntro .si-tip') || {}).textContent || '',
        tipA: (document.querySelector('#sIntro .si-tip a') || {}).hash || '' }));
      ok(/Headphones for the binaural beat/.test(I.need) && /Muse headband the beat follows it/.test(I.need) && /eyes-open, eyes-closed check/.test(I.tip) && I.tipA === '#eeg',
        'its needs name the headband, and a tip leads to connecting it: ' + I.need);
      await p.click('#sGo'); await p.waitForTimeout(400);
      ok(await vis(p, '#supModal') && await E(p, () => window.__entrain.P.state !== 'running'), 'Start opens the dialog instead');
      await p.click('#supClose'); await p.waitForTimeout(300);
      const lib = await E(p, () => { const it = window.__entrain.libAll().find(i => i.key === 'brain-led'); return it && { goal: it.goal, also: (it.also || []).join(), posture: it.posture.join(), needs: it.needs.join() }; });
      ok(lib && lib.goal === 'calm' && lib.posture === 'sit,lie' && /phones/.test(lib.needs), 'in the library under Calm, sitting or lying, with headphones: ' + JSON.stringify(lib));
      await go(p, 'practice', 600);
      ok(await E(p, () => !!document.querySelector('.pr-grp[data-g=calm] a[href="#practice/brain-led"] .sup-tag')), 'its library row carries the Donation badge');
      await p.click('#tbFind'); await p.waitForTimeout(200); await p.fill('#fdIn', 'muse headband'); await p.waitForTimeout(500);
      const F = await E(p, () => [...document.querySelectorAll('.fd-it')].slice(0, 4).map(a => ({ t: a.querySelector('b').textContent, h: a.getAttribute('href'), cup: !!a.querySelector('.sup-tag') })));
      ok(F.some(f => f.t === NAME && f.h === '#eeg' && f.cup) && F.some(f => f.t === 'Brain-Led Beats' && f.cup), 'search finds the headband\'s trends and Brain-Led Beats, with the badge: ' + F.map(f => f.t).join(' · '));
      await p.keyboard.press('Escape'); await p.waitForTimeout(200);
      await go(p, 'st-supporter', 500);
      const list = await E(p, () => [...document.querySelectorAll('#supList a')].map(a => a.textContent + ' ' + a.getAttribute('href')));
      ok(list.includes(NAME + ' #eeg') && list.includes('Brain-Led Beats #practice/brain-led'), 'Settings\' list of what the donation opens names both');
      await go(p, 'learn', 500);
      const L = await E(p, () => {
        const row = [...document.querySelectorAll('#lnGlance tr.ln-row')].find(r => r.querySelector('th b').textContent === 'EEG headband neurofeedback');
        const sig = [...document.querySelectorAll('#lnSignals tbody tr')].find(r => r.querySelector('th b').textContent === 'EEG');
        return { lo: row.children[2].classList.contains('ln-lo'), links: [...row.children[2].querySelectorAll('a')].map(a => a.getAttribute('href')).join(' '), ev: row.children[1].textContent,
          cups: [...row.children[2].querySelectorAll('a')].map(a => !!(a.nextElementSibling && a.nextElementSibling.classList.contains('sup-tag'))).join(','),
          sig: sig.children[2].textContent, sigLo: sig.children[2].classList.contains('ln-lo'), eeg: document.querySelector('#l-eeg').textContent.replace(/\s+/g, ' ') };
      });
      ok(!L.lo && L.links === '#eeg #practice/brain-led #l-muse' && L.cups === 'true,true,false' && L.ev === 'Moderate (the devices\' accuracy limits it)',
        'Learn\'s table of techniques links the headband row to Brain trends and Brain-Led Beats (both with the cup while locked) and keeps the guide\'s rating: ' + L.links + ' ' + L.cups);
      ok(!L.sigLo && /Brain trends on Heart, from a Muse headband/.test(L.sig) && /Brain trends in Entrain\./.test(L.eeg) && /mixed but promising/.test(L.eeg) && /hasn't been tested/.test(L.eeg) && !VERDICT.test(L.eeg),
        'What to measure says where Entrain reads EEG, and Learn how, with the evidence as the guide gives it');
      await p.context().close();
    }

    /* C. unlocked: connecting end to end */
    if (!only || only === 'C') {
      const p = await page(null, { unlock: true, speed: 10 });
      await go(p, 'eeg', 400);
      ok(await E(p, () => !document.querySelector('#egGo .sup-tag')), 'unlocked, the button has no cup');
      ok(await connect(p), 'Connect a headband connects: ' + await t(p, '#egPillTxt'));
      const M = await E(p, () => ({ opts: window.__muse.opts, cmds: window.__muse.cmds.join(' '), lenOk: window.__muse.lenOk, notif: window.__muse.notif, overlap: window.__muse.overlap, btn: document.querySelector('#egGoTxt').textContent,
        hint: document.querySelector('#egHint').textContent, busy: window.__entrain.appBusy() }));
      ok(M.opts.filters.some(f => f.services && f.services[0] === 0xfe8d) && M.opts.optionalServices.includes(0xfe8d) && M.opts.filters.some(f => f.namePrefix === 'Muse'),
        'the chooser is asked for the Muse service (0xfe8d), or a name starting Muse: ' + JSON.stringify(M.opts));
      ok(M.cmds === 'h p21 s d' && M.lenOk && M.notif >= 5 && M.overlap === 0, 'the stream starts as muse-js starts it, halt, preset p21, status, go, after asking for the control and four EEG readings, one request at a time: ' + M.cmds + ', ' + M.notif + ' asked, ' + M.overlap + ' overlapping');
      ok(M.btn === 'Disconnect' && M.hint === 'Muse-7A2C · battery 80%' && M.busy, 'Disconnect, the headband\'s name and battery, and the page holds back updates while it\'s connected: ' + M.hint);
      await waitPage(p, 20, 15000);
      const S = await E(p, () => ({ sens: [...document.querySelectorAll('#egSens li')].map(l => l.dataset.q).join(','), a: document.querySelector('#egA').textContent, as: document.querySelector('#egAS').textContent }));
      ok(S.sens === 'good,good,good,good' && S.a === '…' && S.as === 'Reading your first minute', 'every sensor good, and the first minute being read: ' + S.as);
      await waitPage(p, 75, 20000);
      const T1 = await E(p, () => ({ a: document.querySelector('#egA').textContent, as: document.querySelector('#egAS').textContent, th: document.querySelector('#egT').textContent,
        read: document.querySelector('#egRead').textContent, empty: document.querySelector('#egEmpty').hidden, n: window.__entrain.EG.sec.length, sm: window.__entrain.EG.sm.length }));
      ok(T1.a === 'Steady' && /^[+−]?\d+% since your first minute$/.test(T1.as) && T1.th === 'Steady' && /^Alpha steady and theta steady since your first minute, from the last 25 seconds/.test(T1.read),
        'a steady signal reads steady against the first minute: ' + T1.a + ', ' + T1.as);
      ok(T1.empty && T1.n >= 90 && T1.sm > 50, 'a second at a time, and the chart of 25-second averages: ' + T1.n + ' seconds');
      await p.screenshot({ path: OUT + 'eegtest-c-steady.png' });
      await E(p, () => { window.__egAlpha = 14; });
      await waitPage(p, 30, 15000);
      const T2 = await E(p, () => ({ a: document.querySelector('#egA').textContent, as: document.querySelector('#egAS').textContent, th: document.querySelector('#egT').textContent, read: document.querySelector('#egRead').textContent, all: document.querySelector('#eeg').textContent }));
      ok(T2.a === 'Rising' && /^\+\d+% since your first minute$/.test(T2.as) && parseInt(T2.as.slice(1), 10) >= 15, 'alpha rising since the first minute once it grows: ' + T2.as);
      ok(T2.th === 'Falling' && /theta falling/.test(T2.read), 'and theta\'s share falls as alpha\'s grows, shares being shares: ' + T2.read);
      ok(!VERDICT.test(T2.all), 'never a verdict on your state ("you are in theta")');
      // blinks on the forehead: those sensors left out, the trend unmoved
      const a0 = await E(p, () => window.__entrain.egNow(window.__entrain.EG.sec, performance.now() / 1000).a);
      await E(p, () => { window.__egBlink = 12; window.__bk0 = window.__entrain.EG.sec.length; });
      await waitPage(p, 8, 10000);
      const BK = await E(p, () => { const s = window.__entrain.EG.sec.slice(window.__bk0); return { fore: s.filter(x => x.st[1] === 'noisy' || x.st[2] === 'noisy').length, ears: s.every(x => x.st[0] === 'good' && x.st[3] === 'good'), ok: s.filter(x => x.ok).length, n: s.length, a: window.__entrain.egNow(window.__entrain.EG.sec, performance.now() / 1000).a }; });
      ok(BK.fore >= 4 && BK.ears && BK.ok === BK.n && Math.abs(BK.a / a0 - 1) < 0.08, 'blinks: the forehead sensors\' seconds are left out, the ears carry on, and alpha\'s average holds: ' + BK.fore + ' of ' + BK.n + ' seconds, ' + (BK.a / a0).toFixed(3));
      // moving the head: every sensor swings, those seconds left out
      await E(p, () => { window.__egMove = 6; window.__mv0 = window.__entrain.EG.sec.length; });
      await waitPage(p, 5, 10000);
      const MV = await E(p, () => { const s = window.__entrain.EG.sec.slice(window.__mv0); return { bad: s.filter(x => !x.ok).length, n: s.length, a: window.__entrain.egNow(window.__entrain.EG.sec, performance.now() / 1000), sens: [...document.querySelectorAll('#egSens li')].map(l => l.dataset.q).join(',') }; });
      ok(MV.bad >= 4 && MV.a && Math.abs(MV.a.a / a0 - 1) < 0.08, 'moving the head: every sensor swings, those seconds are left out and alpha\'s average holds: ' + MV.bad + ' of ' + MV.n + ' left out');
      await waitPage(p, 6, 10000);
      // a tense jaw
      await E(p, () => { window.__egJaw = 6; window.__jw0 = window.__entrain.EG.sec.length; });
      await waitPage(p, 5, 10000);
      const JW = await E(p, () => { const s = window.__entrain.EG.sec.slice(window.__jw0); return { bad: s.filter(x => !x.ok).length, n: s.length }; });
      ok(JW.bad >= 4, 'a tense jaw\'s seconds are left out too: ' + JW.bad + ' of ' + JW.n);
      await waitPage(p, 8, 10000);
      // two sensors off the skin
      await E(p, () => { window.__egOff = [0, 3]; });
      await waitPage(p, 4, 10000);
      const OF = await E(p, () => ({ sens: [...document.querySelectorAll('#egSens li')].map(l => l.dataset.q + ':' + l.querySelector('b').textContent).join(','), read: document.querySelector('#egRead').textContent, last: window.__entrain.EG.sec.slice(-1)[0] }));
      ok(/^off:off the skin,good:good,good:good,off:off the skin$/.test(OF.sens) && /^Not touching the skin: Left ear, Right ear\. Push your hair aside/.test(OF.read) && OF.last.ok && OF.last.n === 2,
        'two sensors off the skin say so, and the forehead\'s two still count: ' + OF.read.slice(0, 50));
      await E(p, () => { window.__egOff = []; });
      await p.click('#egAgain'); await p.waitForTimeout(300);
      ok(await t(p, '#egA') === '…' && /^(Reading your first minute|Waiting for a clean signal)$/.test(await t(p, '#egAS')), 'Start the trend again from now: a new first minute is read: ' + await t(p, '#egAS'));
      await p.evaluate(() => document.querySelector('#eeg').scrollIntoView());
      await p.screenshot({ path: OUT + 'eegtest-c-panel.png' });
      await p.click('#egGo'); await p.waitForTimeout(400);
      const D = await E(p, () => ({ st: window.__entrain.EG.state, cmd: window.__muse.cmds.slice(-1)[0], btn: document.querySelector('#egGoTxt').textContent, on: !document.querySelector('#egOn').hidden, busy: window.__entrain.appBusy() }));
      ok(D.st === 'off' && D.cmd === 'h' && D.btn === 'Connect a headband' && !D.on && !D.busy, 'Disconnect halts the stream and lets go: ' + JSON.stringify(D));
      await p.context().close();
    }

    /* D. connecting when it goes wrong */
    if (!only || only === 'D') {
      const msgOf = async (muse, scale) => {
        const p = await page(null, { unlock: true, muse, scale: scale || 0.02 });
        await go(p, 'eeg', 300); await p.click('#egGo');
        await until(p, () => window.__entrain.EG.state === 'off' && !!document.querySelector('#egErr').textContent, 5000);
        const r = { st: await E(p, () => window.__entrain.EG.state), err: await t(p, '#egErr'), shown: await vis(p, '#egErr') };
        await p.context().close();
        return r;
      };
      const c1 = await msgOf({ cancel: true });
      ok(c1.st === 'off' && c1.shown && /^No headband was chosen\. Switch the Muse on/.test(c1.err), 'the chooser closed: ' + c1.err);
      const c1b = await msgOf({ noAdapter: true });
      ok(/^Bluetooth is off or unavailable on this device: switch it on/.test(c1b.err), 'Bluetooth switched off: ' + c1b.err);
      const c2 = await msgOf({ noSvc: true });
      ok(/^This device has no Muse EEG service/.test(c2.err), 'another device: ' + c2.err);
      const c3 = await msgOf({ noData: true });
      ok(/^The headband connected but sent no EEG readings\. Newer models may send them in a format/.test(c3.err), 'no readings: ' + c3.err);
      const c4 = await msgOf({ hang: 'link' });
      ok(/^The headband didn't answer while linking up\. .*close the Muse app on any phone nearby/.test(c4.err), 'no answer: ' + c4.err);
      // Cancel while it's connecting
      const p = await page(null, { unlock: true, muse: { hang: 'service' } });
      await go(p, 'eeg', 300); await p.click('#egGo'); await p.waitForTimeout(400);
      const busy = { st: await E(p, () => window.__entrain.EG.state), btn: await t(p, '#egGoTxt'), msg: await t(p, '#egMsg'), pill: await t(p, '#egPillTxt') };
      ok(busy.st === 'busy' && busy.btn === 'Cancel' && /^Connecting to Muse-7A2C: finding its EEG…$/.test(busy.msg) && busy.pill === 'Connecting…', 'while it connects: Cancel, and the step it\'s on: ' + busy.msg);
      await p.click('#egGo'); await p.waitForTimeout(300);
      ok(await E(p, () => window.__entrain.EG.state === 'off') && !(await vis(p, '#egErr')) && await t(p, '#egGoTxt') === 'Connect a headband', 'Cancel stops it quietly');
      await p.context().close();
      // a dropped link comes back; one that stays down gives up after three tries
      const q = await page(null, { unlock: true, speed: 5, scale: 0.05 });
      ok(await connect(q), 'connected');
      const lost = await E(q, () => { window.__museDrop(); return { st: window.__entrain.EG.state, pill: document.querySelector('#egPillTxt').textContent }; });
      const back = await until(q, () => window.__entrain.EG.state === 'on' && window.__muse.connects === 2, 8000);
      ok(lost.st === 'lost' && lost.pill === 'Reconnecting…' && back, 'a dropped link reconnects by itself: ' + lost.pill);
      await E(q, () => { window.__museDown = true; window.__museDrop(); });
      await until(q, () => window.__entrain.EG.state === 'off', 15000);
      ok(await E(q, () => window.__entrain.EG.state === 'off' && window.__muse.connects === 5) && /^The headband dropped out and didn't come back/.test(await t(q, '#egErr')),
        'one that stays out of reach gives up after three tries and says so: ' + await t(q, '#egErr'));
      await q.context().close();
      // no Bluetooth: an iPhone
      const r = await page(null, { unlock: true, noBt: true, ua: IPH });
      await go(r, 'eeg', 400);
      ok(await E(r, () => document.querySelector('#egGo').disabled) && await vis(r, '#egNo') && /Safari and the other browsers on iPhone and iPad have no Web Bluetooth/.test(await t(r, '#egNo')),
        'on an iPhone the button is off and the page says why, and where it works: ' + (await t(r, '#egNo')).slice(0, 60));
      await r.context().close();
    }

    /* E. the eyes-open, eyes-closed check */
    if (!only || only === 'E') {
      const p = await page(null, { unlock: true, speed: 10 });
      ok(await connect(p), 'connected');
      await waitPage(p, 5, 8000);
      await p.click('#egCheck'); await p.waitForTimeout(200);
      const c0 = { btn: await t(p, '#egCheckTxt'), now: await t(p, '#egCalNow'), said: await E(p, () => window.__said.slice(-1)[0]), busy: await E(p, () => window.__entrain.appBusy()) };
      ok(c0.btn === 'Cancel the check' && /^Eyes open, resting on one point: \d+ s$/.test(c0.now) && c0.said === 'Keep your eyes open, resting on one point.', 'the check starts with the eyes open, said aloud: ' + c0.now);
      await until(p, () => window.__entrain.EG.chk && window.__entrain.EG.chk.phase === 'closed', 15000);
      await E(p, () => { window.__egAlpha = 14; });              // the eyes close, alpha rises
      const c1 = { now: await t(p, '#egCalNow'), said: await E(p, () => window.__said.slice(-1)[0]), bell: await E(p, () => window.__tones.includes(392)) };
      ok(/^Eyes closed until the two bells: \d+ s$/.test(c1.now) && c1.said === 'Close your eyes, and keep them closed until the two bells.' && c1.bell, 'after half a minute a bell and the words: close your eyes');
      await until(p, () => !window.__entrain.EG.chk, 15000);
      const c2 = await E(p, () => ({ res: document.querySelector('#egCalRes').textContent, said: window.__said.slice(-1)[0], bells: window.__tones.filter(f => f === 523.25).length,
        cal: JSON.parse(localStorage.getItem('entrain.egCal') || 'null'), span: window.__entrain.egSpan(), btn: document.querySelector('#egCheckTxt').textContent }));
      ok(/^Alpha rose by \d+% with your eyes closed, as it should: the headband is picking up your alpha\. Brain-Led Beats now counts a rise like this as a full one\.$/.test(c2.res) &&
        c2.said === 'Open your eyes.' && c2.bells === 2 && c2.btn === 'Eyes open, eyes closed', 'two bells, open your eyes, and the result: ' + c2.res);
      ok(c2.cal && c2.cal.rise > 0.2 && c2.cal.n[0] >= 20 && c2.cal.n[1] >= 20 && Math.abs(c2.span - Math.min(0.6, c2.cal.rise)) < 1e-9,
        'kept, five seconds of each half left out while alpha settles, and it sets Brain-Led Beats\' full rise: ' + (c2.cal && c2.cal.rise.toFixed(2)) + ', ' + c2.cal.n.join('/'));
      // no rise
      await p.click('#egCheck'); await until(p, () => window.__entrain.EG.chk && window.__entrain.EG.chk.phase === 'closed', 15000);
      await until(p, () => !window.__entrain.EG.chk, 15000);
      const c3 = await E(p, () => ({ cal: JSON.parse(localStorage.getItem('entrain.egCal')), span: window.__entrain.egSpan() }));
      ok(/^Alpha (didn't rise|rose a little)/.test(await t(p, '#egCalRes')) && /Push your hair aside/.test(await t(p, '#egCalRes')) && c3.cal.rise < 0.1 && c3.span === 0.3,
        'no rise: the fit to check, and Brain-Led Beats back on its usual 30%: ' + (await t(p, '#egCalRes')).slice(0, 60));
      // too noisy
      await p.click('#egCheck'); await p.waitForTimeout(100);
      await E(p, () => { window.__egJaw = 70; });
      await until(p, () => !window.__entrain.EG.chk, 20000);
      ok(/^Too few clean seconds to compare/.test(await t(p, '#egCalRes')), 'a tense jaw throughout: too few clean seconds: ' + (await t(p, '#egCalRes')).slice(0, 70));
      // cancelled
      await p.click('#egCheck'); await p.waitForTimeout(200); await p.click('#egCheck'); await p.waitForTimeout(200);
      ok(await E(p, () => !window.__entrain.EG.chk && document.querySelector('#egCalRes').hidden && document.querySelector('#egCalNow').hidden), 'Cancel the check ends it with nothing said');
      // the earlier check is still the one kept, and says so after a reload
      const kept = await E(p, () => JSON.parse(localStorage.getItem('entrain.egCal')));
      ok(kept && kept.rise === c3.cal.rise, 'a check that couldn\'t compare, or was cancelled, leaves the last one kept');
      await p.context().close();
    }

    /* F. Brain-Led Beats end to end */
    if (!only || only === 'F') {
      const p = await page({ pOpt: OPT({ audio: true }), 'pLen.brain-led': '15' }, { unlock: true, speed: 30 });
      await E(p, () => { window.__egAlpha = 6; window.__egTheta = 4; window.__egBeta = 8; });     // tense: more beta
      ok(await connect(p), 'connected');
      await go(p, 'practice/brain-led', 500);
      await p.click('#sGo');
      ok(await until(p, () => window.__entrain.P.state === 'running', 5000), 'Brain-Led Beats starts, unlocked');
      await atT(p, 30, 20000);
      const L0 = { chips: await t(p, '#sLive'), cap: await t(p, '#sCap') };
      ok(/Headband first minute/.test(L0.chips) && L0.cap === 'Settle', 'settling, the chips say the first minute is being read: ' + L0.chips);
      await atT(p, 100, 20000);
      const L1 = { sub: await t(p, '#sSub'), vis: await E(p, () => document.querySelector('#sStage').dataset.vis), chips: await t(p, '#sLive') };
      ok(/^Reading your resting alpha and theta · \d+ s$/.test(L1.sub) && L1.vis === 'brainled' && /Alpha steady/.test(L1.chips) && /Theta steady/.test(L1.chips),
        'reading your rest, with the chart, and the chips steady: ' + L1.sub + ' · ' + L1.chips);
      await atT(p, 150, 20000);
      await E(p, () => { window.__egAlpha = 9; window.__egTheta = 6; window.__egBeta = 3; });    // relaxing: alpha and theta up, beta down
      await atT(p, 320, 30000);
      const L2 = await E(p, () => { const X = window.__entrain; return { src: X.AD.src, cur: X.AD.cur, track: X.A.track && X.A.track.cur, base: X.EG.led.base, calm: X.EG.led.calm, sub: document.querySelector('#sSub').textContent,
        chips: document.querySelector('#sLive').textContent.replace(/\s+/g, ' ') }; });
      ok(L2.src === 'brain' && L2.base && L2.base.n >= 30 && Math.abs(L2.base.a / 0.3 - 1) < 0.1 && L2.cur < 7 && L2.track === L2.cur && L2.calm > 0.8 && L2.sub === 'Following your alpha and theta',
        'alpha and theta up on your rest: the beat follows them down from 10 Hz: ' + L2.cur + ' Hz, ' + L2.sub);
      ok(/Alpha rising/.test(L2.chips) && /Theta rising/.test(L2.chips), 'and the chips say rising: ' + L2.chips);
      const steps = await E(p, () => { const l = window.__entrain.AD.log.filter(x => x.src === 'brain'); return Math.max(...l.slice(1).map((x, i) => Math.abs(x.hz - l[i].hz))); });
      ok(steps <= 0.1501, 'never faster than 0.15 Hz an update: ' + steps.toFixed(3));
      await E(p, () => { window.__egAlpha = 6; window.__egTheta = 4; window.__egBeta = 8; });    // tense again
      const low = await E(p, () => window.__entrain.AD.cur);
      await atT(p, 480, 30000);
      const up = await E(p, () => window.__entrain.AD.cur);
      ok(up >= low + 1.5, 'tense again: the beat climbs back: ' + low + ' → ' + up + ' Hz');
      await E(p, () => { window.__egAlpha = 9; window.__egTheta = 6; window.__egBeta = 3; });
      await p.screenshot({ path: OUT + 'eegtest-f-run.png' });
      await until(p, () => window.__entrain.P.state === 'done', 60000);
      const D = await E(p, () => ({ tiles: [...document.querySelectorAll('#sDone .sd-t')].map(b => b.querySelector('span').textContent + ':' + b.querySelector('b').textContent + ':' + b.querySelector('small').textContent),
        chart: !!document.querySelector('#sdEeg'), label: (document.querySelector('.eg-sd span') || {}).textContent || '', n: window.__entrain.P.eeg.length }));
      const al = D.tiles.find(x => /^Alpha:/.test(x)), th = D.tiles.find(x => /^Theta:/.test(x)), bt = D.tiles.find(x => /^Beat:/.test(x));
      ok(al && /^Alpha:Rising:\+\d+%, first minute to last two$/.test(al) && th && /^Theta:Rising:/.test(th), 'the end screen: alpha and theta rising, first minute to last two: ' + al + ' · ' + th);
      ok(bt && /Hz, led by your alpha and theta$/.test(bt) && D.chart && /with the beat in violet/.test(D.label) && D.n > 850, 'the beat led by them, and a chart of the session with the beat: ' + bt);
      await p.click('#sDone .sd-t[data-ex="eeg"]'); await p.waitForTimeout(300);
      const ex = await t(p, '#sdEx');
      ok(/From your first minute of clean signal to the last two minutes, alpha's share of the headband's signal rose by \d+%, and theta's rose by \d+%/.test(ex) && /a picture of the session rather than a score/.test(ex) && !VERDICT.test(ex),
        'its explanation: how it\'s worked out, and a picture rather than a score');
      await p.click('#sDone .sd-t[data-ex="beat"]'); await p.waitForTimeout(300);
      ok(/After a minute and a half reading your resting alpha and theta, the beat followed them/.test(await t(p, '#sdEx')), 'the beat\'s explanation says what led it');
      await p.screenshot({ path: OUT + 'eegtest-f-done.png', fullPage: true });
      const h = await E(p, () => JSON.parse(localStorage.getItem('entrain.history')).slice(-1)[0]);
      ok(h.id === 'brain-led' && h.alpha > 15 && typeof h.theta === 'number' && /alpha \+\d+%, theta [+−]\d+% \(headband\)/.test(h.note) && !/scripted/.test(h.note), 'the history keeps alpha and theta: ' + h.note);
      await p.context().close();
      // no headband: a scripted descent
      const q = await page({ pOpt: OPT({ audio: true }), 'pLen.brain-led': '15' }, { unlock: true, speed: 30 });
      await go(q, 'practice/brain-led', 500); await q.click('#sGo');
      await atT(q, 100, 20000);
      ok(/^No headband data yet · \d+ s$/.test(await t(q, '#sSub')), 'with no headband, the rest says there\'s none yet: ' + await t(q, '#sSub'));
      await atT(q, 260, 20000);
      const s = await E(q, () => ({ src: window.__entrain.AD.src, cur: window.__entrain.AD.cur, sub: document.querySelector('#sSub').textContent, chips: document.querySelector('#sLive').textContent }));
      ok(s.src === 'script' && s.cur < 10 && s.sub === 'No headband data: a gentle scripted descent' && !/Alpha (rising|steady|falling)|Headband/.test(s.chips), 'it follows a scripted descent, and shows no headband chips: ' + s.cur + ' Hz');
      await q.click('#sEnd'); await q.click('#sEnd'); await q.waitForTimeout(500);
      const qt = await E(q, () => [...document.querySelectorAll('#sDone .sd-t')].map(b => b.querySelector('span').textContent + ':' + b.querySelector('small').textContent));
      ok(qt.some(x => x === 'Beat:Hz, scripted (no headband data)') && !qt.some(x => /^(Alpha|Theta|Brain trend):/.test(x)), 'its end screen says the beat was scripted, with no brain tiles: ' + qt.join(' · '));
      await q.context().close();
    }

    /* G. the trends in another practice; 360 px, targets, spelling */
    if (!only || only === 'G') {
      const p = await page({ 'pLen.coherence': '10' }, { unlock: true, speed: 20 });
      ok(await connect(p), 'connected');
      await go(p, 'practice/coherence', 500); await p.click('#sGo');
      await atT(p, 20, 20000);
      ok(/Headband first minute/.test(await t(p, '#sLive')), 'a practice\'s live chips start with the first minute: ' + await t(p, '#sLive'));
      await atT(p, 100, 20000);
      ok(/Alpha steady/.test(await t(p, '#sLive')) && /Theta steady/.test(await t(p, '#sLive')), 'then the trends: ' + await t(p, '#sLive'));
      await E(p, () => { window.__egAlpha = 14; });
      await atT(p, 140, 20000);
      ok(/Alpha rising/.test(await t(p, '#sLive')), 'alpha rising, live: ' + await t(p, '#sLive'));
      await E(p, () => { window.__egJaw = 40; });
      await atT(p, 175, 20000);
      ok(/Headband signal noisy/.test(await t(p, '#sLive')), 'a noisy signal says so rather than guessing: ' + await t(p, '#sLive'));
      await atT(p, 300, 20000);
      await p.setViewportSize({ width: 360, height: 740 }); await p.waitForTimeout(300);
      ok(await E(p, () => document.documentElement.scrollWidth <= document.documentElement.clientWidth), 'the running practice with the chips fits 360 px');
      await p.click('#sEnd'); await p.click('#sEnd'); await p.waitForTimeout(500);
      const D = await E(p, () => ({ tiles: [...document.querySelectorAll('#sDone .sd-t')].map(b => b.querySelector('span').textContent + ':' + b.querySelector('b').textContent).join(' · '), chart: !!document.querySelector('#sdEeg'),
        wide: document.documentElement.scrollWidth > document.documentElement.clientWidth }));
      ok(/Alpha:Rising/.test(D.tiles) && /Theta:/.test(D.tiles) && D.chart && !D.wide, 'its end screen: alpha rising, theta, the chart, within 360 px: ' + D.tiles);
      const h = await E(p, () => JSON.parse(localStorage.getItem('entrain.history')).slice(-1)[0]);
      ok(h.id === 'coherence' && h.alpha > 15 && typeof h.theta === 'number' && /\(headband\)/.test(h.note), 'and the history: ' + h.note);
      // the Heart panel at 360 px, connected
      await go(p, 'eeg', 600);
      const W = await E(p, () => {
        const h = s => document.querySelector(s).getBoundingClientRect().height;
        return { wide: document.documentElement.scrollWidth > document.documentElement.clientWidth, go: h('#egGo'), chk: h('#egCheck'), again: h('#egAgain'), sum: h('#eeg .eg-what summary'),
          text: document.querySelector('#eeg').textContent + ' ' + [...document.querySelectorAll('#egErr,#egNo')].map(e => e.textContent).join(' ') };
      });
      ok(!W.wide, 'the Heart page with the headband connected fits 360 px');
      ok(W.go >= 44 && W.chk >= 44 && W.again >= 24 && W.sum >= 24, 'its buttons are at least 44 px tall and its links 24: ' + [W.go, W.chk, W.again, W.sum].map(Math.round).join(', '));
      ok(!SPELL.test(W.text) && !VERDICT.test(W.text), 'its words are in British spelling, with no verdict on your state');
      await p.screenshot({ path: OUT + 'eegtest-g-360.png' });
      await p.context().close();
      // locked, at 360 px, unconnected
      const q = await page(null, { vp: { width: 360, height: 740 } });
      await go(q, 'eeg', 500);
      ok(await E(q, () => document.documentElement.scrollWidth <= document.documentElement.clientWidth), 'and fits 360 px locked, before connecting');
      await q.context().close();
    }
  } catch (e) { log.push('ERROR ' + (e && e.stack || e)); }
  await browser.close();
  console.log(log.join('\n'));
  console.log(log.filter(l => l.startsWith('PASS')).length + ' passed, ' + log.filter(l => /^(FAIL|PAGEERROR|ERROR|CONSOLE)/.test(l)).length + ' problems');
  process.exit(log.some(l => /^(FAIL|PAGEERROR|ERROR|CONSOLE)/.test(l)) ? 1 : 0);
})();
