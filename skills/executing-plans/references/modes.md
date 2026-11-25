# Execution Modes — Dispatch, Attention and Enforcement

Load this file in Step 0 when choosing how to run the plan, when a run switches mode mid-flight, and whenever the platform cannot start subagents. Every mode runs the same task cycle (`../../agentic-sdlc/references/tdd.md` per task, `../../agentic-sdlc/references/loops.md` per failure); modes change **who** holds the context and **who** writes the ledger, never the bounds, the evidence rule or the approvals.

Paths in this file are relative to `skills/executing-plans/references/`; the stage contract lives in `../../agentic-sdlc/`.

## 1. Three independent choices

| Axis | Values | Decided by | Default |
|---|---|---|---|
| **Dispatch** | `subagent` · `inline` | Platform capability, then the human's preference | `subagent` when the platform can start a fresh agent with a prompt and a tool allow list |
| **Attention** | `attended` · `unattended` | The human's words ("run unattended") plus the entry checks in §4 | `attended` |
| **Enforcement** | `enforced` · `prompt-only` | Node ≥ 18 and the scripts found in Step 0 | `enforced` when both are present |

The three combine freely except: unattended requires enforced; parallel tasks require subagent dispatch and attended attention (`parallel-tasks.md` §1).

Record the choice in the first progress line and in the PR body header: `Mode: subagent · attended · enforced (run r1)`.

## 2. Subagent dispatch

**Roles.**

| Role | Context | Writes |
|---|---|---|
| Controller | The session running this skill (the router acting as Scrum Master during Build) | Run ledger (single writer when tasks run in parallel), plan `## Loop ledger` rows, checkpoints, PR body |
| Developer | Fresh per task (`../../agentic-sdlc/agents/developer.md`), built from `../prompts/developer.md` | Code and tests inside the task's Files; commits; run-ledger events in sequential mode |
| Task reviewer | Fresh per review round, built from `../prompts/task-reviewer.md` or `../prompts/re-review.md` | Findings only; never code |
| Tech Writer | Fresh per docs task (`../../agentic-sdlc/agents/tech-writer.md`), same brief shape | Files under the docs task |

**Rules.**

1. One fresh Developer per task. A task never inherits another task's conversation, findings or failed approaches.
2. The brief carries pointers and exact values only: the task row, its `### Tn` subsection, the AC text, the Files list, the DoD block, BASE SHA, run ID. The Developer reads the files itself; never paste whole files or the whole plan.
3. The controller resolves any ambiguity it noticed in the task before dispatch and writes the resolution into the brief's "Controller notes". A plan defect (wrong signature, missing file, AC mismatch) is not resolved in a note: it is `NEEDS_CONTEXT` to the Planner and a change-protocol candidate.
4. Tool lists are allow lists: the Developer gets read, search, edit within Files, the DoD and test commands, and local git (`status`, `diff`, `add`, `commit`). Never more than the controller holds.
5. **No nested dispatch.** Developers and reviewers never start subagents. A reviewer started by a Developer has no standing: its verdict is discarded and the task is reviewed again by the controller's reviewer.
6. **Bounded waiting.** While a subagent runs, the controller does local work (ledger render, preparing the next brief, reading reports). When idle, wait in stretches of 5–10 minutes and post one status line between stretches. A subagent silent for 30 minutes → check its state; no state → treat the task as `BLOCKED: agent lost`, keep its worktree, and re-dispatch once with the same brief plus "previous attempt lost; inspect `git status` first".
7. **Report discipline.** The Developer returns at most 15 lines (status line, commits, evidence lines, concerns). Long detail (full red and green output) goes into the task report section of its final message or a file under `.agentic-sdlc/runs/<id>/T<n>-report.md` (ignored by preflight's clean-tree check).
8. **A `DONE` is a claim.** Before the review, the controller re-runs the task's AC test(s), checks `git diff --stat <BASE>..HEAD` against the Files list, and checks that a red event or `--no-red` reason exists. A mismatch → the task stays open and the Developer gets the mismatch as its next instruction.

**Capability tiers (portable model choice).** Use the lowest tier that can do the role: mechanical tasks with a full signature and 1–2 files → economy tier; multi-file integration or a debug loop → standard tier; the task reviewer → standard tier at least; Architect-bound design questions are not answered by any execution tier. A platform with one model ignores this table. Before a B2 or B3 escalation on a platform with no stronger model, one extra round in a fresh context (task, ledger rows, failing output only) is permitted and counts toward the same bound (`../../agentic-sdlc/references/loops.md` §7).

## 3. Inline dispatch

Inline keeps what fresh subagents buy, by other means: the task subsection is the requirement, the ledger is the memory, test-first is the per-task gate, and the reviewer pass is a separate cleared pass.

1. Before each task, re-read the task row, its subsection and the ledger (`run-ledger status --run <id>`), even for a task that "is remembered": memory is a summary, the plan is the source.
2. After each task, write a ≤ 5-line summary (task, commits, rounds, concerns) and drop the working detail.
3. **Context pressure** (`../../agentic-sdlc/references/phase-boundaries.md` §Triggers): ≥ 70% of the context window used, or ≥ 2 Build tasks completed in this context → finish the current green test run, copy the ledger rows into the plan, then Clear (start fresh from artifacts) or write `specs/NNN-slug/handoff.md` when the work changes tool, machine or person.
4. **Review pass inline.** Start a line `--- Reviewer pass (self-review) ---`, load only the inputs listed in `../prompts/task-reviewer.md`, and do not consult the implementation notes. Every finding and the round row carry the label `self-review`; the PR `## Verification` and `## Review triage` repeat it (`../../agentic-sdlc/references/review.md` §7).
5. Inline mode is the only option on a platform without subagents, and acceptable on request. The Test-stage review still needs an independent context; on a platform without one, the PR states `self-review` and the human reviewer reads those lenses as review-guide items.

**Switching dispatch mid-run.** Both dispatch modes use the same ledger and the same plan rows, so a run can move from subagent to inline (or back) at any task boundary: `run-ledger resume --run <id>`, `preflight --run <id>`, continue at the first task not `done`. Record the switch as a `--note` on the next `task --state started` event.

## 4. Unattended attention

Load `../../agentic-sdlc/references/autonomous.md` in full before the first unattended command. Summary of the contract:

| Item | Rule |
|---|---|
| Entry | The words "run unattended" for a named `specs/NNN-slug/plan.md`; Standard or Full path; valid Specify and Design sign-offs bound to the current hashes; enforced mode. Quick items and `docs/plans/` plans are never run unattended |
| Refusal | Any entry condition missing → `REFUSED` with the missing approvals named; stay attended |
| Isolation | `run-ledger start --mode unattended` creates `../<repo>-sdlc-<id>` on `sdlc/<NNN>-<id>`; all work happens there |
| Order | Sequential, graph order; no parallel tasks |
| Per task | `check` → `task started` → red → rounds → per-task review → full DoD → commit → `task done` → `check` |
| Stops | First halt among the 10 reasons → `NEEDS_HUMAN`, stop at once, print the brief |
| Budgets | 15 tasks · 5 build-test rounds per task · 4 active hours · 300 agent turns · tokens when configured; lowered, never raised |
| Never | Push, merge, rebase the base branch, deploy, release, tag, read secrets, install globally, weaken a check |
| End | `run-ledger finish` → `DONE` (exit 0) · `BLOCKED` (exit 1) · `NEEDS_HUMAN` (exit 3); the human pushes and opens the PR |

Per-task review in unattended mode runs as in attended mode (subagent or labelled self-review pass); a review-fix bound is a halt `loop-bound` like any other breaker.

## 5. Attended checkpoints

| Cadence | Use when | Stop text |
|---|---|---|
| Per batch (default) | Normal attended run; a batch is one frontier of ≤ 3 tasks | `Batch N done: T1–T3 committed. Continue with T4–T5?` |
| Per task | The human asked for it, or the plan touches a risk trigger (auth, personal data, money, public API, schema/migration, irreversible, regulated) | `T3 done (2 rounds). Continue with T4?` |
| End only | The human said "do not stop between tasks" in an attended run | No stop between tasks; escalations, scope stops and sign-offs still stop the run |

At a checkpoint show: the progress gauge, each task's status line, the last ≤ 20 lines of the DoD output, the `run-ledger render` rows added since the last checkpoint. End the turn. Silence is not a "continue".

Feedback at a checkpoint that changes a task, a Files list or an AC is a plan change: change protocol (`../../agentic-sdlc/references/rules.md`), `plan-graph --write`, new Design sign-off, then resume.

## 6. Prompt-only enforcement (no Node)

| Enforced element | Prompt-only replacement |
|---|---|
| `run-ledger` events | Rows appended by hand to `plan.md` `## Loop ledger`; bounds counted from those rows before every round |
| `preflight` | Manual checks: `git status --porcelain` empty, current branch not the default, each DoD command runs green once before the first task, `## Approvals` rows present with the current revision |
| `plan-graph` frontier | Table order, skipping tasks whose `Blocked by` tasks lack a `Refs: Tn` commit; no parallel tasks |
| `check` | Before each task: `git diff --name-only <base>` compared with the plan Files; any manifest or lockfile not in Files → stop |
| Fingerprint | Commit first, tree clean, record `head:<12 hex>` (`../../agentic-sdlc/references/verification.md` §4 step 5) |

The PR header carries `Enforcement: prompt-only`. Unattended mode is refused.

## 7. Decision table

| Situation | Dispatch | Attention | Note |
|---|---|---|---|
| Platform with subagents, approved Standard plan, human present | subagent | attended | Default |
| Same, human says "run unattended", Node present, approvals valid | subagent or inline | unattended | Worktree, halts, budgets |
| Same, "run unattended" but Node missing | — | attended | Refuse unattended; explain why |
| Platform without subagents | inline | attended | Reviewer pass labelled `self-review` |
| `docs/plans/*.md` plan outside the method | either | attended | Ask once for execution approval; no plan-graph approval check |
| Quick item handed over by the router | inline | attended | One cycle, `Refs: AC-n`, ledger rows by hand in the PR; Test-stage review runs L1 + L2 |
| Context ≥ 70% mid-run | — | — | Finish the green run, write the ledger, Clear or hand off |
