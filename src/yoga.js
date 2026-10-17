
  /* ---------------------------- your own yoga ----------------------------
     Sequences are lists of {id, hold, side} stored on this device. Each saved
     sequence becomes a practice ("my-<uid>") that runs through yogaSteps(), so
     it gets the same drawings, spoken cues, transitions and summary.
  ------------------------------------------------------------------------ */

  var Y = { uid: null, name: "", items: [], cat: "all", from: null, delArm: 0 };

  function yLoad() {
    try { var a = JSON.parse(store.get("yogaSeqs") || "[]"); return Array.isArray(a) ? a.filter(function (q) { return q && q.uid && Array.isArray(q.items); }) : []; }
    catch (e) { return []; }
  }
  function yStore(list) { store.set("yogaSeqs", JSON.stringify(list)); }
  function yGet(uid) { return yLoad().filter(function (q) { return q.uid === uid; })[0] || null; }
  function yDef(q) {
    var items = q.items.filter(function (i) { return ASANA[i.id]; }), names = [];
    items.forEach(function (i) { var n = ASANA[i.id].en; if (names.indexOf(n) < 0) names.push(n); });
    var pos = items.map(function (i) { return ASANA[i.id].pos; });
    return {
      id: "my-" + q.uid, custom: q.uid, group: "move", tags: ["move"], name: q.name || "My routine", strength: 2, tone: "relax", voice: true,
      stand: pos.indexOf("stand") >= 0, lie: pos.indexOf("supine") >= 0 || pos.indexOf("prone") >= 0,
      blurb: names.length ? names.slice(0, 6).join(", ") + (names.length > 6 ? " and " + (names.length - 6) + " more." : ".") : "No poses yet.",
      build: function () { return yogaSteps(items); }, ev: YOGA_EV, cite: "Pascoe et al. 2017"
    };
  }

  /* ----- the builder screen ----- */
  function yOpen(arg) {
    var q;
    if (arg && arg.indexOf("copy/") === 0) {
      var set = yogaSet(arg.slice(5));
      Y.uid = null; Y.from = set ? set.name : null;
      Y.name = set ? set.name + " (mine)" : "";
      Y.items = set ? set.items.map(function (i) { return { id: i.id, hold: i.hold, side: i.side }; }) : [];
    } else if (arg && (q = yGet(arg))) {
      Y.uid = q.uid; Y.name = q.name; Y.items = q.items.map(function (i) { return { id: i.id, hold: i.hold, side: i.side }; }); Y.from = null;
    } else if (!arg && Y.uid) {
      Y.uid = null; Y.name = ""; Y.items = []; Y.from = null;           // a fresh sequence
    }
    Y.delArm = 0;
    $("#ybName").value = Y.name;
    $("#ybDel").hidden = !Y.uid;
    bSetT("#viewTitle", Y.uid ? "Edit routine" : "Build your own");
    document.title = (Y.uid ? "Edit routine" : "Build your own routine") + " | Entrain";
    yRenderTpl(); yRenderSeq(); yRenderLib();
  }
  function yFig(id, side) { var a = ASANA[id]; return a ? figSVG(a.fig, side || (a.sides ? "right" : null), "mini") : ""; }
  function yHoldStep(h, dir) {
    var st = dir > 0 ? (h < 60 ? 5 : h < 180 ? 15 : 30) : (h <= 60 ? 5 : h <= 180 ? 15 : 30);
    return Math.max(10, Math.min(600, h + dir * st));
  }
  function yHoldTxt(h) { return h < 60 ? h + " s" : Math.floor(h / 60) + ":" + ("0" + h % 60).slice(-2); }
  function yRenderTpl() {
    $("#ybTpl").innerHTML = '<span>Start from</span>' + YOGA_SETS.map(function (t) {
      return '<button class="chip-b" data-tpl="' + t.id + '">' + esc(t.name) + "</button>";
    }).join("");
  }
  function yRenderSeq() {
    var it = Y.items;
    $("#ybList").innerHTML = it.map(function (x, i) {
      var a = ASANA[x.id];
      if (!a) return "";
      var sides = a.sides ? '<span class="yb-sides" role="group" aria-label="Sides">' + [["", "Both"], ["right", "R"], ["left", "L"]].map(function (o) {
        return '<button data-a="side" data-v="' + o[0] + '" aria-pressed="' + ((x.side || "") === o[0]) + '">' + o[1] + "</button>";
      }).join("") + "</span>" : "";
      return '<li class="yb-row" data-i="' + i + '">' +
        '<span class="yb-n">' + (i + 1) + "</span>" +
        '<span class="yb-fig">' + yFig(x.id, x.side) + "</span>" +
        '<span class="yb-nm"><b>' + esc(a.en) + "</b><small>" + esc(a.sa) + (a.sides ? " · " + (x.side ? x.side + " side" : "both sides") : "") + "</small></span>" +
        '<span class="yb-ctl">' + sides +
          '<span class="yb-hold"><button data-a="minus" aria-label="Shorter">−</button><b>' + yHoldTxt(x.hold) + '</b><button data-a="plus" aria-label="Longer">+</button></span>' +
          '<span class="yb-mv"><button data-a="up" aria-label="Move up"' + (i ? "" : " disabled") + '><svg class="i"><use href="#i-up"/></svg></button>' +
          '<button data-a="down" aria-label="Move down"' + (i < it.length - 1 ? "" : " disabled") + '><svg class="i" style="transform:rotate(180deg)"><use href="#i-up"/></svg></button>' +
          '<button data-a="del" aria-label="Remove"><svg class="i"><use href="#i-x"/></svg></button></span>' +
        "</span></li>";
    }).join("");
    $("#ybEmpty").hidden = it.length > 0;
    var secs = it.length ? yogaSecs(it) : 0, n = it.length;
    bSetT("#ybTime", fmt(secs));
    bSetT("#ybCount", n ? n + (n === 1 ? " pose" : " poses") + (Y.from && !Y.uid ? " · from " + Y.from : "") : "No poses yet");
    bSetT("#ybBarTime", n ? fmt(secs) + " · " + n + (n === 1 ? " pose" : " poses") : "Add poses to begin");
    $("#ybGo").disabled = !n; $("#ybSave").disabled = !n;
  }
  function yRenderLib() {
    $("#ybCats").innerHTML = ACATS.map(function (c) {
      return '<button class="chip-b" data-cat="' + c[0] + '" aria-pressed="' + (Y.cat === c[0]) + '">' + c[1] + "</button>";
    }).join("");
    var list = ASANAS.filter(function (a) { return Y.cat === "all" || a.cat === Y.cat; });
    bSetT("#ybLibN", list.length + " " + (Y.cat === "capoeira" ? "moves" : Y.cat === "mobility" ? "moves and stretches" : Y.cat === "all" ? "in all" : "poses"));
    $("#ybLib").innerHTML = list.map(function (a) {
      return '<li><button class="yb-tile" data-add="' + a.id + '" aria-label="Add ' + esc(a.en) + '">' +
        '<span class="yb-tfig">' + yFig(a.id) + "</span>" +
        '<span class="yb-tt"><b>' + esc(a.en) + "</b><small>" + esc(a.sa) + "</small>" +
        '<span class="yb-cue">' + esc(aCue(a.cues[0], a.sides ? "right" : null)) + "</span>" +
        '<span class="yb-tm">' + yHoldTxt(a.hold) + (a.sides ? " · both sides" : "") + (a.move ? " · moving" : "") + '<i class="lv">' + "●●●".slice(0, a.level) + '<s>' + "●●●".slice(a.level) + "</s></i>" +
        (a.caution ? ' · <em>caution</em>' : "") + "</span></span>" +
        '<span class="yb-plus" aria-hidden="true">+</span></button></li>';
    }).join("");
  }
  function ySave(quiet) {
    if (!Y.items.length) return null;
    var list = yLoad(), name = ($("#ybName").value || "").trim() || "My routine " + (list.length + 1);
    Y.name = name;
    if (!Y.uid) Y.uid = Date.now().toString(36) + Math.floor(Math.random() * 1296).toString(36);
    var q = { uid: Y.uid, name: name, items: Y.items.map(function (i) { var o = { id: i.id, hold: i.hold }; if (i.side) o.side = i.side; return o; }), at: Date.now() };
    var k = -1;
    list.forEach(function (x, i) { if (x.uid === q.uid) k = i; });
    if (k >= 0) list[k] = q; else list.push(q);
    yStore(list);
    $("#ybName").value = name;
    $("#ybDel").hidden = false;
    if (!quiet) toast("Saved “" + name + "”. It's in Practice, under Movement.");
    if (location.hash !== "#yoga/" + q.uid) history.replaceState(null, "", "#yoga/" + q.uid);
    return q;
  }
  function yInit() {
    $("#ybCats").addEventListener("click", function (e) {
      var b = e.target.closest("button"); if (!b) return;
      Y.cat = b.dataset.cat; yRenderLib();
    });
    $("#ybLib").addEventListener("click", function (e) {
      var b = e.target.closest("[data-add]"); if (!b) return;
      var a = ASANA[b.dataset.add];
      Y.items.push({ id: a.id, hold: a.hold });
      yRenderSeq();
      var rows = $("#ybList").children, last = rows[rows.length - 1];
      if (last) { last.classList.add("flash"); setTimeout(function () { last.classList.remove("flash"); }, 900); }
      toast("Added " + a.en + (a.sides ? " (both sides)" : "") + ".", { ms: 1800 });
    });
    $("#ybList").addEventListener("click", function (e) {
      var b = e.target.closest("button[data-a]"); if (!b) return;
      var i = parseInt(b.closest(".yb-row").dataset.i, 10), it = Y.items, x = it[i], a = b.dataset.a;
      if (a === "minus" || a === "plus") x.hold = yHoldStep(x.hold, a === "plus" ? 1 : -1);
      else if (a === "up" && i > 0) { it[i] = it[i - 1]; it[i - 1] = x; }
      else if (a === "down" && i < it.length - 1) { it[i] = it[i + 1]; it[i + 1] = x; }
      else if (a === "del") it.splice(i, 1);
      else if (a === "side") { if (b.dataset.v) x.side = b.dataset.v; else delete x.side; }
      yRenderSeq();
    });
    $("#ybTpl").addEventListener("click", function (e) {
      var b = e.target.closest("[data-tpl]"); if (!b) return;
      var set = yogaSet(b.dataset.tpl);
      Y.items = set.items.map(function (i) { return { id: i.id, hold: i.hold, side: i.side }; });
      var nm = $("#ybName").value.trim();
      if (!Y.uid) Y.from = set.name;
      if (!nm || / \(mine\)$/.test(nm)) { $("#ybName").value = set.name + " (mine)"; Y.name = $("#ybName").value; }
      yRenderSeq();
      toast("Loaded " + set.name + ". Change anything, then save.", { ms: 2600 });
    });
    $("#ybName").addEventListener("input", function () { Y.name = this.value; });
    $("#ybSave").addEventListener("click", function () { ySave(false); });
    $("#ybGo").addEventListener("click", function () { var q = ySave(true); if (q) location.hash = "practice/my-" + q.uid; });
    $("#ybDel").addEventListener("click", function () {
      if (!Y.uid) return;
      if (!(Y.delArm && bNow() - Y.delArm < 3)) {
        Y.delArm = bNow(); bSetT("#ybDel", "Tap again to delete"); this.classList.add("armed");
        var b = this; setTimeout(function () { b.classList.remove("armed"); bSetT("#ybDel", "Delete"); }, 3000);
        return;
      }
      yStore(yLoad().filter(function (q) { return q.uid !== Y.uid; }));
      toast("Deleted “" + (Y.name || "routine") + "”.");
      Y.uid = null; Y.items = []; Y.name = "";
      location.hash = "practice";
    });
  }
