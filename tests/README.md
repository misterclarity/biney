# Tests

Each suite opens the built `index.html` in headless Chromium, mostly as a Samsung Galaxy S20 Ultra (412 × 915), and prints one `PASS` or `FAIL` line per check. `node tests/run.js` runs them all and exits with 1 if anything failed, a page threw an error, or a suite didn't finish.

| Suite | Covers |
|---|---|
| `netcheck.js` | No network requests across every view |
| `apptest.js` | The app shell: Today, Breathe, the settings sheet, a track page, the mini player, Heart, phone and desktop layouts |
| `pwatest.js` | Offline install: the worker, offline reloads, the update offer, the install strip, installability. It serves a fresh copy of the build on port 8123, so stop anything else on that port first. |
| `prrun.js` | Sleep Descent and Calm Reset end to end, the guided practices (grounding, kapalabhati, PMR, shuffle, anapana, nadi), every standing pose, the binaural layer |
| `prrun2.js` | Wim Hof, anapana reminders in programs, the routine builder, a built-in floor sequence |
| `prrun3.js` | Capoeira and the berimbau, background sound, quotes, tapping, heart-led beats, the power nap, the NVC practices and the feelings wheel |
| `regress.js` | The bugs fixed after the October 2026 code review, then Anapana's narrowing focus and hour-long sitting, the wording of all guidance, the screen lock and search, then the goals, the library and its filters, the practice page's options and Settings, then the end screen's explanations and chart reading, the quotes signed Entrain, the lighter drawing (30 frames a second, no blurred shadows, the player's clock), and backup, restore and keeping the data. The backup checks serve the build over http on a free port, since a reload is part of a restore. |
| `todaytest.js` | The five tabs and old addresses, track pages and the tinnitus section, the history (moving the old practice log over, what goes in and what doesn't, History, clearing it), favourites on every kind of page, Recently and the goal tiles, nothing too wide at 360 px |
| `findtest.js` | The resonance test end to end with a beat-to-beat sensor |
| `cuetrend.js` | A track on the lock screen (play, pause, stop, a call pausing it, open-ended, the setting, practices kept off it); vibration cues on time, with and without sound, the end, a practice's own setting; the end screen against your own sessions; trends by week and month, by keyboard, tap and table |

## Helpers

- `pw.js` loads Playwright. It tries `$PLAYWRIGHT`, then `playwright`, then `/opt/npm-tools/node_modules/playwright`. It also gives the suites the app's location and `tests/out/` for screenshots.
- `wake-mock.js` stands in for the Screen Wake Lock API on every page (headless Chromium refuses the real one). `window.__wl` counts requests and releases; localStorage `test.wl` set to `deny` or `none` makes requests fail or hides the API.
- `sensor-mock.js` is a stand-in Bluetooth heart-rate sensor, injected with `page.addInitScript(mock, { speed, rr, fail })`. Its `speed` option runs the page's clock faster, so a 30-minute nap takes a minute.
- Setting localStorage `entrain.debug` to `1` exposes the app's state as `window.__entrain` for the checks.
- Headless Chromium sometimes loses a `file://` page's storage across a reload. Checks that reload copy the stored values over (`reopen()` in `regress.js`, the builder in `prrun2.js`) and print a `NOTE` line when they had to.
