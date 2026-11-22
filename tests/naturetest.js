// Nature: Fireside, Restoration Break and Walking Meditation in a park, from the brain-wave guide's fire, nature scenes and
// Attention Restoration Theory. Locked on the real build (the pages free to read, every way in asking for the donation, In a
// park opening the dialog), every plan at every length and choice, the fire with its crackle all the way through, the break's
// scene with its nature sound and a bare stage after one opening line, no quote at its end and a walk outside next, the park's
// guidance, the break offered after a block of work, the day routine's flowers, Learn and search, a small phone and reduced
// motion.
//   A  locked: the pages, Start and In a park asking for the donation, a park kept from before, the library, search, Settings
//   B  every plan at every length and choice: timings, lines, the fire, the scenes and their sounds; wording and spelling
//   C  Fireside running on an unlocked copy: the fire and its crackle, breathing with the flames, pause, the end and history
//   D  Restoration Break running: the scene and its sound, one line then a bare stage, no quote, outside next, I need to stop
//   E  Walking Meditation in a park: picked once unlocked, from the dialog too; its guidance and session
//   F  after a block of work: the Focus Primer's end, the Deep Work Block's end, the custom primer's working phase, the pages
//   G  Learn: the section, its references, the glance rows; Healthy living's day routine; search
//   H  a 360 px phone and reduced motion
// Run: node tests/naturetest.js [group letter]
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
const SOUND = { clouds: 'wind', water: 'stream', leaves: 'wind', forest: 'birds', fractal: 'wind', flowers: 'birds', fire: 'fire' };

(async () => {
  const browser = await chromium.launch();
  const log = []; const ok = (c, m) => log.push((c ? 'PASS ' : 'FAIL ') + m);
  const UNLOCKED = testApp();
  // a phone (412 × 915 unless vp says), debug on, the headphone check done, the options open; st: stored values;
  // o.unlock: the test copy, unlocked; o.copy: the test copy, locked; o.rm: reduced motion; o.spy: frames and blurred shadows
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
      blurb: tx(q('.si-blurb')), steps: [...document.querySelectorAll('#sIntro .si-steps li')].map(tx).join(' | '), ev: tx(q('.si-ev .ev-body')),
      dots: q('.si-ev summary .strength') ? q('.si-ev summary .strength').querySelectorAll('i.on').length : 0, needs: [...document.querySelectorAll('#sIntro .si-need li')].map(tx).join(' | '),
      lens: [...document.querySelectorAll('#sIntro .si-len button')].map(tx).join(' '), scn: !!document.querySelector('#sOptScn'), mus: !!document.querySelector('#sOptMus'),
      choices: [...document.querySelectorAll('#sOpts [data-choice]')].map(g => g.dataset.choice + ':' + [...g.querySelectorAll('button')].map(b => b.dataset.v + (b.querySelector('.sup-tag') ? '+' : '') + (b.getAttribute('aria-pressed') === 'true' ? '*' : '')).join('/')).join(' '),
      cnote: [...document.querySelectorAll('#sOpts .so-row')].filter(r => r.querySelector('[data-choice]')).map(r => tx(r.querySelector('.so-l small'))) };
  });
  const run = p => E(p, () => {
    const X = window.__entrain, s = X.P.steps[X.P.idx] || {}, q = x => document.querySelector(x);
    return { step: s.title, k: s.k, idx: X.P.idx, state: X.P.state, cap: q('#sCap').textContent, line: q('#sLine').textContent, vis: q('#sStage').dataset.vis, bare: q('#ses').dataset.bare || '',
      amb: X.AMB.playing, capVis: getComputedStyle(q('.ses-cap')).visibility, stepVis: getComputedStyle(q('#sStepTxt')).visibility, ctl: getComputedStyle(q('.ses-ctl')).visibility };
  });
  const clock = (p, sec) => E(p, sec => { window.__entrain.P.t0 = performance.now() / 1000 - sec; }, sec);
  // a practice's plan for a length and choices, read without the page
  const plan = (p, id, len, ch) => E(p, ([id, len, ch]) => {
    const X = window.__entrain;
    if (ch) localStorage.setItem('entrain.pCh.' + id, JSON.stringify(ch)); else localStorage.removeItem('entrain.pCh.' + id);
    const pl = X.pPlan(X.pDef(id), len);
    return { total: pl.total, steps: pl.steps.map(s => ({ title: s.title, k: s.k, secs: s.secs, at: s.at, t: s.t || null, vis: s.vis || '', scene: s.scene || '', amb: s.amb, bare: s.bare || 0,
      quiet: !!s.quiet, lines: s.lines.map(l => l[1]), at0: s.lines.map(l => l[0]) })) };
  }, [id, len, ch || null]);
  const titles = x => x.steps.map(s => s.title).join(' | ');
  const hits = async (p, q) => { await p.fill('#fdIn', q); await p.waitForTimeout(500); return E(p, () => [...document.querySelectorAll('.fd-it')].map(a => a.querySelector('b').textContent + '>' + a.getAttribute('href') + (a.querySelector('.sup-tag') ? ' +sup' : ''))); };

  try {
    /* A. locked on the real build: the pages free to read, Start and In a park asking for the donation, the badges */
    if (!only || only === 'A') {
      const p = await page();
      await go(p, 'practice/fireside');
      let pg = await intro(p);
      ok(pg.title === 'Fireside' && pg.kind === 'Calm · Relaxation · 20 min' && pg.lens === '20 min 30 min 45 min' && pg.go === 'Unlock to start' && /donation of €1 or more/.test(pg.note) &&
        pg.steps === 'By the fire00:45 | Slow breaths03:00 | Just the fire15:15 | Back to the room01:00' && pg.dots === 2 && /^A fire to watch, with its crackle, best in the evening/.test(pg.blurb),
        'Fireside: its page reads in full while locked, 20, 30 or 45 minutes under Calm, two dots, and Start says to unlock it: ' + pg.kind + ' · ' + pg.go);
      ok(/226 adults/.test(pg.ev) && /same fire with the sound off had no consistent effect/.test(pg.ev) && /up to 15 minutes/.test(pg.ev) && /haven't been tested themselves/.test(pg.ev) && /Lynn 2014/.test(pg.ev) &&
        /^Sound on the crackle is part of it: the same fire on mute didn't relax people/.test(pg.needs) && !pg.scn && !pg.mus && pg.choices === 'start:breath*/fire',
        'its evidence as the guide gives it (226 adults, the crackle essential, longer sessions untested), sound on, no Scene or Music rows of its own: ' + pg.needs.slice(0, 60));
      await p.click('#sGo'); await p.waitForTimeout(300);
      ok(await E(p, () => !document.querySelector('#supModal').hidden && document.querySelector('#supFor').textContent === 'Fireside is one of the new techniques.' && window.__entrain.P.state !== 'running'),
        'Start opens the donation dialog naming Fireside, and nothing starts');
      await p.click('#supClose'); await p.waitForTimeout(200);
      await go(p, 'practice/restoration');
      pg = await intro(p);
      ok(pg.title === 'Restoration Break' && pg.kind === 'Recover · Relaxation · 5 min' && pg.lens === '3 min 5 min 10 min' && pg.go === 'Unlock to start' && pg.dots === 2 &&
        pg.choices === 'scene:mine*/clouds/water/leaves/forest/fractal/flowers/fire snd:scene*/yours' && !pg.scn && !pg.mus,
        'Restoration Break: 3, 5 or 10 minutes under Recover, the scene (Yours first) and its sound to choose, Start says to unlock it: ' + pg.choices);
      ok(/Berman and colleagues' 2008 study/.test(pg.ev) && /ten other pooled analyses showed no marked benefit/.test(pg.ev) && /Leaving out words and tasks follows the theory/.test(pg.ev) && /moderate evidence/.test(pg.ev),
        'its evidence: moderate, Berman 2008, the reviews\' mixed results, and the wordless break as following the theory rather than tested');
      await p.click('#sGo'); await p.waitForTimeout(300);
      ok(await E(p, () => !document.querySelector('#supModal').hidden && document.querySelector('#supFor').textContent === 'Restoration Break is one of the new techniques.' && window.__entrain.P.state !== 'running'),
        'its Start opens the dialog too');
      await p.click('#supClose'); await p.waitForTimeout(200);
      // Walking Meditation: free, with In a park carrying the cup and opening the dialog
      await go(p, 'practice/walking');
      pg = await intro(p);
      ok(pg.go === 'Start 10 min' && pg.choices === 'where:path*/park+' && /^A quiet path of ten to twenty steps/.test(pg.cnote[0]) &&
        pg.steps === 'Stand still01:00 | Slow steps03:00 | Whole body03:00 | Surroundings02:00 | Closing01:00',
        'Walking Meditation stays free, as it was, with In a park beside A quiet path carrying the cup: ' + pg.choices);
      await p.click('#sOpts [data-choice="where"] button[data-v="park"]'); await p.waitForTimeout(300);
      const W1 = await E(p, () => ({ dlg: !document.querySelector('#supModal').hidden, name: document.querySelector('#supFor').textContent, kept: localStorage.getItem('entrain.pCh.walking'),
        on: document.querySelector('#sOpts [data-choice="where"] [aria-pressed="true"]').dataset.v }));
      ok(W1.dlg && W1.name === 'Walking Meditation in a park is one of the new techniques.' && !W1.kept && W1.on === 'path', 'In a park opens the dialog naming it, and keeps nothing: ' + JSON.stringify(W1));
      await p.click('#supClose'); await p.waitForTimeout(200);
      // a park kept from before (a backup from an unlocked phone) reads as a quiet path here
      await E(p, () => localStorage.setItem('entrain.pCh.walking', JSON.stringify({ where: 'park' })));
      await go(p, 'practice'); await go(p, 'practice/walking');
      pg = await intro(p);
      ok(pg.choices === 'where:path*/park+' && /Surroundings/.test(pg.steps) && !/What catches your eye/.test(pg.steps), 'a park kept from before reads as a quiet path while the device is locked: ' + pg.steps);
      await p.click('#sGo'); await p.waitForTimeout(500);
      const W2 = await run(p);
      ok(W2.state === 'running' && W2.step === 'Stand still' && await E(p, () => document.querySelector('#supModal').hidden && /^Find a quiet path/.test(document.querySelector('#sLine').textContent)),
        'and it starts as ever, on the quiet path, with no dialog: ' + W2.step);
      await p.click('#sEnd'); await p.click('#sEnd'); await p.waitForTimeout(300);
      // the library, Today's goal and search
      await go(p, 'practice', 500);
      const L = await E(p, () => {
        const row = h => { const a = document.querySelector('#prLib .pr-grp a.pc-a[href="' + h + '"]'); if (!a) return null; const li = a.closest('li'); return { g: a.closest('.pr-grp').dataset.g, sup: !!li.querySelector('.sup-tag'), sub: li.querySelector('.pc-sub').textContent }; };
        const X = window.__entrain, item = id => X.libAll().find(x => x.href === '#practice/' + id) || {};
        return { f: row('#practice/fireside'), r: row('#practice/restoration'), w: row('#practice/walking'), fi: item('fireside'), ri: item('restoration') };
      });
      ok(L.f && L.f.g === 'calm' && L.f.sup && L.r && L.r.g === 'recover' && L.r.sup && L.w && !L.w.sup && L.fi.also.join() === 'sleep' && L.ri.also.join() === 'focus' &&
        L.fi.posture.join() === 'sit,lie' && L.ri.posture.join() === 'sit' && !L.fi.needs.length && !L.ri.needs.length,
        'the library: Fireside under Calm (good for sleep), Restoration Break under Recover (good for focus), each with the Donation badge, needing just the phone; Walking Meditation unbadged: ' + JSON.stringify([L.f, L.r]));
      await p.click('#tbFind'); await p.waitForTimeout(250);
      const h1 = await hits(p, 'fireside'), h2 = await hits(p, 'restoration break'), h3 = await hits(p, 'park'), h4 = await hits(p, 'screen breaks');
      ok(h1[0] === 'Fireside>#practice/fireside +sup' && h2[0] === 'Restoration Break>#practice/restoration +sup' && h3[0] === 'Walking Meditation>#practice/walking',
        'search finds Fireside and the break with the badge, and Walking Meditation first for a park: ' + [h1[0], h2[0], h3[0]].join(' | '));
      ok(h4[0] === 'Through the day>#living/daytime', 'screen breaks still finds the day routine first: ' + h4[0]);
      await p.keyboard.press('Escape');
      await go(p, 'settings', 500);
      const list = await E(p, () => [...document.querySelectorAll('#supList a')].map(a => a.textContent + '>' + a.getAttribute('href')));
      ok(list.includes('Fireside>#practice/fireside') && list.includes('Restoration Break>#practice/restoration') && list.includes('Walking Meditation in a park>#practice/walking'),
        'Settings\' New techniques lists Fireside, Restoration Break and Walking Meditation in a park');
      await p.screenshot({ path: OUT + 'naturetest-a-locked.png' });
      await p.context().close();
    }

    /* B. every plan at every length and choice: timings, lines, the fire, the scenes and their sounds; wording and spelling */
    if (!only || only === 'B') {
      const p = await page(null, { unlock: true });          // unlocked, so In a park's plans are swept too
      const S = await E(p, ({ NOT, SPELL }) => {
        const X = window.__entrain, rn = new RegExp(NOT, 'i'), rs = new RegExp(SPELL, 'i'), bad = [], spell = [], n = { plans: 0, lines: 0 };
        ['fireside', 'restoration', 'walking'].forEach(id => {
          const d = X.pDef(id);
          let combos = [{}];
          (d.choices || []).forEach(c => { const m = []; combos.forEach(o => c.opts.forEach(v => m.push(Object.assign({}, o, { [c.key]: v[0] })))); combos = m; });
          const texts = [d.name, d.blurb, d.how, d.ev, d.parts || '', d.end || ''].concat(...(d.needs || []).map(x => [x[1], x[2]]));
          (d.choices || []).forEach(c => texts.push(c.label, ...c.opts.map(o => o[1])));
          combos.forEach(ch => {
            localStorage.setItem('entrain.pCh.' + id, JSON.stringify(ch));
            (d.choices || []).forEach(c => texts.push(typeof c.note === 'function' ? c.note(d) : c.note || ''));
            (d.lengths || [0]).forEach(L => {
              const pl = X.pPlan(d, L); n.plans++;
              if (pl.total !== (L || 10) * 60) bad.push(id + ' ' + L + ' ' + JSON.stringify(ch) + ': total ' + pl.total);
              [d.blurb, d.end].forEach(x => { if (x && rn.test(x)) bad.push(id + ': ' + x); });
              pl.steps.forEach(s => {
                texts.push(s.title);
                if (rn.test(s.title)) bad.push(id + ' title: ' + s.title);
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
        return { bad, spell, n };
      }, { NOT: NOT.source, SPELL: SPELL.source });
      ok(S.n.plans === 6 + 48 + 2 && S.n.lines > 120 && !S.bad.length, 'every plan at every length and choice (' + S.n.plans + ' plans, ' + S.n.lines + ' lines) adds up to its length, its lines inside their steps, in order, and worded as what to do' + (S.bad.length ? ': ' + S.bad.slice(0, 3).join(' | ') : ''));
      ok(!S.spell.length, 'British spelling in all of it' + (S.spell.length ? ': ' + S.spell.slice(0, 3).join(' | ') : ''));
      // Fireside: the fire all the way, slow breaths first unless Just the fire, a quiet word about every six minutes
      const f20 = await plan(p, 'fireside', 20), f45 = await plan(p, 'fireside', 45, { start: 'fire' });
      ok(titles(f20) === 'By the fire | Slow breaths | Just the fire | Back to the room' && f20.steps.every(s => s.scene === 'fire' && (s.k === 'breath' || s.vis === 'scene')) &&
        JSON.stringify(f20.steps[1].t) === JSON.stringify({ inh: 4, sip: 0, hold: 0, exh: 6, rest: 0 }) && f20.steps[1].secs === 180 && f20.steps[2].quiet,
        'Fireside: the fire in every step, the slow breaths 4 in and 6 out for three minutes moving the flames, then just the fire, quietly: ' + titles(f20));
      ok(titles(f45) === 'By the fire | Just the fire | Back to the room' && f45.steps[1].secs === 2700 - 105 && f45.steps[1].lines.length === 8 &&
        f45.steps[1].at0.slice(1).every((a, i, x) => (i ? a - x[i - 1] : a) >= 300 && (i ? a - x[i - 1] : a) <= 420) && /^Let your breathing settle at its own pace/.test(f45.steps[1].lines[0]),
        'Just the fire leaves out the breathing; in 45 minutes, a quiet word about every six minutes: ' + f45.steps[1].at0.join(','));
      ok(f20.steps[2].lines.length === 3 && /^Now let the breath go at its own pace/.test(f20.steps[2].lines[0]), 'after the breaths, the breath goes back to its own pace: ' + f20.steps[2].lines[0]);
      // Restoration Break: one step, one line, bare after ten seconds, the scene's own sound
      const R = await E(p, () => {
        const X = window.__entrain, d = X.pDef('restoration'), out = {};
        ['clouds', 'water', 'leaves', 'forest', 'fractal', 'flowers', 'fire'].forEach(sc => {
          localStorage.setItem('entrain.pCh.restoration', JSON.stringify({ scene: sc }));
          const s = X.pPlan(d, 5).steps; out[sc] = s.length + ':' + s[0].title + ':' + s[0].scene + ':' + s[0].amb + ':' + s[0].vis + ':' + s[0].bare + ':' + s[0].lines.length + ':' + s[0].lines[0][0] + ':' + !!s[0].nobell;
        });
        localStorage.setItem('entrain.pCh.restoration', JSON.stringify({ scene: 'water', snd: 'yours' }));
        out.yours = X.pPlan(d, 3).steps[0].amb;
        localStorage.removeItem('entrain.pCh.restoration');
        out.mine = X.pPlan(d, 10).steps[0].scene; out.pick = X.scnPick();
        out.line = X.pPlan(d, 10).steps[0].lines[0][1];
        return out;
      });
      const want = sc => R[sc].split(':')[2] === sc && R[sc].split(':')[3] === SOUND[sc] && R[sc].startsWith('1:') && R[sc].endsWith(':scene:10:1:0:true');
      ok(Object.keys(SOUND).every(want), 'Restoration Break: one step of its scene, one line at the start, bare after ten seconds, with the sound that suits it: ' + Object.keys(SOUND).map(k => R[k].split(':').slice(1, 4).join('/')).join(', '));
      ok(R.yours === '' && R.mine === R.pick && R.line === 'Let your eyes rest on the scene and wander wherever they like, for the rest of the break.',
        'Your background leaves the scene\'s sound out; Yours is today\'s pick from your restful scenes; its one line: ' + R.line);
      await E(p, () => localStorage.setItem('entrain.scenes', 'water'));
      await p.reload(); await p.waitForTimeout(500);
      const R2 = await E(p, () => { const X = window.__entrain; return { s: X.pPlan(X.pDef('restoration'), 5).steps[0].scene, mine: X.scnMine().join() }; });
      ok(R2.mine !== 'water' || R2.s === 'water', 'with only the water picked as restful in Settings, Yours is the water: ' + JSON.stringify(R2));
      // Walking Meditation in a park: its own guidance
      const W = await plan(p, 'walking', 0, { where: 'park' }), Wp = await plan(p, 'walking', 0, { where: 'path' });
      const all = [].concat(...W.steps.map(s => s.lines)).join(' ');
      ok(W.total === 600 && titles(W) === 'Stand still | Slow steps | Whole body | What catches your eye | Closing' && /^Find a path in a park/.test(W.steps[0].lines[0]) &&
        /clouds drifting, leaves moving in the breeze, birds, water/.test(all) && /birdsong, the wind in the trees, running water/.test(all) && !/turn slowly/.test(all),
        'in a park: ten minutes, the path in the park, then what catches your eye: clouds, leaves, birds and water, and their sounds: ' + titles(W));
      ok(titles(Wp) === 'Stand still | Slow steps | Whole body | Surroundings | Closing' && /^Find a quiet path of ten to twenty steps/.test(Wp.steps[0].lines[0]), 'the quiet path keeps its guidance as it was');
      await p.context().close();
    }

    /* C. Fireside on an unlocked copy: the fire and its crackle the whole way, breathing with the flames, pause, the end */
    if (!only || only === 'C') {
      const p = await page({ amb: 'off', ambAdd: '' }, { unlock: true, spy: true });
      await go(p, 'practice/fireside');
      ok((await intro(p)).go === 'Start 20 min', 'unlocked, Start reads Start 20 min');
      await p.click('#sGo'); await p.waitForTimeout(500);
      let r = await run(p);
      const crackle = await until(p, () => window.__entrain.AMB.playing === 'fire', 8000);
      ok(r.state === 'running' && r.step === 'By the fire' && r.vis === 'scene' && await E(p, () => window.__entrain.scnOf(window.__entrain.P.steps[0])) === 'fire' && crackle,
        'Fireside starts by the fire, and its crackle plays with it though the background sound is off: ' + JSON.stringify({ step: r.step, vis: r.vis, amb: await E(p, () => window.__entrain.AMB.playing) }));
      await E(p, () => { window.__cl = 0; }); await p.waitForTimeout(2000);
      const fps = await E(p, () => window.__cl / 2);
      ok(fps >= 20 && fps <= 32 && await E(p, () => window.__blur === 0), 'the fire is drawn about 30 times a second, with no blurred shadows: ' + fps);
      await clock(p, 50); await p.waitForTimeout(600);
      r = await run(p);
      const B1 = await E(p, () => ({ v: window.__entrain.BC.visual, sc: window.__entrain.BC.scene, amb: window.__entrain.AMB.playing }));
      ok(r.step === 'Slow breaths' && r.vis === 'breath' && B1.v === 'scene' && B1.sc === 'fire' && B1.amb === 'fire', 'the slow breaths move the flames (the fire scene follows the breath), the crackle still on: ' + JSON.stringify(B1));
      await clock(p, 300); await p.waitForTimeout(600);
      r = await run(p);
      ok(r.step === 'Just the fire' && r.vis === 'scene' && r.amb === 'fire' && r.bare === '' && r.capVis === 'visible', 'then just the fire, with its crackle, its caption kept: ' + r.step);
      await p.click('#sPlay'); await p.waitForTimeout(300);
      ok(await until(p, () => window.__entrain.AMB.playing === null, 4000), 'a pause silences the crackle');
      await p.click('#sPlay');
      ok(await until(p, () => window.__entrain.AMB.playing === 'fire', 6000), 'and carrying on brings it back');
      await E(p, () => { window.__entrain.P.t0 -= window.__entrain.P.total; }); await p.waitForTimeout(900);
      const D = await E(p, () => ({ h: document.querySelector('#sDone h2').textContent, q: !!document.querySelector('#sDone .sd-quote'), nx: [...document.querySelectorAll('#sDone .sd-next a')].map(a => a.getAttribute('href')).join(),
        hist: window.__entrain.hLoad().filter(e => e.id === 'fireside').map(e => e.full + ':' + e.secs) }));
      ok(D.h === 'Take the warmth of the fire with you into your evening.' && D.q && D.nx === '#practice/sleep-descent' && D.hist.join() === 'true:1200',
        'at the end: its line, a quote as usual, Sleep Descent for bed, and the history: ' + JSON.stringify(D));
      ok(await until(p, () => window.__entrain.AMB.playing === null, 4000), 'and the crackle ends with it');
      await p.context().close();
    }

    /* D. Restoration Break: the scene and its sound, one line then a bare stage, no quote, outside next, I need to stop */
    if (!only || only === 'D') {
      const p = await page({ amb: 'off', ambAdd: '', pOpt: OPT({ voice: true }), 'pCh.restoration': JSON.stringify({ scene: 'water' }) }, { unlock: true, spy: true });
      await go(p, 'practice/restoration');
      let pg = await intro(p);
      ok(pg.steps === 'Rippling water05:00' && /^The nature sound that suits the scene: today, a stream\./.test(pg.cnote[1]) && /^Rippling water, every time\.$/.test(pg.cnote[0]),
        'the water picked: its step and the stream that suits it: ' + pg.cnote.join(' / '));
      await p.click('#sGo'); await p.waitForTimeout(600);
      let r = await run(p);
      const snd = await until(p, () => window.__entrain.AMB.playing === 'stream', 8000);
      ok(r.state === 'running' && r.vis === 'scene' && r.bare === '' && r.capVis === 'visible' && /^Let your eyes rest on the scene/.test(r.line) && snd,
        'it starts with the water, the stream playing with the background off, and the one line shown: ' + r.line);
      ok(await E(p, () => window.__said.filter(x => /^Let your eyes rest/.test(x)).length === 1), 'and said, once');
      await clock(p, 11); await p.waitForTimeout(500);
      r = await run(p);
      ok(r.bare === '1' && r.capVis === 'hidden' && r.stepVis === 'hidden' && r.ctl === 'visible' && r.vis === 'scene', 'after ten seconds the stage keeps the scene alone: no step name or caption, the controls still there: ' + JSON.stringify({ bare: r.bare, cap: r.capVis, ctl: r.ctl }));
      await p.screenshot({ path: OUT + 'naturetest-d-bare.png' });
      await clock(p, 280); await p.waitForTimeout(500);
      ok(await E(p, () => window.__said.length === 1), 'nothing more is said through the break');
      await E(p, () => { window.__entrain.P.t0 -= window.__entrain.P.total; }); await p.waitForTimeout(900);
      const D = await E(p, () => ({ h: document.querySelector('#sDone h2').textContent, q: !!document.querySelector('#sDone .sd-quote'), nx: [...document.querySelectorAll('#sDone .sd-next')].map(n => n.querySelector('a').getAttribute('href') + ' ' + n.querySelector('p').textContent).join(),
        bare: document.querySelector('#ses').dataset.bare, donate: !!document.querySelector('#sDone .sd-donate') }));
      ok(D.h === 'Break over. If you can, take the next one outside.' && !D.q && /^#practice\/walking Outside is better still/.test(D.nx) && /Walking Meditation has a version for a park/.test(D.nx) && D.bare === '' && D.donate,
        'its end: take the next one outside, Walking Meditation in a park next, and no quote to read: ' + D.nx.slice(0, 60));
      ok(await until(p, () => window.__entrain.AMB.playing === null, 4000), 'the stream ends with it');
      // Your background with the water: quiet; with the fire, its crackle all the same; I need to stop
      await E(p, () => localStorage.setItem('entrain.pCh.restoration', JSON.stringify({ scene: 'water', snd: 'yours' })));
      await go(p, 'practice'); await go(p, 'practice/restoration'); await p.click('#sGo'); await p.waitForTimeout(2000);
      ok(await E(p, () => window.__entrain.AMB.playing === null && window.__entrain.P.state === 'running'), 'Your background, with the background off: the water plays quietly');
      await p.click('#sEnd'); await p.click('#sEnd'); await p.waitForTimeout(300);
      await E(p, () => localStorage.setItem('entrain.pCh.restoration', JSON.stringify({ scene: 'fire', snd: 'yours' })));
      await go(p, 'practice'); await go(p, 'practice/restoration');
      pg = await intro(p);
      ok(/The fire always comes with its crackle\.$/.test(pg.cnote[1]), 'with the fire, the note says its crackle always comes with it');
      await p.click('#sGo');
      ok(await until(p, () => window.__entrain.AMB.playing === 'fire', 8000), 'and it does, with Your background chosen');
      await p.click('#sOut'); await p.waitForTimeout(1200);
      ok(await E(p, () => window.__entrain.AMB.playing === null && window.__entrain.P.state !== 'running' && document.querySelector('#ses').dataset.bare === ''), 'I need to stop ends it and silences the crackle');
      await p.context().close();
    }

    /* E. Walking Meditation in a park: picked once unlocked, from the dialog too; its guidance in a session */
    if (!only || only === 'E') {
      const p = await page(null, { unlock: true });
      await go(p, 'practice/walking');
      ok((await intro(p)).choices === 'where:path*/park', 'unlocked, In a park carries no cup');
      await p.click('#sOpts [data-choice="where"] button[data-v="park"]'); await p.waitForTimeout(300);
      let pg = await intro(p);
      ok(pg.choices === 'where:path/park*' && /What catches your eye03:00/.test(pg.steps) && /^In a park, or anywhere with trees, water or open sky/.test(pg.cnote[0]) &&
        await E(p, () => document.querySelector('#supModal').hidden && JSON.parse(localStorage.getItem('entrain.pCh.walking')).where === 'park'),
        'In a park is picked at once, kept, and its steps and note follow: ' + pg.steps);
      await p.click('#sGo'); await p.waitForTimeout(500);
      ok(/^Find a path in a park/.test(await t(p, '#sLine')), 'its session begins in the park: ' + await t(p, '#sLine'));
      await clock(p, 365); await p.waitForTimeout(500);
      const r = await run(p);
      ok(r.step === 'What catches your eye' && /clouds drifting, leaves moving in the breeze, birds, water/.test(r.line), 'and turns to what catches your eye: ' + r.line);
      await p.click('#sEnd'); await p.click('#sEnd'); await p.waitForTimeout(300);
      await p.context().close();
      // locked on the test copy, then unlocked in the dialog: the park is picked
      const q = await page(null, { copy: true });
      await go(q, 'practice/walking');
      await q.click('#sOpts [data-choice="where"] button[data-v="park"]'); await q.waitForTimeout(300);
      const dev = await E(q, () => window.__entrain.supDevice());
      await q.fill('#supIn', sign(dev)); await q.click('#supGo');
      await until(q, () => window.__entrain.SUP.ok, 5000);
      await q.click('#supClose'); await q.waitForTimeout(400);
      pg = await intro(q);
      ok(pg.choices === 'where:path/park*' && /What catches your eye/.test(pg.steps) && await E(q, () => JSON.parse(localStorage.getItem('entrain.pCh.walking') || '{}').where === 'park'),
        'picked while locked and unlocked in the dialog, the park is chosen and its cup gone: ' + pg.choices);
      await q.context().close();
    }

    /* F. after a block of work: the Focus Primer's end, the Deep Work Block's end, the custom primer's working phase, the pages */
    if (!only || only === 'F') {
      const p = await page();
      await go(p, 'practice/focus-primer');
      await E(p, () => { const X = window.__entrain; X.P.def = X.pDef('focus-primer'); X.P.steps = X.pPlan(X.P.def, 13).steps; X.pDone({ secs: 780, early: false, hrPts: [] }, false); });
      const nx = await E(p, () => [...document.querySelectorAll('#sDone .sd-next')].map(n => ({ href: n.querySelector('a').getAttribute('href'), cup: !!n.querySelector('.sup-tag'), txt: n.querySelector('p').textContent })));
      ok(nx.length === 1 && nx[0].href === '#practice/restoration' && nx[0].cup && /^When your block of work is done, give your focus a few minutes to recover/.test(nx[0].txt),
        'the Focus Primer\'s end suggests a Restoration Break for after the work, with the Donation badge while locked: ' + nx[0].txt.slice(0, 50));
      // the Deep Work Block's page, then its end
      await go(p, 'track/deep-work', 500);
      const tp = await E(p, () => { const a = document.querySelector('#trBody .nt-after a'); return a ? { href: a.getAttribute('href'), cup: !!(a.nextElementSibling && a.nextElementSibling.classList.contains('sup-tag')), txt: a.closest('p').textContent } : null; });
      ok(tp && tp.href === '#practice/restoration' && tp.cup && /^After the block\./.test(tp.txt), 'the Deep Work Block\'s page says a Restoration Break fits after it, with the cup while locked: ' + (tp && tp.txt.slice(0, 40)));
      await go(p, 'track/vigilance-16', 400);
      ok(await E(p, () => !document.querySelector('#trBody .nt-after')), 'other tracks say nothing of it');
      await go(p, 'track/deep-work', 400);
      await p.click('#trGo'); await p.waitForTimeout(500);
      await p.click('#toggle'); await p.waitForTimeout(300);           // paused, then on again just before the end
      await E(p, () => { window.__entrain.A.elapsed = 50 * 60 - 1; });
      await p.click('#toggle');
      const toast = await until(p, () => !document.querySelector('#toast').hidden && /^Block done\./.test(document.querySelector('#toastTxt').textContent), 9000);
      const T1 = await E(p, () => ({ txt: document.querySelector('#toastTxt').textContent, act: document.querySelector('#toastAct').textContent, hidden: document.querySelector('#toastAct').hidden }));
      ok(toast && T1.act === 'Restoration Break' && !T1.hidden, 'when the Deep Work Block ends, a notice offers a Restoration Break: ' + T1.txt);
      await p.click('#toastAct'); await p.waitForTimeout(500);
      ok(await E(p, () => location.hash === '#practice/restoration' && document.querySelector('#viewTitle').textContent === 'Restoration Break'), 'and leads to its page');
      await p.waitForTimeout(3500);
      // the custom primer: its page, then its working phase ended by you
      await go(p, 'prime', 400);
      const pp = await E(p, () => { const a = document.querySelector('#primeAfter a'); return a ? { href: a.getAttribute('href'), cup: !!(a.nextElementSibling && a.nextElementSibling.classList.contains('sup-tag')), txt: a.closest('p').textContent } : null; });
      ok(pp && pp.href === '#practice/restoration' && pp.cup && /^After the work\./.test(pp.txt), 'the custom primer\'s page says so too: ' + (pp && pp.txt.slice(0, 40)));
      await p.click('#pfChips label:has(input[value="10|300"])'); await p.click('#plChips label:has(input[value="5"])'); await p.click('#ptChips label:has(input[value="continue"])');
      await p.click('#primeStart'); await p.waitForTimeout(500);
      await p.click('#toggle'); await p.waitForTimeout(300);
      await E(p, () => { window.__entrain.A.elapsed = 5 * 60 - 1; });
      await p.click('#toggle');
      ok(await until(p, () => window.__entrain.A.phase === 'task', 6000), 'the prime ends and the working phase begins');
      await E(p, () => { const x = document.querySelector('#toast'); x.hidden = true; x.classList.remove('show'); });
      await p.click('#stop'); await p.waitForTimeout(400);
      const T2 = await E(p, () => ({ shown: !document.querySelector('#toast').hidden, txt: document.querySelector('#toastTxt').textContent, act: document.querySelector('#toastAct').textContent }));
      ok(T2.shown && /^Block done\./.test(T2.txt) && T2.act === 'Restoration Break', 'ending the working phase offers the break too: ' + T2.txt);
      // stopped during the prime itself: no offer
      await E(p, () => { const x = document.querySelector('#toast'); x.hidden = true; x.classList.remove('show'); });
      await p.click('#primeStart'); await p.waitForTimeout(600); await p.click('#stop'); await p.waitForTimeout(400);
      ok(await E(p, () => document.querySelector('#toast').hidden || !/^Block done\./.test(document.querySelector('#toastTxt').textContent)), 'stopping during the prime itself offers nothing');
      await p.context().close();
      // unlocked: the cups go
      const q = await page(null, { unlock: true });
      await go(q, 'track/deep-work', 500);
      const u1 = await E(q, () => !!document.querySelector('#trBody .nt-after .sup-tag'));
      await go(q, 'prime', 400);
      const u2 = await E(q, () => !!document.querySelector('#primeAfter .sup-tag'));
      ok(!u1 && !u2, 'unlocked, those links carry no cup');
      await q.context().close();
    }

    /* G. Learn: the section, its references, the glance rows; Healthy living's day routine; search */
    if (!only || only === 'G') {
      const p = await page();
      await go(p, 'l-restore', 600);
      const L = await E(p, () => {
        const h = document.getElementById('l-restore'), ps = []; let e = h.nextElementSibling;
        while (e && e.tagName === 'P') { ps.push(e); e = e.nextElementSibling; }
        const tx = e => e.textContent.replace(/\s+/g, ' ').trim();
        const row = n => { const r = [...document.querySelectorAll('#lnGlance tr.ln-row')].find(x => x.querySelector('th b').textContent === n); return { lo: r.children[2].classList.contains('ln-lo'), a: [...r.children[2].querySelectorAll('a')].map(a => a.getAttribute('href') + (a.nextElementSibling && a.nextElementSibling.classList.contains('sup-tag') ? '+cup' : '')).join(' '), ev: r.children[1].textContent }; };
        const ref = k => { const r = [...document.querySelectorAll('#references li')].find(l => l.textContent.startsWith(k)); return r ? (r.querySelector('a[href^="https://"]') ? 1 : 0) : -1; };
        return { title: h.textContent, toc: !!document.querySelector('.toc a[href="#l-restore"]'), ps: ps.map(tx), links: [].concat(...ps.map(p => [...p.querySelectorAll('a')].map(a => a.getAttribute('href') + (a.nextElementSibling && a.nextElementSibling.classList.contains('sup-tag') ? '+cup' : '')))),
          view: !document.querySelector('#v-learn').hidden, dlg: document.querySelector('#supModal').hidden,
          refs: ['Kaplan, R., & Kaplan, S. (1989)', 'Ulrich, R. S., Simons', 'Berman, M. G., Jonides, J., & Kaplan, S. (2008)', 'Ohly, H., White', 'Stevenson, M. P., Schilhab', 'Joye, Y., & Dewitte, S. (2018)'].map(ref).join(''),
          rows: ['Nature scenes, restoration breaks', 'A fireplace, with its sound', 'Fresh flowers'].map(row) };
      });
      const all = L.ps.join(' ');
      ok(L.view && L.dlg && L.title === 'Nature breaks: rest for tired attention' && L.toc && L.ps.length === 4, 'Learn has a section on nature breaks, in the contents, free to read: ' + L.title);
      ok(/\(Kaplan & Kaplan, 1989\)/.test(all) && /soft fascination: clouds drifting, leaves moving, birds, running water, a fire/.test(all) && /\(Kaplan, 1995\)/.test(all) && /\(Ulrich et al\., 1991\)/.test(all),
        'the theory: directed attention tires, soft fascination lets it rest, the four qualities, and Stress Recovery Theory beside it');
      ok(/38 students/.test(all) && /about 50\s+minutes/.test(all) && /one and a half more digits backwards/.test(all) && /wasn't a reliable change/.test(all) && /12 people looked at photographs for about ten minutes/.test(all) && /\(Berman et al\., 2008\)/.test(all),
        'Berman and colleagues\' walks in an arboretum and a city, and the photographs, with the numbers as the paper gives them');
      ok(/across 31 studies/.test(all) && /three measures/.test(all) && /other ten of its pooled\s+analyses showed no marked benefit/.test(all) && /\(Ohly et al\., 2016\)/.test(all) && /\(Stevenson et al\., 2018\)/.test(all) &&
        /\(Joye & Dewitte, 2018\)/.test(all) && /moderate evidence/.test(all) && /remain open questions/.test(all),
        'the reviews: three measures helped and ten not, working memory and flexibility, the critique, and the guide\'s moderate rating');
      ok(['#practice/restoration+cup', '#st-scenes', '#practice/focus-primer', '#track/deep-work', '#practice/walking', '#practice/fireside+cup', '#living/daytime'].every(h => L.links.includes(h)) &&
        /no one\s+watched for more than 15 minutes \(Lynn, 2014\)/.test(all) && /\(Ikei et al\., 2014\)/.test(all) && /plausible, following the theory, rather than tested/.test(all),
        'and what Entrain does with it, linked, the new techniques with the cup: ' + L.links.join(' '));
      ok(L.refs === '011111', 'its six new references, each with a link but the 1989 book: ' + L.refs);
      ok(L.rows.every(r => !r.lo && /#st-scenes/.test(r.a)) && /#practice\/restoration\+cup/.test(L.rows[0].a) && /#practice\/walking/.test(L.rows[0].a) && /#practice\/fireside\+cup/.test(L.rows[1].a) &&
        L.rows[1].a.includes('#l-nature') && /#living\/daytime/.test(L.rows[2].a) && L.rows[0].ev === 'Moderate' && L.rows[1].ev === 'Moderate' && L.rows[2].ev === 'Early',
        'the glance table: nature scenes and breaks lead to the break and a walk in a park, the fireplace to Fireside, flowers to the day routine, their evidence unchanged: ' + JSON.stringify(L.rows.map(r => r.a)));
      await p.screenshot({ path: OUT + 'naturetest-g-learn.png' });
      // Healthy living's day routine
      await go(p, 'living/daytime', 700);
      const R = await E(p, () => {
        const sec = document.querySelector('#lv-daytime'), tx = e => e.textContent.replace(/\s+/g, ' ').trim(), li = [...sec.querySelectorAll('.lv-rsteps > li')];
        const step = n => li.find(l => l.querySelector('b').textContent === n);
        const fl = step('Fresh flowers on your desk'), sb = step('Short breaks from screens'), wk = step('Daylight and a walk');
        return { steps: li.map(l => l.querySelector('b').textContent).join(' | '), fl: fl ? tx(fl.querySelector('p')) : '', walk: wk ? tx(wk.querySelector('p')) : '',
          sb: sb ? [...sb.querySelectorAll('.lv-chip')].map(a => a.getAttribute('href') + (a.querySelector('.sup-tag') ? '+cup' : '')).join(' ') : '',
          refs: [...sec.querySelectorAll('.lv-refl li')].map(tx).filter(x => /^(Berman|Ikei)/.test(x)).length, links: [...sec.querySelectorAll('.lv-refl a')].every(a => /^https:\/\//.test(a.getAttribute('href'))) };
      });
      ok(R.steps === 'Short breaks from screens | When thinking goes round in circles | Lunch away from the screen | Daylight and a walk | Air the room | Fresh flowers on your desk' &&
        /^If you like flowers, keep a few fresh ones where you work\./.test(R.fl) && /214 people/.test(R.fl) && /The evidence is early: mostly one research group, and real flowers only/.test(R.fl),
        'the day routine has fresh flowers on your desk, with the evidence as early, real flowers only: ' + R.fl.slice(0, 60));
      ok(/In a park or among trees, it can rest your attention too/.test(R.walk) && R.sb === '#breathe/sigh #practice/calm-reset #practice/restoration+cup' && R.refs === 3 && R.links,
        'a walk among trees, the break among the short breaks (with the cup while locked), and the three sources linked: ' + R.sb);
      // search finds the section
      await p.click('#tbFind'); await p.waitForTimeout(250);
      const h = await hits(p, 'attention restoration');
      ok(h.some(x => /^Nature breaks: rest for tired attention>#l-restore$/.test(x)) && h.some(x => x === 'Restoration Break>#practice/restoration +sup'), 'search finds Learn\'s section and the break: ' + h.slice(0, 4).join(' | '));
      await p.keyboard.press('Escape');
      await p.context().close();
      // unlocked: no cups in Learn or the routine
      const q = await page(null, { unlock: true });
      await go(q, 'l-restore', 500);
      const c1 = await E(q, () => document.querySelectorAll('#l-restore ~ p .sup-tag').length);
      await go(q, 'living/daytime', 600);
      const c2 = await E(q, () => document.querySelectorAll('#lv-daytime .sup-tag').length);
      ok(c1 === 0 && c2 === 0, 'unlocked, no cups in the section or the routine');
      await q.context().close();
    }

    /* H. a 360 px phone and reduced motion */
    if (!only || only === 'H') {
      const p = await page(null, { vp: { width: 360, height: 740 } });
      const bad = [];
      for (const h of ['practice/fireside', 'practice/restoration', 'practice/walking', 'track/deep-work', 'prime', 'living/daytime', 'l-restore']) {
        await go(p, h, 450);
        const m = await E(p, () => ({ w: document.documentElement.scrollWidth, c: document.documentElement.clientWidth, tw: document.querySelector('#viewTitle').scrollWidth, tc: document.querySelector('#viewTitle').clientWidth }));
        if (m.w > m.c || (/fireside|restoration/.test(h) && m.tw > m.tc + 1)) bad.push(h + ' ' + JSON.stringify(m));
      }
      ok(!bad.length, 'at 360 px nothing is wider than the screen, and the new practices\' names fit the top bar' + (bad.length ? ': ' + bad.join(' | ') : ''));
      const go44 = await E(p, () => { location.hash = 'practice/restoration'; return new Promise(r => setTimeout(() => { const b = document.querySelector('#sGo').getBoundingClientRect(), c = document.querySelector('#sOpts [data-choice="scene"] button').getBoundingClientRect(); r([b.height, c.height, b.bottom <= innerHeight]); }, 400)); });
      ok(go44[0] >= 44 && go44[1] >= 24, 'Start is a full-size button and the scene buttons easy to tap: ' + go44.join(', '));
      await p.context().close();
      // reduced motion: the scene stands still
      const q = await page({ 'pCh.restoration': JSON.stringify({ scene: 'leaves' }) }, { unlock: true, rm: true, vp: { width: 360, height: 740 } });
      await go(q, 'practice/restoration'); await q.click('#sGo'); await q.waitForTimeout(1500);
      const a = await E(q, () => document.querySelector('#sCanvas').toDataURL());
      await q.waitForTimeout(1500);
      const b = await E(q, () => document.querySelector('#sCanvas').toDataURL());
      ok(a === b && a.length > 2000, 'with reduced motion the break\'s scene stays still');
      await q.screenshot({ path: OUT + 'naturetest-h-break.png' });
      await q.click('#sEnd'); await q.click('#sEnd'); await q.waitForTimeout(300);
      await go(q, 'practice/fireside'); await q.click('#sGo'); await q.waitForTimeout(1200);
      const c = await E(q, () => document.querySelector('#sCanvas').toDataURL());
      await q.waitForTimeout(1200);
      const d = await E(q, () => document.querySelector('#sCanvas').toDataURL());
      ok(c === d && c.length > 2000, 'and so does the fire');
      await q.screenshot({ path: OUT + 'naturetest-h-fire.png' });
      await q.context().close();
    }
  } catch (e) { log.push('ERROR ' + (e && e.stack || e)); }
  await browser.close();
  console.log(log.join('\n'));
  console.log(log.filter(l => l.startsWith('PASS')).length + ' passed, ' + log.filter(l => /^(FAIL|PAGEERROR|ERROR|CONSOLE)/.test(l)).length + ' problems');
  process.exit(log.some(l => /^(FAIL|PAGEERROR|ERROR|CONSOLE)/.test(l)) ? 1 : 0);
})();
