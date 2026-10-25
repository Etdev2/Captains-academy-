// The one review round the board runs today, its concepts and their image
// URLs. A database (DECISIONS.md A1) will later hold many rounds across
// projects; until then the round is defined here.

import data from '../../docs/prototypes/inventory.json';
import { isReviewable, parseInventory, thumbnailPath, type Item } from './inventory';

export const ROUND = {
  id: 'frontend-direction-1',
  project: "Captain's Academy",
  title: 'Frontend direction, round 1',
  decider: 'Elliott',
} as const;

/** The playable arcade prototype. It lives on a private Claude page, not in this build. */
export const NIGHT_HARBOR_RUN = 'https://claude.ai/artifact/QNbtXuSXRQzjc64s4LWbVU';

export const inventory = parseInventory(data);
export const items: readonly Item[] = inventory.items;
export const byId: ReadonlyMap<string, Item> = new Map(items.map((i) => [i.id, i]));
/** The concepts on the board: available concepts and current-app screenshots. */
export const concepts: readonly Item[] = items.filter(isReviewable);
export const conceptIds: readonly string[] = concepts.map((i) => i.id);
export const reference: readonly Item[] = items.filter(
  (i) => i.kind === 'reference' && i.availability === 'available',
);
export const unavailable: readonly Item[] = items.filter((i) => i.availability === 'unavailable');

// The images stay where they are in docs/; the build gives each one a URL.
// tests/prototype-inventory.test.ts checks every image sits under one of these folders.
const files = import.meta.glob<string>(
  ['/docs/prototypes/**/*.{png,jpg,pdf}', '/docs/design/screenshots/**/*.png'],
  { eager: true, query: '?url', import: 'default' },
);
const fileUrl = (repoPath: string | null | undefined) =>
  repoPath ? files[`/${repoPath}`] : undefined;

export const imageUrl = (item: Item) => fileUrl(item.image);
export const thumbUrl = (item: Item) => fileUrl(thumbnailPath(item));
export const documentUrl = (item: Item) => fileUrl(item.document);

declare global {
  interface Window {
    /**
     * Each item's built image and preview URL, for the browser tests in
     * e2e/prototypes.spec.ts, as the sea-time log exposes window.__seaTimeLog.
     */
    __prototypeGallery?: {
      readonly images: Readonly<Record<string, string>>;
      readonly thumbnails: Readonly<Record<string, string>>;
    };
  }
}

const urls = (path: (item: Item) => string | undefined) =>
  Object.fromEntries(
    items.flatMap((i) => {
      const url = path(i);
      return url === undefined ? [] : [[i.id, url]];
    }),
  );

export function exposeUrlsForTests(): void {
  window.__prototypeGallery = { images: urls(imageUrl), thumbnails: urls(thumbUrl) };
}
