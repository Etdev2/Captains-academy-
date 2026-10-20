import * as Phaser from 'phaser';
import type { Input, Level, Rudder, SimState, Throttle } from '../sim/sim';
import {
  FRAMES_PER_SECOND,
  HEADING_FULL_TURN,
  POS_SCALE,
  distanceToSlipMm,
  hullCircles,
  initialState,
  starsFor,
  step,
} from '../sim/sim';
import { loadBestFrames, saveBestFrames } from './storage';

// Draws the harbor and the boat, turns keys and touches into helm input, and
// steps the simulation at a fixed 60 Hz. The simulation never sees wall-clock
// time: this scene only decides how many frames to step.

export const VIEW_W = 1280;
export const VIEW_H = 768;
const FRAME_MS = 1000 / FRAMES_PER_SECOND;
const MAX_STEPS_PER_UPDATE = 5;
const MM_PER_KNOT_SECOND = 514.444;
// The camera shows about 90 m of harbor around the boat; the chart in the
// corner shows all of it.
const ZOOM = 3.2;
const CHART_W = 240;
// Matches the rotate-your-phone rule in play/index.html. While it applies the
// level is hidden, so the clock and the current must not run either (G8).
const PORTRAIT_PHONE = '(orientation: portrait) and (max-width: 900px)';
// Coaching: the start hint shows this long, and the slow-down warning starts
// this far from the slip.
const START_HINT_FRAMES = FRAMES_PER_SECOND * 5;
const APPROACH_MM = 35000;
const WAKE_POINTS = 60;
const FONT = 'system-ui, sans-serif';

// Night ocean. Navigation lights are the only red and green on screen (G15).
const COLOR = {
  water: 0x06121f,
  waterLine: 0x0d2236,
  shore: 0x1d2a2f,
  breakwater: 0x4a5560,
  dock: 0x8a6a45,
  mooredHull: 0xb9c3cc,
  slip: 0xf4d06f,
  hull: 0xf2f5f7,
  deck: 0xc9d3db,
  portLight: 0xff3030,
  starboardLight: 0x30ff60,
  mastheadLight: 0xffffff,
  gold: 0xf4d06f,
  blue: 0x4fc3ff,
  purple: 0xb36bff,
  button: 0x15324d,
};

export interface DebugView {
  frame: number;
  outcome: string;
  speedMmPerS: number;
}

declare global {
  interface Window {
    __captainsAcademy?: DebugView;
  }
}

export class HarborScene extends Phaser.Scene {
  private readonly level: Level;
  private state!: SimState;
  private accumulator = 0;
  private scale_ = 1;
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
  private wakePoints: [number, number][] = [];
  private keys!: Record<
    'up' | 'down' | 'left' | 'right' | 'w' | 's' | 'a' | 'd' | 'enter' | 'space',
    Phaser.Input.Keyboard.Key
  >;
  private readonly touch = { ahead: false, astern: false, port: false, starboard: false };
  private shownOutcome = 'playing';
  private bestFrames: number | null = null;

  constructor(level: Level) {
    super('harbor');
    this.level = level;
  }

  create(): void {
    const { world } = this.level.mission;
    this.scale_ = Math.min(VIEW_W / world.w, VIEW_H / world.h) * ZOOM;
    this.cameras.main.setBounds(0, 0, this.px(world.w), this.px(world.h));
    this.drawHarbor();
    this.slipGlow = this.add.graphics();
    this.wake = this.add.graphics();
    this.boat = this.add.graphics();
    this.pointer = this.add.graphics().setScrollFactor(0).setDepth(9);
    this.pointerLabel = this.add
      .text(0, 0, '', { fontFamily: FONT, fontSize: '20px', fontStyle: 'bold', color: '#f4d06f' })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(9);
    this.hint = this.add
      .text(VIEW_W / 2, 64, '', {
        fontFamily: FONT,
        fontSize: '28px',
        fontStyle: 'bold',
        align: 'center',
        color: '#4fc3ff',
        stroke: '#06121f',
        strokeThickness: 6,
      })
      .setOrigin(0.5, 0)
      .setScrollFactor(0)
      .setDepth(10);
    this.drawChart();
    this.hud = this.add
      .text(16, VIEW_H - 16, '', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '22px',
        color: '#e8f1f8',
      })
      .setOrigin(0, 1)
      .setScrollFactor(0)
      .setDepth(10);
    this.banner = this.add
      .text(VIEW_W / 2, VIEW_H / 2 - 40, '', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '40px',
        fontStyle: 'bold',
        align: 'center',
        color: '#f4d06f',
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(10);
    this.add
      .text(VIEW_W / 2, 18, this.level.mission.title, {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '22px',
        color: '#f4d06f',
      })
      .setOrigin(0.5, 0)
      .setScrollFactor(0)
      .setDepth(10);
    this.setUpKeys();
    this.setUpTouch();
    this.bestFrames = loadBestFrames(this.level.mission.id);
    this.restart();
  }

  private restart(): void {
    this.state = initialState(this.level);
    this.accumulator = 0;
    this.shownOutcome = 'playing';
    this.wakePoints = [];
    this.banner.setText('');
    this.render();
  }

  private px(mm: number): number {
    return mm * this.scale_;
  }

  private drawHarbor(): void {
    const g = this.add.graphics();
    const { world, obstacles, slip } = this.level.mission;
    g.fillStyle(COLOR.water, 1).fillRect(0, 0, this.px(world.w), this.px(world.h));
    g.lineStyle(1, COLOR.waterLine, 1);
    for (let y = 0; y < world.h; y += 10000)
      g.lineBetween(0, this.px(y), this.px(world.w), this.px(y));
    for (let x = 0; x < world.w; x += 10000)
      g.lineBetween(this.px(x), 0, this.px(x), this.px(world.h));
    for (const o of obstacles) {
      const color =
        o.kind === 'shore'
          ? COLOR.shore
          : o.kind === 'breakwater'
            ? COLOR.breakwater
            : o.kind === 'dock'
              ? COLOR.dock
              : COLOR.mooredHull;
      g.fillStyle(color, 1);
      if (o.kind === 'moored-boat')
        g.fillRoundedRect(this.px(o.x), this.px(o.y), this.px(o.w), this.px(o.h), 4);
      else g.fillRect(this.px(o.x), this.px(o.y), this.px(o.w), this.px(o.h));
    }
    g.lineStyle(3, COLOR.slip, 1).strokeRect(
      this.px(slip.x),
      this.px(slip.y),
      this.px(slip.w),
      this.px(slip.h),
    );
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
  private drawSlipGlow(): void {
    const { slip } = this.level.mission;
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

  /** When the slip is off screen, an arrow circling the boat points to it. */
  private drawPointer(s: SimState): void {
    const { slip } = this.level.mission;
    const cam = this.cameras.main;
    const sx = this.px(slip.x + slip.w / 2) - cam.scrollX;
    const sy = this.px(slip.y + slip.h / 2) - cam.scrollY;
    const bx = this.px(s.x / POS_SCALE) - cam.scrollX;
    const by = this.px(s.y / POS_SCALE) - cam.scrollY;
    this.pointer.clear();
    const margin = 80;
    if (sx > margin && sx < VIEW_W - margin && sy > margin && sy < VIEW_H - margin) {
      this.pointerLabel.setText('');
      return;
    }
    const angle = Math.atan2(sy - by, sx - bx);
    const at = (r: number, a = 0): [number, number] => [
      bx + Math.cos(angle + a) * r,
      by + Math.sin(angle + a) * r,
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
    const meters = Math.round(distanceToSlipMm(this.level, s) / 1000);
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
    } else if (near && slow) {
      this.hint.setColor('#b36bff').setText(`Slow down: under ${knots} kn to dock`);
    } else if (s.frame < START_HINT_FRAMES) {
      this.hint
        .setColor('#4fc3ff')
        .setText('Bring her into the gold slip.\n▲ ahead   ▼ astern   ◀ ▶ steer');
    } else {
      this.hint.setText('');
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
    for (const o of obstacles) {
      g.fillStyle(o.kind === 'moored-boat' ? COLOR.mooredHull : COLOR.breakwater, 1);
      g.fillRect(left + c(o.x), top + c(o.y), Math.max(1, c(o.w)), Math.max(1, c(o.h)));
    }
    g.fillStyle(COLOR.slip, 1).fillRect(
      left + c(slip.x),
      top + c(slip.y),
      Math.max(2, c(slip.w)),
      Math.max(2, c(slip.h)),
    );
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
      enter: kb.addKey(K.ENTER),
      space: kb.addKey(K.SPACE),
    };
  }

  /** Four large hold-to-use buttons for one-thumb-per-side play on a phone. */
  private setUpTouch(): void {
    this.input.addPointer(3);
    const size = 120;
    const pad = 24;
    const y = VIEW_H - size - pad - 40;
    const buttons: [keyof typeof this.touch, number, number, string][] = [
      ['port', pad, y, '◀'],
      ['starboard', pad + size + 16, y, '▶'],
      ['ahead', VIEW_W - pad - size, y - size - 16, '▲'],
      ['astern', VIEW_W - pad - size, y, '▼'],
    ];
    for (const [name, x, by, label] of buttons) {
      const bg = this.add.graphics().setScrollFactor(0).setDepth(5);
      bg.fillStyle(COLOR.button, 0.55).fillRoundedRect(x, by, size, size, 18);
      this.add
        .text(x + size / 2, by + size / 2, label, { fontSize: '48px', color: '#4fc3ff' })
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(6);
      const zone = this.add
        .zone(x, by, size, size)
        .setOrigin(0)
        .setScrollFactor(0)
        .setInteractive()
        .setDepth(7);
      const set = (on: boolean) => () => {
        this.touch[name] = on;
      };
      zone.on('pointerdown', set(true));
      zone.on('pointerup', set(false));
      zone.on('pointerout', set(false));
    }
    this.input.on('pointerdown', () => {
      if (this.state.outcome !== 'playing') this.restart();
    });
  }

  private readInput(): Input {
    const k = this.keys;
    const ahead = k.up.isDown || k.w.isDown || this.touch.ahead;
    const astern = k.down.isDown || k.s.isDown || this.touch.astern;
    const port = k.left.isDown || k.a.isDown || this.touch.port;
    const starboard = k.right.isDown || k.d.isDown || this.touch.starboard;
    const throttle: Throttle = ahead === astern ? 0 : ahead ? 1 : -1;
    const rudder: Rudder = port === starboard ? 0 : starboard ? 1 : -1;
    return { throttle, rudder };
  }

  override update(_time: number, delta: number): void {
    if (window.matchMedia(PORTRAIT_PHONE).matches) {
      this.accumulator = 0;
      return;
    }
    if (this.state.outcome !== 'playing') {
      if (
        Phaser.Input.Keyboard.JustDown(this.keys.enter) ||
        Phaser.Input.Keyboard.JustDown(this.keys.space)
      ) {
        this.restart();
      }
      return;
    }
    this.accumulator = Math.min(this.accumulator + delta, FRAME_MS * MAX_STEPS_PER_UPDATE);
    const input = this.readInput();
    while (this.accumulator >= FRAME_MS && this.state.outcome === 'playing') {
      this.state = step(this.level, this.state, input);
      this.accumulator -= FRAME_MS;
    }
    this.render();
  }

  private render(): void {
    const s = this.state;
    this.drawSlipGlow();
    this.drawWake(s);
    this.drawBoat(s);
    this.cameras.main.centerOn(this.px(s.x / POS_SCALE), this.px(s.y / POS_SCALE));
    this.drawPointer(s);
    this.updateHint(s);
    this.chartBoat
      .clear()
      .fillStyle(COLOR.hull, 1)
      .fillCircle((s.x / POS_SCALE) * this.chartScale, (s.y / POS_SCALE) * this.chartScale, 3);
    const speedMmPerS = (s.speed * FRAMES_PER_SECOND) / POS_SCALE;
    const knots = Math.abs(speedMmPerS) / MM_PER_KNOT_SECOND;
    const best =
      this.bestFrames === null
        ? ''
        : `   Best ${(this.bestFrames / FRAMES_PER_SECOND).toFixed(1)} s`;
    this.hud.setText(
      `${knots.toFixed(1)} kn${speedMmPerS < 0 ? ' astern' : ''}   ` +
        `Slip ${Math.round(distanceToSlipMm(this.level, s) / 1000)} m   ` +
        `Bumps ${s.bumps}   ${(s.frame / FRAMES_PER_SECOND).toFixed(1)} s${best}`,
    );
    window.__captainsAcademy = { frame: s.frame, outcome: s.outcome, speedMmPerS };
    if (s.outcome !== this.shownOutcome) this.showOutcome(s);
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
      const par = this.level.mission.parSeconds;
      const tip =
        stars === 3
          ? 'Textbook.'
          : s.bumps > 0
            ? 'Fewer bumps for more stars.'
            : `Under ${par} s for three stars.`;
      this.banner.setColor('#f4d06f');
      this.banner.setText(
        `${'★'.repeat(stars)}${'☆'.repeat(3 - stars)}\n` +
          `Docked in ${(s.frame / FRAMES_PER_SECOND).toFixed(1)} s${record ? ', a new best' : ''}. ${tip}\n` +
          'Tap or press Enter to go again.',
      );
      this.cameras.main.flash(300, 244, 208, 111);
    } else if (s.outcome === 'hit') {
      this.banner.setColor('#b36bff');
      this.banner.setText('Hit too hard. Come in slower.\nTap or press Enter to try again.');
      this.cameras.main.shake(400, 0.01);
    }
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
    const L = lengthMm / 2;
    const B = beamMm / 2;
    const hull = [pt(0, L), pt(B, L * 0.35), pt(B, -L), pt(-B, -L), pt(-B, L * 0.35)];
    g.fillStyle(COLOR.hull, 1).fillPoints(
      hull.map(([x, y]) => new Phaser.Math.Vector2(x, y)),
      true,
    );
    const cabin = [
      pt(B * 0.6, L * 0.2),
      pt(B * 0.6, -L * 0.4),
      pt(-B * 0.6, -L * 0.4),
      pt(-B * 0.6, L * 0.2),
    ];
    g.fillStyle(COLOR.deck, 1).fillPoints(
      cabin.map(([x, y]) => new Phaser.Math.Vector2(x, y)),
      true,
    );
    const light = (p: [number, number], color: number) => {
      g.fillStyle(color, 0.25).fillCircle(p[0], p[1], 16);
      g.fillStyle(color, 1).fillCircle(p[0], p[1], 5);
    };
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
