"""Agrega los textos del mod Drift Boy + JDM Mods a ui.tsv y rules.tsv. Idempotente."""
import os, sys

HERE = os.path.dirname(os.path.abspath(__file__))
WORK = os.path.dirname(HERE)
I18N = os.path.dirname(WORK)
MARK = "## --- drift boy & jdm mods (2026-11-25) ---"

UI_FILES = ["new_drift_ui1.tsv", "new_drift_ui2.tsv", "new_drift_ui3.tsv", "new_drift_ui4.tsv",
            "new_drift_events1.tsv", "new_drift_events2.tsv", "new_drift_events3.tsv",
            "new_jdm_ui.tsv", "new_jdm_parts1.tsv", "new_jdm_parts2.tsv", "new_drift_ui5.tsv",
            "new_drift_track_ui.tsv", "new_drift_track_ui2.tsv", "new_drift_ui6.tsv"]
RULE_FILE = "new_drift_rules.tsv"


def rows(path):
    out = []
    for n, line in enumerate(open(path, encoding="utf-8"), 1):
        line = line.rstrip("\n").rstrip("\r")
        if not line.strip() or line.startswith("#"):
            continue
        cols = line.split("\t")
        if len(cols) != 3:
            sys.exit(f"{os.path.basename(path)}:{n}: esperaba 3 columnas, hay {len(cols)}: {line!r}")
        out.append([c.strip() for c in cols])
    return out


def keys_of(path):
    k = set()
    for line in open(path, encoding="utf-8"):
        line = line.rstrip("\n")
        if line.strip() and not line.startswith("#") and "\t" in line:
            k.add(line.split("\t")[0].strip().lower())
    return k


ui_path = os.path.join(I18N, "ui.tsv")
text = open(ui_path, encoding="utf-8").read()
if MARK in text:  # idempotente: borra la seccion anterior
    text = text[: text.index(MARK)].rstrip("\n") + "\n"
have = {l.split("\t")[0].strip().lower() for l in text.splitlines()
        if l.strip() and not l.startswith("#") and "\t" in l}

add_ui, skipped = [], 0
for f in UI_FILES:
    p = os.path.join(WORK, f)
    if not os.path.exists(p):
        continue
    for en, es, pt in rows(p):
        k = en.lower()
        if k in have:
            skipped += 1
            continue
        have.add(k)
        add_ui.append((en, es, pt))

with open(ui_path, "w", encoding="utf-8", newline="\n") as fh:
    fh.write(text.rstrip("\n") + "\n\n" + MARK + "\n")
    for en, es, pt in add_ui:
        fh.write(f"{en}\t{es}\t{pt}\n")

rules_path = os.path.join(I18N, "rules.tsv")
have_r = {l.split("\t")[0] for l in open(rules_path, encoding="utf-8") if l.strip() and "\t" in l}
add_r, skipped_r = [], 0
for pat, es, pt in rows(os.path.join(WORK, RULE_FILE)):
    if pat in have_r:
        skipped_r += 1
        continue
    have_r.add(pat)
    add_r.append((pat, es, pt))

with open(rules_path, "a", encoding="utf-8", newline="\n") as fh:
    for pat, es, pt in add_r:
        fh.write(f"{pat}\t{es}\t{pt}\n")

print(f"ui.tsv: +{len(add_ui)} (omitidas {skipped} que ya existian)")
print(f"rules.tsv: +{len(add_r)} (omitidas {skipped_r} que ya existian)")
