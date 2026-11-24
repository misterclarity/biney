  /* ------------------------------- mind -------------------------------
     Two practices for the mind, from the brain-wave guide (practice-data.js holds their entries; each is
     a new technique, sup: true):
       Guided Imagery  the usual pattern of a hypnotic relaxation: eyes resting on one spot while you
                       breathe out slowly, the eyes closing on a chime, a count down from ten to one,
                       then a calm place you choose (a beach, a forest, a mountain lake or a place of
                       your own) explored through each sense in turn, a suggestion you choose (calm,
                       confidence or rest), and a count back up from one to five, or on into sleep
       Yoga Nidra      yogic sleep in Swami Satyananda Saraswati's stages: a resolve (sankalpa), a fast
                       rotation of awareness round the body, each point named and marked on the body
                       map, the breath counted backwards from 27, heavy and light, warm and cool, quick
                       images, a spell of quiet rest in the longer sessions, the resolve again, and
                       back to alert or on into sleep
     Both can play a 6 Hz theta beat underneath (off to start with), sliding to 3 Hz delta with Into
     sleep; d.mark keeps where the sleep ending starts and where the drift begins, for the beat.
     A "rotate" step names a point every few seconds: its lines are the names, said and captioned as
     usual, and `pts` the same moments with the regions to light and the point to mark on the body
     map, which the practice's tick moves along. The "mind" visual is a soft orb, tinted for the
     place you chose, with the number of a count shown large while you count.
  ------------------------------------------------------------------------------ */

  var MN = { at: -2 };                       // the rotation's point on the body map now (-1: before the first)

  /* ----- Guided Imagery ----- */
  var GI_TINT = { beach: "#e9c46a", forest: "#74c69d", lake: "#6cb4e4" };    // the orb's colour in each place
  // each place: the step that takes you there, then its lines for each sense
  var GI_PLACE = {
    beach: { title: "Down to the beach",
      arrive: ["Picture yourself at the top of a path that leads down to a quiet beach. Take it slowly, one step at a time.",
        "The path opens out, and there it is: wide, pale sand, and the sea beyond.",
        "You're here on your own, or with whoever you'd like, and you're completely safe.",
        "Find a spot on the sand that feels right, and settle there."],
      see: ["Look around you. Notice the colour of the sea, pale green at the edge and deep blue further out.",
        "Watch a wave form, roll in, and spread across the sand in a thin, shining sheet.",
        "Notice the sky: its colour, a few soft clouds, the sunlight sparkling on the water.",
        "Let your eyes rest on the line where the sea meets the sky."],
      hear: ["Now listen. The soft rush of each wave coming in, and the hiss as it slides back.",
        "Perhaps gulls calling far away, and the breeze.",
        "Let the waves set the pace of your breathing: in as a wave gathers, out as it spreads across the sand.",
        "Each wave a little slower, a little softer."],
      feel: ["Notice the sand beneath you, warm on top and cooler as your fingers sink in.",
        "The sun's warmth on your face and shoulders.",
        "A light breeze across your skin, fresh and soft.",
        "Your whole body warm, heavy and at ease."],
      smell: ["Breathe in the fresh sea air.",
        "Notice the smell of salt, and perhaps sun-warmed sand or seaweed.",
        "Maybe a faint taste of salt on your lips.",
        "Each breath out lets you settle more deeply here."],
      rest: ["Stay here a while, and let the beach hold you.",
        "Everything you need is here: warmth, space and time.",
        "If thoughts come, let the waves carry them away.",
        "Rest, and enjoy it."] },
    forest: { title: "Into the forest",
      arrive: ["Picture yourself at the edge of a quiet forest, where a soft path leads in among the trees.",
        "Step onto the path. It's springy underfoot, covered in old leaves and pine needles.",
        "The trees gather round you, and the air grows cool and still. You're completely safe here.",
        "Walk on slowly until you reach a sunny clearing, and settle there."],
      see: ["Look up at the trees around you: tall trunks, and branches reaching high above.",
        "Sunlight filters through the leaves in shifting patches of gold and green.",
        "Notice the many greens: bright new leaves, dark moss, ferns at your feet.",
        "Let your gaze follow a beam of light down to the forest floor."],
      hear: ["Now listen. The leaves rustle softly as a breeze moves through the treetops.",
        "A bird sings somewhere nearby, and another answers further off.",
        "Perhaps a stream trickling over stones.",
        "Between the sounds, a deep, peaceful quiet."],
      feel: ["Notice the ground beneath you, soft with moss and leaves.",
        "Cool, fresh air on your face and hands.",
        "Rest a hand on the bark of a tree: rough, solid, warmed by the sun.",
        "Your body heavy, rooted and calm."],
      smell: ["Breathe in the forest air, clean and cool.",
        "Notice its scents: pine, damp earth, green leaves after rain.",
        "Each breath in is fresh; each breath out lets go a little more.",
        "Let the air of the forest fill you."],
      rest: ["Stay in your clearing for a while, sheltered by the trees.",
        "The forest has been here a long time, unhurried and steady.",
        "Let yourself be just as unhurried.",
        "Rest here, and enjoy it."] },
    lake: { title: "To the lake",
      arrive: ["Picture yourself on a path through the mountains, coming over a gentle rise.",
        "Below you lies a still lake, held in a ring of peaks.",
        "Walk down to its shore at your own pace. You're completely safe here.",
        "Find a smooth, sun-warmed rock by the water, and settle there."],
      see: ["Look out across the water. It's so still that it mirrors the mountains and the sky.",
        "Notice the colours: deep blue water, grey rock, green slopes, perhaps snow on the highest peaks.",
        "Near the shore the water is clear, and you can see pebbles on the bottom.",
        "Now and then a ripple spreads across the surface, and settles again."],
      hear: ["Listen to the mountain quiet: wide, deep and calm.",
        "Tiny waves lap at the shore.",
        "A breeze moves through the grass, and a bird calls far across the water.",
        "Let the stillness of the lake settle into you."],
      feel: ["Notice the rock beneath you, warm from the sun.",
        "The mountain air, cool and clear on your face.",
        "Dip your fingers into the water: cold, clear and refreshing.",
        "Your body calm and still, like the surface of the lake."],
      smell: ["Breathe in the clean mountain air.",
        "Notice the scent of pine, wild grass and cool water.",
        "The air is so clear that each breath comes light and easy.",
        "With each breath out, your mind grows as calm as the water."],
      rest: ["Stay by the lake for a while.",
        "Your mind can be like this water: thoughts are ripples that come and settle.",
        "Below the surface, the water is deep and calm.",
        "Rest here, and enjoy it."] },
    own: { title: "Your place",
      arrive: ["Now picture a place where you feel safe, calm and at ease. It can be somewhere you know, or somewhere you make up.",
        "Let it come by itself; whatever appears first is fine.",
        "Make your way there, slowly, and arrive.",
        "Find a spot that feels just right, and settle there."],
      see: ["Look around. What do you see? Notice the shapes and the colours.",
        "Notice the light: where it comes from, how bright or soft it is.",
        "Notice what's near you, and what's further away.",
        "Let the picture grow a little clearer and more detailed, with ease."],
      hear: ["Now listen. What can you hear in this place?",
        "Perhaps sounds nearby, and quieter ones in the distance.",
        "Or perhaps a deep, peaceful quiet.",
        "Let the sounds of this place calm you."],
      feel: ["Notice what's beneath you, and what you're resting on.",
        "The air on your skin: warm or cool, still or moving.",
        "Reach out and touch something here, and notice how it feels.",
        "Your body comfortable, heavy and at ease."],
      smell: ["Breathe in the air of this place.",
        "Notice any scents, faint or strong.",
        "Perhaps a taste too, of something you enjoy.",
        "Each breath out lets you settle more deeply here."],
      rest: ["Stay here a while. This place is yours, and you can come back whenever you like.",
        "Everything here is just right for you.",
        "If thoughts come, let them drift by like clouds.",
        "Rest, and enjoy it."] }
  };
  var GI_SENSE = [["see", "What you see", 1.2], ["hear", "What you hear", 1], ["feel", "What you feel", 1], ["smell", "What you smell", 0.8], ["rest", "Rest there", 1]];
  // the suggestion you chose, said while you rest in your place
  var GI_AIM = {
    calm: { title: "Calm to keep", lines: ["While you rest here, let a quiet message settle in.",
      "You are calm. With every breath out, the calm goes deeper.",
      "Gently press your thumb and first finger together, and notice the calm in your whole body.",
      "Later, whenever you need it, three slow breaths out and this touch will bring the calm back.",
      "Calm, steady, at ease."] },
    confidence: { title: "Steady and sure", lines: ["While you rest here, think of something ahead that matters to you.",
      "Picture yourself meeting it steadily: your breath slow, your shoulders easy, your voice clear.",
      "See it going well, one moment at a time.",
      "Gently press your thumb and first finger together, and notice that steadiness. Later, three slow breaths out and this touch can bring it back.",
      "You can meet what comes, calmly and with confidence."] },
    rest: { title: "Deep rest", lines: ["While you rest here, let your body do what it knows how to do.",
      "Every muscle softening, your heart slow and steady, your breath easy.",
      "Your body is resting deeply and restoring itself.",
      "Each breath out lets you sink a little further into rest.",
      "Deeply rested, heavy and warm."] }
  };
  var GI_DOWN = ["Ten.", "Nine. Deeper.", "Eight. Heavier.", "Seven. Calmer.", "Six. Deeper still.", "Five. Halfway down, drifting deeper.",
    "Four. Heavy and warm.", "Three. Deeper.", "Two. Calmer still.", "One. Deeply calm."];
  var GI_UP = ["One. Coming back now.", "Two. Noticing the surface beneath you.", "Three. Moving your fingers and toes.",
    "Four. A deeper breath, fresh and awake.", "Five. Eyes open, wide awake, calm and refreshed."];
  // seconds to settle, breathe, close the eyes, count down, the suggestion, count up (or into sleep), and the drift into sleep
  function giFrame(min) {
    return min <= 10 ? { settle: 40, breath: 90, eyes: 20, down: 70, aim: 75, end: 50, drift: 60 }
      : min <= 15 ? { settle: 45, breath: 120, eyes: 20, down: 80, aim: 105, end: 55, drift: 90 }
      : { settle: 50, breath: 150, eyes: 20, down: 90, aim: 135, end: 60, drift: 120 };
  }
  // lines a set fraction of the way through a step
  function mnAt(secs, lines, fr) { return lines.map(function (l, i) { return [Math.round(secs * fr[i]), l]; }); }
  // a count, one number at a time after a first line (lead: seconds to say it), the last a few seconds before the end
  function giCount(secs, title, first, lead, words, nums, sub) {
    var gap = (secs - lead - 4) / words.length, at = words.map(function (w, i) { return Math.round((lead + i * gap) * 10) / 10; });
    return G(secs, title, [[0, first]].concat(words.map(function (w, i) { return [at[i], w]; })),
      { vis: "mind", sub: sub, nums: nums.map(function (n, i) { return [at[i], n]; }) });
  }
  function giSteps(d, min) {
    min = min || 10;
    var T = min * 60, F = giFrame(min), place = GI_PLACE[pChoice(d, "place")] || GI_PLACE.beach, tint = GI_TINT[pChoice(d, "place")] || "";
    var aim = GI_AIM[pChoice(d, "aim")] || GI_AIM.calm, sleep = pChoice(d, "end") === "sleep";
    var four = [0, 0.27, 0.52, 0.76];
    var st = [
      G(F.settle, "Settle", mnAt(F.settle, ["Lie down, or sit back with your head supported, and let your hands rest.",
        "Over the next few minutes you'll breathe slowly, count down, and spend some time in a calm place you picture.",
        "Rest your eyes on one spot in front of you, or above you. You can open your eyes whenever you like."], [0, 0.3, 0.62]), { vis: "mind" }),
      Br(F.breath, "Long breaths out", { inh: 4, sip: 0, hold: 0, exh: 6, rest: 0 }, { lines: mnAt(F.breath, ["Breathe in through your nose for four, and out slowly for six.",
        "With each breath out, let your shoulders drop and your body grow heavier.",
        "Keep your eyes on your spot. As your eyelids grow heavy, let them blink, and let them grow heavier still."], [0, 0.34, 0.66]) }),
      G(F.eyes, "Eyes closed", [[0, "Eyes closed", "chime"], [2, "Now let your eyes close, and keep them gently closed."], [12, "Let your breathing find its own easy pace."]],
        { vis: "mind", nobell: true }),
      giCount(F.down, "Counting down", "Now count slowly down from ten to one with me. With each number, sink deeper into calm.", 8, GI_DOWN,
        [10, 9, 8, 7, 6, 5, 4, 3, 2, 1], "From ten down to one")
    ];
    var parts = [["arrive", place.title, 1]].concat(GI_SENSE);
    var sh = shares(T - F.settle - F.breath - F.eyes - F.down - F.aim - F.end - (sleep ? F.drift : 0), parts.map(function (p) { return [p[0], p[2]]; }));
    parts.forEach(function (p) { st.push(G(sh[p[0]], p[1], mnAt(sh[p[0]], place[p[0]], four), { vis: "mind", tint: tint })); });
    st.push(G(F.aim, aim.title, mnAt(F.aim, aim.lines, [0, 0.2, 0.42, 0.62, 0.82]), { vis: "mind", tint: tint }));
    if (sleep) {
      st.push(G(F.end, "Into sleep", mnAt(F.end, ["Stay in your place now, and let it carry you into sleep.",
        "The picture can soften and fade, and the sounds grow distant.", "Heavy, warm and safe. Let sleep come in its own time."], [0, 0.35, 0.7]),
        { vis: "mind", tint: tint, quiet: true, sleepy: true }));
      st.push(Dr(F.drift, "Drift", [[0, "Rest now, and drift."]]));
    } else {
      st.push(giCount(F.end, "Counting up", "Take one last look around, knowing you can come back whenever you like. Now count up with me, from one to five.", 10, GI_UP,
        [1, 2, 3, 4, 5], "From one up to five"));
    }
    d.mark = sleep ? { sleep: T - F.end - F.drift, drift: T - F.drift } : null;     // where the beat starts down to delta
    return st;
  }

  /* ----- Yoga Nidra ----- */
  var YN_RES = { calm: "I am calm and at ease", rest: "I rest deeply and wake refreshed", strong: "I am steady and strong" };
  // the body map's points: [name, regions, x, y] (x and y on the map's 120 × 300 drawing, which faces you, so your
  // right is on its left; no point for a whole part)
  function ynSide(right, short) {
    var S = right ? "R" : "L", W = right ? "Right" : "Left", m = function (x) { return right ? x : 120 - x; };
    var hand = "hand" + S, arm = "arm" + S, foot = "foot" + S;
    if (short) return [[W + " hand thumb", [hand], m(13), 152], ["All the fingers", [hand], m(20), 166], ["Palm of the hand", [hand], m(20), 157],
      ["Wrist", [arm], m(20), 146], ["Elbow", [arm], m(22), 104], ["Shoulder", ["shoulders"], m(31), 54], [W + " hip", ["hips"], m(39), 136],
      ["Knee", ["knee" + S], m(48), 217], ["Ankle", ["shin" + S], m(47), 272], ["Heel", [foot], m(42), 285], ["Sole of the foot", [foot], m(45), 284], ["Toes", [foot], m(48), 285]];
    return [[W + " hand thumb", [hand], m(13), 152], ["Second finger", [hand], m(16), 165], ["Third finger", [hand], m(20), 167], ["Fourth finger", [hand], m(23), 166],
      ["Fifth finger", [hand], m(26), 162], ["Palm of the hand", [hand], m(20), 157], ["Back of the hand", [hand], m(20), 154], ["Wrist", [arm], m(20), 146],
      ["Forearm", [arm], m(20), 126], ["Elbow", [arm], m(22), 104], ["Upper arm", [arm], m(24), 80], ["Shoulder", ["shoulders"], m(31), 54], ["Armpit", [arm], m(32), 63],
      [W + " side of the waist", ["belly"], m(39), 111], [W + " hip", ["hips"], m(39), 136], [W + " thigh", ["thigh" + S], m(48), 180], ["Kneecap", ["knee" + S], m(48), 217],
      ["Calf", ["shin" + S], m(48), 245], ["Ankle", ["shin" + S], m(47), 272], ["Heel", [foot], m(42), 285], ["Sole of the foot", [foot], m(45), 284],
      ["Top of the foot", [foot], m(45), 279], ["Big toe", [foot], m(52), 283], ["Second toe", [foot], m(49), 286], ["Third toe", [foot], m(46), 287],
      ["Fourth toe", [foot], m(43), 287], ["Fifth toe", [foot], m(39), 285]];
  }
  var YN_LEGS = ["thighR", "kneeR", "shinR", "footR"], YN_LEGL = ["thighL", "kneeL", "shinL", "footL"];
  // the whole rotation: right side, left side, the back, the front, then the major parts and the whole body
  function ynPoints(short) {
    var back = short ? [["Shoulder blades", ["back"], 60, 68], ["The spine", ["back"], 60, 100], ["Buttocks", ["hips"], 60, 142]]
      : [["Right shoulder blade", ["back"], 47, 68], ["Left shoulder blade", ["back"], 73, 68], ["Right buttock", ["hips"], 50, 142], ["Left buttock", ["hips"], 70, 142],
        ["The spine, from bottom to top", ["back"], 60, 100], ["The whole back together", ["back"], null, null]];
    var front = short ? [["Top of the head", ["head"], 60, 6], ["Forehead", ["face"], 60, 18], ["The space between the eyebrows", ["face"], 60, 22], ["Eyes", ["face"], 60, 25],
        ["Cheeks", ["face"], 60, 30], ["Lips", ["face"], 60, 34], ["Chin", ["face"], 60, 38], ["Throat", ["neck"], 60, 43], ["Chest", ["chest"], 60, 77],
        ["Navel", ["belly"], 60, 111], ["Abdomen", ["belly"], 60, 117]]
      : [["Top of the head", ["head"], 60, 6], ["Forehead", ["face"], 60, 18], ["Right eyebrow", ["face"], 55, 21], ["Left eyebrow", ["face"], 65, 21],
        ["The space between the eyebrows", ["face"], 60, 22], ["Right eye", ["face"], 55, 25], ["Left eye", ["face"], 65, 25], ["Right ear", ["head"], 45, 25],
        ["Left ear", ["head"], 75, 25], ["Right cheek", ["face"], 54, 30], ["Left cheek", ["face"], 66, 30], ["Nose", ["face"], 60, 27], ["Tip of the nose", ["face"], 60, 30],
        ["Upper lip", ["face"], 60, 33], ["Lower lip", ["face"], 60, 35], ["Chin", ["face"], 60, 38], ["Throat", ["neck"], 60, 43], ["Right collarbone", ["shoulders"], 50, 52],
        ["Left collarbone", ["shoulders"], 70, 52], ["Right side of the chest", ["chest"], 49, 76], ["Left side of the chest", ["chest"], 71, 76],
        ["Middle of the chest", ["chest"], 60, 78], ["Upper abdomen", ["belly"], 60, 102], ["Navel", ["belly"], 60, 111], ["Lower abdomen", ["belly"], 60, 120]];
    var whole = [["The whole right leg", YN_LEGS, null, null], ["The whole left leg", YN_LEGL, null, null]]
      .concat(short ? [] : [["Both legs together", YN_LEGS.concat(YN_LEGL), null, null]])
      .concat([["The whole right arm", ["armR", "handR"], null, null], ["The whole left arm", ["armL", "handL"], null, null]])
      .concat(short ? [] : [["Both arms together", ["armR", "handR", "armL", "handL"], null, null]])
      .concat([["The whole back", ["back"], null, null], ["The whole front", ["chest", "belly", "hips"], null, null], ["The whole head", ["head", "face"], null, null],
        ["The whole body together", ["all"], null, null], ["The whole body together", ["all"], null, null]]);
    return ynSide(true, short).concat(ynSide(false, short), back, front, whole);
  }
  var YN_IMG = ["A candle flame, steady and bright.", "A sunrise over the sea.", "A tall tree swaying in the wind.", "A white cloud drifting across a blue sky.",
    "Snow on a mountain peak.", "A bird flying high above the hills.", "Waves rolling onto a sandy beach.", "A lotus flower on a still pond.", "A night sky full of stars.",
    "A full moon over calm water.", "A garden after rain.", "A river winding through a valley.", "A feather drifting slowly down.", "Raindrops on a window.",
    "A field of golden wheat.", "A lamp glowing in a dark room.", "A path through sand dunes.", "An open door, with sunlight beyond it.", "A cat asleep in the sun.",
    "A deep green forest.", "A snowflake landing on your hand.", "A small boat on a calm lake.", "A rainbow after a storm.", "Mist rising over a meadow.",
    "A child laughing.", "A cup of warm tea.", "A sunflower turning to the sun.", "Autumn leaves falling.", "A lighthouse at dusk.", "A smooth pebble in your palm.",
    "Stars reflected in a still lake.", "A butterfly opening its wings.", "A mountain stream over stones.", "Bread fresh from the oven.", "A kite high in the wind.",
    "A sleeping baby.", "Sunlight through green leaves.", "A quiet harbour at dawn.", "A flock of birds turning together.", "Your own body, lying here, completely relaxed."];
  // seconds to settle, listen, make the resolve, say it again and come back (or drift off), and each middle part's share
  function ynFrame(min) {
    return min <= 20 ? { settle: 60, sounds: 45, res: 50, res2: 40, end: 60, drift: 120, w: [["breath", 1.2], ["heavy", 1], ["warm", 1], ["images", 1.2]] }
      : min <= 30 ? { settle: 75, sounds: 60, res: 55, res2: 45, end: 70, drift: 180, w: [["breath", 1.3], ["heavy", 1], ["warm", 1], ["images", 1.3], ["quiet", 0.8]] }
      : { settle: 90, sounds: 90, res: 60, res2: 50, end: 80, drift: 240, w: [["breath", 1.5], ["heavy", 1.1], ["warm", 1.1], ["images", 1.5], ["quiet", 2]] };
  }
  // the rotation: a point every 3 seconds; in 45 minutes, once round in full and again, a little faster, in short
  function ynRotate(min) {
    var lines = [[0, "Now your attention travels quickly round the body. As each part is named, place your attention there, and move on with the voice."]], pts = [], t = 10;
    var round = function (list, gap) {
      list.forEach(function (p) { var at = Math.round(t * 10) / 10; lines.push([at, p[0]]); pts.push({ t: at, r: p[1], x: p[2], y: p[3] }); t += gap; });
    };
    round(ynPoints(min <= 20), 3);
    if (min > 30) {
      t += 1; lines.push([Math.round(t), "Once more, a little faster."]); t = Math.round(t) + 4;
      round(ynPoints(true), 2.5);
    }
    return { k: "rotate", secs: Math.ceil(t + 3), title: "Rotation of awareness", body: ["all"], lines: lines, pts: pts };
  }
  function ynSteps(d, min) {
    min = min || 30;
    var T = min * 60, F = ynFrame(min), sleep = pChoice(d, "end") === "sleep", R = YN_RES[pChoice(d, "resolve")] || "";
    var rot = ynRotate(min);
    var sh = shares(T - F.settle - F.sounds - F.res - rot.secs - F.res2 - F.end - (sleep ? F.drift : 0), F.w);
    var st = [
      G(F.settle, "Settle", mnAt(F.settle, ["Lie on your back, arms a little away from your sides, palms up, and let your feet fall apart. A pillow under your head or knees is fine, and a blanket will keep you warm.",
        "Make any last adjustments, then let your body be completely still. Close your eyes.",
        "Yoga nidra means yogic sleep: the body rests deeply while the mind stays aware.",
        sleep ? "Say to yourself, silently: I am practising yoga nidra. I'll stay aware until the end, and then drift into sleep."
          : "Say to yourself, silently: I am practising yoga nidra, and I'll stay awake and aware."], [0, 0.3, 0.55, 0.78]), { body: ["all"] }),
      G(F.sounds, "Sounds", mnAt(F.sounds, ["Now let your hearing reach out to the most distant sounds you can hear.",
        "Move from sound to sound, simply listening, the way you'd watch clouds pass.",
        "Now bring your hearing closer: sounds in the building, then sounds in this room.",
        "Now notice the room itself, and your body lying still in it."], [0, 0.3, 0.6, 0.84]), { vis: "glow" }),
      R ? G(F.res, "Your resolve", mnAt(F.res, ["Now make your resolve, your sankalpa: a short, positive sentence, in the present tense.",
        "Say it silently three times, with feeling: " + R + ".", R + ".", R + ".", "Your resolve is planted. Let it rest."], [0, 0.26, 0.48, 0.64, 0.84]), { vis: "glow" })
        : G(F.res, "Your resolve", mnAt(F.res, ["Now make your resolve, your sankalpa: a short, positive sentence about something that matters to you, in the present tense.",
          "For example: I am calm and at ease. Choose your own, or let one come to you.",
          "Say it silently three times, with feeling, as if it's already true.", "Your resolve is planted. Let it rest."], [0, 0.3, 0.55, 0.82]), { vis: "glow" }),
      rot,
      Ob(sh.breath, "Counting breaths", mnAt(sh.breath, ["Now become aware of your natural breath. Let it flow in and out by itself.",
        "Notice the breath moving at the nostrils, in and out.",
        "Now count your breaths backwards, silently, from 27 down to 1: breathing in, 27; breathing out, 27; breathing in, 26; breathing out, 26; and so on.",
        "If you lose count, start again at 27. Stay awake, and keep counting.",
        "Now let the counting go, and rest with the natural breath."], [0, 0.1, 0.2, 0.55, 0.86]), { vis: "still", sub: "From 27 down to 1, at your own pace" }),
      G(sh.heavy, "Heavy and light", mnAt(sh.heavy, ["Now awaken the feeling of heaviness. Your whole body is heavy, sinking down into the floor.",
        "Heavy arms, heavy legs, a heavy head. The whole body heavy.",
        "Now awaken the feeling of lightness. Your body is light, as light as a feather, almost floating.",
        "Light arms, light legs, a light head. The whole body light.",
        "Now let heaviness and lightness go, and rest."], [0, 0.2, 0.42, 0.62, 0.86]), { body: ["all"] }),
      G(sh.warm, "Warm and cool", mnAt(sh.warm, ["Now awaken the feeling of warmth. Imagine lying in the summer sun: your whole body is warm.",
        "Warm hands, warm feet, warmth in your belly and on your face.",
        "Now awaken the feeling of coolness. Imagine a cool breeze on a winter's morning: your skin is cool and fresh.",
        "Cool hands, cool feet, a cool forehead.",
        "Now let warmth and coolness go, and rest."], [0, 0.2, 0.42, 0.62, 0.86]), { body: ["all"] }),
      ynImages(sh.images)
    ];
    if (sh.quiet) st.push(Ob(sh.quiet, "Deep rest", mnAt(sh.quiet, ["Now rest in the stillness, aware of the quiet space in front of your closed eyes.",
      "If your mind has wandered, gently come back to the quiet.", "Stay awake and aware, resting deeply."], [0, 0.45, 0.8]), { vis: "still" }));
    st.push(R ? G(F.res2, "Your resolve again", mnAt(F.res2, ["Now remember your resolve, and say it silently three times, with feeling: " + R + ".", R + ".", R + ".", "Let it sink in deep."],
      [0, 0.34, 0.52, 0.74]), { vis: "glow" })
      : G(F.res2, "Your resolve again", mnAt(F.res2, ["Now remember your resolve, the same one you made at the start.", "Say it silently three times, with feeling.", "Let it sink in deep."],
        [0, 0.3, 0.72]), { vis: "glow" }));
    if (sleep) {
      st.push(G(F.end, "Into sleep", mnAt(F.end, ["Now there's no need to come back. Let your body stay heavy, warm and still.", "Let your awareness soften, and drift into sleep.", "Rest deeply."],
        [0, 0.4, 0.75]), { body: ["all"], quiet: true, sleepy: true }));
      st.push(Dr(F.drift, "Drift", [[0, "Rest now, and let sleep come."]]));
    } else {
      st.push(G(F.end, "Coming back", mnAt(F.end, ["Now the practice is coming to an end. Become aware of your natural breath.",
        "Notice your body lying here, and the places where it touches the ground.",
        "Hear the sounds around you, near and far, and picture the room around you.",
        "Move your fingers and toes. Stretch slowly, and roll onto your side.",
        "When you're ready, sit up slowly and open your eyes."], [0, 0.2, 0.4, 0.6, 0.8]), { body: ["all"] }));
    }
    d.mark = sleep ? { sleep: T - F.end - F.drift, drift: T - F.drift } : null;
    return st;
  }
  // quick images, one after another, as many as fit at five seconds or more each
  function ynImages(secs) {
    var avail = secs - 22, n = Math.max(1, Math.min(YN_IMG.length, Math.floor(avail / 5))), gap = avail / n;
    var lines = [[0, "Now watch the dark space in front of your closed eyes. Images will be named, one after another. Picture each one as well as you can, and move on with the voice."]];
    for (var i = 0; i < n; i++) lines.push([Math.round((12 + i * gap) * 10) / 10, YN_IMG[i]]);
    lines.push([secs - 8, "Now let the images go, and rest in the quiet space behind your eyes."]);
    return G(secs, "Images", lines, { vis: "mind" });
  }

  /* ----- the beat: theta, and down to delta with Into sleep ----- */
  function mnPts(T, d) {
    var m = d && d.mark;
    return m && m.sleep > 0 && m.drift > m.sleep && m.drift < T - 1 ? [[0, 6], [m.sleep, 6], [m.drift, 3], [T, 3]] : [[0, 6], [T, 6]];
  }
  function mnBand(d) { return pChoice(d, "end") === "sleep" ? "Theta → Delta" : "Theta"; }
  function mnBeats(what) {
    return [{ id: "theta", label: "Theta 6 Hz", band: mnBand, pts: mnPts,
      note: function (d) {
        return "A 6 Hz beat, in the theta band " + what + " (beats' own evidence is mixed)" +
          (pChoice(d, "end") === "sleep" ? ", sliding down to 3 Hz delta as you drift into sleep." : ", steady throughout.");
      } }];
  }

  /* ----- on the screen ----- */
  function ynIdx(s, st) {
    var i = -1;
    for (var j = 0; j < s.pts.length; j++) { if (s.pts[j].t <= st + 0.05) i = j; else break; }
    return i;
  }
  function ynSub(s, st) {
    var i = ynIdx(s, st);
    return i < 0 ? "A point every few seconds, round the whole body" : "Point " + (i + 1) + " of " + s.pts.length;
  }
  function mnEnter(s) { MN.at = -2; }
  // the rotation's point: its regions lit on the body map, and a dot where it is
  function mnTick(s, st) {
    if (s.k !== "rotate") return;
    var i = ynIdx(s, st);
    if (i === MN.at) return;
    var svg = $("#sFig svg.bm");
    if (!svg) return;
    MN.at = i;
    var p = i >= 0 ? s.pts[i] : null, on = p ? p.r : ["all"], all = on.indexOf("all") >= 0;
    svg.classList.toggle("all", all);
    var gs = svg.querySelectorAll("[data-r]");
    for (var k = 0; k < gs.length; k++) gs[k].classList.toggle("on", all || on.indexOf(gs[k].dataset.r) >= 0);
    var dot = svg.querySelector(".mn-pt");
    if (!dot) {
      dot = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      dot.setAttribute("class", "mn-pt"); dot.setAttribute("r", "3.4");
      svg.appendChild(dot);
    }
    if (p && p.x !== null) { dot.setAttribute("cx", p.x); dot.setAttribute("cy", p.y); dot.setAttribute("visibility", "visible"); }
    else dot.setAttribute("visibility", "hidden");
  }
  // the number being counted, and how long since it was said
  function mnNum(s, st) {
    var k = null;
    (s.nums || []).forEach(function (n) { if (n[0] <= st + 0.05) k = { n: n[1], age: st - n[0] }; });
    return k;
  }
  // a soft orb in the place's colour; while you count, the number large in the middle, fading in
  function mnDraw(c, W, Hh, s, st, col) {
    pOrb(c, W, Hh, s.at + st, s.tint || col, 1);
    var k = mnNum(s, st);
    if (!k) return;
    var R = Math.min(W, Hh) * 0.3;
    c.globalAlpha = RM ? 1 : Math.max(0, Math.min(1, k.age / 0.6));
    c.font = "700 " + Math.round(R * 0.8) + "px " + B_MONO; c.fillStyle = BCOL.text || "#e8ecf6"; c.textAlign = "center"; c.textBaseline = "middle";
    c.fillText(String(k.n), W / 2, Hh / 2 + 2);
    c.globalAlpha = 1;
  }

  function mnInit() {
    if (window.__entrain) {
      var X = window.__entrain;
      X.MN = MN; X.ynIdx = ynIdx; X.ynSub = ynSub; X.mnNum = mnNum; X.mnPts = mnPts; X.YN_IMG = YN_IMG; X.ynPoints = ynPoints;
    }
  }
