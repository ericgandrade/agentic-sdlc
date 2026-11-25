# Two-Way Gap Check

Load at Step 8. Fills the PR `## Trace` matrix and `Orphans` line defined in `../../agentic-sdlc/references/verification.md` §5 and `../../agentic-sdlc/templates/pr-body.md`. When `scripts/trace-check.mjs` exists in the installed agentic-sdlc version, it writes `specs/NNN-slug/trace.md` and its exit 1 lists the orphans; it replaces §2–§3 below. Until then, build the matrix by hand.

The check runs in two directions:

- **Forward — untested requirements.** Every AC reaches a task, a commit, a test and a fresh passing Verification row (or a waived `CANNOT_VERIFY`).
- **Backward — unrequested work.** Every task, commit, test reference and changed behaviour points back to an AC that exists in the approved spec.

Run it before a Reviewer GO, and again before the Test sign-off request whenever commits were added after the first run.

## 1. Inputs

| Input | Source | Quick path |
|---|---|---|
| AC list | `AC-n` headings or rows in `specs/NNN-slug/spec.md` | the issue body |
| Tasks | `## Tasks` table in `plan.md` (ID, AC column, Files column) | `n/a — Quick` |
| Commits | `git log <base>..HEAD` | same |
| Tests | test names containing `AC-n` in the test directories; `acceptance-tests.md` Map | test names in the diff |
| Verification rows | PR `## Verification` | same |
| Changed files | `git diff --name-only <base>...HEAD` | same |

## 2. Commands

```bash
BASE=$(git merge-base origin/main HEAD)          # use the PR's base branch

# AC IDs in the spec
grep -oE 'AC-[0-9]+' specs/NNN-slug/spec.md | sort -uV

# Commits with their task and AC references (subject brackets and Refs trailers)
git log --format='%h%x09%s%x09%(trailers:key=Refs,valueonly,separator=%x20)' "$BASE"..HEAD

# Tests that name an AC (adjust directories; Python names use AC_4)
grep -rnE 'AC[-_][0-9]+' test/ tests/ e2e/ 2>/dev/null

# Files changed on the branch
git diff --name-only "$BASE"...HEAD
```

PowerShell users replace `grep -oE` with `Select-String -Pattern 'AC-\d+' -AllMatches`.

## 3. Build the matrix

One row per AC, in spec order:

| AC | Tasks | Commits | Tests | Verification rows | Status |
|---|---|---|---|---|---|
| AC-1 | T3, T4 | `c33e2f5`, `d44f306` | AT-1a, AT-1b | AC-1 (2 rows) | ok |
| AC-2 | T1 | `a11c0f3` | — | — | orphan: AC without a passing test |
| AC-3 | T2 | `b22d1e4` | AT-3a | AC-3 (stale: `91ab…` ≠ current) | orphan: AC without a passing test |
| AC-4 | — | — | AT-4a | AC-4 | orphan: AC without a task |

Status is `ok` only when every cell to its left is filled and the Verification row is fresh and passing. A stale row is treated as missing. An AC in the `CANNOT_VERIFY` table counts as covered only when its row is complete and, for a Critical AC, the waiver ID is filled.

Then the backward pass. List each finding on the `Orphans` line as `kind · ID · resolution`:

| Backward check | How | Orphan kind |
|---|---|---|
| Every task names ≥ 1 AC | read the AC column of `## Tasks` | task without an AC |
| Every code commit names ≥ 1 task | each line of the git log output has `Tn` in the bracket subject or in `Refs:` (Quick: `AC-n`); artifact-only commits are exempt (`../../agentic-sdlc/references/verification.md` §5) | code commit without a Tn |
| Every cited AC exists | each `AC-n` found in tasks, commits and test names is in the spec AC list | unknown AC ID |
| Every changed file is planned | each path from `git diff --name-only` appears in some task's `Files` column (tests of a listed file count with it) | report as an L1 finding, not an orphan: `file outside every task: <path>` |
| Every added behaviour is requested | read the diff for new endpoints, flags, options, branches, outputs, config keys; each must serve an AC | report as an L1 Important finding: `behaviour outside the approved spec` |

The last two rows are the "unrequested code" half of the check. A refactor inside a planned file that changes no behaviour is not a finding. A new public endpoint, CLI flag, permission, stored field or user-visible message that no AC names always is.

## 4. Resolve orphans

The resolution for each orphan kind is fixed by the contract:

| Orphan | Resolution |
|---|---|
| AC without a task | back to Design: add the task; Design sign-off re-opens |
| AC without a passing test | back to the Test Engineer for the test, then a fresh row |
| Task without an AC | remove the task, or run the change protocol (`../../agentic-sdlc/references/rules.md`) to add the AC |
| Code commit without a Tn | reword the commit on the feature branch before merge (`git rebase -i <base>`, `reword`); the default branch is never rewritten |
| Unknown AC ID in a task, commit or test | fix the reference; an ID with no spec AC behind it is scope outside the approved spec → L1 Important finding |

For unrequested behaviour: either remove it from the diff, or the Product Owner adds an AC through the change protocol (new spec revision, Specify sign-off again). The Reviewer never accepts it on the grounds that it is useful.

Any orphan → NO-GO until resolved. Write `**Orphans:** none` only when both passes found nothing.

## 5. Worked mini-example (Standard path)

Spec `specs/009-team-invites/spec.md` has AC-1 … AC-4. The log shows:

```text
a1b2c3d	Add invite token model [T1, AC-1]
b2c3d4e	Invite email sender [T2, AC-2]
c3d4e5f	Fix typo
d4e5f6a	Resend invite endpoint [T3, AC-5]
```

`git diff --name-only` includes `src/admin/export-users.ts`, listed in no task.

Result:

- Forward: AC-3 has task T4 but no commit and no test → `orphan: AC without a passing test` (and T4 is unfinished). AC-4 has a test with a row on an older fingerprint → stale → same orphan kind.
- Backward: `c3d4e5f` → commit without a Tn → reword to `Fix typo in invite email [T2, AC-2]`. `d4e5f6a` cites AC-5, which is not in the spec → unknown AC ID → L1 Important finding; the resend endpoint needs an AC through the change protocol or must be removed. `src/admin/export-users.ts` → file outside every task and a new admin export behaviour → L1 Important finding, behaviour outside the approved spec.

```markdown
**Orphans:** AC without a passing test · AC-3 · back to the Test Engineer, then fresh row; AC without a passing test · AC-4 · re-run on current fingerprint; commit without a Tn · c3d4e5f · reword before merge; unknown AC ID · AC-5 in d4e5f6a · change protocol or remove
```

Verdict input: NO-GO.
