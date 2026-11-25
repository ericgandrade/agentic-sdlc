# Scorecard — Matt Pocock skills

| Field | Value |
|---|---|
| Method / version | Matt Pocock skills @ `5863806dd4e15c63174bee4e7515a4256792ecfa` (plugin 1.3.2; commit date 2026-11-12) |
| Status | implemented |
| Scorer ID | S-D |
| Methodology version + sha256 | 1.0 / a6e3953725b67db0189e188c1495ee9b54975e48f65c28baaa01f459b69cf9a4 (evaluator-agent.md aa3a1f70…857a, matches FREEZE.md) |
| Date | 2026-11-20 |
| Access | full (local clone at pinned commit; inventory `docs/research/inventory/mattpocock.md` used for MP-IDs, "What"/"Source" lines only) |
| Conflict declaration | none. Scorer did not author, plan or promote any evaluated method; scorer's model vendor (Anthropic) does not publish this method. |
| Criterion order used | C4, C2, C12, C1, C13, C16, C5, C14, C11, C10, C7, C3, C15, C8, C6, C9 |

## Default path trace (scenario R)

1. Install the plugin (`claude plugin install …`, README §Installation step 1), run `/setup-matt-pocock-skills` once per repo (tracker, labels, doc layout).
2. Entry point: `/ask-matt` router; the main flow starts with `/grill-with-docs` (interview, updates `GLOSSARY.md` and ADRs).
3. Router branch "is this a multi-session build?": a 3–10 task feature touching 5–20 files is routed **Yes** → `/to-spec` (spec published to the tracker, seams confirmed with the user) → `/to-tickets` (tracer-bullet tickets with blocking edges, user approves the breakdown).
4. Build: `/implement` per ticket with `/clear` between tickets, or `/implement-spec` (task graph, implementer subagents in worktrees, merger subagent, integration branch). Both drive `/tdd` at pre-agreed seams and close with `/code-review` (two parallel fresh subagents: Standards, Spec).
5. `/pr` (model-invoked) shapes the PR body: summary visual, before/after evidence, merge danger. The team's mandatory human review happens on the PR (outside the method).
6. `/retro` closes the loop with environment-improvement suggestions.
Route selected for R: main flow, multi-session branch (spec + tickets), because the router's only size criterion is whether the build spans sessions.

## Scores

| ID | Criterion | Score (D) | r | RA | Conf | Ev. type | Evidence | Rationale: requirements met per level; first unmet requirement |
|---|---|---|---|---|---|---|---|---|
| C1 | Ease of adoption | 2 | 1.0 | 2 | M | I | README.md §Installation (steps 1–3); skills/engineering/ask-matt/SKILL.md; docs/engineering/ask-matt.md §Common questions | L1: install documented. L2: install in 2–3 steps (plugin install + `/setup-matt-pocock-skills`), stated first command, core reading load ≈5k words (README 2.1k + setup 1.1k + ask-matt 2.0k). L3 unmet: no quickstart that walks one task end to end (README explains failure modes, not a worked run). Router exists (L3 entry point) but does not inspect project state (L4). |
| C2 | Requirements and specification | 2 | 1.0 | 2 | M | I | to-spec/SKILL.md §spec-template (Problem, Solution, User Stories, Implementation/Testing Decisions, Out of Scope); to-tickets/SKILL.md §local-ticket-template (acceptance-criterion checkboxes); MP-18..MP-21 (grilling until frontier empty) | L1–L2: spec template and clarification interview exist on the default path, with explicit out-of-scope. L3 unmet: acceptance criteria are not required to be testable (user stories "As a…", free-text checkboxes; no Given/When/Then, EARS or measurable statements). No independent spec critique or change control (L4). |
| C3 | Code quality practices | 3 | 1.0 | 3 | M | I | implement/SKILL.md ("Call the Skill tool with tdd … at pre-agreed seams"); tdd/SKILL.md §Rules of the loop, §Anti-patterns; tdd/mocking.md; to-spec/SKILL.md step 2 (seam design before code); domain-modeling ADRs (MP-24); code-review/SKILL.md smell baseline | L3: default build path requires red-before-green TDD; design step (seams/interfaces sketched and confirmed before spec, ADRs); simplicity rule ("Don't anticipate future tests or add speculative features"). Most L4 items present (failing test first, mock limits, anti-pattern catalogue, refactoring moved to review stage with smell→fix). L4 unmet: no explicit counters to common agent rationalizations (no rationalization table or red-flag list for skipping tests). Borderline. |
| C4 | Verification and evidence | 2 | 1.0 | 2 | M | I | implement/SKILL.md ("full test suite once at the end", then code-review, commit); pr/SKILL.md §Evidence (before/after failing/passing run); diagnosing-bugs/SKILL.md Phase 1 completion ("already run at least once") | L1–L2: evidence is asked for (full suite at end; PR before/after evidence). L3 unmet: no Definition of Done separate from acceptance criteria and no rule that a failing check blocks the completion claim; suite is run before review fixes, so evidence is not tied to the last change. |
| C5 | Code review rigor | 2 | 1.0 | 2 | M | I | code-review/SKILL.md §4 (two parallel fresh sub-agents), §5 (no merge/rerank); implement-spec/SKILL.md step 7 ("Fix all issues raised … in a single fresh implementer subagent"); MP-68..MP-72 | L2: review step on the default path, in independent contexts. L3 unmet: checklist covers standards+smells and spec conformance but has no tests or security axis and no severity scale beyond hard-vs-judgement; `/implement` commits after review with no rule that blocking findings be resolved. |
| C6 | Loop engineering | 2 | 1.0 | 2 | M | I | tdd/SKILL.md §Rules of the loop; diagnosing-bugs/SKILL.md Phase 1 ("Stop and say so … Ask the user"), Phase 1 completion criterion; implement-spec step 7 (one review-fix pass) | L2: named loops with steps (red→green; diagnosis phases). L3 unmet: no numeric bound on any loop; the TDD loop has an exit criterion but no breaker or escalation target. Diagnosis loop (breaker + escalation to user) is an on-ramp, not R's default path, and has no numeric bound. |
| C7 | Graph engineering | 2 | 1.0 | 2 | M | I | to-tickets/SKILL.md §3–5 (blocking edges, frontier); implement-spec/SKILL.md steps 4–6 (frontier dispatch, worktrees, merger subagent); improve-codebase-architecture/SKILL.md (Mermaid dependency visuals, off path) | L2: execution graph declared (blocking edges) and used by implement-spec (frontier dispatch with integration branch). L3 unmet: no codebase/knowledge map artifact on the path (K not declared; GLOSSARY.md is a term list, architecture report is an occasional survey) and no conflict rule such as disjoint file sets. Borderline. |
| C8 | Autonomous execution safety | 2 | 1.0 | 2 | L | I | implement-spec/SKILL.md (whole spec in one run; worktrees; integration branch; draft PR marked ready, not merged); misc/git-guardrails-claude-code/scripts/block-dangerous-git.sh (MP-80, not in plugin); in-progress/software-factory (MP-77, design vocabulary, excluded from plugin) | L2: an unattended-style run (implement-spec) with two safeguards: isolation (per-ticket worktree + integration branch) and no merge to main (draft PR). L3 unmet: no preflight (clean tree, baseline tests), no explicit halt-condition list, no resumable ledger. Low confidence: whether implement-spec counts as an "unattended mode" is a contestable interpretation. |
| C9 | Traceability end to end | 2 | 1.0 | 2 | M | I | to-tickets/SKILL.md §issue-template (Parent, Blocked by), §5 (sub-issues); implement-spec step 3 (draft PR "marked as closing the spec and tickets"); code-review step 2 (issue refs in commits) | L2: ticket IDs linked to the parent spec issue (one segment). L3 unmet: no stable requirement IDs (user stories numbered but not referenced by tickets or tests); PR→ticket link exists only on the implement-spec route and a real tracker; no test links. |
| C10 | Human governance | 2 | 1.0 | 2 | M | I | to-spec step 2 ("Check with the user that these seams match"); to-tickets step 4 ("Iterate until the user approves the breakdown"); tdd/SKILL.md (seams confirmed with user); MP-19 (decisions are the user's) | L2: defined stop points where the agent waits for the user. L3 unmet: approvals are not recorded (who/when/version) and no decision-owner roles are named. |
| C11 | Security by default | 1 | 1.0 | 1 | M | I | handoff/SKILL.md ("Redact any sensitive information"); wizard/SKILL.md (`ask_secret`); diagnosing-bugs redaction (MP-66); git-guardrails (misc, opt-in, not in plugin) | L1: security-adjacent mentions (secret redaction, hidden secret entry). L2 unmet: no security skill or checklist (the guardrail hook protects git history, not security practice). |
| C12 | Release and operations | 1 | 1.0 | 1 | M | I | pr/SKILL.md §Merge Danger (one-/two-way door, blast radius); wizard/SKILL.md (migrations/cutover) | L1: deployment/cutover mentioned. L2 unmet: no release checklist or deployment guidance; method ends at PR. |
| C13 | Context engineering and token efficiency | 4 | 1.0 | 4 | M | I | ask-matt/SKILL.md §Context hygiene (smart zone ~150k), §Phase boundaries + PHASE-BOUNDARIES.md (MP-03); implement-spec ("fresh context window", "context pointers"); code-review §4 (fresh sub-agents, "Under 400 words"); retro §Implementation vs Review (review agent owns standards); writing-for-agents/SKILL.md (progressive disclosure, single source of truth); handoff/SKILL.md (no duplication) | L3: skills with references loaded on demand, file/tracker hand-offs, fresh subagents with briefs. L4: size budgets (400-word reports, ~150k smart zone, standards file >1,000 lines gets pointers), compaction/resume protocol (ordered phase-boundary tree, compact with instruction, handoff), role hygiene (review vs implementation context pressure; axes kept apart), SSOT rules. L5 unmet: no validator or token measurement/eval. |
| C14 | Right-sizing and brownfield | 3 | 1.0 | 3 | M | I | ask-matt/SKILL.md main flow step 3 (multi-session? yes → spec+tickets; no → implement inline), §On-ramps (wayfinder for huge efforts; tdd alone for small behaviours); to-spec step 1 (explore repo, use glossary, respect ADRs); setup-matt-pocock-skills §1 Explore | L3: explicit routing among three paths with a stated size criterion (fits one session / multi-session / too big for one session), brownfield entry by exploring the repo and its domain docs/ADRs before specifying. L4 unmet: no separate risk axis that forces a heavier path. |
| C15 | Portability and extensibility | 3 | 1.0 | 3 | M | I | README §Installation (Claude Code, Codex, Copilot, Gemini CLI; others via `npx skills`); per-skill `agents/openai.yaml`; writing-for-agents skill; CONTRIBUTING.md | L3: four officially documented platforms, plain Markdown, no runtime; documented authoring mechanism (writing-for-agents, editable copies via skills.sh). L4 unmet: no customization layer that survives upgrades (editable copies are updated by hand; the plugin overwrites); contribution is issue-only. |
| C16 | Learning loop and measured outcomes | 2 | 1.0 | 2 | M | I | retro/SKILL.md steps 3–4 (categories; mechanical → deterministic check); ask-matt main flow step 4 | L2: retrospective procedure on the main flow. L3 unmet: produces suggestions presented to the user, not owned action items with a record. Borderline. |

## Concreteness test (design-only)
n/a

## Weakest criteria
1. C12 Release and operations (1): the method ends at the PR; no release, rollback or observability guidance.
2. C11 Security by default (1): no security skill, checklist or review lens; only secret-redaction remarks.
3. C4 Verification and evidence (2): tests are run, but there is no DoD and no rule that failing evidence blocks completion; a C3/C4-core weakness for a construction-focused method.

## Realization risks (design-only)
n/a

## Claims not scored
| Claim | Source | Reason |
|---|---|---|
| Software-factory brakes, loop caps "a few tries before a human" | in-progress/software-factory/SKILL.md (MP-77) | Beta, excluded from the plugin; design vocabulary, not a run mode; no numeric bound |
| Destructive-git PreToolUse hook | misc/git-guardrails-claude-code (MP-80) | Opt-in, not in plugin; noted in C8 only as context, not credited above L2 |
| dependency-cruiser deep-module guardrail, "prove the rule bites" | in-progress/setup-ts-deep-modules (MP-79) | Beta, off default path; TypeScript only |
| Pre-commit hooks | misc/setup-pre-commit | Opt-in, not in plugin |
| "Works with any model" | README | Marketing statement; not evidence |

## Search log
| Criterion | Paths / probe terms | Hits used | Hits rejected (reason) |
|---|---|---|---|
| C1 | README, quickstart, install, router, doctor, FAQ, troubleshoot | README §Installation; ask-matt; docs/engineering/ask-matt.md §Common questions | `.out-of-scope/setup-skill-verify-mode.md` (verify mode explicitly not built) |
| C2 | spec, acceptance, user stories, out of scope, grill | to-spec template; to-tickets templates; grilling (MP-18..21) | triage AGENT-BRIEF (on-ramp, not R) |
| C3 | tdd, red, green, refactor, mock, seam, speculative, ADR | tdd/*; implement; to-spec step 2; code-review smells | prototype (detour) |
| C4 | verify, evidence, done, full suite | implement; pr §Evidence; diagnosing-bugs Phase 1 | — |
| C5 | review, sub-agent, severity, finding | code-review; implement-spec step 7 | — |
| C6 | loop, retry, cap, stop, escalate | tdd rules; diagnosing-bugs Phases 1–6 | software-factory caps (beta) |
| C7 | blocking, frontier, graph, worktree, dependency, mermaid | to-tickets; implement-spec; improve-codebase-architecture | GLOSSARY-MAP (term map, not code map) |
| C8 | background, AFK, worktree, halt, resume, push, hook | implement-spec; git-guardrails; software-factory | claude-handoff `--bg` (beta, no safeguards) |
| C9 | parent, closes, issue ref, ID | to-tickets issue template; implement-spec step 3; code-review step 2 | — |
| C10 | approve, confirm, check with the user | to-spec; to-tickets; tdd | — |
| C11 | security, secret, injection, owasp, threat, redact | handoff; wizard; diagnosing-bugs | mermaid `securityLevel` (irrelevant) |
| C12 | deploy, release, rollback, observability, incident | pr §Merge Danger; wizard | OBSERVABILITY-PLATFORMS.md (beta, design vocabulary) |
| C13 | context, smart zone, compact, handoff, subagent, pointer | ask-matt; PHASE-BOUNDARIES; implement-spec; code-review; writing-for-agents; handoff; retro | — |
| C14 | small, size, multi-session, existing, explore | ask-matt branches/on-ramps; to-spec step 1; setup §1 | — |
| C15 | Codex, Copilot, Gemini, Cursor, plugin, contributing | README; openai.yaml; CONTRIBUTING; plugin.json | — |
| C16 | retro, lessons, metrics | retro; ask-matt step 4 | — |

## Files read
| Path | Words | Read (full / partial) |
|---|---|---|
| README.md | 2,103 | full |
| CONTRIBUTING.md | 220 | full |
| .claude-plugin/plugin.json | 82 | full |
| skills/engineering/ask-matt/SKILL.md | 1,952 | full |
| skills/engineering/to-spec/SKILL.md | 493 | full |
| skills/engineering/to-tickets/SKILL.md | 915 | full |
| skills/engineering/implement/SKILL.md | 103 | full |
| skills/engineering/implement-spec/SKILL.md | 445 | full |
| skills/engineering/tdd/SKILL.md, tests.md, mocking.md | 1,063 | full |
| skills/engineering/code-review/SKILL.md | 1,079 | full |
| skills/engineering/pr/SKILL.md | 560 | full |
| skills/engineering/retro/SKILL.md | 679 | full |
| skills/engineering/setup-matt-pocock-skills/SKILL.md | 1,126 | partial (§1–4) |
| skills/engineering/diagnosing-bugs/SKILL.md | 1,427 | partial (searched, Phases 1–6 key lines) |
| skills/productivity/writing-for-agents/SKILL.md | 1,775 | partial (searched) |
| skills/productivity/handoff/SKILL.md | 144 | full |
| skills/in-progress/README.md, skills/misc/README.md | 320 | full |
| docs/engineering/ask-matt.md | 1,715 | partial |
| package.json, .github/workflows/release.yml | — | full |
| docs/research/inventory/mattpocock.md (MP-01..05, MP-53..60, MP-77..80, headings) | — | partial |

## Machine-readable
```json
{"method":"mattpocock","version":"5863806dd4e15c63174bee4e7515a4256792ecfa","status":"implemented","scorer":"S-D",
 "methodology_sha256":"a6e3953725b67db0189e188c1495ee9b54975e48f65c28baaa01f459b69cf9a4",
 "scores":{
  "C1":{"s":2,"r":1.0,"ra":2,"conf":"M","ev":"I","first_unmet":"No quickstart walking one task end to end","cites":["README.md#Installation","skills/engineering/ask-matt/SKILL.md"]},
  "C2":{"s":2,"r":1.0,"ra":2,"conf":"M","ev":"I","first_unmet":"Acceptance criteria not required to be testable","cites":["skills/engineering/to-spec/SKILL.md#spec-template","skills/engineering/to-tickets/SKILL.md#local-ticket-template","MP-18"]},
  "C3":{"s":3,"r":1.0,"ra":3,"conf":"M","ev":"I","first_unmet":"No explicit counters to agent rationalizations","cites":["skills/engineering/tdd/SKILL.md#Rules of the loop","skills/engineering/tdd/mocking.md","skills/engineering/to-spec/SKILL.md#Process"]},
  "C4":{"s":2,"r":1.0,"ra":2,"conf":"M","ev":"I","first_unmet":"No DoD separate from AC; failure does not block completion; evidence not tied to last change","cites":["skills/engineering/implement/SKILL.md","skills/engineering/pr/SKILL.md#Evidence"]},
  "C5":{"s":2,"r":1.0,"ra":2,"conf":"M","ev":"I","first_unmet":"No tests/security axes or severity scale; no blocking-resolution rule in /implement","cites":["skills/engineering/code-review/SKILL.md","skills/engineering/implement-spec/SKILL.md#Steps","MP-68"]},
  "C6":{"s":2,"r":1.0,"ra":2,"conf":"M","ev":"I","first_unmet":"No bound/breaker on two loop types on the default path","cites":["skills/engineering/tdd/SKILL.md#Rules of the loop","skills/engineering/diagnosing-bugs/SKILL.md#Phase 1"]},
  "C7":{"s":2,"r":1.0,"ra":2,"conf":"M","ev":"I","first_unmet":"No codebase map declared on path; no conflict rule","cites":["skills/engineering/to-tickets/SKILL.md","skills/engineering/implement-spec/SKILL.md"]},
  "C8":{"s":2,"r":1.0,"ra":2,"conf":"L","ev":"I","first_unmet":"No preflight, halt list or resumable ledger","cites":["skills/engineering/implement-spec/SKILL.md","MP-80","MP-77"]},
  "C9":{"s":2,"r":1.0,"ra":2,"conf":"M","ev":"I","first_unmet":"No stable requirement IDs linked across three segments","cites":["skills/engineering/to-tickets/SKILL.md#issue-template","skills/engineering/implement-spec/SKILL.md"]},
  "C10":{"s":2,"r":1.0,"ra":2,"conf":"M","ev":"I","first_unmet":"Approvals not recorded; no owner roles","cites":["skills/engineering/to-tickets/SKILL.md#4","skills/engineering/to-spec/SKILL.md#Process"]},
  "C11":{"s":1,"r":1.0,"ra":1,"conf":"M","ev":"I","first_unmet":"No security skill or checklist","cites":["skills/productivity/handoff/SKILL.md","skills/engineering/wizard/SKILL.md"]},
  "C12":{"s":1,"r":1.0,"ra":1,"conf":"M","ev":"I","first_unmet":"No release checklist or deployment guidance","cites":["skills/engineering/pr/SKILL.md#Merge Danger"]},
  "C13":{"s":4,"r":1.0,"ra":4,"conf":"M","ev":"I","first_unmet":"No validator or token measurement","cites":["skills/engineering/ask-matt/SKILL.md#Context hygiene","skills/engineering/ask-matt/PHASE-BOUNDARIES.md","skills/productivity/writing-for-agents/SKILL.md","MP-03"]},
  "C14":{"s":3,"r":1.0,"ra":3,"conf":"M","ev":"I","first_unmet":"No separate risk axis forcing a heavier path","cites":["skills/engineering/ask-matt/SKILL.md#The main flow","skills/engineering/to-spec/SKILL.md#Process"]},
  "C15":{"s":3,"r":1.0,"ra":3,"conf":"M","ev":"I","first_unmet":"No upgrade-surviving customization layer","cites":["README.md#Installation","skills/engineering/tdd/agents/openai.yaml"]},
  "C16":{"s":2,"r":1.0,"ra":2,"conf":"M","ev":"I","first_unmet":"Retro yields suggestions, not owned recorded action items","cites":["skills/engineering/retro/SKILL.md"]}
 }}
```
