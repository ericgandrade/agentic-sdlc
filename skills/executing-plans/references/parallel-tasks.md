# Parallel Tasks — File-Disjoint Ready Tasks Only

Load this file when an attended subagent run has two or more ready tasks and the human has not asked for sequential execution. Sequential execution is always correct; parallel execution is an optimisation that is allowed only when every check below passes. When any check is uncertain, run the tasks one after another.

## 1. Eligibility (all must hold)

| # | Condition | Why |
|---|---|---|
| 1 | Standard or Full path with an approved `specs/NNN-slug/plan.md` (`plan-graph --check-approval` exit 0) | The `## Tasks` table and its Files lists are the only proof of disjointness |
| 2 | Dispatch = subagent | Inline mode has one context; "parallel" inline is interleaving and loses the per-task gate |
| 3 | Attention = attended | Unattended runs are sequential by contract (`../../agentic-sdlc/references/autonomous.md`) |
| 4 | Enforcement = enforced (Node present) | `plan-graph` computes the frontier and the conflicts; by hand the risk of a missed shared file is too high |
| 5 | The platform runs concurrent subagents and supports `git worktree` | Each task needs its own workspace |
| 6 | No task in the batch touches a risk trigger that requires a per-task checkpoint (auth, personal data, money, public API, schema/migration, irreversible, regulated) | Those tasks run alone so the human can stop between them |

Any condition false → sequential, and the first progress line says why: `Parallel: off (unattended)`.

## 2. Choosing the batch

1. Run `node <scripts>/plan-graph.mjs specs/NNN-slug/plan.md --done <done IDs> --max-parallel 3` (or `--from-git <BASE>..HEAD` to derive the done set from the `Refs: Tn` trailers).
2. Read `waves:`, `conflict:` and `frontier (max 3):` from the output.
3. Start from the frontier. plan-graph already holds back any task that a `conflict:` line places after a task that is not yet done (wave order wins over readiness). By hand: apply the same rule.
4. Check every pair in the remaining set:
   - **Files disjoint:** no file in common across the two Files lists, tests included. Treat as shared: the same test file, a shared fixture or snapshot directory, `package.json` / lockfiles / other manifests, migration directories, generated files, and barrel files (`index.ts`) that both would edit.
   - **No interface edge:** neither task produces a type, function, endpoint or schema that the other consumes, even when `Blocked by` omits it. Read both `### Tn` subsections' Interfaces lines.
   - **No shared runtime resource:** the two tasks' tests do not bind the same port, database schema or temp directory, unless the test setup isolates them.
5. Keep at most 3 tasks. Fewer is fine. A pair that fails a check → keep the lower ID in the batch, defer the other.
6. Record the batch: `Wave 1: T2, T4 parallel (files disjoint; no shared interface)` in the progress output and as `--note` on each `task --state started` event.

**Worked example** (`../../agentic-sdlc/examples/worked-example/specs/001-csv-export/plan.md`, T1 done): `conflict: T3/T4 share server/test/routes/reports/export.test.ts → T4 runs in wave 3, after T3`, so plan-graph prints `ready: T2 · frontier (max 3): T2`; T4 waits for T3 even though its own blocker T1 is done. The batch is T2 alone and runs sequentially. After T2 and T3 are done, the frontier is T4, T5; T4 owns `server/src/export/csv.ts` and two server tests, T5 owns four files under `web/src/`: disjoint, and T5 consumes the route's HTTP contract (fixed by T3, already done), not anything T4 changes → T4 and T5 run in parallel.

## 3. Workspaces

1. The feature branch (`feat/NNN-slug`) is the integration branch; record its tip as `WAVE_BASE`.
2. One worktree per task, from `WAVE_BASE`:

   ```bash
   git worktree add ../<repo>-NNN-T4 -b feat/NNN-slug-T4 <WAVE_BASE>
   git worktree add ../<repo>-NNN-T5 -b feat/NNN-slug-T5 <WAVE_BASE>
   ```

3. Confirm each worktree passes the baseline: run the DoD test command once inside it, or `preflight --plan … --mode attended` from inside it. A red baseline → no wave; fix the environment first (cause `env`).
4. Each Developer brief carries its own worktree path as the working directory, BASE = `WAVE_BASE`, and the Files list as its only writable set.

## 4. Dispatch and ledger

1. Dispatch all Developers of the wave in one step (one message with several subagent calls, or the platform's equivalent). Starting one, waiting, then starting the next is sequential execution with extra cost.
2. **Single ledger writer.** During a wave only the controller writes the run ledger. Each Developer reports its red line (test name + first failing line), its rounds (signature, cause, tried, result) and its commits; the controller records them with `run-ledger red`, `round` and `task` on the Developer's behalf, in the order reported. Two processes appending to one JSON Lines file corrupt the sequence.
3. Bounds and breakers apply per task as in sequential mode. A breaker on one task stops that task only; the others in the wave may finish, but no new wave starts until the human rules.
4. Per-task review runs as each task reports `DONE`, without waiting for the rest of the wave.
5. Bounded waiting (`modes.md` §2 rule 6) applies to the whole wave.

## 5. Integration

After every task in the wave has passed its per-task review (or been stopped by a breaker):

1. In the main checkout on the feature branch, merge the finished task branches **in task-ID order**: `git merge --no-ff feat/NNN-slug-T4 -m "merge T4 into feat/NNN-slug"`. `--no-ff` keeps each task's commits and their `Refs: Tn AC-n` trailers visible to `plan-graph --from-git`.
2. After **each** merge, run the full DoD block. Record the result in the progress output.
3. **Merge conflict** → `git merge --abort`; the wave is over; the conflicting task (and any later one) is redone sequentially on the integrated branch; report `plan` cause to the Planner when the conflict is in a file the Files lists claimed disjoint (the plan was wrong).
4. **DoD red after a merge** → do not merge further task branches; record a `build-test` round on the task whose files the failing output names (`--cause plan` when the failure is an interaction the plan did not declare, else `code`), fix it on the feature branch, and run the remaining tasks of the wave sequentially.
5. All merged and DoD green → `task --state done --commit <merge sha>` for each task, remove the worktrees and task branches (`resume-and-isolation.md` §7), copy new `render` rows into `plan.md` `## Loop ledger`.

## 6. Checkpoint

A wave is a batch. At the batch checkpoint show: the wave, each task's status line and rounds, each merge with its DoD result, and the next frontier. Attended mode ends the turn there unless the human chose "end only".

## 7. Red flags

| Thought | Answer |
|---|---|
| "The Files overlap only in the test file; the tests are independent" | Shared file → same wave forbidden. plan-graph serializes it; so does this skill |
| "Both tasks add a dependency, the lockfile will merge" | Lockfiles never merge cleanly; shared manifest → sequential |
| "Merge all branches, then run the DoD once" | One DoD run per merge locates the breaking task; a single run at the end does not |
| "Let each Developer append to the ledger" | Concurrent appends corrupt the sequence check; the controller is the only writer during a wave |
| "Unattended will be faster in parallel" | Unattended runs are sequential by contract |
