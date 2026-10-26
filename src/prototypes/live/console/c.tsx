import * as React from 'react';
import { ArrowLeft, ArrowRight, BookOpen, FileText, Gamepad2, Ship } from 'lucide-react';
import { liveHref, useScreen } from '../shared/routes';
import { nextAction, seaTime, tasks } from '../shared/sample';
import type { VariantProps } from '../shared/types';
import { dueText, metCount, routeHere, routeSteps, totalParts, type TaskFilter } from './data';
import {
  backfillLine,
  CredentialDetail,
  CredentialPicker,
  FilterBar,
  Illustrative,
  MmcNote,
  NeededList,
  SampleMarker,
  TaskList,
} from './parts';
import './c.css';

const screens = ['home', 'next', 'queue', 'credential', 'needed'] as const;
type Screen = (typeof screens)[number];

export default function GuidedMentor({ variant }: VariantProps) {
  const [screen, go] = useScreen(screens);
  const [filter, setFilter] = React.useState<TaskFilter>('all');
  const [cred, setCred] = React.useState<string | null>('drug-test');
  const after = tasks.slice(1, 4);

  const back = (to: Screen = 'home', label = 'Back') => (
    <button type="button" className="cx-btn cc-back" onClick={() => go(to)}>
      <ArrowLeft size={18} aria-hidden /> {label}
    </button>
  );

  return (
    <div className="con-c">
      <header className="cc-top">
        <p className="cc-brand">Captain&rsquo;s Academy</p>
        <SampleMarker />
      </header>
      <main className="cc-main">
        {screen === 'home' && (
          <>
            <p className="cc-hello">Morning, Jordan. You are on the sea time stretch.</p>
            <section className="cc-card cc-next" aria-labelledby="cc-next-h">
              <p className="cc-label">Next up · about {nextAction.minutes} minutes</p>
              <h1 id="cc-next-h">{nextAction.title}</h1>
              <p className="cc-why">
                Why it matters: {nextAction.why} You can do it standing on the dock.
              </p>
              <button type="button" className="cx-btn cx-btn-primary" onClick={() => go('next')}>
                Show me how <ArrowRight size={20} aria-hidden />
              </button>
            </section>

            <section className="cc-after" aria-labelledby="cc-after-h">
              <h2 id="cc-after-h">After that</h2>
              <ol>
                {after.map((t, i) => (
                  <li key={t.id}>
                    <span className="cc-num" aria-hidden>
                      {i + 1}
                    </span>
                    <span>
                      <b>{t.title}</b>
                      <small>{dueText(t)}</small>
                    </span>
                  </li>
                ))}
              </ol>
              <button type="button" className="cx-link cc-linkbtn" onClick={() => go('queue')}>
                See every task and filter by date
              </button>
            </section>

            <section className="cc-voyage" aria-labelledby="cc-v-h">
              <h2 id="cc-v-h">Your voyage to the OUPV</h2>
              <ol>
                {routeSteps.map((s, i) => (
                  <li
                    key={s}
                    data-state={i < routeHere ? 'done' : i === routeHere ? 'here' : 'ahead'}
                    aria-current={i === routeHere ? 'step' : undefined}
                  >
                    <i aria-hidden />
                    <span>
                      {s}
                      {i === routeHere ? <b>You are here</b> : null}
                    </span>
                  </li>
                ))}
              </ol>
              <p className="cc-fine">
                {seaTime.creditedDays} of {seaTime.totalRequired} sea-time days logged,{' '}
                {seaTime.totalToGo} to go. {metCount} of {totalParts} parts appear met. You hold no
                credential yet. The National Maritime Center decides.
              </p>
              <div className="cc-pair">
                <button type="button" className="cx-btn" onClick={() => go('needed')}>
                  What is still needed
                </button>
                <button type="button" className="cx-btn" onClick={() => go('credential')}>
                  My papers
                </button>
              </div>
            </section>

            <section className="cc-ready" aria-labelledby="cc-r-h">
              <h2 id="cc-r-h">When you are ready</h2>
              <ul>
                <li>
                  <a href={liveHref('license', variant)}>
                    <FileText size={20} aria-hidden /> License &amp; Forms
                  </a>
                </li>
                <li>
                  <a href={liveHref('sea-time', variant)}>
                    <Ship size={20} aria-hidden /> Sea Time
                  </a>
                </li>
                <li>
                  <a href={liveHref('study', variant)}>
                    <BookOpen size={20} aria-hidden /> Study
                  </a>
                </li>
                <li>
                  <a href={liveHref('arcade', variant)}>
                    <Gamepad2 size={20} aria-hidden /> Arcade
                  </a>
                </li>
              </ul>
            </section>
          </>
        )}

        {screen === 'next' && (
          <>
            {back('home')}
            <section className="cc-card" aria-labelledby="cc-how-h">
              <p className="cc-label">Step 1 of 1 · about {nextAction.minutes} minutes</p>
              <h1 id="cc-how-h">Three small fixes</h1>
              <ol className="cc-fixes">
                <li>Use your full legal name, Jonathan Quincy Sample, as on your ID.</li>
                <li>Add the missing ZIP code to your mailing address.</li>
                <li>Change the endorsement from Inland to Near coastal.</li>
              </ol>
              <p className="cc-fine">
                The form review shows each one with a button to fix it. Form rules are{' '}
                <Illustrative /> for now.
              </p>
              <a className="cx-btn cx-btn-primary" href={liveHref('license', variant)}>
                Go to the form review <ArrowRight size={20} aria-hidden />
              </a>
            </section>
            <button
              type="button"
              className="cx-link cc-linkbtn cc-onlight"
              onClick={() => go('queue')}
            >
              Not now. What comes after this?
            </button>
          </>
        )}

        {screen === 'queue' && (
          <>
            {back('home')}
            <section className="cc-card" aria-labelledby="cc-q-h">
              <h1 id="cc-q-h">Everything on your list</h1>
              <p className="cc-fine">Filter by when it is due.</p>
              <FilterBar value={filter} onChange={setFilter} />
              <TaskList filter={filter} onFilter={setFilter} variant={variant} />
            </section>
          </>
        )}

        {screen === 'credential' && (
          <>
            {back('home')}
            <section className="cc-card" aria-labelledby="cc-c-h">
              <h1 id="cc-c-h">Your papers</h1>
              <MmcNote />
              <CredentialPicker selected={cred} onSelect={setCred} />
              <CredentialDetail id={cred} variant={variant} />
            </section>
          </>
        )}

        {screen === 'needed' && (
          <>
            {back('home')}
            <section className="cc-card" aria-labelledby="cc-n-h">
              <h1 id="cc-n-h">What is still needed</h1>
              <p className="cc-fine">{backfillLine}</p>
              <NeededList variant={variant} />
            </section>
          </>
        )}
      </main>
    </div>
  );
}
