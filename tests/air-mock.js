// A stand-in Aranet4 CO2 monitor and a fingertip pulse oximeter (Bluetooth's standard PLX service) for the suites,
// injected with page.addInitScript(airMock, opts), after the heart sensor's or the headband's mock when they're used: it
// answers requestDevice when the page asks for an Aranet4 (its name prefix or one of its two services) or for the pulse
// oximeter service (0x1822), and hands any other request to what was there before.
// The Aranet4 answers each read of its current readings with window.__co2 ppm (1250 unless a test sets it), 22.5 °C,
// 1012.3 hPa, 45% humidity, battery 87%, green, a 60-second interval and the last measurement 12 seconds ago, in the
// detailed form (f0cd3001) or, with opts.aranet.short, the plain one (f0cd1503). window.__co2 = 0 sends "no reading yet".
// opts.aranet: old (firmware before 1.2: only the old service), short, pair (the first read is refused, as when the
// six-digit code isn't typed; reads work once window.__paired is true), cancel (the chooser closed), noSvc (another
// device), hang ('link' | 'read'), failAfter (reads after the first n fail).
// The oximeter sends a PLX continuous measurement (flags: measurement status and device and sensor status present) every
// second by the page's clock: SpO2 window.__spo2 (98) and pulse window.__pr (64) as SFLOATs, "validated data"; a test can
// set window.__oxFinger = false (sensor unconnected to the user), window.__oxWeak = true (a poor signal), window.__oxDemo =
// true (demonstration data); window.__oxDrop() drops the link. opts.ox: spot (spot-check measurements only, by indication),
// noSvc (an oximeter of another kind), cancel, hang ('link' | 'read').
// window.__air = { opts: { aranet, ox } (what requestDevice was asked), reads, connects, notif, sent }.
function airMock(o) {
  o = o || {};
  const A = o.aranet || {}, X = o.ox || {};
  const M = window.__air = { opts: {}, reads: 0, connects: 0, notif: 0, sent: 0 };
  const err = (name, msg) => Object.assign(new Error(msg || name), { name });
  const never = () => new Promise(() => {});
  const later = v => new Promise(r => setTimeout(() => r(v), 2));
  const OLD = 'f0cd1400-95da-4f4b-9ac8-aa55d312af0c', DET = 'f0cd3001-95da-4f4b-9ac8-aa55d312af0c', CUR = 'f0cd1503-95da-4f4b-9ac8-aa55d312af0c';

  /* ----- the Aranet4 ----- */
  const ar = new EventTarget(); ar.name = 'Aranet4 1A2B3';
  const chr = uuid => ({ uuid, readValue() {
    M.reads++;
    if (A.hang === 'read') return never();
    if (A.pair && !window.__paired) return Promise.reject(err('SecurityError', 'GATT operation not authorized.'));
    if (A.failAfter !== undefined && M.reads > A.failAfter) return Promise.reject(err('NetworkError', 'GATT Server is disconnected.'));
    const det = uuid === DET, dv = new DataView(new ArrayBuffer(det ? 13 : 9));
    const co2 = window.__co2 !== undefined ? window.__co2 : 1250;
    dv.setUint16(0, co2 === 0 ? 0x8000 : co2, true); dv.setUint16(2, Math.round(22.5 * 20), true); dv.setUint16(4, 10123, true);
    dv.setUint8(6, 45); dv.setUint8(7, 87); dv.setUint8(8, co2 >= 1400 ? 3 : co2 >= 1000 ? 2 : 1);
    if (det) { dv.setUint16(9, 60, true); dv.setUint16(11, 12, true); }
    return later(dv);
  } });
  const arSvc = { getCharacteristic(u) {
    if (u === DET && !A.short) return later(chr(DET));
    if (u === CUR) return later(chr(CUR));
    return Promise.reject(err('NotFoundError', 'No Characteristics matching UUID ' + u + ' found in Service.'));
  } };
  const arSrv = { device: ar, getPrimaryService(u) {
    if (A.noSvc) return Promise.reject(err('NotFoundError', 'No Services matching UUID found in Device.'));
    if (u === 0xfce0 && !A.old) return later(arSvc);
    if (u === OLD) return later(arSvc);
    return Promise.reject(err('NotFoundError', 'No Services matching UUID ' + u + ' found in Device.'));
  } };
  ar.gatt = { connected: false, connect() {
    M.connects++;
    if (A.hang === 'link') return never();
    this.connected = true; return later(arSrv);
  }, disconnect() { this.connected = false; } };

  /* ----- the oximeter ----- */
  const ox = new EventTarget(); ox.name = 'PLX Oximeter';
  let timer = null, last = 0;
  const sf = v => (Math.round(v) & 0x0fff);             // a whole number as an SFLOAT, exponent 0
  const measure = () => {
    const cont = !X.spot, dv = new DataView(new ArrayBuffer(cont ? 10 : 10));
    let ms = 1 << 7, dss = 0;                               // validated data
    if (window.__oxDemo) ms |= 1 << 10;
    if (window.__oxWeak) dss |= 1 << 4;                      // poor signal
    if (window.__oxFinger === false) dss |= 1 << 11;         // sensor unconnected to the user
    dv.setUint8(0, cont ? (4 | 8) : (2 | 4));
    dv.setUint16(1, sf(window.__spo2 !== undefined ? window.__spo2 : 98), true);
    dv.setUint16(3, sf(window.__pr !== undefined ? window.__pr : 64), true);
    dv.setUint16(5, ms, true); dv.setUint16(7, dss & 0xffff, true); dv.setUint8(9, dss >> 16);
    return dv;
  };
  const oxChar = new EventTarget(); oxChar.uuid = X.spot ? 0x2a5e : 0x2a5f;
  const send = () => { oxChar.value = measure(); M.sent++; oxChar.dispatchEvent(new Event('characteristicvaluechanged')); };
  const pump = () => { const now = performance.now(); if (now - last >= 1000) { last = now; send(); } };
  oxChar.startNotifications = () => {
    M.notif++;
    if (X.hang === 'read') return never();
    clearInterval(timer); last = 0; timer = setInterval(pump, 50);
    return later(oxChar);
  };
  oxChar.stopNotifications = () => { clearInterval(timer); timer = null; return later(oxChar); };
  const oxSvc = { getCharacteristic(u) {
    if ((u === 0x2a5f && !X.spot) || (u === 0x2a5e && X.spot)) return later(oxChar);
    return Promise.reject(err('NotFoundError', 'No Characteristics matching UUID ' + u + ' found in Service.'));
  } };
  const oxSrv = { device: ox, getPrimaryService(u) {
    return !X.noSvc && u === 0x1822 ? later(oxSvc) : Promise.reject(err('NotFoundError', 'No Services matching UUID ' + u + ' found in Device.'));
  } };
  ox.gatt = { connected: false, connect() {
    M.connects++;
    if (X.hang === 'link') return never();
    if (window.__oxDown) return Promise.reject(err('NetworkError', 'Bluetooth Device is no longer in range.'));
    this.connected = true; return later(oxSrv);
  }, disconnect() { this.connected = false; clearInterval(timer); timer = null; } };
  window.__oxDrop = () => { ox.gatt.connected = false; clearInterval(timer); timer = null; ox.dispatchEvent(new Event('gattserverdisconnected')); };
  window.__arDrop = () => { ar.gatt.connected = false; ar.dispatchEvent(new Event('gattserverdisconnected')); };

  const prev = navigator.bluetooth;
  Object.defineProperty(navigator, 'bluetooth', { configurable: true, value: {
    getAvailability: () => Promise.resolve(true),
    requestDevice: opts => {
      const f = (opts && opts.filters) || [];
      const isAr = f.some(x => x.namePrefix === 'Aranet4' || (x.services || []).includes(0xfce0)), isOx = f.some(x => (x.services || []).includes(0x1822));
      if (!isAr && !isOx) return prev && prev.requestDevice ? prev.requestDevice.call(prev, opts) : Promise.reject(err('NotFoundError', 'User cancelled the requestDevice() chooser.'));
      const D = isAr ? A : X;
      M.opts[isAr ? 'aranet' : 'ox'] = JSON.parse(JSON.stringify(opts));
      if (D.cancel) return Promise.reject(err('NotFoundError', 'User cancelled the requestDevice() chooser.'));
      return Promise.resolve(isAr ? ar : ox);
    } } });
}
module.exports = airMock;
