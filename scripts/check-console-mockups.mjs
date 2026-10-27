/* global document, window, Image */
// Opens the decision board on desktop (1440x900) and on an iPhone-sized
// viewport (390x844, touch), and checks every Captain's Console mockup: its
// tile sits in the right section, its preview and full-size image load at the
// file's size, and the viewer opens it with the board's feedback controls.
// Saves screenshots to the folder given as the second argument.
//
//   node scripts/check-console-mockups.mjs http://localhost:4173 proof/screenshots
import { chromium, devices } from '@playwright/test';
import { mkdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const base = (process.argv[2] ?? 'http://localhost:4173').replace(/\/$/, '');
const out = process.argv[3] ?? 'proof/screenshots';
mkdirSync(out, { recursive: true });

const inventory = JSON.parse(readFileSync('docs/prototypes/inventory.json', 'utf8'));
const mockups = inventory.items.filter((i) => i.id.startsWith('cl-console-'));
const sectionOf = (id) => (id.includes('sea-time') ? 'sea-time-logbook' : 'forms-license');
if (mockups.length !== 6) throw new Error(`expected 6 mockups, found ${mockups.length}`);

// The iPhone 13 profile without its WebKit default: only Chromium is installed.
const iphone = { ...devices['iPhone 13'] };
delete iphone.defaultBrowserType;

const targets = [
  { name: 'desktop', options: { viewport: { width: 1440, height: 900 } } },
  {
    name: 'iphone',
    options: iphone,
  },
];

const browser = await chromium.launch();
let failures = 0;
const fail = (msg) => {
  failures++;
  console.log(`FAIL ${msg}`);
};

for (const t of targets) {
  const context = await browser.newContext(t.options);
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(`${base}/prototypes/`, { waitUntil: 'networkidle' });
  await page.getByRole('heading', { name: 'Decision board' }).waitFor();
  const vw = page.viewportSize();
  console.log(`\n${t.name} ${vw.width}x${vw.height} ${base}/prototypes/`);

  for (const [section, title] of [
    ['forms-license', 'Forms & License Navigator'],
    ['sea-time-logbook', 'Sea-Time Logbook'],
  ]) {
    const head = page.locator(`#section-${section} > h2`);
    const text = (await head.textContent()) ?? '';
    if (!text.startsWith(title)) fail(`${t.name}: section ${section} header is "${text}"`);
    await page.locator(`#section-${section}`).scrollIntoViewIfNeeded();
    await page.evaluate(
      (id) => document.getElementById(id)?.scrollIntoView({ block: 'start' }),
      `section-${section}`,
    );
    await page.waitForTimeout(400);
    await page.screenshot({ path: join(out, `console-${t.name}-section-${section}.jpg`) });
  }

  const urls = await page.evaluate(() => window.__prototypeGallery);
  for (const m of mockups) {
    const tile = page.locator(`#section-${sectionOf(m.id)} [data-id="${m.id}"]`);
    if ((await tile.count()) !== 1) {
      fail(`${t.name}: ${m.id} has no tile in its section`);
      continue;
    }
    const [image, thumb] = await page.evaluate(
      async ([a, b]) => {
        const load = (src) =>
          new Promise((resolve) => {
            const img = new Image();
            img.onload = () => resolve([img.naturalWidth, img.naturalHeight]);
            img.onerror = () => resolve([0, 0]);
            img.src = src;
          });
        return [await load(a), await load(b)];
      },
      [urls.images[m.id], urls.thumbnails[m.id]],
    );
    const box = await tile.boundingBox();
    const ok = image[0] === m.width && image[1] === m.height && thumb[0] > 0;
    if (!ok) fail(`${t.name}: ${m.id} image ${image} thumb ${thumb}, want ${m.width}x${m.height}`);
    if (!box || box.width < 44 || box.height < 44)
      fail(`${t.name}: ${m.id} tile is ${box?.width}x${box?.height}`);

    await tile.getByRole('button').first().click();
    const dialog = page.getByRole('dialog');
    await dialog.waitFor();
    const big = dialog.locator('img').first();
    await big.waitFor();
    const natural = await big.evaluate(async (img) => {
      if (!img.complete) await new Promise((r) => img.addEventListener('load', r, { once: true }));
      return [img.naturalWidth, img.naturalHeight];
    });
    const dialogText = (await dialog.textContent()) ?? '';
    if (natural[0] !== m.width) fail(`${t.name}: ${m.id} viewer image ${natural}`);
    if (!dialogText.includes(m.title.split(' · ')[0]))
      fail(`${t.name}: ${m.id} viewer has no title`);
    const thumbsUp = await dialog.getByRole('button', { name: 'Thumbs up' }).count();
    await page.waitForTimeout(250);
    await page.screenshot({
      path: join(out, `console-${t.name}-viewer-${m.id.replace('cl-console-', '')}.jpg`),
    });
    console.log(
      `ok ${m.id}: tile ${Math.round(box.width)}x${Math.round(box.height)}, full ${natural.join('x')}, thumbs ${thumbsUp ? 'yes' : 'no'}`,
    );
    await page.keyboard.press('Escape');
    await dialog.waitFor({ state: 'detached' });
  }
  if (errors.length) fail(`${t.name}: page errors ${errors.join('; ')}`);
  await context.close();
}
await browser.close();
console.log(
  failures
    ? `\n${failures} failure(s)`
    : "\nall Captain's Console mockups load on desktop and iPhone",
);
process.exit(failures ? 1 : 0);
