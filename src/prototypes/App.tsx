import { Check, Info } from 'lucide-react';
import * as React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { phaseLabel, phases, type Phase } from './board';
import { BoardProvider, useBoard } from './BoardContext';
import { BoardView } from './BoardView';
import { ConceptDialog } from './ConceptDialog';
import { ReferenceView, ShareView } from './OtherViews';
import { byId, ROUND } from './round';

// The decision board at /prototypes (issue #72, ADR 0009): an internal design
// review. Everyone looks, places five dots, the team discusses the dotted
// concepts, and the decider makes the call.

function Stepper() {
  const { state, setPhase } = useBoard();
  const current = phases.indexOf(state.phase);
  return (
    <Card className="flex-row flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
      <ol className="flex flex-wrap items-center gap-x-5 gap-y-2" aria-label="Round steps">
        {phases.map((p, i) => (
          <li
            key={p}
            className="flex items-center gap-2"
            aria-current={i === current ? 'step' : undefined}
          >
            <span
              className={cn(
                'inline-flex size-6 items-center justify-center rounded-full border text-xs font-medium',
                i < current && 'border-transparent bg-muted',
                i === current && 'border-primary bg-primary text-primary-foreground',
              )}
            >
              {i < current ? <Check className="size-3.5" aria-label="Done" /> : i + 1}
            </span>
            <span
              className={cn(
                'text-sm font-medium',
                i === current ? 'text-foreground' : 'text-muted-foreground max-sm:sr-only',
              )}
            >
              {phaseLabel[p]}
            </span>
          </li>
        ))}
      </ol>
      <div className="flex w-full flex-wrap items-center gap-2 sm:ml-auto sm:w-auto">
        <Label htmlFor="round-step" className="text-sm text-muted-foreground max-sm:sr-only">
          Step, set by whoever runs the review
        </Label>
        <Select value={state.phase} onValueChange={(v) => setPhase(v as Phase)}>
          <SelectTrigger id="round-step" className="w-full sm:w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {phases.map((p, i) => (
              <SelectItem key={p} value={p}>
                {i + 1}. {phaseLabel[p]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </Card>
  );
}

function Decision() {
  const { state } = useBoard();
  if (!state.decision) return null;
  const item = byId.get(state.decision.itemId);
  return (
    <Alert id="decision">
      <Check aria-hidden />
      <AlertTitle>
        Decision: {item?.title} ({item?.style})
      </AlertTitle>
      <AlertDescription>
        <p className="break-words whitespace-pre-wrap">{state.decision.reason}</p>
        <p>
          Decided by {state.decision.decider} on {new Date(state.decision.at).toLocaleString()}. It
          goes to a build ticket next.
        </p>
      </AlertDescription>
    </Alert>
  );
}

function Page() {
  const { reviewer, setReviewer, persistent, message } = useBoard();
  const [tab, setTab] = React.useState('board');
  return (
    <div className="min-h-dvh">
      <header className="border-b" id="page-header">
        <div className="mx-auto flex max-w-[1400px] flex-wrap items-center justify-between gap-x-3 px-3 py-0.5 sm:px-8">
          <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-sm">
            <a href="/" className="page-link text-muted-foreground hover:text-foreground">
              {ROUND.project}
            </a>
            <span className="text-muted-foreground max-sm:hidden" aria-hidden>
              /
            </span>
            <span className="text-muted-foreground max-sm:hidden">Design reviews</span>
            <span className="text-muted-foreground" aria-hidden>
              /
            </span>
            <span className="font-medium" aria-current="page">
              {ROUND.title}
            </span>
          </nav>
          <Badge variant={persistent ? 'secondary' : 'destructive'} id="saved-where">
            {persistent ? 'Saved on this device' : 'Not saved: storage is blocked'}
          </Badge>
        </div>
      </header>
      <main className="mx-auto flex max-w-[1400px] flex-col gap-4 px-3 py-4 sm:px-8 sm:py-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h1 className="page-title">Decision board</h1>
          <div className="flex w-full flex-col gap-1.5 sm:w-72">
            <Label htmlFor="reviewer">Your name</Label>
            <Input
              id="reviewer"
              autoComplete="name"
              maxLength={60}
              placeholder="Shown with your dots and notes"
              value={reviewer}
              onChange={(e) => setReviewer(e.target.value)}
            />
          </div>
        </div>
        <Alert>
          <Info aria-hidden />
          <AlertTitle>Internal design review, not for release.</AlertTitle>
          <AlertDescription>
            Dots point the discussion and do not approve any build. {ROUND.decider} makes the final
            call. Generated screens are visual concepts: their lesson text and navigation diagrams
            require verification before instructional use.
          </AlertDescription>
        </Alert>
        <Stepper />
        <Decision />
        <p
          role="status"
          id="board-status"
          className={cn(
            'text-sm empty:-mt-4',
            message?.tone === 'error' && 'font-medium text-destructive',
          )}
        >
          {message?.text}
        </p>
        <Tabs value={tab} onValueChange={setTab} className="gap-4">
          <TabsList>
            <TabsTrigger value="board">Board</TabsTrigger>
            <TabsTrigger value="reference">Reference</TabsTrigger>
            <TabsTrigger value="share">Share</TabsTrigger>
          </TabsList>
          <TabsContent value="board">
            <BoardView />
          </TabsContent>
          <TabsContent value="reference">
            <ReferenceView />
          </TabsContent>
          <TabsContent value="share">
            <ShareView />
          </TabsContent>
        </Tabs>
      </main>
      <ConceptDialog />
    </div>
  );
}

export function App() {
  return (
    <BoardProvider>
      <Page />
    </BoardProvider>
  );
}
