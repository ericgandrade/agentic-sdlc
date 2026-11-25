---
name: shipping-and-handover
description: This skill should be used when a development branch is finished and must be shipped or handed over — running the pre-ship checklist, opening the pull request with fingerprint-bound evidence, a before/after pair, a one-way or two-way door call and the rollback line, choosing merge, PR, keep or discard with explicit confirmation, checking docs drift, writing release notes and the runbook, and handing a release to Operate (the end of the Build stage and the Release stage of the Agentic SDLC). Not for producing or auditing test evidence (use verification-gate), CI gates, rollout stages or rollback rehearsal (use deployment-pipeline), or incidents and postmortems (use operations-and-incidents).
license: MIT
---

# Shipping and Handover

## Purpose

Agentic SDLC · Build stage (end) and Release stage. Used by the **Developer** to close a branch and open the PR, by the **Release Engineer** to prepare release notes, the runbook and the Release sign-off request, and by the **Tech Writer** for the docs task and the `## For users` section of the release notes.

The skill turns finished work into something a person who did not build it can approve, operate and undo. It produces four records, each from a shared template:

| Record | Template | Owner | Closes with |
|---|---|---|---|
| PR body (or `specs/NNN-slug/review.md` without a PR host) | `../agentic-sdlc/templates/pr-body.md` | Developer (Summary, own Verification rows); Reviewer fills the rest | Test sign-off by the human reviewer |
| Release notes | `../agentic-sdlc/templates/release-notes.md` | Release Engineer; Tech Writer writes `## For users` | Release sign-off by the Release Owner |
| Runbook `docs/runbooks/<service>.md` | `../agentic-sdlc/templates/runbook.md` | Release Engineer | Checklist item R7 |
| Handover to Operate | release notes §Deploy log + `specs/NNN-slug/ops.md` | Release Engineer → SRE | First indicator reading ≤ 7 days after release |

Contracts never overridden: `../agentic-sdlc/references/verification.md`, `../agentic-sdlc/references/release-ops.md`, `../agentic-sdlc/references/governance.md`, `../agentic-sdlc/agents/release-engineer.md`, `../agentic-sdlc/agents/tech-writer.md`. Filled records: `../agentic-sdlc/examples/worked-example/specs/001-csv-export/`.

## When to Use

- Every task in `plan.md` has a commit and the DoD is green: run the pre-ship checklist and open the PR.
- A branch is finished or abandoned and the next move is merge, PR, keep or discard.
- The Test sign-off is recorded and the branch must be merged and cleaned up.
- A merged PR reaches production: write release notes, update the runbook, run R1–R9 and go/no-go, request Release sign-off.
- A diff changes a public surface (endpoint, CLI flag, configuration key, schema, event, user-visible copy): run the docs-drift check.
- The last rollout stage closed: hand the release to the SRE.

Not for:
- The Test verdict and independent re-runs of evidence → `verification-gate`.
- Reviewing the diff, lenses L1–L4 and finding triage → `multi-axis-code-review`.
- CI gates, deployment strategies, running a rehearsal or a rollout stage → `deployment-pipeline`.
- Incidents, alerts in production, postmortems → `operations-and-incidents`; the retro → `retrospective`.
- Implementing a task → `executing-plans` and `test-driven-development`.
- File format conversion of finished notes → `document-converter`.

## Workflow

### Step 0 — Discover state and pick the mode

Read before asking:

1. Branch state: `git status --porcelain`, `git rev-parse --abbrev-ref HEAD`, `--git-dir` vs `--git-common-dir` (different → linked worktree; record its absolute path first), the base from the PR host or `git merge-base`.
2. The spec header (`specs/NNN-slug/spec.md`: path score line, revision) or, on the Quick path, the issue with its acceptance test. `plan.md` `## Tasks`.
3. The AGENTS.md block: `sdlc-dod` commands, `Enforcement:` (`prompt-only` adds the banner `enforcement: prompt-only — approvals are not system-enforced on this repository` as the first line of every PR body).
4. PR host presence (a remote on a forge with pull requests, or none), an open PR for the branch, its approving review and the SHA it was given on.
5. The docs tree (`docs/`, README files, `CHANGELOG.md`), `docs/runbooks/`, `docs/retros/`.

Confirm the base branch in one line before the first state-changing action: `Base: main @ 9e1d4c2 (merge-base of feature/csv-export) — correct?` A wrong base voids every later step.

| State (first match) | Mode | Steps |
|---|---|---|
| Deploy log shows the last stage `closed` | handover | 9 |
| Release sign-off recorded, stages pending | release (deploy) | 8, from the sign-off record |
| PR merged into the base; production change pending | release | 6–8 |
| Approving Test sign-off on the current head SHA | integrate | 5 |
| PR open, evidence missing or stale | — | hand to `verification-gate`; this skill stops |
| Branch with commits, no PR | open-pr | 1–4 |
| User asks to drop the branch | discard | 4 (discard procedure) |

### Step 1 — Pre-ship checklist

Load `references/pre-ship-checklist.md` and answer items P1–P14 with `pass`, `fail` or `n/a — <reason>`, each with the command and its output. The core items:

- **P1 Tasks done:** `node skills/agentic-sdlc/scripts/plan-graph.mjs specs/NNN-slug/plan.md --from-git <base>..HEAD --json` lists no open task. Quick: every commit carries `Refs: AC-n`.
- **P2 Commit trace:** every commit on `<base>..HEAD` names a `Tn` (trailer `Refs: Tn AC-n` or subject form `[Tn, AC-n]`). Reword on the feature branch only.
- **P3 Approvals valid:** `spec-lint --check-approval` and `plan-graph --check-approval` exit 0 (Standard, Full).
- **P4 Clean tree:** `git status --porcelain` prints nothing.
- **P5 Base current:** `git merge-base --is-ancestor <remote>/<base> HEAD` exits 0; otherwise update the branch first, then run every check after the update.
- **P6 Fresh DoD and AC rows:** every `sdlc-dod` key and every AC has a row with `exit 0` on the current fingerprint.
- **P7 Secrets:** `git diff <base>...HEAD -i -G'password|secret|api_key|token|private_key' --name-only` prints nothing, or each listed file is inspected and cleared. Never print the matching lines.
- **P8 Debug leftovers:** no added `console.log`, `debugger`, `print(` probes, `.only(`, `.skip(` or `[debug-` tagged lines in the diff.
- **P9 Scope:** `git diff --name-only <base>...HEAD` ⊆ the plan's `Files` columns ∪ the acceptance-test files ∪ the docs pages of the docs task ∪ `specs/NNN-slug/**`; Quick ≤ 3 files, Standard ≤ 15, otherwise stop, re-score and route up.

The reference adds P10–P14 (flag default off, observability signal emitted under the spec's exact name, migrations reversible or declared one-way, new dependency approved, docs-drift result). Any `fail` → status `BLOCKED` with the item numbers; the integration menu is not shown. Fix, then re-run the whole checklist: a fix moves the fingerprint.

### Step 2 — Docs-drift check

Load `references/docs-drift-check.md`. List every public surface the diff changes, search the docs tree for each identifier and for each **removed** identifier, and classify every doc-code pair by commit order: same commit → current; doc commit is an ancestor of the code commit → **stale**; code commit is an ancestor of the doc commit → current; unordered → **can't tell** (never reported as current).

Route the result:

| Result | Owner | PR Docs row |
|---|---|---|
| A user docs page, API or configuration reference, or migration guide is stale or missing; or Full path | Tech Writer (docs task `Tn — docs`, or dispatch now) | Pages changed + docs build and link check command, exit, fingerprint |
| Only inline docs, docstrings or README lines | Developer, in this branch | Same row, `by: Developer` |
| No public surface changed | — | `n/a — no user-visible change` |

A contract-breaking change (removed or renamed field, changed default, new required input) needs a migration guide before the PR opens. A Tech Writer finding of behaviour that no AC covers is a Reviewer finding, never documentation.

### Step 3 — Write the PR body

Copy `../agentic-sdlc/templates/pr-body.md`; keep every heading; delete the comments. Load `references/pr-evidence.md` for the field rules.

1. **Header:** spec rev and 12-hex hash (`node skills/agentic-sdlc/scripts/spec-lint.mjs specs/NNN-slug/spec.md --hash`), plan rev and hash (`planHash` in `plan-graph --json`), the path line `Path: Standard · S=5 · R=1 (money)`, enforcement, `Base: <branch> @ <sha>`, head SHA, current fingerprint.
2. **Summary:** 2–5 lines of prose in terms of AC-n. Under it, three labelled items:
   - **Visual:** the smallest view that makes the change obvious (≤ 15 lines): a `diff` sketch of an interface, a call tree, a component tree, a shallow file tree, or a sequence diagram — one, at most two.
   - **Before / After:** the same observation taken at the base commit and at the head: a screenshot pair for visible UI, otherwise command output (the acceptance test failing at base, passing at head; the HTTP status before and after). Each with the command or the screenshot path and the commit.
   - **Door:** `two-way` (the rollback command restores the previous behaviour with no data loss) or `one-way` (data deleted or rewritten, schema contracted, external messages sent, public contract removed). **Blast radius:** what else can break (consumers, shared components, other pages). **Rollback:** the command and verify command copied verbatim from `spec.md` §Rollback (Quick: from the issue's `Observability: <signal> · rollback: <command>` line).
   A one-way door on a path other than Full → stop: `irreversible` is a Full-forcing trigger (`../agentic-sdlc/references/paths.md`); re-score and route up.
3. **Verification:** the Developer's own rows, `By: Developer`: one per `sdlc-dod` key, ≥ 1 per AC, and the Docs row from Step 2. Fingerprint before and after the run; a difference discards the rows. Exit codes copied from the shell; ≤ 40 output lines per command in the excerpt block. An AC that cannot run before merge gets a `CANNOT_VERIFY` row (reason, substitute check, verifier, date ≤ 14 days after release).
4. **Trace, Review triage, Review guide:** write `pending — Reviewer`. These belong to the Reviewer; the Developer never fills them.
5. **Waivers:** existing rows or `none`.

These rows are testimony. The Reviewer re-runs every command; nothing in the PR text counts as evidence for GO.

### Step 4 — Present the integration options

After the checklist passes, show the menu exactly and end the turn. The reply in a **later** turn is the confirmation.

```
Branch feature/csv-export · 8 commits ahead of main @ 9e1d4c2 · fingerprint b7e2a91c04d5 · pre-ship 14/14 pass
1. Push the branch and open the PR (the Test stage starts)
2. Keep the branch as it is (nothing pushed, nothing removed)
Reply 1 or 2.
```

| Situation | Options shown |
|---|---|
| Named branch, PR host, no Test sign-off | 1 push + open PR · 2 keep |
| Detached HEAD | 1 create branch `<name>`, push, open PR · 2 keep |
| No PR host | 1 commit `specs/NNN-slug/review.md` (Quick: `docs/reviews/<issue>.md`) on the branch for local review · 2 keep |
| Test sign-off on the current head SHA | 1 merge · 2 keep (Step 5) |

**Merge is never shown before a Test sign-off bound to the head SHA.** **Discard is never shown**; it runs only on an explicit request and only after the typed confirmation `discard <branch-name>` in a later turn, following the inventory in `references/integration-options.md` (branch, commits not in the base, unpushed commits, worktree path, uncommitted and untracked files, open PR). Option 1 pushes the feature branch only and opens the PR with the Step 3 body. Option 2 reports branch, worktree path, last SHA and evidence freshness. Rejected push → report it; never force-push.

### Step 5 — Integrate after Test sign-off

Preconditions, each checked and quoted: an approving review from a human who is not the PR author, on the current head SHA; the Reviewer verdict `GO`; every Verification row fresh; `## Review guide` complete (riskiest files first, 3–7 questions, CANNOT_VERIFY items, self-review labels, deferred findings and waivers). Any gap → no merge option; report what is missing.

1. **The human merges** with the host's merge control (branch protection enforces the review and required checks) or, without a PR host, runs the command this skill prints (`git switch main && git merge --no-ff feature/csv-export`). No agent role in the method merges.
2. Record the release commit: `git rev-parse <base>` after the merge. `git diff --quiet <head-sha> <release-sha>` exit 0 → the tree equals the tested head and the PR fingerprint carries over. Exit 1 → the base moved, or the release commit adds a version bump or CHANGELOG entry; the DoD and every AC are re-run on the release commit before any Release step (`verification.md` §1, Release GO row). A failure on the merged result → stop, leave the branch and worktree in place, report `BLOCKED`.
3. Clean up only after the PR, the spec and the plan hold every ruling and evidence row: `git branch -d <branch>` (never `-D`), and `git worktree remove <path>` + `git worktree prune` only for worktrees under `.worktrees/` or `worktrees/`. Other worktrees belong to the host or the person. Removal refused for untracked files → show `git status --porcelain -uall` and offer commit, move or delete; never `--force`.
4. No production change → the item closes here; the retro follows the path's rule (`../agentic-sdlc/references/retrospective.md`). Production change → Step 6.

### Step 6 — Write the release notes

Load `references/release-and-handover.md` and `prompts/release-notes-writer.md`. Copy `../agentic-sdlc/templates/release-notes.md`; the Release Engineer fills every section before the Release sign-off request.

- **Version:** SemVer from the change: breaking contract → MAJOR (one-way door for consumers; migration guide required), additive → MINOR, fix → PATCH. A "patch" that changes behaviour someone relies on is a MAJOR. Unsure → treat as breaking.
- **Summary:** 1–3 user-facing lines, no internal IDs except the spec ID.
- **For users:** dispatch the Tech Writer when user-visible behaviour changes; otherwise write `none — no user-visible change`. The Tech Writer also writes the `CHANGELOG.md` entry (Added, Changed, Deprecated, Removed, Fixed, Security; newest first).
- **Shipped acceptance criteria:** one row per AC with the test IDs and the release-commit run (command, exit, fingerprint); the PR Verification row is copied only when `git diff --quiet <head-sha> <release-sha>` exits 0. PASS or CANNOT_VERIFY + waiver. The fingerprint column is the release commit's (`node <scripts>/lib/git.mjs fingerprint`); copying the PR fingerprint when the trees differ → go/no-go 1 false. An AC without a row → R2 false.
- **Rollout, Rollback, Observability:** copied from `spec.md` §Release & observability and §Rollback, with the baseline (7 days before stage 1) read from the spec's dashboard. The rehearsal output and the staging test-alert record are pasted, never summarised; how to run them lives in `deployment-pipeline`.
- **Residual risks:** each with an owner; declined-to-judge findings, deferred Important findings with issues and CANNOT_VERIFY items appear here.

Subagent: run `prompts/release-notes-writer.md` in a fresh context with only the listed inputs. If the platform has no subagents, run the prompt in a fresh pass after clearing working notes, and label the draft `self-review` in the Release Engineer report.

### Step 7 — Runbook

Required when the change alters operated behaviour (new or changed endpoint, job, queue consumer, configuration key, flag or alert) on any path, and on every Full release. Location `docs/runbooks/<service>.md` from `../agentic-sdlc/templates/runbook.md`. On Quick and Standard, when the service has no runbook file, the release notes §Runbook holds the five lines and becomes the file's source at the next Full release.

Minimum: alert name and threshold · first check (query or dashboard) · rollback command · verify command · escalation owner (role + channel) · `Last verified: YYYY-MM-DD`, the last date the rollback or the first check ran against staging or production. **Last verified more than 90 days before the planned release date → R7 false → NO-GO.** Updating the date without executing the check is falsifying R7.

Then run `prompts/runbook-fresh-reader.md` with only the runbook and the alert text: the reader answers "the alert fired at 03:00 — what do I run first, how do I know the rollback worked, whom do I call?" Every unanswerable question becomes a runbook fix. Same no-subagent fallback as Step 6.

### Step 8 — Checklist, go/no-go and Release sign-off request

Answer R1–R9 (`../agentic-sdlc/references/release-ops.md` §Release checklist) as `true`, `false` or `n/a — <reason>`, each with pasted or linked evidence; prose without output counts as `false`. Key bounds: R3 rehearsal on the same SHA as R1 and ≤ 7 days old; R5 test-alert receipt ≤ 5 min after fire; R7 ≤ 90 days; R8 every waiver unexpired at the planned date. Package, library or CLI with nothing deployed → answer R3–R6 and go/no-go 4 from `release-ops.md` §Package or library profile (pre-release channel, dry-run publish and rollback rehearsal, consumer CI); no waiver is needed for the rows it replaces. A deployed service without staging → R3 and R5 are `CANNOT_VERIFY` and the release proceeds only under an accept-risk waiver signed by the Release Owner (owner ≠ requester, expiry ≤ 30 days, follow-up issue).

Go/no-go: the five pre-release criteria, each `true` or `false`. Any `false` → verdict NO-GO, Release Engineer status `BLOCKED` with the item numbers, and no Release sign-off request.

GO → present the sign-off brief (`references/release-and-handover.md` §5) to the Release Owner and **end the turn**. Only an explicit "yes" or "approved" in a later turn counts; record it in `## Approval`. Then push the tag, run only the deploy commands in the approved notes, stage by stage, one `## Deploy log` row per closed watch window. A breach → approved rollback + verify, recorded; incident at SEV2 or higher; stop.

### Step 9 — Handover to Operate

When the last stage closes, write the handover (format in `references/release-and-handover.md` §Handover):

- **Production links:** one row per shipped AC → signal → alert (rule ID) → dashboard → owner, from spec §Release & observability. An AC without a signal is listed as `indicator only` or `untraced in production`, never omitted.
- **Due dates:** first indicator reading = release date + 7 days; retro = 5 business days after release (Standard, Full); CANNOT_VERIFY post-release checks ≤ 14 days, each with its verifier.
- **Open items:** residual risks, deferred findings with issue numbers, waivers with expiry dates.
- **Where:** appended under `## Deploy log` in the release notes, and seeded into `specs/NNN-slug/ops.md` when the project keeps ops records (template `../agentic-sdlc/templates/ops-record.md`, skill `operations-and-incidents`); the retro §Facts reads them from there.

Report `DONE` and name the SRE as the next agent. The SRE monitors what the spec defined; the handover never adds new alerts or thresholds.

## Anti-rationalization

| Thought | Reality |
|---|---|
| "The tests passed before the rebase." | A rebase moves the fingerprint. Re-run every row. |
| "It is a one-line change; skip the checklist." | P4–P8 take minutes; a secret or a `.only(` in the diff costs a release. |
| "Merge now; the reviewer will approve after the demo." | No merge option exists before a Test sign-off on the head SHA. Skipping needs a waiver with another owner. |
| "The user said delete it, so that is the confirmation." | Discard needs the typed `discard <branch>` in a later turn after the inventory. |
| "Docs can follow in another PR." | A stale reference or missing migration guide fails Step 2; defer only through a docs task with an issue and owner. |
| "The tests prove it; no before/after needed." | Tests prove the AC; the before/after pair shows the reviewer what changed. Screenshot for UI, output otherwise. |
| "Flag off is the rollback, so it is a two-way door." | Not when a migration ran or data was written in a new shape. Check the data line of §Rollback. |
| "The runbook has not changed since July." | Age is measured from the last executed check. > 90 days → R7 false. |
| "They said 'ship it' in the same message as the request." | Approval counts only in a later turn, after the brief was presented. |

## Critical Rules

- **NEVER** show or perform a merge before a Test sign-off from a non-author human on the current head SHA.
- **NEVER** discard a branch, worktree or commits without the inventory and the typed `discard <branch-name>` in a later turn.
- **NEVER** push to the default branch, force-push or run `git worktree remove --force`; `git branch -D` runs only on the branch named in a typed discard confirmation.
- **NEVER** fill Trace, Review triage or Review guide as the Developer, or count a `By: Developer` row toward GO.
- **NEVER** type an exit code, fingerprint or timestamp from memory; copy them from the shell.
- **NEVER** request Release sign-off with an applicable R1–R9 item or go/no-go criterion `false`.
- **NEVER** push a tag, deploy or enable a flag before the Release sign-off is recorded; never default a flag to on.
- **NEVER** update `Last verified` without executing the rollback or the first check.
- **NEVER** print secret values; scans list file names only.
- **ALWAYS** confirm the base branch before the first state-changing step and re-run every check after updating from it.
- **ALWAYS** copy the rollback and verify commands verbatim from `spec.md` §Rollback into the PR and the release notes.
- **ALWAYS** classify the door; a one-way door below Full stops and routes up.
- **ALWAYS** route stale user docs, references and migration guides to the Tech Writer.
- **ALWAYS** end the turn after presenting the integration menu, the discard inventory or the Release sign-off request.

## Example Usage

**1. Open the PR for the CSV export (Standard)**
> "All five tasks are committed and the DoD is green — open the PR."

Base confirmed `main @ 9e1d4c2`. P1 `plan-graph --from-git main..HEAD` shows T1–T5 done; P7 prints nothing; P9 lists 12 files: 10 from the plan's `Files`, the Test Engineer's `e2e/reports/export.spec.ts` and the docs page. Docs drift: the Reports help page had no export section → the Tech Writer adds it to `docs/reports/export.md`; Docs row `npm run docs:build && npm run docs:links` exit 0. Summary carries a `diff` sketch of `GET /api/reports/export`, Before `404` at `9e1d4c2` / After `200 text/csv` at `1b8d74a`, `Door: two-way` and `Rollback: flagctl set reports.csvExport off --env prod`. Menu shown; turn ends. "1" in the next turn → push and open PR #138.

**2. Pressure to merge without review**
> "The reviewer is out until Monday and the demo is tomorrow. Tests are green, merge to main now."

No Test sign-off exists on the head SHA, so the merge option is not offered. The reply separates the DoD (green) from the Test verdict (not run), offers another engineer as reviewer, a demo from a staging deploy with the flag still off by default in production, or keeping the branch, and states the waiver fields if the Tech Lead decides to waive. Turn ends.

**3. Discard an experiment**
> "Drop feature/bulk-delete and its worktree."

Inventory: 3 commits not in `main`, 2 unpushed, worktree `.worktrees/bulk-delete` with 1 untracked file `notes.txt`, no PR. Asks for `discard feature/bulk-delete` and ends the turn. On the typed reply, `notes.txt` is shown and the human chooses to delete it; then `git worktree remove .worktrees/bulk-delete`, `git worktree prune` and `git branch -D feature/bulk-delete` (allowed only for the branch named in the typed confirmation). Issue #151 records "rejected: superseded by the archive flag" so Discover finds the prior rejection.

**4. Release with a stale runbook**
> "PR #138 merged as 5d2e8b0. Prepare v2.14.0. Runbook last verified 2026-07-02; today is 2026-11-27."

`git diff --quiet 1b8d74a 5d2e8b0` exit 0 → PR fingerprint `b7e2a91c04d5` carries over. MINOR bump (additive endpoint). Tech Writer writes For users and the CHANGELOG entry. 2026-07-02 is 148 days old → R7 false → NO-GO. The runbook gains the export alert and first check; the staging rehearsal on 2026-11-27 executes the rollback, so `Last verified: 2026-11-27`. R1–R9 true, go/no-go 5/5, brief presented to P. Nair, turn ends.

**5. Quick bug fix without a production deploy**
> "Fix is done for the date-picker off-by-one, ship it."

Quick path, internal tool deployed by a scheduled job outside this change. Checklist with P1 as `Refs: AC-1` on 2 commits, P3 `n/a — Quick`. Docs row `n/a — no user-visible change`. Door two-way, rollback `git revert <sha>`. PR opened on "1"; after the Test sign-off on the head SHA the human merges; no release notes because no production change is made by this item; the item joins the batched Quick retro.

## References

| File | Load when |
|---|---|
| `references/pre-ship-checklist.md` | Step 1, before every PR open and after every update from the base |
| `references/integration-options.md` | Step 4 and Step 5: the menu, merge, keep, discard inventory, cleanup provenance |
| `references/pr-evidence.md` | Step 3: visuals, before/after tiers, door classification, rollback line, Verification row rules |
| `references/docs-drift-check.md` | Step 2, and when the Tech Writer plans a docs task |
| `references/release-and-handover.md` | Steps 6–9: release-notes field rules, SemVer, runbook rules, R1–R9 evidence, handover format |
| `prompts/release-notes-writer.md` | Step 6: fresh-context draft of the release notes from the PR and spec |
| `prompts/runbook-fresh-reader.md` | Step 7: on-call reader test of the runbook |
| `../agentic-sdlc/templates/runbook.md` | Step 7: creating or rewriting `docs/runbooks/<service>.md` |
