#!/usr/bin/env node
/* global document, window */
// Captures the primary screen of every interactive prototype variant
// (src/prototypes/live) and registers each capture on the Decision Desk.
//
//   node scripts/prototype-live-screenshots.mjs [base URL]
//
// Run it against a production preview (`npx vite build && npx vite preview`,
// default http://localhost:4173). For each of the 5 categories and 3
// variants it writes two images to docs/prototypes/interactive/images/:
//   <category>-<variant>-desktop.png  1440 wide, full page up to 3000 px tall
//   <category>-<variant>-iphone.png   390 x 844 at 2x, the first screen
// and adds or updates their items in docs/prototypes/inventory.json, keeping
// every existing item and id. Then run scripts/prototype-thumbnails.py to
// record sizes, colors and previews, and scripts/prototype-inventory.ts.
//
// The frame (A/B/C switcher) is hidden with `frame=0`, so each capture shows
// the variant alone. These are screenshots of the new implementation, kept
// apart from the reference images in the other prototype folders.

import { chromium } from '@playwright/test';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const base = (process.argv[2] ?? 'http://localhost:4173').replace(/\/$/, '');
const outDir = 'docs/prototypes/interactive/images';
const inventoryPath = join(root, 'docs/prototypes/inventory.json');
const today = new Date().toISOString().slice(0, 10);

// Mirrors src/prototypes/live/shared/routes.ts; tests/prototype-live.test.ts checks they agree.
const categories = [
  ['console', "Captain's Console"],
  ['license', 'License Navigator & Forms'],
  ['sea-time', 'Sea-Time Logbook'],
  ['study', 'Study & Exam Prep'],
  ['arcade', 'Arcade & Simulations'],
];
const variants = [
  ['a', 'A', 'Night Bridge'],
  ['b', 'B', 'Clean & Light'],
  ['c', 'C', 'Guided Mentor'],
];
const devices = [
  {
    key: 'desktop',
    label: 'Desktop (1440 wide)',
    title: 'desktop',
    context: { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 },
    fullPage: true,
  },
  {
    key: 'iphone',
    label: 'iPhone (390 wide)',
    title: 'iPhone',
    context: {
      viewport: { width: 390, height: 844 },
      deviceScaleFactor: 2,
      isMobile: true,
      hasTouch: true,
    },
    fullPage: false,
  },
];

mkdirSync(join(root, outDir), { recursive: true });
const inventory = JSON.parse(readFileSync(inventoryPath, 'utf8'));
const failures = [];
const browser = await chromium.launch();

for (const device of devices) {
  const context = await browser.newContext({ ...device.context, reducedMotion: 'reduce' });
  for (const [category, categoryTitle] of categories) {
    for (const [variant, letter, name] of variants) {
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', (e) => errors.push(e.message));
      page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
      const interactive = `/prototypes/live/?category=${category}&variant=${variant}`;
      await page.goto(`${base}${interactive}&frame=0`, { waitUntil: 'networkidle' });
      await page.waitForFunction(
        () =>
          !document.querySelector('.live-loading') && document.querySelector('#variant-root > *'),
      );
      await page.waitForTimeout(400);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - window.innerWidth,
      );
      const height = await page.evaluate(() => document.documentElement.scrollHeight);
      const file = `${outDir}/${category}-${variant}-${device.key}.png`;
      await page.screenshot({
        path: join(root, file),
        fullPage: device.fullPage,
        clip: device.fullPage
          ? { x: 0, y: 0, width: device.context.viewport.width, height: Math.min(height, 3000) }
          : undefined,
      });
      if (errors.length > 0) failures.push(`${file}: console errors: ${errors.join(' | ')}`);
      if (overflow > 0) failures.push(`${file}: page scrolls sideways by ${overflow}px`);
      console.log(`${file}  ${errors.length} errors, overflow ${overflow}px`);
      await page.close();

      const id = `cl-live-${category}-${variant}-${device.key}`;
      const item = {
        id,
        title: `${categoryTitle}, variant ${letter}: ${name} · ${device.title}`,
        creator: 'Claude',
        source: `Screenshot of the interactive prototype at ${interactive}, taken by scripts/prototype-live-screenshots.mjs (${today})`,
        style: name,
        feature: categoryTitle,
        kind: 'concept',
        device: device.label,
        image: file,
        availability: 'available',
        notes: `Primary screen of the ${name} direction for ${categoryTitle}. Open the interactive prototype to try the journey. Fictional sample data; licensing figures other than OUPV near-coastal sea service are illustrative.`,
        interactive,
      };
      const at = inventory.items.findIndex((i) => i.id === id);
      if (at === -1) {
        inventory.items.push(item);
      } else {
        // Keep the recorded size and color until the thumbnail script refreshes them.
        const { width, height: h, color } = inventory.items[at];
        inventory.items[at] = { ...item, width, height: h, color };
      }
    }
  }
  await context.close();
}
await browser.close();
writeFileSync(inventoryPath, `${JSON.stringify(inventory, null, 2)}\n`);

if (failures.length > 0) {
  console.error(failures.join('\n'));
  process.exit(1);
}
console.log('All 30 captures written. Next: python3 scripts/prototype-thumbnails.py');
