// The sea-time log's domain: the shape of every record saved on the device
// (DECISIONS.md A3). The IndexedDB schema in src/log/schema.ts conforms to it,
// and the Postgres schema that arrives with sync will too.
//
// ## Sea-time entries
//
// An entry is either live (checked in and out on the day) or backfilled (a day
// tapped on a calendar later, with an hours range). These rules live in this
// shape, so no screen or later sync can break them:
//
// - Backfilled time stays backfilled. `source` is the only record of where an
//   entry came from, and no field can mark an entry as verified.
// - A backfilled day is saved only after the user consents to self-reporting
//   it (D1), and records when they did.
// - Credited days are never stored. The rules engine works them out from the
//   stored times and hours ranges each time, and the "not eligible" flag for a
//   day under 4 hours is worked out here the same way.
// - The waters are what the user confirmed. A GPS suggestion is kept in its
//   own field and never stands in for the confirmed value.
// - Game and simulator time are never sea time. No field refers to them.
//
// All object shapes are strict, so a record with any other field is refused
// on save and reported on read.

import { z } from 'zod';

/** The hours ranges a backfilled day can have (A3: under 4, 4–8, 8–12, 12+). */
export const HOURS_BANDS = ['under-4', '4-8', '8-12', '12-plus'] as const;
export type HoursBand = (typeof HOURS_BANDS)[number];

/**
 * The lower edge of each band, in hours. A band runs from its edge up to, but
 * not including, the next one: under 4 is [0, 4), then [4, 8), [8, 12) and
 * [12, ∞). So exactly 8 hours is in 8-12, and exactly 12 is in 12-plus.
 */
export const BAND_LOWER_EDGE_HOURS: Readonly<Record<HoursBand, number>> = {
  'under-4': 0,
  '4-8': 4,
  '8-12': 8,
  '12-plus': 12,
};

/** The band a number of hours falls in. */
export function bandForHours(hours: number): HoursBand {
  if (!Number.isFinite(hours) || hours < 0) {
    throw new RangeError(`Hours must be a number of 0 or more, got ${hours}.`);
  }
  if (hours < BAND_LOWER_EDGE_HOURS['4-8']) return 'under-4';
  if (hours < BAND_LOWER_EDGE_HOURS['8-12']) return '4-8';
  if (hours < BAND_LOWER_EDGE_HOURS['12-plus']) return '8-12';
  return '12-plus';
}

/** Where an entry came from. Nothing else may say. */
export const ENTRY_SOURCES = ['live', 'backfilled'] as const;
export type EntrySource = (typeof ENTRY_SOURCES)[number];

/**
 * The waters an entry was on (D2: every kind of waters that counts toward a
 * USCG license). Ids are stable and never reused; a new one arrives with a
 * migration. How each counts toward a license is the rules engine's job.
 *
 * - `oceans`: seaward of the Boundary Lines in 46 CFR part 7 (46 CFR 10.107).
 * - `near-coastal`: ocean waters up to 200 miles offshore (46 CFR 10.107).
 * - `great-lakes`: the Great Lakes and their connecting and tributary waters
 *   (46 CFR 10.107).
 * - `inland`: U.S. navigable waters shoreward of the Boundary Lines, not the
 *   Great Lakes (46 CFR 10.107).
 * - `western-rivers`: the Mississippi and its tributaries and the other
 *   waters listed in 33 CFR 83.03(n); a route of its own for towing.
 * - `inside-passage`: Puget Sound to Cape Spencer, credited as near-coastal
 *   but not oceans service (46 CFR 10.232(b)(3)).
 * - `rivers`: a river, canal or similar water designated by the Coast Guard
 *   (46 CFR 10.107). Whether it credits apart from inland is still open.
 */
export const WATERS = [
  'oceans',
  'near-coastal',
  'great-lakes',
  'inland',
  'western-rivers',
  'inside-passage',
  'rivers',
] as const;
export type Waters = (typeof WATERS)[number];

/** A role's id: its category, a dot, then a stable name, such as `deck.mate`. */
export const ROLE_ID = /^(deck|engine)\.[a-z0-9-]+$/;

const instant = z.iso.datetime();
const roleId = z.string().regex(ROLE_ID);

const common = {
  id: z.uuid(),
  /** When this device last changed the entry. Sync compares it later. */
  updatedAt: instant,
  /** Set instead of deleting, so a delete can reach other devices later. */
  deletedAt: instant.nullable(),
};

// Where and as what the user served. Entries saved before version 3 of the
// database have none of these, so a saved entry may hold null; every save
// from now on must give the vessel, role and confirmed waters.
const aboard = {
  vesselId: z.uuid().nullable(),
  roleId: roleId.nullable(),
  /** The waters the user confirmed. */
  waters: z.enum(WATERS).nullable(),
  /** A GPS suggestion, kept apart from the confirmed waters. */
  watersSuggestion: z.enum(WATERS).nullable(),
};

const aboardRequired = {
  vesselId: z.uuid(),
  roleId,
  waters: z.enum(WATERS),
  watersSuggestion: z.enum(WATERS).nullable(),
};

const live = {
  ...common,
  source: z.literal('live'),
  startedAt: instant,
  /** Null while the trip is still open. */
  endedAt: instant.nullable(),
};

const backfilled = {
  ...common,
  source: z.literal('backfilled'),
  day: z.iso.date(),
  hoursBand: z.enum(HOURS_BANDS),
};

const tripInOrder = (entry: { source: EntrySource; startedAt?: string; endedAt?: string | null }) =>
  entry.source !== 'live' ||
  entry.endedAt === null ||
  entry.endedAt === undefined ||
  entry.startedAt === undefined ||
  Date.parse(entry.endedAt) >= Date.parse(entry.startedAt);
const tripOrder = { message: 'A trip cannot end before it starts.', path: ['endedAt'] };

/** An entry as it is saved on the device. */
export const seaTimeEntrySchema = z
  .discriminatedUnion('source', [
    z.strictObject({ ...live, ...aboard }),
    z.strictObject({
      ...backfilled,
      ...aboard,
      /** When the user consented to backfilling. Null only on entries from before version 3. */
      consentedAt: instant.nullable(),
    }),
  ])
  .refine(tripInOrder, tripOrder);

export type SeaTimeEntry = z.infer<typeof seaTimeEntrySchema>;

/** An entry as it may be saved from now on: vessel, role, waters and consent all given. */
export const savableEntrySchema = z
  .discriminatedUnion('source', [
    z.strictObject({ ...live, ...aboardRequired }),
    z.strictObject({ ...backfilled, ...aboardRequired, consentedAt: instant }),
  ])
  .refine(tripInOrder, tripOrder);

type OmitEach<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;

/**
 * An entry as a caller gives it to the store, which stamps the bookkeeping
 * fields and, for a backfilled day, when the user consented.
 */
export type NewSeaTimeEntry = OmitEach<
  z.infer<typeof savableEntrySchema>,
  'updatedAt' | 'deletedAt' | 'consentedAt'
>;

/** How long a closed live trip lasted, in hours. Null for an open trip or a backfilled day. */
export function entryHours(entry: SeaTimeEntry): number | null {
  if (entry.source !== 'live' || entry.endedAt === null) return null;
  return (Date.parse(entry.endedAt) - Date.parse(entry.startedAt)) / 3_600_000;
}

/** The band an entry falls in: its own for a backfilled day, from its hours for a closed trip. */
export function entryBand(entry: SeaTimeEntry): HoursBand | null {
  if (entry.source === 'backfilled') return entry.hoursBand;
  const hours = entryHours(entry);
  return hours === null ? null : bandForHours(hours);
}

/**
 * True when an entry is under 4 hours, which never makes a day (46 CFR
 * 10.232(h)). Such an entry is flagged "not eligible", never deleted or
 * hidden (D1). An open trip is not flagged until it ends.
 */
export function isUnderFourHours(entry: SeaTimeEntry): boolean {
  return entryBand(entry) === 'under-4';
}

/**
 * Which informational note about days an entry gets (D1). The notes promise
 * nothing and no credit is worked out from them.
 *
 * - `short-day`: 4 to 8 hours, which may make a day only on vessels under
 *   100 GRT if the Coast Guard accepts the schedule (46 CFR 10.232(h)(3)).
 * - `two-watch`: 12 hours or more, which may be credited as 1½ days on
 *   vessels authorized for two watches (46 CFR 10.232(h)(2)).
 */
export type DayNote = 'short-day' | 'two-watch';

export function dayNoteFor(entry: SeaTimeEntry): DayNote | null {
  const band = entryBand(entry);
  if (band === '4-8') return 'short-day';
  if (band === '12-plus') return 'two-watch';
  return null;
}

// ## Preferences on this device
//
// Kept per device, not per entry: whether the user has consented to
// backfilling (D1), and the last check-in's choices, so a repeat check-in is
// one tap.

export const preferenceSchema = z.discriminatedUnion('key', [
  z.strictObject({ key: z.literal('backfill-consent'), givenAt: instant }),
  z.strictObject({
    key: z.literal('last-check-in'),
    vesselId: z.uuid(),
    roleId,
    waters: z.enum(WATERS),
  }),
]);

export type Preference = z.infer<typeof preferenceSchema>;
export type BackfillConsent = Extract<Preference, { key: 'backfill-consent' }>;
export type LastCheckIn = Extract<Preference, { key: 'last-check-in' }>;

// ## Roles
//
// What a person did aboard, picked from a seeded list (A3: "the list includes
// deck and engine jobs"). How a role counts toward a license is open decision
// D4, so a role carries no credit of any kind: the rules engine will map role
// ids to credit itself, once D4 is settled. Ids are stable and never reused,
// so that mapping and saved vessels can refer to them. New roles arrive
// through a schema migration, and new attributes through a change to this
// shape.

/** The departments a role belongs to. STCW is in scope, so both are needed. */
export const ROLE_CATEGORIES = ['deck', 'engine'] as const;
export type RoleCategory = (typeof ROLE_CATEGORIES)[number];

export const roleSchema = z
  .strictObject({
    /** Stable for good, such as `deck.mate`. Starts with the role's category. */
    id: z.string().regex(ROLE_ID),
    label: z.string().trim().min(1),
    category: z.enum(ROLE_CATEGORIES),
    /** Where the role appears in its category's list, lowest first. */
    position: z.number().int().nonnegative(),
  })
  .refine((role) => role.id.startsWith(`${role.category}.`), {
    message: "A role's id starts with its category.",
    path: ['id'],
  });

export type Role = z.infer<typeof roleSchema>;

// ## Vessels
//
// A vessel's full record (A3). Every detail but the name can be filled in
// later, so each is nullable; the printouts will refuse a vessel with details
// still missing.
//
// Tonnage is the official gross tonnage from the vessel's documents and
// nothing else. Whether any other way of working it out is acceptable is open
// decision D5, so no other tonnage field exists.

/** How the vessel is driven. Recorded as the owner says; it credits nothing here. */
export const PROPULSION_KINDS = [
  'motor',
  'sail',
  'auxiliary-sail',
  'steam',
  'gas-turbine',
  'other',
] as const;
export type Propulsion = (typeof PROPULSION_KINDS)[number];

const optionalText = z.string().trim().min(1).nullable();
const positive = z.number().positive().finite().nullable();

export const vesselSchema = z.strictObject({
  ...common,
  name: z.string().trim().min(1),
  /** The registration or official number. */
  officialNumber: optionalText,
  /** Official gross tonnage (GRT), copied from the vessel's documents. */
  officialGrossTons: positive,
  lengthFeet: positive,
  propulsion: z.enum(PROPULSION_KINDS).nullable(),
  owner: optionalText,
  horsepower: positive,
  /** A picture kept on this device only. */
  photo: z.instanceof(Blob).nullable(),
  /** The role a new entry on this vessel starts with. One of the seeded role ids. */
  defaultRoleId: z.string().min(1).nullable(),
});

export type Vessel = z.infer<typeof vesselSchema>;

/** A vessel as a caller gives it to the store, which stamps the bookkeeping fields. */
export type NewVessel = Omit<Vessel, 'updatedAt' | 'deletedAt'>;

/** The details a vessel record still lacks, in form order. Empty when it is complete. */
export const VESSEL_DETAILS = [
  'officialNumber',
  'officialGrossTons',
  'lengthFeet',
  'propulsion',
  'owner',
  'horsepower',
  'photo',
] as const satisfies readonly (keyof Vessel)[];
export type VesselDetail = (typeof VESSEL_DETAILS)[number];

export function missingDetails(vessel: Vessel): VesselDetail[] {
  return VESSEL_DETAILS.filter((detail) => vessel[detail] === null);
}
