# Assignment records: interactive prototypes

Five builder lanes under one lead, in the format from `docs/team/AI-OPERATING-SYSTEM.md`. The lanes share the lead's branch and worktree but write disjoint folders, so they run in parallel without touching each other's files. The lead alone commits.

No prompt-to-agent skill is installed in this repository or session, so these records follow the repository's own assignment format and [`BRIEF.md`](BRIEF.md).

```text
INITIATIVE: Categorized interactive prototypes for the Decision Desk
COORDINATOR: Tiller Davit (lead builder, Claude), session_01L5z59xXRERDDjZ3hDWdmqH
RUNTIME: CLAUDE
ROLE: ux-ui
MODEL TIER: MEDIUM
BRANCH: claude/categorized-prototypes (shared; the lead commits)
WORKTREE: /home/user/Captains-academy- (shared; exclusive folder)
ALLOWED WRITES: src/prototypes/live/console/** and agent-resources/timecards/2026-10-26-*-bridge-davit.md
DEPENDENCIES: the shell, contract and sample data in src/prototypes/live/ (done)
STATUS: ACTIVE
SOURCE / CONSTRAINTS: docs/prototypes/interactive/BRIEF.md; dev server port 5181
TASK / EXPECTED ARTIFACT: Captain's Console, variants A Night Bridge, B Clean & Light, C Guided Mentor. Home dashboard: current credentials and target license, overall progress and the next useful action, upcoming tasks and deadlines, and clear navigation to forms, sea time, study and arcade.
DONE CRITERIA: three structurally different variants and their journey screens; prettier, eslint and tsc clean for the folder; every screen checked in a browser at 390x844 and 1440x900 with no console errors or horizontal scroll
```

```text
INITIATIVE: Categorized interactive prototypes for the Decision Desk
COORDINATOR: Tiller Davit (lead builder, Claude), session_01L5z59xXRERDDjZ3hDWdmqH
RUNTIME: CLAUDE
ROLE: ux-ui
MODEL TIER: MEDIUM
BRANCH: claude/categorized-prototypes (shared; the lead commits)
WORKTREE: /home/user/Captains-academy- (shared; exclusive folder)
ALLOWED WRITES: src/prototypes/live/license/** and agent-resources/timecards/2026-10-26-*-pilot-davit.md
DEPENDENCIES: the shell, contract and sample data in src/prototypes/live/ (done)
STATUS: ACTIVE
SOURCE / CONSTRAINTS: docs/prototypes/interactive/BRIEF.md; dev server port 5182
TASK / EXPECTED ARTIFACT: License Navigator & Forms, variants A Night Bridge, B Clean & Light, C Guided Mentor. Personal licensing workspace: choose a target license or upgrade, see held credentials and missing requirements, explore forms, documents, courses and sea time, and review CG-719B with missing-field feedback and application status. A first-time applicant must understand it.
DONE CRITERIA: three structurally different variants and their journey screens; prettier, eslint and tsc clean for the folder; every screen checked in a browser at 390x844 and 1440x900 with no console errors or horizontal scroll
```

```text
INITIATIVE: Categorized interactive prototypes for the Decision Desk
COORDINATOR: Tiller Davit (lead builder, Claude), session_01L5z59xXRERDDjZ3hDWdmqH
RUNTIME: CLAUDE
ROLE: ux-ui
MODEL TIER: MEDIUM
BRANCH: claude/categorized-prototypes (shared; the lead commits)
WORKTREE: /home/user/Captains-academy- (shared; exclusive folder)
ALLOWED WRITES: src/prototypes/live/sea-time/** and agent-resources/timecards/2026-10-26-*-logline-davit.md
DEPENDENCIES: the shell, contract and sample data in src/prototypes/live/ (done)
STATUS: ACTIVE
SOURCE / CONSTRAINTS: docs/prototypes/interactive/BRIEF.md; dev server port 5183
TASK / EXPECTED ARTIFACT: Sea-Time Logbook, variants A Night Bridge, B Clean & Light, C Guided Mentor. Trip and vessel entry, trip history and sea-time summary, progress toward OUPV near coastal, signature and review status, and an export preview, keeping recorded time visibly apart from time that appears to qualify and time a vessel owner has signed for.
DONE CRITERIA: three structurally different variants and their journey screens; prettier, eslint and tsc clean for the folder; every screen checked in a browser at 390x844 and 1440x900 with no console errors or horizontal scroll
```

```text
INITIATIVE: Categorized interactive prototypes for the Decision Desk
COORDINATOR: Tiller Davit (lead builder, Claude), session_01L5z59xXRERDDjZ3hDWdmqH
RUNTIME: CLAUDE
ROLE: ux-ui
MODEL TIER: MEDIUM
BRANCH: claude/categorized-prototypes (shared; the lead commits)
WORKTREE: /home/user/Captains-academy- (shared; exclusive folder)
ALLOWED WRITES: src/prototypes/live/study/** and agent-resources/timecards/2026-10-26-*-almanac-davit.md
DEPENDENCIES: the shell, contract and sample data in src/prototypes/live/ (done)
STATUS: ACTIVE
SOURCE / CONSTRAINTS: docs/prototypes/interactive/BRIEF.md; dev server port 5184
TASK / EXPECTED ARTIFACT: Study & Exam Prep, variants A Night Bridge, B Clean & Light, C Guided Mentor. Study dashboard and learning path, lesson and topic selection, practice questions with answer explanations, mock-exam results and weak-topic review.
DONE CRITERIA: three structurally different variants and their journey screens; prettier, eslint and tsc clean for the folder; every screen checked in a browser at 390x844 and 1440x900 with no console errors or horizontal scroll
```

```text
INITIATIVE: Categorized interactive prototypes for the Decision Desk
COORDINATOR: Tiller Davit (lead builder, Claude), session_01L5z59xXRERDDjZ3hDWdmqH
RUNTIME: CLAUDE
ROLE: ux-ui
MODEL TIER: MEDIUM
BRANCH: claude/categorized-prototypes (shared; the lead commits)
WORKTREE: /home/user/Captains-academy- (shared; exclusive folder)
ALLOWED WRITES: src/prototypes/live/arcade/** and agent-resources/timecards/2026-10-26-*-wake-davit.md
DEPENDENCIES: the shell, contract and sample data in src/prototypes/live/ (done)
STATUS: ACTIVE
SOURCE / CONSTRAINTS: docs/prototypes/interactive/BRIEF.md; dev server port 5185
TASK / EXPECTED ARTIFACT: Arcade & Simulations, variants A Night Bridge, B Clean & Light, C Guided Mentor. Challenge selection, a docking challenge, a navigation or rules scenario, with briefing, controls, feedback and results. A UX prototype, not a simulator.
DONE CRITERIA: three structurally different variants and their journey screens; prettier, eslint and tsc clean for the folder; every screen checked in a browser at 390x844 and 1440x900 with no console errors or horizontal scroll
```
