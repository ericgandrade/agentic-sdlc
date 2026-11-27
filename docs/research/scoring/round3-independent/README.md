# Round 3: independent re-score of the built method

**Date:** 2026-11-26 · **Method scored:** Agentic SDLC v3.0.1 @ `22c649f` · **Rules:** [methodology v1](../methodology.md) (SHA-256 `a6e39…cf9a4`, unchanged since round 1) plus [rubric v2](rubric-v2.pt-BR.md) lenses ([freeze record](FREEZE-v2.md)).

## Result in one table

| Question | Answer |
|---|---|
| Score (baseline weighting, 0–100) | **85.0 ±2.7** |
| Position | **1st of 10**, 16.4 points ahead of AWS AI-DLC (68.6); margin needed to call a difference: 8.2 |
| Under the other weightings | equal 83.8 · startup 83.8 · regulated 85.4 · autonomous 87.4, first in all five, always above the margin |
| Robustness | First in 95.5% of 10,000 random weightings (uniform) and 99.7% (centred on baseline), with scores perturbed by their uncertainty |
| Pre-registered "Superior" verdict | **Not yet.** S1, S2, S3, S5, S6 and S7 hold. **S4 fails**: C15 portability and extensibility = 2, below the benchmark median (3). S4 has zero tolerance |
| Change from round 2 | 88.5 → 85.0. Round 2 scored a partly built design; round 3 scores what ships |

All numbers: [`results.json`](results.json).

## Why a round 3

Round 2 (88.5) had three weaknesses we named ourselves: it scored a partly built design with realization discounts, it was run by the method's owner, and it measured maturity only. Round 3 re-scores **the released code** with **new scorers** who never saw the earlier result, and adds four lenses that did not exist before.

## How it was run

| Step | What was done |
|---|---|
| Pin and isolate | A copy of `main@22c649f` without `.git` and **without any self-assessment**: `docs/research/scoring/`, `docs/research/gap-closure/`, `docs/plans/`, `docs/handoff/`, the charts and the README's score section were removed before any scorer saw the tree |
| Two new scorers | Two AI scorers (R3-1, R3-2), working separately, following the unchanged [evaluator brief](../evaluator-agent.md). Static reading only: no script was executed, the same as for every benchmark |
| Calibration first | Each scorer first scored **BMad Method v7 at the same commit as rounds 1–2** (`e435a22`), then the Agentic SDLC |
| Reconciliation | Methodology rule: a difference of 1 takes the lower score. Only C1 differed (5 vs 4 → 4) |
| Red team | An auditor tried to refute every criterion scored 4 or 5 (19 challenges, especially "is it on the default path, shipped and enforced, or only described?"). None was upheld |
| Lenses | A lens evaluator produced L2–L5; the auditor then checked **100% of the cells** (stricter than the 15% sample in rubric v2 §5.6) |
| Tokens | One script, one tokenizer (`tiktoken o200k_base`), static count |

Scorecards: [`scorecards/R3-1/`](scorecards/R3-1/) and [`scorecards/R3-2/`](scorecards/R3-2/) (each with the BMad calibration card). Lenses: [`lenses.json`](lenses.json). Audit: [`audit.json`](audit.json). Tokens: [`tokens.json`](tokens.json).

### Calibration: were the new scorers lenient?

| | BMad v7 @ `e435a22` | Agentic SDLC |
|---|---:|---:|
| Rounds 1–2, reconciled | 66.8 | — |
| R3-1 | 53.0 | 86.2 |
| R3-2 | 59.6 | 85.0 |

Both new scorers were **stricter** than rounds 1–2 on the same BMad commit, and each placed the Agentic SDLC 25 to 33 points above BMad. Agreement between them: Krippendorff's α (ordinal) = 0.873 over 32 paired cells (0.80 or more counts as reliable).

## Criterion by criterion

| Criterion | Weight | Agentic SDLC | Best of the nine (who) | Median of the nine |
|---|---:|---:|---|---:|
| C1 Ease of adoption | 6 | 4 | 5 (BMad) | 3 |
| C2 Requirements and spec | 8 | **5** | 4 | 3 |
| C3 Code quality practices | 9 | 4 | 5 (Addy Osmani) | 3 |
| C4 Verification and evidence | 9 | 4 | 5 (AI-DLC, Agile V) | 3 |
| C5 Code review rigor | 8 | **5** | 4 | 3 |
| C6 Loop engineering | 7 | **5** | 4 | 2 |
| C7 Graph engineering | 4 | **5** | 3 | 2 |
| C8 Autonomous-run safety | 6 | 4 | 4 (AI-DLC) | 2 |
| C9 Traceability | 5 | **4** | 3 | 2 |
| C10 Human governance | 6 | 4 | 4 (Agile V) | 2 |
| C11 Security by default | 6 | **4** | 3 | 2 |
| C12 Release and operations | 6 | **4** | 3 | 1 |
| C13 Context management | 6 | 5 | 5 (several) | 4 |
| C14 Right-sizing and brownfield | 6 | 4 | 4 (Agile V) | 3 |
| C15 Portability and extensibility | 4 | **2** | 5 (Agile V, Spec Kit) | 3 |
| C16 Learning loop | 4 | **4** | 3 | 2 |

Leads on 8, ties on 4, behind on 4. What holds each 4 at 4 is the same pattern: the deterministic part exists but is opt-in (CI, security and approval jobs are installed in week 3 of the rollout, not at adoption) or is announced but not shipped yet. C15 is 2 because the method itself states that no extension loads until its extension interface exists.

## The four lenses (rubric v2)

The lenses describe; they are **not** added to the weighted score (autonomy and context already count in C8 and C13).

| Lens | Question | Agentic SDLC | Best of the nine |
|---|---|---|---|
| L2 Capability ceiling | How mature is the best path the method ships, even if opt-in? | **91.0** (6 points above L1: value that ships but is off the default path) | 73.2 (Agile V) |
| L3 Autonomy, A0–A5 | How much runs without a human? | **A3**: fresh-context subagents and several tasks chained without a human per task. A4 needs an outer runner that opens a new session per task | A3 (AI-DLC, Agile V, Superpowers, Kiro, Matt Pocock) |
| L4 Features, 34 items | Which capabilities ship? | **63 of 68**. At 1 (partial): ADRs (Full path only), multi-session runs, environment-enforced limits, token telemetry, eval results | 57 (AI-DLC) |
| L5 Tokens (static) | How much context does the method read by construction? | Always loaded 4.1k · entry 6.5k · **default path 118k**, the heaviest of the ten | 10.6k default path (Matt Pocock) · heaviest of the nine 96.5k (AI-DLC) |

Autonomy levels: A0 prompt library · A1 guided workflow · A2 a whole task in one session · A3 orchestration inside a session · A4 unattended multi-session runs with persisted state · A5 continuous flow. Autonomy is not quality: it is always read together with C8.

Features: 34 items in nine groups (Discovery, Design, Build, Verification, Autonomy, Governance, Operations, Ecosystem, Economy), derived from a generic lifecycle taxonomy, not from any evaluated method; 2 = on the default path, 1 = opt-in, partial or only documented, 0 = absent.

Tokens: T1 always loaded (instruction files plus preloaded skill descriptions), T2 entry skill, T3 every file the default path requires for a medium feature, counted once. A static proxy; run-time consumption is not measured yet.

### The ten methods on every lens

| Method | L1 | L2 ceiling | L3 | L4 (of 68) | T3 default path |
|---|---:|---:|---|---:|---:|
| **Agentic SDLC** | **85.0** | **91.0** | A3 | **63** | 118.4k |
| AWS AI-DLC | 68.6 | 69.8 | A3 | 57 | 96.5k |
| Agile V | 67.0 | 73.2 | A3 | 48 | 25.4k |
| BMad Method | 66.8 | 68.4 | A2 | 53 | 41.2k |
| Addy Osmani agent-skills | 57.6 | 59.0 | A2 | 51 | 32.6k |
| Superpowers | 56.0 | 56.0 | A3 | 40 | 16.3k |
| AWS Kiro | 44.4 | 45.4 | A3 | 33 | not measurable (closed) |
| Matt Pocock skills | 43.8 | 45.4 | A3 | 35 | 10.6k |
| GitHub Spec Kit | 43.2 | 45.0 | A2 | 33 | 32.2k |
| OpenSpec | 38.8 | 38.8 | A1 | 27 | 14.0k |

The benchmark lens values come from the same rubric v2, measured on the same pinned versions as rounds 1–2, with a full audit of every cell.

## What would change the verdict

| Gap | Mechanism that closes it | Effect |
|---|---|---|
| C15 = 2 (blocks S4) | A versioned extension interface with a validator in CI. Platform breadth, per-platform mappings, an upgrade-safe config layer and a contribution guide already exist, so the interface is the only missing level-3 element | S4 holds → "Superior" |
| C3, C4 = 4 | A Definition-of-Done gate on the current change, and a machine-checked evidence ledger | +3.6 |
| C8, C10, C11 = 4 | Authority limits enforced by host settings and hooks; approval, CODEOWNERS and security jobs installed at adoption | +3.6 |
| Heaviest default path | Load references by section, not by file | Lower cost per feature |

The [roadmap](../../../plans/2026-11-25-roadmap-v3.md) carries these items.

## Limits

- **Rubric fit.** The Agentic SDLC was built after, and against, this rubric: rounds 1 and 2 told us exactly what was missing. The nine benchmarks were not designed for it. The score measures fit to a published, frozen standard, not results in production.
- **Who scored.** AI scorers, briefed and isolated by the owner's tooling; no human or external review. "Independent" here means new scorers who never saw the earlier self-score, under the same locked rules.
- **Static reading.** No script was run, as for every method. The only execution evidence is the agent-run [end-to-end trial](../../2026-11-25-dogfood-report.md).
- **No team pilot yet.** Ceremony cost (four sign-offs on Standard, about 54 files on the default path) is not measured in practice.
- **Probabilities.** The P(first) simulation uses an approximate per-criterion uncertainty for the benchmarks; read it as an order of magnitude.
