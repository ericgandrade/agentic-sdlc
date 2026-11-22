---
name: writing-plans
description: This skill should be used when an approved spec or a set of requirements exists and multi-step work has not started — the Design stage of the Agentic SDLC, which turns acceptance criteria into specs/NNN-slug/plan.md with a validated task graph (graph.json), an impact section from the code map, and a Plan approval request.
license: MIT
---

# Writing Plans

## Purpose

Turn an approved spec into a plan that a fresh agent with no context runs task by task with predictable results. The plan is a **task graph**: vertical slices, each naming the acceptance criteria (AC-n) it serves, the tasks that block it, the files it touches and its size. A script, `plan-graph`, checks the graph and writes `graph.json`, which drives the waves and the parallel frontier in the Build stage.

This skill is the **Design stage** of the Agentic SDLC (Plan → Specify → **Design** → Build → Test → Release → Operate). Its exit record is `specs/NNN-slug/plan.md`, `specs/NNN-slug/graph.json`, any ADRs, and the **Plan approval** (one of the 4 approvals: Spec, Plan, PR, Release). The lead agent is the Planner; the Architect joins when a decision is expensive to reverse (`senior-solution-architect`).

Write for an executor who is skilled but knows nothing about this codebase, its tools or its domain: exact files, interfaces, commands and expected output. DRY. YAGNI. Test first. One commit per task.

**Announce at start:** "Using the writing-plans skill to write the plan (Design stage)."

## When to Use

- A spec at `specs/NNN-slug/spec.md` has a valid Spec approval (Standard or Full path) and no `plan.md` exists — router state row 4, "Plan missing".
- An approved plan was voided by a spec revision and needs revision N+1 (change protocol).
- Requirements exist outside the Agentic SDLC and the work spans several files, layers or sessions: **standalone mode** (§Standalone mode).

Not for the Quick path: a Quick item has no `plan.md`; its issue holds one acceptance test and the red-green-refactor cycle in `agentic-sdlc/references/tdd.md` drives the change. `plan-graph` rejects a Quick-path plan with `PATH_QUICK`.

## Inputs and Outputs

| Item | Location | Rule |
|---|---|---|
| Spec (input) | `specs/NNN-slug/spec.md` | Valid Spec approval: the hash in its `## Approvals` row equals `spec-lint --hash`. Otherwise stop and report `BLOCKED: Spec approval missing or void` |
| Code map (input) | `docs/codemap.md` (`templates/codemap.md`) | Required for the Impact section. Absent → produce it first with `project-context` adopt mode |
| ADRs (input/output) | `docs/adr/NNNN-slug.md` | One per decision that is expensive to reverse; written by the Architect before tasks are detailed |
| Plan (output) | `specs/NNN-slug/plan.md` from `agentic-sdlc/templates/plan.md` | Every section filled; an empty section holds `none — <reason>` |
| Graph (output) | `specs/NNN-slug/graph.json` | Written only by `plan-graph --write`; never edited by hand; committed with the plan |
| Approval (output) | `plan.md` `## Approvals` + `specs/NNN-slug/approvals.md` register | Plan rev, plan hash, spec rev, spec hash, date, role, person, exact words, evidence, residual risks, decision |

In the commands below, `<agentic-sdlc>` is the installed `agentic-sdlc` skill directory (for example `~/.claude/skills/agentic-sdlc`).

## Progress Tracking

```
[████░░░░░░░░░░░░░░░░] 20% — Phase 1/5: Context, code map and decisions
[████████░░░░░░░░░░░░] 40% — Phase 2/5: Task graph
[████████████░░░░░░░░] 60% — Phase 3/5: Task details, impact, dependencies
[████████████████░░░░] 80% — Phase 4/5: plan-graph validation
[████████████████████] 100% — Phase 5/5: Plan approval and handoff
```

## Workflow

### Step 0 — Discovery

1. Locate the work item: `ls specs/` and pick the folder whose `spec.md` has a valid Spec approval and no `plan.md`. Several candidates → list them and ask which one. None → standalone mode or back to the Specify stage.
2. Read the spec: AC table (active IDs only; rows "Retired in rev N" are out), Non-goals, Constraints, Security notes, Rollback, Release & observability, and the header `Path`, `Size`, `Risk`.
3. Locate the code map (`docs/codemap.md`, else `**/codemap.md`), ADRs (`docs/adr/`, else `**/adr/`), and the `sdlc-dod` block in `AGENTS.md` or `CLAUDE.md` (the DoD commands). A missing `sdlc-dod` block → record it in `## Risks` and ask the Tech Lead for the commands before Phase 3.
4. Read the code the plan touches: entry points, existing tests and their harness, a similar feature to imitate, and the `## Pitfalls` list in `AGENTS.md`.

### Phase 1 — Decisions before tasks

1. For each choice that is expensive to reverse (schema, public API, new service, new dependency, data retention), hand the question to the Architect (`senior-solution-architect`) and wait for an ADR in status *Proposed*. The plan header lists every ADR, or `none — <reason>`.
2. Look for a **prefactor**: "make the change easy, then make the easy change." A prefactor becomes the first task and lists the AC it enables.
3. Use the spec's domain vocabulary in task titles.

### Phase 2 — Build the task graph (mechanism 7.1)

Slice the work into **tracer-bullet vertical slices**:

- Each slice cuts a narrow, complete path through every layer it needs (schema, API, UI, tests), never one horizontal layer.
- Each slice is verifiable on its own by at least one test named after its AC.
- Each slice fits one fresh context: the Implementer receives only its table row, its `### Tn` subsection, the AC text and the listed files.

**Wide refactors** (one mechanical change that breaks many call sites) are the one exception to vertical slicing. Sequence them **expand → migrate → contract**: expand adds the new form beside the old; each migrate batch moves a set of callers and is blocked by expand, keeping the build green; contract removes the old form and is blocked by every migrate batch.

Fill the `## Tasks` table. Every rule below is enforced by `plan-graph` with exit 1:

| Column | Rule | Error code |
|---|---|---|
| ID | `T1..Tn`, unique, in creation order; never renumbered after Plan approval; a removed task keeps its ID out of use | `BAD_ID`, `DUPLICATE_ID` (gap → warning `ID_GAP`) |
| Title | Verb + object, one slice | `NO_TITLE` |
| AC | ≥ 1 active AC ID from the spec; every active AC has ≥ 1 task | `NO_AC`, `UNKNOWN_AC`, `UNCOVERED_AC` |
| Blocked by | Task IDs or `—`; no unknown IDs, no cycles, no self-dependency | `UNKNOWN_DEP`, `CYCLE` |
| Files | Every file created or modified, tests included, in backticks; a directory ends in `/`; a glob uses `*` | `NO_FILES` |
| Size | `Nh`, `Nd` (= 8h) or `Nm`; ≤ 8h | `BAD_SIZE`, `SIZE_BOUND` |
| Count | ≤ 15 tasks; more → split the spec into two specs (back to Specify) | `TASK_BOUND` |

**Blocked by** records a real dependency only: the task needs code, a schema or an interface another task creates. File overlap is not a dependency; `plan-graph` serializes it. Declaring false dependencies shrinks the frontier and slows the Build stage.

Show the table to the user and ask whether granularity and blocking edges are right before detailing tasks. A change in this step costs one table edit; a change after Phase 3 costs a rewrite.

### Phase 3 — Detail each task, then Impact and Dependencies

**Task subsections.** One `### Tn — <title>` per row, self-contained, with:

1. `**AC:** · **Blocked by:** · **Files:**` line, each file marked `(create)` or `(modify)`.
2. **Interface** in a fenced block: the exact function, endpoint or component signature with types, status codes and error bodies. The Interface is fixed here, before any code; a dependent task codes against it.
3. **Red** — test names that contain the AC ID, the exact run command and the expected failure line (`Expected: FAIL with ...`).
4. **Green** — the minimal implementation, the same command, `Expected: PASS (n tests)`.
5. **Refactor** — what changes; tests stay green.
6. **Commit** — conventional message with the trailer `Refs: Tn AC-n` (one line, every AC the task serves). `executing-plans`, `trace-check`† and `plan-graph --from-git` read this trailer.

Each step is one action of 2–5 minutes. Non-code tasks (docs, configuration, infrastructure) still get a verification command with an expected result (`terraform plan`, a validator, a dry run). Never write "add validation" without what is validated, the rule and the error returned.

**Impact (mechanism 7.5).** Fill `## Impact` from the code map, one row per module touched:

| Column | Source |
|---|---|
| Module | The code-map module whose `paths` glob matches each file in the Files column |
| Paths touched | The task files inside that module |
| Change | new file / modify (what) / delete |
| Dependents | Modules whose `depends_on` lists this module |
| Mapped tests | This module's `tests` globs plus the `tests` globs of its dependents |

Then write the **Regression scope** line: one command that runs the union of the Mapped tests. The Build stage runs it after every fix (scoped re-check, `references/loops.md`); the full DoD suite runs at loop exit and before the PR. A file that matches no module → **stop**, add the module to the code map (or extend a module's `paths`) in the same change, and re-run the code-map check before continuing. An empty Mapped tests set → the Regression scope is the full DoD suite.

**Dependencies (mechanism 11.3).** Each new package gets one row in `## Dependencies`: package, exact version (pinned, no range), license, last release date (≤ 12 months old), critical/high advisories (must be 0, from `npm audit`, `pip-audit` or `osv-scanner`), the audit command, lockfile committed (yes), typosquat check (name compared with the intended project's registry page), reason. A package failing any bound is replaced, or the row is accepted through a waiver (`references/governance.md`). No new package → `none — <reason>`. A dependency the Build stage adds without a row is a halt and an Important review finding.

**Risks.** One row per risk: likelihood (low/med/high), the mitigation inside this plan (a task, a test or a flag), and the role that accepts it.

**Header.** Path (copied from the spec), spec rev, ADR list, and the executor note. Goal (one sentence), Architecture (2–3 sentences), Tech stack with the DoD commands.

### Phase 4 — Validate with plan-graph (mechanism 7.2)

Run after every edit of the plan and once more before the approval request:

```bash
node <agentic-sdlc>/scripts/plan-graph.mjs specs/NNN-slug/plan.md --write
```

`plan-graph` parses the `## Tasks` table, reads the active AC IDs of the sibling `spec.md`, and:

- builds the DAG and fails on `CYCLE` or `UNKNOWN_DEP`;
- checks AC links both ways, the Files and Size columns, the 15-task bound, the Path (`PATH_QUICK`; `PATH_MISMATCH` when the plan's Path differs from the spec's), and the prose budget (`WORD_BOUND`: ≤ 3,000 words on Standard, ≤ 6,000 on Full, counted without code blocks, Loop ledger and Approvals);
- computes **waves**: wave = 1 + the highest wave among the task's blockers; then two tasks in the same wave whose Files overlap (same file, a directory prefix, or a glob prefix) are serialized — the higher ID moves to the next wave and the conflict is recorded;
- prints the plan hash, the waves, every conflict and the initial frontier, and writes `graph.json` (`nodes`, `edges` with `blocks` and `file-conflict` types, `waves`, `conflicts`, `initialFrontier`, `planHash`, `review`). A failing plan never writes `graph.json`.

Exit codes: 0 pass · 1 check failed · 2 plan or spec missing or unparsable. `--json` gives the same result machine-readable.

**Failure behaviour.** Exit 1 or 2 → fix the plan and re-run; never request Plan approval on a failing plan. Two fix attempts that leave the same error code → stop, report `BLOCKED` with the error lines, and route by cause: `UNCOVERED_AC` or `UNKNOWN_AC` that the plan cannot fix → spec defect → Specify stage (change protocol); `TASK_BOUND` → split the spec; `CYCLE` that survives re-slicing → design question for the Architect.

**CI.** The repository's CI runs `plan-graph --check` on every changed `specs/**/plan.md`: it fails with `GRAPH_STALE` when the committed `graph.json` differs from the regenerated graph and with `GRAPH_MISSING` when it is absent. Commit `plan.md` and `graph.json` together.

### Phase 5 — Plan approval and handoff

**Review count (rule K8).** One combined Spec + Plan review when the path is Standard **and** the plan has ≤ 5 tasks; otherwise two reviews (Spec approval first, then Plan approval). The Full path always holds them separately. `plan-graph` prints `review: combined` or `review: separate`; use that value.

**Request.**

1. Append a row to `specs/NNN-slug/approvals.md` (`Requested at`, UTC minute, asked role).
2. Present: the task table, the waves and conflicts from `plan-graph`, the Impact table and Regression scope, the Dependencies section, the open Risks, and the plan hash. A combined review also presents the spec (rev, `spec-lint` result, critique result).
3. Ask the Tech Lead: "Approve plan rev N (hash `<planHash>`) for the Build stage? Reply yes or list changes." A combined review asks the Product Owner about the spec in the same message. **End the turn.**

**Record.** Only an explicit "yes" or "approved" from the named role in a later turn counts. Write the row in `plan.md` `## Approvals`:

```markdown
| Spec + Plan (combined) | 1 | 4da2f0c5aea8 | 1 | 2aef8f23fc84 | 2026-11-23 15:10 | Tech Lead | D. Okafor | "Approved. Plan rev 1, five tasks, go." | plan-graph exit 0; spec-lint exit 0 | Export alert untested until staging | approved |
```

A combined review records two rows from one request: the Product Owner's answer in `spec.md`, the Tech Lead's answer in `plan.md`, both with Approval `Spec + Plan (combined)` and the same spec hash. Fill `Answered at` and `Exact words` in `approvals.md`. ADRs referenced by the plan move from *Proposed* to *Accepted*. Then confirm the binding:

```bash
node <agentic-sdlc>/scripts/plan-graph.mjs specs/NNN-slug/plan.md --check --check-approval
```

`--check-approval` fails with `APPROVAL_VOID` (plan hash differs), `APPROVAL_SPEC_VOID` (spec changed after approval), `APPROVAL_REV` (approved rev ≠ latest Revision log rev), `APPROVAL_FIELD` (role, person or exact words empty) or `COMBINED_NOT_ALLOWED` (combined row on Full or with > 5 tasks).

**Hash rule.** The plan hash is the first 12 hex characters of SHA-256 over `plan.md` without `## Approvals` and `## Loop ledger`. Ledger rows appended during Build never void the approval; any other edit does. A void approval runs the change protocol (`references/rules.md`): impact on AC, tasks and tests → Revision log row N+1 → `plan-graph` → a new request. A void Spec approval also voids the Plan approval built on its hash.

**Handoff.** Hand `plan.md` and `graph.json` to `executing-plans` (Build stage). The Build stage dispatches waves in order and, within a wave, the **frontier**: ready tasks (all blockers committed) with pairwise disjoint Files, at most 3 at once, each in its own worktree; tasks deferred by a file conflict run in the next dispatch. The current frontier at any time:

```bash
node <agentic-sdlc>/scripts/plan-graph.mjs specs/NNN-slug/plan.md --from-git main..HEAD
```

`--from-git` marks a task done when a commit in the range carries `Refs: Tn`. A platform without subagents runs the tasks sequentially in wave order.

### Loop ledger (mechanism 6.3)

The plan carries a `## Loop ledger` table that the Build and Test stages fill from `run-ledger render` (`agentic-sdlc/references/loops.md`): one row per failed round, per round that fixed a failure, per ruling and per halt — date, task, loop (red-green, build-test, review-fix, debug), round, failure signature (first failing test + first error line), cause (spec, design, plan, code, test, env, unknown), what was tried, result (failed, fixed, escalated). A second `unknown` cause on one task is treated as `design`. The same signature in 2 consecutive rounds, or 3 failed fixes on one task, sets the result `escalated` and sends a design question to the Architect. Waves are the `plan-graph` frontier waves in `graph.json`, not a loop: a red DoD after merging a wave's worktrees is a `build-test` round on the task whose files the failure names. Leave the table empty at Design; never delete rows.

## Standalone Mode

For requirements outside the Agentic SDLC (no `specs/` folder):

1. Save the plan to `docs/plans/YYYY-MM-DD-<feature>.md` from the same template; replace the Spec reference with the requirement source and number the requirements `AC-1..AC-n` in a `## Requirements` list at the top.
2. Validate with `plan-graph <plan> --no-spec --write --out docs/plans/YYYY-MM-DD-<feature>.graph.json`. `--no-spec` skips the AC existence and coverage checks; every other rule applies.
3. Ask the requester for approval with the same record fields; a combined review does not apply.

## Critical Rules

- **NEVER** write a plan against a spec without a valid Spec approval on Standard or Full; report `BLOCKED: Spec approval missing or void`.
- **NEVER** request Plan approval while `plan-graph` exits non-zero, and never edit `graph.json` by hand.
- **NEVER** leave a step abstract: every step names files, interface, command and expected output.
- **NEVER** slice horizontally by layer except for wide refactors sequenced expand → migrate → contract.
- **NEVER** add a task that serves no AC; a prefactor lists the AC it enables. Scope outside the spec is a spec change.
- **NEVER** renumber task IDs after Plan approval.
- **NEVER** add a package without a `## Dependencies` row inside the bounds of mechanism 11.3.
- **ALWAYS** fill `## Impact` from the code map; a file outside every module stops the plan until the map is updated.
- **ALWAYS** use one combined Spec + Plan review on Standard with ≤ 5 tasks and two reviews otherwise.
- **ALWAYS** end the turn after the approval request; only a later explicit "yes"/"approved" counts.
- **ALWAYS** keep secrets and real personal or client data out of plans, fixtures and examples.

## Example Usage

**1. Standard path, combined review.**
> "Spec 001-csv-export rev 1 is approved — write the plan."

Reads the spec (AC-1..AC-4, R=1 money) and the code map, writes five tasks: T1 serializer with formula escaping (AC-2), T2 permission (AC-3), T3 export route with the 50,000-row limit (AC-1, AC-4; blocked by T1, T2), T4 column format (AC-1; blocked by T1), T5 Export button (AC-1; blocked by T3). `plan-graph --write` prints `W1 T1 T2 · W2 T3 · W3 T4 T5` and one conflict: T4 shares `server/test/routes/reports/export.test.ts` with T3, so T4 moves to wave 3. Impact lists five modules and the Regression scope command. Five tasks on Standard → one combined review; the Tech Lead answers "Approved. Plan rev 1, five tasks, go." (worked example: `agentic-sdlc/examples/worked-example/specs/001-csv-export/`).

**2. Coverage gap.**
> `plan-graph` prints `FAIL UNCOVERED_AC: AC-4 has no task`.

Adds T6 "Refuse exports above the row limit" with its Files and Size, re-runs `plan-graph` (exit 0). Six tasks → `review: separate`: the Product Owner approves the spec first, then the Tech Lead approves the plan in a second request.

**3. Wide refactor.**
> "Plan renaming `customer_id` to `account_id` across the monorepo."

T1 expand (add `account_id`, dual-write), T2–T6 migrate one package each (blocked by T1), T7 contract (blocked by T2–T6). `plan-graph` puts T2–T6 in wave 2; a frontier of 3 runs T2, T3, T4 first, then T5, T6. Each migrate task has a green-build verification.

**4. Module missing from the code map.**
> A task adds `server/src/billing/invoice.ts`; no code-map module matches it.

Stops the Impact section, adds module `api-billing` (paths, depends_on, tests, owner) to `docs/codemap.md`, re-runs the code-map check, then completes Impact and asks for approval.

**5. Standalone plan.**
> "No spec — plan moving the worker from cron to a queue, to run tomorrow in a fresh session."

Writes `docs/plans/2026-11-24-worker-queue.md` with requirements AC-1..AC-3, tasks with `terraform plan` verification and a flag-gated dual-run task, runs `plan-graph --no-spec --write --out docs/plans/2026-11-24-worker-queue.graph.json`, and hands off to `executing-plans`.

Sources: task-graph and slicing conventions adapted from Superpowers `writing-plans` (MIT), Matt Pocock `to-tickets` (MIT) and Addy Osmani `planning-and-task-breakdown` (MIT).

† Added in a later release; manual fallback in `agentic-sdlc/references/artifacts.md` §Later-release files.
