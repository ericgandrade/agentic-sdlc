# Discovery Brief — {{topic}}

<!--
Template for the discovery brief written by the brainstorming skill (Step 8). It is the hand-off from
Discover to Specify: spec-driven-development reads it in synthesize mode and maps each section to
spec.md (table at the end). Location, in this order:
  1. the project's existing convention for briefs or design notes, when Step 0 found one;
  2. a comment on the tracker issue (next to the intake record and the PM brief);
  3. specs/NNN-slug/brief.md once the item has a spec folder, or when there is no tracker.
Short brief (small change): fill Problem, Outcome and indicator, Chosen direction, Alternatives,
Not doing, Open questions and Agreement; write "n/a — short brief" in the other sections.
Never put secrets, credentials, personal or client data in this file; synthetic examples only.
This brief does not assign AC-n IDs: the spec owns them.
-->

| Field | Value |
|---|---|
| Issue | {{tracker link or "none — standalone"}} |
| Date | {{YYYY-MM-DD}} |
| Run by | {{Analyst \| Product Manager \| UX Designer}} |
| Size | {{short brief \| full brief}} |
| Intake | {{intake record link}} or {{not yet triaged — hand to issue-triage}} |
| Path score | {{score line from issue-triage, e.g. "Path: Standard · S=5 · R=1 (money)"}} or {{not yet scored}} |
| Techniques used | {{e.g. five whys, HMW, SCAMPER, reverse brainstorm, pre-mortem}} |

## Problem

**How might we** {{outcome}} for {{user}} {{without | while}} {{tension}}?

Evidence: {{ticket count, metric, quote, log query — or "n/a — <how to measure>"}}

## Users and jobs

- {{user or actor, with the role or permission that matters}}
- Job story: When {{situation}}, I want to {{motivation}}, so I can {{outcome}}. Workaround today: {{workaround}}.

## Why now

{{What changed; the cost of leaving it alone (cost of delay).}}

## Outcome and indicator

| Indicator | Baseline | Target | Method |
|---|---|---|---|
| {{name}} | {{number + unit, date}} or {{to measure before release}} | {{number + unit}} | {{query or source}} |

Priority call (Product Manager, when triggered): {{value · urgency · cost of delay — one line}}

## Chosen direction

{{One paragraph: what will be built and why this option over the others. Name the recommendation
and the human's choice separately when they differ.}}

## Alternatives considered

| Option | Total | Door | Why not | Condition that would change the decision |
|---|---|---|---|---|
| {{option}} | {{weighted total}} | {{two-way \| one-way}} | {{kill criterion K# or trade-off}} | {{condition}} |

## Key assumptions

Audit: {{fresh-context subagent \| self-audit}}

| # | Assumption | Tier | Check | Result or owner + due date |
|---|---|---|---|---|
| A1 | {{assumption}} | {{leap of faith \| testable \| safe}} | {{cheapest check}} | {{result pasted}} or {{owner · YYYY-MM-DD}} |

## Prototype outcome

{{n/a — settled on paper}} or:
- Question: {{question}} · Branch: {{UI \| logic}} · Timebox: {{hours}}
- Verdict: {{proven \| disproven \| conditional (condition)}}
- Learned: {{bullets}} · Faked: {{bullets}}
- Keep: {{none \| snippet that encodes a decision}} · Pointer: `prototype/{{slug}}` at {{commit}}

## Design outline

<!-- Scale each part to its complexity: a sentence when obvious, up to ~250 words when nuanced. -->

- Components: {{new or changed parts, with file references}}
- Data flow: {{inputs → processing → outputs}}
- Error handling: {{failure cases and the user-visible result}}
- Experience: {{surfaces touched; "n/a — no user-facing surface"}}
- Testing approach: {{the seam where behaviour is proven}}
- Rollout: {{flag default off \| staged 1% → 10% → 100% \| direct}}

## Candidate outcomes for the spec

<!-- Observable statements the Analyst turns into AC-n in spec.md. No AC IDs here. -->

- Given {{context}}, when {{action}}, then {{observable outcome}}.
- Unhappy path: {{invalid input \| missing permission \| empty state \| limit}} → {{outcome}}

## Not doing (and why)

- {{item a reader would reasonably expect}} — {{reason}}

## Risk signals

{{Risk triggers this direction adds (auth, personal or health data, money, public API, schema or
migration, irreversible, regulated) and expected file count — for issue-triage to re-score the path;
or "none beyond the scored path".}}

## Glossary candidates

- **{{Term}}**: {{definition in one sentence}} · Avoid: {{aliases}}

## Open questions

- {{question}} — owner: {{role}} · due {{YYYY-MM-DD}}

## Agreement

<!-- Brief agreement is not one of the four sign-offs and never replaces the Specify sign-off.
Only an explicit "yes" (or "agreed") in a later turn than the request counts. -->

| Date | Role | Person | Exact words | Decision |
|---|---|---|---|---|
| {{YYYY-MM-DD}} | {{Product Owner \| requester}} | {{name}} | "{{quote}}" | {{agreed \| agreed with changes \| rejected}} |

## Mapping to spec.md

| Brief section | `spec.md` section (`templates/spec.md` of the agentic-sdlc skill) |
|---|---|
| Problem + Evidence | Problem |
| Users and jobs | Users, Stories |
| Outcome and indicator | Indicator |
| Experience line | Experience |
| Candidate outcomes | Acceptance criteria (Analyst assigns AC-n) |
| Not doing | Non-goals |
| Design outline → Rollout | Release & observability (Rollout), Rollback |
| Risk signals | header Risk; Security notes |
| Intake, Path score | header Intake, Path, Size, Risk |
| Open questions | Open questions (`deferred: <owner>`) |
| Glossary candidates | `GLOSSARY.md` (written in Specify) |
