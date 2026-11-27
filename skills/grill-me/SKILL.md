---
name: grill-me
description: This skill should be used when the user explicitly asks to be grilled ("grill me", "grill me on this plan", PT "me grille") or agrees to the agentic-sdlc router's proposal to run it; it runs a relentless one-decision-per-question interview down every branch of a plan, design, spec or idea, gives a recommended answer with every question, looks up facts instead of asking, records glossary terms and ADR candidates, stops after 3 rounds per stage, and closes with a summary that feeds the spec. Not for stress-test, poke holes, devil's advocate, challenge, review or feedback requests that do not use the word "grill" (the Discover and Specify stages of the Agentic SDLC).
license: MIT
---

# Grill Me

## Purpose

**Agentic SDLC · Discover stage** (also runs in Specify to stress-test a spec, `ux.md` or design draft). Used by the Analyst (requirements interview and critique pass), the Product Manager (product critique) and the UX Designer (journey critique); the Product Owner makes the intake decision and signs off the spec that the summary feeds.

Stress-test a plan, design, spec or idea through relentless questioning until every branch of the decision tree is resolved and nothing is silently assumed. The division of labour is fixed: **the agent finds the facts; the human makes the decisions.** Every question carries a recommended answer, so the human can move fast by accepting and slow down only where they disagree.

Inside a repository the interview leaves a durable trail: settled vocabulary goes to `GLOSSARY.md` and hard-to-reverse decisions become ADR candidates. The closing summary is the raw material that `spec-driven-development` turns into `specs/NNN-slug/spec.md` in synthesize mode.

Contracts this skill follows and never contradicts:
- `../agentic-sdlc/references/lifecycle.md` — Discover and Specify rows (max 3 question rounds; open after the limit → `NEEDS_CONTEXT`, no approval request).
- `../agentic-sdlc/references/paths.md` — Quick, Standard and Full paths; Quick skips Specify.
- `../agentic-sdlc/references/artifacts.md` — `GLOSSARY.md` (written in Specify by `grill-me`) and §ADR.
- `../agentic-sdlc/templates/spec.md` — the sections the summary maps onto.
- `../agentic-sdlc/agents/analyst.md`, `../agentic-sdlc/agents/product-manager.md`, `../agentic-sdlc/agents/ux-designer.md` — who calls this skill and with which budget.
- `../agentic-sdlc/references/rules.md` — severity scale, dependency rule, no secrets.

## When to Use

Trigger **only** on an explicit request that uses the word "grill":
- "grill me on this", "grill me on my plan / architecture / design / spec"
- "I want to be grilled before I present this"
- PT: "me grille sobre esse plano"

Also run when:
- The `agentic-sdlc` router proposes it in Discover or Specify and the user agrees.
- The Analyst, Product Manager or UX Designer runs its critique pass on a draft and the user agrees to an interview.
- The Specify critique finds a material ambiguity that needs an interview rather than a single question.

Do **not** trigger for synonyms or near-misses, even when the intent looks similar: "stress-test this", "poke holes in my plan", "play devil's advocate", "challenge my assumptions", "pressure-test this", "review this", "give me feedback". Offer grill-me in one line instead and wait.

**Neighbouring skills:**

| Situation | Skill |
|---|---|
| The idea or solution shape is still open; options are needed, not interrogation | `brainstorming` |
| A request needs duplicate search, classification, path score and an intake decision | `issue-triage` |
| Decisions are made and a `spec.md` must be written, linted and approved | `spec-driven-development` |
| An architecture must be designed and ADRs written | `senior-solution-architect` |
| A finished diff needs review | not this skill — use the review flow of the Agentic SDLC |

## Workflow

### Step 0 — Read the subject, choose the mode and the budget

Read the plan, design, spec or idea. Inside a repository, read before asking: the relevant code, `GLOSSARY.md`, `docs/adr/`, `specs/*/spec.md`, `specs/*/ux.md`, the issue and intake record, any PM brief or discovery brief, and `docs/codemap.md` when present.

Choose the mode and state it in one line:

| Mode | When | Writes |
|---|---|---|
| **Conversation** | No repository, or the human declines files | Nothing; the summary is in the reply |
| **Docs** | Inside a repository, run by the human directly | `GLOSSARY.md` entries; ADR drafts with Status `Proposed` |
| **SDLC** | Invoked by the router, an agent role or `spec-driven-development` | `GLOSSARY.md` entries; ADR candidates listed (drafts only on request); summary to the issue or `specs/NNN-slug/` |

Set the budget. In SDLC mode the limit is **3 question rounds per stage**, shared with the calling agent's other questions in that stage: when the Analyst already used a round in Specify, grill-me has two left. State it: `SDLC mode · Specify · rounds available: 2 of 3`. In docs and conversation modes there is no round cap, but a question unanswered in 3 rounds is never asked a fourth time.

On the Quick path there is no Specify stage; grill-me runs only if the human asks, in docs or conversation mode, and its candidate criteria inform the acceptance test written in the issue.

### Step 1 — Map the decision tree (silent)

Load `references/grilling-protocol.md` and `references/question-bank.md`. Build the tree before the first question and keep it private unless asked:
- Decisions already locked in, each with where it is recorded (ADR, spec, issue).
- Open branches, tagged **fact** or **decision**, **material** or deferrable, and **blocked by** which other nodes.
- Unstated assumptions the plan relies on.

Sweep the question-bank categories (problem, users, scope and non-goals, data, failure modes, security, operations, cost, rollback, metrics, dependencies, vocabulary, experience). A category with nothing open is recorded as covered; one that does not apply is `n/a — <reason>`.

When grilling a spec draft in Specify, map it section by section using the spec-section table at the top of `question-bank.md`: each empty, vague or unmeasurable section becomes a node.

### Step 2 — Investigate facts before asking

For every frontier node tagged **fact**, find the answer in the environment: code, configuration, docs, ADRs, logs, git history. For lookups that take more than a few searches, dispatch `prompts/fact-lookup.md` to a read-only subagent so the interview keeps moving; only the questions downstream of that lookup wait. **If the platform has no subagents:** run the lookup in a separate pass between rounds and label the result `self-lookup`.

Report each fact in one line with its source at the top of the next round: `Webhooks already support refunds — src/payments/webhooks.ts:88`. A fact that contradicts what the human said becomes a question with the citation, never a silent correction. A fact nobody can find becomes an open question with an owner.

### Step 3 — Ask the frontier, round by round

The **frontier** is every open decision whose prerequisites are settled. Each round:
1. Put the round header on top: `Round 1 of 3 — invoicing model`.
2. List the facts found since the last round.
3. Ask the independent frontier decisions — **one decision per question, at most 4 per round**. When a frontier decision is weighty (a one-way door, a material item, a security boundary, or a topic the human pushed back on), it goes **alone**: one question at a time. In conversation mode, drop to one question per round when answers come back terse.
4. End the turn and wait.

Format, numbered continuously across rounds:

```
❓ **Q3 — Row limit**: Cap exports at 100,000 rows, or allow any size as a background job?
➡️ Recommended: Cap at 100,000 — the report API times out above ~120,000 rows (src/reports/query.ts:57).
```

Word every question so that "yes" accepts the recommendation. Before sending, run the quality check in `grilling-protocol.md` §3: a decision not a fact, one decision, on the frontier, a firm recommendation, an answer that would change something, plain words.

After the answers, mark each decision (`accepted recommendation`, `changed`, or `delegated to agent`), add the branches the answers opened, recompute the frontier, and follow the opened thread to its end before starting an unrelated one.

### Step 4 — Push back on weak answers

Weak reasoning gets one follow-up that asks for evidence, never for agreement. "It should be fine" → what would show it is fine. "We'll restore from backup" → when was a restore last tested. "Users won't do that" → what stops them. Patterns are in `grilling-protocol.md` §6.

If the follow-up gets the same answer, record it as an assumption in the human's words and move on; never ask a third time. When the human overrides a recommendation, record their choice and, if the risk is real, the risk in one line. Disagreement is recorded once, not repeated.

In docs mode also run the domain-language moves (`grilling-protocol.md` §7): challenge words against `GLOSSARY.md`, sharpen fuzzy terms, invent a concrete edge-case scenario at a concept boundary, and cross-check stated behaviour against the code.

### Step 5 — Capture vocabulary and decisions

Load `references/capture.md` the first time a term settles or a hard-to-reverse decision is made.
- **Glossary:** when a term is clarified, add or update the `GLOSSARY.md` entry — term, definition, aliases to avoid, one example, source. A word with two meanings is split into two terms, noting which one the code uses. Match the existing file's format first.
- **ADR candidates:** a decision that is expensive to reverse, or where at least two options were seriously compared (the rule in `../agentic-sdlc/references/artifacts.md` §ADR), is captured as a candidate row. In docs mode, draft `docs/adr/NNNN-slug.md` with Status `Proposed`. In SDLC mode, list candidates in the summary for the Architect, who writes and finalizes ADRs in Design; draft a file only when the human asks.
- Show every write in one line. Commit nothing without the human's go-ahead. No secrets, personal data or client data in any captured file.

### Step 6 — Apply the stop rule

The interview stops at the first stop condition (`grilling-protocol.md` §8):

| Stop condition | Then |
|---|---|
| Frontier empty: every branch visited, nothing silently assumed | Step 7 |
| SDLC mode: 3 question rounds used in the stage | Each open item becomes `deferred: <owner>` when the build proceeds safely without it; any **material** item (changes an acceptance outcome, the scope or data handling) ends the stage `NEEDS_CONTEXT`, names the missing answer and its owner, and no approval is requested |
| Docs or conversation mode: the same question unanswered in 3 rounds | Open question with an owner; never asked a fourth time |
| The human asks to stop ("stop asking", "just agree with me", "enough") | Stop asking at once; agree to nothing undecided; Step 7 with every open item listed and material ones flagged |
| A blocking decision needs someone who is not present | Write the questionnaire in `grilling-protocol.md` §9; the item is `deferred: <role>` or `NEEDS_CONTEXT` when material |
| A new outcome appears mid-interview | Record it for `issue-triage`; continue on the original subject |

Announce the last round before asking it: `Round 3 of 3 — open items after this are deferred with an owner or stop the stage.` A round in which every question is answered still counts as a round.

### Step 7 — Confirm shared understanding and close

Load `references/closing-summary.md`.
1. Play back the decisions in at most 10 lines and ask: "Is this what we agreed? Reply yes or correct any line." End the turn. Skip only when the human stopped the interview, and say so.
2. Write the closing summary in the contract's order: header (subject, mode, rounds used `n of 3`, ended by, shared understanding in the human's exact words, status); decisions confirmed; decisions changed; assumptions; open questions classified `deferred: <owner>` or `material — NEEDS_CONTEXT`; risks with severity; candidate acceptance criteria in Given/When/Then without `AC-n` IDs, including unhappy paths; category coverage; glossary terms and ADR candidates; hand-off.
3. Set the status: `DONE`, `DONE_WITH_CONCERNS`, `NEEDS_CONTEXT` or `BLOCKED`. A human stop with a material item open is never `DONE`.
4. Hand off. In SDLC mode the summary goes to the issue or `specs/NNN-slug/grill-summary.md` and on to `spec-driven-development` in synthesize mode; deferred items go to the spec's Open questions unchanged; a `NEEDS_CONTEXT` ending stops the stage until the named owner answers. When an agent role dispatched the skill, open the reply with the report contract line from `../agentic-sdlc/references/agents.md` (`**Agent:** … · **Status:** …`). Outside the SDLC, ask what the human wants next and do nothing until they choose.

**Close.** End with the `status.mjs --next` output.

## Anti-Rationalization

| Excuse | Reality |
|---|---|
| "The answer is obvious; decide it and save a round." | Obvious to the agent is a recommendation, not a decision. Ask with the recommendation; "yes" costs the human one word. |
| "Asking is faster than searching the code." | A fact asked is a round wasted and a chance for a wrong answer. Look it up; cite `file:line`. |
| "Bundle these two related questions into one." | Two decisions in one question get one answer for both. Split them. |
| "Ask everything at once to finish sooner." | Dependent questions asked early get guessed answers. Only the frontier, at most 4, weighty ones alone. |
| "The user said 'just agree with me', so agree." | Stop asking at once, but agreement is not a deliverable. Summarize with open items flagged; material ones end `NEEDS_CONTEXT`. |
| "A fourth round would settle it." | The budget is 3 per stage. Defer with an owner, or stop with `NEEDS_CONTEXT`. |
| "This material gap can be deferred to keep moving." | Material means it changes an outcome, the scope or data handling. Deferring it silently ships a guess. |
| "'It should be fine' is good enough from a senior person." | Seniority is not evidence. One follow-up asking what would show it; then record it as an assumption. |
| "Draft the ADR as Accepted; the decision is clear." | ADRs are `Proposed` until the Design sign-off; in SDLC mode the Architect owns them. |
| "The plan looks good; say so up front." | Praise anchors the interview. Coverage is reported only in the closing summary. |
| "They said 'challenge my assumptions'; close enough to grill." | The trigger is explicit. Offer grill-me in one line and wait. |

## Red Flags — Stop and Correct

- A question without a `➡️ Recommended:` line, or a recommendation that says "it depends".
- A question the repository could answer.
- A round that asks something blocked by an unanswered question.
- A fourth round in SDLC mode, or a question repeated for the fourth time.
- An undecided item written as decided in the summary.
- `AC-n` IDs in the candidate criteria, or an approval request at the end of a `NEEDS_CONTEXT` summary.
- A captured glossary term or ADR containing a secret, a real customer name or personal data.

## Critical Rules

- **NEVER** trigger without an explicit "grill" request or the user's agreement to the router's or an agent's proposal.
- **NEVER** ask a question the code, docs or a lookup can answer; facts are the agent's job.
- **NEVER** decide for the human; decisions are the human's job, even when a recommendation is accepted by default.
- **NEVER** put two decisions in one question, or dependent questions in the same round.
- **NEVER** run a fourth question round in a stage in SDLC mode, or ask an unanswered question a fourth time in any mode.
- **NEVER** defer a material item silently; it ends the stage `NEEDS_CONTEXT` with no approval request.
- **NEVER** treat "just agree with me" as agreement; it is a stop request.
- **NEVER** assign `AC-n` IDs, approve a spec or mark an ADR `Accepted`; those belong to the spec, the Product Owner and the Design sign-off.
- **ALWAYS** give a recommended answer with every question, worded so "yes" accepts it.
- **ALWAYS** follow a thread to its end before opening an unrelated one.
- **ALWAYS** surface assumptions the plan relies on but never states.
- **ALWAYS** confirm shared understanding before handing off or acting on the outcome.
- **ALWAYS** keep secrets, personal data and client data out of `GLOSSARY.md`, ADRs and summaries; write repository files in English.

## Example Usage

**1. Architecture, docs mode**
> "Grill me on the architecture for the new billing service."

Docs mode. Reads the repository, `docs/adr/` and `GLOSSARY.md`. Round 1 asks Q1 alone — synchronous or event-driven invoicing (one-way door, recommended: event-driven, because the provider already retries webhooks) — while a subagent checks refund webhook support. Round 2: Q2 single or multi-currency, Q3 who owns failed-payment retries. Drafts ADR 0012 (event-driven invoicing, Proposed) and splits "account" into *Customer Account* and *Billing Profile* in `GLOSSARY.md`. Closes with eight candidate acceptance criteria and status `DONE`.

**2. Migration plan, conversation mode**
> "Grill me on my plan to move from Heroku to AWS — no repo, it's just a doc."

Conversation mode, nothing written. Rounds on cutover strategy, data-migration downtime, DNS rollback and a cost ceiling. "We'll just restore from backup" gets one follow-up — when was a restore last tested and how long did it take? The answer "never" is recorded as an assumption with the risk, and a restore rehearsal becomes an open question owned by the platform lead.

**3. Inside the Agentic SDLC, Specify**
> Router: "Open decisions remain on the export feature. Run grill-me?" User: "Yes, grill me."

SDLC mode, `rounds available: 3 of 3`. Round 1 settles file format and the permission model; round 2 the row limit (the Product Owner changes the recommended 100,000 to 50,000); round 3 asks for the alert channel, which the Product Owner cannot answer. The summary records `Alert channel — deferred: SRE lead`, status `DONE`, and goes to `spec-driven-development` in synthesize mode, which carries the item into Open questions unchanged.

**4. Pressure: "just agree with me"**
> After round 1 on an audit-log feature: "Stop asking questions, just agree with me and write it up."

Stops asking immediately. Does not mark the open items as decided. The summary lists two confirmed decisions, one deferrable item (`log viewer page size — deferred: UX Designer`) and one material item: whether request bodies with personal data are stored in the log. Status `NEEDS_CONTEXT`, missing answer and owner (Product Owner with the Security Auditor) named, no approval requested. One line offers to resume with that single question.

**5. Portuguese trigger, carve-out**
> "Me grille sobre esse plano de carve-out antes de eu escrever o plano."

Runs the interview in Portuguese, writes any repository file in English. Focus: separation sequencing, shared services and ownership of the transition service agreement. A decision that needs the finance controller produces a questionnaire (`grilling-protocol.md` §9) and a `deferred: finance controller` item.

**6. Go-to-market plan**
> "Grill me on this go-to-market plan."

Conversation mode; rounds on target segment, pricing hypothesis, channel, success metric with baseline and target, and what result would make the plan be abandoned. Coverage marks security and rollback `n/a — no software change`.

## References

| File | Load when |
|---|---|
| `references/grilling-protocol.md` | Step 1 — decision tree, frontier, question format and quality check, weak-answer follow-ups, domain-language moves, stop conditions, questionnaire for an absent owner |
| `references/question-bank.md` | Step 1 and whenever a round runs short — 13 categories with look-up-first facts, questions, recommendation patterns, material signals and the spec-section map |
| `references/capture.md` | Step 5 — `GLOSSARY.md` entry format, ADR candidate rule and draft format, what each mode may write |
| `references/closing-summary.md` | Step 7 — closing summary contract, status rules, mapping to `spec.md`, worked example |
| `prompts/fact-lookup.md` | Step 2 — read-only subagent brief for a fact lookup, with the no-subagent fallback |
| `../agentic-sdlc/references/lifecycle.md` | Discover and Specify rows: round limit and `NEEDS_CONTEXT` behaviour |
| `../agentic-sdlc/references/artifacts.md` | `GLOSSARY.md` row and §ADR |
| `../agentic-sdlc/templates/spec.md` | Sections the summary feeds |

## Credits

Built on Matt Pocock's `grill-me`, `grilling`, `grill-with-docs` and `domain-modeling` skills (MIT) and Addy Osmani's `interview-me` (MIT). Full attribution in `README.md` §Influences.
