# Handoff: Agentic SDLC, v3.0.0

**Date:** 2026-11-25
**Branch:** `claude/agentic-sdlc-handoff` (pushed to `origin`), created from `claude/superskills-dev-workflow-kppj2r` at `8c5d014`
**Why:** the previous agent session (GitHub Copilot CLI) stopped on `402 quota_exceeded` while the E.3 dogfood agent was finishing. A short Claude Code session then wrote this handoff and fixed F18; it is also close to its token limit. **Work continues in a new Claude Code session on another account.**

## Start here

1. `git fetch origin && git switch claude/agentic-sdlc-handoff && git status` (expect a clean tree). Work on this branch; do not go back to `claude/superskills-dev-workflow-kppj2r`.
2. Read this file, then section 4 (findings table) of [`docs/research/2026-11-25-dogfood-report.md`](../research/2026-11-25-dogfood-report.md). Nothing else is needed to start.
3. Confirm the baseline (commands under "Verified" below).
4. **Next task: F10 and F27**, the fingerprint going stale on record-only commits. `8c5d014` already excludes review records from the fingerprint (`skills/agentic-sdlc/scripts/lib/git.mjs`), so check what is still open before changing code. Add or update a test with any script change.
5. One commit per finding or pair. Update the status here as findings close.

**Branch rule:** all work stays on `claude/agentic-sdlc-handoff`. No PR to `main` and no tag until the owner asks; `main` is the previous version. The root `README.md` is a stakeholder presentation of the method; the former README is now `docs/skills-library.md` (add new skills there; `CLAUDE.md` now says so; `release.js major` was dry-run in a scratch copy on 2026-11-25: title, badge, footer and plugin go to 3.0.0 and both sync checks pass; catalog regeneration needs Python `pyyaml`). For the root README: keep its status and findings counts current, and do not overstate the scores.

**Where we are:** all build phases are done. **What is stopped:** 14 Important and 14 Minor dogfood findings, the E.5 re-run and the v3.0.0 release prep. Nothing is running.

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
| E.3 dogfood | Report written; F18 (Critical) fixed and re-tested; all 14 Important fixed (see Findings progress); 14 Minor open | `docs/research/2026-11-25-dogfood-report.md` |
| E.4 clarity test | Done; G-9, G-10, G-12, G-14, G-15 left open (Minor) | `docs/research/2026-11-25-clarity-test.md` |
| E.5 live trigger evals | Inconclusive (harness), re-run needed | `docs/research/2026-11-25-eval-check.md` |
| Phase F docs, `bundles.json` packaging fix | Done | `68ab211` |
| Release prep | **Not started** | package version is still 2.0.8 |

## Findings progress

Plan: [`docs/plans/2026-11-25-dogfood-findings-fix-plan.md`](../plans/2026-11-25-dogfood-findings-fix-plan.md).

| ID | State | Commit / note |
|---|---|---|
| F18 | Fixed and re-tested (7/7 checks pass) | `eb7a3a6`; re-test in the dogfood report §7; doc ambiguities it found fixed |
| F10 | Fixed | fingerprint excludes `specs/*/{review,approvals,handoff,impediments,release-notes}.md` and `specs/*/run-ledger.jsonl`; test in `git.test.mjs` |
| F27 | Fixed | release notes, `release-ops.md` and `shipping-and-handover` re-run AC/DoD at the release commit unless the tree equals the PR head |
| F21 | Fixed (docs) | `verification.md` §5 and `verification-gate` exempt artifact-only commits from the Tn rule |
| F22 | Fixed | `run-ledger` accepts `round`/`ruling --task PR` review-fix after `finish` and re-archives; `multi-axis-code-review` uses the `<scripts>` lookup; test in `run-ledger.test.mjs` |
| F16 | Fixed | `8c5d014` (spec-lint `n/a — <reason>` for Alert/Rollout, with test) + spec template points to the library profile; OBS01 only needs words, so `n/a — reason` passes |
| F25 | Fixed (docs) | `release-ops.md` §Package or library profile; release-notes template, `shipping-and-handover` Step 8 and the Release Engineer brief point to it |
| F09, F11 | Fixed (docs) | templates by `8c5d014`; `review.md`, `governance.md` and `artifacts.md` (table and tree) now name the no-host review record and its `## Test sign-off` row |
| F14 | Fixed (docs) | `paths.md` public-API trigger covers a library's exported symbols, with an example |
| F04 | Fixed | preflight `coverage-floor` check reads `coverage/coverage-summary.json` and fails below `coverage_min` (SKIP for other formats); test in `preflight.test.mjs` |
| F05 | Fixed (docs) | `dod-block.md`: no bare directory for `node --test`, c8 with a glob, and a dependency-free `scripts/coverage.mjs` (checked on Node 24) |
| F19 | Fixed | `run-ledger check` counts the `File` column of `acceptance-tests.md` §Map as in-plan; test in `run-ledger.test.mjs` |
| F23 | Fixed (docs) | `artifacts.md` naming rule: non-digit after the AC ID in filters, scope to the item's test files, Quick names add the issue |
| F08 | Fixed (docs) | `vendoring.md`: `AGENTIC_SDLC_SKILL` / `SUPERSKILLS_REPO` / plugin cache lookup; `missing:` generated from the router's † scripts (procedure run in a scratch repo) |

## Verified at `eb7a3a6` (tests and budget; the script checks below ran at `8c5d014`)

- `node --test skills/agentic-sdlc/scripts/test/*.test.mjs`: 124 pass, 0 fail (126 after F04 and F19).
- `node skills/agentic-sdlc/scripts/budget-check.mjs`: PASS (`agents/test-engineer.md` warns, 572/600).
- `./scripts/build-skills.sh`: OK.
- `check-doc-consistency.sh` and `verify-version-sync.sh` fail **only** on `cli-installer/README.md`, which already says 3.0.0 while the other files say 2.0.8. `release.js` resolves this.

## Next steps

1. Fix the E.3 findings: 1 Critical and 14 Important (table in the report, section 4). Suggested order:
   1. ~~**F18** (Critical)~~: fixed on this branch (docs only: tests live on `at/NNN-slug` until green). Not yet re-dogfooded.
   2. **F10, F27**: the fingerprint goes stale on record-only commits. Check what `8c5d014` already excludes.
   3. **F21, F22**: artifact commits fail Trace; review-fix rounds are refused after `run-ledger finish`.
   4. **F16, F25**: library or package profile. `8c5d014` added `n/a` for Alert and Rollout, so F16 may be partly closed.
   5. Re-check F09, F11 and F14 against `8c5d014` (they overlap clarity gaps G-4, G-6, G-9), then F04, F05, F08, F19, F23.
2. Release prep, on a clean tree:
   - `node scripts/release.js major`. The `version` script in `cli-installer/package.json` runs `git add -A`, so stray files get staged.
   - Run `verify-version-sync.sh`, `check-doc-consistency.sh`, `./scripts/package-plugin.sh`.
   - Commit `chore: bump version to 3.0.0`.
3. Commit and push this branch after each step.
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
- The previous session's state lives outside the repo, under `~/.copilot/session-state/`. Do not resume it in parallel with work on this branch: both would write to the same working tree. Its process (PID 49820) was still open on 2026-11-25; close it first.
- F18 was re-tested on 2026-11-25 (dogfood report §7): all checks pass.
