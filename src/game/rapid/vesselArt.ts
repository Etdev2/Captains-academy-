import * as Phaser from 'phaser';
import type { Art } from '../../sim/chapter1/definitions';

// Top-down drawings for the Definitions cards: one vessel each, bow up, with
// the detail that answers the card (a trawl astern, prop wash under sail, a
// buoy on the crane). The art stays off red and green, which mean port and
// starboard (G15). Coordinates are pixels around the card's center.

const C = {
  hull: 0xe8eef3,
  darkHull: 0x56636f,
  deck: 0x9aa8b4,
  cabin: 0xc9d3db,
  sail: 0xf4f6f8,
  gold: 0xf4d06f,
  blue: 0x4fc3ff,
  navy: 0x1f4fbf,
  wake: 0x8fd0ff,
  line: 0xb8c6d2,
  smoke: 0x8d99a3,
  pipe: 0xc9a46a,
  bank: 0x2a2f2a,
  bankEdge: 0x4a5048,
  purple: 0xb48cff,
};

type G = Phaser.GameObjects.Graphics;
type Pt = [number, number];

interface Frame {
  readonly cx: number;
  readonly cy: number;
  /** Degrees clockwise; 0 is bow up. */
  readonly turn: number;
}

/** Turns a point in the vessel's frame (x right, y toward the stern) into screen pixels. */
const at = (f: Frame, x: number, y: number): Pt => {
  const a = (f.turn * Math.PI) / 180;
  return [f.cx + x * Math.cos(a) - y * Math.sin(a), f.cy + x * Math.sin(a) + y * Math.cos(a)];
};

const shape = (g: G, f: Frame, pts: Pt[], color: number, alpha = 1): void => {
  g.fillStyle(color, alpha).fillPoints(
    pts.map(([x, y]) => {
      const [sx, sy] = at(f, x, y);
      return new Phaser.Math.Vector2(sx, sy);
    }),
    true,
  );
};

const line = (g: G, f: Frame, a: Pt, b: Pt, width: number, color: number, alpha = 1): void => {
  const [x1, y1] = at(f, a[0], a[1]);
  const [x2, y2] = at(f, b[0], b[1]);
  g.lineStyle(width, color, alpha).lineBetween(x1, y1, x2, y2);
};

const dot = (g: G, f: Frame, p: Pt, r: number, color: number, alpha = 1): void => {
  const [x, y] = at(f, p[0], p[1]);
  g.fillStyle(color, alpha).fillCircle(x, y, r);
};

/** A hull of length L and beam B centered on the frame, bow up. */
function hull(g: G, f: Frame, L: number, B: number, color: number, bow = 0.3): void {
  const h = L / 2;
  const b = B / 2;
  shape(
    g,
    f,
    [
      [0, -h],
      [b, -h + L * bow],
      [b, h],
      [-b, h],
      [-b, -h + L * bow],
    ],
    color,
  );
}

function cabin(g: G, f: Frame, y0: number, y1: number, w: number, color = C.cabin): void {
  shape(
    g,
    f,
    [
      [-w / 2, y0],
      [w / 2, y0],
      [w / 2, y1],
      [-w / 2, y1],
    ],
    color,
  );
}

/** A V of wake spreading from the stern. */
function wake(g: G, f: Frame, sternY: number, spread: number, length: number): void {
  for (const side of [-1, 1]) {
    line(g, f, [side * 10, sternY], [side * spread, sternY + length], 4, C.wake, 0.55);
    line(
      g,
      f,
      [side * 18, sternY + 10],
      [side * spread * 0.7, sternY + length * 0.8],
      2,
      C.wake,
      0.3,
    );
  }
}

/** Churned water from a turning propeller. */
function propWash(g: G, f: Frame, sternY: number): void {
  for (let i = 0; i < 9; i++) {
    const y = sternY + 12 + i * 11;
    const r = 5 + i * 1.3;
    dot(g, f, [((i % 3) - 1) * 8, y], r, C.wake, 0.45 - i * 0.04);
  }
}

function exhaust(g: G, f: Frame, x: number, y: number): void {
  for (let i = 0; i < 4; i++)
    dot(g, f, [x + i * 9, y + i * 12], 6 + i * 3, C.smoke, 0.6 - i * 0.12);
}

/** Three arrows showing where the wind blows to: across the boat, or from dead astern. */
function windArrows(g: G, cx: number, cy: number, fromAstern = false): void {
  g.lineStyle(3, C.line, 0.6);
  for (let i = 0; i < 3; i++) {
    if (fromAstern) {
      const x = cx + i * 40;
      g.lineBetween(x, cy + 70, x, cy);
      g.lineBetween(x, cy, x - 8, cy + 12);
      g.lineBetween(x, cy, x + 8, cy + 12);
    } else {
      const y = cy + i * 26;
      g.lineBetween(cx, y, cx + 70, y + 20);
      g.lineBetween(cx + 70, y + 20, cx + 56, y + 21);
      g.lineBetween(cx + 70, y + 20, cx + 60, y + 9);
    }
  }
}

function sailboat(g: G, f: Frame, opts: { sail: boolean; spinnaker?: boolean }): void {
  hull(g, f, 170, 56, C.hull, 0.4);
  cabin(g, f, -10, 40, 32);
  dot(g, f, [0, -20], 5, C.deck);
  if (opts.sail) {
    // Mainsail swung out to port on a long boom, full of wind, and a jib forward.
    shape(
      g,
      f,
      [
        [0, -26],
        [-30, 0],
        [-78, 60],
        [-98, 92],
        [-40, 72],
        [-8, 40],
      ],
      C.sail,
    );
    line(g, f, [0, -26], [-98, 92], 4, C.deck);
    line(g, f, [0, -26], [-98, 92], 2, C.blue, 0.5);
    shape(
      g,
      f,
      [
        [0, -30],
        [2, -84],
        [-34, -40],
      ],
      C.sail,
    );
    line(g, f, [2, -84], [-34, -40], 2, C.blue, 0.5);
  } else {
    // Sail furled along the boom.
    line(g, f, [0, -20], [0, 62], 9, C.sail);
  }
  if (opts.spinnaker) {
    const [sx, sy] = at(f, 0, -150);
    g.fillStyle(C.gold, 1).fillEllipse(sx, sy, 150, 90);
    g.fillStyle(C.blue, 1).fillEllipse(sx, sy, 150, 30);
    line(g, f, [0, -84], [-60, -140], 2, C.line);
    line(g, f, [0, -84], [60, -140], 2, C.line);
  }
}

function ship(g: G, f: Frame, L: number, B: number, color = C.darkHull): void {
  hull(g, f, L, B, color, 0.18);
  cabin(g, f, L * 0.3, L * 0.42, B * 0.8, C.hull);
  dot(g, f, [0, L * 0.36], B * 0.12, C.deck);
}

export function drawArt(g: G, art: Art, cx: number, cy: number): void {
  const f: Frame = { cx, cy, turn: 0 };
  switch (art) {
    case 'motorboat':
      hull(g, f, 200, 70, C.hull);
      cabin(g, f, -20, 30, 50);
      wake(g, f, 100, 110, 150);
      propWash(g, f, 100);
      return;
    case 'container-ship': {
      ship(g, f, 400, 84);
      const colors = [C.blue, C.gold, C.deck, C.purple];
      for (let row = 0; row < 7; row++) {
        for (let col = 0; col < 3; col++) {
          const y = -140 + row * 30;
          const x = -30 + col * 20;
          shape(
            g,
            f,
            [
              [x - 9, y],
              [x + 9, y],
              [x + 9, y + 26],
              [x - 9, y + 26],
            ],
            colors[(row + col) % 4] ?? C.deck,
          );
        }
      }
      wake(g, f, 200, 120, 60);
      return;
    }
    case 'sailboat':
      sailboat(g, f, { sail: true });
      wake(g, f, 85, 50, 80);
      windArrows(g, cx - 280, cy - 170);
      return;
    case 'spinnaker': {
      const down: Frame = { cx, cy: cy + 50, turn: 0 };
      sailboat(g, down, { sail: true, spinnaker: true });
      wake(g, down, 85, 50, 60);
      windArrows(g, cx - 260, cy + 60, true);
      return;
    }
    case 'motorsailer':
      sailboat(g, f, { sail: true });
      propWash(g, f, 85);
      exhaust(g, f, 22, 80);
      wake(g, f, 85, 70, 110);
      return;
    case 'sails-furled':
      sailboat(g, f, { sail: false });
      propWash(g, f, 85);
      exhaust(g, f, 22, 80);
      wake(g, f, 85, 70, 110);
      return;
    case 'trawler': {
      const boat: Frame = { cx, cy: cy - 110, turn: 0 };
      hull(g, boat, 170, 60, C.hull);
      cabin(g, boat, -50, -5, 44);
      line(g, boat, [-30, 70], [30, 70], 6, C.deck);
      // Two warps out to the trawl net.
      line(g, boat, [-24, 84], [-90, 240], 3, C.line);
      line(g, boat, [24, 84], [90, 240], 3, C.line);
      shape(
        g,
        boat,
        [
          [-90, 240],
          [90, 240],
          [30, 330],
          [-30, 330],
        ],
        C.line,
        0.35,
      );
      for (let i = 0; i < 6; i++) {
        const y = 240 + i * 15;
        const w = 90 - i * 10;
        line(g, boat, [-w, y], [w, y], 1.5, C.line, 0.8);
      }
      for (let i = -3; i <= 3; i++) line(g, boat, [i * 25, 240], [i * 8, 330], 1.5, C.line, 0.8);
      wake(g, boat, 85, 40, 50);
      return;
    }
    case 'troller': {
      const boat: Frame = { cx, cy: cy - 90, turn: 0 };
      hull(g, boat, 130, 46, C.hull);
      cabin(g, boat, -20, 20, 34);
      // Outrigger poles, each trailing a thin line with a lure far astern.
      for (const side of [-1, 1]) {
        line(g, boat, [side * 18, 0], [side * 120, 30], 3, C.deck);
        line(g, boat, [side * 120, 30], [side * 150, 300], 1.5, C.line, 0.8);
        dot(g, boat, [side * 150, 300], 6, C.gold);
      }
      wake(g, boat, 65, 50, 120);
      return;
    }
    case 'longliner': {
      const boat: Frame = { cx: cx + 40, cy: cy - 105, turn: 0 };
      hull(g, boat, 150, 52, C.hull);
      cabin(g, boat, -40, 0, 38);
      line(g, boat, [0, 75], [-120, 330], 2, C.line);
      for (let i = 1; i <= 5; i++) {
        const t = i / 5;
        dot(g, boat, [-120 * t, 75 + 255 * t], 9, C.gold);
        line(g, boat, [-120 * t + 6, 75 + 255 * t], [-120 * t + 30, 75 + 255 * t], 1.5, C.line);
      }
      wake(g, boat, 75, 40, 60);
      return;
    }
    case 'drifting-ship': {
      const turned: Frame = { cx, cy, turn: 35 };
      ship(g, turned, 300, 64);
      exhaust(g, turned, 0, 90);
      // Drift arrows: she moves sideways with the wind, no wake astern.
      for (let i = 0; i < 3; i++) {
        const y = cy - 100 + i * 100;
        g.lineStyle(4, C.wake, 0.6).lineBetween(cx + 170, y, cx + 250, y);
        g.lineBetween(cx + 250, y, cx + 236, y - 10);
        g.lineBetween(cx + 250, y, cx + 236, y + 10);
      }
      return;
    }
    case 'no-steering': {
      g.lineStyle(14, C.wake, 0.3).beginPath();
      g.arc(cx + 40, cy + 20, 190, Math.PI * 0.6, Math.PI * 1.85);
      g.strokePath();
      ship(g, { cx: cx - 30, cy: cy - 150, turn: 80 }, 220, 52);
      return;
    }
    case 'buoy-tender':
      ship(g, f, 240, 64, C.darkHull);
      // The crane swings a navigation buoy aboard over the side.
      line(g, f, [0, -50], [120, -90], 8, C.gold);
      line(g, f, [120, -90], [130, -60], 2, C.line);
      dot(g, f, [130, -40], 24, C.gold);
      dot(g, f, [130, -40], 9, 0x0b0f14);
      return;
    case 'dredge': {
      shape(
        g,
        f,
        [
          [-50, -90],
          [50, -90],
          [50, 110],
          [-50, 110],
        ],
        C.darkHull,
      );
      cabin(g, f, 40, 95, 70, C.hull);
      // The cutter ladder reaches ahead; the pipeline floats off to starboard.
      shape(
        g,
        f,
        [
          [-14, -90],
          [14, -90],
          [14, -190],
          [-14, -190],
        ],
        C.deck,
      );
      dot(g, f, [0, -200], 22, C.gold);
      for (let i = 0; i < 12; i++) {
        const t = i / 11;
        dot(g, f, [60 + 220 * t, 100 + 120 * Math.sin(t * Math.PI * 0.8)], 10, C.pipe);
      }
      return;
    }
    case 'dive-boat': {
      hull(g, f, 140, 52, C.hull);
      cabin(g, f, -20, 20, 36);
      // A rigid flag A: white at the hoist, blue swallowtail.
      shape(
        g,
        f,
        [
          [30, 60],
          [55, 60],
          [55, 92],
          [30, 92],
        ],
        0xffffff,
      );
      shape(
        g,
        f,
        [
          [55, 60],
          [90, 60],
          [74, 76],
          [90, 92],
          [55, 92],
        ],
        C.navy,
      );
      for (const [x, y, r] of [
        [-150, -40, 30],
        [-170, 60, 22],
        [-120, 140, 26],
      ] as const) {
        const [sx, sy] = at(f, x, y);
        g.lineStyle(3, C.wake, 0.6).strokeCircle(sx, sy, r);
        g.strokeCircle(sx, sy, r * 0.5);
      }
      return;
    }
    case 'heavy-tow': {
      const tug: Frame = { cx, cy: cy - 170, turn: 0 };
      hull(g, tug, 90, 38, C.hull, 0.35);
      cabin(g, tug, -20, 15, 26);
      line(g, tug, [0, 45], [0, 210], 3, C.line);
      shape(
        g,
        tug,
        [
          [-60, 210],
          [60, 210],
          [60, 400],
          [-60, 400],
        ],
        C.darkHull,
      );
      shape(
        g,
        tug,
        [
          [-40, 230],
          [40, 230],
          [40, 380],
          [-40, 380],
        ],
        C.deck,
      );
      wake(g, tug, 45, 40, 40);
      return;
    }
    case 'replenishment': {
      const left: Frame = { cx: cx - 75, cy, turn: 0 };
      const right: Frame = { cx: cx + 75, cy: cy + 20, turn: 0 };
      ship(g, left, 300, 70);
      ship(g, right, 260, 60, C.deck);
      for (const y of [-60, 0, 60]) line(g, f, [-40, y], [45, y + 20], 3, C.gold);
      wake(g, left, 150, 60, 40);
      wake(g, right, 130, 60, 40);
      return;
    }
    case 'deep-draft': {
      // A narrow dredged channel between shoals; the tanker nearly fills it.
      g.fillStyle(C.bank, 1).fillRect(cx - 330, cy - 260, 210, 520);
      g.fillRect(cx + 120, cy - 260, 210, 520);
      g.lineStyle(3, C.bankEdge, 1).lineBetween(cx - 120, cy - 260, cx - 120, cy + 260);
      g.lineBetween(cx + 120, cy - 260, cx + 120, cy + 260);
      for (const x of [-95, 95]) {
        for (let y = -250; y < 250; y += 24)
          g.lineStyle(2, C.line, 0.4).lineBetween(cx + x, cy + y, cx + x, cy + y + 12);
      }
      ship(g, f, 440, 120);
      for (let y = -120; y < 120; y += 40)
        shape(
          g,
          f,
          [
            [-30, y],
            [30, y],
            [30, y + 30],
            [-30, y + 30],
          ],
          C.deck,
        );
      return;
    }
  }
}
