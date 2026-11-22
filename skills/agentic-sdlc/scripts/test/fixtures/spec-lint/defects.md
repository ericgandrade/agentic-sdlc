# Spec: fixture with one defect per rule

<!-- Fixture for spec-lint.test.mjs. Each defect is tagged with the rule it triggers. -->

| Field | Value |
|---|---|
| ID | 900-defects |
| Revision | 1 |
| Path | Standard |
| Size | S=7 · files 3 + components 2 + iterations 2 |
| Risk | R=0 · none |
| Owner | Product Owner · A. Example |
| Issue | #900 |
| Intake | n/a — no duplicate found |

## Problem

Admins rebuild the search index by hand. The rebuild must be fast. <!-- V01 -->

## Users

- **Admin** — holds `search:admin`.

## Stories

- As an admin, I want a rebuild button, so that the index stays current.

## Acceptance criteria

| ID | Criterion | Priority |
|---|---|---|
| AC-1 | Given an admin, when they click Rebuild, then a rebuild job starts within 5 s. | critical |
| AC-3 | Given a rebuild running, when Rebuild is clicked again, then the button is disabled. | normal |

## Non-goals

The rebuild schedule is excluded. <!-- NG01: prose, no bullet -->

## Constraints

- **Never:** rebuild during business hours.

## Security notes

| Topic | Notes |
|---|---|
| Data classes | internal |
| Authentication and authorization | `search:admin` only |
| Inputs | none |
| Secrets | none |

## Rollback

1. Command: `flagctl set search.rebuild off`
2. Verify: `flagctl get search.rebuild` returns `off`.

## Release & observability

| Item | Value |
|---|---|
| Signal | metric `search_rebuild_total` · AC-1 |
| Alert | rebuild failures are high → `#search-oncall` |
| Dashboard or query | Grafana › Search |
| Owner | SRE on-call · B. Example |
| Rollout | flag `search.rebuild`, default off |
| Rollback command | `flagctl set search.rebuild off` |

## Indicator

| Indicator | Baseline | Target | Method | First reading |
|---|---|---|---|---|
| Manual rebuilds | 12/month | 0/month | ops log count | Release + 30 days |

## Open questions

- Which team owns the rebuild job?

## Revision log

| Rev | Date | Change | Requested by | Critique |
|---|---|---|---|---|
| 1 | 2026-11-20 | First draft | Product Owner | none |

## Approvals
