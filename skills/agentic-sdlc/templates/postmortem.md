<!--
Agentic SDLC — postmortem. Rules: references/release-ops.md §Incidents; procedure: skill operations-and-incidents.
Location: docs/postmortems/YYYY-MM-DD-<slug>.md (date = incident start, UTC).
Required for SEV1 and SEV2; due ≤ 5 business days after the incident is restored. SEV3 → issue only.
Drafted by the SRE agent from the timeline and the evidence; reviewed and owned by named humans.
Blameless: describe systems, conditions and decisions; never name a person as a cause.
Times in UTC, minute precision. A section with nothing to report says "none — <reason>"; never leave it blank. Keep every heading.
-->

# Postmortem — <short title of the user impact>

**Severity:** <SEV1 | SEV2> · **Status:** <draft | in review | final> · **Incident window (UTC):** <YYYY-MM-DDTHH:MMZ> → <YYYY-MM-DDTHH:MMZ>
**Spec:** `specs/<NNN-slug>` · **AC:** <AC-n, … | untraced-requirement> · **Release:** <vX.Y.Z> · **Service:** <name>
**Incident commander:** <role, person> · **On-call engineer:** <role, person> · **Communications:** <role, person>
**Drafted by:** <SRE agent, date> · **Due:** <YYYY-MM-DD (≤ 5 business days after restore)> · **Reviewed:** <YYYY-MM-DD, by role, person>

## Summary

<!-- 3–5 sentences: what users experienced, for how long, what restored service, the main cause in system terms. -->

<summary>

## Impact

| Measure | Value | Source |
|---|---|---|
| Users or accounts affected | <n or "unknown — <reason>"> | <query> |
| Duration of user impact | <h:mm, impact start → restored> | §Timeline |
| Failed requests or jobs | <n of n> | <query> |
| Data lost, corrupted or exposed | <none \| description and scope> | <query or audit> |
| Error budget consumed (28-day SLO) | <n% of budget> | `specs/<NNN-slug>/ops.md` |
| Acceptance criteria affected | <AC-n: how> | spec |

## Detection

<!-- How the incident was detected (spec alert, user report, rollout watch), time to detect (impact start → first signal), and whether the spec alert fired as designed. -->

| Item | Value |
|---|---|
| First signal | <alert rule ID \| user report \| rollout watch> at <HH:MMZ> |
| Time to detect | <min> |
| Time to acknowledge | <min> (window: SEV1 15 min · SEV2 1 h) |
| Alert worked as specified | <yes \| no — <why>> |

## Timeline (UTC)

<!-- Copied from the incident channel; one event per row; decisions name the role that decided; corrections are new rows. -->

| Time (UTC) | Event | Source | Actor (role) |
|---|---|---|---|
| <YYYY-MM-DDTHH:MMZ> | <event> | <alert history \| command output \| channel> | <role> |

## Root cause and contributing factors

<!-- Root cause = the condition without which the incident would not have happened. Contributing factors = conditions that made it likelier, larger or longer.
Each line carries one cause tag: spec-gap · design-gap · test-gap · review-miss · security · dependency · env · ops-signal · process · tooling.
Each line cites evidence (commit, query, file:line, log line). No person is a cause. -->

| # | Kind | Description (system terms) | Cause tag | Evidence | Seen before (≤ 90 days) |
|---|---|---|---|---|---|
| RC-1 | root cause | <condition> | <tag> | <evidence> | <none \| docs/retros/… or docs/postmortems/…> |
| CF-1 | contributing | <condition> | <tag> | <evidence> | <none \| …> |

## What went well

- <practice or control that limited impact, with evidence>

## What went poorly

- <gap in detection, response, tooling or documentation, with evidence>

## Action items

<!-- ≥ 1 action changes the environment (a test, CI check, alert, runbook, configuration, code or AGENTS.md block), not "be more careful".
Each action: one owner (role + person), a due date, the file it changes, and a from-production issue.
Close with a merged commit that changes the target file and carries "Refs: PA-YYYYMMDD-n".
A cause tag seen in 2 retros or postmortems within 90 days → ≥ 1 action is an automated control approved by a person ≠ proposer (references/retrospective.md §Recurrence). -->

| ID | Action | Kind (prevent \| detect \| mitigate) | From | Owner (role, person) | Due | Target file | Issue (`from-production`) | Control approved by (recurrence only) | Status |
|---|---|---|---|---|---|---|---|---|---|
| PA-<YYYYMMDD>-1 | <verb phrase> | <kind> | <RC-n \| CF-n> | <role, person> | <YYYY-MM-DD> | `<path>` | <#n> | <n/a \| person ≠ proposer> | open |

## Links

| Item | Link |
|---|---|
| Spec and AC | `specs/<NNN-slug>/spec.md` · <AC-n> |
| Ops record | `specs/<NNN-slug>/ops.md` |
| Release notes and deploy log | <path or URL> |
| Runbook section used | `docs/runbooks/<service>.md#<alert>` or release notes §Runbook |
| Dashboard or query | <from spec §Release & observability> |
| Hotfix or revert commits | <SHA list \| none> |
| Waivers used | <emergency waiver ID \| none> |

## Validity

- [ ] Every timeline row in UTC; decision rows name a role
- [ ] No person named as a cause anywhere in the document
- [ ] Root cause and every contributing factor carry a cause tag and evidence
- [ ] ≥ 1 action changes the environment; every action has an owner, a due date, a target file and a `from-production` issue
- [ ] Recurring cause tag (2 hits in 90 days) answered by an automated control approved by a person ≠ proposer
- [ ] Spec ID and AC-n linked, or `untraced-requirement` stated
- [ ] Reviewed by the incident commander on or before the due date
