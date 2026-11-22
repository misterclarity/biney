// Air, scent, chewing gum and blood oxygen (air.js), with a stand-in Aranet4 CO2 monitor and a stand-in fingertip
// oximeter (tests/air-mock.js) answering in their own Bluetooth formats.
//   A  the method, through the page's own functions: the Aranet4's readings decoded (detailed, plain, none yet), the
//      oximeter's 16-bit floats and its continuous and spot-check measurements with their status fields, what a reading
//      is worth (good, weak, no finger, demonstration, none), which pages get which tips, and the tips' and the scents
//      line's wording
//   B  locked on the real build: the Heart page's two boxes readable, their buttons with the cup opening the dialog by
//      name with no Bluetooth asked for, a typed reading not kept; Settings' Air the room with the cup, staying off; the
//      free tips on focus, sleep and Wim Hof's pages with the safety line and its link; Settings' list; search
//   C  unlocked: Air the room on the focus pages (practices, a track, the primer), not elsewhere; It's aired; a typed
//      reading (high, then fresh enough), what's refused, a reading over two hours old, the choice turned off; the tips
//      turned off; the reading left out of backups
//   D  an Aranet4 end to end: what the chooser is asked for, the reading with temperature and humidity, the next one
//      when the monitor has it, the focus page following; old firmware, the plain readings, no reading yet, pairing
//      refused, the chooser closed, another device, a monitor that stops answering, disconnecting; an iPhone
//   E  an oximeter: connecting, the reading and pulse, no finger, demonstration data, a weak signal; a Wim Hof hold left
//      alone at 98%, ended at 87% with Breathe now (the recovery hold too), the practice paused, the chip, the end screen's
//      tile and explanation and the history; Breathe's Swim & dive ended, a pattern with no holds left running; spot-check
//      oximeters, another kind, the chooser closed, a dropped link coming back
//   F  Learn, the routines and the safety note: the section and its citations, the glance and measure tables, the
//      Scents line and the oximeter in Breath holds, the day routine's Air the room and the evening's lavender, all free
//   G  a 360 px phone: nothing wider than the screen, 44 px buttons, 24 px links, British spelling in the new words
// Run: node tests/airtest.js [group letter]
const fs = require('fs'), path = require('path');
const { chromium, APP, OUT, ROOT } = require('./pw');
const { testApp, unlockInit, unlocked } = require('./unlock-helper');
const airMock = require('./air-mock');
const S20 = 'Mozilla/5.0 (Linux; Android 13; SM-G988B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Mobile Safari/537.36';
const IPH = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1';
const only = process.argv[2] || '';
const t = (p, s) => p.$eval(s, e => e.textContent.replace(/\s+/g, ' ').trim()).catch(() => '(missing)');
const E = (p, f, a) => p.evaluate(f, a);
const go = async (p, h, ms) => { await p.evaluate(x => location.hash = x, h); await p.waitForTimeout(ms || 400); };
const until = async (p, f, ms, a) => { try { await p.waitForFunction(f, a, { timeout: ms || 5000, polling: 100 }); return true; } catch (e) { return false; } };
const vis = (p, s) => p.$eval(s, e => !!(e.offsetWidth || e.offsetHeight) && !e.closest('[hidden]')).catch(() => false);
const OPT = o => JSON.stringify(Object.assign({ voice: false, bells: false, cues: 'off', visual: 'circle', audio: false, voiceName: '', ana: 0, rhythm: false }, o || {}));
const SPELL = /\b(programs?|toward|synthesiz\w*|color\w*|favor\w*|behavior\w*|center(?:s|ed)?|organiz\w*|realiz\w*|recogniz\w*|minimiz\w*|optimiz\w*|personaliz\w*|prioritiz\w*|visualiz\w*|analyz\w*|gray|fiber|aging|hemoglobin)\b/i;
const AQ = 'Room air from a CO₂ monitor', OX = 'Blood oxygen from an oximeter', PROMPT = 'Air the room before focus sessions';
const slot = p => E(p, () => { const s = [...document.querySelectorAll('.view:not([hidden]) .aq-slot')]; return s.map(x => x.textContent.replace(/\s+/g, ' ').trim()).join(' || '); });

(async () => {
  const browser = await chromium.launch();
  const log = []; const ok = (c, m) => log.push((c ? 'PASS ' : 'FAIL ') + m);
  const URL = testApp();
  // a phone with debug on; o.unlock: the test copy, unlocked; o.mock: the stand-ins' options; o.noBt: no Bluetooth (an iPhone);
  // o.scale: the connection deadlines and the monitor's interval shortened
  const page = async (st, o) => {
    o = o || {};
    const ctx = await browser.newContext({ userAgent: o.ua || S20, viewport: o.vp || { width: 412, height: 915 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
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
      if (sc) window.__aqScale = sc;
    }, [Object.assign({ pOpt: OPT() }, st || {}), o.scale || 0]);
    if (o.noBt) await p.addInitScript(() => { Object.defineProperty(navigator, 'bluetooth', { configurable: true, value: undefined }); });
    else await p.addInitScript(airMock, o.mock || {});
    await p.goto(o.unlock ? URL : APP);
    if (o.unlock) await unlocked(p);
    await p.waitForTimeout(300);
    return p;
  };
  const typeIn = async (p, v) => { await go(p, 'air', 400); await p.fill('#aqIn', String(v)); await p.click('#aqSave'); await p.waitForTimeout(250); };
  const aqOn = async p => { await go(p, 'air', 400); await p.click('#aqGo'); return until(p, () => window.__entrain.AQ.state === 'on', 6000); };
  const oxOn = async p => { await go(p, 'ox', 400); await p.click('#oxGo'); return until(p, () => window.__entrain.OX.state === 'on' && window.__entrain.OX.v !== null, 6000); };

  try {
    /* A. the method, through the page's own functions */
    if (!only || only === 'A') {
      const p = await page();
      const R = await E(p, () => {
        const X = window.__entrain, dv = n => new DataView(new ArrayBuffer(n));
        const det = dv(13); det.setUint16(0, 1250, true); det.setUint16(2, 450, true); det.setUint16(4, 10123, true); det.setUint8(6, 45); det.setUint8(7, 87); det.setUint8(8, 2); det.setUint16(9, 300, true); det.setUint16(11, 40, true);
        const plain = dv(9); plain.setUint16(0, 640, true); plain.setUint16(2, 401, true); plain.setUint8(6, 51); plain.setUint8(7, 60); plain.setUint8(8, 1);
        const none = dv(13); none.setUint16(0, 0x8000, true);
        // a continuous measurement with everything: fast and slow, status, device status (a poor signal), pulse amplitude 2.5 (exponent -1: 0xF019)
        const full = dv(21); full.setUint8(0, 31); full.setUint16(1, 97, true); full.setUint16(3, 61, true); full.setUint16(5, 96, true); full.setUint16(7, 60, true); full.setUint16(9, 95, true); full.setUint16(11, 59, true);
        full.setUint16(13, 1 << 7, true); full.setUint16(15, 1 << 4, true); full.setUint8(17, 0); full.setUint16(18, 0xF019, true);
        // a spot-check with a time stamp and its status
        const s = dv(14); s.setUint8(0, 1 | 2); s.setUint16(1, 99, true); s.setUint16(3, 70, true); s.setUint16(12, 1 << 13, true);
        const q = (spo2, ms, dss) => X.oxQ({ spo2, pr: 60, ms: ms || 0, dss: dss || 0, pi: null });
        return {
          det: X.aqParse(det), plain: X.aqParse(plain), none: X.aqParse(none).ppm, short: X.aqParse(dv(5)),
          sf: [X.oxSf(98), X.oxSf(0x07ff), X.oxSf(0x0800), X.oxSf(0xF3D4), X.oxSf(0x2001), X.oxSf(0x0FFF)],
          cont: X.oxParse(full, true), spot: X.oxParse(s, false),
          q: [q(97), q(97, 1 << 14), q(97, 0, 1 << 5), q(97, 0, 1 << 11), q(97, 0, 1 << 15), q(97, 1 << 10), q(97, 1 << 13), q(null), q(127), q(0)].join(' '),
          kinds: ['focus-primer', 'creative', 'anapana', 'sleep-descent', 'body-scan', 'wim-hof', 'calm-reset', 'kapalabhati'].map(id => { const d = X.pDef(id); return id + ':' + X.aqPracKinds(d, X.pPlan(d, d.min || (d.lengths || [0])[0])).join('+'); }).join(' '),
          tips: X.AQ_TIPS, safe: X.SAFE_SCENT
        };
      });
      ok(R.det.ppm === 1250 && R.det.temp === 22.5 && R.det.hpa === 1012.3 && R.det.rh === 45 && R.det.batt === 87 && R.det.status === 2 && R.det.interval === 300 && R.det.ago === 40,
        'an Aranet4 reading decoded as Aranet4-Python reads it: 1250 ppm, 22.5 °C, 1012.3 hPa, 45%, battery 87%, amber, every 300 s, 40 s ago: ' + JSON.stringify(R.det));
      ok(R.plain.ppm === 640 && R.plain.temp === 20.1 && R.plain.rh === 51 && R.plain.interval === undefined && R.none === null && R.short === null,
        'the plain form has no timing; no CO₂ yet reads as none, and a short packet as nothing: ' + JSON.stringify(R.plain));
      ok(R.sf[0] === 98 && R.sf[1] === null && R.sf[2] === null && Math.abs(R.sf[3] - 98) < 1e-9 && R.sf[4] === 100 && R.sf[5] === -1,
        'the oximeter\'s 16-bit floats: 98, not a number, not at this resolution, 980 × 10⁻¹, 1 × 10², a negative mantissa: ' + JSON.stringify(R.sf));
      ok(R.cont.spo2 === 97 && R.cont.pr === 61 && R.cont.ms === 128 && R.cont.dss === 16 && Math.abs(R.cont.pi - 2.5) < 1e-9,
        'a continuous measurement: SpO₂ and pulse, the fast and slow averages stepped over, the status, the device status and the pulse amplitude: ' + JSON.stringify(R.cont));
      ok(R.spot.spo2 === 99 && R.spot.pr === 70 && R.spot.ms === 1 << 13, 'a spot-check measurement: its time stamp stepped over, then its status: ' + JSON.stringify(R.spot));
      ok(R.q === 'good weak weak off off demo none none none none',
        'what a reading is worth: good; questionable, or a weak signal (weak, still ending a low hold); no finger, or the sensor unplugged; demonstration data; unavailable, or not a percentage: ' + R.q);
      ok(R.kinds === 'focus-primer:work creative:work anapana:focus sleep-descent:sleep body-scan:sleep wim-hof:hold calm-reset: kapalabhati:',
        'focus pages before work get air, rosemary and gum, a focus meditation air and rosemary, sleep pages lavender, a practice with holds the oximeter, others nothing: ' + R.kinds);
      const allTips = Object.values(R.tips).map(x => x[0] + ' ' + x[1]).join(' ') + ' ' + R.safe;
      ok(!SPELL.test(allTips) && /^Optional: /.test(R.tips.rosemary[0]) && /early evidence/.test(R.tips.rosemary[1]) && /Early to moderate/.test(R.tips.lavender[1]) && /mildly alerting/.test(R.tips.gum[1]) && /small effect/i.test(R.tips.gum[1]),
        'each tip is optional, with its evidence as the guide gives it (rosemary early, lavender early to moderate, gum mild), in British spelling');
      ok(/Dilute/.test(R.safe) && /never swallow/.test(R.safe) && /asthma/.test(R.safe) && /pregnancy/.test(R.safe) && /small children/.test(R.safe) && /pets, cats above all/.test(R.safe),
        'the scents line: dilute, never swallow, asthma, pregnancy, small children and pets, cats above all');
      await p.context().close();
    }

    /* B. locked on the real build */
    if (!only || only === 'B') {
      const p = await page();
      await go(p, 'air', 500);
      const H = await E(p, () => ({ air: !!document.querySelector('#v-heart #air'), ox: !!document.querySelector('#v-heart #ox'), outside: !document.querySelector('#hr #air, #hr #ox'),
        cups: ['#aqGo', '#aqSave', '#oxGo'].map(s => !!document.querySelector(s + ' .sup-tag')), txt: document.querySelector('#air').textContent + document.querySelector('#ox').textContent }));
      ok(H.air && H.ox && H.outside && H.cups.every(Boolean) && /above about 900/.test(H.txt) && /below 90%/.test(H.txt),
        'the Heart page has Room air and Blood oxygen after the heart\'s boxes, readable, their buttons with the cup while locked');
      await p.click('#aqGo'); await p.waitForTimeout(300);
      ok(await vis(p, '#supModal') && await t(p, '#supFor') === AQ + ' is one of the new techniques.' && await E(p, () => !window.__air.opts.aranet && window.__entrain.AQ.state === 'off'),
        'Connect an Aranet4 opens the donation dialog by name, and no Bluetooth chooser: ' + await t(p, '#supFor'));
      await p.click('#supClose'); await p.waitForTimeout(200);
      await p.fill('#aqIn', '1200'); await p.click('#aqSave'); await p.waitForTimeout(300);
      ok(await vis(p, '#supModal') && await E(p, () => localStorage.getItem('entrain.co2') === null && document.querySelector('#aqNow').hidden), 'Save opens it too, and keeps nothing');
      await p.click('#supClose'); await p.waitForTimeout(200);
      await go(p, 'ox', 300); await p.click('#oxGo'); await p.waitForTimeout(300);
      ok(await vis(p, '#supModal') && await t(p, '#supFor') === OX + ' is one of the new techniques.' && await E(p, () => !window.__air.opts.ox), 'Connect an oximeter the same: ' + await t(p, '#supFor'));
      await p.click('#supClose'); await p.waitForTimeout(200);
      // Settings
      await go(p, 'st-air', 500);
      const S = await E(p, () => ({ h: document.querySelector('#st-air h2').textContent, on: document.querySelector('#aqPromptOn').checked, cup: !!document.querySelector('#st-air .aq-cup .sup-tag'),
        tips: document.querySelector('#aqTipsOn').checked, links: [...document.querySelectorAll('#st-air a')].map(a => a.getAttribute('href')).join(' ') }));
      ok(S.h === 'Air and scent' && !S.on && S.cup && S.tips && S.links === '#l-air #air #ox', 'Settings has Air and scent: Air the room off with the cup while locked, the tips on, and the links: ' + JSON.stringify(S));
      await p.click('label:has(#aqPromptOn)'); await p.waitForTimeout(300);
      ok(await vis(p, '#supModal') && await t(p, '#supFor') === PROMPT + ' is one of the new techniques.' && await E(p, () => !document.querySelector('#aqPromptOn').checked && localStorage.getItem('entrain.airPrompt') === null),
        'turning Air the room on opens the dialog, and it stays off');
      await p.click('#supClose'); await p.waitForTimeout(200);
      // the free tips
      await go(p, 'practice/focus-primer', 500);
      const F = await E(p, () => { const s = document.querySelector('#sIntro .aq-slot'); return { air: !!s.querySelector('.aq-air'), tips: [...s.querySelectorAll('.aq-tip > b')].map(b => b.textContent).join(' | '), safe: !!s.querySelector('.aq-safe .sf-link[data-safety]'),
        learn: [...s.querySelectorAll('.aq-tip a')].map(a => a.getAttribute('href')).join(' '), after: !!document.querySelector('#sIntro .si-steps ~ .aq-slot'), how: document.querySelector('#sIntro .si-main > p').textContent }; });
      ok(!F.air && F.tips === 'Optional: rosemary. | Optional: chewing gum.' && F.safe && F.learn === '#l-scent #l-gum' && F.after && !/rosemary/i.test(F.how),
        'Focus Primer\'s page, locked: the rosemary and chewing-gum tips, free, rosemary with the scents line and its link, after the steps; no reminder: ' + F.tips);
      await p.click('#sIntro .aq-safe .sf-link'); await p.waitForTimeout(300);
      ok(await vis(p, '#sfModal') && await E(p, () => /Scents\./.test(document.querySelector('#sfBody').textContent)), 'the tip\'s Safety notes opens the note, with its Scents line');
      await p.click('#sfClose'); await p.waitForTimeout(200);
      const pages = {};
      for (const h of ['practice/sleep-descent', 'practice/anapana', 'practice/calm-reset', 'track/deep-work', 'track/sleep-descent', 'prime', 'sleep-sounds', 'practice/wim-hof']) { await go(p, h, 450); pages[h] = await slot(p); }
      ok(/^Optional: lavender\./.test(pages['practice/sleep-descent']) && /Optional: rosemary\./.test(pages['practice/anapana']) && !/chewing gum/.test(pages['practice/anapana']) && pages['practice/calm-reset'] === '' &&
        /rosemary.*chewing gum/.test(pages['track/deep-work']) && /lavender/.test(pages['track/sleep-descent']) && /rosemary.*chewing gum/.test(pages['prime']) && /lavender/.test(pages['sleep-sounds']),
        'lavender on sleep pages (Sleep Descent, its track, Sleep sounds), rosemary on Anapana, rosemary and gum on a focus track and the primer, nothing on Calm Reset');
      const W = await E(p, () => { const a = document.querySelector('#sIntro .ox-tip a[href="#ox"]'); return { cup: !!(a && a.nextElementSibling && a.nextElementSibling.classList.contains('sup-tag')), txt: document.querySelector('#sIntro .ox-tip').textContent }; });
      ok(W.cup && /below 90% during a hold ends it/.test(W.txt) && /only ever ends a hold sooner/.test(W.txt) && !/longer/.test(W.txt),
        'Wim Hof\'s page says what an oximeter does, with the cup on its link, and nothing about holding longer: ' + W.txt.slice(0, 90));
      // tips off and on again, free
      await go(p, 'st-air', 400); await p.click('label:has(#aqTipsOn)'); await p.waitForTimeout(200);
      await go(p, 'practice/focus-primer', 400);
      const off = await slot(p);
      await go(p, 'st-air', 400); await p.click('label:has(#aqTipsOn)'); await p.waitForTimeout(200);
      await go(p, 'practice/focus-primer', 400);
      ok(off === '' && /rosemary/.test(await slot(p)) && await E(p, () => document.querySelector('#supModal').hidden), 'the tips turn off and on again in Settings, free: ' + JSON.stringify(off));
      // Settings' list and search
      await go(p, 'st-supporter', 400);
      const list = await E(p, () => [...document.querySelectorAll('#supList a')].map(a => a.textContent + '>' + a.getAttribute('href')));
      ok([PROMPT + '>#st-air', AQ + '>#air', OX + '>#ox'].every(x => list.includes(x)), 'Settings\' New techniques lists Air the room, the CO₂ monitor and the oximeter');
      await p.click('#tbFind'); await p.waitForTimeout(250);
      const hits = async q => { await p.fill('#fdIn', q); await p.waitForTimeout(450); return E(p, () => [...document.querySelectorAll('.fd-it')].map(a => a.querySelector('b').textContent + '>' + a.getAttribute('href') + (a.querySelector('.sup-tag') ? ' +sup' : ''))); };
      const h1 = await hits('co2'), h2 = await hits('oximeter'), h3 = await hits('rosemary'), h4 = await hits('open window');
      ok(h1[0] === 'Room air (CO₂)>#air +sup' && h2[0] === OX + '>#ox +sup' && h3.includes('Scent and chewing-gum tips>#st-air') && h4.some(x => x === PROMPT + '>#st-air +sup'),
        'search finds Room air and the oximeter with the badge, the tips without it, and Air the room: ' + [h1[0], h2[0], h3[0], h4[0]].join(' | '));
      await p.keyboard.press('Escape');
      await p.context().close();
    }

    /* C. unlocked: the reminder, typed readings, the choices */
    if (!only || only === 'C') {
      const p = await page(null, { unlock: true });
      const air = {};
      for (const h of ['practice/focus-primer', 'practice/anapana', 'track/deep-work', 'prime', 'practice/calm-reset', 'practice/sleep-descent']) { await go(p, h, 450); air[h] = await E(p, () => { const a = document.querySelector('.view:not([hidden]) .aq-air'); return a ? a.textContent.replace(/\s+/g, ' ').trim() : ''; }); }
      ok(['practice/focus-primer', 'practice/anapana', 'track/deep-work', 'prime'].every(h => /^Air the room first\. Open a window for a few minutes before you start/.test(air[h])) && air['practice/calm-reset'] === '' && air['practice/sleep-descent'] === '' &&
        await E(p, () => document.querySelector('#v-prime .aq-air a[href="#air"]') !== null), 'unlocked, Air the room shows on focus practices, a focus track and the primer, with a link to add a reading; not on calm or sleep pages');
      await go(p, 'practice/focus-primer', 450);
      const b = await E(p, () => document.querySelector('#sIntro .aq-done').getBoundingClientRect().height);
      await p.click('#sIntro .aq-done'); await p.waitForTimeout(300);
      ok(b >= 44 && await E(p, () => !document.querySelector('#sIntro .aq-air') && +localStorage.getItem('entrain.airAt') > Date.now() - 5000) && /Aired/.test(await t(p, '#toastTxt')),
        'It\'s aired (' + b + ' px) puts the reminder to rest for an hour, with a notice: ' + await t(p, '#toastTxt'));
      await go(p, 'practice/creative', 400);
      ok(await E(p, () => !document.querySelector('#sIntro .aq-air')), 'and it stays at rest on the next focus page');
      await E(p, () => localStorage.removeItem('entrain.airAt'));
      // a typed reading
      await typeIn(p, 'abc');
      const bad1 = await t(p, '#aqTypeMsg');
      await typeIn(p, '50');
      ok(/between 300 and 10,000/.test(bad1) && /between 300 and 10,000/.test(await t(p, '#aqTypeMsg')) && await E(p, () => localStorage.getItem('entrain.co2') === null), 'a typed reading that isn\'t a room\'s ppm is refused, and nothing kept');
      await typeIn(p, '1,250');
      const R1 = await E(p, () => ({ kept: JSON.parse(localStorage.getItem('entrain.co2')), shown: !document.querySelector('#aqNow').hidden, hi: document.querySelector('#aqNow').dataset.hi, ppm: document.querySelector('#aqPpm').textContent,
        say: document.querySelector('#aqNow').textContent.replace(/\s+/g, ' ').trim(), msg: document.querySelector('#aqTypeMsg').textContent }));
      ok(R1.kept.ppm === 1250 && R1.kept.src === 'typed' && R1.shown && R1.hi === '1' && R1.ppm === '1,250' && /Above about 900 ppm: open a window/.test(R1.say) && /typed in/.test(R1.say) && /two hours/.test(R1.msg),
        'a typed 1,250 ppm is kept and shown: above about 900, open a window: ' + R1.say);
      await go(p, 'practice/focus-primer', 450);
      const a1 = await E(p, () => { const a = document.querySelector('#sIntro .aq-air'); return { hi: a.dataset.hi, txt: a.textContent.replace(/\s+/g, ' ').trim(), btn: !!a.querySelector('.aq-done') }; });
      ok(a1.hi === '1' && /^Open a window\. Your room air read 1,250 ppm of CO₂/.test(a1.txt) && /above about 900 ppm, where test scores were lower in office studies/.test(a1.txt) && a1.btn,
        'the focus page shows it: open a window, with why: ' + a1.txt.slice(0, 110));
      await p.click('#sIntro .aq-done'); await p.waitForTimeout(250);
      ok(await E(p, () => !document.querySelector('#sIntro .aq-air')), 'aired after that reading, the reminder rests');
      await p.waitForTimeout(30);
      await typeIn(p, '650');
      await go(p, 'practice/focus-primer', 450);
      const a2 = await E(p, () => { const a = document.querySelector('#sIntro .aq-air'); return a ? { hi: a.dataset.hi, txt: a.textContent.replace(/\s+/g, ' ').trim(), btn: !!a.querySelector('.aq-done') } : null; });
      ok(a2 && a2.hi === '0' && /^Room air: 650 ppm of CO₂, just now \(typed in\): below about 900 ppm, fresh enough for focus\.$/.test(a2.txt) && !a2.btn,
        'a newer reading shows even so: 650 ppm, fresh enough, with nothing to do: ' + (a2 && a2.txt));
      // the reminder turned off: a fresh reading still shows, the plain reminder doesn't
      await go(p, 'st-air', 400);
      ok(await E(p, () => document.querySelector('#aqPromptOn').checked && !document.querySelector('#st-air .aq-cup .sup-tag')), 'in Settings Air the room is on, with no cup, once unlocked');
      await p.click('label:has(#aqPromptOn)'); await p.waitForTimeout(200);
      await go(p, 'practice/focus-primer', 400);
      const withR = await E(p, () => (document.querySelector('#sIntro .aq-air') || {}).textContent || '');
      await E(p, () => { const r = { ppm: 1500, at: Date.now() - 3 * 3600e3, src: 'typed' }; localStorage.setItem('entrain.co2', JSON.stringify(r)); window.__entrain.AQ.last = r; });
      await E(p, () => window.__entrain.supRefresh()); await go(p, 'practice/creative', 400);
      const none = await E(p, () => !document.querySelector('#sIntro .aq-air'));
      ok(await E(p, () => localStorage.getItem('entrain.airPrompt') === '0') && /650 ppm/.test(withR) && none,
        'turned off, the reminder goes: a fresh reading still shows, and with no reading from the last two hours nothing does');
      await go(p, 'st-air', 400); await p.click('label:has(#aqPromptOn)'); await p.waitForTimeout(200);
      await go(p, 'air', 400);
      ok(await E(p, () => document.querySelector('#aqNow').hidden && localStorage.getItem('entrain.airPrompt') === '1'), 'a reading over two hours old isn\'t shown on the Heart page either; the reminder is back on');
      // the reading and the airing belong to this device: left out of backups
      const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8'), skip = /var BK_SKIP = \[([^\]]*)\]/.exec(html)[1];
      ok(/"co2"/.test(skip) && /"airAt"/.test(skip), 'the reading and the airing are left out of backups (BK_SKIP): ' + skip);
      await p.context().close();
    }

    /* D. an Aranet4 end to end */
    if (!only || only === 'D') {
      let p = await page(null, { unlock: true, scale: 0.02 });
      ok(await aqOn(p), 'an Aranet4 connects');
      const D1 = await E(p, () => ({ o: window.__air.opts.aranet, st: window.__entrain.AQ.state, ppm: document.querySelector('#aqPpm').textContent, hint: document.querySelector('#aqHint').textContent,
        age: document.querySelector('#aqAge').textContent, pill: document.querySelector('#aqPillTxt').textContent, btn: document.querySelector('#aqGoTxt').textContent, busy: window.__entrain.appBusy(), kept: JSON.parse(localStorage.getItem('entrain.co2')) }));
      const f = D1.o.filters, os = D1.o.optionalServices;
      ok(f.some(x => x.namePrefix === 'Aranet4') && f.some(x => (x.services || []).includes(0xfce0)) && f.some(x => (x.services || []).includes('f0cd1400-95da-4f4b-9ac8-aa55d312af0c')) &&
        os.includes(0xfce0) && os.includes('f0cd1400-95da-4f4b-9ac8-aa55d312af0c') && os.includes('battery_service'), 'the chooser asks for an Aranet4 by name and by either service, new firmware\'s and old: ' + JSON.stringify(D1.o));
      ok(D1.ppm === '1,250' && D1.hint === 'Aranet4 1A2B3 · battery 87%' && /Aranet4 1A2B3 · 22\.5 °C, 45% humidity/.test(D1.age) && D1.pill === 'Connected' && D1.btn === 'Disconnect' && D1.busy &&
        D1.kept.src === 'monitor' && Math.abs(Date.now() - 12000 - D1.kept.at) < 4000, 'its reading: 1,250 ppm, the temperature and humidity, the battery, timed when it was measured (12 s before); the page held from updating: ' + D1.age);
      await go(p, 'practice/focus-primer', 400);
      ok(/^Open a window\. Your room air read 1,250 ppm of CO₂ .*\(Aranet4 1A2B3\)/.test(await t(p, '#sIntro .aq-air')), 'the focus page shows the monitor\'s reading');
      await E(p, () => window.__co2 = 640);
      const next = await until(p, () => /640 ppm/.test((document.querySelector('#sIntro .aq-air') || {}).textContent || ''), 6000);
      ok(next && await E(p, () => window.__air.reads >= 2) && /fresh enough/.test(await t(p, '#sIntro .aq-air')), 'the next reading comes when the monitor has one, and the focus page follows it: ' + await t(p, '#sIntro .aq-air'));
      await go(p, 'air', 300); await p.click('#aqGo'); await p.waitForTimeout(300);
      ok(await E(p, () => window.__entrain.AQ.state === 'off' && !window.__entrain.appBusy() && document.querySelector('#aqPpm').textContent === '640' && !document.querySelector('#aqNow').hidden),
        'Disconnect: off, the page free to update again, the last reading kept');
      await p.context().close();
      // old firmware, the plain readings, no reading yet
      for (const [m, what] of [[{ old: true }, 'old firmware (the old service only)'], [{ short: true }, 'the plain readings (f0cd1503 only)']]) {
        p = await page(null, { unlock: true, scale: 0.02, mock: { aranet: m } });
        ok(await aqOn(p) && await t(p, '#aqPpm') === '1,250', what + ' reads too');
        await p.context().close();
      }
      p = await page(null, { unlock: true, scale: 0.02 });
      await E(p, () => window.__co2 = 0);
      ok(await aqOn(p) && /no CO₂ reading yet/.test(await t(p, '#aqWait')) && await E(p, () => document.querySelector('#aqNow').hidden), 'a monitor with no reading yet says so: ' + await t(p, '#aqWait'));
      await p.context().close();
      // when it goes wrong
      const fails = [];
      for (const [m, re, what] of [[{ pair: true }, /six-digit code shown on the monitor's screen/, 'pairing not accepted'], [{ cancel: true }, /^No monitor was chosen/, 'the chooser closed'],
        [{ noSvc: true }, /no Aranet4 readings that Entrain can find.*type its reading below/, 'another device'], [{ hang: 'read' }, /didn't answer while reading the CO₂/, 'no answer']]) {
        p = await page(null, { unlock: true, scale: 0.02, mock: { aranet: m } });
        await go(p, 'air', 300); await p.click('#aqGo');
        await until(p, () => window.__entrain.AQ.state === 'off' && document.querySelector('#aqErr').textContent, 6000);
        const r = await E(p, () => ({ st: window.__entrain.AQ.state, err: document.querySelector('#aqErr').textContent, shown: !document.querySelector('#aqErr').hidden, btn: document.querySelector('#aqGoTxt').textContent }));
        if (!(r.st === 'off' && r.shown && re.test(r.err) && r.btn === 'Connect an Aranet4')) fails.push(what + ': ' + JSON.stringify(r));
        await p.context().close();
      }
      ok(!fails.length, 'pairing not accepted, the chooser closed, another device and no answer each say what to do' + (fails.length ? ': ' + fails.join(' | ') : ''));
      p = await page(null, { unlock: true, scale: 0.02, mock: { aranet: { failAfter: 1 } } });
      await aqOn(p);
      const lost = await until(p, () => window.__entrain.AQ.state === 'off', 8000);
      ok(lost && /stopped answering, so its last reading stays/.test(await t(p, '#aqErr')) && await t(p, '#aqPpm') === '1,250', 'a monitor that stops answering: three tries, then off, its last reading kept: ' + await t(p, '#aqErr'));
      await p.context().close();
      // an iPhone: no Bluetooth, typing still works
      p = await page(null, { unlock: true, noBt: true, ua: IPH });
      await go(p, 'air', 400);
      const ip = await E(p, () => ({ no: !document.querySelector('#aqNo').hidden, dis: document.querySelector('#aqGo').disabled, oxNo: !document.querySelector('#oxNo').hidden, oxDis: document.querySelector('#oxGo').disabled, txt: document.querySelector('#aqNo').textContent }));
      await typeIn(p, '980');
      ok(ip.no && ip.dis && ip.oxNo && ip.oxDis && /type its reading below/.test(ip.txt) && await t(p, '#aqPpm') === '980', 'on an iPhone the two buttons are off and say why, and a typed reading still works');
      await p.context().close();
    }

    /* E. an oximeter, and a breath hold */
    if (!only || only === 'E') {
      let p = await page(null, { unlock: true, scale: 0.05 });
      ok(await oxOn(p), 'an oximeter connects');
      const O1 = await E(p, () => ({ o: window.__air.opts.ox, v: document.querySelector('#oxV').textContent, pr: document.querySelector('#oxPr').textContent, q: document.querySelector('#oxQ').textContent,
        read: document.querySelector('#oxRead').textContent, busy: window.__entrain.appBusy(), hint: document.querySelector('#oxHint').textContent }));
      ok(O1.o.filters.length === 1 && O1.o.filters[0].services[0] === 0x1822 && O1.v === '98' && O1.pr === '64' && O1.q === 'Good' && /now end at once if a reading falls below 90%/.test(O1.read) && O1.busy && O1.hint === 'PLX Oximeter',
        'the chooser asks for Bluetooth\'s pulse oximeter service; it shows 98%, a pulse of 64 and a good signal, and holds the page from updating: ' + JSON.stringify(O1).slice(0, 160));
      await E(p, () => window.__oxFinger = false);
      await until(p, () => document.querySelector('#oxQ').textContent === 'No finger', 3000);
      const nf = await E(p, () => ({ q: document.querySelector('#oxQ').textContent, read: document.querySelector('#oxRead').textContent }));
      await E(p, () => { window.__oxFinger = true; window.__oxDemo = true; });
      await until(p, () => document.querySelector('#oxQ').textContent === 'Demonstration data', 3000);
      const dm = await E(p, () => document.querySelector('#oxRead').textContent);
      await E(p, () => { window.__oxDemo = false; window.__oxWeak = true; });
      await until(p, () => document.querySelector('#oxQ').textContent === 'Weak', 3000);
      const wk = await E(p, () => document.querySelector('#oxRead').textContent);
      await E(p, () => { window.__oxWeak = false; });
      ok(nf.q === 'No finger' && /put a fingertip all the way in/.test(nf.read) && /leaves it out/.test(dm) && /doubts about this reading/.test(wk),
        'no finger, demonstration data and a weak signal each say so: ' + [nf.read, dm, wk].map(x => x.slice(0, 40)).join(' | '));
      // Breathe shows it
      await go(p, 'breathe', 400);
      ok(await until(p, () => !document.querySelector('#bOxStat').hidden && document.querySelector('#bOx').textContent === '98', 3000), 'Breathe shows SpO₂ beside the guide');
      // Wim Hof: a hold left alone at 98%, ended at 87%
      await go(p, 'practice/wim-hof', 500);
      ok(/Your oximeter is connected: a reading below 90% during a hold ends it/.test(await t(p, '#sIntro .ox-tip')), 'Wim Hof\'s page says the oximeter is connected and what it does');
      await p.check('#sOk'); await p.click('#sGo'); await p.waitForTimeout(400);
      for (let i = 0; i < 4 && !/hold/.test(await E(p, () => window.__entrain.P.steps[window.__entrain.P.idx].title)); i++) { await p.click('#sNext'); await p.waitForTimeout(250); }
      await p.waitForTimeout(2500);
      const h1 = await E(p, () => ({ st: window.__entrain.P.state, step: window.__entrain.P.steps[window.__entrain.P.idx].title, chip: document.querySelector('#sLive').textContent }));
      ok(h1.st === 'running' && h1.step === 'Round 1: hold' && /SpO₂ 98%/.test(h1.chip), 'at 98% the hold runs on as it would without an oximeter, the reading among the live chips: ' + JSON.stringify(h1));
      await E(p, () => window.__spo2 = 87);
      await until(p, () => window.__entrain.P.state === 'paused', 4000);
      const h2 = await E(p, () => ({ st: window.__entrain.P.state, step: window.__entrain.P.steps[window.__entrain.P.idx].title, line: document.querySelector('#sLine').textContent, said: window.__said.slice(-1)[0],
        low: !!document.querySelector('#sLive .lc.ox.low'), holds: window.__entrain.P.holds.length }));
      ok(h2.st === 'paused' && h2.step === 'Round 2: power breaths' && /^Breathe now\. Your oxygen read 87%, below 90%: breathe normally, and carry on when you're ready\.$/.test(h2.line) && h2.said === 'Breathe now.' && h2.low && h2.holds === 1,
        'at 87% the hold ends with Breathe now, said and shown, the recovery hold after it left out too, and the practice waits for you: ' + JSON.stringify(h2));
      await E(p, () => window.__spo2 = 97); await p.waitForTimeout(1200);
      await p.click('#sPlay'); await p.waitForTimeout(400);
      ok(await E(p, () => window.__entrain.P.state === 'running' && window.__entrain.P.steps[window.__entrain.P.idx].title === 'Round 2: power breaths'), 'Resume carries on with the next round');
      await p.click('#sEnd'); await p.click('#sEnd'); await p.waitForTimeout(700);
      const tile = await E(p, () => { const b = [...document.querySelectorAll('#sDone .sd-t')].find(x => x.dataset.ex === 'ox'); return b ? b.textContent.replace(/\s+/g, ' ').trim() : ''; });
      await p.click('#sDone .sd-t[data-ex="ox"]'); await p.waitForTimeout(300);
      const ex = await t(p, '#sdEx');
      const hist = await E(p, () => (JSON.parse(localStorage.getItem('entrain.history') || '[]').find(e => e.id === 'wim-hof') || {}).note || '');
      ok(tile === 'Oxygen87%below 90%: a hold ended' && /read below 90% during a hold once, at 87%/.test(ex) && /never progress/.test(ex) && /a hold ended at 87% oxygen/.test(hist),
        'the end screen has the Oxygen tile, its explanation (a safety signal, never a score) and the history the note: ' + tile + ' | ' + hist);
      // Breathe: Swim & dive ended; a pattern with no holds left running
      await E(p, () => { localStorage.setItem('entrain.diveAck', '1'); window.__spo2 = 98; });
      await go(p, 'breathe/dive', 500);
      await p.click('#bStart'); await p.waitForTimeout(1500);
      await E(p, () => window.__spo2 = 86);
      const ended = await until(p, () => window.__entrain.B.state === 'done', 4000);
      const bh = await E(p, () => ({ hint: document.querySelector('#bHint').textContent, said: window.__said.slice(-1)[0] }));
      ok(ended && /^Breathe now: your oxygen read 86%, below 90%\. Breathe normally for a couple of minutes/.test(bh.hint) && bh.said === 'Breathe now.',
        'on Breathe, Swim & dive ends at 86% with Breathe now: ' + bh.hint);
      await E(p, () => window.__spo2 = 98);
      await go(p, 'breathe/resonance', 500);
      await p.click('#bStart'); await p.waitForTimeout(1200);
      await E(p, () => window.__spo2 = 86); await p.waitForTimeout(2500);
      ok(await E(p, () => window.__entrain.B.state === 'running' && document.querySelector('#bOxStat').classList.contains('low')), 'a pattern with no holds runs on, the reading shown low');
      await p.click('#bStart'); await E(p, () => window.__spo2 = 98);
      // a dropped link comes back; Disconnect
      await E(p, () => window.__oxDrop());
      const back = await until(p, () => window.__entrain.OX.state === 'on' && window.__entrain.OX.n > 0, 6000);
      await go(p, 'ox', 300); await p.click('#oxGo'); await p.waitForTimeout(300);
      ok(back && await E(p, () => window.__entrain.OX.state === 'off' && document.querySelector('#oxOn').hidden), 'a dropped link reconnects by itself; Disconnect turns it off');
      await p.context().close();
      // spot-check oximeters, another kind, the chooser closed
      p = await page(null, { unlock: true, scale: 0.05, mock: { ox: { spot: true } } });
      ok(await oxOn(p) && await t(p, '#oxV') === '98', 'an oximeter that sends spot-checks reads too');
      await p.context().close();
      const fails = [];
      for (const [m, re, what] of [[{ noSvc: true }, /standard pulse oximeter service.*\(PLX\) will work/, 'another kind'], [{ cancel: true }, /^No oximeter was chosen/, 'the chooser closed'], [{ hang: 'link' }, /didn't answer while linking up/, 'no answer']]) {
        p = await page(null, { unlock: true, scale: 0.05, mock: { ox: m } });
        await go(p, 'ox', 300); await p.click('#oxGo');
        await until(p, () => window.__entrain.OX.state === 'off' && document.querySelector('#oxErr').textContent, 6000);
        const r = await E(p, () => ({ err: document.querySelector('#oxErr').textContent, btn: document.querySelector('#oxGoTxt').textContent }));
        if (!(re.test(r.err) && r.btn === 'Connect an oximeter')) fails.push(what + ': ' + JSON.stringify(r));
        await p.context().close();
      }
      ok(!fails.length, 'an oximeter of another kind, the chooser closed and no answer each say what to do' + (fails.length ? ': ' + fails.join(' | ') : ''));
    }

    /* F. Learn, the routines and the safety note, free on the locked build */
    if (!only || only === 'F') {
      const p = await page();
      await go(p, 'l-air', 500);
      const L = await E(p, () => {
        const h = document.querySelector('#l-air'), ps = [], tx = e => e.textContent.replace(/\s+/g, ' ').trim();
        for (let e = h.nextElementSibling; e && e.tagName === 'P'; e = e.nextElementSibling) ps.push(tx(e));
        const refs = [...document.querySelectorAll('#references li')].map(tx);
        const row = n => { const r = [...document.querySelectorAll('#lnGlance tr.ln-row')].find(x => x.querySelector('th b').textContent.replace(/\s+/g, ' ') === n); return { lo: r.children[2].classList.contains('ln-lo'), a: [...r.children[2].querySelectorAll('a')].map(a => a.getAttribute('href')).join(' '), ev: r.children[1].textContent }; };
        const sig = [...document.querySelectorAll('#lnSignals tbody tr')].find(r => r.querySelector('th b').textContent === 'Blood oxygen');
        return { h: tx(h), ps, toc: !!document.querySelector('.toc a[href="#l-air"]'), view: !document.querySelector('#v-learn').hidden && document.querySelector('#supModal').hidden,
          refs: ['Allen, J. G.', 'Cedeño Laurent, J. G.', 'Young, A. S.', 'Diego, M. A.', 'Allen, A. P.', 'Chmiel, J., & Malinowska', 'Luo, J.'].map(a => refs.find(r => r.startsWith(a)) || ''),
          rows: ['Fresh air, low CO2', 'Rosemary scent', 'Lavender scent', 'Chewing gum'].map(row), sig: [tx(sig.children[2]), sig.children[2].classList.contains('ln-lo')],
          ox: tx(document.querySelector('#l-ox')), safe: [...document.querySelectorAll('#sfNote .sf-list li')].map(tx) };
      });
      const all = L.ps.join(' ');
      ok(L.view && L.toc && L.h === 'Air, scent and chewing gum' && L.ps.length === 4, 'Learn has Air, scent and chewing gum, in its contents, free to read: ' + L.ps.length + ' paragraphs');
      ok(/24 office workers/.test(all) && /61% higher/.test(all) && /101% higher/.test(all) && /each went with lower scores on their own \(Allen et al\., 2016\)/.test(all) && /20 cubic feet a minute per person/.test(all) &&
        /above about 900 ppm/.test(all) && /302 office workers in six countries/.test(all) && /\(Cedeño Laurent et al\., 2021\)/.test(all) && /under 640 ppm/.test(all) && /short of statistical significance \(Young et al\., 2024\)/.test(all) && /strong evidence/.test(all),
        'the air: the controlled office study\'s 61% and 101%, CO₂ and chemicals each, the 900 ppm threshold, the six-country study and the home study, short of significance');
      ok(/40 adults/.test(all) && /\(Diego et al\., 1998\)/.test(all) && /small, older study/.test(all) && /reading of lavender's EEG is unusual/.test(all) && /rosemary for alertness as early evidence and lavender for relaxation as early to moderate/.test(all) && /optional tip, never a need/.test(all),
        'scent: Diego and colleagues\' study with its caveats, rosemary early, lavender early to moderate, an optional tip');
      ok(/\(Allen & Smith, 2015\)/.test(all) && /\(Chmiel & Malinowska, 2025\)/.test(all) && /retracted by its publisher in 2023 and shouldn't be relied on \(Luo et al\., 2022\)/.test(all) && /early to moderate/.test(all) && /mild/.test(all),
        'chewing gum: mildly alerting, the workday study, mixed cortisol, the imaging review, and the retracted meta-analysis named as retracted');
      ok(L.refs.every(r => /https:\/\//.test(r) || r) && L.refs.every(Boolean) && /Retracted by the publisher in 2023/.test(L.refs[6]) && await E(p, () => [...document.querySelectorAll('#references li')].filter(li => /^(Allen|Cedeño|Young, A|Diego|Chmiel, J\., & Malinowska|Luo)/.test(li.textContent.trim())).every(li => li.querySelector('a[href^="https://"]'))),
        'its seven references, each linked, the retracted one marked as retracted');
      ok(L.rows.every(r => !r.lo) && /#st-air/.test(L.rows[0].a) && /#air/.test(L.rows[0].a) && /#living\/daytime/.test(L.rows[0].a) && /#practice\/focus-primer/.test(L.rows[1].a) && /#practice\/sleep-descent/.test(L.rows[2].a) &&
        /#track\/deep-work/.test(L.rows[3].a) && L.rows.map(r => r.ev).join('|') === 'Strong|Early|Early to moderate|Early to moderate',
        'the glance table: fresh air, rosemary, lavender and chewing gum now lead to where Entrain has them, their evidence unchanged: ' + L.rows.map(r => r.a).join(' / '));
      ok(/#?Blood oxygen on Heart, from a fingertip oximeter: a hold ends below 90%/.test(L.sig[0]) && !L.sig[1] && /trails the blood by several seconds/.test(L.ox) && /only ever ends a hold sooner/.test(L.ox) && /Entrain's own rule/.test(L.ox),
        'what to measure: blood oxygen now on Heart, and a paragraph on it: a rough safety signal that only ends a hold sooner');
      const sc = L.safe.find(x => /^Scents\./.test(x)) || '', bh = L.safe.find(x => /^Breath holds\./.test(x)) || '';
      ok(/harmful to pets/.test(sc) && /dilute/.test(sc) && /never swallow/.test(sc) && /small children and pets, cats above all/.test(sc) && /asthma, or in pregnancy/.test(sc) && /oximeter on the Heart page ends a hold that reads below 90%/.test(bh) && /never a reason to hold on/.test(bh),
        'the safety note has a Scents line, and Breath holds says what an oximeter does and doesn\'t');
      // the routines
      await go(p, 'living/daytime', 600);
      const R = await E(p, () => {
        const tx = e => e.textContent.replace(/\s+/g, ' ').trim(), li = s => [...document.querySelectorAll(s + ' .lv-rsteps > li')].find(l => /Air the room|Wind down/.test(l.querySelector('b').textContent));
        const a = li('#lv-daytime'), w = li('#lv-evening');
        return { a: tx(a.querySelector('p')), go: [...a.querySelectorAll('.lv-go a, a.lv-chip')].map(x => x.getAttribute('href')).join(' '), w: tx(w.querySelector('p')),
          dref: [...document.querySelectorAll('#lv-daytime .lv-refl li')].map(tx).filter(x => /^(Allen, J\. G\.|Young, A\. S\.)/.test(x)).length,
          eref: [...document.querySelectorAll('#lv-evening .lv-refl li')].map(tx).filter(x => /^Diego/.test(x)).length };
      });
      ok(/^Before a block of focused work, open a window for a few minutes/.test(R.a) && /61% higher/.test(R.a) && /900 ppm/.test(R.a) && R.go === '#air' && R.dref === 2 &&
        /a little lavender is a gentle extra/.test(R.w) && /never swallowed/.test(R.w) && /cats above all/.test(R.w) && R.eref === 1,
        'the day routine airs the room, with Room air and two sources; the evening routine\'s wind-down offers lavender with its safety line and source');
      await go(p, 'air', 400);
      ok(await E(p, () => document.querySelector('#supModal').hidden), 'the routine\'s link opens Room air, with no dialog');
      await p.context().close();
    }

    /* G. a 360 px phone: widths, targets, spelling */
    if (!only || only === 'G') {
      const p = await page({ co2: JSON.stringify({ ppm: 1180, at: Date.now() - 600000, src: 'typed' }) }, { unlock: true, vp: { width: 360, height: 740 } });
      await oxOn(p);
      const bad = [], small = [], words = [];
      for (const h of ['air', 'ox', 'st-air', 'practice/focus-primer', 'practice/wim-hof', 'practice/sleep-descent', 'track/deep-work', 'prime', 'sleep-sounds', 'living/daytime', 'l-air']) {
        await go(p, h, 450);
        const m = await E(p, () => {
          const v = document.querySelector('.view:not([hidden])'), r = e => e.getBoundingClientRect();
          const btns = [...v.querySelectorAll('#aqGo, #aqSave, #oxGo, .aq-done, #aqIn')].filter(e => e.offsetWidth).map(e => [e.id || e.className, Math.round(r(e).height)]);
          const links = [...v.querySelectorAll('.aq-slot a, .aq-slot .sf-link')].filter(e => e.offsetWidth).map(e => [e.textContent, Math.round(r(e).height)]);
          const txt = [...v.querySelectorAll('#air, #ox, #st-air, .aq-slot')].map(e => e.textContent).join(' ');
          return { w: document.documentElement.scrollWidth, c: document.documentElement.clientWidth, btns, links, txt };
        });
        if (m.w > m.c) bad.push(h + ' ' + m.w);
        m.btns.filter(b => b[1] < 44).forEach(b => small.push(h + ':' + b.join('=')));
        m.links.filter(b => b[1] < 24).forEach(b => small.push(h + ':' + b.join('=')));
        if (SPELL.test(m.txt)) words.push(h + ': ' + SPELL.exec(m.txt)[0]);
      }
      await p.screenshot({ path: OUT + 'airtest-g-360.png' });
      ok(!bad.length, 'at 360 px nothing is wider than the screen: Heart\'s boxes, Settings, the focus, Wim Hof and sleep pages, the primer, the routine and Learn' + (bad.length ? ': ' + bad.join(', ') : ''));
      ok(!small.length, 'buttons and the field are at least 44 px tall, the tips\' links at least 24' + (small.length ? ': ' + small.join(', ') : ''));
      ok(!words.length, 'British spelling in the new words' + (words.length ? ': ' + words.join(', ') : ''));
      await p.context().close();
    }
  } catch (e) { log.push('ERROR ' + (e && e.stack || e)); }
  await browser.close();
  console.log(log.join('\n'));
  console.log(log.filter(l => l.startsWith('PASS')).length + ' passed, ' + log.filter(l => /^(FAIL|PAGEERROR|ERROR|CONSOLE)/.test(l)).length + ' problems');
  process.exit(log.some(l => /^(FAIL|PAGEERROR|ERROR|CONSOLE)/.test(l)) ? 1 : 0);
})();
