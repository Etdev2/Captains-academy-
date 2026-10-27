import * as React from 'react';
import { categoryIds, variantIds, type CategoryId, type VariantId } from './types';

// Stable, shareable URLs for the interactive prototypes:
//
//   /prototypes/live/?category=<category>&variant=<a|b|c>[&screen=<step>]
//
// `screen` is optional and belongs to the variant: it names a step of the
// category's journey, so a link can open a review screen or a result screen
// directly. Never rename a category or variant id: the Decision Desk's concept
// ids and saved feedback point at them.

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

export const LIVE_PATH = '/prototypes/live/';
export const DESK_PATH = '/prototypes/';

/** The URL of one variant, optionally at a named step of its journey. */
export function liveHref(category: CategoryId, variant: VariantId, screen?: string): string {
  const q = new URLSearchParams({ category, variant });
  if (screen) q.set('screen', screen);
  return `${LIVE_PATH}?${q.toString()}`;
}

/** The Decision Desk concept id of a variant's screenshot. Never change this format. */
export const conceptId = (
  category: CategoryId,
  variant: VariantId,
  device: 'desktop' | 'iphone' = 'desktop',
): string => `cl-live-${category}-${variant}-${device}`;

/** Opens the variant's screenshot on the Decision Desk, where it is rated and discussed. */
export const deskHref = (category: CategoryId, variant: VariantId): string =>
  `${DESK_PATH}?concept=${conceptId(category, variant)}`;

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
