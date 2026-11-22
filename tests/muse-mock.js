// A stand-in Muse EEG headband for the suites, injected with page.addInitScript(museMock, opts), after the heart
// sensor's mock when both are used: it answers requestDevice when the page asks for the Muse service (0xfe8d) and
// hands any other request to what was there before, so a heart sensor and a headband can be connected together.
// Its four sensors (TP9, AF7, AF8, TP10) send packets of twelve 12-bit samples, 256 a second, by the page's clock
// (performance.now, which the heart sensor's mock or opts.speed runs faster), each the sum of a 10 Hz alpha wave of
// window.__egAlpha µV (8 unless a test sets it), a 6 Hz theta wave of window.__egTheta µV (5), a 20 Hz beta wave of
// window.__egBeta µV (2) and noise. A test can add window.__egBlink = n (n blinks on the forehead sensors, one every half second from now),
// window.__egMove = seconds of slow, big swings on all four (moving the head), window.__egJaw = seconds of a tense
// jaw's fast buzz on all four, and window.__egOff = [sensor numbers] off the skin (wild swings); window.__museDrop()
// drops the link, and window.__museDown = true makes it refuse to link up again.
// opts: speed; fail (pairing refused: SecurityError); cancel (the chooser closed: NotFoundError); noAdapter (Bluetooth
// switched off: NotFoundError, said differently); noSvc (another
// device, without the service); hang: 'link' | 'service' (a step that never answers); noData (connects, never sends);
// noTele (no battery). window.__muse = { opts (what requestDevice was asked), cmds (commands written, decoded),
// lenOk (each command's first byte was its length), notif (notifications asked for), packets, connects, overlap (GATT
// requests made while another was under way, which Chrome turns down) }.
function museMock(o) {
  o = o || {};
  const realNow = performance.now.bind(performance);
  if (o.speed && o.speed !== 1) { const z = realNow(); performance.now = () => z + (realNow() - z) * o.speed; }
  const M = window.__muse = { opts: null, cmds: [], lenOk: true, notif: 0, packets: 0, connects: 0, overlap: 0 };
  // like Chrome, one GATT request at a time: a second while one is under way is turned down
  let inFlight = false;
  const op = v => {
    if (inFlight) { M.overlap++; return Promise.reject(err('NetworkError', 'GATT operation already in progress.')); }
    inFlight = true;
    return new Promise(r => setTimeout(() => { inFlight = false; r(typeof v === 'function' ? v() : v); }, 2));
  };
  const err = (name, msg) => Object.assign(new Error(msg || name), { name });
  const pend = [], never = () => new Promise((_, no) => pend.push(no));
  const uuid = n => '273e00' + n + '-4c4d-454d-96be-f03bac821358';
  const dev = new EventTarget(); dev.name = 'Muse-7A2C';
  let timer = null, t0 = 0, sent = 0, idx = 65500, seed = 12345, blinks = [], moveEnd = -1, jawEnd = -1;
  const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const gauss = () => Math.sqrt(-2 * Math.log(rand() + 1e-12)) * Math.cos(2 * Math.PI * rand());
  const chars = {};
  ['01', '03', '04', '05', '06', '0b'].forEach(n => {
    const c = new EventTarget(); c.uuid = uuid(n);
    c.startNotifications = () => { M.notif++; return op(c); };
    chars[n] = c;
  });
  const CH = ['03', '04', '05', '06'];
  const send = (c, dv) => { c.value = dv; c.dispatchEvent(new Event('characteristicvaluechanged')); };
  // one packet on each sensor: its number, then twelve samples, two to every three bytes
  const packet = () => {
    const ts = performance.now() / 1000;
    if (window.__egBlink > 0) { for (let i = 0; i < window.__egBlink; i++) blinks.push(sent * 12 / 256 + 0.3 + i * 0.5); window.__egBlink = 0; }
    if (window.__egMove > 0) { moveEnd = sent * 12 / 256 + window.__egMove; window.__egMove = 0; }
    if (window.__egJaw > 0) { jawEnd = sent * 12 / 256 + window.__egJaw; window.__egJaw = 0; }
    const al = window.__egAlpha !== undefined ? window.__egAlpha : 8, th = window.__egTheta !== undefined ? window.__egTheta : 5, off = window.__egOff || [];
    const be = window.__egBeta !== undefined ? window.__egBeta : 2;
    for (let ch = 0; ch < 4; ch++) {
      const dv = new DataView(new ArrayBuffer(20)), n = [];
      dv.setUint16(0, idx & 0xffff);
      for (let j = 0; j < 12; j++) {
        const t = (sent * 12 + j) / 256;
        let v = al * Math.sin(2 * Math.PI * 10 * t + ch) + th * Math.sin(2 * Math.PI * 6 * t + 0.5 * ch) + be * Math.sin(2 * Math.PI * 20 * t + ch) + 3 * gauss();
        if (ch === 1 || ch === 2) blinks.forEach(b => { v += 250 * Math.exp(-Math.pow((t - b) / 0.12, 2)); });
        if (t < moveEnd) v += 180 * Math.sin(2 * Math.PI * 1.3 * t + ch);
        if (t < jawEnd) v += 40 * gauss();
        if (off.includes(ch)) v = 700 * Math.sin(2 * Math.PI * 50 * t) + 300 * gauss();
        n.push(Math.max(0, Math.min(4095, Math.round(v / 0.48828125) + 0x800)));
      }
      for (let j = 0, b = 2; j < 12; j += 2, b += 3) {
        dv.setUint8(b, n[j] >> 4); dv.setUint8(b + 1, ((n[j] & 15) << 4) | (n[j + 1] >> 8)); dv.setUint8(b + 2, n[j + 1] & 255);
      }
      send(chars[CH[ch]], dv);
    }
    blinks = blinks.filter(b => b > sent * 12 / 256 - 1);
    idx++; sent++; M.packets++;
    return ts;
  };
  const pump = () => {
    const due = Math.floor((performance.now() - t0) / 1000 * 256 / 12);
    for (let k = 0; sent < due && k < 600; k++) packet();
  };
  const halt = () => { clearInterval(timer); timer = null; };
  const start = () => {
    if (o.noData || timer) return;
    t0 = performance.now() - sent * 12 / 256 * 1000;
    timer = setInterval(pump, 20);
    if (!o.noTele) { const dv = new DataView(new ArrayBuffer(20)); dv.setUint16(2, 80 * 512); send(chars['0b'], dv); }
  };
  chars['01'].writeValue = v => {
    const b = v instanceof Uint8Array ? v : new Uint8Array(v.buffer || v);
    if (b[0] !== b.length - 1) M.lenOk = false;
    const s = String.fromCharCode.apply(null, Array.from(b.slice(1, 1 + b[0]))).replace(/\n$/, '');
    M.cmds.push(s);
    if (s === 'd') start(); else if (s === 'h') halt();
    return op(undefined);
  };
  const svc = { getCharacteristic(u) {
    const k = Object.keys(chars).find(n => chars[n].uuid === u && !(n === '0b' && o.noTele));
    return k ? op(chars[k]) : Promise.reject(err('NotFoundError', 'No Characteristics matching UUID ' + u + ' found in Service.'));
  } };
  const server = { device: dev, getPrimaryService(u) {
    if (o.hang === 'service') return never();
    return !o.noSvc && u === 0xfe8d ? Promise.resolve(svc) : Promise.reject(err('NotFoundError', 'No Services matching UUID 0000fe8d-0000-1000-8000-00805f9b34fb found in Device.'));
  } };
  dev.gatt = { connected: false, connect() {
    M.connects++;
    if (o.hang === 'link') return never();
    if (window.__museDown) return Promise.reject(err('NetworkError', 'Bluetooth Device is no longer in range.'));
    this.connected = true; return Promise.resolve(server);
  }, disconnect() {
    this.connected = false; halt();
    pend.splice(0).forEach(no => no(err('NetworkError', 'GATT Server is disconnected.')));
  } };
  window.__museDrop = () => { dev.gatt.connected = false; halt(); dev.dispatchEvent(new Event('gattserverdisconnected')); };
  const prev = navigator.bluetooth;
  Object.defineProperty(navigator, 'bluetooth', { configurable: true, value: {
    getAvailability: () => Promise.resolve(true),
    requestDevice: opts => {
      const muse = !!(opts && opts.filters && opts.filters.some(f => (f.services || []).includes(0xfe8d)));
      if (!muse) return prev && prev.requestDevice ? prev.requestDevice.call(prev, opts) : Promise.reject(err('NotFoundError', 'User cancelled the requestDevice() chooser.'));
      M.opts = JSON.parse(JSON.stringify(opts));
      if (o.fail) return Promise.reject(err('SecurityError', 'Bluetooth access is blocked.'));
      if (o.cancel) return Promise.reject(err('NotFoundError', 'User cancelled the requestDevice() chooser.'));
      if (o.noAdapter) return Promise.reject(err('NotFoundError', 'Bluetooth adapter not available.'));
      return Promise.resolve(dev);
    } } });
}
module.exports = museMock;
