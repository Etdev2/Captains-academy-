import type { CategoryVariants, VariantProps } from '../shared/types';
import { VariantA } from './VariantA';
import { VariantB } from './VariantB';
import { VariantC } from './VariantC';

function C({ variant }: VariantProps) {
  return <VariantC variant={variant} />;
}

const variants: CategoryVariants = { a: VariantA, b: VariantB, c: C };
export default variants;
