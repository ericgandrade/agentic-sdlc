# Role Analysis — Agentic SDLC vs. Benchmark Methods

**Date:** 2026-11-22 · **Requested by:** owner ("it must have all the roles — Analyst, Developer, UX, Tester, Scrum…") · **Status:** decided 2026-11-24 (D1 yes, D2 one role, D3 absorb, D4 router); implementation per `docs/plans/2026-11-24-agentic-sdlc-role-model.md`.

**Owner constraints:**
- Use functional role names only.
- No personas with proper names. In particular, do not reuse BMad persona names, which belong to a trademark holder (`docs/research/inventory/bmad.md` header).
- Cover every role the benchmark methods define, including the Scrum roles and Tester.

**Evidence:** the pinned clones in `~/audit-refs/<method>/` (the commits are listed in `docs/research/scoring/audit-log.md`) and `docs/research/inventory/*.md`. Paths below are relative to each clone root.

---

## 1. Role catalog per benchmark

### 1.1 AWS AI-DLC — 14 agents (the richest role model)

Every agent file lives in `core/agents/`. Each file states which stages the agent *leads* and which it *supports*.

| Agent | Role | Leads |
|---|---|---|
| `aidlc-product-agent` | Product manager + business analyst | Intent Capture, Market Research, Scope Definition, Requirements Analysis, User Stories |
| `aidlc-product-lead-agent` | Senior product reviewer; **reviews only, never produces** | Challenges requirements, stories and UX for completeness and testability |
| `aidlc-design-agent` | UX/UI designer: wireframes, interaction, accessibility, design system | Rough Mockups, Refined Mockups |
| `aidlc-architect-agent` | Solutions architect: domain, contracts, NFR patterns, decomposition | Feasibility, Domain Design, Units Generation, Contract Design, Functional Design |
| `aidlc-architecture-reviewer-agent` | Reviews technical design for soundness and coherence | Design review |
| `aidlc-aws-platform-agent` | Infrastructure and cloud architecture | Infrastructure Design, Environment Provisioning |
| `aidlc-developer-agent` | Senior developer: code generation, reverse engineering, data modelling | Reverse Engineering, Code Generation |
| `aidlc-quality-agent` | QA lead: test strategy, test-case design, quality gates, performance | Build and Test, Performance Validation |
| `aidlc-devsecops-agent` | Threat modelling, security requirements, secure design review, security pipeline | Supports NFR, Infrastructure, CI |
| `aidlc-compliance-agent` | GRC: compliance mapping, data classification, risk (support only) | Feasibility & Constraint Analysis |
| `aidlc-pipeline-deploy-agent` | CI/CD engineer + release manager | CI Pipeline, Deployment Pipeline, Deployment Execution |
| `aidlc-operations-agent` | SRE: observability, incidents, optimization | Observability Setup, Incident Response, Feedback & Optimization |
| `aidlc-delivery-agent` | Engineering manager: team formation, sequencing, phase handoffs | Team Formation, Initiative Approval & Handoff, Delivery Planning |
| `aidlc-composer-agent` | Adaptive workflow composer (sizes the minimum workflow) | Workflow composition |

**Notes:**
- This corrects the earlier claim that AI-DLC "has no personas".
- AI-DLC uses functional roles, not named personas.
- Its weak spot is overlap. Product and product-lead, and architect and architecture-reviewer, are deliberate author/critic pairs. Platform is AWS-specific.

### 1.2 BMad Method (v7 preview) — 6 named persona agents + workflow skills

| Skill | Role (persona name in `customize.toml`) | Does |
|---|---|---|
| `skills/method/bmad-agent-analyst` | Business Analyst (named persona) | Market and competitive research, analysis, briefs |
| `skills/method/bmad-agent-pm` | Product Manager (named persona) | PRD and planning documents |
| `skills/method/bmad-agent-po` | Product Owner (named persona) | Tickets, epics → stories, backlog, re-planning |
| `skills/method/bmad-agent-ux-designer` + `bmad-ux` | UX Designer (named persona) | UX spec: journeys with a named protagonist, state coverage per surface, surface closure (inventory BM-88) |
| `skills/method/bmad-agent-architect` | System Architect (named persona) | Technical design |
| `skills/method/bmad-agent-dev` | Senior Software Engineer (named persona) | Implements stories |

**Workflow skills with no persona:**
- `bmad-qa-generate-e2e-tests` (tests for working features)
- `bmad-code-review` / `bmad-review` (lenses)
- `bmad-retrospective`

**Notes:**
- At this commit there is **no Scrum Master and no Tech Writer** agent. Earlier BMad versions had them; they are not evidenced here.
- BMad's strength is the depth of each persona brief and template, for example the UX spec.
- BMad's weakness is that testing is not a role with separation of duties.

### 1.3 Agile V — role skills on a V model

| Skill | Role |
|---|---|
| `discovery-analyst` | Interviews, feedback and research → hypotheses and candidate requirements |
| `requirement-architect` | Product intent → traceable PRD and stories |
| `logic-gatekeeper` | Critic: validates requirements for ambiguity and constraints before build |
| `ux-spec-author` | UX intent → testable design specifications (flows, accessibility) |
| `threat-modeler` | STRIDE + privacy → security requirements, before requirements |
| `build-agent` (+ `domains/build-agent-*`) | Generates artifacts strictly from baselined requirements |
| `test-designer` | Designs tests from requirements **only, never from code** (prevents success bias) |
| `red-team-verifier` | Independent verification of build artifacts |
| `validation-agent` | Intended-use validation with representative users |
| `release-manager` | Rollout, rollback, sign-off checklists |
| `observability-planner` | Metrics, alerts, SLOs |
| `documentation-agent` | Standards-based documentation suite |
| `compliance-auditor` | Decision logging, regulatory readiness |
| `safety-engineer` | Safety lifecycle (hazard → assurance) |
| `agile-v-product-owner` | Backlog and sprint management, INVEST stories (the closest to Scrum roles) |

Agile V also ships business roles (`chief-*`, `venture-strategist`, `gtm-executor`), which are out of scope for software delivery.

### 1.4 Addy Osmani `agent-skills` — 4 specialist agents

The agents are in `agents/`:
- `code-reviewer`
- `security-auditor`
- `test-engineer`
- `web-performance-auditor`

Upstream roles (analyst, PM, UX) are absent. The lifecycle (DEFINE → … → SHIP) is skill-driven.

### 1.5 Superpowers — subagent prompts, not roles

The prompts live in `skills/subagent-driven-development/`:
- `implementer-prompt.md`
- `task-reviewer-prompt.md` (spec compliance, then quality)
- `re-review-prompt.md`

There are no upstream roles, no tester and no release roles.

### 1.6 Methods with no role model

| Method | Evidence |
|---|---|
| GitHub Spec Kit | Command sequence (`templates/commands/*.md`); no agent roles |
| OpenSpec | Change workflow (proposal → apply → archive); `.agents/skills/` are repo-maintenance skills, not delivery roles |
| Matt Pocock | Router and skills; `skills/engineering/triage/AGENT-BRIEF.md` is a triage brief, not a role model |
| AWS Kiro | Closed product; the spec agent plus steering and hooks; no role catalog in the public repo |

---

## 2. Standard reference roles

| Source | Roles |
|---|---|
| **Scrum Guide 2020** | Product Owner (value, backlog), **Scrum Master** (process effectiveness, impediments, events), Developers (everyone building the increment, testers included) |
| **Classic SDLC / product teams** | Business Analyst, Product Manager, UX/UI Designer, Software Architect, Developer, QA Tester / Test Analyst, Test Automation Engineer, Technical Writer, DevOps / Release Engineer, SRE / Operations, Security Engineer, DBA / Data Engineer |
| **Regulated (ISO 9001/13485, IEC 62304, GxP)** | Quality / Compliance (QA in the regulatory sense), Safety Engineer, independent verifier |

---

## 3. Coverage matrix

**Legend:**
- ✅ dedicated role
- ◐ folded into another role, or a skill with no role
- ❌ absent

| Role | AI-DLC | BMad | Agile V | Addy | Superpowers | Spec Kit / OpenSpec / Pocock / Kiro | Scrum / classic | **Agentic SDLC today** |
|---|---|---|---|---|---|---|---|---|
| Business Analyst / discovery | ✅ (product) | ✅ | ✅ | ❌ | ❌ | ◐ (spec commands) | ✅ | ◐ Planner |
| Product Manager | ✅ | ✅ | ◐ (req-architect) | ❌ | ❌ | ❌ | ✅ | ◐ Planner + human PO |
| Product Owner / backlog | ◐ (product) | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | human PO only |
| Requirements critic | ✅ (product-lead) | ◐ (review) | ✅ (gatekeeper) | ❌ | ◐ (spec reviewer) | ◐ (clarify/analyze) | — | ◐ grill-me pass |
| **UX / UI Designer** | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | **❌** |
| Architect | ✅ (+ reviewer) | ✅ | ◐ (ADR skill) | ❌ | ❌ | ◐ (plan) | ✅ | ✅ |
| Platform / infra | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ◐ (DevOps) | ◐ Architect + Release Eng. |
| **Developer** | ✅ | ✅ | ✅ | ◐ | ✅ | ◐ | ✅ | ✅ (named Implementer) |
| **Tester: test design** | ✅ (quality) | ◐ (e2e skill) | ✅ (test-designer) | ✅ | ❌ | ❌ | ✅ | ✅ Test Engineer |
| Independent verifier / reviewer | ◐ | ✅ (lenses) | ✅ (red-team) | ✅ | ✅ | ❌ | ◐ | ✅ Reviewer |
| User validation (right product) | ◐ (product-lead) | ❌ | ✅ | ❌ | ❌ | ❌ | ◐ | ◐ indicator in Operate |
| Performance | ✅ (quality) | ❌ | ❌ | ✅ | ❌ | ❌ | ◐ | ◐ review lens / NFR |
| Security | ✅ | ◐ (lens) | ✅ | ✅ | ❌ | ❌ | ✅ | ✅ |
| Compliance | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ✅ (regulated) | ◐ governance + Security |
| Safety | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ✅ (regulated) | ❌ |
| **Tech Writer** | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ✅ | **❌** |
| Release / CI-CD | ✅ | ❌ | ✅ | ❌ | ◐ (finish branch) | ❌ | ✅ | ✅ |
| SRE / Operations / observability | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ✅ | ✅ |
| **Scrum Master / delivery lead** | ✅ (delivery) | ❌ | ◐ (PO sprint mgmt) | ❌ | ❌ | ❌ | ✅ | ◐ router (implicit) |
| Workflow sizing (composer) | ✅ | ◐ (route) | ◐ (risk class) | ❌ | ❌ | ❌ | — | ✅ path score |
| DBA / data | ◐ (developer) | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ◐ Architect (schema trigger) |

**What the matrix shows:**
- **Gaps:** our method lacks UX Designer and Tech Writer.
- **Folded roles:** Analyst, Product Manager and Scrum Master are folded into other roles, and the Planner is overloaded (three stages).
- **Covered roles:** Developer, Tester, Reviewer, Security, Release, SRE and Architect are covered.
- **Benchmarks:** only AI-DLC and Agile V reach comparable or broader role coverage. BMad is strong upstream (Analyst, PM, PO, UX) but has no Tester, Release or SRE role.

---

## 4. Gap analysis

| Role | Agentic function | Form | Reason |
|---|---|---|---|
| **Analyst** | Discover and Specify: elicit, look up facts, run critique rounds, draft `spec.md` with AC-n | **AI agent** (core), split from the Planner | The Planner spans three stages. A spec author separate from the plan author gives separation of duties (Agile V `requirement-architect` → `logic-gatekeeper`; AI-DLC product → product-lead) |
| **Product Manager** | Discover: problem, outcome, success indicator, non-goals, priority vs backlog. Specify: critiques the Analyst's spec for value and scope | **AI agent** (specialist) drafts; the **human Product Owner** decides and gives the Specify sign-off | Value framing is distinct from requirements writing (AI-DLC, BMad). The critic role (AI-DLC product-lead) is folded into the PM |
| **UX Designer** | Specify and Design: journeys, a state table per surface (empty, loading, error, success, permission, offline), accessibility (WCAG 2.2 AA), text wireframes. Test: UX checks | **AI agent** (specialist) + optional human UX Lead consulted | Present in AI-DLC, BMad and Agile V. **Trigger-based** (only when a user-facing surface changes), so back-end work pays nothing |
| **Planner** | Design only: `plan.md` tasks, DAG, waves | **AI agent** (core), keeps its name | After the split, "Planner writes `plan.md`" matches the naming rule (plan = `plan.md`) |
| **Developer** | Build | **AI agent**. Rename Implementer → Developer for familiarity? (decision D1) | The familiar name helps adoption. The cost is a mechanical rename across the scripts' prose and the executing-plans prompts |
| **Tester** | Test design from the spec **before** implementation, acceptance tests, test runs, coverage of states and NFRs; exploratory and validation checks on Full | **AI agent**: keep one role (Test Engineer) and widen it, or split (decision D2) | Splitting into Test Designer + QA verifier (Agile V) adds a hand-off. Our Reviewer already plays the independent verifier |
| **Tech Writer** | Build and Release: user docs, API/CLI reference, migration guide, the user section of the release notes; docs-only diff | **AI agent** (specialist), trigger: user-visible behavior, public API, configuration or Full path | Only Agile V has it, but classic teams always do. It closes an evidence gap: docs drift |
| **Scrum Master → Delivery Lead** | Flow: status, WIP, impediments (BLOCKED / NEEDS_CONTEXT reports), escalation routing, retro facilitation, metrics. **Never** approves or decides scope | **AI role played by the router** with its own brief + optional human Delivery Lead / Scrum Master | In an agentic method the orchestrator *is* the process steward. AI-DLC `delivery-agent` is the closest precedent. A separate subagent would duplicate the router |
| Compliance | Regulated trigger: control mapping, decision log, data classification | **Absorbed** into Security Auditor + governance on Full with the `regulated` trigger; promote later if needed (decision D3) | Only 2 of 9 benchmarks have it, and it adds no value off the regulated path |
| Safety | Hazard lifecycle | **Out of scope** (noted) | Only Agile V has it; it suits safety-critical domains |
| DBA / data | Schema and migration design | **Absorbed** into Architect (schema/migration risk trigger) | No benchmark has a dedicated role |
| Performance | NFR budgets, load tests | **Absorbed**: Test Engineer (NFR tests) + Reviewer lens | Addy and AI-DLC cover it inside test/quality roles |
| Platform / infra | IaC, environments | **Absorbed**: Architect (design) + Release Engineer (pipelines) | AI-DLC's platform agent is cloud-specific |

**Role-bloat control:**
- Specialists are dispatched **only on their trigger**.
- The Quick path stays at Developer + Reviewer, plus the router acting as Delivery Lead.
- Every new brief is ≤ 600 words, and the router keeps a one-line pointer to `references/agents.md` instead of listing every role.

---

## 5. Recommended target role model

### 5.1 AI agents (13)

| Agent | Kind | Stages | Trigger | Never | Returns |
|---|---|---|---|---|---|
| **Delivery Lead** (Scrum Master function) | core (router) | all | always | approves, decides scope, writes code | status, impediment log, escalation routing, retro facilitation |
| **Analyst** | core | Discover, Specify | Standard, Full | writes the plan or code | score line, intake record, `spec.md` |
| **Product Manager** | specialist | Discover, Specify (critique) | new feature/outcome on Standard; always on Full | edits the spec itself; signs off | problem/outcome brief, indicator, priority, spec critique |
| **UX Designer** | specialist | Specify, Design; Test (UX checks) | change touches a user-facing surface | writes production code | `ux.md` (journeys, state table, accessibility, wireframes) |
| **Planner** | core | Design | Standard, Full | changes the spec | `plan.md`, `graph.json` |
| **Architect** | specialist | Design; loop escalations | Full; or a schema, public API or new component | adds scope | ADRs, interfaces, design rulings |
| **Developer** (today Implementer) | core | Build | always | tests or reviews its own work | commits, task report |
| **Test Engineer** (the Tester) | specialist | after the Design sign-off → Test | Standard, Full; Quick = acceptance test in the issue | sees the implementation reasoning before writing AC tests | `acceptance-tests.md`, test runs, NFR/state coverage |
| **Reviewer** | core | Test | always | fixes code | GO / NO-GO, triage |
| **Security Auditor** | specialist | Specify, Test | R ≥ 1; regulated → compliance mapping | — | threat model, L3 findings |
| **Tech Writer** | specialist | Build (docs task), Release | user-visible behavior, public API/config, or Full | edits code | docs diff, user section of the release notes, migration guide |
| **Release Engineer** | specialist | Release | production deploy | deploys without the Release sign-off | release notes, rehearsal output |
| **SRE** | specialist | Operate | production | destructive actions without on-call | `ops.md`, postmortems, indicator report |

### 5.2 Human accountability roles (the sign-offs stay at 4)

| Human role | Holds | Consulted on |
|---|---|---|
| Product Owner (Scrum PO) | **Specify sign-off**; priority | PM brief, UX journeys |
| Tech Lead | **Design sign-off**; loop escalations | ADRs, plan |
| Human reviewer(s) | **Test sign-off** (PR); 2 on Full | Test evidence |
| Release Owner | **Release sign-off** | Rehearsal, rollback |
| On-call engineer | Destructive production actions | SRE drafts |
| UX Lead *(optional)* | — | UX artifacts on Full |
| Delivery Lead / Scrum Master *(optional human)* | — | Retro facilitation, impediments |

### 5.3 RACI per stage (R = does, A = accountable, C = consulted, I = informed)

| Stage | R | A | C | I |
|---|---|---|---|---|
| Discover | Analyst, PM | Product Owner | Delivery Lead | Tech Lead |
| Specify | Analyst (spec), UX Designer (ux.md), Security Auditor | Product Owner (Specify sign-off) | PM (critique), UX Lead, Tech Lead | Test Engineer |
| Design | Planner, Architect | Tech Lead (Design sign-off) | UX Designer, Security Auditor | Product Owner |
| Build | Developer, Tech Writer (docs task) | Tech Lead | Architect (escalation) | Delivery Lead |
| Test | Reviewer, Test Engineer, Security Auditor, UX Designer (UX checks) | Human reviewer (Test sign-off) | Tech Lead | Product Owner |
| Release | Release Engineer, Tech Writer | Release Owner (Release sign-off) | SRE | Product Owner |
| Operate | SRE, PM (indicator) | On-call engineer | Delivery Lead (retro) | All |

### 5.4 Activation per path

| Path | Agents |
|---|---|
| Quick | Delivery Lead (router), Developer, Reviewer; + Release Engineer when production deploys |
| Standard | + Analyst, Planner, Test Engineer; PM / UX / Security / Tech Writer / Architect on their triggers; Release Engineer, SRE |
| Full | All 13; Architect, PM and Tech Writer always; Security Auditor adds compliance mapping on `regulated` |

---

## 6. Change list (for implementation)

1. `skills/agentic-sdlc/agents/`:
   - **new** `analyst.md`, `product-manager.md`, `ux-designer.md`, `tech-writer.md`, `delivery-lead.md` (each ≤ 600 words, same sections as the existing briefs);
   - **edit** `planner.md` (Design only);
   - **rename** `implementer.md` → `developer.md` if D1 is accepted.
2. `references/agents.md`: index of 13 agents, triggers, activation per path, separation-of-duties pairs.
3. `SKILL.md` (router):
   - "8 agents" → "13 agents (`references/agents.md`)";
   - stage table lead agents (Discover/Specify = Analyst, Design = Planner);
   - stays ≤ 2200 words via budget-check.
4. `references/governance.md`: the human roles table + RACI (§5.2–5.3).
5. `references/lifecycle.md`, `paths.md`, `phase-boundaries.md`: agent names per stage and activation per path.
6. Templates:
   - **new** `templates/ux.md`;
   - `spec.md`: an `## Experience` pointer when a surface is touched;
   - `pr-body.md`: a Docs row;
   - `release-notes.md`: the user section owned by the Tech Writer.
7. `scripts/budget-check.mjs`: include the new agent files in the per-agent budget, if it enumerates them.
8. Stage skills:
   - `brainstorming`, `grill-me`, `spec-driven-development`: the Analyst as user; the PM critique;
   - `executing-plans`: the Developer name (if D1).
9. Worked example: add the PM brief line and a Docs row. CSV export is a back-end + CLI surface, so the UX trigger is optional.
10. `README.md` of the skill; the execution plan (decision D10b: role model); `evals/`.

**Risks:**
- Contradictions: every file must say 13 agents and the same names. Run a vocabulary grep.
- Budget overrun in the router.
- Role bloat on Quick: guarded by triggers.
- The round-2 score refers to the 8-agent tree; a re-score is optional.

---

## 7. Open decisions for the owner

- **D1 — Rename Implementer → Developer?** Recommended: yes, for familiarity. The mechanical cost is moderate.
- **D2 — Tester: one role or two?** Recommended: one Test Engineer, widened with NFR/state coverage and an exploratory pass on Full. The alternative is Test Designer + QA Verifier (Agile V style), which adds a hand-off.
- **D3 — Compliance:** absorb into the Security Auditor on the `regulated` trigger (recommended), or a dedicated Compliance Auditor agent.
- **D4 — Delivery Lead:** the router plays it, with its own brief (recommended), or a separate subagent.
