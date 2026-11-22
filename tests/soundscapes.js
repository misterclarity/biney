// Nature sounds and Sleep sounds (ambience.js, sleepsounds.js): birdsong, a stream, wind in the leaves and a crackling
// fire as background layers to mix, and a sleep sound that fades out and ends by itself.
//   A  the synthesis: every new loop made the same twice, in the worker as on the page, never silent, no clipping,
//      seamless where it joins, a stereo field, and loops of different lengths
//   B  the fade: put on an offline audio clock, it follows the curve from full to silence, stays silent after the
//      end, picks up part of the way through, and keeps its points close together on the longest time
//   C  locked on the real build: the library, the page and its cautions free to read, Play and every nature sound
//      opening the donation dialog instead, kept layers silent, the player's list, search and Settings' list
//   D  unlocked (the test copy), the background: a layer on and off, mixes with rain, Off clearing it all, the
//      player's list and the session's quick button, a practice's summary, Breathe's panel
//   E  unlocked, Sleep sounds: no headphone check, the player and the lock screen, the background kept out, another
//      sound while it plays, pause and resume, another time starting it again, and the end: it ends at its time
//      even with Open-ended on, silent by then, into the history and Today
//   F  the player's note on all-night noise (free), Today in the evening, the routines, Learn, 360 px and 44 px targets
// Run: node tests/soundscapes.js [group letter]
const { chromium, APP, OUT } = require('./pw');
const { testApp, unlockInit, unlocked } = require('./unlock-helper');
const S20 = 'Mozilla/5.0 (Linux; Android 13; SM-G988B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Mobile Safari/537.36';
const only = process.argv[2] || '';
const t = (p, s) => p.$eval(s, e => e.textContent.replace(/\s+/g, ' ').trim()).catch(() => '(missing)');
const E = (p, f, a) => p.evaluate(f, a);
const go = async (p, h, ms) => { await p.evaluate(x => location.hash = x, h); await p.waitForTimeout(ms || 400); };
const until = async (p, f, ms, a) => { try { await p.waitForFunction(f, a, { timeout: ms || 5000 }); return true; } catch (e) { return false; } };
const OPT = o => JSON.stringify(Object.assign({ voice: false, bells: false, cues: 'off', visual: 'circle', audio: false, voiceName: '', ana: 0, rhythm: false }, o || {}));
const SPELL = /\b(programs?|toward|synthesiz\w*|color\w*|favor\w*|behavior\w*|center(?:s|ed)?|organiz\w*|realiz\w*|recogniz\w*|minimiz\w*|optimiz\w*|personaliz\w*|prioritiz\w*|visualiz\w*|analyz\w*|gray|fiber|aging)\b/i;
const NEW = { pink: 12.7, stream: 14.3, wind: 19.3, fire: 15.7, fireP: 11.9, birdA: 16.9, birdB: 21.1 };
// the buttons in a group: each one's words, * when chosen, + with the cup
const seg = (p, s) => E(p, s => [...document.querySelectorAll(s)].map(b => b.textContent.trim() + (b.getAttribute('aria-pressed') === 'true' ? '*' : '') + (b.querySelector('.sup-tag') ? '+' : '')).join(' | '), s);

(async () => {
  const browser = await chromium.launch();
  const log = []; const ok = (c, m) => log.push((c ? 'PASS ' : 'FAIL ') + m);
  const URL = testApp();
  // a phone with debug on; o.url: the test copy; o.unlock: this device unlocked; o.stereo: the headphone check
  // already done (the default); o.hour: the hour Today and the player's note see; st: stored values
  const page = async (st, o) => {
    o = o || {};
    const ctx = await browser.newContext({ userAgent: S20, viewport: o.vp || { width: 412, height: 915 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    const p = await ctx.newPage();
    p.on('pageerror', e => log.push('PAGEERROR ' + e.message));
    p.on('console', m => { if (m.type() === 'error') log.push('CONSOLE ' + m.text()); });
    if (o.unlock) await unlockInit(p);
    await p.addInitScript(([s, stereo, hour]) => {
      if (!sessionStorage.getItem('z.seeded')) {
        sessionStorage.setItem('z.seeded', '1');
        localStorage.setItem('entrain.debug', '1');
        if (stereo) localStorage.setItem('entrain.stereo', 'ok');
        for (const k in s) localStorage.setItem('entrain.' + k, s[k]);
      }
      if (hour !== null) { window.__slpHour = hour; const gh = Date.prototype.getHours; Date.prototype.getHours = function () { return this.getTime() > 1e12 && Math.abs(this.getTime() - Date.now()) < 6e4 ? hour : gh.call(this); }; }
      if (window.speechSynthesis) { speechSynthesis.speak = () => {}; speechSynthesis.cancel = () => {}; }
    }, [Object.assign({ pOpt: OPT() }, st || {}), o.stereo !== false, o.hour === undefined ? null : o.hour]);
    await p.goto(o.url || APP);
    await unlocked(p);
    await p.waitForTimeout(250);
    return p;
  };

  try {
    /* A. the synthesis */
    if (!only || only === 'A') {
      const p = await page();
      const names = Object.keys(NEW);
      // each loop asked of the real worker, as the app asks for it
      await E(p, n => new Promise(res => { if (window.__entrain.amNeed(n, res)) res(); setTimeout(res, 20000); }), names);
      const R = await E(p, names => {
        const X = window.__entrain, out = {};
        const st = ch => {
          const len = ch[0].length, sr = 22050; let s = 0, pk = 0; const d = []; let lr = 0;
          for (const c of ch) for (let i = 0; i < len; i++) { s += c[i] * c[i]; pk = Math.max(pk, Math.abs(c[i])); }
          for (let i = 1; i < len; i++) d.push(Math.abs(ch[0][i] - ch[0][i - 1]));
          for (let i = 0; i < len; i++) lr = Math.max(lr, Math.abs(ch[0][i] - ch[1][i]));
          d.sort((a, b) => a - b);
          const seam = Math.max(Math.abs(ch[0][len - 1] - ch[0][0]), Math.abs(ch[1][len - 1] - ch[1][0]));
          // quietest half second: rests between bird phrases still hold a little air rather than digital silence
          let wmin = 1;
          for (let i = 0; i + sr / 2 <= len; i += sr / 2) { let e = 0; for (let j = i; j < i + sr / 2; j++) e += ch[0][j] * ch[0][j]; wmin = Math.min(wmin, Math.sqrt(e / (sr / 2))); }
          return { secs: +(len / sr).toFixed(2), rms: +Math.sqrt(s / (2 * len)).toFixed(4), peak: +pk.toFixed(3), seam: +seam.toFixed(4), p999: d[Math.floor(d.length * 0.999)], stereo: lr > 0.01, wmin: +wmin.toFixed(4) };
        };
        names.forEach(n => {
          const a = X.amRender(n, 22050, 1.8, 4), b = X.amRender(n, 22050, 1.8, 4), w = X.AM.data[n];
          let same = true, worker = !!w;
          for (let c = 0; c < 2; c++) for (let i = 0; i < a[c].length; i++) { if (a[c][i] !== b[c][i]) same = false; if (w && w[c][i] !== a[c][i]) worker = false; }
          out[n] = Object.assign(st(a), { same, worker });
        });
        return { out, isWorker: X.AM.w instanceof Worker };
      }, names);
      const bad = names.filter(n => { const r = R.out[n]; return !(r.same && r.rms > (n === 'fireP' ? 0.01 : 0.02) && r.rms < 0.15 && r.peak < 0.95 && r.stereo && r.seam <= r.p999 && Math.abs(r.secs - NEW[n]) < 0.02); });
      ok(!bad.length, 'every new loop is made the same each time, audible (root mean square 0.02 to 0.15; the fire\'s pops alone 0.01), never clipping, stereo, seamless where it joins, at its own length: ' +
        names.map(n => n + ' ' + R.out[n].secs + ' s rms ' + R.out[n].rms + ' peak ' + R.out[n].peak).join(', ') + (bad.length ? '; wrong: ' + bad.join(', ') : ''));
      ok(R.isWorker && names.every(n => R.out[n].worker), 'the worker makes exactly what the page makes, from the same functions: ' + names.filter(n => !R.out[n].worker).join(', '));
      ok(new Set(names.map(n => NEW[n])).size === names.length && names.every(n => NEW[n] >= 10 && NEW[n] <= 22), 'each loop has a length of its own, 10 to 22 seconds, so layers drift against each other rather than repeat together');
      ok(['birdA', 'birdB', 'pink', 'stream', 'wind', 'fire'].every(n => R.out[n].wmin > 0.0005), 'no half second of any bed is digital silence: ' + ['birdA', 'birdB', 'stream', 'wind', 'fire'].map(n => n + ' ' + R.out[n].wmin).join(', '));
      // the old loops still come from the same place
      const old = await E(p, () => { const X = window.__entrain, a = X.amRender('rain', 22050, 1.8, 4), r = X.amRender('rhy', 22050, 1.8, 4); return [a[0].length, r[0].length]; });
      ok(old[0] === Math.round(11.3 * 22050) && old[1] === Math.round(7.2 * 22050), 'rain and the berimbau come from the same dispatcher as before: ' + old.join(', '));
      await p.context().close();
    }

    /* B. the fade */
    if (!only || only === 'B') {
      const p = await page();
      const F = await E(p, async () => {
        const X = window.__entrain, sr = 3000;
        const render = async (at, total, extra) => {
          const ctx = new OfflineAudioContext(1, Math.ceil((total - at + extra) * sr), sr), src = ctx.createConstantSource(), g = ctx.createGain();
          src.connect(g); g.connect(ctx.destination);
          X.slpFade(g.gain, 0, at, total);
          src.start(0);
          return (await ctx.startRendering()).getChannelData(0);
        };
        const total = 900, d = await render(0, total, 20), at = s => d[Math.round(s * sr)];
        let worst = 0, mono = true;
        for (let s = 0; s <= total; s += 3) { worst = Math.max(worst, Math.abs(at(s) - X.slpLevel(s / total))); if (s && at(s) > at(s - 3) + 1e-6) mono = false; }
        let after = 0;
        for (let i = Math.round((total + 0.01) * sr); i < d.length; i++) after = Math.max(after, Math.abs(d[i]));
        const r = await render(600, total, 5), long = await render(0, 3600, 5);
        let wl = 0;
        for (let s = 0; s <= 3600; s += 7) wl = Math.max(wl, Math.abs(long[Math.round(s * sr)] - X.slpLevel(s / 3600)));
        return { start: +at(0).toFixed(3), q1: +at(225).toFixed(3), half: +at(450).toFixed(3), q3: +at(675).toFixed(3), late: +at(810).toFixed(4), end: +at(total).toFixed(4), after, worst: +worst.toFixed(4), mono,
          resume: +r[0].toFixed(3), resumeEnd: +r[Math.round(300 * sr)].toFixed(4), want: +X.slpLevel(600 / 900).toFixed(3), wl: +wl.toFixed(4) };
      });
      ok(F.start === 1 && Math.abs(F.q1 - 0.854) < 0.01 && Math.abs(F.half - 0.5) < 0.01 && Math.abs(F.q3 - 0.146) < 0.01 && F.late < 0.03 && F.end < 0.001 && F.worst < 0.005 && F.mono,
        'over 15 minutes it fades slowly at first, then faster: full, 85% at a quarter, half at half time, 15% at three quarters, nearly silent near the end, silent at 15:00, never louder again (within ' + F.worst + ' of the curve)');
      ok(F.after === 0, 'after its time it stays silent: nothing plays on');
      ok(F.resume === F.want && F.resumeEnd < 0.001, 'resumed at 10:00 it carries on from ' + F.resume + ' and is silent at 15:00');
      ok(F.wl < 0.005, 'on the hour-long fade its points stay close enough to follow the curve: within ' + F.wl);
      await p.context().close();
    }

    /* C. locked on the real build */
    if (!only || only === 'C') {
      const p = await page({ amb: 'rain', ambAdd: 'birds,fire' });
      await go(p, 'practice');
      await p.click('#prFilt [data-f=sleep]'); await p.waitForTimeout(250);
      const row = await E(p, () => { const a = document.querySelector('#prLib a[href="#sleep-sounds"]'); if (!a) return null; const li = a.closest('li');
        return { name: li.querySelector('.pc-top b').textContent, sub: li.querySelector('.pc-sub').textContent, cup: !!li.querySelector('.sup-tag'), dots: li.querySelectorAll('.strength i.on').length, blurb: li.querySelector('.pc-blurb').textContent }; });
      ok(!!row && row.name === 'Sleep sounds' && row.sub === 'Tool · 15–60 min · Lying' && row.cup && row.dots === 1 && /fading out over 15 to 60 minutes and then ending/.test(row.blurb),
        'the library lists Sleep sounds under Sleep, with the donation badge and one evidence dot: ' + JSON.stringify(row));
      await go(p, 'sleep-sounds');
      const pg = await E(p, () => { const tx = s => { const e = document.querySelector(s); return e ? e.textContent.replace(/\s+/g, ' ').trim() : '(missing)'; };
        return { title: tx('#viewTitle'), kind: tx('#slpBody .si-kind'), go: tx('#slpGo'), note: !document.querySelector('#slpSupNote').hidden, how: tx('#slpHow'), ev: tx('#slpBody .ev-body'),
          caution: tx('#slpBody .si-caution'), snd: [...document.querySelectorAll('#slpSnd button')].map(b => b.textContent + (b.getAttribute('aria-pressed') === 'true' ? '*' : '')).join('|'),
          min: [...document.querySelectorAll('#slpMin button')].map(b => b.textContent + (b.getAttribute('aria-pressed') === 'true' ? '*' : '')).join('|'), tab: document.querySelector('.nav a[aria-current]').dataset.view }; });
      ok(pg.title === 'Sleep sounds' && pg.kind === 'Sleep · Sound · 15–60 min' && pg.tab === 'practice' && pg.snd === 'Pink noise*|Rain|Crickets|Stream|Fire' && pg.min === '15 min|30 min*|45 min|60 min',
        'its page: the sounds, pink noise first, and the times, 30 minutes first: ' + pg.snd + ' / ' + pg.min);
      ok(/is silent at 30 minutes, when it ends by itself/.test(pg.how) && /Open-ended doesn't apply/.test(pg.how) && /Nobody has tested a sound that fades out like this one/.test(pg.ev) &&
        /Vickrey & Lerner 2023/.test(pg.ev) && /Keep it quiet/.test(pg.caution) && /CBT-I/.test(pg.caution), 'how it runs, the evidence as it is (untested; all-night noise may cost insight) and the caution, free to read');
      ok(pg.go === 'Unlock to play' && pg.note, 'Play reads Unlock to play, with the note under it');
      await p.click('[data-slp-snd=rain]'); await p.click('[data-slp-min="15"]'); await p.waitForTimeout(150);
      ok(await t(p, '#slpGo') === 'Unlock to play' && /silent at 15 minutes/.test(await t(p, '#slpHow')) && await E(p, () => localStorage.getItem('entrain.slpSnd') === 'rain' && localStorage.getItem('entrain.slpMin') === '15'),
        'choosing is free, and kept: rain, 15 minutes');
      await p.click('#slpGo'); await p.waitForTimeout(400);
      ok(await E(p, () => !document.querySelector('#supModal').hidden && !window.__entrain.A.playing && !window.__entrain.A.track) && /^Sleep sounds is one of the new techniques/.test(await t(p, '#supFor')),
        'Play opens the donation dialog, naming it, and nothing plays');
      await p.keyboard.press('Escape'); await p.waitForTimeout(200);
      // the nature sounds: kept from before, silent; each one opens the dialog
      await go(p, 'st-amb', 500);
      const st = await E(p, () => { const s = document.querySelector('#st-amb'); return { add: [...s.querySelectorAll('[data-amb-add]')].map(b => b.textContent + (b.getAttribute('aria-pressed') === 'true' ? '*' : '') + (b.querySelector('.sup-tag') ? '+' : '')).join(' | '),
        base: [...s.querySelectorAll('[data-amb]')].map(b => b.textContent + (b.getAttribute('aria-pressed') === 'true' ? '*' : '')).join(' | '), note: s.querySelector('.st-note').textContent, sig: window.__entrain.ambSig() }; });
      ok(st.add === 'Birdsong+ | Stream+ | Wind+ | Fire+' && st.base === 'Off | Rain* | Crickets | Both' && st.sig === 'rain' && /people differ in which natural sounds they find pleasant/.test(st.note),
        'Settings\' Background sound: Rain as before, the four nature sounds with the cup, and birdsong and fire kept from before stay silent: ' + st.add + ' / ' + st.sig);
      await p.click('#st-amb [data-amb-add=stream]'); await p.waitForTimeout(300);
      ok(await E(p, () => !document.querySelector('#supModal').hidden && localStorage.getItem('entrain.ambAdd') === 'birds,fire' && window.__entrain.ambSig() === 'rain') && /^A stream is one of the new techniques/.test(await t(p, '#supFor')),
        'a nature sound opens the donation dialog instead, and nothing changes');
      await p.keyboard.press('Escape'); await p.waitForTimeout(200);
      const sel = await E(p, () => [...document.querySelector('.amb-sel').options].map(o => o.value + ':' + o.textContent).join(' | ') + ' = ' + document.querySelector('.amb-sel').value);
      ok(sel === 'off:None | rain:Summer rain | crickets:Crickets | night:Rain and crickets | birds:Birdsong · with a donation | stream:A stream · with a donation | wind:Wind in the leaves · with a donation | fire:A crackling fire · with a donation = rain',
        'the player\'s list has each sound on its own, the new ones marked: ' + sel);
      await p.$eval('.amb-sel', s => { s.value = 'fire'; s.dispatchEvent(new Event('change', { bubbles: true })); }); await p.waitForTimeout(300);
      ok(await E(p, () => !document.querySelector('#supModal').hidden && document.querySelector('.amb-sel').value === 'rain' && window.__entrain.AMB.kind === 'rain'), 'picking one there opens the dialog too, and the list goes back to rain');
      await p.keyboard.press('Escape'); await p.waitForTimeout(200);
      // a breathing session: rain alone plays
      await go(p, 'breathe'); await p.click('#bStart'); await p.waitForTimeout(400);
      ok(await until(p, () => window.__entrain.AMB.playing === 'rain' && window.__entrain.AMB.srcs.length === 1, 6000), 'under a breathing session only the rain plays until this device is unlocked');
      await p.click('#bStart'); await p.waitForTimeout(300);
      // search and Settings' list
      await p.click('#tbFind'); await p.fill('#fdIn', 'sleep sounds'); await p.waitForTimeout(300);
      const f1 = await E(p, () => { const a = document.querySelector('#fdRes .fd-it'); return a ? a.getAttribute('href') + (a.querySelector('.sup-tag') ? ' +' : '') : ''; });
      await p.fill('#fdIn', 'birdsong'); await p.waitForTimeout(300);
      const f2 = await E(p, () => [...document.querySelectorAll('#fdRes .fd-it')].map(a => a.getAttribute('href')).slice(0, 4));
      await p.fill('#fdIn', 'fireplace'); await p.waitForTimeout(300);
      const f3 = await E(p, () => [...document.querySelectorAll('#fdRes .fd-it')].map(a => a.getAttribute('href')).slice(0, 4));
      await p.keyboard.press('Escape');
      ok(f1 === '#sleep-sounds +' && f2.includes('#st-amb') && f3.includes('#st-amb'), 'search finds Sleep sounds (with the cup) and the nature sounds by name: ' + [f1, f2.join(' '), f3.join(' ')].join(' / '));
      await go(p, 'st-supporter', 450);
      const list = await E(p, () => [...document.querySelectorAll('#supList a')].map(a => a.textContent + '>' + a.getAttribute('href')));
      ok(list.includes('Nature sounds in the background>#st-amb') && list.includes('Sleep sounds>#sleep-sounds'), 'Settings\' New techniques lists them: ' + list.slice(-3).join(', '));
      await p.context().close();
    }

    /* D. unlocked: the background */
    if (!only || only === 'D') {
      const p = await page({}, { url: URL, unlock: true });
      await go(p, 'st-amb', 500);
      ok(await seg(p, '#st-amb [data-amb-add]') === 'Birdsong | Stream | Wind | Fire' && await E(p, () => window.__entrain.SUP.ok), 'unlocked: the nature sounds have no cup');
      await p.click('#st-amb [data-amb-add=birds]');
      ok(await until(p, () => window.__entrain.AMB.playing === 'birds' && window.__entrain.AMB.srcs.length === 2, 8000), 'Birdsong on its own: a five-second taste of its two loops, near and far');
      ok(await E(p, () => localStorage.getItem('entrain.ambAdd') === 'birds' && window.__entrain.AMB.kind === 'off') && await seg(p, '#st-amb [data-amb]') === 'Off | Rain | Crickets | Both' && await seg(p, '#st-amb [data-amb-add]') === 'Birdsong* | Stream | Wind | Fire',
        'kept, and with it on its own Off isn\'t shown as chosen');
      await p.click('#st-amb [data-amb=rain]'); await p.click('#st-amb [data-amb-add=fire]');
      ok(await until(p, () => window.__entrain.AMB.playing === 'rain+birds+fire' && window.__entrain.AMB.srcs.length === 5, 8000), 'rain with birdsong and fire: one mix of five loops');
      ok(await E(p, () => document.querySelector('.amb-sel').value === 'mix' && document.querySelector('.amb-sel option[value=mix]').textContent === 'Rain, birdsong and fire'), 'the player\'s list names the mix');
      await p.click('#st-amb [data-amb-add=birds]'); await p.waitForTimeout(200);
      ok(await E(p, () => window.__entrain.ambSig() === 'rain+fire' && localStorage.getItem('entrain.ambAdd') === 'fire'), 'a second tap takes one out again');
      await p.click('#st-amb [data-amb=off]'); await p.waitForTimeout(200);
      ok(await E(p, () => window.__entrain.ambSig() === '' && localStorage.getItem('entrain.ambAdd') === '' && localStorage.getItem('entrain.amb') === 'off') && await seg(p, '#st-amb [data-amb]') === 'Off* | Rain | Crickets | Both',
        'Off turns all of it off, the nature sounds too');
      await p.$eval('.amb-sel', s => { s.value = 'stream'; s.dispatchEvent(new Event('change', { bubbles: true })); });
      ok(await until(p, () => window.__entrain.AMB.playing === 'stream', 8000) && await seg(p, '#st-amb [data-amb-add]') === 'Birdsong | Stream* | Wind | Fire', 'the player\'s list picks the stream on its own, and the buttons follow');
      // a practice: its summary, and the quick button through every sound
      await go(p, 'practice/calm-reset');
      if (await p.$('#sOptsBtn[aria-expanded=false]')) await p.click('#sOptsBtn');
      await p.click('#sOpts [data-amb=night]'); await p.click('#sOpts [data-amb-add=wind]'); await p.waitForTimeout(250);
      ok(/Rain and crickets, stream and wind/.test(await t(p, '#sOptsSum')) || /Rain and crickets, stream and wind/.test(await t(p, '#sOpts')), 'a practice\'s options say what plays under it: ' + (await t(p, '#sOptsSum')).slice(0, 120));
      await p.click('#sGo'); await p.waitForTimeout(500);
      ok(await until(p, () => window.__entrain.AMB.playing === 'night+stream+wind', 8000) && await t(p, '#sqAmbTxt') === 'Mix', 'it plays under the practice, and the quick button says Mix');
      const cyc = [];
      for (let i = 0; i < 9; i++) { await p.click('#sqAmb'); await p.waitForTimeout(120); cyc.push(await t(p, '#sqAmbTxt')); }
      ok(cyc.join(' > ') === 'Background > Rain > Crickets > Rain + crickets > Birdsong > Stream > Wind > Fire > Background', 'unlocked, the quick button steps through every sound on its own: ' + cyc.join(' > '));
      await p.click('#sEnd'); await p.click('#sEnd'); await p.waitForTimeout(400);
      await go(p, 'breathe'); await p.click('#bAdjust'); await p.waitForTimeout(300);
      ok(await seg(p, '#bPanel [data-amb-add]') === 'Birdsong | Stream | Wind | Fire', 'Breathe\'s settings have them too');
      await p.screenshot({ path: OUT + 'soundscapes-d-breathe.png' });
      await p.context().close();
    }

    /* E. unlocked: Sleep sounds */
    if (!only || only === 'E') {
      const p = await page({ amb: 'crickets', slpSnd: 'rain', slpMin: '15' }, { url: URL, unlock: true, stereo: false });
      await go(p, 'sleep-sounds');
      ok(await t(p, '#slpGo') === 'Play 15 min' && await E(p, () => document.querySelector('#slpSupNote').hidden), 'unlocked: Play 15 min, as kept');
      await p.click('#slpGo');
      ok(await until(p, () => { const A = window.__entrain.A; return A.playing && A.vx && A.master.gain.value > 0.05; }, 8000), 'it plays at once, with no headphone check');
      const s1 = await E(p, () => { const X = window.__entrain, A = X.A, tx = s => document.querySelector(s).textContent.replace(/\s+/g, ' ').trim(), vis = s => { const e = document.querySelector(s); return !!e && e.offsetParent !== null && getComputedStyle(e).display !== 'none'; };
        document.querySelector('#pMore').click();
        return { sc: !document.querySelector('#scModal').hidden, name: tx('#pName'), sub: tx('#pSub'), ears: [...document.querySelectorAll('.ears .ear')].filter(e => !e.hidden && getComputedStyle(e).display !== 'none').map(e => e.textContent.replace(/\s+/g, ' ').trim()).join(' | '),
          vol: vis('#vol'), noise: vis('#noiseLab'), open: vis('.p-open'), bg: vis('.amb-pl'), recheck: vis('#scOpen'), track: A.track.sleep && A.track.snd + ' ' + A.track.minutes, fb: +X.SLP.fb.gain.value.toFixed(3),
          amb: X.AMB.playing, beat: X.beatPlaying(), go: tx('#slpGo'), md: navigator.mediaSession.metadata ? navigator.mediaSession.metadata.title + ' / ' + navigator.mediaSession.metadata.album : '' }; });
      ok(!s1.sc && s1.name === 'Sleep sounds' && s1.sub === 'Rain · fades out over 15 min' && s1.ears === 'Sound Rain | Level 100%' && s1.track === 'rain 15' && s1.fb > 0.99,
        'the player: Sleep sounds, rain fading out over 15 minutes, its sound and its level: ' + s1.ears);
      ok(s1.vol && !s1.noise && !s1.open && !s1.bg && !s1.recheck && !s1.beat, 'the volume, but no pink-noise bed, no Open-ended, no background choice and no headphone re-check beside it; it isn\'t a beat');
      ok(s1.amb === null && s1.go === 'Pause' && s1.md === 'Sleep sounds / Rain · fades out over 15 min', 'the background (crickets) stays out of it; the page says Pause; the lock screen names it: ' + s1.md);
      await p.screenshot({ path: OUT + 'soundscapes-e-playing.png' });
      // another sound, then pause and resume
      await p.click('[data-slp-snd=fire]');
      ok(await until(p, () => { const A = window.__entrain.A; return A.track.snd === 'fire' && A.vx && A.vx.some(n => n.buffer && n.buffer.duration > 15.6 && n.buffer.duration < 15.8); }, 8000), 'another sound while it plays: the fire takes over');
      const s2 = await E(p, () => ({ sub: document.querySelector('#pSub').textContent, md: navigator.mediaSession.metadata.album, el: window.__entrain.A.elapsed, kept: localStorage.getItem('entrain.slpSnd') }));
      ok(s2.sub === 'Fire · fades out over 15 min' && s2.md === 'Fire · fades out over 15 min' && s2.kept === 'fire', 'the player and the lock screen follow, and it\'s kept');
      await p.click('#slpGo'); await p.waitForTimeout(500);
      ok(await E(p, () => !window.__entrain.A.playing) && /^Resume at 00:0\d$/.test(await t(p, '#slpGo')), 'Pause, then the page offers to resume: ' + await t(p, '#slpGo'));
      await p.click('#slpGo');
      ok(await until(p, () => window.__entrain.A.playing && window.__entrain.A.vx, 5000), 'and it resumes');
      await p.click('[data-slp-min="45"]'); await p.waitForTimeout(400);
      ok(await E(p, () => { const A = window.__entrain.A; return A.playing && A.track.minutes === 45 && A.elapsed < 2; }) && await t(p, '#pSub') === 'Fire · fades out over 45 min', 'another time while it plays starts it again with that time');
      // near the end, with Open-ended on: it still ends at its time, silent by then, into the history
      await E(p, () => { document.querySelector('#openEnded').checked = true; document.querySelector('#openEnded').dispatchEvent(new Event('change')); });
      await E(p, () => { const X = window.__entrain; window.__pause = 1; document.querySelector('#toggle').click(); });
      await p.waitForTimeout(300);
      await E(p, () => { const A = window.__entrain.A; A.elapsed = A.track.minutes * 60 - 6; document.querySelector('#toggle').click(); });
      await p.waitForTimeout(600);
      const near = await E(p, () => { const X = window.__entrain; return { fb: X.SLP.fb.gain.value, lvl: document.querySelector('#pR').textContent, time: document.querySelector('#time').textContent }; });
      ok(near.fb < 0.001 && near.lvl === '0%' && /^00:0[456]$/.test(near.time), 'six seconds from the end with Open-ended on, it counts down, nearly silent: level ' + near.lvl + ', ' + near.time + ' left');
      ok(await until(p, () => !window.__entrain.A.playing, 12000), 'and it ends at its time');
      const h = await E(p, () => { const l = JSON.parse(localStorage.getItem('entrain.history') || '[]'), e = l.filter(x => x.id === 'sleep').pop(); return e ? { k: e.k, snd: e.snd, full: e.full, min: Math.round(e.secs / 60) } : null; });
      ok(!!h && h.k === 'track' && h.snd === 'fire' && h.full && h.min === 45, 'the history keeps it: ' + JSON.stringify(h));
      await go(p, 'history', 500);
      const row = await E(p, () => { const a = document.querySelector('#v-history a[href="#sleep-sounds"]'); return a ? a.closest('li, .hi').textContent.replace(/\s+/g, ' ').trim() : ''; });
      ok(/Sleep sounds/.test(row) && /a crackling fire/.test(row), 'History shows it, with its sound: ' + row.slice(0, 80));
      await go(p, 'home', 500);
      ok(!!(await p.$('#tdRecent a[href="#sleep-sounds"]')), 'and Today\'s Recently');
      await p.context().close();
    }

    /* F. the player's note, Today, the routines, Learn, and the phone */
    if (!only || only === 'F') {
      // the note: free, so on the real build
      const p = await page({}, { hour: 23 });
      await go(p, 'track/alpha-stress'); await p.click('#trGo'); await p.waitForTimeout(500);
      await p.click('#pMore'); await p.waitForTimeout(200);
      const note = () => E(p, () => !document.querySelector('#pNight').hidden);
      await E(p, () => { const o = document.querySelector('#openEnded'); o.checked = true; o.dispatchEvent(new Event('change')); });
      const n1 = await note();
      await E(p, () => { const o = document.querySelector('#noise'); o.checked = true; o.dispatchEvent(new Event('change')); });
      const n2 = await note(), txt = await t(p, '#pNight');
      await E(p, () => { window.__slpHour = 14; const o = document.querySelector('#openEnded'); o.checked = false; o.dispatchEvent(new Event('change')); o.checked = true; o.dispatchEvent(new Event('change')); });
      const n3 = await note();
      ok(!n1 && n2 && !n3, 'late at night, Open-ended with the pink-noise bed under a track brings a note; without noise, or in the afternoon, none');
      ok(/^All night is a long time for noise\./.test(txt) && /may cost some of the insight sleep brings/.test(txt) && await E(p, () => !!document.querySelector('#pNight a[href="#sleep-sounds"]') && !!document.querySelector('#pNight a[href="#l-sleepsnd"]')),
        'it says why, and points to Sleep sounds and to Learn: ' + txt.slice(0, 60) + '…');
      await p.click('#stop'); await p.context().close();
      // Today in the evening and in the morning, the routines, Learn
      const q = await page({}, { hour: 22 });
      await go(q, 'home', 500);
      const ev = await E(q, () => { const a = document.querySelector('#sgSnd'); return { shown: !a.hidden, href: a.getAttribute('href'), txt: a.textContent, cup: !!a.querySelector('.sup-tag'), when: document.querySelector('#sgWhen').textContent }; });
      ok(ev.shown && ev.href === '#sleep-sounds' && ev.txt === 'Sleep sounds, fading out' && ev.cup && ev.when === 'Tonight', 'Today at night: the suggestion leads to Sleep sounds too, with the cup');
      await go(q, 'living/sleep-habits', 600);
      const lv = await E(q, () => [...document.querySelectorAll('#v-living a.lv-chip[href="#sleep-sounds"]')].map(a => a.closest('li').querySelector('b').textContent + (a.querySelector('.sup-tag') ? '+' : '')));
      ok(lv.join(' | ') === 'A bed for sleep+ | Lights out+', 'the sleep habits and the evening routine lead to it, with the cup: ' + lv.join(' | '));
      await go(q, 'l-sleepsnd', 600);
      const ln = await E(q, () => { const sec = id => { const h = document.getElementById(id), out = []; let e = h.nextElementSibling; while (e && e.tagName === 'P') { out.push(e.textContent.replace(/\s+/g, ' ')); e = e.nextElementSibling; } return out.join(' '); };
        const toc = [...document.querySelectorAll('.toc a')].map(a => a.getAttribute('href'));
        return { nature: sec('l-nature'), sleep: sec('l-sleepsnd'), toc: toc.indexOf('#l-nature') > toc.indexOf('#l-voice') && toc.indexOf('#l-sleepsnd') === toc.indexOf('#l-nature') + 1,
          cup: !!document.querySelector('#l-sleepsnd ~ p a[href="#sleep-sounds"] + .sup-tag'), fire: document.querySelector('#lnGlance a[href="#l-nature"]') !== null }; });
      ok(ln.toc && /\(Ratcliffe, 2021\)/.test(ln.nature) && /\(Lynn, 2014\)/.test(ln.nature) && /crackle on its own hasn't been tested/.test(ln.nature) &&
        /\(Vickrey & Lerner, 2023\)/.test(ln.sleep) && /\(Harlow et al., 2023\)/.test(ln.sleep) && /\(Levitt et al., 2026\)/.test(ln.sleep) && ln.cup && ln.fire,
        'Learn: nature sounds and sound and sleep, in the contents, with their studies, the fire\'s crackle untested on its own, and the link to Sleep sounds carrying the cup');
      ok(!SPELL.test(ln.nature + ln.sleep) && !SPELL.test(await t(q, '#pNight')), 'British spelling in Learn\'s new sections and the note');
      await q.context().close();
      // 360 px: nothing too wide, every new control 44 px tall
      const r = await page({}, { url: URL, unlock: true, vp: { width: 360, height: 740 } });
      const wide = [], small = [];
      for (const h of ['sleep-sounds', 'st-amb', 'breathe', 'practice/calm-reset']) {
        await go(r, h, 500);
        if (h === 'breathe') { await r.click('#bAdjust'); await r.waitForTimeout(300); }
        if (h === 'practice/calm-reset' && await r.$('#sOptsBtn[aria-expanded=false]')) { await r.click('#sOptsBtn'); await r.waitForTimeout(200); }
        const m = await E(r, () => ({ w: document.documentElement.scrollWidth > document.documentElement.clientWidth, s: [...document.querySelectorAll('[data-amb-add], [data-slp-snd], [data-slp-min], #slpGo')].filter(b => b.offsetParent && b.getBoundingClientRect().height < 44).map(b => b.textContent) }));
        if (m.w) wide.push(h);
        small.push(...m.s);
      }
      ok(!wide.length && !small.length, 'at 360 px nothing is wider than the screen, and every new button is at least 44 px tall' + (wide.length ? ': too wide ' + wide.join(', ') : '') + (small.length ? ': small ' + small.join(', ') : ''));
      await go(r, 'sleep-sounds', 500);
      ok(await E(r, () => document.querySelector('#viewTitle').scrollWidth <= document.querySelector('#viewTitle').clientWidth + 1) && !SPELL.test(await t(r, '#slpBody')), 'its name fits the top bar at 360 px; British spelling on the page');
      await r.screenshot({ path: OUT + 'soundscapes-f-page.png', fullPage: true });
      await r.context().close();
    }
  } catch (e) { log.push('ERROR ' + (e && e.stack || e)); }
  await browser.close();
  console.log(log.join('\n'));
  console.log(log.filter(l => l.startsWith('PASS')).length + ' passed, ' + log.filter(l => /^(FAIL|PAGEERROR|ERROR|CONSOLE)/.test(l)).length + ' problems');
  process.exit(log.some(l => /^(FAIL|PAGEERROR|ERROR|CONSOLE)/.test(l)) ? 1 : 0);
})();
