# Readiness criteria

Load this file at Step 6 of the workflow, before setting an item to `ready`. An item is ready when the next stage can start without asking the reporter anything that triage could have collected. Quick items go to Build after `AC-1` is in the issue; Standard and Full items go to Specify (`spec-driven-development`).

## 1. Triage states

Every item carries exactly one state label. Map each state to the project's existing label when one exists, and record the mapping once in the AGENTS.md block notes.

| State | Meaning | Leaves by |
|---|---|---|
| `needs-triage` | Received, no intake record yet | Triage pass |
| `needs-info` | Readiness fails on information only the reporter or an owner can give | Reporter reply → back to `needs-triage` (resume, never re-ask answered questions) |
| `awaiting-intake-decision` | A match (exact, prior rejection, overlap) needs the Product Owner | Product Owner decision in a later turn |
| `ready` | All criteria below pass; path scored | Specify (Standard/Full) or Build (Quick) |
| `duplicate` | Product Owner confirmed `duplicate of #n` | Closed with a link; new facts copied to #n |
| `out-of-scope` | Product Owner rejected; record in `docs/out-of-scope/` | Closed; revisit trigger in the record |
| `implemented` | Behaviour already exists | Closed with the code path or release |

A conflicting pair of state labels on one item → flag it in the report and ask the Product Owner; never pick one silently.

## 2. Criteria for every path

| # | Criterion | Pass when | Fails into |
|---|---|---|---|
| G1 | Source | Link to the issue, the requester's message, the postmortem (`docs/postmortems/…`), the ops record or the retro action `RA-YYYYMMDD-n` | needs-info |
| G2 | Problem | One sentence naming the affected user or operator and the evidence (count, metric, quote, alert reading); an unknown number written `n/a — <how to measure>` | needs-info |
| G3 | Search | `Search:` line present (terms, sources, hit counts) | not ready (triage incomplete) |
| G4 | Intake | `n/a — <reason>`, or a recorded Product Owner intake decision | awaiting-intake-decision |
| G5 | Class | One of bug, task, story, epic, with the deciding evidence | not ready |
| G6 | Score | `Path: … · S=n · R=n (triggers)`, or `Path: Standard · default: inputs missing (<input>)` | not ready |
| G7 | Indicator | Baseline + target + method; or baseline `to measure before release`; for a task with no user effect, `n/a — internal task` | Standard/Full: needs-info to the Product Manager |
| G8 | Sensitive data | No secret, personal or health data pasted into the item; logs and screenshots redacted | Redact first, then continue |

## 3. Additional criteria by path

| Path | Criterion | Pass when |
|---|---|---|
| Quick | Q1 Acceptance test | `AC-1` in Given/When/Then with concrete values in the issue (the Analyst writes it; the requester confirms it) |
| Quick | Q2 Bug evidence | Bugs: steps, observed vs expected, version or environment; verification status `reproduced` or `plausible: <code path>` |
| Quick | Q3 Files named | ≤ 3 files expected, named by path or module |
| Standard | S1 Users | Each affected user or actor named with the role or permission that matters |
| Standard | S2 PM brief | Present when the Product Manager trigger fires (new feature or changed outcome) |
| Standard | S3 Owner | Product Owner named (role + person) for the Specify sign-off |
| Standard | S4 Open questions | Listed as precise questions, each with an owner; none blocks drafting the spec |
| Standard | S5 Specialist triggers | UX Designer (user-facing surface), Security Auditor (R ≥ 1), Architect (schema, public API, new component) marked yes/no |
| Full | F1 Split | Epic split into children (`references/classification.md` §4), or a recorded reason why the item is one goal |
| Full | F2 Risk evidence | Each risk trigger with the reason it applies to the expected diff |
| Full | F3 Regulation | Every regulation or contract clause named by a human; an obligation nobody named is an open question, never an assumption |
| Full | F4 Owners | Product Owner, Tech Lead and Release Owner named |

## 4. What the Specify stage needs from triage

`spec-driven-development` reads the intake record directly; nothing is paraphrased between stages. The mapping:

| Spec field (`../../agentic-sdlc/templates/spec.md`) | Comes from |
|---|---|
| Header `Path`, `Size`, `Risk` | Score line and the size/risk rows |
| Header `Issue` | G1 source link |
| Header `Intake` | G4 — copied exactly; `spec-lint` rule H07 accepts `n/a — <reason>`, `duplicate of #n` or `prior rejection #n — <why this differs>` |
| `## Problem` | G2 and the PM brief |
| `## Users` | S1 |
| `## Indicator` | G7 / PM brief |
| `## Non-goals` | PM brief non-goals; overlap rulings ("export of invoices stays in #88") |

## 5. Needs-info rules

- Ask only what the reporter or an owner must decide or knows uniquely. Look up anything the repository, tracker or logs can answer before asking (facts are the agent's job; decisions are the human's).
- ≤ 5 questions per reply, each answerable in one line, each naming who should answer.
- Always state what is already established, so progress is not lost.
- No reply after 14 calendar days → one reminder. No reply after 28 → propose closing to the Product Owner as `needs-info: no reply`; the item reopens when the reporter answers.
- `from-production` items never wait on needs-info past the 2-business-day triage bound: score with the inputs available (missing inputs → Standard, `default: inputs missing`) and list the open questions in the intake record.

## 6. Readiness verdicts (examples)

| Item | Verdict | Why |
|---|---|---|
| "Export is broken" (no steps, no version) | needs-info | G2, Q2 fail |
| "Date column shows UTC" with steps, AC-1 written, S=3 R=0 | ready → Build | All G and Q pass |
| "Add customer email to export", PM brief present, R=2 | ready → Specify (Full) | G, S and F pass; Security Auditor marked yes |
| Indicator miss on export usage, no baseline method | needs-info to the Product Manager | G7 fails |
| "Dark mode" matching `docs/out-of-scope/dark-mode.md` | awaiting-intake-decision | G4 |

## Sources

Adapted from Matt Pocock's skills (MIT) triage states and needs-info practice, BMad Method's (MIT) ready-for-development standard and assumption discipline, and Addy Osmani's agent-skills (MIT) intent restate. Text is original.
