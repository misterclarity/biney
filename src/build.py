#!/usr/bin/env python3
"""Assemble the single-file Entrain app.

Inputs, all in this folder:
  html/app.html   the page skeleton; each {include:name} line is replaced by html/name
  html/*.html     the views, dialogs, player and search, one file each
  html/icons.svg  the icon sprite; {i:name} anywhere in the markup is one of its icons
  js/*.js         the script, in the order of JS below; every file shares one scope
  styles.css      the stylesheet (with a __FONT_…__ placeholder for each font)
  fonts/*.b64     base64 of the three typefaces as WOFF2, subset to Latin: Bricolage Grotesque for headings,
                  Atkinson Hyperlegible Next for text and DM Mono for times and receipts
  fonts/OFL.txt   their copyrights and licence, put next to them in the page (the licence asks that
                  every copy carry them)
Outputs, one folder up:
  index.html            the whole app in one file, with no network requests, under the licence in ../LICENSE
  sw.js, manifest.webmanifest   for installing it and opening it offline (icons/ is kept as it is)
  entrain-page.html     the same app without the manifest or worker, for the artifact preview
"""
import hashlib, json, os, re, shutil, sys, urllib.parse

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.join(HERE, "..")
def rd(name): return open(os.path.join(HERE, name), encoding="utf-8").read()

# the script, in order: what runs at load time runs in this order, and boot.js starts the app
JS = [
    "core.js", "tracks.js", "audio.js", "trackpage.js", "lockscreen.js", "builder.js", "prime.js", "dialogs.js", "safety.js",
    "breathe.js", "breathe-draw.js", "mypatterns.js", "heart.js", "heart-charts.js", "breath-mic.js",
    "shell.js",
    "asanas.js", "moves.js", "ambience.js", "quotes.js", "tapping.js", "practice-data.js", "taxonomy.js", "practice.js", "done.js",
    "library.js", "settings.js", "adapt.js", "stress.js", "nvc.js", "yoga.js", "search.js", "living-data.js", "living.js",
    "history.js", "trends.js", "favs.js", "today.js", "theme.js", "backup.js",
    "boot.js",
]
SOURCES = [(f, rd("js/" + f)) for f in JS]
script = '\n(function () {\n  "use strict";\n\n' + "".join(t for _, t in SOURCES) + "})();\n"


# ---- markup: includes, then icons ----
def expand(name, seen=()):
    if name in seen:
        sys.exit("html/%s includes itself" % name)
    def one(m):
        return expand(m.group(1), seen + (name,))
    return re.sub(r"^\{include:([\w.-]+)\}\n", one, rd("html/" + name), flags=re.M)

body = "\n" + expand("app.html")
ICON_NAMES = set(re.findall(r'<symbol id="i-([\w-]+)"', rd("html/icons.svg")))
def icon(m):
    if m.group(1) not in ICON_NAMES:
        sys.exit("no icon named %r in html/icons.svg" % m.group(1))
    return '<svg class="i" aria-hidden="true"><use href="#i-%s"/></svg>' % m.group(1)
body = re.sub(r"\{i:([\w-]+)\}", icon, body)
left = re.search(r"\{(include|i):[^}]*\}", body)
if left:
    sys.exit("unexpanded placeholder in the markup: " + left.group(0))


# ---- every file shares the script's one scope: a name declared twice silently replaces the first ----
def top_level_names(js):
    """Names declared by `var` and `function` at the top of the shared scope (two-space indent),
    with the line of each declaration. A light scanner, not a parser: it skips strings, comments
    and regex literals, and splits a `var` statement on commas outside brackets."""
    found, lines, starts = {}, js.split("\n"), [0]
    for ln in lines:
        starts.append(starts[-1] + len(ln) + 1)
    name_re = re.compile(r"\s*([A-Za-z_$][\w$]*)")
    for n, ln in enumerate(lines):
        m = re.match(r"  function ([A-Za-z_$][\w$]*)\s*\(", ln)
        if m:
            found.setdefault(m.group(1), []).append(n + 1)
            continue
        if not ln.startswith("  var "):
            continue
        i, depth, want, prev = starts[n] + 6, 0, True, "="
        while i < len(js):
            if want:
                m = name_re.match(js, i)
                if not m:
                    break
                found.setdefault(m.group(1), []).append(n + 1)
                i, want, prev = m.end(), False, "a"
                continue
            c = js[i]
            if c in " \t\r\n":
                i += 1
            elif js.startswith("//", i):
                i = js.index("\n", i)
            elif js.startswith("/*", i):
                i = js.index("*/", i) + 2
            elif c in "\"'`":
                j = i + 1
                while js[j] != c:
                    j += 2 if js[j] == "\\" else 1
                i, prev = j + 1, "a"
            elif c == "/" and (prev in "(,=:[!&|?{};" or re.search(r"(?<![\w$])(return|typeof|case|in|of|else|void|new)\s*$", js[max(0, i - 12):i])):   # a regex literal
                j, cls = i + 1, False
                while cls or js[j] != "/":
                    if js[j] == "\\":
                        j += 1
                    elif js[j] in "[]":
                        cls = js[j] == "["
                    j += 1
                i, prev = j + 1, "a"
            else:
                if c in "([{":
                    depth += 1
                elif c in ")]}":
                    depth -= 1
                elif depth == 0 and c == ",":
                    want = True
                elif depth == 0 and c == ";":
                    break
                i, prev = i + 1, c
    return found

def source_of(line):
    text = line.strip()
    return ", ".join(f for f, t in SOURCES if text in t) or "build.py"
twice = {k: v for k, v in top_level_names(script).items() if len(v) > 1}
if twice:
    out_lines = script.split("\n")
    sys.exit("declared more than once in the shared scope:\n" + "\n".join(
        "  %s: %s" % (k, "; ".join(source_of(out_lines[n - 1]) for n in v)) for k, v in sorted(twice.items())))


# ---- the page ----
# the licence notice every copy of the page carries (the GNU AGPL's own wording, for version 3 only)
NOTICE = """<!--
  Entrain: paced breathing, binaural beats, heart coherence and guided practices, offline.
  Copyright (C) 2026 misterclarity

  This program is free software: you can redistribute it and/or modify it under the terms of
  the GNU Affero General Public License as published by the Free Software Foundation, version 3.

  This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY;
  without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
  See the GNU Affero General Public License for more details.

  You should have received a copy of the GNU Affero General Public License along with this
  program. If not, see <https://www.gnu.org/licenses/>.

  Source: https://github.com/misterclarity/biney
  The fonts inside (Bricolage Grotesque, Atkinson Hyperlegible Next and DM Mono) are under the
  SIL Open Font License 1.1, whose text comes with them below.
-->"""
assert "--" not in NOTICE[4:-3]
ofl = rd("fonts/OFL.txt").strip()
css = rd("styles.css")
assert "*/" not in ofl and "/*__FONT_OFL__*/" in css, "the fonts' licence needs its place in styles.css"
FONTS = {"__FONT_BRICOLAGE__": "bricolage", "__FONT_ATKINSON__": "atkinson", "__FONT_MONO_400__": "dmmono-400", "__FONT_MONO_500__": "dmmono-500"}
for mark, name in FONTS.items():
    assert css.count(mark) == 1, "styles.css needs one place for " + mark
    css = css.replace(mark, rd("fonts/" + name + ".b64").strip())
css = css.replace("/*__FONT_OFL__*/", "/* The fonts below, under their licence:\n\n" + ofl + "\n*/")
# Light or dark before anything is drawn, so a phone in bed never flashes white: dark when chosen in Settings,
# or, on Automatic, when the phone is dark or between 9 pm and 5 am. theme.js keeps it up to date after that.
THEME_JS = ('<script>(function(){try{var s=JSON.parse(localStorage.getItem("entrain.settings")||"{}")||{},t=s.theme,h=new Date().getHours(),'
            'm=window.matchMedia&&matchMedia("(prefers-color-scheme: dark)").matches;'
            'document.documentElement.dataset.theme=t==="dark"||(t!=="light"&&(m||h>=21||h<5))?"dark":"light"}catch(e){}})();</script>')
head = """<!DOCTYPE html>
""" + NOTICE + """
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#1d6a50">
<link rel="manifest" href="manifest.webmanifest">
<link rel="license" href="https://www.gnu.org/licenses/agpl-3.0.html">
<link rel="icon" href="__FAVICON__">
<link rel="apple-touch-icon" href="icons/apple-touch-icon.png">
""" + THEME_JS + """
<title>Entrain — Evidence-Based Binaural Beats</title>
<meta name="description" content="Binaural beats, paced breathing and live heart-rate biofeedback in one offline page: research-based tracks, a breathing guide with five visuals, Bluetooth heart sensors, coherence and a resonance test.">
<style>
""" + css + """</style>
</head>
<body>
"""
# the favicon is an inline SVG of the brand mark (a cloche with breath rising from it), so the page stays a single file
fav = ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="8" fill="#1d6a50"/>'
       '<g transform="translate(4 4)" fill="none" stroke="#fbfdfa" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">'
       '<path d="M6.5 5c.9-1.3 1.85-1.3 2.75 0s1.85 1.3 2.75 0 1.85-1.3 2.75 0 1.85 1.3 2.75 0"/><circle cx="12" cy="8.6" r="1.1"/>'
       '<path d="M5 16.5a7 7 0 0 1 14 0"/><path d="M3 19h18"/></g></svg>')
head = head.replace("__FAVICON__", "data:image/svg+xml," + urllib.parse.quote(fav.replace('"', "'"), safe=" :/=.-,'"))

# a short build id from the sources, for About and feedback (the page can't carry the hash of itself)
build_id = hashlib.sha256((css + body + script).encode()).hexdigest()[:8]
assert script.count("__BUILD__") == 1, "the build id needs its one place in the script"
script = script.replace("__BUILD__", build_id)

out = head + body + "\n<script>" + script + "</script>\n</body>\n</html>\n"
open(os.path.join(ROOT, "index.html"), "w", encoding="utf-8").write(out)
print("wrote index.html", len(out), "bytes")

# ---- the installable app: description, icons and the offline worker ----
shutil.copyfile(os.path.join(HERE, "manifest.webmanifest"), os.path.join(ROOT, "manifest.webmanifest"))
json.load(open(os.path.join(ROOT, "manifest.webmanifest")))          # must parse
icons = sorted("icons/" + f for f in os.listdir(os.path.join(ROOT, "icons")) if f.endswith(".png"))
files = ["./", "manifest.webmanifest"] + icons
h = hashlib.sha256()
for f in ["index.html"] + files[1:]:
    h.update(f.encode()); h.update(open(os.path.join(ROOT, f), "rb").read())
ver = h.hexdigest()[:10]
sw = rd("sw.js").replace("__VERSION__", ver).replace("__FILES__", json.dumps(files, indent=2))
assert "__" not in sw.replace("__proto__", "")
open(os.path.join(ROOT, "sw.js"), "w", encoding="utf-8").write(sw)
print("wrote sw.js, version", ver, "-", len(files), "files")

# ---- the preview page for Claude: no manifest or worker, just the app, as a whole document ----
art = ("<!DOCTYPE html>\n" + NOTICE + '\n<html lang="en">\n<head>\n<meta charset="utf-8">\n'
       '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n'   # the app pads for the safe areas
       '<link rel="license" href="https://www.gnu.org/licenses/agpl-3.0.html">\n' + THEME_JS + '\n<title>Entrain</title>\n<style>\n' + css + '</style>\n</head>\n<body>\n'
       + body + "\n<script>" + script + "</script>\n</body>\n</html>\n")
open(os.path.join(ROOT, "entrain-page.html"), "w", encoding="utf-8").write(art)
print("wrote entrain-page.html", len(art), "bytes")
