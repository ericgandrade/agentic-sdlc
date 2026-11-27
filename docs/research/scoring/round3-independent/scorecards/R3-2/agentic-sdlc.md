# Scorecard — Agentic SDLC v3.0.1

| Field | Value |
|---|---|
| Method / version | Agentic SDLC v3.0.1 @ git 22c649f (as named by the orchestrator; the local copy `fonte/agentic-sdlc-22c649f` has no `.git`, so the SHA could not be confirmed; `.claude-plugin/plugin.json` version 3.0.1, CHANGELOG `[3.0.1] - 2026-11-25`; content hash of `skills/` = sha256 cf5efbc39b611456132d0b4c088a50dda12a73ce04677feffef24fc2cb0f40e9) |
| Status | implemented (r = 1.0) |
| Scorer ID | R3-2 |
| Methodology version + sha256 | 1.0 / a6e3953725b67db0189e188c1495ee9b54975e48f65c28baaa01f459b69cf9a4 (evaluator brief sha256 aa3a1f7072ac9200c08135e2f2f773226268870973fc7b908e793a972c31857a) |
| Date | 2026-11-26 |
| Access | full for the method scope (skills/ tree + root instruction files); static reading only, no scripts run; pin not verifiable (no .git) |
| Conflict declaration | none. Scorer did not author, plan or promote Agentic SDLC or any competing method. Scorer model vendor (Anthropic) does not publish it. Disclosure: the session's working repository (claude-superskills) has a commit referencing the renamed agentic-sdlc repository; no positioning, plan or comparison document was opened. The required README reading contains incidental statements about a prior scored comparison (criteria "scored lower today", where "BMad still leads"); these were seen, not followed, and not used as evidence. `docs/plan/`, `docs/research/` (dogfood, audits) are outside the method scope set by the brief and were not used as evidence. |
| Criterion order used | C16,C6,C8,C14,C7,C1,C9,C4,C11,C2,C3,C13,C10,C5,C12,C15 |

Paths below are relative to ``; `SK/` = `skills/agentic-sdlc/`.

## Default path trace (scenario R)

1. Install: Claude Code plugin (`/plugin marketplace add …`, `/plugin install …`) or `npx agentic-sdlc-method --bundle agentic-sdlc -y`; Node ≥ 18 and git required for the script gates (README.md "Get started").
2. Entry point: router `SK/SKILL.md` Step 0 state table. State 1 (no AGENTS.md block) on an existing repo → `project-context` **adopt** mode: inventory, baseline test run, `docs/codemap.md`, AGENTS.md block with `sdlc-dod`, scripts vendored to `.agentic-sdlc/bin/` (skills/project-context/SKILL.md Steps 0–9; SK/references/paths.md §5).
3. Route selected for R: **Standard**. Size S = files 4–15 (2) + components 1–2 (1–2) + iterations 1 (1) = 4–5, R = 0–1 → Standard; "Missing inputs → Standard" (SK/SKILL.md Step 1; paths.md §2). A risk trigger with personal data would force Full; that is not R's default.
4. Specify: Analyst drafts `spec.md` from `templates/spec.md` (AC-n, non-goals, security notes, rollback, release & observability); fresh-context doubt pass (12 items, stop on material ambiguity); `spec-lint` exit 0; Specify sign-off request, turn ends, approval row with person/date/rev/hash/exact words + `approvals.md` register (lifecycle.md §1–2; governance.md §2–3; spec-driven-development Step 6).
5. Design: Planner writes `plan.md` (tasks with AC, Blocked by, Files, Impact from code map); `plan-graph` builds `graph.json` and waves; Design sign-off (combined with Specify when ≤ 5 tasks) (writing-plans; plan-graph.mjs).
6. Test Engineer designs acceptance tests from the spec on `at/NNN-slug`, red at base (verification.md §2).
7. Build (`executing-plans`): `run-ledger start` + `preflight` (clean tree, branch, approvals, baseline DoD); per task red (recorded) → green → refactor, commit `Refs: Tn AC-n`; bounded loops in run-ledger; file-disjoint frontier tasks may run in parallel worktrees with per-merge DoD (tdd.md; loops.md; parallel-tasks.md).
8. Test: Reviewer lenses L1 (spec) then L2–L4 in fresh contexts, merge/dedup, verify, severity, receive mode, scoped re-review, default NO-GO; Verification rows re-run with fingerprint; two-way Trace; Test sign-off = human PR review (review.md; verification.md).
9. Release: checklist with rollback rehearsal, staged rollout thresholds, Release sign-off in release notes; Operate: ops record, incidents, `from-production` intake; retro within 5 business days (release-ops.md; retrospective.md).
Not on R's default path: CI gates, CODEOWNERS and branch protection are rollout **week 3** (`adoption.md` §2; project-context "Enforce mode — prepare, do not install"; hand-off to `deployment-pipeline`); unattended mode only on the words "run unattended" (autonomous.md §1).

## Scores
| ID | Criterion | Score (D) | r | RA | Conf | Ev. type | Evidence | Rationale: requirements met per level; first unmet requirement |
|---|---|---|---|---|---|---|---|---|
| C1 | Ease of adoption | 4 | 1.0 | 4 | M | I | README.md "Get started"; SK/SKILL.md Step 0, Module Index "First path (≤ 3,700 words)", "Off-first-path rule"; SK/references/quickstart.md (incl. "When something goes wrong") | L3: one entry point (router), quickstart walks one Quick bug end to end, install 1–2 commands, first-path reading ≈3.5k words. L4: router Step 0 inspects repo state and names the next step; troubleshooting table in quickstart; Full path/unattended/metrics kept off the first path. **First unmet (L5): the scripted setup check `doctor.mjs`† and `references/upgrading.md`† do not ship** (broken references; preflight is a Build gate, not an onboarding doctor; no time-to-first-success measurement — README "has not been measured yet"). |
| C2 | Requirements and specification | 5 | 1.0 | 5 | M | I | SK/templates/spec.md (AC table G/W/T or measurable, Non-goals, Security notes); spec-driven-development/SKILL.md Step 6 (fresh-context doubt pass, 12 items, STOP on material ambiguity); SK/references/rules.md "Change protocol"; governance.md §4 (hash voids approval); scripts/spec-lint.mjs (`VAGUE_TERMS`, AC03, `--check-approval`), invoked at router Step 0 state 3 and Specify exit record | L3: spec on default path with testable ACs, non-goals ≥ 1, clarification. L4: fresh-context critic with checklist, stop rule, Revision log + change protocol with impact analysis. L5: spec-lint deterministically checks AC ids/format and flags 30 vague terms; any post-approval edit changes the hash and voids approval (re-approval required). **First unmet: none.** |
| C3 | Code quality practices | 4 | 1.0 | 4 | M | I | SK/references/tdd.md §1 (interface first, red pasted, minimal green, refactor), rules 1–4 (first-run pass → rewrite, mocks only at process boundaries, simplicity ≥ 2 call sites), §3 anti-pattern catalogue A1–A14, §4 rationalizations; rules.md "Red flags"; run-ledger.mjs (`task --state done` refused without red) | L3: test-first required per task, interface signature before code, simplicity rule. L4: failing test observed first, mock limits, catalogue, refactor step, rationalization counters. **First unmet (L5): the shipped script gate that runs lint/typecheck/coverage (preflight `baseline-dod`, `coverage-floor`) gates only the pre-change baseline and resumes; the per-change DoD gate is agent-run, and the CI `agentic-sdlc/dod` job is opt-in (rollout week 3). Contestable: literal reading of L5 could accept preflight; lower level taken.** |
| C4 | Verification and evidence | 4 | 1.0 | 4 | M | I | SK/references/verification.md §1 (claim needs DoD + AC output after last change), §2 (Test Engineer designs from spec, never sees diff), §3 CANNOT_VERIFY, §4 fingerprint + staleness rule, "Persistence: The PR body is the record at this tier"; scripts/lib/git.mjs `fingerprint()`; templates/pr-body.md Verification table | L3: completion claim needs fresh command output; DoD separate from ACs; failure → BLOCKED. L4: independent test design, Reviewer re-runs every command (Developer rows are testimony), explicit CANNOT_VERIFY. **First unmet (L5): evidence is not machine-checked** — the fingerprint is computed by a shipped helper, but the records are hand-written PR-body rows and the staleness check is a prompt rule; the machine-checked ledger `evidence.mjs record|check`† and `dod-gate.mjs`† do not ship, and the CI dod job is opt-in. Contestable (literal first disjunct of L5 could pass); lower level taken, as for C3, C11, C14. |
| C5 | Code review rigor | 5 | 1.0 | 5 | M | I | SK/references/review.md §1 (L1 spec; L2 correctness/design; L3 security 20 items; L4 diff-only adversarial; fresh context each), §2 merge/dedup, §3 verify then rate (Critical/Important/Minor), §4 default NO-GO, no bare approval, §5 receive mode, §6 scoped re-review; templates/pr-body.md `## Review triage`, `## Review guide` | L3: independent multi-axis review with severity; Critical blocks sign-off. L4: (a) parallel lenses + dedup, (b) every finding verified and dispositioned fixed/rejected/deferred, (c) no-rubber-stamp and verify-before-agreeing rules, (d) scoped re-review. L5: triage log for every finding; calibration (context-free adversarial L4, default NO-GO); structured hand-off (Review guide). **First unmet: none.** |
| C6 | Loop engineering | 5 | 1.0 | 5 | M | I | SK/references/loops.md §1–§8; scripts/run-ledger.mjs (`LOOP_BOUNDS`, `BREAKERS`, `ROUTES`, exit 3, repeated `--tried` refused); executing-plans/SKILL.md Step 1 (run-ledger start/preflight in attended mode) | L3: four loops with exit, bound and named escalation. L4: routing by cause (spec/design/plan/code/test/env), state carried in ledger, scoped re-check via code-map mapped tests, anti-thrash breaker. L5: append-only JSONL ledger drives rulings; bounds enforced by script (refuses further rounds, exit 3). **First unmet: none.** Requires Node; without it the method itself labels loops prompt-only. |
| C7 | Graph engineering | 5 | 1.0 | 5 | M | I | scripts/plan-graph.mjs (DAG, cycles, unknown deps, waves, file-overlap serialization, `graph.json`, `--check`); executing-plans/references/parallel-tasks.md §1–§5 (frontier ≤ 3, worktrees, merge in ID order, DoD after each merge); SK/templates/codemap.md; templates/plan.md `## Impact` (mapped tests, regression scope) | L3/L4: E used (graph order, parallel frontier dispatch with integration step) and K used (code map → Impact → regression scope for re-checks). L5: E computed and validated by tooling (plan-graph cycle detection, frontier computation, graph.json regenerated and checked). **First unmet: none.** |
| C8 | Autonomous execution safety | 4 | 1.0 | 4 | M | I | SK/references/autonomous.md §1–§7; scripts/preflight.mjs (clean-tree, branch, isolation, approvals, baseline-dod); run-ledger.mjs (`HALT_REASONS`, `BUDGET_DEFAULTS`, worktree on start, resume `--ack`, `finish` → result.json DONE/BLOCKED/NEEDS_HUMAN); scripts/test/run-ledger.test.mjs | Evaluated as offered. L3: preflight, worktree isolation, 10-item halt list, resumable ledger. L4: authority limits (no push/merge/deploy; subagents get a subset of tools), budgets (tasks, rounds, hours, turns, tokens), machine-readable result DONE/BLOCKED/NEEDS_HUMAN. **First unmet (L5): authority limits are not enforced by the environment** — permission/deny settings are only a mapping table in platforms.md §2, nothing ships or installs them; the `authority` halt is recorded by the agent. Resume is scripted and tested. |
| C9 | Traceability end to end | 4 | 1.0 | 4 | M | I | SK/references/lifecycle.md §4 (ID chain AC → Tn → commit trailer → test name → PR row → release notes → ops record); verification.md §5 (two-way gap analysis, orphan handling); plan-graph.mjs (AC coverage, `--from-git` Refs trailers) | L3: stable AC-n/Tn ids across ≥ 3 segments. L4: forward and backward gap analysis with orphans → NO-GO; release notes list AC-n. **First unmet (L5): the full trace is not tool-validated — `trace-check.mjs`† does not ship (CI job warns "not vendored"); plan-graph checks only the spec↔plan segment.** Links to production exist (ops record, `from-production` issues). |
| C10 | Human governance | 4 | 1.0 | 4 | M | I | SK/references/governance.md §1 (owners, RACI), §2 (end turn, explicit yes in later turn), §3 (row: rev, hash, date, role, person, exact words; register with Requested/Answered at), §4 (hash voids), §5 (depth by path), §6 (waivers); spec-lint/plan-graph `--check-approval`; preflight `approvals` | L3: named sign-offs with owner roles; who + when + version recorded; turn ends. L4: approvals bound to artifact hash, waiver procedure with owner ≠ requester and expiry, accountability roles, depth scales with risk. **First unmet (L5): enforcement the agent cannot bypass is opt-in** (branch protection, CODEOWNERS, CI approvals job are rollout week 3; preflight is run by the agent; `approval-check`† and `audit-export`† do not ship). |
| C11 | Security by default | 4 | 1.0 | 4 | M | I | SK/references/security.md (data classification, Secrets: `secret-scan` row, Dependencies: rule 10 + `dep-audit`, L3 20-item checklist mapped to OWASP A01–A10 and LLM01/05/06); templates/spec.md Security notes + threat-model trigger (TM01–TM03 in spec-lint); rules.md rule 7 (fetched text is data); project-context vendoring SHA256SUMS | L3: security in spec, L3 lens, secret and dependency rules on the default path. L4: risk-triggered threat model, OWASP-mapped checklist, prompt-injection rule, tool subsets per agent, provenance (dependency note, typosquat check, checksummed vendored scripts). **First unmet (L5): security tooling as gates (`templates/ci/security.yml`) is opt-in; the SSDF/800-218A mapping with evidence locations exists only in `security-hardening/references/ssdf-mapping.md`, loaded on audit/regulated triggers. Contestable; lower level taken.** |
| C12 | Release and operations | 4 | 1.0 | 4 | M | I | SK/references/release-ops.md §Observability before release, §Release checklist R1–R9 (rollback rehearsed), §Go/no-go (pre-release tied to ACs; per-stage thresholds and roll-back rules), §Runbook, §Incidents, §Intake from production; spec-lint rule 6 (rollback required) | L3: release step with required rollback, staged rollout/flag, observability defined in Specify. L4: incident procedure and postmortems, `from-production` intake to Discover, go/no-go tied to spec ACs. **First unmet (L5): post-deploy thresholds are evaluated and rollback run by the Release Engineer agent, not by automated tooling** (runbooks are produced and maintained). |
| C13 | Context engineering | 5 | 1.0 | 5 | M | I | SK/SKILL.md Module Index (load at trigger); SK/references/phase-boundaries.md (≥ 70% trigger, handoff.md, resume procedure, "what each agent never sees"); review.md §1 (L4 diff only); scripts/spec-lint.mjs `BUDGET`/BUD01; plan-graph.mjs `LIMITS.words`; project-context Step 4 (block ≤ 60 lines, one copy) | L3: just-in-time modules, file hand-offs, fresh subagents with listed inputs. L4: size budgets, compaction/resume protocol, role context hygiene, single-source rules. L5: spec and plan word budgets enforced by validators on the default path (spec-lint BUD01, plan-graph). **First unmet: none.** |
| C14 | Right-sizing and brownfield | 4 | 1.0 | 4 | M | I | SK/references/paths.md §1–§5 (size S and risk R scored separately, risk overrides, escalation procedure, adopt mode); SK/references/brownfield.md; tdd.md "Brownfield variant" (CHAR-n); templates/plan.md `## Impact` regression scope; SK/references/adoption.md | L3: explicit routing among three paths with criteria; brownfield adopt procedure. L4: separate size and risk axes with Full-forcing triggers, escalation on file bound/new trigger, code map, characterization tests, regression selection. L5 partly met: scored rubric, adoption guide for existing processes. **First unmet (L5): no evidence (worked cases or evals) that the Quick path preserves the safety invariants** — `examples/paths/`† and `path-score.mjs`† do not ship; the quickstart is a walkthrough, not a demonstration. |
| C15 | Portability and extensibility | 2 | 1.0 | 2 | L | I | CLAUDE.md "Project Overview" (8 platforms); SK/references/platforms.md §2 (per-platform tool and permission mapping); SK/references/artifacts.md "Later-release files" (`extension-interface.md`† / `ext-check.mjs`†: "No extensions are loaded until it exists"); project-context (AGENTS.md block, CONSTRAINTS.md, `.agentic-sdlc/config.json` survive re-vendoring); CONTRIBUTING.md | L2: documented customization mechanism (AGENTS.md block, CONSTRAINTS.md, config budgets). **First unmet (L3): no documented extension mechanism — the method states extensions are not loaded until `extension-interface.md`† exists.** Multi-platform support, tool mappings, contribution guide and repo CI (validate.yml) exist but cannot be credited above the gate. Confidence Low: contestable whether skill authoring via `skill-creator`/CONTRIBUTING counts as extension. |
| C16 | Learning loop and measured outcomes | 4 | 1.0 | 4 | M | I | SK/references/retrospective.md (default cycle on every path; ≥ 1 owned action changing a file; "Facts collected every cycle" lead time, rounds, findings, reverts, incidents; Trends rule; Recurrence 16.2; open action > 2 cycles → escalate); router Step 0 states 8–9 | L3: retro in default cycle with owned actions that change a file. L4: recurrence → automated control, follow-up of prior actions, outcome facts collected every cycle. **First unmet (L5): metrics are computed by the agent from git commands; `metrics.mjs`† does not ship, so no tooling computes them** (threshold decision rule and trends are defined). |

## Concreteness test (design-only)
n/a (implemented method; r = 1.0).

## Weakest criteria
1. C15 Portability and extensibility (2): extension interface deferred to a later release ("No extensions are loaded until it exists"), so broad platform support cannot be credited past the L3 gate.
2. C10 Human governance (4): approvals are hash-bound and well recorded, but non-bypassable enforcement (branch protection, CODEOWNERS, CI approvals job) is rollout week 3 and `approval-check`†/`audit-export`† do not ship.
3. C9 Traceability (4): the full AC → task → commit → test → release chain is checked by hand; `trace-check.mjs`† does not ship. (C3, C4, C8, C11, C12, C14, C16 also stop at 4 for the same pattern: the deterministic component is opt-in or unshipped.)

## Realization risks (design-only)
n/a (implemented method).

## Claims not scored
| Claim | Source | Reason |
|---|---|---|
| `status.mjs`, `doctor.mjs`, `path-score.mjs`, `evidence.mjs`, `trace-check.mjs`, `dod-gate.mjs`, `approval-check.mjs`, `audit-export.mjs`, `ext-check.mjs`, `metrics.mjs` | SK/SKILL.md Module Index (†) | Not shipped (verified with `ls`); "added in a later release" = roadmap / broken reference |
| `references/faq.md`, `upgrading.md`, `extension-interface.md`, `standards-mapping.md`; `examples/paths/`, `examples/extensions/` | SK/SKILL.md Module Index (†) | Not shipped; broken references |
| CI gates `agentic-sdlc/{dod,spec,approvals,trace}`, `security.yml`, CODEOWNERS, branch protection | SK/templates/ci/*, governance.md §7 | Opt-in: rollout week 3 (adoption.md §2), project-context prepares only; capped at 2 where they matter |
| Permission/deny settings per platform (e.g. `permissions.deny: ["Bash(git push:*)"]`) | SK/references/platforms.md §2 | Documented mapping; no file shipped or installed by the default path |
| "127 automated tests" for the scripts | README.md "What's in v3.0.0" | Scripts and tests read statically, not run (brief rule); used only as I evidence of script behaviour |
| Dogfood trial, scored comparison, roadmap | README.md; docs/research/, docs/plans/ | Outside the method scope set by the brief; not opened |
| Evals (`skills/*/evals/evals.json`) as measured behaviour change | skills tree | Eval definitions only; no shipped results read |

## Search log
| Criterion | Paths / probe terms | Hits used | Hits rejected (reason) |
|---|---|---|---|
| C1 | README, quickstart, install, first, doctor, faq, troubleshoot | README "Get started", quickstart.md, SKILL.md Step 0/Module Index | doctor†, faq.md†, upgrading.md† (missing) |
| C2 | spec, AC-, Given/When/Then, non-goal, doubt, vague, revision, change protocol | templates/spec.md, spec-driven-development Step 6, spec-lint.mjs, rules.md change protocol, governance.md §4 | — |
| C3 | TDD, red, green, refactor, mock, simplicity, anti-pattern, rationaliz, coverage_min | tdd.md, rules.md, run-ledger.mjs red check, preflight.mjs baseline-dod | CI dod job (opt-in) |
| C4 | verify, evidence, fingerprint, stale, CANNOT_VERIFY, DoD | verification.md §1–§4, lib/git.mjs, pr-body.md | evidence.mjs†, dod-gate.mjs† (missing) |
| C5 | review, lens, severity, triage, dedup, NO-GO, receive, re-review | review.md §1–§7, multi-axis-code-review (listing) | — |
| C6 | loop, bound, breaker, escalate, ledger, anti-thrash, cause | loops.md, run-ledger.mjs constants and refusals | — |
| C7 | plan-graph, wave, frontier, parallel, conflict, codemap, impact | plan-graph.mjs, parallel-tasks.md, templates/plan.md Impact, writing-plans Step 4 | — |
| C8 | unattended, worktree, halt, budget, authority, resume, permission, hook | autonomous.md, preflight.mjs, run-ledger.mjs, platforms.md §2 | permission configs (documentation only) |
| C9 | AC-, Refs:, trace, orphan, release notes | lifecycle.md §4, verification.md §5, plan-graph.mjs | trace-check.mjs† (missing) |
| C10 | approval, sign-off, hash, waiver, RACI, branch protection, CODEOWNERS | governance.md, lifecycle.md §2, spec-lint/plan-graph `--check-approval`, templates/CODEOWNERS | approval-check†, audit-export† (missing); CI/branch protection (opt-in week 3) |
| C11 | security, secret, gitleaks, OWASP, threat, injection, SSDF, 800-218A, SBOM | security.md, templates/spec.md, rules.md rule 7, ssdf-mapping.md | security.yml CI (opt-in) |
| C12 | release, rollback, canary, observability, alert, incident, postmortem, runbook, SLO | release-ops.md, templates (runbook, postmortem, ops-record by name) | — |
| C13 | context, progressive, handoff, compaction, never sees, budget, words | SKILL.md Module Index, phase-boundaries.md, spec-lint BUD01, plan-graph LIMITS | budget-check.mjs (method's own repo budgets; not wired into validate.yml) |
| C14 | path, score, risk, escalate, brownfield, adopt, characterization, regression | paths.md, tdd.md brownfield variant, plan Impact, adoption.md | examples/paths†, path-score†(missing) |
| C15 | platform, Copilot, Codex, Cursor, extension, customize, contributing, validate | CLAUDE.md, platforms.md, artifacts.md later-release rows, CONTRIBUTING.md, .github/workflows/validate.yml | extension-interface.md†, ext-check†(missing) |
| C16 | retro, action, recurrence, metrics, DORA, lead time, change failure | retrospective.md | metrics.mjs† (missing) |

## Files read
| Path | Words | Read (full / partial) |
|---|---|---|
| README.md | 2173 | partial (Get started → end) |
| CLAUDE.md | 4508 | partial (first 80 lines) |
| AGENTS.md, GEMINI.md | 48 | full |
| .claude-plugin/plugin.json | 70 | full |
| CHANGELOG.md | 5942 | partial (3.0.1, 3.0.0 entries) |
| CONTRIBUTING.md | 465 | partial |
| .github/workflows/validate.yml | 244 | partial (job names) |
| skills/agentic-sdlc/SKILL.md | 2318 | full |
| SK/references/quickstart.md, paths.md, lifecycle.md, rules.md, governance.md, verification.md, review.md, loops.md, tdd.md, autonomous.md, adoption.md | 18601 | full |
| SK/references/platforms.md | 1355 | partial (§2–§4) |
| SK/references/security.md, release-ops.md, retrospective.md, phase-boundaries.md, artifacts.md | 8806 | partial (grep + sections) |
| SK/templates/spec.md | 1203 | partial (first 120 lines) |
| SK/templates/plan.md | 1267 | partial (grep Impact) |
| SK/templates/ci/agentic-sdlc.yml, CODEOWNERS | 1551 | full |
| SK/scripts/preflight.mjs, spec-lint.mjs, plan-graph.mjs | 8561 | partial (headers, constants, help) |
| SK/scripts/run-ledger.mjs | 6794 | partial (constants, grep, help) |
| SK/scripts/budget-check.mjs | 644 | partial |
| skills/project-context/SKILL.md | 3842 | full |
| skills/project-context/references/enforcement-setup.md | 745 | full |
| skills/executing-plans/SKILL.md | 4108 | partial (grep) |
| skills/executing-plans/references/parallel-tasks.md | 1227 | full |
| skills/writing-plans/SKILL.md, skills/spec-driven-development/SKILL.md | 8053 | partial (grep) |
| skills/security-hardening/references/ssdf-mapping.md | 1262 | partial (first 30 lines) |

## Machine-readable
```json
{"method":"agentic-sdlc","version":"3.0.1 @ git 22c649f (unverified; skills sha256 cf5efbc39b611456132d0b4c088a50dda12a73ce04677feffef24fc2cb0f40e9)","status":"implemented","scorer":"R3-2",
 "methodology_sha256":"a6e3953725b67db0189e188c1495ee9b54975e48f65c28baaa01f459b69cf9a4",
 "scores":{
  "C1":{"s":4,"r":1.0,"ra":4,"conf":"M","ev":"I","first_unmet":"L5: doctor.mjs and upgrading.md not shipped; no time-to-first-success measurement","cites":["skills/agentic-sdlc/SKILL.md#Step 0","skills/agentic-sdlc/references/quickstart.md"]},
  "C2":{"s":5,"r":1.0,"ra":5,"conf":"M","ev":"I","first_unmet":"none","cites":["skills/agentic-sdlc/scripts/spec-lint.mjs","skills/spec-driven-development/SKILL.md#Step 6","skills/agentic-sdlc/references/rules.md#Change protocol"]},
  "C3":{"s":4,"r":1.0,"ra":4,"conf":"M","ev":"I","first_unmet":"L5: lint/typecheck/coverage script gate only on baseline; per-change gate agent-run or opt-in CI","cites":["skills/agentic-sdlc/references/tdd.md","skills/agentic-sdlc/scripts/preflight.mjs"]},
  "C4":{"s":4,"r":1.0,"ra":4,"conf":"M","ev":"I","first_unmet":"L5: evidence not machine-checked (evidence.mjs, dod-gate.mjs not shipped; CI opt-in)","cites":["skills/agentic-sdlc/references/verification.md#4","skills/agentic-sdlc/scripts/lib/git.mjs#fingerprint"]},
  "C5":{"s":5,"r":1.0,"ra":5,"conf":"M","ev":"I","first_unmet":"none","cites":["skills/agentic-sdlc/references/review.md"]},
  "C6":{"s":5,"r":1.0,"ra":5,"conf":"M","ev":"I","first_unmet":"none","cites":["skills/agentic-sdlc/references/loops.md","skills/agentic-sdlc/scripts/run-ledger.mjs"]},
  "C7":{"s":5,"r":1.0,"ra":5,"conf":"M","ev":"I","first_unmet":"none","cites":["skills/agentic-sdlc/scripts/plan-graph.mjs","skills/executing-plans/references/parallel-tasks.md","skills/agentic-sdlc/templates/plan.md#Impact"]},
  "C8":{"s":4,"r":1.0,"ra":4,"conf":"M","ev":"I","first_unmet":"L5: authority limits not enforced by environment (permission settings only documented)","cites":["skills/agentic-sdlc/references/autonomous.md","skills/agentic-sdlc/scripts/run-ledger.mjs"]},
  "C9":{"s":4,"r":1.0,"ra":4,"conf":"M","ev":"I","first_unmet":"L5: trace-check.mjs not shipped; full trace not tool-validated","cites":["skills/agentic-sdlc/references/lifecycle.md#4","skills/agentic-sdlc/references/verification.md#5"]},
  "C10":{"s":4,"r":1.0,"ra":4,"conf":"M","ev":"I","first_unmet":"L5: non-bypassable enforcement (branch protection, CI) opt-in; approval-check/audit-export not shipped","cites":["skills/agentic-sdlc/references/governance.md"]},
  "C11":{"s":4,"r":1.0,"ra":4,"conf":"M","ev":"I","first_unmet":"L5: security CI gates opt-in; SSDF mapping only on audit/regulated trigger","cites":["skills/agentic-sdlc/references/security.md","skills/security-hardening/references/ssdf-mapping.md"]},
  "C12":{"s":4,"r":1.0,"ra":4,"conf":"M","ev":"I","first_unmet":"L5: post-deploy threshold checks and rollback agent-run, not automated","cites":["skills/agentic-sdlc/references/release-ops.md"]},
  "C13":{"s":5,"r":1.0,"ra":5,"conf":"M","ev":"I","first_unmet":"none","cites":["skills/agentic-sdlc/references/phase-boundaries.md","skills/agentic-sdlc/scripts/spec-lint.mjs#BUD01"]},
  "C14":{"s":4,"r":1.0,"ra":4,"conf":"M","ev":"I","first_unmet":"L5: no evidence that Quick path preserves safety invariants (examples/paths not shipped)","cites":["skills/agentic-sdlc/references/paths.md"]},
  "C15":{"s":2,"r":1.0,"ra":2,"conf":"L","ev":"I","first_unmet":"L3: no documented extension mechanism (extension-interface not shipped; extensions not loaded)","cites":["skills/agentic-sdlc/references/artifacts.md#Later-release files","skills/agentic-sdlc/references/platforms.md"]},
  "C16":{"s":4,"r":1.0,"ra":4,"conf":"M","ev":"I","first_unmet":"L5: metrics computed by agent, metrics.mjs not shipped","cites":["skills/agentic-sdlc/references/retrospective.md"]}
 }}
```
