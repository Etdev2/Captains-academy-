import { ExternalLink } from 'lucide-react';
import * as React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { canSeeOthers, MAX_NOTE, reviewerKey } from './board';
import { useBoard } from './BoardContext';
import { kindOf } from './BoardView';
import { DotImage } from './DotImage';
import { isReviewable, type Item } from './inventory';
import { byId, documentUrl, imageUrl, items } from './round';

// The full-size viewer: the original image at its own proportions, the same
// dots as on the card, the item's details and its notes. Escape closes it and
// focus returns to whatever opened it (Radix Dialog).

function Caution({ item }: { item: Item }) {
  if (item.kind === 'app-screenshot') {
    return <p className="text-sm text-muted-foreground">A screenshot of the app as built.</p>;
  }
  return (
    <p className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm">
      {item.kind === 'concept' ? 'Visual concept.' : 'Generated design reference.'} Generated lesson
      text and navigation diagrams require verification before instructional use.
    </p>
  );
}

function Notes({ item }: { item: Item }) {
  const { state, reviewer, addNote } = useBoard();
  const [text, setText] = React.useState('');
  const others = canSeeOthers(state, reviewer);
  const key = reviewerKey(reviewer);
  const notes = state.reviewers.flatMap((r) =>
    r.notes
      .filter((n) => n.itemId === item.id && (others || reviewerKey(r.reviewer) === key))
      .map((n) => ({ ...n, reviewer: r.reviewer })),
  );
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
            placeholder="What stands out, good or bad?"
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

export function ConceptDialog() {
  const { opened, close, open, returnFocus } = useBoard();
  const item = opened;
  const board = item?.extractedFrom ? byId.get(item.extractedFrom) : undefined;
  const parts = item ? items.filter((i) => i.extractedFrom === item.id) : [];
  const src = item ? imageUrl(item) : undefined;
  const doc = item ? documentUrl(item) : undefined;

  return (
    <Dialog open={item !== null} onOpenChange={(o) => !o && close()}>
      <DialogContent
        className="flex max-h-[95dvh] w-[calc(100%-1rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-6xl"
        id="viewer"
        onCloseAutoFocus={(e) => {
          e.preventDefault();
          returnFocus();
        }}
      >
        {item && (
          <>
            <DialogHeader className="border-b px-5 py-4 pr-12">
              <DialogTitle>{item.title}</DialogTitle>
              <DialogDescription className="flex flex-wrap gap-1.5">
                <Badge variant="outline">{item.style}</Badge>
                <Badge variant="outline">{item.feature}</Badge>
              </DialogDescription>
            </DialogHeader>
            <div className="flex min-h-0 flex-1 flex-col overflow-y-auto lg:flex-row lg:overflow-hidden">
              {src && (
                <div className="flex shrink-0 flex-col bg-muted lg:min-h-0 lg:flex-1 lg:shrink">
                  {isReviewable(item) ? (
                    <DotImage
                      item={item}
                      src={src}
                      label={item.title}
                      className="flex-1 p-2"
                      maxHeight="70dvh"
                    />
                  ) : (
                    <div className="flex flex-1 items-center justify-center p-2">
                      <img
                        src={src}
                        alt={item.title}
                        className="block h-auto max-h-[70dvh] max-w-full lg:max-h-[78dvh]"
                        id="viewer-image"
                      />
                    </div>
                  )}
                  <div className="flex justify-end border-t bg-background p-2">
                    <Button asChild variant="ghost" size="sm">
                      <a href={src} target="_blank" rel="noopener">
                        <ExternalLink aria-hidden />
                        Open the original
                      </a>
                    </Button>
                  </div>
                </div>
              )}
              <div className="flex flex-col gap-4 p-5 lg:w-96 lg:overflow-y-auto lg:border-l">
                <Caution item={item} />
                {board && (
                  <div className="flex flex-col gap-2 rounded-md border p-3 text-sm">
                    <p>
                      <b>Extracted detail.</b> A full-width row cropped from a comparison board,
                      with nothing redrawn or added.
                    </p>
                    <Button variant="outline" size="sm" onClick={() => open(board)}>
                      View the source board
                    </Button>
                  </div>
                )}
                {parts.length > 0 && (
                  <div className="flex flex-col gap-2 text-sm">
                    <p>
                      Comparison board, kept whole for reference and not on the board. Its concepts
                      are voted on one by one:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {parts.map((p) => (
                        <Button key={p.id} variant="outline" size="sm" onClick={() => open(p)}>
                          {p.style}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
                {doc && (
                  <Button asChild variant="outline">
                    <a href={doc} target="_blank" rel="noopener">
                      Open the PDF
                    </a>
                  </Button>
                )}
                {isReviewable(item) ? (
                  <Notes item={item} />
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Reference material. Not on the board.
                  </p>
                )}
                <Facts item={item} />
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
