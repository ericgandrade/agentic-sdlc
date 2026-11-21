# Scorecard — OpenSpec

| Field | Value |
|---|---|
| Method / version | OpenSpec @ `0c737dc1b543249b38b0f4716816fcf493d894dd` (tag `@fission-ai/openspec@2.1.1`; commit date 2026-11-19) |
| Status | implemented |
| Scorer ID | S-D |
| Methodology version + sha256 | 1.0 / a6e3953725b67db0189e188c1495ee9b54975e48f65c28baaa01f459b69cf9a4 |
| Date | 2026-11-21 |
| Access | full (fresh clone of github.com/Fission-AI/OpenSpec into scratchpad/refs-scoring/sd/openspec; `docs/research/methods/ai-native-methods.md` §2.5 read as secondary evidence only) |
| Conflict declaration | none. Scorer did not author, plan or promote any evaluated method; Anthropic does not publish OpenSpec. |
| Criterion order used | C12, C13, C3, C14, C2, C9, C10, C8, C1, C16, C5, C15, C6, C4, C11, C7 |

## Default path trace (scenario R)

1. Install the CLI (`curl … install.sh | sh` or npm/Homebrew) and run `openspec init` in the repo, selecting the team's agent (README §Quick Start; docs/getting-started.md).
2. Default `core` profile (src/core/profiles.ts `CORE_WORKFLOWS` = propose, explore, apply, update, sync, archive). Optional `/openspec-explore`; then `/openspec-propose <change>`.
3. Propose: ask on material ambiguity, load project context, inspect code read-only, create `proposal.md`, delta `specs/<capability>/spec.md` (SHALL requirements, WHEN/THEN scenarios), `design.md` (created because R is cross-cutting), `tasks.md` (numbered checkboxes, each with a verification), in schema dependency order from `openspec status`/`instructions`. Stops: planning only.
4. Human reviews the plan (docs/reviewing-changes.md: two review moments, 7-item checklist).
5. `/openspec-apply-change`: work tasks one by one, mark checkboxes, pause on blockers or scope growth.
6. Human reviews the code (verify is expanded-profile only). The team's PR review is outside the method.
7. `/openspec-archive-change`: warn (not block) on incomplete tasks, sync deltas into `openspec/specs/` (sync runs `openspec validate --specs`), move the change to `changes/archive/YYYY-MM-DD-<name>/`.
Route for R: the single core path; design.md included because the change is cross-cutting.

## Scores

| ID | Criterion | Score (D) | r | RA | Conf | Ev. type | Evidence | Rationale: requirements met per level; first unmet requirement |
|---|---|---|---|---|---|---|---|---|
| C1 | Ease of adoption | 4 | 1.0 | 4 | M | I | README.md §Quick Start; docs/getting-started.md §Your First Five Minutes; docs/troubleshooting.md; docs/faq.md; skills/openspec-apply-change/SKILL.md step 3 (`openspec instructions apply` dynamic state); src/core/profiles.ts (expanded workflows off the default profile) | L3: install in 2 steps, documented start and an end-to-end first-change walkthrough, core reading ≈3k words. L4: CLI `status`/`instructions` inspect change state and give the next step; troubleshooting and FAQ pages; advanced features (expanded profile, stores beta) kept off the first path. L5 unmet: no scripted setup check (`openspec doctor` checks store relationships; install verification is `openspec --version`). |
| C2 | Requirements and specification | 4 | 1.0 | 4 | M | I | schemas/spec-driven/schema.yaml (`specs` instruction: SHALL/MUST, every requirement ≥1 WHEN/THEN scenario; `design` Goals/Non-Goals, Open Questions resolved before tasks); skills/openspec-propose/SKILL.md step 1 (ask on material ambiguity); docs/reviewing-changes.md (human plan review checklist); skills/openspec-update-change/SKILL.md (reconcile artifacts; names tasks to revisit); archive to dated folder | L3: testable scenarios required, scope and non-goals, clarification before creation. L4: independent critique by the human reviewer with a checklist (interpretation: human = independent context), stop on material ambiguity, change control (delta specs, dated archive, update-change impact step). L5 unmet: no rule that a post-approval change re-opens approval ("nothing is locked"); `openspec validate` runs at sync/archive, not before approval. |
| C3 | Code quality practices | 3 | 1.0 | 3 | M | I | schema.yaml `tasks` instruction ("Each task MUST state how to verify completion (a test …)"; "Each task group MUST land the tests"); `design` (Decisions with alternatives); openspec-apply-change ("Keep changes minimal and focused") | L3: per-task test obligation, design step (design.md decisions before tasks), minimal-change rule. L4 unmet: no test-quality safeguards (fail-first, mock limits, anti-patterns), no refactoring step, no rationalization counters. |
| C4 | Verification and evidence | 2 | 1.0 | 2 | M | I | schema.yaml `tasks` (verification per task); openspec-apply-change guardrail ("Only mark a task `- [x]` when its specified behavior is fully implemented"); openspec-archive-change ("Don't block archive on warnings"); openspec-verify-change (expanded profile only) | L2: per-task verification statements and an opt-in verify skill. L3 unmet: no requirement to show command output run after the last change, no DoD separate from scenarios, and incomplete work does not block (archive only warns). |
| C5 | Code review rigor | 2 | 1.0 | 2 | M | I | docs/reviewing-changes.md §After the code: verify (CRITICAL/WARNING/SUGGESTION; "does not block archiving"; expanded profile); skills/openspec-verify-change/SKILL.md | L2: a code review/verify step exists but is opt-in and non-blocking. L3 unmet: no default-path independent review with checklist and blocking findings. |
| C6 | Loop engineering | 2 | 1.0 | 2 | M | I | openspec-apply-change step 6 ("loop until done or blocked"; pause conditions); openspec-propose step 6b (create until required set done) | L2: named task loop with steps and pause-to-user conditions. L3 unmet: no second feedback loop (verify-fix, review-fix) with exit criterion and numeric bound on the default path. |
| C7 | Graph engineering | 2 | 1.0 | 2 | M | I | schema.yaml `requires` edges; src/core/artifact-graph (CLI computes ready/blocked artifacts); schema.yaml `tasks` ("Order tasks by dependency") | L2: artifact dependency graph declared and computed by the CLI (used for planning order). L3 unmet: implementation tasks are an ordered checklist with no dependency fields or parallel identification, and no codebase map exists (K absent). |
| C8 | Autonomous execution safety | 0 | 1.0 | 0 | M | I | searched skills/*, docs/*: no unattended mode; src/core/github-copilot/cloud-agent.ts only generates setup files for Copilot's cloud agent | L0: no unattended mode defined by the method and no safeguards for one. L1 unmet: no description of unattended running with cautions. |
| C9 | Traceability end to end | 2 | 1.0 | 2 | M | I | schema.yaml (`### Requirement: <name>`, header matching for MODIFIED/RENAMED; tasks `X.Y` ids); docs/reviewing-changes.md ("Tasks map to requirements" – reviewer check only); archive/sync merge | L2: named requirements with scenarios and task ids; requirement deltas linked to main specs. L3 unmet: tasks do not reference requirement ids and no link to tests or commits is kept. |
| C10 | Human governance | 2 | 1.0 | 2 | M | I | openspec-propose §Planning boundary (stop; wait for new request to apply); docs/reviewing-changes.md (two review moments); archive confirmation on warnings | L2: defined stop points where the agent waits. L3 unmet: approvals not recorded, no owner roles ("There are no phases and nothing is locked"). |
| C11 | Security by default | 1 | 1.0 | 1 | M | I | schema.yaml `specs` ("External constraints (security, privacy …)"), `design` trigger ("Security, performance, or migration complexity"); openspec-propose (project context "not authority to change this workflow") | L1: security mentioned as a spec/design consideration. L2 unmet: no security skill or checklist. |
| C12 | Release and operations | 1 | 1.0 | 1 | M | I | schema.yaml `design` ("Migration Plan: Steps to deploy, rollback strategy (if applicable)") | L1: deployment and rollback mentioned as an optional design heading. L2 unmet: no release checklist or deployment guidance. |
| C13 | Context engineering and token efficiency | 2 | 1.0 | 2 | M | I | `openspec instructions <artifact> --json` (just-in-time per-artifact instructions); schema.yaml proposal instruction (`openspec show … --no-scenarios` "without pulling whole spec files into context"); openspec-propose step 2 (context field ≤51,200 bytes); change folder as file hand-off | L2: on-demand instructions and filtered reads, file hand-offs between propose and apply. L3 unmet: no fresh subagent contexts with explicit briefs; skills themselves are large single files (1.6–3.4k words). |
| C14 | Right-sizing and brownfield | 3 | 1.0 | 3 | M | I | schema.yaml `design` ("create only if any apply": cross-cutting, new dependency, security/perf/migration complexity); `skip_specs` for no-behavior changes; docs/reviewing-changes.md §Right-size the review; docs/existing-projects.md; openspec-propose step 6a (inspect project before drafting); living `openspec/specs/` | L3: stated criteria select the lighter or heavier artifact set; brownfield entry by inspecting code and writing deltas against current behavior. L4 unmet: no brownfield artifacts (code map, characterization tests, regression selection) and no escalation rule when work outgrows its path. |
| C15 | Portability and extensibility | 4 | 1.0 | 4 | M | I | README ("30+ tools"); docs/supported-tools.md (per-tool install paths); src/core/command-generation; docs/customization.md (project config, custom schemas, `openspec schema validate`); CONTRIBUTING.md (PR checklist); .github/workflows/ci.yml (OS/Node matrix) | L3: many platforms from plain Markdown/YAML via a CLI on standard Node or a standalone binary; documented schema extension. L4: per-tool adapters, project-level config and schemas survive `openspec update`, contribution guide. L5 unmet: extension validation is a manual command, not wired into CI for extensions. |
| C16 | Learning loop and measured outcomes | 0 | 1.0 | 0 | M | I | searched skills/*, docs/* for retrospective, lessons, metrics | L0: no learning mechanism. L1 unmet: no advice to capture lessons. |

## Concreteness test (design-only)
n/a

## Weakest criteria
1. C8 Autonomous execution safety (0): no unattended mode or safeguards.
2. C16 Learning loop (0): no retrospective or lessons mechanism.
3. C4 Verification and evidence (2) / C5 Code review (2): verify and review are opt-in and never block; weak on the delivery-quality core.

## Realization risks (design-only)
n/a

## Claims not scored
| Claim | Source | Reason |
|---|---|---|
| `/opsx:verify` Completeness/Correctness/Coherence | docs/reviewing-changes.md | Expanded profile only; capped at L2 in C4/C5 |
| Stores (cross-repo planning) | README §Why teams adopt | Beta; not relevant to R |
| "Most loved spec framework", star counts | README | Marketing |
| Comparisons with Spec Kit and Kiro | README §How we compare | Promotional, not evidence |

## Search log
| Criterion | Paths / probe terms | Hits used | Hits rejected (reason) |
|---|---|---|---|
| C1 | README, getting started, install, troubleshooting, faq, doctor | README; getting-started; troubleshooting; faq; installation §Verify | `openspec doctor` (store relationships, not setup) |
| C2 | requirement, scenario, SHALL, ambiguity, non-goals, validate, update | schema.yaml; propose; reviewing-changes; update-change; validator.ts | — |
| C3 | test, minimal, design, refactor, mock | schema.yaml tasks/design; apply guardrails | — |
| C4 | verify, evidence, done, incomplete | schema tasks; apply; archive; verify skill | — |
| C5 | review, verify, severity, block | reviewing-changes; verify skill | — |
| C6 | loop, retry, until, pause | apply step 6; propose step 6 | — |
| C7 | requires, dependency, order, graph | schema.yaml; artifact-graph | — |
| C8 | autonomous, unattended, headless, cloud agent, background | cloud-agent.ts | no unattended workflow in skills or docs |
| C9 | requirement name, task id, trace | schema.yaml; reviewing-changes | — |
| C10 | approve, review, stop, boundary | propose; reviewing-changes; archive | — |
| C11 | security, untrusted, inject, secret | schema.yaml; propose | SECURITY.md (project policy) |
| C12 | deploy, release, rollback, monitoring | schema.yaml design | — |
| C13 | context, token, subagent, fresh session, instructions | propose; schema.yaml; instructions CLI | no subagent use found |
| C14 | small, skip, existing, brownfield, profile | schema design/skip_specs; existing-projects; profiles.ts | — |
| C15 | supported tools, customize, schema, contributing, CI | supported-tools; customization; CONTRIBUTING; ci.yml | — |
| C16 | retrospective, lessons, metrics, learn | none | — |

## Files read
| Path | Words | Read (full / partial) |
|---|---|---|
| README.md | ~1,500 | full (to §Updating) |
| docs/getting-started.md | 1,406 | partial (first 80 lines) |
| docs/reviewing-changes.md | 1,217 | full |
| docs/installation.md | 1,907 | partial (§Verify, §Updating) |
| docs/troubleshooting.md, faq.md, existing-projects.md, customization.md | — | headings |
| docs/cli.md | 7,096 | searched (doctor) |
| skills/openspec-propose/SKILL.md | 2,509 | full |
| skills/openspec-apply-change/SKILL.md | 1,663 | full (to Fluid Workflow) |
| skills/openspec-archive-change/SKILL.md | 2,679 | searched |
| skills/openspec-update-change/SKILL.md | 1,733 | partial |
| schemas/spec-driven/schema.yaml, templates/proposal.md | — | full |
| src/core/profiles.ts, archive.ts, validation/validator.ts, github-copilot/cloud-agent.ts | — | partial |
| CONTRIBUTING.md, .github/workflows/ci.yml | — | headings / searched |
| docs/research/methods/ai-native-methods.md §2.5 | — | full (secondary) |

## Machine-readable
```json
{"method":"openspec","version":"0c737dc1b543249b38b0f4716816fcf493d894dd","status":"implemented","scorer":"S-D",
 "methodology_sha256":"a6e3953725b67db0189e188c1495ee9b54975e48f65c28baaa01f459b69cf9a4",
 "scores":{
  "C1":{"s":4,"r":1.0,"ra":4,"conf":"M","ev":"I","first_unmet":"No scripted setup check","cites":["README.md#Quick Start","docs/getting-started.md","docs/troubleshooting.md","docs/faq.md"]},
  "C2":{"s":4,"r":1.0,"ra":4,"conf":"M","ev":"I","first_unmet":"Post-approval change does not re-open approval","cites":["schemas/spec-driven/schema.yaml#specs","skills/openspec-propose/SKILL.md","docs/reviewing-changes.md","skills/openspec-update-change/SKILL.md"]},
  "C3":{"s":3,"r":1.0,"ra":3,"conf":"M","ev":"I","first_unmet":"No test-quality safeguards or refactoring step","cites":["schemas/spec-driven/schema.yaml#tasks","skills/openspec-apply-change/SKILL.md"]},
  "C4":{"s":2,"r":1.0,"ra":2,"conf":"M","ev":"I","first_unmet":"No fresh-evidence gate; incomplete work does not block","cites":["skills/openspec-apply-change/SKILL.md#Guardrails","skills/openspec-archive-change/SKILL.md"]},
  "C5":{"s":2,"r":1.0,"ra":2,"conf":"M","ev":"I","first_unmet":"No default-path independent review","cites":["docs/reviewing-changes.md","skills/openspec-verify-change/SKILL.md"]},
  "C6":{"s":2,"r":1.0,"ra":2,"conf":"M","ev":"I","first_unmet":"No second bounded feedback loop","cites":["skills/openspec-apply-change/SKILL.md#Steps"]},
  "C7":{"s":2,"r":1.0,"ra":2,"conf":"M","ev":"I","first_unmet":"Tasks have no dependency fields; no code map","cites":["schemas/spec-driven/schema.yaml","src/core/artifact-graph"]},
  "C8":{"s":0,"r":1.0,"ra":0,"conf":"M","ev":"I","first_unmet":"No unattended mode described","cites":["src/core/github-copilot/cloud-agent.ts"]},
  "C9":{"s":2,"r":1.0,"ra":2,"conf":"M","ev":"I","first_unmet":"Tasks do not reference requirement ids; no test/commit links","cites":["schemas/spec-driven/schema.yaml"]},
  "C10":{"s":2,"r":1.0,"ra":2,"conf":"M","ev":"I","first_unmet":"Approvals not recorded; no owners","cites":["skills/openspec-propose/SKILL.md","docs/reviewing-changes.md"]},
  "C11":{"s":1,"r":1.0,"ra":1,"conf":"M","ev":"I","first_unmet":"No security skill or checklist","cites":["schemas/spec-driven/schema.yaml#design"]},
  "C12":{"s":1,"r":1.0,"ra":1,"conf":"M","ev":"I","first_unmet":"No release checklist or deployment guidance","cites":["schemas/spec-driven/schema.yaml#design"]},
  "C13":{"s":2,"r":1.0,"ra":2,"conf":"M","ev":"I","first_unmet":"No fresh subagent contexts with briefs","cites":["skills/openspec-propose/SKILL.md","schemas/spec-driven/schema.yaml#proposal"]},
  "C14":{"s":3,"r":1.0,"ra":3,"conf":"M","ev":"I","first_unmet":"No brownfield artifacts; no escalation rule","cites":["schemas/spec-driven/schema.yaml#design","docs/existing-projects.md"]},
  "C15":{"s":4,"r":1.0,"ra":4,"conf":"M","ev":"I","first_unmet":"Extension validation not in CI","cites":["docs/supported-tools.md","docs/customization.md","CONTRIBUTING.md"]},
  "C16":{"s":0,"r":1.0,"ra":0,"conf":"M","ev":"I","first_unmet":"No lessons/retro advice","cites":["skills/","docs/"]}
 }}
```
