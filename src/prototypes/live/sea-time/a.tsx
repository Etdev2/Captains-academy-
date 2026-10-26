import * as React from 'react';
import {
  Anchor,
  Ban,
  BellRing,
  Check,
  ClipboardList,
  Clock,
  FileText,
  History,
  Home,
  MapPin,
  Pencil,
  Plus,
  Send,
  Ship,
  ShieldCheck,
  Undo2,
} from 'lucide-react';
import { creditedByMonth, DEMO_NOTICE, seaTime, TODAY } from '../shared/sample';
import type { VariantProps } from '../shared/types';
import { useScreen } from '../shared/routes';
import {
  applyFilters,
  CHECK_IN_TIME,
  creditLabel,
  fmtDate,
  fmtHours,
  fmtMonth,
  noFilters,
  sheetFor,
  signatureLabel,
  sourceLabel,
  useLogbook,
  useTripForm,
  watersLabel,
  type Filters,
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
import './a.css';

const SCREENS = ['overview', 'add', 'vessels', 'export'] as const;
type Screen = (typeof SCREENS)[number];

const TABS: readonly { id: Screen; label: string; icon: React.ReactNode }[] = [
  { id: 'overview', label: 'Log', icon: <Home aria-hidden="true" size={22} /> },
  { id: 'add', label: 'Add trip', icon: <Plus aria-hidden="true" size={22} /> },
  { id: 'vessels', label: 'Vessels', icon: <Ship aria-hidden="true" size={22} /> },
  { id: 'export', label: 'Export', icon: <FileText aria-hidden="true" size={22} /> },
];

function CreditTag({ r }: { r: Pick<Row, 'credit' | 'days'> }) {
  const label = creditLabel(r);
  if (r.credit === 'day')
    return (
      <span className="tag done">
        <Check aria-hidden="true" size={16} />
        {label}
      </span>
    );
  if (r.credit === 'four-to-eight')
    return (
      <span className="tag attn">
        <Clock aria-hidden="true" size={16} />
        {label}
      </span>
    );
  return (
    <span className="tag quiet">
      <Ban aria-hidden="true" size={16} />
      {label}
    </span>
  );
}

function SourceTag({ r }: { r: Pick<Row, 'source'> }) {
  if (r.source === 'backfilled')
    return (
      <span className="tag backfilled">
        <History aria-hidden="true" size={16} />
        Backfilled
      </span>
    );
  return (
    <span className="src">
      {r.source === 'gps' ? (
        <MapPin aria-hidden="true" size={16} />
      ) : (
        <Pencil aria-hidden="true" size={16} />
      )}
      {sourceLabel[r.source]}
    </span>
  );
}

export default function NightBridge({ variant }: VariantProps) {
  const [screen, go] = useScreen<Screen>(SCREENS);
  const lb = useLogbook();
  void variant;
  return (
    <div className="sea-a">
      <header className="a-top">
        <div className="a-brand">
          <Anchor aria-hidden="true" size={24} />
          <div>
            <b>Sea-time logbook</b>
            <small>Toward OUPV · Near coastal</small>
          </div>
        </div>
        <nav className="a-tabs" aria-label="Logbook sections">
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
        <span className="a-sample" title={DEMO_NOTICE}>
          Sample data
        </span>
      </header>
      <main className="a-main">
        {screen === 'overview' ? <Overview lb={lb} go={go} /> : null}
        {screen === 'add' ? <AddTrip lb={lb} go={go} /> : null}
        {screen === 'vessels' ? <Vessels lb={lb} /> : null}
        {screen === 'export' ? <Export lb={lb} /> : null}
      </main>
      <nav className="a-bar" aria-label="Logbook sections, phone">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            aria-current={screen === t.id ? 'page' : undefined}
            onClick={() => go(t.id)}
          >
            {t.icon}
            <span>{t.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}

// ---------------------------------------------------------------- overview

function Overview({ lb, go }: { lb: Logbook; go: (s: Screen) => void }) {
  const s = lb.summary;
  const [f, setF] = React.useState<Filters>(noFilters);
  const rows = applyFilters(lb.rows, f);
  const vesselName = lb.vessels.find((v) => v.id === lb.checkedIn)?.name;
  const monthTotals = creditedByMonth.map((m) => m.nearCoastal + m.inland);
  const peak = Math.max(...monthTotals);
  return (
    <>
      <div className="a-head">
        <div>
          <p className="eyebrow">Sea-time logbook</p>
          <h1>Logged trips and credited days</h1>
          <p className="sub">
            Jordan Sample (fictional) ·{' '}
            {lb.checkedIn ? 'Underway' : `Not underway · last trip ended Oct 19`}
          </p>
        </div>
        {lb.checkedIn ? (
          <button
            type="button"
            className="a-primary"
            onClick={() => {
              lb.checkOut();
              go('add');
            }}
          >
            <Anchor aria-hidden="true" size={24} />
            Check out · log trip
          </button>
        ) : (
          <button
            type="button"
            className="a-primary"
            onClick={() => lb.checkIn(lb.rows[0]?.vesselId ?? 'morro-dawn')}
          >
            <Ship aria-hidden="true" size={24} />
            Check in · start trip
          </button>
        )}
      </div>

      {lb.checkedIn ? (
        <p className="a-banner" role="status">
          <MapPin aria-hidden="true" size={20} />
          <span>
            Underway on {vesselName} since {CHECK_IN_TIME}. GPS track on. Demo only: nothing is
            recorded.
          </span>
        </p>
      ) : null}
      {lb.lastAdded ? (
        <p className="a-banner done" role="status">
          <Check aria-hidden="true" size={20} />
          <span>
            Trip saved. Days that appear to count: {lb.lastAdded.before} → {lb.lastAdded.after}.
          </span>
          <button type="button" onClick={lb.undoAdd}>
            <Undo2 aria-hidden="true" size={18} />
            Undo
          </button>
          <button type="button" onClick={lb.dismissAdded}>
            Dismiss
          </button>
        </p>
      ) : null}

      <section aria-labelledby="a-ladder" className="a-ladder">
        <h2 id="a-ladder" className="sr">
          From recorded to verified
        </h2>
        <div className="stat">
          <p className="k">Recorded</p>
          <p className="v">{s.recorded}</p>
          <p className="n">days with a log entry, counted or not</p>
        </div>
        <div className="stat">
          <p className="k">Appears to count</p>
          <p className="v">
            {s.credited} <small>/ {s.totalRequired}</small>
          </p>
          <p className="n">{s.totalToGo} to go under the rules</p>
        </div>
        <div className="stat">
          <p className="k">Owner signed</p>
          <p className="v">{s.signed}</p>
          <p className="n">{s.awaiting} wait on a signature</p>
        </div>
        <div className="stat dim">
          <p className="k">NMC verified</p>
          <p className="v">None yet</p>
          <p className="n">Only the NMC verifies, when it evaluates an application</p>
        </div>
      </section>

      <div className="a-cols">
        <div className="a-left">
          <section className="panel" aria-labelledby="a-trips">
            <div className="ph">
              <h2 id="a-trips">Trip log</h2>
              <span className="count">
                {rows.length} of {lb.rows.length} entries shown · {seaTime.totalTrips} trips in all
              </span>
            </div>
            <div className="a-filters">
              <SelectField
                id="a-f-vessel"
                label="Vessel"
                value={f.vessel}
                onChange={(v) => setF({ ...f, vessel: v })}
                options={[
                  { value: '', label: 'All vessels' },
                  ...lb.vessels.map((v) => ({ value: v.id, label: v.name })),
                ]}
              />
              <SelectField
                id="a-f-waters"
                label="Waters"
                value={f.waters}
                onChange={(v) => setF({ ...f, waters: v as Filters['waters'] })}
                options={[
                  { value: '', label: 'All waters' },
                  { value: 'near-coastal', label: 'Near coastal' },
                  { value: 'inland', label: 'Inland' },
                ]}
              />
              <label className="a-check">
                <input
                  type="checkbox"
                  checked={f.waiting}
                  onChange={(e) => setF({ ...f, waiting: e.target.checked })}
                />
                <span>Only days waiting on a signature</span>
              </label>
            </div>
            {rows.length === 0 ? (
              <div className="a-empty">
                <ClipboardList aria-hidden="true" size={32} />
                <h3>
                  {f.waiting
                    ? 'No days are waiting on a signature.'
                    : 'No trips match these filters.'}
                </h3>
                <p>
                  {f.waiting
                    ? 'Every credited day on these vessels is signed for. New trips will show up here until the owner signs.'
                    : 'You have not logged time on that vessel in those waters. Try All waters, or add a trip.'}
                </p>
                <button type="button" className="a-secondary" onClick={() => setF(noFilters)}>
                  Clear filters
                </button>
              </div>
            ) : (
              <table className="a-table">
                <thead>
                  <tr>
                    <th scope="col">Date</th>
                    <th scope="col">Vessel</th>
                    <th scope="col">Waters</th>
                    <th scope="col">Role</th>
                    <th scope="col" className="num">
                      Hours
                    </th>
                    <th scope="col">Credit</th>
                    <th scope="col">Source</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id} data-new={r.session || undefined}>
                      <th scope="row" data-label="Date">
                        {fmtDate(r.date)}
                      </th>
                      <td data-label="Vessel" className="vs">
                        <i>{r.vesselName}</i>
                        <small>{r.route}</small>
                      </td>
                      <td data-label="Waters">{watersLabel[r.waters]}</td>
                      <td data-label="Role">{r.role}</td>
                      <td data-label="Hours" className="num">
                        {fmtHours(r.hours)}
                      </td>
                      <td data-label="Credit">
                        <CreditTag r={r} />
                      </td>
                      <td data-label="Source">
                        <SourceTag r={r} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>

          <section className="panel" aria-labelledby="a-chart">
            <div className="ph">
              <h2 id="a-chart">Days that appear to count, by month</h2>
              <span className="count">Nov 2025 to Oct 2026 · illustrative split</span>
            </div>
            <div
              className="a-chart"
              role="img"
              aria-label={`Days that appear to count by month, November 2025 to October 2026. Busiest month: ${peak} days.`}
            >
              {creditedByMonth.map((m, i) => (
                <div key={m.month} className="col">
                  <span className="tot">{monthTotals[i]}</span>
                  <div
                    className="bar"
                    style={{ height: `${((monthTotals[i] ?? 0) / peak) * 120}px` }}
                  >
                    <span className="nc" style={{ flex: m.nearCoastal }} />
                    <span className="in" style={{ flex: m.inland }} />
                  </div>
                  <span className="mo">{fmtMonth(m.month).slice(0, 1)}</span>
                </div>
              ))}
            </div>
            <p className="legend">
              <span className="sw nc" /> Near coastal <span className="sw in" /> Inland
            </p>
          </section>
        </div>

        <aside className="a-right">
          <section className="panel" aria-labelledby="a-prog">
            <div className="ph">
              <h2 id="a-prog">Toward OUPV · Near coastal</h2>
            </div>
            <Meter label="Any waters" value={s.credited} max={s.totalRequired} tone="done" />
            <Meter
              label="Ocean or near coastal"
              value={s.nearCoastal}
              max={s.ncRequired}
              tone="attn"
            />
            <p className="verdict">
              Logged sea time <b>appears to meet 0 of 2</b> parts. Still needed: {s.totalToGo} days,{' '}
              {s.ncToGo} of them near coastal.
            </p>
            <dl className="facts">
              <div>
                <dt>4 to 8 hour days, shown apart</dt>
                <dd>{s.apart}</dd>
              </div>
              <div>
                <dt>Recorded, not credited</dt>
                <dd>{s.notCredited}</dd>
              </div>
              <div>
                <dt>Backfilled days (labeled)</dt>
                <dd>{s.backfilled}</dd>
              </div>
              <div>
                <dt>Simulator hours (never sea time)</dt>
                <dd>{s.simulatorHours} h</dd>
              </div>
            </dl>
            <p className="cfr">{seaTime.cfr.join(' · ')}</p>
          </section>
          <section className="panel" aria-labelledby="a-ves">
            <div className="ph">
              <h2 id="a-ves">Vessels</h2>
              <span className="count">{lb.vessels.length}</span>
            </div>
            <ul className="a-vmini">
              {lb.vessels.map((v) => (
                <li key={v.id}>
                  <i>{v.name}</i>
                  <span>
                    {v.grt} GRT · {v.credited} days
                  </span>
                  <SignatureTag v={v} />
                </li>
              ))}
            </ul>
            <button type="button" className="a-secondary" onClick={() => go('vessels')}>
              Manage vessels
            </button>
          </section>
        </aside>
      </div>
    </>
  );
}

function Meter({
  label,
  value,
  max,
  tone,
}: {
  label: string;
  value: number;
  max: number;
  tone: 'done' | 'attn';
}) {
  return (
    <div className="meter">
      <p>
        <span>{label}</span>
        <b>
          {value} / {max}
        </b>
      </p>
      <div
        className={`track ${tone}`}
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

function SignatureTag({ v }: { v: VesselView }) {
  if (v.signature === 'signed' && v.unsignedDays === 0)
    return (
      <span className="tag done">
        <ShieldCheck aria-hidden="true" size={16} />
        Signed
      </span>
    );
  if (v.signature === 'signed')
    return (
      <span className="tag attn">
        <Clock aria-hidden="true" size={16} />
        Signed, {v.unsignedDays} new
      </span>
    );
  return (
    <span className="tag attn">
      <Clock aria-hidden="true" size={16} />
      {signatureLabel(v.signature)}
    </span>
  );
}

// ---------------------------------------------------------------- add trip

function AddTrip({ lb, go }: { lb: Logbook; go: (s: Screen) => void }) {
  const form = useTripForm(lb, () => go('overview'));
  const { values: v, set, errors } = form;
  const fromGps = lb.prefill?.source === 'gps';
  return (
    <>
      <div className="a-head">
        <div>
          <p className="eyebrow">Add a trip</p>
          <h1>Log a day on the water</h1>
          <p className="sub">The preview shows how the day would be credited before you save.</p>
        </div>
      </div>
      <form
        className="a-addgrid"
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          form.submit();
        }}
      >
        <section className="panel a-formcol" aria-label="Trip details">
          <SelectField
            id="a-vessel"
            label="Which vessel?"
            value={v.vesselId}
            onChange={(x) => set('vesselId', x)}
            error={errors.vesselId}
            options={[
              { value: '', label: 'Pick a vessel' },
              ...lb.vessels.map((x) => ({ value: x.id, label: `${x.name} · ${x.grt} GRT` })),
            ]}
          />
          <TextField
            id="a-date"
            type="date"
            label="Date"
            max={TODAY}
            value={v.date}
            onChange={(x) => set('date', x)}
            error={errors.date}
          />
          <HoursField
            id="a-hours"
            value={v.hours}
            onChange={(x) => set('hours', x)}
            error={errors.hours}
          />
          <ChoiceGroup
            name="a-waters"
            legend="Where were you?"
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
            name="a-role"
            legend="Your role"
            value={v.role}
            onChange={(x) => set('role', x)}
            options={[
              { value: 'Operator', label: 'Operator' },
              { value: 'Mate', label: 'Mate' },
              { value: 'Deckhand', label: 'Deckhand' },
            ]}
          />
          <ChoiceGroup
            name="a-source"
            legend="How is this recorded?"
            value={v.source}
            onChange={(x) => set('source', x)}
            options={[
              {
                value: 'gps',
                label: 'GPS track',
                help: fromGps ? 'From your check-in' : 'Only from a check-in and check-out',
                disabled: !fromGps,
              },
              { value: 'manual', label: 'Entered by hand', help: 'You are logging it now' },
              {
                value: 'backfilled',
                label: 'Backfilled',
                help: 'Entered after the fact. Always labeled.',
              },
            ]}
          />
        </section>
        <div className="a-sidecol">
          <PreviewBox preview={form.preview} credited={lb.summary.credited} idPrefix="a" />
          <button type="submit" className="a-primary">
            <Check aria-hidden="true" size={24} />
            Save trip
          </button>
          {form.tried && Object.keys(errors).length > 0 ? (
            <p className="a-note" role="alert">
              Fix the highlighted fields, then save again.
            </p>
          ) : null}
          <p className="a-note">
            Simulator and game time never count as sea time, so there is nowhere to add it here.
          </p>
        </div>
      </form>
    </>
  );
}

// ---------------------------------------------------------------- vessels

function Vessels({ lb }: { lb: Logbook }) {
  const [adding, setAdding] = React.useState(false);
  const [msg, setMsg] = React.useState('');
  return (
    <>
      <div className="a-head">
        <div>
          <p className="eyebrow">Vessels</p>
          <h1>Tonnage and owner signatures</h1>
          <p className="sub">
            Tonnage decides how short days are credited. Under 100 GRT, a 4 to 8 hour day is shown
            apart.
          </p>
        </div>
        <button
          type="button"
          className="a-primary"
          onClick={() => setAdding((x) => !x)}
          aria-expanded={adding}
        >
          <Plus aria-hidden="true" size={24} />
          {adding ? 'Close the form' : 'Add a vessel'}
        </button>
      </div>
      {msg ? (
        <p className="a-banner done" role="status">
          <Check aria-hidden="true" size={20} />
          <span>{msg}</span>
        </p>
      ) : null}
      {adding ? (
        <section className="panel a-vform" aria-labelledby="a-vf">
          <div className="ph">
            <h2 id="a-vf">New vessel</h2>
          </div>
          <VesselForm
            idPrefix="a-v"
            onAdd={(v) => {
              lb.addVessel(v);
              setAdding(false);
              setMsg(`${v.name.trim()} added. Ask its owner to sign when you are ready.`);
            }}
          />
        </section>
      ) : null}
      <div className="a-vgrid">
        {lb.vessels.map((v) => (
          <article key={v.id} className="panel a-vessel" aria-labelledby={`a-v-${v.id}`}>
            <h2 id={`a-v-${v.id}`}>{v.name}</h2>
            <dl className="specs">
              <div>
                <dt>Type</dt>
                <dd>{v.type}</dd>
              </div>
              <div>
                <dt>Length</dt>
                <dd>{v.lengthFt} ft</dd>
              </div>
              <div>
                <dt>Tonnage</dt>
                <dd>{v.grt} GRT</dd>
              </div>
            </dl>
            <p>Owner: {v.owner}</p>
            <p className="tonnage">
              {v.grt < 100
                ? 'Under 100 GRT. A 4 to 8 hour day may count, and is shown apart.'
                : '100 GRT or more. A 4 to 8 hour day is not a day.'}
            </p>
            <p>
              <b>{v.credited}</b> days appear to count · <b>{v.signedDays}</b> signed
            </p>
            <p>
              <SignatureTag v={v} />
            </p>
            {v.reminded ? (
              <p className="a-note" role="status">
                Reminder sent to {v.owner}. Demo only: nothing was sent.
              </p>
            ) : null}
            <div className="actions">
              {v.signature === 'not-requested' ? (
                <button
                  type="button"
                  className="a-secondary"
                  onClick={() => lb.requestSignature(v.id)}
                >
                  <Send aria-hidden="true" size={20} />
                  Ask owner to sign
                </button>
              ) : null}
              {v.signature === 'requested' ? (
                <button type="button" className="a-secondary" onClick={() => lb.remind(v.id)}>
                  <BellRing aria-hidden="true" size={20} />
                  Remind owner
                </button>
              ) : null}
              {v.unsignedDays > 0 && v.signature !== 'not-requested' ? (
                <button type="button" className="a-secondary" onClick={() => lb.markSigned(v.id)}>
                  <ShieldCheck aria-hidden="true" size={20} />
                  Demo: owner signs
                </button>
              ) : null}
            </div>
          </article>
        ))}
      </div>
    </>
  );
}

// ---------------------------------------------------------------- export

function Export({ lb }: { lb: Logbook }) {
  const [id, setId] = React.useState('kelp-runner');
  const [sent, setSent] = React.useState('');
  const vessel = lb.vessels.find((v) => v.id === id) ?? (lb.vessels[0] as VesselView);
  return (
    <>
      <div className="a-head">
        <div>
          <p className="eyebrow">Export preview</p>
          <h1>Summary for the owner to sign</h1>
          <p className="sub">One sheet per vessel. Backfilled days stay labeled.</p>
        </div>
        <button
          type="button"
          className="a-primary"
          onClick={() => {
            lb.requestSignature(vessel.id);
            setSent(
              `Summary for ${vessel.name} ready for ${vessel.owner}. Demo only: nothing was sent.`,
            );
          }}
        >
          <Send aria-hidden="true" size={24} />
          Send to owner
        </button>
      </div>
      {sent ? (
        <p className="a-banner done" role="status">
          <Check aria-hidden="true" size={20} />
          <span>{sent}</span>
        </p>
      ) : null}
      <div className="a-expgrid">
        <div className="a-expside panel">
          <ChoiceGroup
            name="a-ex-v"
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
        </div>
        <ExportSheet data={sheetFor(vessel, lb.rows)} />
      </div>
    </>
  );
}
