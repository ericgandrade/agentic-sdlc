<!--
Agentic SDLC — release notes. Rules: references/release-ops.md (checklist R1–R9, go/no-go, runbook),
references/governance.md (Release sign-off record, waivers).
The Release Engineer fills every section before the Release sign-off request, then §Deploy log after it.
Every checklist and go/no-go row is true or false with evidence; prose without output counts as false.
A section with nothing to report says "none — <reason>"; never leave it blank. Keep every heading.
Location: the release entry on the host (GitHub/GitLab release) or CHANGELOG.md; §Summary is the
user-facing CHANGELOG text.
-->

# Release notes — <service> v<X.Y.Z>

**Spec:** `specs/<NNN-slug>/spec.md` rev <N> · sha256 `<12 hex>` · **PR:** #<n> (head `<sha>`) · **Path:** <Quick | Standard | Full>
**Release commit:** `<sha>` · **Tag:** `v<X.Y.Z>` (pushed only after Release sign-off) · **Planned date:** <YYYY-MM-DD>
**Release Engineer:** <agent or person> · **Release Owner:** <role, person>

## Summary

<1–3 user-facing lines. No internal IDs except the spec ID.>

## For users

<!-- Written by the Tech Writer (agents/tech-writer.md) when triggered; otherwise the Release Engineer writes "none — no user-visible change". -->

| What changes | Who is affected | Action required | Docs |
|---|---|---|---|
| <behavior in user terms> | <users or roles> | <none, or the step with a link to the migration guide> | <docs page link> |

## Shipped acceptance criteria

| AC | Title | Critical | Evidence (PR Verification row) | Fingerprint | Result |
|---|---|---|---|---|---|
| AC-<n> | <short title from spec> | <yes \| no> | <PR #n · row AC-n · test id> | `<12 hex>` | <PASS \| CANNOT_VERIFY + waiver W-n> |

## Rollout

**Mechanism:** <flag `<name>` (default off) \| stages \| flag + stages> · **Baseline (7 days before stage 1):** error rate <x %> · p95 <y ms> · source <dashboard or query>

| Stage | Exposure | Watch window (≥ release-ops minimum) | Advance if (all) | Roll back if (any) |
|---|---|---|---|---|
| 1 | <1% \| 10% \| internal> | <≥ 30 min> | error rate ≤ baseline + 0.5 pp · p95 ≤ baseline + 10% · spec alert silent | threshold exceeded · spec alert fires · SEV1/SEV2 |
| <n> | 100% | 24 h, then the release closes | same | same |

## Rollback

**Command:** `<rollback command from spec.md>` · **Verify:** `<command that proves the previous behaviour is back>`

**Rehearsal (R3):** environment <staging> · date <YYYY-MM-DD, ≤ 7 days before release> · commit `<same sha as Release commit>`

```text
$ <rollback command>
<output>
exit <code> · <ISO-8601 time>
$ <verify command>
<output>
exit <code> · <ISO-8601 time>
```

## Observability

| Field | Value |
|---|---|
| Signal (AC) | <metric or log event · AC-n> |
| Alert | <condition with number and window> → <channel> |
| Dashboard or query | <location> |
| Owner | <role, person or rotation> |
| Alert live in production (go/no-go 4) | <rule ID or export reference> |
| Test alert fired in staging (R5) | fired <ISO time> · received <ISO time> in <channel> · latency <n> min (≤ 5) |

## Runbook

<link `docs/runbooks/<service>.md` · Last verified YYYY-MM-DD> **or** the inline minimum below (Quick/Standard without a runbook file) **or** `n/a — <reason: no operated-behaviour change>`

- **Alert:** <name and threshold>
- **First check:** <query or dashboard>
- **Rollback:** `<command>`
- **Verify:** `<command>`
- **Escalation:** <role + channel>
- **Last verified:** <YYYY-MM-DD, ≤ 90 days>

## Release checklist

| # | Item | Evidence | Value |
|---|---|---|---|
| R1 | Release commit and tag named | <sha, tag> | <true \| false \| n/a — reason> |
| R2 | Every AC listed with evidence | §Shipped acceptance criteria | <value> |
| R3 | Rollback rehearsed in staging, same SHA, ≤ 7 days | §Rollback | <value> |
| R4 | Flag defaults off | <config line or flag-service output> | <value> |
| R5 | Test alert fired once in staging | §Observability | <value> |
| R6 | Dashboard or query resolves | <screenshot path or query output> | <value> |
| R7 | Runbook current (≤ 90 days) | §Runbook | <value> |
| R8 | Waivers unexpired | §Waivers | <value> |
| R9 | No overdue retro | `docs/retros/` | <value> |

## Go/no-go

| # | Criterion | Evidence | Value |
|---|---|---|---|
| 1 | Every AC has PASS evidence bound to the release fingerprint | §Shipped acceptance criteria | <true \| false> |
| 2 | 0 open Critical; open Important findings accepted with an issue | PR Review triage | <value> |
| 3 | Checklist R1–R9 true for applicable items | §Release checklist | <value> |
| 4 | Spec alerts live in production | §Observability | <value> |
| 5 | Every waiver unexpired at the planned date | §Waivers | <value> |

**Verdict:** <GO | NO-GO — failing items>

## Waivers

| ID | Kind (accept risk \| defer \| emergency) | Gate waived | Reason | Owner (≠ requester) | Expiry (≤ 30 days) | Follow-up issue |
|---|---|---|---|---|---|---|
| <W-n or "none"> | <kind> | <gate> | <reason> | <role, person> | <YYYY-MM-DD> | <#issue> |

## Residual risks

<Each risk the approver accepts, with its owner; or "none".>

## Approval

<!-- Present this file, end the turn, record only an explicit "yes"/"approved" from the Release Owner in a later turn. -->

| Sign-off | Bound to (tag · rehearsal) | Date | Role | Person | Exact words | Evidence reviewed | Residual risks | Decision |
|---|---|---|---|---|---|---|---|---|
| Release | `v<X.Y.Z>` · rehearsal <ISO time> | <YYYY-MM-DD> | Release Owner | <name> | "<quote>" | <sections read> | <list or none> | <approved \| approved with conditions \| rejected> |

## Deploy log

<!-- After Release sign-off only. One row per stage, written at the end of its watch window. -->

| Stage | Start (ISO) | End (ISO) | Command | Error rate | p95 | Alert | Decision |
|---|---|---|---|---|---|---|---|
| <n> | <time> | <time> | `<command>` | <value> | <value> | <silent \| fired> | <advance \| rolled back + incident #n \| closed> |
