#!/usr/bin/env python3
"""Assemble the single-file Entrain app.

Inputs (all in this folder):
  legacy.html   the previous one-page version; its feature blocks and script are reused
  styles.css    the app-shell stylesheet (with __POPPINS_BOLD__ placeholder)
  shell.js      router, sheet, dock and Home code, inserted into the main script
  poppins.b64   base64 of the subset Poppins Bold WOFF
Output: ../index.html (one self-contained file, no network requests)
"""
import os, re, sys

HERE = os.path.dirname(os.path.abspath(__file__))
def rd(name): return open(os.path.join(HERE, name), encoding="utf-8").read()

legacy = rd("legacy.html")
css = rd("styles.css").replace("__POPPINS_BOLD__", rd("poppins.b64").strip())
shell = rd("shell.js")
practice = rd("asanas.js") + rd("moves.js") + rd("ambience.js") + rd("quotes.js") + rd("tapping.js") + rd("practice-data.js") + rd("practice.js") + rd("adapt.js") + rd("nvc.js") + rd("yoga.js")
views = rd("views.html")


def element(src, start_marker, tag="div"):
    """Return the complete element that begins at start_marker, matching nested tags."""
    i = src.index(start_marker)
    depth, j = 0, i
    pat = re.compile(r"<(/?)%s\b" % tag)
    for m in pat.finditer(src, i):
        depth += -1 if m.group(1) else 1
        if depth == 0:
            j = src.index(">", m.end()) + 1
            return src[i:j]
    raise ValueError("unbalanced: " + start_marker)


def inner(el):
    return el[el.index(">") + 1: el.rindex("<")]


def between(src, a, b):
    i = src.index(a)
    return src[i:src.index(b, i)]


# ---- blocks reused verbatim from the previous version ----
pats = inner(element(legacy, '<div class="chips" id="bPats"'))
bhead = element(legacy, '<div class="b-head">')
bview = element(legacy, '<div class="b-view" id="bView">')
bline = element(legacy, '<div class="b-line" aria-hidden="true">')
note_to_safety = between(legacy, '<div class="b-note">', '      </div>\n    </div>\n\n    <div class="hr" id="hr"')
hr_panel = element(legacy, '<div class="hr" id="hr" data-state="off">')
prime = element(legacy, '<div class="prime">')
builder = element(legacy, '<div class="builder">')
prose = inner(element(legacy, '<div class="prose">'))
refs = element(legacy, '<ol class="refs">', "ol")
fine = inner(element(legacy, "<footer>", "footer"))
modals = between(legacy, "<!-- ============ HEADPHONE CHECK", "<!-- ============ PLAYER")
player = element(legacy, '<div class="player" id="player">')
script = legacy[legacy.index("<script>") + len("<script>"): legacy.rindex("</script>")]

# ---- small, checked edits to reused markup ----
def sub(s, old, new, count=1):
    n = s.count(old)
    if n != count:
        sys.exit("expected %d of %r, found %d" % (count, old[:60], n))
    return s.replace(old, new)

# the old research intro sentence is replaced by the Learn view's own lede; give headings anchors
for title, anchor in [
    ("How a binaural beat is made", "l-beats"),
    ("Dosing: timing beats frequency-picking", "l-dosing"),
    ("Where the evidence is strongest, and weakest", "l-evidence"),
    ("The tinnitus track works differently", "l-tinnitus"),
    ("Breathing runs on a slower clock", "l-breathing"),
    ("Frequency bands at a glance", "l-bands"),
]:
    prose = sub(prose, "<h3>%s</h3>" % title, '<h3 id="%s">%s</h3>' % (anchor, title))

# background sound: a row in the breathing settings, a picker in the mini player
note_to_safety = sub(note_to_safety, """          <p class="hint">Cues play equally in both ears and sit above the carrier range, so they leave a running binaural beat alone.</p>
        </div>""", """          <p class="hint">Cues play equally in both ears and sit above the carrier range, so they leave a running binaural beat alone.</p>
        </div>

        <div class="prime-row">
          <div class="prime-label">Background sound</div>
          <div class="amb-ctl" data-amb-ctl></div>
          <p class="hint">Summer rain or crickets on a warm night, made on your device. Whatever you pick plays under any session, track or practice.</p>
        </div>""")
player = sub(player, '<label id="noiseLab"><input type="checkbox" id="noise"> <span id="noiseTxt">Pink-noise bed</span></label>',
  '<label id="noiseLab"><input type="checkbox" id="noise"> <span id="noiseTxt">Pink-noise bed</span></label>\n'
  '      <label class="amb-pl"><span>Background</span><select class="amb-sel" aria-label="Background sound"><option value="off">None</option>'
  '<option value="rain">Summer rain</option><option value="crickets">Crickets</option><option value="night">Rain and crickets</option></select></label>')

# the mini player gets a "more" button for phones
player = sub(player,
    '<button class="icon-btn ghost" id="stop" aria-label="Stop session" title="Stop">■</button>',
    '<button class="icon-btn ghost" id="stop" aria-label="Stop session" title="Stop">■</button>\n'
    '      <button class="icon-btn ghost p-more" id="pMore" aria-label="More player options" aria-expanded="false">'
    '<svg class="i" aria-hidden="true"><use href="#i-up"/></svg></button>')
player = sub(player, '<div class="time mono" id="time"', '<div class="time" id="time"')
# volume becomes its own grid cell so the compact phone player can drop it onto a row of its own
vol = element(player, '<div class="vol">')
player = sub(player, vol, "")
ears = element(player, '<div class="ears">')
player = sub(player, ears, "")
player = sub(player, '\n    <div class="toggles">', '\n    ' + vol + '\n\n    ' + ears + '\n\n    <div class="toggles">')

ICONS = {
    "home": '<path d="M4 11.2 12 4.5l8 6.7V19a1.5 1.5 0 0 1-1.5 1.5H15v-6H9v6H5.5A1.5 1.5 0 0 1 4 19z"/>',
    "breathe": '<path d="M2.5 12c2.4-6.5 4.8-6.5 7.2 0s4.8 6.5 7.2 0c1.1-3 2.4-4.4 4.6-4.2"/>',
    "sounds": '<path d="M4 15v-3a8 8 0 0 1 16 0v3"/><path d="M4 14.5h3.2v6H5.5A1.5 1.5 0 0 1 4 19zM20 14.5h-3.2v6h1.7A1.5 1.5 0 0 0 20 19z"/>',
    "heart": '<path d="M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.2a4.3 4.3 0 0 1 7.5 2.6C19.5 15.4 12 20 12 20z"/>',
    "learn": '<path d="M4 5.6A1.6 1.6 0 0 1 5.6 4H11v16H5.6A1.6 1.6 0 0 1 4 18.4zM20 5.6A1.6 1.6 0 0 0 18.4 4H13v16h5.4a1.6 1.6 0 0 0 1.6-1.6z"/>',
    "volume": '<path d="M4 9.5h3.2L11.5 6v12l-4.3-3.5H4z"/><path d="M15 9.5a3.6 3.6 0 0 1 0 5M17.8 7a7.2 7.2 0 0 1 0 10"/>',
    "warn": '<path d="M12 4.2 2.8 19.5h18.4z"/><path d="M12 10v4.2M12 16.9v.1"/>',
    "up": '<path d="M6 14.5l6-6 6 6"/>',
    "target": '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r=".6"/>',
    "bolt": '<path d="M13.2 3 5.5 13.5h5.8L10.4 21l8-10.6h-5.8z"/>',
    "pulse": '<path d="M2.5 12.5h4l2.2-5 4.2 10 2.4-5h6.2"/>',
    "sliders": '<path d="M4 7h9M17 7h3M4 17h3M11 17h9"/><circle cx="15" cy="7" r="2"/><circle cx="9" cy="17" r="2"/>',
    "install": '<rect x="6.5" y="2.8" width="11" height="18.4" rx="2.4"/><path d="M12 7.5v7M9.2 11.8 12 14.6l2.8-2.8"/>',
    "x": '<path d="M6.5 6.5l11 11M17.5 6.5l-11 11"/>',
    "practice": '<circle cx="12" cy="5.2" r="2.1"/><path d="M12 8.3v5.2M7.2 11.6l4.8 2 4.8-2M4.5 18.6c2.4-2.4 4.9-3 7.5-3s5.1.6 7.5 3"/>',
    "moon": '<path d="M19.5 14.6A7.8 7.8 0 0 1 9.4 4.5a7.8 7.8 0 1 0 10.1 10.1z"/>',
    "move": '<circle cx="12" cy="4.6" r="2"/><path d="M12 7.5v7M7 4.5l5 4 5-4M12 14.5l-3.5 6M12 14.5l3.5 6"/>',
    "spark": '<path d="M12 4 3.5 8.5 12 13l8.5-4.5z"/><path d="M3.5 12.5 12 17l8.5-4.5M3.5 16.5 12 21l8.5-4.5"/>',
    "play": '<path d="M8 5.5v13l10.5-6.5z"/>',
    "pause": '<path d="M8.5 5.5v13M15.5 5.5v13"/>',
    "prev": '<path d="M6.5 5.5v13M18 6l-8.5 6 8.5 6z"/>',
    "next": '<path d="M17.5 5.5v13M6 6l8.5 6L6 18z"/>',
    "back": '<path d="M14.5 6l-6 6 6 6"/>',
    "check": '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
    "bell": '<path d="M6.5 16.5V11a5.5 5.5 0 0 1 11 0v5.5l1.5 1.5H5z"/><path d="M10 20.5a2 2 0 0 0 4 0"/>',
    "voice": '<path d="M4.5 6.5a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H11l-4 3.5v-3.5H6.5a2 2 0 0 1-2-2z"/><path d="M8.5 10.5h7"/>',
    "plus": '<path d="M12 5v14M5 12h14"/>',
    "drum": '<path d="M7.5 2.8c5.2 3.6 5.2 14.8 0 18.4"/><path d="M7.5 2.8v18.4"/><circle cx="14.6" cy="15.4" r="3.2"/><path d="M5 9.8l5 1.6"/>',
    "nvc": '<path d="M4.5 6.5a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H11l-4 3.5v-3.5H6.5a2 2 0 0 1-2-2z"/><path d="M12 13.4s-2.9-1.6-2.9-3.6a1.5 1.5 0 0 1 2.9-.6 1.5 1.5 0 0 1 2.9.6c0 2-2.9 3.6-2.9 3.6z"/>',
    "rain": '<path d="M7.2 14.8a3.9 3.9 0 0 1 .4-7.8 5.2 5.2 0 0 1 10 1.6 3.1 3.1 0 0 1-.4 6.2z"/><path d="M8.5 18l-.9 2.4M12.4 18l-.9 2.4M16.3 18l-.9 2.4"/>',
}
sprite = '<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false">\n' + "\n".join(
    '  <symbol id="i-%s" viewBox="0 0 24 24">%s</symbol>' % (k, v) for k, v in ICONS.items()) + "\n</svg>"

def ic(name, cls="i"):
    return '<svg class="%s" aria-hidden="true"><use href="#i-%s"/></svg>' % (cls, name)

def nav_link(view, label):
    return '<a href="#%s" data-view="%s"><span class="ni">%s</span><span>%s</span></a>' % (view, view, ic(view), label)

# ---- the Practice and session views ----
views_html = views
for k, name in [("x", "x"), ("prev", "prev"), ("pause", "pause"), ("next", "next"), ("voice", "voice"), ("bell", "bell"), ("volume", "volume"), ("back", "back"), ("play", "play"), ("drum", "drum"), ("rain", "rain")]:
    views_html = views_html.replace("{" + k + "}", ic(name))
assert "{" not in views_html, "unfilled placeholder in views.html"

learn_practices = """
            <h3 id="l-practices">Guided practices and programs</h3>
            <p>
              The Practice tab adds guided sessions beyond paced breathing. They differ a lot in how well they're
              supported, so here is the evidence as it stands.
            </p>
            <p>
              <b>Mindfulness.</b> Across 47 randomised trials with active controls, mindfulness meditation programs had
              moderate evidence for easing anxiety (effect size <span class="mono">0.38</span> at eight weeks), depression
              (<span class="mono">0.30</span>) and pain (<span class="mono">0.33</span>), and low evidence for stress; they
              didn't beat other active treatments such as exercise or therapy (Goyal et al., 2014). Anapana, the breath
              observation that opens a Vipassana course, belongs here: after the ten-day course, a community sample reported
              lower stress and higher well-being, partly kept at six months (Szekeres &amp; Wertheim, 2015). The body scan on
              its own has weaker support. A meta-analysis of about 15 trials found a small gain in mindfulness
              (<span class="mono">g&nbsp;=&nbsp;0.27</span>) and no clear effect on stress (Gan et al., 2022). A body-scan-based
              yoga nidra practice reduced stress slightly over two months, and its 30-minute version reduced sleep
              disturbance (Moszeik et al., 2025).
            </p>
            <p>
              <b>Kindness practices.</b> Loving-kindness meditation had medium effects on daily positive emotions across 24
              studies (Zeng et al., 2015). Self-compassion programs reduced rumination, stress, anxiety and depression across
              27 randomised trials (Ferrari et al., 2019). The five-minute self-compassion break is their best-known single
              exercise, but it hasn't been tested on its own.
            </p>
            <p>
              <b>Yoga and walking.</b> In 42 randomised trials, practices that included yoga postures lowered evening and
              waking cortisol, ambulatory blood pressure and resting heart rate, and raised high-frequency heart-rate
              variability compared with active controls (Pascoe et al., 2017). Walking itself reduced depressive symptoms
              across 75 trials (Xu et al., 2024). The routine builder draws on a movement library of 56 poses and moves:
              36 common asanas plus stretches, mobility drills and basic capoeira, each with its own drawing (animated for
              the moving ones), spoken cues and cautions. The evidence is for yoga practice in general rather than for any
              particular sequence, so build what suits your body and skip anything that hurts.
            </p>
            <p>
              <b>Pranayama.</b> Most of this evidence comes from small physiological studies. Alternate nostril breathing
              lowered systolic blood pressure and raised a vagal heart-rate-variability measure in 26 men (Telles et al.,
              2014), though an earlier study found no clear change (Raghuraj et al., 1998). Humming raised nasal nitric oxide
              about 15-fold (Weitzberg &amp; Lundberg, 2002), and raised heart-rate variability as much as slow breathing in a
              16-person pilot (Woo &amp; Kim, 2025). For beginners, slow breathing with equal in- and out-breaths improved
              baroreflex sensitivity most. Adding the ujjayi throat sound to both phases cancelled that gain, while ujjayi on
              the out-breath only kept it, which is how the Ujjayi practice here is set up (Mason et al., 2013). Kapalabhati
              works the other way, shifting heart-rate variability toward sympathetic activity (Raghuraj et al., 1998). It is
              an energiser with real contraindications, and fast breathwork is the least-studied corner of the field
              (Fincham et al., 2023).
            </p>
            <p>
              <b>Wim Hof breathing.</b> Rounds of deep breathing followed by a hold on empty lungs are the best-studied fast
              breathing. In a controlled endotoxin study, men trained in the method (breathing, cold and meditation) released
              more adrenaline and had a weaker inflammatory response and fewer flu-like symptoms than untrained men (Kox et al.,
              2014). A follow-up found the breathing alone produced the anti-inflammatory effect, and cold added to it (Zwaag
              et al., 2022). A 2024 systematic review of eight small trials rated the risk of bias high and the evidence too
              thin to recommend the method yet (Almahayni &amp; Hammond, 2024). The deep breathing lowers carbon dioxide, which
              delays the urge to breathe during the hold, and fainting is possible. In water that can be fatal, so the
              practice here is for sitting or lying down only, its hold ends by itself at three minutes, and it starts only
              after you confirm the cautions.
            </p>
            <p>
              <b>Relaxation and sleep.</b> In a randomised comparison, progressive muscle relaxation increased felt
              relaxation and gave a steady physiological relaxation trend, while deep breathing briefly raised arousal first
              (Toussaint et al., 2021). Relaxation training is a conditionally recommended treatment for chronic insomnia
              (Edinger et al., 2021). Twenty minutes of slow breathing at six a minute before bed shortened the time to fall
              asleep and reduced night waking in people with self-reported insomnia (Tsai et al., 2015). The cognitive shuffle
              has only a conference study behind it so far (Beaudoin et al., 2016), and 5-4-3-2-1 grounding is a clinical
              tool with no direct trials.
            </p>
            <p>
              <b>Why combine them?</b> Each program pairs techniques whose evidence points at the same goal at the same
              moment. Sleep Descent joins a delta-bound beat with slow pre-sleep breathing. Calm Reset pairs alpha-to-theta
              beats with cyclic sighs and resonance breathing. Focus Primer puts a beta prime after brief heart-rate-variability
              breathing, which improved reaction times and accuracy on a stressful Stroop task (Prinsloo et al., 2011).
              Exercise Recovery joins theta beats with slow breathing after training (McConnell et al., 2014; Sugimoto et al.,
              2025). Anapana reminders can be added to any program: every few minutes, a quiet prompt brings attention back
              to the breath at the nostrils, the anchor of breath-awareness practice. No study has tested these combinations as packages, and a large 2023 trial found four weeks of coherent
              breathing didn't beat a placebo pace on self-reported stress (Fincham, Strauss &amp; Cavanagh, 2023). A heart
              sensor is the honest check: each session ends with your own heart-rate change and coherence, so you can see
              what works for you.
            </p>
            <p>
              <b>Stretching and mobility.</b> In a randomised trial with 134 workers at a logistics company, ten minutes of
              stretching after work for three months lowered anxiety compared with no programme, a moderate effect
              (partial <span class="mono">&eta;&sup2;&nbsp;=&nbsp;0.06</span>), and eased bodily pain and exhaustion
              (Montero-Mar&iacute;n et al., 2013). The Morning and Evening Stretch routines use the same kind of simple,
              everyday stretches, but haven't been tested themselves.
            </p>
            <p>
              <b>Capoeira.</b> A 2025 systematic review found 19 studies of capoeira and health. Benefits for mental and social
              outcomes, such as attention, self-confidence, resilience and less aggression, were clearer than for physical health,
              where results for fitness, balance and bone density were inconclusive. Robust trials are still lacking, and most
              of the studies come from Portuguese-speaking countries (K&ouml;hler et al., 2025). Solo Capoeira teaches the basics
              on your own, to a synthesized berimbau playing the Angola rhythm.
            </p>
            <p>
              <b>Tapping.</b> Emotional Freedom Techniques (EFT) pair tapping on acupressure points with attention on the problem
              and a self-acceptance statement. A review by the method's leading researchers counted 56 randomised trials, for
              conditions from anxiety and depression to pain and insomnia (Church et al., 2022). An independent 2025 review of
              seven trials in anxiety found reductions against no treatment and results similar to breathing or muscle
              relaxation, but couldn't pool the trials and judged most at some risk of bias (Choi et al., 2025). Whether the
              tapping itself matters is the weak point: in the three studies that could be pooled, real points did better than
              sham or no tapping by a moderate, borderline-significant margin
              (<span class="mono">d&nbsp;=&nbsp;&minus;0.47</span>, 95% CI &minus;0.94 to 0.0; Church et al., 2018). The nine
              points here are the standard ones: the side of the hand, then the top of the head, eyebrow, side of the eye,
              under the eye, under the nose, chin, collarbone and under the arm.
            </p>
            <p>
              <b>Naps.</b> After a short night, a 10-minute afternoon nap improved alertness and performance straight away, with
              some gains lasting about two and a half hours. A 20-minute nap helped from about half an hour after waking, and a
              30-minute nap brought a spell of grogginess first (Brooks &amp; Lack, 2006). Heart rate drops at each transition from
              waking into light sleep and rises again with brief arousals (Burgess et al., 1999), which is what the Power Nap's
              sleep estimate relies on. It can't see sleep stages, so treat it as a guide.
            </p>
            <p>
              <b>Heart-led beats.</b> This program is an experiment that turns your heart data into sound, the idea behind
              biofeedback: as your heart rate settles below your baseline and its variability and coherence rise, the binaural
              beat glides from alpha toward theta. No study has tested binaural beats driven by the heart, and the rule is
              Entrain's own, so the chart at the end, your heart rate with the beat drawn over it, is the honest test.
            </p>
            <p>
              <b>Nonviolent communication.</b> Marshall Rosenberg's method separates four things that usually blur together:
              what happened, what you feel, what you need, and what you'd like to ask for (Rosenberg, 2015). The two Reflection
              practices turn it inward. Judgments, labels and &ldquo;shoulds&rdquo; are read as signs of needs that aren't being
              met, and as rules you may have absorbed without choosing them, so questioning one becomes a small, personal kind of
              ideology critique. Research on NVC itself is early: in a randomised study with 312 medical students, two and a half
              days of training raised self-rated empathy three months later, though not other measures of empathy
              (Epinat-Duclos et al., 2021), and a 2025 review of 15 mostly uncontrolled studies found gains in empathy alongside
              weak methods (Pereira &amp; Durgante, 2025). The parts the practices lean on are better studied. Putting feelings
              into words dampens their intensity (Torre &amp; Lieberman, 2018); people who tell their emotions apart more
              precisely are less likely to cope in harmful ways when distressed (Kashdan et al., 2015), which is what the
              feelings wheel is for: 88 words in 11 families, to get from &ldquo;bad&rdquo; to &ldquo;discouraged&rdquo; or
              &ldquo;resentful&rdquo;; writing about difficult
              experiences has a small but reliable benefit across 146 randomised studies (Frattaroli, 2006); and in
              self-determination theory, acting from your own values goes with more well-being than acting from pressure, guilt
              or the need for approval (Ryan &amp; Deci, 2000). What you write stays on your device, and you can keep nothing at
              all. The closing line paraphrases Carl Rogers's observation in <em>On Becoming a Person</em> (1961) that accepting
              yourself as you are is what makes change possible.
            </p>
            <p>
              <b>Background sound and quotes.</b> Summer rain and crickets are synthesized on your device, like the pink-noise
              bed, and are there for comfort: masking sounds didn't weaken binaural beat effects in the research above. The
              quotes come from public-domain translations (George Long's Marcus Aurelius and Epictetus, Richard Gummere's Seneca,
              Max M&uuml;ller's Dhammapada and James Legge's Tao Te Ching) and Thoreau's <em>Walden</em>. Carl Rogers's line is
              a paraphrase, since his book is still in copyright, and the lines without a name are Entrain's own.
            </p>"""

NEW_REFS = [
    ("Goyal, M., Singh, S., Sibinga, E. M. S., et al. (2014). Meditation programs for psychological stress and well-being: a systematic review and meta-analysis. <em>JAMA Internal Medicine</em>, 174(3), 357–368.", "https://pubmed.ncbi.nlm.nih.gov/24395196/", "PubMed"),
    ("Szekeres, R. A., &amp; Wertheim, E. H. (2015). Evaluation of Vipassana meditation course effects on subjective stress, well-being, self-kindness and mindfulness in a community sample: post-course and 6-month outcomes. <em>Stress and Health</em>.", "https://doi.org/10.1002/smi.2562", "DOI"),
    ("Gan, R., Zhang, L., &amp; Chen, S. (2022). The effects of body scan meditation: a systematic review and meta-analysis. <em>Applied Psychology: Health and Well-Being</em>.", "https://doi.org/10.1111/aphw.12366", "DOI"),
    ("Moszeik, E. N., Rohleder, N., &amp; Renner, K.-H. (2025). The effects of an online yoga nidra meditation on subjective well-being and diurnal salivary cortisol: a randomised controlled trial. <em>Stress and Health</em>.", "https://doi.org/10.1002/smi.70049", "DOI"),
    ("Zeng, X., Chiu, C. P. K., Wang, R., Oei, T. P. S., &amp; Leung, F. Y. K. (2015). The effect of loving-kindness meditation on positive emotions: a meta-analytic review. <em>Frontiers in Psychology</em>, 6, 1693.", "https://doi.org/10.3389/fpsyg.2015.01693", "DOI"),
    ("Ferrari, M., Hunt, C., Harrysunker, A., Abbott, M. J., Beath, A. P., &amp; Einstein, D. A. (2019). Self-compassion interventions and psychosocial outcomes: a meta-analysis of RCTs. <em>Mindfulness</em>, 10, 1455–1473.", "https://acuresearchbank.acu.edu.au/item/87545/self-compassion-interventions-and-psychosocial-outcomes-a-meta-analysis-of-rcts", "ACU"),
    ("Pascoe, M. C., Thompson, D. R., &amp; Ski, C. F. (2017). Yoga, mindfulness-based stress reduction and stress-related physiological measures: a meta-analysis. <em>Psychoneuroendocrinology</em>, 86, 152–168.", "https://doi.org/10.1016/j.psyneuen.2017.08.008", "DOI"),
    ("Xu, Z., Zheng, X., Ding, H., et al. (2024). The effect of walking on depressive and anxiety symptoms: systematic review and meta-analysis. <em>JMIR Public Health and Surveillance</em>, 10, e48355.", "https://publichealth.jmir.org/2024/1/e48355", "JMIR"),
    ("Telles, S., Sharma, S. K., &amp; Balkrishna, A. (2014). Blood pressure and heart rate variability during yoga-based alternate nostril breathing practice and breath awareness. <em>Medical Science Monitor Basic Research</em>, 20, 184–193.", "https://basic.medscimonit.com/abstract/full/idArt/892063", "MSM"),
    ("Raghuraj, P., Ramakrishnan, A. G., Nagendra, H. R., &amp; Telles, S. (1998). Effect of two selected yogic breathing techniques on heart rate variability. <em>Indian Journal of Physiology and Pharmacology</em>, 42(4), 467–472.", "https://ijpp.com/IJPP%20archives/1998_42_4/467-472.pdf", "PDF"),
    ("Weitzberg, E., &amp; Lundberg, J. O. N. (2002). Humming greatly increases nasal nitric oxide. <em>American Journal of Respiratory and Critical Care Medicine</em>, 166(2), 144–145.", "https://doi.org/10.1164/rccm.200202-138BC", "DOI"),
    ("Woo, M., &amp; Kim, T. (2025). Effects of slow-paced breathing and humming breathing on heart rate variability and affect: a pilot investigation. <em>Physiology &amp; Behavior</em>.", "https://doi.org/10.1016/j.physbeh.2025.114972", "DOI"),
    ("Mason, H., Vandoni, M., Debarbieri, G., Codrons, E., Ugargol, V., &amp; Bernardi, L. (2013). Cardiovascular and respiratory effect of yogic slow breathing in the yoga beginner: what is the best approach? <em>Evidence-Based Complementary and Alternative Medicine</em>, 2013, 743504.", "https://doi.org/10.1155/2013/743504", "DOI"),
    ("Toussaint, L., Nguyen, Q. A., Roettger, C., et al. (2021). Effectiveness of progressive muscle relaxation, deep breathing, and guided imagery in promoting psychological and physiological states of relaxation. <em>Evidence-Based Complementary and Alternative Medicine</em>, 2021, 5924040.", "https://doi.org/10.1155/2021/5924040", "DOI"),
    ("Edinger, J. D., Arnedt, J. T., Bertisch, S. M., et al. (2021). Behavioral and psychological treatments for chronic insomnia disorder in adults: an American Academy of Sleep Medicine clinical practice guideline. <em>Journal of Clinical Sleep Medicine</em>, 17(2), 255–262.", "https://doi.org/10.5664/jcsm.8986", "DOI"),
    ("Tsai, H. J., Kuo, T. B. J., Lee, G.-S., &amp; Yang, C. C. H. (2015). Efficacy of paced breathing for insomnia: enhances vagal activity and improves sleep quality. <em>Psychophysiology</em>, 52(3), 388–396.", "https://hub.tmu.edu.tw/en/publications/efficacy-of-paced-breathing-for-insomnia-enhances-vagal-activity-/", "TMU"),
    ("Beaudoin, L. P., et al. (2016). Serial diverse imagining task: a new remedy for bedtime complaints of worrying and other sleep-disruptive mental activity. Abstract, <em>SLEEP 2016</em> meeting.", "https://sleepreviewmag.com/sleep-health/parameters/quality/need-better-sleep-consider-cognitive-shuffle/", "Report"),
    ("Prinsloo, G. E., Rauch, H. G. L., Lambert, M. I., Muench, F., Noakes, T. D., &amp; Derman, W. E. (2011). The effect of short duration heart rate variability (HRV) biofeedback on cognitive performance during laboratory induced cognitive stress. <em>Applied Cognitive Psychology</em>, 25(5).", "https://doi.org/10.1002/acp.1750", "DOI"),
    ("Sugimoto, T., Sugiyama, K., Matsumura, K., Michiue, K., Ono, K., &amp; Ishikawa, A. (2025). Effects of consciously controlled slow breathing on cardiac parasympathetic nervous activity postexercise in young healthy males. <em>Clinical Physiology and Functional Imaging</em>, 45(2), e70007.", "https://doi.org/10.1111/cpf.70007", "DOI"),
    ("Kox, M., van Eijk, L. T., Zwaag, J., et al. (2014). Voluntary activation of the sympathetic nervous system and attenuation of the innate immune response in humans. <em>Proceedings of the National Academy of Sciences</em>, 111(20), 7379–7384.", "https://pubmed.ncbi.nlm.nih.gov/24799686/", "PubMed"),
    ("Zwaag, J., Naaktgeboren, R., van Herwaarden, A. E., Pickkers, P., &amp; Kox, M. (2022). The effects of cold exposure training and a breathing exercise on the inflammatory response in humans: a pilot study. <em>Psychosomatic Medicine</em>, 84(4).", "https://ifp.nyu.edu/2024/journal-article-abstracts/the_effects_of_cold_exposure_training_and_a-8-aspx/", "Abstract"),
    ("Almahayni, O., &amp; Hammond, L. (2024). Does the Wim Hof Method have a beneficial impact on physiological and psychological outcomes in healthy and non-healthy participants? A systematic review. <em>PLOS ONE</em>, 19(3), e0286933.", "https://doi.org/10.1371/journal.pone.0286933", "DOI"),
    ("Montero-Mar&iacute;n, J., As&uacute;n, S., Estrada-Marc&eacute;n, N., Romero, R., &amp; As&uacute;n, R. (2013). Effectiveness of a stretching program on anxiety levels of workers in a logistic platform: a randomized controlled study. <em>Atenci&oacute;n Primaria</em>, 45(7), 376–383.", "https://doi.org/10.1016/j.aprim.2013.03.002", "DOI"),
    ("K&ouml;hler, R., Anheyer, D., Koch, S., &amp; Ostermann, T. (2025). Capoeira and its effects on health-related outcomes: a systematic review. <em>Journal of Integrative and Complementary Medicine</em>, 31(9), 780–788.", "https://doi.org/10.1089/jicm.2024.0490", "DOI"),
    ("Church, D., Stapleton, P., Vasudevan, A., &amp; O'Keefe, T. (2022). Clinical EFT as an evidence-based practice for the treatment of psychological and physiological conditions: a systematic review. <em>Frontiers in Psychology</em>, 13, 951451.", "https://doi.org/10.3389/fpsyg.2022.951451", "DOI"),
    ("Church, D., Stapleton, P., Yang, A., &amp; Gallo, F. (2018). Is tapping on acupuncture points an active ingredient in Emotional Freedom Techniques? A systematic review and meta-analysis of comparative studies. <em>Journal of Nervous and Mental Disease</em>, 206(10), 783–793.", "https://doi.org/10.1097/NMD.0000000000000878", "DOI"),
    ("Choi, S. H., Sung, S. H., &amp; Lee, G. (2025). Emotional Freedom Techniques for anxiety disorders: a systematic review. <em>Healthcare</em>, 13(17), 2180.", "https://doi.org/10.3390/healthcare13172180", "DOI"),
    ("Brooks, A., &amp; Lack, L. (2006). A brief afternoon nap following nocturnal sleep restriction: which nap duration is most recuperative? <em>Sleep</em>, 29(6), 831–840.", "https://doi.org/10.1093/sleep/29.6.831", "DOI"),
    ("Burgess, H. J., Kleiman, J., &amp; Trinder, J. (1999). Cardiac activity during sleep onset. <em>Psychophysiology</em>, 36(3), 298–306.", "https://resolve.cambridge.org/core/journals/psychophysiology/article/abs/cardiac-activity-during-sleep-onset/22D1E5132EB39C0B98CC80F4C8620490", "Cambridge"),
    ("Rosenberg, M. B. (2015). <em>Nonviolent Communication: A Language of Life</em> (3rd ed.). PuddleDancer Press.", "https://catalog.nols.org/Record/645776", "Catalog"),
    ("Epinat-Duclos, J., Foncelle, A., Quesque, F., Chabanat, E., Duguet, A., Van der Henst, J.-B., &amp; Rossetti, Y. (2021). Does nonviolent communication education improve empathy in French medical students? <em>International Journal of Medical Education</em>, 12, 205–218.", "https://doi.org/10.5116/ijme.615e.c507", "DOI"),
    ("Pereira, J. S., &amp; Durgante, H. B. (2025). Interventions in nonviolent communication to promote empathy: integrative review. <em>Revista Brasileira em Promo&ccedil;&atilde;o da Sa&uacute;de</em>, 38, 1–14.", "https://doi.org/10.5020/18061230.2025.16464", "DOI"),
    ("Torre, J. B., &amp; Lieberman, M. D. (2018). Putting feelings into words: affect labeling as implicit emotion regulation. <em>Emotion Review</em>, 10(2), 116–124.", "https://doi.org/10.1177/1754073917742706", "DOI"),
    ("Kashdan, T. B., Barrett, L. F., &amp; McKnight, P. E. (2015). Unpacking emotion differentiation. <em>Current Directions in Psychological Science</em>, 24(1).", "https://doi.org/10.1177/0963721414550708", "DOI"),
    ("Frattaroli, J. (2006). Experimental disclosure and its moderators: a meta-analysis. <em>Psychological Bulletin</em>, 132(6), 823–865.", "https://doi.org/10.1037/0033-2909.132.6.823", "DOI"),
    ("Ryan, R. M., &amp; Deci, E. L. (2000). Self-determination theory and the facilitation of intrinsic motivation, social development, and well-being. <em>American Psychologist</em>, 55(1), 68–78.", "https://doi.org/10.1037/0003-066X.55.1.68", "DOI"),
    ("Fincham, G. W., Strauss, C., &amp; Cavanagh, K. (2023). Effect of coherent breathing on mental health and wellbeing: a randomised placebo-controlled trial. <em>Scientific Reports</em>, 13.", "https://doaj.org/article/21a326834cdb4a7fbd35bc10ec8509f0", "DOAJ"),
]
refs = sub(refs, "</ol>", "".join('\n      <li>%s <a href="%s" rel="noopener">%s</a></li>' % r for r in NEW_REFS) + "\n    </ol>")

body = f"""
{sprite}

<div class="app">
  <aside class="rail">
    <a class="brand" href="#home" aria-label="Entrain home"><span class="brand-mark" aria-hidden="true"></span><span class="brand-name">Entrain</span></a>
    <nav class="nav" aria-label="Sections">
      {nav_link("home", "Home")}
      {nav_link("practice", "Practice")}
      {nav_link("breathe", "Breathe")}
      {nav_link("sounds", "Sounds")}
      {nav_link("heart", "Heart")}
      {nav_link("learn", "Learn")}
    </nav>
    <p class="rail-foot">Everything runs on your device. Nothing is recorded or sent anywhere, and it keeps working offline.</p>
  </aside>

  <div class="main">
    <header class="topbar">
      <span class="brand-mark top-mark" aria-hidden="true"></span>
      <h1 id="viewTitle">Home</h1>
      <div class="top-actions">
        <a class="pill pill-prac" id="tbPrac" href="#practice" hidden>{ic("practice")}<span id="tbPracTxt"></span></a>
        <a class="pill" id="tbSensor" href="#heart" data-state="off"><i class="dot hr-dot" aria-hidden="true"></i><span id="tbSensorTxt">Connect sensor</span></a>
      </div>
    </header>

    <main id="views">

      <!-- ============ HOME ============ -->
      <section class="view" id="v-home" aria-labelledby="viewTitle">
        <div class="home-hero">
          <div>
            <h2 id="homePat">Resonance 5.5</h2>
            <p id="homePatTxt">5.5 breaths a minute: in for 5.5 s, out for 5.5 s. A 5-minute session.</p>
            <div class="home-actions">
              <button class="btn primary b-go" id="homeStart">Start breathing</button>
              <button class="btn" data-go="breathe">Change pattern</button>
            </div>
          </div>
          <div class="home-wave" aria-hidden="true"><canvas id="homeWave"></canvas></div>
        </div>

        <div class="suggest" id="homeSuggest">
          <span class="sg-ic">{ic("practice")}</span>
          <div class="sg-t"><span class="sg-when" id="sgWhen">Suggested</span><b id="sgName">Practice</b><span id="sgTxt"></span></div>
          <div class="sg-act"><a class="btn primary small" id="sgGo" href="#practice">Open</a><a class="btn small" href="#practice">All practices</a></div>
        </div>

        <figure class="quote home-quote" id="homeQuote">
          <blockquote id="qTxt"></blockquote>
          <figcaption><span id="qBy"></span><button class="btn small q-next" id="qNext">Another</button></figcaption>
        </figure>

        <div class="install" id="installCard" hidden>
          <span class="inst-ic">{ic("install")}</span>
          <div class="inst-txt"><b>Install Entrain as an app</b><span id="installTxt">It opens from your home screen in its own window and works without a connection.</span></div>
          <div class="inst-act"><button class="btn primary small" id="installBtn">Install</button><button class="btn small" id="installLater">Not now</button></div>
        </div>

        <div class="quick">
          <button class="qk" data-go="heart" style="--qc:var(--hr)"><span class="qi">{ic("target")}</span><b>Find your resonance rate</b><span id="qkFind">A 10-minute test with a heart sensor</span></button>
          <button class="qk" data-go="sounds" data-seg="prime" style="--qc:var(--stim)"><span class="qi">{ic("bolt")}</span><b>Prime before work</b><span id="qkPrime">10 min of 14 Hz beta, then start work</span></button>
          <button class="qk" data-go="sounds" data-seg="tracks" style="--qc:var(--relax)"><span class="qi">{ic("sounds")}</span><b>Listen to a track</b><span id="qkTracks">12 tracks for sleep, calm, focus and tinnitus</span></button>
          <button class="qk" data-go="heart" style="--qc:var(--accent)"><span class="qi">{ic("pulse")}</span><b id="qkSensorT">Heart sensor</b><span id="qkSensor">Not connected</span></button>
        </div>

        <div class="home-cols">
          <div class="note-card">
            <h3>Last session</h3>
            <p id="homeLast">After you breathe with a heart sensor connected, a summary of the session appears here.</p>
            <div class="when" id="homeLastWhen"></div>
          </div>
          <div class="note-card">
            <h3>Before you start</h3>
            <ul class="safety">
              <li>{ic("sounds")}<span><b>Use headphones for the beats.</b> On speakers the two tones mix in the air and the binaural beat disappears.</span></li>
              <li>{ic("volume")}<span><b>Keep it quiet.</b> Beats come through best at a low, comfortable level.</span></li>
              <li class="warn">{ic("warn")}<span><b>Not for everyone.</b> Avoid the beats if you have epilepsy or a seizure disorder, wear a pacemaker, or are driving or operating machinery. This is not a medical device.</span></li>
            </ul>
          </div>
        </div>
      </section>

{views_html}
      <!-- ============ BREATHE ============ -->
      <section class="view" id="v-breathe" aria-labelledby="viewTitle" hidden>
        <div class="breath">
          <div class="b-stage" id="bStage" data-phase="ready">
            <div class="b-locknote" id="bLockNote" hidden><span id="bLockTxt"></span><button class="btn small primary" id="bLockBtn">Return to practice</button></div>
            <div class="chips b-patrow" id="bPats" role="radiogroup" aria-label="Breathing pattern">{pats}</div>
            {bhead}
            {bview}
            {bline}
            <div class="b-transport">
              <button class="btn primary b-go" id="bStart">Start breathing</button>
              <button class="btn b-adjust" id="bAdjust" aria-controls="bPanel" aria-expanded="false">{ic("sliders")}Adjust</button>
              <button class="btn" id="bReset" disabled>Reset</button>
              <button class="btn" id="bFocus">Focus view</button>
              <span class="b-msg" id="bMsg" role="status"></span>
            </div>
            <div class="b-sensor" id="bSensorRow">
              {ic("pulse")}
              <span id="bSensorTxt">Connect a heart sensor to watch your heart rate follow your breath.</span>
              <button class="btn small" id="bSensorBtn" data-act="connect">Connect sensor</button>
            </div>
            <div class="visually-hidden" id="bLive" aria-live="polite"></div>
          </div>

          <div class="b-controls" id="bPanel" aria-label="Breathing settings">
            <div class="sheet-head"><h2>Breathing settings</h2><button class="btn small" id="bPanelDone">Done</button></div>
            {note_to_safety}
          </div>
        </div>
        <div class="sheet-back" id="sheetBack" hidden></div>
      </section>

      <!-- ============ SOUNDS ============ -->
      <section class="view" id="v-sounds" aria-labelledby="viewTitle" hidden>
        <div class="seg" role="tablist" aria-label="Sound sessions">
          <button class="seg-b" role="tab" id="sg-tracks" data-seg="tracks" aria-controls="sp-tracks" aria-selected="true">Tracks</button>
          <button class="seg-b" role="tab" id="sg-prime" data-seg="prime" aria-controls="sp-prime" aria-selected="false" tabindex="-1">Prime, then work</button>
          <button class="seg-b" role="tab" id="sg-build" data-seg="build" aria-controls="sp-build" aria-selected="false" tabindex="-1">Build your own</button>
        </div>

        <div class="notice-strip">
          <div class="ns">{ic("sounds")}<span><b>Headphones on.</b> Each ear gets its own tone; on speakers they mix and the beat disappears.</span><button class="btn small" id="scOpen2">Check headphones</button></div>
          <div class="ns">{ic("volume")}<span><b>Keep it quiet.</b> Beats come through best at a low, comfortable level.</span></div>
          <div class="ns warn">{ic("warn")}<span><b>Not for everyone.</b> Avoid with epilepsy or a seizure disorder, a pacemaker, or while driving or operating machinery. Not a medical device.</span></div>
        </div>

        <div class="seg-panel" id="sp-tracks" role="tabpanel" aria-labelledby="sg-tracks">
          <div class="toolbar" id="tracks">
            <div class="tabs" role="tablist" aria-label="Filter tracks">
              <button class="tab" role="tab" aria-selected="true" data-filter="all">All</button>
              <button class="tab" role="tab" aria-selected="false" data-filter="relax">Relaxation &amp; sleep</button>
              <button class="tab" role="tab" aria-selected="false" data-filter="stim">Stimulation &amp; focus</button>
              <button class="tab" role="tab" aria-selected="false" data-filter="ther">Tinnitus</button>
            </div>
            <div class="count" id="count"></div>
          </div>
          <ul class="grid" id="grid"></ul>
        </div>

        <div class="seg-panel" id="sp-prime" role="tabpanel" aria-labelledby="sg-prime" hidden>
          <p class="v-lede">
            The clearest finding in the meta-analysis is about timing: listening before a task, or before and during it,
            beat listening only while you work. Prime first, get a cue when the block ends, then start.
          </p>
          {prime}
        </div>

        <div class="seg-panel" id="sp-build" role="tabpanel" aria-labelledby="sg-build" hidden>
          <p class="v-lede">
            Pick any beat and carrier. Beats come through most clearly on carriers between about 200 and 500&nbsp;Hz,
            and the effect breaks down once the two tones are more than 30 to 35&nbsp;Hz apart.
          </p>
          {builder}
        </div>
      </section>

      <!-- ============ HEART ============ -->
      <section class="view" id="v-heart" aria-labelledby="viewTitle" hidden>
        {hr_panel}
      </section>

      <!-- ============ LEARN ============ -->
      <section class="view" id="v-learn" aria-labelledby="viewTitle" hidden>
        <div class="learn">
          <nav class="toc" aria-label="On this page">
            <a href="#l-beats">How a beat is made</a>
            <a href="#l-dosing">Timing and dose</a>
            <a href="#l-evidence">Strongest evidence</a>
            <a href="#l-tinnitus">The tinnitus track</a>
            <a href="#l-breathing">Breathing and heart</a>
            <a href="#l-bands">Frequency bands</a>
            <a href="#l-practices">Guided practices</a>
            <a href="#references">References</a>
          </nav>
          <article class="prose" id="science">
            <h2>What the research supports</h2>
            <p class="v-lede">Real but modest effects: decent evidence for anxiety and attention, weaker and noisier evidence for memory.</p>
            {prose}
{learn_practices}
            <section class="refs-sec" id="references">
              <h3>References</h3>
              {refs}
            </section>
            <div class="fineprint">{fine}</div>
          </article>
        </div>
      </section>

    </main>
  </div>
</div>

{modals}
<!-- ============ MINI PLAYER ============ -->
{player}

<div class="toast" id="toast" role="status" aria-live="polite" hidden>
  <span id="toastTxt"></span>
  <button class="btn small primary" id="toastAct" hidden></button>
  <button class="toast-x" id="toastX" aria-label="Dismiss">{ic("x")}</button>
</div>
"""

# ---- patches to the existing script ----
s = script
s = sub(s, """  var B_SANS = 'ui-sans-serif,-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif';
  var B_MONO = 'ui-monospace,SFMono-Regular,Menlo,Consolas,"Liberation Mono",monospace';""",
"""  var B_SANS = 'system-ui,-apple-system,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif';
  var B_MONO = '"Entrain Display",system-ui,-apple-system,"Segoe UI",Roboto,sans-serif';   // the big countdown digits""")
# the resonance test and its result now switch to the Breathe view instead of scrolling
s = sub(s, """    try { $("#bStage").scrollIntoView({ behavior: RM ? "auto" : "smooth", block: "start" }); } catch (e) {}""",
        """    goView("breathe");""", count=2)
# keep the last session summary for Home
s = sub(s, """    el.textContent = "Last session: " + parts.join(", ") + ".";
    el.hidden = false;""",
"""    el.textContent = "Last session: " + parts.join(", ") + ".";
    el.hidden = false;
    store.set("lastSummary", JSON.stringify({ at: Date.now(), text: el.textContent }));""")
# show resonance-test progress on the Breathe view too
s = sub(s, """      bSetT("#hrFindWhen", "Pace " + (F.idx + 1) + " of " + FIND_RATES.length + " · " + FIND_RATES[F.idx] + " /min · " + fmt(left) + " left");""",
"""      bSetT("#hrFindWhen", "Pace " + (F.idx + 1) + " of " + FIND_RATES.length + " · " + FIND_RATES[F.idx] + " /min · " + fmt(left) + " left");
      bSetT("#bMsg", "Resonance test, pace " + (F.idx + 1) + " of " + FIND_RATES.length + ": " + FIND_RATES[F.idx] + " a minute, " + fmt(left) + " left");""")
# mirror sensor state in the shell every time the heart tiles refresh
s = sub(s, """    cohShow();
    guideCheck();
  }""", """    cohShow();
    guideCheck();
    shellSensor();
  }""")
# on a phone the Heart view's live tiles sit below the guide, so a guide that opened by
# itself folds away once a sensor connects (the reader can open it again)
s = sub(s, """    if (!store.get("hrEver") || location.hash === "#connect") g.open = true;    // open until the first connection""",
"""    if (!store.get("hrEver") || location.hash === "#connect") g.open = true;    // open until the first connection
    H.guideAuto = g.open;""")
s = sub(s, """        store.set("hrEver", "1");""", """        store.set("hrEver", "1");
        if (H.guideAuto) { $("#connect").open = false; H.guideAuto = false; }""")
# the first second after connecting isn't a fault: say so instead of asking if it's broadcasting
s = sub(s, """    else if (!live) sub = "No readings. Is the sensor broadcasting?";""",
"""    else if (!live) sub = (H.connAt && bNow() - H.connAt < 6) ? "Waiting for the first reading\\u2026" : "No readings. Is the sensor broadcasting?";""")
# ---- guided practices ----
# program tracks carry a piecewise beat schedule, pts: [[second, Hz], ...]
s = sub(s, """  function beatAt(track, seconds) {
    if (typeof track.rampFrom !== "number") return track.beat;""", """  function beatAt(track, seconds) {
    if (track.dyn) return track.cur;            // a beat set live (heart-led beats, the nap)
    if (track.pts) {
      var q = track.pts, i = 0;
      if (seconds <= q[0][0]) return q[0][1];
      while (i < q.length - 1 && q[i + 1][0] <= seconds) i++;
      if (i >= q.length - 1) return q[q.length - 1][1];
      return q[i][1] + (q[i + 1][1] - q[i][1]) * (seconds - q[i][0]) / (q[i + 1][0] - q[i][0]);
    }
    if (typeof track.rampFrom !== "number") return track.beat;""")
s = sub(s, """    if (typeof track.rampFrom === "number") {
      var remaining = Math.max(0, track.minutes * 60 - offsetSeconds);""", """    if (track.pts) {
      track.pts.forEach(function (p) {
        if (p[0] > offsetSeconds) A.oscR.frequency.linearRampToValueAtTime(track.carrier + p[1], now + (p[0] - offsetSeconds));
      });
    } else if (typeof track.rampFrom === "number") {
      var remaining = Math.max(0, track.minutes * 60 - offsetSeconds);""")
s = sub(s, """    var lengthTxt = track.minutes + " min";
    var beatTxt = typeof track.rampFrom === "number"
      ? track.rampFrom.toFixed(1) + " → " + track.beat.toFixed(1) + " Hz"
      : track.beat.toFixed(1) + " Hz";""", """    var lengthTxt = Math.round(track.minutes) + " min";
    var beatTxt = track.pts
      ? (track.pts[0][1] === track.beat ? track.beat.toFixed(1) : track.pts[0][1].toFixed(1) + " → " + track.beat.toFixed(1)) + " Hz"
      : typeof track.rampFrom === "number"
      ? track.rampFrom.toFixed(1) + " → " + track.beat.toFixed(1) + " Hz"
      : track.beat.toFixed(1) + " Hz";""")
# practice tracks always end with the practice, with their own fade
s = sub(s, """    if (A.phase !== "prime" && $("#openEnded").checked) return;
    var total = A.track.minutes * 60;""", """    if (A.phase !== "prime" && $("#openEnded").checked && !A.track.practice) return;
    var total = A.track.minutes * 60;""")
s = sub(s, """    var left = total - A.elapsed - FADE_OUT;
    A.endTimer = setTimeout(finish, Math.max(0, left * 1000));""", """    var left = total - A.elapsed - (A.track.fade || FADE_OUT);
    A.endTimer = setTimeout(finish, Math.max(0, left * 1000));""")
s = sub(s, """    fadeOutAndStop("Session complete: " + A.track.minutes + " min of " + A.track.name + ".");""",
           """    fadeOutAndStop("Session complete: " + Math.round(A.track.minutes) + " min of " + A.track.name + ".", A.track.fade || FADE_OUT);""")
s = sub(s, """    var countUp = A.phase === "task" || $("#openEnded").checked;""",
           """    var countUp = A.phase === "task" || ($("#openEnded").checked && !t.practice);""")
# the breathing guide, while a practice is driving it
s = sub(s, """      if (bt >= 0) hrFinalize(locate(bt).count);
      hrSummary();
    }
    if (B.finder) finderCancel();""", """      if (bt >= 0) hrFinalize(locate(bt).count);
      if (!P.usesB) hrSummary();
    }
    if (B.finder) finderCancel();""")
s = sub(s, """  function saveBreath() {
    var c = BC;""", """  function saveBreath() {
    if (P.usesB) return;                 // a practice's timings are never saved as the viewer's own
    var c = BC;""")
s = sub(s, """  function bToggle() {
    if (B.state === "running") bPause();""", """  function bToggle() {
    if (P.usesB && pBusy()) { pOpen(); return; }
    if (B.state === "running") bPause();""")
s = sub(s, """    var S = frameState();
    d2.clearRect(0, 0, CW, CH);
    d2.setLineDash([]);
    (BVIS[BC.visual] || BVIS.circle)(S);""", """    var S = frameState();
    if ($("#v-breathe").hidden) { syncOrb(S); return; }    // a practice may be running it from elsewhere
    d2.clearRect(0, 0, CW, CH);
    d2.setLineDash([]);
    (BVIS[BC.visual] || BVIS.circle)(S);""")
s = sub(s, """  function hrRecord(pt) {
    var now = bNow();""", """  function hrRecord(pt) {
    var now = bNow();
    if (P.state === "running") P.hr.push({ t: pT() - (now - pt.t), hr: pt.hr });""")
s = sub(s, """    if (r && B.state === "running" && breathTime() >= 0) B.coh.push(r.cs);""",
           """    if (r && B.state === "running" && breathTime() >= 0) B.coh.push(r.cs);
    if (r && P.state === "running") P.coh.push({ t: pT(), cs: r.cs });""")

# insert the shell and start it last
s = sub(s, "  /* ------------------------------- init ------------------------------ */",
        shell + practice + "\n  /* ------------------------------- init ------------------------------ */")
s = sub(s, "  initBreath();\n  hrInit();", "  initBreath();\n  hrInit();\n  shellInit();")

head = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#0b1120">
<link rel="manifest" href="manifest.webmanifest">
<link rel="icon" href="__FAVICON__">
<link rel="apple-touch-icon" href="icons/apple-touch-icon.png">
<title>Entrain — Evidence-Based Binaural Beats</title>
<meta name="description" content="Binaural beats, paced breathing and live heart-rate biofeedback in one offline page: research-based tracks, a breathing guide with five visuals, Bluetooth heart sensors, coherence and a resonance test.">
<style>
""" + css + """</style>
</head>
<body>
"""
# the favicon is an inline SVG of the brand mark, so the page stays a single file
fav = ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">'
       '<stop offset="0" stop-color="#8e98fc"/><stop offset=".5" stop-color="#fbbf24"/><stop offset="1" stop-color="#5eead4"/>'
       '</linearGradient></defs><rect width="32" height="32" rx="10" fill="url(#g)"/><rect x="8" y="8" width="16" height="16" rx="4" fill="#0b1120"/></svg>')
import urllib.parse
head = sub(head, "__FAVICON__", "data:image/svg+xml," + urllib.parse.quote(fav.replace('"', "'"), safe=" :/=.-,'"))

ROOT = os.path.join(HERE, "..")
out = head + body + "\n<script>" + s + "</script>\n</body>\n</html>\n"
open(os.path.join(ROOT, "index.html"), "w", encoding="utf-8").write(out)
print("wrote index.html", len(out), "bytes")

# ---- the installable app: description, icons and the offline worker ----
import hashlib, json, shutil
shutil.copyfile(os.path.join(HERE, "manifest.webmanifest"), os.path.join(ROOT, "manifest.webmanifest"))
json.load(open(os.path.join(ROOT, "manifest.webmanifest")))          # must parse
icons = sorted("icons/" + f for f in os.listdir(os.path.join(ROOT, "icons")) if f.endswith(".png"))
files = ["./", "manifest.webmanifest"] + icons
h = hashlib.sha256()
for f in ["index.html"] + files[1:]:
    h.update(f.encode()); h.update(open(os.path.join(ROOT, f), "rb").read())
ver = h.hexdigest()[:10]
sw = rd("sw.js").replace("__VERSION__", ver).replace("__FILES__", json.dumps(files, indent=2).replace("\n", "\n"))
assert "__" not in sw.replace("__proto__", "")
open(os.path.join(ROOT, "sw.js"), "w", encoding="utf-8").write(sw)
print("wrote sw.js, version", ver, "-", len(files), "files")

# ---- the preview page for Claude: no manifest or worker, just the app ----
art = ('<title>Entrain</title>\n<meta name="claude:viewport-fit-sides" content="cover">\n<style>\n' + css + '</style>\n'
       + body + "\n<script>" + s + "</script>\n")
open(os.path.join(ROOT, "entrain-page.html"), "w", encoding="utf-8").write(art)
print("wrote entrain-page.html", len(art), "bytes")
