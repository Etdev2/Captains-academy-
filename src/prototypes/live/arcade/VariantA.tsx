import * as React from 'react';
import { Anchor, ArrowLeft, BookOpen, Compass, ExternalLink, Info, Lock, Zap } from 'lucide-react';
import { useScreen } from '../shared/routes';
import { arcadeChallenges, SIM_NOTICE, type ArcadeChallenge } from '../shared/sample';
import { LightsScene } from './LightsScene';
import { DockScene } from './DockScene';
import { ILLUSTRATIVE, ITEMS, SAMPLE_ANSWERS } from './rules';
import { SAMPLE_RESULT, windFor, DWELL_SECONDS, type DockResult, headingDeg, knots } from './sim';
import { useDockKeys, useDocking, useFinish } from './useDocking';
import {
  Chips,
  DockControls,
  DockLive,
  EmptyFilter,
  KEYS_HINT,
  KIND_LABEL,
  KIND_OPTIONS,
  PlayBar,
  RulesCard,
  SampleMark,
  STATUS_OPTIONS,
  Stars,
  StatusTag,
  filterChallenges,
  itemAt,
  routeOf,
  useRules,
  type Kind,
  type StatusFilter,
} from './parts';
import { DebriefA, dockDebrief, rulesDebrief } from './debrief';
import './arcade.css';

const SCREENS = [
  'select',
  'dock-brief',
  'dock-play',
  'dock-result',
  'rules-brief',
  'rules-1',
  'rules-2',
  'rules-result',
] as const;

const KIND_ICON = { docking: Anchor, rules: BookOpen, navigation: Compass } as const;

function Dial({ deg }: { deg: number }) {
  const marks = Array.from({ length: 12 }, (_, i) => i * 30);
  return (
    <svg
      viewBox="-50 -50 100 100"
      className="arc-dial"
      role="img"
      aria-label={`Compass, heading ${deg} degrees`}
    >
      <circle r="46" className="arc-dial-face" />
      <g transform={`rotate(${-deg})`}>
        {marks.map((m) => (
          <line
            key={m}
            x1="0"
            y1="-46"
            x2="0"
            y2={m % 90 === 0 ? -38 : -42}
            transform={`rotate(${m})`}
          />
        ))}
        <text y="-26" textAnchor="middle" className="arc-dial-n">
          N
        </text>
      </g>
      <path d="M0 -50 L4 -42 L-4 -42 Z" className="arc-dial-lubber" />
      <path d="M0 -14 L6 12 L0 8 L-6 12 Z" className="arc-dial-boat" />
    </svg>
  );
}

function SpeedBar({ kn }: { kn: number }) {
  const pct = Math.min(100, Math.max(0, (kn / 5) * 100));
  return (
    <div className="arc-speedbar" role="img" aria-label={`Speed ${kn.toFixed(1)} knots`}>
      <div style={{ width: `${pct}%` }} />
      <i style={{ left: `${(2.7 / 5) * 100}%` }} />
    </div>
  );
}

function Notice() {
  return (
    <p className="arc-notice">
      <Info size={18} aria-hidden /> {SIM_NOTICE}
    </p>
  );
}

function Select({ onOpen }: { onOpen: (c: ArcadeChallenge) => void }) {
  const [kind, setKind] = React.useState<Kind>('all');
  const [status, setStatus] = React.useState<StatusFilter>('any');
  const list = filterChallenges(kind, status);
  const stars = arcadeChallenges.reduce((n, c) => n + c.stars, 0);
  const cleared = arcadeChallenges.filter((c) => c.status === 'cleared').length;
  return (
    <main className="arc-page">
      <header className="arc-head">
        <div>
          <p className="arc-eyebrow">Arcade cabinet</p>
          <h1>Pick a challenge</h1>
        </div>
        <dl className="arc-score">
          <div>
            <dt>Cleared</dt>
            <dd>
              {cleared} of {arcadeChallenges.length}
            </dd>
          </div>
          <div>
            <dt>Stars</dt>
            <dd>{stars} of 18</dd>
          </div>
        </dl>
      </header>
      <Notice />
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
        <ol className="arc-map" aria-label="Challenges">
          {list.map((c) => {
            const Icon = KIND_ICON[c.kind];
            const route = routeOf(c);
            const first = c.id === 'long-beach-docking';
            return (
              <li key={c.id} className="arc-mission" data-status={c.status} data-next={first}>
                <p className="arc-eyebrow">
                  <Icon size={16} aria-hidden /> {KIND_LABEL[c.kind]}
                  {first && <span className="arc-next"> · Next up</span>}
                </p>
                <h2>{c.name}</h2>
                <p className="arc-blurb">{c.blurb}</p>
                <div className="arc-meta">
                  <Stars n={c.stars} />
                  <span>{c.best ? `Best ${c.best}` : 'No time yet'}</span>
                </div>
                <StatusTag c={c} />
                {route.type === 'locked' ? (
                  <p className="arc-lock">
                    <Lock size={16} aria-hidden /> Locked in this demo.
                  </p>
                ) : route.type === 'real' ? (
                  <a className="arc-btn" href={route.href}>
                    Play in the full game <ExternalLink size={16} aria-hidden />
                  </a>
                ) : (
                  <button
                    type="button"
                    className={`arc-btn${first ? ' primary' : ''}`}
                    onClick={() => onOpen(c)}
                  >
                    {c.status === 'cleared' ? 'Play again' : 'Start'}
                    <span className="sr-only">: {c.name}</span>
                  </button>
                )}
              </li>
            );
          })}
        </ol>
      )}
    </main>
  );
}

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
  const wind = windFor(c.id);
  return (
    <main className="arc-page">
      <button type="button" className="arc-back" onClick={onBack}>
        <ArrowLeft size={18} aria-hidden /> All challenges
      </button>
      <p className="arc-eyebrow">Briefing</p>
      <h1>{c.name}</h1>
      <div className="arc-brief-grid">
        <section className="arc-panel">
          <h2>Goal</h2>
          <p>
            Park the boat in the slip. Slow, inside the pilings and pointing straight, for one
            second.
          </p>
        </section>
        <section className="arc-panel">
          <h2>Wind</h2>
          <p>{wind.label}. It pushes you toward the east piling all the time.</p>
        </section>
        <section className="arc-panel">
          <h2>Controls</h2>
          <p>Engine buttons on the left, rudder buttons on the right. {KEYS_HINT}</p>
        </section>
      </div>
      <Notice />
      <div className="arc-actions">
        <button type="button" className="arc-btn primary" onClick={onStart}>
          Start docking
        </button>
        <button type="button" className="arc-btn" onClick={onAuto}>
          <Zap size={18} aria-hidden /> Show me (autopilot)
        </button>
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
  const kn = knots(d.sim.ground);
  return (
    <main className="arc-play">
      <header className="arc-play-top">
        <button type="button" className="arc-back" onClick={onBack}>
          <ArrowLeft size={18} aria-hidden /> Quit
        </button>
        <h1>{c.name}</h1>
        <span className="arc-clock" aria-label="Time">
          {d.sim.t.toFixed(1)} s
        </span>
      </header>
      <div className="arc-cabin-grid">
        <aside className="arc-gauge-col" aria-label="Instruments">
          <Dial deg={headingDeg(d.sim.h)} />
          <p className="arc-big">{headingDeg(d.sim.h).toString().padStart(3, '0')}°</p>
          <p className="arc-lbl">Heading</p>
          <p className="arc-big">{kn.toFixed(1)} kn</p>
          <SpeedBar kn={kn} />
          <p className="arc-lbl">Speed. Tick marks 2.7 kn.</p>
          <p className="arc-lbl">Wind: {wind.label}</p>
          <p className="arc-lbl">Touches: {d.sim.bumps}</p>
          <p className="arc-lbl">
            Hold in slip: {Math.min(DWELL_SECONDS, d.sim.dwell).toFixed(1)} of {DWELL_SECONDS} s
          </p>
        </aside>
        <div className="arc-scene-wrap" data-hit={d.sim.contact > 0}>
          <DockScene sim={d.sim} trail={d.trail} dwellRatio={d.sim.dwell} />
          {d.status === 'paused' && <p className="arc-overlay">Paused</p>}
          {d.status === 'docked' && <p className="arc-overlay">Docked</p>}
        </div>
        <div className="arc-helm">
          <DockLive d={d} />
          <DockControls d={d} />
        </div>
      </div>
      <PlayBar d={d} />
      <p className="arc-hint">{KEYS_HINT}</p>
      <Notice />
    </main>
  );
}

function RulesScene({ index }: { index: 0 | 1 }) {
  const item = itemAt(index);
  return (
    <figure className="arc-fig">
      <LightsScene lights={item.lights} label={item.seen} />
      <figcaption>
        <b>You see:</b> {item.seen}
        <small>{ILLUSTRATIVE}</small>
      </figcaption>
    </figure>
  );
}

export function VariantA() {
  const [screen, go] = useScreen(SCREENS);
  const [challenge, setChallenge] = React.useState<ArcadeChallenge>(
    arcadeChallenges[0] as ArcadeChallenge,
  );
  const [auto, setAuto] = React.useState(false);
  const [result, setResult] = React.useState<DockResult>(SAMPLE_RESULT);
  const rules = useRules();
  const open = (c: ArcadeChallenge) => {
    if (c.kind === 'docking') {
      setChallenge(c);
      go('dock-brief');
    } else go('rules-brief');
  };
  const dock = challenge.kind === 'docking' ? challenge : (arcadeChallenges[0] as ArcadeChallenge);
  const night = arcadeChallenges.find((c) => c.id === 'night-crossing') as ArcadeChallenge;
  const answers = Object.keys(rules.answers).length ? rules.answers : SAMPLE_ANSWERS;
  const item1 = itemAt(0);
  const item2 = itemAt(1);
  const all = (
    <button type="button" className="arc-btn" onClick={() => go('select')}>
      All challenges
    </button>
  );
  return (
    <div className="arc-a">
      <SampleMark />
      {screen === 'select' && <Select onOpen={open} />}
      {screen === 'dock-brief' && (
        <Brief
          c={dock}
          onBack={() => go('select')}
          onStart={() => {
            setAuto(false);
            go('dock-play');
          }}
          onAuto={() => {
            setAuto(true);
            go('dock-play');
          }}
        />
      )}
      {screen === 'dock-play' && (
        <Play
          key={`${dock.id}-${auto}`}
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
          <DebriefA
            d={dockDebrief(result, dock.name)}
            actions={
              <>
                <button
                  type="button"
                  className="arc-btn primary"
                  onClick={() => {
                    setAuto(false);
                    go('dock-play');
                  }}
                >
                  Play again
                </button>
                <button type="button" className="arc-btn" onClick={() => go('rules-brief')}>
                  Next: night lights
                </button>
                {all}
              </>
            }
          />
        </main>
      )}
      {screen === 'rules-brief' && (
        <main className="arc-page">
          <button type="button" className="arc-back" onClick={() => go('select')}>
            <ArrowLeft size={18} aria-hidden /> All challenges
          </button>
          <p className="arc-eyebrow">Briefing</p>
          <h1>{night.name}</h1>
          <div className="arc-split">
            <RulesScene index={0} />
            <div>
              <section className="arc-panel">
                <h2>Goal</h2>
                <p>Read a vessel&rsquo;s lights in the dark. Say what she is, then what you do.</p>
              </section>
              <section className="arc-panel">
                <h2>How it works</h2>
                <p>
                  Two scenes. Pick one answer for each question and check it. Each answer comes with
                  the rule behind it.
                </p>
              </section>
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
                  Start the scenes
                </button>
              </div>
            </div>
          </div>
        </main>
      )}
      {(screen === 'rules-1' || screen === 'rules-2') && (
        <main className="arc-page">
          <p className="arc-eyebrow">
            Scene {screen === 'rules-1' ? 1 : 2} of 2 ·{' '}
            {(screen === 'rules-1' ? item1 : item2).cite}
          </p>
          <h1>{(screen === 'rules-1' ? item1 : item2).title}</h1>
          <div className="arc-split">
            <RulesScene index={screen === 'rules-1' ? 0 : 1} />
            <div>
              <RulesCard
                item={screen === 'rules-1' ? item1 : item2}
                answers={rules.answers}
                onPick={rules.pick}
                onCheck={rules.check}
              >
                {null}
              </RulesCard>
              {rules.answers[(screen === 'rules-1' ? item1 : item2).id]?.checked && (
                <div className="arc-actions">
                  <button
                    type="button"
                    className="arc-btn primary"
                    onClick={() => go(screen === 'rules-1' ? 'rules-2' : 'rules-result')}
                  >
                    {screen === 'rules-1' ? 'Next scene' : 'See the debrief'}
                  </button>
                </div>
              )}
            </div>
          </div>
          <Notice />
        </main>
      )}
      {screen === 'rules-result' && (
        <main className="arc-page">
          <DebriefA
            d={rulesDebrief(answers)}
            actions={
              <>
                <button
                  type="button"
                  className="arc-btn primary"
                  onClick={() => {
                    rules.reset();
                    go('rules-1');
                  }}
                >
                  Try the scenes again
                </button>
                {all}
              </>
            }
          />
          <p className="arc-sub">
            {ITEMS.length} scenes. {ILLUSTRATIVE}
          </p>
        </main>
      )}
    </div>
  );
}
