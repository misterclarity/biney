// Movement: Dance Break and the Eight Brocades (Baduanjin qigong), from the brain-wave guide's "Movement and exercise". Locked on
// the real build (the pages free to read, Start, the qigong moves in the routine builder and a routine with one in it asking for
// the donation), every plan at every length, choice and pace, Dance Break's music rising and settling with its parts and the ring
// that pulses with its beat, the Eight Brocades' drawings moving with each breath in and out, the moves in a routine of your own,
// Learn, the health check's caution, search, a small phone and reduced motion.
//   A  locked: both pages, Start asking for the donation, the library, search, Settings, the routine builder's Qigong moves
//   B  every plan at every length, choice and pace: timings, lines, tempos, breaths; the moves' loops; wording and spelling
//   C  Dance Break running on an unlocked copy: the mood, the music's tempo through the parts, the beat ring, the end, I need to stop
//   D  Dance Break seated and to your own music
//   E  the Eight Brocades running: the standing post, each movement's drawing with the breath, the counts, pause, the end
//   F  the qigong moves in the routine builder, unlocked: added, saved, run with the breath they're on; unlocked in the dialog
//   G  Learn, the safety note, the health check's caution, search
//   H  a 360 px phone and reduced motion
// Run: node tests/movetest.js [group letter]
const { chromium, APP, OUT } = require('./pw');
const { testApp, unlockInit, unlocked, sign } = require('./unlock-helper');
const S20 = 'Mozilla/5.0 (Linux; Android 13; SM-G988B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Mobile Safari/537.36';
const only = process.argv[2] || '';
const t = (p, s) => p.$eval(s, e => e.textContent.replace(/\s+/g, ' ').trim()).catch(() => '(missing)');
const E = (p, f, a) => p.evaluate(f, a);
const go = async (p, h, ms) => { await p.evaluate(x => location.hash = x, h); await p.waitForTimeout(ms || 350); };
const until = async (p, f, ms, a) => { try { await p.waitForFunction(f, a, { timeout: ms || 5000 }); return true; } catch (e) { return false; } };
const OPT = o => JSON.stringify(Object.assign({ voice: false, bells: false, cues: 'off', visual: 'circle', audio: false, voiceName: '', ana: 0, rhythm: false }, o || {}));
const NOT = /n't\b|\b(do not|never|nothing|without|stop|avoid|none)\b|feel the breath/i;
const SPELL = /\b(programs?|toward|synthesiz\w*|color\w*|favor\w*|behavior\w*|center(?:s|ed)?|organiz\w*|realiz\w*|recogniz\w*|minimiz\w*|optimiz\w*|personaliz\w*|prioritiz\w*|visualiz\w*|analyz\w*|gray|fiber|aging)\b/i;
const QG = ['qg-sky', 'qg-bow', 'qg-raise', 'qg-owl', 'qg-sway', 'qg-feet', 'qg-punch', 'qg-bounce'];
// two drawings alike to within tol units at every point (a drawing is made a frame or two before it is read)
const alike = (a, b, tol) => { const x = (a.match(/-?\d+\.\d/g) || []).map(Number), y = (b.match(/-?\d+\.\d/g) || []).map(Number); return x.length > 10 && x.length === y.length && x.every((v, i) => Math.abs(v - y[i]) <= tol); };
const QG_EN = ['Holding Up the Sky', 'Drawing the Bow', 'Separating Heaven and Earth', 'The Wise Owl Looks Back', 'Swaying Head and Tail', 'Hands to the Feet', 'Punching with Fierce Eyes', 'Bouncing on the Toes'];

(async () => {
  const browser = await chromium.launch();
  const log = []; const ok = (c, m) => log.push((c ? 'PASS ' : 'FAIL ') + m);
  const UNLOCKED = testApp();
  // a phone (412 × 915 unless vp says), debug on, the headphone check done, the options open; st: stored values;
  // o.unlock: the test copy, unlocked; o.copy: the test copy, locked; o.rm: reduced motion; o.spy: frames and blurred shadows on the session's canvas
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
    }, Object.assign({ pOpt: OPT(), amb: 'off' }, st || {}));
    if (o.spy) await p.addInitScript(() => {
      window.__cl = 0; window.__blur = 0;
      const cr = CanvasRenderingContext2D.prototype.clearRect;
      CanvasRenderingContext2D.prototype.clearRect = function () { if (this.canvas.id === 'sCanvas') window.__cl++; return cr.apply(this, arguments); };
      const d = Object.getOwnPropertyDescriptor(CanvasRenderingContext2D.prototype, 'shadowBlur');
      Object.defineProperty(CanvasRenderingContext2D.prototype, 'shadowBlur', { set(v) { if (v) window.__blur++; d.set.call(this, v); }, get() { return d.get.call(this); } });
    });
    if (o.unlock) await unlockInit(p);
    await p.goto(o.unlock || o.copy ? UNLOCKED : APP);
    await p.waitForTimeout(350);
    if (o.unlock) await unlocked(p);
    return p;
  };
  const intro = p => E(p, () => {
    const q = s => document.querySelector('#sIntro ' + s), tx = e => e ? e.textContent.replace(/\s+/g, ' ').trim() : '';
    return { title: document.querySelector('#viewTitle').textContent, kind: tx(q('.si-kind')), go: tx(q('#sGo')), note: q('#sSupNote').hidden ? '' : tx(q('#sSupNote')),
      blurb: tx(q('.si-blurb')), steps: [...document.querySelectorAll('#sIntro .si-steps li')].map(tx).join(' | '), ev: tx(q('.si-ev .ev-body')), caution: tx(q('.si-caution')),
      dots: q('.si-ev summary .strength') ? q('.si-ev summary .strength').querySelectorAll('i.on').length : 0, needs: [...document.querySelectorAll('#sIntro .si-need li')].map(tx).join(' | '),
      lens: [...document.querySelectorAll('#sIntro .si-len button')].map(tx).join(' '), scn: !!document.querySelector('#sOptScn'), mus: !!document.querySelector('#sOptMus'),
      vis: !!document.querySelector('#sOptVis'), cues: !!document.querySelector('#sOptCues'), pace: !!document.querySelector('#sOptPace'), hc: tx(q('.hc-slot')),
      choices: [...document.querySelectorAll('#sOpts [data-choice]')].map(g => g.dataset.choice + ':' + [...g.querySelectorAll('button')].map(b => b.dataset.v + (b.querySelector('.sup-tag') ? '+' : '') + (b.getAttribute('aria-pressed') === 'true' ? '*' : '')).join('/')).join(' '),
      cnote: [...document.querySelectorAll('#sOpts .so-row')].filter(r => r.querySelector('[data-choice]')).map(r => tx(r.querySelector('.so-l small'))) };
  });
  const run = p => E(p, () => {
    const X = window.__entrain, s = X.P.steps[X.P.idx] || {}, q = x => document.querySelector(x);
    return { step: s.title, k: s.k, idx: X.P.idx, state: X.P.state, cap: q('#sCap').textContent, sub: q('#sSub').textContent, line: q('#sLine').textContent, vis: q('#sStage').dataset.vis,
      fig: q('#sFig').hidden ? '' : q('#sFig').innerHTML, mus: X.MUS.on, to: X.MUS.to, bpm: X.MUS.bpm, lv: X.MUS.lv, b: X.B.state };
  });
  const jump = async (p, re) => { for (let i = 0; i < 40; i++) { const r = await run(p); if (re.test(r.step)) return r; await p.click('#sNext'); await p.waitForTimeout(140); } return run(p); };
  const clock = (p, sec) => E(p, sec => { window.__entrain.P.t0 = performance.now() / 1000 - sec; }, sec);
  const endNow = p => E(p, () => { const b = document.querySelector('#sEnd'); b.click(); b.click(); });
  // a practice's plan for a length and choices, read without the page
  const plan = (p, id, len, ch) => E(p, ([id, len, ch]) => {
    const X = window.__entrain;
    if (ch) localStorage.setItem('entrain.pCh.' + id, JSON.stringify(ch)); else localStorage.removeItem('entrain.pCh.' + id);
    const pl = X.pPlan(X.pDef(id), len);
    return { total: pl.total, steps: pl.steps.map(s => ({ title: s.title, k: s.k, secs: s.secs, at: s.at, t: s.t || null, vis: s.vis || '', bpm: s.bpm || 0, musLvl: s.musLvl, pose: s.pose || '',
      count: s.count || 0, labels: s.labels || null, sub: s.sub || '', lines: s.lines.map(l => l[1]), at0: s.lines.map(l => l[0]) })) };
  }, [id, len, ch || null]);
  const titles = x => x.steps.map(s => s.title).join(' | ');
  const hits = async (p, q) => { await p.fill('#fdIn', q); await p.waitForTimeout(500); return E(p, () => [...document.querySelectorAll('.fd-it')].map(a => a.querySelector('b').textContent + '>' + a.getAttribute('href') + (a.querySelector('.sup-tag') ? ' +sup' : ''))); };
  const lib = p => E(p, () => ({ n: document.querySelector('#ybLibN').textContent, tiles: [...document.querySelectorAll('#ybLib .yb-tile')].map(b => b.dataset.add + (b.querySelector('.sup-tag') ? '+' : '')),
    seq: [...document.querySelectorAll('#ybList .yb-row .yb-nm b')].map(b => b.textContent) }));

  try {
    /* A. locked on the real build: both pages free to read, Start asking for the donation, the library, search, Settings, the builder */
    if (!only || only === 'A') {
      const p = await page();
      await go(p, 'practice/dance');
      let pg = await intro(p);
      ok(pg.title === 'Dance Break' && pg.kind === 'Energy · Movement · 10 min' && pg.lens === '5 min 10 min 15 min' && pg.go === 'Unlock to start' && /donation of €1 or more/.test(pg.note) && pg.dots === 3 &&
        pg.steps === 'How\'s your mood?00:25 | Shake out01:15 | Sway01:55 | Bigger moves01:55 | Freestyle02:35 | Cool down01:15 | And now?00:25 | Notice00:15' &&
        /^Five to fifteen minutes of free dance to music made on your device/.test(pg.blurb),
        'Dance Break: its page reads in full while locked, 5, 10 or 15 minutes under Energy, three dots, its parts, and Start says to unlock it: ' + pg.kind + ' · ' + pg.steps);
      ok(/Hedges' g −0\.96/.test(pg.ev) && /only five small trials with 107 people/.test(pg.ev) && /hasn't been tested/.test(pg.ev) && /Noetel et al\. 2024/.test(pg.ev) &&
        /chest pain/.test(pg.caution) && /^Room to move/.test(pg.needs) && pg.choices === 'how:stand*/seat music:made*/own mood:on*/off' && !pg.scn && !pg.mus,
        'its evidence as the guide gives it (dance large, from five small trials, a single break untested), its caution, its choices, and no Scene or Music rows of its own: ' + pg.choices);
      await p.click('#sGo'); await p.waitForTimeout(300);
      ok(await E(p, () => !document.querySelector('#supModal').hidden && document.querySelector('#supFor').textContent === 'Dance Break is one of the new techniques.' && window.__entrain.P.state !== 'running' && !window.__entrain.MUS.on),
        'Start opens the donation dialog naming Dance Break, and nothing starts or plays');
      await p.click('#supClose'); await p.waitForTimeout(200);
      await go(p, 'practice/qigong');
      pg = await intro(p);
      ok(pg.title === 'Eight Brocades' && pg.kind === 'Calm · Movement · 15 min' && pg.lens === '10 min 15 min 20 min' && pg.go === 'Unlock to start' && pg.dots === 2 &&
        /^Baduanjin, the Eight Brocades of qigong/.test(pg.blurb) && pg.steps.split(' | ').length === 10 && /^Standing post/.test(pg.steps) && /Gathering\d\d:\d\d$/.test(pg.steps) &&
        QG_EN.every(n => pg.steps.includes(n)),
        'Eight Brocades: 10, 15 or 20 minutes under Calm, two dots, the standing post, the eight movements in order and the gathering: ' + pg.steps.slice(0, 90));
      ok(/tai chi or qigong brought a moderate reduction/.test(pg.ev) && /12 trials with 343 people/.test(pg.ev) && /hasn't been tested itself/.test(pg.ev) && /glaucoma/.test(pg.caution) &&
        pg.pace && pg.cues && !pg.vis && !pg.scn && pg.mus,
        'its evidence (tai chi or qigong moderate, the routine untested), its caution, the breathing pace and breath cues under Options, and no breath visual, since a drawing takes its place');
      await p.click('#sGo'); await p.waitForTimeout(300);
      ok(await E(p, () => !document.querySelector('#supModal').hidden && document.querySelector('#supFor').textContent === 'Eight Brocades is one of the new techniques.' && window.__entrain.P.state !== 'running'),
        'its Start opens the dialog too');
      await p.click('#supClose'); await p.waitForTimeout(200);
      // the library, search and Settings
      await go(p, 'practice', 500);
      const L = await E(p, () => {
        const row = h => { const a = document.querySelector('#prLib .pr-grp a.pc-a[href="' + h + '"]'); if (!a) return null; const li = a.closest('li'); return { g: a.closest('.pr-grp').dataset.g, sup: !!li.querySelector('.sup-tag') }; };
        const X = window.__entrain, item = id => X.libAll().find(x => x.href === '#practice/' + id) || {};
        return { d: row('#practice/dance'), q: row('#practice/qigong'), di: item('dance'), qi: item('qigong'), build: document.querySelector('.pc-build .pc-blurb').textContent };
      });
      ok(L.d && L.d.g === 'energy' && L.d.sup && L.q && L.q.g === 'calm' && L.q.sup && L.di.posture.join() === 'stand,sit' && L.qi.posture.join() === 'stand' && L.qi.also.join() === 'energy' &&
        L.di.needs.join() === 'space' && /^Pick from 65 yoga poses, stretches, mobility drills, qigong and capoeira moves/.test(L.build),
        'the library: Dance Break under Energy (standing or sitting, room to move), Eight Brocades under Calm and good for energy, both with the Donation badge; the builder card counts 65 moves: ' + JSON.stringify([L.d, L.q]));
      await p.click('#tbFind'); await p.waitForTimeout(250);
      const h1 = await hits(p, 'dance'), h2 = await hits(p, 'qigong'), h3 = await hits(p, 'holding up the sky');
      ok(h1[0] === 'Dance Break>#practice/dance +sup' && h2[0] === 'Eight Brocades>#practice/qigong +sup' && h3[0] === 'Holding Up the Sky>#yoga/find/qg-sky +sup',
        'search finds Dance Break, Eight Brocades for qigong, and a movement in the builder, each with the cup: ' + [h1[0], h2[0], h3[0]].join(' | '));
      await p.keyboard.press('Escape');
      await go(p, 'settings', 500);
      const list = await E(p, () => [...document.querySelectorAll('#supList a')].map(a => a.textContent + '>' + a.getAttribute('href')));
      ok(list.includes('Dance Break>#practice/dance') && list.includes('Eight Brocades>#practice/qigong') && list.includes('Qigong moves in the Routine builder>#yoga'),
        'Settings\' New techniques lists Dance Break, Eight Brocades and the qigong moves in the routine builder');
      // the routine builder: a Qigong filter, its moves with the cup, adding one opens the dialog
      await go(p, 'yoga', 400);
      const cats = await E(p, () => [...document.querySelectorAll('#ybCats button')].map(b => b.textContent));
      await p.click('#ybCats [data-cat=qigong]'); await p.waitForTimeout(150);
      let B = await lib(p);
      ok(cats.join() === 'All,Yoga poses,Stretches,Mobility,Capoeira,Qigong' && B.n === '9 moves' && B.tiles.join() === QG.concat(['qg-post']).map(x => x + '+').join(),
        'the builder has a Qigong filter: the eight movements and the standing post, each with the cup: ' + B.n);
      const lab = await E(p, () => document.querySelector('#ybLib [data-add="qg-sky"]').getAttribute('aria-label'));
      await p.click('#ybLib [data-add="qg-sky"]'); await p.waitForTimeout(300);
      B = await lib(p);
      ok(await E(p, () => !document.querySelector('#supModal').hidden && document.querySelector('#supFor').textContent === 'Holding Up the Sky is one of the new techniques.') && !B.seq.length &&
        /, opens with a donation$/.test(lab), 'adding Holding Up the Sky opens the dialog naming it, and adds nothing; its label says so: ' + lab);
      await p.click('#supClose'); await p.waitForTimeout(200);
      await p.click('#ybCats [data-cat=mobility]'); await p.waitForTimeout(100);
      await p.click('#ybLib [data-add="neckrolls"]'); await p.waitForTimeout(200);
      B = await lib(p);
      ok(B.seq.join() === 'Neck Rolls' && await E(p, () => document.querySelector('#supModal').hidden) && !B.tiles.some(x => x.endsWith('+')), 'the other moves add as ever, with no cup or dialog: ' + JSON.stringify(B));
      await p.screenshot({ path: OUT + 'movetest-a-builder.png' });
      await p.context().close();
      // a routine of your own with a qigong move in it (from a backup of an unlocked phone): its page asks for the donation
      const q = await page({ yogaSeqs: JSON.stringify([{ uid: 'qg1', name: 'Morning qigong', goal: 'energy', items: [{ id: 'qg-sky', hold: 60 }, { id: 'mountain', hold: 30 }], at: 1 },
        { uid: 'pl1', name: 'Plain', goal: 'energy', items: [{ id: 'mountain', hold: 30 }], at: 2 }]) });
      await go(q, 'practice/my-qg1');
      pg = await intro(q);
      await go(q, 'practice/my-pl1');
      const pg2 = await intro(q);
      ok(pg.title === 'Morning qigong' && pg.go === 'Unlock to start' && pg2.go === 'Start 1 min', 'a routine of your own with a qigong move in it says Unlock to start; one without starts as ever: ' + pg.go + ' / ' + pg2.go);
      await go(q, 'practice/my-qg1'); await q.click('#sGo'); await q.waitForTimeout(300);
      ok(await E(q, () => !document.querySelector('#supModal').hidden && window.__entrain.P.state !== 'running'), 'and its Start opens the dialog');
      await q.context().close();
    }

    /* B. every plan at every length, choice and pace: timings, lines, tempos and breaths; the moves' loops; wording and spelling */
    if (!only || only === 'B') {
      const p = await page(null, { unlock: true });
      const S = await E(p, ({ NOT, SPELL }) => {
        const X = window.__entrain, rn = new RegExp(NOT, 'i'), rs = new RegExp(SPELL, 'i'), bad = [], spell = [], n = { plans: 0, lines: 0 };
        const sets = { dance: [], qigong: [{}, { pace: 'own', inh: 2, exh: 2 }, { pace: 'own', inh: 3, exh: 4.5 }, { pace: 'own', inh: 10, exh: 12 }, { pace: 'own', inh: 6, exh: 9 }] };
        const dd = X.pDef('dance'); let combos = [{}];
        dd.choices.forEach(c => { const m = []; combos.forEach(o => c.opts.forEach(v => m.push(Object.assign({}, o, { [c.key]: v[0] })))); combos = m; });
        sets.dance = combos;
        Object.keys(sets).forEach(id => {
          const d = X.pDef(id), texts = [d.name, d.blurb, d.how, d.ev, d.parts || '', d.end || '', d.caution || ''].concat(...(d.needs || []).map(x => [x[1], x[2]]));
          (d.choices || []).forEach(c => texts.push(c.label, ...c.opts.map(o => o[1])));
          [d.blurb, d.end].forEach(x => { if (rn.test(x)) bad.push(id + ': ' + x); });
          sets[id].forEach(ch => {
            localStorage.setItem('entrain.pCh.' + id, JSON.stringify(ch));
            (d.choices || []).forEach(c => texts.push(typeof c.note === 'function' ? c.note(d) : c.note || ''));
            d.lengths.forEach(L => {
              const pl = X.pPlan(d, L); n.plans++;
              if (pl.total !== L * 60 || pl.steps.reduce((a, s) => a + s.secs, 0) !== L * 60 || pl.steps.some(s => s.secs !== Math.round(s.secs) || s.secs < 10)) bad.push(id + ' ' + L + ' ' + JSON.stringify(ch) + ': total ' + pl.total);
              pl.steps.forEach(s => {
                texts.push(s.title, s.sub || '');
                [s.title].concat(Object.values(s.labels || {})).forEach(x => { if (rn.test(x)) bad.push(id + ' title: ' + x); });
                s.lines.forEach((l, k, a) => {
                  n.lines++; texts.push(l[1]);
                  if (!(l[0] >= 0 && l[0] < s.secs) || (k && !(l[0] > a[k - 1][0])) || rn.test(l[1]) || l[2] === 'ana') bad.push(id + ' ' + L + ' ' + s.title + ' @' + l[0] + ': ' + l[1]);
                });
              });
            });
          });
          localStorage.removeItem('entrain.pCh.' + id);
          texts.forEach(x => { if (rs.test(x)) spell.push(id + ': ' + x.match(rs)[0]); });
        });
        // the moves themselves, as the builder and search show them
        X.QG_SET.concat(['qg-post']).forEach(id => {
          const a = X.ASANA[id];
          a.cues.forEach(c => { n.lines++; if (rn.test(c)) bad.push(id + ': ' + c); if (rs.test(c)) spell.push(id + ': ' + c); });
          [a.en, a.sa, a.caution || ''].forEach(x => { if (rs.test(x)) spell.push(id + ': ' + x); });
        });
        return { bad, spell, n };
      }, { NOT: NOT.source, SPELL: SPELL.source });
      ok(S.n.plans === 3 * 8 + 3 * 5 && S.n.lines > 400 && !S.bad.length, 'every plan at every length, choice and pace (' + S.n.plans + ' plans, ' + S.n.lines + ' lines) adds up to its length in whole seconds, its lines inside their steps, in order, and worded as what to do' + (S.bad.length ? ': ' + S.bad.slice(0, 3).join(' | ') : ''));
      ok(!S.spell.length, 'British spelling in all of it, and in the moves' + (S.spell.length ? ': ' + S.spell.slice(0, 3).join(' | ') : ''));
      // Dance Break: the parts and their tempos, the mood either side, the ring or the orb
      const d10 = await plan(p, 'dance', 10), d5 = await plan(p, 'dance', 5, { mood: 'off' }), ds = await plan(p, 'dance', 15, { how: 'seat', music: 'own' });
      ok(titles(d10) === 'How\'s your mood? | Shake out | Sway | Bigger moves | Freestyle | Cool down | And now? | Notice' && d10.steps.map(s => s.bpm).join() === '100,100,106,114,124,100,100,100' &&
        d10.steps.slice(1, 6).every(s => s.vis === 'dance') && d10.steps[5].musLvl === 0.6 && d10.steps[0].k === 'rate' && d10.steps[0].musLvl === 0.4 && d10.steps[6].k === 'rate' &&
        d10.steps[1].sub === '100 beats a minute' && d10.steps.slice(1, 6).map(s => s.secs).join() === '75,115,115,155,75' && d10.steps[7].musLvl === 0.4,
        'Dance Break: the mood, then shake out at 100 beats a minute, sway at 106, bigger moves at 114, freestyle at 124, a cool down at 100 and softer, the mood again and a moment to notice; the ring on the stage: ' + d10.steps.map(s => s.secs).join());
      ok(titles(d5) === 'Shake out | Sway | Bigger moves | Freestyle | Cool down' && d5.steps.map(s => s.secs).join() === '45,65,65,85,40' && d5.steps[0].lines[0] === 'Here\'s the music. Find some room around you.',
        'five minutes with the mood left out: the five parts alone: ' + d5.steps.map(s => s.secs).join());
      ok(ds.steps.slice(1, 6).every(s => s.vis === 'orb' && s.sub === 'To your own music') && ds.steps[1].lines[0] === 'Start your own music now, something you love to move to.' &&
        /^Sit near the front of your chair/.test(ds.steps[1].lines[1]) && /^Freestyle in your seat/.test(ds.steps[4].lines[0]) &&
        await E(p, () => { localStorage.setItem('entrain.pCh.dance', JSON.stringify({ music: 'own' })); const X = window.__entrain, d = X.pDef('dance'), o = d.music(d); localStorage.removeItem('entrain.pCh.dance'); return o === 'off' && d.music(d) === 'lively'; }),
        'seated, the prompts are for a chair; to your own music, the orb in place of the ring, and none of the music made on the device');
      ok(d10.steps[4].at0.slice(-1)[0] <= d10.steps[4].secs - 25 && d10.steps[4].lines.length === 6, 'the prompts spread through each part: freestyle\'s six, the last ' + (d10.steps[4].secs - d10.steps[4].at0.slice(-1)[0]) + ' s before its end');
      // the Eight Brocades: at your resonance pace (5.5 a minute: 4.4 in and 6.5 out), four breaths each in 10 minutes, eight in 15 and 20, seven bounces
      const Q = await E(p, () => {
        const X = window.__entrain, d = X.pDef('qigong'), out = {};
        localStorage.removeItem('entrain.pCh.qigong');
        [10, 15, 20].forEach(L => {
          const st = X.pPlan(d, L).steps, br = st.filter(s => s.k === 'breath');
          out[L] = { n: st.length, counts: br.map(s => s.count).join(), poses: br.map(s => s.pose).join(), t: JSON.stringify(br[0].t), secs: br.map(s => s.secs).join(),
            open: st[0].secs, close: st[st.length - 1].secs, how: st.filter(s => s.k === 'guide' && s.secs === 12).map(s => s.pose).join(), first: st[0].title + '/' + st[0].pose + '/' + st[st.length - 1].title,
            lab: JSON.stringify(br[0].labels), pairs: st.slice(1, -1).every((s, i) => i % 2 ? s.k === 'breath' && s.title === st[i].title && s.pose === st[i].pose : s.k === 'guide' && s.secs === 12),
            lines: br.map(s => s.lines.length).join(), l0: br.every((s, i) => s.lines[0][1] === X.ASANA[X.QG_SET[i]].cues[1]) };
        });
        localStorage.setItem('entrain.pCh.qigong', JSON.stringify({ pace: 'own', inh: 10, exh: 12 }));
        out.slow = X.pPlan(d, 10).steps.filter(s => s.k === 'breath').map(s => s.count).join();
        localStorage.setItem('entrain.pCh.qigong', JSON.stringify({ pace: 'own', inh: 2, exh: 2 }));
        out.fast = X.pPlan(d, 20).steps.filter(s => s.k === 'breath').map(s => s.count).join();
        localStorage.removeItem('entrain.pCh.qigong');
        return out;
      });
      ok(Q[10].counts === '4,4,4,4,4,4,4,7' && Q[15].counts === '8,8,8,8,8,8,8,7' && Q[20].counts === '8,8,8,8,8,8,8,7' && Q[15].poses === QG.join() && Q[15].how === QG.join() &&
        Q[15].t === JSON.stringify({ inh: 4.4, sip: 0, hold: 0, exh: 6.5, rest: 0 }) && Q[15].secs === '90,90,90,90,90,90,90,79' && Q[15].pairs && Q[15].n === 18 && Q[15].l0,
        'Eight Brocades: each movement set up in 12 s, then its breaths at your resonance pace (4.4 in, 6.5 out): four each in 10 minutes, eight in 15 and 20, and seven bounces: ' + [Q[10].counts, Q[15].counts, Q[15].secs].join(' / '));
      ok(Q[10].open === 50 && Q[10].close === 46 && Q[15].open === 50 && Q[15].close === 45 && Q[20].open === 200 && Q[20].close === 195 && Q[15].first === 'Standing post/qg-post/Gathering',
        'the rest is standing: the post and the gathering, longer with more time: ' + [10, 15, 20].map(L => Q[L].open + '+' + Q[L].close).join(', '));
      ok(Q.slow === '2,2,2,2,2,2,2,3' && Q.fast === '8,8,8,8,8,8,8,7' && Q[15].lab === JSON.stringify({ in: 'Breathe in, press up', out: 'Breathe out, float down' }) && Q[15].lines === '3,3,3,3,3,3,3,3' && Q[10].lines === '2,2,2,2,2,2,2,3',
        'at your own pace: two breaths each and three bounces at the slowest (10 in, 12 out) in 10 minutes, eight at the quickest; captions say which breath and what to do; reminders later in each: ' + [Q.slow, Q[10].lines].join(' / '));
      // each move's loop: one breath, or one to each side; the breath in takes its share of the loop (40%, as 4 to 6)
      const M = await E(p, () => {
        const X = window.__entrain, out = {};
        X.QG_SET.forEach(id => {
          const a = X.ASANA[id], m = X.qgMarks(a), mv = X.movePrep(a);
          out[id] = { bpl: m.length, inShare: m.map(x => +(mv.at[x.o] - mv.at[x.i]).toFixed(3)).join(), cycle: a.cycle, sup: a.sup, cat: a.cat, move: a.move,
            ready: !!a.ready, frames: [0, 0.25, 0.5, 0.75].map(u => X.figSVG(X.figFrame(a, u).f, null, '', X.figBox(a, null), 0)).filter((h, i, l) => l.indexOf(h) === i).length };
        });
        out.post = { move: !!X.ASANA['qg-post'].move, sup: X.ASANA['qg-post'].sup, fig: !!X.ASANA['qg-post'].fig };
        return out;
      });
      const two = ['qg-bow', 'qg-raise', 'qg-owl', 'qg-sway', 'qg-punch'];
      ok(QG.every(id => M[id].bpl === (two.includes(id) ? 2 : 1) && M[id].cycle === 10 * M[id].bpl && M[id].sup && M[id].cat === 'qigong' && M[id].move && M[id].frames >= 3) &&
        QG.every(id => M[id].inShare.split(',').every(x => Math.abs(+x - 0.4 / M[id].bpl) < 0.01)) && !M.post.move && M.post.sup && M.post.fig &&
        ['qg-sway', 'qg-feet', 'qg-punch'].every(id => M[id].ready),
        'each movement loops through its drawings, one breath or one to each side, the breath in 40% of each, ten seconds a breath in a routine; the punch, the sway and the fold start from a stance of their own: ' + QG.map(id => M[id].bpl + ':' + M[id].inShare).join(' '));
      await p.context().close();
    }

    /* C. Dance Break running on an unlocked copy: the mood, the music's tempo through the parts, the beat ring, the end, I need to stop */
    if (!only || only === 'C') {
      const p = await page(null, { unlock: true, spy: true });
      await go(p, 'practice/dance');
      ok((await intro(p)).go === 'Start 10 min', 'unlocked, Start reads Start 10 min');
      await p.click('#sGo'); await p.waitForTimeout(500);
      let r = await run(p);
      const playing = await until(p, () => window.__entrain.MUS.on, 4000);
      r = await run(p);
      ok(r.state === 'running' && r.step === 'How\'s your mood?' && r.k === 'rate' && playing && r.to === 100 && r.lv === 0.4 && await E(p, () => !document.querySelector('#sRate').hidden),
        'it starts with your mood from 0 to 10, the music already playing, softly, at 100 beats a minute: ' + JSON.stringify({ to: r.to, lv: r.lv }));
      await p.click('#sRateG button[data-v="5"]'); await p.waitForTimeout(900);
      r = await run(p);
      ok(r.step === 'Shake out' && r.vis === 'dance' && r.to === 100 && r.sub === '100 beats a minute' && /^Here's the music/.test(r.line), 'a tap, and on to shaking out, at 100 beats a minute, the ring on the stage: ' + r.line);
      await E(p, () => { window.__cl = 0; }); await p.waitForTimeout(2000);
      const fps = await E(p, () => window.__cl / 2);
      ok(fps >= 20 && fps <= 32 && await E(p, () => window.__blur === 0), 'the ring is drawn about 30 times a second, with no blurred shadows: ' + fps);
      await p.screenshot({ path: OUT + 'movetest-c-dance.png' });
      // the ring follows the music's own beat: where it is on the music's grid of beats, on the audio clock
      const sync = await E(p, () => {
        const X = window.__entrain, s = X.P.steps[X.P.idx], now = X.A.ctx.currentTime, b = X.dncBeat(s, 0), want = X.MUS.b0 + (now - X.MUS.t0) * X.MUS.bpm / 60;
        return { b, want, d: Math.abs(b - want) };
      });
      ok(sync.d < 0.05, 'the ring keeps the music\'s beat: it is at beat ' + sync.b.toFixed(2) + ' of the music\'s grid, where the music is ' + sync.want.toFixed(2));
      // through the parts, the music's tempo follows
      const at = name => E(p, n => { const X = window.__entrain, s = X.P.steps.find(x => x.title === n); return s.at + 3; }, name);
      const seen = {};
      for (const n of ['Sway', 'Bigger moves', 'Freestyle', 'Cool down']) {
        await clock(p, await at(n)); await p.waitForTimeout(700);
        r = await run(p);
        seen[n] = r.step + ':' + r.to;
      }
      await until(p, () => window.__entrain.MUS.bpm === 100, 12000);     // the glide down, on the audio clock
      const t100 = await E(p, () => window.__entrain.A.ctx.currentTime); await p.waitForTimeout(2500);
      r = await run(p);
      ok(seen.Sway === 'Sway:106' && seen['Bigger moves'] === 'Bigger moves:114' && seen.Freestyle === 'Freestyle:124' && seen['Cool down'] === 'Cool down:100' && r.bpm === 100 && r.lv === 0.6,
        'the music follows each part: 106, 114 and 124 beats a minute, gliding there, then back to 100, softer, to cool down: ' + JSON.stringify(seen) + ' now ' + r.bpm);
      const fresh = await E(p, t100 => { const X = window.__entrain, lg = X.MUS.log.filter(e => e.t > t100 + 1); return { ok: lg.length > 0 && lg.every(e => Math.abs(e.bpm - 100) < 0.5), bpm: lg.map(e => e.bpm.toFixed(1) + e.v).join() }; }, t100);
      ok(fresh.ok, 'the notes played since are at 100 beats a minute: ' + fresh.bpm);
      r = await jump(p, /^And now\?$/);
      await p.click('#sRateG button[data-v="8"]'); await p.waitForTimeout(800);
      await E(p, () => { window.__entrain.P.t0 -= window.__entrain.P.total; }); await p.waitForTimeout(900);
      const D = await E(p, () => {
        const b = document.querySelector('#sDone .sd-t[data-ex="suds"]'), X = window.__entrain;
        return { h: document.querySelector('#sDone h2').textContent, tile: b ? [...b.children].slice(0, 3).map(e => e.textContent).join(' | ') : '', nx: [...document.querySelectorAll('#sDone .sd-next a')].map(a => a.getAttribute('href')).join(),
          hist: (JSON.parse(localStorage.getItem('entrain.history') || '[]').filter(e => e.id === 'dance').pop() || {}).note, donate: !!document.querySelector('#sDone .sd-donate') };
      });
      ok(D.h === 'Well danced. Notice how you feel now.' && D.tile === 'Mood | 5 → 8 | out of 10, before and after' && D.hist === 'mood 5 → 8 of 10' && D.nx === '#practice/qigong' && D.donate,
        'the end: its line, your mood before and after side by side and in the history, and the Eight Brocades next: ' + JSON.stringify(D));
      ok(await until(p, () => !window.__entrain.MUS.on, 4000), 'and the music ends with it');
      // I need to stop silences the music at once
      await go(p, 'practice'); await go(p, 'practice/dance'); await p.click('#sGo');
      await until(p, () => window.__entrain.MUS.on, 4000);
      await p.click('#sOut'); await p.waitForTimeout(800);
      ok(await E(p, () => !window.__entrain.MUS.on && window.__entrain.P.state !== 'running'), 'I need to stop ends it and the music with it');
      await p.context().close();
    }

    /* D. Dance Break seated and to your own music */
    if (!only || only === 'D') {
      const p = await page({ 'pCh.dance': JSON.stringify({ how: 'seat', music: 'own', mood: 'off' }) }, { unlock: true, spy: true });
      await go(p, 'practice/dance');
      const pg = await intro(p);
      ok(pg.choices === 'how:stand/seat* music:made/own* mood:on/off*' && /^Play your own music from another app/.test(pg.cnote[1]) && pg.steps === 'Shake out01:25 | Sway02:10 | Bigger moves02:10 | Freestyle02:50 | Cool down01:25',
        'seated, to your own music, with the mood left out: ' + pg.steps);
      await p.click('#sGo'); await p.waitForTimeout(2500);
      let r = await run(p);
      ok(r.step === 'Shake out' && r.vis === 'orb' && !r.mus && r.sub === 'To your own music' && r.line === 'Start your own music now, something you love to move to.',
        'it starts to your own music: none made on the device, the orb on the stage: ' + r.line);
      await clock(p, 40); await p.waitForTimeout(600);
      r = await run(p);
      ok(/chair|shoulders|feet/.test(r.line) && !r.mus, 'and its prompts are for a chair: ' + r.line);
      await endNow(p); await p.waitForTimeout(400);
      await p.context().close();
    }

    /* E. the Eight Brocades running: the standing post, each movement's drawing with the breath, the counts, pause, the end */
    if (!only || only === 'E') {
      const p = await page({ pOpt: OPT({ cues: 'tones' }), 'pCh.qigong': JSON.stringify({ pace: 'own', inh: 2, exh: 3 }) }, { unlock: true, spy: true });
      await go(p, 'practice/qigong');
      const pg = await intro(p);
      ok(pg.go === 'Start 10 min' || pg.go === 'Start 15 min', 'unlocked, Start reads ' + pg.go);
      await p.click('#sGo'); await p.waitForTimeout(500);
      let r = await run(p);
      ok(r.state === 'running' && r.step === 'Standing post' && r.vis === 'pose' && /<svg class="pose/.test(r.fig) && r.sub === 'Zhan zhuang', 'it starts with the standing post and its drawing: ' + r.sub);
      r = await jump(p, /^Holding Up the Sky$/);
      ok(r.k === 'guide' && r.vis === 'pose' && r.sub === 'Liang shou tuo tian' && /^Holding up the sky\./.test(r.line), 'then each movement is set up with its drawing: ' + r.line.slice(0, 40));
      await E(p, () => { const X = window.__entrain; X.P.t0 -= X.P.steps[X.P.idx].at + 12 - (performance.now() / 1000 - X.P.t0); });
      await p.waitForTimeout(500);
      r = await run(p);
      ok(r.k === 'breath' && r.vis === 'pose' && r.cap === 'Get ready' && r.b === 'running' && await E(p, () => { const X = window.__entrain; return X.BC.inh === 2 && X.BC.exh === 3 && X.P.mv && X.P.mv.a.id === 'qg-sky'; }),
        'then its breaths, on the breathing guide\'s engine at your pace (2 in, 3 out), the drawing in its place: ' + r.cap);
      // follow the breath: sample the caption and the drawing a few times a second for two breaths
      const S = await E(p, async () => {
        const X = window.__entrain, out = [];
        for (let i = 0; i < 52; i++) {
          await new Promise(res => setTimeout(res, 230));
          const F = X.frameState(), want = X.qgFrame(X.P.mv.a, F), svg = X.figSVG(want.f, null, '', X.P.mv.box, want.dx);
          out.push({ k: F.k, n: F.L ? F.L.count : -1, cap: document.querySelector('#sCap').textContent, sub: document.querySelector('#sSub').textContent,
            fig: document.querySelector('#sFig').innerHTML, want: svg, lv: F.level });
        }
        return out;
      });
      const live = S.filter(x => x.k === 'in' || x.k === 'out');
      const caps = [...new Set(live.map(x => x.cap))], subs = [...new Set(live.map(x => x.sub))];
      const near = live.filter(x => alike(x.fig, x.want, 9)).length, figs = new Set(live.map(x => x.fig)).size;
      ok(caps.includes('Breathe in, press up') && caps.includes('Breathe out, float down') && subs.includes('Breath 1 of 8') && subs.includes('Breath 2 of 8'),
        'the caption says which breath and what to do, and counts them: ' + caps.join(' / ') + ' · ' + subs.join(', '));
      ok(figs >= 15 && near >= live.length * 0.6, 'the drawing moves with the breath: ' + figs + ' different drawings in ' + live.length + ' samples, ' + near + ' of them where the breath is');
      // where the hands are: above the head at the top of each breath in, down again at the end of each breath out
      const top = await E(p, () => {
        const X = window.__entrain, a = X.ASANA['qg-sky'];
        return { inEnd: X.qgPhase(a, 0, 'in', 1), outEnd: X.qgPhase(a, 0, 'out', 1), keys: a.keys.map(k => k.b || '').join(',') };
      });
      ok(Math.abs(top.inEnd - 0.4) < 1e-6 && top.outEnd === 0 && top.keys === 'in,,out,', 'each breath in ends with the hands up (the key where the breath out begins), and each breath out back at the start: ' + JSON.stringify(top));
      await p.screenshot({ path: OUT + 'movetest-e-sky.png' });
      // pause: the breath stops with it; carrying on picks it up
      await p.click('#sPlay'); await p.waitForTimeout(400);
      const paused = await E(p, () => ({ st: window.__entrain.P.state, b: window.__entrain.B.state, fig: document.querySelector('#sFig').innerHTML }));
      await p.waitForTimeout(800);
      const still = await E(p, () => document.querySelector('#sFig').innerHTML);
      await p.click('#sPlay'); await p.waitForTimeout(400);
      ok(paused.st === 'paused' && paused.b === 'paused' && still === paused.fig && await E(p, () => window.__entrain.B.state === 'running'), 'a pause holds the breath and the drawing; carrying on goes on');
      // the punch: from the ready stance, fists at the waist through the first breath in, then a punch on the breath out
      r = await jump(p, /^Punching with Fierce Eyes$/);
      await p.click('#sNext'); await p.waitForTimeout(400);
      const P1 = await E(p, async () => {
        const X = window.__entrain, a = X.ASANA['qg-punch'], ready = X.figSVG(a.ready, null, '', X.P.mv.box, 0), out = [];
        for (let i = 0; i < 40; i++) {
          await new Promise(res => setTimeout(res, 200));
          const F = X.frameState();
          out.push({ k: F.k, n: F.L ? F.L.count : -1, fig: document.querySelector('#sFig').innerHTML });
        }
        return { out, ready };
      });
      P1.out.forEach(x => { x.ready = alike(x.fig, P1.ready, 1.5); });
      const lead = P1.out.filter(x => x.k === 'lead'), in0 = P1.out.filter(x => x.k === 'in' && x.n === 0), out0 = P1.out.filter(x => x.k === 'out' && x.n === 0);
      ok(lead.length && lead.every(x => x.ready) && in0.length && in0.every(x => x.ready) && out0.length && out0.some(x => !x.ready),
        'the punch starts from its stance, fists at the waist, through the first breath in, and punches on the breath out');
      await E(p, () => { window.__entrain.P.t0 -= window.__entrain.P.total; }); await p.waitForTimeout(900);
      const D = await E(p, () => ({ h: document.querySelector('#sDone h2').textContent, nx: [...document.querySelectorAll('#sDone .sd-next a')].map(a => a.getAttribute('href')).join(), b: window.__entrain.B.state,
        hist: (JSON.parse(localStorage.getItem('entrain.history') || '[]').filter(e => e.id === 'qigong').pop() || {}).full }));
      ok(D.h === 'Let the stillness settle in you before you move on.' && D.nx === '#practice/dance' && D.b === 'idle' && D.hist === true, 'at the end: its line, Dance Break next, the breath guide handed back, and the history: ' + JSON.stringify(D));
      await p.context().close();
    }

    /* F. the qigong moves in the routine builder, unlocked: added, saved, run with the breath they're on */
    if (!only || only === 'F') {
      const p = await page(null, { unlock: true });
      await go(p, 'yoga', 400);
      await p.click('#ybCats [data-cat=qigong]'); await p.waitForTimeout(150);
      let B = await lib(p);
      ok(B.n === '9 moves' && B.tiles.every(x => !x.endsWith('+')), 'unlocked, the Qigong filter shows the nine with no cup');
      await p.click('#ybLib [data-add="qg-sky"]'); await p.waitForTimeout(150);
      await p.click('#ybLib [data-add="qg-bow"]'); await p.waitForTimeout(150);
      await p.click('#ybLib [data-add="qg-post"]'); await p.waitForTimeout(150);
      B = await lib(p);
      ok(B.seq.join() === 'Holding Up the Sky,Drawing the Bow,Standing Post' && await E(p, () => document.querySelector('#supModal').hidden), 'they add straight away: ' + B.seq.join(', '));
      await p.fill('#ybName', 'My brocades');
      await p.click('#ybGo'); await p.waitForTimeout(600);
      const pg = await intro(p);
      ok(pg.title === 'My brocades' && /^Start/.test(pg.go), 'saved, its page starts as any routine: ' + pg.go);
      await p.click('#sGo'); await p.waitForTimeout(500);
      let r = await jump(p, /^Holding Up the Sky$/);
      const subs = new Set();
      for (let i = 0; i < 24; i++) { await p.waitForTimeout(250); subs.add(await t(p, '#sSub')); }
      ok(r.k === 'pose' && r.vis === 'pose' && subs.has('Liang shou tuo tian · breathe in') && subs.has('Liang shou tuo tian · breathe out'),
        'in a routine it loops at ten seconds a breath, and says which breath it is on: ' + [...subs].join(' / '));
      await endNow(p); await p.waitForTimeout(300);
      await p.context().close();
      // locked on the test copy, then unlocked in the dialog: the move is added, and the cups go at once
      const q = await page(null, { copy: true });
      await go(q, 'yoga', 400);
      await q.click('#ybCats [data-cat=qigong]'); await q.waitForTimeout(150);
      const before = await lib(q);
      await q.click('#ybLib [data-add="qg-owl"]'); await q.waitForTimeout(300);
      const dev = await E(q, () => window.__entrain.supDevice());
      await q.fill('#supIn', sign(dev)); await q.click('#supGo');
      await until(q, () => window.__entrain.SUP.ok, 5000);
      await q.click('#supClose'); await q.waitForTimeout(400);
      B = await lib(q);
      ok(before.tiles.every(x => x.endsWith('+')) && B.seq.join() === 'The Wise Owl Looks Back' && B.tiles.every(x => !x.endsWith('+')),
        'added while locked and unlocked in the dialog, the move is in the routine and the cups are gone: ' + B.seq.join());
      await q.context().close();
    }

    /* G. Learn, the safety note, the health check's caution, search */
    if (!only || only === 'G') {
      const p = await page({ health: JSON.stringify({ at: 1, on: ['heart', 'pregnant'] }) });
      await go(p, 'learn', 400);
      const Lr = await E(p, () => {
        const el = document.getElementById('l-dance'), tx = el ? el.textContent.replace(/\s+/g, ' ').trim() : '';
        const ref = [...document.querySelectorAll('#references li')].map(l => l.textContent).find(x => /^Noetel/.test(x)) || '';
        const row = [...document.querySelectorAll('#lnGlance tr.ln-row')].find(r => /Dance, walking or jogging/.test(r.textContent));
        const moving = [...document.querySelectorAll('#sfNote .sf-list li')].find(l => /^Moving\./.test(l.textContent));
        return { tx, ref, links: el ? [...el.querySelectorAll('a')].map(a => a.getAttribute('href') + (a.nextElementSibling && a.nextElementSibling.classList.contains('sup-tag') ? '+' : '')) : [],
          row: row ? [...row.querySelectorAll('a')].map(a => a.getAttribute('href') + (a.nextElementSibling && a.nextElementSibling.classList.contains('sup-tag') ? '+' : '')).join() : '', ev: row ? row.children[1].textContent : '',
          moving: moving ? moving.textContent.replace(/\s+/g, ' ') : '', yoga: [...document.querySelectorAll('#science p')].map(x => x.textContent.replace(/\s+/g, ' ').trim()).find(x => /^Yoga and walking\./.test(x)) || '' };
      });
      ok(/^Dance and qigong\./.test(Lr.tx) && /g = −0\.96/.test(Lr.tx) && /−0\.62/.test(Lr.tx) && /−0\.55/.test(Lr.tx) && /−0\.42/.test(Lr.tx) && /\(Noetel et al\., 2024\)/.test(Lr.tx) &&
        /only five small trials with 107 people/.test(Lr.tx) && /Neither has been tested itself\./.test(Lr.tx) && Lr.links.join() === '#practice/dance+,#practice/qigong+',
        'Learn\'s Dance and qigong: the network meta-analysis\'s figures as the guide gives them, its caveat, both practices linked with the cup: ' + Lr.links.join());
      ok(/^Noetel, M\., Sanders, T\., Gallardo-Gómez, D\., et al\. \(2024\)\. Effect of exercise for depression: systematic review and network meta-analysis of randomised controlled trials\. BMJ, 384, e075847\./.test(Lr.ref) &&
        await E(p, () => document.querySelector('#references a[href="https://doi.org/10.1136/bmj-2023-075847"]') !== null), 'its reference, with its DOI');
      ok(Lr.row.startsWith('#practice/dance+,') && Lr.ev === 'Strong' && /65 poses and moves/.test(Lr.yoga) && /eight qigong movements/.test(Lr.yoga),
        'the glance table\'s movement row links Dance Break first, its evidence as the guide gives it; the movement library counts 65: ' + Lr.row);
      ok(/ask your doctor how hard to work/.test(Lr.moving), 'the safety note\'s Moving line adds brisk movement with a heart condition: ' + Lr.moving.slice(0, 60));
      await go(p, 'practice/dance');
      const pg = await intro(p);
      ok(/^From your health check\. Dancing and other brisk movement raise your heart rate/.test(pg.hc) && /a heart condition or pregnancy/.test(pg.hc) && /jumps and quick turns/.test(pg.hc),
        'with a heart condition and pregnancy ticked, Dance Break\'s page shows a caution written for them: ' + pg.hc.slice(0, 90));
      await go(p, 'practice/qigong');
      ok((await intro(p)).hc === '', 'the Eight Brocades carries none: its own caution covers the fold and the knees');
      await p.click('#tbFind'); await p.waitForTimeout(250);
      const h1 = await hits(p, 'baduanjin'), h2 = await hits(p, 'bouncing on the toes'), h3 = await hits(p, 'freestyle');
      ok(h1[0] === 'Eight Brocades>#practice/qigong +sup' && h2[0] === 'Bouncing on the Toes>#yoga/find/qg-bounce +sup' && h3[0] === 'Dance Break>#practice/dance +sup',
        'search: Baduanjin, a movement by name, and a dance part: ' + [h1[0], h2[0], h3[0]].join(' | '));
      await p.keyboard.press('Escape');
      await p.context().close();
    }

    /* H. a 360 px phone and reduced motion */
    if (!only || only === 'H') {
      const p = await page(null, { vp: { width: 360, height: 740 } });
      const wide = [];
      for (const h of ['practice/dance', 'practice/qigong', 'yoga']) {
        await go(p, h, 400);
        if (h === 'yoga') { await p.click('#ybCats [data-cat=qigong]'); await p.waitForTimeout(150); }
        const w = await E(p, () => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth, title: document.querySelector('#viewTitle').scrollWidth <= document.querySelector('#viewTitle').clientWidth + 1,
          go: document.querySelector('#sGo') ? document.querySelector('#sGo').getBoundingClientRect().bottom : 0, ih: innerHeight }));
        if (w.sw > w.cw || !w.title) wide.push(h + ' ' + w.sw);
        if (h !== 'yoga' && w.go > w.ih - 62) wide.push(h + ' Start below the fold ' + w.go);
      }
      ok(!wide.length, 'at 360 px: both pages and the Qigong moves fit, the names fit the top bar, and Start is in reach' + (wide.length ? ': ' + wide.join(', ') : ''));
      await p.screenshot({ path: OUT + 'movetest-h-360.png' });
      await p.context().close();
      // reduced motion: the dance ring keeps still, and a movement's drawing steps from breath to breath without gliding
      const q = await page({ 'pCh.dance': JSON.stringify({ mood: 'off' }), 'pCh.qigong': JSON.stringify({ pace: 'own', inh: 2, exh: 3 }) }, { unlock: true, rm: true });
      await go(q, 'practice/dance'); await q.click('#sGo');
      await until(q, () => window.__entrain.MUS.on, 4000); await q.waitForTimeout(600);
      const px = await E(q, async () => {
        const c = document.querySelector('#sCanvas'), x = c.getContext('2d'), sum = () => { const d = x.getImageData(0, 0, c.width, c.height).data; let s = 0; for (let i = 0; i < d.length; i += 97) s = (s * 31 + d[i]) % 1000000007; return s; };
        const a = sum(); await new Promise(r => setTimeout(r, 330)); const b = sum(); await new Promise(r => setTimeout(r, 270)); return [a, b, sum()];
      });
      ok(px[0] === px[1] && px[1] === px[2], 'with reduced motion the dance ring keeps still: ' + px.join(', '));
      await endNow(q); await q.waitForTimeout(300);
      await go(q, 'practice/qigong'); await q.click('#sGo'); await q.waitForTimeout(400);
      await jump(q, /^Holding Up the Sky$/); await q.click('#sNext'); await q.waitForTimeout(300);
      const R = await E(q, async () => {
        const X = window.__entrain, out = [];
        for (let i = 0; i < 40; i++) { await new Promise(r => setTimeout(r, 200)); const F = X.frameState(); out.push({ k: F.k + (F.L ? F.L.count : ''), fig: document.querySelector('#sFig').innerHTML }); }
        return out;
      });
      const byPhase = {}; R.forEach(x => { (byPhase[x.k] = byPhase[x.k] || new Set()).add(x.fig); });
      const keys = Object.keys(byPhase).filter(k => /^(in|out)\d/.test(k));
      ok(keys.length >= 3 && keys.every(k => byPhase[k].size === 1) && new Set(keys.map(k => [...byPhase[k]][0])).size >= 2,
        'with reduced motion a movement\'s drawing holds one pose through each breath, the pose that breath moves to: ' + keys.join(', '));
      await q.context().close();
    }
  } catch (e) { log.push('ERROR ' + (e && e.stack || e)); }
  await browser.close();
  console.log(log.join('\n'));
  console.log(log.filter(l => l.startsWith('PASS')).length + ' passed, ' + log.filter(l => /^(FAIL|PAGEERROR|ERROR|CONSOLE)/.test(l)).length + ' problems');
  process.exit(log.some(l => /^(FAIL|PAGEERROR|ERROR|CONSOLE)/.test(l)) ? 1 : 0);
})();
