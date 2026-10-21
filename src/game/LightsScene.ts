import * as Phaser from 'phaser';
import type { LightsInput, LightsLevel, LightsState } from '../sim/lights';
import {
  REPLAY_FRAMES,
  answerLabel,
  initialState,
  situationAt,
  starsFor,
  step,
} from '../sim/lights';
import type { LightsSituation } from '../sim/lights-mission';
import { citeRule, ruleSetName } from '../sim/lights-mission';
import { FRAMES_PER_SECOND } from '../sim/sim';
import { PORTRAIT, setOrientation } from './orientation';
import type { Sound } from './sound';
import { loadBestFrames, loadStars, saveBestFrames, saveStars } from './storage';

// Chapter 1, level 2: lights rapid-fire. A bridge view of navigation lights on a
// night horizon (G2, G15). The player taps what the lights show, in portrait with
// one thumb (G8), and gets instant feedback. A miss costs a hull heart and plays a
// 5 second replay with the right answer and its rule citation (G11, G20). The
// scene only draws and steps the pure state machine in src/sim/lights.ts at a
// fixed 60 Hz. It never writes to a sea-time log: this is practice, never sea
// time (ADR 0001, G17).

export const LIGHTS_W = PORTRAIT.w;
export const LIGHTS_H = PORTRAIT.h;
const FRAME_MS = 1000 / FRAMES_PER_SECOND;
const MAX_STEPS_PER_UPDATE = 5;
const FONT = 'system-ui, sans-serif';

const SKY_TOP = 190;
const HORIZON = 560;
const LIGHT_BASE = 545;
const CENTER_X = LIGHTS_W / 2;
const X_UNIT = 2.6;
const Y_UNIT = 3.2;
const OPTION_TOP = 700;
const OPTION_H = 110;
const OPTION_STEP = 126;
const PANEL_TOP = 684;
const PANEL_H = 516;
const BAR_W = 600;
const BAR_Y = PANEL_TOP + PANEL_H - 80;
// Each light is ringed in turn during the replay, this many frames apiece.
const RING_FRAMES = 30;

// Red and green appear only as the lights themselves (G15). Everything else is
// gold, electric blue, purple, white and the night-blue panels.
const COLOR = {
  gold: 0xf4d06f,
  blue: 0x4fc3ff,
  purple: 0xb36bff,
  panel: 0x15324d,
  night: 0x06121f,
  deepSky: 0x050a14,
  horizonSky: 0x10304f,
  water: 0x081a2c,
  waterLine: 0x24507a,
  white: 0xffffff,
  lost: 0x3a4a5a,
};
const LIGHT_COLOR = { white: 0xffffff, red: 0xff3030, green: 0x30ff60, yellow: 0xffd23f } as const;
const ROLE_NAME = {
  masthead: 'masthead light',
  sidelight: 'sidelight',
  sternlight: 'sternlight',
  'all-round': 'all-round light',
  towing: 'towing light',
} as const;

export interface LightsDebugView {
  frame: number;
  phase: string;
  outcome: string;
  hearts: number;
  misses: number;
  correct: number;
  total: number;
  /** Button positions, 0 to 3, of the right answer and of a wrong one, for tests. */
  rightOption: number;
  wrongOption: number;
  replayFramesLeft: number;
}

declare global {
  interface Window {
    __captainsLights?: LightsDebugView;
  }
}

type KeyName = 'one' | 'two' | 'three' | 'four' | 'enter' | 'space' | 'm';
type Keys = Record<KeyName, Phaser.Input.Keyboard.Key>;
interface Showable {
  setVisible(visible: boolean): unknown;
}

function lerpColor(a: number, b: number, t: number): number {
  const channel = (shift: number) =>
    Math.round(((a >> shift) & 0xff) * (1 - t) + ((b >> shift) & 0xff) * t);
  return (channel(16) << 16) | (channel(8) << 8) | channel(0);
}

export class LightsScene extends Phaser.Scene {
  private attempt = 0;
  private locked = false;
  private state!: LightsState;
  private accumulator = 0;
  private pending: LightsInput = null;
  private keys!: Keys;
  private ruleChip!: Phaser.GameObjects.Text;
  private ruleNote!: Phaser.GameObjects.Text;
  private prompt!: Phaser.GameObjects.Text;
  private toast!: Phaser.GameObjects.Text;
  private hud!: Phaser.GameObjects.Text;
  private muteButton!: Phaser.GameObjects.Text;
  private hearts!: Phaser.GameObjects.Graphics;
  private lightsG!: Phaser.GameObjects.Graphics;
  private waterG!: Phaser.GameObjects.Graphics;
  private optionBoxes: Phaser.GameObjects.Rectangle[] = [];
  private optionTexts: Phaser.GameObjects.Text[] = [];
  private replayObjects: Showable[] = [];
  private replayRight!: Phaser.GameObjects.Text;
  private replayCite!: Phaser.GameObjects.Text;
  private replayExplain!: Phaser.GameObjects.Text;
  private replayLights!: Phaser.GameObjects.Text;
  private replayBar!: Phaser.GameObjects.Graphics;
  private endObjects: Showable[] = [];
  private endTitle!: Phaser.GameObjects.Text;
  private endStars!: Phaser.GameObjects.Text;
  private endBody!: Phaser.GameObjects.Text;
  private shownDealt = -1;
  private shownPhase = '';
  private shownOutcome = 'playing';
  private bestFrames: number | null = null;

  constructor(
    private readonly level: LightsLevel,
    private readonly audio: Sound,
  ) {
    super('lights');
  }

  init(data: { attempt?: number }): void {
    this.attempt = data.attempt ?? 0;
    this.accumulator = 0;
    this.pending = null;
    this.shownDealt = -1;
    this.shownPhase = '';
    this.shownOutcome = 'playing';
    this.optionBoxes = [];
    this.optionTexts = [];
  }

  create(): void {
    setOrientation(this.game, 'portrait');
    // One star on the level before it opens this one (G12).
    this.locked = loadStars(this.level.mission.unlockedBy) === 0;
    if (this.locked) {
      this.scene.start('harbor', { levelIndex: 0 });
      return;
    }
    this.state = initialState(this.level, this.attempt);
    this.bestFrames = loadBestFrames(this.level.mission.id);
    this.cameras.main.setBackgroundColor(COLOR.night);
    this.drawNight();
    this.waterG = this.add.graphics();
    this.lightsG = this.add.graphics().setBlendMode(Phaser.BlendModes.ADD);
    this.setUpKeys();
    this.setUpText();
    this.setUpOptions();
    this.setUpReplayPanel();
    this.setUpEndPanel();
    this.setUpButtons();
    this.input.on('pointerdown', () => this.audio.unlock());
    this.input.keyboard?.on('keydown', () => this.audio.unlock());
    this.layout();
    this.publish();
  }

  private text(x: number, y: number, text: string, size: number, color: string) {
    return this.add
      .text(x, y, text, { fontFamily: FONT, fontSize: `${size}px`, color })
      .setDepth(10);
  }

  /** Sky bands from deep blue overhead to a faint glow at the horizon, plus stars and sea. */
  private drawNight(): void {
    const g = this.add.graphics();
    const bands = 16;
    const bandH = (HORIZON - SKY_TOP) / bands;
    for (let i = 0; i < bands; i++) {
      g.fillStyle(lerpColor(COLOR.deepSky, COLOR.horizonSky, i / (bands - 1)), 1);
      g.fillRect(0, SKY_TOP + i * bandH, LIGHTS_W, bandH + 1);
    }
    for (let i = 0; i < 48; i++) {
      const x = 10 + ((i * 149 + 37) % 700);
      const y = SKY_TOP + 8 + ((i * 83 + 11) % 300);
      g.fillStyle(COLOR.white, 0.25 + ((i * 7) % 5) * 0.12).fillRect(x, y, 2, 2);
    }
    g.fillStyle(COLOR.water, 1).fillRect(0, HORIZON, LIGHTS_W, 90);
    g.fillStyle(COLOR.waterLine, 1).fillRect(0, HORIZON, LIGHTS_W, 2);
  }

  private setUpKeys(): void {
    const kb = this.input.keyboard;
    if (!kb) throw new Error('keyboard input is unavailable');
    const K = Phaser.Input.Keyboard.KeyCodes;
    this.keys = {
      one: kb.addKey(K.ONE),
      two: kb.addKey(K.TWO),
      three: kb.addKey(K.THREE),
      four: kb.addKey(K.FOUR),
      enter: kb.addKey(K.ENTER),
      space: kb.addKey(K.SPACE),
      m: kb.addKey(K.M),
    };
  }

  private setUpText(): void {
    this.text(CENTER_X, 14, this.level.mission.title, 26, '#f4d06f')
      .setOrigin(0.5, 0)
      .setFontStyle('bold');
    this.ruleChip = this.text(CENTER_X, 96, '', 30, '#06121f')
      .setOrigin(0.5, 0)
      .setFontStyle('bold')
      .setPadding(18, 6, 18, 6);
    this.ruleNote = this.text(CENTER_X, 146, '', 20, '#c9d3db')
      .setOrigin(0.5, 0)
      .setAlign('center')
      .setWordWrapWidth(660);
    this.prompt = this.text(CENTER_X, 648, 'What are you looking at?', 30, '#f4d06f')
      .setOrigin(0.5, 0)
      .setFontStyle('bold');
    this.toast = this.text(CENTER_X, 584, '', 26, '#f4d06f')
      .setOrigin(0.5, 0)
      .setAlign('center')
      .setFontStyle('bold')
      .setStroke('#06121f', 6)
      .setWordWrapWidth(680)
      .setAlpha(0);
    this.hud = this.text(CENTER_X, LIGHTS_H - 40, '', 24, '#e8f1f8').setOrigin(0.5, 0);
    this.hearts = this.add.graphics().setDepth(10);
  }

  private setUpOptions(): void {
    for (let i = 0; i < 4; i++) {
      const y = OPTION_TOP + i * OPTION_STEP;
      const box = this.add
        .rectangle(40, y, LIGHTS_W - 80, OPTION_H, COLOR.panel)
        .setOrigin(0, 0)
        .setStrokeStyle(3, COLOR.blue)
        .setDepth(9)
        .setInteractive({ useHandCursor: true });
      box.on('pointerdown', () => {
        this.audio.unlock();
        this.pick(i);
      });
      const label = this.text(CENTER_X, y + OPTION_H / 2, '', 30, '#e8f1f8')
        .setOrigin(0.5)
        .setAlign('center')
        .setFontStyle('bold')
        .setWordWrapWidth(LIGHTS_W - 150);
      this.optionBoxes.push(box);
      this.optionTexts.push(label);
    }
  }

  private panel(strokeColor: number): Phaser.GameObjects.Rectangle {
    const panel = this.add
      .rectangle(40, PANEL_TOP, LIGHTS_W - 80, PANEL_H, COLOR.panel)
      .setOrigin(0, 0)
      .setStrokeStyle(4, strokeColor)
      .setDepth(11)
      .setInteractive({ useHandCursor: true });
    panel.on('pointerdown', () => {
      this.audio.unlock();
      this.confirm();
    });
    return panel;
  }

  /** A line of text on a panel, centered, wrapped to the panel's width. */
  private panelText(y: number, size: number, color: string, bold = false) {
    const t = this.text(CENTER_X, PANEL_TOP + y, '', size, color)
      .setOrigin(0.5, 0)
      .setAlign('center')
      .setWordWrapWidth(600)
      .setDepth(12);
    return bold ? t.setFontStyle('bold') : t;
  }

  /** The 5 second replay after a miss: the right answer, its citation, the lights in words. */
  private setUpReplayPanel(): void {
    const headline = this.panelText(22, 28, '#b36bff', true);
    headline.setText('Not quite. The right answer:');
    this.replayRight = this.panelText(76, 34, '#f4d06f', true);
    this.replayCite = this.panelText(190, 28, '#4fc3ff', true);
    this.replayExplain = this.panelText(250, 26, '#e8f1f8');
    this.replayLights = this.panelText(400, 22, '#c9d3db');
    this.replayBar = this.add.graphics().setDepth(12);
    const hint = this.panelText(PANEL_H - 40, 22, '#4fc3ff').setText('Tap to go on');
    this.replayObjects = [
      this.panel(COLOR.purple),
      headline,
      this.replayRight,
      this.replayCite,
      this.replayExplain,
      this.replayLights,
      this.replayBar,
      hint,
    ];
  }

  private setUpEndPanel(): void {
    this.endTitle = this.panelText(30, 44, '#f4d06f', true);
    this.endStars = this.panelText(100, 64, '#f4d06f');
    this.endBody = this.panelText(200, 26, '#e8f1f8');
    const foot = this.panelText(PANEL_H - 130, 22, '#c9d3db').setText(
      'Practice only. Game time never counts as sea time.',
    );
    const hint = this.panelText(PANEL_H - 60, 26, '#4fc3ff', true).setText(
      'Tap or press Enter to go again',
    );
    this.endObjects = [
      this.panel(COLOR.gold),
      this.endTitle,
      this.endStars,
      this.endBody,
      foot,
      hint,
    ];
  }

  private setUpButtons(): void {
    const button = (x: number, y: number, text: string, onTap: () => void) => {
      const b = this.text(x, y, text, 20, '#4fc3ff')
        .setFontStyle('bold')
        .setBackgroundColor('#15324dcc')
        .setPadding(14, 10, 14, 10)
        .setDepth(13)
        .setInteractive({ useHandCursor: true });
      b.on('pointerdown', () => {
        this.audio.unlock();
        onTap();
      });
      return b;
    };
    this.muteButton = button(16, 56, '', () => this.toggleMute());
    this.updateMuteLabel();
    button(190, 56, 'HARBOR', () => this.scene.start('harbor', { levelIndex: 0 }));
  }

  private toggleMute(): void {
    this.audio.toggleMute();
    this.updateMuteLabel();
  }

  private updateMuteLabel(): void {
    this.muteButton.setText(this.audio.muted ? 'SOUND OFF' : 'SOUND ON');
  }

  /** Taps and number keys choose a button, only while a question is up. */
  private pick(n: number): void {
    const s = this.state;
    if (s.outcome !== 'playing' || s.phase !== 'asking') return;
    const pick = s.options[n];
    if (pick !== undefined) this.pending = { kind: 'answer', pick };
  }

  /** Enter, Space or a tap on a panel: skip the replay, or go again at the end. */
  private confirm(): void {
    if (this.state.outcome !== 'playing') {
      this.scene.restart({ attempt: this.attempt + 1 });
    } else if (this.state.phase === 'replay') {
      this.pending = { kind: 'skip' };
    }
  }

  override update(time: number, delta: number): void {
    if (this.locked) return;
    const k = this.keys;
    const J = Phaser.Input.Keyboard.JustDown;
    if (J(k.m)) this.toggleMute();
    if (J(k.one)) this.pick(0);
    if (J(k.two)) this.pick(1);
    if (J(k.three)) this.pick(2);
    if (J(k.four)) this.pick(3);
    if (J(k.enter) || J(k.space)) this.confirm();

    this.accumulator += Math.min(delta, 100);
    let steps = 0;
    while (this.accumulator >= FRAME_MS && steps < MAX_STEPS_PER_UPDATE) {
      const before = this.state;
      this.state = step(this.level, before, this.pending);
      this.pending = null;
      this.accumulator -= FRAME_MS;
      steps++;
      const head = before.queue[0];
      if (head !== undefined && this.state.correct > before.correct) this.onCorrect(head);
      if (this.state.misses > before.misses) this.onMiss();
    }
    if (steps === MAX_STEPS_PER_UPDATE) this.accumulator = 0;

    const s = this.state;
    const changed =
      s.dealt !== this.shownDealt ||
      s.phase !== this.shownPhase ||
      s.outcome !== this.shownOutcome;
    if (changed) this.layout();
    this.updateHud();
    this.drawLive(time);
    this.publish();
  }

  /** Instant feedback for a right answer: gold flash, chime, and the citation (G20). */
  private onCorrect(index: number): void {
    const s = situationAt(this.level, index);
    this.audio.chime();
    this.cameras.main.flash(140, 244, 208, 111);
    this.tweens.killTweensOf(this.toast);
    this.toast
      .setColor(this.state.streak >= 5 ? '#4fc3ff' : '#f4d06f')
      .setText(`${answerLabel(this.level, s.answer)}\n${citeRule(s.ruleSet, s.rule)}`)
      .setAlpha(1);
    this.tweens.add({ targets: this.toast, alpha: 0, delay: 900, duration: 500 });
  }

  /** A miss: purple flash and a camera shake, never red (G15). */
  private onMiss(): void {
    this.audio.bump(true);
    this.cameras.main.shake(400, 0.01);
    this.cameras.main.flash(220, 179, 107, 255);
    this.tweens.killTweensOf(this.toast);
    this.toast.setAlpha(0);
  }

  private focusSituation(): LightsSituation | null {
    const s = this.state;
    const index = s.phase === 'replay' ? s.missed : s.queue[0];
    return index === null || index === undefined ? null : situationAt(this.level, index);
  }

  /** Shows the right widgets for the phase: buttons, replay panel or result. */
  private layout(): void {
    const s = this.state;
    const finished = s.outcome !== 'playing';
    const replaying = !finished && s.phase === 'replay';
    const asking = !finished && !replaying;
    const justFinished = finished && this.shownOutcome === 'playing';
    this.shownDealt = s.dealt;
    this.shownPhase = s.phase;
    this.shownOutcome = s.outcome;

    this.optionBoxes.forEach((box, i) => {
      box.setVisible(asking);
      if (asking) box.setInteractive();
      else box.disableInteractive();
      this.optionTexts[i]?.setVisible(asking).setText(this.optionLabel(i));
    });
    this.prompt.setVisible(asking);
    for (const o of this.replayObjects) o.setVisible(replaying);
    for (const o of this.endObjects) o.setVisible(finished);

    const focus = this.focusSituation();
    if (focus) {
      const law = focus.ruleSet === 'inland' ? '33 CFR 83' : 'COLREGS';
      this.ruleChip
        .setText(`${ruleSetName(focus.ruleSet)} · ${law}`)
        .setBackgroundColor(focus.ruleSet === 'inland' ? '#4fc3ff' : '#f4d06f');
      this.ruleNote
        .setText(
          focus.shared
            ? 'This rule reads the same in both rule sets.'
            : `DIFFERENCE: ${focus.differenceNote ?? ''}`,
        )
        .setColor(focus.shared ? '#c9d3db' : '#f4d06f');
    }
    if (replaying && focus) this.fillReplay(focus);
    if (justFinished) this.showEnd();
  }

  private optionLabel(i: number): string {
    const id = this.state.options[i];
    return id === undefined ? '' : `${i + 1}   ${answerLabel(this.level, id)}`;
  }

  private fillReplay(s: LightsSituation): void {
    this.replayRight.setText(answerLabel(this.level, s.answer));
    this.replayCite.setText(citeRule(s.ruleSet, s.rule));
    this.replayExplain.setText(s.explain);
    const parts = s.lights.map((l) => `${l.color} ${ROLE_NAME[l.role]}`);
    this.replayLights.setText(`You see: ${parts.join(', ')}.`);
  }

  private showEnd(): void {
    const s = this.state;
    const seconds = s.askingFrames / FRAMES_PER_SECOND;
    if (s.outcome === 'cleared') {
      const stars = starsFor(this.level, s);
      saveStars(this.level.mission.id, stars);
      const record = this.bestFrames === null || s.askingFrames < this.bestFrames;
      if (record) {
        this.bestFrames = s.askingFrames;
        saveBestFrames(this.level.mission.id, s.askingFrames);
      }
      const tip =
        stars === 3
          ? 'Clean and fast.'
          : s.misses > 0
            ? 'No misses for three stars.'
            : `Under ${this.level.mission.parSeconds} s for three stars.`;
      this.endTitle.setColor('#f4d06f').setText('Level cleared');
      this.endStars.setText('★'.repeat(stars) + '☆'.repeat(3 - stars));
      this.endBody.setText(
        `${seconds.toFixed(1)} s${record ? ', a new best' : ''}. ${tip}\n` +
          `Misses ${s.misses}   Best streak ${s.bestStreak}   ${s.points} points`,
      );
      this.audio.chime();
    } else {
      this.endTitle.setColor('#b36bff').setText('Out of hull hearts');
      this.endStars.setText('☆☆☆');
      this.endBody.setText(
        `You cleared ${s.correct} of ${this.level.mission.situations.length}.\n` +
          'Study the replays, then go again.',
      );
    }
  }

  private updateHud(): void {
    const s = this.state;
    const total = this.level.mission.situations.length;
    const best =
      this.bestFrames === null ? '' : `   Best ${(this.bestFrames / FRAMES_PER_SECOND).toFixed(1)} s`;
    const streak = s.streak > 1 ? `   x${s.streak}` : '';
    const seconds = (s.askingFrames / FRAMES_PER_SECOND).toFixed(1);
    this.hud.setText(`${s.correct}/${total}   ${seconds} s   ${s.points} pts${streak}${best}`);
    // Hull hearts: electric blue while afloat, grey once lost. Never red (G15).
    const g = this.hearts.clear();
    for (let i = 0; i < this.level.mission.hearts; i++) {
      const x = LIGHTS_W - 56 - i * 56;
      const color = i < s.hearts ? COLOR.blue : COLOR.lost;
      g.fillStyle(color, 1).fillRect(x - 3, 52, 6, 14);
      g.fillPoints(
        [
          new Phaser.Math.Vector2(x - 22, 66),
          new Phaser.Math.Vector2(x + 22, 66),
          new Phaser.Math.Vector2(x + 14, 92),
          new Phaser.Math.Vector2(x - 14, 92),
        ],
        true,
      );
    }
  }

  /** Per-frame drawing: the lights, their reflections, the ripples and the replay timer. */
  private drawLive(time: number): void {
    const s = this.state;
    const replaying = s.phase === 'replay' && s.outcome === 'playing';
    const g = this.lightsG.clear();
    const focus = this.focusSituation();
    if (focus) {
      const lit = Math.floor((REPLAY_FRAMES - s.replayFramesLeft) / RING_FRAMES);
      focus.lights.forEach((light, i) => {
        const x = CENTER_X + light.x * X_UNIT;
        const y = LIGHT_BASE - light.y * Y_UNIT;
        const color = LIGHT_COLOR[light.color];
        const flicker = 0.9 + 0.1 * Math.sin(time / 260 + i);
        g.fillStyle(color, 0.1 * flicker).fillCircle(x, y, 40);
        g.fillStyle(color, 0.22 * flicker).fillCircle(x, y, 22);
        g.fillStyle(color, 0.9).fillCircle(x, y, 9);
        g.fillStyle(COLOR.white, 0.9).fillCircle(x, y, 4);
        g.fillStyle(color, 0.16 * flicker).fillRect(x - 3, HORIZON + 4, 6, 50 + (i % 3) * 8);
        if (replaying) {
          const on = lit % focus.lights.length === i;
          g.lineStyle(on ? 4 : 2, on ? COLOR.gold : COLOR.blue, on ? 1 : 0.4);
          g.strokeCircle(x, y, 34);
        }
      });
    }
    const w = this.waterG.clear();
    for (let i = 0; i < 9; i++) {
      const x = ((i * 211 + time / 40) % 760) - 20;
      w.fillStyle(COLOR.waterLine, 0.5).fillRect(x, HORIZON + 14 + i * 9, 36 + (i % 3) * 14, 2);
    }
    const bar = this.replayBar.clear();
    if (replaying) {
      const left = (BAR_W * s.replayFramesLeft) / REPLAY_FRAMES;
      bar.fillStyle(COLOR.lost, 1).fillRect(CENTER_X - BAR_W / 2, BAR_Y, BAR_W, 8);
      bar.fillStyle(COLOR.gold, 1).fillRect(CENTER_X - BAR_W / 2, BAR_Y, left, 8);
    }
  }

  private publish(): void {
    const s = this.state;
    const head = s.queue[0];
    const answer = head === undefined ? null : situationAt(this.level, head).answer;
    const right = answer === null ? -1 : s.options.indexOf(answer);
    window.__captainsLights = {
      frame: s.frame,
      phase: s.phase,
      outcome: s.outcome,
      hearts: s.hearts,
      misses: s.misses,
      correct: s.correct,
      total: this.level.mission.situations.length,
      rightOption: right,
      wrongOption: right === 0 ? 1 : 0,
      replayFramesLeft: s.replayFramesLeft,
    };
  }
}
