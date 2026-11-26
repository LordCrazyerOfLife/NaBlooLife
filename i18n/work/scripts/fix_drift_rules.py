import os

HERE = os.path.dirname(os.path.abspath(__file__))
p = os.path.join(HERE, "..", "new_drift_rules.tsv")
lines = open(p, encoding="utf-8").read().splitlines()

DROP = [
    "^(.+) costs (.+)\\.$",
    "^(.+) is on the (.+)\\.$",
    "^The (.+) costs (.+)\\.$",
]
out = []
for l in lines:
    pat = l.split("\t")[0]
    if pat in DROP:
        continue
    out.append(l)

out.append(
    "^(Parking lot practice|Track day|Simulator|Study replays & pros|Reflexes & fitness|Car meet|"
    "Street takeover|Post your clips) costs (.+)\\.$\t$1 cuesta $2.\t$1 costs $2."
)
# solo cuando la segunda parte trae numeros (precio), no frases como "The delay costs critical minutes."
out.append("^The (.+) costs (.+[0-9].*)\\.$\tEl $1 cuesta $2.\tThe $1 costs $2.")

open(p, "w", encoding="utf-8", newline="\n").write("\n".join(out) + "\n")
print("reglas:", len(out))
