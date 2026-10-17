// Runs every suite in turn against the built index.html and adds up the results.
//   node tests/run.js            all suites (about ten minutes)
//   node tests/run.js regress    only the suites named
// Exits with 1 if anything failed, so it can gate a commit or a CI job.
const { spawnSync } = require('child_process'), path = require('path');
const SUITES = [
  ['netcheck', 'No network requests'],
  ['apptest', 'App shell on a phone and a desktop'],
  ['pwatest', 'Offline install and updates (serves the build on port 8123)'],
  ['prrun', 'Practices: library, sessions, breath, yoga'],
  ['prrun2', 'Practices: programs, Wim Hof, builder'],
  ['prrun3', 'Capoeira, tapping, heart-led beats, nap, reflection'],
  ['regress', 'Fixes from the October 2026 code review'],
  ['findtest', 'Resonance test with a sensor (about two minutes)']
];
const pick = process.argv.slice(2);
let passed = 0, problems = 0;
for (const [name, what] of SUITES) {
  if (pick.length && !pick.includes(name)) continue;
  const t0 = Date.now();
  const r = spawnSync(process.execPath, [path.join(__dirname, name + '.js')], { encoding: 'utf8', timeout: 15 * 60 * 1000 });
  const out = (r.stdout || '') + (r.stderr || '');
  const lines = out.split('\n');
  const ok = lines.filter(l => l.startsWith('PASS ')).length;
  const bad = lines.filter(l => /^(FAIL|PAGEERROR|ERROR|CONSOLE)\b/.test(l));
  const crashed = r.status !== 0 || r.error || ok === 0;
  passed += ok; problems += bad.length + (crashed ? 1 : 0);
  console.log((bad.length || crashed ? '✗ ' : '✓ ') + name.padEnd(9) + String(ok).padStart(4) + ' passed  ' + what + '  (' + Math.round((Date.now() - t0) / 1000) + ' s)');
  bad.forEach(l => console.log('    ' + l));
  if (crashed) console.log('    did not finish cleanly (exit ' + r.status + (r.error ? ', ' + r.error.message : '') + '):\n' + out.split('\n').slice(-8).map(l => '      ' + l).join('\n'));
}
console.log('\n' + passed + ' passed, ' + problems + ' problems');
process.exit(problems ? 1 : 0);
