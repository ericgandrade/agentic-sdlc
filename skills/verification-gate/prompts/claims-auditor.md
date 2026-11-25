# Prompt — Claims Audit (fresh Reviewer context)

Dispatch at Step 7 of `verification-gate` to a fresh Reviewer subagent. It re-runs the evidence and audits the PR description, commit messages and agent reports as **testimony**. It never edits code, tests, specs or plans, never commits, and never approves.

**Fallback without subagents.** Run this prompt inline in a fresh pass after clearing working notes: print `--- Reviewer pass: claims audit ---`, load only the inputs listed under "Inputs", and label every resulting row and finding `self-review` in `## Verification` and `## Review guide`.

**Controller rules (for whoever fills the placeholders).** Do not pre-judge the audit. The filled prompt must not contain phrases such as "do not flag", "this is fine", "at most Minor", "the plan chose", "skip the slow tests", or any summary of what the change does. Paste paths, not opinions. False positives are settled in the review loop, not suppressed in the prompt.

---

## Prompt to send

```text
Role: Reviewer, claims-audit pass, Agentic SDLC Test stage. Read-only except for the scratch
directory .agentic-sdlc/evidence/run/. Do not edit code, tests, specs, plans or the PR.
Do not commit. Do not approve.

Inputs (read in this order; do not open anything else until Phase 2 says so):
  1. Spec: {{SPEC_PATH}} at revision {{SPEC_REV}} — the AC-n list and their Priority.
  2. Acceptance-test map: {{ACCEPTANCE_TESTS_PATH}} (Quick: the acceptance test in {{ISSUE_REF}}).
  3. Definition of Done: the sdlc-dod block in {{DOD_FILE}}.
  4. Diff: git diff {{BASE_SHA}}...HEAD in {{REPO_PATH}}.
  5. Fingerprint helper: {{GIT_LIB_PATH}} (fingerprint().short).
  Sealed until Phase 3: {{TESTIMONY_PATHS}} (PR description text, commit messages,
  agent reports). Do not read them before Phase 3 is reached.

Phase 1 — Required rows.
  List one row per sdlc-dod key (lint, typecheck, test, coverage) and one or more rows
  per AC with the command from the acceptance-test map. An AC with no command: write
  "no runnable test" for it; do not invent a test.

Phase 2 — Fresh run.
  a. Compute fingerprint F1.
  b. Run every command exactly as written. Capture the shell exit code and the last 40
     lines of output per command into .agentic-sdlc/evidence/run/<row-id>.log.
  c. Compute fingerprint F2. If F1 != F2, discard all rows, report the files that
     changed (git status --porcelain), and repeat once. A second mismatch -> BLOCKED.
  d. For each row read the output: tests executed >= 1; 0 failed; no AC test skipped
     or filtered out; coverage value compared with coverage_min. Exit 0 with 0 tests
     executed is a failed row.
  e. Compare each AC row with the AC text: the outcome, number and unit the AC states.
  f. Read the diff for (i) weakened checks: lowered coverage_min, "|| true",
     --passWithNoTests, new skip markers, new lint or type suppressions, narrowed DoD
     paths; (ii) behaviour that no AC asks for: new endpoints, flags, options, stored
     fields, user-visible messages.

Phase 3 — Testimony.
  Now open {{TESTIMONY_PATHS}}. Extract every checkable statement: ACs met, tests added,
  "no regressions", behaviour preserved, numbers (limits, latency, sizes), parity
  ("same as X"), files untouched, "DONE". For each statement:
    supported   — a Phase 2 row proves it (cite the row ID);
    falsified   — Phase 2 output or the diff contradicts it (cite the output line or
                  file:line);
    unsupported — no row could prove it (name the command that would).
  A statement repeated in a code comment or commit message is the same statement, not
  extra evidence.

Return exactly this report:

**Agent:** Reviewer (claims audit) · **Task:** Test stage, PR {{PR_REF}} · **Status:** DONE | DONE_WITH_CONCERNS | BLOCKED | NEEDS_CONTEXT | CANNOT_VERIFY
**Fingerprint:** F1 = <12 hex> · F2 = <12 hex> · stable: yes | no

Verification rows (paste-ready, By = {{BY_LABEL}}):
| ID | Test | Command | Exit | Fingerprint | Time (ISO-8601) | By |

Output excerpts: last <= 40 lines per command, each headed
  $ <command>   # ID: <row ID> · fingerprint <12 hex>

Claims:
| # | Statement (quoted) | Source | Verdict | Evidence (row ID, output line or file:line) |

Weakened checks: <file:line · move> | none
Behaviour outside the spec: <file:line · behaviour> | none
ACs without a runnable test: <AC-n> | none
Concerns / blocker / missing input / not verified: <required unless DONE>
Next: <one action for the Reviewer>

Status rules: DONE only when every required row is fresh and passing and no claim is
falsified. Any failed, missing or unstable row, or any falsified claim -> BLOCKED.
Missing spec, map or sdlc-dod block -> NEEDS_CONTEXT. An AC that cannot be exercised
before merge -> CANNOT_VERIFY with reason, what was checked instead, and who should
verify it and when.
```

---

## Placeholders

| Placeholder | Fill with |
|---|---|
| `{{SPEC_PATH}}`, `{{SPEC_REV}}` | `specs/NNN-slug/spec.md` and its approved revision (Quick: the issue reference) |
| `{{ACCEPTANCE_TESTS_PATH}}` | `specs/NNN-slug/acceptance-tests.md` (Quick: `n/a — Quick`) |
| `{{ISSUE_REF}}` | issue number on the Quick path, else `n/a` |
| `{{DOD_FILE}}` | `AGENTS.md` (or `CLAUDE.md` when the block lives there) |
| `{{BASE_SHA}}`, `{{REPO_PATH}}` | merge-base SHA and repository root |
| `{{GIT_LIB_PATH}}` | path to `agentic-sdlc/scripts/lib/git.mjs` in the installed location |
| `{{TESTIMONY_PATHS}}` | a file holding the PR description, the output of `git log --format=%B <base>..HEAD`, and agent reports |
| `{{PR_REF}}` | PR number or `specs/NNN-slug/review.md` |
| `{{BY_LABEL}}` | `Reviewer` when dispatched as a fresh subagent; `self-review` for the inline fallback |

## After the report

The Reviewer copies the rows into `## Verification`, each falsified claim into `## Review triage` as a finding (lens L1, verification `confirmed`, the evidence column citing the output), each unsupported claim as a question in `## Review guide`, and each weakened check or unrequested behaviour as a finding per `../references/dod-check.md` and `../references/two-way-gap-check.md`. The auditor's report is itself testimony to the human reviewer: the rows carry fingerprints so anyone can re-run them.
