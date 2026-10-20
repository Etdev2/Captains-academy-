import * as Phaser from 'phaser';
import { FULL } from '../sim/sim';

// On-screen helm for one thumb per side (G8): a throttle lever on the right
// that stays where it is left, like a real one, and a steering slider on the
// left that springs back to midships when let go. Each control follows its
// own finger, so both can be held at once.

const GOLD = 0xf4d06f;
const BLUE = 0x4fc3ff;
const PANEL = 0x15324d;
// Within this much of stop, the lever snaps to stop.
const DETENT = 8;

interface Layout {
  readonly viewW: number;
  readonly viewH: number;
}

export class Helm {
  throttle = 0;
  rudder = 0;
  private leverPointer: number | null = null;
  private wheelPointer: number | null = null;
  private readonly lever: Phaser.GameObjects.Graphics;
  private readonly wheel: Phaser.GameObjects.Graphics;
  private readonly leverTrack: { x: number; top: number; bottom: number };
  private readonly wheelTrack: { y: number; left: number; right: number };

  constructor(scene: Phaser.Scene, { viewW, viewH }: Layout) {
    this.leverTrack = { x: viewW - 96, top: viewH - 470, bottom: viewH - 110 };
    this.wheelTrack = { y: viewH - 110, left: 70, right: 400 };
    const text = (x: number, y: number, label: string) =>
      scene.add
        .text(x, y, label, {
          fontFamily: 'system-ui, sans-serif',
          fontSize: '18px',
          fontStyle: 'bold',
          color: '#4fc3ff',
        })
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(6);
    const { x, top, bottom } = this.leverTrack;
    text(x, top - 26, 'AHEAD');
    text(x - 74, (top + bottom) / 2, 'STOP');
    text(x, bottom + 26, 'ASTERN');
    const w = this.wheelTrack;
    text((w.left + w.right) / 2, w.y - 56, 'STEER');
    this.lever = scene.add.graphics().setScrollFactor(0).setDepth(6);
    this.wheel = scene.add.graphics().setScrollFactor(0).setDepth(6);

    scene.input.addPointer(3);
    scene.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      if (this.onLever(p)) {
        this.leverPointer = p.id;
        this.moveLever(p);
      } else if (this.onWheel(p)) {
        this.wheelPointer = p.id;
        this.moveWheel(p);
      }
    });
    scene.input.on('pointermove', (p: Phaser.Input.Pointer) => {
      if (p.id === this.leverPointer) this.moveLever(p);
      if (p.id === this.wheelPointer) this.moveWheel(p);
    });
    const release = (p: Phaser.Input.Pointer) => {
      if (p.id === this.leverPointer) this.leverPointer = null;
      if (p.id === this.wheelPointer) {
        this.wheelPointer = null;
        this.rudder = 0;
      }
    };
    scene.input.on('pointerup', release);
    scene.input.on('pointerupoutside', release);
    this.draw();
  }

  /** True when a touch began on one of the helm controls. */
  owns(p: Phaser.Input.Pointer): boolean {
    return this.onLever(p) || this.onWheel(p);
  }

  get steeringByTouch(): boolean {
    return this.wheelPointer !== null;
  }

  private onLever(p: Phaser.Input.Pointer): boolean {
    const { x, top, bottom } = this.leverTrack;
    return Math.abs(p.x - x) < 90 && p.y > top - 50 && p.y < bottom + 50;
  }

  private onWheel(p: Phaser.Input.Pointer): boolean {
    const { y, left, right } = this.wheelTrack;
    return Math.abs(p.y - y) < 80 && p.x > left - 50 && p.x < right + 50;
  }

  private moveLever(p: Phaser.Input.Pointer): void {
    const { top, bottom } = this.leverTrack;
    const mid = (top + bottom) / 2;
    const v = Math.round(((mid - p.y) / ((bottom - top) / 2)) * FULL);
    this.setThrottle(Math.abs(v) < DETENT ? 0 : v);
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

  setThrottle(v: number): void {
    this.throttle = Phaser.Math.Clamp(Math.round(v), -FULL, FULL);
  }

  draw(): void {
    const { x, top, bottom } = this.leverTrack;
    const mid = (top + bottom) / 2;
    const half = (bottom - top) / 2;
    const knobY = mid - (this.throttle / FULL) * half;
    const g = this.lever.clear();
    g.fillStyle(PANEL, 0.6).fillRoundedRect(x - 40, top - 14, 80, bottom - top + 28, 20);
    g.fillStyle(BLUE, 0.25).fillRect(x - 6, top, 12, bottom - top);
    g.fillStyle(BLUE, 0.6).fillRect(x - 30, mid - 2, 60, 4);
    g.fillStyle(this.throttle === 0 ? BLUE : GOLD, 0.35).fillRect(
      x - 6,
      Math.min(knobY, mid),
      12,
      Math.abs(knobY - mid),
    );
    g.fillStyle(this.throttle === 0 ? BLUE : GOLD, 1).fillRoundedRect(
      x - 36,
      knobY - 22,
      72,
      44,
      12,
    );

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
