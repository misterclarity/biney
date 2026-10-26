# Entrain

Paced breathing, binaural beats and live heart-rate biofeedback in one offline web app. It covers guided practices and programs, yoga and capoeira routines, tapping, a monitored power nap and nonviolent-communication reflection, and Healthy living's recipes and supplements, with one search box across all of it and Learn.

There are five tabs: Today, Library, Breathe, Heart and Learn.

- **Today** has your favourites, what you did lately and the last seven days, from one history of everything you do, with the heart-rate change and coherence whenever a sensor was connected. It also has a suggestion for the time of day and the six goals. History, behind it, charts the last twelve weeks or months: minutes, the heart-rate change from start to end, and coherence.
- **Library** holds every practice, breathing pattern and track, each under one goal (Sleep, Calm, Focus, Energy, Recover or Reflect), with your own routines and breathing patterns first. The filters combine: one goal or several, one technique or several, and length, posture and needs, again one or several each. Within a row the choices add up, the rows narrow each other, each chip counts what it would show, and a line under them says what's chosen, with Clear all. Each track has a page of its own, like a practice, and so do the custom primer and the beat builder.
- **Breathe** is the breathing guide. Timings of your own can be saved under a name (up to twelve): each becomes a chip beside the presets, a row in the library, a search result and a star for Today, and can be updated, renamed or deleted, with an undo.
- **Heart** puts first what you need: connecting, the connection guide and the resonance test (with your last result and its pace) until a sensor is on; then your live numbers, the breath-by-breath chart, the test and the spectrum, with the guide at the bottom. Connecting can't get stuck: linking up, finding the heart-rate service and starting the readings each have a deadline, a step that fails or runs out of time is tried again (three tries in all), the button reads Cancel meanwhile, and the message says which step it's on, or which didn't finish and what to try, such as a pairing request to accept or, for a Garmin watch, Garmin Connect holding on to it.
- **Settings** holds the defaults; options can also be kept for each practice. It also decides how the screen behaves: by default it stays on and at full brightness through every session. Under Your data it saves a backup of everything as one file and restores one, for a new phone or for safekeeping.

Heart Coherence is three minutes of heart-focused breathing, then breathing with gratitude: the feeling comes second because it's easiest to feel once slow breathing has settled the heart rhythm, as it is after a meditation. It can be done sitting or lying down, for 10, 15 or 20 minutes, over a theta, alpha or alpha-to-theta beat or none, at its optimal default (your resonance rate: the test's answer, or 5.5 a minute until you take it) or at an in and out of your own. Those choices are kept for it, like its other options.

Gratitude is a practice of its own: three or four minutes of slow, even breathing at the same pace choices first, because gratitude is easiest to feel once you are calm, then gratitude for something small from today, for a person who helped you and for your own body, a minute of savouring the feeling, and an invitation to write down three good things. It runs 10 or 15 minutes, sitting or lying down. Calm Reset has the same beat and pace choices as Heart Coherence: its usual alpha-to-theta slide, a steady theta or alpha beat, or none, and the optimal default pace or an in and out of your own for its resonance breathing (the cyclic sighs keep their rhythm), kept for it.

While a practice runs, its breathing can be made slower or faster, from the next breath, and its beat lower or higher, gliding there over a second and a half, or turned off and on again. Restart starts it again from the top with two taps, like End, keeping those changes; the reflections leave it out, since it would lose what you've written.

A practice's end screen sets each number against your usual for that practice: the middle of your last ten sessions with the same kind of reading, or last time if there was only one, and says when it's your best yet.

The safety note is written once, in Learn under Safety, and opens over any page from a "safety notes" link. Each page shows only the line that matters there: the beats on a track, the primer, the builder and any practice that plays one; the breath on Breathe; a practice's own cautions in its introduction.

A playing track shows on the phone's lock screen and in its notifications, with play, pause and stop; Settings can turn that off. The breathing guide, and a practice's breath steps, can vibrate at each change: one short buzz in, one long out, two light taps for a hold.

Healthy living, opened from the top of Learn and from Today, has two tabs. Recipes: nine simple dishes (congee, kitchari, stewed apple with oats, miso soup, red lentil dal, overnight oats, a salmon traybake, a chickpea stew and golden milk), each on a page of its own where the servings, from 1 to 12, scale every amount, the ingredients and steps can be ticked off as you go, and the screen can be kept on while you cook. A recipe can be starred for Today. Supplements: omega-3, coenzyme Q10, creatine, vitamin D, magnesium and vitamin B12 in full, and seven more in brief, each a card that opens to what it may help with the strength of the evidence for each, the amounts studied, how to take it, food sources, what to check first and its sources. The safety note has a line for them, shown at the top of the tab.

The impressum, copyright and licence are at the end of Learn, linked from the end of Settings. A button at the end of Today and of Settings opens the donations page on Ko-fi (ko-fi.com/misterclarity) in the browser.

Updates install themselves. The app looks for a new version each time it opens, when it comes back to the screen after half an hour away, and every hour it stays on screen; a new version downloads in the background. It then installs (the page reloads into it) at a moment that interrupts nothing: straight away if the app hasn't been touched since it opened, otherwise the next time you leave it, once no practice, breathing session, resonance test or track is under way, no heart sensor is connected, nothing is being typed and no routine or recipe is half done. Until then a notice offers Update now, and after an automatic update a short one says it happened.

Everything runs on the device and stays there: the history, favourites and reflections are kept in the browser's storage, and nothing is sent anywhere. Once there is a session worth keeping, the app asks the browser to keep its storage when space runs low, and Settings says what the browser answered.

The breathing guide and the practices' visuals draw 30 frames a second, even on a faster screen, and the glows are gradients rather than blurred shadows, which are slow to redraw. The player's clock ticks once a second. The app opens without building the library, which is made each time you open it; its practices' lengths are worked out while the phone is idle after start-up.

## Layout

| Path | What it is |
|---|---|
| `index.html`, `sw.js`, `manifest.webmanifest`, `icons/` | The built app, served as is. Don't edit these by hand. |
| `LICENSE` | The GNU Affero General Public License, version 3, which Entrain is under |
| `src/html/` | The markup: `app.html` is the page skeleton, with one file per view, plus the dialogs, the mini player, search and the icon sprite |
| `src/js/` | The script, one file per feature (listed below) |
| `src/styles.css` | The stylesheet |
| `src/build.py` | Puts it all together |
| `tests/` | Browser test suites (Playwright) |

## Build

```
python3 src/build.py
```

This writes `index.html`, `sw.js` and `manifest.webmanifest` at the top level. It also writes `entrain-page.html`, a preview page without the offline helper, which is not committed. A framed page can't download files itself, so in that preview Save a backup goes through the viewer's `downloads` capability, which the artifact has to declare.

The build only assembles, nothing is rewritten on the way:

- **Markup.** Each `{include:name}` line in `src/html/app.html` is replaced by `src/html/name`, and `{i:name}` anywhere in the markup becomes an icon from `src/html/icons.svg`. The build stops on an icon that isn't in the sprite.
- **Script.** The files in `src/js/` are joined in the order listed in `build.py`, inside one function, so they share one scope. `core.js` comes first and `boot.js` last. Every other file only declares things; `boot.js` wires the page up in order. Because the scope is shared, the build stops if a top-level name is declared twice. Otherwise the second declaration would silently replace the first.
- **Styles.** `src/styles.css`, with the Poppins subset from `src/poppins.b64` inlined and its licence, `src/poppins-OFL.txt`, in a comment just above it (the font's licence asks that every copy carry it).

| Script file | What it holds |
|---|---|
| `core.js` | Helpers every file uses: `$`, `store`, `fmt`, `esc`, the evidence dots and `frameDue`, which keeps animations to 30 frames a second |
| `tracks.js` | The binaural tracks and the frequency bands |
| `audio.js` | The binaural engine, pink noise, the transport and the mini player |
| `trackpage.js`, `lockscreen.js` | A page for each track, with Play in reach; the track on the lock screen, carried by a silent audio element |
| `builder.js`, `prime.js` | The beat builder and the custom primer pages |
| `dialogs.js`, `safety.js` | The headphone check and the tinnitus pitch match; the safety note, its lines on each page and the dialog that shows it whole |
| `breathe.js`, `breathe-draw.js`, `mypatterns.js` | The breathing guide: patterns, timing, controls, sound and vibration cues; its five visuals; your own saved patterns |
| `heart.js`, `heart-charts.js` | Bluetooth heart sensors and the connection guide; swing and spectrum charts, the resonance test, coherence |
| `shell.js` | Views and routes, notices, install and offline |
| `asanas.js`, `moves.js` | The movement library: poses, stretches, mobility drills and capoeira, each with its drawing |
| `ambience.js`, `quotes.js`, `tapping.js` | Background rain and crickets, and the berimbau; the quotes; the nine tapping points |
| `practice-data.js`, `taxonomy.js` | The guided practices and programs; goals, methods and postures |
| `practice.js`, `done.js`, `adapt.js` | The practice engine and session screen; the end screen, whose numbers and chart explain themselves when tapped and set themselves against your usual; heart-led beats and the power nap |
| `library.js`, `settings.js`, `yoga.js`, `nvc.js`, `search.js` | The library, Settings, the routine builder, the reflection practices, search |
| `history.js`, `trends.js`, `favs.js`, `today.js` | The one history and its trends, favourites, and Today |
| `backup.js` | Your data: saving a backup, restoring one, and asking the browser to keep the data |
| `living-data.js`, `living.js` | Healthy living: the recipes and the supplements, with their sources; its page and tabs, the servings that scale a recipe, and the screen kept on while you cook |
| `boot.js` | Starts everything, in order |

## Test

You need Node 18 or later, Playwright with Chromium (`npm install playwright`, then `npx playwright install chromium`) and Python 3.

```
node tests/run.js              # every suite, as many at a time as there are cores (up to four)
node tests/run.js --jobs 1     # one at a time, about twenty minutes (two at a time takes ten)
node tests/run.js apptest      # one or more suites by name
```

See `tests/README.md` for what each suite covers.

## Publishing

`.github/workflows/test-and-publish.yml` runs on every push to the default branch. It checks that the committed `index.html`, `sw.js` and manifest are what `src/build.py` makes from the source, runs every suite, and publishes the site to GitHub Pages only if they all pass. For that, the repository's Settings > Pages > Build and deployment > Source has to be **GitHub Actions**. While it is still "Deploy from a branch", GitHub publishes every push straight from the branch, tested or not, and the workflow only runs the tests and says so in its summary.

## Licence

Entrain is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, version 3 (SPDX: `AGPL-3.0-only`). The full text is in [`LICENSE`](LICENSE). The built page carries the same notice at its top.

The Poppins font embedded in the page (`src/poppins.b64`, a subset of Poppins Bold) is under the SIL Open Font License 1.1, in [`src/poppins-OFL.txt`](src/poppins-OFL.txt).
