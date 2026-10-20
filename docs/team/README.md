# The Team

Thirteen roles: the twelve from Sweet Potato's project template plus the academy's own
`uscg-regs`. Each one is a specialist you can call by name. They work on the same repo
and leave a trail anyone can read, with no coding knowledge required.

Call the same employee from either platform: *"have ux-ui look at the sign-up form"*.
Claude uses `.claude/agents/ux-ui.md`; ChatGPT/Codex uses
`.codex/agents/ux-ui.toml`. The job and authority are the same.

| Name | Tier | Plain English | Call them when |
|---|---|---|---|
| `ceo` | MEDIUM | Decides what we build | Two good ideas compete, or scope is creeping |
| `coo` | MEDIUM | Runs sequencing and delegation | You need a plan, an order, or someone unblocked |
| `architect` | HIGH | Decides durable system structure | New feature area, schema boundaries, or a second client |
| `ux-ui` | MEDIUM | Makes screens anyone can use | Any screen, form, layout, accessibility, or confusing flow |
| `head-dev` | MEDIUM | Implements and debugs application code | A planned feature or reproducible bug needs code changes |
| `uscg-regs` | HIGH | Checks every sea-time and license rule against 46 CFR | Sea-time crediting, license requirements, tonnage, recency, STCW, forms |
| `cfo` | MEDIUM | Owns run/build cost | Before adding a paid service or when auditing waste |
| `counsel` | HIGH | Drafts terms and flags legal risk | User data, privacy, licensing, or API terms. **Not legal advice** |
| `diagram-agent` | LOW | Turns approved designs into diagrams | Mermaid, sequence, state, ER, or dependency diagrams |
| `repo-scout` | LOW | Finds the smallest relevant change surface | Files, symbols, imports, tests, or configuration must be located |
| `test-agent` | LOW | Writes and runs bounded tests | Straightforward tests, regression coverage, or check execution |
| `code-reviewer` | MEDIUM | Reviews without editing | Correctness, regression, security, or missing-test review |
| `git-integrator` | LOW | Prepares approved work for Et to merge | Branch status, safe rebase/merge order, or mechanical conflicts |

## How the team works

**Horizontal.** Nobody's field is off-limits to anyone else. The architect can
tell the designer a button is confusing. The designer can tell the architect a schema
is wrong. Good arguments win, regardless of who makes them.

**But decisions have an owner.** Scope is the CEO's. Sequencing is the COO's. Structure
is the architect's. Implementation is the head developer's. Integration order is the Git
integrator's. Et merges. Argue once, then commit.

## Where things are written down

| File | What it is |
|---|---|
| [HOUSE-RULES.md](HOUSE-RULES.md) | The rules every role follows. Git, quality bar, logging |
| [AI-OPERATING-SYSTEM.md](AI-OPERATING-SYSTEM.md) | Model tiers, role boundaries, escalation, context, worktrees |
| [CHANNEL.md](CHANNEL.md) | The team chatroom. Findings one role passes to another |
| [WORKLOG.md](WORKLOG.md) | What was done, when, how long. Written for non-coders |
| [BACKLOG.md](BACKLOG.md) | Now / Next / Someday. Max 3 items in Now |
| `docs/adr/` | Architecture decisions (architect) |
| `docs/regs/` | Each regulation in plain English, with its citation and date checked (uscg-regs) |
| `docs/finance/` | What it costs (cfo) |
| `docs/legal/` | Drafts and open questions for a real attorney (counsel) |
| `docs/product/` | What this product is and isn't (ceo) |

The canonical role ownership and routing rules live in
[AI-OPERATING-SYSTEM.md](AI-OPERATING-SYSTEM.md). `.claude/agents/` and
`.codex/agents/` are equal runtime adapters for that roster. Claude frontmatter selects
Claude models and tools; Codex TOML selects OpenAI models and sandboxes. Neither directory
defines a separate team.

The active COO uses the active runtime by default. A Claude COO spawns Claude agents; a
Codex COO spawns Codex agents. In mixed mode, the COO assigns independent workstreams to
each platform and coordinates through branches and concise repository handoffs. One
platform must not claim it directly spawned the other unless a real bridge is configured.
Additional vendors follow the same pattern: add a native adapter and map LOW, MEDIUM, and
HIGH to that vendor's efficient, balanced, and strongest appropriate settings. Do not add
a second roster of vendor-branded employees.

## The trail

Every session ends with a worklog entry: date, who, how long, what changed in plain
words, and what is still broken. If it isn't in the log, it didn't happen.
