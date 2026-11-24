# Architecture Review (Assess mode)

Load in Assess mode: reviewing an existing system or a proposed architecture for bottlenecks, security gaps, scalability limits or structural friction, outside or before a work item. The output is a review report with ranked candidates; it does not change code and it does not design interfaces before the human picks a candidate. Hot-spot scoping, recommendation strength and "no interfaces before selection" adapt Matt Pocock's `improve-codebase-architecture` skill (MIT). Wording is original.

## 1. Scope before reading everything

1. **Named direction given** ("review the billing module", "will this scale to 10x?") → scope to it.
2. **No direction** → find hot spots: `git log --since="6 months ago" --name-only --pretty=format: | sort | uniq -c | sort -rn | head -20`. Files that keep changing and carry bug-fix commits are where structure costs money. Widen only if changes are scattered.
3. **Read decisions first:** existing ADRs, `docs/codemap.md`, `CONSTRAINTS.md`, `GLOSSARY.md`, AGENTS.md. A rejected direction recorded in an ADR is not re-suggested unless new evidence justifies reopening it (say so with a warning line).
4. **Legacy without tests, or a migration question** → this review only classifies; the inventory, dispositions and transition design belong to `codebase-modernization` (`../../agentic-sdlc/references/brownfield.md`).

## 2. Challenge the premise

Before evaluating a proposed solution, restate the problem it is meant to solve and its evidence. Ask: "What measurement shows the problem? Which part of the system causes it?" Typical mismatches:

| Proposed | Stated problem | Often the real cause | Check first |
|---|---|---|---|
| Microservices | Slow, risky releases | Build and test pipeline, manual release steps, missing flags | Lead time per stage of the pipeline; test suite duration |
| New database | Slow queries | Missing index, N+1 access, unbounded query | Query plan of the 5 slowest queries |
| Cache layer | Latency | Chatty calls between modules | Call count per request |
| Event bus | Coupling | Shared tables written by several modules | Who writes each table |
| Rewrite | "Unmaintainable" | Shallow modules, tests coupled to internals | Hot spots + deletion test |

The cheapest change that removes the measured cause is always listed as a candidate.

## 3. Quality-attribute rubric

Score each attribute that matters to the system 0–3 with evidence (file, metric, incident). Leave out attributes nobody needs; say which and why.

| Attribute | 0 | 3 | Evidence to look for |
|---|---|---|---|
| Scalability | Single bottleneck with no headroom | Measured headroom ≥ 2× forecast | Load test results, saturation metrics, unbounded queries |
| Availability | Single point of failure on the critical path | Degrades gracefully per dependency | Timeouts, retries with backoff, fallbacks |
| Security | Authorization missing or after work | Checks at every trust boundary, secrets managed | Middleware order, secret storage, input validation |
| Data integrity | Several writers per table, no constraints | One owner per store, constraints and migrations | Write paths per table, migration history |
| Operability | No metrics or runbook | Alerts tied to user impact, runbook current | Dashboards, alert rules, runbook dates |
| Evolvability | Every change touches 5+ modules | Typical change stays in one module | Hot spots, co-change pairs, deletion test results |
| Testability | Tests mock internals or are absent | Tests cross interfaces; mocks only at process edges | Test doubles, coverage of hot spots |
| Cost | Spend unknown | Spend per unit of work known | Bills, resource sizing |

## 4. Friction walk

Walk the hot spots as a newcomer would and note friction: bouncing between many small modules to understand one concept; pass-through layers; pure functions extracted "for testability" while bugs live in how they are called; two modules changing together for every feature; areas no test reaches. Apply the deletion test (`deep-modules.md` §4) to each suspect module. A fresh-context subagent can do the walk with only the code and the hot-spot list; without subagents, do it in a separate pass before reading the proposal under review.

## 5. Candidate report

One block per candidate, ranked:

```markdown
### Candidate 1 — <deepening or change, named in the vocabulary>
- **Files:** `<paths>`
- **Problem:** <one sentence, with evidence>
- **Proposal:** <one sentence; no interface yet>
- **Wins:** locality: <…> · leverage: <…> · tests: <…>
- **Strength:** Strong | Worth exploring | Speculative
- **ADR conflict:** none | ADR NNNN — <why reopening is justified>
```

End with **Top recommendation** (one candidate, two reasons) and a **Before/After** C4 Level 2 diagram when the recommendation changes containers. Ask which candidate to explore; then run Workflow Steps 2–4 on that candidate only.

## 6. Findings severity (standalone reviews)

Use the shared scale: **Critical** — the system cannot meet a stated requirement or exposes data; **Important** — a measured limit will be hit within the forecast horizon, or a structural defect causes repeated incidents; **Minor** — friction without measured cost. Every finding cites evidence; an opinion without evidence is not a finding.

## 7. Exit

Report with: scope and hot spots, premise check, rubric table, candidates ranked with strength, top recommendation, ADRs proposed (status `Proposed`) for any decision the human takes during the review. When the human turns a candidate into a work item, it enters the Agentic SDLC at Discover; the review becomes an input to the Analyst, not a substitute for a spec.
