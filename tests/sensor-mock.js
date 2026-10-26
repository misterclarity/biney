// A stand-in Bluetooth heart-rate sensor for the suites, injected with page.addInitScript(mock, opts).
// speed: how fast the page's clock runs (30 = a 30-minute nap in a minute); rr: send beat-to-beat
// intervals like the HeartMath sensor (false: heart rate only, like a Garmin watch); fail: refuse to pair;
// hang: "link", "service" or "read", a step that never answers (hangOnce: only on the first try);
// late: { link, service or read: ms }, a step that answers only after that long on the first try, like one
// waiting for a pairing request to be accepted; noHR: links up but offers only battery and device information;
// refuse: the readings are refused on the first try, as when a pairing request isn't accepted;
// probeHang: its battery level, the one small thing it has to test-read, never answers;
// quick: scales the page's connection deadlines and pauses down, so a test needn't wait 15 seconds.
// Heart rate swings with the breathing pace on screen around 64 bpm, or around window.__hrBase if a test sets it.
function mock({ speed, rr, fail, hang, hangOnce, late, noHR, refuse, probeHang, quick }) {
  const realNow = performance.now.bind(performance), t0 = realNow();
  if (speed !== 1) performance.now = () => t0 + (realNow() - t0) * speed;
  if (quick) window.__hrScale = quick;
  let tries = 0;
  window.__hrTries = () => tries;
  const stuck = step => hang === step && (!hangOnce || tries === 1), never = () => new Promise(() => {});
  const later = (step, v) => late && late[step] && tries === 1 ? new Promise(r => setTimeout(() => r(v), late[step])) : Promise.resolve(v);
  const uuid = n => '0000' + n + '-0000-1000-8000-00805f9b34fb';
  const err = (name, message) => Object.assign(new Error(message), { name });
  const chr = new EventTarget(); let timer = null;
  chr.startNotifications = () => {
    if (stuck('read')) return never();
    if (refuse && tries === 1) return Promise.reject(err('SecurityError', 'GATT operation not authorized.'));
    return later('read').then(() => { clearInterval(timer); timer = setInterval(() => {
      const t = performance.now() / 1000, el = document.querySelector('#bRateV');
      const rate = el ? parseFloat(el.textContent) : 6;
      const amp = Math.max(1.5, 8 - 4 * Math.abs(rate - 5.5));
      const hr = (window.__hrBase || 64) + amp * Math.sin(2 * Math.PI * t * rate / 60) + (Math.random() - 0.5);
      let dv;
      if (rr) { dv = new DataView(new ArrayBuffer(4)); dv.setUint8(0, 0x16); dv.setUint8(1, Math.round(hr)); dv.setUint16(2, Math.round(60000 / hr * 1.024), true); }
      else { dv = new DataView(new ArrayBuffer(2)); dv.setUint8(0, 0); dv.setUint8(1, Math.round(hr)); }
      chr.value = dv; chr.dispatchEvent(new Event('characteristicvaluechanged'));
    }, 1000 / speed); });
  };
  const dev = new EventTarget(); dev.name = rr ? 'Inner Balance' : 'Venu 4';
  dev.gatt = { connected: false, connect() {
    tries++;
    if (stuck('link')) return never();
    this.connected = true;
    const none = (what, id) => Promise.reject(err('NotFoundError', 'No ' + what + ' matching UUID ' + uuid(id) + ' found in ' + (what === 'Services' ? 'Device.' : 'Service.')));
    const hrs = { getCharacteristic: n => n === 'heart_rate_measurement' ? Promise.resolve(chr) : none('Characteristics', '2a38') };
    const bas = { getCharacteristic: n => n === 'battery_level' ? Promise.resolve({ readValue: () => probeHang ? never() : Promise.resolve(new DataView(Uint8Array.of(80).buffer)) }) : none('Characteristics', '2a19') };
    return later('link', {
      getPrimaryService: n => n === 'battery_service' ? Promise.resolve(bas)
        : n !== 'heart_rate' ? none('Services', '180a')
        : stuck('service') ? never()
        : noHR ? none('Services', '180d')
        : later('service', hrs),
      getPrimaryServices: () => Promise.resolve((noHR ? ['180f', '180a'] : ['180d', '180f']).map(n => ({ uuid: uuid(n) })))
    });
  }, disconnect() { this.connected = false; clearInterval(timer); } };
  Object.defineProperty(navigator, 'bluetooth', { configurable: true, value: {
    getAvailability: () => Promise.resolve(true),
    requestDevice: () => fail ? Promise.reject(Object.assign(new Error('blocked by permissions policy'), { name: 'SecurityError' })) : Promise.resolve(dev) } });
}
module.exports = mock;
