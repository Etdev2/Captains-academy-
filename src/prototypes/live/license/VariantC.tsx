import * as React from 'react';
import { AlertTriangle, ArrowLeft, ArrowRight, Check, Info, Undo2 } from 'lucide-react';
import { liveHref, useScreen } from '../shared/routes';
import { DEMO_NOTICE, backfillNote, heldCredentials, licenses, seaTime } from '../shared/sample';
import {
  ILLUSTRATIVE,
  STAGES_NOTE,
  Term,
  currentStage,
  examNote,
  issues,
  resolutionText,
  stages,
  useJourney,
  type Journey,
} from './logic';
import './variant-c.css';

const SCREENS = ['navigator', 'have', 'missing', 'review', 'status'] as const;
type Screen = (typeof SCREENS)[number];
type Go = (s: Screen) => void;

const ROUTE: { id: Screen; label: string }[] = [
  { id: 'navigator', label: 'License' },
  { id: 'have', label: 'Have' },
  { id: 'missing', label: 'Missing' },
  { id: 'review', label: 'Fix' },
  { id: 'status', label: 'Status' },
];

const COACH: Record<string, string> = {
  'sea-any':
    'Sea time is the long one. Every day you log on the water counts toward it. Days you entered later stay labeled backfilled.',
  'sea-nc':
    'Part of your sea time has to be on ocean or near-coastal waters. Harbor and inland days count for the total, not for this part.',
  exam: 'You either pass the exam or finish an approved course. Study first, then book it.',
  application:
    'The application is the CG-719B. A few other forms and papers travel with it. Here is what each one is.',
};

function Illus({ j }: { j: Journey }) {
  return j.license.verified ? (
    <p className="lic-c-cite">Sea-service figures checked against {j.license.cfr.join(' and ')}.</p>
  ) : (
    <p className="lic-c-illus">
      <Info aria-hidden size={20} /> Illustrative. {ILLUSTRATIVE}.
    </p>
  );
}

function Step({
  title,
  lead,
  children,
  foot,
}: {
  title: string;
  lead?: React.ReactNode;
  children: React.ReactNode;
  foot: React.ReactNode;
}) {
  const ref = React.useRef<HTMLHeadingElement>(null);
  React.useEffect(() => {
    ref.current?.focus({ preventScroll: true });
  }, [title]);
  return (
    <>
      <section className="lic-c-card">
        <h1 ref={ref} tabIndex={-1}>
          {title}
        </h1>
        {lead ? <p className="lic-c-lead">{lead}</p> : null}
        {children}
      </section>
      <div className="lic-c-foot">{foot}</div>
    </>
  );
}

// ------------------------------------------------------------------ 1 which license

function Which({ j, go }: { j: Journey; go: Go }) {
  const [upOnly, setUpOnly] = React.useState(false);
  const list = upOnly ? [] : licenses;
  return (
    <Step
      title="Which license are you after?"
      lead={
        <>
          Pick one. Most people start with the <Term id="oupv" p="lic-c" />, nicknamed the{' '}
          <Term id="six-pack" p="lic-c" />. Everything after this follows your pick.
        </>
      }
      foot={
        <button type="button" className="lic-c-btn lic-c-btn--primary" onClick={() => go('have')}>
          Continue with {j.license.short} <ArrowRight aria-hidden size={22} />
        </button>
      }
    >
      <label className="lic-c-check">
        <input type="checkbox" checked={upOnly} onChange={(e) => setUpOnly(e.target.checked)} />
        Only show upgrades from a license I hold
      </label>
      {list.length === 0 ? (
        <div className="lic-c-empty">
          <h2>No upgrades for you yet</h2>
          <p>
            An upgrade builds on a license you already hold. You hold none, so your first license
            comes first. Show all licenses to pick one.
          </p>
          <button type="button" className="lic-c-btn" onClick={() => setUpOnly(false)}>
            Show all licenses
          </button>
        </div>
      ) : (
        <fieldset className="lic-c-choices">
          <legend className="lic-c-sr">Target license</legend>
          {list.map((l) => (
            <label key={l.id} className="lic-c-choice">
              <input
                type="radio"
                name="license"
                checked={j.license.id === l.id}
                onChange={() => j.setLicenseId(l.id)}
              />
              <span>
                <b>{l.name}</b>
                <span>{l.summary}</span>
                <small>
                  {l.kind === 'upgrade' ? 'Comes after a first license. ' : ''}
                  {l.verified ? l.cfr.join(' · ') : 'Illustrative, not yet checked against 46 CFR'}
                </small>
              </span>
            </label>
          ))}
        </fieldset>
      )}
    </Step>
  );
}

// ------------------------------------------------------------------ 2 what you have

function Have({ j, go }: { j: Journey; go: Go }) {
  const v = j.seaView;
  return (
    <Step
      title="Here's what you already have"
      lead={
        <>
          You hold no <Term id="mmc" p="lic-c" /> yet, so {j.license.short} would be your first.
          These papers are already on file.
        </>
      }
      foot={
        <>
          <button
            type="button"
            className="lic-c-btn lic-c-btn--primary"
            onClick={() => go('missing')}
          >
            Show me what is missing <ArrowRight aria-hidden size={22} />
          </button>
          <button
            type="button"
            className="lic-c-btn lic-c-btn--ghost"
            onClick={() => go('navigator')}
          >
            <ArrowLeft aria-hidden size={20} /> Change license
          </button>
        </>
      }
    >
      <ul className="lic-c-list">
        {heldCredentials.map((c) => (
          <li key={c.id}>
            <span
              className={`lic-c-dot lic-c-dot--${c.status === 'expiring' ? 'need' : c.status === 'extra' ? 'idle' : 'done'}`}
            >
              {c.status === 'expiring' ? (
                <AlertTriangle aria-hidden size={16} />
              ) : (
                <Check aria-hidden size={16} />
              )}
            </span>
            <span>
              <b>{c.name}</b>
              <small>
                {c.detail} ·{' '}
                {c.status === 'on-file'
                  ? 'On file'
                  : c.status === 'expiring'
                    ? 'Window closing'
                    : 'Extra'}
              </small>
            </span>
          </li>
        ))}
      </ul>
      <p className="lic-c-note">
        Your logged sea time <b>appears to meet</b> 0 of {v.ncApplies ? 2 : 1} sea-service parts so
        far: {v.anyDone} of {v.anyReq} days
        {v.ncApplies ? `, ${v.ncDone} of ${v.ncReq} near coastal` : ''}. {seaTime.backfilledDays} of
        those days are <b>backfilled</b>. Game time never counts.
      </p>
      <Illus j={j} />
    </Step>
  );
}

// ------------------------------------------------------------------ 3 what is missing

function Missing({ j, go }: { j: Journey; go: Go }) {
  const items = j.reqs.filter((r) => r.tone !== 'done');
  const [i, setI] = React.useState(0);
  const n = items.length;
  const cur = items[Math.min(i, Math.max(n - 1, 0))];
  if (!cur) {
    return (
      <Step
        title="Nothing is missing"
        lead="Everything on this license's list appears met. The National Maritime Center still decides."
        foot={
          <button
            type="button"
            className="lic-c-btn lic-c-btn--primary"
            onClick={() => go('status')}
          >
            See where it goes next <ArrowRight aria-hidden size={22} />
          </button>
        }
      >
        <div className="lic-c-empty">
          <h2>All clear for now</h2>
          <p>Pre-check passed and every item appears met.</p>
        </div>
      </Step>
    );
  }
  const last = i >= n - 1;
  return (
    <Step
      title="Here's what's missing"
      lead={`${n} things left. One at a time.`}
      foot={
        <>
          {cur.id === 'application' ? (
            <button
              type="button"
              className="lic-c-btn lic-c-btn--primary"
              onClick={() => go('review')}
            >
              Let&apos;s fix your application <ArrowRight aria-hidden size={22} />
            </button>
          ) : (
            <button
              type="button"
              className="lic-c-btn lic-c-btn--primary"
              onClick={() => (last ? go('review') : setI(i + 1))}
            >
              {last ? "Let's fix your application" : 'Next one'}{' '}
              <ArrowRight aria-hidden size={22} />
            </button>
          )}
          {i > 0 ? (
            <button
              type="button"
              className="lic-c-btn lic-c-btn--ghost"
              onClick={() => setI(i - 1)}
            >
              <ArrowLeft aria-hidden size={20} /> Previous
            </button>
          ) : null}
        </>
      }
    >
      <div className="lic-c-mini" role="status">
        <span>
          Item {Math.min(i, n - 1) + 1} of {n}
        </span>
        <div className="lic-c-pips" aria-hidden>
          {items.map((r, k) => (
            <i key={r.id} className={k <= i ? 'on' : ''} />
          ))}
        </div>
      </div>
      <div className="lic-c-item">
        <h2>{cur.label}</h2>
        <p className="lic-c-big">{cur.detail}</p>
        <p>{COACH[cur.id]}</p>
        {cur.gauge ? (
          <div
            className="lic-c-bar"
            role="img"
            aria-label={`${cur.gauge.done} of ${cur.gauge.of} days`}
          >
            <i style={{ width: `${Math.min((cur.gauge.done / cur.gauge.of) * 100, 100)}%` }} />
          </div>
        ) : null}
        {cur.area === 'sea-time' ? (
          <p>
            <a className="lic-c-link" href={liveHref('sea-time', 'c')}>
              Open the sea-time log
            </a>
          </p>
        ) : null}
        {cur.id === 'exam' ? <p className="lic-c-note">{examNote}</p> : null}
        {cur.id === 'application' ? (
          <ul className="lic-c-forms">
            {j.forms.map((f) => (
              <li key={f.id}>
                <b>{f.code === 'Certificate' ? f.name : `${f.code} · ${f.name}`}</b>
                <small>{f.plain}</small>
              </li>
            ))}
          </ul>
        ) : null}
        {cur.illustrative ? (
          <p className="lic-c-illus">
            <Info aria-hidden size={20} /> Illustrative. Not yet checked against 46 CFR.
          </p>
        ) : null}
      </div>
    </Step>
  );
}

// ------------------------------------------------------------------ 4 fix

function Fix({ j, go }: { j: Journey; go: Go }) {
  const r = j.review;
  const [idx, setIdx] = React.useState(0);
  const [zip, setZip] = React.useState('');
  const [err, setErr] = React.useState<string | null>(null);
  const zipId = React.useId();
  const nextOpen = (from: number): number => {
    for (let k = 1; k <= issues.length; k++) {
      const at = (from + k) % issues.length;
      if (!r.resolution[issues[at]?.field.id ?? '']) return at;
    }
    return from;
  };
  const advance = () => setIdx(nextOpen(idx));
  const done = r.total - r.openCount;
  const bar = (
    <div className="lic-c-mini" role="status">
      <span>
        {done} of {r.total} fixed
      </span>
      <div className="lic-c-pips" aria-hidden>
        {issues.map((i) => (
          <i key={i.field.id} className={r.resolution[i.field.id] ? 'on' : ''} />
        ))}
      </div>
    </div>
  );
  if (r.passed) {
    return (
      <Step
        title="Pre-check passed"
        lead={
          <>
            Nice work. Your CG-719B has no more flagged fields. This is not a Coast Guard decision.
            The <Term id="nmc" p="lic-c" /> decides.
          </>
        }
        foot={
          <button
            type="button"
            className="lic-c-btn lic-c-btn--primary"
            onClick={() => go('status')}
          >
            See where it goes next <ArrowRight aria-hidden size={22} />
          </button>
        }
      >
        {bar}
        <div className="lic-c-empty">
          <h2>Nothing left to fix</h2>
          <p>
            {r.keptCount
              ? `You kept ${r.keptCount} value${r.keptCount > 1 ? 's' : ''} that pre-check questioned. The NMC may ask about ${r.keptCount > 1 ? 'them' : 'it'}.`
              : 'Every correction is done.'}
          </p>
        </div>
        <ul className="lic-c-list">
          {issues.map((i) => (
            <li key={i.field.id}>
              <span className="lic-c-dot lic-c-dot--done">
                <Check aria-hidden size={16} />
              </span>
              <span>
                <b>{i.field.label}</b>
                <small>{resolutionText(r.resolution[i.field.id])}</small>
              </span>
              <button
                type="button"
                className="lic-c-btn lic-c-btn--small"
                onClick={() => r.undo(i.field.id)}
              >
                <Undo2 aria-hidden size={16} /> Undo
              </button>
            </li>
          ))}
        </ul>
        <p className="lic-c-note">
          <b>Backfilled.</b> {backfillNote}
        </p>
      </Step>
    );
  }
  const cur =
    issues[idx]?.field.id && !r.resolution[issues[idx]?.field.id ?? '']
      ? issues[idx]
      : issues[nextOpen(idx)];
  const f = cur?.field;
  if (!cur || !f?.issue) return null;
  const isZip = f.id === 'address';
  return (
    <Step
      title="Let's fix your application"
      lead={`Correction ${cur.n} of ${r.total}. Your CG-719B is the application for a Merchant Mariner Credential.`}
      foot={
        <>
          {isZip ? (
            <button
              type="button"
              className="lic-c-btn lic-c-btn--primary"
              onClick={() => {
                const e = r.typeZip(f.id, zip);
                setErr(e);
                if (!e) {
                  setZip('');
                  setIdx(nextOpen(issues.indexOf(cur)));
                }
              }}
            >
              Add the ZIP code
            </button>
          ) : (
            <button
              type="button"
              className="lic-c-btn lic-c-btn--primary"
              onClick={() => {
                r.applyFix(f.id);
                setIdx(nextOpen(issues.indexOf(cur)));
              }}
            >
              Use this fix
            </button>
          )}
          <button
            type="button"
            className="lic-c-btn"
            onClick={() => {
              r.keep(f.id);
              setIdx(nextOpen(issues.indexOf(cur)));
            }}
          >
            Keep mine
          </button>
          {r.openCount > 1 ? (
            <button type="button" className="lic-c-btn lic-c-btn--ghost" onClick={advance}>
              Skip for now
            </button>
          ) : null}
        </>
      }
    >
      {bar}
      {j.license.id !== licenses[0]?.id ? (
        <p className="lic-c-illus">
          <Info aria-hidden size={20} /> This sample draft was started for OUPV · Near coastal.
        </p>
      ) : null}
      <div className="lic-c-item" key={f.id}>
        <h2>{f.issue.title}</h2>
        <p className="lic-c-big">{f.issue.help}</p>
        <dl className="lic-c-diff">
          <div>
            <dt>{f.label}, as you typed it</dt>
            <dd>{f.value}</dd>
          </div>
          {f.issue.fix ? (
            <div>
              <dt>What pre-check suggests</dt>
              <dd className="is-new">{f.issue.fix}</dd>
            </div>
          ) : null}
        </dl>
        {isZip ? (
          <div className="lic-c-zip">
            <label htmlFor={zipId}>ZIP code</label>
            <input
              id={zipId}
              inputMode="numeric"
              autoComplete="postal-code"
              value={zip}
              aria-invalid={err ? true : undefined}
              aria-describedby={err ? `${zipId}-e` : undefined}
              onChange={(e) => {
                setZip(e.target.value);
                setErr(null);
              }}
            />
            {err ? (
              <p id={`${zipId}-e`} className="lic-c-error">
                {err}
              </p>
            ) : null}
          </div>
        ) : null}
      </div>
      {done > 0 ? (
        <ul className="lic-c-list lic-c-list--compact">
          {issues
            .filter((i) => r.resolution[i.field.id])
            .map((i) => (
              <li key={i.field.id}>
                <span className="lic-c-dot lic-c-dot--done">
                  <Check aria-hidden size={16} />
                </span>
                <span>
                  <b>{i.field.label}</b>
                  <small>{resolutionText(r.resolution[i.field.id])}</small>
                </span>
                <button
                  type="button"
                  className="lic-c-btn lic-c-btn--small"
                  onClick={() => r.undo(i.field.id)}
                >
                  <Undo2 aria-hidden size={16} /> Undo
                </button>
              </li>
            ))}
        </ul>
      ) : null}
    </Step>
  );
}

// ------------------------------------------------------------------ 5 status

function Status({ j, go }: { j: Journey; go: Go }) {
  const cur = currentStage(j.review);
  return (
    <Step
      title="Where your application goes"
      lead={
        <>
          You are at <b>{stages[cur]?.label}</b>. Nothing has gone to the{' '}
          <Term id="rec" p="lic-c" /> yet.
        </>
      }
      foot={
        cur === 0 ? (
          <button
            type="button"
            className="lic-c-btn lic-c-btn--primary"
            onClick={() => go('review')}
          >
            Fix my application <ArrowRight aria-hidden size={22} />
          </button>
        ) : (
          <button
            type="button"
            className="lic-c-btn lic-c-btn--primary"
            onClick={() => go('navigator')}
          >
            Back to the start <ArrowRight aria-hidden size={22} />
          </button>
        )
      }
    >
      <ol className="lic-c-stages">
        {stages.map((s, k) => (
          <li
            key={s.label}
            className={k < cur ? 'is-done' : k === cur ? 'is-now' : ''}
            aria-current={k === cur ? 'step' : undefined}
          >
            <span className="lic-c-stop" aria-hidden>
              {k < cur ? <Check size={16} /> : k + 1}
            </span>
            <div>
              <h2>
                {s.label}
                <small>{k < cur ? 'Done' : k === cur ? 'You are here' : 'Later'}</small>
              </h2>
              <p>{s.what}</p>
              <p className="lic-c-who">Who decides. {s.who}.</p>
            </div>
          </li>
        ))}
      </ol>
      <p className="lic-c-illus">
        <Info aria-hidden size={20} /> {STAGES_NOTE}
      </p>
    </Step>
  );
}

// ------------------------------------------------------------------ shell

export function VariantC() {
  const [screen, go] = useScreen(SCREENS);
  const j = useJourney();
  const at = ROUTE.findIndex((s) => s.id === screen);
  return (
    <div className="lic-c">
      <header className="lic-c-top">
        <div className="lic-c-top-in">
          <p className="lic-c-brand">Captain&apos;s Academy</p>
          <p className="lic-c-sample" title={DEMO_NOTICE}>
            Sample data
          </p>
        </div>
        <nav aria-label="Your route">
          <ol className="lic-c-route">
            {ROUTE.map((s, i) => (
              <li key={s.id} className={i < at ? 'is-done' : i === at ? 'is-now' : ''}>
                <button
                  type="button"
                  aria-current={i === at ? 'step' : undefined}
                  onClick={() => go(s.id)}
                >
                  <span aria-hidden>{i < at ? <Check size={16} /> : i + 1}</span>
                  {s.label}
                </button>
              </li>
            ))}
          </ol>
        </nav>
      </header>
      <main className="lic-c-main">
        {screen === 'navigator' && <Which j={j} go={go} />}
        {screen === 'have' && <Have j={j} go={go} />}
        {screen === 'missing' && <Missing j={j} go={go} />}
        {screen === 'review' && <Fix j={j} go={go} />}
        {screen === 'status' && <Status j={j} go={go} />}
      </main>
    </div>
  );
}
