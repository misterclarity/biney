  /* ------------------------------- the library -------------------------------
     Goal sections (Sleep, Calm, Focus, Energy, Recover, Reflect) holding practices, breathing
     patterns, tracks and the custom primer, each listed once, under its goal. A goal chip narrows
     it to one goal and adds the items that are also good for it; the filter panel narrows by
     method, length, posture and needs. On "All", each section shows its first few rows until you
     ask for the rest, and the tinnitus track and the two builders have sections of their own.
  ------------------------------------------------------------------------------ */

  var LIB = { goal: "all", f: { method: "", len: "", posture: "", needs: "" }, open: {}, panel: false, mins: {} };
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
    return { key: "b:" + b.id, type: "pattern", name: PATTERN_NAMES[b.id] || b.id, blurb: b.desc, goal: b.goal, also: b.also || [],
      method: "breath", posture: b.posture, needs: [], mins: [1, 60], minsTxt: (Math.round(600 / per) / 10) + " breaths a minute",
      label: "Breathing guide", href: "#breathe/" + b.id, icon: "breathe", col: "var(--b-in)", strength: b.strength, badges: [] };
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
  function libMine() { return yLoad().map(function (q) { return libPractice(yDef(q)); }); }
  function libTinnitus() { return TRACKS.filter(function (t) { return t.goal === "tinnitus"; }).map(libTrack); }
  // any one item by its key, as favourites and the history keep it; null once it's gone
  function libItem(key) {
    if (!key) return null;
    if (key.indexOf("b:") === 0) { var b = preset(key.slice(2)); return b && b.goal ? libPattern(b) : null; }
    if (key.indexOf("t:") === 0) { var t = trackById(key.slice(2)); return t ? libTrack(t) : null; }
    if (key.indexOf("x:") === 0) return TOOLS[key.slice(2)] ? libTool(key.slice(2)) : null;
    var d = pDef(key);
    return d ? libPractice(d) : null;
  }
  // the library at one goal, or at one method: from Today's goal tiles, and old links to Sounds
  function libShow(goal, method) {
    LIB.goal = goalOf(goal) ? goal : "all";
    LIB.f = { method: method || "", len: "", posture: "", needs: "" };
    LIB.panel = !!method;
    try { history.replaceState(null, "", "#practice"); } catch (e) {}
    showView("practice");
  }

  /* ----- filters ----- */
  function libPass(it) {
    var f = LIB.f;
    if (f.method && it.method !== f.method) return false;
    if (f.posture && it.posture.indexOf(f.posture) < 0) return false;
    if (f.needs === "none" ? it.needs.length : f.needs && it.needs.indexOf(f.needs) < 0) return false;
    if (f.len === "long") { if (it.mins[1] <= 20.5) return false; }
    else if (f.len && it.mins[0] > parseInt(f.len, 10) + 0.5) return false;
    return true;
  }
  function libFiltered() { var f = LIB.f; return !!(f.method || f.len || f.posture || f.needs); }

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
  function pRenderLib() {
    $("#prFilt").innerHTML = [["all", "All"]].concat(GOALS.map(function (g) { return [g.id, g.name]; })).map(function (f) {
      return '<button class="chip-b" data-f="' + f[0] + '" aria-pressed="' + (f[0] === LIB.goal) + '">' + f[1] + "</button>";
    }).join("");
    libPanel();
    var all = libAll().filter(libPass), mine = libMine().filter(libPass), filtered = libFiltered();
    var cap = filtered ? 0 : (MOBILE.matches ? 4 : 6), h = "";
    if (LIB.goal === "all") {
      if (mine.length) h += libSection("mine", "Your routines", "Saved on this device.", "move", mine, cap);
      GOALS.forEach(function (g) {
        var items = all.filter(function (it) { return it.goal === g.id; });
        if (items.length) h += libSection(g.id, g.name, g.lede, g.icon, items, cap);
      });
      var tin = libTinnitus().filter(libPass);
      if (tin.length) h += libSection("tinnitus", "For tinnitus", "Sound therapy for weeks of daily use, alongside your own care.", "sounds", tin, 0);
      var make = [libTool("beats")].filter(libPass), build = libPass(libTool("routine"));
      if (make.length || build) h += libSection("make", "Make your own", "Your own routine or binaural beat.", "plus", make, 0, build ? libBuildRow() : "");
    } else {
      var g = goalOf(LIB.goal);
      var main = mine.filter(function (it) { return it.goal === g.id; }).concat(all.filter(function (it) { return it.goal === g.id; }));
      var also = all.filter(function (it) { return it.goal !== g.id && it.also.indexOf(g.id) >= 0; });
      if (main.length) h += libSection(g.id, g.name, g.lede, g.icon, main, 0);
      if (also.length) h += libSection("also", "Also good for " + g.name.toLowerCase(), "Their main goal is another one, but they suit this too.", "", also, 0);
    }
    if (!h) h = '<div class="pr-empty"><p>Nothing matches these filters.</p><button class="btn small" data-clear="1">Clear filters</button></div>';
    $("#prLib").innerHTML = h;
    edgeFade($("#prFilt"));
  }
  function libPanel() {
    var f = LIB.f, n = (f.method ? 1 : 0) + (f.len ? 1 : 0) + (f.posture ? 1 : 0) + (f.needs ? 1 : 0);
    var btn = $("#prFbtn");
    bSetT("#prFbtnTxt", n ? "Filters · " + n : "Filters");
    btn.classList.toggle("on", n > 0);
    btn.setAttribute("aria-expanded", LIB.panel ? "true" : "false");
    var row = function (key, label, opts) {
      return '<div class="pf-row" role="group" aria-label="' + label + '"><span class="pf-l">' + label + "</span><div class=\"pf-chips\">" + opts.map(function (o) {
        return '<button class="chip-b small" data-k="' + key + '" data-v="' + o[0] + '" aria-pressed="' + (f[key] === o[0]) + '">' + o[1] + "</button>";
      }).join("") + "</div></div>";
    };
    var p = $("#prPanel");
    p.hidden = !LIB.panel;
    if (!LIB.panel) return;
    p.innerHTML = row("method", "Method", METHODS.map(function (m) { return [m[0], m[1]]; })) + row("len", "Length", LIB_LENS) +
      row("posture", "Posture", POSTURES) + row("needs", "Needs", NEEDS) +
      '<div class="pf-foot"><span>Tap a chosen filter again to remove it.</span>' + (n ? '<button class="btn small" data-clear="1">Clear filters</button>' : "") + "</div>";
  }
  function libInit() {
    $("#prFilt").addEventListener("click", function (e) {
      var b = e.target.closest("button[data-f]");
      if (!b) return;
      LIB.goal = b.dataset.f;
      pRenderLib();
    });
    $("#prFbtn").addEventListener("click", function () { LIB.panel = !LIB.panel; libPanel(); });
    var clear = function () { LIB.f = { method: "", len: "", posture: "", needs: "" }; pRenderLib(); };
    $("#prPanel").addEventListener("click", function (e) {
      if (e.target.closest("[data-clear]")) { clear(); return; }
      var b = e.target.closest("button[data-k]");
      if (!b) return;
      LIB.f[b.dataset.k] = LIB.f[b.dataset.k] === b.dataset.v ? "" : b.dataset.v;
      pRenderLib();
    });
    $("#prLib").addEventListener("click", function (e) {
      if (e.target.closest("[data-clear]")) { clear(); return; }
      var m = e.target.closest("[data-more]");
      if (!m) return;
      LIB.open[m.dataset.more] = true;
      var sec = m.closest(".pr-grp"), first = sec.querySelector("li[hidden]");
      sec.querySelectorAll("li[hidden]").forEach(function (li) { li.hidden = false; });
      m.remove();
      if (first) { var a = first.querySelector("a"); if (a) a.focus(); }
    });
  }
