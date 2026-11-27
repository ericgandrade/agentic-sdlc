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
│   ├── retros/YYYY-MM-DD.md
│   └── reviews/<issue>.md             # Quick review record without a PR host
├── specs/NNN-<slug>/                  # one folder per Standard/Full work item
│   ├── spec.md                        # AC-n, non-goals, security notes, release & observability, approvals
│   ├── approvals.md                   # approval register: requests, answers, exact words (read by spec-lint)
│   ├── threat-model.md                # Full path; risk-flagged Standard items (read by spec-lint)
│   ├── plan.md                        # tasks, impact, dependencies, loop ledger, approvals
│   ├── graph.json                     # written by plan-graph --write
│   ├── acceptance-tests.md            # AC-n → test id, designed from the spec only
│   ├── run-ledger.jsonl               # run ledger archived by run-ledger finish
│   ├── handoff.md                     # stage hand-off / resume pointer
│   ├── review.md                      # review record without a PR host (pr-body sections, Test sign-off)
│   ├── trace.md                       # † written by trace-check
│   └── ops.md                         # † indicator readings and incidents after release
└── .agentic-sdlc/
    ├── bin/  VERSION  SHA256SUMS      # vendored scripts (project-context setup)
    ├── config.json                    # project overrides (budgets read by run-ledger); never touched by upgrades
    ├── runs/<id>/                     # run-ledger + preflight: ledger.jsonl, preflight.json, result.json
    ├── runs/preflight.json            # preflight without --run
    ├── evidence/ledger.jsonl          # † fingerprint-bound evidence records (evidence)
    ├── metrics/history.jsonl          # † (metrics)
    └── doctor.json                    # doctor
../<repo>-sdlc-<id>/                   # unattended run worktree on branch sdlc/NNN-<id> (run-ledger start)
```

† = written by a script added in a later release (§Later-release files).

Quick-path items create no `specs/` folder: the issue holds the acceptance test and the PR holds the evidence.

## Artifact table

| Artifact | Location | Template | Created in · by | Required on | Validated by |
|---|---|---|---|---|---|
| AGENTS.md block + `sdlc-dod` | project root | §AGENTS.md block below | Discover · `project-context` | all paths | `preflight` (baseline-dod), `run-ledger start`; `doctor` |
| Issue with acceptance test | tracker; no tracker → `docs/issues/NNNN-slug.md` | — (Given/When/Then in the issue body) | Discover · Analyst | Quick | Reviewer lens L1 |
| Out-of-scope record | `docs/out-of-scope/<slug>.md` | `issue-triage` skill, references/templates.md | Discover · Analyst; Product Owner decides | when a request is declined | duplicate search (`issue-triage`) |
| Discovery brief | `specs/NNN-slug/brief.md`; Quick → issue comment | skill `brainstorming`, templates/brief.md | Discover · Analyst | when `brainstorming` runs | Analyst input to Specify |
| `spec.md` | `specs/NNN-slug/` | `templates/spec.md` | Specify · Analyst | Standard, Full | `spec-lint` |
| Capability map (epics) | epic issue body; no tracker → `docs/issues/NNNN-slug.md` | skill `spec-driven-development`, references/capability-map.md | Specify · Analyst; Product Owner orders | request splits into separately shippable capabilities | Specify sign-off on each child spec |
| Adoption ledger | `.agentic-sdlc/adoption.md` | skill `project-context`, templates/adoption.md | Discover · `project-context` (adopt mode); Tech Lead approves | adopted repositories | `project-context audit` |
| Modernization inventory | `docs/modernization/inventory.md` | skill `codebase-modernization` | Discover · Analyst with Architect | brownfield modernization | Tech Lead review of dispositions |
| `current-state.md` + CHAR register | `specs/NNN-slug/` | `codebase-modernization` templates/current-state.md | Specify · Analyst, Test Engineer | brownfield change to untested code | characterization tests green before Build |
| `migration-runbook.md` | `specs/NNN-slug/` | `codebase-modernization` templates/migration-runbook.md | Design · Release Engineer | data or platform migration | Release Owner sign-off |
| Approval register `approvals.md` | `specs/NNN-slug/` | `references/governance.md` §3 | Specify, Design · Analyst, Planner | Standard, Full | `spec-lint --check-approval` (AP07) |
| `threat-model.md` | `specs/NNN-slug/` | `templates/threat-model.md` | Specify · Security Auditor | Full; risk-flagged Standard | `spec-lint`: TM01 error on Full, TM02 warning on risk-flagged Standard, TM03 high threat without AC |
| PM brief | issue or intake record; `specs/NNN-slug/pm-brief.md` when no tracker | — (problem, evidence, outcome, indicator, priority, non-goals) | Discover · Product Manager | Product Manager trigger (`references/agents.md` §Triggers) | Analyst; Specify sign-off evidence |
| `ux.md` | `specs/NNN-slug/` | `templates/ux.md` | Specify · UX Designer | a user-facing surface changes | Specify sign-off evidence; Test Engineer state mapping; UX checks at Test |
| Impediment log `impediments.md` | `specs/NNN-slug/` | — (`IMP-n` · blocker · owner · raised · unblock condition · status) | any stage · Scrum Master | when an agent reports `BLOCKED` or `NEEDS_CONTEXT` | Scrum Master review every 2 business days |
| ADR | `docs/adr/NNNN-slug.md` | §ADR below | Design · Architect | Full; Standard when a decision is expensive to reverse | Reviewer lens L2 |
| `plan.md` | `specs/NNN-slug/` | `templates/plan.md` | Design · Planner | Standard, Full | `plan-graph` |
| `graph.json` | `specs/NNN-slug/` | generated | Design · `plan-graph --write` | Standard, Full | `plan-graph --check` |
| `codemap.md` | `docs/` | `templates/codemap.md` | Discover (adoption) · `project-context` | brownfield repos | `doctor` (age ≤ 90 days) |
| `acceptance-tests.md` | `specs/NNN-slug/` | `templates/acceptance-tests.md` | after Design sign-off · Test Engineer | Standard, Full | `trace-check`† |
| PR body (review record) | pull request; no PR host → `specs/NNN-slug/review.md` (Quick: `docs/reviews/<issue>.md`) | `templates/pr-body.md` | Build · Developer; Test · Reviewer | all paths | `approval-check --pr`†, `trace-check`† |
| Run ledger | `.agentic-sdlc/runs/<id>/ledger.jsonl`; archived to `specs/NNN-slug/run-ledger.jsonl` | generated | Build · `run-ledger start` … `finish` | every `executing-plans` run | `run-ledger status`, `check` |
| Preflight record | `.agentic-sdlc/runs/<id>/preflight.json` | generated | Build · `preflight` | every `executing-plans` run | `preflight` exit code |
| Run worktree | `../<repo>-sdlc-<id>` on `sdlc/NNN-<id>` | generated | Build · `run-ledger start --mode unattended` | unattended runs | `preflight` (isolation) |
| Project config | `.agentic-sdlc/config.json` | — (`budgets` keys, `references/autonomous.md` §4) | Discover · `project-context` | when budgets differ from the defaults | `run-ledger start` |
| Evidence ledger | `.agentic-sdlc/evidence/ledger.jsonl` | generated | Build, Test · `evidence record`† | all paths | `evidence check`† |
| Release notes | release / `CHANGELOG.md`; neither → `specs/NNN-slug/release-notes.md` (Quick: `docs/releases/<issue>.md`) | `templates/release-notes.md` | Release · Release Engineer | production releases | release checklist |
| Runbook | `docs/runbooks/<service>.md` | `templates/runbook.md` | Release · Release Engineer | operated behaviour changes; always on Full | Release NO-GO when "last verified" > 90 days |
| Ops record | `specs/NNN-slug/ops.md` | `templates/ops-record.md` | Operate · SRE | released Standard/Full items | `trace-check`† (reading ≤ 14 days) |
| Postmortem | `docs/postmortems/` | `templates/postmortem.md` | Operate · SRE | SEV1/SEV2 incidents | due ≤ 5 business days |
| Retro record | `docs/retros/` | `templates/retro.md` | Operate · Scrum Master + SRE | all paths (Quick batched) | `status.mjs` (missing retro) |
| Handoff | `specs/NNN-slug/handoff.md` | `references/phase-boundaries.md` §Handoff | any stage end | when context is cleared or work changes hands | Step 0 state detection |
| `CONSTRAINTS.md` | project root | §CONSTRAINTS.md below | Discover · `project-context` | Full | Reviewer lens L2 |
| `GLOSSARY.md` | project root | — (term · definition · source) | Specify · `grill-me` | when Specify defines ≥ 1 domain term | Reviewer lens L1 |

A template listed above that is absent in the installed version → use the section list in `references/lifecycle.md` §1 for that artifact and record `template missing: <path>` in the PR body.

## Later-release files

Planned files, marked † where other files name them. The router Module Index lists only shipped files. No shipped script reads these. Until one exists, apply its manual fallback and record `module missing: <path>` in the PR body when a step names it. Target versions come from the improvement plan (`docs/plans/2026-11-27-agentic-sdlc-improvement-plan.md` in the repository) and may move after the pilot.

| File | Target | Purpose | Manual fallback |
|---|---|---|---|
| `scripts/path-score.mjs`† | v3.3.0 | Path score | `references/paths.md` §Score rubric by hand |
| `scripts/evidence.mjs`† | v3.2.0 | Evidence ledger | Paste command, exit code and fingerprint into the PR Verification table (`references/verification.md`) |
| `scripts/trace-check.mjs`† | v3.2.0 | Trace table, `trace.md`, ops reading age | Fill the PR Trace table: every AC has ≥ 1 task, commit and passing test (`references/verification.md` §Trace) |
| `scripts/approval-check.mjs`† | v3.2.0 | Test sign-off binding in CI | `spec-lint --check-approval` and `plan-graph --check-approval`; the human checks the Test sign-off: the PR review, or without a PR host the `## Test sign-off` row of the review record (`references/governance.md`) |
| `scripts/audit-export.mjs`† | v3.2.0 | Audit bundle | Zip `specs/NNN-slug/` with the PR body and release notes |
| `scripts/metrics.mjs`† | v3.3.0 | Retro metrics history | Compute lead time and loop rounds from git and `run-ledger status` (`references/retrospective.md`) |
| `references/faq.md`† | unscheduled | Troubleshooting | `project-context audit`; `status.mjs --topic blocked` |
| `references/standards-mapping.md`† | unscheduled | Standards mapping (SSDF practices: skill `security-hardening`, `references/ssdf-mapping.md`) | Control mapping in `references/security.md` and `references/governance.md` |
| `examples/paths/`† | v3.3.0 | Path examples | `references/paths.md` examples |

## Naming and numbering

- Spec folders: `NNN` = 3 digits, next free number in `specs/`; slug = 2–5 kebab-case words (`001-csv-export`).
- IDs: `AC-1..n` per spec (unique, contiguous); `T1..n` per plan; `CHAR-n` for characterization tests; ADR `NNNN` 4 digits.
- Commit trailer: `Refs: T3 AC-2` (space-separated IDs). The bracket form `[T3, AC-2]` in the subject is also parsed.
- Test names contain the AC ID they prove: `AC-2 rejects formula prefixes`. AC IDs are local to one spec or issue, so a command that selects one AC ends the ID with a non-digit lookahead (`--test-name-pattern="AC-2(?![0-9])"`, `-t "AC-2(?![0-9])"`: `AC-2` alone also matches `AC-20`), and a run that selects 0 tests is a failure, not a pass and is scoped to that item's test files (the `File` column of `acceptance-tests.md`; Quick: the files the PR adds). Quick test names add the issue: `#142 AC-1 trims the price`, selected with `--test-name-pattern="#142 AC-1(?![0-9])"`. Standard and Full test names start with the AC ID (`references/tdd.md` §2), so a Standard filter anchors it: `^AC-2(?![0-9])`; the anchor also excludes Quick tests, which start with `#<issue>`, in a shared file.

## AGENTS.md block

The block is the project context every agent reads first. `project-context` writes it; the `sdlc-dod` fenced block is required on every path.

````markdown
<!-- AGENTIC-SDLC:BEGIN -->
## Agentic SDLC
- Artifacts: `specs/NNN-slug/` · ADRs: `docs/adr/` · Code map: `docs/codemap.md`
- Conventions: branch `feat/NNN-slug` (Quick: `fix/<issue>-<slug>`); commit trailer `Refs: Tn AC-n`
- Enforcement: branch-protection | prompt-only · permissions: enforced | prompt-only

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

Rules for `sdlc-dod`: one `key: command` per line; keys `lint`, `typecheck`, `test`, `coverage`, `coverage_min`; a key with no command in the project is written as `<key>: n/a — <reason>`. `coverage_min` defaults to the coverage measured at adoption and is never lowered; a higher measured value becomes the new floor. Missing block → `preflight` and `run-ledger start` exit 2, `doctor` FAIL, `dod-gate` exit 2.

## ADR

Write an ADR when a decision is expensive to reverse (data model, public interface, framework, deployment topology) or when ≥ 2 options were seriously compared. Sections: `Status` (Proposed → Accepted at Design sign-off → Superseded by NNNN, or Deprecated when the decision no longer applies) · `Date` · `Related` (spec ID, AC-n) · `Context` · `Decision` · `Options considered` (option · pros · cons) · `Consequences` (one-way or two-way door). An ADR still `Proposed` after Design sign-off → Reviewer lens L2 Important finding.

## CONSTRAINTS.md (Full path)

Sections: `Floor` (always enforced: no new suppression comments, no skipped tests without a reason, no secrets, this file is not weakened to make a change pass) · `Enforced with numbers` (dimension · rule · exact command · runs at) · `Ratchets` (metric · today · direction) · `Exceptions` (rule · path · reason · owner · expiry ≤ 30 days). Loosening any rule requires an ADR and Design sign-off. A diff that weakens the file without both → Critical finding.

## What no longer exists

Earlier drafts used separate checkpoint, verification and traceability files and uppercase file names. They are not part of the method: approvals live in `## Approvals` sections, the PR review and the release notes; verification and trace live in the PR body and the evidence ledger.
