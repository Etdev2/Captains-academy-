import { categoryOf } from './sections';
import { categoryTitle } from './categories';
import type { Item } from './inventory';

// The integration point for the 1 to 10 rating backend in draft PR #75
// (supabase/migrations/20261025174104_guest_progress_and_prototype_feedback.sql).
// That migration keys each rating on public.prototype_assets.id. This module
// turns the board's inventory into those rows with the same ids, so ratings,
// dots and notes all point at one id per screen. Nothing here talks to a
// database: whoever wires PR #75 seeds prototype_assets from these rows,
// then reads public.prototype_feedback by the same ids.

/** One row of public.prototype_assets, as PR #75 defines it. */
export interface PrototypeAssetRow {
  readonly id: string;
  readonly title: string;
  readonly style: string;
  readonly category: string;
  readonly source: 'claude' | 'chatgpt' | 'other';
  /** Site-relative, as the migration's check allows; the built app serves the file. */
  readonly image_url: string;
  readonly description: string;
  readonly published: boolean;
}

/** The checks PR #75's table puts on each column. */
export const ASSET_ID = /^[a-z0-9][a-z0-9-]{0,119}$/;

const sourceOf = (creator: string): PrototypeAssetRow['source'] =>
  /claude/i.test(creator) ? 'claude' : /chatgpt|openai/i.test(creator) ? 'chatgpt' : 'other';

export function assetRow(item: Item): PrototypeAssetRow | null {
  if (item.image === null) return null;
  const category = categoryOf(item.id);
  return {
    id: item.id,
    title: item.title.slice(0, 160),
    style: item.style.slice(0, 80),
    category: (category ? categoryTitle(category) : item.feature).slice(0, 80),
    source: sourceOf(item.creator),
    image_url: `/${item.image}`,
    description: item.notes.slice(0, 2000),
    published: false,
  };
}
