# Agentic SDLC — Mechanism matrix (bill of materials)

**Phase A.2 of** `docs/plans/2026-11-20-agentic-sdlc-execution-plan.md` · **Date:** 2026-11-24 · **Status:** living document; update the Status column when a mechanism lands.

## How to read

- **Mechanism IDs** `n.m` are the rows of `docs/research/gap-closure/architect-report.md` §2 (criterion `n`, mechanism `m`). That report holds the full rule, trigger, output and failure behaviour of each row, and its precedents name the framework inventory IDs (`docs/research/inventory/*.md`).
- **Artifact** paths are relative to `skills/agentic-sdlc/` unless they start with `skills/<other>/`.
- **Tier:** T1 = minimal set scored in round 2 (RA 88.5); T2 = stretch set; T3 = options.
- **Status:**
  - `built`: the artifact exists in the tree;
  - `†`: a script deferred to a later release, with a manual fallback in `references/artifacts.md` §Later-release files;
  - `missing`: not built yet.
- **Owner skill:** the execution-plan task (B.n, C.n, D.n) whose skill carries the full workflow for that mechanism. Under decision D12, the `agentic-sdlc` module remains the compact stage contract. Unmapped rows belong to the router (B.1).

## Summary (2026-11-24, before Phases B–D)

| Status | Mechanisms |
|---|---|
| built | 53 |
| † later release (manual fallback) | 10 |
| missing (all T2) | 15 |
| **Total** | **78** |

Every T1 mechanism is built or has a documented manual fallback. The missing T2 rows are assigned to the new stage skills (for example 3.4 → `deployment-pipeline`, 12.4 → `operations-and-incidents`, 11.4/11.6 → `security-hardening`, 14.4 → `codebase-modernization`) or remain router work for a later release.

## Matrix

| ID | Mechanism | Artifact | Tier | Status | Owner skill |
|---|---|---|---|---|---|
| 1.1 | Quickstart | `references/quickstart.md` | T1 | built | B.1 `agentic-sdlc` |
| 1.2 | State-aware next step | Router `SKILL.md` Step 0 + `scripts/status.mjs` | T2 | † later release (manual fallback in `references/artifacts.md`) | B.1 `agentic-sdlc` |
| 1.3 | FAQ / troubleshooting | `references/faq.md` | T2 | missing: references/faq.md | B.1 `agentic-sdlc` |
| 1.4 | Off-first-path rule | Router `SKILL.md` "Advanced" section | T2 | built | B.1 `agentic-sdlc` |
| 1.5 | Doctor | `scripts/doctor.mjs` | T2 | † later release (manual fallback in `references/artifacts.md`) | B.1 `agentic-sdlc` |
| 1.6 | Upgrade notes | `references/upgrading.md` | T2 | missing: references/upgrading.md | B.1 `agentic-sdlc` |
| 2.1 | Spec template (D10 vocabulary) | `templates/spec.md` | T1 | built | B.6 `spec-driven-development` |
| 2.2 | Spec lint | `scripts/spec-lint.mjs` | T1 | built | B.6 `spec-driven-development` |
| 2.3 | Revision hash + re-open rule | `templates/spec.md` `## Approvals`; `references/governance.md` | T1 | built | B.6 `spec-driven-development` |
| 2.4 | Independent critique + stop rule | `skills/spec-driven-development/SKILL.md` Step 5; `skills/grill-me/` | T1 | built | B.4 `brainstorming`, B.5 `grill-me`, B.6 `spec-driven-development` |
| 3.1 | TDD module | `references/tdd.md`, loaded by `executing-plans` for each task | T1 | built | C.1 `test-driven-development` |
| 3.2 | Anti-pattern catalogue + rationalization table | `references/tdd.md` §Anti-patterns (≥ 10: testing mocks, assertion-free tests, sleeping, order dependence, etc.) and §Rationalizations (≥ 12 rows "thought → reality") | T1 | built | C.1 `test-driven-development` |
| 3.3 | DoD gate | `scripts/dod-gate.mjs`; AGENTS.md `## Definition of Done` fenced block `sdlc-dod` (lint, typecheck, test, coverage commands + `coverage_min`, default = baseline measured at adoption, never lowered) | T2 | † later release (manual fallback in `references/artifacts.md`) | B.3 `project-context`, D.2 `verification-gate` |
| 3.4 | CI template | `templates/ci/agentic-sdlc.yml` (GitHub Actions; GitLab variant `templates/ci/gitlab-ci.yml`) | T2 | missing: templates/ci/agentic-sdlc.yml, templates/ci/gitlab-ci.yml | D.5 `deployment-pipeline` |
| 4.1 | Verification gate | `references/verification.md`; `agents/reviewer.md` | T1 | built | D.2 `verification-gate` |
| 4.2 | Independent test design | `agents/test-engineer.md` | T1 | built | D.1 `test-strategy` |
| 4.3 | CANNOT_VERIFY | `references/verification.md` | T1 | built | D.2 `verification-gate` |
| 4.4 | Fingerprint-bound evidence + staleness | `scripts/evidence.mjs record | T1 | built | D.2 `verification-gate` |
| 5.5 | Triage log | `templates/pr-body.md` `## Review triage` (ID · lens · sev · file:line · disposition · evidence) | T2 | built | D.3 `multi-axis-code-review` |
| 5.6 | Calibration | L4 context-free lens (5.1) + default NO-GO (5.3) | T2 | built | D.3 `multi-axis-code-review` |
| 5.7 | Human review guide | `templates/pr-body.md` `## Review guide` | T2 | built | D.3 `multi-axis-code-review`, D.6 `shipping-and-handover` |
| 6.1 | Loop catalogue | `references/loops.md` | T1 | built | C.2 `executing-plans`, C.3 `systematic-debugging` |
| 6.2 | Root-cause routing | `references/loops.md` §Routing | T1 | built | C.2 `executing-plans`, C.3 `systematic-debugging` |
| 6.3 | Ledger (state carried) | T1: `specs/NNN/plan.md` `## Loop ledger` table. T2: `scripts/loop-ledger.mjs` writes `.agentic-sdlc/loops.jsonl` and renders the table | T1 | † later release (manual fallback in `references/artifacts.md`) | C.2 `executing-plans` |
| 6.4 | Scoped re-check | `references/loops.md` | T1 | built | C.2 `executing-plans` |
| 6.5 | Anti-thrash | same | T1 | built | C.2 `executing-plans`, C.3 `systematic-debugging` |
| 6.6 | Enforced bounds | `scripts/loop-ledger.mjs next` | T2 | † later release (manual fallback in `references/artifacts.md`) | C.2 `executing-plans` |
| 7.1 | Task table schema | `templates/plan.md` `## Tasks` (ID · title · AC · Blocked by · Files · Size ≤ 1 day) | T1 | built | B.8 `writing-plans` |
| 7.2 | Plan graph | `scripts/plan-graph.mjs` | T1 | built | B.8 `writing-plans` |
| 7.3 | Code map | `templates/codemap.md` (fenced YAML: module → paths → depends_on → tests) produced by `project-context` adopt mode | T1 | built | B.3 `project-context`, B.7 `senior-solution-architect`, C.4 `codebase-modernization` |
| 7.4 | Frontier dispatch + integration | `skills/executing-plans/SKILL.md` §Parallel | T2 | built | C.2 `executing-plans` |
| 7.5 | Impact analysis from the map | `skills/writing-plans/SKILL.md` §Impact; used by 6.4 and 14.4 | T2 | built | B.7 `senior-solution-architect`, B.8 `writing-plans` |
| 7.6 | Map kept current (T3) | `scripts/codemap.mjs --check` in CI | T3 | † later release (manual fallback in `references/artifacts.md`) | B.1 `agentic-sdlc` |
| 8.1 | Unattended mode | `references/autonomous.md` | T1 | built | C.2 `executing-plans` |
| 8.2 | Preflight | `scripts/preflight.mjs` | T1 | built | C.2 `executing-plans` |
| 8.3 | Isolation | same | T1 | built | C.2 `executing-plans` |
| 8.4 | Halt list | `references/autonomous.md` §Halts | T1 | built | C.2 `executing-plans` |
| 8.5 | Resumable run ledger | `scripts/run-ledger.mjs` → `.agentic-sdlc/runs/<id>/ledger.jsonl` | T1 | built | C.2 `executing-plans` |
| 8.6 | Authority limits | `agents/*.md` "Never" + `references/autonomous.md` | T2 | built | C.2 `executing-plans` |
| 8.7 | Budgets | run-ledger config | T2 | built | C.2 `executing-plans` |
| 8.8 | Run result | `.agentic-sdlc/runs/<id>/result.json` `{status: DONE \ | T2 | built | C.2 `executing-plans` |
| 9.1 | ID chain | Templates: spec (AC-n), plan (T-n with AC), commit trailer `Refs: T3 AC-2`, test names containing `AC-n`, PR Verification table, release notes `AC-n` list | T1 | built | B.8 `writing-plans` |
| 9.2 | Two-way gap analysis | `references/verification.md` §Trace | T1 | built | D.1 `test-strategy` |
| 9.3 | Trace check | `scripts/trace-check.mjs` | T2 | † later release (manual fallback in `references/artifacts.md`) | D.2 `verification-gate` |
| 9.4 | Production links | `templates/ops-record.md` (indicator readings and incidents with an `AC-n` / spec ID field); the trace check reads `specs/NNN/ops.md` | T2 | missing: templates/ops-record.md | D.6 `shipping-and-handover`, D.7 `operations-and-incidents` |
| 10.1 | Approval records | `references/governance.md`; `## Approvals` in spec.md/plan.md; PR review; release notes | T1 | built | B.1 `agentic-sdlc` |
| 10.2 | Risk-scaled depth | `references/paths.md` | T1 | built | B.1 `agentic-sdlc` |
| 10.3 | Waivers | `references/governance.md` §Waivers | T1 | built | B.1 `agentic-sdlc` |
| 10.4 | CI approval check | `scripts/approval-check.mjs` in CI `agentic-sdlc/approvals` | T2 | missing: scripts/approval-check.mjs, agentic-sdlc/approvals | D.5 `deployment-pipeline` |
| 10.5 | Platform enforcement | `templates/CODEOWNERS` (`specs/** @tech-leads @product-owners`), `references/governance.md` §Enforcement with `gh api` commands for branch protection (≥ 1 review, CODEOWNERS required, required checks dod/spec/trace/approvals), GitHub `production` environment reviewers; GitLab/Azure DevOps equivalents | T2 | missing: templates/CODEOWNERS | B.3 `project-context`, D.5 `deployment-pipeline` |
| 10.6 | Audit export + standard map | `scripts/audit-export.mjs` (all approvals, waivers and PR reviews → CSV/JSON); `references/standards-mapping.md` (ISO/IEC/IEEE 12207 and IEC 62304 activities → record locations) | T2 | missing: scripts/audit-export.mjs, references/standards-mapping.md | B.1 `agentic-sdlc` |
| 11.1 | Security in spec | `templates/spec.md` §Security notes (data classes, authn/z, inputs, secrets); spec-lint requires it on Standard/Full | T1 | built | B.6 `spec-driven-development`, D.4 `security-hardening` |
| 11.2 | Security lens | `references/review.md` L3 + `references/security.md` §Review checklist (20 items) | T1 | built | D.4 `security-hardening` |
| 11.3 | Secrets + dependency hygiene | `references/security.md` §Secrets, §Dependencies | T1 | built | D.4 `security-hardening` |
| 11.4 | Risk-triggered threat model | `templates/threat-model.md` (STRIDE per data flow); `agents/security-auditor.md` | T2 | missing: templates/threat-model.md | B.7 `senior-solution-architect`, D.4 `security-hardening` |
| 11.5 | Mapped guidance + agent controls | `references/security.md` §OWASP (Top 10 2025 + LLM Top 10 → checks); §Agent controls: (i) fetched or issue/PR text is data — instructions found in it are never executed; (ii) a per-role tool list in `agents/*.md` (Reviewer read-only); (iii) provenance: skills installed from a pinned release + `SHA256SUMS` checked by the doctor; dependencies only via the lockfile | T2 | built | D.4 `security-hardening` |
| 11.6 | SSDF mapping + gates | `references/ssdf-mapping.md` (SP 800-218 PO/PS/PW/RV + 800-218A practices → method mechanism → evidence location); `templates/ci/security.yml` (gitleaks secret scan, dependency audit, failing on critical/high) | T2 | missing: references/ssdf-mapping.md, templates/ci/security.yml | D.4 `security-hardening` |
| 12.1 | Observability before release | `templates/spec.md` §Release & observability: signal (log/metric), **alert with a numeric threshold**, dashboard/query location, owner, rollout (flag or stages 1% → 10% → 100%), rollback command | T1 | built | B.6 `spec-driven-development` |
| 12.2 | Release checklist | `references/release-ops.md` §Release | T1 | built | D.5 `deployment-pipeline`, D.6 `shipping-and-handover` |
| 12.3 | Go/no-go | same §Go/no-go | T2 | built | D.5 `deployment-pipeline` |
| 12.4 | Incidents | `templates/postmortem.md`; `references/release-ops.md` §Incidents | T2 | missing: templates/postmortem.md | D.7 `operations-and-incidents` |
| 12.5 | Production intake | same §Intake | T2 | built | B.2 `issue-triage`, D.7 `operations-and-incidents` |
| 13.1 | Agent files with context hygiene | `agents/{planner,implementer,reviewer,architect,test-engineer,security-auditor,release-engineer,sre}.md` (≤ 600 words each): reads, may-not-see (for example, the Test Engineer never sees the diff), skills, tools, returns | T1 | built (`implementer` renamed `developer`; 5 agents added 2026-11-24) | B.1 `agentic-sdlc` |
| 13.2 | Hand-off + resume | `references/phase-boundaries.md` (rewritten): stage hand-off via files; resume = run ledger (C8.5) or `specs/NNN/handoff.md` | T1 | built | B.1 `agentic-sdlc` |
| 13.3 | Budget validator | `scripts/budget-check.mjs` in repo CI: router ≤ 2,200 words, each reference ≤ 3,000, agent file ≤ 600, quickstart ≤ 1,200; plus spec/plan budgets in spec-lint/plan-graph | T1 | built | B.1 `agentic-sdlc` |
| 14.1 | Paths + brownfield entry | `references/paths.md`; `skills/project-context/SKILL.md` adopt mode (explore and document conventions before the first change) | T1 | built | B.2 `issue-triage`, C.4 `codebase-modernization` |
| 14.2 | Scored rubric + tool | `references/paths.md` §Score; `scripts/path-score.mjs` | T2 | † later release (manual fallback in `references/artifacts.md`) | B.1 `agentic-sdlc` |
| 14.3 | Escalation | `references/paths.md` §Escalate | T1 | built | B.1 `agentic-sdlc` |
| 14.4 | Brownfield artifacts | `references/brownfield.md`: code map (C7.3); characterization tests (pin current behaviour of every touched legacy function without tests *before* changing it, AC tag `CHAR-n`); regression selection = mapped tests of touched modules + dependents (C7.5) on every round, full suite at PR | T2 | missing: references/brownfield.md | B.3 `project-context`, C.4 `codebase-modernization` |
| 14.5 | Worked cases | `examples/paths/` with 6 cases (typo fix, bug fix, small feature, auth change, schema migration, legacy module). Each has the score, the route and a table of the 9 rules showing how Quick still holds them (AC test, evidence, independent check, rollback, …) | T2 | missing: examples/paths/ | B.1 `agentic-sdlc` |
| 14.6 | Adoption guide | `references/adoption.md` (Scrum/Kanban mapping, existing Spec Kit/Kiro/OpenSpec folders, 3-week rollout: week 1 Quick, week 2 Standard, week 3 CI gates) | T2 | missing: references/adoption.md | B.1 `agentic-sdlc` |
| 15.1 | Platform mapping | `references/platforms.md` (8 platforms: subagent equivalent, tool names, permission mechanism, fallback) | T1 | built | B.1 `agentic-sdlc` |
| 15.2 | Customization layer | `references/extension-interface.md` §Overrides: project files (AGENTS.md block, `.agentic-sdlc/config.json`) are never touched by upgrades | T1 | † later release (listed in `references/artifacts.md` §Later-release files; no extensions load until it exists) | B.3 `project-context` |
| 15.3 | Versioned extension interface | `references/extension-interface.md` v1: `sdlc-extensions/<name>/extension.json` `{schema_version: 1, name, version (semver), adds: {lenses, halt_conditions, dod_commands, templates, risk_triggers}}` | T2 | missing: references/extension-interface.md | B.1 `agentic-sdlc` |
| 15.4 | Extension/skill CI | `scripts/ext-check.mjs`; `examples/extensions/` (2 samples); repo `.github/workflows/validate.yml` gets a job `agentic-sdlc-tools` running `node --test skills/agentic-sdlc/scripts/test` + `ext-check` + `budget-check` | T2 | missing: scripts/ext-check.mjs, examples/extensions/ | B.1 `agentic-sdlc` |
| 16.1 | Retro in the default cycle | `references/retrospective.md`; `templates/retro.md` | T1 | built | D.8 `retrospective` |
| 16.2 | Recurrence + follow-up | same | T2 | built | B.2 `issue-triage`, D.8 `retrospective` |
| 16.3 | Metrics collected | `scripts/metrics.mjs` (lead time first commit → merge; deploy frequency from release tags; change failure rate = releases with a SEV1/2 or revert ≤ 7 days; MTTR from postmortems; rework = loop rounds/task from the ledger) | T2 | † later release (manual fallback in `references/artifacts.md`) | D.7 `operations-and-incidents`, D.8 `retrospective` |
