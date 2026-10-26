import * as React from 'react';
import { ArrowLeft, ChevronRight, ExternalLink, Info, Lock } from 'lucide-react';
import { useScreen } from '../shared/routes';
import { arcadeChallenges, SIM_NOTICE, type ArcadeChallenge } from '../shared/sample';
import { LightsScene } from './LightsScene';
import { DockScene } from './DockScene';
import { ILLUSTRATIVE, SAMPLE_ANSWERS } from './rules';
import { SAMPLE_RESULT, initialSim, windFor, type DockResult } from './sim';
import { useDockKeys, useDocking, useFinish } from './useDocking';
import {
  DockControls,
  DockLive,
  EmptyFilter,
  KEYS_HINT,
  KIND_LABEL,
  KIND_OPTIONS,
  PlayBar,
  Readouts,
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
import { DebriefB, dockDebrief, rulesDebrief } from './debrief';
import './arcade.css';

const SCREENS = [
  'catalog',
  'dock-brief',
  'dock-play',
  'dock-result',
  'rules-brief',
  'rules-1',
  'rules-2',
  'rules-result',
] as const;

function Notice() {
  return (
    <p className="arc-notice">
      <Info size={18} aria-hidden /> {SIM_NOTICE}
    </p>
  );
}

function Radios<T extends string>({
  legend,
  value,
  options,
  onChange,
}: {
  legend: string;
  value: T;
  options: readonly { id: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <fieldset className="arc-side-group">
      <legend>{legend}</legend>
      {options.map((o) => (
        <label key={o.id}>
          <input
            type="radio"
            name={legend}
            checked={value === o.id}
            onChange={() => onChange(o.id)}
          />
          <span>{o.label}</span>
        </label>
      ))}
    </fieldset>
  );
}

function Catalog({ onOpen }: { onOpen: (c: ArcadeChallenge) => void }) {
  const [kind, setKind] = React.useState<Kind>('all');
  const [status, setStatus] = React.useState<StatusFilter>('any');
  const list = filterChallenges(kind, status);
  return (
    <main className="arc-page">
      <nav className="arc-crumbs" aria-label="Where you are">
        Training <ChevronRight size={16} aria-hidden /> <b>Arcade challenges</b>
      </nav>
      <header className="arc-head">
        <div>
          <h1>Training simulator</h1>
          <p className="arc-lede">
            Short practice runs for docking, the rules of the road and navigation.
          </p>
        </div>
        <button
          type="button"
          className="arc-btn primary"
          onClick={() => onOpen(arcadeChallenges[0] as ArcadeChallenge)}
        >
          Start a docking run
        </button>
      </header>
      <Notice />
      <div className="arc-catalog">
        <aside className="arc-side" aria-label="Filters">
          <Radios legend="Type" value={kind} options={KIND_OPTIONS} onChange={setKind} />
          <Radios legend="Status" value={status} options={STATUS_OPTIONS} onChange={setStatus} />
          <p className="arc-count" role="status">
            Showing {list.length} of {arcadeChallenges.length}
          </p>
        </aside>
        <section aria-label="Challenges">
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
            <ul className="arc-rows">
              {list.map((c) => {
                const route = routeOf(c);
                return (
                  <li key={c.id} className="arc-row" data-status={c.status}>
                    <div className="arc-row-main">
                      <h2>{c.name}</h2>
                      <p>{c.blurb}</p>
                    </div>
                    <dl className="arc-row-meta">
                      <div>
                        <dt>Type</dt>
                        <dd>{KIND_LABEL[c.kind]}</dd>
                      </div>
                      <div>
                        <dt>Best time</dt>
                        <dd>{c.best ?? 'None yet'}</dd>
                      </div>
                      <div>
                        <dt>Stars</dt>
                        <dd>
                          <Stars n={c.stars} label={false} />
                        </dd>
                      </div>
                      <div>
                        <dt>Status</dt>
                        <dd>
                          <StatusTag c={c} />
                        </dd>
                      </div>
                    </dl>
                    <div className="arc-row-go">
                      {route.type === 'locked' ? (
                        <span className="arc-lock">
                          <Lock size={16} aria-hidden /> Locked in this demo
                        </span>
                      ) : route.type === 'real' ? (
                        <a className="arc-btn" href={route.href}>
                          Open full game <ExternalLink size={16} aria-hidden />
                        </a>
                      ) : (
                        <button type="button" className="arc-btn" onClick={() => onOpen(c)}>
                          {c.status === 'cleared' ? 'Play again' : 'Start'}
                          <span className="sr-only">: {c.name}</span>
                        </button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}

function Legend() {
  return (
    <ul className="arc-legend" aria-label="Chart key">
      <li>
        <i className="k-berth" /> Dashed boat: where to park
      </li>
      <li>
        <i className="k-piling" /> Round posts: pilings
      </li>
      <li>
        <i className="k-wind" /> Arrows: wind push
      </li>
    </ul>
  );
}

function DockPlay({
  c,
  onDone,
  onBack,
}: {
  c: ArcadeChallenge;
  onDone: (r: DockResult) => void;
  onBack: () => void;
}) {
  const wind = windFor(c.id);
  const d = useDocking(wind, false);
  useDockKeys(d);
  useFinish(d, onDone);
  return (
    <main className="arc-page">
      <button type="button" className="arc-back" onClick={onBack}>
        <ArrowLeft size={18} aria-hidden /> Back to briefing
      </button>
      <h1>{c.name}</h1>
      <div className="arc-play-grid">
        <div className="arc-chart" data-hit={d.sim.contact > 0}>
          <DockScene sim={d.sim} trail={d.trail} dwellRatio={d.sim.dwell} />
          {d.status === 'paused' && <p className="arc-overlay">Paused</p>}
          {d.status === 'docked' && <p className="arc-overlay">Docked</p>}
          <Legend />
        </div>
        <section className="arc-panel arc-side-panel" aria-label="Controls and readouts">
          <h2>Engine and rudder</h2>
          <DockLive d={d} />
          <DockControls d={d} />
          <h2>Readouts</h2>
          <Readouts sim={d.sim} windLabel={wind.label} />
          <p className="arc-clock">Time {d.sim.t.toFixed(1)} s</p>
          <PlayBar d={d} />
          <p className="arc-hint">{KEYS_HINT}</p>
        </section>
      </div>
      <Notice />
    </main>
  );
}

export function VariantB() {
  const [screen, go] = useScreen(SCREENS);
  const [challenge, setChallenge] = React.useState<ArcadeChallenge>(
    arcadeChallenges[0] as ArcadeChallenge,
  );
  const [result, setResult] = React.useState<DockResult>(SAMPLE_RESULT);
  const [run, setRun] = React.useState(0);
  const rules = useRules();
  const night = arcadeChallenges.find((c) => c.id === 'night-crossing') as ArcadeChallenge;
  const dock = challenge.kind === 'docking' ? challenge : (arcadeChallenges[0] as ArcadeChallenge);
  const wind = windFor(dock.id);
  const answers = Object.keys(rules.answers).length ? rules.answers : SAMPLE_ANSWERS;
  const open = (c: ArcadeChallenge) => {
    if (c.kind === 'docking') {
      setChallenge(c);
      go('dock-brief');
    } else go('rules-brief');
  };
  const ruleIndex = screen === 'rules-2' ? 1 : 0;
  const item = itemAt(ruleIndex);
  const back = (
    <button type="button" className="arc-btn" onClick={() => go('catalog')}>
      All challenges
    </button>
  );
  return (
    <div className="arc-b">
      <SampleMark />
      {screen === 'catalog' && <Catalog onOpen={open} />}
      {screen === 'dock-brief' && (
        <main className="arc-page">
          <button type="button" className="arc-back" onClick={() => go('catalog')}>
            <ArrowLeft size={18} aria-hidden /> All challenges
          </button>
          <h1>{dock.name}</h1>
          <div className="arc-brief-b">
            <div>
              <dl className="arc-facts">
                <div>
                  <dt>Goal</dt>
                  <dd>
                    Park the boat in the slip. Slow, inside the pilings, pointing straight, for one
                    second.
                  </dd>
                </div>
                <div>
                  <dt>Wind</dt>
                  <dd>{wind.label}. It pushes you east the whole time.</dd>
                </div>
                <div>
                  <dt>Controls</dt>
                  <dd>
                    Four engine buttons and two rudder buttons. Hold a rudder button to turn.{' '}
                    {KEYS_HINT}
                  </dd>
                </div>
                <div>
                  <dt>Stars</dt>
                  <dd>Three stars for no touches and under 1:15.</dd>
                </div>
              </dl>
              <Notice />
              <div className="arc-actions">
                <button
                  type="button"
                  className="arc-btn primary"
                  onClick={() => {
                    setRun((n) => n + 1);
                    go('dock-play');
                  }}
                >
                  Start docking
                </button>
              </div>
            </div>
            <figure className="arc-chart small">
              <DockScene sim={initialSim()} trail={[]} dwellRatio={0} />
              <figcaption>The slip is at the top. You start at the bottom right.</figcaption>
            </figure>
          </div>
        </main>
      )}
      {screen === 'dock-play' && (
        <DockPlay
          key={run}
          c={dock}
          onBack={() => go('dock-brief')}
          onDone={(r) => {
            setResult(r);
            go('dock-result');
          }}
        />
      )}
      {screen === 'dock-result' && (
        <main className="arc-page">
          <DebriefB
            d={dockDebrief(result, dock.name)}
            actions={
              <>
                <button
                  type="button"
                  className="arc-btn primary"
                  onClick={() => {
                    setRun((n) => n + 1);
                    go('dock-play');
                  }}
                >
                  Play again
                </button>
                {back}
              </>
            }
          />
        </main>
      )}
      {screen === 'rules-brief' && (
        <main className="arc-page">
          <button type="button" className="arc-back" onClick={() => go('catalog')}>
            <ArrowLeft size={18} aria-hidden /> All challenges
          </button>
          <h1>{night.name}</h1>
          <div className="arc-brief-b">
            <div>
              <dl className="arc-facts">
                <div>
                  <dt>Goal</dt>
                  <dd>Read the lights of a vessel at night. Say what she is and what you do.</dd>
                </div>
                <div>
                  <dt>Format</dt>
                  <dd>Two scenes, two questions each. You get the reason after each scene.</dd>
                </div>
                <div>
                  <dt>Source</dt>
                  <dd>{ILLUSTRATIVE}</dd>
                </div>
              </dl>
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
                  Start scene 1
                </button>
              </div>
            </div>
            <figure className="arc-fig">
              <LightsScene lights={itemAt(0).lights} label={itemAt(0).seen} />
              <figcaption>Preview of scene 1.</figcaption>
            </figure>
          </div>
        </main>
      )}
      {(screen === 'rules-1' || screen === 'rules-2') && (
        <main className="arc-page">
          <ol className="arc-steps" aria-label="Progress">
            {[0, 1].map((i) => (
              <li key={i} aria-current={i === ruleIndex ? 'step' : undefined}>
                Scene {i + 1}
              </li>
            ))}
          </ol>
          <h1>{item.title}</h1>
          <div className="arc-brief-b">
            <div className="arc-sticky">
              <figure className="arc-fig">
                <LightsScene lights={item.lights} label={item.seen} />
                <figcaption>
                  <b>You see:</b> {item.seen}
                  <small>
                    {ILLUSTRATIVE} Rules: {item.cite}.
                  </small>
                </figcaption>
              </figure>
            </div>
            <div>
              <RulesCard
                item={item}
                answers={rules.answers}
                onPick={rules.pick}
                onCheck={rules.check}
              />
              {rules.answers[item.id]?.checked && (
                <div className="arc-actions">
                  <button
                    type="button"
                    className="arc-btn primary"
                    onClick={() => go(ruleIndex === 0 ? 'rules-2' : 'rules-result')}
                  >
                    {ruleIndex === 0 ? 'Go to scene 2' : 'See the scorecard'}
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
          <DebriefB
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
                {back}
              </>
            }
          />
        </main>
      )}
    </div>
  );
}
