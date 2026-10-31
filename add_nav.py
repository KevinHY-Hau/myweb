"""Adds <script src="../nav.js"></script> before </body> in every chapter page, once.
Run it from your site folder (the one that contains index.html and chap1/ ... chap26/):   python add_nav.py
It only touches files that don't already have the line, and it keeps a .bak copy of each changed file."""
import glob, shutil
TAG = '<script src="../nav.js"></script>'
files = sorted(glob.glob("chap*/index.html"))
changed = 0
for f in files:
    s = open(f, encoding="utf-8").read()
    if "nav.js" in s:
        print("already has it:", f); continue
    i = s.lower().rfind("</body>")
    if i < 0:
        print("no </body>, skipped:", f); continue
    shutil.copy(f, f + ".bak")
    open(f, "w", encoding="utf-8").write(s[:i] + "  " + TAG + "\n" + s[i:])
    print("added:", f); changed += 1
print(changed, "file(s) changed,", len(files), "found")
