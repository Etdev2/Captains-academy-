import * as React from 'react';
import {
  applicationFields,
  forms,
  licenses,
  requirements,
  seaTime,
  tasks,
  type FormDoc,
  type FormField,
  type LicenseOption,
  type RequirementRow,
} from '../shared/sample';

// Demo logic shared by the three License Navigator variants. Everything lives in
// React state. Nothing is saved, and nothing is sent anywhere.

// ------------------------------------------------------------------ glossary

export type TermId = 'oupv' | 'six-pack' | 'mmc' | 'nmc' | 'rec';

export const glossary: Record<TermId, { short: string; long: string; plain: string }> = {
  oupv: {
    short: 'OUPV',
    long: 'Operator of Uninspected Passenger Vessels',
    plain:
      'A license to carry up to six paying passengers on a small boat. Mariners call it the six-pack.',
  },
  'six-pack': {
    short: 'Six-pack',
    long: 'Six-pack',
    plain:
      'Nickname for the OUPV license. It lets you carry up to six paying passengers on a boat the Coast Guard does not inspect.',
  },
  mmc: {
    short: 'MMC',
    long: 'Merchant Mariner Credential',
    plain: 'The credential the Coast Guard issues to you. A license is an endorsement on it.',
  },
  nmc: {
    short: 'NMC',
    long: 'National Maritime Center',
    plain: 'The Coast Guard office that reads your application and decides.',
  },
  rec: {
    short: 'REC',
    long: 'Regional Exam Center',
    plain:
      'A Coast Guard office where you hand in your application and sit exams. It passes the packet to the NMC.',
  },
};

export const GLOSSARY_NOTE = 'Plain-language gloss, not legal text.';

/** Inline explanation. A real button, so it works with a thumb, a glove and a keyboard. */
export function Term({ id, p, children }: { id: TermId; p: string; children?: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);
  const g = glossary[id];
  const defId = React.useId();
  return (
    <span className={`${p}-term`}>
      <button
        type="button"
        className={`${p}-term-btn`}
        aria-expanded={open}
        aria-controls={defId}
        onClick={() => setOpen((v) => !v)}
      >
        {children ?? g.short}
      </button>
      <span id={defId} className={`${p}-term-def`} role="note" hidden={!open}>
        <b>{g.long}.</b> {g.plain}
      </span>
    </span>
  );
}

export function Glossary({ p }: { p: string }) {
  return (
    <dl className={`${p}-gloss`}>
      {(Object.keys(glossary) as TermId[]).map((id) => (
        <div key={id}>
          <dt>
            {glossary[id].short}
            {glossary[id].long !== glossary[id].short ? <span> · {glossary[id].long}</span> : null}
          </dt>
          <dd>{glossary[id].plain}</dd>
        </div>
      ))}
    </dl>
  );
}

// ------------------------------------------------------------------ licenses

export const OUPV_NC_ID = licenses[0]?.id ?? 'oupv-near-coastal';
export const ILLUSTRATIVE = 'Illustrative, not yet checked against 46 CFR';

export interface SeaView {
  anyDone: number;
  anyReq: number;
  ncDone: number;
  ncReq: number;
  ncApplies: boolean;
  illustrative: boolean;
}

export function seaView(l: LicenseOption): SeaView {
  return {
    anyDone: seaTime.creditedDays,
    anyReq: l.totalDays,
    ncDone: seaTime.nearCoastalDays,
    ncReq: l.nearCoastalDays,
    ncApplies: l.nearCoastalDays > 0,
    illustrative: !l.verified,
  };
}

export const findLicense = (id: string): LicenseOption =>
  licenses.find((l) => l.id === id) ?? (licenses[0] as LicenseOption);

// ------------------------------------------------------------------ review

export type Resolution = 'fixed' | 'kept' | 'typed';
export const ZIP_RE = /^\d{5}(-\d{4})?$/;
export const ZIP_ERROR = 'Type 5 digits, like 12345. A ZIP+4 such as 12345-6789 also works.';

export interface Issue {
  readonly field: FormField;
  readonly n: number;
}

export const issues: readonly Issue[] = applicationFields
  .filter((f) => f.issue)
  .map((field, i) => ({ field, n: i + 1 }));

export interface ReviewApi {
  resolution: Record<string, Resolution | undefined>;
  values: Record<string, string>;
  openCount: number;
  total: number;
  passed: boolean;
  keptCount: number;
  valueOf: (id: string) => string;
  applyFix: (id: string) => void;
  keep: (id: string) => void;
  /** Returns an error sentence, or null when the ZIP was accepted. */
  typeZip: (id: string, zip: string) => string | null;
  undo: (id: string) => void;
  reset: () => void;
}

export function useReview(): ReviewApi {
  const [resolution, setResolution] = React.useState<Record<string, Resolution | undefined>>({});
  const [values, setValues] = React.useState<Record<string, string>>({});
  const set = (id: string, r: Resolution | undefined, v?: string) => {
    setResolution((s) => ({ ...s, [id]: r }));
    setValues((s) => {
      const rest = Object.fromEntries(Object.entries(s).filter(([k]) => k !== id));
      return v === undefined ? rest : { ...rest, [id]: v };
    });
  };
  const total = issues.length;
  const done = issues.filter((i) => resolution[i.field.id]).length;
  return {
    resolution,
    values,
    total,
    openCount: total - done,
    passed: done === total,
    keptCount: issues.filter((i) => resolution[i.field.id] === 'kept').length,
    valueOf: (id) => values[id] ?? applicationFields.find((f) => f.id === id)?.value ?? '',
    applyFix: (id) => set(id, 'fixed', applicationFields.find((f) => f.id === id)?.issue?.fix),
    keep: (id) => set(id, 'kept'),
    typeZip: (id, zip) => {
      const z = zip.trim();
      if (!ZIP_RE.test(z)) return ZIP_ERROR;
      const base = applicationFields.find((f) => f.id === id)?.value ?? '';
      set(id, 'typed', `${base} ${z}`);
      return null;
    },
    undo: (id) => set(id, undefined),
    reset: () => {
      setResolution({});
      setValues({});
    },
  };
}

export const resolutionText = (r: Resolution | undefined): string =>
  r === 'fixed' ? 'Fixed' : r === 'typed' ? 'ZIP added' : r === 'kept' ? 'Kept as typed' : 'Open';

export const issueLabel = (n: number) => `${n} ${n === 1 ? 'correction' : 'corrections'}`;

// ------------------------------------------------------------------ requirements

export type Tone = 'done' | 'need' | 'idle';

export interface ReqView extends RequirementRow {
  label: string;
  tone: Tone;
  statusText: string;
  illustrative: boolean;
  /** Present for the two sea-time rows, to draw a gauge. */
  gauge?: { done: number; of: number };
}

const toneOf = (s: RequirementRow['status']): Tone =>
  s === 'appears-met' ? 'done' : s === 'to-do' ? 'idle' : 'need';
const statusOf = (s: RequirementRow['status']): string =>
  s === 'appears-met'
    ? 'Appears met'
    : s === 'in-progress'
      ? 'In progress'
      : s === 'to-do'
        ? 'To do'
        : 'Needs fixes';

export function buildRequirements(l: LicenseOption, review: ReviewApi): ReqView[] {
  const v = seaView(l);
  const out: ReqView[] = [];
  for (const r of requirements) {
    if (r.id === 'sea-nc' && !v.ncApplies) continue;
    let row: ReqView = {
      ...r,
      tone: toneOf(r.status),
      statusText: statusOf(r.status),
      illustrative: !(r.verified && l.verified),
    };
    if (r.id === 'sea-any' || r.id === 'sea-nc') {
      const done = r.id === 'sea-any' ? v.anyDone : v.ncDone;
      const of = r.id === 'sea-any' ? v.anyReq : v.ncReq;
      const toGo = Math.max(of - done, 0);
      row = {
        ...row,
        detail: `${done} of ${of} days · ${toGo} to go`,
        gauge: { done, of },
        status: toGo === 0 ? 'appears-met' : 'in-progress',
        tone: toGo === 0 ? 'done' : 'need',
        statusText: toGo === 0 ? 'Appears met' : `${toGo} to go`,
      };
    }
    if (r.id === 'application') {
      row = review.passed
        ? {
            ...row,
            detail: 'Pre-check passed · not sent yet',
            status: 'appears-met',
            tone: 'done',
            statusText: 'Pre-check passed',
          }
        : {
            ...row,
            detail: `Draft · ${issueLabel(review.openCount)} to fix`,
            statusText: `Fix ${review.openCount}`,
          };
    }
    out.push(row);
  }
  return out;
}

export interface NextStep {
  title: string;
  why: string;
  to: 'review' | 'sea-time' | 'status';
  cta: string;
}

export function nextStepFor(l: LicenseOption, review: ReviewApi): NextStep {
  if (!review.passed) {
    return {
      title: `Fix ${issueLabel(review.openCount)} on your CG-719B`,
      why: tasks[0]?.why ?? '',
      to: 'review',
      cta: 'Fix my application',
    };
  }
  const v = seaView(l);
  const days = v.ncApplies ? Math.max(v.ncReq - v.ncDone, 0) : Math.max(v.anyReq - v.anyDone, 0);
  const where = v.ncApplies ? 'on ocean or near-coastal waters' : 'on any waters';
  const weeks = Math.ceil(days / seaTime.daysPerWeek);
  return {
    title: `Log ${days} more days ${where}`,
    why: `The part furthest behind. At about ${seaTime.daysPerWeek} days a week, roughly ${weeks} weeks.`,
    to: 'sea-time',
    cta: 'Open the sea-time log',
  };
}

// ------------------------------------------------------------------ forms and documents

export const formsStillMissing = (list: readonly FormDoc[]) =>
  list.filter((f) => f.status !== 'done');

export const formTone = (s: FormDoc['status']): Tone =>
  s === 'done' ? 'done' : s === 'not-started' ? 'idle' : 'need';
export const formStatusText = (s: FormDoc['status'], review: ReviewApi, id: string): string => {
  if (id === 'cg-719b' && review.passed) return 'Pre-check passed';
  return s === 'done'
    ? 'Done'
    : s === 'not-started'
      ? 'Not started'
      : s === 'in-progress'
        ? 'In progress'
        : 'Needs work';
};
export const formDetail = (f: FormDoc, review: ReviewApi): string =>
  f.id === 'cg-719b' && review.passed
    ? 'Draft · pre-check passed'
    : f.id === 'cg-719b'
      ? `Draft · ${issueLabel(review.openCount)}`
      : f.detail;
export const formEffectiveTone = (f: FormDoc, review: ReviewApi): Tone =>
  f.id === 'cg-719b' && review.passed ? 'done' : formTone(f.status);

export const examNote =
  'Exam or approved course. Your Rules of the Road mock exam is at 68%. The pass mark is illustrative until checked.';

export const stages = [
  {
    label: 'Draft',
    who: 'You',
    what: 'You fill in the CG-719B and gather your forms. Nothing has been sent.',
  },
  {
    label: 'Pre-check passed',
    who: "Captain's Academy checks it. This is not a Coast Guard decision.",
    what: 'The app looks for typos and missing fields. A clean pre-check does not mean the Coast Guard will accept it.',
  },
  {
    label: 'Sent to REC',
    who: 'The Regional Exam Center',
    what: 'The REC takes your application and passes the packet on to the NMC.',
  },
  {
    label: 'NMC evaluating',
    who: 'The National Maritime Center decides',
    what: 'The NMC reviews your sea service, medical exam and other evidence. It may ask for more.',
  },
  {
    label: 'Ready to test',
    who: 'The National Maritime Center decides',
    what: 'If the NMC finds your packet complete, you may sit the exam. The NMC makes that call.',
  },
  {
    label: 'Credential issued',
    who: 'The National Maritime Center',
    what: 'The NMC issues your credential with the license on it.',
  },
] as const;

export const STAGES_NOTE = 'Steps are simplified and illustrative until uscg-regs checks them.';

export const currentStage = (review: ReviewApi) => (review.passed ? 1 : 0);

// ------------------------------------------------------------------ journey state

export function useJourney() {
  const [licenseId, setLicenseId] = React.useState(OUPV_NC_ID);
  const review = useReview();
  const license = findLicense(licenseId);
  const reqs = React.useMemo(() => buildRequirements(license, review), [license, review]);
  const next = nextStepFor(license, review);
  return { license, setLicenseId, review, reqs, next, forms, seaView: seaView(license) };
}
export type Journey = ReturnType<typeof useJourney>;
