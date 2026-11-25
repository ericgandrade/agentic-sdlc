# Incident response

Load in Workflow Step 5, when an alert is confirmed as user impact, a user report arrives, or a rollout breach occurs. Contract: `../../agentic-sdlc/references/release-ops.md` §Incidents (SEV1–SEV3, acknowledgement windows, first three actions, postmortem due date). The SRE agent classifies, records and proposes; the **on-call engineer executes every state-changing action**; a named human owns the incident.

## 1. Severity

SEV1–SEV3 are the module's incident severities, unchanged. SEV4 is this skill's label for a signal that is **not an incident**; it exists so that near misses are recorded instead of forgotten.

| Severity | Definition | Examples | Acknowledge within | Status updates | Postmortem |
|---|---|---|---|---|---|
| SEV1 | Outage, data loss or exposure, security breach | Export returns another tenant's rows; reports page down for all users | 15 min | every 30 min until restored | required, ≤ 5 business days |
| SEV2 | Degraded feature, threshold breach, rollback executed | Export 5xx at 6% over 15 min; rollout stage rolled back | 1 h | every 60 min until restored | required, ≤ 5 business days |
| SEV3 | Minor defect with a workaround | Exported dates use the wrong time zone; re-export with a filter works | next business day | on the issue at each state change | not required; issue only |
| SEV4 (not an incident) | No user impact: alert fired and cleared inside its window, a near miss caught before users, a cosmetic log error | One fire at 2.1% that cleared in the next window; first check shows no failed user requests | reviewed next business day | none | none; one row in `ops.md` §Alerts; counts toward the alert trend rule |

Classification rules:

- Classify on **user impact observed**, not on the cause or the effort to fix.
- When unsure between two levels, take the higher one; downgrade later with a timeline entry stating why.
- A rollback executed during rollout is at least SEV2 (module rule).
- Personal or financial data exposure is SEV1 whatever the volume; the Security Auditor is added to the incident.
- An incident whose AC is unknown links to the spec ID and is labelled `untraced-requirement`; no spec at all → link the service and the release tag, and label the same way.

## 2. Roles

| Role | Who | Does | Never |
|---|---|---|---|
| Incident commander (incident owner) | A named human; by default the on-call engineer until handed over | Decides actions, names the other roles, declares restored and closed | Executes long investigations while commanding a SEV1 (hands that to another engineer) |
| On-call engineer | The human holding the production grant for the service (spec §Release & observability Owner row) | Executes rollback, restart, flag flip, data fix; reads results aloud into the timeline | Executes a destructive action without saying the command first |
| Communications | A named human (SEV1: separate person; SEV2: may be the incident commander) | Posts status updates on the cadence, internal channel and, when users are affected, the status page | Speculates on cause in external updates |
| SRE agent | This skill | Classifies, keeps the timeline, runs read-only queries from the runbook, proposes the next action with its command, drafts updates and the postmortem | Runs any state-changing command; owns the incident or an action; names a person as a cause |
| Security Auditor agent | Added for SEV1 data exposure or security breach | Scope of exposure, containment proposals | Same limits as the SRE agent |

One-person team: the same person is incident commander, on-call engineer and communications; the SRE agent still keeps the timeline and still never executes.

## 3. First three actions (module order, with formats)

1. **Acknowledge and name the owner.** Timeline row: `HH:MMZ · acknowledged · incident commander <role, person>`. No acknowledgement inside the window → page the owner's backup, then the Tech Lead; record each page.
2. **Run the runbook first check.** Paste the query, the reading and the time: `HH:MMZ · first check · <query> → <value> (threshold <n>)`. No runbook → the dashboard or query from spec §Release & observability, and a postmortem action to write the runbook.
3. **Propose the rollback when one is named.** Write the exact command from the runbook or release notes and ask: "Proposed: `flagctl set reports.csvExport off --env prod`. Run it?" The on-call engineer runs it and pastes the output; the SRE agent then proposes the verify command the same way.

**Mitigate before diagnosing.** When a rollback exists, the default proposal is to roll back first and find the cause afterwards. Diagnosis that delays an available rollback on a SEV1 or SEV2 needs the incident commander's explicit decision in the timeline.

## 4. When no rollback exists — hotfix

A code fix during an incident runs as a Quick-path item: an issue with the acceptance test that reproduces the failure, a test-first commit, the `sdlc-dod` commands green, and a human reviewer. Approvals that cannot wait use an `emergency` waiver (`../../agentic-sdlc/references/governance.md` §Waivers: expiry ≤ 7 days, retroactive normal approval ≤ 2 business days, owner ≠ requester). Debugging the cause follows `systematic-debugging`. The hotfix commit message carries `hotfix` so the change-failure query finds it (`dora-metrics.md`).

## 5. Timeline

Location: the incident channel while live; copied verbatim into the postmortem. Times in UTC, minute precision, `YYYY-MM-DDTHH:MMZ` for the first row of each day and `HH:MMZ` after it.

| Time (UTC) | Event | Source | Actor (role) |
|---|---|---|---|
| 2026-12-10T03:12Z | Alert `reports-export-error-rate` fired: 6.1% over 15 min | alert history | monitoring |
| 03:19Z | Acknowledged; incident commander on-call engineer, M. Silva; SEV2 | `#reports-oncall` | on-call engineer |
| 03:21Z | First check: 5xx 88 of 1,440 exports in 15 min; all `statement timeout` | runbook query | SRE agent |
| 03:23Z | Proposed rollback `flagctl set reports.csvExport off --env prod` | timeline | SRE agent |
| 03:24Z | Rollback executed, exit 0 | command output | on-call engineer |
| 03:25Z | Verify: `404` in 9 s | verify command | on-call engineer |
| 03:40Z | One full alert window (15 min) with 0 export traffic, reports API 0.4% | dashboard | SRE agent |
| 03:41Z | Declared restored (feature off) | `#reports-oncall` | incident commander |

Rules: one event per row; facts and commands, not opinions; every decision row names the role that decided; corrections are new rows, never edits.

## 6. Communication

| Severity | Internal (spec alert channel) | External (status page or customer channel) |
|---|---|---|
| SEV1 | Within the acknowledgement window, then every 30 min | Within 30 min of acknowledgement when users can see the impact; every 60 min; final note at restore |
| SEV2 | Within the acknowledgement window, then every 60 min | When the degraded feature is user-visible: once at start, once at restore |
| SEV3 | Issue comments at each state change | Not required |

Update format (drafted by the SRE agent, posted by Communications):

```text
[SEV2 · reports CSV export · update 2 · 04:00Z]
Impact: CSV export unavailable for finance analysts since 03:24Z (feature switched off). Reports pages unaffected.
Done: export switched off at 03:24Z, verified 03:25Z.
Next: cause analysis on the export query; next update 05:00Z or earlier on change.
Owner: incident commander, on-call engineer M. Silva.
```

No cause in external updates until the postmortem is reviewed; no names of people anywhere.

## 7. Shift change and handover

At a shift change during a live incident the outgoing incident commander posts: current severity, impact now, actions in flight with their commands, the next planned action, the next update time. The incoming commander replies "I have command" in the channel; the timeline records both rows. No reply → the outgoing commander keeps command.

## 8. Restored and closed

| State | Criteria |
|---|---|
| Restored | The alerting signal is inside its threshold for ≥ 1 full alert window after mitigation, the verify command output is recorded, and user impact has stopped |
| Closed | Restored, plus: each open action has an owner (role + person), the postmortem file exists with its due date (SEV1/SEV2) or the SEV3 issue exists, `ops.md` §Incidents has the row, and every `from-production` issue is opened |

An incident is never closed with an unowned action (`../../agentic-sdlc/agents/sre.md` §Never).

## 9. Bad → good

| Bad | Good |
|---|---|
| "Ran the rollback for you, it looked stuck" (agent) | "Proposed: `<command>`. Run it?" — the on-call engineer runs it and pastes the output |
| "SEV3, only a few users complained" while the export returns 5xx at 6% | SEV2: degraded feature, threshold breach |
| Timeline in local time with gaps | UTC, minute precision, one event per row, decision rows name the role |
| "Restored" when the graph looks better | Signal inside threshold for one full window + verify output |
| "A. Mendes pushed a bad query" | "The export query ran a full `COUNT(*)` without an index at production volume" |
