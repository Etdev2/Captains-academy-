import * as React from 'react';
import {
  Anchor,
  ArrowRight,
  CheckCircle2,
  CircleAlert,
  Flame,
  Lightbulb,
  MapPin,
  RotateCcw,
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
  hints,
  lessonsDone,
  lessonsFor,
  mockExam,
  nextLesson,
  partPct,
  studyTopics,
  topicById,
  usePractice,
  useReview,
} from './core';
import './c.css';

const SCREENS = ['today', 'topic', 'practice', 'results', 'review'] as const;
type Screen = (typeof SCREENS)[number];

function Mentor({ children }: { children: React.ReactNode }) {
  return (
    <div className="stu-c-mentor">
      <span className="av" aria-hidden>
        <Anchor size={22} />
      </span>
      <div>
        <p className="who">Your mentor</p>
        <p>{children}</p>
      </div>
    </div>
  );
}

export default function VariantC() {
  const [screen, go] = useScreen(SCREENS);
  const [topicId, setTopicId] = React.useState('rules');
  const practice = usePractice();
  const review = useReview(practice.missed);
  const topic = topicById(topicId);

  return (
    <div className="stu-c">
      <header className="stu-c-top">
        {screen !== 'today' ? (
          <button type="button" className="stu-c-back" onClick={() => go('today')}>
            <span aria-hidden>←</span> Today
          </button>
        ) : (
          <strong>Captain&apos;s Academy</strong>
        )}
        <span className="stu-c-pill">
          <Flame aria-hidden size={18} /> {studyStreakDays} days
        </span>
        <span className="stu-c-sample">Sample data</span>
      </header>
      <main className="stu-c-main">
        {screen === 'today' && <Today go={go} />}
        {screen === 'topic' && (
          <Route
            topicId={topicId}
            setTopicId={setTopicId}
            onPractice={() => {
              practice.restart();
              go('practice');
            }}
          />
        )}
        {screen === 'practice' && <Practice p={practice} go={go} topicName={topic.name} />}
        {screen === 'results' && <Results go={go} />}
        {screen === 'review' && <Review review={review} go={go} />}
      </main>
    </div>
  );
}

function Stations({ here }: { here: string }) {
  return (
    <ol className="stu-c-route" aria-label="Your route">
      {studyTopics.map((t) => (
        <li key={t.id} aria-current={t.id === here ? 'step' : undefined}>
          <span className="node" aria-hidden>
            {t.progress >= 100 ? (
              <CheckCircle2 size={18} />
            ) : t.id === here ? (
              <MapPin size={18} />
            ) : null}
          </span>
          <span className="nm">{t.name}</span>
          <span className="pc">{t.progress}%</span>
          {t.id === here && <span className="you">You are here</span>}
        </li>
      ))}
    </ol>
  );
}

function Today({ go }: { go: (s: Screen) => void }) {
  const steps = [
    { t: 'Warm up', d: '8 quick questions on Rule 3, vessel definitions', m: 6 },
    { t: 'Fix a weak spot', d: 'Lights of towing vessels (Rule 24)', m: 5 },
    {
      t: 'Look ahead',
      d: `Peek at lesson ${nextLesson.lesson.n}: ${nextLesson.lesson.title}`,
      m: 4,
    },
  ];
  return (
    <>
      <Mentor>
        Morning, Jordan. You have studied {studyStreakDays} days running. Your last mock exam was{' '}
        {mockExam.score}%. That is a start, and it shows where to look. Today is 15 minutes. I
        picked weak topics first.
      </Mentor>
      <section className="stu-c-card" aria-labelledby="c-today">
        <h1 id="c-today">Today&apos;s 15 minutes</h1>
        <ol className="stu-c-steps">
          {steps.map((s, i) => (
            <li key={s.t}>
              <span className="num" aria-hidden>
                {i + 1}
              </span>
              <span>
                <strong>{s.t}</strong>
                <span className="stu-c-muted block">{s.d}</span>
              </span>
              <span className="min">{s.m} min</span>
            </li>
          ))}
        </ol>
        <button type="button" className="stu-c-btn primary" onClick={() => go('practice')}>
          Start step 1 <ArrowRight aria-hidden size={22} />
        </button>
      </section>
      <section className="stu-c-card" aria-labelledby="c-route">
        <h2 id="c-route">Your route to the exam</h2>
        <Stations here="rules" />
        <p className="stu-c-muted">Module names and scores are illustrative.</p>
        <button type="button" className="stu-c-btn" onClick={() => go('topic')}>
          See the whole route
        </button>
      </section>
      <div className="stu-c-links">
        <button type="button" className="stu-c-link" onClick={() => go('results')}>
          Last mock exam, {mockExam.score}%: what happened
        </button>
        <button type="button" className="stu-c-link" onClick={() => go('review')}>
          Weak topics waiting for you
        </button>
      </div>
      <p className="stu-c-fine">Study time is separate from sea time and never counts toward it.</p>
    </>
  );
}

function Route({
  topicId,
  setTopicId,
  onPractice,
}: {
  topicId: string;
  setTopicId: (id: string) => void;
  onPractice: () => void;
}) {
  return (
    <>
      <Mentor>
        Pick a stop on the route. I will show its lessons and you can practice from there.
      </Mentor>
      <h1>Your learning path</h1>
      <ol className="stu-c-path">
        {studyTopics.map((t) => {
          const open = t.id === topicId;
          return (
            <li key={t.id} className={open ? 'open' : undefined}>
              <button
                type="button"
                className="stop"
                aria-expanded={open}
                onClick={() => setTopicId(t.id)}
              >
                <span className="nm">{t.name}</span>
                <span className="stu-c-muted">
                  {lessonsDone(t)} of {t.lessons} lessons
                </span>
                {t.weak ? (
                  <span className="stu-c-st attn">
                    <CircleAlert aria-hidden size={16} /> Weak topic
                  </span>
                ) : (
                  <span className="stu-c-st ok">
                    <CheckCircle2 aria-hidden size={16} /> On track
                  </span>
                )}
              </button>
              {open && (
                <div className="lessons">
                  <ol>
                    {lessonsFor(t).map((l) => (
                      <li key={l.n} className={l.done ? 'done' : undefined}>
                        <span className="dot" aria-hidden />
                        <span>
                          {l.n}. {l.title}
                        </span>
                        <span className="stu-c-muted">
                          {l.done
                            ? 'Done'
                            : l.n === nextLesson.lesson.n && t.id === 'rules'
                              ? 'Next'
                              : 'To do'}
                        </span>
                      </li>
                    ))}
                  </ol>
                  <button type="button" className="stu-c-btn primary" onClick={onPractice}>
                    Practice {t.name} <ArrowRight aria-hidden size={22} />
                  </button>
                  <p className="stu-c-muted">
                    Prototype: every topic opens the same 8 questions on Rule 3 vessel definitions.
                  </p>
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </>
  );
}

function Practice({
  p,
  go,
  topicName,
}: {
  p: ReturnType<typeof usePractice>;
  go: (s: Screen) => void;
  topicName: string;
}) {
  const [hintFor, setHintFor] = React.useState<number | null>(null);
  const hint = hintFor === p.index;
  const setHint = (f: (h: boolean) => boolean) => setHintFor(f(hint) ? p.index : null);

  if (p.finished) {
    return (
      <>
        <Mentor>
          {p.missed.length === 0
            ? 'Clean set. Good. A clean set on 8 questions is still only 8 questions, so keep going.'
            : `You got ${p.score} of ${p.total}. The ${p.missed.length} you missed are the useful part. We will go over them.`}
        </Mentor>
        <section className="stu-c-card" aria-labelledby="c-deb">
          <h1 id="c-deb">Session debrief</h1>
          <p className="stu-c-score">
            {p.score} of {p.total}
          </p>
          <p className="stu-c-muted">
            {topicName}, Rule 3 questions. Time {clock(p.elapsed)}.
          </p>
          {p.missed.length > 0 && (
            <>
              <h2>To fix</h2>
              <ul className="stu-c-miss">
                {p.missed.map((c) => (
                  <li key={c.id}>
                    <strong>{c.cue}</strong>
                    <span>
                      {categoryLabel(c.answer)}. {c.why}
                    </span>
                    <span className="stu-c-muted">{c.citation}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
          <h2>Tomorrow we will</h2>
          <ul className="stu-c-tomorrow">
            <li>
              {p.missed.length > 0
                ? 'Go back over what you missed today.'
                : 'Review one weak spot, Rule 15 crossing.'}
            </li>
            <li>
              Read lesson {nextLesson.lesson.n}: {nextLesson.lesson.title}.
            </li>
            <li>Try 8 new questions.</li>
          </ul>
          <p className="stu-c-fine">{NOT_EXAM_NOTE}</p>
          <button type="button" className="stu-c-btn primary" onClick={() => go('review')}>
            {p.missed.length > 0 ? 'Review what I missed' : 'See my weak topics'}{' '}
            <ArrowRight aria-hidden size={22} />
          </button>
          <button type="button" className="stu-c-btn" onClick={p.restart}>
            <RotateCcw aria-hidden size={18} /> Do the set again
          </button>
        </section>
      </>
    );
  }

  const answered = p.picked !== undefined;
  return (
    <>
      <ol className="stu-c-dots" aria-label={`Question ${p.index + 1} of ${p.total}`}>
        {p.cards.map((c, i) => (
          <li key={c.id} className={i < p.index ? 'past' : i === p.index ? 'now' : undefined} />
        ))}
      </ol>
      <p className="stu-c-count">
        Question {p.index + 1} of {p.total}
      </p>
      <section className="stu-c-card" aria-labelledby="c-q">
        <p className="stu-c-muted">{QUESTION_TEXT}</p>
        <h1 id="c-q">{p.card.cue}</h1>
        {!answered && (
          <>
            <button
              type="button"
              className="stu-c-hintbtn"
              aria-expanded={hint}
              onClick={() => setHint((h) => !h)}
            >
              <Lightbulb aria-hidden size={20} /> {hint ? 'Hide hint' : 'Need a hint?'}
            </button>
            {hint && <p className="stu-c-hint">{hints[p.card.id]}</p>}
          </>
        )}
        <div className="stu-c-opts" role="group" aria-label="Answers">
          {CATEGORIES.map((c) => {
            const right = answered && c.id === p.card.answer;
            const mine = answered && c.id === p.picked && !right;
            return (
              <button
                key={c.id}
                type="button"
                disabled={answered}
                className={right ? 'right' : mine ? 'wrong' : undefined}
                onClick={() => p.choose(c.id)}
              >
                <span>{c.label}</span>
                {right && (
                  <span className="tag">
                    <CheckCircle2 aria-hidden size={18} /> Right answer
                  </span>
                )}
                {mine && (
                  <span className="tag">
                    <CircleAlert aria-hidden size={18} /> Your answer
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </section>
      <div aria-live="polite">
        {answered && (
          <>
            <Mentor>
              {p.correct
                ? `Yes. ${p.card.why}`
                : `Not this time. It is ${categoryLabel(p.card.answer)}. ${p.card.why}`}
              <span className="stu-c-muted block">{p.card.citation}</span>
            </Mentor>
            <button type="button" className="stu-c-btn primary" onClick={p.next} autoFocus>
              {p.index + 1 === p.total ? 'Finish and debrief' : 'Next question'}{' '}
              <ArrowRight aria-hidden size={22} />
            </button>
          </>
        )}
      </div>
    </>
  );
}

function Results({ go }: { go: (s: Screen) => void }) {
  const parts = [...examParts].sort((a, b) => partPct(a) - partPct(b));
  return (
    <>
      <Mentor>
        Honest read: {mockExam.score}% is {mockExam.passMark - mockExam.score} points under the
        practice mark. Not where you want to be yet. Most of the lost points sit in two places, and
        both are fixable.
      </Mentor>
      <section className="stu-c-card" aria-labelledby="c-res">
        <h1 id="c-res">Your mock exam</h1>
        <p className="stu-c-score">{mockExam.score}%</p>
        <p className="stu-c-muted">
          {mockExam.correct} of {mockExam.questions} right, {mockExam.minutes} minutes,{' '}
          {dayLabel(mockExam.date)}.
        </p>
        <p className="stu-c-fine">
          {PASS_MARK_NOTE} {NOT_EXAM_NOTE}
        </p>
        <h2>Where the points went</h2>
        <p className="stu-c-fine">Weakest first. Split is illustrative.</p>
        <ul className="stu-c-parts">
          {parts.map((p) => (
            <li key={p.name}>
              <span>{p.name}</span>
              <span className="bar" aria-hidden>
                <i
                  className={partPct(p) < 70 ? 'attn' : undefined}
                  style={{ width: `${partPct(p)}%` }}
                />
              </span>
              <span>
                {p.correct} of {p.questions}{' '}
                {partPct(p) < 70 ? (
                  <b className="stu-c-st attn">
                    <CircleAlert aria-hidden size={16} /> Work on it
                  </b>
                ) : (
                  <b className="stu-c-st ok">
                    <CheckCircle2 aria-hidden size={16} /> Solid
                  </b>
                )}
              </span>
            </li>
          ))}
        </ul>
      </section>
      <section className="stu-c-card" aria-labelledby="c-mm">
        <h2 id="c-mm">Questions you missed</h2>
        <ul className="stu-c-miss">
          {examMissed.map((m) => (
            <li key={m.id}>
              <strong>{m.question}</strong>
              <span>
                You chose {m.yours}. It is {m.right}.
              </span>
              <span>{m.why}</span>
              <span className="stu-c-muted">
                {m.cite}
                {m.illustrative ? '. Illustrative question.' : ''}
              </span>
            </li>
          ))}
        </ul>
        <button type="button" className="stu-c-btn primary" onClick={() => go('review')}>
          Fix these in review <ArrowRight aria-hidden size={22} />
        </button>
      </section>
    </>
  );
}

function Review({ review, go }: { review: ReturnType<typeof useReview>; go: (s: Screen) => void }) {
  const item = review.open[0];
  if (!item) {
    return (
      <>
        <Mentor>
          That is the list cleared. Reviewing is the work that moves your score, so that counts.
        </Mentor>
        <section className="stu-c-card stu-c-empty" aria-live="polite" aria-labelledby="c-none">
          <CheckCircle2 aria-hidden size={40} />
          <h1 id="c-none">No weak topics left</h1>
          <h2>Tomorrow we will</h2>
          <ul className="stu-c-tomorrow">
            <li>
              Read lesson {nextLesson.lesson.n}: {nextLesson.lesson.title}.
            </li>
            <li>Run a new practice set to find the next soft spot.</li>
            <li>Retake the mock exam on {dayLabel(mockExam.next)}.</li>
          </ul>
          <button type="button" className="stu-c-btn primary" onClick={() => go('practice')}>
            Start a practice set <ArrowRight aria-hidden size={22} />
          </button>
          <button type="button" className="stu-c-btn" onClick={review.restore}>
            <RotateCcw aria-hidden size={18} /> Restore the demo list
          </button>
        </section>
      </>
    );
  }
  return (
    <>
      <Mentor>
        One at a time. Read it, say it out loud, then tell me if you have it. {review.open.length}{' '}
        left, {review.clearedCount} done.
      </Mentor>
      <section className="stu-c-card" aria-labelledby="c-rv">
        <p className="stu-c-count">{item.kind === 'missed' ? 'Missed in practice' : 'Weak spot'}</p>
        <h1 id="c-rv">{item.title}</h1>
        {item.answer && (
          <p>
            <strong>Answer: {item.answer}</strong>
          </p>
        )}
        <p className="stu-c-read">{item.note}</p>
        <p className="stu-c-fine">
          {item.cite}
          {item.illustrative ? '. Illustrative note.' : ''}
        </p>
        <button type="button" className="stu-c-btn primary" onClick={() => review.clear(item.id)}>
          <CheckCircle2 aria-hidden size={22} /> I have it
        </button>
        <button
          type="button"
          className="stu-c-btn"
          onClick={() => review.defer(item.id)}
          disabled={review.open.length < 2}
        >
          Keep it for tomorrow
        </button>
      </section>
    </>
  );
}
