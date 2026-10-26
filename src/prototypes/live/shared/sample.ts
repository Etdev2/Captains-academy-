// The one sample sailor every interactive prototype shows, so the fifteen
// variants can be compared fairly. Fictional person, vessels and records, the
// same as the Captain's Console mockups in docs/prototypes/captains-console/.
//
// Read-only for the category builders: derive from this file, never contradict
// it. Nothing here is saved anywhere, and no prototype writes to the real
// sea-time log or any browser storage.
//
// Rules: the OUPV near-coastal sea-service amounts come from the app's own
// rules engine (src/log/rules/oupv.ts, 46 CFR 11.467(c) and 10.107). Every
// other license figure, form rule and exam figure is marked `illustrative`:
// uscg-regs has not checked it, and the prototypes must say so where they show it.

import { OUPV_NEAR_COASTAL, OUPV_NEAR_COASTAL_REQUIREMENTS } from '../../../log/rules/oupv';

/** The prototypes' "today". Fixed, so every screenshot shows the same numbers. */
export const TODAY = '2026-10-26';

export const DEMO_NOTICE =
  'Sample data. Jordan Sample is fictional. Prototype only: nothing here is saved, and nothing here is a Coast Guard decision.';

export const NMC_NOTICE =
  'The National Maritime Center decides. Captain’s Academy can say logged time “appears to meet” a requirement; it never says you qualify.';

export const sailor = {
  name: 'Jordan Sample',
  legalName: 'Jonathan Quincy Sample',
  initials: 'JS',
  homePort: 'Long Beach, CA',
  memberSince: '2024-03',
  fictional: true,
} as const;

// ---------------------------------------------------------------- licenses

export interface LicenseOption {
  readonly id: string;
  readonly name: string;
  readonly short: string;
  readonly summary: string;
  /** Sea-service days asked for in total, and of them on ocean or near-coastal waters. */
  readonly totalDays: number;
  readonly nearCoastalDays: number;
  /** True only when the figures come from the checked rules engine. */
  readonly verified: boolean;
  readonly cfr: readonly string[];
  readonly kind: 'original' | 'upgrade';
}

const OUPV_TOTAL = OUPV_NEAR_COASTAL_REQUIREMENTS.total.days; // 360
const OUPV_NC = OUPV_NEAR_COASTAL_REQUIREMENTS.oceansOrNearCoastal.days; // 90

export const licenses: readonly LicenseOption[] = [
  {
    id: OUPV_NEAR_COASTAL.id,
    name: 'OUPV · Near coastal',
    short: 'OUPV NC',
    summary: 'Operator of Uninspected Passenger Vessels ("six-pack"), up to 100 miles offshore.',
    totalDays: OUPV_TOTAL,
    nearCoastalDays: OUPV_NC,
    verified: true,
    cfr: ['46 CFR 11.467(c)', '46 CFR 10.107'],
    kind: 'original',
  },
  {
    id: 'oupv-inland',
    name: 'OUPV · Inland',
    short: 'OUPV Inland',
    summary: 'Six-pack on inland waters only.',
    totalDays: 360,
    nearCoastalDays: 0,
    verified: false,
    cfr: [],
    kind: 'original',
  },
  {
    id: 'master-25-nc',
    name: 'Master 25 GRT · Near coastal',
    short: 'Master 25',
    summary: 'Inspected vessels up to 25 gross register tons. An upgrade path after OUPV.',
    totalDays: 360,
    nearCoastalDays: 90,
    verified: false,
    cfr: [],
    kind: 'upgrade',
  },
  {
    id: 'master-100-nc',
    name: 'Master 100 GRT · Near coastal',
    short: 'Master 100',
    summary: 'Inspected vessels up to 100 gross register tons.',
    totalDays: 720,
    nearCoastalDays: 360,
    verified: false,
    cfr: [],
    kind: 'upgrade',
  },
];

export const targetLicense = licenses[0] as LicenseOption;

// ---------------------------------------------------------------- credentials

export type CredentialStatus = 'on-file' | 'expiring' | 'extra';

export interface Credential {
  readonly id: string;
  readonly name: string;
  readonly detail: string;
  readonly status: CredentialStatus;
  /** ISO date the document stops being usable, if it has one. */
  readonly validTo?: string;
}

/** Jordan holds no Merchant Mariner Credential yet: OUPV would be the first. */
export const heldCredentials: readonly Credential[] = [
  {
    id: 'first-aid',
    name: 'First aid & CPR card',
    detail: 'Sample Red Cross course',
    status: 'on-file',
    validTo: '2028-03-31',
  },
  {
    id: 'physical',
    name: 'Physical exam · CG-719K',
    detail: 'Signed by a sample clinic, Aug 2026',
    status: 'on-file',
    validTo: '2027-08-14',
  },
  {
    id: 'drug-test',
    name: 'Drug test · CG-719P',
    detail: 'Usable window closes in 141 days (illustrative)',
    status: 'expiring',
    validTo: '2027-03-16',
  },
  {
    id: 'boater-card',
    name: 'California boater card',
    detail: 'Not required for OUPV · kept for reference',
    status: 'extra',
  },
];

// ---------------------------------------------------------------- requirements

export type RequirementStatus = 'appears-met' | 'in-progress' | 'to-do' | 'needs-fix';

export interface RequirementRow {
  readonly id: string;
  readonly label: string;
  readonly detail: string;
  readonly status: RequirementStatus;
  /** Where to go to work on it. */
  readonly area: 'sea-time' | 'license' | 'study';
  readonly verified: boolean;
}

export const requirements: readonly RequirementRow[] = [
  {
    id: 'age',
    label: 'Age 18 or older',
    detail: 'From your profile',
    status: 'appears-met',
    area: 'license',
    verified: false,
  },
  {
    id: 'sea-any',
    label: 'Sea time, any waters',
    detail: `298 of ${OUPV_TOTAL} days · 62 to go`,
    status: 'in-progress',
    area: 'sea-time',
    verified: true,
  },
  {
    id: 'sea-nc',
    label: 'Of which ocean or near coastal',
    detail: `61 of ${OUPV_NC} days · 29 to go`,
    status: 'in-progress',
    area: 'sea-time',
    verified: true,
  },
  {
    id: 'first-aid',
    label: 'First aid & CPR',
    detail: 'Card on file',
    status: 'appears-met',
    area: 'license',
    verified: false,
  },
  {
    id: 'physical',
    label: 'Physical exam',
    detail: 'CG-719K on file',
    status: 'appears-met',
    area: 'license',
    verified: false,
  },
  {
    id: 'drug-test',
    label: 'Drug test',
    detail: 'CG-719P on file · window closes Mar 16, 2027',
    status: 'appears-met',
    area: 'license',
    verified: false,
  },
  {
    id: 'exam',
    label: 'Exam or approved course',
    detail: 'Not started · Rules of the Road mock exam at 68%',
    status: 'to-do',
    area: 'study',
    verified: false,
  },
  {
    id: 'application',
    label: 'Application · CG-719B',
    detail: 'Draft · 3 corrections found by pre-check',
    status: 'needs-fix',
    area: 'license',
    verified: false,
  },
];

// ---------------------------------------------------------------- sea time

export interface Vessel {
  readonly id: string;
  readonly name: string;
  readonly type: string;
  readonly lengthFt: number;
  readonly grt: number;
  readonly owner: string;
  readonly creditedDays: number;
  /** Days on this vessel the owner has signed for on a CG-719S sea-service letter. */
  readonly signedDays: number;
  readonly signature: 'signed' | 'requested' | 'not-requested';
}

export const vessels: readonly Vessel[] = [
  {
    id: 'morro-dawn',
    name: 'Morro Dawn',
    type: 'Sportfisher',
    lengthFt: 32,
    grt: 11,
    owner: 'R. Example (fictional)',
    creditedDays: 61,
    signedDays: 61,
    signature: 'signed',
  },
  {
    id: 'kelp-runner',
    name: 'Kelp Runner',
    type: 'Center console',
    lengthFt: 24,
    grt: 3,
    owner: 'T. Placeholder (fictional)',
    creditedDays: 237,
    signedDays: 0,
    signature: 'requested',
  },
];

export type Waters = 'near-coastal' | 'inland';
export type DayCredit = 'day' | 'four-to-eight' | 'under-four';
export type Source = 'gps' | 'manual' | 'backfilled';

export interface Trip {
  readonly id: string;
  /** ISO date, or ISO month for a backfilled batch. */
  readonly date: string;
  readonly vesselId: string;
  readonly route: string;
  readonly waters: Waters;
  readonly role: 'Operator' | 'Deckhand' | 'Mate';
  readonly hours: number | null;
  readonly credit: DayCredit;
  /** Days this row covers: 1 for a trip, more for a backfilled batch. */
  readonly days: number;
  readonly source: Source;
}

export const trips: readonly Trip[] = [
  {
    id: 't-1019',
    date: '2026-10-19',
    vesselId: 'morro-dawn',
    route: 'Long Beach → Avalon',
    waters: 'near-coastal',
    role: 'Operator',
    hours: 9.5,
    credit: 'day',
    days: 1,
    source: 'gps',
  },
  {
    id: 't-1018',
    date: '2026-10-18',
    vesselId: 'morro-dawn',
    route: 'Avalon → Long Beach',
    waters: 'near-coastal',
    role: 'Operator',
    hours: 8,
    credit: 'day',
    days: 1,
    source: 'gps',
  },
  {
    id: 't-1012',
    date: '2026-10-12',
    vesselId: 'kelp-runner',
    route: 'Alamitos Bay',
    waters: 'inland',
    role: 'Operator',
    hours: 5.5,
    credit: 'four-to-eight',
    days: 1,
    source: 'gps',
  },
  {
    id: 't-1011',
    date: '2026-10-11',
    vesselId: 'kelp-runner',
    route: 'Harbor tour, 2 entries',
    waters: 'inland',
    role: 'Deckhand',
    hours: 8.5,
    credit: 'day',
    days: 1,
    source: 'gps',
  },
  {
    id: 't-1009',
    date: '2026-10-09',
    vesselId: 'kelp-runner',
    route: 'Fuel dock run',
    waters: 'inland',
    role: 'Operator',
    hours: 2.5,
    credit: 'under-four',
    days: 1,
    source: 'manual',
  },
  {
    id: 't-1005',
    date: '2026-10-05',
    vesselId: 'morro-dawn',
    route: 'Horseshoe Kelp',
    waters: 'near-coastal',
    role: 'Operator',
    hours: 10,
    credit: 'day',
    days: 1,
    source: 'gps',
  },
  {
    id: 'b-2025-04',
    date: '2025-04',
    vesselId: 'kelp-runner',
    route: '14 trips, entered later',
    waters: 'inland',
    role: 'Operator',
    hours: null,
    credit: 'day',
    days: 14,
    source: 'backfilled',
  },
  {
    id: 'b-2025-03',
    date: '2025-03',
    vesselId: 'kelp-runner',
    route: '12 trips, entered later',
    waters: 'inland',
    role: 'Operator',
    hours: null,
    credit: 'day',
    days: 12,
    source: 'backfilled',
  },
];

/**
 * The sea-time picture, kept apart on purpose:
 * - recorded: every calendar day with a log entry, whether it counts or not;
 * - credited: days that appear to count under the rules engine;
 * - signed: credited days a vessel owner has signed for on a CG-719S;
 * - verified: only the NMC verifies service, when it evaluates an application.
 */
export const seaTime = {
  recordedDays: 316,
  creditedDays: 298,
  gpsDays: 256,
  backfilledDays: 42,
  /** 4-to-8-hour days on vessels under 100 GRT: shown apart, never added. */
  fourToEightDays: 14,
  /** Days under 4 hours: recorded, never credited. */
  underFourDays: 4,
  nearCoastalDays: 61,
  inlandDays: 237,
  signedDays: 61,
  awaitingSignatureDays: 237,
  verifiedByNmcDays: 0,
  totalRequired: OUPV_TOTAL,
  nearCoastalRequired: OUPV_NC,
  totalToGo: OUPV_TOTAL - 298,
  nearCoastalToGo: OUPV_NC - 61,
  /** Never counts as sea time (AGENTS.md). */
  simulatorHours: 11.5,
  totalTrips: 214,
  lastTripEnded: '2026-10-19',
  /** Recent pace, for "about 10 weeks to go" estimates. */
  daysPerWeek: 3,
  cfr: ['46 CFR 11.467(c)', '46 CFR 10.107', '46 CFR 10.232'],
} as const;

/** Credited days by month, Nov 2025 to Oct 2026. Illustrative split. */
export const creditedByMonth: readonly {
  month: string;
  nearCoastal: number;
  inland: number;
}[] = [
  { month: '2025-11', nearCoastal: 2, inland: 4 },
  { month: '2025-12', nearCoastal: 0, inland: 3 },
  { month: '2026-01', nearCoastal: 1, inland: 3 },
  { month: '2026-02', nearCoastal: 2, inland: 4 },
  { month: '2026-03', nearCoastal: 4, inland: 5 },
  { month: '2026-04', nearCoastal: 5, inland: 6 },
  { month: '2026-05', nearCoastal: 7, inland: 6 },
  { month: '2026-06', nearCoastal: 9, inland: 7 },
  { month: '2026-07', nearCoastal: 10, inland: 6 },
  { month: '2026-08', nearCoastal: 9, inland: 5 },
  { month: '2026-09', nearCoastal: 6, inland: 4 },
  { month: '2026-10', nearCoastal: 6, inland: 4 },
];

// ---------------------------------------------------------------- forms

export type FormStatus = 'done' | 'needs-work' | 'not-started' | 'in-progress';

export interface FormDoc {
  readonly id: string;
  readonly code: string;
  readonly name: string;
  readonly status: FormStatus;
  readonly detail: string;
  readonly plain: string;
}

export const forms: readonly FormDoc[] = [
  {
    id: 'cg-719b',
    code: 'CG-719B',
    name: 'Application for a Merchant Mariner Credential',
    status: 'needs-work',
    detail: 'Draft · 3 corrections',
    plain: 'The main application. It says who you are and which license you want.',
  },
  {
    id: 'cg-719s',
    code: 'CG-719S',
    name: 'Small vessel sea service',
    status: 'in-progress',
    detail: '1 of 2 vessels signed',
    plain: 'Each vessel owner signs for the days you served aboard.',
  },
  {
    id: 'cg-719k',
    code: 'CG-719K',
    name: 'Medical certificate application',
    status: 'done',
    detail: 'Signed Aug 2026',
    plain: 'Your physical exam, signed by a licensed medical practitioner.',
  },
  {
    id: 'cg-719p',
    code: 'CG-719P',
    name: 'DOT/USCG drug test',
    status: 'done',
    detail: 'Window closes Mar 16, 2027',
    plain: 'Proof of a passed drug test.',
  },
  {
    id: 'first-aid-cert',
    code: 'Certificate',
    name: 'First aid & CPR',
    status: 'done',
    detail: 'Valid to Mar 2028',
    plain: 'A copy of your first aid and CPR course cards.',
  },
  {
    id: 'exam-cert',
    code: 'Certificate',
    name: 'Exam or approved course',
    status: 'not-started',
    detail: 'After the exam',
    plain: 'Proof you passed the exam, or an approved course instead.',
  },
];

export interface FormField {
  readonly id: string;
  readonly section: 'Applicant' | 'Credential sought' | 'Supporting documents';
  readonly label: string;
  readonly value: string;
  /** What pre-check found, if anything. */
  readonly issue?: {
    readonly title: string;
    readonly help: string;
    readonly fix?: string;
  };
}

/** CG-719B, sections I to III, as the pre-check review shows it. Field rules are illustrative. */
export const applicationFields: readonly FormField[] = [
  {
    id: 'legal-name',
    section: 'Applicant',
    label: 'Legal name',
    value: 'Jon Q. Sample',
    issue: {
      title: 'Name doesn’t match your ID',
      help: 'Use your full legal name as it appears on the uploaded driver’s license.',
      fix: 'Jonathan Quincy Sample',
    },
  },
  { id: 'dob', section: 'Applicant', label: 'Date of birth', value: '07/04/1991' },
  { id: 'email', section: 'Applicant', label: 'Email', value: 'jordan.sample@example.com' },
  { id: 'phone', section: 'Applicant', label: 'Phone', value: '(555) 010-0199' },
  {
    id: 'address',
    section: 'Applicant',
    label: 'Mailing address',
    value: '100 Sample Pier Way, Long Beach, CA',
    issue: {
      title: 'Mailing address is incomplete',
      help: 'The ZIP code is missing.',
    },
  },
  { id: 'transaction', section: 'Credential sought', label: 'Transaction', value: 'Original' },
  {
    id: 'endorsement',
    section: 'Credential sought',
    label: 'Endorsement',
    value: 'OUPV · Inland',
    issue: {
      title: 'Endorsement doesn’t match your goal',
      help: 'The form says Inland. Your License Navigator goal is Near coastal.',
      fix: 'OUPV · Near coastal',
    },
  },
  {
    id: 'sea-service',
    section: 'Supporting documents',
    label: 'Sea service',
    value: 'CG-719S · attached',
  },
  { id: 'medical', section: 'Supporting documents', label: 'Medical', value: 'CG-719K · attached' },
  {
    id: 'drug',
    section: 'Supporting documents',
    label: 'Drug test',
    value: 'CG-719P · attached',
  },
  { id: 'exam', section: 'Supporting documents', label: 'Exam', value: 'Add after the exam' },
];

/** The application's journey. Jordan is at "Draft". */
export const applicationStages = [
  'Draft',
  'Pre-check passed',
  'Sent to REC',
  'NMC evaluating',
  'Approved to test',
  'Credential issued',
] as const;
export const applicationStage = 0;

export const backfillNote =
  '42 days on Kelp Runner were entered after the fact. They stay labeled backfilled on CG-719S and need the owner’s signature.';

// ---------------------------------------------------------------- study

export interface StudyTopic {
  readonly id: string;
  readonly name: string;
  /** Share of the topic's lessons done, 0 to 100. */
  readonly progress: number;
  /** Last practice score, 0 to 100, or null if never practiced. */
  readonly score: number | null;
  readonly lessons: number;
  readonly weak: boolean;
}

/** Topics follow the usual OUPV exam modules. Module names and scores are illustrative. */
export const studyTopics: readonly StudyTopic[] = [
  { id: 'rules', name: 'Rules of the Road', progress: 72, score: 68, lessons: 18, weak: true },
  {
    id: 'deck-safety',
    name: 'Deck General & Safety',
    progress: 48,
    score: 81,
    lessons: 14,
    weak: false,
  },
  {
    id: 'navigation',
    name: 'Navigation General',
    progress: 35,
    score: 74,
    lessons: 12,
    weak: false,
  },
  { id: 'plotting', name: 'Chart Plotting', progress: 20, score: 55, lessons: 8, weak: true },
];

export const weakSpots: readonly string[] = [
  'Lights of towing vessels (Rule 24)',
  'Sound signals in restricted visibility (Rule 35)',
  'Who gives way when crossing (Rule 15)',
  'Set and drift on a plotted course',
];

export const mockExam = {
  module: 'Rules of the Road',
  date: '2026-10-21',
  score: 68,
  /** Illustrative pass mark until uscg-regs checks it. */
  passMark: 90,
  questions: 50,
  correct: 34,
  minutes: 41,
  next: '2026-11-02',
} as const;

export const studyStreakDays = 6;

// ---------------------------------------------------------------- arcade

export interface ArcadeChallenge {
  readonly id: string;
  readonly name: string;
  readonly kind: 'docking' | 'rules' | 'navigation';
  readonly blurb: string;
  readonly status: 'cleared' | 'open' | 'locked';
  readonly best?: string;
  readonly stars: 0 | 1 | 2 | 3;
  /** The level as built in the real game, if it exists. */
  readonly builtAt?: string;
}

export const arcadeChallenges: readonly ArcadeChallenge[] = [
  {
    id: 'long-beach-docking',
    name: 'Long Beach: dock the boat',
    kind: 'docking',
    blurb: 'Bring her alongside the slip without touching the pilings.',
    status: 'cleared',
    best: '1:42',
    stars: 3,
    builtAt: '/play/',
  },
  {
    id: 'crosswind-slip',
    name: 'Crosswind slip',
    kind: 'docking',
    blurb: 'Same slip, 15 knots across the bow.',
    status: 'cleared',
    best: '2:14',
    stars: 2,
    builtAt: '/play/',
  },
  {
    id: 'harbor-traffic',
    name: 'Harbor traffic',
    kind: 'navigation',
    blurb: 'Cross the main channel with a container ship inbound.',
    status: 'open',
    stars: 0,
    builtAt: '/play/',
  },
  {
    id: 'definitions',
    name: 'Rule 3: name that vessel',
    kind: 'rules',
    blurb: 'Rapid-fire: which Rule 3 term fits her best?',
    status: 'cleared',
    best: '58 s',
    stars: 2,
    builtAt: '/rules/',
  },
  {
    id: 'night-crossing',
    name: 'Night crossing: read the lights',
    kind: 'rules',
    blurb: 'Lights ahead in the dark. Who is she, and who gives way?',
    status: 'open',
    stars: 0,
  },
  {
    id: 'fog-leg',
    name: 'Fog leg',
    kind: 'rules',
    blurb: 'Sound signals only. Pick the right one before she closes.',
    status: 'locked',
    stars: 0,
  },
];

export const SIM_NOTICE = 'Game time is practice. It never counts as sea time.';

// ---------------------------------------------------------------- tasks

export interface Task {
  readonly id: string;
  readonly title: string;
  readonly why: string;
  readonly area: 'license' | 'sea-time' | 'study' | 'arcade';
  /** ISO date, or null when it has no deadline. */
  readonly due: string | null;
  readonly minutes?: number;
  readonly illustrative?: boolean;
}

/** In the order the sailor should take them. The first is the next useful action. */
export const tasks: readonly Task[] = [
  {
    id: 'fix-719b',
    title: 'Fix 3 corrections on your CG-719B',
    why: 'Pre-check found them. About 5 minutes, and the application is ready for the exam step.',
    area: 'license',
    due: null,
    minutes: 5,
  },
  {
    id: 'sign-kelp-runner',
    title: 'Remind T. Placeholder to sign for Kelp Runner',
    why: '237 credited days wait on the owner’s signature on CG-719S.',
    area: 'sea-time',
    due: '2026-11-09',
    minutes: 2,
  },
  {
    id: 'mock-exam',
    title: 'Retake the Rules of the Road mock exam',
    why: 'Last score 68%. Review lights of towing vessels first.',
    area: 'study',
    due: '2026-11-02',
    minutes: 45,
  },
  {
    id: 'near-coastal',
    title: 'Log 29 more days on near-coastal waters',
    why: 'The part furthest behind. At about 3 days a week, roughly 10 weeks.',
    area: 'sea-time',
    due: null,
  },
  {
    id: 'drug-window',
    title: 'Drug test window closes',
    why: 'Send the application before Mar 16, 2027, or test again.',
    area: 'license',
    due: '2027-03-16',
    illustrative: true,
  },
];

export const nextAction = tasks[0] as Task;
