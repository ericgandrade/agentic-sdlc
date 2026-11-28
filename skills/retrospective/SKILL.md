---
name: retrospective
description: This skill should be used when a delivery cycle closes and its lessons must become owned changes — a retro is due or overdue after a release reaches 100% or a merge with no release, a Quick batch reaches 10 items or 14 days, retro facts or an agenda must be drafted, prior retro actions must be checked, an indicator reading must be judged against its baseline and target, an epic needs a cross-item view, or an agent mistake that recurs across cycles must become an automated check or an AGENTS.md pitfall (the Operate stage of the Agentic SDLC). Not for postmortems, incidents or taking production readings (use operations-and-incidents), or logging a single agent mistake on the spot (use project-context).
license: MIT
---

# Retrospective

## Purpose

Agentic SDLC · Operate stage. Closes every cycle on every path; Quick items are batched. Used by the **Scrum Master** agent (`../agentic-sdlc/agents/scrum-master.md`, played by the router), which drafts the agenda and the facts; the **SRE** supplies production facts; the **Product Manager** reads the indicator against its target. A named human — the human Scrum Master when the team has one, otherwise the Tech Lead — runs the meeting and records the decisions. Agents never own actions and never decide the outcome.

A retro turns one cycle's evidence into 1–3 actions, each of which changes a named file that the next cycle reads: a check, a test, a `sdlc-dod` command, a line in the AGENTS.md block, a checklist or a skill override. Anything else is an observation. The skill adds four things around the meeting: evidence gathering with a source per fact, an outcome decision with fail-safes, a cross-item view for epics, and a recurrence rule that turns a lesson learned twice into an automated control.

The stage contract is `../agentic-sdlc/references/retrospective.md` (due dates, timeboxes, record path, action rule, cause tags, recurrence, Full additions). The record format is `../agentic-sdlc/templates/retro.md`; a complete record is `../agentic-sdlc/examples/worked-example/specs/001-csv-export/retro.md`. This skill is the full procedure. When the two disagree, the contract wins and the gap is reported.

## When to Use

- A Standard or Full item's release reaches 100% (release notes §Deploy log), or an item merges with no release.
- A Quick batch is due: 10 Quick items merged since the last Quick batch retro, or 14 calendar days since it with ≥ 1 Quick item merged.
- Router Step 0 reports state 8 (released without retro) or state 9 (retro actions open), or release checklist R9 is `false`.
- The first indicator reading arrives and the Product Owner must decide whether the outcome is met.
- The last item of an epic closes and a cross-item view is needed.
- An agent mistake recurs and must become a durable change through an owned action.

Do not use it for neighbouring work:

- Classifying an incident, running the incident procedure or writing a postmortem → `operations-and-incidents` (the retro reads postmortems; it does not write them).
- Writing a single pitfall line or setting up the AGENTS.md block → `project-context` pitfall or setup mode (the retro hands its judgment lessons to pitfall mode).
- Triaging a `from-production` issue → `issue-triage` (the retro opens the issue; Discover triages it).
- Release notes, go/no-go, handover → `shipping-and-handover`.
- Reviewing one PR or a cross-task integration diff → `multi-axis-code-review`.
- Proving a completion claim → `verification-gate`.

## Workflow

### Step 0 — Discover the project's records

1. Read the AGENTS.md (or CLAUDE.md) block between `<!-- AGENTIC-SDLC:BEGIN -->` and `<!-- AGENTIC-SDLC:END -->`. An `Artifacts:` line that maps records elsewhere wins over the defaults below.
2. Locate, by search rather than assumption: `docs/retros/*.md`, `docs/postmortems/*.md`, `specs/*/` (spec, plan, approvals, impediments, run-ledger, ops), the PR body (or `specs/NNN-slug/review.md` without a PR host), release notes (release page or `CHANGELOG.md`).
3. Find the last retro of the same **track** (one spec for Standard and Full; the Quick batch track for Quick) by its `**Covers:**` line. A retro that already covers this spec or batch → stop and report the existing file; never write a second record for the same coverage.
4. No `docs/retros/` folder and no mapped location → create the default path at Step 7, and record `n/a — first retro in this repository` in §Prior actions.

Two conflicting record locations → ask which is authoritative and record the answer in the AGENTS.md block through `project-context`.

### Step 1 — Confirm the retro is due; set kind, due date and timebox

| Kind | Trigger | Due | Timebox | Covers line |
|---|---|---|---|---|
| Standard | 100% rollout, or merge with no release | trigger + 5 business days | ≤ 15 min | `specs/NNN-slug` · release `vX.Y.Z` |
| Full | same | trigger + 5 business days | ≤ 45 min | same |
| Quick batch | 10 merged Quick items, or 14 days with ≥ 1 | trigger + 5 business days | ≤ 15 min | `Quick batch: #PR, #PR, …` |

Count business days Monday–Friday, excluding the trigger day: 100% on Tuesday 2026-12-01 → due Tuesday 2026-12-08. Count Quick items from merged PRs whose body carries `**Path:** Quick` since the last Quick batch retro's `Held` date (`references/evidence-gathering.md` §Quick batch counter).

**Overdue** (today > due, no valid record): report `Retro overdue: <spec or batch>` as the next step, state that the next Release is NO-GO through checklist R9, and hold the retro now. A late retro is held, never skipped. `status.mjs`† does not exist yet: apply the router Step 0 table by reading the files (`../agentic-sdlc/references/artifacts.md` §Later-release files).

### Step 2 — Gather the evidence

Dispatch a fresh-context subagent with `prompts/facts-drafter.md`, giving it file paths, the release tag, the base and merge SHAs and the prior retro path, never a summary of the cycle. **No subagents on the platform** → run the prompt as a separate labelled pass after clearing working notes, reading only the listed files.

The procedure, commands and source per fact are in `references/evidence-gathering.md`. Four rules apply to every fact:

1. **Source or n/a.** Each value names the command or file that produced it. No source → `n/a — <reason>`. Never estimate, round up from memory or carry a number from chat.
2. **Checked vs never checked.** `0 (checked: docs/postmortems/ since 2026-11-30)` and `n/a — postmortem folder absent` are different facts; a blank or a bare `0` is neither.
3. **Read, do not recall.** Loop data comes from `node skills/agentic-sdlc/scripts/run-ledger.mjs status --ledger specs/NNN-slug/run-ledger.jsonl --json` (or `--run <id>` while the run is still active; installed copies run `../agentic-sdlc/scripts/run-ledger.mjs`); without Node or a ledger, from the `## Loop ledger` table in `plan.md`. Lead time, change-failure rate, loop rounds, escalations and reverts for the cycle come from `node skills/agentic-sdlc/scripts/metrics.mjs --record --cycle <spec slug or batch> --json` (installed copies run `../agentic-sdlc/scripts/metrics.mjs`), which appends the cycle to `.agentic-sdlc/metrics/history.jsonl`; record each value with that command as its source.
4. **Write history, not the present.** Date every reading and anchor code claims to a SHA: `As of 1b8d74a, …`.

Gather all seven template facts (lead time; loop rounds and escalations; findings by severity; Critical after Test sign-off; reverts or hotfixes ≤ 7 days; indicator vs target; incidents) plus the cycle signals the template leaves to observations: impediments from `specs/NNN-slug/impediments.md` (count, oldest age), approval wait per sign-off from `approvals.md` and the PR review times, `CANNOT_VERIFY` and `self-review` rows in the PR Verification section, waivers used, and rulings at loop bounds. Each signal that shows friction becomes a **candidate** Change item with its evidence; the meeting decides which ones enter the record.

For each prior action from earlier retros of the track, and each open postmortem action `PA-YYYYMMDD-n` from `docs/postmortems/` since the last retro (tracked under its own ID, never renamed), find the closing commit: `git log --all -E --grep='Refs: (RA|PA)-YYYYMMDD-n' --format='%h %cI %s'`, then confirm the commit changes the target file and is on the default branch. Status: `done <SHA>` · `dropped: <reason>` (only with a recorded human ruling) · `open` with the count of later retros of the same track. No commit found → `open`, never `done` on someone's word.

### Step 3 — Judge the indicator against baseline and target; draft the outcome decision

Load `references/outcome-decision.md`. Read the indicator from `spec.md` §Indicator (baseline, target, method, first-reading date) and the reading from `specs/NNN-slug/ops.md` §Indicator readings (template `../agentic-sdlc/templates/ops-record.md`, kept by the SRE); without an ops record, the SRE supplies the reading directly for the retro Facts row.

1. Check the reading's method and window against the spec's Method column. Same source, same unit, same window length → comparable. A reading over part of the window is labelled `partial: n of m days`.
2. The Product Manager returns the verdict `met` · `missed by <n>` · `n/a — <reason>`, and the delta against the baseline (`14 → 1 /month, −13`). Without the Product Manager (Quick, pure bug fix), the facts drafter computes the same verdict.
3. Draft the **machine verdict**, then present it to the Product Owner, who decides: `accepted` · `accepted with follow-ups` (named issues) · `hold` (next reading date) · `not accepted`.

Fail-safes, applied in order: (a) a human decision overrides the machine verdict, recorded with exact words and reason; (b) no human decision → recorded as `not accepted`, never silently accepted; (c) any AC without passing evidence, any task without its commit, any open Critical → machine verdict `not accepted`; (d) no reading or a partial window → `accepted` is not available; the strongest decision is `hold`; (e) a second consecutive `hold` → the Product Owner rules `accepted with follow-ups` or `not accepted` at that retro.

Record the result in the Facts indicator row: `1 ticket (7 of 30 days, partial) vs target ≤ 4/month, baseline 14/month → met (partial) · outcome: hold — next reading 2026-12-30 (Product Owner, L. Rocha)`. A `hold` also goes to §Carried. `not accepted` or `missed by <n>` → open an issue labelled `from-production` with the spec ID, AC-n, reading and source (`../agentic-sdlc/references/release-ops.md` §Intake); Discover triages it within 2 business days. The retro never orders a rollback or a removal; those enter Discover as new items.

### Step 4 — Full additions and the epic view

**Full kind:** add the three checks from the contract to the Facts: each threat-model mitigation `verified in production` or `residual risk`; the runbook's first check executed since release with `Last verified` updated; sign-off wait (request → decision) for Specify, Design, Test and Release. Each gap is a candidate Change item.

**Last item of an epic** (several specs delivered under one epic, or a Full item delivered through several PRs): load `references/epic-aggregate.md` and build one row per spec — loop rounds and escalations, findings by severity, approval wait, impediments, defects escaped — plus the seam checks no single PR review saw: duplicated solutions across items, pattern divergence, acceptance criteria dropped or reinterpreted between specs. Record the aggregate as Facts rows prefixed `Epic <name>:` in the last item's retro; each gap becomes a candidate Change item with a cause tag.

### Step 5 — Trend check against earlier retros

`metrics.mjs` (Step 2) applies the trend rule of the contract to `.agentic-sdlc/metrics/history.jsonl` and prints `trend: worse | better | flat` per metric; without a history, read the Facts tables of the last 6 retros of the track. When the rule fires, the record needs a Change item naming the metric (`lead time`, `change failure`) and an `RA-` action whose From cites it; `metrics.mjs` exits 1 until it does. Two rules produce candidate Change items tagged `process` (over the last 30 days and comparable kinds only when computed by hand); neither changes a path on its own — the Tech Lead rules in the meeting:

- **Change failure rate** = releases in the last 30 days whose ops record says `Change failed: yes` (SEV1/SEV2, rollback, or revert ≤ 7 days; SEV4 is not an incident) ÷ releases in the last 30 days. Above 15% at this retro and the previous one → propose raising the minimum path for the affected area or adding a check.
- **Lead time** above 1.5 × the median of the previous 3 retros of comparable kind → propose a review of the path sizing (`../agentic-sdlc/references/paths.md`).

Fewer than 3 earlier retros → `n/a — <n> retros of history`.

### Step 6 — Draft the record and the agenda; end the turn

Write the draft at `docs/retros/YYYY-MM-DD.md` (second on the same date: `-2`) from `../agentic-sdlc/templates/retro.md`, keeping every heading:

- Header lines filled except `Held` and `Duration`; `Facts drafted by: Scrum Master agent (router), production facts from the SRE agent`.
- §Prior actions and §Facts complete with sources.
- §Change pre-filled with **candidate** rows, each with one cause tag (`spec-gap` · `design-gap` · `test-gap` · `review-miss` · `security` · `dependency` · `env` · `ops-signal` · `process` · `tooling`) and its seen-before lookup over 90 days (`references/action-rules.md` §Recurrence lookup).
- §Actions left with `proposed` rows only: action, target file and kind (check or pitfall), owner blank.
- The agenda from `references/facilitation.md` with minutes per item.

Present the draft and the agenda to the named facilitator and **end the turn**. Owners, Keep and Change selection and the outcome decision come from humans in a later turn.

### Step 7 — Support the meeting

The facilitator runs it; the agent records. Timebox Standard and Quick: prior actions 2 min · facts 3 · Keep and Change 5 · actions 5 · validity at the end. Full: 5 · 12 · 15 · 10 · 3. At the timebox, stop; unreached topics go to §Carried.

- ≤ 2 Keep items, each with the evidence that the practice worked.
- ≤ 3 Change items, each an observation of what happened, tied to an artifact (finding ID, ledger row, commit, postmortem), with one cause tag. Blameless wording: name the condition that allowed the event, never the person (`references/facilitation.md` §Blameless rules).
- 1–3 actions. Check each one live against the action rule and refuse to record one that fails it.
- Record decisions with the deciding person's name and words; an action owner accepts ownership out loud, and "someone should" assigns nothing.

### Step 8 — Shape every action so it changes the next cycle

Load `references/action-rules.md`. Every action has five fields: ID `RA-YYYYMMDD-n` · one verb phrase · one owner (role, person) · target file · due ≤ 14 days and before the next retro of the track. Then classify:

| Lesson kind | Test | Target | Example |
|---|---|---|---|
| Mechanical | A tool can detect the violation from the code or config alone | Lint rule, CI job, test, script check, or a command added to an existing `sdlc-dod` key | `eslint.config.js`: fail on `vi.mock` of `src/**/repositories/` |
| Judgment | Needs context a tool cannot read (intent, trade-off, cross-file consistency) | One dated line in the AGENTS.md block `## Pitfalls`, written through `project-context` pitfall mode | `2026-12-08 — response headers built from request input → generate export filenames on the server` |
| Process | Concerns a stage, a gate or a checklist | A checklist or skill override, or an `sdlc-dod` key | — |

Rules: prefer the check whenever both fit. A mechanical lesson answered only with a pitfall line fails review. A judgment line passes the admission test: it cites the observed event, names the correct behaviour, and removing it would change what an agent does.

**Recurrence.** The same cause tag in 2 retros or postmortems within 90 days → at least one action is an automated control, approved by a person other than its proposer, named in `Control approved by`. A lesson that recurs while a pitfall line for it already exists proves the line did not work: the action replaces it with a check, and the line stays only until the check is merged. A recurring tag answered only by an instruction-file note fails validity.

**Prove the check bites** before closing the action: run it on a deliberately seeded violation (must fail), on clean code (must pass) and, for a scanner, on a broken input (must fail). Paste the three results in the closing PR.

### Step 9 — Validate, commit, feed the next cycle

Re-run `node skills/agentic-sdlc/scripts/metrics.mjs --cycle <label>`: exit 1 means a required trend Change item or its action is missing, and the record is invalid. Tick the five validity boxes in the template. Any unchecked box → the record is invalid and the retro counts as not held (still overdue). Typical failures: 0 valid actions; an action without a target file; an action owned by an agent; a recurring tag without an approved control; held after the due date without saying so.

The human facilitator commits the record (`docs: retro YYYY-MM-DD for specs/NNN-slug`); the agent never commits, pushes or merges on its own. Then route the outputs:

- Each action becomes a Discover item (router Step 0 state 9), normally Quick; checks enter the project through the normal Build and Test stages.
- Judgment lines go to `project-context` pitfall mode with the retro date as the line date.
- Indicator misses, `not accepted` outcomes and production gaps go out as `from-production` issues for `issue-triage`.
- Between retros, the Scrum Master agent checks the open actions at each transition: closed by a merged commit that changes the target file with the trailer `Refs: RA-YYYYMMDD-n` (or `Refs: PA-YYYYMMDD-n`); open for more than 2 later retros of the track → the Tech Lead rules `do by <date>`, `re-own to <person>` or `drop: <reason>`, written in the next retro's §Prior actions.

**Close.** End with the `status.mjs --next` output.

## Anti-rationalization

| Thought | Reality |
|---|---|
| "Nothing went wrong this cycle; skip the retro." | The retro is part of every cycle. A late one blocks the next Release (R9). A 15-minute retro with one action is the minimum. |
| "Action: be more careful with mocks." | No target file → an observation, not an action. The record with 0 valid actions is invalid. |
| "The AI can own this action." | Agents never own actions. One human, by role and name. |
| "It's already in AGENTS.md, so the recurrence is handled." | The line existed and the mistake recurred. The line failed; a check replaces it. |
| "The lint rule is merged, so the action is done." | Only after it fails on a seeded violation and passes on clean code. A check that never fires is decoration. |
| "Lead time was about three days." | Every number comes from a command or a file, with its source. Unknown → `n/a — <reason>`. |
| "No postmortems, so incidents = 0." | Only after checking the folder since the release date. Never-checked is `n/a`, not 0. |
| "The dashboard is down but the feature obviously works — mark it accepted." | No reading → no `accepted`. The decision is `hold` with a dated next reading. |
| "The Product Owner was happy in chat; record accepted." | Only the Product Owner's explicit decision counts, recorded with exact words. No decision → `not accepted`. |
| "The developer forgot the test; say so." | Blameless: record the condition that allowed it (no check, unclear spec, missing pitfall), never a person. |
| "We ran out of time; drop the remaining topics." | Unreached topics go to §Carried and open the next retro. |
| "That action from three retros ago still matters; keep it open." | Open for more than 2 later retros → Tech Lead ruling: do by a date, re-own or drop. |

## Critical Rules

- **NEVER** skip, merge away or postpone a due retro without reporting it overdue; never let a Release pass R9 with an overdue retro.
- **NEVER** let an agent own an action, decide the outcome, approve a recurrence control or commit the record.
- **NEVER** record a fact without a source, an estimate as a measurement, or `0` for something not checked.
- **NEVER** name a person as the cause of an observation, an incident or a missed indicator.
- **NEVER** record `accepted` from a missing or partial reading, or with an unfinished task, an AC without evidence or an open Critical.
- **NEVER** close an action (`RA-` or `PA-`) without a merged commit that changes its target file and carries its `Refs:` trailer.
- **ALWAYS** read the artifacts directly — ledger, PR body, approvals register, release notes, postmortems, git — never a summary from chat.
- **ALWAYS** give each Change item one cause tag and a 90-day seen-before lookup; on a second hit, require an automated control approved by someone other than the proposer.
- **ALWAYS** turn mechanical lessons into checks and judgment lessons into dated AGENTS.md pitfall lines; prefer the check when both fit.
- **ALWAYS** end the turn after presenting the draft; humans select Keep and Change items, own actions and decide the outcome.

## Example Usage

**1. Standard retro (worked example).** `specs/001-csv-export` reached 100% on 2026-12-01 → due 2026-12-08, 15 min. `run-ledger status` shows T2 and T3 at 3 rounds, 0 escalations; PR #138 triage: 1 Critical (F-1), 3 Important, 1 Minor. Seen-before lookup finds `test-gap` in `docs/retros/2026-11-13.md` while the pitfall from RA-20261113-2 was already in AGENTS.md → RA-20261208-1 adds a lint rule against mocking repositories, approved by the Tech Lead (proposer: the engineer). The security lesson C-2 is judgment → a pitfall line. Record: the worked example's `retro.md`.

**2. Quick batch.** Eleven days after the last batch retro, the tenth Quick PR merges. Kind Quick batch, due 5 business days later, 15 min, `Covers: Quick batch: #301, #304, … #322`. Facts are summed across the PRs; two hotfixes within 7 days share the cause tag `test-gap` → one check action. No indicator per item → `n/a — Quick items carry no indicator` unless the issue named one.

**3. Pressure to skip.** "Everything went fine — skip the retro and release the next item." Refused: R9 makes the next Release NO-GO while the retro is overdue. The agent drafts the facts in one pass, proposes a 15-minute agenda, and asks the Tech Lead to run it today.

**4. No indicator reading.** The help-desk dashboard is down 9 days after release; the Product Owner wants `accepted`. Indicator row `n/a — help-desk dashboard unavailable since 2026-12-10`; outcome `hold — next reading 2026-12-28`, carried; Change item `ops-signal` with an action restoring the export of the ticket count.

**5. Epic close.** Four Full specs of a multi-currency epic; the last reaches 100%. Full retro, 45 min. The epic view shows 021 and 023 each built a currency-rounding helper (duplicated solution, `design-gap`) and 022 waited 4 business days for the Design sign-off. Actions: an architecture test that fails when a second rounding helper appears; an AGENTS.md line naming the shared helper.

## References

| File | Load when |
|---|---|
| `references/evidence-gathering.md` | Step 2 — every retro; commands and sources for each fact, prior-action checks, Quick batch counter, cycle signals |
| `references/outcome-decision.md` | Step 3 — an indicator reading exists or is due; verdict, decision vocabulary and fail-safes |
| `references/epic-aggregate.md` | Step 4 — the last item of an epic, or a Full item delivered through several PRs |
| `references/action-rules.md` | Steps 6 and 8 — writing, classifying, checking and closing actions; recurrence lookup; escalation |
| `references/facilitation.md` | Steps 6 and 7 — agenda, timebox, blameless rules, decision recording, solo teams |
| `prompts/facts-drafter.md` | Step 2 — the fresh-context pass that drafts Prior actions, Facts and candidate Change items |
| `../agentic-sdlc/references/retrospective.md` | Any doubt about a bound, a deadline or a rule — the contract wins |
| `../agentic-sdlc/templates/retro.md` | Step 6 — the record format |

† Added in a later release of `agentic-sdlc`; manual fallback in `../agentic-sdlc/references/artifacts.md` §Later-release files.
