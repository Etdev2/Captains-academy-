import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { inventoryMarkdown, parseInventory } from '../src/prototypes/inventory.ts';

// Writes docs/prototypes/INVENTORY.md from docs/prototypes/inventory.json.
// tests/prototype-inventory.test.ts fails when the two drift apart. After
// changing images, run scripts/prototype-thumbnails.py too.

const dir = join(import.meta.dirname, '..', 'docs', 'prototypes');
const inventory = parseInventory(JSON.parse(readFileSync(join(dir, 'inventory.json'), 'utf8')));
writeFileSync(join(dir, 'INVENTORY.md'), inventoryMarkdown(inventory));
console.log(`wrote docs/prototypes/INVENTORY.md (${inventory.items.length} items)`);
