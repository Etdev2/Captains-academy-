import type { Item } from './inventory';
import { categories, conceptId, liveHref, variants, type CategoryMeta } from './live/shared/routes';
import type { CategoryId, VariantId } from './live/shared/types';

// The five product categories the Decision Desk filters by, and the A/B/C
// variant sets of the interactive prototypes (src/prototypes/live).
//
// Every board section belongs to one category. The older concepts keep their
// sections and ids: Definitions and Lights teach, so they sit under Study;
// Night Harbor and Docking are played, so they sit under Arcade.

export type { CategoryId, VariantId };
export { categories };

/** A variant's screenshots: the desktop capture has the tile, the iPhone capture is its twin. */
export interface VariantShot {
  readonly category: CategoryId;
  readonly variant: VariantId;
  readonly letter: string;
  readonly name: string;
  readonly desktop: string;
  readonly iphone: string;
  readonly href: string;
}

export const variantShots: readonly VariantShot[] = categories.flatMap((c) =>
  variants.map((v) => ({
    category: c.id,
    variant: v.id,
    letter: v.letter,
    name: v.name,
    desktop: conceptId(c.id, v.id, 'desktop'),
    iphone: conceptId(c.id, v.id, 'iphone'),
    href: liveHref(c.id, v.id),
  })),
);

/** The variant a concept id captures, desktop or iPhone, if it is one. */
export const shotOf = (id: string): VariantShot | undefined =>
  variantShots.find((s) => s.desktop === id || s.iphone === id);

/** The A, B and C captures of the same category, on the same device as `id`. */
export function siblingsOf(id: string): { shot: VariantShot; id: string }[] {
  const shot = shotOf(id);
  if (!shot) return [];
  const device = shot.iphone === id ? 'iphone' : 'desktop';
  return variantShots
    .filter((s) => s.category === shot.category)
    .map((s) => ({ shot: s, id: s[device] }));
}

/** The interactive prototype behind a concept, if it has one. */
export const interactiveHref = (item: Item): string | undefined =>
  item.interactive ?? shotOf(item.id)?.href;

/** The label of the link to a concept's interactive prototype. Games are played. */
export const interactiveLabel = (href: string): string =>
  href.startsWith('/play/')
    ? 'Play this level'
    : href.startsWith('/prototypes/play/')
      ? 'Play the prototype'
      : 'Open interactive prototype';

export const categoryTitle = (id: CategoryId): string =>
  (categories.find((c) => c.id === id) as CategoryMeta).title;
