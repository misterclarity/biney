// Measuring with the phone alone (camera.js, motion.js): heart rate from a fingertip on the camera, the phone on your
// belly counting your breaths beside the guide, and stillness on the end screen of a practice done lying down.
//   A  the method, on made-up signals: the camera's beat finding against the true beats (each interval, RMSSD and
//      coherence at a slow breathing pace), a slow and a fast heart, red clipped at full brightness, a moving finger and
//      no finger; the belly's rate at 6 and 12 breaths a minute, a still phone, and which seconds count as moving
//   B  locked on the real build: the camera's button, Breathe's Phone on your belly and a practice's Stillness each
//      carry the cup and open the dialog naming them, with no camera asked for, no motion read and nothing kept;
//      Learn, search and Settings' list free to read
//   C  unlocked, the camera end to end (a canvas pulsing at a known rate, through the real frame reading): asked for
//      the back camera and its light; heart rate, beat-to-beat intervals and RMSSD against the true beats; the tiles,
//      the top bar, Breathe; a fingertip lifted and put back; stopped; the camera refused or missing; a Bluetooth sensor
//      taking over from it; again without the frame processor (the video's frames and the timer)
//   D  unlocked, Phone on your belly (made-up motion readings): with the guide, faster, slower, the spectrum's line,
//      the session's tally, motion access asked for in the tap and refused, a computer with no readings, off again
//   E  unlocked, Stillness: offered on practices done lying down only, kept for the practice; a session with a fidget
//      giving its share and longest stretch, the explanation and the history; no readings; I need to stop
//   F  360 px, 44 px targets, British spelling in the new words
// Run: node tests/phonetest.js [group letter]
const { chromium, APP, OUT } = require('./pw');
const { testApp, unlockInit, unlocked } = require('./unlock-helper');
const camMock = require('./camera-mock');
const motMock = require('./motion-mock');
const sensor = require('./sensor-mock');
const S20 = 'Mozilla/5.0 (Linux; Android 13; SM-G988B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Mobile Safari/537.36';
const only = process.argv[2] || '';
const t = (p, s) => p.$eval(s, e => e.textContent.replace(/\s+/g, ' ').trim()).catch(() => '(missing)');
const E = (p, f, a) => p.evaluate(f, a);
const go = async (p, h, ms) => { await p.evaluate(x => location.hash = x, h); await p.waitForTimeout(ms || 400); };
const until = async (p, f, ms, a) => { try { await p.waitForFunction(f, a, { timeout: ms || 5000, polling: 200 }); return true; } catch (e) { return false; } };
const vis = (p, s) => p.$eval(s, e => !!(e.offsetWidth || e.offsetHeight) && !e.closest('[hidden]')).catch(() => false);
const OPT = o => JSON.stringify(Object.assign({ voice: false, bells: false, cues: 'off', visual: 'circle', audio: false, voiceName: '', ana: 0, rhythm: false }, o || {}));
const SPELL = /\b(programs?|toward|synthesiz\w*|color\w*|favor\w*|behavior\w*|center(?:s|ed)?|organiz\w*|realiz\w*|recogniz\w*|minimiz\w*|optimiz\w*|personaliz\w*|prioritiz\w*|visualiz\w*|analyz\w*|gray|fiber|aging)\b/i;
const NAMES = ['Heart rate from the camera', 'Phone on your belly', 'Stillness on the end screen'];

(async () => {
  const browser = await chromium.launch();
  const log = []; const ok = (c, m) => log.push((c ? 'PASS ' : 'FAIL ') + m);
  const URL = testApp();
  // a phone with debug on; o.unlock: the test copy, unlocked; o.cam / o.mot / o.speed: the stand-ins; o.vp: the viewport; o.noProc: no frame processor
  const page = async (st, o) => {
    o = o || {};
    const ctx = await browser.newContext(o.desk ? { viewport: { width: 1280, height: 900 } } : { userAgent: S20, viewport: o.vp || { width: 412, height: 915 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    if (o.grant) await ctx.grantPermissions(['accelerometer', 'gyroscope']);
    const p = await ctx.newPage();
    p.on('pageerror', e => log.push('PAGEERROR ' + e.message));
    p.on('console', m => { if (m.type() === 'error') log.push('CONSOLE ' + m.text()); });
    if (o.unlock) await unlockInit(p);
    await p.addInitScript(s => {
      if (!sessionStorage.getItem('z.seeded')) {
        sessionStorage.setItem('z.seeded', '1');
        localStorage.setItem('entrain.debug', '1'); localStorage.setItem('entrain.stereo', 'ok'); localStorage.setItem('entrain.optsOpen', '1');
        for (const k in s) localStorage.setItem('entrain.' + k, s[k]);
      }
      if (window.speechSynthesis) { speechSynthesis.speak = () => {}; speechSynthesis.cancel = () => {}; }
    }, Object.assign({ pOpt: OPT() }, st || {}));
    if (o.noProc) await p.addInitScript(() => { delete window.MediaStreamTrackProcessor; });
    if (o.speed || o.ble) await p.addInitScript(sensor, Object.assign({ speed: o.speed || 1 }, o.ble || {}));
    if (o.cam) await p.addInitScript(camMock, o.cam);
    if (o.mot) await p.addInitScript(motMock, o.mot);
    await p.goto(o.unlock ? URL : APP);
    if (o.unlock) await unlocked(p);
    await p.waitForTimeout(300);
    return p;
  };

  try {
    /* A. the method on made-up signals, through the page's own functions */
    if (!only || only === 'A') {
      const p = await page(null, { unlock: true });
      const R = await E(p, () => {
        const X = window.__entrain;
        // pictures of a fingertip, 30 a second for secs, the pulse as the camera's stand-in draws it, the time stamps shaken by jit
        let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
        const wave = u => Math.exp(-Math.pow((u - 0.15) / 0.07, 2)) + 0.35 * Math.exp(-Math.pow((u - 0.45) / 0.1, 2));
        const synth = o => {
          const raw = [], beats = [], fs = 30; let ph = 0, shift = 0, nextShift = 0.5;
          for (let i = 0; i < o.secs * fs; i++) {
            const tt = i / fs, f = (o.bpm + (o.rsa || 0) / 2 * Math.sin(2 * Math.PI * (o.br || 6) / 60 * tt)) / 60, p0 = ph;
            ph += f / fs;
            if (Math.floor(ph) > Math.floor(p0)) beats.push(tt - (ph - Math.floor(ph)) / f + 0.15 / f);    // the darkest moment
            if (o.move && tt >= nextShift) { shift += (rnd() - 0.5) * o.move; nextShift = tt + 0.15 + rnd() * 0.6; }    // the finger shifting, every half a second or so
            const u = ph - Math.floor(ph), pul = wave(u), mv = shift;
            const r = o.clip ? 255 : 200 - (o.amp || 6) * pul + (rnd() - 0.5) * (o.noise || 0) + mv, g = (o.clip ? 110 : 34) - (o.clip ? 6 : 1.5) * pul + mv / 4;
            raw.push({ t: tt + (rnd() - 0.5) * (o.jit || 0), r: r, g: g, b: 26, red: o.off ? 0 : 1, clip: o.clip ? 1 : 0 });
          }
          return { raw, beats };
        };
        const run = s => {
          const st = { lastPeak: 0 }, out = []; let q = [];
          for (let tEnd = 4; tEnd <= s.raw[s.raw.length - 1].t; tEnd += 0.25) {
            const r = X.camStep(st, s.raw, tEnd);
            out.push(...r.beats); q.push(r.q);
          }
          return { beats: out, q: q.reduce((a, b) => a + b, 0) / q.length, last: q[q.length - 1] };
        };
        const ivs = b => b.slice(1).map((x, i) => (x - b[i]) * 1000);
        const rm = a => { let s = 0, n = 0; for (let i = 1; i < a.length; i++) { s += (a[i] - a[i - 1]) ** 2; n++; } return Math.sqrt(s / n); };
        // each counted beat against the true beat nearest it, and its interval against the true one
        const match = (got, s) => {
          const errs = [], tr = [], me = [];
          got.forEach(g => {
            let j = 0, d = Infinity;
            s.beats.forEach((x, i) => { if (Math.abs(x - g.t) < d) { d = Math.abs(x - g.t); j = i; } });
            if (j > 0 && d < 0.1) { const ti = (s.beats[j] - s.beats[j - 1]) * 1000; errs.push(Math.abs(g.rr - ti)); tr.push(ti); me.push(g.rr); }
          });
          errs.sort((a, b) => a - b);
          return { n: got.length, matched: errs.length, mae: errs.reduce((a, b) => a + b, 0) / Math.max(1, errs.length), p95: errs[Math.floor(0.95 * (errs.length - 1))] || 0, rmT: rm(tr), rmM: rm(me), hr: 60000 / (me.reduce((a, b) => a + b, 0) / Math.max(1, me.length)) };
        };
        const out = {};
        // resting at 66 a minute, swinging 12 beats a minute with the breath at 6 a minute, a little noise and stamping jitter
        let s = synth({ secs: 130, bpm: 66, rsa: 12, br: 6, noise: 1.2, jit: 0.004 }), r = run(s);
        out.rest = match(r.beats, s); out.restQ = r.q;
        const pts = r.beats.map(b => ({ t: b.t, v: b.rr })), tEnd = pts[pts.length - 1].t;
        const c = X.cohCompute(pts.filter(x => x.t >= tEnd - 67), tEnd), ct = X.cohCompute(ivs(s.beats).map((v, i) => ({ t: s.beats[i + 1], v })).filter(x => x.t >= tEnd - 67 && x.t <= tEnd), tEnd);
        out.coh = c && { cs: c.cs, f: c.f }; out.cohT = ct && { cs: ct.cs, f: ct.f };
        s = synth({ secs: 60, bpm: 46, noise: 0.8 }); out.slow = match(run(s).beats, s);
        s = synth({ secs: 60, bpm: 150, noise: 0.8 }); out.fast = match(run(s).beats, s);
        s = synth({ secs: 60, bpm: 72, clip: true, noise: 0.5 }); r = run(s); out.clip = match(r.beats, s);
        out.clipCh = X.camStep({ lastPeak: 0 }, s.raw, 30).ch;
        s = synth({ secs: 40, bpm: 70, move: 40, noise: 2 }); r = run(s); out.move = Object.assign(match(r.beats, s), { q: r.q });
        s = synth({ secs: 30, bpm: 70, off: true }); r = run(s); out.off = { n: r.beats.length, cover: X.camStep({ lastPeak: 0 }, s.raw, 20).cover };
        // the belly: a tilt at 6 and at 12 breaths a minute, ten readings a second for 45 seconds, and a phone lying still
        const belly = (bpm, tilt, sec) => { const xs = [], ys = [], zs = []; for (let i = 0; i < sec * 10; i++) { const th = tilt * Math.sin(2 * Math.PI * bpm / 60 * i / 10) * Math.PI / 180;
          xs.push(9.81 * Math.sin(th) + (rnd() - 0.5) * 0.06); ys.push(9.81 * Math.sin(0.3 * th) + (rnd() - 0.5) * 0.06); zs.push(9.81 * Math.cos(th) + (rnd() - 0.5) * 0.06); } return X.motRate(xs, ys, zs, 10); };
        const b6 = belly(6, 2.5, 45), b12 = belly(12, 1.5, 45), b0 = belly(6, 0, 45);
        out.belly = { r6: b6.rate, q6: b6.q, n6: b6.peaks.length, r12: b12.rate, q12: b12.q, q0: b0.q };
        // a second of readings: breathing alone, then with a shift in the middle, then a knock, then a turn
        const sec = (f) => Array.from({ length: 12 }, (_, i) => { const th = 2.5 * Math.sin(2 * Math.PI * 0.1 * i / 10) * Math.PI / 180; return Object.assign({ t: i / 10, x: 9.81 * Math.sin(th), y: 0, z: 9.81 * Math.cos(th), sp: 0.08, rot: 1.5 }, f ? f(i) : {}); });
        out.moving = [X.motMoving(sec()), X.motMoving(sec(i => i === 6 ? { x: 1.2 } : {})), X.motMoving(sec(i => i === 4 ? { sp: 2 } : {})), X.motMoving(sec(i => i === 8 ? { rot: 60 } : {}))];
        return out;
      });
      const f = x => Math.round(x * 10) / 10;
      ok(R.rest.matched >= 125 && R.rest.mae < 8 && R.rest.p95 < 20 && Math.abs(R.rest.hr - 66) < 1.5,
        'a resting fingertip at 66 a minute: ' + R.rest.matched + ' of the true beats counted, each interval within ' + f(R.rest.mae) + ' ms on average (95% within ' + f(R.rest.p95) + ' ms), heart rate ' + f(R.rest.hr));
      ok(Math.abs(R.rest.rmM - R.rest.rmT) / R.rest.rmT < 0.15, 'RMSSD from the counted beats ' + f(R.rest.rmM) + ' ms against the true ' + f(R.rest.rmT) + ' ms');
      ok(R.coh && R.cohT && Math.abs(R.coh.f - 0.1) < 0.01 && R.coh.cs > 1.5 && Math.abs(R.coh.cs - R.cohT.cs) / R.cohT.cs < 0.25,
        'coherence from the camera\'s beats, breathing 6 a minute: peak at ' + (R.coh && R.coh.f.toFixed(3)) + ' Hz, score ' + (R.coh && R.coh.cs.toFixed(2)) + ' against ' + (R.cohT && R.cohT.cs.toFixed(2)) + ' from the true beats');
      ok(Math.abs(R.slow.hr - 46) < 1.5 && R.slow.matched >= 35 && Math.abs(R.fast.hr - 150) < 3 && R.fast.matched >= 120,
        'a slow heart (46) and a fast one (150) read at ' + f(R.slow.hr) + ' and ' + f(R.fast.hr) + ', no beat counted twice or halved');
      ok(R.clipCh === 'g' && Math.abs(R.clip.hr - 72) < 1.5 && R.clip.matched >= 55, 'red clipped at full brightness: the pulse read from green, ' + f(R.clip.hr) + ' a minute');
      ok(R.move.q < 0.35 && R.move.n <= 15 && (R.move.n === 0 || R.move.mae < 30), 'a finger shifting about: the signal reads poor (' + R.move.q.toFixed(2) + ' on average) and ' + R.move.n + ' of about 45 beats count' + (R.move.n ? ', each within ' + R.move.mae.toFixed(1) + ' ms on average' : ''));
      ok(R.off.n === 0 && R.off.cover === false, 'no fingertip on the lens: no beats');
      ok(Math.abs(R.belly.r6 - 6) < 0.25 && R.belly.q6 === 'clear' && R.belly.n6 >= 3 && Math.abs(R.belly.r12 - 12) < 0.4 && R.belly.q0 === 'faint',
        'the belly\'s tilt: ' + f(R.belly.r6) + ' and ' + f(R.belly.r12) + ' breaths a minute (' + R.belly.q6 + ', ' + R.belly.n6 + ' breaths), and a still phone reads faint');
      ok(R.moving.join() === 'false,true,true,true', 'a second of breathing counts as still; a shift, a knock and a turn as moving: ' + R.moving.join());
      await p.context().close();
    }

    /* B. locked on the real build */
    if (!only || only === 'B') {
      const p = await page(null, { cam: { bpm: 64 }, mot: { bpm: 6 }, grant: true });
      await go(p, 'heart', 500);
      const c = await E(p, () => ({ row: !document.querySelector('#cam').hidden, txt: document.querySelector('#camOff > p').textContent, btn: document.querySelector('#camGo').textContent.trim(), cup: !!document.querySelector('#camGo .sup-tag') }));
      ok(c.row && c.cup && /^Use the phone's cameraDonation$/.test(c.btn) && /^No sensor\? Your phone's camera can read your pulse/.test(c.txt), 'Heart: Use the phone\'s camera, with the cup: ' + c.btn);
      await p.click('#camGo'); await p.waitForTimeout(300);
      ok(!(await E(p, () => document.querySelector('#supModal').hidden)) && /Heart rate from the camera/.test(await t(p, '#supModal')) && await E(p, () => window.__cam.calls) === 0 && await E(p, () => window.__entrain.H.state) === 'off',
        'tapped, it opens the dialog naming it, and no camera is asked for');
      await p.keyboard.press('Escape'); await p.waitForTimeout(200);
      await go(p, 'breathe', 400);
      await E(p, () => document.querySelector('#bBellyOpt').scrollIntoView());
      const bl = await E(p, () => ({ lab: document.querySelector('#bBellyL').textContent, cup: !!document.querySelector('#bBellyL .sup-tag'), vis: !document.querySelector('#bBellyOpt').hidden }));
      ok(bl.vis && bl.cup, 'Breathe\'s settings: Phone on your belly, with the cup: ' + bl.lab);
      await E(p, () => document.querySelector('#bBellyOn').click()); await p.waitForTimeout(300);
      ok(!(await E(p, () => document.querySelector('#supModal').hidden)) && /Phone on your belly/.test(await t(p, '#supModal')) && !(await E(p, () => document.querySelector('#bBellyOn').checked)) && !(await E(p, () => window.__entrain.MOT.on)),
        'switched on, it opens the dialog naming it, stays off and reads nothing');
      await p.keyboard.press('Escape'); await p.waitForTimeout(200);
      await go(p, 'practice/body-scan', 500);
      const so = await E(p, () => { const c = document.querySelector('#sOptStill'); return c && { lab: c.closest('.so-row').querySelector('.so-l').textContent, cup: !!c.closest('.so-row').querySelector('.sup-tag'), on: c.checked }; });
      ok(so && so.cup && !so.on && /^Stillness/.test(so.lab), 'Body Scan\'s Options: Stillness, with the cup');
      await p.click('#sOptStill'); await p.waitForTimeout(300);
      const sd = await E(p, () => ({ dlg: !document.querySelector('#supModal').hidden, on: document.querySelector('#sOptStill').checked, kept: localStorage.getItem('entrain.pOpt.body-scan') }));
      ok(sd.dlg && /Stillness on the end screen/.test(await t(p, '#supModal')) && !sd.on && !sd.kept, 'switched on, it opens the dialog naming it, stays off and keeps nothing');
      await p.keyboard.press('Escape'); await p.waitForTimeout(200);
      // a kept Stillness from an unlocked time does nothing while locked
      await E(p, () => localStorage.setItem('entrain.pOpt.body-scan', JSON.stringify({ still: true })));
      await go(p, 'practice', 200); await go(p, 'practice/body-scan', 400);
      await p.click('#sGo'); await p.waitForTimeout(800);
      ok(!(await E(p, () => window.__entrain.MOT.on)) && !(await E(p, () => window.__entrain.MOT.sr)), 'a Stillness kept from before reads nothing while the device is locked');
      await p.click('#sEnd'); await p.click('#sEnd'); await p.waitForTimeout(400);
      // free to read: Learn, search, Settings' list
      await go(p, 'l-phone', 600);
      const L = await E(p, () => { const h = document.querySelector('#l-phone'), ps = []; let e = h.nextElementSibling; while (e && e.tagName === 'P') { ps.push(e.textContent.replace(/\s+/g, ' ')); e = e.nextElementSibling; }
        const refs = [...document.querySelectorAll('#references li')].map(l => l.textContent);
        return { h: h.textContent, ps, toc: !!document.querySelector('.toc a[href="#l-phone"]'), view: !document.querySelector('#v-learn').hidden,
          refs: ['Coppetti, T.', 'Mather, J. D.', 'Plews, D. J.', 'van Dijk, W.', 'Liao, S.', 'Estrada, L.'].filter(a => refs.some(r => r.startsWith(a))).length,
          rows: [...document.querySelectorAll('#lnSignals tbody tr')].map(r => r.querySelector('td:last-child').textContent).slice(0, 3).concat([...document.querySelectorAll('#lnSignals tbody tr')][6].querySelector('td:last-child').textContent) }; });
      ok(L.view && L.h === 'Measuring with the phone alone' && L.ps.length === 3 && L.toc && L.refs === 6 &&
        ['(Coppetti et al., 2017)', '(Mather et al., 2024)', '(Plews et al., 2017)', '(van Dijk et al., 2023)', '(Liao et al., 2026)', '(Estrada et al., 2015)'].every(c => L.ps.join(' ').includes(c)) && /experimental/.test(L.ps[0]),
        'Learn: Measuring with the phone alone, three paragraphs citing six studies, each in the references, the camera marked experimental');
      ok(/the phone's camera/.test(L.rows[0]) && /the phone's camera/.test(L.rows[1]) && /the phone on your belly/.test(L.rows[2]) && /^Stillness/.test(L.rows[3]), 'what to measure: heart rate, its variability, breathing rate and stillness now say where Entrain reads them: ' + L.rows.join(' / '));
      const finds = [];
      for (const [q, want] of [['camera', 'Heart rate from the camera>#cam'], ['belly', 'Phone on your belly>#breathe'], ['stillness', 'Stillness>#l-phone']]) {
        await p.click('#tbFind'); await p.waitForTimeout(150);
        await p.fill('#fdIn', q); await p.waitForTimeout(300);
        const hit = await E(p, () => [...document.querySelectorAll('#fdRes a.fd-it')].map(a => a.querySelector('b').textContent + '>' + a.getAttribute('href') + (a.querySelector('.sup-tag') ? ' +sup' : '')));
        finds.push(hit.some(h => h === want + ' +sup') ? 'found +sup' : q + ': ' + hit.slice(0, 3).join(', '));
        await p.keyboard.press('Escape'); await p.waitForTimeout(150);
      }
      ok(finds.every(x => x === 'found +sup'), 'search finds each, with the badge: ' + finds.join(', '));
      await go(p, 'st-supporter', 450);
      const list = await E(p, () => [...document.querySelectorAll('#supList a')].map(a => a.textContent + '>' + a.getAttribute('href')));
      ok(list.includes(NAMES[0] + '>#cam') && list.includes(NAMES[1] + '>#breathe') && list.includes(NAMES[2] + '>#l-phone'), 'Settings, New techniques, lists all three');
      await go(p, 'cam', 600);
      ok(await E(p, () => !document.querySelector('#v-heart').hidden && document.querySelector('#cam').getBoundingClientRect().top < innerHeight), 'its link lands on the Heart page, at the camera');
      await p.context().close();
    }

    /* C. unlocked: the camera end to end */
    if (!only || only === 'C') {
      for (const noProc of [false, true]) {
        const w = noProc ? 'without the frame processor: ' : '';
        const p = await page(null, { unlock: true, cam: { bpm: 66, rsa: 10, br: 6, noise: 1 }, noProc });
        await go(p, 'heart', 500);
        if (!noProc) ok(await E(p, () => !document.querySelector('#camGo .sup-tag')), 'unlocked, the camera\'s button has no cup');
        await p.click('#camGo');
        await until(p, () => window.__entrain.H.state === 'on', 4000);
        const s0 = await E(p, () => ({ calls: window.__cam.calls, opt: window.__cam.opts[0], torch: window.__cam.torch.slice(), st: window.__entrain.H.state, src: window.__entrain.H.src,
          pill: document.querySelector('#hrPillTxt').textContent, title: document.querySelector('#hrTitle').textContent, conn: document.querySelector('#hrConnect').textContent, on: !document.querySelector('#camOn').hidden }));
        ok(s0.calls === 1 && s0.opt.audio === false && s0.opt.video.facingMode.ideal === 'environment' && s0.st === 'on' && s0.src === 'cam' && s0.pill === 'Camera' && s0.title === 'Your pulse from the camera' && s0.conn === 'Connect sensor' && s0.on,
          w + 'the back camera, no sound; the Heart page takes it as its sensor, and Connect sensor stays: ' + s0.pill + ' / ' + s0.title);
        await until(p, () => window.__cam.torch.length > 0, 2000);
        ok(await E(p, () => window.__cam.torch[0] === true && window.__entrain.CAM.torch === true && /^Light on/.test(document.querySelector('#camLight').textContent)), w + 'its light switched on: ' + await t(p, '#camLight'));
        await until(p, () => window.__entrain.H.beats.length >= 32 && window.__entrain.hrLive(), 45000);
        const s1 = await E(p, () => {
          const X = window.__entrain, hb = X.H.beats, tb = window.__cam.beats, errs = [], tr = [], me = [];
          for (let i = 0; i < hb.length; i++) {
            let j = 0, d = Infinity;
            tb.forEach((x, k) => { const dd = Math.abs(x + 0.15 * (tb[k + 1] ? tb[k + 1] - x : 0.9) - hb[i].t); if (dd < d) { d = dd; j = k; } });
            if (j > 0) { const ti = (tb[j] - tb[j - 1]) * 1000; errs.push(Math.abs(hb[i].rr - ti)); tr.push(ti); me.push(hb[i].rr); }
          }
          const rm = a => { let s = 0; for (let i = 1; i < a.length; i++) s += (a[i] - a[i - 1]) ** 2; return Math.sqrt(s / (a.length - 1)); };
          const now = performance.now() / 1000, r = X.rmssd(now - 60, now);
          return { n: hb.length, mae: errs.reduce((a, b) => a + b, 0) / errs.length, hr: 60000 * me.length / me.reduce((a, b) => a + b, 0), rmT: rm(tr), rmM: rm(me), rm: r && r.v, hrNow: X.H.hr,
            tile: document.querySelector('#hrNow').textContent, sub: document.querySelector('#hrNowS').textContent, rmTile: document.querySelector('#hrRmssd').textContent,
            top: document.querySelector('#tbSensorTxt').textContent, q: document.querySelector('#camQTxt').textContent, qv: +document.querySelector('#camQ').getAttribute('aria-valuenow'),
            read: document.querySelector('#camRead').textContent, empty: document.querySelector('#camEmpty').hidden, series: X.H.series.length };
        });
        ok(s1.n >= 32 && Math.abs(s1.hr - 66) < 2 && s1.mae < 15, w + s1.n + ' beats counted, heart rate ' + s1.hr.toFixed(1) + ' against 66, each interval within ' + s1.mae.toFixed(1) + ' ms of the true one on average');
        ok(Math.abs(s1.rmM - s1.rmT) / s1.rmT < 0.3 && s1.rm > 0 && /^\d+$/.test(s1.rmTile), w + 'RMSSD ' + s1.rmM.toFixed(1) + ' ms against the true ' + s1.rmT.toFixed(1) + ' ms; the tile shows ' + s1.rmTile);
        ok(/^\d+$/.test(s1.tile) && s1.sub === 'From the camera, beat to beat' && /^\d+ bpm$/.test(s1.top) && s1.q === 'Good' && s1.qv >= 65 && /^Your pulse: \d+ beats a minute\./.test(s1.read) && s1.empty,
          w + 'the tiles, the top bar and the meter: ' + s1.tile + ' bpm, ' + s1.sub + ', ' + s1.top + ', signal ' + s1.q + ', the wave drawn');
        if (!noProc) {
          const drawn = await E(p, () => { const c = document.querySelector('#camTrace'), d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let n = 0; for (let i = 3; i < d.length; i += 4) if (d[i]) n++; return n; });
          ok(drawn > 200, 'the pulse is drawn as a wave (' + drawn + ' pixels)');
        }
        await go(p, 'breathe', 600);
        ok(await E(p, () => !document.querySelector('#bHrStat').hidden && /^Reading your pulse with the phone's camera\./.test(document.querySelector('#bSensorTxt').textContent)), w + 'on Breathe, the heart rate beside the guide, and the camera named: ' + await t(p, '#bSensorTxt'));
        const n0 = await E(p, () => window.__entrain.H.beats.length);
        await p.waitForTimeout(3500);
        ok(await E(p, () => window.__entrain.H.beats.length) > n0 + 1, w + 'the beats keep coming while the Heart page is out of sight');
        await go(p, 'heart', 500);
        if (!noProc) {
          // a fingertip lifted, then put back
          await E(p, () => window.__cam.set({ cover: false })); await p.waitForTimeout(2200);
          const off = await E(p, () => ({ n: window.__entrain.H.beats.length, q: document.querySelector('#camQTxt').textContent, read: document.querySelector('#camRead').textContent }));
          await p.waitForTimeout(2000);
          const off2 = await E(p, () => window.__entrain.H.beats.length);
          ok(off.q === 'No fingertip' && /^Cover the camera on the back/.test(off.read) && off2 === off.n, 'a fingertip lifted: the meter says so, the page asks for it, and no beats count: ' + off.read);
          await E(p, () => window.__cam.set({ cover: true }));
          ok(await until(p, n => window.__entrain.H.beats.length > n + 2, 15000, off2), 'put back, the beats come again');
          await p.click('#camStop'); await p.waitForTimeout(400);
          const st = await E(p, () => ({ stopped: window.__cam.stopped, st: window.__entrain.H.state, src: window.__entrain.H.src, title: document.querySelector('#hrTitle').textContent, off: !document.querySelector('#camOff').hidden, btn: document.querySelector('#camGo').textContent.trim(), busy: window.__entrain.appBusy() }));
          ok(st.stopped === 1 && st.st === 'off' && st.src === '' && st.title === 'Pair a heart-rate sensor' && st.off && st.btn === 'Use the phone\'s camera' && !st.busy, 'Stop the camera: the camera off, the page back to no sensor');
        }
        await p.context().close();
      }
      // refused, missing
      for (const [fail, want] of [['NotAllowedError', /^The camera wasn't allowed\./], ['NotFoundError', /^No camera was found on this device\.$/], ['NotReadableError', /^The camera is busy/]]) {
        const p = await page(null, { unlock: true, cam: { fail } });
        await go(p, 'heart', 400);
        await p.click('#camGo'); await p.waitForTimeout(500);
        const r = await E(p, () => ({ err: document.querySelector('#camErr').textContent, shown: !document.querySelector('#camErr').hidden, st: window.__entrain.H.state, on: !document.querySelector('#camOn').hidden }));
        ok(r.shown && want.test(r.err) && r.st === 'off' && !r.on, fail + ': ' + r.err);
        await p.context().close();
      }
      // a Bluetooth sensor takes over from the camera
      const p = await page(null, { unlock: true, cam: { bpm: 64 }, ble: { rr: true } });
      await go(p, 'heart', 400);
      await p.click('#camGo');
      await until(p, () => window.__entrain.H.src === 'cam', 4000);
      await p.click('#hrConnect');
      await until(p, () => window.__entrain.H.state === 'on' && window.__entrain.H.src === '', 15000);
      const b = await E(p, () => ({ stopped: window.__cam.stopped, st: window.__entrain.H.state, src: window.__entrain.H.src, name: window.__entrain.H.name, cam: document.querySelector('#cam').hidden, conn: document.querySelector('#hrConnect').textContent }));
      ok(b.stopped === 1 && b.st === 'on' && b.src === '' && b.name === 'Inner Balance' && b.cam && b.conn === 'Disconnect', 'Connect sensor with the camera on: the camera stops and the sensor takes over; the camera\'s row steps aside: ' + b.name);
      await p.click('#hrConnect'); await p.waitForTimeout(400);
      ok(!(await E(p, () => document.querySelector('#cam').hidden)), 'disconnected, the camera is offered again');
      await p.context().close();
    }

    /* D. unlocked: Phone on your belly on Breathe */
    if (!only || only === 'D') {
      const p = await page(null, { unlock: true, speed: 4, mot: { bpm: 5.5 }, desk: true, grant: true });
      await go(p, 'breathe', 500);
      ok(await E(p, () => !document.querySelector('#bBellyL .sup-tag') && !document.querySelector('#bBellyOpt').hidden), 'unlocked, Phone on your belly has no cup');
      await p.click('#bBellyOn'); await p.waitForTimeout(300);
      ok(await E(p, () => document.querySelector('#bBellyOn').checked && window.__entrain.MOT.on && !document.querySelector('#bBellyRow').hidden && window.__entrain.appBusy()) &&
        /^(Lie back and rest the phone flat on your belly|Counting your breaths)/.test(await t(p, '#bBellyTxt')), 'switched on: listening, and it says how: ' + await t(p, '#bBellyTxt'));
      await p.click('#bStart');
      ok(await until(p, () => { const s = document.querySelector('#bBellyStat'); return !s.hidden && /with the guide/.test(s.textContent); }, 20000),
        'breathing with the guide at 5.5: ' + await t(p, '#bBellyStat') + ' / ' + await t(p, '#bBellyTxt'));
      ok(/^You're breathing about 5\.5 times a minute, with the guide at 5\.5: you're following it\.$/.test(await t(p, '#bBellyTxt')), 'and in words under it');
      ok(await E(p, () => { const b = window.__entrain.breathPace(); return b && b.src === 'belly' && Math.abs(b.rate - 5.5) < 0.3; }), 'the spectrum\'s breathing line takes the belly\'s pace');
      await E(p, () => window.__mot.set({ bpm: 9 }));
      ok(await until(p, () => /faster/.test(document.querySelector('#bBellyStat').textContent), 25000), 'breathing at 9 a minute: ' + await t(p, '#bBellyStat') + ' / ' + await t(p, '#bBellyTxt'));
      await E(p, () => window.__mot.set({ bpm: 3.5 }));
      ok(await until(p, () => /slower/.test(document.querySelector('#bBellyStat').textContent), 25000), 'at 3.5 a minute: ' + await t(p, '#bBellyStat'));
      await E(p, () => window.__mot.set({ fidget: true }));
      ok(await until(p, () => /Too much movement/.test(document.querySelector('#bBellyTxt').textContent) && document.querySelector('#bBellyStat').hidden, 25000), 'shifting about: ' + await t(p, '#bBellyTxt'));
      await E(p, () => window.__mot.set({ fidget: false, bpm: 5.5 }));
      await p.waitForTimeout(9000);
      await p.click('#bReset'); await p.waitForTimeout(1500);
      const last = await t(p, '#bBellyTxt');
      ok(/^Last session, on your belly: \d+ breaths counted, and with the guide for \d+% of the time it could read you\.$/.test(last), 'after the session, what it counted: ' + last);
      await p.click('#bBellyOn'); await p.waitForTimeout(300);
      ok(await E(p, () => !window.__entrain.MOT.on && document.querySelector('#bBellyRow').hidden && document.querySelector('#bBellyStat').hidden && !window.__entrain.appBusy()), 'switched off: no longer listening');
      await p.context().close();
      // asked for in the tap (as Safari on an iPhone does), and refused
      for (const answer of ['granted', 'denied']) {
        const q = await page(null, { unlock: true, speed: 4, mot: { bpm: 6, ios: true, answer }, desk: true });
        await go(q, 'breathe', 400);
        await q.click('#bBellyOn'); await q.waitForTimeout(600);
        const r = await E(q, () => ({ asked: window.__mot.asked, on: window.__entrain.MOT.on, txt: document.querySelector('#bBellyTxt').textContent }));
        ok(r.asked === 1 && (answer === 'granted' ? r.on && !/wasn't given/.test(r.txt) : !r.on && /^Motion access wasn't given/.test(r.txt)), 'motion access asked for in the tap, ' + answer + ': ' + r.txt);
        await q.context().close();
      }
      const q = await page(null, { unlock: true, mot: { none: true }, desk: true });
      await go(q, 'breathe', 400);
      await q.click('#bBellyOn');
      ok(await until(q, () => /^No motion readings are coming in/.test(document.querySelector('#bBellyTxt').textContent), 6000), 'no readings at all, as on most computers: ' + await t(q, '#bBellyTxt'));
      await q.context().close();
    }

    /* E. unlocked: Stillness in a practice done lying down */
    if (!only || only === 'E') {
      const p = await page(null, { unlock: true, speed: 20, mot: { bpm: 6 }, grant: true });
      const fits = await E(p, () => window.__entrain.PRACTICES.filter(d => window.__entrain.motStillFits(d)).map(d => d.id).join(','));
      ok(fits === 'sleep-descent,coherence,gratitude,nsdr,heart-led,brain-led,body-scan,pmr,autogenic,shuffle,dirga,power-nap,music-break,imagery,yoga-nidra,fireside',
        'Stillness is offered on the practices done lying down, and not on moving ones, the Stress Check, Wim Hof, Soothing Touch or Mindful Sex: ' + fits);
      await go(p, 'practice/anapana', 400);
      ok(!(await E(p, () => document.querySelector('#sOptStill'))), 'a practice done sitting has no Stillness row');
      await go(p, 'practice/body-scan', 500);
      await p.click('#sOptStill'); await p.waitForTimeout(200);
      ok(await E(p, () => document.querySelector('#sOptStill').checked && localStorage.getItem('entrain.pOpt.body-scan') === '{"still":true}' && /Stillness/.test(document.querySelector('#sOptsSum').textContent)),
        'switched on, it is kept for Body Scan and named in the options\' summary');
      await p.click('#sGo'); await p.waitForTimeout(2500);
      ok(await E(p, () => window.__entrain.MOT.on && !!window.__entrain.MOT.sr), 'started, the motion sensor reads');
      await E(p, () => window.__mot.set({ fidget: true })); await p.waitForTimeout(1500);
      await E(p, () => window.__mot.set({ fidget: false })); await p.waitForTimeout(7000);
      const sr = await E(p, () => Object.assign({}, window.__entrain.MOT.sr));
      await p.click('#sEnd'); await p.click('#sEnd'); await p.waitForTimeout(800);
      const tile = await E(p, () => { const b = document.querySelector('.sd-t[data-ex="still"]'); return b && [b.querySelector('span').textContent, b.querySelector('b').textContent, b.querySelector('small').textContent]; });
      // sr is read just before the end, and the clock runs at 20x: under load a few more seconds can pass, so allow a point
      const pct = Math.round(100 * sr.still / sr.secs), shown = tile ? parseInt(tile[1], 10) : NaN;
      ok(tile && tile[0] === 'Stillness' && tile[1] === shown + '%' && Math.abs(shown - pct) <= 1 && pct >= 70 && pct <= 95 && /^still, longest \d+ min( \d+ s)?$/.test(tile[2]) && sr.moves >= 1,
        'the end screen: ' + (tile || []).join(' ') + ' (' + sr.still + ' of ' + sr.secs + ' seconds still, ' + sr.moves + ' shift)');
      await p.click('.sd-t[data-ex="still"]'); await p.waitForTimeout(200);
      const ex = await t(p, '#sdEx');
      ok(/^Stillness ?How much of the session the phone lay still, resting on you or on the bed: \d+% of the \d+ min( \d+ s)? it read\. Your longest still stretch lasted .+, and you moved or shifted (once|twice|\d+ times)\./.test(ex) && /a rough measure rather than a tested one/.test(ex),
        'tapped, it explains itself: ' + ex.slice(0, 160));
      const h = await E(p, () => JSON.parse(localStorage.getItem('entrain.history')).slice(-1)[0]);
      ok(h.id === 'body-scan' && h.still === shown && /still \d+%/.test(h.note), 'the history keeps it: ' + h.note);
      ok(!(await E(p, () => window.__entrain.MOT.on)), 'and the sensor rests once the practice ends');
      // I need to stop ends it like any session, and the sensor rests
      await p.click('#sdAgain'); await p.waitForTimeout(400);
      await p.click('#sGo'); await p.waitForTimeout(1500);
      await p.click('#sOut'); await p.waitForTimeout(800);
      ok(await E(p, () => window.__entrain.P.state !== 'running' && !window.__entrain.MOT.on && !document.querySelector('#stlModal').hidden), 'I need to stop ends the session, and the sensor with it');
      await p.keyboard.press('Escape'); await p.waitForTimeout(200);
      await p.context().close();
      // no readings: the tile says so
      const q = await page({ 'pOpt.yoga-nidra': JSON.stringify({ still: true }) }, { unlock: true, speed: 30, mot: { none: true } });
      await go(q, 'practice/yoga-nidra', 500);
      await q.click('#sGo'); await q.waitForTimeout(5000);
      await q.click('#sEnd'); await q.click('#sEnd'); await q.waitForTimeout(800);
      const t2 = await E(q, () => { const b = document.querySelector('.sd-t[data-ex="still"]'); return b && b.textContent; });
      ok(t2 === 'Stillness—no motion readings', 'Yoga Nidra with no motion readings: the tile says so: ' + t2);
      await q.context().close();
    }

    /* F. a small phone, targets and spelling */
    if (!only || only === 'F') {
      const p = await page(null, { unlock: true, cam: { bpm: 70 }, mot: { bpm: 6 }, vp: { width: 360, height: 740 }, grant: true });
      const wide = [], small = [];
      await go(p, 'heart', 500);
      await p.click('#camGo'); await p.waitForTimeout(1500);
      for (const h of ['heart', 'breathe', 'practice/body-scan', 'learn']) {
        await go(p, h, 500);
        if (h === 'breathe') { await p.click('#bAdjust'); await p.waitForTimeout(300); await E(p, () => { const c = document.querySelector('#bBellyOn'); c.checked = true; c.dispatchEvent(new Event('change')); }); await p.waitForTimeout(300); }
        if (await E(p, () => document.documentElement.scrollWidth > document.documentElement.clientWidth)) wide.push(h);
        small.push(...await E(p, () => ['#camGo', '#camStop', '#sOptStill'].map(s => document.querySelector(s)).filter(e => e && e.offsetParent && e.getBoundingClientRect().height < (e.id === 'sOptStill' ? 24 : 44)).map(e => e.id)));
      }
      await go(p, 'heart', 400);
      await p.screenshot({ path: OUT + 'phonetest-f-camera.png' });
      ok(!wide.length && !small.length, 'at 360 px nothing is wider than the screen, and the camera\'s buttons are at least 44 px tall' + (wide.length ? ': too wide ' + wide.join(', ') : '') + (small.length ? ': small ' + small.join(', ') : ''));
      const words = await E(p, () => [document.querySelector('#cam'), document.querySelector('#bBellyOpt'), document.querySelector('#l-phone').nextElementSibling, document.querySelector('#l-phone').nextElementSibling.nextElementSibling,
        document.querySelector('#l-phone').nextElementSibling.nextElementSibling.nextElementSibling].map(e => e.textContent).join(' '));
      const bad = words.match(SPELL);
      ok(!bad, 'British spelling in the new words' + (bad ? ': ' + bad[0] : ''));
      await p.click('#camStop');
      await p.context().close();
    }
  } catch (e) { log.push('ERROR ' + (e && e.stack || e)); }
  await browser.close();
  console.log(log.join('\n'));
  console.log(log.filter(l => l.startsWith('PASS')).length + ' passed, ' + log.filter(l => /^(FAIL|PAGEERROR|ERROR|CONSOLE)/.test(l)).length + ' problems');
  process.exit(log.some(l => /^(FAIL|PAGEERROR|ERROR|CONSOLE)/.test(l)) ? 1 : 0);
})();
