# Grilling Protocol — the Full Interview Primitive

Load this file at Step 1 of `SKILL.md` and keep it open for the whole interview. It defines how the decision tree is built, how the frontier is computed, how a question is written, how weak answers are pushed, and exactly when the interview stops.

## 1. The decision tree

Before the first question, build the tree silently (never show the raw tree unless asked):

```
Root: <subject — the plan, design, spec or idea>
├── [decided] Storage: Postgres (existing ADR 0004)
├── [open · decision · material] Invoicing: synchronous or event-driven?
│   ├── [open · decision] Retry owner for failed payments      (blocked by: Invoicing)
│   └── [open · fact] Provider webhook support for refunds      (lookup: docs/integrations/)
├── [open · decision · material] Currency: single or multi?
└── [assumed] "Customers have one billing contact"             (unstated — surface it)
```

Tag every node:
- **State:** decided (cite where) · open · assumed (relied on but never stated).
- **Kind:** **fact** (the environment answers it: code, config, docs, logs, data) or **decision** (a human chooses).
- **Weight:** **material** when the answer changes an acceptance outcome, the scope, or the handling of data (`../../agentic-sdlc/references/lifecycle.md` Specify row); otherwise deferrable.
- **Blocked by:** the nodes whose answers it depends on.

Use the categories in `question-bank.md` as a sweep: for each category, ask whether the subject has an open node there. A category with nothing open is recorded as `covered` in the closing summary.

## 2. The frontier

The **frontier** is every open node whose `blocked by` list is fully decided. Only frontier nodes may be asked; a question that depends on an unanswered one belongs to a later round.

- Facts on the frontier are looked up, never asked (§4).
- Decisions on the frontier go to the human in the next round.
- After each round, mark answers, add the new branches they open, and recompute.

## 3. Rounds and the one-decision rule

- **One decision per question.** A question that bundles two decisions ("which database and how do we migrate?") is split.
- **Round size:** the independent decision questions on the frontier, at most **4** per round.
- **One question at a time** when any frontier decision is weighty: a one-way door, a material item, a security boundary, or a topic the human has pushed back on. A weighty question goes alone in its round. In conversation mode, when the human answers tersely or asks for a slower pace, drop to one question per round.
- **Exhaust a thread** before opening an unrelated one: the next round follows the branches the last answers opened.

### Question format

```
❓ **Q1 — <short title>**: <question; options A / B / C when useful>
➡️ Recommended: <answer> — <one-line reason, citing evidence when it exists>
```

Word every question so that "yes" accepts the recommendation. Number questions continuously across rounds (Q1…Qn) so answers can be referenced later. Put the round header on top: `Round 2 of 3 — billing retries`.

### Question quality check (before sending)

| Check | Fails when |
|---|---|
| Decision, not fact | The repository, docs or a lookup could answer it |
| One decision | It contains "and" joining two choices |
| On the frontier | It depends on an answer not yet given |
| Has a recommendation | No `➡️ Recommended:` line, or the line hedges ("it depends") |
| Changes something | No answer would alter scope, an outcome, data handling, a risk, or an owner |
| Plain words | It uses process jargon the human did not use |

## 4. Facts are the agent's job

When a frontier node is a fact, find it:
1. Search the code, configs, `docs/`, `GLOSSARY.md`, ADRs, specs and git history.
2. For lookups that take more than a few searches, dispatch `../prompts/fact-lookup.md` to a subagent so the interview keeps moving; only questions downstream of the lookup wait. **If the platform has no subagents:** run the lookup in a separate pass between rounds, after the current round is sent, and label the result `self-lookup`.
3. Report each fact in one line with its source (`webhooks support refunds — docs/integrations/payments.md:41`) at the top of the next round.
4. A fact nobody can find (external system, undocumented behaviour) becomes a decision about how to find out, or an open question with an owner.

## 5. Decisions are the human's job

- Put each decision to the human with a recommendation and wait. Never decide on their behalf because the answer looks obvious.
- When the human accepts, record `accepted recommendation`; when they choose otherwise, record their choice and, when the agent disagrees, the risk in one line. Disagreement is recorded, not repeated.
- The human may answer "you decide": record `delegated to agent`, state the choice and its reason, and mark it for confirmation in the closing summary. A delegated material decision still needs the human's confirmation before the summary is handed off.

## 6. Pushing on weak answers

Weak reasoning gets one follow-up that asks for evidence, not agreement. Patterns:

| Weak answer | Follow-up |
|---|---|
| "It should be fine." | What would show it is fine — a test, a metric, a past incident? |
| "We'll handle that later." | Who owns it, and what breaks if later never comes? |
| "Users won't do that." | What stops them? If nothing does, what happens when one does? |
| "Same as last time." | Which system, which date, and what was different then? |
| "We'll just restore from backup." | When was a restore last tested, and how long did it take? |
| "Everyone knows what X means." | Define X in one sentence; does the code use the same meaning? |
| "It's only internal." | Who can reach it, and what data does it touch? |

If the follow-up gets the same answer, record it as an assumption in the human's words and move on. Do not ask a third time.

## 7. Domain-language moves (docs mode)

Run these while interviewing; they feed `capture.md`:
1. **Challenge against the glossary** — "GLOSSARY.md defines *cancellation* as X; this plan uses it as Y. Which one?"
2. **Sharpen fuzzy words** — "By *account*, the customer, the user login, or the billing profile?"
3. **Concrete scenario** — invent an edge case at a concept boundary ("a customer with two currencies cancels mid-cycle; what is invoiced?").
4. **Cross-check the code** — when the human states how something works, check the code; a contradiction is reported with `file:line` and becomes a question.

## 8. Stop conditions

The interview stops at the first of these:

| Stop condition | What happens |
|---|---|
| Frontier empty — every branch visited, nothing silently assumed | Confirm shared understanding, then the closing summary |
| Round limit reached (SDLC mode: 3 question rounds in the stage) | Announce it in round 3; open items become `deferred: <owner>` or the stage ends `NEEDS_CONTEXT` |
| The same question unanswered in 3 rounds (docs and conversation modes) | Record it as an open question with an owner; never ask it a fourth time |
| The human asks to stop ("stop asking", "just agree with me", "enough") | Stop asking at once. Agree to nothing that was not decided. Write the closing summary with every open item listed; material items are flagged |
| A blocking decision needs someone who is not present | Write a questionnaire for that person (§9); the item is `deferred: <role>` or, when material in SDLC mode, `NEEDS_CONTEXT` |
| The subject changes scope mid-interview (a new outcome appears) | Stop that branch; record the new item for `issue-triage` or `brainstorming`; continue only on the original subject |

**Material vs deferrable after the limit.** Deferrable: the build proceeds safely without the answer (alert channel name, copy wording, a dashboard location). Material: it changes an acceptance outcome, the scope or the handling of data (a row limit, who may export, whether personal data is logged). In SDLC mode a material item left open ends the stage with `NEEDS_CONTEXT`, names the missing answer and its owner, and no approval is requested (`../../agentic-sdlc/agents/analyst.md` §Failure behaviour).

## 9. Questionnaire for an absent owner

When a decision needs someone else's knowledge, interview the human only about the send — who the recipient is and what must come back — then write:

```markdown
# Questions for <role> — <subject>
**Purpose:** <the decision that rides on the answers>
**Context:** <one paragraph, no secrets or personal data>
**Answer by:** <date> · **Return to:** <person or issue link>

1. <question> — options: <A / B> — our recommendation: <answer, reason>
2. …
```

Save it in the issue or next to the closing summary; the open question points to it.

## 10. Anti-sycophancy

- No praise of the plan; the interview's job is to find what is missing.
- Agreement is never a deliverable. "Just agree with me" stops the questions; it does not turn open items into decisions.
- A recommendation is not softened after push-back unless new evidence arrives; record the human's choice and the residual risk.
- "Looks solid" appears only in the closing summary, and only with the list of categories covered.
