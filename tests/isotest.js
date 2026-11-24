// A beat's Sound: binaural (headphones), monaural or isochronic (speakers too), beatmode.js and audio.js's aVoices.
//   A  the signal itself, rendered offline by the app's own voices: each ear's tones and levels, the swell of a
//      monaural beat, the rounded on and off of an isochronic tone (rate, half on, soft edges), a slide followed in
//      every way, and a track joined part of the way through
//   B  locked on the real build: the choice on a track's page, the beat builder, the custom primer, Settings and a
//      practice's Options, binaural chosen and the two speaker ways with the cup; picking one opens the donation
//      dialog instead and changes nothing; a speaker way kept from before plays binaural until the device is
//      unlocked; the notched tinnitus track has no choice; Settings' list, search and Learn
//   C  unlocked (the test copy), a track: monaural with no headphone check, both ears the same, the player's ears
//      and the lock screen; isochronic picked while it plays, taking over at once with the volume kept; pause and
//      resume; the history; binaural asking for the headphone check again; Bluetooth microphones
//   D  unlocked, the builder and the primer: the ears read out, a prime's task phase with the beat faded under
//      the noise, or carrying on quieter; Settings' default, the library's needs
//   E  unlocked, practices: the Sound kept for one practice, what its page says, a start with no headphone
//      check, the beat moved while it runs, pause, the beat off and on, the end's fade and the history; a heart-led
//      beat in each speaker way; the default for every practice
//   F  unlocking from the dialog a Sound opened: the choice goes ahead and the cups go at once
//   G  at 360 px: nothing wider than the screen, every choice 44 px tall; British spelling
// Run: node tests/isotest.js [group letter]
const { chromium, APP, OUT } = require('./pw');
const { testApp, unlockInit, unlocked, sign } = require('./unlock-helper');
const S20 = 'Mozilla/5.0 (Linux; Android 13; SM-G988B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Mobile Safari/537.36';
const only = process.argv[2] || '';
const t = (p, s) => p.$eval(s, e => e.textContent.replace(/\s+/g, ' ').trim()).catch(() => '(missing)');
const E = (p, f, a) => p.evaluate(f, a);
const go = async (p, h, ms) => { await p.evaluate(x => location.hash = x, h); await p.waitForTimeout(ms || 400); };
const until = async (p, f, ms, a) => { try { await p.waitForFunction(f, a, { timeout: ms || 5000 }); return true; } catch (e) { return false; } };
const OPT = o => JSON.stringify(Object.assign({ voice: false, bells: false, cues: 'off', visual: 'circle', audio: true, voiceName: '', ana: 0, rhythm: false }, o || {}));
const SPELL = /\b(programs?|toward|synthesiz\w*|color\w*|favor\w*|behavior\w*|center(?:s|ed)?|organiz\w*|realiz\w*|recogniz\w*|minimiz\w*|optimiz\w*|personaliz\w*|prioritiz\w*|visualiz\w*|analyz\w*|gray|fiber|aging)\b/i;
// the Sound buttons in a group: each one's words, * when chosen, + with the cup
const seg = (p, s) => E(p, s => { const g = document.querySelector(s); return g ? [...g.querySelectorAll('button[data-bm]')].map(b => b.querySelector('b').textContent + ' ' + b.querySelector('small').textContent.trim() + (b.getAttribute('aria-pressed') === 'true' ? '*' : '') + (b.querySelector('.sup-tag') ? '+' : '')).join(' | ') : '(missing)'; }, s);
// what the beat is doing now: its way, its tones, its pulse, the player's ears
const now = p => E(p, () => {
  const A = window.__entrain.A, f = x => x ? +x.frequency.value.toFixed(2) : null;
  return { mode: A.mode, playing: A.playing, L: f(A.oscL), R: f(A.oscR), pulse: f(A.lfo), vx: !!A.vx, master: A.master ? +A.master.gain.value.toFixed(3) : null,
    sub: document.querySelector('#pSub').textContent, ears: [...document.querySelectorAll('.ears .ear')].filter(e => !e.hidden).map(e => e.textContent.replace(/\s+/g, ' ').trim()).join(' | '),
    recheck: !document.querySelector('#scOpen').hidden, album: navigator.mediaSession && navigator.mediaSession.metadata ? navigator.mediaSession.metadata.album : '' };
});
// the page's own output, as it plays: whether both ears get the same signal, and whether it swells and fades
const listen = p => E(p, () => new Promise(res => {
  const A = window.__entrain.A, ctx = A.ctx, sp = ctx.createChannelSplitter(2), aL = ctx.createAnalyser(), aR = ctx.createAnalyser();
  aL.fftSize = aR.fftSize = 16384;
  A.master.connect(sp); sp.connect(aL, 0); sp.connect(aR, 1);
  setTimeout(() => {
    const L = new Float32Array(aL.fftSize), R = new Float32Array(aR.fftSize);
    aL.getFloatTimeDomainData(L); aR.getFloatTimeDomainData(R);
    try { A.master.disconnect(sp); } catch (e) {}
    const w = Math.round(ctx.sampleRate * 0.004), env = [];
    let peak = 0, diff = 0;
    for (let i = 0; i < L.length; i++) { peak = Math.max(peak, Math.abs(L[i])); diff = Math.max(diff, Math.abs(L[i] - R[i])); }
    for (let i = 0; i + w <= L.length; i += w) { let s = 0; for (let j = i; j < i + w; j++) s += L[j] * L[j]; env.push(Math.sqrt(s / w)); }
    const eMax = Math.max(...env), eMin = Math.min(...env);
    res({ peak: +peak.toFixed(4), same: diff < 1e-6, depth: eMax ? +(1 - eMin / eMax).toFixed(2) : 0 });
  }, 500);
}));

(async () => {
  const browser = await chromium.launch();
  const log = []; const ok = (c, m) => log.push((c ? 'PASS ' : 'FAIL ') + m);
  const URL = testApp();
  // a phone with debug on; o.url: the test copy; o.unlock: this device unlocked; o.stereo: the headphone check already
  // done (the default); st: stored values; o.vp: another size
  const page = async (st, o) => {
    o = o || {};
    const ctx = await browser.newContext({ userAgent: S20, viewport: o.vp || { width: 412, height: 915 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    const p = await ctx.newPage();
    p.on('pageerror', e => log.push('PAGEERROR ' + e.message));
    p.on('console', m => { if (m.type() === 'error') log.push('CONSOLE ' + m.text()); });
    if (o.unlock) await unlockInit(p);
    await p.addInitScript(([s, stereo]) => {
      if (!sessionStorage.getItem('z.seeded')) {
        sessionStorage.setItem('z.seeded', '1');
        localStorage.setItem('entrain.debug', '1');
        if (stereo) localStorage.setItem('entrain.stereo', 'ok');
        for (const k in s) localStorage.setItem('entrain.' + k, s[k]);
      }
      if (window.speechSynthesis) { speechSynthesis.speak = () => {}; speechSynthesis.cancel = () => {}; }
    }, [Object.assign({ pOpt: OPT() }, st || {}), o.stereo !== false]);
    await p.goto(o.url || APP);
    await unlocked(p);
    return p;
  };
  const dlg = p => E(p, () => ({ open: !document.querySelector('#supModal').hidden, for: document.querySelector('#supFor').hidden ? '' : document.querySelector('#supFor').textContent }));
  const shut = async p => { if ((await dlg(p)).open) { await p.click('#supClose'); await p.waitForTimeout(200); } };

  try {
    /* A. the signal, rendered offline by the app's own voices (aVoices), so every sample can be read */
    if (!only || only === 'A') {
      const p = await page();
      // render secs of a track in one way, offset seconds in, and measure it: levels, whether the ears match, each
      // ear's pitch from its zero crossings, and the loudness (4 ms windows) as it swells, pulses or holds steady
      const render = (mode, track, secs, offset) => E(p, async ([mode, track, secs, offset]) => {
        const X = window.__entrain, sr = 44100, ctx = new OfflineAudioContext(2, Math.round(sr * secs), sr);
        X.aVoices(ctx, ctx.destination, track, offset || 0, mode, 0);
        const buf = await ctx.startRendering(), L = buf.getChannelData(0), R = buf.getChannelData(1);
        const hz = (x, a, b) => { let c = 0, f = -1, l = -1; for (let i = Math.max(1, a); i < b; i++) if (x[i - 1] < 0 && x[i] >= 0) { c++; if (f < 0) f = i; l = i; } return c > 1 ? +((c - 1) * sr / (l - f)).toFixed(2) : 0; };
        const w = Math.round(sr * 0.004), envOf = x => { const o = []; for (let i = 0; i + w <= x.length; i += w) { let s = 0; for (let j = i; j < i + w; j++) s += x[j] * x[j]; o.push(Math.sqrt(2 * s / w)); } return o; };
        const eL = envOf(L), skip = 10;                                      // the first 40 ms left out
        const mid = eL.slice(skip), eMax = Math.max(...mid), eMin = Math.min(...mid), dt = w / sr;
        // pulses: rises through half the loudness, counted in a window of the loudness curve
        const rises = (a, b) => { let c = 0; for (let i = Math.max(1, a); i < b; i++) if (eL[i - 1] < eMax / 2 && eL[i] >= eMax / 2) c++; return c; };
        // each ear's level at a few pitches (Goertzel over the whole render: half a hertz apart for two seconds)
        const amp = (x, f) => { const k = 2 * Math.cos(2 * Math.PI * f / sr); let s1 = 0, s2 = 0; for (let j = 0; j < x.length; j++) { const s0 = x[j] + k * s1 - s2; s2 = s1; s1 = s0; } return +(2 * Math.sqrt(Math.max(0, s1 * s1 + s2 * s2 - k * s1 * s2)) / x.length).toFixed(3); };
        const at = x => ({ 240: amp(x, 240), 250: amp(x, 250), 255: amp(x, 255), 260: amp(x, 260) });
        // the edges, from the peak level every half millisecond over one carrier cycle: 10% to 90% on each rise, in ms
        const h = Math.round(sr * 0.0005), pk = [];
        for (let a = 0; a + w <= L.length; a += h) { let m = 0; for (let j = a; j < a + w; j++) m = Math.max(m, Math.abs(L[j])); pk.push(m); }
        const pMax = Math.max(...pk), edges = []; let lo = -1;
        for (let j = 1; j < pk.length; j++) { if (pk[j] <= 0.1 * pMax) lo = j; else if (lo >= 0 && pk[j] >= 0.9 * pMax) { edges.push((j - lo) * h / sr * 1000); lo = -1; } }
        // a steady tone holds its peak level: the lowest peak over the highest, in 20 ms windows
        const flat = x => { const v = []; const n20 = Math.round(sr * 0.02); for (let a = n20; a + n20 <= x.length; a += n20) { let m = 0; for (let j = a; j < a + n20; j++) m = Math.max(m, Math.abs(x[j])); v.push(m); } return +(Math.min(...v) / Math.max(...v)).toFixed(3); };
        let peakL = 0, peakR = 0, diff = 0;
        for (let j = 0; j < L.length; j++) { peakL = Math.max(peakL, Math.abs(L[j])); peakR = Math.max(peakR, Math.abs(R[j])); diff = Math.max(diff, Math.abs(L[j] - R[j])); }
        const n = eL.length, q = Math.round(n / 4);
        return { peakL: +peakL.toFixed(3), peakR: +peakR.toFixed(3), same: diff < 1e-6, aL: at(L), aR: at(R),
          hzR0: hz(R, 0, Math.round(L.length / 4)), hzR1: hz(R, Math.round(L.length * 3 / 4), L.length),
          flatL: flat(L), flatR: flat(R), depth: +(1 - eMin / eMax).toFixed(3), rate: +(rises(skip, n) / ((n - skip) * dt)).toFixed(2),
          rate0: +(rises(1, q) / (q * dt)).toFixed(2), rate1: +(rises(n - q, n) / (q * dt)).toFixed(2),
          half: +(mid.filter(v => v > eMax / 2).length / mid.length).toFixed(3), top: +(mid.filter(v => v > 0.9 * eMax).length / mid.length).toFixed(3),
          edge: edges.length ? +(edges.reduce((a, b) => a + b, 0) / edges.length).toFixed(1) : null };
      }, [mode, track, secs, offset]);
      const steady = { carrier: 250, beat: 10, minutes: 1 };
      const b = await render('binaural', steady, 2);
      ok(!b.same && b.aL[250] > 0.48 && b.aL[260] < 0.01 && b.aR[260] > 0.48 && b.aR[250] < 0.01 && b.flatL > 0.99 && b.flatR > 0.99 && b.peakL > 0.49 && b.peakL < 0.51,
        'binaural: 250 Hz in the left ear only and 260 Hz in the right only, each a steady tone at 0.5, so the beat exists only in the head: ' + JSON.stringify([b.aL, b.aR, b.flatL, b.flatR]));
      const m = await render('monaural', steady, 2);
      ok(m.same && m.aL[250] > 0.28 && m.aL[260] > 0.28 && m.aL[255] < 0.02 && m.depth > 0.9 && Math.abs(m.rate - 10) <= 0.6 && m.peakL > 0.58 && m.peakL < 0.61,
        'monaural: both tones, 250 and 260 Hz, in both ears (identical), the sound itself swelling and fading 10 times a second, peaking at 0.6: ' + JSON.stringify([m.aL, m.depth, m.rate, m.peakL]));
      const i = await render('isochronic', steady, 2);
      ok(i.same && i.aL[250] > 0.25 && i.aL[250] > 1.4 * i.aL[260] && Math.abs(i.aL[240] - i.aL[260]) < 0.02 && i.aL[255] < 0.02 && i.depth > 0.95 && Math.abs(i.rate - 10) <= 0.6 && i.peakL > 0.58 && i.peakL < 0.61,
        'isochronic: one 250 Hz tone in both ears (its pulsing adds the even sidebands at 240 and 260 Hz), switched fully on and off 10 times a second, peaking at 0.6: ' + JSON.stringify([i.aL, i.depth, i.rate, i.peakL]));
      ok(i.half > 0.44 && i.half < 0.56 && i.top > 0.3 && i.edge !== null && i.edge >= 4 && i.edge <= 14,
        'a square with rounded edges: on half the time, at full level for ' + Math.round(i.top * 100) + '% of it (a smooth swell would be about 20%), each rise taking ' + i.edge + ' ms, so it doesn\'t click');
      const i40 = await render('isochronic', { carrier: 400, beat: 40, minutes: 1 }, 1);
      ok(Math.abs(i40.rate - 40) <= 1.5 && i40.depth > 0.8, 'and at 40 Hz on a 400 Hz carrier it still pulses 40 times a second: ' + JSON.stringify([i40.rate, i40.depth]));
      const slide = { carrier: 250, beat: 12, minutes: 1, pts: [[0, 4], [3, 12]] };
      const sb = await render('binaural', slide, 3), sm = await render('monaural', slide, 3), si = await render('isochronic', slide, 3);
      ok(sb.hzR0 > 254 && sb.hzR0 < 256 && sb.hzR1 > 260.5 && sb.hzR1 < 262.5 && sb.aL[250] > 0.48, 'a slide from 4 to 12 Hz: the left ear stays at 250 Hz and binaural\'s right ear glides from about 255 to 261 Hz: ' + [sb.hzR0, sb.hzR1].join(' → '));
      ok(sm.rate0 >= 3.5 && sm.rate0 <= 6.5 && sm.rate1 >= 9.5 && sm.rate1 <= 13, 'monaural swells faster as it slides: ' + sm.rate0 + ' → ' + sm.rate1 + ' a second');
      ok(si.rate0 >= 3.5 && si.rate0 <= 6.5 && si.rate1 >= 9.5 && si.rate1 <= 13, 'isochronic pulses faster as it slides: ' + si.rate0 + ' → ' + si.rate1 + ' a second');
      const late = await render('isochronic', { carrier: 250, beat: 14, minutes: 1, pts: [[0, 4], [10, 14]] }, 1, 5);
      ok(late.rate >= 8 && late.rate <= 11, 'joined five seconds into a 4 to 14 Hz slide (a seek, a resume), it pulses at about 9.5 a second: ' + late.rate);
      const ramp = await render('isochronic', { carrier: 250, beat: 12, minutes: 3 / 60, rampFrom: 4 }, 3);
      ok(ramp.rate0 >= 3.5 && ramp.rate0 <= 6.5 && ramp.rate1 >= 9.5 && ramp.rate1 <= 13, 'and a track\'s own ramp (rampFrom) too: ' + ramp.rate0 + ' → ' + ramp.rate1);
      await p.context().close();
    }

    /* B. locked, on the real build: every Sound choice shows the cup and asks for the donation */
    if (!only || only === 'B') {
      const p = await page();
      await go(p, 'track/theta-meditation');
      ok(await seg(p, '#trBody .bm-seg') === 'Binaural headphones* | Monaural speakers+ | Isochronic speakers+', 'a track\'s page: Sound, binaural chosen, the two speaker ways with the cup: ' + await seg(p, '#trBody .bm-seg'));
      ok(/^Sound ?Binaural needs headphones; monaural and isochronic play on speakers too\./.test(await t(p, '#trBody .bm-row .so-l')), 'with a line on what each needs: ' + await t(p, '#trBody .bm-row .so-l'));
      await p.click('#trBody .bm-seg button[data-bm="monaural"]'); await p.waitForTimeout(300);
      const d1 = await dlg(p);
      ok(d1.open && d1.for === 'The monaural beat is one of the new techniques.', 'Monaural opens the donation dialog, naming it: ' + d1.for);
      await shut(p);
      ok(await E(p, () => localStorage.getItem('entrain.beatMode')) === null && /Binaural headphones\*/.test(await seg(p, '#trBody .bm-seg')) && /^Headphones each ear/.test(await t(p, '#trNeeds li')),
        'and nothing changes: still binaural, with headphones needed');
      await p.click('#trBody .bm-seg button[data-bm="isochronic"]'); await p.waitForTimeout(300);
      ok((await dlg(p)).for === 'The isochronic tone is one of the new techniques.', 'Isochronic the same: ' + (await dlg(p)).for);
      await p.keyboard.press('Escape'); await p.waitForTimeout(200);
      await p.click('#trGo'); await p.waitForTimeout(800);
      const n0 = await now(p);
      ok(n0.mode === 'binaural' && n0.R === 256 && n0.L === 250 && n0.ears === 'L 250 Hz | R 256.0 Hz | beat 6.0 Hz' && n0.recheck && !/binaural|isochronic|monaural/.test(n0.album),
        'Play plays it binaural, as before: ' + n0.ears);
      await p.click('#stop'); await p.waitForTimeout(300);
      await go(p, 'track/tinnitus-notch');
      ok(!(await p.$('#trBody .bm-row')) && /^Headphones each ear/.test(await t(p, '#trNeeds li')), 'the notched tinnitus track has no choice: binaural only, as its studies played it');
      for (const [h, name] of [['builder', 'the beat builder'], ['prime', 'the custom primer']]) {
        await go(p, h);
        const s = await seg(p, '#v-' + h + ' .bm-seg');
        await p.click('#v-' + h + ' .bm-seg button[data-bm="isochronic"]'); await p.waitForTimeout(300);
        const d = await dlg(p);
        await shut(p);
        ok(s === 'Binaural headphones* | Monaural speakers+ | Isochronic speakers+' && d.open && /^Headphones each ear/.test(await t(p, '#v-' + h + ' .bm-need')), name + ': the same choice, asking the same: ' + s);
      }
      ok(await t(p, '#cEars') === 'Left ear 250 Hz · Right ear 260.0 Hz', 'the builder still reads out each ear: ' + await t(p, '#cEars'));
      await go(p, 'st-beats', 500);
      const st = await E(p, () => { const c = document.querySelector('#st-beats'); return c ? { h: c.querySelector('h2').textContent, link: !!c.querySelector('a[href="#l-iso"]'), top: Math.round(c.getBoundingClientRect().top) } : null; });
      ok(st && st.h === 'Beats' && st.link && st.top < 300 && await seg(p, '#stBeat') === 'Binaural headphones* | Monaural speakers+ | Isochronic speakers+', 'Settings: a Beats card at #st-beats, the default for every beat, linking to the research: ' + JSON.stringify(st));
      await p.click('#stBeat button[data-bm="monaural"]'); await p.waitForTimeout(300);
      ok((await dlg(p)).open, 'and the default asks for the donation too');
      await shut(p);
      await go(p, 'st-supporter', 400);
      ok(/Monaural beats and isochronic tones/.test(await E(p, () => [...document.querySelectorAll('#supList a')].map(a => a.textContent + '>' + a.getAttribute('href')).join(', '))),
        'New techniques lists them: ' + await E(p, () => [...document.querySelectorAll('#supList a')].map(a => a.textContent + '>' + a.getAttribute('href')).join(', ')));
      await go(p, 'practice/calm-reset', 500);
      await E(p, () => { const b = document.querySelector('#sOptsBtn'); if (b.getAttribute('aria-expanded') !== 'true') b.click(); });
      await p.waitForTimeout(150);
      ok(await seg(p, '#sOptMode') === 'Binaural headphones* | Monaural speakers+ | Isochronic speakers+', 'a practice\'s Options have it under the beat: ' + await seg(p, '#sOptMode'));
      ok(await E(p, () => { const r = document.querySelector('#sOptMode').closest('.so-row'); return r.previousElementSibling && r.previousElementSibling.querySelector('#sOptBeat') !== null; }), 'right after the beat it plays');
      await p.click('#sOptMode button[data-bm="isochronic"]'); await p.waitForTimeout(300);
      ok((await dlg(p)).open && await E(p, () => localStorage.getItem('entrain.pOpt.calm-reset')) === null, 'picking one asks, and keeps nothing');
      await shut(p);
      // search and Learn
      await p.click('#tbFind'); await p.waitForTimeout(150); await p.fill('#fdIn', 'isochronic'); await p.waitForTimeout(300);
      const hit = await E(p, () => [...document.querySelectorAll('#fdRes a.fd-it')].map(a => a.querySelector('b').textContent + '>' + a.getAttribute('href') + (a.querySelector('.sup-tag') ? ' +sup' : '')));
      ok(hit.includes('Beat sound>#st-beats +sup') && hit.some(h => /^Monaural beats and isochronic tones>#lx-/.test(h)), 'search finds the setting (with the badge) and Learn\'s section: ' + hit.slice(0, 4).join(', '));
      await p.keyboard.press('Escape'); await p.waitForTimeout(150);
      await go(p, 'l-iso', 500);
      const L = await E(p, () => {
        const h = document.querySelector('#l-iso'), ps = []; let e = h && h.nextElementSibling;
        while (e && e.tagName === 'P') { ps.push(e.textContent.replace(/\s+/g, ' ').trim()); e = e.nextElementSibling; }
        const refs = [...document.querySelectorAll('#references li')].map(li => li.textContent);
        return { h: h && h.textContent, toc: !!document.querySelector('.toc a[href="#l-iso"]'), ps, chaieb: refs.filter(r => /^Chaieb, L\., Wilpert, E\. C\., Reber, T\. P\., & Fell, J\. \(2015\)\. Auditory beat stimulation and its effects on cognition and mood states\./.test(r)).length,
          link: !!document.querySelector('#references a[href="https://pmc.ncbi.nlm.nih.gov/articles/PMC4428073/"]'), glance: [...document.querySelectorAll('#lnGlance tr.ln-row')].filter(r => /isochronic/.test(r.textContent)).map(r => [...r.querySelectorAll('a')].map(a => a.getAttribute('href')).join(' ') + ' ' + r.children[1].textContent).join('') };
      });
      ok(L.h === 'Monaural beats and isochronic tones' && L.toc && L.ps.length === 2 && /\(Oster, 1973\)/.test(L.ps[0]) && /\(Chaieb et al\., 2015\)/.test(L.ps[1]) && L.chaieb === 1 && L.link,
        'Learn explains both, with the contents link, Oster\'s monaural beats and the 2015 review with its reference');
      ok(/the evidence is mixed, and similar/.test(L.ps[1]) && /tinnitus track stays binaural/.test(L.ps[1]) && L.glance === '#sounds #l-iso Mixed', 'the evidence as the guide rates it, mixed and like binaural beats\', and the glance table points here: ' + L.glance);
      await p.context().close();
      // a speaker way kept from before (a backup from an unlocked phone) plays binaural on a locked one, headphone check and all
      const q = await page({ beatMode: 'isochronic' }, { stereo: false });
      await go(q, 'track/theta-meditation');
      ok(/Binaural headphones\*/.test(await seg(q, '#trBody .bm-seg')) && /^Headphones/.test(await t(q, '#trNeeds li')), 'a kept speaker way shows binaural while the device is locked');
      await q.click('#trGo'); await q.waitForTimeout(400);
      const sc = await E(q, () => !document.querySelector('#scModal').hidden);
      await q.click('#scSkip'); await q.waitForTimeout(600);
      ok(sc && (await now(q)).mode === 'binaural' && (await now(q)).R === 256, 'and plays binaural, after the headphone check');
      await q.context().close();
    }

    /* C. unlocked: a track in each way */
    if (!only || only === 'C') {
      const p = await page({}, { url: URL, unlock: true, stereo: false });
      ok(await E(p, () => window.__entrain.SUP.ok), 'the test copy is unlocked');
      await go(p, 'track/theta-meditation');
      ok(await seg(p, '#trBody .bm-seg') === 'Binaural headphones* | Monaural speakers | Isochronic speakers', 'no cups once unlocked: ' + await seg(p, '#trBody .bm-seg'));
      await p.click('#trBody .bm-seg button[data-bm="monaural"]'); await p.waitForTimeout(300);
      ok(!(await dlg(p)).open && await E(p, () => localStorage.getItem('entrain.beatMode')) === 'monaural' && /Monaural speakers\*/.test(await seg(p, '#trBody .bm-seg')), 'Monaural is chosen at once, and kept for this device');
      ok(/^Speakers or headphones both tones play in both ears/.test(await t(p, '#trNeeds li')) && !(await p.$('#trNeeds .si-check')) &&
        /two tones, 250 Hz and one a little higher, both in each ear, so the sound itself swells and fades at the beat/.test(await t(p, '#trHow')), 'the page says what it needs and how it runs now: ' + await t(p, '#trNeeds li'));
      await p.click('#trGo'); await p.waitForTimeout(600);
      ok(!(await E(p, () => !document.querySelector('#scModal').hidden)), 'Play asks for no headphone check (none has been done on this device)');
      await p.waitForTimeout(2000);
      let n = await now(p), s = await listen(p);
      ok(n.mode === 'monaural' && n.playing && n.L === 250 && n.R === 256 && n.pulse === null, 'it plays monaural: the 250 and 256 Hz tones');
      ok(s.same && s.depth > 0.85 && s.peak > 0.01, 'both ears get the same sound, swelling and fading at the beat: ' + JSON.stringify(s));
      ok(n.ears === 'Low 250 Hz | High 256.0 Hz | beat 6.0 Hz' && /6\.0 Hz monaural · 250 Hz carrier/.test(n.sub) && !n.recheck && /monaural$/.test(n.album),
        'the player shows both tones, its line says monaural, the headphone re-check goes, and the lock screen says it: ' + [n.ears, n.sub, n.album].join(' / '));
      ok(await E(p, () => window.__entrain.beatPlaying()) === false, 'a Bluetooth microphone may stay: a monaural beat survives mono earbuds');
      const m0 = n.master;
      await p.click('#trBody .bm-seg button[data-bm="isochronic"]'); await p.waitForTimeout(700);
      n = await now(p); s = await listen(p);
      ok(n.mode === 'isochronic' && n.playing && n.pulse === 6 && n.R === null && n.L === 250 && Math.abs(n.master - m0) < 0.02,
        'picked while it plays, isochronic takes over at once, its pulse at 6 Hz, the volume kept: ' + JSON.stringify([n.pulse, m0, n.master]));
      ok(s.same && s.depth > 0.9, 'both ears the same, switching on and off: ' + JSON.stringify(s));
      ok(n.ears === 'Tone 250 Hz | pulse 6.0 Hz' && /6\.0 Hz isochronic/.test(n.sub) && /isochronic$/.test(n.album), 'the player shows the tone and its pulse: ' + n.ears + ' / ' + n.album);
      await p.click('#toggle'); await p.waitForTimeout(600);
      const paused = await now(p);
      await p.click('#toggle'); await p.waitForTimeout(800);
      n = await now(p);
      ok(!paused.playing && !paused.vx && n.playing && n.mode === 'isochronic' && n.pulse === 6, 'pause stops its voices, and play brings them back isochronic');
      await E(p, () => { window.__entrain.A.startedAt -= 90; });             // a minute and a half in, so the history keeps it
      await p.click('#stop'); await p.waitForTimeout(500);
      const h = await E(p, () => JSON.parse(localStorage.getItem('entrain.history') || '[]').slice(-1)[0]);
      ok(!(await now(p)).vx && h && h.id === 'theta-meditation' && h.bm === 'isochronic', 'Stop ends it, and the history keeps how it played: ' + JSON.stringify(h));
      await go(p, 'history', 500);
      ok(/isochronic/.test(await t(p, '.hi-e')), 'History says so: ' + await t(p, '.hi-e'));
      await go(p, 'track/theta-meditation');
      await p.click('#trBody .bm-seg button[data-bm="binaural"]'); await p.waitForTimeout(200);
      await p.click('#trGo'); await p.waitForTimeout(400);
      const sc = await E(p, () => !document.querySelector('#scModal').hidden);
      await p.click('#scSkip'); await p.waitForTimeout(800);
      n = await now(p);
      ok(sc && n.mode === 'binaural' && n.R === 256 && n.recheck && await E(p, () => window.__entrain.beatPlaying()) === true, 'back to binaural, Play asks for the headphone check again, and a Bluetooth microphone moves aside for it');
      await p.screenshot({ path: OUT + 'isotest-c-track.png' });
      await p.context().close();
    }

    /* D. unlocked: the beat builder, the custom primer, Settings' default and the library */
    if (!only || only === 'D') {
      const p = await page({}, { url: URL, unlock: true });
      await go(p, 'builder');
      await p.click('#v-builder .bm-seg button[data-bm="monaural"]'); await p.waitForTimeout(200);
      ok(await t(p, '#cEars') === 'Both ears 250 Hz and 260.0 Hz' && /^Speakers or headphones/.test(await t(p, '#v-builder .bm-need')), 'the builder: both tones in both ears: ' + await t(p, '#cEars'));
      await p.click('#v-builder .bm-seg button[data-bm="isochronic"]'); await p.waitForTimeout(200);
      ok(await t(p, '#cEars') === 'Both ears 250 Hz, on and off 10.0 times a second', 'or one tone, on and off: ' + await t(p, '#cEars'));
      await p.click('#cPlay'); await p.waitForTimeout(1000);
      let n = await now(p);
      ok(n.mode === 'isochronic' && n.pulse === 10 && await E(p, () => window.__entrain.A.track.id) === 'custom', 'and plays it so: ' + JSON.stringify([n.mode, n.pulse]));
      await p.click('#stop'); await p.waitForTimeout(300);
      // the primer: then pink noise only, the beat fades out under it
      await go(p, 'prime');
      ok(/Isochronic speakers\*/.test(await seg(p, '#v-prime .bm-seg')), 'the primer shows the same choice: ' + await seg(p, '#v-prime .bm-seg'));
      await p.click('#ptChips label:has(input[value="noise"])'); await p.waitForTimeout(100);
      await p.click('#primeStart'); await p.waitForTimeout(2200);
      n = await now(p);
      ok(n.mode === 'isochronic' && n.pulse === 14 && /^Prime · Beta · 14\.0 Hz isochronic/.test(n.sub), 'a 14 Hz prime, isochronic: ' + n.sub);
      await E(p, () => { window.__vb = window.__entrain.A.vbus; window.__entrain.enterTask(); });
      await p.waitForTimeout(4700);
      const task = await E(p, () => { const A = window.__entrain.A; return { off: A.voicesOff, vx: !!A.vx, vb: +window.__vb.gain.value.toFixed(3), noise: !!A.noiseSrc, master: +A.master.gain.value.toFixed(3), playing: A.playing }; });
      ok(task.off && !task.vx && task.vb === 0 && task.noise && task.master > 0.02 && task.playing, 'the task phase fades the beat out alone and the pink noise carries on: ' + JSON.stringify(task));
      await p.click('#stop'); await p.waitForTimeout(300);
      await go(p, 'prime');
      await p.click('#v-prime .bm-seg button[data-bm="monaural"]'); await p.waitForTimeout(100);
      await p.click('#ptChips label:has(input[value="continue"])'); await p.waitForTimeout(100);
      await p.click('#primeStart'); await p.waitForTimeout(2200);
      const m0 = (await now(p)).master;
      await E(p, () => window.__entrain.enterTask());
      await p.waitForTimeout(6300);
      n = await now(p);
      ok(n.mode === 'monaural' && n.vx && n.R === 334 && m0 > 0 && n.master / m0 > 0.4 && n.master / m0 < 0.5, 'or, monaural, carries on at about half the volume: ' + JSON.stringify([m0, n.master]));
      await p.click('#stop'); await p.waitForTimeout(300);
      // Settings' default, and the library's needs follow it
      await go(p, 'st-beats', 500);
      ok(/Monaural speakers\*/.test(await seg(p, '#stBeat')), 'Settings shows the choice made on the primer: one choice for every beat');
      await p.click('#stBeat button[data-bm="isochronic"]'); await p.waitForTimeout(200);
      const lib = await E(p, () => { const all = window.__entrain.libAll(); return { tracks: all.filter(x => x.type === 'track').every(x => x.needs.indexOf('phones') < 0), prime: all.find(x => x.key === 'x:prime').needs.join(), sleep: all.find(x => x.key === 'sleep-descent').needs.join() }; });
      ok(await E(p, () => localStorage.getItem('entrain.beatMode')) === 'isochronic' && lib.tracks && lib.prime === '' && !/phones/.test(lib.sleep),
        'chosen in Settings, and the library no longer says headphones for the tracks, the primer or a practice\'s beat: ' + JSON.stringify(lib));
      await p.click('#stBeat button[data-bm="binaural"]'); await p.waitForTimeout(200);
      ok(await E(p, () => window.__entrain.libAll().filter(x => x.type === 'track').every(x => x.needs.indexOf('phones') >= 0)), 'binaural again: headphones again');
      await p.context().close();
    }

    /* E. unlocked: practices */
    if (!only || only === 'E') {
      const p = await page({ optsOpen: '1', beatMode: 'binaural' }, { url: URL, unlock: true, stereo: false });
      await go(p, 'practice/calm-reset', 500);
      await p.click('#sOptMode button[data-bm="isochronic"]'); await p.waitForTimeout(400);
      const i = await E(p, () => { const q = s => document.querySelector(s), tx = e => e ? e.textContent.replace(/\s+/g, ' ').trim() : ''; return {
        own: localStorage.getItem('entrain.pOpt.calm-reset'), dev: localStorage.getItem('entrain.beatMode'), focus: document.activeElement && document.activeElement.getAttribute('data-bm'),
        need: tx(q('#sIntro .si-need li')), note: tx(q('#sBeatNote')), caution: tx(q('#sIntro .si-caution')), sum: tx(q('#sOptsSum')), scope: tx(q('#sOptsScope')) }; });
      ok(i.own === '{"beatMode":"isochronic"}' && i.dev === 'binaural' && i.focus === 'isochronic' && /You've changed these/.test(i.scope), 'Calm Reset keeps isochronic as its own, the device stays binaural, and the button keeps the focus: ' + i.own);
      ok(/^Speakers or headphones for the beat/.test(i.need) && /10 Hz down to 6 Hz.*250 Hz carrier\. Isochronic: speakers or headphones\.$/.test(i.note) && /About its beat: ask your doctor first/.test(i.caution) && /Isochronic/.test(i.sum),
        'its page says so: what it needs, the beat\'s note, its caution and the options line: ' + [i.need, i.note, i.sum].join(' / '));
      await p.click('#sGo'); await p.waitForTimeout(400);
      ok(!(await E(p, () => !document.querySelector('#scModal').hidden)), 'Start asks for no headphone check');
      await p.waitForTimeout(1500);
      let b = await E(p, () => { const X = window.__entrain, A = X.A; return { mode: A.mode, own: A.track.beatMode, pulse: +A.lfo.frequency.value.toFixed(2), want: +(10 - 4 * ((A.ctx.currentTime - A.startedAt) / 600)).toFixed(2), vol: document.querySelector('#sqVol').getAttribute('aria-label'), adj: document.querySelector('#sAdjBt').getAttribute('aria-label') }; });
      ok(b.mode === 'isochronic' && b.own === 'isochronic' && Math.abs(b.pulse - b.want) < 0.05 && b.vol === 'Beat volume' && b.adj === 'Beat', 'it runs isochronic, pulsing where the slide is (' + b.pulse + ' Hz), and the session\'s controls say beat: ' + JSON.stringify(b));
      await E(p, () => window.__entrain.pBeatStep(1)); await p.waitForTimeout(1800);
      b = await E(p, () => { const X = window.__entrain, A = X.A; return { pulse: +A.lfo.frequency.value.toFixed(2), want: +(11 - 4 * ((A.ctx.currentTime - A.startedAt) / 600)).toFixed(2), adj: X.P.beatAdj }; });
      ok(b.adj === 1 && Math.abs(b.pulse - b.want) < 0.06, 'the beat moved up 1 Hz while it runs: the pulse glides there (' + b.pulse + ' Hz)');
      await p.click('#sPlay'); await p.waitForTimeout(600);
      const ps = await E(p, () => ({ playing: window.__entrain.A.playing, vx: !!window.__entrain.A.vx }));
      await p.click('#sPlay'); await p.waitForTimeout(800);
      b = await E(p, () => { const A = window.__entrain.A; return { playing: A.playing, mode: A.mode, pulse: A.lfo ? +A.lfo.frequency.value.toFixed(2) : null, want: +(11 - 4 * ((A.ctx.currentTime - A.startedAt) / 600)).toFixed(2) }; });
      ok(!ps.playing && !ps.vx && b.playing && b.mode === 'isochronic' && Math.abs(b.pulse - b.want) < 0.06, 'paused and resumed, isochronic, still 1 Hz up: ' + JSON.stringify(b));
      await p.click('#sAdjBtOn'); await p.waitForTimeout(1600);
      const off = await E(p, () => ({ on: window.__entrain.P.audioOn, vx: !!window.__entrain.A.vx }));
      await p.click('#sAdjBtOn'); await p.waitForTimeout(900);
      b = await E(p, () => { const A = window.__entrain.A; return { on: window.__entrain.P.audioOn, mode: A.mode, pulse: !!A.lfo, sc: !document.querySelector('#scModal').hidden }; });
      ok(!off.on && !off.vx && b.on && b.mode === 'isochronic' && b.pulse && !b.sc, 'the beat off fades it, and on again it comes back isochronic with no headphone check');
      await p.waitForTimeout(1200);
      const full = await E(p, () => window.__entrain.A.master.gain.value);
      await E(p, () => { const P = window.__entrain.P; P.t0 -= P.total; }); await p.waitForTimeout(900);
      const f1 = await E(p, () => window.__entrain.A.master.gain.value);
      await p.waitForTimeout(900);
      const f2 = await E(p, () => window.__entrain.A.master.gain.value);
      await p.waitForTimeout(2600);
      const h = await E(p, () => JSON.parse(localStorage.getItem('entrain.history') || '[]').slice(-1)[0]);
      ok(f1 < full && f2 < f1 && !(await E(p, () => !!window.__entrain.A.vx)) && h && h.id === 'calm-reset' && h.bm === 'isochronic',
        'at the end the beat fades out, then stops, and the history keeps how it played: ' + JSON.stringify({ bm: h && h.bm, fade: [full, f1, f2].map(x => +x.toFixed(3)) }));
      // another practice follows the device's choice; Use these for every practice makes the practice's the device's
      await go(p, 'practice/sleep-descent', 500);
      ok(/Binaural headphones\*/.test(await seg(p, '#sOptMode')) && /^Headphones for the binaural layer/.test(await t(p, '#sIntro .si-need li')), 'Sleep Descent, with no Sound of its own, follows the device: binaural');
      await go(p, 'practice/calm-reset', 500);
      await p.click('#sOptsAll'); await p.waitForTimeout(400);
      ok(await E(p, () => localStorage.getItem('entrain.beatMode')) === 'isochronic' && await E(p, () => localStorage.getItem('entrain.pOpt.calm-reset')) === null, 'Use these for every practice makes isochronic this device\'s choice');
      await go(p, 'practice/sleep-descent', 500);
      ok(/Isochronic speakers\*/.test(await seg(p, '#sOptMode')), 'and Sleep Descent follows it');
      const needs = {};
      for (const id of ['morning-tonic', 'meal', 'call']) { await go(p, 'practice/' + id, 450); needs[id] = await t(p, '#sIntro .si-need li'); }
      const lib = await E(p, () => { const all = window.__entrain.libAll(), n = k => all.find(x => x.key === k).needs.join(); return { call: n('call'), meal: n('meal') }; });
      ok(needs['morning-tonic'] === 'Speakers or headphones for the beat, at a low volume' && /^Speakers or headphones for the beat, at half your usual volume/.test(needs.meal) &&
        /^Headphones the beat plays under the call's audio/.test(needs.call) && /phones/.test(lib.call) && !/phones/.test(lib.meal),
        'practices that list their own needs say speakers too, but During the Call still asks for headphones, since a speaker would play the beat into the call: ' + JSON.stringify(needs));
      await go(p, 'track/alpha-stress', 400);
      ok(/Isochronic speakers\*/.test(await seg(p, '#trBody .bm-seg')), 'so do the tracks');
      await go(p, 'builder', 400);
      ok(/Isochronic speakers\*/.test(await seg(p, '#v-builder .bm-seg')) && /^Both ears 250 Hz, on and off/.test(await t(p, '#cEars')), 'and the beat builder, drawn before it changed: ' + await t(p, '#cEars'));
      await p.context().close();
      // heart-led beats, set live from the heart, in each speaker way
      for (const mode of ['monaural', 'isochronic']) {
        const q = await page({ beatMode: mode }, { url: URL, unlock: true, stereo: false });
        await go(q, 'practice/heart-led', 500);
        await q.click('.si-len button[data-len="15"]'); await q.waitForTimeout(150);
        await q.click('#sGo'); await q.waitForTimeout(900);
        await E(q, () => window.__entrain.aBeat(7, 0.05)); await q.waitForTimeout(600);
        const r = await E(q, () => { const A = window.__entrain.A; return { mode: A.mode, dyn: A.track.dyn, cur: A.track.cur, beat: A.lfo ? +A.lfo.frequency.value.toFixed(2) : +(A.oscR.frequency.value - A.track.carrier).toFixed(2) }; });
        ok(r.mode === mode && r.dyn && r.cur === 7 && Math.abs(r.beat - 7) < 0.05, 'Heart-Led Beats, ' + mode + ': the beat set live moves to 7 Hz: ' + JSON.stringify(r));
        await q.context().close();
      }
    }

    /* F. unlocking from the dialog a Sound choice opened: it goes ahead, and the cups go at once */
    if (!only || only === 'F') {
      const p = await page({}, { url: URL });
      await go(p, 'track/theta-meditation');
      const dev = await E(p, () => window.__entrain.supDevice());
      await p.click('#trBody .bm-seg button[data-bm="isochronic"]'); await p.waitForTimeout(300);
      ok((await dlg(p)).open && !(await E(p, () => window.__entrain.SUP.ok)), 'the test copy with no code: Isochronic asks for the donation');
      await p.fill('#supIn', sign(dev)); await p.click('#supGo');
      await until(p, () => window.__entrain.SUP.ok, 5000);
      ok(await seg(p, '#trBody .bm-seg') === 'Binaural headphones* | Monaural speakers | Isochronic speakers', 'once unlocked the cups go at once, behind the dialog');
      await p.click('#supClose'); await p.waitForTimeout(300);
      ok(/Isochronic speakers\*/.test(await seg(p, '#trBody .bm-seg')) && await E(p, () => localStorage.getItem('entrain.beatMode')) === 'isochronic', 'and as the dialog closes, the choice that opened it goes ahead');
      await p.context().close();
    }

    /* G. at 360 px, and the words */
    if (!only || only === 'G') {
      const p = await page({ optsOpen: '1' }, { url: URL, unlock: true, vp: { width: 360, height: 740 } });
      const locked = await page({ optsOpen: '1' }, { vp: { width: 360, height: 740 } });
      const bad = [];
      for (const [q, name] of [[p, 'unlocked'], [locked, 'locked']]) {
        for (const h of ['track/theta-meditation', 'builder', 'prime', 'st-beats', 'practice/calm-reset', 'practice/heart-led']) {
          await go(q, h, 450);
          const r = await E(q, () => {
            const g = [...document.querySelectorAll('.view:not([hidden]) .bm-seg')].filter(x => x.offsetParent);
            return { wide: document.documentElement.scrollWidth > document.documentElement.clientWidth, n: g.length,
              short: g.flatMap(x => [...x.querySelectorAll('button')].filter(b => b.getBoundingClientRect().height < 44)).length, clip: g.filter(x => x.scrollWidth > x.clientWidth + 1).length };
          });
          if (r.wide || r.n !== 1 || r.short || r.clip) bad.push(name + ' ' + h + ' ' + JSON.stringify(r));
        }
      }
      ok(!bad.length, 'at 360 px, locked and unlocked, every page with the choice fits the screen, its three buttons at least 44 px tall and in full' + (bad.length ? ': ' + bad.join('; ') : ''));
      await go(locked, 'practice/calm-reset', 450);
      await locked.screenshot({ path: OUT + 'isotest-g-options.png', fullPage: true });
      const words = await E(p, () => {
        const X = window.__entrain, out = [document.querySelector('#v-builder .bm-row').textContent, document.querySelector('#l-iso').textContent];
        let e = document.querySelector('#l-iso').nextElementSibling;
        while (e && e.tagName === 'P') { out.push(e.textContent); e = e.nextElementSibling; }
        return out.join(' ');
      });
      await go(p, 'st-beats', 400);
      const st = await t(p, '#st-beats');
      await go(p, 'track/theta-meditation');
      await p.click('#trBody .bm-seg button[data-bm="monaural"]'); await p.waitForTimeout(200);
      const tr1 = await t(p, '#trBody');
      await p.click('#trBody .bm-seg button[data-bm="isochronic"]'); await p.waitForTimeout(200);
      const tr2 = await t(p, '#trBody');
      const all = [words, st, tr1, tr2].join(' ');
      ok(!SPELL.test(all), 'British spelling in everything it says' + (SPELL.test(all) ? ': ' + all.match(SPELL)[0] : ''));
      await p.context().close(); await locked.context().close();
    }
  } catch (e) { log.push('ERROR ' + (e && e.stack || e)); }
  await browser.close();
  console.log(log.join('\n'));
  console.log(log.filter(l => l.startsWith('PASS')).length + ' passed, ' + log.filter(l => /^(FAIL|PAGEERROR|ERROR|CONSOLE)/.test(l)).length + ' problems');
  process.exitCode = log.some(l => /^(FAIL|PAGEERROR|ERROR|CONSOLE)/.test(l)) ? 1 : 0;
})();
