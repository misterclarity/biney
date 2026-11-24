// The new techniques open with a donation, checked against the keys in SUP_KEYS. For the suites, a TEST-ONLY
// key signs codes for a test copy of the app. No private key is kept in the repository: the first suite that needs
// one makes it in tests/out/ (ignored by git) and the others share it, so its public half is never in the real build.
//   const { testApp, unlockInit } = require('./unlock-helper');
//   const URL = testApp();                 // tests/out/entrain-unlock.html: index.html trusting the test key instead
//   await unlockInit(page);                // before goto: this device is TEST0TEST0, unlocked by a test-key code
//   await page.goto(URL); await unlocked(page);    // once the code is checked (it needs entrain.debug = 1)
// sign(device) makes a code for any device; DEVICE is the one unlockInit stores.
const fs = require('fs'), path = require('path'), crypto = require('crypto'), { pathToFileURL } = require('url');
const { ROOT, OUT } = require('./pw');

const KEY_FILE = path.join(OUT, 'unlock-test-key.pem');
// the suites run side by side, each in its own process: the first to get here writes the key whole and links it
// into place (a link fails if another got there first, so every suite reads the same complete key)
function testKey() {
  try { return fs.readFileSync(KEY_FILE, 'utf8'); } catch (e) {}
  const pem = crypto.generateKeyPairSync('ec', { namedCurve: 'P-256' }).privateKey.export({ type: 'pkcs8', format: 'pem' });
  const tmp = KEY_FILE + '.' + process.pid;
  fs.writeFileSync(tmp, pem, { mode: 0o600 });
  try { fs.linkSync(tmp, KEY_FILE); } catch (e) { if (e.code !== 'EEXIST') throw e; }
  fs.unlinkSync(tmp);
  return fs.readFileSync(KEY_FILE, 'utf8');
}
const KEY = crypto.createPrivateKey(testKey());
const PUB = crypto.createPublicKey(KEY).export({ format: 'jwk' });
const JWK = { kty: 'EC', crv: 'P-256', x: PUB.x, y: PUB.y };
const KEYS_LINE = /^  var SUP_KEYS = \[.*\];.*$/m;
const DEVICE = 'TEST0TEST0';
const FILE = path.join(OUT, 'entrain-unlock.html');

// the activation code for a device (ten characters, no dash), signed with the test key, or with another key
function sign(device, key) {
  const sig = crypto.sign('sha256', Buffer.from('entrain-unlock-v1:' + device, 'utf8'), { key: key || KEY, dsaEncoding: 'ieee-p1363' });
  return device + '.' + sig.toString('base64url');
}
// the built app with the test key as its only trusted key, written to tests/out; its file URL
function testApp() {
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  if (!KEYS_LINE.test(html)) throw new Error('index.html has no SUP_KEYS line: build the app first');
  if (html.includes(JWK.x)) throw new Error('the test key is in the real build\'s SUP_KEYS');
  // written whole and renamed into place, so a suite opening it while another rewrites it never reads half a page
  const tmp = FILE + '.' + process.pid;
  fs.writeFileSync(tmp, html.replace(KEYS_LINE, '  var SUP_KEYS = [' + JSON.stringify(JWK) + '];'));
  fs.renameSync(tmp, FILE);
  return pathToFileURL(FILE).href;
}
// before the app loads: this device's code and a test-key code that unlocks it
async function unlockInit(page, device) {
  const d = device || DEVICE;
  await page.addInitScript(([d, c]) => { localStorage.setItem('entrain.device', d); localStorage.setItem('entrain.unlock', c); }, [d, sign(d)]);
}
// once the kept code has been checked (the debug hook must be on)
function unlocked(page) {
  return page.waitForFunction(() => window.__entrain && window.__entrain.SUP.state !== 'checking', null, { timeout: 5000 }).catch(() => {});
}

module.exports = { testApp, unlockInit, unlocked, sign, DEVICE, JWK, KEY_FILE, FILE };
