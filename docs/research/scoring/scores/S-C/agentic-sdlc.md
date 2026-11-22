# Scorecard — agentic-sdlc (claude-superskills)

| Field | Value |
|---|---|
| Method / version | agentic-sdlc (skills/agentic-sdlc + driven stage skills) @ repo HEAD 6add0c5bd7c6709eeca330a474ef3bb77dac9677 |
| Status | design-only (partially implemented: router, references, agents, templates, 5 scripts + libs with tests, worked example, evals exist; † later-release files and scripts exist only in the plan) |
| Scorer ID | S-C |
| Methodology version + sha256 | 1.0 / a6e3953725b67db0189e188c1495ee9b54975e48f65c28baaa01f459b69cf9a4 |
| Date | 2026-11-22 |
| Access | full (repository working tree at pin, clean) |
| Conflict declaration | none. Scorer S-C did not author, plan, promote or receive positioning briefings for agentic-sdlc. The scorer model vendor does not publish agentic-sdlc. |
| Criterion order used | C9 C5 C13 C7 C8 C16 C15 C1 C12 C14 C10 C3 C2 C6 C4 C11 |
| Notes on exposure | While reading `docs/plans/2026-11-20-agentic-sdlc-execution-plan.md` for † mechanism specs (§1.1–1.6, §2–§9), the scorer incidentally saw §2.4, which states a prior-round verdict. §1.7 (positioning) and Phase H were skipped on purpose. No score below uses that line: every level comes from the frozen anchors applied to files read, and r comes from §6 rows. Other scorers' files and benchmark totals were not opened. |
| Mechanism legend | **I** = implemented file read at the pin (scripts run: `node --test` 123/123 pass on Node v22.15.1; spec-lint, plan-graph, preflight, run-ledger and budget-check run on the worked example, all exit 0). **†** = listed in `references/artifacts.md` §Later-release files or the execution plan but absent at the pin; credited only if it passes the concreteness test. |

## Default path trace (scenario R)

1. Team of 3–8, existing production web service with CI and a review rule, medium feature (3–10 tasks, 5–20 files). Entry is the `agentic-sdlc` router (`SKILL.md` Step 0 state table; `status.mjs`† absent, so the state is read by hand).
2. First run in the repo → `project-context` adopt mode: inventory, baseline DoD run, `docs/codemap.md`, the `sdlc-dod` block in AGENTS.md, vendored scripts with SHA256SUMS (`references/paths.md` §5, `skills/project-context/SKILL.md`).
3. Plan stage → path score (`references/paths.md` §1–2): S = 5–6 and R = 1 → **Standard**. S ≥ 7 or R ≥ 2 or a Full-forcing trigger → Full. The score line is written first and is never routed down without a waiver.
4. Specify (`spec-driven-development`): spec.md with AC-n in GWT form, Non-goals, ≤ 3 clarification rounds, a fresh-context 12-item critic, Security notes (Security Auditor when R ≥ 1), then `spec-lint`. **Spec approval**, Product Owner, hash-bound (combined with Plan when ≤ 5 tasks).
5. Design (`writing-plans`; `senior-solution-architect` for ADRs): plan.md with Tn, Interface, Impact from the codemap, Regression scope and Dependencies, then `plan-graph` (waves, file conflicts, AC coverage). **Plan approval**, Tech Lead.
6. Build (`executing-plans`): `preflight` (worktree, tools, approvals bind hashes, baseline DoD green) → `run-ledger` start. Per task: red test recorded, green, commit with a `Refs: AC-n` trailer. Loops are bounded (3/5/3/3) with breakers B1–B6, a `check` at each task boundary (out-of-plan files, dependencies, secrets, approvals, budgets), and a frontier of ≤ 3 parallel tasks in worktrees.
7. Test: the Test Engineer's acceptance tests are designed from the spec at base. Review lens L1, then L2–L4 in parallel, merged and deduplicated, verified then rated. Default verdict NO-GO. The PR body carries Verification rows bound to a fingerprint and a Trace (forward and backward). **PR approval** by one human.
8. Release: checklist, rehearsed rollback, staged rollout with thresholds, release notes listing ACs. **Release approval**, Release Owner.
9. Operate: SRE watches the spec signals. Incidents get a SEV and a postmortem. Production issues come back as `from-production` intake tagged with AC-n.
10. Retro within 5 business days (≤ 15 min): facts from git and the ledger, actions with owner, target file and due date, closed by a `Refs: RA-…` commit. Recurrence → an automated-control action.

## Scores

| ID | Criterion | Score (D) | r | RA | Conf | Ev. type | Evidence | Rationale (requirements met per level; first unmet) |
|---|---|---|---|---|---|---|---|---|
| C1 | Onboarding & first success | 4 | 1.0 | 4.0 | M | I | `references/quickstart.md`; `SKILL.md` Step 0 + "Off the first path"; `README.md` install; first-path budget 3261 words (budget-check PASS) | L3 (I): install in 3 steps, router entry, a quickstart that walks one change end to end, first path ≤ 4k words. L4 (I): Step 0 state table detects where the project is; the quickstart "When something goes wrong" table; an off-first-path rule keeps advanced files out of the first run. **First unmet, L5:** an onboarding self-check or doctor plus an upgrade guide. `doctor`† and `upgrading.md`† have a purpose line only and fail the concreteness test. `preflight` is a Build-time check, not an onboarding diagnostic. |
| C2 | Requirements & spec quality | 5 | 1.0 | 5.0 | M | I | `templates/spec.md`; `skills/spec-driven-development/SKILL.md` (clarify ≤ 3 rounds, 12-item critic, stop rule, change protocol); `scripts/spec-lint.mjs` (AC02/AC03, NG01, V01 vague terms, REV03, AP04) | L3 (I): spec on the default path, GWT or measurable ACs required by lint, Non-goals required, clarification records open questions. L4 (I): fresh-context critic with a 12-item checklist (REV03 checks the critique entry), a stop on material ambiguity, a revision log, and a mid-build change protocol with an impact step. L5 (I): spec-lint deterministically checks AC IDs and form and flags vague terms. A changed spec hash voids the approval (AP04, run-ledger `approval-void` halt). **First unmet:** none. |
| C3 | Code quality practices | 5 | 1.0 | 5.0 | M | I | `references/tdd.md`; `references/rules.md` (rationalization tables); `templates/plan.md` Interface; `scripts/run-ledger.mjs:610` (no red → not done); `scripts/preflight.mjs:161-171` baseline-dod; `references/artifacts.md:145` coverage_min never lowered | L3 (I): red-green per task on the Build path; Interface signatures before code and ADRs; simplicity rule (no abstraction without ≥ 2 call sites). L4 (I): red output observed and recorded, mocks only at process boundaries, a stated failure each acceptance test catches, a tdd.md anti-pattern catalogue, a refactor step, and rationalization counters. L5 (I): scripts gate on quality. `preflight` runs the project's lint, typecheck, test and coverage commands from `sdlc-dod` and fails on red. coverage_min is a ratchet. `run-ledger task done` refuses a task with no recorded red. The pre-PR `dod-gate`† is absent, but the DoD run is a manual pasted step and is not needed for this level. **First unmet:** none. |
| C4 | Verification & evidence | 5 | 1.0 | 5.0 | M | I | `references/verification.md` §1–4 (DoD ≠ AC, evidence after the last change, fingerprint + staleness, CANNOT_VERIFY); `scripts/lib/git.mjs` fingerprint(); `templates/pr-body.md` Verification; `agents/test-engineer.md`; `scripts/run-ledger.mjs` finish → result.json | L3 (I): completion needs command output run after the last change, a DoD separate from the ACs, and failure blocks. L4 (I): the Test Engineer designs the acceptance tests from the spec at base; the Reviewer judges the diff, not the report; explicit CANNOT_VERIFY. L5 (I): PR Verification rows persist evidence bound to a fingerprint (HEAD + diff hash) with a stale → re-run rule. run-ledger refuses `task done` without red and refuses `finish` DONE with tasks not done or open failures. `evidence.mjs`† is not needed. **First unmet:** none. Conf M: the staleness check on PR rows is manual. |
| C5 | Review | 5 | 1.0 | 5.0 | M | I | `references/review.md` §1–6; `agents/reviewer.md`; `templates/pr-body.md` review guide + triage | L3 (I): a review on the default path with a checklist, severity levels, and file:line findings. L4 (I): verify-then-rate (§3), default NO-GO with no bare approval (§4), receive mode that re-runs the command before agreeing, with dispositions (§5), and scoped re-review where a change of > 30% of lines triggers a full review (§6). L5 (I): parallel lenses L1–L4 including a context-free lens; merge/dedup rule (§2: same cause within ±3 lines); a triage log in the PR. **First unmet:** none. |
| C6 | Loop engineering | 5 | 1.0 | 5.0 | M | I | `references/loops.md` (4 loops, B1–B6); `scripts/run-ledger.mjs:17,34,359-369` (LOOP_BOUNDS, breakers, exit 3); worked-example `run-ledger.jsonl` (rounds with `cause`, `tried`) | L3 (I): red-green, build-test, review-fix and debug loops, each with an exit and a bound, plus named escalation targets. L4 (I): routing by `cause` (spec/design/code/env), `tried` state with repeats refused, a scoped re-check, and an anti-thrash breaker (B2 → a design question). L5 (I): the ledger records every round and drives transitions (red-green ×3 → debug), and the script enforces bounds (exit 3). Tested. **First unmet:** none. |
| C7 | Codebase & dependency awareness | 5 | 1.0 | 5.0 | M | I | `scripts/plan-graph.mjs` (DAG, cycles, waves, file-conflict serialization, frontier ≤ 3, graph.json, GRAPH_STALE); `templates/codemap.md`; `templates/plan.md` Impact + Regression scope; `skills/executing-plans/SKILL.md` (worktrees, integrate in ID order, DoD after each merge) | L3 (I): a code map plus a task dependency graph on the default path. L4 (I): the graph decides order and parallelism, file conflicts serialize tasks, and Impact is taken from the codemap. L5 (I): generated machine-readable graph.json with a staleness check, and regression scope (test selection) from the impact analysis. **First unmet:** none. |
| C8 | Autonomous execution | 4 | 1.0 | 4.0 | M | I | `references/autonomous.md` §1–7; `scripts/preflight.mjs`; `scripts/run-ledger.mjs` (10 halt reasons, resume, budgets, result.json DONE/BLOCKED/NEEDS_HUMAN); tests | L3 (I): unattended run with preflight, isolated worktree, a halt list, and a resumable ledger (resume tested). L4 (I): authority limits (no push/merge/deploy), budgets (tasks, rounds, hours, turns, tokens; lowered, never raised), and a machine-readable result with DONE/BLOCKED/NEEDS_HUMAN. **First unmet, L5:** environment enforcement of the authority limits. The `authority` halt is self-reported. The per-platform deny settings in `references/platforms.md` §2 are not wired into the unattended procedure and are not checked by `preflight` (grep found no link). |
| C9 | Traceability | 5 | 0.7 | 3.5 | L | P (L5); I (L3–L4) | `references/verification.md` §5 (Trace; `trace-check.mjs`† spec); `templates/pr-body.md` Trace; `scripts/plan-graph.mjs` UNCOVERED_AC/UNKNOWN_AC; `references/release-ops.md:94-98` (signals, postmortems, `from-production` tagged AC-n) | L3 (I): stable AC-n → Tn → `Refs:` commit trailers → test names. L4 (I): forward and backward Trace in the PR with orphans listed; plan-graph flags uncovered or unknown ACs; release notes list ACs. L5: the production link is I (spec signals tied to AC-n, postmortems and intake tagged with spec ID and AC-n). The automated trace check is **P**: `trace-check.mjs`† passes the concreteness test (artifact: spec/plan/commits/tests; trigger: PR; rule: every AC has ≥ 1 test and commit, and none is orphaned; output: a list; failure: exit 1 listing orphans), but it is unbuilt. r = 0.7: unbuilt deterministic tooling, and no benchmark in this scorer's cards reached C9 L5. Without the † tool, L5's "checked by tooling" rests on a manual table. |
| C10 | Human governance | 5 | 0.7 | 3.5 | L | P (L5); I (L3–L4) | `references/governance.md` §1–7; `scripts/spec-lint.mjs` AP01–AP08; `scripts/preflight.mjs:137-156` approvals check; worked-example `approvals.md`; `references/artifacts.md:97` audit-export fallback | L3 (I): four named approvals with owner roles, recorded with who, when, hash and quote, and an end-turn rule. L4 (I): hash-bound approvals (a change voids them: AP04 / `approval-void`), waivers WV01–05 (owner ≠ requester, expiry ≤ 30 days), accountability roles, and depth scaled by path (Full: separate reviews + 2 PR reviewers). L5: the `preflight` approval gate is I. Merge-time enforcement is **P**: the CI check `agentic-sdlc/spec`, branch protection with required checks, CODEOWNERS and environment reviewers are concretely specified in §7 with a failure behaviour (a `prompt-only` banner), but the CI templates, `approval-check`† and the CODEOWNERS template are unbuilt. The method labels a repo without them "prompt-only". Export: the approvals register lives in git, plus the manual zip fallback for `audit-export`†; there is no standard mapping. r = 0.7: unbuilt CI tooling and no precedent at L5. Conf L: whether a manual zip counts as an "exportable audit trail" is contestable. |
| C11 | Security by default | 4 | 1.0 | 4.0 | L | I | `references/security.md` (Security notes, threat model TM01–03, secret scan, §Dependencies, 20-item checklist → OWASP Top 10:2025 + LLM Top 10); `references/rules.md` rule 7, rule 10; `agents/*.md` tool allow lists; vendored SHA256SUMS; `scripts/run-ledger.mjs:50-57,425-447,736-737` | L3 (I): Security notes required in the spec (SEC01), lens L3 in review, secret rules, and dependency rules. L4 (I): a risk-triggered threat model (Full → TM01 error; R ≥ 2 forces Full), a checklist mapped to OWASP, fetched text treated as data, per-agent tool allow lists, and provenance through vendored checksums plus a typosquat/advisory dependency note. **First unmet, L5:** gates for automated security tooling. Only a 7-pattern regex secret scan halts inside `run-ledger check`. gitleaks, the dependency audit, SAST and SBOM are manual pasted commands. `ci/security.yml`† and the SSDF mapping† are not concrete. Conf L: there is a contradiction. `security.md` lists 5 Security-note items (including a threat-model link), but the template and SEC01 have 4. A risk-flagged Standard spec "writes threat-model.md before Spec approval", yet lint only warns (TM02) and the worked example (money, Standard) was approved without one. |
| C12 | Release & operations | 4 | 1.0 | 4.0 | M | I | `references/release-ops.md` (checklist, rollback RB01 + rehearsal, staged rollout, OBS signals, incidents SEV + postmortem, §Intake); `templates/release-notes.md`; `agents/release-engineer.md`, `agents/sre.md` | L3 (I): release checklist, required rollback plan, and observability before release. L4 (I): rehearsed rollback, staged or flag rollout with thresholds, incidents with SEV and postmortem sections, production feedback into intake (triage ≤ 2 business days), and go/no-go tied to the ACs. **First unmet, L5:** automated threshold-driven rollback. Thresholds exist, but the rollback decision is a human or agent call. `ops-record`†, `postmortem`† and `runbook`† templates have fallbacks only. |
| C13 | Context engineering | 5 | 1.0 | 5.0 | M | I | `SKILL.md` router + on-demand references; `references/agents.md` "reads / never sees"; `skills/executing-plans/SKILL.md` fresh briefs; handoff at 70% context; `scripts/budget-check.mjs` (run: PASS); spec-lint BUD01; plan-graph WORD_BOUND; run-ledger resume | L3 (I): progressive disclosure through a router plus references. L4 (I): fresh-context subagents with defined inputs, handoff files, and a context-threshold handoff. L5 (I): word budgets enforced by script, and resume from a ledger without chat history. **First unmet:** none. |
| C14 | Right-sizing & brownfield | 4 | 1.0 | 4.0 | M | I | `references/paths.md` §1–5 (score rubric, scored examples, escalate, adopt mode); `scripts/spec-lint.mjs` H05; `skills/project-context/SKILL.md` Step 2; `templates/codemap.md`; `references/tdd.md` CHAR-n | L3 (I): Quick, Standard and Full with stated criteria, and a brownfield adopt procedure (inventory, baseline, codemap). L4 (I): separate S and R axes with Full-forcing triggers; escalation during Build (run-ledger `path-escalation`); codemap, characterization tests (CHAR-n) and regression scope. L5: the scored rubric with worked routing examples is I. **First unmet, L5:** evidence that the light path preserves the safety invariants. The routing examples show path choice, not preserved invariants. evals.json scenario 4 (Quick) has no pass threshold and was never run. `examples/paths`† is absent. An adoption guide for teams with an existing process is also missing: `adoption.md`† is purpose-only. |
| C15 | Portability & extensibility | 4 | 1.0 | 4.0 | M | I | `references/platforms.md` §1–3 (8 platforms, tool mappings); Markdown-only path (Node optional); `CONTRIBUTING.md`, `docs/guides/quality-standards.md`; AGENTS.md block + `.agentic-sdlc/config.json` survive upgrades; `.github/workflows/validate.yml` | L3 (I): runs on ≥ 3 platforms with plain Markdown. L4 (I): per-platform tool mappings, a documented extension path (new skills plus quality standards), and customization that survives upgrades. **First unmet, L5:** a versioned extension interface validated in CI. Repo CI validates skill YAML and content, but `extension-interface.md`† and `ext-check`† are not concrete ("no extensions are loaded until it exists"). |
| C16 | Learning & improvement | 4 | 1.0 | 4.0 | M | I | `references/retrospective.md`; `templates/retro.md`; worked-example `retro.md` (prior actions, git-sourced facts, recurrence → lint-rule action) | L3 (I): a retro on every path (batched for Quick) producing owned actions with a target file. L4 (I): actions closed by a `Refs: RA-…` commit, prior actions open > 2 cycles go to the Tech Lead, a recurrence rule (2 tags in 90 days → automated control approved by a person ≠ proposer), and facts from git and the ledger each cycle. **First unmet, L5:** metrics computed by tooling with a threshold decision rule and trends. `metrics.mjs`† has a purpose line only. |

Per-criterion mechanism split: C1–C8 and C11–C16 rest only on I mechanisms (each † item named in the rationale is either not needed for the level awarded or is the first unmet requirement). C9 and C10 are the only criteria where the top level depends on a P mechanism.

## Concreteness test (design-only)

| Mechanism | Criterion | Artifact | Trigger | Rule | Output | Failure | Counts? |
|---|---|---|---|---|---|---|---|
| `scripts/trace-check.mjs`† (verification.md §5) | C9 | spec.md ACs, plan Tn, commits (`Refs:`), test names | PR / CI check `agentic-sdlc/trace` | every active AC has ≥ 1 test + commit; no commit or test without a known AC | forward/backward table, orphan list | exit 1 listing orphans | **Yes** (r 0.7) |
| CI check `agentic-sdlc/spec` + branch protection + CODEOWNERS + env reviewers (governance.md §7) | C10 | `specs/**`, approvals, PR | PR touching specs or code under a spec; deploy | spec-lint `--check-approval` green; ≥ 1 approving review; required checks; owner review; Release Owner on `production` env | required check status; protected merge | merge/deploy blocked; when a control is missing → `Enforcement: prompt-only` banner | **Yes** (r 0.7) |
| `approval-check`† (10.4) | C10 | approvals register + PR | PR | approval rows for the current path | check status | fails the PR | Partially specified; credited only through the §7 row above |
| `audit-export.mjs`† | C10 | `specs/NNN-slug/` + PR body + release notes | — (none stated) | — | zip bundle | — | No as a tool; the manual zip fallback is treated as an export procedure (contestable, conf L) |
| SSDF mapping† | C11 | — | — | — | — | — | No (purpose only) |
| `ci/security.yml`† | C11 | — | PR | — | — | — | No (no rule set or failure behaviour) |
| `doctor`† | C1 | repo state | user run | partial (codemap age ≤ 90 days, missing controls → WARN) | WARN/FAIL list | — | No (scattered rules; no single spec) |
| `upgrading.md`† | C1 | — | — | "re-run project-context setup" | — | — | No |
| `metrics.mjs`† | C16 | — | — | — | — | — | No (purpose only) |
| `extension-interface.md`† / `ext-check`† | C15 | — | — | — | — | — | No |
| `path-score.mjs`† | C14 | inputs S/R | Plan | same table as paths.md §2 | route | — | Not needed (the manual rubric is I) |
| `examples/paths`† / `adoption.md`† | C14 | — | — | — | — | — | No |
| `evidence.mjs`† | C4 | — | — | fingerprint rule (already I in lib/git) | — | — | Not needed |
| `dod-gate`† | C3/C4 | sdlc-dod | pre-PR | every DoD command exits 0 | PASS/FAIL | exit 2 when the block is missing | Specified, but not needed (preflight is I) |
| ops-record† / postmortem† / runbook† templates | C12 | — | — | sections listed in release-ops.md | — | — | Content credited from release-ops.md (I); templates add nothing at L5 |

Scope penalty: no criterion credits more P mechanisms than the largest benchmark has there (C9: 1; C10: 1 control set), so no penalty applies.

## Weakest criteria

1. **C9 Traceability (RA 3.5).** Levels 3–4 are fully implemented. L5's tooling check is an unbuilt script (r 0.7), so its high D is discounted to RA 3.5.
2. **C10 Human governance (RA 3.5).** Merge-time enforcement exists only as specified CI and branch-protection settings. The method itself labels repositories without them "prompt-only".
3. **C8 Autonomous execution (RA 4.0).** Authority limits are self-reported halts; there is no sandbox or deny-list wiring.
   Tied at 4.0: C1, C11, C12, C14, C15, C16. Each is missing its L5 tooling element (doctor, security gates, auto-rollback, invariant evidence, extension interface, metrics).

RA expected below strong benchmarks (anchor reasoning only):
- C1: below ai-dlc (5). No doctor or upgrade guide.
- C9/C10: D exceeds the benchmarks, but RA is discounted by r.
- C12: below ai-dlc (5). No automated rollback.
- C15: below ai-dlc, addyosmani and spec-kit (5). No versioned extension interface checked in CI.

## Realization risks (design-only)

- **Must be built for the claimed L5s:**
  - `trace-check.mjs` (C9).
  - CI templates (`ci/*.yml`), `approval-check`, a CODEOWNERS template and repo-setting instructions (C10).
  - `doctor` and `upgrading.md` (C1).
  - `ci/security.yml` and an SSDF mapping (C11).
  - `metrics.mjs` (C16).
  - `extension-interface.md` and `ext-check` (C15).
  - `examples/paths`, `adoption.md` and run evals with thresholds (C14).
- **Dependencies:**
  - The CI controls depend on the host (GitHub) and repo-admin rights; on other hosts the method falls back to "prompt-only".
  - trace-check depends on the `Refs:` trailer discipline being followed in every commit.
  - All scripts need Node ≥ 18. A Markdown-only team loses every deterministic gate (preflight, run-ledger, lint).
- **No precedent:** no benchmark in this scorer's cards reached L5 on C9, C10 or C11. A 15-file deterministic stack (5 scripts, 6.4k-word run-ledger) is ambitious, and maintenance cost is unproven beyond 123 unit tests and one synthetic worked example.
- **Evals:** `evals/evals.json` has 6 scenarios with expectations but no pass threshold and no recorded results. No behavioural evidence shows that agents follow the router.

## Claims not scored

| Claim | Where | Reason |
|---|---|---|
| "CI check `agentic-sdlc/spec` turns red" on a void approval | `skills/spec-driven-development/SKILL.md` | No CI template exists at the pin (†); credited only as P under C10 |
| "the repository's CI runs `plan-graph --check`" | `skills/writing-plans/SKILL.md` | Same: no CI template; the repo's own `validate.yml` does not run it |
| budget-check runs "in CI on skills/**" | `skills/agentic-sdlc/SKILL.md` | `.github/workflows/validate.yml` runs neither budget-check nor `node --test`; budget enforcement is credited only as a runnable script (C13) |
| Risk-flagged Standard always gets a threat model before Spec approval | `references/security.md` | Lint only warns (TM02); the worked example contradicts it; credited only on Full (C11) |
| Five Security-note items | `references/security.md` | Template and SEC01 check four |
| `status`, `doctor`, `path-score`, `evidence`, `dod-gate`, `metrics`, `audit-export`, `ext-check` tools | `references/artifacts.md` §Later-release | Absent at the pin; only manual fallbacks credited |
| Stage skills use the D10 vocabulary consistently | `skills/brainstorming/SKILL.md:78` (`docs/agentic-sdlc/.../BRIEF.md`), `skills/senior-solution-architect/SKILL.md:95-104` ("DE Design", "CP2/CP3") | Stale terms remain; minor, not scored |
| Agents follow the method (trigger accuracy, scenario success) | `evals/evals.json`, `evals/trigger-eval.json` | Never run; no threshold |

## Search log

| Criterion | Paths / probe terms | Hits used | Hits rejected |
|---|---|---|---|
| C1 | quickstart.md, SKILL.md Step 0, "doctor", "upgrading", budget-check first-path | quickstart troubleshooting table; Step 0; budget PASS 3261 words | doctor† (scattered rules), upgrading† (one line) |
| C2 | spec template, spec-lint codes AC0x/NG01/V01/REV03/AP04, "critic", "stop" | all listed | — |
| C3 | tdd.md, rules.md, "coverage", "baseline", run-ledger "no-red" | preflight baseline-dod, coverage_min ratchet, run-ledger:610 | dod-gate† (not needed) |
| C4 | verification.md §1–5, "fingerprint", "CANNOT_VERIFY", "stale" | lib/git fingerprint, PR Verification rows | evidence.mjs† |
| C5 | review.md, reviewer agent, "dedup", "NO-GO", "30%" | §2–6 | — |
| C6 | loops.md, run-ledger LOOP_BOUNDS/B1–B6/exit 3, worked ledger | rounds with cause/tried | — |
| C7 | plan-graph, codemap, "Regression scope", "frontier" | graph.json, GRAPH_STALE, waves | — |
| C8 | autonomous.md, preflight, run-ledger halts, platforms.md §2 "deny" | 10 halts, result.json | platforms deny settings (not linked to the procedure) |
| C9 | verification.md §5 "Trace", "trace-check", "Refs:", release-ops "AC-n" | trace-check† spec, release-ops:94-98 | — |
| C10 | governance.md §1–7, preflight "approv", "audit", "export", "standard" | §7 controls, preflight gate, zip fallback | standard mapping (none) |
| C11 | security.md, "gitleaks", "audit", "SBOM", "SAST", run-ledger "secret", "SSDF" | SECRET_PATTERNS halt, OWASP map, TM01 | ci/security.yml†, ssdf-mapping† |
| C12 | release-ops.md "rollback", "threshold", "SEV", "Intake" | RB01, staged rollout, intake | automatic rollback (none) |
| C13 | SKILL.md router, agents.md, "handoff", "70%", budget-check | all listed | — |
| C14 | paths.md §1–5, "invariant", "adoption", evals scenario 4 | rubric + scored examples, adopt mode, CHAR-n | invariant evidence (none), adoption.md† |
| C15 | platforms.md, CONTRIBUTING.md, validate.yml, "extension" | 8 platforms, CI yaml/content validation | extension-interface† / ext-check† |
| C16 | retrospective.md, retro template, worked retro, "metrics" | recurrence rule, RA closure | metrics.mjs† |

## Files read

| Path (A = skills/agentic-sdlc) | Words | full/partial |
|---|---|---|
| A/SKILL.md | 2231 | full |
| A/README.md | 880 | full |
| A/references/{agents, artifacts, autonomous, governance, lifecycle, loops, paths, phase-boundaries, platforms, quickstart, release-ops, retrospective, review, rules, security, tdd, verification}.md | 25 547 | full (governance §7, paths §1–5, security, review re-read) |
| A/agents/*.md (8 files) | 3620 | full |
| A/templates/*.md (7 files) | 5736 | full |
| A/scripts/{spec-lint, plan-graph, preflight, run-ledger, budget-check}.mjs + lib/{cli, git, md}.mjs | 17 128 | full (run-ledger partly by grep) |
| A/scripts/test/* | — | executed (123/123 pass) |
| A/examples/worked-example/README.md, codemap.md | ~660 | full |
| A/examples/worked-example/specs/001-csv-export/{spec, approvals, plan, pr-body, retro, run-ledger.jsonl, graph.json}.* | ~5 860 | full |
| A/examples/worked-example/specs/001-csv-export/{acceptance-tests, release-notes, README}.md | ~2 820 | partial (grep) |
| A/evals/evals.json, trigger-eval.json | 1140 | full |
| skills/executing-plans/SKILL.md | 2491 | full |
| skills/spec-driven-development/SKILL.md | 3180 | full |
| skills/project-context/SKILL.md | 3426 | partial (Workflow–Critical Rules) |
| skills/writing-plans/SKILL.md | 3241 | partial (Workflow–Critical Rules) |
| skills/brainstorming/SKILL.md, grill-me/SKILL.md, senior-solution-architect/SKILL.md | 4354 | partial (headings + grep) |
| docs/plans/2026-11-20-agentic-sdlc-execution-plan.md | 5758 | partial (§1.1–1.6, §2–§9) |
| .github/workflows/validate.yml; CONTRIBUTING.md | 710 | full |
| docs/research/scoring/methodology.md, evaluator-agent.md, FREEZE.md | — | full (frozen rules) |

## Machine-readable

```json
{"method": "agentic-sdlc", "version": "6add0c5bd7c6709eeca330a474ef3bb77dac9677", "status": "design-only", "scorer": "S-C", "methodology_sha256": "a6e3953725b67db0189e188c1495ee9b54975e48f65c28baaa01f459b69cf9a4", "scores": {
"C1": {"s": 4, "r": 1.0, "ra": 4.0, "conf": "M", "ev": "I", "first_unmet": "L5: onboarding self-check/doctor and upgrade guide (doctor†, upgrading.md† not concrete).", "cites": ["agentic-sdlc@6add0c5:skills/agentic-sdlc/references/quickstart.md", "agentic-sdlc@6add0c5:skills/agentic-sdlc/SKILL.md#step-0", "agentic-sdlc@6add0c5:skills/agentic-sdlc/scripts/budget-check.mjs"]},
"C2": {"s": 5, "r": 1.0, "ra": 5.0, "conf": "M", "ev": "I", "first_unmet": "none", "cites": ["agentic-sdlc@6add0c5:skills/agentic-sdlc/templates/spec.md", "agentic-sdlc@6add0c5:skills/spec-driven-development/SKILL.md", "agentic-sdlc@6add0c5:skills/agentic-sdlc/scripts/spec-lint.mjs"]},
"C3": {"s": 5, "r": 1.0, "ra": 5.0, "conf": "M", "ev": "I", "first_unmet": "none", "cites": ["agentic-sdlc@6add0c5:skills/agentic-sdlc/references/tdd.md", "agentic-sdlc@6add0c5:skills/agentic-sdlc/references/rules.md", "agentic-sdlc@6add0c5:skills/agentic-sdlc/scripts/preflight.mjs:161-171", "agentic-sdlc@6add0c5:skills/agentic-sdlc/scripts/run-ledger.mjs:610"]},
"C4": {"s": 5, "r": 1.0, "ra": 5.0, "conf": "M", "ev": "I", "first_unmet": "none", "cites": ["agentic-sdlc@6add0c5:skills/agentic-sdlc/references/verification.md#1-4", "agentic-sdlc@6add0c5:skills/agentic-sdlc/scripts/lib/git.mjs#fingerprint", "agentic-sdlc@6add0c5:skills/agentic-sdlc/templates/pr-body.md#verification", "agentic-sdlc@6add0c5:skills/agentic-sdlc/agents/test-engineer.md"]},
"C5": {"s": 5, "r": 1.0, "ra": 5.0, "conf": "M", "ev": "I", "first_unmet": "none", "cites": ["agentic-sdlc@6add0c5:skills/agentic-sdlc/references/review.md#2-6", "agentic-sdlc@6add0c5:skills/agentic-sdlc/agents/reviewer.md"]},
"C6": {"s": 5, "r": 1.0, "ra": 5.0, "conf": "M", "ev": "I", "first_unmet": "none", "cites": ["agentic-sdlc@6add0c5:skills/agentic-sdlc/references/loops.md", "agentic-sdlc@6add0c5:skills/agentic-sdlc/scripts/run-ledger.mjs:17-34,359-369", "agentic-sdlc@6add0c5:skills/agentic-sdlc/examples/worked-example/specs/001-csv-export/run-ledger.jsonl"]},
"C7": {"s": 5, "r": 1.0, "ra": 5.0, "conf": "M", "ev": "I", "first_unmet": "none", "cites": ["agentic-sdlc@6add0c5:skills/agentic-sdlc/scripts/plan-graph.mjs", "agentic-sdlc@6add0c5:skills/agentic-sdlc/templates/codemap.md", "agentic-sdlc@6add0c5:skills/agentic-sdlc/templates/plan.md#impact", "agentic-sdlc@6add0c5:skills/executing-plans/SKILL.md"]},
"C8": {"s": 4, "r": 1.0, "ra": 4.0, "conf": "M", "ev": "I", "first_unmet": "L5: environment enforcement of authority limits (deny settings not wired to the unattended procedure or preflight).", "cites": ["agentic-sdlc@6add0c5:skills/agentic-sdlc/references/autonomous.md", "agentic-sdlc@6add0c5:skills/agentic-sdlc/scripts/run-ledger.mjs", "agentic-sdlc@6add0c5:skills/agentic-sdlc/scripts/preflight.mjs", "agentic-sdlc@6add0c5:skills/agentic-sdlc/references/platforms.md#2"]},
"C9": {"s": 5, "r": 0.7, "ra": 3.5, "conf": "L", "ev": "P", "first_unmet": "none at design level; L5 tooling check rests on unbuilt trace-check.mjs† (passes concreteness test).", "cites": ["agentic-sdlc@6add0c5:skills/agentic-sdlc/references/verification.md#5", "agentic-sdlc@6add0c5:skills/agentic-sdlc/templates/pr-body.md#trace", "agentic-sdlc@6add0c5:skills/agentic-sdlc/scripts/plan-graph.mjs (UNCOVERED_AC)", "agentic-sdlc@6add0c5:skills/agentic-sdlc/references/release-ops.md:94-98"]},
"C10": {"s": 5, "r": 0.7, "ra": 3.5, "conf": "L", "ev": "P", "first_unmet": "none at design level; merge-time enforcement (CI check, branch protection, CODEOWNERS, env reviewers) specified in governance §7 but CI templates/approval-check† unbuilt; export via manual zip fallback.", "cites": ["agentic-sdlc@6add0c5:skills/agentic-sdlc/references/governance.md#7", "agentic-sdlc@6add0c5:skills/agentic-sdlc/scripts/preflight.mjs:137-156", "agentic-sdlc@6add0c5:skills/agentic-sdlc/scripts/spec-lint.mjs (AP01-AP08)", "agentic-sdlc@6add0c5:skills/agentic-sdlc/references/artifacts.md:97"]},
"C11": {"s": 4, "r": 1.0, "ra": 4.0, "conf": "L", "ev": "I", "first_unmet": "L5: automated security tooling wired as gates (only a 7-pattern secret regex halts in run-ledger; dep-audit/SAST/SBOM manual) or an SSDF mapping with evidence locations (ssdf-mapping† not concrete).", "cites": ["agentic-sdlc@6add0c5:skills/agentic-sdlc/references/security.md", "agentic-sdlc@6add0c5:skills/agentic-sdlc/references/rules.md (rules 7, 10)", "agentic-sdlc@6add0c5:skills/agentic-sdlc/scripts/run-ledger.mjs:50-57,736-737", "agentic-sdlc@6add0c5:skills/agentic-sdlc/scripts/spec-lint.mjs (SEC01, TM01-TM03)"]},
"C12": {"s": 4, "r": 1.0, "ra": 4.0, "conf": "M", "ev": "I", "first_unmet": "L5: automated threshold-driven rollback.", "cites": ["agentic-sdlc@6add0c5:skills/agentic-sdlc/references/release-ops.md", "agentic-sdlc@6add0c5:skills/agentic-sdlc/templates/release-notes.md", "agentic-sdlc@6add0c5:skills/agentic-sdlc/agents/sre.md"]},
"C13": {"s": 5, "r": 1.0, "ra": 5.0, "conf": "M", "ev": "I", "first_unmet": "none", "cites": ["agentic-sdlc@6add0c5:skills/agentic-sdlc/SKILL.md", "agentic-sdlc@6add0c5:skills/agentic-sdlc/references/agents.md", "agentic-sdlc@6add0c5:skills/agentic-sdlc/scripts/budget-check.mjs", "agentic-sdlc@6add0c5:skills/executing-plans/SKILL.md (fresh briefs, handoff)"]},
"C14": {"s": 4, "r": 1.0, "ra": 4.0, "conf": "M", "ev": "I", "first_unmet": "L5: evidence the light path preserves safety invariants (evals unrun, no threshold; examples/paths† absent) and an adoption guide (adoption.md† not concrete).", "cites": ["agentic-sdlc@6add0c5:skills/agentic-sdlc/references/paths.md#1-5", "agentic-sdlc@6add0c5:skills/project-context/SKILL.md#step-2", "agentic-sdlc@6add0c5:skills/agentic-sdlc/evals/evals.json"]},
"C15": {"s": 4, "r": 1.0, "ra": 4.0, "conf": "M", "ev": "I", "first_unmet": "L5: versioned extension interface validated in CI (extension-interface.md†, ext-check† not concrete).", "cites": ["agentic-sdlc@6add0c5:skills/agentic-sdlc/references/platforms.md", "agentic-sdlc@6add0c5:CONTRIBUTING.md", "agentic-sdlc@6add0c5:.github/workflows/validate.yml"]},
"C16": {"s": 4, "r": 1.0, "ra": 4.0, "conf": "M", "ev": "I", "first_unmet": "L5: metrics computed by tooling with threshold decision rules and trends (metrics.mjs† purpose only).", "cites": ["agentic-sdlc@6add0c5:skills/agentic-sdlc/references/retrospective.md", "agentic-sdlc@6add0c5:skills/agentic-sdlc/templates/retro.md", "agentic-sdlc@6add0c5:skills/agentic-sdlc/examples/worked-example/specs/001-csv-export/retro.md"]}
}}
```
