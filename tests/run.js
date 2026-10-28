// Runs every suite against the built index.html, a few at a time, and adds up the results.
//   node tests/run.js                   every suite, as many at a time as there are processor cores (at most 4)
//   node tests/run.js --jobs 1          one at a time (about twenty minutes; two at a time takes ten)
//   node tests/run.js regress choices   only the suites named
// The longest suites start first, so a run takes about as long as its longest suite once there are
// enough cores. Each suite is its own process with its own browser; its results print in one piece
// when it finishes. Exits with 1 if anything failed, so it can gate a commit or the publishing workflow.
const { spawn } = require('child_process'), path = require('path'), os = require('os');
const SUITES = [   // name, what it covers, and about how long it takes on its own, in seconds
  ['netcheck', 'No network requests', 5],
  ['apptest', 'App shell on a phone and a desktop', 30],
  ['pwatest', 'Offline install and updates (serves the build on port 8123)', 15],
  ['prrun', 'Practices: library, sessions, breath, yoga', 160],
  ['prrun2', 'Practices: programs, Wim Hof, builder', 130],
  ['prrun3', 'Capoeira, tapping, heart-led beats, nap, reflection', 230],
  ['regress', 'Fixes from the October 2026 code review', 260],
  ['todaytest', 'Today, one history, favourites, the library with sounds', 50],
  ['findtest', 'Resonance test with a sensor (about two minutes)', 110],
  ['cuetrend', 'Lock screen, vibration, comparisons, trends, start-up, Heart', 70],
  ['choices', 'Saved patterns, safety note, filters, Heart Coherence, live changes, Restart, Healthy living, Gratitude, Calm Reset, donations, connecting, difficult conversations, autogenic training, walking, feedback, routines and light', 115]
];
const MAX = 15 * 60 * 1000;                 // a suite that runs longer than this has hung

let jobs = Math.max(1, Math.min(4, os.cpus().length));
const pick = [];
for (let i = 2; i < process.argv.length; i++) {
  const a = process.argv[i], m = /^--jobs(?:=(\d+))?$/.exec(a) || /^-j(\d+)?$/.exec(a);
  if (m) jobs = Math.max(1, parseInt(m[1] || process.argv[++i], 10) || 1);
  else pick.push(a);
}
const unknown = pick.filter(n => !SUITES.some(s => s[0] === n));
if (unknown.length) { console.error('No suite called ' + unknown.join(', ') + '. The suites: ' + SUITES.map(s => s[0]).join(', ')); process.exit(2); }
const todo = SUITES.filter(s => !pick.length || pick.includes(s[0])).sort((a, b) => b[2] - a[2]);

let passed = 0, problems = 0;
const t0 = Date.now(), secs = t => Math.round((Date.now() - t) / 1000);
function run([name, what]) {
  return new Promise(done => {
    const t1 = Date.now();
    let out = '', hung = false;
    const ch = spawn(process.execPath, [path.join(__dirname, name + '.js')], { stdio: ['ignore', 'pipe', 'pipe'] });
    ch.stdout.on('data', d => { out += d; });
    ch.stderr.on('data', d => { out += d; });
    const timer = setTimeout(() => { hung = true; ch.kill('SIGKILL'); }, MAX);
    const finish = (code, err) => {
      clearTimeout(timer);
      const lines = out.split('\n');
      const ok = lines.filter(l => l.startsWith('PASS ')).length;
      const bad = lines.filter(l => /^(FAIL|PAGEERROR|ERROR|CONSOLE)\b/.test(l));
      const crashed = code !== 0 || !!err || hung || ok === 0;
      passed += ok; problems += bad.length + (crashed ? 1 : 0);
      const head = (bad.length || crashed ? '✗ ' : '✓ ') + name.padEnd(9) + String(ok).padStart(4) + ' passed  ' + what + '  (' + secs(t1) + ' s)';
      const tail = bad.map(l => '    ' + l);
      if (crashed) tail.push('    did not finish cleanly (' + (hung ? 'stopped after ' + MAX / 60000 + ' minutes' : 'exit ' + code + (err ? ', ' + err.message : '')) + '):\n' +
        lines.slice(-8).map(l => '      ' + l).join('\n'));
      console.log([head].concat(tail).join('\n'));
      // on GitHub, each problem is an annotation too, shown on the run's page and the commit
      if (process.env.GITHUB_ACTIONS === 'true') bad.concat(crashed ? ['did not finish cleanly: ' + lines.slice(-6).join(' / ')] : []).slice(0, 8)
        .forEach(l => console.log('::error title=' + name + '::' + l.replace(/%/g, '%25').replace(/\r?\n/g, '%0A')));
      done();
    };
    ch.on('error', e => finish(null, e));
    ch.on('close', code => finish(code));
  });
}
(async () => {
  const queue = todo.slice();
  console.log('Running ' + todo.length + (todo.length === 1 ? ' suite' : ' suites') + ', ' + Math.min(jobs, todo.length) + ' at a time.\n');
  await Promise.all(Array.from({ length: Math.min(jobs, queue.length) }, async () => { while (queue.length) await run(queue.shift()); }));
  console.log('\n' + passed + ' passed, ' + problems + ' problems, in ' + Math.floor(secs(t0) / 60) + ' min ' + (secs(t0) % 60) + ' s');
  process.exit(problems ? 1 : 0);
})();
