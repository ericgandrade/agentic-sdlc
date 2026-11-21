# Scorecard — Matt Pocock skills

| Field | Value |
|---|---|
| Method / version | Matt Pocock skills (mattpocock/skills, plugin `mattpocock-skills` 1.3.2) @ 5863806dd4e15c63174bee4e7515a4256792ecfa (commit date 2026-11-12) |
| Status | implemented |
| Scorer ID | S-A |
| Methodology version + sha256 | 1.0 / a6e3953725b67db0189e188c1495ee9b54975e48f65c28baaa01f459b69cf9a4 |
| Date | 2026-11-21 |
| Access | full (pinned clone). Unit of analysis = promoted buckets shipped in `.claude-plugin/plugin.json`; `misc/` (frozen, "not promoted") and `in-progress/` ("excluded from the plugin", beta) treated as outside the released method except where noted. |
| Conflict declaration | None. I did not author, plan, promote or receive positioning briefings for this method or any competing method. My model vendor (Anthropic) does not publish this method. |
| Criterion order used | C2 C3 C7 C4 C11 C15 C1 C9 C14 C16 C10 C12 C13 C6 C5 C8 |

## Default path trace (scenario R)

1. Install the plugin (one command), run `/setup-matt-pocock-skills` once per repo (issue tracker, triage labels, domain-doc layout written to `docs/agents/`).
2. `/ask-matt` (router) names the main flow. `/grill-with-docs` = `grilling` (frontier rounds until the design tree is empty; facts looked up by sub-agent) + `domain-modeling` (GLOSSARY.md, ADRs inline).
3. R (3–10 tasks) is a multi-session build → `/to-spec`: explore repo, confirm test seams with the user, write spec (problem, solution, user stories, implementation decisions, testing decisions, out of scope) and publish to the tracker as `ready-for-agent`.
4. `/to-tickets`: vertical tracer-bullet tickets with blocking edges and acceptance-criteria checkboxes; user approves the breakdown; published (sub-issues of the spec on a real tracker).
5. Build: `/implement` per ticket (fresh context; `tdd` at pre-agreed seams; typecheck, files, full suite at end; `code-review`; commit) or `/implement-spec` (task graph, parallel implementer subagents in worktrees on the ready frontier, merger subagent, one `code-review` on the integration branch, one fix pass, draft PR marked closing spec and tickets).
6. `pr` shapes the PR body (summary visual, before/after evidence, merge danger). `/retro` suggests environment improvements. Method ends at PR/merge.

## Scores

| ID | Criterion | Score (D) | r | RA | Conf | Ev. type | Evidence | Rationale: requirements met per level; first unmet requirement |
|---|---|---|---|---|---|---|---|---|
| C1 | Ease of adoption | 2 | 1.0 | 2 | M | I | README.md #Installation (1 command + `/setup-matt-pocock-skills`, "30-second setup"); skills/engineering/ask-matt/SKILL.md (router); setup-matt-pocock-skills/SKILL.md; docs/engineering/*.md | L1–2: install in ≤3 steps; stated first command (`/setup-matt-pocock-skills`, then `/grill-with-docs` per ask-matt); core reading load ≈5k words. **First unmet (L3):** no quickstart that walks one task end to end as a worked example (ask-matt describes the flow; docs pages describe single skills). |
| C2 | Requirements and specification | 2 | 1.0 | 2 | M | I | productivity/grilling/SKILL.md; engineering/domain-modeling/SKILL.md; engineering/to-spec/SKILL.md (spec template incl. Out of Scope); engineering/to-tickets/SKILL.md (acceptance-criteria checkboxes) | L1–2: clarification interview on the default path that runs until the frontier is empty and waits for confirmation; spec template with explicit out-of-scope; tickets carry criteria checkboxes. **First unmet (L3):** acceptance criteria are not required to be testable (no Given/When/Then, EARS or measurability rule; spec carries user stories, tickets free-form criteria). |
| C3 | Code quality practices | 3 | 1.0 | 3 | M | I | engineering/tdd/SKILL.md (Rules of the loop, Seams, Anti-patterns), tests.md, mocking.md; engineering/implement/SKILL.md ("tdd … at pre-agreed seams"); to-spec step 2 (seams); codebase-design/SKILL.md; domain-modeling ADR rule; code-review smell baseline (Speculative Generality) | L3: build path drives `tdd` (red before green) per ticket; design discipline (seams agreed before tests, deep-module design, ADRs); simplicity rule ("Don't anticipate future tests or add speculative features"). Partial L4: mock limits (boundaries only), anti-pattern catalogue (implementation-coupled, tautological, horizontal slicing). **First unmet (L4):** no explicit counters to agent rationalizations, and "watch the test fail" is not required in `tdd` (only in diagnosing-bugs); refactoring is deferred to review rather than a defined step. |
| C4 | Verification and evidence | 2 | 1.0 | 2 | M | I | engineering/implement/SKILL.md (typecheck, single files, full suite once at end); engineering/pr/SKILL.md #Evidence (before/after test run); to-tickets acceptance checkboxes; diagnosing-bugs Phase 6 checklist | L1–2: verification advice plus checklists (ticket criteria, PR before/after evidence, debug cleanup checklist). **First unmet (L3):** no gate requiring command output run after the last change before a completion claim (code-review fixes happen after the suite run; no "failure blocks completion" rule; no DoD separate from criteria). |
| C5 | Code review rigor | 2 | 1.0 | 2 | M | I | engineering/code-review/SKILL.md (two parallel fresh sub-agents: Standards incl. Fowler smell baseline, and Spec); implement step "call code-review"; implement-spec step 7 (one fix pass) | L1–2: review step on the default path, in independent fresh contexts, two axes. **First unmet (L3):** no severity scale (only hard violation vs judgement call), no rule that blocking findings be resolved before merge on the `/implement` path, and the checklist lacks test and security axes. |
| C6 | Loop engineering | 2 | 1.0 | 2 | M | I | engineering/tdd/SKILL.md (red→green loop); engineering/diagnosing-bugs/SKILL.md (phase gates, completion criteria, "When you genuinely cannot build a loop: stop… ask"); implement-spec step 7 (single fix pass) | L1–2: named loops with steps (red-green; diagnosis loop). **First unmet (L3):** no loop has a numeric bound; only the diagnosis loop has an exit criterion plus a breaker/escalation, so the "two loop types each with exit, bound or breaker and escalation" requirement fails. |
| C7 | Graph engineering | 2 | 1.0 | 2 | M | I | engineering/to-tickets/SKILL.md (blocking edges, "Work the frontier"); engineering/implement-spec/SKILL.md (task graph, ready frontier, worktree per implementer, merger subagent) | L2: E declared and in fact used (frontier dispatch with integration step). **First unmet (L3):** no codebase or knowledge map is declared (GLOSSARY.md is a domain vocabulary "devoid of implementation details", not a dependency/module/domain graph; improve-codebase-architecture writes a throwaway HTML report to tmp). |
| C8 | Autonomous execution safety | 1 | 1.0 | 1 | M | I | ask-matt/PHASE-BOUNDARIES.md Q4 ("Can the task be done AFK? … subagent"); implement-spec (background implementers in worktrees) | L1: unattended running mentioned (AFK subagents, background implementers) with one safeguard (worktree isolation). **First unmet (L2):** no unattended mode with two safeguards (no halt conditions). `misc/git-guardrails-claude-code` (push-blocking hook) is frozen and outside the plugin, so not credited. |
| C9 | Traceability end to end | 2 | 1.0 | 2 | M | I | to-tickets (tickets as sub-issues of the spec issue; blocking references); implement-spec step 3/8 (draft PR "marked as closing the spec and tickets"); code-review step 2 (finds spec via issue refs in commits) | L1–2: tracker IDs for spec and tickets, linked spec → ticket. **First unmet (L3):** a third linked segment is not kept on the default path: `/implement` commits carry no required ticket reference; the PR link exists only on the implement-spec + real-tracker route; user stories are numbered but tickets do not cite them. |
| C10 | Human governance | 2 | 1.0 | 2 | H | I | grilling ("Do not act on it until the user confirms"); to-spec step 2 (confirm seams); to-tickets step 4 ("Iterate until the user approves the breakdown"); tdd (confirm seams) | L1–2: defined stop points where the agent waits. **First unmet (L3):** approvals are not recorded (who, when, version) and no decision-owner roles are named. |
| C11 | Security by default | 1 | 1.0 | 1 | H | I | diagnosing-bugs #Redact; handoff (redact sensitive info); wizard (`ask_secret`) | L1: secret redaction in shown output and hidden secret entry are mentioned. **First unmet (L2):** no security skill or checklist for the delivered code (no security review lens, dependency hygiene, threat modeling, injection guidance). |
| C12 | Release and operations | 1 | 1.0 | 1 | H | I | engineering/wizard/SKILL.md (human-run provisioning, migration or cutover scripts); pr/SKILL.md #Merge Danger | L1: deployment-adjacent work (migration/cutover, provisioning) mentioned. **First unmet (L2):** no release checklist or deployment guidance for the delivered change. |
| C13 | Context engineering and token efficiency | 4 | 1.0 | 4 | M | I | productivity/writing-for-agents/SKILL.md (context pointers, context load, progressive disclosure); ask-matt #Context hygiene + PHASE-BOUNDARIES.md (continue/clear/handoff/subagent/compact tree; ~150k smart zone); implement-spec (fresh subagents, context pointers, exploration notes in files); code-review (separate sub-agents, "Under 400 words"); retro #Files (CODING_STANDARDS read in review only; >1,000 lines → pointers); handoff ("Do not duplicate content … reference by path") | L3: systematic progressive disclosure, file/tracker hand-offs, fresh subagents with explicit briefs. L4: size budgets (smart zone, report word caps, 1,000-line standards limit, tickets sized to one context window); compaction/resume protocol at phase boundaries; role hygiene (standards imposed by reviewer, not implementer; axes isolated); single-source-of-truth rules. **First unmet (L5):** no validator enforcing budgets and no token measurement or eval. |
| C14 | Right-sizing and brownfield | 3 | 1.0 | 3 | M | I | ask-matt main flow step 3 ("is this a multi-session build?"), wayfinder ("too big for one session… never a well-scoped feature"), standalone `/tdd`; setup-matt-pocock-skills #1 Explore; to-spec step 1; domain-modeling (glossary + ADRs recorded) | L2–3: explicit routing among ≥3 paths by a stated size criterion (fits one session / multi-session / too big for one session); brownfield entry (explore repo, record domain language and decisions in GLOSSARY.md and ADRs, respect existing ADRs). **First unmet (L4):** no separate risk axis forcing a heavier path regardless of size. |
| C15 | Portability and extensibility | 4 | 1.0 | 4 | M | I | README.md #Installation (Claude Code, Codex, Copilot, Gemini, `npx skills` for Cursor/OpenCode/others); skills/*/agents/openai.yaml; setup-matt-pocock-skills (per-repo `docs/agents/` config); SCOPE.md; CONTRIBUTING.md; productivity/writing-for-agents; .agents/writing-docs.md | L3: ≥3 platforms with plain Markdown; documented customization (per-repo config, editable copies). L4: per-platform adapter metadata (agents/openai.yaml invocation policy), customization layer that survives upgrades (`docs/agents/*`, CLAUDE.md/AGENTS.md), contribution guide plus authoring standards (borderline: contributions are issue-only). **First unmet (L5):** no CI validation of skills (workflows only release and triage; `claude plugin validate` is a manual step) and no versioned extension interface. |
| C16 | Learning loop and measured outcomes | 2 | 1.0 | 2 | M | I | engineering/retro/SKILL.md; ask-matt main flow step 4 | L1–2: a defined retrospective procedure, named as the final main-flow step, targeting environment changes (mechanical mistakes → deterministic checks). **First unmet (L3):** it produces no owned or recorded action items (candidates are presented in chat only). |

## Concreteness test (design-only)
n/a

## Weakest criteria
1. C8 Autonomous execution safety — 1: background/AFK subagents without halt conditions, preflight or resumable state.
2. C11 Security by default — 1: only output redaction; no security lens or checklist.
3. C12 Release and operations — 1: only migration/cutover wizards and merge-danger notes; no release or rollback guidance.

## Realization risks (design-only)
n/a

## Claims not scored
| Claim | Source | Reason |
|---|---|---|
| Git push/reset blocked by hook | skills/misc/git-guardrails-claude-code | Frozen misc bucket, outside the plugin; off the default path |
| Husky pre-commit with lint, typecheck, tests | skills/misc/setup-pre-commit | Frozen misc bucket, outside the plugin |
| dependency-cruiser deep-module enforcement | skills/in-progress/setup-ts-deep-modules | Beta, excluded from the plugin |
| Software factory with observability platforms and runners | skills/in-progress/software-factory | Beta, excluded from the plugin; vocabulary only |
| "Use them every time you want to make a change" | README | Advice, not a mechanism |

## Search log
| Criterion | Paths / probe terms | Hits used | Hits rejected (reason) |
|---|---|---|---|
| C1 | README, install, setup, router, quickstart, doctor | README, ask-matt, setup skill | .out-of-scope/setup-skill-verify-mode.md (verify mode explicitly rejected) |
| C2 | spec, acceptance, user story, out of scope, clarify | grilling, domain-modeling, to-spec, to-tickets | — |
| C3 | tdd, red, green, mock, seam, YAGNI, refactor, ADR | tdd/*, codebase-design, code-review smells | misc/setup-pre-commit (off plugin) |
| C4 | verify, evidence, full suite, done | implement, pr Evidence, diagnosing-bugs Phase 6 | docs "It's working if" (human docs, not agent gate) |
| C5 | review, severity, finding, fix | code-review, implement-spec step 7 | — |
| C6 | loop, retry, round, cap, escalate | tdd, diagnosing-bugs | — |
| C7 | blocking, frontier, graph, map, parallel | to-tickets, implement-spec | GLOSSARY-MAP.md (context location map, not a graph) |
| C8 | AFK, background, worktree, halt, resume, budget, push | PHASE-BOUNDARIES Q4, implement-spec | git-guardrails (misc), in-progress/software-factory |
| C9 | issue, sub-issue, closes, ID, trace | to-tickets, implement-spec, code-review step 2 | — |
| C10 | approve, confirm, wait, owner | grilling, to-spec, to-tickets | — |
| C11 | security, secret, threat, injection, OWASP | diagnosing-bugs Redact, handoff, wizard | HTML-REPORT mermaid securityLevel (unrelated) |
| C12 | deploy, release, rollback, monitor, incident | wizard, pr merge danger | ADR-FORMAT "deployment target" (example) |
| C13 | context, token, compact, subagent, pointer, budget | writing-for-agents, ask-matt, PHASE-BOUNDARIES, implement-spec, code-review, retro | — |
| C14 | size, session, small, existing codebase, legacy | ask-matt routing, wayfinder, setup, to-spec | — |
| C15 | Codex, Copilot, Gemini, Cursor, customize, contributing | README, openai.yaml, setup, CONTRIBUTING, SCOPE | — |
| C16 | retro, lessons, metrics | retro, ask-matt step 4 | — |

## Files read
| Path | Words | Read (full / partial) |
|---|---|---|
| README.md | 2103 | full |
| CLAUDE.md, CONTRIBUTING.md, SCOPE.md | 1063 | full / partial |
| .claude-plugin/plugin.json | 82 | full |
| skills/engineering/ask-matt/SKILL.md + PHASE-BOUNDARIES.md | 2649 | full |
| skills/engineering/grill-with-docs/SKILL.md | 35 | full |
| skills/productivity/grilling/SKILL.md | 329 | full |
| skills/engineering/domain-modeling/SKILL.md | 463 | full |
| skills/engineering/to-spec/SKILL.md | 493 | full |
| skills/engineering/to-tickets/SKILL.md | 915 | full |
| skills/engineering/implement/SKILL.md | 103 | full |
| skills/engineering/implement-spec/SKILL.md | 445 | full |
| skills/engineering/tdd/SKILL.md, tests.md, mocking.md | 1063 | full |
| skills/engineering/code-review/SKILL.md | 1079 | full |
| skills/engineering/retro/SKILL.md | 679 | full |
| skills/engineering/diagnosing-bugs/SKILL.md | 1427 | full |
| skills/engineering/pr/SKILL.md | 560 | partial |
| skills/engineering/setup-matt-pocock-skills/SKILL.md | 1126 | partial |
| skills/engineering/improve-codebase-architecture/SKILL.md | 904 | partial |
| skills/productivity/handoff/SKILL.md | 144 | full |
| skills/productivity/writing-for-agents/SKILL.md | 1775 | partial (grep) |
| skills/misc/README.md, git-guardrails-claude-code/SKILL.md | 373 | partial |
| skills/in-progress/README.md, software-factory/SKILL.md | 1195 | partial |
| skills/engineering/tdd/agents/openai.yaml, implement/agents/openai.yaml | 20 | full |
| .github/workflows/release.yml | 76 | partial |
| docs/research/inventory/mattpocock.md | 18540 | not relied on (direct source read instead) |

## Machine-readable
```json
{"method":"mattpocock","version":"5863806dd4e15c63174bee4e7515a4256792ecfa","status":"implemented","scorer":"S-A",
 "methodology_sha256":"a6e3953725b67db0189e188c1495ee9b54975e48f65c28baaa01f459b69cf9a4",
 "scores":{
  "C1":{"s":2,"r":1.0,"ra":2,"conf":"M","ev":"I","first_unmet":"No end-to-end worked quickstart","cites":["README.md#installation-30-second-setup","skills/engineering/ask-matt/SKILL.md"]},
  "C2":{"s":2,"r":1.0,"ra":2,"conf":"M","ev":"I","first_unmet":"Acceptance criteria not required to be testable","cites":["skills/productivity/grilling/SKILL.md","skills/engineering/to-spec/SKILL.md","skills/engineering/to-tickets/SKILL.md"]},
  "C3":{"s":3,"r":1.0,"ra":3,"conf":"M","ev":"I","first_unmet":"No rationalization counters; failing test not required to be observed; no refactor step","cites":["skills/engineering/tdd/SKILL.md","skills/engineering/tdd/mocking.md","skills/engineering/implement/SKILL.md"]},
  "C4":{"s":2,"r":1.0,"ra":2,"conf":"M","ev":"I","first_unmet":"No post-last-change verification gate that blocks completion","cites":["skills/engineering/implement/SKILL.md","skills/engineering/pr/SKILL.md#evidence"]},
  "C5":{"s":2,"r":1.0,"ra":2,"conf":"M","ev":"I","first_unmet":"No severity scale or blocking-resolution rule; no tests/security axes","cites":["skills/engineering/code-review/SKILL.md"]},
  "C6":{"s":2,"r":1.0,"ra":2,"conf":"M","ev":"I","first_unmet":"Fewer than two loops with exit criterion, bound/breaker and escalation","cites":["skills/engineering/tdd/SKILL.md","skills/engineering/diagnosing-bugs/SKILL.md"]},
  "C7":{"s":2,"r":1.0,"ra":2,"conf":"M","ev":"I","first_unmet":"No codebase or knowledge map declared","cites":["skills/engineering/to-tickets/SKILL.md","skills/engineering/implement-spec/SKILL.md"]},
  "C8":{"s":1,"r":1.0,"ra":1,"conf":"M","ev":"I","first_unmet":"No unattended mode with two safeguards","cites":["skills/engineering/ask-matt/PHASE-BOUNDARIES.md","skills/engineering/implement-spec/SKILL.md"]},
  "C9":{"s":2,"r":1.0,"ra":2,"conf":"M","ev":"I","first_unmet":"No third linked segment on the default path","cites":["skills/engineering/to-tickets/SKILL.md","skills/engineering/implement-spec/SKILL.md"]},
  "C10":{"s":2,"r":1.0,"ra":2,"conf":"H","ev":"I","first_unmet":"Approvals not recorded; no owner roles","cites":["skills/productivity/grilling/SKILL.md","skills/engineering/to-tickets/SKILL.md"]},
  "C11":{"s":1,"r":1.0,"ra":1,"conf":"H","ev":"I","first_unmet":"No security skill or checklist","cites":["skills/engineering/diagnosing-bugs/SKILL.md#redact"]},
  "C12":{"s":1,"r":1.0,"ra":1,"conf":"H","ev":"I","first_unmet":"No release checklist or deployment guidance","cites":["skills/engineering/wizard/SKILL.md","skills/engineering/pr/SKILL.md"]},
  "C13":{"s":4,"r":1.0,"ra":4,"conf":"M","ev":"I","first_unmet":"No budget validator or token measurement","cites":["skills/productivity/writing-for-agents/SKILL.md","skills/engineering/ask-matt/PHASE-BOUNDARIES.md","skills/engineering/implement-spec/SKILL.md","skills/engineering/retro/SKILL.md"]},
  "C14":{"s":3,"r":1.0,"ra":3,"conf":"M","ev":"I","first_unmet":"No separate risk axis","cites":["skills/engineering/ask-matt/SKILL.md","skills/engineering/setup-matt-pocock-skills/SKILL.md","skills/engineering/to-spec/SKILL.md"]},
  "C15":{"s":4,"r":1.0,"ra":4,"conf":"M","ev":"I","first_unmet":"No CI validation of skills; no versioned extension interface","cites":["README.md#installation-30-second-setup","skills/engineering/tdd/agents/openai.yaml","CONTRIBUTING.md"]},
  "C16":{"s":2,"r":1.0,"ra":2,"conf":"M","ev":"I","first_unmet":"No owned or recorded action items","cites":["skills/engineering/retro/SKILL.md"]}
 }}
```
