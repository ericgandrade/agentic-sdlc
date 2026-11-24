<!--
Agentic SDLC — retro record. Rules: references/retrospective.md.
Location: docs/retros/YYYY-MM-DD.md (second on the same date: YYYY-MM-DD-2.md).
Due: Standard/Full ≤ 5 business days after Release reaches 100% (or after merge with no release);
Quick batch at 10 merged items or 14 days, whichever comes first.
Timebox: ≤ 15 min (Standard, Quick batch) · ≤ 45 min (Full).
The Scrum Master agent drafts §Facts from the artifacts, with production facts from the SRE (templates/ops-record.md); a named human records decisions and owns actions.
A section with nothing to report says "none — <reason>"; never leave it blank. Keep every heading.
-->

# Retro — <YYYY-MM-DD>

**Covers:** <`specs/NNN-slug` · release `vX.Y.Z` | Quick batch: #<PR>, #<PR>, …> · **Kind:** <Standard | Full | Quick batch>
**Trigger:** <100% rollout | merge | 10 items | 14 days> on <YYYY-MM-DD> · **Due:** <YYYY-MM-DD> · **Held:** <YYYY-MM-DD> · **Duration:** <n> min
**Facilitator:** <role, person> · **Participants:** <roles, people> · **Facts drafted by:** <agent>

## Prior actions

<!-- Every action still open from earlier retros. Status: done <SHA> | dropped: <reason> | open (cycle n). Open > 2 cycles → Tech Lead ruling. -->

| ID | Action | Owner | Target file | Status | Cycles open | Tech Lead ruling |
|---|---|---|---|---|---|---|
| <RA-YYYYMMDD-n or "none"> | <action> | <role, person> | `<path>` | <status> | <n> | <n/a \| do by <date> \| re-own to <person> \| drop: <reason>> |

## Facts

| Fact | Value | Source |
|---|---|---|
| Lead time, first commit → merge | <hours> | `git log` |
| Loop rounds per task (max) · escalations | <T-n: n rounds> · <n> | `plan.md` loop ledger |
| Review findings Critical / Important / Minor | <n / n / n> | PR Review triage |
| Critical found after Test sign-off | <n> | postmortems, issues |
| Reverts or hotfixes ≤ 7 days after release | <n> | `git log` |
| Indicator: first reading vs target | <reading> vs <target> | `ops.md` |
| Incidents since release (SEV) | <n (SEVn)> | `docs/postmortems/` |

## Keep

<!-- ≤ 2 items. -->

- <practice to keep, with the evidence that it worked>

## Change

<!-- ≤ 3 items. One cause tag each: spec-gap · design-gap · test-gap · review-miss · security · dependency · env · ops-signal · process · tooling.
"Seen before" = the same tag in a retro or postmortem within the last 90 days (2 hits → an automated control is required). -->

| # | Observation | Cause tag | Seen before (≤ 90 days) |
|---|---|---|---|
| C-1 | <what happened, with the artifact that shows it> | <tag> | <none \| docs/retros/… or docs/postmortems/…> |

## Actions

<!-- 1–3 actions. Each changes a file: AGENTS.md block (pitfalls or sdlc-dod), a checklist override, a skill override, a test, a CI check or a script.
Close with a merged commit that changes the target file and carries "Refs: RA-YYYYMMDD-n". -->

| ID | Action | Owner (role, person) | Target file | From | Control approved by (recurrence only) | Due (≤ 14 days) | Status |
|---|---|---|---|---|---|---|---|
| RA-<YYYYMMDD>-1 | <verb phrase> | <role, person> | `<path>` | <C-n> | <n/a \| person ≠ proposer> | <YYYY-MM-DD> | open |

## Carried

<!-- Topics not reached within the timebox; first agenda items of the next retro. -->

<none | topic>

## Full additions

<!-- Full path only; otherwise "n/a — Standard" or "n/a — Quick batch". -->

| Check | Result |
|---|---|
| Threat-model mitigations verified in production | <each mitigation: verified \| residual risk> |
| Runbook first check executed since release | <date, Last verified updated> |
| Sign-off wait times (request → decision) | <Specify h · Design h · Test h · Release h> |

## Validity

- [ ] ≥ 1 action; every action has an ID, one owner, a target file and a due date ≤ 14 days
- [ ] Every prior open action has a status; any open > 2 cycles has a Tech Lead ruling
- [ ] Every Change item has a cause tag and a "seen before" lookup
- [ ] A tag seen in 2 retros or postmortems within 90 days has an automated-control action approved by a person ≠ proposer
- [ ] Held ≤ due date; duration within the timebox
