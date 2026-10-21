import * as Phaser from 'phaser';
import {
  FPS,
  HARBOR,
  IDLE,
  OBSTACLES,
  Q,
  TURN,
  bowMm,
  initialPilotState,
  moorFeel,
  pilotStars,
  rangePercent,
  stepPilot,
  tideAt,
  type PilotInput,
  type PilotState,
} from '../../sim/grok/pilot';
import { NightAudio } from './audio';

// Grok's take on level 1: "Night Arrival", a docking run into a Long Beach
// marina after dark. The renderer reads the deterministic sim in
// src/sim/grok/pilot.ts and adds the look and sound. Randomness here is
// cosmetic only (sparkles and wake), never fed back into the sim.
//
// Interface colors are gold, electric blue, white and purple (DECISIONS.md
// G15). Red and green appear only as real navigation lights.

export const VIEW_W = 1280;
export const VIEW_H = 768;
const PX = VIEW_W / HARBOR.widthMm; // pixels per mm
const GOLD = 0xf4d06f;
const BLUE = 0x4cc9f0;
const PURPLE = 0xb388ff;
const NAV_RED = 0xff3b3b;
const NAV_GREEN = 0x3bff7a;
const BEST_KEY = 'captains-academy-grok-night-arrival-best';

export interface GrokDebugView {
  frame: number;
  outcome: string;
  hearts: number;
  speedMmPerS: number;
  throttle: number;
  battery: number;
}

declare global {
  interface Window {
    __grokNightArrival?: GrokDebugView;
  }
}

interface Spark {
  x: number;
  y: number;
  life: number;
  vx: number;
  vy: number;
  color: number;
}

const sx = (mm: number): number => mm * PX;

export class NightArrivalScene extends Phaser.Scene {
  private state: PilotState = initialPilotState();
  private accumulator = 0;
  private throttle = 0;
  private wheel = 0;
  private thrusterTouch: -1 | 0 | 1 = 0;
  private throwTouch = false;
  private leverPointer: number | null = null;
  private wheelPointer: number | null = null;
  private world!: Phaser.GameObjects.Graphics;
  private fx!: Phaser.GameObjects.Graphics;
  private boat!: Phaser.GameObjects.Graphics;
  private hudG!: Phaser.GameObjects.Graphics;
  private hud!: Phaser.GameObjects.Text;
  private banner!: Phaser.GameObjects.Text;
  private sparks: Spark[] = [];
  private glitter: { x: number; y: number; p: number }[] = [];
  private streakFrames = 0;
  private bestStars = 0;
  private readonly audio = new NightAudio();
  private keys!: Record<string, Phaser.Input.Keyboard.Key>;
  private startedAudio = false;

  constructor() {
    super('night-arrival');
  }

  create(): void {
    try {
      this.bestStars = Number(localStorage.getItem(BEST_KEY) ?? '0') || 0;
    } catch {
      this.bestStars = 0;
    }
    for (let i = 0; i < 160; i++) {
      this.glitter.push({
        x: Math.random() * VIEW_W,
        y: Math.random() * VIEW_H,
        p: Math.random() * 6,
      });
    }
    this.world = this.add.graphics();
    this.fx = this.add.graphics();
    this.boat = this.add.graphics();
    this.hudG = this.add.graphics();
    this.hud = this.add.text(330, 128, '', {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '18px',
      color: '#f4d06f',
      align: 'center',
    });
    this.hud.setOrigin(0.5, 0);
    this.banner = this.add.text(VIEW_W / 2, VIEW_H / 2 - 40, '', {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '34px',
      color: '#ffffff',
      align: 'center',
      stroke: '#06121f',
      strokeThickness: 6,
    });
    this.banner.setOrigin(0.5);
    this.add
      .text(
        VIEW_W / 2,
        VIEW_H - 18,
        "Grok's take · Inland Rules in force · arcade practice: never sea time, never a qualification",
        { fontFamily: 'system-ui, sans-serif', fontSize: '13px', color: '#8fb3c9' },
      )
      .setOrigin(0.5, 1);

    const kb = this.input.keyboard;
    if (kb) {
      this.keys = kb.addKeys('W,S,A,D,Q,E,UP,DOWN,LEFT,RIGHT,SPACE,R,M') as Record<
        string,
        Phaser.Input.Keyboard.Key
      >;
      kb.on('keydown', () => this.wakeAudio());
      kb.on('keydown-W', () => this.nudgeThrottle(25));
      kb.on('keydown-UP', () => this.nudgeThrottle(25));
      kb.on('keydown-S', () => this.nudgeThrottle(-25));
      kb.on('keydown-DOWN', () => this.nudgeThrottle(-25));
      kb.on('keydown-R', () => this.restart());
      kb.on('keydown-M', () => this.audio.setMuted(!this.audio.muted));
    }

    this.input.addPointer(2);
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => this.pointerDown(p));
    this.input.on('pointermove', (p: Phaser.Input.Pointer) => this.pointerMove(p));
    this.input.on('pointerup', (p: Phaser.Input.Pointer) => this.pointerUp(p));
    this.input.on('pointerupoutside', (p: Phaser.Input.Pointer) => this.pointerUp(p));

    this.banner.setText(
      'NIGHT ARRIVAL · Long Beach\nLine up the two white lights, then throw the line',
    );
    this.time.delayedCall(3200, () => {
      if (this.state.outcome === 'playing') this.banner.setText('');
    });
    this.publishDebug();
  }

  private wakeAudio(): void {
    if (this.startedAudio) return;
    this.startedAudio = true;
    this.audio.start();
  }

  private nudgeThrottle(d: number): void {
    this.throttle = Phaser.Math.Clamp(this.throttle + d, -100, 100);
  }

  private restart(): void {
    this.state = initialPilotState();
    this.throttle = 0;
    this.wheel = 0;
    this.accumulator = 0;
    this.streakFrames = 0;
    this.banner.setText('');
  }

  // Touch layout: engine lever under the left thumb, wheel under the right,
  // thruster and line buttons along the bottom middle.
  private zone(p: Phaser.Input.Pointer): 'lever' | 'wheel' | 'port' | 'stbd' | 'line' | 'none' {
    if (p.x < 220) return 'lever';
    if (p.x > VIEW_W - 260) return 'wheel';
    if (p.y > VIEW_H - 150) {
      if (p.x < VIEW_W / 2 - 110) return 'port';
      if (p.x > VIEW_W / 2 + 110) return 'stbd';
      return 'line';
    }
    return 'none';
  }

  private pointerDown(p: Phaser.Input.Pointer): void {
    this.wakeAudio();
    if (this.state.outcome !== 'playing') {
      this.restart();
      return;
    }
    const z = this.zone(p);
    if (z === 'lever') {
      this.leverPointer = p.id;
      this.pointerMove(p);
    } else if (z === 'wheel') {
      this.wheelPointer = p.id;
      this.pointerMove(p);
    } else if (z === 'port') this.thrusterTouch = -1;
    else if (z === 'stbd') this.thrusterTouch = 1;
    else if (z === 'line') this.throwTouch = true;
  }

  private pointerMove(p: Phaser.Input.Pointer): void {
    if (p.id === this.leverPointer) {
      const t = ((VIEW_H / 2 + 40 - p.y) / 200) * 100;
      this.throttle = Math.round(Phaser.Math.Clamp(t, -100, 100) / 5) * 5;
    }
    if (p.id === this.wheelPointer) {
      const w = ((p.x - (VIEW_W - 130)) / 110) * 100;
      this.wheel = Math.round(Phaser.Math.Clamp(w, -100, 100));
    }
  }

  private pointerUp(p: Phaser.Input.Pointer): void {
    if (p.id === this.leverPointer) this.leverPointer = null; // the lever stays where it is left
    if (p.id === this.wheelPointer) {
      this.wheelPointer = null;
      this.wheel = 0; // the wheel springs back to midships
    }
    this.thrusterTouch = 0;
    this.throwTouch = false;
  }

  private readInput(): PilotInput {
    if (!this.keys) return { ...IDLE, throttle: this.throttle, rudder: this.wheel };
    const k = this.keys;
    const down = (name: string): boolean => k[name]?.isDown === true;
    let rudder = this.wheel;
    if (this.wheelPointer === null) {
      rudder = 0;
      if (down('A') || down('LEFT')) rudder -= 100;
      if (down('D') || down('RIGHT')) rudder += 100;
    }
    let thruster: -1 | 0 | 1 = this.thrusterTouch;
    if (down('Q')) thruster = -1;
    if (down('E')) thruster = 1;
    return {
      throttle: this.throttle,
      rudder,
      thruster,
      throwLine: down('SPACE') || this.throwTouch,
    };
  }

  override update(_time: number, delta: number): void {
    this.accumulator += Math.min(delta, 250);
    const stepMs = 1000 / FPS;
    while (this.accumulator >= stepMs) {
      this.accumulator -= stepMs;
      const input = this.readInput();
      const before = this.state;
      this.state = stepPilot(this.state, input);
      this.react(before, this.state, input);
    }
    this.draw();
    this.publishDebug();
  }

  private react(before: PilotState, s: PilotState, input: PilotInput): void {
    const onRange = s.onRangeFrames > before.onRangeFrames;
    this.streakFrames = onRange ? this.streakFrames + 1 : 0;
    this.audio.engineAt(s.outcome === 'playing' ? input.throttle : 0);
    this.audio.music(this.streakFrames / FPS);
    if (s.frame % (5 * FPS) === 0) this.audio.bell();

    // Bioluminescent wake.
    if (s.outcome === 'playing' && Math.abs(s.speed) > 200) {
      const h = (s.heading / TURN) * Math.PI * 2;
      const cx = sx(s.x / Q) - Math.sin(h) * 48;
      const cy = sx(s.y / Q) + Math.cos(h) * 48;
      this.sparks.push({
        x: cx + (Math.random() - 0.5) * 14,
        y: cy + (Math.random() - 0.5) * 14,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        life: 1,
        color: BLUE,
      });
    }

    const cam = this.cameras.main;
    switch (s.event) {
      case 'bump':
        cam.shake(260, 0.012);
        cam.flash(180, 179, 136, 255);
        this.audio.bump();
        break;
      case 'line-short':
      case 'line-fast': {
        cam.flash(140, 255, 255, 255);
        this.audio.splash();
        const b = bowMm(s);
        this.burst(sx(b.x), sx(b.y) - 30, 0xffffff, 18);
        this.banner.setText(
          s.event === 'line-fast' ? 'Too fast: the line jerked free' : 'Line fell short: splash!',
        );
        this.time.delayedCall(1300, () => {
          if (this.state.outcome === 'playing') this.banner.setText('');
        });
        break;
      }
      case 'moored':
        this.moored();
        break;
      default:
        break;
    }
    if (s.outcome === 'out-of-hearts' && before.outcome === 'playing') {
      cam.shake(400, 0.02);
      this.banner.setText('Out of hearts.\nTap or press R to try the approach again.');
    }
  }

  private moored(): void {
    const s = this.state;
    const stars = pilotStars(s);
    if (stars > this.bestStars) {
      this.bestStars = stars;
      try {
        localStorage.setItem(BEST_KEY, String(stars));
      } catch {
        // Storage blocked: the run still counts on screen.
      }
    }
    this.cameras.main.flash(300, 244, 208, 111);
    this.audio.moored();
    this.burst(sx(HARBOR.cleat.x), sx(HARBOR.cleat.y), GOLD, 40);
    this.burst(sx(HARBOR.cleat.x), sx(HARBOR.cleat.y), BLUE, 40);
    const feel = moorFeel(s) === 'kiss' ? 'A kiss landing!' : 'Made fast, a little firm.';
    this.banner.setText(
      `MADE FAST  ${'★'.repeat(stars)}${'☆'.repeat(3 - stars)}\n${feel}  ${(s.frame / FPS).toFixed(1)} s · on the lights ${rangePercent(s)}%\nTap or press R to run it again`,
    );
  }

  private burst(x: number, y: number, color: number, n: number): void {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const v = 1 + Math.random() * 3;
      this.sparks.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 1, color });
    }
  }

  private draw(): void {
    const g = this.world;
    const t = this.time.now / 1000;
    const s = this.state;
    g.clear();
    g.fillGradientStyle(0x020814, 0x020814, 0x0a2a44, 0x0a2a44, 1);
    g.fillRect(0, 0, VIEW_W, VIEW_H);

    // Moonlight glitter, brighter toward the moon on the east.
    for (const d of this.glitter) {
      const a = 0.15 + 0.35 * Math.max(0, Math.sin(t * 1.7 + d.p)) * (d.x / VIEW_W);
      g.fillStyle(0xcfe8ff, a);
      g.fillRect(d.x, d.y, 3, 1);
    }

    // Tidal set streaks outside the breakwater.
    const set = tideAt(s.frame, HARBOR.shelterY * Q + Q);
    g.lineStyle(1, BLUE, 0.25);
    for (let i = 0; i < 14; i++) {
      const y = sx(HARBOR.shelterY) + 50 + (i % 5) * 42;
      const x = (((i * 197 + s.frame * set * 0.002) % VIEW_W) + VIEW_W) % VIEW_W;
      g.lineBetween(x, y, x + Math.sign(set) * 26, y);
    }

    for (const r of OBSTACLES) {
      const x = sx(r.x0);
      const y = sx(r.y0);
      const w = sx(r.x1 - r.x0);
      const h = sx(r.y1 - r.y0);
      if (r.kind === 'breakwater') {
        g.fillStyle(0x3a4250, 1);
        g.fillRect(x, y, w, h);
        g.fillStyle(0x56606f, 1);
        for (let i = 0; i < w; i += 18)
          g.fillCircle(x + i + 9, y + h / 2 + ((i / 18) % 2) * 4 - 2, 9);
      } else if (r.kind === 'moored') {
        g.fillStyle(0x0d1b2a, 1);
        g.fillRect(x, y, w, h);
        g.fillStyle(0xe8eef5, 1);
        g.fillRoundedRect(x + 8, y + 10, w - 16, h - 20, 16);
        g.fillStyle(0xffe9a8, 0.9);
        for (let i = x + 30; i < x + w - 24; i += 22) g.fillRect(i, y + h / 2 - 3, 10, 6);
      } else {
        g.fillStyle(r.kind === 'pier' ? 0x5b4636 : 0x6d5642, 1);
        g.fillRect(x, y, w, h);
        g.lineStyle(1, 0x3b2d22, 1);
        for (let i = y + 6; i < y + h; i += 8) g.lineBetween(x, i, x + w, i);
      }
    }

    // Long Beach skyline lights along the pier, and the Lions Lighthouse sweep.
    for (let i = 0; i < 40; i++) {
      const on = Math.sin(i * 12.9898) > -0.2;
      if (!on) continue;
      g.fillStyle(0xffe9a8, 0.5 + 0.3 * Math.sin(t * 0.6 + i));
      g.fillRect(12 + i * 31, 18 + ((i * 7) % 20), 4, 4);
    }
    const lhX = sx(118_000);
    const lhY = sx(3_500);
    const beam = t * 1.3;
    g.fillStyle(0xfff4d0, 0.07);
    g.slice(lhX, lhY, 520, beam - 0.12, beam + 0.12, false);
    g.fillPath();
    g.fillStyle(0xfff4d0, 1);
    g.fillCircle(lhX, lhY, 6);

    // Entrance lights: green to port and red to starboard coming in.
    const blink = Math.floor(t * 1.25) % 2 === 0;
    this.navLight(g, sx(50_000), sx(51_700), NAV_GREEN, blink);
    this.navLight(g, sx(78_000), sx(51_700), NAV_RED, !blink);

    // Leading lights behind the slip.
    this.navLight(g, sx(HARBOR.rangeX), sx(HARBOR.rangeFrontY), 0xffffff, true);
    this.navLight(
      g,
      sx(HARBOR.rangeX),
      sx(HARBOR.rangeRearY) + 4,
      0xffffff,
      Math.floor(t * 2) % 2 === 0,
    );

    // The cleat target glows when the bow is within reach.
    const bow = bowMm(s);
    const d = Math.hypot(bow.x - HARBOR.cleat.x, bow.y - HARBOR.cleat.y);
    const inReach = d <= HARBOR.lineReachMm;
    const pulse = 0.5 + 0.5 * Math.sin(t * 6);
    g.lineStyle(3, inReach ? GOLD : BLUE, inReach ? 0.6 + 0.4 * pulse : 0.35);
    g.strokeCircle(sx(HARBOR.cleat.x), sx(HARBOR.cleat.y), sx(HARBOR.lineReachMm));
    g.fillStyle(GOLD, 1);
    g.fillRect(sx(HARBOR.cleat.x) - 6, sx(HARBOR.cleat.y) - 3, 12, 6);

    // Sparks: wake and bursts.
    const f = this.fx;
    f.clear();
    this.sparks = this.sparks.filter((p) => p.life > 0);
    for (const p of this.sparks) {
      p.x += p.vx;
      p.y += p.vy;
      p.vx *= 0.96;
      p.vy *= 0.96;
      p.life -= p.color === BLUE && p.vx * p.vx < 0.1 ? 0.012 : 0.02;
      f.fillStyle(p.color, Math.max(0, p.life));
      f.fillCircle(p.x, p.y, 2 + p.life * 2);
    }

    this.drawBoat();
    this.drawHud(inReach);
  }

  private navLight(
    g: Phaser.GameObjects.Graphics,
    x: number,
    y: number,
    color: number,
    on: boolean,
  ): void {
    g.fillStyle(color, on ? 0.25 : 0.06);
    g.fillCircle(x, y, 14);
    g.fillStyle(color, on ? 1 : 0.3);
    g.fillCircle(x, y, 4);
  }

  private drawBoat(): void {
    const s = this.state;
    const b = this.boat;
    b.clear();
    b.setPosition(sx(s.x / Q), sx(s.y / Q));
    b.setRotation((s.heading / TURN) * Math.PI * 2);
    const L = sx(HARBOR.boat.lengthMm);
    const W = sx(HARBOR.boat.beamMm);
    b.fillStyle(0xf5f7fa, 1);
    b.beginPath();
    b.moveTo(0, -L / 2);
    b.lineTo(W / 2, -L / 6);
    b.lineTo(W / 2, L / 2);
    b.lineTo(-W / 2, L / 2);
    b.lineTo(-W / 2, -L / 6);
    b.closePath();
    b.fillPath();
    b.fillStyle(0x1b3a57, 1);
    b.fillRect(-W / 3, -L / 10, (2 * W) / 3, L / 4);
    // Real navigation lights: red to port, green to starboard, white masthead.
    b.fillStyle(NAV_RED, 1);
    b.fillCircle(-W / 2, -L / 8, 3);
    b.fillStyle(NAV_GREEN, 1);
    b.fillCircle(W / 2, -L / 8, 3);
    b.fillStyle(0xffffff, 1);
    b.fillCircle(0, -L / 12, 2.5);
    if (s.outcome === 'moored') {
      b.lineStyle(2, GOLD, 1);
      b.lineBetween(0, -L / 2, 0, -L / 2 - 20);
    }
  }

  private drawHud(inReach: boolean): void {
    const s = this.state;
    const h = this.hudG;
    h.clear();
    // Hearts.
    for (let i = 0; i < HARBOR.hearts; i++) {
      h.fillStyle(i < s.hearts ? GOLD : 0x334455, 1);
      h.fillTriangle(30 + i * 34, 96, 52 + i * 34, 96, 41 + i * 34, 116);
      h.fillCircle(36 + i * 34, 96, 6);
      h.fillCircle(47 + i * 34, 96, 6);
    }

    // Range gauge: the front light slides off the rear one as the boat leaves the line.
    const off = s.x / Q - HARBOR.rangeX;
    const gx = 330;
    const gy = 104;
    h.fillStyle(0x06121f, 0.7);
    h.fillRoundedRect(gx - 120, gy - 18, 240, 36, 10);
    const onLine = Math.abs(off) <= HARBOR.rangeHalfWidthMm;
    h.fillStyle(0xffffff, 1);
    h.fillCircle(gx, gy - 6, 5);
    h.fillStyle(onLine ? GOLD : PURPLE, 1);
    h.fillCircle(gx + Phaser.Math.Clamp(-off / 60, -110, 110), gy + 7, 5);

    // Engine lever (left thumb) and wheel (right thumb).
    const lx = 110;
    const ly = VIEW_H / 2 + 40;
    h.lineStyle(4, 0x8fb3c9, 0.6);
    h.lineBetween(lx, ly - 200, lx, ly + 200);
    h.fillStyle(this.throttle >= 0 ? GOLD : BLUE, 1);
    h.fillRoundedRect(lx - 34, ly - (this.throttle / 100) * 200 - 14, 68, 28, 8);
    const wx = VIEW_W - 130;
    const wy = VIEW_H / 2 + 40;
    h.lineStyle(4, 0x8fb3c9, 0.6);
    h.strokeCircle(wx, wy, 70);
    const rud = this.readInput().rudder;
    const a = -Math.PI / 2 + (rud / 100) * 1.2;
    h.lineStyle(6, GOLD, 1);
    h.lineBetween(wx, wy, wx + Math.cos(a) * 70, wy + Math.sin(a) * 70);

    // Bottom buttons: bow thruster to port, throw line, bow thruster to starboard.
    const by = VIEW_H - 92;
    h.fillStyle(0x06121f, 0.75);
    h.fillRoundedRect(VIEW_W / 2 - 330, by - 34, 200, 68, 14);
    h.fillRoundedRect(VIEW_W / 2 + 130, by - 34, 200, 68, 14);
    h.fillStyle(inReach ? GOLD : 0x2a4258, 1);
    h.fillRoundedRect(VIEW_W / 2 - 100, by - 40, 200, 80, 18);
    // Thruster battery.
    const frac = s.battery / HARBOR.batteryFrames;
    h.fillStyle(BLUE, 1);
    h.fillRect(VIEW_W / 2 - 320, by + 22, 180 * frac, 6);
    h.fillRect(VIEW_W / 2 + 140, by + 22, 180 * frac, 6);

    const mmps = Math.round((Math.abs(s.speed) * FPS) / Q);
    const knots = (mmps / 514.4).toFixed(1);
    this.hud.setText(
      `${knots} kn   ·   ${onLine ? 'LIGHTS IN LINE' : 'off the line'}   ·   ${(s.frame / FPS).toFixed(0)} s   ·   best ${'★'.repeat(this.bestStars) || '-'}`.replaceAll(
        '   ·   ',
        '  ·  ',
      ),
    );
    if (!this.labels) {
      const style = { fontFamily: 'system-ui, sans-serif', fontSize: '18px', color: '#ffffff' };
      this.labels = [
        this.add.text(VIEW_W / 2 - 230, by - 6, '◀ BOW (Q)', style).setOrigin(0.5),
        this.add.text(VIEW_W / 2 + 230, by - 6, 'BOW (E) ▶', style).setOrigin(0.5),
        this.add
          .text(VIEW_W / 2, by, 'THROW LINE\n(space)', { ...style, align: 'center' })
          .setOrigin(0.5),
        this.add
          .text(110, VIEW_H / 2 - 190, 'AHEAD\nW', { ...style, align: 'center', fontSize: '14px' })
          .setOrigin(0.5, 1),
        this.add
          .text(110, VIEW_H / 2 + 270, 'ASTERN\nS', { ...style, align: 'center', fontSize: '14px' })
          .setOrigin(0.5, 0),
        this.add
          .text(VIEW_W - 130, VIEW_H / 2 + 130, 'WHEEL  A / D', { ...style, fontSize: '14px' })
          .setOrigin(0.5, 0),
      ];
      this.children.bringToTop(this.banner);
    }
  }

  private labels: Phaser.GameObjects.Text[] | null = null;

  private publishDebug(): void {
    const s = this.state;
    window.__grokNightArrival = {
      frame: s.frame,
      outcome: s.outcome,
      hearts: s.hearts,
      speedMmPerS: Math.round((Math.abs(s.speed) * FPS) / Q),
      throttle: this.throttle,
      battery: s.battery,
    };
  }
}
