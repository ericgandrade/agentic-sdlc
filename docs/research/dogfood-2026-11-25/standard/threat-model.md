# Threat model: Locale-aware price formatting

- **Spec:** `specs/001-price-format/spec.md` rev 1
- **Revision:** 1
- **Path and risk:** Standard · R=1 (money)
- **Written by:** Security Auditor · self-review · 2026-11-24
- **Assets:** correctness of a displayed price (a wrong amount shown to an end user is a financial misstatement)
- **Trust boundaries:** TB-1 consumer code → `formatPrice` (arguments may come from untrusted request data)
- **Data flows:** DF-1 consumer passes amountMinor, currency, locale across TB-1; the function returns a string
- **Out of scope:** how consumers store or compute amounts; XSS when consumers inject the string into HTML (consumer's escaping)

## Threats

| ID | Data flow | Threat | STRIDE | L × I | Rating | Mitigation |
|---|---|---|---|---|---|---|
| TH-1 | DF-1 | A caller passes a float or string amount (`"100"`, 1.005) and an end user sees a rounded or concatenated price | T | 2 × 3 = 6 | high | reject non-safe-integer amounts with RangeError · AC-4 |
| TH-2 | DF-1 | A caller passes an attacker-chosen currency or locale string to make the output show a different currency than charged | T | 1 × 3 = 3 | medium | currency must be 3 uppercase letters, locale validated by Intl · AC-5 |
| TH-3 | DF-1 | A very long locale string causes slow parsing (denial of service) | D | 1 × 1 = 1 | low | accepted — Intl rejects malformed tags in constant time, owner Tech Lead |

## Residual risks

- TH-3 — Intl handles malformed tags; no measurable cost — Tech Lead — review by 2026-12-24

## Revision log

- 1 · 2026-11-24 · first model for spec rev 1
