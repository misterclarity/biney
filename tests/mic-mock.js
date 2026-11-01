// A stand-in microphone for the suites, injected with page.addInitScript(micMock, opts): getUserMedia returns a real
// audio stream of breath-like noise, louder on each out-breath, at bpm breaths a minute (window.__micBpm, if a test
// sets it before the microphone starts, wins). inFrac: the in-breath's share of each breath; aEx and aIn: how loud
// the out- and in-breath are; floor: the room's noise. label names the microphone, and devices lists the ones to
// choose from (each with deviceId and label); fail: the error getUserMedia gives instead, such as 'NotAllowedError'.
// window.__mic counts calls and stopped tracks and keeps the constraints asked for.
function micMock(o) {
  o = Object.assign({ bpm: 6, inFrac: 0.4, aEx: 1, aIn: 0.3, floor: 0.02, label: 'Built-in microphone', fail: '', silent: false }, o || {});
  window.__mic = { calls: 0, stopped: 0, opts: [] };
  const devs = o.devices || [{ kind: 'audioinput', deviceId: 'default', label: o.label, groupId: 'a' }];
  const md = navigator.mediaDevices || {};
  if (!navigator.mediaDevices) Object.defineProperty(navigator, 'mediaDevices', { configurable: true, value: md });
  md.enumerateDevices = () => Promise.resolve(devs.map(d => Object.assign({ kind: 'audioinput', groupId: 'a' }, d)));
  md.getUserMedia = c => {
    window.__mic.calls++; window.__mic.opts.push(JSON.parse(JSON.stringify(c)));
    if (o.fail) return Promise.reject(Object.assign(new Error('mock'), { name: o.fail }));
    const ctx = new AudioContext(), sr = ctx.sampleRate, buf = ctx.createBuffer(1, sr * 2, sr), d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource(); src.buffer = buf; src.loop = true;
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 1500; bp.Q.value = 0.7;
    const g = ctx.createGain(), fl = ctx.createGain(), dest = ctx.createMediaStreamDestination();
    g.gain.value = 0; fl.gain.value = o.silent ? 0 : o.floor;
    src.connect(bp); bp.connect(g); g.connect(dest); src.connect(fl); fl.connect(dest);
    src.start();
    const bpm = window.__micBpm || o.bpm, t0 = performance.now() / 1000, T = 60 / bpm, ti = T * o.inFrac, te = T - ti;
    const env = t => { const x = ((t - t0) % T + T) % T;
      return x < ti ? o.aIn * Math.pow(Math.sin(Math.PI * x / ti), 2) : o.aEx * Math.pow(Math.sin(Math.PI * (x - ti) / te), 2); };
    const iv = setInterval(() => { if (!o.silent) g.gain.setTargetAtTime(env(performance.now() / 1000), ctx.currentTime, 0.02); }, 20);
    const id = c.audio && c.audio.deviceId ? c.audio.deviceId.exact : devs[0].deviceId;
    const stream = dest.stream, tr = stream.getAudioTracks()[0];
    Object.defineProperty(tr, 'label', { value: (devs.find(x => x.deviceId === id) || {}).label || o.label });
    tr.getSettings = () => ({ deviceId: id });
    const stop = tr.stop.bind(tr);
    tr.stop = () => { window.__mic.stopped++; clearInterval(iv); try { ctx.close(); } catch (e) {} stop(); };
    return Promise.resolve(stream);
  };
}
module.exports = micMock;
