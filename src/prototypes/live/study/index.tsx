import type { CategoryVariants, VariantProps } from '../shared/types';

// Placeholder until this category's builder replaces it.
function Placeholder({ variant }: VariantProps) {
  return <p style={{ padding: 24 }}>Variant {variant.toUpperCase()} is being built.</p>;
}

const variants: CategoryVariants = { a: Placeholder, b: Placeholder, c: Placeholder };
export default variants;
