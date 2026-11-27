# Fix Loop and Escalation — Rounds, Causes, Breakers, Rulings

Load this file at the first failed round of any task, at every review round, and whenever `run-ledger` exits 3. It is the working procedure behind `../../agentic-sdlc/references/loops.md` (the contract: catalogue, routing, breakers B1–B6, ledger format).

## 1. Anatomy of a round

Where this file and `loops.md` differ, the contract wins and the gap is reported. A **round** is one fix attempt followed by its re-check. It is recorded once, after the re-check, pass or fail.

1. **Read the ledger first:** `node <scripts>/run-ledger.mjs status --run <id>` (or the plan's `## Loop ledger` rows without Node). Note the round number per loop, every failure signature seen and every approach already tried on this task.
2. **Classify the failure** (§3) before choosing a fix. The cause decides where the work goes, not how hard to try.
3. **Choose an approach not in the ledger.** A `--tried` text already used in the same loop is refused (exit 1); a reworded repeat of the same idea is the same approach.
4. **Apply the fix** inside the task's Files.
5. **Scoped re-check:** the failing check plus the tests mapped to every touched file in `docs/codemap.md` or the plan's `## Impact` row; no mapped tests for a touched file → the full test suite.
6. **Record the round** with the result. The full DoD block runs only at loop exit (task done, PR open), never as a substitute for the scoped re-check and never skipped at exit.

## 2. Commands per loop

| Loop | Record a failure | Record the pass | Bound (failed rounds) | Breaker |
|---|---|---|---|---|
| red-green | `round --run r1 --task T3 --loop red-green --result fail --signature "<sig>" --cause code --tried "<what changed>"` | `round --run r1 --task T3 --loop red-green --result pass` | 3 → automatic switch to debug | B1 |
| debug | `round … --loop debug --result fail --signature "<sig>" --cause <code\|test\|env> --tried "H2: <hypothesis> — <test that refuted it>"` | `round … --loop debug --result pass --tried "H3 proven by <test>"` | 3 refuted hypotheses | B5 → Architect |
| build-test | `round … --loop build-test --result fail --signature "<sig>" --cause <cause> --tried "<fix>"` | `round … --loop build-test --result pass` | 5 (lower with `budgets.max_rounds`) | B3 → Tech Lead |
| review-fix | `round … --loop review-fix --result fail --signature "<F-IDs + statements>" --cause <cause> --tried "<fixes or 'review round 1 of <BASE>..<HEAD>'>"` | `round … --loop review-fix --result pass --tried "<fixes with SHAs>"` | 3 | B4 → Tech Lead |

`<scripts>` is the directory holding `run-ledger.mjs` (Step 0 of SKILL.md). Every command takes `--json` for machine output and `--turns N` for the turn budget.

**Which loop a failure belongs to.**

| Failure | Loop |
|---|---|
| The task's new AC test is still red after the first green attempt | red-green |
| After B1: each hypothesis tested with a test | debug |
| The AC test is green but another DoD command fails (lint, typecheck, another test, coverage below `coverage_min`) | build-test |
| A per-task review or the Test-stage review leaves ≥ 1 confirmed Critical open | review-fix |
| The DoD fails after merging a parallel wave | build-test, on the task whose files the failure names |

**Separate counters.** Per-task review rounds in Build count on the task; Test-stage review rounds count on `PR`, because the run is finished by then. Each fires B4 at its third failed round. Fix Critical findings completely in each round instead of patching the reported line.

## 3. Cause classification

Pick the cause from evidence, never from preference. Ask in this order and stop at the first "yes":

| # | Question | Cause | Goes to |
|---|---|---|---|
| 1 | Do two ACs contradict each other, or can an AC not be met as written? | `spec` | Specify; Specify sign-off void (B6 → Product Owner) |
| 2 | Can the interface or architecture in the plan not satisfy the AC (wrong signature, missing component, impossible data flow)? | `design` | Design; Design sign-off void (B6 → Tech Lead) |
| 3 | Is the task order, its Files list or its Blocked by wrong (needs a file another task owns, depends on an uncommitted task)? | `plan` | Design; Design sign-off void (B6 → Tech Lead) |
| 4 | Is a tool missing, a service down, a port taken, the failure flaky with no code change? | `env` | `preflight` must pass again before the next task starts |
| 5 | Is the test itself wrong: wrong fixture, wrong expected literal, an anti-pattern A1–A14 from `../../agentic-sdlc/references/tdd.md` §3? | `test` | Build, same task |
| 6 | Is the production code wrong? | `code` | Build, same task |
| 7 | None of the above can be shown yet | `unknown` | Build, at most 1 round; the 2nd `unknown` on the task (any loop) fires B6 as `design` |

**Debug cause-class rule.** A debug round records the cause class of the hypothesis it tested (`code`, `test` or `env`). A hypothesis always names a cause, so a refuted hypothesis is never `unknown`; using `unknown` there would fire B6 before B5.

**`test` is not a licence to edit the test into passing.** A `test` cause fixes a wrong fixture or literal against the AC text; it never deletes an assertion, adds `.skip`, widens a tolerance or lowers `coverage_min`. A test listed in `acceptance-tests.md` is never edited by the Developer: disagreement with it is a finding routed by cause.

**Examples.**

| Failure output | Cause | Why |
|---|---|---|
| `AC-4: expected 422, got 200` after the count check was added | `code` | The behaviour is specified and reachable; the implementation is wrong |
| `ECONNREFUSED 127.0.0.1:5432` in the DoD test run | `env` | Database not running; no code involved |
| AC-2 says "prefix with an apostrophe", AC-5 says "export values unmodified" | `spec` | Both cannot hold for `=SUM(A1)` |
| Plan signature `exportCsv(filters): string` but AC-4 needs a streamed response over 50,000 rows | `design` | The signature forces whole-file buffering |
| T4 needs to modify `export.test.ts`, which only T3 lists | `plan` | Files list wrong |
| Expected literal `12.5` while AC-1 says "2 decimals" | `test` | The test contradicts its own AC |

## 4. Failure signatures

Signature = first failing test name + first error line, normalized before comparison: remove durations (`(12 ms)`), line:column positions (`:41:17`), memory addresses (`0x7ffd…`), temporary paths and random IDs. `run-ledger` normalizes on comparison; write the readable form.

| Raw | Recorded |
|---|---|
| `✗ AC-4 more than 50,000 rows returns 422 (35 ms)` / `AssertionError: expected 200 to equal 422 at export.test.ts:88:21` | `export.test AC-4: expected 200 to equal 422` |
| `FAIL lint src/export/csv.ts:14:3 no-unused-vars 'header'` | `lint csv.ts: no-unused-vars 'header'` |
| Review round with F-T3-1 and F-T3-2 open | `F-T3-1 unescaped filename from q; F-T3-2 whole CSV in memory` |

The same normalized signature in 2 consecutive build-test or review-fix rounds fires B2 (anti-thrash), whatever the round count.

## 5. Breakers and what the controller does

| Breaker | Fires on | Controller action | Allowed rulings |
|---|---|---|---|
| B1 | 3rd failed red-green attempt | Switch to the debug loop at once (skill `systematic-debugging`): reproduce, state 3–5 falsifiable hypotheses, test one per round. No human needed | — |
| B2 | Same signature twice in a row, or 3 failed build-test fixes since the last ruling | Stop fixing. Print the brief as a design question to the Architect | continue, reroute, split, handover, drop |
| B3 | 5th failed build-test round | Stop. Brief to the Tech Lead | reroute, split, handover, drop |
| B4 | 3rd failed review-fix round | Stop. Brief to the Tech Lead with a ruling requested on every open finding | reroute, handover, drop |
| B5 | 3rd refuted debug hypothesis | Stop. Brief to the Architect | reroute, split, handover, drop |
| B6 | Cause `spec`, `design` or `plan`; or `unknown` twice | Stop. Brief to the Product Owner (spec) or the Tech Lead; the related approval is void | reroute, handover |

**Order in practice.** With no ruling in between, the 3rd failed build-test round fires B2 (3 failed fixes) before B3 can: B3's cap of 5 is reached only after a `continue` ruling, which resets the anti-thrash count but not the round count.

`run-ledger` exits 3 when a breaker fires and refuses every further round on the task until a ruling is recorded. In attended mode end the turn after the brief. In unattended mode the breaker is also a halt (`loop-bound` for B2–B5, `spec-design-cause` for B6): stop the run.

**Fresh context before escalating.** On a platform without a stronger model, one extra round before a B2 or B3 escalation is permitted in a fresh context that receives only the task row, the ledger rows and the failing output. It counts toward the same bound; it never runs after the bound fired.

## 6. Escalation brief

`run-ledger` prints it at exit 3. Without Node, write the same five lines by hand:

```text
ESCALATE · run r1 · T3 · B2 anti-thrash → Architect
Why: same failure signature in 2 consecutive rounds · loop build-test · round 2 · cause code
Failure signature: export.test AC-4: expected 200 to equal 422
Tried:
  1) [build-test r1] count rows before opening the stream → fail
  2) [build-test r2] move the limit check into the query builder → fail
Ruling requested (one of): continue | reroute | split | handover | drop
Record: run-ledger ruling --run r1 --task T3 --by "<role: name>" --decision <ruling> --note "<text>"
```

Add one line of evidence that the human can verify in under a minute (the failing command and its last 10 output lines). Never add a recommendation that pre-judges the ruling; listing the options with their cost is allowed.

## 7. Rulings and what follows

Record only the human's words: `run-ledger ruling --run r1 --task T3 --decision split --by "Tech Lead: J. Park" --note "split count and stream"`.

| Ruling | Next step | Approval effect |
|---|---|---|
| `continue` (B2 only) | Same task, the new approach stated by the human in `--note`; the anti-thrash count resets, the hard cap keeps counting | none |
| `reroute` | Back to the stage named by the cause (`spec` → Specify, `design`/`plan` → Design); stop Build on this task; other unblocked tasks may continue in attended mode only if the human says so | Specify or Design sign-off void until renewed |
| `split` | The Planner splits the task into new IDs (never reusing the old one); `plan-graph --write`; new Design sign-off; the old task closes as `split` | Design sign-off void |
| `handover` | A named human takes the task; the run skips it; the human's commits still carry `Refs: Tn AC-n` | none |
| `drop` | The task leaves scope with a spec revision (change protocol, `../../agentic-sdlc/references/rules.md`) | Specify (and Design) sign-off void |

A ruling given in chat but not recorded in the ledger (or the plan's Loop ledger without Node) does not exist after a Clear: record it before acting on it.

## 8. Per-task review-fix loop

1. The task reviewer returns confirmed findings with severity (`../prompts/task-reviewer.md`).
2. Record the review round: ≥ 1 confirmed Critical open → `--result fail`; else `--result pass`. Important and Minor findings never fail the round on their own.
3. Send the findings to the Developer in receive mode (`../../agentic-sdlc/references/review.md` §5): verify each against the code, then `fixed <sha>` · `rejected <evidence>` · `deferred <issue>` (Minor; Important only with owner acceptance; Critical never). A rejected Critical goes to the human for a ruling before the task closes.
4. Re-engage the same Developer for the fixes when the platform allows continuing it; otherwise dispatch a fresh Developer with the task brief plus the findings verbatim. Fix commits carry `Refs: Tn AC-n F-Tn-k`.
5. Re-review with `../prompts/re-review.md` on `<FIX_BASE>..HEAD`; record the next review round with `--tried` naming the fixes and their SHAs.
6. Important findings neither fixed nor accepted → the task closes `DONE_WITH_CONCERNS`; each one is copied into the PR `## Review triage` for the Test-stage Reviewer.

## 9. Quick path

No `plan.md`, so no task IDs: commits carry `Refs: AC-n`. The run ledger is optional; when it is not used, keep the rows by hand in the PR `### Loop ledger` with Task = `AC-n` and the same columns (`Date · Task · Loop · Round · Failure signature · Cause · Tried · Result`). The bounds and breakers are unchanged.

## 10. Rows in the plan and the PR

`run-ledger render --run <id>` prints one row per failed round (`failed`), per round that fixed a failure (`fixed`), per escalation (`escalated`), plus ruling and halt rows. Copy new rows into `plan.md` `## Loop ledger` at each task exit (the section is excluded from the plan hash) and the full table into the PR `### Loop ledger` before requesting review. Rows are never deleted or edited; a correction is a new row.

Example after T3 above:

| Date | Task | Loop | Round | Failure signature | Cause | Tried | Result |
|---|---|---|---|---|---|---|---|
| 2026-11-24 | T3 | build-test | 1 | export.test AC-4: expected 200 to equal 422 | code | count rows before opening the stream | failed |
| 2026-11-24 | T3 | build-test | 2 | export.test AC-4: expected 200 to equal 422 | code | move the limit check into the query builder | escalated |
| 2026-11-24 | T3 | ruling | — | B2 → Architect | — | split: count and stream (Architect: M. Silva) | — |

## 11. Without Node

Count the rounds from the plan's `## Loop ledger` before every round, apply the same bounds, write the escalation brief by hand, and record rulings as rows. The PR header states `Enforcement: prompt-only`.
