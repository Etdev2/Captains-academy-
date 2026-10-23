import * as Phaser from 'phaser';
import type { Art } from '../../sim/chapter1/definitions';
import { ART } from '../ui/palette';
import { detailOf, drawArt } from './vesselArt';

// The one part of the Definitions level that Phaser draws: the vessel on the
// card (docs/design/definitions-spec.md, decision 1). Everything else on the
// page is HTML. The canvas has no text, so it carries no meaning a screen
// reader would miss: the card's cue says what the drawing shows.

export const ART_W = 660;
export const ART_H = 480;
const CX = ART_W / 2;
const CY = ART_H / 2;

class VesselScene extends Phaser.Scene {
  private art!: Phaser.GameObjects.Graphics;
  private ring!: Phaser.GameObjects.Graphics;
  private pending: Art | null = null;
  private pulse: Phaser.Tweens.Tween | null = null;

  constructor() {
    super('vessel');
  }

  create(): void {
    this.art = this.add.graphics();
    this.ring = this.add.graphics();
    if (this.pending) this.show(this.pending);
    this.game.events.emit('vessel-ready');
  }

  show(art: Art): void {
    this.pending = art;
    if (!this.art) return;
    this.clearHighlight();
    this.art.clear();
    drawArt(this.art, art, CX, CY);
  }

  /** Outlines the detail that decides the card. A steady outline when motion is reduced. */
  highlight(art: Art, reducedMotion: boolean): void {
    if (!this.ring) return;
    this.clearHighlight();
    const d = detailOf(art, CX, CY);
    this.ring.lineStyle(6, ART.highlight, 1).strokeCircle(d.x, d.y, d.r);
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

export class VesselView {
  private readonly scene = new VesselScene();
  readonly game: Phaser.Game;

  constructor(parent: HTMLElement) {
    this.game = new Phaser.Game({
      type: Phaser.AUTO,
      parent,
      transparent: true,
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: ART_W,
        height: ART_H,
      },
      scene: this.scene,
      banner: false,
      audio: { noAudio: true },
      input: false,
    });
  }

  show(art: Art): void {
    this.scene.show(art);
  }

  highlight(art: Art, reducedMotion: boolean): void {
    this.scene.highlight(art, reducedMotion);
  }

  clearHighlight(): void {
    this.scene.clearHighlight();
  }
}
