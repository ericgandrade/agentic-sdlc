# Agentic SDLC — Release and Operations

Load at Release, when an alert fires, when an incident is reported, or when a production signal must enter Discover. Rules here start in Specify: **observability and rollback are defined before release; Operate monitors what the spec defined, it does not define it.** Lead agents: Release Engineer (`agents/release-engineer.md`) at Release, SRE (`agents/sre.md`) in Operate.

| Section | Mechanism | Trigger | Record |
|---|---|---|---|
| §Observability before release | 12.1 | Specify; re-checked at Release sign-off | `spec.md` §Release & observability |
| §Release checklist | 12.2 | PR approved and merged, production change | Release notes |
| §Go/no-go | 12.3 | Before the Release sign-off request; each rollout stage | Release notes §Go/no-go, §Deploy log |
| §Runbook | K4 | Change alters operated behaviour; every Full release | `docs/runbooks/<service>.md` or release notes §Runbook |
| §Incidents, §Intake | 12.4, 12.5 | Alert, incident report, indicator miss | `docs/postmortems/`, issues labelled `from-production` |

## Observability before release (12.1)

**Artifact:** `spec.md` §Release & observability (`templates/spec.md`). **Trigger:** written in Specify; `spec-lint` checks it before the Specify sign-off request; the Release Engineer re-reads it before the Release sign-off request.

Required fields (Standard and Full):

| Field | Rule | Example (worked example) |
|---|---|---|
| Signal | ≥ 1 log event or metric per behaviour the change adds, named exactly as emitted, tagged with the AC it observes | metric `reports_export_requests_total{status}` · AC-1, AC-4 |
| Alert | Condition with a **numeric threshold and a window**, plus the notification channel | error rate > 2% over 15 min → `#reports-oncall` |
| Dashboard or query | Location that resolves to the signal (URL path or saved query name) | Grafana › Reports › CSV export |
| Owner | Role + person who receives the alert | SRE on-call, reports team |
| Rollout | Feature flag (name, default **off**) or stages 1% → 10% → 100% with the watch window per stage | flag `reports.csvExport`, 10% → 100% |
| Rollback command | One command that restores the previous behaviour; its verify command sits in `spec.md` §Rollback | `flagctl set reports.csvExport off --env prod` |

**Quick path with a production deploy:** one line in the issue or PR body: `Observability: <signal> · rollback: <command>`.

**Decision rule.** "Logs exist", "we will monitor" and an alert without a number fail the field. An alert threshold is a number with a unit and a window (`> 2% over 15 min`, `p95 > 800 ms over 10 min`, `0 successful runs in 26 h`).

**Failure behaviour.** A missing or non-numeric field → `spec-lint` exit 1 → no Specify sign-off request. A field changed after Specify sign-off voids the approval hash → change protocol (`references/rules.md`). At Release, any field missing → NO-GO; no Release sign-off request.

## Release checklist (12.2)

**Artifact:** release notes from `templates/release-notes.md`, written by the Release Engineer; `## For users` by the Tech Writer when triggered. **Trigger:** the PR is approved and merged and the change reaches production. Every item is answered `true` or `false` with evidence pasted or linked; prose claims without output count as `false`.

| # | Item | Evidence required | Applies to |
|---|---|---|---|
| R1 | Release commit and tag named | SHA of the merged commit; tag `vX.Y.Z` prepared, not pushed | all production releases |
| R2 | Every AC-n listed with its evidence | AC table linking each PR Verification row (fingerprint, exit 0) | Standard, Full; Quick lists the issue acceptance test |
| R3 | **Rollback rehearsed in staging** | Release commit deployed to staging, rollback command run, verify command run; command + output + exit code + timestamp pasted; rehearsal ≤ 7 days old and on the same SHA as R1 | all production releases |
| R4 | Flag defaults off | Production flag configuration line or flag-service output showing `off` before stage 1 | changes behind a flag |
| R5 | **Test alert fired once in staging** | The spec's alert rule triggered in staging (forced condition or the monitoring tool's test-fire of the same rule); fire time and receipt time in the owner's channel; receipt ≤ 5 min after fire | Standard, Full; Quick when the change adds or edits an alert |
| R6 | Dashboard or query resolves | Screenshot path or query output showing the staging signal | Standard, Full |
| R7 | Runbook current | §Runbook below: link or inline section, `Last verified` ≤ 90 days | operated-behaviour changes; every Full release |
| R8 | Waivers unexpired | `## Waivers` rows with expiry after the release date (`references/governance.md` §Waivers) | when waivers exist |
| R9 | No overdue retro | No retro past its due date in `docs/retros/` (`references/retrospective.md`) | Standard, Full |

**Failure behaviour.** Any applicable item `false` → verdict NO-GO, the Release Engineer reports `BLOCKED` with the item numbers, and no Release sign-off request is sent. No staging environment → R3 and R5 are `CANNOT_VERIFY`; release proceeds only under an accept-risk waiver signed by the Release Owner (owner ≠ requester, expiry ≤ 30 days, follow-up issue to create staging).

## Go/no-go (12.3)

**Trigger:** the Release Engineer evaluates the criteria before asking for Release sign-off, then again at the end of each rollout stage. **Record:** release notes §Go/no-go (pre-release) and §Deploy log (per stage).

**Pre-release — GO only if all are true:**

1. Every AC-n has PASS evidence bound to the release commit's fingerprint (`references/verification.md`).
2. 0 open Critical findings; every open Important finding has owner acceptance and a follow-up issue.
3. Checklist R1–R9 all `true` for the applicable items.
4. Alerts named in the spec are live in production (rule ID or export of the rule).
5. Every waiver is unexpired at the planned release date.

**Per rollout stage — advance only if, over the stage's watch window:**

| Stage | Exposure | Minimum watch window | Advance if (all) | Roll back if (any) |
|---|---|---|---|---|
| 1 | 1% or internal users | 30 min | error rate ≤ baseline + 0.5 pp · p95 latency ≤ baseline + 10% · spec alert silent | a threshold exceeded · spec alert fires · any SEV1/SEV2 |
| 2 | 10% | 60 min | same | same |
| 3 | 100% | 24 h, then the release closes | same | same |

Baseline = the 7-day value of the same signal before stage 1, read from the spec's dashboard and written into the release notes before deploying. A flag-only change without stages uses stage 3. A spec rollout with other exposures maps each of its stages to the first row whose exposure is equal or higher (5% or 10% → row 2), applies that row's advance and roll-back rules, and watches for the longer of the spec's window and that row's minimum.

**Failure behaviour.** Any pre-release criterion false → NO-GO. A breach during rollout → the Release Engineer runs the rollback command named in the approved release notes immediately (the Release sign-off covers that command), runs the verify command, records both in §Deploy log, opens an incident at SEV2 or higher, and stops. Re-release needs a new go/no-go and a new Release sign-off.

## Runbook (K4)

**Trigger:** the change alters operated behaviour (new or changed endpoint, job, queue consumer, configuration key, flag or alert) on any path; always on Full. **Location:** `docs/runbooks/<service>.md` from `templates/runbook.md`†. On Quick and Standard, when the service has no runbook file, release notes §Runbook holds the runbook and becomes the source of the file at the next Full release.

Minimum content (5 lines): alert name and threshold · first check (query or dashboard) · rollback command · verify command · escalation owner (role + channel). Plus `Last verified: YYYY-MM-DD` = last date the rollback or the first check was executed against staging or production.

**Failure behaviour.** Required and absent, or `Last verified` older than 90 days → checklist R7 `false` → NO-GO.

## Incidents (12.4)

**Trigger:** a spec alert fires, a user report arrives, or a rollout breach occurs. The SRE classifies; the on-call engineer executes every state-changing action.

| Severity | Definition | Acknowledge within | Postmortem |
|---|---|---|---|
| SEV1 | Outage, data loss or exposure, security breach | 15 min | required, ≤ 5 business days |
| SEV2 | Degraded feature, threshold breach, rollback executed | 1 h | required, ≤ 5 business days |
| SEV3 | Minor defect with a workaround | next business day | not required; issue only |

First three actions: (1) acknowledge and name the incident owner; (2) run the runbook first check and record the reading with time; (3) when the runbook or the release notes name a rollback, propose it to the on-call engineer, who executes it. **Record:** `docs/postmortems/YYYY-MM-DD-<slug>.md` from `templates/postmortem.md`† (timeline, impact, causes without naming a person as a cause, ≥ 1 action that changes the environment, owner per action), tagged with the spec ID and AC-n. **Failure behaviour:** postmortem past 5 business days → `status.mjs`† lists it as the next step; incident with an unknown AC → linked to the spec ID and labelled `untraced-requirement`.

## Intake from production (12.5)

**Trigger:** a postmortem action, an alert that fired ≥ 3 times in 7 days without an incident, or an indicator reading below its target. **Rule:** open an issue labelled `from-production` with the spec ID and AC-n, the signal reading and its source; Discover triages it within 2 business days (duplicate search, path score). **Failure behaviour:** untriaged after 2 business days → `status.mjs`† next step.

† Added in a later release; manual fallback in `references/artifacts.md` §Later-release files.

## Sources

Staged rollout, rollback rehearsal and launch-checklist practices adapt Addy Osmani's agent-skills (MIT) shipping guidance; the incident and postmortem shape follows common blameless-postmortem practice. Text is original.
