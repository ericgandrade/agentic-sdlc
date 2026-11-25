# E.5 — Live trigger eval check (2026-11-25)

Runner: `skills/skill-creator/scripts/run_eval.py` through `claude -p`, 1 run per query, 45 s timeout, scratch project root `/tmp/agentic-e5-evalroot`. Query sets: each skill's `evals/trigger-eval.json`.

| Skill | Should trigger (passed/total) | Should not trigger (passed/total) |
|---|---|---|
| agentic-sdlc | 1/12 | 9/9 |
| executing-plans | 1/14 | 16/16 |
| spec-driven-development | 1/12 | 10/10 |
| test-driven-development | 0/9 | 9/9 |
| writing-plans | 0/12 | 14/14 |

## Verdict: INCONCLUSIVE — harness artifact

Almost every should-trigger query scored a trigger rate of exactly 0.0. This includes literal requests such as "Use TDD to add the 50,000-row limit to the CSV export" and "Run the Agentic SDLC on this bug". Every should-not-trigger query passed.

Near-zero recall with 100 % precision on all five skills points to the harness, not the descriptions. Two causes are likely:

- The temporary `.claude/commands` entry was not loaded from the scratch root within the 45 s window.
- The same skills, already installed under `~/.claude/skills`, compete for the same queries, so a trigger of the installed copy is not counted.

No description was changed because of this run. The static trigger audit (`2026-11-25-trigger-audit.md`) remains the evidence for E.1.

## Re-run (owner action)

1. Run from the repository root, which holds `.claude/`, not from a scratch directory.
2. While the run lasts, move the installed copies of the five skills out of `~/.claude/skills/`.
3. Use 3 runs per query and a 120 s timeout.
4. Accept a skill when recall ≥ 0.8 and precision ≥ 0.9. Otherwise, tighten its description with the `skill-creator` description optimization loop.
