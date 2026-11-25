# Red-team audit log, round 2: agentic-sdlc (methodology §10.3)

| Field | Value |
|---|---|
| Auditor ID | **AUD-2**. Did not author or score any method. |
| Date | 2026-11-23 |
| Repository SHA | `6add0c5bd7c6709eeca330a474ef3bb77dac9677` |
| Methodology | `methodology.md`, SHA-256 `a6e3953725b67db0189e188c1495ee9b54975e48f65c28baaa01f459b69cf9a4`. Verified with `shasum -a 256`; it matches FREEZE.md. |
| Inputs read | Methodology:<br>• `methodology.md`<br>• `evaluator-agent.md` (Step 5, auditor-mode appendix)<br>• `FREEZE.md`<br>• `aggregate.py`<br>• `audit/adjustments.json`<br>• round-1 `audit-log.md` (format only)<br><br>Cards under audit:<br>• `scores/S-A/agentic-sdlc.md`<br>• `scores/S-C/agentic-sdlc.md`<br><br>Benchmark cards and inventories (for symmetry and scope load).<br><br>Method evidence:<br>• `skills/agentic-sdlc/**` (router, references, templates, agents, scripts + tests, worked example, evals)<br>• stage skills: project-context, brainstorming, grill-me, spec-driven-development, senior-solution-architect, writing-plans, executing-plans<br>• `docs/plans/2026-11-20-agentic-sdlc-execution-plan.md`<br>• `docs/research/methods/2026-11-20-structure-proposal.md` |
| Executed | **Tests:** `node --test "skills/agentic-sdlc/scripts/test/*.test.mjs"` → **123/123 pass** (Node v22.15.1).<br><br>**Scripts on `examples/worked-example`:**<br>• `spec-lint` passes (1 TM02 warning; spec hash `2aef8f23fc84` = approvals.md)<br>• `plan-graph --check` passes (planHash `4da2f0c5aea8` = approvals.md, no GRAPH_STALE)<br>• `budget-check` PASS (first path 3,261 / 3,700 words)<br>• `run-ledger status` → DONE<br>• the fingerprint command in `verification.md` §4 prints a 12-hex fingerprint |
| Reconciliation | aggregate.py rule:<br>• ≤1 apart → the lower score; ≥2 apart → floor of the median<br>• conf = the worse of the two<br>• r = the min of the two<br><br>The two scorers gave the same s on all 16 criteria. |

## Reconciled values under audit

| Criterion | C1 | C2 | C3 | C4 | C5 | C6 | C7 | C8 | C9 | C10 | C11 | C12 | C13 | C14 | C15 | C16 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| s | 4 | 5 | 5 | 5 | 5 | 5 | 5 | 4 | 5 | 5 | 4 | 4 | 5 | 4 | 4 | 4 |
| r (min) | 1.0 | 1.0 | 1.0 | 1.0 | 1.0 | 1.0 | 1.0 | 1.0 | 0.7 | 0.6 | 1.0 | 1.0 | 1.0 | 1.0 | 1.0 | 1.0 |
| conf | M | M | L | L | M | M | M | M | L | L | L | M | M | M | L | M |

The cells marked r = 1.0 rest on implemented text, scripts or tests that the auditor read or ran. Two cells rest on design-only mechanisms (†, passing the §8.1 concreteness test):

- **C9 (r 0.7):** L5 rests on `trace-check`†.
- **C10 (r 0.6):** L5 rests on the `approval-check`† CI, and the floor value reflects contradictions.

## Audit table

| # | Method | Criterion | Type (a–g) | Challenge | Evidence | Outcome | Score change |
|---|---|---|---|---|---|---|---|
| 1 | agentic-sdlc | C1 | a/b | L3 needs a core reading load ≤8k words. Is the 3,261-word claim real, and is L5 met? | **Word count:**<br>• router `SKILL.md` 2,137 words (2,231 by `wc`, counting tables)<br>• `references/quickstart.md` 1,064<br>• README install section ≈60<br>• total ≈3.3k, well under 8k. Counting the whole README (880) still gives ≈4.2k.<br>• `budget-check.mjs` enforces a 3,700 limit and passes.<br><br>**L4:** the Step 0 state table gives the next action for each detected state. A troubleshooting table is present.<br><br>**L5:** no doctor command and no upgrade notes (`status.mjs`† is absent) → unmet. | rejected | none (4 M) |
| 2 | agentic-sdlc | C2 | a | Is L5 (vague-term check, executable ACs, independent critique before approval) on the default path? | **Checks in `spec-lint.mjs`, all covered by tests:**<br>• V01 vague-term list<br>• AC-ID and EARS/GWT form checks<br>• REV03 critique gate<br><br>**On the default path:**<br>• router Step 2 runs lint before Spec approval<br>• preflight runs lint again<br>• a hash change voids the approval (`approvals.md` hash = lint hash `2aef8f23fc84`)<br><br>**Symmetry:** benchmarks (openspec, bmad, ai-dlc) lost L5 on exactly these elements, so a 5 here when they are present is symmetric. | rejected | none (5 M) |
| 3 | agentic-sdlc | C3 | a/d | L5 needs a quality gate on the produced code. Is the DoD gate script-enforced for code written in the session? | **What preflight gates:**<br>• it runs the `sdlc-dod` lint/typecheck/test commands as a hard gate<br>• but only at run start, resume and environment rounds (`preflight.mjs` ≈l.35: baseline "before any change")<br>• so it gates the baseline, not the session's diff<br><br>**What is manual:**<br>• task-exit and final DoD are pasted runs (`dod-gate`† is absent)<br><br>**coverage_min is not script-enforced:**<br>• `run-ledger.mjs` l.201 filters out `coverage_min`<br>• `preflight.test.mjs` asserts that it is not run<br>• so S-C's "coverage_min is a ratchet" is inaccurate as script enforcement<br><br>**Symmetry:** superpowers C3 was denied 5 for "no gate wired for the user's code". The literal anchor text (test-first + gates + rationalization counters, red evidence required) is met in text. | **to adjudicator** | Proposed: none (5 L) if the anchor is read literally. If a produced-code gate is required: L5 rests on `dod-gate`† (passes concreteness per S-A's table) → 5 L at **r 0.7** (RA 5.0 → 3.5). |
| 4 | agentic-sdlc | C4 | e | Is "persisted proof bound to source" (L5) a mechanism or an intention? | **Mechanism:**<br>• PR Verification rows carry a fingerprint computed by `scripts/lib/git.mjs`<br>• the command in `verification.md` §4 l.79 runs and prints 12 hex<br>• there is an explicit staleness rule (fingerprint ≠ head → re-verify)<br><br>**Example:** `pr-body.md` lists the head commit with the rows.<br><br>**Symmetry:** the agile-v S-B and ai-dlc precedents (engine-written records bound to fingerprints) got 5. | rejected | none (5 L) |
| 5 | agentic-sdlc | C5 | g/d | Steelman down: are the review lenses on the default path, or opt-in like the benchmarks? | **Default path (`review.md`):**<br>• lenses L1–L4 are mandatory on the Standard path<br>• one fresh context per lens, in parallel where the platform allows (l.25)<br>• severity triage log, default NO-GO and a review guide<br><br>**Anchor:** (a)–(d) are all present.<br><br>**Symmetry:** benchmarks lost (a) because their lenses were opt-in or used a single reviewer (round-1 #93 consistency rule). | rejected | none (5 M) |
| 6 | agentic-sdlc | C6 | f | Are the loop bounds enforced, or only stated? | **Enforced by `run-ledger.mjs` (tested):**<br>• exits 3 on bound overrun<br>• refuses a repeated `--tried` value<br>• fires breakers from ledger state<br><br>**Residual risk:** rounds are self-reported by the agent.<br><br>**Symmetry:** comparable to the ai-dlc engine review budget (`aidlc-log.ts`) credited at L4+. | rejected | none (5 M) |
| 7 | agentic-sdlc | C7 | d | Is L4/L5 parallel fan-out on the default path, or opt-in like ai-dlc swarm (round-1 #7 → 3)? | **Fan-out is on the default path (`executing-plans`):**<br>• Step 0.5 selects subagent dispatch whenever the platform can start fresh agents<br>• Step 1.4 computes the frontier on the default path (`plan-graph --from-git`)<br>• Step 3: "Tasks of one frontier with pairwise disjoint Files may run in parallel, at most 3, each on its own worktree; integrate in task-ID order and run the DoD after each merge"<br>• no user opt-in is needed (ai-dlc needed an explicit stage-major + swarm choice)<br><br>**K and E:**<br>• K is used: codemap/Impact drives scoped re-checks (Step 2.5)<br>• E is computed: `plan-graph` cycles, frontier, GRAPH_STALE<br><br>**Non-credit word:** "may" is noted. It qualifies permission for eligible tasks (disjoint files), not whether the mechanism exists. | rejected | none (5 M) |
| 8 | agentic-sdlc | C7, C13 | a | Do the docs contradict the CI wiring that L5 relies on? | **Contradictions:**<br>• `writing-plans/SKILL.md` l.141 says "The repository's CI runs `plan-graph --check`", but the CI templates are †<br>• router `SKILL.md` l.148 lists `budget-check.mjs` as "CI on `skills/**`", but `.github/workflows/validate.yml` runs neither `budget-check` nor `node --test`, and the cli-installer test script is an `echo`<br><br>**Why no score change:**<br>• the scripts exist, are tested and run on the default path through `executing-plans` and preflight, so C7 L5 does not depend on CI<br>• C13 5 is symmetric with superpowers S-A (5 with a validator not wired into CI, conf M) | rejected (fix recommended) | none |
| 9 | agentic-sdlc | C8 | g | Steelman up: does scripted resume plus authority halts reach L5? | **Resume:** `run-ledger` resume and status are scripted and tested.<br><br>**Authority limits:** self-applied (the agent halts on `authority` findings), not enforced by the environment.<br><br>**Symmetry:** ai-dlc S-B's 5 came from PreToolUse hooks. No equivalent here → L4. | rejected | none (4 M) |
| 10 | agentic-sdlc | C9 | f | Is r 0.7 optimistic, given that L5 rests on unbuilt `trace-check`†? | **Concreteness:** `trace-check`† passes §8.1 (`verification.md` §5 steps 1–5, `trace.md` format, exit 1 on gaps). It is unbuilt deterministic tooling → §8.3 r 0.7 exactly.<br><br>**Implemented:** production links are already in the text:<br>• spec signals tagged with AC<br>• intake issue carries AC-n<br>• postmortem tagged AC-n<br><br>**Other checks:**<br>• one new mechanism → no scope-load penalty<br>• `artifacts.md` also assigns `trace-check` the ops-reading-age check (additive, not a contradiction) | rejected | none (5 L, r 0.7) |
| 11 | agentic-sdlc | C10 | e/f | Is L5 (enforced approvals, exportable audit) more than intention, and is r 0.6 right? | **Concreteness:** L5 enforcement rests on `approval-check`† CI, which passes:<br>• governance §7 table<br>• plan l.42–44 and l.106: rev + hash, approver ≠ author, merge blocked, prompt-only banner otherwise<br><br>**Partial items:**<br>• `project-context` only probes and records `Enforcement: branch-protection \| prompt-only`; it does not configure enforcement<br>• export is a one-line manual zip "on audit request" over git-committed records. That minimally meets "can be exported"; standards-mapping† is named only.<br><br>**Unresolved contradictions → r 0.6 (floor; scope load moot):**<br>• `senior-solution-architect` l.97/l.104/l.110: "after CP2", "signs off CP3 (design and PLAN)", and invokes the nonexistent `security-hardening` skill<br>• `brainstorming` refers to an "AN stage"<br>• both contradict README l.75: "Stage codes and numbered checkpoints are gone"<br><br>**Quirk:** a D = 4 at r 1.0 would give a higher RA (4.0 > 3.0). Not upheld: D = 5 is valid under §8.2, and r already prices the risk. | rejected | none (5 L, r 0.6) |
| 12 | agentic-sdlc | C11 | a | S-A says the scripted secret scan runs "only in the opt-in unattended check". Is that true, and does that change the score? | **Correction (not a score change):** the S-A statement is inaccurate:<br>• `executing-plans` Step 2 runs `run-ledger check` at each task boundary in both modes<br>• `check` halts on secrets in attended runs too<br><br>**L5 still unmet:**<br>• the scan is a single 7-pattern regex<br>• gitleaks, dependency audit, SAST and SBOM are manual<br>• `ci/security.yml`† is not concrete<br><br>**Minor inconsistencies:**<br>• TM02: a risk-flagged Standard spec needs a threat model "before Spec approval", but lint only warns, and the worked example (money) has none. L4 is still met via the Full-path trigger (TM01). conf L kept.<br>• `security.md` lists 5 Security-note items; the template and SEC01 have 4. | rejected | none (4 L) |
| 13 | agentic-sdlc | C12 | g | Steelman up: is the threshold rollback automated (L5)? | **Present:** `release-ops.md` defines thresholds, a rollback rule and an observability checklist before release.<br><br>**Missing:** rollback is executed by a human or the agent; there is no automated trigger → L4. | rejected | none (4 M) |
| 14 | agentic-sdlc | C13 | a | Self-evaluation L5: are the evals and the budget/regression checks real? | **Real and passing:**<br>• `evals/` and script tests exist and pass (123/123)<br>• `budget-check` passes<br><br>**CI gap:** see #8. Same as superpowers S-A (5 M). | rejected | none (5 M) |
| 15 | agentic-sdlc | C14 | b | Does L5 (adoption guide for brownfield / incremental rollout) exist? | **Missing:** `adoption.md`† is named only; it is not concrete.<br><br>**L4 met:** path selection (Light/Standard/Full) and `project-context` brownfield discovery are implemented → 4. | rejected | none (4 M) |
| 16 | agentic-sdlc | C15 | b | Are the extension path and customization survival real, given "No extensions are loaded until `ext-check`† exists"? | **L4 met:**<br>• the extension path via `skill-creator`, CONTRIBUTING and `skill-anatomy` is symmetric with superpowers `writing-skills` (credited, C15 4)<br>• customizations survive re-vendor: `config.json` and the `project-context` block are untouched, and refresh replaces only between markers<br>• no mandatory runtime (round-1 #15/#31/#51 rule)<br><br>**Gaps (conf L justified):**<br>• "skill override / reference override" in `retrospective.md` is undefined<br>• `extension-interface.md`† is named only | rejected | none (4 L) |
| 17 | agentic-sdlc | C16 | b | Is L5 (metrics computed and acted on) met? | **L4 met:** the retro Facts table is collected each cycle.<br><br>**L5 unmet:** `metrics.mjs`† is not concrete → 4. | rejected | none (4 M) |
| 18 | agentic-sdlc | all | a | Is the worked example fabricated-looking? | **The ledger was hand-authored, not script-generated:**<br>• `run-ledger.jsonl` `check` events (seq 11/16/27/34) record `budget.used` as `tasks:0, hours:0`<br>• yet T1 and T2 start at seq 3–4<br>• `budgetUse()` (`run-ledger.mjs` ≈l.330) would compute `tasks = started.size` and ≈0.87 h by 09:52<br><br>**Other signs:**<br>• commit SHAs are patterned (`a11c0f3`, `b22d1e4`, `c33e2f5`, `d44f306`, `e55a417`, `f66b528`)<br>• `approvals.md` l.29 says R3/R4 "are appended here … when requested", but none appear<br><br>**Why no score change:**<br>• the example is labelled synthetic<br>• `spec-lint`, `plan-graph` and the hashes do verify<br>• no level rests solely on the example | rejected (fix recommended) | none |
| 19 | agentic-sdlc | C2, C3, C6, C7 | d | Enforced mode needs Node ≥18; without it `executing-plans` falls back to prompt-only. Is the script-based L5 on the default path? | **Default path:** Node is checked at Step 0, and the enforced mode is the default when Node is present (the common case for the target platforms).<br><br>**Symmetry:** benchmarks were credited for Python/TS/Bun scripts on the same basis (ai-dlc, bmad). | rejected | none |
| 20 | agentic-sdlc | all | f | Should the scope-load penalty (−0.1) apply? | **Which cells could be affected:** only C9 (1 new P mechanism) and C10 (already at the 0.6 floor) rest on unbuilt mechanisms. The other criteria rest on implemented artifacts, and §8.3 scope load is a design-realization risk.<br><br>**C9 check:** the largest benchmark count for C9 is not exceeded → no penalty. | rejected | none |

## Independent r for agentic-sdlc

The auditor set its r values from the §8.3 rubric before comparing them with the scorers' values.

| Criterion | s | Scorer r-min | AUD-2 r | Outcome |
|---|---|---|---|---|
| C1 | 4 | 1.0 | 1.0 | agree (implemented; budget-check passes) |
| C2 | 5 | 1.0 | 1.0 | agree |
| C3 | 5 | 1.0 | 1.0 | agree. The alternative 0.7 goes to the adjudicator (#3). |
| C4 | 5 | 1.0 | 1.0 | agree |
| C5 | 5 | 1.0 | 1.0 | agree |
| C6 | 5 | 1.0 | 1.0 | agree |
| C7 | 5 | 1.0 | 1.0 | agree |
| C8 | 4 | 1.0 | 1.0 | agree |
| C9 | 5 | 0.7 | 0.7 | agree (unbuilt deterministic tooling) |
| C10 | 5 | 0.6 | 0.6 | agree (unresolved contradictions; floor) |
| C11 | 4 | 1.0 | 1.0 | agree |
| C12 | 4 | 1.0 | 1.0 | agree |
| C13 | 5 | 1.0 | 1.0 | agree |
| C14 | 4 | 1.0 | 1.0 | agree |
| C15 | 4 | 1.0 | 1.0 | agree |
| C16 | 4 | 1.0 | 1.0 | agree |

## To adjudicator

1. **agentic-sdlc C3** (#3).
   - **The gap:** the only script-enforced DoD gate runs on the baseline (preflight at start, resume and env rounds). The produced-code DoD at task exit and final exit is a manual pasted run, because `dod-gate`† is unbuilt. `coverage_min` is not enforced.
   - **The question:** does C3 L5 require a scripted gate on the code produced in the session (the superpowers C3 precedent)?
   - **If yes:** 5 L at r 0.7. **If no:** 5 L at r 1.0, unchanged.

## Non-score recommendations (for the method owner)

1. Remove the stale vocabulary:
   - `senior-solution-architect` l.97–110: CP2, CP3, and the nonexistent `security-hardening` skill
   - `brainstorming`: "AN stage"

   This lifts the C10 contradiction basis.
2. Reconcile `approvals.md` l.29 with governance l.14. Either append R3/R4 or reword the line.
3. Make the CI claims true or reword them:
   - `writing-plans` l.141 (`plan-graph --check` in CI)
   - router l.148 (`budget-check` "CI on `skills/**`")

   Wiring `node --test` and `budget-check` into `validate.yml` would do it.
4. Regenerate the worked-example ledger with `run-ledger.mjs` (budget fields), or label it hand-authored.
5. Correct the "coverage_min ratchet" wording, or implement it in `run-ledger`/`preflight`.
6. Reconcile two security inconsistencies:
   - Security-note items: 5 in `security.md` vs 4 in the template and SEC01
   - TM02: make it blocking for risk-flagged Standard specs, or relax the "before Spec approval" wording

## Totals

- **Rows:** 20 challenges. 0 upheld, 19 rejected, 1 to adjudicator (C3).
- **Score changes:** no upheld score or r changes. `adjustments.json` → `"agentic-sdlc": {}`.
- **r agreement:** the independent r agrees with the scorer r-min on 16/16 criteria.
- Weighted totals and the verdict are computed mechanically afterwards. They are not computed here.
