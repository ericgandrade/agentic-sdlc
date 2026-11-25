# Spec: Self-service export of personal account data

<!--
Example 3 of 3 (synthetic) — a Full-path, regulated, personal-data feature. Two risk triggers
(personal data, regulated) route it to Full regardless of size; threat-model.md is mandatory (TM01),
ux.md covers the settings page, email and download states, and Security notes carry the compliance
obligations table from skills/agentic-sdlc/references/security.md § Compliance.
Check: node skills/agentic-sdlc/scripts/spec-lint.mjs skills/spec-driven-development/examples/052-account-data-export/spec.md
-->

| Field | Value |
|---|---|
| ID | 052-account-data-export |
| Revision | 1 |
| Path | Full |
| Size | S=7 · files 3 + components 2 + iterations 2 |
| Risk | R=2 · personal data, regulated |
| Owner | Product Owner · S. Varga |
| Issue | #1550 |
| Intake | prior rejection #902 — rejected in 2025 for lack of an async job runner; the runner shipped in spec 040, so the blocker is gone |

## Problem

EU customers exercise their right of access (GDPR Art. 15) and data portability (Art. 20) by emailing support. In Q3 2026 support handled 212 requests by hand, at a median of 38 minutes each, and 9 requests missed the one-month legal deadline. Each manual export is assembled by an engineer with production read access, which the data protection officer (DPO) flagged as an audit finding (AF-2026-14).

## Users

- **Account holder** — any signed-in customer; requests and downloads an archive of their own personal data.
- **Data protection officer** — owns the Art. 15/20 process, the retention rule and the audit trail.
- **Support agent** — answers questions about exports; never sees archive contents.
- **SRE on-call (accounts team)** — receives job failure and deadline alerts.

## Stories

- As an account holder, I want to request an archive of my personal data from the privacy settings page, so that I receive it without contacting support.
- As an account holder, I want the download link to work only for me and only for 7 days, so that nobody else can read my data.
- As a data protection officer, I want every request, delivery and download recorded in the audit log, so that I can prove each request was answered within one month.
- As a support agent, I want to see the status of a customer's export without seeing its contents, so that I can answer "where is my export" tickets.

## Experience

`ux.md` rev 1 — surfaces: the "Download your data" panel on the privacy settings page, the "archive ready" email, the download page and the support-console status line. States UX-1..UX-8 map to AC-1..AC-9 or to the design-system pattern named in their row.

## Acceptance criteria

| ID | Criterion | Priority |
|---|---|---|
| AC-1 | Given a signed-in account holder with no export in progress, when they select "Request archive" and re-enter their password, then an export job is queued and the panel shows "Preparing your archive — we will email you when it is ready". | critical |
| AC-2 | Given a queued export for an account with up to 50,000 records across the 6 data domains listed in Constraints, when the job runs, then a ZIP archive with one JSON file per domain and a README is ready within 24 h. | critical |
| AC-3 | Given a completed archive, when its content is compared with the data map entry for the account, then every field classed as personal data in data map v3 is present and no field of any other account appears. | critical |
| AC-4 | Given a ready archive, when the account holder opens the emailed link while signed in as the same account, then the download starts; when anyone else opens it, then HTTP 404 is returned and the attempt is logged. | critical |
| AC-5 | Given an archive created 7 days ago, when the retention job runs, then the archive file and its download link are deleted and a later request to the link returns HTTP 410. | critical |
| AC-6 | Given an account with an export requested in the last 24 h, when the holder requests another, then no job is queued and the panel shows the time the next request is allowed. | normal |
| AC-7 | Given any export, when it is requested, completed, downloaded, expired or fails, then one audit event with account ID, actor, event type and UTC timestamp is written to the audit log, with no archive content. | critical |
| AC-8 | Given an export job that fails 3 times, when the third failure is recorded, then the request is placed in the DPO manual queue, the holder is emailed "We are preparing your archive by hand; you will hear from us within 7 days", and an alert fires. | critical |
| AC-9 | Given a support agent viewing an account, when an export exists, then the console shows status and dates only, and a direct request for the archive with a support token returns HTTP 403. | critical |
| AC-10 | Given the privacy settings panel and the download page, when tested with keyboard only and with a screen reader, then every action is reachable and every status change is announced (WCAG 2.2 AA). | normal |

## Non-goals

- Account deletion (Art. 17) — separate spec 053.
- Exports for business accounts with multiple users.
- Machine-to-machine transfer to another controller (Art. 20(2)).
- Data held only in backups older than 35 days.

## Constraints

- **Always:** build the archive from data map v3, domains: profile, addresses, orders, payment metadata (last 4 digits and expiry only), support tickets, marketing preferences; encrypt archives at rest with the storage service key; process inside the EU region `eu-west-1`.
- **Ask first:** adding a data domain or a field not in data map v3; any third-party processor for archive delivery.
- **Never:** use production personal data in tests or fixtures; write archive content, email bodies or download tokens to logs; email the archive as an attachment.
- Capacity: 1,000 export jobs per day with a queue depth alert at 500 waiting jobs.
- Legal deadline: every request answered within 30 days, measured from the request audit event.

## Security notes

| Topic | Notes |
|---|---|
| Data classes | Personal data (identity, contact, order history, support messages); payment metadata limited to last 4 digits and expiry; no special-category data in data map v3 |
| Authentication and authorization | Request needs a session plus password re-entry (AC-1); download needs a session for the same account plus a single-use token (AC-4); support role has status-only access (AC-9) |
| Inputs | No free-text input; the request is a button press; the download token is 32 random bytes, compared in constant time |
| Secrets | Storage encryption key in the KMS key `accounts/export-archive`; email provider API key in the existing secret `notify/api-key` |

| Obligation | Clause | Control | AC-n or task | Evidence |
|---|---|---|---|---|
| Right of access | GDPR Art. 15(1), 15(3) | Self-service archive of all personal data in data map v3 | AC-2, AC-3 | Archive diff test against the data map fixture |
| Data portability | GDPR Art. 20(1) | Structured, machine-readable JSON per domain | AC-2 | Schema test of each JSON file |
| Response time | GDPR Art. 12(3) | 24 h job target, 30-day deadline alert, manual fallback | AC-2, AC-8 | Deadline dashboard; alert test in staging |
| Security of processing | GDPR Art. 32 | Encryption at rest, owner-only download, 7-day deletion | AC-4, AC-5 | Threat model TH-1..TH-4; deletion job test |
| Accountability | GDPR Art. 5(2) | Audit event per lifecycle step, no content | AC-7 | Audit log query in the release checklist |

## Rollback

1. Command: `flagctl set accounts.dataExport off --env prod`
2. Verify: `curl -s -o /dev/null -w "%{http_code}" -b "$TEST_SESSION" https://app.example.test/api/account/export` returns `404` within 60 s, and the privacy settings panel no longer shows "Download your data".
3. Data: queued jobs stop; archives already created keep their 7-day deletion (the retention job is not behind the flag); open requests move to the DPO manual queue with `exportctl requeue --to manual --all-open`.

## Release & observability

| Item | Value |
|---|---|
| Signal | metric `export_jobs_total{status}` · AC-2, AC-8; metric `export_job_duration_seconds` · AC-2; metric `export_download_denied_total` · AC-4, AC-9; audit event count by type · AC-7 |
| Alert | `export_jobs_total{status="failed"}` / all jobs > 5% over 60 min → `#accounts-oncall`; any open request older than 25 days → DPO and `#accounts-oncall` |
| Dashboard or query | Grafana › Accounts › Data export (jobs, duration, denials, open requests by age) |
| Owner | SRE on-call, accounts team · K. Mensah; DPO for the deadline alert |
| Rollout | flag `accounts.dataExport`, default off; stages 1% → 10% → 100% of EU accounts, 48 h watch per stage |
| Rollback command | `flagctl set accounts.dataExport off --env prod` |

## Indicator

| Indicator | Baseline | Target | Method | First reading |
|---|---|---|---|---|
| Access requests handled by hand | 212 requests/quarter (Q3 2026) | ≤ 20 requests/quarter | Support tag `gdpr-access`, quarterly count | Release + 30 days, then quarterly |
| Counter-metric: requests answered after 30 days | 9 requests/quarter | 0 requests/quarter | Audit log query: request event without completion within 30 days | Release + 30 days |

## Open questions

- Should the archive include inferred marketing segments? deferred: DPO — legal review of data map v4 in Q1 2027; out of this revision because data map v3 excludes them.

## Revision log

| Rev | Date | Change | Requested by | Critique |
|---|---|---|---|---|
| 1 | 2026-11-24 | First draft from issue #1550, DPO finding AF-2026-14 and data map v3 | Product Owner | fresh-context · 12/12 · 4 fixed (support access AC-9, failure path AC-8, payment field limit, 410 after expiry), 0 open |

## Approvals

| Sign-off | Rev | Hash | Date | Role | Person | Exact words | Evidence reviewed | Residual risks | Decision |
|---|---|---|---|---|---|---|---|---|---|

### Waivers

| ID | Kind | Gate waived | Severity | Reason | Requester | Owner | Granted | Expires | Follow-up |
|---|---|---|---|---|---|---|---|---|---|
