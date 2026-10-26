import * as React from 'react';
import {
  AlertTriangle,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  CheckCircle2,
  ChevronsUp,
  Lock,
  Pause,
  Play,
  Square,
  Star,
} from 'lucide-react';
import { arcadeChallenges, type ArcadeChallenge } from '../shared/sample';
import { ITEMS, type Answers, type RuleItem, type Option } from './rules';
import { BERTH, SLIP, DWELL_SECONDS, type Sim, headingDeg, knots } from './sim';
import type { Docking } from './useDocking';

export type Kind = ArcadeChallenge['kind'] | 'all';
export type StatusFilter = ArcadeChallenge['status'] | 'any';

export const KIND_LABEL: Record<ArcadeChallenge['kind'], string> = {
  docking: 'Docking',
  rules: 'Rules',
  navigation: 'Navigation',
};
export const STATUS_LABEL: Record<ArcadeChallenge['status'], string> = {
  cleared: 'Cleared',
  open: 'Open',
  locked: 'Locked',
};

export function filterChallenges(kind: Kind, status: StatusFilter): readonly ArcadeChallenge[] {
  return arcadeChallenges.filter(
    (c) => (kind === 'all' || c.kind === kind) && (status === 'any' || c.status === status),
  );
}

/** Where a challenge goes in this demo: a screen of the prototype, a link to the real game, or nowhere. */
export type Route =
  { type: 'dock' } | { type: 'rules' } | { type: 'real'; href: string } | { type: 'locked' };

export function routeOf(c: ArcadeChallenge): Route {
  if (c.status === 'locked') return { type: 'locked' };
  if (c.kind === 'docking') return { type: 'dock' };
  if (c.id === 'night-crossing') return { type: 'rules' };
  return { type: 'real', href: c.builtAt ?? '/play/' };
}

export function Stars({ n, label = true }: { n: number; label?: boolean }) {
  return (
    <span className="arc-stars">
      <span aria-hidden className="arc-stars-row">
        {[1, 2, 3].map((i) => (
          <Star
            key={i}
            size={18}
            className={i <= n ? 'on' : 'off'}
            fill={i <= n ? 'currentColor' : 'none'}
          />
        ))}
      </span>
      {label ? <span>{n} of 3 stars</span> : <span className="sr-only">{n} of 3 stars</span>}
    </span>
  );
}

export function StatusTag({ c }: { c: ArcadeChallenge }) {
  const Icon = c.status === 'cleared' ? CheckCircle2 : c.status === 'locked' ? Lock : AlertTriangle;
  return (
    <span className="arc-tag" data-status={c.status}>
      <Icon size={16} aria-hidden />{' '}
      {c.status === 'open' ? 'Not cleared yet' : STATUS_LABEL[c.status]}
    </span>
  );
}

export function SampleMark() {
  return <span className="arc-sample">Sample data</span>;
}

export function Chips<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: readonly { id: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div role="group" aria-label={label} className="arc-chips">
      <span className="arc-chips-label">{label}</span>
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          aria-pressed={o.id === value}
          onClick={() => onChange(o.id)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export const KIND_OPTIONS: readonly { id: Kind; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'docking', label: 'Docking' },
  { id: 'rules', label: 'Rules' },
  { id: 'navigation', label: 'Navigation' },
];
export const STATUS_OPTIONS: readonly { id: StatusFilter; label: string }[] = [
  { id: 'any', label: 'Any' },
  { id: 'open', label: 'Open' },
  { id: 'cleared', label: 'Cleared' },
  { id: 'locked', label: 'Locked' },
];

export function EmptyFilter({
  kind,
  status,
  onClear,
}: {
  kind: Kind;
  status: StatusFilter;
  onClear: () => void;
}) {
  const k = kind === 'all' ? 'challenges' : `${KIND_LABEL[kind].toLowerCase()} challenges`;
  const s = status === 'any' ? '' : `${STATUS_LABEL[status].toLowerCase()} `;
  return (
    <div className="arc-empty" role="status">
      <h3>
        No {s}
        {k} here yet.
      </h3>
      <p>
        {status === 'cleared'
          ? 'Clear one first and it will show up here with its stars.'
          : 'Nothing matches both filters. Show everything to pick a challenge.'}
      </p>
      <button type="button" className="arc-btn" onClick={onClear}>
        Show all challenges
      </button>
    </div>
  );
}

/** Speed, heading and distance as plain readouts. */
export function Readouts({ sim, windLabel }: { sim: Sim; windLabel: string }) {
  const toBerth = Math.max(0, Math.round(sim.y - (BERTH.yMin + BERTH.yMax) / 2));
  return (
    <dl className="arc-readouts">
      <div>
        <dt>Speed</dt>
        <dd>{knots(sim.ground).toFixed(1)} kn</dd>
      </div>
      <div>
        <dt>Heading</dt>
        <dd>{headingDeg(sim.h).toString().padStart(3, '0')}°</dd>
      </div>
      <div>
        <dt>To the slip</dt>
        <dd>{toBerth} m</dd>
      </div>
      <div>
        <dt>Touches</dt>
        <dd>{sim.bumps}</dd>
      </div>
      <div className="arc-wind-chip">
        <dt>Wind</dt>
        <dd>{windLabel}</dd>
      </div>
    </dl>
  );
}

export function DockLive({ d }: { d: Docking }) {
  const s = d.sim;
  const msg =
    s.contact > 0
      ? 'You touched a piling.'
      : s.dwell > 0
        ? `In the slip. Hold still for ${Math.max(0, DWELL_SECONDS - s.dwell).toFixed(1)} s.`
        : d.status === 'paused'
          ? 'Paused.'
          : '';
  return (
    <p className="arc-live" role="status" aria-live="polite">
      {msg}
    </p>
  );
}

function RudderButton({ d, dir }: { d: Docking; dir: -1 | 1 }) {
  const Icon = dir < 0 ? ArrowLeft : ArrowRight;
  return (
    <button
      type="button"
      className="arc-rudder-btn"
      aria-pressed={d.rudder === dir}
      aria-label={dir < 0 ? 'Turn left (hold)' : 'Turn right (hold)'}
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        d.holdRudder(dir);
      }}
      onPointerUp={() => d.holdRudder(0)}
      onPointerCancel={() => d.holdRudder(0)}
      onClick={(e) => {
        if (e.detail === 0) d.pulseRudder(dir);
      }}
    >
      <Icon size={22} aria-hidden />
      <span>{dir < 0 ? 'Left' : 'Right'}</span>
      <small>hold</small>
    </button>
  );
}

const THROTTLE_ICON = { 2: ChevronsUp, 1: ArrowUp, 0: Square, '-1': ArrowDown } as const;

/** Throttle detents on one side, rudder on the other. Keys: arrows or W A S D. */
export function DockControls({ d }: { d: Docking }) {
  const rows = [
    { id: 2, label: 'Ahead' },
    { id: 1, label: 'Slow ahead' },
    { id: 0, label: 'Stop' },
    { id: -1, label: 'Astern' },
  ] as const;
  return (
    <div className="arc-controls">
      <div className="arc-throttle" role="group" aria-label="Engine">
        {rows.map((r) => {
          const Icon = THROTTLE_ICON[String(r.id) as keyof typeof THROTTLE_ICON];
          return (
            <button
              key={r.id}
              type="button"
              aria-pressed={d.throttle === r.id && !d.auto}
              onClick={() => d.setThrottle(r.id)}
            >
              <Icon size={20} aria-hidden />
              {r.label}
            </button>
          );
        })}
      </div>
      <div className="arc-rudder" role="group" aria-label="Rudder">
        <RudderButton d={d} dir={-1} />
        <RudderButton d={d} dir={1} />
      </div>
    </div>
  );
}

export function PlayBar({ d }: { d: Docking }) {
  return (
    <div className="arc-playbar">
      <button type="button" className="arc-btn ghost" onClick={d.togglePause}>
        {d.status === 'paused' ? <Play size={20} aria-hidden /> : <Pause size={20} aria-hidden />}
        {d.status === 'paused' ? 'Resume' : 'Pause'}
      </button>
      <button type="button" className="arc-btn ghost" onClick={d.restart}>
        Restart
      </button>
      <button
        type="button"
        className="arc-btn ghost"
        aria-pressed={d.auto}
        onClick={() => d.setAuto(!d.auto)}
      >
        {d.auto ? 'Take the helm' : 'Show me (autopilot)'}
      </button>
      <button
        type="button"
        className="arc-btn ghost"
        aria-pressed={d.slow}
        onClick={() => d.setSlow(!d.slow)}
      >
        Half speed: {d.slow ? 'on' : 'off'}
      </button>
    </div>
  );
}

export const KEYS_HINT = 'Keys: Up and Down change the engine. Left and Right turn. P pauses.';

/** One short coaching line from what the boat is doing right now. */
export function coach(d: Docking): string {
  const s = d.sim;
  const near = s.y < 40;
  const off = s.x - SLIP.cx;
  if (d.auto) return 'Autopilot is driving. Watch how it slows down before the slip.';
  if (s.contact > 0) return 'Touched a piling. Stop, back out a little, and line up again.';
  if (s.dwell > 0) return 'You are in. Keep her still and she is docked.';
  if (s.t < 4 && d.throttle === 0) return 'Try this first. Tap Slow ahead and watch the speed.';
  if (near && s.ground > 1.6) return 'Too fast for the slip. Tap Slow ahead, then Stop.';
  if (Math.abs(off) > 6 && s.y > 30)
    return off > 0
      ? 'The slip is to your left. Turn left a little.'
      : 'The slip is to your right. Turn right a little.';
  if (Math.abs(off) > 2.5 && s.y < 40) return 'Aim a little upwind. The wind pushes you east.';
  if (s.y > 40) return 'Point at the gap between the pilings, then go ahead.';
  return 'Good. Keep her straight and ease off the engine.';
}

// ---------------------------------------------------------------- rules card

const letter = (i: number) => String.fromCharCode(65 + i);

function Group({
  name,
  legend,
  options,
  picked,
  checked,
  onPick,
}: {
  name: string;
  legend: string;
  options: readonly Option[];
  picked: string | undefined;
  checked: boolean;
  onPick: (id: string) => void;
}) {
  const chosen = options.find((o) => o.id === picked);
  const right = options.find((o) => o.correct);
  return (
    <fieldset className="arc-group" disabled={checked}>
      <legend>{legend}</legend>
      {options.map((o, i) => (
        <label
          key={o.id}
          className="arc-opt"
          data-picked={o.id === picked}
          data-right={checked && o.correct}
        >
          <input type="radio" name={name} checked={o.id === picked} onChange={() => onPick(o.id)} />
          <b aria-hidden>{letter(i)}</b>
          <span>{o.label}</span>
          {checked && o.correct && <em>Right answer</em>}
        </label>
      ))}
      {checked && chosen && right && (
        <p className="arc-why" data-ok={chosen.correct} role="status">
          {chosen.correct ? (
            <CheckCircle2 size={20} aria-hidden />
          ) : (
            <AlertTriangle size={20} aria-hidden />
          )}
          <span>
            <b>{chosen.correct ? 'Correct. ' : 'Not quite. '}</b>
            {chosen.correct
              ? chosen.why
              : `${chosen.why} The answer is: ${right.label} ${right.why}`}
          </span>
        </p>
      )}
    </fieldset>
  );
}

export interface RulesCardProps {
  item: RuleItem;
  answers: Answers;
  onPick: (itemId: string, group: 'she' | 'act', id: string) => void;
  onCheck: (itemId: string) => void;
  /** Ask one question at a time instead of both together. */
  stepwise?: boolean;
  children?: React.ReactNode;
}

export function RulesCard({
  item,
  answers,
  onPick,
  onCheck,
  stepwise = false,
  children,
}: RulesCardProps) {
  const a = answers[item.id] ?? { checked: false };
  const [sub, setSub] = React.useState<'she' | 'act'>('she');
  const both = (
    <>
      <Group
        name={`${item.id}-she`}
        legend="What is she?"
        options={item.she}
        picked={a.she}
        checked={a.checked}
        onPick={(id) => onPick(item.id, 'she', id)}
      />
      <Group
        name={`${item.id}-act`}
        legend="What do you do?"
        options={item.act}
        picked={a.act}
        checked={a.checked}
        onPick={(id) => onPick(item.id, 'act', id)}
      />
    </>
  );
  if (!stepwise) {
    return (
      <div className="arc-card-rules">
        {both}
        {children}
        {!a.checked && (
          <button
            type="button"
            className="arc-btn primary"
            disabled={!a.she || !a.act}
            onClick={() => onCheck(item.id)}
          >
            Check my answer
          </button>
        )}
        {a.checked && <p className="arc-summary">{item.summary}</p>}
      </div>
    );
  }
  const group = sub === 'she' ? item.she : item.act;
  const picked = sub === 'she' ? a.she : a.act;
  return (
    <div className="arc-card-rules">
      <Group
        key={`${item.id}-${sub}`}
        name={`${item.id}-${sub}`}
        legend={sub === 'she' ? 'Step 1. What is she?' : 'Step 2. What do you do?'}
        options={group}
        picked={picked}
        checked={false}
        onPick={(id) => onPick(item.id, sub, id)}
      />
      {picked && (
        <p className="arc-why" data-ok={group.find((o) => o.id === picked)?.correct} role="status">
          {group.find((o) => o.id === picked)?.correct ? (
            <CheckCircle2 size={20} aria-hidden />
          ) : (
            <AlertTriangle size={20} aria-hidden />
          )}
          <span>
            <b>{group.find((o) => o.id === picked)?.correct ? 'Yes. ' : 'Not quite. '}</b>
            {group.find((o) => o.id === picked)?.why}
            {group.find((o) => o.id === picked)?.correct
              ? ''
              : ` The answer is: ${group.find((o) => o.correct)?.label}`}
          </span>
        </p>
      )}
      {children}
      {sub === 'she' ? (
        <button
          type="button"
          className="arc-btn primary"
          disabled={!picked}
          onClick={() => setSub('act')}
        >
          Next question
        </button>
      ) : (
        <button
          type="button"
          className="arc-btn primary"
          disabled={!picked}
          onClick={() => onCheck(item.id)}
        >
          Finish this scene
        </button>
      )}
    </div>
  );
}

export function useRules() {
  const [answers, setAnswers] = React.useState<Answers>({});
  return {
    answers,
    pick: (itemId: string, group: 'she' | 'act', id: string) =>
      setAnswers((a) => ({ ...a, [itemId]: { checked: false, ...a[itemId], [group]: id } })),
    check: (itemId: string) =>
      setAnswers((a) => ({ ...a, [itemId]: { ...a[itemId], checked: true } })),
    reset: () => setAnswers({}),
  };
}

export const itemAt = (i: number): RuleItem => ITEMS[i] ?? (ITEMS[0] as RuleItem);
