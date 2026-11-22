# Acceptance tests — 001-csv-export

**Spec:** `specs/001-csv-export/spec.md` rev 1 · sha256 `2aef8f23fc84` (a later spec revision voids the rows of every changed AC)
**Base commit:** `9e1d4c2` (the only code the designer read)
**Designed by:** Test Engineer (fresh subagent, 2026-11-23, after the Plan approval at 15:10 UTC)
**Inputs read:** `spec.md` rev 1; the code map (`codemap.md`); test conventions in `server/test/README.md`; `server/test/helpers/seed-orders.ts` and the Express app at the base commit · **Not seen:** implementation diff, branch `feat/001-csv-export`, PR text

## Map

One row per test; every AC has ≥ 1 row. `Critical` copies the spec `Priority`: AC-1 carries order totals (money), AC-2 is a Security note (formula injection) and AC-3 is authorization, so all three are `critical`; AC-4 is `normal`.

Files follow the code map: route tests under `server/test/routes/reports/` (module `api-reports`), serializer tests under `server/test/export/` (`api-export`), the end-to-end test under `e2e/reports/` (`web-reports`). Seven tests share their names with the red steps of T1, T3 and T4 in `plan.md`; AT-1d, AT-3a and AT-3b have no red step of their own and turn green when T3 and T5 land. All data is synthetic: `seed-orders.ts` generates orders `ORD-000001…` with totals from a fixed seed; no customer fields exist in the fixture.

| AC | Critical | Test ID | Test name (contains the AC ID) | Level | File | Failure it catches | Negative |
|---|---|---|---|---|---|---|---|
| AC-1 | yes | AT-1a | `AC-1 exports only the rows matching the active filters` | integration | `server/test/routes/reports/export.test.ts` | The route ignores a filter and exports rows outside it | no |
| AC-1 | yes | AT-1b | `AC-1 columns are order_id, order_date, order_total with totals to 2 decimals` | integration | `server/test/routes/reports/export.test.ts` | Extra or reordered columns, or totals rounded or reformatted | no |
| AC-1 | yes | AT-1c | `AC-1 a filter with no matches exports the header row only` | integration | `server/test/routes/reports/export.test.ts` | An empty result returns an error or rows from an unfiltered query | yes |
| AC-1 | yes | AT-1d | `AC-1 export button downloads the filtered rows shown on the page` | end-to-end | `e2e/reports/export.spec.ts` | The web client sends different filters from those displayed | no |
| AC-2 | yes | AT-2a | `AC-2 text cells starting with = + - @ are prefixed with an apostrophe` | unit | `server/test/export/csv.test.ts` | A crafted order ID becomes an executable spreadsheet formula | yes |
| AC-2 | yes | AT-2b | `AC-2 negative totals are written as numbers, not escaped text` | unit | `server/test/export/csv.test.ts` | Escaping corrupts money values such as `-12.50` | yes |
| AC-3 | yes | AT-3a | `AC-3 a user without reports:export gets 403 and no file` | integration | `server/test/routes/reports/export.test.ts` | The route serves the file without the permission check | yes |
| AC-3 | yes | AT-3b | `AC-3 a user with reports:export gets 200 and text/csv` | integration | `server/test/routes/reports/export.test.ts` | The check blocks authorized users | no |
| AC-4 | no | AT-4a | `AC-4 more than 50,000 matching rows returns 422 and no partial file` | integration | `server/test/routes/reports/export.test.ts` | The limit is missing, or a truncated file is sent as if complete | yes |
| AC-4 | no | AT-4b | `AC-4 exactly 50,000 matching rows exports 50,000 data rows` | integration | `server/test/routes/reports/export.test.ts` | Off-by-one at the limit | yes |

Mocks: none. The integration tests run the Express app against the seeded test database container; the end-to-end test runs the built web app against the same container.

## Red at the base commit

| Test ID | Command | Exit | Failure line (first assertion or error) |
|---|---|---|---|
| AT-1a | `npx vitest run server/test/routes/reports/export.test.ts -t "AC-1"` | 1 | `expected 200 "OK", got 404 "Not Found"` |
| AT-1b | `npx vitest run server/test/routes/reports/export.test.ts -t "AC-1"` | 1 | `expected 200 "OK", got 404 "Not Found"` |
| AT-1c | `npx vitest run server/test/routes/reports/export.test.ts -t "AC-1"` | 1 | `expected 200 "OK", got 404 "Not Found"` |
| AT-1d | `npx playwright test e2e/reports/export.spec.ts` | 1 | `locator getByRole('button', { name: 'Export CSV' }) not found` |
| AT-2a | `npx vitest run server/test/export/csv.test.ts -t "AC-2"` | 1 | `Failed to load url ../../src/export/csv.ts` |
| AT-2b | `npx vitest run server/test/export/csv.test.ts -t "AC-2"` | 1 | `Failed to load url ../../src/export/csv.ts` |
| AT-3a | `npx vitest run server/test/routes/reports/export.test.ts -t "AC-3"` | 1 | `expected 403 "Forbidden", got 404 "Not Found"` |
| AT-3b | `npx vitest run server/test/routes/reports/export.test.ts -t "AC-3"` | 1 | `expected 200 "OK", got 404 "Not Found"` |
| AT-4a | `npx vitest run server/test/routes/reports/export.test.ts -t "AC-4"` | 1 | `expected 422, got 404 "Not Found"` |
| AT-4b | `npx vitest run server/test/routes/reports/export.test.ts -t "AC-4"` | 1 | `expected 200 "OK", got 404 "Not Found"` |

## Green at the PR head

| Test ID | Command | Exit | Fingerprint | Time (ISO-8601) |
|---|---|---|---|---|
| AT-1a, AT-1b, AT-1c | `npx vitest run server/test/routes/reports/export.test.ts -t "AC-1"` | 0 | `b7e2a91c04d5` | 2026-11-25T09:42:10-03:00 |
| AT-1d | `npx playwright test e2e/reports/export.spec.ts` | 0 | `b7e2a91c04d5` | 2026-11-25T09:44:31-03:00 |
| AT-2a, AT-2b | `npx vitest run server/test/export/csv.test.ts -t "AC-2"` | 0 | `b7e2a91c04d5` | 2026-11-25T09:42:18-03:00 |
| AT-3a, AT-3b | `npx vitest run server/test/routes/reports/export.test.ts -t "AC-3"` | 0 | `b7e2a91c04d5` | 2026-11-25T09:42:25-03:00 |
| AT-4a, AT-4b | `npx vitest run server/test/routes/reports/export.test.ts -t "AC-4"` | 0 | `b7e2a91c04d5` | 2026-11-25T09:43:02-03:00 |

## Not verifiable before release

| AC | Critical | Reason | Checked instead | Verifier (role, person) | When (≤ 14 days after release) |
|---|---|---|---|---|---|
| none | — | All 4 ACs run against the seeded test database. Production volume is watched by the spec alert (export error rate > 2% over 15 min), not by an AC | — | — | — |

## Coverage check

| Check | Result |
|---|---|
| Every AC in the spec has ≥ 1 row in Map | yes (AC-1: 4, AC-2: 2, AC-3: 2, AC-4: 2) |
| Every Test ID cites an AC that exists in the spec | yes |
| Every input, permission or limit AC has a negative test | yes (AC-1: AT-1c, AC-2: AT-2a/AT-2b, AC-3: AT-3a, AC-4: AT-4a/AT-4b) |
| Every test was red at the base commit | yes (10 of 10) |
