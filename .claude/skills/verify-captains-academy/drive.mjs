// Drives the /play game with Playwright from a JSON list of steps and writes
// evidence: one screenshot per `screenshot` step and steps.log.json with the
// game's state after every step. Run it through control.sh drive.
//
// The game draws on a canvas, so there are no DOM handles inside it. Steps use
// the game's own 1280 x 768 coordinates, scaled to the canvas, and read state
// from window.__captainsAcademy (frame, outcome, speedMmPerS, level, port,
// starboard, muted, horn).
import { chromium, devices } from '@playwright/test';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const [url, stepsPath, out] = process.argv.slice(2);
const steps = JSON.parse(readFileSync(stepsPath, 'utf8'));

const VIEWPORTS = {
  desktop: { viewport: { width: 1280, height: 768 } },
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
const readState = () => page.evaluate(() => window.__captainsAcademy ?? null);

async function run(step) {
  switch (step.do) {
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
      // `query` adds a search string to /play/, such as "?unlock=all".
      await page.goto(step.query ? url + step.query : url);
      if (step.viewport !== 'phone-portrait') {
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
