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
      desc: "Starts at 6 Hz theta and slides down to a 3 Hz delta beat, the beat that lengthened deep sleep in Jirakittayakorn and Wongsawat's 2018 sleep study.",
      ev: "A 3 Hz binaural beat significantly increased delta activity and lengthened stage-3 (deep) sleep versus control nights. The descent from 6 Hz mirrors the common protocol of easing through theta before settling into delta.",
      cite: "Jirakittayakorn & Wongsawat 2018, Front. Hum. Neurosci."
    },
    {
      id: "preop-calm", cat: "relax", band: "Delta", name: "Pre-Procedure Calm",
      carrier: 250, beat: 2, rampFrom: 10, minutes: 30, strength: 3,
      desc: "Thirty minutes that slow from 10 Hz alpha to a closing stretch of 2 Hz delta, modelled on the track that lowered anxiety before day surgery in Padmanabhan's 2005 trial.",
      ev: "In Padmanabhan and colleagues' randomised trial before day-case surgery, a 30-minute track that progressively slowed the beat, ending with 10 minutes of delta, lowered anxiety scores by about 26%, against 11% for the same soundtrack without the beat and 4% with nothing. Theta and delta beats had the largest pooled effect on anxiety (g = 0.69) in Garcia-Argibay and colleagues' 2019 meta-analysis.",
      cite: "Padmanabhan et al. 2005, Anaesthesia · Garcia-Argibay et al. 2019"
    },
    {
      id: "theta-meditation", cat: "relax", band: "Theta", name: "Theta Meditation",
      carrier: 250, beat: 6, minutes: 20, strength: 3,
      desc: "A steady 6 Hz theta beat, the frequency that raised theta and frontal-midline theta in listeners' EEG in Jirakittayakorn and Wongsawat's 2017 study.",
      ev: "EEG recorded during 6 Hz binaural beat exposure showed increased general theta rhythm and frontal midline theta activity, the signature associated with meditative and internally focused states.",
      cite: "Jirakittayakorn & Wongsawat 2017, Front. Neurosci."
    },
    {
      id: "parasympathetic", cat: "relax", band: "Theta", name: "Parasympathetic Recovery",
      carrier: 200, beat: 6, minutes: 20, strength: 2,
      desc: "A steady 6 Hz theta beat for the 20 minutes after hard exercise: theta beats tilted heart-rate variability towards rest in a 2014 study of people recovering from a workout.",
      ev: "In 21 young adults resting for 20 minutes after exercise, theta binaural beats (7 Hz, swept between 5.5 and 8.5 Hz, in pink noise) shifted heart-rate variability towards parasympathetic activity over the first ten minutes, compared with the same sound without a beat: an autonomic effect rather than a purely subjective one. By the end of the 20 minutes the two no longer differed, and this track plays a steady 6 Hz rather than the sweep.",
      cite: "McConnell et al. 2014, Front. Psychol."
    },
    {
      id: "alpha-stress", cat: "relax", band: "Alpha", name: "Alpha Stress Relief",
      carrier: 300, beat: 10, minutes: 20, strength: 2,
      desc: "A steady 10 Hz alpha beat on a 300 Hz carrier, for calm that keeps you awake: the lighter choice beside the theta and delta tracks, which had the larger effects on anxiety.",
      ev: "In Garcia-Argibay and colleagues' 2019 meta-analysis, binaural beats lowered anxiety, with the largest effects for theta and delta beats (g = 0.69). Alpha beats around 10 Hz are used for relaxed wakefulness, when a slower beat would make you drowsy. Carriers between 200 and 600 Hz are typical.",
      cite: "Garcia-Argibay et al. 2019"
    },
    {
      id: "creative-reverie", cat: "relax", band: "Alpha", name: "Creative Reverie",
      carrier: 340, beat: 10, minutes: 20, strength: 1,
      desc: "A 10 Hz alpha beat for open-ended idea generation. In Reedijk and colleagues' 2013 study it helped only people whose blink rate pointed to lower dopamine.",
      ev: "Alpha binaural beats improved divergent (but not convergent) thinking. The effect appeared only in participants with lower estimated baseline dopamine; those higher on that measure showed no benefit or slightly worse performance.",
      cite: "Reedijk et al. 2013, Front. Hum. Neurosci."
    },

    /* ---------- TINNITUS ---------- */
    {
      id: "tinnitus-notch", cat: "ther", band: "Alpha + notch", name: "Notched Relief",
      carrier: 250, beat: 8, minutes: 15, strength: 2, notch: true,
      desc: "Pink noise with a one-octave hole cut around your own tinnitus pitch, under an 8 Hz alpha beat. Needs a pitch match first.",
      ev: "Two mechanisms, trialled separately. Removing a one-octave band centred on the individual tinnitus frequency reduced subjective loudness by roughly 30% and lowered tinnitus-related auditory cortex activity after 12 months, an effect attributed to lateral inhibition; it held for tinnitus at or below 8 kHz and not above. The 8 Hz alpha beat on top has weaker support: added to relaxing music for 15 minutes twice a day over 4 weeks, it didn't lower tinnitus handicap more than the music alone, though two subscales favoured it three months later, and added to notched music it gave a larger but not significant drop in annoyance. This is an adjunct, not a cure, and the timescale is weeks of daily use rather than one session.",
      cite: "Okamoto et al. 2010, PNAS \u00b7 Teismann et al. 2011, PLOS One \u00b7 Bakhtarikia et al. 2024 \u00b7 Samaei et al. 2026"
    },

    /* ---------- STIMULATION ---------- */
    {
      id: "vigilance-16", cat: "stim", band: "Beta", name: "Vigilance 16",
      carrier: 400, beat: 16, minutes: 30, strength: 3,
      desc: "A steady 16 Hz beta beat for 30 minutes of watch-keeping work, the lower of the two beta frequencies in Lane and colleagues' 1998 vigilance trial.",
      ev: "In a 30-minute visual vigilance task, 29 people listening to beta beats (16 and 24 Hz, in pink noise) made more correct detections and fewer false alarms than with theta and delta beats (1.5 and 4 Hz), and reported less negative mood. This track plays the 16 Hz beat on its own, which the trial didn't test separately.",
      cite: "Lane et al. 1998, Physiology & Behavior"
    },
    {
      id: "sustained-24", cat: "stim", band: "Beta", name: "Sustained Attention 24",
      carrier: 400, beat: 24, minutes: 30, strength: 3,
      desc: "A steady 24 Hz beta beat for 30 minutes, the higher of the two beta frequencies in Lane and colleagues' 1998 vigilance trial, for tasks your attention keeps drifting away from.",
      ev: "In Lane and colleagues' 30-minute vigilance task, beta beats at 16 and 24 Hz gave more correct detections, fewer false alarms and less negative mood than theta and delta beats. This track plays the 24 Hz beat on its own, which the trial didn't test separately. Beta (about 13 to 30 Hz) is the band studied for alert, active attention, with mixed results since.",
      cite: "Lane et al. 1998, Physiology & Behavior"
    },
    {
      id: "deep-work", cat: "stim", band: "Beta", name: "Deep Work Block",
      carrier: 300, beat: 15, minutes: 50, strength: 2,
      desc: "Fifty minutes of a 15 Hz beta beat, sized to a full work or study block: in the 2019 meta-analysis of binaural beats, longer listening went with larger effects.",
      ev: "Time under exposure contributed significantly to the meta-analytic model, with longer periods advisable for maximum effect. Study-focused guidance converges on 25–50 minute blocks followed by a short break.",
      cite: "Garcia-Argibay et al. 2019"
    },
    {
      id: "gamma-40", cat: "stim", band: "Gamma", name: "Gamma Focus 40",
      carrier: 400, beat: 40, minutes: 25, strength: 2,
      desc: "A 40 Hz gamma beat on a 400 Hz carrier, a pairing that evokes a measurable 40 Hz response in the brain; on carriers above about 3,000 Hz the response disappears.",
      ev: "A 40 Hz binaural-beat auditory steady-state response was evoked with a 400 Hz carrier and was undetectable above ~3000 Hz, which is why the carrier is fixed low here. In attentional-blink training, 40 Hz produced greater improvement than 16 Hz.",
      cite: "Ross & Lopez 2020, Sci. Rep. · Orozco Perez et al. 2020, eNeuro"
    },
    {
      id: "gamma-memory", cat: "stim", band: "Gamma", name: "Working Memory Gamma",
      carrier: 240, beat: 40, minutes: 15, strength: 1,
      desc: "Fifteen minutes of a 40 Hz gamma beat for working-memory tasks. The studies disagree, and a trial of 40 Hz beats found no change at all, so treat it as an experiment.",
      ev: "Across 15 studies, binaural beats improved memory and attention by a medium amount on average, but the individual studies conflicted, especially for theta and beta. For 40 Hz, a trial found no change in either memory scores or EEG and concluded entrainment never occurred. Treat as experimental.",
      cite: "Basu & Banerjee 2023 · Borges et al. 2023"
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

