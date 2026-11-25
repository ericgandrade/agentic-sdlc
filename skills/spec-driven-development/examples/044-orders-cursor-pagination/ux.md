# UX: Cursor pagination for GET /v1/orders

<!-- Example (synthetic). Written from skills/agentic-sdlc/templates/ux.md. The surface is the developer experience of a public API, which is a UX trigger. -->

| Field | Value |
|---|---|
| Spec | `specs/044-orders-cursor-pagination/spec.md` rev 2 |
| Revision | 2 |
| Surfaces | `GET /v1/orders` parameters and response, error bodies, `Deprecation` and `Sunset` headers, API reference page |
| Design system | none — public REST API; error body follows the existing `{ error: { code, message, docs_url } }` shape |
| Accessibility target | WCAG 2.2 AA (API reference page only) |

## Journeys

| ID | Story | Entry | Steps | Success | Failure exits |
|---|---|---|---|---|---|
| J-1 | Page through all orders | API reference › Pagination | 1. Call without `cursor`. 2. Repeat with `cursor=next_cursor` while `has_more` is true | Last page has `has_more: false`, `next_cursor: null` | bad `limit` → UX-4; foreign or edited cursor → UX-5 |
| J-2 | Keep an offset integration working | Existing integration | 1. Call with `offset` as today | Same body as today plus deprecation headers | none in the window; after sunset a later spec decides |

## State table

| ID | Surface | State | Trigger | What the user sees (copy) | Action available | AC |
|---|---|---|---|---|---|---|
| UX-1 | Response | empty | No orders visible to the key | `{ "data": [], "next_cursor": null, "has_more": false }` | none | AC-7 |
| UX-2 | Response | success | Page with more orders | `data` of `limit` orders, `next_cursor` string, `has_more: true` | follow `next_cursor` | AC-1, AC-7 |
| UX-3 | Response | partial or limit | Offset call during the window | Unchanged body; headers `Deprecation: true`, `Sunset: <date>`, `Link` to the migration guide | migrate before sunset | AC-4 |
| UX-4 | Error body | error | `limit` outside 1 to 200 | `invalid_limit`: "limit must be between 1 and 200" + `docs_url` | fix the parameter | AC-2 |
| UX-5 | Error body | no permission | Cursor issued to another key, or edited | `invalid_cursor`: "This cursor is not valid for this API key. Restart from the first page." | restart without `cursor` | AC-3 |
| UX-6 | Response | loading | n/a — synchronous API; latency is bounded by AC-5 | n/a | n/a | AC-5 |

## Accessibility

| ID | Requirement | Check |
|---|---|---|
| A-1 | Every action is reachable by keyboard; focus is visible; focus order is logical | Keyboard walkthrough of the API reference page |
| A-2 | Every control has an accessible name; status changes are announced (`aria-live`) | Scanner + screen reader on the code-sample tabs |
| A-3 | Text contrast ≥ 4.5:1 (≥ 3:1 for large text and UI components) | Scanner on the code-sample theme |
| A-4 | No information is conveyed by color alone; motion respects the reduced-motion setting | Review of the deprecation callout |

## Wireframe

```text
GET /v1/orders?limit=200&cursor=eyJr...
200 OK
{ "data": [ {order}, ... 200 ], "next_cursor": "eyJr...", "has_more": true }
```

## Open questions

None.

## Test-stage checks

| ID | Evidence (screenshot, rendered output, scanner run) | Result |
|---|---|---|
| n/a — filled at Test | n/a | n/a |
