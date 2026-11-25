---
name: test-driven-development
description: This skill should be used when implementing a plan task, feature slice or bug fix test-first — writing the failing test before production code, proving it fails for the right reason, writing the minimal code, refactoring under green, choosing mocks and seams, writing a reproduce-first regression test, pinning untested code with a characterization test before changing it inside a task, or checking that each test would catch a real break (the Build stage of the Agentic SDLC). One task at a time; not for running a whole plan (use executing-plans), acceptance tests designed from the spec (use test-strategy), a failure whose cause is unproven (use systematic-debugging), or characterization tests for a legacy migration (use codebase-modernization).
license: MIT
---

# Test-Driven Development

## Purpose

**Agentic SDLC · Build stage.** Used by the **Developer** on every plan task that changes executable behaviour, on every path (Quick included). The **Reviewer** checks the evidence this skill produces in review lens L1 at the Test stage.

**Iron law: no production code is written until a test for it has been run and seen failing for the expected reason.** Code written for the task before its failing test is deleted, not kept as a reference, and rebuilt from the test. There is no "adapt it while writing the tests". Existing code that predates the task is pinned with `CHAR-n` tests instead (brownfield variant).

The stage contract (bounds, ledger events, names, anti-pattern catalogue A1–A14) lives in `../agentic-sdlc/references/tdd.md`; loop bounds and escalation live in `../agentic-sdlc/references/loops.md`. This skill is the full working procedure behind that contract: how to pick the seam, name the break before writing a test, classify a red, keep doubles at process boundaries, run the reproduce-first bug variant and prove each test with a mutation. It never relaxes a bound from the contract; where the two differ, the contract wins and the gap is reported.

Outputs per task: pasted red output, pasted green output, a name-the-break table, one commit (or a small series) with the trailer `Refs: Tn AC-n`, run-ledger `red` and `round` events, and a task report.

## When to Use

- Implementing one task from `specs/NNN-slug/plan.md` (`### Tn` subsection with interface, Red/Green/Refactor steps).
- Fixing a bug: Quick-path issue with an acceptance test, or a `BUG-n` finding.
- Changing untested legacy code (brownfield): pin current behaviour with `CHAR-n` first.
- A new test passed on its first run, a test needs more than one mock, or a test "feels" weak.
- Receiving a Reviewer finding against a test (anti-pattern A1–A14).

Not for:
- Designing acceptance tests from the spec, test levels per AC, NFR coverage → `test-strategy` (Test Engineer; the Developer never edits those tests).
- Root-cause investigation after 3 failed red-green attempts → `systematic-debugging` (the debug loop).
- Running the DoD and recording fingerprinted evidence for a completion claim → `verification-gate`.
- Reviewing a PR's tests on all axes → `multi-axis-code-review`.
- Orchestrating a whole plan, task dispatch, worktrees, parallelism → `executing-plans` (it loads this skill per task).
- Writing interface signatures and task subsections → `writing-plans`.
- Pinning a whole legacy module before a migration → `codebase-modernization`.

## Workflow

### Step 0 — Discover the task and the harness

1. **Read the task, nothing more.** The task row and `### Tn` subsection in `plan.md`: AC IDs and text, `Files`, `Interface`, `Blocked by`. On Quick there is no plan: the issue's acceptance test plays the task's role and the change usually goes through an existing interface.
2. **Interface first.** No signature (function, endpoint or component with parameter and return types) → return `NEEDS_CONTEXT` to the Planner. On Quick, a change that needs an interface the issue does not name → `NEEDS_CONTEXT` to the Analyst. Never invent the interface inside Build.
3. **Find the stack; never assume `npm test`.** Read the manifest and existing tests:

| Marker | Suite command | Single-test command |
|---|---|---|
| `package.json` with Vitest | `npx vitest run` | `npx vitest run test/report/export.test.ts -t "AC-4"` |
| `package.json` with Jest | `npx jest` | `npx jest test/report/export.test.ts -t "AC-4"` |
| `package.json` only `node --test` | `node --test` | `node --test --test-name-pattern="AC-4" test/export.test.mjs` |
| `pyproject.toml` / `pytest.ini` | `pytest` | `pytest tests/test_export.py -k "ac_4"` |
| `go.mod` | `go test ./...` | `go test ./report -run 'TestAC4'` |
| `Cargo.toml` | `cargo test` | `cargo test ac_4_` |
| `pom.xml` / `build.gradle` | `mvn test` / `gradle test` | `mvn -Dtest=ExportTest#ac4* test` |

   Copy the project's conventions: test location, file naming, fixture helpers, how IDs appear in names (Python and Go cannot hold `AC-4` in an identifier: use `test_ac_4_...` / `TestAC4...` plus the full ID in the docstring or `t.Run` name).
4. **Baseline.** Run the touched module's existing tests once. Any failure before a change → stop: `BLOCKED` naming each failing test (unattended: halt `red-baseline`). Never build on a red baseline.
5. **Open the task in the ledger:** `node skills/agentic-sdlc/scripts/run-ledger.mjs task --run <id> --task T3 --state started` (installed copy: `../agentic-sdlc/scripts/run-ledger.mjs`).

### Step 1 — Pick the seam, then name the break

1. **Seam = the interface in the signature.** Test at the highest seam the plan names, through the public interface callers use; ideally one seam per slice. Wanting to test past the interface (private function, internal field, database row read behind the API) means the test or the module has the wrong shape.
2. **Integration-first at real seams.** Keep in-process collaborators real; use local substitutes (seeded test database, in-memory store, the test's temporary directory) for local dependencies; double only process boundaries: network, clock, randomness, filesystem outside the temporary directory, third-party APIs, browser `fetch`. Load `references/mocking-and-seams.md` whenever the test crosses a dependency.
3. **Write the seam note** as a comment above the first test of the slice: `Seam: exportCsv(filter, user) — catches: row cap, cell escaping · misses: HTTP status mapping (covered by AC-5 route test)`.
4. **Name the break before the test body.** Answer: *which production change would make this test fail, and is that change a bug or a decision?* Record it: `Break: dropping the 50,000 check returns 200 → bug`.
   - Cannot name one → the test asserts nothing observable; redesign around an output, state change or emitted effect.
   - Only intentional decisions break it (`MAX_ROWS === 50000`) → it is a change detector; assert the behaviour the decision drives (50,001 rows → 422).

### Step 2 — Red

1. **One test, one behaviour.** Name = ID first, then the observable behaviour: `AC-4 more than 50,000 rows returns 422 ROW_LIMIT`, `CHAR-3 legacy rounding keeps half-even`, `BUG-418 empty filter returns the header row`. Arrange-Act-Assert, one act step, literal expected values taken from the AC text, synthetic fixtures. Rules and paired examples: `references/good-tests.md`.
2. **Run only that test** with the single-test command. Paste the output (last ≤ 40 lines).
3. **Classify the failure:**

| Output | Verdict | Next |
|---|---|---|
| Assertion fails on the behaviour (`expected 422, got 200`) | Valid red | Record it |
| Missing module or symbol **named in the signature** (`exportCsv is not a function`) | Valid red | Record it |
| Syntax error, import typo, wrong path, fixture crash, unrelated exception | Not red | Fix the test, run again |
| Test passes | Not red | Delete and rewrite; behaviour already exists → `CHAR-n` |
| Test not collected / 0 tests run | Not red | Fix the name filter or registration |

4. **Record the red:**

```bash
node skills/agentic-sdlc/scripts/run-ledger.mjs red --run r1 --task T3 \
  --test "AC-4 more than 50,000 rows returns 422 ROW_LIMIT" --signature 'expected 422, got 200'
```

### Step 3 — Green

1. **Minimal code** in the files the task lists: no parameter, branch, option or configuration that no current test needs. No abstraction (interface, factory, base class, generic helper) without ≥ 2 current call sites; one call site → inline it.
2. **Run the single test.** Pass → paste the output, then run the touched module's tests (scoped re-check, `../agentic-sdlc/references/loops.md` §5) and record `round --run r1 --task T3 --loop red-green --result pass`.
3. **Fail → record the round before the next attempt:**

```bash
node skills/agentic-sdlc/scripts/run-ledger.mjs round --run r1 --task T3 --loop red-green --result fail \
  --signature 'export.test AC-4: expected 422, got 500' --cause code --tried 'count rows before streaming'
```

   Read the ledger first: never repeat a `--tried`. Cause `test` (wrong fixture, anti-pattern) → fix the test; cause `spec`, `design` or `plan` → stop, breaker B6; cause `env` → run `node skills/agentic-sdlc/scripts/preflight.mjs` before the next round.
4. **Bound: 3 failed red-green attempts → the debug loop (breaker B1, automatic, no ruling).** `run-ledger` exits 3; switch to `systematic-debugging`. A passing debug round (root cause proven by a test) resets the red-green count.
5. A file outside the task's `Files` list → stop and report; more than 3 such files → halt `out-of-plan-files`.

### Step 4 — Refactor under green

1. Improve names, remove duplication and simplify structure **in code this task touched**, one step at a time, running the module tests after each step.
2. A refactor step that turns any test red → revert it; never debug a refactor forward.
3. Add no behaviour. A structural change beyond the task (moving modules, new layers) → note it as a concern for review, not a refactor here.

### Step 5 — Name-the-break check (mutation proof)

Prove every new or changed test can fail on a realistic bug, after green and before commit.

1. **Propose mutants.** Dispatch `prompts/name-the-break.md` to a fresh subagent with the test file and the production files of the task; it returns 1–5 mutants per test from five classes: wrong constant or argument, wrong branch or operator, missing state change or side effect, empty or default return, missing validation (zero, empty, null, unauthorized, malformed). No subagents on the platform → run the prompt in a fresh pass after clearing working notes, reading only those files.
2. **Apply one mutant at a time** by hand (or with the project's existing mutation tool scoped to the touched files: Stryker, mutmut, PIT, cargo-mutants; never add one as a dependency without the Design sign-off note). Run only the test; expected: FAIL.
3. **Restore and confirm:** revert the mutant, run the test (PASS), and check `git diff` shows only intended changes. A mutant is never committed.
4. **Record the table** in the task report:

| Test | Mutant (file:line → change) | Class | Result |
|---|---|---|---|
| AC-4 more than 50,000 rows returns 422 | `export.ts:41 > 50000 → > 500000` | constant | killed |
| AC-4 more than 50,000 rows returns 422 | `export.ts:42 drop throw` | missing validation | killed |

5. **Survived mutant** → keep the mutant applied and strengthen the test (literal value, boundary case, assertion on the effect); run it first against the mutant — that failure is its red (paste it; `run-ledger red` for a new test) — then revert and see it pass. Survives a second time → list it as a concern (`DONE_WITH_CONCERNS`) for the Reviewer. Minimum: 1 killed mutant per new test; a test with 0 killed mutants is deleted or rewritten.

### Step 6 — Next behaviour

A task with several behaviours repeats Steps 1–5 per behaviour: one test, one minimal change, one proof. Never write all tests first and then all code (horizontal slicing); each test responds to what the previous cycle taught.

### Step 7 — Close the task

1. Run the full DoD block from the AGENTS.md `sdlc-dod` block **once, at task exit** (not after every edit). Record evidence rows with the tree fingerprint per `../agentic-sdlc/references/verification.md` §4, or hand off to `verification-gate`.
2. Commit with the trailer:

```text
feat(report): reject exports above 50,000 rows

Refs: T3 AC-4
```

3. `run-ledger task --run r1 --task T3 --state done --commit <sha>`. Exit 1 "no red output recorded" → the task is not done. A task that changes no executable behaviour (configuration, documentation, a compiler-checked rename) closes with `--no-red "<reason>"`; more than 1 such task per plan is a Reviewer concern.
4. **Task report** (template):

```markdown
Status: DONE | DONE_WITH_CONCERNS | BLOCKED | NEEDS_CONTEXT | CANNOT_VERIFY
Task: T3 · ACs: AC-4 · Commit: 1a2b3c4 · Rounds: red-green 1 · Files: src/report/export.ts, test/report/export.test.ts
Seam: exportCsv(filter, user) — catches: row cap · misses: route status mapping
Red: <command> → <first failing line> (why expected)
Green: <command> → <n passed>
Name-the-break: <table>
DoD: exit 0 · fingerprint 3f9a0c1d2e4b
Concerns: <none | list>
```

Status: `DONE` DoD green, evidence fresh · `DONE_WITH_CONCERNS` green with listed concerns (surviving mutant, partial seam) · `BLOCKED` bound reached, red baseline or file outside scope · `NEEDS_CONTEXT` no signature, unreproducible bug, no seam · `CANNOT_VERIFY` an AC not exercisable locally (reason, who verifies, when).

### Bug-fix variant (reproduce first)

Load `references/bug-fix-variant.md`. Summary: reproduce the reported symptom manually; write `BUG-n <behaviour>` at the seam where the bug occurs, before reading the suspected code path (or in a fresh subagent that does not know the fix); watch it fail **with the reported symptom**; minimal fix; watch it pass; run the module tests and the original reproduction. The test does not reproduce after two tries with the exact reported inputs → `NEEDS_CONTEXT` with the passing output, no fix written. No seam can reproduce it → missing-seam finding and `NEEDS_CONTEXT` to the Planner; never fix untested and never close a bug with `--no-red`.

### Brownfield variant (characterize first)

Code without tests: write `CHAR-n` tests that pin current behaviour through the public interface (they pass on the first run by design; the first-run rule does not apply to them), then the `AC-n` test for the change (red), then green. List the `CHAR-n` tests separately in the PR. A `CHAR-n` test that pins a behaviour the AC changes is updated in the same commit as the change, with the reason in the commit body.

### Without Node

`run-ledger` absent → paste red and green output into the task report and the PR `## Verification` table; record failed rounds as rows in `plan.md` `## Loop ledger` and count them there. The rules and bounds are unchanged; the PR carries `enforcement: prompt-only`.

## Anti-rationalization

| Thought | Reality |
|---|---|
| "I'll write the tests after the code" | Tests written after the code pass by construction. Delete the code, write the test, watch it fail. |
| "Keeping the code as a reference is harmless" | The test bends toward the code it has seen. Deleted means deleted. |
| "It's obviously correct, no need to see it fail" | A test never seen red has never been shown able to fail. |
| "The test passed first time, great" | First-run pass → delete and rewrite, or reclassify as `CHAR-n`. |
| "The failure is in setup, close enough to red" | Red fails on the behaviour or a missing signature symbol. Fix the setup. |
| "Mocking the repository is faster" | Mock only process boundaries; the seeded test database is the collaborator. |
| "Four mocks make it a true unit test" | It tests the mocks (A1, A5). Keep collaborators real; justify any second mock in one line. |
| "Asserting the mock was called proves it works" | Assert the observable result; a call assertion only where the call is the contract. |
| "I'll compute the expected value with the same helper" | Tautology (A7). Literal values from the AC text. |
| "This helper will be reused later" | No abstraction without ≥ 2 current call sites. |
| "I'll skip this flaky test for now" | Skipping weakens a check: authority violation. Fix the flake (A3, A4). |
| "One more quick fix will get it green" | Read the ledger; 3 failed attempts → debug loop. |
| "I'll refactor while making it pass" | Green first with minimal code; refactor only under green. |
| "All tests first, then the code, saves context switches" | Horizontal slicing tests an imagined shape. One test, one change. |
| "Coverage proves the tests are good" | Coverage counts lines run, not bugs caught. Kill a mutant per test. |
| "The bug is obvious, the fix is one line" | No fix without a failing `BUG-n` test that shows the reported symptom. |
| "No seam reaches the bug, a shallow test will do" | A test that cannot fail on the real bug is false confidence. Report the missing seam. |
| "The signature can be decided while coding" | Interface first, in the plan; missing → `NEEDS_CONTEXT`. |
| "A real customer row makes the test realistic" | Synthetic data only. |
| "Coverage dropped a little, lower the floor" | `coverage_min` is never lowered; add tests or file a waiver. |

## Critical Rules

- **NEVER** write or keep production code before its test has been seen failing for the expected reason.
- **NEVER** skip, disable, focus, loosen, delete or weaken a test, assertion, threshold or `coverage_min` to reach green; in unattended mode it is halt `authority`.
- **NEVER** edit acceptance tests written by the Test Engineer, mark the task verified, or approve it; the Reviewer and the human reviewer do.
- **NEVER** mock the module under test, a value object or an in-process collaborator; more than 1 mocked collaborator in a unit test needs a one-line justification comment.
- **NEVER** commit a mutant, a `.only`, a `.skip` or production data in a fixture.
- **NEVER** attempt a 4th red-green fix; the bound is 3, then the debug loop.
- **ALWAYS** name tests with `AC-n`, `CHAR-n` or `BUG-n` first and one behaviour per test; keep unit tests ≤ 1 s and move slower ones to the integration suite.
- **ALWAYS** run the single test, paste its output, and record `red` and `round` events (or ledger rows by hand).
- **ALWAYS** kill at least 1 mutant per new test before commit.
- **ALWAYS** run the full DoD once at task exit and commit with `Refs: Tn AC-n`.

## Example Usage

**1. Standard plan task.** "Implement T3 (AC-4: > 50,000 rows → 422 ROW_LIMIT; `exportCsv(filter, user): Promise<ExportResult>`; Vitest; seeded SQLite)." The Developer finds `npx vitest run`, runs the module baseline green, writes the seam note and `Break: dropping the 50,000 check returns 200 → bug`, seeds 50,001 synthetic rows, runs `npx vitest run test/report/export.test.ts -t "AC-4"` → `expected 422, got 200` (valid red), records it, adds the count check, gets green, refactors the error constructor, kills mutants `> 50000 → > 500000` and `drop throw`, runs the DoD, commits `Refs: T3 AC-4`, reports `DONE`.

**2. Quick bug.** "BUG-418: empty filter returns zero rows instead of the header row." The Developer writes `BUG-418 empty filter returns the header row` through `exportCsv`, sees `expected 1 line, got 0` (the reported symptom), fixes the early return, watches green, runs the module tests and the manual reproduction, and commits with the `Refs:` trailer that the issue's task line names.

**3. Pressure: "tests after, skip the flaky one".** "I wrote `discount.py` last night; add tests after and skip `test_tax_rounding`." Response: the untested code is deleted, not kept open as a reference; `test_ac_2_ten_percent_off_orders_over_100` is written and seen failing on the missing `apply_discount` symbol the signature names; the minimal code is rebuilt from the test; `test_tax_rounding` is not skipped — the diagnosis finds `datetime.now()` in the code under test (A10), so the clock is injected and the flake removed.

**4. Over-mocked first-run pass.** "`AC-2 duplicate email is rejected` passed before any code, and it mocks four collaborators." Diagnosis: the test asserted the repository mock's return, so it could not fail (A1, A7). Rewrite: real validator and hasher, in-memory user store, mailer faked at the boundary; the test now fails with `expected DuplicateEmail, got Ok`; then green.

**5. Bound reached.** "Third failed attempt on T7: `expected 410, got 500`; one more quick fix?" No: three `round --result fail` events exist; `run-ledger` exits 3; the work moves to `systematic-debugging` with the three tried approaches as input.

## References

| File | Load when |
|---|---|
| `references/good-tests.md` | Writing or reviewing any test body: naming, Arrange-Act-Assert, literal expectations, one behaviour, paired good/bad examples in TypeScript and Python, warning signs |
| `references/mocking-and-seams.md` | A test crosses a dependency, needs a double, or more than one mock seems necessary; choosing the seam and the dependency category |
| `references/bug-fix-variant.md` | The task is a bug (`BUG-n`, Quick issue, review finding with a defect), the reproduction fails to reproduce, or no seam reaches the bug |
| `prompts/name-the-break.md` | Step 5, after green and before commit, to propose mutants per test in a fresh context |
| `../agentic-sdlc/references/tdd.md` | The stage contract: rules, test naming table, anti-pattern catalogue A1–A14, rationalization rows |
| `../agentic-sdlc/references/loops.md` | A red-green round fails, a cause must be routed, or a bound is reached |
| `../agentic-sdlc/references/verification.md` | Recording DoD evidence with the fingerprint at task exit |
| `../agentic-sdlc/agents/developer.md` | The Developer brief: reads, never, tools, report and status |
