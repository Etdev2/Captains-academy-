import * as React from 'react';
import { ArrowRight, BookOpen, FileText, Gamepad2, Ship } from 'lucide-react';
import { liveHref, useScreen } from '../shared/routes';
import { heldCredentials, nextAction, sailor, seaTime, targetLicense } from '../shared/sample';
import type { VariantProps } from '../shared/types';
import {
  areaLabel,
  daysUntil,
  deadlines,
  fmtDate,
  metCount,
  totalParts,
  type TaskFilter,
} from './data';
import {
  backfillLine,
  Chip,
  CredentialDetail,
  CredentialPicker,
  FilterBar,
  Illustrative,
  MmcNote,
  NeededList,
  SampleMarker,
  TaskList,
} from './parts';
import './b.css';

const screens = ['home', 'next', 'tasks', 'credential', 'needed'] as const;
type Screen = (typeof screens)[number];
const navItems: { id: Screen; label: string }[] = [
  { id: 'home', label: 'Overview' },
  { id: 'tasks', label: 'Tasks' },
  { id: 'credential', label: 'Credentials' },
  { id: 'needed', label: 'Still needed' },
];

export default function CleanLight({ variant }: VariantProps) {
  const [screen, go] = useScreen(screens);
  const [filter, setFilter] = React.useState<TaskFilter>('all');
  const [cred, setCred] = React.useState<string | null>('drug-test');
  const areas = [
    { id: 'license', label: 'License & Forms', Icon: FileText },
    { id: 'sea-time', label: 'Sea Time', Icon: Ship },
    { id: 'study', label: 'Study', Icon: BookOpen },
    { id: 'arcade', label: 'Arcade', Icon: Gamepad2 },
  ] as const;

  return (
    <div className="con-b">
      <aside className="cb-side">
        <p className="cb-brand">Captain&rsquo;s Academy</p>
        <nav aria-label="This page" className="cb-seg">
          {navItems.map((n) => (
            <button
              key={n.id}
              type="button"
              aria-current={
                screen === n.id || (n.id === 'home' && screen === 'next') ? 'page' : undefined
              }
              onClick={() => go(n.id)}
            >
              {n.label}
            </button>
          ))}
        </nav>
        <nav aria-label="Other areas" className="cb-areas">
          <p>Go to</p>
          <ul>
            {areas.map(({ id, label, Icon }) => (
              <li key={id}>
                <a href={liveHref(id, variant)}>
                  <Icon size={20} aria-hidden /> {label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <SampleMarker />
      </aside>

      <main className="cb-main">
        {screen === 'home' && (
          <>
            <header className="cb-head">
              <p className="cb-kicker">
                {sailor.name} · working toward {targetLicense.name}
              </p>
              <h1>
                {metCount} of {totalParts} parts of your OUPV application appear met.
              </h1>
              <p className="cb-lede">
                Sea time is the long part: {seaTime.totalToGo} days to go. You hold no Merchant
                Mariner Credential yet. The OUPV would be your first.
              </p>
            </header>

            <section className="cb-numbers" aria-label="Progress">
              <div>
                <b>{seaTime.creditedDays}</b>
                <span>of {seaTime.totalRequired} sea-time days</span>
                <small>{seaTime.totalToGo} to go, any waters</small>
              </div>
              <div>
                <b>{seaTime.nearCoastalDays}</b>
                <span>of {seaTime.nearCoastalRequired} near-coastal days</span>
                <small>{seaTime.nearCoastalToGo} to go, furthest behind</small>
              </div>
              <div>
                <b>
                  {metCount}/{totalParts}
                </b>
                <span>parts appear met</span>
                <small>The National Maritime Center decides</small>
              </div>
            </section>
            <p className="cb-note">
              {backfillLine} Simulator and arcade time never counts as sea time.
            </p>

            <section className="cb-next" aria-labelledby="cb-next-h">
              <p className="cb-label">Do this next</p>
              <h2 id="cb-next-h">{nextAction.title}</h2>
              <p>{nextAction.why}</p>
              <button type="button" className="cx-btn cx-btn-primary" onClick={() => go('next')}>
                See what to fix <ArrowRight size={20} aria-hidden />
              </button>
            </section>

            <section aria-labelledby="cb-dl-h" className="cb-block">
              <div className="cb-row">
                <h2 id="cb-dl-h">Deadlines</h2>
                <button type="button" className="cx-link cb-linkbtn" onClick={() => go('tasks')}>
                  All tasks
                </button>
              </div>
              <ol className="cb-timeline">
                {deadlines.map((t) => (
                  <li key={t.id}>
                    <time dateTime={t.due}>
                      <b>{fmtDate(t.due)}</b>
                      <span>in {daysUntil(t.due)} days</span>
                    </time>
                    <div>
                      <h3>{t.title}</h3>
                      <p>
                        {areaLabel[t.area]}
                        {t.illustrative ? <Illustrative /> : null}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </section>

            <section aria-labelledby="cb-cr-h" className="cb-block">
              <div className="cb-row">
                <h2 id="cb-cr-h">Credentials on file</h2>
                <button
                  type="button"
                  className="cx-link cb-linkbtn"
                  onClick={() => go('credential')}
                >
                  Details
                </button>
              </div>
              <ul className="cb-cards">
                {heldCredentials.map((c) => (
                  <li key={c.id}>
                    <h3>{c.name}</h3>
                    <p>{c.detail}</p>
                    <Chip
                      tone={
                        c.status === 'expiring' ? 'attn' : c.status === 'extra' ? 'extra' : 'done'
                      }
                    >
                      {c.status === 'expiring'
                        ? 'Window closing'
                        : c.status === 'extra'
                          ? 'Extra'
                          : 'On file'}
                    </Chip>
                  </li>
                ))}
              </ul>
            </section>
          </>
        )}

        {screen === 'next' && (
          <article className="cb-page">
            <button type="button" className="cx-btn" onClick={() => go('home')}>
              Back to overview
            </button>
            <h1>{nextAction.title}</h1>
            <p className="cb-lede">{nextAction.why}</p>
            <ol className="cb-fixes">
              <li>
                <b>Legal name.</b> It says &ldquo;Jon Q. Sample&rdquo;. Use Jonathan Quincy Sample,
                as on your ID.
              </li>
              <li>
                <b>Mailing address.</b> The ZIP code is missing.
              </li>
              <li>
                <b>Endorsement.</b> The form says Inland. Your goal is Near coastal.
              </li>
            </ol>
            <p className="cb-note">
              Form rules shown here are <Illustrative /> until checked against current 46 CFR text.
            </p>
            <a className="cx-btn cx-btn-primary" href={liveHref('license', variant)}>
              Go to the form review <ArrowRight size={20} aria-hidden />
            </a>
          </article>
        )}

        {screen === 'tasks' && (
          <article className="cb-page">
            <h1>Tasks</h1>
            <p className="cb-lede">Today is Oct 26. Pick a filter to narrow the list.</p>
            <FilterBar value={filter} onChange={setFilter} />
            <TaskList filter={filter} onFilter={setFilter} variant={variant} />
          </article>
        )}

        {screen === 'credential' && (
          <article className="cb-page">
            <h1>Credentials</h1>
            <MmcNote />
            <div className="cb-split">
              <CredentialPicker selected={cred} onSelect={setCred} />
              <CredentialDetail id={cred} variant={variant} />
            </div>
          </article>
        )}

        {screen === 'needed' && (
          <article className="cb-page">
            <h1>What is still needed</h1>
            <p className="cb-lede">
              Your logged time and papers appear to meet {metCount} of {totalParts} parts for the
              OUPV near coastal.
            </p>
            <NeededList variant={variant} />
          </article>
        )}
      </main>
    </div>
  );
}
