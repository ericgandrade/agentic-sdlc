# Worked example — CSV export (Standard path)

One feature taken through all 7 stages of the Agentic SDLC. Every artifact in this folder is an output of the method, and the scripts in `scripts/` use the folder as their test fixture: a script change that breaks a check on this example fails `node --test`.

## Scenario

"Add CSV export of the currently filtered rows to the reports page of an Express + React app. The file contains order ID, order date and order total. No customer names or other personal data."

## Path score

| Input | Value | Points |
|---|---|---|
| Files touched | 5 (export route, CSV serializer, permission check, export button, API client) | 2 |
| Components | 2 (API, web) | 2 |
| Iterations | 1 | 1 |
| **Size S** | | **5 → Standard** |
| Risk triggers | money (order totals) | R = 1 → Standard |

Score line: `Path: Standard · S=5 · R=1 (money)`. Adding customer names adds the personal-data trigger and moves the work to Full; the example excludes them on purpose.

## Timeline and people

| Date (2026) | Event | Record |
|---|---|---|
| 11-23 | Spec rev 1 and plan rev 1 requested 10:05 UTC; Product Owner L. Rocha approves 14:40, Tech Lead D. Okafor 15:10 (combined review); Test Engineer designs the acceptance tests | `spec.md`, `plan.md` §Approvals, `approvals.md`, `acceptance-tests.md` |
| 11-24 | Build run `r1`: T1–T5 red → green, one commit each | `run-ledger.jsonl` |
| 11-25 | Review round 1 (F-1..F-7), fixes, review round 2 → GO; Verification rows at the head `1b8d74a` | `pr-body.md`, `plan.md` §Loop ledger |
| 11-27 | Merge `5d2e8b0`; staging rollback rehearsal and test alert | `release-notes.md` |
| 11-30 | Release sign-off (Release Owner P. Nair), tag `v2.14.0`, stage 1 at 10% | `release-notes.md` |
| 12-01 | Stage 2 at 100% | `release-notes.md` §Deploy log |
| 12-08 | Retro (facilitator R. Costa, SRE; engineer A. Mendes) | `retro.md` |

## Checks

Run from `skills/agentic-sdlc/`; every command exits 0 on this folder:

```bash
node scripts/spec-lint.mjs examples/worked-example/specs/001-csv-export/spec.md --check-approval
node scripts/plan-graph.mjs examples/worked-example/specs/001-csv-export/plan.md --check --check-approval
node scripts/run-ledger.mjs status --ledger examples/worked-example/specs/001-csv-export/run-ledger.jsonl
node scripts/run-ledger.mjs render --ledger examples/worked-example/specs/001-csv-export/run-ledger.jsonl
```

`preflight` runs inside the project repository at run start and resume; its three passing results are the `preflight` events in `run-ledger.jsonl`.
