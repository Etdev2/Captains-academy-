// The shape of one sea-time entry as it is saved on the device (DECISIONS.md A3).
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
// on save and reported on read. Vessels, roles and waters arrive in later
// changes with their own fields.

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
