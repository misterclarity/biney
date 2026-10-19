  /* ------------------------------------------------------------------
     Track library. Every entry is traceable to a reference on the Learn
     page. `ramp` tracks slide from one beat frequency to another across
     the session, the way the audio used in Padmanabhan 2005 progressively
     slowed into delta.
  ------------------------------------------------------------------ */
  var TRACKS = [
    /* ---------- RELAXATION ---------- */
    {
      id: "sleep-descent", cat: "relax", band: "Delta", name: "Delta Sleep",
      carrier: 200, beat: 3, rampFrom: 6, minutes: 30, strength: 3,
      desc: "Starts in theta and slides down into a 3 Hz delta beat, the frequency used in the sleep-stage trial.",
      ev: "A 3 Hz binaural beat significantly increased delta activity and lengthened stage-3 (deep) sleep versus control nights. The descent from 6 Hz mirrors the common protocol of easing through theta before settling into delta.",
      cite: "Jirakittayakorn & Wongsawat 2018, Front. Hum. Neurosci."
    },
    {
      id: "preop-calm", cat: "relax", band: "Delta", name: "Pre-Procedure Calm",
      carrier: 250, beat: 2, rampFrom: 10, minutes: 30, strength: 3,
      desc: "A 30-minute progressive slowing from alpha to a closing stretch of deep delta — the anxiety protocol.",
      ev: "The randomised pre-operative trial used a 30-minute track that progressively slowed the beat to give a closing 10-minute period of delta. Theta/delta beats carry the largest pooled anxiety effect in meta-analysis (g = 0.69).",
      cite: "Padmanabhan et al. 2005, Anaesthesia · Garcia-Argibay et al. 2019"
    },
    {
      id: "theta-meditation", cat: "relax", band: "Theta", name: "Theta Meditation",
      carrier: 250, beat: 6, minutes: 20, strength: 3,
      desc: "A steady 6 Hz beat — the frequency shown to raise theta power and frontal midline theta during listening.",
      ev: "EEG recorded during 6 Hz binaural beat exposure showed increased general theta rhythm and frontal midline theta activity, the signature associated with meditative and internally focused states.",
      cite: "Jirakittayakorn & Wongsawat 2017, Front. Neurosci."
    },
    {
      id: "parasympathetic", cat: "relax", band: "Theta", name: "Parasympathetic Recovery",
      carrier: 200, beat: 6, minutes: 20, strength: 2,
      desc: "Theta-band beats for the wind-down after hard exercise, where autonomic effects were measured.",
      ev: "Listening to theta-frequency binaural beats post-exercise increased parasympathetic activation and sympathetic withdrawal, measured through heart-rate variability — an autonomic effect rather than a purely subjective one.",
      cite: "McConnell et al. 2014, Front. Psychol."
    },
    {
      id: "alpha-stress", cat: "relax", band: "Alpha", name: "Alpha Stress Relief",
      carrier: 300, beat: 10, minutes: 20, strength: 2,
      desc: "10 Hz alpha at a mid carrier — relaxed but awake, the state most anxiety protocols target.",
      ev: "Alpha-frequency beats around 10 Hz are the most common choice in anxiety and stress work, and post-hoc analyses have found stress reduction specifically in the alpha condition. Carriers in the 200–600 Hz range are standard for this use.",
      cite: "Garcia-Argibay et al. 2019 · band reviews"
    },
    {
      id: "creative-reverie", cat: "relax", band: "Alpha", name: "Creative Reverie",
      carrier: 340, beat: 10, minutes: 20, strength: 1,
      desc: "Alpha for divergent thinking — with the caveat that it worked for some people and not others.",
      ev: "Alpha binaural beats improved divergent (but not convergent) thinking. The effect appeared only in participants with lower estimated baseline dopamine; those higher on that measure showed no benefit or slightly worse performance.",
      cite: "Reedijk, Bolders & Hommel 2013, Front. Hum. Neurosci."
    },

    /* ---------- TINNITUS ---------- */
    {
      id: "tinnitus-notch", cat: "ther", band: "Alpha + notch", name: "Notched Relief",
      carrier: 250, beat: 8, minutes: 15, strength: 2, notch: true,
      desc: "Pink noise with a one-octave hole cut around your own tinnitus pitch, under an 8 Hz alpha beat. Needs a pitch match first.",
      ev: "Two mechanisms, each trialled separately. Removing a one-octave band centred on the individual tinnitus frequency reduced subjective loudness by roughly 30% and lowered tinnitus-related auditory cortex activity after 12 months, an effect attributed to lateral inhibition; it held for tinnitus at or below 8 kHz and not above. Separately, adding an 8 Hz alpha binaural beat to relaxing sound improved tinnitus handicap and emotional scores more than the sound alone over 15 minutes twice daily for 4 weeks. A controlled trial combining notched training with binaural beats found the combination gave the larger mean handicap reduction. This is an adjunct, not a cure, and the timescale is weeks of daily use rather than one session.",
      cite: "Okamoto et al. 2010, PNAS \u00b7 Stein et al. 2011, PLOS One \u00b7 Am. J. Otolaryngol. 2024 RCT"
    },

    /* ---------- STIMULATION ---------- */
    {
      id: "vigilance-16", cat: "stim", band: "Beta", name: "Vigilance 16",
      carrier: 400, beat: 16, minutes: 30, strength: 3,
      desc: "The 16 Hz beta condition from the vigilance study — a 30-minute watch-keeping session.",
      ev: "Across a 30-minute visual vigilance task, beta-frequency beats (16 and 24 Hz) produced more correct target detections and fewer false alarms than theta/delta beats, and were associated with less negative mood.",
      cite: "Lane et al. 1998, Physiology & Behavior"
    },
    {
      id: "sustained-24", cat: "stim", band: "Beta", name: "Sustained Attention 24",
      carrier: 400, beat: 24, minutes: 30, strength: 3,
      desc: "The faster beta arm of the same trial, for tasks that keep drifting away from you.",
      ev: "The 24 Hz beta condition shared the vigilance advantage over slower beats in the original trial. Beta beats in the 12–30 Hz range are the band most consistently linked to active focus in the reviews.",
      cite: "Lane et al. 1998 · band reviews"
    },
    {
      id: "deep-work", cat: "stim", band: "Beta", name: "Deep Work Block",
      carrier: 300, beat: 15, minutes: 50, strength: 2,
      desc: "A long beta block sized to a full study or work session rather than a short burst.",
      ev: "Time under exposure contributed significantly to the meta-analytic model, with longer periods advisable for maximum effect. Study-focused guidance converges on 25–50 minute blocks followed by a short break.",
      cite: "Garcia-Argibay et al. 2019"
    },
    {
      id: "gamma-40", cat: "stim", band: "Gamma", name: "Gamma Focus 40",
      carrier: 400, beat: 40, minutes: 25, strength: 2,
      desc: "40 Hz on a 400 Hz carrier — the exact pairing that reliably evokes a steady-state response.",
      ev: "A 40 Hz binaural-beat auditory steady-state response was evoked with a 400 Hz carrier and was undetectable above ~3000 Hz, which is why the carrier is fixed low here. In attentional-blink training, 40 Hz produced greater improvement than 16 Hz.",
      cite: "Hommel et al. 2020, Sci. Rep. · Orozco Perez et al. 2020, eNeuro"
    },
    {
      id: "gamma-memory", cat: "stim", band: "Gamma", name: "Working Memory Gamma",
      carrier: 240, beat: 40, minutes: 15, strength: 1,
      desc: "A short gamma block for memory work — the most contested claim on this page, flagged as such.",
      ev: "Some trials found better working-memory performance under 40 Hz stimulation, correlating with frequency-following responses. Others found no change in either memory scores or EEG and concluded entrainment never occurred. Treat as experimental.",
      cite: "Jausovec et al. 2022 · Basu & Banerjee 2023"
    }
  ];

  var BANDS = [
    { max: 4,  name: "Delta", note: "deep sleep, strongest anxiety effects" },
    { max: 8,  name: "Theta", note: "meditation, drowsy calm, autonomic recovery" },
    { max: 12, name: "Alpha", note: "relaxed alertness" },
    { max: 30, name: "Beta",  note: "vigilance and sustained focus" },
    { max: 99, name: "Gamma", note: "attention training — near the perceptual limit" }
  ];

  function bandFor(hz) {
    for (var i = 0; i < BANDS.length; i++) if (hz <= BANDS[i].max) return BANDS[i];
    return BANDS[BANDS.length - 1];
  }

