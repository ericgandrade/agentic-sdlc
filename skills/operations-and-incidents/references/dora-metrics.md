# DORA metrics — manual computation

Load in Workflow Step 8, before a retro, or when someone asks how often the team deploys, how long changes take to reach production, how many releases fail, or how fast service is restored. `../../agentic-sdlc/scripts/metrics.mjs` computes lead time to merge, change-failure rate and reverts per cycle and appends `.agentic-sdlc/metrics/history.jsonl`. Deployment frequency, lead time merge → stage 1 and time to restore stay manual: compute them from git, the release notes and the postmortems, and record the values in the retro record §Facts as extra rows.

## 1. Definitions (window: last 30 days; trend: last 90 days)

| Metric | Unit | Definition in this method | Primary source |
|---|---|---|---|
| Deployment frequency | releases per week | Production releases whose release notes §Deploy log has a stage-1 row inside the window. Rollout stages of one release count once. | Release tags + deploy logs |
| Lead time for changes | hours, median | Per release: first commit of the merged change → stage-1 start in the deploy log. Also report the two halves: first commit → merge (the retro fact) and merge → stage 1. | `git log`, deploy log |
| Change failure rate | releases failed / releases | A release failed when, within 7 days of its stage 1, it had a rollback in the deploy log, a SEV1/SEV2 incident attributed to it, or a revert/hotfix commit for its change. | Deploy logs, `docs/postmortems/`, `git log` |
| Time to restore service | hours, median | Per SEV1/SEV2 incident: impact start → restored (signal inside threshold for one full window). Impact start unknown → detection time, marked `from detection`. | Postmortem timeline |

## 2. Commands

Run from the repository root; replace dates and refs. Every value pasted into the retro lists the command that produced it.

```bash
# Releases (tags) created in the window
git for-each-ref --sort=creatordate \
  --format='%(refname:short) %(creatordate:iso8601-strict)' 'refs/tags/v*' \
  | awk '$2 >= "2026-11-01" && $2 < "2026-12-01"'

# Lead time, first half: first commit of the change → merge
git log --reverse --format='%H %cI' <base>..<merge-sha> | head -1   # first commit
git log -1 --format='%cI' <merge-sha>                               # merge time
# Lead time, second half: stage-1 "Start (ISO)" in the release notes §Deploy log

# Reverts and hotfixes in the 7 days after a release
git log -E -i --since=<stage-1 date> --until=<stage-1 date + 7 days> \
  --grep='^Revert|hotfix' --format='%h %cI %s'

# SEV1/SEV2 postmortems in the window and the release they name
grep -l -E 'Severity:\*\* SEV[12]' docs/postmortems/2026-11-*.md
grep -h -E 'Release:\*\*' docs/postmortems/2026-11-*.md
```

Rollbacks during rollout: read the §Deploy log `Decision` column of each release in the window (`roll back`).

## 3. Worked computation (synthetic, window 2026-11-01 → 2026-11-30)

| Release | Stage 1 start (UTC) | First commit → merge | Merge → stage 1 | Failed? (why) |
|---|---|---|---|---|
| v2.12.0 | 2026-11-04T13:00Z | 41 h | 22 h | no |
| v2.13.0 | 2026-11-12T13:30Z | 66 h | 25 h | yes — revert `9ac01e2` on 2026-11-13 |
| v2.13.1 | 2026-11-13T18:10Z | 3 h | 2 h | no |
| v2.14.0 | 2026-11-30T13:02Z | 77 h | 70.5 h | no (window still open until 2026-12-07) |

- Deployment frequency: 4 releases / 4.3 weeks = **0.93 per week**.
- Lead time (first commit → stage 1), per release 63 h, 91 h, 5 h, 147.5 h → median **77 h**.
- Change failure rate: **1 of 3 releases with a closed 7-day window** (v2.14.0 excluded until its window closes). Fewer than 5 releases → report the count, not 33%.
- Time to restore: 0 SEV1/SEV2 incidents in the window → `n/a — no SEV1/SEV2 incident`.

Retro §Facts rows:

| Fact | Value | Source |
|---|---|---|
| DORA deployment frequency (30 days) | 0.93/week (4 releases) | `git for-each-ref … refs/tags/v*`; deploy logs |
| DORA lead time, first commit → production (median) | 77 h (n = 4) | `git log`; deploy logs |
| DORA change failure rate | 1 of 3 closed windows (v2.13.0 revert) | deploy logs; `git log --grep`; `docs/postmortems/` |
| DORA time to restore (median) | n/a — no SEV1/SEV2 incident | `docs/postmortems/` |

## 4. Honesty rules

- No source → `n/a — <reason>`; never estimate or carry a number forward from an earlier retro.
- Fewer than 5 data points → report counts and the raw list; no percentage, no trend claim.
- Releases whose 7-day window has not closed are excluded from the change failure rate and named as excluded.
- A metric is never used to rank people. Values describe the delivery system; actions from them change files (`../../agentic-sdlc/references/retrospective.md` §Action rule).
- Speed metrics move only together with stability metrics: a faster lead time with a higher failure rate is reported as both numbers side by side, never as an improvement alone.

## 5. Reading the numbers

| Pattern (90-day trend) | Usual cause tag | Typical action target |
|---|---|---|
| Lead time high, mostly merge → production | `process` | Release checklist automation; staging availability |
| Lead time high, mostly first commit → merge | `process` or `review-miss` | Plan task size; review turnaround in AGENTS.md pitfalls |
| Change failure rate rising | `test-gap`, `spec-gap` | Acceptance tests at production-like volume; spec constraint checks |
| Time to restore high with a rollback available | `ops-signal` | Runbook first check; rollback rehearsal cadence |
| Time to restore high without a rollback | `design-gap` | Flags or staged rollout in the spec template's Rollout row |
