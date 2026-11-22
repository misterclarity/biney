// A stand-in motion sensor for the suites, injected with page.addInitScript(motMock, opts): devicemotion events every
// 10 ms of real time from a phone lying on a belly that rises and falls at bpm breaths a minute, tilting it by tilt
// degrees, with noise (m/s²) on every reading. The breathing follows the page's clock (performance.now, which the heart
// sensor's stand-in speeds up when asked), so a sped-up session breathes sped up too. fidget: true adds jolts and turns,
// as when you shift about; none: true sends no readings at all (a computer without the sensor); ios: true makes the
// page ask for motion access first (DeviceMotionEvent.requestPermission), answered with answer ('granted' or 'denied').
// follow: true breathes with window.__motFollow() instead (a lung level from 0, empty, to 1, full, such as the guide's;
// below 0, its own rhythm), lag seconds behind it; flip: true tilts the phone the other way as the belly rises.
// window.__mot: sent (events), asked (permission requests), lv (the lung level now) and set(o) to change any option as it runs.
function motMock(o) {
  const cfg = Object.assign({ bpm: 6, tilt: 2.5, noise: 0.03, fidget: false, none: false, ios: false, answer: 'granted', follow: false, flip: false, lag: 0 }, o || {});
  const M = window.__mot = { sent: 0, asked: 0, lv: 0, set: x => Object.assign(cfg, x) };
  if (cfg.ios) window.DeviceMotionEvent.requestPermission = () => { M.asked++; return Promise.resolve(cfg.answer); };
  const deg = Math.PI / 180, G = 9.81, past = [];
  let lastT = performance.now() / 1000, lastTh = 0;
  setInterval(() => {
    if (cfg.none) return;
    const t = performance.now() / 1000, w = 2 * Math.PI * cfg.bpm / 60;
    let lv = (1 + Math.sin(w * t)) / 2;
    if (cfg.follow && window.__motFollow) {
      past.push([t, window.__motFollow()]);
      while (past.length > 1 && past[1][0] <= t - cfg.lag) past.shift();
      if (past[0][1] >= 0) lv = past[0][1];
    }
    M.lv = lv;
    const th = cfg.tilt * (2 * lv - 1) * (cfg.flip ? -1 : 1);
    const n = () => (Math.random() * 2 - 1) * cfg.noise, fj = () => cfg.fidget ? (Math.random() * 2 - 1) * 2.5 : 0;
    const dt = Math.max(1e-3, t - lastT), rate = (th - lastTh) / dt;
    lastT = t; lastTh = th;
    const e = new DeviceMotionEvent('devicemotion', {
      accelerationIncludingGravity: { x: G * Math.sin(th * deg) + n() + fj(), y: G * Math.sin(0.3 * th * deg) + n() + fj(), z: G * Math.cos(th * deg) + n() + fj() },
      acceleration: { x: n(), y: n(), z: n() },
      rotationRate: { alpha: cfg.fidget ? 60 * Math.random() : 0.2 * Math.random(), beta: rate, gamma: cfg.fidget ? 40 * Math.random() : 0 },
      interval: 10
    });
    M.sent++;
    window.dispatchEvent(e);
  }, 10);
}
module.exports = motMock;
