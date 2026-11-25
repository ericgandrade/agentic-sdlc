<!--
Agentic SDLC — release notes (dogfood). Filled from templates/release-notes.md.
No package registry, staging or alerting exists in this dogfood: publish, staging rehearsal and alert
items are SIMULATED or CANNOT_VERIFY and are covered by waiver W-2. Location: specs/001-price-format/
(the template allows a host release or CHANGELOG.md; this repo has neither — see dogfood finding).
-->

# Release notes — strkit v0.2.0

**Spec:** `specs/001-price-format/spec.md` rev 1 · sha256 `46743045b021` · **PR:** none — no PR host; review record `specs/001-price-format/review.md` (head `5d322bd`, code reviewed at `a6eb040`) · **Path:** Standard
**Release commit:** `fb5839abaf28` · **Tag:** `v0.2.0` (local only; created after Release sign-off) · **Planned date:** 2026-11-25
**Release Engineer:** agent (Release Engineer role, dogfood) · **Release Owner:** Release Owner, dogfood-owner (SIMULATED)

## Summary

strkit 0.2.0 adds `formatPrice(amountMinor, currency, locale)`, which formats an integer amount in minor units (cents, or yen for zero-decimal currencies) as a locale-aware price string. Invalid amounts, currencies and locales throw `RangeError`. Spec 001.

## For users

| What changes | Who is affected | Action required | Docs |
|---|---|---|---|
| New export `formatPrice` from `strkit`; `slugify` unchanged | strkit consumers | none (additive); opt in via `npm i strkit@next` until promotion to `latest` | `specs/001-price-format/spec.md` §Experience (no docs site) |

## Shipped acceptance criteria

Re-run at the release commit (the review fingerprint `754c1c280a5f` is stale after the review-record, sign-off, merge and version commits). Evidence: `.agentic-sdlc/evidence/release-*.log`.

| AC | Title | Critical | Evidence (PR Verification row) | Fingerprint | Result |
|---|---|---|---|---|---|
| AC-1 | USD en-US formats as `$1,234.56` | yes | review.md row AC-1 · AT-1a, AT-1b · re-run `node --test --test-name-pattern="AC-1[^0-9]" test/price.acceptance.test.js test/price.test.js` exit 0 | `b34338e70307` | PASS |
| AC-2 | EUR de-DE formats as `1.234,56 €` | no | review.md row AC-2 · AT-2a · re-run exit 0 | `b34338e70307` | PASS |
| AC-3 | JPY (0 decimals) formats as `¥1,234` | no | review.md row AC-3 · AT-3a · re-run exit 0 | `b34338e70307` | PASS |
| AC-4 | Non-safe-integer amount → RangeError | yes | review.md row AC-4 · AT-4a ×4 · re-run exit 0 | `b34338e70307` | PASS |
| AC-5 | Bad currency or locale → RangeError | yes | review.md row AC-5 · AT-5a ×3 · re-run exit 0 | `b34338e70307` | PASS |

DoD at `b34338e70307`: lint 0 · test 0 (24/24) · coverage 0 (26/26 = 100%) · typecheck n/a.

## Rollout

**Mechanism:** flag = npm dist-tag `next` (default off: `latest` stays 0.1.0) · **Baseline (7 days before stage 1):** n/a — library, no error-rate or latency signal; baseline = demo consumer suite 0 failures/day · source `npm test --silent` in the demo consumer (SIMULATED)

| Stage | Exposure | Watch window (≥ release-ops minimum) | Advance if (all) | Roll back if (any) |
|---|---|---|---|---|
| 1 | `next` dist-tag (opt-in consumers) | 7 days | demo consumer failures = 0 per day · no RangeError reports · spec alert silent | consumer failure > 0 per day · spec alert fires · SEV1/SEV2 |
| 2 | 100% (`latest` → 0.2.0) | 24 h, then the release closes | same | same |

## Rollback

**Command:** `git revert -m 1 0b6a4e6` then publish 0.2.1 / move `next` back to 0.1.0 · **Verify:** `node -e 'import("./src/index.js").then(m=>console.log("formatPrice" in m ? "present" : "absent"))' && npm test --silent`

**Rehearsal (R3):** environment local git worktree (no staging exists) · date 2026-11-25 · commit `fb5839abaf28`

```text
$ git revert -m 1 --no-edit 0b6a4e6
 delete mode 100644 test/price.acceptance.test.js
 delete mode 100644 test/price.test.js
exit 0 · 2026-11-25T00:10:33Z
$ node -e 'import("./src/index.js").then(m=>console.log("formatPrice" in m ? "present" : "absent"))' && npm test --silent
formatPrice absent
# pass 5
# fail 0
exit 0 · 2026-11-25T00:10:33Z
```

## Observability

| Field | Value |
|---|---|
| Signal (AC) | demo consumer test suite result for `formatPrice` call sites · AC-1, AC-2, AC-3, AC-4 |
| Alert | demo consumer test failures > 0 per day → Release Owner by email |
| Dashboard or query | `npm test --silent` in the demo consumer |
| Owner | Release Owner, dogfood-owner (SIMULATED) |
| Alert live in production (go/no-go 4) | CANNOT_VERIFY — no CI or mail alerting in the dogfood; waiver W-2 |
| Test alert fired in staging (R5) | CANNOT_VERIFY — no staging and no alert channel; waiver W-2 |

## Runbook

`n/a — library with no operated service; the inline rollback above (revert + republish / move dist-tag) is the whole procedure`

- **Alert:** demo consumer failures > 0 per day
- **First check:** `npm test --silent` in the demo consumer
- **Rollback:** `git revert -m 1 0b6a4e6`, publish 0.2.1, `npm dist-tag add strkit@0.1.0 next`
- **Verify:** `npm view strkit dist-tags` and the verify command above
- **Escalation:** Release Owner (dogfood-owner) by email
- **Last verified:** 2026-11-25 (rehearsal above)

## Release checklist

| # | Item | Evidence | Value |
|---|---|---|---|
| R1 | Release commit and tag named | `fb5839abaf28`, `v0.2.0` | true |
| R2 | Every AC listed with evidence | §Shipped acceptance criteria | true |
| R3 | Rollback rehearsed in staging, same SHA, ≤ 7 days | §Rollback — same SHA, today, but a local worktree, not staging | CANNOT_VERIFY — waiver W-2 |
| R4 | Flag defaults off | `latest` stays 0.1.0; stage 1 publishes with `--tag next` (SIMULATED, no registry) | true (by procedure; no registry output) |
| R5 | Test alert fired once in staging | §Observability | CANNOT_VERIFY — waiver W-2 |
| R6 | Dashboard or query resolves | `npm test --silent` exit 0 at `b34338e70307` (`.agentic-sdlc/evidence/release-test.log`) | true |
| R7 | Runbook current (≤ 90 days) | §Runbook, Last verified 2026-11-25 | true |
| R8 | Waivers unexpired | W-1 expires 2026-12-25, W-2 expires 2026-12-25 | true |
| R9 | No overdue retro | `docs/retros/` absent; Quick batch has 1 item (< 10, < 14 days) → not due | true |

## Go/no-go

| # | Criterion | Evidence | Value |
|---|---|---|---|
| 1 | Every AC has PASS evidence bound to the release fingerprint | §Shipped acceptance criteria, fingerprint `b34338e70307` | true |
| 2 | 0 open Critical; open Important findings accepted with an issue | review.md Review triage: F-1 Critical fixed (a6eb040), 0 Important open, F-3 Minor deferred | true |
| 3 | Checklist R1–R9 true for applicable items | §Release checklist (R3, R5 under W-2) | true (with waiver) |
| 4 | Spec alerts live in production | §Observability | CANNOT_VERIFY — waiver W-2 |
| 5 | Every waiver unexpired at the planned date | §Waivers | true |

**Verdict:** GO (with accept-risk waiver W-2 for R3, R5 and go/no-go 4)

## Waivers

| ID | Kind (accept risk \| defer \| emergency) | Gate waived | Reason | Owner (≠ requester) | Expiry (≤ 30 days) | Follow-up issue |
|---|---|---|---|---|---|---|
| W-1 | accept risk | Trace step: every commit names ≥ 1 Tn | 5 artifact commits (issue, spec, approvals, acceptance tests, ledger) carry no task ID by design | Tech Lead, dogfood-owner (SIMULATED; requester = agent) | 2026-12-25 | `docs/issues/0003-trace-artifact-commits.md` (not created — dogfood) |
| W-2 | accept risk | R3 staging rehearsal, R5 staging test alert, go/no-go 4 production alert | dogfood has no staging, registry or alert channel; rollback rehearsed in a local worktree on the release SHA | Release Owner, dogfood-owner (SIMULATED; requester = agent Release Engineer) | 2026-12-25 | `docs/issues/0004-consumer-alert.md` (not created — dogfood) |

## Residual risks

- ICU data differences between Node builds could change AC-2 output (e.g. narrow no-break space) — owner: Release Owner, dogfood-owner (SIMULATED).
- `Intl.NumberFormat.format(string)` exact-decimal behaviour is unverified on Node 18 — owner: Tech Lead, dogfood-owner (SIMULATED).

## Approval

| Sign-off | Bound to (tag · rehearsal) | Date | Role | Person | Exact words | Evidence reviewed | Residual risks | Decision |
|---|---|---|---|---|---|---|---|---|
| Release | `v0.2.0` · rehearsal 2026-11-25T00:10:33Z | 2026-11-25 | Release Owner | dogfood-owner (SIMULATED) | "yes, approved — release v0.2.0 to next" | all sections | ICU drift; Node 18 untested | approved |

## Deploy log

| Stage | Start (ISO) | End (ISO) | Command | Error rate | p95 | Alert | Decision |
|---|---|---|---|---|---|---|---|
| 1 | 2026-11-25T00:12:19Z | 2026-11-25T00:12:19Z | `npm pack --dry-run` (stand-in for `npm publish --tag next`; SIMULATED, no registry) | n/a — library | n/a — library | silent (no channel) | hold — 7-day watch window not run in the dogfood; release stays at stage 1 |
