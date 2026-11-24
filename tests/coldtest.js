// Temperature: Cold Finish, and Healthy living's Cold and heat. Locked on the real build (its page free to read, every
// way in asking for the donation), its plans at every length and choice, Build up from the history, a session on an
// unlocked copy (the health check's cold caution first, loud bells to turn the water cold and off, a falling tone with
// each long breath out, three pips, the seconds round a pacer, the end screen and the history), the note after fast
// breathing, Morning Wake-Up's end and the routines, the Cold and heat cards (free to read), Learn and search, a small
// phone and reduced motion.
//   A  locked: its page, Start, the health check asked for first, library, search, Settings, Learn's cups; 360 px
//   B  every plan at every length and choice; the cold's words; wording and spelling
//   C  Build up from the history: three at a length over a week, cut short, the full minute, a month away
//   D  running on an unlocked copy: the caution and the tick box, the bells, tones and pips, the visual, the end and the
//      history; pausing and I need to stop silence it; the tone left out
//   E  after fast breathing; Morning Wake-Up's end; the morning and evening routines
//   F  Healthy living's Cold and heat tab, its cards and sources, the health check there; search; unlocked, no cups
//   G  Learn: the section, its references, the glance rows, the safety note
//   H  a 360 px phone and reduced motion
// Run: node tests/coldtest.js [group letter]
const { chromium, APP, OUT } = require('./pw');
const { testApp, unlockInit, unlocked, sign, DEVICE } = require('./unlock-helper');
const S20 = 'Mozilla/5.0 (Linux; Android 13; SM-G988B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Mobile Safari/537.36';
const only = process.argv[2] || '';
const t = (p, s) => p.$eval(s, e => e.textContent.replace(/\s+/g, ' ').trim()).catch(() => '(missing)');
const E = (p, f, a) => p.evaluate(f, a);
const go = async (p, h, ms) => { await p.evaluate(x => location.hash = x, h); await p.waitForTimeout(ms || 350); };
const OPT = o => JSON.stringify(Object.assign({ voice: false, bells: false, cues: 'tones', visual: 'circle', audio: false, voiceName: '', ana: 0, rhythm: false }, o || {}));
const NOT = /n't\b|\b(do not|never|nothing|without|stop|avoid|none)\b|feel the breath/i;
const SPELL = /\b(programs?|toward|synthesiz\w*|color\w*|favor\w*|behavior\w*|center(?:s|ed)?|organiz\w*|realiz\w*|recogniz\w*|minimiz\w*|optimiz\w*|personaliz\w*|prioritiz\w*|visualiz\w*|analyz\w*|gray|fiber|aging)\b/i;
const ID = 'cold-finish', NAME = 'Cold Finish';
const DAY = 864e5;
const HEALTH = on => JSON.stringify({ at: Date.now() - 1000, on: on });

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
      const ft = CanvasRenderingContext2D.prototype.fillText;
      CanvasRenderingContext2D.prototype.fillText = function (x) { if (this.canvas.id === 'sCanvas') window.__fr[window.__fr.length - 1].push(['t', String(x)]); return ft.apply(this, arguments); };
      const arc = CanvasRenderingContext2D.prototype.arc;
      CanvasRenderingContext2D.prototype.arc = function (x, y, r) { if (this.canvas.id === 'sCanvas') window.__fr[window.__fr.length - 1].push(['a', Math.round(r * 100) / 100]); return arc.apply(this, arguments); };
      const d = Object.getOwnPropertyDescriptor(CanvasRenderingContext2D.prototype, 'shadowBlur');
      Object.defineProperty(CanvasRenderingContext2D.prototype, 'shadowBlur', { set(v) { if (v) window.__blur++; d.set.call(this, v); }, get() { return d.get.call(this); } });
    });
    if (o.unlock) await unlockInit(p);
    await p.goto(o.unlock || o.copy ? UNLOCKED : APP);
    await p.waitForTimeout(350);
    if (o.unlock) await unlocked(p);
    return p;
  };
  const run = p => E(p, () => {
    const X = window.__entrain, s = X.P.steps[X.P.idx] || {}, q = x => document.querySelector(x);
    return { step: s.title, k: s.k, idx: X.P.idx, state: X.P.state, cap: q('#sCap').textContent, sub: q('#sSub').textContent, line: q('#sLine').textContent, vis: q('#sStage').dataset.vis };
  });
  const clock = (p, sec) => E(p, sec => { window.__entrain.P.t0 = performance.now() / 1000 - sec; }, sec);
  const plan = (p, len, ch) => E(p, ([len, ch]) => {
    const X = window.__entrain;
    if (ch) localStorage.setItem('entrain.pCh.cold-finish', JSON.stringify(ch)); else localStorage.removeItem('entrain.pCh.cold-finish');
    const pl = X.pPlan(X.pDef('cold-finish'), len);
    return { total: pl.total, steps: pl.steps.map(s => ({ title: s.title, k: s.k, secs: s.secs, at: s.at, t: s.t || null, vis: s.vis || '', nobell: !!s.nobell, coldEnd: !!s.coldEnd, tone: s.tone,
      lines: s.lines.map(l => l[1]), at0: s.lines.map(l => l[0]) })) };
  }, [len, ch || null]);
  const titles = x => x.steps.map(s => s.title).join(' | ');
  // a history put in place of the one loaded, for the build-up (entries: [days ago, seconds of cold])
  const hist = (p, list) => E(p, list => {
    const X = window.__entrain, H = X.hLoad(), now = Date.now();
    H.length = 0;
    list.forEach(e => H.push({ k: 'practice', id: e[2] || 'cold-finish', n: 'Cold Finish', at: now - e[0] * 864e5, secs: 180, full: true, cold: e[1] }));
    return X.coldLevel();
  }, list);
  const cnt = (a, v) => a.filter(x => x === v).length;

  try {
    /* A. locked on the real build: its page free to read, Start asking for the donation, the badge everywhere */
    if (!only || only === 'A') {
      const p = await page();
      await go(p, 'practice/' + ID);
      const pg = await E(p, () => { const q = s => document.querySelector('#sIntro ' + s), tx = e => e ? e.textContent.replace(/\s+/g, ' ').trim() : '';
        return { title: document.querySelector('#viewTitle').textContent, kind: tx(q('.si-kind')), go: tx(q('#sGo')), dis: q('#sGo').disabled, note: q('#sSupNote').hidden ? '' : tx(q('#sSupNote')),
          steps: [...document.querySelectorAll('#sIntro .si-steps li')].map(tx).join(' | '), ev: tx(q('.si-ev .ev-body')), how: tx(q('.si-main > p')), caution: tx(q('.si-caution')),
          dots: q('.si-ev summary .strength') ? q('.si-ev summary .strength').querySelectorAll('i.on').length : 0, ok: tx(q('.so-ok')), ib: q('#sIbNote').hidden,
          ask: tx(q('.hc-slot .hc-ask')), askHref: q('.hc-slot .hc-ask a') ? q('.hc-slot .hc-ask a').getAttribute('href') : '',
          needs: [...document.querySelectorAll('#sIntro .si-need li')].map(tx).join(' | '), lens: [...document.querySelectorAll('#sIntro .si-len button')].map(tx).join(' '),
          voice: document.querySelector('#sOptVoice').checked, bells: document.querySelector('#sOptBells').checked, mus: !!document.querySelector('#sIntro .so-mus, #sOptMus'),
          choices: [...document.querySelectorAll('#sOpts [data-choice]')].map(g => g.dataset.choice + ':' + [...g.querySelectorAll('button')].map(b => b.dataset.v + (b.getAttribute('aria-pressed') === 'true' ? '*' : '')).join('/')).join(' '),
          cnote: tx(document.querySelector('#sOpts [data-choice="cold"]').closest('.so-row').querySelector('small')) }; });
      ok(pg.title === NAME && pg.kind === 'Energy · Breathing · 5 min' && pg.go === 'Unlock to start' && !pg.dis && /^One of the new techniques/.test(pg.note) && pg.dots === 2 && pg.ev.length > 500 && pg.how.length > 600,
        NAME + ': its page reads in full (' + pg.kind + ', evidence ' + pg.dots + ' of 3), and Start reads ' + pg.go + ', ready to open the way to unlock it');
      ok(pg.steps === 'Warm shower03:55 | Slow breaths00:18 | Cold00:15 | Warm up00:32' && pg.lens === '3 min 5 min 8 min', 'a warm shower, slow breaths, 15 seconds of cold to begin with, then warming up: ' + pg.steps);
      ok(/shock response: a gasp, fast breathing and a sudden rise in heart rate and blood pressure/.test(pg.caution) && /heart condition or high blood pressure, and in pregnancy: ask your doctor first/.test(pg.caution) &&
        /never combine cold water with Wim Hof breathing or breath holds/.test(pg.caution) && /never practise cold immersion alone in open water/.test(pg.caution) && /build up over weeks/.test(pg.caution),
        'its caution: cold shock, a heart condition, high blood pressure and pregnancy, never with Wim Hof or breath holds, never alone in open water, start gradually');
      ok(/^Before the cold: your health check\. It takes a minute and stays on this device\./.test(pg.ask) && pg.askHref === '#st-health' && pg.ok === 'None of the cautions apply to me' && pg.ib,
        'the health check is asked for first, on the page, while it\'s unanswered; the tick box says none of the cautions apply: ' + pg.ask.slice(0, 60));
      ok(/^Your phone outside the shower/.test(pg.needs) && /Volume up the voice and bells are loud on purpose/.test(pg.needs) && /A steady footing/.test(pg.needs) && !/Headphones|Heart sensor/.test(pg.needs),
        'its needs: the phone outside the shower, the volume up, a steady footing: ' + pg.needs.slice(0, 80));
      ok(pg.voice && pg.bells && !pg.mus && pg.choices === 'cold:auto*/15/30/45/60 tone:on*/off' && /^Build up: 15 seconds to begin with\. After three at one length, the third at least a week after the first, the next is 15 seconds longer, up to a minute/.test(pg.cnote),
        'the voice and bells on for it (whatever the usual), no music; Build up first, then 15 to 60 seconds, and the breath-out tone: ' + pg.choices);
      await p.click('#sGo'); await p.waitForTimeout(250);
      const dl = await E(p, () => ({ open: !document.querySelector('#supModal').hidden, for: document.querySelector('#supFor').textContent, st: window.__entrain.P.state }));
      ok(dl.open && dl.for === NAME + ' is one of the new techniques.' && dl.st !== 'running', 'Start opens the donation dialog, naming it, and nothing starts');
      await p.click('#supClose'); await p.waitForTimeout(150);
      // the health check answered: the offer gives way to the caution written for you, and the tick box says so
      await E(p, h => { localStorage.setItem('entrain.health', h); }, HEALTH(['bpHigh']));
      await go(p, 'home'); await go(p, 'practice/' + ID);
      const hc = await E(p, () => ({ box: (document.querySelector('#sIntro .hc-slot .hc-note') || {}).textContent || '', ask: !!document.querySelector('#sIntro .hc-ask'), ok: document.querySelector('#sIntro .so-ok').textContent.trim() }));
      ok(!hc.ask && /^From your health check\. Cold water sets off a shock response/.test(hc.box) && /With high blood pressure, ask your doctor before you try cold exposure/.test(hc.box) && hc.ok === "I've read the cautions, and I choose to go ahead",
        'with high blood pressure ticked: the health check\'s cold caution, written for you, and the tick box reads ' + hc.ok);
      await E(p, h => { localStorage.setItem('entrain.health', h); }, HEALTH([]));
      await go(p, 'home'); await go(p, 'practice/' + ID);
      ok(await E(p, () => !document.querySelector('#sIntro .hc-slot').textContent.trim()), 'answered with nothing that bears on cold: no box at all');
      // the library, search, Settings
      await go(p, 'practice');
      const lib = await E(p, () => { const a = document.querySelector('#prLib a[href="#practice/cold-finish"]'), d = window.__entrain.pDef('cold-finish');
        return (a ? a.closest('.pr-grp').dataset.g + (a.querySelector('.pc-meta .sup-tag') ? '+sup' : '') + (/Cautions/.test(a.textContent) ? '+cautions' : '') : 'none') + ' ' + d.goal + '/' + d.method + '/' + d.posture.join(' '); });
      ok(lib === 'energy+sup+cautions energy/breath/stand', 'the library lists it under Energy, breathing, standing, with the Donation badge and Cautions: ' + lib);
      await p.click('#tbFind'); await p.waitForTimeout(150);
      const finds = [];
      for (const w of ['cold finish', 'cold shower', 'noradrenaline']) {
        await p.fill('#fdIn', w); await p.waitForTimeout(250);
        finds.push(await E(p, w => { const a = document.querySelector('#fdRes a.fd-it[href="#practice/cold-finish"]'); return w + (a ? (a.querySelector('.sup-tag') ? ': found +sup' : ': found') : ': missing'); }, w));
      }
      ok(finds.every(f => /found \+sup$/.test(f)), 'search finds it, with the badge: ' + finds.join(', '));
      await p.keyboard.press('Escape'); await p.waitForTimeout(150);
      await go(p, 'st-supporter', 450);
      const list = await E(p, () => [...document.querySelectorAll('#supList a')].map(a => a.textContent + '>' + a.getAttribute('href')));
      ok(list.includes(NAME + '>#practice/' + ID), 'Settings, New techniques, lists it');
      // a small phone: nothing wider than the screen, the name fits the top bar, Start in reach
      await p.setViewportSize({ width: 360, height: 740 });
      await go(p, 'practice/' + ID, 400);
      const fit = await E(p, () => { const b = document.querySelector('#sGo').getBoundingClientRect(), h = document.querySelector('#viewTitle');
        return { wide: document.documentElement.scrollWidth > document.documentElement.clientWidth, title: h.scrollWidth > h.clientWidth + 1, start: b.bottom > innerHeight - 62 || b.top < 0 }; });
      ok(!fit.wide && !fit.title && !fit.start, 'at 360 px its page fits, its name fits the top bar and Start is in reach: ' + JSON.stringify(fit));
      await p.screenshot({ path: OUT + 'coldtest-a-locked.png', fullPage: true });
      await p.context().close();
    }

    /* B. the plans: every length and choice adds up, says what to do, in British spelling; the cold's words */
    if (!only || only === 'B') {
      const p = await page();
      const bad = [], words = [], seen = {};
      for (const L of [3, 5, 8]) for (const cold of ['auto', '15', '30', '45', '60']) for (const tone of ['on', 'off']) {
        const pl = await plan(p, L, { cold, tone }), want = cold === 'auto' ? 15 : +cold, tag = L + '/' + cold + '/' + tone;
        const st = pl.steps, c = st[2], w = st[0];
        if (pl.total !== L * 60 || st.reduce((a, s) => a + s.secs, 0) !== L * 60) bad.push(tag + ' total ' + pl.total);
        if (titles(pl) !== 'Warm shower | Slow breaths | Cold | Warm up' || st.map(s => s.k).join() !== 'guide,breath,cold,guide') bad.push(tag + ' shape ' + titles(pl));
        if (c.secs !== want || c.tone !== (tone === 'on') || !c.nobell || !st[3].nobell || !st[3].coldEnd) bad.push(tag + ' cold ' + JSON.stringify(c).slice(0, 80));
        if (st[1].secs !== 18 || st[1].t.inh !== 3 || st[1].t.exh !== 6 || st[3].secs !== 32 || w.secs !== L * 60 - want - 50) bad.push(tag + ' parts');
        if (w.at0[w.at0.length - 1] !== w.secs - 12 || !/half a minute to the cold/.test(w.lines[w.lines.length - 1])) bad.push(tag + ' half a minute');
        st.forEach(s => {
          if (s.at0.some((x, i) => x < 0 || x >= s.secs || (i && x <= s.at0[i - 1]))) bad.push(tag + ' ' + s.title + ' times ' + s.at0.join(','));
          words.push(s.title, ...s.lines);
        });
        seen[want] = c;
      }
      ok(!bad.length, '30 plans, every length and choice: the full length, a warm shower, 18 s of slow breaths, the cold you chose, 32 s to warm up, the half-minute warning, every line inside its step' + (bad.length ? ': ' + bad.slice(0, 4).join(' | ') : ''));
      const cw = Object.keys(seen).map(k => {
        const c = seen[k], gaps = c.at0.slice(1).map((x, i) => x - c.at0[i]);
        return { secs: +k, first: c.lines[0], last: c.lines[c.lines.length - 1], left: c.secs - c.at0[c.at0.length - 1], gaps, half: c.lines.indexOf('Halfway. Breathe out, long and slow.') };
      });
      ok(cw.every(x => x.first === 'Cold now. Let the gasp pass, and breathe out, long and slow.' && x.last === 'Nearly there. One more long breath out.' && x.left >= 6 && x.gaps.every(g => g === 9)) &&
        cw.map(x => x.secs + ':' + x.gaps.length + ':' + x.half).join(' ') === '15:1:-1 30:2:-1 45:4:2 60:6:3',
        'the cold\'s words: one at each long breath out, nine seconds apart, from "Cold now" to "Nearly there" with time to say it, and halfway on the longer ones: ' + cw.map(x => x.secs + ' s ' + (x.gaps.length + 1) + ' lines').join(', '));
      const d = await E(p, () => { const d = window.__entrain.pDef('cold-finish');
        return { blurb: d.blurb, end: d.end, all: [d.name, d.blurb, d.how, d.ev, d.parts, d.caution, d.end].concat(...d.choices.map(c => [c.label, typeof c.note === 'function' ? c.note(d) : c.note, ...c.opts.map(o => o[1])]), ...d.needs) }; });
      words.push(d.blurb, d.end);
      const nb = words.filter(x => NOT.test(x)), sb = d.all.concat(words).filter(x => SPELL.test(x));
      ok(!nb.length && !sb.length && words.length > 300, words.length + ' guidance strings say what to do, and everything reads in British spelling' + (nb.length || sb.length ? ': ' + nb.concat(sb).slice(0, 3).join(' | ') : ''));
      const hc = await E(p, () => { const d = window.__entrain.pDef('cold-finish'); return [d.hc.join(), d.confirm, d.sup, d.strength, d.cite].join(' | '); });
      ok(hc === 'cold | true | true | 2 | Šrámek et al. 2000 · Yankouskaya et al. 2023 · Reed et al. 2023 · Tipton et al. 2017',
        'it carries the health check\'s cold kind, a tick box, the donation, two dots and the guide\'s studies: ' + hc);
      await p.context().close();
    }

    /* C. Build up, from the history */
    if (!only || only === 'C') {
      const p = await page();
      const cases = [];
      let lv = await hist(p, []);
      cases.push(['none', lv.secs, lv.n, await E(p, () => window.__entrain.coldNow())]);
      lv = await hist(p, [[3, 15], [2, 15], [1, 15]]);
      cases.push(['three in three days', lv.secs, lv.n, await E(p, () => window.__entrain.coldNow())]);
      const due = await E(p, () => new Date(Date.now() + 3 * 864e5).toLocaleDateString(undefined, { day: 'numeric', month: 'long' }));
      lv = await hist(p, [[8, 15], [5, 15], [1, 15]]);
      cases.push(['three over a week', lv.secs, lv.n, await E(p, () => window.__entrain.coldNow())]);
      lv = await hist(p, [[8, 15], [5, 10], [1, 15]]);
      cases.push(['one cut short', lv.secs, lv.n, '']);
      lv = await hist(p, [[8, 60], [5, 45], [1, 30]]);
      cases.push(['longer ones count', lv.secs, lv.n, '']);
      lv = await hist(p, [[30, 15], [26, 15], [23, 15], [22, 30], [18, 30], [15, 30], [14, 45], [10, 45], [7, 45], [2, 60]]);
      cases.push(['a full climb', lv.secs, lv.n, await E(p, () => window.__entrain.coldNow())]);
      lv = await hist(p, [[60, 15], [57, 15], [52, 15], [50, 30]]);
      cases.push(['a month away', lv.secs, lv.n, '']);
      lv = await hist(p, [[90, 15], [87, 15], [82, 15], [40, 30], [2, 30]]);
      cases.push(['a break inside', lv.secs, lv.n, '']);
      const got = cases.map(c => c[0] + ': ' + c[1] + ' s, ' + c[2] + ' done');
      ok(cases[0][1] === 15 && cases[0][3] === '15 seconds to begin with.' && cases[1][1] === 15 && cases[1][2] === 3 && cases[1][3] === '15 seconds now, 3 of 3 done, and 30 from ' + due + '.' &&
        cases[2][1] === 30 && cases[2][2] === 0 && cases[2][3] === '30 seconds now, 0 of 3 done.',
        'Build up: 15 seconds to begin with; three at 15 within a few days stay at 15 until a week from the first; three over a week move up to 30: ' + got.slice(0, 3).join(' | '));
      ok(cases[3][1] === 15 && cases[3][2] === 2 && cases[4][1] === 30 && cases[5][1] === 60 && cases[5][3] === 'The full minute now.' && cases[6][1] === 15 && cases[7][1] === 15 && cases[7][2] === 1,
        'a session cut short doesn\'t count, longer ones do, it climbs to the full minute and stays, and a month away steps back once: ' + got.slice(3).join(' | '));
      // the plan follows it, and a length you pick wins
      await hist(p, [[8, 15], [5, 15], [1, 15]]);
      let pl = await plan(p, 3, { cold: 'auto' });
      const a = pl.steps[2].secs;
      pl = await plan(p, 3, { cold: '45' });
      ok(a === 30 && pl.steps[2].secs === 45 && pl.steps[0].secs === 180 - 45 - 50, 'the plan follows Build up (30 s), and a length you pick wins (45 s), the warm shower taking the rest');
      await E(p, () => localStorage.removeItem('entrain.pCh.cold-finish'));
      await go(p, 'practice/' + ID);
      ok(/^Build up: 30 seconds now, 0 of 3 done\./.test(await E(p, () => document.querySelector('#sOpts [data-choice="cold"]').closest('.so-row').querySelector('small').textContent)) &&
        /Cold00:30/.test(await t(p, '#sIntro .si-steps')), 'its page says where you are, and lists 30 seconds of cold');
      await p.context().close();
    }

    /* D. running on an unlocked copy */
    if (!only || only === 'D') {
      let p = await page({ health: HEALTH(['heart']), 'pLen.cold-finish': '3' }, { unlock: true, spy: true });
      await go(p, 'practice/' + ID);
      let pg = await E(p, () => ({ go: document.querySelector('#sGo').textContent.trim(), dis: document.querySelector('#sGo').disabled, box: (document.querySelector('#sIntro .hc-slot') || {}).textContent || '', ok: document.querySelector('#sIntro .so-ok').textContent.trim() }));
      ok(pg.go === 'Start 3 min' && pg.dis && /^From your health check\. Cold water sets off a shock response.*With a heart condition, ask your doctor/.test(pg.box.trim()) && pg.ok === "I've read the cautions, and I choose to go ahead",
        'unlocked, with a heart condition ticked: the cold caution written for you comes first, and Start waits for the tick box: ' + pg.go);
      await E(p, () => document.querySelector('#sGo').click()); await p.waitForTimeout(200);
      ok(await E(p, () => window.__entrain.P.state !== 'running'), 'Start does nothing until the box is ticked');
      await p.click('#sIntro .so-ok input'); await p.click('#sGo'); await p.waitForTimeout(600);
      let r = await run(p);
      const said0 = await E(p, () => window.__said.slice());
      ok(r.state === 'running' && r.step === 'Warm shower' && r.vis === 'glow' && /^Phone outside the shower, volume up\. Step into a warm shower/.test(said0[0] || ''),
        'it starts with the warm shower, the voice on for it although it\'s off for every other practice: ' + (said0[0] || '').slice(0, 60));
      // the cold: a triple bell, low, loud, on a gain of its own, the words, the tone falling with the breath out
      const at = await E(p, () => window.__entrain.P.steps.map(s => s.at));
      await E(p, () => { window.__hz = []; window.__said = []; });
      await clock(p, at[2] + 0.1); await p.waitForTimeout(700);
      const c1 = await E(p, () => ({ hz: window.__hz.slice(), said: window.__said.slice(), g: window.__entrain.COLD.g ? Math.round(window.__entrain.COLD.g.gain.value * 100) / 100 : null }));
      r = await run(p);
      ok(r.step === 'Cold' && r.k === 'cold' && r.vis === 'cold' && cnt(c1.hz, 392) === 3 && cnt(c1.hz, 196) === 3 && c1.g === 0.9,
        'the cold starts with three strokes of a low bell (392 Hz), on a gain of its own at 0.9, well above the usual bells: ' + cnt(c1.hz, 392) + ' strokes');
      ok(c1.said[0] === 'Cold now. Let the gasp pass, and breathe out, long and slow.' && cnt(c1.hz, 523.25) === 1 && cnt(c1.hz, 1046.5) === 1,
        'then the words, and a tone falling from C5 with its soft octave for the long breath out: ' + (c1.said[0] || '').slice(0, 30) + ' · ' + c1.hz.filter(h => h > 500 && h < 1100).join(' '));
      ok(r.cap === 'Breathe out, long and slow' && /^1[45] s of cold left$/.test(r.sub), 'the caption follows the breath, the seconds of cold under it: ' + r.cap + ' · ' + r.sub);
      // the visual: the seconds left, and the pacer shrinking through the breath out
      await clock(p, at[2] + 1); await p.waitForTimeout(250);
      const fa = await E(p, () => window.__fr[window.__fr.length - 2]);
      await clock(p, at[2] + 5); await p.waitForTimeout(250);
      const fb = await E(p, () => window.__fr[window.__fr.length - 2]);
      const txt = f => f.filter(x => x[0] === 't').map(x => x[1]), arcs = f => f.filter(x => x[0] === 'a').map(x => x[1]);
      ok(txt(fa).join() === '14,breathe out' && txt(fb).join() === '10,breathe out' && arcs(fa)[0] > arcs(fb)[0] && arcs(fa)[2] === arcs(fb)[2],
        'on the screen: the seconds left in large figures, "breathe out", and a pacer that shrinks as the breath goes out, inside a ring of the seconds: ' + txt(fa).join(' ') + ' → ' + txt(fb).join(' '));
      await clock(p, at[2] + 6.6); await p.waitForTimeout(300);
      r = await run(p);
      ok(r.cap === 'In through the nose', 'then in through the nose for three seconds');
      await E(p, () => { window.__cl = 0; window.__blur = 0; });
      await p.waitForTimeout(2000);
      const fr = await E(p, () => ({ cl: window.__cl, blur: window.__blur }));
      ok(fr.cl >= 40 && fr.cl <= 66 && !fr.blur, 'drawn at about 30 frames a second (' + Math.round(fr.cl / 2) + '), with no blurred shadows');
      await p.screenshot({ path: OUT + 'coldtest-d-cold.png' });
      // pausing silences what's queued; carrying on schedules it again
      await p.click('#sPlay'); await p.waitForTimeout(250);
      const pz = await E(p, () => ({ st: window.__entrain.P.state, g: window.__entrain.COLD.g }));
      await p.click('#sPlay'); await p.waitForTimeout(250);
      ok(pz.st === 'paused' && pz.g === null, 'a pause silences the cold\'s sounds at once');
      // the last three seconds: three pips, then a high triple bell to turn the water off
      await E(p, () => { window.__hz = []; window.__said = []; });
      await clock(p, at[2] + 11.7); await p.waitForTimeout(4200);
      const c2 = await E(p, () => ({ hz: window.__hz.slice(), said: window.__said.slice() }));
      r = await run(p);
      ok(cnt(c2.hz, 880) === 3 && cnt(c2.hz, 587.33) === 3 && r.step === 'Warm up' && c2.said.includes("That's it. Turn the water off, or back to warm if you like, and step out."),
        'three pips before the end, then three strokes of a higher bell (587 Hz) and the words to turn the water off: ' + cnt(c2.hz, 880) + ' pips, ' + cnt(c2.hz, 587.33) + ' strokes');
      // to the end: the tile, its explanation and the history
      await clock(p, at[3] + 31.6); await p.waitForTimeout(900);
      const dn = await E(p, () => { const b = document.querySelector('#sDone .sd-t[data-ex="cold"]'), H = window.__entrain.hLoad(), e = H[H.length - 1];
        return { st: window.__entrain.P.state, h: document.querySelector('#sDone h2').textContent, tile: b ? [...b.children].map(x => x.textContent).join(' | ') : '', e: e ? e.id + ' ' + e.cold + ' ' + e.note : '' }; });
      ok(dn.st === 'done' && dn.h === 'Cold done. Enjoy the energy.' && dn.tile === 'Cold | 15 s | the whole of it | Build up: 15 seconds now, 1 of 3 done' && dn.e === 'cold-finish 15 15 s of cold',
        'the end: "Cold done", a Cold tile with the seconds and where Build up stands, and the history keeps them: ' + dn.tile + ' · ' + dn.e);
      await p.click('#sDone .sd-t[data-ex="cold"]'); await p.waitForTimeout(200);
      const ex = await t(p, '#sdEx');
      ok(/You stayed in the cold for all 15 seconds\./.test(ex) && /Build up: 15 seconds now, 1 of 3 done\. After three at one length/.test(ex), 'its explanation says so, with the build-up\'s rule: ' + ex.slice(0, 90));
      await p.context().close();

      // the tone left out; I need to stop silences the bells at once
      p = await page({ health: HEALTH([]) }, { unlock: true, spy: true });
      await go(p, 'practice/' + ID);
      await p.click('#sOpts [data-choice="tone"] button[data-v="off"]'); await p.waitForTimeout(250);
      await p.click('#sIntro .so-ok input'); await p.click('#sGo'); await p.waitForTimeout(500);
      // paused, then skipped to the cold: its bells wait, and ring as it carries on
      await p.click('#sPlay'); await p.waitForTimeout(150);
      await p.click('#sNext'); await p.waitForTimeout(150); await p.click('#sNext'); await p.waitForTimeout(250);
      await E(p, () => { window.__hz = []; });
      const held = await E(p, () => ({ st: window.__entrain.P.state, step: window.__entrain.P.steps[window.__entrain.P.idx].title, hz: window.__hz.length }));
      await p.click('#sPlay'); await p.waitForTimeout(700);
      const c3 = await E(p, () => ({ hz: window.__hz.slice(), g: !!window.__entrain.COLD.g }));
      ok(held.st === 'paused' && held.step === 'Cold' && cnt(c3.hz, 392) === 3 && !c3.hz.includes(523.25) && c3.g,
        'skipped to the cold while paused, its bells ring as it carries on; with the tone left out, the bells still sound and no tone does');
      await p.click('#sOut'); await p.waitForTimeout(700);
      const stop = await E(p, () => ({ g: window.__entrain.COLD.g, st: window.__entrain.P.state, settle: !document.querySelector('#stlModal').hidden }));
      ok(stop.g === null && stop.st !== 'running' && stop.st !== 'paused' && stop.settle, 'I need to stop silences the cold\'s sounds at once and opens Settle');
      await p.click('#stlDone'); await p.waitForTimeout(200);
      await p.context().close();

      // skipped on out of the cold after two seconds: those two seconds count, not the whole step, and the build-up stays put
      p = await page({ health: HEALTH([]), 'pLen.cold-finish': '3' }, { unlock: true });
      await go(p, 'practice/' + ID);
      await p.click('#sIntro .so-ok input'); await p.click('#sGo'); await p.waitForTimeout(400);
      await p.click('#sNext'); await p.waitForTimeout(150); await p.click('#sNext'); await p.waitForTimeout(150);
      const at2 = await E(p, () => window.__entrain.P.steps.map(s => s.at));
      await clock(p, at2[2] + 1.8); await p.waitForTimeout(150);
      const inCold = (await run(p)).step;
      await p.click('#sNext'); await p.waitForTimeout(250);
      const after = (await run(p)).step;
      await clock(p, at2[3] + 31.6); await p.waitForTimeout(900);
      const sk = await E(p, () => { const X = window.__entrain, b = document.querySelector('#sDone .sd-t[data-ex="cold"]'), H = X.hLoad(), e = H[H.length - 1];
        return { tile: b ? [...b.children].map(x => x.textContent).join(' | ') : '', cold: e && e.cold, note: e && e.note, n: X.coldLevel().n }; });
      ok(inCold === 'Cold' && after === 'Warm up' && /^Cold \| [23] s \| of 15 s planned \| Build up: 15 seconds now, 0 of 3 done$/.test(sk.tile) && (sk.cold === 2 || sk.cold === 3) && sk.note === sk.cold + ' s of cold' && sk.n === 0,
        'skipped on after two seconds in the cold, the end and the history keep those seconds, not the whole 15, and the build-up doesn\'t count it: ' + sk.tile + ' · ' + sk.note);
      await p.click('#sDone .sd-t[data-ex="cold"]'); await p.waitForTimeout(200);
      const ex2 = await t(p, '#sdEx');
      ok(/You turned the water back after [23] of the 15 seconds planned/.test(ex2), 'and its explanation says so: ' + ex2.slice(0, 80));
      await p.context().close();
    }

    /* E. after fast breathing; Morning Wake-Up's end; the routines */
    if (!only || only === 'E') {
      const p = await page();
      await E(p, () => { window.__entrain.hLoad().push({ k: 'practice', id: 'wim-hof', n: 'Wim Hof Breathing', at: Date.now() - 10 * 6e4, secs: 600, full: true, ib: true, wh: 3 }); });
      await go(p, 'practice/' + ID);
      const ib = await E(p, () => { const n = document.querySelector('#sIbNote'); return n.hidden ? '' : n.textContent; });
      ok(/^You did Wim Hof Breathing 10 minutes ago\. Give your breathing time to settle back to normal before the cold, and keep breathing all the way through it, with no breath holds\.$/.test(ib),
        'after Wim Hof within the hour, its page says to let the breath settle first and to keep breathing through the cold: ' + ib.slice(0, 50));
      // Morning Wake-Up's end: the Focus Primer, then Cold Finish, with the cup while it's locked
      const end = async ch => {
        await E(p, ch => { if (ch) localStorage.setItem('entrain.pCh.morning-tonic', JSON.stringify(ch)); else localStorage.removeItem('entrain.pCh.morning-tonic'); }, ch || null);
        await go(p, 'practice/morning-tonic');
        await E(p, () => { const X = window.__entrain; X.P.def = X.pDef('morning-tonic'); X.P.steps = X.pPlan(X.P.def, 15).steps; X.pDone({ secs: 900, early: false, hrPts: [] }, false); });
        await p.waitForTimeout(200);
        return E(p, () => [...document.querySelectorAll('#sDone .sd-next')].map(c => ({ txt: c.querySelector('p').textContent, href: c.querySelector('a').getAttribute('href'), cup: !!c.querySelector('a .sup-tag') })));
      };
      let nx = await end();
      ok(nx.length === 2 && nx[0].href === '#practice/focus-primer' && !nx[0].cup && nx[1].href === '#practice/cold-finish' && nx[1].cup &&
        /^Showering next\? Cold Finish ends it with 15 seconds to a minute of cold, and loud cues to breathe out long and slow\.$/.test(nx[1].txt),
        'Morning Wake-Up\'s end suggests the Focus Primer, then Cold Finish, with the cup: ' + nx.map(x => x.href).join(', '));
      nx = await end({ breath: 'fire' });
      ok(nx.length === 2 && /After breath of fire, give your breathing time to settle back to normal first\.$/.test(nx[1].txt), 'after breath of fire, it says to let the breathing settle first');
      await E(p, () => localStorage.removeItem('entrain.pCh.morning-tonic'));
      await p.click('#sDone .sd-next a[href="#practice/cold-finish"]'); await p.waitForTimeout(400);
      ok(await t(p, '#viewTitle') === NAME && await t(p, '#sGo') === 'Unlock to start', 'its link opens Cold Finish\'s page, Start asking for the donation');
      // the morning routine's step, and the evening bath's practices
      await go(p, 'living/routines', 500);
      const R = await E(p, () => { const tx = e => e.textContent.replace(/\s+/g, ' ').trim(), step = (id, b) => [...document.querySelectorAll('#lv-' + id + ' .lv-rsteps > li')].find(li => li.querySelector('b').textContent === b);
        const m = step('morning', 'A cold finish, if you like'), e = step('evening', 'A warm shower or bath');
        return { m: m ? tx(m.querySelector('p')) : '', ml: m ? [...m.querySelectorAll('.lv-go a')].map(a => a.getAttribute('href') + (a.querySelector('.sup-tag') ? '+cup' : '')).join(' ') : '', ms: m ? m.querySelector('.lv-sugg summary').textContent : '',
          el: e ? [...e.querySelectorAll('.lv-go a')].map(a => a.getAttribute('href')).join(' ') : '', refs: [...document.querySelectorAll('#lv-morning .lv-refl li')].map(tx).join(' | '),
          order: [...document.querySelectorAll('#lv-morning .lv-rsteps > li b')].map(b => b.textContent).join(' | ') }; });
      ok(R.order === 'Up at your usual time | Daylight | Water and a stretch | A cold finish, if you like | A practice, before the screens | Breakfast | Then the screens' &&
        /^End your shower with 15 to 30 seconds of cool, then cold, water/.test(R.m) && /Read its cautions first/.test(R.m) && R.ml === '#practice/cold-finish+cup #living/cold-water' && /^See also/.test(R.ms),
        'the morning routine has a cold finish after water and a stretch, leading to Cold Finish (with the cup) and the cold water card: ' + R.ml);
      ok(/^Šrámek, P\./.test(R.refs.split(' | ')[3]) && /^Yankouskaya, A\./.test(R.refs.split(' | ')[4]) && R.el === '#practice/body-scan #practice/sleep-descent #living/sauna',
        'with its sources; and the evening\'s warm bath leads to Body Scan, Sleep Descent and the sauna card: ' + R.el);
      await p.context().close();
    }

    /* F. Healthy living's Cold and heat: cards free to read, sources, the health check; search; unlocked, no cups */
    if (!only || only === 'F') {
      let p = await page({ health: HEALTH(['heart', 'bpLow']) });
      await go(p, 'living/cold-heat', 500);
      const L = await E(p, () => { const tx = e => e ? e.textContent.replace(/\s+/g, ' ').trim() : '', q = s => document.querySelector(s);
        return { tabs: [...document.querySelectorAll('.lv-tabs .g-tab')].map(b => b.textContent + (b.getAttribute('aria-selected') === 'true' ? '*' : '')).join(' | '),
          caution: tx(q('#lvp-cold-heat .si-caution')), hc: tx(q('#lvp-cold-heat .hc-note')), legend: !!q('#lvp-cold-heat .pr-legend'),
          cards: [...document.querySelectorAll('#lvp-cold-heat .lv-sup')].map(c => c.id + ':' + tx(c.querySelector('.pc-top b')) + ':' + tx(c.querySelector('.lv-best')) + ':' + c.open).join(' | '),
          w: document.documentElement.scrollWidth, iw: innerWidth }; });
      ok(L.tabs === 'Recipes | Supplements | Routines | Light | Cold and heat*' && L.w <= L.iw && L.legend, 'Healthy living has a fifth tab, Cold and heat: ' + L.tabs);
      ok(/^Cold water shock can be dangerous, above all with a heart condition or high blood pressure: start gradually, never go into cold open water alone, and never combine cold water with breath holds\./.test(L.caution) &&
        /ask a doctor before saunas or very hot baths; drink water, and skip them after alcohol\. Safety notes$/.test(L.caution), 'it opens with the safety note\'s line for cold and heat, and the link to the whole note');
      ok(/^From your health check\. Cold water sets off a shock response.*With a heart condition, ask your doctor.*Heat lowers your blood pressure.*With a heart condition or low blood pressure or fainting, leave out saunas/.test(L.hc),
        'with a heart condition and low blood pressure ticked, the health check\'s cold and heat cautions, written for you: ' + L.hc.slice(0, 160));
      ok(L.cards === 'lv-cold-water:Cold water:Best evidence: alertness:false | lv-sauna:Sauna and heat:Best evidence: falling asleep (a warm bath):false', 'two cards, closed to start: ' + L.cards);
      await p.click('#lv-cold-water > summary'); await p.waitForTimeout(200);
      const card = id => E(p, id => { const d = document.querySelector('#lv-' + id), tx = e => e.textContent.replace(/\s+/g, ' ').trim();
        return { open: d.open, uses: [...d.querySelectorAll('.lv-uses li')].map(l => l.querySelector('b').textContent + ' ' + l.querySelectorAll('.strength i.on').length).join(' | '),
          facts: [...d.querySelectorAll('.lv-facts dt')].map(tx).join(' | '), dd: [...d.querySelectorAll('.lv-facts dd')].map(tx).join(' '), care: [...d.querySelectorAll('.lv-care li')].map(tx),
          go: [...d.querySelectorAll('.lv-card-go a')].map(a => a.getAttribute('href') + (a.querySelector('.sup-tag') ? '+cup' : '')).join(' '), goT: tx(d.querySelector('.lv-card-go span')),
          refs: [...d.querySelectorAll('.lv-refl a')].map(a => a.getAttribute('href')), uses2: [...d.querySelectorAll('.lv-uses p')].map(tx).join(' ') }; }, id);
      let c = await card('cold-water');
      ok(c.open && c.uses === 'Alertness 2 | Mood 2 | Stress hormones 1' && c.facts === 'Amounts studied | How to start | Cold plunges, later' && /about 530%/.test(c.uses2) && /47% lower three hours later/.test(c.uses2),
        'Cold water: alertness and mood (moderate) and stress hormones (limited), the amounts studied, how to start, and cold plunges later: ' + c.uses);
      ok(/never alone; if the cold takes your breath, float on your back for 60 to 90 seconds/.test(c.dd) && c.care.length === 5 && /Never practise cold immersion alone in open water/.test(c.care.join(' ')) &&
        /Never combine cold water with Wim Hof breathing or breath holds/.test(c.care.join(' ')) && /heart condition, high blood pressure or asthma, or in pregnancy/.test(c.care[0]),
        'its rules: never alone in open water, float until the gasping passes, never with Wim Hof or breath holds, a heart condition, high blood pressure, asthma or pregnancy first');
      ok(c.go === '#practice/cold-finish+cup' && c.goT === 'In Entrain' && c.refs.length === 5 && c.refs.every(h => /^https:\/\//.test(h)) && c.refs.includes('https://pmc.ncbi.nlm.nih.gov/articles/PMC9953392/') && c.refs.includes('https://pmc.ncbi.nlm.nih.gov/articles/PMC10842018/'),
        'it leads to Cold Finish (with the cup), and lists five sources, every one linked: ' + c.refs.length);
      await go(p, 'living/sauna', 700);
      c = await card('sauna');
      const seen = await E(p, () => { const r = document.querySelector('#lv-sauna').getBoundingClientRect(); return r.top >= 0 && r.top < innerHeight / 2; });
      ok(c.open && seen && c.uses === 'Falling asleep (a warm bath) 2 | Depression, in one trial 1 | Regular saunas 1' && /38\.5 °C/.test(c.uses2) && /specialised medical machine, not a sauna/.test(c.uses2) && /may not be cause and effect/.test(c.uses2),
        '#living/sauna opens its card, in view: a warm bath for sleep (moderate), one depression trial with a medical machine and regular saunas (limited)');
      ok(c.care.length === 4 && /low blood pressure, or in pregnancy, ask a doctor/.test(c.care[0]) && /skip the sauna after alcohol/.test(c.care[1]) && c.go === '#practice/body-scan #practice/sleep-descent #practice/yoga-nidra+cup' &&
        c.refs.length === 3 && c.refs.every(h => /^https:\/\//.test(h)), 'its cautions (a heart condition, low blood pressure, pregnancy, alcohol), the relaxation and sleep practices it pairs with, and three sources: ' + c.go);
      // search
      await p.click('#tbFind'); await p.waitForTimeout(150);
      const all = async q => { await p.fill('#fdIn', q); await p.waitForTimeout(250); return E(p, () => [...document.querySelectorAll('#fdRes .fd-it')].map(a => a.getAttribute('href'))); };
      const s1 = await all('sauna'), s2 = await all('cold plunge'), s3 = await all('ice bath'), s4 = await all('cold finish');
      await p.keyboard.press('Escape'); await p.waitForTimeout(150);
      ok(s1[0] === '#living/sauna' && s2.includes('#living/cold-water') && s3[0] === '#living/cold-water' && s4[0] === '#practice/cold-finish', 'search finds the sauna card, the cold water card for a plunge or an ice bath, and Cold Finish: ' + [s1[0], s2[0], s3[0], s4[0]].join(', '));
      await p.screenshot({ path: OUT + 'coldtest-f-living.png', fullPage: true });
      await p.context().close();
      // unlocking while the tab is open: the cups go at once, the card staying open (the test copy, its code kept now)
      p = await page({ device: DEVICE }, { copy: true });
      await go(p, 'living/cold-water', 500);
      const before = await E(p, () => ({ cups: document.querySelectorAll('#lvBody .lv-chip .sup-tag').length, open: document.querySelector('#lv-cold-water').open }));
      await E(p, c => { localStorage.setItem('entrain.unlock', c); window.__entrain.supKept(); }, sign(DEVICE));
      await p.waitForFunction(() => window.__entrain.supOn(), null, { timeout: 5000 }).catch(() => {});
      await p.waitForTimeout(200);
      const after = await E(p, () => ({ cups: document.querySelectorAll('#lvBody .lv-chip .sup-tag').length, open: document.querySelector('#lv-cold-water').open, on: window.__entrain.supOn() }));
      ok(before.cups >= 3 && before.open && after.on && after.cups === 0 && after.open, 'unlocking with the tab open takes the cups off its links at once, the card still open: ' + before.cups + ' → ' + after.cups);
      await p.context().close();
      // unlocked: no cups, and the routines' too
      p = await page({}, { unlock: true });
      await go(p, 'living/cold-water', 500);
      const cups = await E(p, () => document.querySelectorAll('#lvBody .sup-tag').length);
      await go(p, 'practice/' + ID);
      ok(cups === 0 && await t(p, '#sGo') === 'Start 5 min', 'unlocked, the links carry no cup, and Start reads Start 5 min');
      await p.context().close();
    }

    /* G. Learn: the section, its references, the glance rows, the safety note */
    if (!only || only === 'G') {
      const p = await page();
      await go(p, 'l-temp', 500);
      const G = await E(p, () => {
        const tx = e => e.textContent.replace(/\s+/g, ' ').trim(), h = document.getElementById('l-temp'), ps = [];
        for (let e = h.nextElementSibling; e && e.tagName === 'P'; e = e.nextElementSibling) ps.push(e);
        const refs = [...document.querySelectorAll('#references li')].map(tx);
        return { h: tx(h), ids: ps.map(p => p.id).join(), text: ps.map(tx).join(' '), links: [...new Set(ps.flatMap(p => [...p.querySelectorAll('a')].map(a => a.getAttribute('href') + (a.nextElementSibling && a.nextElementSibling.classList.contains('sup-tag') ? '+cup' : ''))))],
          refs: ['Šrámek, P.', 'Yankouskaya, A.', 'Reed, E. L.', 'Tipton, M. J.', 'Janssen, C. W.', 'Hussain, J.', 'Haghayegh, S.'].map(n => refs.filter(r => r.startsWith(n)).length).join(''),
          toc: [...document.querySelectorAll('.toc a')].map(a => a.textContent + '>' + a.getAttribute('href')).filter(x => /temp/.test(x)).join(),
          rows: [...[...document.querySelectorAll('#lnGlance tbody')].find(b => /Temperature/.test(b.querySelector('.ln-sense').textContent)).querySelectorAll('tr.ln-row')]
            .map(r => r.querySelector('th b').textContent + ' (' + r.children[1].textContent + ') > ' + [...r.children[2].querySelectorAll('a')].map(a => a.getAttribute('href') + (a.nextElementSibling && a.nextElementSibling.classList.contains('sup-tag') ? '+cup' : '')).join(' ')).join(' | '),
          safe: tx([...document.querySelectorAll('#sfNote .sf-list li')].find(l => /^Cold and heat\./.test(tx(l))) || h) };
      });
      ok(G.h === 'Temperature: cold and heat' && G.ids === 'l-cold,l-coldshock,l-heat' && G.toc === 'Cold and heat>#l-temp', 'Learn has a section on temperature, with three paragraphs and its own link in the contents');
      ok(/\(Šrámek et al\., 2000\)/.test(G.text) && /\(Yankouskaya et al\., 2023\)/.test(G.text) && /\(Reed et al\., 2023\)/.test(G.text) && /\(Tipton et al\., 2017\)/.test(G.text) &&
        /\(Janssen et al\., 2016\)/.test(G.text) && /\(Hussain & Cohen, 2018\)/.test(G.text) && /\(Haghayegh et al\., 2019\)/.test(G.text) && G.refs === '1111111',
        'it cites the cold, cold shock and heat studies, each once in the references');
      ok(/about 530% and dopamine by about 250%/.test(G.text) && /47% lower three hours later/.test(G.text) && /moderate evidence for alertness and a better mood, with a real safety risk/.test(G.text) &&
        /specialised medical machine, not a sauna/.test(G.text) && /early to moderate evidence for relaxation and mood/.test(G.text) && /never combine cold water with Wim Hof breathing or breath holds/.test(G.text),
        'the evidence as the guide rates it, with its limits, and the safety rules');
      ok(['#practice/cold-finish+cup', '#living/cold-water', '#living/sauna', '#living/evening', '#living/morning', '#st-health'].every(h => G.links.includes(h)), 'it links to Cold Finish (with the cup), the cards, the routines and the health check: ' + G.links.join(' '));
      ok(G.rows === 'Cold exposure (Moderate (a safety risk)) > #practice/cold-finish+cup #living/cold-water | Heat, sauna (Early to moderate) > #living/sauna #living/evening',
        'Techniques at a glance: the temperature rows keep the guide\'s evidence and lead to Cold Finish and the cards: ' + G.rows);
      ok(/^Cold and heat\. Cold water sets off a shock response/.test(G.safe) && /never go into cold open water alone/.test(G.safe) && /skip them after alcohol\.$/.test(G.safe), 'the safety note has a line for cold and heat');
      await p.context().close();
    }

    /* H. a 360 px phone and reduced motion */
    if (!only || only === 'H') {
      const p = await page({ health: HEALTH([]) }, { unlock: true, spy: true, rm: true, vp: { width: 360, height: 740 } });
      await go(p, 'living/cold-heat', 500);
      await p.click('#lv-cold-water > summary'); await p.click('#lv-sauna > summary'); await p.waitForTimeout(200);
      const w1 = await E(p, () => document.documentElement.scrollWidth <= document.documentElement.clientWidth);
      await go(p, 'practice/' + ID);
      const w2 = await E(p, () => document.documentElement.scrollWidth <= document.documentElement.clientWidth);
      ok(w1 && w2, 'at 360 px, nothing is wider than the screen on the Cold and heat tab, with both cards open, or on Cold Finish\'s page');
      await p.click('#sIntro .so-ok input'); await p.click('#sGo'); await p.waitForTimeout(500);
      const at = await E(p, () => window.__entrain.P.steps.map(s => s.at));
      await clock(p, at[2] + 1); await p.waitForTimeout(300);
      const fa = await E(p, () => window.__fr[window.__fr.length - 2]);
      await clock(p, at[2] + 5); await p.waitForTimeout(300);
      const fb = await E(p, () => window.__fr[window.__fr.length - 2]);
      const arcs = f => f.filter(x => x[0] === 'a').map(x => x[1]), txt = f => f.filter(x => x[0] === 't').map(x => x[1]);
      const wide = await E(p, () => document.documentElement.scrollWidth <= document.documentElement.clientWidth);
      ok(arcs(fa)[0] === arcs(fb)[0] && txt(fa)[0] === '14' && txt(fb)[0] === '10' && wide, 'with reduced motion the pacer keeps still while the seconds count down, and the session fits the screen: ' + txt(fa)[0] + ' → ' + txt(fb)[0]);
      await p.screenshot({ path: OUT + 'coldtest-h-small.png' });
      await p.context().close();
    }
  } catch (e) { log.push('ERROR ' + (e && e.stack || e)); }
  await browser.close();
  console.log(log.join('\n'));
  console.log(log.filter(l => l.startsWith('PASS')).length + ' passed, ' + log.filter(l => /^(FAIL|PAGEERROR|ERROR|CONSOLE)/.test(l)).length + ' problems');
  process.exit(log.some(l => /^(FAIL|PAGEERROR|ERROR|CONSOLE)/.test(l)) ? 1 : 0);
})();
