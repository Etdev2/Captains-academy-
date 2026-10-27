import type * as React from 'react';
import { AlertTriangle, CheckCircle2, Lightbulb } from 'lucide-react';
import { SIM_NOTICE } from '../shared/sample';
import { ITEMS, correctCount, rulesStars, type Answers } from './rules';
import { debrief, clock, type DockResult } from './sim';
import { Stars } from './parts';

export interface Row {
  readonly k: string;
  readonly v: string;
  readonly target: string;
  readonly ok: boolean;
}

export interface DebriefData {
  readonly heading: string;
  readonly heroLabel: string;
  readonly heroValue: string;
  readonly stars: 0 | 1 | 2 | 3;
  readonly auto: boolean;
  readonly rows: readonly Row[];
  readonly well: readonly string[];
  readonly tip: string;
}

export function dockDebrief(r: DockResult, name: string): DebriefData {
  const d = debrief(r);
  return {
    heading: r.auto ? `${name}: autopilot run` : `${name}: debrief`,
    heroLabel: 'Your time',
    heroValue: clock(r.time),
    stars: r.stars,
    auto: r.auto,
    rows: [
      { k: 'Touches', v: String(r.bumps), target: 'None for 3 stars', ok: r.bumps === 0 },
      { k: 'Time', v: clock(r.time), target: 'Under 1:15 for 3 stars', ok: r.time <= 75 },
      {
        k: 'Speed at the slip',
        v: `${(r.mouthSpeed * 1.944).toFixed(1)} kn`,
        target: 'Under 2.7 kn',
        ok: r.mouthSpeed < 1.4,
      },
      {
        k: 'Lined up',
        v: `${Math.round((r.mouthAngle * 180) / Math.PI)}° off`,
        target: 'Within 8°',
        ok: r.mouthAngle < 0.14,
      },
    ],
    well: d.well,
    tip: d.tip,
  };
}

export function rulesDebrief(a: Answers): DebriefData {
  const right = correctCount(a);
  const well: string[] = [];
  const misses: string[] = [];
  const rows: Row[] = [];
  for (const item of ITEMS) {
    const got = a[item.id];
    const she = item.she.find((o) => o.id === got?.she);
    const act = item.act.find((o) => o.id === got?.act);
    rows.push({
      k: `${item.title}: who is she`,
      v: she?.correct ? 'Right' : 'Missed',
      target: item.cite,
      ok: !!she?.correct,
    });
    rows.push({
      k: `${item.title}: what you do`,
      v: act?.correct ? 'Right' : 'Missed',
      target: item.cite,
      ok: !!act?.correct,
    });
    if (she?.correct) well.push(`You read the lights in "${item.title.toLowerCase()}".`);
    if (act?.correct) well.push(`You picked the right action for "${item.title.toLowerCase()}".`);
    if (act && !act.correct) misses.push(act.why);
    else if (she && !she.correct) misses.push(she.why);
  }
  return {
    heading: 'Night crossing: debrief',
    heroLabel: 'Answers right',
    heroValue: `${right} of 4`,
    stars: rulesStars(right),
    auto: false,
    rows,
    well: well.length ? well.slice(0, 3) : ['You finished both scenes.'],
    tip: misses[0] ?? 'Rule 3 is next. Name that vessel is a quick drill.',
  };
}

function Notice() {
  return <p className="arc-notice">{SIM_NOTICE}</p>;
}

function WellTip({ d }: { d: DebriefData }) {
  return (
    <>
      <section className="arc-well">
        <h3>What went well</h3>
        <ul>
          {d.well.map((w) => (
            <li key={w}>
              <CheckCircle2 size={18} aria-hidden /> {w}
            </li>
          ))}
        </ul>
      </section>
      <section className="arc-tip">
        <h3>
          <Lightbulb size={18} aria-hidden /> One tip
        </h3>
        <p>{d.tip}</p>
      </section>
    </>
  );
}

const autoNote = 'The autopilot did this one, so it has no stars. Your turn next.';

export function DebriefA({ d, actions }: { d: DebriefData; actions: React.ReactNode }) {
  return (
    <section className="arc-debrief" aria-labelledby="arc-deb-h">
      <p className="arc-eyebrow">Debrief</p>
      <h1 id="arc-deb-h">{d.heading}</h1>
      <div className="arc-hero">
        <div>
          <span className="arc-hero-label">{d.heroLabel}</span>
          <strong className="arc-hero-value">{d.heroValue}</strong>
        </div>
        <Stars n={d.stars} />
      </div>
      {d.auto && <p className="arc-flag">{autoNote}</p>}
      <dl className="arc-gauges">
        {d.rows.map((r) => (
          <div key={r.k} data-ok={r.ok}>
            <dt>{r.k}</dt>
            <dd>
              {r.ok ? (
                <CheckCircle2 size={16} aria-hidden />
              ) : (
                <AlertTriangle size={16} aria-hidden />
              )}
              {r.v}
            </dd>
          </div>
        ))}
      </dl>
      <WellTip d={d} />
      <Notice />
      <div className="arc-actions">{actions}</div>
    </section>
  );
}

export function DebriefB({ d, actions }: { d: DebriefData; actions: React.ReactNode }) {
  return (
    <section className="arc-debrief" aria-labelledby="arc-deb-h">
      <h1 id="arc-deb-h">{d.heading}</h1>
      <div className="arc-score-top">
        <div>
          <span className="arc-hero-label">{d.heroLabel}</span>
          <strong className="arc-hero-value">{d.heroValue}</strong>
        </div>
        <Stars n={d.stars} />
      </div>
      {d.auto && <p className="arc-flag">{autoNote}</p>}
      <table className="arc-scorecard">
        <caption className="sr-only">Scorecard</caption>
        <thead>
          <tr>
            <th scope="col">Measure</th>
            <th scope="col">You</th>
            <th scope="col">Target</th>
            <th scope="col">Result</th>
          </tr>
        </thead>
        <tbody>
          {d.rows.map((r) => (
            <tr key={r.k} data-ok={r.ok}>
              <th scope="row">{r.k}</th>
              <td>{r.v}</td>
              <td>{r.target}</td>
              <td>
                <span className="arc-result">
                  {r.ok ? (
                    <CheckCircle2 size={16} aria-hidden />
                  ) : (
                    <AlertTriangle size={16} aria-hidden />
                  )}
                  {r.ok ? 'Met' : 'Not met'}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="arc-two">
        <WellTip d={d} />
      </div>
      <Notice />
      <div className="arc-actions">{actions}</div>
    </section>
  );
}

export function DebriefC({
  d,
  actions,
  study,
}: {
  d: DebriefData;
  actions: React.ReactNode;
  study: React.ReactNode;
}) {
  return (
    <section className="arc-debrief" aria-labelledby="arc-deb-h">
      <p className="arc-mentor">Mentor</p>
      <h1 id="arc-deb-h">
        {d.stars >= 2
          ? 'Nicely done.'
          : d.auto
            ? 'That was the autopilot.'
            : 'Good start. Here is what to fix.'}
      </h1>
      <p className="arc-bubble">
        {d.heading.split(':')[0]}. {d.heroLabel}: <b>{d.heroValue}</b>. <Stars n={d.stars} />
      </p>
      {d.auto && <p className="arc-flag">{autoNote}</p>}
      <WellTip d={d} />
      <div className="arc-study">{study}</div>
      <Notice />
      <div className="arc-actions">{actions}</div>
    </section>
  );
}
