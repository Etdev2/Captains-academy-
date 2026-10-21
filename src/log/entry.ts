// The sea-time log's domain: the shape of every record saved on the device
// (DECISIONS.md A3). The IndexedDB schema in src/log/schema.ts conforms to it,
// and the Postgres schema that arrives with sync will too.
//
// ## Sea-time entries
//
// An entry is either live (checked in and out on the day) or backfilled (a day
// tapped on a calendar later, with an hours range). Three rules live in this
// shape, so no screen or later sync can break them:
//
// - Backfilled time stays backfilled. `source` is the only record of where an
//   entry came from, and no field can mark an entry as verified.
// - Credited days are never stored. The rules engine works them out from the
//   stored times and hours ranges each time.
// - Game and simulator time are never sea time. No field refers to them.
//
// Both object shapes are strict, so a record with any other field is refused
// on save and reported on read. Waters arrive in a later change with their own
// field.

import { z } from 'zod';

/** The hours ranges a backfilled day can have (A3: under 4, 4–8, 8–12, 12+). */
export const HOURS_BANDS = ['under-4', '4-8', '8-12', '12-plus'] as const;
export type HoursBand = (typeof HOURS_BANDS)[number];

/** Where an entry came from. Nothing else may say. */
export const ENTRY_SOURCES = ['live', 'backfilled'] as const;
export type EntrySource = (typeof ENTRY_SOURCES)[number];

const instant = z.iso.datetime();

const common = {
  id: z.uuid(),
  /** When this device last changed the entry. Sync compares it later. */
  updatedAt: instant,
  /** Set instead of deleting, so a delete can reach other devices later. */
  deletedAt: instant.nullable(),
};

const liveEntry = z.strictObject({
  ...common,
  source: z.literal('live'),
  startedAt: instant,
  /** Null while the trip is still open. */
  endedAt: instant.nullable(),
});

const backfilledEntry = z.strictObject({
  ...common,
  source: z.literal('backfilled'),
  day: z.iso.date(),
  hoursBand: z.enum(HOURS_BANDS),
});

export const seaTimeEntrySchema = z
  .discriminatedUnion('source', [liveEntry, backfilledEntry])
  .refine(
    (entry) =>
      entry.source !== 'live' ||
      entry.endedAt === null ||
      Date.parse(entry.endedAt) >= Date.parse(entry.startedAt),
    { message: 'A trip cannot end before it starts.', path: ['endedAt'] },
  );

export type SeaTimeEntry = z.infer<typeof seaTimeEntrySchema>;

type OmitEach<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;

/** An entry as a caller gives it to the store, which stamps the bookkeeping fields. */
export type NewSeaTimeEntry = OmitEach<SeaTimeEntry, 'updatedAt' | 'deletedAt'>;

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
    id: z.string().regex(/^(deck|engine)\.[a-z0-9-]+$/),
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
