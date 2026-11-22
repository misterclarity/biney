// Your own data, from the brain-wave guide's advice on measuring what helps you: Check in before and after, today's
// minutes and the days in a row, a daily rhythm of three spaced sessions with calendar reminders and a nudge, and a
// personal experiment in History. Locked on the real build (each asks for the donation, and a choice kept from a backup
// does nothing), then on an unlocked copy: the check-in around a practice, a breathing session and a track, the change
// against your usual, the run of days, the rhythm's slots, ticks, calendar file and nudge at a pinned time of day, and an
// experiment's ways, pairs and honest note; Learn, search and a 360 px phone.
//   A  locked: Settings' toggles, Today's line and offer, History's experiment, a kept check-in or experiment doing nothing, search
//   B  check-ins around a practice: the dialog, Escape, Skip, the end screen's after, the usual change, a restart, carrying on, the Stress Check
//   C  check-ins around a breathing session and a track: the dialog after, a short session, a practice starting over one
//   D  today's minutes and the days in a row, at a pinned time
//   E  the daily rhythm: the offer, the slots and their parts of the day, Settings, the calendar file, the nudge
//   F  a personal experiment: the setup, each way set as it starts, your options kept, the pairs, the noise, two practices, ending it
//   G  Learn, the route to the experiment, search, and a 360 px phone
// Run: node tests/owntest.js [group letter]
const fs = require('fs');
const { chromium, APP, OUT } = require('./pw');
const { testApp, unlockInit, unlocked } = require('./unlock-helper');
const S20 = 'Mozilla/5.0 (Linux; Android 13; SM-G988B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Mobile Safari/537.36';
const only = process.argv[2] || '';
const t = (p, s) => p.$eval(s, e => e.textContent.replace(/\s+/g, ' ').trim()).catch(() => '(missing)');
const E = (p, f, a) => p.evaluate(f, a);
const go = async (p, h, ms) => { await p.evaluate(x => location.hash = x, h); await p.waitForTimeout(ms || 350); };
const until = async (p, f, ms, a) => { try { await p.waitForFunction(f, a, { timeout: ms || 5000 }); return true; } catch (e) { return false; } };
const OPT = o => JSON.stringify(Object.assign({ voice: false, bells: false, cues: 'off', visual: 'circle', audio: false, voiceName: '', ana: 0, rhythm: false }, o || {}));
const SPELL = /\b(programs?|toward|synthesiz\w*|color\w*|favor\w*|behavior\w*|center(?:s|ed)?|organiz\w*|realiz\w*|recogniz\w*|minimiz\w*|optimiz\w*|personaliz\w*|prioritiz\w*|visualiz\w*|analyz\w*|gray|fiber|aging)\b/i;
const NAMES = ['Check in before and after', "Today's minutes and streak", 'Daily rhythm', 'Personal experiments'];

(async () => {
  const browser = await chromium.launch();
  const log = []; const ok = (c, m) => log.push((c ? 'PASS ' : 'FAIL ') + m);
  const UNLOCKED = testApp();
  // a phone, debug on, the headphone check done; st: stored values; o.unlock: the unlocked test copy; o.at: [hour, minute]
  // the page's clock is moved to, today; o.vp: the window
  const page = async (st, o) => {
    o = o || {};
    const ctx = await browser.newContext({ userAgent: S20, viewport: o.vp || { width: 412, height: 915 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, acceptDownloads: true });
    const p = await ctx.newPage();
    p.on('pageerror', e => log.push('PAGEERROR ' + e.message));
    p.on('console', m => { if (m.type() === 'error') log.push('CONSOLE ' + m.text()); });
    p.on('request', r => { if (!/^(file|data|blob):/.test(r.url())) log.push('FAIL a network request: ' + r.url()); });
    if (o.at) await p.addInitScript(([h, m]) => {         // the time of day, pinned: the clock runs on from there
      const R = Date, tt = new R(); tt.setHours(h, m, 0, 0);
      const off = tt.getTime() - R.now();
      function D(...a) { if (!new.target) return new R(R.now() + off).toString(); return a.length ? new R(...a) : new R(R.now() + off); }
      D.now = () => R.now() + off; D.UTC = R.UTC; D.parse = R.parse; D.prototype = R.prototype;
      window.Date = D;
    }, o.at);
    await p.addInitScript(s => {
      if (!sessionStorage.getItem('z.seeded')) {
        sessionStorage.setItem('z.seeded', '1');
        localStorage.setItem('entrain.debug', '1'); localStorage.setItem('entrain.stereo', 'ok'); localStorage.setItem('entrain.optsOpen', '1');
        for (const k in s) localStorage.setItem('entrain.' + k, s[k]);
      }
      if (window.speechSynthesis) { speechSynthesis.speak = () => {}; speechSynthesis.cancel = () => {}; }
    }, Object.assign({ pOpt: OPT(), amb: 'off' }, st || {}));
    if (o.unlock) await unlockInit(p);
    await p.goto(o.unlock ? UNLOCKED : APP);
    await p.waitForTimeout(350);
    if (o.unlock) await unlocked(p);
    return p;
  };
  // the history, replaced: each { day (0 today, -1 yesterday), h, m (when it began), secs, id, k, ... }
  const seed = (p, list) => E(p, list => {
    const X = window.__entrain, l = X.hLoad();
    l.length = 0;
    list.forEach(s => {
      const d = new Date(); d.setDate(d.getDate() + (s.day || 0)); d.setHours(s.h, s.m || 0, 0, 0);
      const e = Object.assign({ k: 'practice', id: 'calm-reset', secs: 600, full: true }, s);
      delete e.day; delete e.h; delete e.m;
      e.at = d.getTime() + e.secs * 1000;
      l.push(e);
    });
    l.sort((a, b) => a.at - b.at);
    localStorage.setItem('entrain.history', JSON.stringify(l));
  }, list);
  const last = p => E(p, () => { const l = window.__entrain.hLoad(); return l[l.length - 1] || null; });
  const modal = p => E(p, () => ({ open: !document.querySelector('#ciModal').hidden, title: document.querySelector('#ciTitle').textContent, what: document.querySelector('#ciWhat').textContent,
    go: document.querySelector('#ciGo').textContent, skip: !document.querySelector('#ciSkip').hidden, res: document.querySelector('#ciRes').hidden ? '' : document.querySelector('#ciRes').textContent,
    rows: document.querySelectorAll('#ciQs .ci-g').length, btns: document.querySelectorAll('#ciQs .ci-g button').length }));
  const sup = p => E(p, () => ({ open: !document.querySelector('#supModal').hidden, said: document.querySelector('#supFor').hidden ? '' : document.querySelector('#supFor').textContent }));
  const supClose = async p => { await E(p, () => document.querySelector('#supClose').click()); await p.waitForTimeout(200); };
  // a practice's page, freshly opened (from another page, so the address changes)
  const open = async (p, id) => { await go(p, 'home', 250); await go(p, 'practice/' + id, 450); };
  const startCalm = async p => { await open(p, 'calm-reset'); await p.click('#sGo'); await p.waitForTimeout(350); };
  const endEarly = async p => { await p.click('#sEnd'); await p.click('#sEnd'); await p.waitForTimeout(450); };

  try {
    /* A. locked on the real build: every way in asks for the donation, and a choice kept from a backup does nothing */
    if (!only || only === 'A') {
      const p = await page({});
      await go(p, 'settings', 500);
      const st = await E(p, () => ({ card: !!document.querySelector('#st-checkin'), ciCup: !!document.querySelector('#stCiL .sup-tag'), rhCup: !!document.querySelector('#stRhL .sup-tag'),
        rows: document.querySelectorAll('.rh-row').length, list: [...document.querySelectorAll('#supList a')].map(a => a.textContent + ' ' + a.getAttribute('href')) }));
      ok(st.card && st.ciCup && st.rhCup && st.rows === 0, 'Settings has Check-ins and daily rhythm, each toggle with the cup while locked, and no slots: ' + JSON.stringify(st).slice(0, 160));
      ok(NAMES.every(n => st.list.some(x => x.startsWith(n + ' '))) && st.list.some(x => x === 'Personal experiments #experiment') && st.list.some(x => x === 'Daily rhythm #st-rhythm'),
        'New techniques lists the four, each with where it is: ' + st.list.filter(x => NAMES.some(n => x.startsWith(n))).join(' | '));
      await p.click('#stCiOn'); await p.waitForTimeout(250);
      let s = await sup(p);
      ok(s.open && /^Check in before and after is one of the new techniques/.test(s.said) && !(await E(p, () => document.querySelector('#stCiOn').checked)) && await E(p, () => localStorage.getItem('entrain.checkIn')) !== '1',
        'turning on Check in before and after opens the dialog naming it, and stays off: ' + s.said);
      await supClose(p);
      await p.click('#stRhOn'); await p.waitForTimeout(250);
      s = await sup(p);
      ok(s.open && /^Daily rhythm is one/.test(s.said) && !(await E(p, () => document.querySelector('#stRhOn').checked)) && !/"on":true/.test(await E(p, () => localStorage.getItem('entrain.rhythm') || '')),
        'and the daily rhythm the same: ' + s.said);
      await supClose(p);
      await p.context().close();

      // Today and History with a few sessions: the line and the offer, each the way to unlock
      const q = await page({});
      await seed(q, [{ day: -2, h: 9 }, { day: -1, h: 9 }, { day: 0, h: 0, m: 5, secs: 300 }]);
      await go(q, 'history', 300); await go(q, 'home', 400);
      const td = await E(q, () => ({ lk: document.querySelector('#tdDay') ? document.querySelector('#tdDay').className + ' ' + document.querySelector('#tdDay').textContent : '',
        offer: !document.querySelector('#tdRhOffer').hidden, cup: !!document.querySelector('#tdRhGo .sup-tag'), card: !document.querySelector('#tdRhythm').hidden }));
      ok(/^ow-lk Today's minutes and your days in a row.*Donation/.test(td.lk) && td.offer && td.cup && !td.card, 'Today: in place of the minutes and the run, a button with the badge; the rhythm offered, with the cup: ' + JSON.stringify(td));
      await q.click('#tdDay'); await q.waitForTimeout(250);
      s = await sup(q);
      ok(s.open && /^Today's minutes and streak is one/.test(s.said), 'the button opens the dialog naming it: ' + s.said);
      await supClose(q);
      await q.click('#tdRhGo'); await q.waitForTimeout(250);
      s = await sup(q);
      ok(s.open && /^Daily rhythm/.test(s.said) && !/"on":true/.test(await E(q, () => localStorage.getItem('entrain.rhythm') || '')), 'Set it up asks for the donation, and sets nothing up: ' + s.said);
      await supClose(q);
      await q.click('#tdRhLater'); await q.waitForTimeout(300);
      ok(await E(q, () => document.querySelector('#tdRhOffer').hidden && localStorage.getItem('entrain.rhmLater') === '1'), 'Not now puts the offer away');
      await go(q, 'history', 400);
      const hi = await E(q, () => ({ day: document.querySelector('#hiDay') ? document.querySelector('#hiDay').tagName : '', xp: document.querySelector('#experiment') ? document.querySelector('#experiment').textContent.replace(/\s+/g, ' ') : '',
        form: !!document.querySelector('#xpP'), open: !!document.querySelector('#xpOpen .sup-tag') }));
      ok(hi.day === 'BUTTON' && /Personal experimentDonationDoes a practice suit you better/.test(hi.xp) && !hi.form && hi.open,
        'History: the same button for the minutes, and the experiment described with Set up an experiment and its cup, no form: ' + hi.xp.slice(0, 120));
      await q.click('#xpOpen'); await q.waitForTimeout(250);
      s = await sup(q);
      ok(s.open && /^Personal experiments is one/.test(s.said), 'which asks for the donation: ' + s.said);
      await supClose(q);
      // search finds all four, with the badge
      await q.click('#tbFind'); await q.waitForTimeout(200);
      const found = [];
      for (const [w, h] of [['check in', '#st-checkin'], ['streak', '#history'], ['reminders calendar', '#st-rhythm'], ['experiment', '#experiment']]) {
        await q.fill('#fdIn', w); await q.waitForTimeout(300);
        found.push(await E(q, h => { const a = document.querySelector('.fd-it[href="' + h + '"]'); return a ? a.querySelector('b').textContent + (a.querySelector('.sup-tag') ? ' +cup' : '') : '(none)'; }, h));
      }
      ok(found.every(f => /\+cup$/.test(f)), 'search finds each, with the badge: ' + found.join(' | '));
      await q.keyboard.press('Escape');
      await q.context().close();

      // kept from a backup, on a locked device: no check-in, no experiment, no rhythm
      const r = await page({ checkIn: '1', rhythm: JSON.stringify({ on: true, slots: {} }), xp: JSON.stringify({ id: 1, p: 'calm-reset', f: 'beat', q: '', seq: 'ABBAABBAAB' }) });
      await go(r, 'home', 400);
      const kept = await E(r, () => ({ card: document.querySelector('#tdRhythm').hidden ? '' : document.querySelector('#tdRhythmBody').textContent, rows: document.querySelectorAll('.rh-slot').length }));
      ok(/one of the new techniques.*Unlock it/.test(kept.card) && kept.rows === 0, 'a rhythm kept on from a backup shows only the way to unlock it: ' + kept.card);
      await open(r, 'calm-reset');
      ok(await E(r, () => document.querySelector('#sXpNote').hidden), 'a kept experiment says nothing on the practice page');
      await r.click('#sGo'); await r.waitForTimeout(400);
      const run = await E(r, () => ({ st: window.__entrain.P.state, ci: !document.querySelector('#ciModal').hidden, xp: window.__entrain.P.xp, audio: window.__entrain.P.opt.audio }));
      ok(run.st === 'running' && !run.ci && !run.xp && run.audio === false, 'Start starts at once: no check-in, and the experiment leaves its options alone: ' + JSON.stringify(run));
      await r.context().close();
    }

    /* B. check-ins around a practice, unlocked */
    if (!only || only === 'B') {
      const p = await page({}, { unlock: true });
      await go(p, 'settings', 500);
      await p.click('#stCiOn'); await p.waitForTimeout(200);
      ok(await E(p, () => localStorage.getItem('entrain.checkIn') === '1' && document.querySelector('#stCiOn').checked && !document.querySelector('#stCiL .sup-tag')), 'unlocked, Check in before and after turns on, with no cup');
      // Escape: nothing starts
      await startCalm(p);
      let m = await modal(p);
      ok(m.open && m.title === 'Check in' && /^Before Calm Reset: how are you right now\?/.test(m.what) && m.go === 'Start' && m.skip && m.rows === 2 && m.btns === 22,
        'Start opens the check-in: mood and stress, 0 to 10 each, Start and Skip: ' + m.what);
      const foc = await E(p, () => document.activeElement && document.activeElement.id);
      for (let i = 0; i < 30; i++) await p.keyboard.press('Tab');
      ok(foc === 'ciGo' && await E(p, () => !!document.activeElement.closest('#ciModal')), 'it takes focus, and Tab stays inside it');
      await p.keyboard.press('Escape'); await p.waitForTimeout(250);
      ok(await E(p, () => document.querySelector('#ciModal').hidden && window.__entrain.P.state !== 'running'), 'Escape closes it, and nothing starts');
      // Skip: it starts, with no check-in, and ends with none
      await p.click('#sGo'); await p.waitForTimeout(300);
      await p.click('#ciSkip'); await p.waitForTimeout(400);
      ok(await E(p, () => window.__entrain.P.state === 'running' && window.__entrain.P.ci === null), 'Skip starts it with no check-in');
      await E(p, () => { window.__entrain.P.t0 -= 100; }); await p.waitForTimeout(250);
      await endEarly(p);
      let e = await last(p);
      ok(!(await p.$('#sdCi')) && e && e.mood0 === undefined, 'and its end screen asks nothing after');
      // rated: the before goes into the history, the end screen asks again
      await startCalm(p);
      await p.click('#ciQs [data-ci="m"] button[data-v="3"]'); await p.click('#ciQs [data-ci="m"] button[data-v="3"]');   // a second tap takes it back
      const un = await E(p, () => window.__entrain.CI.m);
      await p.click('#ciQs [data-ci="m"] button[data-v="4"]'); await p.click('#ciQs [data-ci="s"] button[data-v="7"]');
      const pressed = await E(p, () => [...document.querySelectorAll('#ciQs button[aria-pressed="true"]')].map(b => b.closest('.ci-g').dataset.ci + b.dataset.v).join(','));
      await p.click('#ciGo'); await p.waitForTimeout(400);
      ok(un === null && pressed === 'm4,s7' && await E(p, () => JSON.stringify([window.__entrain.P.state, window.__entrain.P.ci.m, window.__entrain.P.ci.s])) === '["running",4,7]',
        'a tap picks a number (a second tap on it takes it back), and Start begins with mood 4, stress 7: ' + pressed);
      // a restart keeps it
      await E(p, () => window.__entrain.P.t0 -= 30);
      await E(p, () => { const b = document.querySelector('#sqRestart'); b.click(); b.click(); }); await p.waitForTimeout(400);
      ok(await E(p, () => !document.querySelector('#ciModal').hidden) === false && await E(p, () => window.__entrain.P.ci && window.__entrain.P.ci.m === 4), 'Restart asks nothing and keeps the check-in');
      await E(p, () => { window.__entrain.P.t0 -= 200; }); await p.waitForTimeout(250);
      await endEarly(p);
      const card = await E(p, () => { const c = document.querySelector('#sdCi'); return c ? c.textContent.replace(/\s+/g, ' ') : ''; });
      ok(/^How do you feel now\?\s?Before: mood 4, stress 7\. The same two again/.test(card), 'the end screen asks how you feel now, with your before: ' + card.slice(0, 90));
      await p.click('#sdCi [data-ci="m"] button[data-v="6"]'); await p.waitForTimeout(150);
      e = await last(p);
      ok(e.mood0 === 4 && e.str0 === 7 && e.mood1 === 6 && e.str1 === undefined, 'each tap is kept in the history at once: ' + JSON.stringify([e.mood0, e.str0, e.mood1, e.str1]));
      await p.click('#sdCi [data-ci="s"] button[data-v="3"]'); await p.waitForTimeout(150);
      let res = await t(p, '#sdCiRes');
      e = await last(p);
      ok(e.str1 === 3 && /^Your mood 4 → 6 \(\+2\), stress 7 → 3 \(−4\)\.\s?Your first check-in with Calm Reset\. .*partly what you expected to feel/.test(res), 'the change, as your first with it: ' + res);
      await go(p, 'history', 400);
      const row = await E(p, () => document.querySelector('#hiBody .hi-e .hi-b span').textContent);
      const ci = await t(p, '#checkins');
      ok(/mood 4 → 6 · stress 7 → 3/.test(row) && /^Your check-ins\s?1 check-in · mood usually \+2 · stress usually −4/.test(ci), 'History shows it on the row, and in Your check-ins: ' + row + ' / ' + ci.slice(0, 70));
      // against your usual: three earlier check-ins with Calm Reset
      await seed(p, [{ day: -3, h: 9, mood0: 4, mood1: 5, str0: 6, str1: 4 }, { day: -2, h: 9, mood0: 4, mood1: 5, str0: 6, str1: 4 }, { day: -1, h: 9, mood0: 3, mood1: 6, str0: 7, str1: 5 },
        { day: -1, h: 18, id: 'body-scan', mood0: 5, mood1: 8, str0: 5, str1: 2 }, { day: -1, h: 19, id: 'body-scan', mood0: 5, mood1: 7, str0: 5, str1: 3 }]);
      await startCalm(p);
      await p.click('#ciQs [data-ci="m"] button[data-v="2"]'); await p.click('#ciQs [data-ci="s"] button[data-v="8"]'); await p.click('#ciGo'); await p.waitForTimeout(350);
      await E(p, () => { window.__entrain.P.t0 -= 200; }); await p.waitForTimeout(250);
      await endEarly(p);
      await p.click('#sdCi [data-ci="m"] button[data-v="6"]'); await p.click('#sdCi [data-ci="s"] button[data-v="7"]'); await p.waitForTimeout(150);
      res = await t(p, '#sdCiRes');
      ok(/^Your mood 2 → 6 \(\+4\), stress 8 → 7 \(−1\)\.\s?Usually with Calm Reset: mood \+1, stress −2, the middle of your last 3 check-ins\. This time your mood lifted more than usual, and your stress eased less than usual\./.test(res),
        'against your usual with the same practice, the middle of your last three: ' + res);
      await go(p, 'history', 400);
      const list = await E(p, () => [...document.querySelectorAll('#checkins .ci-list li')].map(li => li.textContent.replace(/\s+/g, ' ')));
      ok(list.length === 2 && /^Body Scan.*mood \+2\.5 · stress −2\.5 · 2 times$/.test(list[0]) && /^Calm Reset.*mood \+2 · stress −2 · 4 times$/.test(list[1]),
        'Your check-ins lists each practice checked in with twice or more, most lift first: ' + list.join(' | '));
      // carrying on from an end screen starts from the after given there; the Stress Check asks its own
      await E(p, () => { window.__entrain.CI.carry = { m: 6, s: 3, at: Date.now() }; });
      await open(p, 'calm-reset');
      await E(p, () => { window.__entrain.P.chainGo = true; });
      await p.click('#sGo'); await p.waitForTimeout(400);
      ok(await E(p, () => document.querySelector('#ciModal').hidden && window.__entrain.P.state === 'running' && window.__entrain.P.ci.m === 6 && window.__entrain.P.ci.s === 3),
        'carrying on from an end screen asks nothing, and starts from the after given there');
      await endEarly(p);
      await open(p, 'stress-check');
      await p.click('#sGo'); await p.waitForTimeout(400);
      ok(await E(p, () => document.querySelector('#ciModal').hidden && window.__entrain.P.state === 'running'), 'the Stress Check, which asks its own, starts with no check-in');
      await endEarly(p);
      await p.context().close();
    }

    /* C. check-ins around a breathing session and a track */
    if (!only || only === 'C') {
      const p = await page({ checkIn: '1' }, { unlock: true });
      await go(p, 'breathe', 500);
      await p.click('#bStart'); await p.waitForTimeout(300);
      let m = await modal(p);
      ok(m.open && /^Before Resonance 5\.5: how are you/.test(m.what), 'Breathe\'s Start opens the check-in: ' + m.what);
      await p.click('#ciQs [data-ci="m"] button[data-v="5"]'); await p.click('#ciQs [data-ci="s"] button[data-v="6"]'); await p.click('#ciGo'); await p.waitForTimeout(400);
      ok(await E(p, () => window.__entrain.B.state === 'running' && window.__entrain.CI.pend.breath.m === 5), 'and Start begins the session');
      await E(p, () => { window.__entrain.B.t0 -= 130; }); await p.waitForTimeout(300);
      await p.click('#bReset');
      await until(p, () => !document.querySelector('#ciModal').hidden, 3000);
      m = await modal(p);
      ok(m.open && m.title === 'How do you feel now?' && /^Resonance 5\.5 has ended\./.test(m.what) && m.go === 'Save', 'a moment after it ends, the dialog asks again: ' + m.what);
      await p.click('#ciQs [data-ci="m"] button[data-v="7"]'); await p.click('#ciQs [data-ci="s"] button[data-v="3"]'); await p.click('#ciGo'); await p.waitForTimeout(250);
      m = await modal(p);
      let e = await last(p);
      ok(e.k === 'breath' && e.mood0 === 5 && e.str0 === 6 && e.mood1 === 7 && e.str1 === 3 && /^Your mood 5 → 7 \(\+2\), stress 6 → 3 \(−3\)\./.test(m.res) && m.go === 'Close' && !m.skip,
        'Save keeps it and shows the change, with Close: ' + m.res.slice(0, 60));
      await p.click('#ciGo'); await p.waitForTimeout(250);
      ok(await E(p, () => document.querySelector('#ciModal').hidden), 'Close closes it');
      // a session under a minute isn't kept, and asks nothing after
      await p.click('#bStart'); await p.waitForTimeout(250);
      await p.click('#ciQs [data-ci="m"] button[data-v="5"]'); await p.click('#ciGo'); await p.waitForTimeout(400);
      await p.click('#bReset'); await p.waitForTimeout(900);
      ok(await E(p, () => document.querySelector('#ciModal').hidden && window.__entrain.CI.pend.breath === null && window.__entrain.hLoad().length === 1), 'a session under a minute asks nothing after, and its check-in goes');
      // a practice starting over a breathing session: the session is kept with its before, and nothing pops up over the practice
      await p.click('#bStart'); await p.waitForTimeout(250);
      await p.click('#ciQs [data-ci="m"] button[data-v="4"]'); await p.click('#ciGo'); await p.waitForTimeout(400);
      await E(p, () => { window.__entrain.B.t0 -= 130; }); await p.waitForTimeout(250);
      await startCalm(p);
      await p.click('#ciSkip'); await p.waitForTimeout(1000);
      const over = await E(p, () => ({ ci: !document.querySelector('#ciModal').hidden, st: window.__entrain.P.state, br: window.__entrain.hLoad().filter(e => e.k === 'breath').map(e => [e.mood0, e.mood1]) }));
      ok(!over.ci && over.st === 'running' && JSON.stringify(over.br[1]) === '[4,null]', 'a practice starting over a breathing session: it keeps the before, and no dialog comes over the practice: ' + JSON.stringify(over));
      await endEarly(p);
      // a track
      await go(p, 'track/alpha-stress', 450);
      await p.click('#trGo'); await p.waitForTimeout(300);
      m = await modal(p);
      ok(m.open && /^Before Alpha Stress Relief:/.test(m.what), 'a track\'s Play opens the check-in: ' + m.what);
      await p.click('#ciQs [data-ci="s"] button[data-v="8"]'); await p.click('#ciGo'); await p.waitForTimeout(500);
      ok(await E(p, () => window.__entrain.A.playing && window.__entrain.CI.pend.track.track === window.__entrain.A.track), 'and Start plays it, with the check-in its own');
      await E(p, () => { window.__entrain.A.startedAt -= 125; });
      await p.click('#stop');
      await until(p, () => !document.querySelector('#ciModal').hidden, 3000);
      m = await modal(p);
      ok(m.open && /^Alpha Stress Relief has ended/.test(m.what), 'stopping it asks again: ' + m.what);
      await p.click('#ciQs [data-ci="s"] button[data-v="4"]'); await p.click('#ciGo'); await p.waitForTimeout(250);
      e = await last(p);
      m = await modal(p);
      ok(e.k === 'track' && e.id === 'alpha-stress' && e.str0 === 8 && e.str1 === 4 && e.mood0 === undefined && /^Your stress 8 → 4 \(−4\)\./.test(m.res), 'the track\'s entry keeps both: ' + m.res.slice(0, 50));
      await p.click('#ciGo');
      // the after can be skipped, and Skip keeps nothing
      await go(p, 'track/alpha-stress', 400);
      await p.click('#trGo'); await p.waitForTimeout(300);
      await p.click('#ciQs [data-ci="m"] button[data-v="5"]'); await p.click('#ciGo'); await p.waitForTimeout(400);
      await E(p, () => { window.__entrain.A.startedAt -= 125; });
      await p.click('#stop');
      await until(p, () => !document.querySelector('#ciModal').hidden, 3000);
      await p.click('#ciSkip'); await p.waitForTimeout(200);
      e = await last(p);
      ok(await E(p, () => document.querySelector('#ciModal').hidden) && e.mood0 === 5 && e.mood1 === undefined, 'Skip after closes it, keeping the before only');
      await go(p, 'history', 400);
      ok(/mood 5 before/.test(await t(p, '#hiBody .hi-e')), 'which History shows as the before: ' + (await t(p, '#hiBody .hi-e')).slice(0, 80));
      await p.context().close();
    }

    /* D. today's minutes and the days in a row, at a pinned time of day */
    if (!only || only === 'D') {
      const p = await page({}, { unlock: true, at: [15, 0] });
      await seed(p, [{ day: -2, h: 9 }, { day: -1, h: 9 }, { day: 0, h: 8, secs: 300 }, { day: 0, h: 12, secs: 600 }, { day: -20, h: 9 }]);
      let d = await E(p, () => window.__entrain.owDays());
      ok(d.today === 900 && d.run === 3 && d.live && d.d30 === 4, 'three days running, today with 15 minutes, 4 of the last 30 days: ' + JSON.stringify(d));
      await go(p, 'history', 300); await go(p, 'home', 400);
      ok((await t(p, '#tdDay')) === '15 min today · 3 days in a row · 4 of the last 30 days' && !(await p.$('#tdDay .ow-n')), 'on Today: ' + await t(p, '#tdDay'));
      await go(p, 'history', 400);
      ok((await t(p, '#hiDay')) === '15 min today · 3 days in a row · 4 of the last 30 days', 'and on History: ' + await t(p, '#hiDay'));
      await seed(p, [{ day: -3, h: 9 }, { day: -2, h: 9 }, { day: -1, h: 22 }]);
      await go(p, 'home', 400);
      ok((await t(p, '#tdDay .ow-l')) === '0 min today · 3 days in a row up to yesterday · 3 of the last 30 days' && (await t(p, '#tdDay .ow-n')) === 'Today is still open: a session of a minute or more adds to the run.',
        'nothing yet today: the run up to yesterday, and today still open: ' + await t(p, '#tdDay'));
      await seed(p, [{ day: -4, h: 9 }, { day: -2, h: 9 }]);
      await go(p, 'history', 400);
      ok((await t(p, '#hiDay .ow-l')) === '0 min today · 2 of the last 30 days' && (await t(p, '#hiDay .ow-n')) === "A missed day isn't a setback: what counts is how often you practise over the weeks.",
        'after a day off, no run, and a gentle word: ' + await t(p, '#hiDay'));
      await p.context().close();
    }

    /* E. the daily rhythm, at a pinned time of day */
    if (!only || only === 'E') {
      const p = await page({}, { unlock: true, at: [13, 30] });
      await seed(p, [{ day: -1, h: 9 }, { day: -1, h: 21 }]);
      await go(p, 'history', 300); await go(p, 'home', 400);
      ok(await E(p, () => document.querySelector('#tdRhOffer').hidden && document.querySelector('#tdRhythm').hidden), 'with two sessions, no offer yet');
      await seed(p, [{ day: -1, h: 9 }, { day: -1, h: 21 }, { day: 0, h: 2, m: 30, secs: 300, id: 'body-scan' }, { day: 0, h: 8, secs: 600 }]);
      await go(p, 'history', 300); await go(p, 'home', 400);
      ok(await E(p, () => !document.querySelector('#tdRhOffer').hidden && !document.querySelector('#tdRhGo .sup-tag')), 'with three, Today offers it, with no cup once unlocked');
      await p.click('#tdRhGo'); await p.waitForTimeout(400);
      const card = await E(p, () => ({ offer: !document.querySelector('#tdRhOffer').hidden, on: JSON.parse(localStorage.getItem('entrain.rhythm')).on,
        slots: [...document.querySelectorAll('.rh-slot')].map(li => li.className.replace('rh-slot', '').trim() + ': ' + li.querySelector('.rh-b').textContent.replace(/\s+/g, ' ') + (li.querySelector('a') ? ' → ' + li.querySelector('a').getAttribute('href') : '')),
        n: document.querySelector('#tdRhN').textContent }));
      ok(!card.offer && card.on && card.slots.length === 3 && /^done: Morning energyDone at .*08.00.*: Calm Reset$/.test(card.slots[0]) && /^now: Midday reset Now13:00 · Calm Reset → #practice\/calm-reset$/.test(card.slots[1]) &&
        /^: Evening wind-down20:30 · Body Scan → #practice\/body-scan$/.test(card.slots[2]) && card.n === '1 of 3 today.',
        'Set it up: three slots, the morning ticked by the session at 8, midday now, the 2:30 a.m. session counted as last night\'s: ' + card.slots.join(' | ') + ' · ' + card.n);
      const w = await E(p, () => window.__entrain.rhmWins(window.__entrain.rhmGet()).map(x => [x.from, x.to]));
      ok(JSON.stringify(w) === '[[0,375],[375,765],[765,1440]]', 'each slot owns its part of the day, from halfway after the slot before (minutes after 4 a.m.): ' + JSON.stringify(w));
      // the nudge, once, a moment after the app opens at 13:30 with nothing done at midday
      const q = await page({ rhythm: await E(p, () => localStorage.getItem('entrain.rhythm')), history: await E(p, () => localStorage.getItem('entrain.history')) }, { unlock: true, at: [13, 30] });
      const nudged = await until(q, () => !document.querySelector('#toast').hidden && /^Time for your midday reset: Calm Reset\./.test(document.querySelector('#toastTxt').textContent), 8000);
      ok(nudged && (await t(q, '#toastAct')) === 'Open', 'opened at 13:30 with nothing done at midday, a nudge: ' + await t(q, '#toastTxt'));
      ok(await E(q, () => window.__entrain.rhmNudge()) === '', 'once a day for each slot');
      await q.click('#toastAct'); await q.waitForTimeout(400);
      ok((await t(q, '#viewTitle')) === 'Calm Reset', 'Open goes to its practice');
      await q.click('#sGo'); await q.waitForTimeout(300);
      ok(await E(q, () => { localStorage.removeItem('entrain.rhmNudged'); return window.__entrain.rhmNudge(); }) === '', 'and none while a practice runs');
      await q.context().close();
      const late = await page({ rhythm: await E(p, () => localStorage.getItem('entrain.rhythm')) }, { unlock: true, at: [15, 30] });
      ok(await E(late, () => window.__entrain.rhmNudge()) === '', 'none more than two hours after its time');
      await late.context().close();
      // Settings: each slot's time and practice
      await go(p, 'st-rhythm', 600);
      const rows = await E(p, () => [...document.querySelectorAll('.rh-row')].map(r => r.querySelector('.rh-n').textContent + ' ' + r.querySelector('input').value + ' ' + r.querySelector('select').value));
      ok(rows.join(' | ') === 'Morning energy 07:30 morning-tonic | Midday reset 13:00 calm-reset | Evening wind-down 20:30 body-scan' && await E(p, () => document.querySelector('#stRhOn').checked),
        'Settings shows each slot\'s time and practice: ' + rows.join(' | '));
      await p.fill('#rhT-midday', '12:15'); await E(p, () => document.querySelector('#rhT-midday').dispatchEvent(new Event('change')));
      await p.selectOption('#rhK-midday', 'b:sigh'); await p.waitForTimeout(150);
      const kept = await E(p, () => JSON.parse(localStorage.getItem('entrain.rhythm')).slots.midday);
      ok(kept.time === '12:15' && kept.key === 'b:sigh', 'a new time and a breathing pattern are kept: ' + JSON.stringify(kept));
      await go(p, 'home', 400);
      ok(/^now: Midday reset Now12:15 · Cyclic sigh → #breathe\/sigh$/.test(await E(p, () => { const li = document.querySelectorAll('.rh-slot')[1]; return li.className.replace('rh-slot', '').trim() + ': ' + li.querySelector('.rh-b').textContent.replace(/\s+/g, ' ') + ' → ' + li.querySelector('a').getAttribute('href'); })),
        'and Today follows');
      // the calendar file
      const [dl] = await Promise.all([p.waitForEvent('download', { timeout: 5000 }), p.click('#tdRhIcs')]);
      const ics = fs.readFileSync(await dl.path(), 'utf8');
      const lines = ics.split('\r\n'), un = ics.replace(/\r\n /g, '');
      const day = await E(p, () => { const d = new Date(), z = n => (n < 10 ? '0' : '') + n; return d.getFullYear() + z(d.getMonth() + 1) + z(d.getDate()); });
      ok(dl.suggestedFilename() === 'entrain-daily-rhythm.ics' && /^BEGIN:VCALENDAR\r\nVERSION:2\.0\r\nPRODID:/.test(ics) && /END:VCALENDAR\r\n$/.test(ics) && !/[^\r]\n/.test(ics),
        'Calendar reminders saves entrain-daily-rhythm.ics, a calendar with CRLF line ends: ' + dl.suggestedFilename());
      const ev = un.split('BEGIN:VEVENT').slice(1);
      ok(ev.length === 3 && ev.every(x => /RRULE:FREQ=DAILY\r\n/.test(x) && /BEGIN:VALARM\r\nACTION:DISPLAY\r\nDESCRIPTION:[^\r]+\r\nTRIGGER:PT0M\r\nEND:VALARM/.test(x) && /^\r\nUID:entrain-rhythm-\w+@/.test(x)),
        'three events, each repeating daily with an alert at its time');
      ok(un.includes('DTSTART:' + day + 'T073000\r\n') && un.includes('DTSTART:' + day + 'T121500\r\n') && un.includes('DTSTART:' + day + 'T203000\r\n') && !/DTSTART:\d+T\d+Z/.test(un),
        'at your local times, floating (no time zone): 07:30, 12:15, 20:30');
      ok(un.includes('SUMMARY:Morning energy: Morning Wake-Up\r\n') && un.includes('SUMMARY:Midday reset: Cyclic sigh\r\n') && /URL:file:[^\r]+#practice\/body-scan\r\n/.test(un) && /DESCRIPTION:Your daily rhythm in Entrain: Body Scan\\, about \d+ minutes\. Open it here: /.test(un),
        'each named, with a link back to its practice and commas escaped');
      ok(lines.every(l => Buffer.byteLength(l) <= 75) && lines.some(l => l.startsWith(' ')), 'long lines folded at 75 bytes');
      ok(/^Saved entrain-daily-rhythm\.ics\. Open it to add the three daily reminders/.test(await t(p, '#toastTxt')), 'and it says what to do with it');
      // turned off in Settings
      await go(p, 'settings', 500);
      await p.click('#stRhOn'); await p.waitForTimeout(250);
      await go(p, 'home', 400);
      ok(await E(p, () => document.querySelector('#tdRhythm').hidden && document.querySelector('#tdRhOffer').hidden && document.querySelectorAll('.rh-row').length === 0), 'turned off, Today shows neither the rhythm nor the offer');
      await p.context().close();
    }

    /* F. a personal experiment */
    if (!only || only === 'F') {
      const p = await page({ checkIn: '1' }, { unlock: true });
      await go(p, 'history', 400);
      const f = await E(p, () => ({ p: document.querySelector('#xpP').value, f: [...document.querySelectorAll('#xpF option')].map(o => o.value).join(','), q: !!document.querySelector('#xpQ'),
        groups: [...document.querySelectorAll('#xpP optgroup')].map(g => g.label).join(','), sc: [...document.querySelectorAll('#xpP option')].some(o => o.value === 'stress-check') }));
      ok(f.p === 'calm-reset' && f.f === 'beat,music,scene,other' && !f.q && f.groups === 'Sleep,Calm,Focus,Energy,Recover,Reflect' && !f.sc,
        'the setup: a practice (the Stress Check left out), and what to compare for it: ' + JSON.stringify(f));
      await p.selectOption('#xpF', 'other'); await p.waitForTimeout(200);
      ok(await E(p, () => !!document.querySelector('#xpQ') && document.querySelector('#xpQ').value === 'coherence' && ![...document.querySelectorAll('#xpQ option')].some(o => o.value === 'calm-reset') && document.activeElement.id === 'xpF'),
        'Against another practice adds a second choice, without the first in it');
      await p.selectOption('#xpF', 'beat'); await p.waitForTimeout(200);
      await p.click('#xpGo'); await p.waitForTimeout(300);
      let x = await E(p, () => window.__entrain.xpGet());
      ok(x && x.p === 'calm-reset' && x.f === 'beat' && /^(AB|BA){5}$/.test(x.seq), 'Start the experiment keeps it, with five shuffled pairs: ' + (x && x.seq));
      const nx = await E(p, () => window.__entrain.xpNext(window.__entrain.xpGet()));
      const way = nx === 'A' ? 'with its beat' : 'without its beat';
      ok((await t(p, '#experiment .xp-what')) === 'Calm Reset: with its beat, or without its beat 0 of 10 sessions.' && (await t(p, '#experiment .xp-next')).startsWith('Next: ' + way + '. Entrain sets it as you start Calm Reset.'),
        'History says which comes next: ' + await t(p, '#experiment .xp-next'));
      await open(p, 'calm-reset');
      ok((await t(p, '#sXpNote')) === 'Your personal experiment, session 1 of 10: this time ' + way + '. Entrain sets it as you start; end it early and it counts next time instead.', 'its page says so above Start: ' + await t(p, '#sXpNote'));
      await p.click('#sGo'); await p.waitForTimeout(300);
      await p.click('#ciSkip'); await p.waitForTimeout(500);
      const r1 = await E(p, () => ({ v: window.__entrain.P.xp.v, audio: window.__entrain.P.opt.audio, on: window.__entrain.P.audioOn }));
      ok(r1.v === nx && r1.audio === (nx === 'A') && r1.on === (nx === 'A'), 'Start sets that way: ' + JSON.stringify(r1));
      await E(p, () => document.querySelector('#sqVoice').click()); await p.waitForTimeout(100);
      const own = await E(p, () => JSON.parse(localStorage.getItem('entrain.pOpt.calm-reset') || '{}'));
      ok(own.voice === true && !('audio' in own), 'an option changed while it runs is kept as yours, and the experiment\'s beat isn\'t: ' + JSON.stringify(own));
      await E(p, () => { window.__entrain.P.t0 -= 200; }); await p.waitForTimeout(250);
      await endEarly(p);
      ok(await E(p, (nx) => window.__entrain.xpNext(window.__entrain.xpGet()) === nx && window.__entrain.hLoad().slice(-1)[0].xv === nx, nx), 'a session ended early is tagged but doesn\'t count: the same way comes next');
      await open(p, 'calm-reset');
      await p.click('#sGo'); await p.waitForTimeout(300);
      await p.click('#ciSkip'); await p.waitForTimeout(300);
      await E(p, () => { window.__entrain.P.t0 -= window.__entrain.P.total + 1; });
      await until(p, () => window.__entrain.P.state === 'done', 3000);
      let e = await last(p);
      ok(e.xid === x.id && e.xv === nx && e.full === true, 'a whole session counts: ' + JSON.stringify([e.xv, e.full]));
      // after it, a change on its page is yours as you make it
      await open(p, 'calm-reset');
      await p.click('#sOptBeat button[data-v="theta"]'); await p.waitForTimeout(150);
      const mine = await E(p, () => JSON.parse(localStorage.getItem('entrain.pOpt.calm-reset') || '{}'));
      ok(mine.audio === true, 'after the session, turning its beat on in Options is kept as you chose it: ' + JSON.stringify(mine));
      await p.click('#sOptBeat button[data-v="off"]'); await p.waitForTimeout(150);
      await go(p, 'history', 400);
      ok((await t(p, '#experiment .xp-what')).endsWith('1 of 10 sessions.') && /No heart readings in these sessions yet/.test(await t(p, '#experiment')), 'History counts it, and says where heart readings would come from');
      // ten sessions with known numbers: the pairs and the noise
      const S = [];
      const A = [[-6, 2, 4], [-5, 2, 5], [-7, 1, 4], [-4, 3, 3], [-6, 2, 4]], B = [[-2, 1, 4], [-3, 2, 3], [-1, 2, 5], [-2, 1, 4], [-3, 2, 3]];
      for (let i = 0; i < 5; i++) {
        S.push({ day: -10 + 2 * i, h: 9, xid: x.id, xv: 'A', hr0: 70, hr1: 70 + A[i][0], mood0: 5, mood1: 5 + A[i][1], str0: 6, str1: 6 - A[i][2] });
        S.push({ day: -9 + 2 * i, h: 9, xid: x.id, xv: 'B', hr0: 70, hr1: 70 + B[i][0], mood0: 5, mood1: 5 + B[i][1], str0: 6, str1: 6 - B[i][2] });
      }
      await seed(p, S);
      const st = await E(p, () => window.__entrain.xpStats(window.__entrain.xpGet()));
      const hr = st.rows[0], md = st.rows[2];
      ok(st.done && st.nA === 5 && st.nB === 5 && hr.a === -6 && hr.b === -2 && hr.pairs === 5 && Math.abs(hr.mean + 3.4) < 1e-9 && hr.same === 5 && hr.clear && md.pairs === 5 && Math.abs(md.mean - 0.4) < 1e-9 && !md.clear && st.rows[1].pairs === 0,
        'the stats: the middle of each way, the mean of the paired differences, how many pairs agree, and whether it stands out from the noise: ' + JSON.stringify(st.rows.map(r => [r.k, r.a, r.b, r.pairs, r.mean, r.same, r.clear])));
      await go(p, 'home', 200); await go(p, 'history', 400);
      const sec = await E(p, () => ({ what: document.querySelector('#experiment .xp-what').textContent, tbl: [...document.querySelectorAll('#experiment .xp-tbl tr')].map(r => [...r.children].map(c => c.textContent.replace(/\s+/g, ' ').trim()).join(' | ')),
        say: [...document.querySelectorAll('#experiment .xp-say li')].map(l => l.textContent), honest: document.querySelector('#experiment .xp-honest').textContent.replace(/\s+/g, ' '),
        next: !!document.querySelector('#experiment .xp-next'), btn: document.querySelector('#xpNew') && document.querySelector('#xpNew').textContent }));
      ok(sec.what === 'Calm Reset: with its beat, or without its beat Done: 10 sessions.' && !sec.next && sec.btn === 'Start another', 'ten sessions, five each way: done, with Start another: ' + sec.what);
      ok(sec.tbl[0] === ' | A: with its beat | B: without its beat' && sec.tbl[1] === 'Heart rate, start to end | −6 5× | −2 5×' && sec.tbl[2] === 'Coherence | — | —' && sec.tbl[3] === 'Mood, before to after | +2 5× | +2 5×',
        'a table of the middle of each way: ' + sec.tbl.slice(0, 4).join(' / '));
      ok(sec.say[0] === 'With its beat, its heart-rate change came out 3.4 beats a minute lower on average, pair by pair, the same way in 5 of 5 pairs. That\'s bigger than the usual difference from one session to the next.' &&
        sec.say[1] === 'With its beat, its mood change came out 0.4 points higher on average, pair by pair, the same way in 2 of 5 pairs. That\'s within the noise between sessions.',
        'pair by pair, in words, with what stands out and what is noise: ' + sec.say.join(' / '));
      ok(/^Read it as a hint for you, not a verdict\. Ten sessions is a small test\. Sleep, coffee, the time of day.*you know which way you're doing it, so what you expect plays a part.*expectation and placebo/.test(sec.honest),
        'and the honest note: ' + sec.honest.slice(0, 90));
      await open(p, 'calm-reset');
      ok(await E(p, () => document.querySelector('#sXpNote').hidden), 'done, its page says nothing more');
      await p.click('#sGo'); await p.waitForTimeout(300); await p.click('#ciSkip'); await p.waitForTimeout(300);
      ok(await E(p, () => window.__entrain.P.xp === null), 'and a session after it isn\'t part of it');
      await endEarly(p);
      // two practices
      await go(p, 'history', 400);
      await p.click('#xpNew'); await p.waitForTimeout(250);
      await p.selectOption('#xpF', 'other'); await p.waitForTimeout(150);
      await p.click('#xpGo'); await p.waitForTimeout(300);
      x = await E(p, () => window.__entrain.xpGet());
      ok(x.f === 'other' && x.q === 'coherence', 'Start another: Calm Reset against Heart Coherence');
      await open(p, 'coherence');
      ok(/^Your personal experiment, against Calm Reset: this one counts as Heart Coherence's session 1 of 5\.$/.test(await t(p, '#sXpNote')), 'the other practice\'s page: ' + await t(p, '#sXpNote'));
      await p.click('#sGo'); await p.waitForTimeout(300); await p.click('#ciSkip'); await p.waitForTimeout(300);
      ok(await E(p, () => window.__entrain.P.xp && window.__entrain.P.xp.v === 'B' && window.__entrain.P.opt.audio === false), 'it counts as B, and changes none of its options');
      await endEarly(p);
      // ending it early: two taps, and its results stay
      await go(p, 'history', 400);
      await p.click('#xpEnd'); await p.waitForTimeout(100);
      ok((await t(p, '#xpEnd')) === 'Tap again to end it' && !(await E(p, () => window.__entrain.xpGet().end)), 'End the experiment asks for a second tap');
      await p.click('#xpEnd'); await p.waitForTimeout(300);
      ok(await E(p, () => !!window.__entrain.xpGet().end) && /^Calm Reset or Heart Coherence Ended after 0 sessions\.$/.test(await t(p, '#experiment .xp-what')) && !!(await p.$('#xpNew')), 'then ends it, keeping what it has: ' + await t(p, '#experiment .xp-what'));
      await p.context().close();
    }

    /* G. Learn, the route to the experiment, search, and a 360 px phone */
    if (!only || only === 'G') {
      const p = await page({ checkIn: '1' }, { unlock: true, at: [13, 30] });
      await go(p, 'learn', 500);
      const L = await E(p, () => {
        const tx = id => { const e = document.getElementById(id); return e ? e.textContent.replace(/\s+/g, ' ').trim() : ''; }, hrefs = id => [...document.querySelectorAll('#' + id + ' a')].map(a => a.getAttribute('href'));
        const row = [...document.querySelectorAll('#lnSignals tr')].find(r => /How you feel/.test(r.textContent));
        return { ci: tx('l-checkin'), rh: tx('l-rhythm'), xp: tx('l-experiment'), cih: hrefs('l-checkin'), rhh: hrefs('l-rhythm'), xph: hrefs('l-experiment'), row: row ? [...row.querySelectorAll('a')].map(a => a.getAttribute('href')) : [] };
      });
      ok(/^Check-ins\. Most stress studies take what people say they feel as their main measure/.test(L.ci) && /supported by research on expectation/.test(L.ci) && L.cih.includes('#st-checkin') && L.cih.includes('#l-expect'),
        'Learn explains check-ins, as the guide rates them: ' + L.ci.slice(0, 80));
      ok(/^A daily rhythm\. The guide suggests two or three spaced sessions a day/.test(L.rh) && /rates it moderate/.test(L.rh) && /\(Cearns & Clark, 2023\)/.test(L.rh) && L.rhh.includes('#st-rhythm'),
        'the daily rhythm and the run of days, with the app study behind them: ' + L.rh.slice(0, 80));
      ok(/^Personal experiments\./.test(L.xp) && /expectation plays a part/.test(L.xp) && L.xph.includes('#experiment') && L.row.includes('#st-checkin'),
        'personal experiments, with their limits, and the How you feel row links to check-ins');
      ok(![L.ci, L.rh, L.xp].some(x => SPELL.test(x)), 'in British spelling');
      await go(p, 'experiment', 700);
      ok(await E(p, () => !document.querySelector('#v-history').hidden && !!document.querySelector('#experiment') && document.querySelector('#experiment').getBoundingClientRect().top < innerHeight),
        '#experiment opens History at the experiment');
      // a 360 px phone: Today with the rhythm, History with check-ins and an experiment, Settings, the end screen and the dialog
      await E(p, () => localStorage.setItem('entrain.rhythm', JSON.stringify({ on: true, slots: {} })));
      await seed(p, [{ day: -2, h: 9, mood0: 3, mood1: 6, str0: 7, str1: 3 }, { day: -1, h: 9, mood0: 4, mood1: 6, str0: 6, str1: 3 }, { day: 0, h: 8, secs: 600, mood0: 4, mood1: 7, str0: 6, str1: 2 }]);
      await E(p, () => localStorage.setItem('entrain.xp', JSON.stringify({ id: 5, p: 'calm-reset', f: 'music', q: '', seq: 'ABABABABAB' })));
      await p.setViewportSize({ width: 360, height: 740 });
      const wide = [];
      for (const h of ['home', 'history', 'settings']) {
        await go(p, h, 500);
        const w = await E(p, () => document.documentElement.scrollWidth - document.documentElement.clientWidth);
        if (w > 0) wide.push(h + ' +' + w);
        await p.screenshot({ path: OUT + 'owntest-g-' + h + '.png', fullPage: true });
      }
      await startCalm(p);
      const dlg = await E(p, () => {
        const c = document.querySelector('#ciModal .modal-card'), b = [...document.querySelectorAll('#ciQs button')].map(x => x.getBoundingClientRect());
        return { over: c.scrollWidth - c.clientWidth, h: Math.min(...b.map(r => r.height)), w: Math.min(...b.map(r => r.width)), go: document.querySelector('#ciGo').getBoundingClientRect().height };
      });
      await p.screenshot({ path: OUT + 'owntest-g-dialog.png' });
      ok(dlg.over <= 0 && dlg.h >= 44 && dlg.w >= 40 && dlg.go >= 44, 'the check-in fits a 360 px phone, every number at least 44 px tall: ' + JSON.stringify(dlg));
      await p.click('#ciQs [data-ci="m"] button[data-v="4"]'); await p.click('#ciGo'); await p.waitForTimeout(300);
      await E(p, () => { window.__entrain.P.t0 -= 200; }); await p.waitForTimeout(250);
      await endEarly(p);
      const end = await E(p, () => ({ w: document.documentElement.scrollWidth - document.documentElement.clientWidth, h: Math.min(...[...document.querySelectorAll('#sdCi button')].map(b => b.getBoundingClientRect().height)) }));
      await p.screenshot({ path: OUT + 'owntest-g-end.png', fullPage: true });
      if (end.w > 0) wide.push('end screen +' + end.w);
      ok(!wide.length && end.h >= 44, 'nothing wider than 360 px on Today, History, Settings or the end screen, whose numbers are 44 px tall' + (wide.length ? ': ' + wide.join(', ') : ''));
      await go(p, 'home', 400);
      const taps = await E(p, () => [...document.querySelectorAll('.rh-go, #tdRhIcs')].map(b => Math.round(b.getBoundingClientRect().height)));
      ok(taps.length >= 2 && taps.every(h => h >= 44), 'the rhythm\'s buttons are at least 44 px tall: ' + taps.join(', '));
      await p.context().close();
    }
  } catch (e) { log.push('ERROR ' + (e && e.stack || e)); }
  await browser.close();
  console.log(log.join('\n'));
  console.log(log.filter(l => l.startsWith('PASS')).length + ' passed, ' + log.filter(l => /^(FAIL|PAGEERROR|ERROR|CONSOLE)/.test(l)).length + ' problems');
  process.exit(log.some(l => /^(FAIL|PAGEERROR|ERROR|CONSOLE)/.test(l)) ? 1 : 0);
})();
