# Release notes, runbook and handover to Operate

Load at Steps 6–9 of `SKILL.md`. Contract: `../agentic-sdlc/references/release-ops.md` (R1–R9, go/no-go, runbook, per-stage table) and `../agentic-sdlc/templates/release-notes.md`. Worked example: `../agentic-sdlc/examples/worked-example/specs/001-csv-export/release-notes.md`. Paths starting with `../agentic-sdlc/` are relative to this skill's folder. How to execute a rehearsal, a test alert or a rollout stage belongs to `deployment-pipeline`; this file covers what is written and what counts as evidence.

## 1. Release notes — field by field

| Section | Source | Rule | Typical failure |
|---|---|---|---|
| Header | Spec header, PR, `git rev-parse` | Spec rev + 12-hex hash; PR number + head SHA; path; release commit (and whether its tree equals the PR head); tag `vX.Y.Z` "pushed only after Release sign-off"; planned date; Release Engineer; Release Owner (role, person) | Tag already pushed |
| Summary | Spec Problem + ACs | 1–3 user-facing lines; no internal IDs except the spec ID; this text becomes the CHANGELOG entry | Commit log pasted |
| For users | Tech Writer | What changes · who is affected · action required (or `none`) · docs link. No user-visible change → `none — no user-visible change` | Written by the Release Engineer when the Tech Writer trigger fired |
| Shipped acceptance criteria | PR `## Verification` (Reviewer rows) | One row per AC: title from the spec, Critical, PR row and test IDs, fingerprint, PASS or `CANNOT_VERIFY + waiver W-n` | Developer rows cited; fingerprint differs from the release tree |
| Rollout | Spec §Release & observability; `release-ops.md` §Go/no-go table | Mechanism; baseline (7 days before stage 1, with source); one row per stage with exposure, watch window = longer of spec and release-ops minimum, advance and roll-back rules with numbers | Baseline left as "normal" |
| Rollback | Spec §Rollback | Command and verify command verbatim; Data line; rehearsal block with commands, output, exit codes, ISO times; same SHA as R1; ≤ 7 days before the planned date | Rehearsal summarised in prose |
| Observability | Spec + staging run | Signal (AC), alert with number and window → channel, dashboard, owner, rule ID live in production, test-alert fire and receipt times with latency ≤ 5 min | "Alert configured" without a rule ID |
| Runbook | §3 below | Link with Last verified, or the inline five lines, or `n/a — <reason>` | Date not backed by an executed check |
| Release checklist | §2 below | Each R-item true / false / n/a with evidence | "true" without evidence |
| Go/no-go | The five criteria | Each true/false with evidence; verdict GO or `NO-GO — <items>` | GO with an item false |
| Waivers | Governance | Owner ≠ requester; expiry ≤ 30 days and after the planned date; follow-up issue | Expiry edited instead of a new row |
| Residual risks | PR findings, CANNOT_VERIFY, spec risks | Each with an owner; `none` otherwise | Risk without owner |
| Approval | Release Owner, later turn | Bound to tag + rehearsal time; exact words; evidence reviewed; decision | Approval recorded from the same turn |
| Deploy log | After sign-off | One row per stage at the end of its watch window | Rows written in advance |

## 2. What counts as evidence for R1–R9

| # | Evidence that counts | Evidence that does not |
|---|---|---|
| R1 | Merged commit SHA from `git rev-parse <base>`; tag name prepared locally (`git tag -a vX.Y.Z <sha> -m …`, not pushed) | A branch name |
| R2 | AC table with each PR Verification row and fingerprint; Quick: the issue's acceptance test row | "All tests passed" |
| R3 | Pasted commands + output + exit + ISO time, staging, same SHA as R1, ≤ 7 days old: deploy, enable, rollback, verify | A rehearsal of an older commit; a dry-run flag |
| R4 | Flag-service output or production config line showing off, with time | The code default alone |
| R5 | Fire time and receipt time in the owner's channel for the spec's own rule; latency ≤ 5 min | A different rule; "alerts work" |
| R6 | Screenshot path or query output with staging data points | A dashboard URL alone |
| R7 | Runbook link or inline block with Last verified ≤ 90 days before the planned date | A date with no executed check behind it |
| R8 | Waiver rows with expiry after the planned date | — |
| R9 | `docs/retros/` listing: no retro past its due date | — |

Date arithmetic: write both dates and the difference (`2026-07-02 → 2026-11-27 = 148 days > 90 → false`).

## 3. Runbook rules

When required: the change alters operated behaviour (new or changed endpoint, job, queue consumer, configuration key, flag or alert) on any path; every Full release. Template: `../agentic-sdlc/templates/runbook.md`; location `docs/runbooks/<service>.md`. Quick and Standard without a runbook file: the release notes §Runbook holds the five lines and becomes the file's source at the next Full release.

| Field | Rule |
|---|---|
| Alert | Exact rule name and its condition (number, unit, window) and channel — matches spec and Observability row |
| First check | A query or dashboard panel that answers "is it this change?" in under 2 minutes |
| Rollback | The spec's command, verbatim |
| Verify | The spec's verify command and its expected output |
| Escalation | Role + channel + time to escalate (for example Tech Lead after 30 min without mitigation) |
| Last verified | Date the rollback or the first check last ran against staging or production, and by whom; > 90 days → R7 false |

Update rules: add rows for new alerts and jobs; never delete the previous release's entries without a reason in the change log; every edit appends to the runbook's change log with the release tag. Fresh-reader test: `prompts/runbook-fresh-reader.md`; every question the reader cannot answer from the page becomes a fix before R7 is set true.

## 4. SemVer and CHANGELOG

| Change | Bump | Extra |
|---|---|---|
| Removes or renames a public field, endpoint, flag or config key; changes a default or error semantics someone relies on | MAJOR | Migration guide; deprecation window or explicit "no window" approved by the Release Owner |
| Adds behaviour, fully backward compatible | MINOR | — |
| Fixes behaviour to match the spec | PATCH | A "fix" that changes relied-on behaviour is MAJOR |

The version comes from the tag; do not hand-edit scattered version strings when the project derives them. CHANGELOG entry (Tech Writer): newest first, groups Added · Changed · Deprecated · Removed · Fixed · Security, phrased as user impact, written in the same change as the release notes.

## 5. Release sign-off brief

Present, then end the turn:

```text
Release sign-off request · reports-web v2.14.0 · release commit 5d2e8b0 · planned 2026-11-30
Go/no-go: 5/5 true · Checklist: R1–R7, R9 true; R8 n/a — no waivers
Rollback: flagctl set reports.csvExport off --env prod (rehearsed 2026-11-27T13:52:40-03:00, 18 s to verified 404)
Rollout: 10% of finance analysts 24 h → 100% 24 h; roll back if export error rate > 2% over 15 min or p95 > 341 ms
Residual risks: F-5 locale decimal separator (#143, Product Owner) · COUNT(*) index at volume (Tech Lead)
Read: §Shipped acceptance criteria, §Rollback, §Release checklist, §Go/no-go
Decision needed from the Release Owner: approve, approve with conditions, or reject.
```

Only an explicit "yes" / "approved" in a later turn is recorded. Conditions ("only 10% today") are copied into the Approval row and bind the Deploy log.

## 6. Deploy log discipline

- Tag push first, after the Approval row exists; record its time.
- One row per stage, written at the end of the watch window: start, end, the exact command from the approved notes, error rate, p95, alert silent or fired, decision.
- Breach → run the approved rollback command, then the verify command; record both with output; open an incident at SEV2 or higher; stop. Re-release needs a new go/no-go and a new Release sign-off.

## 7. Handover to Operate

Written when the last stage closes. Appended under `## Deploy log`; also seeded into `specs/NNN-slug/ops.md` when the project keeps ops records (`../agentic-sdlc/templates/ops-record.md` is added in a later release; until it exists, these lines feed the retro §Facts).

```markdown
### Handover to Operate — 2026-12-02

| AC | Signal | Alert (rule ID) | Dashboard or query | Owner |
|---|---|---|---|---|
| AC-1, AC-4 | `reports_export_requests_total{status}` | `reports-export-error-rate` > 2% over 15 min → #reports-oncall | Grafana › Reports › CSV export | SRE on-call, reports team · R. Costa |
| AC-3 | log event `export.rejected_permission` | — (indicator only) | saved query "export permission rejects" | same |
| AC-2 | — | — | — | untraced in production: covered by tests only |

- Indicator: support tickets asking for report exports, 14/month (October 2026) → target ≤ 4/month · first reading due 2026-12-07 (release + 7 days), then monthly · method: help-desk tag `export-request`, monthly count
- Retro due: 2026-12-08 (5 business days after 100%)
- Post-release checks (CANNOT_VERIFY): none
- Open items: #143 locale format (Product Owner) · #142 Minor rename (Developer) · waivers: none
- Runbook: inline in these release notes, last verified 2026-11-27
- Next agent: SRE
```

Rules: every shipped AC appears in exactly one row; an AC without a production signal is written as `untraced in production` or `indicator only`, never omitted, so the gap is visible to the SRE and the retro. The handover adds no alerts and no thresholds; Operate monitors what the spec defined.

## 8. Quick path with a production deploy

Release notes still apply. R2 lists the issue's acceptance test. Observability is the one line `Observability: <signal> · rollback: <command>` from the PR; R5 applies only when the change adds or edits an alert; R6 and R9 are `n/a — Quick`. Runbook only when operated behaviour changes. Handover: signal, owner, rollback; indicator and retro follow the batched Quick retro.
