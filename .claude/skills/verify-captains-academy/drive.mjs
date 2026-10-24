// Drives the /play game, or the Rules of the Road level at /rules, with
// Playwright from a JSON list of steps and writes evidence: one screenshot per
// `screenshot` step and steps.log.json with the game's state after every step.
// Run it through control.sh drive.
//
// /play draws on a canvas, so there are no DOM handles inside it. Its steps use
// the game's own 1280 x 768 coordinates, scaled to the canvas, and read state
// from window.__captainsAcademy (frame, outcome, speedMmPerS, level, port,
// starboard, muted, horn). /rules is HTML with Phaser drawing only the vessel:
// its steps press the real answer buttons and read window.__captainsAcademyQuiz.
import { chromium, devices } from '@playwright/test';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const [url, stepsPath, out] = process.argv.slice(2);
const steps = JSON.parse(readFileSync(stepsPath, 'utf8'));

const VIEWPORTS = {
  desktop: { viewport: { width: 1280, height: 768 } },
  'desktop-wide': { viewport: { width: 1440, height: 900 } },
  'phone-390': { ...devices['iPhone 14'], viewport: { width: 390, height: 844 } },
  'phone-landscape': devices['Pixel 7 landscape'],
  'phone-portrait': devices['Pixel 7'],
};
// Lever geometry in game coordinates: port lever under the left thumb,
// starboard under the right. Stop is the middle of the track.
const LEVER_X = { port: 96, starboard: 1184 };
const LEVER_MID_Y = 473;
const LEVER_HALF = 135;

const browser = await chromium.launch();
let context = null;
let page = null;
// Phone viewports drive the game with touch, the way a player does there.
let touch = null;
const log = [];
let failed = null;

const canvasPoint = async (x, y) => {
  const box = await page.locator('#game canvas').boundingBox();
  if (!box) throw new Error('the game canvas is not visible');
  return [box.x + (x / 1280) * box.width, box.y + (y / 768) * box.height];
};
// A one-finger drag as real touch events, through the Chrome DevTools Protocol,
// since Playwright's touchscreen only taps.
async function touchDrag(x, fromY, toY) {
  const point = (y) => [{ x, y, id: 1 }];
  await touch.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: point(fromY) });
  for (let i = 1; i <= 6; i++) {
    await touch.send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: point(fromY + ((toY - fromY) * i) / 6),
    });
    await page.waitForTimeout(16);
  }
  await touch.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
}
const readState = () =>
  page.evaluate(() => window.__captainsAcademy ?? window.__captainsAcademyQuiz ?? null);

// definitions.answers.json and lights.answers.json map each /rules card id to its
// right button (1 to 5, and 1 to 7). tests/rapid.test.ts and tests/lights.test.ts
// keep them in step with the decks. Card ids never repeat across levels.
const answers = Object.assign(
  {},
  ...["definitions", "lights"].map((level) =>
    JSON.parse(readFileSync(new URL(`./features/steps/${level}.answers.json`, import.meta.url), "utf8")),
  ),
);
async function settle() {
  for (const deadline = Date.now() + 9000; Date.now() < deadline; ) {
    const s = await readState();
    if (s?.phase === 'question' || s?.phase === 'done') return s;
    await page.waitForTimeout(50);
  }
  throw new Error('the level never came back to a question');
}
async function answerCard(right) {
  const s = await settle();
  if (s.phase === 'done') return;
  const n = answers[s.card];
  if (!n) throw new Error(`no answer on file for card ${JSON.stringify(s.card)}`);
  const answerCount = await page.locator("#answers [data-answer]").count();
  const target = page.locator(`#answers [data-answer="${right ? n : (n % answerCount) + 1}"]`);
  if (touch) await target.tap();
  else await target.click();
  const deadline = Date.now() + 5000;
  for (;;) {
    const after = await readState();
    if (after && after.answered > s.answered) return;
    if (Date.now() > deadline) throw new Error('the tap did not answer the card');
    await page.waitForTimeout(50);
  }
}

async function run(step) {
  switch (step.do) {
    case 'answerRight':
    case 'answerWrong': {
      const right = step.do === 'answerRight';
      if (step.until === 'done') {
        while ((await settle()).phase !== 'done') await answerCard(right);
      } else {
        await answerCard(right);
      }
      return;
    }
    case 'click':
      await page.getByRole('button', { name: step.name, exact: true }).click();
      return;
    case 'open': {
      if (context) await context.close();
      context = await browser.newContext(VIEWPORTS[step.viewport ?? 'desktop']);
      if (step.storage) {
        await context.addInitScript((entries) => {
          for (const [k, v] of Object.entries(entries)) localStorage.setItem(k, v);
        }, step.storage);
      }
      page = await context.newPage();
      touch = VIEWPORTS[step.viewport ?? 'desktop'].hasTouch ? await context.newCDPSession(page) : null;
      await page.goto(new URL(step.path ?? '', url).href);
      if (step.path) {
        await page.locator('#art canvas').waitFor({ state: 'visible' });
      } else if (step.viewport !== 'phone-portrait') {
        await page.locator('#game canvas').waitFor({ state: 'visible' });
      }
      return;
    }
    case 'lever': {
      const y = LEVER_MID_Y - (step.to / 100) * LEVER_HALF;
      const [x0, y0] = await canvasPoint(LEVER_X[step.side], LEVER_MID_Y);
      const [, y1] = await canvasPoint(LEVER_X[step.side], y);
      if (touch) {
        await touchDrag(x0, y0, y1);
      } else {
        await page.mouse.move(x0, y0);
        await page.mouse.down();
        await page.mouse.move(x0, y1, { steps: 6 });
        await page.mouse.up();
      }
      return;
    }
    case 'tap': {
      const [x, y] = await canvasPoint(step.x, step.y);
      if (touch) await page.touchscreen.tap(x, y);
      else await page.mouse.click(x, y);
      return;
    }
    case 'key':
      await page.keyboard.down(step.key);
      await page.waitForTimeout(step.ms ?? 100);
      await page.keyboard.up(step.key);
      return;
    case 'wait':
      await page.waitForTimeout(step.ms);
      return;
    case 'waitFor': {
      const deadline = Date.now() + (step.timeoutMs ?? 30000);
      for (;;) {
        const s = await readState();
        const v = s?.[step.field];
        if (
          s &&
          (('eq' in step && v === step.eq) ||
            ('gt' in step && v > step.gt) ||
            ('lt' in step && v < step.lt))
        ) {
          return;
        }
        if (Date.now() > deadline) {
          throw new Error(`${step.field} never met ${JSON.stringify(step)}: ${JSON.stringify(s)}`);
        }
        await page.waitForTimeout(100);
      }
    }
    case 'expect': {
      const s = await readState();
      const v = s?.[step.field];
      const ok =
        ('eq' in step && v === step.eq) ||
        ('gt' in step && v > step.gt) ||
        ('lt' in step && v < step.lt);
      if (!ok) throw new Error(`expected ${step.field} ${JSON.stringify(step)} but saw ${JSON.stringify(v)}`);
      return;
    }
    case 'offline':
      await context.setOffline(step.on);
      return;
    case 'reload':
      await page.reload();
      return;
    case 'waitForOfflineCache':
      await page.waitForFunction(async () => {
        const reg = await navigator.serviceWorker?.ready;
        if (!reg || !navigator.serviceWorker.controller) return false;
        const names = await caches.keys();
        for (const n of names) if ((await (await caches.open(n)).keys()).length >= 2) return true;
        return false;
      }, null, { timeout: step.timeoutMs ?? 20000 });
      return;
    case 'screenshot':
      await page.screenshot({ path: join(out, `${step.name}.png`) });
      return;
    default:
      throw new Error(`unknown step ${JSON.stringify(step)}`);
  }
}

for (const [i, step] of steps.entries()) {
  try {
    await run(step);
    log.push({ i, step, ok: true, state: page ? await readState().catch(() => null) : null });
  } catch (e) {
    failed = e;
    log.push({ i, step, ok: false, error: String(e.message ?? e) });
    if (page) await page.screenshot({ path: join(out, `failed-step-${i}.png`) }).catch(() => {});
    break;
  }
}
writeFileSync(join(out, 'steps.log.json'), JSON.stringify(log, null, 2) + '\n');
await browser.close();
console.log(`${failed ? 'FAIL' : 'PASS'}: ${log.length} of ${steps.length} steps ran. Evidence in ${out}`);
if (failed) {
  console.error(failed.message);
  process.exit(1);
}
