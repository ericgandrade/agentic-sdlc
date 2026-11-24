# Interface Checklist

Load at Workflow Step 3 for every interface the design adds or changes: a function or module exported to other modules, an HTTP or RPC endpoint, an event or message schema, a file or storage format, a CLI. The fixed interface becomes the `**Interface:**` block of the plan task that builds it (`../../agentic-sdlc/templates/plan.md` §Task details), written before any code.

Principles adapted from Addy Osmani's `api-and-interface-design` skill (MIT): observable behaviour becomes a contract (Hyrum's Law), contract first, one error strategy, validation at the boundary, additive change. Wording is original.

## How to use

Answer each item for the interface. Each answer is one of: a concrete value, `n/a — <reason>`, or `open — <question, owner>`. An `open` item on a public or cross-service interface blocks the Design sign-off request; on an internal module it becomes a Risk row in `plan.md`.

## Checklist (12 items)

| # | Item | Pass when the notes state | Typical failure |
|---|---|---|---|
| 1 | **Inputs** | Every parameter with type, unit, allowed range, required or default; who validates (validate at the trust boundary, not between internal typed functions) | "filters: object" |
| 2 | **Outputs** | Return type or response body, encoding, ordering of items, empty result shape | Empty result returns `null` in one path and `[]` in another |
| 3 | **Errors** | Each error mode with code or type, status, message shape, and whether the caller can retry; one error strategy per interface | Mixed `throw`, `null` and `{ok:false}` |
| 4 | **Limits and performance envelope** | Size limits, timeouts, rate limits, expected latency (p95), memory behaviour (streaming or buffered), each with a number from the spec or `open` | "Large exports are handled" |
| 5 | **Idempotency and retries** | For state-changing calls: idempotent or not; if not, the idempotency key (derived from intent, not from the attempt), claim mechanism (unique constraint, not read-then-insert), duplicate-in-flight behaviour | A random key per attempt |
| 6 | **Ordering and concurrency** | Required call order (ideally none), concurrent-call behaviour, event ordering guarantees (at-least-once is the default assumption for queues) | Temporal coupling (`init` before `run`) left implicit |
| 7 | **Versioning** | How the interface evolves: additive change only (new optional fields), version marker for breaking change, deprecation path | Renaming a field in place |
| 8 | **Backward compatibility** | Existing callers listed (from the code map `depends_on`); behaviour each relies on, including error text, ordering and timing (Hyrum's Law); migration pattern when a break is unavoidable (expand → migrate → contract, `../../agentic-sdlc/references/brownfield.md` §3) | "No one uses that field" without evidence |
| 9 | **Observability** | Metric names and labels, log events with fields (never personal data or secrets), trace span, the indicator or alert from the spec's Release & observability section it feeds | Logging the whole request body |
| 10 | **Security boundary** | Which trust boundary (TB-n from the threat model) the interface sits on; authentication and authorization check and its order relative to work; untrusted inputs; data classes crossing; the AC that proves the negative case | Permission checked after the query runs |
| 11 | **Configuration and flags** | Required config keys with defaults; feature flag name and default; behaviour with the flag off | Flag off returns 500 instead of 404 |
| 12 | **Ownership and documentation** | Owning module (code map name), where the contract is documented (types, OpenAPI, schema file), who approves breaking changes | Contract lives only in a chat |

## Naming conventions (adopt the project's first)

Read existing interfaces before naming. Only when the project has no convention: resource nouns in plural without verbs for HTTP paths; booleans start with `is`, `has` or `can`; one casing style for fields per interface; error codes in UPPER_SNAKE.

## Example — the worked example's export route

From `../../agentic-sdlc/examples/worked-example/specs/001-csv-export/plan.md` T3, as checklist answers:

| # | Answer |
|---|---|
| 1 | Same query parameters as `GET /api/reports/orders`; parsing shared with that route |
| 2 | `200 text/csv; charset=utf-8`, header row first, on-screen sort order; no match → header row only |
| 3 | `403 { error: 'forbidden' }` without permission; `422 { error: 'export_limit', message }` above the limit; `404` with the flag off |
| 4 | 50,000 rows maximum (AC-4); count before the first byte; streamed, never buffered whole |
| 5 | Read-only GET: idempotent |
| 6 | None required |
| 7 | New route, additive |
| 8 | `GET /api/reports/orders` unchanged; its tests stay in the regression scope |
| 9 | `reports_export_requests_total{status}` feeding the spec alert (error rate > 2% over 15 min) |
| 10 | Permission `reports:export` checked before any query (AC-3); filename generated on the server, never from user text; formula prefixes escaped (AC-2) |
| 11 | Flag `reports.csvExport`, default off → 404 |
| 12 | Owner module `api-reports`; contract in the T3 Interface block |

Item 10 shows why the checklist runs before code: the worked example's review round 1 found the filename built from the free-text filter, exactly the item the checklist would have fixed at Design.

## Exit

All 12 items answered for each public or cross-service interface; internal module interfaces need items 1–3, 6 and 12 at minimum. Copy the answers into the task's `**Interface:**` block as signatures plus one comment line per non-obvious item.
