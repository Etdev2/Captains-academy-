import * as React from 'react';
import { ArrowLeft, BookOpen, ChevronDown, ChevronUp, Info, Lightbulb } from 'lucide-react';
import { liveHref, useScreen } from '../shared/routes';
import {
  arcadeChallenges,
  SIM_NOTICE,
  studyTopics,
  weakSpots,
  type ArcadeChallenge,
} from '../shared/sample';
import { LightsScene } from './LightsScene';
import { DockScene } from './DockScene';
import { ILLUSTRATIVE, SAMPLE_ANSWERS } from './rules';
import { SAMPLE_RESULT, windFor, type DockResult, knots } from './sim';
import { useDockKeys, useDocking, useFinish } from './useDocking';
import {
  Chips,
  DockControls,
  DockLive,
  EmptyFilter,
  KEYS_HINT,
  KIND_OPTIONS,
  PlayBar,
  RulesCard,
  SampleMark,
  STATUS_OPTIONS,
  Stars,
  StatusTag,
  coach,
  filterChallenges,
  itemAt,
  routeOf,
  useRules,
  type Kind,
  type StatusFilter,
} from './parts';
import { DebriefC, dockDebrief, rulesDebrief } from './debrief';
import './arcade.css';

const SCREENS = [
  'next',
  'dock-brief',
  'dock-play',
  'dock-result',
  'rules-brief',
  'rules-1',
  'rules-2',
  'rules-result',
] as const;
type Screen = (typeof SCREENS)[number];

function Notice() {
  return (
    <p className="arc-notice">
      <Info size={18} aria-hidden /> {SIM_NOTICE}
    </p>
  );
}

function Route({ steps, at }: { steps: readonly string[]; at: number }) {
  return (
    <ol className="arc-route" aria-label="Your route">
      {steps.map((s, i) => (
        <li key={s} aria-current={i === at ? 'step' : undefined} data-done={i < at}>
          <span aria-hidden>{i < at ? '✓' : i + 1}</span>
          {s}
        </li>
      ))}
    </ol>
  );
}

const weakest = weakSpots[2] ?? 'Who gives way when crossing (Rule 15)';
const rulesTopic = studyTopics.find((t) => t.id === 'rules');

function Next({
  onNight,
  onOpen,
  go,
}: {
  onNight: () => void;
  onOpen: (c: ArcadeChallenge) => void;
  go: (s: Screen) => void;
}) {
  const [more, setMore] = React.useState(false);
  const [kind, setKind] = React.useState<Kind>('all');
  const [status, setStatus] = React.useState<StatusFilter>('any');
  const list = filterChallenges(kind, status);
  const night = arcadeChallenges.find((c) => c.id === 'night-crossing') as ArcadeChallenge;
  return (
    <main className="arc-page">
      <p className="arc-mentor">Mentor</p>
      <h1>Your next practice</h1>
      <p className="arc-bubble">
        &ldquo;{weakest}&rdquo; is on your weak list. This drill trains it. It takes about 3
        minutes.
      </p>
      <section className="arc-hero-card" aria-labelledby="arc-reco">
        <p className="arc-eyebrow">Recommended for you</p>
        <h2 id="arc-reco">{night.name}</h2>
        <p>{night.blurb}</p>
        <p className="arc-why-small">
          Your last Rules of the Road practice score was {rulesTopic?.score}. Pass mark
          illustrative.
        </p>
        <button type="button" className="arc-btn primary" onClick={onNight}>
          Start with the lights
        </button>
      </section>
      <Route steps={['Read the lights', 'Dock the boat', 'Review in Study']} at={0} />
      <Notice />
      <div className="arc-more">
        <button
          type="button"
          className="arc-btn ghost"
          aria-expanded={more}
          onClick={() => setMore(!more)}
        >
          {more ? <ChevronUp size={18} aria-hidden /> : <ChevronDown size={18} aria-hidden />}
          {more ? 'Hide other challenges' : 'See other challenges'}
        </button>
        {more && (
          <div>
            <div className="arc-filters">
              <Chips label="Type" value={kind} options={KIND_OPTIONS} onChange={setKind} />
              <Chips label="Status" value={status} options={STATUS_OPTIONS} onChange={setStatus} />
            </div>
            {list.length === 0 ? (
              <EmptyFilter
                kind={kind}
                status={status}
                onClear={() => {
                  setKind('all');
                  setStatus('any');
                }}
              />
            ) : (
              <ul className="arc-list">
                {list.map((c) => {
                  const route = routeOf(c);
                  return (
                    <li key={c.id}>
                      <div>
                        <h3>{c.name}</h3>
                        <p>{c.best ? `Best ${c.best}` : 'No time yet'}</p>
                        <Stars n={c.stars} />
                        <StatusTag c={c} />
                      </div>
                      {route.type === 'locked' ? (
                        <p className="arc-lock">Locked in this demo.</p>
                      ) : route.type === 'real' ? (
                        <a className="arc-btn" href={route.href}>
                          Open in the full game
                        </a>
                      ) : (
                        <button
                          type="button"
                          className="arc-btn"
                          onClick={() => (route.type === 'rules' ? go('rules-brief') : onOpen(c))}
                        >
                          {c.status === 'cleared' ? 'Play again' : 'Start'}
                          <span className="sr-only">: {c.name}</span>
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}
      </div>
    </main>
  );
}

const BRIEF = [
  {
    title: 'Where you are going',
    body: 'Park the boat in the slip at the top. Be slow, inside the pilings and pointing straight for one second.',
    try: 'Try this first. Look at the dashed boat. That is where you stop.',
  },
  {
    title: 'What the wind does',
    body: 'The wind pushes you east all the time. The east piling is on your right.',
    try: 'Try this first. Aim a little to the left of the slip and let the wind carry you.',
  },
  {
    title: 'How to steer',
    body: 'The engine buttons stay where you set them. Hold a rudder button to turn, let go to stop turning.',
    try: 'Try this first. Tap Slow ahead, not Ahead. A boat stops slowly.',
  },
] as const;

function Brief({
  c,
  onStart,
  onAuto,
  onBack,
}: {
  c: ArcadeChallenge;
  onStart: () => void;
  onAuto: () => void;
  onBack: () => void;
}) {
  const [i, setI] = React.useState(0);
  const step = BRIEF[i] ?? BRIEF[0];
  const last = i === BRIEF.length - 1;
  return (
    <main className="arc-page">
      <Route steps={['Brief', 'Practice', 'Debrief']} at={0} />
      <p className="arc-eyebrow">
        {c.name} · Step {i + 1} of {BRIEF.length}
      </p>
      <h1>{step.title}</h1>
      <p className="arc-bubble big">{step.body}</p>
      <p className="arc-try">
        <Lightbulb size={20} aria-hidden /> {step.try}
      </p>
      {last && <p className="arc-hint">{KEYS_HINT}</p>}
      <Notice />
      <div className="arc-actions">
        {last ? (
          <button type="button" className="arc-btn primary" onClick={onStart}>
            Start docking
          </button>
        ) : (
          <button type="button" className="arc-btn primary" onClick={() => setI(i + 1)}>
            Next
          </button>
        )}
        <button type="button" className="arc-btn" onClick={i === 0 ? onBack : () => setI(i - 1)}>
          <ArrowLeft size={18} aria-hidden /> Back
        </button>
        {last && (
          <button type="button" className="arc-btn ghost" onClick={onAuto}>
            Watch it first (autopilot)
          </button>
        )}
      </div>
    </main>
  );
}

function Play({
  c,
  auto,
  onDone,
  onBack,
}: {
  c: ArcadeChallenge;
  auto: boolean;
  onDone: (r: DockResult) => void;
  onBack: () => void;
}) {
  const wind = windFor(c.id);
  const d = useDocking(wind, auto);
  useDockKeys(d);
  useFinish(d, onDone);
  return (
    <main className="arc-page arc-play-c">
      <Route steps={['Brief', 'Practice', 'Debrief']} at={1} />
      <p className="arc-bubble coach" role="status" aria-live="polite">
        <span className="arc-mentor">Mentor</span>{' '}
        {d.status === 'docked' ? 'Docked. Well done.' : coach(d)}
      </p>
      <div className="arc-chart" data-hit={d.sim.contact > 0}>
        <DockScene sim={d.sim} trail={d.trail} dwellRatio={d.sim.dwell} />
        {d.status === 'paused' && <p className="arc-overlay">Paused</p>}
      </div>
      <p className="arc-miniread">
        {knots(d.sim.ground).toFixed(1)} kn · Touches {d.sim.bumps} · {d.sim.t.toFixed(0)} s · Wind:{' '}
        {wind.label}
      </p>
      <DockLive d={d} />
      <DockControls d={d} />
      <PlayBar d={d} />
      <div className="arc-actions">
        <button type="button" className="arc-btn ghost" onClick={onBack}>
          <ArrowLeft size={18} aria-hidden /> Back to the brief
        </button>
      </div>
    </main>
  );
}

export function VariantC({ variant }: { variant: 'a' | 'b' | 'c' }) {
  const [screen, go] = useScreen(SCREENS);
  const [challenge, setChallenge] = React.useState<ArcadeChallenge>(
    arcadeChallenges[0] as ArcadeChallenge,
  );
  const [auto, setAuto] = React.useState(false);
  const [run, setRun] = React.useState(0);
  const [result, setResult] = React.useState<DockResult>(SAMPLE_RESULT);
  const rules = useRules();
  const night = arcadeChallenges.find((c) => c.id === 'night-crossing') as ArcadeChallenge;
  const dock = challenge.kind === 'docking' ? challenge : (arcadeChallenges[0] as ArcadeChallenge);
  const answers = Object.keys(rules.answers).length ? rules.answers : SAMPLE_ANSWERS;
  const ruleIndex = screen === 'rules-2' ? 1 : 0;
  const item = itemAt(ruleIndex);
  const start = (a: boolean) => {
    setAuto(a);
    setRun((n) => n + 1);
    go('dock-play');
  };
  const study = (
    <>
      <p>
        <BookOpen size={18} aria-hidden /> Related topic in Study: Rules of the Road, your lowest at{' '}
        {rulesTopic?.score}. Scores are illustrative.
      </p>
      <a className="arc-btn" href={liveHref('study', variant)}>
        Open Study
      </a>
    </>
  );
  return (
    <div className="arc-c">
      <SampleMark />
      {screen === 'next' && (
        <Next
          go={go}
          onNight={() => go('rules-brief')}
          onOpen={(c) => {
            setChallenge(c);
            go('dock-brief');
          }}
        />
      )}
      {screen === 'dock-brief' && (
        <Brief
          c={dock}
          onBack={() => go('next')}
          onStart={() => start(false)}
          onAuto={() => start(true)}
        />
      )}
      {screen === 'dock-play' && (
        <Play
          key={run}
          c={dock}
          auto={auto}
          onBack={() => go('dock-brief')}
          onDone={(r) => {
            setResult(r);
            go('dock-result');
          }}
        />
      )}
      {screen === 'dock-result' && (
        <main className="arc-page">
          <Route steps={['Brief', 'Practice', 'Debrief']} at={2} />
          <DebriefC
            d={dockDebrief(result, dock.name)}
            study={study}
            actions={
              <>
                <button type="button" className="arc-btn primary" onClick={() => start(false)}>
                  Try once more
                </button>
                <button type="button" className="arc-btn" onClick={() => go('next')}>
                  Back to my next practice
                </button>
              </>
            }
          />
        </main>
      )}
      {screen === 'rules-brief' && (
        <main className="arc-page">
          <Route steps={['Brief', 'Practice', 'Debrief']} at={0} />
          <p className="arc-eyebrow">{night.name}</p>
          <h1>Read the lights</h1>
          <p className="arc-bubble big">
            At night you only see lights. Two questions for each scene. First, what is she? Then,
            what do you do?
          </p>
          <p className="arc-try">
            <Lightbulb size={20} aria-hidden /> Try this first. A red light is her left side. A
            green light is her right side. A white light high up is her masthead light.
          </p>
          <p className="arc-hint">{ILLUSTRATIVE}</p>
          <Notice />
          <div className="arc-actions">
            <button
              type="button"
              className="arc-btn primary"
              onClick={() => {
                rules.reset();
                go('rules-1');
              }}
            >
              Show me the first scene
            </button>
            <button type="button" className="arc-btn" onClick={() => go('next')}>
              <ArrowLeft size={18} aria-hidden /> Back
            </button>
          </div>
        </main>
      )}
      {(screen === 'rules-1' || screen === 'rules-2') && (
        <main className="arc-page">
          <Route steps={['Brief', 'Practice', 'Debrief']} at={1} />
          <p className="arc-eyebrow">
            Scene {ruleIndex + 1} of 2 · {item.cite}
          </p>
          <h1>{item.title}</h1>
          <figure className="arc-fig">
            <LightsScene lights={item.lights} label={item.seen} />
            <figcaption>
              <b>You see:</b> {item.seen}
              <small>{ILLUSTRATIVE}</small>
            </figcaption>
          </figure>
          <RulesCard
            key={item.id}
            stepwise
            item={item}
            answers={rules.answers}
            onPick={rules.pick}
            onCheck={(id) => {
              rules.check(id);
              go(ruleIndex === 0 ? 'rules-2' : 'rules-result');
            }}
          />
          <Notice />
        </main>
      )}
      {screen === 'rules-result' && (
        <main className="arc-page">
          <Route steps={['Brief', 'Practice', 'Debrief']} at={2} />
          <DebriefC
            d={rulesDebrief(answers)}
            study={study}
            actions={
              <>
                <button type="button" className="arc-btn primary" onClick={() => start(false)}>
                  Now dock the boat
                </button>
                <button
                  type="button"
                  className="arc-btn"
                  onClick={() => {
                    rules.reset();
                    go('rules-1');
                  }}
                >
                  Do the scenes again
                </button>
                <button type="button" className="arc-btn ghost" onClick={() => go('next')}>
                  Back to my next practice
                </button>
              </>
            }
          />
        </main>
      )}
    </div>
  );
}
