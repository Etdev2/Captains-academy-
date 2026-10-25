import * as React from 'react';
import { cn } from '@/lib/utils';
import { visibleDots } from './board';
import { useBoard } from './BoardContext';
import type { Item } from './inventory';

// An image with the review dots on it.
//
// The box takes the image's own proportions from the inventory and is painted
// in the image's dominant color, so nothing shifts and nothing flashes blank
// while the file loads. A dot's position is a fraction of the image itself, so
// it lands in the same place on a tile and in the full-screen viewer.
//
// "tile" fills its column at the image's ratio, "row" fills the height of an
// as-built row, and "fit" fits the image inside the
// nearest container with `container-type: size`, the viewer's stage.
//
// While voting, a tap on the viewer's image drops the reviewer's dot there. The
// viewer's "Add a dot" button does the same for keyboards and screen readers, so
// the tap area is hidden from them.

export function DotImage({
  item,
  src,
  alt,
  label,
  mode,
  droppable = false,
  loading,
  priority = false,
  id,
}: {
  item: Item;
  src: string | undefined;
  /** The image's text alternative; empty when a surrounding button names it. */
  alt: string;
  /** The concept's name, for the dot buttons. */
  label: string;
  mode: 'tile' | 'row' | 'fit';
  droppable?: boolean;
  loading?: 'lazy' | 'eager';
  priority?: boolean;
  id?: string;
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
    <div
      className="dot-image relative"
      data-mode={mode}
      style={
        {
          aspectRatio: `${item.width ?? 4} / ${item.height ?? 3}`,
          '--ratio': ratio,
          backgroundColor: item.color ?? 'var(--muted)',
        } as React.CSSProperties
      }
    >
      <img
        src={src}
        alt={alt}
        width={item.width}
        height={item.height}
        className="block size-full select-none"
        draggable={false}
        decoding="async"
        loading={loading}
        fetchPriority={priority ? 'high' : undefined}
        id={id}
      />
      {droppable && voting && (
        <div
          onClick={drop}
          className="absolute inset-0 cursor-crosshair"
          aria-hidden
          data-drop={item.id}
          title="Tap to drop a dot here"
        />
      )}
      {dots.map((d) =>
        d.mine && voting && droppable ? (
          <button
            key={d.id}
            type="button"
            onClick={() => removeDot(d.id)}
            className="dot-hit absolute flex size-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full"
            style={{ left: `${d.x * 100}%`, top: `${d.y * 100}%` }}
            aria-label={`Take back your dot on ${label}`}
            data-dot="mine"
          >
            <span className="dot size-6" aria-hidden />
          </button>
        ) : (
          <span
            key={d.id}
            className={cn(
              'dot pointer-events-none absolute -translate-x-1/2 -translate-y-1/2',
              mode === 'tile' ? 'size-4' : 'size-5',
              !d.mine && 'opacity-75',
            )}
            style={{ left: `${d.x * 100}%`, top: `${d.y * 100}%` }}
            title={d.mine ? 'Your dot' : `${d.reviewer}'s dot`}
            data-dot={d.mine ? 'mine' : 'other'}
          />
        ),
      )}
    </div>
  );
}
