import * as Phaser from 'phaser';
import type { Mission } from '../sim/mission';

// The night harbor: water, shore, breakwater, docks and moored boats, plus the
// lights a skipper would actually see. Navigation lights keep their real
// colors; everything else stays off red and green (G15).

const COLOR = {
  water: 0x06121f,
  ripple: 0x24507a,
  shore: 0x1d2a2f,
  shoreEdge: 0x2f4048,
  breakwater: 0x4a5560,
  rock: 0x5d6873,
  dock: 0x8a6a45,
  dockEdge: 0x6b4f31,
  mooredHull: 0xb9c3cc,
  mooredDeck: 0x8d99a3,
  amber: 0xffc56b,
  white: 0xffffff,
  buoyRed: 0xff3030,
  buoyGreen: 0x30ff60,
};

type Px = (mm: number) => number;

interface Light {
  readonly x: number;
  readonly y: number;
  readonly color: number;
  readonly size: number;
  /** Flash period in ms, or 0 for steady. */
  readonly period: number;
  readonly phase: number;
}

/** Draws the fixed harbor once and animates its water and lights each frame. */
export class Scenery {
  private readonly ripples: Phaser.GameObjects.Graphics;
  private readonly lights: Phaser.GameObjects.Graphics;
  private readonly lightList: Light[] = [];
  private readonly rippleSeeds: [number, number, number][] = [];

  constructor(
    scene: Phaser.Scene,
    private readonly mission: Mission,
    private readonly px: Px,
  ) {
    const { world, obstacles } = mission;
    const g = scene.add.graphics();
    g.fillStyle(COLOR.water, 1).fillRect(0, 0, px(world.w), px(world.h));
    // Ripple positions are fixed per level, so the water looks the same each run.
    let seed = 12345;
    const rand = () => {
      seed = (Math.imul(seed, 1103515245) + 12345) >>> 0;
      return seed / 0x100000000;
    };
    for (let i = 0; i < 700; i++) this.rippleSeeds.push([rand(), rand(), rand()]);
    this.ripples = scene.add.graphics();

    for (const o of obstacles) {
      const x = px(o.x);
      const y = px(o.y);
      const w = px(o.w);
      const h = px(o.h);
      if (o.kind === 'shore') {
        g.fillStyle(COLOR.shore, 1).fillRect(x, y, w, h);
        g.lineStyle(3, COLOR.shoreEdge, 1).strokeRect(x, y, w, h);
        // Street lights along the waterfront.
        const along = w > h;
        const span = along ? o.w : o.h;
        for (let d = 6000; d < span; d += 12000) {
          this.lightList.push({
            x: along ? o.x + d : o.x + o.w / 2,
            y: along ? o.y + o.h / 2 : o.y + d,
            color: COLOR.amber,
            size: 4,
            period: 0,
            phase: 0,
          });
        }
      } else if (o.kind === 'breakwater') {
        g.fillStyle(COLOR.breakwater, 1).fillRect(x, y, w, h);
        g.fillStyle(COLOR.rock, 1);
        for (let d = 0; d < o.w; d += 2500) {
          g.fillCircle(px(o.x + d + 1200), px(o.y + o.h / 2), px(1400));
        }
      } else if (o.kind === 'dock') {
        g.fillStyle(COLOR.dock, 1).fillRect(x, y, w, h);
        g.lineStyle(2, COLOR.dockEdge, 1).strokeRect(x, y, w, h);
        // A small light on the seaward end of each finger pier.
        if (o.h > o.w) {
          this.lightList.push({
            x: o.x + o.w / 2,
            y: o.y + o.h - 500,
            color: COLOR.amber,
            size: 3,
            period: 0,
            phase: 0,
          });
        }
      } else {
        g.fillStyle(COLOR.mooredHull, 1).fillRoundedRect(x, y, w, h, 6);
        g.fillStyle(COLOR.mooredDeck, 1).fillRoundedRect(
          x + w * 0.2,
          y + h * 0.3,
          w * 0.6,
          h * 0.35,
          4,
        );
        // An anchor light: all-round white.
        this.lightList.push({
          x: o.x + o.w / 2,
          y: o.y + o.h * 0.45,
          color: COLOR.white,
          size: 3,
          period: 0,
          phase: 0,
        });
      }
    }

    // Entrance buoys at the breakwater gap. Red right returning: coming in from
    // sea, the red buoy is to starboard (east) and the green to port (west).
    const gap = findBreakwaterGap(mission);
    if (gap) {
      this.lightList.push(
        {
          x: gap.west + 3000,
          y: gap.y - 3000,
          color: COLOR.buoyGreen,
          size: 5,
          period: 4000,
          phase: 0,
        },
        {
          x: gap.east - 3000,
          y: gap.y - 3000,
          color: COLOR.buoyRed,
          size: 5,
          period: 4000,
          phase: 2000,
        },
      );
    }
    this.lights = scene.add.graphics();
  }

  /** Animates ripples and flashing lights. Call every render. */
  update(timeMs: number): void {
    const { world } = this.mission;
    const r = this.ripples.clear();
    for (const [sx, sy, phase] of this.rippleSeeds) {
      const drift = ((timeMs / 1000) * 0.6 + phase * 40) % 40;
      const x = this.px(sx * world.w) + drift;
      const y = this.px(sy * world.h);
      const alpha = 0.3 + 0.4 * (0.5 + 0.5 * Math.sin(timeMs / 900 + phase * 20));
      r.lineStyle(3, COLOR.ripple, alpha).lineBetween(x, y, x + 22, y);
    }
    const g = this.lights.clear();
    for (const l of this.lightList) {
      const on = l.period === 0 || (timeMs + l.phase) % l.period < 600;
      if (!on) continue;
      const x = this.px(l.x);
      const y = this.px(l.y);
      g.fillStyle(l.color, 0.18).fillCircle(x, y, l.size * 4);
      g.fillStyle(l.color, 1).fillCircle(x, y, l.size);
    }
  }
}

function findBreakwaterGap(mission: Mission): { west: number; east: number; y: number } | null {
  const walls = mission.obstacles.filter((o) => o.kind === 'breakwater').sort((a, b) => a.x - b.x);
  const [a, b] = walls;
  if (!a || !b) return null;
  return { west: a.x + a.w, east: b.x, y: a.y };
}
