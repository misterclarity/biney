# Entrain

Paced breathing, binaural beats and live heart-rate biofeedback in one offline web app. It covers guided practices and programs, yoga and capoeira routines, tapping, a monitored power nap and nonviolent-communication reflection, with one search box across all of it and Learn.

There are five tabs: Today, Library, Breathe, Heart and Learn.

- **Today** has your favourites, what you did lately and the last seven days, from one history of everything you do, with the heart-rate change and coherence whenever a sensor was connected. It also has a suggestion for the time of day and the six goals.
- **Library** holds every practice, breathing pattern and track, each under one goal (Sleep, Calm, Focus, Energy, Recover or Reflect), with filters for method, length, posture and needs. Each track has a page of its own, like a practice, and so do the custom primer and the beat builder.
- **Settings** holds the defaults; options can also be kept for each practice. It also decides how the screen behaves: by default it stays on and at full brightness through every session.

Everything runs on the device and stays there: the history, favourites and reflections are kept in the browser's storage, and nothing is sent anywhere.

## Layout

| Path | What it is |
|---|---|
| `index.html`, `sw.js`, `manifest.webmanifest`, `icons/` | The built app, served as is. Don't edit these by hand. |
| `src/html/` | The markup: `app.html` is the page skeleton, with one file per view, plus the dialogs, the mini player, search and the icon sprite |
| `src/js/` | The script, one file per feature (listed below) |
| `src/styles.css` | The stylesheet |
| `src/build.py` | Puts it all together |
| `tests/` | Browser test suites (Playwright) |

## Build

```
python3 src/build.py
```

This writes `index.html`, `sw.js` and `manifest.webmanifest` at the top level. It also writes `entrain-page.html`, a preview page without the offline helper, which is not committed.

The build only assembles, nothing is rewritten on the way:

- **Markup.** Each `{include:name}` line in `src/html/app.html` is replaced by `src/html/name`, and `{i:name}` anywhere in the markup becomes an icon from `src/html/icons.svg`. The build stops on an icon that isn't in the sprite.
- **Script.** The files in `src/js/` are joined in the order listed in `build.py`, inside one function, so they share one scope. `core.js` comes first and `boot.js` last. Every other file only declares things; `boot.js` wires the page up in order. Because the scope is shared, the build stops if a top-level name is declared twice. Otherwise the second declaration would silently replace the first.
- **Styles.** `src/styles.css`, with the Poppins subset from `src/poppins.b64` inlined.

| Script file | What it holds |
|---|---|
| `core.js` | Helpers every file uses: `$`, `store`, `fmt`, `esc` and the evidence dots |
| `tracks.js` | The binaural tracks and the frequency bands |
| `audio.js` | The binaural engine, pink noise, the transport and the mini player |
| `trackpage.js` | A page for each track, with Play in reach |
| `builder.js`, `prime.js` | The beat builder and the custom primer pages |
| `dialogs.js` | The headphone check and the tinnitus pitch match |
| `breathe.js`, `breathe-draw.js` | The breathing guide: patterns, timing, controls and cues; its five visuals |
| `heart.js`, `heart-charts.js` | Bluetooth heart sensors and the connection guide; swing and spectrum charts, the resonance test, coherence |
| `shell.js` | Views and routes, notices, install and offline |
| `asanas.js`, `moves.js` | The movement library: poses, stretches, mobility drills and capoeira, each with its drawing |
| `ambience.js`, `quotes.js`, `tapping.js` | Background rain and crickets, and the berimbau; the quotes; the nine tapping points |
| `practice-data.js`, `taxonomy.js` | The guided practices and programs; goals, methods and postures |
| `practice.js`, `done.js`, `adapt.js` | The practice engine and session screen; the end screen, whose numbers and chart explain themselves when tapped; heart-led beats and the power nap |
| `library.js`, `settings.js`, `yoga.js`, `nvc.js`, `search.js` | The library, Settings, the routine builder, the reflection practices, search |
| `history.js`, `favs.js`, `today.js` | The one history, favourites, and Today |
| `boot.js` | Starts everything, in order |

## Test

You need Node 18 or later, Playwright with Chromium (`npm install playwright`, then `npx playwright install chromium`) and Python 3.

```
node tests/run.js              # every suite, about fifteen minutes
node tests/run.js apptest      # one or more suites by name
```

See `tests/README.md` for what each suite covers.
