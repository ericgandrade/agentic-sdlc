# TODO — v3.1 implementation follow-ups

Open items from executing `docs/plans/2026-11-27-agentic-sdlc-improvement-plan.md`. Each says why it is open and what closes it.

| # | Task | Item | Why open | Closes when |
|---|---|---|---|---|
| 1 | 1.5 | Trigger evals in `skills/project-context/evals/` (`trigger-eval.json`, `evals.json`) not re-run | They need an LLM runner (`skills/skill-creator/scripts/run_eval.py` drives a model session); the implementing session ran only deterministic checks. The skill `description` was not changed, so trigger routing should be unaffected | Someone runs the `skill-creator` eval runner on `project-context` and records the pass rate |
| 2 | 0.1, 1.1, 1.8 | CI jobs (`method-scripts`, `ext-check`, default-path budget) not confirmed green on GitHub | `validate.yml` runs on pull requests to `main` and pushes to `main` only; pushing the feature branch runs nothing. Every job command was run locally instead (Node 24; Node 18 was not available locally) | **Closed 2026-11-27:** PR #11 ran every `validate.yml` job green on GitHub, `method-scripts` on Node 18 |
| 3 | Exit gate | The worked example was not re-run end to end with the new gates, and the trial report was not updated | It needs an agent trial in a separate project repository (adopt, Step 7b gates, `doctor`, `status`, `dod-gate`), which this session did not run | A trial log in `docs/research/` and an updated trial report |
| 4 | 1.8 | No `v3.1.0` tag, no npm publish, no `gh repo edit`, no Claude Desktop package | These are public or publishing steps that run after the owner merges | After merge: `git tag v3.1.0`, push the tag (CI publishes), `gh repo edit`, `./scripts/package-plugin.sh` |
