# Facilitation

Load at Step 6 when drafting the agenda, and at Step 7 when supporting the meeting. A named human runs the meeting: the human Scrum Master if the team has one, otherwise the Tech Lead. The Scrum Master agent prepares the materials and records decisions as they are spoken. It never chairs the meeting, owns an action or commits the record.

## 1. Agendas

**Standard, or Quick batch (≤ 15 min).** These follow the contract's procedure.

| Min | Item | Output section | Agent prepares |
|---|---|---|---|
| 2 | Prior actions (`RA-` from retros and open `PA-` from postmortems): confirm each status and take a ruling on any action open > 2 cycles | Prior actions | Status per action with its SHA or the reason it is open |
| 3 | Facts, read aloud. Questions of fact only | Facts | Facts table with a source per value |
| 5 | Keep (≤ 2) and Change (≤ 3). The team chooses from the candidates or adds its own | Keep, Change | Candidate rows with evidence, cause tag and a seen-before lookup |
| 5 | Actions (1–3): shape each one until it passes the action rule | Actions | Draft action per candidate, classified mechanical, judgment or process |
| — | Validity check, then the human commits the record | Validity | Checklist pre-filled where it can be checked |

**Full (≤ 45 min).** These have the same steps plus the Full additions.

| Min | Item |
|---|---|
| 5 | Prior actions, plus any `hold` outcome carried from earlier |
| 12 | Facts, Full additions (threat-model mitigations, runbook first check, sign-off wait times) and the epic view when it applies |
| 15 | Keep and Change |
| 10 | Actions |
| 3 | Outcome decision confirmed by the Product Owner, then validity |

The facilitator calls each boundary aloud. When an item runs over, the facilitator moves on, and the remaining topic goes into §Carried. The timebox never stretches. Carried topics become the first agenda items of the next retro of the track.

**Carried items open the agenda.** Every §Carried entry from the previous retro of the track, including an outcome `hold`, is listed before Prior actions. Each one is either resolved, turned into an action, or carried once more with a reason. A topic carried twice goes to the Tech Lead for a ruling, in the same way as an action.

## 2. Blameless rules

The retro looks at the conditions that allowed an event. It never judges the people involved. Agents are treated the same way: "the agent got it wrong" is not a cause, but the missing instruction, check or context that let it go wrong is.

| Written as | Rewrite to |
|---|---|
| "A. Mendes forgot the down migration" | "Migration 0042 merged without a down step; no check requires one" |
| "The Developer agent was careless with mocks" | "T2's test mocked `UserRepository` (F-3) although a pitfall line forbade it; nothing checks for repository mocks" |
| "QA should have caught it" | "No acceptance test covered AC-4's empty-result case; the review lens L2 did not flag it" |
| "Design took forever" | "Design sign-off waited 4 business days (requested 2026-11-02, answered 2026-11-06); no delegate is named" |
| "We need to communicate better" | Name the handoff that failed, the artifact that was missing and the date |

Rules:

- Every observation cites an artifact (finding ID, ledger row, commit, approval row, postmortem, IMP-n).
- No ranking of people, no per-person counts and no "who caused it" column.
- Speculation is recorded as a question (`Unknown: why the alert did not fire`), never as a fact.
- When a person names themselves as the cause, the facilitator restates it as the condition.

## 3. Recording decisions

- **Exact words.** For each decision (an outcome decision, a Tech Lead ruling, a dropped action, approval of a control), record the person, the role and the words they actually said: `Tech Lead, D. Okafor: "Approved — the lint rule is the control."`
- **Owner accepts aloud.** An action has an owner only when that person accepts it in the meeting. An owner who is absent means the action has no owner, so either someone present takes it or it is not recorded.
- **Agent never owns.** Owners and approvers are people. The agent may draft the change later, but the human owner is accountable for it.
- **Silence is not a decision.** Fail-safe 2 in `outcome-decision.md` applies to outcome decisions, and a ruling that is not given is recorded as `pending — Tech Lead ruling` in the Prior actions row.
- **Header facts.** Fill in Held (date), Duration (minutes, measured), Facilitator (role, person), Participants (roles, people) and Facts drafted by (agent, plus `fresh-context subagent` or `inline pass`).

## 4. After the meeting

1. The agent fills in the agreed rows and runs the Validity checklist. Any box that is not ticked is reported to the facilitator, with the reason.
2. The agent ends its turn. The human reviews the record and commits it with `docs(retro): <YYYY-MM-DD> <covers>`. A retro that is not committed has not been held.
3. Once the record is committed, the agent routes the outputs listed in `action-rules.md` §6.

## 5. Solo teams and missing roles

| Situation | Rule |
|---|---|
| 1-person team | The same person facilitates and owns the actions. A recurrence control's second-person approval is replaced by a waiver (`../../agentic-sdlc/references/governance.md` §6). The 15-minute timebox still applies |
| No Product Owner present at an outcome decision | Record `not accepted — no decision (Product Owner absent)`, which is fail-safe 2, and carry the topic. The Product Owner decides at the next retro, or in writing before it, with exact words |
| No Tech Lead for a ruling on an action open > 2 cycles | Record `pending — Tech Lead ruling`. The action stays open and is carried |
| No SRE (no production access) | The production rows are `n/a — no SRE reading; <who can read it>` and one Change item restores the reading |
| Facilitator absent on the due date | Another named human facilitates. The retro is never postponed past its due date for lack of a facilitator |
