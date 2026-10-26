import * as React from 'react';
import {
  ArrowLeft,
  Ban,
  BellRing,
  BookOpen,
  Check,
  ChevronRight,
  Clock,
  FileText,
  History,
  MapPin,
  Pencil,
  Plus,
  Send,
  Ship,
  ShieldCheck,
  Undo2,
} from 'lucide-react';
import { DEMO_NOTICE, seaTime } from '../shared/sample';
import type { VariantProps } from '../shared/types';
import { useScreen } from '../shared/routes';
import {
  applyFilters,
  CHECK_IN_TIME,
  creditLabel,
  fmtDate,
  fmtHours,
  noFilters,
  previewTrip,
  sheetFor,
  signatureLabel,
  sourceLabel,
  useLogbook,
  useTripForm,
  watersLabel,
  type Filters,
  type TripValues,
  type Logbook,
  type Row,
  type VesselView,
} from './logic';
import {
  ChoiceGroup,
  ExportSheet,
  HoursField,
  PreviewBox,
  SelectField,
  TextField,
  VesselForm,
} from './parts';
import './b.css';

const SCREENS = ['logbook', 'trip', 'add', 'vessels', 'export'] as const;
type Screen = (typeof SCREENS)[number];

const TABS: readonly { id: Screen; label: string }[] = [
  { id: 'logbook', label: 'Logbook' },
  { id: 'add', label: 'Add trip' },
  { id: 'vessels', label: 'Vessels' },
  { id: 'export', label: 'Export' },
];

function CreditMark({ r }: { r: Pick<Row, 'credit' | 'days'> }) {
  const label = creditLabel(r);
  if (r.credit === 'day')
    return (
      <span className="b-mark done">
        <Check aria-hidden="true" size={16} />
        {label}
      </span>
    );
  if (r.credit === 'four-to-eight')
    return (
      <span className="b-mark attn">
        <Clock aria-hidden="true" size={16} />
        {label}
      </span>
    );
  return (
    <span className="b-mark quiet">
      <Ban aria-hidden="true" size={16} />
      {label}
    </span>
  );
}

function SourceMark({ r }: { r: Pick<Row, 'source'> }) {
  if (r.source === 'backfilled')
    return (
      <span className="b-mark backfilled">
        <History aria-hidden="true" size={16} />
        Backfilled
      </span>
    );
  return (
    <span className="b-src">
      {r.source === 'gps' ? (
        <MapPin aria-hidden="true" size={16} />
      ) : (
        <Pencil aria-hidden="true" size={16} />
      )}
      {sourceLabel[r.source]}
    </span>
  );
}

function SigMark({ v }: { v: VesselView }) {
  if (v.signature === 'signed' && v.unsignedDays === 0)
    return (
      <span className="b-mark done">
        <ShieldCheck aria-hidden="true" size={16} />
        Signed
      </span>
    );
  return (
    <span className="b-mark attn">
      <Clock aria-hidden="true" size={16} />
      {v.signature === 'signed' ? `Signed, ${v.unsignedDays} new` : signatureLabel(v.signature)}
    </span>
  );
}

export default function CleanLight({ variant }: VariantProps) {
  const [screen, go] = useScreen<Screen>(SCREENS);
  const lb = useLogbook();
  const [selected, setSelected] = React.useState<string>('');
  void variant;
  return (
    <div className="sea-b">
      <header className="b-top">
        <div className="b-title">
          <BookOpen aria-hidden="true" size={28} />
          <div>
            <p className="b-name">Sea-time logbook</p>
            <p className="b-for">Toward OUPV near coastal · Jordan Sample</p>
          </div>
          <span className="b-sample" title={DEMO_NOTICE}>
            Sample data
          </span>
        </div>
        <nav className="b-tabs" aria-label="Logbook sections">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              aria-current={
                screen === t.id || (screen === 'trip' && t.id === 'logbook') ? 'page' : undefined
              }
              onClick={() => go(t.id)}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </header>
      <main className="b-main">
        {screen === 'logbook' || screen === 'trip' ? (
          <Logbook lb={lb} go={go} view={screen} selected={selected} select={setSelected} />
        ) : null}
        {screen === 'add' ? <Add lb={lb} go={go} /> : null}
        {screen === 'vessels' ? <Vessels lb={lb} /> : null}
        {screen === 'export' ? <Export lb={lb} /> : null}
      </main>
    </div>
  );
}

// ---------------------------------------------------------------- logbook

function Funnel({ lb }: { lb: Logbook }) {
  const s = lb.summary;
  const pct = (n: number) => `${Math.max(n === 0 ? 0 : 2, (n / s.recorded) * 100)}%`;
  const steps = [
    {
      k: 'recorded',
      label: 'Recorded',
      n: s.recorded,
      note: 'Every day with a log entry, counted or not.',
    },
    {
      k: 'counts',
      label: 'Appears to count',
      n: s.credited,
      note: `Under the day rules. ${s.recorded - s.credited} recorded days do not count: ${s.apart} are 4 to 8 hour days shown apart, ${s.notCredited} are too short.`,
    },
    {
      k: 'signed',
      label: 'Signed by an owner',
      n: s.signed,
      note: `${s.awaiting} appear to count but wait on a signature.`,
    },
    {
      k: 'nmc',
      label: 'Verified by the NMC',
      n: s.verified,
      note: 'None yet. The National Maritime Center verifies service only when it evaluates an application.',
    },
  ];
  return (
    <section className="b-card b-funnel" aria-labelledby="b-fun">
      <h2 id="b-fun">Where your days stand</h2>
      <ol>
        {steps.map((st) => (
          <li key={st.k} className={`step-${st.k}`}>
            <div className="line">
              <span className="lab">{st.label}</span>
              <span className="num">{st.n === 0 ? 'None' : st.n}</span>
            </div>
            <div className="bar" aria-hidden="true">
              <span style={{ width: pct(st.n) }} />
            </div>
            <p>{st.note}</p>
          </li>
        ))}
      </ol>
      <p className="b-rule">
        Of {s.totalRequired} days needed for OUPV near coastal, logged time{' '}
        <b>appears to meet 0 of 2</b> parts. Still needed: {s.totalToGo} days, {s.ncToGo} of them
        near coastal. Backfilled: {s.backfilled} days, always labeled. Simulator time (
        {s.simulatorHours} h) never counts.
      </p>
    </section>
  );
}

function explain(r: Row, v: VesselView | undefined): string[] {
  if (r.source === 'backfilled' && r.hours === null)
    return [
      `Entered after the fact for ${r.days} days. Each day is labeled backfilled and none shows as GPS-verified.`,
      'Appears to count as days under the 8 hour rule, if the hours you entered were right.',
    ];
  const p = previewTrip(
    {
      vesselId: r.vesselId,
      date: r.date,
      hours: String(r.hours ?? ''),
      waters: r.waters,
      role: r.role,
      source: r.source,
    } satisfies TripValues,
    v,
  );
  return p ? [p.headline + '.', p.detail, ...(p.waters ? [p.waters] : []), p.source] : [];
}

function Logbook({
  lb,
  go,
  view,
  selected,
  select,
}: {
  lb: Logbook;
  go: (s: Screen) => void;
  view: 'logbook' | 'trip';
  selected: string;
  select: (id: string) => void;
}) {
  const [f, setF] = React.useState<Filters>(noFilters);
  const rows = applyFilters(lb.rows, f);
  const current = lb.rows.find((r) => r.id === selected) ?? rows[0];
  const vesselOf = (r: Row | undefined) => lb.vessels.find((v) => v.id === r?.vesselId);
  const vname = lb.vessels.find((v) => v.id === lb.checkedIn)?.name;
  const s = lb.summary;
  return (
    <div className="b-page" data-view={view}>
      <div className="b-actions b-hide-detail">
        {lb.checkedIn ? (
          <button
            type="button"
            className="b-primary"
            onClick={() => {
              lb.checkOut();
              go('add');
            }}
          >
            Check out · log trip
          </button>
        ) : (
          <button
            type="button"
            className="b-primary"
            onClick={() => lb.checkIn(lb.rows[0]?.vesselId ?? 'morro-dawn')}
          >
            <Ship aria-hidden="true" size={24} />
            Check in · start trip
          </button>
        )}
        <button type="button" className="b-link" onClick={() => go('add')}>
          Add a past trip
          <ChevronRight aria-hidden="true" size={20} />
        </button>
      </div>
      {lb.checkedIn ? (
        <p className="b-note attn b-hide-detail" role="status">
          <MapPin aria-hidden="true" size={20} />
          <span>
            Underway on {vname} since {CHECK_IN_TIME}. Demo only: nothing is recorded.
          </span>
        </p>
      ) : null}
      {lb.lastAdded ? (
        <p className="b-note done b-hide-detail" role="status">
          <Check aria-hidden="true" size={20} />
          <span>
            Trip saved. Days that appear to count: {lb.lastAdded.before} → {lb.lastAdded.after}.
          </span>
          <button type="button" onClick={lb.undoAdd}>
            <Undo2 aria-hidden="true" size={18} />
            Undo
          </button>
        </p>
      ) : null}

      <h1 className="sr-only">Sea-time logbook</h1>
      <div className="b-funnel-wrap b-hide-detail">
        <Funnel lb={lb} />
      </div>

      <section className="b-card b-ledger b-hide-detail" aria-labelledby="b-led">
        <h2 id="b-led">Trip ledger</h2>
        <p className="b-sub">
          Showing {rows.length} of {lb.rows.length} entries from your {seaTime.totalTrips} trips.
          Select one for the detail.
        </p>
        <div className="b-filters">
          <SelectField
            id="b-f-vessel"
            label="Vessel"
            value={f.vessel}
            onChange={(v) => setF({ ...f, vessel: v })}
            options={[
              { value: '', label: 'All vessels' },
              ...lb.vessels.map((v) => ({ value: v.id, label: v.name })),
            ]}
          />
          <SelectField
            id="b-f-waters"
            label="Waters"
            value={f.waters}
            onChange={(v) => setF({ ...f, waters: v as Filters['waters'] })}
            options={[
              { value: '', label: 'All waters' },
              { value: 'near-coastal', label: 'Near coastal' },
              { value: 'inland', label: 'Inland' },
            ]}
          />
          <div className="b-seg" role="group" aria-label="Signature">
            <button
              type="button"
              aria-pressed={!f.waiting}
              onClick={() => setF({ ...f, waiting: false })}
            >
              All days
            </button>
            <button
              type="button"
              aria-pressed={f.waiting}
              onClick={() => setF({ ...f, waiting: true })}
            >
              Waiting on a signature
            </button>
          </div>
        </div>
        {rows.length === 0 ? (
          <div className="b-empty">
            <h3>{f.waiting ? 'Nothing is waiting on a signature.' : 'No entries match.'}</h3>
            <p>
              {f.waiting
                ? 'Every day that appears to count is signed for. A new trip shows here until its owner signs.'
                : 'No time logged on that vessel in those waters. Choose All waters, or add a trip.'}
            </p>
            <button type="button" className="b-secondary" onClick={() => setF(noFilters)}>
              Show every entry
            </button>
          </div>
        ) : (
          <>
            <div className="b-row b-head" aria-hidden="true">
              <span>Date</span>
              <span>Vessel</span>
              <span>Waters</span>
              <span className="r">Hours</span>
              <span>Credit</span>
              <span>Source</span>
            </div>
            <ul className="b-list">
              {rows.map((r) => (
                <li key={r.id}>
                  <button
                    type="button"
                    className="b-row"
                    aria-pressed={current?.id === r.id}
                    onClick={() => {
                      select(r.id);
                      go('trip');
                    }}
                  >
                    <span className="d">{fmtDate(r.date)}</span>
                    <span className="v">
                      <b>{r.vesselName}</b>
                      <small>{r.route}</small>
                    </span>
                    <span className="w">{watersLabel[r.waters]}</span>
                    <span className="h r">{fmtHours(r.hours)}</span>
                    <span className="c">
                      <CreditMark r={r} />
                    </span>
                    <span className="s">
                      <SourceMark r={r} />
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>

      <aside className="b-detail" aria-label="Entry detail">
        <button type="button" className="b-back" onClick={() => go('logbook')}>
          <ArrowLeft aria-hidden="true" size={22} />
          Back to the ledger
        </button>
        {current ? (
          <section className="b-card" aria-labelledby="b-det">
            <p className="b-kicker">{current.session ? 'Added in this demo' : 'Entry'}</p>
            <h2 id="b-det">
              {fmtDate(current.date)} · {current.vesselName}
            </h2>
            <dl className="b-dl">
              <dt>Route</dt>
              <dd>{current.route}</dd>
              <dt>Waters</dt>
              <dd>{watersLabel[current.waters]}</dd>
              <dt>Role</dt>
              <dd>{current.role}</dd>
              <dt>Hours</dt>
              <dd>{fmtHours(current.hours)}</dd>
              <dt>Credit</dt>
              <dd>
                <CreditMark r={current} />
              </dd>
              <dt>Source</dt>
              <dd>
                <SourceMark r={current} />
              </dd>
              <dt>Owner signature</dt>
              <dd>
                {current.credit !== 'day' ? (
                  'Nothing to sign. This entry has no credited day.'
                ) : current.signed ? (
                  <span className="b-mark done">
                    <ShieldCheck aria-hidden="true" size={16} />
                    Signed by {vesselOf(current)?.owner}
                  </span>
                ) : (
                  <span className="b-mark attn">
                    <Clock aria-hidden="true" size={16} />
                    Waiting on {vesselOf(current)?.owner}
                  </span>
                )}
              </dd>
            </dl>
            <h3>How it was credited</h3>
            {explain(current, vesselOf(current)).map((t) => (
              <p key={t}>{t}</p>
            ))}
          </section>
        ) : (
          <section className="b-card">
            <h2>No entry selected</h2>
            <p>Select a line in the ledger to read how it was credited.</p>
          </section>
        )}
        <section className="b-card b-hide-detail" aria-labelledby="b-req">
          <h2 id="b-req">Toward OUPV near coastal</h2>
          <BMeter label="Any waters" value={s.credited} max={s.totalRequired} />
          <BMeter label="Ocean or near coastal" value={s.nearCoastal} max={s.ncRequired} />
          <p className="b-cfr">{seaTime.cfr.join(' · ')}</p>
        </section>
      </aside>
    </div>
  );
}

function BMeter({ label, value, max }: { label: string; value: number; max: number }) {
  return (
    <div className="b-meter">
      <p>
        <span>{label}</span>
        <b>
          {value} / {max}
        </b>
      </p>
      <div
        className="trk"
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={value}
      >
        <span style={{ width: `${Math.min(100, (value / max) * 100)}%` }} />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- add

function Add({ lb, go }: { lb: Logbook; go: (s: Screen) => void }) {
  const form = useTripForm(lb, () => go('logbook'));
  const { values: v, set, errors } = form;
  const fromGps = lb.prefill?.source === 'gps';
  return (
    <div className="b-addpage">
      <div className="b-pagehead">
        <button type="button" className="b-back" onClick={() => go('logbook')}>
          <ArrowLeft aria-hidden="true" size={22} />
          Back to the ledger
        </button>
        <h1>Add a trip</h1>
        <p className="b-sub">
          Fill in the slip. The note beside it shows how the day would be credited.
        </p>
      </div>
      <form
        className="b-addgrid"
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          form.submit();
        }}
      >
        <section className="b-card b-slip" aria-label="Trip slip">
          <SelectField
            id="b-vessel"
            label="Vessel"
            value={v.vesselId}
            onChange={(x) => set('vesselId', x)}
            error={errors.vesselId}
            options={[
              { value: '', label: 'Pick a vessel' },
              ...lb.vessels.map((x) => ({ value: x.id, label: `${x.name} · ${x.grt} GRT` })),
            ]}
          />
          <TextField
            id="b-date"
            type="date"
            label="Date"
            value={v.date}
            onChange={(x) => set('date', x)}
            error={errors.date}
          />
          <HoursField
            id="b-hours"
            value={v.hours}
            onChange={(x) => set('hours', x)}
            error={errors.hours}
          />
          <ChoiceGroup
            name="b-waters"
            legend="Waters"
            value={v.waters}
            onChange={(x) => set('waters', x)}
            options={[
              {
                value: 'near-coastal',
                label: 'Near coastal',
                help: 'Ocean or near-coastal waters',
              },
              { value: 'inland', label: 'Inland', help: 'Bays, harbors, rivers, lakes' },
            ]}
          />
          <ChoiceGroup
            name="b-role"
            legend="Role"
            value={v.role}
            onChange={(x) => set('role', x)}
            options={[
              { value: 'Operator', label: 'Operator' },
              { value: 'Mate', label: 'Mate' },
              { value: 'Deckhand', label: 'Deckhand' },
            ]}
          />
          <ChoiceGroup
            name="b-source"
            legend="Source"
            value={v.source}
            onChange={(x) => set('source', x)}
            options={[
              {
                value: 'gps',
                label: 'GPS track',
                help: fromGps ? 'From your check-in' : 'Only from a check-in and check-out',
                disabled: !fromGps,
              },
              { value: 'manual', label: 'Entered by hand' },
              {
                value: 'backfilled',
                label: 'Backfilled',
                help: 'Entered after the fact. Always labeled.',
              },
            ]}
          />
        </section>
        <div className="b-margin">
          <PreviewBox preview={form.preview} credited={lb.summary.credited} idPrefix="b" />
          <button type="submit" className="b-primary">
            Save trip
          </button>
          {form.tried && Object.keys(errors).length > 0 ? (
            <p className="b-sub" role="alert">
              Fix the marked fields, then save again.
            </p>
          ) : null}
          <p className="b-sub">
            Simulator and game time never count as sea time, so they cannot be added here.
          </p>
        </div>
      </form>
    </div>
  );
}

// ---------------------------------------------------------------- vessels

function Vessels({ lb }: { lb: Logbook }) {
  const [sel, setSel] = React.useState<string>(lb.vessels[1]?.id ?? '');
  const [msg, setMsg] = React.useState('');
  const v = lb.vessels.find((x) => x.id === sel);
  const stage = !v ? 0 : v.signature === 'signed' ? 3 : v.signature === 'requested' ? 2 : 1;
  return (
    <div className="b-vpage">
      <div className="b-pagehead">
        <h1>Vessels</h1>
        <p className="b-sub">
          Tonnage decides how short days are credited. Each owner signs for the days you served
          aboard.
        </p>
      </div>
      <div className="b-vgrid">
        <section className="b-card" aria-labelledby="b-vl">
          <h2 id="b-vl">Your vessels</h2>
          <ul className="b-vlist">
            {lb.vessels.map((x) => (
              <li key={x.id}>
                <button
                  type="button"
                  aria-pressed={sel === x.id}
                  onClick={() => {
                    setSel(x.id);
                    setMsg('');
                  }}
                >
                  <span>
                    <b>{x.name}</b>
                    <small>
                      {x.type} · {x.grt} GRT · {x.credited} days
                    </small>
                  </span>
                  <SigMark v={x} />
                </button>
              </li>
            ))}
          </ul>
          <button
            type="button"
            className="b-secondary"
            aria-pressed={sel === 'new'}
            onClick={() => {
              setSel('new');
              setMsg('');
            }}
          >
            <Plus aria-hidden="true" size={20} />
            Add a vessel
          </button>
        </section>
        <section className="b-card" aria-live="polite">
          {sel === 'new' ? (
            <>
              <h2>New vessel</h2>
              <VesselForm
                idPrefix="b-v"
                onAdd={(x) => {
                  const id = lb.addVessel(x);
                  setSel(id);
                  setMsg(`${x.name.trim()} added. Ask its owner to sign when you are ready.`);
                }}
              />
            </>
          ) : v ? (
            <>
              <h2>{v.name}</h2>
              {msg ? (
                <p className="b-note done" role="status">
                  <Check aria-hidden="true" size={20} />
                  <span>{msg}</span>
                </p>
              ) : null}
              <dl className="b-dl">
                <dt>Type</dt>
                <dd>{v.type}</dd>
                <dt>Length</dt>
                <dd>{v.lengthFt} ft</dd>
                <dt>Tonnage</dt>
                <dd>{v.grt} GRT</dd>
                <dt>Owner</dt>
                <dd>{v.owner}</dd>
                <dt>Days</dt>
                <dd>
                  {v.credited} appear to count · {v.signedDays} signed
                </dd>
              </dl>
              <p>
                {v.grt < 100
                  ? 'Under 100 GRT: a 4 to 8 hour day may count if the Coast Guard accepts the schedule. It is shown apart and never added.'
                  : '100 GRT or more: a 4 to 8 hour day is not a day.'}
              </p>
              <h3>Signature</h3>
              <ol className="b-stages" aria-label="Signature progress">
                {['Not requested', 'Requested', 'Signed'].map((t, i) => (
                  <li
                    key={t}
                    data-state={i + 1 < stage ? 'past' : i + 1 === stage ? 'now' : 'next'}
                    aria-current={i + 1 === stage ? 'step' : undefined}
                  >
                    {t}
                  </li>
                ))}
              </ol>
              {v.reminded ? (
                <p className="b-note attn" role="status">
                  <BellRing aria-hidden="true" size={20} />
                  <span>Reminder sent to {v.owner}. Demo only: nothing was sent.</span>
                </p>
              ) : null}
              {v.unsignedDays > 0 && v.signature === 'signed' ? (
                <p>
                  {v.unsignedDays} day{v.unsignedDays === 1 ? '' : 's'} added since the signature
                  need a new one.
                </p>
              ) : null}
              <div className="b-btnrow">
                {v.signature === 'not-requested' ? (
                  <button
                    type="button"
                    className="b-primary"
                    onClick={() => lb.requestSignature(v.id)}
                  >
                    <Send aria-hidden="true" size={22} />
                    Ask owner to sign
                  </button>
                ) : null}
                {v.signature === 'requested' ? (
                  <button type="button" className="b-primary" onClick={() => lb.remind(v.id)}>
                    <BellRing aria-hidden="true" size={22} />
                    Remind owner
                  </button>
                ) : null}
                {v.unsignedDays > 0 && v.signature !== 'not-requested' ? (
                  <button type="button" className="b-secondary" onClick={() => lb.markSigned(v.id)}>
                    Demo: owner signs
                  </button>
                ) : null}
              </div>
            </>
          ) : (
            <p>Select a vessel.</p>
          )}
        </section>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- export

function Export({ lb }: { lb: Logbook }) {
  const [id, setId] = React.useState('kelp-runner');
  const [sent, setSent] = React.useState('');
  const vessel = lb.vessels.find((v) => v.id === id) ?? (lb.vessels[0] as VesselView);
  return (
    <div className="b-xpage">
      <div className="b-pagehead">
        <h1>Export for signature</h1>
        <p className="b-sub">A sea-service summary for one vessel, ready to send to its owner.</p>
      </div>
      <div className="b-xgrid">
        <div className="b-xside">
          <section className="b-card">
            <ChoiceGroup
              name="b-ex"
              legend="Which vessel?"
              value={vessel.id}
              onChange={(x) => {
                setId(x);
                setSent('');
              }}
              options={lb.vessels.map((v) => ({
                value: v.id,
                label: v.name,
                help: `${v.credited} days · ${signatureLabel(v.signature)}`,
              }))}
            />
            <button
              type="button"
              className="b-primary"
              onClick={() => {
                lb.requestSignature(vessel.id);
                setSent(
                  `Summary for ${vessel.name} ready for ${vessel.owner}. Demo only: nothing was sent.`,
                );
              }}
            >
              <FileText aria-hidden="true" size={22} />
              Send to owner
            </button>
            {sent ? (
              <p className="b-note done" role="status">
                <Check aria-hidden="true" size={20} />
                <span>{sent}</span>
              </p>
            ) : null}
          </section>
          <section className="b-card">
            <h2>What happens next</h2>
            <ol className="b-steps">
              <li>You send this summary to the owner.</li>
              <li>The owner checks the days and signs.</li>
              <li>You attach the signed letter to your application.</li>
              <li>The National Maritime Center decides.</li>
            </ol>
          </section>
        </div>
        <ExportSheet data={sheetFor(vessel, lb.rows)} />
      </div>
    </div>
  );
}
