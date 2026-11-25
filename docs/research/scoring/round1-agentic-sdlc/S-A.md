# Scorecard — Agentic SDLC

| Field | Value |
|---|---|
| Method / version | Agentic SDLC, design D10 @ docs/plans/2026-11-20-agentic-sdlc-execution-plan.md and docs/research/methods/2026-11-20-structure-proposal.md as present in the working tree on 2026-11-22 (branch claude/superskills-dev-workflow-kppj2r); partial implementation read under skills/{agentic-sdlc, project-context, brainstorming, grill-me, spec-driven-development, senior-solution-architect, writing-plans} |
| Status | design-only |
| Scorer ID | S-A |
| Methodology version + sha256 | 1.0 / a6e3953725b67db0189e188c1495ee9b54975e48f65c28baaa01f459b69cf9a4 |
| Date | 2026-11-22 |
| Access | full for the design documents and the partial skills. Off-limits sections not opened: plan §1.7 "(positioning)" and structure-proposal §7 "Where the Agentic SDLC makes a real difference". Not credited by instruction: the GATE banner, Phase H (launch placeholder) and decision D11 (process notes, not mechanisms). Phase G is also outside the method. |
| Conflict declaration | None. I did not author, plan, promote or receive positioning briefings for this method or for any competing method. I scored four benchmarks in this round (Superpowers, Matt Pocock, Addy Osmani, BMad) for shared calibration. My model vendor (Anthropic) does not publish this method. |
| Criterion order used | C4 C7 C13 C5 C2 C8 C12 C9 C14 C3 C6 C15 C1 C16 C11 C10 |

## Default path trace (scenario R)

R is a story/feature with moderate risk on an existing production service, so D10 §1.4 selects the **Standard path**. The Full path would apply only if risk signals were present: security, personal data, money, public API or schema.

1. Plan: the Planner takes in the request, checks for duplicates and prior rejections, classifies it, sizes it, chooses the path and sets an indicator (`issue-triage`, new). `project-context` runs if the AGENTS.md block is missing. This step is prototyped in the existing router, Step 0–1.
2. Specify: `specs/<NNN-feature>/spec.md` holds stories, `AC-n` in Given/When/Then, non-goals, constraints, security notes, rollback, indicator and an `## Approvals` section. The design names a doubt pass; it is prototyped in spec-driven-development Step 5. Spec approval by the Product Owner ends the turn; on Standard it may be combined with Plan approval.
3. Design: ADRs if real decisions exist. `plan.md` holds the approach and its tasks, with `Satisfies`/`Blocked by` (prototyped in writing-plans). Plan approval by the Tech Lead.
4. Build: the Implementer works task by task, test-first, with commits `[Tn, AC-n]` (`executing-plans` major upgrade, `test-driven-development` new). A bounded fix loop of 5 rounds applies.
5. Test: an independent Reviewer and Test Engineer verify against the spec in a fresh context (`verification-gate`, `test-strategy`, `multi-axis-code-review`, all new). The PR Verification table maps AC-n → test → evidence. PR approval follows, enforced by branch protection "where possible".
6. Release: flags, staged rollout, rehearsed rollback, release notes, runbook; Release approval (`deployment-pipeline`, `shipping-and-handover`, new).
7. Operate: the indicator is watched, and incidents and postmortems are handled (`operations-and-incidents`, new). The retrospective is a required artifact only on the Full path, so it is optional for R.

## Scores

D is the design score. RA = D × r. Evidence: P means specified in the design; I-proto means prototyped in the method's own repository and read.

| ID | Criterion | Score (D) | r | RA | Conf | Ev. type | Evidence | Rationale: requirements met per level; first unmet requirement |
|---|---|---|---|---|---|---|---|---|
| C1 | Ease of adoption | 3 | 0.8 | 2.40 | M | P, I | plan §5 Phase F ("one-page guide … worked example"), E.4 clarity test; structure-proposal §8 worked example; existing installer (`npx claude-superskills`, cli-installer) and router `skills/agentic-sdlc/SKILL.md` Step 0 | L2–3: install in 1 step (existing), one router entry point, a planned one-page guide with a worked example of one request end to end. **First unmet (L4):** no troubleshooting/FAQ section is specified, and in-tool next-step guidance (router state detection, B.1) is named but its behaviour is not fully defined. r 0.8: the guide is unwritten; precedents exist (BMad tutorial and help router), but the combination is new. |
| C2 | Requirements and specification | 4 | 0.9 | 3.60 | M | P, I-proto | plan §1.1 Specify, §1.5 `spec.md`, §1.6 rule 1, Q8; skills/spec-driven-development/SKILL.md Steps 3–6 (AC-n G/W/T, "Open questions … must be empty or explicitly deferred with an owner before CP2", fresh-context doubt pass, revise mode with revisions); skills/agentic-sdlc/references/rules.md change protocol | L3: default-path spec with required G/W/T `AC-n`, non-goals and a clarification step. L4: fresh-context doubt pass; stop rule (open questions must be empty or deferred with an owner before approval); change control (revisions, change request, impact analysis, re-approval). **First unmet (L5):** no deterministic validator of the spec (scripts are "optional"), and ACs are not made executable. r 0.9: prototyped in the repo and read, but written in the superseded vocabulary and to be rewritten in Phase 0/B; precedents BM-spec/validate, AO delta spec. |
| C3 | Code quality practices | 4 | 0.8 | 3.20 | M | P, I-proto | plan §1.6 rule 4 (red→green→refactor; bug fix starts with failing regression test), §5 C.1 (iron law, fail for the right reason, "name the break" check, rationalization table), §4 item 4; writing-plans prototype ("DRY. YAGNI. TDD.", minimal implementation step); senior-solution-architect (ADRs), B.7 | L3: test-first required on Build; design step (ADRs, plan before code); simplicity rule. L4: failing test observed for the right reason; each test names the break; refactor step; rationalization tables. "Mocking guidance" and "writing good tests" are named without rules and were not credited. **First unmet (L5):** no mechanized gate on the default path (CONSTRAINTS.md is optional; D.5 quality gates are named without thresholds), and the evals in §4 item 7 / E.5 have no pass threshold, so they cannot count as measurement (§8.1). r 0.8: the TDD skill is unbuilt; precedents SP-52..56, AO TDD; spec is partial. |
| C4 | Verification and evidence | 4 | 0.8 | 3.20 | M | P | plan §1.6 rule 2; §1.3 status `CANNOT_VERIFY`, Reviewer "never trusts the PR description", Test Engineer "never designs tests from the implementation"; §5 D.1 (tests from the spec in a separate context), D.2 (claim → command → fresh run → read output → compare → record in PR Verification section; evidence bound to the commit; DoD check); §1.5 DoD in AGENTS.md | L3: fresh evidence required for any completion claim; DoD separate from ACs; Critical blocks PR approval. L4: tests designed from the spec in a separate context; verdicts from the diff, not the PR description; explicit `CANNOT_VERIFY`. **First unmet (L5):** no staleness rule for recorded evidence, and the deterministic gate (required CI checks) is hedged "where possible" (§1.2), which is non-credit language. r 0.8: verification-gate is unbuilt; precedents SP verification/cannot-verify and AO DoD; the integration is new. |
| C5 | Code review rigor | 3 | 0.8 | 2.40 | M | P, I-proto | plan §1.1 Test, §1.3 Reviewer (independent, read-only), shared severity scale; §5 D.3 (axes: spec compliance, design & standards, correctness & edge cases, security, simplicity; parallel context-free reviewer prompts; verify-then-verdict triage; root-cause routing; weakened-bar guard; "declined to judge"; receive mode); C.2 `task-reviewer.md`, `re-review.md`; agents.md prototype | L3: independent review on the default path, multi-axis, severity scale, Critical blocks PR approval. Partial L4: (b) verify-then-verdict triage with routing is specified. **First unmet (L4):** a second of (a)–(d) is not concretely specified. Parallel lenses have no merge/dedup step; scoped re-review (`re-review.md`) and receive mode (receiver-side anti-sycophancy) are named without their behaviour. r 0.8: all review skills are unbuilt; precedents SP-42..51, BM triage, MP two-axis; partial spec. |
| C6 | Loop engineering | 3 | 0.9 | 2.70 | M | P, I-proto | plan §1.6 rule 9 (5 rounds per task, then escalate with a ruling on every open finding; never weaken a test); skills/agentic-sdlc/references/lifecycle.md (round 4 fresh, more capable agent; RV→BU routing by root cause); §5 C.3 (3-failed-fixes escalation), D.3 root-cause routing | L3: Build⇄Test fix loop (exit = findings addressed; cap 5; escalation to human with rulings) and debugging loop (3 failed fixes → escalate). Partial L4: root-cause loopback routing (spec gap → Spec revision; plan defect → plan amendment; local → Build); anti-thrash (fresh stronger agent at round 4). **First unmet (L4):** scoped re-check after a fix is named only (`re-review.md`), and state carried between rounds (what was tried) is not specified. r 0.9: the fix loop is prototyped in the repo; the debugging skill has precedent SP-59. |
| C7 | Graph engineering | 2 | 0.9 | 1.80 | M | P, I-proto | plan §1.1 Design ("thin vertical slices with dependencies"), §1.5 `tasks.md`; writing-plans prototype (`Blocked by` edges, task graph table); §5 C.2 ("parallel only for file-disjoint ready tasks"); C.4 dependency map (codebase-modernization, Full/brownfield modernization only) | L2: E declared (dependency edges per task) and a file-disjoint conflict rule. **First unmet (L3):** no codebase/knowledge map on R's Standard path (the dependency map lives only in codebase-modernization, used on Full), so "one used, the other declared" fails. No integration step is specified for parallel work. r 0.9: prototyped in writing-plans. |
| C8 | Autonomous execution safety | 2 | 0.8 | 1.60 | M | P | plan §1.1 Build⇄Test automatic loop; §1.6 rule 9; §1.3 "Never" limits (Implementer never approves its own work; Release Engineer never deploys without Release approval; SRE no destructive production action); §5 C.2 ("preflight; resume; worktree/branch isolation"), B.1 ("preflight before Build; resume procedure") | L2: an automatic Build/Test mode with safeguards (bounded loop, role authority limits). **First unmet (L3):** preflight, resume and isolation are named without their checks or rules (no clean-tree or baseline-test check, no halt-condition list, no ledger format in the D10 design). r 0.8: precedents SP SDD and BM build-auto; specification incomplete. |
| C9 | Traceability end to end | 4 | 0.7 | 2.80 | M | P, I-proto | plan §1.6 rule 8 (AC-n → task → commit/test → PR evidence → release note → production indicator); §1.5 PR Verification table; C.2 commits `[Tn, AC-n]`; D.2 two-way gap check (untested AC, unrequested code); writing-plans prototype (`Satisfies`, coverage check both ways) | L3: stable `AC-n` across spec → task → commit → PR. L4: gap analysis in both directions; link extended to release notes. **First unmet (L5):** no tool validates links or generates the matrix. r 0.7: the chain depends on four or more unbuilt mechanisms across stages (executing-plans commit format, verification-gate, shipping-and-handover release notes, operations indicator); no benchmark precedent carries IDs to production. |
| C10 | Human governance | 4 | 0.9 | 3.60 | M | P, I-proto | plan §1.2 (approvals table with roles, recording location, record fields: date, role, person, exact words, evidence, residual risks, decision; "ends its turn … only an explicit yes"); §1.4 approvals by path; rules.md change protocol (new revision, re-approval); §1.3 severity (Important: fix or accept as residual risk); router prototype | L3: named checkpoints with owner roles, recorded with who/when/what, turn ends until approval. L4: a change re-opens approval through a new revision; residual-risk acceptance recorded as the waiver; accountability roles; approval depth scales with risk. **First unmet (L5):** Spec and Plan approvals have no enforcement beyond prompts. PR/Release enforcement is hedged "where possible", and it is set up only in the Release-stage skill, so it is unclear when it binds. Approval records are not machine-checked or exportable. r 0.9: prototyped in the repo (router, rules.md); precedents BM frozen-after-approval and AO approval wording. |
| C11 | Security by default | 2 | 0.9 | 1.80 | L | P | plan §1.1 Specify (security notes; Security Auditor helper) and Test (security review); §1.6 rule 7 (no secrets or personal data in prompts, fixtures, logs, commits); §5 D.3 security axis; D.4 (five-minute threat model with abuse cases as negative AC; checklist; "secrets and supply chain"; AI-use data guardrails; `references/ssdf-mapping.md`) | L2: a security skill and checklist are designed, with secret-handling rules and a security review axis. **First unmet (L3):** dependency-hygiene rules are not specified ("supply chain" is named only), so the four default-path elements of L3 are not all concrete. The SSDF mapping (an L5 element) cannot count past the gate. Confidence L: contestable strictness on one requirement. r 0.9: precedent AO security-and-hardening. |
| C12 | Release and operations | 3 | 0.7 | 2.10 | M | P, I-proto | plan §1.1 Release/Operate; §1.6 rule 6 (every spec states rollback; Release rehearses it); §5 D.5 (rollback template and rehearsal, advance/hold/roll back thresholds), D.6 (release notes, runbook), D.7 (SLOs from the spec indicator, watch period, symptom alerts with runbooks, incident roles/severity/timeline, blameless postmortem, DORA metrics, action items → issue-triage); router prototype (CP5 criteria; OP → PL intake) | L3: release step with required rollback, flags and staged rollout, observability via the spec indicator and monitoring before Release approval. Partial L4: production signals feed Plan (action items → issue-triage). **First unmet (L4):** the incident procedure is named without its rules (severity levels, triage steps and postmortem format are not defined). r 0.7: precedent AO shipping-and-launch gives 0.8, minus 0.1 scope load because the design commits to more new release/ops mechanisms than the largest benchmark implements (incident roles, on-call, postmortem, DORA, environment approvals, on top of AO's set). |
| C13 | Context engineering and token efficiency | 5 | 0.9 | 4.50 | M | P, I-proto, I | plan §4 item 2 (SKILL.md 2,000–4,000 words, max 5,000; references loaded on demand with "when to load"; prompts/), item 8 (validators pass); scripts/validate-skill-content.sh (exits 2 above 5,000 words), .github/workflows/validate.yml; §7 ("router never paraphrases between stages", shared files, scratch state cleaned after rulings are copied); §1.3 agent files ("what the agent reads"); skills/agentic-sdlc/references/phase-boundaries.md (continue/delegate/clear/hand off/compact) | L3: systematic progressive disclosure, file hand-offs (spec.md, plan.md, PR), fresh agents with briefs. L4: size budgets; compaction/resume protocol (phase-boundaries prototype; resume in B.1/C.2); role context rules; single-source rules. L5: the skill size budget is enforced by an existing validator in CI. r 0.9: validator and phase-boundaries exist; agent files and ledger are unbuilt (precedent SP SDD). |
| C14 | Right-sizing and brownfield | 3 | 0.9 | 2.70 | M | P, I-proto | plan §1.4 (paths with signals; "Risk signals override size. Escalate … never downgrade silently"), Q6; router prototype Step 1 (risk triggers force a minimum route); project-context prototype (discover, adopt ledger, AGENTS.md block); §5 C.4 (inventory, dependency map, characterization tests) | L3: explicit routing with stated size and risk signals; brownfield entry via project-context. Partial L4: risk axis overrides size; escalation rule; characterization tests and a dependency map on the Full/modernization path. **First unmet (L4):** no regression-selection artifact. r 0.9: routing and project-context prototyped; precedents BM route_selection and AO adoption guide. |
| C15 | Portability and extensibility | 4 | 0.9 | 3.60 | M | P, I | plan §4 item 6 (all 8 platforms, inline fallback for every subagent step, no harness-specific tool names); cli-installer/lib/{copilot,claude,codex,opencode,gemini,antigravity,cursor,adal}.js (existing per-platform installers); project-context markers (`<!-- AGENTIC-SDLC:BEGIN -->`, replace only between markers); CLAUDE.md New Skill Checklist and depth standard; .github/workflows/validate.yml | L3: ≥3 platforms, plain Markdown, documented extension (skill creation, checklist). L4: per-platform installers as adapters; project-level layer that survives upgrades (AGENTS.md block, optional CONSTRAINTS.md); contribution and authoring standards. Partial L5: CI validates skills. **First unmet (L5):** no versioned extension interface. r 0.9: installers and CI exist; the inline fallbacks in the new skills are unbuilt. |
| C16 | Learning loop and measured outcomes | 2 | 0.9 | 1.80 | M | P, I-proto | plan §1.4 (retrospective required only on Full), §5 D.8 (evidence gathering; acceptance decision with fail-safes; indicator vs baseline; environment improvements: mechanical → check, judgment → AGENTS.md), D.7 (DORA metrics); router prototype ("retrospective (mandatory on Full, optional on Standard)") | L2: a retrospective procedure exists but is optional on R's Standard path. **First unmet (L3):** no retrospective in the default cycle for a Standard-path change. Indicator watching is per item; DORA metrics are named without collection rules. r 0.9: precedents BM retrospective and MP retro. |

## Concreteness test (design-only)

Elements: A = artifact/location · T = trigger · R = rule · O = output/record · F = failure behaviour.

| Mechanism | Criterion | Artifact | Trigger | Rule | Output | Failure | Counts? |
|---|---|---|---|---|---|---|---|
| spec.md with G/W/T `AC-n`, non-goals, rollback, indicator | C2 | specs/<NNN>/spec.md | Specify | G/W/T, AC-n stable | spec + Approvals | no code before Spec approval | Yes (5/5) |
| Doubt pass in fresh context | C2 | spec-driven-development Step 5 (prototype) | before approval | checklist of 7 questions | fixes / open questions | self-review label if no subagent | Yes (5/5) |
| Open-questions stop rule | C2 | spec template field 11 (prototype) | before approval | empty or deferred with owner | spec section | approval withheld | Yes (4/5) |
| Change protocol | C2, C10 | rules.md (prototype); B.1 | requirement change after approval | stop, change request, impact analysis, new revision | revision N+1, re-approval record | resume only after re-approval | Yes (5/5) |
| Deterministic spec validator | C2 | — | — | — | — | — | No (not specified; scripts "optional") |
| TDD iron law, fail for right reason, name the break | C3 | test-driven-development (new) | Build, per task | red→green→refactor; failing regression test first | commits | never weaken a test | Yes (4/5) |
| Mocking guidance; writing good tests | C3 | test-driven-development (new) | — | not stated | — | — | No (named only) |
| Quality gates matching DoD | C3 | deployment-pipeline (new) | — | thresholds not stated | — | — | No (named only) |
| Evals (≥3 scenarios, 4–6 expectations) | C3 | evals/evals.json | per skill | no pass threshold | — | — | No for measurement (§8.1) |
| Verification gate | C4 | verification-gate (new); PR Verification section | completion claim / Test | claim → command → fresh run → compare | PR table, evidence bound to commit | Critical blocks PR approval | Yes (5/5) |
| Independent test design | C4 | test-strategy (new); Test Engineer agent | Test | from spec in separate context; never from implementation | AC → level → case | — | Yes (4/5) |
| Required CI checks / branch protection | C4, C10 | deployment-pipeline; repo settings | PR merge | "where possible" | — | merge blocked | No (hedged "where possible") |
| Multi-axis review with severity | C5 | multi-axis-code-review (new); Reviewer agent | Test | 5 axes; Critical/Important/Minor | findings, PR approval prep | Critical blocks PR approval | Yes (5/5) |
| Verify-then-verdict triage + root-cause routing | C5, C6 | multi-axis-code-review; lifecycle.md (prototype) | after review | spec gap → Spec revision; plan defect → plan amendment; local → Build | routed findings | loopback | Yes (4/5) |
| Parallel lens merge/dedup | C5 | — | — | not stated | — | — | No |
| Scoped re-review; receive mode | C5, C6 | executing-plans prompts/re-review.md; D.3 | after fix | not stated | — | — | No (named only) |
| Bounded fix loop | C6 | executing-plans; rules.md rule 9; lifecycle.md (prototype) | Build⇄Test failure | 5 rounds; fresh stronger agent at round 4 | ruling per open finding | escalate to human; never weaken tests | Yes (5/5) |
| 3-failed-fixes escalation | C6 | systematic-debugging (new) | unexpected failure | 3 failed fixes | — | escalate | Yes (4/5) |
| Task dependency edges + file-disjoint parallel rule | C7 | plan.md / tasks.md; writing-plans (prototype); executing-plans | Design / Build | `Blocked by`; parallel only if file-disjoint and ready | task graph | — | Yes (4/5) |
| Preflight; resume; worktree isolation | C8 | executing-plans; router B.1 | before Build | not stated | — | — | No (named only) |
| AC-n chain to release note and indicator | C9 | spec, plan, commits `[Tn, AC-n]`, PR table, release notes | Design → Operate | ID carried through each artifact | PR Verification table | gap check flags untested AC / unrequested code | Yes (5/5) |
| Four approvals with records | C10 | spec.md/plan.md `## Approvals`, PR, release notes | end of Specify/Design/Test, before production | explicit yes in later turn; record fields | approval record | no progress without approval | Yes (5/5) |
| Path scaling of approvals | C10, C14 | §1.4 | Plan | Quick PR only … Full all four | path choice | escalate, never downgrade silently | Yes (4/5) |
| Threat model with abuse cases as negative AC | C11 | security-hardening (new) | Specify (Security Auditor) | five-minute model; abuse cases → negative AC | spec ACs | — | Yes (4/5) |
| Secret / sensitive data rule | C11 | rules.md rule 7 | always | no secrets/PII in prompts, fixtures, logs, commits | — | — | Yes (3/5 + rule is the requirement; credited at L2 only) |
| Dependency hygiene ("supply chain") | C11 | security-hardening | — | not stated | — | — | No (named only) |
| SSDF mapping | C11 | references/ssdf-mapping.md | — | NIST 800-218 → stage and evidence | mapping file | — | Specified (4/5) but above the L3 gate |
| Rollback always + rehearsal | C12 | spec.md rollback; deployment-pipeline | Specify; Release | every spec states undo; Release rehearses | rollback template | Release approval withheld (prototype CP5) | Yes (5/5) |
| Staged rollout thresholds | C12 | deployment-pipeline | Release | advance/hold/roll back (values not given) | — | roll back | Yes (4/5), manual |
| Incident procedure | C12 | operations-and-incidents | incident | roles, severity named without values | postmortem | — | No (named only) |
| Ops → Plan intake | C12 | operations-and-incidents → issue-triage | incident / indicator miss | every action item becomes a Plan item | new item | — | Yes (4/5) |
| Skill size budget + validator | C13 | depth standard §4; validate-skill-content.sh | per skill, CI | max 5,000 words | validator result | exit 2 / fail | Yes (5/5, implemented) |
| Phase boundaries / resume from artifacts | C13 | phase-boundaries.md (prototype) | at stage boundary | ordered questions | — | — | Yes (4/5) |
| Retrospective | C16 | retrospective (new) | Operate; mandatory on Full only | evidence, acceptance, indicator vs baseline, mechanical → check | retro doc, items to project-context/issue-triage | — | Yes (4/5), but optional on Standard |

## Weakest criteria

Measured against the best score I gave the four benchmarks I scored in this round (Superpowers, Matt Pocock, Addy Osmani, BMad). I did not consult any other scorer's cards.

1. **C8 Autonomous execution safety — RA 1.60 (D 2)**, against my best benchmark score of 3. First unmet requirement (L3): preflight checks (clean tree, baseline tests), isolation, an explicit halt-condition list and resumable state are named but not specified.
2. **C16 Learning loop — RA 1.80 (D 2)**, against 3. First unmet requirement (L3): the retrospective is not in the default cycle for a Standard-path change (it is required only on Full).
3. **C11 Security by default — RA 1.80 (D 2)**, against 3. First unmet requirement (L3): dependency-hygiene rules are not specified ("supply chain" is named only).
   C7 Graph engineering ties at RA 1.80. Its first unmet requirement (L3) is that no codebase/knowledge map exists on the Standard path.

Every criterion where RA is below the best benchmark score I gave, with the gap:

| Criterion | RA | Best benchmark (S-A) | Gap |
|---|---|---|---|
| C1 | 2.40 | 5 (BMad) | 2.60 |
| C2 | 3.60 | 4 (BMad) | 0.40 |
| C3 | 3.20 | 5 (Addy Osmani) | 1.80 |
| C4 | 3.20 | 4 (Superpowers, BMad) | 0.80 |
| C5 | 2.40 | 4 (Superpowers, BMad) | 1.60 |
| C6 | 2.70 | 4 (Superpowers, BMad) | 1.30 |
| C7 | 1.80 | 3 (Addy Osmani, BMad) | 1.20 |
| C8 | 1.60 | 3 (Superpowers, BMad) | 1.40 |
| C9 | 2.80 | 3 (BMad) | 0.20 |
| C11 | 1.80 | 3 (Addy Osmani) | 1.20 |
| C12 | 2.10 | 3 (Addy Osmani) | 0.90 |
| C13 | 4.50 | 5 (Superpowers, Addy Osmani) | 0.50 |
| C14 | 2.70 | 3 (Matt Pocock, Addy Osmani, BMad) | 0.30 |
| C15 | 3.60 | 4 (Superpowers, Matt Pocock, Addy Osmani) | 0.40 |
| C16 | 1.80 | 3 (BMad) | 1.20 |

C10 (RA 3.60) is at or above the best benchmark score I gave (3).

## Realization risks (design-only)

| Criterion | Gap to best benchmark (S-A) | Risk driver | r justification |
|---|---|---|---|
| C9 | 0.20 | The chain AC-n → task → commit → PR → release note → indicator needs executing-plans (commit format), verification-gate (PR table), shipping-and-handover (release notes) and operations-and-incidents (indicator). All are unbuilt. | 0.7: three or more cross-stage dependencies on unbuilt mechanisms; carrying IDs to production has no benchmark precedent |
| C12 | 0.90 | Four new skills (deployment-pipeline, shipping-and-handover, operations-and-incidents, retrospective). The incident procedure is unspecified. | 0.8 for precedent (AO), minus 0.1 scope load: more new release/ops mechanisms than the largest benchmark implements |
| C3, C4, C5 | 1.80 / 0.80 / 1.60 | Core Build/Test skills (test-driven-development, verification-gate, test-strategy, multi-axis-code-review, executing-plans upgrade) do not exist yet. Several of their elements are named only ("mocking guidance", "receive mode", `re-review.md`). | 0.8: precedents (SP, AO, BM, MP), but the specification is complete only for part of each level |
| C8 | 1.40 | Preflight, resume, isolation and the ledger are named in C.2/B.1 without their rules. | 0.8: precedents SP SDD and BM build-auto; incomplete spec |
| C1 | 2.60 | The one-page guide, worked example and clarity test are planned for Phase E/F. No FAQ is specified. | 0.8: precedents exist; integration new |
| C2, C6, C10, C13, C14, C15, C16 | 0.40 / 1.30 / — / 0.50 / 0.30 / 0.40 / 1.20 | Prototypes exist in the repo but use the superseded 8-stage vocabulary (CP1–CP5, CHECKPOINTS.md, `docs/agentic-sdlc/`). Phase 0 rewrites them, so their final form is not yet read. | 0.9: precedents plus a repo prototype; the final form is pending |
| All | — | Scope: 15 new skills, 6 upgrades and 8 agent files, all to a depth standard (2,000–4,000 words each, evals, references). This is the largest single dependency for every criterion. | Reflected in per-criterion r; no criterion receives r ≥ 0.9 without an implemented precedent |

## Claims not scored

| Claim | Source | Reason |
|---|---|---|
| Phase H launch criteria, quickstart and adoption numbers | plan §5 Phase H; D11 | Process notes, excluded by instruction |
| GATE banner (scoring gate before Phase 0) | plan header | Process note, excluded by instruction |
| Phase B–D "Minimum additions (refine from the matrix)" entries named without behaviour (e.g. "mocking guidance", "receive mode", "preflight", "resume", "supply chain", "incident roles, severity", "DORA metrics") | plan §5 | Vague intention / mechanism named without behaviour (§8.1) |
| PR/Release approvals enforced by branch protection, required reviewers, CI checks | plan §1.2 "Enforced by (where possible)" | Hedged "where possible" (non-credit language) |
| Evals and skill-creator eval loop prove behaviour | plan §4 item 7, §5 E.5 | No pass threshold specified; measurement not taken (§8.1) |
| Dogfood and clarity tests | plan §5 E.3, E.4 | Planned measurements, not yet run. E.4 has inputs, a procedure and a pass condition, but C1 L5 also needs a doctor/verify or time measurement, and L4 fails first |
| Standards mappings (IEC 62304, 12207, SSDF) | plan §1.4 appendix, Phase F, D.4 | Above the failed gate in C10/C11 |
| Optional CONSTRAINTS.md floor with commands and ratchets | plan §1.5; project-context prototype | Optional ("Full path or teams that want it"), off the default path |

## Search log

| Criterion | Paths / probe terms | Hits used | Hits rejected (reason) |
|---|---|---|---|
| C1 | guide, worked example, quickstart, install, clarity | Phase F guide, E.4, proposal §8, router Step 0, cli-installer | Phase H quickstart (excluded) |
| C2 | spec.md, AC-n, Given/When/Then, EARS, open questions, doubt, revision, change protocol | §1.1, §1.5, Q8, spec-driven-development, rules.md | — |
| C3 | test first, TDD, iron law, mock, YAGNI, ADR, rationalization, quality gate, eval | rule 4, C.1, writing-plans, B.7, §4 | "mocking guidance", "quality gates" (named only) |
| C4 | evidence, fresh, verification, CANNOT_VERIFY, DoD, bound to commit | rule 2, §1.3, D.1, D.2 | "where possible" enforcement |
| C5 | review, axes, severity, parallel, triage, re-review, receive | §1.3, D.3, C.2, agents.md | re-review/receive (named only) |
| C6 | loop, rounds, escalate, root cause, 3 failed fixes | rule 9, lifecycle.md, C.3, D.3 | — |
| C7 | dependencies, tasks.md, Blocked by, parallel, disjoint, dependency map | §1.1, writing-plans, C.2, C.4 | C.4 map (Full path only) |
| C8 | automatic loop, preflight, resume, worktree, never, halt | §1.1, §1.3, C.2, B.1 | preflight/resume/isolation (named only) |
| C9 | AC-n, trace, commit format, PR table, release note, indicator, gap check | rule 8, §1.5, C.2, D.2, writing-plans | — |
| C10 | approval, role, record, explicit yes, enforced, residual risk, path | §1.2, §1.4, rules.md, router | enforcement "where possible" |
| C11 | security, threat, secret, supply chain, SSDF, AI-use | §1.1, rule 7, D.3, D.4 | supply chain (named only) |
| C12 | rollback, flag, staged, thresholds, runbook, incident, postmortem, DORA | §1.1, rule 6, D.5–D.7, router | incident procedure, DORA (named only) |
| C13 | word budget, references, prompts, router never paraphrases, phase boundaries, validator | §4, §7, phase-boundaries.md, validate-skill-content.sh, validate.yml | — |
| C14 | path, signals, risk overrides size, escalate, brownfield, characterization | §1.4, router Step 1, project-context, C.4 | — |
| C15 | 8 platforms, inline fallback, installers, markers, CI | §4 item 6, cli-installer/lib, project-context, validate.yml | — |
| C16 | retrospective, indicator vs baseline, DORA, environment improvements | §1.4, D.7, D.8, router | — |

## Files read

| Path | Words | Read (full / partial) |
|---|---|---|
| docs/plans/2026-11-20-agentic-sdlc-execution-plan.md | 4675 | full except §1.7 (positioning, off-limits) and §10 (kick-off prompt, process) |
| docs/research/methods/2026-11-20-structure-proposal.md | 2013 | full except §7 (off-limits) |
| skills/agentic-sdlc/SKILL.md | 1687 | full |
| skills/agentic-sdlc/references/lifecycle.md | 1075 | full |
| skills/agentic-sdlc/references/rules.md | 544 | full |
| skills/agentic-sdlc/references/agents.md, phase-boundaries.md | 1098 | partial (grep) |
| skills/spec-driven-development/SKILL.md | 1488 | partial (Steps 3–6, rules) |
| skills/writing-plans/SKILL.md | 1404 | partial (grep) |
| skills/project-context/SKILL.md | 1709 | partial (grep) |
| skills/grill-me/SKILL.md | 1334 | partial (grep) |
| scripts/validate-skill-content.sh | — | partial |
| .github/workflows/ (listing), cli-installer/lib/ (listing) | — | listing |
| skills/brainstorming, senior-solution-architect | 2612 | not read in depth (no criterion depended on them beyond the ADR/design step) |

## Machine-readable
```json
{"method":"agentic-sdlc","version":"D10 design @ docs/plans/2026-11-20-agentic-sdlc-execution-plan.md (working tree 2026-11-22)","status":"design-only","scorer":"S-A",
 "methodology_sha256":"a6e3953725b67db0189e188c1495ee9b54975e48f65c28baaa01f459b69cf9a4",
 "scores":{
  "C1":{"s":3,"r":0.8,"ra":2.4,"conf":"M","ev":"P","first_unmet":"No troubleshooting/FAQ specified; next-step guidance named without behaviour","cites":["docs/plans/2026-11-20-agentic-sdlc-execution-plan.md#phase-f","docs/research/methods/2026-11-20-structure-proposal.md#8-worked-example-clarity-test","skills/agentic-sdlc/SKILL.md#step-0"]},
  "C2":{"s":4,"r":0.9,"ra":3.6,"conf":"M","ev":"P","first_unmet":"No deterministic spec validator; ACs not executable","cites":["docs/plans/2026-11-20-agentic-sdlc-execution-plan.md#15-standard-artifacts","skills/spec-driven-development/SKILL.md#step-5","skills/agentic-sdlc/references/rules.md#change-protocol"]},
  "C3":{"s":4,"r":0.8,"ra":3.2,"conf":"M","ev":"P","first_unmet":"No mechanized quality gate on default path; evals lack pass threshold","cites":["docs/plans/2026-11-20-agentic-sdlc-execution-plan.md#16-rules","docs/plans/2026-11-20-agentic-sdlc-execution-plan.md#phase-c","skills/writing-plans/SKILL.md"]},
  "C4":{"s":4,"r":0.8,"ra":3.2,"conf":"M","ev":"P","first_unmet":"No staleness rule; deterministic gate hedged 'where possible'","cites":["docs/plans/2026-11-20-agentic-sdlc-execution-plan.md#phase-d","docs/plans/2026-11-20-agentic-sdlc-execution-plan.md#13-eight-agents"]},
  "C5":{"s":3,"r":0.8,"ra":2.4,"conf":"M","ev":"P","first_unmet":"Only one of (a)-(d) concrete; no merge/dedup, scoped re-review named only","cites":["docs/plans/2026-11-20-agentic-sdlc-execution-plan.md#phase-d","skills/agentic-sdlc/references/agents.md"]},
  "C6":{"s":3,"r":0.9,"ra":2.7,"conf":"M","ev":"P","first_unmet":"Scoped re-check and carried state not specified","cites":["docs/plans/2026-11-20-agentic-sdlc-execution-plan.md#16-rules","skills/agentic-sdlc/references/lifecycle.md#automatic-loops"]},
  "C7":{"s":2,"r":0.9,"ra":1.8,"conf":"M","ev":"P","first_unmet":"No codebase map on the Standard path","cites":["skills/writing-plans/SKILL.md#phase-2","docs/plans/2026-11-20-agentic-sdlc-execution-plan.md#phase-c"]},
  "C8":{"s":2,"r":0.8,"ra":1.6,"conf":"M","ev":"P","first_unmet":"Preflight, isolation, halt list and resume named without rules","cites":["docs/plans/2026-11-20-agentic-sdlc-execution-plan.md#phase-c","docs/plans/2026-11-20-agentic-sdlc-execution-plan.md#13-eight-agents"]},
  "C9":{"s":4,"r":0.7,"ra":2.8,"conf":"M","ev":"P","first_unmet":"No tool validates links or generates the matrix","cites":["docs/plans/2026-11-20-agentic-sdlc-execution-plan.md#16-rules","skills/writing-plans/SKILL.md"]},
  "C10":{"s":4,"r":0.9,"ra":3.6,"conf":"M","ev":"P","first_unmet":"Spec/Plan approvals not enforced beyond prompts; PR/Release enforcement hedged","cites":["docs/plans/2026-11-20-agentic-sdlc-execution-plan.md#12-four-human-approvals","skills/agentic-sdlc/references/rules.md"]},
  "C11":{"s":2,"r":0.9,"ra":1.8,"conf":"L","ev":"P","first_unmet":"Dependency-hygiene rules not specified","cites":["docs/plans/2026-11-20-agentic-sdlc-execution-plan.md#16-rules","docs/plans/2026-11-20-agentic-sdlc-execution-plan.md#phase-d"]},
  "C12":{"s":3,"r":0.7,"ra":2.1,"conf":"M","ev":"P","first_unmet":"Incident procedure named without its rules","cites":["docs/plans/2026-11-20-agentic-sdlc-execution-plan.md#phase-d","skills/agentic-sdlc/SKILL.md#step-7"]},
  "C13":{"s":5,"r":0.9,"ra":4.5,"conf":"M","ev":"P","first_unmet":"none","cites":["docs/plans/2026-11-20-agentic-sdlc-execution-plan.md#4-depth-standard","scripts/validate-skill-content.sh","skills/agentic-sdlc/references/phase-boundaries.md"]},
  "C14":{"s":3,"r":0.9,"ra":2.7,"conf":"M","ev":"P","first_unmet":"No regression-selection artifact","cites":["docs/plans/2026-11-20-agentic-sdlc-execution-plan.md#14-three-paths","skills/project-context/SKILL.md"]},
  "C15":{"s":4,"r":0.9,"ra":3.6,"conf":"M","ev":"P","first_unmet":"No versioned extension interface","cites":["docs/plans/2026-11-20-agentic-sdlc-execution-plan.md#4-depth-standard","cli-installer/lib/claude.js",".github/workflows/validate.yml"]},
  "C16":{"s":2,"r":0.9,"ra":1.8,"conf":"M","ev":"P","first_unmet":"Retrospective optional on the Standard path","cites":["docs/plans/2026-11-20-agentic-sdlc-execution-plan.md#14-three-paths","docs/plans/2026-11-20-agentic-sdlc-execution-plan.md#phase-d"]}
 }}
```
