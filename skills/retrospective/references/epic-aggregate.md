# Epic aggregate: the cross-item view

Load at Step 4 when the last item of an epic closes (several specs delivered under one epic or milestone), or when a Full item was delivered through several PRs. Each PR review saw one diff. The retro of the last item is the first place where all of them are seen together. The view is a set of Facts rows plus candidate Change items. It is not a separate record and it is not a review.

## 1. Scope the epic

| Question | Source |
|---|---|
| Which specs belong to the epic? | Issue epic or milestone links, spec headers (the linked issue), the `from-production` and intake issues that name the epic |
| Which PRs and releases? | Each spec's PR link, release notes `**Covers:**` |
| Which retros already exist? | `grep -l 'specs/0NN' docs/retros/*.md` for each spec |

Write the scope as the first Facts row: `Epic multi-currency: specs 020, 021, 022, 023 · PRs #301, #318, #334, #349 · releases v4.2.0–v4.4.0 · retros 2026-10-02, 2026-10-23, 2026-11-12`. A spec that belongs to the epic but has not merged is listed as `not delivered` and is not counted.

## 2. One row per spec

Build the table from the same sources as `evidence-gathering.md`, one row per spec, and add an epic total:

| Spec | Path | Lead time (h) | Max loop rounds | Escalations | Findings C/I/M | Approval wait (max, business days) | Impediments | Defects escaped ≤ 30 days |
|---|---|---|---|---|---|---|---|---|
| 020 | Full | 96 | 2 | 0 | 0/3/4 | 1 (Design) | 1 | 0 |
| 021 | Full | 140 | 3 | 1 (T4 halt) | 1/2/5 | 2 (Test) | 0 | 1 (#355) |
| 022 | Full | 118 | 2 | 0 | 0/1/2 | 4 (Design) | 2 | 0 |
| 023 | Full | 88 | 2 | 0 | 0/2/3 | 1 (Test) | 0 | 0 |
| Epic | — | median 107 · max 140 | 3 | 1 | 1/8/14 | max 4 | 3 | 1 |

Definitions:

- **Defects escaped** = `from-production` issues, postmortems and hotfix or revert commits that name the spec, dated within 30 days of its release. Count only defects found after Test sign-off. A defect from the review loop did not escape.
- **Approval wait** = `Requested at` → `Answered at` in `approvals.md`, plus review requested → approving review for Test sign-off, in business days.
- An earlier retro may already record a value. Copy it with its source (`from retro 2026-10-23`) rather than recomputing. When the two disagree, use the primary source and note the difference.

Do not include averages over fewer than 3 items, and do not add any per-person column.

## 3. Seam checks

These are the problems that no single PR review could see. For each check, record either the evidence or `none found (checked: <what>)`.

| Check | How | Candidate tag |
|---|---|---|
| Duplicated solutions | Search the epic's combined diff for new helpers, utilities or modules with the same responsibility: `git diff --stat <first base>..<last merge>`, then grep the new function names and the domain terms | `design-gap` |
| Pattern divergence | The same concern (errors, money, dates, auth, logging) is handled differently across specs. Compare against `docs/codemap.md`, the ADRs in `docs/adr/` and the conventions in the AGENTS.md block | `design-gap` |
| Architecture delta | Components, boundaries or dependencies added across the epic that are missing from `docs/codemap.md` or from an ADR in `docs/adr/` | `design-gap` |
| Spec reconciliation | Every AC-n of each spec still holds after the later specs: run the earlier specs' acceptance tests on the last merge (`sdlc-dod` or the recorded commands) | `spec-gap` or `test-gap` |
| Dropped or reinterpreted scope | The epic's stated outcome compared with what each spec's Out-of-scope section deferred. Anything deferred that no spec picked up | `spec-gap` |
| Size growth | The changed-line totals across the epic compared with the path sizing in `../agentic-sdlc/references/paths.md`. Any spec that should have been split | `process` |
| Repeated friction | The same cause tag in 2 or more specs of the epic. This is recurrence inside the window, so `action-rules.md` §Recurrence applies | as tagged |

## 4. Recording

Put the aggregate in the Facts table of the last item's retro. Prefix each row with `Epic <name>:` and keep one value per row so the table stays readable:

```
| Epic multi-currency: scope | specs 020–023 · PRs #301, #318, #334, #349 · v4.2.0–v4.4.0 | spec headers, release notes |
| Epic multi-currency: max loop rounds · escalations | 3 (021 T4) · 1 halt | run-ledger status per spec |
| Epic multi-currency: findings C/I/M | 1/8/14 | PR §Review triage ×4 |
| Epic multi-currency: max approval wait | 4 business days (022 Design) | specs/022-*/approvals.md |
| Epic multi-currency: defects escaped ≤ 30 days | 1 (#355, spec 021) | from-production issues |
| Epic multi-currency: duplicated solutions | 2 rounding helpers (021 src/money/round.ts, 023 src/fx/rounding.ts) | git diff 4a1e2c0..9f3b7d1 |
```

Each gap becomes a candidate Change item with its tag. The meeting keeps no more than 3 Change items in total, so the epic gaps compete with the last item's own gaps. Gaps the meeting does not choose go into §Carried with their evidence.

## 5. Typical actions from an epic view

| Gap | Action (target file) |
|---|---|
| Duplicated helper | Architecture or lint test that fails when a second implementation appears (`test/architecture/single-rounding.test.ts`), plus an AGENTS.md line naming the shared helper |
| Pattern divergence | A Conventions line in the AGENTS.md block. A check is better when the pattern can be matched mechanically |
| Architecture delta not recorded | Update `docs/codemap.md`, plus an ADR in `docs/adr/` when the decision was significant |
| Long design wait | Name a delegate approver in `CODEOWNERS` or the AGENTS.md block, or add a same-day reminder line to the Scrum Master checklist override |
| Spec split too late | Add a sizing line to the project's path rules, or the paths override in the AGENTS.md block |
