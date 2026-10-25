import * as React from 'react';
import { cn } from '@/lib/utils';
import { visibleDots } from './board';
import { useBoard } from './BoardContext';
import type { Item } from './inventory';

// An image with the review dots on it. While voting, a click drops the
// reviewer's dot on that spot, which builds a heat map of what people like.
//
// The box takes the image's own proportions from the inventory, so the page
// does not shift as images load, and a dot's position is a fraction of the image
// itself: it lands in the same place on a preview and on the full-size view.
// Clicking the image is a mouse shortcut. The card's "Add a dot" button does the
// same for keyboards and screen readers, so the click area is hidden from them.

export function DotImage({
  item,
  src,
  maxHeight,
  className,
  label,
  loading,
}: {
  item: Item;
  src: string | undefined;
  /** The tallest the image may be, as a CSS length. */
  maxHeight: string;
  className?: string;
  label: string;
  loading?: 'lazy' | 'eager';
}) {
  const { state, reviewer, placeDot, removeDot } = useBoard();
  const dots = visibleDots(state, reviewer).filter((d) => d.itemId === item.id);
  const voting = state.phase === 'vote';
  const ratio =
    item.width !== undefined && item.height !== undefined ? item.width / item.height : 4 / 3;

  function drop(event: React.MouseEvent<HTMLDivElement>) {
    const box = event.currentTarget.getBoundingClientRect();
    placeDot(
      item.id,
      (event.clientX - box.left) / box.width,
      (event.clientY - box.top) / box.height,
    );
  }

  return (
    <div className={cn('flex items-center justify-center bg-muted', className)}>
      <div
        className="relative"
        style={{ aspectRatio: String(ratio), width: `min(100%, calc(${maxHeight} * ${ratio}))` }}
      >
        <img
          src={src}
          alt={label}
          width={item.width}
          height={item.height}
          className="block size-full select-none"
          draggable={false}
          decoding="async"
          loading={loading}
        />
        {voting && (
          <div
            onClick={drop}
            className="absolute inset-0 cursor-crosshair"
            aria-hidden
            data-drop={item.id}
            title="Click to drop a dot here"
          />
        )}
        {dots.map((d) =>
          d.mine && voting ? (
            <button
              key={d.id}
              type="button"
              onClick={() => removeDot(d.id)}
              className="absolute size-6 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-dot shadow-md ring-2 ring-dot/40 hover:scale-110 focus-visible:outline-2 focus-visible:outline-ring"
              style={{ left: `${d.x * 100}%`, top: `${d.y * 100}%` }}
              aria-label={`Take back your dot on ${label}`}
              data-dot="mine"
            />
          ) : (
            <span
              key={d.id}
              className={cn(
                'pointer-events-none absolute size-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow',
                d.mine ? 'bg-dot' : 'bg-dot/70',
              )}
              style={{ left: `${d.x * 100}%`, top: `${d.y * 100}%` }}
              title={d.mine ? 'Your dot' : `${d.reviewer}'s dot`}
              data-dot={d.mine ? 'mine' : 'other'}
            />
          ),
        )}
      </div>
    </div>
  );
}
