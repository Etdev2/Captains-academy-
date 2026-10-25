import * as Phaser from 'phaser';
import {
  shownLights,
  type LightsArt,
  type PatternId,
  type PatternLight,
} from '../../sim/chapter1/lights';
import { lateralOffset } from '../../sim/navigation-lights';
import { ART, LIGHT_COLORS } from '../ui/palette';
import type { ArtView } from './spec';

// The Lights level's bridge view: a night horizon with one vessel's lights on
// it (docs/design/lights-spec.md). Which lights show comes from Rule 21 in
// src/sim/navigation-lights.ts; this file only places and paints them. The
// canvas has no text, so the card's cue and the answer buttons carry the
// meaning for a screen reader.

export const VIEW_W = 660;
export const VIEW_H = 480;
const CX = VIEW_W / 2;
const HORIZON_Y = 310;
/** Pixels per drawing unit across and up, large enough to read on a 390 px phone. */
const SPREAD = 30;
const RISE = 15;
const BASE_Y = HORIZON_Y - 40;

/** The lights that make each pattern what it is. The miss replay rings them. */
const DECIDING: Record<PatternId, readonly string[]> = {
  power: ['masthead'],
  'power-long': ['masthead-fwd', 'masthead-aft'],
  sailing: ['starboard', 'port'],
  'sailing-top': ['top-red', 'top-green'],
  'towing-short': ['masthead-1', 'masthead-2', 'towing'],
  'towing-long': ['masthead-1', 'masthead-2', 'masthead-3', 'towing'],
  trawling: ['trawl-green', 'trawl-white'],
  fishing: ['fish-red', 'fish-white'],
  'nuc-stopped': ['nuc-upper', 'nuc-lower'],
  'nuc-under-way': ['nuc-upper', 'nuc-lower'],
  'ram-stopped': ['ram-upper', 'ram-middle', 'ram-lower'],
  'ram-under-way': ['ram-upper', 'ram-middle', 'ram-lower'],
  'anchor-small': ['anchor'],
  'anchor-long': ['anchor-fwd', 'anchor-aft'],
};

/** Where a light sits on screen for a given aspect. */
export function placeLight(l: PatternLight, aspect: number): { x: number; y: number } {
  return {
    x: CX + lateralOffset(l.athwart * 4, l.fore * 4, aspect) * (SPREAD / 4),
    y: BASE_Y - l.height * RISE,
  };
}

class LightsScene extends Phaser.Scene {
  private lamps!: Phaser.GameObjects.Graphics;
  private ring!: Phaser.GameObjects.Graphics;
  private pending: LightsArt | null = null;
  private pulse: Phaser.Tweens.Tween | null = null;

  constructor() {
    super('lights');
  }

  create(): void {
    const sky = this.add.graphics();
    sky.fillStyle(ART.sky, 1).fillRect(0, 0, VIEW_W, HORIZON_Y);
    sky.fillStyle(ART.sea, 1).fillRect(0, HORIZON_Y, VIEW_W, VIEW_H - HORIZON_Y);
    sky.lineStyle(2, ART.horizon, 1).lineBetween(0, HORIZON_Y, VIEW_W, HORIZON_Y);
    // Fixed stars: the same sky every time, so a replay never changes.
    let seed = 20;
    for (let i = 0; i < 40; i++) {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      const x = seed % VIEW_W;
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      const y = seed % (HORIZON_Y - 60);
      sky.fillStyle(ART.star, 0.35).fillCircle(x, y, 1.5);
    }
    this.lamps = this.add.graphics();
    this.ring = this.add.graphics();
    if (this.pending) this.show(this.pending);
    this.game.events.emit('vessel-ready');
  }

  show(art: LightsArt): void {
    this.pending = art;
    if (!this.lamps) return;
    this.clearHighlight();
    const g = this.lamps;
    g.clear();
    for (const l of shownLights(art)) {
      const { x, y } = placeLight(l, art.aspect);
      const color = LIGHT_COLORS[l.color];
      // The reflection on the water, then a soft glow, then the lamp itself.
      g.fillStyle(color, 0.1).fillRect(x - 2, HORIZON_Y + 2, 4, 90);
      g.fillStyle(color, 0.08).fillCircle(x, y, 26);
      g.fillStyle(color, 0.22).fillCircle(x, y, 16);
      g.fillStyle(color, 1).fillCircle(x, y, 8);
      g.fillStyle(LIGHT_COLORS.white, 0.7).fillCircle(x, y, 3);
    }
  }

  /** Rings the lights that decide the card. A steady ring when motion is reduced. */
  highlight(art: LightsArt, reducedMotion: boolean): void {
    if (!this.ring) return;
    this.clearHighlight();
    const shown = shownLights(art);
    const deciding = shown.filter((l) => DECIDING[art.pattern].includes(l.id));
    const points = (deciding.length > 0 ? deciding : shown).map((l) => placeLight(l, art.aspect));
    if (points.length === 0) return;
    const xs = points.map((p) => p.x);
    const ys = points.map((p) => p.y);
    const cx = (Math.min(...xs) + Math.max(...xs)) / 2;
    const cy = (Math.min(...ys) + Math.max(...ys)) / 2;
    const r = Math.max(...points.map((p) => Math.hypot(p.x - cx, p.y - cy))) + 30;
    this.ring.lineStyle(6, ART.highlight, 1).strokeCircle(cx, cy, r);
    if (reducedMotion) return;
    this.ring.setAlpha(1);
    this.pulse = this.tweens.add({
      targets: this.ring,
      alpha: { from: 1, to: 0.15 },
      duration: 300,
      yoyo: true,
      repeat: 1,
    });
  }

  clearHighlight(): void {
    this.pulse?.stop();
    this.pulse = null;
    this.ring?.clear().setAlpha(1);
  }
}

export class LightsView implements ArtView<LightsArt> {
  private readonly scene = new LightsScene();
  readonly game: Phaser.Game;

  constructor(parent: HTMLElement) {
    this.game = new Phaser.Game({
      type: Phaser.AUTO,
      parent,
      transparent: true,
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: VIEW_W,
        height: VIEW_H,
      },
      scene: this.scene,
      banner: false,
      audio: { noAudio: true },
      input: false,
    });
  }

  show(art: LightsArt): void {
    this.scene.show(art);
  }

  highlight(art: LightsArt, reducedMotion: boolean): void {
    this.scene.highlight(art, reducedMotion);
  }

  clearHighlight(): void {
    this.scene.clearHighlight();
  }
}
