# writing-plans

Design stage of the Agentic SDLC. Turns an approved spec into `specs/NNN-slug/plan.md`: a task graph of vertical slices (`| ID | Title | AC | Blocked by | Files | Size |`), self-contained task subsections with fixed interfaces and red-green-refactor steps, an impact section from the code map, a dependencies note and risks. `plan-graph` validates the graph and writes `graph.json`; a 12-check self-review, a two-way AC ↔ task coverage check, a task-brief dry run and a fresh-context plan review run before the Tech Lead's Design sign-off, which is bound to the plan hash and the spec hash.

## When to use

- A spec has a valid Specify sign-off (Standard or Full path) and no plan exists.
- An approved plan was voided by an edit or a spec revision and needs revision N+1.
- Requirements exist outside the Agentic SDLC and the work spans several files, layers or sessions (standalone mode, `docs/plans/`).

Not for: writing the spec (`spec-driven-development`), choosing between options (`brainstorming`, `grill-me`), a single ADR (`senior-solution-architect`), running the plan (`executing-plans`), one task's TDD cycle (`test-driven-development`), or a Quick-path item (no plan).

## What is included

- `SKILL.md` — Design-stage workflow: discovery, decisions and prefactor, slicing, task details, impact, dependencies, `plan-graph`, self-review and plan review, readiness, Design sign-off request and record, handoff, standalone mode, anti-rationalization table
- `references/plan-format.md` — every plan section and `## Tasks` column with its `plan-graph` error code, the real-dependency test for `Blocked by`, task subsection fields, `--no-red` and `CHAR-n` rules, placeholder blacklist, Revision log and Approvals rules
- `references/slicing.md` — vertical slices, prefactor → tracer bullet → least certain first, slicing pattern catalogue, size bounds and split rules, expand–contract for schema and public API, designing for a wide parallel frontier, worked mini-example
- `references/self-review-and-readiness.md` — 12 self-review checks, AC ↔ task coverage both ways (with a one-line matrix command over `plan-graph --json`), plan review rules, Design sign-off readiness checklist, request template, reply handling, approval check codes
- `prompts/task-brief.md` — what one fresh Developer subagent receives for one task (matches `executing-plans` Step 3) and its report contract; doubles as the Design dry run
- `prompts/plan-reviewer.md` — fresh-context plan review: 10 checks including semantic collisions between parallel tasks, severity, READY / NOT READY verdict
- `examples/007-api-rate-limit/` — synthetic Standard example: spec excerpt, plan (6 tasks, prefactor, tracer bullet, 2 file conflicts, separate review), `graph.json` and `approvals.md`; passes `plan-graph --check --check-approval`
- `evals/evals.json` — 5 scenarios, including a pressure scenario ("skip the plan, just code it")
- `evals/trigger-eval.json` — 24 queries (12 should-trigger / 12 should-not-trigger, aimed at neighbour skills)

## Typical invocation

- "Spec 007-api-rate-limit rev 1 is approved — write the plan."
- "plan-graph says UNCOVERED_AC: AC-4 — fix the plan."
- "Plan renaming `customer_id` to `account_id` across the monorepo."
- "No spec — write a plan for moving the worker from cron to a queue; we run it tomorrow in a fresh session."

## What's New in v3.2

- **Depth references** — `plan-format.md`, `slicing.md` and `self-review-and-readiness.md` hold the column rules, slicing catalogue and readiness material; SKILL.md restructured into Steps 0–9 with an anti-rationalization table and a References section
- **Self-review (12 checks)** — coverage, placeholders, self-containment, interface consistency, real red, Files complete, real edges, vertical slices, honest sizes, bounds and path, impact and dependencies, TDD discipline
- **Two-way coverage check** — AC → tasks matrix printed from `plan-graph --json`; task → AC read against each red test, including refusal and error clauses
- **Fresh-context plan review** — `prompts/plan-reviewer.md`, at most 2 rounds, never a sign-off request on NOT READY; inline fallback labelled `self-review (no subagent)`
- **Task brief** — `prompts/task-brief.md` fixes what a Developer subagent receives and reports; used as a dry run before sign-off
- **Slicing rules** — prefactor, tracer bullet, least certain next, split-never-shrink, real-dependency test for `Blocked by`, file-disjoint design for parallel waves; expand–contract tied to the Full-path risk rule
- **Design sign-off readiness checklist** and reply handling (`approved with conditions`, `rejected`)
- **Worked example** `examples/007-api-rate-limit/` validated by `plan-graph`; example approval row in SKILL.md now uses the worked example's spec hash
- **Evals** — 3 new scenarios (pressure, coverage gap with plan review, parallel waves with expand–contract) and 2 new trigger queries

## What's New in v3.1

- **Design stage, D10 vocabulary** — writes `specs/NNN-slug/plan.md` from `agentic-sdlc/templates/plan.md`; Design sign-off recorded in the plan's `## Approvals` and the `approvals.md` register
- **plan-graph** — `agentic-sdlc/scripts/plan-graph.mjs` validates the task table (AC links both ways, cycles, unknown dependencies, size ≤ 1 day, ≤ 15 tasks, prose budget), computes waves, serializes same-wave tasks with overlapping Files and writes `graph.json`; `--check` in CI, `--check-approval` before Build
- **Impact from the code map** — modules touched, dependents, mapped tests and a Regression scope command; a file outside every module stops the plan until the map is updated
- **Dependencies note** — exact version, license, last release ≤ 12 months, 0 critical/high advisories, lockfile, typosquat check
- **Combined review rule** — one Specify + Design review on Standard with ≤ 5 tasks; otherwise two
- **Loop ledger** — table appended during Build; excluded from the plan hash so it never voids approval
- **Commit trailer** — `Refs: Tn AC-n`

## What's New in v3.0

- **Agentic SDLC Design stage** — plans from an approved spec revision; the approval record format was replaced in v3.1 (Design sign-off in `## Approvals`)
- **Task graph** — tracer-bullet vertical slices with `Satisfies: AC-n`, `Implements: ADR`, `Blocked by:` edges
- **Wide refactors** — expand → migrate → contract sequencing
- **Coverage check** — every acceptance criterion has a task, every task serves a criterion or is an explicit enabler
- **Traceable commits** — commit messages carry task and AC IDs (trailer format `Refs: Tn AC-n` since v3.1)
- **Fixed handoff** — points to `executing-plans` (subagent or inline mode) instead of external skill names

## What's New in v2.0

- **Progress Tracking** — 4-phase gauge bar (Requirements Analysis → Step Sequencing → Dependency Mapping → Plan Review) displayed during execution
- **EVals** — `evals/evals.json` with 3 realistic test cases; `evals/trigger-eval.json` with 20 queries (10 trigger / 10 no-trigger) for description optimization
- **Standardized description** — SKILL.md description updated to Anthropic skill-creator format

## Influences

| Inventory ID | Source (license) | What was taken | How adapted |
|---|---|---|---|
| SP-17 | Superpowers `writing-plans` (MIT) | Zero-context executor audience; the plan holds the decisions the implementer cannot make | Purpose line and placeholder blacklist (`references/plan-format.md` §5) |
| SP-18 | Superpowers `writing-plans` (MIT) | Scope check and file-structure map before tasks | Step 1 scope check (one deliverable, ≤ 15 tasks) and file map feeding the Files column and the Standard file bound |
| SP-19 | Superpowers `writing-plans` (MIT) | Right-sized tasks of 2–5 minute steps | ≤ 6 steps per task, ≤ 8h per task enforced by `SIZE_BOUND` |
| SP-23 | Superpowers `writing-plans` (MIT) | Task template with an Interfaces block and Expected outputs | `### Tn` subsection: Interface fixed before code, `Expected: FAIL with …` / `PASS (n tests)` |
| SP-24 | Superpowers `writing-plans` (MIT) | Plan self-review (spec coverage, placeholder scan, type consistency) | Extended to 12 checks in `references/self-review-and-readiness.md` §1 |
| SP-25 | Superpowers `writing-plans` (MIT) | Execution handoff | Step 9 handoff to `executing-plans` with `graph.json` waves and the task brief |
| MP-49 | Matt Pocock `to-tickets` (MIT) | Tracer-bullet vertical slices, blocking edges, prefactor first, granularity quiz | Slicing order in `references/slicing.md` §2; table shown for a granularity check before detailing |
| MP-50 | Matt Pocock `to-tickets` (MIT) | Expand–contract for wide refactors | `references/slicing.md` §5, with migrate batches on disjoint files |
| AO-36 | Addy Osmani `planning-and-task-breakdown` (MIT) | Read-only planning and a dependency graph | Planner edits only plan, graph and ADRs; `plan-graph` builds the DAG and waves |
| AO-37 | Addy Osmani `planning-and-task-breakdown` (MIT) | Vertical slicing with contract-first and risk-first variants | Pattern catalogue in `references/slicing.md` §3 |
| AO-38 | Addy Osmani `planning-and-task-breakdown` (MIT) | Sizing; break down on "and" in the title or too many files | Split rules in `references/slicing.md` §4; per-task ACs replaced by spec AC IDs |
| AO-39 | Addy Osmani `planning-and-task-breakdown` (MIT) | High-risk tasks early; every task leaves the system working | "Least certain next" ordering; every task ends green with one commit |
| AO-101 | Addy Osmani `deprecation-and-migration` (MIT) | Expand/contract schema migrations: nullable column, dual-write, throttled backfill, contract last | Down step from the spec's Rollback; contract in a later release after an observation window |
| BM-11 | BMad Method (MIT) | Plan size budget | `WORD_BOUND` (3,000 Standard / 6,000 Full) and "move rationale to an ADR" |
| BM-20 | BMad Method (MIT) | Plan as the implementer's sole source | `prompts/task-brief.md`: the Developer receives only its row, subsection, AC text, files and DoD |
| BM-46 | BMad Method (MIT) | Adversarial reviewer gate | `prompts/plan-reviewer.md` with a READY / NOT READY verdict and a 2-round bound |
| BM-56 | BMad Method (MIT) | Tracer bullet first, least certain second, split-never-shrink | `references/slicing.md` §2 and §4 |
| BM-57 | BMad Method (MIT) | Real prerequisites only; a verify line per item | Real-dependency test (`references/plan-format.md` §3); Check step for non-code tasks |
| BM-59 | BMad Method (MIT) | Fresh-context validation; coverage by citation is not coverage; collisions between parallel items | Backward coverage check and the reviewer's semantic-collision check |
| ai-native-methods §2.1 | GitHub Spec Kit (MIT) | `/plan` → `/tasks` with numbered tasks, parallel markers and a consistency analysis | `T1..Tn` IDs; parallelism derived from Files by `plan-graph` instead of hand markers; coverage check before sign-off |
| ai-native-methods §2.2 | AWS Kiro | `tasks.md` items linked to requirement numbers | The AC column; every AC covered, every task serving an AC |
| ai-native-methods §2.5 | OpenSpec (MIT) | Task checklist per change, verified for completeness before archive | Done tracking from `Refs: Tn` commit trailers (`plan-graph --from-git`) |

Credits kept from earlier versions: Superpowers `writing-plans` (bite-sized TDD steps, exact paths and commands, zero-context executor), Matt Pocock `to-tickets` (tracer-bullet slices, blocking edges, expand–contract, prefactoring), Addy Osmani `planning-and-task-breakdown` (ordered, sized tasks).

---

## Metadata

| Field | Value |
|-------|-------|
| Version | 3.2.0 |
| Author | Eric Andrade |
| Created | 2026-02-20 |
| Updated | 2026-11-24 |
| Platforms | GitHub Copilot CLI, Claude Code, OpenAI Codex, OpenCode, Gemini CLI, Antigravity, Cursor IDE, AdaL CLI |
| Category | planning |
| Tags | agentic-sdlc, planning, implementation-plan, task-graph, task-breakdown, vertical-slices, design-sign-off, tdd |
| Risk | safe |
