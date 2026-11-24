// A stand-in camera for the suites, injected with page.addInitScript(camMock, opts): getUserMedia({ video }) returns a
// real stream from a small canvas filled with a lit fingertip's red, which darkens a shade at each heartbeat, so the
// page's own frame reading, filters and beat finding run end to end. The heart rate is bpm, swinging by rsa beats a
// minute (peak to trough) with the breath at br breaths a minute; amp is how far the red dips at a beat, noise a random
// flicker on every frame. cover: false shows a grey room instead of a fingertip; clip: true holds red at full brightness
// so the pulse shows only in green; torch: false gives the camera no light to switch on; fail names the error
// getUserMedia gives instead (such as 'NotAllowedError'). A request for sound goes on to the getUserMedia there before
// (the microphone's stand-in). window.__cam: calls, the constraints asked for (opts), stopped tracks, the light's
// switchings (torch), every true beat on the page's clock (beats), and set(o) to change any option as it runs.
function camMock(o) {
  const cfg = Object.assign({ bpm: 64, rsa: 0, br: 6, amp: 8, noise: 0, cover: true, clip: false, torch: true, fail: '' }, o || {});
  const C = window.__cam = { calls: 0, opts: [], stopped: 0, torch: [], beats: [], frames: 0, set: x => Object.assign(cfg, x) };
  const md = navigator.mediaDevices || {};
  if (!navigator.mediaDevices) Object.defineProperty(navigator, 'mediaDevices', { configurable: true, value: md });
  const prev = md.getUserMedia ? md.getUserMedia.bind(md) : null;
  md.getUserMedia = c => {
    if (!c || !c.video) return prev ? prev(c) : Promise.reject(Object.assign(new Error('mock'), { name: 'NotFoundError' }));
    C.calls++; C.opts.push(JSON.parse(JSON.stringify(c)));
    if (cfg.fail) return Promise.reject(Object.assign(new Error('mock'), { name: cfg.fail }));
    const cv = document.createElement('canvas'); cv.width = 64; cv.height = 48;
    const x = cv.getContext('2d');
    let ph = 0, last = performance.now() / 1000;
    // a pulse wave: a sharp rise to the systolic peak, then the smaller wave after the dicrotic notch
    const wave = u => Math.exp(-Math.pow((u - 0.15) / 0.07, 2)) + 0.35 * Math.exp(-Math.pow((u - 0.45) / 0.1, 2));
    const draw = () => {
      const t = performance.now() / 1000, dt = Math.min(0.2, t - last); last = t;
      const f = (cfg.bpm + cfg.rsa / 2 * Math.sin(2 * Math.PI * cfg.br / 60 * t)) / 60;
      const p0 = ph; ph += f * dt;
      if (Math.floor(ph) > Math.floor(p0)) C.beats.push(t - (ph - Math.floor(ph)) / f);      // when the beat began
      while (C.beats.length > 400) C.beats.shift();
      const p = wave(ph - Math.floor(ph)), n = () => cfg.noise ? (Math.random() * 2 - 1) * cfg.noise : 0;
      const r = cfg.clip ? 255 : Math.round(205 - cfg.amp * p + n()), g = Math.round((cfg.clip ? 110 : 34) - (cfg.clip ? cfg.amp : cfg.amp * 0.25) * p + n()), b = 26;
      x.fillStyle = cfg.cover ? 'rgb(' + r + ',' + g + ',' + b + ')' : 'rgb(' + (118 + Math.round(n())) + ',124,130)';
      x.fillRect(0, 0, 64, 48);
      C.frames++;
    };
    draw();
    const iv = setInterval(draw, 1000 / 60);
    const stream = cv.captureStream(30), tr = stream.getVideoTracks()[0];
    tr.getCapabilities = () => cfg.torch ? { torch: [true, false], facingMode: ['environment'] } : { facingMode: ['environment'] };
    tr.applyConstraints = k => { if (k && k.advanced) k.advanced.forEach(a => { if ('torch' in a) C.torch.push(a.torch); }); return Promise.resolve(); };
    const stop = tr.stop.bind(tr);
    tr.stop = () => { C.stopped++; clearInterval(iv); stop(); };
    return Promise.resolve(stream);
  };
}
module.exports = camMock;
