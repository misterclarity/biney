#!/usr/bin/env node
/* Activation codes for Entrain's new techniques: the developer's tool (Node 18 or later, no dependencies).

   The techniques from the brain-wave guide open with a donation of €1 or more, once on each device. The app
   shows each device a code like ABCDE-FGHJK; the donor puts it in their Ko-fi message; you sign it here with
   the private key and send back the activation link. The app checks the signature with the public keys in
   SUP_KEYS (src/js/supporter.js), on the device: nothing is sent anywhere.

     node src/unlock.js sign ABCDE-FGHJK [MORE CODES…]     the activation code and link for each device code
     node src/unlock.js sign --from FILE                     every device code in a text (a Ko-fi email, a CSV export; - for stdin)
     node src/unlock.js verify CODE_OR_LINK                  which device it unlocks, and whether a trusted key signed it
     node src/unlock.js keygen [--out PATH] [--add]          a new private key; --add puts its public half in SUP_KEYS

   Options:
     --key PATH         the private key (default: $ENTRAIN_UNLOCK_KEY, else ~/.entrain/entrain-unlock-private.pem)
     --base URL         where the link opens the app (default: https://misterclarity.github.io/biney/)
     --trust FILE       trust another public key too (a JWK, a list of them, or a PEM key), as for a test copy
     --keys-from FILE   trust only the SUP_KEYS line in FILE (a supporter.js, or a built page) instead of src/js/supporter.js
     --supporter FILE   the supporter.js to read, and for keygen --add to change (default: src/js/supporter.js)

   Keep the private key outside the repository. Before signing, check that the donation is €1 or more.
   A key that isn't in SUP_KEYS is refused: the app wouldn't accept what it signs.
*/
"use strict";
const crypto = require("crypto"), fs = require("fs"), path = require("path"), os = require("os");

const MSG = "entrain-unlock-v1:";                        // what's signed: this, then the device's ten characters
const ABC = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";          // Crockford's base 32, as the app makes them
const BASE = "https://misterclarity.github.io/biney/";
const SUPPORTER = path.join(__dirname, "js", "supporter.js");
const KEYS_LINE = /^  var SUP_KEYS = (\[.*\]);.*$/m;     // one line, so it can be found and changed
const CODE_RE = /([0-9A-Z]{5}-?[0-9A-Z]{5})\.([A-Za-z0-9_-]{86})/i;

function fail(msg, code) { console.error(msg); process.exit(code || 1); }
// a path as it's easiest to read: from here, or from your home folder
function home(p) {
  const abs = path.resolve(p), rel = path.relative(process.cwd(), abs);
  if (rel && !rel.startsWith("..") && !path.isAbsolute(rel)) return rel;
  return abs.startsWith(os.homedir() + path.sep) ? "~" + abs.slice(os.homedir().length) : abs;
}
// as the app reads them: capitals, no spaces or dashes, O, I and L as the digits they look like
function norm(s) { return String(s || "").toUpperCase().replace(/[\s-]+/g, "").replace(/O/g, "0").replace(/[IL]/g, "1"); }
function valid(d) { return d.length === 10 && [...d].every(c => ABC.includes(c)); }
function fmt(d) { return d.slice(0, 5) + "-" + d.slice(5); }

function args(argv) {
  const o = { cmd: argv[0], pos: [], trust: [], add: false }, want = { "--key": "key", "--base": "base", "--from": "from", "--trust": "trust", "--keys-from": "keysFrom", "--supporter": "supporter", "--out": "out" };
  for (let i = 1; i < argv.length; i++) {
    const a = argv[i], eq = a.indexOf("="), name = a.startsWith("--") && eq > 0 ? a.slice(0, eq) : a;
    if (a === "--add") o.add = true;
    else if (a === "-h" || a === "--help") o.cmd = "help";
    else if (want[name]) {
      const v = eq > 0 && a.startsWith("--") ? a.slice(eq + 1) : argv[++i];
      if (v === undefined) fail(name + " needs a value.", 2);
      if (want[name] === "trust") o.trust.push(v); else o[want[name]] = v;
    } else if (a.startsWith("--")) fail("Unknown option " + a + ". node src/unlock.js --help lists them.", 2);
    else o.pos.push(a);
  }
  o.supporter = o.supporter || SUPPORTER;
  o.base = o.base || BASE;
  return o;
}
function keyPath(o) { return o.key || process.env.ENTRAIN_UNLOCK_KEY || path.join(os.homedir(), ".entrain", "entrain-unlock-private.pem"); }
function read(file, what) {
  try { return file === "-" ? fs.readFileSync(0, "utf8") : fs.readFileSync(file, "utf8"); } catch (e) { fail("Can't read " + what + " " + file + ": " + e.message); }
}

/* ----- keys ----- */
function jwkOf(k) { const j = k.export({ format: "jwk" }); return { kty: "EC", crv: "P-256", x: j.x, y: j.y }; }
function keysIn(file) {
  const m = read(file, "the keys in").match(KEYS_LINE);
  if (!m) fail("No line starting with \"  var SUP_KEYS = [\" in " + file + ".");
  try { return JSON.parse(m[1]); } catch (e) { fail("The SUP_KEYS line in " + file + " isn't a JSON list: " + e.message); }
}
// a public key from a file: a JWK, a list of them, or a PEM key (public or private)
function trustFile(file) {
  const t = read(file, "the key");
  let j;
  try { j = JSON.parse(t); } catch (e) {
    try { return [jwkOf(crypto.createPublicKey(t))]; } catch (e2) { fail(file + " isn't a JWK or a PEM key."); }
  }
  return (Array.isArray(j) ? j : [j]).map(k => ({ kty: "EC", crv: "P-256", x: k.x, y: k.y }));
}
function trusted(o) {
  const keys = o.keysFrom ? keysIn(o.keysFrom) : keysIn(o.supporter);
  o.trust.forEach(f => keys.push(...trustFile(f)));
  return keys;
}
function privateKey(o) {
  const file = keyPath(o);
  if (!fs.existsSync(file)) fail("No private key at " + home(file) + ". Give one with --key PATH or $ENTRAIN_UNLOCK_KEY, or make one with keygen.");
  let k;
  try { k = crypto.createPrivateKey(read(file, "the private key")); } catch (e) { fail(home(file) + " isn't a private key: " + e.message); }
  if (k.asymmetricKeyType !== "ec" || (k.asymmetricKeyDetails || {}).namedCurve !== "prime256v1") fail(home(file) + " isn't an ECDSA P-256 key.");
  return { key: k, file };
}

/* ----- codes ----- */
function signDevice(key, dev) {
  const sig = crypto.sign("sha256", Buffer.from(MSG + dev, "utf8"), { key, dsaEncoding: "ieee-p1363" });
  return dev + "." + sig.toString("base64url");
}
// the index of the trusted key that signed it, or -1
function signedBy(keys, dev, sig) {
  const raw = Buffer.from(sig, "base64url");
  if (raw.length !== 64) return -1;
  for (let i = 0; i < keys.length; i++) {
    let k;
    try { k = crypto.createPublicKey({ key: { kty: "EC", crv: "P-256", x: keys[i].x, y: keys[i].y }, format: "jwk" }); } catch (e) { continue; }
    if (crypto.verify("sha256", Buffer.from(MSG + dev, "utf8"), { key: k, dsaEncoding: "ieee-p1363" }, raw)) return i;
  }
  return -1;
}
function parse(text) {
  const m = String(text || "").replace(/\s+/g, "").match(CODE_RE);
  if (!m) return null;
  const dev = norm(m[1]);
  return valid(dev) ? { device: dev, sig: m[2] } : null;
}
// every XXXXX-XXXXX in a text, once each, with the line it came from
function findCodes(text) {
  const out = [], seen = {}, re = /(^|[^0-9A-Za-z])([0-9A-Za-z]{5}-[0-9A-Za-z]{5})(?![0-9A-Za-z])/g;
  text.split(/\r?\n/).forEach((line, n) => {
    let m;
    re.lastIndex = 0;
    while ((m = re.exec(line))) {
      const dev = norm(m[2]);
      if (!valid(dev) || seen[dev]) continue;
      seen[dev] = true;
      out.push({ dev, line: n + 1, ctx: line.trim().slice(0, 140), words: /^[a-z-]+$/.test(m[2]) });
    }
  });
  return out;
}

/* ----- commands ----- */
function sign(o) {
  const want = [];
  o.pos.forEach(a => {
    const dev = norm(a);
    if (!valid(dev)) fail("\"" + a + "\" isn't a device code: ten letters and digits, like ABCDE-FGHJK.", 2);
    want.push({ dev });
  });
  if (o.from) {
    const found = findCodes(read(o.from, "the text"));
    if (!found.length) fail("No device codes like ABCDE-FGHJK in " + o.from + ".");
    found.forEach(f => { if (!want.some(w => w.dev === f.dev)) want.push(f); });
  }
  if (!want.length) fail("Which device? node src/unlock.js sign ABCDE-FGHJK, or sign --from FILE.", 2);
  const { key, file } = privateKey(o), pub = jwkOf(crypto.createPublicKey(key)), keys = trusted(o);
  if (!keys.some(k => k.x === pub.x && k.y === pub.y))
    fail("Refused: the public half of " + home(file) + " isn't in SUP_KEYS (" + home(o.keysFrom || o.supporter) + "), so the app wouldn't accept what it signs.\n" +
      "Use the right key with --key, or add this one with keygen --add (then rebuild and publish).");
  want.forEach(w => {
    const code = signDevice(key, w.dev);
    console.log(fmt(w.dev) + (w.line ? "  (line " + w.line + ": " + w.ctx + ")" + (w.words ? "  check: this may be two words, not a code" : "") : ""));
    console.log("  code  " + code);
    console.log("  link  " + o.base + "#unlock/" + code);
  });
  if (o.from) console.log("\nCheck that each donation is €1 or more before you send its link.");
}
function verify(o) {
  const text = o.pos.join("");
  if (!text) fail("Which code? node src/unlock.js verify CODE_OR_LINK", 2);
  const a = parse(text);
  if (!a) fail("That isn't an activation code: it should hold the ten characters of a device code, a dot and 86 more.");
  const keys = trusted(o), i = signedBy(keys, a.device, a.sig);
  console.log("Device " + fmt(a.device) + ".");
  if (i < 0) fail("Not signed by a trusted key (" + keys.length + " in " + home(o.keysFrom || o.supporter) + (o.trust.length ? " and --trust" : "") + "): the app would refuse it.");
  console.log("Signed by trusted key " + (i + 1) + " of " + keys.length + ": it unlocks that device.");
}
function keygen(o) {
  const out = path.resolve(o.out || keyPath(o));
  if (fs.existsSync(out)) fail("There's already a key at " + home(out) + ", and keygen never overwrites one. Choose another place with --out.");
  const dir = path.dirname(out);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
  const { privateKey: k } = crypto.generateKeyPairSync("ec", { namedCurve: "prime256v1" });
  fs.writeFileSync(out, k.export({ type: "pkcs8", format: "pem" }), { flag: "wx", mode: 0o600 });
  fs.chmodSync(out, 0o600);
  const pub = jwkOf(crypto.createPublicKey(k));
  console.log("New private key: " + home(out) + " (only you can read it). Keep it outside the repository, and a copy somewhere safe.");
  console.log("Its public key:\n" + JSON.stringify(pub));
  if (!o.add) { console.log("\nTo trust it, run keygen again with --add, or put the line above into SUP_KEYS in src/js/supporter.js."); return; }
  const src = read(o.supporter, "supporter.js"), keys = keysIn(o.supporter);
  keys.push(pub);
  fs.writeFileSync(o.supporter, src.replace(KEYS_LINE, line => line.replace(/\[.*\]/, () => JSON.stringify(keys))));
  console.log("\nAdded to SUP_KEYS in " + home(o.supporter) + ": " + keys.length + " keys now. Keep the older ones there, so the codes already sent keep working.\n" +
    "Then rebuild (python3 src/build.py), commit and publish, and sign new codes with this key.");
}

if (+process.versions.node.split(".")[0] < 18) fail("This needs Node 18 or later.");
const o = args(process.argv.slice(2));
if (o.cmd === "sign") sign(o);
else if (o.cmd === "verify") verify(o);
else if (o.cmd === "keygen") keygen(o);
else {
  const doc = fs.readFileSync(__filename, "utf8").match(/\/\* ([\s\S]*?)\*\//)[1];
  console.log(doc.replace(/^ {3}/gm, "").trim());
  process.exit(o.cmd && o.cmd !== "help" ? 2 : 0);
}
