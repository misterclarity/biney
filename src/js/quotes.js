
  /* ------------------------------- quotes -------------------------------
     A line for the day on Today, and one to close each practice. The attributed lines
     come from public-domain translations: George Long's Marcus Aurelius and Epictetus,
     Richard Gummere's Seneca, Max Müller's Dhammapada and James Legge's Tao Te Ching,
     plus Thoreau's Walden. Carl Rogers's line on self-acceptance and change is paraphrased,
     as his book is still in copyright. Lines without a name are Entrain's own, and say so; the
     ones marked "as written" were added in their author's own words and are kept that way.
  ---------------------------------------------------------------------- */
  var QUOTES = [
    ["A balanced mind perceives the most subtle sensations.", "Vipassana teaching"],
    ["Look within. Within is the fountain of good, and it will ever bubble up, if thou wilt ever dig.", "Marcus Aurelius, Meditations"],
    ["Very little indeed is necessary for living a happy life.", "Marcus Aurelius, Meditations"],
    ["Nowhere either with more quiet or more freedom from trouble does a man retire than into his own soul.", "Marcus Aurelius, Meditations"],
    ["The universe is transformation: life is opinion.", "Marcus Aurelius, Meditations"],
    ["While we are postponing, life speeds by.", "Seneca, Letters"],
    ["We suffer more often in imagination than in reality.", "Seneca, Letters"],
    ["Men are disturbed not by the things which happen, but by the opinions about the things.", "Epictetus, Enchiridion"],
    ["All that we are is the result of what we have thought.", "The Dhammapada"],
    ["Hatred does not cease by hatred at any time: hatred ceases by love.", "The Dhammapada"],
    ["The journey of a thousand li commenced with a single step.", "Tao Te Ching"],
    ["He who knows other men is discerning; he who knows himself is intelligent.", "Tao Te Ching"],
    ["He who overcomes others is strong; he who overcomes himself is mighty.", "Tao Te Ching"],
    ["Simplify, simplify.", "Henry David Thoreau, Walden"],
    ["Paradoxically, change starts when you accept yourself as you are.", "Carl Rogers, paraphrased"],
    ["Every breath is a fresh place to start.", ""],
    ["Begin as you are, and let the calm catch up.", ""],
    ["Small sessions, often, add up to a steadier you.", ""],
    ["The body learns what you repeat.", ""],
    ["Observe what's here, just as it is. That is most of the practice.", ""],
    ["Your heart keeps time for you. Listen in now and then.", ""],
    ["A long out-breath is the shortest way back to yourself.", ""],
    ["Five quiet minutes still count.", ""],
    ["Stillness is full of small things you usually pass by.", ""],
    ["Come back as often as the mind wanders. Coming back is the training.", ""],
    ["Effort and ease can share the same breath.", ""],
    ["Done is enough. Today's practice only needs doing.", ""],
    ["Tension is information: a message from the body.", ""],
    ["Whatever this moment holds, you can shape the next breath.", ""],
    ["Resting well is part of doing well.", ""],
    ["Move a little, breathe a little, and see what changes.", ""],
    ["Each time you return to the breath, attention gets a little stronger.", ""],
    ["Kindness toward yourself is a strength, and it grows with practice.", ""],
    ["There is always time for one slow breath.", ""],
    ["Feel your feet on the floor. You're here.", ""],
    ["Progress is quiet. Keep going anyway.", ""],
    ["Let the out-breath be a little longer than the in-breath, and let the day go with it.", ""],
    ["There's nothing to do but enjoy the view.", "", "as written"],
    ["Health is a state of co-operation.", "", "as written"],
    ["Revolution is an ongoing process of self discovery.", "", "as written"]
  ];
  var ROGERS = QUOTES[14];
  var Q = { i: 0 };
  function qDay() { var d = new Date(); return Math.floor((d.getTime() - d.getTimezoneOffset() * 6e4) / 864e5); }
  function qBy(q) { return q[1] || "Entrain"; }
  function qShow() {
    var q = QUOTES[Q.i];
    bSetT("#qTxt", q[0]);
    bSetT("#qBy", qBy(q));
  }
  /* One for the end of a practice: never the one already on Today. */
  function qPick() {
    var i = Math.floor(Math.random() * (QUOTES.length - 1));
    return QUOTES[i >= Q.i ? i + 1 : i];
  }
  function qCard(q) {
    return '<figure class="quote sd-quote"><blockquote>' + esc(q[0]) + "</blockquote>" +
      "<figcaption><span>" + esc(qBy(q)) + "</span>" +
      '<button class="btn small q-say" data-say="' + esc(q[0] + (q[1] ? " " + q[1] + "." : "")) + '"><svg class="i" aria-hidden="true"><use href="#i-voice"/></svg>Read aloud</button>' +
      "</figcaption></figure>";
  }
  function qSay(text) {
    if (!window.speechSynthesis) return;
    pHush();
    var v = P.opt.voice;
    P.opt.voice = true; pSay(text); P.opt.voice = v;
  }
  function qInit() {
    Q.i = store.get("qSeen") ? qDay() % QUOTES.length : 0;    // the first visit opens on the balanced-mind line
    store.set("qSeen", "1");
    qShow();
    $("#qNext").addEventListener("click", function () { Q.i = (Q.i + 1) % QUOTES.length; qShow(); });
    document.addEventListener("click", function (e) {
      var b = e.target.closest && e.target.closest("[data-say]");
      if (b) qSay(b.dataset.say);
    });
  }
