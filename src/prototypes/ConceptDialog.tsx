import {
  ChevronLeft,
  ChevronRight,
  CirclePlus,
  ExternalLink,
  StickyNote,
  ThumbsDown,
  ThumbsUp,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import * as React from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  canSeeOthers,
  DOTS_PER_REVIEWER,
  dotsLeft,
  MAX_NOTE,
  myThumb,
  reviewerKey,
  type ThumbValue,
} from './board';
import { useBoard, type BoardApi } from './BoardContext';
import { kindOf } from './BoardView';
import { DotImage } from './DotImage';
import { isReviewable, type Item } from './inventory';
import { interactiveHref, interactiveLabel, siblingsOf } from './categories';
import { byId, documentUrl, imageUrl, items } from './round';
import { twinOf } from './sections';

// The full-screen viewer. The original image fits the screen at its own
// proportions with the same dots as its tile. Notes and details live in a
// bottom sheet, so they never push the image off screen. Swipe, the arrow keys
// or the buttons step through the board in the order it shows its tiles.
// Escape closes it and focus returns to whatever opened it (Radix Dialog).
// On a phone held sideways the controls move into a rail at the side, so the
// image keeps the full height.

function Caution({ item }: { item: Item }) {
  if (item.kind === 'app-screenshot') {
    return <p className="text-sm text-muted-foreground">A screenshot of the app as built.</p>;
  }
  return (
    <p className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm">
      {item.kind === 'concept' ? 'Visual concept.' : 'Generated design reference.'} Generated lesson
      text and navigation diagrams require verification before instructional use.
    </p>
  );
}

function notesFor(state: BoardApi['state'], reviewer: string, itemId: string) {
  const others = canSeeOthers(state, reviewer);
  const key = reviewerKey(reviewer);
  return state.reviewers.flatMap((r) =>
    r.notes
      .filter((n) => n.itemId === itemId && (others || reviewerKey(r.reviewer) === key))
      .map((n) => ({ ...n, reviewer: r.reviewer })),
  );
}

function Notes({ item }: { item: Item }) {
  const { state, reviewer, addNote } = useBoard();
  const [text, setText] = React.useState('');
  const notes = notesFor(state, reviewer, item.id);
  const open = state.phase !== 'decide';
  return (
    <section className="flex flex-col gap-2" aria-label="Notes">
      <h3 className="text-sm font-semibold">Notes</h3>
      {notes.length === 0 && (
        <p className="text-sm text-muted-foreground">No notes on this one yet.</p>
      )}
      <ul className="flex flex-col gap-2">
        {notes.map((n) => (
          <li key={n.id} className="rounded-md border bg-note p-2.5 text-sm text-note-foreground">
            <b className="block text-xs">{n.reviewer}</b>
            <span className="break-words whitespace-pre-wrap">{n.text}</span>
          </li>
        ))}
      </ul>
      {open && (
        <form
          className="flex flex-col gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (addNote(item.id, text)) setText('');
          }}
        >
          <Label htmlFor="note-text">Add a note</Label>
          <Textarea
            id="note-text"
            value={text}
            maxLength={MAX_NOTE}
            placeholder={
              reviewer.trim() === ''
                ? 'Enter your name on the board first'
                : 'What stands out, good or bad?'
            }
            onChange={(e) => setText(e.target.value)}
          />
          <Button
            type="submit"
            variant="outline"
            disabled={text.trim() === '' || reviewer.trim() === ''}
          >
            Save note
          </Button>
        </form>
      )}
    </section>
  );
}

/**
 * A, B and C of the same category, and the interactive prototype behind the
 * screenshot. Switching keeps the device: a phone capture switches to the
 * other phone captures.
 */
function VariantSwitcher({ item, link = true }: { item: Item; link?: boolean }) {
  const { open } = useBoard();
  const siblings = siblingsOf(item.id).flatMap(({ shot, id }) => {
    const sibling = byId.get(id);
    return sibling ? [{ shot, sibling }] : [];
  });
  const href = link ? interactiveHref(item) : undefined;
  if (siblings.length === 0 && !href) return null;
  return (
    <div className="viewer-variants">
      {siblings.length > 0 && (
        <div role="group" aria-label="Design variants A, B and C">
          {siblings.map(({ shot, sibling }) => (
            <Button
              key={sibling.id}
              variant="outline"
              size="sm"
              className="viewer-variant"
              aria-current={sibling.id === item.id}
              aria-label={`Variant ${shot.letter}: ${shot.name}`}
              data-variant={shot.variant}
              onClick={() => open(sibling)}
            >
              <b>{shot.letter}</b>
              <span className="vname">{shot.name}</span>
            </Button>
          ))}
        </div>
      )}
      {href && (
        <Button asChild size="sm" className="viewer-open">
          <a href={href} id="viewer-interactive">
            <ExternalLink aria-hidden />
            <span className="vtext">{interactiveLabel(href)}</span>
          </a>
        </Button>
      )}
    </div>
  );
}

function Facts({ item }: { item: Item }) {
  const rows: [string, string][] = [
    ['Creator', item.creator],
    ['Type', kindOf(item)],
    ['Style', item.style],
    ['Screen or feature', item.feature],
    ['Device', item.device],
    ['Source', item.source],
    ['Id', item.id],
  ];
  if (item.notes !== '') rows.push(['Notes', item.notes]);
  return (
    <dl className="grid grid-cols-[max-content_1fr] gap-x-3 gap-y-1 text-sm">
      {rows.map(([k, v]) => (
        <React.Fragment key={k}>
          <dt className="font-medium">{k}</dt>
          <dd className="break-words text-muted-foreground">{v}</dd>
        </React.Fragment>
      ))}
    </dl>
  );
}

/** Everything about a concept that is not the image: the bottom sheet. */
function Details({ item, onClose }: { item: Item; onClose: () => void }) {
  const { open } = useBoard();
  const board = item.extractedFrom ? byId.get(item.extractedFrom) : undefined;
  const parts = items.filter((i) => i.extractedFrom === item.id);
  const twin = twinOf(item.id);
  const src = imageUrl(item);
  const href = interactiveHref(item);
  const doc = documentUrl(item);
  const heading = React.useRef<HTMLHeadingElement>(null);
  React.useEffect(() => heading.current?.focus(), []);

  return (
    <section id="viewer-sheet" className="viewer-sheet" aria-labelledby="viewer-sheet-title">
      <div className="viewer-sheet-head">
        <h2 id="viewer-sheet-title" ref={heading} tabIndex={-1} className="font-semibold">
          Notes and details
        </h2>
        <Button variant="ghost" onClick={onClose} aria-label="Hide notes and details">
          <X aria-hidden />
          <span className="max-sm:sr-only">Hide</span>
        </Button>
      </div>
      <div className="flex flex-col gap-4">
        <Caution item={item} />
        <div className="viewer-variants-sheet">
          <VariantSwitcher item={item} link={false} />
        </div>
        {twin && (
          <Button variant="outline" onClick={() => open(twin)}>
            See it on {twin.device.toLowerCase().startsWith('phone') ? 'a phone' : 'desktop'}
          </Button>
        )}
        {board && (
          <div className="flex flex-col gap-2 rounded-md border p-3 text-sm">
            <p>
              <b>Extracted detail.</b> A full-width row cropped from a comparison board, with
              nothing redrawn or added.
            </p>
            <Button variant="outline" onClick={() => open(board)}>
              View the source board
            </Button>
          </div>
        )}
        {parts.length > 0 && (
          <div className="flex flex-col gap-2 text-sm">
            <p>
              Comparison board, kept whole for reference and not on the board. Its concepts are
              voted on one by one:
            </p>
            <div className="flex flex-wrap gap-2">
              {parts.map((p) => (
                <Button key={p.id} variant="outline" onClick={() => open(p)}>
                  {p.style}
                </Button>
              ))}
            </div>
          </div>
        )}
        <div className="flex flex-wrap gap-2">
          {href && (
            <Button asChild>
              <a href={href}>{interactiveLabel(href)}</a>
            </Button>
          )}
          {src && (
            <Button asChild variant="outline">
              <a href={src} target="_blank" rel="noopener">
                <ExternalLink aria-hidden />
                Open the original
              </a>
            </Button>
          )}
          {doc && (
            <Button asChild variant="outline">
              <a href={doc} target="_blank" rel="noopener">
                Open the PDF
              </a>
            </Button>
          )}
        </div>
        {isReviewable(item) ? (
          <Notes item={item} />
        ) : (
          <p className="text-sm text-muted-foreground">Reference material. Not on the board.</p>
        )}
        <Facts item={item} />
      </div>
    </section>
  );
}

const typing = (target: EventTarget | null) =>
  target instanceof HTMLElement &&
  (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName));

export function ConceptDialog() {
  const {
    opened,
    sequence,
    close,
    open,
    returnFocus,
    state,
    reviewer,
    placeDot,
    setThumb,
    message,
  } = useBoard();
  const item = opened;
  const [sheet, setSheet] = React.useState(false);
  // Zoomed, the image shows at two and a half times its fitted size and scrolls,
  // so a wide strip can be read on a phone held upright.
  // Zoom belongs to one image: stepping to the next one fits it to the screen.
  const [zoomedId, setZoomedId] = React.useState<string | null>(null);
  const zoom = item !== null && zoomedId === item.id;
  const notesButton = React.useRef<HTMLButtonElement>(null);
  const swipe = React.useRef<{ x: number; y: number; id: number } | null>(null);
  const swiped = React.useRef(false);

  const at = item ? sequence.findIndex((i) => i.id === item.id) : -1;
  const prev = at > 0 ? sequence[at - 1] : undefined;
  const next = at >= 0 && at < sequence.length - 1 ? sequence[at + 1] : undefined;
  const src = item ? imageUrl(item) : undefined;
  const voting = state.phase === 'vote' && item !== null && isReviewable(item);
  const left = dotsLeft(state, reviewer);
  const thumbsOpen = item !== null && isReviewable(item) && state.phase !== 'decide';
  const mine = item ? myThumb(state, reviewer, item.id) : undefined;
  const thumb = (value: ThumbValue) => {
    if (item) setThumb(item.id, mine === value ? null : value);
  };
  const noteCount = item ? notesFor(state, reviewer, item.id).length : 0;

  // The page's own header and anything floating over it stay hidden while the
  // viewer is open, even where a browser lets them paint above the dialog.
  React.useEffect(() => {
    if (item === null) return;
    document.documentElement.dataset.viewer = 'open';
    return () => {
      delete document.documentElement.dataset.viewer;
    };
  }, [item]);

  const go = (to: Item | undefined) => {
    if (to) open(to);
  };

  function hideSheet() {
    setSheet(false);
    notesButton.current?.focus();
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (typing(e.target) || e.altKey || e.metaKey || e.ctrlKey) return;
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      go(prev);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      go(next);
    }
  }

  // A sideways swipe steps; a tap stays a tap, which drops a dot while voting.
  // Pinch-zoomed in, a swipe pans the page instead.
  function onPointerDown(e: React.PointerEvent) {
    if (e.pointerType === 'mouse' || zoom) return;
    swipe.current = { x: e.clientX, y: e.clientY, id: e.pointerId };
  }
  function onPointerUp(e: React.PointerEvent) {
    const start = swipe.current;
    swipe.current = null;
    if (!start || start.id !== e.pointerId) return;
    if ((window.visualViewport?.scale ?? 1) > 1.01) return;
    const dx = e.clientX - start.x;
    const dy = e.clientY - start.y;
    if (Math.abs(dx) > 48 && Math.abs(dx) > 1.5 * Math.abs(dy)) {
      swiped.current = true;
      go(dx < 0 ? next : prev);
    }
  }
  function onClickCapture(e: React.MouseEvent) {
    if (swiped.current) {
      swiped.current = false;
      e.stopPropagation();
      e.preventDefault();
    }
  }

  return (
    <Dialog
      open={item !== null}
      onOpenChange={(o) => {
        if (!o) {
          setSheet(false);
          close();
        }
      }}
    >
      <DialogContent
        showCloseButton={false}
        className="viewer top-0 left-0 h-dvh w-screen max-w-none translate-x-0 translate-y-0 gap-0 rounded-none border-0 p-0 sm:max-w-none data-[state=closed]:zoom-out-100 data-[state=open]:zoom-in-100"
        id="viewer"
        onKeyDown={onKeyDown}
        onCloseAutoFocus={(e) => {
          e.preventDefault();
          returnFocus();
        }}
      >
        {item && (
          <div className="viewer-frame" data-sheet={sheet ? 'open' : 'closed'}>
            <div className="viewer-top">
              <DialogClose asChild>
                <Button variant="ghost" size="icon" aria-label="Close viewer" id="viewer-close">
                  <X aria-hidden />
                </Button>
              </DialogClose>
              <div className="viewer-title min-w-0 flex-1">
                <DialogTitle className="truncate text-base font-semibold">{item.title}</DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  {at >= 0 ? `${at + 1} of ${sequence.length}` : item.style}
                  <span className="sr-only">
                    . Swipe or use the arrow keys for the next and previous screen.
                  </span>
                </DialogDescription>
              </div>
              <VariantSwitcher item={item} />
            </div>
            <div
              className="viewer-stage"
              data-zoom={zoom}
              onPointerDown={onPointerDown}
              onPointerUp={onPointerUp}
              onPointerCancel={() => (swipe.current = null)}
              onClickCapture={onClickCapture}
            >
              {src &&
                (isReviewable(item) ? (
                  <DotImage
                    key={item.id}
                    item={item}
                    src={src}
                    alt={item.title}
                    label={item.title}
                    mode="fit"
                    droppable
                    id="viewer-image"
                  />
                ) : (
                  <DotImage
                    key={item.id}
                    item={item}
                    src={src}
                    alt={item.title}
                    label={item.title}
                    mode="fit"
                    id="viewer-image"
                  />
                ))}
              {!src && (
                <p className="p-6 text-center text-muted-foreground">
                  No image. Open the details for its document.
                </p>
              )}
              <p
                role="status"
                id="viewer-status"
                className="viewer-status"
                data-tone={message?.tone}
              >
                {message?.text}
              </p>
            </div>
            <div className="viewer-bar" role="group" aria-label="Viewer controls">
              <Button
                variant="ghost"
                onClick={() => go(prev)}
                disabled={!prev}
                aria-label="Previous screen"
              >
                <ChevronLeft aria-hidden />
                <span className="bar-text">Previous</span>
              </Button>
              {thumbsOpen && (
                <>
                  <Button
                    variant={mine === 'up' ? 'secondary' : 'ghost'}
                    onClick={() => thumb('up')}
                    aria-pressed={mine === 'up'}
                    aria-label="Thumbs up"
                    className="thumb"
                    data-on={mine === 'up'}
                  >
                    <ThumbsUp aria-hidden />
                  </Button>
                  <Button
                    variant={mine === 'down' ? 'secondary' : 'ghost'}
                    onClick={() => thumb('down')}
                    aria-pressed={mine === 'down'}
                    aria-label="Thumbs down"
                    className="thumb"
                    data-on={mine === 'down'}
                  >
                    <ThumbsDown aria-hidden />
                  </Button>
                </>
              )}
              <Button
                ref={notesButton}
                variant={sheet ? 'secondary' : 'ghost'}
                onClick={() => (sheet ? hideSheet() : setSheet(true))}
                aria-expanded={sheet}
                aria-controls="viewer-sheet"
                aria-label={`Notes and details${noteCount > 0 ? `, ${noteCount}` : ''}`}
              >
                <StickyNote aria-hidden />
                <span className="bar-text bar-keep">Notes</span>
                {noteCount > 0 && <span className="bar-count">{noteCount}</span>}
              </Button>
              {src && (
                <Button
                  className="zoom-button"
                  variant={zoom ? 'secondary' : 'ghost'}
                  onClick={() => setZoomedId(zoom ? null : (item?.id ?? null))}
                  aria-pressed={zoom}
                  aria-label="Zoom in"
                >
                  {zoom ? <ZoomOut aria-hidden /> : <ZoomIn aria-hidden />}
                  <span className="bar-text">{zoom ? 'Fit' : 'Zoom'}</span>
                </Button>
              )}
              {voting && (
                <Button
                  variant="ghost"
                  onClick={() => placeDot(item.id, 0.5, 0.5)}
                  aria-label={`Add a dot, ${left} of ${DOTS_PER_REVIEWER} left`}
                >
                  <CirclePlus aria-hidden />
                  <span className="bar-text">Add a dot</span>
                  <span className="bar-count">{left}</span>
                </Button>
              )}
              <Button
                variant="ghost"
                onClick={() => go(next)}
                disabled={!next}
                aria-label="Next screen"
              >
                <span className="bar-text">Next</span>
                <ChevronRight aria-hidden />
              </Button>
            </div>
            {sheet && <Details item={item} onClose={hideSheet} />}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
