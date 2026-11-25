# CSV export of filtered report rows — Plan

<!-- Worked example (synthetic). Written from templates/plan.md; checked by scripts/plan-graph.mjs, which generated graph.json next to this file. -->

**Path:** Standard · **Spec:** `specs/001-csv-export/spec.md` rev 1 (its hash is recorded in `## Approvals`) · **ADRs:** none — no decision is expensive to reverse: the route is new, behind a flag, and the serializer is internal

> **For the executor:** run this plan with the `executing-plans` skill, one task per fresh context, in the order of `graph.json` waves. Never start a task before each of its `Blocked by` tasks has a commit carrying its ID.

## Goal and architecture

**Goal:** a finance analyst with the `reports:export` permission downloads the orders currently shown on the reports page as a CSV file with order ID, order date and order total.

**Architecture:** a pure serializer in `api-export` turns order rows into CSV lines and escapes formula prefixes. A new route in `api-reports` reuses the page's filter query, mounts the `api-auth` permission check before any query, counts the rows before streaming and refuses more than 50,000. The web client adds one API call in `web-api-client` and an Export CSV button in `web-reports`. The flag `reports.csvExport` (default off) gates the route; rollback = flag off.

**Tech stack:** Node 20 + Express 4, React 18, TypeScript, Vitest, Playwright. DoD (`sdlc-dod`): `npm run lint`, `npm run typecheck`, `npm test`, `npm run coverage -- --json-summary` with `coverage_min: 78.4`.

## Tasks

| ID | Title | AC | Blocked by | Files | Size |
|---|---|---|---|---|---|
| T1 | Escape formula prefixes in a pure CSV serializer | AC-2 | — | `server/src/export/csv.ts`, `server/test/export/csv.test.ts` | 3h |
| T2 | Add the `reports:export` permission and its middleware | AC-3 | — | `server/src/auth/permissions.ts`, `server/test/auth/permissions.test.ts` | 2h |
| T3 | Stream the filtered rows from the export route with the 50,000-row limit | AC-1, AC-4 | T1, T2 | `server/src/routes/reports/export.ts`, `server/test/routes/reports/export.test.ts` | 4h |
| T4 | Fix the column order, ISO dates and 2-decimal totals | AC-1 | T1 | `server/src/export/csv.ts`, `server/test/export/csv.test.ts`, `server/test/routes/reports/export.test.ts` | 2h |
| T5 | Add the Export CSV button and its API client call | AC-1 | T3 | `web/src/api/reports.ts`, `web/src/api/__tests__/reports.test.ts`, `web/src/reports/ExportButton.tsx`, `web/src/reports/__tests__/ExportButton.test.tsx` | 4h |

T4 needs only T1, but it adds assertions to the route test that T3 creates, so `plan-graph` moves it from wave 2 to wave 3 (file conflict). T5 codes against the route contract fixed in T3 and mocks only `fetch`, a process boundary.

## Task details

### T1 — Escape formula prefixes in a pure CSV serializer

**AC:** AC-2 · **Blocked by:** — · **Files:** `server/src/export/csv.ts` (create), `server/test/export/csv.test.ts` (create)

**Interface:**

```ts
export type OrderRow = { orderId: string; orderDate: Date; orderTotal: number };
export function escapeCell(value: string): string; // prefixes = + - @ with "'", then RFC 4180 quoting
export function toCsvLines(rows: Iterable<OrderRow>): Generator<string>; // header first, "\r\n" line ends
```

1. **Red.** Tests `AC-2 text cells starting with = + - @ are prefixed with an apostrophe` and `AC-2 negative totals are written as numbers, not escaped text`. Run `npx vitest run server/test/export/csv.test.ts`. Expected: FAIL with `Failed to load url ../../src/export/csv.ts`.
2. **Green.** Implement `escapeCell` and `toCsvLines` with no I/O (`api-export` stays pure, per the code map). Escape text cells only; numbers bypass `escapeCell`. Same command. Expected: PASS (2 tests).
3. **Refactor.** One quoting helper for header and rows; tests stay green.
4. **Commit** `feat(export): CSV serializer with formula escaping` with trailer `Refs: T1 AC-2`.

### T2 — Add the `reports:export` permission and its middleware

**AC:** AC-3 · **Blocked by:** — · **Files:** `server/src/auth/permissions.ts` (modify), `server/test/auth/permissions.test.ts` (modify)

**Interface:**

```ts
// 'reports:export' joins the Permission union; role "finance-analyst" holds it, role "report-viewer" does not
export function requirePermission(p: Permission): RequestHandler; // 403 { error: 'forbidden' }, no body beyond that
```

1. **Red.** Tests `AC-3 requirePermission rejects a user without reports:export with 403` and `AC-3 finance-analyst holds reports:export`. Run `npx vitest run server/test/auth/permissions.test.ts`. Expected: FAIL with `expected 403 "Forbidden", got 200 "OK"`.
2. **Green.** Add the permission and the middleware; use the seeded test database for users (no mock of `UserRepository`, AGENTS.md pitfall). Same command. Expected: PASS (2 tests).
3. **Refactor.** None beyond naming; tests stay green.
4. **Commit** `feat(auth): reports:export permission` with trailer `Refs: T2 AC-3`.

### T3 — Stream the filtered rows from the export route with the 50,000-row limit

**AC:** AC-1, AC-4 · **Blocked by:** T1, T2 · **Files:** `server/src/routes/reports/export.ts` (create), `server/test/routes/reports/export.test.ts` (create)

**Interface:**

```text
GET /api/reports/export?<the query parameters of GET /api/reports/orders>
middleware order: requirePermission('reports:export') → flag reports.csvExport (off → 404) → handler
200 text/csv; charset=utf-8 · Content-Disposition: attachment; filename="orders-YYYY-MM-DD.csv" (server-generated)
countOrders(filters) > 50000 → 422 { "error": "export_limit", "message": "Export limit is 50,000 rows; narrow the filter" }, no CSV bytes
metric reports_export_requests_total{status="ok"|"error"} (feeds the spec alert: error rate > 2% over 15 min)
```

1. **Red.** Tests `AC-1 exports only the rows matching the active filters`, `AC-1 a filter with no matches exports the header row only`, `AC-4 more than 50,000 matching rows returns 422 and no partial file` and `AC-4 exactly 50,000 matching rows exports 50,000 data rows` (seeded with `seedOrders(50001)` and `seedOrders(50000)`). Run `npx vitest run server/test/routes/reports/export.test.ts`. Expected: FAIL with `expected 200 "OK", got 404 "Not Found"`.
2. **Green.** Build the query with the existing `buildOrdersQuery(filters)` in the on-screen sort order, run `countOrders(filters)` before the first `res.write`, stream rows through `toCsvLines`, increment the metric. Same command. Expected: PASS (4 tests).
3. **Refactor.** Extract filter parsing shared with `GET /api/reports/orders`; the existing orders-route tests stay green.
4. **Commit** `feat(reports): CSV export route with 50,000-row limit` with trailer `Refs: T3 AC-1 AC-4`.

### T4 — Fix the column order, ISO dates and 2-decimal totals

**AC:** AC-1 · **Blocked by:** T1 · **Files:** `server/src/export/csv.ts` (modify), `server/test/export/csv.test.ts` (modify), `server/test/routes/reports/export.test.ts` (modify)

**Interface:**

```ts
export const CSV_HEADER = 'order_id,order_date,order_total'; // fixed order (spec AC-1), not the on-screen column order
// order_date → ISO 8601 date (YYYY-MM-DD, UTC); order_total → toFixed(2), "." decimal separator
```

1. **Red.** Tests `AC-1 columns are order_id, order_date, order_total with totals to 2 decimals` (unit) and the same name in the route test. Run `npx vitest run server/test/export/csv.test.ts server/test/routes/reports/export.test.ts -t "columns"`. Expected: FAIL with `expected "12.5" to be "12.50"`.
2. **Green.** Format dates and totals in `toCsvLines`. Same command. Expected: PASS (2 tests).
3. **Refactor.** Move the formatters into named functions; tests stay green.
4. **Commit** `feat(export): fixed CSV columns, ISO dates, 2-decimal totals` with trailer `Refs: T4 AC-1`.

### T5 — Add the Export CSV button and its API client call

**AC:** AC-1 · **Blocked by:** T3 · **Files:** `web/src/api/reports.ts` (modify), `web/src/api/__tests__/reports.test.ts` (modify), `web/src/reports/ExportButton.tsx` (create), `web/src/reports/__tests__/ExportButton.test.tsx` (create)

**Interface:**

```ts
export function exportOrdersCsv(filters: OrderFilters): Promise<Blob>; // 422 → rejects with ExportLimitError(message)
export function ExportButton(props: { filters: OrderFilters }): JSX.Element | null; // null without reports:export
```

1. **Red.** Tests `AC-1 sends the filters shown on the page` and `AC-1 downloads the returned file as orders-YYYY-MM-DD.csv`. Run `npx vitest run web/src/api/__tests__/reports.test.ts web/src/reports/__tests__/ExportButton.test.tsx`. Expected: FAIL with `Unable to find role="button" and name "Export CSV"`.
2. **Green.** Add the client call (the only `fetch` site, per the code map) and the button; reuse the page's `useOrderFilters` hook. Same command. Expected: PASS (2 tests).
3. **Refactor.** None beyond naming; tests stay green.
4. **Commit** `feat(reports-web): Export CSV button` with trailer `Refs: T5 AC-1`.

## Impact

**Code map:** `codemap.md` (verified 2026-11-22 at `3f9c2a7d1e04`)

| Module | Paths touched | Change | Dependents | Mapped tests |
|---|---|---|---|---|
| api-export | `server/src/export/csv.ts` | new file | api-reports | `server/test/export/**`, `server/test/routes/reports/**` |
| api-auth | `server/src/auth/permissions.ts` | modify (new permission) | api-reports | `server/test/auth/**`, `server/test/routes/reports/**` |
| api-reports | `server/src/routes/reports/export.ts` | new file | web-api-client | `server/test/routes/reports/**`, `web/src/api/__tests__/**` |
| web-api-client | `web/src/api/reports.ts` | modify (new call) | web-reports | `web/src/api/__tests__/**`, `web/src/reports/__tests__/**` |
| web-reports | `web/src/reports/ExportButton.tsx` | new file | none | `web/src/reports/__tests__/**`, `e2e/reports/**` |

**Regression scope** (scoped re-check after every fix, `references/loops.md`): `npx vitest run server/test/export server/test/auth server/test/routes/reports web/src/api/__tests__ web/src/reports/__tests__`. The full DoD suite runs at loop exit and before the PR.

## Dependencies

none — CSV writing is about 40 lines in `server/src/export/csv.ts`; no package is added, so no license, advisory or typosquat review applies.

## Risks

| Risk | Likelihood (low/med/high) | Mitigation in this plan | Accepted by |
|---|---|---|---|
| A large export loads the primary database | med | T3 counts before streaming and refuses > 50,000 rows; the spec alert fires on error rate > 2% over 15 min | Tech Lead |
| The `COUNT(*)` before streaming is slow without an index on the filtered columns | low | Measured in staging before 100% rollout (release checklist) | Tech Lead |
| The web button ships before the route is enabled | low | Flag `reports.csvExport` gates the route; T5 shows the button only with `reports:export` | Product Owner |

## Loop ledger

<!-- Rows rendered by `run-ledger render --ledger specs/001-csv-export/run-ledger.jsonl` at run finish (references/loops.md). -->

| Date | Task | Loop | Round | Failure signature | Cause | Tried | Result |
|---|---|---|---|---|---|---|---|
| 2026-11-25 | T3 | review-fix | 1 | F-1 (L3, L4): Content-Disposition filename built from the free-text filter q; F-2 (L2, L4): whole CSV built as one string in memory | code | review round 1 of 9e1d4c2..e55a417 (lenses L1-L4) | failed |
| 2026-11-25 | T2 | review-fix | 1 | F-3 (L1): permission test mocks UserRepository | test | review round 1 of 9e1d4c2..e55a417 (lenses L1-L4) | failed |
| 2026-11-25 | T3 | review-fix | 2 | F-1 (L3, L4): Content-Disposition filename built from the free-text filter q; F-2 (L2, L4): whole CSV built as one string in memory | code | filename generated on the server as orders-YYYY-MM-DD.csv (f66b528); rows streamed after the count check (0a7c639); regression scope green | fixed |
| 2026-11-25 | T2 | review-fix | 2 | F-3 (L1): permission test mocks UserRepository | test | test moved to the seeded test database (1b8d74a); regression scope green | fixed |

## Revision log

| Rev | Date | Change | Reason |
|---|---|---|---|
| 1 | 2026-11-23 | First plan from spec rev 1 | — |

## Approvals

| Sign-off | Plan rev | Plan hash | Spec rev | Spec hash | Date | Role | Person | Exact words | Evidence reviewed | Residual risks | Decision |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Specify + Design (combined) | 1 | 4da2f0c5aea8 | 1 | 6b4c7f329c93 | 2026-11-23 15:10 | Tech Lead | D. Okafor | "Approved. Plan rev 1, five tasks, go." | plan-graph exit 0 (W1 T1 T2 · W2 T3 · W3 T4 T5, 1 file conflict); spec-lint exit 0; critique 12/12 | Export error alert untested until staging (release checklist) | approved |
