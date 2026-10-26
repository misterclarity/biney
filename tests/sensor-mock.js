// A stand-in Bluetooth heart-rate sensor for the suites, injected with page.addInitScript(mock, opts).
// speed: how fast the page's clock runs (30 = a 30-minute nap in a minute); rr: send beat-to-beat
// intervals like the HeartMath sensor (false: heart rate only, like a Garmin watch); fail: refuse to pair;
// hang: "link", "service" or "read", a step that never answers (hangOnce: only on the first try);
// quick: scales the page's connection deadlines and pauses down, so a test needn't wait 15 seconds.
// Heart rate swings with the breathing pace on screen around 64 bpm, or around window.__hrBase if a test sets it.
function mock({ speed, rr, fail, hang, hangOnce, quick }) {
  const realNow = performance.now.bind(performance), t0 = realNow();
  if (speed !== 1) performance.now = () => t0 + (realNow() - t0) * speed;
  if (quick) window.__hrScale = quick;
  let tries = 0;
  window.__hrTries = () => tries;
  const stuck = step => hang === step && (!hangOnce || tries === 1), never = () => new Promise(() => {});
  const chr = new EventTarget(); let timer = null;
  chr.startNotifications = () => {
    if (stuck('read')) return never();
    timer = setInterval(() => {
      const t = performance.now() / 1000, el = document.querySelector('#bRateV');
      const rate = el ? parseFloat(el.textContent) : 6;
      const amp = Math.max(1.5, 8 - 4 * Math.abs(rate - 5.5));
      const hr = (window.__hrBase || 64) + amp * Math.sin(2 * Math.PI * t * rate / 60) + (Math.random() - 0.5);
      let dv;
      if (rr) { dv = new DataView(new ArrayBuffer(4)); dv.setUint8(0, 0x16); dv.setUint8(1, Math.round(hr)); dv.setUint16(2, Math.round(60000 / hr * 1.024), true); }
      else { dv = new DataView(new ArrayBuffer(2)); dv.setUint8(0, 0); dv.setUint8(1, Math.round(hr)); }
      chr.value = dv; chr.dispatchEvent(new Event('characteristicvaluechanged'));
    }, 1000 / speed);
    return Promise.resolve();
  };
  const dev = new EventTarget(); dev.name = rr ? 'Inner Balance' : 'Venu 4';
  dev.gatt = { connected: false, connect() {
    tries++;
    if (stuck('link')) return never();
    this.connected = true;
    return Promise.resolve({ getPrimaryService: () => stuck('service') ? never() : Promise.resolve({ getCharacteristic: () => Promise.resolve(chr) }) });
  }, disconnect() { this.connected = false; clearInterval(timer); } };
  Object.defineProperty(navigator, 'bluetooth', { configurable: true, value: {
    getAvailability: () => Promise.resolve(true),
    requestDevice: () => fail ? Promise.reject(Object.assign(new Error('blocked by permissions policy'), { name: 'SecurityError' })) : Promise.resolve(dev) } });
}
module.exports = mock;
