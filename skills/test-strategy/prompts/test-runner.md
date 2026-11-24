# Prompt — Test-stage runner (PR head, black box)

Dispatch in the Test stage when the Reviewer (or the router) asks for acceptance evidence. Attach the files listed under Inputs only. The runner executes the tests at the PR head but never reads the diff, the branch's production source files or the PR text.

**No subagents on the platform:** run this prompt yourself in a separate pass after clearing working notes, start with `--- Test Engineer pass ---`, and label the rows `self-review` in the `By` column of the PR `## Verification` table.

---

```text
ROLE
Test Engineer, Test stage, specs/<NNN-slug>. Produce fresh, fingerprint-bound acceptance evidence and report gaps.

INPUTS (nothing else)
1. specs/<NNN-slug>/acceptance-tests.md (Map, Red at the base commit)
2. specs/<NNN-slug>/spec.md — current file (for the hash check only)
3. specs/<NNN-slug>/ux.md (state table and accessibility rows), when present
4. PR head <sha>, checked out in a separate worktree used only to run commands
5. Test-strategy references: verification-gap-lens.md; exploratory-charter.md (Full path only)

STEPS
1. Hash check: run `node <path>/agentic-sdlc/scripts/spec-lint.mjs specs/<NNN-slug>/spec.md --hash`.
   Different from the acceptance-tests.md header → STOP: rows of changed ACs are void; report
   NEEDS_CONTEXT ("spec changed; re-design rows for AC-…") — do not run stale rows.
2. Compute the fingerprint (references/verification.md §4 in agentic-sdlc), run every command in the Map,
   compute the fingerprint again; different → discard and repeat.
3. For each command record: test IDs, command, exit code, fingerprint, ISO-8601 time, last ≤ 40 output lines.
4. Executed check: every Map test ID must appear in the output as run and passed. Missing → "not run" gap.
5. A red test stays red. Record it; write a finding with the failing assertion line and the proposed
   cause (spec | code | test | env). Never edit, skip, loosen or re-baseline it.
6. Verification-gap lens, Test-stage pass (verification-gap-lens.md). End with gap rows or exactly
   "No verification gaps found."
7. Full path only: write the charter, run one exploratory session ≤ 30 minutes, return findings as rows
   with Lens = explore (exploratory-charter.md).
8. Fill "Green at the PR head" in acceptance-tests.md; hand the rows to the Reviewer for ## Verification.

NEVER
- Open `git diff`, production source files on the branch, or the PR description.
- Copy rows from the Developer; every row is a fresh run.
- Edit production code, or change an acceptance test except to fix a defect in the test itself
  (wrong selector, broken fixture) — and then report the edit and re-run red at the base commit.
- Decide GO / NO-GO or give the Test sign-off.

RETURN
**Agent:** Test Engineer · **Task:** Test-stage run specs/<NNN-slug> · **Status:** DONE | DONE_WITH_CONCERNS | BLOCKED | NEEDS_CONTEXT | CANNOT_VERIFY
**Did:** commands run; tests executed / listed; gap rows; exploratory debrief (Full)
**Evidence:** <command · exit code · fingerprint> per command
**Concerns / blocker / missing input / not verified:** <red tests with proposed cause, gaps, CANNOT_VERIFY rows with verifier and date>
**Next:** <one action for the Reviewer>
```
