---
name: test-strategy
description: This skill should be used when acceptance tests must be designed from an approved spec and ux.md in a context that has not seen the implementation — mapping each AC-n to a test level and cases, covering UX states, accessibility and non-functional thresholds, proving every test red at the base commit, then running them at the PR head with a verification-gap check and, on the Full path, a time-boxed exploratory session (acceptance-test design after Design sign-off and the Test stage of the Agentic SDLC). Not for unit tests written test-first inside a task (use test-driven-development) or filling and auditing the PR Verification table (use verification-gate).
license: MIT
---

# Test Strategy

## Purpose

Agentic SDLC · Test stage (plus acceptance-test design after the Design sign-off, before Build) · used by the **Test Engineer** agent (`../agentic-sdlc/agents/test-engineer.md`).

Acceptance tests are designed from the spec, never from the code, so they check what was asked rather than what was built. This skill turns every `AC-n` in `spec.md` and every row of `ux.md` into tests at the lowest level that can observe the outcome, proves each test fails at the base commit for the stated reason, and later runs the same tests at the PR head to produce fingerprint-bound evidence for the PR `## Verification` section. It adds a black-box verification-gap lens and, on the Full path, one exploratory session of at most 30 minutes.

Contracts this skill implements and never contradicts:

- Output format: `../agentic-sdlc/templates/acceptance-tests.md` (header with spec rev and hash, Map, Red at the base commit, Green at the PR head, Not verifiable before release, Coverage check).
- UX input: `../agentic-sdlc/templates/ux.md` (state table `UX-n`, accessibility checks `A-1`..`A-4`, Test-stage checks).
- Independent test design, CANNOT_VERIFY and the evidence fingerprint: `../agentic-sdlc/references/verification.md` §2–§4.
- Mock boundaries and test anti-patterns: `../agentic-sdlc/references/tdd.md` §1 (rule 3) and §3 (anti-pattern catalogue).
- Worked example: `../agentic-sdlc/examples/worked-example/specs/001-csv-export/acceptance-tests.md` and `ux.md`.

## When to Use

- Design sign-off is recorded on a Standard or Full path and the router dispatches the Test Engineer to design acceptance tests before the first Build task.
- `ux.md` exists and its state rows and accessibility checks need tests or UX Designer checks.
- The spec states a measurable non-functional AC (latency, row limit, contrast, retention) that must be measured at its number.
- The Test stage needs fresh acceptance evidence at the PR head, a verification-gap pass, or (Full path) the exploratory session.
- A spec revision voided rows of changed ACs and they must be re-designed.

Do **not** use for:

- Unit tests written by the Developer during Build (red-green-refactor per task) → `test-driven-development`.
- Checking claims, filling PR Verification and Trace, or the done gate → `verification-gate`.
- Reviewing the diff, including the diff-based gap lens (Reviewer L1) → `multi-axis-code-review`.
- Writing or fixing acceptance criteria themselves → `spec-driven-development` (via the Analyst).
- Threat modelling, dependency and secret scans → `security-hardening`.
- Diagnosing why a test fails → `systematic-debugging`.
- Release smoke tests, canaries and rollback checks → `deployment-pipeline`.
- Ordering Build tasks → `writing-plans`.

Quick path: no `acceptance-tests.md`; the acceptance test is written in the issue before any code (`../agentic-sdlc/references/verification.md` §2). Apply Steps 1–3 to that issue test when asked.

## Workflow

### Step 0 — Entry check and discovery

1. Confirm the Design sign-off is recorded in `spec.md` or the PR. Missing → `BLOCKED` ("Design sign-off not recorded").
2. Compute the spec hash: `node skills/agentic-sdlc/scripts/spec-lint.mjs specs/<NNN-slug>/spec.md --hash` (12 hex). Record it with the spec revision.
3. Record the base commit (`git merge-base <default-branch> HEAD` before the branch exists, or the value in `plan.md`).
4. Confirm the inputs: the approved `spec.md`, `ux.md` (or "no user-facing surface"), the template, and the code at the base commit read through `git show <base>:<path>` or a worktree checked out at `<base>`. Any implementation diff, feature-branch file, PR text or Developer report in context → stop with `BLOCKED: context contaminated`; a fresh Test Engineer redoes the design.
5. Discover test conventions at the base commit: runner and config files, test directories, naming, helpers and fixtures, the command for one file and for the suite, CI job that runs them, and the end-to-end harness if any (`references/e2e-mode.md` §1). Never assume a stack.
6. Dispatch the design pass with `prompts/test-designer.md` as a fresh subagent. If the platform has no subagents, run that prompt in a separate pass after clearing working notes, and set `Designed by: self-review` in the header; the label must then appear in the PR `## Verification` and `## Review guide` sections, and on the Full path the second human reviewer is asked to inspect the test design.

### Step 1 — Testability pass

Check every AC and every `ux.md` state row against T1–T7 in `references/case-design.md` §2: T1 observable at an interface, T2 one behaviour, T3 measurable (no "fast", "scalable", "accessible" without number and unit), T4 literal oracle, T5 priority honest, T6 environment named for NFRs, T7 every `ux.md` row has an AC or `pattern:`. A failure is not designed around: list it as `NEEDS_CONTEXT` with the failed check and one question for the Analyst. If more than half of the ACs end up CANNOT_VERIFY, stop and return to Design.

T5 in practice: an AC touching a risk trigger (authentication, personal or health data, money, public API, schema or migration, irreversible action, regulated data) or a Security note but marked `normal` in the spec is reported to the Analyst, not silently upgraded. The `Critical` column copies the spec `Priority`.

### Step 2 — Cases per AC

For each AC, enumerate scenario classes (`references/case-design.md` §1): happy path, each boundary, each invalid input, permission denied, empty, limit reached, concurrency or repetition, and failure of a dependency. Keep a case only if it can fail for a named defect ("name the break", §3). Rules:

- ≥ 1 negative case for every AC that handles input, permissions or limits.
- Expected values are literals copied from the spec (status codes, copy, numbers, column order), never computed by code under test (§4).
- One behaviour per test; test IDs `AT-<n><letter>` where `n` is the AC number; the test name starts with the AC ID.

### Step 3 — Level per case

Apply the first-match rubric in `references/level-selection.md` §1:

| Order | Question | Result |
|---|---|---|
| 1 | Is the outcome observable only in production (real traffic, third-party live account, field data)? | `## Not verifiable before release` row with verifier, method and a date ≤ 14 days after release |
| 2 | Only a human can judge it (visual hierarchy, copy tone, screen-reader experience)? | UX Designer check `UX-n` / `A-n` |
| 3 | A pure function or module at a seam observes it? | unit |
| 4 | It crosses a real boundary the project owns (HTTP route, database, queue, file output)? | integration |
| 5 | It is an interface contract with another team's consumer or provider? | integration, "Failure it catches" prefixed `contract:` |
| 6 | It is a user journey through the browser or app that no lower level can observe? | end-to-end, at most one per journey `J-n` |

The template `Level` column takes only `unit`, `integration` or `end-to-end`. Pyramid ratios (about 80/15/5 unit/integration/end-to-end across a codebase) are guidance for spotting imbalance, not a target for one feature (§3). A case placed lower than ideal because a seam is missing is reported as `DONE_WITH_CONCERNS`; no seam at all is `BLOCKED` with a request to the Planner for a test seam task.

Doubles follow the dependency category (§2): real in-process code, real local database or temp filesystem, fakes or stubs only at process boundaries (network, clock, randomness, filesystem outside the temp dir, third-party API). Never mock the module under test or an internal collaborator.

### Step 4 — UX states and accessibility

Map every `ux.md` state row (`UX-1` empty, loading, success, partial or limit, error, no permission) to a test ID or to a UX Designer check `UX-n`. Assert the copy literally when `ux.md` gives copy. Map `A-1`..`A-4` per `references/nfr-checks.md` §2:

- A-1 keyboard and focus order → end-to-end keyboard-only path where a harness exists; UX Designer check otherwise.
- A-2 accessible names and `aria-live` announcements → automated assertion on role and name; announcement content by UX Designer check.
- A-3 contrast 4.5:1 text, 3:1 non-text → automated scanner where available, labelled `scanner`.
- A-4 not colour alone and reduced motion → UX Designer check unless a CSS media emulation exists.

An automated accessibility scan with zero violations is evidence for its rules only; it never closes a whole A-n row by itself.

### Step 5 — Non-functional checks

Use only thresholds the spec states (`references/nfr-checks.md` §0). A numeric constraint outside the AC table (for example in Constraints) is not tested as if it were an AC: record it as a concern and propose an AC to the Analyst. For each NFR AC record the number, unit, data set, environment and measurement label (`lab`, `scanner` or `field`). Performance: 3 warm-up runs, then ≥ 30 runs for a p95 of an operation or ≥ 1,000 requests for request latency; report min, median, p95 and max; a result within the run-to-run spread of the threshold is `DONE_WITH_CONCERNS`, never rounded into a pass. Security tests here are functional only (denied roles, limits, injection of formula characters into exports); scans belong to the Security Auditor. Anything measurable only on real traffic goes to `## Not verifiable before release`.

### Step 6 — Write the tests

Write test files under the project's test directories following the discovered conventions. End-to-end tests follow `references/e2e-mode.md`: use the existing harness, role-based locators, condition-based waits, own synthetic data. No harness, or the harness cannot reach the surface → do not install one; record a finding asking for a Design task and use a browser test plan `BTP-n` as the manual fallback, status `DONE_WITH_CONCERNS`. Brownfield code with no tests around the touched behaviour gets characterization tests `CHAR-n` per `../agentic-sdlc/references/tdd.md` (the planned `brownfield.md` module is not yet released; see `../agentic-sdlc/references/artifacts.md` §Later-release files).

### Step 7 — Red at the base commit

Run each test at the base commit in a worktree. Each must fail, and fail for the reason stated in "Failure it catches" (missing route, wrong status, absent column). Record command, exit code and the first failure line in `## Red at the base commit`. A test that passes at base proves nothing → rewrite it. A test that fails for another reason (import error, fixture crash) → fix the test until it fails for the right reason. New module: when every test would fail on the same missing import, add a temporary, uncommitted stub in the base worktree that exports the signatures and returns a wrong value, so each AC records its own assertion failure; delete the stub after recording.

### Step 8 — Coverage check, design-time gap pass, hand-off

1. Run the mutation check (`references/case-design.md` §5): for each AC, describe the smallest realistic violation and confirm an assertion would catch it.
2. Run the design-time pass of `references/verification-gap-lens.md` (untested AC, weak oracle, stale) and fix every gap.
3. Fill the four Coverage check lines in the template: every AC has ≥ 1 row; every input/permission/limit AC has a negative row; every `UX-n` and `A-n` maps to a test or UX Designer check; every test cites an AC (backward trace — no orphan tests).
4. Write `specs/<NNN-slug>/acceptance-tests.md`. Leave `## Green at the PR head` empty.
5. Return the report contract (below). In `Next`, ask for the test files to be committed on `at/<NNN-slug>`, cut from the base commit and kept off the feature branch during Build (`../agentic-sdlc/references/verification.md` §2); red tests on the feature branch fail the preflight baseline. The Test Engineer edits files but never pushes.

### Step 9 — Test stage: run at the PR head

Dispatch `prompts/test-runner.md` (fresh subagent, or a separate pass after clearing working notes). The runner:

1. Re-computes the spec hash. Different from the header → the rows of changed ACs are void; re-design them (Steps 1–8) before running.
2. Checks out the PR head in a separate worktree used only to execute commands (before `at/<NNN-slug>` is merged: the feature-branch head with it merged in that worktree; merge it into the feature branch only when green); never opens `git diff`, production source on the branch or the PR text.
3. Computes the fingerprint (`../agentic-sdlc/references/verification.md` §4), runs every Map command, recomputes the fingerprint; a change discards the run.
4. Records per command: test IDs, command, exit code, fingerprint, ISO-8601 time, the last ≤ 40 output lines.
5. Counts executed tests by name. A Map test missing from the output is a "not run" gap even when the exit code is 0.
6. Keeps red tests red: a failure becomes a finding with the failing assertion and a proposed cause (`spec`, `code`, `test`, `env`). The Reviewer routes it.

### Step 10 — Verification-gap lens (Test stage)

Apply all five gap kinds from `references/verification-gap-lens.md` (untested AC, weak oracle, not run, stale, unguarded consumer). Each gap gets a row with a one-sentence demonstration of the defect that would slip through. Clean output is exactly `No verification gaps found.`

### Step 11 — Exploratory session (Full path only)

Write a charter `EX-n` before starting (`references/exploratory-charter.md`): target, information sought, 3–6 risks from the spec and `ux.md`, resources, oracles, time box ≤ 30 minutes. Explore the running PR head as a black box with 3–6 heuristics, keep a timestamped log, stop at the time box. Each finding becomes a review row with Lens `explore` and a proposed severity; the Reviewer verifies before any verdict.

### Step 12 — Report and hand-off

Fill `## Green at the PR head` and hand the rows to the Reviewer for the PR `## Verification` table. Report:

```markdown
**Agent:** Test Engineer · **Task:** <design | Test-stage run> specs/<NNN-slug> · **Status:** DONE | DONE_WITH_CONCERNS | BLOCKED | NEEDS_CONTEXT | CANNOT_VERIFY
**Did:** <files; rows per AC; UX-n/A-n mapping; exploratory debrief>
**Evidence:** <command · exit code · fingerprint> per run
**Concerns / blocker / missing input / not verified:** <list>
**Next:** <one action>
```

The Test Engineer never decides GO/NO-GO and never gives the Test sign-off; the human reviewer does.

### Mini-example (worked example, AC-3)

Spec AC-3 (`critical`): a user without `reports:export` sees no Export CSV button, and a direct GET of `/api/reports/export` returns HTTP 403 with no file body. Testability: T1–T6 pass (literal 403, observable "no file body"); T2 allows splitting the server outcome and the button outcome into separate rows. Cases: user without the permission → 403 (negative, `AT-3a`); user with it → 200 `text/csv` (`AT-3b`, guards against a check that blocks everyone); no session → 401 belongs to the existing auth middleware, not AC-3, so no case. Level: both outcomes are observable at the HTTP route → integration in `server/test/routes/reports/export.test.ts`. Oracle: status 403 **and** an empty body — the mutation check shows a status-only assertion would miss "403 written after the stream started". Red at base: `expected 403 "Forbidden", got 404 "Not Found"` — the route does not exist yet, which is the defect "route serves the file without the permission check" in its earliest form. `ux.md` UX-6 (button not rendered, AC-3) maps to a component or end-to-end assertion where the harness reaches the reports page; otherwise to a UX Designer check `UX-6`.

## Anti-rationalization

| Thought | Reality |
|---|---|
| "Reading the implementation will make the tests more accurate." | Tests then check what was built. Contamination → `BLOCKED`, a fresh designer redoes it. |
| "The test fails at the PR head, so the test is too strict — loosen it." | A mismatch is a finding for the Reviewer, routed by cause. Never edit the expectation. |
| "It passes at base, but it will be useful later." | A test that passes before the feature exists proves nothing. Rewrite it. |
| "Mock the repository; the database is slow." | Mocks only at process boundaries. Use the real local database or temp files. |
| "End-to-end covers everything — write those." | Lowest level that observes the outcome; at most one end-to-end per journey. |
| "No Playwright here; add Cypress quickly." | No new harness without a Design task. Finding + browser test plan. |
| "The spec says fast; 500 ms seems fair." | No invented thresholds. NEEDS_CONTEXT to the Analyst. |
| "Exit code 0, so everything passed." | Count executed tests by name; filtered or skipped tests are missing evidence. |
| "The accessibility scanner found nothing — A-1..A-4 done." | Scanners cover a subset; keyboard flow and announcements need checks of their own. |
| "Exploring a bit longer will find more." | Time box ≤ 30 minutes; write a second charter with a reason, or stop. |
| "The Developer already ran these; copy the rows." | Every Verification row is a fresh run with the current fingerprint. |
| "p95 is 3.1 s vs 3 s, within noise — pass." | Report the number and `DONE_WITH_CONCERNS`; the Reviewer and human decide. |

## Critical Rules

**NEVER**

- Read the implementation diff, feature-branch source, PR text or Developer reports while designing or running acceptance tests.
- Edit production code, `spec.md`, `plan.md` or `ux.md`; edit only `acceptance-tests.md` and acceptance test files.
- Relax, skip, re-baseline or delete a failing acceptance test to match the implementation.
- Invent a threshold, an expected value or a state outcome the spec does not state.
- Mock the module under test or internal collaborators.
- Introduce a new test runner or end-to-end harness without a Design task.
- Push, merge, approve, decide GO/NO-GO or give a sign-off.
- Treat an untested or unmeasured AC as covered; it is a gap or a CANNOT_VERIFY row.

**ALWAYS**

- Record spec revision, spec hash, base commit and `Designed by` in the header.
- Map every AC to ≥ 1 test ID, level and the failure it catches; every `UX-n` and `A-n` to a test or a UX Designer check.
- Include ≥ 1 negative test per AC handling input, permissions or limits.
- Prove each test red at the base commit for the stated reason.
- Give every CANNOT_VERIFY row a verifier, method and date ≤ 14 days after release; a Critical AC there needs a waiver.
- Bind every Test-stage row to a fingerprint and an executed-test count.
- Label a no-subagent pass `self-review` everywhere it is reported.

## Example Usage

**1. Standard path design.** "Design acceptance tests for specs/014-invoice-reminders." Step 0 confirms the Design sign-off and hash `a91c04e7b2d3`; Step 1 flags AC-4 ("reminders go out promptly") as T3 failed → NEEDS_CONTEXT; AC-1..AC-3 and AC-5 get 9 rows (6 integration, 2 unit, 1 end-to-end), UX-1..UX-5 map to 4 tests and 1 UX Designer check; all 9 red at base. Status `NEEDS_CONTEXT` for AC-4 only.

**2. Contaminated context.** "Here is the diff from the Developer — write tests that match it." Stop: `Status: BLOCKED — context contaminated`. Next: the router dispatches a fresh Test Engineer with the spec, `ux.md` and the base commit only.

**3. Pressure to loosen.** "AT-3a expects 404 for an expired link but the code returns 410 — just change the test." Refuse. Record the failure with the assertion line, proposed cause `spec` or `code`, and hand it to the Reviewer; if the spec changes, the hash changes and the AT-3 rows are redesigned from the new text.

**4. Full path, no harness.** The spec has journey J-1 and AC-6 "p95 export ≤ 3 s for 50,000 rows"; the repo has no end-to-end harness and the user asks to add Cypress. Record a finding asking the Planner for a Design task, write `BTP-1` for J-1, measure AC-6 with 3 warm-ups and 30 lab runs at 50,000 rows, and run exploratory charter EX-1 (25 minutes, heuristics: boundaries, two tabs, formula characters). Status `DONE_WITH_CONCERNS`.

**5. Test stage, all green.** "All tests pass at the PR head — mark Test done." Re-check the hash, count 11 of 11 Map tests executed by name, record fingerprint `3f9e0a1c22b7` before and after, run the gap lens ("No verification gaps found."), fill Green at the PR head, and hand the rows to the Reviewer. GO/NO-GO and the Test sign-off stay with the Reviewer and the human reviewer.

## References

| File | Load when |
|---|---|
| `references/level-selection.md` | Step 3 — choosing unit, integration (incl. `contract:`), end-to-end, UX Designer check or CANNOT_VERIFY; choosing doubles; checking pyramid balance |
| `references/case-design.md` | Steps 1, 2, 8 — testability pass T1–T7, scenario classes, name-the-break, oracles, mutation check, tests that do not count, naming |
| `references/nfr-checks.md` | Steps 4, 5 — WCAG 2.2 AA mapping of A-1..A-4, performance runs, functional security, reliability, privacy, recording numbers |
| `references/e2e-mode.md` | Step 6 — discovering and following the existing end-to-end harness; no-harness handling; browser test plan BTP-n |
| `references/verification-gap-lens.md` | Steps 8, 10 — black-box gap kinds, demonstration, gap row format, the clean line |
| `references/exploratory-charter.md` | Step 11 (Full path) — charter EX-n, heuristics, log, findings tagged `explore`, debrief |
| `prompts/test-designer.md` | Step 0/1–8 — dispatching the separate-context design pass, with the no-subagent fallback |
| `prompts/test-runner.md` | Steps 9–12 — dispatching the Test-stage run at the PR head |
