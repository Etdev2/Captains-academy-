import * as Phaser from 'phaser';
import { UNIT } from '../sim/course';
import type { Level, SimState } from '../sim/sim';
import {
  FRAMES_PER_SECOND,
  FULL,
  HEADING_FULL_TURN,
  POS_SCALE,
  distanceToSlipMm,
  hullCircles,
  initialState,
  starsFor,
  step,
  trafficPoses,
  windAt,
} from '../sim/sim';
import { Helm } from './helm';
import { Scenery } from './scenery';
import type { Sound } from './sound';
import { loadBestFrames, loadStars, saveBestFrames, saveStars } from './storage';

// Draws the harbor and the boat, turns the helm, keys and touches into input,
// and steps the simulation at a fixed 60 Hz. The simulation never sees
// wall-clock time: this scene only decides how many frames to step.

export const VIEW_W = 1280;
export const VIEW_H = 768;
const FRAME_MS = 1000 / FRAMES_PER_SECOND;
const MAX_STEPS_PER_UPDATE = 5;
const MM_PER_KNOT_SECOND = 514.444;
// The camera shows about 90 m of harbor around the boat; the chart in the
// corner shows all of it.
const ZOOM = 3.2;
const CHART_W = 220;
// Matches the rotate-your-phone rule in play/index.html. While it applies the
// level is hidden, so the clock and the current must not run either (G8).
const PORTRAIT_PHONE = '(orientation: portrait) and (max-width: 900px)';
// Coaching: the start hint shows this long, and the slow-down warning starts
// this far from the slip.
const START_HINT_FRAMES = FRAMES_PER_SECOND * 6;
const APPROACH_MM = 35000;
const WAKE_POINTS = 60;
// The keyboard moves the engine levers at this many percent per second.
const LEVER_RATE = 120;
// A short blast (Rule 32): about one second.
const SHORT_BLAST_S = 1;
const FONT = 'system-ui, sans-serif';

const COLOR = {
  slip: 0xf4d06f,
  hull: 0xf2f5f7,
  deck: 0xc9d3db,
  portLight: 0xff3030,
  starboardLight: 0x30ff60,
  mastheadLight: 0xffffff,
  gold: 0xf4d06f,
  blue: 0x4fc3ff,
  water: 0x06121f,
  breakwater: 0x4a5560,
  mooredHull: 0xb9c3cc,
  channelEdge: 0xe8f1f8,
};

// Traffic hulls by kind. Hull colors stay off red and green (G15); only the
// navigation lights use them.
const TRAFFIC_LOOK = {
  ship: { hull: 0x56636f, deck: 0x8796a3 },
  ferry: { hull: 0xe8edf2, deck: 0x4fc3ff },
  powerboat: { hull: 0xd9e2ea, deck: 0x9aa8b4 },
  kayak: { hull: 0xf0a24a, deck: 0xf0a24a },
} as const;

export interface DebugView {
  frame: number;
  outcome: string;
  speedMmPerS: number;
  level: number;
  port: number;
  starboard: number;
  /** Sound is switched off (the SOUND button or M). */
  muted: boolean;
  /** A horn blast is sounding and its rings are showing (the HORN button or H). */
  horn: boolean;
  /** The boat's position in mm, x east and y south. */
  xMm: number;
  yMm: number;
  /** Gates passed and gates in the level. Levels without a course show 0 and 0. */
  gate: number;
  gates: number;
  /** The traffic vessel that hit the boat, or null. */
  struckBy: string | null;
}

declare global {
  interface Window {
    __captainsAcademy?: DebugView;
  }
}

type Keys = Record<
  | 'up'
  | 'down'
  | 'left'
  | 'right'
  | 'w'
  | 's'
  | 'a'
  | 'd'
  | 'q'
  | 'z'
  | 'e'
  | 'c'
  | 'enter'
  | 'space'
  | 'h'
  | 'm'
  | 'x',
  Phaser.Input.Keyboard.Key
>;

export class HarborScene extends Phaser.Scene {
  private levelIndex = 0;
  private level!: Level;
  private state!: SimState;
  private accumulator = 0;
  private scale_ = 1;
  private scenery!: Scenery;
  private boat!: Phaser.GameObjects.Graphics;
  private chartBoat!: Phaser.GameObjects.Graphics;
  private chartScale = 1;
  private hud!: Phaser.GameObjects.Text;
  private banner!: Phaser.GameObjects.Text;
  private hint!: Phaser.GameObjects.Text;
  private slipGlow!: Phaser.GameObjects.Graphics;
  private wake!: Phaser.GameObjects.Graphics;
  private pointer!: Phaser.GameObjects.Graphics;
  private pointerLabel!: Phaser.GameObjects.Text;
  private hornRings!: Phaser.GameObjects.Graphics;
  private gateMarks!: Phaser.GameObjects.Graphics;
  private gateLabels: Phaser.GameObjects.Text[] = [];
  private traffic!: Phaser.GameObjects.Graphics;
  private lastGates = 0;
  private gateFlashUntil = 0;
  private muteButton!: Phaser.GameObjects.Text;
  private wakePoints: [number, number][] = [];
  private keys!: Keys;
  private helm!: Helm;
  private shownOutcome = 'playing';
  private bestFrames: number | null = null;
  private lastBumps = 0;
  private hornUntil = 0;

  constructor(
    private readonly levels: readonly Level[],
    private readonly audio: Sound,
    // Testing switch from /play?unlock=all. Players still open levels by stars (G12).
    private readonly unlockAll = false,
  ) {
    super('harbor');
  }

  init(data: { levelIndex?: number }): void {
    this.levelIndex = data.levelIndex ?? 0;
    const level = this.levels[this.levelIndex];
    if (!level) throw new Error(`no level ${this.levelIndex}`);
    this.level = level;
  }

  create(): void {
    const { world } = this.level.mission;
    this.scale_ = Math.min(VIEW_W / world.w, VIEW_H / world.h) * ZOOM;
    this.cameras.main.setBounds(0, 0, this.px(world.w), this.px(world.h));
    this.scenery = new Scenery(this, this.level.mission, (mm) => this.px(mm));
    this.drawChannels();
    this.drawSlipMarker();
    this.slipGlow = this.add.graphics();
    this.gateMarks = this.add.graphics();
    this.gateLabels = this.level.gates.map((g, i) =>
      this.add
        .text(this.px(g.x2), this.px(g.y2) - 30, String(i + 1), {
          fontFamily: FONT,
          fontSize: '26px',
          fontStyle: 'bold',
          color: '#f4d06f',
        })
        .setOrigin(0.5)
        .setStroke('#06121f', 6),
    );
    this.wake = this.add.graphics();
    this.traffic = this.add.graphics();
    this.boat = this.add.graphics();
    this.hornRings = this.add.graphics();
    this.drawChart();
    this.pointer = this.add.graphics().setScrollFactor(0).setDepth(9);
    this.pointerLabel = this.label(0, 0, '', 20, '#f4d06f').setOrigin(0.5).setDepth(9);
    this.hud = this.label(16, VIEW_H - 14, '', 22, '#e8f1f8').setOrigin(0, 1);
    this.banner = this.label(VIEW_W / 2, VIEW_H / 2 - 60, '', 38, '#f4d06f')
      .setOrigin(0.5)
      .setAlign('center')
      .setFontStyle('bold')
      .setStroke('#06121f', 8)
      .setWordWrapWidth(VIEW_W - 380);
    this.hint = this.label(VIEW_W / 2, 60, '', 26, '#4fc3ff')
      .setOrigin(0.5, 0)
      .setAlign('center')
      .setFontStyle('bold')
      .setStroke('#06121f', 6);
    this.label(VIEW_W / 2, 16, this.level.mission.title, 22, '#f4d06f').setOrigin(0.5, 0);
    this.setUpKeys();
    this.helm = new Helm(this, { viewW: VIEW_W, viewH: VIEW_H });
    this.setUpButtons();
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      this.audio.unlock();
      if (this.state.outcome !== 'playing' && !this.helm.owns(p) && p.y > 190) this.advance();
    });
    this.input.keyboard?.on('keydown', () => this.audio.unlock());
    this.bestFrames = loadBestFrames(this.level.mission.id);
    this.restart();
  }

  private label(x: number, y: number, text: string, size: number, color: string) {
    return this.add
      .text(x, y, text, { fontFamily: FONT, fontSize: `${size}px`, color })
      .setScrollFactor(0)
      .setDepth(10);
  }

  private restart(): void {
    this.state = initialState(this.level);
    this.accumulator = 0;
    this.shownOutcome = 'playing';
    this.wakePoints = [];
    this.lastBumps = 0;
    this.lastGates = 0;
    this.gateFlashUntil = 0;
    this.helm.setLevers(0, 0);
    this.banner.setText('');
    this.render();
  }

  /** After a run: a docking moves on to the next level, anything else retries. */
  private advance(): void {
    const next = this.levelIndex + 1;
    if (this.state.outcome === 'docked' && next < this.levels.length) {
      this.scene.restart({ levelIndex: next });
    } else {
      this.restart();
    }
  }

  private unlocked(index: number): boolean {
    if (this.unlockAll || index === 0) return true;
    const previous = this.levels[index - 1];
    return previous !== undefined && loadStars(previous.mission.id) > 0;
  }

  private px(mm: number): number {
    return mm * this.scale_;
  }

  private drawSlipMarker(): void {
    const { slip } = this.level.mission;
    this.add
      .graphics()
      .lineStyle(3, COLOR.slip, 1)
      .strokeRect(this.px(slip.x), this.px(slip.y), this.px(slip.w), this.px(slip.h));
    this.add
      .text(this.px(slip.x + slip.w / 2), this.px(slip.y + slip.h) + 14, 'DOCK HERE\n▲', {
        fontFamily: FONT,
        fontSize: '22px',
        fontStyle: 'bold',
        align: 'center',
        color: '#f4d06f',
      })
      .setOrigin(0.5, 0);
  }

  /** A pulsing glow on the slip, so it reads as the goal from across the harbor. */
  private drawSlipGlow(s: SimState): void {
    const { slip } = this.level.mission;
    // On a course the slip stays dark until the last gate is passed.
    if ((s.course?.gates ?? 0) < this.level.gates.length) {
      this.slipGlow.clear();
      return;
    }
    const pulse = 0.5 + 0.5 * Math.sin(this.time.now / 300);
    const pad = 6 + 10 * pulse;
    this.slipGlow
      .clear()
      .fillStyle(COLOR.gold, 0.12 + 0.18 * pulse)
      .fillRect(
        this.px(slip.x) - pad,
        this.px(slip.y) - pad,
        this.px(slip.w) + pad * 2,
        this.px(slip.h) + pad * 2,
      );
  }

  /**
   * A narrow channel or fairway: a faint band with dashed limits, the way a
   * chart marks a dredged channel. Pale, not red or green (G15).
   */
  private drawChannels(): void {
    const g = this.add.graphics();
    for (const c of this.level.mission.channels ?? []) {
      const x = this.px(c.x);
      const y = this.px(c.y);
      const w = this.px(c.w);
      const h = this.px(c.h);
      g.fillStyle(COLOR.blue, 0.07).fillRect(x, y, w, h);
      g.lineStyle(2, COLOR.channelEdge, 0.55);
      for (let dx = 0; dx < w; dx += 36) {
        const dash = Math.min(20, w - dx);
        g.lineBetween(x + dx, y, x + dx + dash, y);
        g.lineBetween(x + dx, y + h, x + dx + dash, y + h);
      }
      this.add
        .text(x + w / 2, y + h / 2, 'CHANNEL', {
          fontFamily: FONT,
          fontSize: '22px',
          fontStyle: 'bold',
          color: '#e8f1f8',
        })
        .setOrigin(0.5)
        .setAlpha(0.45);
    }
  }

  /** A small chart of the whole harbor in the top-right corner. */
  private drawChart(): void {
    const { world, obstacles, slip } = this.level.mission;
    this.chartScale = CHART_W / world.w;
    const c = (mm: number) => mm * this.chartScale;
    const left = VIEW_W - CHART_W - 16;
    const top = 16;
    const g = this.add.graphics().setScrollFactor(0).setDepth(8);
    g.fillStyle(COLOR.water, 0.9).fillRect(left, top, c(world.w), c(world.h));
    g.lineStyle(1, COLOR.blue, 0.6).strokeRect(left, top, c(world.w), c(world.h));
    for (const ch of this.level.mission.channels ?? []) {
      g.fillStyle(COLOR.blue, 0.25).fillRect(left + c(ch.x), top + c(ch.y), c(ch.w), c(ch.h));
    }
    for (const o of obstacles) {
      g.fillStyle(o.kind === 'moored-boat' ? COLOR.mooredHull : COLOR.breakwater, 1);
      g.fillRect(left + c(o.x), top + c(o.y), Math.max(1, c(o.w)), Math.max(1, c(o.h)));
    }
    g.fillStyle(COLOR.slip, 1).fillRect(
      left + c(slip.x) - 1,
      top + c(slip.y) - 1,
      Math.max(3, c(slip.w)),
      Math.max(3, c(slip.h)),
    );
    g.lineStyle(2, COLOR.gold, 0.9);
    for (const gate of this.level.gates) {
      g.lineBetween(left + c(gate.x1), top + c(gate.y1), left + c(gate.x2), top + c(gate.y2));
    }
    this.chartBoat = this.add.graphics({ x: left, y: top }).setScrollFactor(0).setDepth(9);
  }

  private setUpKeys(): void {
    const kb = this.input.keyboard;
    if (!kb) throw new Error('keyboard input is unavailable');
    const K = Phaser.Input.Keyboard.KeyCodes;
    this.keys = {
      up: kb.addKey(K.UP),
      down: kb.addKey(K.DOWN),
      left: kb.addKey(K.LEFT),
      right: kb.addKey(K.RIGHT),
      w: kb.addKey(K.W),
      s: kb.addKey(K.S),
      a: kb.addKey(K.A),
      d: kb.addKey(K.D),
      q: kb.addKey(K.Q),
      z: kb.addKey(K.Z),
      e: kb.addKey(K.E),
      c: kb.addKey(K.C),
      enter: kb.addKey(K.ENTER),
      space: kb.addKey(K.SPACE),
      h: kb.addKey(K.H),
      m: kb.addKey(K.M),
      x: kb.addKey(K.X),
    };
  }

  /** Sound on/off, the horn, and level buttons down the top-left. */
  private setUpButtons(): void {
    const button = (x: number, y: number, text: string, onTap: () => void) => {
      const b = this.label(x, y, text, 20, '#4fc3ff')
        .setFontStyle('bold')
        .setBackgroundColor('#15324dcc')
        .setPadding(14, 10, 14, 10)
        .setInteractive({ useHandCursor: true });
      b.on(
        'pointerdown',
        (_p: Phaser.Input.Pointer, _x: number, _y: number, e: Phaser.Types.Input.EventData) => {
          e.stopPropagation();
          this.audio.unlock();
          onTap();
        },
      );
      return b;
    };
    this.muteButton = button(16, 16, '', () => this.toggleMute());
    this.updateMuteLabel();
    button(16, 72, 'HORN', () => this.soundHorn());
    this.levels.forEach((lvl, i) => {
      const stars = loadStars(lvl.mission.id);
      const open = this.unlocked(i);
      const text = `LEVEL ${i + 1}${open ? (stars > 0 ? ' ' + '★'.repeat(stars) : '') : ' (locked)'}`;
      const b = button(16, 128 + i * 56, text, () => {
        if (open && i !== this.levelIndex) this.scene.restart({ levelIndex: i });
      });
      if (i === this.levelIndex) b.setColor('#f4d06f');
      if (!open) b.setAlpha(0.5);
    });
  }

  private toggleMute(): void {
    this.audio.toggleMute();
    this.updateMuteLabel();
  }

  private updateMuteLabel(): void {
    this.muteButton.setText(this.audio.muted ? 'SOUND OFF' : 'SOUND ON');
  }

  private soundHorn(): void {
    if (this.time.now < this.hornUntil) return;
    this.hornUntil = this.time.now + SHORT_BLAST_S * 1000;
    this.audio.horn(SHORT_BLAST_S);
  }

  override update(_time: number, delta: number): void {
    if (window.matchMedia(PORTRAIT_PHONE).matches) {
      this.accumulator = 0;
      return;
    }
    const k = this.keys;
    const J = Phaser.Input.Keyboard.JustDown;
    if (J(k.m)) this.toggleMute();
    if (J(k.h)) this.soundHorn();
    if (this.state.outcome !== 'playing') {
      if (J(k.enter) || J(k.space)) this.advance();
      this.audio.silenceEngine();
      this.render();
      return;
    }
    this.readKeys(delta);
    this.accumulator = Math.min(this.accumulator + delta, FRAME_MS * MAX_STEPS_PER_UPDATE);
    const input = {
      port: this.helm.port,
      starboard: this.helm.starboard,
      // The helm has no wheel: the levers steer, and the rudder stays midships.
      rudder: 0,
    };
    while (this.accumulator >= FRAME_MS && this.state.outcome === 'playing') {
      this.state = step(this.level, this.state, input);
      this.accumulator -= FRAME_MS;
    }
    this.react();
    this.render();
  }

  /**
   * Keys drive the same levers as the touch helm: up and down (W, S) move both
   * levers, Q and Z the port lever, E and C the starboard lever, left and right
   * (A, D) split them to turn that way, and X brings both to stop.
   */
  private readKeys(deltaMs: number): void {
    const k = this.keys;
    const move = (LEVER_RATE * deltaMs) / 1000;
    const lever = (ahead: boolean, astern: boolean) =>
      ahead === astern ? 0 : ahead ? move : -move;
    const both = lever(k.up.isDown || k.w.isDown, k.down.isDown || k.s.isDown);
    // Turning to starboard means port ahead and starboard astern.
    const twist = lever(k.right.isDown || k.d.isDown, k.left.isDown || k.a.isDown);
    const port = both + twist + lever(k.q.isDown, k.z.isDown);
    const starboard = both - twist + lever(k.e.isDown, k.c.isDown);
    if (port !== 0 || starboard !== 0) {
      this.helm.setLevers(this.helm.port + port, this.helm.starboard + starboard);
    }
    if (Phaser.Input.Keyboard.JustDown(k.x)) this.helm.setLevers(0, 0);
  }

  /** Sound and phone buzz for what just happened. */
  private react(): void {
    const s = this.state;
    if (s.bumps > this.lastBumps) {
      this.lastBumps = s.bumps;
      const hard = s.outcome === 'hit';
      this.audio.bump(hard);
      navigator.vibrate?.(hard ? 300 : 60);
    }
    const gates = s.course?.gates ?? 0;
    if (gates > this.lastGates) {
      this.lastGates = gates;
      this.gateFlashUntil = this.time.now + 1500;
      this.audio.chime();
      navigator.vibrate?.(40);
    }
    const load = Math.max(Math.abs(this.helm.port), Math.abs(this.helm.starboard));
    this.audio.engine(load, Math.abs(s.speed) / this.level.maxAhead);
  }

  private render(): void {
    const s = this.state;
    this.scenery.update(this.time.now);
    this.drawSlipGlow(s);
    this.drawGates(s);
    this.drawWake(s);
    this.drawTraffic(s);
    this.drawBoat(s);
    this.drawHornRings(s);
    this.cameras.main.centerOn(this.px(s.x / POS_SCALE), this.px(s.y / POS_SCALE));
    this.drawPointer(s);
    this.updateHint(s);
    this.helm.draw();
    this.chartBoat.clear();
    for (const p of trafficPoses(this.level, s)) {
      this.chartBoat
        .fillStyle(COLOR.mooredHull, 0.9)
        .fillCircle(p.x * this.chartScale, p.y * this.chartScale, 2.5);
    }
    this.chartBoat
      .fillStyle(COLOR.hull, 1)
      .fillCircle((s.x / POS_SCALE) * this.chartScale, (s.y / POS_SCALE) * this.chartScale, 3);
    const speedMmPerS = (s.speed * FRAMES_PER_SECOND) / POS_SCALE;
    const knots = Math.abs(speedMmPerS) / MM_PER_KNOT_SECOND;
    const best =
      this.bestFrames === null
        ? ''
        : `   Best ${(this.bestFrames / FRAMES_PER_SECOND).toFixed(1)} s`;
    const [wx, wy] = windAt(this.level, s.frame);
    const gustKnots = (Math.hypot(wx, wy) * FRAMES_PER_SECOND) / POS_SCALE / MM_PER_KNOT_SECOND;
    const wind = this.level.gust > 0 ? `   Gust ${gustKnots.toFixed(1)} kn` : '';
    const total = this.level.gates.length;
    const passed = s.course?.gates ?? 0;
    const where =
      passed < total
        ? `Gate ${passed + 1} of ${total}, ${Math.round(this.distanceToTargetMm(s) / 1000)} m`
        : `Slip ${Math.round(distanceToSlipMm(this.level, s) / 1000)} m`;
    this.hud.setText(
      `${knots.toFixed(1)} kn${speedMmPerS < 0 ? ' astern' : ''}   ${where}   ` +
        `Bumps ${s.bumps}   ${(s.frame / FRAMES_PER_SECOND).toFixed(1)} s${wind}${best}`,
    );
    const struck = s.course?.struckBy ?? -1;
    window.__captainsAcademy = {
      frame: s.frame,
      outcome: s.outcome,
      speedMmPerS,
      level: this.levelIndex,
      port: this.helm.port,
      starboard: this.helm.starboard,
      muted: this.audio.muted,
      horn: this.time.now < this.hornUntil,
      xMm: Math.trunc(s.x / POS_SCALE),
      yMm: Math.trunc(s.y / POS_SCALE),
      gate: passed,
      gates: total,
      struckBy: this.level.traffic[struck]?.data.name ?? null,
    };
    if (s.outcome !== this.shownOutcome) this.showOutcome(s);
  }

  /** The next gate's middle, or the slip once every gate is passed, in mm. */
  private target(s: SimState): [number, number] {
    const gate = this.level.gates[s.course?.gates ?? 0];
    if (gate) return [(gate.x1 + gate.x2) / 2, (gate.y1 + gate.y2) / 2];
    const { slip } = this.level.mission;
    return [slip.x + slip.w / 2, slip.y + slip.h / 2];
  }

  private distanceToTargetMm(s: SimState): number {
    const [tx, ty] = this.target(s);
    return Math.hypot(tx - s.x / POS_SCALE, ty - s.y / POS_SCALE);
  }

  /** When the next gate or the slip is off screen, an arrow circling the boat points to it. */
  private drawPointer(s: SimState): void {
    const [goalX, goalY] = this.target(s);
    const cam = this.cameras.main;
    const sx = this.px(goalX) - cam.scrollX;
    const sy = this.px(goalY) - cam.scrollY;
    const bx = this.px(s.x / POS_SCALE) - cam.scrollX;
    const by = this.px(s.y / POS_SCALE) - cam.scrollY;
    this.pointer.clear();
    const margin = 80;
    const onScreen = sx > margin && sx < VIEW_W - margin && sy > margin && sy < VIEW_H - margin;
    if (s.outcome !== 'playing' || onScreen) {
      this.pointerLabel.setText('');
      return;
    }
    const angle = Math.atan2(sy - by, sx - bx);
    const at = (r: number): [number, number] => [
      bx + Math.cos(angle) * r,
      by + Math.sin(angle) * r,
    ];
    const ring = 130;
    // A long, notched chevron, so its direction reads at a glance.
    const [tx, ty] = at(ring + 48);
    const [mx, my] = at(ring);
    const [nx, ny] = at(ring + 16);
    const px = -Math.sin(angle) * 16;
    const py = Math.cos(angle) * 16;
    this.pointer
      .fillStyle(COLOR.gold, 0.95)
      .fillPoints(
        [
          new Phaser.Math.Vector2(tx, ty),
          new Phaser.Math.Vector2(mx + px, my + py),
          new Phaser.Math.Vector2(nx, ny),
          new Phaser.Math.Vector2(mx - px, my - py),
        ],
        true,
      );
    const meters = Math.round(this.distanceToTargetMm(s) / 1000);
    const [lx, ly] = at(ring + 78);
    this.pointerLabel.setPosition(lx, ly).setText(`${meters} m`);
  }

  /** A fading trail behind the stern while the boat makes way. */
  private drawWake(s: SimState): void {
    const here: [number, number] = [this.px(s.x / POS_SCALE), this.px(s.y / POS_SCALE)];
    const last = this.wakePoints[this.wakePoints.length - 1];
    if (
      s.outcome === 'playing' &&
      (!last || Math.hypot(here[0] - last[0], here[1] - last[1]) > 8)
    ) {
      this.wakePoints.push(here);
      if (this.wakePoints.length > WAKE_POINTS) this.wakePoints.shift();
    }
    const g = this.wake.clear();
    this.wakePoints.forEach(([x, y], i) => {
      const age = (i + 1) / this.wakePoints.length;
      g.fillStyle(COLOR.blue, 0.05 + 0.25 * age).fillCircle(x, y, 6 + 14 * (1 - age));
    });
  }

  /** The horn shows as rings spreading from the boat, so it works muted too (G16). */
  private drawHornRings(s: SimState): void {
    const g = this.hornRings.clear();
    const left = this.hornUntil - this.time.now;
    if (left <= 0) return;
    const done = 1 - left / (SHORT_BLAST_S * 1000);
    const x = this.px(s.x / POS_SCALE);
    const y = this.px(s.y / POS_SCALE);
    for (const lag of [0, 0.33, 0.66]) {
      const t = (done + lag) % 1;
      g.lineStyle(4, COLOR.blue, 0.8 * (1 - t)).strokeCircle(x, y, 60 + 160 * t);
    }
  }

  /** Coaching line under the title: what to do next. */
  private updateHint(s: SimState): void {
    if (s.outcome !== 'playing') {
      this.hint.setText('');
      return;
    }
    const slow = Math.abs(s.speed) > this.level.maxDock;
    const near = distanceToSlipMm(this.level, s) < APPROACH_MM;
    const knots = (this.level.mission.slip.maxDockMmPerS / MM_PER_KNOT_SECOND).toFixed(1);
    if (s.dockedFrames > 0) {
      this.hint.setColor('#f4d06f').setText('Hold her there…');
    } else if (this.time.now < this.gateFlashUntil) {
      const passed = s.course?.gates ?? 0;
      const total = this.level.gates.length;
      this.hint
        .setColor('#f4d06f')
        .setText(
          passed < total ? `Gate ${passed} of ${total}` : 'Last gate! Now dock in the slip.',
        );
    } else if (near && slow && (s.course?.gates ?? 0) >= this.level.gates.length) {
      this.hint.setColor('#b36bff').setText(`Slow down: under ${knots} kn to dock`);
    } else if (s.frame < START_HINT_FRAMES) {
      this.hint
        .setColor('#4fc3ff')
        .setText(
          this.level.gates.length > 0
            ? 'Run the gold gates in order, then dock.\nWatch the traffic: a wrong turn gets you hit.'
            : this.level.gust > 0
              ? 'Gusty today: the wind sets you off course.\nSplit the engine levers to pivot.'
              : 'Follow the gold arrow to the slip.\nA lever under each thumb: split them to turn.',
        );
    } else {
      this.hint.setText('');
    }
  }

  private showOutcome(s: SimState): void {
    this.shownOutcome = s.outcome;
    if (s.outcome === 'docked') {
      const record = this.bestFrames === null || s.frame < this.bestFrames;
      if (record) {
        this.bestFrames = s.frame;
        saveBestFrames(this.level.mission.id, s.frame);
      }
      const stars = starsFor(this.level, s);
      saveStars(this.level.mission.id, stars);
      const par = this.level.mission.parSeconds;
      const tip =
        stars === 3
          ? 'Textbook.'
          : s.bumps > 0
            ? 'Fewer bumps for more stars.'
            : `Under ${par} s for three stars.`;
      const hasNext = this.levelIndex + 1 < this.levels.length;
      this.banner.setColor('#f4d06f');
      this.banner.setText(
        `${'★'.repeat(stars)}${'☆'.repeat(3 - stars)}\n` +
          `Docked in ${(s.frame / FRAMES_PER_SECOND).toFixed(1)} s${record ? ', a new best' : ''}. ${tip}\n` +
          (hasNext ? 'Tap for the next level ▶' : 'Tap or press Enter to go again.'),
      );
      this.audio.chime();
      this.cameras.main.flash(300, 244, 208, 111);
    } else if (s.outcome === 'hit') {
      const vessel = this.level.traffic[s.course?.struckBy ?? -1];
      this.banner.setColor('#b36bff');
      this.banner.setText(
        vessel
          ? `Hit by the ${vessel.data.name}.\n${vessel.data.lesson}\nTap or press Enter to try again.`
          : 'Hit too hard. Come in slower.\nTap or press Enter to try again.',
      );
      this.cameras.main.shake(400, 0.01);
    }
  }

  /** Each gate is a dashed line between two buoys: gold for the next one, dim once passed. */
  private drawGates(s: SimState): void {
    const g = this.gateMarks.clear();
    const passed = s.course?.gates ?? 0;
    const pulse = 0.5 + 0.5 * Math.sin(this.time.now / 250);
    this.level.gates.forEach((gate, i) => {
      const next = i === passed;
      const color = next ? COLOR.gold : COLOR.blue;
      const alpha = i < passed ? 0.25 : next ? 0.6 + 0.4 * pulse : 0.6;
      const x1 = this.px(gate.x1);
      const y1 = this.px(gate.y1);
      const x2 = this.px(gate.x2);
      const y2 = this.px(gate.y2);
      const len = Math.hypot(x2 - x1, y2 - y1);
      const dashes = Math.max(1, Math.floor(len / 28));
      g.lineStyle(next ? 5 : 3, color, alpha);
      for (let d = 0; d < dashes; d += 2) {
        const a = d / dashes;
        const b = Math.min(1, (d + 1) / dashes);
        g.lineBetween(
          x1 + (x2 - x1) * a,
          y1 + (y2 - y1) * a,
          x1 + (x2 - x1) * b,
          y1 + (y2 - y1) * b,
        );
      }
      for (const [bx, by] of [
        [x1, y1],
        [x2, y2],
      ] as const) {
        g.fillStyle(color, alpha).fillCircle(bx, by, next ? 14 : 10);
      }
      this.gateLabels[i]?.setAlpha(i < passed ? 0.3 : 1).setColor(next ? '#f4d06f' : '#4fc3ff');
    });
  }

  /** Other vessels, top-down, with the navigation lights a skipper would see. */
  private drawTraffic(s: SimState): void {
    const g = this.traffic.clear();
    const poses = trafficPoses(this.level, s);
    this.level.traffic.forEach((t, i) => {
      const p = poses[i];
      if (!p) return;
      const fx = p.ux / UNIT;
      const fy = p.uy / UNIT;
      // Vessel-frame point (right of centerline, ahead of center) to screen pixels.
      const pt = (right: number, ahead: number): [number, number] => [
        this.px(p.x - right * fy + ahead * fx),
        this.px(p.y + right * fx + ahead * fy),
      ];
      const poly = (points: [number, number][]) =>
        points.map(([x, y]) => new Phaser.Math.Vector2(x, y));
      const L = t.data.lengthMm / 2;
      const B = t.data.beamMm / 2;
      const look = TRAFFIC_LOOK[t.data.kind];
      const bow = t.data.kind === 'kayak' ? 0.6 : 0.3;
      g.fillStyle(look.hull, 1).fillPoints(
        poly([pt(0, L), pt(B, L * bow), pt(B, -L), pt(-B, -L), pt(-B, L * bow)]),
        true,
      );
      if (t.data.kind !== 'kayak') {
        g.fillStyle(look.deck, 1).fillPoints(
          poly([
            pt(B * 0.6, L * 0.1),
            pt(B * 0.6, -L * 0.6),
            pt(-B * 0.6, -L * 0.6),
            pt(-B * 0.6, L * 0.1),
          ]),
          true,
        );
      }
      const light = (q: [number, number], color: number, size = 5) => {
        g.fillStyle(color, 0.25).fillCircle(q[0], q[1], size * 3);
        g.fillStyle(color, 1).fillCircle(q[0], q[1], size);
      };
      if (t.data.kind === 'kayak') {
        // A small boat under oars or paddles may show just a white light (Rule 25(d)).
        light(pt(0, 0), COLOR.mastheadLight, 3);
        return;
      }
      light(pt(-B * 0.9, L * 0.4), COLOR.portLight);
      light(pt(B * 0.9, L * 0.4), COLOR.starboardLight);
      light(pt(0, L * 0.5), COLOR.mastheadLight);
      // Vessels 50 m or more carry a second, after masthead light (Rule 23).
      if (t.data.lengthMm >= 50000) light(pt(0, -L * 0.4), COLOR.mastheadLight);
      light(pt(0, -L * 0.97), COLOR.mastheadLight, 4);
    });
  }

  private drawBoat(s: SimState): void {
    const g = this.boat.clear();
    const { lengthMm, beamMm } = this.level.mission.boat;
    const angle = (s.heading / HEADING_FULL_TURN) * Math.PI * 2;
    const sin = Math.sin(angle);
    const cos = Math.cos(angle);
    const cx = s.x / POS_SCALE;
    const cy = s.y / POS_SCALE;
    // Boat-frame point (right of centerline, ahead of center) to screen pixels.
    const pt = (right: number, ahead: number): [number, number] => [
      this.px(cx + right * cos + ahead * sin),
      this.px(cy + right * sin - ahead * cos),
    ];
    const poly = (points: [number, number][]) =>
      points.map(([x, y]) => new Phaser.Math.Vector2(x, y));
    const L = lengthMm / 2;
    const B = beamMm / 2;
    g.fillStyle(COLOR.hull, 1).fillPoints(
      poly([pt(0, L), pt(B, L * 0.35), pt(B, -L), pt(-B, -L), pt(-B, L * 0.35)]),
      true,
    );
    g.fillStyle(COLOR.deck, 1).fillPoints(
      poly([
        pt(B * 0.6, L * 0.2),
        pt(B * 0.6, -L * 0.4),
        pt(-B * 0.6, -L * 0.4),
        pt(-B * 0.6, L * 0.2),
      ]),
      true,
    );
    const light = (p: [number, number], color: number) => {
      g.fillStyle(color, 0.25).fillCircle(p[0], p[1], 16);
      g.fillStyle(color, 1).fillCircle(p[0], p[1], 5);
    };
    // Prop wash from each engine: aft when its lever is ahead, forward when astern.
    for (const [side, lever] of [
      [-B * 0.5, this.helm.port],
      [B * 0.5, this.helm.starboard],
    ] as const) {
      if (lever === 0) continue;
      const reach = (lever / FULL) * L * 0.9;
      const [x0, y0] = pt(side, -L);
      const [x1, y1] = pt(side, -L - reach);
      g.lineStyle(5, COLOR.blue, 0.75).lineBetween(x0, y0, x1, y1);
    }
    light(pt(-B * 0.9, L * 0.3), COLOR.portLight);
    light(pt(B * 0.9, L * 0.3), COLOR.starboardLight);
    light(pt(0, L * 0.1), COLOR.mastheadLight);
    if (s.dockedFrames > 0) {
      // Fills as the boat holds steady in the slip.
      const share = Math.min(1, s.dockedFrames / this.level.holdFrames);
      g.lineStyle(6, COLOR.gold, 1).beginPath();
      g.arc(
        this.px(cx),
        this.px(cy),
        this.px(L) + 16,
        -Math.PI / 2,
        -Math.PI / 2 + share * Math.PI * 2,
      );
      g.strokePath();
    }
    if (import.meta.env.DEV) {
      g.lineStyle(1, COLOR.blue, 0.6);
      for (const [hx, hy] of hullCircles(this.level, s.x, s.y, s.heading)) {
        g.strokeCircle(this.px(hx), this.px(hy), this.px(this.level.hullRadiusMm));
      }
    }
  }
}
