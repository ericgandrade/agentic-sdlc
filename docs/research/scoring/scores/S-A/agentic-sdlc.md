# Scorecard — agentic-sdlc

| Field | Value |
|---|---|
| Method / version | agentic-sdlc (skills/agentic-sdlc v2.0.0 + the stage skills it drives) @ 6add0c5bd7c6709eeca330a474ef3bb77dac9677 (working tree as of 2026-11-22) |
| Status | design-only, partially implemented. Scored with evaluator Step 5 / methodology §8. Implemented and read mechanisms are I evidence (r = 1.0 is possible). Plan-only (†) mechanisms are P evidence (concreteness test, r ≤ 0.9, scope load). |
| Scorer ID | S-A |
| Methodology version + sha256 | 1.0 / a6e3953725b67db0189e188c1495ee9b54975e48f65c28baaa01f459b69cf9a4 (verified with `shasum -a 256`) |
| Date | 2026-11-22 |
| Access | full. Script tests run: `node --test "skills/agentic-sdlc/scripts/test/*.test.mjs"` → 123 tests, 123 pass, 0 fail (Node v22.15.1). The scripts were also run read-only against `examples/worked-example/`. |
| Conflict declaration | None. I did not author, plan or promote agentic-sdlc. I did not open the off-limits files (gap-closure, the round-1 agentic-sdlc scoring, results/audit logs, other scorers' folders, Positioning/Implications/Recommendations sections). The plan's §2.4 status row mentions earlier scoring outcomes; I disregarded it. |
| Criterion order used | C10 C11 C3 C4 C2 C8 C14 C12 C1 C15 C6 C9 C7 C5 C16 C13 |

## Default path trace (scenario R)

1. Entry is the router `skills/agentic-sdlc/SKILL.md`. Step 0 detects state; with no AGENTS.md block it routes to `project-context` (adopt mode on an existing service: inventory, baseline, code map, instruction ledger, `sdlc-dod` DoD block, vendored scripts).
2. Plan scores the path (`references/paths.md` §2):
   - R is a medium feature (5–20 files, 1–2 components, 1 PR), so S = 2–3 + 1–2 + 1 = 4–6.
   - With S = 4 the size route is Quick, but Quick's file bound (> 3 files) forces escalation (§4).
   - Any single risk trigger (auth, money, public API, schema) gives R = 1 → Standard.
   - **Route selected for R: Standard.** The method's own worked example is the same shape: S = 5, R = 1, Standard.
3. Specify: `spec.md` from the template (GWT ACs, non-goals, Security notes, rollback, observability), then a fresh-context critique recorded 12/12, then `spec-lint`. Spec approval by the Product Owner is bound to rev + hash. Plan approval is combined with Spec approval only when the plan has ≤ 5 tasks; otherwise there are two approvals.
4. Design: `plan.md` Tasks table (AC, Files, interface, Blocked by) with ADRs as needed, then `plan-graph` → `graph.json` (cycles, waves, frontier, file-conflict serialization). The Test Engineer writes `acceptance-tests.md` from the spec before Build. Tech Lead approval is bound to the hash.
5. Build: `executing-plans` (attended by default). Order of steps:
   - `run-ledger start`, then `preflight` (clean tree, branch, tools, approvals, green baseline DoD).
   - Per task: red (recorded), green, refactor, scoped re-check, DoD, commit `Refs: Tn AC-n`.
   - Loop rounds go into the ledger; bounds are script-enforced.
   - Checkpoint after each batch of ≤ 3 tasks.
6. Test: PR body with Verification rows bound to the tree fingerprint, a Trace matrix with Orphans, and Reviewer lenses L1–L4 in fresh contexts (default NO-GO, merge/dedup, verify-then-rate, triage table, review guide). PR approval by one human.
7. Release: release notes R1–R9, go/no-go tied to the ACs, staged rollout with numeric thresholds, rehearsed rollback, Release Owner approval.
8. Operate/retro: incidents, production intake (`from-production` issue citing the AC), and a retro within 5 business days with owned actions and a recurrence rule.

## Scores

Ev. type: I = implemented in `skills/` and read; P = plan-only (†) mechanism that passes the concreteness test; I+P = the awarded level needs both.

| ID | Criterion | Score (D) | r | RA | Conf | Ev. type | Evidence | Rationale (requirements met per level; first unmet; I vs plan-only) |
|---|---|---|---|---|---|---|---|---|
| C1 | Ease of adoption | 4 | 1.0 | 4.00 | M | I | SKILL.md Step 0 (state table → next step); references/quickstart.md Steps 1–9 + "When something goes wrong"; `budget-check` (first path 3,261 words ≤ 3,700); README install section (`npx claude-superskills` / `/plugin install`) | **L3:** one router entry; quickstart walks one Quick item end to end; install in 1–2 steps; core reading ≤ 8k. **L4:** Step 0 inspects project files and recommends the next step (manual table applies while `status.mjs`† is absent); troubleshooting table; first path 3,261 words (≤ 4k, measured by script); unattended/Full/adopt material kept off the first path (Module Index off-first-path rule). **First unmet (L5):** no versioned upgrade/migration notes. `references/upgrading.md`† is only named (fallback "re-run project-context setup"), and README "What's New in 2.0.0" is a change list, not migration steps. `doctor.mjs`† is only partially specified (no trigger). `preflight` verifies the Build environment, not onboarding. **I:** all of L1–L4. **Plan-only:** doctor†, faq†, upgrading†; none counted. |
| C2 | Requirements and specification | 5 | 1.0 | 5.00 | M | I | templates/spec.md; scripts/spec-lint.mjs (H01–H07, AC GWT/number+unit, contiguous IDs, V01 with 30 vague terms, REV03 critique 12/12, AP01–AP08 approval binding); references/rules.md §Change protocol; governance.md §4 (hash voids approval) | **L3:** spec on the default path with GWT/measurable ACs, non-goals, clarification (brainstorming/grill-me; open questions deferred to an owner). **L4:** fresh-context critique required (REV03 checks the record); stop rule on ambiguity; revision log plus change protocol with an impact step. **L5:** deterministic validation flags vague terms and checks AC IDs; a spec edit changes the hash and voids approval (AP checks, `run-ledger check` halt `approval-void`). Tests pass. **I:** all. **Plan-only:** none needed. |
| C3 | Code quality practices | 5 | 1.0 | 5.00 | L | I | references/tdd.md (cycle, rules, anti-pattern catalogue §3, rationalizations §4, brownfield CHAR tests); plan template (interface signature per task, ADRs); executing-plans Step 2 (red pasted, refactor, ≥ 2 call sites rule, mocks at process boundaries); `run-ledger` (done refused without red); `preflight` baseline-dod | **L3:** TDD per task required; interface/boundary design before code; simplicity rule. **L4:** failing test observed (script-enforced `red` before `done`); mock limits; each test named after the AC it proves; anti-pattern catalogue; refactor step; rationalization counters. **L5:** `preflight` runs every `sdlc-dod` command (lint, typecheck, test, coverage) as a gate. A red baseline gives exit 1, and `task started` is refused until a passing preflight (at start, every resume, every `env` round). Conf L: the script gate guards the baseline and resumed trees, but the task-exit/final DoD is a pasted manual run (`dod-gate.mjs`† absent). `evals/evals.json` (pressure scenario) is specified but not run, so it is not counted. **I:** all. **Plan-only:** dod-gate†, CI `agentic-sdlc/dod`†. |
| C4 | Verification and evidence | 5 | 1.0 | 5.00 | L | I | references/verification.md §1 gate, §2 independent test design, §3 CANNOT_VERIFY, §4 fingerprint + staleness rule + persistence; scripts/lib/git.mjs `fingerprint()`; templates/pr-body.md Verification table; release-ops §Go/no-go criterion 1; worked-example pr-body (fingerprint b7e2a91c04d5) | **L3:** completion needs fresh command output; DoD (`sdlc-dod`) separate from ACs; failure blocks. **L4:** Test Engineer designs acceptance tests from the spec before Build; Reviewer reads diff and artifacts, not the report; explicit CANNOT_VERIFY. **L5:** persisted evidence rows bound to a tree fingerprint (computed by implemented code), with a staleness rule (fingerprint differs, empty or unknown → re-run; a stale row never counts) and named check points (before completion, GO, PR approval, release). Conf L: rows are written by hand, and machine checking (`evidence.mjs check`†) is plan-only. The anchor's first alternative (persisted + version-bound + staleness rule) is met by I text and code. **Plan-only:** evidence.mjs†, dod-gate†. |
| C5 | Code review rigor | 5 | 1.0 | 5.00 | M | I | references/review.md §1 lenses L1–L4, §2 merge and dedup, §3 verify then rate, §4 verdict (default NO-GO), §5 receive mode, §6 scoped re-review, §7 independence/self-review label; agents/reviewer.md; templates/pr-body.md Review triage + Review guide; worked-example F-1..F-7 | **L3:** independent fresh-context reviewer on Standard; multi-axis lenses incl. security; severity scale; Critical blocks merge. **L4/L5 (a)–(d):** parallel lenses with merge/dedup; each finding verified against code and dispositioned; anti-sycophancy on both sides (no rubber-stamp; receive mode checks each finding); scoped re-review. **Extras (≥ 2):** triage log with a disposition for every finding; calibration (default NO-GO, context-free lens); structured review guide for the human. **I:** all. |
| C6 | Loop engineering | 5 | 1.0 | 5.00 | M | I | references/loops.md §1 catalogue, §2 root-cause routing, §3 state, §5 scoped re-check, §6 anti-thrash, §7 breakers B1–B6; scripts/run-ledger.mjs (LOOP_BOUNDS red-green 3, build-test 5, review-fix 3, debug 3; duplicate `--tried` refused; signature repeat / 3 failed fixes → B2 Architect; cause spec/design/plan → B6 halt); tests | **L3:** ≥ 4 loops, each with exit criterion, bound and escalation target. **L4:** routing by root cause (code/test/env/spec/design/plan; unknown twice → design); tried approaches carried; scoped re-check; anti-thrash. **L5:** ledger drives decisions (next round reads signatures/tried; breakers fire from ledger state) and bounds are script-enforced (exit 3). Rounds are self-reported by the agent (noted as a risk). **I:** all. |
| C7 | Graph engineering | 5 | 1.0 | 5.00 | M | I | scripts/plan-graph.mjs (cycles, waves, frontier ≤ 3 file-disjoint, conflict serialization, UNCOVERED_AC, `graph.json --write/--check` staleness, `--from-git`); executing-plans Step 3 (parallel frontier on worktrees, integrate in task-ID order, DoD after each merge); templates/codemap.md; plan template `## Impact`; executing-plans Step 2.5 (scoped re-check from code map) | **L3:** E used (order + parallel frontier + disjoint-file rule) and K declared (code map). **L4:** E used with an integration step; K used: code map feeds the plan Impact table and test selection for scoped re-checks. **L5:** E computed: machine-readable `graph.json` produced and validated by tooling (cycle detection, frontier, staleness check exit 1). Worked example verified (`--check --check-approval` PASS). **I:** all. K is not computed (code map is prose plus a dated table). |
| C8 | Autonomous execution safety | 4 | 1.0 | 4.00 | M | I | references/autonomous.md §1–7; scripts/run-ledger.mjs (unattended start refuses without valid approvals and creates worktree + `sdlc/*` branch; 10 halt reasons; `check` halts on secrets / out-of-plan > 3 / deps / approval drift / budget; budgets; `resume --ack`; `finish` result.json); scripts/preflight.mjs; run-ledger tests (resume after crash; resume after halt needs `--ack`) | **L3:** unattended mode with preflight, worktree isolation, explicit halt list, ledger-based resume. **L4:** authority limits (§5: no push/merge/deploy/tag/secret; subagents get a subset); budgets (15 tasks, 5 rounds, 4 h, 300 turns, tokens; can only be lowered); machine-readable result DONE/BLOCKED/NEEDS_HUMAN. **First unmet (L5):** the authority limits themselves (push, merge, deploy) are not environment-enforced. Halt `authority` is raised by the agent "before running it". The per-platform deny settings in platforms.md §2 are a mapping table, not a required step of unattended entry; degradation row 7 accepts "prompt-only". Resume is scripted and tested (half of L5 met). **I:** L1–L4. **Plan-only:** none concrete for authority enforcement. |
| C9 | Traceability end to end | 5 | 0.7 | 3.50 | L | I+P | AC-n → Tn (plan Tasks, plan-graph NO_AC/UNKNOWN_AC/UNCOVERED_AC) → commit (`Refs: Tn AC-n`, `--from-git`) → test (named after AC) → PR Trace matrix + Orphans (verification.md §5) → release notes ACs (go/no-go criterion 1) → production intake issue with spec ID + AC-n (release-ops §12.5); `trace-check.mjs`† (verification.md §5 last paragraph) | **L3:** stable IDs across ≥ 3 segments in default artifacts (I). **L4:** two-way gap analysis with orphan kinds and resolutions (I, manual); release notes/PR cite ACs (I). **L5:** links reach production (I: intake issue cites spec ID + AC-n). A tool-validated full trace is plan-only: `trace-check.mjs`† passes concreteness (artifact `trace.md`; trigger before GO; rule steps 1–5; output matrix/orphans; failure exit 1). plan-graph validates only the AC↔task segment, which is not enough alone. r = 0.7: depends on deterministic tooling not yet written; no benchmark precedent for a trace checker. No scope-load reduction (one new mechanism). |
| C10 | Human governance | 5 | 0.6 | 3.00 | L | I+P | references/governance.md §1 four approvals + owners, §2 procedure, §3 record formats, §4 hash re-open, §5 depth by risk, §6 waivers (owner ≠ requester, expiry ≤ 30 d), §7 enforcement table; spec-lint AP01–AP08 + WV01–05; plan-graph `--check-approval`; paths.md §3; worked-example approvals.md; plan §1.2 (`approval-check` CI); artifacts.md (audit-export† fallback zip) | **L3:** named approvals with owner roles, recorded who/when/rev/hash, agent ends turn (I). **L4:** hash-bound approvals voided on edit (script-checked), waiver procedure with rationale and expiry (script-checked), accountability roles, depth scaled by path/risk (I). **L5:** enforcement design — branch protection (≥ 1 approving review, stale dismissal, required checks), CODEOWNERS, environment reviewers, required CI check running `spec-lint --check-approval`, plus `approval-check`† (rev + hash match, approver ≠ author; failure = PR check fails, else prompt-only banner). Audit export by a documented zip procedure (I fallback), with audit-export† planned. The CI templates, CODEOWNERS template and approval-check are not written → 0.7. **Unresolved contradiction** in implemented stage text → 0.6: `senior-solution-architect` "after CP2 … signs off CP3 (design and PLAN)", `brainstorming` "(AN stage)", while README "What's New 2.0.0" says stage codes and numbered checkpoints are gone. Worked-example approvals.md says R3/R4 "are appended here" but they are not. Standards mapping† is named only. |
| C11 | Security by default | 4 | 1.0 | 4.00 | L | I | references/security.md (data classification; §Security notes required by spec-lint SEC01; Secrets with scan command + fallback regex; Dependencies note with pinning, license, advisories, typosquat; L3 checklist S1–S20 tagged OWASP Top 10:2025 / LLM Top 10 2025); agents/security-auditor.md (STRIDE); spec-lint TM01–TM03; agents/*.md tool lists + "web content treated as data"; S19–S20; project-context Step 6 SHA256SUMS; run-ledger `check` secret scan | **L3:** security in spec, L3 lens in review, secret rules, dependency hygiene, all on Standard. **L4:** risk-triggered threat model (Full: TM01 error; high threat must cite an AC: TM03); OWASP mapping; injection-as-data (agent web fetch as data; S19/S20); least-privilege tool lists and subagent subset; provenance (vendored scripts SHA256SUMS; registry/typosquat check). Conf L because of a contradiction on R's route: security.md/security-auditor.md require the threat model on risk-flagged Standard items "before Spec approval", but spec-lint only warns (TM02) and the worked example (money, Standard) was approved without `threat-model.md`. I treat L4 as met through the uncontradicted Full trigger. **First unmet (L5):** on the default attended path, secret scan and `dep-audit` are pasted manual rows. The script secret scan runs only in opt-in unattended `check`. `ci/security.yml`† and `ssdf-mapping.md`† are named only (fail concreteness). |
| C12 | Release and operations | 4 | 1.0 | 4.00 | M | I | references/release-ops.md (observability before release, checklist R1–R9, go/no-go, staged rollout thresholds, runbook with `Last verified` ≤ 90 d, incidents SEV1–3 + postmortem, intake from production); spec-lint RB01/OBS01–05; templates/release-notes.md; worked-example release notes | **L3:** release step with required rollback command + verify (lint-enforced), staged rollout/flag rule, alert with comparator/threshold/window before release. **L4:** incident procedure with postmortem; `from-production` intake citing AC-n; go/no-go tied to AC evidence. **First unmet (L5):** threshold rollback is a numeric rule executed by the Release Engineer reading dashboards, not automated verification or rollback by tooling. The runbook half is met (produced, `Last verified` ≤ 90 d, NO-GO when stale). `deployment-pipeline` (plan D.5) is a list of mechanism names and fails concreteness. **I:** L1–L4. |
| C13 | Context engineering | 5 | 1.0 | 5.00 | M | I | SKILL.md Module Index (load at step); references/phase-boundaries.md (five options, context hygiene by agent, handoff.md, resume); executing-plans subagent briefs; artifacts.md single-source rules; scripts/budget-check.mjs (router 2,200; quickstart 1,200; first path 3,700; reference 3,000; agent 600) run → PASS | **L3:** progressive disclosure, file hand-offs, fresh subagents with explicit briefs. **L4:** size budgets, compaction/resume protocol (handoff file at ≥ 70% context; run-ledger resume), what-each-agent-never-sees table, single source of truth. **L5:** budgets enforced by a validator script. Not wired into CI (noted). **I:** all. |
| C14 | Right-sizing and brownfield | 4 | 1.0 | 4.00 | M | I | references/paths.md §1–5 (scored S/R rubric, risk overrides size, 6 scored examples, escalation triggers + procedure, adopt mode); spec-lint H01–H07 (score line, never routed down); project-context Step 2 adopt (inventory, baseline, conventions, code map, instruction ledger); tdd.md brownfield CHAR tests; quickstart (worked Quick item) | **L3:** three paths with criteria; brownfield adopt procedure. **L4:** separate size and risk axes with Full-forcing triggers; escalation with file/risk/component triggers; code map, characterization tests, regression selection via code map. **L5 partly met:** routing by a defined scored rubric (I); worked Quick case in the quickstart; scored examples. **First unmet (L5):** no adoption guide for teams with an existing process. `references/adoption.md`† is only named; adopt mode covers codebase entry and existing instruction files, not team process rollout. `examples/paths/`† is named only. **Plan-only:** path-score†, adoption†, brownfield†. |
| C15 | Portability and extensibility | 4 | 1.0 | 4.00 | L | I | references/platforms.md §1 probe, §2 per-platform install + dispatch/tool/permission mapping for 8 platforms, §3 degradation, §4 Markdown-only path; artifacts.md (`config.json` "never touched by upgrades"); project-context refresh (replaces only between markers; instruction ledger); CONTRIBUTING.md, docs/guides/skill-anatomy.md, quality-standards.md; skill-creator; .github/workflows/validate.yml (validate-skill-yaml/content on every skill) | **L3:** 8 platforms, plain Markdown, Node optional (Markdown-only path). Extension: authoring new skills via skill-creator and the repository guides; project customization via the AGENTS.md block / `sdlc-dod` / `config.json`. Conf L: the method itself states "No extensions are loaded until [ext-check†] exists", so method-level extension is absent. **L4:** per-platform tool and permission mappings; project-local customization layer survives upgrades; contribution guide with authoring standards. **First unmet (L5):** no versioned extension interface (`extension-interface.md`†, `ext-check.mjs`† named only, fail concreteness). CI validates skill frontmatter/content but does not run the agentic-sdlc script tests. retrospective.md cites a "reference override / skill override" that is defined nowhere. |
| C16 | Learning loop and outcomes | 4 | 1.0 | 4.00 | M | I | references/retrospective.md (when due; procedure; Facts each cycle; Action rule with five fields, closed by commit `Refs: RA-…`; Recurrence 16.2 → automated control; open > 2 cycles → Tech Lead); router Step 0 states 8–9; templates/retro.md; worked-example retro | **L3:** retro in the default cycle (Standard within 5 business days) with owned actions that change a target file. **L4:** recurrence → automated control with independent approver; prior actions reviewed each retro; facts (lead time, rounds, findings, reverts, indicator, incidents) collected each cycle. **First unmet (L5):** metrics are not computed by tooling and there is no metric-threshold decision rule or trend. `metrics.mjs`† is named only (fallback: compute by hand) and fails concreteness. |

## Concreteness test (design-only)

Elements: A = artifact/location, T = trigger, R = rule, O = output/record, F = failure behaviour.

| Mechanism (†) | Criterion | Artifact | Trigger | Rule | Output | Failure | Counts? |
|---|---|---|---|---|---|---|---|
| `scripts/trace-check.mjs` | C9 L5 | yes (script; `specs/NNN/trace.md`) | yes (before GO; before PR approval request) | yes (verification.md §5 steps 1–5, forward/backward rules) | yes (matrix + Orphans) | yes (exit 1 listing orphans → NO-GO) | **yes** (5/5) |
| `approval-check` CI check + branch protection / CODEOWNERS / environment reviewers | C10 L5 | yes (governance.md §7; `templates/ci/*.yml`†, `CODEOWNERS`†) | yes (every PR touching `specs/**` or code under a spec) | yes (rev + 12-hex hash match; approver ≠ author; ≥ 1 approving review; stale reviews dismissed) | partial (check status; "Blocks" column) | yes (merge blocked; no host control → `enforcement: prompt-only` banner + doctor† WARN) | **yes** (4.5/5) |
| `scripts/audit-export.mjs` | C10 L5 | yes | no | no (purpose only) | partial | no | no, but the I manual fallback (zip `specs/NNN-slug/` + PR body + release notes) is used |
| `references/standards-mapping.md`, `ssdf-mapping.md` | C10/C11 L5 | yes | no | no | no | no | no (named only) |
| `scripts/doctor.mjs` | C1 L5 | yes (`doctor.json`) | no (no defined run point) | partial (block, sdlc-dod, code-map date, host controls) | yes | yes (WARN) | borderline 3.5/5; C1 L5 fails anyway on upgrade notes |
| `references/upgrading.md`, `faq.md` | C1 L5 | yes | no | no | no | no | no |
| `scripts/dod-gate.mjs` + CI `agentic-sdlc/dod` | C3/C4 L5 | yes | partial (required check) | yes (every `sdlc-dod` command; non-zero → fail) | partial | yes (merge blocked) | yes, but not needed (L5 met by I) |
| `scripts/evidence.mjs record/check` | C4 L5 | yes (`.agentic-sdlc/evidence/ledger.jsonl`) | yes (verification.md §4 check points) | yes | yes | yes (check exit 1 → NO-GO) | yes, but not needed (L5 met by I) |
| `ci/security.yml` | C11 L5 | yes | no | no | no | no | no |
| `references/adoption.md`, `brownfield.md`, `examples/paths/` | C14 L5 | yes | no | no | no | no | no |
| `scripts/path-score.mjs` | C14 | yes | yes (Plan) | yes (same rubric) | partial | no | not needed (text rubric is I) |
| `references/extension-interface.md`, `scripts/ext-check.mjs` | C15 L5 | yes | no | no | no | no ("no extensions are loaded until it exists") | no |
| `scripts/metrics.mjs` | C16 L5 | yes | no | no (no threshold rule) | partial ("history") | no | no |
| `templates/runbook.md`, `postmortem.md`, `ops-record.md`, `threat-model.md` | C11/C12 | yes | yes | sections defined in I references | yes | yes | not needed (I procedures with manual fallbacks carry the levels) |
| `evals/evals.json` + `trigger-eval.json` (present, not run) | C3/C14 L5 | yes | no runner | expected outputs only, no pass threshold | no recorded results | no | no (methodology §8.1: measurement not fully specified) |
| Plan Phase C/D new skills (`deployment-pipeline`, `operations-and-incidents`, `security-hardening`, `multi-axis-code-review`, `retrospective`, …) | C10–C12, C16 | yes | no | lists of "M x.y" mechanism names | no | no | no (named mechanisms without behaviour) |

## Weakest criteria

These use anchor-level reasoning only.

1. **C10 Human governance (RA 3.00).**
   - Approvals are excellent as text and script, but enforcement the agent cannot bypass is plan-only: there is no `approval-check`, CI template or CODEOWNERS template.
   - Unresolved vocabulary contradictions remain in the Design-stage skills (CP2/CP3, "AN stage"), against the README's claim that they are gone.
   - Main realization risk: the required CI checks `agentic-sdlc/{dod,trace,approvals}` named in branch protection cannot exist until three scripts are written.
2. **C9 Traceability (RA 3.50).**
   - Full chain and production link exist as text, but the trace is not tool-validated: `trace-check`† is unbuilt and plan-graph checks only AC↔task.
   - Realization risk: parsing commits, test names and Verification rows into one matrix with no benchmark precedent.
3. **C8 Autonomous safety (4).**
   - Authority limits (push, merge, deploy) are self-policed by the agent. Platform deny settings are documented but not required at unattended entry.
4. **C11 Security (4).**
   - Threat-model rule for risk-flagged Standard items contradicts spec-lint (warning only) and the worked example.
   - On the attended default path, scanning and dependency audit are manual pasted rows.
5. **C1, C12, C14, C15, C16 (4 each).** Each misses L5 because the item that would lift it is only named:
   - C1: upgrade notes
   - C12: automated threshold rollback
   - C14: adoption guide
   - C15: versioned extension interface
   - C16: computed metrics with a decision rule

## Realization risks (design-only)

| Mechanism to build | Criterion | Depends on | Benchmark precedent |
|---|---|---|---|
| `trace-check.mjs` + `trace.md` | C9 L5 | commit trailer parsing (exists in plan-graph `--from-git`), test-name scan, PR Verification rows (manual today), `evidence.mjs`† for fresh-row checks | none found in my inventories |
| `approval-check.mjs` + `templates/ci/agentic-sdlc.yml` + `CODEOWNERS` | C10 L5 | host branch protection (GitHub/GitLab/Azure differ), `dod-gate`†, `trace-check`†. That is ≥ 3 unbuilt cross-stage dependencies for the required check set. | none found in my inventories for CI approval-record checks |
| Removal of stale CP2/CP3 / stage-code text | C10 (contradiction) | edits to `senior-solution-architect`, `brainstorming` | n/a |
| Threat-model rule alignment (TM02 warning vs "before Spec approval"; worked example) | C11 | spec-lint change or text change; example update | n/a |
| Environment-level authority enforcement (deny push/merge at unattended entry) | C8 L5 | platform permission features, which differ across the 8 platforms; AdaL has none ("prompt-only") | platform-dependent |
| Final DoD gate at task exit/PR (`dod-gate`) | C3/C4 robustness | `sdlc-dod` parsing (exists in preflight) | addyosmani quality-gate script (AO inventory "quality-gate.mjs") |
| Self-reported ledger inputs | C6/C8 | the agent must call `run-ledger round`/`check`; skipping calls is undetected outside `finish`/`status` | n/a |
| CI does not run `skills/agentic-sdlc/scripts/test/*` | C2–C8, C13 | validate.yml change | n/a |

Smaller inconsistencies observed:
- A 16–20-file change exceeds the Standard file bound (> 15) yet re-scores to Standard (S = 5–6). The escalation procedure does not say what happens when the re-score equals the current path.
- Incidents say "the on-call engineer executes every state-changing action", while a rollout breach has the Release Engineer run the rollback immediately.

## Claims not scored

| Claim | Source | Reason |
|---|---|---|
| Evals show trigger accuracy and pressure resistance | evals/evals.json, evals/trigger-eval.json | Specified but not run; no runner, results or pass threshold (§8.1) |
| `status.mjs`, `doctor.mjs`, `path-score.mjs`, `evidence.mjs`, `dod-gate.mjs`, `audit-export.mjs`, `loop-ledger.mjs`, `ext-check.mjs`, `metrics.mjs` | artifacts.md §Later-release files | Roadmap/unreleased; credited only where the concreteness test passed and the level needed them (trace-check, approval-check) |
| 15 new + 6 upgraded skills meeting a depth standard | execution plan §5 Phases B–E, success criteria | Vague intention / named mechanisms without behaviour |
| "Humans approve, agents execute … enforced by branch protection, CODEOWNERS and environment reviewers" | execution plan §1.2 item 3; governance.md §7 | Credited at r ≤ 0.7 in C10 only; not enforced in this repository today |
| Mechanism IDs and precedents | README `## Influences` → architect report | Points to an off-limits file; not read |
| `security-hardening` skill invoked from Design | senior-solution-architect/SKILL.md | Skill does not exist; recorded as a contradiction |
| Reference/skill override mechanism | retrospective.md Action rule | Undefined anywhere; not credited in C15 |
| Long-form guide `docs/guides/agentic-sdlc.md`† | artifacts.md | Unreleased |

## Search log

| Criterion | Paths / probe terms | Hits used | Hits rejected (reason) |
|---|---|---|---|
| C1 | install, quickstart, Step 0, status, doctor, faq, upgrad, What's New, budget | router Step 0; quickstart; budget-check run | doctor†/faq†/upgrading† (named only); README What's New (change list, not migration notes) |
| C2 | spec, AC-, Given, vague, critique, REV, approval, hash, change protocol | spec template; spec-lint; rules.md; governance §4 | — |
| C3 | red, refactor, mock, anti-pattern, rationaliz, ADR, interface, sdlc-dod, coverage, baseline | tdd.md; plan template; executing-plans; preflight; run-ledger | evals.json (unrun); dod-gate† (not needed) |
| C4 | fingerprint, stale, CANNOT_VERIFY, evidence, Verification | verification.md; git.mjs; pr-body template; worked example | evidence.mjs† (not needed) |
| C5 | lens, dedup, triage, NO-GO, receive, re-review, review guide | review.md; reviewer.md; pr-body; worked-example F-rows | — |
| C6 | loop, bound, breaker, tried, signature, cause, anti-thrash | loops.md; run-ledger constants/evaluateRound; tests | — |
| C7 | graph, frontier, wave, conflict, worktree, integrate, codemap, Impact | plan-graph; executing-plans Step 3; codemap template | — |
| C8 | unattended, preflight, worktree, halt, authority, budget, resume, result.json, deny, permission | autonomous.md; run-ledger; preflight; tests (resume); platforms.md §2 | platform deny table (mapping, not required at entry) |
| C9 | AC-, Refs:, trace, orphan, from-production, release notes | verification.md §5; plan-graph; release-ops §12.5 | plan-graph alone (one segment only) |
| C10 | approval, owner, hash, waiver, branch protection, CODEOWNERS, approval-check, audit, CP2, CP3, AN stage | governance.md; spec-lint AP/WV; paths §3; approvals.md; plan §1.2; stage skills | standards-mapping† (named only) |
| C11 | security, threat, STRIDE, OWASP, secret, gitleaks, audit, typosquat, injection, as data, SHA256SUMS, SSDF | security.md; security-auditor.md; spec-lint TM; agents tool lists; project-context Step 6; run-ledger check | ci/security.yml†, ssdf-mapping† (named only); unattended secret scan (opt-in) |
| C12 | release, rollout, rollback, alert, threshold, runbook, incident, postmortem, intake | release-ops.md; spec-lint RB/OBS; release-notes template | deployment-pipeline (plan list only) |
| C13 | budget, Module Index, handoff, compaction, context hygiene, single source | budget-check (run); phase-boundaries.md; artifacts.md | — |
| C14 | path, score, risk trigger, escalate, adopt, codemap, CHAR, adoption | paths.md; spec-lint H; project-context Step 2; tdd brownfield | adoption†, examples/paths† (named only) |
| C15 | platform, mapping, degrad, override, extension, config.json, CONTRIBUTING, validate | platforms.md; artifacts.md; project-context; validate.yml; repo guides | extension-interface†, ext-check† (named only); "skill override" (undefined) |
| C16 | retro, action, recurrence, cause tag, metric, lead time | retrospective.md; retro template; worked-example retro | metrics.mjs† (named only) |

## Files read

| Path | Words | Read (full / partial) |
|---|---|---|
| skills/agentic-sdlc/SKILL.md | 2231 | full |
| skills/agentic-sdlc/README.md | 880 | full |
| skills/agentic-sdlc/references/agents.md | 693 | full |
| skills/agentic-sdlc/references/artifacts.md | 1963 | full |
| skills/agentic-sdlc/references/autonomous.md | 1367 | full |
| skills/agentic-sdlc/references/governance.md | 2036 | full |
| skills/agentic-sdlc/references/lifecycle.md | 1722 | full |
| skills/agentic-sdlc/references/loops.md | 1438 | full |
| skills/agentic-sdlc/references/paths.md | 1813 | full |
| skills/agentic-sdlc/references/phase-boundaries.md | 1089 | full |
| skills/agentic-sdlc/references/platforms.md | 1346 | full |
| skills/agentic-sdlc/references/quickstart.md | 1064 | full |
| skills/agentic-sdlc/references/release-ops.md | 1628 | full |
| skills/agentic-sdlc/references/retrospective.md | 1011 | full |
| skills/agentic-sdlc/references/review.md | 1715 | full |
| skills/agentic-sdlc/references/rules.md | 1359 | full |
| skills/agentic-sdlc/references/security.md | 1716 | full |
| skills/agentic-sdlc/references/tdd.md | 1619 | full |
| skills/agentic-sdlc/references/verification.md | 1986 | full |
| skills/agentic-sdlc/agents/*.md (8 files) | 3620 | full |
| skills/agentic-sdlc/templates/spec.md, plan.md, acceptance-tests.md | 2909 | full |
| skills/agentic-sdlc/templates/pr-body.md, release-notes.md, retro.md, codemap.md | 2827 | full |
| skills/agentic-sdlc/scripts/spec-lint.mjs | 3563 | full |
| skills/agentic-sdlc/scripts/plan-graph.mjs | 2820 | full |
| skills/agentic-sdlc/scripts/preflight.mjs | 1488 | full |
| skills/agentic-sdlc/scripts/budget-check.mjs | 644 | full |
| skills/agentic-sdlc/scripts/run-ledger.mjs | 6433 | partial (constants l.17–60, l.270–320, l.330–900: evaluation, check, resume, finish) |
| skills/agentic-sdlc/scripts/lib/git.mjs | 732 | partial (`fingerprint()`) |
| skills/agentic-sdlc/scripts/test/*.test.mjs | — | run (123/123 pass); run-ledger resume tests read |
| skills/agentic-sdlc/evals/evals.json, trigger-eval.json | 1140 | partial (scenarios and expected outputs) |
| skills/agentic-sdlc/examples/worked-example/README.md | 393 | full |
| skills/agentic-sdlc/examples/worked-example/specs/001-csv-export/spec.md | 976 | full |
| skills/agentic-sdlc/examples/worked-example/specs/001-csv-export/plan.md | 1777 | full |
| skills/agentic-sdlc/examples/worked-example/specs/001-csv-export/approvals.md | 330 | full |
| skills/agentic-sdlc/examples/worked-example/specs/001-csv-export/pr-body.md | 1610 | partial (Verification, Trace, Review triage) |
| skills/executing-plans/SKILL.md | 2491 | partial (Step 0 – Critical Rules) |
| skills/project-context/SKILL.md | 3426 | partial (modes, Step 2 adopt, Step 6 vendor, grep) |
| skills/senior-solution-architect/SKILL.md | 1035 | partial (l.90–122) |
| skills/brainstorming/SKILL.md | 1629 | partial (hand-off, grep) |
| skills/{grill-me,spec-driven-development,writing-plans}/SKILL.md | — | grep only (vocabulary, integration) |
| docs/plans/2026-11-20-agentic-sdlc-execution-plan.md | 5758 | partial (§1.1–1.6, §2.4–5 Phases 0–G; skipped §1.7, Phase H, D11, gate banner) |
| docs/research/methods/2026-11-20-structure-proposal.md | 2093 | partial (headings only) |
| .github/workflows/validate.yml | 244 | full |
| docs/research/scoring/methodology.md, evaluator-agent.md, FREEZE.md | — | full (procedure) |
| docs/research/scoring/scores/S-A/{superpowers,bmad,addyosmani,mattpocock}.md | — | partial (JSON blocks, format) |
| docs/research/inventory/*.md | 95306 | grep only (precedent probes) |

## Machine-readable

```json
{"method":"agentic-sdlc","version":"6add0c5bd7c6709eeca330a474ef3bb77dac9677","status":"design-only (partially implemented)","scorer":"S-A",
 "methodology_sha256":"a6e3953725b67db0189e188c1495ee9b54975e48f65c28baaa01f459b69cf9a4",
 "scores":{
  "C1":{"s":4,"r":1.0,"ra":4.0,"conf":"M","ev":"I","first_unmet":"No versioned upgrade or migration notes; doctor and upgrading.md are later-release names only","cites":["skills/agentic-sdlc/SKILL.md#step-0--detect-state","skills/agentic-sdlc/references/quickstart.md","skills/agentic-sdlc/scripts/budget-check.mjs"]},
  "C2":{"s":5,"r":1.0,"ra":5.0,"conf":"M","ev":"I","first_unmet":"none","cites":["skills/agentic-sdlc/templates/spec.md","skills/agentic-sdlc/scripts/spec-lint.mjs","skills/agentic-sdlc/references/governance.md#4-revision-hash-and-re-open-rule-23"]},
  "C3":{"s":5,"r":1.0,"ra":5.0,"conf":"L","ev":"I","first_unmet":"none (task-exit DoD gate is manual; preflight baseline-dod is the script gate)","cites":["skills/agentic-sdlc/references/tdd.md","skills/agentic-sdlc/scripts/preflight.mjs","skills/agentic-sdlc/scripts/run-ledger.mjs","skills/executing-plans/SKILL.md#step-2--run-one-task-per-task-both-dispatch-modes"]},
  "C4":{"s":5,"r":1.0,"ra":5.0,"conf":"L","ev":"I","first_unmet":"none (fingerprint-bound rows are written by hand; machine check is later-release)","cites":["skills/agentic-sdlc/references/verification.md#4-evidence-records-and-staleness","skills/agentic-sdlc/scripts/lib/git.mjs","skills/agentic-sdlc/templates/pr-body.md"]},
  "C5":{"s":5,"r":1.0,"ra":5.0,"conf":"M","ev":"I","first_unmet":"none","cites":["skills/agentic-sdlc/references/review.md","skills/agentic-sdlc/agents/reviewer.md","skills/agentic-sdlc/templates/pr-body.md"]},
  "C6":{"s":5,"r":1.0,"ra":5.0,"conf":"M","ev":"I","first_unmet":"none","cites":["skills/agentic-sdlc/references/loops.md","skills/agentic-sdlc/scripts/run-ledger.mjs"]},
  "C7":{"s":5,"r":1.0,"ra":5.0,"conf":"M","ev":"I","first_unmet":"none","cites":["skills/agentic-sdlc/scripts/plan-graph.mjs","skills/executing-plans/SKILL.md#step-3--dispatch-inline-or-subagent","skills/agentic-sdlc/templates/codemap.md"]},
  "C8":{"s":4,"r":1.0,"ra":4.0,"conf":"M","ev":"I","first_unmet":"Authority limits (push/merge/deploy) not enforced by the environment; agent self-halts","cites":["skills/agentic-sdlc/references/autonomous.md","skills/agentic-sdlc/scripts/run-ledger.mjs","skills/agentic-sdlc/scripts/preflight.mjs"]},
  "C9":{"s":5,"r":0.7,"ra":3.5,"conf":"L","ev":"I+P","first_unmet":"none at design level; tool-validated trace (trace-check) not yet written","cites":["skills/agentic-sdlc/references/verification.md#5-trace--two-way-gap-analysis","skills/agentic-sdlc/scripts/plan-graph.mjs","skills/agentic-sdlc/references/release-ops.md#intake-from-production-125"]},
  "C10":{"s":5,"r":0.6,"ra":3.0,"conf":"L","ev":"I+P","first_unmet":"none at design level; approval-check/CI templates unbuilt and stale CP2/CP3 vocabulary contradiction unresolved","cites":["skills/agentic-sdlc/references/governance.md#7-enforcement-k5","skills/agentic-sdlc/scripts/spec-lint.mjs","skills/senior-solution-architect/SKILL.md#agentic-sdlc--de-design","docs/plans/2026-11-20-agentic-sdlc-execution-plan.md"]},
  "C11":{"s":4,"r":1.0,"ra":4.0,"conf":"L","ev":"I","first_unmet":"No automated security gates on the default attended path and no SSDF mapping with evidence locations","cites":["skills/agentic-sdlc/references/security.md","skills/agentic-sdlc/agents/security-auditor.md","skills/agentic-sdlc/scripts/spec-lint.mjs"]},
  "C12":{"s":4,"r":1.0,"ra":4.0,"conf":"M","ev":"I","first_unmet":"Threshold rollback is a manual/agent rule, not automated verification or rollback","cites":["skills/agentic-sdlc/references/release-ops.md","skills/agentic-sdlc/templates/release-notes.md"]},
  "C13":{"s":5,"r":1.0,"ra":5.0,"conf":"M","ev":"I","first_unmet":"none","cites":["skills/agentic-sdlc/scripts/budget-check.mjs","skills/agentic-sdlc/references/phase-boundaries.md","skills/agentic-sdlc/SKILL.md#module-index"]},
  "C14":{"s":4,"r":1.0,"ra":4.0,"conf":"M","ev":"I","first_unmet":"No adoption guide for teams with an existing process","cites":["skills/agentic-sdlc/references/paths.md","skills/project-context/SKILL.md#step-2--adopt-mode-explore-and-document-before-the-first-change"]},
  "C15":{"s":4,"r":1.0,"ra":4.0,"conf":"L","ev":"I","first_unmet":"No versioned extension interface","cites":["skills/agentic-sdlc/references/platforms.md","CONTRIBUTING.md",".github/workflows/validate.yml"]},
  "C16":{"s":4,"r":1.0,"ra":4.0,"conf":"M","ev":"I","first_unmet":"Metrics not computed by tooling; no metric threshold decision rule or trend","cites":["skills/agentic-sdlc/references/retrospective.md","skills/agentic-sdlc/templates/retro.md"]}
 }}
```
