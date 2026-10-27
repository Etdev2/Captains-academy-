import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  categories,
  inventoryMarkdown,
  isReviewable,
  parseInventory,
  thumbnailPath,
} from '../src/prototypes/inventory';

// The decision board's inventory (issue #72) must match the files on disk, so
// every listed image loads, nothing is counted twice and the ids stay stable.

const root = join(import.meta.dirname, '..');
const inventory = parseInventory(
  JSON.parse(readFileSync(join(root, 'docs/prototypes/inventory.json'), 'utf8')),
);
const { items } = inventory;
const byId = new Map(items.map((i) => [i.id, i]));

describe('the prototype inventory', () => {
  it('gives every item its own id', () => {
    expect(new Set(items.map((i) => i.id)).size).toBe(items.length);
  });

  it('keeps the ids that saved boards already point at', () => {
    // A rename would orphan saved and exported dots. Add new ids instead.
    for (const id of [
      'gpt-home-coastal-editorial',
      'gpt-lights-ocean-studio',
      'gpt-book-dark-cleanup',
      'cl-mock-ch1-01-definitions',
      'cl-nhr-fog-leg',
      'app-definitions-phone-390-1-first-card',
    ]) {
      expect(byId.has(id), id).toBe(true);
    }
  });

  it('points every available item at a file that exists, with a preview for each image', () => {
    for (const item of items) {
      if (item.image !== null) {
        expect(existsSync(join(root, item.image)), item.image).toBe(true);
        const thumb = thumbnailPath(item);
        expect(thumb !== null && existsSync(join(root, thumb)), `${item.id} thumbnail`).toBe(true);
      }
      if (item.document !== undefined) {
        expect(existsSync(join(root, item.document)), item.document).toBe(true);
      }
    }
  });

  it('keeps every image where the decision board build looks for it', () => {
    // src/prototypes/main.ts bundles only these folders.
    const served = /^docs\/(prototypes\/.+\.(png|jpg|pdf)|design\/screenshots\/.+\.png)$/;
    for (const item of items) {
      if (item.image !== null) expect(item.image, item.id).toMatch(served);
      if (item.document !== undefined) expect(item.document, item.id).toMatch(served);
    }
  });

  it('records each image at the pixel size of the file', () => {
    const size = (path: string) => {
      const bytes = readFileSync(join(root, path));
      if (bytes.readUInt32BE(0) === 0x89504e47)
        return [bytes.readUInt32BE(16), bytes.readUInt32BE(20)];
      let at = 2;
      while (at < bytes.length) {
        const marker = bytes.readUInt16BE(at);
        if (marker >= 0xffc0 && marker <= 0xffc3)
          return [bytes.readUInt16BE(at + 7), bytes.readUInt16BE(at + 5)];
        at += 2 + bytes.readUInt16BE(at + 2);
      }
      return [0, 0];
    };
    for (const item of items) {
      if (item.image !== null) expect([item.width, item.height], item.id).toEqual(size(item.image));
    }
  });

  it('lists the styles it could not find instead of leaving them out', () => {
    const missing = items.filter((i) => i.availability === 'unavailable').map((i) => i.style);
    expect(missing).toEqual(['Clean maritime', 'Professional academy', 'Night bridge']);
    expect(items.filter((i) => i.availability === 'unavailable').some(isReviewable)).toBe(false);
  });

  it('links each extracted detail to the comparison board it came from', () => {
    const extracted = items.filter((i) => i.extractedFrom !== undefined);
    expect(extracted.length).toBeGreaterThan(0);
    for (const item of extracted) {
      const board = byId.get(item.extractedFrom ?? '');
      expect(board?.style, item.id).toBe('Comparison board');
      expect(board?.kind, item.id).toBe('reference');
    }
  });

  it('puts each image on the board once: comparison boards and reference stay off, and no two concepts share an image', () => {
    const onBoard = items.filter(isReviewable);
    expect(onBoard.some((i) => i.style === 'Comparison board')).toBe(false);
    const images = onBoard.map((i) => i.image);
    expect(new Set(images).size).toBe(images.length);
  });

  it('marks the ChatGPT and Claude images as visual concepts, and only app captures as the current app', () => {
    for (const item of items) {
      if (item.kind === 'app-screenshot') expect(item.style, item.id).toBe('Current app');
      if (item.style === 'Current app') expect(item.kind, item.id).toBe('app-screenshot');
    }
  });

  it('builds filters only from the styles and features it holds', () => {
    const styles = categories(items.filter(isReviewable), 'style');
    for (const style of [
      'Coastal editorial',
      'Precision marine',
      'Ocean studio',
      'Chart house',
      'Pacific modern',
      'Academy fieldbook',
      'Current app',
    ]) {
      expect(styles).toContain(style);
    }
    expect(categories(items, 'feature')).not.toContain('Sea-time log');
  });

  it('records the checksum of the supplied prototype book', () => {
    const book = readFileSync(
      join(root, 'docs/prototypes/rules-of-the-road/handoff/prototype-book-2026-10-25.pdf'),
    );
    expect(createHash('sha256').update(book).digest('hex')).toBe(
      inventory.sources.prototypeBook?.sha256,
    );
  });

  it('matches INVENTORY.md (run node scripts/prototype-inventory.ts after editing)', () => {
    const onDisk = readFileSync(join(root, 'docs/prototypes/INVENTORY.md'), 'utf8');
    expect(onDisk).toBe(inventoryMarkdown(inventory));
  });
});
