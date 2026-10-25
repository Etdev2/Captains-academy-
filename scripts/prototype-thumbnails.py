#!/usr/bin/env python3
"""Writes a small JPEG preview for every inventory image into docs/prototypes/thumbnails/.

The gallery grid loads these on phones; the full-size viewer always opens the
original, which this script never changes. Rerun after adding an image to
docs/prototypes/inventory.json. Needs Python 3 and Pillow.
"""
import json
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'docs/prototypes/thumbnails'
WIDTH = 720

OUT.mkdir(exist_ok=True)
inventory = json.loads((ROOT / 'docs/prototypes/inventory.json').read_text())
wanted = set()
for item in inventory['items']:
    if not item.get('image'):
        continue
    target = OUT / f"{item['id']}.jpg"
    wanted.add(target.name)
    with Image.open(ROOT / item['image']) as im:
        im = im.convert('RGB')
        if im.width > WIDTH:
            im = im.resize((WIDTH, round(im.height * WIDTH / im.width)), Image.LANCZOS)
        im.save(target, 'JPEG', quality=84, optimize=True, progressive=True)
for stale in OUT.glob('*.jpg'):
    if stale.name not in wanted:
        stale.unlink()
print(f'{len(wanted)} thumbnails in {OUT.relative_to(ROOT)}')
