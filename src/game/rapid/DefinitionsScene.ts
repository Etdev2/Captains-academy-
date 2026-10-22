import * as Phaser from 'phaser';
import type { Category, DefinitionCard } from '../../sim/chapter1/definitions';
import {
  CATEGORIES,
  DEFINITIONS,
  LEVEL_ID,
  PAR_SECONDS,
  categoryLabel,
} from '../../sim/chapter1/definitions';
import type { RapidRun } from '../../sim/rapid';
import { HEARTS, MAX_MULTIPLIER, answer, currentCard, runStars, startRun } from '../../sim/rapid';
import type { Sound } from '../sound';
import { loadStars, recordAnswer, saveStars } from '../storage';
import { drawArt } from './vesselArt';

// Chapter 1, level 1: Definitions (issue #47). A portrait, one-thumb level
// (G8): one vessel at a time, tap what she is. A miss costs a hull heart and
// plays a five-second replay with the right answer and its rule (G11, G20).

export const VIEW_W = 720;
export const VIEW_H = 1280;
const FONT = 'system-ui, sans-serif';
const REPLAY_MS = 5000;
// A tap ends the replay early, but not before this, so it is not skipped by accident.
const REPLAY_MIN_MS = 800;
const RIGHT_PAUSE_MS = 380;

const COLOR = {
  bg: 0x06121f,
  panel: 0x0f2236,
  panelDark: 0x07111f,
  line: 0x2c4a68,
  gold: 0xf4d06f,
  blue: 0x4fc3ff,
  purple: 0xb48cff,
  replay: 0x1e1240,
};

const CARD = { x: 30, y: 170, w: 660, h: 520 };
const BUTTON = { top: 790, h: 112, gap: 16, w: 322, left: 30, right: 368 };

type Phase = 'question' | 'right' | 'replay' | 'done';

export interface QuizDebug {
  level: string;
  phase: Phase;
  /** The card on screen, or null when the run is over. */
  card: string | null;
  hearts: number;
  combo: number;
  score: number;
  misses: number;
  answered: number;
  remaining: number;
  outcome: string;
  stars: number;
}

declare global {
  interface Window {
    __captainsAcademyQuiz?: QuizDebug;
  }
}

interface ChoiceButton {
  readonly id: Category;
  readonly box: Phaser.GameObjects.Graphics;
  readonly x: number;
  readonly y: number;
}

export class DefinitionsScene extends Phaser.Scene {
  private run!: RapidRun;
  private phase: Phase = 'question';
  private elapsedMs = 0;
  private phaseUntil = 0;
  private phaseStarted = 0;
  private stars = 0;
  private chosen: Category | null = null;
  private art!: Phaser.GameObjects.Graphics;
  private hud!: Phaser.GameObjects.Graphics;
  private cue!: Phaser.GameObjects.Text;
  private ruleSet!: Phaser.GameObjects.Text;
  private progress!: Phaser.GameObjects.Text;
  private comboText!: Phaser.GameObjects.Text;
  private float!: Phaser.GameObjects.Text;
  private buttons: ChoiceButton[] = [];
  private overlay!: Phaser.GameObjects.Graphics;
  private overlayTexts: Phaser.GameObjects.Text[] = [];
  private endButtons: Phaser.GameObjects.Text[] = [];

  constructor(private readonly audio: Sound) {
    super('definitions');
  }

  create(): void {
    this.cameras.main.setBackgroundColor(COLOR.bg);
    this.run = startRun(
      DEFINITIONS.map((c) => c.id),
      Date.now() >>> 0,
    );
    this.phase = 'question';
    this.elapsedMs = 0;
    this.stars = 0;
    this.chosen = null;

    this.text(VIEW_W / 2, 40, '1 · Definitions', 34, '#eaf2fa')
      .setOrigin(0.5, 0)
      .setFontStyle('bold');
    this.text(VIEW_W / 2, 86, 'Chapter 1 · Rules of the Road', 20, '#9db2c8').setOrigin(0.5, 0);
    this.comboText = this.text(VIEW_W - 30, 44, '', 26, '#f4d06f')
      .setOrigin(1, 0)
      .setFontStyle('bold');
    this.ruleSet = this.text(30, 124, '', 20, '#8fd0ff');
    this.progress = this.text(VIEW_W - 30, 124, '', 20, '#9db2c8').setOrigin(1, 0);
    this.hud = this.add.graphics();

    const card = this.add.graphics();
    card.fillStyle(COLOR.panel, 1).fillRoundedRect(CARD.x, CARD.y, CARD.w, CARD.h, 24);
    card.lineStyle(2, COLOR.line, 1).strokeRoundedRect(CARD.x, CARD.y, CARD.w, CARD.h, 24);
    this.art = this.add.graphics();
    // Clip the drawing to the card, so long wakes and tows never spill over.
    const mask = this.make
      .graphics({}, false)
      .fillRect(CARD.x + 2, CARD.y + 2, CARD.w - 4, CARD.h - 90);
    this.art.setMask(mask.createGeometryMask());
    this.cue = this.text(VIEW_W / 2, CARD.y + CARD.h - 50, '', 28, '#eaf2fa')
      .setOrigin(0.5)
      .setAlign('center')
      .setWordWrapWidth(CARD.w - 60);
    this.text(VIEW_W / 2, 730, 'What is she?', 30, '#eaf2fa')
      .setOrigin(0.5, 0)
      .setFontStyle('bold');

    this.buttons = CATEGORIES.map((c, i) => this.makeButton(c, i));
    this.float = this.text(VIEW_W / 2, 700, '', 40, '#f4d06f')
      .setOrigin(0.5)
      .setFontStyle('bold')
      .setDepth(5);
    this.overlay = this.add.graphics().setDepth(10);

    this.input.on('pointerdown', () => {
      this.audio.unlock();
      if (this.phase === 'replay' && this.time.now - this.phaseStarted > REPLAY_MIN_MS) this.next();
    });
    this.input.keyboard?.on('keydown', (e: KeyboardEvent) => {
      this.audio.unlock();
      const n = Number(e.key);
      if (this.phase === 'question' && n >= 1 && n <= CATEGORIES.length) {
        const c = CATEGORIES[n - 1];
        if (c) this.choose(c.id);
      } else if (this.phase === 'replay' && (e.key === 'Enter' || e.key === ' ')) {
        if (this.time.now - this.phaseStarted > REPLAY_MIN_MS) this.next();
      } else if (this.phase === 'done' && (e.key === 'Enter' || e.key === ' ')) {
        this.scene.restart();
      }
    });
    this.showCard();
  }

  private text(x: number, y: number, s: string, size: number, color: string) {
    return this.add.text(x, y, s, { fontFamily: FONT, fontSize: `${size}px`, color });
  }

  private makeButton(c: (typeof CATEGORIES)[number], i: number): ChoiceButton {
    const x = i % 2 === 0 ? BUTTON.left : BUTTON.right;
    const y = BUTTON.top + Math.floor(i / 2) * (BUTTON.h + BUTTON.gap);
    const box = this.add.graphics();
    this.text(x + 22, y + BUTTON.h / 2, `${i + 1}`, 18, '#5f7a94').setOrigin(0.5);
    const label = this.text(
      x + BUTTON.w / 2 + 8,
      y + BUTTON.h / 2 - (c.note ? 12 : 0),
      c.label,
      24,
      '#eaf2fa',
    )
      .setOrigin(0.5)
      .setAlign('center')
      .setFontStyle('bold')
      .setWordWrapWidth(BUTTON.w - 60);
    if (c.note) {
      this.text(x + BUTTON.w / 2 + 8, y + BUTTON.h / 2 + 24, c.note, 17, '#8fd0ff').setOrigin(0.5);
      label.setFontSize(22);
    }
    this.add
      .zone(x, y, BUTTON.w, BUTTON.h)
      .setOrigin(0)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        this.audio.unlock();
        this.choose(c.id);
      });
    return { id: c.id, box, x, y };
  }

  private card(): DefinitionCard | undefined {
    const id = currentCard(this.run);
    return DEFINITIONS.find((c) => c.id === id);
  }

  private showCard(): void {
    const card = this.card();
    this.phase = 'question';
    this.chosen = null;
    this.overlay.clear();
    this.overlayTexts.forEach((t) => t.destroy());
    this.overlayTexts = [];
    this.float.setText('');
    this.art.clear();
    if (!card) return;
    drawArt(this.art, card.art, VIEW_W / 2, CARD.y + (CARD.h - 90) / 2 + 4);
    this.cue.setText(card.cue);
    this.ruleSet.setText(
      card.ruleSet === 'international' ? 'International rules' : 'Inland + International',
    );
    this.drawHud();
    this.drawButtons();
  }

  private choose(id: Category): void {
    if (this.phase !== 'question') return;
    const card = this.card();
    if (!card) return;
    const result = answer(this.run, id === card.answer);
    this.run = result.run;
    this.chosen = id;
    recordAnswer(card.id, result.correct);
    if (result.correct) {
      this.phase = 'right';
      this.phaseUntil = this.time.now + RIGHT_PAUSE_MS;
      this.audio.chime();
      this.float.setText(`+${result.points}`).setAlpha(1).setY(700);
      this.tweens.add({ targets: this.float, y: 640, alpha: 0, duration: RIGHT_PAUSE_MS + 200 });
      this.cameras.main.flash(120, 244, 208, 111);
    } else {
      this.phase = 'replay';
      this.phaseStarted = this.time.now;
      this.phaseUntil = this.time.now + REPLAY_MS;
      this.audio.bump(true);
      navigator.vibrate?.(120);
      this.cameras.main.shake(260, 0.008);
      this.showReplay(card);
    }
    this.drawHud();
    this.drawButtons(card.answer);
  }

  /** The five-second replay after a miss: the right answer, why, and the rule (G11). */
  private showReplay(card: DefinitionCard): void {
    // The drawing and cue give way to the answer, so nothing shows through.
    this.art.clear();
    this.cue.setText('');
    const g = this.overlay.clear();
    g.fillStyle(COLOR.replay, 1).fillRoundedRect(CARD.x, CARD.y, CARD.w, CARD.h, 24);
    g.lineStyle(3, COLOR.purple, 1).strokeRoundedRect(CARD.x, CARD.y, CARD.w, CARD.h, 24);
    const add = (y: number, s: string, size: number, color: string, bold = false) => {
      const t = this.text(VIEW_W / 2, y, s, size, color)
        .setOrigin(0.5, 0)
        .setAlign('center')
        .setWordWrapWidth(CARD.w - 80)
        .setDepth(11);
      if (bold) t.setFontStyle('bold');
      this.overlayTexts.push(t);
      return t;
    };
    add(CARD.y + 40, 'Not quite', 26, '#c9b3ff', true);
    add(CARD.y + 90, card.cue, 24, '#9db2c8');
    add(CARD.y + 150, `She is ${categoryLabel(card.answer).toLowerCase()}.`, 40, '#eaf2fa', true);
    add(CARD.y + 270, card.why, 26, '#eaf2fa');
    add(CARD.y + 400, card.rule, 24, '#f4d06f', true);
    add(CARD.y + 440, 'This one comes back in a few cards.', 20, '#c9b3ff');
  }

  private next(): void {
    if (this.run.outcome !== 'playing') {
      this.finish();
      return;
    }
    this.showCard();
  }

  private finish(): void {
    this.phase = 'done';
    const seconds = this.elapsedMs / 1000;
    this.stars = runStars(this.run, seconds, PAR_SECONDS);
    saveStars(LEVEL_ID, this.stars);
    this.art.clear();
    this.cue.setText('');
    const cleared = this.run.outcome === 'cleared';
    const g = this.overlay.clear();
    g.fillStyle(COLOR.panelDark, 0.97).fillRect(0, 0, VIEW_W, VIEW_H);
    const add = (y: number, s: string, size: number, color: string) => {
      const t = this.text(VIEW_W / 2, y, s, size, color)
        .setOrigin(0.5, 0)
        .setAlign('center')
        .setWordWrapWidth(VIEW_W - 100)
        .setDepth(11);
      this.overlayTexts.push(t);
      return t;
    };
    add(
      220,
      cleared ? 'Level cleared' : 'Out of hearts',
      52,
      cleared ? '#f4d06f' : '#c9b3ff',
    ).setFontStyle('bold');
    add(310, `${'★'.repeat(this.stars)}${'☆'.repeat(3 - this.stars)}`, 64, '#f4d06f');
    add(
      430,
      `${this.run.answered} answers · ${this.run.misses} missed · ${seconds.toFixed(1)} s\n` +
        `Score ${this.run.score} · best combo ×${this.run.bestCombo}`,
      26,
      '#eaf2fa',
    );
    const best = loadStars(LEVEL_ID);
    add(
      540,
      cleared
        ? this.stars === 3
          ? 'Every vessel named, no misses, inside par.'
          : this.run.misses > 0
            ? 'Name them all with no misses for three stars.'
            : `Under ${PAR_SECONDS} s for three stars.`
        : 'Each miss costs a heart. The missed vessels come back first next time you study them.',
      24,
      '#9db2c8',
    );
    if (best > 0) add(620, `Best on this device: ${'★'.repeat(best)}`, 22, '#8fd0ff');
    const button = (y: number, label: string, onTap: () => void) => {
      const b = this.text(VIEW_W / 2, y, label, 30, '#06121f')
        .setOrigin(0.5)
        .setFontStyle('bold')
        .setBackgroundColor('#f4d06f')
        .setPadding(40, 20, 40, 20)
        .setDepth(12)
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', onTap);
      this.endButtons.push(b);
      return b;
    };
    button(760, 'Play again', () => this.scene.restart());
    button(880, 'Home', () => window.location.assign('/')).setBackgroundColor('#4fc3ff');
    this.audio.chime();
  }

  private drawHud(): void {
    const g = this.hud.clear();
    for (let i = 0; i < HEARTS; i++) {
      const x = 34 + i * 44;
      const y = 50;
      const full = i < this.run.hearts;
      const pts = [
        new Phaser.Math.Vector2(x, y + 8),
        new Phaser.Math.Vector2(x + 34, y + 8),
        new Phaser.Math.Vector2(x + 28, y + 26),
        new Phaser.Math.Vector2(x + 6, y + 26),
      ];
      if (full) {
        g.fillStyle(COLOR.gold, 1)
          .fillPoints(pts, true)
          .fillRect(x + 11, y, 12, 8);
      } else {
        g.lineStyle(2, COLOR.line, 1).strokePoints(pts, true);
      }
    }
    const total = DEFINITIONS.length;
    const done = Math.min(total, total - new Set(this.run.queue).size);
    g.fillStyle(COLOR.line, 1).fillRoundedRect(30, 156, VIEW_W - 60, 6, 3);
    g.fillStyle(COLOR.blue, 1).fillRoundedRect(30, 156, ((VIEW_W - 60) * done) / total, 6, 3);
    this.progress.setText(`${done} of ${total}`);
    const mult = Math.min(this.run.combo, MAX_MULTIPLIER);
    this.comboText.setText(this.run.combo >= 2 ? `Combo ×${mult}` : '');
  }

  /** Buttons: plain while asking; after an answer, gold on the right one and purple on a wrong pick. */
  private drawButtons(right?: Category): void {
    for (const b of this.buttons) {
      const g = b.box.clear();
      const isRight = right !== undefined && b.id === right;
      const isWrongPick = right !== undefined && b.id === this.chosen && b.id !== right;
      g.fillStyle(isRight ? COLOR.gold : COLOR.panelDark, isRight ? 0.25 : 1).fillRoundedRect(
        b.x,
        b.y,
        BUTTON.w,
        BUTTON.h,
        16,
      );
      g.lineStyle(
        isRight || isWrongPick ? 4 : 2,
        isRight ? COLOR.gold : isWrongPick ? COLOR.purple : COLOR.line,
        1,
      );
      g.strokeRoundedRect(b.x, b.y, BUTTON.w, BUTTON.h, 16);
    }
  }

  override update(_time: number, delta: number): void {
    if (this.phase === 'question') this.elapsedMs += delta;
    if ((this.phase === 'right' || this.phase === 'replay') && this.time.now >= this.phaseUntil)
      this.next();
    if (this.phase === 'replay') {
      const left = Math.max(0, this.phaseUntil - this.time.now) / REPLAY_MS;
      const g = this.overlay;
      g.fillStyle(COLOR.replay, 1).fillRect(CARD.x + 40, CARD.y + CARD.h - 30, CARD.w - 80, 8);
      g.fillStyle(COLOR.purple, 1).fillRect(
        CARD.x + 40,
        CARD.y + CARD.h - 30,
        (CARD.w - 80) * left,
        8,
      );
    }
    const id = currentCard(this.run);
    window.__captainsAcademyQuiz = {
      level: LEVEL_ID,
      phase: this.phase,
      card: this.run.outcome === 'playing' && id !== undefined ? id : null,
      hearts: this.run.hearts,
      combo: this.run.combo,
      score: this.run.score,
      misses: this.run.misses,
      answered: this.run.answered,
      remaining: this.run.queue.length,
      outcome: this.run.outcome,
      stars: this.stars,
    };
  }
}
