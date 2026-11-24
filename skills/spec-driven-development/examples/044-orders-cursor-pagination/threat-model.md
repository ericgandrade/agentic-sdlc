# Threat model: Cursor pagination for GET /v1/orders

<!-- Example (synthetic). Written from skills/agentic-sdlc/templates/threat-model.md for a Standard spec with the public API trigger. Rev 2 re-checked after the spec revision changed AC-2. -->

- **Spec:** `specs/044-orders-cursor-pagination/spec.md` rev 2
- **Revision:** 2
- **Path and risk:** Standard · R=1 (public API)
- **Written by:** Security Auditor · fresh-context · 2026-11-22
- **Assets:** partner order data per tenant; orders API availability
- **Trust boundaries:** TB-1 partner client → API gateway; TB-2 orders API → orders database
- **Data flows:** DF-1 partner sends API key, `cursor` and `limit` to the orders API; DF-2 orders API reads one page of orders from the database
- **Out of scope:** API key issuance and rotation (platform spec 011-api-keys)

## Threats

| ID | Data flow | Threat | STRIDE | L × I | Rating | Mitigation |
|---|---|---|---|---|---|---|
| TH-1 | DF-1 | A partner replays or edits another partner's cursor to read foreign orders | I | 2 × 3 = 6 | high | Signed cursor bound to the issuing key, verified before decoding · AC-3 |
| TH-2 | DF-1 | A client requests oversized pages to exhaust database capacity | D | 2 × 2 = 4 | medium | `limit` range check · AC-2; existing gateway rate limit |
| TH-3 | DF-2 | A crafted cursor injects a value into the page query | T | 1 × 3 = 3 | medium | Signature check rejects any edited cursor; query parameters bound, never concatenated · AC-3 |

## Residual risks

- none

## Revision log

- 1 · 2026-11-20 · first model for spec rev 1
- 2 · 2026-11-22 · TH-2 re-rated after AC-2 raised the page limit to 200; rating unchanged
