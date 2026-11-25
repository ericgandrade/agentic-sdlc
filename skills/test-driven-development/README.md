# test-driven-development

Build-stage skill of the **Agentic SDLC**, used by the **Developer** on every plan task that changes executable behaviour. It runs the red-green-refactor cycle under an iron law — no production code before a test has been seen failing for the expected reason — and adds the depth behind the stage contract in `agentic-sdlc/references/tdd.md`: stack discovery, seam choice with a catches/misses note, "name the break" before each test, a red-classification table, integration-first testing with doubles only at process boundaries, a reproduce-first bug-fix variant with the missing-seam finding, a mutation proof per test, and a task report the Reviewer checks in lens L1. Loop bounds (3 failed red-green attempts → debug loop) come from `agentic-sdlc/references/loops.md` and are enforced by `run-ledger` when Node is available.

## When to use

- Implementing one task from `specs/NNN-slug/plan.md` test-first.
- Fixing a bug (Quick issue, `BUG-n`) with a regression test that reproduces it first.
- Adding `CHAR-n` characterization tests before changing untested code.
- A test passed on its first run, needs several mocks, or might not catch a real bug.

Not for acceptance-test design (`test-strategy`), root-cause investigation after the red-green bound (`systematic-debugging`), completion evidence (`verification-gate`), PR review (`multi-axis-code-review`) or running a whole plan (`executing-plans`).

## What is included

- `SKILL.md` — Step 0 discovery (task, interface, stack table, baseline), seam and name-the-break, red classification, green with ledger rounds and the 3-attempt bound, refactor under green, mutation proof, task close and report, bug-fix and brownfield variants, anti-rationalization table, rules, examples
- `references/good-tests.md` — seven properties, naming per runner, Arrange-Act-Assert, paired good/bad examples in TypeScript, Python and Go, what earns a test, warning signs, self-check
- `references/mocking-and-seams.md` — seam rules, integration-first, dependency categories, test doubles catalogue, design moves that remove mocks, justification line format
- `references/bug-fix-variant.md` — 10-step reproduce-first procedure, correct-seam table, missing-seam finding format, not-reproduced handling, independent reproduction, worked example
- `prompts/name-the-break.md` — fresh-context mutation proposal prompt with inline fallback, Developer procedure and outcome table
- `evals/evals.json` — 5 scenarios (plan task, Quick bug, pressure to test after and skip, over-mocked first-run pass, bound reached)
- `evals/trigger-eval.json` — 17 trigger queries (9 positive, 8 negative)
- Uses from `agentic-sdlc`: `references/tdd.md`, `references/loops.md`, `references/verification.md`, `agents/developer.md`, `scripts/run-ledger.mjs`, `scripts/preflight.mjs`

## Typical invocation

- "Implement T3 from the plan test-first."
- "Fix BUG-418 — reproduce it with a failing test first."
- "My new test passed on the first run; what now?"
- "Do these tests actually catch bugs? Mutate the code and check."

## Influences

| Inventory ID | Source (license) | What was taken | How adapted |
|---|---|---|---|
| SP-52 | Superpowers `test-driven-development` (MIT, Jesse Vincent) | Iron law; code written before its test is deleted, not kept as reference | Restated in original wording; exceptions narrowed to the contract's `--no-red` cases (configuration, documentation, compiler-checked renames) |
| SP-53 | Superpowers `test-driven-development` (MIT) | Mandatory "verify red": fails, not errors, for the expected reason; minimal green; refactor after green | Turned into a red-classification table with the contract's "missing symbol named in the signature" case and `run-ledger red` events |
| SP-54 | Superpowers `writing-good-tests.md` (MIT) | "Name the break" gate: which change should fail the test, bug or decision; change detectors | Step 1 writes a `Break:` line before each test body; feeds the mutation prompt |
| SP-55 | Superpowers `writing-good-tests.md` (MIT) | Exercise the real thing; list side effects before doubling; complete mock responses; no test-only production methods | Rules in `references/mocking-and-seams.md` §4, bound to the contract's process-boundary list |
| SP-56 | Superpowers `writing-good-tests.md` (MIT) | Mental mutation check with five mutation classes; warning-signs list | Made executable: fresh-context prompt proposes mutants, Developer applies and records killed/survived, ≥ 1 kill per test |
| AO-43 | Addy Osmani agent-skills (MIT) | Discover the stack first; never assume `npm test` | Step 0 manifest → suite/single-test command table across seven runners |
| AO-44 | Addy Osmani agent-skills `test-driven-development` (MIT) | Prove-It pattern for bugs: reproduce, confirm fail, fix, confirm pass, full suite | Bug-fix variant steps 1–7 with "fails with the reported symptom" and re-running the manual reproduction |
| AO-46 | Addy Osmani agent-skills (MIT) | State over interactions, DAMP, real → fake → stub → mock, Arrange-Act-Assert | Seven properties and the doubles catalogue ordered by preference |
| AO-48 | Addy Osmani agent-skills (MIT) | Independent reproduction-test subagent written without knowledge of the fix | Bug-fix variant §5 with the inline fallback "write the test before opening the suspected file" |
| MP-43 | Matt Pocock skills `codebase-design` (MIT) | Interface is the test surface; one adapter is a hypothetical seam | Seam rules table; tied to the contract's ≥ 2 call sites simplicity rule |
| MP-44 | Matt Pocock skills `DEEPENING.md` (MIT) | Dependency categories: in-process, local-substitutable, owned remote, true external | Category → double table; database stays real via a seeded local substitute |
| MP-52 | Matt Pocock skills `tdd` §Seams (MIT) | Highest seam, each with a "catches / misses" note | Seam note format written above each slice's first test |
| MP-53 | Matt Pocock skills `tdd` (MIT) | Red before green, one slice at a time; refactor outside the loop | Conflict resolved: refactor stays in the cycle but only on code the task touched; structural refactors become review concerns |
| MP-54 | Matt Pocock skills `tdd` (MIT) | Implementation-coupled and tautological tests; horizontal slicing | Paired examples in `references/good-tests.md`; Step 6 forbids writing all tests first |
| MP-55 | Matt Pocock skills `tdd/mocking.md` (MIT) | Mock only at system boundaries; dependency injection; SDK-style interfaces | Design moves table and "no logic in doubles" rule |
| MP-64 | Matt Pocock skills `diagnosing-bugs` (MIT) | Regression test only at a correct seam; "no seam" is a finding | Missing-seam finding format, `NEEDS_CONTEXT` to the Planner, partial seam → `DONE_WITH_CONCERNS` |
| BM-22 | BMad Method `bmad-build` (MIT) | A test that did not run counts as missing; never edit the expectation to match the code | "0 tests run is not red" row; Critical rule against weakening assertions |
| BM-54 | BMad Method bug template (MIT) | "No change needed, with proof" outcome for bugs | Not-reproduced handling: no fix code, `NEEDS_CONTEXT` with the passing output |
| BM-30 | BMad Method `bmad-review` verification-gap lens (MIT) | Name the smallest realistic regression and check a test fails on it | Mutant classes restricted to lines the task touched or its tests reach |

---

## Metadata

| Field | Value |
|-------|-------|
| Version | 1.0.0 |
| Author | Eric Andrade |
| Created | 2026-11-24 |
| Updated | 2026-11-24 |
| Platforms | GitHub Copilot CLI, Claude Code, OpenAI Codex, OpenCode, Gemini CLI, Antigravity, Cursor IDE, AdaL CLI |
| Category | development |
| Tags | agentic-sdlc, tdd, testing, red-green-refactor, mocking, regression-tests, mutation-testing |
| Risk | safe |
