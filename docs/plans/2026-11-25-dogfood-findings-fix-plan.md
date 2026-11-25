# Plan: close the E.3 dogfood findings before v3.0.0

**Date:** 2026-11-25
**Branch:** `claude/agentic-sdlc-handoff` (pushed from a local worktree; no PR, no tag, no merge to `main`)
**Inputs:** `docs/handoff/README.md`, `docs/research/2026-11-25-dogfood-report.md` §4, commit `8c5d014`
**Stop point:** before `node scripts/release.js major`. The owner reviews the status first.

## Baseline at `6d2c38d` (matches the handoff)

| Check | Result |
|---|---|
| `node --test skills/agentic-sdlc/scripts/test/*.test.mjs` | 124 pass, 0 fail |
| `budget-check.mjs` | PASS (`agents/test-engineer.md` 562/600) |
| `./scripts/build-skills.sh` | OK |
| `verify-version-sync.sh` | 2 issues, both in `cli-installer/README.md` (badge and title say 3.0.0) |
| `check-doc-consistency.sh` | 1 issue, same file |

## Triage of the 14 Important findings against `8c5d014`

| ID | State at `6d2c38d` | What is still open | Fix type |
|---|---|---|---|
| F10 | Partial | Only `specs/*/review.md` and `docs/reviews/**` are excluded. `approvals.md`, the archived `run-ledger.jsonl` and sign-off-only commits still change the fingerprint. | Code + test |
| F27 | Open | The release commit changes real files (version, CHANGELOG), so exclusion cannot help. | Template + doc |
| F21 | Open | No script enforces "every commit names ≥ 1 Tn"; `plan-graph --from-git` only reads trailers. | Doc only |
| F22 | Open | `run-ledger` refuses `round` after `finish` (line 505); `multi-axis-code-review` calls `skills/agentic-sdlc/scripts/`. | Code + test + doc |
| F16 | Partial | `n/a — <reason>` accepted for Alert (OBS03) and Rollout (OBS04). Check OBS01 (empty rows) and the template wording for the other rows. | Code + test if needed |
| F25 | Open | No library/package profile in release notes, R3/R5, go/no-go 4. | Template + doc |
| F09 | Partial | `pr-body.md` and `verification.md` name `docs/reviews/<issue>.md` for Quick; `references/review.md:100` still names only `specs/NNN-slug/review.md`. | Doc only |
| F11 | Partial | `pr-body.md` has `## Test sign-off`; `governance.md:7,24` and `artifacts.md:105` still say "approving PR review" with no no-host form. | Doc only |
| F14 | Open | `paths.md:44` public-API trigger does not mention library exports. | Doc only |
| F04 | Open | Preflight never compares coverage with `coverage_min`. | Code + test, or doc "CI-only" |
| F05 | Partial | c8 example exists; the Node 22 `node --test <dir>` failure and the no-dependency path are not covered. | Doc only |
| F08 | Open | Vendoring finds SKILL only under `~/.*/skills`; `missing:` typed by hand. | Doc (env var / repo path) |
| F19 | Open | `run-ledger check` flags acceptance-test files as out-of-plan. | Code + test |
| F23 | Open | AC IDs not namespaced; `AC-1` matches `AC-10`. | Doc (naming rule) |

## Steps (one commit per finding or pair; each updates the handoff status and the README status)

1. **F10 + F27** — `fingerprint()` excludes a named list of record files: `specs/*/review.md`, `specs/*/approvals.md`, `specs/*/run-ledger.jsonl`, `docs/reviews/**`. `spec.md`, `plan.md` and `acceptance-tests.md` stay in, because editing them voids a sign-off. One test per excluded path, plus one proving `spec.md` still counts. For F27, `release-notes.md` and `shipping-and-handover` tell the Release Engineer to re-run every AC/DoD command at the release commit and record the rows in §Shipped AC. Update `verification.md` (Fingerprint).
2. **F21 + F22** — F21: `verification.md` Trace rule exempts artifact commits (`docs:`/`chore:` touching only `specs/**`, `docs/**` or the ledger) and says so in the Rule and the Fix table. F22 decision: **allow `round --task PR --loop review-fix` after `finish`** (and `ruling --task PR`), recorded against the finished run, so `finish` stays where executing-plans puts it. Test: round after finish succeeds for `PR/review-fix` and is still refused for `Tn`. Fix the script path in `multi-axis-code-review/SKILL.md` to use the step-0 lookup (`.agentic-sdlc/bin/` first).
3. **F16 + F25** — Confirm OBS01/02 behaviour for a library spec; add a test with a full library-profile spec that passes. Add a "Package or library" profile to `release-notes.md` (dist-tag or channel rollout, rehearsal by revert and republish, alert from consumer CI, `n/a` where nothing applies), and reference it from `release-ops.md` and `shipping-and-handover`.
4. **F09 + F11** — Align `review.md`, `governance.md` and `artifacts.md` with the Quick location and the `## Test sign-off` table. Doc only.
5. **F14** — Add the library-export case to the public-API trigger in `paths.md`, with an example row.
6. **F04 + F05** — Decide: preflight reads `coverage/coverage-summary.json` and fails below `coverage_min` (code + test), unless the test fixtures make this too invasive, in which case document "floor checked in CI only". Add the Node 22 note (`node --test 'test/**/*.test.mjs'`, not a directory).
7. **F19 + F23** — `run-ledger check` treats files listed in `specs/NNN-slug/acceptance-tests.md` as in-plan (test). `verification.md` and the acceptance-tests template namespace test names (`001/AC-1`) so patterns do not collide.
8. **F08** — `vendoring.md` accepts `SKILL` from an env var or repo path and derives `missing:` from a `ls` against the Module Index.
9. **F18 retest** — Standard path Build in a scratch repo copied from `docs/research/dogfood-2026-11-25/standard/` fixtures: acceptance tests on `at/NNN-slug`, preflight `baseline-dod` green on the feature branch, merge at Test. Record the result in the dogfood report and the handoff.
10. **Minor list** — Table of the 14 Minor findings with a fix-before-release recommendation.
11. **README review** — Mermaid diagram renders on GitHub (check syntax; `gh` render via the API or a preview); status and finding counts current; scores stated as measured, no rounding up.
12. **Docs debt** — `CLAUDE.md` New Skill Checklist points to `docs/skills-library.md`; fix the broken `references/skills-development.md` link in `docs/skills-library.md`; dry-run `scripts/release.js` logic against the new README title and footer (read-only, no version change).
13. **Stop** — Report status. Release v3.0.0 is not started.

## Verification per step

- Every script change: `node --test skills/agentic-sdlc/scripts/test/*.test.mjs` green, with the new test failing before the fix.
- Every edit to the router or an agent brief: `budget-check.mjs` PASS.
- Before each push: `./scripts/build-skills.sh` OK.
