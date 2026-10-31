import * as React from 'react';
import { categoryIds, variantIds, type CategoryId, type VariantId } from './types';

// Stable, shareable URLs for the interactive prototypes:
//
//   /prototypes/live/?category=<category>&variant=<a|b|c>[&climb=<n>][&screen=<step>]
//
// `screen` is optional and belongs to the variant: it names a step of the
// category's journey, so a link can open a review screen or a result screen
// directly. Never rename a category or variant id: the Decision Desk's concept
// ids and saved feedback point at them.
//
// `climb` is optional too. It opens climbed variant <n> of variant A, B or C,
// the result of a Hill climb (docs/prototypes/hill-climb.md). Its code lives in
// <category>/climbs/<variant>-<n>/. Without `climb`, every URL and concept id
// is exactly what it was before climbed variants existed.

export interface CategoryMeta {
  readonly id: CategoryId;
  readonly title: string;
  readonly short: string;
  readonly summary: string;
}

export const categories: readonly CategoryMeta[] = [
  {
    id: 'console',
    title: "Captain's Console",
    short: 'Console',
    summary: 'Home dashboard: credentials, target license, progress, next action and deadlines.',
  },
  {
    id: 'license',
    title: 'License Navigator & Forms',
    short: 'License & Forms',
    summary: 'Pick a license, see what is missing, and review an application form before sending.',
  },
  {
    id: 'sea-time',
    title: 'Sea-Time Logbook',
    short: 'Sea Time',
    summary: 'Log trips and vessels, see recorded against signed time, and preview the export.',
  },
  {
    id: 'study',
    title: 'Study & Exam Prep',
    short: 'Study',
    summary: 'Learning path, practice questions with explanations, mock exam and weak topics.',
  },
  {
    id: 'arcade',
    title: 'Arcade & Simulations',
    short: 'Arcade',
    summary: 'Pick a challenge, dock a boat, call a rules scenario, and see the debrief.',
  },
];

export interface VariantMeta {
  readonly id: VariantId;
  readonly letter: 'A' | 'B' | 'C';
  readonly name: string;
  readonly summary: string;
}

export const variants: readonly VariantMeta[] = [
  {
    id: 'a',
    letter: 'A',
    name: 'Night Bridge',
    summary: "Dark instrument-panel console that develops the Captain's Console mockups.",
  },
  {
    id: 'b',
    letter: 'B',
    name: 'Clean & Light',
    summary: 'A bright, highly readable nautical workspace.',
  },
  {
    id: 'c',
    letter: 'C',
    name: 'Guided Mentor',
    summary: 'Task first: walks the sailor through their next action, one step at a time.',
  },
];

export const categoryMeta = (id: CategoryId): CategoryMeta =>
  categories.find((c) => c.id === id) ?? (categories[0] as CategoryMeta);
export const variantMeta = (id: VariantId): VariantMeta =>
  variants.find((v) => v.id === id) ?? (variants[0] as VariantMeta);

export const isCategory = (v: string | null): v is CategoryId =>
  v !== null && (categoryIds as readonly string[]).includes(v);
export const isVariant = (v: string | null): v is VariantId =>
  v !== null && (variantIds as readonly string[]).includes(v);

/** The highest climb number a URL may name. */
export const MAX_CLIMB = 99;

/** A climb number from a URL, or undefined when it is absent or not 1 to 99. */
export function parseClimb(v: string | null): number | undefined {
  if (v === null || !/^[1-9][0-9]?$/.test(v)) return undefined;
  return Number(v);
}

/** How the Decision Desk labels a climbed variant: "climbed from B". */
export const climbedFromLabel = (variant: VariantId): string =>
  `climbed from ${variantMeta(variant).letter}`;

export const LIVE_PATH = '/prototypes/live/';
export const DESK_PATH = '/prototypes/';

/** The URL of one variant or climbed variant, optionally at a named step of its journey. */
export function liveHref(
  category: CategoryId,
  variant: VariantId,
  screen?: string,
  climb?: number,
): string {
  const q = new URLSearchParams({ category, variant });
  if (climb !== undefined) q.set('climb', String(climb));
  if (screen) q.set('screen', screen);
  return `${LIVE_PATH}?${q.toString()}`;
}

export type Device = 'desktop' | 'iphone';

/**
 * The Decision Desk concept id of a variant's screenshot. Never change this
 * format. A climbed variant has its own id, `cl-climb-<c>-<v>-<n>-<device>`,
 * so it never takes over the A/B/C id it was climbed from.
 */
export const conceptId = (
  category: CategoryId,
  variant: VariantId,
  device: Device = 'desktop',
  climb?: number,
): string =>
  climb === undefined
    ? `cl-live-${category}-${variant}-${device}`
    : `cl-climb-${category}-${variant}-${climb}-${device}`;

/** What a live-variant or climbed-variant concept id points at. */
export interface ConceptRef {
  readonly category: CategoryId;
  readonly variant: VariantId;
  readonly device: Device;
  /** Set only on a climbed variant. */
  readonly climb?: number;
}

const conceptPattern = new RegExp(
  `^cl-(live|climb)-(${categoryIds.join('|')})-(${variantIds.join('|')})(?:-([1-9][0-9]?))?-(desktop|iphone)$`,
);

/** Reads a concept id written by `conceptId`, or undefined for any other id. */
export function parseConceptId(id: string): ConceptRef | undefined {
  const m = conceptPattern.exec(id);
  if (!m) return undefined;
  const [, kind, category, variant, climb, device] = m;
  if ((kind === 'climb') !== (climb !== undefined)) return undefined;
  const ref = { category, variant, device } as {
    category: CategoryId;
    variant: VariantId;
    device: Device;
  };
  return climb === undefined ? ref : { ...ref, climb: Number(climb) };
}

/** Opens the variant's screenshot on the Decision Desk, where it is rated and discussed. */
export const deskHref = (category: CategoryId, variant: VariantId, climb?: number): string =>
  `${DESK_PATH}?concept=${conceptId(category, variant, 'desktop', climb)}`;

/**
 * A variant's current journey step, kept in the `screen` query parameter so a
 * reviewer can share the exact step. Steps not in `allowed` fall back to the
 * first one. History entries are pushed, so the browser's Back button walks
 * back through the journey.
 */
export function useScreen<S extends string>(allowed: readonly [S, ...S[]]): [S, (next: S) => void] {
  const read = React.useCallback((): S => {
    const v = new URLSearchParams(window.location.search).get('screen');
    return (allowed as readonly string[]).includes(v ?? '') ? (v as S) : allowed[0];
  }, [allowed]);
  const [screen, setScreen] = React.useState<S>(read);
  React.useEffect(() => {
    const onPop = () => setScreen(read());
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [read]);
  const go = React.useCallback((next: S) => {
    const url = new URL(window.location.href);
    url.searchParams.set('screen', next);
    window.history.pushState(null, '', url);
    setScreen(next);
    window.scrollTo({ top: 0 });
  }, []);
  return [screen, go];
}
