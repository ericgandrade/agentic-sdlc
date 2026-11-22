# Orchestrator log — scoring round 1

Chronological record of events that may affect scores. The red-team auditor must review every entry.

| Date | Event | Detail | Action |
|---|---|---|---|
| 2026-11-21 | API usage limit interrupted all four scorers | Scorers resumed from saved state; no scorecard content lost | Sequential execution of the 9 missing scorecards, one at a time, commit after each |
| 2026-11-21 | Scorer S-B revised its own earlier card | spec-kit C5 (code review) 1 → 2 while scoring OpenSpec, "to stay consistent" with OpenSpec's optional verify step; diff shows only this cell and its rationale changed | Accepted as a within-scorer consistency fix; **auditor to check whether C5 is scored consistently across all methods** |
| 2026-11-21 | Scorers returned baseline totals in their replies | Requested by the orchestrator for progress reporting; scorecard files themselves contain no totals | Do not forward totals to scorers still to score; the nine remaining cards are scored without totals visible |
| 2026-11-22 | Usage limit hit again during card 4 (kiro, S-B) | No Kiro content saved; repo clean at d5f194c | Resume with kiro/S-B |

| 2026-11-22 | kiro/S-B written with ALL 16 cells Low confidence | kiro.dev blocked by the session network allowlist; evidence = public Kiro GitHub repo README + sample spec, one web search, secondary profile. No cell reached the evidence cap | **Bias risk in our favour**: Kiro is likely under-scored. Auditor must treat Kiro cells as Low; re-score Kiro if kiro.dev becomes reachable (owner decision pending). Superiority must also be checked with Kiro excluded |

| 2026-11-22 | kiro/S-D scored from official kiro.dev docs | Owner approved adding kiro.dev to the environment allowlist; S-D's web-fetch tool still failed to resolve the host, so S-D fetched the official Markdown pages with curl through the session proxy (HTTP 200) into scratchpad/kiro-docs; docs pinned as accessed 2026-11-22 (Kiro IDE 1.4.x, CLI 3.x); 15 Medium, 1 Low (C16) | S-B to re-score Kiro from the same saved docs so both cards share evidence; the earlier S-B card (8b8aebf) stays in git history |

## Queue state (2026-11-22)

Done (14 scorecards, 7 benchmarks with two independent cards each): superpowers (S-A, S-C), mattpocock (S-A, S-D), spec-kit (S-B, S-C), ai-dlc (S-B, S-C), addyosmani (S-A, S-C), bmad (S-A, S-D), openspec (S-B, S-D).

Pending, strictly sequential, commit after each card:
1. kiro / S-B (re-score from saved official docs)  ← next
2. agile-v / S-B
3. agile-v / S-D
4. agentic-sdlc / S-A (only after S-A finished all its benchmarks — done)
5. agentic-sdlc / S-C (only after S-C finished all its benchmarks — done)

After the cards: red-team audit (reviews this log and all cards, writes audit/adjustments.json if any overrides), `python3 docs/research/scoring/aggregate.py`, results report.

Rules for scorers still to score: no totals visible; do not open other scorers' cards; do not change earlier cards without telling the orchestrator.
