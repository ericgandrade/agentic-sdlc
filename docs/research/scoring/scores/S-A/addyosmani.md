# Scorecard — Addy Osmani agent-skills

| Field | Value |
|---|---|
| Method / version | Addy Osmani agent-skills (addyosmani/agent-skills, plugin 0.6.16) @ 39b723ceebf81474d0557c1fecd01eddab585563 (commit date 2026-11-13) |
| Status | implemented |
| Scorer ID | S-A |
| Methodology version + sha256 | 1.0 / a6e3953725b67db0189e188c1495ee9b54975e48f65c28baaa01f459b69cf9a4 |
| Date | 2026-11-21 |
| Access | full (pinned clone). Eval result files are gitignored; measured eval outcomes are taken from evals/README.md as written at the pin. |
| Conflict declaration | None. I did not author, plan, promote or receive positioning briefings for this method or any competing method. My model vendor (Anthropic) does not publish this method. |
| Criterion order used | C6 C5 C1 C7 C3 C9 C4 C8 C15 C13 C2 C14 C16 C11 C12 C10 |

## Default path trace (scenario R)

1. Install as a plugin (2 commands) or `npx skills add`; entry points are the lifecycle commands `/spec → /plan → /build → /test → /review → /ship` and the `using-agent-skills` router (brownfield teams follow docs/adoption-guide.md Path B: rules file first, then the same lifecycle for new features).
2. `/spec`: clarifying questions, surfaced assumptions, SPEC.md with six core areas, Success Criteria ("specific, testable"), Boundaries (always / ask first / never), Out of Scope, Open Questions; stop the turn and wait for approval (delta spec `SPEC-<change>.md` if SPEC.md already exists).
3. `/plan`: read-only plan mode, dependency graph, vertical slices, tasks with acceptance criteria, verification commands, dependencies, size; checkpoints every 2–3 tasks; saved to tasks/plan.md and tasks/todo.md; human review.
4. `/build` (per task) or `/build auto` (one approval, then all tasks in dependency order): RED → GREEN → full suite → build → commit → mark complete; halts on failure, ambiguity or high-risk steps.
5. `/review`: five-axis review (correctness, readability, architecture, security, performance) with severity labels, run in the main session.
6. `/ship`: parallel fan-out to code-reviewer, security-auditor and test-engineer personas in fresh contexts, merged into GO/NO-GO with a mandatory rollback plan; shipping-and-launch covers flags, staged rollout, thresholds and monitoring.

## Scores

| ID | Criterion | Score (D) | r | RA | Conf | Ev. type | Evidence | Rationale: requirements met per level; first unmet requirement |
|---|---|---|---|---|---|---|---|---|
| C1 | Ease of adoption | 2 | 1.0 | 2 | M | I | README.md #Quick Start, #Commands; skills/using-agent-skills/SKILL.md; docs/getting-started.md; per-platform setup docs with Troubleshooting (docs/cursor-setup.md, copilot-cli-setup.md) | L1–2: install in 1–2 commands; stated first commands (`/spec` … `/ship`); core reading load ≈4k words. **First unmet (L3):** no quickstart that walks one task end to end as a worked example (README lists commands; getting-started covers loading a skill). |
| C2 | Requirements and specification | 3 | 1.0 | 3 | M | I | skills/spec-driven-development/SKILL.md (#Phase 1 Specify, spec template, "Stop after writing the spec", #Spec Evolution, #Verification); .claude/commands/spec.md; using-agent-skills #2 Manage Confusion | L3: default-path SPEC.md with required "specific, testable" Success Criteria, Out of Scope, Open Questions recorded, clarification and surfaced assumptions before building. Partial L4: stop on ambiguity (STOP / `/build auto` halts on ambiguous spec); change control by versioned spec (V[N]) and delta specs with Status lines. **First unmet (L4):** no independent critique of the spec (the verification checklist is self-run; human approval belongs to C10). |
| C3 | Code quality practices | 5 | 1.0 | 5 | M | I | skills/test-driven-development/SKILL.md (RED must fail, Prove-It, mocks only at boundaries, Test Anti-Patterns, REFACTOR, rationalizations); .claude/commands/build.md; skills/api-and-interface-design; planning template "Architecture Decisions"; using-agent-skills #4 Enforce Simplicity; incremental-implementation (naive version first); code-review Step 2 mutation check; evals/README.md (behavioural evals with pressure cases; measured with/without results) | L3: `/build` requires RED→GREEN per task; design discipline (contract-first, architecture decisions in plan, ADR skill); simplicity rules. L4: failing test observed; mock limits; anti-pattern catalogue; refactor step; rationalization table in every skill. L5: evals measure behaviour change from the instructions (e.g. TDD failing-test-first 2/4 with plugin vs 0/3 without; simplify 3/3 vs 0/3), with time/sunk-cost/authority pressure cases. Confidence M: results are reported in README, raw results gitignored. |
| C4 | Verification and evidence | 3 | 1.0 | 3 | M | I | .claude/commands/build.md (full suite + build after GREEN, before commit); references/definition-of-done.md (DoD vs acceptance criteria); using-agent-skills #6 Verify, Don't Assume; planning task "Verification" block | L3: completion requires test and build output after the change; standing DoD distinct from per-task acceptance criteria; "a task is not complete until verification passes". **First unmet (L4):** no explicit "cannot verify" status for completion claims, and the default-path check of the implementer's verification is done in the authoring context (`/review` runs in the main session). |
| C5 | Code review rigor | 2 | 1.0 | 2 | L | I | .claude/commands/review.md; skills/code-review-and-quality/SKILL.md; docs/agents.md ("/review and /test … run in the main session"); .claude/commands/ship.md | L1–2: a multi-axis review with severity labels and "Critical/Required resolved before merge" exists on the default path, but it runs in the authoring context. **First unmet (L3):** independent-context review before merge. Independent parallel personas with merge/dedup and default NO-GO exist in `/ship`, a pre-launch gate whose own checklist expects "Code reviewed and approved" beforehand; direct persona invocation is opt-in. Flagged contestable: if `/ship` were read as the pre-merge review, L3–L4 ((a) merge/dedup, (b) finding verification and justified deferral) would be met. |
| C6 | Loop engineering | 3 | 1.0 | 3 | M | I | skills/doubt-driven-development/SKILL.md #Step 5 (3 cycles, escalate to user, "doubt theater" signal, decompose if too big); .claude/commands/build.md step 6 (no obvious fix → debugging skill, stop and ask); skills/debugging-and-error-recovery (stop-the-line, reproduce → localize → reduce → fix → guard) | L2–3: ≥2 loops with exit criteria and a bound or breaker plus escalation: doubt loop (stop at trivial findings or 3 cycles → user); build/debug loop (tests green; breaker "no obvious fix" → user). **First unmet (L4):** no state carried between iterations (what was tried) and no scoped re-check after a fix; root-cause loopback only partial. Confidence M: doubt-driven is listed in the lifecycle for non-trivial decisions but triggered by stakes. |
| C7 | Graph engineering | 3 | 1.0 | 3 | M | I | skills/planning-and-task-breakdown/SKILL.md (#Step 2 dependency graph, task Dependencies field, #Parallelization Opportunities); build.md auto step 5 ("Execute every task in dependency order"); spec-driven-development #Phase 0 capability map (module ids, depends-on, no cycles) and spec "Project Structure"; context-engineering "Project Map" | L2–3: E used (dependency order drives execution; sequential-vs-parallel rule for shared state); K declared (spec Project Structure map; capability map module graph for multi-capability work). **First unmet (L4):** the codebase map is not used for impact analysis feeding the plan or test selection, and no parallel frontier dispatch with integration. |
| C8 | Autonomous execution safety | 2 | 1.0 | 2 | M | I | .claude/commands/build.md #Autonomous (`/build auto`): require spec, `git status --porcelain` clean baseline, single approval, halt list, one commit per task, resume by re-invoking | L2: unattended mode with several safeguards (clean-tree preflight, explicit halt conditions incl. deploys/secrets/irreversible, per-task commits, resumable from todo state). **First unmet (L3):** no isolation (no branch, worktree or sandbox requirement) and no baseline test run in preflight. |
| C9 | Traceability end to end | 2 | 1.0 | 2 | M | I | spec-driven-development (stable module ids; "Every module spec traces to a module id"; "Reference the spec in PRs"); planning template "Source spec:" line, Task N | L1–2: stable module ids and task numbers; plan → spec link by path. **First unmet (L3):** no stable requirement or criterion IDs carried through task, test and commit; PR linking is advice to cite a spec section. |
| C10 | Human governance | 2 | 1.0 | 2 | H | I | spec-driven-development "STOP YOUR TURN"; planning checkpoints "Review with human before proceeding"; build.md auto step 4 (unambiguous affirmative only); doubt-driven sign-off for high-risk steps; definition-of-done "human has reviewed and approved before merge or deploy"; ship.md "Acknowledged risks" | L1–2: defined stop points where the agent waits, including a strict approval-wording rule. **First unmet (L3):** approvals are not recorded in an artifact (who, when, which version), and only "the human" is named as owner. |
| C11 | Security by default | 3 | 1.0 | 3 | M | I | review.md / code-review-and-quality #4 Security and #Dependency Discipline; spec Boundaries ("Never: commit secrets"; "Ask first: adding dependencies"); definition-of-done Ship-readiness; skills/security-and-hardening (Threat Model First, STRIDE, OWASP Top 10, LLM01–LLM10); references/security-checklist.md; agents/security-auditor.md | L3: security on the default path (spec boundaries and DoD, security axis in review, secret rules, dependency hygiene incl. lockfile review and audits). Partial L4: risk-triggered STRIDE threat model, OWASP mapping, prompt-injection and scoped tool-permission items, dependency provenance. **First unmet (L4):** controls target the product's LLM features rather than the coding agent itself, and provenance of skills is not addressed (borderline). |
| C12 | Release and operations | 3 | 1.0 | 3 | M | I | .claude/commands/ship.md (rollback plan mandatory before GO); skills/shipping-and-launch (pre-launch checklist, feature-flag lifecycle, staged rollout, rollout decision thresholds, error-budget gate); skills/observability-and-instrumentation (RED metrics, symptom alerts, runbooks); references/observability-checklist.md | L3: release step with required rollback plan, staged rollout and feature flags, observability defined before release. Partial L4: runbooks updated on incident close; GO/NO-GO decision. **First unmet (L4):** no defined intake of production signals into the backlog or spec, and no incident procedure with postmortem beyond a pointer to debugging. |
| C13 | Context engineering and token efficiency | 5 | 1.0 | 5 | M | I | README #How Skills Work (progressive disclosure); skills/context-engineering (context hierarchy, Restartable Session Boundaries, Context Budget Management); SPEC.md / tasks/plan.md / todo.md hand-offs; ship.md (fresh persona contexts, report only); references/orchestration-patterns.md; scripts/lib/skill-lint.js (500-line context budget, 1,024-char description) run in .github/workflows/test-plugin-install.yml | L3: systematic progressive disclosure; file hand-offs; fresh subagents with explicit briefs. L4: size budgets; restart/resume protocol (persist state, re-run stale verification); role rules (personas return only reports, never invoke personas); single-source rules ("canonical source … takes precedence"). L5: the skill size budget is flagged by a validator in CI (warning-level flag, which the definition of enforcement accepts). |
| C14 | Right-sizing and brownfield | 3 | 1.0 | 3 | M | I | spec-driven-development "When NOT to use" (single-line fixes) and ">30 minutes" trigger; using-agent-skills (bug-fix route); ship.md rule 5 (skip fan-out only if ≤2 files, <50 lines, and no auth/payments/data/config); planning task sizing XS–XL; docs/adoption-guide.md Path B (rules file of real conventions, characterization tests before change) | L3: explicit routing among paths with stated size and risk criteria; brownfield entry procedure documenting conventions. Partial L4: risk triggers force the heavier review regardless of size; characterization tests. **First unmet (L4):** no escalation rule when work outgrows a light path, and no regression-selection artifact. |
| C15 | Portability and extensibility | 4 | 1.0 | 4 | M | I | README #Project Structure (Claude Code, Gemini, Antigravity, Codex, Copilot CLI adapters; Cursor/OpenCode/Windsurf guides); .gemini/commands, commands/, .codex-plugin; ship.md persona resolution (user agents override plugin); docs/advanced-per-agent-configuration.md; CONTRIBUTING.md; docs/skill-anatomy.md; CI validators | L3: ≥3 platforms, plain Markdown, documented extension. L4: per-platform adapters, customization layer that survives upgrades (user-level personas take precedence; per-agent configuration outside SKILL.md), contribution guide with authoring standards. Partial L5: CI validates skills, command parity and manifests. **First unmet (L5):** no versioned extension interface (the skill format is specified but not versioned). |
| C16 | Learning loop and measured outcomes | 1 | 1.0 | 1 | M | I | observability-and-instrumentation "Keep runbooks current … update as part of closing every incident"; debugging "guard" step; evals/skill-impact.md (maintainer ledger of rejected skill changes) | L1: advice to capture lessons (runbook updates after incidents; regression guards). **First unmet (L2):** no retrospective template or lessons file for the delivery cycle (the skill-impact ledger serves the pack's maintainers, not the adopting team). |

## Concreteness test (design-only)
n/a

## Weakest criteria
1. C16 Learning loop — 1: no retrospective or lessons mechanism for the adopting team.
2. C5 Code review rigor — 2: pre-merge review runs in the authoring context; independent fan-out only at `/ship`.
3. C1 / C8 / C9 / C10 — 2: no end-to-end quickstart; `/build auto` lacks isolation; no requirement IDs; approvals unrecorded.

## Realization risks (design-only)
n/a

## Claims not scored
| Claim | Source | Reason |
|---|---|---|
| "Every change gets reviewed before merge — no exceptions" with independent reviewer | code-review-and-quality Overview | Default-path `/review` runs in the main session; independence only via opt-in persona or `/ship` |
| constraint-driven-development quality gate (`quality-gate.mjs`, CONSTRAINTS.md, floor guard) | skills/constraint-driven-development | Opt-in skill ("No quality bar written down?"); not needed for the C3 score, which rests on measured evals |
| Staged secret scans | scripts/staged-secret-scan-test.js | Tests that docs describe a scan; not a gate wired into the adopting project |
| Head-to-head experiment vs Superpowers | README #How it compares (LinkedIn link) | Third-party post, S evidence; not scored |
| SessionStart router hook | hooks/session-start.sh | Explicitly "Not wired by the plugin" |

## Search log
| Criterion | Paths / probe terms | Hits used | Hits rejected (reason) |
|---|---|---|---|
| C1 | README, quick start, getting started, troubleshoot, doctor | README, getting-started, using-agent-skills, setup docs | developer-onboarding (contributors, not users) |
| C2 | spec, success criteria, open questions, delta, ambiguity | spec-driven-development, spec.md command | idea-refine / interview-me (optional upstream) |
| C3 | TDD, RED, mock, refactor, rationalization, simplicity, eval | test-driven-development, build.md, evals/README.md | constraint-driven quality gate (opt-in) |
| C4 | verify, evidence, DoD, cannot verify | build.md, definition-of-done.md | source-driven "unverified" (doc citations, not completion) |
| C5 | review, severity, persona, fan-out, dedup, sycophan | review.md, code-review-and-quality, docs/agents.md, ship.md | Multi-Model Review Pattern (optional) |
| C6 | loop, cycle, cap, escalate, stop | doubt-driven Step 5, build.md step 6, debugging | — |
| C7 | dependency, graph, parallel, capability map, project map | planning, build auto, spec Phase 0, context-engineering | — |
| C8 | auto, autonomous, halt, resume, baseline, worktree | build.md autonomous section | — |
| C9 | trace, module id, source spec, PR reference | spec-driven-development, planning template | — |
| C10 | approve, checkpoint, sign-off, stop your turn | spec, planning, build auto, doubt-driven, DoD | — |
| C11 | security, threat, STRIDE, OWASP, injection, secret, provenance | security-and-hardening, security-checklist, security-auditor, review | — |
| C12 | deploy, rollback, flag, canary, monitor, incident, runbook, SLO | ship.md, shipping-and-launch, observability | — |
| C13 | context, budget, compact, restart, subagent, progressive | context-engineering, skill-lint, CI workflow, ship.md | — |
| C14 | size, risk, small, brownfield, legacy, characterization | spec "When NOT", ship rule 5, adoption-guide | — |
| C15 | platform adapters, customize, contributing, validate | README, adapter dirs, CONTRIBUTING, CI workflow | — |
| C16 | retro, lessons, metrics, DORA | observability runbook rule, skill-impact.md | idea-refine example about retros (sample content) |

## Files read
| Path | Words | Read (full / partial) |
|---|---|---|
| README.md | 2894 | full |
| .claude/commands/spec.md, plan.md, build.md, test.md, review.md, ship.md | 1894 | full |
| .claude-plugin/plugin.json | 46 | full |
| skills/using-agent-skills/SKILL.md | 1229 | full |
| skills/spec-driven-development/SKILL.md | 2565 | full |
| skills/planning-and-task-breakdown/SKILL.md | 1719 | full |
| skills/incremental-implementation/SKILL.md | 1453 | partial |
| skills/test-driven-development/SKILL.md | 2455 | partial (outline + key sections) |
| skills/code-review-and-quality/SKILL.md | 3354 | partial (process, severity, honesty, dependency, verification) |
| skills/shipping-and-launch/SKILL.md | 1762 | partial |
| skills/security-and-hardening/SKILL.md | 2493 | partial (grep) |
| skills/context-engineering/SKILL.md | 2246 | partial (outline) |
| skills/doubt-driven-development/SKILL.md | 2558 | partial (grep) |
| skills/debugging-and-error-recovery/SKILL.md | 1655 | partial |
| skills/observability-and-instrumentation/SKILL.md | 2133 | partial (grep) |
| references/definition-of-done.md | 627 | full |
| references/security-checklist.md | 2066 | partial (grep) |
| agents/code-reviewer.md, security-auditor.md | 1308 | partial |
| docs/agents.md | 978 | partial |
| docs/adoption-guide.md | 1572 | partial |
| docs/getting-started.md, developer-onboarding.md | 2952 | outline |
| evals/README.md, evals/skill-impact.md | 3899 | partial / full |
| hooks/session-start.sh, SDD-CACHE.md, SIMPLIFY-IGNORE.md | 2119 | partial |
| scripts/validate-skills.js, scripts/lib/skill-lint.js, scripts/lib/execution-status.js | 4126 | partial |
| .github/workflows/test-plugin-install.yml | 579 | partial |
| docs/research/inventory/addyosmani.md | 26398 | not relied on (direct source read instead) |

## Machine-readable
```json
{"method":"addyosmani","version":"39b723ceebf81474d0557c1fecd01eddab585563","status":"implemented","scorer":"S-A",
 "methodology_sha256":"a6e3953725b67db0189e188c1495ee9b54975e48f65c28baaa01f459b69cf9a4",
 "scores":{
  "C1":{"s":2,"r":1.0,"ra":2,"conf":"M","ev":"I","first_unmet":"No end-to-end worked quickstart","cites":["README.md#quick-start","skills/using-agent-skills/SKILL.md","docs/getting-started.md"]},
  "C2":{"s":3,"r":1.0,"ra":3,"conf":"M","ev":"I","first_unmet":"No independent critique of the spec","cites":["skills/spec-driven-development/SKILL.md#phase-1-specify","skills/spec-driven-development/SKILL.md#spec-evolution-v1-scoping-and-follow-up-changes"]},
  "C3":{"s":5,"r":1.0,"ra":5,"conf":"M","ev":"I","first_unmet":"none","cites":["skills/test-driven-development/SKILL.md",".claude/commands/build.md","evals/README.md#plugin-evals-claude-code"]},
  "C4":{"s":3,"r":1.0,"ra":3,"conf":"M","ev":"I","first_unmet":"No cannot-verify status; verification checked in authoring context","cites":[".claude/commands/build.md","references/definition-of-done.md"]},
  "C5":{"s":2,"r":1.0,"ra":2,"conf":"L","ev":"I","first_unmet":"Pre-merge review not in an independent context","cites":[".claude/commands/review.md","docs/agents.md","skills/code-review-and-quality/SKILL.md",".claude/commands/ship.md"]},
  "C6":{"s":3,"r":1.0,"ra":3,"conf":"M","ev":"I","first_unmet":"No state carried between iterations or scoped re-check","cites":["skills/doubt-driven-development/SKILL.md#step-5-stop--bounded-loop-not-recursion",".claude/commands/build.md"]},
  "C7":{"s":3,"r":1.0,"ra":3,"conf":"M","ev":"I","first_unmet":"Code map not used for impact analysis; no parallel frontier dispatch","cites":["skills/planning-and-task-breakdown/SKILL.md#step-2-identify-the-dependency-graph","skills/spec-driven-development/SKILL.md#phase-0-scope-check"]},
  "C8":{"s":2,"r":1.0,"ra":2,"conf":"M","ev":"I","first_unmet":"No isolation; no baseline tests in preflight","cites":[".claude/commands/build.md#autonomous-the-whole-plan-build-auto"]},
  "C9":{"s":2,"r":1.0,"ra":2,"conf":"M","ev":"I","first_unmet":"No stable requirement IDs across three segments","cites":["skills/spec-driven-development/SKILL.md","skills/planning-and-task-breakdown/SKILL.md#plan-document-template"]},
  "C10":{"s":2,"r":1.0,"ra":2,"conf":"H","ev":"I","first_unmet":"Approvals not recorded; no named owner roles","cites":["skills/spec-driven-development/SKILL.md",".claude/commands/build.md","references/definition-of-done.md"]},
  "C11":{"s":3,"r":1.0,"ra":3,"conf":"M","ev":"I","first_unmet":"Agent-side controls and skill provenance not addressed","cites":["skills/code-review-and-quality/SKILL.md#dependency-discipline","skills/security-and-hardening/SKILL.md","references/security-checklist.md"]},
  "C12":{"s":3,"r":1.0,"ra":3,"conf":"M","ev":"I","first_unmet":"No production-signal intake into backlog; no postmortem procedure","cites":[".claude/commands/ship.md","skills/shipping-and-launch/SKILL.md","skills/observability-and-instrumentation/SKILL.md"]},
  "C13":{"s":5,"r":1.0,"ra":5,"conf":"M","ev":"I","first_unmet":"none","cites":["skills/context-engineering/SKILL.md","scripts/lib/skill-lint.js",".github/workflows/test-plugin-install.yml"]},
  "C14":{"s":3,"r":1.0,"ra":3,"conf":"M","ev":"I","first_unmet":"No escalation when work outgrows a light path; no regression selection","cites":["skills/spec-driven-development/SKILL.md#when-to-use",".claude/commands/ship.md","docs/adoption-guide.md"]},
  "C15":{"s":4,"r":1.0,"ra":4,"conf":"M","ev":"I","first_unmet":"No versioned extension interface","cites":["README.md#project-structure","docs/advanced-per-agent-configuration.md","CONTRIBUTING.md",".github/workflows/test-plugin-install.yml"]},
  "C16":{"s":1,"r":1.0,"ra":1,"conf":"M","ev":"I","first_unmet":"No retrospective template or lessons file","cites":["skills/observability-and-instrumentation/SKILL.md"]}
 }}
```
