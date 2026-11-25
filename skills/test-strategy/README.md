# test-strategy

Acceptance-test design and the Test stage for the Agentic SDLC, used by the Test Engineer. After the Design sign-off, and before any Build task, a context that has never seen the implementation turns every `AC-n` in `spec.md` and every state and accessibility row in `ux.md` into tests at the lowest level that can observe the outcome. Each test is proven red at the base commit for a stated reason. In the Test stage the same tests run at the PR head. The run produces fingerprint-bound evidence, an executed-test count and a black-box verification-gap check, plus a 30-minute exploratory session on the Full path. The skill implements the stage contract in `../agentic-sdlc/references/verification.md` and the templates `acceptance-tests.md` and `ux.md`. It never contradicts them.

## When to use

- The Design sign-off is recorded and acceptance tests must be designed before Build (Standard or Full path).
- `ux.md` states (`UX-n`) and accessibility checks (`A-1`..`A-4`) need tests or UX Designer checks.
- The spec has measurable non-functional ACs: latency, limits, contrast or retention.
- The Test stage needs fresh acceptance evidence at the PR head, a verification-gap pass or the Full-path exploratory session.
- A spec revision voided acceptance-test rows.

Not for:
- Developer unit tests during Build (`test-driven-development`).
- The done gate and PR Trace (`verification-gate`).
- Diff review (`multi-axis-code-review`).
- Writing ACs (`spec-driven-development`).
- Security scans (`security-hardening`).
- Debugging failures (`systematic-debugging`).
- Release smoke tests (`deployment-pipeline`).

## What is included

- `SKILL.md`: workflow steps 0–12 (design: entry check, testability, cases, levels, UX/accessibility, NFR, writing, red at base, coverage; Test stage: run at PR head, gap lens, exploratory, report), an anti-rationalization table, critical rules and examples.
- `references/level-selection.md`: an AC → level rubric (unit, integration, `contract:`, end-to-end, UX Designer check, CANNOT_VERIFY), with dependency categories → doubles, pyramid guidance and worked decisions.
- `references/case-design.md`: scenario classes, the testability checks T1–T7, name-the-break, oracles from spec literals, the mutation check, tests that do not count, and naming.
- `references/nfr-checks.md`: performance runs, WCAG 2.2 AA mapping of A-1..A-4, functional security, reliability, privacy, and labelling each number lab, scanner or field.
- `references/e2e-mode.md`: discover and follow the existing harness. No new harness without a Design task. Covers locators, waits, flaky handling and the browser test plan `BTP-n`.
- `references/verification-gap-lens.md`: the black-box gap kinds (untested, weak oracle, not run, stale, unguarded consumer), the gap row format and the clean line.
- `references/exploratory-charter.md`: charter `EX-n`, the heuristics catalogue, the session log, findings tagged `explore`, and the debrief.
- `prompts/test-designer.md`: the separate-context design prompt with a no-subagent fallback.
- `prompts/test-runner.md`: the Test-stage run prompt at the PR head.
- `evals/evals.json`: 5 scenarios, including pressure to design from the diff and pressure to loosen a failing test.
- `evals/trigger-eval.json`: 18 trigger queries (10 positive, 8 negative).

## Typical invocation

- "Design the acceptance tests for specs/014-invoice-reminders."
- "Map the ux.md states and accessibility checks to tests."
- "Run the acceptance tests against the PR head and fill Green at the PR head."
- "Full path: run the exploratory session for the CSV export."
- "How do I measure the p95 AC in this spec?"

## Influences

| Inventory ID | Source (license) | What was taken | How adapted |
|---|---|---|---|
| AO-48 | Addy Osmani — agent-skills (MIT) | Independent test-writing subagent | Separate-context designer prompt that reads only the spec, `ux.md` and the base commit. Contamination → `BLOCKED`. Self-review fallback is labelled. |
| AO-45 | Addy Osmani — agent-skills (MIT) | Test pyramid ratios | Used as guidance to spot imbalance, never as a per-feature target. At most one end-to-end test per journey. |
| AO-46 | Addy Osmani — agent-skills (MIT) | Good-test rules, real > fake > stub > mock, role locators | Dependency categories → doubles; mocks only at process boundaries per `tdd.md` rule 3 |
| AO-103 | Addy Osmani — agent-skills (MIT) | Test-engineer scenario matrix | Scenario classes per AC, with ≥ 1 negative per input, permission or limit AC |
| AO-108, AO-109 | Addy Osmani — agent-skills (MIT) | UI state coverage and accessibility checklist | Mapped to the `ux.md` UX-n rows and A-1..A-4; upgraded to WCAG 2.2 AA |
| AO-110, AO-104 | Addy Osmani — agent-skills (MIT) | Measure first, noise awareness, metric honesty | Warm-ups, run counts and spread. Lab, scanner and field labels. A result near the threshold is `DONE_WITH_CONCERNS`. |
| AO-111 | Addy Osmani — agent-skills (MIT) | Browser test plan, clean console, isolation | `BTP-n` manual fallback and the end-to-end running rules |
| SP-54, SP-56 | Superpowers (MIT) | Name the break; mutation check | A case is kept only if it fails for a named defect; the oracle is checked against the smallest realistic violation |
| SP-55, SP-62 | Superpowers (MIT) | Test the real thing; condition-based waiting | No internal mocks; end-to-end waits on conditions, never on sleeps |
| MP-43, MP-44, MP-64 | Matt Pocock — skills (MIT) | Seam is the test surface; dependency categories; no seam is a finding | Seam rule in level selection. A missing seam → `BLOCKED` with a request to the Planner for a seam task. |
| MP-54, MP-55 | Matt Pocock — skills (MIT) | Tautological and implementation-coupled tests; mock at boundaries | The "tests that do not count as coverage" list |
| BM-22 | BMad Method (MIT) | A test not run counts as missing; never edit the expectation | Executed-test count by name at the PR head; failing tests stay red and go to the Reviewer |
| BM-30 | BMad Method (MIT) | Verification-gap lens | Black-box variant without the diff. The demonstration is required. Clean output is exactly `No verification gaps found.` |
| BM-82 | BMad Method (MIT) | E2E protocol: discover the harness, halt when none | Follow the existing harness. With no harness, record a finding for a Design task, never install one. |
| BM-28, BM-88 | BMad Method (MIT) | Edge-case classes; state coverage | Boundary and interruption heuristics in cases and the exploratory charter |
| — (Spec Kit `templates/commands/checklist.md`, `spec-template.md`) | GitHub Spec Kit (MIT) | "Unit tests for English"; independent test per story; measurable success criteria | Testability pass T1–T7 returns failing ACs to the Analyst |

---

## Metadata

| Field | Value |
|-------|-------|
| Version | 1.0.0 |
| Author | Eric Andrade |
| Created | 2026-11-24 |
| Updated | 2026-11-24 |
| Platforms | GitHub Copilot CLI, Claude Code, OpenAI Codex, OpenCode, Gemini CLI, Antigravity, Cursor IDE, AdaL CLI |
| Category | quality |
| Tags | agentic-sdlc, acceptance-tests, test-design, accessibility, non-functional, exploratory-testing, e2e |
| Risk | safe |
