---
name: executing-plans
description: This skill should be used when an approved plan (specs/NNN-slug/plan.md or docs/plans/*.md) must be executed or an interrupted Build run resumed — test-first tasks via fresh Developer subagents or inline, per-task spec-then-quality review, bounded fix loops with escalation rulings, a run ledger copied into the PR, preflight, worktree isolation, file-disjoint parallel tasks and unattended runs (the Build stage of the Agentic SDLC). Not for one test-first task on its own (use test-driven-development), writing the plan (use writing-plans), or a failure whose cause is unknown (use systematic-debugging).
license: MIT
---

# Executing Plans

## Purpose

**Agentic SDLC · Build stage.** Used by the Developer agent (`../agentic-sdlc/agents/developer.md`) for each task, by the Scrum Master (the router, `../agentic-sdlc/agents/scrum-master.md`) as the controller that dispatches, routes failures and holds checkpoints, and by the Reviewer role (`../agentic-sdlc/agents/reviewer.md`) for the per-task review before a dependent task starts.

Execute an approved plan task by task and finish with a pull request whose every claim is backed by fresh output. Each task runs test-first, passes a two-part review (spec compliance, then quality) in a context that did not write it, and commits with `Refs: Tn AC-n`. Every failed round goes into the run ledger; every loop stops at a numeric bound and escalates to a named human role; no task is done without its Definition of Done (DoD) output. The ledger rows end up in the plan and the PR.

Contracts applied (never contradicted, cited by path): `../agentic-sdlc/references/tdd.md` (per-task cycle), `../agentic-sdlc/references/loops.md` (loop catalogue, routing, breakers B1–B6, rulings, ledger), `../agentic-sdlc/references/verification.md` (evidence), `../agentic-sdlc/references/review.md` (severities, receive mode, re-review), `../agentic-sdlc/references/phase-boundaries.md` (context isolation), `../agentic-sdlc/references/autonomous.md` (unattended runs), `../agentic-sdlc/references/rules.md` and `../agentic-sdlc/references/governance.md` (change protocol, authority, waivers).

## When to Use

- An approved `specs/NNN-slug/plan.md` (Standard or Full path) or a `docs/plans/*.md` plan from `writing-plans` exists and Build has not finished.
- A Build run stopped (session end, compaction, halt, escalation) and must resume from its ledger.
- The human asks to "run unattended" on an approved plan, or to run the plan with subagents or in parallel.
- The router hands over a Quick item for implementation (one cycle, no plan: §Quick path).

Not for:
- Writing or changing the plan → `writing-plans` (Planner, Design stage).
- The test-first discipline of one change in isolation → `test-driven-development`.
- Root-causing a failure after B1 → `systematic-debugging` (this skill records its rounds).
- The multi-lens PR review in the Test stage → `multi-axis-code-review`; the evidence gate → `verification-gate`.
- Release notes, runbook, hand-over → `shipping-and-handover`.
- Choosing the stage or path → the `agentic-sdlc` router.

## Progress Tracking

Show the gauge before each batch and at every checkpoint, with the task count from the plan:

```text
[████░░░░░░░░░░░░░░░░] 20% — Step 1: Plan reviewed, preflight green · Mode: subagent · attended · enforced (run r1)
[████████░░░░░░░░░░░░] 40% — Step 4: Batch 1 · T1, T2 · 2/5 tasks done · 1 review round failed, fixed
[████████████░░░░░░░░] 60% — Step 4: Batch 2 · T3 · 3/5 done
[████████████████░░░░] 80% — Step 6: Final DoD and PR body
[████████████████████] 100% — Step 6: PR ready for human review
```

## Workflow

`<scripts>` below is the directory holding `run-ledger.mjs`, `preflight.mjs` and `plan-graph.mjs`, found in Step 0.

### Step 0 — Discovery

1. **Plan.** The path the human named; otherwise glob `specs/*/plan.md` and `docs/plans/*.md`, keep those whose tasks are not all committed (`git log --format=%B | grep "Refs: T"`), ask which one when more than one remains. None → `NEEDS_CONTEXT`: ask for the path or offer `writing-plans`.
2. **Scripts.** Look in this order: `.agentic-sdlc/bin/` (vendored by `project-context`), `skills/agentic-sdlc/scripts/` in the repository, `../agentic-sdlc/scripts/` next to this skill, then `**/agentic-sdlc/scripts/run-ledger.mjs` under the platform skill directories (`~/.claude/skills`, `~/.copilot/skills`, `~/.codex/skills`, `~/.agent/skills`, `~/.gemini/skills`, `~/.cursor/skills`, `~/.adal/skills`). Found and `node --version` ≥ 18 → **enforced**. Otherwise **prompt-only**: the same rules from the Markdown, ledger rows by hand in `plan.md` `## Loop ledger`, PR header `Enforcement: prompt-only` (`references/modes.md` §6).
3. **DoD.** The fenced `sdlc-dod` block in `AGENTS.md` (`lint`, `typecheck`, `test`, `coverage`, `coverage_min`). Missing → `NEEDS_CONTEXT`; propose a block from `package.json`, `Makefile`, `pyproject.toml` or the CI workflow and wait for the human to confirm it.
4. **Approvals.** Method plan: `node <scripts>/plan-graph.mjs <plan> --check-approval` exits 0; exit 1 (hash void or row missing) → `BLOCKED`, change protocol (`../agentic-sdlc/references/rules.md`). A `docs/plans/` plan without approvals → ask once "Approve this plan for execution? (yes/no)" and record the exact words in the run report; no explicit yes → stop.
5. **Mode.** Three independent choices (`references/modes.md`): dispatch **subagent** (platform can start fresh agents) or **inline**; attention **attended** (default) or **unattended** (the human said "run unattended", entry checks in Step 7); enforcement from item 2. Parallel tasks need subagent + attended + enforced (`references/parallel-tasks.md`). Print the choice as one line.

### Step 1 — Review the plan, isolate, start the run

1. **Read the plan critically before any code.** Every task row has an ID, ≥ 1 AC that exists in the spec, `Blocked by`, Files (tests included) and a size ≤ 1 day; each `### Tn` subsection names its interface signature. A missing signature, an empty Files list, an AC the spec lacks, or two tasks in one wave editing the same file without a `conflict:` line from plan-graph → list them as one numbered list and wait. Never repair the plan silently: a plan edit voids the Design sign-off.
2. **Isolate** (`references/resume-and-isolation.md` §1). Attended → `git switch -c feat/NNN-slug` or confirm the current feature branch. Unattended → `run-ledger start --mode unattended` creates the worktree. Never commit on the default branch. Record `BASE=$(git rev-parse HEAD)`.
3. **Start the ledger and preflight** (enforced):

```bash
node <scripts>/run-ledger.mjs start --run r1 --plan specs/001-csv-export/plan.md --mode attended --base "$BASE"
node <scripts>/preflight.mjs --run r1 --plan specs/001-csv-export/plan.md --mode attended
```

Preflight checks Node, a clean tree, a non-default branch, isolation, the DoD tools, approvals, the ledger and a green baseline DoD. Exit 1 → fix the named check or report `BLOCKED` with it; `task --state started` is refused until a preflight passes. A red baseline is never "fixed" by the first task: report it and wait. Acceptance tests stay on `at/NNN-slug` during Build; never merge that branch before Step 6.

4. **Order.** `node <scripts>/plan-graph.mjs <plan> --from-git "$BASE"..HEAD` prints `waves:`, `conflict:` lines and `frontier (max 3):`. Without the script: table order, skipping tasks whose `Blocked by` tasks lack a `Refs: Tn` commit.

### Step 2 — Run one task (the Developer)

Subagent mode: dispatch a fresh Developer with `prompts/developer.md` filled for the task (row, subsection, AC text, Files, DoD block, BASE, run ID; a docs task goes to the Tech Writer with the same brief). Inline mode: run the same brief here after re-reading the task row and `run-ledger status --run r1`. The cycle follows `../agentic-sdlc/references/tdd.md`:

1. `run-ledger task --run r1 --task T3 --state started` (sequential mode: the Developer writes its own events; parallel waves: the controller writes them).
2. **Red.** One test named after its AC (`AC-4 more than 50,000 rows returns 422`); run it; it fails for the expected reason (the missing behaviour, not an import error); paste the output. `run-ledger red --run r1 --task T3 --test "AC-4 more than 50,000 rows returns 422" --signature "expected 200 to equal 422"`. A test that passes on its first run proves nothing: rewrite it. A task with no executable behaviour records `--no-red "<reason>"` at done.
3. **Green.** Minimal code; run the test; `round --run r1 --task T3 --loop red-green --result pass`.
4. **Refactor** with the tests green; mocks only at process boundaries; no abstraction without ≥ 2 call sites.
5. **Scope guard.** A file outside Files → stop, `NEEDS_CONTEXT: file <path> not in Files`. > 3 such files, a manifest or lockfile change not in Files, or a path-bound overrun → stop, re-plan, new approval. `run-ledger check --run r1` at each task boundary detects these plus secrets and approval drift.
6. **Exit.** Full DoD block once, on a committed clean tree; record evidence (`../agentic-sdlc/references/verification.md` §4: command, exit code, fingerprint). Commit:

```text
feat(export): stream rows with the 50,000-row limit

Refs: T3 AC-1 AC-4
```

7. **Report** with one status (`prompts/developer.md` §Report, ≤ 15 lines): `DONE` · `DONE_WITH_CONCERNS` · `BLOCKED` · `NEEDS_CONTEXT` · `CANNOT_VERIFY`. A `DONE` is a claim: the controller re-runs the AC test, compares `git diff --stat "$BASE"..HEAD` with Files and checks the red event before accepting it.

### Step 3 — Fix loop: every failure is a round

Load `references/fix-loop-and-escalation.md` at the first failed round. Before each round read the ledger (`run-ledger status --run r1`): round number per loop, signatures seen, approaches tried. Then:

1. **Classify the cause** in this order: `spec` → `design` → `plan` → `env` → `test` → `code` → `unknown`. The cause routes the work: `code`/`test` stay in Build; `env` → preflight must pass again before the next task start; `spec` → Specify (Product Owner); `design`/`plan` → Design (Tech Lead); a 2nd `unknown` on the task → treated as `design`. A debug round records the cause class of its hypothesis (`code`, `test` or `env`), never `unknown`.
2. **Choose an approach not already tried in this loop** (a repeat is refused, exit 1). Fix inside Files.
3. **Scoped re-check:** the failing check plus the tests mapped to each touched file in `docs/codemap.md` or the plan's `## Impact`; nothing mapped → full suite. The full DoD runs at loop exit only.
4. **Record:** `round --run r1 --task T3 --loop build-test --result fail --signature "export.test AC-4: expected 200 to equal 422" --cause code --tried "count rows before opening the stream"`.

**Bounds (failed rounds per loop per task; exit 3 = stop):**

| Loop | Bound | Breaker → owner |
|---|---|---|
| red-green | 3 | B1 → debug loop (`systematic-debugging`), automatic |
| debug | 3 refuted hypotheses | B5 → Architect |
| build-test | 5 (lower with `budgets.max_rounds`) | B3 → Tech Lead |
| review-fix | 3 | B4 → Tech Lead |
| any build-test/review-fix | same normalized signature twice in a row, or 3 failed build-test fixes since the last ruling | B2 → Architect |
| any | cause `spec`/`design`/`plan`, or `unknown` twice | B6 → Product Owner (spec) or Tech Lead |

At exit 3, print the five-line escalation brief `run-ledger` prints, add one line of verifiable evidence, end the turn and wait. Record the human's words: `run-ledger ruling --run r1 --task T3 --decision split --by "Architect: M. Silva" --note "count and stream as separate tasks"`. Allowed rulings per breaker and their effect (split → Planner + new Design sign-off; drop → spec revision; reroute → the stage named by the cause): `references/fix-loop-and-escalation.md` §5–§7. A platform without a stronger model may spend one fresh-context round before B2 or B3; it counts toward the bound.

### Step 4 — Per-task review (spec compliance, then quality)

After the controller accepts a `DONE`, and before any task that depends on it starts:

1. Dispatch a fresh reviewer with `prompts/task-reviewer.md`: the diff `<BASE>..<HEAD>` for the task, the task row, the AC text, Files and the AC test commands. Never the Developer's reasoning. Inline: a pass labelled `self-review` from a cleared context.
2. **Pass 1 — spec compliance:** each AC has a test asserting its Then clause; the code implements it; nothing is Missing or Misunderstood (Critical) and nothing Extra (Important). **Pass 2 — quality:** correctness on edge cases, test anti-patterns A1–A14, security on touched code, signature versus plan.
3. Only `confirmed` findings get a severity: **Critical** (AC violated, data lost, exploitable weakness, secret, failed DoD or AC command, weakened check), **Important**, **Minor**. Finding IDs `F-Tn-k`.
4. Record the round: `round --run r1 --task T3 --loop review-fix --result fail --signature "F-T3-1 filename from q unescaped" --cause code --tried "initial implementation a1b2c3d"` (fail = ≥ 1 confirmed Critical open), else `--result pass`.
5. **Fix round:** the same Developer when the platform can continue it, else a fresh one with the fix-round variant of `prompts/developer.md`; receive mode (verify, then `fixed <sha>` · `rejected <evidence>` · `deferred <issue>`; Critical never deferred); commits `Refs: T3 AC-4 F-T3-1`.
6. **Re-review** with `prompts/re-review.md` on `<FIX_BASE>..HEAD`: each fixed finding `resolved` or `still applies`, regressions in the delta only; a delta > 30% of the task diff → full task review. Record the next review-fix round.
7. PASS with open Important findings → fix inside Files, or close the task `DONE_WITH_CONCERNS` and copy each into the PR `## Review triage`. Minor → deferred list.

Per-task review rounds and Test-stage review rounds share the task's review-fix counter: 2 failed per-task rounds plus 1 failed PR round fire B4.

Then `run-ledger task --run r1 --task T3 --state done --commit <sha>` (refused without a red event or `--no-red`, or after a failed last round), and copy the new `run-ledger render --run r1` rows into `plan.md` `## Loop ledger` (excluded from the plan hash; rows are appended, never edited).

### Step 5 — Batches, parallel tasks and checkpoints

**Sequential (default).** Take the next frontier task, Steps 2–4, repeat. A batch is ≤ 3 tasks.

**Parallel.** Allowed only when every condition in `references/parallel-tasks.md` §1 holds: subagent + attended + enforced, ≤ 3 frontier tasks with pairwise disjoint Files (tests, fixtures, manifests and lockfiles included), no interface edge and no wave conflict between them. Each task gets its own worktree from the feature branch tip (`git worktree add ../<repo>-001-T4 -b feat/001-csv-export-T4`); all Developers are dispatched in one step; the controller is the only ledger writer during the wave. Integration: merge task branches into the feature branch in task-ID order with `git merge --no-ff`, full DoD after **each** merge; a conflict or a red DoD stops the wave and the rest runs sequentially. Unattended runs never run tasks in parallel.

**Checkpoint (attended).** After each batch, or each task when the human asked or the task touches a risk trigger: show the gauge, each task's status line, the last ≤ 20 lines of the DoD output and the new ledger rows; ask `Batch 2 done: T3 committed (2 review rounds). Continue with T4, T5?` and end the turn. Silence is not a "continue". Feedback that changes a task, Files or an AC is a plan change: change protocol, `plan-graph --write`, new Design sign-off, then resume.

**Context hygiene.** Inline at ≥ 70% context or ≥ 2 tasks done in one context → finish the green run, write the ledger rows, Clear or write `specs/NNN-slug/handoff.md` (`../agentic-sdlc/references/phase-boundaries.md`).

### Step 6 — Finish the branch

1. Every task `done` (or closed by a `split`, `handover` or `drop` ruling) → run the full DoD once more on the final tree; stale evidence (fingerprint differs) is re-run, never reused.
2. `run-ledger finish --run r1` → `DONE` (exit 0) · `BLOCKED` (exit 1) · `NEEDS_HUMAN` (exit 3); commit the archived `specs/NNN-slug/run-ledger.jsonl` as `chore: archive run ledger r1`.
3. Write the PR body from `../agentic-sdlc/templates/pr-body.md`: Summary, Verification (one row per AC: command, exit code, fingerprint; `CANNOT_VERIFY` rows), Trace, the full `run-ledger render --run r1` table under `### Loop ledger` (rulings and halts included), `DONE_WITH_CONCERNS` items under `## Review triage`, every `self-review` label, Waivers.
4. Attended: push the feature branch and open the PR only after the human says so. Never merge into the default branch, deploy or tag. `at/NNN-slug` joins the feature branch in the Test stage, once green (`../agentic-sdlc/references/verification.md` §2). Hand off to the Test stage (`multi-axis-code-review`); its findings return in receive mode as review-fix rounds on the task they cite.
5. Report: PR link or branch, run result, tasks done, failed rounds per loop, rulings, open concerns. Clean up worktrees only after the rulings and evidence are in the PR (`references/resume-and-isolation.md` §7).

### Step 7 — Unattended mode

Entry only on the words "run unattended" for a named `specs/NNN-slug/plan.md` on the Standard or Full path, with valid Specify and Design sign-offs and enforced mode. Anything missing → `REFUSED` with the missing items named; stay attended. Load `../agentic-sdlc/references/autonomous.md` before the first command.

```bash
node <scripts>/run-ledger.mjs start --run r2 --plan specs/007-rate-limit/plan.md --mode unattended
cd ../<repo>-sdlc-r2 && node <scripts>/preflight.mjs --run r2 --plan specs/007-rate-limit/plan.md --mode unattended
```

Sequential, graph order. Per task: `check` → `task started` → red → rounds → per-task review → DoD → commit → `task done` → `check`. No checkpoints; the run stops at the first halt (`run-ledger halt --reason`): `loop-bound`, `path-escalation`, `spec-design-cause`, `dependency-added`, `secret-detected`, `out-of-plan-files` (> 3 files), `red-baseline`, `approval-void`, `budget` (15 tasks, 5 build-test rounds per task, 4 active hours, 300 turns, tokens when configured) or `authority` (push, merge, deploy, release, tag, secret access, destructive command). Halt → `NEEDS_HUMAN`, stop at once, print the brief. Never push. `finish` writes the run result; the human reviews, pushes and opens the PR.

### Step 8 — Resume

Load `references/resume-and-isolation.md` §3. New session, compaction or resolved halt: `run-ledger resume --run r1` (with `--ack "<name>: <decision>"` after a halt, plus the task ruling for a breaker halt) → `preflight --run r1 …` → `plan-graph --from-git "$BASE"..HEAD` to cross-check ledger and trailers → continue at the first task not `done`. Ledger and git disagree → `NEEDS_HUMAN`. Without a ledger: done = tasks with a `Refs: Tn` commit whose AC test passes now; rounds = the plan's Loop ledger rows. Dirty tree after a crash → save a WIP patch under `.agentic-sdlc/runs/<id>/`, restore, preflight, re-apply (§5 of the reference). Attended: confirm in one line, `T1–T3 done, T4 open with 2 failed build-test rounds. Resume at T4?`

### Quick path

No `plan.md`: one cycle driven by the issue's acceptance test, inline, attended. Commits carry `Refs: AC-n`. The run ledger is optional; without it, keep the rows by hand in the PR `### Loop ledger` with Task = `AC-n`. Same bounds and breakers. A risk trigger or a growing scope → stop and ask the router to escalate the path.

### Error Handling

| Error | Action |
|---|---|
| Plan not found | List `specs/*/plan.md` and `docs/plans/*.md`; ask for the path |
| Approval hash void (`plan-graph --check-approval` exit 1) | `BLOCKED`; change protocol, new approval row |
| Preflight FAIL | Report the failing check; fix the environment; re-run preflight |
| Subagent silent 30 minutes | `BLOCKED: agent lost`; keep its worktree; re-dispatch once with "inspect `git status` first" |
| Script exit 2 (corrupt ledger, bad input) | `NEEDS_HUMAN`; repair from git history; never hand-edit events |
| Script exit 3 (bound, halt) | Print the brief; end the turn; record the ruling before any further round |
| Merge conflict in a parallel wave | `git merge --abort`; remaining tasks sequential; cause `plan` to the Planner |

## Anti-rationalization

| Thought | Reality |
|---|---|
| "Skip the per-task review, the PR review will catch it" | A dependent task built on an unreviewed one multiplies the rework; the per-task gate exists so the PR review finds little |
| "The subagent said DONE, move on" | A report is testimony; re-run the AC test and read the diff stat first |
| "One more round will fix it" | The bound is the count of failed rounds in the ledger, not a feeling; at the bound, escalate |
| "Same error, but this fix is different" | Same normalized signature twice = B2; the approach is not converging |
| "Merge all the task branches, run the DoD once" | One DoD run per merge shows which task broke the build |
| "These tasks barely share a file" | Shared file, manifest or lockfile → same wave forbidden |
| "The plan is slightly wrong; fix it inline" | A plan edit voids the Design sign-off; change protocol first |
| "Lower `coverage_min` this once" | Never lowered; add tests or ask for a waiver |
| "The reviewer is the same session, call it independent" | Inline review is labelled `self-review` in every place it appears |

## Critical Rules

- **NEVER** write production code before a failing test for it has run and its output is recorded.
- **NEVER** report a task `DONE` without DoD output bound to the current fingerprint, or accept a subagent's `DONE` without re-running its AC test.
- **NEVER** start a task that depends on a task whose per-task review has not passed.
- **NEVER** run a loop past its bound or repeat an approach the ledger records for that loop; at exit 3, escalate and wait for a recorded ruling.
- **NEVER** weaken, skip or delete a test, assertion, lint rule, threshold or `coverage_min`; never edit acceptance tests.
- **NEVER** edit `spec.md` or `plan.md` content during Build without the change protocol; only `## Loop ledger` rows are appended.
- **NEVER** run tasks in parallel unless their Files are pairwise disjoint and the run is subagent, attended and enforced; never in unattended mode.
- **NEVER** let a Developer or reviewer start subagents; never build on the default branch; never merge, deploy, tag or read secrets; never push in unattended mode.
- **ALWAYS** commit with `Refs: Tn AC-n` (fix commits add `F-Tn-k`; Quick uses `Refs: AC-n`).
- **ALWAYS** copy ledger rows into the plan at each task exit and into the PR `### Loop ledger` at the end.
- **ALWAYS** stop at an attended checkpoint and wait for an explicit continue.

## Example Usage

1. **Attended subagent build.** "Execute `specs/001-csv-export/plan.md`." → scripts found, preflight green on `feat/001-csv-export`, `Mode: subagent · attended · enforced (run r1)`. plan-graph: waves `W1 T1 T2 · W2 T3 · W3 T4 T5`. T1 and T2 have disjoint Files → two Developers in parallel worktrees; both report `DONE`; per-task reviews pass; merged with `--no-ff` in ID order, DoD green after each merge. Checkpoint: "Batch 1 done: T1, T2 committed. Continue with T3?"
2. **Review round fails, then passes.** T3's reviewer confirms F-T3-1 (Critical: Content-Disposition filename built from the `q` filter, unescaped) → review-fix round 1 `fail`, cause `code`; the Developer fixes it in `Refs: T3 AC-1 F-T3-1`; re-review on the fix delta: `resolved`, no regressions → round 2 `pass`; `task done`; rows copied into the plan.
3. **Pressure: "skip review, just merge all tasks".** → Refuse the shortcut and name the cost: T4 and T5 depend on reviewed work, and merging is the human's step after the Test sign-off. Offer what is allowed: per-batch instead of per-task checkpoints, parallel T4/T5 (disjoint Files), and a single PR at the end. Per-task reviews still run; no merge is performed.
4. **Anti-thrash.** T3's DoD fails twice with `export.test AC-4: expected 200 to equal 422` → `round` exits 3 with B2 and the brief; the turn ends; the Architect answers "split counting into its own task" → `ruling --decision split --by "Architect: M. Silva"` → the Planner splits T3 into T6/T7, `plan-graph --write`, new Design sign-off, new run r2.
5. **Unattended run and resume.** "Run unattended on 007-rate-limit." → approvals valid → worktree `../app-sdlc-r2` on `sdlc/007-r2`; after T4, `check` finds `package.json` changed outside Files → halt `dependency-added`, `NEEDS_HUMAN`. Next morning the Tech Lead approves the dependency note; `resume --run r2 --ack "J. Park: lodash 4.17.21 approved"` → preflight → T5 continues.

## References

| File | Load when |
|---|---|
| `references/modes.md` | Step 0 mode choice; a dispatch switch mid-run; the platform lacks subagents or Node |
| `references/fix-loop-and-escalation.md` | The first failed round of a task; every review round; any `run-ledger` exit 3; writing a brief or recording a ruling |
| `references/resume-and-isolation.md` | Step 1 isolation; any resume, compaction or halt; a dirty tree at preflight; cleanup |
| `references/parallel-tasks.md` | Two or more frontier tasks in an attended subagent run |
| `prompts/developer.md` | Each task dispatch and each fix round |
| `prompts/task-reviewer.md` | Each per-task review after an accepted `DONE` |
| `prompts/re-review.md` | Each review round after fixes |
| `../agentic-sdlc/references/loops.md` · `tdd.md` · `review.md` · `autonomous.md` | The contracts; on any doubt about a bound, a status or a severity |
| `../agentic-sdlc/templates/plan.md` · `pr-body.md` | Reading the Tasks table; writing the Loop ledger and the PR |

Sources: batch execution, fresh-subagent dispatch, two-verdict task review and bounded fix loops adapted from Superpowers `executing-plans` and `subagent-driven-development` (MIT, Jesse Vincent); incremental implementation from Addy Osmani's agent-skills (MIT); HALT and resume-by-status from BMad Method dev story (MIT); task-graph frontier and worktrees from Matt Pocock's skills (MIT). Full table in `README.md`. Text is original.
