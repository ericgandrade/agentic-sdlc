# Red Loop Construction

Load in Step 1 of `SKILL.md`, before any hypothesis exists. The red loop is the single command that goes red on this bug and green once it is fixed. Every later step depends on it; time spent here is the cheapest time in the whole debug loop.

## 1. Gate: the loop record

Step 1 is complete only when this record is filled in and the command has been run at least once in the current session:

```text
RED LOOP · task T3 · bug BUG-418 (or AC-4)
Command:      npx vitest run tests/export.test.ts -t "BUG-418"
Last run:     exit 1 · 1.8 s · fingerprint 3f9a0c2b71de
Symptom:      expected 422 "row limit", got 200 (matches the report: export of 50,001 rows succeeds)
Determinism:  10/10 red (or: 6/10 red at stress level x8, pinned)
Kind:         failing test at the service seam (construction 1)
```

| Property | Threshold | Fails when |
|---|---|---|
| Red-capable | Drives the real code path and asserts the reported symptom, not "does not crash" | It fails for a different reason than the report (a nearby bug) |
| Deterministic | 10 of 10 runs give the same verdict; for intermittent bugs a pinned red rate ≥ 50% | The verdict changes between identical runs below 50% |
| Fast | ≤ 10 s per run is tight; ≤ 60 s is acceptable; > 60 s → tighten before Step 2 | Each probe waits on a full suite or a deploy |
| Agent-runnable | Runs unattended from a shell | It needs a human click (then use the HITL template, construction 10) |
| Redacted | Secrets come from environment variables; shown output carries `<REDACTED>` for any credential | A token, password or customer record appears in the command or output |

The command becomes the regression evidence later: the same test (or its minimised form) is the `BUG-n` or `AC-n` regression test of Step 6.

## 2. Ten constructions, in order of preference

Try them top to bottom; stop at the first that meets the gate.

| # | Construction | Use when | Example |
|---|---|---|---|
| 1 | Failing test at the nearest seam that reaches the bug | A test framework exists and a seam reaches the path | `pytest tests/test_export.py -k BUG_418` |
| 2 | HTTP script against a local server | The bug is visible at an endpoint | `curl -s -o /dev/null -w '%{http_code}' -X POST localhost:3000/export -d @fixtures/50001.json` → expect 422 |
| 3 | CLI on a fixture input, diffed against a known-good output | Batch jobs, converters, compilers | `./bin/convert fixtures/in.csv \| diff - fixtures/expected.csv` |
| 4 | Headless browser script asserting DOM, console or network | The symptom is only visible in a page | a 20-line browser-automation script that clicks Export and asserts the error banner text |
| 5 | Replay of a captured trace | A production request, event log or payload was saved (redacted) | `node scripts/replay.mjs captures/req-2026-11-20.json` |
| 6 | Throwaway harness: the smallest program that calls the failing unit | Setup of the full app is slow or broken | `node scratch/debug-harness.mjs` importing only the parser |
| 7 | Property or fuzz loop | The bug depends on input shape | 1,000 generated inputs, stop at the first counterexample, print its seed |
| 8 | Bisection harness over history | "It worked last week" | `git bisect start HEAD v2.3.0 && git bisect run npx vitest run tests/export.test.ts` |
| 9 | Differential loop | Two versions or two configurations disagree | run the same input through old and new builds, diff the outputs |
| 10 | Human-in-the-loop script | The path needs a human (hardware, third-party login, visual check) | `references/hitl-reproduction-template.md` |

Throwaway harnesses (6) live under a clearly named scratch path (for example `scratch/debug-<bug>/`), are listed in the task report and are deleted in Step 8 unless they become the regression test.

## 3. Tighten the loop

Treat the loop as a product. After the first red run, improve it on three axes before forming hypotheses:

| Axis | Moves |
|---|---|
| Faster | Run one test, not the file; cache setup; skip unrelated initialisation; use an in-memory database seeded by the test; narrow the input |
| Sharper | Assert the exact value or message from the report; one assertion per symptom; print the observed value on failure |
| More deterministic | Inject the clock; seed randomness; isolate the filesystem in a per-test directory; replace network calls with a boundary fake; run serially (`--runInBand`, `-p no:randomly`, `--test-concurrency=1`) |

A loop that takes 30 s and flakes is barely better than no loop; a 2 s deterministic loop is tight.

## 4. Intermittent bugs: raise the rate

For a bug that reproduces sometimes, do not chase a perfect reproduction; raise the red rate until probes are informative:

1. Loop the trigger: `for i in $(seq 1 50); do npx vitest run -t "BUG-512" >/dev/null 2>&1 || echo red; done | wc -l` → red count out of 50.
2. Add stress: parallel workers, smaller timeouts in the test environment, artificial latency at the suspected boundary.
3. Record the pinned rate in the loop record (`Determinism: 31/50 red at 8 workers`). A probe that moves the rate from ≥ 50% to 0 of 50 is evidence; a change from 2% to 0% is noise.
4. Order-dependent failures (passes alone, fails in the suite) → `references/triage-trees.md` §Order dependence and `scripts/find-polluter.mjs`.
5. Timing failures → `references/condition-based-waiting.md`.

## 5. No loop possible

Stop after 3 constructions have been tried and none meets the gate. Do not hypothesise without a loop. Report `NEEDS_CONTEXT` with:

```text
NO RED LOOP · task T3 · BUG-418
Tried: (1) service test — passes, data shape unknown; (2) curl on local server — 200 as expected, cannot reproduce; (5) no capture exists
Need one of: (a) access to an environment that reproduces it; (b) a redacted capture (request body, log lines with timestamps, HAR file); (c) approval for temporary tagged instrumentation in production (SRE and on-call engineer decide)
Not done: no hypothesis tested, no code changed
```

Production instrumentation is a state-changing production action: the SRE proposes it, the on-call engineer executes it (`../agentic-sdlc/references/release-ops.md` §Incidents).

## 6. Minimise

Once the loop is red, cut one element at a time (input rows, fields, callers, configuration keys, setup steps) and re-run after each cut. Keep an element only when removing it turns the loop green. Done when every remaining element is load-bearing. The minimal case shrinks the hypothesis space and usually becomes the regression test. Confirm that the minimised loop still shows the reported symptom, not a neighbouring one.
