---
name: operations-and-incidents
description: This skill should be used when a released change must be watched in production, the Release Engineer asks for a rollout-stage signal reading, the first indicator reading is due, an alert fires, an incident is reported or must be classified, a blameless postmortem is due, SLOs and error budgets must be derived from the spec, DORA delivery metrics must be computed, or production learning must become new from-production issues (the Operate stage of the Agentic SDLC). Not for owning the rollout decision, deploy log or rollback (use deployment-pipeline), a code-level root cause (use systematic-debugging), the team retro or the outcome verdict on an indicator (use retrospective), or intake of the issues it opens (use issue-triage).
license: MIT
---

# Operations and Incidents

## Purpose

Agentic SDLC · Operate stage. Used by the **SRE** agent (`../agentic-sdlc/agents/sre.md`); the **on-call engineer** (a human) executes every state-changing production action; the **Product Manager** reads the outcome indicator; the **Scrum Master** facilitates the retro with the production facts this skill supplies.

The skill keeps a released change honest after it ships. It derives service levels from what the spec already approved, watches them through a defined period, turns an alert into a classified incident with a UTC timeline, drafts a blameless postmortem with owned actions, computes delivery metrics from git and the release history, and sends every lesson back to Discover as an issue labelled `from-production`.

Contract that this skill never overrides: `../agentic-sdlc/references/release-ops.md` (§Observability before release, §Go/no-go watch windows, §Runbook, §Incidents, §Intake), `../agentic-sdlc/references/lifecycle.md` §6–7, `../agentic-sdlc/references/retrospective.md`. One rule governs everything below: **Operate monitors what the spec defined; it does not define it.** A new alert, threshold or SLO target found useful in production is a proposal that goes through Discover and a spec revision.

Records produced:

| Record | Template | When |
|---|---|---|
| `specs/NNN-slug/ops.md` | `../agentic-sdlc/templates/ops-record.md` | Every released Standard or Full item; first indicator reading ≤ 7 days after release |
| Incident timeline (UTC) | `references/incident-response.md` §5 | Every SEV1–SEV3 incident |
| `docs/postmortems/YYYY-MM-DD-<slug>.md` | `../agentic-sdlc/templates/postmortem.md` | SEV1 and SEV2, ≤ 5 business days after restore |
| Issues labelled `from-production` | Step 7 format | Postmortem action, alert trend, indicator miss, SLO gap |
| Production facts + DORA rows for the retro | `../agentic-sdlc/templates/retro.md` §Facts | Before each retro |

## When to Use

- The last rollout stage closed and the Release Engineer handed the release to Operate.
- A rollout stage is in its watch window and the Release Engineer asks for a signal reading (advance, hold or roll back).
- A spec alert fired, a user reported a failure, or a rollout breached a threshold.
- An incident needs a severity, an owner, a timeline, status updates or a close decision.
- A SEV1 or SEV2 postmortem is due, or an existing one must be checked for blame or missing owners.
- The first indicator reading is due (release + 7 days) or overdue (14 days → trace-check† WARN).
- An alert keeps firing without incidents, or a runbook is stale.
- A retro is coming and needs production facts and DORA metrics.

**Not for:**

- Defining the signal, alert, rollout or rollback of a new change → `spec-driven-development` (Specify).
- Release notes, the runbook at release, checklist R1–R9, go/no-go and the Release sign-off → `shipping-and-handover`; pipeline gates and deployment strategies → `deployment-pipeline`.
- Finding the root cause of a bug in code with a reproducible red loop → `systematic-debugging` (an incident hands off to it once service is restored or a hotfix is needed).
- Running the retro meeting and its action rule → the `retrospective` skill and `../agentic-sdlc/references/retrospective.md`; this skill supplies its facts.
- Triage of the `from-production` issues it opens → `issue-triage` (Discover).

## Workflow

### Step 0 — Discovery and mode

Read before acting; never from memory.

1. Find the item: `specs/*/spec.md` whose release notes §Deploy log has a closed final stage, or the spec named in the alert or report. Run `node ../agentic-sdlc/scripts/spec-lint.mjs specs/NNN-slug/spec.md --json`; rule `OBS01`, `OBS02` or `IND01` failing means the spec lacks observability or an indicator → status `NEEDS_CONTEXT`, open a `from-production` issue, and continue with what exists.
2. Read `specs/NNN-slug/ops.md` (absent on a fresh release → Step 1 creates it), the release notes (§Rollout baseline, §Deploy log, §Runbook, §Residual risks), `docs/runbooks/<service>.md` when present, the last 90 days of `docs/postmortems/` and `docs/retros/`, and open issues labelled `from-production`.
3. Confirm signal access: run the first query named in the runbook or spec. No access → `BLOCKED` with the missing grant named; the source exists but is down → `CANNOT_VERIFY` with who will measure it and when.
4. Pick the mode:

| Situation | Mode | Steps |
|---|---|---|
| Release handed over, no `ops.md` | Open | 1 → 2 → 3 |
| Rollout stage running, reading requested | Rollout read | 3 (stage table only) |
| Watch reading or indicator due | Watch | 3 → 7 |
| Alert fired or user report | Alert | 4 → 5 when it is an incident |
| Incident live | Incident | 5 |
| SEV1/SEV2 restored | Postmortem | 6 → 7 |
| Retro due | Learn | 8 → 7 |

### Step 1 — Open the ops record

Create `specs/NNN-slug/ops.md` from `../agentic-sdlc/templates/ops-record.md`. Copy, never retype from memory:

- Production links: one row per shipped AC → signal → alert rule ID → dashboard → owner, from the handover lines in the release notes. An AC without a signal is `no signal — indicator only` or `untraced`.
- Due dates: first indicator reading = release date + 7 days; retro = 5 business days after the final stage closed.
- Header: spec revision and hash, release tag, release date, release-closed date, alert channel, owner.

### Step 2 — Derive SLIs, SLOs and error budgets

Load `references/slo-from-spec.md`. For each spec signal that observes an AC:

1. SLI = `good / eligible` with the exact query from the spec or runbook. Expected rejections (a 403 that an AC requires) are not bad events.
2. SLO floor = the spec alert threshold inverted (`> 2% over 15 min` → `≥ 98% over 28 days`), or a numeric spec constraint (`p95 ≤ 3 s`). Mark the origin: `derived from alert` or `derived from constraint`.
3. A constraint without an emitted signal → `not measured — no signal` plus a `from-production` issue proposing the signal. Never fill the gap with staging numbers or a guess.
4. Error budget = `(1 − SLO) × eligible events`; burn rate = `bad ratio ÷ (1 − SLO)`. State: `healthy` (> 20% left) · `low` (0–20%) · `exhausted` (< 0) · `burning` (burn rate ≥ 2 over 24 h) · `low volume` (< 100 eligible events: report counts, not percentages).
5. Budget state is advice to the Product Owner and the Tech Lead, never a gate this skill enforces.

The outcome indicator in spec §Indicator is not an SLO. It is read on its own cadence and judged by the Product Manager.

### Step 3 — Watch period

Two windows, two owners:

**Rollout stages (Release stage; the Release Engineer decides).** Read the signals over each stage's watch window against the release-notes baseline (7-day value before stage 1), using the module table:

| Stage | Exposure | Minimum watch | Advance if (all) | Roll back if (any) |
|---|---|---|---|---|
| 1 | 1% or internal | 30 min | error rate ≤ baseline + 0.5 pp · p95 ≤ baseline + 10% · spec alert silent | a threshold exceeded · spec alert fires · any SEV1/SEV2 |
| 2 | 10% | 60 min | same | same |
| 3 | 100% | 24 h, then the release closes | same | same |

Report one of three readings: **advance** (all advance conditions shown with numbers), **roll back** (any roll-back condition, with the reading), or **hold** (no roll-back condition, but an advance condition cannot be shown — too little traffic, a panel not loading, a reading not yet covering the window). Hold keeps the current exposure and extends the window by one more minimum window; it never becomes advance by default. The Release Engineer runs the approved rollback on a breach; this skill only reads and reports.

**Operate watch (this skill).** From release closed to the first indicator reading:

- Read each SLI at least at release closed + 24 h and at release + 7 days; record time (UTC), value, window, eligible events, budget remaining, burn rate and the difference from baseline in `ops.md` §Watch readings.
- Read the outcome indicator at release + 7 days by the spec's method; record it; dispatch the Product Manager (`../agentic-sdlc/agents/product-manager.md`) for the verdict: `met` · `missed by <n>` · `on track (partial period)` · `n/a`. No subagents → write the verdict in a separate pass after re-reading only the spec §Indicator and the reading.
- Review every spec alert with the A1–A8 checklist in `references/alerting-and-runbooks.md` §2.
- Close the watch period in `ops.md` §Watch period result: `closed clean` · `closed with issues #n` · `open — <reason>`.
- No reading 14 days after release → trace-check† WARN; at the retro it becomes FAIL. Record the reading late rather than skip it, and state the delay.

### Step 4 — Alert triage

1. Record the fire in `ops.md` §Alerts: time (UTC), rule ID, value.
2. Run the runbook first check (`references/alerting-and-runbooks.md` §4); paste query, reading and time.
3. Classify on user impact observed (`references/incident-response.md` §1): SEV1 outage, data loss or exposure, security breach · SEV2 degraded feature, threshold breach, rollback executed · SEV3 minor defect with a workaround · SEV4 not an incident (fired and cleared with no failed user requests, near miss). Unsure → the higher level.
4. SEV1–SEV3 → Step 5. SEV4 → one row with the reason, no page.
5. Alert trend: ≥ 3 fires of one rule in 7 days without an incident → `from-production` issue with fire times, values and first-check readings. Never edit the rule, threshold or window from Operate.

### Step 5 — Incident response

Load `references/incident-response.md`. Acknowledge within SEV1 15 min · SEV2 1 h · SEV3 next business day.

1. **Acknowledge and name the owner.** A named human is incident commander (default: the on-call engineer). Missing acknowledgement → page the backup, then the Tech Lead; record each page.
2. **First check.** Run the runbook first check; timeline row with the query, the reading and the time.
3. **Propose the rollback.** When the runbook or release notes name one, write the exact command and ask the on-call engineer to run it: "Proposed: `flagctl set reports.csvExport off --env prod`. Run it?" Then propose the verify command the same way. Mitigate first, diagnose after; delaying an available rollback on SEV1/SEV2 needs the incident commander's decision in the timeline.
4. **Timeline.** UTC, minute precision, one event per row, decision rows name the role, corrections as new rows (`references/incident-response.md` §5).
5. **Communicate.** Draft updates for the Communications role: SEV1 every 30 min, SEV2 every 60 min, SEV3 on the issue. Format: impact now · done · next · next update time · owner. No cause and no names in external updates.
6. **No rollback available.** Hotfix as a Quick-path item (issue with a reproducing acceptance test, test-first commit, `sdlc-dod` green, human reviewer); approvals that cannot wait use an `emergency` waiver (≤ 7 days, retroactive approval ≤ 2 business days, owner ≠ requester; `../agentic-sdlc/references/governance.md` §Waivers). Cause analysis → `systematic-debugging`. Commit message carries `hotfix`.
7. **Restored** = the alerting signal inside its threshold for ≥ 1 full alert window after mitigation, verify output recorded, user impact stopped. **Closed** = restored + every action owned (role + person) + postmortem file created with its due date (SEV1/SEV2) or SEV3 issue opened + `ops.md` §Incidents row + `from-production` issues opened. Link the spec ID and AC-n; unknown AC → `untraced-requirement`.

### Step 6 — Blameless postmortem (SEV1 and SEV2)

Due ≤ 5 business days after restore. Location `docs/postmortems/YYYY-MM-DD-<slug>.md` from `../agentic-sdlc/templates/postmortem.md`: summary, impact, detection, timeline (UTC), root cause and contributing factors, what went well, what went poorly, action items, links, validity.

1. Save the timeline and evidence to files first. Dispatch `prompts/postmortem-drafter.md` in a fresh context with those files, the spec, release notes, `ops.md` and 90 days of postmortems and retros. No subagents → clear working notes and run the prompt in a fresh pass reading only those files.
2. Check the draft: every number has a source or says `unknown — <reason>`; root cause and each contributing factor carry one cause tag (`spec-gap` · `design-gap` · `test-gap` · `review-miss` · `security` · `dependency` · `env` · `ops-signal` · `process` · `tooling`) and evidence; no person named as a cause anywhere.
3. Actions: ≥ 1 changes the environment (test, CI check, alert, runbook, configuration, code, AGENTS.md block). Each has ID `PA-YYYYMMDD-n`, one owner (role + person, confirmed by a human), a due date, the target file and a `from-production` issue. Closed by a merged commit on the target file with `Refs: PA-YYYYMMDD-n`.
4. Recurrence: the same cause tag in 2 retros or postmortems within 90 days → ≥ 1 action is an automated control approved by a person other than its proposer (`../agentic-sdlc/references/retrospective.md` §Recurrence).
5. Runbook check: every runbook step that was wrong, missing or slower than stated becomes an action whose target file is the runbook; update `Last verified` only for steps actually executed.
6. The incident commander reviews; status `final`. Past due → status.mjs† lists it as the next step; until that script exists, the router's Step 0 reading of `docs/postmortems/` reports it.

### Step 7 — Production intake

Open one issue per trigger, labelled `from-production`:

```text
Title: [from-production] <spec NNN-slug> AC-n: <observed problem in one line>
Trigger: postmortem action PA-… | alert trend | indicator miss | SLO gap | runbook stale
Spec / AC: specs/NNN-slug · AC-n (or untraced-requirement)
Reading: <value, window, read at UTC> · Source: <query or dashboard>
Proposal: <change, e.g. add duration histogram + ticket alert p95 > 3 s over 30 min>
Links: ops.md row · postmortem · release notes
```

Discover triages within 2 business days (`issue-triage`: duplicate search, path score); record the triage date in `ops.md` §From-production issues. Untriaged after 2 business days → status.mjs† next step.

### Step 8 — Delivery metrics and retro facts

Load `references/dora-metrics.md`. The later-release `metrics.mjs`† does not exist yet; compute by hand over the last 30 days:

- Deployment frequency: production releases with a stage-1 row in the window ÷ weeks.
- Lead time for changes: per release, first commit → stage-1 start (median), also split at the merge.
- Change failure rate: releases with a rollout rollback, a SEV1/SEV2, or a revert/hotfix ≤ 7 days after stage 1 ÷ releases whose 7-day window closed.
- Time to restore: per SEV1/SEV2, impact start → restored (median), from postmortem timelines.

Fewer than 5 data points → counts, not percentages. No source → `n/a — <reason>`. Hand the Scrum Master the retro §Facts values (indicator first reading vs target, incidents by SEV, reverts/hotfixes ≤ 7 days) plus the four DORA rows; the SRE never owns a retro action.

### Step 9 — Report

Return: ops readings recorded · incidents with SEV and state · postmortem path and status · `from-production` issues with numbers · DORA rows when computed. Status: `DONE` reading recorded or incident closed · `DONE_WITH_CONCERNS` indicator below target, SLO `low` or `exhausted`, or a field `not measured` · `BLOCKED` no access to the signal · `NEEDS_CONTEXT` spec lacks an indicator or alert · `CANNOT_VERIFY` indicator source unavailable (name who measures it and when).

**Close.** End with the `status.mjs --next` output.

## Anti-rationalization

| Thought | Reality |
|---|---|
| "Production is down; I'll flip the flag myself, it's faster." | The agent proposes the exact command; the on-call engineer runs it. A proposal takes one line and seconds. |
| "It was fixed in 20 minutes, a postmortem is overkill." | SEV2 includes every executed rollback. Postmortem due ≤ 5 business days, whatever the duration. |
| "The alert is noisy, I'll raise the threshold to 5%." | The threshold is approved spec text. Record the fires; ≥ 3 in 7 days → `from-production` issue → spec revision. |
| "We're at 0.4% errors, so the SLO is obviously 99.5%." | The active SLO is the spec floor. A tighter target is a proposal until a new Specify sign-off. |
| "p95 looked fine in staging, call it met." | Staging is not production. No signal → `not measured — no signal` and an issue. |
| "Let's find the root cause before rolling back." | Mitigate first. Diagnosis that delays an available rollback on SEV1/SEV2 needs the incident commander's recorded decision. |
| "The developer merged a bad query — that's the cause." | Causes are system conditions: "the export query ran an unindexed `COUNT(*)` at production volume; staging had 200,000 rows". |
| "Action: be more careful with queries." | Not an action. Name the file that changes: a migration, a load test, a review checklist row. |
| "Only a few users complained, call it SEV3." | Severity follows impact observed: 5xx above the alert threshold is a degraded feature → SEV2. |
| "The indicator reading can wait for the retro." | First reading ≤ 7 days after release; 14 days → WARN, FAIL at the retro. |
| "Three releases, one failed: 33% change failure rate — alarming." | Fewer than 5 data points → report "1 of 3", no percentage, no trend. |
| "The graph looks better, declare it restored." | Restored = signal inside threshold for one full alert window + verify output recorded. |

## Critical Rules

**NEVER:**

- Run a rollback, restart, flag flip, data fix, deploy or any other state-changing production command. Propose the command; the on-call engineer runs it.
- Create, edit or delete an alert rule, threshold, window, SLO target or rollout stage from Operate; propose it in a `from-production` issue.
- Record a number without its query or dashboard, window and UTC read time; never estimate, never reuse staging values.
- Name a person as a cause in a postmortem, a timeline, an update or an issue.
- Close an incident with an action that has no owner (role + person), or own an action as an agent.
- Skip or postpone a SEV1/SEV2 postmortem beyond 5 business days, or a first indicator reading beyond 7 days without recording the delay.
- Read raw personal data; work from aggregates only.

**ALWAYS:**

- Acknowledge within SEV1 15 min · SEV2 1 h · SEV3 next business day and name a human incident commander.
- Keep the timeline in UTC, minute precision, one event per row, decisions attributed to a role.
- Link every incident and issue to the spec ID and AC-n, or label `untraced-requirement`.
- Give every postmortem ≥ 1 action that changes the environment, each with owner, due date, target file and `from-production` issue.
- Hold, not advance, when an advance condition cannot be shown with a number.
- Send every postmortem action, alert trend, indicator miss and SLO gap to Discover as a `from-production` issue.

## Example Usage

**1. First indicator reading — CSV export**
> "v2.14.0 closed on 2026-12-02. Do the 7-day reading for `001-csv-export`."

`ops.md` opened from the template. SLI-1 (non-5xx / all exports) floor ≥ 98% derived from the alert; SLI-2 (p95 ≤ 3 s) `not measured — no signal`. Reading 2026-12-07T13:00Z: 1,406 of 1,412 exports succeeded (99.58%), budget 79% left, burn rate 0.21, `healthy`. Indicator: 1 ticket tagged `export-request` in 7 days vs target ≤ 4/month; Product Manager verdict `on track (partial period)`. Two `from-production` issues: duration histogram for SLI-2, and a proposal to tighten SLI-1 to 99.5%. Status `DONE_WITH_CONCERNS` (SLI-2 not measured).

**2. Alert at night — SEV2 with rollback**
> "`reports-export-error-rate` fired at 03:12Z: 6.1% over 15 min."

First check: 88 of 1,440 exports failed with `statement timeout`. SEV2 (threshold breach). Incident commander: on-call engineer M. Silva at 03:19Z. Proposed `flagctl set reports.csvExport off --env prod`; executed by the on-call engineer at 03:24Z; verify `404` in 9 s. Restored at 03:41Z after one clean 15-minute window. Postmortem due 2026-12-17; root cause tagged `test-gap` (staging data set 200,000 rows, unindexed `COUNT(*)` at production volume), contributing `ops-signal` (no duration signal). Actions: index migration, load test at production volume, duration histogram via spec revision — each with owner, due date and target file.

**3. Pressure — "skip it, just fix it"**
> "Exports are failing for the CFO's team right now. Flip the flag yourself and skip the postmortem paperwork — it'll be fixed in ten minutes."

The agent writes the timeline row, classifies SEV2, and replies with one line: "Proposed: `flagctl set reports.csvExport off --env prod`. Run it?" It does not execute. After the on-call engineer runs it and the verify passes, it states that an executed rollback is SEV2 and the postmortem is due in 5 business days, creates the file with the due date, and drafts it with the fresh-context prompt.

**4. Noisy alert**
> "`billing-sync-lag` paged three times this week and every time it cleared on its own. Just bump it to 20 minutes."

The ops record shows fires at 2026-12-01T02:10Z, 2026-12-03T02:12Z and 2026-12-05T02:09Z, each clearing within the window with 0 failed syncs; each classified SEV4. Alert trend rule met → `from-production` issue with the three readings and the A8 failure, proposing a 20-minute window or a nightly-batch exclusion. The rule stays unchanged until the spec revision is approved.

**5. Retro prep with DORA metrics**
> "Retro on Monday. Pull the production numbers."

Release tags and deploy logs give 4 releases in 30 days (0.93/week); median lead time first commit → production 77 h; change failure 1 of 3 closed windows (a revert on v2.13.0); time to restore `n/a — no SEV1/SEV2 incident`. Facts handed to the Scrum Master with each command; `metrics.mjs`† noted as not yet available.

## References

| File | Load when |
|---|---|
| `references/slo-from-spec.md` | Step 2: deriving SLIs, SLO floors, error budgets and burn rates from spec text; CSV export worked example |
| `references/alerting-and-runbooks.md` | Step 3 alert review (A1–A8), Step 4 triage, alert trend rule, runbook stubs per alert |
| `references/incident-response.md` | Step 5: severity table SEV1–SEV4, roles, first three actions, hotfix path, timeline, status cadence, shift handover, restored vs closed |
| `references/dora-metrics.md` | Step 8: deployment frequency, lead time, change failure rate, time to restore — definitions, commands, worked computation |
| `prompts/postmortem-drafter.md` | Step 6: fresh-context postmortem draft with blameless check and cause tags |
| `../agentic-sdlc/templates/ops-record.md` | Step 1: creating `specs/NNN-slug/ops.md` |
| `../agentic-sdlc/templates/postmortem.md` | Step 6: creating `docs/postmortems/YYYY-MM-DD-<slug>.md` |
| `../agentic-sdlc/references/release-ops.md` | The contract: watch windows, runbook minimum, incident severities, intake rules |
| `../agentic-sdlc/references/retrospective.md` | Step 8 and Step 6: retro facts, cause tags, recurrence rule |

† Added in a later release; manual fallback in `../agentic-sdlc/references/artifacts.md` §Later-release files.
