  /* ------------------------------- search -------------------------------
     One box for everything: practices and your own routines, the movement library, breathing
     patterns, tracks, the Heart tools, Healthy living's recipes, supplements, routines and light, History, Settings
     and its feedback form, and every paragraph and reference in Learn.
     Matching ignores case and accents, and each word you type has to match the start of a word
     somewhere in the entry, so "anap" finds Anapana and "bencao" finds Bênção. Results come in
     groups, the group with the best match first. Enter opens the top result; "/" or Ctrl+K opens
     the box from anywhere outside a field.
  ------------------------------------------------------------------------ */

  var FD = { open: false, base: null, items: [], q: "", more: {}, pushed: false, back: null, t: 0 };
  var FD_KINDS = [["practice", "Practices"], ["pose", "Poses and moves"], ["breath", "Breathing"],
    ["sound", "Sounds"], ["heart", "Heart"], ["living", "Healthy living"], ["learn", "Learn"], ["app", "History and Settings"]];
  var FD_CAP = 6;                        // results shown per group until you ask for the rest
  var FD_TRY = ["Sleep", "Anapana", "Tree", "4-7-8", "Coherence", "Tinnitus", "Capoeira", "Needs"];

  /* ----- folding text for matching: lower case, no accents, anything else a space ----- */
  function fdFold(s) {
    s = String(s || "").toLowerCase();
    if (s.normalize) s = s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    return " " + s.replace(/[^a-z0-9]+/g, " ").trim() + " ";      // padded, so " term" marks a word start
  }
  // each word, trimmed back to a stem so plurals and -ing forms find the plain word too:
  // "nostrils" finds nostril, "bodies" body, "tapping" tap
  function fdStem(w) {
    if (w.length > 5 && /ing$/.test(w)) { w = w.slice(0, -3); if (/([bcdfgklmnprstvz])\1$/.test(w)) w = w.slice(0, -1); return w; }
    if (w.length > 4 && /ies$/.test(w)) return w.slice(0, -3);
    if (w.length > 3 && /[^s]s$/.test(w)) return w.slice(0, -1);
    return w;
  }
  function fdTerms(q) { return fdFold(q).trim().split(" ").filter(Boolean).map(fdStem); }
  function fdHas(f, t) { return f.indexOf(" " + t) >= 0; }
  // the same folding, keeping where each folded character came from, to mark matches in the original
  function fdMap(s) {
    var f = " ", at = [-1];
    for (var i = 0; i < s.length; i++) {
      var c = s.charAt(i).toLowerCase();
      if (c.normalize) c = c.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      if (!/^[a-z0-9]+$/.test(c)) c = " ";
      for (var j = 0; j < c.length; j++) { f += c.charAt(j); at.push(i); }
    }
    return { f: f, at: at };
  }
  function fdSpans(s, terms) {           // [start, end) in s of every word a term starts, merged
    var m = fdMap(s), out = [];
    terms.forEach(function (t) {
      var i = m.f.indexOf(" " + t);
      while (i >= 0) {
        var e = i + t.length;
        while (e + 1 < m.f.length && m.f.charAt(e + 1) !== " ") e++;   // mark the whole word, not just its start
        var a = m.at[i + 1], b = m.at[e] + 1;
        if (a >= 0) out.push([a, b]);
        i = m.f.indexOf(" " + t, i + 1);
      }
    });
    out.sort(function (x, y) { return x[0] - y[0]; });
    var merged = [];
    out.forEach(function (r) {
      var l = merged[merged.length - 1];
      if (l && r[0] <= l[1]) l[1] = Math.max(l[1], r[1]); else merged.push([r[0], r[1]]);
    });
    return merged;
  }
  function fdMark(s, terms) {
    var h = "", at = 0;
    fdSpans(s, terms).forEach(function (r) { h += esc(s.slice(at, r[0])) + "<mark>" + esc(s.slice(r[0], r[1])) + "</mark>"; at = r[1]; });
    return h + esc(s.slice(at));
  }
  // a short excerpt around the first match, cut at word boundaries
  function fdSnip(s, terms, len) {
    len = len || 150;
    var sp = fdSpans(s, terms), a = 0, b = s.length;
    if (sp.length && s.length > len) {
      a = Math.max(0, sp[0][0] - Math.round(len * 0.3));
      b = Math.min(s.length, a + len);
      a = Math.max(0, Math.min(a, b - len));
    } else if (s.length > len) b = len;
    if (a > 0) { var sa = s.indexOf(" ", a); if (sa > 0 && sa < (sp.length ? sp[0][0] : b)) a = sa + 1; }
    if (b < s.length) { var sb = s.lastIndexOf(" ", b); if (sb > a + 40) b = sb; }
    return (a > 0 ? "…" : "") + fdMark(s.slice(a, b), terms) + (b < s.length ? "…" : "");
  }

  /* ----- the index ----- */
  function fdTxt(el) { return el ? el.textContent.replace(/\s+/g, " ").trim() : ""; }
  function fdEntry(k, t, s, xs, h, o) {
    o = o || {};
    xs = xs.filter(Boolean);
    var bare = !!o.bare;                 // a paragraph shown under its section's name: only its own words count
    return { k: k, t: t, s: s || "", xs: xs, h: h, ic: o.ic || "spark", col: o.col || "", w: o.w || 1,
      tn: bare ? " " : fdFold(t), ti: bare ? " " : fdFold(t + " " + (o.alias || "")), si: bare ? " " : fdFold(s + " " + (o.tags || "")), xi: fdFold(xs.join(" ")) };
  }
  function fdMins(d) {
    if (d.selfPaced) return "self-paced, about " + d.est + " min";
    if (d.lengths) return d.lengths[0] + "–" + d.lengths[d.lengths.length - 1] + " " + (d.lenUnit ? d.lenUnit + "s" : "min");
    return (d.open ? "up to " : "") + pMinutes(d) + " min";
  }
  function fdPractice(d) {
    var g = goalOf(d.goal), steps = [];
    (d.lengths || [0]).forEach(function (L) {   // step names at every length: longer sittings have more of them
      try { pPlan(d, L).steps.forEach(function (s) { if (s.title && steps.indexOf(s.title) < 0) steps.push(s.title); }); } catch (e) {}
    });
    return fdEntry("practice", d.name, [d.custom ? "Your routine" : "", g ? g.name : "", methodName(d.method), fdMins(d)].filter(Boolean).join(" · "),
      [d.blurb, d.parts, steps.join(" · "), d.how], "#practice/" + d.id,
      { ic: pIcon(d), col: pColor(d), w: 1.25, alias: d.alias || "", tags: (d.also || []).join(" ") + " " + d.id.replace(/-/g, " ") + (d.words ? " " + d.words : "") });
  }
  function fdBuildBase() {
    var out = [];
    PRACTICES.forEach(function (d) { out.push(fdPractice(d)); });
    var types = { yoga: "Yoga pose", stretch: "Stretch", mobility: "Mobility drill", capoeira: "Capoeira move" }, poses = {};
    A_POSES.forEach(function (c) { poses[c[0]] = c[1]; });
    ASANAS.forEach(function (a) {
      out.push(fdEntry("pose", a.en, a.sa + " · " + (types[aType(a)] || "Pose") + " · " + (poses[aPos(a)] || "") + (a.sides ? " · both sides" : ""),
        a.cues.map(function (c) { return aCue(c, a.sides ? "right" : null); }).concat([a.caution]), "#yoga/find/" + a.id,
        { ic: a.cat === "capoeira" ? "drum" : "move", col: "var(--accent)", w: 1, alias: a.sa }));
    });
    out.push(fdEntry("pose", "Routine builder", "Movement · " + ASANAS.length + " poses and moves",
      ["Pick yoga poses, stretches, mobility drills and capoeira moves, set each one's time, and save the routine."], "#yoga",
      { ic: "plus", col: "var(--accent)", w: 1.1, tags: "yoga builder custom sequence" }));
    BREATHS.forEach(function (b) {
      var lab = document.querySelector('#bPats input[value="' + b.id + '"]'), t = b.t, per = t.inh + t.sip + t.hold + t.exh + t.rest;
      var name = lab ? fdTxt(lab.parentNode) : b.id;
      out.push(fdEntry("breath", name, (goalOf(b.goal) ? goalOf(b.goal).name + " · " : "") + "Breathing pattern · " + (Math.round(600 / per) / 10) + " breaths a minute",
        [b.desc, b.ev], "#breathe/" + b.id, { ic: "breathe", col: "var(--b-in)", w: 1.15, tags: "breathe breathing pattern " + b.id }));
    });
    out.push(fdEntry("breath", "Breathing guide", "Breathe · paced breathing",
      ["Paced breathing with five visuals, timed sessions, sound cues and live heart data."], "#breathe",
      { ic: "breathe", col: "var(--b-in)", w: 1, tags: "breathe pace" }));
    TRACKS.forEach(function (t) {
      var g = goalOf(t.goal), gn = g ? g.name : "Tinnitus";
      out.push(fdEntry("sound", t.name, gn + " · " + t.band + " track · " + t.minutes + " min", [t.desc, t.ev], "#track/" + t.id,
        { ic: "sounds", col: "var(--relax)", w: 1, alias: t.goal === "tinnitus" ? "tinnitus" : "", tags: "binaural beat track " + (t.also || []).join(" ") }));
    });
    out.push(fdEntry("sound", "Custom primer", "Focus · Sound · 5 to 20 min before a task",
      ["Listen to a beat before you start a task, get a cue when the block ends, then begin working."], "#prime",
      { ic: "bolt", col: "var(--relax)", w: 1, tags: "binaural focus primer alpha beta gamma" }));
    out.push(fdEntry("sound", "Beat builder", "Make your own · any beat and carrier",
      ["Pick the beat frequency, the carrier tone and the session length, then play it."], "#builder",
      { ic: "sliders", col: "var(--relax)", w: 1, tags: "binaural custom builder carrier frequency" }));
    out.push(fdEntry("heart", "Connect a heart sensor", "Heart · Bluetooth heart-rate sensors",
      ["Pair a HeartMath ear-clip sensor, a chest strap or a Garmin watch set to broadcast, and watch your heart rate rise as you breathe in and fall as you breathe out."], "#heart",
      { ic: "heart", col: "var(--hr)", w: 1.1, tags: "hrm pair bluetooth garmin heartmath polar strap" }));
    out.push(fdEntry("heart", "Sensor connection guide", "Heart · step by step",
      ["Step by step for a HeartMath sensor, a chest strap or a Garmin Venu 4, with a live check of each step."], "#connect",
      { ic: "heart", col: "var(--hr)", w: 1, tags: "garmin venu heartmath strap broadcast pair help" }));
    out.push(fdEntry("heart", "Resonance test", "Heart · about 10 minutes",
      ["Breathe at 6.5, 6, 5.5, 5 and 4.5 breaths a minute for two minutes each, and see which pace gives the biggest heart-rate swing."], "#resonance-test",
      { ic: "target", col: "var(--hr)", w: 1.1, tags: "resonance frequency rate pace hrv" }));
    out.push(fdEntry("heart", "Live heart data and coherence", "Heart · rate, swing, RMSSD, coherence",
      ["Heart rate, the swing in each breath, RMSSD and coherence, with a spectrum of the rhythms your heart rate moves in."], "#heart",
      { ic: "pulse", col: "var(--hr)", w: 1, tags: "hrv variability rmssd coherence spectrum heartmath" }));
    out.push(fdEntry("app", "Settings", "Defaults for every practice, sound and screen",
      ["Spoken guidance, voice, bells, breath cues and visual, binaural layer, Anapana reminders, background sound, keeping reflections, and keeping the screen on or dimming it for sleep."], "#settings",
      { ic: "gear", col: "var(--accent)", w: 1, tags: "options preferences defaults voice bells screen dim brightness wake lock background rain" }));
    out.push(fdEntry("app", "Feedback", "Settings · an idea, a problem or something you liked",
      ["Write it in Settings, and it opens as an issue on Entrain's GitHub page, ready to send."], "#feedback",
      { ic: "send", col: "var(--accent)", w: 1, tags: "contact bug report issue github suggestion idea problem praise question" }));
    out.push(fdEntry("app", "History", "Today · everything you've done, a day at a time",
      ["Practices, breathing sessions, tracks and resonance tests, with the time and your heart-rate change and coherence when a sensor was connected."], "#history",
      { ic: "today", col: "var(--accent)", w: 1, tags: "log sessions stats week minutes past done journal progress" }));
    fdLiving(out);
    fdLearn(out);
    return out;
  }
  // Learn: headings, paragraphs, list items and references (fdInit gives each an id to land on)
  var FD_LEARN = "#v-learn h2, #v-learn h3, #v-learn .prose p, #v-learn .prose li, #v-learn .refs li";
  function fdLearn(out) {
    var head = "Learn";
    document.querySelectorAll(FD_LEARN).forEach(function (el) {
      if (el.closest(".toc") || !el.id) return;
      var tag = el.tagName, txt = fdTxt(el);
      if (!txt) return;
      if (tag === "H2" || tag === "H3") {
        if (txt === "References") { head = txt; return; }
        head = txt;
        out.push(fdEntry("learn", txt, "Learn", [fdTxt(el.nextElementSibling)], "#" + el.id, { ic: "learn", w: 0.75 }));
        return;
      }
      if (el.closest(".refs")) {
        var c = el.cloneNode(true);
        c.querySelectorAll("a").forEach(function (a) { a.remove(); });
        var ref = fdTxt(c), m = ref.match(/^(.*?\(\d{4}[a-z]?\))/), who = m ? m[1] : ref.slice(0, 60);
        if (who.length > 64) who = who.split(",")[0] + " et al. " + (who.match(/\(\d{4}[a-z]?\)/) || [""])[0];
        out.push(fdEntry("learn", who, "Learn · Reference", [ref.slice(m ? m[1].length : 0).replace(/^[.\s]+/, "")], "#" + el.id, { ic: "learn", w: 0.45 }));
        return;
      }
      var b = el.firstElementChild, lead = "";
      if (b && (b.tagName === "B" || b.tagName === "STRONG") && txt.indexOf(fdTxt(b)) === 0) lead = fdTxt(b).replace(/[.:]$/, "");
      out.push(fdEntry("learn", lead || head, "Learn · " + head, [lead ? txt.slice(fdTxt(b).length).trim() : txt], "#" + el.id, { ic: "learn", w: lead ? 0.7 : 0.6, bare: !lead }));
    });
  }
  function fdIndex() {
    if (!FD.base) FD.base = fdBuildBase();
    var mine = [];
    try { yLoad().forEach(function (q) { mine.push(fdPractice(yDef(q))); }); } catch (e) {}
    mpAll().forEach(function (b) {
      mine.push(fdEntry("breath", b.name, "Your breathing pattern · " + (Math.round(600 / cycleOf(b.t)) / 10) + " breaths a minute", [b.desc],
        "#breathe/" + b.id, { ic: "breathe", col: "var(--b-in)", w: 1.2, tags: "breathe breathing pattern mine own saved" }));
    });
    return mine.concat(FD.base);         // your routines and patterns can change between searches; the rest can't
  }

  /* ----- matching and ranking ----- */
  function fdScore(e, terms, whole) {
    var sc = 0;
    for (var i = 0; i < terms.length; i++) {
      var t = terms[i];
      if (fdHas(e.ti, t)) sc += 10;
      else if (fdHas(e.si, t)) sc += 5;
      else if (fdHas(e.xi, t)) sc += 2;
      else return 0;                     // every word has to match somewhere
    }
    if (e.tn === " " + whole + " ") sc += 14;                 // the exact name
    else if (e.tn.indexOf(" " + whole) === 0) sc += 7;        // the name starts with what you typed
    return sc * e.w;
  }
  function fdSearch(q) {
    var terms = fdTerms(q), whole = terms.join(" ");
    if (!terms.length) return [];
    var hits = [];
    fdIndex().forEach(function (e, i) {
      var sc = fdScore(e, terms, whole);
      if (sc > 0) hits.push({ e: e, sc: sc, i: i });
    });
    var ord = {};
    FD_KINDS.forEach(function (k, i) { ord[k[0]] = i; });
    hits.sort(function (a, b) { return b.sc - a.sc || ord[a.e.k] - ord[b.e.k] || a.e.t.length - b.e.t.length || a.i - b.i; });
    var groups = {}, list = [];
    hits.forEach(function (h) {
      if (!groups[h.e.k]) { groups[h.e.k] = { k: h.e.k, top: h.sc, items: [] }; list.push(groups[h.e.k]); }
      groups[h.e.k].items.push(h.e);
    });
    return list;                         // groups in order of their best match
  }

  /* ----- the panel ----- */
  function fdLine(e, terms) {
    for (var i = 0; i < e.xs.length; i++) {
      var f = fdFold(e.xs[i]);
      if (terms.some(function (t) { return !fdHas(e.ti, t) && fdHas(f, t); })) return fdSnip(e.xs[i], terms);
    }
    return e.xs.length ? fdSnip(e.xs[0], terms) : "";
  }
  function fdRender() {
    var q = $("#fdIn").value, terms = fdTerms(q), res = $("#fdRes");
    FD.q = q;
    FD.items = [];
    if (!terms.length) {
      res.innerHTML = '<div class="fd-empty"><p>Search the practices, poses and moves, breathing patterns, tracks, recipes and supplements, and everything in Learn.</p>' + fdTryRow() + "</div>";
      bSetT("#fdCount", "");
      return;
    }
    var groups = fdSearch(q), n = 0, h = "";
    groups.forEach(function (g) {
      var name = FD_KINDS.filter(function (k) { return k[0] === g.k; })[0][1], all = FD.more[g.k], show = all ? g.items : g.items.slice(0, FD_CAP);
      n += g.items.length;
      h += '<section class="fd-grp"><h3>' + name + " <span>" + g.items.length + "</span></h3><ul>";
      show.forEach(function (e) {
        var i = FD.items.push(e) - 1;
        h += '<li><a class="fd-it" href="' + esc(e.h) + '" data-i="' + i + '"' + (e.col ? ' style="--pcol:' + e.col + '"' : "") + ">" +
          '<span class="fd-iic"><svg class="i" aria-hidden="true"><use href="#i-' + e.ic + '"/></svg></span>' +
          '<span class="fd-tx"><b>' + fdMark(e.t, terms) + "</b><small>" + fdMark(e.s, terms) + "</small>" +
          '<span class="fd-sn">' + fdLine(e, terms) + "</span></span></a></li>";
      });
      h += "</ul>";
      if (g.items.length > show.length) h += '<button class="fd-more" data-k="' + g.k + '">Show ' + (g.items.length - show.length) + " more</button>";
      h += "</section>";
    });
    if (!n) h = '<div class="fd-empty"><p>Nothing found for “' + esc(q.trim()) + '”. A shorter word, or one of these, may find it:</p>' + fdTryRow() + "</div>";
    res.innerHTML = h;
    bSetT("#fdCount", n ? n + (n === 1 ? " result" : " results") + (n > 1 ? ". Enter opens the first." : ". Enter opens it.") : "No results");
  }
  function fdTryRow() {
    return '<div class="fd-try">' + FD_TRY.map(function (w) { return '<button class="chip-b" data-try="' + esc(w) + '">' + esc(w) + "</button>"; }).join("") + "</div>";
  }
  function fdOpen(q) {
    if (FD.open) { $("#fdIn").focus(); return; }
    FD.open = true; FD.more = {};
    FD.back = document.activeElement;
    $("#fd").hidden = false; $("#fdBack").hidden = false;
    document.body.classList.add("fd-open");
    $("#tbFind").setAttribute("aria-expanded", "true");
    try { history.pushState({ fd: 1 }, ""); FD.pushed = true; } catch (e) { FD.pushed = false; }
    var inp = $("#fdIn");
    if (typeof q === "string") inp.value = q;
    fdRender();
    setTimeout(function () { inp.focus(); inp.select(); }, 30);
  }
  // popped: the back button already took the panel's history entry away
  function fdClose(popped, keepFocus) {
    if (!FD.open) return;
    FD.open = false;
    $("#fd").hidden = true; $("#fdBack").hidden = true;
    document.body.classList.remove("fd-open");
    $("#tbFind").setAttribute("aria-expanded", "false");
    if (FD.pushed && !popped) { FD.pushed = false; try { history.back(); } catch (e) {} }
    FD.pushed = false;
    if (!keepFocus && FD.back && FD.back.focus && document.contains(FD.back)) try { FD.back.focus({ preventScroll: true }); } catch (e) {}
  }
  function fdGo(e) {
    if (!e) return;
    var popped = false;
    if (FD.pushed) { try { history.replaceState(null, "", e.h); popped = true; } catch (x) {} }   // the result takes the panel's place in history
    fdClose(popped, true);
    if (popped) route();
    else if (location.hash === e.h) route();
    else location.hash = e.h;
    var id = e.h.slice(1);
    if (/^(lx-|l-|connect$|resonance-test$|references$)/.test(id)) setTimeout(function () { fdHit(document.getElementById(id)); }, 80);
  }
  function fdHit(el) {
    if (!el) return;
    el.classList.remove("fd-hit");
    void el.offsetWidth;                 // restart the highlight if it's already running
    el.classList.add("fd-hit");
    clearTimeout(el.fdT);
    el.fdT = setTimeout(function () { el.classList.remove("fd-hit"); }, 2600);
  }
  function fdKeys(e) {
    if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); fdClose(); return; }
    var links = Array.prototype.slice.call($("#fdRes").querySelectorAll(".fd-it")), i = links.indexOf(document.activeElement);
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      if (!links.length) return;
      e.preventDefault();
      var d = e.key === "ArrowDown" ? 1 : -1;
      if (e.target === $("#fdIn")) { if (d > 0) links[0].focus(); return; }
      if (i < 0) return;
      if (i + d < 0) $("#fdIn").focus(); else links[Math.min(links.length - 1, i + d)].focus();
      return;
    }
    if (e.key === "Tab") {                // stay inside the panel
      var f = Array.prototype.slice.call($("#fd").querySelectorAll("input, button, a[href]")).filter(function (x) { return !x.disabled && x.offsetParent; });
      if (!f.length) return;
      if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
    }
  }

  /* ----- landing on a breathing pattern ----- */
  function fdPattern(id) {
    var inp = /^[\w-]+$/.test(id) ? document.querySelector('#bPats input[value="' + id + '"]') : null;
    if (!inp) return;
    if (!(pBusy() && P.usesB) && BC.pattern !== id) {    // a practice running the guide keeps it
      inp.checked = true;
      inp.dispatchEvent(new Event("change", { bubbles: true }));
    }
    setTimeout(function () { fdHit(inp.closest("label")); }, 40);
  }

  function fdInit() {
    var tb = $("#tbFind");
    tb.addEventListener("click", function () { fdOpen(); });
    $("#fdX").addEventListener("click", function () { fdClose(); });
    $("#fdBack").addEventListener("click", function () { fdClose(); });
    $("#fdIn").addEventListener("input", function () {
      FD.more = {};
      clearTimeout(FD.t);
      FD.t = setTimeout(fdRender, 60);
    });
    $("#fdIn").addEventListener("keydown", function (e) {
      if (e.key !== "Enter") return;
      e.preventDefault();
      clearTimeout(FD.t); fdRender();
      if (FD.items.length) fdGo(FD.items[0]);
    });
    $("#fd").addEventListener("keydown", fdKeys);
    $("#fdRes").addEventListener("click", function (e) {
      var tr = e.target.closest("[data-try]");
      if (tr) { $("#fdIn").value = tr.dataset.try; FD.more = {}; fdRender(); $("#fdIn").focus(); return; }
      var mo = e.target.closest(".fd-more");
      if (mo) {
        FD.more[mo.dataset.k] = true;
        var at = FD.items.length;
        fdRender();
        var nx = $("#fdRes").querySelector('.fd-it[data-i="' + at + '"]');
        if (nx) nx.focus();
        return;
      }
      var a = e.target.closest(".fd-it");
      if (!a || e.ctrlKey || e.metaKey || e.shiftKey) return;
      e.preventDefault();
      fdGo(FD.items[+a.dataset.i]);
    });
    window.addEventListener("popstate", function () {
      if (FD.open && !(history.state && history.state.fd)) fdClose(true);
    });
    document.addEventListener("keydown", function (e) {
      if (FD.open) return;
      var k = (e.key === "k" || e.key === "K") && (e.ctrlKey || e.metaKey) && !e.altKey && !e.shiftKey;
      var typing = e.target && e.target.closest && e.target.closest('input, textarea, select, [contenteditable]');
      if (!k && (e.key !== "/" || typing || e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey)) return;
      if (document.body.classList.contains("immersive")) return;    // a session on screen keeps the keys
      e.preventDefault();
      fdOpen();
    });
    // places a result can land on that have no id of their own
    var n = 0;
    document.querySelectorAll(FD_LEARN).forEach(function (el) {
      if (!el.closest(".toc") && !el.id) el.id = "lx-" + (n++);
    });
  }
