# Agentic SDLC — Unattended Build Runs

Loaded only when the user asks to **run unattended** after Design sign-off (mechanisms 8.1–8.5; budgets and the run result are enforced by the same script). An unattended run executes the approved plan's tasks with no human in the loop, inside an isolated worktree, and stops at the first condition on the halt list. It never pushes.

## 1. Entry (8.1)

| Element | Rule |
|---|---|
| **Artifact** | Run ledger `.agentic-sdlc/runs/<id>/ledger.jsonl` (start event: mode, plan, base, branch, worktree, plan and spec hashes, budgets) |
| **Trigger** | The user's words contain "run unattended" (or the platform's background-agent command) for a named `plan.md` |
| **Rule** | Standard or Full path only (a `spec.md` exists next to the plan); valid Specify sign-off and Design sign-off rows whose hashes match the current files; scope = the approved plan's tasks, nothing else |
| **Output** | `run-ledger start --mode unattended` prints the run ID, branch and worktree |
| **Failure behaviour** | Approval missing or hash void, or no `spec.md` → `REFUSED`, exit 1; the agent answers with the missing approvals and stays attended. Quick items are never run unattended |

```bash
node <skill>/scripts/run-ledger.mjs start --run r1 --plan specs/007-rate-limit/plan.md --mode unattended
cd ../<repo>-sdlc-r1
node <skill>/scripts/preflight.mjs --run r1 --mode unattended
```

## 2. Isolation and preflight (8.2, 8.3)

**Isolation.** `start` creates a linked worktree `../<repo>-sdlc-<id>` on branch `sdlc/<NNN>-<id>` from the base commit and writes the ledger inside it. The worktree path already existing, or `git worktree add` failing → exit 1, run not started. All work, commits and ledger events happen in the worktree; the main checkout is untouched.

**Preflight** runs at run start, at every resume and after any round with cause `env`:

| Check | Pass when | Failure |
|---|---|---|
| node | Node ≥ 18 | FAIL |
| clean-tree | `git status --porcelain` empty, ignoring `.agentic-sdlc/runs/`, `evidence/`, `preflight.json` | FAIL |
| branch | not the default branch, not `main`/`master`/`trunk`/`develop`, not detached | FAIL |
| isolation | unattended: linked worktree on an `sdlc/*` branch | FAIL |
| ledger | run ledger parses (attended runs without `--run`: SKIP) | exit 2 |
| tools | every program named in the `sdlc-dod` block resolves on `PATH` | FAIL |
| approvals | Specify and Design sign-off rows bind the current hashes and match the start event | FAIL (attended without an Approvals section: SKIP) |
| baseline-dod | every `sdlc-dod` command exits 0 within `--timeout` (default 30 min) | FAIL → halt reason `red-baseline` |

Output: `.agentic-sdlc/runs/<id>/preflight.json` and a `preflight` ledger event. Any FAIL → exit 1 and `run-ledger task --state started` refuses until a later preflight passes.

## 3. Per-task cycle and halt list (8.4)

For each task in graph order (first task whose state is not `done` and whose `Blocked by` tasks are all `done`):

1. `run-ledger check` — halt checks (below).
2. `task --state started` — refused without a fresh passing preflight or when the budget is spent.
3. Red → `red`; green → `round --loop red-green --result pass` (`references/tdd.md`); every failure → `round … --result fail` with signature, cause and tried (`references/loops.md`).
4. Full DoD at task exit; commit with `Refs: Tn AC-n`; `task --state done --commit <sha>`.
5. `run-ledger check` again.

| Element | Rule |
|---|---|
| **Artifact** | Ledger `halt` event (reason, detail); `run-ledger status` shows `HALTED` |
| **Trigger** | `check` at each task boundary; `round` at a bound; the agent itself on conditions only it can see |
| **Output** | Halt line, escalation brief when a breaker fired, run status `NEEDS_HUMAN` |
| **Failure behaviour** | Every halt → exit 3 and stop at once; `task`, `red`, `round` and `check` exit 3 until `resume --ack`; `status`, `render`, `ruling` and `finish` stay available |

| # | Reason | Detection | Recorded by |
|---|---|---|---|
| 1 | `loop-bound` | Breaker B2–B5 fired (`references/loops.md` §7) | `round` (automatic) |
| 2 | `path-escalation` | File bound or new risk trigger (`references/paths.md` §4) | agent: `halt --reason path-escalation` |
| 3 | `spec-design-cause` | Cause `spec`, `design`, `plan`, or `unknown` twice (B6) | `round` (automatic) |
| 4 | `dependency-added` | A manifest or lockfile changed that the plan's Files do not list | `check` |
| 5 | `secret-detected` | A secret pattern in an added line since base; output names file:line and pattern only, never the value | `check` |
| 6 | `out-of-plan-files` | > 3 changed files outside plan Files (1–3 → concern listed in the task report) | `check` |
| 7 | `red-baseline` | Preflight baseline DoD fails before any task change | agent after preflight |
| 8 | `approval-void` | `spec.md` or `plan.md` hash differs from the start event | `check` |
| 9 | `budget` | A budget in §4 exceeded | `check`, `task`, `round` |
| 10 | `authority` | A command outside §5: push, merge, deploy, release, tag, secret read, destructive command, a weakened check | agent: `halt --reason authority` before running it |

## 4. Budgets

| Budget | Ceiling | Measure |
|---|---|---|
| `max_tasks` | 15 tasks started per run; a larger plan is refused at start (exit 3) and split into runs | `task --state started` count |
| `max_rounds` | 5 build-test rounds per task | lowers the B3 bound |
| `max_hours` | 4 active hours (gaps > 30 min between events are idle) | ledger timestamps |
| `max_turns` | 300 agent turns | `--turns N` passed on any command |
| `max_tokens` | off unless configured | `--tokens N` |

Set lower values in `.agentic-sdlc/config.json` `{"budgets": {"max_hours": 2}}` or with flags at start. A value above the ceiling → exit 2: budgets are lowered, never raised.

## 5. Authority limits

The run may: read and search, edit files in the current task's Files, run `sdlc-dod` and test commands, `git add`, `git commit`, `git status`, `git diff` inside the worktree. It may not: push (any branch), merge, rebase the base branch, deploy, release, tag, read or print secrets, install software globally, delete files outside the plan, call the network beyond the package registry the plan approves. Subagents receive a subset of the delegating agent's tools, never more (`references/agents.md`). An attempt → halt `authority`.

## 6. Resume and rulings (8.5)

| Element | Rule |
|---|---|
| **Artifact** | The run ledger: append-only JSON Lines, one event per state change, survives compaction and session loss |
| **Trigger** | New session, compaction, or a human resolving a halt |
| **Rule** | `resume` (with `--ack "<name>: <decision>"` after a halt) → `preflight` → continue from the first task not `done` |
| **Output** | Resume event; list of tasks done, open and awaiting a ruling |
| **Failure behaviour** | Ledger unparsable, sequence gap or unknown event type → exit 2, status `NEEDS_HUMAN`; repair from git history, never by hand-editing events |

A breaker halt also needs a ruling on the task (`run-ledger ruling --decision … --by "<role: name>"`), recorded by the human or on the human's exact words. Spec or plan change → change protocol (`references/rules.md`), then a new run: approvals are bound to the start hashes.

## 7. Finish and run result

`run-ledger finish --run <id>` writes `.agentic-sdlc/runs/<id>/result.json` and copies the ledger to `specs/NNN-slug/run-ledger.jsonl`. Commit the archive on the run branch.

| Result | When | Exit |
|---|---|---|
| `DONE` | every task `done`, last round of each task and of `PR` passed, no open escalation | 0 |
| `BLOCKED` | tasks not done or failures open with no halt; or halted on `budget` | 1 |
| `NEEDS_HUMAN` | any other halt, or any escalation awaiting a ruling | 3 |

The human then reviews the branch, pushes it and opens the PR from `templates/pr-body.md` (attended steps). `run-ledger render` supplies the PR's loop-ledger table.

## 8. Without Node

Unattended mode requires Node: the halt list, budgets and isolation are script-enforced. Node absent → refuse unattended mode and run attended with the manual Loop ledger in `plan.md`.

## Sources

Isolation by worktree and the halt-before-destructive-action rule adapted from Superpowers `using-git-worktrees` and `subagent-driven-development` (MIT); budgets and halt list are original.
