# Pre-ship checklist (P1–P14)

Load at Step 1 of `SKILL.md`: before the PR opens, and again after every update from the base branch, every fix and every rebase. The checklist is the Developer's own gate at the end of Build; it does not replace the Reviewer's re-run in the Test stage (`../agentic-sdlc/references/verification.md` §1).

Paths starting with `../agentic-sdlc/` are relative to this skill's folder; `skills/agentic-sdlc/...` paths are relative to the repository root.

## How to run

1. Confirm the base branch and record `<base>` and its SHA.
2. Compute the fingerprint (command in §Fingerprint) and write it at the top of the record.
3. Run P1–P14 in order. Each item gets `pass`, `fail` or `n/a — <reason>`, the command, its exit code copied from the shell, and the shortest output excerpt that proves the value (≤ 10 lines; secrets never printed).
4. Compute the fingerprint again. A different value → the tree changed during the run → discard the record and start over.
5. Any `fail` → report `BLOCKED` with the item numbers; no integration menu. After fixing, re-run **all** items: a fix moves the fingerprint and can break an item that passed.

## Items

| # | Item | Command or check | Pass when | Applies to | On fail |
|---|---|---|---|---|---|
| P1 | Every task committed | `node skills/agentic-sdlc/scripts/plan-graph.mjs specs/NNN-slug/plan.md --from-git <base>..HEAD --json` | No task without a commit; exit 0 | Standard, Full (Quick: `n/a — Quick`) | Finish the task with `executing-plans`, or remove it through the change protocol |
| P2 | Every commit traced | `git log --format='%h%x09%s%x09%(trailers:key=Refs,valueonly,separator=%x20)' <base>..HEAD` | Each line names a `Tn` (trailer `Refs: Tn AC-n` or subject `[Tn, AC-n]`); Quick: an `AC-n` | all | Reword on the feature branch (`git rebase -i <base>`, `reword`); never on the default branch |
| P3 | Approvals valid | `node skills/agentic-sdlc/scripts/spec-lint.mjs specs/NNN-slug/spec.md --check-approval` and `node skills/agentic-sdlc/scripts/plan-graph.mjs specs/NNN-slug/plan.md --check-approval` | Both exit 0 | Standard, Full | Approval void → change protocol (`../agentic-sdlc/references/rules.md`); no PR until renewed |
| P4 | Clean tree | `git status --porcelain` | Prints nothing | all | Commit with a `Tn`, or remove scratch files that are not part of the change |
| P5 | Base current | `git fetch <remote> <base>` then `git merge-base --is-ancestor <remote>/<base> HEAD` | Exit 0 | all | Update the branch (merge or rebase per the project's convention); restart at P1 |
| P6 | Fresh DoD and AC rows | Run every `sdlc-dod` key and every AC test command | Every row `exit 0` (coverage `0 (measured ≥ coverage_min)`) on the current fingerprint; DoD keys written `n/a — <reason>` in `sdlc-dod` get a row with that reason | all | Fix through Build; a test listed in `acceptance-tests.md` is never edited by the Developer |
| P7 | No secrets | `git diff <base>...HEAD -i -G'password\|secret\|api_key\|token\|private_key\|BEGIN .*PRIVATE KEY' --name-only` | Prints nothing, or every listed file is opened and cleared (the match is a variable name, a test fixture with a fake value, documentation) | all | Remove the value, rotate it if it was ever pushed, rewrite the branch history before any push |
| P8 | No debug leftovers | `git diff <base>...HEAD -U0 \| grep -nE '^\+.*(console\.log\|debugger\|print\(\|\.only\(\|\.skip\(\|\[debug-)'` (adapt the probes to the language) | Prints nothing, or each hit is intended (a logger call, a documented skip with an issue) | all | Remove the probe; a skipped test needs an issue and a reviewer note |
| P9 | In scope | `git diff --name-only <base>...HEAD` | Every file is in the plan's `Files` columns, an acceptance-test file, a docs page of the docs task, or under `specs/NNN-slug/`; count ≤ path bound (Quick 3, Standard 15) | all | Stop; re-score with `../agentic-sdlc/references/paths.md`; route up and log a Revision entry. Never route down |
| P10 | Flag defaults off | Read the flag definition in code or configuration | The default value is off / false / 0% | changes behind a flag | Fix the default; R4 at Release re-checks production |
| P11 | Signal emitted as named | Search the diff for the metric or log event name from `spec.md` §Release & observability | The exact name appears at the emitting call site, tagged with its AC | Standard, Full; Quick with a production deploy | Rename to the spec's name, or change the spec through the change protocol |
| P12 | Migrations classified | List migration files in the diff | Each has a tested down step, or is an expand step whose contract step ships later, or is declared one-way in the PR Door line on a Full path | schema/migration trigger | Add the down step or the expand/contract split; a one-way migration below Full → route up |
| P13 | Dependencies approved | Compare lockfile and manifest changes with the plan's `## Dependencies` | Every new dependency is named there with its Design sign-off note | when manifests change | Stop; ask the Planner for a plan amendment (rule 10) |
| P14 | Docs drift checked | `references/docs-drift-check.md` result | Every stale pair fixed or routed to a docs task with an owner; Docs row filled | all | Fix inline docs, or dispatch the Tech Writer |

## Fingerprint

```bash
node --input-type=module -e "const {pathToFileURL}=await import('node:url'); const m=await import(pathToFileURL(process.argv[1]).href); console.log(m.fingerprint().short)" "<skill-dir>/scripts/lib/git.mjs"
```

From an installed location use `../agentic-sdlc/scripts/lib/git.mjs`. Node absent → commit first; `git status --porcelain` must print nothing; record `head:<first 12 hex of git rev-parse HEAD>` (the manual procedure in `../agentic-sdlc/references/verification.md` §4).

## Record format

Paste into the Developer report (not the PR body) and keep the last record until the PR is merged:

```text
Pre-ship · feature/csv-export · base main @ 9e1d4c2 · fingerprint b7e2a91c04d5 · 2026-11-25T09:31:10-03:00
P1 pass  plan-graph --from-git main..HEAD --json → exit 0, open tasks: none
P2 pass  8 commits, all with Tn
P3 pass  spec-lint --check-approval exit 0 · plan-graph --check-approval exit 0
P4 pass  git status --porcelain → (empty)
P5 pass  merge-base --is-ancestor origin/main HEAD → exit 0
P6 pass  4 DoD rows + 6 AC rows exit 0 on b7e2a91c04d5
P7 pass  (no files)
P8 pass  (no hits)
P9 pass  12 files ≤ 15 (10 plan, 1 acceptance test, 1 docs page)
P10 pass server/src/config/flags.ts:14 reports.csvExport default false
P11 pass reports_export_requests_total at server/src/routes/reports/export.ts:22 (AC-1, AC-4)
P12 n/a — no migration
P13 n/a — no manifest change
P14 pass docs/reports/export.md updated; docs build + links exit 0
Result: 14/14 → integration menu
```

## Quick-path variant

P1 and P3 are `n/a — Quick`. P2 requires `Refs: AC-n`. P9 bound is 3 files. P11 applies only when the item deploys to production: the PR body carries `Observability: <signal> · rollback: <command>`. P12 with any schema change is not Quick: re-score.

## Common false passes

| Looks like a pass | Why it is not |
|---|---|
| CI is green on the last push | CI ran on an older fingerprint, or on the DoD only. Every AC needs its own row. |
| `git status` is clean in the main checkout | The work lives in a linked worktree; run the checks there. |
| The secret scan found only `.env.example` | Open it: example files leak real values often. |
| "The extra file is just a refactor" | Outside `Files` is outside the approved plan; P9 fails until the plan says so. |
