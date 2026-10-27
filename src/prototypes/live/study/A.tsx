import * as React from 'react';
import {
  ArrowRight,
  BookOpen,
  CalendarClock,
  CheckCircle2,
  CircleAlert,
  ClipboardCheck,
  Clock,
  Flame,
  Gauge,
  LayoutDashboard,
  ListChecks,
  RotateCcw,
  Target,
  Timer,
} from 'lucide-react';
import { studyStreakDays } from '../shared/sample';
import { useScreen } from '../shared/routes';
import {
  CATEGORIES,
  NOT_EXAM_NOTE,
  PASS_MARK_NOTE,
  QUESTION_TEXT,
  categoryLabel,
  clock,
  dayLabel,
  examMissed,
  examParts,
  firstOpenLesson,
  lessonByNumber,
  lessonsDone,
  lessonsFor,
  mockExam,
  nextLesson,
  partPct,
  studyTopics,
  topicById,
  usePractice,
  useReview,
  type StudyTopic,
} from './core';
import './a.css';

const SCREENS = ['dashboard', 'topic', 'practice', 'results', 'review'] as const;
type Screen = (typeof SCREENS)[number];

const NAV: { id: Screen; label: string; Icon: typeof Gauge }[] = [
  { id: 'dashboard', label: 'Plan', Icon: LayoutDashboard },
  { id: 'topic', label: 'Topics', Icon: BookOpen },
  { id: 'practice', label: 'Practice', Icon: Target },
  { id: 'results', label: 'Exam', Icon: ClipboardCheck },
  { id: 'review', label: 'Review', Icon: ListChecks },
];

function Ring({ value, label }: { value: number; label: string }) {
  const r = 38;
  const c = 2 * Math.PI * r;
  return (
    <svg className="stu-a-ring" viewBox="0 0 100 100" role="img" aria-label={label}>
      <circle cx="50" cy="50" r={r} className="trk" />
      <circle
        cx="50"
        cy="50"
        r={r}
        className="val"
        strokeDasharray={`${(c * value) / 100} ${c}`}
        transform="rotate(-90 50 50)"
      />
      <text x="50" y="57" textAnchor="middle" className="num">
        {value}%
      </text>
    </svg>
  );
}

function Tag({ tone, children }: { tone: 'done' | 'attn'; children: React.ReactNode }) {
  const Icon = tone === 'done' ? CheckCircle2 : CircleAlert;
  return (
    <span className={`stu-a-tag ${tone}`}>
      <Icon aria-hidden size={16} />
      {children}
    </span>
  );
}

export default function VariantA() {
  const [screen, go] = useScreen(SCREENS);
  const [topicId, setTopicId] = React.useState('rules');
  const [lessonN, setLessonN] = React.useState<number>(nextLesson.lesson.n);
  const practice = usePractice();
  const review = useReview(practice.missed);
  const topic = topicById(topicId);

  const pickTopic = (t: StudyTopic) => {
    setTopicId(t.id);
    setLessonN(firstOpenLesson(t));
    go('topic');
  };

  // Keys 1 to 5 answer, Enter or arrow moves on.
  React.useEffect(() => {
    if (screen !== 'practice') return;
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target as HTMLElement | null;
      if (t && /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)) return;
      const n = Number(e.key);
      if (n >= 1 && n <= CATEGORIES.length && !practice.finished && practice.picked === undefined) {
        practice.choose((CATEGORIES[n - 1] as (typeof CATEGORIES)[number]).id);
      } else if (e.key === 'ArrowRight' && practice.picked !== undefined) {
        practice.next();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  return (
    <div className="stu-a">
      <header className="stu-a-top">
        <div className="stu-a-brand">
          <Gauge aria-hidden size={22} />
          <span>
            Study bridge
            <small>Rules of the Road and more</small>
          </span>
        </div>
        <nav className="stu-a-nav" aria-label="Study sections">
          {NAV.map(({ id, label, Icon }) => (
            <button
              key={id}
              type="button"
              aria-current={screen === id ? 'page' : undefined}
              onClick={() => go(id)}
            >
              <Icon aria-hidden size={20} />
              <span>{label}</span>
            </button>
          ))}
        </nav>
        <div className="stu-a-status">
          <span className="stu-a-chip">
            <Flame aria-hidden size={18} /> {studyStreakDays}-day streak
          </span>
          <span className="stu-a-sample">Sample data</span>
        </div>
      </header>

      <main className="stu-a-main" id="stu-a-main">
        {screen === 'dashboard' && (
          <Dashboard
            onTopic={pickTopic}
            onNext={() => {
              setTopicId('rules');
              setLessonN(nextLesson.lesson.n);
              go('topic');
            }}
            onResults={() => go('results')}
            onReview={() => go('review')}
            weakOpen={review.open.length}
          />
        )}
        {screen === 'topic' && (
          <TopicScreen
            topic={topic}
            lessonN={lessonN}
            onLesson={setLessonN}
            onTopic={(t) => {
              setTopicId(t.id);
              setLessonN(firstOpenLesson(t));
            }}
            onStart={() => {
              practice.restart();
              go('practice');
            }}
          />
        )}
        {screen === 'practice' && (
          <PracticeScreen p={practice} onReview={() => go('review')} onTopic={() => go('topic')} />
        )}
        {screen === 'results' && <Results onReview={() => go('review')} />}
        {screen === 'review' && <ReviewScreen review={review} onPractice={() => go('topic')} />}
      </main>
    </div>
  );
}

// ---------------------------------------------------------------- dashboard

function Dashboard(props: {
  onTopic: (t: StudyTopic) => void;
  onNext: () => void;
  onResults: () => void;
  onReview: () => void;
  weakOpen: number;
}) {
  const schedule = [
    { d: '2026-10-26', what: 'Lesson 14: Lights of towing vessels', mins: 20, today: true },
    { d: '2026-10-27', what: 'Review: who gives way when crossing', mins: 15 },
    { d: '2026-10-28', what: 'Lesson 17: Sound signals', mins: 20 },
    { d: '2026-10-29', what: 'Chart plotting: set and drift', mins: 25 },
    { d: '2026-11-02', what: 'Retake the Rules of the Road mock exam', mins: 45 },
  ];
  return (
    <>
      <div className="stu-a-head">
        <p className="stu-a-eyebrow">Watch 1 · Study</p>
        <h1>Study dashboard</h1>
        <p className="stu-a-sub">
          Jordan, four topics are in progress. Rules of the Road is the one to move.
        </p>
      </div>

      <div className="stu-a-grid">
        <section className="stu-a-panel lamp stu-a-next" aria-labelledby="a-next">
          <h2 className="stu-a-ph" id="a-next">
            <Target aria-hidden size={18} /> Study next
          </h2>
          <p className="stu-a-big">
            Lesson {nextLesson.lesson.n}: {nextLesson.lesson.title}
          </p>
          <p className="stu-a-muted">
            Rules of the Road · 20 minutes. Your last mock exam lost points on towing lights.
          </p>
          <button type="button" className="stu-a-btn primary" onClick={props.onNext}>
            Open lesson {nextLesson.lesson.n} <ArrowRight aria-hidden size={20} />
          </button>
        </section>

        <section className="stu-a-panel" aria-labelledby="a-gauges">
          <h2 className="stu-a-ph" id="a-gauges">
            <Gauge aria-hidden size={18} /> Topic gauges
          </h2>
          <ul className="stu-a-gauges">
            {studyTopics.map((t) => (
              <li key={t.id}>
                <button type="button" className="stu-a-gauge" onClick={() => props.onTopic(t)}>
                  <Ring
                    value={t.progress}
                    label={`${t.name}, ${t.progress} percent of lessons done`}
                  />
                  <span className="stu-a-gname">{t.name}</span>
                  <span className="stu-a-muted">
                    {lessonsDone(t)} of {t.lessons} lessons
                  </span>
                  {t.weak ? <Tag tone="attn">Weak topic</Tag> : <Tag tone="done">On track</Tag>}
                </button>
              </li>
            ))}
          </ul>
          <p className="stu-a-note">Topic names and scores are illustrative.</p>
        </section>

        <section className="stu-a-panel" aria-labelledby="a-exam">
          <h2 className="stu-a-ph" id="a-exam">
            <ClipboardCheck aria-hidden size={18} /> Last mock exam
          </h2>
          <p className="stu-a-readout">
            {mockExam.score}
            <span>%</span>
          </p>
          <div className="stu-a-scale" aria-hidden>
            <i style={{ width: `${mockExam.score}%` }} />
            <b style={{ left: `${mockExam.passMark}%` }} />
          </div>
          <p className="stu-a-muted">
            {mockExam.module}, {dayLabel(mockExam.date)}. Practice mark {mockExam.passMark}%,{' '}
            <strong>illustrative</strong>.
          </p>
          <button type="button" className="stu-a-btn" onClick={props.onResults}>
            Read the results
          </button>
        </section>

        <section className="stu-a-panel" aria-labelledby="a-weak">
          <h2 className="stu-a-ph" id="a-weak">
            <CircleAlert aria-hidden size={18} /> Weak topics
          </h2>
          <p className="stu-a-readout amber">{props.weakOpen}</p>
          <p className="stu-a-muted">items waiting for review.</p>
          <button type="button" className="stu-a-btn" onClick={props.onReview}>
            Open weak-topic review
          </button>
        </section>

        <section className="stu-a-panel stu-a-sched" aria-labelledby="a-sched">
          <h2 className="stu-a-ph" id="a-sched">
            <CalendarClock aria-hidden size={18} /> Watch schedule
            <span className="count">Suggested plan</span>
          </h2>
          <ol className="stu-a-watch">
            {schedule.map((s) => (
              <li key={s.d} className={s.today ? 'today' : undefined}>
                <span className="when">{dayLabel(s.d)}</span>
                <span className="what">{s.what}</span>
                <span className="stu-a-muted">
                  <Clock aria-hidden size={16} /> {s.mins} min
                </span>
                {s.today && <Tag tone="attn">Today</Tag>}
              </li>
            ))}
          </ol>
          <p className="stu-a-note">
            {studyStreakDays} days in a row. Study time is separate from sea time and never counts
            toward it.
          </p>
        </section>
      </div>
    </>
  );
}

// -------------------------------------------------------------------- topic

function TopicScreen(props: {
  topic: StudyTopic;
  lessonN: number;
  onLesson: (n: number) => void;
  onTopic: (t: StudyTopic) => void;
  onStart: () => void;
}) {
  const lessons = lessonsFor(props.topic);
  const chosen = lessonByNumber(props.topic, props.lessonN);
  return (
    <>
      <div className="stu-a-head">
        <p className="stu-a-eyebrow">Topics</p>
        <h1>{props.topic.name}</h1>
        <p className="stu-a-sub">
          {lessonsDone(props.topic)} of {props.topic.lessons} lessons done. Pick a lesson, then
          practice.
        </p>
      </div>
      <div className="stu-a-split">
        <div className="stu-a-panel">
          <h2 className="stu-a-ph">Topic</h2>
          <div className="stu-a-topics" role="group" aria-label="Choose a topic">
            {studyTopics.map((t) => (
              <button
                key={t.id}
                type="button"
                aria-pressed={t.id === props.topic.id}
                onClick={() => props.onTopic(t)}
              >
                <span>{t.name}</span>
                <span className="stu-a-muted">{t.progress}%</span>
              </button>
            ))}
          </div>
        </div>
        <div className="stu-a-panel">
          <h2 className="stu-a-ph">
            Lessons <span className="count">{lessons.length}</span>
          </h2>
          <ol className="stu-a-lessons">
            {lessons.map((l) => (
              <li key={l.n}>
                <button
                  type="button"
                  aria-pressed={l.n === chosen.n}
                  onClick={() => props.onLesson(l.n)}
                >
                  <span className="n">{l.n}</span>
                  <span className="t">{l.title}</span>
                  {l.done ? (
                    <Tag tone="done">Done</Tag>
                  ) : l.n === nextLesson.lesson.n && props.topic.id === 'rules' ? (
                    <Tag tone="attn">Next</Tag>
                  ) : (
                    <span className="stu-a-muted">To do</span>
                  )}
                </button>
              </li>
            ))}
          </ol>
        </div>
        <aside className="stu-a-panel lamp stu-a-start" aria-label="Start practice">
          <h2 className="stu-a-ph">Selected</h2>
          <p className="stu-a-big">
            Lesson {chosen.n}: {chosen.title}
          </p>
          <button type="button" className="stu-a-btn primary" onClick={props.onStart}>
            Start practice <ArrowRight aria-hidden size={20} />
          </button>
          <p className="stu-a-note">
            Prototype: every lesson opens the same 8 questions on Rule 3 vessel definitions.
          </p>
        </aside>
      </div>
    </>
  );
}

// ----------------------------------------------------------------- practice

function PracticeScreen({
  p,
  onReview,
  onTopic,
}: {
  p: ReturnType<typeof usePractice>;
  onReview: () => void;
  onTopic: () => void;
}) {
  if (p.finished) {
    return (
      <div className="stu-a-focus">
        <div className="stu-a-panel lamp">
          <p className="stu-a-eyebrow">Practice readout</p>
          <p className="stu-a-readout">
            {p.score}
            <span> of {p.total}</span>
          </p>
          <p className="stu-a-muted">
            Time {clock(p.elapsed)}.{' '}
            {p.missed.length === 0 ? 'No misses.' : `${p.missed.length} to review.`}
          </p>
          {p.missed.length > 0 && (
            <ul className="stu-a-missed">
              {p.missed.map((c) => (
                <li key={c.id}>
                  <strong>{c.cue}</strong>
                  <span>
                    {categoryLabel(c.answer)}. {c.why} <em>{c.citation}</em>
                  </span>
                </li>
              ))}
            </ul>
          )}
          <p className="stu-a-note">{NOT_EXAM_NOTE}</p>
          <div className="stu-a-actions">
            <button type="button" className="stu-a-btn primary" onClick={onReview}>
              Review what I missed <ArrowRight aria-hidden size={20} />
            </button>
            <button type="button" className="stu-a-btn" onClick={p.restart}>
              <RotateCcw aria-hidden size={18} /> Run it again
            </button>
            <button type="button" className="stu-a-btn ghost" onClick={onTopic}>
              Back to topics
            </button>
          </div>
        </div>
      </div>
    );
  }
  const answered = p.picked !== undefined;
  return (
    <div className="stu-a-focus">
      <div className="stu-a-hud" role="group" aria-label="Practice status">
        <span>
          Question {p.index + 1} of {p.total}
        </span>
        <span>
          <Timer aria-hidden size={18} /> {clock(p.elapsed)}
        </span>
        <span>
          <Flame aria-hidden size={18} /> Run of {p.run}
        </span>
      </div>
      <div
        className="stu-a-ticks"
        role="progressbar"
        aria-label="Progress"
        aria-valuemin={0}
        aria-valuemax={p.total}
        aria-valuenow={p.index + (answered ? 1 : 0)}
      >
        {p.cards.map((c, i) => (
          <i key={c.id} className={i < p.index || (i === p.index && answered) ? 'on' : undefined} />
        ))}
      </div>
      <section className="stu-a-card" aria-labelledby="a-q">
        <p className="stu-a-eyebrow">Rule 3 · Vessel definitions</p>
        <p className="stu-a-cue" id="a-q">
          {p.card.cue}
        </p>
        <p className="stu-a-muted">{QUESTION_TEXT}</p>
        <div className="stu-a-opts" role="group" aria-label="Answers">
          {CATEGORIES.map((c, i) => {
            const isRight = answered && c.id === p.card.answer;
            const isMine = answered && c.id === p.picked;
            return (
              <button
                key={c.id}
                type="button"
                disabled={answered}
                className={isRight ? 'right' : isMine ? 'wrong' : undefined}
                onClick={() => p.choose(c.id)}
              >
                <kbd aria-hidden>{i + 1}</kbd>
                <span>{c.label}</span>
                {isRight && (
                  <span className="mark">
                    <CheckCircle2 aria-hidden size={20} /> Right answer
                  </span>
                )}
                {isMine && !isRight && (
                  <span className="mark">
                    <CircleAlert aria-hidden size={20} /> Your answer
                  </span>
                )}
              </button>
            );
          })}
        </div>
        <div aria-live="polite">
          {answered && (
            <div className={`stu-a-fb ${p.correct ? 'ok' : 'miss'}`}>
              <p className="head">
                {p.correct ? (
                  <CheckCircle2 aria-hidden size={22} />
                ) : (
                  <CircleAlert aria-hidden size={22} />
                )}
                {p.correct ? 'Correct' : `Not quite. It is ${categoryLabel(p.card.answer)}.`}
              </p>
              <p>{p.card.why}</p>
              <p className="cite">{p.card.citation}</p>
              <button type="button" className="stu-a-btn primary" onClick={p.next} autoFocus>
                {p.index + 1 === p.total ? 'See score' : 'Next question'}{' '}
                <ArrowRight aria-hidden size={20} />
              </button>
            </div>
          )}
        </div>
        {!answered && <p className="stu-a-note">Tap an answer, or press 1 to 5.</p>}
      </section>
    </div>
  );
}

// ------------------------------------------------------------------ results

function Results({ onReview }: { onReview: () => void }) {
  const min = Math.round((mockExam.minutes * 60) / mockExam.questions);
  return (
    <>
      <div className="stu-a-head">
        <p className="stu-a-eyebrow">Mock exam · {dayLabel(mockExam.date)}</p>
        <h1>Mock exam results</h1>
        <p className="stu-a-sub">
          {mockExam.module}. {NOT_EXAM_NOTE}
        </p>
      </div>
      <div className="stu-a-grid res">
        <section className="stu-a-panel" aria-labelledby="a-score">
          <h2 className="stu-a-ph" id="a-score">
            Score
          </h2>
          <p className="stu-a-readout amber">
            {mockExam.score}
            <span>%</span>
          </p>
          <div className="stu-a-scale" aria-hidden>
            <i style={{ width: `${mockExam.score}%` }} />
            <b style={{ left: `${mockExam.passMark}%` }} />
          </div>
          <p className="stu-a-muted">
            <Tag tone="attn">
              {mockExam.passMark - mockExam.score} points under the practice mark
            </Tag>
          </p>
          <p className="stu-a-note">{PASS_MARK_NOTE}</p>
        </section>
        <section className="stu-a-panel" aria-labelledby="a-read">
          <h2 className="stu-a-ph" id="a-read">
            Readouts
          </h2>
          <dl className="stu-a-dl">
            <div>
              <dt>Correct</dt>
              <dd>
                {mockExam.correct} of {mockExam.questions}
              </dd>
            </div>
            <div>
              <dt>Time taken</dt>
              <dd>{mockExam.minutes} min</dd>
            </div>
            <div>
              <dt>Per question</dt>
              <dd>about {min} s</dd>
            </div>
            <div>
              <dt>Retake on</dt>
              <dd>{dayLabel(mockExam.next)}</dd>
            </div>
          </dl>
        </section>
        <section className="stu-a-panel wide" aria-labelledby="a-parts">
          <h2 className="stu-a-ph" id="a-parts">
            By topic <span className="count">Illustrative split</span>
          </h2>
          <ul className="stu-a-parts">
            {examParts.map((p) => (
              <li key={p.name}>
                <span className="nm">{p.name}</span>
                <span className="bar" aria-hidden>
                  <i
                    className={partPct(p) < 70 ? 'attn' : undefined}
                    style={{ width: `${partPct(p)}%` }}
                  />
                </span>
                <span className="v">
                  {p.correct}/{p.questions}
                </span>
                {partPct(p) < 70 ? <Tag tone="attn">Review</Tag> : <Tag tone="done">Solid</Tag>}
              </li>
            ))}
          </ul>
        </section>
        <section className="stu-a-panel wide" aria-labelledby="a-miss">
          <h2 className="stu-a-ph" id="a-miss">
            Missed questions <span className="count">{examMissed.length} shown</span>
          </h2>
          <ul className="stu-a-missed">
            {examMissed.map((m) => (
              <li key={m.id}>
                <strong>{m.question}</strong>
                <span>
                  You chose: {m.yours}. Right answer: {m.right}.
                </span>
                <span>
                  {m.why} <em>{m.cite}</em>
                </span>
                {m.illustrative && <span className="stu-a-muted">Illustrative question.</span>}
              </li>
            ))}
          </ul>
          <button type="button" className="stu-a-btn primary" onClick={onReview}>
            Review weak topics <ArrowRight aria-hidden size={20} />
          </button>
        </section>
      </div>
    </>
  );
}

// ------------------------------------------------------------------- review

function ReviewScreen({
  review,
  onPractice,
}: {
  review: ReturnType<typeof useReview>;
  onPractice: () => void;
}) {
  const [filter, setFilter] = React.useState<'all' | 'spot' | 'missed'>('all');
  const shown = review.open.filter((i) => filter === 'all' || i.kind === filter);
  const filters = [
    ['all', 'All'],
    ['spot', 'Weak spots'],
    ['missed', 'Missed in practice'],
  ] as const;
  return (
    <>
      <div className="stu-a-head">
        <p className="stu-a-eyebrow">Review</p>
        <h1>Weak-topic review</h1>
        <p className="stu-a-sub">
          {review.open.length} open, {review.clearedCount} reviewed. Read each one, then mark it
          reviewed.
        </p>
      </div>
      <div className="stu-a-filters" role="group" aria-label="Filter review items">
        {filters.map(([id, label]) => (
          <button key={id} type="button" aria-pressed={filter === id} onClick={() => setFilter(id)}>
            {label}
          </button>
        ))}
      </div>
      {shown.length === 0 ? (
        <section className="stu-a-panel stu-a-empty" aria-live="polite">
          <CheckCircle2 aria-hidden size={36} />
          <h2>
            {review.open.length === 0
              ? 'No weak topics left'
              : filter === 'missed'
                ? 'Nothing missed in practice yet'
                : 'Nothing in this filter'}
          </h2>
          <p className="stu-a-muted">
            {review.open.length === 0
              ? 'You cleared the review list. Run a practice set to find the next soft spot.'
              : filter === 'missed'
                ? 'Miss a question in practice and it lands here. Run a set to see it work.'
                : 'Try another filter.'}
          </p>
          <div className="stu-a-actions">
            <button type="button" className="stu-a-btn primary" onClick={onPractice}>
              Choose a lesson to practice
            </button>
            {review.open.length === 0 && (
              <button type="button" className="stu-a-btn" onClick={review.restore}>
                <RotateCcw aria-hidden size={18} /> Restore the demo list
              </button>
            )}
          </div>
        </section>
      ) : (
        <ul className="stu-a-review">
          {shown.map((i) => (
            <li key={i.id} className="stu-a-panel">
              <p className="stu-a-eyebrow">
                {i.kind === 'missed' ? 'Missed in practice' : 'Weak spot'}
              </p>
              <h2>{i.title}</h2>
              {i.answer && (
                <p>
                  <strong>Answer:</strong> {i.answer}
                </p>
              )}
              <p>{i.note}</p>
              <p className="stu-a-note">
                {i.cite}
                {i.illustrative ? '. Illustrative note.' : ''}
              </p>
              <button type="button" className="stu-a-btn" onClick={() => review.clear(i.id)}>
                <CheckCircle2 aria-hidden size={18} /> Mark reviewed
              </button>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
