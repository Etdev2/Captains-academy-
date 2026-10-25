#!/usr/bin/env python3
"""Writes a small JPEG preview for every inventory image into docs/prototypes/thumbnails/.

The decision board loads these on its cards; the full-size viewer always opens
the original, which this script never changes. It also records each original's
width and height in docs/prototypes/inventory.json, so the board reserves the
right space before an image loads, and its dominant color, which the board
paints in that space until the image arrives. Rerun after adding an image to the
inventory. Needs Python 3 and Pillow.

A wide strip also gets a 4:3 crop of its original, <id>-crop.jpg, which a
phone shows in place of the whole strip (src/prototypes/sections.ts, cropOf).
"""
import json
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'docs/prototypes/thumbnails'
WIDTH = 720
# Keep these three in step with src/prototypes/sections.ts.
WIDE = 2.6  # a strip at least this many times wider than tall is cropped on a phone
CROP_RATIO = 4 / 3
FOCUS = 0.31  # the point of the strip that stays in the crop frame, as a fraction



def dominant(im):
    """The most common color of a small, 8-color version of the image, as #rrggbb."""
    small = im.convert('RGB').resize((64, 64), Image.BILINEAR).quantize(8)
    count, index = max(small.getcolors())
    r, g, b = small.getpalette()[index * 3 : index * 3 + 3]
    return f'#{r:02x}{g:02x}{b:02x}'


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
            if key in ('width', 'height', 'color'):
                continue
            entry[key] = value
            if key == 'image':
                entry['width'], entry['height'] = im.size
                entry['color'] = dominant(im)
        sized.append(entry)
        im = im.convert('RGB')
        ratio = im.width / im.height
        if ratio >= WIDE and item['kind'] != 'reference':
            share = CROP_RATIO / ratio
            left = round(FOCUS * (1 - share) * im.width)
            crop = im.crop((left, 0, left + round(share * im.width), im.height))
            crop_name = f"{item['id']}-crop.jpg"
            wanted.add(crop_name)
            crop.save(OUT / crop_name, 'JPEG', quality=86, optimize=True, progressive=True)
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
