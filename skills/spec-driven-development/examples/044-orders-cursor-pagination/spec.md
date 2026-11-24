# Spec: Cursor pagination for GET /v1/orders

<!--
Example 2 of 3 (synthetic) — a Standard public-API feature, shown at revision 2 to demonstrate
revise mode: the rev 1 approval row stays as history, the Rev 2 delta lists Added / Changed /
Removed / Must not change, and rev 2 carries its own approval (see approvals.md).
Check: node skills/agentic-sdlc/scripts/spec-lint.mjs --check-approval skills/spec-driven-development/examples/044-orders-cursor-pagination/spec.md
-->

| Field | Value |
|---|---|
| ID | 044-orders-cursor-pagination |
| Revision | 2 |
| Path | Standard |
| Size | S=4 · files 2 + components 1 + iterations 1 |
| Risk | R=1 · public API |
| Owner | Product Owner · A. Nakamura |
| Issue | #1203 |
| Intake | n/a — no duplicate or prior rejection found (tracker search: "pagination", "offset", "orders API timeout") |

## Problem

Partners that sync orders through `GET /v1/orders?offset=N` time out once the offset passes 200,000 rows: p95 latency is 9.4 s at offset 250,000 against a 5 s gateway limit. Two partners (412 and 977) reported 31 failed nightly syncs in October 2026. Offset paging also skips or repeats orders when new orders arrive during a sync.

## Users

- **Partner integration developer** — calls the public orders API with an API key scoped `orders:read`.
- **Partner support engineer (internal)** — answers integration questions and announces API changes.
- **SRE on-call (orders API)** — receives the latency and error alerts.

## Stories

- As a partner integration developer, I want to page through all orders with a cursor, so that a nightly sync of 500,000 orders finishes without timeouts.
- As a partner integration developer, I want each order to appear exactly once in a sync that starts before new orders arrive, so that my totals reconcile.
- As a partner integration developer already using `offset`, I want my integration to keep working during a 90-day migration window, so that I can migrate on my own schedule.

## Experience

`ux.md` rev 2 — surface: the developer experience of the public endpoint (parameters, response fields, error bodies, deprecation header). States UX-1..UX-6 map to AC-1..AC-5 and AC-7.

## Acceptance criteria

| ID | Criterion | Priority |
|---|---|---|
| AC-1 | Given 500,000 orders visible to a partner key, when the client follows `next_cursor` from the first page until it is null with `limit=200`, then every order is returned exactly once in ascending `created_at, id` order. | critical |
| AC-2 | Given a request with `limit` outside 1 to 200, when the API validates it, then it returns HTTP 400 with error code `invalid_limit` and no orders. | normal |
| AC-3 | Given a cursor issued to partner key A, when partner key B sends it, then the API returns HTTP 400 with error code `invalid_cursor` and no orders. | critical |
| AC-4 | Given a request that uses `offset` instead of `cursor`, when it is served during the 90 days after release, then the response body is unchanged from today and carries the header `Deprecation: true` with a `Sunset` date 90 days after release. | critical |
| AC-5 | Given 250,000 earlier orders, when a cursor page of 200 orders is requested on the staging data set, then p95 latency over 1,000 requests is ≤ 600 ms. | normal |
| AC-6 | Retired in rev 2: `total_count` needs a full count query (p95 2.1 s at 500,000 orders); partners 412 and 977 confirmed they do not read it. | — |
| AC-7 | Given a cursor page, when it is returned, then `has_more` is true when `next_cursor` is non-null and false on the last page, where `next_cursor` is null. | normal |

## Non-goals

- Removing `offset` support (a later spec after the 90-day window).
- Filtering or sorting options beyond the existing `created_after` filter.
- Changing other list endpoints (`/v1/customers`, `/v1/invoices`).

## Constraints

- **Always:** encode the cursor as an opaque, signed token bound to the API key; keep the response envelope `{ data, next_cursor }` documented in the OpenAPI file.
- **Ask first:** adding a database index larger than 2 GB; any change to rate limits.
- **Never:** expose internal row IDs in the cursor in plain text; break a field that exists in today's response.
- Compatibility: responses stay valid against the published OpenAPI schema v1.8 plus the new `next_cursor` field.

## Security notes

| Topic | Notes |
|---|---|
| Data classes | Order data (financial) per partner tenant; no new fields exposed |
| Authentication and authorization | API key with scope `orders:read` as today; cursor bound to the issuing key (AC-3) |
| Inputs | `cursor` is verified by signature before decoding; `limit` range-checked (AC-2); malformed cursor returns 400 |
| Secrets | Cursor signing key read from the secret store `orders-api/cursor-key`; rotated with the existing 90-day policy |

## Rollback

1. Command: `flagctl set orders.cursorPagination off --env prod`
2. Verify: `curl -s -H "Authorization: Bearer $TEST_KEY" "https://api.example.test/v1/orders?limit=1" | jq 'has("next_cursor")'` prints `false` within 60 s.
3. Data: no data change; the new index stays in place and is harmless when unused.

## Release & observability

| Item | Value |
|---|---|
| Signal | metric `orders_list_latency_ms{mode}` · AC-5; metric `orders_list_errors_total{code}` · AC-2, AC-3; metric `orders_offset_requests_total` · AC-4 |
| Alert | p95 `orders_list_latency_ms{mode="cursor"}` > 1,000 ms over 10 min → `#orders-api-oncall` |
| Dashboard or query | Grafana › Orders API › Pagination |
| Owner | SRE on-call, orders API · T. Okafor |
| Rollout | flag `orders.cursorPagination`, default off; stages 5% → 50% → 100% of partner keys, 24 h watch per stage |
| Rollback command | `flagctl set orders.cursorPagination off --env prod` |

## Indicator

| Indicator | Baseline | Target | Method | First reading |
|---|---|---|---|---|
| Failed nightly partner syncs (gateway 504 on `/v1/orders`) | 31 failures/month (October 2026) | ≤ 2 failures/month | Gateway log query `status=504 path=/v1/orders`, monthly | Release + 14 days |

## Open questions

None.

## Revision log

| Rev | Date | Change | Requested by | Critique |
|---|---|---|---|---|
| 1 | 2026-11-20 | First draft from issue #1203 and partner reports 412, 977 | Product Owner | fresh-context · 12/12 · 3 fixed (cursor bound to key, offset sunset date, ordering tie-break on id), 0 open |
| 2 | 2026-11-22 | Partner 977 asked for 200-row pages; `total_count` cost found in Build task T-3 spike; `has_more` added | Product Owner (relaying partner 977) | fresh-context · 12/12 · 1 fixed (AC-5 latency target re-measured at 200 rows), 0 open |

### Rev 2 delta

| Kind | Item | Rev 1 | Rev 2 | Reason |
|---|---|---|---|---|
| Changed | AC-2 | `limit` 1 to 100 | `limit` 1 to 200 | Partner 977 request; index tested at 200 rows |
| Changed | AC-5 | page of 100, p95 ≤ 400 ms | page of 200, p95 ≤ 600 ms | Re-measured on staging at the new page size |
| Removed | AC-6 | `total_count` on every page | retired | Count query p95 2.1 s; no partner reads it |
| Added | AC-7 | — | `has_more` flag | Lets clients stop without one empty request |
| Must not change | AC-4 | offset responses unchanged, 90-day sunset | unchanged | Partners migrate on their own schedule |
| Must not change | AC-3 | cursor bound to the issuing key | unchanged | Tenant isolation (TH-1 in threat-model.md) |
| Must not change | Response envelope | `{ data, next_cursor }` | unchanged, `has_more` added beside it | Existing fields never break (Constraints) |

Impact: tasks T-2 (validation) and T-4 (response builder) reopened, T-5 (count query) dropped; tests for AC-2, AC-5, AC-6 updated or removed, AC-7 test added; alert threshold raised to 1,000 ms; rollback and indicator unchanged; path re-scored S=4 · R=1, still Standard; threat model rev 2; Specify and Design sign-offs on rev 1 void and requested again (approvals.md R3, R4).

## Approvals

| Sign-off | Rev | Hash | Date | Role | Person | Exact words | Evidence reviewed | Residual risks | Decision |
|---|---|---|---|---|---|---|---|---|---|
| Specify + Design (combined) | 1 | cc0e4f9de1dc | 2026-11-20 16:05 | Product Owner | A. Nakamura | "Yes, approved: spec rev 1 and plan rev 1." | spec-lint exit 0; critique 12/12; threat-model.md rev 1; ux.md rev 1; plan.md rev 1 (5 tasks), plan-graph exit 0 | Partner migration pace unknown until the sunset date | approved |
| Specify + Design (combined) | 2 | e7cd774a2bba | 2026-11-22 11:30 | Product Owner | A. Nakamura | "Approved — rev 2 with the 200 limit and has_more; plan rev 2 too." | spec-lint exit 0; critique 12/12; Rev 2 delta (2 changed, 1 removed, 1 added, 3 must not change); threat-model.md rev 2; ux.md rev 2; plan.md rev 2 (4 tasks), plan-graph exit 0 | Partner migration pace unknown until the sunset date | approved |

### Waivers

| ID | Kind | Gate waived | Severity | Reason | Requester | Owner | Granted | Expires | Follow-up |
|---|---|---|---|---|---|---|---|---|---|
