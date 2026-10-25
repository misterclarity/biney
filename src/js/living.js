  /* ------------------------------- healthy living -------------------------------
     A page under Learn with two tabs. Recipes: each has a page of its own, with servings that
     scale the amounts, ingredients and steps to tick off as you go, and the screen kept on while
     you cook. Supplements: each is a card that opens to what the trials found, how strong that
     is, the amounts studied, what to check first and the sources.
     #living opens the tab you had last, #living/recipes and #living/supplements open a tab,
     #living/<recipe> a recipe's page and #living/<supplement> its card, opened.
  -------------------------------------------------------------------------------- */

  var LV = { tab: "", rid: "", n: 0, base: 0, cook: false };
  var LV_UNITS = { g: "g", ml: "ml", tsp: "tsp", tbsp: "tbsp", cm: "cm", tin: ["tin", "tins"], handful: ["handful", "handfuls"],
    slice: ["slice", "slices"], pinch: ["pinch", "pinches"] };
  var LV_MAX = 12;                         // servings
  var LV_TABS = [["recipes", "Recipes"], ["supplements", "Supplements"]];

  function recipeById(id) { for (var i = 0; i < RECIPES.length; i++) if (RECIPES[i].id === id) return RECIPES[i]; return null; }
  function suppById(id) {
    var all = SUPPS.concat(SUPPS_MORE);
    for (var i = 0; i < all.length; i++) if (all[i].id === id) return all[i];
    return null;
  }
  // a number keeps its unit on the same line: "1 to 2\u00a0g", "80\u00a0minutes"
  function lvNb(s) { return String(s).replace(/(\d) (?=(?:g|mg|µg|kg|IU|ml|L|cm|mmol\/L|min|minutes|hours|weeks|days|years)\b)/g, "$1\u00a0"); }
  function lvMins(m) { return m >= 60 ? Math.floor(m / 60) + " h" + (m % 60 ? " " + (m % 60) + " min" : "") : m + " min"; }
  function lvTime(r) { return lvMins(r.prep + r.cook) + (r.rest ? ", " + r.rest : ""); }

  /* ----- amounts, scaled to the servings ----- */
  // spoons, counts and tins to the nearest quarter or half, as a cook would say them
  function lvFrac(x, step) {
    var q = Math.max(step, Math.round(x / step) * step), w = Math.floor(q + 1e-9), f = Math.round((q - w) * 100) / 100;
    var s = { 0.25: "¼", 0.5: "½", 0.75: "¾" }[f] || "";
    return w ? w + s : s || String(q);
  }
  // grams and millilitres rounded more coarsely the more there is; a litre or more in litres
  function lvMetric(x, u) {
    var r = x < 20 ? Math.max(1, Math.round(x)) : x < 250 ? Math.round(x / 5) * 5 : x < 1000 ? Math.round(x / 10) * 10 : Math.round(x / 50) * 50;
    if (u === "ml" && r >= 1000) return r / 1000 + " L";
    return r + " " + u;
  }
  // [amount, unit, name, note] at k times the recipe's servings: the amount to show, and the name in
  // the singular or the plural to go with it
  function lvAmt(it, k) {
    var q = it[0], u = it[1], one = Array.isArray(it[2]) ? it[2][0] : it[2], many = Array.isArray(it[2]) ? it[2][1] : it[2];
    if (q === null) return { a: "", n: many };
    var x = q * k, v;
    if (u === "g" || u === "ml") return { a: lvMetric(x, u), n: one };
    if (u === "cm") return { a: Math.max(0.5, Math.round(x * 2) / 2) + " cm", n: one };
    if (u === "tsp" || u === "tbsp") return { a: lvFrac(x, 0.25) + " " + u, n: one };
    if (LV_UNITS[u]) {                     // tins by the half, handfuls, slices and pinches whole
      var st = u === "tin" ? 0.5 : 1;
      v = Math.max(st, Math.round(x / st) * st);
      return { a: lvFrac(v, st) + " " + LV_UNITS[u][v > 1 ? 1 : 0], n: v > 1 ? many : one };
    }
    v = Math.max(0.5, Math.round(x * 2) / 2);   // a count: half an onion is still an onion
    return { a: lvFrac(v, 0.5), n: v > 1 ? many : one };
  }
  function lvIngLi(it, i, k, grp) {
    var m = lvAmt(it, k);
    return '<li><label><input type="checkbox" data-ing="' + grp + i + '"><span><b class="lv-q" data-q="' + grp + i + '">' + esc(m.a) + "</b> " +
      '<span class="lv-n" data-n="' + grp + i + '">' + esc(m.n) + "</span>" + (it[3] ? "<small>" + esc(it[3]) + "</small>" : "") + "</span></label></li>";
  }

  /* ----- the list: two tabs ----- */
  function libRecipe(r) {
    return { key: "r:" + r.id, type: "recipe", name: r.name, blurb: r.why, goal: "", also: [], method: "", posture: [], nopos: true, needs: [],
      mins: [r.prep + r.cook, r.prep + r.cook], minsTxt: lvTime(r), label: "Recipe · serves " + r.serves, href: "#living/" + r.id,
      icon: "bowl", col: "var(--food)", strength: 0, badges: r.tags.map(function (t) { return ["", t]; }) };
  }
  function lvBest(s) {                     // a supplement's best-supported use
    if (!s.uses) return [s.ev, s.what];
    var b = s.uses[0];
    s.uses.forEach(function (u) { if (u[0] > b[0]) b = u; });
    return [b[0], b[1]];
  }
  function lvRefs(refs) {
    return '<details class="ev lv-refs"><summary>Sources (' + refs.length + ")</summary><ol class=\"lv-refl\">" + refs.map(function (r) {
      return "<li>" + esc(r[0]) + ' <a href="' + esc(r[1]) + '" rel="noopener">' + esc(r[2] || "Link") + "</a></li>";
    }).join("") + "</ol></details>";
  }
  function lvSupCard(s) {
    var b = lvBest(s), brief = !s.uses;
    var h = '<details class="lv-sup' + (brief ? " lv-brief" : "") + '" id="lv-' + s.id + '">' +
      '<summary><span class="pc-ic"><svg class="i" aria-hidden="true"><use href="#i-pill"/></svg></span>' +
        '<span class="lv-sum"><span class="pc-top"><b>' + esc(s.name) + "</b>" + dots(b[0]) + "</span>" +
          '<span class="lv-best">' + (brief ? "" : "Best evidence: ") + esc(brief ? b[1] : b[1].charAt(0).toLowerCase() + b[1].slice(1)) + "</span>" +
          (brief ? "" : '<span class="pc-blurb">' + esc(s.lead) + "</span>") + "</span>" +
        '<svg class="i lv-chev" aria-hidden="true"><use href="#i-up"/></svg></summary><div class="lv-body">';
    if (brief) {
      h += "<p>" + esc(lvNb(s.text)) + "</p>" +
        '<p class="lv-care1"><svg class="i" aria-hidden="true"><use href="#i-warn"/></svg><span>' + esc(lvNb(s.care)) + "</span></p>";
    } else {
      h += "<h3>What it may help</h3><ul class=\"lv-uses\">" + s.uses.map(function (u) {
          return '<li><span class="lv-use-h"><b>' + esc(u[1]) + "</b>" + dots(u[0]) + "</span><p>" + esc(lvNb(u[2])) + "</p></li>";
        }).join("") + "</ul>" +
        '<dl class="lv-facts"><div><dt>Amounts studied</dt><dd>' + esc(lvNb(s.amount)) + "</dd></div>" +
          "<div><dt>How to take it</dt><dd>" + esc(lvNb(s.how)) + "</dd></div>" +
          "<div><dt>In food</dt><dd>" + esc(lvNb(s.food)) + "</dd></div></dl>" +
        '<div class="lv-care"><h3><svg class="i" aria-hidden="true"><use href="#i-warn"/></svg>Check first</h3><ul>' +
          s.care.map(function (c) { return "<li>" + esc(lvNb(c)) + "</li>"; }).join("") + "</ul></div>";
    }
    return h + lvRefs(s.refs) + "</div></details>";
  }
  function lvList() {
    var tabs = '<div class="g-tabs lv-tabs" role="tablist" aria-label="Healthy living">' + LV_TABS.map(function (t, i) {
      return '<button class="g-tab" role="tab" id="lvt-' + t[0] + '" data-tab="' + t[0] + '" aria-controls="lvp-' + t[0] + '" aria-selected="' + !i + '"' + (i ? ' tabindex="-1"' : "") + ">" + t[1] + "</button>";
    }).join("") + "</div>";
    var rec = '<div class="lv-panel" role="tabpanel" id="lvp-recipes" aria-labelledby="lvt-recipes">' +
      '<p class="lv-lede">Simple, nourishing food, most of it from one pot. Each recipe scales to the number you\'re cooking for, and keeps the screen on while you cook.</p>' +
      '<ul class="pr-list lv-rlist">' + RECIPES.map(function (r) { return libRow(libRecipe(r)); }).join("") + "</ul></div>";
    var sup = '<div class="lv-panel" role="tabpanel" id="lvp-supplements" aria-labelledby="lvt-supplements" hidden>' +
      '<p class="lv-lede">What the research says about the supplements people ask about most: what each may help and how strong the evidence is, the amounts studied, and what to check before you start. Food comes first; these fill gaps.</p>' +
      safeBox([SAFE_SUPPS]) +
      '<p class="pr-legend">Evidence' +
        '<span><span class="strength" aria-hidden="true"><i class="on"></i><i class="on"></i><i class="on"></i></span>strong</span>' +
        '<span><span class="strength" aria-hidden="true"><i class="on"></i><i class="on"></i><i></i></span>moderate</span>' +
        '<span><span class="strength" aria-hidden="true"><i class="on"></i><i></i><i></i></span>limited</span></p>' +
      '<div class="lv-sups">' + SUPPS.map(lvSupCard).join("") + "</div>" +
      '<h2 class="lv-h2">Also asked about</h2>' +
      '<div class="lv-sups">' + SUPPS_MORE.map(lvSupCard).join("") + "</div>" +
      '<p class="pr-note">Not medical advice, and no substitute for a blood test where one would tell you more: vitamin D, B12 and iron are better tested than guessed. ' +
        'Choose products tested by a third party. The sources were checked in October 2026, and each card lists its own.</p></div>';
    return '<a class="si-back" href="#learn"><svg class="i" aria-hidden="true"><use href="#i-back"/></svg>Learn</a>' +
      '<p class="v-lede lv-intro">Food that looks after you, and an honest look at supplements.</p>' + tabs + rec + sup;
  }
  function lvTab(tab, focus) {
    if (!LV_TABS.some(function (t) { return t[0] === tab; })) tab = "recipes";
    LV.tab = tab;
    store.set("livTab", tab);
    LV_TABS.forEach(function (t) {
      var b = $("#lvt-" + t[0]), on = t[0] === tab;
      if (!b) return;
      b.setAttribute("aria-selected", on ? "true" : "false");
      b.tabIndex = on ? 0 : -1;
      $("#lvp-" + t[0]).hidden = !on;
      if (on && focus) b.focus();
    });
  }

  /* ----- a recipe's page ----- */
  function lvRecipe(r) {
    LV.rid = r.id; LV.base = r.serves; LV.n = r.serves;
    var serve = r.serve || [];
    var h = '<a class="si-back" href="#living/recipes"><svg class="i" aria-hidden="true"><use href="#i-back"/></svg>Healthy living</a>' +
      '<div class="si-head">' +
        '<div class="si-top"><span class="si-kind">' + esc("Recipe · " + lvTime(r)) + "</span>" + favBtn("r:" + r.id, r.name) + "</div>" +
        "<h2>" + esc(r.name) + "</h2>" +
        '<p class="si-blurb">' + esc(r.why) + "</p>" +
        '<p class="lv-tags">' + r.tags.map(function (t) { return "<span>" + esc(t) + "</span>"; }).join("") + "</p>" +
      "</div>" +
      '<div class="si-grid"><div class="si-main lv-recipe">' +
        '<h3 id="lvIngH">Ingredients</h3><ul class="lv-ing" aria-labelledby="lvIngH">' + r.ing.map(function (it, i) { return lvIngLi(it, i, 1, "i"); }).join("") + "</ul>" +
        (serve.length ? '<h4 id="lvSrvH">To serve</h4><ul class="lv-ing" aria-labelledby="lvSrvH">' + serve.map(function (it, i) { return lvIngLi(it, i, 1, "s"); }).join("") + "</ul>" : "") +
        '<h3 id="lvStepH">Method</h3><ol class="lv-steps" aria-labelledby="lvStepH">' + r.steps.map(function (s, i) {
          return '<li><label><input type="checkbox" data-step="' + i + '"><span>' + esc(lvNb(s)) + "</span></label></li>";
        }).join("") + "</ol>" +
        (r.tips && r.tips.length ? "<h3>Good to know</h3><ul class=\"lv-tips\">" + r.tips.map(function (t) { return "<li>" + esc(lvNb(t)) + "</li>"; }).join("") + "</ul>" : "") +
        (r.keep ? '<p class="lv-keep"><b>Keeping it.</b> ' + esc(lvNb(r.keep)) + "</p>" : "") +
      "</div>" +
      '<div class="si-side"><div class="si-opts lv-opts">' +
        '<div class="so-row"><span class="so-l">Servings<small id="lvServNote">' + esc(lvServNote()) + "</small></span>" +
          '<span class="so-step lv-serv"><button data-d="-1" aria-label="One serving fewer">−</button><b id="lvServ" aria-live="polite">' + LV.n + "</b>" +
          '<button data-d="1" aria-label="One serving more">+</button></span></div>' +
        pToggle("lvWake", "Keep the screen on", LV.cook, "While this recipe is open, so it's there when your hands are busy.") +
      "</div></div></div>";
    return h;
  }
  function lvServNote() { return LV.n === LV.base ? "As written. The amounts change to match." : "Scaled from " + LV.base + ". Cooking times stay the same; a bigger pot may need longer to come to the boil."; }
  function lvServ(d) {
    var r = recipeById(LV.rid);
    if (!r) return;
    var n = Math.max(1, Math.min(LV_MAX, LV.n + d));
    if (n === LV.n) return;
    LV.n = n;
    var k = n / r.serves;
    [["i", r.ing], ["s", r.serve || []]].forEach(function (g) {
      g[1].forEach(function (it, i) {
        var m = lvAmt(it, k), q = document.querySelector('[data-q="' + g[0] + i + '"]'), nm = document.querySelector('[data-n="' + g[0] + i + '"]');
        if (q && q.textContent !== m.a) q.textContent = m.a;
        if (nm && nm.textContent !== m.n) nm.textContent = m.n;
      });
    });
    bSetT("#lvServ", String(n));
    bSetT("#lvServNote", lvServNote());
    lvServSync();
  }
  function lvServSync() {
    document.querySelectorAll(".lv-serv button").forEach(function (b) {
      var off = b.dataset.d < 0 ? LV.n <= 1 : LV.n >= LV_MAX;
      b.setAttribute("aria-disabled", off ? "true" : "false");
    });
  }

  /* ----- opening it: the list, a tab, a recipe, or a supplement's card ----- */
  function lvOpen(rest) {
    var el = $("#lvBody"), r = recipeById(rest), s = r ? null : suppById(rest);
    if (r) {
      window.scrollTo(0, 0);
      el.innerHTML = lvRecipe(r);
      el.style.setProperty("--pcol", "var(--food)");
      bSetT("#viewTitle", r.name);
      document.title = r.name + " | Entrain";
      lvServSync();
      wlKick();
      return;
    }
    if (LV.rid) { lvLeave(); window.scrollTo(0, 0); }
    if (rest && !s && !LV_TABS.some(function (t) { return t[0] === rest; })) { location.replace("#living"); return; }
    el.innerHTML = lvList();
    el.style.setProperty("--pcol", "var(--food)");
    lvTab(s ? "supplements" : rest || store.get("livTab") || "recipes");
    if (s) {
      var card = document.getElementById("lv-" + s.id);
      card.open = true;
      setTimeout(function () {
        try { card.scrollIntoView({ block: "start", behavior: RM ? "auto" : "smooth" }); } catch (e) { card.scrollIntoView(); }
        fdHit(card);
      }, 40);
    }
  }
  // leaving a recipe lets the screen sleep again
  function lvLeave() {
    if (!LV.rid && !LV.cook) return;
    LV.rid = ""; LV.cook = false;
    wlKick();
  }

  /* ----- search: the page, each recipe and each supplement ----- */
  function fdLiving(out) {
    out.push(fdEntry("living", "Healthy living", "Learn · recipes and supplements",
      ["Simple, nourishing recipes such as congee, kitchari and dal, and what the research says about omega-3, coenzyme Q10, creatine, vitamin D, magnesium, B12 and more."], "#living",
      { ic: "leaf", col: "var(--food)", w: 1.1, tags: "healthy living food nutrition diet eating recipes cooking supplements vitamins" }));
    RECIPES.forEach(function (r) {
      out.push(fdEntry("living", r.name, "Recipe · " + lvTime(r) + " · serves " + r.serves,
        [r.sub, r.why, r.ing.concat(r.serve || []).map(function (it) { return Array.isArray(it[2]) ? it[2][0] : it[2]; }).join(", ")], "#living/" + r.id,
        { ic: "bowl", col: "var(--food)", w: 1.1, alias: r.also, tags: "recipe cook food " + r.tags.join(" ") }));
    });
    SUPPS.concat(SUPPS_MORE).forEach(function (s) {
      var b = lvBest(s);
      out.push(fdEntry("living", s.name, "Supplement · " + (s.uses ? "best evidence: " + b[1].toLowerCase() : b[1]),
        s.uses ? [s.lead].concat(s.uses.map(function (u) { return u[1] + ": " + u[2]; }), [s.amount, s.care.join(" ")]) : [s.text, s.care], "#living/" + s.id,
        { ic: "pill", col: "var(--food)", w: 1.1, alias: s.alias || "", tags: "supplement " + s.tags }));
    });
  }

  function lvInit() {
    var body = $("#lvBody");
    body.addEventListener("click", function (e) {
      var t = e.target.closest("[data-tab]");
      if (t) {
        lvTab(t.dataset.tab);
        try { history.replaceState(null, "", "#living/" + t.dataset.tab); } catch (x) {}
        return;
      }
      var d = e.target.closest(".lv-serv button");
      if (d) { if (d.getAttribute("aria-disabled") !== "true") lvServ(+d.dataset.d); }
    });
    body.addEventListener("keydown", function (e) {
      var t = e.target.closest("[data-tab]"), dir = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
      if (!t || !dir) return;
      e.preventDefault();
      var i = LV_TABS.map(function (x) { return x[0]; }).indexOf(t.dataset.tab), nx = LV_TABS[(i + dir + LV_TABS.length) % LV_TABS.length][0];
      lvTab(nx, true);
      try { history.replaceState(null, "", "#living/" + nx); } catch (x) {}
    });
    body.addEventListener("change", function (e) {
      if (e.target.id === "lvWake") { LV.cook = e.target.checked; wlKick(); return; }
      var li = e.target.closest(".lv-ing li, .lv-steps li");
      if (li) li.classList.toggle("done", e.target.checked);
    });
  }
