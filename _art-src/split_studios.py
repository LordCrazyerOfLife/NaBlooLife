"""Cut the 4x3 STUDIOS.png sheet into the 12 studio photos used by musician.js.

The rooms are full photos on a black background (not sprites), so each cell is kept whole instead of
running the blob cut-out: crop the cell, trim the empty border, resize to 240 px wide and save to
musician/studio-NN.png. Run from the project root:  python -I _art-src/split_studios.py
"""
import os
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "_art-src", "grids", "STUDIOS.png")
OUT = os.path.join(ROOT, "musician")
COLS, ROWS, W = 4, 3, 240


def main():
    im = Image.open(SRC).convert("RGB")
    cw, ch = im.size[0] / COLS, im.size[1] / ROWS
    os.makedirs(OUT, exist_ok=True)
    for i in range(COLS * ROWS):
        c, r = i % COLS, i // COLS
        cell = im.crop((round(c * cw), round(r * ch), round((c + 1) * cw), round((r + 1) * ch)))
        # trim the pure-black margins so every room fills its own frame
        cell = cell.crop(cell.convert("L").point(lambda v: 255 if v > 8 else 0).getbbox())
        h = max(1, round(cell.size[1] * W / cell.size[0]))
        cell = cell.resize((W, h), Image.LANCZOS)
        name = f"studio-{i + 1:02d}.png"
        cell.save(os.path.join(OUT, name), optimize=True)
        print("wrote musician/" + name, cell.size)


if __name__ == "__main__":
    main()
