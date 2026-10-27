import * as React from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Compass,
  FileText,
  Gamepad2,
  LayoutDashboard,
  Ship,
} from 'lucide-react';
import { liveHref } from '../shared/routes';
import { heldCredentials, nextAction, seaTime, sailor, targetLicense } from '../shared/sample';
import type { VariantProps } from '../shared/types';
import {
  deadlines,
  dueText,
  metCount,
  routeHere,
  routeSteps,
  stillNeeded,
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
  Ring,
  SampleMarker,
  TaskList,
} from './parts';
import { useScreen } from '../shared/routes';
import './a.css';

const screens = ['home', 'next', 'tasks', 'credential', 'needed'] as const;

export default function NightBridge({ variant }: VariantProps) {
  const [screen, go] = useScreen(screens);
  const [filter, setFilter] = React.useState<TaskFilter>('all');
  const [cred, setCred] = React.useState<string | null>('drug-test');

  const nav = [
    { label: 'Console', short: 'Console', href: null, Icon: LayoutDashboard },
    {
      label: 'License & Forms',
      short: 'License',
      href: liveHref('license', variant),
      Icon: FileText,
    },
    { label: 'Sea Time', short: 'Sea Time', href: liveHref('sea-time', variant), Icon: Ship },
    { label: 'Study', short: 'Study', href: liveHref('study', variant), Icon: BookOpen },
    { label: 'Arcade', short: 'Arcade', href: liveHref('arcade', variant), Icon: Gamepad2 },
  ] as const;

  return (
    <div className="con-a">
      <header className="ca-bar">
        <div className="ca-brand">
          <Compass size={28} aria-hidden />
          <span>
            CAPTAIN&rsquo;S ACADEMY<small>CAPTAIN&rsquo;S CONSOLE</small>
          </span>
        </div>
        <nav className="ca-tabs" aria-label="Main">
          {nav.map(({ label, href, Icon }) =>
            href ? (
              <a key={label} href={href}>
                {label}
              </a>
            ) : (
              <a key={label} href={liveHref('console', variant)} aria-current="page">
                <Icon size={18} aria-hidden /> {label}
              </a>
            ),
          )}
        </nav>
        <span className="ca-who">
          <SampleMarker />
          <span className="ca-avatar" aria-hidden>
            {sailor.initials}
          </span>
        </span>
      </header>

      <main className="ca-main">
        {screen === 'home' ? (
          <Home variant={variant} go={go} setCred={setCred} />
        ) : (
          <section className="ca-sub">
            <button type="button" className="cx-btn" onClick={() => go('home')}>
              <ArrowLeft size={18} aria-hidden /> Back to the console
            </button>
            {screen === 'next' && <Next variant={variant} go={go} />}
            {screen === 'tasks' && (
              <Panel eyebrow="Tasks and deadlines" title="What is coming up">
                <FilterBar value={filter} onChange={setFilter} />
                <TaskList filter={filter} onFilter={setFilter} variant={variant} />
              </Panel>
            )}
            {screen === 'credential' && (
              <Panel eyebrow="Credentials" title="Your documents">
                <MmcNote />
                <div className="ca-split">
                  <CredentialPicker selected={cred} onSelect={setCred} />
                  <CredentialDetail id={cred} variant={variant} />
                </div>
              </Panel>
            )}
            {screen === 'needed' && (
              <Panel eyebrow={`Requirements · ${targetLicense.name}`} title="What is still needed">
                <NeededList variant={variant} />
              </Panel>
            )}
          </section>
        )}
      </main>

      <nav className="ca-bottom" aria-label="Main">
        {nav.map(({ short, href, Icon }) => (
          <a
            key={short}
            href={href ?? liveHref('console', variant)}
            aria-current={href ? undefined : 'page'}
          >
            <Icon size={22} aria-hidden />
            {short}
          </a>
        ))}
      </nav>
    </div>
  );
}

function Panel({
  eyebrow,
  title,
  children,
  className = '',
}: {
  eyebrow: string;
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`ca-panel ${className}`}>
      <p className="ca-eyebrow">{eyebrow}</p>
      <h2>{title}</h2>
      {children}
    </section>
  );
}

function Home({
  variant,
  go,
  setCred,
}: {
  variant: VariantProps['variant'];
  go: (s: (typeof screens)[number]) => void;
  setCred: (id: string) => void;
}) {
  return (
    <>
      <div className="ca-head">
        <div>
          <p className="ca-eyebrow">Console</p>
          <h1>Your route to OUPV</h1>
          <p className="ca-sub-line">
            {sailor.name} · holds no Merchant Mariner Credential yet · 2 vessels logged
          </p>
        </div>
        <p className="ca-goal">
          <small>GOAL</small> {targetLicense.name}
        </p>
      </div>

      <section className="ca-route" aria-label="Passage plan">
        <p className="ca-eyebrow">
          Passage plan{' '}
          <span>
            Step {routeHere + 1} of {routeSteps.length}
          </span>
        </p>
        <ol>
          {routeSteps.map((s, i) => (
            <li
              key={s}
              data-state={i < routeHere ? 'done' : i === routeHere ? 'here' : 'ahead'}
              aria-current={i === routeHere ? 'step' : undefined}
            >
              <i aria-hidden />
              <span>{s}</span>
              <em>{i < routeHere ? 'Done' : i === routeHere ? 'You are here' : 'Ahead'}</em>
            </li>
          ))}
        </ol>
      </section>

      <div className="ca-grid">
        <Panel eyebrow="Next step" title={nextAction.title} className="ca-lamp">
          <p>{nextAction.why}</p>
          <div className="ca-actions">
            <button type="button" className="cx-btn cx-btn-primary" onClick={() => go('next')}>
              Open this step <ArrowRight size={20} aria-hidden />
            </button>
          </div>
        </Panel>

        <Panel eyebrow="Sea-service progress" title="Sea time" className="ca-sea">
          <div className="ca-rings">
            <div>
              <Ring
                value={seaTime.creditedDays}
                max={seaTime.totalRequired}
                tone="done"
                caption="Any waters"
              />
              <p>
                <b>{seaTime.totalToGo} days to go</b>
                <br />
                Any waters
              </p>
            </div>
            <div>
              <Ring
                value={seaTime.nearCoastalDays}
                max={seaTime.nearCoastalRequired}
                tone="attn"
                caption="Ocean or near coastal"
              />
              <p>
                <b className="ca-amber">{seaTime.nearCoastalToGo} days to go</b>
                <br />
                Ocean or near coastal
              </p>
            </div>
          </div>
          <p className="ca-callout">
            Logged sea time appears to meet 0 of 2 sea-service parts so far. {backfillLine} The
            National Maritime Center makes the final call.
          </p>
          <p className="cx-note">Simulator and arcade time never counts as sea time.</p>
        </Panel>

        <Panel
          eyebrow="Earned credentials"
          title={`${heldCredentials.length} documents`}
          className="ca-creds"
        >
          <MmcNote />
          <ul>
            {heldCredentials.map((c) => (
              <li key={c.id}>
                <button
                  type="button"
                  className="cx-cred"
                  onClick={() => {
                    setCred(c.id);
                    go('credential');
                  }}
                >
                  <span className="cx-cred-text">
                    <b>{c.name}</b>
                    <span>{c.detail}</span>
                  </span>
                  <Chip
                    tone={
                      c.status === 'expiring' ? 'attn' : c.status === 'extra' ? 'extra' : 'done'
                    }
                  >
                    {c.status === 'expiring'
                      ? 'Closing'
                      : c.status === 'extra'
                        ? 'Extra'
                        : 'On file'}
                  </Chip>
                </button>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel eyebrow="Deadlines" title="Coming up" className="ca-dead">
          <ul>
            {deadlines.map((t) => (
              <li key={t.id}>
                <b>{t.title}</b>
                <span>
                  {dueText(t)}
                  {t.illustrative ? <Illustrative /> : null}
                </span>
              </li>
            ))}
          </ul>
          <button type="button" className="cx-btn" onClick={() => go('tasks')}>
            All tasks and filters
          </button>
        </Panel>

        <Panel
          eyebrow={`Still missing · ${stillNeeded.length} items`}
          title={`${metCount} of ${totalParts} parts appear met`}
          className="ca-miss"
        >
          <ul>
            {stillNeeded.map((r) => (
              <li key={r.id}>
                <b>{r.label}</b>
                <span>{r.detail}</span>
              </li>
            ))}
          </ul>
          <button type="button" className="cx-btn" onClick={() => go('needed')}>
            What is still needed
          </button>
        </Panel>

        <Panel eyebrow="Go to" title="Other areas" className="ca-areas">
          <ul>
            <li>
              <a className="cx-btn" href={liveHref('license', variant)}>
                License &amp; Forms
              </a>
            </li>
            <li>
              <a className="cx-btn" href={liveHref('sea-time', variant)}>
                Sea Time
              </a>
            </li>
            <li>
              <a className="cx-btn" href={liveHref('study', variant)}>
                Study
              </a>
            </li>
            <li>
              <a className="cx-btn" href={liveHref('arcade', variant)}>
                Arcade
              </a>
            </li>
          </ul>
        </Panel>
      </div>
    </>
  );
}

function Next({
  variant,
  go,
}: {
  variant: VariantProps['variant'];
  go: (s: (typeof screens)[number]) => void;
}) {
  return (
    <Panel eyebrow="Next step" title={nextAction.title} className="ca-lamp">
      <p>{nextAction.why}</p>
      <ol className="ca-steps">
        <li>Name: use your full legal name, Jonathan Quincy Sample.</li>
        <li>Mailing address: add the missing ZIP code.</li>
        <li>Endorsement: change Inland to Near coastal to match your goal.</li>
      </ol>
      <p className="cx-note">
        About {nextAction.minutes} minutes. Form rules here are <Illustrative /> until checked.
      </p>
      <div className="ca-actions">
        <a className="cx-btn cx-btn-primary" href={liveHref('license', variant)}>
          Go to the form review <ArrowRight size={20} aria-hidden />
        </a>
        <button type="button" className="cx-btn" onClick={() => go('tasks')}>
          See what is after this
        </button>
      </div>
    </Panel>
  );
}
