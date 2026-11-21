// The new techniques open with a donation, checked against the keys in SUP_KEYS. For the suites, a TEST-ONLY
// key (unlock-test-key.pem, whose public half is never in the real build) signs codes for a test copy of the app.
//   const { testApp, unlockInit } = require('./unlock-helper');
//   const URL = testApp();                 // tests/out/entrain-unlock.html: index.html trusting the test key instead
//   await unlockInit(page);                // before goto: this device is TEST0TEST0, unlocked by a test-key code
//   await page.goto(URL); await unlocked(page);    // once the code is checked (it needs entrain.debug = 1)
// sign(device) makes a code for any device; DEVICE is the one unlockInit stores.
const fs = require('fs'), path = require('path'), crypto = require('crypto'), { pathToFileURL } = require('url');
const { ROOT, OUT } = require('./pw');

const KEY_FILE = path.join(__dirname, 'unlock-test-key.pem');
const KEY = crypto.createPrivateKey(fs.readFileSync(KEY_FILE, 'utf8'));
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
  fs.writeFileSync(FILE, html.replace(KEYS_LINE, '  var SUP_KEYS = [' + JSON.stringify(JWK) + '];'));
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
