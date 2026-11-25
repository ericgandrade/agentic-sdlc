---
name: verification-gate
description: This skill should be used when anyone is about to claim work is done, fixed, passing, ready for review or ready to release, when the PR Verification and Trace sections must be filled or audited, when a PR description or agent report must be checked as testimony, or when the sdlc-dod Definition of Done must be run against a change (the Test stage of the Agentic SDLC, and the evidence rule for every stage). Not for designing tests (use test-strategy), the multi-lens review verdict (use multi-axis-code-review), writing the sdlc-dod block (use project-context), or wiring it into CI (use deployment-pipeline).
license: MIT
---

# Verification Gate

## Purpose

Agentic SDLC · Test stage, and the evidence rule for every other stage. Used by the **Reviewer** (re-runs everything before a GO or NO-GO verdict) and the **Test Engineer** (records acceptance tests red at the base commit and green at the PR head); the **Developer** runs it before claiming a task done or a PR ready for review.

The gate turns a sentence such as "T3 is done" or "all ACs pass" into rows of evidence: the command that proves the claim, run fresh, its output read, compared against the claim, and recorded with the working-tree fingerprint it ran on. It adds three checks around that loop: a claims check (the PR description and agent reports are testimony, never evidence), a two-way gap check (every AC is tested; no code exists that nobody asked for) and a Definition of Done check against the `sdlc-dod` block in AGENTS.md.

The stage contract lives in `../agentic-sdlc/references/verification.md` (gate rules, CANNOT_VERIFY, fingerprint and staleness, trace). Record formats live in `../agentic-sdlc/templates/pr-body.md` and `../agentic-sdlc/templates/acceptance-tests.md`. This skill is the full procedure; when the two ever disagree, the contract wins and the gap is reported.

## When to Use

- Any completion claim: "done", "fixed", "passing", "works", "ready for review", "ready to release".
- A Developer finishing a plan task (`T-n`) or opening a PR.
- A Reviewer filling `## Verification` and `## Trace` before a verdict, or a re-review after new commits, a rebase or a merge from the base branch.
- A Test Engineer recording green acceptance-test rows at the PR head.
- A Release Engineer confirming DoD and AC rows on the release commit's fingerprint.
- Any agent or subagent report that says `DONE`; the report is checked, not trusted.

Do not use it for neighbouring work:

- Designing acceptance tests from the spec → `test-strategy` (this gate only runs and records them).
- Judging correctness, design and security findings across lenses → `multi-axis-code-review` (this gate supplies the evidence and trace those lenses read).
- Writing the failing test before code in Build → `test-driven-development`.
- Finding the cause of a red test → `systematic-debugging`.
- Running a plan task by task → `executing-plans` (it calls this gate at the end of every task).
- Writing the `sdlc-dod` block for a repository → `project-context` (this gate reads and enforces it).

## Workflow

### Step 0 — Discover the evidence context

1. Find the repository root (`git rev-parse --show-toplevel`). No repository → status `NEEDS_CONTEXT`; fingerprints need git.
2. Find the `sdlc-dod` fenced block in `AGENTS.md`, then `CLAUDE.md` (the same lookup order as the agentic-sdlc scripts). No block → `NEEDS_CONTEXT: sdlc-dod block missing`; route to `project-context`. Never invent DoD commands.
3. Find the acceptance criteria: `specs/NNN-slug/spec.md` (Standard, Full) or the issue body (Quick). Read the `Priority` of each AC; `critical` marks a Critical AC.
4. Find `specs/NNN-slug/plan.md` (`## Tasks` rows with their AC column) and `specs/NNN-slug/acceptance-tests.md` (AC → test ID → command). Quick has neither; record `n/a — Quick`.
5. Find the record: the PR body built from `../agentic-sdlc/templates/pr-body.md`, or `specs/NNN-slug/review.md` when the host has no pull requests.
6. Find the base: the base branch and the merge-base SHA (`git merge-base <base> HEAD`).
7. Check which agentic-sdlc helpers exist. `scripts/evidence.mjs`, `scripts/trace-check.mjs` and `scripts/dod-gate.mjs` are later-release files: when absent, apply the manual procedures in this skill and write `module missing: <path>` once in the PR body. Never claim a helper ran when it does not exist.

### Step 1 — Name the claim and list the required rows

Write the claim in one line, then derive the rows it needs from this table (it repeats `../agentic-sdlc/references/verification.md` §1):

| Claim | Who | DoD rows | AC rows |
|---|---|---|---|
| Task `T-n` done | Developer | every `sdlc-dod` key | the ACs on the task row in `plan.md` |
| PR ready for review | Developer | every `sdlc-dod` key | every AC of the spec (Quick: every AC in the issue) |
| GO verdict | Reviewer, re-running everything | every `sdlc-dod` key | every AC plus every test in `acceptance-tests.md` |
| Release GO | Release Engineer | every key on the release commit | every AC on the release fingerprint, plus the rollback rehearsal |

Claims outside the table ("no regressions", "performance within budget", "bug fixed", "the subagent finished") map to commands through `references/claim-command-catalog.md`. A claim with no command that could prove it is not a claim to make; restate it as an open question or a `CANNOT_VERIFY` row.

### Step 2 — Check the Definition of Done block

Read `sdlc-dod` before running anything (full procedure: `references/dod-check.md`):

- Keys are exactly `lint`, `typecheck`, `test`, `coverage`, `coverage_min`; one `key: command` per line.
- A key the project lacks reads `<key>: n/a — <reason>`; it still gets a row with `exit = n/a` and the reason. An empty value, `TODO`, or `n/a` without a reason → the block is invalid → `BLOCKED`.
- `coverage_min` is a number and never lower than its value on the base branch (`git show <base>:AGENTS.md`).
- A diff that lowers `coverage_min` or weakens a DoD command (adds `|| true`, `--passWithNoTests`, a narrower path, a disabled rule, a skip marker) is an authority violation (`../agentic-sdlc/references/tdd.md` §1, rule 6): the affected rows do not count, the finding is raised as Critical with cause `code`, and the only legitimate exception is a recorded waiver (`../agentic-sdlc/references/governance.md` §6).

The DoD and the ACs are separate checks. A green DoD never proves an AC; a passing AC test never replaces the DoD.

### Step 3 — Map each AC row to its command

- Standard and Full: take the command from `acceptance-tests.md` (`Green at the PR head` or `Red at the base commit` command column). Each test name contains its AC ID.
- Quick: take the acceptance test from the issue; the regression test name contains `AC-n`.
- Prefer a command that selects the AC's tests by name (`-t "AC-4"`, `-k AC_4`, `--grep "AC-4"`) so the output shows which tests ran.
- An AC with no runnable test → either `CANNOT_VERIFY` (Step 6) when the reason is legitimate, or a gap returned to the Test Engineer. Never substitute a DoD row for an AC row.

### Step 4 — Run fresh, bound to the fingerprint

Follow `references/fresh-run-protocol.md` for portable shell forms. The loop is:

1. Compute the fingerprint (`F1`):
   `node --input-type=module -e "const {pathToFileURL}=await import('node:url'); const m=await import(pathToFileURL(process.argv[1]).href); console.log(m.fingerprint().short)" "skills/agentic-sdlc/scripts/lib/git.mjs"`
   (from an installed copy, point at `../agentic-sdlc/scripts/lib/git.mjs`). Node absent → commit first, confirm `git status --porcelain` prints nothing, and use `head:<first 12 hex of git rev-parse HEAD>`.
2. Run every DoD command and every AC command in full. Capture the exit code from the shell, never from memory, and the last ≤ 40 output lines. Write scratch logs only under `.agentic-sdlc/evidence/`, which the fingerprint excludes.
3. Compute the fingerprint again (`F2`). `F1 ≠ F2` → the tree changed during the run (a formatter, a generated file, a snapshot update) → discard every row and repeat from step 1.
4. Each row gets `F1`, an ISO-8601 time with offset, and `by` = the role that ran it (`Developer`, `Reviewer`, `Test Engineer`, `Release Engineer`) or `self-review` when the author checked its own work in a separate pass.

When `scripts/evidence.mjs` exists in the installed agentic-sdlc version, `evidence record` replaces steps 1–4 and `evidence check` replaces the staleness test in Step 8.

### Step 5 — Read the output and compare it with the claim

An exit code is necessary, not sufficient. For each row read the output and confirm:

| Check | Pass when | Otherwise |
|---|---|---|
| Tests executed | ≥ 1 test ran, and every test named with the AC ID appears | exit 0 with 0 tests (filter matched nothing) → row fails |
| Failures | 0 failed, 0 errors | row fails; quote the first failing assertion |
| Skips | no skipped test carries the AC ID | a skipped, filtered or disabled AC test counts as missing |
| Warnings | no new deprecation or "test did not finish" warning in the excerpt | note it for lens L2; the row may still pass |
| Coverage | measured value ≥ `coverage_min` | row fails even when the tool exits 0; write the shell exit plus the comparison, `0 (76.2 < 78.4) — below floor` |
| Claim text | the asserted outcome matches the AC wording, number and unit | mismatch → finding for the Reviewer, routed spec / design / code |

Compare against the AC, not against the Developer's description of the AC. An AC that says "returns 422 and no partial file" is not proven by a test that asserts only the status code.

### Step 6 — Record the rows

Write the rows into `## Verification` of the PR body using the exact columns `ID · Test · Command · Exit · Fingerprint · Time · By`, one row per command, DoD rows first (`DoD:lint`, `DoD:typecheck`, `DoD:test`, `DoD:coverage`), then `AC-n` rows, then the `Docs` row. Put the last ≤ 40 lines of each command in the collapsed excerpt block, each prefixed by `$ <command>   # ID: <row ID> · fingerprint <12 hex>`. Update `**Current fingerprint:**` in the PR header.

Rules for the cells:

- `Exit` is copied from the shell. A row counts only with exit `0` (or `n/a — reason` for an `n/a` DoD key) and a fingerprint equal to the current one.
- A Test Engineer also fills `Green at the PR head` in `acceptance-tests.md` with the same rows.
- An AC that cannot be exercised before merge goes in the `### CANNOT_VERIFY` table with all seven cells: AC, Critical, reason, what was checked instead, verifier (role and person), when (≤ 14 days after release), waiver. "Not run" without a reason is a missing row. A Critical AC there needs a waiver (owner ≠ requester, reason, expiry ≤ 30 days, follow-up issue) before Test sign-off; more than half of the ACs there → NO-GO and back to Design for test seams. Repeat each item in `## Review guide` and as a post-release check in the release notes.
- A section with nothing to report says `none`; a blank cell is a missing row.

### Step 7 — Claims check (testimony against evidence)

The PR `## Summary`, the commit messages, code comments and every agent report are testimony. Run this step after Steps 4–6, so the narrative cannot steer what gets run:

1. Extract every checkable statement: ACs met, tests added, behaviour preserved, "no regressions", numbers (row limits, latency, sizes), "same as X", files untouched.
2. Map each statement to a Verification row or to a command from `references/claim-command-catalog.md`.
3. Mark each `supported` (a fresh row proves it), `falsified` (output contradicts it → finding with the output as evidence) or `unsupported` (no row can prove it → ask for the evidence or remove the statement).
4. Rows with `by: Developer` are testimony for the Reviewer; they are re-run, never copied.

On platforms with subagents, dispatch `prompts/claims-auditor.md` to a fresh context that receives the diff, the spec, the acceptance-tests map and the commands, and receives the PR text only after its own runs. If the platform has no subagents, run the prompt inline in a fresh pass after clearing working notes: start with `--- Reviewer pass: claims audit ---`, load only the inputs the prompt lists, and label the result `self-review` in `## Verification` and `## Review guide`.

### Step 8 — Two-way gap check

Fill `## Trace` with one row per AC and an `Orphans` line (procedure and examples: `references/two-way-gap-check.md`):

- **Forward (untested requirements):** every AC has ≥ 1 task, ≥ 1 commit and ≥ 1 test with a fresh passing row, or a waived `CANNOT_VERIFY`.
- **Backward (unrequested code):** every task names ≥ 1 AC; every commit names ≥ 1 `T-n` (Quick: `AC-n`) through `Refs: Tn AC-n` or `[Tn, AC-n]`; every cited AC ID exists in the spec; every changed file belongs to a task's `Files` list (Quick: `n/a — Quick`); every behaviour the diff adds serves an AC. Behaviour no AC asks for → L1 Important finding, scope outside the approved spec.

Any orphan → NO-GO until resolved by the rule in the orphan table of the reference. When `scripts/trace-check.mjs` exists, its output replaces the manual matrix and its exit 1 is a NO-GO.

### Step 9 — Staleness re-check and status

Re-check every row's fingerprint against the current one before each of these moments: a completion claim, a Reviewer GO, the Test sign-off request, the Release sign-off request, and after any commit, rebase, amend or merge from the base branch. A row is stale when its fingerprint differs, is empty or unknown, or is a `head:` row while the tree is now dirty. Stale → re-run; a stale row never counts.

Return the shared status:

| Status | When |
|---|---|
| `DONE` | every required row fresh and passing; claims supported; Orphans `none` |
| `DONE_WITH_CONCERNS` | all of the above, with listed concerns (new warnings, a lower-than-ideal test level) |
| `BLOCKED` | a row missing, non-zero, or stale; a falsified claim; an orphan; an invalid DoD block |
| `NEEDS_CONTEXT` | no repository, no `sdlc-dod` block, no ACs, or no acceptance-test map on Standard/Full |
| `CANNOT_VERIFY` | at least one AC recorded in the CANNOT_VERIFY table; names who verifies it and when |

A Reviewer starts from NO-GO and moves to GO only when every AC has a fresh passing row or a waived `CANNOT_VERIFY` and the Orphans list is `none`; the remaining GO conditions (findings, lenses) belong to `multi-axis-code-review`. Agents never give Test sign-off; the human reviewer does.

## Anti-rationalization

The left column quotes thoughts to catch; it is not guidance.

| Thought | Reality |
|---|---|
| "The tests passed ten minutes ago." | Ten minutes ago was another fingerprint. Re-run. |
| "Only a comment or a rename changed." | Any byte moves the fingerprint; renames break imports. Re-run. |
| "Exit 0, so it passed." | Exit 0 with 0 tests executed proves nothing. Read the count. |
| "CI is green." | CI ran the DoD on some commit. Check its SHA, and each AC still needs its own row. |
| "The Developer pasted the output." | Testimony. The Reviewer runs the command again. |
| "The subagent said DONE." | Read the diff and run the command; a report is a claim. |
| "The focused test passes, so there are no regressions." | A focused run proves one test. "No regressions" needs the full suite on the current fingerprint. |
| "Coverage only dropped 0.3 points; lower the floor." | `coverage_min` is never lowered. Add the missing test, or request a waiver from an owner. |
| "This AC is hard to test; leave it out." | Write a `CANNOT_VERIFY` row with reason, verifier and date, or return it to the Test Engineer. |
| "The PR description explains it well." | Well-written testimony is still testimony. Map each statement to a row. |
| "The extra endpoint is harmless." | Unrequested behaviour is scope outside the spec: L1 Important finding. |
| "Run it once more until it passes." | A test that passes on retry is flaky; record the failure and route it to `systematic-debugging`. |
| "Skip the trace this time; it is a small PR." | Small PRs are where orphan commits and untested ACs hide. Fill the matrix. |

## Critical Rules

- **NEVER** state done, fixed, passing, works or ready without fresh rows for the DoD and the ACs on the current fingerprint.
- **NEVER** type an exit code, a test count or a coverage value from memory; copy them from the output.
- **NEVER** copy another role's rows into a Reviewer GO; re-run every command.
- **NEVER** count a row whose fingerprint differs from the current fingerprint, is empty, or is a `head:` row on a dirty tree.
- **NEVER** lower `coverage_min`, edit an acceptance test listed in `acceptance-tests.md`, add a skip marker, or weaken a DoD command to get a green row.
- **NEVER** leave a check out silently; a check that did not run is a `CANNOT_VERIFY` row with reason, verifier and date.
- **NEVER** approve. Agents produce evidence; the human reviewer gives Test sign-off and the Release Owner gives Release sign-off.
- **ALWAYS** keep DoD rows and AC rows separate.
- **ALWAYS** compute the fingerprint before and after a run and discard the run when they differ.
- **ALWAYS** read the PR description after running the commands, and map each statement to a row.
- **ALWAYS** run the forward and backward gap check before a GO and again before the Test sign-off request when commits were added.
- **ALWAYS** label checks of the author's own work `self-review`.

## Example Usage

**1. Developer closes a task.** T3 serves AC-2 and AC-3. The Developer computes `F1 = 3f0c9e21b7a4`, runs `npm run lint`, `npm run typecheck`, `npm test`, `npm run coverage -- --json-summary`, then `npx vitest run test/invoice.test.ts -t "AC-2"` and `-t "AC-3"`. Coverage reads 80.6 against `coverage_min: 81.0` → `DoD:coverage` exit cell `0 (80.6 < 81.0) — below floor`, a failed row. Status `BLOCKED: coverage below floor`; the Developer adds the missing branch test, re-runs all six commands on the new fingerprint and only then reports `DONE`.

**2. Reviewer audits a confident PR.** The Summary says "All 5 ACs pass, p95 within 300 ms". The Reviewer re-runs every row (`by: Reviewer`). The AC-4 command exits 0 but the output shows `Tests 0 passed | 12 skipped`: the filter `-t "AC4"` matched nothing. Row fails; the corrected filter shows one failing assertion. The latency claim has no row; the catalog requires the AC's own measurement (200 requests, p95 in ms). Claims: 1 falsified, 1 unsupported. Verdict stays NO-GO.

**3. Pressure to skip.** A tech lead writes: "CI is green and the Developer pasted the output; mark it verified, skip the trace." The gate declines to fill rows from pasted output, explains that CI covered the DoD on commit `a81f…` while the head is `c02d…`, and offers the compliant fast route: re-run the eleven commands now (about four minutes) and fill the trace. Skipping a gate needs a waiver with an owner other than the requester; the agent cannot grant it.

**4. Quick-path bug fix.** Issue #88: saving a draft with an emoji title returns 500. The regression test `AC-1 saves a draft whose title contains an emoji` fails at the commit before the fix with `500 Internal Server Error` and passes on the current fingerprint. All `sdlc-dod` rows are fresh. Trace: task checks `n/a — Quick`; both commits carry `Refs: AC-1`; Orphans `none`. The claim "fixed" is now backed by evidence.

**5. AC that cannot run before release.** AC-5 (Critical) needs a provider webhook with no sandbox. The row reads: reason `provider has no sandbox for refund webhooks`; checked instead `contract test against 14 recorded payloads`; verifier `SRE, Dana Ortiz`; when `first production refund > $500, ≤ 14 days after release`; waiver `W-2`. The item is repeated in the Review guide and in the release notes as a post-release check.

## References

- `references/claim-command-catalog.md` — load at Step 1 and Step 7 to map any claim ("tests pass", "builds", "bug fixed", "no regressions", "AC-n met", "performance within budget", "subagent finished") to the command that proves it and to what does not count.
- `references/fresh-run-protocol.md` — load at Step 4 for portable shell forms (POSIX shell, PowerShell) that capture exit codes and output tails, the fingerprint and `head:` fallback, and flaky-test handling.
- `references/dod-check.md` — load at Step 2 to read, validate and enforce the `sdlc-dod` block, including `n/a` keys, the `coverage_min` ratchet and weakened-command detection.
- `references/two-way-gap-check.md` — load at Step 8 for the AC ↔ task ↔ commit ↔ test ↔ file matrix, the commands that build it, and the orphan resolution table.
- `prompts/claims-auditor.md` — dispatch at Step 7 as a fresh-context subagent (or run inline as a labelled pass) that re-runs the commands and audits the PR description as testimony.
- `../agentic-sdlc/references/verification.md` — the stage contract; load when any rule here seems ambiguous.
- `../agentic-sdlc/templates/pr-body.md` and `../agentic-sdlc/templates/acceptance-tests.md` — the record formats filled in Steps 6 and 8.
