---
name: writing-plans
description: This skill should be used when an approved spec or a set of requirements exists and multi-step work has not started — it turns acceptance criteria into specs/NNN-slug/plan.md with vertical-slice tasks, a plan-graph-validated task graph (graph.json), an impact section from the code map, a self-review, a fresh-context plan review, an AC-to-task coverage check and a Design sign-off request (the Design stage of the Agentic SDLC). Not for choosing a legacy migration strategy or order (use codebase-modernization, whose slices it turns into tasks), comparing architectures (use senior-solution-architect), picking which skills or agents to use (use agent-skill-orchestrator), or executing the plan (use executing-plans).
license: MIT
---

# Writing Plans

## Purpose

**Agentic SDLC · Design stage.** Used by the Planner (`../agentic-sdlc/agents/planner.md`), with the Architect (`../agentic-sdlc/agents/architect.md`) for decisions that are expensive to reverse; the Tech Lead gives the Design sign-off. Agents never approve.

Turn an approved spec into a plan that a fresh Developer with no context runs task by task with predictable results. The plan is a **task graph** of vertical slices: each task names the acceptance criteria (AC-n) it serves, the tasks that block it, every file it touches and its size. `plan-graph` checks the graph and writes `graph.json`, which drives the waves and the parallel frontier in Build.

The Design exit record (`../agentic-sdlc/references/lifecycle.md` §1) is `specs/NNN-slug/plan.md`, `specs/NNN-slug/graph.json`, any ADRs, and the Design sign-off row bound to the plan hash and the spec hash.

Write for a skilled executor who knows nothing about this codebase: exact files, interfaces, commands and expected output. DRY. YAGNI. Test first. One commit per task.

**Announce at start:** "Using the writing-plans skill to write the plan (Design stage)."

## When to Use

- A spec at `specs/NNN-slug/spec.md` has a valid Specify sign-off (Standard or Full path) and no `plan.md` exists — router state "Plan missing".
- An approved plan was voided (plan edit, or a spec revision that voided the spec hash) and needs revision N+1 through the change protocol (`../agentic-sdlc/references/rules.md` §Change protocol).
- Requirements exist outside the Agentic SDLC and the work spans several files, layers or sessions: **standalone mode**.

Not this skill:

| Situation | Use instead |
|---|---|
| No approved spec yet; ACs still being written | `spec-driven-development` (Specify) |
| Requirements still fuzzy; options not chosen | `brainstorming`, then `grill-me` to stress-test |
| A single decision needs an ADR (schema, public API, new component) | `senior-solution-architect` (the Architect), called from Step 1 |
| An approved plan is ready to run | `executing-plans` (Build) |
| One task's red-green-refactor cycle | `test-driven-development` |
| A Quick-path item (typo, one-file fix, R = 0) | No plan: the issue holds one acceptance test and the cycle in `../agentic-sdlc/references/tdd.md` drives it. `plan-graph` rejects a Quick plan with `PATH_QUICK` |

## Inputs and Outputs

| Item | Location | Rule |
|---|---|---|
| Spec (input) | `specs/NNN-slug/spec.md` | Valid Specify sign-off: the hash in its `## Approvals` row equals `spec-lint --hash`. Otherwise `BLOCKED: Specify sign-off missing or void` |
| UX and threat model (input) | `specs/NNN-slug/ux.md`, `threat-model.md` when present | Each UX state and each security control maps to a task |
| Code map (input) | `docs/codemap.md` (`../agentic-sdlc/templates/codemap.md`) | Required for `## Impact`. Absent → `project-context` adopt mode first, or record `absent — <reason>` |
| ADRs (input/output) | `docs/adr/NNNN-slug.md` | One per decision that is expensive to reverse; status Proposed until Design sign-off |
| Plan (output) | `specs/NNN-slug/plan.md` from `../agentic-sdlc/templates/plan.md` | Every section filled; empty → `none — <reason>` |
| Graph (output) | `specs/NNN-slug/graph.json` | Written only by `plan-graph --write`; never edited by hand; committed with the plan |
| Approval (output) | `plan.md` `## Approvals` + `specs/NNN-slug/approvals.md` | Plan rev, plan hash, spec rev, spec hash, date, role, person, exact words, evidence, residual risks, decision |

In commands, `<agentic-sdlc>` is the installed `agentic-sdlc` skill directory (`../agentic-sdlc` from this skill; `skills/agentic-sdlc` in this repository).

## Progress Tracking

```
[████░░░░░░░░░░░░░░░░] 20% — Steps 1–2: Decisions and task graph
[████████░░░░░░░░░░░░] 40% — Steps 3–4: Task details, impact, dependencies
[████████████░░░░░░░░] 60% — Steps 5–6: plan-graph, self-review, plan review
[████████████████░░░░] 80% — Step 7: Design sign-off request
[████████████████████] 100% — Steps 8–9: Sign-off recorded, handoff to Build
```

## Workflow

### Step 0 — Discovery

1. Locate the work item: list `specs/*/` and pick the folder whose `spec.md` has a valid Specify sign-off and no `plan.md`. Several candidates → list them and ask which one. None → standalone mode, or back to Specify.
2. Verify the sign-off: `node <agentic-sdlc>/scripts/spec-lint.mjs --check-approval specs/NNN-slug/spec.md`. Exit 1 → `BLOCKED: Specify sign-off missing or void`; stop. On a Standard spec whose plan may reach ≤ 5 tasks, a combined Specify + Design review is allowed instead: the spec must pass `spec-lint` and its hash is fixed before the plan is presented.
3. Read the spec: AC table (active IDs only; rows "Retired in rev N" are out), Non-goals, Constraints, Security notes, Rollback, Release & observability, and the header `Path`, `Size`, `Risk`.
4. Locate the code map (`docs/codemap.md`, else glob `**/codemap.md`), ADRs (`docs/adr/`, else `**/adr/`), and the `sdlc-dod` block in `AGENTS.md` or `CLAUDE.md`. No `sdlc-dod` block → `NEEDS_CONTEXT`: propose commands from `package.json`, `Makefile`, `pyproject.toml` or CI, and ask the Tech Lead to confirm before Step 3.
5. Read the code the plan touches: entry points, existing tests and their harness, a similar feature to imitate, and the `## Pitfalls` list in `AGENTS.md`.
6. Locate the scripts: `<agentic-sdlc>/scripts/plan-graph.mjs` or the vendored `.agentic-sdlc/bin/plan-graph.mjs`, with `node --version` ≥ 18. Missing → **prompt-only mode**: apply every rule by hand, keep the plan in the same format, and state `plan-graph: not run (prompt-only)` in the request.

### Step 1 — Decisions, prefactor and scope

1. A task that adds a component, data model or integration says so in `Adds` and gets a `## Decisions` row (`D-n`, options considered; Full: an ADR link). For a choice expensive to reverse (schema, public API, new dependency, data retention), dispatch the Architect (`senior-solution-architect`) for a Proposed ADR. The header lists every ADR, or `none — <reason>`.
2. **Scope check.** The spec describes one deliverable that ships in one plan of ≤ 15 tasks. Independent subsystems → split the spec in the Specify stage; never plan two features in one table.
3. **Prefactor.** "Make the change easy, then make the easy change." A missing seam becomes the first task, listing the AC it enables.
4. **File map.** Before slicing, list every file to create or modify with its one responsibility. This list becomes the Files columns; it also gives the Standard-path file count early (bound 15, `../agentic-sdlc/references/paths.md` §4).
5. Use the spec's domain vocabulary in titles. Ask the human at most 3 rounds of questions.

### Step 2 — Slice the task graph (mechanism 7.1)

Load `references/slicing.md`. Slice into **tracer-bullet vertical slices**:

- Each slice cuts a narrow, complete path through every layer it needs, verifiable on its own by a test named after its AC. Never one horizontal layer.
- Order: prefactor → tracer bullet (thinnest end-to-end path; fixes the shared interfaces) → least certain work → remaining ACs as independent slices → docs.
- Schema or public-API changes with live callers or stored data: **expand → migrate → contract**. Migrate batches block on expand and touch disjoint files; contract blocks on every migrate batch.
- Design for parallelism: real dependencies only, one test file per slice where cheap, no directory or glob entries in Files unless unavoidable.

Fill `## Tasks` with the exact columns `| ID | Title | AC | Blocked by | Files | Size | Adds |` (`references/plan-format.md` §2):

| Column | Rule | Error code |
|---|---|---|
| ID | `T1..Tn`, unique, creation order; never renumbered after sign-off; a removed ID stays unused | `BAD_ID`, `DUPLICATE_ID` (`ID_GAP` warning) |
| Title | Verb + object, one behaviour | `NO_TITLE` |
| AC | ≥ 1 active AC; every active AC in ≥ 1 row | `NO_AC`, `UNKNOWN_AC`, `UNCOVERED_AC` |
| Blocked by | Task IDs or `—`; real prerequisites only | `UNKNOWN_DEP`, `CYCLE` |
| Files | Every file created or modified, tests included, in backticks | `NO_FILES` |
| Size | `Nh`, `Nd` (= 8h), `Nm`; ≤ 8h | `BAD_SIZE`, `SIZE_BOUND` |
| Adds | `component`, `data model`, `integration` or `—`; a value needs a decision row | `ADDS_INVALID`, `DECISION_MISSING`, `DECISION_ADR` |
| Count | ≤ 15 tasks; more → split the spec | `TASK_BOUND` |

**Blocked by** records a real need only: the task calls, reads or tests against code, schema or an interface another task creates. File overlap is not a dependency; `plan-graph` serializes it. Every false edge shrinks the frontier.

Show the table and ask whether granularity and edges are right before detailing. A change now costs one table edit; after Step 3 it costs a rewrite.

### Step 3 — Task details

One `### Tn — <title>` per row, self-contained (`references/plan-format.md` §4):

1. `**AC:** · **Blocked by:** · **Files:**` line, each file marked `(create)` or `(modify)`.
2. **Interface** in a fenced block: exact signature with types, status codes, error bodies, `null` semantics, config keys and defaults. Fixed here, before any code; dependent tasks code against it.
3. **Red** — test names containing the AC ID, the exact command, `Expected: FAIL with <line>` caused by the missing behaviour.
4. **Green** — the minimal change, the same command, `Expected: PASS (n tests)`.
5. **Refactor** — concrete, or "none beyond naming"; tests stay green.
6. **Commit** — Conventional Commit subject with the trailer `Refs: Tn AC-n` listing every AC the task serves.

Steps are one action of 2–5 minutes; more than 6 steps → split. Non-code tasks get a **Check** step with a command and expected result and close `--no-red "<reason>"`; at most one per plan. Untested legacy code gets `CHAR-n` characterization tests first. Mocks only at process boundaries. Add a docs task (Tech Writer) when the docs trigger fires; map each `ux.md` state and each threat-model control to a task (`../agentic-sdlc/references/agents.md` §Triggers). No placeholders (`references/plan-format.md` §5).

### Step 4 — Impact, dependencies, risks, header (mechanisms 7.5, 11.3)

**Impact.** One row per code-map module touched: Module, Paths touched, Change, Dependents (modules whose `depends_on` lists it), Mapped tests (its `tests` globs plus its dependents'). Then the **Regression scope** line: one command running the union of Mapped tests; Build runs it after every fix and the full DoD at loop exit (`../agentic-sdlc/references/loops.md` §5). A file matching no module → stop, update `docs/codemap.md` (`project-context`), then continue. Empty Mapped tests → the full DoD suite.

**Dependencies.** Each new or upgraded package: exact version, license, last release ≤ 12 months, 0 critical/high advisories with the audit command, lockfile committed, typosquat check, reason (rule 10). A package outside a bound is replaced or waived (`../agentic-sdlc/references/governance.md` §6). None → `none — <reason>`.

**Risks.** Likelihood, the mitigation inside the plan (task, test, flag, staging measurement) and the accepting role.

**Header.** Path copied from the spec (`PATH_MISMATCH` otherwise), spec rev, ADRs, executor note; Goal (1 sentence), Architecture (2–3 sentences), Tech stack with the DoD commands. Prose ≤ 3,000 words on Standard and ≤ 6,000 on Full, without code fences, Loop ledger and Approvals (`WORD_BOUND`).

### Step 5 — Validate with plan-graph (mechanism 7.2)

Run after every plan edit and once more before the request:

```bash
node <agentic-sdlc>/scripts/plan-graph.mjs specs/NNN-slug/plan.md --write
```

`plan-graph` parses `## Tasks`, reads the sibling spec's active ACs, fails on any rule above, and computes **waves**: wave = 1 + the highest blocker wave; two same-wave tasks with overlapping Files (same file, directory prefix, glob prefix) are serialized — the higher ID moves to the next wave and the conflict is printed. It prints the waves, conflicts, initial frontier, `review: combined|separate` and `planHash`, and writes `graph.json`; a failing plan writes none. Exit codes: 0 pass · 1 check failed · 2 plan or spec missing or unparsable. `--json` gives the same result machine-readable.

**Failure behaviour.** Exit ≠ 0 → fix and re-run. Two fix attempts leaving the same error code → stop, report `BLOCKED` with the error lines, and route by cause: `UNCOVERED_AC` or `UNKNOWN_AC` the plan cannot fix → spec defect → Specify (change protocol); `TASK_BOUND` → split the spec; a `CYCLE` that survives re-slicing → design question for the Architect.

**CI.** `plan-graph --check` runs on every changed `specs/**/plan.md`: `GRAPH_STALE` when the committed `graph.json` differs from the regenerated graph, `GRAPH_MISSING` when absent. Commit `plan.md` and `graph.json` together.

### Step 6 — Self-review and fresh-context plan review (mechanism 9.1)

Load `references/self-review-and-readiness.md`.

1. **Self-review**: run the 12 checks (coverage, placeholders, self-containment, interface consistency, real red, Files complete, real edges, vertical slices, honest sizes, bounds and path, impact and dependencies, TDD discipline). Fix in place; re-run `plan-graph --write`.
2. **Coverage check, both ways**: print the AC → tasks matrix from `plan-graph --json`; then read each task's red tests against its AC text, including refusal and error clauses.
3. **Task-brief dry run**: fill `prompts/task-brief.md` for each task and read it alone. Any "cannot tell" → fix the subsection.
4. **Plan review**: send `prompts/plan-reviewer.md` to a fresh subagent with the spec, plan, `plan-graph` output and code-map modules — never the planning conversation. If the platform has no subagents, run the prompt yourself in a fresh pass after clearing working notes and label it `self-review (no subagent)`. Fix every Critical and Important finding; at most 2 rounds, each with a new fresh reviewer. A Critical finding open after round 2 → `BLOCKED`.

### Step 7 — Readiness and Design sign-off request

Every item of the readiness checklist (`references/self-review-and-readiness.md` §4) is true: Specify sign-off valid; `plan-graph` exit 0 with `graph.json` fresh; coverage both ways; self-review 12/12; plan review `READY`; ADRs Proposed; Impact, Dependencies and Risks complete; path still right; no secrets or real personal data.

**Review count (rule K8).** One combined Specify + Design review when the path is Standard **and** the plan has ≤ 5 tasks; otherwise two reviews. Full always holds them separately. Use the `review:` value `plan-graph` prints.

**Request.**

1. Append a row to `specs/NNN-slug/approvals.md` (`Requested at`, UTC minute, asked role).
2. Present in one message: the task table, the waves and conflicts, the coverage matrix, the self-review score, the plan-review verdict and rounds, Impact and Regression scope, Dependencies, ADRs, residual risks, and the plan hash. A combined review also presents the spec (rev, hash, `spec-lint` result, critique result) and asks the Product Owner in the same message.
3. Ask: "Tech Lead: approve plan rev N (hash `<planHash>`) as the Build baseline? Reply "yes" or list changes." **End the turn.**

### Step 8 — Record the sign-off

Only an explicit "yes" or "approved" from the asked role in a later turn counts (`../agentic-sdlc/references/governance.md` §2). A yes with a condition that changes nothing → `approved with conditions`, condition in Residual risks with an owner. A yes with changes → `rejected`: new revision, new request. Write the row in `plan.md` `## Approvals`:

```markdown
| Specify + Design (combined) | 1 | 4da2f0c5aea8 | 1 | 6b4c7f329c93 | 2026-11-23 15:10 | Tech Lead | D. Okafor | "Approved. Plan rev 1, five tasks, go." | plan-graph exit 0; spec-lint exit 0; critique 12/12 | Export error alert untested until staging | approved |
```

A combined review records two rows from one request: the Product Owner's answer in `spec.md`, the Tech Lead's in `plan.md`, both with Sign-off `Specify + Design (combined)` and the same spec hash. Fill `Answered at` and `Exact words` in `approvals.md`. ADRs move from Proposed to Accepted. Confirm the binding:

```bash
node <agentic-sdlc>/scripts/plan-graph.mjs specs/NNN-slug/plan.md --check --check-approval
```

It fails with `APPROVAL_MISSING`, `APPROVAL_COLUMNS`, `APPROVAL_VOID` (plan hash differs), `APPROVAL_SPEC_VOID` (spec changed), `APPROVAL_REV` (approved rev ≠ latest Revision log rev), `APPROVAL_FIELD` (role, person or exact words empty) or `COMBINED_NOT_ALLOWED` (combined row on Full or with > 5 tasks).

**Hash rule.** Plan hash = first 12 hex characters of SHA-256 over `plan.md` without `## Approvals` and `## Loop ledger`. Ledger rows appended during Build never void the approval; any other edit does and runs the change protocol: impact on AC, tasks and tests → Revision log row N+1 → `plan-graph` → new request. A void Specify sign-off voids the Design sign-off built on its hash.

### Step 9 — Handoff to Build

Hand `plan.md` and `graph.json` to `executing-plans`. Build dispatches waves in order and, within a wave, the **frontier**: ready tasks with pairwise disjoint Files, at most 3 at once, each in its own worktree. Each Developer receives exactly the content of `prompts/task-brief.md`. The current frontier at any time:

```bash
node <agentic-sdlc>/scripts/plan-graph.mjs specs/NNN-slug/plan.md --from-git main..HEAD
```

`--from-git` marks a task done when a commit in the range carries `Refs: Tn`. A platform without subagents runs the tasks sequentially in wave order. Context ≥ 70% before the handoff → write `specs/NNN-slug/handoff.md` (`../agentic-sdlc/references/phase-boundaries.md`) and continue in a new session.

### Loop ledger (mechanism 6.3)

`## Loop ledger` stays empty at Design. Build and Test fill it from `run-ledger render` with the columns and causes of `../agentic-sdlc/references/loops.md` §3; it is excluded from the plan hash, so appending rows never voids the sign-off. Never delete rows.

### Standalone mode

For requirements outside the Agentic SDLC (no `specs/` folder):

1. Save to `docs/plans/YYYY-MM-DD-<feature>.md` from the same template; replace the Spec reference with the requirement source and list `AC-1..AC-n` in `## Requirements` at the top.
2. Validate: `plan-graph <plan> --no-spec --write --out docs/plans/YYYY-MM-DD-<feature>.graph.json`. `--no-spec` skips AC existence and coverage; run the coverage check by hand.
3. Run Step 6 as written. Ask the requester for approval with the same record fields; Spec rev and Spec hash `n/a`; no combined review.

**Close.** End with the `status.mjs --next` output.

## Anti-rationalization

| Thought | Reality |
|---|---|
| "It is small — skip the plan and just code it." | On Standard and Full, rule 1 forbids production code before the Design sign-off. A small plan is short (≤ 5 tasks → one combined review), not absent. A re-score lower than the current path keeps the path; routing down needs a waiver, never a silent skip. |
| "The Developer will figure out the interface." | A missing signature makes the Developer stop with `NEEDS_CONTEXT`; inventing one in Build breaks every task that depends on it. |
| "Same pattern as T3 — no need to repeat it." | The Developer of T5 never sees T3. Repeat the content. |
| "Layer tasks are easier to estimate." | A layer cannot be tested against an AC and blocks every later task. Slice by behaviour. |
| "I'll add Blocked by to be safe." | A false edge serializes Build. File overlap is already serialized by `plan-graph`. |
| "This task is 12h; I'll write 8h." | Split, never shrink. An 8h estimate on a 12h task fails in Build. |
| "plan-graph is just a linter; the plan reads fine." | A failing plan writes no `graph.json`, and Build has no waves to run. Never request sign-off on exit ≠ 0. |
| "The Tech Lead said 'looks good' — that is approval." | Only an explicit yes from the asked role in a later turn counts. |
| "A tiny wording fix after approval does not matter." | Any edit outside Loop ledger and Approvals changes the hash and voids the sign-off. |
| "The schema change fits in one task." | Live callers or stored data need expand → migrate → contract, and a schema plus public-API change is R ≥ 2 → Full. |

## Critical Rules

- **NEVER** write production code or tests in the Design stage; the Planner edits only `plan.md`, `graph.json` and ADRs (with the Architect).
- **NEVER** plan against a spec without a valid Specify sign-off on Standard or Full; report `BLOCKED: Specify sign-off missing or void`.
- **NEVER** request Design sign-off while `plan-graph` exits non-zero or the plan review is `NOT READY`; never edit `graph.json` by hand.
- **NEVER** leave a step abstract: every step names files, interface, command and expected output.
- **NEVER** slice horizontally by layer; schema and public-API changes with live callers use expand → migrate → contract.
- **NEVER** add a task that serves no AC; scope outside the spec is a spec change.
- **NEVER** renumber task IDs after Design sign-off.
- **NEVER** add a package without a `## Dependencies` row inside the rule 10 bounds.
- **ALWAYS** check AC ↔ task coverage both ways and dry-run each task brief before the request.
- **ALWAYS** fill `## Impact` from the code map; a file outside every module stops the plan until the map is updated.
- **ALWAYS** stop and re-score the path when the plan exceeds the Standard file bound or finds a risk trigger the spec score omits.
- **ALWAYS** end the turn after the approval request; only a later explicit yes counts.
- **ALWAYS** keep secrets and real personal or client data out of plans, fixtures and examples.

## Example Usage

**1. Standard path, separate review.**
> "Spec 007-api-rate-limit rev 1 is approved — write the plan."

Writes six tasks (`examples/007-api-rate-limit/plan.md`): T1 prefactor (resolve the API key once), T2 tracer bullet (429 with Retry-After on an in-memory store; fixes the `CounterStore` contract), T3 headers, T4 Redis store with fail-open, T5 exempt keys, T6 docs (Tech Writer, the one `--no-red` task). `plan-graph` prints `W1 T1 · W2 T2 · W3 T3 T4 · W4 T5 T6` and two conflicts moving T5 to wave 4. Fourteen files against the Standard bound of 15 → a Risk row. Six tasks → `review: separate`. The plan review finds T5 missing `src/server.ts` (Important), fixed in round 1. The Tech Lead answers "Yes, plan rev 1 approved. Keep the Redis call to one round trip." → `approved with conditions`.

**2. Standard path, combined review.**
> "Spec 001-csv-export rev 1 — write the plan."

Five tasks, `W1 T1 T2 · W2 T3 · W3 T4 T5`, `review: combined`. One request asks the Product Owner and the Tech Lead; the plan row binds plan hash `4da2f0c5aea8` to spec hash `6b4c7f329c93` (`../agentic-sdlc/examples/worked-example/specs/001-csv-export/`).

**3. Pressure: skip the plan.**
> "This is tiny, skip the plan and just code it."

Writes no code. States that the spec is on the Standard path, so rule 1 requires the Design sign-off before any production code; offers a short plan (3 tasks; when the spec is not yet signed off, one combined Specify + Design review). If the change looks Quick (≤ 3 files, R = 0), the score still stands: routing down needs a waiver (`../agentic-sdlc/references/governance.md` §6 — owner ≠ requester, reason, expiry ≤ 30 days), never a silent skip.

**4. Coverage gap.**
> `plan-graph` prints `UNCOVERED_AC: AC-4 has no task`.

Adds T6 "Refuse exports above the row limit", re-runs `plan-graph` (exit 0). Six tasks → `review: separate`.

**5. Schema rename.**
> "Plan renaming `customer_id` to `account_id` across the monorepo."

Checks the score first: schema plus a public field → R ≥ 2 → Full; the spec must be Full. T1 expand (add `account_id`, dual-write), T2–T6 migrate one package each (blocked by T1, disjoint Files), T7 contract (blocked by T2–T6, shipped in a later release after 7 days with no reads of the old column). `plan-graph` puts T2–T6 in wave 2; the frontier runs 3 at a time.

## References

| File | Load when |
|---|---|
| `references/plan-format.md` | Steps 2–4: every section, column, Files and Blocked by rule, task subsection fields, placeholder blacklist, Revision log and Approvals rules, standalone format |
| `references/slicing.md` | Step 2, and whenever `plan-graph` reports `SIZE_BOUND`, `TASK_BOUND`, `CYCLE` or a chain of single-task waves: vertical slices, ordering, pattern catalogue, split rules, expand–contract, parallelism |
| `references/self-review-and-readiness.md` | Steps 6–8: 12 self-review checks, two-way coverage check, plan review rules, readiness checklist, request template, reply handling, approval check codes |
| `prompts/task-brief.md` | Step 6 dry run and Step 9 handoff: what one Developer subagent receives and must report |
| `prompts/plan-reviewer.md` | Step 6: fresh-context plan review prompt, severity, verdict and output format |
| `examples/007-api-rate-limit/` | A Standard plan with a prefactor, tracer bullet, file conflicts and a separate Design sign-off; passes `plan-graph --check --check-approval` |
| `../agentic-sdlc/templates/plan.md` | Always: the plan skeleton |
| `../agentic-sdlc/references/governance.md` §2–4 | Steps 7–8: approval procedure, record formats, hash rule |
| `../agentic-sdlc/references/tdd.md` | Step 3: red rules, `--no-red`, mocks, `CHAR-n` |
| `../agentic-sdlc/references/paths.md` §2, §4 | Steps 1 and 6: risk triggers, file bounds, escalation |

Sources: task-graph and slicing conventions adapted from Superpowers `writing-plans` (MIT), Matt Pocock `to-tickets` (MIT), Addy Osmani `planning-and-task-breakdown` (MIT) and BMad Method story preparation (MIT); see README Influences.

† Later-release scripts named in the references have manual fallbacks in `../agentic-sdlc/references/artifacts.md` §Later-release files.
