import * as React from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BellRing,
  BookOpen,
  Check,
  CircleDot,
  Clock,
  FileText,
  History,
  ListChecks,
  MapPin,
  Pencil,
  Plus,
  Send,
  Ship,
  ShieldCheck,
  Undo2,
} from 'lucide-react';
import { DEMO_NOTICE, seaTime, TODAY } from '../shared/sample';
import type { VariantProps } from '../shared/types';
import { useScreen } from '../shared/routes';
import {
  applyFilters,
  CHECK_IN_TIME,
  creditLabel,
  fmtDate,
  fmtHours,
  noFilters,
  sheetFor,
  signatureLabel,
  sourceLabel,
  useLogbook,
  useTripForm,
  validateTrip,
  watersLabel,
  type Filters,
  type Logbook,
  type Row,
  type VesselView,
} from './logic';
import { ChoiceGroup, ExportSheet, HoursField, PreviewBox, TextField, VesselForm } from './parts';
import './c.css';

const SCREENS = ['home', 'trips', 'add', 'vessels', 'export', 'explain'] as const;
type Screen = (typeof SCREENS)[number];
type Go = (s: Screen) => void;

export default function Mentor({ variant }: VariantProps) {
  const [screen, go] = useScreen<Screen>(SCREENS);
  const lb = useLogbook();
  void variant;
  return (
    <div className="sea-c">
      <header className="c-top">
        <p className="c-brand">
          <Ship aria-hidden="true" size={22} />
          Captain’s Academy · Sea time
        </p>
        <span className="c-sample" title={DEMO_NOTICE}>
          Sample data
        </span>
      </header>
      <main className="c-main">
        {screen !== 'home' ? (
          <button type="button" className="c-back" onClick={() => go('home')}>
            <ArrowLeft aria-hidden="true" size={22} />
            Back to start
          </button>
        ) : null}
        {screen === 'home' ? <Home lb={lb} go={go} /> : null}
        {screen === 'trips' ? <Trips lb={lb} go={go} /> : null}
        {screen === 'add' ? <Wizard lb={lb} go={go} /> : null}
        {screen === 'vessels' ? <Vessels lb={lb} /> : null}
        {screen === 'export' ? <Export lb={lb} /> : null}
        {screen === 'explain' ? <Explain lb={lb} go={go} /> : null}
      </main>
    </div>
  );
}

// ---------------------------------------------------------------- home

function Home({ lb, go }: { lb: Logbook; go: Go }) {
  const s = lb.summary;
  const kelp = lb.vessels.find((v) => v.id === 'kelp-runner');
  const kelpDone = kelp?.signature === 'signed' && kelp.unsignedDays === 0;
  const vname = lb.vessels.find((v) => v.id === lb.checkedIn)?.name;
  return (
    <>
      {lb.lastAdded ? (
        <p className="c-note done" role="status">
          <Check aria-hidden="true" size={22} />
          <span>
            Trip saved. Days that appear to count: {lb.lastAdded.before} → {lb.lastAdded.after}.
          </span>
          <button type="button" onClick={lb.undoAdd}>
            <Undo2 aria-hidden="true" size={18} />
            Undo
          </button>
        </p>
      ) : null}
      <section className="c-hero" aria-labelledby="c-h1">
        <p className="c-hi">Hi Jordan.</p>
        <h1 id="c-h1">You’re {s.totalToGo} days out.</h1>
        <p className="c-lead">
          {s.credited} of {s.totalRequired} days appear to count toward OUPV near coastal.{' '}
          {s.nearCoastal} of the {s.ncRequired} near-coastal days are done, so {s.ncToGo} to go.
        </p>
        <div
          className="c-meter"
          role="progressbar"
          aria-label="Days that appear to count"
          aria-valuemin={0}
          aria-valuemax={s.totalRequired}
          aria-valuenow={s.credited}
        >
          <span style={{ width: `${(s.credited / s.totalRequired) * 100}%` }} />
        </div>
        {lb.checkedIn ? (
          <>
            <p className="c-underway">
              <MapPin aria-hidden="true" size={20} />
              Underway on {vname} since {CHECK_IN_TIME}. Demo only: nothing is recorded.
            </p>
            <button
              type="button"
              className="c-primary"
              onClick={() => {
                lb.checkOut();
                go('add');
              }}
            >
              Check out · log trip
            </button>
          </>
        ) : (
          <button
            type="button"
            className="c-primary"
            onClick={() => lb.checkIn(lb.rows[0]?.vesselId ?? 'morro-dawn')}
          >
            <Ship aria-hidden="true" size={26} />
            Check in · start trip
          </button>
        )}
        <p className="c-pace">
          At about 3 days a week, the near-coastal days take roughly 10 weeks.
        </p>
      </section>

      <div className="c-two">
        <section aria-labelledby="c-next">
          <h2 id="c-next">Here’s what moves you fastest</h2>
          <ol className="c-steps">
            <li>
              <span className="c-num">1</span>
              <div>
                <h3>Log {s.ncToGo} more near-coastal days.</h3>
                <p>
                  This is the part furthest behind. Inland days count toward the {s.totalRequired},
                  but not toward the {s.ncRequired}.
                </p>
                <button type="button" className="c-secondary" onClick={() => go('add')}>
                  <Plus aria-hidden="true" size={20} />
                  Add a past trip
                </button>
              </div>
            </li>
            <li>
              <span className="c-num">2</span>
              <div>
                {kelpDone ? (
                  <>
                    <h3>Kelp Runner is signed.</h3>
                    <p className="c-ok">
                      <ShieldCheck aria-hidden="true" size={20} />
                      {kelp?.owner} signed for every day.
                    </p>
                  </>
                ) : (
                  <>
                    <h3>Get Kelp Runner signed.</h3>
                    <p>
                      {s.awaiting} days wait on {kelp?.owner ?? 'the owner'}’s signature. You will
                      need the owner’s signed letter for them.
                    </p>
                    {kelp?.reminded ? (
                      <p className="c-ok" role="status">
                        <Check aria-hidden="true" size={20} />
                        Reminder sent. Demo only: nothing was sent.
                      </p>
                    ) : (
                      <button
                        type="button"
                        className="c-secondary"
                        onClick={() => kelp && lb.remind(kelp.id)}
                      >
                        <BellRing aria-hidden="true" size={20} />
                        Remind owner
                      </button>
                    )}
                  </>
                )}
              </div>
            </li>
            <li>
              <span className="c-num">3</span>
              <div>
                <h3>Know your short days.</h3>
                <p>
                  {s.apart} days of 4 to 8 hours are shown apart and never added. {s.notCredited}{' '}
                  days were under 4 hours and are not credited.
                </p>
                <button type="button" className="c-secondary" onClick={() => go('explain')}>
                  <BookOpen aria-hidden="true" size={20} />
                  What counts, in plain words
                </button>
              </div>
            </li>
          </ol>
        </section>

        <section aria-labelledby="c-route">
          <h2 id="c-route">Your route</h2>
          <ol className="c-route">
            <li data-state="done">
              <span className="c-dot">
                <Check aria-hidden="true" size={18} />
              </span>
              <div>
                <h3>{s.recorded} days recorded</h3>
                <p>Every day with a log entry, counted or not.</p>
              </div>
            </li>
            <li data-state="now" aria-current="step">
              <span className="c-dot">
                <CircleDot aria-hidden="true" size={18} />
              </span>
              <div>
                <h3>{s.credited} days appear to count</h3>
                <p>
                  That is {s.recorded - s.credited} fewer than recorded, because of the day rules.
                </p>
              </div>
            </li>
            <li data-state="next">
              <span className="c-dot">
                <Clock aria-hidden="true" size={18} />
              </span>
              <div>
                <h3>{s.signed} days signed by an owner</h3>
                <p>{s.awaiting} still need a signature.</p>
              </div>
            </li>
            <li data-state="next">
              <span className="c-dot">
                <Clock aria-hidden="true" size={18} />
              </span>
              <div>
                <h3>0 days verified by the NMC</h3>
                <p>
                  The National Maritime Center checks your service only after you apply. It decides.
                </p>
              </div>
            </li>
          </ol>
        </section>
      </div>

      <section aria-labelledby="c-more">
        <h2 id="c-more">More</h2>
        <ul className="c-tiles">
          {(
            [
              [
                'trips',
                'Your trips',
                'See every entry',
                <ListChecks key="a" aria-hidden="true" size={24} />,
              ],
              [
                'vessels',
                'Vessels and signatures',
                'Tonnage and owners',
                <Ship key="b" aria-hidden="true" size={24} />,
              ],
              [
                'export',
                'Send a summary to an owner',
                'For their signature',
                <FileText key="c" aria-hidden="true" size={24} />,
              ],
              [
                'explain',
                'What counts',
                'In plain words',
                <BookOpen key="d" aria-hidden="true" size={24} />,
              ],
            ] as const
          ).map(([id, label, help, icon]) => (
            <li key={id}>
              <button type="button" onClick={() => go(id)}>
                {icon}
                <span>
                  <b>{label}</b>
                  <small>{help}</small>
                </span>
                <ArrowRight aria-hidden="true" size={20} />
              </button>
            </li>
          ))}
        </ul>
        <p className="c-fine">
          Simulator and game time ({s.simulatorHours} h) never count as sea time. Backfilled days (
          {s.backfilled}) are always labeled.
        </p>
      </section>
    </>
  );
}

// ---------------------------------------------------------------- trips

function CreditLine({ r }: { r: Row }) {
  const icon =
    r.credit === 'day' ? (
      <Check aria-hidden="true" size={18} />
    ) : (
      <Clock aria-hidden="true" size={18} />
    );
  return (
    <span className={`c-mark ${r.credit === 'day' ? 'done' : 'attn'}`}>
      {icon}
      {creditLabel(r)}
    </span>
  );
}

function Trips({ lb, go }: { lb: Logbook; go: Go }) {
  const [f, setF] = React.useState<Filters>(noFilters);
  const rows = applyFilters(lb.rows, f);
  const vesselName = lb.vessels.find((v) => v.id === f.vessel);
  return (
    <>
      <h1 className="c-h1">Your trips</h1>
      <p className="c-sub">
        Showing {rows.length} of {lb.rows.length} entries from your {seaTime.totalTrips} trips.
      </p>
      <button type="button" className="c-primary" onClick={() => go('add')}>
        <Plus aria-hidden="true" size={24} />
        Add a trip
      </button>
      <div className="c-filters">
        <div role="group" aria-label="Vessel" className="c-chips">
          <button
            type="button"
            aria-pressed={f.vessel === ''}
            onClick={() => setF({ ...f, vessel: '' })}
          >
            All vessels
          </button>
          {lb.vessels.map((v) => (
            <button
              key={v.id}
              type="button"
              aria-pressed={f.vessel === v.id}
              onClick={() => setF({ ...f, vessel: v.id })}
            >
              {v.name}
            </button>
          ))}
        </div>
        <div role="group" aria-label="Signature" className="c-chips">
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
        <div className="c-empty">
          <ShieldCheck aria-hidden="true" size={36} />
          <h2>{f.waiting ? 'Nothing is waiting on a signature.' : 'No trips here yet.'}</h2>
          <p>
            {f.waiting
              ? `${vesselName ? `${vesselName.owner} has signed for every day on ${vesselName.name}.` : 'Every day that appears to count is signed for.'} A new trip will show up here until its owner signs.`
              : 'Try another vessel, or add a trip.'}
          </p>
          <button type="button" className="c-secondary" onClick={() => setF(noFilters)}>
            Show every trip
          </button>
        </div>
      ) : (
        <ul className="c-trips">
          {rows.map((r) => (
            <li key={r.id} data-new={r.session || undefined}>
              <div className="top">
                <h2>{fmtDate(r.date)}</h2>
                <b>{fmtHours(r.hours)}</b>
              </div>
              <p className="ves">
                {r.vesselName} · {r.route}
              </p>
              <p className="meta">
                {watersLabel[r.waters]} · {r.role}
              </p>
              <p className="marks">
                <CreditLine r={r} />
                {r.source === 'backfilled' ? (
                  <span className="c-mark backfilled">
                    <History aria-hidden="true" size={18} />
                    Backfilled
                  </span>
                ) : (
                  <span className="c-src">
                    {r.source === 'gps' ? (
                      <MapPin aria-hidden="true" size={18} />
                    ) : (
                      <Pencil aria-hidden="true" size={18} />
                    )}
                    {sourceLabel[r.source]}
                  </span>
                )}
              </p>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

// ---------------------------------------------------------------- the add-a-trip wizard

const STEPS = ['vessel', 'date', 'hours', 'waters', 'role', 'source', 'review'] as const;

function Wizard({ lb, go }: { lb: Logbook; go: Go }) {
  const form = useTripForm(lb, () => go('home'));
  const { values: v, set, preview } = form;
  const [i, setI] = React.useState(0);
  const [showErr, setShowErr] = React.useState(false);
  const [dateMode, setDateMode] = React.useState<'today' | 'yesterday' | 'other'>('today');
  const fromGps = lb.prefill?.source === 'gps';
  const step = STEPS[i] ?? 'vessel';
  const all = validateTrip(v);
  const stepError =
    step === 'vessel'
      ? all.vesselId
      : step === 'date'
        ? all.date
        : step === 'hours'
          ? all.hours
          : undefined;
  const next = () => {
    if (stepError) {
      setShowErr(true);
      return;
    }
    setShowErr(false);
    setI((n) => Math.min(STEPS.length - 1, n + 1));
  };
  const back = () => {
    setShowErr(false);
    if (i === 0) go('home');
    else setI((n) => n - 1);
  };
  const vessel = lb.vessels.find((x) => x.id === v.vesselId);
  const heading = React.useRef<HTMLHeadingElement>(null);
  React.useEffect(() => {
    heading.current?.focus();
  }, [i]);
  const q: Record<(typeof STEPS)[number], string> = {
    vessel: 'Which vessel were you on?',
    date: 'Which day was it?',
    hours: 'How many hours were you underway?',
    waters: 'Where were you?',
    role: 'What was your job aboard?',
    source: 'How should we record it?',
    review: 'Check it, then save.',
  };
  return (
    <form
      className="c-wizard"
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        if (step === 'review') form.submit();
        else next();
      }}
    >
      <p className="c-stepcount">
        Step {i + 1} of {STEPS.length}
      </p>
      <div className="c-pips" aria-hidden="true">
        {STEPS.map((s, n) => (
          <span key={s} data-state={n < i ? 'done' : n === i ? 'now' : 'next'} />
        ))}
      </div>
      <h1 className="c-q" tabIndex={-1} ref={heading}>
        {q[step]}
      </h1>

      {step === 'vessel' ? (
        <>
          <ChoiceGroup
            name="c-vessel"
            legend="Vessel"
            value={v.vesselId}
            onChange={(x) => set('vesselId', x)}
            error={showErr ? all.vesselId : undefined}
            options={lb.vessels.map((x) => ({
              value: x.id,
              label: x.name,
              help: `${x.type} · ${x.grt} GRT`,
            }))}
          />
          <button type="button" className="c-link" onClick={() => go('vessels')}>
            <Plus aria-hidden="true" size={20} />
            Add a different vessel
          </button>
        </>
      ) : null}

      {step === 'date' ? (
        <>
          <ChoiceGroup
            name="c-day"
            legend="Day"
            value={dateMode}
            onChange={(m) => {
              setDateMode(m);
              if (m === 'today') set('date', TODAY);
              if (m === 'yesterday') set('date', '2026-10-25');
            }}
            options={[
              { value: 'today', label: 'Today', help: 'Oct 26, 2026' },
              { value: 'yesterday', label: 'Yesterday', help: 'Oct 25, 2026' },
              { value: 'other', label: 'Another day' },
            ]}
          />
          {dateMode === 'other' ? (
            <TextField
              id="c-date"
              type="date"
              label="Pick the day"
              max={TODAY}
              value={v.date}
              onChange={(x) => set('date', x)}
              error={showErr ? all.date : undefined}
            />
          ) : null}
        </>
      ) : null}

      {step === 'hours' ? (
        <>
          <HoursField
            id="c-hours"
            value={v.hours}
            onChange={(x) => set('hours', x)}
            error={showErr ? all.hours : undefined}
          />
          {preview ? (
            <p className="c-live" aria-live="polite">
              {preview.credit === 'day' ? (
                <Check aria-hidden="true" size={22} />
              ) : (
                <Clock aria-hidden="true" size={22} />
              )}
              <span>{preview.headline}.</span>
            </p>
          ) : null}
        </>
      ) : null}

      {step === 'waters' ? (
        <ChoiceGroup
          name="c-waters"
          legend="Waters"
          value={v.waters}
          onChange={(x) => set('waters', x)}
          options={[
            {
              value: 'near-coastal',
              label: 'Near coastal',
              help: 'Ocean or near-coastal waters, like the Catalina channel. Counts toward the 90.',
            },
            {
              value: 'inland',
              label: 'Inland',
              help: 'Bays, harbors, rivers and lakes, like Alamitos Bay. Counts toward the 360 only.',
            },
          ]}
        />
      ) : null}

      {step === 'role' ? (
        <ChoiceGroup
          name="c-role"
          legend="Role"
          value={v.role}
          onChange={(x) => set('role', x)}
          options={[
            { value: 'Operator', label: 'Operator', help: 'You ran the vessel' },
            { value: 'Mate', label: 'Mate' },
            { value: 'Deckhand', label: 'Deckhand' },
          ]}
        />
      ) : null}

      {step === 'source' ? (
        <ChoiceGroup
          name="c-source"
          legend="Recorded how"
          value={v.source}
          onChange={(x) => set('source', x)}
          options={[
            ...(fromGps
              ? [
                  {
                    value: 'gps' as const,
                    label: 'GPS track',
                    help: 'From your check-in and check-out',
                  },
                ]
              : []),
            { value: 'manual', label: 'Entered by hand', help: 'You are logging it now' },
            {
              value: 'backfilled',
              label: 'Backfilled',
              help: 'You are entering it after the fact. It stays labeled, and is never shown as GPS-verified.',
            },
          ]}
        />
      ) : null}

      {step === 'review' ? (
        <>
          <dl className="c-review">
            <dt>Vessel</dt>
            <dd>{vessel?.name}</dd>
            <dt>Day</dt>
            <dd>{fmtDate(v.date)}</dd>
            <dt>Hours</dt>
            <dd>{v.hours} h</dd>
            <dt>Waters</dt>
            <dd>{watersLabel[v.waters]}</dd>
            <dt>Job</dt>
            <dd>{v.role}</dd>
            <dt>Recorded</dt>
            <dd>{sourceLabel[v.source]}</dd>
          </dl>
          <PreviewBox preview={preview} credited={lb.summary.credited} idPrefix="c" />
        </>
      ) : null}

      <div className="c-navrow">
        {step === 'review' ? (
          <button type="submit" className="c-primary">
            <Check aria-hidden="true" size={24} />
            Save trip
          </button>
        ) : (
          <button type="submit" className="c-primary">
            Next
            <ArrowRight aria-hidden="true" size={24} />
          </button>
        )}
        <button type="button" className="c-secondary" onClick={back}>
          <ArrowLeft aria-hidden="true" size={20} />
          {i === 0 ? 'Cancel' : 'Back'}
        </button>
      </div>
    </form>
  );
}

// ---------------------------------------------------------------- vessels

function Vessels({ lb }: { lb: Logbook }) {
  const [adding, setAdding] = React.useState(false);
  const [msg, setMsg] = React.useState('');
  return (
    <>
      <h1 className="c-h1">Vessels and signatures</h1>
      <p className="c-sub">
        Tonnage matters. Under 100 GRT, a 4 to 8 hour day may count, and we show it apart. Each
        owner signs for your days aboard.
      </p>
      {msg ? (
        <p className="c-note done" role="status">
          <Check aria-hidden="true" size={22} />
          <span>{msg}</span>
        </p>
      ) : null}
      <ul className="c-vessels">
        {lb.vessels.map((v) => (
          <VesselCard key={v.id} v={v} lb={lb} />
        ))}
      </ul>
      {adding ? (
        <section className="c-card" aria-labelledby="c-newv">
          <h2 id="c-newv">Add a vessel</h2>
          <VesselForm
            idPrefix="c-v"
            onAdd={(x) => {
              lb.addVessel(x);
              setAdding(false);
              setMsg(`${x.name.trim()} added. Ask its owner to sign when you are ready.`);
            }}
          />
        </section>
      ) : (
        <button type="button" className="c-secondary" onClick={() => setAdding(true)}>
          <Plus aria-hidden="true" size={20} />
          Add a vessel
        </button>
      )}
    </>
  );
}

function VesselCard({ v, lb }: { v: VesselView; lb: Logbook }) {
  const headline =
    v.signature === 'signed' && v.unsignedDays === 0
      ? `${v.name} is signed.`
      : v.signature === 'signed'
        ? `${v.name} has ${v.unsignedDays} new day${v.unsignedDays === 1 ? '' : 's'} to sign.`
        : v.signature === 'requested'
          ? `${v.name} is waiting on ${v.owner}.`
          : `${v.name} has not been sent to its owner.`;
  return (
    <li className="c-card c-vessel">
      <h2>{headline}</h2>
      <p>
        {v.type}, {v.lengthFt} ft, {v.grt} GRT. Owner: {v.owner}.
      </p>
      <p>
        {v.credited} days appear to count, {v.signedDays} signed.{' '}
        {v.grt < 100
          ? 'Under 100 GRT: short days are shown apart.'
          : '100 GRT or more: a 4 to 8 hour day is not a day.'}
      </p>
      <p>
        <span
          className={`c-mark ${v.signature === 'signed' && v.unsignedDays === 0 ? 'done' : 'attn'}`}
        >
          {v.signature === 'signed' && v.unsignedDays === 0 ? (
            <ShieldCheck aria-hidden="true" size={18} />
          ) : (
            <Clock aria-hidden="true" size={18} />
          )}
          {signatureLabel(v.signature)}
        </span>
      </p>
      {v.reminded ? (
        <p className="c-ok" role="status">
          <Check aria-hidden="true" size={20} />
          Reminder sent to {v.owner}. Demo only: nothing was sent.
        </p>
      ) : null}
      <div className="c-btns">
        {v.signature === 'not-requested' ? (
          <button type="button" className="c-secondary" onClick={() => lb.requestSignature(v.id)}>
            <Send aria-hidden="true" size={20} />
            Ask owner to sign
          </button>
        ) : null}
        {v.signature === 'requested' ? (
          <button type="button" className="c-secondary" onClick={() => lb.remind(v.id)}>
            <BellRing aria-hidden="true" size={20} />
            Remind owner
          </button>
        ) : null}
        {v.unsignedDays > 0 && v.signature !== 'not-requested' ? (
          <button type="button" className="c-secondary" onClick={() => lb.markSigned(v.id)}>
            Demo: owner signs
          </button>
        ) : null}
      </div>
    </li>
  );
}

// ---------------------------------------------------------------- export

function Export({ lb }: { lb: Logbook }) {
  const [id, setId] = React.useState('kelp-runner');
  const [sent, setSent] = React.useState('');
  const vessel = lb.vessels.find((v) => v.id === id) ?? (lb.vessels[0] as VesselView);
  return (
    <>
      <h1 className="c-h1">Send a summary to an owner</h1>
      <p className="c-sub">Three small steps. Nothing is sent in this demo.</p>
      <section className="c-card" aria-labelledby="c-x1">
        <h2 id="c-x1">1. Pick the vessel</h2>
        <ChoiceGroup
          name="c-ex"
          legend="Vessel"
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
      </section>
      <section aria-labelledby="c-x2">
        <h2 id="c-x2" className="c-h2">
          2. Look it over
        </h2>
        <ExportSheet data={sheetFor(vessel, lb.rows)} />
      </section>
      <section className="c-card" aria-labelledby="c-x3">
        <h2 id="c-x3">3. Send it</h2>
        <p>
          {vessel.owner} gets this sheet to check and sign. The National Maritime Center decides
          what counts.
        </p>
        <button
          type="button"
          className="c-primary"
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
        {sent ? (
          <p className="c-note done" role="status">
            <Check aria-hidden="true" size={22} />
            <span>{sent}</span>
          </p>
        ) : null}
      </section>
    </>
  );
}

// ---------------------------------------------------------------- explain

function Explain({ lb, go }: { lb: Logbook; go: Go }) {
  const s = lb.summary;
  const items: readonly [string, string][] = [
    [
      'A day is 8 hours or more.',
      'Eight hours underway, on watch or working is one day. Extra hours add nothing. Past 12 hours, a 1½ day credit is the Coast Guard’s call, so we never add it.',
    ],
    [
      'Short days.',
      `On a vessel under 100 GRT, 4 to 8 hours may count if the Coast Guard accepts the schedule. We list those apart (${s.apart} so far) and never add them. Under 4 hours is never a day.`,
    ],
    [
      `Why ${s.recorded} recorded and ${s.credited} counted?`,
      `${s.recorded} days have a log entry. ${s.recorded - s.credited} of them do not appear to count: ${s.apart} short days shown apart and ${s.notCredited} under 4 hours.`,
    ],
    [
      'What signed means.',
      `The vessel owner signs a CG-719S sea-service letter for the days you served. ${s.signed} days are signed. ${s.awaiting} still wait.`,
    ],
    [
      'Backfilled days.',
      `${s.backfilled} days were entered after the fact. They stay labeled backfilled and are never shown as GPS-verified.`,
    ],
    [
      'Simulator and game time.',
      `Never sea time, however many hours you play. You have ${s.simulatorHours} h of it, and none of it counts.`,
    ],
    [
      'Who decides.',
      'The National Maritime Center. Captain’s Academy can say your logged time appears to meet a requirement, and list what is still needed. It never gives a verdict.',
    ],
  ];
  return (
    <>
      <h1 className="c-h1">What counts, in plain words</h1>
      <p className="c-sub">Checked for OUPV near coastal only.</p>
      <ul className="c-explain">
        {items.map(([h, p]) => (
          <li key={h} className="c-card">
            <h2>{h}</h2>
            <p>{p}</p>
          </li>
        ))}
      </ul>
      <p className="c-fine">{seaTime.cfr.join(' · ')}</p>
      <button type="button" className="c-primary" onClick={() => go('home')}>
        Back to your route
      </button>
    </>
  );
}
