# verification-gate

Test-stage skill of the **Agentic SDLC**, and the evidence rule for every other stage. It turns completion claims ("done", "fixed", "passing", "ready for review", "ready to release") into fresh evidence: the command that proves each claim, run in full after the last change, its output read and compared with the acceptance criterion, and recorded in the PR `## Verification` table with the working-tree fingerprint it ran on. Around that loop it runs a claims check (the PR description and agent reports are testimony, never evidence), a two-way gap check (every `AC-n` tested; no behaviour nobody asked for) and a Definition of Done check against the `sdlc-dod` block in AGENTS.md. The Reviewer uses it before a GO or NO-GO verdict, the Test Engineer to record acceptance tests at the PR head, and the Developer before claiming a task done. The stage contract it implements is `skills/agentic-sdlc/references/verification.md`.

## When to use

- Before saying a task, PR, bug fix or release is done, fixed, passing or ready.
- To fill or audit the PR `## Verification` and `## Trace` sections.
- When evidence may be stale: a commit, rebase or merge happened after the last run.
- When a PR description, commit message or subagent report claims something that has not been re-run.
- To check the `sdlc-dod` Definition of Done, including the `coverage_min` floor.
- To record an AC that cannot be exercised before release as `CANNOT_VERIFY`.

Not for: designing acceptance tests (`test-strategy`), multi-lens code review findings (`multi-axis-code-review`), test-first coding (`test-driven-development`), root-causing failures (`systematic-debugging`), or writing the `sdlc-dod` block (`project-context`).

## What is included

- `SKILL.md` — Step 0 discovery, claim → required rows, DoD block check, AC command mapping, fingerprint-bound fresh run, output reading, recording, claims check, two-way gap check, staleness and status; anti-rationalization table; 5 examples
- `references/claim-command-catalog.md` — 20 claim types with the proving command, what to read, and what does not count; claim wording rules
- `references/fresh-run-protocol.md` — portable fingerprint and capture snippets (POSIX shell, PowerShell), fingerprint comparison, flaky results, row format, clean-up
- `references/dod-check.md` — locating and validating `sdlc-dod`, `n/a` reasons, ratchet and weakened-bar detection, coverage reading, DoD vs AC separation
- `references/two-way-gap-check.md` — forward and backward trace, commands, matrix, orphan resolution, worked mini-example
- `prompts/claims-auditor.md` — fresh-context Reviewer prompt that re-runs everything first and reads the PR text last, with an inline fallback
- `evals/evals.json` — 5 scenarios (task claim, Reviewer audit, pressure to skip, Quick bug fix, CANNOT_VERIFY on a Critical AC)
- `evals/trigger-eval.json` — 18 trigger queries (10 positive, 8 negative)
- Uses from `agentic-sdlc`: `references/verification.md`, `templates/pr-body.md`, `templates/acceptance-tests.md`, `scripts/lib/git.mjs` (`fingerprint()`), `scripts/preflight.mjs`

## Typical invocation

- "T3 is finished — verify it before I mark it done."
- "Fill the Verification table for PR #212 and tell me if the evidence supports GO."
- "The PR says no regressions and p95 under 300 ms. Check it."
- "A commit landed after the tests ran. Is the evidence stale?"
- "Run the trace: any AC without a test, or code nobody asked for?"

## Influences

| Inventory ID | Source (license) | What was taken | How adapted |
|---|---|---|---|
| SP-64 | Superpowers (MIT) | Verification gate function: identify the command, run it fresh, read the output, compare, only then claim; claim → evidence pairs | Each comparison targets a specific `AC-n`; the result becomes a fingerprint-bound PR Verification row; the claim table grew to 20 types with "does not count" columns |
| SP-34 | Superpowers (MIT) | Completion contract: a task is complete only with tests run in-session and output read | Becomes the Developer's "Task T-n done" row set (all `sdlc-dod` keys plus the task's ACs) |
| SP-44 | Superpowers (MIT) | Controller must not pre-judge findings; tripwire phrases | Controller rules in the claims-audit prompt forbid steering phrases and summaries of the change |
| BM-29 | BMad Method (MIT) | Claims check: the change's own narrative is testimony, read only after tracing | Claims audit reads the PR description, commits and reports in Phase 3, after the fresh runs; verdicts supported / falsified / unsupported |
| BM-22 | BMad Method (MIT) | A test that exists but did not run counts as missing; never edit the expectation to match code | Output-reading table: exit 0 with 0 tests, skipped or filtered AC tests fail the row; acceptance tests are never edited |
| BM-30 | BMad Method (MIT) | Broken- and stale-verification gap shapes | Snapshot tests that rewrite themselves and stale fingerprints are treated as broken verification in the run protocol |
| BM-19 | BMad Method (MIT) | Baseline revision as the trace anchor | Merge-base SHA anchors the trace commands and the "red before the fix" run |
| AO-102 | Addy Osmani agent-skills (MIT) | Definition of Done and acceptance criteria are two separate bars | DoD rows and AC rows stay separate in every claim; a green DoD never proves an AC |
| AO-66 | Addy Osmani agent-skills (MIT) | Verify the author's verification story | The Reviewer re-runs every row; `by: Developer` rows are testimony |
| AO-43 | Addy Osmani agent-skills (MIT) | Discover the stack's real commands; never assume `npm test` | Step 0 reads `sdlc-dod` and `acceptance-tests.md`; no invented DoD commands |
| AO-54 | Addy Osmani agent-skills (MIT) | Degraded self-review fallback when no fresh context is available | Inline labelled pass with the mandatory `self-review` label |
| MP-60 | Matt Pocock skills (MIT) | One command, already run, red-capable | "Bug fixed" needs the regression test red at the pre-fix commit and green on the current fingerprint |
| MP-34 | Matt Pocock skills (MIT) | Verify the claim by reproducing it before acting | Every statement in a PR or report is mapped to a re-runnable command |
| MP-73 | Matt Pocock skills (MIT) | PR body carries before/after evidence | Red/green excerpts and the collapsed output block under the Verification table |

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
| Tags | agentic-sdlc, verification, evidence, definition-of-done, traceability, code-review, testing |
| Risk | safe |
