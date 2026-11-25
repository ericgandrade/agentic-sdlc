# Prototyping Guidance — UI Prototype vs Logic Spike

Load this file in Step 6 of `SKILL.md`, when an assumption or a design question cannot be settled on paper. A prototype is throwaway code that answers **one** question. The answer goes into the brief; the code does not go into the main branch.

## 1. Paper or prototype?

Prototype only when all three hold:

1. The question changes the chosen direction or an expected outcome (it is not curiosity).
2. Discussion has not settled it: one round of options or sketches left the human unsure, or the answer depends on how something feels or performs.
3. A prototype answers it within the timebox (§3).

Otherwise settle it on paper: an ASCII sketch, a state table, a sequence of example inputs and outputs, or a query run against staging data.

## 2. Choose the branch: UI or logic

| The question sounds like | Branch | Shape |
|---|---|---|
| "What should this look like?" "Which layout makes the next step obvious?" | **UI prototype** | 3 structurally different variants (cap 5) behind a switch |
| "Does this state model hold?" "Which transitions are legal?" "Is this calculation right for these cases?" "Is this fast enough?" | **Logic spike** | A pure module plus a small harness that runs scenarios |
| Ambiguous and the human is not reachable | Default by surrounding code: page or component → UI; backend module, job or data model → logic | State the assumption at the top of the prototype |

### UI prototype

- Prefer rendering the variants on an **existing** route or screen, gated by a query parameter or local switch (`?variant=b`), keeping real navigation, real (synthetic) data and the surrounding chrome. An empty throwaway page hides design problems such as long names, empty states and permissions.
- Last resort: a throwaway route or story whose path contains `prototype`.
- Variants differ in structure: layout, information hierarchy, primary action. Colour or copy tweaks do not count as variants.
- Cover the states the UX Designer will later need: empty, loading, success, partial or limit, error, no permission (`../../agentic-sdlc/templates/ux.md`). A variant that only shows the happy state answers half the question.
- Platform without a UI runtime → ASCII wireframes, one per variant, at most 15 lines each.

### Logic spike

- Write the question in a visible paragraph at the top of the file.
- Isolate the logic as a pure, liftable unit: a reducer `(state, action) → state`, an explicit state machine (when the legality of transitions is the question), or pure functions over a data type. No UI, network or database inside it.
- Drive it with a small harness: a script or a single self-contained page that runs named scenarios and prints the resulting state or timing. Scenarios come from real cases described in the issue, with synthetic data only (`../../agentic-sdlc/references/rules.md` rule 7).
- Performance questions: state the number before running ("p95 ≤ 800 ms for 50,000 rows") and measure on representative synthetic volumes.

## 3. Timebox and kill criterion — written before building

Fill this card and show it to the human before writing any prototype code:

```markdown
### Prototype card — <slug>
- Question: <one sentence; the answer changes the direction or an expected outcome>
- Branch: UI | logic
- Timebox: <default 2 hours; maximum 1 working day in Discover>
- Kill criterion: <the result that drops or changes the direction — written now, not after>
- Location: branch `prototype/<slug>` (or directory `prototypes/<slug>/` on that branch)
- Faked or skipped: <auth, persistence, styling, error handling, …>
- Data: synthetic only
```

Rules:
- A result judged against a bar set after the fact flatters the favourite. The kill criterion is fixed before the first line of code.
- At the timebox, stop. An unanswered question goes back to the conversation with what was learned; a second timebox needs the human's agreement.
- A prototype that needs more than one working day is a sign the question is too big; split it.

## 4. Building rules

- Throwaway and labelled: the branch name starts with `prototype/`; the first line of every file says `PROTOTYPE — not for production — answers: <question>`.
- No tests beyond what the harness needs, no review, no dependency added to the main lockfile. A dependency the prototype needs stays on the prototype branch; using it in the real build goes through rule 10 of `../../agentic-sdlc/references/rules.md`.
- Never connect to production systems, real accounts or real personal data.
- Never open a pull request from a prototype branch into the main branch.

## 5. Outcome — what to keep

Write the outcome into the brief (`../templates/brief.md` §Prototype outcome):

```markdown
- Question: <as on the card>
- Verdict: proven | disproven | conditional (<condition>)
- Learned: <2–4 bullets: facts the prototype established>
- Faked: <what the prototype did not prove>
- Decision: <how the direction changed>
- Keep: <none | a snippet that encodes a decision more precisely than prose — a state table, a type, a schema>
- Pointer: branch `prototype/<slug>` at <commit>
```

Keep the **decision**, not the code. A snippet may move into the brief only when it encodes a decision more precisely than prose (the final state machine table, a type shape, a schema). The prototype's effort is not an estimate of the real build: it skipped tests, edge cases, errors and review by design.

## 6. "Can we just ship the prototype?"

No. Keeping prototype code is a new request: it re-enters Discover (`issue-triage`), and in the Agentic SDLC it gets a spec, a plan, test-first implementation and review like any other change. The prototype branch remains a reference that the Developer may read; it is not merged.

## 7. Worked mini-examples

**Logic spike — approval workflow.** Question: "Do three states (draft, submitted, approved) cover the five real approval cases from issue #318?" Kill criterion: "Any real case needs a state we cannot name → switch to a state machine with explicit transitions." Timebox: 2 hours on `prototype/approval-states`. Result: two cases needed `returned` and `withdrawn`. Verdict: disproven for the status field; the brief keeps the five-state transition table as a snippet.

**UI prototype — invite step.** Question: "Where does an invite prompt get noticed without blocking the first project?" Three variants on the existing projects page behind `?variant=`: inline banner, empty-state card, post-creation dialog. Kill criterion: "If 3 of 5 internal testers miss all three variants, drop the prompt idea." Verdict: conditional — the empty-state card worked when the project list was empty; the brief records the condition.
