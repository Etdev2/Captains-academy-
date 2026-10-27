import * as React from 'react';
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  CircleAlert,
  ClipboardCheck,
  Flame,
  LayoutList,
  ListChecks,
  RotateCcw,
} from 'lucide-react';
import { DEFINITIONS } from '../../../sim/chapter1/definitions';
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
  type Category,
  type StudyTopic,
} from './core';
import './b.css';

const SCREENS = ['dashboard', 'topic', 'practice', 'results', 'review'] as const;
type Screen = (typeof SCREENS)[number];

const SECTIONS: { id: Screen; label: string; Icon: typeof BookOpen }[] = [
  { id: 'dashboard', label: 'Course overview', Icon: LayoutList },
  { id: 'practice', label: 'Practice questions', Icon: BookOpen },
  { id: 'results', label: 'Mock exam report', Icon: ClipboardCheck },
  { id: 'review', label: 'Weak topics', Icon: ListChecks },
];

function Status({ ok, children }: { ok: boolean; children: React.ReactNode }) {
  const Icon = ok ? CheckCircle2 : CircleAlert;
  return (
    <span className={`stu-b-status ${ok ? 'ok' : 'attn'}`}>
      <Icon aria-hidden size={16} /> {children}
    </span>
  );
}

export default function VariantB() {
  const [screen, go] = useScreen(SCREENS);
  const [topicId, setTopicId] = React.useState('rules');
  const [lessonN, setLessonN] = React.useState<number>(nextLesson.lesson.n);
  const practice = usePractice();
  const review = useReview(practice.missed);
  const topic = topicById(topicId);

  const openLesson = (t: StudyTopic, n: number) => {
    setTopicId(t.id);
    setLessonN(n);
    go('topic');
  };

  const syllabus = (
    <div className="stu-b-syl">
      <ul className="stu-b-secs">
        {SECTIONS.map(({ id, label, Icon }) => (
          <li key={id}>
            <button
              type="button"
              aria-current={screen === id ? 'page' : undefined}
              onClick={() => go(id)}
            >
              <Icon aria-hidden size={20} /> {label}
            </button>
          </li>
        ))}
      </ul>
      <h2>Modules</h2>
      {studyTopics.map((t) => (
        <details key={t.id} open={screen === 'topic' && t.id === topicId}>
          <summary>
            <span>{t.name}</span>
            <span className="stu-b-muted">
              {lessonsDone(t)}/{t.lessons}
            </span>
          </summary>
          <ol>
            {lessonsFor(t).map((l) => (
              <li key={l.n}>
                <button
                  type="button"
                  aria-current={
                    screen === 'topic' && topicId === t.id && lessonN === l.n ? 'page' : undefined
                  }
                  onClick={() => openLesson(t, l.n)}
                >
                  <span className="n">{l.n}</span>
                  <span>{l.title}</span>
                  {l.done && <CheckCircle2 aria-label="Done" size={18} className="done" />}
                </button>
              </li>
            ))}
          </ol>
        </details>
      ))}
    </div>
  );

  return (
    <div className="stu-b">
      <header className="stu-b-top">
        <strong>Captain&apos;s Academy · Study</strong>
        <span className="stu-b-streak">
          <Flame aria-hidden size={18} /> {studyStreakDays}-day streak
        </span>
        <span className="stu-b-sample">Sample data</span>
      </header>
      <div className="stu-b-layout">
        <aside className="stu-b-side" aria-label="Syllabus">
          {syllabus}
        </aside>
        <details className="stu-b-mobile">
          <summary>Syllabus and sections</summary>
          {syllabus}
        </details>
        <main className="stu-b-main">
          {screen === 'dashboard' && (
            <Overview
              onOpen={(t) => openLesson(t, firstOpenLesson(t))}
              onNext={() => openLesson(nextLesson.topic, nextLesson.lesson.n)}
              go={go}
            />
          )}
          {screen === 'topic' && (
            <Lesson
              topic={topic}
              n={lessonN}
              onStart={() => {
                practice.restart();
                go('practice');
              }}
            />
          )}
          {screen === 'practice' && <Practice p={practice} go={go} />}
          {screen === 'results' && <Report go={go} />}
          {screen === 'review' && <Weak review={review} go={go} />}
        </main>
      </div>
    </div>
  );
}

function Overview({
  onOpen,
  onNext,
  go,
}: {
  onOpen: (t: StudyTopic) => void;
  onNext: () => void;
  go: (s: Screen) => void;
}) {
  return (
    <>
      <p className="stu-b-kicker">Course overview</p>
      <h1>OUPV exam preparation</h1>
      <p className="stu-b-lead">
        Four modules. Module names and scores are illustrative. Finish lessons in order, then check
        yourself with practice questions.
      </p>
      <section className="stu-b-card stu-b-next" aria-labelledby="b-next">
        <h2 id="b-next">Continue where you stopped</h2>
        <p className="stu-b-big">
          Rules of the Road, lesson {nextLesson.lesson.n}: {nextLesson.lesson.title}
        </p>
        <p className="stu-b-muted">
          About 20 minutes. Your last mock exam lost points on towing lights.
        </p>
        <button type="button" className="stu-b-btn primary" onClick={onNext}>
          Continue lesson {nextLesson.lesson.n} <ArrowRight aria-hidden size={20} />
        </button>
      </section>
      <h2 className="stu-b-h2">Modules</h2>
      <ul className="stu-b-catalog">
        {studyTopics.map((t) => (
          <li key={t.id} className="stu-b-card">
            <h3>{t.name}</h3>
            <p className="stu-b-muted">
              {lessonsDone(t)} of {t.lessons} lessons · last practice {t.score}%
            </p>
            <div
              className="stu-b-bar"
              role="img"
              aria-label={`${t.progress} percent of lessons done`}
            >
              <i style={{ width: `${t.progress}%` }} />
            </div>
            <Status ok={!t.weak}>{t.weak ? 'Weak topic' : 'On track'}</Status>
            <button type="button" className="stu-b-btn" onClick={() => onOpen(t)}>
              Open module
            </button>
          </li>
        ))}
      </ul>
      <section className="stu-b-card" aria-labelledby="b-last">
        <h2 id="b-last">Last mock exam</h2>
        <p>
          <strong>{mockExam.score}%</strong> on {dayLabel(mockExam.date)}, {mockExam.module}.
          Practice mark {mockExam.passMark}% (illustrative). Next try {dayLabel(mockExam.next)}.
        </p>
        <button type="button" className="stu-b-btn" onClick={() => go('results')}>
          Open the report
        </button>
      </section>
    </>
  );
}

function Lesson({ topic, n, onStart }: { topic: StudyTopic; n: number; onStart: () => void }) {
  const lessons = lessonsFor(topic);
  const l = lessonByNumber(topic, n);
  const defs = DEFINITIONS.slice(0, 8);
  return (
    <article>
      <p className="stu-b-kicker">
        {topic.name} · lesson {l.n} of {lessons.length}
      </p>
      <h1>{l.title}</h1>
      <p className="stu-b-lead">
        {l.done ? 'You finished this lesson. Read it again any time.' : 'Not finished yet.'}
      </p>
      {l.checked ? (
        <>
          <p>
            Every vessel falls under one Rule 3 term. The term decides which rules apply to her.
            Read the examples, then answer the practice questions.
          </p>
          <table className="stu-b-table">
            <caption>Examples from the checked Rule 3 deck</caption>
            <thead>
              <tr>
                <th scope="col">What you see</th>
                <th scope="col">Rule 3 term</th>
                <th scope="col">Citation</th>
              </tr>
            </thead>
            <tbody>
              {defs.map((d) => (
                <tr key={d.id}>
                  <td>{d.cue}</td>
                  <td>{categoryLabel(d.answer)}</td>
                  <td>{d.citation}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      ) : (
        <p className="stu-b-muted">
          The reading text for this lesson is not in the prototype. The page would hold the lesson,
          its diagrams and its citations.
        </p>
      )}
      <button type="button" className="stu-b-btn primary" onClick={onStart}>
        Start practice questions <ArrowRight aria-hidden size={20} />
      </button>
      <p className="stu-b-muted">
        Prototype: every lesson opens the same 8 questions on Rule 3 vessel definitions.
      </p>
    </article>
  );
}

function Practice({ p, go }: { p: ReturnType<typeof usePractice>; go: (s: Screen) => void }) {
  const [selected, setSelected] = React.useState<{ i: number; c: Category } | null>(null);
  const sel = selected?.i === p.index ? selected.c : null;
  const setSel = (c: Category) => setSelected({ i: p.index, c });
  if (p.finished) {
    return (
      <article>
        <p className="stu-b-kicker">Practice questions</p>
        <h1>
          {p.score} of {p.total} correct
        </h1>
        <p className="stu-b-lead">
          Time {clock(p.elapsed)}. {NOT_EXAM_NOTE}
        </p>
        {p.missed.length > 0 ? (
          <>
            <h2 className="stu-b-h2">Questions to look at again</h2>
            <table className="stu-b-table">
              <thead>
                <tr>
                  <th scope="col">Question</th>
                  <th scope="col">Right answer</th>
                  <th scope="col">Why</th>
                </tr>
              </thead>
              <tbody>
                {p.missed.map((c) => (
                  <tr key={c.id}>
                    <td>{c.cue}</td>
                    <td>{categoryLabel(c.answer)}</td>
                    <td>
                      {c.why} <span className="stu-b-muted">{c.citation}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        ) : (
          <p>No misses in this set.</p>
        )}
        <div className="stu-b-row">
          <button type="button" className="stu-b-btn primary" onClick={() => go('review')}>
            Open weak topics <ArrowRight aria-hidden size={20} />
          </button>
          <button type="button" className="stu-b-btn" onClick={p.restart}>
            <RotateCcw aria-hidden size={18} /> Try the set again
          </button>
        </div>
      </article>
    );
  }
  const answered = p.picked !== undefined;
  return (
    <div className="stu-b-qwrap">
      <ol className="stu-b-qlist" aria-label="Questions">
        {p.cards.map((c, i) => (
          <li key={c.id} aria-current={i === p.index ? 'step' : undefined}>
            <span className="n">{i + 1}</span>
            {i < p.index ? 'Answered' : i === p.index ? 'Now' : 'To do'}
          </li>
        ))}
      </ol>
      <form
        className="stu-b-q"
        onSubmit={(e) => {
          e.preventDefault();
          if (!answered && sel) p.choose(sel);
        }}
      >
        <p className="stu-b-kicker">
          Question {p.index + 1} of {p.total} · Rule 3 vessel definitions
        </p>
        <h1>{p.card.cue}</h1>
        <fieldset disabled={answered}>
          <legend>{QUESTION_TEXT}</legend>
          {CATEGORIES.map((c) => {
            const right = answered && c.id === p.card.answer;
            const mine = answered && c.id === p.picked && !right;
            return (
              <label key={c.id} className={right ? 'right' : mine ? 'wrong' : undefined}>
                <input
                  type="radio"
                  name="b-answer"
                  value={c.id}
                  checked={(answered ? p.picked : sel) === c.id}
                  onChange={() => setSel(c.id)}
                />
                <span>{c.label}</span>
                {right && (
                  <span className="stu-b-status ok">
                    <CheckCircle2 aria-hidden size={16} /> Right answer
                  </span>
                )}
                {mine && (
                  <span className="stu-b-status attn">
                    <CircleAlert aria-hidden size={16} /> Your answer
                  </span>
                )}
              </label>
            );
          })}
        </fieldset>
        {!answered && (
          <button type="submit" className="stu-b-btn primary" disabled={!sel}>
            Check answer
          </button>
        )}
        <div aria-live="polite">
          {answered && (
            <div className={`stu-b-fb ${p.correct ? 'ok' : 'attn'}`}>
              <h2>
                {p.correct ? (
                  <CheckCircle2 aria-hidden size={22} />
                ) : (
                  <CircleAlert aria-hidden size={22} />
                )}{' '}
                {p.correct
                  ? 'Correct'
                  : `Not quite. The answer is ${categoryLabel(p.card.answer)}.`}
              </h2>
              <p>{p.card.why}</p>
              <p className="stu-b-muted">{p.card.citation}</p>
              <button type="button" className="stu-b-btn primary" onClick={p.next} autoFocus>
                {p.index + 1 === p.total ? 'See score' : 'Next question'}{' '}
                <ArrowRight aria-hidden size={20} />
              </button>
            </div>
          )}
        </div>
        {!answered && !sel && <p className="stu-b-muted">Choose one answer, then check it.</p>}
      </form>
    </div>
  );
}

function Report({ go }: { go: (s: Screen) => void }) {
  return (
    <article>
      <p className="stu-b-kicker">Mock exam report · {dayLabel(mockExam.date)}</p>
      <h1>
        {mockExam.score}% on the {mockExam.module} mock exam
      </h1>
      <p className="stu-b-lead">
        {mockExam.correct} of {mockExam.questions} correct in {mockExam.minutes} minutes.{' '}
        {PASS_MARK_NOTE} {NOT_EXAM_NOTE}
      </p>
      <Status ok={false}>
        {mockExam.passMark - mockExam.score} points under the practice mark
      </Status>
      <h2 className="stu-b-h2">By topic (illustrative split)</h2>
      <table className="stu-b-table">
        <thead>
          <tr>
            <th scope="col">Topic</th>
            <th scope="col">Correct</th>
            <th scope="col">Share</th>
            <th scope="col">Status</th>
          </tr>
        </thead>
        <tbody>
          {examParts.map((p) => (
            <tr key={p.name}>
              <th scope="row">{p.name}</th>
              <td>
                {p.correct} of {p.questions}
              </td>
              <td>{partPct(p)}%</td>
              <td>
                <Status ok={partPct(p) >= 70}>{partPct(p) >= 70 ? 'Solid' : 'Review'}</Status>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <h2 className="stu-b-h2">Missed questions ({examMissed.length} shown)</h2>
      <ol className="stu-b-missed">
        {examMissed.map((m) => (
          <li key={m.id} className="stu-b-card">
            <h3>{m.question}</h3>
            <p>
              You chose <strong>{m.yours}</strong>. Right answer: <strong>{m.right}</strong>.
            </p>
            <p>{m.why}</p>
            <p className="stu-b-muted">
              {m.cite}
              {m.illustrative ? '. Illustrative question.' : ''}
            </p>
          </li>
        ))}
      </ol>
      <button type="button" className="stu-b-btn primary" onClick={() => go('review')}>
        Review weak topics <ArrowRight aria-hidden size={20} />
      </button>
    </article>
  );
}

function Weak({ review, go }: { review: ReturnType<typeof useReview>; go: (s: Screen) => void }) {
  const [filter, setFilter] = React.useState<'all' | 'spot' | 'missed'>('all');
  const shown = review.open.filter((i) => filter === 'all' || i.kind === filter);
  return (
    <article>
      <p className="stu-b-kicker">Weak topics</p>
      <h1>Weak-topic review</h1>
      <p className="stu-b-lead">
        {review.open.length} open, {review.clearedCount} reviewed.
      </p>
      <div className="stu-b-row" role="group" aria-label="Show">
        {(
          [
            ['all', 'All'],
            ['spot', 'Weak spots'],
            ['missed', 'Missed in practice'],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            className="stu-b-chip"
            aria-pressed={filter === id}
            onClick={() => setFilter(id)}
          >
            {label}
          </button>
        ))}
      </div>
      {shown.length === 0 ? (
        <div className="stu-b-empty" aria-live="polite">
          <CheckCircle2 aria-hidden size={32} />
          <h2>
            {review.open.length === 0
              ? 'No weak topics left'
              : filter === 'missed'
                ? 'Nothing missed in practice yet'
                : 'Nothing here'}
          </h2>
          <p>
            {review.open.length === 0
              ? 'The review list is clear. Practice questions will show the next soft spot.'
              : 'Finish a practice set. Any question you miss is listed here with its explanation.'}
          </p>
          <div className="stu-b-row">
            <button type="button" className="stu-b-btn primary" onClick={() => go('practice')}>
              Go to practice questions
            </button>
            {review.open.length === 0 && (
              <button type="button" className="stu-b-btn" onClick={review.restore}>
                <RotateCcw aria-hidden size={18} /> Restore the demo list
              </button>
            )}
          </div>
        </div>
      ) : (
        <table className="stu-b-table stu-b-stack">
          <thead>
            <tr>
              <th scope="col">Item</th>
              <th scope="col">What to remember</th>
              <th scope="col">Action</th>
            </tr>
          </thead>
          <tbody>
            {shown.map((i) => (
              <tr key={i.id}>
                <th scope="row">
                  {i.title}
                  <span className="stu-b-muted block">
                    {i.kind === 'missed' ? 'Missed in practice' : 'Weak spot'}
                  </span>
                </th>
                <td>
                  {i.answer && (
                    <>
                      <strong>{i.answer}.</strong>{' '}
                    </>
                  )}
                  {i.note}
                  <span className="stu-b-muted block">
                    {i.cite}
                    {i.illustrative ? '. Illustrative note.' : ''}
                  </span>
                </td>
                <td>
                  <button type="button" className="stu-b-btn" onClick={() => review.clear(i.id)}>
                    <CheckCircle2 aria-hidden size={18} /> Mark reviewed
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </article>
  );
}
