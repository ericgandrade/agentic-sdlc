# Revise mode — delta specs

Load this file when a spec must change after it was written: a reviewer's change request before sign-off, a requirement change after the Specify sign-off, a Build or Test finding routed back to Specify, or a re-score that moves the path.

Contracts: `../../agentic-sdlc/references/rules.md` § Change protocol and `../../agentic-sdlc/references/governance.md` § 4 (hash and re-open rule). This file adds the delta format and the "must not change" discipline. Worked example: `../examples/044-orders-cursor-pagination/spec.md` (rev 2).

## 1. Which situation applies

| Situation | Approval state | What to do |
|---|---|---|
| Edit before any sign-off request | none | Edit in place within the same revision; re-run critique and lint. No delta needed. |
| Edit after the request was sent, before the answer | request pending | The request is stale. Bump to rev N+1 with a delta, re-lint, send a new request; log the new row in `approvals.md`. |
| Edit after the Specify sign-off | void the moment the hash changes | Full change protocol (§ 2). |
| New requirement after release | released | Not a revision. Open a new Discover item and a new spec that cites the old spec ID; use the delta table to state what the released behavior keeps. |
| Re-route up (new trigger or bigger size) | void | Change protocol plus the escalation entry from `../../agentic-sdlc/references/paths.md` (`Rev N+1 · route Standard → Full · trigger: …`). Never route down silently. |

## 2. Change protocol, step by step

1. **Stop at a green point.** If Build is running, stop the current task at its next green test run and record its state in the loop ledger.
2. **Write the change request** as a new Revision log row: date, what changed, why, who asked.
3. **Write the delta** (§ 3) under the Revision log as `### Rev N+1 delta`.
4. **Impact analysis** — list every affected item: AC-n, plan tasks T-n, tests, ADRs, rollback command, alert, indicator, `ux.md` states, threat-model rows, and the path score (re-score; route up when it rises).
5. **Edit the spec body** as Revision N+1: update the header `Revision`, edit ACs, retire removed ACs (never renumber), add new ACs with the next free number.
6. **Re-run the critique** (fresh-context or self-review, 12/12) on the changed spec; the doubt pass (`../prompts/doubt-pass.md`) focuses on the delta and the Must-not-change rows.
7. **Lint:** `spec-lint` exit 0. Then compute the new hash with `--hash`.
8. **Request sign-off again** (§ 4). Earlier approval rows stay as history.
9. **Resume** at the earliest affected stage; commits made under the void approval stay on the branch and are re-verified.

## 3. Delta format

Place under `## Revision log`, after the table. It is hashed (it is part of the spec) and excluded from the vague-term check and the word budget.

```markdown
### Rev 2 delta

| Kind | Item | Rev 1 | Rev 2 | Reason |
|---|---|---|---|---|
| Changed | AC-2 | `limit` 1 to 100 | `limit` 1 to 200 | Partner 977 request |
| Removed | AC-6 | `total_count` on every page | retired | Count query p95 2.1 s |
| Added | AC-7 | — | `has_more` flag | Clients stop without an empty request |
| Must not change | AC-4 | offset responses unchanged for 90 days | unchanged | Partners migrate on their own schedule |

Impact: tasks T-2, T-4 reopened; T-5 dropped; tests for AC-2, AC-5, AC-6 updated or removed; AC-7 test added; path re-scored S=4 · R=1, still Standard; Specify and Design sign-offs on rev 1 void.
```

Rules for the rows:

- **Added** — a new AC, non-goal, constraint or observability item. New ACs take the next free ID.
- **Changed** — the old and new wording or value side by side, short enough to compare at a glance.
- **Removed** — the AC row stays in the table as `Retired in rev N: <reason>` with priority `—`. A non-goal or constraint that is dropped is listed here with its old text.
- **Must not change** — at least 1 row on every revision after a sign-off. Name the behavior the change could break by accident and point to the AC that proves it still holds. When no existing AC proves it, add a regression AC (`ac-rubric.md` pair 11) and list it under Added as well.

The Must-not-change rows are the reviewer's guardrail: the Product Owner approves what changes *and* what is promised to stay; the Test Engineer re-runs the tests of those ACs in the next Test stage.

## 4. Approvals after a revision

- **Hash.** `node skills/agentic-sdlc/scripts/spec-lint.mjs --hash specs/NNN-slug/spec.md` prints the 12-hex hash of the file without `## Approvals`. Any edit to hashed content — an AC, a non-goal, the rollback, the alert threshold, a comment, a typo — changes it.
- **Void rule.** A hash that differs from the last approval row means the Specify sign-off is void (`spec-lint --check-approval` → AP04). Per governance § 4, a void Specify sign-off also voids the Design sign-off built on that spec hash; request both again. On a Standard item with a plan of ≤ 5 tasks, one combined request covers both.
- **New request.** One message: spec path, rev N+1, new hash, the delta table (or a link to it), lint result, critique result, residual risks, the question "approve rev N+1?". Append the request row to `approvals.md` with Requested at (UTC). End the turn.
- **Record.** Only an explicit "yes" or "approved" in a later turn counts. Append a new row to `## Approvals` (Rev N+1, new hash, exact words) and complete the register row (Answered at, Exact words). Earlier rows stay as history; the binding row is the last one.
- **Check.** `spec-lint --check-approval` exits 0 only when the last row's rev and hash match the file and the register shows the request before the answer.

## 5. Revision log examples

| Rev | Date | Change | Requested by | Critique |
|---|---|---|---|---|
| 1 | 2026-11-20 | First draft from issue #1203 | Product Owner | fresh-context · 12/12 · 3 fixed, 0 open |
| 2 | 2026-11-22 | `limit` 200, `total_count` retired, `has_more` added | Product Owner (relaying partner 977) | fresh-context · 12/12 · 1 fixed, 0 open |
| 3 | 2026-11-25 | Route Standard → Full · trigger: personal data found in order notes · R 1 → 2 | Security Auditor | self-review · 12/12 · 2 fixed, 0 open |

The last row's Rev must equal the header `Revision` (REV02), and its Critique cell must contain `fresh-context` or `self-review` and `12/12` (REV03).

## 6. Anti-patterns

| Pattern | Why it fails | Instead |
|---|---|---|
| Editing an approved spec "just a typo" without a new revision | The hash changed; the approval is void and Build preflight stops | Rev N+1 with a one-row delta; ask again |
| Renumbering ACs after a removal | Tasks, commits and tests cite the old IDs | Retire the row; take the next free ID |
| A delta with no Must-not-change row | The reviewer cannot see what the change might break | Name ≥ 1 protected behavior and its AC |
| Rewriting the whole spec for a two-row change | Reviewers re-read everything; the risk hides | Edit only the changed rows; the delta lists them |
| Continuing Build "because the change is small" | Work under a void approval is unverified | Stop at green, revise, re-approve, resume |
| Overwriting the old approval row | Loses the audit trail | Append; earlier rows stay as history |
