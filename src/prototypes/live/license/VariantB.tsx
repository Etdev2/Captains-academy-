import * as React from 'react';
import { AlertTriangle, ArrowLeft, ArrowRight, Check, Circle, Info } from 'lucide-react';
import { liveHref, useScreen } from '../shared/routes';
import {
  DEMO_NOTICE,
  NMC_NOTICE,
  applicationFields,
  backfillNote,
  heldCredentials,
  licenses,
  seaTime,
} from '../shared/sample';
import {
  Glossary,
  ILLUSTRATIVE,
  STAGES_NOTE,
  Term,
  currentStage,
  examNote,
  formDetail,
  formEffectiveTone,
  formStatusText,
  issueLabel,
  issues,
  resolutionText,
  stages,
  useJourney,
  type Journey,
  type Tone,
} from './logic';
import './variant-b.css';

const SCREENS = ['navigator', 'choose', 'needs', 'review', 'status'] as const;
type Screen = (typeof SCREENS)[number];
type Go = (s: Screen) => void;

const STEPS: { id: Screen; label: string }[] = [
  { id: 'navigator', label: 'Overview' },
  { id: 'choose', label: 'License' },
  { id: 'needs', label: 'Packet' },
  { id: 'review', label: 'Check CG-719B' },
  { id: 'status', label: 'Status' },
];

function Tag({ tone, children }: { tone: Tone; children: React.ReactNode }) {
  return (
    <span className={`lic-b-tag lic-b-tag--${tone}`}>
      {tone === 'done' ? (
        <Check aria-hidden size={16} />
      ) : tone === 'need' ? (
        <AlertTriangle aria-hidden size={16} />
      ) : (
        <Circle aria-hidden size={16} />
      )}
      {children}
    </span>
  );
}

function Illus({ j }: { j: Journey }) {
  return j.license.verified ? (
    <p className="lic-b-cite">Sea-service figures checked against {j.license.cfr.join(' and ')}.</p>
  ) : (
    <p className="lic-b-illus">
      <Info aria-hidden size={18} /> Illustrative. {ILLUSTRATIVE}.
    </p>
  );
}

/** List on the left, detail on the right. On a phone, one at a time. */
function Split({
  open,
  onBack,
  list,
  detail,
  listLabel,
}: {
  open: boolean;
  onBack: () => void;
  list: React.ReactNode;
  detail: React.ReactNode;
  listLabel: string;
}) {
  return (
    <div className="lic-b-split" data-open={open}>
      <nav className="lic-b-list" aria-label={listLabel}>
        {list}
      </nav>
      <section className="lic-b-detail" aria-live="polite">
        <button type="button" className="lic-b-back" onClick={onBack}>
          <ArrowLeft aria-hidden size={18} /> Back to the list
        </button>
        {detail}
      </section>
    </div>
  );
}

// ------------------------------------------------------------------ overview

function Navigator({ j, go }: { j: Journey; go: Go }) {
  const [sel, setSel] = React.useState<string>('sea-any');
  const [open, setOpen] = React.useState(false);
  const [onlyOpen, setOnlyOpen] = React.useState(false);
  const rows = onlyOpen ? j.reqs.filter((r) => r.tone !== 'done') : j.reqs;
  const cur = j.reqs.find((r) => r.id === sel) ?? j.reqs[0];
  const met = j.reqs.filter((r) => r.tone === 'done').length;
  return (
    <>
      <div className="lic-b-intro">
        <div>
          <h1>Your route to {j.license.name}</h1>
          <p className="lic-b-lede">
            <Term id="oupv" p="lic-b" /> is the <Term id="six-pack" p="lic-b" /> license. Jordan
            holds no <Term id="mmc" p="lic-b" /> yet, so this would be the first.
          </p>
          <p className="lic-b-lede">
            Your logged sea time <b>appears to meet</b> 0 of {j.seaView.ncApplies ? 2 : 1}{' '}
            sea-service parts so far. {met} of {j.reqs.length} items appear met.
          </p>
          <Illus j={j} />
        </div>
        <aside className="lic-b-next" aria-label="Next step">
          <p className="lic-b-eyebrow">Next step</p>
          <p className="lic-b-next-t">{j.next.title}</p>
          <p>{j.next.why}</p>
          {j.next.to === 'review' ? (
            <button
              type="button"
              className="lic-b-btn lic-b-btn--primary"
              onClick={() => go('review')}
            >
              {j.next.cta} <ArrowRight aria-hidden size={20} />
            </button>
          ) : (
            <a className="lic-b-btn lic-b-btn--primary" href={liveHref('sea-time', 'b')}>
              {j.next.cta} <ArrowRight aria-hidden size={20} />
            </a>
          )}
        </aside>
      </div>

      <h2 className="lic-b-h2">Checklist for {j.license.short}</h2>
      <label className="lic-b-check">
        <input type="checkbox" checked={onlyOpen} onChange={(e) => setOnlyOpen(e.target.checked)} />
        Show only what is still needed
      </label>
      <Split
        open={open}
        onBack={() => setOpen(false)}
        listLabel="Requirements"
        list={
          <ul>
            {rows.map((r) => (
              <li key={r.id}>
                <button
                  type="button"
                  aria-current={cur?.id === r.id ? 'true' : undefined}
                  onClick={() => {
                    setSel(r.id);
                    setOpen(true);
                  }}
                >
                  <span className="lic-b-row-t">{r.label}</span>
                  <span className="lic-b-row-d">{r.detail}</span>
                  <Tag tone={r.tone}>{r.statusText}</Tag>
                </button>
              </li>
            ))}
          </ul>
        }
        detail={
          cur ? (
            <>
              <h3>{cur.label}</h3>
              <Tag tone={cur.tone}>{cur.statusText}</Tag>
              <p className="lic-b-big">{cur.detail}</p>
              {cur.gauge ? (
                <div
                  className="lic-b-bar"
                  role="img"
                  aria-label={`${cur.gauge.done} of ${cur.gauge.of} days`}
                >
                  <i
                    style={{ width: `${Math.min((cur.gauge.done / cur.gauge.of) * 100, 100)}%` }}
                  />
                </div>
              ) : null}
              {cur.id === 'sea-any' ? (
                <p>
                  {seaTime.gpsDays} days GPS-logged and {seaTime.backfilledDays} days{' '}
                  <b>backfilled</b>. Backfilled days stay labeled and need the owner&apos;s
                  signature. Game time never counts.
                </p>
              ) : null}
              {cur.id === 'application' ? (
                <p>
                  {j.review.passed
                    ? 'Pre-check passed. Not a Coast Guard decision.'
                    : 'Pre-check found fields to correct.'}
                </p>
              ) : null}
              {cur.illustrative ? (
                <p className="lic-b-illus">
                  <Info aria-hidden size={18} /> Illustrative. This rule is not yet checked against
                  46 CFR.
                </p>
              ) : (
                <p className="lic-b-cite">Checked against {j.license.cfr.join(' and ')}.</p>
              )}
              <div className="lic-b-actions">
                {cur.area === 'sea-time' ? (
                  <a className="lic-b-btn" href={liveHref('sea-time', 'b')}>
                    Open the sea-time log
                  </a>
                ) : cur.id === 'application' ? (
                  <button type="button" className="lic-b-btn" onClick={() => go('review')}>
                    Check the application
                  </button>
                ) : (
                  <button type="button" className="lic-b-btn" onClick={() => go('needs')}>
                    See it in the packet
                  </button>
                )}
              </div>
            </>
          ) : (
            <EmptyList />
          )
        }
      />
      {rows.length === 0 ? <EmptyList /> : null}
      <section className="lic-b-card" aria-label="Credentials on file">
        <h2 className="lic-b-h3">Credentials on file</h2>
        <ul className="lic-b-plain">
          {heldCredentials.map((c) => (
            <li key={c.id}>
              <b>{c.name}</b>. {c.detail}
            </li>
          ))}
        </ul>
      </section>
      <section className="lic-b-card" aria-label="Plain words">
        <h2 className="lic-b-h3">Words used here</h2>
        <Glossary p="lic-b" />
      </section>
    </>
  );
}

function EmptyList() {
  return (
    <div className="lic-b-empty">
      <h3>Nothing left on this list</h3>
      <p>Every item appears met. The National Maritime Center still makes the decision.</p>
    </div>
  );
}

// ------------------------------------------------------------------ choose

function Choose({ j, go }: { j: Journey; go: Go }) {
  const [filter, setFilter] = React.useState<'all' | 'original' | 'held'>('all');
  const list = licenses.filter((l) =>
    filter === 'all' ? true : filter === 'original' ? l.kind === 'original' : false,
  );
  const selId = React.useId();
  return (
    <>
      <h1>Choose a license</h1>
      <p className="lic-b-lede">
        Your choice changes the checklist, the packet and the sea-time figures.
      </p>
      <div className="lic-b-field lic-b-field--inline">
        <label htmlFor={selId}>Show</label>
        <select
          id={selId}
          value={filter}
          onChange={(e) => setFilter(e.target.value as typeof filter)}
        >
          <option value="all">All licenses</option>
          <option value="original">First licenses</option>
          <option value="held">Upgrades from a license I hold</option>
        </select>
      </div>
      <div className="lic-b-two">
        <fieldset className="lic-b-radios">
          <legend>Target license</legend>
          {list.length === 0 ? (
            <div className="lic-b-empty">
              <h3>No upgrades yet</h3>
              <p>
                An upgrade builds on a license you already hold. Jordan holds none, so the first
                license comes first.
              </p>
              <button type="button" className="lic-b-btn" onClick={() => setFilter('original')}>
                Show first licenses
              </button>
            </div>
          ) : (
            list.map((l) => (
              <label key={l.id} className="lic-b-radio">
                <input
                  type="radio"
                  name="license"
                  checked={j.license.id === l.id}
                  onChange={() => j.setLicenseId(l.id)}
                />
                <span>
                  <b>{l.name}</b>
                  <span className="lic-b-row-d">{l.summary}</span>
                  <span className="lic-b-row-d">
                    {l.kind === 'original' ? 'First license' : 'Upgrade'} ·{' '}
                    {l.verified ? 'figures checked' : 'illustrative'}
                  </span>
                </span>
              </label>
            ))
          )}
        </fieldset>
        <section className="lic-b-card" aria-label="License at a glance" aria-live="polite">
          <h2 className="lic-b-h3">{j.license.name} at a glance</h2>
          <table className="lic-b-table">
            <tbody>
              <tr>
                <th scope="row">Sea time, any waters</th>
                <td>{j.license.totalDays} days</td>
              </tr>
              <tr>
                <th scope="row">Of which ocean or near coastal</th>
                <td>
                  {j.license.nearCoastalDays > 0
                    ? `${j.license.nearCoastalDays} days`
                    : 'Not asked for'}
                </td>
              </tr>
              <tr>
                <th scope="row">Where Jordan is</th>
                <td>
                  {j.seaView.anyDone} days any waters
                  {j.seaView.ncApplies ? `, ${j.seaView.ncDone} near coastal` : ''}
                </td>
              </tr>
              <tr>
                <th scope="row">Rule</th>
                <td>{j.license.cfr.length ? j.license.cfr.join(', ') : 'Citation to come'}</td>
              </tr>
            </tbody>
          </table>
          <Illus j={j} />
          <div className="lic-b-actions">
            <button
              type="button"
              className="lic-b-btn lic-b-btn--primary"
              onClick={() => go('needs')}
            >
              See what it needs <ArrowRight aria-hidden size={20} />
            </button>
          </div>
        </section>
      </div>
    </>
  );
}

// ------------------------------------------------------------------ needs

const CHECKLISTS: Record<string, string[]> = {
  'cg-719b': [
    'Legal name matches your ID',
    'Mailing address has a ZIP code',
    'Endorsement matches your goal',
  ],
  'cg-719s': ['Morro Dawn owner signed', 'Kelp Runner owner signature requested'],
  'cg-719k': ['Signed by a medical practitioner', 'Dated Aug 2026'],
  'cg-719p': ['Passed result on file', 'Still inside its usable window'],
  'first-aid-cert': ['Copy of both sides of the card', 'Card not expired'],
  'exam-cert': ['Pass the exam, or finish an approved course', 'Attach the proof'],
  'sea-time': ['Total sea time days', 'Near-coastal days', 'Owner signatures'],
};

function Needs({ j, go }: { j: Journey; go: Go }) {
  const [onlyMissing, setOnlyMissing] = React.useState(false);
  const [sel, setSel] = React.useState('cg-719b');
  const [open, setOpen] = React.useState(false);
  const items = [
    ...j.forms.map((f) => ({
      id: f.id,
      title: f.code === 'Certificate' ? f.name : `${f.code} · ${f.name}`,
      detail: formDetail(f, j.review),
      tone: formEffectiveTone(f, j.review),
      text: formStatusText(f.status, j.review, f.id),
      plain: f.plain,
    })),
    {
      id: 'sea-time',
      title: 'Sea time',
      detail: `${j.seaView.anyDone} of ${j.seaView.anyReq} days`,
      tone: 'need' as Tone,
      text: 'In progress',
      plain: 'The days you worked aboard, signed for by each vessel owner.',
    },
  ];
  const shown = onlyMissing ? items.filter((i) => i.tone !== 'done') : items;
  const cur = items.find((i) => i.id === sel) ?? items[0];
  return (
    <>
      <h1>Your {j.license.short} packet</h1>
      <p className="lic-b-lede">
        Forms, papers, the exam and sea time. {NMC_NOTICE.split('.')[0]}.
      </p>
      <Illus j={j} />
      <label className="lic-b-check">
        <input
          type="checkbox"
          checked={onlyMissing}
          onChange={(e) => setOnlyMissing(e.target.checked)}
        />
        Show only what is still missing
      </label>
      <Split
        open={open}
        onBack={() => setOpen(false)}
        listLabel="Packet"
        list={
          shown.length === 0 ? (
            <EmptyList />
          ) : (
            <ul>
              {shown.map((i) => (
                <li key={i.id}>
                  <button
                    type="button"
                    aria-current={cur?.id === i.id ? 'true' : undefined}
                    onClick={() => {
                      setSel(i.id);
                      setOpen(true);
                    }}
                  >
                    <span className="lic-b-row-t">{i.title}</span>
                    <span className="lic-b-row-d">{i.detail}</span>
                    <Tag tone={i.tone}>{i.text}</Tag>
                  </button>
                </li>
              ))}
            </ul>
          )
        }
        detail={
          cur ? (
            <>
              <h3>{cur.title}</h3>
              <Tag tone={cur.tone}>{cur.text}</Tag>
              <p className="lic-b-big">{cur.plain}</p>
              <h4>What goes in it</h4>
              <ul className="lic-b-ticks">
                {(CHECKLISTS[cur.id] ?? []).map((t) => (
                  <li key={t}>
                    <Circle aria-hidden size={16} /> {t}
                  </li>
                ))}
              </ul>
              {cur.id === 'exam-cert' ? <p>{examNote}</p> : null}
              {cur.id === 'cg-719s' ? <p>{backfillNote}</p> : null}
              <p className="lic-b-illus">
                <Info aria-hidden size={18} /> Form rules are illustrative until uscg-regs checks
                them.
              </p>
              <div className="lic-b-actions">
                {cur.id === 'cg-719b' ? (
                  <button
                    type="button"
                    className="lic-b-btn lic-b-btn--primary"
                    onClick={() => go('review')}
                  >
                    Check this form <ArrowRight aria-hidden size={20} />
                  </button>
                ) : null}
                {cur.id === 'sea-time' || cur.id === 'cg-719s' ? (
                  <a className="lic-b-btn" href={liveHref('sea-time', 'b')}>
                    Open the sea-time log
                  </a>
                ) : null}
              </div>
            </>
          ) : null
        }
      />
    </>
  );
}

// ------------------------------------------------------------------ review

function Review({ j, go }: { j: Journey; go: Go }) {
  const r = j.review;
  const [zip, setZip] = React.useState('');
  const [zipErr, setZipErr] = React.useState<string | null>(null);
  const sections = ['Applicant', 'Credential sought', 'Supporting documents'] as const;
  const open = issues.filter((i) => !r.resolution[i.field.id]);
  return (
    <>
      <h1>Check your CG-719B</h1>
      <p className="lic-b-lede">
        This is the application for a <Term id="mmc" p="lic-b" />. Pre-check finds typos and gaps.
        It is not a Coast Guard decision.
      </p>
      <div className="lic-b-review">
        <aside className="lic-b-summary" aria-label="Pre-check summary">
          <p className={`lic-b-state ${r.passed ? 'is-pass' : ''}`} role="status">
            {r.passed ? <Check aria-hidden size={20} /> : <AlertTriangle aria-hidden size={20} />}
            {r.passed ? 'Pre-check passed' : `${issueLabel(r.openCount)} to fix`}
          </p>
          <p className="lic-b-count" aria-live="polite">
            {r.total - r.openCount} of {r.total} done
          </p>
          <ol className="lic-b-sumlist">
            {issues.map((i) => {
              const res = r.resolution[i.field.id];
              return (
                <li key={i.field.id}>
                  <a href={`#lic-b-f-${i.field.id}`}>
                    {res ? (
                      <Check aria-hidden size={16} />
                    ) : (
                      <AlertTriangle aria-hidden size={16} />
                    )}
                    <span>
                      {i.field.label}
                      <small>{res ? resolutionText(res) : i.field.issue?.title}</small>
                    </span>
                  </a>
                </li>
              );
            })}
          </ol>
          {r.passed ? (
            <div className="lic-b-empty">
              <h3>Nothing left to fix</h3>
              <p>
                Next, the packet goes to a <Term id="rec" p="lic-b" />. The{' '}
                <Term id="nmc" p="lic-b" /> decides.
                {r.keptCount
                  ? ` You kept ${r.keptCount} value${r.keptCount > 1 ? 's' : ''} pre-check questioned.`
                  : ''}
              </p>
              <button
                type="button"
                className="lic-b-btn lic-b-btn--primary"
                onClick={() => go('status')}
              >
                See application status <ArrowRight aria-hidden size={20} />
              </button>
            </div>
          ) : null}
          <button type="button" className="lic-b-btn lic-b-btn--quiet" onClick={r.reset}>
            Reset demo
          </button>
        </aside>

        <form className="lic-b-form" onSubmit={(e) => e.preventDefault()} noValidate>
          {j.license.id !== licenses[0]?.id ? (
            <p className="lic-b-illus">
              <Info aria-hidden size={18} /> This sample draft was started for OUPV · Near coastal.
            </p>
          ) : null}
          {open.length > 0 ? (
            <div className="lic-b-errsum" role="alert">
              <h2>
                There {open.length === 1 ? 'is 1 thing' : `are ${open.length} things`} to check
              </h2>
              <ul>
                {open.map((i) => (
                  <li key={i.field.id}>
                    <a href={`#lic-b-f-${i.field.id}`}>{i.field.issue?.title}</a>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {sections.map((s, si) => (
            <fieldset key={s}>
              <legend>
                {si + 1}. {s}
              </legend>
              {applicationFields
                .filter((f) => f.section === s)
                .map((f) => {
                  const res = r.resolution[f.id];
                  const isOpen = !!f.issue && !res;
                  const id = `lic-b-f-${f.id}`;
                  return (
                    <div key={f.id} className={`lic-b-q${isOpen ? ' has-issue' : ''}`}>
                      <label htmlFor={id}>{f.label}</label>
                      <input
                        id={id}
                        readOnly
                        value={r.valueOf(f.id)}
                        aria-invalid={isOpen ? true : undefined}
                        aria-describedby={f.issue ? `${id}-m` : undefined}
                      />
                      {f.issue ? (
                        <div
                          id={`${id}-m`}
                          className="lic-b-msg"
                          data-state={isOpen ? 'open' : 'done'}
                        >
                          {isOpen ? (
                            <>
                              <p>
                                <AlertTriangle aria-hidden size={18} /> <b>{f.issue.title}.</b>{' '}
                                {f.issue.help}
                              </p>
                              {f.issue.fix ? (
                                <p>
                                  Suggested: <b>{f.issue.fix}</b>
                                </p>
                              ) : null}
                              {f.id === 'address' ? (
                                <div className="lic-b-zip">
                                  <label htmlFor={`${id}-zip`}>ZIP code</label>
                                  <input
                                    id={`${id}-zip`}
                                    inputMode="numeric"
                                    autoComplete="postal-code"
                                    value={zip}
                                    aria-invalid={zipErr ? true : undefined}
                                    onChange={(e) => {
                                      setZip(e.target.value);
                                      setZipErr(null);
                                    }}
                                  />
                                  {zipErr ? <p className="lic-b-error">{zipErr}</p> : null}
                                </div>
                              ) : null}
                              <div className="lic-b-actions">
                                {f.id === 'address' ? (
                                  <button
                                    type="button"
                                    className="lic-b-btn lic-b-btn--primary"
                                    onClick={() => setZipErr(r.typeZip(f.id, zip))}
                                  >
                                    Add ZIP code
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    className="lic-b-btn lic-b-btn--primary"
                                    onClick={() => r.applyFix(f.id)}
                                  >
                                    Use the suggestion
                                  </button>
                                )}
                                <button
                                  type="button"
                                  className="lic-b-btn"
                                  onClick={() => r.keep(f.id)}
                                >
                                  Keep what I typed
                                </button>
                              </div>
                            </>
                          ) : (
                            <p>
                              <Check aria-hidden size={18} /> {resolutionText(res)}.{' '}
                              <button
                                type="button"
                                className="lic-b-link"
                                onClick={() => r.undo(f.id)}
                              >
                                Undo
                              </button>
                            </p>
                          )}
                        </div>
                      ) : null}
                    </div>
                  );
                })}
            </fieldset>
          ))}
          <p className="lic-b-backfill">
            <b>Backfilled.</b> {backfillNote}
          </p>
        </form>
      </div>
    </>
  );
}

// ------------------------------------------------------------------ status

function Status({ j, go }: { j: Journey; go: Go }) {
  const cur = currentStage(j.review);
  return (
    <>
      <h1>Application status</h1>
      <p className="lic-b-lede">
        At <b>{stages[cur]?.label}</b>. Nothing has gone to the <Term id="rec" p="lic-b" /> yet.
      </p>
      {cur === 0 ? (
        <button type="button" className="lic-b-btn lic-b-btn--primary" onClick={() => go('review')}>
          Fix my application <ArrowRight aria-hidden size={20} />
        </button>
      ) : null}
      <table className="lic-b-stages">
        <caption>Six stages</caption>
        <thead>
          <tr>
            <th scope="col">Stage</th>
            <th scope="col">What happens</th>
            <th scope="col">Who decides</th>
          </tr>
        </thead>
        <tbody>
          {stages.map((s, k) => (
            <tr
              key={s.label}
              className={k === cur ? 'is-now' : ''}
              aria-current={k === cur ? 'step' : undefined}
            >
              <th scope="row">
                <span className="lic-b-stage-n">
                  {k < cur ? <Check aria-hidden size={16} /> : k + 1}
                </span>
                {s.label}
                <small>{k < cur ? 'Done' : k === cur ? 'You are here' : 'Later'}</small>
              </th>
              <td data-label="What happens">{s.what}</td>
              <td data-label="Who decides">{s.who}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="lic-b-illus">
        <Info aria-hidden size={18} /> {STAGES_NOTE}
      </p>
    </>
  );
}

// ------------------------------------------------------------------ shell

export function VariantB() {
  const [screen, go] = useScreen(SCREENS);
  const j = useJourney();
  return (
    <div className="lic-b">
      <header className="lic-b-top">
        <div className="lic-b-top-in">
          <p className="lic-b-brand">Captain&apos;s Academy · License &amp; forms</p>
          <p className="lic-b-sample" title={DEMO_NOTICE}>
            Sample data
          </p>
        </div>
        <nav className="lic-b-steps" aria-label="License steps">
          <ol>
            {STEPS.map((s, i) => (
              <li key={s.id}>
                <button
                  type="button"
                  aria-current={screen === s.id ? 'page' : undefined}
                  onClick={() => go(s.id)}
                >
                  <span>{i + 1}</span>
                  {s.label}
                </button>
              </li>
            ))}
          </ol>
        </nav>
      </header>
      <main className="lic-b-main">
        {screen === 'navigator' && <Navigator j={j} go={go} />}
        {screen === 'choose' && <Choose j={j} go={go} />}
        {screen === 'needs' && <Needs j={j} go={go} />}
        {screen === 'review' && <Review j={j} go={go} />}
        {screen === 'status' && <Status j={j} go={go} />}
      </main>
    </div>
  );
}
