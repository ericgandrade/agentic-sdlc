# Scorecard — Superpowers

| Field | Value |
|---|---|
| Method / version | Superpowers (obra/superpowers) @ 22f0b463e7a5e579904dd6211a520321035526f7 (commit date 2026-11-03) |
| Status | implemented |
| Scorer ID | S-A |
| Methodology version + sha256 | 1.0 / a6e3953725b67db0189e188c1495ee9b54975e48f65c28baaa01f459b69cf9a4 |
| Date | 2026-11-20 |
| Access | full (pinned clone read; external `superpowers-evals` repo referenced by docs is not part of the pin and was not credited) |
| Conflict declaration | None. I did not author, plan, promote or receive positioning briefings for this method or any competing method. My model vendor (Anthropic) does not publish Superpowers (it is published by Prime Radiant / Jesse Vincent; distributed through Anthropic's plugin marketplace, which is distribution, not authorship). |
| Criterion order used | C4 C9 C1 C6 C15 C11 C12 C3 C16 C7 C8 C2 C14 C10 C13 C5 |

## Default path trace (scenario R)

1. SessionStart hook (`hooks/session-start`) injects `using-superpowers`; the "1% rule" forces skill invocation before any response.
2. "Add feature X" routes to `brainstorming`: Look Before You Ask (read the relevant code), one question at a time, approaches in their own message, Size the Work → for R (3–10 tasks) the "project" size: full written design at `docs/superpowers/specs/YYYY-MM-DD-<topic>-design.md`, fresh-subagent builder check, HARD-GATE human approval.
3. `using-git-worktrees`: consent, isolated worktree, project setup, clean baseline test run.
4. `writing-plans`: plan with header (Spec, Global Constraints, Review Focus), File Structure map, tasks with Interfaces blocks and RED/GREEN steps with Expected output; self-review; human reviews plan and picks executor. For R (production service, costly shipped mistake) the recommended route is subagent-driven-development (SDD); executing-plans (inline) is the alternative.
5. SDD: `sdd-workspace` ledger; pre-flight conflict scan; per task: `task-brief` → fresh implementer (TDD, report file) → `review-package` → fresh task reviewer (spec + quality verdicts) → fix loop (≤5 rounds, breaker) → ledger completion line.
6. Final whole-branch review on most capable model, one fix wave + scoped re-review; "Rulings I made" list.
7. `finishing-a-development-branch`: full suite, then menu (merge / PR / keep); for a team with mandatory review the PR option. Method ends at PR/merge.

## Scores

| ID | Criterion | Score (D) | r | RA | Conf | Ev. type | Evidence | Rationale: requirements met per level; first unmet requirement |
|---|---|---|---|---|---|---|---|---|
| C1 | Ease of adoption | 2 | 1.0 | 2 | M | I | README.md#Installation (one command per platform), #The Basic Workflow, #When Something Goes Wrong; skills/using-superpowers/SKILL.md (auto-injected router, 487 words); hooks/session-start | L1–2: install documented in 1–2 steps per harness; stated starting point (auto-injected using-superpowers; brainstorming activates on "build X"); core reading load ≈2.5k words. **First unmet (L3):** no quickstart that walks one task end to end as a worked example — README gives a 7-step conceptual list, not a worked run (borderline; scored lower per conservatism). L4 would also need in-tool next-step recommendation from project state. |
| C2 | Requirements and specification | 2 | 1.0 | 2 | H | I | skills/brainstorming/SKILL.md (#The Written Design, #Size the Work, #HARD-GATE, builder-check-prompt.md); SP-06..SP-14 | L1–2: clarification interview on the default path; design doc covers intent, goals, non-goals, anti-goals, constraints, approaches; fresh-subagent builder check. **First unmet (L3):** the spec artifact does not require testable acceptance criteria (no Given/When/Then, EARS or measurable-statement requirement); tests with exact values first appear in the plan, not the spec. |
| C3 | Code quality practices | 4 | 1.0 | 4 | M | I | skills/test-driven-development/SKILL.md (Iron Law, Verify RED mandatory, REFACTOR, rationalization table); writing-good-tests.md (name the break, real-thing/mock rules); writing-plans/SKILL.md (#File Structure, Interfaces block, YAGNI); implementer-prompt.md (Code Organization, YAGNI self-review) | L3: TDD required on default build path (plan steps RED→GREEN; TDD skill loaded); design discipline (File Structure map, Interfaces Consumes/Produces before code); simplicity (YAGNI, "minimal code", no over-engineering). L4: failing test observed before fix; mock limits; each test names the break; anti-pattern catalogue; refactor step; explicit rationalization counters. **First unmet (L5):** no lint/type/coverage/mutation gate wired by the method, and no in-repo eval showing the construction-practice instructions change behaviour (behaviour evals live in the external superpowers-evals repo, not at the pin; tests/claude-code integration test checks SDD ran and tests pass, not TDD/YAGNI compliance). |
| C4 | Verification and evidence | 4 | 1.0 | 4 | M | I | skills/verification-before-completion/SKILL.md (Gate Function, Iron Law); finishing-a-development-branch Step 1; implementer-prompt.md (TDD Evidence RED/GREEN in report); task-reviewer-prompt.md ("Do Not Trust the Report", "⚠️ Cannot verify from diff"); references/cannot-verify.md; writing-plans (test steps with spec values); executing-plans/scripts/task-done | L3: completion claims need fresh command output; TDD verification checklist separate from task text; failing suite stops finishing. L4: tests designed by the planner context (plan test steps with spec's exact values) rather than the implementer subagent; reviewer judges the diff, not the report; explicit "cannot verify" status routed to controller. **First unmet (L5):** on R's SDD route, completion is a controller-written ledger line with no deterministic gate; test evidence lives in a report file not bound to a SHA and the workspace is deleted at the end. (A deterministic gate, `task-done`, exists but only on the inline executing-plans route.) |
| C5 | Code review rigor | 4 | 1.0 | 4 | H | I | subagent-driven-development/SKILL.md #3–5; task-reviewer-prompt.md; re-review-prompt.md; references/fix-loop.md; requesting-code-review/code-reviewer.md; receiving-code-review/SKILL.md | L3: independent fresh reviewer per task on the default path, multi-axis (spec compliance, quality, tests, structure; security in final reviewer), severity scale, open Critical/Important block progress. L4: (b) every finding verified/triaged (fix, ruling, deferred minor in ledger; receiver verifies before implementing); (c) anti-sycophancy both ways (reviewer must not trust report or say "looks good" unchecked; receiver forbidden performative agreement); (d) scoped re-review after every fix round. **First unmet (L5):** (a) parallel lenses or reviewers with a merge and dedup step — review is sequential single-reviewer per stage. |
| C6 | Loop engineering | 4 | 1.0 | 4 | M | I | references/fix-loop.md (5 rounds, rounds 4–5 model escalation, breaker, ledger line per round); systematic-debugging/SKILL.md Phase 4.4–4.5 (≥3 failed fixes → question architecture with human); references/handling-reports.md (route by blocker type); executing-plans "plan wrong vs code wrong"; TDD red-green | L3: ≥2 loop types with exit criteria and bounds/breakers and escalation targets (review-fix: 5 rounds → adjudication; debug: 3 failed fixes → human). L4: loopback routing by cause (context / reasoning / too-large / plan-wrong; plan-vs-code); state carried (report file, "read what was tried"); scoped re-check; anti-thrash (3 fixes → architecture question; fresh stronger implementer). **First unmet (L5):** bounds are enforced only by prompt (no script/state machine), and loop efficacy measurements are in an external eval repo, not at the pin. |
| C7 | Graph engineering | 2 | 1.0 | 2 | M | I | writing-plans/SKILL.md (Interfaces Consumes/Produces); references/preflight.md (shared-file/interface pair table); SDD "Never dispatch multiple implementation subagents in parallel"; dispatching-parallel-agents (ad hoc independent failure domains) | L1–2: E declared: per-task Interfaces blocks state what each task consumes from earlier tasks; pre-flight scan tabulates task pairs sharing files/interfaces. **First unmet (L3):** no sub-dimension is *used* to decide order or parallel frontiers (SDD forbids parallel implementers) while the other is declared — there is no codebase/knowledge map artifact (K absent). |
| C8 | Autonomous execution safety | 3 | 1.0 | 3 | M | I | SDD/SKILL.md (Continuous execution; four stop conditions; Setup ledger); using-git-worktrees (isolation, baseline tests); references/preflight.md; references/resuming.md; scripts/sdd-workspace | L2–3: unattended continuous execution; preflight (clean baseline tests, conflict scan); isolation (worktree, consent); explicit halt list (irreversible/destructive, security-sensitive, external side effects such as merge/push/publish, broken plan); resumable ledger that survives compaction. **First unmet (L4):** no run-level budget control (iteration/time/token/cost cap for the run — the 5-round cap is a loop bound counted in C6) and no machine-readable run result distinguishing done/blocked/needs-human (per-task status only). |
| C9 | Traceability end to end | 2 | 1.0 | 2 | M | I | writing-plans header (Spec path), Task N headings, Self-Review "Spec coverage"; SDD ledger `Task <N>: complete (commits a..b …)` | L1–2: task IDs (Task N) linked to commits in the ledger and to named tests. **First unmet (L3):** no stable requirement IDs; spec→task coverage is a prose self-check; links do not span three segments with stable IDs (and the ledger is deleted after the run). |
| C10 | Human governance | 2 | 1.0 | 2 | H | I | brainstorming HARD-GATE; writing-plans Execution Handoff; using-git-worktrees consent; finishing-a-development-branch Step 4 (integration decision is the human's; typed `discard`) | L1–2: defined stop points where the agent waits (design approval, plan review/executor choice, integration choice). **First unmet (L3):** approvals are not recorded in an artifact (who, when, which version); only one undifferentiated role ("your human partner"). |
| C11 | Security by default | 1 | 1.0 | 1 | H | I | code-reviewer.md ("Security concerns?"); SDD four stops ("security-sensitive action"); receiving-code-review order (security first) | L1: general mentions of security. **First unmet (L2):** no security skill or checklist (no secret-handling, dependency-hygiene, threat-model or injection guidance for the delivered code). |
| C12 | Release and operations | 0 | 1.0 | 0 | H | I | finishing-a-development-branch (ends at merge/PR/keep); repo-wide grep for deploy/rollback/monitor/incident | L0: the method ends at merge or PR. **First unmet (L1):** deployment of the delivered change is not mentioned (code-reviewer "production readiness" asks about migrations/back-compat, which is a review lens, not deployment guidance). |
| C13 | Context engineering and token efficiency | 5 | 1.0 | 5 | M | I | SDD/SKILL.md (#The Task Loop: hand artifacts over as files; never make a subagent read the whole plan); scripts/task-brief, review-package; references/* loaded at the step; references/resuming.md + ledger; hooks/session-start (re-inject after compaction); tests/skill-size/test-skill-size.sh (20,000-byte limit); tests/claude-code/analyze-token-usage.py; writing-plans #Self-Review 5 Proportion | L3: systematic progressive disclosure (small SKILL.md, references read just in time), file hand-offs (spec → plan → brief → report → review package), fresh subagents with explicit briefs. L4: size budgets (skill size limit, plan proportion check), compaction/resume protocol, role context hygiene (implementer sees brief only; reviewer sees diff file only, no session history), single source of truth (brief holds exact values only once). L5: a validator enforces the skill size budget and token usage is measured by a shipped script. Confidence M: validator is a test script, not wired into CI. |
| C14 | Right-sizing and brownfield | 2 | 1.0 | 2 | M | I | brainstorming (#First: What Do You Actually Know?, #Size the Work table, "If it grows mid-task, stop… step up a size", #Look Before You Ask, Spike); writing-plans (#File Structure "In existing codebases, follow established patterns") | L1–2: light paths exist (quick clear task; small change with short doc; spike), plus mid-task escalation. **First unmet (L3):** routing criteria are not stated as size or risk criteria ("a small change" vs "a project" undefined; no risk axis), and brownfield entry is advice to read code, not a procedure producing a record of the existing system and its conventions. |
| C15 | Portability and extensibility | 4 | 1.0 | 4 | M | I | README.md #Installation (Claude Code, Codex, Cursor, Gemini, Copilot CLI, OpenCode, Kimi, Pi, …); skills/using-superpowers/references/*-tools.md; docs/porting-to-a-new-harness.md; writing-skills/SKILL.md; README #Contributing; .github/PULL_REQUEST_TEMPLATE.md; using-superpowers #User Instructions | L3: official support on ≥3 platforms with plain Markdown skills; documented extension (writing-skills). L4: per-platform tool maps; customization layer that survives upgrades (user instruction files take precedence over skills; plan/spec locations overridable) — borderline; contribution guide with authoring standards (writing-skills, PR template). **First unmet (L5):** no CI workflow validating skills (tests exist but `.github/` has no workflows) and no versioned extension interface. |
| C16 | Learning loop and measured outcomes | 2 | 1.0 | 2 | M | I | skills/diagnosing-superpowers/SKILL.md + templates/report.md, case.md | L1–2: an optional, templated post-session diagnosis with cited findings. **First unmet (L3):** no retrospective in the default cycle producing owned actions that change the project environment (diagnosis targets the plugin maintainers, opt-in). |

## Concreteness test (design-only)
n/a

## Weakest criteria
1. C12 Release and operations — 0: the method stops at merge/PR; no deployment, rollback or observability content.
2. C11 Security by default — 1: only incidental mentions; no security checklist, secret or dependency rules, or agent-specific threat controls.
3. C10 Human governance / C9 Traceability — 2: stop points exist but approvals are unrecorded and there are no stable requirement IDs.
(Ranked by score; benchmark medians are not visible to this scorer.)

## Realization risks (design-only)
n/a

## Claims not scored
| Claim | Source | Reason |
|---|---|---|
| Skill-behaviour evals (quorum/drill) prove TDD/YAGNI/loop behaviour | README #Contributing, docs/testing.md, docs/superpowers/specs/2026-07-15-sdd-fix-loop-redesign-design.md #Evals | External repo not at the pin; not read |
| Deterministic task-done gate counts for C4 L5 | skills/executing-plans/scripts/task-done | Real and read, but on the inline route, not the SDD route selected for R |
| "Mandatory workflows, not suggestions" | README | Prompt wording, not enforcement |
| Measured SDD workspace resume behaviour | docs/superpowers/specs/2026-07-06-sdd-plan-scoped-workspace-eval-results.md | Concerns ledger resumption, not a C8 L5 tested-resume script; and enforcement of authority limits is absent anyway |

## Search log
| Criterion | Paths / probe terms | Hits used | Hits rejected (reason) |
|---|---|---|---|
| C1 | README, install, quickstart, getting started, help, doctor | README #Installation, #Basic Workflow, #When Something Goes Wrong; using-superpowers | Muse "send Let's make a react todo list" (a verification hint for one harness, not a quickstart) |
| C2 | spec, acceptance, Given, EARS, non-goal, clarify, change log | brainstorming #Written Design, builder-check-prompt.md | writing-plans test values (plan, not spec) |
| C3 | TDD, red, green, refactor, mock, YAGNI, interface, rationaliz | test-driven-development/*, writing-plans, implementer-prompt | pre-commit config (evals Python only, not delivered code) |
| C4 | verify, evidence, fresh, cannot verify, DoD | verification-before-completion, task-reviewer, cannot-verify.md, task-done | — |
| C5 | review, severity, sycophan, re-review, triage | task-reviewer, re-review, fix-loop, code-reviewer, receiving-code-review | — |
| C6 | loop, round, cap, breaker, escalate, attempt | fix-loop.md, systematic-debugging, handling-reports | external eval claims |
| C7 | depends, parallel, graph, conflict, map | Interfaces block, preflight.md, dispatching-parallel-agents | dispatching-parallel-agents (debug failures, not plan graph) |
| C8 | autonomous, worktree, halt, resume, ledger, budget, push | SDD setup, four stops, worktrees, resuming.md | bounded waiting (not a budget) |
| C9 | trace, ID, link, coverage | Task N, ledger lines, Self-Review spec coverage | — |
| C10 | approve, gate, consent, sign-off, owner | HARD-GATE, plan handoff, finishing menu | — |
| C11 | security, secret, threat, OWASP, injection, untrusted | code-reviewer, four stops | diagnosing redaction-policy (transcript scrubbing for bug reports, not delivery security) |
| C12 | deploy, release, rollback, monitor, incident, flag | none in delivery skills | writing-skills "deployment" (of skills); debugging "add monitoring" (no-root-cause advice) |
| C13 | context, token, compaction, subagent, budget | SDD task loop, scripts, skill-size test, analyze-token-usage.py, session-start | — |
| C14 | small, size, quick, existing codebase, legacy | brainstorming sizing, Look Before You Ask | — |
| C15 | platform list, adapter, customize, contributing | README, references/*-tools.md, porting doc, writing-skills | — |
| C16 | retro, lessons, metric, DORA, improve | diagnosing-superpowers | writing-skills "variance is a metric" (skill authoring) |

## Files read
| Path | Words | Read (full / partial) |
|---|---|---|
| README.md | 1955 | full |
| skills/using-superpowers/SKILL.md | 487 | full |
| skills/brainstorming/SKILL.md | 2658 | full |
| skills/writing-plans/SKILL.md | 1630 | full |
| skills/subagent-driven-development/SKILL.md + references/*.md (8) | 2844 + 1721 | full |
| skills/subagent-driven-development/implementer-prompt.md, task-reviewer-prompt.md, re-review-prompt.md | 2987 | full |
| skills/subagent-driven-development/scripts/sdd-workspace | 770 | partial |
| skills/executing-plans/SKILL.md + scripts/task-done, task-start | 3415 | full |
| skills/test-driven-development/SKILL.md | 1464 | full |
| skills/test-driven-development/writing-good-tests.md | 1282 | partial |
| skills/verification-before-completion/SKILL.md | 556 | full |
| skills/requesting-code-review/SKILL.md + code-reviewer.md | 1332 | full |
| skills/receiving-code-review/SKILL.md | 894 | full |
| skills/finishing-a-development-branch/SKILL.md | 1243 | full |
| skills/using-git-worktrees/SKILL.md | 1064 | full |
| skills/systematic-debugging/SKILL.md | 1444 | partial (to Red Flags) |
| skills/dispatching-parallel-agents/SKILL.md | 860 | partial |
| skills/diagnosing-superpowers/SKILL.md | 1064 | partial |
| hooks/session-start | 574 | partial |
| tests/skill-size/test-skill-size.sh | 166 | full |
| tests/claude-code/test-subagent-driven-development-integration.sh | 1448 | partial (assertions) |
| docs/testing.md | 367 | full |
| docs/superpowers/specs/2026-07-06-sdd-plan-scoped-workspace-eval-results.md | 3377 | partial |
| docs/superpowers/specs/2026-07-15-sdd-fix-loop-redesign-design.md | 1597 | partial |
| .pre-commit-config.yaml | 63 | full |
| docs/research/inventory/superpowers.md | 20305 | partial (headings, What lines spot-checked) |

## Machine-readable
```json
{"method":"superpowers","version":"22f0b463e7a5e579904dd6211a520321035526f7","status":"implemented","scorer":"S-A",
 "methodology_sha256":"a6e3953725b67db0189e188c1495ee9b54975e48f65c28baaa01f459b69cf9a4",
 "scores":{
  "C1":{"s":2,"r":1.0,"ra":2,"conf":"M","ev":"I","first_unmet":"No quickstart walking one task end to end as a worked example","cites":["README.md#Installation","README.md#the-basic-workflow","skills/using-superpowers/SKILL.md"]},
  "C2":{"s":2,"r":1.0,"ra":2,"conf":"H","ev":"I","first_unmet":"Spec does not require testable acceptance criteria","cites":["skills/brainstorming/SKILL.md#the-written-design","SP-13","SP-14"]},
  "C3":{"s":4,"r":1.0,"ra":4,"conf":"M","ev":"I","first_unmet":"No lint/type/coverage gates and no in-repo eval of construction-practice instructions","cites":["skills/test-driven-development/SKILL.md","skills/test-driven-development/writing-good-tests.md","skills/writing-plans/SKILL.md#file-structure"]},
  "C4":{"s":4,"r":1.0,"ra":4,"conf":"M","ev":"I","first_unmet":"No deterministic completion gate or version-bound persisted evidence on the SDD route","cites":["skills/verification-before-completion/SKILL.md","skills/subagent-driven-development/task-reviewer-prompt.md","skills/subagent-driven-development/references/cannot-verify.md"]},
  "C5":{"s":4,"r":1.0,"ra":4,"conf":"H","ev":"I","first_unmet":"No parallel review lenses with merge/dedup","cites":["skills/subagent-driven-development/task-reviewer-prompt.md","skills/subagent-driven-development/re-review-prompt.md","skills/receiving-code-review/SKILL.md"]},
  "C6":{"s":4,"r":1.0,"ra":4,"conf":"M","ev":"I","first_unmet":"Bounds not enforced deterministically; efficacy not measured at the pin","cites":["skills/subagent-driven-development/references/fix-loop.md","skills/systematic-debugging/SKILL.md#phase-4"]},
  "C7":{"s":2,"r":1.0,"ra":2,"conf":"M","ev":"I","first_unmet":"No graph used to decide order/parallelism; no codebase map","cites":["skills/writing-plans/SKILL.md#task-structure","skills/subagent-driven-development/references/preflight.md"]},
  "C8":{"s":3,"r":1.0,"ra":3,"conf":"M","ev":"I","first_unmet":"No run-level budget caps and no machine-readable run result","cites":["skills/subagent-driven-development/SKILL.md#setup","skills/using-git-worktrees/SKILL.md","skills/subagent-driven-development/references/resuming.md"]},
  "C9":{"s":2,"r":1.0,"ra":2,"conf":"M","ev":"I","first_unmet":"No stable requirement IDs linked across three segments","cites":["skills/writing-plans/SKILL.md#self-review","skills/subagent-driven-development/SKILL.md#5-complete-the-task"]},
  "C10":{"s":2,"r":1.0,"ra":2,"conf":"H","ev":"I","first_unmet":"Approvals not recorded (who/when/version); no named owner roles","cites":["skills/brainstorming/SKILL.md#hard-gate","skills/finishing-a-development-branch/SKILL.md#step-4"]},
  "C11":{"s":1,"r":1.0,"ra":1,"conf":"H","ev":"I","first_unmet":"No security skill or checklist","cites":["skills/requesting-code-review/code-reviewer.md"]},
  "C12":{"s":0,"r":1.0,"ra":0,"conf":"H","ev":"I","first_unmet":"Deployment not mentioned","cites":["skills/finishing-a-development-branch/SKILL.md"]},
  "C13":{"s":5,"r":1.0,"ra":5,"conf":"M","ev":"I","first_unmet":"none","cites":["skills/subagent-driven-development/SKILL.md#the-task-loop","tests/skill-size/test-skill-size.sh","tests/claude-code/analyze-token-usage.py","hooks/session-start"]},
  "C14":{"s":2,"r":1.0,"ra":2,"conf":"M","ev":"I","first_unmet":"No stated size/risk routing criteria; brownfield entry only advice","cites":["skills/brainstorming/SKILL.md#size-the-work","skills/brainstorming/SKILL.md#look-before-you-ask"]},
  "C15":{"s":4,"r":1.0,"ra":4,"conf":"M","ev":"I","first_unmet":"No CI validation of skills; no versioned extension interface","cites":["README.md#installation","skills/using-superpowers/references/codex-tools.md","docs/porting-to-a-new-harness.md","skills/writing-skills/SKILL.md"]},
  "C16":{"s":2,"r":1.0,"ra":2,"conf":"M","ev":"I","first_unmet":"No retrospective in the default cycle producing environment-changing actions","cites":["skills/diagnosing-superpowers/SKILL.md"]}
 }}
```
