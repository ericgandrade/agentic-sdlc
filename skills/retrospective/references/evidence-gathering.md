# Evidence gathering

Load at Step 2 of every retro. Every fact in the retro record comes from a file or a command listed here. The facts drafter (`../prompts/facts-drafter.md`) follows this file; the SRE adds the production rows.

## Rules for every value

| Rule | Correct | Wrong |
|---|---|---|
| Source per value | `77 h (a11c0f3 2026-11-24T09:41Z → merge 5d2e8b0 2026-11-27T14:30Z)` · source `git log` | `about 3 days` |
| Checked vs never checked | `0 (checked: docs/postmortems/ since 2026-11-30)` | `0` with no scope; or `0` when the folder was not opened |
| Missing source | `n/a — ops.md absent; help-desk export not shared` | blank cell, `TBD`, `-` |
| Primary source wins | Ledger and PR body over chat, agent reports or memory | "the Developer said it took one round" |
| Dated, anchored | `As of 1b8d74a, …`, reading dated `2026-12-07` | "currently", "now", "is" about code with no date or SHA |
| Labelled kind | `Field (help-desk export)` vs `Lab (staging replay)` | mixing a staging number into a production fact |
| No personal data | aggregates, counts, IDs | names of customers, emails, ticket bodies |

A claim that cannot be pointed at is not a fact. Drop it, or record it as a question for the meeting.

## Template facts: commands and sources

Placeholders: `<base>` = merge base of the PR, `<merge>` = merge commit, `<rel>` = release date (stage 1 start in release notes §Deploy log), `<slug>` = `specs/NNN-slug`.

| Fact | Command or file | Notes |
|---|---|---|
| Lead time, first commit → merge (hours) | `node skills/agentic-sdlc/scripts/metrics.mjs --record --cycle <label> --json` → `metrics.leadTimeHours`; without Node: `git log --reverse --format='%h %cI' <base>..<merge> \| head -1` and `git log -1 --format='%h %cI' <merge>` | Hours, rounded to 1; both SHAs and times in the cell |
| Loop rounds per task (max) · escalations | `metrics.mjs` → `metrics.loopRounds` (archived ledgers of the cycle); per task: `node skills/agentic-sdlc/scripts/run-ledger.mjs status --ledger <slug>/run-ledger.jsonl --json` → `tasks[].rounds`, `tasks[].escalation`, `halt` | Active run: `--run <id>`. Installed copy: `../agentic-sdlc/scripts/run-ledger.mjs`. No ledger or no Node → `plan.md` `## Loop ledger` rows (failed and fixing rounds only; tasks absent from it ran 1 round) |
| Review findings Critical / Important / Minor | PR body §Review triage → Findings table, column `Sev`; count `confirmed` only | List IDs per severity; note rejected findings separately (`F-7 rejected on spec text`) |
| Critical found after Test sign-off | `docs/postmortems/*.md` and issues labelled `from-production` that name the spec ID, dated after the approving PR review | A Critical found later is also a `review-miss` candidate |
| Reverts or hotfixes ≤ 7 days after release | `git log -E -i --since=<rel> --until=<rel + 7 days> --grep='^Revert\|hotfix' --format='%h %cI %s'` | Window still open at retro time → `n (window open until <date>)` |
| Indicator: first reading vs target | `spec.md` §Indicator (baseline, target, method) + `<slug>/ops.md` §Indicator readings (SRE), or the SRE's reading when no ops record exists | Verdict and outcome: `outcome-decision.md` |
| Incidents since release (SEV) | `<slug>/ops.md` §Incidents; `ls docs/postmortems/` (files `YYYY-MM-DD-<slug>.md`) filtered by date ≥ `<rel>`, then `grep -l 'NNN-slug' docs/postmortems/*.md` | SEV1–SEV3 only. SEV3 has an issue, not a postmortem. SEV4 is not an incident (near miss, self-clearing alert): never counted here, but listed as an alert-noise signal |

With the GitHub CLI available, PR data can come from `gh pr view <n> --json body,reviews,mergedAt,createdAt`; without it, read the PR page or `specs/NNN-slug/review.md`. Both are the same source.

## Cycle signals (candidate Change items)

These do not have fixed rows in the template. Each signal that shows friction becomes a **candidate** Change item with its evidence; the meeting chooses.

| Signal | Source | Friction threshold (candidate when) | Likely tag |
|---|---|---|---|
| Loop round causes | `run-ledger status --json` and the ledger `round` events' `cause` field; `plan.md` Loop ledger `Cause` column | Any task ≥ 3 rounds; any `spec` or `design` cause; any halt | `spec` → `spec-gap` · `design`/`plan` → `design-gap` · `test` → `test-gap` · `env` → `env` |
| Escalations and rulings | ledger `ruling` and `halt` events; PR §Review triage rulings | Any bound reached | by root cause |
| Impediments | `<slug>/impediments.md`: `IMP-n` rows, Raised, Status | Any row open > 2 business days; any `BLOCKED` approver | `process` |
| Approval wait | `<slug>/approvals.md` `Requested at` → `Answered at`; Test sign-off: review requested → approving review; Release: release notes §Approval | Any wait > 2 business days (the Scrum Master reminder threshold) | `process` |
| `CANNOT_VERIFY` rows | PR §Verification → `### CANNOT_VERIFY` | Any row, waived or not | `env` or `tooling` |
| `self-review` rows | PR §Verification `By` column | Any row on Standard or Full | `tooling` (no subagent) |
| Stale evidence re-runs | PR §Verification history, Reviewer notes | ≥ 2 rows re-run for a stale fingerprint | `process` |
| Waivers | PR §Waivers; release notes §Waivers | Any waiver; any expired | by gate |
| Path escalation | spec Revision log `route Quick → Standard` | Any | `spec-gap` or `process` |
| Rollout events | release notes §Deploy log | Any stage rolled back or held | `ops-signal` |
| Alert noise | `ops.md` §Alert fires (SEV4 rows), alert history named in the runbook | Alert fired ≥ 3 times in 7 days without an incident | `ops-signal` |

A `code` cause caught inside the review loop shows the review working; it is a candidate only when the same signature recurs or escapes past Test sign-off (`review-miss`).

## Prior actions

Two kinds of action are tracked side by side in §Prior actions, each under its own ID:

- `RA-YYYYMMDD-n` — every action that is not `done` or `dropped` in earlier retros of the same track.
- `PA-YYYYMMDD-n` — every postmortem action (`docs/postmortems/*.md` §Action items) whose status is not `done`, from postmortems dated since the previous retro of the track or still open from earlier. Never renumber a `PA-` item into an `RA-` ID. Its owner, due date and target file come from the postmortem row. The retro applies the same closing check and the same >2-cycle escalation.

```bash
grep -n -E '^\| RA-[0-9]{8}-[0-9]+ ' docs/retros/*.md          # retro actions with their status column
grep -n -E '^\| PA-[0-9]{8}-[0-9]+ ' docs/postmortems/*.md    # postmortem actions
git log --all -E --grep='Refs: RA-20261113-1' --format='%h %cI %s'   # or Refs: PA-…
git show --stat --format= <sha> | grep -F '<target file>'      # the commit changes the target file
git merge-base --is-ancestor <sha> origin/<default> && echo merged
```

| Finding | Status to record |
|---|---|
| Merged commit with the trailer that changes the target file | `done <SHA>` |
| Commit with the trailer that does not change the target file | `open` — note `commit <sha> does not touch <target>` |
| Commit on an unmerged branch | `open` — note `unmerged <sha>` |
| No commit | `open (cycle n)`; n = later retros of the track since it was raised |
| Human ruling recorded `drop: <reason>` | `dropped: <reason>` |
| Open for more than 2 cycles | Tech Lead ruling required in the row |

A missing earlier retro is recorded as `n/a — no earlier retro for this track`, distinct from `none — no open actions`.

## Quick batch counter

Quick items have no spec folder; their PRs carry `**Path:** Quick` in the body.

```bash
# with the GitHub CLI
gh pr list --state merged --search 'merged:>=<last batch Held date> "Path: Quick" in:body' --json number,mergedAt,title
# without it: merged PRs since the date, then read each body or linked issue's first line (Path: Quick · S=… · R=…)
git log --merges --since=<last batch Held date> --format='%h %cI %s'
```

Due when the count reaches 10, or 14 calendar days after the last Quick batch retro with ≥ 1 item. For a batch, sum lead times as a median and a max, count findings across PRs, and list each PR number in `**Covers:**`.

## Trend inputs (Step 5)

`node skills/agentic-sdlc/scripts/metrics.mjs --record --cycle <label>` computes lead time to merge, change-failure rate (from `specs/*/ops.md` `Change failed`, SEV1/SEV2 postmortems and revert or hotfix commits), loop rounds and reverts per cycle, keeps `.agentic-sdlc/metrics/history.jsonl` and applies the trend rule. Without that history, the last 6 retro records of the track are the history. Read their Facts rows: lead time, reverts or hotfixes, incidents with SEV. Where ops records exist, `specs/*/ops.md` §Delivery facts for this release gives the DORA inputs per release (lead time to stage 1, rollback, revert or hotfix, SEV1/SEV2, `Change failed`, time to restore) and wins over recomputation. Release count in a window: `git tag --list 'v*' --sort=creatordate --format='%(creatordate:short) %(refname:short)'`. Change failure rate over the last 30 days = releases with `Change failed: yes` (rollback, revert or hotfix ≤ 7 days, or SEV1/SEV2 ≤ 7 days) ÷ releases. Mean time to restore, when postmortems exist: detection → restore times from each postmortem timeline. Every derived number names its inputs.

## Facts handed in by the SRE

The SRE supplies, with time and source, mostly from `specs/NNN-slug/ops.md` (`../../agentic-sdlc/templates/ops-record.md`): the indicator readings with the Product Manager's verdict, incidents since release with severity (SEV4 fires listed separately), alert firings, rollback events, the DORA delivery facts, open `PA-` actions, the runbook `Last verified` date, and (Full) each threat-model mitigation's production check. The Scrum Master agent does not query production.
