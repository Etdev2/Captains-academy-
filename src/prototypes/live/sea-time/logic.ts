import * as React from 'react';
import {
  seaTime,
  TODAY,
  trips as sampleTrips,
  vessels as sampleVessels,
  type Source,
  type Trip,
  type Vessel,
  type Waters,
} from '../shared/sample';

// Pure helpers and the in-memory logbook the three Sea-Time variants share.
// Everything lives in React state. Nothing is saved, and nothing here touches
// the real log. Day-credit bands follow src/log/rules/day-credit.ts: 8 hours or
// more is a day; 4 to 8 hours on a vessel under 100 GRT is shown apart and never
// added; under 4 hours is never credited.

export const SMALL_VESSEL_GRT = 100;
export const CHECK_IN_TIME = '6:40 AM';

export type Credit = 'day' | 'four-to-eight' | 'under-four' | 'short-large';
export type Role = Trip['role'];

export interface Row extends Omit<Trip, 'credit'> {
  readonly credit: Credit;
  readonly session: boolean;
  /** An owner has signed for this row's credited day. Rows with no credited day are never "waiting". */
  readonly signed: boolean;
  readonly vesselName: string;
}

export interface VesselState extends Vessel {
  readonly reminded: boolean;
  readonly signedSession: boolean;
  readonly session: boolean;
}

export interface VesselView extends VesselState {
  readonly credited: number;
  readonly unsignedDays: number;
  readonly waters: Waters;
}

export interface Summary {
  readonly recorded: number;
  readonly credited: number;
  readonly nearCoastal: number;
  readonly apart: number;
  readonly notCredited: number;
  readonly backfilled: number;
  readonly gps: number;
  readonly signed: number;
  readonly awaiting: number;
  readonly verified: number;
  readonly totalRequired: number;
  readonly ncRequired: number;
  readonly totalToGo: number;
  readonly ncToGo: number;
  readonly simulatorHours: number;
}

// ---------------------------------------------------------------- formatting

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function fmtDate(iso: string): string {
  const [y, m, d] = iso.split('-');
  const month = MONTHS[Number(m) - 1] ?? '';
  return d ? `${month} ${Number(d)}, ${y}` : `${month} ${y}`;
}

export function fmtDay(iso: string): string {
  const [, m, d] = iso.split('-');
  return d ? `${MONTHS[Number(m) - 1] ?? ''} ${Number(d)}` : (MONTHS[Number(m) - 1] ?? '');
}

export function fmtMonth(isoMonth: string): string {
  return MONTHS[Number(isoMonth.slice(5, 7)) - 1] ?? '';
}

export const fmtHours = (h: number | null): string => (h === null ? 'none' : `${h} h`);

export const sourceLabel: Record<Source, string> = {
  gps: 'GPS track',
  manual: 'Entered by hand',
  backfilled: 'Backfilled',
};

export const watersLabel: Record<Waters, string> = {
  'near-coastal': 'Near coastal',
  inland: 'Inland',
};

export function creditLabel(r: Pick<Row, 'credit' | 'days'>): string {
  switch (r.credit) {
    case 'day':
      return r.days === 1 ? '1 day' : `${r.days} days`;
    case 'four-to-eight':
      return '4 to 8 h, shown apart';
    default:
      return 'Not credited';
  }
}

export function signatureLabel(s: Vessel['signature']): string {
  return s === 'signed' ? 'Signed' : s === 'requested' ? 'Requested' : 'Not requested';
}

// ---------------------------------------------------------------- crediting

export function creditOf(hours: number, grt: number): Credit {
  if (hours >= 8) return 'day';
  if (hours >= 4) return grt < SMALL_VESSEL_GRT ? 'four-to-eight' : 'short-large';
  return 'under-four';
}

export interface Preview {
  readonly credit: Credit;
  readonly headline: string;
  readonly detail: string;
  readonly waters: string | null;
  readonly source: string;
}

export interface TripValues {
  vesselId: string;
  date: string;
  hours: string;
  waters: Waters;
  role: Role;
  source: Source;
}

export type TripErrors = Partial<Record<keyof TripValues, string>>;

export function parseHours(raw: string): number {
  const n = Number(raw.trim().replace(',', '.'));
  return raw.trim() === '' ? NaN : n;
}

export function validateTrip(v: TripValues): TripErrors {
  const e: TripErrors = {};
  if (!v.vesselId) e.vesselId = 'Pick the vessel you were aboard.';
  if (!v.date) e.date = 'Enter the day of the trip.';
  else if (v.date > TODAY) e.date = 'That day is in the future. Pick today or an earlier day.';
  const h = parseHours(v.hours);
  if (v.hours.trim() === '') e.hours = 'Enter how many hours you were underway.';
  else if (Number.isNaN(h)) e.hours = 'Hours must be a number, like 8 or 6.5.';
  else if (h <= 0) e.hours = 'Hours must be more than 0.';
  else if (h > 24) e.hours = 'A day has 24 hours. Enter 24 or fewer.';
  return e;
}

export function previewTrip(v: TripValues, vessel: Vessel | undefined): Preview | null {
  const h = parseHours(v.hours);
  if (!vessel || Number.isNaN(h) || h <= 0 || h > 24) return null;
  const credit = creditOf(h, vessel.grt);
  let headline: string;
  let detail: string;
  if (credit === 'day') {
    headline = 'Appears to count as 1 day';
    detail =
      h >= 12
        ? 'Eight hours or more is one day. A 1½ day credit past 12 hours is the Coast Guard’s call, so it is never added here.'
        : 'Eight hours or more is one day. Extra hours add nothing.';
  } else if (credit === 'four-to-eight') {
    headline = 'Shown apart, not added';
    detail = `${vessel.name} is under 100 GRT, so 4 to 8 hours may count if the Coast Guard accepts the schedule. We list it separately and never add it to your total.`;
  } else if (credit === 'short-large') {
    headline = 'Not credited';
    detail = `${vessel.name} is 100 GRT or more, and 4 to 8 hours is not a day on a vessel that size. The trip stays in your log.`;
  } else {
    headline = 'Not credited';
    detail = 'Under 4 hours is never a day. The trip stays in your log.';
  }
  const waters =
    credit !== 'day'
      ? null
      : v.waters === 'near-coastal'
        ? `Also counts toward your ${seaTime.nearCoastalRequired} near-coastal days.`
        : `Counts toward your ${seaTime.totalRequired} total days, not the ${seaTime.nearCoastalRequired} near-coastal days.`;
  const source =
    v.source === 'gps'
      ? 'Recorded from a GPS track.'
      : v.source === 'backfilled'
        ? 'Labeled backfilled on your CG-719S. It is never shown as GPS-verified.'
        : 'Labeled as entered by hand. It is not GPS-verified.';
  return { credit, headline, detail, waters, source };
}

export const emptyVessel = { name: '', type: '', length: '', grt: '', owner: '' };
export type VesselValues = typeof emptyVessel;
export type VesselErrors = Partial<Record<keyof VesselValues, string>>;

export function validateVessel(v: VesselValues): VesselErrors {
  const e: VesselErrors = {};
  if (!v.name.trim()) e.name = 'Give the vessel a name.';
  const len = Number(v.length);
  if (v.length.trim() === '' || Number.isNaN(len) || len <= 0)
    e.length = 'Enter the length in feet, like 28.';
  const grt = Number(v.grt);
  if (v.grt.trim() === '' || Number.isNaN(grt) || grt <= 0)
    e.grt = 'Enter the tonnage in GRT, like 11. It decides how short days are credited.';
  if (!v.owner.trim()) e.owner = 'Enter the owner’s name. They sign your sea-service letter.';
  return e;
}

// ---------------------------------------------------------------- the logbook

export interface Logbook {
  readonly rows: readonly Row[];
  readonly vessels: readonly VesselView[];
  readonly summary: Summary;
  readonly checkedIn: string | null;
  readonly prefill: Partial<TripValues> | null;
  readonly lastAdded: {
    readonly id: string;
    readonly before: number;
    readonly after: number;
  } | null;
  readonly checkIn: (vesselId: string) => void;
  readonly checkOut: () => void;
  readonly addTrip: (v: TripValues) => void;
  readonly undoAdd: () => void;
  readonly dismissAdded: () => void;
  readonly addVessel: (v: VesselValues) => string;
  readonly remind: (id: string) => void;
  readonly requestSignature: (id: string) => void;
  readonly markSigned: (id: string) => void;
}

const baseWaters = (id: string): Waters =>
  sampleTrips.find((t) => t.vesselId === id)?.waters ?? 'near-coastal';

const sortRows = (a: Row, b: Row) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0);

export function useLogbook(): Logbook {
  const [sessionTrips, setSessionTrips] = React.useState<readonly Row[]>([]);
  const [vesselStates, setVesselStates] = React.useState<readonly VesselState[]>(
    sampleVessels.map((v) => ({ ...v, reminded: false, signedSession: false, session: false })),
  );
  const [checkedIn, setCheckedIn] = React.useState<string | null>(null);
  const [prefill, setPrefill] = React.useState<Partial<TripValues> | null>(null);
  const [lastAdded, setLastAdded] = React.useState<Logbook['lastAdded']>(null);
  const counter = React.useRef(0);

  const patchVessel = React.useCallback((id: string, patch: Partial<VesselState>) => {
    setVesselStates((all) => all.map((v) => (v.id === id ? { ...v, ...patch } : v)));
  }, []);

  const derived = React.useMemo(() => {
    const nameOf = (id: string) => vesselStates.find((v) => v.id === id)?.name ?? 'Vessel';
    const base: Row[] = sampleTrips.map((t) => ({
      ...t,
      credit: t.credit,
      session: false,
      vesselName: nameOf(t.vesselId),
      signed:
        t.credit !== 'day' || vesselStates.find((v) => v.id === t.vesselId)?.signature === 'signed',
    }));
    const added: Row[] = sessionTrips.map((t) => {
      const v = vesselStates.find((x) => x.id === t.vesselId);
      return {
        ...t,
        signed: t.credit !== 'day' || Boolean(v?.signedSession),
        vesselName: nameOf(t.vesselId),
      };
    });
    const rows = [...added, ...base].sort(sortRows);

    const vessels: VesselView[] = vesselStates.map((v) => {
      const extra = sessionTrips.filter((t) => t.vesselId === v.id && t.credit === 'day').length;
      const credited = (v.session ? 0 : v.creditedDays) + extra;
      return {
        ...v,
        credited,
        unsignedDays: Math.max(0, credited - v.signedDays),
        waters: v.session ? 'near-coastal' : baseWaters(v.id),
      };
    });

    const n = (f: (r: Row) => boolean) => added.filter(f).length;
    const credited = seaTime.creditedDays + n((r) => r.credit === 'day');
    const signed = vessels.reduce((s, v) => s + v.signedDays, 0);
    const summary: Summary = {
      recorded: seaTime.recordedDays + added.length,
      credited,
      nearCoastal:
        seaTime.nearCoastalDays + n((r) => r.credit === 'day' && r.waters === 'near-coastal'),
      apart: seaTime.fourToEightDays + n((r) => r.credit === 'four-to-eight'),
      notCredited:
        seaTime.underFourDays + n((r) => r.credit === 'under-four' || r.credit === 'short-large'),
      backfilled:
        seaTime.backfilledDays + n((r) => r.source === 'backfilled' && r.credit === 'day'),
      gps: seaTime.gpsDays + n((r) => r.source === 'gps' && r.credit === 'day'),
      signed,
      awaiting: Math.max(0, credited - signed),
      verified: 0,
      totalRequired: seaTime.totalRequired,
      ncRequired: seaTime.nearCoastalRequired,
      totalToGo: Math.max(0, seaTime.totalRequired - credited),
      ncToGo: Math.max(
        0,
        seaTime.nearCoastalRequired -
          (seaTime.nearCoastalDays + n((r) => r.credit === 'day' && r.waters === 'near-coastal')),
      ),
      simulatorHours: seaTime.simulatorHours,
    };
    return { rows, vessels, summary };
  }, [sessionTrips, vesselStates]);

  const addTrip = React.useCallback(
    (v: TripValues) => {
      const vessel = vesselStates.find((x) => x.id === v.vesselId);
      const hours = parseHours(v.hours);
      if (!vessel || Number.isNaN(hours)) return;
      counter.current += 1;
      const id = `new-${counter.current}`;
      const row: Row = {
        id,
        date: v.date,
        vesselId: v.vesselId,
        route: v.source === 'gps' ? 'Checked in and out' : 'Added in this demo',
        waters: v.waters,
        role: v.role,
        hours,
        credit: creditOf(hours, vessel.grt),
        days: 1,
        source: v.source,
        session: true,
        signed: false,
        vesselName: vessel.name,
      };
      setLastAdded({
        id,
        before: derived.summary.credited,
        after: derived.summary.credited + (row.credit === 'day' ? 1 : 0),
      });
      setSessionTrips((all) => [...all, row]);
      setCheckedIn(null);
      setPrefill(null);
    },
    [vesselStates, derived.summary.credited],
  );

  return {
    ...derived,
    checkedIn,
    prefill,
    lastAdded,
    checkIn: (vesselId) => setCheckedIn(vesselId),
    checkOut: () => {
      setPrefill({ vesselId: checkedIn ?? 'morro-dawn', hours: '9', source: 'gps', date: TODAY });
    },
    addTrip,
    undoAdd: () => {
      if (!lastAdded) return;
      setSessionTrips((all) => all.filter((r) => r.id !== lastAdded.id));
      setLastAdded(null);
    },
    dismissAdded: () => setLastAdded(null),
    addVessel: (v) => {
      counter.current += 1;
      const id = `vessel-${counter.current}`;
      setVesselStates((all) => [
        ...all,
        {
          id,
          name: v.name.trim(),
          type: v.type.trim() || 'Vessel',
          lengthFt: Number(v.length),
          grt: Number(v.grt),
          owner: v.owner.trim(),
          creditedDays: 0,
          signedDays: 0,
          signature: 'not-requested',
          reminded: false,
          signedSession: false,
          session: true,
        },
      ]);
      return id;
    },
    remind: (id) => patchVessel(id, { reminded: true }),
    requestSignature: (id) => patchVessel(id, { signature: 'requested', reminded: true }),
    markSigned: (id) => {
      const v = derived.vessels.find((x) => x.id === id);
      if (!v) return;
      patchVessel(id, {
        signature: 'signed',
        signedDays: v.credited,
        signedSession: true,
        reminded: false,
      });
    },
  };
}

// ---------------------------------------------------------------- trip form

export function initialValues(lb: Logbook): TripValues {
  const first = lb.rows[0]?.vesselId ?? lb.vessels[0]?.id ?? '';
  return {
    vesselId: first,
    date: TODAY,
    hours: '',
    waters: 'near-coastal',
    role: 'Operator',
    source: 'manual',
    ...lb.prefill,
  };
}

// ---------------------------------------------------------------- filters

export interface Filters {
  vessel: string;
  waters: '' | Waters;
  waiting: boolean;
}
export const noFilters: Filters = { vessel: '', waters: '', waiting: false };

export function applyFilters(rows: readonly Row[], f: Filters): Row[] {
  return rows.filter(
    (r) =>
      (!f.vessel || r.vesselId === f.vessel) &&
      (!f.waters || r.waters === f.waters) &&
      (!f.waiting || (r.credit === 'day' && !r.signed)),
  );
}

export const filtersActive = (f: Filters) => Boolean(f.vessel || f.waters || f.waiting);

// ---------------------------------------------------------------- export sheet

export interface SheetData {
  readonly vessel: VesselView;
  readonly rows: readonly Row[];
  readonly byWaters: readonly {
    waters: Waters;
    days: number;
    apart: number;
    notCredited: number;
  }[];
  readonly backfilledDays: number;
  readonly listedBackfilled: number;
}

const BASE_BACKFILLED: Record<string, number> = { 'kelp-runner': seaTime.backfilledDays };

export function sheetFor(vessel: VesselView, all: readonly Row[]): SheetData {
  const rows = all.filter((r) => r.vesselId === vessel.id);
  const waters: Waters[] = ['near-coastal', 'inland'];
  const byWaters = waters.map((w) => {
    const mine = rows.filter((r) => r.waters === w);
    const sessionDays = mine.filter((r) => r.session && r.credit === 'day').length;
    const otherSession = rows.filter(
      (r) => r.session && r.credit === 'day' && r.waters !== vessel.waters,
    ).length;
    // The sample lists only recent trips; the vessel's full credited days belong to its usual waters.
    const days = w === vessel.waters ? vessel.credited - otherSession : sessionDays;
    return {
      waters: w,
      days,
      apart: mine.filter((r) => r.credit === 'four-to-eight').length,
      notCredited: mine.filter((r) => r.credit === 'under-four' || r.credit === 'short-large')
        .length,
    };
  });
  const sessionBackfilled = rows.filter(
    (r) => r.session && r.source === 'backfilled' && r.credit === 'day',
  ).length;
  const listedBackfilled = rows
    .filter((r) => r.source === 'backfilled' && r.credit === 'day')
    .reduce((s, r) => s + r.days, 0);
  return {
    vessel,
    rows,
    byWaters,
    backfilledDays: (BASE_BACKFILLED[vessel.id] ?? 0) + sessionBackfilled,
    listedBackfilled,
  };
}

export function useTripForm(lb: Logbook, onSaved: () => void) {
  const [values, setValues] = React.useState<TripValues>(() => initialValues(lb));
  const [tried, setTried] = React.useState(false);
  const errors = tried ? validateTrip(values) : {};
  const vessel = lb.vessels.find((v) => v.id === values.vesselId);
  const preview = previewTrip(values, vessel);
  const set = <K extends keyof TripValues>(k: K, val: TripValues[K]) =>
    setValues((x) => ({ ...x, [k]: val }));
  const submit = () => {
    setTried(true);
    if (Object.keys(validateTrip(values)).length > 0) return false;
    lb.addTrip(values);
    onSaved();
    return true;
  };
  return { values, set, errors, preview, vessel, submit, setTried, tried };
}
