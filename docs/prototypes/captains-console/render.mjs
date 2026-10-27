/* global process, document, window, console */
// Renders the Captain's Console mockups in source/ to PNGs in images/.
// Desktop: the whole page at 1440 wide. iPhone: the page as real 390x844
// screens, scrolled top to bottom and laid side by side in one image, so the
// decision board can show it at a readable size. Both at 2x.
// Run from the repository root: node docs/prototypes/captains-console/render.mjs
import { chromium } from '@playwright/test';
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const screens = process.env.SCREENS
  ? process.env.SCREENS.split(',')
  : ['license-navigator', 'forms-workspace', 'sea-time-logbook'];
const SCALE = 2;
const PHONE = { width: 390, height: 844 };
// Each phone screen repeats at least this much of the one before it.
const OVERLAP = 80;

const browser = await chromium.launch();
const tmp = mkdtempSync(join(tmpdir(), 'console-frames-'));

const desktop = await browser.newPage({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: SCALE,
});
const phone = await browser.newPage({
  viewport: PHONE,
  deviceScaleFactor: SCALE,
  isMobile: true,
  hasTouch: true,
});
const sheet = await browser.newPage({ deviceScaleFactor: SCALE });

for (const s of screens) {
  const url = `file://${join(here, 'source', `${s}.html`)}`;

  await desktop.goto(url);
  await desktop.evaluate(() => document.fonts.ready);
  await desktop.screenshot({ path: join(here, 'images', `${s}-desktop.png`), fullPage: true });

  await phone.goto(url);
  await phone.evaluate(() => document.fonts.ready);
  const total = await phone.evaluate(() => document.documentElement.scrollHeight);
  const last = Math.max(0, total - PHONE.height);
  const count = last === 0 ? 1 : Math.ceil(last / (PHONE.height - OVERLAP)) + 1;
  const frames = [];
  for (let i = 0; i < count; i++) {
    const y = count === 1 ? 0 : Math.round((last * i) / (count - 1));
    await phone.evaluate((top) => window.scrollTo(0, top), y);
    const path = join(tmp, `${s}-${i}.png`);
    await phone.screenshot({ path });
    frames.push(path);
  }

  const gap = 36;
  const width = count * PHONE.width + (count + 1) * gap;
  const height = PHONE.height + 2 * gap + 34;
  await sheet.setViewportSize({ width, height });
  await sheet.setContent(`<!doctype html><html><body style="margin:0;background:#03060c;font:600 12px 'DejaVu Sans Mono',monospace;letter-spacing:.06em;color:#93a6bf">
    <div style="display:flex;gap:${gap}px;padding:${gap}px">
      ${frames
        .map(
          (f, i) => `<figure style="margin:0;width:${PHONE.width}px">
        <img src="data:image/png;base64,${readFileSync(f).toString('base64')}" style="display:block;width:${PHONE.width}px;height:${PHONE.height}px;border-radius:28px;outline:2px solid #1e3048;outline-offset:4px">
        <figcaption style="margin-top:16px;text-align:center">IPHONE 390×844 · SCREEN ${i + 1} OF ${count} · FICTIONAL DATA</figcaption>
      </figure>`,
        )
        .join('')}
    </div></body></html>`);
  await sheet.evaluate(() => Promise.all([...document.images].map((i) => i.decode())));
  await sheet.screenshot({ path: join(here, 'images', `${s}-iphone.png`) });
  console.log(`${s}: desktop, iphone in ${count} screens`);
}
await browser.close();
