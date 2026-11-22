# Spec: CSV export of filtered report rows

<!-- Worked example (synthetic). Written from templates/spec.md; checked by scripts/spec-lint.mjs. -->

| Field | Value |
|---|---|
| ID | 001-csv-export |
| Revision | 1 |
| Path | Standard |
| Size | S=5 · files 2 + components 2 + iterations 1 |
| Risk | R=1 · money |
| Owner | Product Owner · L. Rocha |
| Issue | #412 |
| Intake | n/a — no duplicate or prior rejection found (tracker search: "export", "CSV", "download report") |

## Problem

Finance analysts copy order rows from the reports page into spreadsheets by hand. Support logged 14 tickets in October 2026 asking for an export, and analysts report 20 minutes of copying per monthly close. Hand copying also drops rows when the table paginates at 100 rows.

## Users

- **Finance analyst** — holds the `reports:export` permission; exports the rows of the current filter.
- **Report viewer** — holds `reports:read` only; sees the report, never the export.
- **SRE on-call (reports team)** — receives the export error alert.

## Stories

- As a finance analyst, I want to export the rows of my current report filter as a CSV file, so that I can reconcile order totals in a spreadsheet without copying 100 rows per page.
- As a report viewer without the export permission, I want the page to show no export control, so that I am not offered an action that fails.

## Acceptance criteria

| ID | Criterion | Priority |
|---|---|---|
| AC-1 | Given a finance analyst viewing a report filtered to N rows (1 ≤ N ≤ 50,000), when they click Export CSV, then the downloaded file holds exactly N data rows with the columns order ID, order date (ISO 8601) and order total, in the on-screen sort order. | critical |
| AC-2 | Given an exported cell whose value starts with =, +, - or @, when the CSV is written, then the value is prefixed with a single quote so spreadsheet software reads it as text. | critical |
| AC-3 | Given a user without the `reports:export` permission, when they open the report, then no Export CSV button is shown, and a direct GET of `/api/reports/export` returns HTTP 403 with no file body. | critical |
| AC-4 | Given a filter matching more than 50,000 rows, when Export CSV is clicked, then the user sees the message "Export limit is 50,000 rows; narrow the filter" and no file or partial file is produced. | normal |

## Non-goals

- Excel (XLSX) or PDF export.
- Customer names, emails or any other personal data in the file.
- Scheduled or emailed exports.
- Exports above 50,000 rows (no background job in this spec).

## Constraints

- **Always:** stream the CSV from the existing report query with the user's filter; reuse the report's sort.
- **Ask first:** adding any new dependency (rule 10); changing the report query itself.
- **Never:** use production order data in tests or fixtures; write order rows to application logs.
- Response time: p95 ≤ 3 s for 50,000 rows on the staging data set of 200,000 synthetic orders.

## Security notes

| Topic | Notes |
|---|---|
| Data classes | Financial (order totals) and internal (order IDs, dates); no personal data, enforced by the column allow list in AC-1 |
| Authentication and authorization | Session cookie as today; new permission check `reports:export` on the export endpoint and on the button (AC-3) |
| Inputs | Filter parameters reuse the report's validated query object; cell values are escaped against formula injection (AC-2) |
| Secrets | none — the feature reads no secret and adds no configuration value |

## Rollback

1. Command: `flagctl set reports.csvExport off --env prod`
2. Verify: `curl -s -o /dev/null -w "%{http_code}" https://reports.example.test/api/reports/export` returns `404` within 60 s.
3. Data: the export writes no data; files already downloaded stay with the users who downloaded them.

## Release & observability

| Item | Value |
|---|---|
| Signal | metric `reports_export_requests_total{status}` · AC-1, AC-4; log event `export.rejected_permission` · AC-3 |
| Alert | export error rate (status 5xx / all exports) > 2% over 15 min → `#reports-oncall` |
| Dashboard or query | Grafana › Reports › CSV export |
| Owner | SRE on-call, reports team · R. Costa |
| Rollout | flag `reports.csvExport`, default off; stages 10% → 100% of finance analysts, 24 h watch per stage |
| Rollback command | `flagctl set reports.csvExport off --env prod` |

## Indicator

| Indicator | Baseline | Target | Method | First reading |
|---|---|---|---|---|
| Support tickets asking for report exports | 14 tickets/month (October 2026) | ≤ 4 tickets/month | Help-desk tag `export-request`, monthly count | Release + 7 days, then monthly |

## Open questions

None.

## Revision log

| Rev | Date | Change | Requested by | Critique |
|---|---|---|---|---|
| 1 | 2026-11-23 | First draft from issue #412 and the grill-me summary | Product Owner | fresh-context · 12/12 · 3 fixed (row limit message, ISO date format, 403 body), 0 open |

## Approvals

| Sign-off | Rev | Hash | Date | Role | Person | Exact words | Evidence reviewed | Residual risks | Decision |
|---|---|---|---|---|---|---|---|---|---|
| Specify + Design (combined) | 1 | 2aef8f23fc84 | 2026-11-23 14:40 | Product Owner | L. Rocha | "Yes — approved: spec rev 1 and plan rev 1 as presented." | spec-lint exit 0; critique 12/12; plan.md rev 1 (5 tasks) with plan-graph exit 0 | Export error alert untested until staging (release checklist) | approved |

### Waivers

| ID | Kind | Gate waived | Severity | Reason | Requester | Owner | Granted | Expires | Follow-up |
|---|---|---|---|---|---|---|---|---|---|
