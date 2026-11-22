# Sensitivity checks on the round 1 verdict (2026-11-22)

Run with `aggregate.py` on copies of the scoring folder (same seed). Main result: `results.md` (with audit adjustments).

| Run | Agentic SDLC risk-adjusted (baseline) | Best benchmark (baseline) | Verdict |
|---|---:|---|---|
| Main (audit adjustments applied) | 52.4 | AWS AI-DLC 68.6 | Not superior (S1–S5 fail) |
| Without audit adjustments | 54.1 | AWS AI-DLC 71.4 | Not superior (S1–S6 fail) |
| Without the Kiro cards | 52.4 | AWS AI-DLC 68.6 | Not superior (S1–S5 fail) |
| Upper bound: design score before the realization discount (r = 1.0 everywhere) | 62.4 | AWS AI-DLC 68.6 | Still below the best benchmark |

Where the points are lost against the best benchmark cell per criterion (baseline weights; 28.2 points in total, 10.0 of them from the realization discount):

| Criterion | Points lost | Of which realization discount |
|---|---:|---:|
| C3 Code quality practices | 4.7 | 1.1 |
| C8 Autonomous execution safety | 3.7 | 0.1 |
| C4 Verification and evidence | 3.2 | 1.4 |
| C1 Ease of adoption | 2.6 | 0.2 |
| C5 Code review rigor | 2.6 | 1.0 |
| C6 Loop engineering | 1.8 | 0.4 |
| C14 Right-sizing and brownfield | 1.6 | 0.4 |
| C11 Security by default | 1.4 | 0.2 |
| C15, C12, C7, C16, C10, C2, C13, C9 | ≤ 1.1 each | — |

The six criteria the owner named first (ease of use, code quality, loop engineering, autonomous development, code review, verification) account for 18.6 of the 28.2 points.

Not run (listed by the auditor as worth doing, none can close a gap of this size): Agile V `release-manager` counted as default path; AI-DLC scored on its `classic` path; C15 with a CLI counted as a standard toolchain; Spec Kit C2 strict on non-goals; C10 on the design at D = 3.
