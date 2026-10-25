import { Maximize2, StickyNote, Trash2 } from 'lucide-react';
import * as React from 'react';
import { Badge } from '@/components/ui/badge';
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
  reviewerKey,
  visibleDots,
} from './board';
import { useBoard } from './BoardContext';
import { DotImage } from './DotImage';
import { categories, kindLabel, type Item } from './inventory';
import { byId, conceptIds, concepts, ROUND, thumbUrl } from './round';

const ALL = 'all';

function plural(n: number, one: string, many = `${one}s`) {
  return `${n} ${n === 1 ? one : many}`;
}

export function kindOf(item: Item) {
  return item.extractedFrom ? 'Extracted detail' : kindLabel[item.kind];
}

function ConceptCard({ item }: { item: Item }) {
  const { state, reviewer, open, placeDot } = useBoard();
  const shown = visibleDots(state, reviewer).filter((d) => d.itemId === item.id);
  const others = canSeeOthers(state, reviewer);
  const mine = shown.filter((d) => d.mine).length;
  const voting = state.phase === 'vote';

  return (
    <Card className="gap-0 overflow-hidden py-0" data-id={item.id}>
      <DotImage
        item={item}
        src={thumbUrl(item)}
        label={item.title}
        className="border-b"
        maxHeight="14rem"
        loading="lazy"
      />
      <CardContent className="flex flex-1 flex-col gap-2 p-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="leading-tight font-semibold">{item.title}</h3>
          <Badge variant="secondary" className="shrink-0" data-count>
            {others
              ? plural(shown.length, 'dot')
              : mine > 0
                ? `Your ${plural(mine, 'dot')}`
                : 'No dots yet'}
          </Badge>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <Badge variant="outline">{item.style}</Badge>
          <Badge variant="outline">{item.feature}</Badge>
          <Badge variant="outline" className="text-muted-foreground">
            {kindOf(item)}
          </Badge>
        </div>
        <div className="mt-auto flex gap-2 pt-1">
          {voting && (
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => placeDot(item.id, 0.5, 0.5)}
            >
              Add a dot
            </Button>
          )}
          <Button
            variant={voting ? 'ghost' : 'outline'}
            className={voting ? '' : 'flex-1'}
            onClick={() => open(item)}
            aria-label={`Open ${item.title} full size`}
          >
            <Maximize2 />
            {voting ? null : 'Open'}
          </Button>
        </div>
      </CardContent>
    </Card>
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
    <div className="flex min-w-48 flex-1 flex-col gap-1.5 sm:max-w-64 sm:flex-none">
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
  const rows = heat(state, conceptIds).filter((h) => h.dots > 0);
  const max = Math.max(1, ...rows.map((r) => r.dots));
  const voters = state.reviewers.filter((r) => r.dots.length > 0).length;
  return (
    <Card className="gap-3">
      <CardHeader>
        <CardTitle>Heat so far</CardTitle>
        <CardDescription>
          {visible
            ? `Dots from ${plural(voters, 'reviewer')} on this device. Dots point the discussion. They do not pick the winner.`
            : 'Shown once you finish voting, so you vote without seeing the crowd.'}
        </CardDescription>
      </CardHeader>
      {visible && (
        <CardContent>
          {rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">No dots yet.</p>
          ) : (
            <ol className="flex flex-col gap-2" aria-label="Concepts by dots">
              {rows.slice(0, 10).map((r) => {
                const item = byId.get(r.itemId);
                return (
                  <li
                    key={r.itemId}
                    className="grid grid-cols-[2.25rem_1fr_2rem] items-center gap-2 text-sm"
                    data-heat={r.itemId}
                  >
                    <span className="font-semibold tabular-nums">
                      {r.tied ? `=${r.rank}` : r.rank}
                    </span>
                    <button
                      type="button"
                      className="flex min-w-0 flex-col gap-1 text-left"
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
  const shown = concepts.filter(
    (i) =>
      (style === ALL || i.style === style) &&
      (feature === ALL || i.feature === feature) &&
      (!dottedOnly || dottedIds.has(i.id)),
  );
  const option = (field: 'style' | 'feature', all: string) => [
    { value: ALL, label: `${all} (${concepts.length})` },
    ...categories(concepts, field).map((v) => ({
      value: v,
      label: `${v} (${concepts.filter((i) => i[field] === v).length})`,
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
          Showing {shown.length} of {concepts.length}.
          {state.phase === 'vote'
            ? ' Click a spot on an image to drop a dot there. Click your dot to take it back.'
            : state.phase === 'look'
              ? ' Look through everything in silence and add notes. Voting opens in the next step.'
              : ''}
        </p>
        {shown.length === 0 ? (
          <p className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
            Nothing matches these filters.
          </p>
        ) : (
          <ul className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-4" id="board">
            {shown.map((item) => (
              <li key={item.id} className="flex">
                <ConceptCard item={item} />
              </li>
            ))}
          </ul>
        )}
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
