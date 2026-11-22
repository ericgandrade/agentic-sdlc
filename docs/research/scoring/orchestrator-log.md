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

| 2026-11-22 | kiro/S-B re-scored from the saved official docs | 7 cells changed vs the first S-B card (C1 2→4, C5 1→2, C7 1→3, C13 2→4, C14 2→3, C16 0→2; C9 same score, better evidence); average confidence Low → Medium. Confirms the first card under-scored Kiro | S-B's first card (8b8aebf) is superseded; auditor to compare S-B and S-D Kiro cards |

| 2026-11-22 | agile-v/S-B written; license check | n-gram overlap against the Agile V clone limited to file paths, skill names and `file#section` citations (identifiers, permitted); no body text copied. 14 Medium, 2 Low (C2 strict reading of non-goals; C12 release-manager not in the existing-repo profile) | Auditor to review the two contestable readings |

| 2026-11-22 | agile-v/S-D written; license check | 8-word overlap limited to file paths/skill names; 14 Medium, 2 Low (C4 scored 5 — contestable whether the unwired reference module counts; C8 scored 2 — human-gated by design). S-D did not use the AV inventory as evidence (entries name no source files) and applied the no-non-goals rule to C2 the same way as for Kiro | **All 9 benchmarks now have two independent cards.** Auditor to review C4/C8 readings and C2 consistency (Kiro, Agile V) |

| 2026-11-22 | agentic-sdlc/S-A written (design-only) | 15 Medium, 1 Low (C11); realization factors 0.7–0.9 (lowest: C9 traceability, C12 release/ops); scorer applied strict calls: hedged enforcement ("where possible") not credited, "minimum additions" lines not credited without behaviour, evals without pass thresholds not counted as measurement; Phase H, D11 and the gate banner not credited | Auditor to check realization factors and the strict calls for symmetry with benchmark scoring |

## Queue state (2026-11-22)

Done (19 scorecards; all 9 benchmarks have two independent cards; agentic-sdlc has S-A): superpowers (S-A, S-C), mattpocock (S-A, S-D), spec-kit (S-B, S-C), ai-dlc (S-B, S-C), addyosmani (S-A, S-C), bmad (S-A, S-D), openspec (S-B, S-D).

Pending, strictly sequential, commit after each card:
1. kiro / S-B (re-score from saved official docs)  ← next
2. agile-v / S-B
3. agile-v / S-D
4. agentic-sdlc / S-A (only after S-A finished all its benchmarks — done)
5. agentic-sdlc / S-C (only after S-C finished all its benchmarks — done)

After the cards: red-team audit (reviews this log and all cards, writes audit/adjustments.json if any overrides), `python3 docs/research/scoring/aggregate.py`, results report.

Rules for scorers still to score: no totals visible; do not open other scorers' cards; do not change earlier cards without telling the orchestrator.
