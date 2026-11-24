---
name: executing-plans
description: This skill should be used when an approved implementation plan (specs/NNN-slug/plan.md or docs/plans/*.md) is ready to execute — the Build stage of the Agentic SDLC, running each task test-first with bounded fix loops, a run ledger, review checkpoints, inline or subagent dispatch, and an unattended mode.
license: MIT
---

# Executing Plans

## Purpose

Execute an approved plan task by task and finish with a pull request whose every claim is backed by fresh output. Each task runs test-first (red → green → refactor), every failed round is recorded in a ledger, every fix loop stops at a numeric bound and escalates to a named human role, and no task is reported done without its Definition of Done (DoD) output.

The skill is the Build stage of the Agentic SDLC. Rules it applies live in the `agentic-sdlc` skill: `references/tdd.md` (per-task cycle), `references/loops.md` (bounds, routing, escalation), `references/autonomous.md` (unattended runs), `references/verification.md` (evidence). In the commands below, `<agentic-sdlc>` is the installed `agentic-sdlc` skill directory (for example `~/.claude/skills/agentic-sdlc`).

## When to Use

- An approved `specs/NNN-slug/plan.md` (Standard or Full path) or a `docs/plans/*.md` plan from `writing-plans` exists and Build has not finished.
- A Build run was interrupted (session end, compaction) and has to resume from its ledger.
- The user asks to "run unattended" on an approved plan.

Not for: writing the plan (`writing-plans`), a Quick-path change with no plan (the issue's acceptance test drives it through `references/tdd.md`), or reviewing a PR (the Reviewer agent in `agentic-sdlc`).

## Progress Tracking

Show the gauge before each batch and at every checkpoint, with the task count from the plan:

```
[████░░░░░░░░░░░░░░░░] 20% — Step 1: Plan loaded, preflight green
[████████░░░░░░░░░░░░] 40% — Step 3: Batch 1 · T1–T3 · 3/8 tasks done
[████████████░░░░░░░░] 60% — Step 3: Batch 2 · T4–T6 · 6/8 tasks done
[████████████████░░░░] 80% — Step 5: Final DoD and PR body
[████████████████████] 100% — Step 6: PR ready for human review
```

## Workflow

### Step 0 — Discovery

1. Locate the plan: the path the user named; otherwise glob `specs/*/plan.md` and `docs/plans/*.md`, list those whose tasks are not all committed (`git log --format=%B | grep "Refs: T"`), and ask which one when more than one matches. None found → `NEEDS_CONTEXT`: ask for the path or offer `writing-plans`.
2. Locate the scripts: glob `**/agentic-sdlc/scripts/run-ledger.mjs` under the platform skill directories (`~/.claude/skills`, `~/.copilot/skills`, `~/.codex/skills`, `~/.agent/skills`, `~/.gemini/skills`, `~/.cursor/skills`, `~/.adal/skills`) and the repository. Found and `node --version` ≥ 18 → **enforced mode**. Otherwise → **prompt-only mode**: the same rules from the Markdown, the Loop ledger kept by hand in the plan, and the PR states `enforcement: prompt-only`.
3. Read the DoD block: the fenced `sdlc-dod` block in `AGENTS.md` (`lint`, `test`, `coverage_min` and the other commands). Missing → `NEEDS_CONTEXT`; propose a block built from `package.json`, `Makefile`, `pyproject.toml` or the CI workflow, and wait for the human to confirm it.
4. Check approvals. Agentic SDLC plan: `plan-graph <plan> --check-approval` must exit 0; exit 1 (hash void or missing row) → `BLOCKED`, run the change protocol in `references/rules.md`. A `docs/plans/` plan without an Approvals section → ask once "Approve this plan for execution? (yes/no)" and record the exact words in the run report; no explicit yes → stop.
5. Choose the mode: **attended** (default) or **unattended** (the user said "run unattended"; §Unattended mode). Choose dispatch: **subagent** when the platform can start fresh agents, otherwise **inline**.

### Step 1 — Review the plan and start the run

1. Read the plan critically before any code: every task has an ID, the ACs it serves, Files, an interface signature and `Blocked by`. A task without a signature, without Files or with an AC the spec lacks → raise it now, as one numbered list, and wait. Never repair the plan silently: a plan edit voids its approval.
2. Isolation: never build on the default branch. Attended → `git switch -c feat/NNN-slug` (or confirm the current feature branch). Unattended → `run-ledger start` creates the worktree.
3. Start the ledger and the preflight (enforced mode):

```bash
node <agentic-sdlc>/scripts/run-ledger.mjs start --run r1 --plan specs/007-rate-limit/plan.md
node <agentic-sdlc>/scripts/preflight.mjs --run r1
```

Preflight checks Node, a clean tree, a non-default branch, the tools the DoD names, approval hashes and a green baseline DoD. Any FAIL → exit 1; fix the environment (or report `BLOCKED` with the failing check) before the first task. A red baseline is never "fixed" by the first task: report it and wait.

4. Compute the order: `plan-graph <plan> --from-git <base>..HEAD` prints the frontier (ready tasks with disjoint Files, ≤ 3). Without the script, take tasks in table order, skipping any whose `Blocked by` task is not committed.

### Step 2 — Run one task (per task, both dispatch modes)

The task cycle follows `references/tdd.md` exactly:

1. `run-ledger task --run r1 --task T3 --state started` (refused without a fresh passing preflight).
2. **Red.** One test named after its AC (`AC-4 more than 50,000 rows returns 422`); run it; paste the failing output; it fails for the expected reason. `run-ledger red --task T3 --test "<name>" --signature "<first failing line>"`. A test that passes on its first run → delete and rewrite it.
3. **Green.** Minimal code; run the test; paste the passing output; `round --loop red-green --result pass`.
4. **Refactor** with the tests green; mocks only at process boundaries; no abstraction without ≥ 2 call sites.
5. **Scoped re-check** after each fix: the failing check plus the tests mapped to the touched files in `docs/codemap.md` or the plan's `## Impact`; an empty mapped set → the full suite.
6. **Task exit:** run the full DoD block; record evidence (`evidence record`†, or a Verification row with the fingerprint from `references/verification.md` §4). Commit with the trailer `Refs: T3 AC-4`. `run-ledger task --state done --commit <sha>` (refused without red output or after a failed last round).

**Each failure** is one round: `run-ledger round --task T3 --loop build-test --result fail --signature "<first failing test + error line>" --cause code --tried "<what this round changed>"`. Before the next round read the ledger: the round number, the signatures seen and every approach tried. A repeated `--tried` is refused. The cause routes the work: `code`/`test` → stay in Build; `env` → preflight; `spec` → Specify; `design`/`plan` → Design; `unknown` twice → design.

**Bounds (exit 3 = stop):** red-green 3 failed attempts → debug loop (state a hypothesis, prove it with a test; 3 refuted hypotheses → Architect) · build-test 5 rounds → Tech Lead · review-fix 3 rounds → Tech Lead · same failure signature twice in a row or 3 failed fixes → Architect design question. At a bound print the escalation brief (`run-ledger` prints it), end the turn and wait for the ruling. Record it with `run-ledger ruling --decision continue|reroute|split|handover|drop --by "<role: name>"`.

**Scope guard:** a file outside the task's Files → stop and list it in the task report; > 3 such files, a new dependency manifest change, or a path-bound overrun (`references/paths.md` §4) → stop, re-plan, request approval again. `run-ledger check` at each task boundary detects these plus secrets and approval drift.

### Step 3 — Dispatch: inline or subagent

**Subagent mode (preferred).** One fresh Developer per task (`agents/developer.md`; a docs task goes to the Tech Writer, `agents/tech-writer.md`), given only: the task row and its `### Tn` subsection, the AC text, the listed files, the DoD block, `references/tdd.md` and `references/loops.md`, plus review findings for that task. Never pass other tasks' conversations. The subagent's tools are a subset of this agent's tools. Tasks of one frontier with pairwise disjoint Files may run in parallel, at most 3, each on its own worktree; integrate them in task-ID order and run the DoD after each merge. A platform without parallel agents runs the frontier sequentially.

**Inline mode.** Same cycle in this context. Before each task, re-read only the task subsection and the ledger; after each task, summarize it in ≤ 5 lines and drop its working detail. Context ≥ 70% → write `specs/NNN-slug/handoff.md` (`references/phase-boundaries.md`) and continue in a new session.

**Report contract.** Every task ends with one status line and its evidence:

| Status | Meaning | Required content |
|---|---|---|
| `DONE` | DoD green, evidence fresh | commits, red and green excerpts, DoD fingerprint, files, round count |
| `DONE_WITH_CONCERNS` | green, with listed concerns | each concern, file:line |
| `BLOCKED` | bound reached, file outside scope, approval void | the blocker and what unblocks it |
| `NEEDS_CONTEXT` | task ambiguous or input missing | the missing input, one question |
| `CANNOT_VERIFY` | an AC not exercisable locally | what was not checked, why, who verifies it and when |

A subagent's `DONE` is a claim, not evidence: re-run its green test and read the diff before accepting it.

### Step 4 — Checkpoint (attended mode)

After each batch of at most 3 tasks (or after each task when the user asked for it):

1. Show the gauge, each task's status line, the DoD output tail (≤ 20 lines) and `run-ledger render` rows for failed rounds.
2. Copy the rendered rows into the plan's `## Loop ledger` (excluded from the plan hash; never delete rows).
3. Say "Batch N done: T1–T3 committed. Continue with T4–T6?" and end the turn. No reply → no next batch.

Feedback that changes a task, a file set or an AC is a plan change: run the change protocol, regenerate `graph.json`, request Design sign-off again, then resume.

### Step 5 — Finish the branch

1. All tasks `done` → run the full DoD block once more on the final tree; record evidence; stale evidence (fingerprint differs) is re-run, never reused.
2. Write the PR body from `<agentic-sdlc>/templates/pr-body.md`: Summary, Verification (one row per AC with command, exit code and fingerprint; `CANNOT_VERIFY` rows), Trace, Review triage (left for the Reviewer), Review guide, Waivers.
3. `run-ledger finish --run r1` → result `DONE`, `BLOCKED` or `NEEDS_HUMAN`; commit the archived `specs/NNN-slug/run-ledger.jsonl` with the last task or as `chore: archive run ledger r1`.
4. Attended mode: push the feature branch and open the PR only after the human says to. Never merge, deploy or tag. Then hand off to the Test stage: the Reviewer runs, findings come back in receive mode (`references/review.md` §5), and each review pass is a `review-fix` round.
5. Report: PR link or branch name, result, tasks done, rounds per loop, open concerns.

### Step 6 — Resume

New session or compaction: `run-ledger resume --run r1` (with `--ack "<name>: <decision>"` after a halt), then `preflight --run r1`, then continue from the first task not `done`. Without the ledger, derive state from `Refs: Tn` trailers in `git log` and the plan's Loop ledger, then confirm in one line: "T1–T5 committed, T6 open. Resume at T6?"

## Unattended Mode

Entry only when the user says "run unattended" for a plan with valid Specify and Design sign-offs (Standard or Full path); otherwise refuse and stay attended. Requires enforced mode.

```bash
node <agentic-sdlc>/scripts/run-ledger.mjs start --run r2 --plan specs/007-rate-limit/plan.md --mode unattended
cd ../<repo>-sdlc-r2 && node <agentic-sdlc>/scripts/preflight.mjs --run r2 --mode unattended
```

Per task: `check` → `task started` → red → rounds → DoD → commit → `task done` → `check`. No checkpoints; the run stops at the first halt, recorded with one of the 10 `run-ledger halt --reason` names: `loop-bound`, `path-escalation`, `spec-design-cause`, `dependency-added`, `secret-detected`, `out-of-plan-files` (> 3 files), `red-baseline`, `approval-void`, `budget` (15 tasks, 5 rounds per task, 4 active hours, 300 turns), or `authority` (push, merge, deploy, release, tag, secret access, destructive command). Halt → status `NEEDS_HUMAN`, stop at once, report the brief. Never push in unattended mode. Details: `references/autonomous.md`.

## Critical Rules

- **NEVER** write production code before a failing test for it has run and its output is pasted.
- **NEVER** report a task `DONE` without DoD output bound to the current fingerprint.
- **NEVER** run a loop past its bound (red-green 3, build-test 5, review-fix 3, debug 3); at the bound, escalate and wait.
- **NEVER** repeat an approach the ledger records as tried in the same loop.
- **NEVER** weaken, skip or delete a test, assertion, lint rule or `coverage_min` to reach green.
- **NEVER** edit `plan.md` or `spec.md` content during Build without the change protocol; only `## Loop ledger` rows are appended.
- **NEVER** build on the default branch, merge, deploy, tag or read secrets; in unattended mode never push.
- **ALWAYS** read the ledger before each round and record each round (signature, cause, tried).
- **ALWAYS** commit with the trailer `Refs: Tn AC-n`.
- **ALWAYS** stop at a checkpoint in attended mode and wait for an explicit continue.

## Error Handling

| Error | Action |
|---|---|
| Plan not found | List `specs/*/plan.md` and `docs/plans/*.md`; ask for the path |
| Approval hash void (`plan-graph --check-approval` exit 1) | `BLOCKED`; change protocol, new approval row |
| Preflight FAIL | Report the failing check; fix the environment; re-run preflight |
| Task ambiguous | `NEEDS_CONTEXT` with one question to the Planner |
| Script exit 2 (corrupt ledger, bad input) | `NEEDS_HUMAN`; restore the ledger from git history; never hand-edit events |
| Script exit 3 (bound, halt) | Print the escalation brief; end the turn; record the ruling before any further round |

## Example Usage

1. **Attended build with checkpoints.** "Execute `specs/001-csv-export/plan.md`." → Step 0 finds the scripts and the DoD block; preflight passes on `feat/001-csv-export`; batch 1 runs T1 and T2 (red output pasted for each, commits `Refs: T1 AC-1`, `Refs: T2 AC-2 AC-3`) and T3; the checkpoint shows 3/5 done and asks "Continue with T4–T5?"; after the yes, T4 and T5 finish, the final DoD is green and the PR body is drafted from the template.
2. **A loop hits its bound.** T3's test fails twice with the same signature `export.test AC-4: expected 422, got 200` → `run-ledger round` exits 3 with breaker B2 and an escalation brief listing both approaches; the agent ends the turn; the Architect answers "split counting into its own task" → `ruling --decision split --by "Architect: M. Silva"` → re-plan and new Design sign-off.
3. **Subagent dispatch.** "Run the plan with subagents." → the frontier `T1, T2` has disjoint Files → two fresh Developers, each given only its task subsection and files; T2 returns `DONE_WITH_CONCERNS` (an extra helper in a file outside its Files) → the concern goes into the checkpoint report.
4. **Unattended run.** "Run unattended on 007-rate-limit." → approvals valid → worktree `../app-sdlc-r2` on `sdlc/007-r2`; after T4, `check` finds `package.json` changed outside plan Files → halt `dependency-added`, result `NEEDS_HUMAN`; the next morning the Tech Lead adds the Rule 10 note, re-approves, and resumes with `--ack "J. Park: lodash pinned 4.17.21, approved"`.
5. **Resume after compaction.** "Continue the build." → `run-ledger resume --run r1` reports T1–T3 done, T4 started with 2 failed build-test rounds; preflight passes; the agent reads both tried approaches and starts round 3 with a different one.

Sources: batch execution with checkpoints adapted from Superpowers `executing-plans` and `subagent-driven-development` (MIT, Jesse Vincent); incremental implementation from Addy Osmani's agent-skills (MIT). Text is original.

† Added in a later release; manual fallback in `agentic-sdlc/references/artifacts.md` §Later-release files.
