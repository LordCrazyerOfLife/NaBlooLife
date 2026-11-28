"""Cut the 4x3 AWARDS.png sheet into the 12 trophy photos used by musician.js.

The statues are full photos on a black background (not cut-outs), so each cell is kept whole:
crop the cell inside its black border, resize to 200x200 and save to musician/aw-NN.png in
row-major order (aw-01 = GRAMMY, aw-02 = AMAs, aw-03 = MTV, aw-04 = Billboard, aw-05 = BET,
aw-06 = Brit, aw-07 = Latin GRAMMY, aw-08 = iHeart, aw-09 = Emmy, aw-10 = MOBO, aw-11 = NME,
aw-12 = Soul Train). Run from the project root:  python -I _art-src/split_awards.py
"""
import os
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "_art-src", "grids", "AWARDS.png")
OUT = os.path.join(ROOT, "musician")
COLS, ROWS, SIZE = 4, 3, 200


def main():
    im = Image.open(SRC).convert("RGB")
    cw, ch = im.size[0] / COLS, im.size[1] / ROWS
    os.makedirs(OUT, exist_ok=True)
    for r in range(ROWS):
        for c in range(COLS):
            box = (
                round(c * cw) + 2,
                round(r * ch) + 2,
                round((c + 1) * cw) - 2,
                round((r + 1) * ch) - 2,
            )
            cell = im.crop(box).resize((SIZE, SIZE), Image.LANCZOS)
            out = os.path.join(OUT, "aw-%02d.png" % (r * COLS + c + 1))
            cell.save(out, optimize=True)
            print(out)


if __name__ == "__main__":
    main()
