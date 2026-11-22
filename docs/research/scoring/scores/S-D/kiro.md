# Scorecard — AWS Kiro

| Field | Value |
|---|---|
| Method / version | AWS Kiro (closed product), as documented at kiro.dev/docs on 2026-11-22 (pages reference Kiro IDE 1.4.x and Kiro CLI 3.x / V3 harness); public issue-tracker repo `kirodotdev/Kiro` @ `efac9e3` README only |
| Status | implemented |
| Scorer ID | S-D |
| Methodology version + sha256 | 1.0 / a6e3953725b67db0189e188c1495ee9b54975e48f65c28baaa01f459b69cf9a4 |
| Date | 2026-11-22 (documentation access date) |
| Access | partial: official documentation only (Markdown twins of kiro.dev/docs pages fetched with curl through the session proxy; WebFetch could not resolve the host). No hands-on product use; implementation not inspectable. Closed-product cap: documentation-only evidence ≤ 4. |
| Conflict declaration | none. Scorer did not author, plan or promote any evaluated method; Anthropic does not publish Kiro (Kiro offers Anthropic models, which is noted but not treated as a conflict). |
| Criterion order used | C2, C14, C7, C1, C11, C5, C6, C9, C8, C16, C3, C4, C10, C13, C12, C15 |

## Default path trace (scenario R)

1. Install the Kiro IDE (download, run installer, sign in, open project) (getting-started/installation).
2. Optional but promoted first step: generate steering foundation files (`product.md`, `tech.md`, `structure.md`) that are included in every interaction (steering; getting-started/first-project).
3. Route: for a multi-task feature with team collaboration and an audit trail, the docs point to a Feature Spec rather than vibe chat, Plan mode (15–60 min tasks) or Quick Spec (well-understood work, no gates) (specs/plan "Plan mode vs Specs"; specs/best-practices). Workflow: Requirements-First (default variant).
4. `requirements.md`: user stories with EARS acceptance criteria; user reviews and iterates until satisfied (approval loop), optional Analyze Requirements; then `design.md` (architecture, interfaces, error handling, testing strategy) with its own approval loop; then `tasks.md` (discrete tasks with dependencies, optional vs required) (specs/feature-specs, requirements-first).
5. Execution: run tasks individually or "Run all tasks"; Kiro builds a task dependency graph and runs independent tasks in concurrent waves; permission mode per chat (Supervised / Accept file changes / Approve for me) (specs; ide/chat/autopilot).
6. On Web/Mobile the agent opens a PR when done; the team's PR review is outside Kiro's method. Property-based tests are IDE-only and optional by default (specs/correctness).
Route selected for R: Requirements-First Feature Spec in the IDE.

## Scores

| ID | Criterion | Score (D) | r | RA | Conf | Ev. type | Evidence | Rationale: requirements met per level; first unmet requirement |
|---|---|---|---|---|---|---|---|---|
| C1 | Ease of adoption | 4 | 1.0 | 4 | M | D | https://kiro.dev/docs/getting-started/installation (accessed 2026-11-22) §Install Kiro, §Troubleshooting, §Upgrading; https://kiro.dev/docs/getting-started/first-project (steering → specs → hooks → MCP walkthrough); https://kiro.dev/docs/ide/troubleshooting; https://kiro.dev/docs/cli/v3/migration-guide; https://kiro.dev/docs/steering ("Generate Steering Docs") | L3: few install steps, one entry ("Let's build" workflow picker / Spec button), end-to-end first-project walkthrough, modest reading load. L4: in-product phase guidance (Proceed to Design, Sync Files, steering generation from the project), troubleshooting pages, advanced surfaces kept off the first path. L5 not reachable under the closed-product D cap; also no setup check (`kiro-cli doctor` was removed; `diagnostic` only prints system info). |
| C2 | Requirements and specification | 2 | 1.0 | 2 | M | D | https://kiro.dev/docs/specs/feature-specs §Requirements with EARS Notation; https://kiro.dev/docs/specs/feature-specs/requirements-first §Requirements Phase, §Need to Change Requirements After Design; https://kiro.dev/docs/specs/analyze-requirements ("you can skip the analysis"); https://kiro.dev/docs/specs/correctness | L2: a spec artifact with EARS (testable) criteria on the default path, review loop. L3 unmet: no explicit scope/non-goals section in the documented requirements artifact and no defined step that resolves or records open questions before building (clarifying questions are "if needed"). Analyze Requirements (independent-style critique) and property extraction exist but are optional. |
| C3 | Code quality practices | 2 | 1.0 | 2 | M | D | https://kiro.dev/docs/specs/feature-specs §Design Documentation (interfaces, unit testing strategy); https://kiro.dev/docs/specs/feature-specs/requirements-first §Tasks Phase ("Optional vs required tasks"); https://kiro.dev/docs/specs/correctness ("PBTs are optional by default") | L2: a defined design step (design.md with interfaces and data models before tasks). L3 unmet: no documented test-first rule or per-task test obligation (tests may be optional tasks) and no simplicity/minimal-change rule. |
| C4 | Verification and evidence | 2 | 1.0 | 2 | M | D | https://kiro.dev/docs/specs/feature-specs/requirements-first (tasks with "expected outcomes"); https://kiro.dev/docs/specs/correctness (optional PBTs; failures surfaced for review); https://kiro.dev/docs/cli/chat/goal (opt-in loop verifying against acceptance criteria) | L2: tasks carry expected outcomes; optional verification mechanisms. L3 unmet: no documented gate requiring command output after the last change, no DoD separate from the ACs, no rule that a failing check blocks completion on the default spec path. |
| C5 | Code review rigor | 2 | 1.0 | 2 | M | D | https://kiro.dev/docs/ide/chat/autopilot §Supervised mode (hunk-by-hunk human review); https://kiro.dev/docs/privacy-and-security ("Supervised mode is a code review workflow, not a security control"); https://kiro.dev/docs/cli/headless §GitHub Actions (example review job); https://kiro.dev/docs/custom-agents/subagents (code-reviewer example) | L2: review mechanisms exist (human hunk review in Supervised mode, example CI review job, reviewer subagent example) but are optional. L3 unmet: no default-path independent review with a multi-axis checklist, severity scale and blocking findings. |
| C6 | Loop engineering | 2 | 1.0 | 2 | M | D | https://kiro.dev/docs/cli/chat/goal (iterate until criteria pass; default 5 iterations, `--max`; stops on repeated failure pattern); https://kiro.dev/docs/specs/feature-specs (request-changes loops per phase); https://kiro.dev/docs/specs/correctness (PBT failure → fix spec, code or test) | L2 (opt-in cap): named loops; `/goal` has an exit criterion, a numeric bound and a stop-and-report breaker, but it is an opt-in CLI command. L3 unmet on the default path: spec phase loops and PBT fix loop have no bound or escalation target. |
| C7 | Graph engineering | 3 | 1.0 | 3 | M | D | https://kiro.dev/docs/specs §Running tasks in parallel (dependency graph, waves, concurrent execution); https://kiro.dev/docs/steering (`structure.md` foundation file); https://kiro.dev/docs/tools/code-intelligence (`/code overview`, LSP symbols) | L3: execution graph used (dependency graph decides waves and parallel execution on "Run all tasks"); codebase map declared (structure.md, code-intelligence overview). L4 unmet: no documented integration step for parallel work or conflict rule, and no impact analysis from the map feeding the plan or test selection. |
| C8 | Autonomous execution safety | 2 | 1.0 | 2 | M | D | https://kiro.dev/docs/web/autonomous-mode (isolated sandbox; "Needs attention" state; opens PR); https://kiro.dev/docs/cli/headless (trust scoping, structured output, exit codes, workflow timeout); https://kiro.dev/docs/permissions; https://kiro.dev/docs/cloud-sessions (resume) | L2: unattended modes with several safeguards (sandbox isolation, permission rules, wait-for-human state, PR instead of merge, resumable sessions). L3 unmet: no documented preflight (clean tree, baseline tests) and no explicit list of halt conditions. |
| C9 | Traceability end to end | 2 | 1.0 | 2 | M | D | https://kiro.dev/docs/specs/feature-specs ("Individual requirements can be tracked through implementation"); https://kiro.dev/docs/specs/correctness (property linked to its requirement and task, IDE); https://kiro.dev/docs/specs/best-practices (task numbers, `#spec` references) | L2: requirement-to-task/property links in one segment (IDE). L3 unmet: no documented stable requirement IDs carried through task → test → commit/PR. |
| C10 | Human governance | 2 | 1.0 | 2 | M | D | https://kiro.dev/docs/specs/feature-specs (approval gate diagrams per phase); https://kiro.dev/docs/specs/plan (approve plan before handoff); https://kiro.dev/docs/enterprise/governance (admin policies) | L2: defined stop points (phase approvals, plan approval, Supervised turns). L3 unmet: approvals are not recorded in an artifact with who/when/version, and no decision-owner roles are named for these checkpoints. |
| C11 | Security by default | 2 | 1.0 | 2 | M | D | https://kiro.dev/docs/privacy-and-security; https://kiro.dev/docs/mcp/security; https://kiro.dev/docs/permissions (deny-overrides capability rules); https://kiro.dev/docs/sandbox; https://kiro.dev/docs/kiroignore; https://kiro.dev/docs/specs (warning to select only trusted repositories) | L2: security guidance and controls exist (MCP security best practices, permissions, sandbox, `.kiroignore`), but opt-in for the delivery workflow. L3 unmet: no security step in spec/design, no security lens in review, no dependency-hygiene rules on the default path. Strong agent-specific controls are noted but cannot be credited past the gate. |
| C12 | Release and operations | 1 | 1.0 | 1 | M | D | https://kiro.dev/docs/steering (suggested `deployment-workflow.md` steering file covering deployment and rollback) | L1: deployment and rollback mentioned as a possible steering topic. L2 unmet: no release checklist or deployment guidance in the method; it ends at the PR. |
| C13 | Context engineering and token efficiency | 3 | 1.0 | 3 | M | D | https://kiro.dev/docs/steering §Inclusion modes (always / fileMatch / manual); https://kiro.dev/docs/skills; https://kiro.dev/docs/powers (tools loaded on demand); https://kiro.dev/docs/custom-agents/subagents (isolated context, own tools/permissions); https://kiro.dev/docs/compaction (auto at 80%); https://kiro.dev/docs/memory | L3: systematic progressive disclosure, spec files as phase hand-offs, sub-agents with isolated contexts. L4 unmet: no single-source-of-truth rule against duplicated instructions (other L4 items — compaction threshold, resume, per-agent tool scoping — are present). |
| C14 | Right-sizing and brownfield | 3 | 1.0 | 3 | M | D | https://kiro.dev/docs/specs/plan (Plan mode for 15–60 min tasks; skip planning for quick changes); https://kiro.dev/docs/specs/quick-spec; https://kiro.dev/docs/specs/best-practices (Quick Spec vs Feature Spec; Bugfix Spec vs quick fix; vibe → "Generate spec"); https://kiro.dev/docs/steering (foundation files from the existing project); https://kiro.dev/docs/specs/bugfix-specs (unchanged-behavior preservation) | L3: explicit routing among several paths with stated criteria and a brownfield entry (steering foundation files, code overview). L4 unmet: risk is advice ("use your judgment", compliance-sensitive work "usually" better with gates), not a trigger that forces a heavier path. |
| C15 | Portability and extensibility | 2 | 1.0 | 2 | M | D | https://kiro.dev/docs/how-kiro-works (one agent harness across IDE, CLI, Web, Mobile, ACP editors); https://kiro.dev/docs/skills; https://kiro.dev/docs/hooks; https://kiro.dev/docs/custom-agents; https://kiro.dev/docs/steering (AGENTS.md support) | L2: one proprietary agent platform with documented customization (steering, hooks, skills, powers, custom agents, MCP). L3 unmet: not supported on three or more independent agent platforms; all surfaces run Kiro's own agent. |
| C16 | Learning loop and measured outcomes | 2 | 1.0 | 2 | L | D | https://kiro.dev/docs/memory (learns corrections, debugging insights, ruled-out approaches; per-app setting); https://kiro.dev/docs/web/autonomous-mode (PR feedback teaches patterns) | L2: an automatic lessons store (Memory) exists. L3 unmet: no retrospective in the delivery cycle producing owned actions. Low confidence: treating Memory as a lessons file is a contestable interpretation. |

## Concreteness test (design-only)
n/a

## Weakest criteria
1. C12 Release and operations (1): no release, rollback or observability coverage.
2. C2/C3/C4 core (2 each): EARS requirements exist, but non-goals, test obligations and a verification gate are not part of the documented default path; the strongest checks (Analyze Requirements, property-based tests, `/goal`) are optional.
3. C15 Portability (2): single proprietary agent platform.

## Realization risks (design-only)
n/a

## Claims not scored
| Claim | Source | Reason |
|---|---|---|
| Analyze Requirements finds contradictions, ambiguities, gaps | specs/analyze-requirements | Optional; not on default path (credited only up to L2) |
| Property-based tests turn requirements into executable properties | specs/correctness | IDE only, optional by default |
| Declarative workflows with loops and completion conditions | workflows | User-authored, opt-in |
| Enterprise permission policies and Kiro Governance Language | enterprise/governance, enterprise-management | Organization admin controls, not part of the delivery method; would matter only for enforcement levels above the D cap |
| CloudTrail logging of tool calls; OpenTelemetry usage metrics | enterprise/monitor-and-track | Usage/audit telemetry, not delivery outcome metrics |
| Kiro Crew (24/7 agents, scheduling) | crew docs (index only) | Separate surface; not read; not on R path |
| Third-party summaries in docs/research/methods/ai-native-methods.md §2.2 | repository research note | Superseded by official docs read directly |

## Search log
| Criterion | Paths / probe terms | Hits used | Hits rejected (reason) |
|---|---|---|---|
| C1 | installation, first project, troubleshooting, doctor, migration | installation; first-project; ide/troubleshooting; cli/v3/migration-guide | `kiro-cli doctor` (removed in CLI 3.0) |
| C2 | requirements, EARS, clarifying, scope, non-goal, analyze | feature-specs; requirements-first; analyze-requirements; quick-spec | — |
| C3 | test, TDD, design, optional tasks, simplicity | feature-specs; requirements-first; correctness | — |
| C4 | verify, evidence, done, goal, property | correctness; goal; requirements-first | — |
| C5 | review, reviewer, supervised, PR | autopilot; privacy-and-security; headless; subagents | Markdown Review (spec documents, C2/C10) |
| C6 | loop, iterate, max, goal, retry | goal; feature-specs; correctness | workflows (opt-in, not read in full) |
| C7 | dependency graph, waves, parallel, code intelligence, structure | specs; steering; tools/code-intelligence | — |
| C8 | autonomous, headless, sandbox, budget, halt, resume, preflight | web/autonomous-mode; cli/headless; cloud-sessions; permissions; sandbox | no preflight found |
| C9 | traceability, requirement id, link | feature-specs; correctness; best-practices | — |
| C10 | approval, gate, approve, governance | feature-specs; plan; enterprise/governance | — |
| C11 | security, injection, trusted, secret, sandbox, permissions | privacy-and-security; mcp/security; permissions; sandbox; kiroignore | — |
| C12 | deploy, release, rollback, monitor, incident | steering example | enterprise monitoring (usage, not production) |
| C13 | context, steering inclusion, compaction, subagent, skills, powers | steering; compaction; subagents; skills; powers; memory | — |
| C14 | quick, vibe, plan mode, bugfix, existing codebase | plan; quick-spec; best-practices; bugfix-specs; steering | — |
| C15 | platform, ACP, extensions, skills, hooks, custom agents | how-kiro-works; skills; hooks; custom-agents | — |
| C16 | memory, learn, retrospective, metrics | memory; autonomous-mode | — |

## Files read
| Path | Words | Read (full / partial) |
|---|---|---|
| kiro.dev/llms.txt (docs index) | — | full |
| kiro.dev/docs/specs.md | 1,265 | full |
| kiro.dev/docs/specs/feature-specs.md | 906 | full |
| kiro.dev/docs/specs/feature-specs/requirements-first.md | 879 | full |
| kiro.dev/docs/specs/quick-spec.md | 509 | full |
| kiro.dev/docs/specs/analyze-requirements.md | 524 | full |
| kiro.dev/docs/specs/correctness.md | 1,079 | full |
| kiro.dev/docs/specs/bugfix-specs.md | 589 | full |
| kiro.dev/docs/specs/best-practices.md | 1,876 | full |
| kiro.dev/docs/specs/plan.md | 820 | full |
| kiro.dev/docs/ide/chat/autopilot.md | 1,066 | full |
| kiro.dev/docs/web/autonomous-mode.md | 565 | full |
| kiro.dev/docs/cli/chat/goal.md | 570 | full |
| kiro.dev/docs/cli/headless.md | 3,338 | partial (headings, trust, structured output, best practices) |
| kiro.dev/docs/getting-started/installation.md, first-project.md | 4,509 | partial |
| kiro.dev/docs/steering.md, compaction.md, memory.md, custom-agents/subagents.md, hooks.md, hooks/types.md, tools/code-intelligence.md | — | partial (searched) |
| kiro.dev/docs/privacy-and-security.md, permissions.md, mcp/security.md, sandbox.md, kiroignore.md, enterprise/governance.md, ide/troubleshooting.md, cli/v3/migration-guide.md, cloud-sessions.md | — | searched |
| kiro.dev/docs/specs/feature-specs/tech-design-first.md, hooks/actions.md, hooks/examples.md, skills.md, powers.md, workflows.md and others fetched | — | fetched; searched only |
| github.com/kirodotdev/Kiro README.md @ efac9e3 | — | full |

## Machine-readable
```json
{"method":"kiro","version":"kiro.dev/docs accessed 2026-11-22 (IDE 1.4.x, CLI 3.x)","status":"implemented","scorer":"S-D",
 "methodology_sha256":"a6e3953725b67db0189e188c1495ee9b54975e48f65c28baaa01f459b69cf9a4",
 "scores":{
  "C1":{"s":4,"r":1.0,"ra":4,"conf":"M","ev":"D","first_unmet":"Closed-product D cap; no setup check command","cites":["https://kiro.dev/docs/getting-started/installation","https://kiro.dev/docs/getting-started/first-project","https://kiro.dev/docs/ide/troubleshooting"]},
  "C2":{"s":2,"r":1.0,"ra":2,"conf":"M","ev":"D","first_unmet":"No explicit scope/non-goals; no resolve-or-record step for open questions","cites":["https://kiro.dev/docs/specs/feature-specs","https://kiro.dev/docs/specs/feature-specs/requirements-first","https://kiro.dev/docs/specs/analyze-requirements"]},
  "C3":{"s":2,"r":1.0,"ra":2,"conf":"M","ev":"D","first_unmet":"No test-first or per-task test obligation; no simplicity rule","cites":["https://kiro.dev/docs/specs/feature-specs","https://kiro.dev/docs/specs/correctness"]},
  "C4":{"s":2,"r":1.0,"ra":2,"conf":"M","ev":"D","first_unmet":"No fresh-evidence gate or DoD on default path","cites":["https://kiro.dev/docs/specs/feature-specs/requirements-first","https://kiro.dev/docs/specs/correctness","https://kiro.dev/docs/cli/chat/goal"]},
  "C5":{"s":2,"r":1.0,"ra":2,"conf":"M","ev":"D","first_unmet":"No default-path independent review with checklist and severity","cites":["https://kiro.dev/docs/ide/chat/autopilot","https://kiro.dev/docs/privacy-and-security","https://kiro.dev/docs/cli/headless"]},
  "C6":{"s":2,"r":1.0,"ra":2,"conf":"M","ev":"D","first_unmet":"Bounded loop (/goal) is opt-in; default loops unbounded","cites":["https://kiro.dev/docs/cli/chat/goal","https://kiro.dev/docs/specs/feature-specs"]},
  "C7":{"s":3,"r":1.0,"ra":3,"conf":"M","ev":"D","first_unmet":"No integration step/conflict rule; no impact analysis from map","cites":["https://kiro.dev/docs/specs","https://kiro.dev/docs/steering","https://kiro.dev/docs/tools/code-intelligence"]},
  "C8":{"s":2,"r":1.0,"ra":2,"conf":"M","ev":"D","first_unmet":"No preflight checks; no explicit halt-condition list","cites":["https://kiro.dev/docs/web/autonomous-mode","https://kiro.dev/docs/cli/headless","https://kiro.dev/docs/permissions"]},
  "C9":{"s":2,"r":1.0,"ra":2,"conf":"M","ev":"D","first_unmet":"No stable IDs across task, test and commit","cites":["https://kiro.dev/docs/specs/feature-specs","https://kiro.dev/docs/specs/correctness"]},
  "C10":{"s":2,"r":1.0,"ra":2,"conf":"M","ev":"D","first_unmet":"Approvals not recorded; no owner roles","cites":["https://kiro.dev/docs/specs/feature-specs","https://kiro.dev/docs/specs/plan"]},
  "C11":{"s":2,"r":1.0,"ra":2,"conf":"M","ev":"D","first_unmet":"No security step in spec/review on default path","cites":["https://kiro.dev/docs/privacy-and-security","https://kiro.dev/docs/mcp/security","https://kiro.dev/docs/permissions"]},
  "C12":{"s":1,"r":1.0,"ra":1,"conf":"M","ev":"D","first_unmet":"No release checklist or deployment guidance","cites":["https://kiro.dev/docs/steering"]},
  "C13":{"s":3,"r":1.0,"ra":3,"conf":"M","ev":"D","first_unmet":"No single-source-of-truth rule","cites":["https://kiro.dev/docs/steering","https://kiro.dev/docs/compaction","https://kiro.dev/docs/custom-agents/subagents"]},
  "C14":{"s":3,"r":1.0,"ra":3,"conf":"M","ev":"D","first_unmet":"Risk is advisory, not a forcing trigger","cites":["https://kiro.dev/docs/specs/plan","https://kiro.dev/docs/specs/quick-spec","https://kiro.dev/docs/specs/best-practices"]},
  "C15":{"s":2,"r":1.0,"ra":2,"conf":"M","ev":"D","first_unmet":"Single proprietary agent platform","cites":["https://kiro.dev/docs/how-kiro-works","https://kiro.dev/docs/skills","https://kiro.dev/docs/hooks"]},
  "C16":{"s":2,"r":1.0,"ra":2,"conf":"L","ev":"D","first_unmet":"No retrospective with owned actions","cites":["https://kiro.dev/docs/memory"]}
 }}
```
