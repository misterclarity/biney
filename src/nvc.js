
  /* --------------------- nonviolent communication, turned inward ---------------------
     Self-paced writing steps (k: "write") through Marshall Rosenberg's four parts: what
     happened (without evaluation), what you feel, what you need, and what you'd like to
     ask for. Judgments, labels and "shoulds" are read two ways: as signs of needs that
     aren't being met, and as rules you may have absorbed without choosing them, so one
     gets questioned. The word lists and the gentle checks are Entrain's own. Everything
     written stays on this device.
  ------------------------------------------------------------------------------ */
  /* The feelings wheel: eleven families going round from the pleasant to the painful,
     so high-energy anger sits next to high-energy joy and the quiet feelings sit together
     at the bottom. Picking the exact word, not just "bad", is part of the practice. */
  var NVC_WHEEL = [
    { n: "Joyful", c: "#f6c453", w: ["happy", "glad", "excited", "delighted", "playful", "proud", "cheerful", "energetic"] },
    { n: "Curious", c: "#93d99a", w: ["curious", "interested", "intrigued", "surprised", "amazed", "eager", "inspired", "hopeful"] },
    { n: "Loving", c: "#f3a0c6", w: ["tender", "warm", "affectionate", "grateful", "moved", "compassionate", "trusting", "close"] },
    { n: "Peaceful", c: "#62d6c6", w: ["calm", "relaxed", "content", "relieved", "comfortable", "rested", "serene", "satisfied"] },
    { n: "Tired", c: "#9fb6cc", w: ["tired", "exhausted", "overwhelmed", "drained", "worn out", "sleepy", "depleted", "flat"] },
    { n: "Numb", c: "#9196bd", w: ["numb", "detached", "distant", "withdrawn", "bored", "indifferent", "empty", "shut down"] },
    { n: "Sad", c: "#73a9f2", w: ["sad", "hurt", "disappointed", "lonely", "discouraged", "heartbroken", "hopeless", "grieving"] },
    { n: "Ashamed", c: "#dcaa7d", w: ["ashamed", "embarrassed", "guilty", "regretful", "awkward", "exposed", "self-conscious", "sheepish"] },
    { n: "Confused", c: "#cfc06a", w: ["confused", "torn", "unsure", "restless", "ambivalent", "lost", "puzzled", "hesitant"] },
    { n: "Afraid", c: "#bb98f2", w: ["scared", "anxious", "worried", "nervous", "tense", "uneasy", "vulnerable", "panicky"] },
    { n: "Angry", c: "#f27b7e", w: ["angry", "annoyed", "irritated", "frustrated", "resentful", "furious", "impatient", "bitter"] }
  ];
  var NVC_FEEL = NVC_WHEEL.map(function (f) { return [f.n, f.w]; });
  var NVC_NEED = [
    ["Connection", ["acceptance", "appreciation", "belonging", "closeness", "consideration", "empathy", "respect", "support", "trust", "understanding", "warmth", "to be heard", "to be seen", "to matter"]],
    ["Autonomy", ["choice", "freedom", "independence", "space", "self-expression"]],
    ["Meaning", ["contribution", "competence", "growth", "learning", "purpose", "creativity", "effectiveness"]],
    ["Peace", ["ease", "calm", "order", "harmony", "clarity", "predictability"]],
    ["Honesty", ["authenticity", "integrity", "fairness", "transparency"]],
    ["Well-being", ["rest", "safety", "health", "comfort", "movement", "nourishment"]],
    ["Play", ["fun", "humour", "lightness", "beauty", "celebration"]]
  ];
  /* Words that describe what someone did (or what we believe they did) rather than a
     feeling, with feelings that are often underneath. */
  var NVC_FAUX = {
    abandoned: ["lonely", "scared", "hurt"], attacked: ["scared", "angry"], betrayed: ["hurt", "angry", "disappointed"],
    blamed: ["hurt", "tense"], bullied: ["scared", "angry"], cheated: ["angry", "disappointed"], controlled: ["frustrated", "tense"],
    criticised: ["hurt", "embarrassed"], criticized: ["hurt", "embarrassed"], disrespected: ["angry", "hurt"], excluded: ["lonely", "hurt"],
    humiliated: ["ashamed", "hurt", "angry"], ignored: ["lonely", "hurt", "sad"], insulted: ["angry", "hurt"], interrupted: ["frustrated", "impatient"],
    invisible: ["lonely", "sad"], judged: ["hurt", "anxious"], "left out": ["lonely", "sad"], "let down": ["disappointed", "sad"],
    manipulated: ["angry", "uneasy", "confused"], misunderstood: ["frustrated", "lonely"], neglected: ["lonely", "sad"],
    offended: ["hurt", "irritated"], patronised: ["irritated", "frustrated"], patronized: ["irritated", "frustrated"],
    pressured: ["tense", "anxious"], provoked: ["angry", "irritated"], "put down": ["hurt", "ashamed"], rejected: ["hurt", "sad", "lonely"],
    "taken for granted": ["disappointed", "resentful", "tired"], threatened: ["scared"], trapped: ["anxious", "frustrated"],
    unappreciated: ["sad", "discouraged"], unheard: ["frustrated", "lonely"], unseen: ["lonely", "sad"], unsupported: ["overwhelmed", "discouraged"],
    unwanted: ["lonely", "hurt"], used: ["angry", "hurt"]
  };
  var NVC_ABS = ["always", "never", "every time", "constantly", "all the time", "nobody", "no one", "everyone", "everybody"];
  var NVC_SHOULD = ["should", "shouldn't", "should not", "must", "mustn't", "ought to", "have to", "has to", "had to", "supposed to", "deserve", "deserves", "deserved", "fault"];
  var NVC_LABEL = ["lazy", "selfish", "rude", "stupid", "idiot", "inconsiderate", "careless", "arrogant", "useless", "hopeless", "pathetic", "crazy",
    "weak", "failure", "loser", "mean", "cruel", "toxic", "terrible", "awful", "ridiculous", "disrespectful", "irresponsible", "unfair", "wrong",
    "bad", "boring", "annoying", "impossible", "worthless", "ungrateful", "dramatic", "too much", "pathetic", "incompetent", "clueless"];
  /* What we "have to" do is often driven by pressures that cost joy even when we keep doing it. */
  var NVC_WHY = [["money", 1], ["approval", 1], ["to avoid guilt", 1], ["to avoid shame", 1], ["to avoid punishment", 1], ["duty", 1],
    ["care for someone", 0], ["health", 0], ["connection", 0], ["security", 0], ["contribution", 0], ["integrity", 0], ["growth", 0], ["enjoyment", 0]];

  function nvcNew() { return { obs: "", judg: "", rule: "", feel: [], need: [], oFeel: [], oNeed: [], req: "", have: "", choose: [] }; }
  P.nvc = nvcNew();

  function nvcFind(text, list) {
    var t = " " + (text || "").toLowerCase().replace(/’/g, "'").replace(/[^a-z' ]+/g, " ").replace(/\s+/g, " ") + " ", out = [];
    list.forEach(function (w) { if (t.indexOf(" " + w + " ") >= 0 && out.indexOf(w) < 0) out.push(w); });
    return out;
  }
  function nvcJudgy(text) { return nvcFind(text, NVC_ABS.concat(NVC_SHOULD, NVC_LABEL, Object.keys(NVC_FAUX))); }
  function nvcList(a) {                            // "closeness and to be heard": phrases that start with "to" go last
    a = a.filter(function (x) { return !/^to /.test(x); }).concat(a.filter(function (x) { return /^to /.test(x); }));
    return a.length < 2 ? (a[0] || "") : a.slice(0, -1).join(", ") + " and " + a[a.length - 1];
  }
  function nvcClean(t) { return (t || "").trim().replace(/\s+/g, " ").replace(/[.!?;:,]+$/, ""); }
  function nvcLower(t) { return /^(I|I'm|I've|I'd|I'll)\b/.test(t) ? t : t.charAt(0).toLowerCase() + t.slice(1); }

  /* ----- the steps ----- */
  var W_CAP = 1800;                                  // a writing step waits for you; this is only a backstop
  function Wr(title, o) { return ext({ k: "write", secs: W_CAP, title: title, open: true, lines: [] }, o); }
  function nvcSelfSteps() {
    return [
      G(35, "Arrive", ["Sit comfortably and take a few slow breaths.",
        "Bring to mind a situation that's still alive in you: something someone said or did, a conflict, or something you keep judging yourself for.",
        "You'll write a little at each step. It stays on this device."], { vis: "glow" }),
      Wr("What happened?", { field: "obs", input: "text", check: "eval",
        prompt: "Describe it the way a camera would have recorded it: what was said and done, where and when. Leave your interpretation out for now.",
        ph: "At dinner, she looked at her phone while I was telling her about my day." }),
      Wr("The judgments", { field: "judg", input: "text", check: "should", rows: 5,
        prompt: "Now let the judgments speak, uncensored: about the other person, about yourself, about how things should be.",
        ph: "She never listens. I'm boring. People shouldn't…",
        hint: "In NVC, judgments are clues: each one points at something you need that isn't being met." }),
      Wr("Question one rule", { field: "rule", input: "text", optional: true, ctx: "found", rows: 5,
        prompt: "Many judgments carry rules we absorbed without choosing them: from family, school, work or culture. Pick one and question it. Where did you learn it? Whose voice is it? Who gains when you believe it? What would you feel, or do, if you let it go?",
        ph: "“People should always answer straight away.” I learned it at my first job, where…" }),
      G(25, "Into the body", ["Put the words aside for a moment. Where do you feel this in your body? Tight, heavy, hot, fluttery?",
        "Breathe into that place, and let it be there."], { vis: "glow" }),
      Wr("Feelings", { field: "feel", input: "feel", sets: NVC_FEEL, other: true,
        prompt: "Which feelings are here? Open a family on the wheel and pick the words that fit, as many as you like, or add your own.",
        hint: "Words like “ignored” or “rejected” describe what someone did. If one comes up, look for the feeling underneath it." }),
      Wr("Needs", { field: "need", input: "chips", sets: NVC_NEED, other: true,
        prompt: "What needs are behind those feelings? Pick the ones that matter most.",
        hint: "Needs are universal and don't depend on one person doing one thing. “I need her to put the phone away” is a strategy; the need might be connection, or to be heard." }),
      G(45, "Let it land", [], { vis: "glow", mkLines: function () {
        var f = P.nvc.feel, n = P.nvc.need;
        if (!f.length && !n.length) return [[0, "Notice what you're feeling now, and what matters to you underneath it."], [14, "Stay with that for a few breaths."]];
        return [[0, "Read this to yourself, slowly."],
          [4, "When I think of this, I feel " + nvcList(f.length ? f : ["what I feel"]) + (n.length ? ", because I need " + nvcList(n) : "") + "."],
          [22, "Stay with the need for a few breaths. Notice what changes when the need has a name, rather than the judgment."]];
      } }),
      Wr("The other side", { field: "other", input: "other", optional: true,
        prompt: "If someone else is part of this, what might they have been feeling and needing? It's a guess, and understanding isn't agreeing." }),
      Wr("A request", { field: "req", input: "text", check: "req", optional: true,
        prompt: "What would you like now, from yourself or from someone else? Make it a doable, specific action, phrased as what you want rather than what you don't, and open to a no.",
        ph: "Tonight I'll ask her if we can keep dinner phone-free, and hear what she thinks." }),
      G(30, "Closing", [], { vis: "glow", mkLines: function () {
        return [[0, "Read back what you've written. It's a picture of this moment, not a verdict on anyone."],
          [10, "Change often starts when you accept yourself as you are."]];
      } })
    ];
  }
  function nvcChooseSteps() {
    return [
      G(30, "Arrive", ["Take a slow breath. This practice looks at the things you do because you feel you have to.",
        "Rules like have to, should and must are often absorbed without being chosen. Here you'll check which ones you'd actually choose."], { vis: "glow" }),
      Wr("I have to…", { field: "have", input: "list", rows: 6,
        prompt: "List what you do because you feel you have to, should or must, one per line: at work, at home, for others, for yourself.",
        ph: "Answer every email the same day\nCall my mother every Sunday\nGo to the gym" }),
      Wr("I choose to…", { field: "choose", input: "choose",
        prompt: "For each one, say what you want from doing it. If you would still choose it, it becomes “I choose to… because I want…”. If not, mark it.",
        hint: "If the honest answer is money, approval, or avoiding guilt, shame or punishment, notice it. Those motives tend to cost joy, even when you keep doing the thing." }),
      G(30, "Notice", [], { vis: "glow", mkLines: function () {
        var c = P.nvc.choose.filter(function (x) { return x.choose === true; }).length, r = P.nvc.choose.filter(function (x) { return x.choose === false; }).length;
        return [[0, "Read your list back, saying I choose to instead of I have to."],
          [8, c || r ? "You chose " + c + (c === 1 ? " thing" : " things") + (r ? ", and you'd rather not keep " + r + (r === 1 ? " other" : " others") + " as they are" : "") + "." : "Notice how I choose feels, compared with I have to."],
          [18, "Anything you'd rather stop or change is worth a request, to yourself or to someone else."]];
      } }),
      G(20, "Closing", [], { vis: "glow", mkLines: function () { return [[0, "Change often starts when you accept yourself as you are."]]; } })
    ];
  }

  /* ----- drawing a writing step ----- */
  function nvcChips(field, sets, sel) {
    var cur = sel || P.nvc[field] || [], known = [];
    var h = sets.map(function (g) {
      return '<div class="sw-grp"><span>' + esc(g[0]) + '</span><div class="sw-chips">' + g[1].map(function (w) {
        known.push(w);
        return '<button data-f="' + field + '" data-v="' + esc(w) + '" aria-pressed="' + (cur.indexOf(w) >= 0) + '">' + esc(w) + "</button>";
      }).join("") + "</div></div>";
    }).join("");
    var mine = cur.filter(function (w) { return known.indexOf(w) < 0; });
    if (mine.length) h += '<div class="sw-grp"><span>Yours</span><div class="sw-chips">' + mine.map(function (w) {
      return '<button data-f="' + field + '" data-v="' + esc(w) + '" aria-pressed="true">' + esc(w) + "</button>";
    }).join("") + "</div></div>";
    return h;
  }
  /* ----- the feelings wheel ----- */
  var NV_C = 220;
  function nvPt(r, a) { var t = (a - 90) * Math.PI / 180; return [NV_C + r * Math.cos(t), NV_C + r * Math.sin(t)]; }
  function nvArc(r0, r1, a0, a1) {
    var f = function (p) { return p[0].toFixed(1) + " " + p[1].toFixed(1); }, big = a1 - a0 > 180 ? 1 : 0;
    return "M" + f(nvPt(r1, a0)) + "A" + r1 + " " + r1 + " 0 " + big + " 1 " + f(nvPt(r1, a1)) +
      "L" + f(nvPt(r0, a1)) + "A" + r0 + " " + r0 + " 0 " + big + " 0 " + f(nvPt(r0, a0)) + "Z";
  }
  function nvText(x, y, t, cls, extra) {
    return '<text class="' + cls + '" x="' + x.toFixed(1) + '" y="' + y.toFixed(1) + '"' + (extra || "") + ">" + esc(t) + "</text>";
  }
  /* Radial words read outward on the right half and inward on the left, never upside down. */
  function nvRadial(r, a, t, cls, fill) {
    var p = nvPt(r, a), rot = a - 90;
    if (a > 180) rot -= 180;
    return '<text class="' + cls + '" fill="' + fill + '" transform="translate(' + p[0].toFixed(1) + " " + p[1].toFixed(1) + ") rotate(" + rot.toFixed(1) + ')">' + esc(t) + "</text>";
  }
  function nvcWheel(field) {
    var sel = P.nvc[field], k = P.wheel[field], h = "", n = NVC_WHEEL.length, S = 360 / n;
    if (k < 0) {                                                // every family, its words round the rim
      NVC_WHEEL.forEach(function (f, i) {
        var a0 = i * S, a1 = a0 + S, picked = f.w.filter(function (w) { return sel.indexOf(w) >= 0; }).length, m = nvPt(108, a0 + S / 2);
        h += '<g class="wf" data-fam="' + i + '" role="button" tabindex="0" aria-label="' + f.n + ": " + f.w.length + " feelings" + (picked ? ", " + picked + " chosen" : "") + '">' +
          '<path d="' + nvArc(48, 148, a0 + 0.4, a1 - 0.4) + '" fill="' + f.c + '"/>' +
          nvText(m[0], m[1], f.n, "wf-n") + (picked ? nvText(m[0], m[1] + 15, picked + " \u2713", "wf-c") : "");
        f.w.forEach(function (w, j) {
          var b0 = a0 + j * S / 8, b1 = b0 + S / 8, on = sel.indexOf(w) >= 0;
          h += '<path d="' + nvArc(151, 218, b0 + 0.15, b1 - 0.15) + '" fill="' + f.c + '" fill-opacity="' + (on ? 0.9 : 0.16) + '"/>' +
            nvRadial(184.5, b0 + S / 16, w, "ww-r", on ? "#0b1120" : f.c);
        });
        h += "</g>";
      });
      var cnt = sel.length;
      h += '<circle class="wc-bg" cx="' + NV_C + '" cy="' + NV_C + '" r="45"/>' +
        (cnt ? nvText(NV_C, NV_C - 6, String(cnt), "wc-num") + nvText(NV_C, NV_C + 15, "chosen", "wc-s") : nvText(NV_C, NV_C - 7, "Tap a", "wc-s") + nvText(NV_C, NV_C + 10, "family", "wc-s"));
    } else {                                                    // one family, its words big enough to tap
      var f = NVC_WHEEL[k];
      f.w.forEach(function (w, j) {
        var a0 = j * 45 - 22.5, on = sel.indexOf(w) >= 0, m = nvPt(146, a0 + 22.5);
        var parts = w.length > 12 && /[- ]/.test(w) ? w.replace(/([- ])/, "$1|").split("|") : [w];
        h += '<g class="ww' + (on ? " on" : "") + '" data-wword="' + esc(w) + '" role="button" tabindex="0" aria-pressed="' + on + '" aria-label="' + esc(w) + '">' +
          '<path d="' + nvArc(70, 216, a0 + 0.9, a0 + 44.1) + '" fill="' + f.c + '" fill-opacity="' + (on ? 1 : 0.18) + '" stroke="' + f.c + '" stroke-opacity="' + (on ? 1 : 0.55) + '"/>';
        parts.forEach(function (t, q) {
          h += nvText(m[0], m[1] + (q - (parts.length - 1) / 2) * 17, (on && !q ? "\u2713 " : "") + t.trim(), "ww-n", ' fill="' + (on ? "#0b1120" : f.c) + '"');
        });
        h += "</g>";
      });
      h += '<g class="wc" data-wback="1" role="button" tabindex="0" aria-label="Back to all feelings">' +
        '<circle cx="' + NV_C + '" cy="' + NV_C + '" r="64" fill="' + f.c + '"/>' +
        nvText(NV_C, NV_C - 6, f.n, "wc-fam") + nvText(NV_C, NV_C + 16, "\u2039 all feelings", "wc-back") + "</g>";
    }
    return '<svg class="nv-wheel' + (P.wheelAnim ? " zoom" : "") + '" viewBox="0 0 440 440" role="group" aria-label="Feelings wheel">' + h + "</svg>";
  }
  function nvcChosen(field) {
    var sel = P.nvc[field];
    return '<div class="sw-chosen"><span>Chosen</span>' + (sel.length ? '<div class="sw-chips">' + sel.map(function (w) {
      var fam = NVC_WHEEL.filter(function (f) { return f.w.indexOf(w) >= 0; })[0];
      return '<button class="sw-un" data-unpick="' + esc(w) + '" data-uf="' + field + '" aria-label="Remove ' + esc(w) + '"' + (fam ? ' style="--fc:' + fam.c + '"' : "") + ">" +
        esc(w) + ' <i aria-hidden="true">\u00d7</i></button>';
    }).join("") + "</div>" : "<em>Nothing yet</em>") + "</div>";
  }
  /* Wheel or list: the same words, your choice, remembered. */
  function nvcFeelArea(field) {
    var wheel = (store.get("nvcView") || "wheel") === "wheel";
    return '<div class="mini-seg sw-view" role="group" aria-label="Show feelings as"><button data-view="wheel" aria-pressed="' + wheel + '">Wheel</button>' +
      '<button data-view="list" aria-pressed="' + !wheel + '">List</button></div>' +
      (wheel ? '<div class="sw-wheel">' + nvcWheel(field) + "</div>" + nvcChosen(field)
        : '<div class="sw-sets" data-f="' + field + '">' + nvcChips(field, NVC_FEEL) + "</div>");
  }
  function nvcFeelRedraw(field, focus) {
    var el = $("#sWrite").querySelector('.sw-feel[data-f="' + field + '"]');
    if (!el) return;
    el.innerHTML = nvcFeelArea(field);
    P.wheelAnim = false;
    if (focus) { var t = el.querySelector(focus); if (t) t.focus(); }
  }
  function nvcRender(s) {
    var d = P.nvc, h = '<h3 class="sw-h">' + esc(s.title) + '</h3><p class="sw-p">' + esc(s.prompt) + "</p>";
    P.wheel = { feel: -1, oFeel: -1 }; P.wheelAnim = false;
    if (s.ctx === "found") {
      var f = nvcJudgy(d.judg);
      h += f.length ? '<div class="sw-found"><span>From your judgments</span><div class="sw-chips">' + f.map(function (w) {
        return '<button data-pick="' + esc(w) + '">' + esc(w) + "</button>";
      }).join("") + "</div></div>" : "";
    }
    if (s.input === "text" || s.input === "list") {
      h += '<textarea class="sw-ta" data-f="' + s.field + '" rows="' + (s.rows || 4) + '" placeholder="' + esc(s.ph || "") + '" aria-label="' + esc(s.title) + '">' + esc(d[s.field] || "") + "</textarea>";
    } else if (s.input === "feel") {
      h += '<div class="sw-feel" data-f="feel">' + nvcFeelArea("feel") + "</div>";
      if (s.other) h += '<input class="sw-other" data-f="feel" placeholder="Add your own, then press Enter" aria-label="Add your own" enterkeyhint="done">';
    } else if (s.input === "chips") {
      h += '<div class="sw-sets" data-f="' + s.field + '">' + nvcChips(s.field, s.sets) + "</div>";
      if (s.other) h += '<input class="sw-other" data-f="' + s.field + '" placeholder="Add your own, then press Enter" aria-label="Add your own" enterkeyhint="done">';
    } else if (s.input === "other") {
      h += '<p class="sw-sub">They might have felt…</p><div class="sw-feel" data-f="oFeel">' + nvcFeelArea("oFeel") + "</div>" +
        '<p class="sw-sub">…and needed</p><div class="sw-sets" data-f="oNeed">' + nvcChips("oNeed", NVC_NEED) + "</div>";
    } else if (s.input === "choose") {
      h += nvcChooseCards();
    }
    h += '<p class="sw-note" id="swNote" aria-live="polite"></p>';
    if (s.hint) h += '<p class="sw-hint">' + esc(s.hint) + "</p>";
    h += '<div class="sw-act">' + (s.optional ? '<button class="btn small" data-sw="skip">Skip</button>' : "") +
      '<button class="btn primary" data-sw="next">Continue</button></div>';
    return h;
  }
  function nvcItems() {
    return (P.nvc.have || "").split(/\n+/).map(nvcClean).filter(function (x) { return x; }).slice(0, 8);
  }
  function nvcChooseCards() {
    var items = nvcItems(), old = P.nvc.choose;
    P.nvc.choose = items.map(function (it) {
      var o = old.filter(function (x) { return x.item === it; })[0];
      return o || { item: it, choose: null, why: "", tags: [] };
    });
    if (!items.length) return '<p class="sw-empty">Nothing listed yet. Go back a step and add a few things you feel you have to do.</p>';
    return '<ol class="sw-cards">' + P.nvc.choose.map(function (c, i) {
      return '<li class="sw-card" data-i="' + i + '"><p class="sw-have">I have to <b>' + esc(nvcLower(c.item)) + "</b></p>" +
        '<div class="mini-seg" role="group" aria-label="Choose or not"><button data-ch="1" aria-pressed="' + (c.choose === true) + '">I choose to</button>' +
        '<button data-ch="0" aria-pressed="' + (c.choose === false) + '">I\'d rather not</button></div>' +
        '<div class="sw-chips sw-why">' + NVC_WHY.map(function (w) {
          return '<button data-why="' + esc(w[0]) + '" class="' + (w[1] ? "press" : "") + '" aria-pressed="' + (c.tags.indexOf(w[0]) >= 0) + '">' + esc(w[0]) + "</button>";
        }).join("") + "</div>" +
        '<input class="sw-in" data-i="' + i + '" placeholder="because I want…" value="' + esc(c.why) + '" aria-label="Because I want"></li>';
    }).join("") + "</ol>";
  }

  /* ----- the gentle checks under each field ----- */
  function nvcCheck(s) {
    var d = P.nvc, el = $("#swNote"), msg = "";
    if (!el) return;
    if (s.check === "eval") {
      var f = nvcJudgy(d.obs);
      if (f.length) msg = "These words may carry an evaluation: <b>" + f.map(esc).join("</b>, <b>") + "</b>. Could you say what you saw or heard instead?";
      else if (d.obs.trim().length > 12) msg = "Reads like an observation.";
    } else if (s.check === "should") {
      var g = nvcJudgy(d.judg);
      if (g.length) msg = "Shoulds, absolutes and labels you used: <b>" + g.map(esc).join("</b>, <b>") + "</b>. You'll question one of them next.";
    } else if (s.check === "req") {
      var r = d.req.toLowerCase();
      if (/\b(don'?t|do not|stop|never|quit)\b/.test(r)) msg = "Requests tend to land better as what you do want. What would you like instead?";
      else if (nvcFind(r, NVC_SHOULD).length) msg = "That sounds like a demand. Would a no be okay? If not, look for the need behind it.";
      else if (r.trim().length > 12) msg = "If it's doable and specific, it's ready.";
    } else if (s.input === "feel") {
      var faux = d.feel.filter(function (w) { return NVC_FAUX[w]; });
      if (faux.length) {
        var w0 = faux[faux.length - 1];
        msg = "“" + esc(w0) + "” describes what someone did. Underneath it, you might feel " +
          NVC_FAUX[w0].map(function (x) { return '<button class="sw-add" data-add="' + x + '">' + x + "</button>"; }).join(" ") + ".";
      }
    } else if (s.input === "choose") {
      var pr = d.choose.filter(function (c) { return c.tags.some(function (t) { return NVC_WHY.some(function (w) { return w[0] === t && w[1]; }); }); }).length;
      if (pr) msg = pr + (pr === 1 ? " thing is" : " things are") + " driven at least partly by pressure. Is there another reason you'd still choose it?";
    }
    el.innerHTML = msg;
  }
  function nvcAddOwn(field, raw) {
    var arr = P.nvc[field];
    raw.split(/[,;]+/).map(function (x) { return nvcClean(x).toLowerCase(); }).filter(function (x) { return x && x.length < 40; }).forEach(function (x) {
      if (arr.indexOf(x) < 0) arr.push(x);
    });
  }

  /* ----- what you made of it ----- */
  function nvcSummary(kind) {
    if (kind === "choose") {
      var lines = P.nvc.choose.filter(function (c) { return c.choose !== null || c.why || c.tags.length; }).map(function (c) {
        var why = nvcClean(c.why) || (c.tags.length ? c.tags.join(", ") : "");
        return c.choose === false ? "I'd rather not " + nvcLower(c.item) + "." :
          "I choose to " + nvcLower(c.item) + (why ? " because I want " + nvcLower(why) : "") + ".";
      });
      return lines.length ? { kind: kind, lines: lines, text: lines.join("\n") } : null;
    }
    var o = nvcClean(P.nvc.obs), f = P.nvc.feel, n = P.nvc.need, s = "";
    if (o) s += (/^when\b/i.test(o) ? o : "When " + nvcLower(o)) + ", ";
    if (f.length) s += (s ? "I feel " : "I feel ") + nvcList(f);
    if (n.length) s += (f.length ? " because I need " : (s ? "I need " : "I need ")) + nvcList(n);
    s = s.replace(/,\s*$/, "");
    if (s) s = s.charAt(0).toUpperCase() + s.slice(1) + ".";
    var out = { kind: kind, sentence: s, req: nvcClean(P.nvc.req), rule: nvcClean(P.nvc.rule),
      other: P.nvc.oFeel.length || P.nvc.oNeed.length ? "They might have felt " + (nvcList(P.nvc.oFeel) || "something") + (P.nvc.oNeed.length ? " and needed " + nvcList(P.nvc.oNeed) : "") + "." : "" };
    if (!s && !out.req && !out.rule) return null;
    out.text = [s, out.req ? "Request: " + out.req + "." : "", out.rule ? "Rule I questioned: " + out.rule : "", out.other].filter(function (x) { return x; }).join("\n");
    return out;
  }
  function nvcCard(r) {
    var h = '<div class="sd-nvc"><h3>' + (r.kind === "choose" ? "Your choices" : "Your reflection") + "</h3>";
    if (r.kind === "choose") h += '<ul class="nv-list">' + r.lines.map(function (l) { return "<li>" + esc(l) + "</li>"; }).join("") + "</ul>";
    else {
      if (r.sentence) h += '<p class="nv-s">' + esc(r.sentence) + "</p>";
      h += "<dl>" + (r.req ? "<dt>Request</dt><dd>" + esc(r.req) + "</dd>" : "") + (r.rule ? "<dt>A rule you questioned</dt><dd>" + esc(r.rule) + "</dd>" : "") +
        (r.other ? "<dt>The other side</dt><dd>" + esc(r.other) + "</dd>" : "") + "</dl>";
    }
    return h + '<div class="nv-act"><button class="btn small" id="nvCopy" data-text="' + esc(r.text) + '">Copy</button><span>' +
      (P.opt.nvcSave ? "Saved on this device only. Past reflections are listed on this practice's page." : "Not saved: keeping a copy is off.") + "</span></div></div>";
  }

  /* ----- the journal: on this device only ----- */
  function nvcLog() {
    try { var l = JSON.parse(store.get("nvcLog") || "[]"); return Array.isArray(l) ? l : []; } catch (e) { return []; }
  }
  function nvcKeep(r) {
    var l = nvcLog();
    l.push({ at: Date.now(), kind: r.kind, text: r.text });
    while (l.length > 60) l.shift();
    store.set("nvcLog", JSON.stringify(l));
  }
  function nvcJournal(d) {
    var kind = d.id === "nvc-choose" ? "choose" : "self", items = nvcLog().map(function (e, i) { e.i = i; return e; }).filter(function (e) { return e.kind === kind; }).reverse();
    if (!items.length) return "";
    return '<details class="si-journal"><summary>Your past ' + (kind === "choose" ? "lists" : "reflections") + " (" + items.length + ")</summary><ol>" +
      items.map(function (e) {
        return '<li><time>' + new Date(e.at).toLocaleDateString(undefined, { day: "numeric", month: "short" }) + "</time><p>" + esc(e.text).replace(/\n/g, "<br>") + "</p>" +
          '<button class="nv-del" data-nvdel="' + e.i + '" aria-label="Delete this one"><svg class="i" aria-hidden="true"><use href="#i-x"/></svg></button></li>';
      }).join("") + '</ol><button class="btn small" data-nvdel="all">Delete all</button></details>';
  }

  /* ----- an unfinished reflection survives a reload, an update or the browser closing the tab -----
     With "Keep a copy" on, what you've written so far is kept on this device as you go, one draft
     per practice, and removed when the practice ends. Opening the practice again offers to carry on
     at the step you were on, with the time you'd already spent. Nothing is kept until you write. */
  function nvcDraftKey(id) { return "nvcDraft." + id; }
  function nvcDraftGet(id) {
    try { var d = JSON.parse(store.get(nvcDraftKey(id)) || "null"); return d && d.id === id && d.nvc ? d : null; } catch (e) { return null; }
  }
  function nvcDraftClear(id) { clearTimeout(P.draftT); try { localStorage.removeItem("entrain." + nvcDraftKey(id)); } catch (e) {} }
  function nvcHasWords(n) {
    return !!(n.obs || n.judg || n.rule || n.req || n.have || n.feel.length || n.need.length || n.oFeel.length || n.oNeed.length);
  }
  function nvcDraftSave(now) {
    clearTimeout(P.draftT);
    if (!now) { P.draftT = setTimeout(function () { nvcDraftSave(true); }, 400); return; }
    if (!pBusy() || !P.def || !P.def.reflect || !P.opt.nvcSave || !(P.draftLive || nvcHasWords(P.nvc))) return;
    P.draftLive = true;
    store.set(nvcDraftKey(P.def.id), JSON.stringify({ id: P.def.id, at: Date.now(), idx: P.idx, T: Math.round(pT()),
      titles: P.steps.map(function (s) { return s.title; }), secs: P.steps.map(function (s) { return s.secs; }), nvc: P.nvc }));
  }
  /* Called by pStart once the plan is built, before the first tick. */
  function nvcDraftResume(d) {
    var n = nvcNew(), k;
    for (k in n) if (d.nvc[k] !== undefined && Array.isArray(d.nvc[k]) === Array.isArray(n[k]) && typeof d.nvc[k] === typeof n[k]) n[k] = d.nvc[k];
    P.nvc = n; P.draftLive = true;
    var same = Array.isArray(d.titles) && d.titles.length === P.steps.length && d.titles.every(function (t, i) { return t === P.steps[i].title; });
    if (!same) return;                                 // the practice has changed since: keep the words, start at the top
    var at = 0;
    P.steps.forEach(function (s, i) {
      var v = +d.secs[i];
      if (s.open && v >= 0 && v < s.secs) { s.secs0 = s.secs; s.secs = v; }   // the steps you'd finished keep the time they took
      s.at = at; at += s.secs;
    });
    P.total = at;
    var i = Math.max(0, Math.min(P.steps.length - 1, d.idx | 0)), s = P.steps[i];
    P.t0 = bNow() - Math.max(s.at, Math.min(+d.T || 0, s.at + s.secs - 1));
    P.idx = -1;
    pEnter(i);
  }
  function nvcWhen(at) {
    return new Date(at).toLocaleString(undefined, { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
  }
  function nvcDraftStrip(d) {
    var dr = nvcDraftGet(d.id);
    if (!dr) return "";
    var where = Array.isArray(dr.titles) && dr.titles[dr.idx] ? ", at “" + esc(dr.titles[dr.idx]) + "”" : "";
    return '<div class="si-draft"><p><b>You have an unfinished reflection</b> from ' + esc(nvcWhen(dr.at)) + where + ".</p>" +
      '<div class="si-draft-act"><button class="btn primary small" id="sDraftGo">Continue it</button><button class="btn small" id="sDraftDel">Discard</button></div></div>';
  }

  function nvcInit() {
    var host = $("#sWrite"), cur = function () { var s = P.steps[P.idx]; return s && s.k === "write" ? s : null; };
    host.addEventListener("input", function (e) {
      var s = cur(), t = e.target;
      if (!s) return;
      if (t.classList.contains("sw-ta")) { P.nvc[t.dataset.f] = t.value; nvcCheck(s); }
      else if (t.classList.contains("sw-in")) { P.nvc.choose[+t.dataset.i].why = t.value; }
      nvcDraftSave();
    });
    host.addEventListener("keydown", function (e) {
      var t = e.target, s = cur();
      if (!s || !t.classList.contains("sw-other") || e.key !== "Enter") return;
      e.preventDefault();
      if (!t.value.trim()) return;
      nvcAddOwn(t.dataset.f, t.value);
      t.value = "";
      if (t.dataset.f === "feel" || t.dataset.f === "oFeel") nvcFeelRedraw(t.dataset.f);
      else host.querySelector('.sw-sets[data-f="' + t.dataset.f + '"]').innerHTML = nvcChips(t.dataset.f, s.sets);
      nvcCheck(s);
      nvcDraftSave();
    });
    host.addEventListener("keydown", function (e) {           // the wheel's parts work from the keyboard too
      var g = e.target.closest && e.target.closest('[role="button"][data-fam], [role="button"][data-wword], [role="button"][data-wback]');
      if (!g || (e.key !== "Enter" && e.key !== " ")) return;
      e.preventDefault();
      g.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    host.addEventListener("click", function (e) {
      var s = cur(), w = e.target.closest("[data-fam], [data-wword], [data-wback]");
      if (s && w) {
        var fld = w.closest(".sw-feel").dataset.f, kb = e.detail === 0;   // detail 0: Enter or Space
        if (w.dataset.fam !== undefined) { P.wheel[fld] = +w.dataset.fam; P.wheelAnim = true; nvcFeelRedraw(fld, kb ? '[data-wback]' : null); }
        else if (w.dataset.wback) { var was = P.wheel[fld]; P.wheel[fld] = -1; P.wheelAnim = true; nvcFeelRedraw(fld, kb ? '[data-fam="' + was + '"]' : null); }
        else {
          var arr0 = P.nvc[fld], v0 = w.dataset.wword, k0 = arr0.indexOf(v0);
          if (k0 >= 0) arr0.splice(k0, 1); else arr0.push(v0);
          nvcFeelRedraw(fld, kb ? '[data-wword="' + v0 + '"]' : null);
        }
        nvcCheck(s);
        nvcDraftSave();
        return;
      }
      var b = e.target.closest("button");
      if (!s || !b) return;
      if (b.dataset.sw) {                          // Continue or Skip: carry on, even if you'd paused
        if (P.state === "paused") pResume();
        if (P.state === "running") pAdvance();
        return;
      }
      if (b.dataset.view) {
        store.set("nvcView", b.dataset.view);
        nvcFeelRedraw("feel"); nvcFeelRedraw("oFeel");
        return;
      }
      if (b.dataset.unpick) {
        var arr1 = P.nvc[b.dataset.uf], k1 = arr1.indexOf(b.dataset.unpick);
        if (k1 >= 0) arr1.splice(k1, 1);
        nvcFeelRedraw(b.dataset.uf);
        nvcCheck(s);
        nvcDraftSave();
        return;
      }
      if (b.dataset.f && b.dataset.v !== undefined) {
        var arr = P.nvc[b.dataset.f], v = b.dataset.v, k = arr.indexOf(v);
        if (k >= 0) arr.splice(k, 1); else arr.push(v);
        b.setAttribute("aria-pressed", String(k < 0));
      } else if (b.dataset.add) {                  // a feeling under "ignored" takes its place
        var fl = P.nvc.feel, fx = fl.filter(function (w) { return NVC_FAUX[w] && NVC_FAUX[w].indexOf(b.dataset.add) >= 0; });
        if (fx.length) fl.splice(fl.indexOf(fx[fx.length - 1]), 1, b.dataset.add);
        else if (fl.indexOf(b.dataset.add) < 0) fl.push(b.dataset.add);
        var dup = fl.indexOf(b.dataset.add);
        P.nvc.feel = fl.filter(function (w, k) { return w !== b.dataset.add || k === dup; });
        nvcFeelRedraw("feel");
      } else if (b.dataset.pick) {
        var ta = host.querySelector(".sw-ta");
        ta.value = "“" + b.dataset.pick + "”: " + ta.value.replace(/^“[^”]*”: /, "");
        P.nvc.rule = ta.value; ta.focus();
      } else if (b.dataset.ch !== undefined || b.dataset.why) {
        var c = P.nvc.choose[+b.closest(".sw-card").dataset.i];
        if (b.dataset.ch !== undefined) {
          c.choose = c.choose === (b.dataset.ch === "1") ? null : b.dataset.ch === "1";
          var bs = b.parentNode.querySelectorAll("button");
          for (var i = 0; i < bs.length; i++) bs[i].setAttribute("aria-pressed", String(c.choose === (bs[i].dataset.ch === "1")));
        } else {
          var j = c.tags.indexOf(b.dataset.why);
          if (j >= 0) c.tags.splice(j, 1); else c.tags.push(b.dataset.why);
          b.setAttribute("aria-pressed", String(j < 0));
        }
      }
      nvcCheck(s);
      nvcDraftSave();
    });
    document.addEventListener("click", function (e) {
      var b = e.target.closest && e.target.closest("[data-nvdel], #nvCopy");
      if (!b) return;
      if (b.id === "nvCopy") { nvcCopy(b.dataset.text); return; }
      var l = nvcLog();
      if (b.dataset.nvdel === "all") {
        var kind = P.view && P.view.id === "nvc-choose" ? "choose" : "self";
        l = l.filter(function (x) { return x.kind !== kind; });
      } else l.splice(+b.dataset.nvdel, 1);
      store.set("nvcLog", JSON.stringify(l));
      if (P.view) pIntro(P.view.id);
    });
    // leaving the app or reloading it saves the draft at once, rather than after the usual short wait
    document.addEventListener("visibilitychange", function () { if (document.hidden) nvcDraftSave(true); });
    window.addEventListener("pagehide", function () { nvcDraftSave(true); });
    // a reflection left unfinished last time: say so once the app has opened
    var left = PRACTICES.filter(function (d) { return d.reflect; }).map(function (d) { return nvcDraftGet(d.id); })
      .filter(function (x) { return x; }).sort(function (a, b) { return b.at - a.at; })[0];
    if (left) setTimeout(function () {
      if (pBusy() || location.hash === "#practice/" + left.id) return;
      toast("You have an unfinished reflection from " + nvcWhen(left.at) + ".", { action: "Open", onAct: function () { location.hash = "practice/" + left.id; } });
    }, 1200);
  }
  /* The clipboard API can be refused (a preview frame, an insecure page); the older copy command
     often still works, and if neither does, say so rather than fail silently. */
  function nvcCopy(txt) {
    var said = function (ok) {
      bSetT("#nvCopy", ok ? "Copied" : "Couldn't copy");
      if (!ok) toast("This browser didn't allow copying. Select the text above and copy it instead.");
    };
    var old = function () {
      var ta = document.createElement("textarea"), ok = false;
      ta.value = txt; ta.setAttribute("readonly", ""); ta.style.cssText = "position:fixed;top:0;left:0;opacity:0";
      document.body.appendChild(ta); ta.select();
      try { ok = document.execCommand("copy"); } catch (e) {}
      document.body.removeChild(ta);
      said(ok);
    };
    try { navigator.clipboard.writeText(txt).then(function () { said(true); }, old); } catch (e) { old(); }
  }
