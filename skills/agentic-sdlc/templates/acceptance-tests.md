<!--
Agentic SDLC — acceptance tests. Rules: references/verification.md §2 (independent test design) and §3 (CANNOT_VERIFY).
Written by the Test Engineer (agents/test-engineer.md) after Plan approval, from the approved spec only,
in a context that has never seen the implementation diff, the feature branch or the PR text.
The Implementer never edits this file or the tests it lists. Delete these comments; keep every heading.
-->

# Acceptance tests — <NNN-slug>

**Spec:** `specs/<NNN-slug>/spec.md` rev <N> · sha256 `<12 hex>` (a later spec revision voids the rows of every changed AC)
**Base commit:** `<sha>` (the only code the designer read)
**Designed by:** <Test Engineer (fresh subagent) | self-review — separate pass from a cleared context>
**Inputs read:** <spec.md, test conventions in <path>, code at the base commit> · **Not seen:** implementation diff, feature branch, PR text

## Map

One row per test; every AC has ≥ 1 row. `Critical` = yes when the AC's `Priority` in `spec.md` is `critical`. An AC that touches a risk trigger (auth, personal/health data, money, public API, schema/migration, irreversible, regulated) or a spec Security note but is marked `normal` → report it to the Planner before designing its tests.

| AC | Critical | Test ID | Test name (contains the AC ID) | Level | File | Failure it catches | Negative |
|---|---|---|---|---|---|---|---|
| AC-1 | <yes \| no> | AT-1a | `AC-1 <outcome>` | <unit \| integration \| end-to-end> | `<path>` | <one sentence: the defect that turns this test red> | <no> |
| AC-1 | <yes \| no> | AT-1b | `AC-1 <negative outcome>` | <level> | `<path>` | <defect> | <yes> |

Rules: lowest level that observes the outcome; ≥ 1 negative test for every AC that handles input, permissions or limits; mocks only at process boundaries (network, clock, filesystem, third-party API).

## Red at the base commit

Each test must fail at the base commit for the stated reason. A test that passes at the base proves nothing → rewrite it before Build starts.

| Test ID | Command | Exit | Failure line (first assertion or error) |
|---|---|---|---|
| AT-1a | `<command>` | <non-zero> | <line> |

## Green at the PR head

Filled in the Test stage; the same rows appear in the PR `## Verification` table with the current fingerprint.

| Test ID | Command | Exit | Fingerprint | Time (ISO-8601) |
|---|---|---|---|---|
| AT-1a | `<command>` | <0> | `<12 hex>` | <time> |

## Not verifiable before release

| AC | Critical | Reason | Checked instead | Verifier (role, person) | When (≤ 14 days after release) |
|---|---|---|---|---|---|
| <AC-n or "none"> | <yes \| no> | <production-only, third party without sandbox, hardware, human judgement> | <check> | <role, person> | <date or event> |

A Critical row here needs a waiver before PR approval (`references/governance.md` §Waivers). More than half of the ACs here → return to Design for test seams.

## Coverage check

| Check | Result |
|---|---|
| Every AC in the spec has ≥ 1 row in Map | <yes \| list missing AC IDs> |
| Every Test ID cites an AC that exists in the spec | <yes \| list unknown IDs> |
| Every input, permission or limit AC has a negative test | <yes \| list> |
| Every test was red at the base commit | <yes \| list rewritten tests> |
