import * as React from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Check,
  ClipboardCheck,
  Compass,
  FileText,
  Flag,
  Info,
  Map as MapIcon,
  Undo2,
} from 'lucide-react';
import { useScreen, liveHref } from '../shared/routes';
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
  formsStillMissing,
  issueLabel,
  issues,
  resolutionText,
  stages,
  useJourney,
  type Journey,
  type Tone,
} from './logic';
import './variant-a.css';

const SCREENS = ['navigator', 'choose', 'needs', 'review', 'status'] as const;
type Screen = (typeof SCREENS)[number];
type Go = (s: Screen) => void;

const TABS: { id: Screen; label: string; Icon: typeof Compass }[] = [
  { id: 'navigator', label: 'Route', Icon: Compass },
  { id: 'choose', label: 'Goal', Icon: Flag },
  { id: 'needs', label: 'Needs', Icon: FileText },
  { id: 'review', label: 'Review', Icon: ClipboardCheck },
  { id: 'status', label: 'Status', Icon: MapIcon },
];

function Tag({ tone, children }: { tone: Tone | 'back'; children: React.ReactNode }) {
  const Icon =
    tone === 'done' ? Check : tone === 'need' ? AlertTriangle : tone === 'back' ? Info : null;
  return (
    <span className={`lic-a-tag lic-a-tag--${tone}`}>
      {Icon ? <Icon aria-hidden size={14} /> : null}
      {children}
    </span>
  );
}

function Ring({
  done,
  of,
  label,
  tone,
}: {
  done: number;
  of: number;
  label: string;
  tone: 'ice' | 'amber';
}) {
  const r = 52;
  const c = 2 * Math.PI * r;
  const frac = Math.min(done / of, 1);
  return (
    <figure className="lic-a-ring">
      <svg viewBox="0 0 130 130" role="img" aria-label={`${label}, ${done} of ${of} days`}>
        <circle cx="65" cy="65" r={r} className="lic-a-ring-bg" />
        <circle
          cx="65"
          cy="65"
          r={r}
          className={`lic-a-ring-fg lic-a-ring-fg--${tone}`}
          strokeDasharray={`${c * frac} ${c}`}
          transform="rotate(-90 65 65)"
        />
      </svg>
      <div className="lic-a-ring-num" aria-hidden>
        <b>{done}</b>
        <span>of {of} days</span>
      </div>
      <figcaption>
        {label}
        <b>{Math.max(of - done, 0)} days to go</b>
      </figcaption>
    </figure>
  );
}

function Panel({
  title,
  count,
  area,
  lamp,
  children,
  id,
}: {
  title: string;
  count?: string;
  area: string;
  lamp?: boolean;
  children: React.ReactNode;
  id?: string;
}) {
  const hid = React.useId();
  return (
    <section
      id={id}
      className={`lic-a-panel lic-a-p-${area}${lamp ? ' lic-a-lamp' : ''}`}

      aria-labelledby={hid}
    >
      <h2 id={hid} className="lic-a-ph">
        {title}
        {count ? <span>{count}</span> : null}
      </h2>
      {children}
    </section>
  );
}

function Illustrative({ j }: { j: Journey }) {
  if (j.license.verified) {
    return (
      <p className="lic-a-cite">
        <b>{j.license.cfr.join(' · ')}</b> · sea-service figures checked against the current text.
      </p>
    );
  }
  return (
    <p className="lic-a-illus">
      <Info aria-hidden size={16} /> Illustrative. {ILLUSTRATIVE}.
    </p>
  );
}

// ------------------------------------------------------------------ navigator

const ROUTE = ['Pick license', 'Credentials', 'Sea time', 'Exam', 'Apply to NMC'];

function Navigator({ j, go }: { j: Journey; go: Go }) {
  const [filter, setFilter] = React.useState<'all' | 'open'>('all');
  const met = j.reqs.filter((r) => r.tone === 'done').length;
  const rows = filter === 'all' ? j.reqs : j.reqs.filter((r) => r.tone !== 'done');
  const missing = j.reqs.filter((r) => r.tone !== 'done');
  const v = j.seaView;
  return (
    <>
      <div className="lic-a-head">
        <div>
          <p className="lic-a-eyebrow">License navigator</p>
          <h1>Your route to {j.license.name}</h1>
          <p className="lic-a-sub">
            Jordan Sample, fictional mariner. No <Term id="mmc" p="lic-a" /> yet.{' '}
            <Term id="oupv" p="lic-a" /> is the <Term id="six-pack" p="lic-a" /> license.
          </p>
        </div>
        <div className="lic-a-head-right">
          <span className="lic-a-chip">
            <span className="lic-a-k">Goal</span>
            {j.license.name}
          </span>
          <button type="button" className="lic-a-btn" onClick={() => go('choose')}>
            Change goal
          </button>
        </div>
      </div>

      <section className="lic-a-panel lic-a-route" aria-label="Passage plan">
        <h2 className="lic-a-ph">
          Passage plan<span>Step 3 of 5</span>
        </h2>
        <ol>
          {ROUTE.map((s, i) => (
            <li
              key={s}
              className={i < 2 ? 'is-done' : i === 2 ? 'is-now' : ''}
              aria-current={i === 2 ? 'step' : undefined}
            >
              <i aria-hidden />
              {s}
              <span className="lic-a-sr">
                {i < 2 ? ', done' : i === 2 ? ', you are here' : ', later'}
              </span>
            </li>
          ))}
        </ol>
      </section>

      <div className="lic-a-grid lic-a-grid--nav">
        <div className="lic-a-col">
          <Panel title="Sea-service progress" area="sea">
            <div className="lic-a-rings">
              <Ring done={v.anyDone} of={v.anyReq} label="Any waters" tone="ice" />
              {v.ncApplies ? (
                <Ring done={v.ncDone} of={v.ncReq} label="Ocean or near coastal" tone="amber" />
              ) : null}
            </div>
            <p className="lic-a-note">
              Logged sea time <b>appears to meet</b> {v.ncApplies ? '0 of 2' : '0 of 1'} sea-service
              parts so far. {seaTime.backfilledDays} backfilled days are included and labeled.{' '}
              {NMC_NOTICE.split('.')[0]}.
            </p>
            <Illustrative j={j} />
          </Panel>
          <Panel
            title="Earned credentials"
            count={`${heldCredentials.filter((c) => c.status !== 'extra').length} on file`}
            area="creds"
          >
            <ul className="lic-a-rows">
              {heldCredentials.map((c) => (
                <li key={c.id}>
                  <div className="lic-a-row-top">
                    <div>
                      <p className="lic-a-t">{c.name}</p>
                      <p className="lic-a-d">{c.detail}</p>
                    </div>
                    <Tag
                      tone={
                        c.status === 'on-file' ? 'done' : c.status === 'expiring' ? 'need' : 'idle'
                      }
                    >
                      {c.status === 'on-file'
                        ? 'On file'
                        : c.status === 'expiring'
                          ? 'Closing soon'
                          : 'Extra'}
                    </Tag>
                  </div>
                </li>
              ))}
            </ul>
          </Panel>
        </div>
        <div className="lic-a-col">
          <Panel
            title={`Requirements · ${j.license.short}`}
            count={`${met} of ${j.reqs.length} appear met`}
            area="req"
          >
            <div className="lic-a-seg" role="group" aria-label="Show requirements">
              <button
                type="button"
                aria-pressed={filter === 'all'}
                onClick={() => setFilter('all')}
              >
                All {j.reqs.length}
              </button>
              <button
                type="button"
                aria-pressed={filter === 'open'}
                onClick={() => setFilter('open')}
              >
                Still needed {missing.length}
              </button>
            </div>
            <ul className="lic-a-rows">
              {rows.map((r) => (
                <li key={r.id}>
                  <div className="lic-a-row-top">
                    <div>
                      <p className="lic-a-t">{r.label}</p>
                      <p className="lic-a-d">
                        {r.detail}
                        {r.illustrative ? <em> · illustrative</em> : null}
                      </p>
                    </div>
                    <Tag tone={r.tone}>{r.statusText}</Tag>
                  </div>
                  {r.gauge ? (
                    <div className="lic-a-track" aria-hidden>
                      <i
                        className={r.id === 'sea-nc' ? 'amber' : ''}
                        style={{ width: `${Math.min((r.gauge.done / r.gauge.of) * 100, 100)}%` }}
                      />
                    </div>
                  ) : null}
                  {r.id === 'sea-any' ? (
                    <p className="lic-a-d">
                      {seaTime.gpsDays} GPS-logged + {seaTime.backfilledDays}{' '}
                      <Tag tone="back">backfilled</Tag>
                    </p>
                  ) : null}
                </li>
              ))}
            </ul>
            <Illustrative j={j} />
          </Panel>
        </div>
        <div className="lic-a-col">
          <Panel title="Next step" area="next" lamp>
            <p className="lic-a-big">{j.next.title}</p>
            <p className="lic-a-muted">{j.next.why}</p>
            <div className="lic-a-actions">
              {j.next.to === 'review' ? (
                <button
                  type="button"
                  className="lic-a-btn lic-a-btn--primary"
                  onClick={() => go('review')}
                >
                  {j.next.cta} <ArrowRight aria-hidden size={18} />
                </button>
              ) : (
                <a className="lic-a-btn lic-a-btn--primary" href={liveHref('sea-time', 'a')}>
                  {j.next.cta} <ArrowRight aria-hidden size={18} />
                </a>
              )}
              <button type="button" className="lic-a-btn" onClick={() => go('needs')}>
                What does it need?
              </button>
            </div>
          </Panel>
          <Panel title="Still missing" count={`${missing.length} items`} area="missing">
            {missing.length === 0 ? (
              <p className="lic-a-muted">Nothing is missing from this list.</p>
            ) : (
              <ul className="lic-a-missing">
                {missing.map((r) => (
                  <li key={r.id}>
                    <span className="lic-a-t">{r.label}</span>
                    <span className="lic-a-d">{r.detail}</span>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
          <Panel title="Plain words" area="words">
            <Glossary p="lic-a" />
          </Panel>
        </div>
      </div>
    </>
  );
}

// ------------------------------------------------------------------ choose

function Choose({ j, go }: { j: Journey; go: Go }) {
  const [filter, setFilter] = React.useState<'all' | 'original' | 'held'>('all');
  const list = licenses.filter((l) =>
    filter === 'all' ? true : filter === 'original' ? l.kind === 'original' : false,
  );
  return (
    <>
      <div className="lic-a-head">
        <div>
          <p className="lic-a-eyebrow">Goal</p>
          <h1>Choose your license</h1>
          <p className="lic-a-sub">Pick one and every screen follows it.</p>
        </div>
      </div>
      <div className="lic-a-seg" role="group" aria-label="Show licenses">
        <button type="button" aria-pressed={filter === 'all'} onClick={() => setFilter('all')}>
          All {licenses.length}
        </button>
        <button
          type="button"
          aria-pressed={filter === 'original'}
          onClick={() => setFilter('original')}
        >
          First license
        </button>
        <button type="button" aria-pressed={filter === 'held'} onClick={() => setFilter('held')}>
          Upgrades from one I hold
        </button>
      </div>
      <div className="lic-a-grid lic-a-grid--choose">
        <section className="lic-a-panel" aria-label="Licenses">
          {list.length === 0 ? (
            <div className="lic-a-empty">
              <h2>No upgrades yet</h2>
              <p>
                An upgrade builds on a license you already hold, and Jordan holds none. The first
                license comes first. Show the first licenses to pick one.
              </p>
              <button type="button" className="lic-a-btn" onClick={() => setFilter('original')}>
                Show first licenses
              </button>
            </div>
          ) : (
            <ul className="lic-a-pick">
              {list.map((l) => (
                <li key={l.id}>
                  <button
                    type="button"
                    aria-pressed={j.license.id === l.id}
                    onClick={() => j.setLicenseId(l.id)}
                  >
                    <span className="lic-a-t">{l.name}</span>
                    <span className="lic-a-d">{l.summary}</span>
                    <span className="lic-a-pick-meta">
                      <Tag tone={l.verified ? 'done' : 'idle'}>
                        {l.verified ? 'Checked' : 'Illustrative'}
                      </Tag>
                      <span className="lic-a-d">
                        {l.kind === 'original' ? 'First license' : 'Upgrade'}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section className="lic-a-panel lic-a-lamp" aria-label="Selected license">
          <h2 className="lic-a-ph">Your goal</h2>
          <p className="lic-a-big">{j.license.name}</p>
          <p className="lic-a-muted">{j.license.summary}</p>
          <dl className="lic-a-facts">
            <div>
              <dt>Sea time, any waters</dt>
              <dd>{j.license.totalDays} days</dd>
            </div>
            <div>
              <dt>Of which ocean or near coastal</dt>
              <dd>
                {j.license.nearCoastalDays > 0
                  ? `${j.license.nearCoastalDays} days`
                  : 'Not asked for'}
              </dd>
            </div>
          </dl>
          <Illustrative j={j} />
          <div className="lic-a-actions">
            <button
              type="button"
              className="lic-a-btn lic-a-btn--primary"
              onClick={() => go('needs')}
            >
              See what it needs <ArrowRight aria-hidden size={18} />
            </button>
            <button type="button" className="lic-a-btn" onClick={() => go('navigator')}>
              Back to route
            </button>
          </div>
        </section>
      </div>
    </>
  );
}

// ------------------------------------------------------------------ needs

function Needs({ j, go }: { j: Journey; go: Go }) {
  const [filter, setFilter] = React.useState<'all' | 'missing'>('all');
  const list =
    filter === 'all'
      ? j.forms
      : formsStillMissing(j.forms).filter((f) => !(f.id === 'cg-719b' && j.review.passed));
  const v = j.seaView;
  return (
    <>
      <div className="lic-a-head">
        <div>
          <p className="lic-a-eyebrow">Needs · {j.license.short}</p>
          <h1>What this license needs</h1>
          <p className="lic-a-sub">
            Forms, papers, the exam and sea time. Sea-time figures only are checked for OUPV near
            coastal.
          </p>
        </div>
      </div>
      <div className="lic-a-seg" role="group" aria-label="Show forms">
        <button type="button" aria-pressed={filter === 'all'} onClick={() => setFilter('all')}>
          All papers {j.forms.length}
        </button>
        <button
          type="button"
          aria-pressed={filter === 'missing'}
          onClick={() => setFilter('missing')}
        >
          Still missing
        </button>
      </div>
      <div className="lic-a-grid lic-a-grid--needs">
        <section className="lic-a-panel" aria-label="Forms and papers">
          <h2 className="lic-a-ph">Forms and papers</h2>
          {list.length === 0 ? (
            <div className="lic-a-empty">
              <h2>Nothing missing</h2>
              <p>Every form and paper is done or in with the NMC. Show all papers to look again.</p>
            </div>
          ) : (
            <ul className="lic-a-rows">
              {list.map((f) => (
                <li key={f.id}>
                  <div className="lic-a-row-top">
                    <div>
                      <p className="lic-a-t">
                        {f.code} · {f.name}
                      </p>
                      <p className="lic-a-d">{f.plain}</p>
                      <p className="lic-a-d">{formDetail(f, j.review)}</p>
                    </div>
                    <Tag tone={formEffectiveTone(f, j.review)}>
                      {formStatusText(f.status, j.review, f.id)}
                    </Tag>
                  </div>
                  {f.id === 'cg-719b' ? (
                    <button type="button" className="lic-a-btn" onClick={() => go('review')}>
                      Review CG-719B
                    </button>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </section>
        <div className="lic-a-stack">
          <section className="lic-a-panel" aria-label="Exam or course">
            <h2 className="lic-a-ph">Exam or approved course</h2>
            <p>{examNote}</p>
            <p className="lic-a-illus">
              <Info aria-hidden size={16} /> Illustrative.
            </p>
          </section>
          <section className="lic-a-panel" aria-label="Sea time">
            <h2 className="lic-a-ph">Sea time</h2>
            <p>
              {v.anyDone} of {v.anyReq} days any waters
              {v.ncApplies ? `, ${v.ncDone} of ${v.ncReq} near coastal` : ''}. Game time never
              counts as sea time.
            </p>
            <a className="lic-a-btn" href={liveHref('sea-time', 'a')}>
              Open the sea-time log <ArrowRight aria-hidden size={18} />
            </a>
          </section>
        </div>
      </div>
    </>
  );
}

// ------------------------------------------------------------------ review

function IssueCard({ j, n, id }: { j: Journey; n: number; id: string }) {
  const f = applicationFields.find((x) => x.id === id);
  const [zip, setZip] = React.useState('');
  const [err, setErr] = React.useState<string | null>(null);
  const zipId = React.useId();
  if (!f?.issue) return null;
  const res = j.review.resolution[id];
  if (res) {
    return (
      <li className="lic-a-issue is-done">
        <div className="lic-a-issue-head">
          <span className="lic-a-pin lic-a-pin--done">{n}</span>
          <div>
            <p className="lic-a-t">{f.issue.title}</p>
            <p className="lic-a-d">
              <Check aria-hidden size={14} /> {resolutionText(res)}
              {res === 'kept' ? '. The NMC may ask about it.' : ''}
            </p>
          </div>
        </div>
        <button
          type="button"
          className="lic-a-btn lic-a-btn--ghost"
          onClick={() => j.review.undo(id)}
        >
          <Undo2 aria-hidden size={16} /> Undo
        </button>
      </li>
    );
  }
  const isZip = id === 'address';
  return (
    <li className="lic-a-issue">
      <div className="lic-a-issue-head">
        <span className="lic-a-pin">{n}</span>
        <div>
          <p className="lic-a-t">{f.issue.title}</p>
          <p className="lic-a-d">{f.issue.help}</p>
        </div>
      </div>
      {f.issue.fix ? (
        <p className="lic-a-diff">
          <s>{f.value}</s>
          <span>{f.issue.fix}</span>
        </p>
      ) : null}
      {isZip ? (
        <div className="lic-a-zip">
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
            <p id={`${zipId}-e`} className="lic-a-err">
              {err}
            </p>
          ) : null}
        </div>
      ) : null}
      <div className="lic-a-actions">
        {isZip ? (
          <button
            type="button"
            className="lic-a-btn lic-a-btn--primary"
            onClick={() => setErr(j.review.typeZip(id, zip))}
          >
            Add ZIP code
          </button>
        ) : (
          <button
            type="button"
            className="lic-a-btn lic-a-btn--primary"
            onClick={() => j.review.applyFix(id)}
          >
            Apply fix
          </button>
        )}
        <button type="button" className="lic-a-btn" onClick={() => j.review.keep(id)}>
          Keep mine
        </button>
      </div>
    </li>
  );
}

function Review({ j, go }: { j: Journey; go: Go }) {
  const r = j.review;
  const sections = ['Applicant', 'Credential sought', 'Supporting documents'] as const;
  return (
    <>
      <div className="lic-a-head">
        <div>
          <p className="lic-a-eyebrow">Forms workspace</p>
          <h1>{j.license.short} application packet</h1>
          <p className="lic-a-sub">
            CG-719B is the application for a <Term id="mmc" p="lic-a" />. Goal: {j.license.name}.
          </p>
        </div>
        <div className="lic-a-head-right">
          <button type="button" className="lic-a-btn lic-a-btn--ghost" onClick={r.reset}>
            Reset demo
          </button>
        </div>
      </div>
      {j.license.id !== licenses[0]?.id ? (
        <p className="lic-a-illus">
          <Info aria-hidden size={16} /> This sample draft was started for OUPV · Near coastal. A
          different goal changes the endorsement check.
        </p>
      ) : null}
      <div className="lic-a-grid lic-a-grid--review">
        <section className="lic-a-panel lic-a-packet" aria-label="Packet">
          <h2 className="lic-a-ph">
            Required forms<span>{j.forms.length}</span>
          </h2>
          <ul className="lic-a-rows">
            {j.forms.map((f) => (
              <li key={f.id} className={f.id === 'cg-719b' ? 'is-current' : ''}>
                <div className="lic-a-row-top">
                  <div>
                    <p className="lic-a-t">{f.code}</p>
                    <p className="lic-a-d">{formDetail(f, r)}</p>
                  </div>
                  <Tag tone={formEffectiveTone(f, r)}>{formStatusText(f.status, r, f.id)}</Tag>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="lic-a-panel lic-a-form" aria-label="CG-719B draft">
          <h2 className="lic-a-ph">CG-719B · Application for MMC</h2>
          {sections.map((s) => (
            <fieldset key={s}>
              <legend>{s}</legend>
              <div className="lic-a-fields">
                {applicationFields
                  .filter((f) => f.section === s)
                  .map((f) => {
                    const res = r.resolution[f.id];
                    const n = issues.find((i) => i.field.id === f.id)?.n;
                    const open = f.issue && !res;
                    const inId = `lic-a-f-${f.id}`;
                    return (
                      <div
                        key={f.id}
                        className={`lic-a-field${open ? ' has-issue' : ''}${f.issue && res ? ' is-fixed' : ''}`}
                      >
                        <label htmlFor={inId}>
                          {f.label}
                          {n ? (
                            <span className={`lic-a-pin${res ? ' lic-a-pin--done' : ''}`}>{n}</span>
                          ) : null}
                        </label>
                        <input
                          id={inId}
                          readOnly
                          value={r.valueOf(f.id)}
                          aria-describedby={n ? `${inId}-m` : undefined}
                        />
                        {f.issue ? (
                          <p id={`${inId}-m`} className="lic-a-fmsg">
                            {open ? (
                              <>
                                <AlertTriangle aria-hidden size={14} />{' '}
                                {f.id === 'address' ? 'ZIP code missing' : f.issue.title}
                              </>
                            ) : (
                              <>
                                <Check aria-hidden size={14} /> {resolutionText(res)}
                              </>
                            )}
                          </p>
                        ) : null}
                      </div>
                    );
                  })}
              </div>
            </fieldset>
          ))}
        </section>

        <section className="lic-a-panel lic-a-precheck" aria-label="Pre-check review">
          <h2 className="lic-a-ph">
            Pre-check review
            <span aria-live="polite">
              {r.total - r.openCount} of {r.total} done
            </span>
          </h2>
          <p className={`lic-a-status ${r.passed ? 'is-pass' : ''}`} role="status">
            {r.passed ? <Check aria-hidden size={18} /> : <AlertTriangle aria-hidden size={18} />}
            {r.passed ? 'Pre-check passed' : `Draft · ${issueLabel(r.openCount)} to fix`}
          </p>
          {r.passed ? (
            <div className="lic-a-empty">
              <h2>Nothing left to fix</h2>
              <p>
                Pre-check is not a Coast Guard decision. The <Term id="nmc" p="lic-a" /> decides.
                {r.keptCount > 0
                  ? ` You kept ${r.keptCount} value${r.keptCount > 1 ? 's' : ''} pre-check questioned.`
                  : ''}
              </p>
              <button
                type="button"
                className="lic-a-btn lic-a-btn--primary"
                onClick={() => go('status')}
              >
                See application status <ArrowRight aria-hidden size={18} />
              </button>
            </div>
          ) : null}
          <ol className="lic-a-issues">
            {issues.map((i) => (
              <IssueCard key={i.field.id} j={j} n={i.n} id={i.field.id} />
            ))}
          </ol>
          <p className="lic-a-note lic-a-note--back">
            <Tag tone="back">backfilled</Tag> {backfillNote}
          </p>
          <p className="lic-a-cite">
            Pre-check by Captain&apos;s Academy, not an NMC evaluation. Form rules are illustrative.
          </p>
        </section>
      </div>
    </>
  );
}

// ------------------------------------------------------------------ status

function Status({ j, go }: { j: Journey; go: Go }) {
  const cur = currentStage(j.review);
  const [sel, setSel] = React.useState<number | null>(null);
  const i = sel ?? cur;
  const s = stages[i] ?? stages[0];
  return (
    <>
      <div className="lic-a-head">
        <div>
          <p className="lic-a-eyebrow">Application status</p>
          <h1>Where your application is</h1>
          <p className="lic-a-sub">
            Jordan&apos;s packet is at <b>{stages[cur]?.label}</b>. Nothing has been sent to the{' '}
            <Term id="rec" p="lic-a" />.
          </p>
        </div>
        {cur === 0 ? (
          <div className="lic-a-head-right">
            <button
              type="button"
              className="lic-a-btn lic-a-btn--primary"
              onClick={() => go('review')}
            >
              Fix my application
            </button>
          </div>
        ) : null}
      </div>
      <div className="lic-a-grid lic-a-grid--status">
        <section className="lic-a-panel" aria-label="Stages">
          <h2 className="lic-a-ph">
            Stages
            <span>
              {cur + 1} of {stages.length}
            </span>
          </h2>
          <ol className="lic-a-stages">
            {stages.map((st, k) => (
              <li key={st.label} className={k < cur ? 'is-done' : k === cur ? 'is-now' : ''}>
                <button
                  type="button"
                  aria-pressed={k === i}
                  onClick={() => setSel(k)}
                  aria-current={k === cur ? 'step' : undefined}
                >
                  <i aria-hidden>{k < cur ? <Check size={14} /> : k + 1}</i>
                  <span className="lic-a-t">{st.label}</span>
                  <span className="lic-a-d">
                    {k < cur ? 'Done' : k === cur ? 'You are here' : 'Later'}
                  </span>
                </button>
              </li>
            ))}
          </ol>
        </section>
        <section className="lic-a-panel lic-a-lamp" aria-label="Stage detail" aria-live="polite">
          <h2 className="lic-a-ph">Stage {i + 1}</h2>
          <p className="lic-a-big">{s?.label}</p>
          <p className="lic-a-label">What happens</p>
          <p>{s?.what}</p>
          <p className="lic-a-label">Who decides</p>
          <p>{s?.who}</p>
          <p className="lic-a-illus">
            <Info aria-hidden size={16} /> {STAGES_NOTE}
          </p>
          <Glossary p="lic-a" />
        </section>
      </div>
    </>
  );
}

// ------------------------------------------------------------------ shell

export function VariantA() {
  const [screen, go] = useScreen(SCREENS);
  const j = useJourney();
  return (
    <div className="lic-a">
      <aside className="lic-a-banner" aria-label="Sample data">
        <b>Sample data</b> <span className="lic-a-long">· {DEMO_NOTICE}</span>
      </aside>
      <header className="lic-a-bar">
        <span className="lic-a-brand">
          CAPTAIN&apos;S ACADEMY<small>LICENSE &amp; FORMS</small>
        </span>
        <nav className="lic-a-tabs" aria-label="License steps">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              aria-current={screen === t.id ? 'page' : undefined}
              onClick={() => go(t.id)}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </header>
      <main className="lic-a-main">
        {screen === 'navigator' && <Navigator j={j} go={go} />}
        {screen === 'choose' && <Choose j={j} go={go} />}
        {screen === 'needs' && <Needs j={j} go={go} />}
        {screen === 'review' && <Review j={j} go={go} />}
        {screen === 'status' && <Status j={j} go={go} />}
      </main>
      <nav className="lic-a-tabbar" aria-label="License steps, bottom">
        {TABS.map(({ id, label, Icon }) => (
          <button
            key={id}
            type="button"
            aria-current={screen === id ? 'page' : undefined}
            onClick={() => go(id)}
          >
            <Icon aria-hidden size={22} />
            {label}
          </button>
        ))}
      </nav>
    </div>
  );
}
