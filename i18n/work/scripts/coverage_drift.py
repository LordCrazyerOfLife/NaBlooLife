"""Saca a un TSV los strings visibles de unos modulos que aun no tienen ES (para traducirlos)."""
import os, re

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
I18N = os.path.join(ROOT, "i18n")
FILES = ["drift.js", "jdmmods.js", "jdmmods-data.js", "custom-content.js"]

keys = set()
for name in ("ui.tsv", "events.tsv", "glossary.tsv"):
    p = os.path.join(I18N, name)
    if not os.path.exists(p):
        continue
    for line in open(p, encoding="utf-8"):
        if not line.strip() or line.startswith("#"):
            continue
        c = line.rstrip("\n").split("\t")
        if len(c) >= 2:
            keys.add(c[0].strip().lower())

STR = re.compile(r'"((?:[^"\\]|\\.)*)"')
SKIP = re.compile(
    r"^(?:use strict|undefined|null|true|false|GET|POST|en-US|"
    r"[0-9a-f]{4,6}(?:-fe0f)?|"          # codigos de emoji
    r"[a-z0-9]+(?:[-_/][a-z0-9.]+)+|"    # ids, clases css, rutas, sprites
    r"#[0-9a-fA-F]{3,8}|"                # colores
    r"[a-z]{1,4}|"                       # ids cortos: lot, tokyo, fuji...
    r"\d+)$"
)
SKIP_WORDS = {
    "nissan", "toyota", "mazda", "subaru", "mitsubishi", "honda", "suzuki", "lexus",
    "infiniti", "acura", "bmw", "audi", "porsche", "ferrari", "lamborghini",
}
REAL_WORDS = {"grip", "drift", "heat", "sponsor", "angle", "line", "speed", "score", "cars", "parts"}


def strings(path):
    src = open(os.path.join(ROOT, path), encoding="utf-8").read()
    src = re.sub(r"/\*.*?\*/", "", src, flags=re.S)
    src = re.sub(r"^\s*//.*$", "", src, flags=re.M)
    return [s.replace('\\"', '"').replace("\\\\", "\\") for s in STR.findall(src)]


out = []
for f in FILES:
    p = os.path.join(ROOT, f)
    if not os.path.exists(p):
        continue
    seen = set()
    for s in strings(f):
        if len(s) < 2 or not re.search(r"[A-Za-z]{2}", s):
            continue
        low = s.lower()
        if low in keys or s in seen:
            continue
        if SKIP.match(s) and low not in REAL_WORDS:
            continue
        if low in SKIP_WORDS:
            continue
        if "&quot;" == s or "&amp;" == s:
            continue
        # ruido de codigo: selectores, plantillas con ${}, css
        if re.search(r"[{};]|px\b|^\$|\.(?:png|js|wav)$", s):
            continue
        if re.match(r"^[a-z]+[A-Z][A-Za-z]*$", s):  # camelCase = codigo
            continue
        seen.add(s)
        out.append((f, s))

with open(os.path.join(I18N, "work", "drift_in.tsv"), "w", encoding="utf-8", newline="\n") as fh:
    for f, s in out:
        fh.write(f"{s}\t{f}\n")

print(len(out), "strings a traducir")
