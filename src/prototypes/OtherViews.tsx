import { Download, ExternalLink, Upload } from 'lucide-react';
import * as React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { exportBoard, NotABoardFileError, reviewerKey } from './board';
import { useBoard } from './BoardContext';
import { kindOf } from './BoardView';
import { byId, NIGHT_HARBOR_RUN, reference, ROUND, thumbUrl, unavailable } from './round';

// The Reference and Share tabs: material that is not voted on, and moving a
// board between devices.

export function ReferenceView() {
  const { open } = useBoard();
  const start = byId.get('cl-nhr-start-screen');
  return (
    <div className="flex flex-col gap-6">
      <p className="text-sm text-muted-foreground">
        Comparison boards, decks, wireframes and documents. They are not on the board, so no concept
        is counted twice: each one on a comparison board is voted on once, as an extracted detail.
      </p>
      <ul className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-4" id="reference">
        {reference.map((item) => {
          const thumb = thumbUrl(item);
          return (
            <li key={item.id} data-id={item.id}>
              <Card className="h-full gap-0 overflow-hidden py-0">
                {thumb ? (
                  <button
                    type="button"
                    onClick={() => open(item)}
                    className="block bg-muted"
                    aria-label={`Open ${item.title} full size`}
                  >
                    <img
                      src={thumb}
                      alt=""
                      className="mx-auto block h-40 w-full object-contain"
                      loading="lazy"
                    />
                  </button>
                ) : (
                  <div className="flex h-40 items-center justify-center bg-muted text-sm text-muted-foreground">
                    PDF
                  </div>
                )}
                <CardContent className="flex flex-col gap-2 p-3">
                  <h3 className="leading-tight font-semibold">{item.title}</h3>
                  <div className="flex flex-wrap gap-1.5">
                    <Badge variant="outline">{kindOf(item)}</Badge>
                    <Badge variant="outline">{item.feature}</Badge>
                  </div>
                  {!thumb && (
                    <Button variant="outline" size="sm" onClick={() => open(item)}>
                      Details and PDF
                    </Button>
                  )}
                </CardContent>
              </Card>
            </li>
          );
        })}
      </ul>

      <section className="flex flex-col gap-3" aria-labelledby="interactive-title">
        <h2 id="interactive-title" className="text-lg font-semibold">
          Interactive example
        </h2>
        <Card className="max-w-xl gap-0 overflow-hidden py-0 sm:flex-row">
          {start && thumbUrl(start) && (
            <img
              src={thumbUrl(start)}
              alt=""
              className="block h-40 bg-muted object-contain sm:w-56"
            />
          )}
          <CardContent className="flex flex-col gap-2 p-4">
            <h3 className="font-semibold">Night Harbor Run, playable</h3>
            <p className="text-sm text-muted-foreground">
              The playable arcade prototype, on a private Claude page. Ask Elliott for access. It is
              not on the board: vote on its screenshots instead.
            </p>
            <Button asChild variant="outline" className="self-start">
              <a href={NIGHT_HARBOR_RUN} target="_blank" rel="noopener">
                <ExternalLink aria-hidden />
                Open Night Harbor Run
              </a>
            </Button>
          </CardContent>
        </Card>
      </section>

      <section className="flex flex-col gap-2" aria-labelledby="unavailable-title">
        <h2 id="unavailable-title" className="text-lg font-semibold">
          Unavailable
        </h2>
        <p className="text-sm text-muted-foreground">
          Named in the ChatGPT set, but no image of them was supplied.
        </p>
        <ul className="list-disc pl-5 text-sm" id="unavailable">
          {unavailable.map((i) => (
            <li key={i.id}>
              <b>{i.style}</b> ({i.creator}). {i.notes}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function download(name: string, data: unknown) {
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }),
  );
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const slug = (t: string) =>
  t
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'all';

export function ShareView() {
  const { state, reviewer, importFile, say, persistent } = useBoard();
  const input = React.useRef<HTMLInputElement>(null);
  const [result, setResult] = React.useState<{ text: string; tone: 'info' | 'error' } | null>(null);
  const today = new Date().toISOString().slice(0, 10);
  const mine = state.reviewers.some((r) => reviewerKey(r.reviewer) === reviewerKey(reviewer));

  return (
    <div className="flex max-w-3xl flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Where this board is saved</CardTitle>
          <CardDescription>
            {persistent
              ? 'Saved on this device, in this browser. Nothing goes to a server yet, so other people see your dots only when you send them a file.'
              : 'Not saved: this browser is blocking storage. The board lasts until this tab closes, so export it before you leave.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 text-sm">
          <ol className="list-decimal space-y-1 pl-5">
            <li>
              Each reviewer places their dots, then presses Export my dots and notes and sends the
              file to {ROUND.decider}.
            </li>
            <li>{ROUND.decider} imports each file. For each reviewer, the newer copy wins.</li>
            <li>{ROUND.decider} runs the discussion and decide steps from the combined board.</li>
          </ol>
          <p className="text-muted-foreground">
            A shared database will replace these files. Until then, nothing here is shared team
            data.
          </p>
        </CardContent>
      </Card>
      <div className="flex flex-wrap gap-2">
        <Button
          onClick={() => {
            if (!mine) {
              setResult({ text: 'You have no dots or notes to export yet.', tone: 'error' });
              return;
            }
            download(
              `decision-board-${ROUND.id}-${slug(reviewer)}-${today}.json`,
              exportBoard(state, reviewer, new Date().toISOString()),
            );
            setResult({
              text: `Exported your dots and notes. Send the file to ${ROUND.decider}.`,
              tone: 'info',
            });
          }}
        >
          <Download aria-hidden />
          Export my dots and notes
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            download(
              `decision-board-${ROUND.id}-all-${today}.json`,
              exportBoard(state, undefined, new Date().toISOString()),
            );
            setResult({ text: 'Exported everything on this device.', tone: 'info' });
          }}
        >
          <Download aria-hidden />
          Export everything on this device
        </Button>
        <Button variant="outline" onClick={() => input.current?.click()}>
          <Upload aria-hidden />
          Import a board file
        </Button>
        <input
          ref={input}
          type="file"
          accept="application/json,.json"
          className="sr-only"
          id="import-file"
          aria-label="Import a board file"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            e.target.value = '';
            if (!file) return;
            try {
              const r = importFile(await file.text());
              setResult(
                r && {
                  text: `Imported ${file.name}: ${r.added} reviewers added, ${r.updated} updated, ${r.skipped} dots or notes skipped (for concepts not on this board).`,
                  tone: 'info',
                },
              );
            } catch (error) {
              const text =
                error instanceof NotABoardFileError
                  ? error.message
                  : 'That file could not be read.';
              setResult({ text, tone: 'error' });
              say(text, 'error');
            }
          }}
        />
      </div>
      <p
        id="share-status"
        role="status"
        className={result?.tone === 'error' ? 'font-medium text-destructive' : 'text-sm'}
      >
        {result?.text}
      </p>
    </div>
  );
}
