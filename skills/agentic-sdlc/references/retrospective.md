# Agentic SDLC — Retrospective

Load after a Release, after a merge with no release, or when a Quick batch is due. The retro is part of the default cycle on every path: it turns one cycle's evidence into owned actions that change a file the next cycle reads. Facilitator: the Scrum Master agent (`agents/scrum-master.md`) drafts the agenda and facts, with production facts from the SRE; a named human (the human Scrum Master if the team has one, otherwise the Tech Lead) runs the meeting and records the decisions. Template: `templates/retro.md`.

## When a retro is due (16.1, K3)

| Path | Trigger | Due | Timebox | Covers |
|---|---|---|---|---|
| Standard | Release reaches 100% (release notes §Deploy log), or merge when the item has no release | ≤ 5 business days after the trigger | ≤ 15 min | One spec |
| Full | Same as Standard | ≤ 5 business days after the trigger | ≤ 45 min (full retro: adds §Full additions) | One spec |
| Quick | 10 Quick items merged since the last Quick batch retro, or 14 calendar days since it with ≥ 1 Quick item merged; whichever comes first | ≤ 5 business days after the trigger | ≤ 15 min | All Quick items in the batch |

**Record:** `docs/retros/YYYY-MM-DD.md` (second retro on the same date: `YYYY-MM-DD-2.md`). The header line `**Covers:**` names the spec folder and release tag, or the batch's PR numbers; `status.mjs`† matches retros to items by this line.

**Failure behaviour.** No valid record by the due date → `status.mjs`† reports `Retro overdue: <spec or batch>` as the next step (router Step 0, state 8), and the next Release in the repository is NO-GO (`references/release-ops.md` checklist R9; `trace-check`† FAIL once it exists) until the retro is held. A retro is never skipped because the cycle "went fine": a 15-minute retro with one action is the minimum.

## Procedure

**Inputs** (read directly, never from memory): `plan.md` loop ledger, PR Review triage, release notes, `specs/NNN-slug/ops.md`, postmortems since the last retro, open actions from earlier retros, `git log` of the item.

| Step | Minutes (Standard / Quick) | Work | Output section |
|---|---|---|---|
| 1 | 2 | Review every open action from earlier retros: `done <SHA>` · `dropped: <reason>` · `open` with its cycle count | Prior actions |
| 2 | 3 | Agent-drafted facts, read aloud: §Facts below | Facts |
| 3 | 5 | ≤ 2 Keep items; ≤ 3 Change items, each with one cause tag and a "seen before" lookup over the last 90 days | Keep, Change |
| 4 | 5 | 1–3 actions; each passes the action rule below | Actions |
| 5 | — | Validity check, then commit the record | Validity |

At the timebox, stop; topics not reached go to the next retro's agenda under `Carried`.

**Facts (collected every cycle; a fact without a source is `n/a — <reason>`):**

| Fact | Source |
|---|---|
| Lead time, first commit → merge (hours) | `git log --reverse --format=%cI <base>..<merge> \| head -1` and the merge commit time |
| Loop rounds per task; escalations | `plan.md` loop ledger |
| Review findings by severity; Critical found after Test sign-off | PR Review triage; postmortems |
| Reverts or hotfixes ≤ 7 days after release | `git log -E -i --since=<release date> --grep='^Revert\|hotfix'` |
| Indicator: first reading vs target | `ops.md` |
| Incidents (SEV) since release | `docs/postmortems/` |

## Action rule

An action counts only when it has all five fields:

| Field | Rule |
|---|---|
| ID | `RA-YYYYMMDD-n` (retro date + sequence) |
| Action | One verb phrase describing the change |
| Owner | Role + person; one owner |
| Target file | The file the action changes: AGENTS.md block (pitfalls or `sdlc-dod`), a checklist in a reference override, a skill override, a test, a CI check or a script |
| Due | Before the next retro of the same track, ≤ 14 days |

The action is closed by a merged commit that changes the target file with the trailer `Refs: RA-YYYYMMDD-n`; its status becomes `done <SHA>`. "Be more careful", "remember to", and any action with no target file are observations, not actions.

**Failure behaviour.** 0 valid actions → the record is invalid and the retro counts as not held (still overdue). An action open for more than 2 cycles (2 later retros of the same track) → escalate to the Tech Lead, who rules `do by <date>`, `re-own to <person>` or `drop: <reason>`; the ruling is written in the next retro's Prior actions row.

## Recurrence (16.2)

Every Change item and every postmortem cause carries one cause tag: `spec-gap` · `design-gap` · `test-gap` · `review-miss` · `security` · `dependency` · `env` · `ops-signal` · `process` · `tooling`.

**Rule.** The same cause tag in 2 retros or postmortems within 90 days → at least one action in this retro is an automated control: a test, a lint or CI check, a script check, or a command added to an existing `sdlc-dod` key. The control is approved by a person other than its proposer; the approver is named in the action row. **Failure behaviour:** a recurring tag answered only by an instruction-file note → validity check fails → retro invalid.

## Full additions

Full retros (≤ 45 min) add three checks to step 2: each threat-model mitigation verified in production or listed as residual risk; the runbook's first check executed once since release (`Last verified` updated); approval wait times (request → decision, per approval). Each gap becomes a Change item.

## Roles and solo teams

The meeting needs ≥ 1 human with the authority to own actions; the agent never owns an action. In a 1-person team the same person runs the retro and owns the actions; the recurrence approval falls under the waiver procedure (`references/governance.md` §Waivers).

† Added in a later release; manual fallback in `references/artifacts.md` §Later-release files.

## Sources

The retro-to-environment loop adapts BMad Method's (MIT) retrospective workflow and Matt Pocock's (MIT) practice of feeding observed agent mistakes back into instruction files. Text is original.
