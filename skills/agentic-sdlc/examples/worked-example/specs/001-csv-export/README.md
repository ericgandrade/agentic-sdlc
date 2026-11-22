# specs/001-csv-export

Artifact folder for the worked example. Batch 1 of the gap-closure plan (2026-11-22) writes these files from the templates in `templates/`:

| File | Stage | Content | Checked by |
|---|---|---|---|
| `spec.md` | Specify | AC-1..AC-4 (filtered rows only, formula-injection escaping, permission check, 50,000-row limit), observability (alert on export error rate > 2% over 15 min), rollback (feature flag off), `## Approvals` with rev + hash | `scripts/spec-lint.mjs` |
| `plan.md` | Design | Tasks T1–T5 with `Refs: AC-n`, dependencies, `## Approvals` (combined Spec + Plan review: 5 tasks) | `scripts/plan-graph.mjs` |
| `acceptance-tests.md` | Test | One acceptance test per AC, designed from the spec by the Test Engineer | `scripts/trace-check.mjs` |
| `pr-body.md` | Test | Verification rows bound to the fingerprint, Trace table, Review triage, GO | `scripts/dod-gate.mjs`, `scripts/approval-check.mjs` |
| `release-notes.md` | Release | AC list, rollout 10% → 100%, rollback rehearsal output | `scripts/trace-check.mjs` |
| `ops.md` | Operate | Production record: alert status, indicator readings | `scripts/status.mjs` |
| `retro.md` | Operate | Retro within 5 business days, actions with owners | `scripts/metrics.mjs` |

Each file is complete when its checker exits 0 on it.
