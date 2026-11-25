Path: Standard · S=3 · R=1 (money)
# Add locale-aware price formatting
Status: ready
Reported by: Product Owner (dogfood-owner, SIMULATED) · 2026-11-24

Library consumers format prices by hand (`'$' + (cents / 100).toFixed(2)`), which is wrong for non-US locales and for currencies without minor units. Add `formatPrice(amountMinor, currency, locale)` to strkit.

> Drafted by an AI agent during triage; decisions are recorded by the named human.

## Intake record
Path: Standard · S=3 · R=1 (money)

| Field | Value |
|---|---|
| Source | request from Product Owner on 2026-11-24 |
| Problem | consumers hand-format prices; 3 hand-written call sites in the demo consumer, each wrong for `de-DE` and `JPY` — evidence: `'$' + (123456/100).toFixed(2)` prints `$1234.56` (no grouping, wrong symbol for EUR) |
| Class | feature |
| Search | terms "price", "currency", "format" · tracker n/a (no tracker) · docs/issues 0 · docs/out-of-scope 0 · specs/ 0 · code 0 |
| Intake | n/a — no duplicate or prior rejection found (search: terms above) |
| Size | files 3 (`src/price.js`, `src/index.js`, `test/price.test.js`) → 1 · components 1 (strkit-lib) → 1 · iterations 1 → 1 · S=3 → Quick |
| Risk | auth no · personal/health data no · money yes (displays prices) · public API no (adds an export; no existing contract changes) · schema no · irreversible no · regulated no · R=1 → Standard |
| Indicator | hand-formatted price call sites in the demo consumer: 3 → 0 |
| Priority | n/a — Product Manager not triggered; Product Owner orders the backlog |
| Bug verification | n/a — feature |
| Recurrence | none |
| Specialists | PM no · UX Designer no (no UI) · Security Auditor yes (money trigger: Security notes) · Architect no |
| Readiness | ready — failing criteria none |
| Related | none |
| Next | Specify (`specs/001-price-format/spec.md`) |

## Comments
