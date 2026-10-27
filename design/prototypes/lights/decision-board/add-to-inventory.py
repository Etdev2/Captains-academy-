#!/usr/bin/env python3
"""Add this prototype pack to the decision board's image inventory."""

import argparse
import json
import struct
from pathlib import Path


HERE = Path(__file__).resolve().parent
REPO = HERE.parents[3]
ADDITIONS = HERE / "inventory-additions.json"


def png_size(path: Path) -> tuple[int, int]:
    with path.open("rb") as image:
        header = image.read(24)
    if header[:8] != b"\x89PNG\r\n\x1a\n" or header[12:16] != b"IHDR":
        raise ValueError(f"Not a PNG: {path}")
    return struct.unpack(">II", header[16:24])


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--inventory",
        type=Path,
        default=REPO / "docs/prototypes/inventory.json",
        help="Decision board inventory file",
    )
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    if not args.inventory.is_file():
        parser.error(
            f"{args.inventory} does not exist. Run this after the decision board "
            "branch contains docs/prototypes/inventory.json."
        )

    inventory = json.loads(args.inventory.read_text())
    additions = json.loads(ADDITIONS.read_text())
    if not isinstance(inventory.get("items"), list) or not isinstance(additions, list):
        raise ValueError("Expected an inventory with an items list and a list of additions.")

    existing = {item["id"]: item for item in inventory["items"]}
    added = 0
    for item in additions:
        image = REPO / item["image"]
        if not image.is_file():
            raise FileNotFoundError(image)
        if png_size(image) != (item["width"], item["height"]):
            raise ValueError(f"Recorded dimensions do not match {image}")
        prior = existing.get(item["id"])
        if prior is not None:
            if prior != item:
                raise ValueError(f"Existing id differs: {item['id']}")
            continue
        inventory["items"].append(item)
        existing[item["id"]] = item
        added += 1

    if not args.dry_run and added:
        args.inventory.write_text(json.dumps(inventory, indent=2) + "\n")
    print(f"{added} image entries to add; {len(additions) - added} already present.")


if __name__ == "__main__":
    main()
