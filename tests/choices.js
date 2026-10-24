// Your own breathing patterns, one safety note, filters that combine, and Heart Coherence's choices.
// Run: node tests/choices.js [group letter]
//   M  your own breathing patterns     N  one safety note
//   F  library filters that combine   R  Heart Coherence: gratitude, lying down, its beat and pace
//   W  wording that names its study    A  the pace and beat changed while a practice runs, and Restart
//   Q  the three new quotes            I  the impressum and copyright
//   K  the code check's fixes
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
      await p.reload(); await p.waitForTimeout(500);
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
      ok(learn.toc && learn.h === 'Safety' && learn.items.join(' | ') === 'The beats. | Headphones with a pacemaker. | Breathing. | Moving. | Feelings.', 'Learn holds the whole note, under Safety: ' + learn.items.join(' | '));
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

    /* Q. the three new quotes, signed Entrain and kept as written */
    if (!only || only === 'Q') {
      const p = await page(OPT());
      const qs = await E(p, () => { const X = window.__entrain; return ["There's nothing to do but enjoy the view.", 'Health is a state of co-operation.', 'Revolution is an ongoing process of self discovery.']
        .map(x => { const q = X.QUOTES.find(y => y[0] === x); return q ? x + ' / ' + (q[1] || 'Entrain') + ' / ' + q[2] : 'missing: ' + x; }); });
      ok(qs.every(x => / \/ Entrain \/ as written$/.test(x)), 'three new quotes, signed Entrain: ' + qs.map(x => x.split(' / ')[0]).join(' | '));
      await p.context().close();
    }

    /* I. the impressum and copyright: in Learn, in its contents, and from Settings */
    if (!only || only === 'I') {
      const p = await page(OPT());
      await E(p, () => location.hash = 'settings'); await p.waitForTimeout(400);
      ok(/© 2026 misterclarity/.test(await t(p, '.st-about')), 'Settings ends with the copyright: ' + await t(p, '.st-about'));
      await p.click('.st-about a[href="#l-impressum"]'); await p.waitForTimeout(900);
      const im = await E(p, () => { const h = document.querySelector('#l-impressum'), s = h.closest('section'), r = h.getBoundingClientRect();
        return { view: !document.querySelector('#v-learn').hidden, top: r.top, inView: r.top >= 0 && r.bottom <= innerHeight, txt: s.textContent.replace(/\s+/g, ' '), link: s.querySelector('a').getAttribute('href'), toc: !!document.querySelector('.toc a[href="#l-impressum"]') }; });
      ok(im.view && im.inView && im.toc, 'its link opens Learn at the impressum, which Learn\'s contents list too');
      ok(/personal, non-commercial project by misterclarity/.test(im.txt) && /© 2026 misterclarity\. All rights reserved\./.test(im.txt) && im.link === 'https://github.com/misterclarity/biney' &&
        /Poppins typeface is Copyright 2020 The Poppins Project Authors, used under the SIL Open Font License 1\.1/.test(im.txt), 'the impressum names the project\'s author and page, the copyright and the font\'s licence');
      await p.context().close();
    }

    /* K. what the full code check found: fast breathing goes no faster than it was made to; a beat turned
       off stays off through a restart, and a paused one stops; the end screen's panel has a name of its own;
       the routine builder's tiles say their time, level and caution; the safety link is big enough to tap;
       a backup with a damaged choice of a practice's is refused */
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
