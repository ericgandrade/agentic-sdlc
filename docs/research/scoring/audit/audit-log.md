# Red-team audit log — scoring round 1

| Field | Value |
|---|---|
| Methodology | `docs/research/scoring/methodology.md` v1.0, SHA-256 `a6e3953725b67db0189e188c1495ee9b54975e48f65c28baaa01f459b69cf9a4` (matches FREEZE.md); `evaluator-agent.md` SHA-256 `aa3a1f70…857a` (matches FREEZE.md) |
| Auditor | Red-team auditor (§10.3). Scored none of the methods in scope; did not author or plan any of them |
| Date | 2026-11-22 |
| Blindness | `aggregate.py` was read (to learn how adjustments are applied) but not run; `results.md` does not exist and was not created; no weighted totals or rankings were computed. Only raw per-criterion scores were compared |
| Evidence base available | All pinned clones existed: `obra/superpowers@22f0b46`, `mattpocock/skills@5863806`, `addyosmani/agent-skills@39b723c`, `BMAD-METHOD@e435a22`, `agilev@4bcc917`, `spec-kit@a4d5712`, `aidlc-workflows@1c557ea`, `OpenSpec@0c737dc`; Kiro official docs (53 Markdown pages) in the scratchpad; the design plan, structure proposal and `skills/` of this repository. Nothing had to be audited from the cards alone |
| Scope covered | All 20 cards, the orchestrator log, HANDOFF.md, scorer-instructions.md; all 16 criteria compared across all 10 methods; every pair differing by 2 or more; every 5 and most 4 cells of the benchmarks that can matter for the verdict (AI-DLC, Agile V, BMad, Superpowers, Addy Osmani, Spec Kit); both design cards in full |

Counts: **35 challenges raised (14 on the design-only method, 21 on benchmarks), 9 upheld or partially upheld (each changes one cell), 26 rejected.** Nine cells change: 4 on the design-only method, 5 on benchmarks.

---

## 1. Inter-scorer reliability (my impression)

- 160 benchmark cells (9 methods x 16): 127 identical (79%), 26 differ by 1 (16%), 7 differ by 2 or more (4%). Reliability looks adequate; I expect Krippendorff alpha well above 0.667.
- Disagreement concentrates in C1, C9, C15 (4 cells each) and C8, C14 (3 each). C15 and C1 are the criteria whose anchors contain a measurable clause that scorers measured differently (runtime dependency; reading load).
- Leniency by scorer (signed sum of differences against the partner, same cells): S-C +5, S-D +1, S-A -1, S-B -5. S-C is the most lenient benchmark scorer and S-B the strictest. This matters for the design: S-C was one of the two design scorers but scored the design strictly (no inflation seen).
- Both design scorers agree on 14 of 16 D scores (C1 and C15 differ) and differ on r in several criteria (C1, C5, C9, C10, C12). Their strict calls are consistent with each other.

### 1.1 Pairs differing by 2 or more

| Card pair | Cell | Scores | Which side the evidence supports | Reconciled by rule (median, rounded down) | My ruling |
|---|---|---|---|---|---|
| addyosmani S-A/S-C | C5 | 2 / 4 | Neither fully. `.claude/commands/review.md` is an in-session five-axis review (authoring context), as S-A says. `.claude/commands/ship.md` fans out three persona subagents with merge, dedup and GO/NO-GO, as S-C says, but it is a pre-launch step, not the pre-merge review. Both readings are defensible | 3 (Low) | Keep 3 (challenge B10 rejected) |
| bmad S-A/S-D | C1 | 5 / 3 | S-D is closer. `docs/start` has no troubleshooting or FAQ section (`get-answers-about-bmad.md` is a routing page); the scripted check `skills/core-tools/bmad/scripts/setup_check.py` exists. L4 needs a troubleshooting or FAQ section | 4 (Low) | Borderline; median kept (B11 rejected) |
| ai-dlc S-B/S-C | C1 | 2 / 5 | S-B. The entry skill `harness/claude/skills/aidlc/SKILL.md` is 8,065 words and README is 1,425, so core reading load is about 9.5k words before any guide; the anchor counts "entry skill or command". L3 needs 8k or less | 3 (Low) | Upheld: 2 (B1) |
| ai-dlc S-B/S-C | C7 | 3 / 5 | S-B. Swarm fan-out is explicit opt-in (`docs/guide/workflow-profiles.md`: "explicitly choose stage-major order and swarm execution; Unit-major stays serial"); no impact analysis from the code map feeds planning or test selection. L4 is not met on the default path, so L5 cannot count | 4 (Low) | Upheld: 3 (B2) |
| ai-dlc S-B/S-C | C15 | 2 / 5 | S-B under the literal anchor ("no mandatory runtime beyond the host agent"): `README.md` installs a native `aidlc` binary and runs hooks and commands through it | 3 (Low) | Upheld: 2 (B3, contestable) |
| openspec S-B/S-D | C15 | 2 / 4 | S-B. Every skill carries `compatibility: Requires openspec CLI` (verified in `skills/openspec-*/SKILL.md`) | 3 (Low) | Upheld: 2 (B4, contestable) |
| spec-kit S-B/S-C | C1 | 5 / 3 | Both defensible. `scripts/bash/check-prerequisites.sh` inspects state and names the missing command; `specify check` and `docs/upgrade.md` exist; there is no whole-project router. Core reading is about 4k words | 4 (Low) | Keep 4 |

### 1.2 One-point differences, reconciliation direction

The rule (take the lower unless one scorer cites evidence the other missed) was applied mechanically by the aggregator. Of 26 one-point differences I found one where the lower value is not supported by the evidence (spec-kit C5, challenge B5). I found none where the higher value was an error that the rule hides, except that S-C's statement for Superpowers C5 ("no explicit security axis") is incorrect (`requesting-code-review/code-reviewer.md` line 80 lists "Security concerns?"); it did not change the score. The Agile V C9/C12 one-point gaps both come from S-B crediting `release-manager`, which `docs/INSTALL_PROFILES.md` puts only in the `regulated` profile; taking the lower value is right.

---

## 2. Challenges (§11.5 format)

Types: (a) evidence does not say what is claimed, (b) lower-level requirement unmet, (c) double counting, (d) not on default path for R, (e) vague intention credited, (f) optimistic r, (g) steelman the competition.

### 2.1 Design-only method (agentic-sdlc, both cards)

| # | Method | Criterion | Type | Challenge | Evidence checked | Outcome | Score change |
|---|---|---|---|---|---|---|---|
| A1 | agentic-sdlc | C3 | b, e | D=4 on both cards, but L4 needs test-quality safeguards (failing test observed, mock limits, stated failure each test catches, anti-pattern catalogue), a refactor step and counters to rationalizations. Plan §5 C.1 only names "writing good tests; mocking guidance; name the break check"; the catalogue is absent; the rationalization table is a standard to be written (§4 item 4) with no content. Both scorers' own concreteness tables mark mocking and name-the-break "named only". Meanwhile Matt Pocock (concrete mock limits, anti-pattern catalogue present in files) and AI-DLC (Red output recorded, mock guidance, refactor step) were held at 3 for lacking only the rationalization counters. The L3 simplicity rule rests on one line, "DRY. YAGNI. TDD." (`skills/writing-plans/SKILL.md:13`) plus a named review axis | Plan §1.6 rule 4, §4 item 4, §5 C.1; `skills/writing-plans/SKILL.md:13,95`; S-A/S-C concreteness tables; AI-DLC S-C C3, MP S-A/S-D C3 | UPHELD | D 4 -> 3 (r stays 0.8, conf M) |
| A2 | agentic-sdlc | C8 | c | D=2 on both cards counts "bounded loop (5 rounds, escalate)" as a C8 safeguard. §3.1 homes the loop bound in C6; the scorers themselves excluded the same cap from C8 for Superpowers and BMad ("the 5-round cap is a loop bound counted in C6"). Without it the design has one C8 safeguard (role authority limits in §1.3 "Never" column); isolation, preflight, resume are "named only" by both scorers' own tables, and no unattended mode is defined | Plan §1.3, §1.6 rule 9, §5 B.1/C.2; S-A and S-C C8 rationales; S-A superpowers/bmad C8 | UPHELD | D 2 -> 1; r 0.9 (awarded level is advice-level plus existing prototype), conf M |
| A3 | agentic-sdlc | C9 | f | S-C r=0.6 rests on an alleged contradiction (§1.4 Standard "Required artifacts" omit release notes while §1.2 records Release approval in release notes). Verified: §1.4 omits release notes, but §1.1 (Release stage), §1.2 and §1.5 all include them, so it is an incomplete table, not a logical contradiction. The awarded L4 does not depend on release notes: the anchor accepts "release notes or PR reference requirement IDs", and the PR Verification table plus `[Tn, AC-n]` commits cover it. The 0.7 row still applies (three or more cross-stage dependencies on unbuilt skills; no benchmark carries IDs to production monitoring). The design defect (add release notes to §1.4) should be fixed regardless | Plan §1.1, §1.2, §1.4, §1.5, §1.6 rule 8, §5 D.2; `release-manager/SKILL.md:37` (precedent for IDs in release notes) | PARTIALLY UPHELD | r 0.6 -> 0.7; D stays 4 |
| A4 | agentic-sdlc | C12 | f | S-A applied the scope-load penalty (-0.1), S-C none. S-C is right on the rule: AI-DLC implements more release/operations mechanisms (deployment-pipeline, deployment-execution, observability-setup, incident-response, feedback-optimization stages) than the design commits, so no criterion triggers the penalty. S-A's penalty was derived against Addy Osmani only. However r=0.7 stands independently under the 0.7 row (deployment thresholds, indicator from `issue-triage`, operate skills are three or more unbuilt cross-stage dependencies), so the penalty question does not change the final r | AI-DLC `core/aidlc-common/stages/operation/*`; plan §5 D.5-D.7; S-A and S-C r justifications | REJECTED (no change; answer on scope load: S-C correct) | none |
| A5 | agentic-sdlc | C1 | f | Final r=0.8 comes from S-A, whose D=3 needed the unwritten guide; the reconciled D=2 (S-C) needs only things that already exist (one-command installer, router entry point, reading load under 15k words). r should follow the awarded level, not the other scorer's D. The reconciled D=2 is right: the plan says the guide is "readable in under an hour" (about 12k words at 200 wpm), which exceeds the L3 limit of 8k, and the design is internally inconsistent ("one-page guide") | Plan §5 Phase F, E.4; structure proposal §8; `skills/agentic-sdlc/SKILL.md` (1,687 words) | UPHELD | D 2, r 0.8 -> 0.9, conf L |
| A6 | agentic-sdlc | C10 | b, e | L4 needs a waiver procedure and approvals bound to a revision. D10 §1.2 record fields have no revision; waiver is only "residual risks accepted" in the record and an Exceptions table in optional `CONSTRAINTS.md`. Revision binding and the change protocol exist concretely only in the superseded prototype (`skills/spec-driven-development/SKILL.md` Step 6, revise mode; `references/rules.md`). BMad was denied L4 partly for lacking a waiver procedure. Marginal: residual-risk acceptance recorded with rationale is a recorded exception to a finding, AI-DLC "Override" was credited similarly, and Phase 0.4 keeps rules.md | Plan §1.2, §1.3 severity; rules.md "Change protocol"; artifacts.md Exceptions; BMad S-D C10 | REJECTED (flagged as residual concern R3) | none |
| A7 | agentic-sdlc | C13 | e | D=5 for a design. L5 is met by the existing validator (`scripts/validate-skill-content.sh` exits 2 above 5,000 words; `.github/workflows/validate.yml` runs it), the same kind of evidence that earned Superpowers (`tests/skill-size/test-skill-size.sh`), Addy Osmani (`scripts/lib/skill-lint.js` in CI) and AI-DLC (`tests/smoke/t119-skill-md-line-budget.test.ts`) a 5. L4 role-hygiene rests on agent files not yet written, and §7 allows duplication ("repeat the minimum needed to work standalone") against the single-source rule, but the plan's single shared rules file and "router never paraphrases" cover it. r 0.9 is at the upper edge of the rubric (resume named only) | Verified validator text and workflow; plan §4, §7; phase-boundaries.md | REJECTED | none |
| A8 | agentic-sdlc | C15 | b | S-C gave 5 with "versioned extension interface" = Agent Skills frontmatter plus version sync. S-A's 4 is correct (no versioned interface). Aggregator takes the lower | `scripts/validate-skill-yaml.sh`, `verify-version-sync.sh`, `.github/workflows/validate.yml`; Spec Kit `schema_version`/`requires.speckit_version` and AI-DLC semver plugin manifest as true precedents | REJECTED (reconciled 4 is right) | none |
| A9 | agentic-sdlc | C16 | a | Retrospective is optional on Standard (`lifecycle.md`, plan §1.4), so D=2. But structure proposal §8 (Standard-path worked example) has the retro noting an improvement to AGENTS.md, and §1.1 lists retrospective in every Operate stage. The scorers followed the stricter, explicit rule; I agree, and flag the inconsistency as a design defect | Plan §1.1, §1.4, §5 D.8; structure proposal §8 | REJECTED | none |
| A10 | agentic-sdlc | C2, C4, C5, C6, C7, C11, C14 | b, e | Re-derived each D from the concreteness test. C2 L4 (doubt pass, stop rule, change protocol with revision history and impact step) is concrete in the prototype (`spec-driven-development` Step 5, fields 11-12, Revise mode). C4 L4 (Test Engineer from spec, CANNOT_VERIFY, Reviewer never trusts PR text, fresh-output rule 2) is concrete. C5=3 and C6=3 are strict (second of (a)-(d) and state/scoped re-check are named only). C7=2 matches Matt Pocock/Spec Kit treatment (no map on the path). C11=2 and C14=3 are consistent with benchmarks. No inflation | Plan §1.3, §1.6, §5 C.2, C.3, D.1-D.4; prototype skills | REJECTED | none |
| A11 | agentic-sdlc | all | e | Credit for "refine from the matrix" lines, hedged enforcement ("where possible"), measurement without pass threshold (evals), Phase H, D11, GATE banner. Checked each; none credited by either scorer | Plan §1.2, §4 item 7, §5; both concreteness tables | REJECTED | none |
| A12 | agentic-sdlc | C2, C6, C10, C13-C16 | a | Credit from `skills/` prototypes written for the superseded design (CP1-CP5, CHECKPOINTS.md, TRACEABILITY.md, `docs/agentic-sdlc/`). Phase 0 rewrites them; D10 §1.6 (the rules Phase 0.4 will install) does not mention frozen revisions or the change protocol, which appear only as the names "change protocol with impact checklist" (B.1) and "revise mode" (B.6). Scorers used r=0.9 for these, which is the right row (prototype exists, final form pending). Recorded as residual concern R2 | `skills/agentic-sdlc/references/*`, plan §1.6, §5 Phase 0, B.1, B.6 | REJECTED | none |
| A13 | agentic-sdlc | facets | c | One-home check of the concreteness tables. Root-cause routing appears in C5(b) and C6 but C5 did not reach L4 on it; two-way gap check cited under C4 and C9 but used only in C9; approvals per path counted in C10 (approval depth) and routing in C14 are different facets. The only double count that changed a level is the loop bound in C8 (A2) | Both concreteness tables | REJECTED (except A2) | none |
| A14 | agentic-sdlc | C9 | e | D=4 requires gap analysis in both directions. D.2 ("two-way gap check: untested AC, unrequested code") plus `writing-plans` coverage check (prototype) meet it; the release link is satisfied by the PR Verification table | Plan §5 D.2; `skills/writing-plans/SKILL.md` Phase 4 | REJECTED | none |

### 2.2 Benchmarks

| # | Method | Criterion | Type | Challenge | Evidence checked | Outcome | Score change |
|---|---|---|---|---|---|---|---|
| B1 | ai-dlc | C1 | a, b | S-C's 5 measured core reading as README quick start only, omitting the entry skill the anchor counts (8,065 words). S-C measured the design by its whole guide ("under an hour") but AI-DLC by its quick start: asymmetric. README 1,425 + entry skill 8,065 = about 9.5k words > 8k, so L3 fails; L2 holds | `wc -w` on `harness/claude/skills/aidlc/SKILL.md`, `README.md`, guides | UPHELD | 3 (median) -> 2, conf M |
| B2 | ai-dlc | C7 | d | S-C's 5 needs L4 (parallel frontier with integration plus impact analysis from the code map). Swarm is explicit opt-in (default Unit-major is serial); opt-in counts up to 2 outside C8/C14; no impact analysis feeding plan or test selection found (grep of `core/aidlc-common`). L3 stands (E used and computed by `aidlc-unit-dag.ts`; K declared via codekb) | `docs/guide/workflow-profiles.md` lines 225-240; `stage-protocol-swarm.md`; `aidlc-unit-dag.ts` exists | UPHELD | 4 (median) -> 3, conf M |
| B3 | ai-dlc | C15 | b | L3 requires "no mandatory runtime beyond the host agent and a standard toolchain". AI-DLC's hooks and commands run through its own native `aidlc` binary (README lines 29-31). S-C justified 5 by analogy to Spec Kit's Python CLI, but Spec Kit commands run project-local bash scripts (`scripts/bash/*.sh`), not its CLI. Same reading gives BMad 2 (uv + `render_skill.py`) and OpenSpec 2 (CLI at every step) | AI-DLC README; Spec Kit `templates/commands/plan.md` front matter; BMad S-A/S-D C15 | UPHELD (contestable; confidence Low) | 3 (median) -> 2, conf L |
| B4 | openspec | C15 | b | Same rule. S-D 4 says "standard Node or standalone binary"; every skill states `compatibility: Requires openspec CLI` | `skills/openspec-apply-change/SKILL.md:6` and siblings | UPHELD (contestable; confidence Low) | 3 (median) -> 2, conf L |
| B5 | spec-kit | C5 | a | Reconciled 1 (S-C) vs 2 (S-B, which revised 1 -> 2 for OpenSpec consistency). `templates/commands/converge.md` (1,861 words) checks the code against spec, plan, tasks and constitution with CRITICAL/MEDIUM/LOW severities, is a default quickstart step (`docs/quickstart.md` Step 9) and runs in the authoring context: exactly OpenSpec's `openspec-verify-change` (CRITICAL/WARNING/SUGGESTION, authoring context, opt-in, scored 2 by both OpenSpec scorers). Equivalent mechanisms, different reconciled scores. L2 text fits both | `converge.md` lines 86, 151-186; `docs/quickstart.md`; OpenSpec verify skill | UPHELD | 1 -> 2, conf M |
| B6 | agile-v | C4 | a, d | L5 relies on `docs/agile-v-runtime/07_EVIDENCE_ADMISSION_CONTRACT.md` and `10_CHANGE_AWARE_REVALIDATION.md`, normative contracts whose runtime enforcement is unreleased (`conformance/RUNTIME_STATUS.md`: "No released runtime version is claimed"). The skill-level record (`red-team-verifier` VER line, EvalGate block) names a reference path, not a digest; digest binding and staleness live in the contracts and `agile-v-core` Directive 7, with revalidation checks in the verifier checklist. Plausible but not airtight; compare Superpowers' real `task-done` script denied L5 as off the recommended route. Both cards already carry the doubt (S-D Low) | Agile V clone files named; RUNTIME_STATUS.md | REJECTED (confidence stays Low through the max rule) | none |
| B7 | agile-v | C2 | b | Contestable non-goals reading. Verified: `requirement-architect/SKILL.md` has no out-of-scope element; its "which users, processes ... are in scope" question applies only to regulated or high-assurance intent. So the strict reading is textually right. Spec Kit got L3 on weaker substitutes (`spec-template.md:129` only an example assumption line; a checklist item "Scope is clearly bounded"; clarify category "Explicit out-of-scope declarations"). Different evidence, not identical, so I leave both; residual R5 | Agile V skill; Spec Kit templates; BMad plan-template ("Never: NON_GOALS_AND_FORBIDDEN_APPROACHES"); OpenSpec design Goals/Non-Goals | REJECTED | none |
| B8 | agile-v | C9, C12 | g | Steelman: `docs/GOLDEN_JOURNEY.md` step 11 invokes `release-manager` (release notes cite REQ IDs; rollout, canary triggers, rollback), which would lift C9 to 4 and C12 to 3. But `docs/INSTALL_PROFILES.md` lists `release-manager` only in the `regulated` profile, not `existing-repo`; conservatism favours the lower reading | `INSTALL_PROFILES.md`, `release-manager/SKILL.md:37` | REJECTED (residual R6) | none |
| B9 | agile-v | C8 | a | "Human-gated by design": both cards 2, S-D Low. No isolation or preflight; the L3 gate stops it. Consistent with Addy Osmani 2 and Spec Kit 2 | Cards; `agile-v-core` directives | REJECTED | none |
| B10 | addyosmani | C5 | b | See §1.1. Median 3 with Low confidence is a fair compromise; I could not show either extreme is wrong | `.claude/commands/review.md`, `ship.md` | REJECTED | none |
| B11 | bmad | C1 | b | See §1.1; median 4 kept although S-D's L4 gap (no troubleshooting or FAQ) is real | `docs/start/*`, `skills/core-tools/bmad/*` | REJECTED | none |
| B12 | kiro | all | a, g | Compared S-B (re-scored) and S-D against the saved official docs. Verified: parallel tasks and dependency waves (`specs.md`), `/goal` default 5 iterations, compaction at 80%, PBTs optional by default (`specs_correctness.md`), autonomous-mode sandbox and PR, "Supervised mode is a code review workflow, not a security control", memory default "Don't use". All claims match. One error without score effect: S-B C1 cites `kiro-cli doctor` as a documented check, but `getting-started_installation.md:287` lists it as removed in CLI 3.0 (S-D is right). Differences: C9 3/2, C13 4/3 (lower taken) | `kiro-docs/*` | REJECTED | none |
| B13 | kiro | C8 | b | Kiro has sandbox isolation, permission rules, resume, caps and structured output but no preflight; a fresh cloud clone arguably makes preflight moot. The L3 gate is literal; consistent with others at 2 | `web_autonomous-mode.md`, `cli_headless.md`, `permissions.md` | REJECTED | none |
| B14 | ai-dlc | C5, C6, C12 | d | Both scorers scored the `feature` profile, not the engine default `classic` (`harness/claude/settings.json AWS_AIDLC_DEFAULT_SCOPE=classic`; classic: advisory reviews, no Operation). The profile guide names Feature for a production feature, so the choice follows §2.2 ("the route the method selects for R"), and the scorers flagged it. Treated as a sensitivity, not an error | `workflow-profiles.md`; both traces | REJECTED (residual R7) | none |
| B15 | superpowers | C13 | a | L5 evidence verified: `tests/skill-size/test-skill-size.sh` (20,000-byte limit), `tests/claude-code/analyze-token-usage.py`; both exist. Not wired into CI (`.github/` has no workflows): confidence M is right | clone | REJECTED | none |
| B16 | addyosmani | C3 | a | L5 evals verified: `evals/README.md` describes with/without-plugin behavioural runs, `evals/plugin/tdd-fires-on-pasted-bug` exists; `.github/workflows` exists | clone | REJECTED | none |
| B17 | ai-dlc | C4, C6, C8, C13 | a | Verified tool-written proof: `core/tools/aidlc-construction-checkpoints.ts` has `command_sha256`, `stdout_sha256`, fingerprint, exit code; `stage-protocol-loopback.md` ("max 3 per intent", Loop-Back Log); `core/hooks/aidlc-plan-approval-guard.ts` is a PreToolUse hook (exit 2); `tests/smoke/t119-skill-md-line-budget.test.ts` exists. C4=5, C13=5 supported; C6 and C8 reconciled to 4 (lower) are right (bounds applied by the agent from a markdown ledger; no hook blocks push or deploy) | AI-DLC clone | REJECTED | none |
| B18 | spec-kit | C15, C1 | b | C15=5 holds under the runtime reading used in B3 (project-local bash scripts, `extension-version-guard.yml`, `schema_version`). C1 5/3: both defensible (see §1.1) | clone | REJECTED | none |
| B19 | spec-kit, bmad, kiro, openspec | C2 | b | Non-goals and independent-critique readings across methods (BMad non-goals ok; OpenSpec Goals/Non-Goals in design.md ok; human review as critique accepted by S-B and S-D alike) | clone files named | REJECTED | none |
| B20 | all | C9 | d | Release-link requirement across methods: BMad, AI-DLC, Spec Kit denied (no IDs in PR or release notes; I confirmed AI-DLC has none by grep), Agile V reconciled to the lower value, design credited through the PR Verification table. Consistent after reconciliation | clones | REJECTED | none |
| B21 | all | C16, C12 | a | Addy Osmani C16 0/1: S-A's L1 rests on runbook-upkeep advice in `observability-and-instrumentation`; thin. Median rule gives 0. No change | clone | REJECTED | none |

---

## 3. Cross-method consistency per criterion (the main check)

- **C1.** One anchor, three measurement habits for core reading load: S-B counted entry skill words (AI-DLC), S-C counted quick start only for AI-DLC and the whole guide for the design, S-A/S-D counted README plus entry skill for BMad. Corrected only where it changes a level (B1, A5).
- **C2.** The explicit non-goals rule is applied strictly to Kiro and Agile V (both textually correct: no scope element in the default artifact) and with weaker substitutes to Spec Kit. No cell changed, because the evidence differs; flagged R5.
- **C3.** L4 was denied to Matt Pocock, AI-DLC, Agile V and BMad for a single missing element each, while the design received L4 with half its safeguards named only. This was the largest asymmetry in the design's favour (A1).
- **C4.** Persisted, version-bound evidence earned 5 only where files implement it (AI-DLC: tool-written hashes). Agile V's 5 rests on contracts whose runtime is unreleased and is the softest 5 in the table (B6, confidence Low).
- **C5.** Verify-style steps were scored 2 (OpenSpec, Kiro, Matt Pocock, Addy Osmani /review) except Spec Kit's `converge` (1 after reconciliation); corrected (B5). Axis completeness was read leniently for every method (BMad three axes, AI-DLC no security axis, Superpowers). The design was not helped (3).
- **C7.** Opt-in cap applied by S-B to swarm, not by S-C (B2). Codebase-map credit: Kiro `structure.md` counted as declared, Spec Kit "Project Structure" not; the design's AGENTS.md is not a map. Consistent enough.
- **C8.** Loop bound counted in C6 for Superpowers and BMad, but in C8 for the design (A2). Preflight was required literally for everyone, including Kiro.
- **C9.** Consistent (B20).
- **C10.** BMad and AI-DLC were stopped at 3 for the missing waiver or re-open-on-change elements; the design reached 4 with a thinner waiver (A6, marginal).
- **C13.** Validator-based 5s are consistent across Superpowers, Addy Osmani, AI-DLC and the design (A7).
- **C15.** The runtime clause was read three ways (B3, B4). After correction: bash-only or plain-file methods score high; engine- or CLI-bound methods score 2.
- **Hedged language ("where possible", "may", "recommended").** Not credited for the design (C4, C10 L5). For benchmarks I found no cell where equivalent hedging earned credit: opt-in or advisory mechanisms were capped (AI-DLC Guard Policy off, Classic advisory reviews, Spec Kit workflow gates, Superpowers `task-done` off the recommended route).
- **Name-only mechanisms.** The design lost credit on every named-only item except where the scorers reused them inconsistently (C3 "name the break" credited by S-A, denied by S-C; C13 resume cited by S-A while called "named only" in its C8). Benchmark mechanisms credited on thinner evidence than the design were limited to Agile V's runtime contracts (B6) and AI-DLC cells corrected above.
- **Opt-in cap.** Applied consistently except AI-DLC C7 (B2).
- **Evidence caps.** No open-source cell has D evidence at 4 or above; Kiro D cells are capped at 4. S-B's `AV-nn` citations for Agile V are not valid I-inv (the Agile V concept inventory names no source files), but every such cell also cites files.
- **Confidence.** Two H cells with a scorer disagreement (ai-dlc C15 H vs L; spec-kit C5 H vs M); the aggregator's max-u rule already lowers them. S-B and S-D used Low where they recognised contestable readings; S-C used Low only on the design.

---

## 4. Design-only method: answers to the specific questions

1. **Concreteness test.** Applied correctly on the whole; the credited items (spec.md with G/W/T, doubt pass, change protocol, TDD rule 4, rule 2 evidence, Reviewer/Test Engineer roles, rule 9 loop, approval records, AC chain) genuinely carry at least four of five elements. Exceptions: C3 (A1) and C8 (A2).
2. **r per §8.3.** Scorer r values are within one row of my independent reading. Adjusted: C1 (A5) and C9 (A3). The aggregator takes the lowest r across scorers even when the lowest r belongs to the scorer with the higher D; this systematically double-penalises the design where scorers' D differ (C1, C15). A5 fixes the one place it matters.
3. **Scope load.** S-C is right that the penalty should not be triggered (A4): in every criterion AI-DLC, BMad, Agile V or Addy Osmani implement at least as many mechanisms as the design commits. S-A's single application (C12) was measured against one benchmark. The final C12 r of 0.7 is nevertheless justified by the cross-stage dependency row.
4. **Vague intention.** None credited for the L-level reached, except the two over-credits above and the marginal C10 waiver (A6).
5. **C9 self-contradiction.** Verified in the plan (A3). It is a real omission in §1.4 (release notes missing from the required artifacts of every path, and §1.2 records Release approval there) and should be fixed in the plan. It does not justify r=0.6.
6. **Under-scored?** C1 r (A5) and C9 r (A3). Possible but unproven: C12 observability-before-release and C16 retro on Standard (design inconsistency; scorers followed the explicit rule).
7. **Skills under `skills/`.** Credited as I-proto only where the file text was read and the mechanism is on the D10 path (spec-driven-development doubt pass and revise mode, writing-plans task graph and coverage check, lifecycle fix loop, phase-boundaries, project-context). Not ignored; not over-credited with r=1.0. Their superseded vocabulary is the main hidden risk (A12).

---

## 5. Evidence-type honesty and confidence

- Open-source cells: no D evidence at 4 or above; every I cell cites at least one resolvable file. An automated check of about 800 cited paths in the 16 benchmark cards found no fabricated paths; 22 apparent misses were `:line` suffixes or shorthand and all resolved by hand.
- Verified 40+ individual claims against clones and docs (list in §6).
- Kiro: S-B and S-D now share evidence; the single factual slip (doctor) is harmless under the cap.
- Low-confidence cells that could change a rank: Agile V C4 (S-D Low), AI-DLC C15, C1, C7 (now adjusted), Addy Osmani C5.

## 6. Claims verified (path and result)

| # | Claim | Result |
|---|---|---|
| 1 | Superpowers `tests/skill-size/test-skill-size.sh` 20,000-byte limit | Confirmed |
| 2 | Superpowers `skills/executing-plans/scripts/task-done` | Exists |
| 3 | Superpowers `requesting-code-review/code-reviewer.md` security lens | Present (line 80); S-C wrong, no score effect |
| 4 | Superpowers `diagnosing-superpowers/templates/report.md` | Exists |
| 5 | Superpowers `systematic-debugging/SKILL.md` 3-failed-fixes escalation | Confirmed |
| 6 | Addy Osmani `.claude/commands/review.md` runs in the main session | Confirmed |
| 7 | Addy Osmani `ship.md` three parallel personas, merge, dedup, GO/NO-GO | Confirmed |
| 8 | Addy Osmani `evals/README.md` with/without-plugin behavioural evals | Confirmed |
| 9 | Addy Osmani `scripts/lib/skill-lint.js`, `.github/workflows` | Exist |
| 10 | BMad `skills/method/bmad-agent-po/scripts/tickets.py` `_check_cycles` | Confirmed |
| 11 | BMad `plan-template.md` Boundaries with Never = non-goals | Confirmed |
| 12 | BMad `setup_check.py` exists; no troubleshooting or FAQ page in `docs/start` | Confirmed |
| 13 | Spec Kit `Tests are OPTIONAL` in `tasks-template.md` and `commands/tasks.md` | Confirmed |
| 14 | Spec Kit `spec-template.md` scope only as example assumption | Confirmed |
| 15 | Spec Kit `converge.md` severity levels, quickstart Step 9 | Confirmed |
| 16 | OpenSpec `compatibility: Requires openspec CLI`; design Goals/Non-Goals | Confirmed |
| 17 | AI-DLC loop-back max 3; `guard_policy: off` for feature; PreToolUse plan-approval hook | Confirmed |
| 18 | AI-DLC swarm explicit opt-in; no impact analysis from code map | Confirmed |
| 19 | AI-DLC README native binary; entry skill 8,065 words; line-budget test | Confirmed |
| 20 | AI-DLC `command_sha256` / stdout hashes in checkpoints tool | Confirmed |
| 21 | Agile V `release-manager/SKILL.md:37` release notes cite REQ; profile placement | Confirmed (regulated only) |
| 22 | Agile V `conformance/RUNTIME_STATUS.md` no released runtime; `contracts/versions.yaml` | Confirmed |
| 23 | Agile V requirement artifact has no non-goals element | Confirmed |
| 24 | Kiro docs: dependency waves, `/goal` default 5, compaction 80%, PBT optional, supervised-mode warning, memory default | Confirmed |
| 25 | Kiro doctor command removed in CLI 3.0 | Confirmed (S-B slip) |
| 26 | Design: `validate-skill-content.sh` exits 2 above 5,000 words; CI runs it | Confirmed |
| 27 | Design: `lifecycle.md` round-4 escalation and 5-round cap; rules.md change protocol; artifacts.md Exceptions table | Confirmed |
| 28 | Design: `spec-driven-development` revision history, doubt pass, revise mode | Confirmed |
| 29 | Agile V cards: 8-word n-gram overlap against the clone | Only file paths and section names; 5-word overlap adds a few generic phrases. Identifiers-only holds |

## 7. Agile V

Both cards cite identifiers only (paths, `file#section`, REQ/AV ids); no body text copied (8-gram check against the clone: paths and headings only). Contestable readings: C2 (strict non-goals: textually right, B7), C4 (L5 on unreleased contracts: soft, B6), C8 (2: right, B9), C12 (2 vs 3: release-manager outside the existing-repo profile, B8). No adjustment.

## 8. Orchestrator conflicts

1. **Totals reached scorers.** The log says scorers returned baseline totals "requested by the orchestrator". §10.2 says totals are never shown to scorers; here the scorers computed them for the benchmarks they had just scored. Both design scorers scored the design after seeing their own four benchmark totals. I see no inflation in their design cards (they are strict), but this is an anchoring risk and a process deviation.
2. **Shared model family.** The design, the orchestrator and all scorers are Claude-based. §10.2 declares only vendor-publishes-the-method conflicts; self-preference is not covered. The scorers were strict on the design, which mitigates but does not remove the concern.
3. **In-scorer revision after seeing another method.** S-B revised spec-kit C5 1 -> 2 for consistency with OpenSpec. It was right on the merits (B5) but is a cross-method anchoring event; reconciliation then discarded it.
4. **Evidence supplied for the design.** HANDOFF lists the partial `skills/` as design evidence. This is permitted by §8.3 and was capped by r 0.9, but it gave the design I-proto credit from files the plan itself says are obsolete. Not a tilt in intent; flagged (A12).
5. **Agile V inventory.** scorer-instructions.md points scorers to `agile-v-concepts.md`, whose entries are written as realizations for the design ("Realization (`spec-driven-development` ...)") and name no source files. S-B cited `AV-nn` as evidence; S-D declined. No score depends on them.
6. **Instructions that tilt toward the design.** I found none in scorer-instructions.md or HANDOFF.md. They contain strictness guidance for the design ("no credit for vague intentions") and off-limits rules for the positioning sections. Gaps: no matching instruction told benchmark scorers to count the loop bound in C6 only, or to count the entry skill in reading load.
7. **Kiro.** The orchestrator's own note ("bias in our favour") is correct; the re-scored cards fix the evidence. I treated no Kiro cell as Low except C16.

---

## 9. Systematic issues

1. **Measurable-clause drift.** Anchors with a number or a dependency clause (reading load, runtime) were measured differently across scorers (C1, C15).
2. **Level-4 completeness.** The strict "every element" reading used on benchmarks was relaxed for the design on C3.
3. **One-home breaches** in the design (loop bound in C8).
4. **Opt-in cap** missed once (AI-DLC C7 by S-C).
5. **Reconciliation minimum on r** double-penalises the design when scorers' D differ.
6. **Cross-scorer severity.** S-C lenient (+5), S-B strict (-5) on benchmarks; the lower-of-two rule mutes most of it.
7. **Soft top cells.** Agile V C4=5 and the AI-DLC route choice (Feature vs Classic default) are the two judgement calls most able to move a benchmark rank.

## 10. Cells recommended for change (all in adjustments.json)

| Method | Criterion | Reconciled before | After | Why |
|---|---|---|---|---|
| agentic-sdlc | C1 | D 2, r 0.8, L | D 2, r 0.9, L | A5 |
| agentic-sdlc | C3 | D 4, r 0.8 | D 3, r 0.8, M | A1 |
| agentic-sdlc | C8 | D 2, r 0.8 | D 1, r 0.9, M | A2 |
| agentic-sdlc | C9 | D 4, r 0.6 | D 4, r 0.7, M | A3 |
| ai-dlc | C1 | 3 (L) | 2, M | B1 |
| ai-dlc | C7 | 4 (L) | 3, M | B2 |
| ai-dlc | C15 | 3 (L) | 2, L | B3 |
| openspec | C15 | 3 (L) | 2, L | B4 |
| spec-kit | C5 | 1 | 2, M | B5 |

Net direction: four cells lower benchmarks (AI-DLC x3, OpenSpec x1), one raises a benchmark (Spec Kit C5), two lower the design (C3, C8) and two raise the design's r (C1, C9). The adjustments are evidence-driven, not direction-driven.

## 11. Residual concerns

- **R1.** The design's strongest cells (C2, C4, C9, C10, C13) draw on skills written for the superseded structure; if Phase 0 drops the revision history, change protocol or phase boundaries, those D values fall one level.
- **R2.** D10 §1.6 (the rules Phase 0.4 installs) omits frozen revisions and the change protocol; they survive only as names in B.1/B.6 plus the prototype.
- **R3.** C10 L4 waiver is marginal (A6). If the orchestrator wants a sensitivity run, C10 D=3.
- **R4.** The plan has two real defects found by this audit: release notes missing from §1.4 required artifacts (C9), and the Standard-path retrospective (optional in §1.4, present in the §8 worked example).
- **R5.** C2 non-goals asymmetry (Agile V and Kiro strict vs Spec Kit lenient). Sensitivity: Spec Kit C2 2, or Agile V C2 3-4.
- **R6.** Agile V `release-manager` in or out of the default path: C9 4 and C12 3 if in. Sensitivity worth running.
- **R7.** AI-DLC route: `feature` was scored; `classic` is the engine default (C5, C6, C12 would fall). Sensitivity worth running.
- **R8.** C15 runtime reading B (CLI counts as a standard toolchain): AI-DLC 5 and OpenSpec 4 would return. My adjustments are labelled Low confidence for this reason.
- **R9.** Totals were visible to scorers (section 8.1) and all scorers share the designer's model family.
- **R10.** The superiority test's S4 and S5 use reconciled benchmark scores; several of those cells (listed above) carry Low confidence.

## 12. Was the design-only method scored at least as strictly as the benchmarks?

**Yes, with qualifications.** Both design scorers applied the non-credit language rule (hedges, named-only items, evals without thresholds) at least as strictly as the benchmark scorers applied the gate rule; six of the seven design cells at D 4 or 5 (C2, C4, C9, C10, C13, C15) stay at the level given, and the design nowhere exceeds the best benchmark score before adjustment. Two cells were scored more leniently than the benchmark standard (C3 level 4 on named-only safeguards; C8 level 2 by counting the loop bound that the benchmark scorers excluded) and are corrected. Two realization factors were harsher than the rubric (C1 r by taking the other scorer's r; C9 r 0.6 for an incomplete table), also corrected. On the benchmark side the largest leniencies were AI-DLC cells (C1, C7, C15) inflated by the median rule; they are corrected too. After these adjustments I find no remaining systematic tilt toward the design. The remaining exposure is process-level (R9) and structural (the design leans on obsolete prototypes, R1-R2).
