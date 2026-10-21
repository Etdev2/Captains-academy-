import * as Phaser from 'phaser';
import { FULL } from '../sim/sim';

// On-screen helm for one thumb per side (G8): the port engine lever on the
// left and the starboard lever on the right, like the levers on a twin-engine
// boat. There is no wheel: both levers ahead drive the boat ahead, and
// splitting them turns it. Each lever stays where it is left, like a real
// one, and follows its own finger, so both can be held at once.

const GOLD = 0xf4d06f;
const BLUE = 0x4fc3ff;
const PANEL = 0x15324d;
// Within this much of stop, a lever snaps to stop.
const DETENT = 8;
// How far from a lever's track a touch still grabs it.
const REACH = 90;

type Lever = 'port' | 'starboard';

interface Layout {
  readonly viewW: number;
  readonly viewH: number;
}

export class Helm {
  port = 0;
  starboard = 0;
  private readonly pointers = new Map<number, Lever>();
  private readonly graphics: Phaser.GameObjects.Graphics;
  private readonly track: { portX: number; starboardX: number; top: number; bottom: number };

  constructor(scene: Phaser.Scene, { viewW, viewH }: Layout) {
    this.track = { portX: 96, starboardX: viewW - 96, top: viewH - 470, bottom: viewH - 120 };
    const text = (x: number, y: number, label: string, size = 18) =>
      scene.add
        .text(x, y, label, {
          fontFamily: 'system-ui, sans-serif',
          fontSize: `${size}px`,
          fontStyle: 'bold',
          color: '#4fc3ff',
        })
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(6);
    const { portX, starboardX, top, bottom } = this.track;
    const mid = (top + bottom) / 2;
    for (const [x, name, stopX] of [
      [portX, 'PORT', portX + 74],
      [starboardX, 'STBD', starboardX - 74],
    ] as const) {
      text(x, top - 30, 'AHEAD', 16);
      text(stopX, mid, 'STOP', 16);
      text(x, bottom + 26, 'ASTERN', 16);
      text(x, bottom + 54, name, 15);
    }
    this.graphics = scene.add.graphics().setScrollFactor(0).setDepth(6);

    scene.input.addPointer(3);
    scene.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      const lever = this.leverAt(p);
      if (lever) {
        this.pointers.set(p.id, lever);
        this.moveLever(lever, p);
      }
    });
    scene.input.on('pointermove', (p: Phaser.Input.Pointer) => {
      const lever = this.pointers.get(p.id);
      if (lever) this.moveLever(lever, p);
    });
    const release = (p: Phaser.Input.Pointer) => this.pointers.delete(p.id);
    scene.input.on('pointerup', release);
    scene.input.on('pointerupoutside', release);
    this.draw();
  }

  /** True when a touch began on one of the levers. */
  owns(p: Phaser.Input.Pointer): boolean {
    return this.leverAt(p) !== null;
  }

  private leverAt(p: Phaser.Input.Pointer): Lever | null {
    const { portX, starboardX, top, bottom } = this.track;
    if (p.y < top - 50 || p.y > bottom + 50) return null;
    if (Math.abs(p.x - portX) < REACH) return 'port';
    if (Math.abs(p.x - starboardX) < REACH) return 'starboard';
    return null;
  }

  private moveLever(lever: Lever, p: Phaser.Input.Pointer): void {
    const { top, bottom } = this.track;
    const mid = (top + bottom) / 2;
    const raw = Math.round(((mid - p.y) / ((bottom - top) / 2)) * FULL);
    const v = clampLever(Math.abs(raw) < DETENT ? 0 : raw);
    if (lever === 'port') this.port = v;
    else this.starboard = v;
  }

  setLevers(port: number, starboard: number): void {
    this.port = clampLever(port);
    this.starboard = clampLever(starboard);
  }

  draw(): void {
    const { portX, starboardX, top, bottom } = this.track;
    const mid = (top + bottom) / 2;
    const half = (bottom - top) / 2;
    const g = this.graphics.clear();
    for (const [x, value] of [
      [portX, this.port],
      [starboardX, this.starboard],
    ] as const) {
      const knobY = mid - (value / FULL) * half;
      const color = value === 0 ? BLUE : GOLD;
      g.fillStyle(PANEL, 0.6).fillRoundedRect(x - 44, top - 14, 88, bottom - top + 28, 20);
      g.fillStyle(BLUE, 0.25).fillRect(x - 6, top, 12, bottom - top);
      g.fillStyle(BLUE, 0.6).fillRect(x - 30, mid - 2, 60, 4);
      g.fillStyle(color, 0.35).fillRect(x - 6, Math.min(knobY, mid), 12, Math.abs(knobY - mid));
      g.fillStyle(color, 1).fillRoundedRect(x - 36, knobY - 22, 72, 44, 12);
    }
  }
}

const clampLever = (v: number): number => Phaser.Math.Clamp(Math.round(v), -FULL, FULL);
