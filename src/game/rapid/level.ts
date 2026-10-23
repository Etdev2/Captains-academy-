import {
  CATEGORIES,
  DEFINITIONS,
  LEVEL_ID,
  LEVEL_RULE_SET,
  PAR_MS,
  QUESTION,
  cardById,
  categoryLabel,
  type DefinitionCard,
  type RuleSet,
} from '../../sim/chapter1/definitions';
import {
  HEARTS,
  RETURN_AFTER,
  answer,
  currentCard,
  progress,
  runStars,
  startRun,
  type RapidRun,
  type RunStars,
} from '../../sim/rapid';
import type { Sound } from '../sound';
import { loadStars, recordAnswer, saveStars } from '../storage';
import type { VesselView } from './VesselView';

// The Definitions level's page controller (docs/design/definitions-spec.md).
// It only reads run state from src/sim/rapid.ts; scoring, combo, hearts and
// stars are decided there. This file owns timing, the DOM and the sound.

/** A right answer stays on screen this long before the next card (spec, motion). */
export const RIGHT_HOLD_MS = 380;
/** The miss replay's countdown (G11). */
export const REPLAY_MS = 5000;
/** The earliest a tap can end the replay. */
export const REPLAY_SKIP_MS = 800;
/** The deciding detail pulses on the drawing this long before the panel covers it. */
export const HIGHLIGHT_MS = 600;

type Phase = 'question' | 'right' | 'highlight' | 'replay' | 'done';

export interface QuizDebug {
  level: string;
  phase: Phase;
  card: string | null;
  hearts: number;
  combo: number;
  score: number;
  misses: number;
  answered: number;
  remaining: number;
  outcome: string;
  stars: number;
  paused: boolean;
  elapsedMs: number;
  seed: number;
}

declare global {
  interface Window {
    __captainsAcademyQuiz?: QuizDebug;
  }
}

const SVG_NS = 'http://www.w3.org/2000/svg';
const HULL_PATH = 'M3 4h22l-4 12H7z';
const STAR_PATH =
  'M24 4l5.9 12.6 13.8 1.6-10.2 9.4 2.8 13.6L24 34.4 11.7 41.2l2.8-13.6L4.3 18.2l13.8-1.6z';
const CHECK =
  '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" fill="none"/><path d="M7 12.5l3.2 3.2L17 9" stroke="currentColor" stroke-width="2.4" fill="none"/></svg>';
const CROSS =
  '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" fill="none"/><path d="M8 8l8 8M16 8l-8 8" stroke="currentColor" stroke-width="2.4"/></svg>';

const RULE_SET_TEXT: Record<RuleSet, { text: string; name: string }> = {
  both: { text: 'Inland + International', name: 'Rule set: Inland and International' },
  international: { text: 'International only', name: 'Rule set: International only' },
};

const $ = <T extends HTMLElement = HTMLElement>(id: string): T => {
  const el = document.getElementById(id);
  if (!el) throw new Error(`#${id} is missing from rules/index.html`);
  return el as T;
};

function icon(path: string, cls: string, viewBox: string): SVGSVGElement {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('viewBox', viewBox);
  svg.setAttribute('class', cls);
  svg.setAttribute('aria-hidden', 'true');
  const p = document.createElementNS(SVG_NS, 'path');
  p.setAttribute('d', path);
  p.setAttribute('class', 'fill');
  svg.append(p);
  return svg;
}

export interface LevelOptions {
  readonly seed: number;
  readonly sound: Sound;
  readonly vessel: VesselView;
  readonly reducedMotion: () => boolean;
  readonly now: () => number;
  readonly home: () => void;
}

export class DefinitionsLevel {
  private run: RapidRun;
  private seed: number;
  private phase: Phase = 'question';
  private elapsedMs = 0;
  private questionStartedAt: number | null = null;
  private stars: RunStars = 0;
  private timers: number[] = [];
  private replayLeftMs = REPLAY_MS;
  private replayResumedAt = 0;
  private replayFrame = 0;
  private replayShownAt = 0;
  private paused = false;
  private menuOpen = false;
  private readonly buttons: HTMLButtonElement[] = [];
  private readonly deckIds = DEFINITIONS.map((c) => c.id);

  constructor(private readonly opts: LevelOptions) {
    this.seed = opts.seed >>> 0;
    this.run = startRun(this.deckIds, this.seed);
    this.build();
    this.bind();
    this.showCard(false);
  }

  // ---- setup

  private build(): void {
    $('question').textContent = QUESTION;
    const n = CATEGORIES.length;
    $('keys-hint').textContent =
      `Keys 1 to ${n} answer. Enter goes to the next card. Esc opens the menu.`;
    const grid = $('answers');
    CATEGORIES.forEach((cat, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'answer';
      // An odd last button spans the row, so a three-line label stays on one line or two.
      if (n % 2 === 1 && i === n - 1) b.classList.add('wide');
      b.dataset.answer = String(i + 1);
      b.dataset.category = cat.id;
      b.dataset.state = 'idle';
      b.innerHTML = `<span class="mark"></span><span class="label"></span><span class="sub"></span>`;
      (b.querySelector('.label') as HTMLElement).textContent = cat.label;
      b.addEventListener('click', () => this.choose(i));
      grid.append(b);
      this.buttons.push(b);
    });
    const hearts = $('heart-icons');
    for (let i = 0; i < HEARTS; i++) hearts.append(icon(HULL_PATH, 'heart', '0 0 28 20'));
  }

  private bind(): void {
    const unlock = (): void => this.opts.sound.unlock();
    window.addEventListener('pointerdown', unlock, { passive: true });
    window.addEventListener('keydown', unlock);
    window.addEventListener('keydown', (e) => this.onKey(e));

    $('next-btn').addEventListener('click', () => this.skipReplay());
    $('pause-btn').addEventListener('click', () => this.togglePause());
    $('panel').addEventListener('click', (e) => {
      if ((e.target as HTMLElement).closest('button')) return;
      this.skipReplay();
    });

    $('menu-btn').addEventListener('click', () => this.openMenu());
    $('close-btn').addEventListener('click', () => this.closeMenu());
    $('menu').addEventListener('click', (e) => {
      if (e.target === e.currentTarget) this.closeMenu();
    });
    $('sound-btn').addEventListener('click', () => {
      this.opts.sound.toggleMute();
      this.renderSoundButton();
    });
    $('restart-btn').addEventListener('click', () => {
      this.closeMenu(false);
      this.restart();
    });
    $('menu-home-btn').addEventListener('click', () => this.opts.home());
    $('again-btn').addEventListener('click', () => this.restart());
    $('home-btn').addEventListener('click', () => this.opts.home());
    this.renderSoundButton();
  }

  private onKey(e: KeyboardEvent): void {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    if (this.menuOpen) {
      if (e.key === 'Escape') {
        e.preventDefault();
        this.closeMenu();
      }
      return;
    }
    if (this.phase === 'done') return;
    if (e.key === 'Escape') {
      e.preventDefault();
      this.openMenu();
      return;
    }
    const digit = Number(e.key);
    if (Number.isInteger(digit) && digit >= 1 && digit <= CATEGORIES.length) {
      e.preventDefault();
      this.choose(digit - 1);
      return;
    }
    if (e.key === 'Enter' && this.phase === 'replay') {
      // Enter on a focused button presses that button instead.
      if ((e.target as HTMLElement | null)?.closest?.('button')) return;
      e.preventDefault();
      this.skipReplay();
    }
  }

  // ---- the card on screen

  private card(): DefinitionCard {
    const id = currentCard(this.run);
    const card = id === undefined ? undefined : cardById(id);
    if (!card) throw new Error(`no card for ${String(id)}`);
    return card;
  }

  private showCard(animate: boolean): void {
    const card = this.card();
    this.phase = 'question';
    this.opts.vessel.show(card.art);
    $('cue').textContent = card.cue;
    $('again').hidden = !this.run.missed.includes(card.id);
    const chip = RULE_SET_TEXT[LEVEL_RULE_SET];
    $('chip').textContent = chip.text;
    $('chip').setAttribute('aria-label', chip.name);
    for (const b of this.buttons) this.setButton(b, 'idle');
    const cardEl = $('card');
    cardEl.classList.remove('flash', 'shake', 'missed', 'card-in');
    if (animate && !this.opts.reducedMotion()) {
      void cardEl.offsetWidth;
      cardEl.classList.add('card-in');
    }
    this.renderStatus();
    if (!this.menuOpen) {
      this.questionStartedAt = this.opts.now();
      // Focus follows the player from card to card, but a fresh page leaves it alone.
      if (animate) this.buttons[0]?.focus({ preventScroll: true });
    }
    this.publish();
  }

  private setButton(
    b: HTMLButtonElement,
    state: 'idle' | 'correct' | 'answer' | 'wrong' | 'disabled',
  ): void {
    b.dataset.state = state;
    const mark = b.querySelector('.mark') as HTMLElement;
    const sub = b.querySelector('.sub') as HTMLElement;
    const label = (b.querySelector('.label') as HTMLElement).textContent ?? '';
    if (state === 'correct' || state === 'answer') mark.innerHTML = CHECK;
    else if (state === 'wrong') mark.innerHTML = CROSS;
    else mark.textContent = b.dataset.answer ?? '';
    sub.textContent =
      state === 'correct'
        ? 'Right'
        : state === 'answer'
          ? 'Answer'
          : state === 'wrong'
            ? 'Your pick'
            : '';
    b.setAttribute('aria-disabled', state === 'idle' ? 'false' : 'true');
    b.setAttribute('aria-label', sub.textContent ? `${label}, ${sub.textContent}` : label);
  }

  private renderStatus(): void {
    const { hearts, combo } = this.run;
    const icons = $('heart-icons').children;
    for (let i = 0; i < icons.length; i++) icons[i]?.classList.toggle('lost', i >= hearts);
    $('hearts-label').textContent = `${hearts} left`;
    $('hearts').setAttribute('aria-label', `${hearts} of ${HEARTS} hearts left`);
    const comboEl = $('combo');
    comboEl.textContent = combo >= 5 ? '×5 combo, max' : combo >= 2 ? `×${combo} combo` : '';
    const { position, total } = progress(this.run, this.deckIds.length);
    $('progress-text').textContent = `${position} of ${total}`;
    const bar = $('progress');
    bar.setAttribute('aria-valuenow', String(position));
    bar.setAttribute('aria-valuemax', String(total));
    bar.setAttribute('aria-valuetext', `${position} of ${total}`);
    $('progress-fill').style.width = `${Math.round((position / total) * 100)}%`;
  }

  // ---- answering

  private choose(index: number): void {
    if (this.phase !== 'question' || this.menuOpen) return;
    const picked = this.buttons[index];
    const category = CATEGORIES[index];
    if (!picked || !category) return;
    this.stopQuestionClock();
    const card = this.card();
    const correct = category.id === card.answer;
    recordAnswer(card.id, correct);
    const before = this.run;
    const result = answer(this.run, correct);
    this.run = result.run;
    if (correct) this.onRight(picked, result.points);
    else this.onWrong(picked, card, before.hearts);
  }

  private onRight(picked: HTMLButtonElement, points: number): void {
    this.phase = 'right';
    this.setButton(picked, 'correct');
    for (const b of this.buttons) if (b !== picked) this.setButton(b, 'disabled');
    const cardEl = $('card');
    cardEl.classList.remove('flash');
    void cardEl.offsetWidth;
    cardEl.classList.add('flash');
    const pts = $('points');
    pts.textContent = `+${points}`;
    pts.classList.remove('show');
    void pts.offsetWidth;
    pts.classList.add('show');
    const comboEl = $('combo');
    comboEl.classList.add('step');
    this.later(() => comboEl.classList.remove('step'), 100);
    this.renderStatus();
    this.opts.sound.rightAnswer(this.run.combo);
    const label = (picked.querySelector('.label') as HTMLElement).textContent ?? '';
    this.say('polite', `Right. ${label}. Plus ${points}.`);
    this.publish();
    this.later(() => {
      pts.classList.remove('show');
      this.advance();
    }, RIGHT_HOLD_MS);
  }

  private onWrong(picked: HTMLButtonElement, card: DefinitionCard, heartsBefore: number): void {
    this.phase = 'highlight';
    const reduced = this.opts.reducedMotion();
    for (const b of this.buttons) {
      if (b === picked) this.setButton(b, 'wrong');
      else if (b.dataset.category === card.answer) this.setButton(b, 'answer');
      else this.setButton(b, 'disabled');
    }
    const cardEl = $('card');
    cardEl.classList.add('missed');
    if (!reduced) {
      void cardEl.offsetWidth;
      cardEl.classList.add('shake');
    }
    const lost = $('heart-icons').children[heartsBefore - 1];
    this.renderStatus();
    lost?.classList.remove('just-lost');
    if (lost && !reduced) {
      void (lost as HTMLElement).getBoundingClientRect();
      lost.classList.add('just-lost');
    }
    this.opts.sound.bump(false);
    this.opts.vessel.highlight(card.art, reduced);

    const answerLine = `She is ${categoryLabel(card.answer).toLowerCase()}.`;
    const back =
      this.run.outcome === 'out-of-hearts'
        ? 'That was your last heart.'
        : `This one comes back in ${Math.min(RETURN_AFTER, this.run.queue.length - 1)} cards.`;
    $('panel-cue').textContent = card.cue;
    $('panel-answer').textContent = answerLine;
    $('panel-why').textContent = card.why;
    $('panel-citation').textContent = card.citation;
    $('panel-back').textContent = back;
    // The whole explanation goes to the screen reader at once, so it is heard in full
    // even if the replay ends; Pause keeps it on screen (issue #62).
    this.say('assertive', `Not quite. ${answerLine} ${card.why} ${card.citation}. ${back}`);
    this.publish();
    this.later(() => this.showPanel(), HIGHLIGHT_MS);
  }

  private showPanel(): void {
    this.phase = 'replay';
    this.paused = false;
    this.replayLeftMs = REPLAY_MS;
    this.replayShownAt = this.opts.now();
    $('panel').hidden = false;
    const pause = $('pause-btn');
    pause.textContent = 'Pause';
    pause.setAttribute('aria-pressed', 'false');
    const next = $('next-btn');
    next.setAttribute('aria-disabled', 'true');
    this.later(() => next.setAttribute('aria-disabled', 'false'), REPLAY_SKIP_MS);
    next.focus({ preventScroll: true });
    if (this.menuOpen) this.paused = true;
    this.resumeCountdown();
    this.publish();
  }

  private resumeCountdown(): void {
    if (this.phase !== 'replay' || this.paused) {
      this.renderCountdown();
      return;
    }
    this.replayResumedAt = this.opts.now();
    const tick = (): void => {
      if (this.phase !== 'replay' || this.paused) return;
      const left = this.replayLeftMs - (this.opts.now() - this.replayResumedAt);
      this.renderCountdown(left);
      if (left <= 0) {
        this.advance();
        return;
      }
      this.replayFrame = window.requestAnimationFrame(tick);
    };
    tick();
  }

  private holdCountdown(): void {
    if (this.phase !== 'replay') return;
    window.cancelAnimationFrame(this.replayFrame);
    if (!this.paused) this.replayLeftMs -= this.opts.now() - this.replayResumedAt;
  }

  private renderCountdown(left = this.replayLeftMs): void {
    const ms = Math.max(0, left);
    const reduced = this.opts.reducedMotion();
    $('countdown').hidden = reduced;
    const text = $('countdown-text');
    text.hidden = !reduced && !this.paused;
    text.textContent = this.paused
      ? 'Paused. Press Next when you are ready.'
      : `Next card in ${Math.ceil(ms / 1000)} s`;
    ($('countdown-fill') as HTMLElement).style.width = `${(ms / REPLAY_MS) * 100}%`;
  }

  private togglePause(): void {
    if (this.phase !== 'replay') return;
    if (this.paused) {
      this.paused = false;
      this.resumeCountdown();
    } else {
      this.holdCountdown();
      this.paused = true;
      this.renderCountdown();
    }
    const pause = $('pause-btn');
    pause.textContent = this.paused ? 'Resume' : 'Pause';
    pause.setAttribute('aria-pressed', String(this.paused));
    this.publish();
  }

  private skipReplay(): void {
    if (this.phase !== 'replay') return;
    if (this.opts.now() - this.replayShownAt < REPLAY_SKIP_MS) return;
    this.advance();
  }

  private advance(): void {
    this.clearTimers();
    window.cancelAnimationFrame(this.replayFrame);
    this.paused = false;
    $('panel').hidden = true;
    this.opts.vessel.clearHighlight();
    if (this.run.outcome !== 'playing') {
      this.end();
      return;
    }
    this.showCard(true);
  }

  // ---- the end

  private end(): void {
    this.phase = 'done';
    const cleared = this.run.outcome === 'cleared';
    this.stars = runStars(this.run, this.elapsedMs, PAR_MS);
    if (cleared) {
      saveStars(LEVEL_ID, this.stars);
      this.opts.sound.chime();
    }
    const title = $('end-title');
    title.className = `end-title ${cleared ? 'cleared' : 'out'}`;
    title.textContent = '';
    if (!cleared) title.append(icon(HULL_PATH, 'heart lost', '0 0 28 20'));
    title.append(cleared ? 'Level cleared' : 'Out of hearts');

    const starsEl = $('stars');
    starsEl.replaceChildren();
    $('stars').hidden = !cleared;
    $('stars-text').hidden = !cleared;
    if (cleared) {
      for (let i = 0; i < 3; i++) {
        starsEl.append(icon(STAR_PATH, i < this.stars ? 'star' : 'star empty', '0 0 48 48'));
      }
      $('stars-text').textContent = `${this.stars} of 3 stars`;
    }
    const total = this.deckIds.length;
    const clearedCards = total - this.run.queue.length;
    const sub = $('end-sub');
    sub.hidden = cleared;
    sub.textContent = cleared ? '' : `You cleared ${clearedCards} of ${total}.`;
    const nextStar = $('next-star');
    const nextLine =
      !cleared || this.stars === 3
        ? ''
        : this.stars === 2
          ? `No misses inside ${PAR_MS / 1000} seconds earns 3 stars.`
          : 'One miss or fewer earns 2 stars.';
    nextStar.hidden = nextLine === '';
    nextStar.textContent = nextLine;

    const stats: [string, string][] = [
      ['Score', String(this.run.score)],
      ['Best combo', String(this.run.bestCombo)],
      ['Misses', String(this.run.misses)],
      ['Time', `${Math.round(this.elapsedMs / 1000)} s`],
    ];
    if (cleared) stats.push(['Best on this device', `${loadStars(LEVEL_ID)} of 3 stars`]);
    $('stats').replaceChildren(
      ...stats.flatMap(([k, v]) => {
        const dt = document.createElement('dt');
        dt.textContent = k;
        const dd = document.createElement('dd');
        dd.textContent = v;
        return [dt, dd];
      }),
    );

    const list = $('review-list');
    list.replaceChildren(
      ...this.run.missed.map((id) => {
        const c = cardById(id);
        const li = document.createElement('li');
        li.textContent = c?.cue ?? id;
        const a = document.createElement('span');
        a.className = 'r-answer';
        a.textContent = c ? `${categoryLabel(c.answer)} · ${c.citation}` : '';
        li.append(a);
        return li;
      }),
    );
    $('review').hidden = this.run.missed.length === 0;
    $('again-btn').textContent = cleared ? 'Play again' : 'Try again';

    $('level').setAttribute('aria-hidden', 'true');
    $('level').inert = true;
    $('end').hidden = false;
    title.focus();
    this.say(
      'polite',
      cleared
        ? `Level cleared. ${this.stars} of 3 stars.`
        : `Out of hearts. You cleared ${clearedCards} of ${total}.`,
    );
    this.publish();
  }

  private restart(): void {
    this.clearTimers();
    window.cancelAnimationFrame(this.replayFrame);
    this.seed = (Math.imul(this.seed, 1664525) + 1013904223) >>> 0;
    this.run = startRun(this.deckIds, this.seed);
    this.elapsedMs = 0;
    this.stars = 0;
    this.paused = false;
    $('end').hidden = true;
    $('panel').hidden = true;
    $('level').removeAttribute('aria-hidden');
    $('level').inert = false;
    this.opts.vessel.clearHighlight();
    this.showCard(true);
  }

  // ---- menu

  private openMenu(): void {
    if (this.menuOpen || this.phase === 'done') return;
    this.menuOpen = true;
    this.stopQuestionClock();
    this.holdCountdown();
    if (this.phase === 'replay') this.paused = true;
    $('menu').hidden = false;
    $('level').inert = true;
    $('sound-btn').focus();
    this.publish();
  }

  private closeMenu(resume = true): void {
    if (!this.menuOpen) return;
    this.menuOpen = false;
    $('menu').hidden = true;
    $('level').inert = false;
    $('menu-btn').focus();
    if (!resume) return;
    if (this.phase === 'question') this.questionStartedAt = this.opts.now();
    if (this.phase === 'replay' && $('pause-btn').getAttribute('aria-pressed') !== 'true') {
      this.paused = false;
      this.resumeCountdown();
    }
    this.publish();
  }

  private renderSoundButton(): void {
    const on = !this.opts.sound.muted;
    const b = $('sound-btn');
    b.textContent = `Sound: ${on ? 'on' : 'off'}`;
    b.setAttribute('aria-pressed', String(on));
  }

  // ---- helpers

  private stopQuestionClock(): void {
    if (this.questionStartedAt === null) return;
    this.elapsedMs += Math.max(0, Math.round(this.opts.now() - this.questionStartedAt));
    this.questionStartedAt = null;
  }

  private later(fn: () => void, ms: number): void {
    this.timers.push(window.setTimeout(fn, ms));
  }

  private clearTimers(): void {
    for (const t of this.timers) window.clearTimeout(t);
    this.timers = [];
  }

  private say(where: 'polite' | 'assertive', text: string): void {
    const el = $(where === 'polite' ? 'live-polite' : 'live-assertive');
    el.textContent = '';
    window.setTimeout(() => {
      el.textContent = text;
    }, 30);
  }

  private publish(): void {
    window.__captainsAcademyQuiz = {
      level: LEVEL_ID,
      phase: this.phase,
      card: this.phase === 'done' ? null : (currentCard(this.run) ?? null),
      hearts: this.run.hearts,
      combo: this.run.combo,
      score: this.run.score,
      misses: this.run.misses,
      answered: this.run.answered,
      remaining: this.run.queue.length,
      outcome: this.run.outcome,
      stars: this.stars,
      paused: this.paused,
      elapsedMs: this.elapsedMs,
      seed: this.seed,
    };
  }
}
