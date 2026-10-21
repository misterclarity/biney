  /* ------------------------------- lock screen -------------------------------
     A track shows on the lock screen and in the notifications while it plays or is paused,
     with its name, how far it has got, and play, pause and stop. Android offers those controls
     only for an audio element of five seconds or more, and the tracks are made live with Web
     Audio, which gets none; so a silent, looping element plays alongside to carry them, and
     the tones themselves are untouched. As with any media app, a playing track then pauses
     music in other apps, and a call pauses the track. Settings can turn it off. Practices and
     the breathing guide keep to their own screens.
  ---------------------------------------------------------------------------- */

  var MS = {
    el: null, url: "",
    want: "off",      // "play", "pause" or "off": what the app last asked of the element
    sys: false,       // the phone paused the track (a call, another app), so it may resume it too
    track: null       // the track the lock screen is showing
  };
  var MS_ART = [{ src: "icons/icon-192.png", sizes: "192x192", type: "image/png" }, { src: "icons/icon-512.png", sizes: "512x512", type: "image/png" }];

  function msOk() { return !!(navigator.mediaSession && window.MediaMetadata); }
  // six seconds of silence, 8-bit mono at 8 kHz (47 KB), made here so the app stays one file
  function msSilence() {
    var rate = 8000, n = rate * 6, b = new Uint8Array(44 + n), v = new DataView(b.buffer);
    var tag = function (at, s) { for (var i = 0; i < 4; i++) b[at + i] = s.charCodeAt(i); };
    tag(0, "RIFF"); v.setUint32(4, 36 + n, true); tag(8, "WAVE");
    tag(12, "fmt "); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
    v.setUint32(24, rate, true); v.setUint32(28, rate, true); v.setUint16(32, 1, true); v.setUint16(34, 8, true);
    tag(36, "data"); v.setUint32(40, n, true);
    for (var i = 44; i < b.length; i++) b[i] = 128;     // 8-bit sound is unsigned: 128 is silence
    return URL.createObjectURL(new Blob([b], { type: "audio/wav" }));
  }
  function msEl() {
    if (MS.el) return MS.el;
    var el = MS.el = new Audio();
    el.loop = true;
    // something else took the sound: the track pauses with it, and comes back if the phone gives it back
    el.addEventListener("pause", function () {
      if (MS.want === "play" && A.playing) { MS.sys = true; pause(); }
    });
    el.addEventListener("play", function () {
      if (MS.want === "pause" && MS.sys && A.track && !A.playing) play();
    });
    return el;
  }
  // what the lock screen should show: a track of its own, playing or paused part of the way through
  function msWanted() {
    if (!msOk() || !ST.lockControls || !A.track || A.track.practice) return "off";
    return A.playing ? "play" : A.elapsed > 0 ? "pause" : "off";
  }
  function msSync() {
    if (!msOk()) return;
    var want = msWanted(), ms = navigator.mediaSession;
    if (want === "off") { msOff(); return; }
    var t = A.track, el = msEl();
    if (MS.track !== t) {
      MS.track = t;
      ms.metadata = new MediaMetadata({ title: t.name, artist: "Entrain", album: t.band + " · " + trBeatTxt(t), artwork: MS_ART });
    }
    ms.playbackState = want === "play" ? "playing" : "paused";
    msPosition();
    MS.want = want;
    if (want === "play") {
      MS.sys = false;
      if (!el.getAttribute("src")) { MS.url = MS.url || msSilence(); el.src = MS.url; }
      if (el.paused) { var p = el.play(); if (p && p.catch) p.catch(function () {}); }
    } else if (!el.paused) el.pause();
  }
  // the track has stopped or is no longer the lock screen's: end the session, so the controls go away
  function msOff() {
    var ms = navigator.mediaSession;
    MS.want = "off"; MS.sys = false; MS.track = null;
    if (MS.el && MS.el.getAttribute("src")) { MS.el.pause(); MS.el.removeAttribute("src"); MS.el.load(); }
    if (ms.metadata) ms.metadata = null;
    ms.playbackState = "none";
    try { if (ms.setPositionState) ms.setPositionState(); } catch (e) {}
  }
  // how far it has got; open-ended listening has no end to count down to
  function msPosition() {
    var ms = navigator.mediaSession, t = A.track;
    if (!ms.setPositionState || !t) return;
    var total = t.minutes * 60, open = A.phase === "task" || $("#openEnded").checked;
    var at = Math.max(0, A.playing && A.ctx ? A.ctx.currentTime - A.startedAt : A.elapsed);
    try {
      ms.setPositionState(open || !(total > 0) ? { duration: Infinity, playbackRate: 1, position: at }
        : { duration: total, playbackRate: 1, position: Math.min(at, total) });
    } catch (e) {}
  }
  function msInit() {
    if (!msOk()) return;
    var ms = navigator.mediaSession;
    var on = function (action, fn) { try { ms.setActionHandler(action, fn); } catch (e) {} };
    on("play", function () { if (A.track && !A.playing) play(); });
    on("pause", function () { if (A.playing) pause(); });
    on("stop", function () { if (A.track) hardStop(false); });
  }
