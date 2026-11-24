# Integration options — PR, keep, merge, discard

Load at Step 4 (menu) and Step 5 (merge and cleanup) of `SKILL.md`, and whenever a user asks to drop a branch. Paths starting with `../agentic-sdlc/` are relative to this skill's folder.

The rule behind every option: **the human decides, in a later turn, after seeing exactly what will happen.** A number or the option words count as confirmation for PR and keep; merge additionally needs a recorded Test sign-off; discard needs a typed phrase.

## 1. Environment detection (before the menu)

| Check | Command | Use |
|---|---|---|
| Linked worktree | `git rev-parse --git-dir` vs `git rev-parse --git-common-dir` | Different → linked worktree; record `git rev-parse --show-toplevel` as `WORKTREE_PATH` before any directory change |
| Detached HEAD | `git symbolic-ref -q HEAD` exit 1 | Menu variant "create branch" |
| Base branch | PR host base, else `git merge-base HEAD <candidate>` against `main`, `master`, `develop` | Confirm in one line: `Base: main @ 9e1d4c2 — correct?` |
| Ahead / behind | `git rev-list --left-right --count <remote>/<base>...HEAD` | Show in the menu header |
| Unpushed commits | `git log --oneline @{upstream}..HEAD` (no upstream → all commits are unpushed) | Discard inventory |
| PR host | A remote on a forge that hosts pull or merge requests | No host → review record `specs/NNN-slug/review.md` |
| Open PR | The host's PR list for the branch | Avoid a second PR; update the existing body |
| Test sign-off | Approving review by a non-author human, on the head SHA | Only then the merge option exists |

## 2. Menus (show exactly; end the turn)

Header line, always: `Branch <name> · <n> commits ahead of <base> @ <sha> · fingerprint <12 hex> · pre-ship <passed>/<applicable> pass`.

| Situation | Option 1 | Option 2 |
|---|---|---|
| Named branch or named-branch worktree, PR host, no Test sign-off | Push the branch and open the PR (the Test stage starts) | Keep the branch as it is |
| Detached HEAD | Create branch `<proposed-name>`, push it and open the PR | Keep as it is (commits stay reachable only by SHA — the SHA is printed) |
| No PR host | Commit `specs/NNN-slug/review.md` on the branch and hand it to the reviewer | Keep the branch as it is |
| Test sign-off on the current head SHA | Merge into `<base>` (the human runs it) | Keep the branch as it is |

Never list discard. Never list merge before the Test sign-off. Never combine options ("push and merge").

## 3. Option: push and open the PR

1. Attended mode only, and only after the human's reply. Unattended runs stop before this step (`../agentic-sdlc/references/autonomous.md`).
2. `git push -u <remote> <branch>`; never the default branch; never `--force`. A rejected push → report the rejection text and stop; the fix is an update from the remote, then the pre-ship checklist again.
3. Open the PR with the body from Step 3, using the repository's PR template when the host enforces one: the template's headings come first, the agentic-sdlc sections follow under them.
4. Report the PR URL or number, the head SHA and the fingerprint. Keep the worktree: review findings come back to it.

## 4. Option: keep

Change nothing. Report: branch, `WORKTREE_PATH`, last SHA, ahead/behind counts, whether the Verification rows are still fresh, and the command to resume (`git switch <branch>` or the worktree path). Scratch state (ledgers, evidence) stays.

## 5. Option: merge (after Test sign-off)

Preconditions, each quoted with its source:

| # | Precondition | Source |
|---|---|---|
| M1 | Approving review by a human who is not the PR author, given on the current head SHA | PR host review list |
| M2 | Reviewer verdict `GO` on the same SHA | PR `## Review triage` |
| M3 | Every Verification row fresh (fingerprint = current) | `verification.md` §4 |
| M4 | `## Review guide` complete: riskiest files first with the reason, 3–7 questions, CANNOT_VERIFY items, self-review labels, deferred findings and waivers | PR body |
| M5 | Full path: second human reviewer recorded | PR host review list |
| M6 | No waiver expired at today's date | PR `## Waivers` |

Any precondition false → no merge option; report which.

Procedure:

1. The human merges: host merge control (branch protection enforces M1 and the required checks), or without a host the printed commands `git switch <base> && git pull --ff-only && git merge --no-ff <branch>`. The agent prints; it does not run them. Squash or rebase merges follow the project's convention; the release commit is whatever lands on the base.
2. Release commit: `git rev-parse <base>` after the merge.
3. Tree check: `git diff --quiet <head-sha> <release-sha>`. Exit 0 → tree identical to the tested head; the PR fingerprint carries over to the release (as in the worked example, `5d2e8b0` vs `1b8d74a`). Exit 1 → the base moved since the tested head; run the DoD and every AC on the release commit before any Release step.
4. A failure on the merged result → do not clean up; leave branch and worktree; report `BLOCKED` with the failing rows; the fix enters as a new Quick or Standard item.

## 6. Cleanup (after merge, or after discard)

Run only after every ruling, finding disposition and evidence row is in the PR body, `spec.md` or `plan.md`. Scratch state is copied first, deleted last.

| Target | Rule |
|---|---|
| Local branch after merge | `git branch -d <branch>`. Refused as unmerged → stop and investigate; never switch to `-D` here |
| Remote branch after merge | The host's "delete branch" after merge, or `git push <remote> --delete <branch>` when the human confirms |
| Worktree | Remove only when `WORKTREE_PATH` is under `.worktrees/` or `worktrees/` of the repository: `git worktree remove <path>` then `git worktree prune`. Any other location belongs to the host tool or the person → report it, leave it |
| Worktree with untracked files | Removal refused → show `git status --porcelain -uall` from the worktree; offer commit, move or delete per file; never `--force` |
| `.agentic-sdlc/` scratch | Evidence ledger and run ledger stay until the release closes; they feed the retro |

## 7. Discard (explicit request only)

1. **Inventory**, shown in full:

```text
Discard inventory · feature/bulk-delete
Commits not in main (3): 4f1a2c9 [T1, AC-1] add bulk endpoint · 8d3e771 [T2, AC-2] confirm dialog · a90b5e2 wip
Unpushed: 2 (8d3e771, a90b5e2)
Worktree: <repo>/.worktrees/bulk-delete (created by this workflow)
Uncommitted: none · Untracked: notes.txt
Open PR: none
Spec: specs/014-bulk-delete/spec.md rev 1 (approved 2026-11-12)
To confirm, reply exactly: discard feature/bulk-delete
```

2. **End the turn.** Accept only the exact phrase `discard <branch-name>` in a later turn. "Yes", "go ahead", "delete it" or the phrase inside the original request do not count; repeat the request once, then keep the branch.
3. After the phrase: resolve untracked files per §6; close any open PR with a one-line reason; remove the worktree per §6; delete the branch with `git branch -D <branch-name>` — the only place `-D` is allowed; delete the remote branch only when it exists and the phrase was given.
4. Record the decision where Discover will find it: the issue gets `rejected: <reason>` with date and the person who decided; an approved spec gets a Revision log entry proposal for the Product Owner (`withdrawn`), never a silent edit.
5. Report the SHAs deleted; they stay recoverable from the reflog for the repository's reflog expiry period.

## 8. Failure cases

| Case | Behaviour |
|---|---|
| Base guessed wrong | Every step after the confirmation is void; re-run pre-ship on the right base |
| PR already exists for the branch | Update its body; never open a second PR |
| Branch protection rejects the merge | Report the failing required check or missing review; never request an admin override |
| Human asks the agent to merge | Print the commands and the M1–M6 table; the human runs the merge |
| Test sign-off given on an older SHA | Stale; branch protection's "dismiss stale reviews" or this skill treats it as absent |
