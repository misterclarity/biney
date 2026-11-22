// Learn's brain-wave states and the knowledge around them: the five bands, theta's two faces, a typical day, children's
// rhythms, reading brain waves with care and measuring them at home; the techniques at a glance by sense, each row
// saying where Entrain has it; expectation and placebo, side effects, how often and how long, combining, what to measure
// and what Entrain leaves out. All of it is free to read: links to new techniques carry the donation cup while locked.
//   A  the brain-wave sections: ids, the bands table, the contents list in page order
//   B  techniques at a glance: the guide's 38 rows by sense, their evidence, and every link in Learn landing where it says
//   C  the knowledge sections, and every citation with its reference (new references named, with links)
//   D  search finds them, a row of the table included
//   E  a 360 px phone and a desktop: nothing too wide, the tables fit, the contents list in reach
//   F  free to read on the locked build; the cup beside links to locked techniques, gone once unlocked
// Run: node tests/wavestest.js [group letter]
const { chromium, APP, OUT } = require('./pw');
const { testApp, sign } = require('./unlock-helper');
const S20 = 'Mozilla/5.0 (Linux; Android 13; SM-G988B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Mobile Safari/537.36';
const only = process.argv[2] || '';
const t = (p, s) => p.$eval(s, e => e.textContent.replace(/\s+/g, ' ').trim()).catch(() => '(missing)');
const E = (p, f, a) => p.evaluate(f, a);
const go = async (p, h, ms) => { await p.evaluate(x => location.hash = x, h); await p.waitForTimeout(ms || 300); };

// the guide's table, row by row: sense, technique as Learn names it, and the evidence as the guide rates it
const SENSES = [['Movement', 1], ['Breath', 5], ['Smell', 3], ['Sound', 5], ['Voice', 5], ['Vision', 8], ['Touch', 3], ['Taste', 1], ['Temperature', 2], ['Mind', 3], ['Feedback', 2]];
const ROWS = [
  ['Dance, walking or jogging, yoga, strength training', 'Strong'],
  ['Cyclic sighing', 'Moderate to strong'], ['Box breathing', 'Moderate'], ['Resonance breathing', 'Moderate'], ['Wim Hof-style breathing', 'Moderate'], ['Humming (bhramari)', 'Early to moderate'],
  ['Fresh air, low CO2', 'Strong'], ['Rosemary scent', 'Early'], ['Lavender scent', 'Early to moderate'],
  ['Slow-tempo music', 'Moderate to strong'], ['Fast-tempo music', 'Moderate'], ['Music you choose yourself', 'Strong'], ['Pink noise timed to deep sleep', 'Promising'], ['Binaural, isochronic or monaural beats', 'Mixed'],
  ['Simulated laughter', 'Moderate'], ['Shouting, vocal release', 'Moderate'], ['Group singing', 'Moderate'], ['Om chanting', 'Early'], ['Imitating animal sounds', 'Not studied'],
  ['Eyes closed', 'Strong'], ['Bright, cool light in the morning', 'Strong'], ['Dim, warm light in the evening', 'Strong'], ['Rhythmic light flicker', 'Early'], ['Nature scenes, restoration breaks', 'Moderate'],
  ['A fireplace, with its sound', 'Moderate'], ['Mid-complexity fractals', 'Promising'], ['Fresh flowers', 'Early'],
  ['Slow self-stroking', 'Moderate'], ['Weighted blanket', 'Moderate'], ['Massage', 'Moderate'],
  ['Chewing gum', 'Early to moderate'],
  ['Cold exposure', 'Moderate'], ['Heat, sauna', 'Early to moderate'],
  ['Mindfulness, meditation', 'Moderate to strong'], ['Hypnosis, guided imagery', 'Moderate to strong'], ['Yoga nidra (NSDR), body scan', 'Moderate'],
  ['EEG headband neurofeedback', 'Moderate'], ['Heart coherence sensor', 'Moderate']
];
// the references this part of Learn added, by how each begins
const NEW_REFS = ['Eisermann, M.', 'Wilkinson, C. L.', 'Cellier, D.', 'Lanthier, M.', 'Mikhaylov, D.', 'Fincham, G. W., Epel, E.', 'van Middendorp, H.', 'Farias, M.',
  'Lehrer, P. M., Vaschillo, E.', 'Lalanza, J. F.', 'Bowles, N. I.', 'Parsons, C. E.', 'Cearns, M.', 'Fuchs, D.', 'Vinkers, C. H.', 'Ko, K.', 'Darwish, B. A.', 'Papalambros, N. A.', 'Jeffries, F. W.'];
const IDS = ['l-waves', 'l-theta', 'l-day', 'l-children', 'l-wave-caveats', 'l-muse', 'l-glance', 'l-expect', 'l-side', 'l-dose', 'l-combine', 'l-measure', 'l-leftout'];
const TOC_NEW = ['l-waves', 'l-children', 'l-glance', 'l-expect', 'l-dose', 'l-measure', 'l-leftout'];
const UK = /\b(programs?|toward|synthesiz\w*|color\w*|favor\w*|behavior\w*|(?<!Research )center(?:s|ed)?|organiz\w*|realiz\w*|recogniz\w*|minimiz\w*|optimiz\w*|personaliz\w*|prioritiz\w*|visualiz\w*|analyz\w*|gray|fiber|aging)\b/i;

(async () => {
  const browser = await chromium.launch();
  const log = []; const ok = (c, m) => log.push((c ? 'PASS ' : 'FAIL ') + m);
  const page = async (o) => {
    o = o || {};
    const ctx = await browser.newContext(o.desk ? { viewport: { width: 1280, height: 900 } }
      : { userAgent: S20, viewport: o.vp || { width: 412, height: 915 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    const p = await ctx.newPage();
    p.on('pageerror', e => log.push('PAGEERROR ' + e.message));
    p.on('console', m => { if (m.type() === 'error') log.push('CONSOLE ' + m.text()); });
    p.on('request', r => { if (!/^(file|data|blob):/.test(r.url())) log.push('FAIL a network request: ' + r.url()); });
    await p.addInitScript(() => {
      localStorage.setItem('entrain.debug', '1'); localStorage.setItem('entrain.stereo', 'ok');
      localStorage.setItem('entrain.diveAck', '1');            // Swim & dive's cautions accepted, so its link from Learn lands on the pattern
      localStorage.setItem('entrain.pOpt', JSON.stringify({ voice: false, bells: false, cues: 'off', visual: 'circle', audio: false, voiceName: '', ana: 0, rhythm: false }));
      if (window.speechSynthesis) { speechSynthesis.speak = () => {}; speechSynthesis.cancel = () => {}; }
    });
    await p.goto(o.url || APP);
    await p.waitForFunction(() => window.__entrain && window.__entrain.SUP.state !== 'checking', null, { timeout: 5000 }).catch(() => {});
    return p;
  };
  // flag (or unflag) items as new techniques for the run, as later features will be: practices, and patterns as b:<id>
  const flag = (p, keys, on) => E(p, ([keys, on]) => {
    const X = window.__entrain;
    keys.forEach(k => { const list = k.startsWith('b:') ? X.BREATHS : X.PRACTICES, d = list.find(x => x.id === k.replace(/^b:/, '')); if (on === false) delete d.sup; else d.sup = true; });
    X.supRefresh();
  }, [keys, on]);
  // what search lists for a query, group by group
  const find = async (p, q) => {
    if (await p.$eval('#fd', e => e.hidden)) { await p.click('#tbFind'); await p.waitForTimeout(150); }
    await p.fill('#fdIn', q); await p.waitForTimeout(250);
    return E(p, () => [...document.querySelectorAll('.fd-grp')].map(g => ({ k: g.querySelector('h3').firstChild.textContent.trim(),
      items: [...g.querySelectorAll('.fd-it')].map(a => ({ t: a.querySelector('b').textContent, h: a.getAttribute('href'), s: a.textContent.replace(/\s+/g, ' ') })) })));
  };
  try {
    /* A. the brain-wave sections: where they sit, the bands table, theta, the day, children, the caveats, the contents list */
    if (!only || only === 'A') {
      const p = await page();
      await go(p, 'learn', 400);
      const A = await E(p, ids => {
        const sci = document.querySelector('#science'), tx = e => e ? e.textContent.replace(/\s+/g, ' ').trim() : '';
        const h2 = [...sci.querySelectorAll('h2')].map(h => h.id + ':' + tx(h));
        const rows = [...document.querySelectorAll('#lnBands tbody tr')].map(r => [...r.children].map(tx));
        const after = (id, tag) => { const out = []; let e = document.getElementById(id).nextElementSibling; while (e && !/^H[23]$/.test(e.tagName)) { if (!tag || e.tagName === tag) out.push(tx(e)); e = e.nextElementSibling; } return out; };
        return { missing: ids.filter(id => !document.getElementById(id) || !sci.contains(document.getElementById(id))), h2, lede: tx(document.querySelector('#l-waves + .v-lede')),
          rows, cap: tx(document.querySelector('#lnBands caption')), head: [...document.querySelectorAll('#lnBands thead th')].map(tx),
          firstH: sci.querySelector('h2, h3').id, beforeBeats: document.getElementById('l-glance').compareDocumentPosition(document.getElementById('l-beats')) & 4,
          laterOrder: ['l-practices', 'l-expect', 'l-dose', 'l-measure', 'l-leftout', 'l-safety'].map(id => document.getElementById(id)).every((e, i, a) => !i || (a[i - 1].compareDocumentPosition(e) & 4)),
          theta: after('l-theta').join(' '), day: [...document.querySelectorAll('#l-day ~ ul')][0] ? [...document.getElementById('l-day').nextElementSibling.nextElementSibling.querySelectorAll('li')].map(tx) : [],
          kids: after('l-children').join(' '), kidsLi: document.getElementById('l-children').nextElementSibling.nextElementSibling.querySelectorAll('li').length,
          cav: [...document.getElementById('l-wave-caveats').nextElementSibling.querySelectorAll('li b')].map(tx), muse: tx(document.getElementById('l-muse')),
          toc: [...document.querySelectorAll('.toc a')].map(a => a.getAttribute('href').slice(1)) };
      }, IDS);
      ok(!A.missing.length, 'Learn has every new section and paragraph, by id: ' + IDS.join(' ') + (A.missing.length ? ' (missing ' + A.missing.join(', ') + ')' : ''));
      ok(A.firstH === 'l-waves' && A.h2[0] === 'l-waves:Brain-wave states' && /:What the research supports$/.test(A.h2[1]) && A.beforeBeats && A.laterOrder,
        'Brain-wave states opens Learn, before what the research supports; the later sections come after Guided practices and before Safety: ' + A.h2.join(' | '));
      ok(/rhythmic electrical activity of large groups of neurons/.test(A.lede) && /which one leads/.test(A.lede), 'it opens with what brain waves are: ' + A.lede.slice(0, 80));
      const bandOk = A.rows.length === 5 && ['Delta', 'Theta', 'Alpha', 'Beta', 'Gamma'].every((b, i) => A.rows[i][0].startsWith(b)) &&
        /0\.5–4 Hz/.test(A.rows[0][0]) && /4–8 Hz/.test(A.rows[1][0]) && /8–12 Hz/.test(A.rows[2][0]) && /13–30 Hz/.test(A.rows[3][0]) && /30 Hz and up/.test(A.rows[4][0]) &&
        A.rows[0][1] === 'Deep, dreamless sleep' && /eyes closed/.test(A.rows[2][1]) && A.rows[4][1] === 'Intense focus' && /memory consolidation/.test(A.rows[0][2]) && /frontal theta/.test(A.rows[1][2]) &&
        A.head.join('|') === 'Band|When it leads|What it\'s best for' && /approximate/.test(A.cap);
      ok(bandOk, 'the five bands, each with its range, when it leads in adults and what it\'s best for; the ranges called approximate: ' + A.rows.map(r => r[0]).join(' · '));
      ok(/two quite different situations/.test(A.theta) && /front of the brain increases during concentration, working memory and learning/.test(A.theta) && /isn't simply a “dreamy” or “hypnotic” state/.test(A.theta),
        'theta\'s two faces: drowsy or inward, and frontal theta in focused work');
      ok(A.day.length === 5 && /^Working, talking, planning: beta leads/.test(A.day[0]) && /near 10 Hz/.test(A.day[1]) && /within seconds/.test(A.day[1]) && /alpha fades into theta/.test(A.day[2]) &&
        /delta leads/.test(A.day[3]) && /^Dreaming \(REM sleep\)/.test(A.day[4]), 'a typical day: beta, alpha near 10 Hz with the eyes closed, theta, delta, REM: ' + A.day.map(d => d.split(':')[0]).join(' · '));
      ok(A.kidsLi === 4 && /5 Hz \(theta\) at five months/.test(A.kids) && /theta to alpha around the age of 7 or 8/.test(A.kids) && /early twenties/.test(A.kids) &&
        /“downloading” state/.test(A.kids) && /comes from self-help writing rather than neuroscience research/.test(A.kids),
        'children\'s rhythms: infancy, 3 to 7, the clinical view, into adulthood, and the "downloading" claim put down to self-help writing');
      ok(A.cav.join(' | ') === 'Linked, not caused. | A result, not a switch. | Averages.' && /88–96% accuracy/.test(A.muse) && /Lanthier et al\., 2025/.test(A.muse) &&
        /matched worst of the three consumer devices/.test(A.muse) && /four dry sensors/.test(A.muse) && /not for “you are in theta now”/.test(A.muse),
        'the caveats, and how accurate a home headband is: good at sleep, weakest at brain waves, trends rather than states');
      // the contents list: every new section in it, and the whole list in the order of the page
      const order = await E(p, toc => { const els = toc.map(id => document.getElementById(id)); return els.every(Boolean) && els.every((e, i) => !i || (els[i - 1].compareDocumentPosition(e) & 4)); }, A.toc);
      ok(TOC_NEW.every(id => A.toc.includes(id)) && order && A.toc[0] === 'l-waves', 'the contents list has the new sections, in the order of the page (' + A.toc.length + ' links)');
      await p.click('.toc a[href="#l-glance"]'); await p.waitForTimeout(700);
      const j = await E(p, () => ({ h: location.hash, top: Math.round(document.getElementById('l-glance').getBoundingClientRect().top), y: scrollY }));
      ok(j.h === '#l-glance' && j.y > 400 && j.top >= 0 && j.top < 220, 'its At a glance link lands on the table\'s heading, below the top bar: ' + JSON.stringify(j));
      await p.context().close();
    }

    /* B. techniques at a glance: the guide's rows by sense, their evidence, "Learn only" or a link, and every link in Learn landing */
    if (!only || only === 'B') {
      const p = await page();
      await go(p, 'learn', 400);
      const G = await E(p, () => {
        const tx = e => e ? e.textContent.replace(/\s+/g, ' ').trim() : '';
        return [...document.querySelectorAll('#lnGlance tbody')].map(b => ({ sense: tx(b.querySelector('.ln-sense')), rows: [...b.querySelectorAll('tr.ln-row')].map(r => ({
          name: tx(r.querySelector('th b')), aim: tx(r.querySelector('th small')), ev: tx(r.children[1]), where: tx(r.children[2]),
          links: [...r.children[2].querySelectorAll('a')].map(a => a.getAttribute('href')), lo: r.children[2].classList.contains('ln-lo') })) }));
      });
      const rows = [].concat(...G.map(g => g.rows));
      ok(G.map(g => g.sense + ' ' + g.rows.length).join(', ') === SENSES.map(s => s[0] + ' ' + s[1]).join(', '),
        'the table keeps the guide\'s senses in its order, with its 38 techniques: ' + G.map(g => g.sense + ' ' + g.rows.length).join(', '));
      const names = rows.map(r => r.name), badName = ROWS.filter((r, i) => names[i] !== r[0]).map(r => r[0]);
      ok(rows.length === 38 && !badName.length, 'each technique in the guide\'s order' + (badName.length ? ': not where expected ' + badName.join(' | ') : ''));
      const ev = /^(Strong|Moderate to strong|Moderate|Early to moderate|Early|Promising|Mixed|Not studied)( \(.+\))?$/;
      const badEv = rows.filter((r, i) => !ev.test(r.ev) || !(r.ev === ROWS[i][1] || r.ev.startsWith(ROWS[i][1] + ' ('))).map(r => r.name + ': ' + r.ev);
      ok(!badEv.length && rows.every(r => r.aim), 'each with its aim and the evidence exactly as the guide rates it, never stronger' + (badEv.length ? ': ' + badEv.join(' | ') : ''));
      ok(rows.find(r => r.name === 'Resonance breathing').ev.includes('no benefit over placebo breathing') && rows.find(r => r.name === 'Wim Hof-style breathing').ev.includes('safety risk') &&
        rows.find(r => r.name === 'Rhythmic light flicker').ev.includes('seizure risk') && rows.find(r => r.name === 'Cold exposure').ev.includes('safety risk') &&
        rows.find(r => r.name === 'Mid-complexity fractals').ev.includes('mostly one lab'), 'the qualifications stay: no benefit over placebo, the safety and seizure risks, mostly one lab');
      const neither = rows.filter(r => !(r.lo && /^Learn only/.test(r.where)) && !r.links.some(h => !/^#l-/.test(h)));
      const lo = rows.filter(r => r.lo);
      ok(!neither.length && lo.every(r => /^Learn only/.test(r.where) && !r.links.some(h => !/^#l-/.test(h))),
        'every row links to where Entrain has it, or says Learn only (' + lo.length + ' Learn only, ' + (rows.length - lo.length) + ' in the app)' + (neither.length ? ': neither for ' + neither.map(r => r.name).join(', ') : ''));
      ok(rows.find(r => r.name === 'Pink noise timed to deep sleep').links.includes('#l-leftout') && rows.find(r => r.name === 'EEG headband neurofeedback').links.includes('#l-muse'),
        'the pink noise row says why it\'s left out, and the headband row how accurate one is');
      // every link in Learn (the new sections' and the older ones') lands where it says
      const hrefs = await E(p, () => [...new Set([...document.querySelectorAll('#science a[href^="#"]')].map(a => a.getAttribute('href')))]);
      const bad = [];
      for (const h of hrefs) {
        await go(p, h.slice(1), 260);
        const r = await E(p, h => {
          const X = window.__entrain, view = [...document.querySelectorAll('#views > .view')].find(v => !v.hidden), id = h.slice(1), title = document.querySelector('#viewTitle').textContent;
          let m;
          if ((m = /^practice\/(.+)$/.exec(id))) { const d = X.PRACTICES.find(x => x.id === m[1]); return !!d && view.id === 'v-session' && title === d.name; }
          if ((m = /^breathe\/(.+)$/.exec(id))) return X.BREATHS.some(b => b.id === m[1]) && view.id === 'v-breathe' && X.BC.pattern === m[1];
          if ((m = /^track\/(.+)$/.exec(id))) { const d = X.TRACKS.find(x => x.id === m[1]); return !!d && view.id === 'v-track' && title === d.name; }
          if (/^living\//.test(id)) return view.id === 'v-living' && location.hash === h;
          if (id === 'living' || id === 'heart' || id === 'breathe') return view.id === 'v-' + id;
          if (id === 'sounds') return view.id === 'v-practice';
          if (id === 'sleep-sounds') return view.id === 'v-sleep-sounds' && title === 'Sleep sounds';
          if (id === 'feedback' || /^st-/.test(id)) return view.id === 'v-settings';
          const el = document.getElementById(id);
          return !!el && view.contains(el);
        }, h);
        if (!r) bad.push(h);
      }
      ok(hrefs.length > 30 && !bad.length, 'every link in Learn lands where it says: ' + hrefs.length + ' links, practices by name, patterns chosen, pages and sections found' + (bad.length ? '; wrong: ' + bad.join(', ') : ''));
      await p.context().close();
    }

    /* C. the knowledge sections, and every citation in Learn with its reference */
    if (!only || only === 'C') {
      const p = await page();
      await go(p, 'learn', 400);
      const K = await E(p, () => {
        const tx = e => e ? e.textContent.replace(/\s+/g, ' ').trim() : '';
        const sec = id => { const out = []; let e = document.getElementById(id).nextElementSibling; while (e && !/^H[23]$/.test(e.tagName)) { out.push(tx(e)); e = e.nextElementSibling; } return out.join(' '); };
        return { expect: sec('l-expect'), side: tx(document.getElementById('l-side')), dose: sec('l-dose'), combine: tx(document.getElementById('l-combine')), measure: sec('l-measure'),
          sig: [...document.querySelectorAll('#lnSignals tbody tr')].map(r => [...r.children].map(tx)), left: [...document.getElementById('l-leftout').nextElementSibling.querySelectorAll('li b')].map(tx),
          leftTx: sec('l-leftout') };
      });
      ok(/400 adults/.test(K.expect) && /12 breaths a minute/.test(K.expect) && /\(Fincham, Strauss & Cavanagh, 2023\)/.test(K.expect) && /200 adults/.test(K.expect) && /Fincham et al\., 2024/.test(K.expect) &&
        /stress improved in both by the same amount/.test(K.expect) && /cyclic sighing still lifted mood more than mindfulness/.test(K.expect) && /van Middendorp et al\., 2016/.test(K.expect),
        'expectation and placebo: the coherent and Wim Hof-style placebo trials, what still stands, and expectations in the immune study');
      ok(/83 studies with 6,703 participants, 8\.3%/.test(K.side) && /3\.7% in experimental studies and 33\.2% in observational/.test(K.side) && /anxiety, depression and cognitive anomalies/.test(K.side) &&
        /Farias et al\., 2020/.test(K.side), 'side effects of meditation as Farias and colleagues found them');
      ok(/20 minutes twice a day/.test(K.dose) && /Lehrer et al\., 2000/.test(K.dose) && /5 to 20 minutes once or twice a day/.test(K.dose) && /minority, precautionary view/.test(K.dose) &&
        /35 to 65 minutes a day for wellbeing and 50 to 80 for mental health/.test(K.dose) && /how often they practised predicted/.test(K.dose) && /280,000 sessions/.test(K.dose) && /slightly better mood with somewhat longer sessions/.test(K.dose) &&
        /back-to-back blocks, because of the risk of fainting/.test(K.dose), 'how often and how long: the Lehrer protocol, frequency over length (with the app study\'s hint for longer sessions), the doses, no stacking of intense breathing');
      ok(/rarely test whether effects add up/.test(K.combine) && /Fuchs et al\., 2018/.test(K.combine) && /haven't been tested/.test(K.combine), 'combining techniques: little direct evidence, one pilot, the programmes untested as wholes');
      const sig = K.sig.map(r => r[0]), cant = K.sig.filter(r => /A web page can't read it/.test(r[2])).map(r => r[0]);
      ok(sig.join('|') === 'Heart rate|Heart-rate variability|Breathing rate|Finger temperature|Skin conductance|Blood oxygen|Movement, stillness|EEG|How you feel' &&
        cant.join('|') === 'Finger temperature|Skin conductance' && /a little more accurately than any one alone/.test(K.measure) && /Darwish et al\., 2025/.test(K.measure),
        'what to measure: nine signals, which ones a web page can\'t read, combining signals, trends rather than verdicts');
      ok(K.left.join(' | ') === 'Pink noise timed to deep sleep. | Smart bulbs. | EMDR. | Candle gazing and panoramic vision. | Skin temperature, skin conductance and health apps.' &&
        /closed-loop/.test(K.leftTx) && /bright and cool in the morning, dim and warm in the evening/.test(K.leftTx) && /no self-guided version/.test(K.leftTx) && /No good-quality studies/.test(K.leftTx) &&
        /Apple Health and Google Health Connect/.test(K.leftTx) && /Brain trends reads a Muse headband only for broad trends, averaged over 25 seconds, not each wave/.test(K.leftTx) &&
        /a heart sensor, a fingertip oximeter, an Aranet4 CO₂ monitor and a Muse headband over Bluetooth, and the phone's camera, microphone and motion sensor\./.test(K.leftTx),
        'what Entrain leaves out, and why: timed pink noise (Brain trends too slow for it), smart bulbs, self-guided EMDR, gaze techniques, skin signals and health apps (and every sensor Entrain does read)');
      // every citation has its reference and every reference is cited (as choices V checks), the new references named
      const C = await E(p, () => {
        const X = window.__entrain, refs = [...document.querySelectorAll('#references li')].map(li => li.textContent.replace(/\s+/g, ' ').trim());
        const body = [...document.querySelectorAll('#science > *:not(.refs-sec)')].map(e => e.textContent).join(' ').replace(/\s+/g, ' ');
        const found = [], who = "((?:de |van der |van |von )?[A-ZÀ-Ž][\\w'’À-ž-]+(?: [A-ZÀ-Ž][\\w'’À-ž-]+)?)";
        (body.match(/\(([^()]*\d{4})\)/g) || []).forEach(g => g.slice(1, -1).split(';').forEach(c => {
          const m = new RegExp('^' + who + '[^;]*?,? (\\d{4})$').exec(c.trim()); if (m) found.push([m[1], m[2], c.trim()]);
        }));
        const inLearn = found.length;
        X.PRACTICES.concat(X.TRACKS, X.BREATHS).forEach(d => (d.cite || '').split(' · ').forEach(c => {
          const m = new RegExp('^' + who + '[^·]*? (\\d{4})\\b').exec(c.trim()); if (m) found.push([m[1], m[2], c.trim()]);
        }));
        const keys = refs.map(r => { const m = /^([^,(]+?),.*?\((\d{4})\)/.exec(r); return m ? [m[1].trim(), m[2]] : null; });
        // two references by the same first author in the same year: Learn names enough authors to tell them apart
        const twins = keys.filter((k, i) => k && keys.findIndex(j => j && j[0] === k[0] && j[1] === k[1]) !== i);
        return { n: found.length, refs, twins: twins.map(k => k.join(' ')),
          clash: found.slice(0, inLearn).filter(f => twins.some(k => k[0] === f[0] && k[1] === f[1]) && /^\S+ et al\.,? \d{4}$/.test(f[2])).map(f => f[2]), links: [...document.querySelectorAll('#references li')].map(li => !!li.querySelector('a[href^="https://"]')),
          missing: found.filter(f => !keys.some(k => k && k[0] === f[0] && k[1] === f[1])).map(f => f[2]),
          unused: refs.filter((r, i) => keys[i] && !found.some(f => f[0] === keys[i][0] && f[1] === keys[i][1])).map(r => r.slice(0, 60)) };
      });
      ok(C.n > 150 && !C.missing.length && !C.unused.length, C.n + ' citations in Learn and on the practices, tracks and patterns, each with its reference among ' + C.refs.length + ', and every reference cited' +
        (C.missing.length ? '; no reference for: ' + C.missing.join(' | ') : '') + (C.unused.length ? '; never cited: ' + C.unused.join(' | ') : ''));
      ok(!C.clash.length, 'where two references share a first author and year (' + C.twins.join(', ') + '), Learn\'s citations name enough authors to tell them apart' +
        (C.clash.length ? '; ambiguous: ' + C.clash.join(' | ') : ''));
      const gone = NEW_REFS.filter(a => !C.refs.some((r, i) => r.startsWith(a) && C.links[i]));
      ok(!gone.length, 'the ' + NEW_REFS.length + ' new references are listed, each with a link to the paper' + (gone.length ? '; missing: ' + gone.join(' | ') : ''));
      const spell = await E(p, re => {
        const parts = [], ids = ['l-waves', 'l-expect'], stop = ['l-beats', 'l-safety'];
        ids.forEach((id, i) => { let e = document.getElementById(id); while (e && e.id !== stop[i] && !(e.tagName === 'H2' && e.id !== id)) { parts.push(e.textContent); e = e.nextElementSibling; } });
        return (parts.join(' ').match(new RegExp('.{0,30}' + re.source + '.{0,20}', 'gi')) || []);
      }, { source: UK.source });
      ok(!spell.length, 'British spelling in the new sections' + (spell.length ? ': ' + spell.slice(0, 4).join(' | ') : ''));
      await p.context().close();
    }

    /* D. search finds the new sections, the paragraphs in them and a row of the table, and lands on them */
    if (!only || only === 'D') {
      const p = await page();
      await go(p, 'learn', 300);
      const L = r => (r.find(g => g.k === 'Learn') || { items: [] }).items;
      let r = await find(p, 'brain-wave states');
      ok(L(r).some(i => i.h === '#l-waves' && i.t === 'Brain-wave states'), 'search finds Brain-wave states: ' + L(r).slice(0, 3).map(i => i.t).join(' · '));
      r = await find(p, 'downloading');
      const dl = await E(p, hs => hs.find(h => { const e = document.querySelector(h); return !!e && /“downloading” state/.test(e.textContent); }), L(r).map(i => i.h));
      ok(!!dl && L(r).find(i => i.h === dl).t === 'How children\'s rhythms develop', 'and the "downloading" claim, under Children\'s rhythms');
      r = await find(p, 'muse');
      ok(L(r).some(i => i.h === '#l-muse' && i.t === 'Measuring at home'), 'and how accurate a Muse is: ' + L(r).slice(0, 3).map(i => i.t).join(' · '));
      r = await find(p, 'placebo');
      ok(L(r).some(i => i.h === '#l-expect'), 'and expectation and placebo');
      r = await find(p, 'emdr');
      const em = L(r)[0];
      ok(!!em && em.t === 'EMDR' && await E(p, h => document.getElementById('l-leftout').nextElementSibling.contains(document.querySelector(h)), em.h), 'and EMDR, under what Entrain leaves out');
      r = await find(p, 'weighted blanket');
      // (Touch's own paragraph on weighted blankets comes first now; the table's row is among the results)
      const wb = L(r).find(i => i.t === 'Weighted blanket');
      ok(!!wb && L(r)[0].h === '#l-weighted' && /Techniques at a glance · Touch/.test(wb.s) && /Sleep, less anxiety · Moderate · A tip in Sleep Descent and healthy sleep habits/.test(wb.s),
        'a row of the table is found by its technique, with its sense, aim, evidence and place in Entrain, after the paragraph on it: ' + (wb && wb.s.slice(0, 110)));
      if (wb) {
        await p.click('.fd-it[href="' + wb.h + '"]'); await p.waitForTimeout(800);
        const land = await E(p, h => { const e = document.querySelector(h), b = e.getBoundingClientRect(); return { tr: e.tagName === 'TR', hit: e.classList.contains('fd-hit'), learn: !document.querySelector('#v-learn').hidden, top: Math.round(b.top), bottom: Math.round(b.bottom), ih: innerHeight }; }, wb.h);
        ok(land.tr && land.hit && land.learn && land.top >= 56 && land.bottom <= land.ih, 'tapping it opens Learn at that row, highlighted and in view: ' + JSON.stringify(land));
      }
      r = await find(p, 'box breathing');
      ok(r[0] && r[0].k === 'Breathing' && r[0].items[0].h === '#breathe/box', 'the pattern itself still comes first for "box breathing": ' + (r[0] && r[0].k + ' ' + r[0].items[0].t));
      await p.context().close();
    }

    /* E. a 360 px phone: nothing wider than the screen, the tables fit; a desktop: the contents list all in reach */
    if (!only || only === 'E') {
      const p = await page({ vp: { width: 360, height: 740 } });
      await go(p, 'learn', 400);
      const W = await E(p, () => ({ page: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        tbl: [...document.querySelectorAll('.ln-tbl')].map(t => [t.id, t.parentNode.scrollWidth - t.parentNode.clientWidth]),
        toc: Math.min(...[...document.querySelectorAll('.toc a')].map(a => a.getBoundingClientRect().height)) }));
      ok(W.page <= 0 && W.tbl.length === 3 && W.tbl.every(x => x[1] <= 1) && W.toc >= 24, 'at 360 px nothing is wider than the screen, the three tables fit without scrolling sideways, and the contents links are ' + Math.round(W.toc) + ' px tall: ' + JSON.stringify(W.tbl));
      for (const [id, name] of [['l-waves', 'bands'], ['l-glance', 'glance'], ['l-measure', 'signals']]) {
        await go(p, id, 500);
        await p.screenshot({ path: OUT + 'wavestest-e-' + name + '.png' });
      }
      await p.context().close();
      const d = await page({ desk: true });
      await go(d, 'learn', 400);
      const T = await E(d, () => { const r = document.querySelector('.toc').getBoundingClientRect(); return { top: Math.round(r.top), bottom: Math.round(r.bottom), ih: innerHeight, sticky: getComputedStyle(document.querySelector('.toc')).position }; });
      ok(T.sticky === 'sticky' && T.bottom <= T.ih, 'on a desktop the contents list stays beside the page, every link in reach: ' + JSON.stringify(T));
      await go(d, 'l-leftout', 600);
      const T2 = await E(d, () => { const r = document.querySelector('.toc').getBoundingClientRect(); return { top: Math.round(r.top), bottom: Math.round(r.bottom), ih: innerHeight }; });
      ok(T2.top >= 0 && T2.bottom <= T2.ih, 'and still in reach further down the page: ' + JSON.stringify(T2));
      await d.screenshot({ path: OUT + 'wavestest-e-desktop.png' });
      // a short laptop window: the list scrolls within itself, so its last links stay in reach
      await d.setViewportSize({ width: 1280, height: 620 }); await d.waitForTimeout(200);
      const T3 = await E(d, () => {
        const toc = document.querySelector('.toc'), r = toc.getBoundingClientRect(), last = toc.lastElementChild;
        toc.scrollTop = toc.scrollHeight;
        const lr = last.getBoundingClientRect();
        return { bottom: Math.round(r.bottom), ih: innerHeight, scrolls: toc.scrollHeight > toc.clientHeight, last: lr.bottom <= r.bottom + 1 && lr.top >= r.top - 1 };
      });
      ok(T3.bottom <= T3.ih && T3.scrolls && T3.last, 'in a window 620 px tall the list scrolls within itself, down to Impressum: ' + JSON.stringify(T3));
      await d.context().close();
    }

    /* F. free to read: the locked build opens every part of it; links to locked new techniques carry the cup until unlocked */
    if (!only || only === 'F') {
      const p = await page();
      const seen = [];
      for (const h of ['learn', 'l-waves', 'l-children', 'l-glance', 'l-expect', 'l-dose', 'l-measure', 'l-leftout', 'l-muse']) {
        await go(p, h, 250);
        seen.push(await E(p, () => document.querySelector('#supModal').hidden && !document.querySelector('#v-learn').hidden));
      }
      const cups = await E(p, () => {
        // a link to a locked practice, breathing pattern or track, to Sleep sounds, to a part of Settings, Heart or History that opens only with a donation,
        // or one with data-sup (whose words name the locked part of Settings' Air and scent or Background sound)
        const X = window.__entrain, AT = ['#st-light', '#st-scenes', '#st-mymusic', '#st-checkin', '#st-rhythm', '#cam', '#air', '#eeg', '#rcourse', '#experiment'];
        const locked = a => { const h = a.getAttribute('href'); if (a.hasAttribute('data-sup') || h === '#sleep-sounds' || AT.includes(h)) return !X.SUP.ok; const m = /^#(practice|breathe|track)\/(.+)$/.exec(h); if (!m) return false; const l = m[1] === 'practice' ? X.PRACTICES : m[1] === 'breathe' ? X.BREATHS : X.TRACKS, d = l.find(x => x.id === m[2]); return !!d && !!d.sup && !X.SUP.ok; };
        const links = [...document.querySelectorAll('#science a[href^="#"]')], cup = a => !!(a.nextElementSibling && a.nextElementSibling.classList.contains('sup-tag'));
        const g = s => [...document.querySelectorAll('#lnGlance ' + s)].map(cup);
        return { want: links.filter(locked).length, have: document.querySelectorAll('#science .sup-tag').length, right: links.every(a => locked(a) === cup(a)),
          glance: [].concat(...['a[href="#rcourse"]', 'a[href="#st-air"]', 'a[href="#air"]', 'a[href="#st-amb"]', 'a[href="#st-mymusic"]', 'a[href="#st-light"]', 'a[href="#st-scenes"]', 'a[href="#eeg"]'].map(g)),
          free: [document.querySelector('#l-nature ~ p a[href="#st-amb"]'), [...document.querySelectorAll('#science a[href="#st-air"]')].find(a => /turned\s+off in/.test(a.parentNode.textContent)), document.querySelector('#science a[href="#st-beats"]')].map(a => !!a && !cup(a)) };
      });
      ok(seen.every(Boolean) && cups.right && cups.have === cups.want, 'on the locked build every part of it opens with no dialog, and only links to locked techniques carry the cup (' + cups.have + ' now)');
      ok(cups.glance.length === 13 && cups.glance.every(Boolean) && cups.free.every(Boolean),
        'the table\'s links to the resonance course, Air the room, a monitor, background music, your own music, screen light, scenes and brain trends carry the cup too; Settings\' background sound, the scent tips and the beats, which have free parts, none: ' + JSON.stringify(cups.glance) + ' ' + JSON.stringify(cups.free));
      await flag(p, ['bhramari', 'b:sigh']);
      await go(p, 'l-glance', 300);
      const F = await E(p, () => {
        const cup = s => { const a = document.querySelector('#lnGlance a[href="' + s + '"]'), n = a && a.nextElementSibling; return !!n && n.classList.contains('sup-tag') && n.classList.contains('sup-ic') && n.getAttribute('aria-label') === 'Opens with a donation'; };
        return { bh: cup('#practice/bhramari'), sigh: cup('#breathe/sigh'), wim: cup('#practice/wim-hof'), calm: cup('#practice/calm-reset'), n: document.querySelectorAll('#science .sup-tag').length };
      });
      ok(F.bh && F.sigh && !F.wim && !F.calm && F.n === cups.have + 2, 'flag Bhramari and the cyclic sigh as new techniques, and their links in the table get the cup too, the others none (beside the ' + cups.have + ' the build flags): ' + JSON.stringify(F));
      await p.screenshot({ path: OUT + 'wavestest-f-cups.png' });
      await p.click('#lnGlance a[href="#practice/bhramari"]'); await p.waitForTimeout(400);
      ok(await t(p, '#viewTitle') === 'Bhramari' && await t(p, '#sGo') === 'Unlock to start' && await E(p, () => document.querySelector('#supModal').hidden),
        'its link still opens the practice\'s page to read, whose Start asks for the donation: ' + await t(p, '#sGo'));
      await flag(p, ['bhramari', 'b:sigh'], false);
      ok(await E(p, () => document.querySelectorAll('#science .sup-tag').length) === cups.have, 'unflagged, their cups go at once');
      await p.context().close();
      // the unlocked test copy: flagged links carry no cup, and unlocking with a link clears them at once
      const URL = testApp();
      const u = await page({ url: URL });
      await flag(u, ['bhramari']);
      await go(u, 'l-glance', 300);
      const before = await E(u, () => ({ cup: document.querySelectorAll('#lnGlance a[href="#practice/bhramari"] + .sup-tag').length, ok: window.__entrain.SUP.ok, dev: window.__entrain.supDevice() }));
      await go(u, 'unlock/' + sign(before.dev), 300);
      await u.waitForFunction(() => window.__entrain.SUP.ok, null, { timeout: 5000 }).catch(() => {});
      await go(u, 'l-glance', 300);
      const after = await E(u, () => ({ cup: document.querySelectorAll('#science .sup-tag').length, ok: window.__entrain.SUP.ok }));
      ok(before.cup === 1 && !before.ok && after.ok && after.cup === 0, 'on the test copy the cup shows while locked and goes the moment this device is unlocked: ' + JSON.stringify([before.cup, after.cup]));
      await u.context().close();
    }
  } catch (e) { log.push('ERROR ' + (e && e.stack || e)); }
  await browser.close();
  console.log(log.join('\n'));
  console.log(log.filter(l => l.startsWith('PASS')).length + ' passed, ' + log.filter(l => /^(FAIL|PAGEERROR|ERROR|CONSOLE)/.test(l)).length + ' problems');
  process.exit(log.some(l => /^(FAIL|PAGEERROR|ERROR|CONSOLE)/.test(l)) ? 1 : 0);
})();
