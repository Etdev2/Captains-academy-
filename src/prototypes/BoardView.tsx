import { StickyNote, ThumbsDown, ThumbsUp, Trash2 } from 'lucide-react';
import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  canSeeOthers,
  DOTS_PER_REVIEWER,
  dotsLeft,
  heat,
  isDecider,
  myThumb,
  reviewerKey,
  visibleDots,
  visibleThumbs,
} from './board';
import { useBoard } from './BoardContext';
import { DotImage } from './DotImage';
import { Masonry } from './Masonry';
import { categories, kindLabel, type Item } from './inventory';
import { byId, conceptIds, ROUND, thumbUrl } from './round';
import { layout, order, shapeOf, tileIds, tileLabel, twinOf } from './sections';

/** The concepts with a tile of their own; desktop twins open from the viewer. */
const tiles: readonly Item[] = tileIds().flatMap((id) => {
  const item = byId.get(id);
  return item ? [item] : [];
});

const ALL = 'all';

function plural(n: number, one: string, many = `${one}s`) {
  return `${n} ${n === 1 ? one : many}`;
}

export function kindOf(item: Item) {
  return item.extractedFrom ? 'Extracted detail' : kindLabel[item.kind];
}

// The image is the card: it spans the tile at its own proportions, and a tap
// anywhere on the tile opens the full-screen viewer, where dots are placed.
function Tile({
  item,
  sequence,
  eager,
  as,
}: {
  item: Item;
  sequence: readonly Item[];
  /** On the first screen: load at once, not when scrolled to. */
  eager: boolean;
  as: 'grid' | 'row';
}) {
  const { state, reviewer, open } = useBoard();
  const shown = visibleDots(state, reviewer).filter((d) => d.itemId === item.id);
  const others = canSeeOthers(state, reviewer);
  const mine = shown.filter((d) => d.mine).length;
  const count = others ? shown.length : mine;
  const thumbs = visibleThumbs(state, reviewer, item.id);
  const myThumbValue = myThumb(state, reviewer, item.id);
  const label = tileLabel(item);
  const twin = twinOf(item.id);
  const tags = [
    item.style !== label && item.kind === 'concept' ? item.style : null,
    item.device,
    item.extractedFrom ? 'Extracted' : null,
    twin ? `${twin.device} twin` : null,
  ].filter((t): t is string => t !== null);
  const dotText =
    count === 0 ? '' : others ? `, ${plural(count, 'dot')}` : `, your ${plural(count, 'dot')}`;
  const thumbText = [
    thumbs.up > 0 ? `, ${thumbs.up} thumbs up` : '',
    thumbs.down > 0 ? `, ${thumbs.down} thumbs down` : '',
  ].join('');

  return (
    <li
      className="tile-item"
      data-id={item.id}
      data-shape={shapeOf(item)}
      style={{ '--ratio': (item.width ?? 4) / (item.height ?? 3) } as React.CSSProperties}
    >
      <button
        type="button"
        className="tile"
        onClick={() => open(item, sequence)}
        aria-label={`Open ${item.title}${thumbText}${dotText}`}
      >
        <span className="tile-media">
          <DotImage
            item={item}
            src={thumbUrl(item)}
            alt=""
            label={item.title}
            mode={as === 'row' ? 'row' : 'tile'}
            loading={eager ? 'eager' : 'lazy'}
            priority={eager}
          />
        </span>
        <span className="tile-caption">
          <span className="tile-label">{label}</span>
          <span className="tile-tags">{tags.join(' · ')}</span>
          {(count > 0 || thumbs.up > 0 || thumbs.down > 0) && (
            <span className="tile-count" data-count aria-hidden>
              {thumbs.up > 0 && (
                <span className="tile-thumb" data-mine={myThumbValue === 'up'} data-thumbs="up">
                  <ThumbsUp className="size-3.5" />
                  {thumbs.up}
                </span>
              )}
              {thumbs.down > 0 && (
                <span className="tile-thumb" data-mine={myThumbValue === 'down'} data-thumbs="down">
                  <ThumbsDown className="size-3.5" />
                  {thumbs.down}
                </span>
              )}
              {count > 0 && (
                <span className="tile-thumb">
                  <span className="dot size-2.5" />
                  {count}
                </span>
              )}
            </span>
          )}
        </span>
      </button>
    </li>
  );
}

/** How many tiles, in board order, load at once: about one phone screen. */
const EAGER = 4;

function Sections({ keep }: { keep: (item: Item) => boolean }) {
  const laidOut = layout(keep);
  const sequence = order(laidOut);
  const eager = new Set(sequence.slice(0, EAGER).map((i) => i.id));
  if (laidOut.length === 0) {
    return (
      <p className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
        Nothing matches these filters.
      </p>
    );
  }
  return (
    <>
      <nav aria-label="Screens" className="section-nav">
        <ul>
          {laidOut.map(({ section, count }) => (
            <li key={section.id}>
              <a href={`#section-${section.id}`}>
                {section.title}
                <span className="section-nav-count">{count}</span>
              </a>
            </li>
          ))}
        </ul>
      </nav>
      <div id="board" className="flex flex-col gap-6">
        {laidOut.map(({ section, groups, asBuilt, count }) => (
          <section
            key={section.id}
            id={`section-${section.id}`}
            className="board-section"
            aria-labelledby={`section-${section.id}-title`}
          >
            <h2 className="section-head" id={`section-${section.id}-title`}>
              {section.title}
              <span className="section-head-count">{plural(count, 'screen')}</span>
            </h2>
            {groups.map((g) => (
              <div key={g.title ?? section.id} className="flex flex-col gap-2">
                {g.title && <h3 className="group-head">{g.title}</h3>}
                {g.buckets.map((b) => (
                  <Masonry key={b.shape} shape={b.shape} items={b.items}>
                    {(item) => (
                      <Tile
                        key={item.id}
                        item={item}
                        sequence={sequence}
                        eager={eager.has(item.id)}
                        as="grid"
                      />
                    )}
                  </Masonry>
                ))}
              </div>
            ))}
            {asBuilt.length > 0 && (
              <div className="as-built flex flex-col gap-2">
                <h3 className="group-head">
                  As built
                  <span className="font-normal normal-case tracking-normal text-muted-foreground">
                    {' '}
                    · the app today
                  </span>
                </h3>
                <ul className="as-built-row">
                  {asBuilt.map((item) => (
                    <Tile
                      key={item.id}
                      item={item}
                      sequence={sequence}
                      eager={eager.has(item.id)}
                      as="row"
                    />
                  ))}
                </ul>
              </div>
            )}
          </section>
        ))}
      </div>
    </>
  );
}

function FilterSelect({
  id,
  label,
  value,
  onChange,
  options,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="flex min-w-0 flex-1 basis-36 flex-col gap-1.5 sm:max-w-64 sm:flex-none">
      <Label htmlFor={id}>{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id={id} className="w-full bg-background">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function NotesPanel() {
  const { state, reviewer, removeNote, open } = useBoard();
  const mine = state.reviewers.find((r) => reviewerKey(r.reviewer) === reviewerKey(reviewer));
  const notes = mine?.notes ?? [];
  return (
    <Card className="gap-3">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <StickyNote className="size-4" aria-hidden />
          Your sticky notes
        </CardTitle>
        <CardDescription>Open any concept to add a note about it.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {notes.length === 0 && <p className="text-sm text-muted-foreground">No notes yet.</p>}
        {notes.map((n) => {
          const item = byId.get(n.itemId);
          return (
            <div
              key={n.id}
              className="rounded-md border bg-note p-2.5 text-sm text-note-foreground"
            >
              <button
                type="button"
                className="mb-1 block text-left text-xs font-semibold underline-offset-2 hover:underline"
                onClick={() => item && open(item)}
              >
                {item?.title ?? n.itemId}
              </button>
              <p className="break-words whitespace-pre-wrap">{n.text}</p>
              <Button
                variant="ghost"
                size="sm"
                className="mt-1 h-7 px-2 text-note-foreground"
                onClick={() => removeNote(n.id)}
              >
                <Trash2 aria-hidden />
                Delete note
              </Button>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

function HeatPanel() {
  const { state, reviewer, open } = useBoard();
  const visible = canSeeOthers(state, reviewer);
  // Ranked by dots; concepts with only thumbs follow, unranked.
  const rows = heat(state, conceptIds)
    .map((h) => ({ ...h, thumbs: visibleThumbs(state, reviewer, h.itemId) }))
    .filter((h) => h.dots > 0 || h.thumbs.up > 0 || h.thumbs.down > 0);
  const max = Math.max(1, ...rows.map((r) => r.dots));
  const voters = state.reviewers.filter((r) => r.dots.length > 0 || r.thumbs.length > 0).length;
  return (
    <Card className="gap-3">
      <CardHeader>
        <CardTitle>Heat so far</CardTitle>
        <CardDescription>
          {visible
            ? `Dots and thumbs from ${plural(voters, 'reviewer')} on this device. They point the discussion. They do not pick the winner.`
            : 'Shown once you finish voting, so you vote without seeing the crowd.'}
        </CardDescription>
      </CardHeader>
      {visible && (
        <CardContent>
          {rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">No dots or thumbs yet.</p>
          ) : (
            <ol className="flex flex-col gap-2" aria-label="Concepts by dots">
              {rows.slice(0, 10).map((r) => {
                const item = byId.get(r.itemId);
                return (
                  <li
                    key={r.itemId}
                    className="grid grid-cols-[2.25rem_1fr_auto_2rem] items-center gap-2 text-sm"
                    data-heat={r.itemId}
                  >
                    <span className="font-semibold tabular-nums">
                      {r.rank === null ? (
                        <span title="No dots">·</span>
                      ) : r.tied ? (
                        `=${r.rank}`
                      ) : (
                        r.rank
                      )}
                    </span>
                    <button
                      type="button"
                      className="flex min-h-11 min-w-0 flex-col justify-center gap-1 text-left"
                      onClick={() => item && open(item)}
                    >
                      <span className="truncate">{item?.title}</span>
                      <span
                        className="h-2 w-full overflow-hidden rounded-full bg-muted"
                        aria-hidden
                      >
                        <span
                          className="block h-full rounded-full bg-dot"
                          style={{ width: `${(r.dots / max) * 100}%` }}
                        />
                      </span>
                    </button>
                    <span className="heat-thumbs" data-thumbs-up={r.thumbs.up}>
                      <ThumbsUp className="size-3.5" aria-hidden />
                      <span aria-hidden>{r.thumbs.up}</span>
                      <ThumbsDown className="size-3.5" aria-hidden />
                      <span aria-hidden>{r.thumbs.down}</span>
                      <span className="sr-only">
                        {r.thumbs.up} thumbs up, {r.thumbs.down} thumbs down
                      </span>
                    </span>
                    <span
                      className="text-right font-medium tabular-nums"
                      title={`${plural(r.reviewers, 'reviewer')}`}
                    >
                      {r.dots}
                    </span>
                  </li>
                );
              })}
            </ol>
          )}
        </CardContent>
      )}
    </Card>
  );
}

function DeciderPanel() {
  const { state, reviewer, decide } = useBoard();
  const [pick, setPick] = React.useState('');
  const [reason, setReason] = React.useState('');
  const can = state.phase === 'decide' && isDecider(reviewer, ROUND.decider);
  const dotted = heat(state, conceptIds).filter((h) => h.dots > 0);
  const options = [
    ...dotted.map((h) => h.itemId),
    ...conceptIds.filter((id) => !dotted.some((h) => h.itemId === id)),
  ];
  return (
    <Card className="gap-3 border-foreground/30">
      <CardHeader>
        <CardTitle>Decider: {ROUND.decider}</CardTitle>
        <CardDescription>
          After the discussion the decider picks one concept and writes why. That goes to the
          decision log and then to a build ticket.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {can ? (
          <form
            className="flex flex-col gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              if (decide(pick, reason)) setReason('');
            }}
          >
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="decision-pick">Concept</Label>
              <Select value={pick} onValueChange={setPick}>
                <SelectTrigger id="decision-pick" className="w-full">
                  <SelectValue placeholder="Choose the concept" />
                </SelectTrigger>
                <SelectContent>
                  {options.map((id) => (
                    <SelectItem key={id} value={id}>
                      {byId.get(id)?.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="decision-reason">Why this one</Label>
              <Textarea
                id="decision-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>
            <Button type="submit" disabled={pick === ''}>
              Make the call
            </Button>
          </form>
        ) : (
          <Button className="w-full" disabled>
            {state.phase === 'decide'
              ? `Only ${ROUND.decider} makes the call`
              : 'Opens in the decide step'}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

export function BoardView() {
  const { state, reviewer, setDone } = useBoard();
  const [style, setStyle] = React.useState(ALL);
  const [feature, setFeature] = React.useState(ALL);
  const [dottedOnly, setDottedOnly] = React.useState(false);

  const entry = state.reviewers.find((r) => reviewerKey(r.reviewer) === reviewerKey(reviewer));
  const left = dotsLeft(state, reviewer);
  const others = canSeeOthers(state, reviewer);
  const dottedIds = new Set(state.reviewers.flatMap((r) => r.dots.map((d) => d.itemId)));
  const keep = (i: Item) =>
    (style === ALL || i.style === style) &&
    (feature === ALL || i.feature === feature) &&
    (!dottedOnly || dottedIds.has(i.id));
  const shown = tiles.filter(keep);
  const option = (field: 'style' | 'feature', all: string) => [
    { value: ALL, label: `${all} (${tiles.length})` },
    ...categories(tiles, field).map((v) => ({
      value: v,
      label: `${v} (${tiles.filter((i) => i[field] === v).length})`,
    })),
  ];

  return (
    <div className="flex flex-wrap items-start gap-6">
      <section className="flex min-w-0 flex-[999_1_640px] flex-col gap-4" aria-label="Concepts">
        <div className="flex flex-wrap items-end gap-3">
          <FilterSelect
            id="filter-style"
            label="Style"
            value={style}
            onChange={setStyle}
            options={option('style', 'All styles')}
          />
          <FilterSelect
            id="filter-feature"
            label="Screen or feature"
            value={feature}
            onChange={setFeature}
            options={option('feature', 'All screens')}
          />
          <div className="ml-auto flex flex-wrap items-center gap-2">
            {state.phase === 'vote' && reviewer.trim() !== '' && (
              <>
                <span
                  className="inline-flex items-center gap-2 text-sm font-medium"
                  aria-live="polite"
                  id="dots-left"
                >
                  <span className="size-3 rounded-full bg-dot" aria-hidden />
                  {left} of {DOTS_PER_REVIEWER} dots left
                </span>
                <Button variant="outline" onClick={() => setDone(!entry?.doneVoting)}>
                  {entry?.doneVoting ? 'Reopen my vote' : 'Done voting'}
                </Button>
              </>
            )}
            {others && dottedIds.size > 0 && (
              <Button
                variant={dottedOnly ? 'default' : 'outline'}
                onClick={() => setDottedOnly(!dottedOnly)}
                aria-pressed={dottedOnly}
              >
                Only dotted concepts
              </Button>
            )}
          </div>
        </div>
        <p className="text-sm text-muted-foreground" id="board-count">
          Showing {shown.length} of {tiles.length}.
          {state.phase === 'vote'
            ? ' Open a screen and tap a spot on it to drop a dot there. Tap your dot to take it back.'
            : state.phase === 'look'
              ? ' Look through everything in silence and add notes. Voting opens in the next step.'
              : ''}
        </p>
        <Sections keep={keep} />
      </section>
      <aside
        className="flex min-w-0 flex-[1_1_300px] flex-col gap-4 lg:max-w-sm"
        aria-label="Notes, heat and decision"
      >
        <NotesPanel />
        <HeatPanel />
        <DeciderPanel />
      </aside>
    </div>
  );
}
