// Safety that's free for everyone: the health check, I need to stop with its Settle screen, and the limits on
// intense breathwork (care.js, settle.js).
//   A  the health check: Today's offer, Settings, what's kept and backed up, hcFlags/hcCaution, and the cautions
//      it adds to the practices it affects, the Swim & dive dialog and search; never a block
//   B  I need to stop in a practice: every sound faded in half a second, the session ended into the history,
//      Settle's paced breaths (30 frames a second, no blur, still with reduced motion), the 5-4-3-2-1 grounding,
//      in reach on a scrolled phone at 360 px
//   C  I need to stop on Breathe (and in its focus view), and from search
//   D  intense breathwork: the hour's rest noted from the history, Restart and Do it again asking first, Wim Hof's
//      eight rounds a day, what the history keeps, Swim & dive's Start again, and the energising cautions' wording
//   E  free: the same on the real build (locked) and on the unlocked test copy, with no donation asked
//   F  the wording: British spelling everywhere, and Settle's words say what to do
// Run: node tests/caretest.js [group letter]
const { chromium, APP, OUT } = require('./pw');
const { testApp, unlockInit, unlocked } = require('./unlock-helper');
const mock = require('./sensor-mock');
const fs = require('fs'), path = require('path'), os = require('os');
const S20 = 'Mozilla/5.0 (Linux; Android 13; SM-G988B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Mobile Safari/537.36';
const only = process.argv[2] || '';
const t = (p, s) => p.$eval(s, e => e.textContent.replace(/\s+/g, ' ').trim()).catch(() => '(missing)');
const vis = (p, s) => p.$eval(s, e => !!(e.offsetParent || e.getClientRects().length) && getComputedStyle(e).visibility !== 'hidden').catch(() => false);
const E = (p, f, a) => p.evaluate(f, a);
const go = async (p, h, ms) => { await p.evaluate(x => location.hash = x, h); await p.waitForTimeout(ms || 350); };
const until = async (p, f, ms, a) => { try { await p.waitForFunction(f, a, { timeout: ms || 5000 }); return true; } catch (e) { return false; } };
const hist = p => E(p, () => JSON.parse(localStorage.getItem('entrain.history') || '[]'));
const OPT = o => JSON.stringify(Object.assign({ voice: false, bells: true, cues: 'tones', visual: 'circle', audio: false, voiceName: '', ana: 0, rhythm: false }, o || {}));
const SPELL = /\b(programs?|toward|synthesiz\w*|color\w*|favor\w*|behavior\w*|center(?:s|ed)?|organiz\w*|realiz\w*|recogniz\w*|minimiz\w*|optimiz\w*|personaliz\w*|prioritiz\w*|visualiz\w*|analyz\w*|gray|fiber|aging)\b/i;
const NOT = /n't\b|\b(do not|never|nothing|without|stop|avoid|none)\b|feel the breath/i;
const ALL = ['heart', 'bpHigh', 'bpLow', 'epilepsy', 'pregnant', 'panic', 'trauma', 'psychosis', 'asthma'];
const KINDS = ['fast-breath', 'hold', 'cold', 'heat', 'flicker', 'scent', 'imagery', 'body'];
const WATER = /never (do it )?in or near water, in the bath or while driving/i;
const dayStart = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d.getTime(); };
const entry = (id, ago, o) => Object.assign({ k: 'practice', id, n: id, at: Date.now() - ago, secs: 600, full: true }, o || {});

(async () => {
  const browser = await chromium.launch();
  const log = []; const ok = (c, m) => log.push((c ? 'PASS ' : 'FAIL ') + m);
  // a phone (412 × 915 unless vp says), debug on, the headphone check done; st: stored values; o.url: another copy of the
  // app; o.rm: reduced motion; o.speed: the page's clock runs faster; o.spy: count canvas frames and blurs
  const page = async (st, o) => {
    o = o || {};
    const ctx = await browser.newContext({ userAgent: S20, viewport: o.vp || { width: 412, height: 915 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true,
      reducedMotion: o.rm ? 'reduce' : 'no-preference' });
    const p = await ctx.newPage();
    p.on('pageerror', e => log.push('PAGEERROR ' + e.message));
    p.on('console', m => { if (m.type() === 'error') log.push('CONSOLE ' + m.text()); });
    if (o.unlock) await unlockInit(p);
    await p.addInitScript(s => {
      if (!sessionStorage.getItem('z.seeded')) {
        sessionStorage.setItem('z.seeded', '1');
        localStorage.setItem('entrain.debug', '1'); localStorage.setItem('entrain.stereo', 'ok');
        for (const k in s) localStorage.setItem('entrain.' + k, s[k]);
      }
      if (window.speechSynthesis) { speechSynthesis.speak = () => {}; speechSynthesis.cancel = () => {}; }
    }, Object.assign({ pOpt: OPT() }, st || {}));
    if (o.spy) await p.addInitScript(() => {
      window.__cl = {}; window.__blur = []; window.__arcs = [];
      const cr = CanvasRenderingContext2D.prototype.clearRect;
      CanvasRenderingContext2D.prototype.clearRect = function () { const k = this.canvas.id || '?'; window.__cl[k] = (window.__cl[k] || 0) + 1; return cr.apply(this, arguments); };
      const arc = CanvasRenderingContext2D.prototype.arc;
      CanvasRenderingContext2D.prototype.arc = function (x, y, r) { if (this.canvas.id === 'stlCanvas') window.__arcs.push(Math.round(r * 10) / 10); return arc.apply(this, arguments); };
      const d = Object.getOwnPropertyDescriptor(CanvasRenderingContext2D.prototype, 'shadowBlur');
      Object.defineProperty(CanvasRenderingContext2D.prototype, 'shadowBlur', { configurable: true, get: d.get, set(v) { if (v) window.__blur.push(v); d.set.call(this, v); } });
    });
    if (o.speed) await p.addInitScript(mock, { speed: o.speed });
    await p.goto(o.url || APP);
    if (o.unlock) await unlocked(p);
    await p.waitForTimeout(300);
    return p;
  };
  const settle = p => E(p, () => {
    const m = document.querySelector('#stlModal'), tx = s => document.querySelector(s).textContent.replace(/\s+/g, ' ').trim();
    return { open: !m.hidden, title: tx('#stlTitle'), cue: tx('#stlCue'), n: tx('#stlN'), text: tx('#stlModal'), focus: document.activeElement && document.activeElement.id,
      ground: tx('#stlGround'), hash: location.hash, sup: !document.querySelector('#supModal').hidden };
  });
  const ib = p => E(p, () => {
    const m = document.querySelector('#ibModal'), tx = s => document.querySelector(s).textContent.replace(/\s+/g, ' ').trim();
    return { open: !m.hidden, title: tx('#ibTitle'), txt: tx('#ibTxt'), rest: tx('#ibRest'), go: document.querySelector('#ibGo').hidden ? '' : tx('#ibGo'), focus: document.activeElement && document.activeElement.id };
  });
  const intro = p => E(p, () => {
    const q = s => document.querySelector('#sIntro ' + s), tx = e => e ? e.textContent.replace(/\s+/g, ' ').trim() : '';
    const n = q('#sIbNote');
    return { hc: tx(q('.hc-note')), note: n && !n.hidden ? tx(n) : '', ok: tx(q('.so-ok')), caution: tx(q('.si-caution')), go: tx(q('#sGo')), edit: q('.hc-edit') ? q('.hc-edit').getAttribute('href') : '' };
  });
  const tall = (p, s) => p.$eval(s, e => Math.round(e.getBoundingClientRect().height)).catch(() => 0);
  const endNow = p => E(p, () => { const b = document.querySelector('#sEnd'); b.click(); b.click(); });

  try {
    /* A. the health check */
    if (!only || only === 'A') {
      const p = await page();
      ok(await vis(p, '#tdHealth') && /^A short health check/.test(await t(p, '#tdHealth')) && await p.$eval('#tdHealthGo', a => a.getAttribute('href')) === '#st-health',
        'a new device: Today offers the health check, linked to Settings: ' + (await t(p, '#tdHealth')).slice(0, 60) + '…');
      ok(await tall(p, '#tdHealthGo') >= 44 && await tall(p, '#tdHealthLater') >= 44, 'its buttons are big enough to tap');
      ok(await E(p, () => window.__entrain.hcCaution(['fast-breath', 'hold', 'body'])) === '' && !(await E(p, () => Object.values(window.__entrain.hcFlags()).some(Boolean))),
        'unanswered, it adds nothing: hcFlags all false, hcCaution ""');
      await p.click('#tdHealthGo'); await p.waitForTimeout(400);
      const card = await E(p, () => {
        const s = document.querySelector('#st-health'), first = document.querySelector('#stBody .st-card');
        return { first: first === s, h: s.querySelector('h2').textContent, n: s.querySelectorAll('.hc-list input.sw').length, labels: [...s.querySelectorAll('.hc-list .so-l')].map(l => l.firstChild.textContent),
          st: s.querySelector('#hcSt').textContent, clear: s.querySelector('#hcClear').disabled, top: s.getBoundingClientRect().top, rows: Math.min(...[...s.querySelectorAll('.hc-list .so-row')].map(r => r.getBoundingClientRect().height)) };
      });
      ok(card.first && card.h === 'Health check' && card.n === 9 && card.labels.join(' | ') === 'A heart condition | High blood pressure | Low blood pressure, or you faint easily | Epilepsy, or seizures set off by flashing light | Pregnancy | Panic attacks | Trauma or PTSD | Psychosis or dissociation | Asthma',
        'Settings opens on it, first: nine conditions to tick: ' + card.labels.join(' | '));
      ok(card.st === 'Not answered yet.' && card.clear && card.rows >= 44, 'not answered yet, nothing to clear, each row ' + card.rows + ' px tall');
      ok(/never stops you starting anything/.test(await t(p, '#st-health .st-note')) && /one person in twelve/.test(await t(p, '#st-health .st-note')), 'it says it never stops you starting anything, and why it asks');
      await p.click('label:has(#hc-heart)'); await p.click('label:has(#hc-trauma)'); await p.waitForTimeout(150);
      let rec = await E(p, () => JSON.parse(localStorage.getItem('entrain.health')));
      ok(rec && rec.on.join() === 'heart,trauma' && Math.abs(rec.at - Date.now()) < 5000 && /^You ticked 2 items/.test(await t(p, '#hcSt')), 'ticking saves at once, on this device: ' + JSON.stringify(rec));
      const fl = await E(p, () => window.__entrain.hcFlags());
      ok(fl.heart && fl.trauma && !fl.bpHigh && Object.keys(fl).join() === 'heart,bpHigh,bpLow,epilepsy,pregnant,panic,trauma,psychosis,asthma', 'hcFlags() reads them: ' + JSON.stringify(fl));
      const keys = await E(p, () => window.__entrain.bkKeys());
      ok(keys.includes('health'), 'a backup carries it, like your settings');
      await go(p, 'home');
      ok(!(await vis(p, '#tdHealth')), 'answered, Today stops offering it');

      // the cautions it adds, kind by kind
      const c = await E(p, () => { const X = window.__entrain; return { fb: X.hcCaution(['fast-breath']), hold: X.hcCaution(['hold']), cold: X.hcCaution(['cold']), heat: X.hcCaution(['heat']),
        flick: X.hcCaution(['flicker']), scent: X.hcCaution(['scent']), img: X.hcCaution(['imagery']), body: X.hcCaution(['body']), two: X.hcCaution(['body', 'body', 'nope']) }; });
      ok(/^Fast breathing can make you dizzy or faint\. With a heart condition, leave it out unless your doctor says it's fine for you; if you go ahead, .*never in or near water, in the bath or while driving, and stop as soon as you feel dizzy/.test(c.fb),
        'fast breathing: with a heart condition, leave it out unless your doctor approves; never in water, the bath or driving; stop if dizzy');
      ok(/^A breath hold can make you black out without warning\. With a heart condition, ask your doctor/.test(c.hold) && /^Cold water sets off a shock response.*With a heart condition, ask your doctor.*never alone in open water, and never with breath holds in water\.$/.test(c.cold),
        'holds and cold: a heart condition named, with the guide\'s rules for cold (start gently, never alone in open water, never with holds in water)');
      ok(/With a heart condition, leave out saunas and very hot baths unless your doctor approves; drink water, and skip them after alcohol\./.test(c.heat) && c.flick === '' && c.scent === '',
        'heat, as the guide says; nothing for flashing light or scents, which a heart condition and trauma don\'t bear on');
      ok(/With trauma or PTSD, ask your therapist or care team/.test(c.img) && /^Close attention to the body.*With trauma or PTSD, go gently/.test(c.body) && c.two === c.body, 'imagery and the body: trauma named; a kind given twice or unknown adds nothing more');
      await E(p, ALL => localStorage.setItem('entrain.health', JSON.stringify({ at: Date.now(), on: ALL })), ALL);
      const every = await E(p, () => { const X = window.__entrain; return { fb: X.hcCaution(['fast-breath']), flick: X.hcCaution(['flicker']), scent: X.hcCaution(['scent']), hold: X.hcCaution(['hold']) }; });
      ok(/With a heart condition, high blood pressure, low blood pressure or fainting, epilepsy, pregnancy or asthma, leave it out/.test(every.fb) && /bring on the feelings of a panic attack/.test(every.fb),
        'everything ticked: each condition named once, panic with a line of its own: ' + every.fb.slice(0, 140) + '…');
      ok(/With epilepsy, Entrain keeps the light pulse off for you; the 40 Hz sound plays as usual\./.test(every.flick) && /With asthma or pregnancy, check with your doctor or midwife/.test(every.scent) && /feel like panic rising/.test(every.hold),
        'flashing light for epilepsy, scents for asthma and pregnancy, holds and panic');
      await E(p, () => localStorage.setItem('entrain.health', JSON.stringify({ at: Date.now(), on: ['heart', 'trauma'] })));

      // the practices it affects
      await go(p, 'practice/kapalabhati');
      let i = await intro(p);
      ok(/^From your health check\. Fast breathing can make you dizzy or faint\. With a heart condition/.test(i.hc) && i.edit === '#st-health' && i.ok === "I've read the cautions, and I choose to go ahead",
        'Kapalabhati: a caution written for you, a link to your answers, and the box to tick says you choose to go ahead');
      await p.click('#sOk'); await p.click('#sGo'); await p.waitForTimeout(400);
      ok(await E(p, () => window.__entrain.P.state) === 'running', 'and it still starts: a caution, never a block');
      await endNow(p); await p.waitForTimeout(300);
      await go(p, 'practice/wim-hof');
      i = await intro(p);
      ok(/Fast breathing can make you dizzy/.test(i.hc) && /A breath hold can make you black out/.test(i.hc), 'Wim Hof: fast breathing and the holds');
      await go(p, 'practice/body-scan');
      ok(/Close attention to the body.*With trauma or PTSD/.test((await intro(p)).hc), 'Body Scan: the body, for trauma');
      await go(p, 'practice/calm-reset');
      ok((await intro(p)).hc === '', 'Calm Reset: nothing added');
      await E(p, () => localStorage.setItem('entrain.pCh.morning-tonic', JSON.stringify({ breath: 'rise' })));
      await go(p, 'practice/morning-tonic');
      const m0 = (await intro(p)).hc;
      await p.click('#sOptsBtn').catch(() => {}); await p.waitForTimeout(100);
      await p.click('[data-choice="breath"] button[data-v="fire"]'); await p.waitForTimeout(250);
      const m1 = (await intro(p)).hc;
      ok(m0 === '' && /^From your health check\. Fast breathing/.test(m1), 'Morning Wake-Up: only once breath of fire is chosen, and the page changes with the choice');
      await E(p, () => localStorage.setItem('entrain.pCh.sport', JSON.stringify({ sport: 'weights', when: 'before' })));
      await go(p, 'practice/sport');
      ok(/Fast breathing/.test((await intro(p)).hc), 'Sports Performance: with its power breaths');
      await p.screenshot({ path: OUT + 'caretest-a-intro.png', fullPage: true });

      // Swim & dive's cautions
      await E(p, () => localStorage.setItem('entrain.health', JSON.stringify({ at: Date.now(), on: ['heart', 'trauma'] })));
      await go(p, 'breathe/dive', 500);
      const dv = await E(p, () => ({ open: !document.querySelector('#dvModal').hidden, items: document.querySelectorAll('#dvList li').length,
        hc: document.querySelector('#dvHc').textContent, link: !!document.querySelector('#dvHc a') }));
      ok(dv.open && dv.items === 7 && /^From your health check\. A breath hold can make you black out without warning\. With a heart condition/.test(dv.hc) && !dv.link,
        'Swim & dive\'s cautions add yours, under its seven (no link away from the dialog)');
      await p.click('#dvGo'); await p.waitForTimeout(200);
      ok(/A breath hold can make you black out/.test(await t(p, '#bDiveHc')), 'and its settings panel keeps it beside the four cautions');
      await p.screenshot({ path: OUT + 'caretest-a-dive.png' });

      // None of these, Clear, Not now
      await go(p, 'st-health', 450);
      await p.click('#hcNone'); await p.waitForTimeout(150);
      rec = await E(p, () => JSON.parse(localStorage.getItem('entrain.health')));
      ok(rec.on.length === 0 && /^Nothing ticked/.test(await t(p, '#hcSt')) && !(await p.$eval('#hc-heart', b => b.checked)), 'None of these: answered, nothing ticked, the usual cautions');
      await p.click('#hcClear'); await p.waitForTimeout(150);
      ok(await E(p, () => localStorage.getItem('entrain.health')) === null && await t(p, '#hcSt') === 'Not answered yet.', 'Clear my answers forgets them');
      await go(p, 'home');
      ok(await vis(p, '#tdHealth'), 'and Today offers it again');
      await p.click('#tdHealthLater'); await p.waitForTimeout(200);
      ok(!(await vis(p, '#tdHealth')) && await E(p, () => localStorage.getItem('entrain.hcLater')) === '1', 'Not now: Today stops offering it');
      // search, and Learn
      await p.click('#tbFind'); await p.waitForTimeout(150); await p.fill('#fdIn', 'health check'); await p.waitForTimeout(300);
      let hit = await E(p, () => [...document.querySelectorAll('.fd-it')].slice(0, 3).map(a => a.querySelector('b').textContent + ' ' + a.getAttribute('href') + (a.querySelector('.sup-tag') ? ' +sup' : '')));
      ok(hit[0] === 'Health check #st-health', 'search finds it: ' + hit.join(' · '));
      await p.keyboard.press('Escape'); await p.waitForTimeout(150);
      const learn = await E(p, () => { const n = document.querySelector('#sfNote'); return { a: !!n.querySelector('a[href="#st-health"]'), txt: n.textContent.replace(/\s+/g, ' ') }; });
      ok(learn.a && /I need to stop ends it in one tap/.test(learn.txt) && /in or near water, in the bath, standing up or while driving/.test(learn.txt) && /Wim Hof stops at eight rounds a day/.test(learn.txt),
        'the safety note names the health check, I need to stop, the bath and the rest between blocks');
      // a backup: the health check read as a record, a damaged one refused
      const DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'entrain-care-'));
      const bk = d => { const f = path.join(DIR, Math.random().toString(36).slice(2) + '.json'); fs.writeFileSync(f, JSON.stringify({ app: 'Entrain', kind: 'backup', version: 1, savedAt: new Date().toISOString(), data: d })); return f; };
      await go(p, 'settings', 400);
      await p.setInputFiles('#stLoad', bk({ history: '[]', health: JSON.stringify({ at: 1, on: ['asthma'] }) })); await p.waitForTimeout(250);
      const good = await t(p, '#stRestore');
      await p.setInputFiles('#stLoad', bk({ history: '[]', health: 'nope' })); await p.waitForTimeout(250);
      ok(!/damaged/.test(good) && /damaged/.test(await t(p, '#stRestore')), 'a backup with a health check is offered; one whose health check is damaged is refused');
      await p.context().close();
    }

    /* B. I need to stop, in a practice */
    if (!only || only === 'B') {
      const p = await page({ pOpt: OPT({ audio: true }), amb: 'rain', ambVol: '60' }, { spy: true });
      await go(p, 'practice/calm-reset');
      await p.click('#sGo');
      await until(p, () => { const X = window.__entrain; return X.A.playing && X.AMB.playing === 'rain' && X.A.master.gain.value > 0.003 && X.AMB.out && X.AMB.out.gain.value > 0.05; }, 8000);
      const before = await E(p, () => { const X = window.__entrain; return { m: X.A.master.gain.value, a: X.AMB.out ? X.AMB.out.gain.value : 0 }; });
      const out = await E(p, () => { const b = document.querySelector('#sOut'), r = b.getBoundingClientRect(); return { txt: b.textContent, h: r.height, top: r.top, inView: r.top >= 0 && r.bottom <= innerHeight }; });
      ok(out.txt === 'I need to stop' && out.h >= 44 && out.inView, 'a running practice: I need to stop, in sight and big enough to tap (' + Math.round(out.h) + ' px)');
      await E(p, () => { window.__entrain.P.t0 -= 95; }); await p.waitForTimeout(300);
      await p.click('#sOut');
      await p.waitForTimeout(620);
      const after = await E(p, () => { const X = window.__entrain; return { m: X.A.master.gain.value, a: X.AMB.out.gain.value, state: X.P.state, said: 0 }; });
      ok(before.m > 0.003 && before.a > 0.05 && after.m < 0.0005 && after.a < 0.0005, 'one tap: the beat and the rain are silent within 0.6 s (beat ' + before.m.toFixed(4) + ' → ' + after.m.toFixed(5) + ', rain ' + before.a.toFixed(3) + ' → ' + after.a.toFixed(5) + ')');
      await p.waitForTimeout(400);
      const gone = await E(p, () => { const X = window.__entrain; return { playing: X.A.playing, amb: X.AMB.playing, player: document.querySelector('#player').classList.contains('open') }; });
      ok(!gone.playing && !gone.player && after.state !== 'running' && after.state !== 'paused', 'the session has ended and the player stays away: ' + JSON.stringify(gone) + ', ' + after.state);
      const h = await hist(p);
      ok(h.length === 1 && h[0].id === 'calm-reset' && h[0].full === false && h[0].secs >= 95, 'it goes into the history as ended early: ' + JSON.stringify(h[0]));
      let s = await settle(p);
      ok(s.open && s.title === 'Settle' && s.focus === 'stlDone' && /Keep your eyes open/.test(s.text) && s.hash === '#practice/calm-reset' && !s.sup,
        'Settle opens over its page, eyes open, focus on Done: ' + s.text.slice(0, 80) + '…');
      ok(/five things you can see, four you can touch, three you can hear, two you can smell and one you can taste/.test(s.text) && /talk to your doctor or a mental-health professional/.test(s.text) && /emergency number/.test(s.text) && /5-4-3-2-1 Grounding/.test(s.ground),
        'with the 5-4-3-2-1 shortcut and a line on talking to a professional if it keeps happening');
      ok(await E(p, () => window.__entrain.appBusy()), 'an update waits while you settle');
      // the paced breaths: a second's lead, then in for 4 s and out for 6 s, five times
      const cues = [], at = dt => E(p, dt => { window.__entrain.SETTLE.t0 = performance.now() / 1000 + 1 - dt; }, dt);
      for (const dt of [0.2, 1.5, 5.5, 11.5, 49]) {
        await at(dt); await p.waitForTimeout(120);
        const x = await settle(p); cues.push(x.cue + ' / ' + x.n);
      }
      await at(4.6); await p.waitForTimeout(150);
      const turn = [(await settle(p)).cue, await until(p, () => /long, slow breath out/.test(document.querySelector('#stlCue').textContent), 3000)];
      await E(p, () => { window.__cl = {}; window.__arcs = []; }); await p.waitForTimeout(1000);
      const fr = await E(p, () => ({ n: window.__cl.stlCanvas || 0, blur: window.__blur.length, radii: new Set(window.__arcs).size }));
      ok(cues.join(' | ') === 'With the circle: in through your nose… / Five slow breaths | Breathe in… / Breath 1 of 5 | And a long, slow breath out… / Breath 1 of 5 | Breathe in… / Breath 2 of 5 | And a long, slow breath out… / Breath 5 of 5',
        'five slow breaths paced on screen, in for 4 s, out for 6 s: ' + cues.join(' | '));
      ok(turn[0] === 'Breathe in…' && turn[1], 'and the words follow the clock: in, then out at four seconds');
      ok(fr.n >= 20 && fr.n <= 32 && !fr.blur && fr.radii > 6, 'its circle draws ' + fr.n + ' frames a second, without blur, moving (' + fr.radii + ' sizes in a second)');
      await p.screenshot({ path: OUT + 'caretest-b-settle.png' });
      await E(p, () => { window.__entrain.SETTLE.t0 -= 60; }); await p.waitForTimeout(400);
      s = await settle(p);
      ok(s.cue === 'Breathe at your own pace now' && s.n === 'Five slow breaths. Well done.', 'after five: your own pace');
      await p.click('#stlDone'); await p.waitForTimeout(200);
      s = await settle(p);
      ok(!s.open && await vis(p, '#sIntro') && !(await vis(p, '#sRun')) && await E(p, () => !document.body.classList.contains('immersive')), 'Done closes it, on the practice\'s own page');
      // the shortcut: Grounding starts straight away
      await p.click('#sGo'); await p.waitForTimeout(500);
      await p.click('#sOut'); await p.waitForTimeout(300);
      await p.click('#stlGround'); await p.waitForTimeout(500);
      const g = await E(p, () => ({ id: window.__entrain.P.def.id, state: window.__entrain.P.state, hash: location.hash, open: !document.querySelector('#stlModal').hidden }));
      ok(g.id === 'grounding' && g.state === 'running' && g.hash === '#practice/grounding' && !g.open, '5-4-3-2-1 Grounding starts at once: ' + JSON.stringify(g));
      await p.keyboard.press('Escape');
      await p.click('#sOut'); await p.waitForTimeout(300);
      await p.keyboard.press('Escape'); await p.waitForTimeout(200);
      ok(!(await settle(p)).open && await E(p, () => window.__entrain.P.state) !== 'running', 'it works paused or not, and Escape closes Settle too');
      await p.context().close();

      // reduced motion: the circle stays still; a phone 360 wide, scrolled: still in reach, nothing too wide
      const q = await page({ pOpt: OPT() }, { rm: true, spy: true, vp: { width: 360, height: 740 } });
      await go(q, 'practice/calm-reset');
      await q.click('#sGo'); await q.waitForTimeout(600);
      await E(q, () => window.scrollTo(0, 400)); await q.waitForTimeout(150);
      const r = await E(q, () => { const b = document.querySelector('#sOut').getBoundingClientRect(), e = document.querySelector('#sEnd').getBoundingClientRect();
        return { y: scrollY, out: b.top >= 0 && b.bottom <= innerHeight, end: e.top >= 0, wide: document.documentElement.scrollWidth > innerWidth }; });
      ok(r.out && r.end && !r.wide, 'at 360 px, scrolled ' + r.y + ' px down, I need to stop and End stay in sight, nothing too wide');
      await q.screenshot({ path: OUT + 'caretest-b-run360.png' });
      await q.click('#sOut'); await q.waitForTimeout(400);
      await E(q, () => { window.__arcs = []; }); await q.waitForTimeout(2500);
      const still = await E(q, () => ({ radii: new Set(window.__arcs).size, n: window.__arcs.length, wide: document.documentElement.scrollWidth > innerWidth,
        card: document.querySelector('#stlModal .modal-card').getBoundingClientRect().width, done: document.querySelector('#stlDone').getBoundingClientRect().height,
        gr: document.querySelector('#stlGround').getBoundingClientRect().height, cue: document.querySelector('#stlCue').textContent }));
      ok(still.n > 0 && still.radii <= 3 && /^Breathe in…$|long, slow breath out/.test(still.cue), 'with reduced motion the circle stays still while the words still pace you (' + still.radii + ' sizes)');
      ok(!still.wide && still.card <= 360 && still.done >= 44 && still.gr >= 44, 'Settle fills a 360 px phone, its buttons ' + Math.round(still.done) + ' and ' + Math.round(still.gr) + ' px tall');
      await q.screenshot({ path: OUT + 'caretest-b-settle360.png' });
      await q.context().close();
    }

    /* C. I need to stop on Breathe, and from search */
    if (!only || only === 'C') {
      const p = await page({ breath: JSON.stringify({ pattern: 'resonance', inh: 5.5, sip: 0, hold: 0, exh: 5.5, rest: 0, visual: 'circle', minutes: 5, sound: 'tones', cue: 60, buzz: false }) });
      await go(p, 'breathe');
      ok(!(await vis(p, '#bOut')), 'Breathe at rest: no I need to stop');
      await p.click('#bStart');
      await until(p, () => { const B = window.__entrain.B; return B.state === 'running' && B.bus && B.bus.gain.value > 0.05; }, 6000);
      ok(await vis(p, '#bOut') && await t(p, '#bOut') === 'I need to stop' && await tall(p, '#bOut') >= 44, 'breathing: I need to stop is there');
      await p.click('#bStart'); await p.waitForTimeout(150);
      ok(await vis(p, '#bOut'), 'paused too');
      await p.click('#bStart'); await p.waitForTimeout(300);
      await E(p, () => { window.__entrain.B.t0 -= 70; }); await p.waitForTimeout(300);
      await p.click('#bFocus'); await p.waitForTimeout(300);
      ok(await E(p, () => document.querySelector('#bStage').classList.contains('focus')) && await vis(p, '#bOut'), 'and in the focus view');
      await p.screenshot({ path: OUT + 'caretest-c-focus.png' });
      await p.click('#bOut'); await p.waitForTimeout(620);
      const b = await E(p, () => { const X = window.__entrain; return { state: X.B.state, gain: X.B.bus.gain.value, focus: document.querySelector('#bStage').classList.contains('focus'), out: !document.querySelector('#bOut').hidden }; });
      const s = await settle(p);
      ok(b.state === 'idle' && b.gain < 0.0005 && !b.focus && !b.out && s.open && s.hash === '#breathe', 'one tap: the cues fade, the session ends, the focus view closes and Settle opens: ' + JSON.stringify(b));
      const h = await hist(p);
      ok(h.length === 1 && h[0].k === 'breath' && h[0].full === false && h[0].ib === undefined, 'the session is in the history, ended early: ' + JSON.stringify(h[0]));
      await p.click('#stlDone'); await p.waitForTimeout(150);
      // from search, over whatever page you're on
      await go(p, 'learn');
      await p.click('#tbFind'); await p.waitForTimeout(150); await p.fill('#fdIn', 'I need to stop'); await p.waitForTimeout(300);
      const hit = await E(p, () => { const a = document.querySelector('.fd-it'); return a.querySelector('b').textContent + ' ' + a.getAttribute('href'); });
      await p.click('.fd-it'); await p.waitForTimeout(400);
      const s2 = await settle(p);
      ok(hit === 'I need to stop #settle' && s2.open && s2.hash === '#learn' && await vis(p, '#v-learn'), 'search finds it, and it opens over the page you were on, which keeps its address: ' + hit + ', ' + s2.hash);
      await p.keyboard.press('Escape'); await p.waitForTimeout(150);
      for (const w of ['panic', 'overwhelmed']) {
        await p.click('#tbFind'); await p.waitForTimeout(150); await p.fill('#fdIn', w); await p.waitForTimeout(300);
        const f = await E(p, () => [...document.querySelectorAll('.fd-it')].slice(0, 4).map(a => a.getAttribute('href')));
        ok(f.includes('#settle'), '"' + w + '" finds it among the first: ' + f.join(' '));
        await p.keyboard.press('Escape'); await p.waitForTimeout(150);
      }
      await p.context().close();
    }

    /* D. intense breathwork */
    if (!only || only === 'D') {
      // a block of fast breathing ended ten minutes ago
      let p = await page({ history: JSON.stringify([entry('wim-hof', 10 * 6e4, { n: 'Wim Hof Breathing', ib: true, wh: 3 })]), 'pCh.morning-tonic': JSON.stringify({ breath: 'rise' }) });
      await go(p, 'practice/kapalabhati');
      let i = await intro(p);
      ok(/^You did Wim Hof Breathing 10 minutes ago\. Rest for an hour between blocks of fast breathing or long breath holds: back to back, they make fainting more likely\.$/.test(i.note),
        'Kapalabhati, ten minutes after Wim Hof: a note above Start: ' + i.note);
      const above = await E(p, () => { const n = document.querySelector('#sIbNote').getBoundingClientRect(), g = document.querySelector('#sGo').getBoundingClientRect(); return n.bottom <= g.top; });
      ok(above, 'just above Start');
      await go(p, 'practice/calm-reset');
      ok((await intro(p)).note === '', 'Calm Reset: no note, it isn\'t fast breathing');
      await go(p, 'practice/morning-tonic');
      const n0 = (await intro(p)).note;
      await p.click('#sOptsBtn').catch(() => {}); await p.waitForTimeout(100);
      await p.click('[data-choice="breath"] button[data-v="fire"]'); await p.waitForTimeout(250);
      const n1 = (await intro(p)).note;
      ok(n0 === '' && /^You did Wim Hof Breathing/.test(n1), 'Morning Wake-Up: the note once breath of fire is chosen');
      ok(await E(p, () => window.__entrain.ibRoundsToday()) === (Date.now() - 10 * 6e4 >= dayStart() ? 3 : 0), 'today\'s Wim Hof rounds come from the history');
      await p.context().close();

      // Swim & dive on Breathe: its row says so too, and Start again asks after a session
      p = await page({ history: JSON.stringify([entry('kapalabhati', 5 * 6e4, { n: 'Kapalabhati', ib: true })]), diveAck: '1',
        breath: JSON.stringify({ pattern: 'dive', inh: 5, sip: 2, hold: 15, exh: 10, rest: 5, long: true, visual: 'circle', minutes: 2, sound: 'off', cue: 40, buzz: false }) }, { speed: 25 });
      await go(p, 'breathe', 500);
      ok(await vis(p, '#bIbRow') && /^You did Kapalabhati 5 minutes ago\. Rest for an hour/.test(await t(p, '#bIbTxt')), 'Swim & dive on Breathe: the same note under its own: ' + await t(p, '#bIbTxt'));
      await p.click('#bStart');
      const fin = await until(p, () => window.__entrain.B.state === 'done', 20000);
      let d = await hist(p);
      ok(fin && d.some(e => e.k === 'breath' && e.id === 'dive' && e.ib === true), 'a Swim & dive session goes into the history as a block of breath holds');
      await p.click('#bStart'); await p.waitForTimeout(300);
      let q = await ib(p);
      ok(q.open && q.title === 'Rest first?' && /^You did Swim & dive just now\. Back-to-back blocks of fast breathing or long breath holds make fainting more likely: rest for an hour, breathing normally, before the next one\.$/.test(q.txt) &&
        q.rest === 'Rest first' && q.go === 'Start anyway' && q.focus === 'ibRest' && await E(p, () => window.__entrain.B.state) === 'done', 'Start again asks first: ' + q.txt);
      await p.keyboard.press('Tab'); await p.keyboard.press('Tab'); await p.keyboard.press('Tab');
      ok(await E(p, () => !!document.activeElement.closest('#ibModal')), 'Tab stays inside it');
      await p.keyboard.press('Escape'); await p.waitForTimeout(150);
      ok(!(await ib(p)).open && await E(p, () => window.__entrain.B.state) === 'done', 'Escape (or Rest first) leaves it resting');
      await p.click('#bStart'); await p.waitForTimeout(200); await p.click('#ibGo'); await p.waitForTimeout(300);
      ok(await E(p, () => window.__entrain.B.state) === 'running', 'Start anyway starts it');
      await p.context().close();

      // Restart and Do it again ask first; a session that ran fast breathing is kept as one
      p = await page();
      await go(p, 'practice/kapalabhati');
      ok((await intro(p)).note === '', 'no recent block: no note');
      await p.click('#sOk'); await p.click('#sGo'); await p.waitForTimeout(300);
      await p.click('#sqRestart'); await p.click('#sqRestart'); await p.waitForTimeout(300);
      ok(!(await ib(p)).open, 'Restart before the first pump: no question, nothing stacked yet');
      await p.click('#sNext'); await p.waitForTimeout(1200);
      await p.click('#sqRestart'); await p.click('#sqRestart'); await p.waitForTimeout(300);
      q = await ib(p);
      ok(q.open && q.title === 'Start again from the top?' && /^You're partway through Kapalabhati\. Back-to-back blocks/.test(q.txt) && q.rest === 'Carry on with this one' && q.go === 'Start again anyway' &&
        await E(p, () => window.__entrain.P.state) === 'paused', 'Restart once the pumps have begun asks first, and holds the session: ' + q.txt);
      await p.click('#ibRest'); await p.waitForTimeout(200);
      ok(!(await ib(p)).open && await E(p, () => window.__entrain.P.state) === 'running', 'Carry on with this one: it carries on');
      await endNow(p); await p.waitForTimeout(400);
      d = await hist(p);
      ok(d.length === 1 && d[0].id === 'kapalabhati' && d[0].ib === true && d[0].wh === undefined, 'the history keeps it as a block of fast breathing: ' + JSON.stringify(d[0]));
      await p.click('#sdAgain'); await p.waitForTimeout(300);
      q = await ib(p);
      ok(q.open && q.title === 'Rest first?' && /^You've just done Kapalabhati\./.test(q.txt) && q.go === 'Open it anyway', 'Do it again asks first: ' + q.txt);
      await p.click('#ibRest'); await p.waitForTimeout(200);
      ok(!(await ib(p)).open && await vis(p, '#sDone'), 'Rest first: back on the end screen');
      await p.click('#sdAgain'); await p.waitForTimeout(200); await p.click('#ibGo'); await p.waitForTimeout(300);
      i = await intro(p);
      ok(await vis(p, '#sIntro') && /^You did Kapalabhati just now\./.test(i.note), 'Open it anyway: its page, with the note above Start');
      await go(p, 'practice/calm-reset');
      await p.click('#sGo'); await p.waitForTimeout(400);
      await p.click('#sqRestart'); await p.click('#sqRestart'); await p.waitForTimeout(300);
      ok(!(await ib(p)).open && await E(p, () => window.__entrain.P.state) === 'running', 'a calm practice restarts without asking, even within the hour');
      await endNow(p); await p.waitForTimeout(300);
      await p.click('#sdAgain'); await p.waitForTimeout(300);
      ok(!(await ib(p)).open && await vis(p, '#sIntro'), 'and Do it again goes straight to its page');
      await p.context().close();

      // Wim Hof: eight rounds a day
      const today = Math.max(dayStart() + 1000, Date.now() - 3 * 36e5);
      p = await page({ history: JSON.stringify([Object.assign(entry('wim-hof', 0, { n: 'Wim Hof Breathing', ib: true, wh: 6 }), { at: today })]) });
      await go(p, 'practice/wim-hof');
      i = await intro(p);
      let pl = await E(p, () => { const X = window.__entrain; return X.pPlan(X.pDef('wim-hof'), 4).steps.filter(s => /power breaths$/.test(s.title)).length; });
      ok(/^You've done 6 of today's 8 rounds, so this session runs 2\./.test(i.note) && pl === 2, 'six rounds done today: this session runs two (' + pl + ' in the plan): ' + i.note);
      await p.click('#sOk'); await p.click('#sGo'); await p.waitForTimeout(300);
      await p.click('#sNext'); await p.waitForTimeout(400);
      await p.click('#sqRestart'); await p.click('#sqRestart'); await p.waitForTimeout(300);
      q = await ib(p);
      ok(q.open && /^Start again from the top\?/.test(q.title) && q.go === 'Start again anyway', 'a restart partway through round one asks first');
      await p.click('#ibGo'); await p.waitForTimeout(500);
      const rs = await E(p, () => ({ state: window.__entrain.P.state, idx: window.__entrain.P.idx, h: JSON.parse(localStorage.getItem('entrain.history')) }));
      const last = rs.h[rs.h.length - 1];
      ok(rs.state === 'running' && rs.idx === 0 && last.id === 'wim-hof' && last.wh === 1 && last.ib === true, 'Start again anyway: from the top, the round already begun counted: ' + JSON.stringify(last));
      pl = await E(p, () => window.__entrain.P.steps.filter(s => /power breaths$/.test(s.title)).length);
      ok(pl === 1 && await E(p, () => window.__entrain.ibRoundsToday()) === 7, 'seven done, so the new start runs one round');
      await p.click('#sNext'); await p.waitForTimeout(400);
      await p.click('#sqRestart'); await p.click('#sqRestart'); await p.waitForTimeout(300);
      q = await ib(p);
      ok(q.open && q.title === "That's today's rounds" && /^You've done 8 rounds of Wim Hof breathing today, the most Entrain runs in a day\. Rest, and come back tomorrow\.$/.test(q.txt) && q.go === '' && q.rest === 'Carry on with this one',
        'the eighth round under way: no restart, with a clear message');
      await p.click('#ibRest'); await p.waitForTimeout(200);
      ok(await E(p, () => window.__entrain.P.state) === 'running', 'and the round carries on');
      await endNow(p); await p.waitForTimeout(400);
      await go(p, 'practice'); await go(p, 'practice/wim-hof');
      i = await intro(p);
      ok(/^You've done 8 rounds of Wim Hof breathing today/.test(i.note), 'its page says the day\'s rounds are done: ' + i.note);
      await p.click('#sOk'); await p.click('#sGo'); await p.waitForTimeout(300);
      q = await ib(p);
      ok(q.open && q.rest === 'OK' && q.go === '' && await E(p, () => window.__entrain.P.state) !== 'running', 'and Start says so instead of starting');
      await p.click('#ibRest'); await p.waitForTimeout(150);
      await p.screenshot({ path: OUT + 'caretest-d-cap.png', fullPage: true });
      await p.context().close();

      // the energising practices' own cautions
      p = await page();
      const cau = await E(p, () => { const X = window.__entrain, c = id => X.pDef(id).caution; return { k: c('kapalabhati'), m: c('morning-tonic'), s: c('sport'), w: c('wim-hof') }; });
      ok(/^Skip this one if you are pregnant/.test(cau.k) && WATER.test(cau.k) && /stop if you feel dizzy/.test(cau.k), 'Kapalabhati: never in or near water, in the bath or while driving; stop if dizzy');
      ok(/^Breath of fire isn't for everyone/.test(cau.m) && WATER.test(cau.m) && /stop if you feel dizzy/.test(cau.m), 'Morning Wake-Up\'s breath of fire: the same');
      ok(/^Power breaths can make you light-headed/.test(cau.s) && WATER.test(cau.s) && /stop and go back to easy breathing if you feel dizzy/.test(cau.s), 'the power breaths before sport: the same');
      ok(/^Never do this in or near water, in a bath, while driving or standing/.test(cau.w), 'Wim Hof\'s, already strongest, is unchanged');
      await go(p, 'practice/sport');
      ok(WATER.test((await intro(p)).caution), 'and the page shows it');
      await p.context().close();
    }

    /* E. free: the real build (locked) and the unlocked test copy alike */
    if (!only || only === 'E') {
      for (const [label, url, unlock] of [['locked, the real build', APP, false], ['unlocked, the test copy', testApp(), true]]) {
        const p = await page({ pOpt: OPT() }, { url, unlock });
        const st = await E(p, () => ({ ok: window.__entrain.supOn(), state: window.__entrain.SUP.state }));
        await go(p, 'st-health', 450);
        await p.click('label:has(#hc-asthma)'); await p.waitForTimeout(150);
        await go(p, 'practice/calm-reset');
        await p.click('#sGo'); await p.waitForTimeout(400);
        await p.click('#sOut'); await p.waitForTimeout(400);
        const s = await settle(p);
        await p.click('#stlDone'); await p.waitForTimeout(150);
        await p.click('#tbFind'); await p.waitForTimeout(150); await p.fill('#fdIn', 'health'); await p.waitForTimeout(300);
        const tag = await E(p, () => { const a = [...document.querySelectorAll('.fd-it')].find(x => x.getAttribute('href') === '#st-health'); return a ? !!a.querySelector('.sup-tag') : null; });
        await p.keyboard.press('Escape');
        ok(st.ok === unlock && s.open && !s.sup && tag === false && await E(p, () => JSON.parse(localStorage.getItem('entrain.health')).on.join()) === 'asthma' &&
          await E(p, () => document.querySelector('#supModal').hidden),
          label + ': the health check and I need to stop work with no donation asked and no badge (unlocked: ' + st.ok + ')');
        await p.context().close();
      }
    }

    /* F. the wording */
    if (!only || only === 'F') {
      const p = await page({ health: JSON.stringify({ at: Date.now(), on: ALL }), history: JSON.stringify([entry('wim-hof', 2 * 6e4, { n: 'Wim Hof Breathing', ib: true, wh: 8, at: Date.now() - 2 * 6e4 })]) });
      const words = await E(p, KINDS => KINDS.map(k => window.__entrain.hcCaution([k])), KINDS);
      await go(p, 'st-health', 400);
      const st = await t(p, '#st-health');
      await go(p, 'home');
      const offer = await t(p, '#tdHealth');
      await go(p, 'practice/calm-reset');
      await p.click('#sGo'); await p.waitForTimeout(300);
      await p.click('#sOut'); await p.waitForTimeout(200);
      const lines = [];
      for (const dt of [0, 1.5, 5.5, 60]) {
        await E(p, dt => { window.__entrain.SETTLE.t0 = performance.now() / 1000 + 1 - dt; }, dt); await p.waitForTimeout(150);
        lines.push(await t(p, '#stlCue'), await t(p, '#stlN'));
      }
      const set = await t(p, '#stlModal');
      await p.click('#stlDone');
      await go(p, 'practice/wim-hof');
      const note = (await intro(p)).note;
      const dlg = await t(p, '#ibModal');
      const all = [...words, st, offer, set, note, dlg, ...lines].join(' \n ');
      const bad = all.match(SPELL);
      ok(words.every(Boolean) && !bad, 'British spelling in every caution the health check writes, Settings, Today, Settle and the rest notes' + (bad ? ': ' + bad[0] : ''));
      const guide = lines.concat([await E(p, () => document.querySelector('#stlModal .stl-lead').textContent)]);
      const neg = guide.filter(l => NOT.test(l));
      ok(!neg.length && lines.length === 8, 'Settle\'s words say what to do: ' + (neg.length ? neg.join(' | ') : lines.filter((l, k) => k % 2 === 0).join(' | ')));
      await p.context().close();
    }
  } catch (e) { log.push('ERROR ' + (e && e.stack || e)); }
  await browser.close();
  console.log(log.join('\n'));
  console.log(log.filter(l => l.startsWith('PASS')).length + ' passed, ' + log.filter(l => /^(FAIL|PAGEERROR|ERROR|CONSOLE)/.test(l)).length + ' problems');
  process.exit(log.some(l => /^(FAIL|PAGEERROR|ERROR|CONSOLE)/.test(l)) ? 1 : 0);
})();
