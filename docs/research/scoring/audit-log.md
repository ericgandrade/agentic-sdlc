# Red-team audit log (methodology §10.3)

| Field | Value |
|---|---|
| Auditor ID | **AUD-1** (scored none of the methods) |
| Date | 2026-11-22 |
| Methodology | `methodology.md`, SHA-256 `a6e3953725b67db0189e188c1495ee9b54975e48f65c28baaa01f459b69cf9a4`. Verified with `shasum -a 256` and it matches FREEZE.md. |
| Inputs read | methodology.md, evaluator-agent.md (auditor-mode appendix, Step 5), FREEZE.md, orchestrator-log.md, aggregate.py, all in-scope scorecards (read-only) |
| Reconciled values | Recomputed with the aggregate.py rule. ≤1 apart: take the lower. ≥2 apart: floor of the median, conf L. conf = the worst of the two. agentic-sdlc r = min of the two scorers' r. |

## Scope

1. Top two methods under baseline, all 16 criteria: **ai-dlc** (S-C, S-B) and **agile-v** (S-D, S-B).
2. Design-only method, all 16 criteria plus an independent r: **agentic-sdlc** (S-A, S-C).
3. Low-confidence cells: addyosmani C5; bmad C1; bmad C15; mattpocock C8; kiro C16; openspec C15; spec-kit C1.
4. Seeded 15% sample:
   - addyosmani C3, C6, C9
   - bmad C8
   - kiro C13, C4, C5
   - mattpocock C1, C2
   - openspec C11, C4, C6
   - spec-kit C14, C3
   - superpowers C12, C6
5. Explicit checks:
   - kiro S-B vs S-D cards (the re-scoring event)
   - C5 consistency across all methods (the spec-kit C5 revision)
   - C2 non-goals reading for kiro and agile-v
   - the agile-v C4 and C8 readings flagged in the orchestrator log

## Pinned commits actually used

The clones are in `~/audit-refs/`, outside the repo. `/tmp` was not used because it is prohibited in this environment. Each was a shallow fetch of the pinned commit. No scripts were run from any clone.

| Repo | Commit checked out |
|---|---|
| awslabs/aidlc-workflows | `1c557ea277817b72ed4e07d076c0f21740748e3a` |
| Agile-V/agile_v_skills | `4bcc9172f7e00fa3f04bd249584d537a7dbe5600` (pin `4bcc917`) |
| github/spec-kit | `a4d571229e164e440f8950cac034607bae7b7518` |
| Fission-AI/OpenSpec | `0c737dc1b543249b38b0f4716816fcf493d894dd` |
| obra/superpowers | `22f0b463e7a5e579904dd6211a520321035526f7` (pin `22f0b46`) |
| mattpocock/skills | `5863806dd4e15c63174bee4e7515a4256792ecfa` (pin `5863806`) |
| addyosmani/agent-skills | `39b723ceebf81474d0557c1fecd01eddab585563` (pin `39b723c`) |
| bmad-code-org/BMAD-METHOD | `e435a22574fe55722841086e5566420178b98df3` (pin `e435a22`) |
| kirodotdev/Kiro | `efac9e3a1e15f48b347d83bf6e8d1488e6808520` |

**Access limits**
- kiro.dev was reachable over HTTP (200). The auditor fetched `/docs/specs/correctness` and `/docs/steering`.
- The closed-product cap applies: Kiro D evidence is capped at 4.
- The scorers' saved Kiro doc snapshots could not be found. Kiro cells were therefore checked against the live pages, which may have changed since the scorers read them.
- Agile V (CC BY-SA 4.0) is cited by path and section only.
- Design evidence for agentic-sdlc:
  - `docs/plans/2026-11-20-agentic-sdlc-execution-plan.md` ("plan")
  - `docs/research/methods/2026-11-20-structure-proposal.md`
  - `skills/agentic-sdlc/*`. The prototypes use the superseded 8-stage vocabulary (CP1–CP5, CHECKPOINTS/TRACEABILITY/VERIFICATION files), which plan §1.5 and D8→D10 delete. Prototype credit is kept only where D10 retains the mechanism.

## Audit table

| # | Method | Criterion | Type (a–g) | Challenge | Evidence | Outcome (upheld/rejected/to adjudicator) | Score change |
|---|---|---|---|---|---|---|---|
| 1 | ai-dlc | C1 | b | The L3 core-reading load (≤8k words: install + quickstart + entry skill) is not met. S-C's 5 ignores the size of the entry skill. | The entry skill `harness/claude/skills/aidlc/SKILL.md` is 8,076 words. The other harness entry skills are 8,065–8,423 words (codex 8,269, copilot 8,423, cursor 8,065, opencode 8,394). Adding the README Quick Start pushes the load above 8k. This counts the entry skill the same way spec-kit (S-B) and agile-v do. | upheld | 3 L → **2 M** |
| 2 | ai-dlc | C2 | a | Is L4 independent critique really on R's path? | `core/` reviewer subagent at inception stages; mandatory clarifying-question file with the "no partial answers" stop rule; recorded Request Changes. S-B and S-C agree. L5 is unmet (no vague-term check, ACs not executable). | rejected | none (4 M) |
| 3 | ai-dlc | C3 | g | Steelman toward 4. | Test-first, Red output recorded and mock guidance are confirmed. There is still no rationalization-counter catalogue (one quality-knowledge note only), so L4 stays unmet as both scorers say. | rejected | none (3 M) |
| 4 | ai-dlc | C4 | a | Is the L5 "persisted proof bound to source" a real tool or an intention? | Engine-written review records bound to fingerprints, with a staleness rule. The swarm finalize/checkpoint referee refuses red units. This is implemented engine code, not prose. | rejected | none (5 M) |
| 5 | ai-dlc | C5 | a | Credit 4 without an explicit security review axis? | Reviewer subagent with severity and a blocking rule. No dedicated security axis, which matches how bmad and superpowers were read at 4. See the C5 consistency check (#93). | rejected | none (4 L) |
| 6 | ai-dlc | C6 | a | Are the loop bounds enforced? | The review budget is engine-enforced (`core/tools/aidlc-log.ts` ≈4150–4175). The loop-back caps are documented, but enforcement was not verified. S-B's 5 is already absorbed by the reconciled 4, so L4 holds. | rejected | none (4 M) |
| 7 | ai-dlc | C7 | d | Is L4 parallel fan-out on R's default path? | `docs/guide/workflow-profiles.md#Construction approvals and execution`: swarm fan-out needs an explicit stage-major + swarm choice, and the default construction is serial. That is opt-in (§3 line 36), so L4 is unmet. L3 holds: E (Unit DAG) is used and K is declared/used (codekb, `code-generation.md` ≈l.96). | upheld | 4 L → **3 M** |
| 8 | ai-dlc | C8 | a | S-B's L5 (hard blocks on push/deploy) is not supported. | `core/hooks` contains no git-push or deploy blocking. The reconciled 4 (S-C) already excludes L5. | rejected | none (4 M) |
| 9 | ai-dlc | C9 | g | Steelman: do release notes carry requirement IDs? | `aidlc-pipeline-deploy-agent.md:51`: release notes are derived from commits. No FR/US ID link past the PR was found (grep for PR/release-note + FR-/US-/requirement ID returned nothing). | rejected | none (3 M) |
| 10 | ai-dlc | C10 | g | Steelman toward 4: are approvals bound to a revision? | Review records carry digests. On R's Feature route the Guard Policy is `off` (approval survives an edit), so L4 is unmet. `strict` is opt-in. | rejected | none (3 M) |
| 11 | ai-dlc | C11 | g | Steelman toward 3. | Security extension and NFR stages exist. A security review in the default construction path with a blocking rule was not found. | rejected | none (2 M) |
| 12 | ai-dlc | C12 | a/d | Is the rollback/observability requirement on R's path? | The deploy-agent pipeline stage includes rollback and monitoring guidance. The conf is already L. No evidence was found for either 2 or 4. | rejected | none (3 L) |
| 13 | ai-dlc | C13 | a | Is L5 "budgets enforced, token use measured" implemented? | Both scorers cite directive byte budgets per harness, checked by tests, and token/cost usage folded into state. These are engine artifacts. | rejected | none (5 M) |
| 14 | ai-dlc | C14 | a | S-C's 4 vs S-B's 3. | Workflow profiles plus brownfield reverse-engineering stage. The reconciled lower value 3 is consistent with the evidence. | rejected | none (3 M) |
| 15 | ai-dlc | C15 | b | Is L3 (no mandatory proprietary runtime) met? | README Quick Start: the native `aidlc` runtime is required, hooks and commands run through it, and the manual path needs Bun. In the `SKILL.md` conductor loop, every step calls `engine orchestrate next`. That is a mandatory method runtime, treated the same as bmad C15 = 2 (uv/Python on every activation, both scorers). Spec-kit is different: its CLI is install-time only. | upheld | 3 L → **2 M** |
| 16 | ai-dlc | C16 | g | Steelman toward 4. | Learnings step → rules/sensors on the default path (L3). Metrics are opt-in StatsD counters only, with no defined outcome metrics per cycle. L4 is unmet. | rejected | none (3 M) |
| 17 | agile-v | C1 | a | Is the core reading load within L3? | Install profiles plus the Golden Journey entry; both scorers have 3. L4 (state-aware next step) was not demonstrated on R's path. | rejected | none (3 M) |
| 18 | agile-v | C2 | a | Non-goals reading. Is explicit out-of-scope present? | `requirement-architect` covers scope only under #Qualification Applicability Questions, which targets regulated intent. No explicit out-of-scope or non-goals field in the default requirement artifact. Kiro is read the same way (#95). | rejected | none (2 L) |
| 19 | agile-v | C3 | g | Steelman toward 4. | No rationalization-counter catalogue on the build path was located. | rejected | none (3 M) |
| 20 | agile-v | C4 | a | Flagged reading: is L5 machine-checked or only normative prose? | `agile-v-core#Runtime contracts` (≈l.127) declares the `docs/agile-v-runtime` contracts normative. `red-team-verifier#AI-BOM Verification Checklist` fails at L2 when revalidation is skipped. `build-agent` artifact identity carries hashes. The first alternative of the L5 anchor is met on the default path. The "5 vs 4" machine-checked tension is noted, but it does not reach the upheld threshold. | rejected | none (5 L) |
| 21 | agile-v | C5 | a | Is the review independent, with severity and blocking? | `red-team-verifier` runs as a separate role with fail outcomes that block. Both scorers have 4. | rejected | none (4 M) |
| 22 | agile-v | C6 | a | Are the loop bounds and escalation real? | Both scorers have 4. The cited loop bounds and escalation are present in the core skill sections. | rejected | none (4 M) |
| 23 | agile-v | C7 | d | Is parallel wave dispatch on R's path? | Pipeline waves live in a companion skill that the `existing-repo` install profile does not include, so S-D/S-B's 3 (not 4) is correct. | rejected | none (3 M) |
| 24 | agile-v | C8 | a | Flagged reading: human-gated by design. Should it be lower or higher? | Gates are human-held. There is no autonomous multi-step run with safeguards beyond L2. Both scorers have 2. | rejected | none (2 L) |
| 25 | agile-v | C9 | d | S-B's 4 relies on the release link. | GOLDEN_JOURNEY step 11 hands the release to `release-manager`. INSTALL_PROFILES lists `release-manager` (and `observability-planner`) only in the `regulated` profile, not in `existing-repo` (R). So the release segment is opt-in, and 3 is correct. | rejected | none (3 M) |
| 26 | agile-v | C10 | g | Steelman toward 5. | Approvals are recorded and bound to artifacts. No platform enforcement on R's path. Stays at 4. | rejected | none (4 M) |
| 27 | agile-v | C11 | a | S-D's 4 vs S-B's 3. | Security content is concentrated in regulated-profile skills. The reconciled 3 is supported. | rejected | none (3 M) |
| 28 | agile-v | C12 | d | S-B's 3 relies on `release-manager` and `observability-planner`. | Both are regulated-profile only (INSTALL_PROFILES). They are not on R's default path, so 2 is correct. | rejected | none (2 L) |
| 29 | agile-v | C13 | g | Steelman toward 5. | No enforced budget or token measurement found. | rejected | none (4 M) |
| 30 | agile-v | C14 | a | Brownfield and sizing on the default path? | The `existing-repo` profile exists, and the diff-evidence / graph-traceability agents are included there. 4 stands. | rejected | none (4 M) |
| 31 | agile-v | C15 | b | Is there a mandatory runtime? | Plain skills/markdown, multi-platform install. No method runtime is required, so it is read the same way as spec-kit C15 = 5. | rejected | none (5 M) |
| 32 | agile-v | C16 | g | Steelman toward 3. | No retrospective/learning step on the `existing-repo` default path. | rejected | none (2 M) |
| 33 | agentic-sdlc | C1 | e/d | Is the L3 core-reading load assured? Plan Phase F line 298 calls the guide "one-page" but also "readable in under an hour", and ≤8k core words is not specified. The quickstart is only a completion criterion (l.319). | Plan l.298, l.319. The concreteness test is borderline: the size target is internally inconsistent, but a quickstart is committed. | to adjudicator | proposed 3 → 2 (r unaffected) |
| 34 | agentic-sdlc | C2 | f | r 0.9 is optimistic. | The doubt pass is prototyped in the superseded vocabulary. Change control (Revision N+1, re-approval) was prototyped through the CHECKPOINTS.md that §1.5 deletes, so the L4 change-control mechanism has to be re-integrated into `spec.md ## Approvals`. That is a new integration, so r = 0.8 (§8.3). | upheld | r 0.9 → **0.8** (s 4) |
| 35 | agentic-sdlc | C2 | e | Is change control a vague intention? | Plan §1.2 approval records and §1.6 Rule 1 stop rule. The change protocol with impact analysis is described with behaviour (affected AC, tasks, tests, ADRs, rollback, indicators). It passes the concreteness test. | rejected | none |
| 36 | agentic-sdlc | C3 | e/f | Is L4 credited from named items? | §1.6 Rule 4 (red→green→refactor, regression-first), Implementer "never weakens tests", plus the precedents superpowers TDD and addyosmani. r 0.8 already reflects the new integration. | rejected | none (4, r 0.8) |
| 37 | agentic-sdlc | C4 | e/f | Is L4 concrete? | §1.6 Rule 2 (fresh output in the same turn), Reviewer in a fresh context, `CANNOT_VERIFY` status (§1.3), PR Verification table AC-n→test→evidence. L5 (tool-written proof) is not claimed. | rejected | none (4, r 0.8) |
| 38 | agentic-sdlc | C5 | a/f | Is L3 met? | Test-stage independent Reviewer with the Security Auditor on the default path, a shared severity scale, and Critical blocks PR approval (§1.3). Precedents: superpowers and addyosmani reviewers. r 0.8 is fair. | rejected | none (3, r 0.8) |
| 39 | agentic-sdlc | C6 | f | r 0.9 is optimistic. | The C.3 debugging loop (3 failed fixes → escalate) names no target (S-C also calls this borderline). The progress ledger and `re-review.md` are named without behaviour. The spec is complete for only part of L3/L4, so r = 0.8. The fix loop (§1.6 Rule 9) is concrete. | upheld | r 0.9 → **0.8** (s 3) |
| 40 | agentic-sdlc | C7 | g | Steelman benchmarks: agentic-sdlc does not lead here. | `tasks.md` with dependencies is Full-path only. ai-dlc (3 after #7) and agile-v (3) are both ahead. No change for the design. | rejected | none (2, r 0.9) |
| 41 | agentic-sdlc | C8 | a | Is resume/autonomy credited? | Both scorers credit 2 and reject resume. That is consistent with mattpocock's 2 after #47. | rejected | none (2, r 0.8) |
| 42 | agentic-sdlc | C9 | g | Steelman: agentic-sdlc leads with 4 (ai-dlc 3, agile-v 3). Is there missed benchmark evidence for 4? | ai-dlc release notes come from commits (#9). Agile-v's release link is regulated-profile only (#25). The bmad grep for release notes carrying story/AC IDs found only deep-recon commit/PR history citations. No benchmark reaches 4 on R's path. | rejected | none |
| 43 | agentic-sdlc | C9 | e/f | Is the L4 release segment vague? | §1.6 Rule 8 and D.6 release notes carry AC-n. Four or more unbuilt cross-stage dependencies are already reflected in r 0.7. | rejected | none (4, r 0.7) |
| 44 | agentic-sdlc | C10 | e/f | Is L4 enforcement concrete? | §1.2 record fields, end-turn rule and explicit "yes", branch protection and environment approvals (D.5). Re-approval was prototyped in CHECKPOINTS.md (deleted). r 0.8 already covers the re-integration. | rejected | none (4, r 0.8) |
| 45 | agentic-sdlc | C11 | g/f | Steelman the design toward 3, and check the r. | Security notes in spec.md and the Security Auditor in Specify and Test are on the default path, but the auditor could not find the L3 blocking/threat-model specifics concretely specified. Both scorers have 2 L. r 0.9 (precedent: addyosmani security-auditor) is acceptable. | rejected | none (2, r 0.9) |
| 46 | agentic-sdlc | C12 | a/e | Is L3 "observability requirements (logs, metrics, alerts) defined before release" met? The spec "indicator" is a goal metric. D.7 alerts and SLOs are in Operate, after release. The runbook and release plan are Full-only (§1.4). | Plan §1.1 Specify/Release/Operate rows, §1.4 Full row, D.5, D.7. S-C itself calls observability "borderline". Rollback (Rule 6) and flags/staged rollout (§1.1 Release) are concrete. | to adjudicator | proposed 3 → 2 |
| 47 | agentic-sdlc | C12 | f | Is r 0.7 optimistic, given the §1.1 vs §1.4 contradiction? | The contradiction touches the runbook and release plan (L5 items), not the L3 elements. Precedent: addyosmani shipping-and-launch, with −0.1 scope load. The auditor's independent r is 0.7. | rejected | none (r 0.7) |
| 48 | agentic-sdlc | C13 | f | r 0.9 is optimistic. | L4 compaction/resume is "named only" (B.1/C.2 resume), and the scorers themselves reject resume in C8, which is inconsistent. Agent files and ledger are unbuilt. Only the L5 size validator exists. That is a partial spec, so r = 0.8. | upheld | r 0.9 → **0.8** (s 5) |
| 49 | agentic-sdlc | C13 | e | Is L4 credited with a vague resume? | The other L4 items (size budget, role-scoped reads, file hand-offs, single source) are concrete. The phase-boundaries prototype covers resume in part, so s holds. | rejected | none (5) |
| 50 | agentic-sdlc | C14 | f | r 0.9? | Three paths with signals (§1.4) and C.4 brownfield modernization. Precedents: spec-kit/kiro/bmad paths and bmad brownfield. Acceptable. | rejected | none (3, r 0.9) |
| 51 | agentic-sdlc | C15 | b/f | No mandatory runtime? | §1.7 "no engine", the inline fallback for platforms without subagents (§1.3), and the existing 8-platform installer. Same reading as #15 and #31. | rejected | none (4, r 0.9) |
| 52 | agentic-sdlc | C16 | f | r 0.9 is optimistic. §1.1 puts the retrospective in Operate (default cycle) but §1.4 requires it only on Full: an unresolved contradiction. | 0.6 was considered and rejected: the contradiction decides between levels 2 and 3, and does not affect whether level 2 is realized. D.8 is a named-item list and the spec is only partial, so r = 0.8. Precedents: bmad retrospective, mattpocock retro. | upheld | r 0.9 → **0.8** (s 2) |
| 53 | agentic-sdlc | — | (scope) | Scope-load penalty applied consistently? | The scorers apply −0.1 for release/ops (C12) and the trace chain (C9). The 20-skill bundle (plan l.297) is not penalized per cell beyond that. Consistent with §8.3. | rejected | none |
| 54 | addyosmani | C5 | a/d | Is `/ship` the pre-merge review on R's path? | `.claude/commands/ship.md` runs the code-reviewer (5 axes incl. security), security-auditor and test-engineer in parallel, merges with dedup, issues GO/NO-GO, and marks blockers as must-fix before ship. It runs on staged changes or recent commits. If accepted, (a) and (b) of L4 are met → 4. If not → 2. | to adjudicator | proposed 3 L → 4 or 2 |
| 55 | bmad | C1 | a | S-D's first unmet (no troubleshooting/FAQ) is refuted. | `docs/reference/skills-and-agents.md#Troubleshooting` (l.215) and `docs/customize/customize-bmad.md#Troubleshooting` (l.403). L5: `skills/core-tools/bmad/scripts/setup_check.py`, `setup.py --status` (references/setup.md: setup/status/update/repair/doctor), `references/migrate.md`, `migration-1.toml`/`-2.toml`, CHANGELOG. Core load ≈ 2.8k words (README 1,020 + install 705 + first change 710 + router 412). | upheld | 4 L → **5 M** |
| 56 | bmad | C15 | b | Both scorers 2, conf L. | Every activation needs uv/Python (a mandatory runtime). Consistent with #15 and the openspec change (#61). | rejected | none (2 L) |
| 57 | bmad | C8 | c | Is the 5-iteration review cap credited in C8? | Boundary table §3.1: loop bounds are homed in C6. No run-level budget was found. The reconciled 3 does not rely on the cap. | rejected | none (3 M) |
| 58 | mattpocock | C8 | a | S-A's 1 misses the AFK implement-spec run. | `skills/engineering/implement-spec/SKILL.md`: the whole ticket graph runs with background implementer subagents. Safeguards: per-ticket worktree isolation, base-branch check (step 4), integration branch + draft PR "ready for review" instead of merging to main. AFK routing: ask-matt PHASE-BOUNDARIES Q4. C8 is evaluated as offered, so L2 is met. | upheld | 1 L → **2 L** |
| 59 | mattpocock | C1 | a | Is 2 too low? | No state-aware next step; core load is borderline. Both scorers have 2. | rejected | none (2 M) |
| 60 | mattpocock | C2 | a | Is to-spec's Out of Scope enough for 3? | Out of Scope is present, but the ACs are user stories, not testable criteria. L3 is unmet. | rejected | none (2 M) |
| 61 | openspec | C15 | b | Is L3 (no mandatory runtime) met? | The skills call the `openspec` CLI on the default path (e.g. openspec-propose makes 16 calls: `openspec new change`, `openspec context --json`). Install needs npm (Node ≥22.20) or Homebrew. Same rule as #15 and #56. | upheld | 3 L → **2 M** |
| 62 | openspec | C4 | g | Steelman toward 3. | `verify` is an agent judgement without a fresh-command-output rule. 2 stands. | rejected | none (2 M) |
| 63 | openspec | C6 | g | Steelman toward 3. | No bounded fix loop with exit criteria found. | rejected | none (2 M) |
| 64 | openspec | C11 | g | Steelman toward 2. | No security guidance in the default propose/apply/archive flow. | rejected | none (1 M) |
| 65 | spec-kit | C1 | a | Scores [3,5] → 4 is a median artifact. | `scripts/bash/check-prerequisites.sh` inspects feature-dir state and names the next command (L4 reading). Core load ≈ README 1,441 + quickstart 1,120 + constitution command 1,435 ≈ 4.0k (borderline). If L4 is met, L5 also holds (`specify check`, `docs/upgrade.md`) → 5. Otherwise 3. | to adjudicator | proposed 4 L → 5 or 3 |
| 66 | spec-kit | C3 | g | Steelman toward 3. | No test-first obligation in the default /implement path (tests are optional in the tasks template). 2 H stands. | rejected | none (2 H) |
| 67 | spec-kit | C14 | g | Steelman toward 3. | One flow for all sizes; brownfield guidance is limited. 2 stands. | rejected | none (2 M) |
| 68 | spec-kit | C5 | c | C5 revision event: should converge count as review? | `templates/commands/converge.md` is a completeness/verification check against the spec, which belongs to C4. Counting it in C5 would double-count. The revised 1 is consistent. | rejected | none (1 M) |
| 69 | superpowers | C6 | a | Is 4 supported? | Subagent-driven development review loops with re-review after fixes, plus the systematic-debugging 3-failed-fixes breaker. Both scorers have 4. | rejected | none (4 M) |
| 70 | superpowers | C12 | g | Steelman toward 1. | No deployment mention in any skill (grep). It ends at merge/PR (finishing-a-development-branch). | rejected | none (0 H) |
| 71 | addyosmani | C3 | a | Is 5 supported? | `evals/README.md` reports with/without-plugin results (a measured quality mechanism), plus a rationalization catalogue. Both scorers have 5. | rejected | none (5 M) |
| 72 | addyosmani | C6 | a | S-A's 3 vs S-C's 2. | `doubt-driven-development/SKILL.md:116` marks it opt-in, and the debug breaker is qualitative. The lower 2 is correct. | rejected | none (2 M) |
| 73 | addyosmani | C9 | g | Steelman toward 3. | No stable requirement IDs carried to commit or PR. | rejected | none (2 M) |
| 74 | kiro | C4 | a | Is 2 correct? | Task-level verification is not tied to fresh command evidence. kiro.dev `/docs/specs/correctness` says property-based tests are optional by default. | rejected | none (2 M) |
| 75 | kiro | C5 | g | Steelman toward 3. | No independent reviewer with severity/blocking on the default spec flow (live docs checked). | rejected | none (2 M) |
| 76 | kiro | C13 | a | S-B's 4 vs S-D's 3. | `/docs/steering` gives only a steering-file inclusion/precedence rule. No single-source rule or compaction/resume protocol. 3 is correct. | rejected | none (3 M) |
| 77 | kiro | C16 | g | Steelman toward 3. | Steering can be updated by hand. No learning step in the cycle and no metrics. | rejected | none (2 L) |
| 78 | kiro | C9 | a | Re-scoring check: S-B's 3 vs S-D's 2. | `.kiro/specs/github-issue-automation/tasks.md` carries `_Requirements: x.y_` and "Validates: Requirements" links. The test segment depends on PBTs, which are optional by default (`/docs/specs/correctness`). So 2 is correct, and the cell is not in the audit sample beyond the S-B/S-D comparison. | rejected | none (2 M) |
| 79 | kiro | — | (re-score) | Compare the S-B and S-D cards after the evidence-fix event (orchestrator-log l.10–16). | The cards differ only on C9 (3 vs 2) and C13 (4 vs 3), and on C16 conf (M vs L). Both reconcile to the lower value, which the auditor's own reading supports (#76, #78). No sign that the evidence problem skewed the other cells. | rejected | none |
| 80 | all | C5 | (consistency) | C5 consistency across methods after the spec-kit revision. | ai-dlc, bmad, superpowers and agile-v are 4 (independent reviewer, severity, blocking). mattpocock is 2: L3 fails on severity and the blocking rule. openspec is 2 and spec-kit 1 (verify/converge read as C4). The only open item is addyosmani (#54). | rejected | none |
| 81 | kiro, agile-v | C2 | (consistency) | Non-goals read the same way? | Both lack an explicit out-of-scope field in the default requirement artifact, so both get 2. Spec-kit gets 3 via the template's assumptions and clarify's out-of-scope category: weaker, but present. | rejected | none |

## Independent r for agentic-sdlc

The auditor set its r values from the §8.3 rubric before comparing them with the scorers' values.

| Criterion | s | Auditor r | Scorer min r | Outcome |
|---|---|---|---|---|
| C1 | 3 | 0.8 | 0.7 | Scorer value is lower. It is kept, because the scorers apply −0.1 scope load and the rubric allows it. |
| C2 | 4 | 0.8 | 0.9 | upheld (#34) |
| C3 | 4 | 0.8 | 0.8 | agree |
| C4 | 4 | 0.8 | 0.8 | agree |
| C5 | 3 | 0.8 | 0.8 | agree |
| C6 | 3 | 0.8 | 0.9 | upheld (#39) |
| C7 | 2 | 0.9 | 0.9 | agree |
| C8 | 2 | 0.8 | 0.8 | agree |
| C9 | 4 | 0.7 | 0.7 | agree |
| C10 | 4 | 0.8 | 0.8 | agree |
| C11 | 2 | 0.9 | 0.9 | agree |
| C12 | 3 | 0.7 | 0.7 | agree. The score itself goes to the adjudicator (#46). |
| C13 | 5 | 0.8 | 0.9 | upheld (#48) |
| C14 | 3 | 0.9 | 0.9 | agree |
| C15 | 4 | 0.9 | 0.9 | agree |
| C16 | 2 | 0.8 | 0.9 | upheld (#52). 0.6 was considered and rejected. |

## To adjudicator

1. **spec-kit C1** (#65): the reconciled 4 L comes from scores [3,5]. The adjudicator should decide whether `check-prerequisites.sh` meets L4 (state-aware next step). If yes → 5. If no → 3.
2. **addyosmani C5** (#54): the reconciled 3 L comes from [2,4]. The adjudicator should decide whether `/ship` (parallel reviewer, security-auditor, test-engineer; GO/NO-GO; must-fix blockers) counts as the pre-merge review on R's default path. If yes → 4. If no → 2.
3. **agentic-sdlc C1** (#33): the size of the core reading load is internally inconsistent in the plan ("one-page" vs "under an hour"). The adjudicator should decide whether L3 passes the concreteness test. Proposed 3 → 2.
4. **agentic-sdlc C12** (#46): is the spec indicator plus Operate-stage monitoring an "observability requirement defined before release"? Proposed 3 → 2.

## Totals

- 81 rows: 10 upheld, 4 to adjudicator, 67 rejected.
- Upheld score changes:
  - ai-dlc C1, C7, C15
  - bmad C1
  - mattpocock C8
  - openspec C15
- Upheld r-only changes: agentic-sdlc C2, C6, C13, C16.
- Weighted totals and the verdict are computed mechanically afterwards. They are not computed here.
