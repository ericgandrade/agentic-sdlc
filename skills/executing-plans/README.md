# executing-plans

Executes an approved implementation plan task by task: each task runs test-first through a fresh Developer subagent (or inline), passes a per-task review (spec compliance, then quality) before dependent work starts, and commits with `Refs: Tn AC-n`. Every failed round is recorded in the run ledger, every loop stops at its bound and escalates for a human ruling, and the ledger ends up in the PR. Supports preflight, worktree isolation, parallel file-disjoint tasks, resume after a halt or compaction, and an unattended mode. The Build stage of the Agentic SDLC, used by the Developer, routed by the Scrum Master, with per-task review by the Reviewer role.

## When to use

- Run an approved `specs/NNN-slug/plan.md` (Standard or Full path) or a `docs/plans/*.md` plan from `writing-plans`.
- Run the plan with subagents, in parallel batches, or unattended overnight.
- Resume a Build run after a session end, compaction, escalation or halt.
- Implement a Quick item handed over by the `agentic-sdlc` router (one cycle, `Refs: AC-n`).

Not for writing the plan (`writing-plans`), single-change TDD discipline (`test-driven-development`), root-causing after three failed attempts (`systematic-debugging`), the Test-stage PR review (`multi-axis-code-review`) or release hand-over (`shipping-and-handover`).

## What is included

- `SKILL.md` — Build workflow: discovery, plan review and preflight, per-task cycle, fix loop and breakers, per-task review, batches/parallel/checkpoints, finish, unattended mode, resume, Quick path
- `references/modes.md` — dispatch (subagent/inline) × attention (attended/unattended) × enforcement (enforced/prompt-only), subagent rules, checkpoint cadences, decision table
- `references/fix-loop-and-escalation.md` — round anatomy, commands per loop, cause classification, signatures, breakers B1–B6, escalation brief, rulings and their effects, Loop ledger rows
- `references/resume-and-isolation.md` — branches and worktrees per mode, resume algorithm, resume without a ledger, dirty-tree WIP patch, compaction hand-off, cleanup
- `references/parallel-tasks.md` — eligibility, batch selection from the plan-graph frontier, worktree per task, single ledger writer, `--no-ff` integration with DoD after each merge
- `prompts/developer.md` — per-task brief for a fresh Developer (task row, Files, ACs, DoD, status report) plus the fix-round variant
- `prompts/task-reviewer.md` — spec compliance first, then quality; verified findings with severity
- `prompts/re-review.md` — re-check only the fixed findings plus regressions in the fix delta
- `evals/evals.json` — 5 scenarios including the pressure case "skip review, just merge all tasks"
- `evals/trigger-eval.json` — 30 queries (14 should-trigger / 16 should-not-trigger, 10 of them aimed at neighbor skills)

## Typical invocation

- "Execute `specs/001-csv-export/plan.md`."
- "Run the plan with subagents and run independent tasks in parallel."
- "Run unattended on 007-rate-limit."
- "Resume the build from the ledger."
- "Execute the plan in `docs/plans/2026-11-20-auth.md` and pause after each task."

## What's New in v4.0

- **Per-task review** — fresh reviewer per task: spec compliance (Missing/Misunderstood → Critical, Extra → Important), then quality; verify-then-rate; scoped re-review of the fix delta (`prompts/task-reviewer.md`, `prompts/re-review.md`)
- **Subagent prompts** — `prompts/developer.md` with the 15-line status report and a fix-round variant in receive mode
- **Three mode axes** — dispatch × attention × enforcement, with bounded waiting, no nested dispatch, capability tiers and checkpoint cadences (`references/modes.md`)
- **Fix loop depth** — cause classification order, debug cause-class rule, signature normalization, breaker order in practice, rulings and their approval effects, per-task and PR review-fix counters (`references/fix-loop-and-escalation.md`)
- **Parallel tasks** — only file-disjoint frontier tasks, wave conflicts respected, worktree per task, controller as single ledger writer, `--no-ff` merge in task-ID order with the DoD after each merge (`references/parallel-tasks.md`)
- **Resume and isolation** — ledger/git cross-check, resume without a ledger, WIP patch for a dirty tree, cleanup rules (`references/resume-and-isolation.md`)
- **Ledger into the PR** — `run-ledger render` rows copied into `plan.md` at each task exit and into the PR `### Loop ledger` at the end; Quick path keeps rows by hand with `Refs: AC-n`

## What's New in v3.0

- **Test-first per task** — red output pasted and recorded before green (`agentic-sdlc/references/tdd.md`)
- **Run ledger and bounded loops** — `run-ledger.mjs` records every round; red-green 3, build-test 5, review-fix 3, debug 3; exit 3 escalates to a named role (`references/loops.md`)
- **Preflight** — `preflight.mjs` checks clean tree, branch, tools, approval hashes and a green baseline DoD
- **Inline and subagent dispatch** — one fresh Developer per task; status vocabulary `DONE` · `DONE_WITH_CONCERNS` · `BLOCKED` · `NEEDS_CONTEXT` · `CANNOT_VERIFY`
- **Unattended mode** — worktree isolation, 10-reason halt list, budgets, result `DONE` / `BLOCKED` / `NEEDS_HUMAN` (`references/autonomous.md`)
- **No external skill dependencies** — branch setup and finishing are part of the workflow; works prompt-only when Node is absent

## What's New in v2.0

- **Progress Tracking** — Dynamic gauge bar that advances per completed plan step, displayed throughout execution
- **Error Handling** — Handles plan ambiguity, missing files, failed steps, and mid-plan interruptions with resume and rollback guidance
- **Evals** — `evals/evals.json` with realistic test cases; `evals/trigger-eval.json` with 20 queries (10 trigger / 10 no-trigger) for description optimization
- **Standardized description** — SKILL.md description updated to Anthropic skill-creator format

## Influences

| Inventory ID | Source (license) | What was taken | How adapted |
|---|---|---|---|
| SP-26 | Superpowers `executing-plans` / `subagent-driven-development` (MIT, Jesse Vincent) | Two executors (inline and subagent) sharing one workspace and ledger | Dispatch is one axis of three; switching at a task boundary via `run-ledger resume` (`references/modes.md` §3) |
| SP-29 | Superpowers (MIT) | Isolated workspace before execution | Branch per mode, `run-ledger start --mode unattended` worktree, worktree per parallel task |
| SP-30 | Superpowers (MIT) | Per-plan progress ledger for compaction recovery | Replaced by the append-only run ledger plus `Refs: Tn` trailers; ledger/git cross-check on resume |
| SP-31 | Superpowers (MIT) | Pre-flight conflict scan of the plan | Step 1 critical plan read plus `preflight.mjs` checks before the first task |
| SP-32 | Superpowers (MIT) | Task brief extraction and BASE recording | `prompts/developer.md` carries verbatim row, AC, Files, DoD and BASE; pointers, not pasted files |
| SP-35 | Superpowers `subagent-driven-development` (MIT) | Fresh worker per task with a structured dispatch | Fresh Developer per task; controller notes resolve ambiguity; plan defects go to the Planner |
| SP-37 | Superpowers (MIT) | Worker status contract and report file | The five-status report capped at 15 lines; detail in `.agentic-sdlc/runs/<id>/Tn-report.md`; DONE treated as a claim |
| SP-39 | Superpowers (MIT) | No subagents inside workers and reviewers | "No nested dispatch" rule; a nested reviewer's verdict is discarded |
| SP-41 | Superpowers (MIT) | Bounded waiting on subagents | 5–10 minute waits with status lines; 30 minutes silent → `BLOCKED: agent lost`, one re-dispatch |
| SP-42 | Superpowers (MIT) | Task reviewer giving spec and quality verdicts from one diff read | Two ordered passes with Missing/Misunderstood/Extra mapped to the method's severities |
| SP-45, SP-46 | Superpowers (MIT) | Bounded fix loop; scoped re-review | review-fix bound 3 → B4 from the loops contract; re-review of the fix delta, > 30% → full review |
| SP-48 | Superpowers (MIT) | "Rulings I made" and deferred minors in the final report | Rulings recorded in the ledger and rendered into the PR `### Loop ledger`; Minor → deferred list |
| BM-02 | BMad Method (MIT) | HALT protocol with explicit stop conditions | The ten `run-ledger halt` reasons and exit 3 stop the run at once |
| BM-07 | BMad Method (MIT) | Resume by recorded status | Resume at the first task whose ledger state is not `done` |
| BM-20 | BMad Method dev story (MIT) | The plan as the sole source for implementation | Never repair the plan silently; plan changes go through the change protocol |
| BM-23 | BMad Method (MIT) | Judge the diff, not the worker's report | Reviewer never sees the Developer's reasoning; report evidence is testimony to re-run |
| BM-35 | BMad Method (MIT) | Re-engage the same worker for fixes | Fix round goes to the same Developer when the platform can continue it, else a fresh one with findings verbatim |
| BM-41, BM-42 | BMad Method (MIT) | Unattended worker contract; machine-readable run result and patch preservation | Unattended entry checks and `finish` results; WIP patch saved before restoring a dirty tree |
| AO-41, AO-42 | Addy Osmani agent-skills (MIT) | `/build` single-task loop; increment cycle | One task per cycle, scoped re-check per fix, full DoD at task exit |
| AO-54 | Addy Osmani agent-skills (MIT) | Degraded self-review when nesting is impossible | Inline review pass from a cleared context, labelled `self-review` everywhere |
| AO-75 | Addy Osmani agent-skills (MIT) | Atomic, typed commits | Each commit green with `Refs: Tn AC-n`; fix commits add `F-Tn-k` |
| AO-102 | Addy Osmani agent-skills (MIT) | Definition of Done versus acceptance criteria | AC tests at red/green; the `sdlc-dod` block at task exit and at finish |
| AO-119 | Addy Osmani agent-skills (MIT) | Artifacts as hand-off across sessions | 70% context or 2 tasks → Clear or `handoff.md`; resume from artifacts only |
| MP-40 | Matt Pocock skills (MIT) | AFK versus human-in-the-loop work | Attention axis: attended checkpoints versus unattended runs with halts |
| MP-56 | Matt Pocock skills (MIT) | Single-context implement loop | Inline dispatch rules: re-read the task and ledger each task, 5-line summaries |
| MP-57 | Matt Pocock skills (MIT) | Task-graph frontier, integration branch, worktrees, merger | plan-graph frontier minus wave conflicts; worktree per task; `--no-ff` merge in ID order |
| MP-77 | Matt Pocock skills (MIT) | Brakes: start slow, cap loops | At most 3 parallel tasks; parallel off for risk triggers and unattended runs |
| Spec Kit §2.1 | GitHub Spec Kit `/implement` (MIT), via `docs/research/methods/ai-native-methods.md` | Implement phase over a task list; `[P]` parallel markers | Parallelism derived from Files disjointness by plan-graph instead of hand markers |
| Kiro §2.2 | Kiro task execution (proprietary; concepts only) | Tasks executed one at a time, each linked to requirements | Every task and commit traced to `AC-n`; reviewer checks spec compliance first |
| AI-DLC §2.3 | AWS AI-DLC Construction phase (MIT-0) | Per-unit construction with human validation between units | Attended checkpoints per batch or per task; unattended only with valid sign-offs |

No inventory IDs exist for Spec Kit, Kiro and AI-DLC; the methods-doc section is cited instead. All text is original.

---

## Metadata

| Field | Value |
|-------|-------|
| Version | 4.0.0 |
| Author | Eric Andrade |
| Created | 2026-02-20 |
| Updated | 2026-11-24 |
| Platforms | GitHub Copilot CLI, Claude Code, OpenAI Codex, OpenCode, Gemini CLI, Antigravity, Cursor IDE, AdaL CLI |
| Category | planning |
| Tags | planning, execution, build, subagents, run-ledger, agentic-sdlc |
| Risk | safe |
