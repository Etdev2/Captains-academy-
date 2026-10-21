import * as Phaser from 'phaser';
import { FULL } from '../sim/sim';

// On-screen helm for one thumb per side (G8): two engine levers on the right,
// port and starboard, that stay where they are left, like real ones, and a
// steering slider on the left that springs back to midships when let go.
// Grab a lever to move it alone, or the grip between them to move both
// together. Each control follows its own finger, so several can be held at
// once.

const GOLD = 0xf4d06f;
const BLUE = 0x4fc3ff;
const PANEL = 0x15324d;
// Within this much of stop, a lever snaps to stop.
const DETENT = 8;
// A touch this close to the middle of the pair moves both levers.
const BOTH_GRIP = 18;

type Lever = 'port' | 'starboard' | 'both';

interface Layout {
  readonly viewW: number;
  readonly viewH: number;
}

export class Helm {
  port = 0;
  starboard = 0;
  rudder = 0;
  private readonly leverPointers = new Map<number, Lever>();
  private wheelPointer: number | null = null;
  private readonly levers: Phaser.GameObjects.Graphics;
  private readonly wheel: Phaser.GameObjects.Graphics;
  private readonly leverTrack: { portX: number; starboardX: number; top: number; bottom: number };
  private readonly wheelTrack: { y: number; left: number; right: number };

  constructor(scene: Phaser.Scene, { viewW, viewH }: Layout) {
    this.leverTrack = {
      portX: viewW - 156,
      starboardX: viewW - 76,
      top: viewH - 470,
      bottom: viewH - 120,
    };
    this.wheelTrack = { y: viewH - 110, left: 70, right: 400 };
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
    const { portX, starboardX, top, bottom } = this.leverTrack;
    const mid = (portX + starboardX) / 2;
    text(mid, top - 30, 'AHEAD');
    text(portX - 74, (top + bottom) / 2, 'STOP');
    text(mid, bottom + 26, 'ASTERN');
    text(portX, bottom + 54, 'PORT', 15);
    text(starboardX, bottom + 54, 'STBD', 15);
    const w = this.wheelTrack;
    text((w.left + w.right) / 2, w.y - 56, 'STEER');
    this.levers = scene.add.graphics().setScrollFactor(0).setDepth(6);
    this.wheel = scene.add.graphics().setScrollFactor(0).setDepth(6);

    scene.input.addPointer(3);
    scene.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      const lever = this.leverAt(p);
      if (lever) {
        this.leverPointers.set(p.id, lever);
        this.moveLever(lever, p);
      } else if (this.onWheel(p)) {
        this.wheelPointer = p.id;
        this.moveWheel(p);
      }
    });
    scene.input.on('pointermove', (p: Phaser.Input.Pointer) => {
      const lever = this.leverPointers.get(p.id);
      if (lever) this.moveLever(lever, p);
      if (p.id === this.wheelPointer) this.moveWheel(p);
    });
    const release = (p: Phaser.Input.Pointer) => {
      this.leverPointers.delete(p.id);
      if (p.id === this.wheelPointer) {
        this.wheelPointer = null;
        this.rudder = 0;
      }
    };
    scene.input.on('pointerup', release);
    scene.input.on('pointerupoutside', release);
    this.draw();
  }

  /** Both engines together: the lever pair's average, for the engine sound. */
  get throttle(): number {
    return Math.trunc((this.port + this.starboard) / 2);
  }

  /** True when a touch began on one of the helm controls. */
  owns(p: Phaser.Input.Pointer): boolean {
    return this.leverAt(p) !== null || this.onWheel(p);
  }

  get steeringByTouch(): boolean {
    return this.wheelPointer !== null;
  }

  private leverAt(p: Phaser.Input.Pointer): Lever | null {
    const { portX, starboardX, top, bottom } = this.leverTrack;
    if (p.y < top - 50 || p.y > bottom + 50) return null;
    const mid = (portX + starboardX) / 2;
    if (Math.abs(p.x - mid) < BOTH_GRIP) return 'both';
    if (p.x > portX - 60 && p.x < mid) return 'port';
    if (p.x >= mid && p.x < starboardX + 60) return 'starboard';
    return null;
  }

  private onWheel(p: Phaser.Input.Pointer): boolean {
    const { y, left, right } = this.wheelTrack;
    return Math.abs(p.y - y) < 80 && p.x > left - 50 && p.x < right + 50;
  }

  private moveLever(lever: Lever, p: Phaser.Input.Pointer): void {
    const { top, bottom } = this.leverTrack;
    const mid = (top + bottom) / 2;
    const raw = Math.round(((mid - p.y) / ((bottom - top) / 2)) * FULL);
    const v = Math.abs(raw) < DETENT ? 0 : raw;
    if (lever !== 'starboard') this.port = clampLever(v);
    if (lever !== 'port') this.starboard = clampLever(v);
  }

  private moveWheel(p: Phaser.Input.Pointer): void {
    const { left, right } = this.wheelTrack;
    const mid = (left + right) / 2;
    this.rudder = Phaser.Math.Clamp(
      Math.round(((p.x - mid) / ((right - left) / 2)) * FULL),
      -FULL,
      FULL,
    );
  }

  setLevers(port: number, starboard: number): void {
    this.port = clampLever(port);
    this.starboard = clampLever(starboard);
  }

  draw(): void {
    const { portX, starboardX, top, bottom } = this.leverTrack;
    const mid = (top + bottom) / 2;
    const half = (bottom - top) / 2;
    const g = this.levers.clear();
    g.fillStyle(PANEL, 0.6).fillRoundedRect(
      portX - 44,
      top - 14,
      starboardX - portX + 88,
      bottom - top + 28,
      20,
    );
    g.fillStyle(BLUE, 0.6).fillRect(portX - 34, mid - 2, starboardX - portX + 68, 4);
    for (const [x, value] of [
      [portX, this.port],
      [starboardX, this.starboard],
    ] as const) {
      const knobY = mid - (value / FULL) * half;
      const color = value === 0 ? BLUE : GOLD;
      g.fillStyle(BLUE, 0.25).fillRect(x - 6, top, 12, bottom - top);
      g.fillStyle(color, 0.35).fillRect(x - 6, Math.min(knobY, mid), 12, Math.abs(knobY - mid));
      g.fillStyle(color, 1).fillRoundedRect(x - 30, knobY - 20, 60, 40, 12);
    }
    // The grip between the levers, for moving both at once.
    const gripX = (portX + starboardX) / 2;
    g.fillStyle(BLUE, 0.35).fillRoundedRect(gripX - 4, top, 8, bottom - top, 4);

    const w = this.wheelTrack;
    const wmid = (w.left + w.right) / 2;
    const knobX = wmid + (this.rudder / FULL) * ((w.right - w.left) / 2);
    const h = this.wheel.clear();
    h.fillStyle(PANEL, 0.6).fillRoundedRect(w.left - 30, w.y - 36, w.right - w.left + 60, 72, 20);
    h.fillStyle(BLUE, 0.25).fillRect(w.left, w.y - 5, w.right - w.left, 10);
    h.fillStyle(BLUE, 0.6).fillRect(wmid - 2, w.y - 22, 4, 44);
    h.fillStyle(this.rudder === 0 ? BLUE : GOLD, 1).fillCircle(knobX, w.y, 28);
  }
}

const clampLever = (v: number): number => Phaser.Math.Clamp(Math.round(v), -FULL, FULL);
