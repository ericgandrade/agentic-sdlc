# Scorecard — BMad Method v7

| Field | Value |
|---|---|
| Method / version | BMad Method v7 preview (module `method` 6.13.0-next) @ `e435a22574fe55722841086e5566420178b98df3` (commit date 2026-11-12) |
| Status | implemented |
| Scorer ID | S-D |
| Methodology version + sha256 | 1.0 / a6e3953725b67db0189e188c1495ee9b54975e48f65c28baaa01f459b69cf9a4 |
| Date | 2026-11-21 |
| Access | full (local clone at pinned commit; inventory `docs/research/inventory/bmad.md` BM-IDs used, "What"/"Source" lines only) |
| Conflict declaration | none. Scorer did not author, plan or promote any evaluated method; Anthropic does not publish BMad. |
| Criterion order used | C12, C2, C5, C15, C13, C14, C4, C9, C16, C6, C3, C1, C10, C7, C11, C8 |

## Default path trace (scenario R)

1. Install: two `npx skills add` commands (core-tools, method), then `bmad setup` via the `bmad` skill (README §V7; docs/start/install-bmad.md). Needs uv + Python.
2. Sizing (docs/plan/choose-a-planning-path.md; BM-03/BM-04): one Build session is about one goal; a 3–10 task feature touching 5–20 files is "epic-sized work" (several Build sessions, one outcome). Intent goes to Sofia (`bmad-agent-po`): epic requirements (`R<n>` lines, Done when, Boundaries, decision log `.memlog.md`), then a story breakdown in `tickets.toml`, checked by fresh-context validation before approval (references/validate.md).
3. Per story, `bmad-build`: step-01 resolves the ticket, VCS sanity gate, single-goal check; step-02 investigates (Code Map), scores `risk`, picks route (auto: ≤100 LOC oneshot, else full), writes the plan (frozen intent block, G/W/T ACs, I/O matrix, Verification), resolves Open Questions, CHECKPOINT 1 approval.
4. step-03: fresh implementation subagent from the plan; parent stages the diff since `baseline_revision`, runs Verification commands, Matrix Test Audit.
5. step-04: review at default depth `quick` (one context-free lens), per-finding verdict and triage log, root-cause routing (intent_gap / bad_plan / patch / defer), loop cap 5. step-05: plan `built`, local commit, never push; PR offered.
6. User marks stories done via Sofia; epic closes with `bmad-retrospective` (evidence-based findings, owned action items, acceptance verdict).
Route for R: epic path with full-route Builds (feature >100 LOC), review `quick` (shipped default, help/review-choices.md).

## Scores

| ID | Criterion | Score (D) | r | RA | Conf | Ev. type | Evidence | Rationale: requirements met per level; first unmet requirement |
|---|---|---|---|---|---|---|---|---|
| C1 | Ease of adoption | 3 | 1.0 | 3 | M | I | README.md §V7; docs/start/build-your-first-change.md (Mars Rover walk-through); docs/start/install-bmad.md §Set Up and Verify; skills/core-tools/bmad/SKILL.md (help, status, doctor, migrate); scripts/setup_check.py | L3: one entry point (`bmad` router/help), quickstart walking one task end to end, install in 3 steps, core reading load ≈2.5k words. L4 unmet: no troubleshooting or FAQ section (get-answers page routes to asking the agent or community). In-tool next-step guidance, a scripted setup check and migration notes do exist (would serve L4/L5). |
| C2 | Requirements and specification | 4 | 1.0 | 4 | M | I, I-inv | bmad-build/workflow.md §READY FOR DEVELOPMENT ("All ACs use Given/When/Then"); plan-template.md (Boundaries Always/Never, I/O matrix); step-02-plan.md items 4–6 (Open Questions HALT); bmad-agent-po/references/validate.md (fresh-context set check before approval); BM-49 (R-ids never renumbered, decision log); BM-50, BM-51; BM-60 (replan) | L3: plan with required G/W/T ACs, explicit non-goals, clarification resolved before checkpoint. L4: independent fresh-context validation of the breakdown against requirements, stop rule on intent gaps, change control (append-only decision log, stable ids, replan impact step). L5 unmet: no script checks AC presence or flags vague terms on the default path (check_ids.py validates PRD id references only). |
| C3 | Code quality practices | 3 | 1.0 | 3 | M | I | bmad-agent-po/references/slice.md ("Tests go in every story"; refactor sweep); plan-template.md (task to unit-test matrix rows; Boundaries; Code Map; Design Notes); step-04-review.md ("smallest fix … adds no public surface, and guards no state you did not demonstrate"; reject low findings that add complexity); step-03 Matrix Test Audit | L3: per-story test obligation, boundary/design step in the plan before code, a minimal-change rule. Some L4 items (matrix tests must have run; never edit expectations to match code; refactor sweep story). L4 unmet: no test-first or fail-first rule on the build path, no mock limits or test anti-pattern catalogue, no counters to agent rationalizations (TDD appears only in the dev persona, off the Build path). |
| C4 | Verification and evidence | 4 | 1.0 | 4 | M | I | step-03-implement.md §Stage the Diff ("Judge against the diff, not just the implementation subagent's report"; "a failing command is unfinished work"), §Matrix Test Audit; step-04 patch handling (re-run Verification; HALT if unfixable); plan-template.md §Verification; BM-22, BM-23 | L3: Verification commands run after the last change (re-run after patches), DoD-like Verification section separate from ACs, failure blocks. L4: ACs written by planner/PO before a fresh implementer, verdicts from the diff, tests that did not run count as missing, `maybe-false`/blocked statuses instead of silent pass. L5 unmet: verification output is not persisted bound to a commit with a staleness rule, and no script or CI refuses completion. |
| C5 | Code review rigor | 4 | 1.0 | 4 | M | I | bmad-build/customize.toml (`review = "quick"`, quick lens prompt: unmet ACs, broken rules, bugs); step-04-review.md §Classify (verify each finding; high/medium/low/false/maybe-false; triage log row per finding), item 4 (loopbacks re-run review; carried rows); help/review-choices.md | L3: default review by a context-free subagent covering spec (ACs), repo rules and bugs, with severity and blocking resolution before commit (interpretation: three of the five listed axes accepted; no explicit security/tests axis on quick). L4: (b) verification and triage of every finding with disposition; (d) re-review after loopback fixes, with carried findings. L5 unmet: (a) parallel lenses are opt-in (`thorough`) on Build; (c) quick lens has no anti-rubber-stamp rule. |
| C6 | Loop engineering | 4 | 1.0 | 4 | M | I | step-04-review.md item 4 (intent_gap → human; bad_plan → plan amend + KEEP + Plan Change Log; patch → code; `review_loop_iteration` > 5 → HALT); step-04 patch (verification fails and cannot be fixed → HALT); step-02 Open Questions loop; help/review-choices.md ("Real findings on a third pass point outside the change") | L3: review-fix and verify-fix loops with exit criteria, a numeric cap, escalation to the human. L4: loopback by root cause, state carried (change log, KEEP, triage log), scoped re-check after patches, anti-thrash rule (third-pass findings go upstream). L5 unmet: the iteration counter is incremented by the agent per prompt; no script or state machine enforces the bound and loop efficacy is not measured. |
| C7 | Graph engineering | 3 | 1.0 | 3 | M | I | bmad-agent-po/scripts/tickets.py (`_check_cycles`, `classify`, `longest_remaining_chain`); assets/tickets-template.toml (`after`); references/validate-checks.md (Dependencies: items with no dependency path share no code/config); plan-template.md §Code Map | L3: execution graph used (tickets.py decides readiness and order from `after`, cycle check, disjointness rule for items with no path) and a codebase map declared (Code Map per plan). L4 unmet: no parallel frontier dispatch with an integration step in the method (Build is "Sequential execution only"; Build Auto runs one unit; parallel orchestration is external, e.g. bmad-loop). |
| C8 | Autonomous execution safety | 4 | 1.0 | 4 | M | I, I-inv | docs/build/autonomous-development-loops.md (§Prerequisites clean tree; blocking-condition list; `Auto Run Result`; "commits but does not push"; orchestrator marks done); BM-41, BM-42; step-04 loop cap 5 | L3: preflight (clean tree, writable metadata, branch fits the epic), branch isolation, explicit halt list, resumable plan status. L4: authority limits (no push, never marks done, review subagents may not spawn subagents), iteration cap, machine-readable terminal status (built / blocked + reason / ready-for-dev halt). L5 unmet: no hook, permission setting or sandbox enforces the limits; resume procedure not scripted/tested. Isolation via branch only (borderline). |
| C9 | Traceability end to end | 3 | 1.0 | 3 | M | I-inv, I | BM-49 (`R<n> (<source ids>)`); tickets-template.toml (`covers`); plan-template.md (`ticket`, `baseline_revision`); BM-19 (ranges baseline→next baseline); validate-checks.md (Set: entries cover every requirement) | L3: stable requirement ids → story entries (`covers`) → plan (`ticket`) → commit ranges (baseline revisions), in default artifacts. L4 unmet: links do not reach the release (no PR or release-note requirement references); reverse orphan check (every change has a requirement) is only partial. |
| C10 | Human governance | 3 | 1.0 | 3 | M | I | step-02-plan.md §CHECKPOINT 1 (HALT; re-read from disk; `ready-for-dev`; frozen block "human-owned"); step-05 local commit; bmad-agent-po/workflow.md ("A yes approves what was shown and … is the yes to commit it"); BM-18 (only user/orchestrator writes `done`); BM-90 | L3: named checkpoints (breakdown approval, plan approval, done, retro verdict) with owner roles, approval recorded in committed artifacts and status, agent halts. L4 unmet: approvals carry no approver identity/time and there is no general waiver procedure with recorded rationale for skipping a checkpoint (review depth or skipped review is only a frontmatter value). Borderline; frozen-block re-approval and risk-scaled checkpoints exist. |
| C11 | Security by default | 2 | 1.0 | 2 | M | I-inv | BM-67 (bmod-method/doc-templates/template-security-review.md, OWASP/STRIDE catalog); BM-08 (invocation is input, not authority) | L2: a security review template with OWASP and STRIDE exists but is opt-in (a PM document). L3 unmet: no security lens in the default review, no secret-handling or dependency-hygiene rules on the build path. |
| C12 | Release and operations | 2 | 1.0 | 2 | M | I-inv | BM-65 (template-launch.md: go/no-go, rollback readiness); BM-55 ("Every epic delivers to production") | L2: release guidance exists (launch plan with rollback readiness) but opt-in. L3 unmet: no release step on the default path with a required rollback plan and observability requirements. |
| C13 | Context engineering and token efficiency | 4 | 1.0 | 4 | M | I | bmad-build/workflow.md (step-file JIT loading; SCOPE STANDARD 900–1600 tokens); customize.toml `implementation_handoff` (fresh subagent, plan as sole source); step-04 (lenses get paths, Blind Hunter sees diff only); step-02 CHECKPOINT ("Approve and stop" for a fresh session); BM-48, BM-61 (doc ceilings) | L3: systematic progressive disclosure, file hand-offs, fresh subagents with briefs. L4: size budgets, resume by status, per-lens context rules, single-source rules. L5 unmet: token budget checked by the agent, not a validator; no eval comparing context strategies. |
| C14 | Right-sizing and brownfield | 4 | 1.0 | 4 | M | I, I-inv | docs/plan/choose-a-planning-path.md (edit / one Build / epic / project); customize.toml `route_selection` (≤100 LOC); BM-04 (size and stakes separate); step-01 multi-goal split; BM-21 (oneshot upgrades to full); bmad-project-context (BM-80/81); plan Code Map; docs/existing-codebases/ | L3: explicit routing with size criteria, brownfield entry (verified project-context block, existing-codebase guide). L4: separate risk axis pushes work up a tier, escalation when work outgrows its path, code map artifact. L5 unmet: no evidence (worked cases or evals) that the oneshot path preserves safety invariants. |
| C15 | Portability and extensibility | 2 | 1.0 | 2 | M | I | docs/start/install-bmad.md §Prerequisites ("uv for setup and Python scripts"); bmad-build/SKILL.md (`uv run … render_skill.py`); customize.toml merge rules + `_bmad/custom/`; CONTRIBUTING.md; tools/validate_skills.py | L2: documented customization layer that survives updates. L3 unmet: every skill requires the uv + Python renderer (mandatory runtime beyond host agent), and the v7 docs name no set of three or more officially supported agent platforms. |
| C16 | Learning loop and measured outcomes | 3 | 1.0 | 3 | M | I | bmad-retrospective/workflow.md; references/acceptance-verdict.md ("What would prevent the next one"; Previous-retro follow-through); BM-86; bmad-project-context record mode (BM-81) | L3: retrospective in the default epic cycle with owned action items aimed at spec, conventions and gates. L4 unmet: no defined outcome metrics collected each cycle (diff statistics only). Recurrence handling and follow-through exist. |

## Concreteness test (design-only)
n/a

## Weakest criteria
1. C11 Security by default (2): security review exists only as an opt-in PM template; nothing on the build path.
2. C12 Release and operations (2): launch plan is opt-in; Build ends at a local commit.
3. C15 Portability and extensibility (2): mandatory uv/Python renderer and no named platform support set, despite a strong customization layer.

## Realization risks (design-only)
n/a

## Claims not scored
| Claim | Source | Reason |
|---|---|---|
| BMad Loop builds, verifies and retros a whole epic unattended | README §Ecosystem | Separate repository, not in the pinned distribution |
| Thorough four-lens review | customize.toml `thorough_lenses` | Opt-in for Build (default `quick`); credited only as context in C5 |
| Dev agent "test-first discipline — red, green, refactor" | bmad-agent-dev/SKILL.md | Persona text, not on the Build path; no procedure |
| v6.12 stable line | README | Different version; not the pin |
| Skill evaluation (bmad-eval) | BM-89 | Measures skills for authors; not evidence of loop, context or review efficacy |

## Search log
| Criterion | Paths / probe terms | Hits used | Hits rejected (reason) |
|---|---|---|---|
| C1 | README, install, getting started, help, doctor, status, FAQ, troubleshoot | README; docs/start/*; bmad/SKILL.md; setup_check.py | docs pages matching "faq" are prose mentions, not FAQ sections |
| C2 | spec, Given/When/Then, Open Questions, validate, memlog, replan | workflow.md; plan-template; step-02; validate.md; BM-49..60 | check_ids.py (PRD ids only) |
| C3 | TDD, test, refactor, speculative, smallest, complexity | slice.md; plan-template; step-03/04 | bmad-agent-dev persona (off path) |
| C4 | verify, verification, diff, evidence, failing | step-03; step-04 patch; plan-template | — |
| C5 | review, lens, triage, severity, verdict | customize.toml; step-04; review-choices.md; review-a-change.md | bmad-code-review (standalone, not on Build path) |
| C6 | loop, iteration, HALT, loopback, cap | step-04 item 4; review-choices | — |
| C7 | after, dependency, cycle, frontier, parallel, Code Map | tickets.py; tickets-template; validate-checks; plan-template | bmad-loop (external) |
| C8 | auto, unattended, blocked, push, clean, worktree | autonomous-development-loops.md; BM-41/42 | no worktree/sandbox found |
| C9 | R<n>, covers, ticket, baseline, trace | BM-19, BM-49; tickets-template; validate-checks | — |
| C10 | approve, checkpoint, sign-off, owner, Decision | step-02 CHECKPOINT 1; PO workflow; BM-18, BM-90 | — |
| C11 | security, OWASP, STRIDE, secret, injection | BM-67; BM-08 | SECURITY.md (repo vulnerability policy) |
| C12 | deploy, release, rollback, launch, incident | BM-65; BM-55 | — |
| C13 | token, budget, step-file, fresh, subagent, context | workflow.md; customize.toml; step-02/04 | — |
| C14 | oneshot, full, route, risk, size, existing codebase | choose-a-planning-path; customize.toml; BM-04/05/21; project-context | — |
| C15 | platform, uv, customize, contributing, validate | install-bmad.md; SKILL.md shells; customize.toml; validate_skills.py | — |
| C16 | retrospective, follow-through, metrics, action items | retrospective workflow + references | git_evidence diff stats (not outcome metrics) |

## Files read
| Path | Words | Read (full / partial) |
|---|---|---|
| README.md | 1,003 | full |
| docs/start/build-your-first-change.md | 710 | full |
| docs/start/install-bmad.md | 705 | partial (headings, searched) |
| docs/start/get-answers-about-bmad.md | 407 | partial (headings) |
| docs/plan/choose-a-planning-path.md | 1,851 | full |
| docs/build/review-a-change.md | 1,644 | partial (first 60 lines) |
| docs/build/autonomous-development-loops.md | 2,358 | partial (lines 1–60, 160–260) |
| skills/method/bmad-build/SKILL.md, workflow.md | 843 | full |
| skills/method/bmad-build/step-01..05, plan-template.md, customize.toml | ~7,300 | full |
| skills/method/bmod-method/help/review-choices.md | — | full |
| skills/method/bmad-agent-po/workflow.md | 1,251 | partial (lines 1–80) |
| skills/method/bmad-agent-po/references/validate.md | — | full |
| skills/method/bmad-agent-po/scripts/tickets.py | — | partial (docstring, function list) |
| skills/core-tools/bmad/SKILL.md, references/help.md, scripts/setup_check.py | — | partial |
| skills/core-tools/bmad-facilitate/scripts/check_ids.py | — | partial (docstring) |
| skills/method/bmad-retrospective/workflow.md, references/*.md | — | searched |
| tools/validate_skills.py, .github/workflows/quality.yaml | — | partial |
| docs/research/inventory/bmad.md (BM-01..BM-91 "What"/"Source") | — | partial |

## Machine-readable
```json
{"method":"bmad","version":"e435a22574fe55722841086e5566420178b98df3","status":"implemented","scorer":"S-D",
 "methodology_sha256":"a6e3953725b67db0189e188c1495ee9b54975e48f65c28baaa01f459b69cf9a4",
 "scores":{
  "C1":{"s":3,"r":1.0,"ra":3,"conf":"M","ev":"I","first_unmet":"No troubleshooting or FAQ section","cites":["README.md#V7","docs/start/build-your-first-change.md","skills/core-tools/bmad/SKILL.md"]},
  "C2":{"s":4,"r":1.0,"ra":4,"conf":"M","ev":"I","first_unmet":"No deterministic spec validation on default path","cites":["skills/method/bmad-build/workflow.md#READY FOR DEVELOPMENT STANDARD","skills/method/bmad-agent-po/references/validate.md","BM-49","BM-60"]},
  "C3":{"s":3,"r":1.0,"ra":3,"conf":"M","ev":"I","first_unmet":"No fail-first/mock/anti-pattern safeguards; no rationalization counters","cites":["skills/method/bmad-agent-po/references/slice.md","skills/method/bmad-build/plan-template.md","skills/method/bmad-build/step-04-review.md"]},
  "C4":{"s":4,"r":1.0,"ra":4,"conf":"M","ev":"I","first_unmet":"Evidence not persisted bound to commit; no deterministic gate","cites":["skills/method/bmad-build/step-03-implement.md","BM-22","BM-23"]},
  "C5":{"s":4,"r":1.0,"ra":4,"conf":"M","ev":"I","first_unmet":"Parallel lenses opt-in; no anti-rubber-stamp rule on quick lens","cites":["skills/method/bmad-build/customize.toml","skills/method/bmad-build/step-04-review.md#Classify"]},
  "C6":{"s":4,"r":1.0,"ra":4,"conf":"M","ev":"I","first_unmet":"Bound not enforced by script; efficacy not measured","cites":["skills/method/bmad-build/step-04-review.md#4","skills/method/bmod-method/help/review-choices.md"]},
  "C7":{"s":3,"r":1.0,"ra":3,"conf":"M","ev":"I","first_unmet":"No parallel frontier dispatch with integration step","cites":["skills/method/bmad-agent-po/scripts/tickets.py","skills/method/bmad-agent-po/references/validate-checks.md","skills/method/bmad-build/plan-template.md#Code Map"]},
  "C8":{"s":4,"r":1.0,"ra":4,"conf":"M","ev":"I","first_unmet":"Limits not enforced by environment; resume not tested","cites":["docs/build/autonomous-development-loops.md","BM-41","BM-42"]},
  "C9":{"s":3,"r":1.0,"ra":3,"conf":"M","ev":"I-inv","first_unmet":"Links do not reach release; reverse orphan check partial","cites":["BM-49","BM-19","skills/method/bmad-agent-po/assets/tickets-template.toml"]},
  "C10":{"s":3,"r":1.0,"ra":3,"conf":"M","ev":"I","first_unmet":"No approver identity/time; no waiver procedure with rationale","cites":["skills/method/bmad-build/step-02-plan.md#CHECKPOINT 1","skills/method/bmad-agent-po/workflow.md","BM-90"]},
  "C11":{"s":2,"r":1.0,"ra":2,"conf":"M","ev":"I-inv","first_unmet":"Nothing security-related on the default path","cites":["BM-67","BM-08"]},
  "C12":{"s":2,"r":1.0,"ra":2,"conf":"M","ev":"I-inv","first_unmet":"No default-path release step with rollback and observability","cites":["BM-65","BM-55"]},
  "C13":{"s":4,"r":1.0,"ra":4,"conf":"M","ev":"I","first_unmet":"Budgets not validator-enforced or measured","cites":["skills/method/bmad-build/workflow.md","skills/method/bmad-build/customize.toml","BM-48"]},
  "C14":{"s":4,"r":1.0,"ra":4,"conf":"M","ev":"I","first_unmet":"No evidence the light path preserves safety invariants","cites":["docs/plan/choose-a-planning-path.md","skills/method/bmad-build/customize.toml#route_selection","BM-04","BM-80"]},
  "C15":{"s":2,"r":1.0,"ra":2,"conf":"M","ev":"I","first_unmet":"Mandatory uv/Python runtime; no named 3+ platform support","cites":["docs/start/install-bmad.md#Prerequisites","skills/method/bmad-build/SKILL.md"]},
  "C16":{"s":3,"r":1.0,"ra":3,"conf":"M","ev":"I","first_unmet":"No defined outcome metrics collected each cycle","cites":["skills/method/bmad-retrospective/references/acceptance-verdict.md","BM-86"]}
 }}
```
