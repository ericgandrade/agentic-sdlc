<!--
Agentic SDLC — service runbook. Rules: references/release-ops.md §Runbook (K4) and checklist R7;
on-call use: references/release-ops.md §Incidents.
Required when a change alters operated behaviour (new or changed endpoint, job, queue consumer,
configuration key, flag or alert) on any path, and on every Full release. The Release Engineer updates
it before the Release sign-off request; the SRE uses it in Operate.
Last verified = the last date the rollback or the first check was EXECUTED against staging or production.
Editing the date without running a check is not verification. Older than 90 days on the planned release
date → R7 false → NO-GO.
Write for a tired reader at 03:00: exact rule names, numbers with units and windows, commands that paste.
A section with nothing to report says "none — <reason>"; never leave it blank. Keep every heading.
Location: docs/runbooks/<service>.md. On Quick and Standard without this file, the release notes
§Runbook holds the minimum five lines and becomes the source of this file at the next Full release.
-->

# Runbook — <service>

**Owner:** <team · role · channel> · **Last verified:** <YYYY-MM-DD> by <person or agent> (<what ran: rollback rehearsal | first check>, <staging | production>) · **Next verification due:** <Last verified + 90 days>

## Overview

<2–4 lines: what the service does, who depends on it, what breaks for users when it fails.>

| Item | Value |
|---|---|
| Dependencies | <databases, queues, external APIs> |
| Dashboards | <name → path or URL> |
| Logs | <saved query or command> |
| Flags and config keys | <name · default · where it is set> |

## Alerts

One row per alert. Rule names match the alerting system exactly; thresholds carry unit and window.

| Alert (rule ID) | Condition | Channel | First check (query or panel) | "This change is the cause" when | Action |
|---|---|---|---|---|---|
| `<rule-id>` | <metric> > <n><unit> over <window> | <#channel> | <query or panel> | <reading> | <§Rollback, or the mitigation> |

## Rollback

```bash
<rollback command, verbatim from the spec>
```

**Verify:**

```bash
<verify command>
# expected: <output>
```

**Expected time to verified:** <seconds or minutes, from the last rehearsal> · **Data:** <what happens to data written while the change was live> · **Who executes:** <on-call engineer; agents propose, humans run state-changing commands>

## Escalation

| After | Escalate to (role) | Channel |
|---|---|---|
| <n> min without mitigation | <role> | <channel> |
| SEV1 (outage, data loss or exposure, security breach) | <role> | <channel> |

## Change log

Append one row per release that changes operated behaviour; never delete a previous row without a reason here.

| Release | Date | Spec · AC | Operational change |
|---|---|---|---|
| v<X.Y.Z> | <YYYY-MM-DD> | `specs/<NNN-slug>` · AC-<n> | <alert added, flag added, job changed> |

## Verification log

One row per executed check. The latest row sets **Last verified** in the header.

| Date | By | Environment | What ran | Commit | Result |
|---|---|---|---|---|---|
| <YYYY-MM-DD> | <person or agent> | <staging | production> | <rollback rehearsal | first check> | `<sha>` | <verified in <n> s | failed: <reason>> |
