import type * as React from 'react';

// The contract between the prototype shell (src/prototypes/live/*.tsx, owned by
// the lead) and the five category folders, each owned by one builder. A
// category's index.tsx default-exports its three variants; the shell renders
// the one the URL names and owns everything around it.

export const categoryIds = ['console', 'license', 'sea-time', 'study', 'arcade'] as const;
export type CategoryId = (typeof categoryIds)[number];

export const variantIds = ['a', 'b', 'c'] as const;
export type VariantId = (typeof variantIds)[number];

/** Props the shell passes to every variant. */
export interface VariantProps {
  /** The variant being shown, for links that keep the reviewer in the same direction. */
  readonly variant: VariantId;
}

export type CategoryVariants = Readonly<Record<VariantId, React.ComponentType<VariantProps>>>;
