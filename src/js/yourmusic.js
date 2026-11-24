  /* ------------------------------- your own music -------------------------------
     Songs from this device, played under any session. The brain-wave guide rates music you choose
     yourself as strong evidence for stress relief, because liked music works better than music
     chosen for you (Learn, #l-mymusic), so Settings takes audio files from the device and keeps
     them in this browser's own database (IndexedDB), where they play offline and nothing is sent
     anywhere. The list of their names, lengths and thumbs is kept with the rest of the settings,
     so a backup carries the names but never the files: restored on another phone, a song waits
     there until its file is added again, and keeps its thumbs.
     Chosen as Yours under Music (music.js: Settings, Breathe, the player, a practice's Options,
     Music Break), a song plays through one audio element routed into the app's audio graph, so it
     shares the background sound's volume, fades in and out with the session, and goes quiet with
     I need to stop. Pausing keeps your place in the song; the next song is picked by chance,
     weighted by your thumbs: one you've liked comes up more often (up to five times as often),
     one you've turned down is left out while there are others.
     After a practice, and under Breathe after a breathing session, each song that played for at
     least 20 seconds gets a thumbs up and a thumbs down.
     It's a new technique, so adding songs and choosing Yours open with a donation (supporter.js).
  ------------------------------------------------------------------------------ */

  var YM_NAME = "Your own music";                      // the unlock dialog: "… is one of the new techniques."
  var YM_MAX = 40, YM_BIG = 80 * 1024 * 1024;          // songs on this device, and the largest file (bytes)
  var YM_MIN = 20;                                     // seconds a song plays before it's asked about
  var YM_TYPES = /\.(mp3|m4a|aac|mp4|wav|wave|ogg|oga|opus|flac|webm|weba|caf|aif|aiff)$/i;
  /* list: the songs, as kept { id, name, secs, size, up, down, at }; here: the ones whose file is on this device;
     db: the database, once open; el, src, g, lvl, out: the playing element and its way into the audio graph (g: this
     run's fade, lvl: a session's level, out: the volume); on: playing for a session (or a taste in Settings); cur: the
     song in the element; url: its object URL; stopAt: when it last stopped (a pause keeps your place for a while);
     gen: guards timers from an earlier start; outAt: when the last stop's fade ends (ms); segs: what played and
     when, for the end screens; votes: the thumbs given, by occasion; taste: a song tried in Settings; bless: the
     element unlocked for Safari; bFrom, bWas: Breathe's session, watched for its end; occ: Breathe's last session's
     occasion; msg: what Settings says about the last add. */
  var YM = { list: [], here: {}, bad: {}, db: null, dbTried: false, el: null, src: null, g: null, lvl: null, out: null, lv: 1,
    on: false, cur: "", url: "", stopAt: 0, gen: 0, segs: [], votes: {}, taste: "", bless: "", blessing: false, sys: false,
    bFrom: 0, bWas: "idle", occ: "", busy: false, msg: "", err: "", outAt: 0 };

  /* ----- the list, kept with the settings (names only) ----- */
  function ymId() { return (Date.now().toString(36) + Math.random().toString(36).slice(2, 7)).slice(-12); }
  function ymLoadList() {
    var l = [];
    try { var v = JSON.parse(store.get("myMusic") || "[]"); if (Array.isArray(v)) l = v; } catch (e) {}
    YM.list = l.filter(function (s) { return s && typeof s === "object" && /^[a-z0-9]{1,16}$/.test(s.id) && typeof s.name === "string"; }).map(function (s) {
      return { id: s.id, name: s.name.slice(0, 120), secs: Math.max(0, +s.secs || 0), size: Math.max(0, +s.size || 0),
        up: Math.max(0, Math.round(+s.up || 0)), down: Math.max(0, Math.round(+s.down || 0)), at: +s.at || 0 };
    }).slice(0, 200);
  }
  function ymSaveList() { store.set("myMusic", JSON.stringify(YM.list)); }
  function ymGet(id) { for (var i = 0; i < YM.list.length; i++) if (YM.list[i].id === id) return YM.list[i]; return null; }
  // the songs that can play on this device
  function ymHereList() { return YM.list.filter(function (s) { return YM.here[s.id] && !YM.bad[s.id]; }); }
  function ymHereN() { return ymHereList().length; }
  // whether Yours can play: unlocked, with a song here
  function ymCan() { return supOn() && ymHereN() > 0; }
  // a name from a file's: without its extension, its underscores as spaces
  function ymNameOf(f) { return String(f || "").replace(/\.[a-z0-9]{2,5}$/i, "").replace(/[_]+/g, " ").replace(/\s+/g, " ").trim().slice(0, 80) || "A song"; }
  // a song's standing, from its thumbs: liked counts up to five times as likely, turned down left out
  function ymScore(s) { return (s.up || 0) - (s.down || 0); }
  function ymWeight(s) { var n = ymScore(s); return n > 0 ? 1 + Math.min(n, 4) : n < 0 ? 0 : 1; }
  function ymStanding(s) {
    var n = ymScore(s);
    return n > 0 ? "liked" + (n > 1 ? " " + n + " times" : "") + ", so it comes up more often" : n < 0 ? "turned down, so it plays only when there's nothing else" : "";
  }
  /* The next song, by chance, weighted by your thumbs; not the one just played (not) while another may play, so a
     song turned down stays out even then (pure but for Math.random; r, from 0 to 1, stands in for it in the tests) */
  function ymPick(not, r) {
    var c = ymHereList(), add = function (a, b) { return a + b; };
    if (!c.length) return "";
    var w = c.map(ymWeight);
    if (!w.reduce(add, 0)) w = c.map(function () { return 1; });      // every one turned down: they play anyway, in turn
    if (not && c.length > 1) {
      var w2 = w.map(function (x, i) { return c[i].id === not ? 0 : x; });
      if (w2.reduce(add, 0) > 0) w = w2;
    }
    var sum = w.reduce(add, 0), x = (r === undefined ? Math.random() : r) * sum;
    for (var i = 0; i < c.length; i++) { x -= w[i]; if (x < 0) return c[i].id; }
    return c[c.length - 1].id;
  }

  /* ----- the files, in this browser's database ----- */
  function ymDb(then) {
    if (YM.db) { then(YM.db); return; }
    if (!window.indexedDB) { YM.err = "nodb"; then(null); return; }
    try {
      var rq = indexedDB.open("entrain-music", 1);
      rq.onupgradeneeded = function () {
        var db = rq.result;
        if (!db.objectStoreNames.contains("meta")) db.createObjectStore("meta", { keyPath: "id" });
        if (!db.objectStoreNames.contains("data")) db.createObjectStore("data", { keyPath: "id" });
      };
      rq.onsuccess = function () { YM.db = rq.result; YM.err = ""; then(YM.db); };
      rq.onerror = function () { YM.err = "nodb"; then(null); };
      rq.onblocked = function () { YM.err = "nodb"; then(null); };
    } catch (e) { YM.err = "nodb"; then(null); }
  }
  // which files are here: the list learns them, and a file the list has lost (a backup restored from before it was
  // added) comes back into the list with its name
  function ymScan(then) {
    ymDb(function (db) {
      if (!db) { YM.here = {}; if (then) then(); return; }
      try {
        var out = [], rq = db.transaction("meta", "readonly").objectStore("meta").openCursor();
        rq.onsuccess = function () {
          var c = rq.result;
          if (c) { out.push(c.value); c.continue(); return; }
          YM.here = {};
          var add = false;
          out.forEach(function (m) {
            if (!m || !m.id) return;
            YM.here[m.id] = true;
            if (!ymGet(m.id)) { YM.list.push({ id: m.id, name: String(m.name || "A song").slice(0, 120), secs: +m.secs || 0, size: +m.size || 0, up: 0, down: 0, at: +m.at || Date.now() }); add = true; }
          });
          if (add) ymSaveList();
          if (then) then();
        };
        rq.onerror = function () { if (then) then(); };
      } catch (e) { if (then) then(); }
    });
  }
  function ymRead(id, then) {
    ymDb(function (db) {
      if (!db) { then(null); return; }
      try {
        var rq = db.transaction(["meta", "data"], "readonly"), m = null, d = null;
        rq.objectStore("meta").get(id).onsuccess = function (e) { m = e.target.result || null; };
        rq.objectStore("data").get(id).onsuccess = function (e) { d = e.target.result || null; };
        rq.oncomplete = function () { then(m && d && d.data ? { type: m.type, data: d.data } : null); };
        rq.onerror = function () { then(null); };
      } catch (e) { then(null); }
    });
  }
  function ymPut(meta, data, then) {
    ymDb(function (db) {
      if (!db) { then("nodb"); return; }
      try {
        var tx = db.transaction(["meta", "data"], "readwrite");
        tx.objectStore("meta").put(meta);
        tx.objectStore("data").put({ id: meta.id, data: data });
        tx.oncomplete = function () { then(""); };
        tx.onabort = tx.onerror = function () { then(tx.error && tx.error.name === "QuotaExceededError" ? "full" : "fail"); };
      } catch (e) { then(e && e.name === "QuotaExceededError" ? "full" : "fail"); }
    });
  }
  function ymDrop(id, then) {
    ymDb(function (db) {
      if (!db) { if (then) then(); return; }
      try {
        var tx = db.transaction(["meta", "data"], "readwrite");
        tx.objectStore("meta").delete(id); tx.objectStore("data").delete(id);
        tx.oncomplete = tx.onerror = tx.onabort = function () { if (then) then(); };
      } catch (e) { if (then) then(); }
    });
  }

  /* ----- adding songs ----- */
  function ymIsAudio(f) { return /^audio\//.test(f.type || "") || YM_TYPES.test(f.name || ""); }
  // whether this browser can play a file, and its length: an element of its own reads the file's header
  function ymProbe(f, then) {
    var url, el = new Audio(), done = false, t;
    var fin = function (secs) {
      if (done) return;
      done = true; clearTimeout(t);
      try { el.removeAttribute("src"); el.load(); } catch (e) {}
      try { URL.revokeObjectURL(url); } catch (e) {}
      then(secs);
    };
    try { url = URL.createObjectURL(f); } catch (e) { then(-1); return; }
    el.preload = "metadata";
    el.addEventListener("loadedmetadata", function () { fin(isFinite(el.duration) && el.duration > 0 ? el.duration : 0); });
    el.addEventListener("error", function () { fin(-1); });
    t = setTimeout(function () { fin(-1); }, 15000);
    el.src = url;
  }
  function ymBytes(f, then) {
    if (f.arrayBuffer) { f.arrayBuffer().then(then, function () { then(null); }); return; }
    var r = new FileReader();
    r.onload = function () { then(r.result); };
    r.onerror = function () { then(null); };
    r.readAsArrayBuffer(f);
  }
  /* Files from the picker, one at a time: a sound file this browser can play, not too large, not one that's here
     already (by name); a song kept by name from a backup takes its file back, with its thumbs. */
  function ymAdd(files) {
    files = Array.prototype.slice.call(files || []);
    if (!files.length || YM.busy) return;
    YM.busy = true;
    var said = [], added = [], i = 0;
    ymMsg("Adding " + (files.length === 1 ? "the song" : files.length + " songs") + "…");
    var next = function () {
      if (i >= files.length) {
        YM.busy = false;
        if (added.length) said.unshift("Added " + (added.length === 1 ? "“" + added[0] + "”" : added.length + " songs") + ".");
        ymMsg(said.join(" ")); ymUI(); musUI(); ambUI();
        return;
      }
      var f = files[i++], name = ymNameOf(f.name), same = YM.list.filter(function (s) { return s.name.toLowerCase() === name.toLowerCase(); })[0];
      if (!ymIsAudio(f)) { said.push("“" + name + "” isn't a sound file."); next(); return; }
      if (f.size > YM_BIG) { said.push("“" + name + "” is over " + Math.round(YM_BIG / 1048576) + " MB, too large to keep here."); next(); return; }
      if (same && YM.here[same.id]) { said.push("“" + name + "” is here already."); next(); return; }
      if (!same && ymHereN() >= YM_MAX) { said.push("There's room for " + YM_MAX + " songs; remove one to add another."); next(); return; }
      ymProbe(f, function (secs) {
        if (secs < 0) { said.push("This browser can't play “" + name + "”. Most phones play MP3, AAC (M4A) and WAV files."); next(); return; }
        ymBytes(f, function (buf) {
          if (!buf) { said.push("“" + name + "” couldn't be read."); next(); return; }
          var id = same ? same.id : ymId(), meta = { id: id, name: name, type: f.type || "", size: f.size, secs: Math.round(secs), at: Date.now() };
          ymPut(meta, buf, function (err) {
            if (err) { said.push(err === "full" ? "There wasn't room on this device for “" + name + "”." : err === "nodb" ? "This browser won't keep files for a page, so songs can't be added here." : "“" + name + "” couldn't be kept."); next(); return; }
            YM.here[id] = true; delete YM.bad[id];
            if (same) { same.secs = meta.secs; same.size = meta.size; }
            else YM.list.push({ id: id, name: name, secs: meta.secs, size: meta.size, up: 0, down: 0, at: meta.at });
            ymSaveList();
            added.push(name);
            next();
          });
        });
      });
    };
    next();
  }
  function ymRemove(id) {
    var s = ymGet(id);
    if (!s) return;
    YM.list = YM.list.filter(function (x) { return x.id !== id; });
    delete YM.here[id];
    ymSaveList();
    if (YM.cur === id && YM.on) { if (YM.taste) ymHalt(); else ymNext(); }    // the song playing: the next one, or quiet
    ymDrop(id, function () { ymUI(); musUI(); ambUI(); });
    ymMsg("Removed “" + s.name + "”.");
    ymUI(); musUI(); ambUI();
  }

  /* ----- playing: one element, into the audio graph ----- */
  function ymGain() { return ambGain() * 0.8; }         // the background sound's volume; a recording sits a little under the music made here
  function ymEl() {
    if (YM.el) return YM.el;
    var el = YM.el = new Audio();
    el.preload = "auto";
    el.addEventListener("ended", function () { if (YM.on && YM.taste) { ymHalt(); ymUI(); } else if (YM.on) ymNext(); });
    el.addEventListener("error", function () {
      if (YM.blessing || !YM.on || !YM.cur || el.getAttribute("src") !== YM.url) return;
      YM.bad[YM.cur] = true;                           // a file this browser can't play after all: the next one
      if (YM.taste) { ymHalt(); ymUI(); } else ymNext();
    });
    // the phone took the sound (a call, another app): the song waits for it, without a fight
    el.addEventListener("pause", function () { if (YM.on && !YM.pausing && !el.ended && !YM.blessing && Date.now() - (YM.srcAt || 0) > 1000) { YM.sys = true; ymSegEnd(); } });
    el.addEventListener("play", function () { if (YM.sys && YM.on) { YM.sys = false; ymSegStart(YM.cur); } });
    return el;
  }
  // its way into the audio graph, once: fade, level, volume, out
  function ymGraph() {
    if (YM.out || !A.ctx) return;
    var ctx = A.ctx;
    YM.out = ctx.createGain(); YM.out.gain.value = ymGain(); YM.out.connect(ctx.destination);
    YM.lvl = ctx.createGain(); YM.lvl.gain.value = YM.lv; YM.lvl.connect(YM.out);
    YM.g = ctx.createGain(); YM.g.gain.value = 0; YM.g.connect(YM.lvl);
    try { YM.src = ctx.createMediaElementSource(ymEl()); YM.src.connect(YM.g); } catch (e) { YM.src = null; }   // else the element's own volume
  }
  function ymVolNow() {
    if (YM.out && A.ctx) YM.out.gain.setTargetAtTime(ymGain(), A.ctx.currentTime, 0.08);
    if (YM.el && !YM.src) YM.el.volume = Math.max(0, Math.min(1, ymGain() * YM.lv / 0.72));
  }
  // a session's level (a practice's closing words over it), over about secs seconds
  function ymLevel(x, secs) {
    if (x === YM.lv) return;
    YM.lv = x;
    if (YM.lvl && A.ctx) YM.lvl.gain.setTargetAtTime(x, A.ctx.currentTime, Math.max(0.02, (secs || 1) / 3));
    ymVolNow();
  }
  function ymFade(to, secs) {
    if (!YM.g || !A.ctx) return;
    var p = YM.g.gain, now = A.ctx.currentTime;
    p.cancelScheduledValues(now); p.setValueAtTime(p.value, now); p.linearRampToValueAtTime(to, now + Math.max(0.02, secs));
  }
  // what played, and when: a song's stretch starts and ends with its sound
  function ymSegStart(id) { if (id) YM.segs.push({ id: id, from: Date.now(), to: 0 }); if (YM.segs.length > 80) YM.segs.splice(0, 20); }
  function ymSegEnd() { var s = YM.segs[YM.segs.length - 1]; if (s && !s.to) s.to = Date.now(); }
  // the songs that played for at least YM_MIN seconds since t (ms), in the order they first played
  function ymSince(t) {
    var secs = {}, order = [], now = Date.now();
    YM.segs.forEach(function (s) {
      var a = Math.max(s.from, t), b = s.to || now;
      if (b <= a) return;
      if (!(s.id in secs)) { secs[s.id] = 0; order.push(s.id); }
      secs[s.id] += (b - a) / 1000;
    });
    return order.filter(function (id) { return secs[id] >= YM_MIN && ymGet(id); });
  }
  /* Start (or carry on): within twenty minutes of a pause, the same song from where it was; otherwise the next one
     by chance. The sound fades in over two seconds; t: a song to try in Settings, which plays once, through. */
  function ymPlay(t) {
    if (!ensureCtx()) return;
    ymGraph();
    var el = ymEl(), keep = !t && YM.cur && YM.here[YM.cur] && !YM.bad[YM.cur] && el.getAttribute("src") === YM.url && YM.url && !el.ended &&
      Date.now() - YM.stopAt < 20 * 60000 && !YM.taste;
    YM.on = true; YM.gen++; YM.taste = t || ""; YM.sys = false;
    if (keep) ymGo(YM.gen);
    else ymLoad(t || ymPick(YM.cur), YM.gen, 0);
  }
  function ymLoad(id, g, tries) {
    if (!id || tries > 5) { if (YM.on) ymStop(0.3); ymUI(); return; }   // no song left that can play here
    ymRead(id, function (rec) {
      if (g !== YM.gen || !YM.on) return;
      if (!rec) { delete YM.here[id]; ymUI(); musUI(); ymLoad(YM.taste ? "" : ymPick(id), g, tries + 1); return; }
      var el = ymEl(), url;
      try { url = URL.createObjectURL(new Blob([rec.data], { type: rec.type || "audio/mpeg" })); } catch (e) { YM.bad[id] = true; ymLoad(ymPick(id), g, tries + 1); return; }
      if (YM.url) try { URL.revokeObjectURL(YM.url); } catch (e) {}
      YM.url = url; YM.cur = id; YM.srcAt = Date.now();
      el.src = url;
      ymGo(g);
    });
  }
  function ymGo(g) {
    var el = ymEl();
    ymFade(1, 2);
    if (!YM.src) ymVolNow();
    var p = el.play();
    if (p && p.catch) p.catch(function (e) { if (g === YM.gen && e && e.name !== "AbortError") { YM.err = "play"; ymSegEnd(); ymUI(); } });
    YM.err = "";
    ymSegStart(YM.cur);
    ymUI();
  }
  function ymNext() {
    ymSegEnd();
    if (!YM.on) return;
    ymLoad(ymPick(YM.cur), YM.gen, 0);
  }
  // stop: the sound fades over `fade` seconds, then the element pauses where it is
  function ymStop(fade) {
    if (!YM.on) return;
    YM.on = false; YM.taste = ""; YM.stopAt = Date.now();
    ymSegEnd();
    ymOut(fade === undefined ? 1.5 : Math.max(0.02, fade));
    ymUI();
  }
  function ymOut(f) {
    var g = ++YM.gen;
    YM.outAt = Date.now() + f * 1000;
    ymFade(0, f);
    setTimeout(function () { if (g === YM.gen && YM.el) { YM.pausing = true; YM.el.pause(); YM.pausing = false; } }, f * 1000 + 120);
  }
  function ymHalt() { ymStop(0.3); }
  // the phone's own controls (lock screen, notifications) pausing or playing a song when no track holds them (lockscreen.js)
  function ymSysPause() { if (YM.on && YM.el && !YM.el.paused) YM.el.pause(); }
  function ymSysPlay() { if (YM.on && YM.sys && YM.el) { var p = YM.el.play(); if (p && p.catch) p.catch(function () {}); } }
  // I need to stop: gone in the same few tenths of a second as everything else, a slower fade already under way too
  // (a session's end begins one just before)
  function ymHush(secs) {
    var f = secs === undefined ? 0.5 : Math.max(0.02, secs);
    if (YM.on) ymStop(f);
    else if (YM.outAt > Date.now() + f * 1000) ymOut(f);
  }

  /* Following the music's choice (musSync, music.js, every half second with the background sound): w is
     { lvl } while Yours should play, or null. A song tried in Settings plays on until it ends or is stopped. */
  function ymSync(w) {
    ymWatch();
    if (!w) { if (YM.on && !YM.taste) ymStop(1.5); return; }
    var lv = w.lvl === undefined ? 1 : w.lvl;
    if (YM.taste) YM.taste = "";                     // a session began during a taste: it carries on as the session's
    if (YM.on) { ymLevel(lv, 4); return; }
    YM.lv = lv;                                      // a new start comes in at its level at once
    if (YM.lvl && A.ctx) { YM.lvl.gain.cancelScheduledValues(A.ctx.currentTime); YM.lvl.gain.setValueAtTime(lv, A.ctx.currentTime); }
    ymPlay();
  }
  /* Breathe's own sessions, watched for their start and end: after one in which a song played, the row under the
     guide asks about it. A practice using the guide has its own end screen. */
  function ymWatch() {
    var st = B.state, run = (st === "running" || st === "paused") && !P.usesB && !B.finder;
    if (run && YM.bWas !== "run") { YM.bWas = "run"; YM.bFrom = Date.now(); YM.occ = ""; ymBreatheRow(); }
    else if (!run && YM.bWas === "run") {
      YM.bWas = "idle";
      var ids = ymSince(YM.bFrom);
      YM.occ = ids.length ? "b" + YM.bFrom : "";
      YM.bIds = ids;
      ymBreatheRow();
    }
  }
  // Safari on an iPhone plays an element only once a tap has started it: the first tap with Yours chosen plays a
  // moment of silence on it, so a song can follow later, when its file has been read
  function ymBlessTap() {
    if (YM.bless || YM.on || !ymCan() || (musDev() !== "own" && !ymPracOwn())) return;
    var el = ymEl();
    if (!YM.blessUrl) {
      var n = 800, b = new Uint8Array(44 + n), v = new DataView(b.buffer), tag = function (at, s) { for (var i = 0; i < 4; i++) b[at + i] = s.charCodeAt(i); };
      tag(0, "RIFF"); v.setUint32(4, 36 + n, true); tag(8, "WAVE"); tag(12, "fmt "); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
      v.setUint32(24, 8000, true); v.setUint32(28, 8000, true); v.setUint16(32, 1, true); v.setUint16(34, 8, true); tag(36, "data"); v.setUint32(40, n, true);
      for (var i = 44; i < b.length; i++) b[i] = 128;
      YM.blessUrl = URL.createObjectURL(new Blob([b], { type: "audio/wav" }));
    }
    ensureCtx(); ymGraph();
    YM.bless = "pending"; YM.blessing = true;
    el.src = YM.blessUrl;
    var after = function () {
      YM.blessing = false;
      if (el.getAttribute("src") === YM.blessUrl) { YM.pausing = true; el.pause(); YM.pausing = false; el.removeAttribute("src"); }
    };
    var p = el.play();
    if (p && p.then) p.then(function () { YM.bless = "done"; after(); }, function () { YM.bless = ""; after(); });
    else { YM.bless = "done"; after(); }
  }
  // the practice on screen plays your songs: Yours under its Options, or as its own music (Music Break's)
  function ymPracOwn() { var d = P.view; return !!d && (d.music ? pFn(d.music, d) === "own" : pOptsOf(d.id).music === "own"); }

  /* ----- the thumbs ----- */
  // a thumb given on one occasion (an end screen, Breathe's last session): a second tap takes it back
  function ymVote(occ, id, v) {
    var s = ymGet(id);
    if (!s || !occ) return;
    var o = YM.votes[occ] = YM.votes[occ] || {}, was = o[id] || 0;
    if (was === 1) s.up = Math.max(0, s.up - 1);
    if (was === -1) s.down = Math.max(0, s.down - 1);
    var now = was === v ? 0 : v;
    if (now === 1) s.up++;
    if (now === -1) s.down++;
    o[id] = now;
    ymSaveList();
    document.querySelectorAll('.ym-rate[data-ym-occ="' + occ + '"] [data-ym="' + id + '"] .ym-th').forEach(function (b) {
      b.setAttribute("aria-pressed", +b.getAttribute("data-ym-v") === now ? "true" : "false");
    });
    var note = document.querySelector('.ym-rate[data-ym-occ="' + occ + '"] .ym-said');
    if (note) note.textContent = now === 1 ? "Thanks: “" + s.name + "” will come up more often." : now === -1 ? "“" + s.name + "” will be left out while there are other songs." : "";
    if (curView === "settings") ymUI();
  }
  // the songs that played, each with a thumbs up and a thumbs down
  function ymRateHtml(ids, occ) {
    if (!ids || !ids.length || !occ) return "";
    var o = YM.votes[occ] || {}, th = '<svg class="i" aria-hidden="true"><use href="#i-thumb"/></svg>';
    return '<div class="ym-rate" data-ym-occ="' + occ + '"><p class="ym-rate-h"><b>Your music.</b> How was it? Songs you like come up more often.</p>' +
      ids.slice(0, 6).map(function (id) {
        var s = ymGet(id), n = esc(s.name);
        return '<div class="ym-rrow" data-ym="' + id + '"><span class="ym-nm">' + n + "</span>" +
          '<button type="button" class="ym-th" data-ym-v="1" aria-pressed="' + (o[id] === 1) + '" aria-label="More of ' + n + '">' + th + "</button>" +
          '<button type="button" class="ym-th ym-dn" data-ym-v="-1" aria-pressed="' + (o[id] === -1) + '" aria-label="Less of ' + n + '">' + th + "</button></div>";
      }).join("") + '<p class="ym-said hint" role="status"></p></div>';
  }
  // the end screen of a practice (done.js): the songs since it started
  function ymDoneCard() {
    var at = P.startedAt || 0;
    return at ? ymRateHtml(ymSince(at), "p" + at) : "";
  }
  // under Breathe's guide, after one of your own sessions
  function ymBreatheRow() {
    var row = $("#bYmRow");
    if (!row) return;
    var h = YM.occ && YM.bWas !== "run" ? ymRateHtml(YM.bIds || [], YM.occ) : "";
    if (row.getAttribute("data-occ") !== YM.occ || !h) { row.innerHTML = h; row.setAttribute("data-occ", YM.occ); }
    row.hidden = !h;
  }

  /* ----- Settings: the card ----- */
  function ymMB(b) { return b >= 1048576 ? (b / 1048576).toFixed(b >= 10485760 ? 0 : 1) + " MB" : Math.max(1, Math.round(b / 1024)) + " KB"; }
  function ymStCard() {
    return '<section class="st-card" id="st-mymusic" aria-labelledby="stYm"><h2 id="stYm">Your own music</h2>' +
      '<p class="st-note">Music you like does more for you than music chosen for you. Add songs from this device, then choose Yours under Music, above, ' +
      'on Breathe or in a practice\'s Options: they play under practices, breathing sessions and tracks, and in Music Break. <a href="#l-mymusic">Why your own</a></p>' +
      '<p class="st-note">The files stay in this browser on this device and play offline; nothing is uploaded. A backup keeps their names and your thumbs, not the files.</p>' +
      '<div class="ym-list" id="ymList"></div>' +
      '<div class="ym-act"><button type="button" class="btn" id="ymAdd"><svg class="i" aria-hidden="true"><use href="#i-plus"/></svg>Add music<span id="ymAddTag">' + supTag() + "</span></button>" +
      '<input type="file" id="ymFile" accept="audio/*,.mp3,.m4a,.aac,.wav,.ogg,.oga,.opus,.flac,.webm" multiple hidden></div>' +
      '<p class="st-note ym-msg" id="ymMsg" role="status">' + esc(YM.msg) + "</p></section>";
  }
  function ymMsg(s) { YM.msg = s || ""; bSetT("#ymMsg", YM.msg); }
  function ymListHtml() {
    if (!YM.list.length) return '<p class="hint ym-none">No songs yet. Music you love to relax to, focus with or move to: songs with few words often sit best under guidance.</p>';
    var tot = 0, th = YM.list.map(function (s) {
      var here = !!YM.here[s.id], n = esc(s.name), playing = YM.on && YM.cur === s.id, st = ymStanding(s);
      if (here) tot += s.size;
      return '<div class="ym-row" data-ym="' + s.id + '"' + (here ? "" : ' data-away="1"') + ">" +
        (here ? '<button type="button" class="ym-b ym-play" data-ym-play aria-pressed="' + playing + '" aria-label="' + (playing ? "Stop " : "Play ") + n + '"><svg class="i" aria-hidden="true"><use href="#i-' + (playing ? "pause" : "play") + '"/></svg></button>' : '<span class="ym-b ym-away" aria-hidden="true"><svg class="i"><use href="#i-sounds"/></svg></span>') +
        '<span class="ym-nm"><b>' + n + "</b><small>" + (here ? (s.secs ? fmt(s.secs) + " · " : "") + ymMB(s.size) + (YM.bad[s.id] ? " · this browser can't play it" : "") : "Not on this device: add the file again to play it here") +
        (st ? " · " + st : "") + "</small></span>" +
        '<button type="button" class="ym-b ym-del" data-ym-del aria-label="Remove ' + n + '"><svg class="i" aria-hidden="true"><use href="#i-x"/></svg></button></div>';
    }).join("");
    return th + '<p class="hint ym-tot">' + (ymHereN() === 1 ? "One song" : ymHereN() + " songs") + " on this device" + (tot ? ", " + ymMB(tot) : "") +
      (YM.list.some(function (s) { return ymScore(s) !== 0; }) ? ". Songs you've liked come up more often, and ones you've turned down are left out while there are others." : ". After each session, a thumbs up or down for what played: songs you like come up more often.") + "</p>";
  }
  function ymUI() {
    var l = $("#ymList");
    if (l) l.innerHTML = ymListHtml();
    var t = $("#ymAddTag");
    if (t && t.innerHTML !== supTag()) t.innerHTML = supTag();
    if (YM.err === "nodb") bSetT("#ymMsg", "This browser won't keep files for a page (a private window often can't), so songs can't be added here.");
  }
  function ymStWire() {
    var add = $("#ymAdd"), f = $("#ymFile"), l = $("#ymList");
    if (!add) return;
    ymUI();
    add.addEventListener("click", function () {
      if (YM.busy) return;
      supGate(YM_NAME, function () { f.value = ""; f.click(); }, function () { ymUI(); });   // the picker opens in the tap, once unlocked
    });
    f.addEventListener("change", function () { if (supOn()) ymAdd(f.files); });
    l.addEventListener("click", function (e) {
      var row = e.target.closest("[data-ym]"), id = row && row.getAttribute("data-ym");
      if (!id) return;
      if (e.target.closest("[data-ym-del]")) { ymRemove(id); return; }
      if (e.target.closest("[data-ym-play]")) {
        if (YM.on && YM.cur === id) { ymHalt(); return; }
        if (!supOn()) return;
        if (YM.on && !YM.taste) { ymMsg("Your music is playing for a session; it can be tried once that ends."); return; }
        ymPlay(id);
      }
    });
  }

  function ymInit() {
    ymLoadList();
    SUP_EXTRA.push({ name: YM_NAME, href: "#st-mymusic" });          // Settings' list of what the donation unlocks
    SETTLE_HUSH.push(ymHush);                                          // I need to stop: the song fades with everything else
    ymScan(function () { ymUI(); musUI(); ambUI(); });
    document.addEventListener("click", function (e) {
      var b = e.target.closest ? e.target.closest(".ym-rate .ym-th") : null;
      if (b) { var occ = b.closest(".ym-rate").getAttribute("data-ym-occ"), id = b.closest("[data-ym]").getAttribute("data-ym"); ymVote(occ, id, +b.getAttribute("data-ym-v")); }
    });
    ["touchend", "click"].forEach(function (k) { document.addEventListener(k, ymBlessTap, true); });
    if (window.__entrain) {                                             // for automated tests only
      var X = window.__entrain;
      X.YM = YM; X.ymPick = ymPick; X.ymWeight = ymWeight; X.ymSince = ymSince; X.ymAdd = ymAdd; X.ymScan = ymScan; X.ymLoadList = ymLoadList; X.ymHereN = ymHereN; X.ymNameOf = ymNameOf;
    }
  }
