# Scorecard — Agile V

| Field | Value |
|---|---|
| Method / version | Agile V Agent Skills Library @ `4bcc9172f7e00fa3f04bd249584d537a7dbe5600` (commit date 2026-10-06; repository version 3.9.x per docs/GOLDEN_JOURNEY.md header) |
| Status | implemented |
| Scorer ID | S-D |
| Methodology version + sha256 | 1.0 / a6e3953725b67db0189e188c1495ee9b54975e48f65c28baaa01f459b69cf9a4 |
| Date | 2026-11-22 |
| Access | full (pinned local clone read directly). `docs/research/inventory/agile-v-concepts.md` consulted only as background: its AV entries name no source files, so they are not used as I-inv evidence. |
| Conflict declaration | none. Scorer did not author, plan or promote any evaluated method; Anthropic does not publish Agile V. |
| License note | Agile V is CC BY-SA 4.0. This scorecard cites file paths, sections and short identifiers only; no Agile V text is reproduced. |
| Criterion order used | C5, C16, C1, C6, C8, C13, C2, C14, C15, C3, C4, C11, C7, C9, C10, C12 |

## Default path trace (scenario R)

1. Entry: README §Start in 60 Seconds → docs/INSTALL_PROFILES.md. An existing production service selects the `existing-repo` profile (core-minimal + existing-repo evidence agents + verified-build skills) plus one domain build skill. `release-manager`, `observability-planner`, `threat-modeler` and `agile-v-compliance` are only in the `regulated` profile, so they are opt-in for R.
2. Load `agile-v-core`; classify risk. R is production-impacting, so it is at least L2 (docs/agile-v-runtime/04_RISK_CLASSIFICATION.md rule 2), recorded in RISK_REGISTER; control matrix honored or proposed (agile-v-core Directive 10).
3. Gate 0 understanding and impact mapping (skills/system-understanding-agent, skills/impact-analysis-agent).
4. `requirement-architect` persists draft REQs (L2+: blind human precommit); `logic-gatekeeper` records independent findings; architect revises; Human Gate 1 recorded in APPROVALS; baseline frozen (agile-v-pipeline §Pipeline/§Handoffs).
5. Domain build agent implements from the baseline while `test-designer` derives TCs from the baseline only; `red-team-verifier` executes, challenges, records VER findings; regression selection and graph traceability run; Eval Gate.
6. Human Gate 2 with evidence; release per approved plan (release-manager opt-in for R).
Route for R: L2, existing-repo profile, Golden Journey flow (docs/GOLDEN_JOURNEY.md §Canonical Flow).

## Scores

| ID | Criterion | Score (D) | r | RA | Conf | Ev. type | Evidence | Rationale: requirements met per level; first unmet requirement |
|---|---|---|---|---|---|---|---|---|
| C1 | Ease of adoption | 3 | 1.0 | 3 | M | I | README.md#Start in 60 Seconds, #Troubleshooting; docs/INSTALL_PROFILES.md#Install; docs/GOLDEN_JOURNEY.md#Canonical Flow; docs/tutorials/verified-authentication.md; SKILL_ROUTING_GUIDE.md | L3: install in 3 commands, one entry point (load agile-v-core; routing guide), an end-to-end flow and tutorial; core reading ≈5k words. L4 unmet: core reading load above 4k (README + profiles + journey + core skill), and no in-tool next-step guidance beyond state-file resume. |
| C2 | Requirements and specification | 2 | 1.0 | 2 | M | I | requirement-architect/SKILL.md#Output Format, #Requirements File, #Traceability Lineage; logic-gatekeeper/SKILL.md#Procedures, #Halt Conditions; agile-v-lifecycle/SKILL.md#Change Requests; agile-v-core/SKILL.md (Directive 6) | L2: persisted REQ artifact with testable statement, verification and done criteria, halt-and-ask clarification, on the default path. L3 unmet: the REQ format has no explicit non-goals/out-of-scope section (scope is recorded only in the risk register; anything outside REQs is implicitly out of scope). Borderline: L4/L5-type features exist (independent gatekeeper findings, vague-term halt, CR change control, frozen baseline). |
| C3 | Code quality practices | 3 | 1.0 | 3 | M | I | test-designer/SKILL.md#Critical Rule, #Procedures (TC per REQ); build-agent/SKILL.md#Pre-Execution Validation (interface contracts before synthesis), #Procedures (no feature creep); agile-v-core/SKILL.md#12 Principles (12 Simplicity); agile-v-quality-gates/SKILL.md#Test Quality Gate; red-team-verifier/SKILL.md#Stub & Anti-Pattern Detection | L3: per-requirement test obligation, interface contracts before code, simplicity/no-scope-creep rules. L4 partly met (test-quality checklist, anti-pattern detection, counter to reading implementation when designing tests). L4 unmet: no refactoring step (agile-v-behavioral discourages drive-by refactors). |
| C4 | Verification and evidence | 5 | 1.0 | 5 | L | I | red-team-verifier/SKILL.md#Procedures, #Verification Record, #Verification Summary, #Eval Gate & EVAL_RESULTS, #Feedback Protocol; requirement-architect/SKILL.md#Output Format (Done Criteria); test-designer/SKILL.md#Critical Rule; docs/agile-v-runtime/07_EVIDENCE_ADMISSION_CONTRACT.md (stale definition, version-bound claims); docs/agile-v-runtime/10_CHANGE_AWARE_REVALIDATION.md (UNKNOWN/STALE not reusable); contracts/semantics.py (reference evaluators) | L3: verification records with commands and results, done criteria separate from requirements, failures block Gate 2. L4: tests designed by a separate role from the baseline only; verifier reads requirements and artifacts, never the builder's context; FLAG/UNKNOWN statuses. L5 (literal anchor): persisted verification/eval records bound to artifact digests or commits with a staleness rule. Low confidence: the machine check exists only as reference semantics not wired into the project workflow, which the "5 vs 4" note may require. |
| C5 | Code review rigor | 4 | 1.0 | 4 | M | I | red-team-verifier/SKILL.md#Procedures (hallucination hunting), #Stub & Anti-Pattern Detection, #Agentic Interoperability Verification, #Severity & Disposition, #Feedback Protocol (re-verification scope); agile-v-pipeline/SKILL.md#Stage Failure Handling | L3: independent (fresh-context, role-separated) examination covering spec conformance, correctness via tests, anti-patterns and security, with CRITICAL/MAJOR/MINOR severity; open CRITICAL/MAJOR block progress. L4: (b) disposition per finding (rework, concession with rationale, reject, defer tracked) and (d) scoped re-verification after fixes. L5 unmet: no parallel lenses with merge (a) and no receiver-side rule against accepting findings unchecked (c). |
| C6 | Loop engineering | 4 | 1.0 | 4 | M | I | build-agent/SKILL.md#Post-Verification Feedback Loop (≤3 auto-fix attempts, halt categories, escalate with what was tried); red-team-verifier/SKILL.md#Feedback Protocol (max 3, re-verify FAIL/FLAG + regression); agile-v-lifecycle/SKILL.md#Re-Entry Points; agile-v-pipeline/SKILL.md#Stage Failure Handling; agile-v-compliance/SKILL.md#CAPA Protocol (3-attempt escalation trigger) | L3: build-fix and verify-fix loops with exit criteria, numeric bound 3 and escalation to a human. L4: loopback by root cause (REQ change → Stage 1 via CR; bug → Stage 3), tried-state carried in escalation and appended VER records, scoped re-check, anti-thrash (architectural change or third failure halts). L5 unmet: no deterministic enforcement of the bound and no measured loop efficacy (bench results not published). |
| C7 | Graph engineering | 3 | 1.0 | 3 | M | I | agile-v-pipeline/SKILL.md#Wave Execution; build-agent/SKILL.md#Pre-Execution Validation (dependency order, no circular refs); skills/system-understanding-agent/SKILL.md (knowledge-graph.json, architecture_map.md); skills/impact-analysis-agent/SKILL.md (graph walk to affected nodes and regression candidates); skills/regression-selection-agent/SKILL.md | L3: both sub-dimensions used — dependency waves dispatch parallel fresh-context work; a codebase graph drives impact analysis and regression selection. L4 unmet: no defined integration step (or conflict rule) for parallel work within a wave. |
| C8 | Autonomous execution safety | 2 | 1.0 | 2 | L | I | agile-v-core/SKILL.md (Directives 5, 6, 9, 10; State Persistence); templates/agile-v/CONTROL_MATRIX.example.yaml (max_permissions, cost_limit, human_gates, require_resume_token); agile-v-pipeline/SKILL.md#Checkpoint Types | L2: agent execution between gates with explicit halt conditions, authority limits, cost cap and resumable state. L3 unmet: no isolation mechanism (branch, worktree or sandbox) is specified. Low confidence: the method positions itself as human-governed, so whether it offers an unattended mode at all is contestable. |
| C9 | Traceability end to end | 3 | 1.0 | 3 | M | I | build-agent/SKILL.md#Build Manifest (ART → REQ@revision, file headers); test-designer/SKILL.md#Output Format (TC → REQ); red-team-verifier/SKILL.md#Verification Record (VER → TC → REQ), coverage table; skills/graph-traceability-agent/SKILL.md (REQ → component → changed files → tests; orphan requirements and orphan changes) | L3: stable typed IDs linked across REQ → ART → TC → VER in default artifacts. L4 partly met (two-way orphan detection). L4 unmet: links to the release (release notes referencing REQ IDs) come only from release-manager, which is not in R's profile. |
| C10 | Human governance | 4 | 1.0 | 4 | M | I | agile-v-compliance/SKILL.md#Human Gate Approval Records (name, role, timestamp, evidence commit); templates/agile-v/CONTROL_MATRIX.example.yaml (approver_role per gate); agile-v-core/SKILL.md (Directive 9 durable HITL); agile-v-lifecycle/SKILL.md#Change Requests; docs/agile-v-runtime/09_EXCEPTION_AND_WAIVER_CONTRACT.md; docs/agile-v-runtime/04_RISK_CLASSIFICATION.md#Levels | L3: named Gates 1 and 2 with owner roles, approvals recorded with who/when/evidence, agent halts until a matching approval. L4: approvals bound to REQ revision (change → CR → new Gate 1), waiver contract with recorded rationale, accountability roles, depth scaling with L0–L4. L5 unmet: no shipped enforcement the agent cannot bypass (signed commits and authority checks are left to the organization; `authorize_gate_transition` is reference semantics only). |
| C11 | Security by default | 4 | 1.0 | 4 | M | I | docs/agile-v-runtime/04_RISK_CLASSIFICATION.md (L2 requires security check); build-agent/SKILL.md#Secure Coding (ISO 27001 A.8.28; secrets; dependency awareness); red-team-verifier/SKILL.md#Agentic Interoperability Verification, #Stub & Anti-Pattern Detection; test-designer/SKILL.md#Agentic Security Tests (OWASP LLM, MITRE ATLAS); templates/agile-v/CONTROL_MATRIX.example.yaml (max_permissions); agile-v-core/SKILL.md#AI Influence Traceability; threat-modeler/SKILL.md (regulated profile, L3/L4) | L3: security check required at L2, security lens in verification, secret and dependency rules. L4: risk-triggered threat modeling (L3/L4 profile), secure coding mapped to named references, untrusted-content tests, least-privilege permissions, provenance of skills/models via AI_RUN_MANIFEST. L5 unmet: security tools (Semgrep, SonarQube profiles) are candidate evidence sources, not gates; no SSDF mapping. |
| C12 | Release and operations | 2 | 1.0 | 2 | M | I | docs/agile-v-runtime/04_RISK_CLASSIFICATION.md (L2 rollback evidence); red-team-verifier/SKILL.md#Control Matrix Conformance Checks (rollback for L2+); release-manager/SKILL.md#Rollout Plan, #Rollback Plan; observability-planner/SKILL.md; docs/INSTALL_PROFILES.md (both in `regulated` only) | L2: rollback evidence required at L2 on the default path; full release guidance exists. L3 unmet on R's default path: staged rollout and pre-release observability requirements live in opt-in skills. |
| C13 | Context engineering and token efficiency | 4 | 1.0 | 4 | M | I | agile-v-core/SKILL.md#Context Engineering (orchestrator ~10–15%, paths not contents, fresh context per sub-agent, tasks ≤50%, per-position rules), #State Persistence (resume rules), #12 Principles (2 single source of truth), #Companion Skills (load on demand); build-agent/SKILL.md#Context Engineering | L3: progressive loading of roles and companions, file hand-offs, fresh sub-agent contexts. L4: numeric context budgets, resume protocol, role hygiene (verifiers never inherit builder context), files-over-chat single source. L5 unmet: budgets are not validator-enforced or measured. |
| C14 | Right-sizing and brownfield | 4 | 1.0 | 4 | M | I | docs/agile-v-runtime/04_RISK_CLASSIFICATION.md#Levels, #Classification rules (floors; raise when impact or uncertainty warrants); docs/INSTALL_PROFILES.md; skills/system-understanding-agent/SKILL.md (Gate 0); skills/impact-analysis-agent, regression-selection-agent | L3: explicit routing by L0–L4 with stated criteria; brownfield entry through Gate 0 understanding. L4: risk triggers force a minimum level regardless of size, escalation by raising the level, brownfield artifacts (architecture map, impact map, regression selection). L5 unmet: no worked cases or evals showing the L0/L1 path keeps the method's safety invariants (a scored rubric exists in 11_RISK_ASSESSMENT_V2, an adoption tutorial exists). |
| C15 | Portability and extensibility | 5 | 1.0 | 5 | M | I | README.md#Platforms; CLAUDE.md; CURSOR.md; packaging/agent-plugins/profiles.yaml; CONTRIBUTING.md#Skill Requirements; docs/DOMAIN_SKILL_TEMPLATE.md; templates/agile-v/README.md; .github/workflows/validate-control-matrix.yml; tests/test_skill_frontmatter.py, tests/test_skill_catalog.py; catalog/skill-catalog.schema.json | L3: Claude Code, Cursor, VS Code/Copilot and other Agent Skills hosts, plain Markdown, no mandatory runtime, documented domain-skill extension. L4: per-platform guides and plugin packaging, project records tailored from templates outside the library, contribution guide with authoring standards. L5: CI validates skill frontmatter and catalog; skills carry versioned contracts and the catalog has a schema. Customization layer borderline. |
| C16 | Learning loop and measured outcomes | 2 | 1.0 | 2 | M | I | agile-v-core/SKILL.md#SCOPE-V (Evolve phase, decision log); agile-v-compliance/SKILL.md#CAPA Protocol (regulated profile); docs/agile-v-runtime/12_GOVERNANCE_CONVERSION.md | L2: improvement candidates and decision logs on the default path; CAPA with recurrence-to-control conversion exists but is opt-in for R. L3 unmet: no retrospective in R's default cycle producing owned actions that change the working environment. |

## Concreteness test (design-only)
n/a

## Weakest criteria
1. C2 Requirements and specification (2): strong critique and change control, but no explicit non-goals in the REQ format, so the L3 gate fails.
2. C8 Autonomous execution safety (2): no isolation mechanism; method is deliberately human-gated.
3. C12 Release and operations (2) and C16 Learning loop (2): release, observability and CAPA live in the opt-in `regulated` profile.

## Realization risks (design-only)
n/a

## Claims not scored
| Claim | Source | Reason |
|---|---|---|
| ISO 9001 / ISO 27001 "aligned", GxP "aware" badges | README.md | Alignment claims; not evidence of mechanisms |
| AgileV-Bench, 108 adversarial cases | README.md#Repository Evidence | Reference semantics; no live-runtime results published |
| Runtime conformance workflow | .github/workflows/runtime-conformance.yml | Depends on a runtime outside the pinned distribution |
| Evidence adapters (Semgrep, SonarQube, Sigstore) | profiles/evidence-sources/ | Marked candidate/experimental; not gates |
| Human oversight case (blind precommit, surprise review) | agile-v-human-oversight/SKILL.md | Preview skill; noted as context in C10, not credited separately |
| Business and C-suite track | SKILL_ROUTING_GUIDE.md | Preview, out of scope for R |
| Concept inventory AV-01..AV-40 | docs/research/inventory/agile-v-concepts.md | No source paths; written for another method; background only |

## Search log
| Criterion | Paths / probe terms | Hits used | Hits rejected (reason) |
|---|---|---|---|
| C1 | README, install, profiles, golden journey, tutorial, troubleshooting | README; INSTALL_PROFILES; GOLDEN_JOURNEY; tutorials | — |
| C2 | REQ, verification criteria, ambiguity, out of scope, non-goal, CR | requirement-architect; logic-gatekeeper; lifecycle | rd-innovator "Out of Scope" (business track) |
| C3 | test, interface, simplicity, refactor, anti-pattern | test-designer; build-agent; quality-gates; core principles; red-team | agile-v-behavioral refactor lines (not a refactoring step) |
| C4 | verify, evidence, stale, eval gate, digest | red-team-verifier; 07; 10; contracts/semantics.py | — |
| C5 | review, severity, disposition, re-verification | red-team-verifier; pipeline | — |
| C6 | attempts, max, escalate, re-entry, CAPA | build-agent; red-team; lifecycle; pipeline; compliance | — |
| C7 | wave, dependency, graph, impact, regression | pipeline; build-agent; existing-repo skills | — |
| C8 | autonomous, sandbox, worktree, halt, resume, cost, permissions | core; CONTROL_MATRIX template; pipeline | no isolation mechanism found |
| C9 | REQ, ART, TC, VER, orphan, release notes | build-agent; test-designer; red-team; graph-traceability; release-manager | release-manager (opt-in for R) |
| C10 | approval, gate, approver, waiver, resume token | compliance; core; control matrix; 09; 04 | — |
| C11 | security, secret, OWASP, ATLAS, injection, permissions, SBOM, SSDF | 04; build-agent; red-team; test-designer; control matrix; threat-modeler | evidence-source profiles (not gates) |
| C12 | deploy, release, rollback, canary, observability, incident | 04; red-team; release-manager; observability-planner | — |
| C13 | context, fresh, paths, ≤50%, resume | core; build-agent | — |
| C14 | L0–L4, floor, profile, existing repo, Gate 0 | 04; 11; INSTALL_PROFILES; existing-repo skills | — |
| C15 | platforms, plugin, contributing, frontmatter, catalog, CI | README; CLAUDE.md; CURSOR.md; packaging; CONTRIBUTING; tests; workflow | — |
| C16 | evolve, lessons, CAPA, metrics, retrospective | core; compliance; 12 | GROWTH_METRICS (outreach, not delivery) |

## Files read
| Path | Words | Read (full / partial) |
|---|---|---|
| README.md | 2,105 | full |
| docs/GOLDEN_JOURNEY.md | 610 | full |
| docs/INSTALL_PROFILES.md | 587 | partial (profiles, install, verify) |
| agile-v-core/SKILL.md | 1,587 | full |
| agile-v-pipeline/SKILL.md | 414 | full |
| agile-v-lifecycle/SKILL.md | 473 | full |
| build-agent/SKILL.md | 819 | full |
| test-designer/SKILL.md | 1,058 | full |
| red-team-verifier/SKILL.md | 1,850 | partial (to Multi-Cycle Verification) |
| requirement-architect/SKILL.md | 688 | full |
| logic-gatekeeper/SKILL.md | 492 | full |
| agile-v-quality-gates/SKILL.md | 2,136 | partial (Test Quality Gate, Time Allocation Gate start) |
| agile-v-compliance/SKILL.md | — | partial (CAPA, Human Gate Approval Records) |
| agile-v-human-oversight/SKILL.md, release-manager/SKILL.md | — | headings |
| skills/system-understanding-agent, impact-analysis-agent, regression-selection-agent, graph-traceability-agent SKILL.md | ~2,800 | partial (purpose and required behavior) |
| docs/agile-v-runtime/04_RISK_CLASSIFICATION.md | 412 | full |
| docs/agile-v-runtime/07_EVIDENCE_ADMISSION_CONTRACT.md, 10_CHANGE_AWARE_REVALIDATION.md, 09_EXCEPTION_AND_WAIVER_CONTRACT.md | — | searched / headings |
| templates/agile-v/CONTROL_MATRIX.example.yaml | — | partial |
| CONTRIBUTING.md | 301 | full |
| .github/workflows/validate-control-matrix.yml, runtime-conformance.yml; tests/ listing | — | partial |
| docs/research/inventory/agile-v-concepts.md | 4,389 | full (background only) |

## Machine-readable
```json
{"method":"agile-v","version":"4bcc9172f7e00fa3f04bd249584d537a7dbe5600","status":"implemented","scorer":"S-D",
 "methodology_sha256":"a6e3953725b67db0189e188c1495ee9b54975e48f65c28baaa01f459b69cf9a4",
 "scores":{
  "C1":{"s":3,"r":1.0,"ra":3,"conf":"M","ev":"I","first_unmet":"Core reading load above 4k words; no in-tool next-step guidance","cites":["README.md#Start in 60 Seconds","docs/INSTALL_PROFILES.md","docs/GOLDEN_JOURNEY.md"]},
  "C2":{"s":2,"r":1.0,"ra":2,"conf":"M","ev":"I","first_unmet":"No explicit non-goals in the REQ format","cites":["requirement-architect/SKILL.md#Output Format","logic-gatekeeper/SKILL.md#Halt Conditions","agile-v-lifecycle/SKILL.md#Change Requests"]},
  "C3":{"s":3,"r":1.0,"ra":3,"conf":"M","ev":"I","first_unmet":"No refactoring step","cites":["test-designer/SKILL.md#Critical Rule","build-agent/SKILL.md#Pre-Execution Validation","agile-v-quality-gates/SKILL.md#Test Quality Gate"]},
  "C4":{"s":5,"r":1.0,"ra":5,"conf":"L","ev":"I","first_unmet":"none","cites":["red-team-verifier/SKILL.md#Verification Summary","docs/agile-v-runtime/07_EVIDENCE_ADMISSION_CONTRACT.md","docs/agile-v-runtime/10_CHANGE_AWARE_REVALIDATION.md"]},
  "C5":{"s":4,"r":1.0,"ra":4,"conf":"M","ev":"I","first_unmet":"No parallel lenses with merge; no receiver-side anti-sycophancy rule","cites":["red-team-verifier/SKILL.md#Severity & Disposition","red-team-verifier/SKILL.md#Feedback Protocol"]},
  "C6":{"s":4,"r":1.0,"ra":4,"conf":"M","ev":"I","first_unmet":"Bounds not deterministically enforced; efficacy not measured","cites":["build-agent/SKILL.md#Post-Verification Feedback Loop","agile-v-lifecycle/SKILL.md#Re-Entry Points","agile-v-pipeline/SKILL.md#Stage Failure Handling"]},
  "C7":{"s":3,"r":1.0,"ra":3,"conf":"M","ev":"I","first_unmet":"No integration step for parallel wave work","cites":["agile-v-pipeline/SKILL.md#Wave Execution","skills/impact-analysis-agent/SKILL.md","skills/system-understanding-agent/SKILL.md"]},
  "C8":{"s":2,"r":1.0,"ra":2,"conf":"L","ev":"I","first_unmet":"No isolation (branch, worktree or sandbox)","cites":["agile-v-core/SKILL.md#Directives","templates/agile-v/CONTROL_MATRIX.example.yaml"]},
  "C9":{"s":3,"r":1.0,"ra":3,"conf":"M","ev":"I","first_unmet":"Release links only in opt-in release-manager","cites":["build-agent/SKILL.md#Build Manifest","test-designer/SKILL.md#Output Format","skills/graph-traceability-agent/SKILL.md"]},
  "C10":{"s":4,"r":1.0,"ra":4,"conf":"M","ev":"I","first_unmet":"No shipped enforcement of approvals","cites":["agile-v-compliance/SKILL.md#Human Gate Approval Records","docs/agile-v-runtime/09_EXCEPTION_AND_WAIVER_CONTRACT.md","templates/agile-v/CONTROL_MATRIX.example.yaml"]},
  "C11":{"s":4,"r":1.0,"ra":4,"conf":"M","ev":"I","first_unmet":"No security tooling wired as gates; no SSDF mapping","cites":["build-agent/SKILL.md#Secure Coding","red-team-verifier/SKILL.md#Agentic Interoperability Verification","test-designer/SKILL.md#Agentic Security Tests"]},
  "C12":{"s":2,"r":1.0,"ra":2,"conf":"M","ev":"I","first_unmet":"Staged rollout and observability only in opt-in skills","cites":["docs/agile-v-runtime/04_RISK_CLASSIFICATION.md#Levels","release-manager/SKILL.md#Rollback Plan","docs/INSTALL_PROFILES.md"]},
  "C13":{"s":4,"r":1.0,"ra":4,"conf":"M","ev":"I","first_unmet":"Budgets not validator-enforced or measured","cites":["agile-v-core/SKILL.md#Context Engineering","agile-v-core/SKILL.md#State Persistence"]},
  "C14":{"s":4,"r":1.0,"ra":4,"conf":"M","ev":"I","first_unmet":"No evidence light path preserves safety invariants","cites":["docs/agile-v-runtime/04_RISK_CLASSIFICATION.md#Classification rules","skills/system-understanding-agent/SKILL.md","docs/INSTALL_PROFILES.md"]},
  "C15":{"s":5,"r":1.0,"ra":5,"conf":"M","ev":"I","first_unmet":"none","cites":["README.md#Platforms","CONTRIBUTING.md#Skill Requirements","tests/test_skill_frontmatter.py",".github/workflows/validate-control-matrix.yml"]},
  "C16":{"s":2,"r":1.0,"ra":2,"conf":"M","ev":"I","first_unmet":"No default-cycle retrospective with owned environment changes","cites":["agile-v-core/SKILL.md#SCOPE-V Task Execution Framework","agile-v-compliance/SKILL.md#CAPA Protocol"]}
 }}
```
