  /* ------------------------------- the library -------------------------------
     Goal sections (Sleep, Calm, Focus, Energy, Recover, Reflect) holding practices, breathing
     patterns, tracks and the custom primer, each listed once, under its goal. Everything combines:
     pick one goal or several, and each shows its own items, then the ones that are also good for
     it; pick one technique or several; and the filter panel narrows by length, posture and needs,
     again one choice or several. Within a row the choices add up (calm or sleep); the rows narrow
     each other (calm or sleep, and breathing). Each chip says how many it would show. On "All",
     with nothing chosen, each section shows its first few rows until you ask for the rest, and
     the tinnitus track and the two builders have sections of their own.
     It is built each time it's shown (showView), never at start-up: working out every practice's
     length is the slowest thing the app does as it opens, and Today needs none of it.
  ------------------------------------------------------------------------------ */

  var LIB = { goals: [], f: { method: [], len: [], posture: [], needs: [] }, open: {}, panel: false, mins: {} };
  var LIB_FACETS = ["method", "len", "posture", "needs"];
  var LIB_LENS = [["5", "Up to 5 min"], ["10", "Up to 10 min"], ["20", "Up to 20 min"], ["long", "Longer"]];
  var LIB_TRACK_COL = { relax: "var(--relax)", stim: "var(--stim)", ther: "var(--ther)" };

  function pIcon(d) { return methodIcon(d.method || "move"); }
  // shortest and longest session, in minutes
  function libMins(d) {
    if (d.selfPaced) return [d.est, d.est];
    if (!d.custom && LIB.mins[d.id]) return LIB.mins[d.id];           // your routines can change; the rest can't
    var m = (d.lengths || [0]).map(function (L) {
      try { return Math.max(1, Math.round(pPlan(d, pLenOf(d, L)).total / 60)); } catch (e) { return 0; }
    });
    m = [Math.min.apply(null, m), Math.max.apply(null, m)];
    if (!d.custom) LIB.mins[d.id] = m;
    return m;
  }
  // the lengths, worked out a few at a time while the phone is idle after start-up, so the
  // library's first visit is as quick as the others
  function libWarm() {
    var i = 0, idle = window.requestIdleCallback || function (f) { return setTimeout(function () { f({ timeRemaining: function () { return 6; } }); }, 300); };
    var step = function (dl) {
      while (i < PRACTICES.length && dl.timeRemaining() > 2) libMins(PRACTICES[i++]);
      if (i < PRACTICES.length) idle(step);
    };
    idle(step);
  }
  function libMinsTxt(d, m) {
    if (d.selfPaced) return "About " + d.est + " min";
    if (d.lengths && d.lenUnit) return d.lengths[0] + "–" + d.lengths[d.lengths.length - 1] + " " + d.lenUnit + "s";
    if (d.lengths && d.nap) return d.lengths[0] + "–" + d.lengths[d.lengths.length - 1] + " min nap";
    if (m[0] !== m[1]) return m[0] + "–" + m[1] + " min";
    return (d.open ? "up to " : "") + m[0] + " min";
  }
  function libNeeds(o) {
    var n = [];
    if (o.audio || o.method === "sound") n.push("phones");
    if (o.sensor === "best") n.push("sensor");
    if (o.method === "move" || (o.posture || []).indexOf("walk") >= 0) n.push("space");
    return n;
  }

  /* one shape for everything the library lists */
  function libPractice(d) {
    var m = libMins(d), badges = [];
    if (d.custom) badges.push(["mine", "Yours"]);
    if (d.exp) badges.push(["exp", "Experimental"]);
    if (d.selfPaced) badges.push(["", "Self-paced"]);
    if (d.sensor === "best") badges.push(["hrm", "Best with sensor"]);
    if (d.rhythm) badges.push(["", "Berimbau"]);
    if (d.caution) badges.push(["cau", "Cautions"]);
    return { key: d.id, type: "practice", def: d, name: d.name, blurb: d.blurb, goal: d.goal || "", also: d.also || [],
      method: d.method || "move", posture: d.posture || ["stand"], needs: libNeeds(d), mins: m, minsTxt: libMinsTxt(d, m),
      href: "#practice/" + d.id, icon: pIcon(d), col: pColor(d), strength: d.strength, badges: badges, prog: d.method === "program" };
  }
  function libPattern(b) {
    var t = b.t, per = t.inh + t.sip + t.hold + t.exh + t.rest;
    return { key: "b:" + b.id, type: "pattern", name: patName(b), blurb: b.desc, goal: b.goal || "", also: b.also || [],
      method: "breath", posture: b.posture || ["sit"], needs: [], mins: [1, 60], minsTxt: (Math.round(600 / per) / 10) + " breaths a minute",
      label: "Breathing guide", href: "#breathe/" + b.id, icon: "breathe", col: "var(--b-in)", strength: b.strength, badges: b.mine ? [["mine", "Yours"]] : [] };
  }
  function libTrack(t) {
    return { key: "t:" + t.id, type: "track", name: t.name, blurb: t.desc, goal: t.goal, also: t.also || [],
      method: "sound", posture: t.posture, needs: ["phones"], mins: [t.minutes, t.minutes], minsTxt: t.minutes + " min",
      label: t.band + " track", href: "#track/" + t.id, icon: "sounds", col: LIB_TRACK_COL[t.cat] || "var(--relax)", strength: t.strength, badges: [] };
  }
  function libTool(id) {
    var x = TOOLS[id], c = CAT["x:" + id] || {};
    return { key: "x:" + id, type: "tool", name: x.name, blurb: x.blurb || "", goal: c.goal || "", also: [], method: id === "routine" ? "move" : "sound",
      posture: c.posture || ["sit"], needs: id === "routine" ? ["space"] : ["phones"], mins: id === "prime" ? [5, 20] : [1, 60],
      minsTxt: id === "prime" ? "5–20 min" : "your choice", label: id === "prime" ? "Beats before work" : "Tool", nopos: id !== "prime",
      href: x.href, icon: x.icon, col: id === "routine" ? "var(--accent)" : "var(--stim)", strength: id === "prime" ? x.strength : 0, badges: [] };
  }
  function libAll() {
    var out = PRACTICES.map(libPractice);
    BREATHS.forEach(function (b) { if (b.goal) out.push(libPattern(b)); });
    TRACKS.forEach(function (t) { if (t.goal && t.goal !== "tinnitus") out.push(libTrack(t)); });
    out.push(libTool("prime"));
    out.sort(function (a, b) { return (CAT[a.key] ? CAT[a.key].rank : 99) - (CAT[b.key] ? CAT[b.key].rank : 99); });
    return out;
  }
  // the first few names under a goal, in the library's own order, without working out every
  // practice's length as libAll does: Today's goal tiles need only the names
  function libNames(goal, n) {
    var out = [], x = libTool("prime");
    PRACTICES.forEach(function (d) { if (d.goal === goal) out.push({ key: d.id, name: d.name }); });
    BREATHS.forEach(function (b) { if (b.goal === goal) out.push({ key: "b:" + b.id, name: PATTERN_NAMES[b.id] || b.id }); });
    TRACKS.forEach(function (t) { if (t.goal === goal && goal !== "tinnitus") out.push({ key: "t:" + t.id, name: t.name }); });
    if (x.goal === goal) out.push(x);
    out.sort(function (a, b) { return (CAT[a.key] ? CAT[a.key].rank : 99) - (CAT[b.key] ? CAT[b.key].rank : 99); });
    return out.slice(0, n).map(function (it) { return it.name; });
  }
  // your routines, then your breathing patterns
  function libMine() { return yLoad().map(function (q) { return libPractice(yDef(q)); }).concat(mpAll().map(libPattern)); }
  function libTinnitus() { return TRACKS.filter(function (t) { return t.goal === "tinnitus"; }).map(libTrack); }
  // any one item by its key, as favourites and the history keep it; null once it's gone
  function libItem(key) {
    if (!key) return null;
    if (key.indexOf("b:") === 0) { var b = preset(key.slice(2)); return b && (b.goal || b.mine) ? libPattern(b) : null; }
    if (key.indexOf("t:") === 0) { var t = trackById(key.slice(2)); return t ? libTrack(t) : null; }
    if (key.indexOf("x:") === 0) return TOOLS[key.slice(2)] ? libTool(key.slice(2)) : null;
    var d = pDef(key);
    return d ? libPractice(d) : null;
  }
  // the library at one goal, or at one technique: from Today's goal tiles, and old links to Sounds
  function libShow(goal, method) {
    libClear();
    if (goalOf(goal)) LIB.goals = [goal];
    if (method) LIB.f.method = [method];
    LIB.panel = false;
    try { history.replaceState(null, "", "#practice"); } catch (e) {}
    showView("practice");
  }

  /* ----- filters ----- */
  function libClear(panelOnly) {
    if (!panelOnly) { LIB.goals = []; LIB.f.method = []; }
    LIB.f.len = []; LIB.f.posture = []; LIB.f.needs = [];
  }
  // one item against one row's choices: nothing chosen lets everything through, several let through any of them
  function libFacet(it, k, vals) {
    if (!vals.length) return true;
    return vals.some(function (v) {
      if (k === "method") return it.method === v;
      if (k === "posture") return it.posture.indexOf(v) >= 0;
      if (k === "needs") return v === "none" ? !it.needs.length : it.needs.indexOf(v) >= 0;
      return v === "long" ? it.mins[1] > 20.5 : it.mins[0] <= parseInt(v, 10) + 0.5;      // length
    });
  }
  // every row but one ("skip": the row whose chips are being counted)
  function libPass(it, skip) {
    for (var i = 0; i < LIB_FACETS.length; i++) if (LIB_FACETS[i] !== skip && !libFacet(it, LIB_FACETS[i], LIB.f[LIB_FACETS[i]])) return false;
    return true;
  }
  function libFor(it, g) { return it.goal === g || it.also.indexOf(g) >= 0; }
  function libGoalHit(it) { return !LIB.goals.length || LIB.goals.some(function (g) { return libFor(it, g); }); }
  function libPanelN() { return LIB.f.len.length + LIB.f.posture.length + LIB.f.needs.length; }
  function libFiltered() { return LIB.goals.length + LIB.f.method.length + libPanelN() > 0; }
  function libToggle(list, v) { var i = list.indexOf(v); if (i >= 0) list.splice(i, 1); else list.push(v); }
  // "calm or sleep", in the order the chips show them
  function libOr(ids, names) {
    var n = names.filter(function (x) { return ids.indexOf(x[0]) >= 0; }).map(function (x) { return x[1]; });
    return n.length > 1 ? n.slice(0, -1).join(", ") + " or " + n[n.length - 1] : n[0] || "";
  }

  /* ----- rendering ----- */
  // one row; compact rows (on Today) leave out the blurb and the timeline, and can say something else under the name
  function libRow(it, hide, o) {
    o = o || {};
    var tl = "";
    if (it.prog && !o.compact) {
      var plan = pPlan(it.def, 0);
      tl = '<span class="si-tl pc-tl" aria-hidden="true">' + plan.steps.map(function (s) { return '<i data-k="' + s.k + '" style="flex:' + s.secs + ' 1 0"></i>'; }).join("") + "</span>";
    }
    var pos = it.nopos ? "" : it.posture.map(function (p, i) { var n = postureName(p); return i ? n.toLowerCase() : n; }).join(" or ");
    var sub = o.sub || [it.label || methodName(it.method), it.minsTxt, pos].filter(Boolean).join(" · ");
    return '<li class="pc' + (it.prog ? " prog" : "") + (o.compact ? " cmp" : "") + (it.type !== "practice" ? " pc-" + it.type : "") + '" style="--pcol:' + it.col + '"' + (hide ? " hidden" : "") + ">" +
      '<a href="' + esc(it.href) + '" class="pc-a">' +
        '<span class="pc-ic"><svg class="i" aria-hidden="true"><use href="#i-' + it.icon + '"/></svg></span>' +
        '<span class="pc-b"><span class="pc-top"><b>' + esc(it.name) + "</b>" + (it.strength ? dots(it.strength) : "") + "</span>" +
          '<span class="pc-meta"><span class="pc-sub">' + esc(sub) + "</span>" +
            (o.compact ? "" : it.badges.map(function (b) { return '<span class="' + b[0] + '">' + esc(b[1]) + "</span>"; }).join("")) + "</span>" +
          (it.blurb && !o.compact ? '<span class="pc-blurb">' + esc(it.blurb) + "</span>" : "") + tl +
        "</span></a></li>";
  }
  function libSection(g, title, lede, icon, items, cap, extra) {
    var more = cap && items.length > cap && !LIB.open[g];
    return '<section class="pr-grp" data-g="' + g + '"><div class="pr-gh"><h2>' + (icon ? '<svg class="i" aria-hidden="true"><use href="#i-' + icon + '"/></svg>' : "") + esc(title) + "</h2>" +
      (lede ? "<p>" + esc(lede) + "</p>" : "") + "</div>" +
      '<ul class="pr-list">' + (extra || "") + items.map(function (it, i) { return libRow(it, more && i >= cap); }).join("") + "</ul>" +
      (more ? '<button class="pr-more" data-more="' + g + '" aria-expanded="false">Show all ' + items.length + "</button>" : "") + "</section>";
  }
  function libBuildRow() {
    return '<li class="pc pc-build" style="--pcol:var(--accent)"><a href="#yoga" class="pc-a"><span class="pc-ic"><svg class="i" aria-hidden="true"><use href="#i-plus"/></svg></span>' +
      '<span class="pc-b"><span class="pc-top"><b>Routine builder</b></span><span class="pc-meta"><span class="pc-sub">Tool · your choice</span></span>' +
      '<span class="pc-blurb">Pick from ' + ASANAS.length + " yoga poses, stretches, mobility drills and capoeira moves, set each one's time, and save the routine. Each comes with its own drawing and spoken cues, offline.</span></span></a></li>";
  }
  // a chip that toggles a choice, with how many it would show alongside the other rows' choices
  // (no count for "All" and "Any": the line under the chips gives the total)
  // (the count is read out with the name; hidden text inside a chip would stretch the page past a phone's width)
  function libChip(attr, v, label, on, n, small) {
    var c = typeof n === "number";
    return '<button class="chip-b' + (small ? " small" : "") + (c && !n ? " zero" : "") + '" ' + attr + '="' + v + '" aria-pressed="' + on + '"' +
      (c ? ' aria-label="' + label + ", " + n + (n === 1 ? " match" : " matches") + '"' : "") + ">" + label +
      (c ? '<span class="cnt" aria-hidden="true">' + n + "</span>" : "") + "</button>";
  }
  function pRenderLib() {
    var G = LIB.goals, f = LIB.f, filtered = libFiltered(), keep = libFocusKey();
    var all = libAll(), mine = libMine(), tin = libTinnitus(), beats = libTool("beats"), routine = libTool("routine");
    var every = mine.concat(all), cnt = function (fn) { var n = 0; every.forEach(function (it) { if (fn(it)) n++; }); return n; };
    var shown = function (it) { return libPass(it) && libGoalHit(it); };
    // the chips: goals, then techniques, each counted against everything else that's chosen
    $("#prFilt").innerHTML = libChip("data-f", "all", "All", !G.length) +
      GOALS.map(function (g) { return libChip("data-f", g.id, g.name, G.indexOf(g.id) >= 0, cnt(function (it) { return libPass(it) && libFor(it, g.id); })); }).join("");
    $("#prMeth").innerHTML = libChip("data-m", "all", "Any", !f.method.length) +
      METHODS.map(function (m) { return libChip("data-m", m[0], m[1], f.method.indexOf(m[0]) >= 0, cnt(function (it) { return libPass(it, "method") && libGoalHit(it) && it.method === m[0]; })); }).join("");
    libPanel(every);
    var cap = filtered ? 0 : (MOBILE.matches ? 4 : 6), h = "", n = 0;
    var sec = function (g, title, lede, icon, items, c, extra) { n += items.length + (extra ? 1 : 0); h += libSection(g, title, lede, icon, items, c, extra); };
    mine = mine.filter(shown); all = all.filter(shown);
    if (!G.length) {
      if (mine.length) {
        var nB = mine.filter(function (it) { return it.type === "pattern"; }).length, nR = mine.length - nB;
        sec("mine", nR && nB ? "Your routines and patterns" : nB ? "Your breathing patterns" : "Your routines", "Saved on this device.", nR ? "move" : "breathe", mine, cap);
      }
      GOALS.forEach(function (g) {
        var items = all.filter(function (it) { return it.goal === g.id; });
        if (items.length) sec(g.id, g.name, g.lede, g.icon, items, cap);
      });
      tin = tin.filter(function (it) { return libPass(it); });
      if (tin.length) sec("tinnitus", "For tinnitus", "Sound therapy for weeks of daily use, alongside your own care.", "sounds", tin, 0);
      var make = [beats].filter(function (it) { return libPass(it); }), build = libPass(routine);
      if (make.length || build) sec("make", "Make your own", "Your own routine or binaural beat.", "plus", make, 0, build ? libBuildRow() : "");
    } else {
      // each chosen goal with its own items, in the usual order; then what's also good for any of them
      GOALS.forEach(function (g) {
        if (G.indexOf(g.id) < 0) return;
        var main = mine.concat(all).filter(function (it) { return it.goal === g.id; });
        if (main.length) sec(g.id, g.name, g.lede, g.icon, main, 0);
      });
      var also = all.filter(function (it) { return G.indexOf(it.goal) < 0; }), names = GOALS.map(function (g) { return [g.id, g.name.toLowerCase()]; });
      if (also.length) sec("also", "Also good for " + libOr(G, names), G.length > 1 ? "Their main goal is another one, but they suit one of these too." : "Their main goal is another one, but they suit this too.", "", also, 0);
    }
    if (!h) h = '<div class="pr-empty"><p>Nothing matches these filters.</p><button class="btn small" data-clear="1">Clear filters</button></div>';
    $("#prLib").innerHTML = h;
    // what's chosen, in words, and how many it shows
    var sum = $("#prSum"), lens = LIB_LENS.map(function (l) { return [l[0], l[1].toLowerCase()]; });
    sum.hidden = !filtered;
    if (filtered) sum.innerHTML = "<span><b>" + n + "</b> " + (n === 1 ? "match" : "matches") + "</span>" +
      [libOr(G, GOALS.map(function (g) { return [g.id, g.name]; })), libOr(f.method, METHODS), libOr(f.len, lens), libOr(f.posture, POSTURES), libOr(f.needs, NEEDS)]
        .filter(Boolean).map(function (s) { return "<span>" + esc(s.charAt(0).toUpperCase() + s.slice(1)) + "</span>"; }).join("") +
      '<button type="button" class="sf-link pr-clear" data-clear="1">Clear all</button>';
    edgeFade($("#prFilt")); edgeFade($("#prMeth"));
    libRefocus(keep);
  }
  // re-drawn chips lose the keyboard focus: give it back to the one with the same choice
  function libFocusKey() {
    var a = document.activeElement;
    if (!a || !a.closest || !a.closest("#prFilt, #prMeth, #prPanel, #prSum")) return null;
    return ["data-f", "data-m", "data-k", "data-clear"].map(function (k) { return a.getAttribute(k) === null ? "" : "[" + k + '="' + a.getAttribute(k) + '"]'; }).join("") +
      (a.dataset.v ? '[data-v="' + a.dataset.v + '"]' : "");
  }
  function libRefocus(key) {
    if (!key) return;
    var b = document.querySelector("#prFilt " + key + ", #prMeth " + key + ", #prPanel " + key) || $("#prFbtn");
    try { b.focus({ preventScroll: true }); } catch (e) { b.focus(); }
  }
  function libPanel(every) {
    var f = LIB.f, n = libPanelN(), btn = $("#prFbtn");
    bSetT("#prFbtnTxt", n ? "Filters · " + n : "Filters");
    btn.classList.toggle("on", n > 0);
    btn.setAttribute("aria-expanded", LIB.panel ? "true" : "false");
    var p = $("#prPanel");
    p.hidden = !LIB.panel;
    if (!LIB.panel) return;
    every = every || libMine().concat(libAll());
    var row = function (key, label, opts) {
      return '<div class="pf-row" role="group" aria-label="' + label + '"><span class="pf-l">' + label + '</span><div class="pf-chips">' + opts.map(function (o) {
        var c = 0;
        every.forEach(function (it) { if (libPass(it, key) && libGoalHit(it) && libFacet(it, key, [o[0]])) c++; });
        return libChip('data-k="' + key + '" data-v', o[0], o[1], f[key].indexOf(o[0]) >= 0, c, true);
      }).join("") + "</div></div>";
    };
    p.innerHTML = row("len", "Length", LIB_LENS) + row("posture", "Posture", POSTURES) + row("needs", "Needs", NEEDS) +
      '<div class="pf-foot"><span>Pick one or several in a row; tap a chosen one again to remove it.</span>' + (n ? '<button class="btn small" data-clear="panel">Clear these</button>' : "") + "</div>";
  }
  function libInit() {
    $("#prFilt").addEventListener("click", function (e) {
      var b = e.target.closest("button[data-f]");
      if (!b) return;
      if (b.dataset.f === "all") LIB.goals = []; else libToggle(LIB.goals, b.dataset.f);
      pRenderLib();
    });
    $("#prMeth").addEventListener("click", function (e) {
      var b = e.target.closest("button[data-m]");
      if (!b) return;
      if (b.dataset.m === "all") LIB.f.method = []; else libToggle(LIB.f.method, b.dataset.m);
      pRenderLib();
    });
    $("#prFbtn").addEventListener("click", function () { LIB.panel = !LIB.panel; libPanel(); });
    var clear = function (panelOnly) { libClear(panelOnly); pRenderLib(); };
    $("#prPanel").addEventListener("click", function (e) {
      var c = e.target.closest("[data-clear]");
      if (c) { clear(true); $("#prFbtn").focus(); return; }
      var b = e.target.closest("button[data-k]");
      if (!b) return;
      libToggle(LIB.f[b.dataset.k], b.dataset.v);
      pRenderLib();
    });
    $("#prSum").addEventListener("click", function (e) { if (e.target.closest("[data-clear]")) { clear(false); $("#prFilt [data-f=all]").focus(); } });
    $("#prLib").addEventListener("click", function (e) {
      if (e.target.closest("[data-clear]")) { clear(false); $("#prFilt [data-f=all]").focus(); return; }
      var m = e.target.closest("[data-more]");
      if (!m) return;
      LIB.open[m.dataset.more] = true;
      var sec = m.closest(".pr-grp"), first = sec.querySelector("li[hidden]");
      sec.querySelectorAll("li[hidden]").forEach(function (li) { li.hidden = false; });
      m.remove();
      if (first) { var a = first.querySelector("a"); if (a) a.focus(); }
    });
  }
