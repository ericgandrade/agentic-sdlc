# Path examples

Worked cases for the path rubric (`references/paths.md` §2, §4) and its tool form `scripts/path-score.mjs`. Each case gives the input, the expected score line and the exit code in a `path-score` block: line 1 is the command (run from the skill directory), line 2 the first output line, line 3 the exit code. `scripts/test/path-score.test.mjs` runs every block, so a case that drifts from the rubric fails CI.

| Case | Shows | Path |
|---|---|---|
| `01-quick-bug.md` | Small bug, no trigger; what Quick still keeps (evidence, review, trace) | Quick |
| `02-standard-feature.md` | Feature across two deploy units with one trigger; spec header re-check; route-down guard | Standard |
| `03-risk-beats-size.md` | A small diff routed up by its risk triggers | Standard, Full |
| `04-personal-data-full.md` | One Full-forcing trigger on a one-file change | Full |
| `05-escalation-during-build.md` | A Quick item that grows past 3 files during Build | Quick → Standard |
| `06-missing-inputs.md` | Unknown inputs default to Standard, never below a known route | Standard, Full |
