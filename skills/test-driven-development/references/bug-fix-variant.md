# Bug-Fix Variant: Reproduce First

Load when the task is a bug: a Quick-path issue with an acceptance test, a `BUG-n` item, or a Reviewer finding that names a defect. Contract: `../../agentic-sdlc/references/rules.md` rule 4 ("a bug fix starts with a failing regression test") and `../../agentic-sdlc/references/tdd.md` §1–§2 (`BUG-n` names, red rules, bounds).

## 1. Procedure

| # | Step | Output | Stop condition |
|---|---|---|---|
| 1 | **Reproduce by hand** with the exact reported inputs, data shape and environment (version, flag state, locale, time zone) | Command and observed symptom, pasted | Symptom absent after 2 attempts → §4 |
| 2 | **Locate the seam** where the bug shows to a caller (§2) | Seam note with catches/misses | No correct seam → §3 |
| 3 | **Write `BUG-n <expected behaviour>`** before reading the suspected code path (§5) | Test file diff | — |
| 4 | **Run it alone; it must fail with the reported symptom** | Red output whose first failing line matches the symptom | Fails for another reason → fix the test; passes → §4 |
| 5 | Record red: `run-ledger red --task Tn --test "BUG-418 empty filter returns the header row" --signature "expected 1 line, got 0"` | Ledger event or pasted row | — |
| 6 | **Minimal fix** at the root cause, not at the symptom | Production diff | 3 failed attempts → debug loop (`systematic-debugging`) |
| 7 | Run the test (green), the module tests, then **re-run the step 1 reproduction** | Three outputs | Reproduction still shows the symptom → the test is at the wrong seam; back to step 2 |
| 8 | **Related cases.** For each sibling input class the fix touches (empty, one, many; other callers of the changed function), add a test or name why none is needed | Tests or a one-line reason each | — |
| 9 | Name-the-break: revert the fix temporarily; the `BUG-n` test must fail again; restore | Pasted failing line | Test passes without the fix → it does not guard the bug; rewrite |
| 10 | DoD at task exit, commit with the `Refs:` trailer, task report | Commit and report | — |

"Matches the symptom" means the failure names the same wrong observable the report describes (wrong count, wrong status, wrong value, exception type). `expected 1 line, got 0` matches "the CSV has no header row"; `TypeError: cannot read 'rows' of undefined` in setup does not.

## 2. Choosing the correct seam

A correct seam exercises the bug the way it happens at the call site.

| Bug shape | Too shallow | Correct seam |
|---|---|---|
| Wrong result for one input | — | The public function the caller invokes |
| Bug appears only through a chain (route → service → serializer) | Unit test of the serializer alone, where the input never has the failing shape | The highest seam that passes the real chain (service or route test) |
| Several callers, one fails | Test of the one caller that works | A test per failing caller, or the shared function with the failing caller's input |
| Concurrency or ordering | A single-threaded unit test | A test that drives the interleaving deterministically (controlled scheduler, barrier, injected clock) |
| Configuration-dependent | Test with defaults | Test with the reported configuration loaded the way production loads it |

If the red was forced by editing a fixture or production code to simulate the bug, compare against a pristine copy (`git diff`) to prove the simulation is what made it red, and remove it before the fix.

## 3. No correct seam: the missing-seam finding

When no test at any existing seam can fail on the real bug pattern (the behaviour lives in untestable glue, a static singleton, an unreachable branch), a test at a shallower seam gives false confidence. Do not write it as the guard, and do not fix untested.

1. Write the finding in the task report:

   ```markdown
   Missing seam — BUG-418
   Symptom: empty filter returns 0 rows (reproduced: <command>, <output line>)
   Where it happens: <file:line chain>
   Why no seam reaches it: <reason, e.g. CSV writer constructed inside the HTTP handler with a hard-coded stream>
   Smallest seam that would: <proposal, e.g. inject the writer into exportCsv>
   Catches / misses at the proposed seam: <one line>
   ```

2. Return `NEEDS_CONTEXT` to the Planner: adding the seam is a plan change (a new task before the fix), which goes through the Design sign-off rules of the path.
3. Partial seam: a shallower test that **does** fail with the reported symptom may be kept as the `BUG-n` guard; list it as `seam: partial — misses <what>` and return `DONE_WITH_CONCERNS` so the Reviewer and the retro see it.
4. A bug fix never closes with `--no-red`.

## 4. Not reproduced

The reproduction (step 1) or the `BUG-n` test (step 4) passes with the exact reported inputs after 2 attempts:

- Write no fix code.
- Return `NEEDS_CONTEXT` with: commit SHA tested, inputs and environment used, the passing output, and the question that would unblock (missing data shape, version, configuration).
- If the evidence shows the behaviour is already correct on the current revision, the report says so with that output; closing the issue is a human decision.

## 5. Independent reproduction

The test should be shaped by the report, not by the fix the Developer already suspects.

- **With subagents:** dispatch a fresh subagent with only the issue text, the reproduction output and the seam's interface; it writes `BUG-n` and returns the test and its failing output. The Developer verifies the red, then fixes.
- **Without subagents:** write and run the test before opening the file that contains the suspected cause; label the pass `--- reproduction pass ---` in the task notes.

## 6. Worked mini-example

Issue: "Orders report: exporting with no filter gives an empty file; expected the header row." Quick path.

1. Reproduce: `curl -s localhost:3000/reports/orders.csv | wc -l` → `0`.
2. Seam: `exportCsv(filter, user)` — catches: header and row emission · misses: HTTP content type (route test AC-5).
3. Test:

   ```ts
   it("BUG-418 empty filter returns the header row", async () => {
     const out = await exportCsv({}, aManager());
     expect(out.body.split("\n")[0]).toBe("order_id,customer,total");
   });
   ```

4. Red: `expected 'order_id,customer,total', received ''` — matches the symptom.
5. Fix: the early `if (rows.length === 0) return empty()` skipped the header; move the header write before the guard.
6. Green, module tests green, `curl ... | wc -l` → `1`.
7. Related case: one row and many rows already covered by AC-1 tests; reason recorded.
8. Revert the fix → BUG-418 fails again → restore.
