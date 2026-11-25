# Spec: Locale-aware price formatting

| Field | Value |
|---|---|
| ID | 001-price-format |
| Revision | 1 |
| Path | Standard |
| Size | S=3 · files 1 + components 1 + iterations 1 |
| Risk | R=1 · money |
| Owner | Product Owner · dogfood-owner (SIMULATED) |
| Issue | `docs/issues/0002-price-format.md` |
| Intake | n/a — no duplicate or prior rejection found (search: "price", "currency", "format") |

## Problem

Consumers of strkit format prices by hand with `'$' + (cents / 100).toFixed(2)`. The demo consumer has 3 such call sites; each prints `$1234.56` for 123456 cents, with no digit grouping, the wrong symbol for EUR and two decimals for JPY, which has none.

## Users

- **Library consumer (developer)** — imports `formatPrice` from `strkit`; no permission model.
- **End user of a consumer app** — reads the formatted price; never calls the library.

## Stories

- As a library consumer, I want to format an integer amount of minor units for a currency and locale, so that prices show the correct symbol, grouping and decimals without hand-written code.
- As a library consumer, I want invalid amounts, currencies and locales rejected with a RangeError, so that a wrong price is never displayed silently.

## Experience

n/a — no user-facing surface (library function; consumers own their UI)

## Acceptance criteria

| ID | Criterion | Priority |
|---|---|---|
| AC-1 | Given amountMinor 123456, currency `USD` and locale `en-US`, when `formatPrice` is called, then it returns `$1,234.56`. | critical |
| AC-2 | Given amountMinor 123456, currency `EUR` and locale `de-DE`, when `formatPrice` is called, then it returns `1.234,56` followed by U+00A0 and `€`. | critical |
| AC-3 | Given amountMinor 1234, currency `JPY` and locale `en-US`, when `formatPrice` is called, then it returns `¥1,234` (JPY has 0 minor digits). | critical |
| AC-4 | Given an amountMinor that is not a safe integer (1.5, `NaN`, 2^53, the string `"100"`), when `formatPrice` is called, then it throws a RangeError whose message is `amountMinor must be a safe integer`. | critical |
| AC-5 | Given a currency that is not 3 uppercase letters (`US`, `usd`) or a malformed locale tag (`xx-??`), when `formatPrice` is called, then it throws a RangeError. | normal |

## Non-goals

- Currency conversion or exchange rates.
- Accounting-style negatives with parentheses; negative amounts use the locale's default minus sign.
- Parsing a formatted price back into a number.

## Constraints

- **Always:** take the amount as an integer count of minor units; derive minor digits from `Intl.NumberFormat` for the currency.
- **Ask first:** adding any dependency (the library has 0 runtime dependencies).
- **Never:** use floating-point arithmetic other than one division by 10^digits; round amounts.

## Security notes

| Topic | Notes |
|---|---|
| Data classes | Financial (price amounts passed in by the caller); nothing stored, logged or sent |
| Authentication and authorization | none — pure function in a library, no identity or permission model |
| Inputs | amountMinor validated as a safe integer (AC-4); currency validated as 3 uppercase letters and locale by `Intl` (AC-5) |
| Secrets | none — the function reads no secret or configuration value |

## Rollback

1. Command: `git revert -m 1 <merge-sha> && npm test --silent`
2. Verify: `node --input-type=module -e "import('./src/index.js').then(m => console.log(typeof m.formatPrice))"` returns `undefined`.
3. Data: none — the function writes no data.

## Release & observability

| Item | Value |
|---|---|
| Signal | consumer test suite result for `formatPrice` call sites · AC-1, AC-2, AC-3, AC-4 |
| Alert | demo consumer test failures > 0 per day → Release Owner by email |
| Dashboard or query | `npm test --silent` in the demo consumer |
| Owner | Release Owner · dogfood-owner (SIMULATED) |
| Rollout | npm dist-tag `next` acts as the flag, default off (`latest` unchanged); promote `next` → `latest` after 7 days |
| Rollback command | `git revert -m 1 <merge-sha>` |

## Indicator

| Indicator | Baseline | Target | Method | First reading |
|---|---|---|---|---|
| Hand-formatted price call sites in the demo consumer | 3 call sites (2026-11-24) | 0 call sites | `grep -c "toFixed(2)" demo/*.js` | release date + 7 days |

## Open questions

None.

## Revision log

| Rev | Date | Change | Requested by | Critique |
|---|---|---|---|---|
| 1 | 2026-11-24 | First draft from `docs/issues/0002-price-format.md` | Product Owner | self-review · 12/12 · 2 fixed (string amount added to AC-4, U+00A0 named in AC-2), 0 open |

## Approvals

| Sign-off | Rev | Hash | Date | Role | Person | Exact words | Evidence reviewed | Residual risks | Decision |
|---|---|---|---|---|---|---|---|---|---|
| Specify + Design (combined) | 1 | 46743045b021 | 2026-11-25 00:05 | Product Owner | dogfood-owner (SIMULATED) | "yes, approved: spec rev 1 as the build baseline" (SIMULATED by dogfood-owner) | spec-lint exit 0; critique 12/12; threat-model.md rev 1; plan.md rev 1 (3 tasks) with plan-graph exit 0 | ICU data differences between Node builds; library-worded observability rows | approved |

### Waivers

| ID | Kind | Gate waived | Severity | Reason | Requester | Owner | Granted | Expires | Follow-up |
|---|---|---|---|---|---|---|---|---|---|
