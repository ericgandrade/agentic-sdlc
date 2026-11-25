# Resume and Isolation — Branches, Worktrees, Recovery

Load this file in Step 0 (before the first commit of a run), on any new session or compaction with open Build work, after a halt or ruling, and before deleting any worktree. Contract sources: `../../agentic-sdlc/references/autonomous.md` §2 and §6, `../../agentic-sdlc/references/phase-boundaries.md` §Resume procedure and §Handoff file.

## 1. Isolation by mode

| Mode | Branch | Workspace | Created by |
|---|---|---|---|
| Attended, sequential | `feat/NNN-slug` (or the team's convention from `AGENTS.md`) | Main checkout | The controller, after preflight's `branch` check would fail on the default branch |
| Unattended | `sdlc/NNN-<run-id>` | Linked worktree `../<repo>-sdlc-<run-id>` | `run-ledger start --mode unattended` (never by hand) |
| Parallel wave (attended) | `<feature-branch>-T<n>` per task | Linked worktree `../<repo>-NNN-T<n>` per task | The controller, at wave start (`parallel-tasks.md` §3) |
| Quick | `fix/<slug>` or the team's convention | Main checkout | The controller |

**Rules.**

1. Never commit Build work on `main`, `master`, `trunk`, `develop` or the repository's default branch. Preflight's `branch` check fails there; respect it.
2. Before creating a worktree, confirm the worktree directory is ignored or outside the repository (`git check-ignore -q <dir>` or a sibling path like `../<repo>-…`). A worktree inside the repository that is not ignored would make every later clean-tree check fail.
3. Record BASE before the first task: `git rev-parse HEAD` → the `--base` of `run-ledger start` and the `BASE` of every Developer brief. Every review diff is `<BASE>..HEAD` or a narrower range.
4. One run ID per Build session of a plan: `r1`, `r2`, … A new run after a spec or plan change (approvals bind to the start hashes); a resume continues the same run ID.
5. Preflight before the first task: `node <scripts>/preflight.mjs --run <id> --plan specs/NNN-slug/plan.md --mode <attended|unattended>`. Exit 1 → fix the named check (commit or stash nothing on the human's behalf: report the dirty files and stop); exit 2 → `NEEDS_CONTEXT`.
6. `.agentic-sdlc/runs/`, `evidence/` and `preflight.json` are scratch state. Keep them out of commits except the archived `specs/NNN-slug/run-ledger.jsonl` written by `finish`.

## 2. Where the run state lives

| State | Location | Survives |
|---|---|---|
| Task states, red events, rounds, rulings, halts | `.agentic-sdlc/runs/<id>/ledger.jsonl` (append-only) | Compaction, session loss, machine restart |
| Loop ledger rows | `plan.md` `## Loop ledger` (excluded from the plan hash) | Everything committed |
| Which tasks have code | `Refs: Tn AC-n` trailers in `git log <BASE>..HEAD` | Everything committed |
| Next action, in-progress detail | `specs/NNN-slug/handoff.md` | Only until the next commit makes it stale |
| Run result | `.agentic-sdlc/runs/<id>/result.json`, then `specs/NNN-slug/run-ledger.jsonl` | Committed on the run branch by `finish` |

The conversation is never the record: anything decided only in chat is lost at the next Clear.

## 3. Resume algorithm

Trigger: a new session on a repository with open Build work, a compaction mid-task, a human resolving a halt, or a switch of dispatch mode.

1. **Find the run.** `.agentic-sdlc/runs/*/ledger.jsonl` without a `result.json` → that run. Several → ask which one; never pick by date alone.
2. **After a halt:** the human states the decision; record it: `node <scripts>/run-ledger.mjs resume --run r1 --ack "Tech Lead: J. Park: split approved"`. A breaker halt also needs a ruling on the task (`ruling --run r1 --task T3 --decision split --by "Tech Lead: J. Park"`) in the human's exact words. A spec or plan change → change protocol, new approvals, **new run**, not a resume.
3. **Without a halt:** `node <scripts>/run-ledger.mjs resume --run r1`. Exit 2 (unparsable ledger, sequence gap, unknown event) → `NEEDS_HUMAN`; repair from git history, never by editing events.
4. **Preflight again:** `preflight --run r1 --plan … --mode …`. `task --state started` is refused until a preflight passes after the last `env` round.
5. **Cross-check git:** `node <scripts>/plan-graph.mjs specs/NNN-slug/plan.md --from-git <BASE>..HEAD`. A task the ledger shows `started` but git shows committed with its AC test green → finish its bookkeeping (`task --state done --commit <sha>`) after re-running the AC test. A task the ledger shows `done` but no `Refs: Tn` commit exists → stop: `NEEDS_HUMAN: ledger and git disagree on Tn`.
6. **Continue** from the first task whose ledger state is not `done`, in graph order. Re-read that task's row and subsection; do not trust a summary of it.
7. **Attended:** confirm the resume point in one line before work starts: `Plan rev 2 approved, T1–T2 done, T3 escalated → split ruling recorded. Resume at T4?`

## 4. Resume without a run ledger

Prompt-only runs, Quick items and plans outside the method have no ledger file.

1. Done tasks = tasks with a `Refs: Tn` commit in `git log --format='%h %B' <BASE>..HEAD` whose AC tests pass when re-run now.
2. Rounds already spent = rows in `plan.md` `## Loop ledger` (or the PR `### Loop ledger` on Quick).
3. `specs/NNN-slug/handoff.md` → use its `In progress` and `Next step` only when its `Last commit` equals `git rev-parse HEAD`; older → ignore those fields and derive from git and the ledger rows.
4. No trailers and no ledger rows → report `NEEDS_CONTEXT: no Build state found`; never guess which tasks are done from file contents.

## 5. Dirty tree after a crash or compaction

Preflight fails `clean-tree` when the previous session stopped mid-edit.

1. Identify the task in progress from the ledger (`started`, not `done`).
2. Save the work: `git diff > .agentic-sdlc/runs/<id>/T<n>-wip.patch` (plus `git diff --staged >> …` when anything is staged; list untracked files with `git status --porcelain` and copy them under `.agentic-sdlc/runs/<id>/T<n>-wip/`).
3. Restore the tracked files: `git restore --staged --worktree -- <files from the task's Files list>`. Never restore files outside the task's Files without asking; a dirty file outside Files is the human's work: stop and report it.
4. Run preflight; it must pass on the clean tree (baseline DoD green).
5. Re-apply: `git apply .agentic-sdlc/runs/<id>/T<n>-wip.patch` and copy back the untracked files. A failed apply → report and continue the task from the last commit.
6. Re-run the task's AC test before trusting any of the restored work: red-first still applies when no red event exists for the task.

## 6. Compaction and context hand-off

At ≥ 70% context use or ≥ 2 tasks done in one context (`../../agentic-sdlc/references/phase-boundaries.md` §Triggers):

1. Finish the current green test run; never stop mid-red.
2. Commit finished work; record the task event and round rows.
3. Copy new `run-ledger render` rows into `plan.md` `## Loop ledger`.
4. Clear (same tool, same person) or write `specs/NNN-slug/handoff.md` from the template (another tool, machine or person). Move every decision into the plan, the ledger or an ADR first; the handoff file is a pointer, not the record.
5. The fresh context runs §3.

## 7. Cleanup

| Item | Remove when | Never remove when |
|---|---|---|
| Parallel task worktrees `../<repo>-NNN-T<n>` | The task branch is merged into the feature branch and the DoD is green after the merge | The task is escalated, halted or awaiting a ruling (the worktree is evidence) |
| Task branches `<feature>-T<n>` | Merged with `--no-ff` (the merge keeps the commits and trailers) | Not merged |
| Unattended worktree `../<repo>-sdlc-<id>` | The human pushed the branch and the PR exists, and says so | Before the human has reviewed the run result |
| `.agentic-sdlc/runs/<id>/` | After `finish` archived the ledger and the PR carries the Loop ledger and rulings | Before rulings and evidence are in the plan or PR |
| `handoff.md` | Overwritten at each hand-off; delete before the PR is merged if the team keeps it out of `main` | — |

Commands: `git worktree remove ../<repo>-NNN-T2` then `git branch -d <feature>-T2`. Use `-d`, never `-D`: an unmerged branch refuses deletion, which is the safeguard.

## 8. Ending the Build stage

1. Every task `done` (or `split`, `handover`, `drop` by ruling) and the full DoD green on the feature branch tip.
2. `run-ledger finish --run <id>` → `DONE` / `BLOCKED` / `NEEDS_HUMAN`; the archive `specs/NNN-slug/run-ledger.jsonl` is committed on the branch.
3. `run-ledger render --run <id>` → the PR `### Loop ledger` table (`../../agentic-sdlc/templates/pr-body.md`).
4. Attended: push and open the PR only when the human says so. Unattended: never push; the human pushes after reading the run result. Never merge, deploy or tag in either mode.
