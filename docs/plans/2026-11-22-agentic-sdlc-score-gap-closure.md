# Agentic SDLC — Score Gap Closure Implementation Plan

> **For agentic workers:** execute batch by batch with `executing-plans`. Batches are ordered; streams inside a batch touch disjoint files and may run in parallel.

**Goal:** raise the Agentic SDLC risk-adjusted (RA) baseline total from 53.2 (scoring round 1, verdict *Not superior*) to **≥ 70**, by raising design levels with concrete mechanisms and **implementing** them in `skills/` so the realization factor is 1.0 (methodology §8.3).

**Inputs:**
- `docs/research/scoring/results.md` — round 1 verdict and gap table
- `docs/research/gap-closure/grill-report.md` — `grill-me` critique: per-criterion blockers, 15 decisions, 20 contradictions
- `docs/research/gap-closure/architect-report.md` — `senior-solution-architect` design: mechanisms 1.1–16.4 with all five concreteness elements, contradictions K1–K12, batched work list (§4)
- `docs/research/gap-closure/score_model.py` — projection arithmetic

**Architecture (architect report §0, option B):** implement mechanisms as modules inside `skills/agentic-sdlc/` (`references/`, `templates/`, `agents/`, `scripts/`, `examples/`) and deepen the existing stage skills. No new top-level skill, so the skill count and bundles do not change. Scripts are dependency-free Node ≥ 18 ES modules with `node --test` tests and exit codes 0 pass / 1 fail / 2 input missing / 3 bound reached.

**Owner decisions (2026-11-22):** target is RA ≥ 70; scope covers the design **and** the existing skills; rounds continue until the target is met. The methodology stays frozen.

---

## Batch 0 — Foundation (serial)

Architect report §4 Batch 0, items 1–6:
1. Router `skills/agentic-sdlc/SKILL.md` rewritten in D10 vocabulary (≤ 2,200 words) with a module index.
2. `references/lifecycle.md`, `rules.md`, `artifacts.md`, `phase-boundaries.md` rewritten (K10).
3. `references/agents.md` becomes an index; eight `agents/*.md` files are created.
4. `scripts/lib/md.mjs`, `scripts/lib/git.mjs`, `scripts/test/` harness and `examples/worked-example/` skeleton.
5. Execution plan `2026-11-20-agentic-sdlc-execution-plan.md` amended with K1–K12.
6. Skill `README.md` and `evals/evals.json` updated.

**Exit check:** the K-grep from architect report §3 returns 0 hits; `node --test skills/agentic-sdlc/scripts/test/*.test.mjs` passes.

## Batch 1 — T1 minimal set (6 parallel streams; projected 77.0, floor 73.6)

Streams 1A–1F exactly as in architect report §4 Batch 1:
- **1A Specify/Govern**
- **1B Design/Graph**
- **1C Build/Loops/Autonomy**
- **1D Test/Review**
- **1E Release/Operate/Learn/Security**
- **1F Adoption/Context/Paths**

**Exit check:**
- `node --test skills/agentic-sdlc/scripts/test/*.test.mjs` passes.
- `./scripts/validate-skill-yaml.sh` and `./scripts/validate-skill-content.sh` pass on every touched skill.
- The K-grep returns 0 hits.
- The worked example is filled end to end.

## Re-score (after Batch 1)

1. Remove the round-1 `agentic-sdlc` overrides from `docs/research/scoring/audit/adjustments.json`; they apply to the old cards. Benchmark overrides stay.
2. Two fresh, independent scorer agents, in the S-A and S-C roles, re-score `agentic-sdlc` from scratch per `evaluator-agent.md`:
   - They score implemented mechanisms with I evidence (r = 1.0) and any remaining design-only mechanisms per §8.
   - They must not open `docs/research/gap-closure/`, the other scorer's card, or the round-1 `agentic-sdlc` cards.
3. A fresh red-team audit, scoped to `agentic-sdlc`, then `aggregate.py`.
4. If RA < 70, use the gap table to choose the next mechanisms (Batch 2 streams first) and repeat.

## Batch 2 — T2 stretch set (only if needed or approved)

Streams 2A–2I as in architect report §4 Batch 2, projected 96.0 (floor 86.8). Batch 3 (T3 options and release steps) is out of scope for this plan.

## Release note

This plan adds no new top-level skills. Version bump, CHANGELOG and doc sync follow `CLAUDE.md` when the owner decides to release.
