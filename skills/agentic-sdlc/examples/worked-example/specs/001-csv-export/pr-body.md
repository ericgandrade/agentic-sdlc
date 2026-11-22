**Spec:** `specs/001-csv-export/spec.md` rev 1 · sha256 `2aef8f23fc84` · **Plan:** rev 1 · sha256 `4da2f0c5aea8`
**Path:** Standard · S=5 · R=1 (money) · **Enforcement:** branch-protection
**Base:** `main` @ `9e1d4c2` · **Head:** `1b8d74a` · **Current fingerprint:** `b7e2a91c04d5`

## Summary

Adds CSV export of the currently filtered orders on the reports page: order ID, order date and order total (AC-1), with formula-injection escaping (AC-2), the `reports:export` permission check (AC-3) and a 50,000-row limit (AC-4). The feature flag `reports.csvExport` defaults to off. No customer fields are read or written.

## Verification

DoD (`sdlc-dod`) and acceptance criteria are separate rows. A row counts only with `exit = 0` and `fingerprint = current fingerprint`; anything else is stale → re-run.

| ID | Test | Command | Exit | Fingerprint | Time (ISO-8601) | By |
|---|---|---|---|---|---|---|
| DoD:lint | — | `npm run lint` | 0 | `b7e2a91c04d5` | 2026-11-25T09:40:02-03:00 | Reviewer |
| DoD:typecheck | — | `npm run typecheck` | 0 | `b7e2a91c04d5` | 2026-11-25T09:40:37-03:00 | Reviewer |
| DoD:test | — | `npm test` | 0 | `b7e2a91c04d5` | 2026-11-25T09:41:48-03:00 | Reviewer |
| DoD:coverage | — | `npm run coverage -- --json-summary` | 0 (84.1 ≥ 78.4) | `b7e2a91c04d5` | 2026-11-25T09:41:55-03:00 | Reviewer |
| AC-1 | AT-1a, AT-1b, AT-1c `AC-1 exports only the rows matching the active filters` (+2) | `npx vitest run server/test/routes/reports/export.test.ts -t "AC-1"` | 0 | `b7e2a91c04d5` | 2026-11-25T09:42:10-03:00 | Reviewer |
| AC-1 | AT-1d `AC-1 export button downloads the filtered rows shown on the page` | `npx playwright test e2e/reports/export.spec.ts` | 0 | `b7e2a91c04d5` | 2026-11-25T09:44:31-03:00 | Reviewer |
| AC-2 | AT-2a, AT-2b `AC-2 text cells starting with = + - @ are prefixed with an apostrophe` (+1) | `npx vitest run server/test/export/csv.test.ts -t "AC-2"` | 0 | `b7e2a91c04d5` | 2026-11-25T09:42:18-03:00 | Reviewer |
| AC-3 | AT-3a, AT-3b `AC-3 a user without reports:export gets 403 and no file` (+1) | `npx vitest run server/test/routes/reports/export.test.ts -t "AC-3"` | 0 | `b7e2a91c04d5` | 2026-11-25T09:42:25-03:00 | Reviewer |
| AC-4 | AT-4a, AT-4b `AC-4 more than 50,000 matching rows returns 422 and no partial file` (+1) | `npx vitest run server/test/routes/reports/export.test.ts -t "AC-4"` | 0 | `b7e2a91c04d5` | 2026-11-25T09:43:02-03:00 | Reviewer |

### CANNOT_VERIFY

| AC | Critical | Reason | Checked instead | Verifier (role, person) | When (≤ 14 days after release) | Waiver |
|---|---|---|---|---|---|---|
| none | — | All 4 ACs exercised against the seeded test database | — | — | — | — |

<details><summary>Output excerpts (last ≤ 40 lines per command)</summary>

```text
$ npm run coverage -- --json-summary   # ID: DoD:coverage · fingerprint b7e2a91c04d5
 Test Files  14 passed (14)
      Tests  96 passed (96)
 % Coverage report from v8
 All files |   84.1 |    79.6 |   86.3 |   84.1 |

$ npx vitest run server/test/routes/reports/export.test.ts -t "AC-4"   # ID: AC-4 · fingerprint b7e2a91c04d5
 ✓ server/test/routes/reports/export.test.ts > AC-4 more than 50,000 matching rows returns 422 and no partial file 812ms
 ✓ server/test/routes/reports/export.test.ts > AC-4 exactly 50,000 matching rows exports 50,000 data rows 1904ms
 Test Files  1 passed (1)
      Tests  2 passed | 6 skipped (8)
```

</details>

## Trace

Forward: every AC has ≥ 1 task and ≥ 1 fresh passing test. Backward: every task has an AC; every commit has a Tn; every cited AC ID exists in the spec.

| AC | Tasks | Commits | Tests | Verification rows | Status |
|---|---|---|---|---|---|
| AC-1 | T3, T4, T5 | `c33e2f5`, `d44f306`, `e55a417`, `f66b528` | AT-1a, AT-1b, AT-1c, AT-1d | AC-1 (2 rows) | ok |
| AC-2 | T1 | `a11c0f3` | AT-2a, AT-2b | AC-2 | ok |
| AC-3 | T2 | `b22d1e4`, `1b8d74a` | AT-3a, AT-3b | AC-3 | ok |
| AC-4 | T3 | `c33e2f5`, `0a7c639`, `f66b528` | AT-4a, AT-4b | AC-4 | ok |

Commits on `9e1d4c2..1b8d74a`: `a11c0f3` (T1 AC-2) · `b22d1e4` (T2 AC-3) · `c33e2f5` (T3 AC-1 AC-4) · `d44f306` (T4 AC-1) · `e55a417` (T5 AC-1) · `f66b528` (T3 F-1) · `0a7c639` (T3 AC-4 F-2) · `1b8d74a` (T2 AC-3 F-3).

**Orphans:** none

## Review triage

**Reviewed SHA:** `1b8d74a` · **Review round:** 2 of 3 · **Verdict:** GO

### Lenses

| Lens | Context | Checks performed | Findings raised | Status |
|---|---|---|---|---|
| L1 spec/tests | fresh subagent | 4 of 4 ACs implemented; no behaviour outside spec or non-goals (no customer fields); each AC test asserts the stated outcome; negative tests for AC-1..AC-4; new tests against `tdd.md` §Anti-patterns; Trace orphans | 2 (round 1) | ran |
| L2 correctness/design | fresh subagent | empty, limit and error paths; route signature vs plan T3; no single-call-site abstraction; error handling and logging; no ADR required (plan: none); DoD output warnings | 3 (round 1) | ran |
| L3 security | fresh subagent | `security.md` §Review checklist: 20 items · 17 PASS · 1 FAIL (S10) · 2 n/a (S13 no crypto, S19 no model input); no new dependency (plan `## Dependencies`: none) | 1 (round 1) | ran |
| L4 context-free (diff only) | fresh subagent | hostile input in query params; memory and time at 50,000 rows; partial failure mid-stream; boundary values | 2 (round 1) | ran |

Round 1, stage 1: L1 returned F-3 and F-7 (no confirmed Critical) → stage 2 dispatched L2, L3, L4 in parallel. L3-1 (`export.ts:41`) and L4-2 (`export.ts:40-42`) overlap within ± 3 lines with the same cause → merged as F-1, highest severity kept.

### Findings

| ID | Lens | Verification | Sev | File:line | Cause | Finding | Disposition | Evidence |
|---|---|---|---|---|---|---|---|---|
| F-1 | L3, L4 | confirmed | Critical | `server/src/routes/reports/export.ts:40-42` | code | `sec S10` — `Content-Disposition` filename built from the free-text `q` filter; a CR/LF in `q` injects response headers | fixed `f66b528` | Round 1: `curl -i ".../export?q=a%0d%0aX-Injected:1"` printed `X-Injected: 1`. Round 2: same request → header absent; filename is now `orders-YYYY-MM-DD.csv` |
| F-2 | L2, L4 | confirmed | Important | `server/src/routes/reports/export.ts:55-68` | code | Whole CSV built as one string in memory for up to 50,000 rows | fixed `0a7c639` | Rows now streamed after a `COUNT(*)` check, so AC-4 still sends no partial file; AT-4a and AT-4b green on `b7e2a91c04d5` |
| F-3 | L1 | confirmed | Important | `server/test/auth/permissions.test.ts:8-30` | test | Unit test mocks `UserRepository`, an internal collaborator (`tdd.md` §Anti-patterns: mocking what is not a process boundary) | fixed `1b8d74a` | Test now uses the seeded test database; `npx vitest run server/test/auth/permissions.test.ts` exit 0 |
| F-4 | L4 | not reproduced | — | `server/src/routes/reports/export.ts:47` | code | Suspected off-by-one: exactly 50,000 rows rejected | closed | AT-4b (exactly 50,000 rows) exit 0 at `e55a417` and at `1b8d74a` |
| F-5 | L2 | declined to judge | — | `server/src/export/csv.ts:31` | spec | Totals use `.` as decimal separator; spreadsheet apps in comma-decimal locales open them as text | to human | Product decision: the spec fixes the format (AC-1: 2 decimals), not the locale → Review guide question 2 |
| F-6 | L2 | confirmed | Minor | `web/src/reports/ExportButton.tsx:12` | code | Download handle named `d` | deferred #142 | Deferred list; no behaviour change |
| F-7 | L1 | confirmed | Important | `server/src/export/csv.ts:8` | spec | Column order is fixed, not the order displayed on the page | rejected: spec text | Spec AC-1 (rev 1): "the columns order ID, order date (ISO 8601) and order total"; plan T4 fixes that order. Implementer re-ran AT-1b: exit 0 |

### Rounds

| Round | Reviewed range | Lenses run | Findings checked | New findings | Verdict |
|---|---|---|---|---|---|
| 1 | `9e1d4c2..e55a417` | L1, then L2, L3, L4 | — | F-1..F-7 | NO-GO (F-1 Critical open) |
| 2 | `e55a417..1b8d74a` (scoped: 46 of 412 reviewed lines changed, 11% ≤ 30%) | L1 (changed test), L2, L3, L4 on the delta | F-1 resolved · F-2 resolved · F-3 resolved · F-7 rejection accepted (spec text) | none | GO |

**GO conditions** (all true, else NO-GO): fresh passing row for every AC or a waived CANNOT_VERIFY · no orphans · 0 open Critical (fixed, or rejected with a recorded human ruling) · every confirmed finding has a disposition (Important deferred only with owner acceptance) · every required lens ran or is waived.

## Review guide

For the human reviewer (engineer) who gives PR approval. Read in this order.

1. **Files, riskiest first:**
   - `server/src/routes/reports/export.ts` — sends money data out; authorization; user input in filters; streaming and the row limit (F-1, F-2).
   - `server/src/auth/permissions.ts` — the `reports:export` check (AC-3).
   - `server/src/export/csv.ts` — formula escaping and number formatting (AC-2, F-5).
   - `web/src/api/reports.ts`, `web/src/reports/ExportButton.tsx` — filters passed from the page (AC-1).
2. **Questions for the human (3–7):**
   - Is a fixed filename `orders-YYYY-MM-DD.csv` acceptable to users who export several filters a day (F-1 fix)?
   - Should totals follow the user's locale decimal separator? Today they use `.` (F-5); a change is a spec revision.
   - Is the 422 message "Export limit is 50,000 rows; narrow the filter" the wording support expects (AC-4)?
   - Does the `COUNT(*)` before streaming need an index on the filtered columns at production volume (F-2 fix)?
3. **CANNOT_VERIFY items:** none
4. **Self-review labels:** none (acceptance tests and all four lenses ran as fresh subagents)
5. **Deferred findings and waivers:** F-6 → #142 (Minor) · waivers: none

## Waivers

| ID | Kind (accept risk \| defer \| emergency) | Gate waived | Reason | Owner (≠ requester) | Expiry (≤ 30 days) | Follow-up issue |
|---|---|---|---|---|---|---|
| none | — | — | — | — | — | — |
