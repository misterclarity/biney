# Entrain

Paced breathing, binaural beats and live heart-rate biofeedback in one offline web app. It covers guided practices and programs, yoga and capoeira routines, tapping, a monitored power nap and nonviolent-communication reflection. Everything runs on the device; nothing is recorded or sent anywhere.

## Layout

| Path | What it is |
|---|---|
| `index.html`, `sw.js`, `manifest.webmanifest`, `icons/` | The built app, served as is. Don't edit these by hand. |
| `src/` | The source, assembled by `src/build.py` |
| `tests/` | Browser test suites (Playwright) |

## Build

```
python3 src/build.py
```

This writes `index.html`, `sw.js` and `manifest.webmanifest` at the top level. It also writes `entrain-page.html`, a preview page without the offline helper, which is not committed.

`build.py` takes `src/legacy.html` (the original one-page version), applies small checked patches to it and inserts the newer modules, in the order listed in `build.py`. Each patch must match its expected number of times, or the build stops. All modules share one script scope, so the build also stops if a top-level name is declared twice. Otherwise the second declaration would silently replace the first.

## Test

You need Node 18 or later, Playwright with Chromium (`npm install playwright`, then `npx playwright install chromium`) and Python 3.

```
node tests/run.js              # every suite, about ten minutes
node tests/run.js apptest      # one or more suites by name
```

See `tests/README.md` for what each suite covers.
