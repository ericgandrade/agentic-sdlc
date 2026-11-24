# Refinement Criteria — Converging on One Direction

Load this file in Step 4 (converge) and Step 5 (assumptions) of `SKILL.md`. It turns a field of options into one recommended direction with a stated reason, through three filters in a fixed order: kill criteria, scoring, tie-break. The human chooses; the scores make the trade-off visible, they do not decide.

## 1. Cluster and shortlist

1. Group the options by mechanism (not by technique). Options with the same mechanism merge into one, keeping the strongest wording.
2. Shortlist 2–3 clusters that differ in structure. Always keep the minimal option (from the simplification ladder) on the shortlist unless a kill criterion removes it.
3. Name the options that were dropped and why in one line each; they go to the brief's Alternatives considered.

A shortlist of one is not a shortlist. If only one option survives honestly, say so, show the dropped options and the kill criterion that removed each, and ask the human to confirm that there is one way.

## 2. Kill criteria (applied before scoring)

Drop an option immediately when any line is true. Record the line number as the reason.

| # | Kill criterion | Evidence to cite |
|---|---|---|
| K1 | It does not serve the confirmed HMW statement or the indicator | The HMW line |
| K2 | It breaks a `Never` boundary in `CONSTRAINTS.md`, the AGENTS.md block, or an existing spec | File and line |
| K3 | It contradicts an Accepted ADR without proposing to supersede it | `docs/adr/NNNN-*.md` |
| K4 | It repeats a prior rejection (`docs/out-of-scope/`, a closed issue, a spec Non-goal) and brings no new evidence | Link to the record |
| K5 | It needs data the team may not hold or process (personal, health or client data without a lawful basis) | Security notes of related specs |
| K6 | Its pre-mortem produced a Critical failure story with no mitigation | Pre-mortem line |
| K7 | Its success cannot be observed: no signal could show it worked | Indicator line |

Kill criteria written for this session go below the table **before** scoring starts ("drop any option that needs more than one sprint"). A criterion written after seeing the scores flatters the favourite and is not allowed.

## 3. Scoring rubric

Score each shortlisted option 1–5 on three dimensions. Every score cites its evidence in one clause; a score without evidence defaults to 2.

### Desirability — will the users want it and will it move the indicator?

| Score | Anchor |
|---|---|
| 5 | Acute, frequent pain with evidence (tickets, metrics, quotes); users already build workarounds; directly moves the indicator |
| 4 | Clear pain with some evidence; likely moves the indicator |
| 3 | Plausible need, thin evidence; indicator movement is a hypothesis |
| 2 | "Nice to have"; no workaround exists because nobody bothers |
| 1 | No evidence of need, or it serves the builder more than the user |

Painkiller test: name three real users (roles, not personal data) who have the problem; describe what they do today; say how often. Fewer than three, or "everyone could use this", caps Desirability at 3.

### Feasibility — can this team build and run it?

| Score | Anchor |
|---|---|
| 5 | Reuses existing code or platform features (cited files); no new infrastructure; known techniques |
| 4 | Small new component in a known stack; one unknown with a cheap check |
| 3 | New component or dependency; hardest part is known-hard but solved elsewhere |
| 2 | New infrastructure, new skills, or a third-party dependency with unclear limits |
| 1 | Hardest part is novel or unproven; needs a prototype before anyone can estimate |

### Viability — is it worth it for the organisation?

| Score | Anchor |
|---|---|
| 5 | Low build and run cost against clear value; fits strategy; no new risk triggers |
| 4 | Cost proportional to value; one risk trigger with a known control |
| 3 | Value plausible but cost of run (support, on-call, licences) unclear |
| 2 | Adds lasting operational load or a risk trigger without an owner |
| 1 | Cost exceeds any plausible value, or conflicts with strategy or regulation |

### Weights and thresholds

- Default weights: Desirability 0.4, Feasibility 0.3, Viability 0.3. Change them only before scoring, and record why ("internal tool: Desirability 0.3, Viability 0.4").
- Weighted total = Σ score × weight, one decimal.
- Any dimension scored 1 → the option is not recommended, whatever its total.
- Total < 3.0 → not recommended; keep it under Alternatives with the condition that would change the decision.

### Reversibility and effort (reported, not weighted)

- **Door:** two-way (easy to undo: a flag, a UI change, an additive endpoint) or one-way (data migration, public API, vendor lock-in, deleted data). A one-way door needs at least three options considered and an ADR candidate for the Design stage.
- **Effort:** rough days for the first release. Ranges are fine ("2–4 days"); a prototype's effort is not an estimate of the real build.

### Tie-break (totals within 0.3)

1. Prefer the two-way door.
2. Then the cheaper first release.
3. Then the option that adds fewer risk triggers (auth, personal or health data, money, public API, schema or migration, irreversible, regulated — `../../agentic-sdlc/references/paths.md`).
4. Still tied → present both and ask the human; do not pick silently.

## 4. Comparison matrix

```markdown
| Criterion | A — Invite prompt | B — Welcome-email link | C — Team templates |
|---|---|---|---|
| Kill criteria | none | none | none |
| Desirability (0.4) | 4 — 14 support quotes | 3 — email open rate 22% | 4 — top request in survey |
| Feasibility (0.3) | 5 — reuses `InviteDialog.tsx` | 5 — email template exists | 2 — new template model |
| Viability (0.3) | 4 — no run cost | 4 — no run cost | 3 — template curation load |
| **Weighted total** | **4.3** | 3.9 | 3.1 |
| Door | two-way | two-way | one-way (schema) |
| Effort | 2 days | 1 day | 2 weeks |
| What it makes harder later | — | email deliverability coupling | template versioning |
| **Recommendation** | ✅ | fallback | not now |
```

Lead with the recommendation and one sentence of reason, then show the matrix. Never present the matrix without a recommendation, and never present the recommendation as the decision.

## 5. Assumption tiers

After the human picks a direction, list what must be true for it to work (Step 5). Tier each assumption:

| Tier | Definition | Required action before the brief is agreed |
|---|---|---|
| **Leap of faith** | If false, the direction fails; little or no evidence today | Name the cheapest check (≤ 1 day) and run it, or carry it into the brief as an open question with an owner and a due date. A leap of faith the human will not check is recorded as an accepted risk in their words |
| **Testable** | Matters, and a check costs ≤ 1 day (query, 5 user conversations, a spike) | Record the check and owner; run it now when it is cheaper than writing the spec |
| **Safe** | Evidence already exists | Cite the evidence |

Categories to sweep: users (who, how many, how often), value (will it move the indicator), technical (does the platform allow it), data (do we have it, may we use it), operations (who runs it), legal and compliance.

### Impact × confidence grid

```
                 low confidence        high confidence
high impact   |  TEST FIRST          |  BUILD ON IT        |
low impact    |  NOTE AND MOVE ON    |  IGNORE             |
```

Every assumption in "test first" must have a check, a prototype, or an owner before the brief is agreed.

## 6. Worked mini-example

HMW: "How might we let managers compare their region against the company average without building a new report?"

- Options (6): region dropdown; comparison column; saved default view; weekly email digest; export to spreadsheet; benchmark widget on the dashboard.
- Kill: weekly email digest — K1 (managers want it during the review meeting, not weekly); export — K4 (rejected in `docs/out-of-scope/raw-exports.md`, no new evidence).
- Shortlist: comparison column (total 4.2, two-way), saved default view (3.8, two-way), benchmark widget (3.0, one-way: new aggregation table).
- Recommendation: comparison column plus saved default view; widget recorded under Alternatives with the condition "revisit if more than 3 regions ask for trend lines".
- Leap of faith: "the company average can be computed from existing aggregates within 2 s" → check: run the query on staging data (30 minutes) before the brief is agreed.
