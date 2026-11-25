# Handoff: Agentic SDLC, v3.0.0

**Date:** 2026-11-25
**Branch:** `claude/agentic-sdlc-handoff`, created from `claude/superskills-dev-workflow-kppj2r` at `8c5d014`
**Why:** the previous agent session (GitHub Copilot CLI) stopped on `402 quota_exceeded` while the E.3 dogfood agent was finishing.

## Goal

Finish the execution plan for the Agentic SDLC method
([`docs/plans/2026-11-20-agentic-sdlc-execution-plan.md`](../plans/2026-11-20-agentic-sdlc-execution-plan.md)):
Phases 0 and A–F, 33 skills, a branch ready for v3.0.0.
PR, tag, release, `gh repo edit` and the Claude Desktop upload are owner actions.

## Status

| Item | State | Evidence |
|---|---|---|
| Phases 0, A–D (13 agents, stage skills) | Done | git history |
| E.1 trigger-collision audit | Done | `docs/research/2026-11-25-trigger-audit.md` |
| E.2 orchestrator proposes the method | Done | `1ecfca0` |
| E.3 dogfood | Report written, **findings not fixed** | `docs/research/2026-11-25-dogfood-report.md` |
| E.4 clarity test | Done; G-9, G-10, G-12, G-14, G-15 left open (Minor) | `docs/research/2026-11-25-clarity-test.md` |
| E.5 live trigger evals | Inconclusive (harness), re-run needed | `docs/research/2026-11-25-eval-check.md` |
| Phase F docs, `bundles.json` packaging fix | Done | `68ab211` |
| Release prep | **Not started** | package version is still 2.0.8 |

## Verified at `8c5d014`

- `node --test skills/agentic-sdlc/scripts/test/*.test.mjs`: 124 pass, 0 fail.
- `node skills/agentic-sdlc/scripts/budget-check.mjs`: PASS (`agents/test-engineer.md` warns, 572/600).
- `./scripts/build-skills.sh`: OK.
- `check-doc-consistency.sh` and `verify-version-sync.sh` fail **only** on `cli-installer/README.md`, which already says 3.0.0 while the other files say 2.0.8. `release.js` resolves this.

## Next steps

1. Fix the E.3 findings: 1 Critical and 14 Important (table in the report, section 4). Suggested order:
   1. **F18** (Critical): red acceptance tests on the branch make the preflight baseline red, so Standard and Full Build cannot start as documented.
   2. **F10, F27**: the fingerprint goes stale on record-only commits. Check what `8c5d014` already excludes.
   3. **F21, F22**: artifact commits fail Trace; review-fix rounds are refused after `run-ledger finish`.
   4. **F16, F25**: library or package profile. `8c5d014` added `n/a` for Alert and Rollout, so F16 may be partly closed.
   5. Re-check F09, F11 and F14 against `8c5d014` (they overlap clarity gaps G-4, G-6, G-9), then F04, F05, F08, F19, F23.
2. Release prep, on a clean tree:
   - `node scripts/release.js major`. The `version` script in `cli-installer/package.json` runs `git add -A`, so stray files get staged.
   - Run `verify-version-sync.sh`, `check-doc-consistency.sh`, `./scripts/package-plugin.sh`.
   - Commit `chore: bump version to 3.0.0`.
3. Push the branch (not done: nothing after `5879581` is on the remote).
4. Owner actions: PR, tag `v3.0.0`, GitHub About and topics, Claude Desktop zip upload, E.5 re-run.

## Working rules

- Repository content is English only.
- Subagents write only their own files and never run git. Never `git stash` while agents run.
- Commit with explicit paths, in logical units.
- The router (`skills/agentic-sdlc/SKILL.md`) and agent briefs are close to their word budgets; run `budget-check.mjs` after editing.
- Changing the worked example's spec changes its hash `6b4c7f329c93`; avoid it.
- An `agentic-sdlc` module is the compact contract; the stage skill holds the full workflow and must not contradict it.
- Commit trailers: `Refs: Tn AC-n` (Quick: `Refs: AC-n`).

## Known open items

- E.1 residual overlaps: `operations-and-incidents` and `deployment-pipeline` (rollout wording); `test-driven-development` and `codebase-modernization` (characterization tests). `document-converter` has no trigger eval.
- `graphify` is not installed on this machine, so `graphify-out/` was not updated.
- The previous session's state lives outside the repo, under `~/.copilot/session-state/`. Do not resume it in parallel with work on this branch: both would write to the same working tree.
