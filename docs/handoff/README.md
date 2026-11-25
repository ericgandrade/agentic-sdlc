# Handoff: Agentic SDLC, v3.0.0

**Date:** 2026-11-25
**Branch:** `claude/agentic-sdlc-handoff` (pushed to `origin`), created from `claude/superskills-dev-workflow-kppj2r` at `8c5d014`
**Why:** the previous agent session (GitHub Copilot CLI) stopped on `402 quota_exceeded` while the E.3 dogfood agent was finishing. A short Claude Code session then wrote this handoff and fixed F18; it is also close to its token limit. **Work continues in a new Claude Code session on another account.**

## Start here

1. `git fetch origin && git switch claude/agentic-sdlc-handoff && git status` (expect a clean tree). Work on this branch; do not go back to `claude/superskills-dev-workflow-kppj2r`.
2. Read this file, then section 4 (findings table) of [`docs/research/2026-11-25-dogfood-report.md`](../research/2026-11-25-dogfood-report.md). Nothing else is needed to start.
3. Confirm the baseline (commands under "Verified" below).
4. **Next task: the 7 Minor findings recommended before release** (section "Minor findings" below), then release prep. All Critical and Important findings are closed (see "Findings progress"). Add or update a test with any script change.
5. One commit per finding or pair. Update the status here and in the root README as findings close.

**Branch rule:** all work stays on `claude/agentic-sdlc-handoff`. No PR to `main` and no tag until the owner asks; `main` is the previous version. The root `README.md` is a stakeholder presentation of the method; the former README is now `docs/skills-library.md` (add new skills there; `CLAUDE.md` now says so; `release.js major` was dry-run in a scratch copy on 2026-11-25: title, badge, footer and plugin go to 3.0.0 and both sync checks pass; catalog regeneration needs Python `pyyaml`). For the root README: keep its status and findings counts current, and do not overstate the scores.

**Where we are:** all build phases are done; F18 is re-tested and all 14 Important findings are fixed (2026-11-25). **What is open:** 14 Minor findings (7 recommended before release), the E.5 re-run and the v3.0.0 release prep. Nothing is running.

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

## Independent review of the fixes (2026-11-25)

A separate Opus reviewer read the range `6d2c38d..` without this session's reasoning: 126/126 tests, budget PASS, nothing blocking. Its four verified defects are fixed: post-finish budget halt that could never be resumed (`run-ledger.mjs`, test added); `loops.md` and `fix-loop-and-escalation.md` contradicting the post-finish PR rounds and counters; vendoring with a relative `AGENTIC_SDLC_SKILL`; a garbled sentence in `dod-block.md`. Also applied: AC filters use `AC-n(?![0-9])` (a trailing space missed names ending in the ID), library rollback rehearsal against a scratch registry, the artifact-commit exemption no longer covers `.agentic-sdlc/bin/` or `config.json`, `coverage-floor` reads the summary only when `coverage` ran, Quick review-record path in `multi-axis-code-review` and `shipping-and-handover`.

Known and accepted (not fixed):
- `result.json` keeps the `finish` status; post-finish PR rounds only update the archived ledger.
- Prompt-only mode pastes ledger rows into `plan.md ## Loop ledger`, which still changes the fingerprint (scripts absent; rare).
- With the F18 flow, F19's in-plan rule matters mostly at the Test-stage merge.
- The worked example still filters with `-t "AC-1"`; changing it would change its plan hash.

## Minor findings: recommendation before v3.0.0

Fix before release (contradictions or a fallback every session hits; each is a small doc edit):

| ID | Why before release |
|---|---|
| F02 | Mis-indented line in the `artifacts.md` layout tree; one-line fix |
| F03 | `plan.md` and `spec.md` templates disagree on deleting comment blocks |
| F06 | Two formats for the Platform/Enforcement lines (`agents-md-block.md` vs `platforms.md`) |
| F20 | `executing-plans` and `tdd.md` disagree on whether an import error is a valid red |
| F24 | Waiver table has 7 columns in templates and 10 in `governance.md` |
| F26 | Release notes have no location or PR value without a host (same pattern as F09) |
| F29 | Router Step 0 starts with scripts that do not ship (`status.mjs`, `path-score.mjs`, `faq.md`); put the manual fallback first. The router is at 2196/2200 words, so this needs a trim elsewhere in `SKILL.md` |

Can wait (behaviour is defined, only friction or polish): F07 (new 1-commit repo classified adopt), F12 (Quick PR header has no Issue field), F13 (`run-ledger start` needs `--plan`; Quick writes rows by hand, which is documented), F15 (Standard file bound counts docs), F17 (OBS errors report the section line), F28 (retro timing with a staged rollout), F30 (shared import error as red evidence for new modules).

## Verified at `8c58b0e` (2026-11-25)

- `node --test skills/agentic-sdlc/scripts/test/*.test.mjs`: 126 pass, 0 fail.
- `node skills/agentic-sdlc/scripts/budget-check.mjs`: PASS (warnings: router 2196/2200, quickstart 1142/1200, analyst 580/600).
- `./scripts/build-skills.sh`: OK.
- `check-doc-consistency.sh` and `verify-version-sync.sh` fail **only** on the root `README.md` and `cli-installer/README.md`, which already say 3.0.0 while the package says 2.0.8. `release.js major` resolves this (it leaves already-updated README lines alone).

## Next steps

1. Fix the 7 Minor findings recommended before release (F02, F03, F06, F20, F24, F26, F29; section above). F29 needs a word trim in the router first.
2. Release prep, on a clean tree:
   - `pip install pyyaml` (catalog regeneration in `release.js` needs it).
   - `node scripts/release.js major`. The `version` script in `cli-installer/package.json` runs `git add -A`, so stray files get staged. `CHANGELOG.md` already has `[3.0.0]`, so no placeholder is added; review it.
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

- E.1 residual overlaps: `operations-and-incidents` and `deployment-pipeline` (rollout wording); `test-driven-development` and `codebase-modernization` (characterization tests). (`document-converter`, which had no trigger eval, moved to knowledge-superskills.)
- `graphify` is not installed on this machine, so `graphify-out/` was not updated.
- The previous session's state lives outside the repo, under `~/.copilot/session-state/`. Do not resume it in parallel with work on this branch: both would write to the same working tree. Its process (PID 49820) was still open on 2026-11-25; close it first.
- F18 was re-tested on 2026-11-25 (dogfood report §7): all checks pass.
