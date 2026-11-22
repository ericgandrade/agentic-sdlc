# Scorecard — Agentic SDLC

| Field | Value |
|---|---|
| Method / version | Agentic SDLC (design-only) @ claude-superskills commit 5879581b7b95f0cb7c106e31c6b44afcbfe7411e. Design sources: docs/plans/2026-11-20-agentic-sdlc-execution-plan.md (decision D10) and docs/research/methods/2026-11-20-structure-proposal.md. Partial skills under skills/ use the superseded 8-stage vocabulary and are treated as prototype evidence only where D10 keeps the mechanism. |
| Status | design-only |
| Scorer ID | S-C |
| Methodology version + sha256 | 1.0 / a6e3953725b67db0189e188c1495ee9b54975e48f65c28baaa01f459b69cf9a4 (checked with `shasum -a 256`). evaluator-agent.md hash aa3a1f7072ac9200c08135e2f2f773226268870973fc7b908e793a972c31857a matches FREEZE.md. |
| Date | 2026-11-22 |
| Access | Full: both design documents, plus the partial skills, installer and CI files in the repo at the pinned commit. Skipped as positioning or process, with no credit given: plan gate banner, plan §1.7, Phase H, D11, and proposal §7. |
| Conflict declaration | None. S-C did not author, plan or promote the Agentic SDLC. The scorer model's vendor does not publish the method. S-C also scored four benchmarks this round (superpowers, spec-kit, ai-dlc, addyosmani). |
| Criterion order used | C12 C10 C2 C14 C1 C9 C13 C4 C16 C6 C8 C15 C11 C5 C3 C7 |

## Default path trace (scenario R)

1. Request R (a story or feature in an existing repo) enters through the `agentic-sdlc` router (plan §1.1, §3).
2. **Plan.** The Planner checks for duplicates and prior rejections, classifies the work as a story, and sizes it. It picks the **Standard** path: one iteration, moderate risk, reversible with a plan (plan §1.4). Any risk signal, such as personal data, money, a public API or a schema change, would force Full.
3. **Specify.** The Planner writes `specs/<NNN>/spec.md` with stories, Given/When/Then AC-n, non-goals, constraints, security notes, rollback and an indicator. A Security Auditor helps. This ends in **Spec approval** by the Product Owner (§1.1, §1.2).
4. **Design.** The Planner and Architect write `plan.md` with the tasks inside; on Standard there is no `tasks.md`. ADRs are written for real decisions. This ends in **Plan approval** by the Tech Lead. Spec and Plan approval may be one review.
5. **Build.** The Implementer works test-first with small commits tagged `[Tn, AC-n]` and opens the PR.
6. **Test.** A fresh, read-only Reviewer, helped by the Test Engineer and Security Auditor, fills the PR Verification table (AC-n → test → evidence). The Build ⇄ Test fix loop is capped at 5 rounds. This ends in **PR approval**.
7. **Release.** The Release Engineer ships behind flags with staged rollout, a rehearsed rollback and release notes. This ends in **Release approval**.
8. **Operate.** The SRE monitors the change and its indicator. The retrospective is a required artifact only on Full (§1.4), so it is not on the default path for R.

## Scores

| ID | Criterion | Score (D) | r | RA | Conf | Ev. type | Evidence | Rationale: requirements met per level; first unmet requirement |
|---|---|---|---|---|---|---|---|---|
| C1 | Ease of adoption | 3 | 0.7 | 2.10 | M | P + I | Installer `npx claude-superskills` covering 8 platforms (cli-installer/README.md, I). Single router entry point `agentic-sdlc` (plan §1, §3). Phase F one-page guide `docs/guides/agentic-sdlc.md` with a worked example, readable in under an hour (plan §5 F). Worked example in proposal §8. Clarity test E.4. Router SKILL.md 2–4k words, max 5k (plan §4.2). `doctor` command (cli-installer/lib/commands/doctor.js, I). | **L2:** install in ≤5 steps and a stated first skill. **L3:** one entry point (router); a quickstart walking one task end to end (the one-page guide plus the worked example, with E.4 checking that a fresh agent reaches a merged PR on Quick); install is one command; core reading is the guide plus the router (≤8k by the depth standard). The `doctor` command already exists but only checks install directories, so it is not a method onboarding check. **First unmet (L4):** no troubleshooting or FAQ section is specified. Core reading ≤4k words is not assured: the guide is "readable in under an hour" (~12k words) and the router alone may be 4k. |
| C2 | Requirements and specification | 4 | 0.9 | 3.60 | M | P + I | Plan §1.1 Specify, §1.5 spec.md, §1.6 Rule 1. B.5 grill-me and B.6 spec-driven-development (rubric, doubt-pass prompt, revise mode with a delta spec). Prototype skills/spec-driven-development/SKILL.md (AC format, unhappy paths, revision freeze; I). Prototype skills/agentic-sdlc/references/rules.md "Change protocol" (I). | **L3:** spec.md is on the default path with Given/When/Then AC-n, non-goals and constraints; grill-me clarification resolves or records open questions before Spec approval. **L4:** a doubt pass by a fresh-context critic with a checklist (B.6 doubt-pass prompt; prototype doubt pass). Stop rule: no production code before Spec approval (Rule 1). Change control: frozen revisions, Revision N+1, and a change protocol with impact analysis (affected AC, tasks, tests, ADRs, rollback, indicators) that re-runs approval. **First unmet (L5):** no script or schema validates the spec (AC/ID presence, vague terms), and the AC are not made executable. |
| C3 | Code quality practices | 4 | 0.8 | 3.20 | M | P + I | Rule 4 test first, including the bug-fix variant (plan §1.6; prototype rules.md, I). C.1 test-driven-development: iron law, fail for the right reason, mocking guidance, mutation/"name the break", rationalization table. Design stage: plan.md approach and design notes, ADRs for real decisions, B.7 interface checklist and deep-module vocabulary. Architect "never adds scope not in the spec" (§1.3). Depth standard §4.4 requires an anti-rationalization table; prototype rules.md "Red flags" table (I). | **L3:** test-first is required on the build path (Rule 4). A design step comes before code (plan.md design notes plus Plan approval; ADRs). A simplicity rule exists (no scope beyond the spec). **L4:** test-quality safeguards: the failing test must be observed first and fail for the right reason, a regression test comes first for bug fixes, mocking is limited, and each test must name the break it catches. Refactor step (red → green → refactor). Rationalization counters (§4.4; prototype red-flags table). **First unmet (L5):** the mechanized gates sit in CONSTRAINTS.md, which is optional (Full or opt-in, §1.5), and in D.5 CI gates that apply only "where possible". The evals (§4.7) have no pass threshold, so they are not fully specified. |
| C4 | Verification and evidence | 4 | 0.8 | 3.20 | M | P + I | Rule 2 "evidence before claims" (§1.6; prototype rules.md, I). D.2 verification-gate: claim → command → fresh run → read → compare → record in the PR Verification section; claims check; two-way gap check; DoD check. DoD lives in AGENTS.md separately from the AC (§1.5). Test Engineer designs tests from the spec, never from the implementation (§1.3; D.1). Reviewer never trusts the PR description (§1.3). `CANNOT_VERIFY` status (§1.3). | **L3:** a gate on the default path: claims need fresh command output from the same turn. A project DoD separate from the AC. A Critical finding or failing evidence blocks PR approval. **L4:** tests are designed by the Test Engineer from the spec in a separate context. The verdict rests on the diff and the evidence, and the PR description is treated as testimony. An explicit `CANNOT_VERIFY` status exists. **First unmet (L5):** "evidence bound to the commit" is only named. There is no SHA field and no staleness/re-run rule, and the CI gate exists only "where possible" (non-credit language). |
| C5 | Code review rigor | 3 | 0.9 | 2.70 | M | P + I | Test stage review by a fresh, read-only Reviewer (§1.1, §1.3). D.3 multi-axis-code-review axes: spec compliance, design and standards, correctness and edge cases, security, simplicity. Shared severity scale where Critical blocks PR approval (§1.3; prototype agents.md severity, I). | **L3:** review on the default path by an independent context, with a multi-axis checklist and a severity scale. Blocking findings (Critical) must be resolved before PR approval. **First unmet (L4):** none of (a)–(d) is specified with behaviour. (a) Parallel context-free reviewers are named, but there is no merge or dedup step. (b) "Verify-then-verdict triage", (c) "weakened-bar guard" and "receive mode", and (d) the `re-review.md` prompt (C.2) are named without procedure, so each fails the concreteness test. |
| C6 | Loop engineering | 3 | 0.9 | 2.70 | M | P + I | Rule 9: the Build ⇄ Test loop stops at 5 rounds, then escalates to a human with an explicit ruling on every open finding, and a test, threshold or check is never weakened (§1.6). Prototype lifecycle.md "Automatic loops" (I): a fresh, more capable agent takes over from round 4; root-cause routing. D.3 root-cause routing (spec gap → Spec revision; plan defect → plan amendment; local → Build). C.3 "3-failed-fixes escalation". | **L3:** two loop types have exit criteria and bounds. (1) The fix loop exits when the checks pass, is bounded at 5 rounds, and escalates to a human with rulings. (2) The debugging loop escalates after 3 failed fixes; its target is not named apart from the enclosing loop's human escalation, which is a borderline call. **L4 partly met:** root-cause loopback routing and an anti-thrash rule (fresh agent from round 4; 3-failed-fixes). **First unmet (L4):** carrying what was tried between iterations (the "progress ledger" and "breaker rulings") and the scoped re-check after a fix (`re-review.md`) are named without behaviour. |
| C7 | Graph engineering | 2 | 0.9 | 1.80 | M | P + I | plan.md tasks with "Blocked by" (prototype artifacts.md task table, I; kept as "tasks inside" plan.md §1.5). tasks.md "thin slices with dependencies" (Full only). C.2 "parallel only for file-disjoint ready tasks". C.4 "inventory and dependency map" (Full/brownfield only, named). | **L2:** E is declared, with dependency fields on tasks on the default path. **First unmet (L3):** K (code map) exists only on the Full/brownfield path, as a named item in C.4, so it is not declared on the default path. The parallel-frontier rule (file-disjoint ready tasks) has no integration step and is an opt-in subagent mode. No tooling computes graphs. |
| C8 | Autonomous execution safety | 2 | 0.8 | 1.60 | M | P + I | C.2 executing-plans subagent mode: preflight, resume, worktree/branch isolation, progress ledger, bounded fix loop (named list). Status vocabulary DONE/BLOCKED/NEEDS_CONTEXT/CANNOT_VERIFY (§1.3). Agent "never" lists: Release Engineer never deploys without Release approval; SRE takes no destructive production action (§1.3). Rule 9 5-round bound (§1.6). | **L2:** an unattended (subagent) mode with at least two concrete safeguards. Halt conditions are the 5-round cap and the BLOCKED/NEEDS_CONTEXT statuses, with escalation. Authority limits come from the agent "never" lists. **First unmet (L3):** preflight checks (clean tree, baseline tests), isolation and resumable state are named in C.2/B.1 without procedure (grep found no preflight in prototypes). No budgets (time, token or cost) are specified. |
| C9 | Traceability end to end | 4 | 0.7 | 2.80 | M | P + I | Rule 8 AC-n → task → commit/test → PR evidence → release note → production indicator (§1.6). Plan tasks "Satisfies AC-n" (prototype artifacts.md, I). Commits `[Tn, AC-n]` (C.2). PR Verification table AC-n → test → evidence (§1.5). D.2 two-way gap check (untested AC, unrequested code). B.8 AC ↔ task coverage check (prototype SKILL.md step "coverage both ways", I). Release notes (D.6). | **L3:** stable AC-n/Tn IDs linked across ≥3 segments (AC → task → commit → test evidence) in default-path artifacts. **L4:** two-way gap analysis at plan time (AC ↔ task) and at verification time (untested AC; unrequested code). Links extend to the release through release notes that carry AC-n (Rule 8; D.6). **First unmet (L5):** no tool validates the trace or generates the matrix. The production link (indicator) is per change, not per requirement, and no tool checks it. |
| C10 | Human governance | 4 | 0.8 | 3.20 | M | P + I | §1.2 four approvals with roles, record fields, end-of-turn rule and explicit "yes". Records go in spec.md/plan.md `## Approvals`, the PR review and release notes. Prototype rules.md Rule 3 and change protocol (re-run approval) (I). Residual risks accepted in the record. CONSTRAINTS exceptions table (prototype). §1.4 approval depth by path. | **L3:** named approvals on the default path, each with an owner role, recorded with who, when, which artifact and exact words. The agent ends its turn and only an explicit "yes" counts. **L4:** a change creates a new revision and re-opens approval (change protocol). A waiver path exists: residual risk accepted with rationale in the record, and an Important finding may be accepted as residual risk. Accountability roles are named (a small team names the role exercised). Depth scales with risk (Quick: PR; Full: all four separately). **First unmet (L5):** enforcement is "where possible" (non-credit language) and does not cover Spec or Plan approval. No exportable audit trail or standard mapping is specified concretely (the standards appendix is named only). |
| C11 | Security by default | 2 | 0.9 | 1.80 | L | P + I | Specify includes security notes with the Security Auditor (§1.1). Prototype spec-driven-development puts permissions and injection in AC (I). Rule 7 keeps sensitive data out (§1.6). Security review in Test (§1.1; D.3 security axis). D.4 security-hardening: five-minute threat model with abuse cases as negative AC; "secrets and supply chain"; AI-use data guardrails; ssdf-mapping.md. | **L2:** a defined security skill or checklist (threat model with abuse cases written as negative AC). **First unmet (L3):** dependency hygiene rules on the default path. "Secrets and supply chain" is named without behaviour. The concrete dependency-audit rule exists only in the optional CONSTRAINTS.md template. The L3 elements for spec security, review lens and secrets are met. This is contestable, because the default path otherwise reaches L3. L4 would additionally need a risk-triggered threat model, which is named, and controls against prompt injection, for least-privilege tools and for provenance, none of which is specified. |
| C12 | Release and operations | 3 | 0.7 | 2.10 | M | P + I | Rule 6 rollback always, rehearsed in Release (§1.6). Release stage covers flags, staged rollout, release notes and runbook (§1.1). D.5 deployment strategies, rollback template and rehearsal, advance/hold/roll back thresholds (named). spec.md indicator defined before release (§1.5; prototype SPEC "Baseline and indicators", I). D.7 SLOs from the spec indicator, symptom-based alerts. | **L3:** a release step with a required rollback (stated in every spec and rehearsed), staged rollout/feature flags, and an indicator plus monitoring defined in the spec before release. Observability is a borderline call. **First unmet (L4):** go/no-go criteria tied to the spec are not specified (the advance/hold/roll back thresholds have no values and Release approval has no pass criteria). The incident procedure in D.7 is a named list. Production intake into Plan is stated in §1.1 ("Operate feeds Plan") without a procedure on Standard. |
| C13 | Context engineering and token efficiency | 5 | 0.9 | 4.50 | M | P + I | Depth standard §4.2: SKILL.md 2–4k words (max 5k), with references loaded on demand with a stated *when*. Hand-offs through files (spec/plan/PR). Agent files list reads/skills/may/never/returns (§1.3, Phase 0.2; prototype agents.md, I). Prototype phase-boundaries.md options continue/delegate/clear/hand off/compact per transition (I). Single-source rules in rules.md ("Skills reference this file instead of restating them", I) and shared templates in artifacts.md. scripts/validate-skill-content.sh exits 2 above 5,000 words, run in CI by .github/workflows/validate.yml (I). | **L3:** systematic progressive disclosure, file hand-offs, and fresh subagent contexts with explicit briefs. **L4:** a size budget (2–4k words), a compaction/resume protocol (phase-boundaries; B.1/C.2 resume), role-scoped reads (the Implementer gets one task brief; the Reviewer does not read the author's reasoning), and single-source rules. **L5:** the skill-size budget is enforced by an implemented CI validator. Score 5, so the first unmet is none. |
| C14 | Right-sizing and brownfield | 3 | 0.9 | 2.70 | M | P + I | §1.4 Quick/Standard/Full with signals; risk signals override size; escalate, never downgrade silently. B.1 path selection rubric with risk signals and examples. Prototype project-context (discover, verify commands, adopt ledger, I). C.4 codebase-modernization (named list). | **L3:** explicit routing among three paths with size and risk criteria, plus a brownfield entry procedure (project-context discovers the system and conventions before change). **L4 partly met:** separate risk axis and escalation. **First unmet (L4):** brownfield artifacts. The code map and characterization tests are named only in C.4, on Full, and regression selection is absent. |
| C15 | Portability and extensibility | 4 | 0.9 | 3.60 | L | P + I | npx installer for 8 platforms with plain Markdown, with a per-platform installer module each (cli-installer/lib/*.js, I). Depth standard §4.6: all 8 platforms, inline fallback for every subagent step, no harness-specific tool names; §1.3 inline mode. Project customization lives outside the skills (AGENTS.md block markers, DoD, use existing Spec Kit/Kiro folders; §1.5; prototype project-context, I). Authoring standards in CLAUDE.md, docs/guides/skill-anatomy.md and quality-standards.md (I). CI validators (validate.yml, I). | **L3:** officially supports ≥3 platforms with plain files and no runtime beyond the host, plus a documented extension mechanism (skill-creator and the New Skill Checklist). **L4:** per-platform adapters (installer modules plus the inline-fallback rule); a customization layer that survives upgrades (project-side AGENTS.md block, DoD and constraints; a contestable reading); a contribution guide with authoring standards. **First unmet (L5):** no versioned extension interface is specified. CI validation of skills exists. |
| C16 | Learning loop and measured outcomes | 2 | 0.9 | 1.80 | L | P + I | D.8 retrospective: evidence gathering, acceptance decision, indicator vs baseline, environment improvements (mechanical → check, judgement → AGENTS.md), feeds project-context and issue-triage. Prototype RETRO.md template (I). D.7 DORA metrics (named). §1.4: retrospective required only on Full. | **L2:** a retrospective template exists, but it is off the default (Standard) path. **First unmet (L3):** a retrospective in the default cycle. §1.1 lists the retrospective under Operate, but §1.4 requires it only on Full. That contradiction is resolved toward the stricter table, which is a contestable call. L4 metrics (DORA) are named without a collection procedure. |

## Concreteness test (design-only)

| Mechanism | Criterion | Artifact | Trigger | Rule | Output | Failure | Counts? |
|---|---|---|---|---|---|---|---|
| spec.md with G/W/T AC-n, non-goals, rollback, indicator (§1.1, §1.5; prototype SDD) | C2 | Y | Y (Specify) | Y | Y (spec.md) | Y (no code before Spec approval) | Yes (5/5) |
| Change protocol with impact analysis and re-approval (prototype rules.md; B.1) | C2, C10 | Y | Y (requirement change) | Y (6 steps) | Y (new revision, approval record) | Y (stop task) | Yes (5/5) |
| Doubt pass with checklist (B.6; prototype SDD) | C2 | Y | Y (before Spec approval) | partial (prompt named) | Y | N | Yes (4/5, borderline) |
| Four approvals with record fields and end-of-turn rule (§1.2) | C10 | Y | Y | Y | Y | Y (no "yes" → wait) | Yes (5/5) |
| Approval enforcement via branch protection/environments "where possible" (§1.2; D.5) | C10 | Y | Y | N (non-credit language) | N | N | No |
| Rule 2 evidence before claims + PR Verification table (§1.5, §1.6) | C4 | Y | Y (any claim) | Y | Y | Y (report failures) | Yes (5/5) |
| Test Engineer designs tests from spec (§1.3; D.1) | C4 | Y | Y (Test) | Y | Y | N | Yes (4/5) |
| CANNOT_VERIFY status (§1.3; B.1) | C4 | Y | Y | Y | Y | — | Yes (4/5) |
| Evidence bound to commit / staleness (D.2) | C4 | Y | N | N (named) | N | N | No |
| Build ⇄ Test bounded fix loop (Rule 9; prototype lifecycle.md) | C6 | Y | Y | Y (5 rounds; fresh agent from round 4) | Y (rulings) | Y (escalate to human) | Yes (5/5) |
| Root-cause routing (D.3; prototype lifecycle.md) | C6 | Y | Y (finding) | Y (spec/plan/local) | Y | — | Yes (4/5) |
| 3-failed-fixes escalation (C.3) | C6 | Y | Y | Y (3) | N | Y (escalate) | Yes (4/5, borderline) |
| Progress ledger / breaker rulings / re-review.md (C.2) | C6, C5 | Y | N | N (named) | partial | N | No |
| Multi-axis independent review with severity (§1.1, §1.3; D.3) | C5 | Y | Y (Test) | Y (axes, severity) | Y (PR) | Y (Critical blocks) | Yes (5/5) |
| Verify-then-verdict triage, weakened-bar guard, receive mode, parallel prompts (D.3) | C5 | Y | N | N (named) | N | N | No |
| TDD rule incl. bug-fix variant (Rule 4) | C3 | Y | Y | Y | partial | partial | Yes (4/5) |
| C.1 TDD safeguards (fail for right reason, mocking, name the break, rationalization table) | C3 | Y | Y (Build) | partial (named with intent) | N | Y (iron law) | Yes (4/5, borderline) |
| CONSTRAINTS.md numeric gates (prototype artifacts.md) | C3, C11 | Y | Y | Y | Y | Y | Concrete but opt-in → capped, not credited at L≥3 |
| Evals per skill (§4.7) | C3 | Y | partial | Y (≥3 scenarios, pressure scenario) | Y | N (no pass threshold) | No for L5 (not fully specified) |
| Two-way gap check + AC ↔ task coverage (D.2; B.8; prototype router) | C9 | Y | Y | Y | Y (PR) | partial | Yes (4/5) |
| Size budget 2–4k words + validator exit 2 at >5k (§4.2; validate-skill-content.sh) | C13 | Y | Y (CI) | Y | Y | Y | Yes (5/5) |
| Phase-boundaries continue/delegate/clear/hand off/compact (prototype) | C13 | Y | Y (stage transition) | Y | Y | partial | Yes (4/5) |
| Path selection Quick/Standard/Full with risk override (§1.4; B.1) | C14 | Y | Y (Plan) | Y | Y (spec header) | Y (escalate) | Yes (5/5) |
| Code map, characterization tests (C.4) | C14, C7 | Y | partial (Full) | N (named) | N | N | No |
| Preflight, resume, worktree isolation (B.1; C.2) | C8 | Y | partial | N (named) | N | N | No |
| Rollback in every spec, rehearsed in Release (Rule 6) | C12 | Y | Y | Y | Y | partial | Yes (4/5) |
| Advance/hold/roll back thresholds, incident procedure (D.5; D.7) | C12 | Y | partial | N (no values) | N | N | No |
| Five-minute threat model with abuse cases as negative AC (D.4) | C11 | Y | Y (Specify) | Y | Y (negative AC) | N | Yes (4/5) |
| Secrets and supply chain; AI-use data guardrails; SSDF mapping (D.4) | C11 | Y | N | N (named) | partial | N | No |
| Retrospective with environment improvements (D.8; prototype RETRO.md) | C16 | Y | Full only | Y | Y | partial | Yes, but off default path → capped at 2 |
| DORA metrics (D.7) | C16 | Y | N | N | N | N | No |
| One-page guide + worked example + clarity test (Phase F; E.4) | C1 | Y | Y | Y | Y | Y (record gaps; fix) | Yes (5/5) |
| Inline fallback for subagent steps (§1.3; §4.6) | C15 | Y | Y | Y | Y (labelled self-review) | — | Yes (4/5) |

## Weakest criteria

Using anchor-level reasoning only, strong benchmarks reach L4–L5 on these criteria, and the risk-adjusted score is expected to fall below them:

- **C7 Graph engineering.** The code map exists only on the Full path as a named item. Parallel dispatch has no integration step and nothing is computed. Strong benchmarks use and compute execution graphs (L4–L5).
- **C8 Autonomous execution safety.** Preflight, isolation and resume are named, not specified. There are no budgets and no run-level machine-readable result. Strong benchmarks reach L4.
- **C16 Learning loop.** The retrospective is off the Standard path and DORA is named only. Strong benchmarks put the retrospective in the default cycle (L3).
- **C11 Security by default.** Dependency hygiene and agent-specific controls (prompt injection, least privilege, provenance) are not specified. Strong benchmarks reach L3.
- **C1 Ease of adoption.** There is no troubleshooting/FAQ, the reading load is likely above 4k words, and the quickstart is unbuilt (r 0.7). Strong benchmarks reach L4–L5 with a doctor or measured onboarding.
- **C12 Release and operations.** There are no go/no-go criteria or threshold values, and the incident procedure is named only (r 0.7).
- **C5, C6 Review and loops.** L4 add-ons such as triage, re-review, ledger and dedup are named lists. Strong benchmarks specify them (L4).
- **C14 Right-sizing.** Brownfield artifacts are named only. Strong benchmarks reach L4.
- **C3, C4, C15.** These are strong in design, but the L5 elements are optional ("where possible", or CONSTRAINTS.md) or unspecified. Strong benchmarks reach L5.

## Realization risks (design-only)

1. **About 15 new skills and 8 agent files must be built** (Phases 0, B–D). Many criteria depend on unbuilt cross-stage mechanisms. The C9 trace (commit tags → PR table → release notes) and the C1 quickstart (guide + router + Quick-path skills) each depend on three or more of them.
2. **"Refine from the matrix."** Phase B–D content is a minimum named list to be decided after Phase A. Behaviour for preflight, resume, triage, re-review, threat-model triggers, rollout thresholds and DORA collection is not yet designed.
3. **Superseded prototypes.** The existing skills use the 8-stage, CP1–CP5 vocabulary and the CHECKPOINTS/VERIFICATION/TRACEABILITY files. Phase 0 must realign them. Mechanisms credited from prototypes (change protocol, fix-loop escalation, phase-boundaries, RETRO template) must survive the rewrite.
4. **Internal inconsistencies.** §1.1 puts a runbook in every Release and a retrospective in every Operate, but §1.4 requires them only on Full. On Standard, tasks live inside plan.md, but dependency tooling is designed around tasks.md.
5. **Enforcement depends on the platform.** Approval and CI gates are "where possible" (GitHub branch protection or environments). That is not available on all 8 agent platforms, nor on hosts other than GitHub.
6. **Mechanisms without benchmark precedent.** The release-note link carrying AC-n into production indicators per change has no precedent (C9, C12).
7. **Scope load.** C12 commits to more release and operations mechanisms (D.5–D.7, about 17) than the largest benchmark implements (about 13), so r was reduced by 0.1.

## Claims not scored

| Claim | Reason |
|---|---|
| Plan §1.7 positioning ("where the method makes a difference"), proposal §7, gate banner, Phase H, D11 | Positioning or process, excluded by instruction |
| Approval and CI enforcement "where possible" (§1.2, D.5) | Non-credit language |
| "Minimum additions (refine from the matrix)" items without behaviour (preflight, resume, triage, re-review, DORA, incident roles, SSDF mapping, AI guardrails, supply chain) | Vague intention / named without behaviour |
| CONSTRAINTS.md numeric gates (lint, coverage, dependency audit) | Optional (Full or opt-in); capped at L2 and not credited above it |
| Evals (§4.7) and skill-creator eval loop (E.5) as evidence of effect | Not fully specified (no pass threshold); no measurement taken |
| Standards appendices (IEC 62304, ISO/IEC/IEEE 12207, NIST SSDF) | Named only; no evidence locations specified |
| CHECKPOINTS/VERIFICATION/TRACEABILITY files in prototypes | Removed by D10 (§1.5); not credited |
| graphify knowledge graph in this repository | Repository tooling, not part of the method |
| Claude Code plugin `agents/` generation (Q7) | Optional |

## Search log

| Criterion | Paths / probe terms | Hits used | Hits rejected (reason) |
|---|---|---|---|
| C1 | plan, proposal, cli-installer: "quickstart\|getting started\|troubleshoot\|FAQ", "doctor", "guide" | Phase F guide, proposal §8, E.4, installer README, doctor.js | doctor.js (checks install only, not method use); no FAQ hit |
| C2 | "acceptance\|Given\|doubt\|revision\|change protocol" in plan, SDD, rules.md, grill-me | §1.1, §1.5, B.5, B.6, SDD prototype, rules.md change protocol | none |
| C3 | "test first\|TDD\|mutation\|mock\|rationaliz\|lint\|coverage\|ADR" | Rule 4, C.1, B.7, §4.4, rules.md red flags | CONSTRAINTS.md (opt-in), evals (no threshold) |
| C4 | "evidence\|fresh\|Verification\|CANNOT_VERIFY\|Definition of Done\|stale" | Rule 2, D.1, D.2, §1.3 | "evidence bound to commit" (named only); no staleness hit |
| C5 | "review\|triage\|re-review\|receiv\|dedup\|sycophan\|severity" | §1.1, §1.3, D.3, agents.md | D.3 named items; dedup 0 hits |
| C6 | "round\|loop\|escalat\|bound\|ledger" | Rule 9, lifecycle.md automatic loops, D.3, C.3 | ledger/re-review named only |
| C7 | "depend\|blocked by\|parallel\|map\|graph" | artifacts.md task table, C.2, tasks.md | C.4 dependency map (Full, named); graphify (not method) |
| C8 | "preflight\|halt\|resume\|worktree\|budget\|token\|cost" | C.2 list, §1.3 statuses/never lists, Rule 9 | preflight/resume named only; budget 0 relevant hits |
| C9 | "AC-n\|Satisfies\|\[Tn\|trace\|gap\|release note" | Rule 8, §1.5, C.2, D.2, B.8, prototype router | TRACEABILITY.md (removed) |
| C10 | "approval\|exact words\|residual\|waiver\|exception\|where possible" | §1.2, rules.md, artifacts CONSTRAINTS exceptions | enforcement "where possible" |
| C11 | "security\|threat\|secret\|supply chain\|injection\|least privilege\|SSDF\|audit" | §1.1, Rule 7, D.4, SDD prototype | supply chain/SSDF named only; CONSTRAINTS audit opt-in; no prompt-injection or least-privilege control found |
| C12 | "rollback\|flag\|rollout\|runbook\|monitor\|alert\|incident\|threshold\|SLO" | Rule 6, §1.1, D.5, D.7, SPEC indicator | thresholds without values; D.7 named list |
| C13 | "context\|progressive\|budget\|word\|compact\|resume\|brief" + scripts/validate-skill-content.sh + validate.yml | §4.2, phase-boundaries.md, agents.md, rules.md, validator, CI | none |
| C14 | "Quick\|Standard\|Full\|risk\|brownfield\|characterization\|regression" | §1.4, B.1, project-context prototype | C.4 items named only |
| C15 | installer lib/*.js, "platform\|inline\|custom\|override\|extension", validate.yml, CLAUDE.md | installer, §4.6, §1.3, guides, CI | installer `force` flag (not a customization layer) |
| C16 | "retro\|DORA\|metric\|baseline\|indicator\|improvement" | D.8, RETRO.md prototype, §1.4 | DORA (named only); retrospective Full-only |

## Files read

| Path | Words | Read (full / partial) |
|---|---|---|
| docs/research/scoring/methodology.md | 7937 | full |
| docs/research/scoring/evaluator-agent.md | 2610 | full |
| docs/research/scoring/FREEZE.md | 221 | full |
| docs/plans/2026-11-20-agentic-sdlc-execution-plan.md | 4898 | full (gate banner, §1.7, Phase H, D11 read but not credited) |
| docs/research/methods/2026-11-20-structure-proposal.md | 2093 | partial (§7 skipped as positioning) |
| skills/agentic-sdlc/SKILL.md | 1742 | full |
| skills/agentic-sdlc/references/lifecycle.md | 1159 | full |
| skills/agentic-sdlc/references/artifacts.md | 1246 | full |
| skills/agentic-sdlc/references/rules.md | 556 | full |
| skills/agentic-sdlc/references/agents.md | 540 | full |
| skills/agentic-sdlc/references/phase-boundaries.md | 587 | full |
| skills/agentic-sdlc/README.md | 798 | partial |
| skills/agentic-sdlc/evals/evals.json | 366 | partial (grep) |
| skills/spec-driven-development/SKILL.md | 1519 | full |
| skills/writing-plans/SKILL.md | 1441 | full |
| skills/executing-plans/SKILL.md | 769 | full |
| skills/project-context/SKILL.md | 1740 | full |
| skills/brainstorming/SKILL.md | 1629 | full |
| skills/grill-me/SKILL.md | 1372 | full |
| skills/senior-solution-architect/SKILL.md | 1035 | full |
| scripts/validate-skill-content.sh | 163 | full |
| .github/workflows/validate.yml | 244 | full |
| cli-installer/lib/commands/doctor.js | 547 | partial |
| cli-installer/lib/core/installer.js | 421 | partial (grep) |
| cli-installer/README.md | 582 | partial |
| docs/research/scoring/scores/S-C/{superpowers,spec-kit,ai-dlc,addyosmani}.md (own cards) | 3138 / 3110 / 3902 / 3385 | partial (scores and mechanism counts for scope load; JSON format) |
| docs/research/inventory/{superpowers,addyosmani,mattpocock,bmad}.md | 20696 / 27543 / 18806 / 23752 | partial (mechanism IDs and "What" lines; Target lines ignored) |

## Machine-readable

```json
{"method": "agentic-sdlc", "version": "claude-superskills@5879581b7b95f0cb7c106e31c6b44afcbfe7411e (design D10: docs/plans/2026-11-20-agentic-sdlc-execution-plan.md)", "status": "design-only", "scorer": "S-C", "methodology_sha256": "a6e3953725b67db0189e188c1495ee9b54975e48f65c28baaa01f459b69cf9a4", "scores": {
"C1": {"s": 3, "r": 0.7, "ra": 2.1, "conf": "M", "ev": "P", "first_unmet": "L4: troubleshooting/FAQ section and core reading load <=4k words not specified.", "cites": ["plan#Phase F (one-page guide)", "plan#E.4 clarity test", "proposal#8 worked example", "plan#4.2", "cli-installer/README.md (npx install)", "cli-installer/lib/commands/doctor.js"]},
"C2": {"s": 4, "r": 0.9, "ra": 3.6, "conf": "M", "ev": "P", "first_unmet": "L5: deterministic spec validation or executable acceptance criteria.", "cites": ["plan#1.1 Specify", "plan#1.5", "plan#1.6 Rule 1", "plan#B.5", "plan#B.6", "skills/spec-driven-development/SKILL.md", "skills/agentic-sdlc/references/rules.md#change-protocol", "AO-30", "AO-34", "SP-13", "BM-60", "BM-15", "MP-31"]},
"C3": {"s": 4, "r": 0.8, "ra": 3.2, "conf": "M", "ev": "P", "first_unmet": "L5: mechanized quality gates on the default path (CONSTRAINTS.md optional; CI 'where possible') or fully specified evals with pass threshold.", "cites": ["plan#1.6 Rule 4", "plan#C.1", "plan#B.7", "plan#4.4", "skills/agentic-sdlc/references/rules.md#red-flags", "SP-52", "SP-53", "SP-55", "SP-56", "MP-53", "MP-55", "AO-46", "AO-05"]},
"C4": {"s": 4, "r": 0.8, "ra": 3.2, "conf": "M", "ev": "P", "first_unmet": "L5: evidence records bound to a commit SHA with a staleness rule, or a deterministic gate refusing completion.", "cites": ["plan#1.6 Rule 2", "plan#D.1", "plan#D.2", "plan#1.3 (CANNOT_VERIFY; Reviewer never trusts PR description)", "plan#1.5 (Definition of Done)", "SP-64", "SP-34", "BM-29", "BM-30", "AO-48"]},
"C5": {"s": 3, "r": 0.9, "ra": 2.7, "conf": "M", "ev": "P", "first_unmet": "L4: two of (a) parallel lenses with merge/dedup, (b) per-finding verification and triage, (c) two-way anti-sycophancy, (d) scoped re-review specified with behaviour.", "cites": ["plan#1.1 Test", "plan#1.3 (Reviewer; severity scale)", "plan#D.3", "skills/agentic-sdlc/references/agents.md (severity)", "SP-42", "SP-50", "MP-68", "AO-65", "BM-25"]},
"C6": {"s": 3, "r": 0.9, "ra": 2.7, "conf": "M", "ev": "P", "first_unmet": "L4: state carried between iterations (ledger) and scoped re-check after a fix specified with behaviour.", "cites": ["plan#1.6 Rule 9", "skills/agentic-sdlc/references/lifecycle.md#automatic-loops", "plan#D.3 root-cause routing", "plan#C.3", "SP-45", "BM-33", "MP-77"]},
"C7": {"s": 2, "r": 0.9, "ra": 1.8, "conf": "M", "ev": "P", "first_unmet": "L3: one graph used and the other declared on the default path (code map only on Full, named; parallel frontier lacks integration step).", "cites": ["plan#1.5 (tasks inside plan.md; tasks.md with dependencies)", "skills/agentic-sdlc/references/artifacts.md (Blocked by)", "plan#C.2", "plan#C.4", "BM-57", "MP-57", "AO-36"]},
"C8": {"s": 2, "r": 0.8, "ra": 1.6, "conf": "M", "ev": "P", "first_unmet": "L3: preflight checks, isolation and resumable state specified with behaviour.", "cites": ["plan#C.2", "plan#B.1", "plan#1.3 (status vocabulary; never lists)", "plan#1.6 Rule 9", "SP-30", "SP-45", "MP-57", "AO-41"]},
"C9": {"s": 4, "r": 0.7, "ra": 2.8, "conf": "M", "ev": "P", "first_unmet": "L5: machine-checked trace and per-requirement production links.", "cites": ["plan#1.6 Rule 8", "plan#1.5 (PR Verification)", "plan#C.2 commits [Tn, AC-n]", "plan#D.2 two-way gap check", "plan#B.8 coverage", "skills/agentic-sdlc/SKILL.md (coverage both ways)", "skills/agentic-sdlc/references/artifacts.md (Satisfies)", "BM-30", "SP-24"]},
"C10": {"s": 4, "r": 0.8, "ra": 3.2, "conf": "M", "ev": "P", "first_unmet": "L5: enforcement beyond prompts for all approvals and an exportable or standard-mapped audit trail ('where possible' is non-credit).", "cites": ["plan#1.2", "plan#1.4", "skills/agentic-sdlc/references/rules.md (Rule 3; change protocol)", "skills/agentic-sdlc/references/artifacts.md (CONSTRAINTS exceptions)", "AO-10", "AO-11", "BM-17", "BM-90", "BM-60", "BM-06"]},
"C11": {"s": 2, "r": 0.9, "ra": 1.8, "conf": "L", "ev": "P", "first_unmet": "L3: dependency hygiene rules on the default path ('secrets and supply chain' named only; audit rule only in optional CONSTRAINTS.md).", "cites": ["plan#1.1 Specify/Test", "plan#1.6 Rule 7", "plan#D.4", "skills/spec-driven-development/SKILL.md (permission and injection AC)", "AO-78", "AO-82", "AO-85", "BM-67"]},
"C12": {"s": 3, "r": 0.7, "ra": 2.1, "conf": "M", "ev": "P", "first_unmet": "L4: go/no-go release criteria tied to the spec, a specified incident procedure and production-signal intake.", "cites": ["plan#1.6 Rule 6", "plan#1.1 Release/Operate", "plan#D.5", "plan#D.7", "plan#1.5 (indicator)", "AO-88", "AO-89", "AO-90", "AO-94", "AO-97"]},
"C13": {"s": 5, "r": 0.9, "ra": 4.5, "conf": "M", "ev": "P", "first_unmet": "none", "cites": ["plan#4.2", "plan#1.3", "plan#Phase 0.2", "skills/agentic-sdlc/references/phase-boundaries.md", "skills/agentic-sdlc/references/agents.md", "skills/agentic-sdlc/references/rules.md", "scripts/validate-skill-content.sh", ".github/workflows/validate.yml", "AO-55", "AO-57", "MP-12", "MP-13", "SP-30", "SP-71", "BM-11"]},
"C14": {"s": 3, "r": 0.9, "ra": 2.7, "conf": "M", "ev": "P", "first_unmet": "L4: brownfield artifacts (code map, characterization tests, regression selection) specified on the brownfield path.", "cites": ["plan#1.4", "plan#B.1", "plan#C.4", "skills/project-context/SKILL.md", "BM-03", "BM-04", "BM-80", "BM-81", "AO-118"]},
"C15": {"s": 4, "r": 0.9, "ra": 3.6, "conf": "L", "ev": "P", "first_unmet": "L5: a versioned extension interface.", "cites": ["cli-installer/lib/*.js (8 platform installers)", "plan#4.6", "plan#1.3 (inline fallback)", "plan#1.5 (AGENTS.md block, existing spec folders)", "CLAUDE.md (New Skill Checklist)", "docs/guides/skill-anatomy.md", ".github/workflows/validate.yml", "SP-39", "BM-37", "AO-54"]},
"C16": {"s": 2, "r": 0.9, "ra": 1.8, "conf": "L", "ev": "P", "first_unmet": "L3: retrospective in the default (Standard) cycle producing owned environment changes.", "cites": ["plan#D.8", "plan#D.7", "plan#1.4 (retrospective Full only)", "skills/agentic-sdlc/references/artifacts.md (RETRO.md)", "MP-74", "BM-84"]}
}}
```
