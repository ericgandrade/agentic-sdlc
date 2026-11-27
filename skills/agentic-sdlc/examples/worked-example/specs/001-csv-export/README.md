# specs/001-csv-export

Artifact folder for the worked example, written from the templates in `templates/`. Each file is complete when its checker exits 0 on it. A checker marked † is added in a later release; until then the manual procedure named in the last column applies (`references/artifacts.md` §Later-release files).

| File | Stage | Content | Checked by |
|---|---|---|---|
| `spec.md` | Specify | AC-1..AC-4 (filtered rows only, formula-injection escaping, permission check, 50,000-row limit), observability (alert on export error rate > 2% over 15 min), rollback (feature flag off), `## Approvals` with rev + hash | `scripts/spec-lint.mjs --check-approval` |
| `approvals.md` | Specify, Design | Approval register: request and answer times, exact words, asked role | `scripts/spec-lint.mjs --check-approval` |
| `plan.md` | Design | Tasks T1–T5 with AC, `Blocked by`, Files; Impact; `## Loop ledger` rendered from the run ledger; `## Approvals` (combined Specify + Design review: 5 tasks) | `scripts/plan-graph.mjs --check --check-approval` |
| `graph.json` | Design | Task graph, waves, file conflicts, plan hash | `scripts/plan-graph.mjs --check` |
| `acceptance-tests.md` | Test | One or more acceptance tests per AC, designed from the spec by the Test Engineer | `trace-check`† (manual: `references/verification.md` §Trace) |
| `run-ledger.jsonl` | Build | Archived ledger of run `r1`: preflight, red, round, check and finish events | `scripts/run-ledger.mjs status` and `render` |
| `pr-body.md` | Test | Verification rows bound to the fingerprint, Trace table, Review triage, GO | `dod-gate`, `approval-check`, `audit-export` |
| `release-notes.md` | Release | AC list, rollout 10% → 100%, rollback rehearsal output, Release sign-off | release checklist R1–R9 in the file (`references/release-ops.md`) |
| `retro.md` | Operate | Retro within 5 business days, actions with owners | validity checklist in the file (`references/retrospective.md`); `metrics`† |

The Operate record `ops.md` (template `templates/ops-record.md`†) is added in a later release; until then the indicator reading and incident count live in `retro.md` §Facts.
