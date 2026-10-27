import * as React from 'react';
import { ArrowRight, Check, CircleAlert, Circle, Info } from 'lucide-react';
import { liveHref } from '../shared/routes';
import {
  heldCredentials,
  NMC_NOTICE,
  requirements,
  tasks,
  type Credential,
  type Task,
} from '../shared/sample';
import type { VariantId } from '../shared/types';
import {
  areaLabel,
  daysUntil,
  dueText,
  filterLabels,
  filterTasks,
  fmtDate,
  isOverdue,
  type TaskFilter,
} from './data';
import './shared.css';

export function SampleMarker() {
  return (
    <p className="cx-sample">
      <Info size={16} aria-hidden /> Sample data. Jordan Sample is fictional.
    </p>
  );
}

export function Illustrative() {
  return <span className="cx-illus">illustrative</span>;
}

type Tone = 'done' | 'attn' | 'todo' | 'extra';
export function Chip({ tone, children }: { tone: Tone; children: React.ReactNode }) {
  const Icon = tone === 'done' ? Check : tone === 'attn' ? CircleAlert : Circle;
  return (
    <span className={`cx-chip cx-chip-${tone}`}>
      <Icon size={16} aria-hidden /> {children}
    </span>
  );
}

export function Ring({
  value,
  max,
  tone,
  caption,
  size = 132,
}: {
  value: number;
  max: number;
  tone: 'done' | 'attn';
  caption: string;
  size?: number;
}) {
  const r = 52;
  const c = 2 * Math.PI * r;
  return (
    <div
      className={`cx-ring cx-ring-${tone}`}
      role="img"
      aria-label={`${value} of ${max} days. ${caption}`}
    >
      <svg viewBox="0 0 120 120" width={size} height={size} aria-hidden>
        <circle className="cx-ring-track" cx="60" cy="60" r={r} />
        <circle
          className="cx-ring-fill"
          cx="60"
          cy="60"
          r={r}
          strokeDasharray={`${(value / max) * c} ${c}`}
          transform="rotate(-90 60 60)"
        />
      </svg>
      <span className="cx-ring-num">
        <b>{value}</b>
        <small>of {max} days</small>
      </span>
    </div>
  );
}

export function FilterBar({
  value,
  onChange,
}: {
  value: TaskFilter;
  onChange: (f: TaskFilter) => void;
}) {
  return (
    <div className="cx-filter" role="group" aria-label="Show tasks">
      {(Object.keys(filterLabels) as TaskFilter[]).map((f) => (
        <button key={f} type="button" aria-pressed={value === f} onClick={() => onChange(f)}>
          {filterLabels[f]}
          <span className="cx-filter-n">{filterTasks(tasks, f).length}</span>
        </button>
      ))}
    </div>
  );
}

function emptyCopy(f: TaskFilter) {
  const soon = tasks
    .filter((t) => t.due && daysUntil(t.due) >= 0)
    .sort((a, b) => (a.due ?? '').localeCompare(b.due ?? ''))[0];
  const next = soon?.due
    ? `Next deadline: ${soon.title}, ${fmtDate(soon.due)}.`
    : 'Nothing has a deadline.';
  return f === 'overdue'
    ? { head: 'Nothing is overdue.', body: `You are on time. ${next}` }
    : { head: 'Nothing is due this week.', body: next };
}

/** The task list for one filter, with an empty state that says what to do next. */
export function TaskList({
  filter,
  onFilter,
  variant,
}: {
  filter: TaskFilter;
  onFilter: (f: TaskFilter) => void;
  variant: VariantId;
}) {
  const items = filterTasks(tasks, filter);
  return (
    <div className="cx-tasks">
      {items.length === 0 ? (
        <div className="cx-empty" role="status">
          <Check size={28} aria-hidden />
          <h3>{emptyCopy(filter).head}</h3>
          <p>{emptyCopy(filter).body}</p>
          <button type="button" className="cx-btn" onClick={() => onFilter('all')}>
            Show all tasks
          </button>
        </div>
      ) : (
        <ol className="cx-task-list">
          {items.map((t) => (
            <TaskRow key={t.id} task={t} variant={variant} />
          ))}
        </ol>
      )}
    </div>
  );
}

export function TaskRow({ task, variant }: { task: Task; variant: VariantId }) {
  const soon = task.due !== null && daysUntil(task.due) <= 7;
  return (
    <li className="cx-task">
      <div className="cx-task-main">
        <h3>{task.title}</h3>
        <p>{task.why}</p>
        <p className="cx-task-meta">
          <Chip tone={isOverdue(task) || soon ? 'attn' : 'todo'}>{dueText(task)}</Chip>
          {task.minutes ? <span>About {task.minutes} min</span> : null}
          {task.illustrative ? <Illustrative /> : null}
        </p>
      </div>
      <a className="cx-link" href={liveHref(task.area, variant)}>
        Open in {areaLabel[task.area]} <ArrowRight size={16} aria-hidden />
      </a>
    </li>
  );
}

const credTone = (c: Credential): Tone =>
  c.status === 'expiring' ? 'attn' : c.status === 'extra' ? 'extra' : 'done';
const credWord = (c: Credential) =>
  c.status === 'expiring' ? 'Window closing' : c.status === 'extra' ? 'Extra' : 'On file';

export function CredentialPicker({
  selected,
  onSelect,
}: {
  selected: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <ul className="cx-cred-list">
      {heldCredentials.map((c) => (
        <li key={c.id}>
          <button
            type="button"
            className="cx-cred"
            aria-pressed={selected === c.id}
            onClick={() => onSelect(c.id)}
          >
            <span className="cx-cred-text">
              <b>{c.name}</b>
              <span>{c.detail}</span>
            </span>
            <Chip tone={credTone(c)}>{credWord(c)}</Chip>
          </button>
        </li>
      ))}
    </ul>
  );
}

export function CredentialDetail({ id, variant }: { id: string | null; variant: VariantId }) {
  const c = heldCredentials.find((x) => x.id === id);
  if (!c) {
    return (
      <div className="cx-detail" role="status">
        <h3>Pick a document</h3>
        <p>Choose one on the list to see its dates and what it is for.</p>
      </div>
    );
  }
  const days = c.validTo ? daysUntil(c.validTo) : null;
  const use: Record<string, string> = {
    'first-aid': 'Goes in with your application as proof of first aid and CPR training.',
    physical: 'The medical certificate form. It goes in with your application.',
    'drug-test': 'Proof of a passed drug test. It has to be recent when you send the application.',
    'boater-card': 'Not part of the OUPV application. Kept here for your own records.',
  };
  return (
    <div className="cx-detail" aria-live="polite">
      <h3>{c.name}</h3>
      <p>{use[c.id]}</p>
      <dl>
        <div>
          <dt>Status</dt>
          <dd>
            <Chip tone={credTone(c)}>{credWord(c)}</Chip>
          </dd>
        </div>
        <div>
          <dt>Good until</dt>
          <dd>
            {c.validTo ? `${fmtDate(c.validTo)} · ${days} days left` : 'No end date'}
            {c.id === 'drug-test' ? <Illustrative /> : null}
          </dd>
        </div>
        <div>
          <dt>Details</dt>
          <dd>{c.detail}</dd>
        </div>
      </dl>
      {c.id === 'drug-test' ? (
        <p className="cx-note">
          Send the application before the window closes, or plan to test again.
        </p>
      ) : null}
      <a className="cx-link" href={liveHref('license', variant)}>
        See it in License &amp; Forms <ArrowRight size={16} aria-hidden />
      </a>
    </div>
  );
}

export function MmcNote() {
  return (
    <p className="cx-mmc">
      <b>Merchant Mariner Credential: none yet.</b> The OUPV would be your first.
    </p>
  );
}

const reqTone = {
  'appears-met': 'done',
  'in-progress': 'attn',
  'to-do': 'todo',
  'needs-fix': 'attn',
} as const;
const reqWord = {
  'appears-met': 'Appears met',
  'in-progress': 'In progress',
  'to-do': 'To do',
  'needs-fix': 'Needs fixing',
} as const;

/** "What's still needed": open parts first, then the ones that appear met. */
export function NeededList({ variant }: { variant: VariantId }) {
  const open = requirements.filter((r) => r.status !== 'appears-met');
  const met = requirements.filter((r) => r.status === 'appears-met');
  const row = (r: (typeof requirements)[number]) => (
    <li key={r.id} className="cx-req">
      <div>
        <b>{r.label}</b>
        <span>{r.detail}</span>
        {r.status !== 'appears-met' && !r.verified ? <Illustrative /> : null}
      </div>
      <Chip tone={reqTone[r.status]}>{reqWord[r.status]}</Chip>
      {r.status !== 'appears-met' ? (
        <a className="cx-link" href={liveHref(r.area, variant)}>
          Work on it in {areaLabel[r.area]} <ArrowRight size={16} aria-hidden />
        </a>
      ) : null}
    </li>
  );
  return (
    <div className="cx-needed">
      <h3>Still needed ({open.length})</h3>
      <ul>{open.map(row)}</ul>
      <h3>Appears met ({met.length})</h3>
      <ul>{met.map(row)}</ul>
      <p className="cx-note">
        Only the sea-service figures are checked against 46 CFR 11.467(c) and 10.107. Other parts
        are illustrative. {NMC_NOTICE}
      </p>
    </div>
  );
}

export const backfillLine =
  '42 of the 298 credited days were entered later. They stay labeled backfilled, never GPS-verified.';
