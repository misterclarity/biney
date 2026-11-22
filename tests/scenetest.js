// Scenes to watch (scenes.js): drifting clouds, rippling water, swaying leaves, a misty forest, fractal ridgelines,
// flowers and a fire, drawn on the device, as Breathe's visual following the breath and in place of a practice's orb,
// with the scenes you find restful picked in Settings.
//   A  the drawing: every scene drawn, the same twice, moving with time and following the breath, no blurred shadows;
//      the fractal's ridgelines measured at a dimension of about 1.4, within 1.3 to 1.5; still with reduced motion,
//      when only the light follows the breath
//   B  locked on the real build: Breathe's Scene chip and a practice's Scene row with the cup, each opening the dialog
//      that names it and changing nothing; a scene kept from before showing the usual visual, with no crackle; no Scene
//      row on the Stress Check or During the Call; Settings' Scenes with its pictures and evidence, the cup and the
//      dialog; Settings' list, search, and Learn's section and glance rows, all free to read
//   C  unlocked (the test copy), Breathe: Scene and the row of seven, each scene's words, kept; 30 frames a second while
//      breathing, the picture changing; the fire's crackle with the background off and with rain, gone with a pause
//      and another scene; Scene picked while locked, then unlocked in the dialog, coming on
//   D  unlocked, practices: the Scene row kept for the practice and its summary, the scene in place of the glow and
//      following the breath steps, 30 frames a second, Breathe's own visual back after; Yours from Settings' restful
//      scenes, the fire with its crackle, I need to stop silencing it; a step asking for a scene; the default for every
//      practice
//   E  360 px and 44 px targets, British spelling in the new words
// Run: node tests/scenetest.js [group letter]
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
const IDS = ['clouds', 'water', 'leaves', 'forest', 'fractal', 'flowers', 'fire'];
// the buttons in a group: each one's words, * when chosen, + with the cup
const seg = (p, s) => E(p, s => [...document.querySelectorAll(s)].map(b => b.textContent.trim() + (b.getAttribute('aria-pressed') === 'true' ? '*' : '') + (b.querySelector('.sup-tag') ? '+' : '')).join(' | '), s);
// a radio chip picked as a tap does it: checked, then its change
const pick = (p, sel) => E(p, s => { const r = document.querySelector(s); r.checked = true; r.dispatchEvent(new Event('change', { bubbles: true })); }, sel);
// every canvas's clearRect calls counted by its id, and any blurred shadow kept
const HOOKS = () => {
  window.__cl = {}; window.__blur = [];
  const cr = CanvasRenderingContext2D.prototype.clearRect;
  CanvasRenderingContext2D.prototype.clearRect = function () { const k = this.canvas.id || '?'; window.__cl[k] = (window.__cl[k] || 0) + 1; return cr.apply(this, arguments); };
  const d = Object.getOwnPropertyDescriptor(CanvasRenderingContext2D.prototype, 'shadowBlur');
  Object.defineProperty(CanvasRenderingContext2D.prototype, 'shadowBlur', { configurable: true, get: d.get, set(v) { if (v) window.__blur.push(v); d.set.call(this, v); } });
};
const rate = async (p, id, ms) => { const a = await E(p, k => window.__cl[k] || 0, id); await p.waitForTimeout(ms); return ((await E(p, k => window.__cl[k] || 0, id)) - a) / ms * 1000; };
// a picture of a canvas, as a list of numbers, and how far two of them differ (0 to 255 a channel, on average)
const snap = (p, sel) => E(p, s => { const c = document.querySelector(s), x = document.createElement('canvas'); x.width = 80; x.height = 60; x.getContext('2d').drawImage(c, 0, 0, 80, 60); return [...x.getContext('2d').getImageData(0, 0, 80, 60).data]; }, sel);
const diff = (a, b) => { let s = 0; for (let i = 0; i < a.length; i++) s += Math.abs(a[i] - b[i]); return s / a.length; };

(async () => {
  const browser = await chromium.launch();
  const log = []; const ok = (c, m) => log.push((c ? 'PASS ' : 'FAIL ') + m);
  const URL = testApp();
  // a phone with debug on; o.url: the test copy; o.unlock: this device unlocked; o.rm: reduced motion; o.vp: the viewport
  const page = async (st, o) => {
    o = o || {};
    const ctx = await browser.newContext({ userAgent: S20, viewport: o.vp || { width: 412, height: 915 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, reducedMotion: o.rm ? 'reduce' : 'no-preference' });
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
    await p.addInitScript(HOOKS);
    await p.goto(o.url || APP);
    await unlocked(p);
    await p.waitForTimeout(250);
    return p;
  };
  // every scene drawn into a canvas of its own: { id: [mean of the pixels, their spread, the picture as numbers] }
  const draw = (p, t, lv, W, H) => E(p, ([t, lv, W, H]) => {
    const X = window.__entrain, out = {};
    for (const s of X.SCN_LIST) {
      const c = document.createElement('canvas'); c.width = W; c.height = H;
      const x = c.getContext('2d');
      X.scnPaint(x, W, H, s.id, t, lv);
      const d = x.getImageData(0, 0, W, H).data, px = [];
      let sum = 0, sq = 0, n = 0;
      for (let i = 0; i < d.length; i += 4) { const v = (d[i] + d[i + 1] + d[i + 2]) / 3; sum += v; sq += v * v; n++; px.push(d[i], d[i + 1], d[i + 2], d[i + 3]); }
      out[s.id] = { mean: sum / n, sd: Math.sqrt(sq / n - (sum / n) * (sum / n)), px, corner: d[3], mid: d[((H >> 1) * W + (W >> 1)) * 4 + 3] };
    }
    return out;
  }, [t, lv, W || 160, H || 120]);

  try {
    /* A. the drawing */
    if (!only || only === 'A') {
      const p = await page();
      const a = await draw(p, 12, 0.5), b = await draw(p, 12, 0.5), c = await draw(p, 13.5, 0.5), lo = await draw(p, 12, 0), hi = await draw(p, 12, 1), free = await draw(p, 12, null);
      ok(await E(p, () => window.__entrain.SCN_LIST.map(s => s.id).join(' ')) === IDS.join(' '), 'seven scenes: ' + IDS.join(', '));
      const blank = IDS.filter(id => !(a[id].sd > 6 && a[id].mid === 255));
      ok(!blank.length, 'each draws a picture across its canvas, not a flat colour (spread of brightness ' + IDS.map(id => id + ' ' + a[id].sd.toFixed(0)).join(', ') + ')' + (blank.length ? ': blank ' + blank.join(', ') : ''));
      ok(IDS.every(id => a[id].corner === 0), 'its corners rounded off, like the stage they sit in');
      const same = IDS.filter(id => diff(a[id].px, b[id].px) !== 0);
      ok(!same.length, 'drawn twice for the same moment, each is the same picture' + (same.length ? ': not ' + same.join(', ') : ''));
      const moves = IDS.map(id => [id, diff(a[id].px, c[id].px)]), still = moves.filter(m => !(m[1] > 0.05));
      ok(!still.length, 'a second and a half later each has moved by itself: ' + moves.map(m => m[0] + ' ' + m[1].toFixed(2)).join(', '));
      const slow = moves.filter(m => m[1] > 12);
      ok(!slow.length, 'and gently, nothing jumping (mean change per channel under 12 of 255)' + (slow.length ? ': ' + slow.map(m => m[0]).join(', ') : ''));
      const breath = IDS.map(id => [id, diff(lo[id].px, hi[id].px)]), deaf = breath.filter(m => !(m[1] > 0.5));
      ok(!deaf.length, 'from empty lungs to full, each changes with the breath: ' + breath.map(m => m[0] + ' ' + m[1].toFixed(1)).join(', '));
      ok(IDS.every(id => diff(free[id].px, a[id].px) === 0), 'with no breath to follow it is drawn as at half a breath');
      const brighter = IDS.filter(id => !(hi[id].mean > lo[id].mean));
      ok(!brighter.length, 'and its light grows as you breathe in, in every scene' + (brighter.length ? ': not ' + brighter.join(', ') : ''));
      ok(await E(p, () => window.__blur.length) === 0, 'none of them draws a blurred shadow');
      // the fractal: its ridgelines' dimension, measured two ways on what the scene draws
      const F = await E(p, () => {
        const X = window.__entrain, W = 400, out = [];
        const slope = q => { const n = q.length; let sx = 0, sy = 0, sxx = 0, sxy = 0; q.forEach(([x, y]) => { sx += x; sy += y; sxx += x * x; sxy += x * y; }); return (n * sxy - sx * sy) / (n * sxx - sx * sx); };
        for (let i = 0; i < 4; i++) {
          const f = X.scnRidge(i, W), lags = [2, 3, 4, 6, 8, 12, 16, 24, 32], vg = [];
          // variogram: the mean squared rise over a step grows as the step to the power 2H, and D = 2 - H
          lags.forEach(l => { let s = 0, n = 0; for (let x = 0; x + l < 4 * W; x += 0.5) { const d = f(x + l) - f(x); s += d * d; n++; } vg.push([Math.log(l), Math.log(s / n)]); });
          // box counting on the ridge as drawn on a 400 px wide stage (its first wave 44 px tall), in boxes of 2 to 32 px
          const A = W * 0.11, ys = [], step = 0.25, bx = [];
          for (let x = 0; x <= 4 * W; x += step) ys.push(A * f(x));
          [2, 3, 4, 6, 8, 12, 16, 24, 32].forEach(e => { let N = 0; for (let c = 0; c < Math.ceil(4 * W / e); c++) { let lo = Infinity, hi = -Infinity; const i0 = Math.floor(c * e / step), i1 = Math.min(ys.length - 1, Math.ceil((c + 1) * e / step)); for (let k = i0; k <= i1; k++) { if (ys[k] < lo) lo = ys[k]; if (ys[k] > hi) hi = ys[k]; } N += Math.floor(hi / e) - Math.floor(lo / e) + 1; } bx.push([Math.log(1 / e), Math.log(N)]); });
          out.push({ vario: 2 - slope(vg) / 2, box: slope(bx) });
        }
        return { H: X.SCN_H, lam: X.SCN_LAM, r: out };
      });
      ok(F.H === 0.6 && F.r.every(r => r.vario > 1.35 && r.vario < 1.45),
        'the fractal ridgelines have a roughness of 0.6, a dimension of 2 − 0.6 = 1.4 by construction, and measured that way each of the four comes out at ' + F.r.map(r => r.vario.toFixed(3)).join(', '));
      ok(F.r.every(r => r.box > 1.18 && r.box < 1.32), 'counted in boxes of 2 to 32 px as the nearest ridge is drawn, a little lower, about 1.25, as Learn says (' + F.r.map(r => r.box.toFixed(2)).join(', ') + '): rough, well clear of a smooth line\'s 1');
      await p.context().close();
      // reduced motion: still, and on Breathe only the light follows the breath
      const q = await page(null, { rm: true });
      const r1 = await draw(q, 12, 0.5), r2 = await draw(q, 40, 0.5), rl = await draw(q, 12, 0), rh = await draw(q, 12, 1), rf1 = await draw(q, 5, null), rf2 = await draw(q, 90, null);
      ok(IDS.every(id => diff(r1[id].px, r2[id].px) === 0 && diff(rf1[id].px, rf2[id].px) === 0), 'with reduced motion every scene is still: the same picture half a minute later, in a practice or on Breathe');
      ok(IDS.every(id => diff(rl[id].px, rh[id].px) > 0.3 && rh[id].mean > rl[id].mean), 'and on Breathe only its light follows the breath: ' + IDS.map(id => id + ' ' + diff(rl[id].px, rh[id].px).toFixed(1)).join(', '));
      await q.context().close();
    }

    /* B. locked on the real build */
    if (!only || only === 'B') {
      const p = await page({ amb: 'off' });
      await go(p, 'breathe', 500);
      ok(await E(p, () => { const l = document.querySelector('#bVis input[value="scene"]').parentNode; return l.textContent.trim() === 'Scene' && !!l.querySelector('.sup-tag') && document.querySelector('#bScn').hidden; }),
        'Breathe\'s visuals end with Scene, with the cup, and no row of scenes yet');
      await pick(p, '#bVis input[value="scene"]');
      await p.waitForTimeout(300);
      const B1 = await E(p, () => ({ dlg: !document.querySelector('#supModal').hidden, name: document.querySelector('#supFor').textContent, v: window.__entrain.BC.visual, chk: document.querySelector('#bVis input:checked').value, row: document.querySelector('#bScn').hidden }));
      ok(B1.dlg && B1.name === 'Scenes to watch is one of the new techniques.' && B1.v === 'circle' && B1.chk === 'circle' && B1.row, 'picking it opens the dialog that names it, and the circle stays: ' + JSON.stringify(B1));
      await p.click('#supClose'); await p.waitForTimeout(200);
      ok(await E(p, () => window.__entrain.BC.visual === 'circle' && JSON.parse(localStorage.getItem('entrain.breath') || '{}').visual !== 'scene'), 'Not now leaves the circle chosen and nothing kept');
      await p.context().close();
      // a scene kept from before (a backup, say): the circle shows, and no crackle
      const k = await page({ amb: 'off', breath: JSON.stringify({ pattern: 'resonance', inh: 5.5, sip: 0, hold: 0, exh: 5.5, rest: 0, visual: 'scene', scene: 'fire', minutes: 5, sound: 'off', cue: 40, buzz: false }) });
      await go(k, 'breathe', 500);
      const K = await E(k, () => { const X = window.__entrain; return { v: X.BC.visual, now: X.bVisNow(), chk: document.querySelector('#bVis input:checked').value, row: document.querySelector('#bScn').hidden, hint: document.querySelector('#bVisHint').textContent }; });
      ok(K.v === 'scene' && K.now === 'circle' && K.chk === 'circle' && K.row && /^The circle grows/.test(K.hint), 'a scene kept from before stays kept but shows the circle, its chip and its words: ' + JSON.stringify(K));
      await k.click('#bStart'); await k.waitForTimeout(2500);
      ok(await E(k, () => window.__entrain.AMB.playing === null && window.__entrain.scnSound() === ''), 'breathing with it, the kept fire plays no crackle while locked');
      await k.click('#bStart'); await k.context().close();
      // a practice's Options
      const q = await page({ amb: 'off' });
      await go(q, 'practice/calm-reset', 500);
      ok(await seg(q, '#sOptScn button') === 'Off* | Yours+ | Clouds+ | Water+ | Leaves+ | Forest+ | Fractal+ | Flowers+ | Fire+', 'a practice\'s Options have a Scene row, Off chosen and every scene with the cup: ' + await seg(q, '#sOptScn button'));
      await q.click('#sOptScn button[data-scn="water"]'); await q.waitForTimeout(300);
      const Q = await E(q, () => ({ dlg: !document.querySelector('#supModal').hidden, name: document.querySelector('#supFor').textContent, own: localStorage.getItem('entrain.pOpt.calm-reset'), on: document.querySelector('#sOptScn [aria-pressed="true"]').dataset.scn }));
      ok(Q.dlg && Q.name === 'Rippling water is one of the new techniques.' && !Q.own && Q.on === 'off', 'picking one opens the dialog that names it, keeping nothing: ' + JSON.stringify(Q));
      await q.click('#supClose'); await q.waitForTimeout(200);
      await go(q, 'practice/stress-check', 400);
      const noRow1 = await E(q, () => !document.querySelector('#sOptScn'));
      await go(q, 'practice/call', 400);
      ok(noRow1 && await E(q, () => !document.querySelector('#sOptScn')), 'the Stress Check and During the Call have no Scene row: nothing to nudge a reading, and no crackle in a call');
      await q.context().close();
      const kp = await page({ amb: 'off', 'pOpt.calm-reset': JSON.stringify({ scene: 'fire' }) });
      await go(kp, 'practice/calm-reset', 500);
      ok(await E(kp, () => document.querySelector('#sOptScn [aria-pressed="true"]').dataset.scn) === 'off', 'a practice\'s scene kept from before shows Off while locked');
      await E(kp, () => { const X = window.__entrain; X.P.view = X.pDef('calm-reset'); });
      await kp.click('#sGo'); await kp.waitForTimeout(1200);
      const KP = await E(kp, () => ({ vis: document.querySelector('#sStage').dataset.vis, ses: window.__entrain.scnSes(), amb: window.__entrain.AMB.playing }));
      ok(KP.vis === 'glow' && KP.ses === '' && KP.amb === null, 'and it runs with its usual glow, no scene and no crackle: ' + JSON.stringify(KP));
      await kp.click('#sEnd'); await kp.click('#sEnd'); await kp.context().close();
      // Settings
      const s = await page();
      await go(s, 'settings', 500);
      const S = await E(s, () => {
        const sec = document.querySelector('#st-scenes'), b = [...sec.querySelectorAll('[data-scn-mine]')];
        const ink = c => { const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let n = 0; for (let i = 0; i < d.length; i += 4) if (d[i + 3] > 0) n++; return c.width > 0 && n > d.length / 8; };
        return { h: sec.querySelector('h2').textContent, mine: sec.querySelector('#scnMineH').textContent, names: b.map(x => x.querySelector('.scn-pn').textContent.trim()).join(' '), cups: b.every(x => x.querySelector('.sup-tag')),
          dots: b.map(x => x.querySelectorAll('.strength i.on').length).join(''), pics: [...sec.querySelectorAll('canvas.scn-thumb')].every(ink), note: sec.textContent, link: !!sec.querySelector('a[href="#l-scenes"]') };
      });
      ok(S.h === 'Scenes' && S.mine === 'Scenes you find restful' && S.names === 'Clouds Water Leaves Forest Fractal Flowers Fire' && S.cups && S.pics && S.link,
        'Settings has Scenes: seven to pick as the ones you find restful, each with a picture of it and the cup, and a link to the research');
      ok(S.dots === '2222112' && /flowers on a screen haven't been tested/.test(S.note) && /mostly from one lab/.test(S.note) && /fire comes with its crackle/.test(S.note),
        'each with its evidence as the guide rates it (moderate for the nature scenes and the fire, promising for the fractal, early for flowers), and the note on each: ' + S.dots);
      await s.click('[data-scn-mine="fire"]'); await s.waitForTimeout(300);
      const S2 = await E(s, () => ({ dlg: !document.querySelector('#supModal').hidden, name: document.querySelector('#supFor').textContent, kept: localStorage.getItem('entrain.scenes'), on: document.querySelector('[data-scn-mine="fire"]').getAttribute('aria-pressed') }));
      ok(S2.dlg && S2.name === 'A fire to watch is one of the new techniques.' && S2.kept === null && S2.on === 'false', 'picking one opens the dialog that names it, keeping nothing: ' + JSON.stringify(S2));
      await s.click('#supClose'); await s.waitForTimeout(200);
      ok(await seg(s, '#stScnDef button') === 'Off* | Your scenes+', 'and its default for every practice is Off, Your scenes with the cup');
      const list = await E(s, () => [...document.querySelectorAll('#supList a')].map(a => a.textContent + '>' + a.getAttribute('href')));
      ok(list.includes('Scenes to watch>#st-scenes'), 'New techniques lists them: ' + list.slice(-3).join(', '));
      await s.click('#tbFind'); await s.waitForTimeout(250);
      const hits = async q => { await s.fill('#fdIn', q); await s.waitForTimeout(500); return E(s, () => [...document.querySelectorAll('.fd-it')].map(a => a.querySelector('b').textContent + '>' + a.getAttribute('href') + (a.querySelector('.sup-tag') ? ' +sup' : ''))); };
      const hit = await hits('scenes'), hf = await hits('fractal'), hc = await hits('clouds');
      ok(hit[0] === 'Scenes>#st-scenes +sup' && hit.includes('Scenes to watch: nature, fractals, flowers and fire>#l-scenes'), 'search finds the scenes first, with the badge, then Learn\'s section: ' + hit.slice(0, 3).join(', '));
      ok(hf.includes('Scenes>#st-scenes +sup') && hc.includes('Scenes>#st-scenes +sup'), 'and for a fractal or clouds too: ' + hf.slice(0, 3).join(', '));
      await s.keyboard.press('Escape');
      await go(s, 'l-scenes', 600);
      const L = await E(s, () => {
        const h = document.getElementById('l-scenes'), ps = []; let e = h.nextElementSibling;
        while (e && e.tagName === 'P') { ps.push(e.textContent.replace(/\s+/g, ' ')); e = e.nextElementSibling; }
        const refs = [...document.querySelectorAll('#references li')].map(l => l.textContent);
        const row = n => { const r = [...document.querySelectorAll('#lnGlance tr.ln-row')].find(x => x.querySelector('th b').textContent === n); return { lo: r.children[2].classList.contains('ln-lo'), a: [...r.children[2].querySelectorAll('a')].map(a => a.getAttribute('href')).join(' '), ev: r.children[1].textContent }; };
        return { title: h.textContent, toc: !!document.querySelector('.toc a[href="#l-scenes"]'), ps, view: !document.querySelector('#v-learn').hidden, dlg: document.querySelector('#supModal').hidden,
          refs: ['Ulrich, R. S. (1981)', 'Chang, C.-Y., Hammitt', 'Grassini, S.', 'Kaplan, S. (1995)', 'Hägerhäll, C. M.', 'Taylor, R. P. (2006)', 'Taylor, R. P., & Spehar', 'Ikei, H., Komatsu', 'Ikei, H., Song, C., & Miyazaki, Y. (2023)', 'Lynn, C. D. (2014)']
            .map(k => { const r = [...document.querySelectorAll('#references li')].find(l => l.textContent.startsWith(k)); return r ? (r.querySelector('a[href^="https://"]') ? 1 : 0) : -1; }).join(''),
          rows: ['Nature scenes, restoration breaks', 'A fireplace, with its sound', 'Mid-complexity fractals', 'Fresh flowers'].map(row) };
      });
      const all = L.ps.join(' ');
      ok(L.view && L.dlg && L.title === 'Scenes to watch: nature, fractals, flowers and fire' && L.toc && L.ps.length === 5, 'Learn has a section on scenes, in the contents, free to read: ' + L.title);
      ok(/\(Ulrich, 1981\)/.test(all) && /\(Chang et al\., 2008\)/.test(all) && /24 students/.test(all) && /memory task afterwards came out the same \(Grassini et al\., 2022\)/.test(all) && /moderate evidence/.test(all) && /compatibility \(Kaplan, 1995\)/.test(all),
        'nature scenes and alpha, on slides and on video (and what didn\'t change), rated moderate, and choosing what suits you');
      ok(/1\.3 gave the highest frontal alpha \(Hägerhäll et al\., 2008\)/.test(all) && /60%/.test(all) && /preliminary \(Taylor, 2006\)/.test(all) && /fractal fluency/.test(all) && /\(Taylor & Spehar, 2016\)/.test(all) && /mostly from one lab and haven't been widely repeated/.test(all) && /dimension of 1\.4 by construction/.test(all),
        'fractals: mid complexity, alpha and stress, fluency, promising and mostly one lab, and Entrain\'s at 1.4');
      ok(/thirty pink roses/.test(all) && /\(Ikei et al\., 2014\)/.test(all) && /214 people/.test(all) && /\(Ikei et al\., 2023\)/.test(all) && /real roses only/.test(all) && /Flowers on a screen haven't\s+been tested/.test(all),
        'flowers: the roses studies, early, real roses only, a screen untested');
      ok(/same fire with no sound had no consistent effect \(Lynn, 2014\)/.test(all) && /always comes with its crackle/.test(all) && /reduced motion/.test(all) && /haven't been tested themselves/.test(all),
        'the fire with its crackle, reduced motion, and the drawings themselves untested');
      ok(L.refs === '1111111111', 'every study cited has its reference, each with a link: ' + L.refs);
      ok(L.rows.every(r => !r.lo && /#st-scenes/.test(r.a)) && L.rows[1].a.includes('#l-nature') && L.rows[2].ev === 'Promising (mostly one lab)' && L.rows[3].ev === 'Early',
        'the glance table\'s rows for nature scenes, the fire, fractals and flowers lead to the scenes now, their evidence unchanged: ' + JSON.stringify(L.rows));
      await s.screenshot({ path: OUT + 'scenetest-b-learn.png' });
      await s.context().close();
    }

    /* C. unlocked: Breathe */
    if (!only || only === 'C') {
      const p = await page({ amb: 'off' }, { url: URL, unlock: true });
      await go(p, 'breathe', 500);
      ok(await E(p, () => !document.querySelector('#bVis .sup-tag') && window.__entrain.SUP.ok), 'unlocked, the Scene chip has no cup');
      await pick(p, '#bVis input[value="scene"]'); await p.waitForTimeout(300);
      const C1 = await E(p, () => ({ v: window.__entrain.BC.visual, row: document.querySelector('#bScn').hidden, chips: [...document.querySelectorAll('#bScn .chip')].map(c => c.textContent.trim() + (c.classList.contains('on') ? '*' : '')).join(' '), hint: document.querySelector('#bVisHint').textContent, dlg: document.querySelector('#supModal').hidden }));
      ok(C1.v === 'scene' && !C1.row && C1.dlg && C1.chips === 'Clouds* Water Leaves Forest Fractal Flowers Fire' && /The sun rises as you breathe in/.test(C1.hint), 'Scene comes on at once, with a row of the seven, clouds first, and its words: ' + JSON.stringify(C1));
      const hints = [];
      for (const id of IDS) { await pick(p, '#bScn input[value="' + id + '"]'); await p.waitForTimeout(60); hints.push([id, await t(p, '#bVisHint'), await E(p, () => window.__entrain.BC.scene)]); }
      ok(hints.every(h => h[2] === h[0] && /breathe in/.test(h[1])), 'each scene says what follows your breath: ' + hints.map(h => h[0] + ': ' + h[1].split('. ').slice(-1)[0]).join(' | '));
      ok(/flowers on a screen haven't been tested/i.test(hints[5][1]) && /crackle/.test(hints[6][1]), 'the flowers say a screen\'s are untested, and the fire that its crackle plays');
      await pick(p, '#bScn input[value="water"]'); await p.waitForTimeout(100);
      ok(await E(p, () => { const b = JSON.parse(localStorage.getItem('entrain.breath')); return b.visual === 'scene' && b.scene === 'water'; }), 'the scene is kept with the breathing settings');
      await p.click('#bStart'); await p.waitForTimeout(4200);
      const a1 = await snap(p, '#bCanvas'); const fps = await rate(p, 'bCanvas', 2000); const a2 = await snap(p, '#bCanvas');
      ok(fps >= 20 && fps <= 32 && diff(a1, a2) > 0.3 && await E(p, () => window.__blur.length === 0), 'breathing with it, the scene draws about 30 frames a second, changing as it goes, with no blurred shadows: ' + fps.toFixed(1) + ' a second, change ' + diff(a1, a2).toFixed(1));
      ok(await E(p, () => window.__entrain.AMB.playing === null), 'water plays no sound of its own: the background stays off');
      await pick(p, '#bScn input[value="fire"]');
      const fire = await until(p, () => window.__entrain.AMB.playing === 'fire', 8000);
      ok(fire && await E(p, () => window.__entrain.AMB.kind === 'off' && !window.__entrain.AMB.add.length), 'the fire picked while breathing brings its crackle, though the background sound is off and stays so');
      await p.screenshot({ path: OUT + 'scenetest-c-fire.png' });
      await p.click('#bStart'); await p.waitForTimeout(700);
      ok(await E(p, () => window.__entrain.B.state === 'paused' && window.__entrain.AMB.playing === null), 'pausing silences it');
      await E(p, () => { const X = window.__entrain; X.AMB.kind = 'rain'; localStorage.setItem('entrain.amb', 'rain'); });
      await p.click('#bStart');
      const both = await until(p, () => window.__entrain.AMB.playing === 'rain+fire', 8000);
      ok(both, 'with rain chosen, the fire\'s crackle plays over it: ' + await E(p, () => window.__entrain.AMB.playing));
      await pick(p, '#bScn input[value="forest"]');
      ok(await until(p, () => window.__entrain.AMB.playing === 'rain', 4000), 'another scene, and only the rain plays on');
      await pick(p, '#bVis input[value="dial"]'); await p.waitForTimeout(200);
      ok(await E(p, () => window.__entrain.BC.visual === 'dial' && document.querySelector('#bScn').hidden), 'another visual hides the row of scenes');
      await p.click('#bReset'); await p.context().close();
      // locked, then unlocked from the dialog: the scene comes on
      const q = await page({ amb: 'off' }, { url: URL });
      await go(q, 'breathe', 500);
      await pick(q, '#bVis input[value="scene"]'); await q.waitForTimeout(300);
      const dev = await E(q, () => window.__entrain.supDevice());
      await q.fill('#supIn', sign(dev)); await q.click('#supGo');
      await until(q, () => window.__entrain.SUP.ok, 5000);
      await q.click('#supClose'); await q.waitForTimeout(300);
      const U = await E(q, () => ({ v: window.__entrain.BC.visual, row: document.querySelector('#bScn').hidden, cup: !!document.querySelector('#bVis .sup-tag') }));
      ok(U.v === 'scene' && !U.row && !U.cup, 'picked while locked and unlocked in the dialog, the scene comes on: ' + JSON.stringify(U));
      await q.context().close();
    }

    /* D. unlocked: practices */
    if (!only || only === 'D') {
      const p = await page({ amb: 'off' }, { url: URL, unlock: true });
      await go(p, 'practice/calm-reset', 500);
      ok(await seg(p, '#sOptScn button') === 'Off* | Yours | Clouds | Water | Leaves | Forest | Fractal | Flowers | Fire', 'a practice\'s Scene row, unlocked: Off and the rest without cups');
      await p.click('#sOptScn button[data-scn="water"]'); await p.waitForTimeout(200);
      const D1 = await E(p, () => ({ own: JSON.parse(localStorage.getItem('entrain.pOpt.calm-reset') || '{}').scene, sum: document.querySelector('#sOptsSum').textContent, on: document.querySelector('#sOptScn [aria-pressed="true"]').dataset.scn }));
      ok(D1.own === 'water' && D1.on === 'water' && /Water/.test(D1.sum), 'Water is kept for this practice and named in its summary: ' + JSON.stringify(D1));
      await p.click('#sGo'); await p.waitForTimeout(1500);
      const D2 = await E(p, () => ({ vis: document.querySelector('#sStage').dataset.vis, ses: window.__entrain.scnSes(), k: window.__entrain.P.steps[window.__entrain.P.idx].k }));
      ok(D2.vis === 'scene' && D2.ses === 'water' && D2.k === 'guide', 'it starts with the water in place of the glow: ' + JSON.stringify(D2));
      const s1 = await snap(p, '#sCanvas'); const f1 = await rate(p, 'sCanvas', 2000); const s2 = await snap(p, '#sCanvas');
      ok(f1 >= 20 && f1 <= 32 && diff(s1, s2) > 0.2 && await E(p, () => window.__blur.length === 0), 'drawn about 30 frames a second, moving, with no blurred shadows: ' + f1.toFixed(1));
      await p.click('#sNext'); await p.waitForTimeout(1500);
      const D3 = await E(p, () => { const X = window.__entrain; return { k: X.P.steps[X.P.idx].k, vis: document.querySelector('#sStage').dataset.vis, bv: X.BC.visual, sc: X.BC.scene, now: X.bVisNow() }; });
      ok(D3.k === 'breath' && D3.vis === 'breath' && D3.bv === 'scene' && D3.sc === 'water', 'its breath step paces you with the same scene, following the breath: ' + JSON.stringify(D3));
      const f2 = await rate(p, 'sCanvas', 1500);
      ok(f2 >= 20 && f2 <= 32, 'also about 30 frames a second: ' + f2.toFixed(1));
      await p.screenshot({ path: OUT + 'scenetest-d-practice.png' });
      await p.click('#sEnd'); await p.click('#sEnd'); await p.waitForTimeout(500);
      ok(await E(p, () => { const X = window.__entrain; return X.BC.visual === 'circle' && X.BC.scene === 'clouds' && X.scnSes() === ''; }), 'at the end Breathe\'s own visual is back, as it was');
      await p.context().close();
      // Yours: the restful scenes from Settings, here only the fire, with its crackle
      const q = await page({ amb: 'off' }, { url: URL, unlock: true });
      await go(q, 'settings', 500);
      await q.click('[data-scn-mine="fire"]'); await q.waitForTimeout(200);
      const Y = await E(q, () => ({ kept: localStorage.getItem('entrain.scenes'), mine: window.__entrain.scnMine().join(), on: document.querySelector('[data-scn-mine="fire"]').getAttribute('aria-pressed'), txt: document.querySelector('#scnMineTxt').textContent, dlg: document.querySelector('#supModal').hidden }));
      ok(Y.kept === 'fire' && Y.mine === 'fire' && Y.on === 'true' && Y.txt === 'Yours: fire.' && Y.dlg, 'Settings keeps the scenes you find restful: ' + JSON.stringify(Y));
      await q.click('[data-scn-mine="leaves"]'); await q.click('[data-scn-mine="leaves"]'); await q.waitForTimeout(100);
      ok(await E(q, () => localStorage.getItem('entrain.scenes')) === 'fire', 'a second tap takes one off again');
      ok(await E(q, () => { const X = window.__entrain; return [0, 1, 2].map(n => X.scnPick(n)).join() === 'fire,fire,fire' && X.scnSoundOf('fire') === 'fire' && X.scnSoundOf('water') === 'stream' && X.scnSoundOf('fractal') === ''; }),
        'later features get one of them and the sound that suits it (scnPick, scnSoundOf)');
      await q.click('#stScnDef button[data-v="mine"]'); await q.waitForTimeout(200);
      ok(await E(q, () => JSON.parse(localStorage.getItem('entrain.pOpt')).scene === 'mine'), 'Your scenes in every practice is kept as the default');
      await go(q, 'practice/gratitude', 500);
      ok(await E(q, () => document.querySelector('#sOptScn [aria-pressed="true"]').dataset.scn) === 'mine', 'a practice without its own choice shows Yours');
      await q.click('#sGo'); await q.waitForTimeout(800);
      const Q1 = await E(q, () => ({ ses: window.__entrain.scnSes(), vis: document.querySelector('#sStage').dataset.vis }));
      const crackle = await until(q, () => window.__entrain.AMB.playing === 'fire', 8000);
      ok(Q1.ses === 'fire' && Q1.vis === 'scene' && crackle, 'Yours shows the fire, and its crackle plays with it, the background being off: ' + JSON.stringify(Q1));
      await q.click('#sOut'); await q.waitForTimeout(1200);
      ok(await E(q, () => window.__entrain.AMB.playing === null && window.__entrain.P.state !== 'running'), 'I need to stop ends it and silences the crackle');
      // a step that asks for a scene of its own, and the usual visuals when a practice shows none
      const V = await E(q, () => {
        const X = window.__entrain, P = X.P, was = [P.scnOn, P.scene, P.state];
        P.state = 'running'; P.scnOn = false; P.scene = 'clouds';
        const r = { own: X.pVis({ k: 'guide', vis: 'scene', scene: 'leaves' }), of: X.scnOf({ k: 'guide', vis: 'scene', scene: 'leaves' }), ses: X.scnOf({ k: 'guide', vis: 'scene' }), orb: X.pVis({ k: 'guide' }), still: X.pVis({ k: 'observe' }) };
        P.scnOn = true;
        r.on = [X.pVis({ k: 'guide' }), X.pVis({ k: 'observe' }), X.pVis({ k: 'drift' }), X.pVis({ k: 'count', n: 5 }), X.pVis({ k: 'pmr' })].join();
        P.scnOn = was[0]; P.scene = was[1]; P.state = was[2];
        return r;
      });
      ok(V.own === 'scene' && V.of === 'leaves' && V.ses === 'clouds' && V.orb === 'orb' && V.still === 'still', 'a step can ask for a scene ({ vis: "scene", scene: … }), or the session\'s; with none chosen the orb and still point stay');
      ok(V.on === 'scene,scene,scene,count,body', 'with a scene chosen it takes the place of the orb, the still point and the glow, and the counting and body steps keep theirs: ' + V.on);
      await q.context().close();
    }

    /* E. 360 px, 44 px targets, the new words' spelling */
    if (!only || only === 'E') {
      const p = await page({ amb: 'off' }, { url: URL, unlock: true, vp: { width: 360, height: 740 } });
      const wide = [], small = [], seen = [];
      await go(p, 'breathe', 500);
      await pick(p, '#bVis input[value="scene"]');
      await p.click('#bAdjust').catch(() => {}); await p.waitForTimeout(500);
      for (const h of ['breathe', 'settings', 'practice/calm-reset', 'l-scenes']) {
        if (h !== 'breathe') await go(p, h, 600);
        const m = await E(p, () => {
          const bs = [...document.querySelectorAll('#bScn .chip, .b-scnchip, .scn-seg button, .scn-pick')].filter(b => b.offsetParent);
          return { w: document.documentElement.scrollWidth - document.documentElement.clientWidth, n: bs.length,
            s: bs.filter(b => b.getBoundingClientRect().height < 44).map(b => b.textContent.trim() + ' ' + Math.round(b.getBoundingClientRect().height)) };
        });
        if (m.w > 0) wide.push(h + ' by ' + m.w);
        small.push(...m.s);
        seen.push(h + ' ' + m.n);
        if (h === 'settings') { await E(p, () => document.getElementById('st-scenes').scrollIntoView()); await p.screenshot({ path: OUT + 'scenetest-e-settings.png' }); }
      }
      ok(!wide.length && !small.length, 'at 360 px nothing is wider than the screen, and every new button is at least 44 px tall (' + seen.join(', ') + ')' + (wide.length ? ': too wide ' + wide.join(', ') : '') + (small.length ? ': small ' + small.join(', ') : ''));
      const words = await E(p, () => {
        const X = window.__entrain;
        return X.SCN_LIST.map(s => s.name + ' ' + s.long + ' ' + s.hint).join(' ') + ' ' + document.getElementById('st-scenes') + ' ' +
          [...document.querySelectorAll('#l-scenes ~ p')].slice(0, 5).map(e => e.textContent).join(' ');
      });
      await go(p, 'settings', 500);
      const st = await t(p, '#st-scenes');
      const bad = (words + ' ' + st).match(SPELL);
      ok(!bad, 'British spelling in the scenes\' words, Settings and Learn' + (bad ? ': ' + bad[0] : ''));
      await p.context().close();
    }
  } catch (e) { log.push('ERROR ' + (e && e.stack || e)); }
  await browser.close();
  console.log(log.join('\n'));
  console.log(log.filter(l => l.startsWith('PASS')).length + ' passed, ' + log.filter(l => /^(FAIL|PAGEERROR|ERROR|CONSOLE)/.test(l)).length + ' problems');
  process.exit(log.some(l => /^(FAIL|PAGEERROR|ERROR|CONSOLE)/.test(l)) ? 1 : 0);
})();
