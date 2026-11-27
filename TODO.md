# TODO — v3.1 implementation follow-ups

Open items from executing `docs/plans/2026-11-27-agentic-sdlc-improvement-plan.md`. Each says why it is open and what closes it.

| # | Task | Item | Why open | Closes when |
|---|---|---|---|---|
| 1 | 1.5 | Trigger evals in `skills/project-context/evals/` (`trigger-eval.json`, `evals.json`) not re-run | They need an LLM runner (`skills/skill-creator/scripts/run_eval.py` drives a model session); the implementing session ran only deterministic checks. The skill `description` was not changed, so trigger routing should be unaffected | Someone runs the `skill-creator` eval runner on `project-context` and records the pass rate |
| 2 | 0.1, 1.1, 1.8 | CI jobs (`method-scripts`, `ext-check`, default-path budget) not confirmed green on GitHub | `validate.yml` runs on pull requests to `main` and pushes to `main` only; pushing the feature branch runs nothing. Every job command was run locally instead (Node 24; Node 18 was not available locally) | A pull request from `feat/v3.1-superior` shows every job green on Node 18 |
