#!/usr/bin/env python3
"""Assemble the single-file Entrain app.

Inputs, all in this folder:
  html/app.html   the page skeleton; each {include:name} line is replaced by html/name
  html/*.html     the views, dialogs, player and search, one file each
  html/icons.svg  the icon sprite; {i:name} anywhere in the markup is one of its icons
  js/*.js         the script, in the order of JS below; every file shares one scope
  styles.css      the stylesheet (with the __POPPINS_BOLD__ placeholder)
  poppins.b64     base64 of the subset Poppins Bold WOFF
  poppins-OFL.txt the font's copyright and licence, put next to it in the page (the licence asks that
                  every copy carry them)
Outputs, one folder up:
  index.html            the whole app in one file, with no network requests
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
    "breathe.js", "breathe-draw.js", "mypatterns.js", "heart.js", "heart-charts.js",
    "shell.js",
    "asanas.js", "moves.js", "ambience.js", "quotes.js", "tapping.js", "practice-data.js", "taxonomy.js", "practice.js", "done.js",
    "library.js", "settings.js", "adapt.js", "nvc.js", "yoga.js", "search.js",
    "history.js", "trends.js", "favs.js", "today.js", "backup.js",
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
ofl = rd("poppins-OFL.txt").strip()
assert "*/" not in ofl and "/*__POPPINS_OFL__*/" in rd("styles.css"), "the font licence needs its place in styles.css"
css = rd("styles.css").replace("__POPPINS_BOLD__", rd("poppins.b64").strip()).replace(
    "/*__POPPINS_OFL__*/", "/* The font below, under its licence:\n\n" + ofl + "\n*/")
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
head = head.replace("__FAVICON__", "data:image/svg+xml," + urllib.parse.quote(fav.replace('"', "'"), safe=" :/=.-,'"))

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

# ---- the preview page for Claude: no manifest or worker, just the app ----
art = ('<title>Entrain</title>\n<meta name="claude:viewport-fit-sides" content="cover">\n<style>\n' + css + '</style>\n'
       + body + "\n<script>" + script + "</script>\n")
open(os.path.join(ROOT, "entrain-page.html"), "w", encoding="utf-8").write(art)
print("wrote entrain-page.html", len(art), "bytes")
