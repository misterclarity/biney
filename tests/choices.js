// Your own breathing patterns, one safety note, filters that combine, and Heart Coherence's choices.
// Run: node tests/choices.js [group letter]
//   M  your own breathing patterns     N  one safety note
//   F  library filters that combine   R  Heart Coherence: gratitude, lying down, its beat and pace
//   W  wording that names its study    A  the pace and beat changed while a practice runs, and Restart
//   Q  the three new quotes            I  the impressum, copyright and licence
//   K  the code check's fixes          L  Healthy living: recipes and supplements
//   G  the gratitude practice          C  Calm Reset's beat and pace     D  donations
//   U  what an automatic update waits for B  connecting can't get stuck
const { chromium, APP, OUT } = require('./pw');
const fs = require('fs'), os = require('os'), path = require('path');
const S20 = 'Mozilla/5.0 (Linux; Android 13; SM-G988B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Mobile Safari/537.36';
const mock = require('./sensor-mock');
const only = process.argv[2] || '';
const t = (p, s) => p.$eval(s, e => e.textContent.replace(/\s+/g, ' ').trim()).catch(() => '(missing)');
const E = (p, f, a) => p.evaluate(f, a);
const OPT = o => ({ pOpt: JSON.stringify(Object.assign({ voice: false, bells: false, cues: 'tones', visual: 'circle', audio: false, voiceName: '', ana: 0, rhythm: false }, o || {})) });
(async () => {
  const browser = await chromium.launch();
  const log = []; const ok = (c, m) => log.push((c ? 'PASS ' : 'FAIL ') + m);
  const page = async (st, init, sensor, desk) => {
    const ctx = await browser.newContext(desk ? { viewport: { width: 1280, height: 900 } } : { userAgent: S20, viewport: { width: 412, height: 915 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    const p = await ctx.newPage();
    p.on('pageerror', e => log.push('PAGEERROR ' + e.message));
    p.on('console', m => { if (m.type() === 'error') log.push('CONSOLE ' + m.text()); });
    await p.addInitScript(s => {
      if (!sessionStorage.getItem('z.seeded')) {            // once a tab: a reload keeps what the page stored
        sessionStorage.setItem('z.seeded', '1');
        localStorage.setItem('entrain.debug', '1'); localStorage.setItem('entrain.stereo', 'ok');
        for (const k in s) localStorage.setItem('entrain.' + k, s[k]);
      }
      if (window.speechSynthesis) { speechSynthesis.speak = () => {}; speechSynthesis.cancel = () => {}; }
    }, st || {});
    if (sensor) await p.addInitScript(mock, sensor);
    if (init) await p.addInitScript(init);
    await p.goto(APP);
    return p;
  };
  const slide = (p, id, v) => E(p, ([id, v]) => { const el = document.querySelector(id); el.value = v; el.dispatchEvent(new Event('input', { bubbles: true })); }, [id, v]);
  const BC = p => E(p, () => { const c = window.__entrain.BC; return { pattern: c.pattern, inh: c.inh, sip: c.sip, hold: c.hold, exh: c.exh, rest: c.rest }; });
  const saved = p => E(p, () => JSON.parse(localStorage.getItem('entrain.myBreaths') || '[]'));
  const row = p => E(p, () => {
    const q = s => document.querySelector(s), vis = s => !!q(s) && !q(s).hidden && !q(s).closest('[hidden]');
    return { quiet: q('#bMine').classList.contains('quiet'), hidden: q('#bMine').hidden, lab: vis('#bMyLab') ? q('#bMyLab').textContent : '', input: vis('#bMyName'),
      val: q('#bMyName').value, dis: q('#bMyName').disabled, save: vis('#bMySave') ? q('#bMySave').textContent : '', saveOff: q('#bMySave').getAttribute('aria-disabled') === 'true',
      del: vis('#bMyDel'), upd: vis('#bMyUpd') ? q('#bMyUpd').textContent : '', hint: q('#bMyHint').textContent };
  });
  const pick = (p, v) => E(p, v => document.querySelector('#bPats input[value="' + v + '"]').click(), v);
  const chips = p => E(p, () => [...document.querySelectorAll('#bPats label')].map(l => (l.classList.contains('on') ? '*' : '') + l.textContent.trim()));
  const toastTxt = p => E(p, () => document.querySelector('#toast').hidden ? '' : document.querySelector('#toastTxt').textContent);
  try {
    /* M. your own breathing patterns: save the timings on the sliders under a name, beside the presets;
       update the one they came from, rename and delete it (with an undo); star it for Today; find it in
       the library and search; the history keeps its name; full, damaged and backed-up lists */
    if (!only || only === 'M') {
      const p = await page(OPT());
      await E(p, () => location.hash = 'breathe'); await p.waitForTimeout(300);
      await p.click('#bAdjust'); await p.waitForTimeout(400);
      let r = await row(p);
      ok(r.quiet && !r.input && /^Change any timing to make a pattern of your own/.test(r.hint), 'on a preset, the save row only says how to make your own: ' + r.hint);
      await slide(p, '#bInh', 4); await slide(p, '#bExh', 6);
      r = await row(p);
      ok((await BC(p)).pattern === 'custom' && !r.quiet && r.lab === 'Save as your own pattern' && r.input && r.save === 'Save' && !r.saveOff && !r.del && !r.upd,
        'changed timings can be saved: ' + r.lab + ' · ' + r.hint);
      await p.fill('#bMyName', '  Evening   4-6 '); await p.click('#bMySave'); await p.waitForTimeout(250);
      let b = await BC(p), l = await saved(p), c = await chips(p);
      const id = b.pattern, uid = id.slice(3);
      ok(/^my-[a-z0-9]+$/.test(id) && l.length === 1 && l[0].name === 'Evening 4-6' && JSON.stringify(l[0].t) === JSON.stringify({ inh: 4, sip: 0, hold: 0, exh: 6, rest: 0 }),
        'Save keeps the name, tidied, and the five timings on this device: ' + JSON.stringify(l[0]));
      ok(c.join('|') === 'Resonance 5.5|Cyclic sigh|Long exhale|Box 4-4-4-4|4-7-8|*Evening 4-6|Custom', 'it becomes a chip beside the presets, chosen: ' + c.join(' | '));
      ok(/^Saved “Evening 4-6”\. It's beside the presets, and in Practice under Yours\.$/.test(await toastTxt(p)), 'and says where it went: ' + await toastTxt(p));
      ok(/^Your own pattern, saved on this device: 6\.0 breaths a minute\./.test(await t(p, '#bDesc')) && await p.$eval('#bEv', e => e.hidden), 'its note gives the pace and no evidence: ' + await t(p, '#bDesc'));
      r = await row(p);
      ok(r.lab === 'Your pattern' && r.val === 'Evening 4-6' && r.save === 'Rename' && r.saveOff && r.del && /^Saved on this device/.test(r.hint), 'the row now offers Rename (once the name changes) and Delete');
      ok(await p.$eval('#bFav [data-fav]', e => e.dataset.fav + ' ' + e.dataset.name).catch(() => '') === 'b:' + id + ' Evening 4-6', 'it has a star, like the presets');

      // change it, then a name that's taken, then update the one it came from
      await slide(p, '#bExh', 7);
      r = await row(p);
      ok((await BC(p)).pattern === 'custom' && r.upd === 'Update “Evening 4-6” instead' && r.val === '', 'changed again, it can be saved anew or update the one it came from: ' + r.upd);
      await p.fill('#bMyName', 'evening 4-6'); await p.click('#bMySave'); await p.waitForTimeout(150);
      ok((await saved(p)).length === 1 && /There's already a pattern called “Evening 4-6”/.test((await row(p)).hint), 'a name you already use is refused, whatever its case: ' + (await row(p)).hint);
      await p.fill('#bMyName', 'box 4-4-4-4'); await p.click('#bMySave'); await p.waitForTimeout(150);
      ok((await saved(p)).length === 1 && /“Box 4-4-4-4”/.test((await row(p)).hint), 'and so is a preset\'s name');
      await p.click('#bMyUpd'); await p.waitForTimeout(250);
      l = await saved(p); b = await BC(p);
      ok(l.length === 1 && l[0].t.exh === 7 && b.pattern === id && /^Updated “Evening 4-6”: in 4 s, out 7 s\.$/.test(await toastTxt(p)), 'Update puts the new timings into it: ' + await toastTxt(p));

      // the same timings can't be saved twice; Custom over a saved pattern
      await pick(p, 'custom'); await p.waitForTimeout(150);
      r = await row(p);
      ok((await BC(p)).pattern === 'custom' && r.quiet && !r.input && r.hint === 'These timings are saved as “Evening 4-6”.', 'Custom on the same timings doesn\'t save them twice: ' + r.hint);
      await slide(p, '#bInh', 4.5);
      ok((await row(p)).upd === 'Update “Evening 4-6” instead', 'and a change from there can still update it');
      await slide(p, '#bInh', 4);
      ok((await BC(p)).pattern === id, 'back on its timings, it\'s chosen again');

      // it comes back after a reload, chosen, with its timings
      await p.reload(); await p.waitForTimeout(300);
      await p.waitForFunction(id => window.__entrain && window.__entrain.BC.pattern === id && document.querySelector('#bPats label.on'), id, { timeout: 5000 }).catch(() => {});   // slower when the suites run side by side
      b = await BC(p); c = await chips(p);
      ok(b.pattern === id && b.inh === 4 && b.exh === 7 && c.indexOf('*Evening 4-6') >= 0 && await p.$eval('#bExh', e => e.value) === '7', 'after a reload it\'s still there and still chosen: ' + c.join(' | '));
      await p.click('#bAdjust'); await p.waitForTimeout(400);

      // rename
      await p.fill('#bMyName', 'Evening slow');
      ok(!(await row(p)).saveOff, 'a new name wakes Rename');
      await p.press('#bMyName', 'Enter'); await p.waitForTimeout(250);
      c = await chips(p);
      ok((await saved(p))[0].name === 'Evening slow' && c.indexOf('*Evening slow') >= 0 && (await toastTxt(p)) === 'Renamed to “Evening slow”.', 'Enter renames it: ' + c.join(' | '));

      // star it; Today, the library and search
      await p.click('#bPanelDone'); await p.waitForTimeout(400);
      await p.click('#bFav [data-fav]'); await p.waitForTimeout(200);
      ok(await E(p, () => localStorage.getItem('entrain.favs')) === JSON.stringify(['b:' + id]), 'the star keeps it for Today');
      await E(p, () => location.hash = 'home'); await p.waitForTimeout(400);
      const fav = await p.$$eval('#tdFavList > li a', a => a.map(x => x.textContent.replace(/\s+/g, ' ').trim() + ' ' + x.getAttribute('href')));
      ok(fav.length === 1 && /Evening slow/.test(fav[0]) && fav[0].endsWith('#breathe/' + id), 'Today lists it under your favourites: ' + fav[0]);
      await E(p, () => location.hash = 'practice'); await p.waitForTimeout(400);
      const sec = await E(p, () => { const g = document.querySelector('.pr-grp[data-g=mine]'); return g ? { h: g.querySelector('h2').textContent, rows: [...g.querySelectorAll('li.pc')].map(li => li.textContent.replace(/\s+/g, ' ').trim()), href: g.querySelector('li.pc a').getAttribute('href') } : null; });
      ok(sec && sec.h === 'Your breathing patterns' && sec.rows.length === 1 && /^Evening slow/.test(sec.rows[0]) && /Breathing guide · 5\.5 breaths a minute · Sitting or lying/.test(sec.rows[0]) && /Yours/.test(sec.rows[0]) && /In 4 s, out 7 s\./.test(sec.rows[0]) && sec.href === '#breathe/' + id,
        'the library lists it first, under Your breathing patterns: ' + (sec && sec.rows[0]));
      await p.click('#tbFind'); await p.waitForTimeout(150); await p.fill('#fdIn', 'evening'); await p.waitForTimeout(250);
      const hit = (await E(p, () => [...document.querySelectorAll('.fd-it')].map(a => a.querySelector('b').textContent + ' ' + a.getAttribute('href') + ' ' + a.textContent))).filter(x => /#breathe\/my-/.test(x))[0];
      ok(/^Evening slow #breathe\/my-/.test(hit || '') && /Your breathing pattern · 5\.5 breaths a minute/.test(hit), 'search finds it: ' + hit);
      await p.press('#fdIn', 'Escape'); await p.waitForTimeout(150);
      // a link to it picks it on the guide
      await E(p, () => location.hash = 'breathe'); await p.waitForTimeout(250);
      await pick(p, 'box'); await p.waitForTimeout(150);
      await E(p, h => location.hash = h, 'breathe/' + id); await p.waitForTimeout(350);
      ok((await BC(p)).pattern === id, 'its link chooses it on the guide');

      // a routine as well: one section for both
      await E(p, () => localStorage.setItem('entrain.yogaSeqs', JSON.stringify([{ uid: 'r1', name: 'My stretch', goal: '', items: [{ id: 'cat-cow', hold: 30 }], at: 1 }])));
      await E(p, () => location.hash = 'practice'); await p.waitForTimeout(400);
      ok(await t(p, '.pr-grp[data-g=mine] h2') === 'Your routines and patterns' && await p.$$eval('.pr-grp[data-g=mine] li.pc', l => l.length) === 2, 'with a routine too, the section holds both: ' + await t(p, '.pr-grp[data-g=mine] h2'));

      // delete, undo, delete again
      await E(p, () => location.hash = 'breathe'); await p.waitForTimeout(250);
      await p.click('#bAdjust'); await p.waitForTimeout(400);
      await p.click('#bMyDel'); await p.waitForTimeout(250);
      b = await BC(p); c = await chips(p);
      ok((await saved(p)).length === 0 && b.pattern === 'custom' && b.exh === 7 && c.join('|') === 'Resonance 5.5|Cyclic sigh|Long exhale|Box 4-4-4-4|4-7-8|*Custom' && await E(p, () => localStorage.getItem('entrain.favs')) === '[]',
        'Delete takes it out at once, and its star; the timings stay, as Custom');
      ok((await toastTxt(p)) === 'Deleted “Evening slow”.' && await p.$eval('#toastAct', e => !e.hidden && e.textContent) === 'Undo', 'with an Undo');
      const over = await E(p, () => { const t = document.querySelector('#toast').getBoundingClientRect(), s = document.querySelector('#bPanel'), x = document.elementFromPoint(t.left + t.width / 2, t.top + t.height / 2);
        return { above: t.bottom <= innerHeight - s.offsetHeight + 1, top: !!x && !!x.closest('#toast') }; });
      ok(over.above && over.top, 'the notice shows above the open settings, where its Undo can be reached: ' + JSON.stringify(over));
      await p.screenshot({ path: OUT + 'choices-m-undo.png' });
      await p.click('#toastAct'); await p.waitForTimeout(250);
      c = await chips(p);
      ok((await saved(p)).length === 1 && (await BC(p)).pattern === id && c.indexOf('*Evening slow') >= 0 && await E(p, () => localStorage.getItem('entrain.favs')) === JSON.stringify(['b:' + id]), 'Undo brings it back, chosen and starred');

      // a session under it, then deleted: the history keeps its name
      await E(p, () => { document.querySelector('#bLen input[value="2"]').click(); });
      await p.click('#bPanelDone').catch(() => {}); await p.waitForTimeout(300);
      await E(p, () => { const B = window.__entrain.B; document.querySelector('#bStart').click(); B.t0 -= 125; }); await p.waitForTimeout(700);
      const h = await E(p, () => JSON.parse(localStorage.getItem('entrain.history') || '[]'));
      ok(h.length === 1 && h[0].id === id && h[0].n === 'Evening slow' && h[0].full === true, 'a session with it goes in the history under its name: ' + JSON.stringify(h[0] && { id: h[0].id, n: h[0].n }));
      await p.click('#bAdjust'); await p.waitForTimeout(400);
      await p.click('#bMyDel'); await p.waitForTimeout(250);
      await E(p, () => location.hash = 'history'); await p.waitForTimeout(400);
      const he = await E(p, () => { const a = document.querySelector('#hiBody li.hi-e a'); return a ? a.querySelector('b').textContent + ' ' + a.getAttribute('href') : ''; });
      ok(he === 'Evening slow #breathe', 'deleted, it keeps its name there, and leads to the guide: ' + he);
      await p.screenshot({ path: OUT + 'choices-m-history.png' });
      await p.context().close();

      // twelve already: no room; damaged entries are dropped
      const twelve = Array.from({ length: 12 }, (_, i) => ({ uid: 'p' + i, name: 'Pattern ' + i, t: { inh: 4, sip: 0, hold: 0, exh: 5 + i * 0.5, rest: 0 }, at: i }));
      const junk = [{ uid: 'p0', name: 'Again', t: twelve[0].t }, { uid: 'BAD!', name: 'x', t: twelve[0].t }, { uid: 'zz', name: '', t: twelve[0].t }, { uid: 'zy', name: 'Odd', t: { inh: 4.3, sip: 0, hold: 0, exh: 6, rest: 0 } }, { uid: 'zx', name: 'Big', t: { inh: 40, sip: 0, hold: 0, exh: 6, rest: 0 } }, null, 7];
      const q = await page(Object.assign(OPT(), { myBreaths: JSON.stringify(twelve.slice(0, 3).concat(junk, twelve.slice(3))), breath: JSON.stringify({ pattern: 'custom', inh: 3.5, sip: 0, hold: 0, exh: 9, rest: 0, minutes: 5, visual: 'circle', sound: 'off', cue: 40 }) }));
      await E(q, () => location.hash = 'breathe'); await q.waitForTimeout(300);
      ok(await E(q, () => window.__entrain.MP.list.map(x => x.uid).join(' ')) === twelve.map(x => x.uid).join(' '), 'stored entries that are damaged or doubled are left out, and the twelve good ones kept in order');
      await q.click('#bAdjust'); await q.waitForTimeout(400);
      r = await row(q);
      ok(r.dis && r.saveOff && /^You have 12 saved patterns, as many as there's room for\. Delete one to save another\.$/.test(r.hint), 'with twelve saved there is no room for another: ' + r.hint);
      await q.screenshot({ path: OUT + 'choices-m-full.png' });
      await pick(q, 'my-p4'); await q.waitForTimeout(250);
      await q.click('#bMyDel'); await q.waitForTimeout(250);
      await slide(q, '#bExh', 11);
      r = await row(q);
      ok(!r.dis && !r.saveOff && (await saved(q)).length === 11, 'deleting one makes room');
      await q.fill('#bMyName', ''); await q.click('#bMySave'); await q.waitForTimeout(200);
      ok((await saved(q)).slice(-1)[0].name === 'My pattern 12', 'saved without a name, it gets a free one: ' + (await saved(q)).slice(-1)[0].name);
      await q.context().close();

      // a backup counts them, and refuses a damaged list of them
      const DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'entrain-choices-'));
      const bk = d => { const f = path.join(DIR, Math.random().toString(36).slice(2) + '.json'); fs.writeFileSync(f, JSON.stringify({ app: 'Entrain', kind: 'backup', version: 1, savedAt: new Date().toISOString(), data: d })); return f; };
      const s = await page(OPT());
      await E(s, () => location.hash = 'settings'); await s.waitForTimeout(400);
      await s.setInputFiles('#stLoad', bk({ history: '[]', myBreaths: JSON.stringify(twelve.slice(0, 2)) })); await s.waitForTimeout(250);
      const offer = await t(s, '#stRestore');
      ok(/2 breathing patterns, with your settings\./.test(offer), 'a backup says how many breathing patterns it holds: ' + offer);
      await s.setInputFiles('#stLoad', bk({ history: '[]', myBreaths: '{"a":1}' })); await s.waitForTimeout(250);
      ok(/damaged/.test(await t(s, '#stRestore')), 'and refuses one whose list of them is damaged');
      await s.context().close();
    }

    /* N. one safety note: written once, in Learn, and opened over any page from a "safety notes" link;
       each page shows only the line that matters there */
    if (!only || only === 'N') {
      const p = await page(OPT());
      ok(!/Not for everyone/.test(await E(p, () => document.documentElement.innerHTML)), 'the paragraph repeated on five pages is gone');
      const learn = await E(p, () => ({ toc: !!document.querySelector('.toc a[href="#l-safety"]'), h: document.querySelector('#l-safety').textContent,
        items: [...document.querySelectorAll('#sfNote .sf-list li b')].map(b => b.textContent) }));
      ok(learn.toc && learn.h === 'Safety' && learn.items.join(' | ') === 'The beats. | Headphones with a pacemaker. | Breathing. | Moving. | Feelings. | Food and supplements.', 'Learn holds the whole note, under Safety: ' + learn.items.join(' | '));
      const opened = async (from) => {
        await p.click(from); await p.waitForTimeout(250);
        return E(p, () => { const m = document.querySelector('#sfModal'), b = document.querySelector('#sfBody');
          return { open: !m.hidden, same: b.textContent === document.querySelector('#sfNote').textContent, ids: b.querySelectorAll('[id]').length,
            focus: document.activeElement.id, top: m.querySelector('.modal-card').scrollTop }; });
      };
      let o = await opened('.td-safety [data-safety]');
      ok(o.open && o.same && !o.ids && o.focus === 'sfClose' && o.top === 0, 'Today\'s "Safety notes" opens the same note over the page, from its top: ' + JSON.stringify(o));
      await p.screenshot({ path: OUT + 'choices-n-note.png' });
      await p.keyboard.press('Tab'); await p.keyboard.press('Tab');
      ok(await E(p, () => !!document.activeElement.closest('#sfModal')), 'Tab stays inside it');
      await p.keyboard.press('Escape'); await p.waitForTimeout(200);
      ok(await E(p, () => document.querySelector('#sfModal').hidden && document.activeElement.matches('.td-safety [data-safety]')), 'Escape closes it, back where you were');

      const box = h => E(p, h => new Promise(r => { location.hash = h; setTimeout(() => r([...document.querySelectorAll('.view:not([hidden]) .si-caution')].map(e => e.textContent.trim())), 350); }), h);
      const BEATS = 'Ask your doctor first if you have epilepsy or another seizure disorder, keep headphones at least 15 cm (6 in) from a pacemaker or implanted defibrillator, and never listen while driving. Safety notes';
      for (const h of ['track/theta-meditation', 'builder', 'prime']) {
        const c = await box(h);
        ok(c.length === 1 && c[0] === BEATS, h + ': the line about the beats, and the link: ' + c[0]);
      }
      let c = await box('practice/coherence');
      ok(c.length === 1 && c[0] === 'About its binaural beat: a' + BEATS.slice(1), 'a practice with a beat says the same about its beat, where it was missing before');
      c = await box('practice/kapalabhati');
      ok(c.length === 1 && /^Skip this one if you are pregnant/.test(c[0]) && /Safety notes$/.test(c[0]), 'a practice\'s own cautions come with the link: ' + c[0].slice(0, 60) + '…');
      ok((await box('practice/grounding')).length === 0, 'one with neither a beat nor cautions shows no box');
      await box('practice/coherence');
      o = await opened('#sIntro .si-caution [data-safety]');
      ok(o.open && o.same, 'its link opens the note');
      await p.click('#sfClose'); await p.waitForTimeout(200);

      await E(p, () => location.hash = 'practice'); await p.waitForTimeout(350);
      ok(/read the safety notes before you start/.test(await t(p, '.pr-note')), 'the library\'s footer points to the note: ' + await t(p, '.pr-note'));
      await E(p, () => location.hash = 'breathe'); await p.waitForTimeout(300);
      ok(/Leave out the holds .*Safety notes$/.test(await t(p, '.b-safety')), 'Breathe keeps its line about the breath, with the link');

      await p.click('#tbFind'); await p.waitForTimeout(150); await p.fill('#fdIn', 'pacemaker'); await p.waitForTimeout(250);
      const hit = await E(p, () => [...document.querySelectorAll('.fd-it')].map(a => a.querySelector('b').textContent + ' ' + a.getAttribute('href')));
      ok(hit.some(h => /^Headphones with a pacemaker #lx-/.test(h)), 'search finds it: ' + hit.slice(0, 3).join(' · '));
      await p.context().close();
    }

    /* F. the library's filters combine: one goal or several, one technique or several, and the panel's
       length, posture and needs, one or several each; chips count what they'd show; a line says what's
       chosen and clears it; the focus stays on the chip you pressed */
    if (!only || only === 'F') {
      const p = await page(OPT());
      await E(p, () => location.hash = 'practice'); await p.waitForTimeout(400);
      const st = () => E(p, () => {
        const chips = s => [...document.querySelectorAll(s + ' button')].map(b => ({ v: b.dataset.f || b.dataset.m || b.dataset.v, on: b.getAttribute('aria-pressed') === 'true', n: b.querySelector('.cnt') ? parseInt(b.querySelector('.cnt').textContent.replace(/\D+/g, ''), 10) : null, zero: b.classList.contains('zero') }));
        const rows = [...document.querySelectorAll('#prLib .pr-grp')].map(g => ({ g: g.dataset.g, h: g.querySelector('h2').textContent, items: [...g.querySelectorAll('li.pc')].map(li => ({ href: li.querySelector('a').getAttribute('href'), sub: li.querySelector('.pc-sub').textContent })) }));
        const sum = document.querySelector('#prSum');
        return { goals: chips('#prFilt'), meth: chips('#prMeth'), rows, sum: sum.hidden ? null : [...sum.children].map(c => c.textContent.trim()).join(' '), focus: document.activeElement && (document.activeElement.dataset.f || document.activeElement.dataset.m || document.activeElement.dataset.v || document.activeElement.id) };
      });
      const items = s => [].concat(...s.rows.map(r => r.items));
      const goalOf = await E(p, () => { const o = {}; window.__entrain.libAll().forEach(it => { o[it.href] = [it.goal].concat(it.also); }); return o; });
      let s = await st();
      ok(s.goals[0].v === 'all' && s.goals[0].on && s.goals[0].n === null && s.goals.slice(1).every(c => !c.on && c.n > 0) && s.meth[0].v === 'all' && s.meth[0].on && s.meth.length === 8 && s.sum === null,
        'two rows of chips, goals and techniques, each with how many it holds: ' + s.goals.slice(1).map(c => c.v + ' ' + c.n).join(', '));
      await p.click('#prFilt [data-f=calm]'); await p.waitForTimeout(150);
      await p.click('#prMeth [data-m=breath]'); await p.waitForTimeout(150);
      s = await st();
      let it = items(s), calm = s.goals.find(c => c.v === 'calm');
      ok(s.rows.map(r => r.g).join() === 'calm,also' && it.length === calm.n && it.every(x => /^Breathing/.test(x.sub)) && s.meth.find(c => c.v === 'breath').on && !s.meth[0].on,
        'a goal and a technique together: Calm and Breathing, ' + it.length + ' items, as its chip said');
      ok(s.sum === it.length + ' matches Calm Breathing Clear all' && s.focus === 'breath', 'the line under the chips says what\'s chosen; the chip you pressed keeps the focus: ' + s.sum);
      ok(s.goals.filter(c => c.zero).map(c => c.v).join() === s.goals.filter(c => c.n === 0).map(c => c.v).join() && s.goals.some(c => c.zero), 'goals with nothing to add are dimmed: ' + s.goals.filter(c => c.zero).map(c => c.v).join(', '));
      await p.click('#prFilt [data-f=sleep]'); await p.click('#prMeth [data-m=meditate]'); await p.waitForTimeout(150);
      s = await st(); it = items(s);
      const hrefs = it.map(x => x.href);
      ok(s.rows.map(r => r.g).join() === 'sleep,calm,also' && s.rows[2].h === 'Also good for sleep or calm' && hrefs.length === new Set(hrefs).size &&
        hrefs.every(h => (goalOf[h] || []).some(g => g === 'sleep' || g === 'calm')) && it.every(x => /^(Breathing|Meditation)/.test(x.sub)),
        'several goals and several techniques: each chosen goal with its own, then what\'s also good for either, each listed once (' + it.length + ')');
      ok(s.sum === it.length + ' matches Sleep or Calm Breathing or Meditation Clear all', 'in words: ' + s.sum);
      const wide = await E(p, () => [document.documentElement.scrollWidth, innerWidth]);
      ok(wide[0] <= 412 && wide[1] === 412, 'the rows of chips scroll inside the page, which stays the width of the phone: ' + wide.join(' / '));
      await p.click('#prFbtn'); await p.waitForTimeout(150);
      await p.click('#prPanel [data-k=len][data-v="5"]'); await p.click('#prPanel [data-k=len][data-v="10"]'); await p.waitForTimeout(150);
      const short = await E(p, () => { const m = {}; window.__entrain.libAll().forEach(it => { m[it.href] = it.mins[0]; }); return [...document.querySelectorAll('#prLib li.pc a')].map(a => m[a.getAttribute('href')]); });
      s = await st();
      ok(await t(p, '#prFbtnTxt') === 'Filters · 2' && short.length && short.every(x => x <= 10.5) && /Up to 5 min or up to 10 min/.test(s.sum),
        'two lengths add up, the panel counts them: ' + s.sum);
      ok(s.focus === '10' || s.focus === 'len', 'and the focus stays on the length you pressed');
      await p.click('#prPanel [data-clear]'); await p.waitForTimeout(150);
      ok(await t(p, '#prFbtnTxt') === 'Filters' && (await st()).goals.filter(c => c.on).length === 2, 'the panel\'s Clear these clears only its own rows');
      await p.screenshot({ path: OUT + 'choices-f-combined.png' });
      await p.click('#prSum [data-clear]'); await p.waitForTimeout(150);
      s = await st();
      ok(s.goals[0].on && s.meth[0].on && s.sum === null && s.rows.length === 8 && s.focus === 'all', 'Clear all brings everything back');
      // Heart Coherence is under Lying now
      await p.click('#prPanel [data-k=posture][data-v=lie]').catch(async () => { await p.click('#prFbtn'); await p.click('#prPanel [data-k=posture][data-v=lie]'); });
      await p.waitForTimeout(150);
      ok(await p.$('#prLib a[href="#practice/coherence"]') !== null && /Sitting or lying/.test(await t(p, '#prLib a[href="#practice/coherence"] .pc-sub')), 'Heart Coherence shows under Lying, "sitting or lying"');
      await p.context().close();
    }

    /* R. Heart Coherence: three minutes of heart-focused breathing, then gratitude, and why in that order;
       sitting or lying down; the beat it plays, or none; your resonance pace or your own in and out; 10 to 20 minutes */
    if (!only || only === 'R') {
      const RES = JSON.stringify({ at: Date.now() - 864e5, best: 6, res: [[6.5, 6.1], [6, 8.4], [5.5, 7.9], [5, 7.2], [4.5, 6.8]].map(x => ({ rate: x[0], amp: x[1], n: 12 })) });
      const p = await page(Object.assign(OPT({ audio: true }), { optsOpen: '1', resonance: RES }));
      await E(p, () => location.hash = 'practice/coherence'); await p.waitForTimeout(400);
      const plan = (len) => E(p, len => { const X = window.__entrain, d = X.pDef('coherence'); return X.pPlan(d, len).steps.map(s => ({ title: s.title, secs: s.secs, t: s.t, lines: (s.lines || []).map(l => [l[0], String(l[1])]) })); }, len);
      const intro = await E(p, () => ({ steps: [...document.querySelectorAll('.si-steps li')].map(l => l.textContent.replace(/\s+/g, ' ')), lens: [...document.querySelectorAll('.si-len button')].map(b => b.textContent + (b.getAttribute('aria-checked') === 'true' ? '*' : '')).join(' '), how: document.querySelector('.si-main > p').textContent }));
      ok(intro.steps.join(' | ') === 'Arrive00:45 | Heart-focused breathing03:00 | Breathing with gratitude10:00 | Return01:15' && intro.lens === '10 min 15 min* 20 min',
        'three minutes of heart-focused breathing, then breathing with gratitude; 10, 15 or 20 minutes: ' + intro.steps.join(' | '));
      ok(/Gratitude comes second because it's easiest to feel, rather than just think, once slow breathing has calmed you/.test(intro.how) && /after a meditation such as Anapana or the Body Scan/.test(intro.how),
        'it says why gratitude comes after the breathing, and that it fits after a meditation');
      let pl = await plan(15);
      ok(/gratitude/.test(pl[2].lines[0][1]) && pl[1].secs === 180 && /Sit comfortably/.test(pl[0].lines[0][1]) && pl[1].t.inh === 5 && pl[1].t.exh === 5 && /evenly, 6 a minute/.test(pl[1].lines[0][1]),
        'at your resonance rate from the test (6 a minute: 5 s in, 5 s out), sitting');
      ok(/^Your resonance rate, even in and out: 6 breaths a minute, from your resonance test/.test(await t(p, '#sPaceNote')) && await t(p, '#sOptPace [aria-pressed=true]') === 'Optimal defaults',
        'the optimal default is your resonance rate, and says where it comes from: ' + await t(p, '#sPaceNote'));
      // lying down
      await p.click('[data-choice="pos"] button[data-v="lie"]'); await p.waitForTimeout(100);
      pl = await plan(15);
      ok(/^Lie on your back/.test(pl[0].lines[0][1]) && /roll onto your side before you sit up/.test(pl[3].lines[pl[3].lines.length - 1][1]) && /^Lying down/.test(await t(p, '#sOptsSum')) &&
        await E(p, () => document.activeElement.dataset.v) === 'lie', 'lying down: lie on your back, roll onto your side at the end; the summary says so');
      // the beat
      await p.click('#sOptBeat button[data-v="off"]'); await p.waitForTimeout(100);
      ok(await E(p, () => JSON.parse(localStorage.getItem('entrain.pOpt.coherence') || '{}').audio) === false && /No beats/.test(await t(p, '#sOptsSum')) && /^No beat/.test(await t(p, '#sBeatNote')), 'the beat can be off');
      await p.click('#sOptBeat button[data-v="alpha"]'); await p.waitForTimeout(100);
      ok(/Alpha 10 Hz/.test(await t(p, '#sOptsSum')) && /steady 10 Hz/.test(await t(p, '#sBeatNote')) && JSON.parse(await E(p, () => localStorage.getItem('entrain.pCh.coherence'))).beat === 'alpha', 'or alpha 10 Hz instead of theta: ' + await t(p, '#sBeatNote'));
      // your own pace
      await p.click('#sOptPace button[data-v="own"]'); await p.waitForTimeout(100);
      ok(await p.$eval('#sPaceSteps', e => !e.hidden) && await t(p, '#sPace-inh') === '5 s' && await t(p, '#sPace-exh') === '5 s', 'your own pace starts from the resonance pace');
      for (let i = 0; i < 1; i++) await p.click('#sPaceSteps [data-k="inh"] button[data-d="-1"]');
      for (let i = 0; i < 2; i++) await p.click('#sPaceSteps [data-k="exh"] button[data-d="1"]');
      await p.waitForTimeout(100);
      pl = await plan(15);
      ok(await t(p, '#sPace-inh') === '4.5 s' && await t(p, '#sPace-exh') === '6 s' && /^5\.7 breaths a minute, at your own in and out/.test(await t(p, '#sPaceNote')) &&
        pl[1].t.inh === 4.5 && pl[1].t.exh === 6 && pl[2].t.inh === 4.5 && /^Breathe in for 4\.5 seconds and out for 6 seconds/.test(pl[1].lines[0][1]),
        'in 4.5 s, out 6 s: both breathing steps follow, and the guidance says so: ' + await t(p, '#sPaceNote'));
      const inhMinus = '#sPaceSteps [data-k="inh"] button[data-d="-1"]';
      for (let i = 0; i < 8; i++) await p.click(inhMinus, { force: true });     // past the end too: Playwright won't press an aria-disabled button by itself
      ok(await t(p, '#sPace-inh') === '2 s' && await p.$eval(inhMinus, b => b.getAttribute('aria-disabled')) === 'true' && await E(p, () => document.activeElement.getAttribute('data-d')) === '-1', 'it stops at 2 s, and the button keeps the focus');
      for (let i = 0; i < 5; i++) await p.click('#sPaceSteps [data-k="inh"] button[data-d="1"]');
      // 10 minutes, and the lines all inside their steps
      await p.click('.si-len button[data-len="10"]'); await p.waitForTimeout(250);
      const p10 = await plan(10), tot = p10.reduce((a, s) => a + s.secs, 0);
      ok(tot === 600 && p10[2].secs === 300 && p10.every(s => s.lines.every((l, i) => l[0] >= 0 && l[0] < s.secs && (!i || l[0] > s.lines[i - 1][0]))), '10 minutes: ' + p10.map(s => s.title + ' ' + s.secs).join(', '));
      await p.screenshot({ path: OUT + 'choices-r-options.png', fullPage: true });
      // it plays what was chosen
      await p.click('#sGo'); await p.waitForTimeout(900);
      const a = await E(p, () => { const A = window.__entrain.A; return { band: A.track && A.track.band, pts: A.track && JSON.stringify(A.track.pts), min: A.track && A.track.minutes }; });
      ok(a.band === 'Alpha' && a.pts === '[[0,10],[1200,10]]' && a.min === 10, 'the session plays the alpha beat for its 10 minutes: ' + JSON.stringify(a));
      await p.click('#sNext'); await p.waitForTimeout(400);
      ok(await E(p, () => [window.__entrain.BC.inh, window.__entrain.BC.exh].join()) === '4.5,6' && /in for 4\.5 seconds/.test(await t(p, '#sLine')), 'and breathes at your own pace: ' + await t(p, '#sLine'));
      await p.click('#sNext'); await p.waitForTimeout(400);
      ok(/gratitude/.test(await t(p, '#sLine')), 'then turns to gratitude: ' + (await t(p, '#sLine')).slice(0, 70) + '…');
      await p.context().close();
      // the rate without a test, and Learn
      const q = await page(Object.assign(OPT(), { optsOpen: '1' }));
      await E(q, () => location.hash = 'practice/coherence'); await q.waitForTimeout(400);
      ok(/^Your resonance rate, even in and out: 5\.5 breaths a minute, the usual one, until you take the resonance test on the Heart tab/.test(await t(q, '#sPaceNote')), 'without a test it\'s 5.5 a minute, and says how to find yours');
      await E(q, () => location.hash = 'l-breathing'); await q.waitForTimeout(400);
      ok(/three\s+minutes of slow, heart-focused breathing first, then gratitude/.test(await t(q, '#v-learn')) && /McCraty, R\., Atkinson, M\., Tiller, W\. A\., Rein, G\., & Watkins, A\. D\. \(1995\)/.test(await t(q, '#v-learn')),
        'Learn explains the order, with its reference');
      await q.context().close();
    }

    /* W. wording that names its study: no "the same trial" or "the vigilance study" left */
    if (!only || only === 'W') {
      const p = await page(OPT());
      const html = await E(p, () => document.documentElement.innerHTML);
      const vague = ['faster beta arm', 'Should to Choose', 'the vigilance study', 'post-exercise HRV study', 'frequency tied to', 'sleep-stage trial', 'the anxiety protocol',
        'the frequency shown to', 'where autonomic effects', 'most anxiety protocols', 'some people and not others', 'the exact pairing', 'most contested claim', 'worked best for beginners', 'used in the trial', 'band reviews'];
      const left = vague.filter(v => html.indexOf(v) >= 0);
      ok(!left.length, 'none of the vague phrases are left' + (left.length ? ': ' + left.join(', ') : ''));
      const tr = await E(p, () => { const o = {}; window.__entrain.TRACKS.forEach(t => { o[t.id] = t.desc; }); return o; });
      ok(/Lane and colleagues' 1998 vigilance trial/.test(tr['sustained-24']) && /the higher of the two beta frequencies/.test(tr['sustained-24']) && /the lower of the two/.test(tr['vigilance-16']),
        'the 24 Hz track says which trial and which of its two beta frequencies: ' + tr['sustained-24']);
      await E(p, () => location.hash = 'practice'); await p.waitForTimeout(300);
      await p.click('#prFilt [data-f=reflect]'); await p.waitForTimeout(150);
      ok(/Have-Tos into Choices \(NVC\)/.test(await t(p, '#prLib')) && /Marshall Rosenberg's exercise/.test(await t(p, '#prLib a[href="#practice/nvc-choose"]')), 'From Should to Choose is Have-Tos into Choices (NVC), and says whose exercise it is');
      await p.context().close();
    }

    /* A. while a practice runs: the breathing pace slower or faster (from the next breath), the beat lower or
       higher (gliding there) or off and on again, and Restart, two taps like End */
    if (!only || only === 'A') {
      const p = await page(OPT({ audio: true }), null, { speed: 1, rr: false });
      const st = () => E(p, () => { const X = window.__entrain, q = s => document.querySelector(s), A = X.A;
        return { idx: X.P.idx, K: X.P.paceK, adj: X.P.beatAdj, row: !q('#sAdj').hidden, br: q('#sAdjBr').hidden ? null : q('#sAdjBrV').textContent, bt: q('#sAdjBt').hidden ? null : q('#sAdjBtV').textContent,
          sig: (X.B.pending || X.B.ph || {}).sig || '', playing: A.playing, pts: A.track ? JSON.stringify(A.track.pts) : '', sub: q('#pSub').textContent, live: q('#sLive').textContent,
          hz: A.oscR && A.track ? +(A.oscR.frequency.value - A.track.carrier).toFixed(2) : null, T: X.P.state === 'running' ? 0 : 0 }; });
      await E(p, () => location.hash = 'practice/coherence'); await p.waitForTimeout(400);
      await p.click('#sGo'); await p.waitForTimeout(700);
      let s = await st();
      ok(s.row && s.br === '5.5 /min' && s.bt === '6.0 Hz', 'a practice with breathing and a beat shows both, already during its first step: ' + s.br + ', ' + s.bt);
      await p.click('#sNext'); await p.waitForTimeout(500);
      await p.click('#sAdjBr [data-d="-1"]'); await p.waitForTimeout(150);
      s = await st();
      ok(s.br === '5.0 /min' && /in6\|out6/.test(s.sig) && await t(p, '#sLine') === 'Slower: 5.0 breaths a minute, from the next breath.', 'Breath − slows it to 5 a minute, 6 s in and 6 s out, from the next breath, and says so: ' + s.sig);
      await p.click('#sAdjBr [data-d="1"]'); await p.click('#sAdjBr [data-d="1"]'); await p.waitForTimeout(150);
      s = await st();
      ok(s.br === '6.0 /min' && /in5\|out5/.test(s.sig), 'and + speeds it up: ' + s.br);
      for (let i = 0; i < 14; i++) await p.click('#sAdjBr [data-d="-1"]', { force: true });
      s = await st();
      ok(Math.abs(s.K - 2) < 1e-6 && s.br === '2.7 /min' && await p.$eval('#sAdjBr [data-d="-1"]', b => b.getAttribute('aria-disabled')) === 'true', 'it goes as slow as half the pace and no further: ' + s.br);
      for (let i = 0; i < 6; i++) await p.click('#sAdjBr [data-d="1"]');
      await p.click('#sAdjBt [data-d="1"]'); await p.waitForTimeout(1800);
      s = await st();
      ok(s.adj === 1 && s.pts === '[[0,7],[1200,7]]' && s.bt === '7.0 Hz' && Math.abs(s.hz - 7) < 0.05 && /7\.0 Hz/.test(s.sub) && /7\.0 Hz/.test(s.live) && await t(p, '#sLine') === 'The beat moves to 7.0 Hz, theta.',
        'Beat + moves the beat up 1 Hz, and it glides there: ' + s.hz + ' Hz');
      for (let i = 0; i < 12; i++) await p.click('#sAdjBt [data-d="-1"]');
      s = await st();
      ok(s.pts === '[[0,0.5],[1200,0.5]]' && s.bt === '0.5 Hz' && s.sub.startsWith('Delta'), 'down to 0.5 Hz at the lowest, in half steps below 4 Hz, and its band follows: ' + s.sub);
      for (let i = 0; i < 9; i++) await p.click('#sAdjBt [data-d="1"]');
      await p.click('#sAdjBtOn'); await p.waitForTimeout(1600);
      s = await st();
      ok(!s.playing && s.bt === 'Off' && !/paused/.test(s.live) && await p.$eval('#sAdjBtOn', b => b.getAttribute('aria-pressed')) === 'false', 'the beat can be turned off: it fades, and no "sound paused"');
      await p.click('#sAdjBtOn'); await p.waitForTimeout(900);
      const sync = await E(p, () => { const X = window.__entrain; return [X.A.ctx.currentTime - X.A.startedAt, (performance.now() / 1000) - X.P.t0, X.A.playing]; });
      s = await st();
      ok(sync[2] && Math.abs(sync[0] - sync[1]) < 2.5 && s.bt === '6.0 Hz', 'and on again, where the practice is: ' + sync[0].toFixed(1) + ' s into a ' + sync[1].toFixed(1) + ' s practice, at ' + s.bt);
      await p.screenshot({ path: OUT + 'choices-a-adjust.png' });
      // restart: two taps
      await p.click('#sqRestart'); await p.waitForTimeout(100);
      ok(await t(p, '#sqRestartTxt') === 'Tap again to restart' && await p.$eval('#sqRestart', b => b.classList.contains('armed')), 'Restart asks for a second tap');
      await p.waitForTimeout(3300);
      ok(await t(p, '#sqRestartTxt') === 'Restart', 'and forgets it after three seconds');
      const before = (await st()).br;
      await p.click('#sqRestart'); await p.click('#sqRestart'); await p.waitForTimeout(700);
      s = await st();
      const back = await E(p, () => ({ T: (performance.now() / 1000) - window.__entrain.P.t0, step: document.querySelector('#sStepTxt').textContent, toast: document.querySelector('#toastTxt').textContent }));
      ok(s.idx === 0 && back.T < 2 && /^Step 1 of 4/.test(back.step) && back.toast === 'Started again from the top.' && s.playing && s.br === before && s.bt === '6.0 Hz', 'two taps start it again from the top, keeping the pace and beat you set: ' + back.step + ', ' + s.br);
      await p.click('#sEnd'); await p.click('#sEnd'); await p.waitForTimeout(400);
      await p.context().close();
      // which practices show which controls
      const q = await page(OPT({ audio: true }));
      const shows = async id => { await E(q, i => location.hash = 'practice/' + i, id); await q.waitForTimeout(300); await q.click('#sGo'); await q.waitForTimeout(500);
        const r = await E(q, () => ({ row: !document.querySelector('#sAdj').hidden, br: !document.querySelector('#sAdjBr').hidden, bt: !document.querySelector('#sAdjBt').hidden, rs: !document.querySelector('#sqRestart').hidden }));
        await q.click('#sEnd'); await q.click('#sEnd'); await q.waitForTimeout(300); return r; };
      const uj = await shows('ujjayi'), ana = await shows('anapana'), hl = await shows('heart-led'), nvc = await shows('nvc-self');
      ok(uj.br && !uj.bt && !ana.row && !hl.bt && ana.rs && !nvc.rs, 'breathing without a beat shows only the pace; Anapana neither; heart-led beats keep the beat to your heart; a reflection has no Restart');
      await q.context().close();
      // a restart after a minute or more keeps what was done as a session ended early
      const r = await page(OPT({ audio: false }), null, { speed: 30, rr: false });
      await E(r, () => location.hash = 'practice/body-scan'); await r.waitForTimeout(300);
      await r.click('#sGo'); await r.waitForTimeout(3000);
      await r.click('#sqRestart'); await r.click('#sqRestart'); await r.waitForTimeout(400);
      const hist = await E(r, () => JSON.parse(localStorage.getItem('entrain.history') || '[]'));
      ok(hist.length === 1 && hist[0].id === 'body-scan' && hist[0].full === false && hist[0].secs >= 60, 'a restart after a minute keeps the minutes done as a session ended early: ' + (hist[0] && hist[0].secs) + ' s');
      await r.context().close();
    }

    /* Q. the new quotes, signed Entrain and kept as written; "just as it is" rather than "exactly as it is" */
    if (!only || only === 'Q') {
      const p = await page(OPT());
      const qs = await E(p, () => { const X = window.__entrain; return ["There's nothing to do but enjoy the view.", 'Health is a state of co-operation.', 'Revolution is an ongoing process of self discovery.',
        'Mindfulness is a great way of "doing nothing".', 'Listening to your body is a sacred act.']
        .map(x => { const q = X.QUOTES.find(y => y[0] === x); return q ? x + ' / ' + (q[1] || 'Entrain') + ' / ' + q[2] : 'missing: ' + x; }); });
      ok(qs.length === 5 && qs.every(x => / \/ Entrain \/ as written$/.test(x)), 'five new quotes, signed Entrain and kept as written: ' + qs.map(x => x.split(' / ')[0]).join(' | '));
      const soft = await E(p, () => window.__entrain.QUOTES.some(q => q[0] === "Observe what's here, just as it is. That is most of the practice."));
      const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
      ok(soft && !/exactly as (it is|they are)|Observe exactly/.test(html), 'the quote and the guidance observe things "just as they are", not "exactly"');
      await p.context().close();
    }

    /* I. the impressum, copyright and licence: in Learn, in its contents, and from Settings; the licence
       file, and the notice every copy of the page carries */
    if (!only || only === 'I') {
      const p = await page(OPT());
      await E(p, () => location.hash = 'settings'); await p.waitForTimeout(400);
      ok(/© 2026 misterclarity\. .*free software under the GNU AGPL, version 3\. Impressum, licence and credits/.test(await t(p, '.st-about')), 'Settings ends with the copyright and licence: ' + await t(p, '.st-about'));
      await p.click('.st-about a[href="#l-impressum"]'); await p.waitForTimeout(900);
      const im = await E(p, () => { const h = document.querySelector('#l-impressum'), s = h.closest('section'), r = h.getBoundingClientRect();
        const lic = s.querySelector('a[rel~="license"]');
        return { view: !document.querySelector('#v-learn').hidden, top: r.top, inView: r.top >= 0 && r.bottom <= innerHeight, txt: s.textContent.replace(/\s+/g, ' '), link: s.querySelector('a').getAttribute('href'), toc: !!document.querySelector('.toc a[href="#l-impressum"]'),
          lic: lic ? lic.getAttribute('href') : '', head: (document.querySelector('link[rel="license"]') || {}).href || '' }; });
      ok(im.view && im.inView && im.toc, 'its link opens Learn at the impressum, which Learn\'s contents list too');
      ok(/personal, non-commercial project by misterclarity/.test(im.txt) && /© 2026 misterclarity\. Entrain is free software under the GNU Affero General Public License, version 3: you may use, study, share and change it\./.test(im.txt) &&
        !/All rights reserved/.test(im.txt) && im.link === 'https://github.com/misterclarity/biney' && im.lic === 'https://www.gnu.org/licenses/agpl-3.0.html' &&
        /Poppins typeface is Copyright 2020 The Poppins Project Authors, used under the SIL Open Font License 1\.1/.test(im.txt), 'the impressum names the project\'s author and page, the copyright, the AGPL and the font\'s licence');
      await p.context().close();
      const root = path.join(__dirname, '..'), rd = f => fs.readFileSync(path.join(root, f), 'utf8');
      const L = rd('LICENSE'), idx = rd('index.html'), prev = fs.existsSync(path.join(root, 'entrain-page.html')) ? rd('entrain-page.html') : '';
      const note = /^<!DOCTYPE html>\n<!--\n  Entrain: [^\n]+\n  Copyright \(C\) 2026 misterclarity\n[\s\S]*?GNU Affero General Public License as published by the Free Software Foundation, version 3\.[\s\S]*?Source: https:\/\/github\.com\/misterclarity\/biney\n[\s\S]*?-->\n<html lang="en">/;
      ok(/^\s+GNU AFFERO GENERAL PUBLIC LICENSE\n\s+Version 3, 19 November 2007\n/.test(L) && /END OF TERMS AND CONDITIONS/.test(L) && L.length > 34000 &&
        note.test(idx) && /<link rel="license" href="https:\/\/www\.gnu\.org\/licenses\/agpl-3\.0\.html">/.test(idx) && (!prev || /^<!--\n  Entrain: /.test(prev)),
        'LICENSE holds the GNU AGPL, version 3, and every copy of the page opens with its notice and a licence link');
    }

    /* K. what the full code check found: fast breathing goes no faster than it was made to; a beat turned
       off stays off through a restart, and a paused one stops; the end screen's panel has a name of its own;
       the routine builder's tiles say their time, level and caution; the safety link is big enough to tap;
       a backup with a damaged choice of a practice's is refused; the embedded font carries its licence */
    if (!only || only === 'K') {
      const p = await page(OPT({ audio: true }));
      await E(p, () => location.hash = 'practice/wim-hof'); await p.waitForTimeout(400);
      await p.click('#sOk'); await p.click('#sGo'); await p.waitForTimeout(600);
      await p.click('#sNext'); await p.waitForTimeout(400);
      const fast = await E(p, () => ({ v: document.querySelector('#sAdjBrV').textContent, plus: document.querySelector('#sAdjBr [data-d="1"]').getAttribute('aria-disabled') }));
      await p.click('#sAdjBr [data-d="1"]', { force: true }); await p.waitForTimeout(100);
      const after = await E(p, () => [document.querySelector('#sAdjBrV').textContent, window.__entrain.P.paceK]);
      await p.click('#sAdjBr [data-d="-1"]'); await p.waitForTimeout(100);
      const slower = await E(p, () => [document.querySelector('#sAdjBrV').textContent, window.__entrain.P.paceK]);
      ok(fast.plus === 'true' && after[1] === 1 && after[0] === fast.v && slower[1] > 1, 'fast breathing goes slower but no faster than it was made to: ' + fast.v + ' → ' + slower[0]);
      await p.click('#sEnd'); await p.click('#sEnd'); await p.waitForTimeout(400);
      await E(p, () => location.hash = 'practice/calm-reset'); await p.waitForTimeout(400);
      await p.click('#sGo'); await p.waitForTimeout(700);
      await p.click('#sPlay'); await p.waitForTimeout(300);
      await p.click('#sAdjBtOn'); await p.waitForTimeout(300);
      const off = await E(p, () => ({ playing: window.__entrain.A.playing, player: document.querySelector('#player').classList.contains('open'), held: window.__entrain.P.audioHeld }));
      await p.click('#sPlay'); await p.waitForTimeout(500);
      const resumed = await E(p, () => window.__entrain.A.playing);
      ok(!off.playing && !off.player && !off.held && !resumed, 'turned off while paused, the beat stops and stays off when the practice resumes');
      await p.click('#sqRestart'); await p.click('#sqRestart'); await p.waitForTimeout(700);
      ok(await E(p, () => !window.__entrain.A.playing && document.querySelector('#sAdjBtV').textContent === 'Off'), 'and a restart keeps it off');
      await p.click('#sEnd'); await p.click('#sEnd'); await p.waitForTimeout(400);
      ok(await E(p, () => { const x = document.querySelector('#sdEx'); return x.getAttribute('aria-label') === 'What this number means' && !x.hasAttribute('aria-labelledby'); }), 'the end screen\'s explanation panel has a name of its own, never a missing one');
      await E(p, () => location.hash = 'yoga'); await p.waitForTimeout(400);
      const tile = await E(p, () => { const b = [...document.querySelectorAll('#ybLib .yb-tile')].find(x => /caution/.test(x.textContent)); return b ? { label: b.getAttribute('aria-label'), dots: b.querySelector('.lv').getAttribute('aria-hidden') } : null; });
      ok(tile && /^Add .+, \d.*, level [123] of 3, with a caution$/.test(tile.label) && tile.dots === 'true', 'a pose tile says its time, level and caution, not just its name: ' + (tile && tile.label));
      await E(p, () => location.hash = 'practice/coherence'); await p.waitForTimeout(400);
      const hit = await E(p, () => { const r = document.querySelector('.si-caution .sf-link').getBoundingClientRect(); return r.height; });
      ok(hit >= 24, 'the safety link inside a caution is ' + Math.round(hit) + ' px tall, enough to tap');
      await p.context().close();
      const DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'entrain-k-')), f = path.join(DIR, 'b.json');
      fs.writeFileSync(f, JSON.stringify({ app: 'Entrain', kind: 'backup', version: 1, savedAt: new Date().toISOString(), data: { history: '[]', 'pCh.coherence': 'nope' } }));
      const q = await page(OPT());
      await E(q, () => location.hash = 'settings'); await q.waitForTimeout(400);
      await q.setInputFiles('#stLoad', f); await q.waitForTimeout(250);
      ok(/damaged/.test(await t(q, '#stRestore')), 'a backup whose choices for a practice are damaged is refused');
      await q.context().close();
      const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8'), ff = html.indexOf('@font-face'), note = html.slice(html.lastIndexOf('/*', ff), ff);
      ok(/Copyright 2020 The Poppins Project Authors/.test(note) && /SIL OPEN FONT LICENSE Version 1\.1/.test(note) && /PERMISSION & CONDITIONS[\s\S]*5\) The Font Software[\s\S]*DISCLAIMER/.test(note) && /\*\/\s*$/.test(note),
        'the embedded font carries its copyright and licence in the page, as the licence asks');
    }

    /* L. Healthy living: a page under Learn, from Learn, Today and search, with two tabs. Recipes have a
       page each, whose servings scale every amount, with ingredients and steps to tick off and the screen
       kept on while you cook. Supplements are cards with the evidence, the amounts studied, what to check
       first and their sources, and the safety note has a line for them */
    if (!only || only === 'L') {
      const p = await page(OPT());
      await E(p, () => location.hash = 'learn'); await p.waitForTimeout(400);
      await p.click('.lv-promo'); await p.waitForTimeout(500);
      const v = await E(p, () => ({ hash: location.hash, view: !document.querySelector('#v-living').hidden, title: document.querySelector('#viewTitle').textContent,
        nav: (document.querySelector('.nav a[aria-current="page"]') || {}).textContent, cards: [...document.querySelectorAll('#lvp-recipes .pc-a')].map(a => a.getAttribute('href')),
        tab: document.querySelector('#lvt-recipes').getAttribute('aria-selected'), w: document.documentElement.scrollWidth }));
      ok(v.hash === '#living' && v.view && v.title === 'Healthy living' && /Learn/.test(v.nav) && v.tab === 'true' && v.w <= 412,
        'Learn\'s card opens Healthy living, under the Learn tab, at Recipes, with nothing wider than the phone');
      ok(v.cards.length === 9 && v.cards.every(h => /^#living\/[a-z-]+$/.test(h)) && v.cards.slice(0, 3).join(' ') === '#living/congee #living/kitchari #living/apple-oats', 'nine recipes, each with its own page: ' + v.cards.map(h => h.slice(8)).join(', '));
      await p.click('#lvp-recipes .pc-a[href="#living/congee"]'); await p.waitForTimeout(450);
      const ing = () => E(p, () => [...document.querySelectorAll('.lv-ing li')].map(l => l.querySelector('label > span').firstChild.textContent + ' ' + l.querySelector('.lv-n').textContent).map(s => s.trim()));
      let r = await E(p, () => ({ title: document.querySelector('#viewTitle').textContent, back: document.querySelector('#lvBody .si-back').getAttribute('href'), n: document.querySelector('#lvServ').textContent,
        kind: document.querySelector('#lvBody .si-kind').textContent, steps: document.querySelectorAll('.lv-steps li').length, top: scrollY }));
      ok(r.title === 'Congee' && r.back === '#living/recipes' && r.n === '4' && r.kind === 'Recipe · 1 h 25 min' && r.steps === 5 && r.top === 0, 'Congee has its own page, from the top, serving 4: ' + r.kind);
      let a = await ing();
      ok(a[0] === '150 g jasmine rice' && a[1] === '1.6 L water, or half water and half light stock' && a[4] === '2 spring onions, thinly sliced', 'its amounts as written: ' + a.slice(0, 2).join(' | '));
      await p.click('.lv-ing li:first-child label'); await p.click('.lv-steps li:nth-child(2) label');
      await p.click('.lv-serv [data-d="1"]'); await p.click('.lv-serv [data-d="1"]'); await p.waitForTimeout(100);
      a = await ing();
      const ticked = await E(p, () => [document.querySelector('.lv-ing li:first-child').classList.contains('done'), document.querySelector('.lv-ing li:first-child input').checked, document.querySelector('.lv-steps li:nth-child(2)').classList.contains('done')]);
      ok(a[0] === '225 g jasmine rice' && a[1] === '2.4 L water, or half water and half light stock' && a[2] === '4.5 cm fresh ginger' && a[3] === '¾ tsp salt' && a[4] === '3 spring onions, thinly sliced' && a[6] === 'soy sauce and ground white pepper, to taste',
        'for 6, every amount scales: ' + a.slice(0, 5).join(' | '));
      ok(ticked.every(Boolean) && /Scaled from 4/.test(await t(p, '#lvServNote')), 'what you ticked stays ticked, and the note says it\'s scaled');
      for (let i = 0; i < 6; i++) await p.click('.lv-serv [data-d="-1"]', { force: true });
      a = await ing();
      const lo = await E(p, () => ({ n: document.querySelector('#lvServ').textContent, minus: document.querySelector('.lv-serv [data-d="-1"]').getAttribute('aria-disabled') }));
      ok(lo.n === '1' && lo.minus === 'true' && a[0] === '40 g jasmine rice' && a[1] === '400 ml water, or half water and half light stock' && a[4] === '½ spring onion, thinly sliced', 'for 1, the amounts follow and the minus button stops: ' + a[0] + ' | ' + a[4]);
      // the screen stays on while you cook, and stops when you leave the recipe
      await p.click('label:has(#lvWake)'); await p.waitForTimeout(300);
      const on = await E(p, () => ({ cook: window.__entrain.LV.cook, req: window.__wl.req, held: window.__wl.held, lock: !!window.__entrain.WL.lock }));
      await E(p, () => location.hash = 'home'); await p.waitForTimeout(400);
      const off = await E(p, () => ({ cook: window.__entrain.LV.cook, rid: window.__entrain.LV.rid, lock: !!window.__entrain.WL.lock, held: window.__wl.held, rel: window.__wl.rel }));
      ok(on.cook && on.req >= 1 && on.held === 1 && on.lock && !off.cook && !off.rid && !off.lock && off.held === 0 && off.rel >= 1, 'Keep the screen on holds a wake lock while the recipe is open, and lets go when you leave it');
      // a starred recipe shows on Today; Today's tile opens the page
      await E(p, () => location.hash = 'living/kitchari'); await p.waitForTimeout(400);
      await p.click('#lvBody .fav'); await p.waitForTimeout(200);
      await E(p, () => location.hash = 'home'); await p.waitForTimeout(500);
      const fav = await E(p, () => [...document.querySelectorAll('#tdFavList .pc-a')].map(x => x.getAttribute('href') + ' ' + x.querySelector('b').textContent));
      ok(fav.length === 1 && fav[0] === '#living/kitchari Kitchari', 'a starred recipe shows in Today\'s favourites: ' + fav.join(', '));
      await p.click('.qk-wide'); await p.waitForTimeout(450);
      ok(await E(p, () => location.hash === '#living' && !document.querySelector('#v-living').hidden), 'Today\'s Healthy living tile opens the page');
      // supplements: a tab of cards, by keyboard too, remembered
      await p.focus('#lvt-recipes'); await p.keyboard.press('ArrowRight'); await p.waitForTimeout(200);
      const sp = await E(p, () => ({ hash: location.hash, sel: document.querySelector('#lvt-supplements').getAttribute('aria-selected'), focus: document.activeElement.id,
        panel: !document.querySelector('#lvp-supplements').hidden && document.querySelector('#lvp-recipes').hidden,
        main: [...document.querySelectorAll('#lvp-supplements .lv-sup:not(.lv-brief)')].map(d => d.id.slice(3)), more: document.querySelectorAll('#lvp-supplements .lv-brief').length,
        box: (document.querySelector('#lvp-supplements .si-caution') || {}).textContent || '',
        refs: [...document.querySelectorAll('#lvp-supplements .lv-sup')].every(d => d.querySelectorAll('.lv-refl a[href^="https://"]').length >= 1),
        shut: [...document.querySelectorAll('#lvp-supplements .lv-sup')].every(d => !d.open) }));
      ok(sp.hash === '#living/supplements' && sp.sel === 'true' && sp.focus === 'lvt-supplements' && sp.panel, 'the arrow keys move between the tabs, and the address follows');
      ok(sp.main.join(' ') === 'omega-3 coq10 creatine vitamin-d magnesium vitamin-b12' && sp.more === 7 && sp.refs && sp.shut,
        'six supplements in full and seven in brief, each with its sources, all closed to start: ' + sp.main.join(', '));
      ok(/^Supplements aren't checked like medicines/.test(sp.box) && /Safety notes$/.test(sp.box), 'the tab opens with the line from the safety note, and the link to the whole note');
      await p.click('#lvp-supplements .si-caution [data-safety]'); await p.waitForTimeout(250);
      ok(await E(p, () => !document.querySelector('#sfModal').hidden && /Food and supplements\. Supplements aren't checked like medicines/.test(document.querySelector('#sfBody').textContent.replace(/\s+/g, ' '))),
        'the safety note itself has a line for food and supplements');
      await p.click('#sfClose'); await p.waitForTimeout(200);
      await p.click('#lv-creatine > summary'); await p.waitForTimeout(150);
      const cr = await E(p, () => { const d = document.querySelector('#lv-creatine'); return { open: d.open, uses: [...d.querySelectorAll('.lv-uses li')].map(l => l.querySelector('b').textContent + ' ' + l.querySelectorAll('.strength i.on').length),
        facts: [...d.querySelectorAll('.lv-facts dt')].map(x => x.textContent), care: d.querySelectorAll('.lv-care li').length }; });
      ok(cr.open && cr.uses[0] === 'Strength and muscle, with training 3' && cr.facts.join(', ') === 'Amounts studied, How to take it, In food' && cr.care >= 3,
        'a card opens to what it may help, with the strength of each, the amounts studied, how to take it, food and what to check: ' + cr.uses.join(' | '));
      await E(p, () => location.hash = 'home'); await p.waitForTimeout(300);
      await E(p, () => location.hash = 'living'); await p.waitForTimeout(400);
      ok(await E(p, () => document.querySelector('#lvt-supplements').getAttribute('aria-selected') === 'true'), 'Healthy living opens again at the tab you had');
      await E(p, () => location.hash = 'living/vitamin-d'); await p.waitForTimeout(700);
      const vd = await E(p, () => { const d = document.querySelector('#lv-vitamin-d'), r = d.getBoundingClientRect(); return { open: d.open, seen: r.top >= 0 && r.top < innerHeight / 2 }; });
      ok(vd.open && vd.seen, 'a supplement\'s address opens its card, scrolled into view');
      // search finds the recipes and supplements
      for (const [q, h] of [['congee', '#living/congee'], ['creatine', '#living/creatine'], ['fish oil', '#living/omega-3'], ['healthy living', '#living']]) {
        await E(p, () => location.hash = 'home'); await p.waitForTimeout(250);
        await p.click('#tbFind'); await p.fill('#fdIn', q); await p.waitForTimeout(200);
        const top = await E(p, () => { const a = document.querySelector('#fdRes .fd-it'); return a ? a.getAttribute('href') + ' / ' + a.closest('.fd-grp').querySelector('h3').firstChild.textContent.trim() : ''; });
        await p.keyboard.press('Enter'); await p.waitForTimeout(500);
        ok(top === h + ' / Healthy living' && await E(p, h => location.hash === h, h), 'search: "' + q + '" finds ' + h + ' first, and Enter opens it');
      }
      // every recipe, at every number of servings, says a sensible amount
      const bad = await E(p, () => { const X = window.__entrain, out = [];
        X.RECIPES.forEach(r => { for (let n = 1; n <= 12; n++) (r.ing.concat(r.serve || [])).forEach(it => { const m = X.lvAmt(it, n / r.serves); if (/NaN|undefined|^0 |Infinity/.test(m.a + ' ' + m.n) || (it[0] !== null && !m.a)) out.push(r.id + ' ' + n + ': ' + m.a + ' ' + m.n); }); });
        return out; });
      ok(!bad.length, 'every ingredient of every recipe has an amount at 1 to 12 servings' + (bad.length ? ': ' + bad.slice(0, 3).join(' | ') : ''));
      const units = await E(p, () => { const f = window.__entrain.lvAmt, c = ['2', 'tin', ['of chickpeas (400 g), drained', 'of chickpeas (400 g each), drained']]; c[0] = 2;
        return [f(c, 0.25), f(c, 1.5), f([1, 'handful', 'of berries'], 2), f([0.25, 'tsp', 'cinnamon'], 3), f([1, '', ['lemon', 'lemons']], 0.5), f([1000, 'ml', 'water'], 0.5)].map(m => m.a + ' ' + m.n); });
      ok(units.join(' | ') === '½ tin of chickpeas (400 g), drained | 3 tins of chickpeas (400 g each), drained | 2 handfuls of berries | ¾ tsp cinnamon | ½ lemon | 500 ml water',
        'tins by the half, handfuls whole, spoons by the quarter, counts by the half: ' + units.join(' | '));
      await E(p, () => location.hash = 'living/apple-oats'); await p.waitForTimeout(450);
      const ap = await E(p, () => ({ why: document.querySelector('#lvBody .si-blurb').textContent, ing: [...document.querySelectorAll('.lv-ing li')].map(l => l.textContent.replace(/\s+/g, ' ').trim()),
        steps: document.querySelectorAll('.lv-steps li').length, kind: document.querySelector('#lvBody .si-kind').textContent }));
      ok(/one of the few dishes said to balance all three doshas \(vata, pitta and kapha\)/.test(ap.why) && /^1 apple, cored and chopped/.test(ap.ing[0]) && /^40 g rolled oats/.test(ap.ing[4]) && ap.steps === 4 && ap.kind === 'Recipe · 17 min',
        'stewed apple with oats, which Ayurveda says balances all three doshas: ' + ap.ing.slice(0, 2).join(' | '));
      await p.context().close();
    }

    /* G. the gratitude practice: slow breathing first, then gratitude in four steps and three good things;
       sitting or lying, your resonance pace or your own, 10 or 15 minutes; in the library, search and Learn */
    if (!only || only === 'G') {
      const p = await page(Object.assign(OPT(), { optsOpen: '1' }));
      await E(p, () => location.hash = 'practice/gratitude'); await p.waitForTimeout(450);
      const plan = (len) => E(p, len => { const X = window.__entrain, d = X.pDef('gratitude'); return X.pPlan(d, len).steps.map(s => ({ title: s.title, secs: s.secs, t: s.t, k: s.k, lines: (s.lines || []).map(l => [l[0], String(l[1])]) })); }, len);
      const intro = await E(p, () => ({ title: document.querySelector('#viewTitle').textContent, steps: [...document.querySelectorAll('.si-steps li')].map(l => l.textContent.replace(/\s+/g, ' ')).join(' | '),
        lens: [...document.querySelectorAll('.si-len button')].map(b => b.textContent + (b.getAttribute('aria-checked') === 'true' ? '*' : '')).join(' '),
        pos: !!document.querySelector('[data-choice="pos"]'), pace: !!document.querySelector('#sOptPace'), beat: !!document.querySelector('#sOptBeat, #sOptAudio'), goal: window.__entrain.pDef('gratitude').goal }));
      ok(intro.title === 'Gratitude' && intro.steps === 'Arrive00:40 | Settling breath03:00 | Something small01:15 | Someone who helped01:45 | Your body01:15 | Savour it01:15 | Three good things00:50' && intro.lens === '10 min* 15 min',
        'Gratitude: three minutes of slow breathing, then something small, someone, your body, savouring and three good things: ' + intro.steps);
      ok(intro.pos && intro.pace && !intro.beat && intro.goal === 'reflect', 'it has a position and a pace to choose, no beat, and lives under Reflect');
      for (const L of [10, 15]) {
        const pl = await plan(L), tot = pl.reduce((a, s) => a + s.secs, 0);
        ok(tot === L * 60 && pl[1].k === 'breath' && pl[1].t.inh === 5.5 && pl[1].t.exh === 5.5 && /evenly, 5\.5 a minute/.test(pl[1].lines[0][1]) &&
          pl.every(s => s.lines.every((l, i) => l[0] >= 0 && l[0] < s.secs && (!i || l[0] > s.lines[i - 1][0]))) && /three good things/.test(pl[6].lines[1][1]),
          L + ' minutes: every line inside its step, the breathing at the resonance pace: ' + pl.map(s => s.secs).join('+'));
      }
      await p.click('[data-choice="pos"] button[data-v="lie"]'); await p.waitForTimeout(100);
      await p.click('#sOptPace button[data-v="own"]'); await p.waitForTimeout(100);
      await p.click('#sPaceSteps [data-k="exh"] button[data-d="1"]'); await p.waitForTimeout(100);
      const pl = await plan(10);
      ok(/^Lie on your back/.test(pl[0].lines[0][1]) && /roll onto your side/.test(pl[6].lines[2][1]) && pl[1].t.inh === 5.5 && pl[1].t.exh === 6 && /^Breathe in for 5\.5 seconds and out for 6 seconds/.test(pl[1].lines[0][1]),
        'lying down and at your own pace, the guidance follows: ' + pl[1].lines[0][1]);
      await p.click('#sGo'); await p.waitForTimeout(700);
      await p.click('#sNext'); await p.waitForTimeout(400);
      ok(await E(p, () => [window.__entrain.BC.inh, window.__entrain.BC.exh].join()) === '5.5,6', 'and breathes at that pace');
      await p.click('#sEnd'); await p.click('#sEnd'); await p.waitForTimeout(400);
      await E(p, () => location.hash = 'home'); await p.waitForTimeout(300);
      await p.click('#tbFind'); await p.fill('#fdIn', 'gratitude'); await p.waitForTimeout(200);
      ok(await E(p, () => (document.querySelector('#fdRes .fd-it') || {}).getAttribute('href')) === '#practice/gratitude', 'search finds it first');
      await p.keyboard.press('Escape');
      await E(p, () => location.hash = 'l-practices'); await p.waitForTimeout(400);
      ok(/Gratitude\. Across 27 trials with 3,675 people/.test(await t(p, '#v-learn')) && /Cregg, D\. R\., & Cheavens, J\. S\. \(2021\)/.test(await t(p, '#v-learn')) && /Seligman, M\. E\. P\./.test(await t(p, '#v-learn')),
        'Learn gives its evidence, with the references');
      await p.context().close();
    }

    /* C. Calm Reset: the same beat and pace choices as Heart Coherence, kept for it */
    if (!only || only === 'C') {
      const p = await page(Object.assign(OPT({ audio: true }), { optsOpen: '1' }));
      await E(p, () => location.hash = 'practice/calm-reset'); await p.waitForTimeout(450);
      const plan = () => E(p, () => { const X = window.__entrain; return X.pPlan(X.pDef('calm-reset'), 0).steps.map(s => ({ title: s.title, t: s.t, lines: (s.lines || []).map(l => String(l[1])) })); });
      const o = await E(p, () => ({ beats: [...document.querySelectorAll('#sOptBeat button')].map(b => b.textContent + (b.getAttribute('aria-pressed') === 'true' ? '*' : '')).join(' '),
        pace: (document.querySelector('#sOptPace [aria-pressed="true"]') || {}).textContent, toggle: !!document.querySelector('#sOptAudio') }));
      ok(o.beats === 'Off Alpha to theta* Theta 6 Hz Alpha 10 Hz' && o.pace === 'Optimal defaults' && !o.toggle, 'Calm Reset offers the beats and the pace: ' + o.beats);
      let pl = await plan();
      ok(pl[1].t.inh === 3 && pl[1].t.sip === 1 && pl[1].t.exh === 6 && pl[2].t.inh === 5.5 && pl[2].t.exh === 5.5 && /^Now even breaths in and out, 5\.5 a minute/.test(pl[2].lines[0]), 'as usual: cyclic sighs, then 5.5 a minute');
      await p.click('#sOptBeat button[data-v="theta"]'); await p.waitForTimeout(100);
      await p.click('#sOptPace button[data-v="own"]'); await p.waitForTimeout(100);
      await p.click('#sPaceSteps [data-k="inh"] button[data-d="-1"]'); await p.click('#sPaceSteps [data-k="inh"] button[data-d="-1"]');
      await p.click('#sPaceSteps [data-k="exh"] button[data-d="1"]'); await p.waitForTimeout(100);
      pl = await plan();
      ok(pl[1].t.inh === 3 && pl[1].t.exh === 6 && pl[2].t.inh === 4.5 && pl[2].t.exh === 6 && /^Now breathe in for 4\.5 seconds and out for 6 seconds/.test(pl[2].lines[0]) &&
        /Theta 6 Hz/.test(await t(p, '#sOptsSum')) && /In 4\.5 s, out 6 s/.test(await t(p, '#sOptsSum')), 'theta and an in and out of your own: the sighs stay as they are, the resonance breathing follows: ' + await t(p, '#sOptsSum'));
      const kept = await E(p, () => JSON.parse(localStorage.getItem('entrain.pCh.calm-reset') || '{}'));
      ok(kept.beat === 'theta' && kept.pace === 'own' && kept.inh === 4.5 && kept.exh === 6, 'kept for Calm Reset: ' + JSON.stringify(kept));
      await p.click('#sGo'); await p.waitForTimeout(900);
      const a = await E(p, () => { const A = window.__entrain.A; return { band: A.track && A.track.band, pts: A.track && JSON.stringify(A.track.pts), min: A.track && A.track.minutes }; });
      ok(a.band === 'Theta' && a.pts === '[[0,6],[600,6]]' && a.min === 10, 'it plays the theta beat: ' + JSON.stringify(a));
      await p.click('#sEnd'); await p.click('#sEnd'); await p.waitForTimeout(300);
      await p.context().close();
    }

    /* U. an update installs itself only when a reload would cut nothing short: no practice, breathing
       session or test, no track partway through, no sensor, no search or typing, no recipe on the go */
    if (!only || only === 'U') {
      const p = await page(OPT({ audio: true }));
      const busy = () => E(p, () => window.__entrain.appBusy());
      const idle0 = await busy();
      await E(p, () => location.hash = 'breathe'); await p.waitForTimeout(300);
      await p.click('#bStart'); await p.waitForTimeout(400);
      const br = await busy();
      await p.click('#bStart'); await p.waitForTimeout(150);
      const brPaused = await busy();
      await p.click('#bReset'); await p.waitForTimeout(250);
      const brDone = await busy();
      await E(p, () => location.hash = 'living/congee'); await p.waitForTimeout(400);
      const rec0 = await busy();
      await p.click('.lv-steps li:first-child label'); await p.waitForTimeout(100);
      const rec1 = await busy();
      await E(p, () => location.hash = 'home'); await p.waitForTimeout(300);
      await p.click('#tbFind'); await p.waitForTimeout(200);
      const find = await busy();
      await p.keyboard.press('Escape'); await p.waitForTimeout(200);
      await E(p, () => location.hash = 'practice/body-scan'); await p.waitForTimeout(300);
      await p.click('#sGo'); await p.waitForTimeout(500);
      const pr = await busy();
      await p.click('#sEnd'); await p.click('#sEnd'); await p.waitForTimeout(400);
      const prDone = await busy();
      ok(!idle0 && br && brPaused && !brDone && !rec0 && rec1 && find && pr && !prDone,
        'an update waits while a breathing session runs or is paused, a recipe has ticks, search is open or a practice runs: ' + [idle0, br, brPaused, brDone, rec0, rec1, find, pr, prDone].join(' '));
      await p.context().close();
    }

    /* B. connecting a sensor can't get stuck at Connecting…: each step has a deadline and is tried again,
       the button reads Cancel meanwhile, and the message says which step it's on, or what to do */
    if (!only || only === 'B') {
      const st = q => E(q, () => ({ st: window.__entrain.H.state, tries: window.__hrTries(), msg: document.querySelector('#hrMsg').textContent,
        btn: document.querySelector('#hrConnect').textContent, dis: document.querySelector('#hrConnect').getAttribute('aria-disabled'),
        guide: (document.querySelector('#gCheck li[data-k="conn"] .s') || {}).textContent, pill: document.querySelector('#tbSensorTxt').textContent }));
      const FORCE = /Garmin Connect on this phone may be holding on to the watch: in your phone's Settings, open Apps, then Garmin Connect, and tap Force stop/;
      const PAIR = " If the watch or the phone asked you to confirm a pairing or showed a code, accept it next time (there's half a minute); on some phones the request waits in the notifications. Otherwise turn your phone's Bluetooth off and on, restart the broadcast, and try again.";
      const HINT = " If the watch or the phone asks you to confirm a pairing or shows a code, accept it. Your phone's name on the watch's broadcast screen only means the two are linked.";
      const LISTED = ' What happened on each try is listed below.';
      const msgHas = (p, s, ms) => p.waitForFunction(s => document.querySelector('#hrMsg').textContent.includes(s), s, { timeout: ms || 3000 }).catch(() => {});
      const until = (p, state, ms) => p.waitForFunction(s => window.__entrain.H.state === s, state, { timeout: ms }).catch(() => {});
      const open = async opts => { const p = await page(OPT(), null, Object.assign({ speed: 1, rr: false }, opts)); await E(p, () => location.hash = 'heart'); await p.waitForTimeout(300); await p.click('#hrConnect'); return p; };
      const tries = p => E(p, () => { const d = document.querySelector('#hrLog'); return { shown: !d.hidden, open: d.open, li: [...d.querySelectorAll('li')].map(l => l.textContent.replace(/\u00a0/g, ' ')), env: document.querySelector('#hrLogEnv').textContent }; });
      const S = '[\\d.]+ s';     // a time it took
      // readings that never start the first time: after a few seconds the message says to confirm a pairing request, and a second, slower try goes through
      let p = await open({ hang: 'read', hangOnce: true, quick: 0.1 });
      await p.waitForTimeout(150);
      const mid = await st(p);
      ok(mid.st === 'busy' && mid.msg.startsWith('Connecting to Venu 4: starting its heart-rate readings…') && mid.btn === 'Cancel' && mid.dis === 'false' && /^Starting its heart-rate readings/.test(mid.guide) && mid.pill === 'Connecting…',
        'while it connects, the message and the guide say which step it is on, and the button reads Cancel: ' + mid.msg);
      await msgHas(p, 'confirm a pairing');
      const hint = await st(p);
      ok(hint.st === 'busy' && hint.msg === 'Connecting to Venu 4: starting its heart-rate readings…' + HINT, 'a few seconds in, it says to accept a pairing request, and what your phone\'s name on the watch means: ' + hint.msg);
      await msgHas(p, 'giving it a few seconds to settle, try 2 of 3');
      const set2 = await st(p);
      ok(set2.msg === 'Connecting to Venu 4: giving it a few seconds to settle, try 2 of 3…' && /^Giving it a few seconds to settle, try 2/.test(set2.guide), 'the second try gives it a few seconds to settle first: ' + set2.msg);
      await until(p, 'on', 6000);
      const r1 = await st(p);
      ok(r1.st === 'on' && r1.tries === 2 && r1.msg === '' && r1.btn === 'Disconnect' && !(await tries(p)).shown, 'readings that never start the first time: the slower try connects (' + r1.tries + ' tries)');
      await p.waitForTimeout(1500);
      ok(await E(p, () => window.__entrain.H.hr > 0), 'and the heart rate comes in');
      ok(await E(p, () => localStorage.getItem('entrain.hrSettle')) === '{"Venu 4":6000}', 'the wait that worked is kept for this sensor');
      await p.click('#hrConnect'); await p.waitForTimeout(200);
      await p.click('#hrConnect'); await p.waitForTimeout(150);
      const again = await st(p);
      await until(p, 'on', 4000);
      const r1b = await st(p);
      ok(again.msg === 'Connecting to Venu 4: giving it a few seconds to settle…' && r1b.st === 'on' && r1b.tries === 3 && await E(p, () => window.__entrain.H.attempt) === 1,
        'and the next time, the first try starts with it: ' + again.msg);
      await p.context().close();
      // a step that answers late, as once a pairing request is accepted: it connects on the first try (a sensor other than a Garmin watch)
      p = await open({ rr: true, late: { read: 900 }, quick: 0.1 });
      await msgHas(p, 'If your phone asks to pair');
      const l0 = await st(p);
      await until(p, 'on', 4000);
      const l1 = await st(p);
      ok(l0.msg === 'Connecting to Inner Balance: starting its heart-rate readings… If your phone asks to pair, accept it.' && l1.st === 'on' && l1.tries === 1 && l1.msg === '',
        'readings that start late, as after accepting a pairing request: connected on the first try (' + l1.tries + '), after: ' + l0.msg);
      await p.context().close();
      // readings refused the first time, as when a pairing request isn't accepted: it asks again
      p = await open({ refuse: true, quick: 0.05 });
      await until(p, 'on', 4000);
      const f1 = await st(p);
      ok(f1.st === 'on' && f1.tries === 2, 'readings refused the first time: it tries again and connects (' + f1.tries + ' tries)');
      await p.context().close();
      // a heart-rate service that never turns up: three tries, then what to do, and what happened on each try
      p = await open({ hang: 'service', quick: 0.05 });
      await msgHas(p, 'confirm a pairing');
      const s0 = await st(p);
      await until(p, 'off', 12000);
      const r2 = await st(p), t2 = await tries(p);
      ok(s0.msg === 'Connecting to Venu 4: finding its heart-rate service…' + HINT && r2.st === 'off' && r2.tries === 3 &&
        r2.msg.startsWith("Venu 4 linked up but didn't share its heart-rate service." + PAIR) && FORCE.test(r2.msg) && r2.msg.endsWith(LISTED) && r2.btn === 'Connect sensor',
        'a service that never turns up: three tries, then a message that says what to do: ' + r2.msg);
      ok(t2.shown && !t2.open && t2.li.length === 3 &&
        new RegExp('^Linked up in ' + S + '; finding its heart-rate service: no answer within 30 s; the link was still up\\.$').test(t2.li[0]) &&
        new RegExp('^Linked up in ' + S + '; waited 6 s for it to settle; finding its heart-rate service: no answer within 15 s; the link was still up\\.$').test(t2.li[1]) &&
        new RegExp('^Linked up in ' + S + '; waited 12 s for it to settle; finding its heart-rate service: no answer within 15 s; the link was still up\\.$').test(t2.li[2]) &&
        /^Venu 4, Chrome [\d.]+ on (Android|Linux)\.$/.test(t2.env),
        'and a folded list under it says what happened on each try: ' + t2.li.join(' | ') + ' | ' + t2.env);
      await p.context().close();
      // readings that never start at all: the later tries check that it answers a test read; the details can be copied
      p = await open({ hang: 'read', quick: 0.05 });
      await until(p, 'off', 12000);
      const r3 = await st(p), t3 = await tries(p);
      ok(r3.tries === 3 && r3.msg.startsWith("Venu 4 linked up but didn't start sending its heart rate." + PAIR) && r3.msg.endsWith(LISTED) &&
        new RegExp('^Linked up in ' + S + '; found its heart-rate service in ' + S + '; starting its heart-rate readings: no answer within 30 s; the link was still up\\.$').test(t3.li[0]) &&
        new RegExp('^Linked up in ' + S + '; waited 6 s for it to settle; found its heart-rate service in ' + S + '; a test read of its battery level answered in ' + S + '; starting its heart-rate readings: no answer within 15 s; the link was still up\\.$').test(t3.li[1]),
        'readings that never start: the later tries check it answers a test read first: ' + t3.li[1]);
      await E(p, () => { window.__copied = null; Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: t => { window.__copied = t; return Promise.resolve(); } } }); });
      await p.click('#hrLog summary'); await p.waitForTimeout(150);
      await p.click('#hrLogCopy'); await p.waitForTimeout(150);
      const cp = await E(p, () => ({ txt: (window.__copied || '').replace(/\u00a0/g, ' '), btn: document.querySelector('#hrLogCopy').textContent }));
      ok(cp.btn === 'Copied' && /^Entrain, connecting Venu 4 \(Chrome [\d.]+ on (Android|Linux)\)\nVenu 4 linked up but didn't start sending its heart rate\./.test(cp.txt) &&
        cp.txt.split('\n').length === 5 && cp.txt.split('\n')[3] === 'Try 2: ' + t3.li[1],
        'Copy the details puts the message and every try on the clipboard: ' + (cp.txt || '').split('\n')[0]);
      await p.context().close();
      // a test read that gets no answer either
      p = await open({ hang: 'read', probeHang: true, quick: 0.05 });
      await until(p, 'off', 12000);
      const r6 = await st(p), t6 = await tries(p);
      ok(r6.tries === 3 && r6.msg.startsWith("Venu 4 linked up but didn't start sending its heart rate.") &&
        new RegExp('^Linked up in ' + S + '; waited 6 s for it to settle; found its heart-rate service in ' + S + '; a test read of its battery level: no answer within 8 s; the link was still up\\.$').test(t6.li[1]),
        'a sensor that answers nothing at all: the list says so: ' + t6.li[1]);
      await p.context().close();
      // a watch that links up without the heart-rate service: what it does offer, and why that can happen
      p = await open({ noHR: true, quick: 0.05 });
      await until(p, 'off', 6000);
      const r4 = await st(p), t4 = await tries(p);
      ok(r4.tries === 3 && r4.msg === "Venu 4 linked up but doesn't offer the standard heart-rate service. A Garmin watch offers it only while Broadcast Heart Rate is on, so check that it is. " +
        "If it is, the watch may be answering this phone as the one it syncs with in Garmin Connect rather than as a heart-rate receiver; a tablet or computer that isn't paired with the watch can usually connect to its broadcast." + LISTED &&
        new RegExp('^Linked up in ' + S + '; finding its heart-rate service: NotFoundError: No Services matching UUID 0000180d-0000-1000-8000-00805f9b34fb found in Device, and it showed only battery and device information; the link was still up\\.$').test(t4.li[0]),
        'no heart-rate service: it says why that can happen, and the list what the watch offers: ' + t4.li[0]);
      await p.context().close();
      // tries that fail in different ways: each in its own words
      p = await open({ noHR: true, hang: 'service', hangOnce: true, quick: 0.05 });
      await until(p, 'off', 8000);
      const t5 = await tries(p);
      ok(t5.li.length === 3 && /finding its heart-rate service: no answer within 30 s/.test(t5.li[0]) && /finding its heart-rate service: NotFoundError: /.test(t5.li[1]) && /NotFoundError/.test(t5.li[2]),
        'tries that fail differently are listed in their own words: ' + t5.li.map(l => l.slice(0, 60)).join(' | '));
      await p.context().close();
      // Cancel, while it links up at its real pace
      p = await open({ hang: 'link' });
      await p.waitForTimeout(400);
      const c0 = await st(p);
      await p.click('#hrConnect'); await p.waitForTimeout(300);
      const c1 = await st(p);
      ok(c0.st === 'busy' && c0.btn === 'Cancel' && c1.st === 'off' && c1.btn === 'Connect sensor' && c1.msg === 'Stopped connecting. Press Connect sensor to try again.' && c1.pill === 'Connect sensor',
        'Cancel stops it straight away: ' + c1.msg);
      await p.waitForTimeout(800);
      ok((await st(p)).st === 'off' && (await st(p)).tries === 1, 'and nothing carries on behind it');
      await p.context().close();
    }

    /* D. donations: a button on Today and in Settings, and a line in the impressum, opening Ko-fi in the browser */
    if (!only || only === 'D') {
      const p = await page(OPT());
      await E(p, () => location.hash = 'settings'); await p.waitForTimeout(400);
      const btn = sel => E(p, sel => { const a = document.querySelector(sel), r = a.getBoundingClientRect(); return { href: a.getAttribute('href'), target: a.target, rel: a.rel, txt: a.textContent.trim(), h: r.height, col: getComputedStyle(a).color }; }, sel);
      const b = await btn('.st-about a.btn.donate');
      ok(b.href === 'https://ko-fi.com/misterclarity' && b.target === '_blank' && /noopener/.test(b.rel) && b.txt === 'Support Entrain on Ko-fi' && b.h >= 44,
        'Settings has a donations button to Ko-fi, opening in the browser: ' + b.txt);
      await E(p, () => location.hash = 'l-impressum'); await p.waitForTimeout(400);
      ok(await E(p, () => !!document.querySelector('.imprint a[href="https://ko-fi.com/misterclarity"][target="_blank"]')), 'and the impressum links to it too');
      await E(p, () => location.hash = 'home'); await p.waitForTimeout(400);
      const h = await btn('.td-donate a.btn.donate');
      ok(h.href === b.href && h.target === '_blank' && /noopener/.test(h.rel) && h.txt === b.txt && h.h >= 44 && h.col === b.col && /^Entrain is free and has no ads\./.test(await t(p, '.td-donate p')),
        'Today has the same button, at the end: ' + await t(p, '.td-donate p'));
      await p.context().close();
    }
  } catch (e) {
    log.push('ERROR ' + (e && e.stack || e));
  }
  await browser.close();
  console.log(log.join('\n'));
  const fails = log.filter(l => !l.startsWith('PASS')).length;
  console.log('\n' + (log.length - fails) + ' passed, ' + fails + ' problems');
  process.exit(fails ? 1 : 0);
})();
