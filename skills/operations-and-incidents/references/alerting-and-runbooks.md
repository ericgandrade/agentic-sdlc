# Alerting and runbooks

Load in Workflow Step 4 (an alert fired), when reviewing the alerts of a released item, or when a runbook is missing, stale or wrong. Contracts: `../../agentic-sdlc/references/release-ops.md` §Observability before release (alert = number + unit + window + channel) and §Runbook (five lines + `Last verified`, ≤ 90 days). Alerts and thresholds are defined in the spec; this file covers how Operate judges them, uses them and proposes changes through Discover.

## 1. Symptom, not cause

An alert pages a person, so it must describe something a user feels and something the person can act on.

| Pages (symptom) | Dashboard only (cause or resource) |
|---|---|
| Error rate of a user-facing endpoint > N% over W min | CPU > 85%, memory > 80% |
| p95 or p99 latency of a user path > N ms over W min | Pod or process restarts |
| Oldest message in a queue > N min | Disk 70% full (page only when time-to-full < 4 h) |
| 0 successful runs of a scheduled job in its period + margin (`0 successful runs in 26 h` for a daily job) | Cache hit rate, GC pauses |
| Successful logins, checkouts or exports drop > N% against the same hour last week | Dependency version drift |

Two urgencies only:

| Urgency | When | Delivery |
|---|---|---|
| Page | User impact now; maps to SEV1 or SEV2 if confirmed | On-call channel + paging tool, acknowledged within the severity window |
| Ticket | Degradation that can wait to the next business day; maps to SEV3 or to no incident | Issue in the tracker, triaged next business day |

## 2. Alert review checklist (per alert, at the first watch reading and at every incident that used it)

| # | Check | Pass when |
|---|---|---|
| A1 | Numeric | Comparator + number + unit + window: `> 2% over 15 min` |
| A2 | Symptom | Describes user-visible impact (table above) |
| A3 | Traced | Names the spec ID and the AC-n it observes |
| A4 | Owned | Channel and owner role match spec §Release & observability |
| A5 | Runbook | Alert text or rule annotation links the runbook section |
| A6 | Live | Rule ID present in the production alert configuration (release notes go/no-go item 4) |
| A7 | Fired once | The test fire in staging was received ≤ 5 min after fire (release checklist R5) |
| A8 | Quiet when healthy | Fired < 3 times in the last 7 days without an incident |

Any failed check → a `from-production` issue that names the check (`A8 failed: reports-export-error-rate fired 4× in 7 days, 0 incidents`). The SRE never edits the rule, its threshold or its window; the fix goes through Discover and, when the threshold is in the spec, a spec revision.

## 3. Alert trend rule (from release-ops §Intake)

Count fires per rule over a rolling 7 days from the alert history. ≥ 3 fires without an incident → open a `from-production` issue with: rule ID, fire times (UTC), value at each fire, what the first check showed each time, and a proposed change (raise the window, change the threshold, delete as non-actionable, or fix the underlying cause). "It self-heals" is a reason to delete or rewrite the alert, never to ignore it.

## 4. Runbook stub (one per alert)

Minimum from release-ops §Runbook, in this order. A runbook section that cannot answer "the alert fired at 03:00 — what do I run first, how do I know the rollback worked, whom do I call?" fails.

```markdown
### <alert rule ID> — <condition with number, unit and window>

- **Means:** <user-visible symptom in one sentence> · spec `<NNN-slug>` · AC-n
- **First check:** <dashboard path and panel>; then `<exact query>`
- **Rollback:** `<one command from spec §Rollback>` — executed by the on-call engineer
- **Verify:** `<verify command>` → <expected output> within <time>
- **Escalation:** <role> in `<channel>`; <next role> after <n> min without mitigation
- **Last verified:** YYYY-MM-DD (<what was executed, where>)
```

Rules:

- `Last verified` moves only when the first check or the rollback was **executed** against staging or production; reading the page does not count.
- Older than 90 days at release → release checklist R7 false → NO-GO (`../../agentic-sdlc/references/release-ops.md`). In Operate, a stale runbook found during a watch reading → `from-production` issue with label `runbook`.
- Every incident that used the runbook ends with a runbook check: each step that was wrong, missing or slower than stated becomes a postmortem action whose target file is the runbook.
- Expand beyond five lines only when the first check cannot decide between two causes; add the deciding query, not prose.

## 5. Worked example — CSV export

```markdown
### reports-export-error-rate — export 5xx / all exports > 2% over 15 min

- **Means:** finance analysts get failed CSV downloads · spec `001-csv-export` · AC-1, AC-4
- **First check:** Grafana › Reports › CSV export, panel "Requests by status";
  then `sum by (status) (rate(reports_export_requests_total[15m]))`
- **Rollback:** `flagctl set reports.csvExport off --env prod` — executed by the on-call engineer
- **Verify:** `curl -s -o /dev/null -w "%{http_code}" https://reports.example.test/api/reports/export` → `404` within 60 s
- **Escalation:** SRE on-call, reports team, in `#reports-oncall`; Tech Lead after 30 min without mitigation
- **Last verified:** 2026-11-27 (rollback rehearsal in staging)
```

Review result at the first watch reading: A1–A7 pass; A8 not yet measurable (5 days of history) → re-check at the next reading. Gap found: the spec's p95 ≤ 3 s constraint has no alert and no signal → `from-production` issue proposing a duration histogram and a ticket-urgency alert `p95 > 3 s over 30 min`; no rule is added from Operate.

## 6. Bad → good

| Bad | Good |
|---|---|
| "Alert when the export service is unhealthy" | "export 5xx / all exports > 2% over 15 min → `#reports-oncall`" |
| Page on CPU > 90% for 5 min | CPU on the dashboard; page on the latency symptom it causes |
| Runbook: "Investigate logs and fix the issue" | First check = named panel + exact query; rollback = one command |
| `Last verified: 2026-11-27` updated after re-reading the page | Updated only after executing the first check or the rollback |
| Raising the threshold in the alerting tool after a noisy night | `from-production` issue with fire times and the A8 result |
