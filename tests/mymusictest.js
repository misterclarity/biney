// Your own music and breath-led sound (yourmusic.js, breathled.js): songs from the device kept in the browser's own
// database and played under any session, with thumbs after a session; and on Breathe, music whose chords follow your
// breath while the guide starts at your own pace and slows towards your resonance pace.
//   A  locked on the real build: Settings' Your own music free to read, Add music with the cup opening the dialog and
//      no file picker; no Yours under Music; Breathe's Breath-led sound switch with the cup and Experimental, opening
//      the dialog and staying off; choices kept from before doing nothing; Music Break's Yours; search, Settings' list,
//      Learn's section with its reference and the glance table's row
//   B  unlocked: adding songs (not a sound file, one this browser can't play, one twice), kept in the database with
//      their names in the list; Yours under Music and in the player's list; a taste; under Breathe, at the background's
//      volume, through a pause, I need to stop; the thumbs under the guide; the pick weighted by them; removing a song
//   C  unlocked: a practice's own Yours and its end screen's thumbs; Music Break to your own songs, softer for the
//      closing words, and gone in half a second with I need to stop; a backup's names on another device, a song taking
//      its file back with its thumbs; a list lost and found again from the database
//   D  the belly's breath from the motion sensor's readings (blsTilt): its level, its swing, still when the phone is
//   E  unlocked: breath-led sound with the phone on your belly: finding your pace, the guide starting at it, which way
//      is in learnt from the guide, the chords following the belly itself, slowing towards your resonance pace, holding
//      while you're faster, a pause, a pattern picked by hand, the end and the history; Begin now; no motion sensor;
//      the microphone; a practice using the guide left alone; I need to stop, while it waits for your pace too
//   F  360 px, 44 px targets, British spelling
// Run: node tests/mymusictest.js [group letter]
const { chromium, APP, OUT } = require('./pw');
const sensor = require('./sensor-mock');
const motMock = require('./motion-mock');
const micMock = require('./mic-mock');
const { testApp, unlockInit, unlocked } = require('./unlock-helper');
const S20 = 'Mozilla/5.0 (Linux; Android 13; SM-G988B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Mobile Safari/537.36';
const only = process.argv[2] || '';
const t = (p, s) => p.$eval(s, e => e.textContent.replace(/\s+/g, ' ').trim()).catch(() => '(missing)');
const E = (p, f, a) => p.evaluate(f, a);
const go = async (p, h, ms) => { await p.evaluate(x => location.hash = x, h); await p.waitForTimeout(ms || 400); };
const until = async (p, f, ms, a) => { try { await p.waitForFunction(f, a, { timeout: ms || 5000 }); return true; } catch (e) { return false; } };
const OPT = o => JSON.stringify(Object.assign({ voice: false, bells: false, cues: 'off', visual: 'circle', audio: false, voiceName: '', ana: 0, rhythm: false }, o || {}));
const RE = /n't\b|\b(do not|never|nothing|without|stop|avoid|none)\b|feel the breath/i;
const SPELL = /\b(programs?|toward|synthesiz\w*|color\w*|favor\w*|behavior\w*|center(?:s|ed)?|organiz\w*|realiz\w*|recogniz\w*|minimiz\w*|optimiz\w*|personaliz\w*|prioritiz\w*|visualiz\w*|analyz\w*|gray|fiber|aging)\b/i;
const seg = (p, s) => E(p, s => [...document.querySelectorAll(s)].map(b => b.textContent.trim() + (b.getAttribute('aria-pressed') === 'true' ? '*' : '') + (b.querySelector('.sup-tag') ? '+' : '')).join(' | '), s);

// a song: secs of a soft tone at hz, 16-bit mono WAV at 8 kHz, as a file for the picker
function wav(name, secs, hz) {
  const sr = 8000, n = Math.round(sr * secs), b = Buffer.alloc(44 + n * 2);
  b.write('RIFF', 0); b.writeUInt32LE(36 + n * 2, 4); b.write('WAVE', 8); b.write('fmt ', 12); b.writeUInt32LE(16, 16); b.writeUInt16LE(1, 20); b.writeUInt16LE(1, 22);
  b.writeUInt32LE(sr, 24); b.writeUInt32LE(sr * 2, 28); b.writeUInt16LE(2, 32); b.writeUInt16LE(16, 34); b.write('data', 36); b.writeUInt32LE(n * 2, 40);
  for (let i = 0; i < n; i++) b.writeInt16LE(Math.round(6000 * Math.sin(2 * Math.PI * hz * i / sr) * Math.min(1, i / 800, (n - i) / 800)), 44 + i * 2);
  return { name, mimeType: 'audio/wav', buffer: b };
}
const SONG_A = wav('Morning_Light.wav', 40, 330), SONG_B = wav('Evening Tide.wav', 40, 262);
const NOTES = { name: 'notes.txt', mimeType: 'text/plain', buffer: Buffer.from('not a song') };
const BROKEN = { name: 'broken.mp3', mimeType: 'audio/mpeg', buffer: Buffer.from('this is not audio at all, just words in a file named like a song') };

(async () => {
  const browser = await chromium.launch();
  const log = []; const ok = (c, m) => log.push((c ? 'PASS ' : 'FAIL ') + m);
  const URL = testApp();
  // a phone (or a desktop) with debug on; o.unlock: the test copy, unlocked; o.speed: the page's clock that much faster;
  // o.mot: the motion sensor's stand-in; o.mic: the microphone's; st: stored values
  const page = async (st, o) => {
    o = o || {};
    const ctx = o.ctx || await browser.newContext(o.desk ? { viewport: { width: 1280, height: 900 } } : { userAgent: S20, viewport: o.vp || { width: 412, height: 915 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
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
    if (o.speed) await p.addInitScript(sensor, { speed: o.speed });
    if (o.mot) await p.addInitScript(motMock, o.mot);
    if (o.mic) await p.addInitScript(micMock, o.mic);
    await p.goto(o.unlock ? URL : APP);
    if (o.unlock) await unlocked(p);
    await p.waitForTimeout(350);
    return p;
  };
  // songs added through Settings' Add music and the file picker; the message after
  const addSongs = async (p, files) => {
    await go(p, 'st-mymusic', 500);
    const [fc] = await Promise.all([p.waitForEvent('filechooser', { timeout: 4000 }), p.click('#ymAdd')]);
    await fc.setFiles(files);
    await until(p, () => !window.__entrain.YM.busy && !/^Adding/.test(document.querySelector('#ymMsg').textContent), 15000);
    await p.waitForTimeout(200);
    return t(p, '#ymMsg');
  };
  const Y = p => E(p, () => { const Y = window.__entrain.YM, el = Y.el; return { on: Y.on, cur: Y.cur, name: (Y.list.find(s => s.id === Y.cur) || {}).name || '', paused: el ? el.paused : true, at: el ? +el.currentTime.toFixed(2) : 0, g: Y.g ? +Y.g.gain.value.toFixed(2) : -1, lv: Y.lv, out: Y.out ? +Y.out.gain.value.toFixed(3) : -1, taste: Y.taste }; });

  try {
    /* A. locked on the real build */
    if (!only || only === 'A') {
      const p = await page({ music: 'own', breathLed: '1' });
      let chooser = 0; p.on('filechooser', () => chooser++);
      await go(p, 'st-mymusic', 600);
      const st = await E(p, () => { const c = document.querySelector('#st-mymusic'); return { h: c.querySelector('h2').textContent, txt: c.textContent.replace(/\s+/g, ' '), tag: !!c.querySelector('#ymAdd .sup-tag'), why: !!c.querySelector('a[href="#l-mymusic"]') }; });
      ok(st.h === 'Your own music' && /Music you like does more for you/.test(st.txt) && /nothing is uploaded/.test(st.txt) && /A backup keeps their names and your thumbs, not the files/.test(st.txt) && st.tag && st.why && /No songs yet/.test(st.txt),
        'Settings has Your own music, free to read, with Add music carrying the Donation badge: ' + st.txt.slice(0, 120));
      await p.click('#ymAdd'); await p.waitForTimeout(400);
      ok(await E(p, () => !document.querySelector('#supModal').hidden) && /^Your own music is one of the new techniques/.test(await t(p, '#supFor')) && chooser === 0, 'Add music opens the donation dialog by name, and no file picker');
      await p.keyboard.press('Escape'); await p.waitForTimeout(200);
      ok(await seg(p, '#st-amb .mus-seg button') === 'Off* | Matched+ | Slow+ | Steady+ | Lively+' && await E(p, () => !window.__entrain.YM.on && window.__entrain.YM.list.length === 0),
        'with no song on this device the Music row has no Yours, and a kept choice of Yours shows Off and plays nothing: ' + await seg(p, '#st-amb .mus-seg button'));
      // Breathe: the switch
      await go(p, 'breathe', 500);
      const bl = await E(p, () => ({ lab: document.querySelector('#bLedOpt .prime-label').textContent, cup: !!document.querySelector('#bLedL .sup-tag'), on: document.querySelector('#bLedOn').checked, row: document.querySelector('#bLedRow').hidden, src: document.querySelector('#bLedSrcRow').hidden, small: document.querySelector('#bLedOpt small').textContent }));
      ok(/Breath-led sound/.test(bl.lab) && /Experimental/.test(bl.lab) && bl.cup && !bl.on && bl.row && bl.src && /swell as you breathe in and ebb as you breathe out/.test(bl.small),
        'Breathe\'s settings have Breath-led sound, marked Experimental, its switch with the cup and off, though kept on from before: ' + bl.small);
      await E(p, () => document.querySelector('#bLedOn').click()); await p.waitForTimeout(400);
      ok(await E(p, () => !document.querySelector('#supModal').hidden && !document.querySelector('#bLedOn').checked && !window.__entrain.MOT.belly && !window.__entrain.MIC.on) && /^Breath-led sound is one of the new techniques/.test(await t(p, '#supFor')),
        'turning it on opens the dialog by name, and it stays off, listening to nothing');
      await p.keyboard.press('Escape'); await p.waitForTimeout(200);
      await p.click('#bStart'); await p.waitForTimeout(600);
      ok(await E(p, () => window.__entrain.B.state === 'running' && window.__entrain.BLS.phase === 'off' && !window.__entrain.MUS.on && document.querySelector('#bPhase').textContent !== 'Breathe as usual'),
        'Start breathing starts the guide as ever: no waiting for your pace, no music');
      await p.click('#bReset'); await p.waitForTimeout(200);
      // Music Break's own choice, search, Settings' list
      await go(p, 'practice/music-break', 500);
      ok(await seg(p, '#sOpts [data-choice=tempo] button') === 'Slow* | Steady | Lively | Yours', 'Music Break offers Yours beside its tempos: ' + await seg(p, '#sOpts [data-choice=tempo] button'));
      await p.click('#sOpts [data-choice=tempo] button[data-v=own]'); await p.waitForTimeout(250);
      const mbn = await t(p, '#sOpts [data-choice=tempo]') + ' / ' + await E(p, () => document.querySelector('#sOpts [data-choice=tempo]').parentNode.textContent);
      ok(/once you add some under Your own music in Settings; until then it plays slow music made on your device/.test(mbn), 'with no songs here, it says it plays slow music until you add some: ' + mbn);
      await p.click('#sGo'); await p.waitForTimeout(350);
      ok(await E(p, () => !document.querySelector('#supModal').hidden && window.__entrain.P.state !== 'running'), 'and Start still opens the dialog');
      await p.keyboard.press('Escape'); await p.waitForTimeout(200);
      const found = {};
      for (const q of ['my own songs', 'breath-led']) {
        await p.click('#tbFind'); await p.fill('#fdIn', q); await p.waitForTimeout(350);
        found[q] = await E(p, () => [...document.querySelectorAll('#fdRes .fd-it')].slice(0, 4).map(a => (a.querySelector('b') || a).textContent.trim() + '>' + a.getAttribute('href') + (a.querySelector('.sup-tag') ? '+' : '')));
        await p.keyboard.press('Escape'); await p.waitForTimeout(150);
      }
      ok(found['my own songs'].some(x => /^Your own music.*>#st-mymusic\+$/.test(x)) && found['breath-led'].some(x => /^Breath-led sound.*>#breathe\+$/.test(x)), 'search finds both, with the cup: ' + JSON.stringify(found));
      await go(p, 'st-supporter', 450);
      const list = await E(p, () => [...document.querySelectorAll('#supList a')].map(a => a.textContent + '>' + a.getAttribute('href')));
      ok(list.includes('Your own music>#st-mymusic') && list.includes('Breath-led sound>#breathe'), 'Settings\' New techniques lists both');
      // Learn
      await go(p, 'l-mymusic', 600);
      const L = await E(p, () => {
        const h = document.querySelector('#l-mymusic'), ps = []; let n = h.nextElementSibling;
        while (n && n.tagName === 'P') { ps.push(n.textContent.replace(/\s+/g, ' ')); n = n.nextElementSibling; }
        const ref = [...document.querySelectorAll('#references li')].find(li => li.textContent.startsWith('Leslie, G., Ghandeharioun'));
        const r = [...document.querySelectorAll('#lnGlance tr.ln-row')].find(x => x.querySelector('th b').textContent === 'Music you choose yourself');
        return { h: h.textContent, ps, toc: !!document.querySelector('.toc a[href="#l-mymusic"]'), view: !document.querySelector('#v-learn').hidden && document.querySelector('#supModal').hidden,
          ref: ref ? ref.textContent.replace(/\s+/g, ' ') : '', doi: !!(ref && ref.querySelector('a[href="https://doi.org/10.1109/ACII.2019.8925531"]')),
          row: r ? [...r.children[2].querySelectorAll('a')].map(a => a.getAttribute('href')).join(' ') + ' | ' + r.children[1].textContent + ' | ' + r.children[2].classList.contains('ln-lo') : '' };
      });
      ok(L.view && L.toc && L.h === 'Your own music, and music that follows your breath' && L.ps.length === 3, 'Learn has the section, in its contents, free to read: ' + L.h + ', ' + L.ps.length + ' paragraphs');
      ok(/strongest for stress relief/.test(L.ps[0]) && /Kučikienė & Praninskienė, 2018/.test(L.ps[0]) && /nothing is uploaded/.test(L.ps[0]) && /up to five times as often/.test(L.ps[0]) &&
        /19 adults/.test(L.ps[1]) && /three quarters of each person's own breathing rate/.test(L.ps[1]) && /\(Leslie et al\., 2019\)/.test(L.ps[1]) && /early but promising/.test(L.ps[1]) &&
        /experimental/.test(L.ps[2]) && /hasn't been tested/.test(L.ps[2]) && /a breath a minute each minute/.test(L.ps[2]),
        'it says what the guide rates and why, the study with its numbers, the guide\'s "early but promising", and that Entrain\'s version is untested');
      ok(/^Leslie, G., Ghandeharioun, A., Zhou, D., & Picard, R. W. \(2019\)\. Engineering music to slow breathing and invite relaxed physiology\./.test(L.ref) && L.doi, 'its reference, with the DOI: ' + L.ref.slice(0, 90));
      ok(L.row === '#st-mymusic #practice/music-break | Strong | false', 'the glance table\'s Music you choose yourself now links to Your own music and Music Break, its evidence still Strong: ' + L.row);
      await p.context().close();
    }

    /* B. unlocked: songs, under Breathe, the thumbs, the pick */
    if (!only || only === 'B') {
      const p = await page({}, { url: URL, unlock: true });
      const said = await addSongs(p, [SONG_A, NOTES, BROKEN, SONG_B]);
      const S = await E(p, () => ({ list: window.__entrain.YM.list.map(s => s.name + ':' + s.secs), here: Object.keys(window.__entrain.YM.here).length,
        kept: JSON.parse(localStorage.getItem('entrain.myMusic') || '[]').map(s => s.name).join(','), rows: [...document.querySelectorAll('#ymList .ym-row')].map(r => r.textContent.replace(/\s+/g, ' ').trim()) }));
      ok(/^Added 2 songs\./.test(said) && /“notes” isn't a sound file/.test(said) && /This browser can't play “broken”/.test(said), 'two songs added; a text file and a file this browser can\'t play turned away, each said: ' + said);
      ok(S.list.join() === 'Morning Light:40,Evening Tide:40' && S.here === 2 && S.kept === 'Morning Light,Evening Tide' && S.rows.length === 2 && /^Morning Light ?00:40 · \d+ KB$/.test(S.rows[0]),
        'kept in the database, their names (the extension and underscores gone) and lengths in the list: ' + S.rows.join(' / '));
      ok(await E(p, () => { const d = localStorage.getItem('entrain.myMusic'); return d.length < 400 && !/RIFF|data:/.test(d); }), 'the list kept with the settings holds names and numbers, never the sound');
      ok(/is here already/.test(await addSongs(p, [SONG_A])), 'the same song again is turned away');
      const tryB = '#ymList .ym-row:nth-child(1) [data-ym-play]';
      await p.click(tryB);
      ok(await until(p, () => { const Y = window.__entrain.YM; return Y.on && Y.taste && !Y.el.paused && Y.el.currentTime > 0.2; }, 4000) &&
        /^Stop Morning Light$/.test(await E(p, s => document.querySelector(s).getAttribute('aria-label'), tryB)), 'Settings plays a song to try it, its button now Stop');
      await p.click(tryB);
      ok(await until(p, () => !window.__entrain.YM.on && window.__entrain.YM.el.paused, 3000), 'and stops it');
      ok(await seg(p, '#st-amb .mus-seg button') === 'Off* | Matched | Slow | Steady | Lively | Yours' && await E(p, () => [...document.querySelector('.mus-sel').options].map(o => o.textContent).includes('Your own music')),
        'Yours joins the Music row and the player\'s list: ' + await seg(p, '#st-amb .mus-seg button'));
      await p.click('#st-amb .mus-seg button[data-mus=own]');
      ok(await until(p, () => { const Y = window.__entrain.YM; return Y.on && Y.el && !Y.el.paused && Y.el.currentTime > 0.3; }, 5000) && await E(p, () => localStorage.getItem('entrain.music') === 'own' && !window.__entrain.MUS.on),
        'Yours is kept, and a taste of a song plays (not the music made here): ' + JSON.stringify(await Y(p)));
      ok(await until(p, () => !window.__entrain.YM.on, 10000) && await until(p, () => window.__entrain.YM.el.paused, 3000), 'the taste ends by itself after a few seconds');
      // under Breathe
      await go(p, 'breathe', 500);
      ok(await seg(p, '#bPanel .mus-seg button') === 'Off | Matched | Slow | Steady | Lively | Yours*', 'Breathe\'s Music row has Yours, chosen');
      await p.click('#bStart');
      ok(await until(p, () => { const Y = window.__entrain.YM; return Y.on && !Y.el.paused && Y.g.gain.value > 0.9; }, 6000), 'a breathing session plays one of your songs, faded in: ' + JSON.stringify(await Y(p)));
      const y1 = await Y(p);
      ok(['Morning Light', 'Evening Tide'].includes(y1.name) && Math.abs(y1.out - 0.8 * 0.9 * 0.16) < 0.01, 'at the background sound\'s volume (40%): ' + y1.out);
      await E(p, () => { const v = document.querySelector('#bPanel .amb-vol'); v.value = 80; v.dispatchEvent(new Event('input', { bubbles: true })); });
      ok(await until(p, () => Math.abs(window.__entrain.YM.out.gain.value - 0.8 * 0.9 * 0.64) < 0.01, 3000), 'and it follows that volume');
      await p.waitForTimeout(1500);
      await p.click('#bStart');                                           // pause
      ok(await until(p, () => !window.__entrain.YM.on && window.__entrain.YM.el.paused, 4000), 'a pause fades it out and pauses the song');
      const y2 = await Y(p);
      await p.waitForTimeout(600);
      await p.click('#bStart');                                           // resume
      ok(await until(p, () => window.__entrain.YM.on && !window.__entrain.YM.el.paused, 4000) && await E(p, ([c, at]) => window.__entrain.YM.cur === c && window.__entrain.YM.el.currentTime >= at - 0.2, [y2.cur, y2.at]),
        'resuming carries on with the same song from where it was: ' + y2.name + ' at ' + y2.at + 's');
      // 21 seconds of it, then the session ends: the row under the guide asks about the song
      await p.waitForTimeout(21500);
      const playing = (await Y(p)).name;
      await p.click('#bReset');
      ok(await until(p, () => !window.__entrain.YM.on, 4000) && await until(p, () => !document.querySelector('#bYmRow').hidden, 3000), 'the session ends, and the song with it');
      const row = await E(p, () => ({ txt: document.querySelector('#bYmRow').textContent.replace(/\s+/g, ' ').trim(), n: document.querySelectorAll('#bYmRow .ym-rrow').length, b: [...document.querySelectorAll('#bYmRow .ym-th')].map(b => b.getAttribute('aria-label')) }));
      ok(row.n === 1 && row.txt.includes(playing) && /^Your music\. How was it\?/.test(row.txt) && row.b.join(' | ') === 'More of ' + playing + ' | Less of ' + playing, 'under the guide: the song that played, with a thumbs up and down: ' + row.txt);
      await p.click('#bYmRow .ym-th[data-ym-v="1"]'); await p.waitForTimeout(200);
      const v1 = await E(p, n => ({ up: window.__entrain.YM.list.find(s => s.name === n).up, pressed: document.querySelector('#bYmRow .ym-th[data-ym-v="1"]').getAttribute('aria-pressed'), said: document.querySelector('#bYmRow .ym-said').textContent, kept: JSON.parse(localStorage.getItem('entrain.myMusic')).find(s => s.name === n).up }), playing);
      ok(v1.up === 1 && v1.kept === 1 && v1.pressed === 'true' && /will come up more often/.test(v1.said), 'a thumbs up is kept with the song: ' + v1.said);
      await p.click('#bYmRow .ym-th[data-ym-v="-1"]'); await p.waitForTimeout(200);
      const v2 = await E(p, n => { const s = window.__entrain.YM.list.find(s => s.name === n); return { up: s.up, down: s.down, said: document.querySelector('#bYmRow .ym-said').textContent }; }, playing);
      ok(v2.up === 0 && v2.down === 1 && /left out while there are other songs/.test(v2.said), 'changing it to a thumbs down takes the up back: ' + JSON.stringify(v2));
      await p.click('#bYmRow .ym-th[data-ym-v="-1"]'); await p.waitForTimeout(200);
      ok(await E(p, n => { const s = window.__entrain.YM.list.find(s => s.name === n); return s.up === 0 && s.down === 0; }, playing), 'and a second tap takes it back altogether');
      // the pick, weighted by the thumbs
      const W = await E(p, () => {
        const X = window.__entrain, L = X.YM.list, a = L[0], b = L[1], pick = (r, not) => (L.find(s => s.id === X.ymPick(not, r)) || {}).name, out = {};
        const share = not => { let n = 0; for (let i = 0; i < 100; i++) if (X.ymPick(not, (i + 0.5) / 100) === a.id) n++; return n; };
        a.up = 0; a.down = 0; b.up = 0; b.down = 0; out.even = share();
        a.up = 4; out.liked = share(); out.wa = X.ymWeight(a);
        a.up = 9; out.capped = share();
        a.up = 0; b.down = 1; out.downOnly = share(); out.notA = pick(0.5, a.id);
        a.down = 1; out.allDown = share();
        out.notB = pick(0.99, b.id);
        a.up = 0; a.down = 0; b.up = 0; b.down = 0;
        return out;
      });
      ok(W.even === 50 && W.liked === 83 && W.wa === 5 && W.capped === 83, 'by chance, evenly; a song liked four times comes up five times as often, and no more however often it\'s liked: ' + JSON.stringify(W));
      ok(W.downOnly === 100 && W.notA === 'Morning Light' && W.allDown === 50 && W.notB === 'Morning Light', 'one turned down is left out while there are others, even straight after the other; with every one turned down they all play');
      // I need to stop
      await p.click('#bStart');
      ok(await until(p, () => window.__entrain.YM.on && !window.__entrain.YM.el.paused, 6000), 'a new session plays again');
      await p.click('#bOut'); await p.waitForTimeout(900);
      ok(await E(p, () => !window.__entrain.YM.on && window.__entrain.YM.g.gain.value < 0.05 && window.__entrain.B.state === 'idle'), 'I need to stop fades it out with the session');
      await E(p, () => { const c = document.querySelector('#stlModal .btn, #stlClose'); if (c) c.click(); });
      await p.keyboard.press('Escape'); await p.waitForTimeout(300);
      // removing a song
      await go(p, 'st-mymusic', 500);
      await p.click('#ymList .ym-row:nth-child(2) [data-ym-del]'); await p.waitForTimeout(500);
      const R = await E(p, () => new Promise(res => {
        const rq = indexedDB.open('entrain-music');
        rq.onsuccess = () => { const g = rq.result.transaction('meta').objectStore('meta').getAll(); g.onsuccess = () => res({ db: g.result.map(m => m.name).join(), list: window.__entrain.YM.list.map(s => s.name).join(), msg: document.querySelector('#ymMsg').textContent }); };
      }));
      ok(R.db === 'Morning Light' && R.list === 'Morning Light' && /^Removed “Evening Tide”/.test(R.msg), 'removing a song takes it from the list and the database: ' + JSON.stringify(R));
      await p.screenshot({ path: OUT + 'mymusictest-b-settings.png', fullPage: false });
      await p.context().close();
    }

    /* C. unlocked: a practice's own, Music Break, a backup's names, a list found again */
    if (!only || only === 'C') {
      const ctx = await browser.newContext({ userAgent: S20, viewport: { width: 412, height: 915 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
      const p = await page({}, { url: URL, unlock: true, ctx });
      await addSongs(p, [SONG_A, SONG_B]);
      await go(p, 'practice/body-scan', 600);
      ok(await seg(p, '#sOptMus button') === 'Off* | Matched | Slow | Steady | Lively | Yours', 'a practice\'s own Music row has Yours too');
      await p.click('#sOptMus button[data-mus=own]'); await p.waitForTimeout(250);
      ok(await seg(p, '#sOptMus button') === 'Off | Matched | Slow | Steady | Lively | Yours*' && /Your own music/.test(await t(p, '#sOptsSum')) && await E(p, () => JSON.parse(localStorage.getItem('entrain.pOpt.body-scan')).music === 'own'),
        'kept for that practice, and named in its summary: ' + await t(p, '#sOptsSum'));
      await p.click('#sGo');
      ok(await until(p, () => window.__entrain.P.state === 'running' && window.__entrain.YM.on && !window.__entrain.YM.el.paused, 6000) && await E(p, () => !window.__entrain.MUS.on), 'the practice plays your songs');
      await p.waitForTimeout(23000);
      await E(p, () => { const P = window.__entrain.P; P.t0 -= P.total; });
      ok(await until(p, () => window.__entrain.P.state === 'done', 6000) && await until(p, () => !window.__entrain.YM.on, 4000), 'it ends, and your music with it');
      const card = await E(p, () => { const c = document.querySelector('#sDone .ym-rate'); return c ? { txt: c.textContent.replace(/\s+/g, ' '), n: c.querySelectorAll('.ym-rrow').length, before: !!c.compareDocumentPosition(document.querySelector('#sDone .sd-act')) } : null; });
      ok(card && card.n >= 1 && /^Your music\. How was it\?/.test(card.txt), 'the end screen asks about each song that played: ' + (card && card.txt));
      await p.click('#sDone .ym-rate .ym-th[data-ym-v="1"]'); await p.waitForTimeout(200);
      ok(await E(p, () => window.__entrain.YM.list.some(s => s.up === 1)), 'and a thumbs up there is kept');
      // Music Break to your own songs
      await go(p, 'practice/music-break', 500);
      await p.click('#sOpts [data-choice=tempo] button[data-v=own]'); await p.waitForTimeout(250);
      const mb = await E(p, () => { const X = window.__entrain, pl = X.pPlan(X.pDef('music-break'), 10); return { listen: pl.steps[1].lines[0][1], total: pl.total }; });
      ok(await seg(p, '#sOpts [data-choice=tempo] button') === 'Slow | Steady | Lively | Yours*' && /picked by chance and more often the ones you've liked/.test(await t(p, '#sOpts')) &&
        mb.listen === 'Let your attention rest on the music: its sounds, its rhythm, the way it moves.' && mb.total === 600, 'Music Break with Yours: its note, and words for your own music: ' + mb.listen);
      await p.click('#sGo');
      ok(await until(p, () => window.__entrain.P.state === 'running' && window.__entrain.YM.on, 6000) && await E(p, () => !window.__entrain.MUS.on), 'Music Break plays your songs, though the background\'s choice is Off');
      await E(p, () => { const P = window.__entrain.P, s = P.steps[P.steps.length - 1]; P.t0 -= (s.at + 1) - (performance.now() / 1000 - P.t0); });
      ok(await until(p, () => window.__entrain.P.steps[window.__entrain.P.idx].title === 'Come back' && window.__entrain.YM.lv === 0.45, 4000) && await E(p, () => window.__entrain.YM.on), 'for the closing words your music turns down, and plays on');
      await E(p, () => { const P = window.__entrain.P; P.t0 -= P.total; });
      ok(await until(p, () => window.__entrain.P.state === 'done', 6000) && await until(p, () => !window.__entrain.YM.on, 4000), 'it ends with Music Break');
      // I need to stop: your song is gone in the same half second as everything else, though the practice's end begins a slower fade
      await go(p, 'practice', 300); await go(p, 'practice/music-break', 500);
      await p.click('#sGo');
      ok(await until(p, () => window.__entrain.P.state === 'running' && window.__entrain.YM.on && !window.__entrain.YM.el.paused && window.__entrain.YM.g.gain.value > 0.5, 8000), 'Music Break to your songs again');
      await p.click('#sOut'); await p.waitForTimeout(650);
      const so = await E(p, () => { const Y = window.__entrain.YM; return { on: Y.on, g: +Y.g.gain.value.toFixed(4), st: window.__entrain.P.state }; });
      ok(!so.on && so.g < 0.001 && so.st !== 'running' && await until(p, () => window.__entrain.YM.el.paused, 1000), 'I need to stop: your song is silent within 0.65 s and pauses: ' + JSON.stringify(so));
      await p.keyboard.press('Escape'); await p.waitForTimeout(200);
      // a list lost (a backup from before), found again from the database with the names
      // (as Entrain opens: the kept list read, then the database's songs, through the same two functions)
      await E(p, () => new Promise(res => { const X = window.__entrain; localStorage.removeItem('entrain.myMusic'); X.ymLoadList(); X.ymScan(res); }));
      ok(await E(p, () => window.__entrain.YM.list.map(s => s.name).sort().join() === 'Evening Tide,Morning Light' && JSON.parse(localStorage.getItem('entrain.myMusic')).length === 2),
        'a list lost to an older backup comes back from the songs in the database, by name');
      await ctx.close();
      // a backup restored on another device: the names and thumbs come, the files don't
      const kept = JSON.stringify([{ id: 'abc123', name: 'Morning Light', secs: 40, size: 640044, up: 3, down: 0, at: 1 }]);
      const q = await page({ myMusic: kept, music: 'own' }, { url: URL, unlock: true });
      await go(q, 'st-mymusic', 600);
      const away = await E(q, () => ({ row: document.querySelector('#ymList .ym-row').textContent.replace(/\s+/g, ' ').trim(), away: document.querySelector('#ymList .ym-row').getAttribute('data-away') }));
      ok(away.away === '1' && /Not on this device: add the file again to play it here/.test(away.row) && /liked 3 times/.test(away.row), 'on another device the song waits, with its thumbs: ' + away.row);
      ok(await seg(q, '#st-amb .mus-seg button') === 'Off | Matched | Slow | Steady | Lively | Yours*' && await E(q, () => { const w = window.__entrain.musWant; return true; }), 'Yours stays chosen');
      await go(q, 'breathe', 400); await q.click('#bStart');
      ok(await until(q, () => window.__entrain.MUS.on && window.__entrain.MUS.bpm === 60, 5000) && await E(q, () => !window.__entrain.YM.on), 'with no song on this device yet, Yours plays the music made here, matched to the session');
      await q.click('#bReset'); await q.waitForTimeout(300);
      await addSongs(q, [SONG_A]);
      ok(await E(q, () => { const s = window.__entrain.YM.list; return s.length === 1 && s[0].id === 'abc123' && s[0].up === 3 && window.__entrain.YM.here.abc123; }), 'adding the file again joins it to its name, keeping its thumbs');
      await q.context().close();
    }

    /* D. the belly's breath from the readings */
    if (!only || only === 'D') {
      const p = await page({}, { url: URL, unlock: true });
      const D = await E(p, () => {
        const X = window.__entrain, deg = Math.PI / 180, G = 9.81, out = {};
        // 30 s of readings ten a second: the phone tilting tilt degrees each way at bpm a minute, with a slow drift and noise
        const bins = (bpm, tilt, end, drift) => { const b = []; let s = 3; const r = () => (s = (s * 16807) % 2147483647) / 2147483647 - 0.5;
          for (let i = 0; i <= 300; i++) { const t = end - 30 + i / 10, th = tilt * Math.sin(2 * Math.PI * bpm / 60 * t) + (drift || 0) * t;
            b.push({ t, x: G * Math.sin(th * deg) + 0.03 * r(), y: G * Math.sin(0.3 * th * deg) + 0.03 * r(), z: G * Math.cos(th * deg) + 0.03 * r() }); } return b; };
        // the level at the end of each window, against the true lung level (1 + sin)/2 there, along the whole of a few breaths
        let v = null; const got = [], want = [];
        for (let end = 40; end <= 70; end += 0.5) {
          const r = X.blsTilt(bins(10, 2.5, end, 0.02), v, 10); v = r.v;
          got.push(r.raw); want.push((1 + Math.sin(2 * Math.PI * 10 / 60 * end)) / 2);
        }
        out.r = X.blsCorr(got, want);
        out.amp = X.blsTilt(bins(10, 2.5, 50), null, 10).amp;
        out.unit = Math.abs(Math.hypot(...v) - 1) < 1e-6;
        out.still = X.blsTilt(bins(10, 0, 50), null, 10).raw;
        out.short = X.blsTilt(bins(10, 2.5, 50).slice(250), null, 10);
        out.range = got.every(x => x >= 0 && x <= 1);
        return out;
      });
      ok(Math.abs(D.r) > 0.9 && D.range && D.unit, 'the level follows the tilt\'s rise and fall, between 0 and 1, along a steady direction (one way or the other, which the guide decides): r = ' + D.r.toFixed(3));
      ok(D.amp > 0.5 && D.amp < 1.2 && D.still === null && D.short === null, 'its swing in m/s² (' + D.amp.toFixed(2) + '), nothing from a phone lying still, and nothing from under ten seconds of readings');
      await p.context().close();
    }

    /* E. unlocked: breath-led sound */
    if (!only || only === 'E') {
      const p = await page({ breath: JSON.stringify({ pattern: 'resonance', inh: 5.5, sip: 0, hold: 0, exh: 5.5, rest: 0, visual: 'circle', minutes: 0, sound: 'off', cue: 40, buzz: false }) },
        { url: URL, unlock: true, speed: 4, mot: { bpm: 12 }, desk: true });
      await go(p, 'breathe', 500);
      ok(await E(p, () => !document.querySelector('#bLedL .sup-tag') && !document.querySelector('#bLedOn').checked && document.querySelector('#bLedRow').hidden), 'unlocked: no cup, and off');
      await p.click('#bLedOn'); await p.waitForTimeout(400);
      const on = await E(p, () => ({ on: document.querySelector('#bLedOn').checked, kept: localStorage.getItem('entrain.breathLed'), belly: window.__entrain.MOT.belly, src: document.querySelector('#bLedSrcRow').hidden, row: document.querySelector('#bLedRow').hidden }));
      ok(on.on && on.kept === '1' && on.belly && !on.src && !on.row && await seg(p, '#bLedSrc button') === 'Phone on my belly* | Microphone', 'switched on: the phone on your belly listens, chosen beside the microphone, and the row under the guide says what to do: ' + await t(p, '#bLedTxt'));
      await p.click('#bStart'); await p.waitForTimeout(500);
      const f = await E(p, () => ({ ph: window.__entrain.BLS.phase, st: window.__entrain.B.state, name: document.querySelector('#bPhase').textContent, hint: document.querySelector('#bHint').textContent, btn: document.querySelector('#bStart').textContent, mus: window.__entrain.MUS.on && window.__entrain.MUS.own === 'breath', reset: document.querySelector('#bReset').disabled,
        out: !document.querySelector('#bOut').hidden && document.querySelector('#bOut').getBoundingClientRect().height >= 44 }));
      ok(f.ph === 'find' && f.st === 'idle' && f.name === 'Breathe as usual' && /^Finding your pace/.test(f.hint) && f.btn === 'Begin now' && f.mus && !f.reset && f.out, 'Start: the music begins and the guide waits, finding your pace, with I need to stop in reach: ' + f.hint);
      ok(await until(p, () => window.__entrain.BLS.phase === 'run' && window.__entrain.B.state === 'running', 20000), 'once the phone has your pace, the guide begins');
      const b0 = await E(p, () => { const X = window.__entrain; return { from: X.BLS.from, r0: X.BLS.rate0, cyc: X.B.ph.cycle, inh: X.B.ph.list[0].secs, k: X.B.ph.list.map(x => x.k).join(), target: X.BLS.target, txt: document.querySelector('#bLedTxt').textContent }; });
      ok(b0.from === 'sensor' && Math.abs(b0.r0 - 12) <= 0.8 && Math.abs(b0.cyc - 60 / b0.r0) < 0.2 && Math.abs(b0.inh / b0.cyc - 0.4) < 0.03 && b0.k === 'in,out' && b0.target === 5.5,
        'at your own pace (' + b0.r0 + ' a minute: 40% in, 60% out), heading for 5.5: ' + b0.txt);
      ok(/^The guide began at your own pace, \d+(\.\d)? breaths a minute, keeps it for a minute, then slows gently towards your resonance pace, 5\.5\./.test(b0.txt) &&
        await E(p, () => /breaths\/min, breath-led$/.test(document.querySelector('#bRateV').textContent)), 'and it says so under the guide, and in the settings\' pace: ' + await t(p, '#bRateV'));
      // breathing out of step with the guide teaches it nothing
      await E(p, () => window.__mot.set({ bpm: 7.3 }));
      await p.waitForTimeout(9000);
      ok(await E(p, () => window.__entrain.BLS.sign === 0 && window.__entrain.BLS.how === 'guide'), 'breathing out of step with the guide teaches it nothing, and the chords stay with the guide: r ' + await E(p, () => window.__entrain.BLS.corr.toFixed(2)));
      // follow the guide: which way is in is learnt, then the chords follow the belly
      await E(p, () => { window.__motFollow = window.__entrain.blsGuideLv; window.__mot.set({ follow: true, flip: true, lag: 0.6 }); });
      ok(await until(p, () => window.__entrain.BLS.sign !== 0 && window.__entrain.BLS.how === 'belly', 40000), 'following the guide, it learns which way the belly tilts as you breathe in, and the chords follow the belly: sign ' + await E(p, () => window.__entrain.BLS.sign + ', r ' + window.__entrain.BLS.corr.toFixed(2)));
      const pad = async () => E(p, async () => { const a = [], b = [], c = [];
        for (let i = 0; i < 70; i++) { await new Promise(r => setTimeout(r, 100)); const X = window.__entrain; a.push(X.BLS.lvl); b.push(window.__mot.lv); c.push(X.MUS.pad ? X.MUS.pad.gain.value : -1); }
        const X = window.__entrain; return { belly: X.blsCorr(a, b), lo: Math.min(...c), hi: Math.max(...c), how: X.BLS.how }; });
      const pd = await pad();
      ok(pd.belly > 0.6 && pd.lo >= 0.45 && pd.hi <= 1.01 && pd.hi - pd.lo > 0.3, 'the chords swell as the belly rises with a breath in and ebb as it falls, from full to half (6 dB): r = ' + pd.belly.toFixed(2) + ', ' + pd.lo.toFixed(2) + '–' + pd.hi.toFixed(2));
      // breathing on its own now, out of step with the guide: the chords follow the belly, not the guide
      await E(p, () => window.__mot.set({ follow: false, bpm: 7.3 }));
      await p.waitForTimeout(3000);
      const own = await E(p, async () => { const a = [], b = [], g = [];
        for (let i = 0; i < 90; i++) { await new Promise(r => setTimeout(r, 100)); const X = window.__entrain; a.push(X.BLS.lvl); b.push(window.__mot.lv); g.push(X.blsGuideLv()); }
        const X = window.__entrain; return { belly: X.blsCorr(a, b), guide: X.blsCorr(a, g) }; });
      ok(own.belly > 0.6 && own.belly > own.guide + 0.3, 'out of step with the guide, the chords follow your belly, not the guide: r ' + own.belly.toFixed(2) + ' with the belly, ' + own.guide.toFixed(2) + ' with the guide');
      await E(p, () => window.__mot.set({ follow: true, flip: true, lag: 0.6 }));
      // the pace slows after a minute, a breath a minute each minute
      ok(await until(p, ([r0]) => window.__entrain.BLS.rate <= r0 - 1, 45000, [b0.r0]), 'after a minute at your pace the guide slows: now ' + await E(p, () => window.__entrain.BLS.rate));
      const sl = await E(p, () => { const X = window.__entrain; return { rate: X.BLS.rate, cyc: X.B.ph.cycle, pend: X.B.pending ? X.B.pending.cycle : 0, txt: document.querySelector('#bLedTxt').textContent }; });
      ok(Math.abs(60 / sl.cyc - sl.rate) < 0.35 || Math.abs(60 / sl.pend - sl.rate) < 0.1, 'the guide\'s breaths lengthen with it, a breath at a time: ' + (60 / sl.cyc).toFixed(2) + ' a minute');
      ok(/and slows gently towards your resonance pace, 5\.5: now \d/.test(sl.txt), 'it says where it\'s heading: ' + sl.txt);
      // faster than the guide: it holds
      await E(p, () => window.__mot.set({ follow: false, bpm: 15 }));
      ok(await until(p, () => window.__entrain.BLS.hold, 40000), 'breathing faster than the guide, it holds its pace');
      const h1 = await E(p, () => window.__entrain.BLS.rate);
      await p.waitForTimeout(6000);
      ok(await E(p, r => window.__entrain.BLS.rate === r && /holds at .* until you're with it/.test(document.querySelector('#bLedTxt').textContent), h1), 'and stays there while you\'re faster: ' + await t(p, '#bLedTxt'));
      await E(p, () => window.__mot.set({ follow: true }));
      // a pause
      await p.click('#bStart'); await p.waitForTimeout(700);
      ok(await E(p, () => window.__entrain.B.state === 'paused' && !window.__entrain.MUS.on), 'a pause pauses the music');
      await p.click('#bStart');
      ok(await until(p, () => window.__entrain.MUS.on && window.__entrain.MUS.own === 'breath', 3000), 'and it comes back on resuming');
      // a pattern picked by hand: the pace is yours
      await E(p, () => { const i = document.querySelector('#bPats input[value="box"]'); i.checked = true; i.dispatchEvent(new Event('change', { bubbles: true })); });
      await p.waitForTimeout(600);
      const hd = await E(p, () => ({ hand: window.__entrain.BLS.hand, txt: document.querySelector('#bLedTxt').textContent, r: window.__entrain.BLS.rate }));
      await p.waitForTimeout(5000);
      ok(hd.hand && /^You've set the pace yourself, so the guide keeps it/.test(hd.txt) && await E(p, r => window.__entrain.BLS.rate === r, hd.r), 'a pattern picked mid-session takes over the pace, and the slowing ends: ' + hd.txt);
      // the end, and the history
      await p.click('#bReset'); await p.waitForTimeout(800);
      const end = await E(p, () => { const X = window.__entrain, h = JSON.parse(localStorage.getItem('entrain.history') || '[]').filter(e => e.k === 'breath').pop(); return { ph: X.BLS.phase, mus: X.MUS.on, h, txt: document.querySelector('#bLedTxt').textContent, btn: document.querySelector('#bStart').textContent }; });
      ok(end.ph === 'off' && !end.mus && /^Last session, breath-led: the guide went from \d+(\.\d)? to \d+(\.\d)? breaths a minute, then kept the pace you set\.$/.test(end.txt) && end.btn === 'Start breathing', 'Reset ends it, the music too, and the row says what it did: ' + end.txt);
      ok(end.h && end.h.id === 'custom' && /^breath-led from \d+(\.\d)? a minute$/.test(end.h.note) && end.h.secs >= 60, 'the history keeps it as breathing at a pace of its own, breath-led from yours: ' + JSON.stringify(end.h && { id: end.h.id, rate: end.h.rate, note: end.h.note }));
      ok(await E(p, () => !window.__entrain.MOT.belly && !document.querySelector('#bBellyOn').checked), 'and the phone on your belly, which it turned on, turns off with it');
      ok(await E(p, () => JSON.parse(localStorage.getItem('entrain.breath')).pattern === 'box'), 'and the pattern you picked is the one kept');
      // Begin now, before a steady reading
      await E(p, () => { const i = document.querySelector('#bPats input[value="resonance"]'); i.checked = true; i.dispatchEvent(new Event('change', { bubbles: true })); });
      await p.click('#bLedOn'); await p.waitForTimeout(200);
      await p.click('#bLedOn'); await p.waitForTimeout(300);              // off and on: the sensor listens afresh
      await E(p, () => { const M = window.__entrain.MOT; M.bins = []; M.est = null; M.since = performance.now() / 1000; window.__mot.set({ follow: false, bpm: 12 }); });
      await p.click('#bStart'); await p.waitForTimeout(400);
      ok(await E(p, () => window.__entrain.BLS.phase === 'find'), 'started again, it waits for your pace');
      await p.click('#bStart'); await p.waitForTimeout(500);
      ok(await E(p, () => { const X = window.__entrain; return X.BLS.phase === 'run' && X.B.state === 'running' && X.BLS.from === 'pattern' && Math.abs(X.BLS.rate0 - 5.5) < 0.1 && X.BLS.target === 5.5; }) &&
        /^With no steady reading of your breathing, the guide began at the pattern's pace, 5\.5 a minute, at or below your resonance pace already/.test(await t(p, '#bLedTxt')), 'Begin now starts at the pattern\'s pace with no reading yet, and says so: ' + await t(p, '#bLedTxt'));
      // I need to stop
      await p.click('#bOut'); await p.waitForTimeout(900);
      ok(await E(p, () => window.__entrain.BLS.phase === 'off' && window.__entrain.B.state === 'idle' && (!window.__entrain.MUS.on || window.__entrain.MUS.own === '')), 'I need to stop ends it with the session');
      await p.keyboard.press('Escape'); await p.waitForTimeout(300);
      // and while it waits for your pace, the music playing
      await p.click('#bLedOn'); await p.waitForTimeout(200);
      await p.click('#bLedOn'); await p.waitForTimeout(300);
      await E(p, () => { const M = window.__entrain.MOT; M.bins = []; M.est = null; M.since = performance.now() / 1000; });
      await p.click('#bStart'); await p.waitForTimeout(400);
      ok(await E(p, () => window.__entrain.BLS.phase === 'find' && window.__entrain.MUS.on && !document.querySelector('#bOut').hidden), 'waiting for your pace again, I need to stop is there');
      await p.click('#bOut'); await p.waitForTimeout(650);
      const wo = await E(p, () => { const X = window.__entrain; return { ph: X.BLS.phase, on: X.MUS.on, g: Math.max(0, ...X.MUS.going.map(x => x[0].gain.value)), stl: !document.querySelector('#stlModal').hidden, out: !document.querySelector('#bOut').hidden, btn: document.querySelector('#bStart').textContent }; });
      ok(wo.ph === 'off' && !wo.on && wo.g < 0.001 && wo.stl && !wo.out && wo.btn === 'Start breathing', 'one tap ends the wait, the music gone within 0.65 s, and Settle opens: ' + JSON.stringify(wo));
      await p.keyboard.press('Escape'); await p.waitForTimeout(300);
      // a practice using the guide is left alone
      await go(p, 'practice/calm-reset', 600);
      await p.click('#sGo');
      ok(await until(p, () => window.__entrain.P.state === 'running', 4000) && await E(p, () => window.__entrain.BLS.phase === 'off' && window.__entrain.MUS.own !== 'breath'), 'a practice breathing with the guide is left as it is');
      await E(p, () => { const P = window.__entrain.P; P.t0 -= P.total; }); await p.waitForTimeout(1200);
      await p.context().close();
      // no motion sensor: it begins at once, at the pattern's pace
      const q = await page({ breathLed: '1', breathLedSrc: 'belly' }, { url: URL, unlock: true, mot: { none: true }, desk: true });
      await go(q, 'breathe', 500);
      ok(await E(q, () => document.querySelector('#bLedOn').checked && !document.querySelector('#bLedRow').hidden), 'kept on from before, once unlocked');
      await q.click('#bStart');
      ok(await until(q, () => window.__entrain.BLS.phase === 'run' && window.__entrain.BLS.from === 'pattern', 6000), 'with no motion readings coming in, the guide begins at the pattern\'s pace: ' + await t(q, '#bLedTxt'));
      await q.click('#bReset'); await q.waitForTimeout(300);
      await q.context().close();
      // the microphone
      const m = await page({ breathLed: '1', breathLedSrc: 'mic' }, { url: URL, unlock: true, mic: { bpm: 10 }, desk: true });
      await go(m, 'breathe', 500);
      ok(await seg(m, '#bLedSrc button') === 'Phone on my belly | Microphone*', 'the microphone chosen');
      await m.click('#bStart');
      ok(await until(m, () => window.__entrain.MIC.on, 4000) && await E(m, () => window.__entrain.BLS.phase === 'find'), 'Start listens with the microphone and waits for your pace');
      ok(await until(m, () => window.__entrain.BLS.phase === 'run', 45000), 'then begins at it');
      const mr = await E(m, () => { const X = window.__entrain; return { from: X.BLS.from, r0: X.BLS.rate0, how: X.BLS.how }; });
      await m.waitForTimeout(4500);
      const mh = await E(m, () => ({ how: window.__entrain.BLS.how, txt: document.querySelector('#bLedTxt').textContent }));
      ok(mr.from === 'sensor' && Math.abs(mr.r0 - 10) <= 1 && mh.how === 'guide' && /a microphone hears each breath, but not which way it goes/.test(mh.txt), 'at the pace it heard (' + mr.r0 + '), the chords swelling with the guide: ' + mh.txt);
      await m.click('#bReset'); await m.waitForTimeout(300);
      // the microphone it opened closes with the session, and with the switch; one you started on Heart stays yours
      const shut = () => until(m, () => !window.__entrain.MIC.on && !window.__entrain.MIC.busy, 3000);
      ok(await shut() && await E(m, () => window.__mic.stopped >= 1), 'Reset closes the microphone it opened: ' + await t(m, '#bLedHint'));
      await m.click('#bLedOn'); await m.waitForTimeout(200);
      await m.click('#bLedOn');
      ok(await until(m, () => window.__entrain.MIC.on, 4000), 'switched off and on again, it listens');
      await m.click('#bLedOn');
      ok(await shut() && await E(m, () => !window.__entrain.BLS.on), 'switched off, the microphone closes');
      await go(m, 'heart', 400);
      await m.click('#mcStart');
      ok(await until(m, () => window.__entrain.MIC.on, 4000), 'the microphone started on Heart');
      await go(m, 'breathe', 400);
      await m.click('#bLedOn'); await m.waitForTimeout(300);
      await m.click('#bStart'); await m.waitForTimeout(400);
      await m.click('#bReset'); await m.waitForTimeout(300);
      await m.click('#bLedOn'); await m.waitForTimeout(500);
      ok(await E(m, () => window.__entrain.MIC.on && !window.__entrain.BLS.on), 'is left listening after a session and the switch, as Heart\'s button is where it stops');
      await m.context().close();
    }

    /* F. 360 px, targets, spelling */
    if (!only || only === 'F') {
      const p = await page({}, { url: URL, unlock: true, vp: { width: 360, height: 740 } });
      await addSongs(p, [wav('A_very_long_name_for_a_song_that_goes_on_and_on_and_on.wav', 3, 300), SONG_B]);
      const bad = [];
      for (const h of ['st-mymusic', 'breathe', 'l-mymusic']) {
        await go(p, h, 500);
        const w = await E(p, () => document.documentElement.scrollWidth > document.documentElement.clientWidth ?
          [...document.querySelectorAll('#views *')].filter(e => e.offsetParent && e.getBoundingClientRect().right > document.documentElement.clientWidth + 1).slice(-3).map(e => e.tagName + '.' + e.className + '#' + e.id + ' ' + Math.round(e.getBoundingClientRect().right)).join(', ') : '');
        if (w) bad.push(h + ' (' + w + ')');
      }
      ok(!bad.length, 'nothing wider than a 360 px screen: Settings with a long song name, Breathe, Learn' + (bad.length ? ': ' + bad.join(', ') : ''));
      await go(p, 'st-mymusic', 400);
      const small = await E(p, () => [...document.querySelectorAll('#st-mymusic button, #bLedSrc button')].filter(b => b.offsetParent).map(b => b.getBoundingClientRect()).filter(r => r.height < 44 || r.width < 44).length);
      ok(small === 0, 'every button in the card is at least 44 px: ' + small + ' smaller');
      // the thumbs on an end screen
      await go(p, 'practice/body-scan', 400);
      await E(p, () => { const X = window.__entrain, Y = X.YM, id = Y.list[1].id; Y.segs.push({ id, from: Date.now() - 60000, to: Date.now() });
        X.P.def = X.pDef('body-scan'); X.P.startedAt = Date.now() - 90000; X.P.steps = X.pPlan(X.P.def, 10).steps; X.pDone({ secs: 600, early: false, hrPts: [] }, false); });
      await p.waitForTimeout(300);
      const th = await E(p, () => [...document.querySelectorAll('#sDone .ym-th')].map(b => { const r = b.getBoundingClientRect(); return Math.round(r.width) + 'x' + Math.round(r.height); }));
      ok(th.length === 2 && th.every(x => x === '44x44') && await E(p, () => document.documentElement.scrollWidth <= document.documentElement.clientWidth), 'the end screen\'s thumbs are 44 px, at 360 px wide: ' + th.join(' '));
      // British spelling and what-to-do wording in what it shows
      const txt = await E(p, () => { const h = document.querySelector('#l-mymusic'), a = [h.textContent]; let n = h.nextElementSibling;
        while (n && n.tagName === 'P') { a.push(n.textContent); n = n.nextElementSibling; }
        return a.concat([document.querySelector('#bLedOpt').textContent, document.querySelector('#bLedTxt').textContent]).join(' '); });
      await go(p, 'st-mymusic', 300);
      const stx = await t(p, '#st-mymusic');
      const sp = (txt + ' ' + stx).match(SPELL);
      ok(!sp, 'British spelling in Learn, Settings and Breathe' + (sp ? ': ' + sp[0] : ''));
      const words = await E(p, () => { const X = window.__entrain, d = X.pDef('music-break'); localStorage.setItem('entrain.pCh.music-break', JSON.stringify({ tempo: 'own' })); const pl = X.pPlan(d, 15); localStorage.removeItem('entrain.pCh.music-break'); return pl.steps.map(s => [s.title].concat(s.lines.map(l => l[1]))).flat().concat([d.blurb, d.end]); });
      const w = words.filter(x => RE.test(x));
      ok(!w.length, 'Music Break\'s words with your own music say what to do' + (w.length ? ': ' + w.join(' | ') : ''));
      await p.context().close();
    }
  } catch (e) { log.push('ERROR ' + (e && e.stack || e)); }
  await browser.close();
  console.log(log.join('\n'));
  console.log(log.filter(l => l.startsWith('PASS')).length + ' passed, ' + log.filter(l => /^(FAIL|PAGEERROR|ERROR|CONSOLE)/.test(l)).length + ' problems');
})();
