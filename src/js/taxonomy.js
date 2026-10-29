  /* ------------------------------ categories ------------------------------
     Every practice, breathing pattern and track has one goal, what it's for, so it has one home
     in the library. A few also carry "also good for" goals, shown as such. How it works (the
     method), how long it takes, the posture and what it needs are separate facets for filtering.
     Within each goal the lists below are in the order its section shows them.
  -------------------------------------------------------------------------- */

  var GOALS = [
    { id: "sleep", name: "Sleep", lede: "Winding down and falling asleep at night.", icon: "moon" },
    { id: "calm", name: "Calm", lede: "Bringing stress or anxiety down, now.", icon: "breathe" },
    { id: "focus", name: "Focus", lede: "Concentrating on a task, or training attention.", icon: "target" },
    { id: "energy", name: "Energy", lede: "Waking up the body and mind.", icon: "bolt" },
    { id: "recover", name: "Recover", lede: "Resting in the day, or recovering after training.", icon: "recover" },
    { id: "reflect", name: "Reflect", lede: "Feelings, needs and kindness, towards yourself and others.", icon: "nvc" }
  ];
  // each goal's colour, on Today's tiles and in History
  var GOAL_COL = { sleep: "#a78bfa", calm: "#5eead4", focus: "#fbbf24", energy: "#fb923c", recover: "#7dd3fc", reflect: "#f9a8d4" };
  var METHODS = [["breath", "Breathing", "breathe"], ["meditate", "Meditation", "practice"], ["move", "Movement", "move"],
    ["relax", "Relaxation", "moon"], ["sound", "Sound", "sounds"], ["write", "Writing", "nvc"], ["program", "Programme", "spark"]];
  var POSTURES = [["sit", "Sitting"], ["lie", "Lying"], ["stand", "Standing"], ["walk", "Walking"]];
  var NEEDS = [["none", "Just the phone"], ["phones", "Headphones"], ["sensor", "Heart sensor"], ["space", "Room to move"]];

  // [item, method, postures]: practices by id, b: a breathing pattern, t: a track, x: a tool
  var CATS = {
    sleep: [["sleep-descent", "program", "lie"], ["b:478", "breath", "sit lie"], ["shuffle", "relax", "lie"],
      ["evening-stretch", "move", "lie"], ["evening-floor", "move", "lie"], ["t:sleep-descent", "sound", "lie"]],
    calm: [["calm-reset", "program", "sit walk"], ["b:sigh", "breath", "sit"], ["b:resonance", "breath", "sit"],
      ["coherence", "program", "sit lie walk"], ["conversation", "program", "sit walk"], ["call", "program", "sit"], ["after-talk", "program", "sit walk"], ["grounding", "meditate", "sit walk"], ["tapping", "relax", "sit"],
      ["body-scan", "meditate", "lie"], ["pmr", "relax", "lie"], ["autogenic", "relax", "sit lie"], ["reframe", "relax", "sit walk"], ["nadi", "breath", "sit"], ["bhramari", "breath", "sit"],
      ["ujjayi", "breath", "sit"], ["dirga", "breath", "sit lie"], ["b:exhale", "breath", "sit"], ["walking", "meditate", "walk"],
      ["heart-led", "program", "sit lie"], ["t:alpha-stress", "sound", "sit"], ["t:theta-meditation", "sound", "sit"],
      ["t:preop-calm", "sound", "lie"]],
    focus: [["focus-primer", "program", "sit"], ["anapana", "meditate", "sit"], ["b:box", "breath", "sit"],
      ["x:prime", "sound", "sit"], ["t:deep-work", "sound", "sit"], ["t:sustained-24", "sound", "sit"],
      ["t:vigilance-16", "sound", "sit"], ["t:gamma-40", "sound", "sit"], ["t:gamma-memory", "sound", "sit"],
      ["t:creative-reverie", "sound", "sit"]],
    energy: [["morning-yoga", "move", "stand"], ["standing-flow", "move", "stand"], ["morning-stretch", "move", "stand"],
      ["standing-reset", "move", "stand"], ["balance-yoga", "move", "stand"], ["kapalabhati", "breath", "sit"],
      ["wim-hof", "breath", "sit lie"], ["solo-capoeira", "move", "stand"]],
    recover: [["recovery", "program", "sit walk"], ["nsdr", "program", "lie"], ["power-nap", "relax", "lie"],
      ["back-hips", "move", "lie"], ["t:parasympathetic", "sound", "sit"]],
    reflect: [["nvc-self", "write", "sit"], ["nvc-prep", "write", "sit"], ["nvc-choose", "write", "sit"], ["self-compassion", "meditate", "sit"],
      ["metta", "meditate", "sit walk"], ["gratitude", "meditate", "sit lie walk"]],
    tinnitus: [["t:tinnitus-notch", "sound", "sit"]]        // for a condition rather than a goal: a section of its own
  };
  var ALSO = {
    "body-scan": ["sleep"], pmr: ["sleep"], bhramari: ["sleep"], "b:exhale": ["sleep"], nsdr: ["sleep"],
    anapana: ["calm"], "b:box": ["calm"], "self-compassion": ["calm"], metta: ["calm"], gratitude: ["calm"], "back-hips": ["calm"],
    "standing-reset": ["focus"], "balance-yoga": ["focus"], call: ["focus"], "after-talk": ["reflect"], "nvc-prep": ["calm"], autogenic: ["sleep"], reframe: ["focus"]
  };
  var PATTERN_NAMES = { resonance: "Resonance 5.5", sigh: "Cyclic sigh", exhale: "Long exhale", box: "Box 4-4-4-4", "478": "4-7-8" };
  var TOOLS = {
    prime: { name: "Custom primer", href: "#prime", icon: "bolt", strength: 2,
      blurb: "Pick a beat and 5 to 20 minutes of priming. When the bell rings, start work with the beat quieter, pink noise, or silence." },
    beats: { name: "Beat builder", href: "#builder", icon: "sliders", strength: 2,
      blurb: "Pick any beat, carrier tone and session length, and play it." },
    routine: { name: "Routine builder", href: "#yoga", icon: "plus", strength: 2 }
  };

  var CAT = {};                              // item key → { goal, also, method, posture, rank }
  (function () {
    for (var g in CATS) CATS[g].forEach(function (r, i) {
      CAT[r[0]] = { goal: g, also: ALSO[r[0]] || [], method: r[1], posture: r[2].split(" "), rank: i };
    });
    var put = function (o, key) { var c = CAT[key]; if (c) for (var k in c) o[k] = c[k]; };
    PRACTICES.forEach(function (d) { put(d, d.id); });
    BREATHS.forEach(function (b) { put(b, "b:" + b.id); });
    TRACKS.forEach(function (t) { put(t, "t:" + t.id); });
  })();

  function goalOf(id) { for (var i = 0; i < GOALS.length; i++) if (GOALS[i].id === id) return GOALS[i]; return null; }
  function methodName(id) { for (var i = 0; i < METHODS.length; i++) if (METHODS[i][0] === id) return METHODS[i][1]; return ""; }
  function methodIcon(id) { for (var i = 0; i < METHODS.length; i++) if (METHODS[i][0] === id) return METHODS[i][2]; return "spark"; }
  function postureName(id) { for (var i = 0; i < POSTURES.length; i++) if (POSTURES[i][0] === id) return POSTURES[i][1]; return ""; }
  // a practice meant for falling asleep, or good for it: no tapping round at its end
  function pSleepy(d) { return d.goal === "sleep" || (d.also || []).indexOf("sleep") >= 0; }
