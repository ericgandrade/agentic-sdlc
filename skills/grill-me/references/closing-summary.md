# Closing Summary — Contract

Load this file at Step 7 of `SKILL.md`. Every grilling session ends with this summary, including sessions stopped early by the round limit or by the human. It is the raw material `spec-driven-development` reads in synthesize mode, so its sections map one-to-one onto `spec.md` (table at the end). The summary records; it never approves.

## 1. Before writing it

1. Confirm shared understanding in one message: a playback of the decisions in at most 10 lines, ending with "Is this what we agreed? Reply yes or correct any line." End the turn. Skip this only when the human stopped the interview, and say it was skipped.
2. Re-check every decision against the code and docs cited during the interview; a contradiction found now becomes an open question.
3. Classify every open item as `deferred: <owner>` or `material — NEEDS_CONTEXT` (definitions in `grilling-protocol.md` §8).

## 2. Required sections, in order

```markdown
# Grill-me summary — <subject>

| Field | Value |
|---|---|
| Subject | <plan, design, spec path or idea> |
| Mode | conversation · docs · SDLC (<stage>) |
| Rounds used | <n> of 3 (SDLC mode) · <n> (other modes) |
| Ended by | frontier empty · round limit · human stop · absent owner |
| Shared understanding | confirmed "<exact words>" · not confirmed — <reason> |
| Status | DONE · DONE_WITH_CONCERNS · NEEDS_CONTEXT · BLOCKED |

## Decisions confirmed
| # | Decision | Decided by | Recommendation | Source |
|---|---|---|---|---|
| 1 | <decision> | <role> | accepted · changed (<recommended answer>) · delegated to agent | Q<n> |

## Decisions changed during the interview
- <earlier position> → <new decision> — why (Q<n>)

## Assumptions
| Assumption | Stated by | Evidence | Status |
|---|---|---|---|
| <assumption> | human · surfaced by agent | <file:line or "none"> | accepted risk (<exact words>) · to check (<owner>) |

## Open questions
| Question | Owner | Classification | Due |
|---|---|---|---|
| <question> | <role> | deferred: <owner> · material — NEEDS_CONTEXT | <YYYY-MM-DD> |

## Risks
| Risk | Severity | Mitigation | Owner |
|---|---|---|---|
| <risk> | Critical · Important · Minor | <mitigation or "none yet"> | <role> |

## Candidate acceptance criteria
- Given <context>, when <action>, then <observable outcome>. (Q<n>)
- Unhappy path: <invalid input · missing permission · empty state · limit> → <outcome>. (Q<n>)

## Coverage
Categories: <coverage line from question-bank.md>

## Vocabulary and decisions captured
- GLOSSARY.md: <terms added or updated> · or "candidates only (conversation mode)"
- ADR candidates: <table from capture.md §3> · drafted: <docs/adr/NNNN-slug.md, Proposed> · or "none"

## Hand-off
- Next: <skill or role> — reads this summary in <mode>
- Questionnaires sent: <path or issue link> · or "none"
```

## 3. Status rules

| Status | When |
|---|---|
| `DONE` | Frontier empty or every open item deferrable with an owner; shared understanding confirmed |
| `DONE_WITH_CONCERNS` | Done, but with accepted risks, delegated decisions awaiting confirmation, or shared understanding not confirmed because the human stopped |
| `NEEDS_CONTEXT` | At least one material item is open after the round limit, or after the human stopped; the summary names the missing answer and its owner, and no approval is requested |
| `BLOCKED` | The subject cannot be grilled: the plan or spec is missing, or the only person who can decide is unreachable and no owner can be named |

A human stop ("stop asking, just agree with me") never yields `DONE` when material items remain open, and the summary never marks an undecided item as decided.

## 4. Writing rules

- Candidate acceptance criteria carry **no** `AC-n` IDs; the spec assigns them. One behaviour per line; cover unhappy paths.
- Every decision cites the question that settled it (`Q<n>`), so the Analyst can trace it.
- Severity uses the shared scale (`../../agentic-sdlc/references/rules.md`): Critical blocks Test and Release sign-off and cannot be deferred; Important is fixed, or deferred only with owner acceptance and a follow-up issue; Minor goes to the deferred list.
- Owners are roles (Product Owner, Tech Lead, SRE lead, Security Auditor), with a person's name only when the human gave it.
- No secrets, personal data or client data; synthetic examples only.

## 5. Where it goes

| Mode | Location |
|---|---|
| Conversation | In the reply only |
| Docs | In the reply, and saved where the human asks (default: next to the plan or design that was grilled) |
| SDLC | Comment on the tracker issue, or `specs/NNN-slug/grill-summary.md` when there is no tracker; linked from the spec's Revision log entry ("first draft from issue #412 and the grill-me summary") |

## 6. Mapping to spec.md

| Summary section | `spec.md` section (`../../agentic-sdlc/templates/spec.md`) |
|---|---|
| Decisions confirmed (scope, users, limits) | Stories, Constraints |
| Candidate acceptance criteria | Acceptance criteria (the Analyst assigns AC-n) |
| Decisions on exclusions | Non-goals |
| Security answers, data classes | Security notes |
| Rollback answers | Rollback |
| Metric, alert and owner answers | Release & observability, Indicator |
| Open questions — deferred | Open questions (`deferred: <owner>`, unchanged) |
| Open questions — material | Nothing: the stage stops with `NEEDS_CONTEXT` until the owner answers |
| Assumptions — accepted risk | Approval request residual risks |
| Glossary terms | `GLOSSARY.md` |
| ADR candidates | Design stage, Architect (`senior-solution-architect`) |

## 7. Worked mini-example

```markdown
# Grill-me summary — CSV export of filtered reports
| Mode | SDLC (Specify) | Rounds used | 3 of 3 | Ended by | round limit |
| Shared understanding | confirmed "yes, that's it" | Status | DONE |

## Decisions confirmed
| 1 | Format CSV, UTF-8 with BOM | Product Owner | accepted | Q1 |
| 2 | Managers only; others get 403 with message | Product Owner | accepted | Q2 |
| 3 | Row limit 50,000; above it, a message, no partial file | Product Owner | changed (recommended 100,000) | Q4 |

## Open questions
| Alert channel for export failures | SRE lead | deferred: SRE lead | 2026-12-01 |

## Candidate acceptance criteria
- Given a manager with a filtered report of 1,200 rows, when they export, then a CSV with 1,200 rows and the visible columns downloads. (Q1)
- Unhappy path: a viewer requests an export → 403 with "Export is available to managers". (Q2)
- Unhappy path: 50,001 rows → message "Narrow the filter to 50,000 rows or fewer"; no file. (Q4)
- Cells starting with =, +, - or @ are prefixed with a quote. (Q3)

## Hand-off
- Next: spec-driven-development — synthesize mode
```
