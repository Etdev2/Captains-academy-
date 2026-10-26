import * as React from 'react';
import { AlertTriangle, Check, Info, Minus, Plus } from 'lucide-react';
import { NMC_NOTICE, sailor } from '../shared/sample';
import {
  creditLabel,
  emptyVessel,
  fmtDate,
  fmtHours,
  signatureLabel,
  sourceLabel,
  previewTrip,
  validateVessel,
  watersLabel,
  type SheetData,
  type VesselValues,
} from './logic';
import './shared.css';

// Small form pieces and the export sheet that all three variants share. Each
// variant styles them through its own palette variables, so they follow its
// direction. Every class here is scoped under .sea-a, .sea-b or .sea-c in
// shared.css.

export function FieldError({ id, error }: { id: string; error: string | undefined }) {
  if (!error) return null;
  return (
    <p className="f-error" id={`${id}-err`} role="alert">
      <AlertTriangle aria-hidden="true" size={18} />
      <span>{error}</span>
    </p>
  );
}

interface TextFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string | undefined;
  hint?: string;
  type?: 'text' | 'date';
  inputMode?: 'decimal' | 'text';
  max?: string;
  placeholder?: string;
}

export function TextField(p: TextFieldProps) {
  const describedBy = [p.hint ? `${p.id}-hint` : '', p.error ? `${p.id}-err` : '']
    .filter(Boolean)
    .join(' ');
  return (
    <div className="f-field">
      <label htmlFor={p.id}>{p.label}</label>
      {p.hint ? (
        <p className="f-hint" id={`${p.id}-hint`}>
          {p.hint}
        </p>
      ) : null}
      <input
        id={p.id}
        type={p.type ?? 'text'}
        inputMode={p.inputMode}
        max={p.max}
        placeholder={p.placeholder}
        value={p.value}
        aria-invalid={p.error ? true : undefined}
        aria-describedby={describedBy || undefined}
        onChange={(e) => p.onChange(e.target.value)}
      />
      <FieldError id={p.id} error={p.error} />
    </div>
  );
}

export function SelectField(p: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: readonly { value: string; label: string }[];
  error?: string | undefined;
}) {
  return (
    <div className="f-field">
      <label htmlFor={p.id}>{p.label}</label>
      <select
        id={p.id}
        value={p.value}
        aria-invalid={p.error ? true : undefined}
        aria-describedby={p.error ? `${p.id}-err` : undefined}
        onChange={(e) => p.onChange(e.target.value)}
      >
        {p.options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <FieldError id={p.id} error={p.error} />
    </div>
  );
}

export function HoursField(p: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  error?: string | undefined;
}) {
  const n = Number(p.value);
  const step = (d: number) => {
    const cur = Number.isNaN(n) || p.value.trim() === '' ? 0 : n;
    p.onChange(String(Math.min(24, Math.max(0, cur + d))));
  };
  return (
    <div className="f-field">
      <label htmlFor={p.id}>Hours underway</label>
      <p className="f-hint" id={`${p.id}-hint`}>
        Count the time the vessel was underway or you were on watch or working.
      </p>
      <div className="f-hours">
        <button type="button" onClick={() => step(-0.5)} aria-label="Half an hour less">
          <Minus aria-hidden="true" size={22} />
        </button>
        <input
          id={p.id}
          inputMode="decimal"
          value={p.value}
          placeholder="8"
          aria-invalid={p.error ? true : undefined}
          aria-describedby={`${p.id}-hint${p.error ? ` ${p.id}-err` : ''}`}
          onChange={(e) => p.onChange(e.target.value)}
        />
        <button type="button" onClick={() => step(0.5)} aria-label="Half an hour more">
          <Plus aria-hidden="true" size={22} />
        </button>
      </div>
      <div className="f-quick" role="group" aria-label="Common hours">
        {[4, 6, 8, 10, 12].map((h) => (
          <button
            key={h}
            type="button"
            aria-pressed={Number(p.value) === h && p.value.trim() !== ''}
            onClick={() => p.onChange(String(h))}
          >
            {h} h
          </button>
        ))}
      </div>
      <FieldError id={p.id} error={p.error} />
    </div>
  );
}

export function ChoiceGroup<T extends string>(p: {
  name: string;
  legend: string;
  value: T;
  onChange: (v: T) => void;
  options: readonly { value: T; label: string; help?: string; disabled?: boolean }[];
  error?: string | undefined;
}) {
  return (
    <fieldset className="f-choice">
      <legend>{p.legend}</legend>
      <div className="f-choice-list">
        {p.options.map((o) => (
          <label key={o.value} className="f-opt" data-checked={p.value === o.value || undefined}>
            <input
              type="radio"
              name={p.name}
              value={o.value}
              checked={p.value === o.value}
              disabled={o.disabled}
              onChange={() => p.onChange(o.value)}
            />
            <span className="f-opt-text">
              <span className="f-opt-label">{o.label}</span>
              {o.help ? <span className="f-opt-help">{o.help}</span> : null}
            </span>
          </label>
        ))}
      </div>
      <FieldError id={p.name} error={p.error} />
    </fieldset>
  );
}

export function VesselForm({
  idPrefix,
  onAdd,
  submitLabel = 'Add vessel',
}: {
  idPrefix: string;
  onAdd: (v: VesselValues) => void;
  submitLabel?: string;
}) {
  const [v, setV] = React.useState<VesselValues>(emptyVessel);
  const [tried, setTried] = React.useState(false);
  const errors = tried ? validateVessel(v) : {};
  const set = (k: keyof VesselValues) => (val: string) => setV((x) => ({ ...x, [k]: val }));
  return (
    <form
      className="f-form"
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        setTried(true);
        if (Object.keys(validateVessel(v)).length === 0) {
          onAdd(v);
          setV(emptyVessel);
          setTried(false);
        }
      }}
    >
      <TextField id={`${idPrefix}-name`} label="Vessel name" value={v.name} onChange={set('name')} error={errors.name} />
      <TextField id={`${idPrefix}-type`} label="What kind of vessel?" hint="For example, sailboat or center console." value={v.type} onChange={set('type')} />
      <div className="f-two">
        <TextField id={`${idPrefix}-len`} label="Length in feet" inputMode="decimal" value={v.length} onChange={set('length')} error={errors.length} />
        <TextField id={`${idPrefix}-grt`} label="Tonnage (GRT)" inputMode="decimal" value={v.grt} onChange={set('grt')} error={errors.grt} />
      </div>
      <TextField id={`${idPrefix}-owner`} label="Owner’s name" hint="The owner signs for your days aboard." value={v.owner} onChange={set('owner')} error={errors.owner} />
      <button type="submit" className="f-submit">
        {submitLabel}
      </button>
    </form>
  );
}

// ---------------------------------------------------------------- the export sheet

/** A CG-719S-style sea-service summary for one vessel, ready to send to its owner. Layout is illustrative. */
export function ExportSheet({ data }: { data: SheetData }) {
  const { vessel: v } = data;
  const listed = data.rows.slice(0, 12);
  const credited = data.byWaters.reduce((s, w) => s + w.days, 0);
  const earlierBackfilled = Math.max(0, data.backfilledDays - data.listedBackfilled);
  return (
    <article className="sheet" aria-label={`Sea-service summary for ${v.name}`}>
      <p className="sheet-draft">Draft for the owner. Layout is illustrative, not the official form.</p>
      <h3>Small vessel sea service, summary for signature</h3>
      <p className="sheet-sub">Modeled on CG-719S. Prepared from the mariner’s own log.</p>

      <div className="sheet-grid">
        <section aria-labelledby={`sh-m-${v.id}`}>
          <h4 id={`sh-m-${v.id}`}>Mariner</h4>
          <dl>
            <dt>Name</dt>
            <dd>{sailor.legalName} (fictional)</dd>
            <dt>Home port</dt>
            <dd>{sailor.homePort}</dd>
          </dl>
        </section>
        <section aria-labelledby={`sh-v-${v.id}`}>
          <h4 id={`sh-v-${v.id}`}>Vessel</h4>
          <dl>
            <dt>Name</dt>
            <dd>{v.name}</dd>
            <dt>Type and length</dt>
            <dd>
              {v.type}, {v.lengthFt} ft
            </dd>
            <dt>Tonnage</dt>
            <dd>{v.grt} GRT</dd>
            <dt>Owner</dt>
            <dd>{v.owner}</dd>
          </dl>
        </section>
      </div>

      <h4>Days of service</h4>
      <table>
        <thead>
          <tr>
            <th scope="col">Waters</th>
            <th scope="col" className="num">Days that appear to count</th>
            <th scope="col" className="num">4 to 8 h, shown apart</th>
            <th scope="col" className="num">Not credited</th>
          </tr>
        </thead>
        <tbody>
          {data.byWaters.map((w) => (
            <tr key={w.waters}>
              <th scope="row">{watersLabel[w.waters]}</th>
              <td className="num">{w.days}</td>
              <td className="num">{w.apart}</td>
              <td className="num">{w.notCredited}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <th scope="row">Total</th>
            <td className="num">{credited}</td>
            <td colSpan={2}>Shown apart days are never added to the total.</td>
          </tr>
        </tfoot>
      </table>

      <p className="sheet-backfill">
        {data.backfilledDays > 0 ? (
          <>
            <span className="sheet-tag">Backfilled</span> {data.backfilledDays} of these days were entered after
            the fact. They are marked backfilled below and are not GPS-verified.
          </>
        ) : (
          <>No days on this vessel were backfilled.</>
        )}
      </p>

      <h4>Recent entries</h4>
      {listed.length === 0 ? (
        <p>No entries for this vessel yet. Add a trip and it shows up here.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th scope="col">Date</th>
              <th scope="col">Waters</th>
              <th scope="col">Role</th>
              <th scope="col" className="num">Hours</th>
              <th scope="col">Credit</th>
              <th scope="col">Source</th>
            </tr>
          </thead>
          <tbody>
            {listed.map((r) => (
              <tr key={r.id}>
                <th scope="row">{fmtDate(r.date)}</th>
                <td>{watersLabel[r.waters]}</td>
                <td>{r.role}</td>
                <td className="num">{fmtHours(r.hours)}</td>
                <td>{creditLabel(r)}</td>
                <td>
                  {r.source === 'backfilled' ? (
                    <span className="sheet-tag">Backfilled</span>
                  ) : (
                    sourceLabel[r.source]
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {earlierBackfilled > 0 ? (
        <p className="sheet-note">
          Plus {earlierBackfilled} earlier backfilled days, counted in the totals above and not listed here.
        </p>
      ) : null}

      <div className="sheet-sign">
        <div>
          <span className="sheet-line" aria-hidden="true" />
          <p>Owner’s signature ({v.owner})</p>
        </div>
        <div>
          <span className="sheet-line" aria-hidden="true" />
          <p>Date</p>
        </div>
        <p className="sheet-status">Signature now: {signatureLabel(v.signature)}</p>
      </div>

      <footer className="sheet-foot">
        <p>
          {NMC_NOTICE} This summary does not verify service, and a signature does not approve it. Simulator
          and game time are not included and never count as sea time.
        </p>
      </footer>
    </article>
  );
}

export function PreviewBox({
  preview,
  credited,
  idPrefix,
}: {
  preview: ReturnType<typeof previewTrip>;
  credited: number;
  idPrefix: string;
}) {
  return (
    <section className="pv" aria-live="polite" aria-labelledby={`${idPrefix}-pv`}>
      <h3 id={`${idPrefix}-pv`}>How this trip would be credited</h3>
      {preview ? (
        <>
          <p className="pv-head" data-credit={preview.credit}>
            {preview.credit === 'day' ? (
              <Check aria-hidden="true" size={22} />
            ) : (
              <Info aria-hidden="true" size={22} />
            )}
            <span>{preview.headline}</span>
          </p>
          <p>{preview.detail}</p>
          {preview.waters ? <p>{preview.waters}</p> : null}
          <p>{preview.source}</p>
          <p className="pv-total">
            Days that appear to count: {credited}
            {preview.credit === 'day' ? ` → ${credited + 1}` : ' (no change)'}
          </p>
        </>
      ) : (
        <p>Pick a vessel and enter the hours. This box shows how the day would be credited, before you save.</p>
      )}
    </section>
  );
}
