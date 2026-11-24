# Prompt — Assumption Audit (fresh context)

Use in Step 5 of `SKILL.md`, after the human has picked a direction and before the brief is written. The audit runs in a fresh context so the reader has not absorbed the conversation's optimism. It finds what must be true for the direction to work and how to check each item cheaply.

**Dispatch.** Send the brief below to a subagent with read-only access to the repository. **If the platform has no subagents:** clear working notes, then run the prompt yourself in a separate labelled pass (`self-audit`), reading only the inputs listed in the brief, not the conversation. Record the label in the brief's Assumptions section.

**Inputs to paste** (no conversation transcript, no secrets, no personal data):
1. The HMW statement and the indicator (baseline, target, method).
2. The chosen direction (one paragraph) and the design outline so far.
3. The rejected options with one-line reasons (so the audit does not reopen them).
4. Constraints: the AGENTS.md block, `CONSTRAINTS.md` lines that apply, Accepted ADRs that apply.
5. The evidence already gathered (file references, metrics, ticket counts).

---

```text
ROLE
Act as an independent product and engineering reviewer who has never seen this idea before.
Goal: list the assumptions this direction depends on, rate them, and propose the cheapest check
for each. Do not redesign the solution and do not reopen the rejected options listed below.

PROBLEM (HMW)
<paste>

INDICATOR
<name · baseline · target · method>

CHOSEN DIRECTION
<paste one paragraph>

DESIGN OUTLINE
<paste>

REJECTED OPTIONS (settled — do not reopen)
<option — reason>

CONSTRAINTS AND DECISIONS IN FORCE
<paste the applicable lines>

EVIDENCE ALREADY GATHERED
<paste>

PROCEDURE
1. Read the repository areas named in the design outline. Prefer evidence from files over guesses;
   cite file:line for every claim about the code.
2. Sweep six categories: users, value, technical, data, operations, legal/compliance.
   For each, ask: what must be true for this direction to move the indicator?
3. For each assumption, rate:
   - impact if false: high (direction fails or causes harm) | low (a detail changes)
   - evidence today: strong (cited) | weak | none
   - tier: leap of faith (high impact, weak or no evidence) | testable (check costs ≤ 1 day) | safe (strong evidence)
4. Propose the cheapest check that would change confidence: a query, a log search, five user
   conversations, a 2-hour spike, a document lookup. State the expected result that would
   falsify the assumption.
5. Flag any assumption whose failure would be Critical: data loss, security exposure,
   irreversible change, a regulatory breach.
6. Flag new risk triggers the direction introduces: auth, personal or health data, money,
   public API, schema or migration, irreversible, regulated.
7. Stop at 12 assumptions. Rank by impact × lack of evidence. Skip wording nitpicks and items
   the builder can decide later.

RETURN EXACTLY THIS SHAPE
## Assumptions
| # | Assumption | Category | Impact if false | Evidence today | Tier | Cheapest check | Falsified if |
|---|---|---|---|---|---|---|---|

## Critical if false
- <# — why>   (or "none")

## New risk triggers
- <trigger — where it enters>   (or "none")

## Status
DONE | DONE_WITH_CONCERNS (<concern>) | NEEDS_CONTEXT (<missing input>)
```

---

## Using the result

- Merge the returned table into the brief's Key assumptions section; keep the `#` order.
- Every **leap of faith** needs, before brief agreement: a check that was run (paste the result), a prototype card (`../references/prototyping.md`), or an open question with an owner and a due date.
- Any **Critical if false** item without a check or mitigation is raised to the human in the next decision round; it may trigger kill criterion K6 in `../references/refinement-criteria.md`.
- **New risk triggers** go to the brief's Risk signals line so `issue-triage` re-scores the path (route up, never down).
- An audit that returns `NEEDS_CONTEXT` names the missing input; supply it from the repository when possible, otherwise ask the human in the next round.
