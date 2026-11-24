# Agentic SDLC — Test-Driven Build (TDD)

Loaded by `executing-plans` and the Developer for **each Build task** (mechanisms 3.1, 3.2). The Reviewer loads §3 for lens L1. Loop bounds and escalation live in `references/loops.md`; evidence records in `references/verification.md` §4.

## 1. The cycle per task (3.1)

| Element | Rule |
|---|---|
| **Artifact** | The task's `### Tn` subsection in `plan.md` (interface signature, Red/Green/Refactor steps) · the test file listed in the task's `Files` · the run ledger `red` and `round` events (`scripts/run-ledger.mjs`) · the PR `## Verification` rows |
| **Trigger** | Every plan task that changes executable behaviour, on every path (Quick tasks included) |
| **Output** | Pasted red output, pasted green output, one commit with trailer `Refs: Tn AC-n`, a passing `round` event and a `red` event in the run ledger |
| **Failure behaviour** | No red output recorded → the task is not done (`run-ledger task --state done` exits 1). A test that passes on its first run → delete it and rewrite it. 3 failed red-green attempts → debug loop (`references/loops.md` B1) |

**Step 0 — Interface first.** The plan task states the exact signature (function, endpoint or component, with parameter and return types) before any code. A task without a signature → `NEEDS_CONTEXT` to the Planner; never invent the interface inside Build.

**Step 1 — Red.** Write one test for one behaviour. Name it after what it proves: `AC-2 text cells starting with = are prefixed with an apostrophe`, `CHAR-3 legacy rounding keeps half-even`, `BUG-418 empty filter returns the header row`. Run only that test. Paste the failing output. It must fail **for the expected reason**: an assertion on the behaviour, or a missing module or symbol named in the signature. A syntax error, an import typo or a crash in setup is not red: fix the test and run it again. Record it:

```bash
node <skill>/scripts/run-ledger.mjs red --run <id> --task T3 \
  --test "AC-4 more than 50,000 rows returns 422" --signature 'expected 200 "OK", got 404 "Not Found"'
```

A test name without `AC-n`, `CHAR-n` or a bug ID prints a concern; the Reviewer raises it as an Important finding.

**Step 2 — Green.** Write the minimal code that makes the test pass: no extra parameters, branches or configuration that no current test needs. Run the test, paste the passing output, record `round --loop red-green --result pass`. Run the other tests of the touched module (scoped re-check, `references/loops.md` §5) before moving on.

**Step 3 — Refactor.** Improve names and structure with every test green. Run the module tests after each refactor step. A refactor that turns a test red is reverted, not debugged forward.

**Step 4 — Commit.** One task, one commit or a small series, each with trailer `Refs: Tn AC-n`. The full DoD block runs at task exit (loop exit), not after every edit.

### Rules that hold in every step

1. **First-run pass → delete and rewrite.** A new test that passes before the production code exists proves nothing: either the behaviour already exists (then the task is a characterization task, named `CHAR-n`) or the test asserts nothing real.
2. **No red, not done.** A task that changes no executable behaviour (configuration, documentation, a rename the compiler checks) closes with `--no-red "<reason>"`; the Reviewer checks the reason. More than 1 `--no-red` task per plan → Reviewer concern.
3. **Mocks only at process boundaries:** network, clock, randomness, filesystem outside the test's temporary directory, third-party APIs, the browser `fetch`. More than 1 mocked collaborator in one unit test requires a one-line comment stating why a real collaborator is unusable. Never mock the module under test or a value object.
4. **Simplicity:** no abstraction (interface, factory, base class, generic helper) without ≥ 2 current call sites in this change or the existing code. One call site → inline it.
5. **Real data stays out.** Fixtures are synthetic; never copy a production record, token or customer name into a test.
6. **Never weaken a check.** Deleting, skipping (`.skip`, `xit`, `@Ignore`), loosening an assertion or lowering `coverage_min` to reach green is an authority violation (`agents/developer.md` §Never); in unattended mode it is halt reason `authority`.

### Brownfield variant

Code without tests: write a characterization test `CHAR-n` that pins the current behaviour first (it passes on its first run by design, so rule 1 does not apply to it), then the `AC-n` test for the change (red), then green. The PR lists the `CHAR-n` tests separately.

## 2. Test names and placement

| Item | Rule |
|---|---|
| Name | ID first (`AC-n`, `CHAR-n` or `BUG-n`), then the observable behaviour; one behaviour per test |
| Location | The test file named in the plan task's `Files`; a new test file is listed in the plan before it is created |
| Assertion count | ≥ 1 assertion on the behaviour; snapshot-only tests need a named reason |
| Duration | Unit test ≤ 1 s each; slower tests move to the integration suite |

## 3. Anti-pattern catalogue (3.2)

| Element | Rule |
|---|---|
| **Artifact** | This table; findings in the PR `## Review triage` |
| **Trigger** | Loaded with §1 by the Developer; Reviewer lens L1 checks every new or changed test against it |
| **Output** | One triage row per match: anti-pattern number, test name, file:line, fix |
| **Failure behaviour** | A new test matching any row → **Important** finding; a match that hides a failing AC (the test cannot fail) → **Critical** |

| # | Anti-pattern | Detection | Fix |
|---|---|---|---|
| A1 | Testing the mock | Assertions only on mock calls; the real output is never checked | Assert the observable result; keep 1 boundary mock |
| A2 | Assertion-free test | No `expect`/`assert` call, or only "does not throw" | Assert the value or state the AC names |
| A3 | Sleeping | `sleep`, `setTimeout`, fixed waits | Fake the clock or wait on a condition with a timeout |
| A4 | Order dependence | Passes alone, fails in suite order or with `--shuffle` | Fresh fixture per test; no shared mutable state |
| A5 | Over-mocking | > 1 mocked collaborator without the justification line | Use the real collaborator or an in-memory fake |
| A6 | Implementation coupling | Asserts private calls, call order or internal fields | Assert through the public interface in the signature |
| A7 | Tautology | Expected value computed by the code under test | Literal expected values from the AC |
| A8 | Swallowed failure | `try/catch` around the act step with an empty catch | Let it throw; assert the specific error |
| A9 | Giant test | > 1 behaviour, > 3 act steps or > 50 lines | Split, one behaviour each |
| A10 | Network or real clock in a unit test | Real HTTP host, `Date.now()` uncontrolled | Boundary fake; injected clock |
| A11 | Snapshot sprawl | Large snapshot accepted without review | Targeted assertions; snapshot ≤ 30 lines with reason |
| A12 | Skipped or focused test committed | `.skip`, `.only`, `xit`, `@Disabled` | Remove; a known failure is a bug issue, not a skip |
| A13 | Unnamed purpose | Test name lacks AC-n, CHAR-n or bug ID | Rename after what it proves |
| A14 | Real personal data | Names, emails or IDs copied from production | Synthetic fixtures |

## 4. Rationalizations

The left column quotes thoughts to catch; the right column is the rule.

| Thought | Reality |
|---|---|
| "I'll write the tests after the code" | Tests written after pass by construction. Red first, pasted. |
| "It's obviously correct, no need to see it fail" | A test never seen red has never been shown able to fail. |
| "The test passed first time, great" | First-run pass → delete and rewrite (rule 1). |
| "Mocking the repository is faster" | Mock only process boundaries; the seeded test database is the collaborator. |
| "This helper will be reused later" | No abstraction without ≥ 2 current call sites. |
| "I'll skip this flaky test for now" | Skipping is weakening a check: authority violation. Fix the flake (A3, A4). |
| "Red output is noise, the reviewer won't read it" | No red recorded → task not done; `run-ledger` refuses `done`. |
| "The failure is in setup, close enough to red" | Red must fail for the expected reason; fix the setup first. |
| "One more quick fix will get it green" | Read the ledger round count; 3 failed attempts → debug loop. |
| "I'll refactor while making it pass" | Green first with minimal code; refactor only with tests green. |
| "Coverage dropped a little, lower the floor" | `coverage_min` is never lowered; add tests or file a waiver. |
| "A real customer row makes the test realistic" | Synthetic data only. |
| "The signature can be decided while coding" | Interface first, in the plan; missing → `NEEDS_CONTEXT`. |

## 5. Without Node

`run-ledger` absent → paste red and green output into the task report and the PR `## Verification` table; record failed rounds in `plan.md` `## Loop ledger`. The rules and failure behaviour are unchanged; the doctor† reports `enforcement: prompt-only`.

† Added in a later release; manual fallback in `references/artifacts.md` §Later-release files.

## Sources

Red-green-refactor discipline and the rationalization format adapted from Superpowers `test-driven-development` (MIT, Jesse Vincent); mock-boundary and simplicity rules adapted from Addy Osmani's agent-skills (MIT) and Matt Pocock's skills (MIT) TDD guidance. Text is original.
