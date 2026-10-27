import * as React from 'react';
import type { Item } from './inventory';
import type { Shape } from './sections';

// A masonry grid for one shape of concept. It measures its own width, picks how
// many columns fit, and adds each tile to the shortest column, so tiles of
// different heights pack with no holes and no column is left empty. It lays out
// before the first paint (useLayoutEffect), so nothing moves once shown.
//
// CSS columns were tried first: they balance heights by leaving trailing
// columns empty, which put a hole beside the Chapter 1 levels on desktop.

const sizes: Record<Shape, { phone: number; desk: number; max: number }> = {
  // Narrowest a column may get on a phone and on a wider screen, and the widest.
  wide: { phone: 280, desk: 544, max: Infinity },
  landscape: { phone: 280, desk: 320, max: 480 },
  portrait: { phone: 150, desk: 200, max: 240 },
};

/** The caption under each image, in px, for balancing the columns. */
const CAPTION = 52;

export function columnsFor(
  shape: Shape,
  width: number,
  count: number,
  /** The widest a column may be so its tallest image still fits the screen. */
  fitWidth = Infinity,
): { columns: number; columnWidth: number; gap: number } {
  const gap = width >= 700 ? 16 : 12;
  const { phone, desk, max: widest } = sizes[shape];
  const max = Math.min(widest, fitWidth);
  const min = Math.min(width >= 600 ? desk : phone, max);
  const columns = Math.max(1, Math.min(count, Math.floor((width + gap) / (min + gap))));
  const columnWidth = Math.min(max, (width - (columns - 1) * gap) / columns);
  return { columns, columnWidth, gap };
}

export function distribute(items: readonly Item[], columns: number, columnWidth: number): Item[][] {
  const cols = Array.from({ length: columns }, () => ({ items: [] as Item[], height: 0 }));
  for (const item of items) {
    const ratio = (item.width ?? 4) / (item.height ?? 3);
    // The first column within a pixel of the shortest, so near-ties fill left to right.
    const least = Math.min(...cols.map((c) => c.height));
    const target = cols.find((c) => c.height <= least + 1) ?? cols[0];
    if (!target) break;
    target.items.push(item);
    target.height += columnWidth / ratio + CAPTION;
  }
  return cols.map((c) => c.items);
}

export function Masonry({
  shape,
  items,
  children,
}: {
  shape: Shape;
  items: readonly Item[];
  children: (item: Item) => React.ReactNode;
}) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [width, setWidth] = React.useState(0);
  const [screen, setScreen] = React.useState(() => window.innerHeight);

  React.useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    setWidth(el.getBoundingClientRect().width);
    const observer = new ResizeObserver(([entry]) => {
      if (entry) setWidth(entry.contentRect.width);
    });
    observer.observe(el);
    const onResize = () => setScreen(window.innerHeight);
    window.addEventListener('resize', onResize);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', onResize);
    };
  }, []);

  // On a phone held sideways, a tall tile is kept short enough to see whole.
  const tallest = Math.min(...items.map((i) => (i.width ?? 4) / (i.height ?? 3)));
  const fitWidth = (screen * 0.9 - CAPTION) * tallest;
  const { columns, columnWidth, gap } = columnsFor(shape, width, items.length, fitWidth);
  const cols = width === 0 ? [items.slice()] : distribute(items, columns, columnWidth);

  return (
    <div ref={ref} className="masonry" data-shape={shape} style={{ gap }}>
      {cols.map((col, c) => (
        <ul
          key={c}
          className="masonry-col"
          style={{ width: width === 0 ? '100%' : columnWidth, gap }}
        >
          {col.map((item) => children(item))}
        </ul>
      ))}
    </div>
  );
}
