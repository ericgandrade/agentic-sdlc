# Expand–contract and strangler

Load at Steps 7–8. Contract: `../../agentic-sdlc/references/brownfield.md` §3. Owner: Architect (pattern and ADR); the Planner turns phases into tasks; the Release Engineer runs cutover and rollback.

One rule underlies every pattern here: **old and new code are both valid at every step, and every step deploys and rolls back alone.** The only exception is the contract step, which is irreversible by design and gated separately.

## 1. Choosing a pattern

| Change | Pattern | Section |
|---|---|---|
| Column, table, index, stored file or message format | Expand–contract | §2 |
| Whole component, endpoint or job replaced while traffic flows | Strangler with dual-run | §3 |
| Implementation swapped behind an interface inside one deploy unit | Branch by abstraction | §4 |
| Consumers still on an old interface after the switch | Adapter + deprecation notice | §5 |

Big-bang replacement (switch everything in one deploy, no route back) is not a pattern here; a design proposing it gets no Design sign-off request.

## 2. Expand–contract (schema and data formats)

| Phase | What ships | Old code | New code | Rollback | Gate to next phase |
|---|---|---|---|---|---|
| 1. Expand | Add the new column/table/field, nullable or with a default; no reads yet | Valid (ignores it) | — | Down migration drops the unused addition | Migration applied in staging and production; down path tested in staging |
| 2. Dual-write | Writes go to old and new; reads still old | Valid | Writes both | Flag off → write old only | Dual-write error count = 0 for 24 h |
| 3. Backfill | Copy old → new in batches | Valid | — | Stop the job; new rows are disposable | Progress query = 100%; reconciliation query mismatch = 0 |
| 4. Switch reads | Reads from new behind a flag, staged 1% → 10% → 100% | Still written | Reads new | Flag off → read old | Release stage gates (§6) passed; CHAR tests green against the new read path |
| 5. Bake | Nothing new ships; both kept in sync | — | — | Flag off | Bake period stated in the spec elapsed (default 14 days) with no rollback |
| 6. Contract | Stop writing old; drop old column/table/field; remove dual-write code | Removed | Only path | **Irreversible** — restore from backup | — |

Rules:
- Each phase is its own deploy; phases 1–5 can share a spec, phase 6 is its own PR and its own Release sign-off (usually its own iteration or spec).
- Every migration has a tested down path except the contract step. The down path is run once in staging and its output pasted in the PR.
- Large tables: indexes are created without blocking writes (`CREATE INDEX CONCURRENTLY` in PostgreSQL, online DDL in MySQL); backfill batches ≤ 1,000 rows by default, with a sleep between batches, resumable from the last key, idempotent (re-running a batch changes nothing).
- Renames are expand–contract: add the new name, dual-write, backfill, switch reads, drop the old name. A database `RENAME` while old code runs breaks every old reader.
- Type or format conversions keep the old value until contract; the conversion function is pure and covered by tests on synthetic edge values (empty, null, malformed, maximum length).
- Contract prerequisites, each with evidence in the migration runbook: backup taken (command and output), restore command executed in staging against that backup (output), zero reads of the old column/table during the bake (query and result), Release sign-off naming the irreversible step.

## 3. Strangler with dual-run

| Phase | What ships | Rollback | Gate to next phase |
|---|---|---|---|
| 1. Pin | `CHAR-n` tests on the old component's observable outputs, synthetic requests | — | Register complete; each test shown red under one mutation |
| 2. Facade | A routing layer in front of the old component; 100% to old; flag defaults to old | Remove facade (no behaviour change) | Latency overhead ≤ the spec budget; CHAR tests green through the facade |
| 3. New path dark | New implementation deployed, receives no live responses | Undeploy | CHAR tests green against new (or each difference covered by an AC) |
| 4. Dual-run (shadow) | Facade sends each request to both; old answers; outputs compared | Flag off shadowing | Mismatch rate ≤ spec threshold (e.g. ≤ 0.1%) over ≥ spec sample (e.g. 10,000 comparisons); every mismatch class explained |
| 5. Shift | New answers for 1% → 10% → 100% | Flag → old (one command) | Release stage gates (§6) per stage |
| 6. Bake | 100% new; old kept deployable | Flag → old | Bake period elapsed; zero calls to old for the spec's window |
| 7. Retire old | Remove old code, old flag and facade branch; contract old data (§2 phase 6) | **Irreversible** for data | Own PR and Release sign-off |

Dual-run rules:
- Side effects run once: the shadow path is read-only or writes to an isolated store. Payments, emails, partner calls and other external effects are never duplicated.
- Comparison logs mismatch counts by class and a hash of each differing field — never request or response payloads, never personal data.
- Comparison normalizes the same volatile fields the CHAR scrubbers do (timestamps, generated IDs, ordering) and nothing else.
- Each mismatch class ends as one of: bug in new (fix), pinned legacy bug kept (new path reproduces it), or intended change (needs an AC — otherwise the shift waits).

## 4. Branch by abstraction

1. Introduce an interface the callers use; the old implementation is the only one (behaviour-neutral commit, CHAR tests green).
2. Add the new implementation behind a flag defaulting to old.
3. Switch by flag, staged as in §6.
4. Remove the old implementation and the flag after the bake period.

Every step merges to the main branch; no long-lived migration branch.

## 5. Adapter and deprecation

Consumers that cannot move with the release keep the old interface through an adapter delegating to the new implementation. The deprecation notice states: what is deprecated, the replacement, the type — **advisory** ("stop using by YYYY-MM-DD") or **compulsory** ("removed on YYYY-MM-DD") — and who to contact. Compulsory dates need the Product Owner's decision when partners or users are affected. The migration runbook records the notice date and the zero-use evidence before removal.

## 6. Exposure and rollback

Traffic shifts follow `../../agentic-sdlc/references/release-ops.md` §Go/no-go: stage 1 (1%, ≥ 30 min), stage 2 (10%, ≥ 60 min), stage 3 (100%, ≥ 24 h); advance only within the stage thresholds, roll back on any breach. Rollback for every reversible phase is one command (flag off, route back, stop job) plus one verify command, both rehearsed in staging and pasted in the migration runbook before the Release sign-off request.

## 7. Feature flags

- One flag per phase that changes routing or reads; name `<area>.<change>` (e.g. `quotes.newEngine`, `customers.readPhoneE164`).
- Default = old behaviour; default stays old until stage 3 completes.
- Each flag has an owner and a removal task in the plan (after bake); flags left in place are listed as debt in the inventory.
- Flags and their defaults go into the service runbook's "Flags and config keys" row in the same release.

## 8. Retire at zero use

Removal of an endpoint, job, table or component needs, in the migration runbook: the zero-use query, its window (spec value, default 30 days) and result = 0; each consumer from the dependency map confirmed migrated; the deprecation notice date; the data retention decision. Any call in the window resets the window.
