# Research firewall and citations

Load at Step 4. Contract: `../../agentic-sdlc/references/brownfield.md` §2. Owner: Analyst; researchers and the verifier are fresh subagents (or labelled separate passes on platforms without subagents).

Research that knows the intended change finds evidence for it. The firewall separates **what is asked** (factual questions) from **why it is asked** (the change), so the current-state document describes the code, not the plan.

## 1. Roles

| Role | Gets | Returns | Never gets |
|---|---|---|---|
| Analyst (orchestrator) | The change request, the spec draft, the code map | 3–7 questions, scope paths, SHA; assembles `current-state.md` | — |
| Locator | One "where" question, SHA, scope paths | File and symbol list with `path:line @ sha` | The change, other questions' answers |
| Analyzer | One "how / what touches / how tested" question, SHA, ≤ 15 files | Cited answer | The change |
| Historian | One "why" question, SHA | Commit citations `<sha> "subject"`, linked issue numbers | The change |
| Verifier | The assembled answers and citations | Verdict per claim | The change, the researchers' reasoning |

One subagent per question group; ≤ 7 questions per run. More needed → the scope is too wide; split the work item.

**No subagents:** write the questions to `current-state.md` first, then clear working notes and drop the change request from context; answer each question from the questions file alone in a pass labelled `research pass`; then run the verifier as a second labelled pass (`verification pass`). The labels appear in the file.

## 2. Question shapes

| Shape | Template | Example |
|---|---|---|
| How | How does `<behaviour>` work today, from entry to effect? | How is an invoice total computed and rounded? |
| Where | Where does `<concept>` live (definitions, entry points, configuration)? | Where are order statuses defined and set? |
| What touches | What reads or writes `<data or symbol>`? | What reads or writes `customers.phone`? |
| Why | Why is `<behaviour>` this way (commits, issues)? | Why does the export job run at 02:00? |
| How tested | Which tests execute `<module>`, and what do they assert? | Which tests execute `billing/legacy/`? |

Each touched module gets one "how tested" question.

## 3. Rewrite catalogue (intent → factual)

| Leaks intent | Rewritten |
|---|---|
| Where should the OrderLifecycle service hook into cancellation? | Where does an order reach a final state, and what runs then? |
| Is it safe to switch rounding to half-up? | How is an invoice total rounded, and what reads the rounded value? |
| What breaks if we drop `customers.phone`? | What reads or writes `customers.phone`? |
| Can the fax job be deleted? | What invokes the fax export job, and what does it write? |
| How do we make the report faster? | How is the monthly report query built and executed? |

A question that cannot be rewritten without the intent is a design question → Architect list, not research.

## 4. Exclusions

Researchers do not read intent sources: `specs/` (except `current-state.md` of other work items when explicitly cited as prior research), `docs/plans/`, `docs/adr/` with status `Proposed`, issue and PR text, chat logs, design notes, the change request. Accepted ADRs and the code map are allowed: they describe decisions already made, not the pending one.

## 5. Reading at one commit

```bash
SHA=$(git rev-parse --short=12 HEAD)          # recorded once, at the top of current-state.md
git show "$SHA":billing/legacy/Invoice.php     # read a file at the SHA
git grep -n "calculateTotal" "$SHA" -- billing/ reports/
git log --format='%h %s' "$SHA" -- billing/legacy/Invoice.php | head -20
git blame -L 200,230 "$SHA" -- billing/legacy/Invoice.php
```

Working-tree reads are not citations: uncommitted changes have no SHA.

## 6. Citation formats

| Claim type | Format | Example |
|---|---|---|
| Code line | `path:line @ <sha12>` | `billing/legacy/Invoice.php:212 @ 4f1c2a9b0d3e` |
| Code block | `path:start-end @ <sha12>` | `billing/legacy/Invoice.php:200-230 @ 4f1c2a9b0d3e` |
| History | `<sha12> "<commit subject>"` | `9b7e01c4d2aa "switch rounding to banker's for EU"` |
| Runtime fact | `query: <query> · window: <dates> · result: <aggregate>` | `query: count calls /api/v1/fax · window: 2026-10-25..2026-11-24 · result: 0` |
| Tool output | `` `<command>` @ <date>: <summary line> `` | `` `pip-audit` @ 2026-11-24: 1 critical `` |

A claim without a citation is removed or labelled `unverified`. Commit messages are their author's claims about intent — weaker than code; when code and message disagree, the code wins and the disagreement is noted.

## 7. Verification

The verifier (prompt `../prompts/citation-verifier.md`) re-opens 100% of load-bearing citations — any claim an AC, constraint, disposition or design decision rests on — and ≥ 20% of the others, chosen at random.

| Verdict | Meaning | Action |
|---|---|---|
| verified | The cited lines at the SHA support the claim | Keep |
| disputed | The lines support a different or narrower reading | Keep both readings; never average; Analyst resolves or asks |
| overturned | The lines do not support the claim (moved, wrong file, misread) | Remove the claim; re-ask if load-bearing |
| unverified | Not re-opened (sampled out) or not checkable | Keep with the label; no AC may rest on it |

Any overturned claim in the 20% sample → verify the rest of that researcher's claims.

## 8. Freshness

Before each sign-off request that relies on `current-state.md`:

```bash
git diff --name-only <sha>..HEAD -- <every cited path>
```

Empty → fresh. Any path listed → re-verify the claims citing it at the new HEAD and update the SHA; claims that cannot be re-verified become `unverified`.

## 9. What does not go in `current-state.md`

Recommendations, target designs, opinions on code quality, estimates, and anything copied from production data. Design questions and risks go to the "Open questions for the Architect" list at the end of the file.
