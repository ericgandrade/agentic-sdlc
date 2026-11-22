# Release notes — reports-web v2.14.0

<!-- Worked example (synthetic). Written from templates/release-notes.md; rules in references/release-ops.md. Times use the team's local offset (-03:00). -->

**Spec:** `specs/001-csv-export/spec.md` rev 1 · hash `2aef8f23fc84` · **PR:** #138 (head `1b8d74a`) · **Path:** Standard
**Release commit:** `5d2e8b0` (merge of PR #138, 2026-11-27T11:30:00-03:00; tree identical to head `1b8d74a`, fingerprint `b7e2a91c04d5`) · **Tag:** `v2.14.0` (pushed only after Release approval) · **Planned date:** 2026-11-30
**Release Engineer:** Release Engineer agent (fresh subagent) · **Release Owner:** Release Owner, P. Nair

## Summary

The reports page has an **Export CSV** button that downloads the rows of the current filter (order ID, order date, order total) in the on-screen sort order. Exports are limited to 50,000 rows and require the `reports:export` permission; users without it see no button.

## Shipped acceptance criteria

| AC | Title | Critical | Evidence (PR Verification row) | Fingerprint | Result |
|---|---|---|---|---|---|
| AC-1 | Export holds exactly the N filtered rows: order ID, order date (ISO 8601), order total, in on-screen sort order | yes | PR #138 · rows AC-1 (2) · AT-1a, AT-1b, AT-1c, AT-1d | `b7e2a91c04d5` | PASS |
| AC-2 | Cells starting with `= + - @` are prefixed with a single quote | yes | PR #138 · row AC-2 · AT-2a, AT-2b | `b7e2a91c04d5` | PASS |
| AC-3 | No button without `reports:export`; a direct GET returns 403 with no file body | yes | PR #138 · row AC-3 · AT-3a, AT-3b | `b7e2a91c04d5` | PASS |
| AC-4 | More than 50,000 matching rows → limit message, no file or partial file | no | PR #138 · row AC-4 · AT-4a, AT-4b | `b7e2a91c04d5` | PASS |

## Rollout

**Mechanism:** flag `reports.csvExport` (default off) + stages over finance analysts, as in spec §Release & observability · **Baseline (7 days to 2026-11-29):** reports API error rate 0.4% · p95 310 ms · source Grafana › Reports › API overview. The export endpoint is new and has no history; its own alert (> 2% over 15 min) applies from stage 1, and the reports API baseline guards collateral impact.

| Stage | Exposure | Watch window (longer of spec and release-ops minimum) | Advance if (all) | Roll back if (any) |
|---|---|---|---|---|
| 1 | 10% of finance analysts | 24 h (spec; release-ops minimum 60 min) | error rate ≤ 0.9% · p95 ≤ 341 ms · export alert silent | threshold exceeded · export alert fires · SEV1/SEV2 |
| 2 | 100% of finance analysts | 24 h, then the release closes | same | same |

## Rollback

**Command:** `flagctl set reports.csvExport off --env prod` · **Verify:** `curl -s -o /dev/null -w "%{http_code}" https://reports.example.test/api/reports/export` returns `404` within 60 s (spec §Rollback). **Data:** the export writes no data.

**Rehearsal (R3):** environment staging · date 2026-11-27 · commit `5d2e8b0`

```text
$ flagctl set reports.csvExport on --env staging --percent 100
reports.csvExport: off -> on (100%) [staging]
exit 0 · 2026-11-27T13:48:05-03:00
$ curl -s -o /dev/null -w "%{http_code}" https://staging.reports.example.test/api/reports/export
401
exit 0 · 2026-11-27T13:48:41-03:00
$ flagctl set reports.csvExport off --env staging
reports.csvExport: on (100%) -> off [staging]
exit 0 · 2026-11-27T13:52:40-03:00
$ curl -s -o /dev/null -w "%{http_code}" https://staging.reports.example.test/api/reports/export
404
exit 0 · 2026-11-27T13:52:58-03:00
```

With the flag on, the unauthenticated probe reaches the route (`401`); after the rollback the route is gone (`404`). Rollback took 18 s from command to verified `404`, inside the spec's 60 s.

## Observability

| Field | Value |
|---|---|
| Signal (AC) | metric `reports_export_requests_total{status}` · AC-1, AC-4; log event `export.rejected_permission` · AC-3 |
| Alert | export error rate (status 5xx / all exports) > 2% over 15 min → `#reports-oncall`; rule ID `reports-export-error-rate` |
| Dashboard or query | Grafana › Reports › CSV export |
| Owner | SRE on-call, reports team · R. Costa |
| Alert live in production (go/no-go 4) | rule `reports-export-error-rate` in the production alert configuration, loaded 2026-11-27T15:10:00-03:00 |
| Test alert fired in staging (R5) | fired 2026-11-27T14:05:00-03:00 · received 2026-11-27T14:06:10-03:00 in `#reports-oncall-staging` · latency 1.2 min (≤ 5) |

## Runbook

New endpoint and new alert → operated behaviour changes → runbook required. The reports service has no runbook file, so this section is the runbook until the next Full release of the service creates `docs/runbooks/reports-web.md`.

- **Alert:** `reports-export-error-rate` — export error rate (5xx / all exports) > 2% over 15 min
- **First check:** Grafana › Reports › CSV export, panel "Requests by status"; then `sum by (status) (rate(reports_export_requests_total[15m]))`
- **Rollback:** `flagctl set reports.csvExport off --env prod`
- **Verify:** the spec's `curl` returns `404` within 60 s
- **Escalation:** SRE on-call, reports team, in `#reports-oncall`; Tech Lead after 30 min without mitigation
- **Last verified:** 2026-11-27 (staging rehearsal)

## Release checklist

| # | Item | Evidence | Value |
|---|---|---|---|
| R1 | Release commit and tag named | `5d2e8b0`, `v2.14.0` | true |
| R2 | Every AC listed with evidence | §Shipped acceptance criteria (4 of 4) | true |
| R3 | Rollback rehearsed in staging, same SHA, ≤ 7 days | §Rollback, `5d2e8b0`, 2026-11-27 (3 days before the planned date) | true |
| R4 | Flag defaults off | `flagctl get reports.csvExport --env prod` → `off` (2026-11-27T15:12:31-03:00) | true |
| R5 | Test alert fired once in staging | §Observability, latency 1.2 min | true |
| R6 | Dashboard or query resolves | Grafana › Reports › CSV export showed 4 staging requests (2 × 200, 1 × 403, 1 × 401) at 2026-11-27T14:10-03:00 | true |
| R7 | Runbook current (≤ 90 days) | §Runbook, last verified 2026-11-27 | true |
| R8 | Waivers unexpired | §Waivers: none | n/a — no waivers |
| R9 | No overdue retro | `docs/retros/2026-11-13.md` held on its due date; no retro due before 2026-11-30 | true |

## Go/no-go

| # | Criterion | Evidence | Value |
|---|---|---|---|
| 1 | Every AC has PASS evidence bound to the release fingerprint | §Shipped acceptance criteria; release tree fingerprint `b7e2a91c04d5` = PR evidence fingerprint | true |
| 2 | 0 open Critical; open Important findings accepted with an issue | PR #138 Review triage: F-1 Critical fixed `f66b528`; F-2, F-3 fixed; F-7 rejected on spec text; F-6 Minor → #142 | true |
| 3 | Checklist R1–R9 true for applicable items | §Release checklist | true |
| 4 | Spec alerts live in production | §Observability | true |
| 5 | Every waiver unexpired at the planned date | none | true |

**Verdict:** GO

## Waivers

| ID | Kind (accept risk \| defer \| emergency) | Gate waived | Reason | Owner (≠ requester) | Expiry (≤ 30 days) | Follow-up issue |
|---|---|---|---|---|---|---|
| none | — | — | — | — | — | — |

## Residual risks

- Spec approval residual risk "export error alert untested until staging" — closed by R5 (test alert received in 1.2 min).
- Totals use `.` as the decimal separator (PR finding F-5, declined to judge). The Product Owner kept the spec format; locale-aware export is issue #143. Owner: Product Owner, L. Rocha.
- The `COUNT(*)` before streaming had no index review at production volume; staging p95 for 50,000 rows was 1.9 s (spec limit 3 s). The p95 advance rule above catches a regression. Owner: Tech Lead, D. Okafor.

## Approval

| Approval | Bound to (tag · rehearsal) | Date | Role | Person | Exact words | Evidence reviewed | Residual risks | Decision |
|---|---|---|---|---|---|---|---|---|
| Release | `v2.14.0` · rehearsal 2026-11-27T13:52:40-03:00 | 2026-11-30 | Release Owner | P. Nair | "Yes, release v2.14.0 at 10% this morning and go to 100% if the 24 h window is clean." | §Shipped acceptance criteria, §Rollback rehearsal, §Release checklist, §Go/no-go | F-5 locale format (#143); COUNT(*) index at volume | approved |

## Deploy log

| Stage | Start (ISO) | End (ISO) | Command | Error rate | p95 | Alert | Decision |
|---|---|---|---|---|---|---|---|
| 1 | 2026-11-30T10:02:00-03:00 | 2026-12-01T10:10:00-03:00 | `flagctl set reports.csvExport on --env prod --percent 10` | 0.4% (export 0.3%) | 318 ms | silent | advance |
| 2 | 2026-12-01T10:14:00-03:00 | 2026-12-02T10:20:00-03:00 | `flagctl set reports.csvExport on --env prod --percent 100` | 0.4% (export 0.5%) | 322 ms | silent | closed |

Tag `v2.14.0` pushed 2026-11-30T10:01:00-03:00, after the Release approval and before stage 1. Release closed with no incident. The retro is due by 2026-12-08 (5 business days after 100% on 2026-12-01). The indicator's first reading is due 2026-12-07 (release + 7 days).
