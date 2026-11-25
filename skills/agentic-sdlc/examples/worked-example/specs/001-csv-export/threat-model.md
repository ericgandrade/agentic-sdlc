# Threat model: CSV export of order IDs, dates and totals

- **Spec:** `specs/001-csv-export/spec.md` rev 1
- **Revision:** 1
- **Path and risk:** Standard · R=1 (money)
- **Written by:** Security Auditor · fresh-context · 2026-11-20
- **Assets:** order totals and order IDs in the reporting database (financial, internal); the analyst's spreadsheet that opens the file
- **Trust boundaries:** TB-1 browser → reports API; TB-2 reports API → reporting database; TB-3 downloaded file → spreadsheet software on the user's machine
- **Data flows:** DF-1 analyst's browser sends the filter and the export request to `/api/reports/export` (TB-1); DF-2 the API queries the filtered rows (TB-2); DF-3 the API streams the CSV that the user opens in a spreadsheet (TB-3)
- **Out of scope:** session handling and authentication (unchanged platform controls); database access controls (owned by the platform team)

## Threats

| ID | Data flow | Threat | STRIDE | L × I | Rating | Mitigation |
|---|---|---|---|---|---|---|
| TH-1 | DF-1 | A signed-in user without `reports:export` calls the export URL directly and downloads financial totals | E | 3 × 2 = 6 | high | Permission check on the endpoint as well as the button · AC-3 |
| TH-2 | DF-3 | An order note or ID crafted as `=HYPERLINK(...)` runs as a formula when the analyst opens the CSV | T | 2 × 3 = 6 | high | Prefix cells starting with `=`, `+`, `-` or `@` with a single quote · AC-2 |
| TH-3 | DF-2 | A user requests an unbounded export to exhaust the API or the database | D | 2 × 2 = 4 | medium | Hard limit of 50,000 rows, counted before streaming · AC-4 |
| TH-4 | DF-2 | A filter parameter is tampered with to add columns beyond the allow list (for example customer email) | I | 1 × 3 = 3 | medium | Column allow list fixed server-side; the filter object is the report's validated one · AC-1 |

## Residual risks

- none

## Revision log

- 1 · 2026-11-20 · first model for spec rev 1
