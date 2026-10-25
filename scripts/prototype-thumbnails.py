#!/usr/bin/env python3
"""Writes a small JPEG preview for every inventory image into docs/prototypes/thumbnails/.

The decision board loads these on its cards; the full-size viewer always opens
the original, which this script never changes. It also records each original's
width and height in docs/prototypes/inventory.json, so the board reserves the
right space before an image loads. Rerun after adding an image to the
inventory. Needs Python 3 and Pillow.
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
sized = []
for item in inventory['items']:
    if not item.get('image'):
        sized.append(item)
        continue
    target = OUT / f"{item['id']}.jpg"
    wanted.add(target.name)
    with Image.open(ROOT / item['image']) as im:
        # Keep the inventory's key order: width and height follow image.
        entry = {}
        for key, value in item.items():
            if key in ('width', 'height'):
                continue
            entry[key] = value
            if key == 'image':
                entry['width'], entry['height'] = im.size
        sized.append(entry)
        im = im.convert('RGB')
        if im.width > WIDTH:
            im = im.resize((WIDTH, round(im.height * WIDTH / im.width)), Image.LANCZOS)
        im.save(target, 'JPEG', quality=84, optimize=True, progressive=True)
inventory['items'] = sized
(ROOT / 'docs/prototypes/inventory.json').write_text(
    json.dumps(inventory, indent=2, ensure_ascii=False) + '\n'
)
for stale in OUT.glob('*.jpg'):
    if stale.name not in wanted:
        stale.unlink()
print(f'{len(wanted)} thumbnails in {OUT.relative_to(ROOT)}')
