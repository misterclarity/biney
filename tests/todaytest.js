// Today, the one history, favourites, and the library with Sounds merged in (five tabs).
// Run: node tests/todaytest.js [group letter]
const { chromium, APP, OUT } = require('./pw');
const S20 = 'Mozilla/5.0 (Linux; Android 13; SM-G988B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Mobile Safari/537.36';
const mock = require('./sensor-mock');
const only = process.argv[2] || '';
const t = (p, s) => p.$eval(s, e => e.textContent.trim()).catch(() => '(missing)');
const vis = (p, s) => p.$eval(s, e => !!(e.offsetParent || e.getClientRects().length) && getComputedStyle(e).visibility !== 'hidden').catch(() => false);
const E = (p, f, a) => p.evaluate(f, a);
const go = async (p, h, ms) => { await p.evaluate(x => location.hash = x, h); await p.waitForTimeout(ms || 250); };
const hist = p => E(p, () => JSON.parse(localStorage.getItem('entrain.history') || '[]'));
const favs = p => E(p, () => JSON.parse(localStorage.getItem('entrain.favs') || '[]'));
const endNow = p => p.evaluate(() => { const b = document.querySelector('#sEnd'); b.click(); b.click(); });
const DAY = 864e5;
(async () => {
  const browser = await chromium.launch();
  const log = []; const ok = (c, m) => log.push((c ? 'PASS ' : 'FAIL ') + m);
  const page = async (opts, st, desk) => {
    const ctx = await browser.newContext(desk ? { viewport: { width: 1280, height: 900 } } : { userAgent: S20, viewport: { width: 412, height: 915 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    const p = await ctx.newPage();
    p.on('pageerror', e => log.push('PAGEERROR ' + e.message));
    p.on('console', m => { if (m.type() === 'error') log.push('CONSOLE ' + m.text()); });
    await p.addInitScript(s => {
      if (sessionStorage.getItem('seeded')) return;               // only on the first load, so a reload keeps what the app wrote
      sessionStorage.setItem('seeded', '1');
      localStorage.setItem('entrain.debug', '1'); localStorage.setItem('entrain.stereo', 'ok');
      localStorage.setItem('entrain.pOpt', JSON.stringify({ voice: false, bells: false, cues: 'off', visual: 'circle', audio: false, voiceName: '', ana: 0, rhythm: false }));
      for (const k in s) localStorage.setItem('entrain.' + k, s[k]);
    }, st || {});
    await p.addInitScript(() => { if (window.speechSynthesis) { speechSynthesis.speak = () => {}; speechSynthesis.cancel = () => {}; } });
    if (opts) await p.addInitScript(mock, opts);
    await p.goto(APP); await p.waitForTimeout(300);
    return p;
  };

  try {
    /* A. five tabs, and every old address still lands somewhere sensible */
    if (!only || only === 'A') {
      const p = await page();
      const nav = await p.$$eval('.nav a', a => a.map(x => x.textContent.trim() + '>' + x.getAttribute('href')));
      ok(nav.join(' ') === 'Today>#home Library>#practice Breathe>#breathe Heart>#heart Learn>#learn', 'five tabs: ' + nav.join(' '));
      ok(await t(p, '#viewTitle') === 'Today' && await vis(p, '#v-home') && !(await p.$('#v-sounds')), 'opens on Today; there is no Sounds view');
      await go(p, 'sounds', 350);
      const snd = await E(p, () => ({ hash: location.hash, title: document.querySelector('#viewTitle').textContent, subs: [...document.querySelectorAll('#prLib .pc-sub')].map(e => e.textContent), btn: document.querySelector('#prFbtnTxt').textContent }));
      ok(snd.hash === '#practice' && snd.title === 'Library' && snd.subs.length >= 12 && snd.subs.every(s => /track|Beats before work|Tool/.test(s)) && snd.btn === 'Filters · 1',
        'an old link to Sounds opens the library at its sounds: ' + snd.subs.length + ' items');
      await go(p, 'prime');
      ok(await t(p, '#viewTitle') === 'Custom primer' && await vis(p, '#primeStart') && /Start 10-minute prime/.test(await t(p, '#primeStart')), '#prime is the Custom primer page');
      await go(p, 'builder');
      ok(await t(p, '#viewTitle') === 'Beat builder' && /Play 20 min/.test(await t(p, '#cPlay')), '#builder is the Beat builder page, its button says how long');
      await p.fill('#cMin', '35').catch(() => {}); await p.$eval('#cMin', e => { e.value = 35; e.dispatchEvent(new Event('input')); }); await p.waitForTimeout(80);
      ok(/Play 35 min/.test(await t(p, '#cPlay')), 'and follows the length: ' + await t(p, '#cPlay'));
      await go(p, 'goal/calm', 350);
      const calm = await E(p, () => ({ hash: location.hash, on: document.querySelector('#prFilt [aria-pressed=true]').dataset.f, secs: [...document.querySelectorAll('#prLib .pr-grp')].map(g => g.dataset.g).join(',') }));
      ok(calm.hash === '#practice' && calm.on === 'calm' && /^calm/.test(calm.secs), 'a goal address opens the library at that goal: ' + JSON.stringify(calm));
      await go(p, 'today');
      ok(await t(p, '#viewTitle') === 'Today', '#today is Today too');
      await p.goBack(); await p.waitForTimeout(250);
      ok(await t(p, '#viewTitle') === 'Library', 'Back goes back to the library');
      await p.close();
    }

    /* B. the library holds the sounds: a page for each track, the tinnitus section, the two builders */
    if (!only || only === 'B') {
      const p = await page();
      await go(p, 'practice', 300);
      const secs = await p.$$eval('#prLib .pr-grp', g => g.map(x => x.dataset.g).join(','));
      ok(secs === 'sleep,calm,focus,energy,recover,reflect,tinnitus,make', 'sections: ' + secs);
      ok(/Notched Relief/.test(await t(p, '.pr-grp[data-g=tinnitus]')) && /Beat builder/.test(await t(p, '.pr-grp[data-g=make]')), 'the tinnitus track has its own section; the beat builder is under Make your own');
      await p.click('.pr-grp[data-g=calm] .pr-more'); await p.waitForTimeout(100);
      await p.click('a[href="#track/theta-meditation"]'); await p.waitForTimeout(300);
      const pg = await E(p, () => ({ title: document.querySelector('#viewTitle').textContent, kind: document.querySelector('#trBody .si-kind').textContent, how: document.querySelector('#trBody .si-main > p').textContent,
        ev: !!document.querySelector('#trBody details.ev'), cau: document.querySelector('#trBody .si-caution').textContent, go: document.querySelector('#trGo').textContent, back: document.querySelector('#trBody .si-back').textContent }));
      ok(pg.title === 'Theta Meditation' && pg.kind === 'Calm · Sound · 20 min' && /20 minutes of a steady 6 Hz theta beat/.test(pg.how) && pg.ev && /epilepsy/.test(pg.cau) && pg.go === 'Play 20 min' && pg.back === 'Library',
        'a track page: ' + JSON.stringify(pg).slice(0, 160));
      await p.click('#trGo'); await p.waitForTimeout(500);
      ok(await E(p, () => window.__entrain.A.playing && window.__entrain.A.track.id === 'theta-meditation') && await t(p, '#trGo') === 'Pause' && await p.$eval('body', b => b.classList.contains('has-player')),
        'Play plays it in the mini player, and the button says Pause');
      await p.click('#trGo'); await p.waitForTimeout(300);
      ok(/^Resume at 00:0\d$/.test(await t(p, '#trGo')), 'Pause, then the button offers to resume: ' + await t(p, '#trGo'));
      await p.click('#toggle'); await p.waitForTimeout(300);
      ok(await t(p, '#trGo') === 'Pause', 'the player and the page agree');
      await p.click('#stop'); await p.waitForTimeout(300);
      ok(await t(p, '#trGo') === 'Play 20 min', 'Stop resets it');
      // the tinnitus track wants a pitch first
      await go(p, 'track/tinnitus-notch');
      ok(/needs your tinnitus pitch/.test(await t(p, '#trNotch')), 'the notched track asks for your pitch: ' + await t(p, '#trNotch'));
      await p.click('#trGo'); await p.waitForTimeout(300);
      ok(await vis(p, '#pmModal'), 'Play opens the pitch match first');
      await p.click('#pmUse'); await p.waitForTimeout(500);
      ok(/Notch centred on \d{4} Hz/.test(await t(p, '#trNotch')) && await E(p, () => window.__entrain.A.playing), 'after the match it plays, and the page shows the notch: ' + await t(p, '#trNotch'));
      await p.click('#stop'); await p.waitForTimeout(200);
      // the headphone check from a page
      await p.click('#trBody [data-check]'); await p.waitForTimeout(200);
      ok(await vis(p, '#scModal'), '"Check yours" opens the headphone check');
      await p.keyboard.press('Escape'); await p.waitForTimeout(150);
      // search lands on the page
      await p.click('#tbFind'); await p.waitForTimeout(150); await p.fill('#fdIn', 'delta sleep'); await p.waitForTimeout(250);
      await p.click('.fd-it[href="#track/sleep-descent"]'); await p.waitForTimeout(300);
      ok(await t(p, '#viewTitle') === 'Delta Sleep' && /Lying down/.test(await t(p, '#trBody .si-need')), 'a track from search opens its page');
      await p.close();
    }

    /* C. one history: practices from before carry over; breathing, tracks and practices go in */
    if (!only || only === 'C') {
      const now = Date.now();
      const old = [{ id: 'calm-reset', at: now - 2 * DAY, secs: 600, full: true, hr0: 74, hr1: 66, coh: 2.4 }, { id: 'anapana', at: now - DAY, secs: 900, full: false }];
      const p = await page({ speed: 20, rr: true }, { practiceLog: JSON.stringify(old) });
      const h0 = await hist(p);
      ok(h0.length === 2 && h0.every(e => e.k === 'practice') && h0[0].hr1 === 66 && await E(p, () => localStorage.getItem('entrain.practiceLog')) === null,
        'the old practice log moves into the history: ' + JSON.stringify(h0[0]));
      // breathing with a sensor, sped up
      await go(p, 'breathe');
      await p.click('#bSensorBtn'); await p.waitForTimeout(400);
      await p.click('#bAdjust'); await p.waitForTimeout(250);
      await p.click('#bPanel label:has(input[name=blen][value="5"])'); await p.click('#bPanelDone'); await p.waitForTimeout(300);
      await p.click('#bStart');
      for (let i = 0; i < 160 && await t(p, '#bPhase') !== 'Done'; i++) await p.waitForTimeout(250);
      const br = (await hist(p)).filter(e => e.k === 'breath');
      ok(br.length === 1 && br[0].id === 'resonance' && br[0].full && br[0].secs >= 295 && br[0].hr0 > 0 && br[0].hr1 > 0 && br[0].coh > 0 && br[0].rate === 5.5, 'a timed breathing session goes in, with the heart: ' + JSON.stringify(br[0]));
      // a short one doesn't
      await p.click('#bStart'); await p.waitForTimeout(500); await p.click('#bReset'); await p.waitForTimeout(150);
      ok((await hist(p)).length === 3, 'a session under a minute stays out');
      // a track: two minutes listened, then stopped
      await go(p, 'track/alpha-stress');
      await p.click('#trGo'); await p.waitForTimeout(400);
      await E(p, () => { window.__entrain.A.startedAt -= 125; });
      await p.click('#stop'); await p.waitForTimeout(300);
      const tr = (await hist(p)).filter(e => e.k === 'track');
      ok(tr.length === 1 && tr[0].id === 'alpha-stress' && tr[0].secs >= 125 && tr[0].full === false, 'a track goes in with the time actually listened: ' + JSON.stringify(tr[0]));
      // the primer
      await go(p, 'prime');
      await p.click('#primeStart'); await p.waitForTimeout(400);
      await E(p, () => { window.__entrain.A.startedAt -= 300; });
      await p.click('#stop'); await p.waitForTimeout(300);
      const pr = (await hist(p)).filter(e => e.k === 'track' && e.id === 'prime');
      ok(pr.length === 1 && pr[0].beat === 14 && pr[0].band === 'Beta', 'the custom primer goes in with its beat: ' + JSON.stringify(pr[0]));
      // a paused track replaced by another still counts, once
      await go(p, 'track/deep-work');
      await p.click('#trGo'); await p.waitForTimeout(300); await E(p, () => { window.__entrain.A.startedAt -= 90; }); await p.click('#trGo'); await p.waitForTimeout(300);
      await go(p, 'track/gamma-40'); await p.click('#trGo'); await p.waitForTimeout(300); await p.click('#stop'); await p.waitForTimeout(200);
      const dw = (await hist(p)).filter(e => e.id === 'deep-work');
      ok(dw.length === 1 && dw[0].secs >= 90, 'a paused track replaced by another goes in once: ' + JSON.stringify(dw));
      // a practice ended early, after five minutes
      await go(p, 'practice/calm-reset');
      await p.click('#sGo'); await p.waitForTimeout(400);
      await E(p, () => { window.__entrain.P.t0 -= 300; }); await p.waitForTimeout(300);
      await endNow(p); await p.waitForTimeout(400);
      const pc = (await hist(p)).filter(e => e.k === 'practice' && e.at > now);
      ok(pc.length === 1 && pc[0].id === 'calm-reset' && pc[0].full === false && pc[0].secs >= 300 && (pc[0].hr0 > 0 || pc[0].hrAvg > 0), 'a practice goes in, ended early: ' + JSON.stringify(pc[0]));
      ok(!(await E(p, () => localStorage.getItem('entrain.lastSummary'))), 'nothing writes the old last-session summary');
      // Today and History
      await go(p, 'home', 350);
      const td = await E(p, () => ({ tot: document.querySelector('#tdRecentBody .hi-tot').textContent, days: document.querySelectorAll('#tdRecentBody .hi-day').length, rows: [...document.querySelectorAll('#tdRecentBody .hi-e b')].map(b => b.textContent), link: !document.querySelector('#tdRecent').hidden }));
      ok(/^7 sessions · \d+ min · 3 of 7 days$/.test(td.tot) && td.days === 7 && td.rows.join('|') === 'Calm Reset|Deep Work Block|Custom primer' && td.link, 'Today: the last 7 days and the newest three: ' + JSON.stringify(td));
      await p.click('#tdRecent .td-more'); await p.waitForTimeout(300);
      const hv = await E(p, () => ({ title: document.querySelector('#viewTitle').textContent, days: [...document.querySelectorAll('.hi-dsec h3')].map(h => h.textContent), first: document.querySelector('.hi-dsec .hi-e').textContent,
        goals: [...document.querySelectorAll('.hi-goals li span')].map(s => s.textContent), tab: document.querySelector('.nav a[aria-current]').dataset.view }));
      ok(hv.title === 'History' && hv.days[0] === 'Today' && hv.days[1] === 'Yesterday' && hv.days.length === 3 && hv.tab === 'home', 'History, a day at a time: ' + hv.days.join(' | '));
      ok(/Calm Reset/.test(hv.first) && /5 min, ended early/.test(hv.first) && /heart rate \d+/.test(hv.first), 'each entry says what it measured: ' + hv.first);
      ok(hv.goals.join() === 'Calm,Focus', 'minutes by goal this week: ' + hv.goals.join(', '));
      await p.click('.hi-dsec .hi-e a'); await p.waitForTimeout(300);
      ok(await E(p, () => location.hash) === '#practice/calm-reset' && await t(p, '#sIntro .si-back') === 'History', 'an entry opens its page, and the way back is to History');
      await p.goBack(); await p.waitForTimeout(300);
      await p.click('#hiClear'); await p.waitForTimeout(100);
      ok(await t(p, '#hiClear') === 'Tap again to clear everything' && (await hist(p)).length === 7, 'Clear asks for a second tap');
      await p.click('#hiClear'); await p.waitForTimeout(250);
      ok(await E(p, () => localStorage.getItem('entrain.history')) === null && /Nothing here yet/.test(await t(p, '#hiBody')), 'and then clears it');
      await p.close();
    }

    /* D. favourites: a star on every kind of page, kept on Today */
    if (!only || only === 'D') {
      const p = await page();
      ok(await vis(p, '#tdFavEmpty') && !(await vis(p, '#tdFavList')), 'Today says how to add favourites when there are none');
      await go(p, 'practice/calm-reset');
      const star = '#sIntro [data-fav="calm-reset"]';
      ok(await p.$eval(star, b => b.getAttribute('aria-pressed')) === 'false', 'a practice page has a star');
      await p.click(star); await p.waitForTimeout(150);
      ok(await p.$eval(star, b => b.getAttribute('aria-pressed')) === 'true' && /in your favourites/.test(await t(p, '#toastTxt')), 'starred: ' + await t(p, '#toastTxt'));
      await go(p, 'track/delta-sleep'.replace('delta-sleep', 'sleep-descent'));
      await p.click('#trBody [data-fav]'); await p.waitForTimeout(100);
      await go(p, 'prime'); await p.click('#primeFav [data-fav]'); await p.waitForTimeout(100);
      await go(p, 'breathe');
      await p.click('#bPats label:has(input[value=box])'); await p.waitForTimeout(150);
      ok(await p.$eval('#bFav [data-fav]', b => b.dataset.fav) === 'b:box', 'Breathe has a star for the pattern on screen');
      await p.click('#bFav [data-fav]'); await p.waitForTimeout(100);
      await p.click('#bPats label:has(input[value=custom])'); await p.waitForTimeout(150);
      ok(!(await p.$('#bFav [data-fav]')), 'but not for your own timings');
      ok(JSON.stringify(await favs(p)) === '["calm-reset","t:sleep-descent","x:prime","b:box"]', 'kept in the order starred: ' + JSON.stringify(await favs(p)));
      await go(p, 'home', 300);
      const fl = await p.$$eval('#tdFavList .pc-top b', b => b.map(x => x.textContent));
      ok(fl.join('|') === 'Calm Reset|Delta Sleep|Custom primer|Box 4-4-4-4' && !(await vis(p, '#tdFavEmpty')), 'Today lists them: ' + fl.join(' | '));
      await p.click('#tdFavList a[href="#practice/calm-reset"]'); await p.waitForTimeout(300);
      ok(await t(p, '#sIntro .si-back') === 'Today' && await p.$eval('#sIntro .si-back', a => a.getAttribute('href')) === '#home', 'opened from Today, the way back is to Today');
      await p.click(star); await p.waitForTimeout(100);
      await go(p, 'home', 300);
      ok(!(await p.$('#tdFavList a[href="#practice/calm-reset"]')) && (await favs(p)).length === 3, 'unstarred, it leaves Today');
      // a routine you delete leaves the favourites too
      await E(p, () => localStorage.setItem('entrain.yogaSeqs', JSON.stringify([{ uid: 'r1', name: 'Morning Mix', items: [{ id: 'tree', hold: 30 }], at: 1 }])));
      await go(p, 'practice/my-r1'); await p.click('#sIntro [data-fav]'); await p.waitForTimeout(100);
      ok((await favs(p)).includes('my-r1'), 'your own routine can be a favourite');
      await go(p, 'yoga/r1'); await p.click('#ybDel'); await p.click('#ybDel'); await p.waitForTimeout(300);
      ok(!(await favs(p)).includes('my-r1'), 'deleting it takes it out of the favourites');
      await p.close();
    }

    /* E. Recently and the goal tiles on Today */
    if (!only || only === 'E') {
      const now = Date.now();
      const h = [{ k: 'practice', id: 'nsdr', at: now - DAY, secs: 1200 }, { k: 'breath', id: 'custom', at: now - 9e6, secs: 300, rate: 7 }, { k: 'track', id: 'deep-work', at: now - 7e6, secs: 1500 },
        { k: 'breath', id: 'sigh', at: now - 5e6, secs: 300 }, { k: 'practice', id: 'nsdr', at: now - 3e6, secs: 1200 }, { k: 'test', id: 'resonance', at: now - 2e6, secs: 600, best: 5.5 }];
      const p = await page(null, { history: JSON.stringify(h), favs: JSON.stringify(['b:sigh']) });
      const rec = await p.$$eval('#tdRecentBody .hi-e', l => l.map(x => x.querySelector('b').textContent + ' / ' + x.querySelector('.hi-b span').textContent));
      ok(rec.length === 3 && /^Resonance test \/ most swing at 5\.5/.test(rec[0]) && /^Body Scan \+ Theta \/ 20 min$/.test(rec[1]) && /^Cyclic sigh \/ 5 min/.test(rec[2]),
        'Recently: the newest session of each of the last three things: ' + rec.join(' | '));
      const tiles = await p.$$eval('#tdGoals a', a => a.map(x => x.getAttribute('href') + ' ' + x.querySelector('b').textContent));
      ok(tiles.join(',') === '#goal/sleep Sleep,#goal/calm Calm,#goal/focus Focus,#goal/energy Energy,#goal/recover Recover,#goal/reflect Reflect', 'six goal tiles');
      await p.click('#tdGoals a[href="#goal/energy"]'); await p.waitForTimeout(300);
      ok(await E(p, () => document.querySelector('#prFilt [aria-pressed=true]').dataset.f) === 'energy', 'a tile opens the library at its goal');
      await go(p, 'history', 300);
      ok(/most swing at 5\.5 breaths a minute/.test(await t(p, '#hiBody')) && /Your own breathing pattern/.test(await t(p, '#hiBody')), 'the resonance test and your own timings show in History');
      await p.close();
    }

    /* F. nothing too wide, on the new pages, with content */
    if (!only || only === 'F') {
      const now = Date.now();
      const h = [{ k: 'practice', id: 'sleep-descent', at: now - 4e6, secs: 1800, hr0: 70, hr1: 58, coh: 3.1, swing: 6.2, note: 'asleep after about 12 min, about 18 min of sleep (est.)' }];
      const p = await page(null, { history: JSON.stringify(h), favs: JSON.stringify(['wim-hof', 't:tinnitus-notch', 'x:beats', 'b:478']) });
      await p.setViewportSize({ width: 360, height: 740 });
      const wide = await E(p, async () => {
        const out = [];
        for (const h of ['home', 'history', 'practice', 'track/tinnitus-notch', 'track/preop-calm', 'prime', 'builder', 'breathe']) {
          location.hash = h; await new Promise(r => setTimeout(r, 150));
          if (document.documentElement.scrollWidth > document.documentElement.clientWidth) out.push(h);
        }
        return out;
      });
      ok(!wide.length, 'nothing wider than a 360 px screen on Today, History, the library and the new pages' + (wide.length ? ': ' + wide.join(', ') : ''));
      await go(p, 'home', 300); await p.screenshot({ path: OUT + 'today-360.png', fullPage: true });
      await p.close();
      const d = await page(null, { history: JSON.stringify(h), favs: JSON.stringify(['wim-hof', 't:tinnitus-notch', 'x:beats', 'b:478']) }, true);
      await d.screenshot({ path: OUT + 'today-desk.png', fullPage: true });
      await go(d, 'history', 300); await d.screenshot({ path: OUT + 'history-desk.png', fullPage: true });
      await go(d, 'track/sleep-descent', 300); await d.screenshot({ path: OUT + 'track-desk.png', fullPage: true });
      await d.close();
    }
  } catch (e) { log.push('ERROR ' + (e.stack || e.message)); }
  await browser.close();
  console.log(log.join('\n'));
})();
