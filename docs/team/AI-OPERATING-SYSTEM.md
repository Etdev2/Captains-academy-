# AI Development Operating System

This is the routing and responsibility policy for Claude Code, Codex, and any human
operating this project's named team. Product-specific authority stays with the
existing roles; this document decides who should do a task, with how much reasoning,
and under what Git and context boundaries. Sweet Potato's rules still apply: Et marks
tickets ready, names builders and merges.

## Prime directive

Use the lowest-capability agent that can reliably finish the task.

The normal escalation ladder is LOW -> MEDIUM -> HIGH. Do not begin at HIGH unless the
task is architectural, security/privacy/legal sensitive, high-stakes math or
regulation, or a difficult root-cause problem that clearly benefits from deeper reasoning.

HIGH agents normally decide or plan. MEDIUM agents implement. LOW agents search,
transform, verify straightforward behavior, diagram approved decisions, and integrate
mechanically. Do not spend premium reasoning on a decision that has already been made.

## Platform mapping

| Tier | Claude Code default | Codex default | Use for |
|---|---|---|---|
| LOW | Haiku, low effort | GPT-5.6 Luna, low reasoning | Narrow, deterministic, repeatable work |
| MEDIUM | Sonnet, medium effort | GPT-5.6 Terra, medium reasoning | Ordinary implementation and bounded judgment |
| HIGH | Opus, high effort | GPT-5.6, high reasoning | Architecture, hard arbitration, high-stakes or failed MEDIUM work |

These are defaults, not prestige levels. An agent returns `ESCALATION_REQUIRED` with the
specific ambiguity or failure when its assigned tier is no longer adequate. The parent
may relaunch the same responsibility at a higher tier or route it to the named owner.

## One team, multiple runtimes

`ceo`, `coo`, `architect`, and every other name in this document identify an employee
role, not a model vendor. The currently configured adapters are:

- Claude Code: `.claude/agents/<role>.md`
- ChatGPT/Codex: `.codex/agents/<role>.toml`

The active runtime supplies the implementation of the role. A Claude COO normally spawns
Claude specialists; a Codex COO normally spawns Codex specialists. User platform choices
are authoritative.

Other vendors use the same contract: add a vendor-native adapter for each needed role,
map LOW/MEDIUM/HIGH to that vendor's cheapest adequate model and effort settings, and
keep the canonical responsibility unchanged. Never put a vendor-specific model name in
the role's authority or create `claude-architect` and `codex-architect` as separate jobs.

| Requested mode | COO behavior |
|---|---|
| Claude only | Use Claude adapters and models only. Do not invoke Codex. |
| ChatGPT/Codex only | Use Codex adapters and models only. Do not invoke Claude. |
| Either / no preference | Stay on the current runtime unless switching has a clear benefit. |
| Claude and Codex | Split only independent workstreams, name the runtime for each, and synthesize once. |
| Another vendor | Use its native adapter if configured; otherwise create `AWAITING_<RUNTIME>` handoff. |

Native subagent spawning stays inside the active product. Do not claim that a Claude
subagent is a Codex agent, or that Codex directly launched Claude. When the other runtime
is requested but no explicit bridge/tool is configured, create a bounded repository
handoff, mark it `AWAITING_<RUNTIME>`, and tell the user that the other runtime still has
to be launched. The receiving COO continues from the artifact instead of rereading the
originating conversation.

Mixed mode is load balancing, not duplicate review. Never give Claude and Codex the same
task merely to compare answers unless the user explicitly requests independent opinions.

## One coordinator, separate lanes

Every initiative has exactly one active coordinating COO, regardless of how many
runtimes participate. That COO owns assignments, dependencies, sequencing, and status.
It does not take over specialist decisions: `architect` owns structural decisions and
`git-integrator` owns integration. A receiving runtime follows the recorded assignment;
it does not create a second plan or a competing COO for the same initiative.

Each write assignment has one runtime, one role, one branch, one worktree, and an
exclusive allowed-write set. Two agents may inspect the same paths, but their write sets
must not overlap while both assignments are active. Helpers that contribute to the same
write lane work sequentially under its owner; they do not create an independent branch
or edit concurrently.

Lane rules apply equally to Claude, Codex/ChatGPT, and future vendor adapters:

- Work only on the assigned branch, in the assigned worktree, and within `ALLOWED WRITES`.
- Do not stage, commit, revert, restore, move, or delete another lane's changes.
- Treat unrecognized modifications in an allowed path as foreign work. Stop touching
  that path and notify the coordinating COO with the path and observed state.
- Never preserve, push, or "help finish" another runtime's in-progress work unless the
  coordinating COO explicitly transfers ownership after the original lane stops.
- Share discoveries freely through read-only inspection and bounded repository handoffs.
  A handoff transfers information, not write ownership.
- Only `git-integrator` crosses completed lanes to prepare ordered integration. It may
  resolve mechanical conflicts; structural conflicts return to `architect`, and behavioral
  conflicts return to the implementing owner.

When no real cross-runtime bridge exists, `AWAITING_<RUNTIME>` is a status, not a claim
that the vendor was launched. The user or external automation must start that runtime.

## Spawn decision

Before spawning, answer:

1. Is the task bounded and independently verifiable?
2. Will separate context or real parallelism save more than the extra agent consumes?
3. Which named role owns the decision?
4. What is the lowest tier likely to succeed?
5. Is the task read-only, a single write workstream, or a parallel write workstream?
6. What is the minimum context and exact artifact the child needs?

Do not spawn for a tiny task the parent can finish immediately. Do not make two agents
derive the same answer. Parallelize read-heavy exploration, review specialties, or
independent files; keep coupled edits sequential.

## Assignment and handoff record

The coordinating COO creates one compact record per assignment. Use `NONE (read-only)`
for branch, worktree, and allowed writes when no mutation is authorized.

```text
INITIATIVE:
COORDINATOR: <coo runtime/session or durable channel artifact>
RUNTIME: CLAUDE | CODEX | <OTHER>
ROLE:
MODEL TIER: LOW | MEDIUM | HIGH
BRANCH:
WORKTREE:
ALLOWED WRITES:
DEPENDENCIES:
STATUS: ASSIGNED | ACTIVE | BLOCKED | AWAITING_<RUNTIME> | READY_FOR_INTEGRATION | COMPLETE
SOURCE / CONSTRAINTS:
TASK / EXPECTED ARTIFACT:
DONE CRITERIA:
```

`COORDINATOR` remains the same across runtime handoffs for the initiative. A transfer of
write ownership must update the record, stop the prior writer, and identify the new lane
before edits resume. Do not forward the parent's full conversation. Durable decisions
belong in the relevant spec, ADR, plan, channel message, or worklog file. Search first,
read targeted sections second, reason third.

## Role matrix

| Agent | Responsibility | Tier | Reasoning | Git access | Worktree | Escalates to |
|---|---|---:|---|---|---|---|
| `ceo` | Product scope and priority arbitration | MEDIUM | Medium | Product docs; commit assigned branch; never merge | Conditional for concurrent doc writes | Et for unresolved product choice |
| `coo` | Sequencing, delegation, dependencies, backlog | MEDIUM | Medium | Team ops docs; commit assigned branch; never merge | Conditional for concurrent doc writes | `ceo` for scope; `architect` for structural dependency |
| `architect` | System boundaries, schema, data flow, ADRs | HIGH | High | Architecture docs and assigned schema artifacts; commit; never merge | Required for parallel writes | `ceo` for product constraint; specialist owner for domain risk |
| `ux-ui` | Front-end UX, accessibility, interaction implementation | MEDIUM | Medium | Front-end/design files; commit; never merge | Required for parallel code writes | `architect` for data/structure; `ceo` for scope |
| `head-dev` | Planned implementation, debugging, build/CI ownership | MEDIUM | Medium | Application/config code; commit; never merge | Required for parallel code writes | HIGH debugging pass; `architect` for cross-cutting design |
| `uscg-regs` | Coast Guard sea-time and license rules, checked against 46 CFR | HIGH | High | `docs/regs/` and assigned rule tables/tests; commit; never merge | Required for parallel writes | `counsel` for legal wording; `ceo` for claims; `architect` for engine structure |
| `cfo` | Infrastructure/vendor/token cost | MEDIUM | Medium | Finance docs only; commit; never merge | Conditional for concurrent doc writes | `ceo` for spend/scope decision |
| `counsel` | Privacy, terms, licensing risk; not legal advice | HIGH | High | Legal docs only; commit; never merge | Conditional for concurrent doc writes | Licensed attorney and `ceo` |
| `diagram-agent` | Render approved designs as Mermaid diagrams | LOW | Low | Diagram/docs paths only; commit if assigned; never merge | No, unless it is an independent parallel write stream | `architect` with `ARCHITECTURE_CLARIFICATION_REQUIRED` |
| `repo-scout` | Locate files, symbols, dependencies, tests | LOW | Low | Read-only; no commits | No | Requesting parent or owning specialist |
| `test-agent` | Write/run bounded tests and report failures | LOW | Low | Tests and approved test config only; commit; never merge | Required when writing tests in parallel | `head-dev`; MEDIUM for complex behavioral tests |
| `code-reviewer` | Evidence-backed correctness/security/test review | MEDIUM | Medium | Read-only; no commits | No | `head-dev`, `architect`, or `counsel` by finding type |
| `git-integrator` | Branch/worktree status, merge order, integration readiness | LOW | Low | Git operations and mechanical conflict edits; never merges to `main` (Et merges) | No; operates from the integration worktree | MEDIUM for complex mechanics; owner for semantic conflict |

## Role boundaries

- `architect` decides structure; `diagram-agent` only represents an approved structure.
- `head-dev` implements and debugs; `test-agent` verifies; `code-reviewer` reviews;
  `git-integrator` integrates. None silently absorbs another role.
- `repo-scout` returns paths and concise evidence, not implementation proposals unless
  explicitly requested.
- `test-agent` may add straightforward coverage but does not redesign production code.
- `code-reviewer` does not fix the code it reviews.
- `git-integrator` may resolve only mechanical conflicts. Business logic, API behavior,
  schema intent, authentication, or competing architecture is a semantic conflict and
  goes back to its owner.

## Git and worktrees

Branches represent independent write workstreams, not agents. A planner, scout, reviewer,
or test runner needs no branch when it makes no changes. A helper contributing to the
same workstream normally uses the owner's branch sequentially.

Every simultaneously active write workstream has its own branch and worktree. Before
parallel work, the coordinating COO assigns exclusive file ownership. If two tasks need
the same core file, run them sequentially or record an explicit ownership transfer after
the first writer stops. Agents never stage, commit, revert, or push foreign lane work.
Unexpected foreign changes freeze only the affected paths: leave them untouched, notify
the coordinating COO, and continue only on unaffected assigned paths when safe.

```text
worker branch -> tests -> review -> git-integrator -> Et merges -> main
```

Workers commit and push only their assigned branch. They never merge into `main`.
`git-integrator` confirms relevant checks, reviews the changed-file set, updates the
branch when necessary, reports which pull requests are ready and in what order, and
cleans completed branches/worktrees after Et merges.
It must verify that each lane is stopped or marked `READY_FOR_INTEGRATION` before
touching it.

## Escalation and retries

LOW escalates when requirements are ambiguous, existing behavior is unclear, or the
task stops being mechanical. MEDIUM escalates when architecture must change, root cause
remains unknown, security or privacy consequences appear, multiple systems conflict, or
one or two materially different attempts fail.

Do not repeat the same failed attempt at the same tier. State the evidence, the exact
unresolved question, and the smallest next decision needed.

## Success signals

This system is working when most tasks use LOW or MEDIUM, HIGH decisions are rare and
reused, workers receive small contexts, parallel agents rarely touch the same files,
semantic conflicts are never guessed through, integration has one clear owner, and Et
makes every merge.
