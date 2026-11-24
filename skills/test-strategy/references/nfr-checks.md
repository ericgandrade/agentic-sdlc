# Non-functional checks — measure at the spec's number

Load at workflow Step 5 when an AC (or a numeric Constraint) states performance, accessibility, security, reliability or privacy. The Test Engineer contract: "Measure every non-functional AC (performance, limits, accessibility) at the number and unit it states" (`../../agentic-sdlc/agents/test-engineer.md`).

## 0. Rules for every NFR check

1. **Threshold from the spec only.** The number, unit, percentile, data set and environment come from the AC. A missing element → `NEEDS_CONTEXT` to the Analyst (testability check T3/T6 in `case-design.md`). Never pick a "reasonable" default.
2. **Numeric constraint outside the AC table** (for example "p95 ≤ 3 s" under `## Constraints`) → do not invent an AC. Report it as a concern ("numeric constraint without AC: <text>"), propose an AC to the Analyst, and design no Map row for it until the spec revision lands.
3. **Every number carries its source.** Write `lab (local, <machine>)`, `lab (staging)`, `scanner (<tool> <version>)` or `field (<source>)` next to each value. Lab and field numbers are never interchangeable; a local lab number never passes an AC that names staging.
4. **Unmeasured is a status, not a guess.** A check that cannot run before merge is a `## Not verifiable before release` row: reason, what was checked instead, verifier (role, person), date ≤ 14 days after release. Never write an estimated value.
5. **Repeatable command.** Each NFR row has one command a Reviewer can re-run with the same inputs; the result line quotes the measured value and the threshold, for example `p95 2.41 s ≤ 3 s (n=30)`.
6. **Correctness gates the metric.** A timed run whose functional assertions fail is not a measurement.

## 1. Performance

| Item | Rule |
|---|---|
| Level | `integration` (timed against the stand-in) or `end-to-end` for user-perceived timings; recorded in the Map like any other row |
| Data | The volume the AC states, generated synthetically with a fixed seed (the worked example uses 200,000 synthetic orders) |
| Warm-up | Discard the first 3 runs (cold caches, JIT) unless the AC is explicitly about cold start |
| Samples | Percentile ACs: ≥ 30 timed runs for p95 of a whole operation; ≥ 1,000 requests for p95/p99 of request latency under load. Mean-only ACs: ≥ 10 runs |
| Noise | Report the spread (min, median, p95, max). A result within the run-to-run variance of the threshold (for example 2.95 s against 3 s with ±0.2 s spread) is `DONE_WITH_CONCERNS`, not a clean pass |
| Same way twice | The red-at-base run and the PR-head run use the same command, data, machine class and cache state |
| Tools | Use what the project has (benchmark runner, load tool, browser performance trace). A new tool is a new dependency: ask first (rule 10) |

Frontend budgets (LCP, INP, CLS) are checked only when an AC states them; quote the AC's numbers, not general guidance.

## 2. Accessibility (WCAG 2.2 AA, from `ux.md` §Accessibility)

Map every `A-n` row to an automated check when a machine can decide it, else to a UX Designer check `A-n`. Scanners are **external** checks (they encode the standard), so they are preferred to hand-written assertions.

| `ux.md` row | Automated check (in the existing harness) | Left to the UX Designer |
|---|---|---|
| A-1 keyboard, visible focus, logical order | End-to-end test that tabs to each action and asserts focus lands in the stated order; focus not hidden behind sticky headers (2.4.11) | Whether the order feels logical on the full page |
| A-2 accessible names, announced status | Scanner rule for names; test locates controls by role and accessible name; assert an `aria-live` region receives the status text (4.1.3) | Screen-reader listening pass |
| A-3 contrast ≥ 4.5:1 text, ≥ 3:1 large text and UI components | Scanner contrast rule on each state that renders new colours (error, limit, disabled) | Contrast over images or gradients |
| A-4 not colour alone; reduced motion | Assert the state carries text or an icon with a name; emulate reduced-motion and assert no animation class | Judgement on meaning conveyed |

WCAG 2.2 additions worth a row when the surface has them: target size ≥ 24 × 24 CSS px (2.5.8); a single-pointer alternative to dragging (2.5.7); no cognitive test in authentication (3.3.8); help in a consistent place (3.2.6); no re-entry of data already given in the same flow (3.3.7); content reflows at 320 CSS px width (1.4.10).

A scanner run reports zero violations **for the rules it ran, on the states it visited**: record the URL or state list and the scanner version. A scanner pass never replaces the keyboard walkthrough.

## 3. Security (functional side only)

The Security Auditor owns the threat model, scanners and lens L3 (`../../agentic-sdlc/references/security.md`, skill `security-hardening`). The Test Engineer turns each security-relevant AC and abuse case into negative acceptance tests:

| Spec item | Test |
|---|---|
| Authorization AC | One negative row per role without the permission and for an anonymous caller; assert status **and** absence of the payload |
| Injection AC (formula, SQL, HTML, path) | Table of hostile inputs from the AC; assert the neutralised output literally |
| Limit or rate AC | At, above and repeated over the limit; assert no partial side effect |
| Abuse case written as negative AC | One row per abuse case, named with its AC ID |

Security findings that need code reading go to the Reviewer as rows, never into the test design.

## 4. Reliability

| AC shape | Check |
|---|---|
| Retry "at most N times" | Fake the boundary to fail N+1 times; assert exactly N retries and the stated final state |
| Timeout "within T" | Injected clock or a fake that never answers; assert the failure surface and that the caller is released by T |
| Idempotency | Send the same request twice with the same key; assert one effect |
| Partial failure "no partial file / no half-written record" | Fail the dependency mid-stream; assert nothing is persisted or delivered |
| Recovery after restart | Stop and start the process between steps when the harness supports it; else `CANNOT_VERIFY` with the staging check named |

Wait on conditions with a timeout (poll for the event, state or file), never on fixed durations; a legitimate fixed delay exists only when the AC is about time, and then on an injected clock.

## 5. Privacy

| Spec item | Check |
|---|---|
| Column or field allow list | Assert the exact field set; a new field fails the test |
| "No personal data in logs" | Capture log output in the test, seed a unique synthetic marker value, assert the marker is absent |
| Retention or deletion AC | Advance the injected clock past the retention window; assert the record is gone at the interface the AC names |
| Data class excluded by a non-goal | One negative row asserting its absence |

Fixtures stay synthetic (rule 7); a privacy test that needs a real record is redesigned.

## 6. Recording

NFR rows sit in the same Map table (level, file, failure it catches). The "Red at the base commit" row for a performance AC usually fails on the missing feature, not the threshold; that is expected and recorded as such. At the PR head, the green row quotes the measured value against the threshold.
