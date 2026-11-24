// Touch: Soothing Touch and Self-Massage, and the weighted blanket tip. Locked on the real build (their pages free to read,
// every way in asking for the donation, Sleep Descent's tip free), their plans at every length and choice, Soothing Touch
// running on an unlocked copy (the arm, the gliding dot and the real-size marks, the sweeping tone with each breath out,
// pause and I need to stop), matching a bank card, Self-Massage on the body map alone and with a partner, the health
// check's caution, Learn, search and the sleep habits routine, a small phone and reduced motion.
//   A  locked: pages, Start and the bank-card button ask for the donation; library, search, Settings, Learn; Sleep Descent's tip
//   B  every plan at every length and choice; the strokes, the self-hug, the hand on the heart, the massage areas and the swap
//   C  Soothing Touch running: the words with the breath, the dot, the marks at real size, the sweeps, pause, I need to stop
//   D  matching a bank card: the dialog, its keys, saving, the usual size, focus, and backups leaving it out
//   E  Self-Massage running, alone and with a partner; the health check; Learn, search and healthy sleep habits
//   F  a 360 px phone and reduced motion
// Run: node tests/touchtest.js [group letter]
const fs = require('fs');
const { chromium, APP, OUT } = require('./pw');
const { testApp, unlockInit, unlocked } = require('./unlock-helper');
const S20 = 'Mozilla/5.0 (Linux; Android 13; SM-G988B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Mobile Safari/537.36';
const only = process.argv[2] || '';
const t = (p, s) => p.$eval(s, e => e.textContent.replace(/\s+/g, ' ').trim()).catch(() => '(missing)');
const E = (p, f, a) => p.evaluate(f, a);
const go = async (p, h, ms) => { await p.evaluate(x => location.hash = x, h); await p.waitForTimeout(ms || 350); };
const OPT = o => JSON.stringify(Object.assign({ voice: false, bells: false, cues: 'tones', visual: 'circle', audio: false, voiceName: '', ana: 0, rhythm: false }, o || {}));
const NOT = /n't\b|\b(do not|never|nothing|without|stop|avoid|none)\b|feel the breath/i;
const SPELL = /\b(programs?|toward|synthesiz\w*|color\w*|favor\w*|behavior\w*|center(?:s|ed)?|organiz\w*|realiz\w*|recogniz\w*|minimiz\w*|optimiz\w*|personaliz\w*|prioritiz\w*|visualiz\w*|analyz\w*|gray|fiber|aging)\b/i;
const IDS = ['touch', 'self-massage'];
const NAMES = { touch: 'Soothing Touch', 'self-massage': 'Self-Massage' };
const CARD = 5.398;               // cm: a bank card's short side

(async () => {
  const browser = await chromium.launch();
  const log = []; const ok = (c, m) => log.push((c ? 'PASS ' : 'FAIL ') + m);
  const UNLOCKED = testApp();
  // a phone (412 × 915 unless vp says), debug on, the headphone check done, the options open; st: stored values;
  // o.unlock: the test copy, unlocked; o.rm: reduced motion; o.desk: a computer; o.spy: the sweeps' sound, canvas frames, blurs, dots and marks
  const page = async (st, o) => {
    o = o || {};
    const ctx = await browser.newContext(Object.assign(o.desk ? { viewport: { width: 1280, height: 900 } }
      : { userAgent: S20, viewport: o.vp || { width: 412, height: 915 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
    { reducedMotion: o.rm ? 'reduce' : 'no-preference', acceptDownloads: true }));
    const p = await ctx.newPage();
    p.on('pageerror', e => log.push('PAGEERROR ' + e.message));
    p.on('console', m => { if (m.type() === 'error') log.push('CONSOLE ' + m.text()); });
    p.on('request', r => { if (!/^(file|data|blob):/.test(r.url())) log.push('FAIL a network request: ' + r.url()); });
    await p.addInitScript(s => {
      if (!sessionStorage.getItem('z.seeded')) {
        sessionStorage.setItem('z.seeded', '1');
        localStorage.setItem('entrain.debug', '1'); localStorage.setItem('entrain.stereo', 'ok'); localStorage.setItem('entrain.optsOpen', '1');
        for (const k in s) localStorage.setItem('entrain.' + k, s[k]);
      }
      if (window.speechSynthesis) { speechSynthesis.speak = () => {}; speechSynthesis.cancel = () => {}; }
    }, Object.assign({ pOpt: OPT() }, st || {}));
    if (o.spy) await p.addInitScript(() => {
      window.__sw = []; window.__bp = []; window.__cl = 0; window.__blur = 0; window.__fr = [[]];
      const sv = AudioParam.prototype.setValueAtTime;
      AudioParam.prototype.setValueAtTime = function (v, w) { if (v === 196) window.__sw.push(w); return sv.apply(this, arguments); };   // a sweep's tone starts on G3
      const ex = AudioParam.prototype.exponentialRampToValueAtTime;
      AudioParam.prototype.exponentialRampToValueAtTime = function (v, w) { if (v === 1500) window.__bp.push(w); return ex.apply(this, arguments); };   // and its whoosh rises to 1500 Hz
      const cr = CanvasRenderingContext2D.prototype.clearRect;
      CanvasRenderingContext2D.prototype.clearRect = function () {
        if (this.canvas.id === 'sCanvas') { window.__cl++; window.__fr.push([]); if (window.__fr.length > 6) window.__fr.shift(); }
        return cr.apply(this, arguments);
      };
      const mv = CanvasRenderingContext2D.prototype.moveTo;     // the marks and lines of the frame being drawn
      CanvasRenderingContext2D.prototype.moveTo = function (x, y) { if (this.canvas.id === 'sCanvas') window.__fr[window.__fr.length - 1].push(['m', x, y]); return mv.apply(this, arguments); };
      const arc = CanvasRenderingContext2D.prototype.arc;
      CanvasRenderingContext2D.prototype.arc = function (x, y, r) { if (this.canvas.id === 'sCanvas') window.__fr[window.__fr.length - 1].push(['a', x, y, r]); return arc.apply(this, arguments); };
      const d = Object.getOwnPropertyDescriptor(CanvasRenderingContext2D.prototype, 'shadowBlur');
      Object.defineProperty(CanvasRenderingContext2D.prototype, 'shadowBlur', { set(v) { if (v) window.__blur++; d.set.call(this, v); }, get() { return d.get.call(this); } });
    });
    if (o.unlock) await unlockInit(p);
    await p.goto(o.unlock ? UNLOCKED : APP);
    await p.waitForTimeout(350);
    if (o.unlock) await unlocked(p);
    return p;
  };
  const run = p => E(p, () => {
    const X = window.__entrain, s = X.P.steps[X.P.idx] || {}, q = x => document.querySelector(x);
    return { step: s.title, k: s.k, idx: X.P.idx, state: X.P.state, cap: q('#sCap').textContent, sub: q('#sSub').textContent, line: q('#sLine').textContent, vis: q('#sStage').dataset.vis };
  });
  // on to the step whose title matches, and a moment for its first line to show (it comes with the next tick)
  const jump = async (p, re) => { for (let i = 0; i < 40; i++) { const r = await run(p); if (re.test(r.step)) { if (i) { await p.waitForTimeout(350); return run(p); } return r; } await p.click('#sNext'); await p.waitForTimeout(140); } return run(p); };
  const clock = (p, sec) => E(p, sec => { window.__entrain.P.t0 = performance.now() / 1000 - sec; }, sec);
  // paused: the moment the canvas draws, exactly (within the step it's on), and a few frames to draw it
  const still = async (p, sec) => { await E(p, sec => { window.__entrain.P.st = sec; }, sec); await p.waitForTimeout(160); };
  const stepAt = (p, re) => E(p, src => { const X = window.__entrain, s = X.P.steps.find(x => new RegExp(src).test(x.title)); return s ? { at: s.at, secs: s.secs, inh: s.inh, exh: s.exh } : null; }, re.source);
  const plan = (p, id, len, ch) => E(p, ([id, len, ch]) => {
    const X = window.__entrain;
    if (ch) localStorage.setItem('entrain.pCh.' + id, JSON.stringify(ch)); else localStorage.removeItem('entrain.pCh.' + id);
    const pl = X.pPlan(X.pDef(id), len);
    return { total: pl.total, steps: pl.steps.map(s => ({ title: s.title, k: s.k, secs: s.secs, at: s.at, t: s.t || null, inh: s.inh || 0, exh: s.exh || 0, part: s.part || '', sweep: !!s.sweep,
      body: s.body || null, cues: s.cues || null, hints: s.hints || null, lines: s.lines.map(l => l[1]), at0: s.lines.map(l => l[0]) })) };
  }, [id, len, ch || null]);
  const titles = x => x.steps.map(s => s.title).join(' | ');
  const endNow = p => E(p, () => { const b = document.querySelector('#sEnd'); b.click(); b.click(); });
  // the last whole frame drawn: its centimetre marks (the lowest row of lines) and its dot (radius 7)
  const frame = p => E(p, () => {
    const f = window.__fr[window.__fr.length - 2] || [], ms = f.filter(x => x[0] === 'm'), by = Math.max(...ms.map(x => x[2]));
    const xs = [...new Set(ms.filter(x => Math.abs(x[2] - by) < 0.01).map(x => Math.round(x[1] * 100) / 100))].sort((a, b) => a - b);
    const dot = f.find(x => x[0] === 'a' && x[3] === 7);
    return { marks: xs, gaps: xs.slice(1).map((x, i) => Math.round((x - xs[i]) * 100) / 100), dot: dot ? Math.round(dot[1] * 10) / 10 : null };
  });

  try {
    /* A. locked on the real build: each page free to read, Start and the bank-card button asking for the donation, the badge everywhere */
    if (!only || only === 'A') {
      const p = await page();
      const kinds = { touch: 'Calm · Relaxation · 5 min', 'self-massage': 'Recover · Relaxation · 8 min' };
      for (const id of IDS) {
        await go(p, 'practice/' + id);
        const pg = await E(p, () => { const q = s => document.querySelector('#sIntro ' + s), tx = e => e ? e.textContent.replace(/\s+/g, ' ').trim() : '';
          return { title: document.querySelector('#viewTitle').textContent, kind: tx(q('.si-kind')), go: tx(q('#sGo')), note: q('#sSupNote').hidden ? '' : tx(q('#sSupNote')), steps: document.querySelectorAll('#sIntro .si-steps li').length,
            ev: tx(q('.si-ev .ev-body')), how: tx(q('.si-main > p')), caution: tx(q('.si-caution')), dots: q('.si-ev summary .strength') ? q('.si-ev summary .strength').querySelectorAll('i.on').length : 0 }; });
        ok(pg.title === NAMES[id] && pg.kind === kinds[id] && pg.go === 'Unlock to start' && /^One of the new techniques/.test(pg.note) && pg.steps >= 5 && pg.ev.length > 300 && pg.how.length > 300 && pg.dots === 2,
          NAMES[id] + ': its page reads in full (' + pg.kind + ', ' + pg.steps + ' steps, evidence ' + pg.dots + ' of 3: moderate, as the guide rates it), and Start reads ' + pg.go);
        if (id === 'self-massage') ok(/injury/.test(pg.caution) && /varicose veins/.test(pg.caution) && /blood thinners/.test(pg.caution) && /blood clot/.test(pg.caution) && /front of the throat/.test(pg.caution),
          'Self-Massage\'s caution: injuries, varicose veins and blood thinners, as the guide gives it, and a swollen calf and the front of the neck');
        await p.click('#sGo'); await p.waitForTimeout(250);
        const dl = await E(p, () => ({ open: !document.querySelector('#supModal').hidden, for: document.querySelector('#supFor').textContent, st: window.__entrain.P.state }));
        ok(dl.open && dl.for === NAMES[id] + ' is one of the new techniques.' && dl.st !== 'running', NAMES[id] + ': Start opens the donation dialog, naming it, and nothing starts');
        await p.click('#supClose'); await p.waitForTimeout(150);
      }
      // the bank-card button belongs to Soothing Touch: the cup on it, and the donation dialog instead of its own
      await go(p, 'practice/touch');
      const cb = await E(p, () => { const b = document.querySelector('#tcCalBtn'); return b ? { cup: !!b.querySelector('.sup-tag'), h: Math.round(b.getBoundingClientRect().height), note: document.querySelector('#tcCalNote').textContent } : null; });
      await p.click('#tcCalBtn'); await p.waitForTimeout(250);
      const cd = await E(p, () => ({ sup: !document.querySelector('#supModal').hidden, for: document.querySelector('#supFor').textContent, tc: !document.querySelector('#tcModal').hidden }));
      ok(cb && cb.cup && cb.h >= 44 && /^Set from this screen's usual size/.test(cb.note) && cd.sup && cd.for === 'Soothing Touch is one of the new techniques.' && !cd.tc,
        'Match a bank card carries the cup and asks for the donation too, naming Soothing Touch, rather than opening: ' + JSON.stringify(cb));
      await p.click('#supClose'); await p.waitForTimeout(150);
      // the library and its badges; search; Settings
      await go(p, 'practice');
      const lib = await E(p, ids => ids.map(id => { const a = document.querySelector('#prLib a[href="#practice/' + id + '"]'); return a ? a.closest('.pr-grp').dataset.g + (a.querySelector('.pc-meta .sup-tag') ? '+sup' : '') : 'none'; }), IDS);
      const tax = await E(p, ids => ids.map(id => { const d = window.__entrain.pDef(id); return d.goal + '/' + d.method + '/' + d.posture.join(' ') + '/' + (d.also || []).join(' '); }), IDS);
      ok(lib.join() === 'calm+sup,recover+sup' && tax.join(' | ') === 'calm/relax/sit lie/ | recover/relax/sit/calm',
        'the library lists Soothing Touch under Calm and Self-Massage under Recover (also good for calm), each with the Donation badge: ' + lib.join() + ' · ' + tax.join(' | '));
      await p.click('#tbFind'); await p.waitForTimeout(150);
      const finds = [];
      for (const [w, id] of [['self-soothing', 'touch'], ['c-tactile', 'touch'], ['self-hug', 'touch'], ['massage', 'self-massage'], ['scalp', 'self-massage']]) {
        await p.fill('#fdIn', w); await p.waitForTimeout(250);
        finds.push(await E(p, ([w, id]) => { const a = document.querySelector('#fdRes a.fd-it[href="#practice/' + id + '"]'); return w + (a ? (a.querySelector('.sup-tag') ? ': found +sup' : ': found') : ': missing'); }, [w, id]));
      }
      ok(finds.every(f => /found \+sup$/.test(f)), 'search finds them, with the badge: ' + finds.join(', '));
      await p.keyboard.press('Escape'); await p.waitForTimeout(150);
      await go(p, 'st-supporter', 450);
      const list = await E(p, () => [...document.querySelectorAll('#supList a')].map(a => a.textContent + '>' + a.getAttribute('href')));
      ok(IDS.every(id => list.includes(NAMES[id] + '>#practice/' + id)), 'Settings, New techniques, lists both');
      // Learn: the glance table's touch rows lead to where each now lives, the new techniques with the cup
      await go(p, 'learn', 400);
      const rows = await E(p, () => [...[...document.querySelectorAll('#lnGlance tbody')].find(b => /Touch/.test(b.querySelector('.ln-sense').textContent)).querySelectorAll('tr.ln-row')]
        .map(r => r.querySelector('th b').textContent + ' (' + r.children[1].textContent + ') > ' + [...r.children[2].querySelectorAll('a')].map(a => a.getAttribute('href') + (a.nextElementSibling && a.nextElementSibling.classList.contains('sup-tag') ? '+cup' : '')).join(' ')));
      ok(rows.join(' | ') === 'Slow self-stroking (Moderate) > #practice/touch+cup | Weighted blanket (Moderate) > #practice/sleep-descent #living/sleep-habits | Massage (Moderate) > #practice/self-massage+cup',
        'Techniques at a glance: the touch rows keep the guide\'s evidence and lead to Soothing Touch, the blanket tip and Self-Massage, the new ones with the cup: ' + rows.join(' | '));
      // Sleep Descent's weighted blanket tip, free to read, and its link to the research
      await go(p, 'practice/sleep-descent');
      const tip = await E(p, () => { const e = document.querySelector('#sIntro .si-tip'); return e ? { t: e.textContent.replace(/\s+/g, ' ').trim(), a: e.querySelector('a') && e.querySelector('a').getAttribute('href'), cup: !!e.querySelector('.sup-tag'), go: document.querySelector('#sGo').textContent.trim() } : null; });
      ok(tip && /^A weighted blanket\? If restlessness at night comes with anxiety or a low mood/.test(tip.t) && /low-risk/.test(tip.t) && /not for small children, or for anyone who couldn't take it off unaided/.test(tip.t) &&
        tip.a === '#l-weighted' && !tip.cup && tip.go === 'Start 30 min', 'Sleep Descent: a weighted blanket tip, free to read (low risk; for an anxious or low edge; not for small children or anyone who couldn\'t take it off), and Sleep Descent stays free');
      await p.click('#sIntro .si-tip a'); await p.waitForTimeout(800);
      ok(await E(p, () => !document.querySelector('#v-learn').hidden && Math.abs(document.getElementById('l-weighted').getBoundingClientRect().top) < 400 && document.querySelector('#supModal').hidden),
        'its link opens Learn at the weighted blanket paragraph, no dialog');
      // a small phone: nothing wider than the screen, the name fits the top bar, Start in reach
      await p.setViewportSize({ width: 360, height: 740 });
      const fit = [];
      for (const id of IDS) {
        await go(p, 'practice/' + id, 300);
        fit.push(await E(p, id => { const b = document.querySelector('#sGo').getBoundingClientRect(), h = document.querySelector('#viewTitle');
          return id + (document.documentElement.scrollWidth > document.documentElement.clientWidth ? ' wide' : '') + (h.scrollWidth > h.clientWidth + 1 ? ' title' : '') + (b.bottom > innerHeight - 62 || b.top < 0 ? ' start' : ''); }, id));
      }
      ok(fit.every(f => !/ /.test(f)), 'at 360 px each page fits, its name fits the top bar and Start is in reach: ' + fit.join(', '));
      await p.screenshot({ path: OUT + 'touchtest-a-locked.png' });
      await p.context().close();
    }

    /* B. the plans: every length and choice adds up, says what to do, in British spelling; the shape of each */
    if (!only || only === 'B') {
      const p = await page();
      const sweep = await E(p, ([ids, NOT, SPELL]) => {
        const X = window.__entrain, bad = [], not = new RegExp(NOT, 'i'), spell = new RegExp(SPELL, 'i'), out = {};
        ids.forEach(id => {
          const d = X.pDef(id); let combos = [{}], n = 0;
          (d.choices || []).forEach(c => { const m = []; combos.forEach(o => c.opts.forEach(v => m.push(Object.assign({}, o, { [c.key]: v[0] })))); combos = m; });
          const texts = [d.name, d.blurb, d.how, d.ev, d.parts, d.caution || '', d.end];
          (d.choices || []).forEach(c => texts.push(c.label, typeof c.note === 'function' ? '' : c.note || '', ...c.opts.map(o => o[1])));
          [d.blurb, d.end].forEach(x => { if (not.test(x)) bad.push(id + ' says: ' + x); });
          for (const L of d.lengths) for (const ch of combos) {
            localStorage.setItem('entrain.pCh.' + id, JSON.stringify(ch)); n++;
            (d.choices || []).forEach(c => { if (typeof c.note === 'function') texts.push(c.note(d)); });
            const pl = X.pPlan(d, L);
            if (pl.total !== L * 60) bad.push(id + ' ' + L + ' min ' + JSON.stringify(ch) + ': ' + pl.total + ' s');
            pl.steps.forEach(s => {
              if (!(s.secs > 0)) bad.push(id + ' ' + s.title + ': ' + s.secs + ' s');
              if (s.k === 'stroke' && (s.secs % (s.inh + s.exh) || s.secs < 2 * (s.inh + s.exh))) bad.push(id + ' ' + s.title + ': ' + s.secs + ' s is not whole strokes');
              if (s.k === 'breath' && s.t.exh !== 2 * s.t.inh) bad.push(id + ' ' + s.title + ': not a long breath out');
              s.lines.forEach((l, i) => { if (!(l[0] >= 0 && l[0] < s.secs) || (i && l[0] <= s.lines[i - 1][0])) bad.push(id + ' ' + s.title + ' line at ' + l[0]); if (not.test(l[1])) bad.push(id + ' says: ' + l[1]); texts.push(l[1]); });
              (s.cues || []).forEach((c, i) => { if (!(c[0] >= 0 && c[0] < s.secs) || (i && c[0] <= s.cues[i - 1][0])) bad.push(id + ' ' + s.title + ' cue at ' + c[0]); texts.push(c[1]); });
              [s.title, s.hint, s.prompt, s.sub].concat(Object.values(s.hints || {}), Object.values(s.labels || {})).forEach(x => { if (x && not.test(x)) bad.push(id + ' says: ' + x); if (x) texts.push(x); });
            });
          }
          localStorage.removeItem('entrain.pCh.' + id);
          texts.forEach(x => { if (x && spell.test(x)) bad.push(id + ' spells: ' + x.match(spell)[0]); });
          out[id] = n;
        });
        return { bad, out };
      }, [IDS, NOT.source, SPELL.source]);
      ok(!sweep.bad.length && sweep.out.touch === 48 && sweep.out['self-massage'] === 4, 'every plan at every length and choice (' + Object.keys(sweep.out).map(k => k + ' ' + sweep.out[k]).join(', ') +
        ') lasts exactly its length, whole strokes and long breaths out, every line and cue inside its step and in order, worded as what to do, in British spelling' + (sweep.bad.length ? ': ' + sweep.bad.slice(0, 6).join(' | ') : ''));

      // Soothing Touch: the forearm, one arm then the other, strokes on the breath out at 3 cm a second
      let pl = await plan(p, 'touch', 5);
      const st = pl.steps.filter(s => s.k === 'stroke');
      ok(titles(pl) === 'Settle | Find the pace | Left forearm | Right forearm | Hand on heart' && st.every(s => s.inh === 4 && s.exh === 8 && s.part === 'arm' && s.sweep) &&
        /roll up your sleeves/.test(pl.steps[0].lines.join(' ')) && /about three centimetres a second/.test(st[0].lines[0]) && pl.steps[4].k === 'breath' && /heart/.test(pl.steps[4].lines[0]),
        '5 minutes: ' + titles(pl) + '; 4 s in and 8 s out, a stroke on each breath out, with the sweep');
      const sp = await E(p, () => window.__entrain.TC_SPEED || 3);
      ok(st.every(s => sp * s.exh === 24) && st.slice(2).every(s => s.secs === 96), 'each stroke covers 24 cm at 3 cm a second, about wrist to elbow, eight strokes an arm: ' + st.map(s => s.secs / 12).join(', '));
      pl = await plan(p, 'touch', 10, { pace: 'gentle', with: 'soft', sound: 'off' });
      ok(titles(pl) === 'Settle | Find the pace | Left forearm | Right forearm | Left forearm | Right forearm | Hand on heart' && pl.steps.filter(s => s.k === 'stroke').every(s => s.inh === 3 && s.exh === 6 && !s.sweep) &&
        /brush or the velvet/.test(pl.steps[0].lines.join(' ')) && /brush or velvet/.test(pl.steps[1].lines.join(' ')),
        '10 minutes, gentler, with a brush or velvet and the sweep left out: ' + titles(pl) + '; 3 s in and 6 s out (18 cm a stroke)');
      pl = await plan(p, 'touch', 5, { touch: 'hug' });
      ok(titles(pl) === 'Settle | Find the pace | Self-hug | Hold the hug | Hand on heart' && pl.steps.filter(s => s.k === 'stroke').every(s => s.part === 'hug') &&
        /Cross your arms/.test(pl.steps[0].lines.join(' ')) && /gentle squeeze/.test(pl.steps[3].lines[0]), 'a self-hug: ' + titles(pl) + ', the strokes up the upper arms');
      pl = await plan(p, 'touch', 10, { touch: 'heart' });
      ok(titles(pl) === 'Settle | Hand on heart | Heart and belly | Slow circles | Rest' && pl.steps.slice(1).every(s => s.k === 'breath' && s.t.inh === 4 && s.t.exh === 8) &&
        /over your heart/.test(pl.steps[0].lines.join(' ')) && /on your belly/.test(pl.steps[2].lines[0]) && !pl.steps.some(s => s.sweep),
        'a hand on the heart: ' + titles(pl) + ', slow breaths with a longer breath out, a hand on the belly too, as in the self-soothing touch trial');
      // the notes: the evidence for each touch as the guide gives it
      const notes = await E(p, () => { const X = window.__entrain, d = X.pDef('touch'), c = k => d.choices.find(x => x.key === k), o = {};
        for (const v of ['arm', 'hug', 'heart']) { localStorage.setItem('entrain.pCh.touch', JSON.stringify({ touch: v })); o[v] = c('touch').note(d); }
        localStorage.removeItem('entrain.pCh.touch'); o.with = c('with').note; o.strength = d.strength; return o; });
      ok(/moderate evidence/.test(notes.arm) && /early to moderate evidence/.test(notes.hug) && /early to moderate evidence/.test(notes.heart) && /evidence is early/.test(notes.with) && notes.strength === 2,
        'each touch says its evidence as the guide rates it: stroking moderate, a hug or hand on heart early to moderate, soft textures early');

      // Self-Massage: the body map's areas with their pressure and stroke; with a partner, the same three areas each, swapped halfway
      pl = await plan(p, 'self-massage', 8);
      const ms = pl.steps.filter(s => s.k === 'massage');
      ok(titles(pl) === 'Settle | Right hand and forearm | Left hand and forearm | Jaw and temples | Scalp | Neck and shoulders | Right foot | Left foot | Rest' &&
        ms.map(s => s.body.join('+')).join(' ') === 'handR+armR handL+armL face head neck+shoulders footR footL' && ms.every(s => s.cues.length >= 3 && /pressure|Gentle|Light|Find|Get|Fingertips/.test(s.cues.map(c => c[1]).join(' '))),
        '8 minutes alone: ' + titles(pl) + ', each area lit on the body map with its pressure and stroke');
      ok(/moderate pressure: firm enough to move the skin over the muscle/.test(pl.steps[0].lines.join(' ')) && ms[0].cues[0][1] === 'Moderate pressure · thumb circles',
        'moderate pressure, explained at the start: ' + ms[0].cues.map(c => c[1]).join(', '));
      pl = await plan(p, 'self-massage', 10, { who: 'partner' });
      const tl = pl.steps.map(s => s.title), sw = tl.indexOf('Swap'), h1 = pl.steps.slice(1, sw), h2 = pl.steps.slice(sw + 1, -1);
      ok(titles(pl) === 'Agree | Hands and forearms | Shoulders and neck | Scalp | Swap | Hands and forearms | Shoulders and neck | Scalp | Together' &&
        h1.map(s => s.secs).join() === h2.map(s => s.secs).join() && /swap places: the receiver gives/.test(pl.steps[sw].lines[0]) && /“more”, “less”/.test(pl.steps[0].lines.join(' ')) &&
        /^Giver:/.test(h1[0].lines[0]) && h1[0].lines.some(l => /^Receiver:/.test(l)),
        'with a partner: ' + titles(pl) + '; giver and receiver swap halfway, each half the same length (' + h1.map(s => s.secs).join('/') + ' s)');
      // the health check: a caution for touch, written for trauma, panic or dissociation
      const hc = await E(p, () => { const X = window.__entrain, a = X.pDef('touch').hc.join() + '/' + X.pDef('self-massage').hc.join(), none = X.hcCaution(['touch']);
        localStorage.setItem('entrain.health', JSON.stringify({ at: Date.now(), on: ['trauma'] })); const tr = X.hcCaution(['touch']);
        localStorage.removeItem('entrain.health'); return { a, none, tr }; });
      ok(hc.a === 'touch/touch' && hc.none === '' && /^Touch, your own or someone else's, can bring up strong feelings or memories\. With trauma or PTSD, go gently/.test(hc.tr) && /agree a word that means stop/.test(hc.tr),
        'both carry the health check\'s touch caution, silent until something bears on it: ' + hc.tr.slice(0, 110));
      await p.context().close();
    }

    /* C. Soothing Touch running on an unlocked copy: the words follow the breath, the dot glides, the marks are real size and
       move at the real speed, a sweep with each breath out; pause, and I need to stop */
    if (!only || only === 'C') {
      let p = await page({}, { unlock: true, spy: true });
      await go(p, 'practice/touch');
      ok(await t(p, '#sGo') === 'Start 5 min' && !(await E(p, () => !!document.querySelector('#tcCalBtn .sup-tag'))), 'unlocked: Start reads ' + await t(p, '#sGo') + ', and the bank-card button has no cup');
      await p.click('#sGo'); await p.waitForTimeout(500);
      let r = await run(p);
      ok(r.state === 'running' && r.step === 'Settle' && r.vis === 'glow', 'it starts: ' + r.step);
      const fp = await stepAt(p, /^Find the pace$/);
      await clock(p, fp.at + 5); await p.waitForTimeout(400);
      r = await run(p);
      const out1 = await frame(p);
      ok(r.step === 'Find the pace' && r.vis === 'stroke' && r.cap === 'Breathe out and stroke' && /^Slowly towards the elbow · [78]$/.test(r.sub) && /about three centimetres a second/.test(r.line),
        'a second into the breath out: ' + r.cap + ' / ' + r.sub);
      await clock(p, fp.at + 13.5); await p.waitForTimeout(400);
      r = await run(p);
      ok(r.cap === 'Breathe in' && /^Lift your hand back to the wrist · [23]$/.test(r.sub), 'then the breath in: ' + r.cap + ' / ' + r.sub);
      // paused, so each frame is drawn at exactly the moment set (the canvas still draws)
      await p.click('#sPlay'); await p.waitForTimeout(200);
      // the dot glides evenly from wrist to elbow over the breath out
      const dots = [];
      for (const f of [0.25, 0.5, 0.75]) { await still(p, fp.at + 12 + 4 + 8 * f); dots.push((await frame(p)).dot); }
      ok(dots.every(Boolean) && dots[0] < dots[1] && dots[1] < dots[2] && Math.abs((dots[1] - dots[0]) - (dots[2] - dots[1])) < 0.5, 'the dot glides evenly towards the elbow through the breath out: ' + dots.join(' → '));
      // centimetre marks at real size, moving at 3 cm a second while you stroke, still while you breathe in
      const px = await E(p, () => window.__entrain.tcPx());
      await still(p, fp.at + 12 + 4 + 2); const a1 = await frame(p);
      await still(p, fp.at + 12 + 4 + 2.1); const a2 = await frame(p);
      await still(p, fp.at + 24 + 1); const b1 = await frame(p);
      await still(p, fp.at + 24 + 2); const b2 = await frame(p);
      const shift = Math.round(((a2.marks[1] - a1.marks[1]) + px) % px * 10) / 10;
      ok(a1.gaps.length >= 4 && a1.gaps.every(g => Math.abs(g - px) < 0.05) && Math.abs(px - 160 / 2.54) < 0.01 && Math.abs(shift - 0.3 * px) < 0.2 && b1.marks.join() === b2.marks.join(),
        'the marks are a real centimetre apart on a phone (' + px.toFixed(1) + ' px, the usual phone density) and move 0.3 cm in a tenth of a second while you stroke (' + shift + ' px), still while you breathe in');
      await p.click('#sPlay'); await p.waitForTimeout(200);
      // the sweep: one with each breath out, lasting it, scheduled ahead on the audio clock
      await E(p, () => { window.__sw = []; window.__bp = []; });
      const lf = await stepAt(p, /^Left forearm$/);
      for (const k of [0, 1, 2]) { await clock(p, lf.at + 3.7 + 12 * k); await p.waitForTimeout(700); }
      const sws = await E(p, () => ({ n: window.__sw.length, dur: window.__sw.map((w, i) => Math.round((window.__bp[i] - w) * 100) / 100) }));
      ok(sws.n === 3 && sws.dur.every(d => d === 8), 'a soft sweep with each of three breaths out, rising over the whole 8 seconds: ' + JSON.stringify(sws));
      // pause silences what's queued and schedules nothing; carrying on brings the next one
      await clock(p, lf.at + 12 * 3 + 3.7); await p.waitForTimeout(250);
      const before = await E(p, () => window.__sw.length);
      await p.click('#sPlay'); await p.waitForTimeout(300);
      const pz = await E(p, () => ({ g: window.__entrain.TC.g, st: window.__entrain.P.state }));
      await p.waitForTimeout(900);
      const held = await E(p, () => window.__sw.length);
      await E(p, at => { window.__entrain.P.st = at; }, lf.at + 12 * 4 + 3.7);
      await p.click('#sPlay'); await p.waitForTimeout(700);
      const after = await E(p, () => window.__sw.length);
      ok(pz.st === 'paused' && pz.g === null && held === before && after === held + 1, 'pausing silences the sweeps and queues none; carrying on, the next breath out has one again (' + [before, held, after].join(' → ') + ')');
      // frames and blurs
      await E(p, () => { window.__cl = 0; window.__blur = 0; });
      await p.waitForTimeout(2000);
      const fr = await E(p, () => ({ cl: window.__cl, blur: window.__blur }));
      ok(fr.cl >= 40 && fr.cl <= 66 && !fr.blur, 'the arm is drawn at about 30 frames a second (' + Math.round(fr.cl / 2) + '), with no blurred shadows');
      await p.screenshot({ path: OUT + 'touchtest-c-stroke.png' });
      // I need to stop: everything quiet at once, the session ended, Settle open
      await p.click('#sOut'); await p.waitForTimeout(700);
      const stop = await E(p, () => ({ g: window.__entrain.TC.g, st: window.__entrain.P.state, settle: !document.querySelector('#stlModal').hidden }));
      ok(stop.g === null && stop.st !== 'running' && stop.st !== 'paused' && stop.settle, 'I need to stop silences the sweeps at once and opens Settle');
      await p.click('#stlDone'); await p.waitForTimeout(200);
      await p.context().close();

      // the sweep left out, and the self-hug: the elbow to the shoulder; to the end and the history
      p = await page({ 'pCh.touch': JSON.stringify({ touch: 'hug', sound: 'off' }) }, { unlock: true, spy: true });
      await go(p, 'practice/touch');
      await p.click('#sGo'); await p.waitForTimeout(400);
      const hg = await stepAt(p, /^Self-hug$/);
      for (const k of [0, 1]) { await clock(p, hg.at + 3.7 + 12 * k); await p.waitForTimeout(700); }
      r = await run(p);
      const hw = await E(p, () => window.__sw.length);
      ok(r.step === 'Self-hug' && r.cap === 'Breathe out and stroke' && /^Up towards your shoulders · /.test(r.sub) && hw === 0, 'a self-hug with the sweep left out: ' + r.sub + ', and no sweeps');
      await clock(p, await E(p, () => window.__entrain.P.total - 0.5)); await p.waitForTimeout(900);
      const fin = await E(p, () => ({ st: window.__entrain.P.state, h: document.querySelector('#sDone h2') ? document.querySelector('#sDone h2').textContent : '',
        hist: (JSON.parse(localStorage.getItem('entrain.history') || '[]').filter(e => e.id === 'touch').pop() || {}).n }));
      ok(fin.st === 'done' && fin.h === 'Let your hands rest, and take the calm with you.' && fin.hist === 'Soothing Touch', 'to the end: its closing line, and the history keeps it: ' + fin.h);
      await p.context().close();
    }

    /* D. matching a bank card: the dialog sizes a box a card's height, kept on this device only */
    if (!only || only === 'D') {
      const p = await page({}, { unlock: true, spy: true });
      await go(p, 'practice/touch');
      const guess = await E(p, () => window.__entrain.tcGuess());
      await p.click('#tcCalBtn'); await p.waitForTimeout(300);
      const o1 = await E(p, () => ({ open: !document.querySelector('#tcModal').hidden, foc: document.activeElement.id, h: document.querySelector('#tcBox').getBoundingClientRect().height, said: document.querySelector('#tcSaid').textContent }));
      ok(o1.open && o1.foc === 'tcRange' && Math.abs(o1.h - (CARD * guess + 2)) < 1 && /usual size/.test(o1.said), 'Match a bank card opens a box a bank card\'s height at the usual size (' + Math.round(o1.h) + ' px), the slider ready');
      for (let i = 0; i < 3; i++) await p.click('#tcMore');
      const h2 = await E(p, () => document.querySelector('#tcBox').getBoundingClientRect().height);
      for (let i = 0; i < 12; i++) await p.keyboard.press('Tab');
      const inside = await E(p, () => document.querySelector('#tcModal').contains(document.activeElement));
      await p.keyboard.press('Escape'); await p.waitForTimeout(200);
      const e1 = await E(p, () => ({ open: !document.querySelector('#tcModal').hidden, kept: localStorage.getItem('entrain.touchPx'), foc: document.activeElement.id }));
      ok(Math.abs(h2 - o1.h - 0.9 * CARD) < 1 && inside && !e1.open && e1.kept === null && e1.foc === 'tcCalBtn', '+ grows it, Tab stays inside, and Escape leaves it as it was, back on the button');
      await p.click('#tcCalBtn'); await p.waitForTimeout(300);
      await E(p, () => { const r = document.querySelector('#tcRange'); r.value = '50'; r.dispatchEvent(new Event('input', { bubbles: true })); });
      const h3 = await E(p, () => document.querySelector('#tcBox').getBoundingClientRect().height);
      await p.click('#tcSave'); await p.waitForTimeout(250);
      const s1 = await E(p, () => ({ kept: localStorage.getItem('entrain.touchPx'), px: window.__entrain.tcPx(), note: document.querySelector('#tcCalNote').textContent }));
      ok(Math.abs(h3 - (CARD * 50 + 2)) < 1 && s1.kept === '50.0' && s1.px === 50 && /^Matched to a bank card on this device/.test(s1.note), 'saved: 50 screen points a centimetre, and the note says so: ' + s1.note);
      // the marks under the arm follow it
      await p.click('#sGo'); await p.waitForTimeout(400);
      const fp = await stepAt(p, /^Find the pace$/);
      await clock(p, fp.at + 1); await p.waitForTimeout(300);
      const mk = await frame(p);
      ok(mk.gaps.length >= 4 && mk.gaps.every(g => Math.abs(g - 50) < 0.05), 'and the marks under the arm are 50 points apart now: ' + mk.gaps.slice(0, 4).join(', '));
      await endNow(p); await p.waitForTimeout(300);
      // backups leave it out: another screen is another size
      await go(p, 'settings', 400);
      const [dl] = await Promise.all([p.waitForEvent('download'), p.click('#stSave')]);
      const saved = OUT + 'touchtest-backup.json'; await dl.saveAs(saved);
      const bk = JSON.parse(fs.readFileSync(saved, 'utf8'));
      ok(!('touchPx' in bk.data) && 'pOpt' in bk.data && await E(p, () => localStorage.getItem('entrain.touchPx')) === '50.0',
        'a backup leaves this screen\'s size out (another screen is another size), and it stays here');
      // the usual size again
      await go(p, 'practice/touch');
      await p.click('#tcCalBtn'); await p.waitForTimeout(300);
      const said = await t(p, '#tcSaid');
      await p.click('#tcUsual'); await p.waitForTimeout(200);
      const u1 = await E(p, () => ({ kept: localStorage.getItem('entrain.touchPx'), px: window.__entrain.tcPx(), g: window.__entrain.tcGuess(), note: document.querySelector('#tcCalNote').textContent }));
      ok(/^Matched before on this device/.test(said) && u1.kept === null && u1.px === u1.g && /^Set from this screen's usual size/.test(u1.note), 'Use the usual size forgets the match');
      await p.context().close();
      // a computer: a CSS centimetre, and a tap outside closes it
      const d = await page({}, { unlock: true, desk: true });
      await go(d, 'practice/touch');
      const dg = await E(d, () => window.__entrain.tcPx());
      await d.click('#tcCalBtn'); await d.waitForTimeout(300);
      await d.mouse.click(10, 10); await d.waitForTimeout(200);
      ok(Math.abs(dg - 96 / 2.54) < 0.01 && await E(d, () => document.querySelector('#tcModal').hidden && localStorage.getItem('entrain.touchPx') === null),
        'on a computer it starts from the CSS centimetre (' + dg.toFixed(1) + ' px), and a tap outside the dialog closes it unchanged');
      await d.context().close();
    }

    /* E. Self-Massage running, alone and with a partner; the health check's caution; Learn, search and the sleep habits routine */
    if (!only || only === 'E') {
      let p = await page({ health: JSON.stringify({ at: Date.now(), on: ['trauma'] }) }, { unlock: true });
      await go(p, 'practice/self-massage');
      const hcx = await t(p, '#sIntro .hc-note');
      ok(/^From your health check\. Touch, your own or someone else's, can bring up strong feelings or memories\. With trauma or PTSD, go gently/.test(hcx), 'with trauma ticked, Self-Massage shows the touch caution written for it');
      await go(p, 'practice/touch');
      ok(/With trauma or PTSD, go gently/.test(await t(p, '#sIntro .hc-note')), 'and so does Soothing Touch');
      await go(p, 'practice/self-massage');
      await p.click('#sGo'); await p.waitForTimeout(400);
      let r = await jump(p, /^Right hand and forearm$/);
      const lit = () => E(p, () => [...document.querySelectorAll('#sFig g.on')].map(g => g.dataset.r).join('+'));
      ok(r.k === 'massage' && r.vis === 'body' && await lit() === 'armR+handR' && /^Moderate pressure · thumb circles · \d+ s$/.test(r.sub) && /thumb, press slow circles into the palm/.test(r.line),
        'the right hand and forearm, lit on the body map: ' + r.sub);
      const ar = await stepAt(p, /^Right hand and forearm$/);
      await clock(p, ar.at + ar.secs * 0.55); await p.waitForTimeout(400);
      r = await run(p);
      ok(/^Light pressure · long strokes · \d+ s$/.test(r.sub) && /long, slow strokes from the wrist/i.test(r.line), 'halfway through, the pressure and stroke change: ' + r.sub);
      r = await jump(p, /^Jaw and temples$/);
      ok(await lit() === 'face' && /^Find the spot · /.test(r.sub), 'the jaw and temples light the face');
      r = await jump(p, /^Neck and shoulders$/);
      ok(await lit() === 'shoulders+neck', 'the neck and shoulders light both');
      await endNow(p); await p.waitForTimeout(400);
      await p.context().close();
      p = await page({ 'pCh.self-massage': JSON.stringify({ who: 'partner' }) }, { unlock: true });
      await go(p, 'practice/self-massage');
      await p.click('#sGo'); await p.waitForTimeout(400);
      r = await run(p);
      ok(r.step === 'Agree' && /Decide who gives first/.test(r.line), 'with a partner it starts by agreeing who gives first');
      r = await jump(p, /^Swap$/);
      ok(/swap places/.test(r.line), 'and swaps halfway: ' + r.line);
      await endNow(p); await p.waitForTimeout(300);
      await p.context().close();

      // Learn: Touch, its four paragraphs, every citation with a linked reference, the contents link; search; healthy sleep habits
      p = await page();
      await go(p, 'learn', 400);
      const L = await E(p, () => {
        const h = document.getElementById('l-touch'), ps = [], tx = e => e.textContent.replace(/\s+/g, ' ').trim();
        let e = h && h.nextElementSibling; while (e && e.tagName === 'P') { ps.push(e); e = e.nextElementSibling; }
        const refs = [...document.querySelectorAll('#references li')], txt = ps.map(tx).join(' ');
        const cites = [...txt.matchAll(/\(([^()]*?\d{4})\)/g)].map(m => m[1]).filter(c => /[A-Z]/.test(c));
        const found = cites.map(c => { const m = /^(?:[^;]*?)((?:de |van |von )?[A-ZÀ-Ž][\w'’À-ž-]+)[^;]*?,? (\d{4})$/.exec(c.split(';')[0].trim()); return m ? [m[1], m[2]] : [c, '']; });
        const missing = found.filter(f => !refs.some(r => tx(r).startsWith(f[0] + ',') && tx(r).includes('(' + f[1] + ')') && r.querySelector('a[href^="https://"]')));
        return { h: h && tx(h), ids: ps.map(x => x.id).join(' '), n: cites.length, missing: missing.map(m => m.join(' ')), toc: !!document.querySelector('.toc a[href="#l-touch"]'),
          links: [...new Set(ps.flatMap(x => [...x.querySelectorAll('a')].map(a => a.getAttribute('href') + (a.nextElementSibling && a.nextElementSibling.classList.contains('sup-tag') ? '+cup' : ''))))].join(' '),
          txt };
      });
      ok(L.h === 'Touch: slow strokes, a hand on the heart, weighted blankets and massage' && L.ids === 'l-ctouch l-selftouch l-weighted l-massage' && L.toc,
        'Learn has Touch, with its contents link: ' + L.ids);
      ok(L.n >= 12 && !L.missing.length, L.n + ' citations in it, each with a reference that links to the paper' + (L.missing.length ? '; missing: ' + L.missing.join(' | ') : ''));
      ok(L.links === '#practice/touch+cup #practice/sleep-descent #living/sleep-habits #practice/self-massage+cup', 'it links to the practices, the new ones with the cup: ' + L.links);
      ok(/1 to 10 cm a second/.test(L.txt) && /3 cm a second/.test(L.txt) && /couldn't rule out other explanations/.test(L.txt) && /Cohen's d = 1\.90/.test(L.txt) && /0\.40/.test(L.txt) &&
        /low-risk option with moderate support/.test(L.txt) && /not for small children/.test(L.txt) && /studied far less/.test(L.txt) && /alpha fell/.test(L.txt),
        'the evidence as the guide gives it, its limits included: the trial\'s sample, the blanket for an anxious or low edge, self-massage less studied, a study where alpha fell');
      await p.click('#tbFind'); await p.waitForTimeout(150);
      await p.fill('#fdIn', 'weighted blanket'); await p.waitForTimeout(300);
      const wb = await E(p, () => [...document.querySelectorAll('#fdRes .fd-it')].map(a => a.getAttribute('href')));
      ok(wb[0] === '#l-weighted' && wb.includes('#living/sleep-habits'), 'search finds weighted blankets in Learn and in the sleep habits: ' + wb.slice(0, 6).join(' '));
      await p.keyboard.press('Escape'); await p.waitForTimeout(150);
      await go(p, 'living/sleep-habits', 600);
      const sh = await E(p, () => { const li = [...document.querySelectorAll('#lv-sleep-habits .lv-rsteps > li')].find(l => /weighted blanket/.test(l.querySelector('b').textContent));
        return li ? { t: li.querySelector('b').textContent, p: li.querySelector('p').textContent.replace(/\s+/g, ' ').trim(), refs: [...document.querySelectorAll('#lv-sleep-habits .lv-refl a')].map(a => a.getAttribute('href')) } : null; });
      ok(sh && sh.t === 'Perhaps a weighted blanket' && /anxiety or a low mood/.test(sh.p) && /low-risk, though unproven for most other people/.test(sh.p) && /not for small children, or for anyone who couldn't take it off unaided/.test(sh.p) &&
        sh.refs.includes('https://pmc.ncbi.nlm.nih.gov/articles/PMC7970589/') && sh.refs.includes('https://pmc.ncbi.nlm.nih.gov/articles/PMC11539645/'),
        'healthy sleep habits suggest a weighted blanket, with the same limits and its two trials among the sources');
      await p.context().close();
    }

    /* F. a 360 px phone and reduced motion: the session and the dialog fit; the marks hold still while the dot still paces you */
    if (!only || only === 'F') {
      const p = await page({}, { unlock: true, spy: true, rm: true, vp: { width: 360, height: 740 } });
      await go(p, 'practice/touch');
      await p.click('#tcCalBtn'); await p.waitForTimeout(300);
      const dlg = await E(p, () => { const b = [...document.querySelectorAll('#tcModal button')].map(x => x.getBoundingClientRect()); return { w: document.documentElement.scrollWidth, cw: document.querySelector('#tcModal .modal-card').scrollWidth,
        small: b.filter(r => r.height < 44 || r.width < 44).length, box: Math.round(document.querySelector('#tcBox').getBoundingClientRect().width) }; });
      await p.screenshot({ path: OUT + 'touchtest-f-card.png' });
      await p.click('#tcCancel'); await p.waitForTimeout(150);
      ok(dlg.w <= 360 && dlg.cw <= 360 && !dlg.small && dlg.box <= 360, 'at 360 px the bank-card dialog fits, every button at least 44 px: ' + JSON.stringify(dlg));
      await p.click('#sGo'); await p.waitForTimeout(400);
      const fp = await stepAt(p, /^Find the pace$/);
      await clock(p, fp.at + 5); await p.waitForTimeout(400);
      await p.click('#sPlay'); await p.waitForTimeout(200);
      await still(p, fp.at + 5); const m1 = await frame(p);
      await still(p, fp.at + 7); const m2 = await frame(p);
      await p.click('#sPlay'); await p.waitForTimeout(200);
      const wide = await E(p, () => document.documentElement.scrollWidth);
      ok(m1.marks.length >= 4 && m1.marks.join() === m2.marks.join() && m1.dot < m2.dot && wide <= 360,
        'with reduced motion the centimetre marks hold still while the dot still glides with the breath out, and nothing is wider than the screen: ' + m1.dot + ' → ' + m2.dot);
      await p.screenshot({ path: OUT + 'touchtest-f-360.png' });
      await endNow(p); await p.waitForTimeout(200);
      await p.context().close();
    }
  } catch (e) { log.push('ERROR ' + (e && e.stack || e)); }
  await browser.close();
  console.log(log.join('\n'));
  console.log(log.filter(l => l.startsWith('PASS')).length + ' passed, ' + log.filter(l => /^(FAIL|PAGEERROR|ERROR|CONSOLE)/.test(l)).length + ' problems');
  process.exit(log.some(l => /^(FAIL|PAGEERROR|ERROR|CONSOLE)/.test(l)) ? 1 : 0);
})();
