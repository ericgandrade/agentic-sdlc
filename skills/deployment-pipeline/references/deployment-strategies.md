# Deployment strategies, rollback targets and stage decisions

Load in Step 6 (choose), Step 7 (rehearse) and Step 8 (roll out). The stage table, the 7-day baseline, the roll-back conditions and the breach procedure belong to `../../agentic-sdlc/references/release-ops.md`; this file adds the mechanism choice, rollback time targets and the hold rule, never a looser threshold.

## 1. Choose the mechanism

The spec's Rollout row decides *what* is exposed and in which steps; the infrastructure decides *how*. Ask in this order and stop at the first yes:

| Question | Yes → mechanism | Rollback | Target |
|---|---|---|---|
| Is the change a behaviour switch inside code that can ship dark? | Feature flag, default **off**, exposure by percentage or cohort | flag off | < 1 min |
| Does the change alter a database schema or stored data format? | Expand-contract migration (§3) **plus** a flag or staged rollout for the code | stop at expand; code rollback; data restore only as last resort | < 15 min |
| Can the router split traffic by percentage (service mesh, load balancer weights, gateway)? | Canary following the stage table | route 100% to the previous version | < 5 min |
| Are there two identical environments with an instant switch? | Blue-green; stage 1 = internal users on green | switch back | < 1 min |
| Is it a replica set with backward-compatible versions? | Rolling with max-unavailable ≤ 25%; stage = share of replicas | redeploy the previous artifact | < 5 min |
| None of the above (single host, mobile binary, library release) | Release to the smallest audience the channel allows (internal track, beta channel, pre-release tag) | channel rollback, yank, or previous binary | record the actual time |

The spec asks for stages the infrastructure cannot provide → `NEEDS_CONTEXT` to the Product Owner and Tech Lead with the options above; never fake a stage (for example "10%" by deploying to one of two hosts) without writing the real exposure in the release notes.

Rollback slower than its target in the rehearsal → Important finding, residual risk accepted by the Release Owner or fixed before release (Step 7).

## 2. Feature flag rules

| Rule | Check |
|---|---|
| Name and default | Spec Rollout row names the flag; production value `off` before stage 1 (R4) |
| Owner and expiry | Flag record lists an owner and a removal date ≤ 2 weeks after reaching 100% and closing stage 3 |
| Both states tested | CI runs the AC tests with the flag on and off (two test commands or a matrix); the `test` key in `sdlc-dod` covers both |
| Kill switch | The rollback command flips the flag without a deploy |
| Category | Release flag (temporary, removed after rollout) vs operational kill switch (permanent, listed in the runbook); never reuse a release flag as a permanent setting |
| Removal | Removal is a new task with its own PR; an expired flag is a `retrospective` finding |

Flag exposure by percentage follows the stage table rows; exposure to a named cohort (internal staff, beta list) is stage 1.

## 3. Database changes: expand-contract

1. **Expand** — add new columns, tables or indexes; nullable or with defaults; old code keeps working. Deploy alone; rollback = leave it in place.
2. **Migrate code** — new code writes both shapes and reads the new one behind the flag; release through the stage table.
3. **Backfill** — idempotent batches with a progress marker; pause on error-rate rise.
4. **Contract** — remove the old shape in a later release, only after stage 3 closed and the flag is removed.

A destructive step (drop, rename, type narrowing) in the same release as the code that needs it → NO-GO, because the rollback command cannot restore the previous behaviour. Backups do not count as a rollback; a restore is an incident procedure.

## 4. Stage decision procedure

Inputs per stage: start time, minimum watch, for each threshold signal the baseline and the current reading over the window, request or event count, longest gap, alert state, open incidents.

```text
if any SEV1/SEV2 open, or spec alert fired, or error rate > baseline + 0.5 pp, or p95 > baseline × 1.10:
    ROLL BACK
elif window elapsed < stage minimum, or events < 100, or signal gap > 5 min, or dashboard/alert unreachable:
    HOLD (extend; at 2 × stage minimum still HOLD → Release Owner chooses: roll back [default] or stay with a recorded reason)
else:
    ADVANCE (stage 3: CLOSE after 24 h)
```

Roll back wins over hold: a threshold exceeded on partial data is still a breach. Advance requires every signal named in the spec; a signal not on the dashboard is a hold, not a pass.

Worked example (baseline written before stage 1: error rate 0.42%, p95 310 ms):

| Stage | Window | Events | Error rate | p95 | Alert | Decision |
|---|---|---|---|---|---|---|
| 1 (internal) | 30 min | 64 | 0.00% | 295 ms | silent | hold — 64 < 100 events; extend |
| 1 (internal) | 55 min | 131 | 0.76% | 318 ms | silent | advance — 0.76 ≤ 0.92 and 318 ≤ 341 |
| 2 (10%) | 60 min | 9,840 | 0.95% | 336 ms | silent | roll back — 0.95 > 0.92 |

Limits: error 0.42 + 0.5 = 0.92%; p95 310 × 1.10 = 341 ms. After the roll back: rollback command and verify output in §Deploy log, incident at SEV2 or higher, hand to the SRE, stop. Re-release needs a new go/no-go and a new Release sign-off.

A flag-only change flipped straight to 100% uses stage 3 (24 h watch). A spec stage of 5% maps to row 2 (10%) and watches max(spec window, 60 min).

## 5. Deploy log rows

One row per stage and per hold extension in release notes §Deploy log: start (ISO), end (ISO), command, error rate, p95, alert, decision. Decision values: `advance`, `hold — <reason>`, `rolled back + incident #n`, `closed`. Readings come from the dashboard or query named in the spec, pasted with the query and timestamp; a number typed from memory is not evidence.

## 6. Error budget (optional)

When the service has an SLO with an error budget (`operations-and-incidents`): budget remaining < 25% → present it to the Release Owner as a residual risk in the go/no-go brief; budget exhausted → recommend holding non-urgent releases. The decision stays with the Release Owner; the stage thresholds above do not change.
