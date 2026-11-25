# multi-axis-code-review

Test-stage skill of the **Agentic SDLC**: reviews a pull request or branch diff against its approved spec and plan on five axes — spec compliance, design and standards, correctness and edge cases, security, simplicity — through four independent lenses run in fresh contexts (spec first, then correctness/design, security and a context-free adversarial pass in parallel). Every finding is merged, verified at the reviewed SHA and only then rated Critical, Important or Minor; each confirmed defect is routed to the stage that caused it (spec gap → Specify, design or plan defect → Design, local defect → Build). The skill guards against weakened tests and thresholds, keeps a "declined to judge" list for the human, covers the author's receive mode, re-reviews fixes within the 3-round bound and prepares the **Test sign-off** for a human reviewer who is not the PR author.

## When to use

- A PR is ready for review on the Quick, Standard or Full path (Reviewer role; the Security Auditor runs lens L3).
- The Developer has received merged findings and must disposition them (receive mode).
- Fixes were pushed after a NO-GO round (scoped re-review).
- The Test sign-off request must be prepared.
- Not for: a quick generic diff review with no spec (built-in `code-review`), a standalone vulnerability scan (built-in `security-review` or `security-hardening`), the test plan (`test-strategy`) or the evidence gate (`verification-gate`).

## Modes

| Mode | Use when |
|---|---|
| request | A full review round (Steps 0–8, then Step 10 on GO) |
| re-review | Fixes arrived for a reviewed SHA (Step 9) |
| receive | The author dispositions findings (`references/receive-mode.md`) |

## What is included

- `SKILL.md` — discovery and entry checks, axis-to-lens map, prompt packages and hygiene, two-stage dispatch, merge, verify-then-rate, root-cause routing and cascade, verdict and run-ledger record, scoped re-review, Test sign-off preparation, anti-rationalization table
- `prompts/axis-spec-compliance.md` — lens L1 (AC verdicts, test quality, micro-mutation probe)
- `prompts/axis-correctness.md` — lens L2 part 1 (edge cases, error paths, concurrency, data integrity)
- `prompts/axis-design-simplicity.md` — lens L2 part 2 (plan fit, ADRs, standards, simplicity signals)
- `prompts/axis-security.md` — lens L3 (security checklist S1–S20)
- `prompts/axis-adversarial.md` — lens L4 (diff only, candidate floor)
- `prompts/re-review.md` — scoped re-review of a fix delta
- `references/triage-and-routing.md` — merge key, verification methods, rating calibration, routing questions, cascade, record formats, stop rules
- `references/weakened-bar-guard.md` — scan commands, legitimacy test, severity table
- `references/receive-mode.md` — author procedure, reply formats, dispositions, push back, ruling request
- `references/test-signoff-prep.md` — pre-request check, risk ordering, question rules, request message, approval depth
- Uses from `agentic-sdlc`: `references/review.md`, `references/security.md`, `references/loops.md`, `references/governance.md`, `templates/pr-body.md`, `scripts/run-ledger.mjs`
- `evals/evals.json` — 5 scenarios (full round, pressure to skip, receive mode, weakened bar in re-review, spec contradiction)
- `evals/trigger-eval.json` — 17 trigger queries (9 positive, 8 negative)

## Typical invocation

- "Review PR #57 against the spec."
- "Run the multi-axis review on this branch before sign-off."
- "Here are the review findings — work through them." (receive mode)
- "Fixes are pushed; re-review."
- "Prepare the Test sign-off request."

## Influences

| Inventory ID | Source (license) | What was taken | How adapted |
|---|---|---|---|
| SP-42 | Superpowers (MIT) | Two-stage review: spec compliance before code quality; Missing / Extra / Misunderstood | L1 runs alone first; a confirmed Critical ends the round; AC verdicts met / missing / partial / misunderstood |
| SP-44 | Superpowers (MIT) | Reviewer prompts free of pre-judging | Tripwire phrase list stripped from every package (Step 2) |
| SP-46, SP-47 | Superpowers (MIT) | Scoped re-review of fixes; re-grade by effect | Delta-only re-review with the 30% rule; "spec was silent" never lowers severity |
| SP-50 | Superpowers (MIT) | "Declined to judge" instead of guessing | Per-lens list, carried to the human as Review guide questions |
| SP-51 | Superpowers (MIT) | Receiving review: verify first, no performative agreement | `receive-mode.md` procedure, forbidden phrases, evidence-only replies |
| AO-65 | Addy Osmani agent-skills (MIT) | Five-axis review | Five axes mapped onto four lenses; worst finding reported per axis |
| AO-66 | Addy Osmani agent-skills (MIT) | Tests first, micro-mutation, check findings before reporting | L1 judges each AC test as proof of the AC; mutation probe in a scratch worktree; Step 6 verify |
| AO-67, AO-72 | Addy Osmani agent-skills (MIT) | Severity labels; disagreement hierarchy and honesty | Critical / Important / Minor with calibration table; evidence ranking in push back |
| AO-74 | Addy Osmani agent-skills (MIT) | Simplification signals | Simplicity checks 17–20 (earned abstractions, deletion test, signals, smells) in the L2 design prompt |
| MP-68 | Matt Pocock skills (MIT) | Parallel axes without cross-axis ranking | L2–L4 in parallel; per-axis summary line, no single winner |
| MP-71 | Matt Pocock skills (MIT) | Reviewer briefs with pasted rules and a word cap | Self-contained packages: rules pasted, not linked |
| MP-42 | Matt Pocock skills (MIT) | Deletion test | Check 18: a new module or wrapper whose deletion would only move complexity is a pass-through finding |
| BM-25, BM-27 | BMad Method (MIT) | Parallel context-free lenses; finding floor | L4 gets the diff only; floor adapted to a candidate floor that allows zero findings |
| BM-29, BM-32 | BMad Method (MIT) | Claims are testimony; verify-then-verdict | PR description never trusted; confirmed / not reproduced / declined to judge before any severity |
| BM-33, BM-36 | BMad Method (MIT) | Root-cause routing with cascade; triage log | Cause table, `held: F-n`, collision log and Findings table |
| BM-37, BM-40 | BMad Method (MIT) | No-subagent fallback; when to stop | `self-review` label on cleared-context passes; stop rules in `triage-and-routing.md` §6 |

All text is original; no persona names are used.

---

## Metadata

| Field | Value |
|---|---|
| Version | 1.0.0 |
| Author | Eric Andrade |
| Created | 2026-11-24 |
| Updated | 2026-11-24 |
| Platforms | GitHub Copilot CLI, Claude Code, OpenAI Codex, OpenCode, Gemini CLI, Antigravity, Cursor IDE, AdaL CLI |
| Category | quality |
| Tags | agentic-sdlc, code-review, test-stage, verification, security, root-cause-routing |
| Risk | safe |
