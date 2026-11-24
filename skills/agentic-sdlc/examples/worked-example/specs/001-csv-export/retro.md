# Retro — 2026-12-08

<!-- Worked example (synthetic). Written from templates/retro.md; rules in references/retrospective.md. In a project this record lives at docs/retros/2026-12-08.md; it sits in the spec folder here so the script fixtures stay self-contained. -->

**Covers:** `specs/001-csv-export` · release `v2.14.0` · **Kind:** Standard
**Trigger:** 100% rollout on 2026-12-01 · **Due:** 2026-12-08 · **Held:** 2026-12-08 · **Duration:** 14 min
**Facilitator:** Scrum Master (human) · R. Costa · **Participants:** Product Owner, L. Rocha · Tech Lead, D. Okafor · Release Owner, P. Nair · engineer and PR author, A. Mendes · **Facts drafted by:** Scrum Master agent (router), production facts from the SRE agent

## Prior actions

| ID | Action | Owner | Target file | Status | Cycles open | Tech Lead ruling |
|---|---|---|---|---|---|---|
| RA-20261113-1 | Run `npm audit --audit-level=high` in CI on every PR that changes `package-lock.json` | Tech Lead, D. Okafor | `.github/workflows/ci.yml` | done `3e9f0a2` | 0 | n/a |
| RA-20261113-2 | Add pitfall: integration tests use the seeded test container; never mock repositories | engineer, A. Mendes | `AGENTS.md` (Pitfalls) | done `2b7c1d0` | 0 | n/a |

## Facts

| Fact | Value | Source |
|---|---|---|
| Lead time, first commit → merge | 77 h (`a11c0f3` 2026-11-24T09:41Z → merge `5d2e8b0` 2026-11-27T14:30Z) | `git log`; `run-ledger.jsonl` |
| Loop rounds per task (max) · escalations | T2: 3 rounds (red-green 1, review-fix 2: F-3) · T3: 3 rounds (red-green 1, review-fix 2: F-1, F-2) · T1, T4, T5: 1 round (red-green) · 0 escalations | `run-ledger status --ledger specs/001-csv-export/run-ledger.jsonl`; `plan.md` Loop ledger (failed and fixing rounds only) |
| Review findings Critical / Important / Minor | 1 / 3 / 1 (F-1 / F-2, F-3, F-7 / F-6); F-7 rejected on spec text | PR #138 Review triage |
| Critical found after Test sign-off | 0 | postmortems, issues |
| Reverts or hotfixes ≤ 7 days after release | 0 (window 2026-11-30 → 2026-12-07, closed) | `git log -E -i --since=2026-11-30 --until=2026-12-07 --grep='^Revert\|hotfix'` |
| Indicator: first reading vs target | 1 ticket tagged `export-request` from 2026-11-30 to 2026-12-07 vs target ≤ 4 tickets/month (baseline 14/month) → on track | help-desk tag count, read 2026-12-07 |
| Incidents since release (SEV) | 0 | `docs/postmortems/` |

## Keep

- Acceptance tests designed from the spec before code: 10 of 10 were red at the base commit, and no AC needed re-interpretation in review.
- Rollback rehearsal with the spec's verify `curl`: 18 s to a verified rollback in staging (spec limit 60 s); the same commands went into the runbook unchanged.

## Change

| # | Observation | Cause tag | Seen before (≤ 90 days) |
|---|---|---|---|
| C-1 | T2's unit test mocked `UserRepository` (F-3), although the pitfall from RA-20261113-2 was already in AGENTS.md | test-gap | `docs/retros/2026-11-13.md` C-2 (mocked `OrderRepository`) → 2 hits: automated control required |
| C-2 | The `Content-Disposition` filename was built from the free-text filter `q` (F-1, header injection); the Developer's own checks passed, lenses L3 and L4 caught it | security | none |

## Actions

| ID | Action | Owner (role, person) | Target file | From | Control approved by (recurrence only) | Due (≤ 14 days) | Status |
|---|---|---|---|---|---|---|---|
| RA-20261208-1 | Add a lint rule that fails when a test file calls `vi.mock` on a module under `src/**/repositories/` | engineer, A. Mendes | `eslint.config.js` | C-1 | Tech Lead, D. Okafor (proposer: A. Mendes) | 2026-12-22 | open |
| RA-20261208-2 | Add pitfall: response headers never contain request input; export filenames are generated on the server | Tech Lead, D. Okafor | `AGENTS.md` (Pitfalls) | C-2 | n/a | 2026-12-15 | open |

## Carried

none — all agenda items covered in 14 min

## Full additions

n/a — Standard

## Validity

- [x] ≥ 1 action; every action has an ID, one owner, a target file and a due date ≤ 14 days
- [x] Every prior open action has a status; any open > 2 cycles has a Tech Lead ruling
- [x] Every Change item has a cause tag and a "seen before" lookup
- [x] A tag seen in 2 retros or postmortems within 90 days has an automated-control action approved by a person ≠ proposer
- [x] Held ≤ due date; duration within the timebox
