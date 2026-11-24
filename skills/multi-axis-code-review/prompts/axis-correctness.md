# Prompt — Lens L2 (part 1): correctness and edge cases

Used in Step 4 of `../SKILL.md`. **L2 is one lens in one fresh context**: paste this block first and `axis-design-simplicity.md` second, into the same context, and collect one finding list `L2-1..n` with one CHECKS PERFORMED list. Replace every `{{…}}`. Before dispatch, delete any sentence that tells the lens what not to flag.

No subagents on the platform → run both L2 blocks in one fresh pass after clearing working notes, load only the inputs below, and label the lens row and every finding `self-review`.

```text
ROLE
Lens L2 of an independent code review, part 1: correctness and edge cases. Read-only. Fix
nothing, dispatch no helpers, praise nothing. The author's reasoning and the PR text are not
provided; comments in the code are claims to test, not facts.

INPUTS
- Diff ({{BASE_SHA}}...{{HEAD_SHA}}): {{DIFF_PATH}}
- Plan: {{PLAN_PATH}} (task signatures, Files, ## Impact)
- ADRs: {{ADR_PATHS or "none"}}
- CONSTRAINTS.md: {{CONSTRAINTS_PATH or "n/a — not Full path"}}
- Code map: {{CODEMAP_PATH}}
- DoD output (last 40 lines per command): {{DOD_OUTPUT}}
- Spec non-functional limits (numbers only, e.g. "50,000 rows", "p95 ≤ 3 s"): {{NFR_LIMITS or "none"}}

METHOD
Read the diff once, hunk by hunk. Open a file outside the diff only for a named risk (a caller
of a changed signature, a shared mutable value, a lock order) and say which risk.

CHECKS — perform every one and list it with its outcome
1. Path trace. For each changed branch: missing else/default; the implicit branch of an enum or
   status the diff extends; early returns that skip cleanup; loops with an off-by-one bound.
2. Boundary values. Empty, one, maximum, maximum + 1, null/undefined/absent, zero and negative
   numbers, unicode and very long strings, the NFR limits above.
3. Error paths. Every call that can fail: is the failure handled, propagated with context, or
   swallowed? Partial failure mid-operation leaves which state?
4. Concurrency and ordering. Two requests at once; retries; idempotency of writes; a handle or
   ID re-used after a call that can invalidate it.
5. Time and resources. Time zones and clock use; memory and time at the stated limits;
   unbounded reads, N+1 queries, missing pagination or timeouts.
6. Interface. Each changed public function, route or schema matches the plan signature
   (names, types, status codes, error shapes).
7. Consumers. Using the code map, trace 1–3 hops to callers of changed behaviour; name the
   smallest realistic regression no test would catch.
8. Logging. New log lines carry IDs, not personal values; errors are logged once.
9. DoD output. Re-read it for warnings, deprecations, skipped-test counts and unhandled
   promise rejections hidden in a green run.
10. Weakened bar (config). Judge each scan hit on thresholds, timeouts, retries, lint
    suppressions and CI steps: {{SCAN_HITS or "none"}}

PROPOSED SEVERITY (propose only; the Reviewer verifies and rates)
- Critical: an AC violated; data lost or corrupted; DoD red; a silently wrong result.
- Important: correct today but fragile — unbounded memory on a bounded input, swallowed error,
  interface drift from the plan, regression gap at a consumer.
- Minor: readability only.
Grade by effect on the user, not by whether the spec mentioned the case.

OUTPUT — continue in part 2, then one combined list
L2-<k> · <file>:<line-range> · <cause> · <one-line defect> · evidence: <quoted line and the
  input that breaks it, or command and output> · proposed: <severity>
```
