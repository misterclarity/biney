// The voice practices: Om Chanting, Laughter Break, Let It Out and Sing Together. Locked on the real build (their pages
// free to read, every way in asking for the donation), their plans at every length and choice, then each one running on
// an unlocked copy: the drone, the clapping and word ticks, the songs' count-in, tune, words and rounds, the mood ratings,
// pausing, skipping and I need to stop; the health check's caution, Learn and search, and the screens at 360 px.
// Run: node tests/voicetest.js [group letter]
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
const IDS = ['om', 'laughter', 'let-it-out', 'sing'];
const NAMES = { om: 'Om Chanting', laughter: 'Laughter Break', 'let-it-out': 'Let It Out', sing: 'Sing Together' };
const LOCKED_GO = 'Unlock to start';

(async () => {
  const browser = await chromium.launch();
  const log = []; const ok = (c, m) => log.push((c ? 'PASS ' : 'FAIL ') + m);
  const UNLOCKED = testApp();
  // a phone (412 × 915 unless vp says), debug on, the headphone check done; st: stored values; o.unlock: the test copy,
  // unlocked; o.rm: reduced motion; o.spy: every tone that starts, every tick's time, canvas frames and blurs
  const page = async (st, o) => {
    o = o || {};
    const ctx = await browser.newContext({ userAgent: S20, viewport: o.vp || { width: 412, height: 915 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true,
      reducedMotion: o.rm ? 'reduce' : 'no-preference' });
    const p = await ctx.newPage();
    p.on('pageerror', e => log.push('PAGEERROR ' + e.message));
    p.on('console', m => { if (m.type() === 'error') log.push('CONSOLE ' + m.text()); });
    await p.addInitScript(s => {
      if (!sessionStorage.getItem('z.seeded')) {
        sessionStorage.setItem('z.seeded', '1');
        localStorage.setItem('entrain.debug', '1'); localStorage.setItem('entrain.stereo', 'ok');
        for (const k in s) localStorage.setItem('entrain.' + k, s[k]);
      }
      if (window.speechSynthesis) { speechSynthesis.speak = () => {}; speechSynthesis.cancel = () => {}; }
    }, Object.assign({ pOpt: OPT() }, st || {}));
    if (o.spy) await p.addInitScript(() => {
      window.__osc = []; window.__tick = []; window.__cl = 0; window.__blur = 0; window.__ring = [];
      const os = OscillatorNode.prototype.start;
      OscillatorNode.prototype.start = function (w) { try { window.__osc.push({ f: Math.round(this.frequency.value * 100) / 100, type: this.type, at: w || this.context.currentTime }); } catch (e) {} return os.apply(this, arguments); };
      const sv = AudioParam.prototype.setValueAtTime;
      AudioParam.prototype.setValueAtTime = function (v, w) { if (v === 1250) window.__tick.push(w); return sv.apply(this, arguments); };   // the tick (pClick) starts at 1250 Hz
      const cr = CanvasRenderingContext2D.prototype.clearRect;
      CanvasRenderingContext2D.prototype.clearRect = function () { if (this.canvas.id === 'sCanvas') window.__cl++; return cr.apply(this, arguments); };
      const arc = CanvasRenderingContext2D.prototype.arc;
      CanvasRenderingContext2D.prototype.arc = function (x, y, r) { if (this.canvas.id === 'sCanvas') window.__ring.push(Math.round(r * 100) / 100); return arc.apply(this, arguments); };
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
  const jump = async (p, re) => { for (let i = 0; i < 40; i++) { const r = await run(p); if (re.test(r.step)) return r; await p.click('#sNext'); await p.waitForTimeout(140); } return run(p); };
  // the practice clock set to sec seconds into the session (it's running)
  const clock = (p, sec) => E(p, sec => { window.__entrain.P.t0 = performance.now() / 1000 - sec; }, sec);
  const plan = (p, id, len, ch) => E(p, ([id, len, ch]) => {
    const X = window.__entrain;
    if (ch) localStorage.setItem('entrain.pCh.' + id, JSON.stringify(ch)); else localStorage.removeItem('entrain.pCh.' + id);
    const pl = X.pPlan(X.pDef(id), len);
    return { total: pl.total, steps: pl.steps.map(s => ({ title: s.title, k: s.k, secs: s.secs, at: s.at, t: s.t, drone: !!s.drone, metro: s.metro || 0, metroAt: s.metroAt || 0, pat: s.metroPat || '',
      labels: s.labels || null, lines: s.lines.map(l => l[1]), ends: s.ends || null, song: s.song || '', mode: s.mode || '', reps: s.reps || 0, parts: s.parts || 0, tune: !!s.tune, who: s.who || '', bpm: s.bpm || 0 })) };
  }, [id, len, ch || null]);
  const endNow = p => E(p, () => { const b = document.querySelector('#sEnd'); b.click(); b.click(); });

  try {
    /* A. locked on the real build: each page free to read, Start asking for the donation, the badge everywhere they're listed */
    if (!only || only === 'A') {
      const p = await page();
      const kinds = { om: 'Calm · Breathing · 10 min', laughter: 'Energy · Movement · 10 min', 'let-it-out': 'Energy · Breathing · 5 min', sing: 'Energy · Programme · 10 min' };
      for (const id of IDS) {
        await go(p, 'practice/' + id);
        const pg = await E(p, () => { const q = s => document.querySelector('#sIntro ' + s), tx = e => e ? e.textContent.replace(/\s+/g, ' ').trim() : '';
          return { title: document.querySelector('#viewTitle').textContent, kind: tx(q('.si-kind')), go: tx(q('#sGo')), note: q('#sSupNote').hidden ? '' : tx(q('#sSupNote')), steps: document.querySelectorAll('#sIntro .si-steps li').length,
            ev: tx(q('.si-ev .ev-body')), dots: q('.si-ev summary') ? q('.si-ev summary').innerHTML.length : 0, how: tx(q('.si-main > p')), caution: tx(q('.si-caution')) }; });
        ok(pg.title === NAMES[id] && pg.kind === kinds[id] && pg.go === LOCKED_GO && /^One of the new techniques/.test(pg.note) && pg.steps >= 4 && pg.ev.length > 200 && pg.how.length > 200,
          NAMES[id] + ': its page reads in full (' + pg.kind + ', ' + pg.steps + ' steps, the evidence), and Start reads ' + pg.go);
        await p.click('#sGo'); await p.waitForTimeout(250);
        const dl = await E(p, () => ({ open: !document.querySelector('#supModal').hidden, for: document.querySelector('#supFor').textContent, st: window.__entrain.P.state }));
        ok(dl.open && dl.for === NAMES[id] + ' is one of the new techniques.' && dl.st !== 'running', NAMES[id] + ': Start opens the donation dialog, naming it, and nothing starts');
        await p.click('#supClose'); await p.waitForTimeout(150);
      }
      // the evidence as the guide gives it: early for Om (one dot), moderate for the other three (two)
      const st = await E(p, ids => ids.map(id => window.__entrain.pDef(id).strength + (window.__entrain.pDef(id).exp ? 'x' : '')), IDS);
      ok(st.join() === '1,2,2,2', 'evidence: Om chanting early (1 dot), laughter, vocal release and group singing moderate (2): ' + st.join());
      // the library: under their goals, each with the badge
      await go(p, 'practice');
      const lib = await E(p, ids => ids.map(id => { const a = document.querySelector('#prLib a[href="#practice/' + id + '"]'); return a ? a.closest('.pr-grp').dataset.g + (a.querySelector('.pc-meta .sup-tag') ? '+sup' : '') : 'none'; }), IDS);
      ok(lib.join() === 'calm+sup,energy+sup,energy+sup,energy+sup', 'the library lists them, Om under Calm and the others under Energy, each with the Donation badge: ' + lib.join());
      const tax = await E(p, ids => ids.map(id => { const d = window.__entrain.pDef(id); return d.goal + '/' + d.method + '/' + d.posture.join(' ') + '/' + (d.also || []).join(' '); }), IDS);
      ok(tax.join(' | ') === 'calm/breath/sit/ | energy/move/stand sit/calm | energy/breath/stand sit/calm | energy/program/stand sit/reflect', 'goals, methods, postures and "also good for": ' + tax.join(' | '));
      // search finds them, badged
      await p.click('#tbFind'); await p.waitForTimeout(150);
      const finds = [];
      for (const [w, id] of [['laughter yoga', 'laughter'], ['fouch', 'let-it-out'], ['om chanting', 'om'], ['frere jacques', 'sing'], ['shout', 'let-it-out']]) {
        await p.fill('#fdIn', w); await p.waitForTimeout(250);
        finds.push(await E(p, ([w, id]) => { const a = document.querySelector('#fdRes a.fd-it[href="#practice/' + id + '"]'); return w + (a ? (a.querySelector('.sup-tag') ? ': found +sup' : ': found') : ': missing'); }, [w, id]));
      }
      ok(finds.every(f => /found \+sup$/.test(f)), 'search finds them, with the badge: ' + finds.join(', '));
      await p.keyboard.press('Escape'); await p.waitForTimeout(150);
      // Settings lists them among what the donation unlocks
      await go(p, 'st-supporter', 450);
      const list = await E(p, () => [...document.querySelectorAll('#supList a')].map(a => a.textContent + '>' + a.getAttribute('href')));
      ok(IDS.every(id => list.includes(NAMES[id] + '>#practice/' + id)), 'Settings, New techniques, lists all four: ' + list.join(', '));
      // Learn: the glance table's voice rows lead to them, with the cup
      await go(p, 'learn', 400);
      const gl = await E(p, () => [...document.querySelectorAll('#lnGlance tr.ln-row')].filter(r => /laughter|vocal release|singing|Om chanting|animal/i.test(r.querySelector('th b').textContent))
        .map(r => r.querySelector('th b').textContent + ' > ' + [...r.children[2].querySelectorAll('a')].map(a => a.getAttribute('href') + (a.nextElementSibling && a.nextElementSibling.classList.contains('sup-tag') ? '+cup' : '')).join(' ')));
      ok(gl.join(' | ') === 'Simulated laughter > #practice/laughter+cup | Shouting, vocal release > #practice/let-it-out+cup | Group singing > #practice/sing+cup | Om chanting > #practice/om+cup | Imitating animal sounds > #practice/let-it-out+cup',
        'Techniques at a glance: the five voice rows lead to the practices, each with the cup: ' + gl.join(' | '));
      // the end screens' suggestions: Sports Performance before lifting leads to Let It Out, badged; Let It Out after stress to Calm Reset
      const sd = async (id, ch) => E(p, ([id, ch]) => {
        const X = window.__entrain;
        localStorage.setItem('entrain.pCh.' + id, JSON.stringify(ch));
        X.P.view = X.P.def = X.pDef(id); X.P.chain = null; X.P.steps = X.pPlan(X.P.def, 5).steps; X.pDone({ secs: 300, early: false, hrPts: [] }, false);
        const a = document.querySelector('#sDone .sd-next a'); return a ? a.textContent + '>' + a.getAttribute('href') : '';
      }, [id, ch]);
      await go(p, 'practice/sport');
      const n1 = await sd('sport', { sport: 'weights', when: 'before' }), n2 = await sd('sport', { sport: 'weights', when: 'both' }), n3 = await sd('sport', { sport: 'running', when: 'before' });
      const n4 = await sd('let-it-out', { when: 'after' }), n5 = await sd('let-it-out', { when: 'before' }), n6 = await sd('om', {});
      ok(n1 === 'Let It OutDonation>#practice/let-it-out' && n2 === 'Exercise Recovery>#practice/recovery' && n3 === 'Exercise Recovery>#practice/recovery',
        'Sports Performance before weight training suggests Let It Out (badged); otherwise Exercise Recovery: ' + [n1, n2, n3].join(', '));
      ok(n4 === 'Calm Reset>#practice/calm-reset' && n5 === '' && n6 === 'Bhramari>#practice/bhramari', 'Let It Out after stress suggests Calm Reset, before a workout nothing; Om Chanting suggests Bhramari: ' + [n4, n5, n6].join(', '));
      // a small phone: nothing wider than the screen, the name fits the top bar, Start in reach
      await p.setViewportSize({ width: 360, height: 740 });
      const fit = [];
      for (const id of IDS) {
        await go(p, 'practice/' + id, 300);
        fit.push(await E(p, id => { const b = document.querySelector('#sGo').getBoundingClientRect(), h = document.querySelector('#viewTitle');
          return id + (document.documentElement.scrollWidth > document.documentElement.clientWidth ? ' wide' : '') + (h.scrollWidth > h.clientWidth + 1 ? ' title' : '') + (b.bottom > innerHeight - 62 || b.top < 0 ? ' start' : ''); }, id));
      }
      ok(fit.every(f => !/ /.test(f)), 'at 360 px each page fits, its name fits the top bar and Start is in reach: ' + fit.join(', '));
      await p.screenshot({ path: OUT + 'voicetest-a-sing-locked.png' });
      await p.context().close();
    }

    /* B. the plans: every length and choice adds up, says what to do, in British spelling; each practice's own shape */
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
              s.lines.forEach((l, i) => { if (!(l[0] >= 0 && l[0] < s.secs) || (i && l[0] <= s.lines[i - 1][0])) bad.push(id + ' ' + s.title + ' line at ' + l[0]); if (not.test(l[1])) bad.push(id + ' says: ' + l[1]); texts.push(l[1]); });
              [s.title, s.hint, s.prompt, s.sub].concat(Object.values(s.hints || {}), Object.values(s.labels || {})).forEach(x => { if (x && not.test(x)) bad.push(id + ' says: ' + x); if (x) texts.push(x); });
            });
          }
          localStorage.removeItem('entrain.pCh.' + id);
          texts.forEach(x => { if (x && spell.test(x)) bad.push(id + ' spells: ' + x.match(spell)[0]); });
          out[id] = n;
        });
        return { bad, out };
      }, [IDS, NOT.source, SPELL.source]);
      ok(!sweep.bad.length && sweep.out.sing === 216, 'every plan at every length and choice (' + Object.keys(sweep.out).map(k => k + ' ' + sweep.out[k]).join(', ') + ') lasts exactly its length, every line inside its step and in order, worded as what to do, in British spelling' + (sweep.bad.length ? ': ' + sweep.bad.slice(0, 6).join(' | ') : ''));

      // Om Chanting: aloud, softer, in your mind, silence; whole breaths of 4 s in and the chosen breath out; the drone while you chant aloud
      let pl = await plan(p, 'om', 10);
      const titles = x => x.steps.map(s => s.title).join(' | ');
      const br = pl.steps.filter(s => s.k === 'breath'), cyc = 14;
      ok(titles(pl) === 'How to chant | Om, aloud | Om, softer | Om in your mind | Silence' && br.every(s => s.t.inh === 4 && s.t.exh === 10 && !s.t.hold) &&
        (br[0].secs - 3) % cyc === 0 && br.slice(1).every(s => s.secs % cyc === 0) && br[0].labels.out === 'Aaa-uuu-mmm' && br[2].labels.out === 'Om, silently',
        '10 minutes: ' + titles(pl) + '; four seconds in, ten out, in whole breaths, so each part begins on a breath in');
      ok(pl.steps.map(s => s.drone ? 'd' : '-').join('') === 'ddd--', 'the drone plays while you learn and chant aloud and softer, and fades for the silent part');
      pl = await plan(p, 'om', 5, { breath: '15', drone: 'off' });
      ok(titles(pl) === 'How to chant | Om, aloud | Om in your mind | Silence' && pl.steps.filter(s => s.k === 'breath').every(s => s.t.exh === 15) && pl.steps.every(s => !s.drone),
        '5 minutes, a 15-second chant and no drone: ' + titles(pl));
      // Laughter Break
      pl = await plan(p, 'laughter', 10);
      const L = pl.steps, rate = L.filter(s => s.k === 'rate'), clap = L.find(s => s.title === 'Clap and chant'), bouts = L.filter(s => /laughter|giggle/i.test(s.title));
      ok(rate.length === 2 && rate[0].title === "How's your mood?" && rate[0].ends.join(' / ') === 'Very low / As good as it gets' && L.indexOf(rate[1]) === L.length - 2,
        'Laughter Break: your mood from 0 (very low) to 10 (as good as it gets) first and near the end');
      ok(clap && clap.metro === 200 && clap.pat === 'x.x.xxx.' && clap.metroAt === 6 && bouts.length === 6 && L.filter(s => s.title === 'Breathe').length === 5 && L.find(s => s.title === 'Slow breaths'),
        'a clapping warm-up on a ho, ho, ha ha ha tick, six bouts of laughter with slow breaths between, and slow breathing to finish: ' + bouts.map(b => b.title).join(', '));
      const pg = await plan(p, 'laughter', 5, { who: 'group', mood: 'off' });
      ok(pg.steps.filter(s => s.k === 'rate').length === 0 && pg.steps.filter(s => /laughter|giggle/i.test(s.title)).length === 3 && /each other/.test(pg.steps[1].lines.join(' ') + pg.steps[0].lines.join(' ')),
        'five minutes with others and no mood check: three bouts, laughing with each other');
      const ld = await E(p, () => { const d = window.__entrain.pDef('laughter'); return { rate: d.rate.what, caution: d.caution, hc: d.hc.join() }; });
      ok(ld.rate === 'mood' && /breathless/.test(ld.caution) && /heart rate/.test(ld.caution) && /dry your mouth/.test(ld.caution) && /hernia/.test(ld.caution) && /recent surgery/.test(ld.caution) &&
        /high blood pressure that isn't under control/.test(ld.caution) && /late in pregnancy/.test(ld.caution) && /dizzy, stop/.test(ld.caution) && ld.hc === 'strain',
        'its caution, as the guide gives it: breathlessness, a raised heart rate, a dry mouth; skip it with a hernia, recent surgery, uncontrolled high blood pressure or late pregnancy; stop if dizzy');
      // Let It Out
      const lio = {};
      for (const snd of ['ow', 'shout', 'word', 'made', 'roar']) lio[snd] = await plan(p, 'let-it-out', 5, { sound: snd });
      const rounds = x => x.steps.filter(s => s.title !== 'Get set' && s.title !== 'Long breaths out' && s.title !== 'Ready' && s.title !== 'Settle');
      ok(['ow', 'shout', 'word', 'made'].every(k => rounds(lio[k]).length === 4 && rounds(lio[k]).every(s => s.k === 'guide' && s.metro === 20 && s.metroAt === 5)) &&
        lio.made.steps.filter(s => /Fouch|Twizpipe/.test(s.title)).map(s => s.title).join() === 'Fouch,Twizpipe,Fouch,Twizpipe' && /steady and clear/.test(rounds(lio.word)[0].lines[0]),
        'Let It Out: four rounds, a word every three seconds on a tick, steady and clear; the made-up words in turn: ' + rounds(lio.made).map(s => s.title).join(', '));
      ok(rounds(lio.roar).map(s => s.title + ':' + s.k + ':' + s.labels.out).join(', ') === "Lion's breath:breath:Haaa, Wolf howl:breath:Aaa-ooo, Owl hoots:breath:Hoo, hoo-hoo, Lion's breath:breath:Haaa" &&
        lio.roar.steps.filter(s => s.title === 'Long breaths out').every(s => s.t.exh === 8),
        'Roar it out: a lion\'s breath, a wolf howl and owl hoots on paced, forceful breaths out, each round followed by long breaths out');
      const pa = await plan(p, 'let-it-out', 3, { when: 'after', sound: 'ow' });
      ok(rounds(pa).length === 3 && pa.steps[pa.steps.length - 1].title === 'Settle' && lio.ow.steps[lio.ow.steps.length - 1].title === 'Ready', 'three minutes: three rounds; after a stressful moment it ends settling, before a workout ready');
      const ln = await E(p, () => { const d = window.__entrain.pDef('let-it-out'), c = d.choices.find(c => c.key === 'sound'), o = {};
        ['roar', 'made'].forEach(k => { localStorage.setItem('entrain.pCh.let-it-out', JSON.stringify({ sound: k })); o[k] = c.note(d); });
        localStorage.removeItem('entrain.pCh.let-it-out'); return { roar: o.roar, made: o.made, caution: d.caution }; });
      ok(/^Playful and untested/.test(ln.roar) && /Nobody has studied animal sounds/.test(ln.roar) && /left pain tolerance where it was/.test(ln.made) && /people around you/.test(ln.caution) && /your voice/i.test(ln.caution),
        'Roar it out says it\'s playful and untested, the made-up words what the study found, and the caution covers your voice and the people nearby');
      // Sing Together: warm-ups, then each song listened to, sung together and as a round; the parts, the tune and the drone as chosen
      pl = await plan(p, 'sing', 10);
      const sing = pl.steps.filter(s => s.k === 'sing');
      ok(/^Gather \| Humming warm-up \| Vowels \| Frère Jacques: listen \| Frère Jacques, together \| Frère Jacques, a round \| Row Your Boat: listen \| Row Your Boat, together \| Row Your Boat, a round/.test(titles(pl)) &&
        pl.steps[pl.steps.length - 1].title === 'Afterwards' && pl.steps[1].drone && sing.every(s => s.tune && s.drone && s.who === 'group') &&
        sing.filter(s => s.mode === 'round').every(s => s.parts === 2 && s.reps >= 2),
        '10 minutes: ' + titles(pl));
      pl = await plan(p, 'sing', 15, { who: 'group', parts: '4', song: 'row', guide: 'words', tempo: 'slow' });
      const s4 = pl.steps.filter(s => s.k === 'sing');
      ok(!s4.some(s => s.mode === 'listen') && s4.every(s => !s.tune && !s.drone) && s4.filter(s => s.mode === 'round').every(s => s.parts === 4 && s.song === 'row') && s4.every(s => s.bpm === (s.song === 'row' ? 131 : 72)),
        '15 minutes, four parts, Row Your Boat, the words alone, slower: no listening step, no tune or drone, rounds in four parts at 131 quavers a minute: ' + titles(pl).slice(0, 140) + '…');
      pl = await plan(p, 'sing', 10, { who: 'solo', guide: 'words' });
      const so = pl.steps.filter(s => s.mode === 'round');
      ok(so.every(s => s.parts === 2 && s.who === 'solo' && s.tune) && pl.steps.filter(s => s.mode === 'unison').every(s => !s.tune), 'on your own with the words alone, the phone still sings its part of each round');
      // the tune itself: Frère Jacques in D, the count-in, one voice at a time in a round, from the first part's first note to the last part's last
      const ev = await E(p, () => {
        const X = window.__entrain;
        localStorage.removeItem('entrain.pCh.sing');
        const st = X.pPlan(X.pDef('sing'), 10).steps, uni = st.find(s => s.mode === 'unison' && s.song === 'frere'), rnd = st.find(s => s.mode === 'round' && s.song === 'frere');
        const e1 = X.vxEvents(uni), clicks = e1.filter(e => e.c), notes = e1.filter(e => !e.c);
        const e2 = X.vxEvents(rnd).filter(e => !e.c), bl = 60 / rnd.bpm, S = X.VX_SONGS.frere;
        let overlap = 0;
        for (let i = 1; i < e2.length; i++) if (e2[i].t < e2[i - 1].t + e2[i - 1].d - 1e-6) overlap++;
        const last = e2[e2.length - 1], end = rnd.lead + 4 * bl + (8 + rnd.reps * 32) * bl;
        return { clicks: clicks.length, gap: +(clicks[1].t - clicks[0].t).toFixed(3), bl: +(60 / uni.bpm).toFixed(3), first: notes.slice(0, 8).map(n => n.m).join(), n: notes.length,
          start: +(notes[0].t - clicks[3].t).toFixed(3), keys: [...new Set(notes.concat(e2).map(n => n.m))].sort().join(), overlap, lastEnd: +(last.t + last.d).toFixed(2), end: +end.toFixed(2), reps: rnd.reps,
          secs: rnd.secs, words: S.ph.map(ph => ph.map(n => n[2]).join(' ')).join(' / ') };
      });
      ok(ev.clicks === 4 && ev.gap === ev.bl && ev.start === ev.bl && ev.first === '62,64,66,62,62,64,66,62' && ev.n === 2 * 32,
        'Frère Jacques together: a count-in of four beats, then D, E, F♯, D… twice through (' + ev.n + ' notes)');
      ok(ev.keys === '57,62,64,66,67,69,71' && !ev.overlap && Math.abs(ev.lastEnd - ev.end) < 0.01 && ev.secs >= ev.end,
        'as a round, the tune is one voice at a time, in D major, leading the first part and then the part still singing, until the last part\'s last note at ' + ev.end + ' s');
      ok(ev.words === 'Are you sleep- ing, are you sleep- ing, / Bro- ther John? Bro- ther John? / Mor- ning bells are ring- ing, mor- ning bells are ring- ing: / ding, dang, dong. Ding, dang, dong.',
        'its words, a syllable to each note');
      await p.context().close();
    }

    /* C. running, on an unlocked copy: Om's drone, the laughter's claps and moods, Let It Out's ticks, the songs */
    if (!only || only === 'C') {
      let p = await page({ 'pCh.om': JSON.stringify({ breath: '8' }) }, { unlock: true, spy: true });
      await go(p, 'practice/om');
      ok(/^Start 10 min$/.test(await t(p, '#sGo')), 'unlocked: Om Chanting\'s Start reads ' + await t(p, '#sGo'));
      await p.click('#sGo'); await p.waitForTimeout(700);
      let r = await run(p);
      const dr = await E(p, () => ({ on: !!window.__entrain.VX.dr, f: window.__osc.filter(o => o.type === 'triangle').map(o => o.f) }));
      ok(r.state === 'running' && r.step === 'How to chant' && dr.on && [73.42, 146.83, 220].every(f => dr.f.includes(f)), 'it starts, and the drone plays: D2, D3 and A3 (' + r.step + ')');
      r = await jump(p, /aloud/);
      await p.waitForTimeout(4200);
      r = await run(p);
      ok(r.k === 'breath' && /^(Aaa-uuu-mmm|Breathe in)$/.test(r.cap) && /chant on the long breath out/.test(r.line), 'chanting aloud, paced: ' + r.cap + ' / ' + r.sub);
      await p.click('#sPlay'); await p.waitForTimeout(250);
      const paused = await E(p, () => !!window.__entrain.VX.dr);
      await p.click('#sPlay'); await p.waitForTimeout(450);
      const back = await E(p, () => !!window.__entrain.VX.dr);
      ok(!paused && back, 'pausing silences the drone, carrying on brings it back');
      r = await jump(p, /in your mind/); await p.waitForTimeout(400);
      ok(!(await E(p, () => !!window.__entrain.VX.dr)) && r.step === 'Om in your mind', 'in your mind: the drone fades');
      await clock(p, await E(p, () => window.__entrain.P.total - 0.5)); await p.waitForTimeout(900);     // to the end of the silence
      const fin = await E(p, () => ({ st: window.__entrain.P.state, h: document.querySelector('#sDone h2') ? document.querySelector('#sDone h2').textContent : '', dr: !!window.__entrain.VX.dr }));
      ok(fin.st === 'done' && fin.h === 'Sit for a moment in the stillness, and carry it with you.' && !fin.dr, 'at the end of the silence, its closing line: ' + fin.h);
      await p.context().close();

      // Laughter Break: your mood, the claps on their pattern, your mood again, side by side at the end and in the history
      p = await page({}, { unlock: true, spy: true });
      await go(p, 'practice/laughter');
      await p.click('#sGo'); await p.waitForTimeout(400);
      r = await jump(p, /mood/);
      const rv = await E(p, () => ({ shown: !document.querySelector('#sRate').hidden, lo: document.querySelector('#sRateLo').textContent, hi: document.querySelector('#sRateHi').textContent }));
      await p.click('#sRateG button[data-v="4"]'); await p.waitForTimeout(800);
      r = await run(p);
      ok(rv.shown && rv.lo === 'Very low' && rv.hi === 'As good as it gets' && r.step === 'Clap and chant' && r.sub === 'Ho, ho, ha ha ha', 'a mood from 0 to 10, tapped, then on to the clapping: ' + r.sub);
      await clock(p, await E(p, () => { const X = window.__entrain; return X.P.steps[X.P.idx].at + 5.5; }));
      await E(p, () => { window.__tick = []; window.__cl = 0; });
      await p.waitForTimeout(3300);
      const tk = await E(p, () => { const t = [...new Set(window.__tick.map(x => x.toFixed(3)))].map(Number).sort((a, b) => a - b); return { n: t.length, gaps: t.slice(1).map((x, i) => Math.round((x - t[i]) * 10) / 10), cl: window.__cl, blur: window.__blur }; });
      ok(tk.n >= 6 && tk.gaps.every(g => g === 0.3 || g === 0.6) && tk.gaps.includes(0.3) && tk.gaps.includes(0.6), 'the claps keep the ho, ho, ha ha ha pattern: gaps of ' + tk.gaps.join(', ') + ' s');
      ok(tk.cl >= 60 && tk.cl <= 110 && !tk.blur, 'the ring pulses with the claps at about 30 frames a second (' + Math.round(tk.cl / 3.3) + '), with no blurred shadows');
      r = await jump(p, /^And now\?$/);
      await p.click('#sRateG button[data-v="7"]'); await p.waitForTimeout(800);
      await endNow(p); await p.waitForTimeout(500);
      const tile = await E(p, () => { const b = document.querySelector('#sDone .sd-t[data-ex="suds"]'); return b ? [...b.children].slice(0, 3).map(e => e.textContent).join(' | ') : ''; });
      await p.click('#sDone .sd-t[data-ex="suds"]'); await p.waitForTimeout(100);
      const exT = await E(p, () => [...document.querySelectorAll('#sdEx p')].map(x => x.textContent).join(' '));
      const h = await E(p, () => JSON.parse(localStorage.getItem('entrain.history') || '[]').filter(e => e.id === 'laughter').pop() || {});
      ok(tile === 'Mood | 4 → 7 | out of 10, before and after' && /Your mood rose 3 points\./.test(exT) && h.note === 'mood 4 → 7 of 10',
        'the end screen sets your moods side by side and explains them, and the history keeps them: ' + tile + ' / ' + h.note);
      await p.context().close();

      // Let It Out: your word on a tick every three seconds, from five seconds in
      p = await page({ 'pCh.let-it-out': JSON.stringify({ sound: 'word', when: 'after' }) }, { unlock: true, spy: true });
      await go(p, 'practice/let-it-out');
      await p.click('#sGo'); await p.waitForTimeout(400);
      r = await jump(p, /^Your word$/);
      await E(p, () => { window.__tick = []; });
      await p.waitForTimeout(500);
      await clock(p, await E(p, () => { const X = window.__entrain; return X.P.steps[X.P.idx].at + 4.6; }));
      await p.waitForTimeout(6800);
      const wk = await E(p, () => { const t = [...new Set(window.__tick.map(x => x.toFixed(3)))].map(Number).sort((a, b) => a - b); return t.slice(1).map((x, i) => Math.round((x - t[i]) * 100) / 100); });
      r = await run(p);
      ok(wk.length >= 1 && wk.every(g => Math.abs(g - 3) < 0.03) && r.sub === 'On each tick' && r.vis === 'beat' && /steady and clear/.test(r.line), 'Let It Out: a tick every three seconds to say your word on, steady and clear: gaps ' + wk.join(', '));
      await p.context().close();

      // Sing Together: the count-in, the tune, the words marked as they're sung, the parts of a round; pause, skip and I need to stop
      p = await page({}, { unlock: true, spy: true });
      await go(p, 'practice/sing');
      await p.click('#sGo'); await p.waitForTimeout(400);
      r = await jump(p, /^Frère Jacques, together$/);
      const sAt = await E(p, () => { const X = window.__entrain, s = X.P.steps[X.P.idx]; return { at: s.at, lead: s.lead, bl: 60 / s.bpm }; });
      await clock(p, sAt.at + sAt.lead + 0.2); await p.waitForTimeout(300);
      const cin = await t(p, '#sSub');
      await E(p, () => { window.__osc = []; });
      await p.waitForTimeout(Math.round((4 * sAt.bl + 2.4) * 1000));
      const sung = await E(p, () => ({ f: window.__osc.filter(o => o.type === 'triangle' && ![73.42, 146.83, 220, 440].includes(o.f)).map(o => o.f), sub: document.querySelector('#sSub').textContent,
        on: document.querySelector('#sSing .vx-l.on') ? document.querySelector('#sSing .vx-l.on').textContent.trim() : '', now: document.querySelector('#sSing span.now') ? document.querySelector('#sSing span.now').textContent : '',
        shown: !document.querySelector('#sSing').hidden, vis: document.querySelector('#sStage').dataset.vis, drone: !!window.__entrain.VX.dr }));
      ok(/^Count-in: [12] of 4$/.test(cin) && sung.f.slice(0, 4).join() === '293.66,329.63,369.99,293.66' && sung.sub === 'Sing, 1 of 2' && sung.drone,
        'the count-in, then the tune on the beat: D, E, F♯, D, over the drone (' + cin + ', then ' + sung.sub + ')');
      ok(sung.shown && sung.vis === 'sing' && /^Are you sleeping, are you sleeping,$/.test(sung.on) && !!sung.now, 'the words on the screen, the line being sung lit and its syllable marked: ' + sung.now);
      await p.screenshot({ path: OUT + 'voicetest-c-together.png' });
      await p.click('#sPlay'); await p.waitForTimeout(250);
      const ps = await E(p, () => ({ g: window.__entrain.VX.g, dr: !!window.__entrain.VX.dr }));
      await p.click('#sPlay'); await p.waitForTimeout(700);
      const rs = await E(p, () => ({ g: !!window.__entrain.VX.g, dr: !!window.__entrain.VX.dr }));
      ok(ps.g === null && !ps.dr && rs.g && rs.dr, 'pausing cuts the notes already queued and the drone; carrying on brings both back');
      // a round in two parts: group 2 waits a phrase, then sings; the rows say where each is
      r = await jump(p, /^Frère Jacques, a round$/);
      const rAt = await E(p, () => { const X = window.__entrain, s = X.P.steps[X.P.idx]; return { at: s.at, t0: s.lead + 4 * 60 / s.bpm, bl: 60 / s.bpm }; });
      await clock(p, rAt.at + rAt.t0 + 4.5 * rAt.bl); await p.waitForTimeout(300);
      const rows1 = await E(p, () => [...document.querySelectorAll('#sSing .vx-p')].map(r => r.className.replace('vx-p ', '') + ':' + r.querySelector('b').textContent));
      await clock(p, rAt.at + rAt.t0 + 10 * rAt.bl); await p.waitForTimeout(300);
      const rows2 = await E(p, () => [...document.querySelectorAll('#sSing .vx-p')].map(r => r.className.replace('vx-p ', '') + ':' + r.querySelector('b').textContent + ':' + r.querySelector('.vx-l').textContent.trim()));
      ok(rows1.join(' | ') === 'on:Group 1 | wait:Group 2 · in 4 beats' && rows2.join(' | ') === 'on:Group 1:Brother John? Brother John? | on:Group 2:Are you sleeping, are you sleeping,',
        'a round: group 2 counts in while group 1 sings, then comes in a line behind: ' + rows2.join(' | '));
      await p.screenshot({ path: OUT + 'voicetest-c-round.png' });
      // I need to stop: the tune and drone fade, the session ends, Settle opens
      await p.click('#sOut'); await p.waitForTimeout(700);
      const stop = await E(p, () => ({ dr: !!window.__entrain.VX.dr, g: window.__entrain.VX.g, st: window.__entrain.P.state, settle: !document.querySelector('#stlModal').hidden }));
      ok(!stop.dr && stop.g === null && stop.st !== 'running' && stop.settle, 'I need to stop: the drone and the tune go, the session ends, and Settle opens');
      await p.context().close();

      // on your own: the phone, then you
      p = await page({ 'pCh.sing': JSON.stringify({ who: 'solo', song: 'row' }) }, { unlock: true });
      await go(p, 'practice/sing');
      await p.click('#sGo'); await p.waitForTimeout(400);
      r = await jump(p, /^Row Your Boat, a round$/);
      const oAt = await E(p, () => { const X = window.__entrain, s = X.P.steps[X.P.idx]; return { at: s.at, t0: s.lead + 4 * 3 * 60 / s.bpm, bl: 60 / s.bpm }; });
      await clock(p, oAt.at + oAt.t0 + 14 * oAt.bl); await p.waitForTimeout(300);
      const solo = await E(p, () => ({ h: document.querySelector('#sSing .vx-h').textContent, rows: [...document.querySelectorAll('#sSing .vx-p b')].map(b => b.textContent) }));
      ok(solo.h === 'Row, Row, Row Your Boat · A round: the phone, then you' && solo.rows.join() === 'Phone,You', 'on your own: ' + solo.h + ' (' + solo.rows.join(', ') + ')');
      await p.context().close();
    }

    /* D. the health check: hearty laughter and shouting carry a caution of their own (free, whatever the donation) */
    if (!only || only === 'D') {
      const p = await page({ health: JSON.stringify({ at: Date.now(), on: ['heart', 'asthma'] }) });
      const hc = {};
      for (const id of IDS) { await go(p, 'practice/' + id); hc[id] = await t(p, '#sIntro .hc-note'); }
      ok(/^From your health check\. Laughing hard and shouting raise your heart rate and blood pressure for a while.*With a heart condition or asthma, keep it gentle/.test(hc.laughter) && hc['let-it-out'] === hc.laughter &&
        hc.om === '(missing)' && hc.sing === '(missing)', 'with a heart condition and asthma ticked, Laughter Break and Let It Out show a caution written for them (locked or not); Om and singing none');
      await p.context().close();
    }

    /* E. Learn and search: the section on the voice, its references, the contents link */
    if (!only || only === 'E') {
      const p = await page();
      await go(p, 'learn', 400);
      const L = await E(p, () => {
        const h = document.querySelector('#l-voice'), ps = [];
        for (let e = h && h.nextElementSibling; e && e.tagName === 'P'; e = e.nextElementSibling) ps.push({ id: e.id, lead: e.querySelector('b').textContent, links: [...e.querySelectorAll('a')].map(a => a.getAttribute('href')), t: e.textContent.replace(/\s+/g, ' ') });
        const refs = [...document.querySelectorAll('#references li')].map(li => ({ t: li.textContent.replace(/\s+/g, ' ').trim(), a: !!li.querySelector('a[href^="https://"]') }));
        return { h: h && h.textContent, ps, toc: [...document.querySelectorAll('.toc a')].map(a => a.textContent + '>' + a.getAttribute('href')), refs };
      });
      ok(L.h === 'Your voice: chanting, laughing, letting it out and singing' && L.ps.map(x => x.id + ':' + x.lead).join(', ') === 'l-om:Om chanting., l-laugh:Laughter on purpose., l-letout:Letting it out., l-sing:Singing together.' &&
        L.ps.map(x => x.links.join()).join(' ') === '#practice/om #practice/laughter #practice/let-it-out #practice/sing' && L.toc.includes('Your voice>#l-voice'),
        'Learn: a section on the voice, a paragraph for each practice linking to it, and a contents link');
      const want = ['Kalyani, B. G.', 'Thanneeru, S. K.', 'van der Wal, C. N.', 'Stiwi, K.', 'Swee, G.', 'Stephens, R., & Robertson, O. (2020)', 'Stephens, R., Spierer, D. K.', 'Stephens, R., Dowber, H.',
        'Takarada, Y.', 'Weinstein, D.', 'Pearce, E., Launay, J., & Dunbar', 'Tarr, B.'];
      const miss = want.filter(w => !L.refs.some(r => r.t.startsWith(w) && r.a));
      ok(!miss.length, 'each study it cites is in the references, with a link' + (miss.length ? ': missing ' + miss.join(', ') : ''));
      const all = L.ps.map(x => x.t).join(' ');
      ok(/no study has tested what imitating animals does/.test(all) && /humour explained more of the effect, a finding they call exploratory/.test(all) && /pressing a button worked about as well/.test(all) &&
        /left pain unchanged/.test(all) && /no firm conclusions yet/.test(all) && /No study has tested singing along with a phone/.test(all) && /low quality/.test(all),
        'it states the evidence as it is: animal sounds untested, the made-up words and the button, humour over disinhibition, no firm conclusions for Om, low-quality laughter studies, no study of singing with a phone');
      await p.click('#tbFind'); await p.waitForTimeout(150);
      await p.fill('#fdIn', 'ice-breaker'); await p.waitForTimeout(300);
      const hit = await E(p, () => [...document.querySelectorAll('#fdRes a.fd-it')].slice(0, 4).map(a => a.querySelector('b').textContent + '>' + a.getAttribute('href')));
      ok(hit.some(h => /^Singing together.*>#l-sing$/.test(h)), 'search finds the Learn paragraph: ' + hit.join(', '));
      await p.context().close();
    }

    /* F. a small phone and reduced motion: a four-part round fits the stage; the clapping ring holds still */
    if (!only || only === 'F') {
      let p = await page({ 'pCh.sing': JSON.stringify({ who: 'group', parts: '4', song: 'frere' }) }, { unlock: true, vp: { width: 360, height: 740 } });
      await go(p, 'practice/sing');
      await p.click('#sGo'); await p.waitForTimeout(400);
      await jump(p, /^Frère Jacques, a round$/);
      const fAt = await E(p, () => { const X = window.__entrain, s = X.P.steps[X.P.idx]; return { at: s.at, t0: s.lead + 4 * 60 / s.bpm, bl: 60 / s.bpm }; });
      await clock(p, fAt.at + fAt.t0 + 25 * fAt.bl); await p.waitForTimeout(400);
      const fit = await E(p, () => { const s = document.querySelector('#sSing'), st = document.querySelector('#sStage').getBoundingClientRect(), last = [...s.querySelectorAll('.vx-p')].pop().getBoundingClientRect();
        return { rows: s.querySelectorAll('.vx-p').length, over: s.scrollHeight - s.clientHeight, inside: last.bottom <= st.bottom + 1, wide: document.documentElement.scrollWidth - document.documentElement.clientWidth }; });
      ok(fit.rows === 4 && fit.over <= 1 && fit.inside && fit.wide <= 0, 'at 360 × 740 a round in four parts fits the stage, each group a row: ' + JSON.stringify(fit));
      await p.screenshot({ path: OUT + 'voicetest-f-four.png' });
      await p.context().close();
      p = await page({}, { unlock: true, spy: true, rm: true });
      await go(p, 'practice/laughter');
      await p.click('#sGo'); await p.waitForTimeout(400);
      await jump(p, /^Clap and chant$/);
      await clock(p, await E(p, () => { const X = window.__entrain; return X.P.steps[X.P.idx].at + 7; }));
      await E(p, () => { window.__ring = []; });
      await p.waitForTimeout(1500);
      const rr = await E(p, () => [...new Set(window.__ring)]);
      ok(rr.length >= 1 && rr.length <= 2, 'with reduced motion the clapping ring holds still (radii ' + rr.join(', ') + '); the ticks still sound');
      await p.context().close();
    }
  } catch (e) { log.push('ERROR ' + (e && e.stack || e)); }
  await browser.close();
  console.log(log.join('\n'));
  console.log(log.filter(l => l.startsWith('PASS')).length + ' passed, ' + log.filter(l => /^(FAIL|PAGEERROR|ERROR|CONSOLE)/.test(l)).length + ' problems');
  process.exit(log.some(l => /^(FAIL|PAGEERROR|ERROR|CONSOLE)/.test(l)) ? 1 : 0);
})();
