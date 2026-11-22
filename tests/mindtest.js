// The mind: Guided Imagery and Yoga Nidra. Locked on the real build (their pages free to read, every way in asking for the
// donation), their plans at every length and choice, Guided Imagery running on an unlocked copy (the eyes-closed chime, the
// counts drawn large, the place's colour, the suggestion, back to alert or into sleep with its beat sliding to delta), Yoga
// Nidra's rotation round the body map, its resolve, breath count, opposites and images, the health check's caution, Learn
// and search, a small phone and reduced motion.
//   A  locked: pages, Start, library, search, Settings, Learn's glance rows; Options with the beat off; 360 px
//   B  every plan at every length and choice; the shape of each; the beat; the health check's kinds
//   C  Guided Imagery running: the chime, the counts, the place's colour, 30 frames a second, to the end; into sleep
//   D  Yoga Nidra running: the rotation on the body map, the breath count, images, the end; into sleep; I need to stop
//   E  the health check's caution; Learn, its references and search; the safety note
//   F  a 360 px phone and reduced motion
// Run: node tests/mindtest.js [group letter]
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
const IDS = ['imagery', 'yoga-nidra'];
const NAMES = { imagery: 'Guided Imagery', 'yoga-nidra': 'Yoga Nidra' };

(async () => {
  const browser = await chromium.launch();
  const log = []; const ok = (c, m) => log.push((c ? 'PASS ' : 'FAIL ') + m);
  const UNLOCKED = testApp();
  // a phone (412 × 915 unless vp says), debug on, the headphone check done, the options open; st: stored values;
  // o.unlock: the test copy, unlocked; o.rm: reduced motion; o.spy: what's said, the tones' pitches, and the canvas
  const page = async (st, o) => {
    o = o || {};
    const ctx = await browser.newContext(Object.assign({ userAgent: S20, viewport: o.vp || { width: 412, height: 915 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
      { reducedMotion: o.rm ? 'reduce' : 'no-preference' }));
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
      window.__said = [];
      if (window.speechSynthesis) { speechSynthesis.speak = u => window.__said.push(u.text); speechSynthesis.cancel = () => {}; }
    }, Object.assign({ pOpt: OPT() }, st || {}));
    if (o.spy) await p.addInitScript(() => {
      window.__hz = []; window.__cl = 0; window.__blur = 0; window.__fr = [[]];
      const os = OscillatorNode.prototype.start;
      OscillatorNode.prototype.start = function () { window.__hz.push(Math.round(this.frequency.value * 100) / 100); return os.apply(this, arguments); };
      const cr = CanvasRenderingContext2D.prototype.clearRect;
      CanvasRenderingContext2D.prototype.clearRect = function () {
        if (this.canvas.id === 'sCanvas') { window.__cl++; window.__fr.push([]); if (window.__fr.length > 6) window.__fr.shift(); }
        return cr.apply(this, arguments);
      };
      const ft = CanvasRenderingContext2D.prototype.fillText;     // the frame's words and numbers, with how faded they were
      CanvasRenderingContext2D.prototype.fillText = function (x) { if (this.canvas.id === 'sCanvas') window.__fr[window.__fr.length - 1].push(['t', String(x), Math.round(this.globalAlpha * 100) / 100]); return ft.apply(this, arguments); };
      const arc = CanvasRenderingContext2D.prototype.arc;
      CanvasRenderingContext2D.prototype.arc = function (x, y, r) { if (this.canvas.id === 'sCanvas') window.__fr[window.__fr.length - 1].push(['a', Math.round(r * 100) / 100]); return arc.apply(this, arguments); };
      const cs = CanvasGradient.prototype.addColorStop;             // the orb's colour
      CanvasGradient.prototype.addColorStop = function (o, c) { const f = window.__fr[window.__fr.length - 1]; if (f) f.push(['c', String(c)]); return cs.apply(this, arguments); };
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
  const clock = (p, sec) => E(p, sec => { window.__entrain.P.t0 = performance.now() / 1000 - sec; }, sec);
  const still = async (p, sec) => { await E(p, sec => { window.__entrain.P.st = sec; }, sec); await p.waitForTimeout(160); };
  const stepAt = (p, re) => E(p, src => { const X = window.__entrain, s = X.P.steps.find(x => new RegExp(src).test(x.title)); return s ? { at: s.at, secs: s.secs, lines: s.lines, pts: s.pts || null, nums: s.nums || null } : null; }, re.source);
  const plan = (p, id, len, ch) => E(p, ([id, len, ch]) => {
    const X = window.__entrain;
    if (ch) localStorage.setItem('entrain.pCh.' + id, JSON.stringify(ch)); else localStorage.removeItem('entrain.pCh.' + id);
    const d = X.pDef(id), pl = X.pPlan(d, len);
    return { total: pl.total, base: pl.base, pts: X.pAudio(d, pl.base).pts, band: X.pAudio(d, pl.base).band, steps: pl.steps.map(s => ({ title: s.title, k: s.k, secs: s.secs, at: s.at, t: s.t || null, vis: s.vis || '',
      body: s.body || null, nums: s.nums || null, pts: s.pts || null, sleepy: !!s.sleepy, quiet: !!s.quiet, nobell: !!s.nobell, tint: s.tint || '', sub: s.sub || '',
      lines: s.lines.map(l => l[1]), at0: s.lines.map(l => l[0]), tags: s.lines.map(l => l[2] || '') })) };
  }, [id, len, ch || null]);
  const titles = x => x.steps.map(s => s.title).join(' | ');
  const endNow = p => E(p, () => { const b = document.querySelector('#sEnd'); b.click(); b.click(); });
  // the last whole frame drawn: its words, its circles' radii and its colours
  const frame = p => E(p, () => {
    const f = window.__fr[window.__fr.length - 2] || [];
    return { text: f.filter(x => x[0] === 't').map(x => x[1] + '@' + x[2]), r: f.filter(x => x[0] === 'a').map(x => x[1]), c: f.filter(x => x[0] === 'c').map(x => x[1]) };
  });

  try {
    /* A. locked on the real build: each page free to read, Start asking for the donation, the badge everywhere */
    if (!only || only === 'A') {
      const p = await page();
      const kinds = { imagery: 'Calm · Relaxation · 10 min', 'yoga-nidra': 'Recover · Relaxation · 30 min' };
      for (const id of IDS) {
        await go(p, 'practice/' + id);
        const pg = await E(p, () => { const q = s => document.querySelector('#sIntro ' + s), tx = e => e ? e.textContent.replace(/\s+/g, ' ').trim() : '';
          return { title: document.querySelector('#viewTitle').textContent, kind: tx(q('.si-kind')), go: tx(q('#sGo')), note: q('#sSupNote').hidden ? '' : tx(q('#sSupNote')), steps: document.querySelectorAll('#sIntro .si-steps li').length,
            ev: tx(q('.si-ev .ev-body')), how: tx(q('.si-main > p')), caution: tx(q('.si-caution')), dots: q('.si-ev summary .strength') ? q('.si-ev summary .strength').querySelectorAll('i.on').length : 0,
            needs: [...document.querySelectorAll('#sIntro .si-need li')].map(tx).join(' | '), lens: [...document.querySelectorAll('#sIntro .si-len button')].map(tx).join(' '),
            beat: [...document.querySelectorAll('#sOptBeat button')].map(b => tx(b) + (b.getAttribute('aria-pressed') === 'true' ? '*' : '')).join(' '), bnote: tx(document.querySelector('#sBeatNote')),
            choices: [...document.querySelectorAll('#sOpts [data-choice]')].map(g => g.dataset.choice + ':' + [...g.querySelectorAll('button')].map(b => b.dataset.v + (b.getAttribute('aria-pressed') === 'true' ? '*' : '')).join('/')).join(' ') }; });
        ok(pg.title === NAMES[id] && pg.kind === kinds[id] && pg.go === 'Unlock to start' && /^One of the new techniques/.test(pg.note) && pg.steps >= 10 && pg.ev.length > 400 && pg.how.length > 400 && pg.dots === 2,
          NAMES[id] + ': its page reads in full (' + pg.kind + ', ' + pg.steps + ' steps, evidence ' + pg.dots + ' of 3), and Start reads ' + pg.go);
        ok(/psychosis or a dissociative disorder/.test(pg.caution) && /detached or unreal/.test(pg.caution) && /I need to stop/.test(pg.caution) && /About its binaural beat/.test(pg.caution),
          NAMES[id] + ': its caution names psychosis and dissociation, and the beat\'s own: ' + pg.caution.slice(0, 120));
        ok(/Lying down/.test(pg.needs) && /Voice on/.test(pg.needs) && /only if you add a binaural beat/.test(pg.needs) && pg.beat === 'Off* Theta 6 Hz' && /^No beat/.test(pg.bnote),
          NAMES[id] + ': lying down or sitting back, the voice on, and the theta beat off until you add it: ' + pg.beat);
        ok(id === 'imagery' ? pg.lens === '10 min 15 min 20 min' && pg.choices === 'place:beach*/forest/lake/own aim:calm*/confidence/rest end:wake*/sleep'
          : pg.lens === '20 min 30 min 45 min' && pg.choices === 'resolve:own*/calm/rest/strong end:wake*/sleep', NAMES[id] + ': its lengths and choices: ' + pg.lens + ' · ' + pg.choices);
        if (id === 'yoga-nidra') ok(/In later pregnancy, lie on your side/.test(pg.caution) && /let any part of the body go/.test(pg.caution), 'Yoga Nidra adds lying on your side in later pregnancy, and letting a part go with trauma');
        await p.click('#sGo'); await p.waitForTimeout(250);
        const dl = await E(p, () => ({ open: !document.querySelector('#supModal').hidden, for: document.querySelector('#supFor').textContent, st: window.__entrain.P.state }));
        ok(dl.open && dl.for === NAMES[id] + ' is one of the new techniques.' && dl.st !== 'running', NAMES[id] + ': Start opens the donation dialog, naming it, and nothing starts');
        await p.click('#supClose'); await p.waitForTimeout(150);
      }
      // the ending changes the beat's note: down to delta into sleep
      await go(p, 'practice/imagery');
      await p.click('#sOpts [data-choice="end"] button[data-v="sleep"]'); await p.waitForTimeout(300);
      await p.click('#sOptBeat button[data-v="theta"]'); await p.waitForTimeout(250);
      const bn = await t(p, '#sBeatNote');
      ok(/^A 6 Hz beat, in the theta band the hypnotic state is linked with \(beats' own evidence is mixed\), sliding down to 3 Hz delta as you drift into sleep\./.test(bn) && await t(p, '#sGo') === 'Unlock to start',
        'choosing Into sleep and the beat: its note says it slides to delta, and Start still asks for the donation: ' + bn.slice(0, 100));
      await E(p, () => { localStorage.removeItem('entrain.pCh.imagery'); localStorage.removeItem('entrain.pOpt.imagery'); });
      // the library and its badges, the Sleep chip's "also good for"; search; Settings
      await go(p, 'practice');
      const lib = await E(p, ids => ids.map(id => { const a = document.querySelector('#prLib a[href="#practice/' + id + '"]'); return a ? a.closest('.pr-grp').dataset.g + (a.querySelector('.pc-meta .sup-tag') ? '+sup' : '') : 'none'; }), IDS);
      const tax = await E(p, ids => ids.map(id => { const d = window.__entrain.pDef(id); return d.goal + '/' + d.method + '/' + d.posture.join(' ') + '/' + (d.also || []).join(' '); }), IDS);
      ok(lib.join() === 'calm+sup,recover+sup' && tax.join(' | ') === 'calm/relax/sit lie/sleep | recover/relax/lie/sleep',
        'the library lists Guided Imagery under Calm and Yoga Nidra under Recover, both also good for sleep, each with the Donation badge: ' + lib.join() + ' · ' + tax.join(' | '));
      await p.click('#prFilt [data-f=sleep]'); await p.waitForTimeout(250);
      const also = await E(p, () => [...document.querySelectorAll('#prLib .pr-grp[data-g=also] .pc-top b')].map(b => b.textContent));
      ok(also.includes('Guided Imagery') && also.includes('Yoga Nidra'), 'the Sleep chip lists both as also good for sleep');
      await p.click('#prFilt [data-f=sleep]'); await p.waitForTimeout(150);
      await p.click('#tbFind'); await p.waitForTimeout(150);
      const finds = [];
      for (const [w, id] of [['guided imagery', 'imagery'], ['self-hypnosis', 'imagery'], ['mountain lake', 'imagery'], ['yoga nidra', 'yoga-nidra'], ['nsdr', 'yoga-nidra'], ['sankalpa', 'yoga-nidra']]) {
        await p.fill('#fdIn', w); await p.waitForTimeout(250);
        finds.push(await E(p, ([w, id]) => { const a = document.querySelector('#fdRes a.fd-it[href="#practice/' + id + '"]'); return w + (a ? (a.querySelector('.sup-tag') ? ': found +sup' : ': found') : ': missing'); }, [w, id]));
      }
      ok(finds.every(f => /found \+sup$/.test(f)), 'search finds them, with the badge: ' + finds.join(', '));
      await p.keyboard.press('Escape'); await p.waitForTimeout(150);
      await go(p, 'st-supporter', 450);
      const list = await E(p, () => [...document.querySelectorAll('#supList a')].map(a => a.textContent + '>' + a.getAttribute('href')));
      ok(IDS.every(id => list.includes(NAMES[id] + '>#practice/' + id)), 'Settings, New techniques, lists both');
      // Learn: the glance table's Mind rows lead to them, the new techniques with the cup
      await go(p, 'learn', 400);
      const rows = await E(p, () => [...[...document.querySelectorAll('#lnGlance tbody')].find(b => /Mind/.test(b.querySelector('.ln-sense').textContent)).querySelectorAll('tr.ln-row')]
        .map(r => r.querySelector('th b').textContent + ' (' + r.children[1].textContent + ') > ' + [...r.children[2].querySelectorAll('a')].map(a => a.getAttribute('href') + (a.nextElementSibling && a.nextElementSibling.classList.contains('sup-tag') ? '+cup' : '')).join(' ')));
      ok(rows.join(' | ') === 'Mindfulness, meditation (Moderate to strong) > #practice/anapana #practice/metta #practice/walking | Hypnosis, guided imagery (Moderate to strong) > #practice/imagery+cup | Yoga nidra (NSDR), body scan (Moderate) > #practice/yoga-nidra+cup #practice/body-scan #practice/nsdr',
        'Techniques at a glance: the Mind rows keep the guide\'s evidence and lead to Guided Imagery and Yoga Nidra, with the cup: ' + rows.join(' | '));
      // a small phone: nothing wider than the screen, the name fits the top bar, Start in reach
      await p.setViewportSize({ width: 360, height: 740 });
      const fit = [];
      for (const id of IDS) {
        await go(p, 'practice/' + id, 300);
        fit.push(await E(p, id => { const b = document.querySelector('#sGo').getBoundingClientRect(), h = document.querySelector('#viewTitle');
          return id + (document.documentElement.scrollWidth > document.documentElement.clientWidth ? ' wide' : '') + (h.scrollWidth > h.clientWidth + 1 ? ' title' : '') + (b.bottom > innerHeight - 62 || b.top < 0 ? ' start' : ''); }, id));
      }
      ok(fit.every(f => !/ /.test(f)), 'at 360 px each page fits, its name fits the top bar and Start is in reach: ' + fit.join(', '));
      await p.screenshot({ path: OUT + 'mindtest-a-locked.png' });
      await p.context().close();
    }

    /* B. the plans: every length and choice adds up, says what to do, in British spelling; the shape of each; the beat */
    if (!only || only === 'B') {
      const p = await page();
      const sweep = await E(p, ([ids, NOT, SPELL]) => {
        const X = window.__entrain, bad = [], not = new RegExp(NOT, 'i'), spell = new RegExp(SPELL, 'i'), out = {};
        ids.forEach(id => {
          const d = X.pDef(id); let combos = [{}], n = 0;
          (d.choices || []).forEach(c => { const m = []; combos.forEach(o => c.opts.forEach(v => m.push(Object.assign({}, o, { [c.key]: v[0] })))); combos = m; });
          const texts = [d.name, d.blurb, d.how, d.ev, d.parts, d.caution || '', d.end, d.next.txt];
          (d.choices || []).forEach(c => texts.push(c.label, typeof c.note === 'function' ? '' : c.note || '', ...c.opts.map(o => o[1])));
          [d.blurb, d.end].forEach(x => { if (not.test(x)) bad.push(id + ' says: ' + x); });
          for (const L of d.lengths) for (const ch of combos) {
            localStorage.setItem('entrain.pCh.' + id, JSON.stringify(ch)); n++;
            (d.choices || []).forEach(c => { if (typeof c.note === 'function') texts.push(c.note(d)); });
            d.beats.forEach(b => texts.push(b.note(d), b.band(d)));
            const pl = X.pPlan(d, L), pts = X.pAudio(d, pl.base).pts;
            if (pl.total !== L * 60) bad.push(id + ' ' + L + ' min ' + JSON.stringify(ch) + ': ' + pl.total + ' s');
            if (pts[0][0] !== 0 || pts.some((q, i) => i && q[0] <= pts[i - 1][0]) || Math.abs(pts[pts.length - 1][0] - pl.base) > 1 || pts.some(q => q[1] < 3 || q[1] > 6)) bad.push(id + ' beat ' + JSON.stringify(pts));
            pl.steps.forEach(s => {
              if (!(s.secs >= 15)) bad.push(id + ' ' + s.title + ': ' + s.secs + ' s');
              s.lines.forEach((l, i) => { if (!(l[0] >= 0 && l[0] < s.secs) || (i && l[0] <= s.lines[i - 1][0])) bad.push(id + ' ' + s.title + ' line at ' + l[0]); if (not.test(l[1])) bad.push(id + ' says: ' + l[1]); texts.push(l[1]);
                if (i && s.lines[i - 1][2] !== 'chime' && l[0] - s.lines[i - 1][0] < (s.k === 'rotate' ? 2.4 : 4.85)) bad.push(id + ' ' + L + ' ' + s.title + ': lines ' + (l[0] - s.lines[i - 1][0]) + ' s apart'); });
              (s.nums || []).forEach((q, i) => { if (q[0] !== s.lines[i + 1][0]) bad.push(id + ' ' + s.title + ': number ' + q[1] + ' out of step with its line'); });
              (s.pts || []).forEach((q, i) => { if (!s.lines.some(l => l[0] === q.t)) bad.push(id + ' ' + s.title + ': point ' + i + ' said at no line'); });
              [s.title, s.hint, s.prompt, s.sub].concat(Object.values(s.hints || {})).forEach(x => { if (x && not.test(x)) bad.push(id + ' says: ' + x); if (x) texts.push(x); });
            });
          }
          localStorage.removeItem('entrain.pCh.' + id);
          texts.forEach(x => { if (x && spell.test(x)) bad.push(id + ' spells: ' + x.match(spell)[0]); });
          out[id] = n;
        });
        return { bad, out };
      }, [IDS, NOT.source, SPELL.source]);
      ok(!sweep.bad.length && sweep.out.imagery === 72 && sweep.out['yoga-nidra'] === 24, 'every plan at every length and choice (' + Object.keys(sweep.out).map(k => k + ' ' + sweep.out[k]).join(', ') +
        ') lasts exactly its length, its beat between 6 and 3 Hz from start to end, every line inside its step, in order and time to be said, worded as what to do, in British spelling' + (sweep.bad.length ? ': ' + sweep.bad.slice(0, 6).join(' | ') : ''));

      // Guided Imagery: the induction, the count, the place through each sense, the suggestion, and the count up
      let pl = await plan(p, 'imagery', 10);
      const S = n => pl.steps.find(s => s.title === n);
      ok(titles(pl) === 'Settle | Long breaths out | Eyes closed | Counting down | Down to the beach | What you see | What you hear | What you feel | What you smell | Rest there | Calm to keep | Counting up',
        '10 minutes, as it comes: ' + titles(pl));
      ok(S('Long breaths out').k === 'breath' && S('Long breaths out').t.inh === 4 && S('Long breaths out').t.exh === 6 && /Rest your eyes on one spot/.test(S('Settle').lines.join(' ')) && /eyelids grow heavy/.test(S('Long breaths out').lines.join(' ')),
        'it starts with your eyes on one spot and slow breaths, 4 in and 6 out, until the eyelids grow heavy');
      const ey = S('Eyes closed');
      ok(ey.tags[0] === 'chime' && ey.lines[0] === 'Eyes closed' && ey.nobell && /let your eyes close/.test(ey.lines[1]), 'then a chime, in place of a bell or a word, for the eyes to close: ' + ey.lines[1]);
      const dn = S('Counting down');
      ok(dn.nums.map(n => n[1]).join() === '10,9,8,7,6,5,4,3,2,1' && dn.lines[1] === 'Ten.' && dn.lines[10] === 'One. Deeply calm.' && dn.vis === 'mind' && dn.sub === 'From ten down to one',
        'a count from ten down to one, each number said and shown: ' + dn.lines.slice(1, 4).join(' '));
      const senses = pl.steps.slice(4, 10);
      ok(senses.every(s => s.tint === '#e9c46a' && s.vis === 'mind' && s.lines.length === 4) && /quiet beach/.test(senses[0].lines[0]) && /colour of the sea/.test(senses[1].lines[0]) && /rush of each wave/.test(senses[2].lines[0]) &&
        /sand beneath you/.test(senses[3].lines[0]) && /sea air/.test(senses[4].lines[0]) && /taste of salt/.test(senses[4].lines.join(' ')),
        'the beach through each sense, in the colour of sand: sight, sound, touch, smell and taste, and a while to rest');
      ok(S('Calm to keep').lines.some(l => /thumb and first finger/.test(l)) && /three slow breaths out/.test(S('Calm to keep').lines.join(' ')), 'the calm suggestion: three slow breaths and a touch of thumb and finger bring it back');
      const up = S('Counting up');
      ok(up.nums.map(n => n[1]).join() === '1,2,3,4,5' && /^Five\. Eyes open, wide awake/.test(up.lines[5]) && up.sub === 'From one up to five' && pl.pts.join(' ') === '0,6 600,6' && pl.band === 'Theta',
        'back to alert: a count up from one to five, eyes opening on five; the beat a steady 6 Hz');
      const places = {};
      for (const [pc, re, col] of [['forest', /forest/, '#74c69d'], ['lake', /through the mountains/, '#6cb4e4'], ['own', /safe, calm and at ease/, '']]) {
        const q = await plan(p, 'imagery', 15, { place: pc });
        places[pc] = q.steps[4].title + ' ' + (re.test(q.steps[4].lines[0]) && q.steps.slice(4, 10).every(s => s.tint === col) ? 'ok' : 'wrong');
      }
      ok(Object.values(places).join(', ') === 'Into the forest ok, To the lake ok, Your place ok', 'each place has its own scene and colour: ' + Object.values(places).join(', '));
      const aims = {};
      for (const a of ['confidence', 'rest']) { const q = await plan(p, 'imagery', 10, { aim: a }); aims[a] = q.steps[10].title + ': ' + q.steps[10].lines[1]; }
      ok(/^Steady and sure: Picture yourself meeting it steadily/.test(aims.confidence) && /^Deep rest: Every muscle softening/.test(aims.rest), 'and each suggestion its own: ' + Object.values(aims).join(' | '));
      pl = await plan(p, 'imagery', 20, { end: 'sleep' });
      const into = pl.steps[pl.steps.length - 2], dr = pl.steps[pl.steps.length - 1];
      ok(into.title === 'Into sleep' && into.sleepy && into.quiet && dr.k === 'drift' && dr.secs === 120 && !pl.steps.some(s => s.title === 'Counting up') &&
        pl.pts.join(' ') === '0,6 ' + into.at + ',6 ' + dr.at + ',3 1200,3' && pl.band === 'Theta → Delta',
        'into sleep: the scene fades, quietly, then two minutes to drift, no count up; the beat slides from 6 to 3 Hz through Into sleep and stays there: ' + pl.pts.join(' '));

      // Yoga Nidra: the stages, the rotation round the body map, the resolve
      pl = await plan(p, 'yoga-nidra', 30);
      ok(titles(pl) === 'Settle | Sounds | Your resolve | Rotation of awareness | Counting breaths | Heavy and light | Warm and cool | Images | Deep rest | Your resolve again | Coming back',
        '30 minutes, as it comes: ' + titles(pl));
      const rot = pl.steps[3], body = await E(p, () => window.__entrain.ynPoints(false).length);
      const gaps = rot.pts.slice(1).map((q, i) => Math.round((q.t - rot.pts[i].t) * 10) / 10);
      ok(rot.k === 'rotate' && rot.pts.length === 96 && body === 96 && gaps.every(g => g === 3) && rot.lines[1] === 'Right hand thumb' && rot.lines[96] === 'The whole body together' &&
        rot.pts.every((q, i) => q.t === rot.at0[i + 1]), 'the rotation: 96 points, one every 3 seconds, from the right hand thumb to the whole body together, each said as it lights');
      const order = ['Right hand thumb', 'Left hand thumb', 'Right shoulder blade', 'Top of the head', 'The whole right leg'].map(n => rot.lines.indexOf(n));
      const regions = await E(p, () => window.__entrain.ynPoints(false).concat(window.__entrain.ynPoints(true)));
      const known = ['back', 'armR', 'armL', 'handR', 'handL', 'shoulders', 'chest', 'belly', 'hips', 'thighR', 'thighL', 'kneeR', 'kneeL', 'shinR', 'shinL', 'footR', 'footL', 'neck', 'head', 'face', 'all'];
      ok(order.every((x, i) => x > 0 && (!i || x > order[i - 1])) && regions.every(q => q[1].length && q[1].every(r => known.includes(r)) && (q[2] === null || (q[2] > 0 && q[2] < 120 && q[3] > 0 && q[3] < 300))),
        'right side, left side, the back, the front, then the whole parts; every point lights known regions of the body map, and its dot is on the map');
      const rt = regions.filter(q => /^Right/.test(q[0]) && q[2] !== null), lf = regions.filter(q => /^Left/.test(q[0]) && q[2] !== null);
      ok(rt.every(q => q[2] <= 60) && lf.every(q => q[2] >= 60) && regions.find(q => q[0] === 'Right hand thumb')[1][0] === 'handR' && regions.find(q => q[0] === 'Big toe')[1][0] === 'footR',
        'the right side is drawn on the map\'s right (the viewer\'s left), as the body map labels it');
      ok(/sankalpa/.test(pl.steps[2].lines[0]) && /Choose your own/.test(pl.steps[2].lines.join(' ')) && /three times/.test(pl.steps[9].lines.join(' ')),
        'your own resolve, said three times at the start and again near the end');
      ok(/from 27 down to 1/.test(pl.steps[4].lines.join(' ')) && /start again at 27/.test(pl.steps[4].lines.join(' ')) && pl.steps[4].k === 'observe' && pl.steps[4].sub === 'From 27 down to 1, at your own pace',
        'the natural breath, counted backwards from 27');
      ok(/heaviness/.test(pl.steps[5].lines[0]) && /lightness/.test(pl.steps[5].lines[2]) && /warmth/.test(pl.steps[6].lines[0]) && /coolness/.test(pl.steps[6].lines[2]), 'heavy then light, warm then cool');
      const im = pl.steps[7], ig = im.at0.slice(1, -1).map((x, i, a) => i ? x - a[i - 1] : 5);
      ok(im.lines.length - 2 >= 20 && ig.every(g => g >= 4.85) && im.lines[1] === 'A candle flame, steady and bright.' && /let the images go/.test(im.lines[im.lines.length - 1]),
        'quick images, ' + (im.lines.length - 2) + ' of them, each given at least five seconds');
      const ends = {};
      pl = await plan(p, 'yoga-nidra', 20, { resolve: 'calm' });
      ends[20] = titles(pl);
      const said = pl.steps[2].lines.concat(pl.steps.find(s => s.title === 'Your resolve again').lines).filter(l => /I am calm and at ease/.test(l)).length;
      ok(said === 6 && !pl.steps.some(s => s.title === 'Deep rest') && pl.steps[3].pts.length === 47, '20 minutes: a shorter rotation of 47 points, no quiet rest, and the resolve you chose said three times each time');
      pl = await plan(p, 'yoga-nidra', 45, { end: 'sleep' });
      const r45 = pl.steps[3], once = r45.lines.findIndex(l => l === 'Once more, a little faster.'), g2 = r45.pts.slice(97).map((q, i) => Math.round((q.t - r45.pts[96 + i].t) * 10) / 10);
      ok(r45.pts.length === 143 && once === 97 && g2.every(g => g === 2.5) && pl.steps.slice(-2).map(s => s.title + (s.sleepy || s.k === 'drift' ? '~' : '')).join() === 'Into sleep~,Drift~' &&
        pl.steps[pl.steps.length - 1].secs === 240 && pl.band === 'Theta → Delta' && pl.pts[1][0] === pl.steps[pl.steps.length - 2].at,
        '45 minutes into sleep: round the body twice, the second time a little faster (every 2.5 s), then into sleep and four minutes to drift, the beat sliding to delta');
      // the health check's kinds
      const hc = await E(p, () => [window.__entrain.pDef('imagery').hc.join('+'), window.__entrain.pDef('yoga-nidra').hc.join('+')]);
      ok(hc.join(' ') === 'imagery imagery+body', 'Guided Imagery carries the health check\'s imagery caution, Yoga Nidra both imagery and body: ' + hc.join(' '));
      await p.context().close();
    }

    /* C. Guided Imagery running on an unlocked copy */
    if (!only || only === 'C') {
      let p = await page({ pOpt: OPT({ voice: true, bells: true }) }, { unlock: true, spy: true });
      await go(p, 'practice/imagery');
      ok(await t(p, '#sGo') === 'Start 10 min', 'unlocked: Start reads ' + await t(p, '#sGo'));
      await p.click('#sGo'); await p.waitForTimeout(500);
      let r = await run(p);
      ok(r.state === 'running' && r.step === 'Settle' && r.vis === 'mind', 'it starts: ' + r.step + ', on the mind visual');
      // the eyes-closed chime: the bell at 659.25 Hz rather than the step bell, and the words after it
      const ey = await stepAt(p, /^Eyes closed$/);
      await E(p, () => { window.__hz = []; window.__said = []; });
      await clock(p, ey.at + 0.3); await p.waitForTimeout(600);
      await clock(p, ey.at + 2.2); await p.waitForTimeout(500);
      const ch = await E(p, () => ({ hz: window.__hz.slice(), said: window.__said.slice() }));
      r = await run(p);
      ok(r.step === 'Eyes closed' && ch.hz.includes(659.25) && !ch.hz.includes(392) && !ch.said.includes('Eyes closed') && ch.said.some(x => /let your eyes close/.test(x)),
        'Eyes closed: a chime (659.25 Hz, not the step bell), and then the words: ' + ch.said.join(' / '));
      // the count down, drawn large and faded in
      const dn = await stepAt(p, /^Counting down$/);
      await clock(p, dn.nums[3][0] + dn.at + 1); await p.waitForTimeout(600);
      r = await run(p);
      await p.click('#sPlay'); await p.waitForTimeout(200);
      await still(p, dn.at + dn.nums[3][0] + 1.2); const f7 = await frame(p);
      await still(p, dn.at + dn.nums[3][0] + 0.2); const f7a = await frame(p);
      ok(r.step === 'Counting down' && r.sub === 'From ten down to one' && r.line === 'Seven. Calmer.' && f7.text.includes('7@1') && f7a.text.some(x => /^7@0\.[1-9]/.test(x)),
        'counting down: Seven said and shown large, fading in over its first moment: ' + f7a.text.join(' ') + ' → ' + f7.text.join(' '));
      // the beach, in the colour of sand
      const bc = await stepAt(p, /^What you see$/);
      await p.click('#sPlay'); await p.waitForTimeout(200);
      await clock(p, bc.at + 4); await p.waitForTimeout(500);
      await p.click('#sPlay'); await p.waitForTimeout(200);
      await still(p, bc.at + 4); const fb = await frame(p);
      ok(fb.c.some(c => /^rgba\(233, ?196, ?106/.test(c)) && !fb.text.length, 'on the beach, the orb takes the colour of sand, and no number: ' + fb.c[0]);
      await p.click('#sPlay'); await p.waitForTimeout(200);
      await E(p, () => { window.__cl = 0; window.__blur = 0; });
      await clock(p, bc.at + 6); await p.waitForTimeout(2000);
      const fr = await E(p, () => ({ cl: window.__cl, blur: window.__blur }));
      ok(fr.cl >= 40 && fr.cl <= 66 && !fr.blur, 'the scene is drawn at about 30 frames a second (' + Math.round(fr.cl / 2) + '), with no blurred shadows');
      await p.screenshot({ path: OUT + 'mindtest-c-beach.png' });
      // the count up, and the end
      const up = await stepAt(p, /^Counting up$/);
      await E(p, () => { window.__said = []; });
      await clock(p, up.at + up.nums[4][0] + 0.5); await p.waitForTimeout(600);
      r = await run(p);
      ok(r.step === 'Counting up' && /^Five\. Eyes open/.test(r.line), 'counting up to five: ' + r.line);
      await clock(p, await E(p, () => window.__entrain.P.total - 0.5)); await p.waitForTimeout(900);
      const fin = await E(p, () => ({ st: window.__entrain.P.state, h: document.querySelector('#sDone h2') ? document.querySelector('#sDone h2').textContent : '', said: window.__said.slice(-1)[0],
        hist: (JSON.parse(localStorage.getItem('entrain.history') || '[]').filter(e => e.id === 'imagery').pop() || {}).n, next: (document.querySelector('#sDone a[href="#practice/yoga-nidra"]') || {}).textContent || '' }));
      ok(fin.st === 'done' && fin.h === 'Take the calm of your place with you.' && fin.said === fin.h && fin.hist === 'Guided Imagery' && /Yoga Nidra/.test(fin.next),
        'to the end: its closing line, said; the history keeps it; Yoga Nidra suggested next');
      await p.context().close();

      // into sleep, with the beat: no bells or words at the end, the beat sliding to delta
      p = await page({ pOpt: OPT({ voice: true, bells: true }), 'pCh.imagery': JSON.stringify({ end: 'sleep', place: 'forest', beat: 'theta' }), 'pOpt.imagery': JSON.stringify({ audio: true }) }, { unlock: true, spy: true });
      await go(p, 'practice/imagery');
      await p.click('#sGo'); await p.waitForTimeout(800);
      const tr = await E(p, () => { const X = window.__entrain; return { playing: X.A.playing, band: X.A.track && X.A.track.band, pts: X.A.track && X.A.track.pts.map(q => q.join(',')).join(' ') }; });
      ok(tr.playing && tr.band === 'Theta → Delta' && tr.pts === '0,6 490,6 540,3 600,3', 'with the beat added and Into sleep: it plays, 6 Hz sliding to 3 Hz from the start of Into sleep: ' + tr.pts);
      const fo = await stepAt(p, /^What you hear$/);
      await clock(p, fo.at + 2); await p.waitForTimeout(500);
      await p.click('#sPlay'); await p.waitForTimeout(200);
      await still(p, fo.at + 3); const ff = await frame(p);
      await p.click('#sPlay'); await p.waitForTimeout(200);
      ok(ff.c.some(c => /^rgba\(116, ?198, ?157/.test(c)), 'in the forest the orb is green: ' + ff.c[0]);
      await E(p, () => { window.__hz = []; window.__said = []; });
      await clock(p, await E(p, () => window.__entrain.P.total - 0.5)); await p.waitForTimeout(900);
      const sl = await E(p, () => ({ st: window.__entrain.P.state, hz: window.__hz.filter(h => h === 392 || h === 523.25).length, said: window.__said.slice() }));
      ok(sl.st === 'done' && !sl.hz && !sl.said.length, 'it ends into sleep with no bells and no words');
      await p.context().close();
    }

    /* D. Yoga Nidra running on an unlocked copy: the rotation on the body map, the breath count, images; I need to stop */
    if (!only || only === 'D') {
      let p = await page({ 'pCh.yoga-nidra': JSON.stringify({ resolve: 'strong' }) }, { unlock: true, spy: true });
      await go(p, 'practice/yoga-nidra');
      ok(await t(p, '#sGo') === 'Start 30 min', 'unlocked: Start reads ' + await t(p, '#sGo'));
      await p.click('#sGo'); await p.waitForTimeout(500);
      let r = await run(p);
      ok(r.state === 'running' && r.step === 'Settle' && r.vis === 'body', 'it starts: ' + r.step + ', with the whole body map');
      const rs = await stepAt(p, /^Your resolve$/);
      await clock(p, rs.at + rs.lines[1][0] + 0.5); await p.waitForTimeout(500);
      r = await run(p);
      ok(r.step === 'Your resolve' && r.line === 'Say it silently three times, with feeling: I am steady and strong.', 'the resolve you chose: ' + r.line);
      const rot = await stepAt(p, /^Rotation of awareness$/);
      const map = () => E(p, () => { const s = document.querySelector('#sFig svg.bm'), d = s && s.querySelector('.mn-pt');
        return s ? { on: [...s.querySelectorAll('[data-r].on')].map(g => g.dataset.r).sort().join('+'), all: s.classList.contains('all'), dot: d && d.getAttribute('visibility') === 'visible' ? d.getAttribute('cx') + ',' + d.getAttribute('cy') : '' } : null; });
      await clock(p, rot.at + 2); await p.waitForTimeout(500);
      r = await run(p);
      let m = await map();
      ok(r.step === 'Rotation of awareness' && r.vis === 'body' && m.all && !m.dot && r.sub === 'A point every few seconds, round the whole body', 'the rotation begins with the whole body lit: ' + r.sub);
      const at = n => rot.pts[rot.lines.findIndex(l => l[1] === n) - 1].t;
      const seen = [];
      for (const n of ['Right hand thumb', 'Fifth finger', 'Big toe', 'Left hand thumb', 'Right shoulder blade', 'Right eyebrow', 'The whole right leg', 'The whole body together']) {
        await clock(p, rot.at + at(n) + 0.6); await p.waitForTimeout(450);
        r = await run(p); m = await map();
        seen.push(n + ': ' + r.line + ' · ' + m.on + (m.all ? ' (all)' : '') + ' · ' + (m.dot || 'no dot') + ' · ' + r.sub);
      }
      ok(seen[0] === 'Right hand thumb: Right hand thumb · handR · 13,152 · Point 1 of 96' && /^Fifth finger: Fifth finger · handR · 26,162/.test(seen[1]) && /^Big toe: Big toe · footR · 52,283/.test(seen[2]) &&
        /^Left hand thumb: Left hand thumb · handL · 107,152 · Point 28 of 96/.test(seen[3]) && /^Right shoulder blade: Right shoulder blade · back · 47,68/.test(seen[4]) &&
        /^Right eyebrow: Right eyebrow · face · 55,21/.test(seen[5]) && /^The whole right leg: The whole right leg · footR\+kneeR\+shinR\+thighR · no dot/.test(seen[6]) &&
        /^The whole body together: The whole body together · .*\(all\) · no dot · Point 9[56] of 96/.test(seen[7]),
        'each point named, its part lit and a dot where it is, then the whole parts: ' + seen.join(' | '));
      // paused, a jump back and forth keeps it in step
      await p.click('#sPlay'); await p.waitForTimeout(200);
      await p.click('#sNext'); await p.waitForTimeout(250);
      await p.click('#sPrev'); await p.waitForTimeout(250);
      await p.click('#sPlay'); await p.waitForTimeout(600);
      r = await run(p); m = await map();
      ok(r.step === 'Rotation of awareness' && (m.all || m.on.length > 0), 'a step on and back again redraws the map: ' + r.step + ' · ' + (m.on || 'all'));
      const cb = await stepAt(p, /^Counting breaths$/);
      await clock(p, cb.at + cb.lines[2][0] + 1); await p.waitForTimeout(500);
      r = await run(p);
      ok(r.step === 'Counting breaths' && r.vis === 'still' && r.sub === 'From 27 down to 1, at your own pace' && /from 27 down to 1/.test(r.line), 'then the breath, counted back from 27: ' + r.sub);
      const im = await stepAt(p, /^Images$/);
      await clock(p, im.at + im.lines[3][0] + 0.5); await p.waitForTimeout(500);
      r = await run(p);
      ok(r.step === 'Images' && r.vis === 'mind' && r.line === 'A tall tree swaying in the wind.', 'quick images, one after another: ' + r.line);
      await p.screenshot({ path: OUT + 'mindtest-d-images.png' });
      await clock(p, await E(p, () => window.__entrain.P.total - 0.5)); await p.waitForTimeout(900);
      const fin = await E(p, () => ({ st: window.__entrain.P.state, h: document.querySelector('#sDone h2') ? document.querySelector('#sDone h2').textContent : '',
        hist: (JSON.parse(localStorage.getItem('entrain.history') || '[]').filter(e => e.id === 'yoga-nidra').pop() || {}).n }));
      ok(fin.st === 'done' && fin.h === 'Yoga nidra is complete. Whenever you get up, take it slowly.' && fin.hist === 'Yoga Nidra', 'to the end: ' + fin.h);
      await p.context().close();

      // into sleep; and I need to stop, mid-rotation
      p = await page({ 'pCh.yoga-nidra': JSON.stringify({ end: 'sleep' }) }, { unlock: true });
      await go(p, 'practice/yoga-nidra');
      await p.click('#sIntro .si-len button >> nth=0'); await p.waitForTimeout(300);
      ok(await t(p, '#sGo') === 'Start 20 min', 'the 20-minute session: ' + await t(p, '#sGo'));
      await p.click('#sGo'); await p.waitForTimeout(400);
      const r2 = await stepAt(p, /^Rotation of awareness$/);
      await clock(p, r2.at + 20); await p.waitForTimeout(500);
      r = await run(p);
      ok(r.step === 'Rotation of awareness' && / of 47$/.test(r.sub), 'twenty minutes: the shorter rotation, ' + r.sub);
      await p.click('#sOut'); await p.waitForTimeout(700);
      const stop = await E(p, () => ({ st: window.__entrain.P.state, settle: !document.querySelector('#stlModal').hidden }));
      ok(stop.st !== 'running' && stop.st !== 'paused' && stop.settle, 'I need to stop ends it at once and opens Settle');
      await p.click('#stlDone'); await p.waitForTimeout(200);
      await p.context().close();
    }

    /* E. the health check's caution; Learn, its references and search; the safety note */
    if (!only || only === 'E') {
      let p = await page({ health: JSON.stringify({ at: Date.now(), on: ['psychosis', 'trauma'] }) });
      await go(p, 'practice/imagery');
      const h1 = await t(p, '#sIntro .hc-note');
      await go(p, 'practice/yoga-nidra');
      const h2 = await t(p, '#sIntro .hc-note');
      ok(/^From your health check\. Guided imagery and deep relaxation can bring up memories, or leave you feeling detached or unreal\. With psychosis or dissociation or trauma or PTSD/.test(h1) ||
        /^From your health check\. Guided imagery and deep relaxation can bring up memories, or leave you feeling detached or unreal\. With psychosis or dissociation/.test(h1),
        'with psychosis or dissociation ticked, Guided Imagery shows the imagery caution written for it: ' + h1.slice(0, 160));
      ok(/Guided imagery and deep relaxation/.test(h2) && /Close attention to the body and the breath/.test(h2), 'and Yoga Nidra the imagery and the body cautions both');
      await p.context().close();

      p = await page();
      await go(p, 'learn', 400);
      const L = await E(p, () => {
        const h = document.getElementById('l-mind'), ps = [], tx = e => e.textContent.replace(/\s+/g, ' ').trim();
        let e = h && h.nextElementSibling; while (e && e.tagName === 'P') { ps.push(e); e = e.nextElementSibling; }
        const refs = [...document.querySelectorAll('#references li')], txt = ps.map(tx).join(' ');
        const cites = [...txt.matchAll(/\(([^()]*?\d{4})\)/g)].map(m => m[1]).filter(c => /[A-Z]/.test(c));
        const found = cites.map(c => { const m = /^((?:de |van |von )?[A-ZÀ-Ž][\w'’À-ž-]+(?: [A-ZÀ-Ž][\w'’À-ž-]+)?)[^;]*?,? (\d{4})$/.exec(c.split(';')[0].trim()); return m ? [m[1], m[2]] : [c, '']; });
        const ref = f => refs.find(r => tx(r).startsWith(f[0] + ',') && tx(r).includes('(' + f[1] + ')'));
        const missing = found.filter(f => !ref(f) || (!ref(f).querySelector('a[href^="https://"]') && f[0] !== 'Satyananda Saraswati'));
        return { h: h && tx(h), ids: ps.map(x => x.id).join(' '), n: cites.length, missing: missing.map(m => m.join(' ')), toc: !!document.querySelector('.toc a[href="#l-mind"]'),
          links: [...new Set(ps.flatMap(x => [...x.querySelectorAll('a')].map(a => a.getAttribute('href') + (a.nextElementSibling && a.nextElementSibling.classList.contains('sup-tag') ? '+cup' : ''))))].join(' '),
          txt, feel: tx([...document.querySelectorAll('#sfNote .sf-list li')].find(li => /^Feelings\./.test(tx(li)))) };
      });
      ok(L.h === 'The mind: guided imagery and yoga nidra' && L.ids === 'l-imagery l-nidra l-mindcare' && L.toc, 'Learn has The mind, with its contents link: ' + L.ids);
      ok(L.n === 7 && !L.missing.length, L.n + ' citations in it, each with a reference, linked to the paper or the record but for the book' + (L.missing.length ? '; missing: ' + L.missing.join(' | ') : ''));
      ok(L.links === '#l-theta #practice/imagery+cup #practice/yoga-nidra+cup #l-evidence #l-expect #st-health', 'it links to the practices, with the cup, and to theta, the evidence, side effects and the health check: ' + L.links);
      ok(/49 meta-analyses/.test(L.txt) && /only very small or small effects on physiological measures/.test(L.txt) && /4 of 6 studies of people having heart surgery, though the reviewers' confidence was\s+low/.test(L.txt) &&
        /moderate to strong evidence for less anxiety/.test(L.txt) && /studied less/.test(L.txt) && /41 adults with chronic insomnia/.test(L.txt) && /moderate evidence\s+for deep relaxation/.test(L.txt) &&
        /haven't been tested one by one/.test(L.txt) && /evidence is mixed/.test(L.txt),
        'the evidence as the guide gives it, its limits included: low confidence, little research on imagery at home, the stages untested one by one, the beat\'s mixed evidence');
      ok(/A body scan, guided imagery, yoga nidra, tapping or a reflection can bring up strong feelings/.test(L.feel), 'the safety note\'s Feelings line names them too');
      await p.click('#tbFind'); await p.waitForTimeout(150);
      await p.fill('#fdIn', 'yoga nidra'); await p.waitForTimeout(300);
      const yn = await E(p, () => [...document.querySelectorAll('#fdRes .fd-it')].map(a => a.getAttribute('href')));
      await p.fill('#fdIn', 'hypnosis'); await p.waitForTimeout(300);
      const hy = await E(p, () => [...document.querySelectorAll('#fdRes .fd-it')].map(a => a.getAttribute('href')));
      ok(yn.includes('#practice/yoga-nidra') && yn.includes('#l-nidra') && hy.includes('#practice/imagery') && hy.includes('#l-imagery'), 'search finds them in Learn and in the library: ' + yn.slice(0, 4).join(' ') + ' · ' + hy.slice(0, 4).join(' '));
      await p.keyboard.press('Escape'); await p.waitForTimeout(150);
      await p.context().close();
    }

    /* F. a 360 px phone and reduced motion: the session fits; the orb holds still and the numbers show at once */
    if (!only || only === 'F') {
      const p = await page({}, { unlock: true, spy: true, rm: true, vp: { width: 360, height: 740 } });
      await go(p, 'practice/imagery');
      await p.click('#sGo'); await p.waitForTimeout(400);
      const dn = await stepAt(p, /^Counting down$/);
      await clock(p, dn.at + dn.nums[0][0] + 0.5); await p.waitForTimeout(500);
      await p.click('#sPlay'); await p.waitForTimeout(200);
      await still(p, dn.at + dn.nums[2][0] + 0.1); const a = await frame(p);
      await still(p, dn.at + dn.nums[2][0] + 3.3); const b = await frame(p);
      await p.click('#sPlay'); await p.waitForTimeout(200);
      const wide = await E(p, () => document.documentElement.scrollWidth);
      ok(a.text.includes('8@1') && a.r.length && a.r.join() === b.r.join() && wide <= 360,
        'with reduced motion the number shows at once rather than fading in, the orb holds still, and nothing is wider than the screen: ' + a.text.join(' ') + ', radii ' + a.r.join('/'));
      await p.screenshot({ path: OUT + 'mindtest-f-360.png' });
      await endNow(p); await p.waitForTimeout(200);
      await go(p, 'practice/yoga-nidra');
      await p.click('#sGo'); await p.waitForTimeout(400);
      const rot = await stepAt(p, /^Rotation of awareness$/);
      await clock(p, rot.at + 40); await p.waitForTimeout(600);
      const fig = await E(p, () => { const f = document.querySelector('#sFig'), r = f.getBoundingClientRect(); return { w: Math.round(r.width), h: Math.round(r.height), wide: document.documentElement.scrollWidth, dot: !!f.querySelector('.mn-pt') }; });
      ok(fig.w > 0 && fig.w <= 360 && fig.wide <= 360 && fig.dot, 'Yoga Nidra\'s body map and its dot fit a 360 px phone: ' + JSON.stringify(fig));
      await p.screenshot({ path: OUT + 'mindtest-f-rotation.png' });
      await endNow(p); await p.waitForTimeout(200);
      await p.context().close();
    }
  } catch (e) { log.push('ERROR ' + (e && e.stack || e)); }
  await browser.close();
  console.log(log.join('\n'));
  console.log(log.filter(l => l.startsWith('PASS')).length + ' passed, ' + log.filter(l => /^(FAIL|PAGEERROR|ERROR|CONSOLE)/.test(l)).length + ' problems');
  process.exit(log.some(l => /^(FAIL|PAGEERROR|ERROR|CONSOLE)/.test(l)) ? 1 : 0);
})();
