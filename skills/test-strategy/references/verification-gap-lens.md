# Verification-gap lens (black-box variant for the Test Engineer)

Load at workflow Step 8 (design-time pass) and Step 10 (Test-stage pass). The question: **which AC could break without any acceptance test failing?**

The Test Engineer never sees the diff, so this variant works from the spec, `ux.md`, the base-commit code and the test output. The diff-based variant (changed code that could regress at a consumer with no test failing) belongs to Reviewer lens L1 (`../../agentic-sdlc/references/review.md`, skill `multi-axis-code-review`). Both feed the same PR `## Trace` and `## Review triage` sections; neither replaces the two-way gap analysis in `../../agentic-sdlc/references/verification.md` §5.

## 1. Gap kinds

| Kind | Definition | How to detect without the diff |
|---|---|---|
| **Untested AC** | An AC (or a `ux.md` row with an AC) has no Map row, or only rows that do not count (`case-design.md` §6) | Coverage check in `acceptance-tests.md` |
| **Weak oracle** | The smallest realistic violation of the AC (the *demonstration*) would not fail any assertion | Mutation check (`case-design.md` §5) against the AC text |
| **Not run** | The test exists but did not execute: filtered by name, skipped, focused elsewhere, not registered with the runner, or outside the CI job | Count executed tests by name in the output; compare with the Map |
| **Stale** | The spec revision or hash differs from the header of `acceptance-tests.md`, or an AC was reworded after the test was designed | Compare `spec-lint --hash` with the header |
| **Unguarded consumer** | A consumer of the behaviour named in the spec or code map at the base commit (another client of the same endpoint, an export reused by a scheduled job) is not exercised | Search the base commit for callers of the interface the AC names; 1–3 hops |

## 2. Procedure

1. Screen out ACs whose behaviour is fully covered by an integration row at the correct seam with a literal oracle and a negative case; note them as `covered`.
2. For each remaining AC write the demonstration: one sentence describing the smallest realistic defect ("the 403 check runs after the file is streamed"). "Any line could be deleted" is not a demonstration.
3. Read the test (not its name) and decide: would the demonstration fail an assertion? Read before claiming coverage; search the test directories for the AC ID and the interface before claiming no test exists.
4. Test stage only: parse the run output. Every Map test ID must appear as executed and passed. A missing name is a **not run** gap even when the exit code is 0.
5. Record each gap as a row; clean output is exactly `No verification gaps found.`

## 3. Output row

| Gap | AC | Kind | Demonstration | Existing evidence | Missing verification | Proposed disposition |
|---|---|---|---|---|---|---|
| G-1 | AC-3 | weak oracle | Route returns 403 but streams the file body first | AT-3a asserts status only | No assertion on empty body | Add body-length assertion to AT-3a (design-time) / finding for Reviewer (Test stage) |
| G-2 | AC-1 | not run | — | Map lists AT-1d | Playwright output shows 0 tests for `e2e/reports/export.spec.ts` (filtered by project config) | Fix the command; re-run; finding cause `test` |

At design time a gap is fixed before hand-off. At Test, every gap goes to the Reviewer as a finding (cause `test`, `spec` or `env`); the Test Engineer may add a missing acceptance test from the spec, never weaken an existing one, and the Reviewer decides whether the round stays NO-GO.
