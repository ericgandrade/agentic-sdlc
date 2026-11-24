# Agentic SDLC — Artifact Index

This file is an index. The structure of each artifact lives in exactly one template under `templates/`; this index says where each artifact goes in the project, which stage creates it, on which paths it is required and which check validates it. Templates are never copied into this file.

## Step 0 — Discover existing conventions

Before creating any artifact, search the project:

1. `specs/*/spec.md` (Spec Kit / this method), `.kiro/specs/*/requirements.md` (Kiro), `openspec/changes/*/proposal.md` (OpenSpec), `docs/adr/`, `adr/`, `docs/decisions/`.
2. The AGENTS.md or CLAUDE.md block between `<!-- AGENTIC-SDLC:BEGIN -->` and `<!-- AGENTIC-SDLC:END -->`.

Decision rule: 1 existing convention found → map the artifacts below onto it and record the mapping in the AGENTS.md block (`Artifacts: <path pattern>`). 2 or more found → ask the user which one is authoritative; record the answer. None found → use the default layout. Failure: a convention that lacks a required section (for example no Approvals section) → add the section to the existing file instead of creating a parallel file.

## Default layout

```
<project>/
├── AGENTS.md / CLAUDE.md              # AGENTIC-SDLC block: commands, conventions, Definition of Done (sdlc-dod), pitfalls
├── CONSTRAINTS.md                     # Full path only: quality floor, enforced checks, ratchets, exceptions
├── docs/
│   ├── adr/NNNN-<slug>.md             # architecture decision records
│   ├── codemap.md                     # module → paths → depends_on → tests
│   ├── postmortems/YYYY-MM-DD-<slug>.md
│   ├── runbooks/<service>.md
│   └── retros/YYYY-MM-DD.md
├── specs/NNN-<slug>/                  # one folder per Standard/Full work item
│   ├── spec.md                        # AC-n, non-goals, security notes, release & observability, approvals
│   ├── approvals.md                   # approval register: requests, answers, exact words (read by spec-lint)
│   ├── threat-model.md                # Full path; risk-flagged Standard items (read by spec-lint)
│   ├── plan.md                        # tasks, impact, dependencies, loop ledger, approvals
│   ├── graph.json                     # written by plan-graph --write
│   ├── acceptance-tests.md            # AC-n → test id, designed from the spec only
│   ├── run-ledger.jsonl               # run ledger archived by run-ledger finish
│   ├── handoff.md                     # stage hand-off / resume pointer
│   ├── trace.md                       # † written by trace-check
│   └── ops.md                         # † indicator readings and incidents after release
└── .agentic-sdlc/
    ├── bin/  VERSION  SHA256SUMS      # vendored scripts (project-context setup)
    ├── config.json                    # project overrides (budgets read by run-ledger); never touched by upgrades
    ├── runs/<id>/                     # run-ledger + preflight: ledger.jsonl, preflight.json, result.json
    ├── runs/preflight.json            # preflight without --run
    ├── evidence/ledger.jsonl          # † fingerprint-bound evidence records (evidence)
    ├── loops.jsonl                    # † loop ledger, machine form (loop-ledger)
    ├── metrics/history.jsonl          # † (metrics)
    └── doctor.json                    # † (doctor)
../<repo>-sdlc-<id>/                   # unattended run worktree on branch sdlc/NNN-<id> (run-ledger start)
```

† = written by a script added in a later release (§Later-release files).

Quick-path items create no `specs/` folder: the issue holds the acceptance test and the PR holds the evidence.

## Artifact table

| Artifact | Location | Template | Created in · by | Required on | Validated by |
|---|---|---|---|---|---|
| AGENTS.md block + `sdlc-dod` | project root | §AGENTS.md block below | Discover · `project-context` | all paths | `preflight` (baseline-dod), `run-ledger start`; `doctor`† |
| Issue with acceptance test | tracker; no tracker → `docs/issues/NNNN-slug.md` | — (Given/When/Then in the issue body) | Discover · Analyst | Quick | Reviewer lens L1 |
| Out-of-scope record | `docs/out-of-scope/<slug>.md` | `issue-triage` skill, references/templates.md | Discover · Analyst; Product Owner decides | when a request is declined | duplicate search (`issue-triage`) |
| `spec.md` | `specs/NNN-slug/` | `templates/spec.md` | Specify · Analyst | Standard, Full | `spec-lint` |
| Approval register `approvals.md` | `specs/NNN-slug/` | `references/governance.md` §3 | Specify, Design · Analyst, Planner | Standard, Full | `spec-lint --check-approval` (AP07) |
| `threat-model.md` | `specs/NNN-slug/` | `templates/threat-model.md`† | Specify · Security Auditor | Full; risk-flagged Standard | `spec-lint`: TM01 error on Full, TM02 warning on risk-flagged Standard, TM03 high threat without AC |
| PM brief | issue or intake record; `specs/NNN-slug/pm-brief.md` when no tracker | — (problem, evidence, outcome, indicator, priority, non-goals) | Discover · Product Manager | Product Manager trigger (`references/agents.md` §Triggers) | Analyst; Specify sign-off evidence |
| `ux.md` | `specs/NNN-slug/` | `templates/ux.md` | Specify · UX Designer | a user-facing surface changes | Specify sign-off evidence; Test Engineer state mapping; UX checks at Test |
| Impediment log `impediments.md` | `specs/NNN-slug/` | — (`IMP-n` · blocker · owner · raised · unblock condition · status) | any stage · Scrum Master | when an agent reports `BLOCKED` or `NEEDS_CONTEXT` | Scrum Master review every 2 business days |
| ADR | `docs/adr/NNNN-slug.md` | §ADR below | Design · Architect | Full; Standard when a decision is expensive to reverse | Reviewer lens L2 |
| `plan.md` | `specs/NNN-slug/` | `templates/plan.md` | Design · Planner | Standard, Full | `plan-graph` |
| `graph.json` | `specs/NNN-slug/` | generated | Design · `plan-graph --write` | Standard, Full | `plan-graph --check` |
| `codemap.md` | `docs/` | `templates/codemap.md` | Discover (adoption) · `project-context` | brownfield repos | `doctor`† (age ≤ 90 days, every top-level dir mapped) |
| `acceptance-tests.md` | `specs/NNN-slug/` | `templates/acceptance-tests.md` | after Design sign-off · Test Engineer | Standard, Full | `trace-check`† |
| PR body | pull request | `templates/pr-body.md` | Build · Developer; Test · Reviewer | all paths | `approval-check --pr`†, `trace-check`† |
| Run ledger | `.agentic-sdlc/runs/<id>/ledger.jsonl`; archived to `specs/NNN-slug/run-ledger.jsonl` | generated | Build · `run-ledger start` … `finish` | every `executing-plans` run | `run-ledger status`, `check` |
| Preflight record | `.agentic-sdlc/runs/<id>/preflight.json` | generated | Build · `preflight` | every `executing-plans` run | `preflight` exit code |
| Run worktree | `../<repo>-sdlc-<id>` on `sdlc/NNN-<id>` | generated | Build · `run-ledger start --mode unattended` | unattended runs | `preflight` (isolation) |
| Project config | `.agentic-sdlc/config.json` | — (`budgets` keys, `references/autonomous.md` §4) | Discover · `project-context` | when budgets differ from the defaults | `run-ledger start` |
| Evidence ledger | `.agentic-sdlc/evidence/ledger.jsonl` | generated | Build, Test · `evidence record`† | all paths | `evidence check`† |
| Release notes | release / `CHANGELOG.md` | `templates/release-notes.md` | Release · Release Engineer | production releases | release checklist |
| Runbook | `docs/runbooks/<service>.md` | `templates/runbook.md`† | Release · Release Engineer | operated behaviour changes; always on Full | Release NO-GO when "last verified" > 90 days |
| Ops record | `specs/NNN-slug/ops.md` | `templates/ops-record.md`† | Operate · SRE | released Standard/Full items | `trace-check`† (reading ≤ 14 days) |
| Postmortem | `docs/postmortems/` | `templates/postmortem.md`† | Operate · SRE | SEV1/SEV2 incidents | due ≤ 5 business days |
| Retro record | `docs/retros/` | `templates/retro.md` | Operate · Scrum Master + SRE | all paths (Quick batched) | `status.mjs`† overdue check |
| Handoff | `specs/NNN-slug/handoff.md` | `references/phase-boundaries.md` §Handoff | any stage end | when context is cleared or work changes hands | Step 0 state detection |
| `CONSTRAINTS.md` | project root | §CONSTRAINTS.md below | Discover · `project-context` | Full | Reviewer lens L2 |
| `GLOSSARY.md` | project root | — (term · definition · source) | Specify · `grill-me` | when Specify defines ≥ 1 domain term | Reviewer lens L1 |

A template listed above that is absent in the installed version → use the section list in `references/lifecycle.md` §1 for that artifact and record `template missing: <path>` in the PR body.

## Later-release files

The router Module Index and other files name the files below; they are added in a later release and marked †. No Batch-1 script reads them. Until they exist, apply the manual fallback; record `module missing: <path>` in the PR body when a step names one.

| File | Purpose | Manual fallback |
|---|---|---|
| `scripts/status.mjs`† | Step 0 state table | Apply the router Step 0 table by reading the files |
| `scripts/doctor.mjs`† | Setup check (`doctor.json`) | Check the AGENTS.md block, the `sdlc-dod` commands (`preflight` baseline-dod) and the code map date by hand |
| `scripts/path-score.mjs`† | Path score | `references/paths.md` §Score rubric by hand |
| `scripts/evidence.mjs`† | Evidence ledger | Paste command, exit code and fingerprint into the PR Verification table (`references/verification.md`) |
| `scripts/trace-check.mjs`† | Trace table, `trace.md`, ops reading age | Fill the PR Trace table: every AC has ≥ 1 task, commit and passing test (`references/verification.md` §Trace) |
| `scripts/dod-gate.mjs`† | Definition of Done gate | Run every `sdlc-dod` command and paste each exit code; `preflight` runs the same commands as baseline-dod |
| `scripts/approval-check.mjs`† | Test sign-off binding in CI | `spec-lint --check-approval` and `plan-graph --check-approval`; the human checks the Test sign-off row (`references/governance.md`) |
| `scripts/audit-export.mjs`† | Audit bundle | Zip `specs/NNN-slug/` with the PR body and release notes |
| `scripts/loop-ledger.mjs`† | Loop ledger, machine form | `run-ledger round` and `run-ledger render` (`references/loops.md`) |
| `scripts/ext-check.mjs`† | Extension validation | No extensions are loaded until it exists |
| `scripts/metrics.mjs`† | Retro metrics history | Compute lead time and loop rounds from git and `run-ledger status` (`references/retrospective.md`) |
| `references/faq.md`†, `upgrading.md`† | Troubleshooting; upgrades | `project-context audit`; re-run `project-context` setup |
| `references/adoption.md`†, `brownfield.md`† | Team rollout; untested code | `project-context` and `templates/codemap.md`; characterization tests per `references/tdd.md` |
| `references/extension-interface.md`† | Extensions | No extensions are loaded until it exists |
| `references/standards-mapping.md`†, `ssdf-mapping.md`† | Standards and SSDF mapping | Control mapping in `references/security.md` and `references/governance.md` |
| `templates/threat-model.md`† | Threat model | One table with `Threat`, `STRIDE`, `Rating`, `Mitigation` columns (`agents/security-auditor.md`) |
| `templates/ops-record.md`† | Operate record `ops.md` | Indicator reading and incident count in the retro §Facts (`templates/retro.md`) |
| `templates/postmortem.md`† | SEV1/SEV2 postmortem | Sections in `references/release-ops.md` §Incidents |
| `templates/runbook.md`† | Runbook | Sections in `references/release-ops.md` §Runbook |
| `templates/ci/agentic-sdlc.yml`†, `ci/gitlab-ci.yml`†, `ci/security.yml`†, `CODEOWNERS`† | CI and enforcement setup | Run the gates locally and paste the output; `references/platforms.md` §3 rows 5–6 |
| `examples/paths/`†, `examples/extensions/`† | Path and extension examples | `references/paths.md` examples; `examples/worked-example/` |
| `docs/guides/agentic-sdlc.md`† (skills repository) | Long-form guide, word budget checked by `budget-check --guide` | Run `budget-check` without `--guide` |

## Naming and numbering

- Spec folders: `NNN` = 3 digits, next free number in `specs/`; slug = 2–5 kebab-case words (`001-csv-export`).
- IDs: `AC-1..n` per spec (unique, contiguous); `T1..n` per plan; `CHAR-n` for characterization tests; ADR `NNNN` 4 digits.
- Commit trailer: `Refs: T3 AC-2` (space-separated IDs). The bracket form `[T3, AC-2]` in the subject is also parsed.
- Test names contain the AC ID they prove: `AC-2 rejects formula prefixes`.

## AGENTS.md block

The block is the project context every agent reads first. `project-context` writes it; the `sdlc-dod` fenced block is required on every path.

````markdown
<!-- AGENTIC-SDLC:BEGIN -->
## Agentic SDLC
- Artifacts: `specs/NNN-slug/` · ADRs: `docs/adr/` · Code map: `docs/codemap.md`
- Conventions: branch `feat/NNN-slug`; commit trailer `Refs: Tn AC-n`
- Enforcement: branch-protection | prompt-only

## Definition of Done
```sdlc-dod
lint: npm run lint
typecheck: npm run typecheck
test: npm test
coverage: npm run coverage -- --json-summary
coverage_min: 78.4
```

## Pitfalls (observed agent mistakes)
- 2026-11-02 — mocked the database in an integration test → use the test container
<!-- AGENTIC-SDLC:END -->
````

Rules for `sdlc-dod`: one `key: command` per line; keys `lint`, `typecheck`, `test`, `coverage`, `coverage_min`; a key with no command in the project is written as `<key>: n/a — <reason>`. `coverage_min` defaults to the coverage measured at adoption and is never lowered; a higher measured value becomes the new floor. Missing block → `preflight` and `run-ledger start` exit 2 (`dod-gate`† exit 2 and `doctor`† FAIL once added).

## ADR

Write an ADR when a decision is expensive to reverse (data model, public interface, framework, deployment topology) or when ≥ 2 options were seriously compared. Sections: `Status` (Proposed → Accepted at Design sign-off → Superseded by NNNN) · `Date` · `Related` (spec ID, AC-n) · `Context` · `Decision` · `Options considered` (option · pros · cons) · `Consequences` (one-way or two-way door). An ADR still `Proposed` after Design sign-off → Reviewer lens L2 Important finding.

## CONSTRAINTS.md (Full path)

Sections: `Floor` (always enforced: no new suppression comments, no skipped tests without a reason, no secrets, this file is not weakened to make a change pass) · `Enforced with numbers` (dimension · rule · exact command · runs at) · `Ratchets` (metric · today · direction) · `Exceptions` (rule · path · reason · owner · expiry ≤ 30 days). Loosening any rule requires an ADR and Design sign-off. A diff that weakens the file without both → Critical finding.

## What no longer exists

Earlier drafts used separate checkpoint, verification and traceability files and uppercase file names. They are not part of the method: approvals live in `## Approvals` sections, the PR review and the release notes; verification and trace live in the PR body and the evidence ledger.
