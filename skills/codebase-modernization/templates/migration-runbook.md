# Migration runbook — <NNN-slug>

<!-- Created by codebase-modernization Step 9. Drafted in Design by the Architect/Planner, completed and
     rehearsed by the Release Engineer before the Release sign-off request. Commands must be copy-pasteable;
     no secrets, production hostnames or record contents — reference config keys and saved queries instead.
     The service runbook docs/runbooks/<service>.md receives the new flags, alerts and a Change log row
     in the same release. -->

| Item | Value |
|---|---|
| Spec · ADR | `specs/<NNN-slug>/spec.md` · `docs/adr/<NNNN-slug>.md` |
| Pattern | <expand–contract | strangler | branch by abstraction | retire> |
| Disposition | <retire | rehost | upgrade | re-platform | refactor | migrate> (from `docs/modernization/inventory.md`) |
| Owner (Release Engineer) · Escalation | <role: name> · <role + channel> |
| Flags | `<area.change>` · default <old> · set in <config location> |
| Irreversible point | Phase <n> — <drop column / delete table / remove endpoint> |
| Last rehearsed | <YYYY-MM-DD> in <staging> @ `<sha12>` |

## Entry criteria

All `true` before phase 1 ships:

- [ ] CHAR register complete; each test shown red under one mutation (`current-state.md`)
- [ ] Specify and Design sign-offs recorded for this work item
- [ ] Every phase below has a rollback command and a verify command rehearsed in staging
- [ ] Dashboards and alerts named in the spec are live (rule IDs below)
- [ ] Consumers from the dependency map notified (date: <YYYY-MM-DD>)

## Phases

<!-- One row per deployable phase. Each phase is its own deploy. Advance only when "Go when" holds for
     the stated window; roll back on any "Roll back if". Exposure stages follow release-ops.md
     (1% ≥ 30 min, 10% ≥ 60 min, 100% ≥ 24 h). -->

| # | Phase | Command | Verify command | Expected | Go when | Roll back if | Rollback command | Reversible |
|---|---|---|---|---|---|---|---|---|
| 1 | Expand | `<migrate up command>` | `<schema check query>` | <column present, nullable> | Applied in prod; down path rehearsed | Migration error | `<migrate down command>` | yes |
| 2 | Dual-write | `<flag set area.dualWrite=on>` | `<dual-write error count query>` | 0 errors | 0 errors for 24 h | errors > 0 | `<flag off>` | yes |
| 3 | Backfill | `<job command --batch 1000 --sleep 200ms>` | `<progress query>` · `<reconciliation query>` | 100% · 0 mismatches | both met | mismatches > 0 | `<stop job>` | yes |
| 4 | Switch reads / shift | `<flag stage 1%>` → 10% → 100% | `<error rate, p95, mismatch dashboards>` | within release-ops thresholds | stage window passed | any threshold breached | `<flag off>` | yes |
| 5 | Bake | — | `<old path read/call count query>` | 0 | <n> days (spec) elapsed | any rollback | `<flag off>` | yes |
| 6 | Contract | `<migrate contract command>` | `<schema check query>` | old column absent | — | — | Restore from backup (below) | **no** |

## Dual-run readings (strangler)

| Date | Window | Comparisons | Mismatches | Rate | Threshold (spec) | Classes open |
|---|---|---|---|---|---|---|
| <YYYY-MM-DD> | <hh:mm–hh:mm> | <n> | <n> | <n>% | ≤ <n>% over ≥ <n> | <none | class → AC-n / bug #n> |

Logs hold counts and field hashes only — never payloads.

## Irreversible step evidence

Required before the contract PR requests its own Release sign-off:

| Item | Command | Output (pasted) | Date |
|---|---|---|---|
| Backup taken | `<backup command>` | <size, checksum, location key> | <YYYY-MM-DD> |
| Restore rehearsed in staging from that backup | `<restore command>` | <rows restored, verify query result> | <YYYY-MM-DD> |
| Zero use of the old path during bake | `<query>` · window <dates> | 0 | <YYYY-MM-DD> |
| Bake period elapsed | spec value <n> days | <start → end> | <YYYY-MM-DD> |

## Deprecation notice (when consumers exist)

| Item | Value |
|---|---|
| Deprecated | <endpoint, field, job> |
| Replacement | <new endpoint or behaviour> |
| Type | <advisory: stop using by YYYY-MM-DD | compulsory: removed on YYYY-MM-DD> |
| Decided by | <Product Owner when users or partners are affected> |
| Sent | <YYYY-MM-DD> · <channel> |

## Abort criteria

Stop the migration and return to Design when any of: a rollback runs twice in the same phase · a dual-run mismatch class has no explanation after <n> days · a consumer not in the dependency map appears · reconciliation mismatches persist after a re-run of the backfill.

## Log

| Date | Phase | By | Action | Commit | Result |
|---|---|---|---|---|---|
| <YYYY-MM-DD> | <n> | <role: name> | <rehearsal | deploy | rollback> | `<sha12>` | <ok | failed: reason> |
